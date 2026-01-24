-- Waitlist table for landing page signups
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'landing_page',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Optional: track if they've been notified about launch
  notified_at TIMESTAMPTZ,

  -- Optional: track referral source
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);

-- Index for quick email lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Index for created_at for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);

-- RLS policies (allow anonymous inserts but restrict reads to service role)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for waitlist signups)
CREATE POLICY "Allow anonymous waitlist signups" ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- Only allow service role to read (for admin purposes)
CREATE POLICY "Only service role can read waitlist" ON waitlist
  FOR SELECT
  USING (auth.role() = 'service_role');
