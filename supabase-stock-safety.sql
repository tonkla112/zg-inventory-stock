-- ============================================================
--  ZG Inventory Stock — Stock Safety Controls
--  วิธีใช้: Supabase Dashboard → SQL Editor → New query → วางทั้งหมด → Run
--  ผลลัพธ์: ป้องกันจำนวน/ราคาไม่ถูกต้อง และห้ามเบิกจนสต๊อกติดลบ
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'items_buy_price_nonnegative') THEN
    ALTER TABLE items ADD CONSTRAINT items_buy_price_nonnegative CHECK (buy_price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'items_sell_price_nonnegative') THEN
    ALTER TABLE items ADD CONSTRAINT items_sell_price_nonnegative CHECK (sell_price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_id_format') THEN
    ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_id_format CHECK (id ~ '^PO[0-9]+$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_qty_positive') THEN
    ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_qty_positive CHECK (qty > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_price_nonnegative') THEN
    ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_price_nonnegative CHECK (price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_orders_id_format') THEN
    ALTER TABLE sale_orders ADD CONSTRAINT sale_orders_id_format CHECK (id ~ '^SO[0-9]+$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_orders_shipping_nonnegative') THEN
    ALTER TABLE sale_orders ADD CONSTRAINT sale_orders_shipping_nonnegative CHECK (shipping >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_orders_discount_nonnegative') THEN
    ALTER TABLE sale_orders ADD CONSTRAINT sale_orders_discount_nonnegative CHECK (discount >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_order_lines_qty_positive') THEN
    ALTER TABLE sale_order_lines ADD CONSTRAINT sale_order_lines_qty_positive CHECK (qty > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_order_lines_price_nonnegative') THEN
    ALTER TABLE sale_order_lines ADD CONSTRAINT sale_order_lines_price_nonnegative CHECK (price >= 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.zg_stock_balance(p_item_code TEXT)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT
    COALESCE((SELECT SUM(qty) FROM purchase_orders WHERE item_code = p_item_code), 0)
    - COALESCE((
      SELECT SUM(sol.qty)
      FROM sale_order_lines sol
      JOIN sale_orders so ON so.id = sol.so_id
      WHERE sol.item_code = p_item_code
        AND COALESCE(so.status, 'active') <> 'canceled'
    ), 0);
$$;

CREATE OR REPLACE FUNCTION public.zg_assert_nonnegative_stock(p_item_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  IF p_item_code IS NULL OR p_item_code = '' THEN
    RETURN;
  END IF;

  SELECT public.zg_stock_balance(p_item_code) INTO current_balance;

  IF current_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for item %. Current balance would be %.', p_item_code, current_balance
      USING ERRCODE = '23514';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.zg_check_purchase_order_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM public.zg_assert_nonnegative_stock(OLD.item_code);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.zg_assert_nonnegative_stock(NEW.item_code);
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.zg_check_sale_order_line_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM public.zg_assert_nonnegative_stock(OLD.item_code);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.zg_assert_nonnegative_stock(NEW.item_code);
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.zg_check_sale_order_status_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  line_item RECORD;
BEGIN
  IF COALESCE(OLD.status, 'active') = 'canceled' AND COALESCE(NEW.status, 'active') <> 'canceled' THEN
    FOR line_item IN SELECT DISTINCT item_code FROM sale_order_lines WHERE so_id = NEW.id LOOP
      PERFORM public.zg_assert_nonnegative_stock(line_item.item_code);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zg_purchase_order_stock_guard ON purchase_orders;
CREATE TRIGGER zg_purchase_order_stock_guard
  AFTER INSERT OR UPDATE OR DELETE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.zg_check_purchase_order_stock();

DROP TRIGGER IF EXISTS zg_sale_order_line_stock_guard ON sale_order_lines;
CREATE TRIGGER zg_sale_order_line_stock_guard
  AFTER INSERT OR UPDATE OR DELETE ON sale_order_lines
  FOR EACH ROW EXECUTE FUNCTION public.zg_check_sale_order_line_stock();

DROP TRIGGER IF EXISTS zg_sale_order_status_stock_guard ON sale_orders;
CREATE TRIGGER zg_sale_order_status_stock_guard
  AFTER UPDATE OF status ON sale_orders
  FOR EACH ROW EXECUTE FUNCTION public.zg_check_sale_order_status_stock();
