-- ============================================
-- WarePick Migration 6: Shipments
-- ============================================

CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL,
  tracking_id TEXT NOT NULL,
  notification_status TEXT NOT NULL DEFAULT 'created' CHECK (notification_status IN ('created', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_package_id ON shipments(package_id);
