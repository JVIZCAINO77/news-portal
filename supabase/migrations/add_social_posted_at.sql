-- Migration: add social_posted_at to articles
-- This column tracks when an article was last manually posted to social media
-- from the admin panel, used to enforce a 2-hour rate-limit on re-posting.

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS social_posted_at timestamptz DEFAULT NULL;

-- Index to quickly find recently-posted articles during rate-limit checks
CREATE INDEX IF NOT EXISTS idx_articles_social_posted_at
  ON articles (social_posted_at)
  WHERE social_posted_at IS NOT NULL;
