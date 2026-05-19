# คู่มือการติดตั้ง ZG Inventory Stock
## ขั้นตอนการ Setup ตั้งแต่ต้นจนใช้งานได้จริง

---

## ภาพรวม Stack

| ส่วนประกอบ | บริการ | ค่าใช้จ่าย |
|---|---|---|
| **Database** | Supabase (PostgreSQL) | ฟรี (500 MB) |
| **Auth** | Supabase Auth | ฟรี |
| **Hosting** | Vercel | ฟรี |
| **Source Code** | GitHub | ฟรี |

---

## ขั้นตอนที่ 1 — สร้าง Supabase Project

1. เปิด **https://supabase.com** → กด **Start your project**
2. Sign up ด้วย GitHub หรือ Email
3. กด **New project**
   - Organization: เลือกหรือสร้างใหม่
   - Name: `zg-inventory`
   - Database Password: ตั้งรหัสผ่านที่แข็งแรง (จดเก็บไว้)
   - Region: **Southeast Asia (Singapore)**
4. รอ ~2 นาที จนโปรเจกต์พร้อม

---

## ขั้นตอนที่ 2 — สร้าง Database Tables

1. ใน Supabase Dashboard → เลือก **SQL Editor** (เมนูซ้าย)
2. กด **New query**
3. เปิดไฟล์ `supabase-schema.sql` ในโฟลเดอร์โปรเจกต์
4. Copy ทั้งหมด → Paste ใน SQL Editor
5. กด **Run** (หรือ Ctrl+Enter)
6. ✅ ตรวจสอบว่า "Success. No rows returned" ปรากฏ

---

## ขั้นตอนที่ 3 — สร้าง Users (ระบบ Login)

### 3.1 สร้าง Users ใน Supabase Auth

1. Dashboard → **Authentication** → **Users** → กด **Add user**
2. สร้าง 3 users:

| Email | Password | บทบาท |
|---|---|---|
| `admin@zg-factory.co.th` | (ตั้งเอง) | ผู้ดูแลระบบ |
| `staff@zg-factory.co.th` | (ตั้งเอง) | พนักงานคลัง |
| `viewer@zg-factory.co.th` | (ตั้งเอง) | ผู้ตรวจสอบ |

> **หมายเหตุ:** เปลี่ยน email เป็นของโรงงานจริงได้ เช่น `viroj@zg-factory.co.th`

### 3.2 ตั้งค่า Role และชื่อแต่ละ User

1. Dashboard → **SQL Editor** → **New query**
2. Copy SQL ด้านล่างนี้ แล้ว Run ทีละชุด:

```sql
-- Admin user
UPDATE auth.users
SET raw_user_meta_data = '{"role":"admin","name":"ผู้ดูแลคลัง","pos":"System Administrator","dept":"IT / ระบบ"}'
WHERE email = 'admin@zg-factory.co.th';

-- Staff user
UPDATE auth.users
SET raw_user_meta_data = '{"role":"staff","name":"คุณนภัสสร เจริญสุข","pos":"หัวหน้าคลังสินค้า","dept":"ฝ่ายคลังสินค้า"}'
WHERE email = 'staff@zg-factory.co.th';

-- Viewer user
UPDATE auth.users
SET raw_user_meta_data = '{"role":"viewer","name":"คุณกิตติ ศรีไพร","pos":"ผู้ตรวจสอบภายใน","dept":"ฝ่ายตรวจสอบ"}'
WHERE email = 'viewer@zg-factory.co.th';
```

---

## ขั้นตอนที่ 4 — คัดลอก API Keys

1. Dashboard → **Project Settings** (ไอคอนเฟือง) → **API**
2. คัดลอก 2 ค่า:
   - **Project URL** → `https://xxxxxxxx.supabase.co`
   - **anon / public key** → `eyJhbGci...` (ยาวมาก)
https://glzolrqutjsdfrdwghfy.supabase.co
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsem9scnF1dGpzZGZyZHdnaGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNDU0MzMsImV4cCI6MjA5NDcyMTQzM30.rygOc8EDGha-c1y1As9kNoFxXZOQgScsLFHQFfKKgnI


---

## ขั้นตอนที่ 5 — แก้ไข config.js

1. เปิดไฟล์ `config.js` ในโฟลเดอร์โปรเจกต์
2. วางค่าที่คัดลอกมา:

```js
window.ZG_CONFIG = {
  supabaseUrl:  'https://XXXXXXXXXXXXXXXX.supabase.co',   // ← วางตรงนี้
  supabaseAnon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXX', // ← วางตรงนี้
};
```

3. บันทึกไฟล์

---

## ขั้นตอนที่ 6 — สร้าง GitHub Repository

1. เปิด **https://github.com** → Sign in (หรือ Sign up)
2. กด **New repository** (ปุ่มเขียว)
   - Repository name: `zg-inventory-stock`
   - Private ✅ (แนะนำ)
   - กด **Create repository**
3. เปิด Terminal บน Mac แล้วรันคำสั่ง:

```bash
cd ~/Desktop/"ZG Inventory Stock"
git init
git add .
git commit -m "Initial ZG Inventory Stock"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/zg-inventory-stock.git
git push -u origin main
```

> แทน `YOUR_USERNAME` ด้วย GitHub username ของคุณ

---

## ขั้นตอนที่ 7 — Deploy บน Vercel

1. เปิด **https://vercel.com** → Sign in ด้วย GitHub
2. กด **Add New Project** → **Import Git Repository**
3. เลือก `zg-inventory-stock`
4. ตั้งค่า:
   - Framework Preset: **Other**
   - Root Directory: `/` (ค่าเริ่มต้น)
   - Build & Output Settings: **ปล่อยว่าง** (ไม่มี build step)
5. กด **Deploy**
6. รอ ~30 วินาที → ได้ URL เช่น `https://zg-inventory-stock.vercel.app`

✅ **เสร็จแล้ว! เปิด URL และ Login ได้เลย**

---

## การเพิ่ม User ใหม่ในอนาคต

1. Supabase Dashboard → **Authentication** → **Users** → **Add user**
2. ใส่ Email + Password
3. SQL Editor → Update metadata:

```sql
UPDATE auth.users
SET raw_user_meta_data = '{"role":"staff","name":"ชื่อพนักงาน","pos":"ตำแหน่ง","dept":"แผนก"}'
WHERE email = 'new_user@zg-factory.co.th';
```

---

## การ Backup ข้อมูล

1. Supabase Dashboard → **Table Editor** → เลือก Table
2. กด **Export** → **Download CSV**

หรือใช้ฟีเจอร์ Export ในหน้า Reports ของแอป

---

## แก้ปัญหาที่พบบ่อย

| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| "โหลดข้อมูลไม่สำเร็จ" | config.js ยังไม่ได้ตั้งค่า | ตรวจสอบ supabaseUrl และ supabaseAnon |
| Login ไม่ผ่าน | User ยังไม่ได้สร้างใน Supabase | ทำขั้นตอนที่ 3 อีกครั้ง |
| ข้อมูลไม่แสดง | RLS policy ผิดพลาด | รัน supabase-schema.sql อีกครั้ง |
| หน้าเว็บเปิดไม่ขึ้น | Vercel deploy ไม่สำเร็จ | ตรวจสอบ Vercel dashboard → Deployments |

---

## ติดต่อฝ่าย IT

หากพบปัญหาในการติดตั้ง สามารถแชร์ข้อความ error จาก Browser Console (F12) ให้ผู้ดูแลระบบช่วยแก้ไขได้
