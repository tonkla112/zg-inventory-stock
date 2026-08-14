-- ============================================================
--  ZG Inventory Stock — Viewer Restock Permission
--  วิธีใช้: Supabase Dashboard → SQL Editor → New query → วางทั้งหมด → Run
--  ผลลัพธ์: Viewer ดูประวัติรับเข้าได้ แต่เพิ่ม/แก้ไข/ลบรายการรับเข้าไม่ได้
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

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zg_po_auth" ON purchase_orders;
DROP POLICY IF EXISTS "auth_po" ON purchase_orders;
DROP POLICY IF EXISTS "zg_po_select_auth" ON purchase_orders;
DROP POLICY IF EXISTS "zg_po_insert_staff_admin" ON purchase_orders;
DROP POLICY IF EXISTS "zg_po_update_staff_admin" ON purchase_orders;
DROP POLICY IF EXISTS "zg_po_delete_staff_admin" ON purchase_orders;

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
