// Supabase-backed store — replaces localStorage version
const _db = () => window.ZG_SUPABASE;
const SIGNATURE_STORE_KEY = 'zg-signatures-v1';
const SO_AUDIT_STORE_KEY = 'zg-so-audit-v1';

function normalizeSignatureData(signatureData) {
  return typeof signatureData === 'string' && signatureData.startsWith('data:image/') ? signatureData : '';
}
function readSignatureStore() {
  try {
    return JSON.parse(window.localStorage?.getItem(SIGNATURE_STORE_KEY) || '{}') || {};
  } catch (e) {
    return {};
  }
}
function getStoredSignature(id) {
  const data = readSignatureStore()[id];
  return normalizeSignatureData(data);
}
function saveStoredSignature(id, signatureData) {
  const data = normalizeSignatureData(signatureData);
  if (!data) return;
  try {
    const store = readSignatureStore();
    store[id] = data;
    window.localStorage?.setItem(SIGNATURE_STORE_KEY, JSON.stringify(store));
  } catch (e) {}
}
function removeStoredSignature(id) {
  try {
    const store = readSignatureStore();
    delete store[id];
    window.localStorage?.setItem(SIGNATURE_STORE_KEY, JSON.stringify(store));
  } catch (e) {}
}
function readSOAuditStore() {
  try {
    return JSON.parse(window.localStorage?.getItem(SO_AUDIT_STORE_KEY) || '{}') || {};
  } catch (e) {
    return {};
  }
}
function getStoredSOAudit(id) {
  return readSOAuditStore()[id] || [];
}
function appendStoredSOAudit(id, entry) {
  try {
    const store = readSOAuditStore();
    store[id] = [
      ...(store[id] || []),
      { at: new Date().toISOString(), ...entry },
    ].slice(-20);
    window.localStorage?.setItem(SO_AUDIT_STORE_KEY, JSON.stringify(store));
  } catch (e) {}
}
function isMissingSignatureColumn(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('signature_data') && (message.includes('column') || message.includes('schema cache'));
}
function isMissingCancelColumns(error) {
  const message = String(error?.message || '').toLowerCase();
  return ['status', 'cancel_reason', 'canceled_at'].some(column => message.includes(column))
    && (message.includes('column') || message.includes('schema cache'));
}
function isSOCanceled(so) {
  return so?.status === 'canceled' || !!so?.canceled || (so?.audit || []).some(entry => entry.action === 'cancel');
}

