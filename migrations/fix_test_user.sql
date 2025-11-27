-- Fix the test user account that got into a bad state
-- Run this in Supabase SQL Editor

-- User ID: e33734d0-3f33-419f-9432-16354c9b0700

-- Option 1: Delete everything and start fresh (RECOMMENDED)
DELETE FROM auth.users WHERE id = 'e33734d0-3f33-419f-9432-16354c9b0700';
-- This will cascade delete the profile, student, and mentor records

-- After running this, sign up again with a fresh account
