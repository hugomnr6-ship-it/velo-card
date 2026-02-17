-- ═══ Notifications system ═══
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, read, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications (user_id) WHERE read = FALSE;

-- ═══ User feedback ═══
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'suggestion', 'other')),
  message TEXT NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ Feed likes ═══
CREATE TABLE IF NOT EXISTS feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feed_item_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feed_item_id)
);

CREATE INDEX idx_feed_likes_item ON feed_likes (feed_item_id);

-- ═══ Feed comments ═══
CREATE TABLE IF NOT EXISTS feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feed_item_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feed_comments_item ON feed_comments (feed_item_id, created_at ASC);

-- ═══ Email subscribers (landing page) ═══
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
