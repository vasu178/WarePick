-- ============================================
-- WarePick Migration 5: Packages
-- ============================================

CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  label_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'ready_for_shipping')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_packages_order_id ON packages(order_id);
