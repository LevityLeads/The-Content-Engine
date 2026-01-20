-- ============================================
-- GENERATION JOBS
-- Tracks image generation progress and errors
-- ============================================
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'single', 'carousel', 'composite'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
  progress INTEGER DEFAULT 0, -- 0-100 percentage
  total_items INTEGER DEFAULT 1, -- total slides/images to generate
  completed_items INTEGER DEFAULT 0, -- slides/images completed
  current_step TEXT, -- 'background', 'slide-1', 'slide-2', etc.
  error_message TEXT, -- user-friendly error message
  error_code TEXT, -- error code like '503', 'RATE_LIMIT', etc.
  error_details JSONB, -- full error details for debugging
  metadata JSONB, -- any additional info (model used, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups by content
CREATE INDEX IF NOT EXISTS idx_generation_jobs_content ON generation_jobs(content_id);

-- Index for finding active jobs
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status) WHERE status IN ('pending', 'generating');

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_generation_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_generation_jobs_updated_at ON generation_jobs;
CREATE TRIGGER trigger_generation_jobs_updated_at
  BEFORE UPDATE ON generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_generation_jobs_updated_at();
