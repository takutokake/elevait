-- =====================================================
-- IMPROVED BOOKING SYSTEM MIGRATION V2
-- =====================================================
-- This migration improves the booking system with:
-- - Continuous availability ranges (not 30-min slots)
-- - Sub-slot bookings within parent ranges
-- - Better overlap prevention
-- - Partial booking support
-- =====================================================

-- Drop existing functions first (to avoid conflicts)
DROP FUNCTION IF EXISTS create_booking CASCADE;
DROP FUNCTION IF EXISTS get_mentor_available_slots CASCADE;
DROP FUNCTION IF EXISTS sync_slot_status_on_booking CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS get_available_subslots CASCADE;
DROP FUNCTION IF EXISTS update_availability_status CASCADE;
DROP FUNCTION IF EXISTS validate_booking_within_availability CASCADE;

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS availability_slots CASCADE;

-- =====================================================
-- 1. AVAILABILITY SLOTS (Continuous Ranges)
-- =====================================================

CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partially_booked', 'fully_booked', 'blocked')),
  capacity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure start < end
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  
  -- Prevent overlapping availability for same mentor
  EXCLUDE USING GIST (
    mentor_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
);

-- Indexes for performance
CREATE INDEX idx_availability_mentor_time ON availability_slots(mentor_id, start_time);
CREATE INDEX idx_availability_status ON availability_slots(status);
CREATE INDEX idx_availability_time_range ON availability_slots USING GIST (tstzrange(start_time, end_time));

-- =====================================================
-- 2. BOOKINGS (Sub-Slots within Availability)
-- =====================================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  availability_slot_id UUID NOT NULL REFERENCES availability_slots(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Booking time range (sub-slot within parent availability)
  booking_start_time TIMESTAMPTZ NOT NULL,
  booking_end_time TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
  
  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  
  -- Learner information
  learner_email VARCHAR(255) NOT NULL,
  learner_phone VARCHAR(50),
  session_notes TEXT,
  
  -- Cancellation tracking
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,
  
  -- Completion tracking
  completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure booking times are valid
  CONSTRAINT valid_booking_time_range CHECK (booking_start_time < booking_end_time),
  
  -- Ensure minimum 60-minute duration
  CONSTRAINT minimum_duration CHECK (
    EXTRACT(EPOCH FROM (booking_end_time - booking_start_time)) >= 3600
  ),
  
  -- Ensure 30-minute alignment (times end in :00 or :30)
  CONSTRAINT thirty_minute_alignment CHECK (
    EXTRACT(MINUTE FROM booking_start_time)::INTEGER % 30 = 0 AND
    EXTRACT(SECOND FROM booking_start_time) = 0 AND
    EXTRACT(MINUTE FROM booking_end_time)::INTEGER % 30 = 0 AND
    EXTRACT(SECOND FROM booking_end_time) = 0
  ),
  
  -- Prevent overlapping bookings within same availability slot
  -- Only active bookings (pending, confirmed) count
  EXCLUDE USING GIST (
    availability_slot_id WITH =,
    tstzrange(booking_start_time, booking_end_time) WITH &&
  ) WHERE (status IN ('pending', 'confirmed'))
);

