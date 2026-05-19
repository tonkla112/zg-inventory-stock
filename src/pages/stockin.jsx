// Stock In (Purchase Order) page
function StockInPage({ store }) {
  const { state, actions } = store;
  const [form, setForm] = useState({
    date: todayISO(), code:'', name:'', unit:'', price:0, qty:1,
  });
  const [scanOpen, setScanOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const nextPO = nextId('PO', state.pos);
  const itemMap = new Map(state.items.map(i => [i.code, i]));
  const amount = (form.price || 0) * (form.qty || 0);

  function setCode(code) {
    const it = itemMap.get(code);
    if (it) {
      setForm(f => ({ ...f, code, name: it.name, unit: it.unit, price: it.buy }));
    } else {
      setForm(f => ({ ...f, code, name:'', unit:'', price:0 }));
    }
  }

  function save() {
    if (!form.code || !itemMap.has(form.code)) { Toast.push('กรุณาเลือกรหัสสินค้าที่ถูกต้อง', 'danger'); return; }
    if (!form.qty || form.qty < 1) { Toast.push('กรุณาระบุจำนวน', 'danger'); return; }
    actions.addPO({ ...form, qty:+form.qty, price:+form.price });
    Toast.push(`บันทึกรับเข้า ${nextPO} เรียบร้อย`);
    setForm({ date: todayISO(), code:'', name:'', unit:'', price:0, qty:1 });
  }

  let recentPOs = [...state.pos];
  if (search) {
    const m = search.toLowerCase();
    recentPOs = recentPOs.filter(p => p.id.toLowerCase().includes(m) || p.code.toLowerCase().includes(m) || p.name.toLowerCase().includes(m));
  }
  if (dateFilter) recentPOs = recentPOs.filter(p => p.date === dateFilter);
  recentPOs = recentPOs.sort((a,b) => b.id.localeCompare(a.id)).slice(0, 15);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock In (Purchase Order)"
        titleTh="รับเข้าคลังสินค้า"
        subtitle="บันทึกการรับเข้าและสร้างใบสั่งซื้อ PO"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" title="ฟอร์มรับเข้าสินค้า" subtitle="Purchase Order Form"
          action={<Badge tone="brand" icon={<Icon.Hash size={11}/>} size="md"><span className="kbd">{nextPO}</span></Badge>}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="เลขที่ PO" hint="ระบบสร้างให้อัตโนมัติ">
              <Input value={nextPO} readOnly prefix={<Icon.Hash size={13}/>}/>
            </Field>
            <Field label="วันที่ / Date" required>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                prefix={<Icon.Calendar size={13}/>}/>
            </Field>

            <Field label="รหัสสินค้า / Item Code" required className="col-span-2">
              <div className="flex gap-2">
                <Input className="flex-1" prefix={<Icon.QR size={14}/>}
                  placeholder="พิมพ์หรือสแกน เช่น ITM-1001"
                  value={form.code} onChange={e => setCode(e.target.value)}
                  list="item-codes"/>
                <Button variant="secondary" icon={<Icon.Camera size={15}/>} onClick={() => setScanOpen(true)}>สแกน</Button>
              </div>
              <datalist id="item-codes">
                {state.items.map(i => <option key={i.code} value={i.code}>{i.name}</option>)}
              </datalist>
            </Field>

            <Field label="ชื่อสินค้า / Item Name" className="col-span-2">
              <Input value={form.name} readOnly placeholder="—"/>
            </Field>
            <Field label="หน่วยนับ / Unit">
              <Input value={form.unit} readOnly placeholder="—"/>
            </Field>
            <Field label="ราคาซื้อ (฿) / Buy Price" required>
              <Input type="number" prefix="฿" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: +e.target.value }))}/>
            </Field>
            <Field label="จำนวน / Quantity" required>
              <Input type="number" min="1" value={form.qty}
                onChange={e => setForm(f => ({ ...f, qty: +e.target.value }))}/>
            </Field>
            <Field label="จำนวนเงิน / Amount" hint="คำนวณอัตโนมัติ (ราคา × จำนวน)">
              <div className="h-9 px-3 border border-line2 rounded-lg bg-brand-50 flex items-center justify-end">
                <span className="kbd text-[16px] font-semibold text-brand-700 tabular-nums">{fmtTHB(amount)}</span>
              </div>
            </Field>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[12.5px] text-ink-mute">
              <Icon.Warn size={12} className="inline -mt-0.5 mr-1 text-amber2-fg"/>
              ตรวจสอบรหัสและจำนวนก่อนกดบันทึก ระบบจะอัปเดตสต๊อกทันที
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setForm({ date: todayISO(), code:'', name:'', unit:'', price:0, qty:1 })}>ยกเลิก</Button>
              <Button variant="primary" icon={<Icon.Save size={15}/>} onClick={save}>บันทึกรับสินค้า</Button>
            </div>
          </div>
        </Card>

        {/* QR Scan zone */}
        <Card title="สแกน QR / Barcode" subtitle="Quick scan to fill form" padded={false}>
          <div className="p-5">
            <button onClick={() => setScanOpen(true)}
              className="w-full aspect-square rounded-lg border-2 border-dashed border-line2 bg-page hover:bg-brand-50 hover:border-brand-300 transition-colors flex flex-col items-center justify-center text-ink-mute">
              <div className="h-14 w-14 rounded-full bg-white border border-line flex items-center justify-center mb-3">
                <Icon.Camera size={24} className="text-brand-600"/>
              </div>
              <p className="font-medium text-ink">เริ่มสแกนบาร์โค้ด</p>
              <p className="text-[12px] mt-1">Tap to start camera scanner</p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-ink-faint">
                <kbd className="kbd px-1.5 py-0.5 rounded border border-line">⌘</kbd>
                <span>+</span>
                <kbd className="kbd px-1.5 py-0.5 rounded border border-line">K</kbd>
              </div>
            </button>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-line p-3">
                <div className="text-[11px] text-ink-mute label-cap">วันนี้</div>
                <div className="kbd text-[18px] font-semibold mt-0.5">{state.pos.filter(p => p.date === todayISO()).length}</div>
                <div className="text-[11px] text-ink-faint">รายการ PO</div>
              </div>
              <div className="rounded-lg border border-line p-3">
                <div className="text-[11px] text-ink-mute label-cap">เดือนนี้</div>
                <div className="kbd text-[18px] font-semibold mt-0.5">{state.pos.length}</div>
                <div className="text-[11px] text-ink-faint">รายการ PO</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card padded={false} title="ประวัติการรับเข้าล่าสุด" subtitle="Recent purchase orders"
        action={
          <div className="flex items-center gap-2">
            <Input className="w-[200px]" prefix={<Icon.Search size={14}/>}
              placeholder="ค้นหา PO / รหัสสินค้า"
              value={search} onChange={e => setSearch(e.target.value)}/>
            <Input className="w-[160px]" type="date" prefix={<Icon.Calendar size={13}/>}
              value={dateFilter} onChange={e => setDateFilter(e.target.value)}/>
            <Button variant="secondary" size="sm" icon={<Icon.Filter size={14}/>}>กรอง</Button>
          </div>
        }>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead className="bg-page border-y border-line text-ink-mute">
              <tr>
                <th className="text-left font-medium px-5 py-2.5 label-cap">เลขที่ PO</th>
                <th className="text-left font-medium px-5 py-2.5 label-cap">วันที่</th>
                <th className="text-left font-medium px-5 py-2.5 label-cap">รหัสสินค้า</th>
                <th className="text-left font-medium px-5 py-2.5 label-cap">ชื่อสินค้า</th>
                <th className="text-right font-medium px-5 py-2.5 label-cap">จำนวน</th>
                <th className="text-right font-medium px-5 py-2.5 label-cap">ราคาซื้อ</th>
                <th className="text-right font-medium px-5 py-2.5 label-cap">จำนวนเงิน</th>
                <th className="text-right font-medium px-5 py-2.5 label-cap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recentPOs.map(p => (
                <tr key={p.id} className="row-hover">
                  <td className="px-5 py-3"><span className="kbd text-[12.5px] font-semibold text-brand-700">{p.id}</span></td>
                  <td className="px-5 py-3 text-ink-mute">{fmtDate(p.date)}</td>
                  <td className="px-5 py-3"><span className="kbd text-[12.5px] text-ink-soft">{p.code}</span></td>
                  <td className="px-5 py-3">{p.name} <span className="text-ink-faint text-[12px]">· {p.unit}</span></td>
                  <td className="px-5 py-3 text-right kbd tabular-nums">{fmtInt(p.qty)}</td>
                  <td className="px-5 py-3 text-right kbd tabular-nums">{fmtTHB(p.price)}</td>
                  <td className="px-5 py-3 text-right kbd font-semibold tabular-nums">{fmtTHB(p.price * p.qty)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-0.5">
                      <IconButton title="ดูรายละเอียด" icon={<Icon.Eye size={15}/>}/>
                      <IconButton title="พิมพ์ PDF" icon={<Icon.PDF size={15}/>} tone="brand"
                        onClick={() => Toast.push(`สร้างเอกสาร ${p.id}.pdf`)}/>
                    </div>
                  </td>
                </tr>
              ))}
              {recentPOs.length === 0 && <tr><td colSpan="8"><Empty title="ไม่พบรายการ" hint="ลองเปลี่ยนตัวกรอง"/></td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {scanOpen && <ScanModal onClose={() => setScanOpen(false)} onCapture={(code) => { setCode(code); setScanOpen(false); Toast.push(`สแกนสำเร็จ: ${code}`); }}/>}
    </div>
  );
}
window.StockInPage = StockInPage;
