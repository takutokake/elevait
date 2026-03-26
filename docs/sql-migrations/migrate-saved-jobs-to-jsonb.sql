-- Migration: Convert saved_jobs from multiple rows to single row per user with JSONB array
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing table and policies (if they exist)
DROP TABLE IF EXISTS saved_jobs CASCADE;

-- Step 2: Create new optimized table structure
CREATE TABLE saved_jobs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  job_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create GIN index for JSONB array operations
CREATE INDEX idx_saved_jobs_job_ids ON saved_jobs USING GIN (job_ids);

-- Step 4: Enable Row Level Security
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
CREATE POLICY "Users can view own saved jobs"
  ON saved_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved jobs"
  ON saved_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved jobs"
  ON saved_jobs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved jobs"
  ON saved_jobs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Step 6: Add comments
COMMENT ON TABLE saved_jobs IS 'Stores user saved job listings - one row per user with JSONB array';
COMMENT ON COLUMN saved_jobs.user_id IS 'References the authenticated user (primary key)';
COMMENT ON COLUMN saved_jobs.job_ids IS 'JSONB array of saved job IDs';
COMMENT ON COLUMN saved_jobs.updated_at IS 'Last time the saved jobs were modified';

-- Migration complete!
-- The table is now optimized to store one row per user with all saved job IDs in a JSONB array.
