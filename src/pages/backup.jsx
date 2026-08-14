// Admin backup/export page
const BACKUP_PAGE_SIZE = 1000;
const BACKUP_TABLES = [
  {
    key: 'items',
    th: 'สินค้า',
    en: 'Items',
    order: 'code',
    columns: ['code', 'name', 'name_en', 'unit', 'buy_price', 'sell_price', 'color', 'created_at'],
  },
  {
    key: 'customers',
    th: 'ผู้รับสินค้า',
    en: 'Recipients',
    order: 'code',
    columns: ['code', 'name', 'pos', 'dept', 'phone', 'created_at'],
  },
  {
    key: 'purchase_orders',
    th: 'รับเข้า',
    en: 'Stock In',
    order: 'created_at',
    ascending: false,
    columns: ['id', 'date', 'item_code', 'item_name', 'unit', 'price', 'qty', 'created_at'],
  },
  {
    key: 'sale_orders',
    th: 'เบิกออก',
    en: 'Withdrawals',
    order: 'created_at',
    ascending: false,
    columns: [
      'id', 'date', 'cust_code', 'shipping', 'discount', 'has_sig', 'signature_data',
      'status', 'cancel_reason', 'canceled_at', 'requested_by', 'approval_status',
      'approved_by', 'approved_at', 'created_at',
    ],
  },
  {
    key: 'sale_order_lines',
    th: 'รายการสินค้าในใบเบิก',
    en: 'Withdrawal Lines',
    order: 'id',
    columns: ['id', 'so_id', 'item_code', 'qty', 'price', 'created_at'],
  },
  {
    key: 'audit_logs',
    th: 'ประวัติใช้งาน',
    en: 'Audit Logs',
    order: 'created_at',
    ascending: false,
    columns: ['id', 'created_at', 'action', 'entity_type', 'entity_id', 'actor_email', 'actor_name', 'actor_role', 'reason', 'details'],
  },
];

