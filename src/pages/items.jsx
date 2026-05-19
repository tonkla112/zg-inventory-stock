// Items page
function ItemsPage({ store }) {
  const { state, stockMap, actions } = store;
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null); // item or 'new'
  const [scanOpen, setScanOpen] = useState(false);
  const [sortBy, setSortBy] = useState({ key:'code', dir:'asc' });

  const augmented = state.items.map(i => ({ ...i, qty: stockMap.get(i.code) || 0 }));
  let filtered = augmented.filter(i => {
    const m = q.toLowerCase();
    return !q || i.code.toLowerCase().includes(m) || i.name.toLowerCase().includes(m) || (i.nameEn||'').toLowerCase().includes(m);
  });
  if (filter === 'ok')   filtered = filtered.filter(i => i.qty >= 10);
  if (filter === 'low')  filtered = filtered.filter(i => i.qty > 0 && i.qty < 10);
  if (filter === 'zero') filtered = filtered.filter(i => i.qty === 0);
  filtered.sort((a,b) => {
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

  function toggleSort(key) {
    setSortBy(s => s.key === key ? { key, dir: s.dir==='asc'?'desc':'asc' } : { key, dir: 'asc' });
  }
  const SortHead = ({ k, children, align='left' }) => (
    <th className={`px-5 py-2.5 label-cap text-${align}`}>
      <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-ink">
        {children}
        <Icon.Sort size={11} className={sortBy.key===k ? 'text-brand-600' : 'text-ink-faint'}/>
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
            value={q} onChange={e => setQ(e.target.value)} />
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
              {filtered.map(it => (
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
                      <IconButton title="ดู" icon={<Icon.Eye size={15}/>}/>
                      <IconButton title="แก้ไข" icon={<Icon.Edit size={15}/>} tone="brand" onClick={() => setEditing(it)}/>
                      <IconButton title="ลบ" icon={<Icon.Trash size={15}/>} tone="danger"
                        onClick={() => { if (confirm(`ลบสินค้า ${it.code}?`)) { actions.delItem(it.code); Toast.push('ลบสินค้าแล้ว'); } }}/>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="8">
                  <Empty title="ไม่พบสินค้า" hint="ลองเปลี่ยนคำค้นหาหรือเพิ่มสินค้าใหม่"
                    action={<Button variant="primary" icon={<Icon.Plus size={15}/>} onClick={() => setEditing('new')}>เพิ่มสินค้าแรก</Button>}/>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 flex items-center justify-between border-t border-line text-[12.5px] text-ink-mute">
          <span>หน้า 1 จาก 1</span>
          <div className="flex items-center gap-1">
            <IconButton icon={<Icon.ChevronLeft size={15}/>} />
            <IconButton icon={<Icon.ChevronRight size={15}/>} />
          </div>
        </div>
      </Card>

      {editing && <ItemEditor item={editing==='new'?null:editing} onClose={() => setEditing(null)}
        onSave={(it) => {
          if (editing === 'new') { actions.addItem(it); Toast.push('เพิ่มสินค้าแล้ว'); }
          else { actions.updItem(editing.code, it); Toast.push('บันทึกการแก้ไขแล้ว'); }
          setEditing(null);
        }}/>}
      {scanOpen && <ScanModal onClose={() => setScanOpen(false)} onCapture={(code) => { setQ(code); setScanOpen(false); Toast.push(`สแกน: ${code}`); }}/>}
    </div>
  );
}

function ItemEditor({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { code:'', name:'', nameEn:'', unit:'ชิ้น', buy:0, sell:0, img:'#94a3b8' });
  const set = (k,v) => setForm(s => ({ ...s, [k]: v }));
  const colors = ['#94a3b8','#64748b','#0ea5e9','#f59e0b','#22c55e','#a855f7','#ef4444','#14b8a6'];
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
                className={`h-9 w-9 rounded-md border-2 ${form.img===c?'border-brand-500':'border-line'}`}
                style={{ background: c }}/>
            ))}
            <div className="ml-2 text-[12px] text-ink-mute">ตัวอย่างหรือสีบ่งบอกสำหรับการสแกนเร็ว</div>
          </div>
        </Field>
      </div>
    </Modal>
  );
}

function ScanModal({ onClose, onCapture }) {
  const [code, setCode] = useState('');
  return (
    <Modal open onClose={onClose} title="สแกน QR / Barcode" width="max-w-md"
      footer={
        <React.Fragment>
          <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
          <Button variant="primary" icon={<Icon.Check size={15}/>} onClick={() => code && onCapture(code)}>ยืนยัน</Button>
        </React.Fragment>
      }>
      <div className="space-y-4">
        <div className="aspect-video rounded-lg checker border border-dashed border-line2 flex flex-col items-center justify-center text-ink-mute">
          <div className="relative">
            <Icon.Camera size={42} className="text-ink-faint"/>
            <span className="absolute inset-x-0 top-1/2 h-px bg-brand-500 pulse-dot"/>
          </div>
          <p className="mt-3 text-[12.5px]">วางบาร์โค้ดให้อยู่กลางกรอบ</p>
          <p className="text-[11px] text-ink-faint">Place barcode within frame</p>
        </div>
        <Field label="หรือป้อนรหัสด้วยตนเอง">
          <Input prefix={<Icon.QR size={14}/>} placeholder="ITM-1001"
            value={code} onChange={e => setCode(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter' && code) onCapture(code); }}/>
        </Field>
      </div>
    </Modal>
  );
}

Object.assign(window, { ItemsPage, ItemEditor, ScanModal });
