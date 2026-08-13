// Stock Out (Sale Order) page

function buildSOPrintHTML(so, items, customers, lang) {
  const t = (th, en) => lang === 'en' ? en : th;
  const itemMap = new Map(items.map(i => [i.code, i]));
  const custMap = new Map(customers.map(c => [c.code, c]));
  const cust = custMap.get(so.custCode) || {};
  const subtotal = so.lines.reduce((s, l) => {
    const it = itemMap.get(l.code);
    return s + (it ? it.sell * l.qty : 0);
  }, 0);
  const net = subtotal + (so.shipping || 0) - (so.discount || 0);
  const savedSignature = typeof getStoredSignature === 'function' ? getStoredSignature(so.id) : '';
  const signatureData = typeof so.signatureData === 'string' && so.signatureData.startsWith('data:image/')
    ? so.signatureData
    : savedSignature;
  const signatureContent = signatureData
    ? `<img src="${signatureData}" alt="Recipient signature" style="max-width:100%;max-height:46px;object-fit:contain;display:block;" />`
    : (so.sig ? t('มีลายเซ็น', 'Signed') : t('ยังไม่ได้เซ็น', 'Not signed'));

  const lineRows = so.lines.map((l, idx) => {
    const it = itemMap.get(l.code) || {};
    const amt = (it.sell || 0) * l.qty;
    return `
      <tr>
        <td style="text-align:center">${String(idx + 1).padStart(2, '0')}</td>
        <td>${l.code}</td>
        <td>${it.name || '—'}</td>
        <td style="text-align:center">${it.unit || '—'}</td>
        <td style="text-align:right">${l.qty}</td>
        <td style="text-align:right">${fmtTHB(it.sell || 0)}</td>
        <td style="text-align:right">${fmtTHB(amt)}</td>
      </tr>`;
  }).join('');

  return `
    <div style="font-family:'Sarabun',sans-serif;max-width:720px;margin:0 auto;padding:24px;font-size:13px;color:#111;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
        <div>
          <div style="font-size:20px;font-weight:700;color:#1d4ed8;margin-bottom:2px;">ZG INDUSTRIES (THAILAND) LIMITED</div>
          <div style="font-size:11px;color:#6b7280;">500/69 Moo 2, Ta Sit, Pluak Daeng, Rayong 21140</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:18px;font-weight:700;">${t('ใบเบิกสินค้า / Sale Order', 'Sale Order / ใบเบิกสินค้า')}</div>
          <div style="font-size:13px;font-weight:600;color:#1d4ed8;">${so.id}</div>
          <div style="font-size:12px;color:#6b7280;">${t('วันที่', 'Date')} ${so.date}</div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:12.5px;">
        <tr style="background:#f3f4f6;">
          <td style="padding:6px 10px;width:22%;font-weight:600;">${t('รหัสลูกค้า', 'Customer Code')}</td>
          <td style="padding:6px 10px;">${so.custCode}</td>
          <td style="padding:6px 10px;width:22%;font-weight:600;">${t('ชื่อผู้รับสินค้า', 'Recipient Name')}</td>
          <td style="padding:6px 10px;">${cust.name || '—'}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px;font-weight:600;">${t('แผนก', 'Department')}</td>
          <td style="padding:6px 10px;">${cust.dept || '—'}</td>
          <td style="padding:6px 10px;font-weight:600;">${t('ตำแหน่ง', 'Position')}</td>
          <td style="padding:6px 10px;">${cust.pos || '—'}</td>
        </tr>
        <tr style="background:#f3f4f6;">
          <td style="padding:6px 10px;font-weight:600;">${t('ค่าขนส่ง', 'Shipping')}</td>
          <td style="padding:6px 10px;">${fmtTHB(so.shipping || 0)}</td>
          <td style="padding:6px 10px;font-weight:600;">${t('ส่วนลด', 'Discount')}</td>
          <td style="padding:6px 10px;">${fmtTHB(so.discount || 0)}</td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:12.5px;">
        <thead>
          <tr style="background:#1d4ed8;color:#fff;">
            <th style="padding:7px 10px;text-align:center;width:36px;">#</th>
            <th style="padding:7px 10px;text-align:left;">${t('รหัสสินค้า', 'Item Code')}</th>
            <th style="padding:7px 10px;text-align:left;">${t('ชื่อสินค้า', 'Item Name')}</th>
            <th style="padding:7px 10px;text-align:center;">${t('หน่วย', 'Unit')}</th>
            <th style="padding:7px 10px;text-align:right;">${t('จำนวน', 'Qty')}</th>
            <th style="padding:7px 10px;text-align:right;">${t('ราคา/หน่วย', 'Unit Price')}</th>
            <th style="padding:7px 10px;text-align:right;">${t('จำนวนเงิน', 'Amount')}</th>
          </tr>
        </thead>
        <tbody>
          ${lineRows}
        </tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-bottom:24px;">
        <table style="font-size:13px;border-collapse:collapse;min-width:260px;">
          <tr>
            <td style="padding:4px 12px 4px 0;color:#6b7280;">${t('ราคารวม / Subtotal', 'Subtotal / ราคารวม')}</td>
            <td style="padding:4px 0;text-align:right;font-family:monospace;">${fmtTHB(subtotal)}</td>
          </tr>
          <tr>
            <td style="padding:4px 12px 4px 0;color:#6b7280;">${t('ค่าขนส่ง / Shipping', 'Shipping / ค่าขนส่ง')}</td>
            <td style="padding:4px 0;text-align:right;font-family:monospace;">${fmtTHB(so.shipping || 0)}</td>
          </tr>
          <tr>
            <td style="padding:4px 12px 4px 0;color:#6b7280;">${t('ส่วนลด / Discount', 'Discount / ส่วนลด')}</td>
            <td style="padding:4px 0;text-align:right;font-family:monospace;">-${fmtTHB(so.discount || 0)}</td>
          </tr>
          <tr>
            <td colspan="2" style="border-top:2px solid #111;padding:0;"></td>
          </tr>
          <tr>
            <td style="padding:6px 12px 4px 0;font-weight:700;font-size:14px;">${t('ราคาสุทธิ / Net', 'Net / ราคาสุทธิ')}</td>
            <td style="padding:6px 0 4px 0;text-align:right;font-weight:700;font-size:16px;color:#1d4ed8;font-family:monospace;">${fmtTHB(net)}</td>
          </tr>
        </table>
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:32px;gap:24px;">
        <div style="flex:1;text-align:center;">
          <div style="border-top:1px solid #9ca3af;margin-top:48px;padding-top:6px;font-size:12px;color:#6b7280;">${t('ผู้เบิก / Requested by', 'Requested by / ผู้เบิก')}</div>
        </div>
        <div style="flex:1;text-align:center;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">${t('ลายเซ็นผู้รับสินค้า / Recipient signature', 'Recipient signature / ลายเซ็นผู้รับสินค้า')}</div>
          <div style="border:1px dashed #9ca3af;height:52px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;color:${so.sig ? '#16a34a' : '#ef4444'};">
            ${signatureContent}
          </div>
          <div style="border-top:1px solid #9ca3af;margin-top:8px;padding-top:6px;font-size:12px;color:#6b7280;">${t('ผู้รับสินค้า / Recipient', 'Recipient / ผู้รับสินค้า')}</div>
        </div>
        <div style="flex:1;text-align:center;">
          <div style="border-top:1px solid #9ca3af;margin-top:48px;padding-top:6px;font-size:12px;color:#6b7280;">${t('ผู้อนุมัติ / Approved by', 'Approved by / ผู้อนุมัติ')}</div>
        </div>
      </div>
    </div>`;
}

