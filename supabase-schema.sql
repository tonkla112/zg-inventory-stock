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
  buy_price   NUMERIC(12,2) NOT NULL DEFAULT 0,
  sell_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
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
  id          TEXT PRIMARY KEY,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  item_code   TEXT REFERENCES items(code),
  item_name   TEXT DEFAULT '',
  unit        TEXT DEFAULT '',
  price       NUMERIC(12,2) DEFAULT 0,
  qty         INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ใบเบิกสินค้า / เบิกออก (Sale Orders)
CREATE TABLE IF NOT EXISTS sale_orders (
  id          TEXT PRIMARY KEY,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  cust_code   TEXT REFERENCES customers(code),
  shipping    NUMERIC(12,2) DEFAULT 0,
  discount    NUMERIC(12,2) DEFAULT 0,
  has_sig     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- รายการสินค้าในใบเบิก (Sale Order Lines)
CREATE TABLE IF NOT EXISTS sale_order_lines (
  id          SERIAL PRIMARY KEY,
  so_id       TEXT NOT NULL REFERENCES sale_orders(id) ON DELETE CASCADE,
  item_code   TEXT REFERENCES items(code),
  qty         INTEGER NOT NULL DEFAULT 0,
  price       NUMERIC(12,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
--  2. Row Level Security — เฉพาะผู้ login แล้วเข้าถึงได้
-- ============================================================

ALTER TABLE items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_order_lines ENABLE ROW LEVEL SECURITY;

-- ลบ policy เก่าก่อน (ถ้ามี) แล้วสร้างใหม่ — รัน script นี้กี่ครั้งก็ได้
DROP POLICY IF EXISTS "zg_items_auth"  ON items;
DROP POLICY IF EXISTS "zg_custs_auth"  ON customers;
DROP POLICY IF EXISTS "zg_po_auth"     ON purchase_orders;
DROP POLICY IF EXISTS "zg_so_auth"     ON sale_orders;
DROP POLICY IF EXISTS "zg_sol_auth"    ON sale_order_lines;

-- ลบ policy ชื่อเก่า (จากการรันครั้งก่อน) ด้วย
DROP POLICY IF EXISTS "auth_items"     ON items;
DROP POLICY IF EXISTS "auth_customers" ON customers;
DROP POLICY IF EXISTS "auth_po"        ON purchase_orders;
DROP POLICY IF EXISTS "auth_so"        ON sale_orders;
DROP POLICY IF EXISTS "auth_sol"       ON sale_order_lines;

-- ใช้ auth.uid() IS NOT NULL (รองรับทุก version ของ Supabase)
CREATE POLICY "zg_items_auth"    ON items            USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "zg_custs_auth"    ON customers        USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "zg_po_auth"       ON purchase_orders  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "zg_so_auth"       ON sale_orders      USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "zg_sol_auth"      ON sale_order_lines USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

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
