// Reports page
function ReportsPage({ store, lang }) {
  const t = (th, en) => lang === 'en' ? en : th;
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
        titleTh={t('รายงาน', 'Reports')}
        subtitle={t('ยอดคงเหลือและประวัติการเคลื่อนไหวสินค้า', 'Stock balance and movement history')}
        actions={
          <React.Fragment>
            <Button variant="secondary" size="sm" icon={<Icon.CSV size={14}/>} onClick={() => {
              if (tab === 'balance') {
                exportCSV(
                  [t('รหัสสินค้า','Item Code'), t('ชื่อสินค้า','Item Name'), t('หน่วย','Unit'), t('รับเข้ารวม','Total In'), t('เบิกออกรวม','Total Out'), t('คงเหลือ','Balance'), t('มูลค่า (฿)','Value (฿)')],
                  balanceRows.map(r => [r.code, r.name, r.unit, r.inQty, r.outQty, r.qty, r.value]),
                  `ZG-Stock-Balance-${todayISO()}.csv`
                );
              } else {
                exportCSV(
                  [t('วันที่','Date'), t('เลขที่เอกสาร','Doc No.'), t('ประเภท','Type'), t('รหัสสินค้า','Item Code'), t('ชื่อสินค้า','Item Name'), t('คู่ค้า/แผนก','Party/Dept'), t('จำนวน','Qty'), t('มูลค่า (฿)','Value (฿)')],
                  movement.map(m => [m.date, m.doc, m.kind==='in' ? t('รับเข้า','Stock In') : t('เบิกออก','Stock Out'), m.code, m.name, m.party, m.qty, m.amount]),
                  `ZG-Movement-${todayISO()}.csv`
                );
              }
              Toast.push(t('Export CSV เรียบร้อยแล้ว', 'CSV exported successfully'));
            }}>Export CSV</Button>
            <Button variant="primary" size="sm" icon={<Icon.PDF size={14}/>} onClick={() => {
              if (tab === 'balance') {
                const tableRows = balanceRows.map(r => `<tr>
                  <td class="mono">${r.code}</td>
                  <td>${r.name}</td>
                  <td>${r.unit}</td>
                  <td class="right mono good">+${r.inQty}</td>
                  <td class="right mono danger">−${r.outQty}</td>
                  <td class="right mono" style="font-weight:600">${r.qty}</td>
                  <td class="right mono">฿${Number(r.value).toLocaleString('th-TH',{minimumFractionDigits:2})}</td>
                </tr>`).join('');
                const total = balanceRows.reduce((s,r)=>s+r.value,0);
                printWindow(t('รายงานยอดคงเหลือสินค้า', 'Stock Balance Report'), `
                  <table>
                    <thead><tr>
                      <th>${t('รหัสสินค้า','Item Code')}</th><th>${t('ชื่อสินค้า','Item Name')}</th><th>${t('หน่วย','Unit')}</th>
                      <th class="right">${t('รับเข้า','Stock In')}</th><th class="right">${t('เบิกออก','Stock Out')}</th>
                      <th class="right">${t('คงเหลือ','Balance')}</th><th class="right">${t('มูลค่า (฿)','Value (฿)')}</th>
                    </tr></thead>
                    <tbody>${tableRows}</tbody>
                    <tfoot><tr>
                      <td colspan="6" class="right">${t('รวมมูลค่าสต๊อกทั้งหมด','Total Stock Value')}</td>
                      <td class="right mono brand">฿${Number(total).toLocaleString('th-TH',{minimumFractionDigits:2})}</td>
                    </tr></tfoot>
                  </table>`);
              } else {
                const tableRows = movement.map(m => `<tr>
                  <td class="mono">${m.date}</td>
                  <td class="mono brand">${m.doc}</td>
                  <td><span class="badge ${m.kind==='in'?'badge-in':'badge-out'}">${m.kind==='in' ? t('รับเข้า','Stock In') : t('เบิกออก','Stock Out')}</span></td>
                  <td class="mono">${m.code}</td>
                  <td>${m.name}</td>
                  <td>${m.party}</td>
                  <td class="right mono ${m.kind==='in'?'good':'danger'}">${m.kind==='in'?'+':'−'}${m.qty}</td>
                  <td class="right mono">฿${Number(m.amount).toLocaleString('th-TH',{minimumFractionDigits:2})}</td>
                </tr>`).join('');
                printWindow(t('รายงานประวัติเคลื่อนไหวสินค้า', 'Stock Movement History Report'), `
                  <table>
                    <thead><tr>
                      <th>${t('วันที่','Date')}</th><th>${t('เอกสาร','Doc')}</th><th>${t('ประเภท','Type')}</th><th>${t('รหัสสินค้า','Item Code')}</th>
                      <th>${t('ชื่อสินค้า','Item Name')}</th><th>${t('คู่ค้า/แผนก','Party/Dept')}</th><th class="right">${t('จำนวน','Qty')}</th><th class="right">${t('มูลค่า (฿)','Value (฿)')}</th>
                    </tr></thead>
                    <tbody>${tableRows}</tbody>
                  </table>`);
              }
            }}>Export PDF</Button>
          </React.Fragment>
        }
      />

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-line rounded-card p-4">
          <p className="label-cap">{t('มูลค่าสต๊อกรวม', 'Total Stock Value')}</p>
          <p className="text-[12px] text-ink-faint">{t('มูลค่าสต๊อกรวม', 'Total stock value')}</p>
          <p className="kbd text-[22px] font-semibold mt-2">{fmtTHB(totalStockValue)}</p>
        </div>
        <div className="bg-white border border-line rounded-card p-4">
          <p className="label-cap">{t('รับเข้ารวม', 'Total Stock In')}</p>
          <p className="text-[12px] text-ink-faint">{t('รับเข้ารวม', 'Total stock in')}</p>
          <p className="kbd text-[22px] font-semibold mt-2 text-good-fg">+{fmtInt(balanceRows.reduce((s,r) => s + r.inQty, 0))}</p>
        </div>
        <div className="bg-white border border-line rounded-card p-4">
          <p className="label-cap">{t('เบิกออกรวม', 'Total Stock Out')}</p>
          <p className="text-[12px] text-ink-faint">{t('เบิกออกรวม', 'Total stock out')}</p>
          <p className="kbd text-[22px] font-semibold mt-2 text-danger-fg">−{fmtInt(balanceRows.reduce((s,r) => s + r.outQty, 0))}</p>
        </div>
        <div className="bg-white border border-line rounded-card p-4">
          <p className="label-cap">{t('เอกสาร PO / SO', 'PO / SO Documents')}</p>
          <p className="text-[12px] text-ink-faint">{t('เอกสารทั้งหมด', 'Total documents')}</p>
          <p className="kbd text-[22px] font-semibold mt-2">{state.pos.length} / {state.sos.length}</p>
        </div>
      </div>

      <Card padded={false}>
        <div className="px-4 pt-3">
          <Tabs
            value={tab} onChange={setTab}
            items={[
              { value:'balance', label: t('ยอดคงเหลือ / Stock Balance', 'Stock Balance'), count: balanceRows.length },
              { value:'movement', label: t('ประวัติเคลื่อนไหว / Movement', 'Movement History'), count: movement.length },
            ]}
          />
        </div>

        {tab === 'movement' && (
          <div className="p-4 flex flex-wrap items-center gap-2 border-b border-line bg-page/60">
            <Field label={t('จากวันที่', 'From Date')}><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} prefix={<Icon.Calendar size={13}/>}/></Field>
            <Field label={t('ถึงวันที่', 'To Date')}><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} prefix={<Icon.Calendar size={13}/>}/></Field>
            <Field label={t('สินค้า', 'Item')}>
              <Select value={filterItem} onChange={e => setFilterItem(e.target.value)} className="w-[240px]">
                <option value="">{t('ทุกสินค้า', 'All Items')}</option>
                {state.items.map(i => <option key={i.code} value={i.code}>{i.code} — {i.name}</option>)}
              </Select>
            </Field>
            <div className="flex-1"/>
            <Button variant="ghost" size="sm" icon={<Icon.X size={13}/>} onClick={() => { setDateFrom(''); setDateTo(''); setFilterItem(''); }}>{t('ล้างตัวกรอง', 'Clear Filters')}</Button>
          </div>
        )}

        {tab === 'balance' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead className="bg-page border-b border-line text-ink-mute">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('รหัสสินค้า', 'Item Code')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('ชื่อสินค้า', 'Item Name')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('หน่วย', 'Unit')}</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">{t('รับเข้า', 'Stock In')}</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">{t('เบิกออก', 'Stock Out')}</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">{t('คงเหลือ', 'Balance')}</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">{t('มูลค่า (ราคาทุน)', 'Value (Cost)')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('สถานะ', 'Status')}</th>
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
                  <td colSpan="6" className="px-5 py-3 text-right text-ink-mute label-cap">{t('รวมมูลค่าสต๊อก', 'Total Stock Value')}</td>
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
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('วันที่', 'Date')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('เอกสาร', 'Document')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('ประเภท', 'Type')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('รหัสสินค้า', 'Item Code')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('ชื่อสินค้า', 'Item Name')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('คู่ค้า / แผนก', 'Party / Dept')}</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">{t('จำนวน', 'Qty')}</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">{t('มูลค่า', 'Value')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {movement.map((m, i) => (
                  <tr key={i} className="row-hover">
                    <td className="px-5 py-3 text-ink-mute kbd text-[12.5px]">{fmtDate(m.date)}</td>
                    <td className="px-5 py-3"><span className="kbd text-[12.5px] font-semibold text-brand-700">{m.doc}</span></td>
                    <td className="px-5 py-3">
                      {m.kind === 'in'
                        ? <Badge tone="good" icon={<Icon.ArrowDown size={11}/>}>{t('รับเข้า', 'Stock In')}</Badge>
                        : <Badge tone="danger" icon={<Icon.ArrowUp size={11}/>}>{t('เบิกออก', 'Stock Out')}</Badge>}
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
                {movement.length === 0 && <tr><td colSpan="8"><Empty title={t('ไม่พบรายการเคลื่อนไหว', 'No movement records found')} hint={t('ลองปรับตัวกรองวันที่หรือสินค้า', 'Try adjusting the date or item filters')}/></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
window.ReportsPage = ReportsPage;
