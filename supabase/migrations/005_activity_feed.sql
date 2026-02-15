-- Activity Feed — social events timeline
CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_created ON activity_feed(created_at DESC);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all feed events
CREATE POLICY "Anyone can read feed" ON activity_feed
  FOR SELECT USING (true);

-- Only server can insert via supabaseAdmin (service role)
