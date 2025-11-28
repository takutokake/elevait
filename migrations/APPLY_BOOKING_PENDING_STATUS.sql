-- =====================================================
-- MIGRATION: Ensure Bookings Require Mentor Approval
-- =====================================================
-- This migration ensures all new bookings start with 'pending' status
-- and require explicit mentor approval to become 'confirmed'

-- Step 1: Update the bookings table status column default
ALTER TABLE bookings 
  ALTER COLUMN status SET DEFAULT 'pending';

-- Step 2: Ensure status constraint includes all valid statuses
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));

-- Step 3: Update or create the create_booking function
DROP FUNCTION IF EXISTS create_booking(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, VARCHAR, VARCHAR, TEXT, VARCHAR);

CREATE OR REPLACE FUNCTION create_booking(
  p_availability_slot_id UUID,
  p_learner_id UUID,
  p_booking_start_time TIMESTAMPTZ,
  p_booking_end_time TIMESTAMPTZ,
  p_learner_email VARCHAR,
  p_learner_phone VARCHAR DEFAULT NULL,
  p_session_notes TEXT DEFAULT NULL,
  p_timezone VARCHAR DEFAULT 'UTC'
)
RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
  v_mentor_id UUID;
  v_slot_status VARCHAR;
  v_duration INTERVAL;
BEGIN
  -- Get mentor_id and slot status
  SELECT mentor_id, status INTO v_mentor_id, v_slot_status
  FROM availability_slots
  WHERE id = p_availability_slot_id;
  
  IF v_mentor_id IS NULL THEN
    RAISE EXCEPTION 'Availability slot not found';
  END IF;
  
  IF v_slot_status = 'fully_booked' THEN
    RAISE EXCEPTION 'This availability slot is fully booked';
  END IF;
  
  -- Check if booking is in the past
  IF p_booking_start_time <= NOW() THEN
    RAISE EXCEPTION 'Cannot book in the past';
  END IF;
  
  -- Check minimum lead time (24 hours)
  IF p_booking_start_time < NOW() + INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'Bookings must be made at least 24 hours in advance';
  END IF;
  
  -- Validate duration
  v_duration := p_booking_end_time - p_booking_start_time;
  IF EXTRACT(EPOCH FROM v_duration) < 3600 THEN
    RAISE EXCEPTION 'Minimum booking duration is 60 minutes';
  END IF;
  
  IF EXTRACT(EPOCH FROM v_duration)::INTEGER % 1800 != 0 THEN
    RAISE EXCEPTION 'Booking duration must be a multiple of 30 minutes';
  END IF;
  
  -- Insert booking with PENDING status (requires mentor approval)
  INSERT INTO bookings (
    availability_slot_id,
    mentor_id,
    learner_id,
    booking_start_time,
    booking_end_time,
    timezone,
    learner_email,
    learner_phone,
    session_notes,
    status
  ) VALUES (
    p_availability_slot_id,
    v_mentor_id,
    p_learner_id,
    p_booking_start_time,
    p_booking_end_time,
    p_timezone,
    p_learner_email,
    p_learner_phone,
    p_session_notes,
    'pending'  -- IMPORTANT: All bookings start as pending
  ) RETURNING id INTO v_booking_id;
  
  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create or update approve_booking function
DROP FUNCTION IF EXISTS approve_booking(UUID, UUID);

CREATE OR REPLACE FUNCTION approve_booking(
  p_booking_id UUID,
  p_mentor_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_booking RECORD;
  v_result JSON;
BEGIN
  -- Get booking and verify mentor ownership
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id AND mentor_id = p_mentor_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found or you do not have permission'
    );
  END IF;
  
  -- Check if booking is in pending status
  IF v_booking.status != 'pending' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only pending bookings can be approved'
    );
  END IF;
  
  -- Update booking to confirmed
  UPDATE bookings
  SET status = 'confirmed',
      updated_at = NOW()
  WHERE id = p_booking_id;
  
  RETURN json_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'status', 'confirmed'
  );
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create or update decline_booking function
DROP FUNCTION IF EXISTS decline_booking(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION decline_booking(
  p_booking_id UUID,
  p_mentor_id UUID,
  p_decline_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_booking RECORD;
BEGIN
  -- Get booking and verify mentor ownership
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id AND mentor_id = p_mentor_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found or you do not have permission'
    );
  END IF;
  
  -- Check if booking is in pending status
  IF v_booking.status != 'pending' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only pending bookings can be declined'
    );
  END IF;
  
  -- Update booking to cancelled
  UPDATE bookings
  SET status = 'cancelled',
      cancelled_at = NOW(),
      cancelled_by = p_mentor_id,
      cancellation_reason = COALESCE(p_decline_reason, 'Declined by mentor'),
      updated_at = NOW()
  WHERE id = p_booking_id;
  
  RETURN json_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'status', 'cancelled'
  );
END;
$$ LANGUAGE plpgsql;

-- Step 6: Add helpful comments
COMMENT ON COLUMN bookings.status IS 'Booking workflow: pending → confirmed (after mentor approval) → completed. Can be cancelled at any stage.';
COMMENT ON FUNCTION create_booking IS 'Creates a new booking with PENDING status - requires mentor approval via approve_booking()';
COMMENT ON FUNCTION approve_booking IS 'Mentor approves a pending booking, changing status to confirmed';
COMMENT ON FUNCTION decline_booking IS 'Mentor declines a pending booking, changing status to cancelled';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All new bookings will now require mentor approval!
