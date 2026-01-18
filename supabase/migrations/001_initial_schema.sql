-- ============================================
-- The Content Engine - Database Schema
-- ============================================
-- Run this in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste & Run
-- ============================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ORGANIZATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORGANIZATION MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- ============================================
-- BRANDS
-- ============================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  voice_config JSONB NOT NULL DEFAULT '{
    "tone": ["professional", "approachable"],
    "vocabulary": {"preferred": [], "avoided": []},
    "examples": {"good": [], "bad": []},
    "platformOverrides": {}
  }'::jsonb,
  visual_config JSONB NOT NULL DEFAULT '{
    "colorPalette": {"primary": "#000000", "secondary": "#ffffff", "accent": "#3b82f6", "background": "#ffffff"},
    "style": "minimalist",
    "moodKeywords": ["modern", "clean"],
    "avoidElements": []
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOCIAL ACCOUNTS
-- ============================================
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'twitter', 'instagram', 'linkedin'
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  late_account_id TEXT, -- Late.dev reference
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, platform, platform_user_id)
);

-- ============================================
-- INPUTS
-- ============================================
CREATE TABLE IF NOT EXISTS inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('text', 'article', 'link', 'document')),
  raw_content TEXT,
  file_url TEXT, -- For document uploads
  parsed_content JSONB, -- Structured extracted content
  summary TEXT,
  key_themes TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'parsed', 'ideated', 'archived')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- IDEAS
-- ============================================
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_id UUID REFERENCES inputs(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  angle TEXT NOT NULL CHECK (angle IN ('educational', 'entertaining', 'inspirational', 'promotional', 'conversational')),
  target_platforms TEXT[] NOT NULL,
  suggested_formats TEXT[],
  key_points TEXT[],
  potential_hooks TEXT[],
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  ai_reasoning TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'generated')),
  user_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTENT
-- ============================================
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  copy_primary TEXT NOT NULL,
  copy_hashtags TEXT[],
  copy_cta TEXT,
  copy_thread_parts TEXT[], -- For Twitter threads
  copy_carousel_slides TEXT[], -- For carousels
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'published', 'failed')),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  late_post_id TEXT, -- Late.dev reference
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- IMAGES
-- ============================================
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  dimensions JSONB, -- { width: number, height: number }
  format TEXT, -- 'png', 'jpg', 'webp'
  is_primary BOOLEAN DEFAULT false,
  platform_crops JSONB, -- Platform-specific versions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANALYTICS
-- ============================================
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB DEFAULT '{}'
);

-- ============================================
-- FEEDBACK EVENTS (for learning)
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  entity_type TEXT NOT NULL, -- 'idea', 'content', 'image'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'approve', 'reject', 'edit', 'regenerate'
  before_state JSONB,
  after_state JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inputs_brand_status ON inputs(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_inputs_created ON inputs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_brand_status ON ideas(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_ideas_input ON ideas(input_id);
CREATE INDEX IF NOT EXISTS idx_ideas_created ON ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_brand_status ON content(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_content_idea ON content(idea_id);
CREATE INDEX IF NOT EXISTS idx_content_scheduled ON content(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_content_created ON content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_content ON images(content_id);
CREATE INDEX IF NOT EXISTS idx_analytics_content ON analytics(content_id, collected_at);
CREATE INDEX IF NOT EXISTS idx_feedback_entity ON feedback_events(entity_type, entity_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inputs_updated_at BEFORE UPDATE ON inputs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON ideas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (Permissive for now - single user)
-- ============================================
-- For now, allow all authenticated users full access
-- We'll tighten this when adding multi-user support

-- Organizations
CREATE POLICY "Allow all for authenticated users" ON organizations
    FOR ALL USING (true) WITH CHECK (true);

-- Organization Members
CREATE POLICY "Allow all for authenticated users" ON organization_members
    FOR ALL USING (true) WITH CHECK (true);

-- Brands
CREATE POLICY "Allow all for authenticated users" ON brands
    FOR ALL USING (true) WITH CHECK (true);

-- Social Accounts
CREATE POLICY "Allow all for authenticated users" ON social_accounts
    FOR ALL USING (true) WITH CHECK (true);

-- Inputs
CREATE POLICY "Allow all for authenticated users" ON inputs
    FOR ALL USING (true) WITH CHECK (true);

-- Ideas
CREATE POLICY "Allow all for authenticated users" ON ideas
    FOR ALL USING (true) WITH CHECK (true);

-- Content
CREATE POLICY "Allow all for authenticated users" ON content
    FOR ALL USING (true) WITH CHECK (true);

-- Images
CREATE POLICY "Allow all for authenticated users" ON images
    FOR ALL USING (true) WITH CHECK (true);

-- Analytics
CREATE POLICY "Allow all for authenticated users" ON analytics
    FOR ALL USING (true) WITH CHECK (true);

-- Feedback Events
CREATE POLICY "Allow all for authenticated users" ON feedback_events
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SEED DATA: Create default organization and brand
-- ============================================
DO $$
DECLARE
    org_id UUID;
    brand_id UUID;
BEGIN
    -- Create default organization
    INSERT INTO organizations (name, slug)
    VALUES ('My Organization', 'my-org')
    RETURNING id INTO org_id;

    -- Create default brand
    INSERT INTO brands (organization_id, name, description, voice_config, visual_config)
    VALUES (
        org_id,
        'My Brand',
        'Default brand for content creation',
        '{
            "tone": ["professional", "approachable", "witty"],
            "vocabulary": {
                "preferred": [],
                "avoided": []
            },
            "examples": {
                "good": [],
                "bad": []
            },
            "platformOverrides": {}
        }'::jsonb,
        '{
            "colorPalette": {
                "primary": "#1a1a1a",
                "secondary": "#f5f5f5",
                "accent": "#3b82f6",
                "background": "#ffffff"
            },
            "style": "minimalist",
            "moodKeywords": ["modern", "clean", "professional"],
            "avoidElements": ["clipart", "stock photo feel"]
        }'::jsonb
    )
    RETURNING id INTO brand_id;

    RAISE NOTICE 'Created organization: % and brand: %', org_id, brand_id;
END $$;

-- ============================================
-- STORAGE BUCKET FOR UPLOADS
-- ============================================
-- Run this separately in Supabase Dashboard > Storage
-- Or use the Supabase client to create it programmatically
--
-- Bucket name: content-uploads
-- Public: false
-- Allowed MIME types: application/pdf, application/msword,
--   application/vnd.openxmlformats-officedocument.wordprocessingml.document,
--   text/plain, text/markdown, image/png, image/jpeg, image/webp

-- ============================================
-- DONE!
-- ============================================
-- After running this, go to your Supabase dashboard:
-- 1. Copy your Project URL and anon key
-- 2. Add them to your .env.local file
-- 3. Start the dev server: npm run dev
