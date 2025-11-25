-- =====================================================
-- BOOKING AND AVAILABILITY SYSTEM MIGRATION
-- =====================================================
-- This migration creates the complete booking and availability system
-- with proper constraints, indexes, triggers, and RLS policies.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =====================================================
-- 1. AVAILABILITY SLOTS TABLE
-- =====================================================

-- Drop existing table if it exists (for clean migration)
DROP TABLE IF EXISTS availability_slots CASCADE;

CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Time fields (stored in UTC)
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Timezone string for display purposes (e.g., 'America/New_York')
  timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
  
  -- Status: 'open', 'blocked', 'booked'
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  
  -- Capacity (default 1 for 1-on-1 sessions)
  capacity INTEGER NOT NULL DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  CONSTRAINT valid_capacity CHECK (capacity > 0),
  CONSTRAINT valid_status CHECK (status IN ('open', 'blocked', 'booked'))
);

-- Prevent overlapping slots for the same mentor using exclusion constraint
ALTER TABLE availability_slots 
  ADD CONSTRAINT prevent_mentor_slot_overlap 
  EXCLUDE USING gist (
    mentor_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  );

-- Indexes for performance
CREATE INDEX idx_availability_mentor_start ON availability_slots(mentor_id, start_time);
CREATE INDEX idx_availability_status ON availability_slots(status) WHERE status = 'open';
CREATE INDEX idx_availability_tstzrange ON availability_slots USING gist(tstzrange(start_time, end_time));
CREATE INDEX idx_availability_mentor_created ON availability_slots(mentor_id, created_at DESC);

-- =====================================================
-- 2. BOOKINGS TABLE
-- =====================================================

DROP TABLE IF EXISTS bookings CASCADE;

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign keys
  availability_slot_id UUID NOT NULL REFERENCES availability_slots(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Custom booking times (subset of availability slot)
  booking_start_time TIMESTAMPTZ NOT NULL,
  booking_end_time TIMESTAMPTZ NOT NULL,
  
  -- Booking status: 'pending', 'confirmed', 'cancelled', 'completed'
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  
  -- Payment status: 'pending', 'paid', 'refunded', 'failed'
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  
  -- Contact and session details
  learner_email VARCHAR(255),
  learner_phone VARCHAR(50),
  session_notes TEXT,
  
  -- Cancellation metadata
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_booking_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  CONSTRAINT valid_booking_time_range CHECK (booking_start_time < booking_end_time)
);

-- Prevent overlapping bookings within the same slot
ALTER TABLE bookings ADD CONSTRAINT prevent_booking_overlap
  EXCLUDE USING gist (
    availability_slot_id WITH =,
    tstzrange(booking_start_time, booking_end_time) WITH &&
  )
  WHERE (status IN ('pending', 'confirmed'));

-- Indexes for performance
CREATE INDEX idx_booking_mentor_created ON bookings(mentor_id, created_at DESC);
CREATE INDEX idx_booking_learner_created ON bookings(learner_id, created_at DESC);
CREATE INDEX idx_booking_status ON bookings(status);
CREATE INDEX idx_booking_slot_id ON bookings(availability_slot_id);
CREATE INDEX idx_booking_times ON bookings USING gist(tstzrange(booking_start_time, booking_end_time));
CREATE INDEX idx_booking_payment_status ON bookings(payment_status);

-- =====================================================
-- 3. TRIGGERS
-- =====================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to both tables
CREATE TRIGGER update_availability_slots_updated_at
  BEFORE UPDATE ON availability_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger function to sync slot status with booking status
CREATE OR REPLACE FUNCTION sync_slot_status_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT or UPDATE of booking
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- If booking is pending or confirmed, mark slot as booked
    IF NEW.status IN ('pending', 'confirmed') THEN
      UPDATE availability_slots
      SET status = 'booked'
      WHERE id = NEW.availability_slot_id;
    -- If booking is cancelled or completed, check if we should free the slot
    ELSIF NEW.status IN ('cancelled', 'completed') THEN
      -- Only set to open if no other active bookings exist for this slot
      UPDATE availability_slots
      SET status = 'open'
      WHERE id = NEW.availability_slot_id
        AND NOT EXISTS (
          SELECT 1 FROM bookings
          WHERE availability_slot_id = NEW.availability_slot_id
            AND status IN ('pending', 'confirmed')
            AND id != NEW.id
        );
    END IF;
    RETURN NEW;
  END IF;
  
  -- On DELETE of booking
  IF (TG_OP = 'DELETE') THEN
    -- Free the slot if no other active bookings exist
    UPDATE availability_slots
    SET status = 'open'
    WHERE id = OLD.availability_slot_id
      AND NOT EXISTS (
        SELECT 1 FROM bookings
        WHERE availability_slot_id = OLD.availability_slot_id
          AND status IN ('pending', 'confirmed')
      );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply booking status trigger
CREATE TRIGGER sync_slot_status_on_booking_change
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_slot_status_on_booking();

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- AVAILABILITY SLOTS POLICIES
-- =====================================================

-- Public: Read open slots (for browsing coach availability)
CREATE POLICY "Public can view open availability slots"
  ON availability_slots
  FOR SELECT
  USING (status = 'open');

-- Mentors: Read their own slots
CREATE POLICY "Mentors can view their own slots"
  ON availability_slots
  FOR SELECT
  USING (
    mentor_id = auth.uid()
  );

-- Mentors: Create their own slots
CREATE POLICY "Mentors can create their own slots"
  ON availability_slots
  FOR INSERT
  WITH CHECK (
    mentor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'mentor'
    )
  );

