// Items page

const PAGE_SIZE = 15;

// ─── ItemDetailModal ──────────────────────────────────────────────────────────
function ItemDetailModal({ item, stockMap, pos, sos, customers, onClose }) {
  const qty = stockMap.get(item.code) || 0;

  // Last 10 purchase orders that contain this item
  const poHistory = React.useMemo(() => {
    const lines = [];
    (pos || []).forEach(po => {
      (po.lines || []).forEach(line => {
        if (line.code === item.code) {
          lines.push({
            poNo:    po.poNo || po.id || '—',
            date:    po.date || '—',
            qty:     line.qty,
            price:   line.price != null ? line.price : item.buy,
          });
        }
      });
    });
    lines.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return lines.slice(0, 10);
  }, [pos, item.code, item.buy]);

  // Last 10 sales order lines that contain this item
  const soHistory = React.useMemo(() => {
    const lines = [];
    (sos || []).forEach(so => {
      (so.lines || []).forEach(line => {
        if (line.code === item.code) {
          const cust = (customers || []).find(c => c.id === so.customerId || c.code === so.customerId);
          lines.push({
            soNo:     so.soNo || so.id || '—',
            date:     so.date || '—',
            qty:      line.qty,
            price:    line.price != null ? line.price : item.sell,
            customer: cust ? (cust.name || cust.id) : (so.customerId || '—'),
          });
        }
      });
    });
    lines.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return lines.slice(0, 10);
  }, [sos, customers, item.code, item.sell]);

  return (
    <Modal open onClose={onClose} title={`รายละเอียดสินค้า · ${item.code}`} width="max-w-3xl"
      footer={
        <Button variant="ghost" onClick={onClose}>ปิด</Button>
      }>
      <div className="space-y-5">

        {/* Item detail card */}
        <div className="flex items-start gap-5 p-4 rounded-xl border border-line bg-page">
          <div className="h-16 w-16 rounded-xl border border-line shrink-0 flex items-center justify-center"
               style={{ background: item.img + '22' }}>
            <div className="h-9 w-9 rounded-lg" style={{ background: item.img }}/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="kbd text-[12.5px] text-ink-soft">{item.code}</span>
              <StockStatus qty={qty}/>
            </div>
            <div className="font-semibold text-[15px] mt-0.5">{item.name}</div>
            {item.nameEn && <div className="text-[12.5px] text-ink-faint">{item.nameEn}</div>}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <div className="label-cap text-ink-faint mb-0.5">หน่วย</div>
                <div className="font-medium">{item.unit}</div>
              </div>
              <div>
                <div className="label-cap text-ink-faint mb-0.5">คงเหลือ</div>
                <div className="font-semibold tabular-nums text-[15px]">{fmtInt(qty)}</div>
              </div>
              <div>
                <div className="label-cap text-ink-faint mb-0.5">ราคาซื้อ</div>
                <div className="kbd tabular-nums">{fmtTHB(item.buy)}</div>
              </div>
              <div>
                <div className="label-cap text-ink-faint mb-0.5">ราคาขาย</div>
                <div className="kbd tabular-nums">{fmtTHB(item.sell)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase history */}
        <div>
          <div className="label-cap text-ink-mute mb-2">ประวัติการสั่งซื้อล่าสุด 10 รายการ (PO)</div>
          {poHistory.length === 0 ? (
            <div className="text-[12.5px] text-ink-faint py-4 text-center border border-dashed border-line rounded-lg">
              ยังไม่มีประวัติการสั่งซื้อ
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin rounded-lg border border-line">
              <table className="w-full text-[13px]">
                <thead className="bg-page border-b border-line text-ink-mute">
                  <tr>
                    <th className="px-4 py-2 label-cap text-left">เลขที่ PO</th>
                    <th className="px-4 py-2 label-cap text-left">วันที่</th>
                    <th className="px-4 py-2 label-cap text-right">จำนวน</th>
                    <th className="px-4 py-2 label-cap text-right">ราคา/หน่วย</th>
                    <th className="px-4 py-2 label-cap text-right">รวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {poHistory.map((r, i) => (
                    <tr key={i} className="row-hover">
                      <td className="px-4 py-2 kbd text-[12px]">{r.poNo}</td>
                      <td className="px-4 py-2 text-ink-mute">{fmtDate ? fmtDate(r.date) : r.date}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{fmtInt(r.qty)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{fmtTHB(r.price)}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">{fmtTHB(r.qty * r.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Withdrawal / SO history */}
        <div>
          <div className="label-cap text-ink-mute mb-2">ประวัติการเบิก/ขายล่าสุด 10 รายการ (SO)</div>
          {soHistory.length === 0 ? (
            <div className="text-[12.5px] text-ink-faint py-4 text-center border border-dashed border-line rounded-lg">
              ยังไม่มีประวัติการเบิก/ขาย
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin rounded-lg border border-line">
              <table className="w-full text-[13px]">
                <thead className="bg-page border-b border-line text-ink-mute">
                  <tr>
                    <th className="px-4 py-2 label-cap text-left">เลขที่ SO</th>
                    <th className="px-4 py-2 label-cap text-left">วันที่</th>
                    <th className="px-4 py-2 label-cap text-left">ลูกค้า / แผนก</th>
                    <th className="px-4 py-2 label-cap text-right">จำนวน</th>
                    <th className="px-4 py-2 label-cap text-right">ราคา/หน่วย</th>
                    <th className="px-4 py-2 label-cap text-right">รวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {soHistory.map((r, i) => (
                    <tr key={i} className="row-hover">
                      <td className="px-4 py-2 kbd text-[12px]">{r.soNo}</td>
                      <td className="px-4 py-2 text-ink-mute">{fmtDate ? fmtDate(r.date) : r.date}</td>
                      <td className="px-4 py-2 text-ink-soft">{r.customer}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{fmtInt(r.qty)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{fmtTHB(r.price)}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">{fmtTHB(r.qty * r.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
}

// ─── ItemsPage ────────────────────────────────────────────────────────────────
function ItemsPage({ store }) {
  const { state, stockMap, actions } = store;
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null); // item or 'new'
  const [scanOpen, setScanOpen] = useState(false);
  const [sortBy, setSortBy] = useState({ key: 'code', dir: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null); // item being viewed in detail modal

  const augmented = state.items.map(i => ({ ...i, qty: stockMap.get(i.code) || 0 }));

  let filtered = augmented.filter(i => {
    const m = q.toLowerCase();
    return !q || i.code.toLowerCase().includes(m) || i.name.toLowerCase().includes(m) || (i.nameEn || '').toLowerCase().includes(m);
  });
  if (filter === 'ok')   filtered = filtered.filter(i => i.qty >= 10);
  if (filter === 'low')  filtered = filtered.filter(i => i.qty > 0 && i.qty < 10);
  if (filter === 'zero') filtered = filtered.filter(i => i.qty === 0);
  filtered.sort((a, b) => {
    const va = a[sortBy.key], vb = b[sortBy.key];
    const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'th');
    return sortBy.dir === 'asc' ? cmp : -cmp;
  });

  const counts = {
    all:  augmented.length,
    ok:   augmented.filter(i => i.qty >= 10).length,
    low:  augmented.filter(i => i.qty > 0 && i.qty < 10).length,
    zero: augmented.filter(i => i.qty === 0).length,
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when search/filter changes
  useEffect(() => { setCurrentPage(1); }, [q, filter]);

  function toggleSort(key) {
    setSortBy(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  }

  const SortHead = ({ k, children, align = 'left' }) => (
    <th className={`px-5 py-2.5 label-cap text-${align}`}>
      <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-ink">
        {children}
        <Icon.Sort size={11} className={sortBy.key === k ? 'text-brand-600' : 'text-ink-faint'}/>
      </button>
    </th>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Items"
        titleTh="สินค้า"
        subtitle="จัดการรายการสินค้าและสต๊อกคงเหลือ"
        actions={
          <React.Fragment>
            <Button variant="secondary" icon={<Icon.QR size={15}/>} size="sm" onClick={() => setScanOpen(true)}>สแกน QR / Barcode</Button>
            <Button variant="primary" icon={<Icon.Plus size={15}/>} size="sm" onClick={() => setEditing('new')}>เพิ่มสินค้า</Button>
          </React.Fragment>
        }
      />

      <Card padded={false}>
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-line">
          <Input
            className="w-full sm:w-[320px]"
            prefix={<Icon.Search size={14}/>}
            placeholder="ค้นหารหัสหรือชื่อสินค้า..."
            value={q} onChange={e => setQ(e.target.value)}/>
          <Select value={filter} onChange={e => setFilter(e.target.value)} className="w-[180px]">
            <option value="all">ทุกสถานะ ({counts.all})</option>
            <option value="ok">สต๊อกปกติ ({counts.ok})</option>
            <option value="low">ใกล้หมด ({counts.low})</option>
            <option value="zero">หมดสต๊อก ({counts.zero})</option>
          </Select>
          <div className="flex-1"/>
          <span className="text-[12.5px] text-ink-mute">แสดง {filtered.length}/{counts.all} รายการ</span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-[13.5px]">
            <thead className="bg-page border-b border-line text-ink-mute">
              <tr>
                <SortHead k="code">รหัสสินค้า</SortHead>
                <SortHead k="name">ชื่อสินค้า</SortHead>
                <th className="px-5 py-2.5 label-cap text-left">หน่วย</th>
                <SortHead k="buy" align="right">ราคาซื้อ</SortHead>
                <SortHead k="sell" align="right">ราคาขาย</SortHead>
                <SortHead k="qty" align="right">คงเหลือ</SortHead>
                <th className="px-5 py-2.5 label-cap text-left">สถานะ</th>
                <th className="px-5 py-2.5 label-cap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map(it => (
                <tr key={it.code} className="row-hover">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-md border border-line shrink-0 flex items-center justify-center"
                           style={{ background: it.img + '22' }}>
                        <div className="h-5 w-5 rounded" style={{ background: it.img }}/>
                      </div>
                      <span className="kbd text-[12.5px] text-ink-soft">{it.code}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium">{it.name}</div>
                    <div className="text-[11.5px] text-ink-faint">{it.nameEn}</div>
                  </td>
                  <td className="px-5 py-3 text-ink-mute">{it.unit}</td>
                  <td className="px-5 py-3 text-right kbd tabular-nums">{fmtTHB(it.buy)}</td>
                  <td className="px-5 py-3 text-right kbd tabular-nums">{fmtTHB(it.sell)}</td>
                  <td className="px-5 py-3 text-right kbd font-semibold tabular-nums">{fmtInt(it.qty)}</td>
                  <td className="px-5 py-3"><StockStatus qty={it.qty}/></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <IconButton title="ดู" icon={<Icon.Eye size={15}/>} onClick={() => setDetailItem(it)}/>
                      <IconButton title="แก้ไข" icon={<Icon.Edit size={15}/>} tone="brand" onClick={() => setEditing(it)}/>
                      <IconButton title="ลบ" icon={<Icon.Trash size={15}/>} tone="danger"
                        onClick={() => { if (confirm(`ลบสินค้า ${it.code}?`)) { actions.delItem(it.code); Toast.push('ลบสินค้าแล้ว'); } }}/>
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr><td colSpan="8">
                  <Empty title="ไม่พบสินค้า" hint="ลองเปลี่ยนคำค้นหาหรือเพิ่มสินค้าใหม่"
                    action={<Button variant="primary" icon={<Icon.Plus size={15}/>} onClick={() => setEditing('new')}>เพิ่มสินค้าแรก</Button>}/>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 flex items-center justify-between border-t border-line text-[12.5px] text-ink-mute">
          <span>หน้า {safePage} จาก {totalPages}</span>
          <div className="flex items-center gap-1">
            <IconButton
              icon={<Icon.ChevronLeft size={15}/>}
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}/>
            <IconButton
              icon={<Icon.ChevronRight size={15}/>}
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}/>
          </div>
        </div>
      </Card>

      {editing && (
        <ItemEditor
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(it) => {
            if (editing === 'new') { actions.addItem(it); Toast.push('เพิ่มสินค้าแล้ว'); }
            else { actions.updItem(editing.code, it); Toast.push('บันทึกการแก้ไขแล้ว'); }
            setEditing(null);
          }}/>
      )}

      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          stockMap={stockMap}
          pos={state.pos || state.purchaseOrders || []}
          sos={state.sos || state.salesOrders || []}
          customers={state.customers || []}
          onClose={() => setDetailItem(null)}/>
      )}

      {scanOpen && (
        <ScanModal
          onClose={() => setScanOpen(false)}
          onCapture={(code) => { setQ(code); setScanOpen(false); Toast.push(`สแกน: ${code}`); }}/>
      )}
    </div>
  );
}

// ─── ItemEditor (unchanged) ───────────────────────────────────────────────────
function ItemEditor({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { code: '', name: '', nameEn: '', unit: 'ชิ้น', buy: 0, sell: 0, img: '#94a3b8' });
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));
  const colors = ['#94a3b8', '#64748b', '#0ea5e9', '#f59e0b', '#22c55e', '#a855f7', '#ef4444', '#14b8a6'];
  return (
    <Modal open onClose={onClose} title={item ? `แก้ไขสินค้า · ${item.code}` : 'เพิ่มสินค้าใหม่'} width="max-w-2xl"
      footer={
        <React.Fragment>
          <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
          <Button variant="primary" icon={<Icon.Save size={15}/>} onClick={() => onSave(form)}>บันทึก</Button>
        </React.Fragment>
      }>
      <div className="grid grid-cols-2 gap-4">
        <Field label="รหัสสินค้า" required className="col-span-1">
          <Input value={form.code} onChange={e => set('code', e.target.value)} placeholder="ITM-XXXX" readOnly={!!item}/>
        </Field>
        <Field label="หน่วยนับ" required>
          <Input value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="ชิ้น / กล่อง / ม้วน"/>
        </Field>
        <Field label="ชื่อสินค้า (ไทย)" required className="col-span-2">
          <Input value={form.name} onChange={e => set('name', e.target.value)}/>
        </Field>
        <Field label="ชื่อสินค้า (อังกฤษ)" className="col-span-2">
          <Input value={form.nameEn} onChange={e => set('nameEn', e.target.value)}/>
        </Field>
        <Field label="ราคาซื้อ (฿)" required>
          <Input type="number" prefix="฿" value={form.buy} onChange={e => set('buy', +e.target.value)}/>
        </Field>
        <Field label="ราคาขาย (฿)" required>
          <Input type="number" prefix="฿" value={form.sell} onChange={e => set('sell', +e.target.value)}/>
        </Field>
        <Field label="รูปภาพ / สีกำกับ" className="col-span-2">
          <div className="flex items-center gap-2">
            {colors.map(c => (
              <button key={c} onClick={() => set('img', c)}
                className={`h-9 w-9 rounded-md border-2 ${form.img === c ? 'border-brand-500' : 'border-line'}`}
                style={{ background: c }}/>
            ))}
            <div className="ml-2 text-[12px] text-ink-mute">ตัวอย่างหรือสีบ่งบอกสำหรับการสแกนเร็ว</div>
          </div>
        </Field>
      </div>
    </Modal>
  );
}

// ─── ScanModal (real camera + BarcodeDetector) ────────────────────────────────
function ScanModal({ onClose, onCapture }) {
  const [code, setCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const capturedRef = useRef(false);

  const stopStream = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('เบราว์เซอร์นี้ไม่รองรับการเข้าถึงกล้อง');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Check BarcodeDetector support
        if (!('BarcodeDetector' in window)) {
          setCameraError('กรุณาป้อนรหัสด้วยตนเอง\n(เบราว์เซอร์นี้ไม่รองรับ BarcodeDetector — ใช้ Chrome/Edge)');
          setScanning(false);
          return;
        }

        detectorRef.current = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'data_matrix'],
        });
        setScanning(true);
        setCameraError(null);

        async function tick() {
          if (cancelled || capturedRef.current) return;
          if (videoRef.current && videoRef.current.readyState === 4 && detectorRef.current) {
            try {
              const barcodes = await detectorRef.current.detect(videoRef.current);
              if (barcodes.length > 0 && !capturedRef.current) {
                capturedRef.current = true;
                const value = barcodes[0].rawValue;
                setDetected(value);
                stopStream();
                onCapture(value);
                return;
              }
            } catch (_) { /* ignore per-frame errors */ }
          }
          rafRef.current = requestAnimationFrame(tick);
        }
        rafRef.current = requestAnimationFrame(tick);

      } catch (err) {
        if (cancelled) return;
        if (err.name === 'NotAllowedError') {
          setCameraError('ไม่ได้รับอนุญาตให้เข้าถึงกล้อง กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์');
        } else if (err.name === 'NotFoundError') {
          setCameraError('ไม่พบกล้องในอุปกรณ์นี้');
        } else {
          setCameraError(`ไม่สามารถเปิดกล้องได้: ${err.message}`);
        }
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, []);

  return (
    <Modal open onClose={() => { stopStream(); onClose(); }} title="สแกน QR / Barcode" width="max-w-md"
      footer={
        <React.Fragment>
          <Button variant="ghost" onClick={() => { stopStream(); onClose(); }}>ยกเลิก</Button>
          <Button variant="primary" icon={<Icon.Check size={15}/>} onClick={() => { if (code) { stopStream(); onCapture(code); } }}>ยืนยัน</Button>
        </React.Fragment>
      }>
      <div className="space-y-4">

        {/* Camera viewport */}
        <div className="relative aspect-video rounded-lg overflow-hidden border border-line bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
            style={{ display: cameraError ? 'none' : 'block' }}/>

          {/* Scanning overlay */}
          {scanning && !cameraError && !detected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-56 h-36 border-2 border-brand-400 rounded-lg relative">
                <span className="absolute inset-x-0 top-1/2 h-0.5 bg-brand-500 opacity-80 pulse-dot"/>
                <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-brand-300 rounded-tl"/>
                <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-brand-300 rounded-tr"/>
                <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-brand-300 rounded-bl"/>
                <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-brand-300 rounded-br"/>
              </div>
              <p className="mt-3 text-[12px] text-white/80">วางบาร์โค้ดให้อยู่กลางกรอบ</p>
            </div>
          )}

          {/* Loading state (camera starting) */}
          {!scanning && !cameraError && !detected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
              <Icon.Camera size={36} className="mb-2"/>
              <p className="text-[12px]">กำลังเปิดกล้อง…</p>
            </div>
          )}

          {/* Camera error state */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-page text-ink-mute px-6 text-center">
              <Icon.Camera size={36} className="mb-3 text-ink-faint"/>
              {cameraError.split('\n').map((line, i) => (
                <p key={i} className={i === 0 ? 'text-[13px] font-medium text-ink' : 'mt-1 text-[11.5px] text-ink-faint'}>{line}</p>
              ))}
            </div>
          )}

          {/* Detected state */}
          {detected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-900/80 text-white">
              <Icon.Check size={36} className="mb-2"/>
              <p className="text-[13px] font-semibold">พบบาร์โค้ด!</p>
              <p className="mt-1 text-[12px] opacity-80 kbd">{detected}</p>
            </div>
          )}
        </div>

        {/* Manual entry */}
        <Field label="หรือป้อนรหัสด้วยตนเอง">
          <Input
            prefix={<Icon.QR size={14}/>}
            placeholder="ITM-1001"
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && code) { stopStream(); onCapture(code); } }}/>
        </Field>
      </div>
    </Modal>
  );
}

Object.assign(window, { ItemsPage, ItemDetailModal, ItemEditor, ScanModal });
