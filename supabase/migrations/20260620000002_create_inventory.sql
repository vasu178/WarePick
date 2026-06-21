-- ============================================
-- WarePick Migration 2: Inventory
-- ============================================

CREATE TABLE inventory (
  sku TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  shelf_code TEXT NOT NULL,
  available_quantity INTEGER NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atomic inventory reservation function (prevents race conditions)
CREATE OR REPLACE FUNCTION reserve_inventory(p_sku TEXT, p_quantity INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  current_available INT;
BEGIN
  SELECT available_quantity INTO current_available
  FROM inventory
  WHERE sku = p_sku
  FOR UPDATE;  -- Row lock

  IF current_available IS NULL THEN
    RETURN FALSE;
  END IF;

  IF current_available >= p_quantity THEN
    UPDATE inventory
    SET available_quantity = available_quantity - p_quantity,
        reserved_quantity = reserved_quantity + p_quantity,
        updated_at = NOW()
    WHERE sku = p_sku;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;
