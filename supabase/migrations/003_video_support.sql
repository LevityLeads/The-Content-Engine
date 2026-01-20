-- ============================================
-- VIDEO SUPPORT MIGRATION
-- Adds video generation capabilities with cost tracking
-- ============================================

-- Add video-specific columns to images table
-- (We keep the table name 'images' for backwards compatibility but it now supports both)
ALTER TABLE images
  ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS has_audio BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS generation_model TEXT,
  ADD COLUMN IF NOT EXISTS generation_cost NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS slide_number INTEGER;

-- Index for filtering by media type
CREATE INDEX IF NOT EXISTS idx_images_media_type ON images(media_type);

-- Video usage tracking table (for cost management)
CREATE TABLE IF NOT EXISTS video_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE SET NULL,
  image_id UUID REFERENCES images(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  duration_seconds NUMERIC(5,2) NOT NULL,
  has_audio BOOLEAN DEFAULT false,
  cost_usd NUMERIC(8,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for usage queries
CREATE INDEX IF NOT EXISTS idx_video_usage_brand ON video_usage(brand_id, created_at);
CREATE INDEX IF NOT EXISTS idx_video_usage_brand_month ON video_usage(brand_id, date_trunc('month', created_at));

-- Add video_config to brands table
ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS video_config JSONB DEFAULT '{
    "enabled": false,
    "monthly_budget_usd": 50,
    "default_model": "veo-3.1-fast",
    "default_duration": 5,
    "max_duration": 8,
    "include_audio": false,
    "daily_limit": 10
  }'::jsonb;

-- Update generation_jobs to support 'video' type
-- First drop the existing constraint if it exists, then add new one
DO $$
BEGIN
  -- Try to drop the old constraint
  ALTER TABLE generation_jobs DROP CONSTRAINT IF EXISTS generation_jobs_type_check;
EXCEPTION
  WHEN undefined_object THEN
    -- Constraint doesn't exist, that's fine
    NULL;
END $$;

-- Add new constraint allowing 'video' type
ALTER TABLE generation_jobs
  ADD CONSTRAINT generation_jobs_type_check
  CHECK (type IN ('single', 'carousel', 'composite', 'video', 'mixed-carousel'));

-- Comment for documentation
COMMENT ON COLUMN images.media_type IS 'Type of media: image or video';
COMMENT ON COLUMN images.duration_seconds IS 'Duration in seconds (for videos only)';
COMMENT ON COLUMN images.has_audio IS 'Whether video includes generated audio';
COMMENT ON COLUMN images.generation_cost IS 'Actual cost in USD for this generation';
COMMENT ON COLUMN images.slide_number IS 'Slide number for carousel items (1-indexed)';
COMMENT ON TABLE video_usage IS 'Tracks video generation usage and costs per brand';
COMMENT ON COLUMN brands.video_config IS 'Video generation configuration including budget limits';
