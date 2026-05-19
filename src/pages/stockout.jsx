// Stock Out (Sale Order) page
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
    actions.addSO({
      date, custCode, shipping: +shipping || 0, discount: +discount || 0, sig: !!sigData,
      lines: valid.map(l => ({ code: l.code, qty: +l.qty })),
    });
    Toast.push(`บันทึกใบขาย ${nextSO}${emitPdf ? ' และสร้าง PDF แล้ว' : ''}`);
    if (emitPdf) setTimeout(() => Toast.push(`${nextSO}.pdf · พร้อมดาวน์โหลด`), 700);
    // reset
    setLines([{ uid: 1, code:'', qty:1 }]); setCustCode(''); setShipping(0); setDiscount(0); setSigData(null);
  }

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

Object.assign(window, { StockOutPage, SignaturePad });
