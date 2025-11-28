-- Migration: Fix booking status to default to 'pending'
-- This ensures all new bookings require mentor approval

-- Update the status column to have 'pending' as default
ALTER TABLE bookings 
  ALTER COLUMN status SET DEFAULT 'pending';

-- Verify the constraint allows all valid statuses
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));

-- Add comment for clarity
COMMENT ON COLUMN bookings.status IS 'Booking status: pending (awaiting mentor approval), confirmed (approved by mentor), cancelled, completed';
