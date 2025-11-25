-- =====================================================
-- BOOKING SYSTEM ENHANCEMENTS
-- =====================================================
-- This migration adds:
-- 1. Post-session survey fields
-- 2. Mentor approval workflow
-- 3. 80% earnings calculation
-- =====================================================

-- Add post-session survey fields to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS session_rating INTEGER CHECK (session_rating >= 1 AND session_rating <= 5),
ADD COLUMN IF NOT EXISTS mentor_attended BOOLEAN,
ADD COLUMN IF NOT EXISTS session_topics_covered TEXT,
ADD COLUMN IF NOT EXISTS mentor_additional_notes TEXT,
ADD COLUMN IF NOT EXISTS survey_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS mentor_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS mentor_declined_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- Add comment for clarity
COMMENT ON COLUMN bookings.session_rating IS 'Mentor rating of session quality (1-5 stars)';
COMMENT ON COLUMN bookings.mentor_attended IS 'Did the mentor attend the session';
COMMENT ON COLUMN bookings.session_topics_covered IS 'Topics covered during the session';
COMMENT ON COLUMN bookings.mentor_additional_notes IS 'Additional notes from mentor post-session';
COMMENT ON COLUMN bookings.survey_completed_at IS 'When mentor completed post-session survey';
COMMENT ON COLUMN bookings.mentor_approved_at IS 'When mentor approved the booking';
COMMENT ON COLUMN bookings.mentor_declined_at IS 'When mentor declined the booking';
COMMENT ON COLUMN bookings.decline_reason IS 'Reason for declining the booking';

-- Update status check constraint to ensure proper flow
-- Status flow: pending -> confirmed (after mentor approval) -> completed (after survey)
-- Or: pending -> cancelled (if mentor declines)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));

-- Create function to approve booking
CREATE OR REPLACE FUNCTION approve_booking(
  p_booking_id UUID,
  p_mentor_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_booking bookings;
  v_result JSON;
BEGIN
  -- Get and lock the booking
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
    AND mentor_id = p_mentor_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found or already processed'
    );
  END IF;

  -- Update booking to confirmed
  UPDATE bookings
  SET 
    status = 'confirmed',
    mentor_approved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_booking_id;

  RETURN json_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'status', 'confirmed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decline booking
CREATE OR REPLACE FUNCTION decline_booking(
  p_booking_id UUID,
  p_mentor_id UUID,
  p_decline_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_booking bookings;
  v_result JSON;
BEGIN
  -- Get and lock the booking
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
    AND mentor_id = p_mentor_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found or already processed'
    );
  END IF;

  -- Update booking to cancelled
  UPDATE bookings
  SET 
    status = 'cancelled',
    mentor_declined_at = NOW(),
    decline_reason = p_decline_reason,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to submit post-session survey
CREATE OR REPLACE FUNCTION submit_session_survey(
  p_booking_id UUID,
  p_mentor_id UUID,
  p_session_rating INTEGER,
  p_mentor_attended BOOLEAN,
  p_session_topics_covered TEXT,
  p_mentor_additional_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_booking bookings;
  v_result JSON;
BEGIN
  -- Validate rating
  IF p_session_rating < 1 OR p_session_rating > 5 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Rating must be between 1 and 5'
    );
  END IF;

  -- Get and lock the booking
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
    AND mentor_id = p_mentor_id
    AND status = 'confirmed'
    AND booking_end_time < NOW() -- Session must be over
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found, not confirmed, or session not yet ended'
    );
  END IF;

  -- Update booking with survey data and mark as completed
  UPDATE bookings
  SET 
    status = 'completed',
    session_rating = p_session_rating,
    mentor_attended = p_mentor_attended,
    session_topics_covered = p_session_topics_covered,
    mentor_additional_notes = p_mentor_additional_notes,
    survey_completed_at = NOW(),
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_booking_id;

  RETURN json_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'status', 'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate mentor earnings (80% of booking price)
