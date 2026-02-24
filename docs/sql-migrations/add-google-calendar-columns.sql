-- Migration: Add Google Calendar columns to bookings table
-- Run this in your Supabase SQL editor

-- Add google_calendar_event_id column to store the Google Calendar event ID
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- Add google_meet_link column to store the Google Meet link
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS google_meet_link TEXT;

-- Add index for faster lookups by calendar event ID (optional but recommended)
CREATE INDEX IF NOT EXISTS bookings_google_calendar_event_id_idx 
ON public.bookings(google_calendar_event_id) 
WHERE google_calendar_event_id IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.bookings.google_calendar_event_id IS 'Google Calendar event ID for this booking';
COMMENT ON COLUMN public.bookings.google_meet_link IS 'Google Meet link for this booking session';
