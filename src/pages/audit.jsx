// Audit Logs page
function AuditLogsPage({ lang }) {
  const t = (th, en) => lang === 'en' ? en : th;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  async function loadAuditLogs() {
    setLoading(true);
    setError('');
    const { data, error: err } = await window.ZG_SUPABASE
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(250);

    if (err) {
      setLogs([]);
      setError(err.message || t('โหลดประวัติไม่สำเร็จ', 'Unable to load audit logs'));
      Toast.push(t('โหลดประวัติการใช้งานไม่สำเร็จ', 'Unable to load audit logs'), 'danger');
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  }

  useEffect(() => { loadAuditLogs(); }, []);

  const actions = useMemo(() => [...new Set(logs.map(l => l.action).filter(Boolean))].sort(), [logs]);
  const entities = useMemo(() => [...new Set(logs.map(l => l.entity_type).filter(Boolean))].sort(), [logs]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs
      .filter(l => !actionFilter || l.action === actionFilter)
      .filter(l => !entityFilter || l.entity_type === entityFilter)
      .filter(l => !dateFilter || String(l.created_at || '').slice(0, 10) === dateFilter)
      .filter(l => {
        if (!q) return true;
        return [
          l.action, l.entity_type, l.entity_id, l.reason,
          l.actor_email, l.actor_name, l.actor_role,
        ].some(v => String(v || '').toLowerCase().includes(q));
      });
  }, [logs, search, actionFilter, entityFilter, dateFilter]);

  const summary = useMemo(() => {
    const today = todayISO();
    return logs.reduce((totals, log) => {
      totals.all += 1;
      if (String(log.created_at || '').slice(0, 10) === today) totals.today += 1;
      if (log.action === 'delete' || log.action === 'cancel') totals.critical += 1;
      if (log.entity_type === 'sale_order') totals.saleOrders += 1;
      return totals;
    }, { all: 0, today: 0, critical: 0, saleOrders: 0 });
  }, [logs]);

  function actionTone(action) {
    if (action === 'delete' || action === 'cancel') return 'danger';
    if (action === 'approve') return 'good';
    if (action === 'update') return 'warn';
    return 'brand';
  }

  function actionLabel(action) {
    const labels = {
      create: t('สร้าง', 'Create'),
      update: t('แก้ไข', 'Update'),
      delete: t('ลบ', 'Delete'),
      cancel: t('ยกเลิก', 'Cancel'),
      approve: t('อนุมัติ', 'Approve'),
      backup: t('สำรองข้อมูล', 'Backup'),
    };
    return labels[action] || action || '—';
  }

  function entityLabel(entity) {
    const labels = {
      item: t('สินค้า', 'Item'),
      customer: t('ผู้รับสินค้า', 'Recipient'),
      purchase_order: t('รับเข้า', 'Stock In'),
      sale_order: t('เบิกออก', 'Withdrawal'),
      sale_order_line: t('รายการเบิก', 'Withdrawal Line'),
      system: t('ระบบ', 'System'),
    };
    return labels[entity] || entity || '—';
  }

  function fmtAuditTime(value) {
    const dt = new Date(value);
    if (isNaN(dt)) return '—';
    return dt.toLocaleString('th-TH', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function exportLogs() {
    exportCSV(
      `ZG-Audit-Logs-${todayISO()}.csv`,
      [
        t('เวลา', 'Time'),
        t('การกระทำ', 'Action'),
        t('ประเภทข้อมูล', 'Entity'),
        t('เลขอ้างอิง', 'Reference'),
        t('ผู้ใช้งาน', 'User'),
        t('บทบาท', 'Role'),
        t('เหตุผล', 'Reason'),
      ],
      filteredLogs.map(l => [
        fmtAuditTime(l.created_at),
        actionLabel(l.action),
        entityLabel(l.entity_type),
        l.entity_id || '',
        l.actor_name || l.actor_email || '',
        l.actor_role || '',
        l.reason || '',
      ])
    );
    Toast.push(t('Export CSV เรียบร้อยแล้ว', 'CSV exported successfully'));
  }

  const clearFilters = () => {
    setSearch('');
    setActionFilter('');
    setEntityFilter('');
    setDateFilter('');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Logs"
        titleTh={t('ประวัติการใช้งาน', 'Audit Logs')}
        subtitle={t('ตรวจสอบการเปลี่ยนแปลงข้อมูลสำคัญในระบบ', 'Review important system data changes')}
        actions={
          <React.Fragment>
            <Button variant="secondary" size="sm" icon={<Icon.Refresh size={14}/>} onClick={loadAuditLogs} disabled={loading}>
              {t('รีเฟรช', 'Refresh')}
            </Button>
            <Button variant="primary" size="sm" icon={<Icon.CSV size={14}/>} onClick={exportLogs} disabled={filteredLogs.length === 0}>
              Export CSV
            </Button>
          </React.Fragment>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label={t('รายการทั้งหมด', 'All records')} labelTh={t('ทั้งหมด', 'All')} value={fmtInt(summary.all)}
          hint={t('ประวัติที่โหลดล่าสุด', 'Latest loaded logs')} icon={<Icon.Chart size={18}/>} tone="brand"/>
        <KPI label={t('วันนี้', 'Today')} labelTh={t('วันนี้', 'Today')} value={fmtInt(summary.today)}
          hint={t('รายการของวันปัจจุบัน', 'Current day records')} icon={<Icon.Calendar size={18}/>} tone="info"/>
        <KPI label={t('ลบ / ยกเลิก', 'Delete / Cancel')} labelTh={t('รายการสำคัญ', 'Critical')} value={fmtInt(summary.critical)}
          hint={t('รายการที่ควรตรวจสอบ', 'Records to review')} icon={<Icon.Warn size={18}/>} tone="danger"/>
        <KPI label={t('เอกสารเบิกออก', 'Sale Orders')} labelTh={t('SO', 'SO')} value={fmtInt(summary.saleOrders)}
          hint={t('ประวัติที่เกี่ยวกับใบเบิก', 'Withdrawal-related logs')} icon={<Icon.Outbox size={18}/>} tone="warn"/>
      </div>

      <Card padded={false} title={t('รายการประวัติ', 'Activity Records')} subtitle={t('ล่าสุด 250 รายการ', 'Latest 250 records')}
        action={<Badge tone={error ? 'danger' : 'brand'} size="md">{error ? t('ตรวจสอบสิทธิ์', 'Check access') : `${filteredLogs.length} ${t('รายการ', 'rows')}`}</Badge>}>
        <div className="p-4 flex flex-wrap items-end gap-2 border-b border-line bg-page/60">
          <Field label={t('ค้นหา', 'Search')} className="min-w-[220px] flex-1">
            <Input prefix={<Icon.Search size={14}/>} placeholder={t('ค้นหา SO, PO, ผู้ใช้...', 'Search SO, PO, user...')}
              value={search} onChange={e => setSearch(e.target.value)}/>
          </Field>
          <Field label={t('การกระทำ', 'Action')}>
            <Select className="w-[160px]" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="">{t('ทั้งหมด', 'All')}</option>
              {actions.map(a => <option key={a} value={a}>{actionLabel(a)}</option>)}
            </Select>
          </Field>
          <Field label={t('ประเภท', 'Entity')}>
            <Select className="w-[180px]" value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
              <option value="">{t('ทั้งหมด', 'All')}</option>
              {entities.map(e => <option key={e} value={e}>{entityLabel(e)}</option>)}
            </Select>
          </Field>
          <Field label={t('วันที่', 'Date')}>
            <Input className="w-[160px]" type="date" prefix={<Icon.Calendar size={13}/>}
              value={dateFilter} onChange={e => setDateFilter(e.target.value)}/>
          </Field>
          <Button variant="ghost" size="sm" icon={<Icon.X size={13}/>} onClick={clearFilters}>
            {t('ล้างตัวกรอง', 'Clear')}
          </Button>
        </div>

        {loading ? (
          <Empty title={t('กำลังโหลดประวัติ...', 'Loading audit logs...')} icon={<Icon.Refresh/>}/>
        ) : error ? (
          <Empty title={t('ไม่สามารถโหลดประวัติได้', 'Unable to load audit logs')} hint={error} icon={<Icon.Warn/>}/>
        ) : filteredLogs.length === 0 ? (
          <Empty title={t('ไม่พบประวัติ', 'No audit records found')} hint={t('ลองเปลี่ยนตัวกรอง', 'Try changing filters')} icon={<Icon.Search/>}/>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead className="bg-page border-b border-line text-ink-mute">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('เวลา', 'Time')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('การกระทำ', 'Action')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('ข้อมูล', 'Entity')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('เลขอ้างอิง', 'Reference')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('ผู้ใช้งาน', 'User')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('เหตุผล', 'Reason')}</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">{t('รายละเอียด', 'Details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="row-hover">
                    <td className="px-5 py-3 text-ink-mute whitespace-nowrap">{fmtAuditTime(log.created_at)}</td>
                    <td className="px-5 py-3"><Badge tone={actionTone(log.action)}>{actionLabel(log.action)}</Badge></td>
                    <td className="px-5 py-3">{entityLabel(log.entity_type)}</td>
                    <td className="px-5 py-3"><span className="kbd text-[12.5px] text-brand-700">{log.entity_id || '—'}</span></td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{log.actor_name || log.actor_email || '—'}</div>
                      <div className="text-[12px] text-ink-faint">{log.actor_role || '—'}</div>
                    </td>
                    <td className="px-5 py-3 max-w-[260px] truncate text-ink-mute">{log.reason || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="secondary" size="sm" icon={<Icon.Eye size={14}/>} onClick={() => setSelectedLog(log)}>
                        {t('ดู', 'View')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!selectedLog} onClose={() => setSelectedLog(null)}
        title={t('รายละเอียดประวัติ', 'Audit Detail')} width="max-w-2xl">
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-line p-3">
                <div className="label-cap">{t('เวลา', 'Time')}</div>
                <div className="mt-1 text-[14px]">{fmtAuditTime(selectedLog.created_at)}</div>
              </div>
              <div className="rounded-lg border border-line p-3">
                <div className="label-cap">{t('ผู้ใช้งาน', 'User')}</div>
                <div className="mt-1 text-[14px]">{selectedLog.actor_name || selectedLog.actor_email || '—'}</div>
              </div>
              <div className="rounded-lg border border-line p-3">
                <div className="label-cap">{t('การกระทำ', 'Action')}</div>
                <div className="mt-1"><Badge tone={actionTone(selectedLog.action)}>{actionLabel(selectedLog.action)}</Badge></div>
              </div>
              <div className="rounded-lg border border-line p-3">
                <div className="label-cap">{t('เลขอ้างอิง', 'Reference')}</div>
                <div className="mt-1 kbd text-[14px] text-brand-700">{selectedLog.entity_id || '—'}</div>
              </div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <div className="label-cap">{t('เหตุผล', 'Reason')}</div>
              <div className="mt-1 text-[14px] text-ink-soft">{selectedLog.reason || '—'}</div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <div className="label-cap mb-2">{t('ข้อมูลเพิ่มเติม', 'Details')}</div>
              <pre className="text-[12px] leading-relaxed bg-page border border-line rounded-lg p-3 overflow-auto max-h-[260px]">{JSON.stringify(selectedLog.details || {}, null, 2)}</pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
window.AuditLogsPage = AuditLogsPage;