CREATE OR REPLACE FUNCTION calculate_mentor_earnings(
  p_mentor_id UUID,
  p_from_date TIMESTAMPTZ DEFAULT NULL,
  p_to_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_hourly_rate NUMERIC;
  v_total_minutes INTEGER;
  v_total_earnings NUMERIC;
  v_mentor_earnings NUMERIC;
  v_completed_sessions INTEGER;
BEGIN
  -- Get mentor's hourly rate
  SELECT price_per_hour INTO v_hourly_rate
  FROM mentors
  WHERE id = p_mentor_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Mentor not found'
    );
  END IF;

  -- Calculate total minutes from completed sessions with survey
  SELECT 
    COUNT(*),
    COALESCE(SUM(EXTRACT(EPOCH FROM (booking_end_time - booking_start_time)) / 60), 0)
  INTO v_completed_sessions, v_total_minutes
  FROM bookings
  WHERE mentor_id = p_mentor_id
    AND status = 'completed'
    AND survey_completed_at IS NOT NULL
    AND (p_from_date IS NULL OR booking_start_time >= p_from_date)
    AND (p_to_date IS NULL OR booking_end_time <= p_to_date);

  -- Calculate earnings
  v_total_earnings := (v_total_minutes / 60.0) * v_hourly_rate;
  v_mentor_earnings := v_total_earnings * 0.80; -- Mentor gets 80%

  RETURN json_build_object(
    'success', true,
    'mentor_id', p_mentor_id,
    'completed_sessions', v_completed_sessions,
    'total_minutes', v_total_minutes,
    'total_hours', ROUND((v_total_minutes / 60.0)::NUMERIC, 2),
    'hourly_rate', v_hourly_rate,
    'total_earnings', ROUND(v_total_earnings::NUMERIC, 2),
    'mentor_earnings', ROUND(v_mentor_earnings::NUMERIC, 2),
    'platform_fee', ROUND((v_total_earnings * 0.20)::NUMERIC, 2)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the availability status trigger to only count confirmed bookings
-- (pending bookings should still reserve the slot until declined)
DROP TRIGGER IF EXISTS update_availability_status_on_booking_change ON bookings;

CREATE OR REPLACE FUNCTION update_availability_status()
RETURNS TRIGGER AS $$
DECLARE
  slot_start TIMESTAMPTZ;
  slot_end TIMESTAMPTZ;
  total_duration INTERVAL;
  booked_duration INTERVAL;
BEGIN
  -- Get the availability slot details
  SELECT start_time, end_time INTO slot_start, slot_end
  FROM availability_slots
  WHERE id = COALESCE(NEW.availability_slot_id, OLD.availability_slot_id);
  
  -- Calculate total slot duration
  total_duration := slot_end - slot_start;
  
  -- Calculate total booked duration for active bookings (pending OR confirmed)
  SELECT COALESCE(SUM(booking_end_time - booking_start_time), INTERVAL '0') INTO booked_duration
  FROM bookings
  WHERE availability_slot_id = COALESCE(NEW.availability_slot_id, OLD.availability_slot_id)
    AND status IN ('pending', 'confirmed');
  
  -- Update availability status
  IF booked_duration = INTERVAL '0' THEN
    UPDATE availability_slots SET status = 'open'
    WHERE id = COALESCE(NEW.availability_slot_id, OLD.availability_slot_id);
  ELSIF booked_duration >= total_duration THEN
    UPDATE availability_slots SET status = 'fully_booked'
    WHERE id = COALESCE(NEW.availability_slot_id, OLD.availability_slot_id);
  ELSE
    UPDATE availability_slots SET status = 'partially_booked'
    WHERE id = COALESCE(NEW.availability_slot_id, OLD.availability_slot_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_availability_status_on_booking_change
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_availability_status();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_booking TO authenticated;
GRANT EXECUTE ON FUNCTION decline_booking TO authenticated;
GRANT EXECUTE ON FUNCTION submit_session_survey TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_mentor_earnings TO authenticated;

-- Add RLS policies for new fields
-- (Assuming RLS is already enabled on bookings table)

-- Policy: Mentors can update their own bookings for approval/decline
CREATE POLICY "Mentors can approve/decline their bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (mentor_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid());

-- Policy: Mentors can submit surveys for their completed bookings
CREATE POLICY "Mentors can submit post-session surveys"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    mentor_id = auth.uid() 
    AND status = 'confirmed' 
    AND booking_end_time < NOW()
  )
  WITH CHECK (
    mentor_id = auth.uid() 
    AND status IN ('confirmed', 'completed')
  );