function SODetailModal({ so, items, customers, onClose, lang }) {
  const t = (th, en) => lang === 'en' ? en : th;
  const itemMap = new Map(items.map(i => [i.code, i]));
  const custMap = new Map(customers.map(c => [c.code, c]));
  const cust = custMap.get(so.custCode) || {};
  const subtotal = so.lines.reduce((s, l) => {
    const it = itemMap.get(l.code);
    return s + (it ? it.sell * l.qty : 0);
  }, 0);
  const net = subtotal + (so.shipping || 0) - (so.discount || 0);

  function handlePrint() {
    const html = buildSOPrintHTML(so, items, customers, lang);
    printWindow(`${t('ใบเบิกสินค้า', 'Sale Order')} ${so.id}`, html);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-card shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <div className="font-semibold text-[15px]">{t('รายละเอียดใบเบิกสินค้า', 'Sale Order Detail')}</div>
            <div className="text-[12px] text-ink-mute mt-0.5">Sale Order Detail — <span className="kbd">{so.id}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="info" size="sm" icon={<Icon.Print size={14}/>} onClick={handlePrint}>{t('พิมพ์', 'Print')}</Button>
            <IconButton icon={<Icon.X size={16}/>} onClick={onClose}/>
          </div>
        </div>

        {/* Modal body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* SO header info */}
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div className="bg-page rounded-lg p-3 space-y-1">
              <div className="label-cap text-ink-faint">{t('เลขที่ SO', 'SO Number')}</div>
              <div className="kbd font-semibold text-brand-700">{so.id}</div>
            </div>
            <div className="bg-page rounded-lg p-3 space-y-1">
              <div className="label-cap text-ink-faint">{t('วันที่', 'Date')}</div>
              <div>{so.date}</div>
            </div>
            <div className="bg-page rounded-lg p-3 space-y-1">
              <div className="label-cap text-ink-faint">{t('ชื่อผู้รับสินค้า', 'Recipient Name')}</div>
              <div>{cust.name || <span className="text-ink-faint">—</span>}</div>
            </div>
            <div className="bg-page rounded-lg p-3 space-y-1">
              <div className="label-cap text-ink-faint">{t('แผนก / Department', 'Department / แผนก')}</div>
              <div>{cust.dept || <span className="text-ink-faint">—</span>}</div>
            </div>
            <div className="bg-page rounded-lg p-3 space-y-1">
              <div className="label-cap text-ink-faint">{t('ตำแหน่ง / Position', 'Position / ตำแหน่ง')}</div>
              <div>{cust.pos || <span className="text-ink-faint">—</span>}</div>
            </div>
            <div className="bg-page rounded-lg p-3 space-y-1">
              <div className="label-cap text-ink-faint">{t('ลายเซ็น', 'Signature')}</div>
              <div className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${so.sig ? 'text-good-fg' : 'text-danger-fg'}`}>
                <span className={`h-2 w-2 rounded-full ${so.sig ? 'bg-good-fg' : 'bg-danger-fg'}`}/>
                {so.sig ? t('มีลายเซ็น', 'Signed') : t('ยังไม่ได้เซ็น', 'Not signed')}
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <div className="label-cap text-ink-faint mb-2">{t('รายการสินค้า', 'Items')}</div>
            <div className="rounded-lg border border-line overflow-hidden">
              <table className="w-full text-[12.5px]">
                <thead className="bg-page border-b border-line text-ink-mute">
                  <tr>
                    <th className="text-left font-medium px-3 py-2 label-cap w-8">#</th>
                    <th className="text-left font-medium px-3 py-2 label-cap">{t('รหัสสินค้า', 'Item Code')}</th>
                    <th className="text-left font-medium px-3 py-2 label-cap">{t('ชื่อสินค้า', 'Item Name')}</th>
                    <th className="text-center font-medium px-3 py-2 label-cap">{t('หน่วย', 'Unit')}</th>
                    <th className="text-right font-medium px-3 py-2 label-cap">{t('จำนวน', 'Qty')}</th>
                    <th className="text-right font-medium px-3 py-2 label-cap">{t('ราคา/หน่วย', 'Unit Price')}</th>
                    <th className="text-right font-medium px-3 py-2 label-cap">{t('จำนวนเงิน', 'Amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {so.lines.map((l, idx) => {
                    const it = itemMap.get(l.code) || {};
                    const amt = (it.sell || 0) * l.qty;
                    return (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-ink-faint kbd text-[11px]">{String(idx + 1).padStart(2, '0')}</td>
                        <td className="px-3 py-2 kbd">{l.code}</td>
                        <td className="px-3 py-2 text-ink-soft">{it.name || '—'}</td>
                        <td className="px-3 py-2 text-center text-ink-mute">{it.unit || '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{l.qty}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-ink-mute">{it.sell ? fmtTHB(it.sell) : '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{amt ? fmtTHB(amt) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-[13px]">
              <div className="flex justify-between text-ink-mute">
                <span>{t('ราคารวม / Subtotal', 'Subtotal / ราคารวม')}</span>
                <span className="kbd tabular-nums">{fmtTHB(subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-mute">
                <span>{t('ค่าขนส่ง / Shipping', 'Shipping / ค่าขนส่ง')}</span>
                <span className="kbd tabular-nums">{fmtTHB(so.shipping || 0)}</span>
              </div>
              <div className="flex justify-between text-ink-mute">
                <span>{t('ส่วนลด / Discount', 'Discount / ส่วนลด')}</span>
                <span className="kbd tabular-nums">-{fmtTHB(so.discount || 0)}</span>
              </div>
              <div className="h-px bg-line my-1"/>
              <div className="flex justify-between font-semibold text-[14px]">
                <span>{t('ราคาสุทธิ / Net', 'Net / ราคาสุทธิ')}</span>
                <span className="kbd text-brand-700 font-bold">{fmtTHB(net)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SOSaveConfirmation({ so, items, customers, onClose, onView, lang }) {
  const t = (th, en) => lang === 'en' ? en : th;
  const itemMap = new Map(items.map(i => [i.code, i]));
  const custMap = new Map(customers.map(c => [c.code, c]));
  const cust = custMap.get(so.custCode) || {};
  const subtotal = so.lines.reduce((sum, line) => {
    const item = itemMap.get(line.code);
    return sum + (item ? item.sell * line.qty : 0);
  }, 0);
  const net = subtotal + (so.shipping || 0) - (so.discount || 0);

  function handlePrint() {
    const html = buildSOPrintHTML(so, items, customers, lang);
    printWindow(`${t('ใบเบิกสินค้า', 'Sale Order')} ${so.id}`, html);
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative w-full max-w-lg overflow-hidden rounded-card border border-line bg-white shadow-2xl">
        <div className="px-5 py-5 border-b border-line bg-brand-50">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-card">
              <Icon.Check size={20}/>
            </div>
            <div className="min-w-0">
              <div className="text-[16px] font-semibold text-ink">{t('บันทึกใบเบิกสำเร็จ', 'Stock Out saved successfully')}</div>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="kbd text-[18px] font-bold text-brand-700">{so.id}</span>
                <Badge tone={so.sig ? 'good' : 'warn'} size="sm">
                  {so.sig ? t('มีลายเซ็น', 'Signed') : t('ยังไม่ได้เซ็น', 'Not signed')}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div className="rounded-lg border border-line bg-page p-3">
              <div className="label-cap text-ink-faint">{t('วันที่', 'Date')}</div>
              <div className="mt-1 tabular-nums">{so.date}</div>
            </div>
            <div className="rounded-lg border border-line bg-page p-3 text-right">
              <div className="label-cap text-ink-faint">{t('ราคาสุทธิ', 'Net Price')}</div>
              <div className="mt-1 kbd text-[16px] font-bold text-brand-700">{fmtTHB(net)}</div>
            </div>
            <div className="col-span-2 rounded-lg border border-line bg-page p-3">
              <div className="label-cap text-ink-faint">{t('ผู้รับสินค้า', 'Recipient')}</div>
              <div className="mt-1 font-medium">{cust.name || so.custCode}</div>
              <div className="mt-0.5 text-[12px] text-ink-mute">{cust.dept || '—'}{cust.pos ? ` · ${cust.pos}` : ''}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose}>{t('ปิด', 'Close')}</Button>
            <Button variant="soft" icon={<Icon.Eye size={15}/>} onClick={onView}>{t('ดูเอกสาร', 'View')}</Button>
            <Button variant="info" icon={<Icon.Print size={15}/>} onClick={handlePrint}>{t('พิมพ์ / PDF', 'Print / PDF')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function localISODate(date = new Date()) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function historyStartDate(range) {
  const today = new Date();
  if (range === 'today') return localISODate(today);
  if (range === 'week') {
    const start = new Date(today);
    const day = start.getDay();
    start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
    return localISODate(start);
  }
  if (range === 'month') {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  }
  return '';
}

function isSOInDateRange(so, range) {
  if (range === 'all') return true;
  const start = historyStartDate(range);
  const end = localISODate();
  return so.date >= start && so.date <= end;
}

function matchesSOHistorySearch(so, query, itemMap, custMap) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const c = custMap.get(so.custCode) || {};
  const itemText = (so.lines || []).map(line => {
    const item = itemMap.get(line.code) || {};
    return [line.code, item.name, item.nameEn, item.unit].filter(Boolean).join(' ');
  }).join(' ');
  return [
    so.id,
    so.date,
    so.custCode,
    c.name,
    c.dept,
    c.pos,
    itemText,
  ].filter(Boolean).join(' ').toLowerCase().includes(q);
}

function StockOutPage({ store, lang }) {
  const t = (th, en) => lang === 'en' ? en : th;
  const { state, actions } = store;

  const [date, setDate] = useState(todayISO());
  const [custCode, setCustCode] = useState('');
  const [lines, setLines] = useState([{ uid: 1, code:'', qty:1 }]);
  const [shipping, setShipping] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [sigData, setSigData] = useState(null);
  const [viewSO, setViewSO] = useState(null);
  const [savedSO, setSavedSO] = useState(null);
  const [saving, setSaving] = useState(false);
  const [historyRange, setHistoryRange] = useState('all');
  const [historySearch, setHistorySearch] = useState('');

  const itemMap = useMemo(() => new Map(state.items.map(i => [i.code, i])), [state.items]);
  const custMap = useMemo(() => new Map(state.customers.map(c => [c.code, c])), [state.customers]);
  const nextSO = useMemo(() => nextId('SO', state.sos), [state.sos]);
  const cust = custMap.get(custCode);

  const subtotal = useMemo(() => lines.reduce((s, l) => {
    const it = itemMap.get(l.code);
    return s + (it ? it.sell * (l.qty || 0) : 0);
  }, 0), [lines, itemMap]);
  const net = subtotal + (+shipping || 0) - (+discount || 0);

  function setLine(uid, patch) {
    setLines(ls => ls.map(l => l.uid === uid ? { ...l, ...patch } : l));
  }
  function addLine() {
    setLines(ls => [...ls, { uid: Math.max(0, ...ls.map(l => l.uid)) + 1, code:'', qty:1 }]);
  }
  function removeLine(uid) {
    setLines(ls => ls.length > 1 ? ls.filter(l => l.uid !== uid) : ls);
  }

  async function save(emitPdf=false) {
    if (saving) return;
    if (!custCode) { Toast.push(t('กรุณาเลือกลูกค้า/ผู้รับสินค้า', 'Please select a customer / recipient'), 'danger'); return; }
    const valid = lines.filter(l => l.code && itemMap.has(l.code) && l.qty > 0);
    if (valid.length === 0) { Toast.push(t('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ', 'Please add at least 1 item'), 'danger'); return; }
    const soData = {
      date, custCode, shipping: +shipping || 0, discount: +discount || 0, sig: !!sigData, signatureData: sigData,
      lines: valid.map(l => ({ code: l.code, qty: +l.qty })),
    };
    const soForPrint = { ...soData, id: nextSO };
    setSaving(true);
    let saved = false;
    try {
      saved = await actions.addSO(soData);
    } finally {
      setSaving(false);
    }
    if (!saved) return;
    setSavedSO(soForPrint);
    Toast.push(`${t('บันทึกใบเบิกสำเร็จ', 'Saved stock out')} ${nextSO}${emitPdf ? (t(' และเปิดเอกสารแล้ว', ' and opened document')) : ''}`);
    if (emitPdf) {
      setTimeout(() => {
        const html = buildSOPrintHTML(soForPrint, state.items, state.customers, lang);
        printWindow(`${t('ใบเบิกสินค้า', 'Sale Order')} ${nextSO}`, html);
      }, 150);
    }
    // reset
    setLines([{ uid: 1, code:'', qty:1 }]); setCustCode(''); setShipping(0); setDiscount(0); setSigData(null);
  }

  const historyFilters = [
    { value: 'all', label: t('ทั้งหมด', 'All') },
    { value: 'today', label: t('วันนี้', 'Today') },
    { value: 'week', label: t('สัปดาห์นี้', 'This Week') },
    { value: 'month', label: t('เดือนนี้', 'This Month') },
  ];
  const hasHistorySearch = historySearch.trim().length > 0;

  const filteredHistorySOs = useMemo(() => [...(state.sos || [])]
    .filter(so => isSOInDateRange(so, historyRange))
    .filter(so => matchesSOHistorySearch(so, historySearch, itemMap, custMap))
    .sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
  [state.sos, historyRange, historySearch, itemMap, custMap]);

  // SO history: most recent first, filtered by quick date range and search
  const recentSOs = useMemo(() => filteredHistorySOs.slice(0, 50), [filteredHistorySOs]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Out (Withdrawal)"
        titleTh={t('เบิกออก / ใบเบิกสินค้า', 'Stock Out / Withdrawal')}
        subtitle={t('สร้างใบเบิกสินค้าและออกเอกสาร SO พร้อมลายเซ็น', 'Create a withdrawal document with recipient signature')}
      />

      {/* Header info */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(430px,520px)] gap-4">
        <Card title={t('ข้อมูลใบขาย', 'Sale Order Info')} subtitle="Sale Order header"
          action={<Badge tone="brand" size="md" icon={<Icon.Hash size={11}/>}><span className="kbd">{nextSO}</span></Badge>}>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('เลขที่ SO', 'SO Number')}>
              <Input value={nextSO} readOnly prefix={<Icon.Hash size={13}/>}/>
            </Field>
            <Field label={t('วันที่ / Date', 'Date / วันที่')} required>
              <Input type="date" prefix={<Icon.Calendar size={13}/>}
                value={date} onChange={e => setDate(e.target.value)}/>
            </Field>
            <Field label={t('รหัสลูกค้า / Customer', 'Customer / รหัสลูกค้า')} required className="col-span-2">
              <Select value={custCode} onChange={e => setCustCode(e.target.value)}>
                <option value="">{t('เลือกผู้รับสินค้า...', 'Select recipient...')}</option>
                {state.customers.map(c => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.dept})</option>
                ))}
              </Select>
            </Field>
            <Field label={t('ชื่อผู้รับ / Name', 'Name / ชื่อผู้รับ')}>
              <Input value={cust?.name || ''} readOnly placeholder="—"/>
            </Field>
            <Field label={t('ตำแหน่ง / Position', 'Position / ตำแหน่ง')}>
              <Input value={cust?.pos || ''} readOnly placeholder="—"/>
            </Field>
            <Field label={t('แผนก / Department', 'Department / แผนก')} className="col-span-2">
              <Input value={cust?.dept || ''} readOnly placeholder="—"/>
            </Field>
          </div>
        </Card>

        {/* Signature pad */}
        <Card className="xl:min-h-full" title={t('ลายเซ็นผู้รับสินค้า', 'Recipient Signature')} subtitle="Recipient signature" padded={false}>
          <div className="p-5 md:p-6">
            <SignaturePad value={sigData} onChange={setSigData} lang={lang}/>
            <p className="mt-2 text-[12px] text-ink-mute">{t('เซ็นชื่อด้วยปากกา/นิ้วบนหน้าจอ', 'Sign with pen or finger on screen')}</p>
          </div>
        </Card>
      </div>

      {/* Line items */}
      <Card padded={false} title={t('รายการสินค้าที่เบิก', 'Items to Withdraw')} subtitle="Line items"
        action={<Button variant="soft" size="sm" icon={<Icon.Plus size={14}/>} onClick={addLine}>{t('เพิ่มสินค้า', 'Add Item')}</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead className="bg-page border-y border-line text-ink-mute">
              <tr>
                <th className="text-left font-medium px-3 py-2.5 label-cap w-10">#</th>
                <th className="text-left font-medium px-3 py-2.5 label-cap w-[180px]">{t('รหัสสินค้า', 'Item Code')}</th>
                <th className="text-left font-medium px-3 py-2.5 label-cap">{t('ชื่อสินค้า', 'Item Name')}</th>
                <th className="text-right font-medium px-3 py-2.5 label-cap w-[120px]">{t('ราคาขาย', 'Sell Price')}</th>
                <th className="text-right font-medium px-3 py-2.5 label-cap w-[120px]">{t('จำนวน', 'Qty')}</th>
                <th className="text-right font-medium px-3 py-2.5 label-cap w-[140px]">{t('จำนวนเงิน', 'Amount')}</th>
                <th className="px-3 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {lines.map((l, idx) => {
                const it = itemMap.get(l.code);
                const amt = (it?.sell || 0) * (l.qty || 0);
                return (
                  <tr key={l.uid}>
                    <td className="px-3 py-2 text-ink-faint kbd text-[12px]">{String(idx+1).padStart(2,'0')}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Input prefix={<Icon.QR size={13}/>} placeholder="ITM-..." className="w-full"
                          value={l.code} onChange={e => setLine(l.uid, { code: e.target.value })}
                          list="so-item-codes"/>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-ink-soft">
                      {it ? (
                        <span>{it.name} <span className="text-ink-faint text-[12px]">· {it.unit}</span></span>
                      ) : <span className="text-ink-faint">— {t('ป้อนรหัสสินค้า', 'Enter item code')} —</span>}
                    </td>
                    <td className="px-3 py-2 text-right kbd tabular-nums text-ink-mute">{it ? fmtTHB(it.sell) : '—'}</td>
                    <td className="px-3 py-2">
                      <Input type="number" min="1" value={l.qty}
                        className="text-right tabular-nums"
                        onChange={e => setLine(l.uid, { qty: +e.target.value })}/>
                    </td>
                    <td className="px-3 py-2 text-right kbd font-semibold tabular-nums">{amt ? fmtTHB(amt) : '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <IconButton tone="danger" icon={<Icon.Trash size={15}/>} onClick={() => removeLine(l.uid)}/>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <datalist id="so-item-codes">
            {state.items.map(i => <option key={i.code} value={i.code}>{i.name}</option>)}
          </datalist>
        </div>

        {/* Summary */}
        <div className="px-5 py-4 border-t border-line flex justify-end">
          <div className="w-full max-w-sm space-y-2.5 text-[14px]">
            <div className="flex items-center justify-between">
              <span className="text-ink-mute">{t('ราคารวม / Subtotal', 'Subtotal / ราคารวม')}</span>
              <span className="kbd tabular-nums">{fmtTHB(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-mute">{t('ค่าขนส่ง / Shipping', 'Shipping / ค่าขนส่ง')}</span>
              <Input type="number" className="w-32" value={shipping} prefix="฿"
                onChange={e => setShipping(+e.target.value)}/>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-mute">{t('ส่วนลดพิเศษ / Discount', 'Discount / ส่วนลดพิเศษ')}</span>
              <Input type="number" className="w-32" value={discount} prefix="฿"
                onChange={e => setDiscount(+e.target.value)}/>
            </div>
            <div className="h-px bg-line my-2"/>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{t('ราคาสุทธิ / Net', 'Net / ราคาสุทธิ')}</span>
              <span className="kbd text-[20px] font-bold text-brand-700 tabular-nums">{fmtTHB(net)}</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-line flex items-center justify-end gap-2 bg-page rounded-b-card">
          <Button variant="ghost" onClick={() => { setLines([{uid:1,code:'',qty:1}]); setCustCode(''); setShipping(0); setDiscount(0); setSigData(null); }}>{t('ยกเลิก', 'Cancel')}</Button>
          <Button variant="info" icon={<Icon.PDF size={15}/>} disabled={saving} onClick={() => save(true)}>{saving ? t('กำลังบันทึก...', 'Saving...') : t('สร้างเอกสาร PDF', 'Create PDF')}</Button>
          <Button variant="primary" icon={<Icon.Save size={15}/>} disabled={saving} onClick={() => save(false)}>{saving ? t('กำลังบันทึก...', 'Saving...') : t('บันทึก SO', 'Save SO')}</Button>
        </div>
      </Card>

      {/* Withdrawal history */}
      <Card
        padded={false}
        title={t('ประวัติการเบิกสินค้า', 'Withdrawal History')}
        subtitle={t('Recent withdrawals', 'Recent withdrawals')}
        action={
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 max-w-[min(76vw,760px)]">
            <Badge tone="neutral" size="md">
              <span className="kbd">{fmtInt(filteredHistorySOs.length)}</span>
              <span>{t('รายการ', 'records')}</span>
            </Badge>
            <Input
              className="w-full lg:w-[250px]"
              prefix={<Icon.Search size={14}/>}
              placeholder={t('ค้นหา SO / ผู้รับ / สินค้า...', 'Search SO / recipient / item...')}
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              suffix={historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch('')}
                  className="rounded-md p-0.5 text-ink-faint hover:text-ink hover:bg-page"
                  title={t('ล้างคำค้นหา', 'Clear search')}>
                  <Icon.X size={13}/>
                </button>
              )}
            />
            <div className="inline-flex max-w-full overflow-x-auto scrollbar-thin items-center gap-1 rounded-lg border border-line bg-page p-1">
              {historyFilters.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setHistoryRange(filter.value)}
                  className={`h-8 px-3 rounded-md text-[12.5px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                    historyRange === filter.value
                      ? 'bg-white text-brand-700 shadow-sm border border-line'
                      : 'text-ink-mute hover:text-ink hover:bg-white/60'
                  }`}>
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        }>
        {recentSOs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-ink-faint gap-2">
            <Icon.PDF size={32}/>
            <p className="text-[13px]">
              {historyRange === 'all'
                ? hasHistorySearch
                  ? t('ไม่พบประวัติการเบิกที่ตรงกับคำค้นหา', 'No withdrawals match your search')
                  : t('ยังไม่มีประวัติการเบิกสินค้า', 'No withdrawals yet')
                : hasHistorySearch
                  ? t('ไม่พบประวัติการเบิกที่ตรงกับคำค้นหาในช่วงวันที่นี้', 'No matching withdrawals in this date range')
                  : t('ไม่พบประวัติการเบิกในช่วงวันที่นี้', 'No withdrawals in this date range')}
            </p>
            <p className="text-[12px] text-ink-faint/60">
              {historyRange === 'all'
                ? hasHistorySearch
                  ? t('ลองค้นหาด้วยเลข SO ชื่อผู้รับ หรือรหัสสินค้า', 'Try SO number, recipient name, or item code')
                  : t('สร้างใบเบิกแรกด้านบน', 'Create your first withdrawal above')
                : hasHistorySearch
                  ? t('ล้างคำค้นหาหรือเลือกทั้งหมดเพื่อขยายผลลัพธ์', 'Clear search or choose All to widen results')
                  : t('เลือกทั้งหมดเพื่อดูรายการเก่ากว่า', 'Choose All to see older records')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-page border-y border-line text-ink-mute">
                <tr>
                  <th className="text-left font-medium px-3 py-2.5 label-cap">{t('เลขที่ SO', 'SO Number')}</th>
                  <th className="text-left font-medium px-3 py-2.5 label-cap">{t('วันที่', 'Date')}</th>
                  <th className="text-left font-medium px-3 py-2.5 label-cap">{t('ผู้รับสินค้า', 'Recipient')}</th>
                  <th className="text-right font-medium px-3 py-2.5 label-cap">{t('จำนวนรายการ', 'Items')}</th>
                  <th className="text-right font-medium px-3 py-2.5 label-cap">{t('ราคาสุทธิ', 'Net Price')}</th>
                  <th className="text-center font-medium px-3 py-2.5 label-cap">{t('ลายเซ็น', 'Signature')}</th>
                  <th className="text-center font-medium px-3 py-2.5 label-cap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentSOs.map(so => {
                  const c = custMap.get(so.custCode) || {};
                  const soSubtotal = so.lines.reduce((s, l) => {
                    const it = itemMap.get(l.code);
                    return s + (it ? it.sell * l.qty : 0);
                  }, 0);
                  const soNet = soSubtotal + (so.shipping || 0) - (so.discount || 0);
                  return (
                    <tr key={so.id} className="hover:bg-page/60 transition-colors">
                      <td className="px-3 py-2.5 kbd text-brand-700 font-semibold">{so.id}</td>
                      <td className="px-3 py-2.5 text-ink-soft tabular-nums">{so.date}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium">{c.name || so.custCode}</div>
                        {c.dept && <div className="text-[11px] text-ink-faint">{c.dept}</div>}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-mute">{so.lines.length}</td>
                      <td className="px-3 py-2.5 text-right kbd tabular-nums font-semibold">{fmtTHB(soNet)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-full ${so.sig ? 'bg-good-bg text-good-fg' : 'bg-danger-bg text-danger-fg'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${so.sig ? 'bg-good-fg' : 'bg-danger-fg'}`}/>
                          {so.sig ? t('มีลายเซ็น', 'Signed') : t('ยังไม่ได้เซ็น', 'Not signed')}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="inline-flex items-center gap-1">
                          <Button variant="soft" size="xs" icon={<Icon.Eye size={13}/>}
                            onClick={() => setViewSO(so)}>{t('ดู', 'View')}</Button>
                          <Button variant="ghost" size="xs" icon={<Icon.Print size={13}/>}
                            onClick={() => {
                              const html = buildSOPrintHTML(so, state.items, state.customers, lang);
                              printWindow(`${t('ใบเบิกสินค้า', 'Sale Order')} ${so.id}`, html);
                            }}>{t('พิมพ์', 'Print')}</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* SO Detail Modal */}
      {viewSO && (
        <SODetailModal
          so={viewSO}
          items={state.items}
          customers={state.customers}
          onClose={() => setViewSO(null)}
          lang={lang}
        />
      )}

      {savedSO && (
        <SOSaveConfirmation
          so={savedSO}
          items={state.items}
          customers={state.customers}
          onClose={() => setSavedSO(null)}
          onView={() => { setViewSO(savedSO); setSavedSO(null); }}
          lang={lang}
        />
      )}
    </div>
  );
}

