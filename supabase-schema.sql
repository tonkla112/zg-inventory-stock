-- ============================================================
--  ZG Inventory Stock — Supabase Database Schema
--  วิธีใช้: Supabase Dashboard → SQL Editor → New query → วางทั้งหมด → Run
--  ไฟล์นี้: สร้าง tables + RLS + seed data
-- ============================================================

-- ============================================================
--  1. Tables
-- ============================================================

-- สินค้า (Items)
CREATE TABLE IF NOT EXISTS items (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  name_en     TEXT DEFAULT '',
  unit        TEXT NOT NULL DEFAULT '',
  buy_price   NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (buy_price >= 0),
  sell_price  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (sell_price >= 0),
  color       TEXT DEFAULT '#94a3b8',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ผู้รับสินค้า (Customers / Requestors)
CREATE TABLE IF NOT EXISTS customers (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  pos         TEXT DEFAULT '',
  dept        TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ใบสั่งซื้อ / รับเข้า (Purchase Orders)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id          TEXT PRIMARY KEY CHECK (id ~ '^PO[0-9]+$'),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  item_code   TEXT REFERENCES items(code),
  item_name   TEXT DEFAULT '',
  unit        TEXT DEFAULT '',
  price       NUMERIC(12,2) DEFAULT 0 CHECK (price >= 0),
  qty         INTEGER NOT NULL DEFAULT 0 CHECK (qty > 0),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ใบเบิกสินค้า / เบิกออก (Sale Orders)
CREATE TABLE IF NOT EXISTS sale_orders (
  id          TEXT PRIMARY KEY CHECK (id ~ '^SO[0-9]+$'),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  cust_code   TEXT REFERENCES customers(code),
  shipping    NUMERIC(12,2) DEFAULT 0 CHECK (shipping >= 0),
  discount    NUMERIC(12,2) DEFAULT 0 CHECK (discount >= 0),
  has_sig     BOOLEAN DEFAULT false,
  signature_data TEXT DEFAULT '',
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled')),
  cancel_reason TEXT DEFAULT '',
  canceled_at TIMESTAMPTZ,
  requested_by TEXT DEFAULT '',
  approval_status TEXT DEFAULT 'pending',
  approved_by TEXT DEFAULT '',
  approved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- เพิ่ม column นี้ให้ database เดิมที่สร้าง table ไปแล้ว
ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS signature_data TEXT DEFAULT '';
ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT DEFAULT '';
ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS requested_by TEXT DEFAULT '';
ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS approved_by TEXT DEFAULT '';
ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
UPDATE sale_orders SET status = 'active' WHERE status IS NULL;
UPDATE sale_orders SET approval_status = 'pending' WHERE approval_status IS NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sale_orders_status_check'
  ) THEN
    ALTER TABLE sale_orders ADD CONSTRAINT sale_orders_status_check CHECK (status IN ('active', 'canceled'));
  END IF;
END $$;

-- รายการสินค้าในใบเบิก (Sale Order Lines)
CREATE TABLE IF NOT EXISTS sale_order_lines (
  id          SERIAL PRIMARY KEY,
  so_id       TEXT NOT NULL REFERENCES sale_orders(id) ON DELETE CASCADE,
  item_code   TEXT REFERENCES items(code),
  qty         INTEGER NOT NULL DEFAULT 0 CHECK (qty > 0),
  price       NUMERIC(12,2) DEFAULT 0 CHECK (price >= 0),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Stock safety constraints for databases created before these checks existed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'items_buy_price_nonnegative') THEN
    ALTER TABLE items ADD CONSTRAINT items_buy_price_nonnegative CHECK (buy_price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'items_sell_price_nonnegative') THEN
    ALTER TABLE items ADD CONSTRAINT items_sell_price_nonnegative CHECK (sell_price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_id_format') THEN
    ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_id_format CHECK (id ~ '^PO[0-9]+$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_qty_positive') THEN
    ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_qty_positive CHECK (qty > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_price_nonnegative') THEN
    ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_price_nonnegative CHECK (price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_orders_id_format') THEN
    ALTER TABLE sale_orders ADD CONSTRAINT sale_orders_id_format CHECK (id ~ '^SO[0-9]+$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_orders_shipping_nonnegative') THEN
    ALTER TABLE sale_orders ADD CONSTRAINT sale_orders_shipping_nonnegative CHECK (shipping >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_orders_discount_nonnegative') THEN
    ALTER TABLE sale_orders ADD CONSTRAINT sale_orders_discount_nonnegative CHECK (discount >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_order_lines_qty_positive') THEN
    ALTER TABLE sale_order_lines ADD CONSTRAINT sale_order_lines_qty_positive CHECK (qty > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_order_lines_price_nonnegative') THEN
    ALTER TABLE sale_order_lines ADD CONSTRAINT sale_order_lines_price_nonnegative CHECK (price >= 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.zg_stock_balance(p_item_code TEXT)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT
    COALESCE((SELECT SUM(qty) FROM purchase_orders WHERE item_code = p_item_code), 0)
    - COALESCE((
      SELECT SUM(sol.qty)
      FROM sale_order_lines sol
      JOIN sale_orders so ON so.id = sol.so_id
      WHERE sol.item_code = p_item_code
        AND COALESCE(so.status, 'active') <> 'canceled'
    ), 0);
$$;

CREATE OR REPLACE FUNCTION public.zg_assert_nonnegative_stock(p_item_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  IF p_item_code IS NULL OR p_item_code = '' THEN
    RETURN;
  END IF;

  SELECT public.zg_stock_balance(p_item_code) INTO current_balance;

  IF current_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for item %. Current balance would be %.', p_item_code, current_balance
      USING ERRCODE = '23514';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.zg_check_purchase_order_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM public.zg_assert_nonnegative_stock(OLD.item_code);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.zg_assert_nonnegative_stock(NEW.item_code);
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.zg_check_sale_order_line_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM public.zg_assert_nonnegative_stock(OLD.item_code);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.zg_assert_nonnegative_stock(NEW.item_code);
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.zg_check_sale_order_status_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  line_item RECORD;
BEGIN
  IF COALESCE(OLD.status, 'active') = 'canceled' AND COALESCE(NEW.status, 'active') <> 'canceled' THEN
    FOR line_item IN SELECT DISTINCT item_code FROM sale_order_lines WHERE so_id = NEW.id LOOP
      PERFORM public.zg_assert_nonnegative_stock(line_item.item_code);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zg_purchase_order_stock_guard ON purchase_orders;
CREATE TRIGGER zg_purchase_order_stock_guard
  AFTER INSERT OR UPDATE OR DELETE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.zg_check_purchase_order_stock();

DROP TRIGGER IF EXISTS zg_sale_order_line_stock_guard ON sale_order_lines;
CREATE TRIGGER zg_sale_order_line_stock_guard
  AFTER INSERT OR UPDATE OR DELETE ON sale_order_lines
  FOR EACH ROW EXECUTE FUNCTION public.zg_check_sale_order_line_stock();

DROP TRIGGER IF EXISTS zg_sale_order_status_stock_guard ON sale_orders;
CREATE TRIGGER zg_sale_order_status_stock_guard
  AFTER UPDATE OF status ON sale_orders
  FOR EACH ROW EXECUTE FUNCTION public.zg_check_sale_order_status_stock();

-- ประวัติการเปลี่ยนแปลงในระบบ (Audit Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
  id           BIGSERIAL PRIMARY KEY,
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    TEXT NOT NULL DEFAULT '',
  reason       TEXT DEFAULT '',
  actor_email  TEXT DEFAULT '',
  actor_name   TEXT DEFAULT '',
  actor_role   TEXT DEFAULT '',
  details      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id);

-- ============================================================
--  2. Row Level Security — เฉพาะผู้ login แล้วเข้าถึงได้
-- ============================================================

CREATE OR REPLACE FUNCTION public.zg_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role',
    ''
  );
$$;

GRANT EXECUTE ON FUNCTION public.zg_current_user_role() TO authenticated;

ALTER TABLE items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;

-- ลบ policy เก่าก่อน (ถ้ามี) แล้วสร้างใหม่ — รัน script นี้กี่ครั้งก็ได้
DROP POLICY IF EXISTS "zg_items_auth"  ON items;
DROP POLICY IF EXISTS "zg_custs_auth"  ON customers;
DROP POLICY IF EXISTS "zg_po_auth"     ON purchase_orders;
DROP POLICY IF EXISTS "zg_so_auth"     ON sale_orders;
DROP POLICY IF EXISTS "zg_sol_auth"    ON sale_order_lines;
DROP POLICY IF EXISTS "zg_audit_auth"  ON audit_logs;

-- ลบ policy ชื่อเก่า (จากการรันครั้งก่อน) ด้วย
DROP POLICY IF EXISTS "auth_items"     ON items;
DROP POLICY IF EXISTS "auth_customers" ON customers;
DROP POLICY IF EXISTS "auth_po"        ON purchase_orders;
DROP POLICY IF EXISTS "auth_so"        ON sale_orders;
DROP POLICY IF EXISTS "auth_sol"       ON sale_order_lines;
DROP POLICY IF EXISTS "auth_audit"     ON audit_logs;

-- ลบ policy ผู้รับสินค้าแบบแยกสิทธิ์ (ถ้ามี) เพื่อให้ script รันซ้ำได้
DROP POLICY IF EXISTS "zg_custs_select_auth" ON customers;
DROP POLICY IF EXISTS "zg_custs_insert_staff_admin" ON customers;
DROP POLICY IF EXISTS "zg_custs_update_staff_admin" ON customers;
DROP POLICY IF EXISTS "zg_custs_delete_staff_admin" ON customers;

-- ลบ policy สินค้าแบบแยกสิทธิ์ (ถ้ามี) เพื่อให้ script รันซ้ำได้
DROP POLICY IF EXISTS "zg_items_select_auth" ON items;
DROP POLICY IF EXISTS "zg_items_insert_staff_admin" ON items;
DROP POLICY IF EXISTS "zg_items_update_staff_admin" ON items;
DROP POLICY IF EXISTS "zg_items_delete_staff_admin" ON items;

-- ลบ policy รับเข้าแบบแยกสิทธิ์ (ถ้ามี) เพื่อให้ script รันซ้ำได้
DROP POLICY IF EXISTS "zg_po_select_auth" ON purchase_orders;
DROP POLICY IF EXISTS "zg_po_insert_staff_admin" ON purchase_orders;
DROP POLICY IF EXISTS "zg_po_update_staff_admin" ON purchase_orders;
DROP POLICY IF EXISTS "zg_po_delete_staff_admin" ON purchase_orders;

-- ลบ policy เบิกออกแบบแยกสิทธิ์ (ถ้ามี) เพื่อให้ script รันซ้ำได้
DROP POLICY IF EXISTS "zg_so_select_auth" ON sale_orders;
DROP POLICY IF EXISTS "zg_so_insert_staff_admin" ON sale_orders;
DROP POLICY IF EXISTS "zg_so_update_staff_admin" ON sale_orders;
DROP POLICY IF EXISTS "zg_so_delete_staff_admin" ON sale_orders;
DROP POLICY IF EXISTS "zg_sol_select_auth" ON sale_order_lines;
DROP POLICY IF EXISTS "zg_sol_insert_staff_admin" ON sale_order_lines;
DROP POLICY IF EXISTS "zg_sol_update_staff_admin" ON sale_order_lines;
DROP POLICY IF EXISTS "zg_sol_delete_staff_admin" ON sale_order_lines;

-- ลบ policy audit log แบบแยกสิทธิ์ (ถ้ามี) เพื่อให้ script รันซ้ำได้
DROP POLICY IF EXISTS "zg_audit_select_staff_admin" ON audit_logs;
DROP POLICY IF EXISTS "zg_audit_insert_staff_admin" ON audit_logs;

-- ผู้รับสินค้า / Recipients: Viewer ดูได้เท่านั้น, Admin/Staff เท่านั้นที่เพิ่ม แก้ไข หรือลบได้
CREATE POLICY "zg_custs_select_auth"
  ON customers
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "zg_custs_insert_staff_admin"
  ON customers
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "zg_custs_update_staff_admin"
  ON customers
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "zg_custs_delete_staff_admin"
  ON customers
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

-- สินค้า / Items: Viewer ดูได้เท่านั้น, Admin/Staff เท่านั้นที่เพิ่ม แก้ไข หรือลบได้
CREATE POLICY "zg_items_select_auth"
  ON items
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "zg_items_insert_staff_admin"
  ON items
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "zg_items_update_staff_admin"
  ON items
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "zg_items_delete_staff_admin"
  ON items
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

-- รับเข้า / Restock: Viewer ดูได้เท่านั้น, Admin/Staff เท่านั้นที่เพิ่ม แก้ไข หรือลบได้
CREATE POLICY "zg_po_select_auth"
  ON purchase_orders
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "zg_po_insert_staff_admin"
  ON purchase_orders
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "zg_po_update_staff_admin"
  ON purchase_orders
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "zg_po_delete_staff_admin"
  ON purchase_orders
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

-- เบิกออก / Withdrawal: Viewer ดูได้เท่านั้น, Admin/Staff เท่านั้นที่เพิ่ม แก้ไข ยกเลิก อนุมัติ หรือลบได้
CREATE POLICY "zg_so_select_auth"
  ON sale_orders
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "zg_so_insert_staff_admin"
  ON sale_orders
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "zg_so_update_staff_admin"
  ON sale_orders
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "zg_so_delete_staff_admin"
  ON sale_orders
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "zg_sol_select_auth"
  ON sale_order_lines
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "zg_sol_insert_staff_admin"
  ON sale_order_lines
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "zg_sol_update_staff_admin"
  ON sale_order_lines
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "zg_sol_delete_staff_admin"
  ON sale_order_lines
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

-- Audit Logs: Admin/Staff ดูและบันทึกประวัติได้, Viewer ไม่เห็นประวัติระบบ
CREATE POLICY "zg_audit_select_staff_admin"
  ON audit_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "zg_audit_insert_staff_admin"
  ON audit_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.zg_current_user_role() IN ('admin', 'staff')
  );

-- ============================================================
--  3. Seed Data — ข้อมูลตัวอย่างเริ่มต้น
-- ============================================================

INSERT INTO items (code, name, name_en, unit, buy_price, sell_price, color) VALUES
  ('ITM-1001', 'แผ่นเหล็กชุบสังกะสี 1.2มม.',  'Galvanized Steel Sheet 1.2mm', 'แผ่น',  485,  620,  '#94a3b8'),
  ('ITM-1002', 'น็อตหัวหกเหลี่ยม M8x25',        'Hex Bolt M8x25',               'กล่อง', 120,  180,  '#64748b'),
  ('ITM-1003', 'สายไฟ THW 2.5sq.mm.',            'Electrical Wire THW 2.5',      'ม้วน',  1450, 1850, '#0ea5e9'),
  ('ITM-1004', 'น้ำมันหล่อลื่นอุตสาหกรรม',       'Industrial Lubricant',         'ลิตร',  185,  240,  '#f59e0b'),
  ('ITM-1005', 'ลูกปืนเม็ดกลม 6204',             'Ball Bearing 6204',            'ตลับ',  78,   135,  '#6b7280'),
  ('ITM-1006', 'ท่อ PVC 4 นิ้ว ยาว 4ม.',         'PVC Pipe 4" x 4m',             'เส้น',  280,  380,  '#3b82f6'),
  ('ITM-1007', 'ถุงมือยางช่าง XL',               'Mechanic Gloves XL',           'คู่',   35,   55,   '#22c55e'),
  ('ITM-1008', 'หลอด LED 18W',                   'LED Tube 18W',                 'หลอด',  95,   145,  '#eab308'),
  ('ITM-1009', 'กระดาษทรายเบอร์ 80',             'Sandpaper Grit 80',            'แผ่น',  12,   25,   '#f97316'),
  ('ITM-1010', 'ลวดเชื่อม 2.6mm 5kg',            'Welding Rod 2.6mm 5kg',        'กล่อง', 520,  680,  '#a855f7'),
  ('ITM-1011', 'แปรงทาสีขนาด 4 นิ้ว',            'Paint Brush 4"',               'อัน',   45,   85,   '#ef4444'),
  ('ITM-1012', 'เทปกาวสองหน้า 24มม.',            'Double-sided Tape 24mm',       'ม้วน',  38,   65,   '#14b8a6')
ON CONFLICT (code) DO NOTHING;

INSERT INTO customers (code, name, pos, dept, phone) VALUES
  ('CUST0001', 'คุณสมชาย วงศ์ไพรวัลย์',   'หัวหน้าฝ่ายผลิต',        'ฝ่ายผลิต',      '081-234-5678'),
  ('CUST0002', 'คุณวิภา อินทร์สุข',        'วิศวกรซ่อมบำรุง',        'ฝ่ายซ่อมบำรุง',  '089-555-1234'),
  ('CUST0003', 'คุณธนากร เจริญรัตน์',      'พนักงานคลังสินค้า',      'ฝ่ายคลังสินค้า', '063-887-9921'),
  ('CUST0004', 'คุณพัชรินทร์ กิตติพงศ์',   'หัวหน้าควบคุมคุณภาพ',   'ฝ่าย QC',       '085-441-2208'),
  ('CUST0005', 'คุณอนุชา ศรีสว่าง',        'หัวหน้าโรงงาน',          'ฝ่ายบริหาร',     '099-112-4422'),
  ('CUST0006', 'คุณมยุรี ทองคำ',           'พนักงานบรรจุภัณฑ์',      'ฝ่ายผลิต',      '062-905-7711')
ON CONFLICT (code) DO NOTHING;
