-- ============================================
-- WarePick Migration 3: Bots
-- ============================================

CREATE TABLE bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'assigned', 'picking', 'returning', 'offline')),
  x_position INTEGER NOT NULL DEFAULT 0,
  y_position INTEGER NOT NULL DEFAULT 0,
  current_task_id UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bots_status ON bots(status);
