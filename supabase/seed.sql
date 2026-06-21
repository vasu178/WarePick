-- ============================================
-- WarePick Seed Data
-- ============================================

-- 6 SKUs with warehouse shelf locations (from PRD Section 16)
INSERT INTO inventory (sku, product_name, shelf_code, available_quantity, reserved_quantity) VALUES
  ('SKU-1001', 'Wireless Mouse', 'A1', 40, 0),
  ('SKU-1002', 'USB-C Cable', 'A2', 80, 0),
  ('SKU-1003', 'Keyboard', 'B1', 35, 0),
  ('SKU-1004', 'Laptop Stand', 'B2', 25, 0),
  ('SKU-1005', 'Headphones', 'C1', 30, 0),
  ('SKU-1006', 'Power Bank', 'C2', 50, 0);

-- 5 Bots at dock starting positions (from PRD Section 16)
INSERT INTO bots (bot_code, status, x_position, y_position) VALUES
  ('BOT-01', 'idle', 2, 1),
  ('BOT-02', 'idle', 5, 1),
  ('BOT-03', 'idle', 8, 1),
  ('BOT-04', 'idle', 11, 1),
  ('BOT-05', 'idle', 14, 1);
