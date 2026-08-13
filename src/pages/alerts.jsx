// Low stock alerts page
const LOW_STOCK_LIMIT = 10;

function stockAlertTone(qty) {
  if (qty === 0) return 'danger';
  if (qty < LOW_STOCK_LIMIT) return 'warn';
  return 'good';
}

function stockAlertLabel(qty, t) {
  if (qty === 0) return t('หมดสต๊อก', 'Out of Stock');
  if (qty < LOW_STOCK_LIMIT) return t('ใกล้หมด', 'Low Stock');
  return t('ปกติ', 'OK');
}

function escapeAlertHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function AlertsPage({ store, nav, lang }) {
  const t = (th, en) => lang === 'en' ? en : th;
  const { state, stockMap } = store;
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('attention');

  const rows = useMemo(() => state.items.map(item => {
    const qty = stockMap.get(item.code) || 0;
    const reorderQty = Math.max(LOW_STOCK_LIMIT - qty, 0);
    return {
      ...item,
      qty,
      reorderQty,
      tone: stockAlertTone(qty),
      status: stockAlertLabel(qty, t),
      priority: qty === 0 ? 0 : qty < LOW_STOCK_LIMIT ? 1 : 2,
    };
  }), [state.items, stockMap, lang]);

  const counts = useMemo(() => rows.reduce((acc, row) => {
    acc.all += 1;
    if (row.qty === 0) acc.zero += 1;
    else if (row.qty < LOW_STOCK_LIMIT) acc.low += 1;
    else acc.ok += 1;
    return acc;
  }, { all: 0, zero: 0, low: 0, ok: 0 }), [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows
      .filter(row => {
        if (filter === 'zero') return row.qty === 0;
        if (filter === 'low') return row.qty > 0 && row.qty < LOW_STOCK_LIMIT;
        if (filter === 'ok') return row.qty >= LOW_STOCK_LIMIT;
        if (filter === 'attention') return row.qty < LOW_STOCK_LIMIT;
        return true;
      })
      .filter(row => !query ||
        row.code.toLowerCase().includes(query) ||
        row.name.toLowerCase().includes(query) ||
        (row.nameEn || '').toLowerCase().includes(query) ||
        row.unit.toLowerCase().includes(query)
      )
      .sort((a, b) => a.priority - b.priority || a.qty - b.qty || a.code.localeCompare(b.code));
  }, [rows, q, filter]);

  const attentionCount = counts.zero + counts.low;
  const suggestedUnits = useMemo(() => rows.reduce((sum, row) => sum + row.reorderQty, 0), [rows]);

  function exportAlertsCSV() {
    if (filtered.length === 0) {
      Toast.push(t('ไม่มีข้อมูลสำหรับส่งออก', 'No records to export'), 'danger');
      return;
    }
    exportCSV(
      `ZG-Low-Stock-Alerts-${todayISO()}.csv`,
      [
        t('รหัสสินค้า', 'Item Code'),
        t('ชื่อสินค้า', 'Item Name'),
        t('ชื่ออังกฤษ', 'English Name'),
        t('หน่วย', 'Unit'),
        t('คงเหลือ', 'Balance'),
        t('สถานะ', 'Status'),
        t('แนะนำสั่งเพิ่ม', 'Suggested Reorder'),
      ],
      filtered.map(row => [row.code, row.name, row.nameEn, row.unit, row.qty, row.status, row.reorderQty])
    );
    Toast.push(t('ส่งออก Low Stock CSV แล้ว', 'Low Stock CSV exported'));
  }

  function exportAlertsPDF() {
    if (filtered.length === 0) {
      Toast.push(t('ไม่มีข้อมูลสำหรับส่งออก', 'No records to export'), 'danger');
      return;
    }
    const tableRows = filtered.map(row => `
      <tr>
        <td class="mono brand">${escapeAlertHTML(row.code)}</td>
        <td>${escapeAlertHTML(row.name)}<br><span style="color:#6B7280;font-size:11px">${escapeAlertHTML(row.nameEn || row.unit)}</span></td>
        <td class="right mono ${row.qty === 0 ? 'danger' : row.qty < LOW_STOCK_LIMIT ? 'brand' : ''}">${fmtInt(row.qty)}</td>
        <td>${escapeAlertHTML(row.unit)}</td>
        <td><span class="badge ${row.qty < LOW_STOCK_LIMIT ? 'badge-out' : 'badge-in'}">${escapeAlertHTML(row.status)}</span></td>
        <td class="right mono">${row.reorderQty ? fmtInt(row.reorderQty) : '—'}</td>
      </tr>`).join('');
    printWindow(t('รายงานแจ้งเตือนสินค้าใกล้หมด', 'Low Stock Alert Report'), `
      <div class="info-grid">
        <div class="info-item"><label>${t('ต้องดูแล', 'Needs Attention')}</label><strong class="mono danger">${fmtInt(attentionCount)}</strong></div>
        <div class="info-item"><label>${t('หมดสต๊อก', 'Out of Stock')}</label><strong class="mono danger">${fmtInt(counts.zero)}</strong></div>
        <div class="info-item"><label>${t('ใกล้หมด', 'Low Stock')}</label><strong class="mono brand">${fmtInt(counts.low)}</strong></div>
        <div class="info-item"><label>${t('แนะนำสั่งเพิ่ม', 'Suggested Reorder')}</label><strong class="mono">${fmtInt(suggestedUnits)}</strong></div>
      </div>
      <table>
        <thead><tr>
          <th>${t('รหัสสินค้า', 'Item Code')}</th>
          <th>${t('ชื่อสินค้า', 'Item Name')}</th>
          <th class="right">${t('คงเหลือ', 'Balance')}</th>
          <th>${t('หน่วย', 'Unit')}</th>
          <th>${t('สถานะ', 'Status')}</th>
          <th class="right">${t('แนะนำสั่งเพิ่ม', 'Suggested Reorder')}</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table>`);
  }

  const filterOptions = [
    { value: 'attention', label: t('ต้องดูแล', 'Needs Attention'), count: attentionCount },
    { value: 'zero', label: t('หมดสต๊อก', 'Out of Stock'), count: counts.zero },
    { value: 'low', label: t('ใกล้หมด', 'Low Stock'), count: counts.low },
    { value: 'ok', label: t('ปกติ', 'OK'), count: counts.ok },
    { value: 'all', label: t('ทั้งหมด', 'All'), count: counts.all },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Low Stock Alerts"
        titleTh={t('แจ้งเตือนสต๊อกสินค้า', 'Low Stock Alerts')}
        subtitle={t(
          `สินค้าที่ต่ำกว่า ${LOW_STOCK_LIMIT} หน่วยควรตรวจสอบและสั่งเติม`,
          `Items below ${LOW_STOCK_LIMIT} units need review and replenishment`
        )}
        actions={
          <React.Fragment>
            <Button variant="secondary" size="sm" icon={<Icon.CSV size={14}/>} onClick={exportAlertsCSV}>CSV</Button>
            <Button variant="primary" size="sm" icon={<Icon.PDF size={14}/>} onClick={exportAlertsPDF}>PDF</Button>
          </React.Fragment>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI labelTh={t('ต้องดูแล', 'Needs Attention')} label={t('ต่ำกว่าระดับปลอดภัย', 'Below safe level')} tone="danger"
          icon={<Icon.Warn size={18}/>} value={fmtInt(attentionCount)}
          hint={t('รวมสินค้าหมดและใกล้หมด', 'Low and out-of-stock items')} />
        <KPI labelTh={t('หมดสต๊อก', 'Out of Stock')} label={t('ต้องเติมด่วน', 'Urgent refill')} tone="danger"
          icon={<Icon.Bolt size={18}/>} value={fmtInt(counts.zero)}
          hint={counts.zero ? t('ควรสั่งซื้อก่อนเบิกครั้งต่อไป', 'Reorder before next withdrawal') : t('ไม่มีรายการหมดสต๊อก', 'No out-of-stock items')} />
        <KPI labelTh={t('ใกล้หมด', 'Low Stock')} label={t(`เหลือ 1-${LOW_STOCK_LIMIT - 1}`, `Balance 1-${LOW_STOCK_LIMIT - 1}`)} tone="warn"
          icon={<Icon.Filter size={18}/>} value={fmtInt(counts.low)}
          hint={t('ควรตรวจสอบแผนการใช้งาน', 'Review upcoming usage')} />
        <KPI labelTh={t('แนะนำสั่งเพิ่ม', 'Suggested Reorder')} label={t('จำนวนรวมเพื่อกลับสู่ระดับปลอดภัย', 'Units to return to safe level')} tone="info"
          icon={<Icon.Inbox size={18}/>} value={fmtInt(suggestedUnits)}
          hint={t(`คำนวณจากเป้าหมาย ${LOW_STOCK_LIMIT} หน่วย`, `Based on ${LOW_STOCK_LIMIT} unit target`)} />
      </div>

      <Card padded={false}
        title={t('รายการแจ้งเตือน', 'Alert List')}
        subtitle={t('เรียงตามความเร่งด่วนและจำนวนคงเหลือ', 'Sorted by urgency and balance')}
        action={
          <div className="flex flex-col xl:flex-row xl:items-center gap-2 max-w-[min(76vw,820px)]">
            <Badge tone={attentionCount ? 'danger' : 'good'} size="md">
              <span className="kbd">{fmtInt(filtered.length)}</span>
              <span>{t('รายการ', 'records')}</span>
            </Badge>
            <Input
              className="w-full xl:w-[260px]"
              prefix={<Icon.Search size={14}/>}
              placeholder={t('ค้นหารหัส / ชื่อสินค้า...', 'Search item code / name...')}
              value={q}
              onChange={e => setQ(e.target.value)}
              suffix={q && (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  className="rounded-md p-0.5 text-ink-faint hover:text-ink hover:bg-page"
                  title={t('ล้างคำค้นหา', 'Clear search')}>
                  <Icon.X size={13}/>
                </button>
              )}
            />
            <div className="inline-flex max-w-full overflow-x-auto scrollbar-thin items-center gap-1 rounded-lg border border-line bg-page p-1">
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`h-8 px-3 rounded-md text-[12.5px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                    filter === option.value
                      ? 'bg-white text-brand-700 shadow-sm border border-line'
                      : 'text-ink-mute hover:text-ink hover:bg-white/60'
                  }`}>
                  {option.label} <span className="kbd text-[11px] text-ink-faint">{fmtInt(option.count)}</span>
                </button>
              ))}
            </div>
          </div>
        }>
        {filtered.length === 0 ? (
          <Empty
            title={t('ไม่พบรายการแจ้งเตือน', 'No alert records found')}
            hint={t('ลองเปลี่ยนตัวกรองหรือคำค้นหา', 'Try changing the filter or search')}
            icon={<Icon.Check/>}
          />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-[13.5px]">
              <thead className="bg-page border-y border-line text-ink-mute">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('รหัสสินค้า', 'Item Code')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('ชื่อสินค้า', 'Item Name')}</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">{t('คงเหลือ', 'Balance')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('หน่วย', 'Unit')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('สถานะ', 'Status')}</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">{t('แนะนำสั่งเพิ่ม', 'Suggested Reorder')}</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map(row => (
                  <tr key={row.code} className="row-hover">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md border border-line shrink-0 flex items-center justify-center"
                             style={{ background: row.img + '22' }}>
                          <div className="h-5 w-5 rounded" style={{ background: row.img }}/>
                        </div>
                        <span className="kbd text-[12.5px] text-ink-soft">{row.code}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{row.name}</div>
                      {row.nameEn && <div className="text-[11.5px] text-ink-faint">{row.nameEn}</div>}
                    </td>
                    <td className={`px-5 py-3 text-right kbd font-semibold tabular-nums ${row.qty === 0 ? 'text-danger-fg' : row.qty < LOW_STOCK_LIMIT ? 'text-amber2-fg' : 'text-good-fg'}`}>
                      {fmtInt(row.qty)}
                    </td>
                    <td className="px-5 py-3 text-ink-mute">{row.unit}</td>
                    <td className="px-5 py-3"><Badge tone={row.tone}>{row.status}</Badge></td>
                    <td className="px-5 py-3 text-right kbd tabular-nums font-medium">
                      {row.reorderQty ? fmtInt(row.reorderQty) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button variant={row.qty < LOW_STOCK_LIMIT ? 'danger' : 'secondary'} size="sm" icon={<Icon.Inbox size={13}/>} onClick={() => nav('stockin')}>
                        {row.qty < LOW_STOCK_LIMIT ? t('เติมสต๊อก', 'Restock') : t('รับเข้า', 'Stock In')}
                      </Button>
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

window.AlertsPage = AlertsPage;