-- Indexes for performance
CREATE INDEX idx_bookings_mentor ON bookings(mentor_id, booking_start_time);
CREATE INDEX idx_bookings_learner ON bookings(learner_id, booking_start_time);
CREATE INDEX idx_bookings_slot ON bookings(availability_slot_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_time_range ON bookings USING GIST (tstzrange(booking_start_time, booking_end_time));

-- =====================================================
-- 3. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_availability_slots_updated_at
  BEFORE UPDATE ON availability_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update availability slot status based on bookings
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
  
  -- Calculate total booked duration for active bookings
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

-- Validate booking fits within availability slot
CREATE OR REPLACE FUNCTION validate_booking_within_availability()
RETURNS TRIGGER AS $$
DECLARE
  slot_start TIMESTAMPTZ;
  slot_end TIMESTAMPTZ;
BEGIN
  -- Get the availability slot time range
  SELECT start_time, end_time INTO slot_start, slot_end
  FROM availability_slots
  WHERE id = NEW.availability_slot_id;
  
  -- Ensure booking is fully within availability slot
  IF NEW.booking_start_time < slot_start OR NEW.booking_end_time > slot_end THEN
    RAISE EXCEPTION 'Booking must be fully within the availability slot time range';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_booking_within_availability_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_within_availability();

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

-- Get available 30-minute sub-slots for a given availability range
CREATE OR REPLACE FUNCTION get_available_subslots(
  p_availability_slot_id UUID,
  p_timezone VARCHAR DEFAULT 'UTC'
)
RETURNS TABLE (
  slot_start TIMESTAMPTZ,
  slot_end TIMESTAMPTZ,
  is_available BOOLEAN
) AS $$
DECLARE
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_current TIMESTAMPTZ;
BEGIN
  -- Get availability range
  SELECT start_time, end_time INTO v_start, v_end
  FROM availability_slots
  WHERE id = p_availability_slot_id;
  
  -- Generate 30-minute slots
  v_current := v_start;
  WHILE v_current < v_end LOOP
    RETURN QUERY
    SELECT 
      v_current,
      v_current + INTERVAL '30 minutes',
      NOT EXISTS (
        SELECT 1 FROM bookings
        WHERE availability_slot_id = p_availability_slot_id
          AND status IN ('pending', 'confirmed')
          AND tstzrange(booking_start_time, booking_end_time) && 
              tstzrange(v_current, v_current + INTERVAL '30 minutes')
      );
    
    v_current := v_current + INTERVAL '30 minutes';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create booking with validation
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
  
  -- Insert booking (constraints will validate overlap and range)
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
    'pending'
  ) RETURNING id INTO v_booking_id;
  
  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Availability Slots Policies

-- Public can view open/partially_booked slots
CREATE POLICY "Public can view available slots"
  ON availability_slots FOR SELECT
  USING (status IN ('open', 'partially_booked'));

-- Mentors can view their own slots
CREATE POLICY "Mentors can view own slots"
  ON availability_slots FOR SELECT
  USING (mentor_id = auth.uid());

-- Mentors can create their own slots
CREATE POLICY "Mentors can create slots"
  ON availability_slots FOR INSERT
  WITH CHECK (mentor_id = auth.uid());

-- Mentors can update their own slots (but not if fully booked)
CREATE POLICY "Mentors can update own slots"
  ON availability_slots FOR UPDATE
  USING (mentor_id = auth.uid() AND status != 'fully_booked')
  WITH CHECK (mentor_id = auth.uid());

-- Mentors can delete their own slots (but not if booked)
CREATE POLICY "Mentors can delete own unbooked slots"
  ON availability_slots FOR DELETE
  USING (mentor_id = auth.uid() AND status = 'open');

-- Bookings Policies

-- Learners can view their own bookings
CREATE POLICY "Learners can view own bookings"
  ON bookings FOR SELECT
  USING (learner_id = auth.uid());

-- Mentors can view bookings for their slots
CREATE POLICY "Mentors can view their bookings"
  ON bookings FOR SELECT
  USING (mentor_id = auth.uid());

-- Authenticated users can create bookings
CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Learners can update their own bookings (cancel)
CREATE POLICY "Learners can update own bookings"
  ON bookings FOR UPDATE
  USING (learner_id = auth.uid())
  WITH CHECK (learner_id = auth.uid());

-- Mentors can update bookings for their slots (complete, cancel)
CREATE POLICY "Mentors can update their bookings"
  ON bookings FOR UPDATE
  USING (mentor_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid());

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE availability_slots IS 'Stores mentor availability as continuous time ranges, not discrete 30-min slots';
COMMENT ON TABLE bookings IS 'Stores bookings as sub-slots within parent availability ranges';
COMMENT ON COLUMN availability_slots.status IS 'open = no bookings, partially_booked = some bookings, fully_booked = completely booked';
COMMENT ON FUNCTION get_available_subslots IS 'Computes available 30-minute sub-slots from a parent availability range';
COMMENT ON FUNCTION create_booking IS 'Creates a booking with full validation (duration, overlap, lead time)';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