function SignaturePad({ value, onChange, lang }) {
  const t = (th, en) => lang === 'en' ? en : th;
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    function prepareCanvas() {
      const ctx = cv.getContext('2d');
      const ratio = window.devicePixelRatio || 1;
      const rect = cv.getBoundingClientRect();
      cv.width = rect.width * ratio;
      cv.height = rect.height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const isDark = document.documentElement.classList.contains('dark');
      ctx.strokeStyle = isDark ? '#E5E7EB' : '#1A1A2E';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (value) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = value;
      }
    }

    prepareCanvas();
    window.addEventListener('resize', prepareCanvas);
    return () => window.removeEventListener('resize', prepareCanvas);
  }, [value]);

  function pos(e) {
    const cv = canvasRef.current;
    const rect = cv.getBoundingClientRect();
    const t = e.touches?.[0];
    const x = (t ? t.clientX : e.clientX) - rect.left;
    const y = (t ? t.clientY : e.clientY) - rect.top;
    return { x, y };
  }
  function start(e) { e.preventDefault(); drawing.current = true; last.current = pos(e); }
  function move(e)  {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last.current = p;
  }
  function end() { if (!drawing.current) return; drawing.current = false; onChange(canvasRef.current.toDataURL()); }
  function clear() {
    const cv = canvasRef.current; const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    onChange(null);
  }

  return (
    <div>
      <div className="relative rounded-lg border border-line2 bg-white overflow-hidden">
        <canvas ref={canvasRef}
          className="block w-full h-52 sm:h-60 md:h-72 xl:h-[300px] touch-none"
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
        {!value && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-ink-faint text-[12.5px]">{t('เซ็นชื่อผู้รับสินค้า / Sign here', 'Sign here / เซ็นชื่อผู้รับสินค้า')}</p>
          </div>
        )}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${value?'bg-brand-500':'bg-ink-faint/40'}`}/>
            <span className="text-[11px] text-ink-mute">{value ? t('มีลายเซ็นแล้ว', 'Signed') : t('ยังไม่ได้เซ็น', 'Not signed')}</span>
          </div>
          <button onClick={clear} className="text-[11.5px] text-ink-mute hover:text-danger-fg inline-flex items-center gap-1">
            <Icon.X size={12}/> {t('ล้าง', 'Clear')}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StockOutPage, SignaturePad, SODetailModal });
