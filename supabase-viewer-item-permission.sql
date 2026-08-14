-- ============================================================
--  ZG Inventory Stock — Viewer Item Permission
--  วิธีใช้: Supabase Dashboard → SQL Editor → New query → วางทั้งหมด → Run
--  ผลลัพธ์: Viewer ดูข้อมูลสินค้าได้ แต่เพิ่ม/แก้ไข/ลบสินค้าไม่ได้
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

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zg_items_auth" ON items;
DROP POLICY IF EXISTS "auth_items" ON items;
DROP POLICY IF EXISTS "zg_items_select_auth" ON items;
DROP POLICY IF EXISTS "zg_items_insert_staff_admin" ON items;
DROP POLICY IF EXISTS "zg_items_update_staff_admin" ON items;
DROP POLICY IF EXISTS "zg_items_delete_staff_admin" ON items;

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
