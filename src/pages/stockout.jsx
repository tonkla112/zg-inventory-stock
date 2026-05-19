// Stock Out (Sale Order) page

function buildSOPrintHTML(so, items, customers) {
  const itemMap = new Map(items.map(i => [i.code, i]));
  const custMap = new Map(customers.map(c => [c.code, c]));
  const cust = custMap.get(so.custCode) || {};
  const subtotal = so.lines.reduce((s, l) => {
    const it = itemMap.get(l.code);
    return s + (it ? it.sell * l.qty : 0);
  }, 0);
  const net = subtotal + (so.shipping || 0) - (so.discount || 0);

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
          <div style="font-size:18px;font-weight:700;">ใบเบิกสินค้า / Sale Order</div>
          <div style="font-size:13px;font-weight:600;color:#1d4ed8;">${so.id}</div>
          <div style="font-size:12px;color:#6b7280;">วันที่ ${so.date}</div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:12.5px;">
        <tr style="background:#f3f4f6;">
          <td style="padding:6px 10px;width:22%;font-weight:600;">รหัสลูกค้า</td>
          <td style="padding:6px 10px;">${so.custCode}</td>
          <td style="padding:6px 10px;width:22%;font-weight:600;">ชื่อผู้รับสินค้า</td>
          <td style="padding:6px 10px;">${cust.name || '—'}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px;font-weight:600;">แผนก</td>
          <td style="padding:6px 10px;">${cust.dept || '—'}</td>
          <td style="padding:6px 10px;font-weight:600;">ตำแหน่ง</td>
          <td style="padding:6px 10px;">${cust.pos || '—'}</td>
        </tr>
        <tr style="background:#f3f4f6;">
          <td style="padding:6px 10px;font-weight:600;">ค่าขนส่ง</td>
          <td style="padding:6px 10px;">${fmtTHB(so.shipping || 0)}</td>
          <td style="padding:6px 10px;font-weight:600;">ส่วนลด</td>
          <td style="padding:6px 10px;">${fmtTHB(so.discount || 0)}</td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:12.5px;">
        <thead>
          <tr style="background:#1d4ed8;color:#fff;">
            <th style="padding:7px 10px;text-align:center;width:36px;">#</th>
            <th style="padding:7px 10px;text-align:left;">รหัสสินค้า</th>
            <th style="padding:7px 10px;text-align:left;">ชื่อสินค้า</th>
            <th style="padding:7px 10px;text-align:center;">หน่วย</th>
            <th style="padding:7px 10px;text-align:right;">จำนวน</th>
            <th style="padding:7px 10px;text-align:right;">ราคา/หน่วย</th>
            <th style="padding:7px 10px;text-align:right;">จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          ${lineRows}
        </tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-bottom:24px;">
        <table style="font-size:13px;border-collapse:collapse;min-width:260px;">
          <tr>
            <td style="padding:4px 12px 4px 0;color:#6b7280;">ราคารวม / Subtotal</td>
            <td style="padding:4px 0;text-align:right;font-family:monospace;">${fmtTHB(subtotal)}</td>
          </tr>
          <tr>
            <td style="padding:4px 12px 4px 0;color:#6b7280;">ค่าขนส่ง / Shipping</td>
            <td style="padding:4px 0;text-align:right;font-family:monospace;">${fmtTHB(so.shipping || 0)}</td>
          </tr>
          <tr>
            <td style="padding:4px 12px 4px 0;color:#6b7280;">ส่วนลด / Discount</td>
            <td style="padding:4px 0;text-align:right;font-family:monospace;">-${fmtTHB(so.discount || 0)}</td>
          </tr>
          <tr>
            <td colspan="2" style="border-top:2px solid #111;padding:0;"></td>
          </tr>
          <tr>
            <td style="padding:6px 12px 4px 0;font-weight:700;font-size:14px;">ราคาสุทธิ / Net</td>
            <td style="padding:6px 0 4px 0;text-align:right;font-weight:700;font-size:16px;color:#1d4ed8;font-family:monospace;">${fmtTHB(net)}</td>
          </tr>
        </table>
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:32px;gap:24px;">
        <div style="flex:1;text-align:center;">
          <div style="border-top:1px solid #9ca3af;margin-top:48px;padding-top:6px;font-size:12px;color:#6b7280;">ผู้เบิก / Requested by</div>
        </div>
        <div style="flex:1;text-align:center;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">ลายเซ็นผู้รับสินค้า / Recipient signature</div>
          <div style="border:1px dashed #9ca3af;height:52px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;color:${so.sig ? '#16a34a' : '#ef4444'};">
            ${so.sig ? 'มีลายเซ็น' : 'ยังไม่ได้เซ็น'}
          </div>
          <div style="border-top:1px solid #9ca3af;margin-top:8px;padding-top:6px;font-size:12px;color:#6b7280;">ผู้รับสินค้า / Recipient</div>
        </div>
        <div style="flex:1;text-align:center;">
          <div style="border-top:1px solid #9ca3af;margin-top:48px;padding-top:6px;font-size:12px;color:#6b7280;">ผู้อนุมัติ / Approved by</div>
        </div>
      </div>
    </div>`;
}

function SODetailModal({ so, items, customers, onClose }) {
  const itemMap = new Map(items.map(i => [i.code, i]));
  const custMap = new Map(customers.map(c => [c.code, c]));
  const cust = custMap.get(so.custCode) || {};
  const subtotal = so.lines.reduce((s, l) => {
    const it = itemMap.get(l.code);
    return s + (it ? it.sell * l.qty : 0);
  }, 0);
  const net = subtotal + (so.shipping || 0) - (so.discount || 0);

  function handlePrint() {
    const html = buildSOPrintHTML(so, items, customers);
    printWindow(`ใบเบิกสินค้า ${so.id}`, html);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-surface rounded-card shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <div className="font-semibold text-[15px]">รายละเอียดใบเบิกสินค้า</div>
            <div className="text-[12px] text-ink-mute mt-0.5">Sale Order Detail — <span className="kbd">{so.id}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="info" size="sm" icon={<Icon.Printer size={14}/>} onClick={handlePrint}>พิมพ์</Button>
            <IconButton icon={<Icon.X size={16}/>} onClick={onClose}/>
          </div>
        </div>

        {/* Modal body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* SO header info */}
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div className="bg-page rounded-lg p-3 space-y-1">
              <div className="label-cap text-ink-faint">เลขที่ SO</div>
              <div className="kbd font-semibold text-brand-700">{so.id}</div>
            </div>
            <div className="bg-page rounded-lg p-3 space-y-1">
              <div className="label-cap text-ink-faint">วันที่</div>
              <div>{so.date}</div>
            </div>
            <div className="bg-page rounded-lg p-3 space-y-1">
              <div className="label-cap text-ink-faint">ชื่อผู้รับสินค้า</div>
              <div>{cust.name || <span className="text-ink-faint">—</span>}</div>
            </div>
            <div className="bg-page rounded-lg p-3 space-y-1">
              <div className="label-cap text-ink-faint">แผนก / Department</div>
              <div>{cust.dept || <span className="text-ink-faint">—</span>}</div>
            </div>
            <div className="bg-page rounded-lg p-3 space-y-1">
              <div className="label-cap text-ink-faint">ตำแหน่ง / Position</div>
              <div>{cust.pos || <span className="text-ink-faint">—</span>}</div>
            </div>
            <div className="bg-page rounded-lg p-3 space-y-1">
              <div className="label-cap text-ink-faint">ลายเซ็น</div>
              <div className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${so.sig ? 'text-success-fg' : 'text-danger-fg'}`}>
                <span className={`h-2 w-2 rounded-full ${so.sig ? 'bg-success-fg' : 'bg-danger-fg'}`}/>
                {so.sig ? 'มีลายเซ็น' : 'ยังไม่ได้เซ็น'}
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <div className="label-cap text-ink-faint mb-2">รายการสินค้า</div>
            <div className="rounded-lg border border-line overflow-hidden">
              <table className="w-full text-[12.5px]">
                <thead className="bg-page border-b border-line text-ink-mute">
                  <tr>
                    <th className="text-left font-medium px-3 py-2 label-cap w-8">#</th>
                    <th className="text-left font-medium px-3 py-2 label-cap">รหัสสินค้า</th>
                    <th className="text-left font-medium px-3 py-2 label-cap">ชื่อสินค้า</th>
                    <th className="text-center font-medium px-3 py-2 label-cap">หน่วย</th>
                    <th className="text-right font-medium px-3 py-2 label-cap">จำนวน</th>
                    <th className="text-right font-medium px-3 py-2 label-cap">ราคา/หน่วย</th>
                    <th className="text-right font-medium px-3 py-2 label-cap">จำนวนเงิน</th>
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
                <span>ราคารวม / Subtotal</span>
                <span className="kbd tabular-nums">{fmtTHB(subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-mute">
                <span>ค่าขนส่ง / Shipping</span>
                <span className="kbd tabular-nums">{fmtTHB(so.shipping || 0)}</span>
              </div>
              <div className="flex justify-between text-ink-mute">
                <span>ส่วนลด / Discount</span>
                <span className="kbd tabular-nums">-{fmtTHB(so.discount || 0)}</span>
              </div>
              <div className="h-px bg-line my-1"/>
              <div className="flex justify-between font-semibold text-[14px]">
                <span>ราคาสุทธิ / Net</span>
                <span className="kbd text-brand-700 font-bold">{fmtTHB(net)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StockOutPage({ store }) {
  const { state, actions } = store;
  const itemMap = new Map(state.items.map(i => [i.code, i]));
  const custMap = new Map(state.customers.map(c => [c.code, c]));

  const [date, setDate] = useState(todayISO());
  const [custCode, setCustCode] = useState('');
  const [lines, setLines] = useState([{ uid: 1, code:'', qty:1 }]);
  const [shipping, setShipping] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [sigData, setSigData] = useState(null);
  const [viewSO, setViewSO] = useState(null);

  const nextSO = nextId('SO', state.sos);
  const cust = custMap.get(custCode);

  const subtotal = lines.reduce((s, l) => {
    const it = itemMap.get(l.code);
    return s + (it ? it.sell * (l.qty || 0) : 0);
  }, 0);
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

  function save(emitPdf=false) {
    if (!custCode) { Toast.push('กรุณาเลือกลูกค้า/ผู้รับสินค้า', 'danger'); return; }
    const valid = lines.filter(l => l.code && itemMap.has(l.code) && l.qty > 0);
    if (valid.length === 0) { Toast.push('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ', 'danger'); return; }
    const soData = {
      date, custCode, shipping: +shipping || 0, discount: +discount || 0, sig: !!sigData,
      lines: valid.map(l => ({ code: l.code, qty: +l.qty })),
    };
    actions.addSO(soData);
    Toast.push(`บันทึกใบขาย ${nextSO}${emitPdf ? ' และสร้างเอกสารแล้ว' : ''}`);
    if (emitPdf) {
      const soForPrint = { ...soData, id: nextSO };
      setTimeout(() => {
        const html = buildSOPrintHTML(soForPrint, state.items, state.customers);
        printWindow(`ใบเบิกสินค้า ${nextSO}`, html);
      }, 150);
    }
    // reset
    setLines([{ uid: 1, code:'', qty:1 }]); setCustCode(''); setShipping(0); setDiscount(0); setSigData(null);
  }

  // SO history: most recent first, limit 20
  const recentSOs = [...(state.sos || [])].reverse().slice(0, 20);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Out (Sale Order)"
        titleTh="เบิกออก / ใบขาย"
        subtitle="สร้างใบเบิกสินค้าและออกเอกสาร SO พร้อมลายเซ็น"
      />

      {/* Header info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" title="ข้อมูลใบขาย" subtitle="Sale Order header"
          action={<Badge tone="brand" size="md" icon={<Icon.Hash size={11}/>}><span className="kbd">{nextSO}</span></Badge>}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="เลขที่ SO">
              <Input value={nextSO} readOnly prefix={<Icon.Hash size={13}/>}/>
            </Field>
            <Field label="วันที่ / Date" required>
              <Input type="date" prefix={<Icon.Calendar size={13}/>}
                value={date} onChange={e => setDate(e.target.value)}/>
            </Field>
            <Field label="รหัสลูกค้า / Customer" required className="col-span-2">
              <Select value={custCode} onChange={e => setCustCode(e.target.value)}>
                <option value="">เลือกผู้รับสินค้า...</option>
                {state.customers.map(c => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.dept})</option>
                ))}
              </Select>
            </Field>
            <Field label="ชื่อผู้รับ / Name">
              <Input value={cust?.name || ''} readOnly placeholder="—"/>
            </Field>
            <Field label="ตำแหน่ง / Position">
              <Input value={cust?.pos || ''} readOnly placeholder="—"/>
            </Field>
            <Field label="แผนก / Department" className="col-span-2">
              <Input value={cust?.dept || ''} readOnly placeholder="—"/>
            </Field>
          </div>
        </Card>

        {/* Signature pad */}
        <Card title="ลายเซ็นผู้รับสินค้า" subtitle="Recipient signature" padded={false}>
          <div className="p-5">
            <SignaturePad value={sigData} onChange={setSigData}/>
            <p className="mt-2 text-[12px] text-ink-mute">เซ็นชื่อด้วยปากกา/นิ้วบนหน้าจอ</p>
          </div>
        </Card>
      </div>

      {/* Line items */}
      <Card padded={false} title="รายการสินค้าที่เบิก" subtitle="Line items"
        action={<Button variant="soft" size="sm" icon={<Icon.Plus size={14}/>} onClick={addLine}>เพิ่มสินค้า</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead className="bg-page border-y border-line text-ink-mute">
              <tr>
                <th className="text-left font-medium px-3 py-2.5 label-cap w-10">#</th>
                <th className="text-left font-medium px-3 py-2.5 label-cap w-[180px]">รหัสสินค้า</th>
                <th className="text-left font-medium px-3 py-2.5 label-cap">ชื่อสินค้า</th>
                <th className="text-right font-medium px-3 py-2.5 label-cap w-[120px]">ราคาขาย</th>
                <th className="text-right font-medium px-3 py-2.5 label-cap w-[120px]">จำนวน</th>
                <th className="text-right font-medium px-3 py-2.5 label-cap w-[140px]">จำนวนเงิน</th>
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
                      ) : <span className="text-ink-faint">— ป้อนรหัสสินค้า —</span>}
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
              <span className="text-ink-mute">ราคารวม / Subtotal</span>
              <span className="kbd tabular-nums">{fmtTHB(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-mute">ค่าขนส่ง / Shipping</span>
              <Input type="number" className="w-32" value={shipping} prefix="฿"
                onChange={e => setShipping(+e.target.value)}/>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-mute">ส่วนลดพิเศษ / Discount</span>
              <Input type="number" className="w-32" value={discount} prefix="฿"
                onChange={e => setDiscount(+e.target.value)}/>
            </div>
            <div className="h-px bg-line my-2"/>
            <div className="flex items-center justify-between">
              <span className="font-semibold">ราคาสุทธิ / Net</span>
              <span className="kbd text-[20px] font-bold text-brand-700 tabular-nums">{fmtTHB(net)}</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-line flex items-center justify-end gap-2 bg-page rounded-b-card">
          <Button variant="ghost" onClick={() => { setLines([{uid:1,code:'',qty:1}]); setCustCode(''); setShipping(0); setDiscount(0); setSigData(null); }}>ยกเลิก</Button>
          <Button variant="info" icon={<Icon.PDF size={15}/>} onClick={() => save(true)}>สร้างเอกสาร PDF</Button>
          <Button variant="primary" icon={<Icon.Save size={15}/>} onClick={() => save(false)}>บันทึก SO</Button>
        </div>
      </Card>

      {/* SO History */}
      <Card padded={false} title="ประวัติใบเบิกสินค้า" subtitle="Recent sale orders">
        {recentSOs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-ink-faint gap-2">
            <Icon.FileText size={32}/>
            <p className="text-[13px]">ยังไม่มีใบเบิกสินค้า</p>
            <p className="text-[12px] text-ink-faint/60">สร้าง SO แรกด้านบน</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-page border-y border-line text-ink-mute">
                <tr>
                  <th className="text-left font-medium px-3 py-2.5 label-cap">เลขที่ SO</th>
                  <th className="text-left font-medium px-3 py-2.5 label-cap">วันที่</th>
                  <th className="text-left font-medium px-3 py-2.5 label-cap">ผู้รับสินค้า</th>
                  <th className="text-right font-medium px-3 py-2.5 label-cap">จำนวนรายการ</th>
                  <th className="text-right font-medium px-3 py-2.5 label-cap">ราคาสุทธิ</th>
                  <th className="text-center font-medium px-3 py-2.5 label-cap">ลายเซ็น</th>
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
                        <span className={`inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-full ${so.sig ? 'bg-success-subtle text-success-fg' : 'bg-danger-subtle text-danger-fg'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${so.sig ? 'bg-success-fg' : 'bg-danger-fg'}`}/>
                          {so.sig ? 'มีลายเซ็น' : 'ยังไม่ได้เซ็น'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="inline-flex items-center gap-1">
                          <Button variant="soft" size="xs" icon={<Icon.Eye size={13}/>}
                            onClick={() => setViewSO(so)}>ดู</Button>
                          <Button variant="ghost" size="xs" icon={<Icon.Printer size={13}/>}
                            onClick={() => {
                              const html = buildSOPrintHTML(so, state.items, state.customers);
                              printWindow(`ใบเบิกสินค้า ${so.id}`, html);
                            }}>พิมพ์</Button>
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
        />
      )}
    </div>
  );
}

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const rect = cv.getBoundingClientRect();
    cv.width = rect.width * ratio;
    cv.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    const isDark = document.documentElement.classList.contains('dark');
    ctx.strokeStyle = isDark ? '#E5E7EB' : '#1A1A2E';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

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
          className="block w-full h-40 touch-none"
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
        {!value && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-ink-faint text-[12.5px]">เซ็นชื่อผู้รับสินค้า / Sign here</p>
          </div>
        )}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${value?'bg-brand-500':'bg-ink-faint/40'}`}/>
            <span className="text-[11px] text-ink-mute">{value ? 'มีลายเซ็นแล้ว' : 'ยังไม่ได้เซ็น'}</span>
          </div>
          <button onClick={clear} className="text-[11.5px] text-ink-mute hover:text-danger-fg inline-flex items-center gap-1">
            <Icon.X size={12}/> ล้าง
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StockOutPage, SignaturePad, SODetailModal });
