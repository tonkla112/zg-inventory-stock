-- ============================================================
--  ZG Inventory Stock — Viewer Recipient Permission
--  วิธีใช้: Supabase Dashboard → SQL Editor → New query → วางทั้งหมด → Run
--  ผลลัพธ์: Viewer ดูข้อมูลผู้รับสินค้าได้ แต่เพิ่ม/แก้ไข/ลบผู้รับสินค้าไม่ได้
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

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zg_custs_auth" ON customers;
DROP POLICY IF EXISTS "auth_customers" ON customers;
DROP POLICY IF EXISTS "zg_custs_select_auth" ON customers;
DROP POLICY IF EXISTS "zg_custs_insert_staff_admin" ON customers;
DROP POLICY IF EXISTS "zg_custs_update_staff_admin" ON customers;
DROP POLICY IF EXISTS "zg_custs_delete_staff_admin" ON customers;

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
