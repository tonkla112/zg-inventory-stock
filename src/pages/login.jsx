// Login page — Supabase Auth
const DEMO_ACCOUNTS = [
  { role:'admin',  email:'admin@zg-factory.co.th',  label:'Admin',          sub:'System Administrator',  abbr:'AD' },
  { role:'staff',  email:'staff@zg-factory.co.th',  label:'Warehouse Staff', sub:'หัวหน้าคลังสินค้า',     abbr:'WH' },
  { role:'viewer', email:'viewer@zg-factory.co.th', label:'Viewer',          sub:'ผู้ตรวจสอบภายใน',       abbr:'VW' },
];

function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);

  async function submit(e) {
    e?.preventDefault?.();
    if (!email || !password) { setError('กรุณากรอกอีเมลและรหัสผ่าน'); return; }
    setError(''); setBusy(true);
    const err = await onLogin(email.trim().toLowerCase(), password);
    if (err) { setError(err); setBusy(false); }
  }

  async function quickLogin(acct) {
    setEmail(acct.email); setPassword('');
    setError('กรุณากรอกรหัสผ่านแล้วกด Sign in (ระบบ production ไม่แสดงรหัสสำเร็จรูป)');
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-page" data-screen-label="ZG Inventory · Login">
      {/* Brand panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-brand-700 text-white p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}/>
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-brand-500/40 blur-3xl"/>
        <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl"/>

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
              <Icon.Logo size={20} className="text-white"/>
            </div>
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">ZG Inventory</div>
              <div className="text-[11px] text-white/70 label-cap">Stock Manager</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-[34px] font-semibold leading-tight tracking-tight max-w-md">
            ระบบจัดการคลังสินค้า<br/>โรงงาน ZG ระยอง
          </h1>
          <p className="mt-3 text-[15px] text-white/80 max-w-md">
            Industrial inventory management for ZG Rayong Plant — receive, issue, and track stock across every workshop in real time.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
            {[
              { th:'ฐานข้อมูล', en:'Database',   val:'Supabase' },
              { th:'Deploy',     en:'Hosting',    val:'Vercel'   },
              { th:'ความถูกต้อง',en:'Accuracy',  val:'99.8%'    },
            ].map(s => (
              <div key={s.en} className="rounded-xl bg-white/10 backdrop-blur border border-white/15 px-3 py-3">
                <div className="kbd text-[16px] font-semibold leading-none">{s.val}</div>
                <div className="text-[11px] text-white/70 mt-1.5">{s.th}</div>
                <div className="text-[10.5px] text-white/50">{s.en}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between text-[11.5px] text-white/60">
          <span>© 2026 ZG Industries (Thailand) Limited</span>
          <span className="kbd">Rayong Plant · EEC</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-9 w-9 rounded-lg bg-brand-500 flex items-center justify-center text-white">
              <Icon.Logo size={20}/>
            </div>
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">ZG Inventory</div>
              <div className="text-[11px] text-ink-mute label-cap">Stock Manager</div>
            </div>
          </div>

          <h2 className="text-[24px] font-semibold tracking-tight">เข้าสู่ระบบ</h2>
          <p className="text-[13.5px] text-ink-mute mt-1">ยินดีต้อนรับกลับ · Welcome back</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <Field label="อีเมล / Email" required>
              <Input prefix={<Icon.User size={14}/>} type="email" placeholder="your@email.com"
                value={email} onChange={e => setEmail(e.target.value)} autoFocus/>
            </Field>

            <Field label="รหัสผ่าน / Password" required>
              <Input prefix={<Icon.Lock size={14}/>} type={showPw?'text':'password'} placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                suffix={
                  <button type="button" onClick={() => setShowPw(s => !s)} className="text-ink-mute hover:text-ink">
                    {showPw ? <Icon.EyeOff size={15}/> : <Icon.Eye size={15}/>}
                  </button>
                }/>
            </Field>

            {error && (
              <div className="flex items-start gap-2 text-[13px] text-danger-fg bg-danger-bg border border-danger-bg rounded-lg px-3 py-2">
                <Icon.Warn size={14} className="mt-0.5 shrink-0"/><span>{error}</span>
              </div>
            )}

            <Button variant="primary" className="w-full justify-center h-10" disabled={busy}
              icon={busy ? null : <Icon.ArrowRight size={15}/>}>
              {busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ / Sign in'}
            </Button>
          </form>

          {/* Demo account hints */}
          <div className="mt-8 pt-5 border-t border-line">
            <p className="label-cap mb-3">บัญชีในระบบ / User Accounts</p>
            <div className="grid gap-2">
              {DEMO_ACCOUNTS.map(a => (
                <button key={a.role} onClick={() => quickLogin(a)}
                  className="text-left bg-white border border-line rounded-lg p-3 hover:border-brand-300 hover:bg-brand-50/40 transition-colors flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-semibold text-[12px] ${
                    a.role==='admin'?'bg-brand-50 text-brand-700':
                    a.role==='staff'?'bg-info-bg text-info-fg':
                    'bg-amber2-bg text-amber2-fg'
                  }`}>
                    {a.abbr}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13.5px] font-medium">{a.label}</span>
                    </div>
                    <div className="text-[12px] text-ink-mute truncate">{a.email}</div>
                  </div>
                  <Icon.ChevronRight size={14} className="text-ink-faint shrink-0"/>
                </button>
              ))}
            </div>
            <p className="mt-4 text-[11.5px] text-ink-faint">
              ข้อมูลเก็บใน Supabase Database · ดูคู่มือการตั้งค่าใน SETUP_GUIDE.md
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

window.LoginPage = LoginPage;
