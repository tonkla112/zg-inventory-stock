-- ============================================================
--  ZG Inventory Stock — Viewer Withdrawal Permission
--  วิธีใช้: Supabase Dashboard → SQL Editor → New query → วางทั้งหมด → Run
--  ผลลัพธ์: Viewer ดูประวัติเบิกออกได้ แต่เพิ่ม/แก้ไข/ยกเลิก/อนุมัติ/ลบไม่ได้
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

ALTER TABLE sale_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_order_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zg_so_auth" ON sale_orders;
DROP POLICY IF EXISTS "auth_so" ON sale_orders;
DROP POLICY IF EXISTS "zg_so_select_auth" ON sale_orders;
DROP POLICY IF EXISTS "zg_so_insert_staff_admin" ON sale_orders;
DROP POLICY IF EXISTS "zg_so_update_staff_admin" ON sale_orders;
DROP POLICY IF EXISTS "zg_so_delete_staff_admin" ON sale_orders;

DROP POLICY IF EXISTS "zg_sol_auth" ON sale_order_lines;
DROP POLICY IF EXISTS "auth_sol" ON sale_order_lines;
DROP POLICY IF EXISTS "zg_sol_select_auth" ON sale_order_lines;
DROP POLICY IF EXISTS "zg_sol_insert_staff_admin" ON sale_order_lines;
DROP POLICY IF EXISTS "zg_sol_update_staff_admin" ON sale_order_lines;
DROP POLICY IF EXISTS "zg_sol_delete_staff_admin" ON sale_order_lines;

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
