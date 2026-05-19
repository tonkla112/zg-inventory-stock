-- ============================================================
--  ZG Inventory Stock — User Metadata Setup
--
--  วิธีใช้:
--  1. ไปที่ Supabase → Authentication → Users
--  2. สร้าง user แต่ละคนก่อน (กด "Add user")
--  3. แล้วค่อย run SQL ด้านล่างนี้เพื่อตั้ง role / ชื่อ / แผนก
--
--  *** แก้ email ให้ตรงกับที่สร้างจริง ***
-- ============================================================

UPDATE auth.users
SET raw_user_meta_data = '{"role":"admin","name":"ผู้ดูแลคลัง","pos":"System Administrator","dept":"IT / ระบบ"}'::jsonb
WHERE email = 'admin@zg-factory.co.th';

UPDATE auth.users
SET raw_user_meta_data = '{"role":"staff","name":"คุณนภัสสร เจริญสุข","pos":"หัวหน้าคลังสินค้า","dept":"ฝ่ายคลังสินค้า"}'::jsonb
WHERE email = 'staff@zg-factory.co.th';

UPDATE auth.users
SET raw_user_meta_data = '{"role":"viewer","name":"คุณกิตติ ศรีไพร","pos":"ผู้ตรวจสอบภายใน","dept":"ฝ่ายตรวจสอบ"}'::jsonb
WHERE email = 'viewer@zg-factory.co.th';

-- ตรวจสอบว่า update สำเร็จ (ควรเห็น 3 rows)
SELECT email, raw_user_meta_data->>'role' AS role, raw_user_meta_data->>'name' AS name
FROM auth.users
WHERE email IN ('admin@zg-factory.co.th','staff@zg-factory.co.th','viewer@zg-factory.co.th');
