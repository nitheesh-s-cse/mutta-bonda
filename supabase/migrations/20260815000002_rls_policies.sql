-- Row Level Security (RLS) policies
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public read on menu
CREATE POLICY "Public read menu" ON menu_items FOR SELECT USING (true);

-- Public insert on orders, feedback, contact
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert feedback" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert contact" ON contact_messages FOR INSERT WITH CHECK (true);

-- Admin-only access (service role bypasses RLS)
CREATE POLICY "Admin all orders" ON orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin all feedback" ON feedback FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin all contact" ON contact_messages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin all menu" ON menu_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin all users" ON admin_users FOR ALL USING (auth.role() = 'service_role');