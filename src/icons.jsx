// Minimal hand-rolled Lucide-style icons (stroke=1.75)
const Ic = ({ d, size = 18, className = '', stroke = 1.75, fill = 'none', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {d ? <path d={d} /> : children}
  </svg>
);

const Icon = {
  Logo: (p) => (
    <Ic {...p} stroke={0} fill="currentColor">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8 8h8v2.2L9.8 16H16v-2H8v-1.2L14.2 8H8z" fill="white" />
    </Ic>
  ),
  Dashboard: (p) => <Ic {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></Ic>,
  Box: (p) => <Ic {...p}><path d="M21 8 12 3 3 8v8l9 5 9-5V8z"/><path d="M3.3 8.3 12 13l8.7-4.7"/><path d="M12 13v9"/></Ic>,
  Inbox: (p) => <Ic {...p}><path d="M21 12V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6"/><path d="M3 12h5l2 3h4l2-3h5v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></Ic>,
  Outbox: (p) => <Ic {...p}><path d="M3 12V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/><path d="M3 12h5l2 3h4l2-3h5v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 2v8m-3-3 3 3 3-3"/></Ic>,
  Users: (p) => <Ic {...p}><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15 14h.5A4.5 4.5 0 0 1 20 18.5V20"/></Ic>,
  Chart: (p) => <Ic {...p}><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></Ic>,
  Settings: (p) => <Ic {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></Ic>,
  Search: (p) => <Ic {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Ic>,
  Bell: (p) => <Ic {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Ic>,
  ChevronDown: (p) => <Ic {...p}><path d="m6 9 6 6 6-6"/></Ic>,
  ChevronRight: (p) => <Ic {...p}><path d="m9 6 6 6-6 6"/></Ic>,
  ChevronLeft: (p) => <Ic {...p}><path d="m15 6-6 6 6 6"/></Ic>,
  Plus: (p) => <Ic {...p}><path d="M12 5v14M5 12h14"/></Ic>,
  Minus: (p) => <Ic {...p}><path d="M5 12h14"/></Ic>,
  X: (p) => <Ic {...p}><path d="M18 6 6 18M6 6l12 12"/></Ic>,
  EyeOff: (p) => <Ic {...p}><path d="M2 2l20 20"/><path d="M6.7 6.7C3.8 8.7 2 12 2 12s3.5 7 10 7c2.3 0 4.3-.9 5.9-2"/><path d="M9.9 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7s-1 1.9-2.9 3.7"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></Ic>,
  Lock: (p) => <Ic {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></Ic>,
  User: (p) => <Ic {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Ic>,
  Trash: (p) => <Ic {...p}><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="m6 6 1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></Ic>,
  Edit: (p) => <Ic {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></Ic>,
  Eye: (p) => <Ic {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></Ic>,
  Download: (p) => <Ic {...p}><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></Ic>,
  Filter: (p) => <Ic {...p}><path d="M3 5h18l-7 9v6l-4-2v-4z"/></Ic>,
  Calendar: (p) => <Ic {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4M16 3v4"/></Ic>,
  Bolt: (p) => <Ic {...p}><path d="m13 2-9 12h7l-1 8 9-12h-7z"/></Ic>,
  Check: (p) => <Ic {...p}><path d="m5 12 5 5 9-11"/></Ic>,
  Warn: (p) => <Ic {...p}><path d="M10.3 3.7 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></Ic>,
  QR: (p) => <Ic {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1"/></Ic>,
  Camera: (p) => <Ic {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></Ic>,
  Save: (p) => <Ic {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></Ic>,
  PDF: (p) => <Ic {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h1.5a1.5 1.5 0 0 1 0 3H8zm0 0v5M14 13v5h2M18 13h-2v5"/></Ic>,
  Print: (p) => <Ic {...p}><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="9" rx="2"/><path d="M6 14h12v7H6z"/></Ic>,
  CSV: (p) => <Ic {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></Ic>,
  Logout: (p) => <Ic {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></Ic>,
  Sun: (p) => <Ic {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></Ic>,
  Moon: (p) => <Ic {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></Ic>,
  Menu: (p) => <Ic {...p}><path d="M4 6h16M4 12h16M4 18h16"/></Ic>,
  ArrowUp: (p) => <Ic {...p}><path d="M12 19V5M5 12l7-7 7 7"/></Ic>,
  ArrowDown: (p) => <Ic {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></Ic>,
  Sort: (p) => <Ic {...p}><path d="m7 4 0 16M3 8l4-4 4 4M17 20l0-16M13 16l4 4 4-4"/></Ic>,
  Refresh: (p) => <Ic {...p}><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></Ic>,
  Tag: (p) => <Ic {...p}><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="8" cy="8" r="1.5"/></Ic>,
  Truck: (p) => <Ic {...p}><path d="M1 3h14v13H1z"/><path d="M15 8h4l3 3v5h-7"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></Ic>,
  Hash: (p) => <Ic {...p}><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></Ic>,
  More: (p) => <Ic {...p}><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></Ic>,
  ArrowRight: (p) => <Ic {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Ic>,
};

window.Icon = Icon;
