-- ============================================
-- WarePick Migration 4: Tasks
-- ============================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES bots(id),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'assigned', 'picking', 'completed', 'failed')),
  source_shelves JSONB,
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_order_id ON tasks(order_id);
CREATE INDEX idx_tasks_bot_id ON tasks(bot_id);
CREATE INDEX idx_tasks_status ON tasks(status);
