-- ============================================================
--  ZG Inventory Stock — Audit Logs
--  วิธีใช้: Supabase Dashboard → SQL Editor → New query → วางทั้งหมด → Run
--  ผลลัพธ์: เก็บประวัติการเพิ่ม/แก้ไข/ลบ/อนุมัติ/ยกเลิกใน Supabase
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

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zg_audit_auth" ON audit_logs;
DROP POLICY IF EXISTS "auth_audit" ON audit_logs;
DROP POLICY IF EXISTS "zg_audit_select_staff_admin" ON audit_logs;
DROP POLICY IF EXISTS "zg_audit_insert_staff_admin" ON audit_logs;

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