// ---- Compute helpers (unchanged from original) ----
function computeStock(items, pos, sos) {
  const map = new Map();
  items.forEach(i => map.set(i.code, 0));
  pos.forEach(p => map.set(p.code, (map.get(p.code) || 0) + p.qty));
  sos.filter(s => !isSOCanceled(s)).forEach(s => s.lines.forEach(l => map.set(l.code, (map.get(l.code) || 0) - l.qty)));
  return map;
}
function soTotals(so, items) {
  const itemMap = new Map(items.map(i => [i.code, i]));
  return soTotalsFromMap(so, itemMap);
}
function soTotalsFromMap(so, itemMap) {
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
const mapSO = (r, lines = []) => {
  const audit = getStoredSOAudit(r.id);
  const cancelAudit = [...audit].reverse().find(entry => entry.action === 'cancel') || {};
  const canceled = r.status === 'canceled' || !!r.canceled_at || !!cancelAudit.reason;
  return {
    id: r.id, date: r.date, custCode: r.cust_code,
    shipping: +r.shipping, discount: +r.discount, sig: r.has_sig || !!normalizeSignatureData(r.signature_data),
    signatureData: normalizeSignatureData(r.signature_data) || getStoredSignature(r.id),
    lines: lines.map(l => ({ id: l.id, code: l.item_code, qty: l.qty, price: +l.price })),
    status: canceled ? 'canceled' : (r.status || 'active'),
    canceled,
    canceledAt: r.canceled_at || cancelAudit.at || '',
    cancelReason: r.cancel_reason || cancelAudit.reason || '',
    audit,
  };
};

function soHeaderRow(so, signatureData, hasSignature) {
  return {
    date: so.date, cust_code: so.custCode,
    shipping: so.shipping || 0, discount: so.discount || 0,
    has_sig: hasSignature, signature_data: signatureData,
  };
}
function soLineRows(id, lines) {
  return (lines || []).map(l => ({ so_id: id, item_code: l.code, qty: +l.qty || 0, price: l.price || 0 }));
}

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
      const linesBySO = new Map();
      lines.forEach(l => {
        const group = linesBySO.get(l.so_id) || [];
        group.push(l);
        linesBySO.set(l.so_id, group);
      });
      setState({
        items:     (r1.data || []).map(mapItem),
        customers: (r2.data || []).map(mapCust),
        pos:       (r3.data || []).map(mapPO),
        sos:       (r4.data || []).map(r => mapSO(r, linesBySO.get(r.id))),
      });
    } catch (e) {
      console.error('ZG Store load error:', e);
      Toast.push('โหลดข้อมูลไม่สำเร็จ — ตรวจสอบ config.js', 'danger');
    } finally {
      setReady(true);
    }
  }

  useEffect(() => { loadAll(); }, []);

  const stockMap = useMemo(() => computeStock(state.items, state.pos, state.sos), [state.items, state.pos, state.sos]);

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

    async delPO(id) {
      const prevPOs = stateRef.current.pos;
      setState(s => ({ ...s, pos: s.pos.filter(p => p.id !== id) }));
      const { error } = await _db().from('purchase_orders').delete().eq('id', id);
      if (error) {
        setState(s => ({ ...s, pos: prevPOs }));
        Toast.push('ลบรายการรับเข้าไม่สำเร็จ: ' + error.message, 'danger');
        return false;
      }
      return true;
    },

    // ---- Sale Orders ----
    async addSO(so) {
      const id = nextId('SO', stateRef.current.sos);
      const signatureData = normalizeSignatureData(so.signatureData);
      const hasSignature = !!so.sig || !!signatureData;
      const nextSO = { ...so, id, sig: hasSignature, signatureData, audit: [] };
      setState(s => ({ ...s, sos: [nextSO, ...s.sos] }));
      const headerRow = {
        id, date: so.date, cust_code: so.custCode,
        shipping: so.shipping || 0, discount: so.discount || 0,
        has_sig: hasSignature, signature_data: signatureData,
      };
      let { error: e1 } = await _db().from('sale_orders').insert(headerRow);
      if (isMissingSignatureColumn(e1)) {
        const fallbackRow = {
          id: headerRow.id, date: headerRow.date, cust_code: headerRow.cust_code,
          shipping: headerRow.shipping, discount: headerRow.discount, has_sig: headerRow.has_sig,
        };
        ({ error: e1 } = await _db().from('sale_orders').insert(fallbackRow));
      }
      if (e1) {
        setState(s => ({ ...s, sos: s.sos.filter(x => x.id !== id) }));
        Toast.push('บันทึก SO ไม่สำเร็จ: ' + e1.message, 'danger');
        return false;
      }
      saveStoredSignature(id, signatureData);
      if (so.lines && so.lines.length > 0) {
        const rows = so.lines.map(l => ({ so_id: id, item_code: l.code, qty: l.qty, price: l.price || 0 }));
        const { error: e2 } = await _db().from('sale_order_lines').insert(rows);
        if (e2) Toast.push('บันทึก line items บางส่วนไม่สำเร็จ', 'danger');
      }
      return true;
    },

    async updSO(id, patch, reason) {
      const cleanReason = String(reason || '').trim();
      if (!cleanReason) {
        Toast.push('กรุณาระบุเหตุผลการแก้ไข SO', 'danger');
        return false;
      }
      const prevSos = stateRef.current.sos;
      const oldSO = prevSos.find(s => s.id === id);
      if (!oldSO) return false;

      const signatureData = normalizeSignatureData(patch.signatureData) || normalizeSignatureData(oldSO.signatureData);
      const hasSignature = !!patch.sig || !!signatureData;
      const auditEntry = { action: 'edit', reason: cleanReason };
      const nextSO = {
        ...oldSO,
        ...patch,
        id,
        sig: hasSignature,
        signatureData,
        audit: [...(oldSO.audit || []), { at: new Date().toISOString(), ...auditEntry }],
      };

      setState(s => ({ ...s, sos: s.sos.map(so => so.id === id ? nextSO : so) }));

      const headerRow = soHeaderRow(nextSO, signatureData, hasSignature);
      let { error: e1 } = await _db().from('sale_orders').update(headerRow).eq('id', id);
      if (isMissingSignatureColumn(e1)) {
        const { signature_data, ...fallbackRow } = headerRow;
        ({ error: e1 } = await _db().from('sale_orders').update(fallbackRow).eq('id', id));
      }
      if (e1) {
        setState(s => ({ ...s, sos: prevSos }));
        Toast.push('แก้ไข SO ไม่สำเร็จ: ' + e1.message, 'danger');
        return false;
      }

      const { error: e2 } = await _db().from('sale_order_lines').delete().eq('so_id', id);
      if (e2) {
        setState(s => ({ ...s, sos: prevSos }));
        Toast.push('แก้ไขรายการสินค้าไม่สำเร็จ: ' + e2.message, 'danger');
        await loadAll();
        return false;
      }

      const newRows = soLineRows(id, nextSO.lines);
      if (newRows.length > 0) {
        const { error: e3 } = await _db().from('sale_order_lines').insert(newRows);
        if (e3) {
          await _db().from('sale_orders').update(soHeaderRow(oldSO, normalizeSignatureData(oldSO.signatureData), !!oldSO.sig)).eq('id', id);
          await _db().from('sale_order_lines').insert(soLineRows(id, oldSO.lines));
          setState(s => ({ ...s, sos: prevSos }));
          Toast.push('บันทึกรายการสินค้าใหม่ไม่สำเร็จ: ' + e3.message, 'danger');
          await loadAll();
          return false;
        }
      }

      saveStoredSignature(id, signatureData);
      appendStoredSOAudit(id, auditEntry);
      await loadAll();
      return true;
    },

    async cancelSO(id, reason) {
      const cleanReason = String(reason || '').trim();
      if (!cleanReason) {
        Toast.push('กรุณาระบุเหตุผลการยกเลิก SO', 'danger');
        return false;
      }
      const prevSos = stateRef.current.sos;
      const so = prevSos.find(s => s.id === id);
      if (!so) return false;

      const auditEntry = { action: 'cancel', reason: cleanReason };
      const canceledAt = new Date().toISOString();
      const canceledSO = {
        ...so,
        status: 'canceled',
        canceled: true,
        canceledAt,
        cancelReason: cleanReason,
        audit: [...(so.audit || []), { at: canceledAt, ...auditEntry }],
      };

      setState(s => ({ ...s, sos: s.sos.map(x => x.id === id ? canceledSO : x) }));
      let { error } = await _db().from('sale_orders').update({
        status: 'canceled',
        cancel_reason: cleanReason,
        canceled_at: canceledAt,
      }).eq('id', id);
      if (isMissingCancelColumns(error)) error = null;
      if (error) {
        setState(s => ({ ...s, sos: prevSos }));
        Toast.push('ยกเลิก SO ไม่สำเร็จ: ' + error.message, 'danger');
        return false;
      }
      appendStoredSOAudit(id, auditEntry);
      return true;
    },

    // Delete a single line from a Sale Order (one movement-history record).
    // If it was the last line, the whole SO header is removed too so no empty SO remains.
    async delSOLine(soId, lineId) {
      const prevSos = stateRef.current.sos;
      const so = prevSos.find(s => s.id === soId);
      if (!so) return false;
      const remaining = so.lines.filter(l => l.id !== lineId);

      if (remaining.length === 0) {
        setState(s => ({ ...s, sos: s.sos.filter(x => x.id !== soId) }));
        const { error } = await _db().from('sale_orders').delete().eq('id', soId);
        if (error) {
          setState(s => ({ ...s, sos: prevSos }));
          Toast.push('ลบรายการเบิกออกไม่สำเร็จ: ' + error.message, 'danger');
          return false;
        }
        removeStoredSignature(soId);
        return true;
      }

      setState(s => ({ ...s, sos: s.sos.map(x => x.id === soId ? { ...x, lines: remaining } : x) }));
      const { error } = await _db().from('sale_order_lines').delete().eq('id', lineId);
      if (error) {
        setState(s => ({ ...s, sos: prevSos }));
        Toast.push('ลบรายการเบิกออกไม่สำเร็จ: ' + error.message, 'danger');
        return false;
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

Object.assign(window, { useStore, soTotals, soTotalsFromMap, computeStock, nextId, getStoredSignature, getStoredSOAudit });