function BackupPage({ lang }) {
  const t = (th, en) => lang === 'en' ? en : th;
  const [tables, setTables] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastLoaded, setLastLoaded] = useState('');
  const [backupActivity, setBackupActivity] = useState([]);

  async function fetchTableRows(table) {
    let from = 0;
    let rows = [];

    while (true) {
      let query = window.ZG_SUPABASE
        .from(table.key)
        .select('*')
        .range(from, from + BACKUP_PAGE_SIZE - 1);

      if (table.order) {
        query = query.order(table.order, { ascending: table.ascending !== false });
      }

      const { data, error } = await query;
      if (error) throw error;

      const pageRows = data || [];
      rows = rows.concat(pageRows);
      if (pageRows.length < BACKUP_PAGE_SIZE) return rows;
      from += BACKUP_PAGE_SIZE;
    }
  }

  async function loadBackupTables() {
    setLoading(true);
    setErrors({});

    const results = await Promise.all(BACKUP_TABLES.map(async table => {
      try {
        const data = await fetchTableRows(table);
        return { key: table.key, data, error: null };
      } catch (error) {
        return { key: table.key, data: [], error };
      }
    }));

    const nextTables = {};
    const nextErrors = {};
    results.forEach(result => {
      nextTables[result.key] = result.data || [];
      if (result.error) nextErrors[result.key] = result.error.message || String(result.error);
    });

    setTables(nextTables);
    setErrors(nextErrors);
    setLastLoaded(new Date().toISOString());
    setLoading(false);

    if (Object.keys(nextErrors).length) {
      Toast.push(t('โหลดข้อมูลบางตารางไม่สำเร็จ', 'Some backup tables could not be loaded'), 'danger');
    }
  }

  async function loadBackupActivity() {
    const { data, error } = await window.ZG_SUPABASE
      .from('audit_logs')
      .select('*')
      .eq('action', 'backup')
      .eq('entity_type', 'system')
      .order('created_at', { ascending: false })
      .limit(8);

    if (!error) setBackupActivity(data || []);
  }

  async function currentAuditActor() {
    try {
      const { data } = await window.ZG_SUPABASE.auth.getUser();
      const user = data?.user || {};
      const meta = user.user_metadata || {};
      return {
        actor_email: user.email || '',
        actor_name: meta.name || user.email || '',
        actor_role: meta.role || '',
      };
    } catch (e) {
      return { actor_email: '', actor_name: '', actor_role: '' };
    }
  }

  async function recordBackupActivity({ type, tableKey = '', rowCount = 0, filename = '' }) {
    try {
      const actor = await currentAuditActor();
      const details = {
        type,
        table: tableKey,
        rowCount,
        filename,
        counts: type === 'full' ? Object.fromEntries(BACKUP_TABLES.map(table => [table.key, tables[table.key]?.length || 0])) : {},
      };
      const { error } = await window.ZG_SUPABASE.from('audit_logs').insert({
        action: 'backup',
        entity_type: 'system',
        entity_id: tableKey || 'full',
        reason: type === 'full' ? 'Full backup downloaded' : `${tableKey} backup downloaded`,
        details,
        ...actor,
      });
      if (!error) await loadBackupActivity();
    } catch (e) {}
  }

  useEffect(() => {
    loadBackupTables();
    loadBackupActivity();
  }, []);

  const summary = useMemo(() => {
    const tableCount = BACKUP_TABLES.length;
    const loadedTables = BACKUP_TABLES.filter(table => !errors[table.key] && tables[table.key]).length;
    const totalRows = BACKUP_TABLES.reduce((sum, table) => sum + (tables[table.key]?.length || 0), 0);
    const lastBackup = backupActivity[0] || null;
    const lastBackupDate = String(lastBackup?.created_at || '').slice(0, 10);
    const backedUpToday = lastBackupDate === todayISO();
    return { tableCount, loadedTables, totalRows, errorCount: Object.keys(errors).length, lastBackup, backedUpToday };
  }, [tables, errors, backupActivity]);

  function labelFor(table) {
    return lang === 'en' ? table.en : table.th;
  }

  function loadedAtText() {
    return formatBackupTime(lastLoaded);
  }

  function formatBackupTime(value) {
    if (!value) return '—';
    const dt = new Date(value);
    if (isNaN(dt)) return '—';
    return dt.toLocaleString('th-TH', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function backupTypeLabel(type) {
    const labels = {
      full: t('สำรองทั้งหมด', 'Full Backup'),
      csv: 'CSV',
      json: 'JSON',
    };
    return labels[type] || type || '—';
  }

  function downloadBlob(filename, body, type) {
    const blob = new Blob([body], { type });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function serialiseCell(value) {
    if (value == null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
  }

  function tableHeaders(table) {
    const rows = tables[table.key] || [];
    const detected = [...new Set(rows.flatMap(row => Object.keys(row || {})))];
    return table.columns.filter(column => detected.includes(column)).concat(detected.filter(column => !table.columns.includes(column)));
  }

  function exportTableCSV(table) {
    const headers = tableHeaders(table);
    const rows = (tables[table.key] || []).map(row => headers.map(header => serialiseCell(row?.[header])));
    const filename = `ZG-${table.key}-${todayISO()}.csv`;
    exportCSV(filename, headers, rows);
    recordBackupActivity({ type: 'csv', tableKey: table.key, rowCount: rows.length, filename });
    Toast.push(t('ดาวน์โหลด CSV แล้ว', 'CSV downloaded'));
  }

  function exportTableJSON(table) {
    const filename = `ZG-${table.key}-${todayISO()}.json`;
    const payload = {
      app: 'ZG Inventory Stock',
      table: table.key,
      exportedAt: new Date().toISOString(),
      rowCount: tables[table.key]?.length || 0,
      rows: tables[table.key] || [],
    };
    downloadBlob(filename, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
    recordBackupActivity({ type: 'json', tableKey: table.key, rowCount: tables[table.key]?.length || 0, filename });
    Toast.push(t('ดาวน์โหลด JSON แล้ว', 'JSON downloaded'));
  }

  function exportFullBackup() {
    const filename = `ZG-Full-Backup-${todayISO()}.json`;
    const payload = {
      app: 'ZG Inventory Stock',
      exportedAt: new Date().toISOString(),
      source: 'Supabase',
      counts: Object.fromEntries(BACKUP_TABLES.map(table => [table.key, tables[table.key]?.length || 0])),
      errors,
      tables,
    };
    downloadBlob(filename, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
    recordBackupActivity({ type: 'full', rowCount: summary.totalRows, filename });
    Toast.push(t('ดาวน์โหลด Backup ทั้งหมดแล้ว', 'Full backup downloaded'));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Backup"
        titleTh={t('สำรองข้อมูล', 'Backup')}
        subtitle={t('ส่งออกข้อมูลสำคัญของระบบสำหรับผู้ดูแลเท่านั้น', 'Export important system data for admins only')}
        actions={
          <React.Fragment>
            <Button variant="secondary" size="sm" icon={<Icon.Refresh size={14}/>} onClick={loadBackupTables} disabled={loading}>
              {t('รีเฟรช', 'Refresh')}
            </Button>
            <Button variant="primary" size="sm" icon={<Icon.Download size={14}/>} onClick={exportFullBackup} disabled={loading || summary.loadedTables === 0}>
              {t('ดาวน์โหลดทั้งหมด', 'Full Backup')}
            </Button>
          </React.Fragment>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label={t('ตารางที่พร้อมสำรอง', 'Tables ready')} labelTh={t('ตาราง', 'Tables')} value={`${fmtInt(summary.loadedTables)}/${fmtInt(summary.tableCount)}`}
          hint={t('ข้อมูลจาก Supabase', 'Data from Supabase')} icon={<Icon.Save size={18}/>} tone="brand"/>
        <KPI label={t('จำนวนแถวทั้งหมด', 'Total rows')} labelTh={t('ข้อมูล', 'Rows')} value={fmtInt(summary.totalRows)}
          hint={t('รวมทุกตารางที่โหลดได้', 'Across loaded tables')} icon={<Icon.Chart size={18}/>} tone="info"/>
        <KPI label={t('โหลดล่าสุด', 'Last loaded')} labelTh={t('เวลา', 'Time')} value={lastLoaded ? loadedAtText().split(' ').slice(-2).join(' ') : '—'}
          hint={loadedAtText()} icon={<Icon.Calendar size={18}/>} tone="warn"/>
        <KPI label={t('ข้อผิดพลาด', 'Errors')} labelTh={t('สถานะ', 'Status')} value={fmtInt(summary.errorCount)}
          hint={summary.errorCount ? t('มีบางตารางโหลดไม่ได้', 'Some tables need attention') : t('พร้อมสำรองข้อมูล', 'Ready to export')} icon={<Icon.Warn size={18}/>} tone={summary.errorCount ? 'danger' : 'brand'}/>
      </div>

      <Card
        title={t('สถานะการสำรองข้อมูล', 'Backup Status')}
        subtitle={t('บันทึกจาก Audit Logs เพื่อให้รู้ว่ามีการสำรองข้อมูลล่าสุดเมื่อไหร่', 'Tracked from Audit Logs so admins can see the latest backup')}
        action={
          <Badge tone={summary.backedUpToday ? 'good' : 'warn'} size="md" icon={summary.backedUpToday ? <Icon.Check size={12}/> : <Icon.Warn size={12}/>}>
            {summary.backedUpToday ? t('สำรองแล้ววันนี้', 'Backed up today') : t('ยังไม่ได้สำรองวันนี้', 'No backup today')}
          </Badge>
        }>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-line bg-page/60 p-4">
            <div className="label-cap">{t('สำรองล่าสุด', 'Last Backup')}</div>
            <div className="mt-2 text-[18px] font-semibold">{formatBackupTime(summary.lastBackup?.created_at)}</div>
            <div className="text-[12.5px] text-ink-mute mt-1">{backupTypeLabel(summary.lastBackup?.details?.type)}</div>
          </div>
          <div className="rounded-lg border border-line bg-page/60 p-4">
            <div className="label-cap">{t('ผู้สำรองล่าสุด', 'Last Exported By')}</div>
            <div className="mt-2 text-[18px] font-semibold truncate">{summary.lastBackup?.actor_name || '—'}</div>
            <div className="text-[12.5px] text-ink-mute mt-1 truncate">{summary.lastBackup?.actor_email || '—'}</div>
          </div>
          <div className="rounded-lg border border-line bg-page/60 p-4">
            <div className="label-cap">{t('ไฟล์ล่าสุด', 'Latest File')}</div>
            <div className="mt-2 text-[14px] font-semibold truncate kbd">{summary.lastBackup?.details?.filename || '—'}</div>
            <div className="text-[12.5px] text-ink-mute mt-1">
              {summary.lastBackup?.details?.rowCount ? `${fmtInt(summary.lastBackup.details.rowCount)} ${t('แถว', 'rows')}` : '—'}
            </div>
          </div>
        </div>

        {!summary.backedUpToday && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber2-bg bg-amber2-bg/40 px-4 py-3">
            <Icon.Warn size={16} className="text-amber2-fg mt-0.5 shrink-0"/>
            <div className="text-[13px] text-ink-soft">
              {t('แนะนำให้ดาวน์โหลด Full Backup อย่างน้อยวันละครั้ง โดยเฉพาะก่อนแก้ไขข้อมูลจำนวนมาก', 'Download a full backup at least once per day, especially before large data changes.')}
            </div>
          </div>
        )}
      </Card>

      <Card title={t('รายการตาราง', 'Backup Tables')} subtitle={t('ดาวน์โหลดรายตารางเป็น CSV หรือ JSON', 'Download each table as CSV or JSON')} padded={false}
        action={<Badge tone={summary.errorCount ? 'warn' : 'good'} size="md">{summary.errorCount ? t('ตรวจสอบสิทธิ์', 'Check access') : t('พร้อมใช้งาน', 'Ready')}</Badge>}>
        {loading ? (
          <Empty title={t('กำลังโหลดข้อมูลสำรอง...', 'Loading backup data...')} icon={<Icon.Refresh/>}/>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead className="bg-page border-b border-line text-ink-mute">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('ตาราง', 'Table')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('ชื่อระบบ', 'System Name')}</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">{t('จำนวน', 'Rows')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('สถานะ', 'Status')}</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">{t('ดาวน์โหลด', 'Download')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {BACKUP_TABLES.map(table => {
                  const rowCount = tables[table.key]?.length || 0;
                  const error = errors[table.key];
                  return (
                    <tr key={table.key} className="row-hover">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-ink">{labelFor(table)}</div>
                        <div className="text-[12px] text-ink-faint">{table.en}</div>
                      </td>
                      <td className="px-5 py-3"><span className="kbd text-[12.5px] text-brand-700">{table.key}</span></td>
                      <td className="px-5 py-3 text-right kbd font-semibold">{fmtInt(rowCount)}</td>
                      <td className="px-5 py-3">
                        {error ? (
                          <div className="max-w-[360px]">
                            <Badge tone="danger">{t('โหลดไม่ได้', 'Failed')}</Badge>
                            <div className="text-[12px] text-danger-fg mt-1 truncate" title={error}>{error}</div>
                          </div>
                        ) : (
                          <Badge tone="good" icon={<Icon.Check size={11}/>}>{t('พร้อม', 'Ready')}</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" icon={<Icon.CSV size={13}/>} onClick={() => exportTableCSV(table)} disabled={!!error || rowCount === 0}>
                            CSV
                          </Button>
                          <Button variant="soft" size="sm" icon={<Icon.Download size={13}/>} onClick={() => exportTableJSON(table)} disabled={!!error || rowCount === 0}>
                            JSON
                          </Button>
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

      <Card title={t('ประวัติสำรองล่าสุด', 'Recent Backup Activity')} subtitle={t('แสดงรายการสำรองล่าสุดจาก Audit Logs', 'Latest backup downloads from Audit Logs')} padded={false}
        action={<Badge tone="brand" size="md">{backupActivity.length} {t('รายการ', 'records')}</Badge>}>
        {backupActivity.length === 0 ? (
          <Empty title={t('ยังไม่มีประวัติสำรองข้อมูล', 'No backup activity yet')} hint={t('เมื่อดาวน์โหลด Backup ระบบจะบันทึกไว้ที่นี่', 'Backup downloads will appear here')} icon={<Icon.Download/>}/>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead className="bg-page border-b border-line text-ink-mute">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('เวลา', 'Time')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('ประเภท', 'Type')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('ตาราง', 'Table')}</th>
                  <th className="text-left font-medium px-5 py-2.5 label-cap">{t('ผู้ใช้งาน', 'User')}</th>
                  <th className="text-right font-medium px-5 py-2.5 label-cap">{t('จำนวน', 'Rows')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {backupActivity.map(entry => (
                  <tr key={entry.id} className="row-hover">
                    <td className="px-5 py-3 whitespace-nowrap text-ink-mute">{formatBackupTime(entry.created_at)}</td>
                    <td className="px-5 py-3"><Badge tone={entry.details?.type === 'full' ? 'brand' : 'info'}>{backupTypeLabel(entry.details?.type)}</Badge></td>
                    <td className="px-5 py-3"><span className="kbd text-[12.5px] text-brand-700">{entry.details?.table || entry.entity_id || 'full'}</span></td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{entry.actor_name || entry.actor_email || '—'}</div>
                      <div className="text-[12px] text-ink-faint">{entry.actor_role || '—'}</div>
                    </td>
                    <td className="px-5 py-3 text-right kbd">{fmtInt(entry.details?.rowCount || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-[14px] font-semibold">{t('คำแนะนำ', 'Recommendation')}</div>
            <p className="text-[13px] text-ink-mute mt-1">
              {t('ดาวน์โหลด Full Backup หลังจบงานประจำวัน หรือก่อนแก้ไขข้อมูลจำนวนมาก', 'Download a full backup after daily work or before large data changes.')}
            </p>
          </div>
          <Badge tone="brand" size="md" icon={<Icon.Lock size={12}/>}>Admin Only</Badge>
        </div>
      </Card>
    </div>
  );
}
