-- Run this SQL in your Supabase SQL Editor to create the browser automation task queue table:

CREATE TABLE IF NOT EXISTS browser_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,                  -- 'gemini' or 'chatgpt'
  prompt TEXT NOT NULL,
  system_prompt TEXT DEFAULT '',
  response TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, IN_PROGRESS, COMPLETED, FAILED
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast polling
CREATE INDEX IF NOT EXISTS idx_browser_tasks_status ON browser_tasks(status) WHERE status = 'PENDING';
