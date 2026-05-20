// Dashboard page
function DashboardPage({ store, nav, lang }) {
  const t = (th, en) => lang === 'en' ? en : th;
  const { state, stockMap, actions } = store;
  const today = todayISO();
  const todayPOs = state.pos.filter(p => p.date === today);
  const todaySOs = state.sos.filter(s => s.date === today);
  const todayPOAmount = todayPOs.reduce((sum, p) => sum + p.price * p.qty, 0);
  const todaySOAmount = todaySOs.reduce((sum, s) => sum + soTotals(s, state.items).net, 0);
  const outOfStock = state.items.filter(i => (stockMap.get(i.code) || 0) === 0);

  // top 5 by stock
  const top5 = [...state.items]
    .map(i => ({ ...i, qty: stockMap.get(i.code) || 0 }))
    .sort((a,b) => b.qty - a.qty)
    .slice(0, 5);
  const maxStock = Math.max(...top5.map(t => t.qty), 1);

  // recent transactions feed (mix of POs and SOs)
  const itemMap = new Map(state.items.map(i => [i.code, i]));
  const custMap = new Map(state.customers.map(c => [c.code, c]));
  const feed = [
    ...state.pos.map(p => ({
      kind:'in', id:p.id, date:p.date, code:p.code,
      name:p.name, qty:p.qty, party: t('รับเข้าคลัง', 'Stock In'), amount:p.price*p.qty,
    })),
    ...state.sos.flatMap(s => s.lines.map(l => ({
      kind:'out', id:s.id, date:s.date, code:l.code,
      name:itemMap.get(l.code)?.name || l.code, qty:l.qty,
      party: custMap.get(s.custCode)?.dept || '—',
      amount:(itemMap.get(l.code)?.sell||0)*l.qty,
    })))
  ].sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 9);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('ภาพรวมคลังสินค้า', 'Inventory Dashboard')}
        titleTh={t('ภาพรวมคลังสินค้า', 'Inventory Dashboard')}
        subtitle={t(
          `ข้อมูล ณ วันที่ ${fmtDate(new Date())} • รวมรายการเคลื่อนไหว ${state.pos.length + state.sos.length} รายการ`,
          `Data as of ${fmtDate(new Date())} • Total ${state.pos.length + state.sos.length} transactions`
        )}
        actions={
          <React.Fragment>
            <Button variant="secondary" icon={<Icon.Refresh size={15}/>} size="sm" onClick={() => { actions.reload(); Toast.push(t('รีโหลดข้อมูลแล้ว', 'Data reloaded')); }}>{t('รีเฟรช', 'Refresh')}</Button>
            <Button variant="primary" icon={<Icon.Download size={15}/>} size="sm" onClick={() => {
                exportCSV(
                  `ZG-Stock-Balance-${todayISO()}.csv`,
                  [t('รหัสสินค้า','Item Code'), t('ชื่อสินค้า (ไทย)','Item Name'), t('หน่วย','Unit'), t('คงเหลือ','Balance'), t('ราคาทุน (฿)','Cost (฿)'), t('มูลค่ารวม (฿)','Total Value (฿)')],
                  state.items.map(i => {
                    const qty = stockMap.get(i.code) || 0;
                    return [i.code, i.name, i.unit, qty, i.buy, qty * i.buy];
                  })
                );
                Toast.push(t('ส่งออก CSV เรียบร้อยแล้ว', 'CSV exported successfully'));
              }}>{t('ส่งออกรายงาน', 'Export Report')}</Button>
          </React.Fragment>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI labelTh={t('สินค้าทั้งหมด', 'Total Items')} label={t('สินค้าทั้งหมด', 'Total items')} tone="brand"
          icon={<Icon.Box size={18}/>}
          value={fmtInt(state.items.length)}
          hint={t(`${state.items.length} SKU ในคลัง`, `${state.items.length} SKU in stock`)}
          delta={{ dir:'up', value: t('+2 สัปดาห์นี้', '+2 this week') }}
        />
        <KPI labelTh={t('สินค้าหมดสต๊อก', 'Out of Stock')} label={t('สินค้าหมดสต๊อก', 'Out of stock')} tone="danger"
          icon={<Icon.Bolt size={18}/>}
          value={fmtInt(outOfStock.length)}
          hint={outOfStock.length ? t('ต้องการสั่งซื้อด่วน', 'Urgent reorder needed') : t('สต๊อกครบทุกรายการ', 'All items in stock')}
        />
        <KPI labelTh={t('รับเข้าวันนี้', "Today's PO")} label={t('รับเข้าวันนี้', "Today's PO")} tone="info"
          icon={<Icon.Inbox size={18}/>}
          value={fmtInt(todayPOs.length)}
          hint={t(`มูลค่ารวม ${fmtTHB(todayPOAmount)}`, `Total value ${fmtTHB(todayPOAmount)}`)}
        />
        <KPI labelTh={t('เบิกออกวันนี้', "Today's SO")} label={t('เบิกออกวันนี้', "Today's SO")} tone="warn"
          icon={<Icon.Outbox size={18}/>}
          value={fmtInt(todaySOs.length)}
          hint={t(`มูลค่ารวม ${fmtTHB(todaySOAmount)}`, `Total value ${fmtTHB(todaySOAmount)}`)}
        />
      </div>

      {/* Middle: chart + feed */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3" padded={false}
          title={t('Top 5 สินค้าสต๊อกสูงสุด', 'Top 5 Highest Stock Items')}
          subtitle={t('Top 5 highest stock items', 'Top 5 highest stock items')}
          action={<Badge tone="brand" icon={<Icon.Chart size={11}/>}>Live</Badge>}
        >
          <div className="p-5 space-y-3.5">
            {top5.map((it, idx) => (
              <div key={it.code} className="grid grid-cols-[28px_1fr_84px] items-center gap-3">
                <div className="kbd text-[12px] text-ink-faint">#{idx+1}</div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="truncate text-[13.5px] font-medium">{it.name}</div>
                    <div className="kbd text-[11.5px] text-ink-mute">{it.code}</div>
                  </div>
                  <div className="h-2 rounded-full bg-page overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{
                        width: `${(it.qty / maxStock) * 100}%`,
                        background: `linear-gradient(90deg, #36B188, #1D9E75)`,
                      }} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="kbd text-[15px] font-semibold tabular-nums">{fmtInt(it.qty)}</div>
                  <div className="text-[11px] text-ink-faint">{it.unit}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2" padded={false}
          title={t('รายการเคลื่อนไหวล่าสุด', 'Recent Transactions')}
          subtitle={t('Recent transactions', 'Recent transactions')}
          action={<button onClick={() => nav('reports')} className="text-[12.5px] text-brand-700 hover:text-brand-800 font-medium inline-flex items-center gap-0.5">{t('ดูทั้งหมด', 'View all')} <Icon.ChevronRight size={13}/></button>}
        >
          <ul className="divide-y divide-line">
            {feed.map((f, i) => (
              <li key={i} className="px-5 py-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${f.kind==='in'?'bg-good-bg text-good-fg':'bg-danger-bg text-danger-fg'}`}>
                  {f.kind==='in' ? <Icon.ArrowDown size={14}/> : <Icon.ArrowUp size={14}/>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="kbd text-[11.5px] text-ink-mute">{f.id}</span>
                    <span className="text-[11.5px] text-ink-faint">·</span>
                    <span className="text-[11.5px] text-ink-mute truncate">{f.party}</span>
                  </div>
                  <div className="text-[13.5px] truncate">{f.name}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`kbd text-[13.5px] font-semibold ${f.kind==='in'?'text-good-fg':'text-danger-fg'}`}>
                    {f.kind==='in'?'+':'−'}{fmtInt(f.qty)}
                  </div>
                  <div className="text-[11px] text-ink-faint">{fmtDate(f.date)}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Low stock alert */}
      <Card padded={false}
        title={t('แจ้งเตือนสินค้าหมดสต๊อก', 'Out-of-Stock Alerts')}
        subtitle={t('Low stock & out-of-stock alerts', 'Low stock & out-of-stock alerts')}
        action={
          <div className="flex items-center gap-2">
            <Badge tone="danger" icon={<Icon.Bolt size={11}/>}>{outOfStock.length} {t('รายการ', 'items')}</Badge>
            <Button variant="soft" size="sm" icon={<Icon.Inbox size={14}/>} onClick={() => nav('stockin')}>{t('สั่งซื้อเข้าคลัง', 'Order Stock In')}</Button>
          </div>
        }
      >
        {outOfStock.length === 0 ? (
          <Empty title={t('ไม่มีสินค้าหมดสต๊อก', 'No out-of-stock items')} hint={t('สินค้าทั้งหมดอยู่ในระดับปลอดภัย', 'All items are at safe levels')} icon={<Icon.Check/>}/>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead className="bg-page border-y border-line text-ink-mute">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('รหัสสินค้า', 'Item Code')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('ชื่อสินค้า', 'Item Name')}</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">{t('คงเหลือ', 'Balance')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('หน่วย', 'Unit')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('สถานะ', 'Status')}</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {outOfStock.map(it => (
                  <tr key={it.code} className="row-hover">
                    <td className="px-5 py-3"><span className="kbd text-[12.5px] text-ink-soft">{it.code}</span></td>
                    <td className="px-5 py-3 font-medium">{it.name}</td>
                    <td className="px-5 py-3 text-right kbd font-semibold text-danger-fg">0</td>
                    <td className="px-5 py-3 text-ink-mute">{it.unit}</td>
                    <td className="px-5 py-3"><StockStatus qty={0}/></td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="danger" size="sm" icon={<Icon.Bolt size={13}/>} onClick={() => nav('stockin')}>{t('สั่งซื้อด่วน', 'Urgent Order')}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
window.DashboardPage = DashboardPage;
