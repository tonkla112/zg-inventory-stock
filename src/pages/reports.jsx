// Reports page
function ReportsPage({ store }) {
  const { state, stockMap } = store;
  const [tab, setTab] = useState('balance');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterItem, setFilterItem] = useState('');

  const itemMap = new Map(state.items.map(i => [i.code, i]));
  const custMap = new Map(state.customers.map(c => [c.code, c]));

  // Stock balance rows
  const balanceRows = state.items.map(i => {
    const qty = stockMap.get(i.code) || 0;
    const inQty = state.pos.filter(p => p.code === i.code).reduce((s, p) => s + p.qty, 0);
    const outQty = state.sos.flatMap(s => s.lines).filter(l => l.code === i.code).reduce((s, l) => s + l.qty, 0);
    return { ...i, qty, inQty, outQty, value: qty * i.buy };
  });

  // Movement rows
  let movement = [
    ...state.pos.map(p => ({ kind:'in', date:p.date, doc:p.id, code:p.code, name:p.name, qty:p.qty, party:'รับเข้าคลัง', amount: p.price*p.qty })),
    ...state.sos.flatMap(s => s.lines.map(l => {
      const it = itemMap.get(l.code) || {};
      const c = custMap.get(s.custCode) || {};
      return { kind:'out', date:s.date, doc:s.id, code:l.code, name:it.name || l.code, qty:l.qty,
        party: c.name || '—', amount: (it.sell || 0) * l.qty };
    }))
  ];
  if (dateFrom) movement = movement.filter(m => m.date >= dateFrom);
  if (dateTo) movement = movement.filter(m => m.date <= dateTo);
  if (filterItem) movement = movement.filter(m => m.code === filterItem);
  movement.sort((a,b) => b.date.localeCompare(a.date) || b.doc.localeCompare(a.doc));

  const totalStockValue = balanceRows.reduce((s, r) => s + r.value, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        titleTh="รายงาน"
        subtitle="ยอดคงเหลือและประวัติการเคลื่อนไหวสินค้า"
        actions={
          <React.Fragment>
            <Button variant="secondary" size="sm" icon={<Icon.CSV size={14}/>} onClick={() => Toast.push('ส่งออก CSV แล้ว')}>Export CSV</Button>
            <Button variant="primary" size="sm" icon={<Icon.PDF size={14}/>} onClick={() => Toast.push('สร้าง PDF รายงานแล้ว')}>Export PDF</Button>
          </React.Fragment>
        }
      />

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-line rounded-card p-4">
          <p className="label-cap">มูลค่าสต๊อกรวม</p>
          <p className="text-[12px] text-ink-faint">Total stock value</p>
          <p className="kbd text-[22px] font-semibold mt-2">{fmtTHB(totalStockValue)}</p>
        </div>
        <div className="bg-white border border-line rounded-card p-4">
          <p className="label-cap">รับเข้ารวม</p>
          <p className="text-[12px] text-ink-faint">Total stock in</p>
          <p className="kbd text-[22px] font-semibold mt-2 text-good-fg">+{fmtInt(balanceRows.reduce((s,r) => s + r.inQty, 0))}</p>
        </div>
        <div className="bg-white border border-line rounded-card p-4">
          <p className="label-cap">เบิกออกรวม</p>
          <p className="text-[12px] text-ink-faint">Total stock out</p>
          <p className="kbd text-[22px] font-semibold mt-2 text-danger-fg">−{fmtInt(balanceRows.reduce((s,r) => s + r.outQty, 0))}</p>
        </div>
        <div className="bg-white border border-line rounded-card p-4">
          <p className="label-cap">เอกสาร PO / SO</p>
          <p className="text-[12px] text-ink-faint">Total documents</p>
          <p className="kbd text-[22px] font-semibold mt-2">{state.pos.length} / {state.sos.length}</p>
        </div>
      </div>

      <Card padded={false}>
        <div className="px-4 pt-3">
          <Tabs
            value={tab} onChange={setTab}
            items={[
              { value:'balance', label:'ยอดคงเหลือ / Stock Balance', count: balanceRows.length },
              { value:'movement', label:'ประวัติเคลื่อนไหว / Movement', count: movement.length },
            ]}
          />
        </div>

        {tab === 'movement' && (
          <div className="p-4 flex flex-wrap items-center gap-2 border-b border-line bg-page/60">
            <Field label="จากวันที่"><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} prefix={<Icon.Calendar size={13}/>}/></Field>
            <Field label="ถึงวันที่"><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} prefix={<Icon.Calendar size={13}/>}/></Field>
            <Field label="สินค้า">
              <Select value={filterItem} onChange={e => setFilterItem(e.target.value)} className="w-[240px]">
                <option value="">ทุกสินค้า</option>
                {state.items.map(i => <option key={i.code} value={i.code}>{i.code} — {i.name}</option>)}
              </Select>
            </Field>
            <div className="flex-1"/>
            <Button variant="ghost" size="sm" icon={<Icon.X size={13}/>} onClick={() => { setDateFrom(''); setDateTo(''); setFilterItem(''); }}>ล้างตัวกรอง</Button>
          </div>
        )}

        {tab === 'balance' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead className="bg-page border-b border-line text-ink-mute">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">รหัสสินค้า</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">ชื่อสินค้า</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">หน่วย</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">รับเข้า</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">เบิกออก</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">คงเหลือ</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">มูลค่า (ราคาทุน)</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {balanceRows.map(r => (
                  <tr key={r.code} className="row-hover">
                    <td className="px-5 py-3"><span className="kbd text-[12.5px] text-ink-soft">{r.code}</span></td>
                    <td className="px-5 py-3 font-medium">{r.name}</td>
                    <td className="px-5 py-3 text-ink-mute">{r.unit}</td>
                    <td className="px-5 py-3 text-right kbd tabular-nums text-good-fg">+{fmtInt(r.inQty)}</td>
                    <td className="px-5 py-3 text-right kbd tabular-nums text-danger-fg">−{fmtInt(r.outQty)}</td>
                    <td className="px-5 py-3 text-right kbd font-semibold tabular-nums">{fmtInt(r.qty)}</td>
                    <td className="px-5 py-3 text-right kbd tabular-nums">{fmtTHB(r.value)}</td>
                    <td className="px-5 py-3"><StockStatus qty={r.qty}/></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-page border-t border-line">
                  <td colSpan="6" className="px-5 py-3 text-right text-ink-mute label-cap">รวมมูลค่าสต๊อก</td>
                  <td className="px-5 py-3 text-right kbd text-[15px] font-bold text-brand-700">{fmtTHB(totalStockValue)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead className="bg-page border-b border-line text-ink-mute">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">วันที่</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">เอกสาร</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">ประเภท</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">รหัสสินค้า</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">ชื่อสินค้า</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">คู่ค้า / แผนก</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">จำนวน</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">มูลค่า</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {movement.map((m, i) => (
                  <tr key={i} className="row-hover">
                    <td className="px-5 py-3 text-ink-mute kbd text-[12.5px]">{fmtDate(m.date)}</td>
                    <td className="px-5 py-3"><span className="kbd text-[12.5px] font-semibold text-brand-700">{m.doc}</span></td>
                    <td className="px-5 py-3">
                      {m.kind === 'in'
                        ? <Badge tone="good" icon={<Icon.ArrowDown size={11}/>}>รับเข้า</Badge>
                        : <Badge tone="danger" icon={<Icon.ArrowUp size={11}/>}>เบิกออก</Badge>}
                    </td>
                    <td className="px-5 py-3"><span className="kbd text-[12.5px] text-ink-soft">{m.code}</span></td>
                    <td className="px-5 py-3">{m.name}</td>
                    <td className="px-5 py-3 text-ink-mute">{m.party}</td>
                    <td className={`px-5 py-3 text-right kbd font-semibold tabular-nums ${m.kind==='in'?'text-good-fg':'text-danger-fg'}`}>
                      {m.kind==='in'?'+':'−'}{fmtInt(m.qty)}
                    </td>
                    <td className="px-5 py-3 text-right kbd tabular-nums">{fmtTHB(m.amount)}</td>
                  </tr>
                ))}
                {movement.length === 0 && <tr><td colSpan="8"><Empty title="ไม่พบรายการเคลื่อนไหว" hint="ลองปรับตัวกรองวันที่หรือสินค้า"/></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
window.ReportsPage = ReportsPage;
