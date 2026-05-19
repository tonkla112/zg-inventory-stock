// Supabase-backed store — replaces localStorage version
const _db = () => window.ZG_SUPABASE;

// ---- Compute helpers (unchanged from original) ----
function computeStock(items, pos, sos) {
  const map = new Map(items.map(i => [i.code, 0]));
  pos.forEach(p => map.set(p.code, (map.get(p.code) || 0) + p.qty));
  sos.forEach(s => s.lines.forEach(l => map.set(l.code, (map.get(l.code) || 0) - l.qty)));
  return map;
}
function soTotals(so, items) {
  const itemMap = new Map(items.map(i => [i.code, i]));
  const subtotal = so.lines.reduce((sum, l) => sum + (itemMap.get(l.code)?.sell || 0) * l.qty, 0);
  const net = subtotal + (so.shipping || 0) - (so.discount || 0);
  return { subtotal, net };
}
function nextId(prefix, list) {
  const max = list.reduce((m, x) => {
    const n = parseInt(String(x.id).replace(prefix, ''), 10);
    return isFinite(n) ? Math.max(m, n) : m;
  }, 10000);
  return prefix + (max + 1);
}

// ---- DB row → app object mappers ----
const mapItem = r => ({
  code: r.code, name: r.name, nameEn: r.name_en || '',
  unit: r.unit, buy: +r.buy_price, sell: +r.sell_price, img: r.color || '#94a3b8',
});
const mapCust = r => ({
  code: r.code, name: r.name, pos: r.pos || '', dept: r.dept || '', phone: r.phone || '',
});
const mapPO = r => ({
  id: r.id, date: r.date, code: r.item_code, name: r.item_name, unit: r.unit, price: +r.price, qty: r.qty,
});
const mapSO = (r, lines) => ({
  id: r.id, date: r.date, custCode: r.cust_code,
  shipping: +r.shipping, discount: +r.discount, sig: r.has_sig,
  lines: lines
    .filter(l => l.so_id === r.id)
    .map(l => ({ code: l.item_code, qty: l.qty, price: +l.price })),
});