-- Mentors: Update their own slots (only if not booked)
CREATE POLICY "Mentors can update their own unbooked slots"
  ON availability_slots
  FOR UPDATE
  USING (
    mentor_id = auth.uid()
    AND status != 'booked'
  )
  WITH CHECK (
    mentor_id = auth.uid()
    AND status != 'booked'
  );

-- Mentors: Delete their own slots (only if not booked)
CREATE POLICY "Mentors can delete their own unbooked slots"
  ON availability_slots
  FOR DELETE
  USING (
    mentor_id = auth.uid()
    AND status != 'booked'
  );

-- Admins: Full access to all slots
CREATE POLICY "Admins have full access to availability slots"
  ON availability_slots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- BOOKINGS POLICIES
-- =====================================================

-- Learners: Read their own bookings
CREATE POLICY "Learners can view their own bookings"
  ON bookings
  FOR SELECT
  USING (learner_id = auth.uid());

-- Mentors: Read bookings for their slots
CREATE POLICY "Mentors can view bookings for their slots"
  ON bookings
  FOR SELECT
  USING (mentor_id = auth.uid());

-- Authenticated users: Create bookings (as learner)
CREATE POLICY "Authenticated users can create bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (
    learner_id = auth.uid()
    AND auth.uid() IS NOT NULL
  );

-- Learners: Update their own bookings (limited fields)
CREATE POLICY "Learners can update their own bookings"
  ON bookings
  FOR UPDATE
  USING (learner_id = auth.uid())
  WITH CHECK (learner_id = auth.uid());

-- Mentors: Update bookings for their slots
CREATE POLICY "Mentors can update bookings for their slots"
  ON bookings
  FOR UPDATE
  USING (mentor_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid());

-- Admins: Delete any booking
CREATE POLICY "Admins can delete any booking"
  ON bookings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to get available slots for a mentor within a date range
CREATE OR REPLACE FUNCTION get_mentor_available_slots(
  p_mentor_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  id UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  timezone VARCHAR,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.start_time,
    a.end_time,
    a.timezone,
    a.status
  FROM availability_slots a
  WHERE a.mentor_id = p_mentor_id
    AND a.status = 'open'
    AND a.start_time >= p_start_date
    AND a.start_time < p_end_date
    AND a.start_time > NOW() -- Only future slots
  ORDER BY a.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old versions of create_booking function if they exist
DROP FUNCTION IF EXISTS create_booking(UUID, UUID, VARCHAR, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS create_booking(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, VARCHAR, VARCHAR, TEXT);

-- Function to create a booking (with transaction safety and custom times)
CREATE OR REPLACE FUNCTION create_booking(
  p_slot_id UUID,
  p_learner_id UUID,
  p_booking_start_time TIMESTAMPTZ,
  p_booking_end_time TIMESTAMPTZ,
  p_learner_email VARCHAR,
  p_learner_phone VARCHAR,
  p_session_notes TEXT
)
RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
  v_mentor_id UUID;
  v_slot_status VARCHAR;
  v_slot_start TIMESTAMPTZ;
  v_slot_end TIMESTAMPTZ;
BEGIN
  -- Check if slot exists and is available
  SELECT mentor_id, status, start_time, end_time 
  INTO v_mentor_id, v_slot_status, v_slot_start, v_slot_end
  FROM availability_slots
  WHERE id = p_slot_id
  FOR UPDATE; -- Lock the row
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Availability slot not found';
  END IF;
  
  IF v_slot_status != 'open' THEN
    RAISE EXCEPTION 'Availability slot is not available';
  END IF;
  
  -- Validate booking times are within slot boundaries
  IF p_booking_start_time < v_slot_start OR p_booking_end_time > v_slot_end THEN
    RAISE EXCEPTION 'Booking times must be within the availability slot range';
  END IF;
  
  -- Validate booking duration (minimum 1 hour)
  IF EXTRACT(EPOCH FROM (p_booking_end_time - p_booking_start_time)) < 3600 THEN
    RAISE EXCEPTION 'Booking must be at least 1 hour';
  END IF;
  
  -- Check for overlapping bookings in this slot
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE availability_slot_id = p_slot_id
      AND status IN ('pending', 'confirmed')
      AND tstzrange(booking_start_time, booking_end_time) && tstzrange(p_booking_start_time, p_booking_end_time)
  ) THEN
    RAISE EXCEPTION 'This time slot overlaps with an existing booking';
  END IF;
  
  -- Create the booking
  INSERT INTO bookings (
    availability_slot_id,
    mentor_id,
    learner_id,
    booking_start_time,
    booking_end_time,
    learner_email,
    learner_phone,
    session_notes,
    status
  ) VALUES (
    p_slot_id,
    v_mentor_id,
    p_learner_id,
    p_booking_start_time,
    p_booking_end_time,
    p_learner_email,
    p_learner_phone,
    p_session_notes,
    'pending'
  )
  RETURNING id INTO v_booking_id;
  
  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE availability_slots IS 'Stores mentor availability time slots with timezone support and overlap prevention';
COMMENT ON TABLE bookings IS 'Stores booking records with status tracking and cancellation metadata';
COMMENT ON CONSTRAINT prevent_mentor_slot_overlap ON availability_slots IS 'Prevents overlapping availability slots for the same mentor';
COMMENT ON FUNCTION sync_slot_status_on_booking IS 'Automatically updates slot status based on booking status changes';
COMMENT ON FUNCTION create_booking IS 'Safely creates a booking with transaction locking to prevent race conditions';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
