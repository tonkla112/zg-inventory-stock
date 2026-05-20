// Customers page
function CustomersPage({ store, lang }) {
  const t = (th, en) => lang === 'en' ? en : th;
  const { state, actions } = store;
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [viewCust, setViewCust] = useState(null);

  // order counts
  const counts = state.customers.map(c => {
    const orders = state.sos.filter(s => s.custCode === c.code);
    const total = orders.reduce((s, o) => s + soTotals(o, state.items).net, 0);
    return { ...c, ordersCount: orders.length, total };
  });
  const filtered = counts.filter(c => {
    const m = q.toLowerCase();
    return !q || c.code.toLowerCase().includes(m) || c.name.toLowerCase().includes(m) ||
           c.dept.toLowerCase().includes(m) || c.pos.toLowerCase().includes(m);
  });

  // department palette for avatars
  const deptColor = (d) => {
    const map = {
      'ฝ่ายผลิต':'#1D9E75', 'ฝ่ายซ่อมบำรุง':'#2563eb', 'ฝ่ายคลังสินค้า':'#d97706',
      'ฝ่าย QC':'#7c3aed', 'ฝ่ายบริหาร':'#0891b2',
    };
    return map[d] || '#64748b';
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers / Recipients"
        titleTh={t('ผู้รับสินค้า', 'Recipients')}
        subtitle={t('จัดการรายชื่อผู้รับสินค้าและประวัติการเบิก', 'Manage recipient list and withdrawal history')}
        actions={<Button variant="primary" icon={<Icon.Plus size={15}/>} size="sm" onClick={() => setEditing('new')}>{t('เพิ่มผู้รับสินค้า', 'Add Recipient')}</Button>}
      />

      <Card padded={false}>
        <div className="p-4 flex items-center gap-3 border-b border-line">
          <Input className="w-[320px]" prefix={<Icon.Search size={14}/>} placeholder={t('ค้นหารหัส/ชื่อ/แผนก...', 'Search code/name/dept...')}
            value={q} onChange={e => setQ(e.target.value)}/>
          <div className="flex-1"/>
          <span className="text-[12.5px] text-ink-mute">{t('ทั้งหมด', 'Total')} {state.customers.length} {t('คน', 'persons')}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead className="bg-page border-b border-line text-ink-mute">
              <tr>
                <th className="text-left font-medium px-5 py-2.5 label-cap">{t('รหัสลูกค้า', 'Customer Code')}</th>
                <th className="text-left font-medium px-5 py-2.5 label-cap">{t('ชื่อผู้รับ', 'Recipient Name')}</th>
                <th className="text-left font-medium px-5 py-2.5 label-cap">{t('ตำแหน่ง', 'Position')}</th>
                <th className="text-left font-medium px-5 py-2.5 label-cap">{t('แผนก', 'Department')}</th>
                <th className="text-left font-medium px-5 py-2.5 label-cap">{t('โทรศัพท์', 'Phone')}</th>
                <th className="text-right font-medium px-5 py-2.5 label-cap">{t('ใบขาย', 'Orders')}</th>
                <th className="text-right font-medium px-5 py-2.5 label-cap">{t('มูลค่ารวม', 'Total Value')}</th>
                <th className="text-right font-medium px-5 py-2.5 label-cap">{t('จัดการ', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map(c => (
                <tr key={c.code} className="row-hover">
                  <td className="px-5 py-3"><span className="kbd text-[12.5px] text-ink-soft">{c.code}</span></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-[12px]"
                        style={{ background: deptColor(c.dept) }}>
                        {c.name.replace('คุณ','').trim().charAt(0)}
                      </div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-mute">{c.pos}</td>
                  <td className="px-5 py-3">
                    <Badge tone="neutral" size="sm"><span style={{ color: deptColor(c.dept) }}>●</span>&nbsp;{c.dept}</Badge>
                  </td>
                  <td className="px-5 py-3 kbd text-[12.5px] text-ink-mute">{c.phone}</td>
                  <td className="px-5 py-3 text-right kbd tabular-nums font-semibold">{fmtInt(c.ordersCount)}</td>
                  <td className="px-5 py-3 text-right kbd tabular-nums">{fmtTHB(c.total)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <IconButton title={t('ดูประวัติ', 'View History')} icon={<Icon.Eye size={15}/>} onClick={() => setViewCust(c)}/>
                      <IconButton title={t('แก้ไข', 'Edit')} icon={<Icon.Edit size={15}/>} tone="brand" onClick={() => setEditing(c)}/>
                      <IconButton title={t('ลบ', 'Delete')} icon={<Icon.Trash size={15}/>} tone="danger"
                        onClick={() => { if (confirm(`${t('ลบผู้รับ', 'Delete recipient')} ${c.code}?`)) { actions.delCust(c.code); Toast.push(t('ลบเรียบร้อย', 'Deleted successfully')); } }}/>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="8"><Empty title={t('ไม่พบผู้รับสินค้า', 'No recipients found')}/></td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && <CustomerEditor
        cust={editing==='new' ? null : editing}
        nextCode={nextId('CUST', state.customers.map(c => ({ id: c.code })))}
        onClose={() => setEditing(null)}
        lang={lang}
        onSave={(c) => {
          if (editing === 'new') { actions.addCust(c); Toast.push(t('เพิ่มผู้รับสินค้าแล้ว', 'Recipient added')); }
          else { actions.updCust(editing.code, c); Toast.push(t('บันทึกแล้ว', 'Saved')); }
          setEditing(null);
        }}/>}
      {viewCust && <CustomerHistoryModal
        cust={viewCust}
        sos={state.sos}
        items={state.items}
        lang={lang}
        onClose={() => setViewCust(null)}
      />}
    </div>
  );
}

function CustomerEditor({ cust, nextCode, onClose, onSave, lang }) {
  const t = (th, en) => lang === 'en' ? en : th;
  const [form, setForm] = useState(cust || { code: nextCode, name:'', pos:'', dept:'', phone:'' });
  const set = (k,v) => setForm(s => ({ ...s, [k]: v }));
  return (
    <Modal open onClose={onClose}
      title={cust ? `${t('แก้ไขผู้รับ', 'Edit Recipient')} · ${cust.code}` : t('เพิ่มผู้รับสินค้าใหม่', 'Add New Recipient')}
      footer={
        <React.Fragment>
          <Button variant="ghost" onClick={onClose}>{t('ยกเลิก', 'Cancel')}</Button>
          <Button variant="primary" icon={<Icon.Save size={15}/>} onClick={() => onSave(form)}>{t('บันทึก', 'Save')}</Button>
        </React.Fragment>
      }>
      <div className="grid grid-cols-2 gap-4">
        <Field label={t('รหัสลูกค้า', 'Customer Code')} required>
          <Input value={form.code} readOnly prefix={<Icon.Hash size={13}/>}/>
        </Field>
        <Field label={t('โทรศัพท์', 'Phone')}>
          <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="08X-XXX-XXXX"/>
        </Field>
        <Field label={t('ชื่อ - นามสกุล', 'Full Name')} required className="col-span-2">
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder={t('เช่น คุณสมชาย วงศ์ไพรวัลย์', 'e.g. John Smith')}/>
        </Field>
        <Field label={t('ตำแหน่ง', 'Position')} required>
          <Input value={form.pos} onChange={e => set('pos', e.target.value)}/>
        </Field>
        <Field label={t('แผนก', 'Department')} required>
          <Input value={form.dept} onChange={e => set('dept', e.target.value)}/>
        </Field>
      </div>
    </Modal>
  );
}

function CustomerHistoryModal({ cust, sos, items, onClose, lang }) {
  const t = (th, en) => lang === 'en' ? en : th;
  const itemMap = new Map(items.map(i => [i.code, i]));
  const custSOs = sos.filter(s => s.custCode === cust.code).sort((a,b) => b.id.localeCompare(a.id));
  const totalSpend = custSOs.reduce((sum, s) => {
    const sub = s.lines.reduce((ls, l) => ls + (itemMap.get(l.code)?.sell || 0) * l.qty, 0);
    return sum + sub + (s.shipping||0) - (s.discount||0);
  }, 0);

  return (
    <Modal open onClose={onClose} title={`${t('ประวัติการเบิก', 'Withdrawal History')} · ${cust.name}`} width="max-w-3xl">
      <div className="space-y-4">
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-page border border-line p-3 text-center">
            <div className="label-cap">{t('ใบเบิกทั้งหมด', 'Total Orders')}</div>
            <div className="kbd text-[22px] font-semibold mt-1">{custSOs.length}</div>
          </div>
          <div className="rounded-lg bg-page border border-line p-3 text-center">
            <div className="label-cap">{t('มูลค่ารวม', 'Total Value')}</div>
            <div className="kbd text-[18px] font-semibold mt-1 text-brand-700">{fmtTHB(totalSpend)}</div>
          </div>
          <div className="rounded-lg bg-page border border-line p-3 text-center">
            <div className="label-cap">{t('แผนก', 'Department')}</div>
            <div className="text-[13.5px] font-medium mt-1 truncate">{cust.dept || '—'}</div>
          </div>
        </div>

        {/* SO list */}
        {custSOs.length === 0 ? (
          <Empty title={t('ยังไม่มีประวัติการเบิก', 'No withdrawal history')} hint={t('ลูกค้ารายนี้ยังไม่เคยเบิกสินค้า', 'This recipient has not made any withdrawals yet')}/>
        ) : (
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto scrollbar-thin rounded-lg border border-line">
            <table className="w-full text-[13px]">
              <thead className="bg-page border-b border-line text-ink-mute sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2.5 label-cap">{t('เลขที่ SO', 'SO No.')}</th>
                  <th className="text-left px-4 py-2.5 label-cap">{t('วันที่', 'Date')}</th>
                  <th className="text-left px-4 py-2.5 label-cap">{t('รายการสินค้า', 'Items')}</th>
                  <th className="text-right px-4 py-2.5 label-cap">{t('จำนวนเงิน', 'Amount')}</th>
                  <th className="text-center px-4 py-2.5 label-cap">{t('ลายเซ็น', 'Signature')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {custSOs.map(s => {
                  const sub = s.lines.reduce((ls, l) => ls + (itemMap.get(l.code)?.sell || 0) * l.qty, 0);
                  const net = sub + (s.shipping||0) - (s.discount||0);
                  return (
                    <tr key={s.id} className="row-hover">
                      <td className="px-4 py-2.5"><span className="kbd text-[12px] font-semibold text-brand-700">{s.id}</span></td>
                      <td className="px-4 py-2.5 text-ink-mute">{fmtDate(s.date)}</td>
                      <td className="px-4 py-2.5">
                        {s.lines.slice(0,2).map((l,i) => (
                          <span key={i} className="mr-2 text-ink-soft">{itemMap.get(l.code)?.name || l.code} ×{l.qty}</span>
                        ))}
                        {s.lines.length > 2 && <span className="text-ink-faint">+{s.lines.length-2} {t('รายการ', 'items')}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right kbd tabular-nums font-semibold">{fmtTHB(net)}</td>
                      <td className="px-4 py-2.5 text-center">
                        {s.sig
                          ? <Badge tone="good" size="xs" icon={<Icon.Check size={10}/>}>{t('เซ็นแล้ว', 'Signed')}</Badge>
                          : <Badge tone="warn" size="xs">{t('ยังไม่เซ็น', 'Unsigned')}</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>{t('ปิด', 'Close')}</Button>
        </div>
      </div>
    </Modal>
  );
}

Object.assign(window, { CustomersPage, CustomerEditor, CustomerHistoryModal });
