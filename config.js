// ============================================================
//  ZG Inventory Stock — การตั้งค่า Supabase
//  แก้ไขไฟล์นี้ด้วยค่าจาก Supabase Dashboard ของคุณ
//  Supabase Dashboard → Project Settings → API
// ============================================================

window.ZG_CONFIG = {
  supabaseUrl:  'https://glzolrqutjsdfrdwghfy.supabase.co',   // ← วาง Project URL ตรงนี้
  supabaseAnon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsem9scnF1dGpzZGZyZHdnaGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNDU0MzMsImV4cCI6MjA5NDcyMTQzM30.rygOc8EDGha-c1y1As9kNoFxXZOQgScsLFHQFfKKgnI', // ← วาง anon/public key ตรงนี้
};

// สร้าง Supabase client (ไม่ต้องแก้ไขบรรทัดนี้)
window.ZG_SUPABASE = window.supabase.createClient(
  window.ZG_CONFIG.supabaseUrl,
  window.ZG_CONFIG.supabaseAnon,
  { auth: { persistSession: true, storageKey: 'zg-auth-v2' } }
);
