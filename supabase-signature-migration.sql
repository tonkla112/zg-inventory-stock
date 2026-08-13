-- Run this once in Supabase SQL Editor to store actual withdrawal signatures.
ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS signature_data TEXT DEFAULT '';
