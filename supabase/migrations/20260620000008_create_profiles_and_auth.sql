-- ============================================
-- WarePick Migration 8: Auth Profiles & RLS
-- ============================================

-- User profiles with role assignment
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, role, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Profiles: users see own, admins see all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Orders: everyone reads, admins write
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view orders"
  ON orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert orders"
  ON orders FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Order items: same as orders
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view order items"
  ON order_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage order items"
  ON order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Inventory: everyone reads, admins write
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view inventory"
  ON inventory FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage inventory"
  ON inventory FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- All other tables: read-only for authenticated users
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View bots" ON bots FOR SELECT TO authenticated USING (true);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View tasks" ON tasks FOR SELECT TO authenticated USING (true);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View packages" ON packages FOR SELECT TO authenticated USING (true);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View shipments" ON shipments FOR SELECT TO authenticated USING (true);

ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View events" ON event_log FOR SELECT TO authenticated USING (true);
