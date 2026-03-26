-- Create saved_jobs table for storing user's saved job listings
-- Optimized: One row per user with JSONB array of job IDs (saves space)

CREATE TABLE IF NOT EXISTS saved_jobs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  job_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by user (primary key already indexed)
-- GIN index for JSONB array operations
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_ids ON saved_jobs USING GIN (job_ids);

-- Enable Row Level Security
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own saved jobs
CREATE POLICY "Users can view own saved jobs"
  ON saved_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved jobs row
CREATE POLICY "Users can insert own saved jobs"
  ON saved_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own saved jobs
CREATE POLICY "Users can update own saved jobs"
  ON saved_jobs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own saved jobs row
CREATE POLICY "Users can delete own saved jobs"
  ON saved_jobs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE saved_jobs IS 'Stores user saved job listings - one row per user with JSONB array';
COMMENT ON COLUMN saved_jobs.user_id IS 'References the authenticated user (primary key)';
COMMENT ON COLUMN saved_jobs.job_ids IS 'JSONB array of saved job IDs';
COMMENT ON COLUMN saved_jobs.updated_at IS 'Last time the saved jobs were modified';
