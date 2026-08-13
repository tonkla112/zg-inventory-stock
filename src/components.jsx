// Shared UI primitives
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---- Money / formatters
const fmtTHB = (n, { sign = false } = {}) => {
  const v = Number(n || 0);
  const s = v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (sign && v > 0 ? '+' : '') + '฿' + s;
};
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US');
const fmtDate = (d) => {
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toLocaleDateString('th-TH', { day:'2-digit', month:'short', year:'numeric' });
};
const todayISO = () => new Date().toISOString().slice(0, 10);
window.fmtTHB = fmtTHB; window.fmtInt = fmtInt; window.fmtDate = fmtDate; window.todayISO = todayISO;

// ---- Button
function Button({ variant='primary', size='md', icon, iconRight, children, className='', ...rest }) {
  const h = size === 'sm' ? 'h-8 text-[13px] px-3' : 'h-9 text-[14px] px-3.5';
  const v = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-300',
    secondary: 'bg-white text-ink border border-line2 hover:bg-page',
    ghost: 'bg-transparent text-ink-soft hover:bg-page',
    danger: 'bg-white text-danger-fg border border-danger-bg hover:bg-danger-bg',
    info: 'bg-info-fg/95 text-white hover:bg-info-fg',
    soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  }[variant];
  return (
    <button {...rest}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${h} ${v} ${className}`}>
      {icon}{children}{iconRight}
    </button>
  );
}

// ---- Card
function Card({ title, subtitle, action, children, className='', bodyClass='p-5', padded=true }) {
  return (
    <section className={`bg-white border border-line rounded-card ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line">
          <div>
            {title && <h3 className="text-[15px] font-semibold text-ink leading-snug">{title}</h3>}
            {subtitle && <p className="text-[13px] text-ink-mute mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? bodyClass : ''}>{children}</div>
    </section>
  );
}

// ---- Input
function Field({ label, hint, error, children, className='', required, badge }) {
  return (
    <label className={`block ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="label-cap">
          {label}{required && <span className="text-danger-fg ml-1">*</span>}
        </span>
        {badge}
      </div>
      {children}
      {(hint || error) && (
        <p className={`mt-1 text-[12px] ${error ? 'text-danger-fg' : 'text-ink-mute'}`}>{error || hint}</p>
      )}
    </label>
  );
}
function Input({ className='', readOnly, prefix, suffix, ...rest }) {
  return (
    <div className={`flex items-center bg-white border border-line2 rounded-lg h-9 px-3 focus-within:shadow-[0_0_0_2px_rgba(29,158,117,.18)] focus-within:border-brand-500 transition-shadow ${readOnly?'bg-page text-ink-mute':''} ${className}`}>
      {prefix && <span className="text-ink-mute text-[13px] mr-2 shrink-0">{prefix}</span>}
      <input {...rest} readOnly={readOnly}
        className={`w-full bg-transparent text-[14px] placeholder:text-ink-faint ${readOnly?'cursor-default':''}`} />
      {suffix && <span className="text-ink-mute ml-2 shrink-0">{suffix}</span>}
    </div>
  );
}
function Select({ className='', children, ...rest }) {
  return (
    <div className={`relative flex items-center bg-white border border-line2 rounded-lg h-9 px-3 focus-within:shadow-[0_0_0_2px_rgba(29,158,117,.18)] focus-within:border-brand-500 ${className}`}>
      <select {...rest} className="w-full bg-transparent text-[14px] appearance-none pr-5">
        {children}
      </select>
      <Icon.ChevronDown size={14} className="absolute right-3 pointer-events-none text-ink-mute"/>
    </div>
  );
}

// ---- Badge / status
function Badge({ tone='neutral', icon, children, size='sm', className='' }) {
  const tones = {
    neutral: 'bg-page text-ink-soft border-line',
    good: 'bg-good-bg text-good-fg border-good-bg',
    warn: 'bg-amber2-bg text-amber2-fg border-amber2-bg',
    danger: 'bg-danger-bg text-danger-fg border-danger-bg',
    info: 'bg-info-bg text-info-fg border-info-bg',
    brand: 'bg-brand-50 text-brand-700 border-brand-50',
  }[tone];
  const sz = size === 'xs' ? 'text-[10px] px-2 h-5' : size === 'md' ? 'text-[13px] px-2.5 h-6' : 'text-[11.5px] px-2 h-[22px]';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${tones} ${sz} ${className}`}>
      {icon}{children}
    </span>
  );
}
function StockStatus({ qty, size='sm' }) {
  if (qty === 0) return <Badge tone="danger" size={size} icon={<Icon.Bolt size={11}/>}><span>หมดสต๊อก</span></Badge>;
  if (qty < 10) return <Badge tone="warn" size={size} icon={<Icon.Warn size={11}/>}><span>ใกล้หมด</span></Badge>;
  return <Badge tone="good" size={size} icon={<Icon.Check size={11}/>}><span>สต๊อกปกติ</span></Badge>;
}