// ---- Main store hook ----
function useStore() {
  const [state, setState] = useState({ items: [], customers: [], pos: [], sos: [] });
  const [ready, setReady] = useState(false);
  const stateRef = React.useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  async function loadAll() {
    try {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        _db().from('items').select('*').order('code'),
        _db().from('customers').select('*').order('code'),
        _db().from('purchase_orders').select('*').order('created_at', { ascending: false }),
        _db().from('sale_orders').select('*').order('created_at', { ascending: false }),
        _db().from('sale_order_lines').select('*'),
      ]);
      const lines = r5.data || [];
      setState({
        items:     (r1.data || []).map(mapItem),
        customers: (r2.data || []).map(mapCust),
        pos:       (r3.data || []).map(mapPO),
        sos:       (r4.data || []).map(r => mapSO(r, lines)),
      });
    } catch (e) {
      console.error('ZG Store load error:', e);
      Toast.push('โหลดข้อมูลไม่สำเร็จ — ตรวจสอบ config.js', 'danger');
    } finally {
      setReady(true);
    }
  }

  useEffect(() => { loadAll(); }, []);

  const stockMap = useMemo(() => computeStock(state.items, state.pos, state.sos), [state]);

  const actions = {
    // ---- Purchase Orders ----
    async addPO(po) {
      const id = nextId('PO', stateRef.current.pos);
      setState(s => ({ ...s, pos: [{ ...po, id }, ...s.pos] }));
      const { error } = await _db().from('purchase_orders').insert({
        id, date: po.date, item_code: po.code, item_name: po.name,
        unit: po.unit, price: po.price, qty: po.qty,
      });
      if (error) {
        setState(s => ({ ...s, pos: s.pos.filter(p => p.id !== id) }));
        Toast.push('บันทึก PO ไม่สำเร็จ: ' + error.message, 'danger');
        return false;
      }
      return true;
    },

    // ---- Sale Orders ----
    async addSO(so) {
      const id = nextId('SO', stateRef.current.sos);
      setState(s => ({ ...s, sos: [{ ...so, id }, ...s.sos] }));
      const { error: e1 } = await _db().from('sale_orders').insert({
        id, date: so.date, cust_code: so.custCode,
        shipping: so.shipping || 0, discount: so.discount || 0, has_sig: so.sig || false,
      });
      if (e1) {
        setState(s => ({ ...s, sos: s.sos.filter(x => x.id !== id) }));
        Toast.push('บันทึก SO ไม่สำเร็จ: ' + e1.message, 'danger');
        return false;
      }
      if (so.lines && so.lines.length > 0) {
        const rows = so.lines.map(l => ({ so_id: id, item_code: l.code, qty: l.qty, price: l.price || 0 }));
        const { error: e2 } = await _db().from('sale_order_lines').insert(rows);
        if (e2) Toast.push('บันทึก line items บางส่วนไม่สำเร็จ', 'danger');
      }
      return true;
    },

    // ---- Items ----
    async addItem(item) {
      const { error } = await _db().from('items').insert({
        code: item.code, name: item.name, name_en: item.nameEn || '',
        unit: item.unit, buy_price: item.buy, sell_price: item.sell, color: item.img,
      });
      if (error) { Toast.push('เพิ่มสินค้าไม่สำเร็จ: ' + error.message, 'danger'); return false; }
      setState(s => ({ ...s, items: [...s.items, item] }));
      return true;
    },

    async updItem(code, patch) {
      const db = {};
      if (patch.name    !== undefined) db.name       = patch.name;
      if (patch.nameEn  !== undefined) db.name_en    = patch.nameEn;
      if (patch.unit    !== undefined) db.unit        = patch.unit;
      if (patch.buy     !== undefined) db.buy_price   = patch.buy;
      if (patch.sell    !== undefined) db.sell_price  = patch.sell;
      if (patch.img     !== undefined) db.color       = patch.img;
      setState(s => ({ ...s, items: s.items.map(i => i.code === code ? { ...i, ...patch } : i) }));
      const { error } = await _db().from('items').update(db).eq('code', code);
      if (error) { Toast.push('อัปเดตสินค้าไม่สำเร็จ: ' + error.message, 'danger'); loadAll(); }
    },

    async delItem(code) {
      setState(s => ({ ...s, items: s.items.filter(i => i.code !== code) }));
      const { error } = await _db().from('items').delete().eq('code', code);
      if (error) { Toast.push('ลบสินค้าไม่สำเร็จ: ' + error.message, 'danger'); loadAll(); }
    },

    // ---- Customers ----
    async addCust(c) {
      const { error } = await _db().from('customers').insert({
        code: c.code, name: c.name, pos: c.pos, dept: c.dept, phone: c.phone || '',
      });
      if (error) { Toast.push('เพิ่มผู้รับสินค้าไม่สำเร็จ: ' + error.message, 'danger'); return false; }
      setState(s => ({ ...s, customers: [...s.customers, c] }));
      return true;
    },

    async updCust(code, patch) {
      setState(s => ({ ...s, customers: s.customers.map(c => c.code === code ? { ...c, ...patch } : c) }));
      const { error } = await _db().from('customers').update(patch).eq('code', code);
      if (error) { Toast.push('อัปเดตผู้รับสินค้าไม่สำเร็จ: ' + error.message, 'danger'); loadAll(); }
    },

    async delCust(code) {
      setState(s => ({ ...s, customers: s.customers.filter(c => c.code !== code) }));
      const { error } = await _db().from('customers').delete().eq('code', code);
      if (error) { Toast.push('ลบผู้รับสินค้าไม่สำเร็จ: ' + error.message, 'danger'); loadAll(); }
    },

    reload: loadAll,
    reset() { Toast.push('จัดการข้อมูลผ่าน Supabase Dashboard แทนได้เลยครับ', 'danger'); },
  };

  return { state, stockMap, ready, actions };
}

Object.assign(window, { useStore, soTotals, computeStock, nextId });
