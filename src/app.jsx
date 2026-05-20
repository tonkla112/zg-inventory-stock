// App shell — Supabase auth + sidebar + topbar + page router

// ---- Error boundary (class component required by React) ----
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-page gap-4 p-8">
          <div className="h-12 w-12 rounded-xl bg-danger-fg flex items-center justify-center text-white shadow-card">
            <Icon.Warn size={22}/>
          </div>
          <div className="text-[17px] font-semibold text-ink">ระบบขัดข้อง / System Error</div>
          <div className="text-[13px] text-ink-mute max-w-md text-center leading-relaxed">
            {this.state.error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}
          </div>
          <button onClick={() => window.location.reload()}
            className="mt-2 px-5 py-2.5 bg-brand-500 text-white rounded-lg text-[14px] font-medium hover:bg-brand-600">
            รีโหลดหน้า / Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---- Loading screen ----
function Loader({ text }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-page gap-4">
      <div className="h-11 w-11 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-card">
        <Icon.Logo size={22}/>
      </div>
      <div className="text-[13.5px] text-ink-mute">{text || 'กำลังโหลด...'}</div>
      <div className="w-48 h-1.5 bg-brand-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full animate-pulse" style={{width:'60%'}}/>
      </div>
    </div>
  );
}

// ---- Authenticated shell (mounts store only when logged in) ----
function MainApp({ auth, onLogout, dark, setDark, lang, setLang }) {
  const store = useStore();
  const [page, setPage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const t = (th, en) => lang === 'en' ? en : th;

  // Compute role + nav before any hooks that depend on them
  const role = auth.role;
  const nav = [
    { key:'dashboard', th:'ภาพรวม',     en:'Dashboard',  icon:<Icon.Dashboard size={17}/> },
    { key:'items',     th:'สินค้า',      en:'Items',      icon:<Icon.Box size={17}/>,    badge: store.state.items.length },
    { key:'stockin',   th:'รับเข้า',     en:'Stock In',   icon:<Icon.Inbox size={17}/>,  roles:['admin','staff'] },
    { key:'stockout',  th:'เบิกออก',     en:'Stock Out',  icon:<Icon.Outbox size={17}/>, roles:['admin','staff'] },
    { key:'customers', th:'ผู้รับสินค้า', en:'Customers',  icon:<Icon.Users size={17}/>,  badge: store.state.customers.length, roles:['admin','staff'] },
    { key:'reports',   th:'รายงาน',      en:'Reports',    icon:<Icon.Chart size={17}/> },
  ].filter(n => !n.roles || n.roles.includes(role));

  // ALL hooks must be called in the same order every render — before any early returns
  useEffect(() => {
    if (!userMenuOpen) return;
    function onDoc(e) {
      if (!e.target.closest?.('[data-user-menu]')) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!nav.find(n => n.key === page)) setPage('dashboard');
  }, [role]);

  // Early return is safe now — all hooks have already been called above
  if (!store.ready) return <Loader text="กำลังโหลดข้อมูลจาก Database..."/>;

  const can = { write: role !== 'viewer', settings: role === 'admin' };

  const pageEl = (() => {
    switch (page) {
      case 'dashboard': return <DashboardPage store={store} nav={setPage} lang={lang}/>;
      case 'items':     return <ItemsPage store={store} lang={lang}/>;
      case 'stockin':   return <StockInPage store={store} lang={lang}/>;
      case 'stockout':  return <StockOutPage store={store} lang={lang}/>;
      case 'customers': return <CustomersPage store={store} lang={lang}/>;
      case 'reports':   return <ReportsPage store={store} lang={lang}/>;
      default: return null;
    }
  })();

  const currentNav = nav.find(n => n.key === page);
  const outOfStockCount = store.state.items.filter(i => (store.stockMap.get(i.code) || 0) === 0).length;
  const displayName = (auth.name || auth.email || 'User').replace('คุณ','').trim() || 'U';

  return (
    <div className="min-h-screen flex" data-screen-label={`ZG Inventory · ${currentNav?.en}`}>
      {/* Sidebar */}
      <aside className={`fixed lg:static z-40 inset-y-0 left-0 w-[240px] bg-white border-r border-line flex flex-col transition-transform ${mobileOpen?'translate-x-0':'-translate-x-full lg:translate-x-0'}`}>
        <div className="h-14 px-4 flex items-center gap-2.5 border-b border-line">
          <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-white">
            <Icon.Logo size={18}/>
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-[14px] tracking-tight">ZG Inventory</div>
            <div className="text-[10.5px] text-ink-mute label-cap mt-0.5">Stock Manager</div>
          </div>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto scrollbar-thin">
          <div className="label-cap mb-1.5 px-2">{t('เมนูหลัก', 'Main Menu')}</div>
          <ul className="space-y-0.5">
            {nav.map(n => (
              <li key={n.key}>
                <button onClick={() => { setPage(n.key); setMobileOpen(false); }}
                  className={`w-full h-10 px-2.5 rounded-lg flex items-center gap-2.5 text-[14px] transition-colors ${page===n.key ? 'bg-brand-50 text-brand-700 font-medium' : 'text-ink-soft hover:bg-page'}`}>
                  <span className={page===n.key ? 'text-brand-600' : 'text-ink-mute'}>{n.icon}</span>
                  <span className="flex-1 text-left">{lang === 'en' ? n.en : n.th}</span>
                  {typeof n.badge === 'number' && (
                    <span className="kbd text-[10.5px] text-ink-faint">{n.badge}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <div className="label-cap mb-1.5 px-2 mt-5">{t('ระบบ', 'System')}</div>
          <ul className="space-y-0.5">
            <li>
              <button onClick={() => store.actions.reload()}
                className="w-full h-10 px-2.5 rounded-lg flex items-center gap-2.5 text-[14px] text-ink-soft hover:bg-page">
                <Icon.Refresh size={17} className="text-ink-mute"/><span>{t('รีโหลดข้อมูล', 'Reload Data')}</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-3 border-t border-line">
          <div className="rounded-lg bg-page border border-line p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-500 pulse-dot"/>
              <span className="text-[12px] font-medium">{t('คลังออนไลน์', 'Online Warehouse')}</span>
            </div>
            <p className="text-[11px] text-ink-mute leading-snug">
              ZG Rayong Plant<br/>
              {t('ปรับปรุงล่าสุด', 'Last updated')} {new Date().toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' })}
            </p>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="lg:hidden fixed inset-0 z-30 bg-ink/30" onClick={() => setMobileOpen(false)}/>}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top header */}
        <header className="h-14 bg-white border-b border-line px-4 lg:px-6 flex items-center gap-3 sticky top-0 z-20">
          <button className="lg:hidden p-1.5 -ml-1.5 rounded text-ink-mute hover:bg-page" onClick={() => setMobileOpen(true)}>
            <Icon.Menu size={18}/>
          </button>

          <div className="flex items-center gap-2 text-[13px] text-ink-mute">
            <Icon.Dashboard size={14}/>
            <span>ZG Inventory</span>
            <Icon.ChevronRight size={13} className="text-ink-faint"/>
            <span className="text-ink font-medium">{lang === 'en' ? currentNav?.en : currentNav?.th}</span>
          </div>

          <div className="flex-1"/>

          <div className="hidden md:flex items-center gap-1 px-3 h-9 border border-line2 rounded-lg bg-white w-[280px]">
            <Icon.Search size={14} className="text-ink-mute"/>
            <input placeholder={t('ค้นหาสินค้า, PO, SO หรือผู้รับ...', 'Search items, PO, SO or recipient...')} className="flex-1 bg-transparent text-[13px] placeholder:text-ink-faint"/>
            <kbd className="kbd text-[10px] px-1.5 py-0.5 rounded border border-line text-ink-mute">⌘K</kbd>
          </div>

          <button className="relative p-2 rounded-lg text-ink-mute hover:bg-page" title="การแจ้งเตือน">
            <Icon.Bell size={17}/>
            {outOfStockCount > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-danger-fg text-white text-[10px] font-semibold flex items-center justify-center">{outOfStockCount}</span>
            )}
          </button>

          {/* Language toggle */}
          <button
            onClick={() => setLang(l => l === 'th' ? 'en' : 'th')}
            className="flex items-center gap-0.5 h-8 px-2 rounded-lg border border-line hover:bg-page transition-colors"
            title={lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}>
            <span className={`text-[11.5px] font-semibold px-1 ${lang === 'th' ? 'text-brand-700' : 'text-ink-faint'}`}>TH</span>
            <span className="text-ink-faint text-[11px]">|</span>
            <span className={`text-[11.5px] font-semibold px-1 ${lang === 'en' ? 'text-brand-700' : 'text-ink-faint'}`}>EN</span>
          </button>

          <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg text-ink-mute hover:bg-page"
            title={dark ? t('สลับเป็นโหมดสว่าง', 'Switch to Light Mode') : t('สลับเป็นโหมดมืด', 'Switch to Dark Mode')}>
            {dark ? <Icon.Sun size={17}/> : <Icon.Moon size={17}/>}
          </button>

          <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-line relative" data-user-menu>
            <button onClick={() => setUserMenuOpen(o => !o)} className="flex items-center gap-2.5 hover:bg-page rounded-lg pr-1 -mr-1 transition-colors">
              <div className={`h-8 w-8 rounded-full text-white flex items-center justify-center text-[12px] font-semibold ${
                role==='admin'?'bg-brand-600':role==='staff'?'bg-info-fg':'bg-amber2-fg'}`}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block leading-tight text-left">
                <div className="text-[13px] font-medium">{auth.name || auth.email}</div>
                <div className="text-[11px] text-ink-mute">{auth.email}</div>
              </div>
              <Icon.ChevronDown size={13} className="text-ink-mute hidden md:block"/>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-line rounded-card shadow-pop overflow-hidden z-30">
                <div className="px-4 py-3 border-b border-line">
                  <div className="text-[13.5px] font-medium">{auth.name || auth.email}</div>
                  <div className="text-[11.5px] text-ink-mute mt-0.5">{auth.email}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Badge tone={role==='admin'?'brand':role==='staff'?'info':'warn'} size="xs">
                      {role==='admin'?'Admin':role==='staff'?'Warehouse Staff':'Viewer'}
                    </Badge>
                    {auth.dept && <span className="text-[11px] text-ink-faint">· {auth.dept}</span>}
                  </div>
                </div>
                <ul className="py-1.5">
                  <li><button className="w-full px-4 h-9 text-left text-[13.5px] hover:bg-page flex items-center gap-2.5"><Icon.User size={14} className="text-ink-mute"/>{t('โปรไฟล์ของฉัน', 'My Profile')}</button></li>
                  <li><button className="w-full px-4 h-9 text-left text-[13.5px] hover:bg-page flex items-center gap-2.5" onClick={() => setDark(d => !d)}>
                    {dark ? <Icon.Sun size={14} className="text-ink-mute"/> : <Icon.Moon size={14} className="text-ink-mute"/>}
                    {dark ? t('โหมดสว่าง', 'Light Mode') : t('โหมดมืด', 'Dark Mode')}
                  </button></li>
                </ul>
                <div className="border-t border-line py-1.5">
                  <button onClick={onLogout} className="w-full px-4 h-9 text-left text-[13.5px] hover:bg-danger-bg hover:text-danger-fg flex items-center gap-2.5 text-danger-fg">
                    <Icon.Logout size={14}/>{t('ออกจากระบบ', 'Sign out')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-[1480px] w-full mx-auto">
          {pageEl}
        </main>

        <footer className="px-6 py-3 text-[11.5px] text-ink-faint border-t border-line bg-white flex items-center justify-between flex-wrap gap-2">
          <span>© 2026 ZG Inventory Stock · {t('ระบบจัดการคลังสินค้าโรงงาน', 'Warehouse Management System')} v2.0</span>
          <span className="kbd">Rayong Plant · Supabase</span>
        </footer>
      </div>

      <Toast.Host/>
    </div>
  );
}

// ---- Root App: handles Supabase auth state ----
function App() {
  const [auth, setAuth] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dark, setDark] = useState(() => {
    try {
      const v = localStorage.getItem('zg-theme');
      if (v) return v === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('zg-theme', dark ? 'dark' : 'light'); } catch(e) {}
  }, [dark]);

  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('zg-lang') || 'th'; } catch(e) { return 'th'; }
  });
  useEffect(() => {
    try { localStorage.setItem('zg-lang', lang); } catch(e) {}
  }, [lang]);

  // Supabase auth listener
  useEffect(() => {
    const sb = window.ZG_SUPABASE;

    function sessionToAuth(session) {
      if (!session) return null;
      const u = session.user;
      return {
        role:  u.user_metadata?.role  || 'viewer',
        name:  u.user_metadata?.name  || u.email || '',
        email: u.email || '',
        pos:   u.user_metadata?.pos   || '',
        dept:  u.user_metadata?.dept  || '',
      };
    }

    sb.auth.getSession().then(({ data }) => {
      setAuth(sessionToAuth(data.session));
      setAuthLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setAuth(sessionToAuth(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  async function doLogin(email, password) {
    const { error } = await window.ZG_SUPABASE.auth.signInWithPassword({ email, password });
    return error ? (error.message || 'เข้าสู่ระบบไม่สำเร็จ') : null;
  }

  async function doLogout() {
    await window.ZG_SUPABASE.auth.signOut();
    setAuth(null);
  }

  if (authLoading) return <Loader text="กำลังตรวจสอบสิทธิ์..."/>;
  if (!auth)       return <LoginPage onLogin={doLogin}/>;

  return <MainApp auth={auth} onLogout={doLogout} dark={dark} setDark={setDark} lang={lang} setLang={setLang}/>;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <App/>
  </AppErrorBoundary>
);