// ---- Tabs
function Tabs({ items, value, onChange }) {
  return (
    <div className="flex items-center gap-1 border-b border-line">
      {items.map(it => (
        <button key={it.value} onClick={() => onChange(it.value)}
          className={`h-10 px-3 -mb-px border-b-2 text-[13.5px] font-medium transition-colors ${value===it.value ? 'border-brand-500 text-brand-700' : 'border-transparent text-ink-mute hover:text-ink'}`}>
          {it.label}{typeof it.count==='number' && <span className="ml-1.5 text-ink-faint kbd">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ---- Modal
function Modal({ open, onClose, title, children, width='max-w-lg', footer, headerAction }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]" onClick={onClose}></div>
      <div className={`relative bg-white rounded-card border border-line shadow-pop w-full ${width}`}>
        <header className="flex items-center justify-between px-5 h-12 border-b border-line">
          <div className="flex items-center gap-2 min-w-0">
            {headerAction}
            <h3 className="text-[15px] font-semibold truncate">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 -mr-1.5 rounded hover:bg-page text-ink-mute"><Icon.X size={16}/></button>
        </header>
        <div className="p-5">{children}</div>
        {footer && <footer className="px-5 py-3 border-t border-line flex items-center justify-end gap-2 bg-page rounded-b-card">{footer}</footer>}
      </div>
    </div>
  );
}

// ---- Toast (lightweight, single-shot)
const Toast = (() => {
  let setter = null;
  function Host() {
    const [msgs, setMsgs] = useState([]);
    useEffect(() => { setter = setMsgs; return () => { setter = null; }; }, []);
    return (
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
        {msgs.map(m => (
          <div key={m.id} className={`px-4 py-3 rounded-lg shadow-pop border bg-white flex items-center gap-2 ${m.tone==='danger'?'border-danger-bg':'border-line'}`}>
            {m.tone==='danger' ? <Icon.Warn size={16} className="text-danger-fg"/> : <Icon.Check size={16} className="text-brand-600"/>}
            <span className="text-[13.5px]">{m.text}</span>
          </div>
        ))}
      </div>
    );
  }
  function push(text, tone='good') {
    const id = Math.random().toString(36).slice(2);
    setter && setter(s => [...s, { id, text, tone }]);
    setTimeout(() => setter && setter(s => s.filter(x => x.id !== id)), 2600);
  }
  return { Host, push };
})();

// ---- Page header
function PageHeader({ title, titleTh, subtitle, actions }) {
  return (
    <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
      <div>
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight">
          {titleTh} <span className="text-ink-faint font-normal text-[15px] ml-1">/ {title}</span>
        </h1>
        {subtitle && <p className="text-[13.5px] text-ink-mute mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

// ---- KPI card
function KPI({ label, labelTh, value, hint, icon, tone='brand', delta }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    danger: 'bg-danger-bg text-danger-fg',
    info: 'bg-info-bg text-info-fg',
    warn: 'bg-amber2-bg text-amber2-fg',
  };
  return (
    <div className="bg-white border border-line rounded-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="label-cap">{labelTh}</p>
          <p className="text-[12px] text-ink-faint mt-0.5">{label}</p>
        </div>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${tones[tone]}`}>{icon}</div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-[28px] font-semibold leading-none tracking-tight kbd">{value}</div>
        {delta && <span className={`text-[12px] font-medium ${delta.dir==='up'?'text-brand-600':'text-danger-fg'}`}>{delta.dir==='up'?'↑':'↓'} {delta.value}</span>}
      </div>
      {hint && <p className="mt-2 text-[12.5px] text-ink-mute">{hint}</p>}
    </div>
  );
}

// ---- Empty state
function Empty({ title, hint, action, icon }) {
  return (
    <div className="text-center py-12 px-6">
      <div className="mx-auto h-12 w-12 rounded-full bg-page border border-line flex items-center justify-center text-ink-mute">{icon || <Icon.Box/>}</div>
      <p className="mt-3 font-medium">{title}</p>
      {hint && <p className="text-[13px] text-ink-mute mt-1">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

// ---- IconButton
function IconButton({ icon, onClick, tone='neutral', title, className='' }) {
  const tones = {
    neutral: 'text-ink-mute hover:bg-page hover:text-ink',
    danger: 'text-ink-mute hover:bg-danger-bg hover:text-danger-fg',
    brand: 'text-ink-mute hover:bg-brand-50 hover:text-brand-700',
  }[tone];
  return (
    <button title={title} onClick={onClick}
      className={`h-7 w-7 rounded-md inline-flex items-center justify-center transition-colors ${tones} ${className}`}>
      {icon}
    </button>
  );
}

// ---- Export CSV utility
function exportCSV(filename, headers, rows) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))];
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- Print / PDF window utility
function printWindow(title, bodyHtml) {
  const existingPreview = document.getElementById('zg-print-preview');
  if (existingPreview) {
    if (typeof existingPreview.__zgClosePreview === 'function') existingPreview.__zgClosePreview();
    else existingPreview.remove();
  }

  const rawTitle = String(title ?? '');
  const safeTitle = rawTitle.replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
  const filename = `${rawTitle || 'ZG Inventory document'}`
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'ZG Inventory document';

  const printHtml = `<!doctype html><html lang="th"><head><meta charset="utf-8">
    <title>${safeTitle}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: "IBM Plex Sans", "IBM Plex Sans Thai", system-ui, sans-serif; font-size: 13px; color: #111; padding: 32px; }
      .zg-header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:14px; border-bottom:2.5px solid #1D9E75; margin-bottom:18px; }
      .zg-logo { font-size:18px; font-weight:700; color:#1D9E75; letter-spacing:-.3px; }
      .zg-sub { color:#6B7280; font-size:11.5px; margin-top:3px; }
      h2 { font-size:15px; font-weight:600; }
      table { width:100%; border-collapse:collapse; margin-top:12px; font-size:12.5px; }
      th { background:#F8FAFB; text-align:left; padding:8px 10px; font-size:10.5px; text-transform:uppercase; letter-spacing:.06em; border-bottom:1.5px solid #E5E7EB; color:#6B7280; }
      td { padding:7px 10px; border-bottom:1px solid #E5E7EB; }
      tfoot td { background:#F8FAFB; font-weight:600; border-top:2px solid #E5E7EB; }
      .right { text-align:right; }
      .mono { font-family:"IBM Plex Mono",monospace; }
      .brand { color:#1D9E75; font-weight:600; }
      .danger { color:#A32D2D; }
      .good { color:#0F6E56; }
      .badge { display:inline-block; padding:1px 8px; border-radius:99px; font-size:11px; }
      .badge-in { background:#E1F5EE; color:#0F6E56; }
      .badge-out { background:#FCEBEB; color:#A32D2D; }
      .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px; font-size:12.5px; }
      .info-item label { color:#6B7280; font-size:10.5px; text-transform:uppercase; letter-spacing:.06em; display:block; margin-bottom:2px; }
      .zg-footer { margin-top:22px; text-align:right; font-size:11px; color:#9CA3AF; border-top:1px solid #E5E7EB; padding-top:8px; }
      @media print { body { padding:32px; } }
    </style>
  </head><body>
    <div class="zg-header">
      <div>
        <div class="zg-logo">ZG Inventory Stock</div>
        <div class="zg-sub">ระบบจัดการคลังสินค้า · ZG Rayong Plant · WHA</div>
      </div>
      <div style="text-align:right">
        <h2>${safeTitle}</h2>
        <div class="zg-sub">พิมพ์วันที่ ${new Date().toLocaleDateString('th-TH',{day:'2-digit',month:'long',year:'numeric'})}</div>
      </div>
    </div>
    ${bodyHtml}
    <div class="zg-footer">ZG Industries (Thailand) Limited · Rayong Plant · ระบบจัดการคลังสินค้า v2.0</div>
  </body></html>`;

  const previousOverflow = document.body.style.overflow;
  const preview = document.createElement('div');
  preview.id = 'zg-print-preview';
  preview.setAttribute('role', 'dialog');
  preview.setAttribute('aria-modal', 'true');
  preview.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;background:#070C0F;color:#E5E7EB;font-family:"IBM Plex Sans","IBM Plex Sans Thai",system-ui,sans-serif;';
  preview.innerHTML = `
    <style>
      #zg-print-preview button { -webkit-tap-highlight-color: transparent; }
      #zg-print-preview [data-print-toolbar] { min-height:72px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 18px;background:#11181C;border-bottom:1px solid #243038; }
      #zg-print-preview [data-print-leading] { min-width:0;display:flex;align-items:center;gap:12px; }
      #zg-print-preview [data-print-title] { min-width:0; }
      #zg-print-preview [data-print-actions] { display:flex;align-items:center;gap:10px;flex-shrink:0; }
      #zg-print-preview [data-print-group] { display:flex;align-items:center;gap:6px;padding:3px;border:1px solid #2A3740;border-radius:10px;background:#0B1114; }
      #zg-print-preview [data-print-button] { min-height:42px;padding:9px 14px;border:1px solid #35444D;border-radius:8px;background:#162025;color:#E5E7EB;font:600 14px "IBM Plex Sans","IBM Plex Sans Thai",system-ui,sans-serif;cursor:pointer;white-space:nowrap; }
      #zg-print-preview [data-print-button]:hover { background:#1C2A30; }
      #zg-print-preview [data-print-close] { border-color:#54D7AE;background:#12372E;color:#8EF0CF;font-weight:800; }
      #zg-print-preview [data-print-close]:hover { background:#164638; }
      #zg-print-preview [data-print-button].primary { border-color:#1D9E75;background:#1D9E75;color:white;font-weight:700; }
      #zg-print-preview [data-print-button].active { border-color:#54D7AE;background:#12372E;color:#8EF0CF; }
      #zg-print-preview [data-print-scroll] { flex:1;min-height:0;padding:18px;background:#0B1114;overflow:auto; }
      #zg-print-preview iframe { display:block;width:min(100%,980px);height:100%;min-height:720px;margin:0 auto;border:0;border-radius:8px;background:white;box-shadow:0 24px 80px rgba(0,0,0,.38);transition:width .18s ease; }
      @media (max-width: 860px) {
        #zg-print-preview [data-print-toolbar] { align-items:flex-start;flex-direction:column;padding:12px; }
        #zg-print-preview [data-print-leading] { width:100%;align-items:flex-start;flex-direction:column;gap:10px; }
        #zg-print-preview [data-print-title] { width:100%; }
        #zg-print-preview [data-print-actions] { width:100%;display:grid;grid-template-columns:1fr 1fr;gap:8px; }
        #zg-print-preview [data-print-group] { grid-column:1 / -1;display:grid;grid-template-columns:repeat(3,1fr);gap:6px; }
        #zg-print-preview [data-print-button] { width:100%;min-height:46px;padding:10px 12px; }
        #zg-print-preview [data-print-scroll] { padding:10px; }
        #zg-print-preview iframe { min-height:calc(100vh - 230px);border-radius:6px; }
      }
    </style>
    <div data-print-toolbar>
      <div data-print-leading>
        <button type="button" data-print-button data-print-close aria-label="Back to app">← กลับ / Back</button>
        <div data-print-title>
          <div style="font-size:11px;line-height:1.2;text-transform:uppercase;letter-spacing:.12em;color:#9CA3AF;">Print Preview</div>
          <div style="margin-top:3px;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${safeTitle}</div>
        </div>
      </div>
      <div data-print-actions>
        <div data-print-group aria-label="Preview size">
          <button type="button" data-print-button data-print-zoom="fit" class="active">Fit</button>
          <button type="button" data-print-button data-print-zoom="100">100%</button>
          <button type="button" data-print-button data-print-zoom="125">125%</button>
        </div>
        <button type="button" data-print-button data-print-download>ดาวน์โหลด / Download</button>
        <button type="button" data-print-button data-print-action class="primary">Save PDF / Print</button>
      </div>
    </div>
    <div data-print-scroll>
      <iframe title="${safeTitle}"></iframe>
    </div>`;

  const closePreview = () => {
    document.body.style.overflow = previousOverflow;
    window.removeEventListener('keydown', handleKeydown);
    preview.remove();
  };
  const handleKeydown = event => {
    if (event.key === 'Escape') closePreview();
  };

  document.body.style.overflow = 'hidden';
  preview.__zgClosePreview = closePreview;
  document.body.appendChild(preview);

  const frame = preview.querySelector('iframe');
  frame.srcdoc = printHtml;

  const applyZoom = value => {
    preview.querySelectorAll('[data-print-zoom]').forEach(button => {
      button.classList.toggle('active', button.dataset.printZoom === value);
    });
    if (value === 'fit') frame.style.width = 'min(100%,980px)';
    if (value === '100') frame.style.width = '980px';
    if (value === '125') frame.style.width = '1225px';
  };
  preview.querySelectorAll('[data-print-zoom]').forEach(button => {
    button.addEventListener('click', () => applyZoom(button.dataset.printZoom));
  });
  preview.querySelector('[data-print-close]').addEventListener('click', closePreview);
  preview.querySelector('[data-print-download]').addEventListener('click', () => {
    const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement('a'), { href: url, download: `${filename}.html` });
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  preview.querySelector('[data-print-action]').addEventListener('click', () => {
    const printTarget = frame.contentWindow;
    if (!printTarget) { Toast.push('ไม่สามารถพิมพ์เอกสารได้', 'danger'); return; }
    printTarget.focus();
    printTarget.print();
  });
  window.addEventListener('keydown', handleKeydown);
}

// expose
Object.assign(window, { Button, Card, Field, Input, Select, Badge, StockStatus, Tabs, Modal, Toast, PageHeader, KPI, Empty, IconButton, exportCSV, printWindow });
