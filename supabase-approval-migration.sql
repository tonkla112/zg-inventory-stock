-- Run this once in Supabase SQL Editor to store SO approval workflow fields.
ALTER TABLE sale_orders
  ADD COLUMN IF NOT EXISTS requested_by TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

UPDATE sale_orders SET approval_status = 'pending' WHERE approval_status IS NULL;
