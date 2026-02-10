-- PM Jobs table for the job board
-- Synced from GitHub repositories (Jobright.ai curated lists)

CREATE TABLE IF NOT EXISTS pm_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core fields parsed from GitHub README
  company TEXT NOT NULL,
  company_url TEXT,
  job_title TEXT NOT NULL,
  job_url TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Unknown',
  work_model TEXT NOT NULL DEFAULT 'Unknown', -- Remote, On Site, Hybrid
  date_posted TEXT, -- raw date string from GitHub e.g. "Feb 09"
  date_posted_parsed TIMESTAMPTZ, -- parsed into actual timestamp
  
  -- Classification
  role_type TEXT NOT NULL CHECK (role_type IN ('new_grad', 'internship')),
  
  -- Ranking
  is_top_company BOOLEAN NOT NULL DEFAULT false,
  company_rank INTEGER NOT NULL DEFAULT 999, -- lower = more prominent
  
  -- Sync metadata
  source_repo TEXT NOT NULL, -- which GitHub repo this came from
  external_id TEXT, -- jobright ID extracted from URL for dedup
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint to prevent duplicates
  UNIQUE(job_url)
);

-- Indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_pm_jobs_role_type ON pm_jobs(role_type);
CREATE INDEX IF NOT EXISTS idx_pm_jobs_company ON pm_jobs(company);
CREATE INDEX IF NOT EXISTS idx_pm_jobs_work_model ON pm_jobs(work_model);
CREATE INDEX IF NOT EXISTS idx_pm_jobs_is_top_company ON pm_jobs(is_top_company);
CREATE INDEX IF NOT EXISTS idx_pm_jobs_company_rank ON pm_jobs(company_rank);
CREATE INDEX IF NOT EXISTS idx_pm_jobs_date_posted_parsed ON pm_jobs(date_posted_parsed DESC);
CREATE INDEX IF NOT EXISTS idx_pm_jobs_created_at ON pm_jobs(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_pm_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pm_jobs_updated_at ON pm_jobs;
CREATE TRIGGER pm_jobs_updated_at
  BEFORE UPDATE ON pm_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_pm_jobs_updated_at();

-- RLS: Allow anyone to read jobs (public job board)
ALTER TABLE pm_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view PM jobs"
  ON pm_jobs FOR SELECT
  USING (true);

-- Only service role can insert/update/delete (sync API uses service role)
CREATE POLICY "Service role can manage PM jobs"
  ON pm_jobs FOR ALL
  USING (auth.role() = 'service_role');
