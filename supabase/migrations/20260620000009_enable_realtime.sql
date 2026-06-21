-- ============================================
-- WarePick Migration 9: Enable Supabase Realtime
-- ============================================

-- Enable CDC (Change Data Capture) for tables that need live frontend updates
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE bots;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE packages;
ALTER PUBLICATION supabase_realtime ADD TABLE shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE event_log;

-- REPLICA IDENTITY FULL provides old + new values in CDC payloads
-- Required for UPDATE events to include previous state
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE bots REPLICA IDENTITY FULL;
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE inventory REPLICA IDENTITY FULL;

-- Updated_at auto-trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER inventory_updated_at BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bots_updated_at BEFORE UPDATE ON bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
