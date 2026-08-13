import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

// ── DHCP pool + config ────────────────────────────────────────────────────────
const POOL = Array.from({ length: 16 }, (_, i) => `192.168.1.${100 + i}`)
const GATEWAY = '192.168.1.1'
const DNS = '8.8.8.8'

// ── device catalogue you can add to the network ───────────────────────────────
const TYPES = [
  { type:'laptop',  emoji:'💻', nameEn:'Laptop',     nameAr:'حاسوب محمول' },
  { type:'phone',   emoji:'📱', nameEn:'Phone',      nameAr:'هاتف' },
  { type:'tablet',  emoji:'📲', nameEn:'Tablet',     nameAr:'جهاز لوحي' },
  { type:'tv',      emoji:'📺', nameEn:'Smart TV',   nameAr:'تلفاز ذكي' },
  { type:'console', emoji:'🎮', nameEn:'Console',    nameAr:'جهاز ألعاب' },
  { type:'printer', emoji:'🖨️', nameEn:'Printer',    nameAr:'طابعة' },
  { type:'watch',   emoji:'⌚', nameEn:'Smartwatch', nameAr:'ساعة ذكية' },
  { type:'camera',  emoji:'📷', nameEn:'IP Camera',  nameAr:'كاميرا IP' },
]

const hex = n => n.toString(16).padStart(2, '0').toUpperCase()
const randMac = () => 'A4:' + [0, 0, 0, 0, 0].map(() => hex(Math.floor(Math.random() * 256))).join(':')

// ring position for device i of n (percent coordinates inside the topology box)
const ringPos = (i, n) => {
  const ang = (i / Math.max(n, 1)) * 2 * Math.PI - Math.PI / 2
  return { x: 50 + 37 * Math.cos(ang), y: 50 + 33 * Math.sin(ang) }
}

const initialDevices = () => [
  { id:'seed-tv',     type:'tv',     emoji:'📺', nameEn:'Smart TV', nameAr:'تلفاز ذكي',   mac:'A4:1B:22:0C:5E:01', ip:'192.168.1.100', status:'connected' },
  { id:'seed-phone',  type:'phone',  emoji:'📱', nameEn:'Phone',    nameAr:'هاتف',        mac:'A4:1B:22:0C:5E:02', ip:'192.168.1.101', status:'connected' },
  { id:'seed-laptop', type:'laptop', emoji:'💻', nameEn:'Laptop',   nameAr:'حاسوب محمول', mac:'A4:1B:22:0C:5E:03', ip:'192.168.1.102', status:'connected' },
]

// the 4-step DHCP handshake (DORA), shown while a device requests an IP
const DORA = [
  { key:'DISCOVER', dir:'up',   en:'DHCP Discover — the device broadcasts: “I need an IP address!”', ar:'DHCP Discover — الجهاز يبثّ: «أحتاج عنوان IP!»' },
  { key:'OFFER',    dir:'down', en:'DHCP Offer — the router offers a free IP from its pool',          ar:'DHCP Offer — الراوتر يعرض عنوان IP حرًّا من مجمّعه' },
  { key:'REQUEST',  dir:'up',   en:'DHCP Request — the device asks to take that offered IP',          ar:'DHCP Request — الجهاز يطلب أخذ العنوان المعروض' },
  { key:'ACK',      dir:'down', en:'DHCP Acknowledge — the router confirms and leases the IP',        ar:'DHCP Acknowledge — الراوتر يؤكّد ويُؤجِّر العنوان' },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function PageDHCP() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [devices, setDevices] = useState(initialDevices)
  const [mode, setMode]       = useState('dynamic')          // 'dynamic' | 'static'
  const [pick, setPick]       = useState('laptop')           // selected device type to add
  const [staticIP, setStaticIP] = useState('')
  const [addErr, setAddErr]   = useState('')
  const [joining, setJoining] = useState(null)               // id of the device currently requesting
  const [dora, setDora]       = useState(0)                  // 0 = idle, 1..4 = DORA step
  const [dotPos, setDotPos]   = useState(null)               // { x, y } of the animated packet
  const [flashId, setFlashId] = useState(null)               // id to pop/highlight briefly
  const idRef  = useRef(200)
  const timers = useRef([])
  const sched  = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t }
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const usedIPs = devices.map(d => d.ip).filter(Boolean)
  const freeIPs = POOL.filter(ip => !usedIPs.includes(ip))
  const typeObj = t => TYPES.find(x => x.type === t) || TYPES[0]
  const flash = id => { setFlashId(id); sched(() => setFlashId(null), 1200) }

  const runDora = (id, ip, pos) => {
    const center = { x: 50, y: 50 }
    setDora(1); setDotPos(pos)
    sched(() => setDotPos(center), 70)                              // 1 Discover  device → router
    sched(() => { setDora(2); setDotPos(pos) }, 780)                // 2 Offer     router → device
    sched(() => { setDora(3); setDotPos(center) }, 1560)            // 3 Request   device → router
    sched(() => { setDora(4); setDotPos(pos) }, 2340)              // 4 Ack       router → device
    sched(() => {
      setDevices(prev => prev.map(d => d.id === id ? { ...d, ip, status:'connected' } : d))
      setJoining(null); setDotPos(null); setDora(0); flash(id)
    }, 3120)
  }

  const addDevice = () => {
    if (joining) return
    setAddErr('')
    const t = typeObj(pick)
    const id = 'd' + (idRef.current++)

    if (mode === 'static') {
      const ip = staticIP.trim()
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) { setAddErr(isAr ? 'صيغة IP غير صحيحة' : 'Invalid IP format'); return }
      if (usedIPs.includes(ip)) { setAddErr(isAr ? '⚠️ هذا العنوان مستخدم بالفعل' : '⚠️ That IP is already in use'); return }
      setDevices(prev => [...prev, { id, ...t, mac: randMac(), ip, status:'connected', isStatic:true }])
      setStaticIP(''); flash(id)
      return
    }
    // dynamic — DHCP assigns the next free IP through the DORA handshake
    if (!freeIPs.length) { setAddErr(isAr ? 'لا يوجد عنوان IP متاح في المجمع' : 'No IP available in the pool'); return }
    const ip  = freeIPs[0]
    const pos = ringPos(devices.length, devices.length + 1)
    setDevices(prev => [...prev, { id, ...t, mac: randMac(), ip:null, status:'requesting' }])
    setJoining(id)
    runDora(id, ip, pos)
  }

  const removeDevice = id => {
    if (joining === id) return
    setDevices(prev => prev.filter(d => d.id !== id))
  }

  const resetTopo = () => {
    timers.current.forEach(clearTimeout); timers.current = []
    setDevices(initialDevices()); setJoining(null); setDotPos(null); setDora(0)
    setAddErr(''); setStaticIP(''); setFlashId(null)
  }

  const dotColor = dora ? (DORA[dora - 1].dir === 'up' ? '#3b82f6' : '#22c55e') : '#3b82f6'
  const connectedCount = devices.filter(d => d.status === 'connected').length

  const T = {
    badge:    isAr ? '🌐 مختبر الشبكات' : '🌐 Networking Lab',
    backBtn:  isAr ? '← درس عناوين IP'  : '← IP Address lesson',
    title:    isAr ? 'كيف يعمل خادم DHCP؟' : 'How Does a DHCP Server Work?',
    subtitle: isAr
      ? 'DHCP هو البروتوكول الذي يُعطي الأجهزة عناوين IP تلقائياً — بدونه يجب عليك إعداد كل جهاز يدوياً.'
      : 'DHCP is the protocol that automatically gives devices IP addresses — without it you\'d configure every device manually.',
    topoTitle: isAr ? 'شبكة تفاعلية — أضِف الأجهزة واطلب لها عناوين IP' : 'Interactive Network — Add Devices & Request IPs',
    topoSub:   isAr
      ? 'أضِف جهازاً إلى الشبكة فيطلب عنوان IP من الراوتر عبر DHCP، أو احذف جهازاً (×) ليعود عنوانه إلى المجمع. كل تغيير ينعكس على الجدول أدناه.'
      : 'Add a device — it requests an IP from the router via DHCP — or remove a device (×) to return its IP to the pool. Every change reflects in the table below.',
    modeDyn:   isAr ? '🔄 ديناميكي (DHCP)' : '🔄 Dynamic (DHCP)',
    modeStat:  isAr ? '🔒 ثابت (يدوي)' : '🔒 Static (manual)',
    chooseDev: isAr ? 'اختر نوع الجهاز:' : 'Choose a device:',
    addDyn:    isAr ? '＋ أضِف واطلب IP' : '＋ Add & request IP',
    addStat:   isAr ? '＋ أضِف بعنوان ثابت' : '＋ Add with static IP',
    enterIP:   isAr ? 'اكتب عنوان IP…' : 'Enter IP address…',
    reset:     isAr ? '↺ إعادة تعيين' : '↺ Reset',
    poolFree:  isAr ? 'متاح في المجمع' : 'free in pool',
    topoLabel: isAr ? 'رسم الشبكة' : 'NETWORK TOPOLOGY',
    router:    isAr ? 'الراوتر' : 'Router',
    dhcpSrv:   isAr ? '+ خادم DHCP' : '+ DHCP Server',
    requesting:isAr ? 'يطلب IP…' : 'requesting…',
    emptyNet:  isAr ? 'لا توجد أجهزة — أضِف جهازاً لبدء الشبكة.' : 'No devices — add one to start the network.',
    tableTitle:isAr ? 'جدول اتصالات الراوتر (DHCP)' : 'Router Connection Table (DHCP)',
    thDevice:  isAr ? 'الجهاز' : 'Device',
    thMac:     isAr ? 'عنوان MAC' : 'MAC Address',
    thIP:      isAr ? 'عنوان IP' : 'IP Address',
    thStatus:  isAr ? 'الحالة' : 'Status',
    stConn:    isAr ? 'متصل ✅' : 'Leased ✅',
    stReq:     isAr ? 'يطلب ⏳' : 'Requesting ⏳',
    stStatic:  isAr ? 'ثابت 🔒' : 'Static 🔒',
    leased:    isAr ? 'عنوان مؤجَّر' : 'IPs leased',
    of:        isAr ? 'من' : 'of',
    poolTitle: isAr ? 'مجمع عناوين IP' : 'IP Address Pool',
    cfgTitle:  isAr ? '🔁 إعدادات DHCP في الراوتر' : '🔁 Router DHCP Config',
    remove:    isAr ? 'حذف الجهاز' : 'Remove device',
    compareTitle: isAr ? 'ثابت مقابل ديناميكي — متى تستخدم كل منهما؟' : 'Static vs Dynamic — When to Use Each?',
    home: 'الرئيسية',
  }

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'20px 14px', fontFamily:'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{`
        .dhcp2-router { width:104px; display:flex; flex-direction:column; align-items:center; gap:2px;
          background:linear-gradient(135deg,#4338ca,#6366f1); border:2px solid #a5b4fc; border-radius:14px;
          padding:10px 8px; box-shadow:0 0 0 6px rgba(99,102,241,0.16); position:relative; z-index:6; }
        .dhcp2-ring { position:absolute; left:50%; top:50%; border:2px solid #6366f1; border-radius:50%;
          transform:translate(-50%,-50%); opacity:0; animation:dhcp2-wave 3s infinite; pointer-events:none; z-index:2; }
        @keyframes dhcp2-wave { 0%{width:70px;height:70px;opacity:.45} 100%{width:250px;height:250px;opacity:0} }
        .dhcp2-dev { position:absolute; transform:translate(-50%,-50%); width:84px; z-index:10;
          display:flex; flex-direction:column; align-items:center; gap:1px; padding:8px 6px;
          background:#1e293b; border:2px solid #334155; border-radius:12px; color:#e2e8f0;
          transition:left .45s ease, top .45s ease, border-color .3s, background .3s, box-shadow .3s; }
        .dhcp2-dev.connected  { border-color:#22c55e; background:#0b2a17; box-shadow:0 0 0 3px rgba(34,197,94,.18); }
        .dhcp2-dev.requesting { border-color:#818cf8; border-style:dashed; animation:dhcp2-pulse 1s infinite; }
        .dhcp2-dev.flash      { animation:dhcp2-pop .5s; }
        .dhcp2-dev .x { position:absolute; top:-9px; ${isAr ? 'left:-9px' : 'right:-9px'}; width:19px; height:19px;
          border-radius:50%; background:#ef4444; color:white; border:2px solid #0f172a; cursor:pointer;
          font-size:12px; line-height:1; display:flex; align-items:center; justify-content:center; z-index:13; padding:0; }
        .dhcp2-dev .x:hover { background:#dc2626; transform:scale(1.12); }
        .dhcp2-dot { position:absolute; width:15px; height:15px; border-radius:50%; transform:translate(-50%,-50%);
          transition:left .7s cubic-bezier(.4,0,.2,1), top .7s cubic-bezier(.4,0,.2,1); z-index:15;
          box-shadow:0 0 12px 2px currentColor; }
        @keyframes dhcp2-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(129,140,248,.5)} 50%{box-shadow:0 0 0 6px rgba(129,140,248,0)} }
        @keyframes dhcp2-pop { 0%{transform:translate(-50%,-50%) scale(.7)} 60%{transform:translate(-50%,-50%) scale(1.12)} 100%{transform:translate(-50%,-50%) scale(1)} }
        @keyframes dhcp-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .msg-appear { animation:dhcp-in .35s ease; }
        .type-btn { border:2px solid #e2e8f0; background:white; border-radius:10px; cursor:pointer;
          display:flex; flex-direction:column; align-items:center; gap:2px; transition:all .15s; min-width:66px; }
        .type-btn.sel { border-color:#6366f1; background:#eef2ff; }
        .dhcp-tab { padding:7px 18px; border-radius:8px; font-size:13px; font-weight:700; border:2px solid; cursor:pointer; transition:all .2s; }
        .dhcp-tab.active { background:#6366f1; color:white; border-color:#6366f1; }
        .dhcp-tab.inactive { background:white; color:#64748b; border-color:#e2e8f0; }
        .dhcp-btn { border:none; border-radius:8px; padding:8px 16px; font-size:13px; font-weight:700; cursor:pointer; transition:all .2s; }
        .dhcp-btn:hover:not(:disabled) { filter:brightness(1.08); transform:scale(1.02); }
        .dhcp-btn:disabled { opacity:.5; cursor:not-allowed; }
        .pool-chip { display:inline-flex; align-items:center; justify-content:center; border-radius:7px; padding:4px 8px;
          font-size:11px; font-family:monospace; font-weight:700; border:1.5px solid; transition:all .3s; }
        .pool-chip.free { background:#f0fdf4; border-color:#86efac; color:#15803d; }
        .pool-chip.used { background:#eff6ff; border-color:#93c5fd; color:#1d4ed8; }
        .conn-row { display:grid; grid-template-columns:1.7fr 1.6fr 1.2fr 1fr 42px; gap:6px; align-items:center;
          padding:7px 12px; border-bottom:1px solid #f1f5f9; font-size:12px; }
        .conn-row.head { background:#f8fafc; font-weight:700; color:#64748b; font-size:11px; }
        .conn-row.newrow { animation:dhcp-in .4s ease; background:#fef3c7; }
        .compare-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        @media (max-width:600px){ .compare-row{ grid-template-columns:1fr; } }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <span style={{ background:'#dbeafe', color:'#1d4ed8', padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>{T.badge}</span>
          <button onClick={() => navigate('/ip')} style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:7, padding:'3px 10px', fontSize:12, color:'#64748b', cursor:'pointer' }}>{T.backBtn}</button>
        </div>
        <h1 style={{ fontSize:22, fontWeight:900, color:'#1e293b', margin:'0 0 4px' }}>{T.title}</h1>
      </div>

      {/* ── Interactive Topology ── */}
      <div style={{ background:'white', border:'2px solid #e2e8f0', borderRadius:14, padding:18, marginBottom:20 }}>
        <h2 style={{ fontSize:16, fontWeight:800, color:'#1e293b', margin:'0 0 3px' }}>{T.topoTitle}</h2>
        <p style={{ fontSize:12, color:'#64748b', margin:'0 0 14px', lineHeight:1.6 }}>{T.topoSub}</p>

        {/* mode toggle */}
        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
          <button className={`dhcp-tab ${mode === 'dynamic' ? 'active' : 'inactive'}`} onClick={() => { setMode('dynamic'); setAddErr('') }}>{T.modeDyn}</button>
          <button className={`dhcp-tab ${mode === 'static' ? 'active' : 'inactive'}`} onClick={() => { setMode('static'); setAddErr('') }}>{T.modeStat}</button>
          <button className="dhcp-btn" onClick={resetTopo} style={{ background:'#f8fafc', color:'#64748b', border:'1.5px solid #e2e8f0', marginInlineStart:'auto', fontSize:12 }}>{T.reset}</button>
        </div>

        {/* add-device panel */}
        <div style={{ background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:11, padding:'12px 14px', marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#475569', marginBottom:8 }}>{T.chooseDev}</div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:12 }}>
            {TYPES.map(t => (
              <button key={t.type} className={`type-btn ${pick === t.type ? 'sel' : ''}`} onClick={() => setPick(t.type)}
                style={{ padding:'7px 9px' }}>
                <span style={{ fontSize:20 }}>{t.emoji}</span>
                <span style={{ fontSize:9.5, fontWeight:700, color: pick === t.type ? '#4338ca' : '#64748b' }}>{isAr ? t.nameAr : t.nameEn}</span>
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            {mode === 'static' && (
              <input value={staticIP} onChange={e => setStaticIP(e.target.value)} placeholder={T.enterIP}
                onKeyDown={e => { if (e.key === 'Enter') addDevice() }} dir="ltr"
                style={{ border:'1.5px solid #cbd5e1', borderRadius:8, padding:'8px 10px', fontSize:12, fontFamily:'monospace', width:170, outline:'none' }} />
            )}
            <button className="dhcp-btn" onClick={addDevice} disabled={!!joining || (mode === 'dynamic' && !freeIPs.length)}
              style={{ background:'#6366f1', color:'white', padding:'9px 20px' }}>
              {mode === 'dynamic' ? T.addDyn : T.addStat}
            </button>
            <span style={{ fontSize:12, color:'#64748b', marginInlineStart:'auto', fontWeight:600 }}>
              <b style={{ color:'#15803d' }}>{freeIPs.length}</b>/{POOL.length} {T.poolFree}
            </span>
          </div>
          {addErr && <div style={{ color:'#dc2626', fontSize:11.5, marginTop:8, fontWeight:700 }}>{addErr}</div>}
        </div>

        {/* DORA status banner */}
        {joining && dora > 0 && (
          <div className="msg-appear" style={{ display:'flex', alignItems:'center', gap:10, background:'#eef2ff', border:'1.5px solid #c7d2fe', borderRadius:10, padding:'9px 14px', marginBottom:14 }}>
            <span style={{ background:'#6366f1', color:'white', borderRadius:6, padding:'2px 9px', fontSize:11, fontWeight:800, flexShrink:0 }}>{dora}/4 · {DORA[dora - 1].key}</span>
            <span style={{ fontSize:12.5, color:'#3730a3', fontWeight:600, lineHeight:1.5 }}>{isAr ? DORA[dora - 1].ar : DORA[dora - 1].en}</span>
          </div>
        )}

        {/* topology diagram */}
        <div style={{ background:'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius:13, padding:'14px', marginBottom:14 }}>
          <div style={{ fontSize:10, color:'#64748b', fontWeight:700, letterSpacing:1, marginBottom:6 }}>{T.topoLabel}</div>
          <div style={{ position:'relative', height:370 }}>
            {/* connecting lines */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:'absolute', inset:0, width:'100%', height:'100%', zIndex:1 }}>
              {devices.map((d, i) => {
                const p = ringPos(i, devices.length)
                const active = joining === d.id
                return <line key={d.id} x1="50" y1="50" x2={p.x} y2={p.y}
                  stroke={active ? '#818cf8' : (d.status === 'connected' ? '#334155' : '#475569')}
                  strokeWidth={active ? 2.5 : 1.5} strokeDasharray={active ? '5 4' : '0'} vectorEffect="non-scaling-stroke" />
              })}
            </svg>

            {/* animated DHCP packet */}
            {dotPos && <div className="dhcp2-dot" style={{ left:`${dotPos.x}%`, top:`${dotPos.y}%`, background:dotColor, color:dotColor }} />}

            {/* router (center) */}
            <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', zIndex:6 }}>
              <span className="dhcp2-ring" style={{ animationDelay:'0s' }} />
              <span className="dhcp2-ring" style={{ animationDelay:'1.5s' }} />
              <div className="dhcp2-router">
                <span style={{ fontSize:26 }}>🔁</span>
                <span style={{ fontSize:10, fontWeight:800, color:'white' }}>{T.router}</span>
                <span style={{ fontSize:8.5, color:'#fde68a', fontWeight:700 }}>{T.dhcpSrv}</span>
              </div>
            </div>

            {/* device nodes */}
            {devices.map((d, i) => {
              const p = ringPos(i, devices.length)
              const cls = d.status === 'connected' ? 'connected' : 'requesting'
              return (
                <div key={d.id} className={`dhcp2-dev ${cls} ${flashId === d.id ? 'flash' : ''}`} style={{ left:`${p.x}%`, top:`${p.y}%` }}>
                  <button className="x" title={T.remove} onClick={() => removeDevice(d.id)}>×</button>
                  <span style={{ fontSize:23 }}>{d.emoji}</span>
                  <span style={{ fontSize:9, fontWeight:700, color:'#cbd5e1', textAlign:'center' }}>{isAr ? d.nameAr : d.nameEn}</span>
                  <span style={{ fontSize:8.5, fontFamily:'monospace', fontWeight:700, textAlign:'center', color: d.ip ? '#4ade80' : '#a5b4fc' }} dir="ltr">
                    {d.ip || T.requesting}
                  </span>
                </div>
              )
            })}

            {!devices.length && (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontSize:12 }}>{T.emptyNet}</div>
            )}
          </div>
        </div>

        {/* live connection table */}
        <div style={{ border:'2px solid #f59e0b', borderRadius:12, overflow:'hidden', marginBottom:14 }}>
          <div style={{ background:'#fffbeb', padding:'8px 14px', borderBottom:'1px solid #fde68a', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16 }}>🔁</span>
            <span style={{ fontSize:13, fontWeight:700, color:'#92400e' }}>{T.tableTitle}</span>
            <span style={{ marginInlineStart:'auto', fontSize:11, color:'#92400e', fontWeight:600, background:'#fef3c7', border:'1px solid #fbbf24', borderRadius:5, padding:'1px 8px' }}>
              {connectedCount} {T.leased} · {freeIPs.length} {T.poolFree}
            </span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <div style={{ minWidth:440 }}>
              <div className="conn-row head">
                <span>{T.thDevice}</span><span>{T.thMac}</span><span>{T.thIP}</span><span>{T.thStatus}</span><span />
              </div>
              {devices.map(d => (
                <div key={d.id} className={`conn-row ${flashId === d.id ? 'newrow' : ''}`}>
                  <span style={{ color:'#1e293b', fontWeight:600 }}>{d.emoji} {isAr ? d.nameAr : d.nameEn}</span>
                  <span style={{ fontFamily:'monospace', color:'#64748b' }} dir="ltr">{d.mac}</span>
                  <span style={{ fontFamily:'monospace', color: d.ip ? '#6366f1' : '#a5b4fc', fontWeight:700 }} dir="ltr">{d.ip || '…'}</span>
                  <span style={{ fontWeight:600, color: d.status === 'requesting' ? '#6366f1' : d.isStatic ? '#7e22ce' : '#15803d' }}>
                    {d.status === 'requesting' ? T.stReq : d.isStatic ? T.stStatic : T.stConn}
                  </span>
                  <button className="dhcp-btn" title={T.remove} onClick={() => removeDevice(d.id)} disabled={joining === d.id}
                    style={{ background:'#fee2e2', color:'#dc2626', border:'1.5px solid #fca5a5', padding:'3px 9px', fontSize:12 }}>×</button>
                </div>
              ))}
              {!devices.length && <div style={{ padding:'12px 14px', fontSize:12, color:'#94a3b8', textAlign:'center' }}>{T.emptyNet}</div>}
            </div>
          </div>
        </div>

        {/* IP pool + config */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div style={{ background:'#f8fafc', borderRadius:10, padding:12, border:'1.5px solid #e2e8f0' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:8 }}>{T.poolTitle} — {freeIPs.length}/{POOL.length} {T.poolFree}</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {POOL.map(ip => {
                const owner = devices.find(d => d.ip === ip)
                return (
                  <div key={ip} className={`pool-chip ${owner ? 'used' : 'free'}`} title={owner ? (isAr ? owner.nameAr : owner.nameEn) : ip}>
                    {ip.split('.').pop()}{owner && <span style={{ marginInlineStart:3 }}>{owner.emoji}</span>}
                  </div>
                )
              })}
              {devices.filter(d => d.ip && !POOL.includes(d.ip)).map(d => (
                <div key={d.id} className="pool-chip" style={{ background:'#faf5ff', borderColor:'#d8b4fe', color:'#7e22ce' }} dir="ltr">{d.ip} {d.emoji}</div>
              ))}
            </div>
          </div>
          <div style={{ background:'#f8fafc', borderRadius:10, padding:12, border:'1.5px solid #e2e8f0' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:6 }}>{T.cfgTitle}</div>
            {[
              [isAr ? 'نطاق IP' : 'IP Range', `${POOL[0]} – ${POOL[POOL.length - 1]}`],
              [isAr ? 'البوابة' : 'Gateway', GATEWAY],
              [isAr ? 'خادم DNS' : 'DNS Server', DNS],
              [isAr ? 'مدة الحجز' : 'Lease Time', isAr ? '24 ساعة' : '24 hours'],
            ].map(([k, v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:11, padding:'3px 0', borderBottom:'1px solid #f0f4f8' }}>
                <span style={{ color:'#64748b' }}>{k}</span>
                <span style={{ fontFamily:'monospace', color:'#1e293b', fontWeight:600 }} dir="ltr">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* explanation — collapsed by default, sits under the practical part */}
      <Explanation>
        <p style={{ fontSize:13, color:'#64748b', margin:'0 0 16px', maxWidth:680, lineHeight:1.65 }}>{T.subtitle}</p>

      {/* ── Static vs Dynamic ── */}
      <div style={{ background:'white', border:'2px solid #e2e8f0', borderRadius:14, padding:18, marginBottom:20 }}>
        <h2 style={{ fontSize:16, fontWeight:800, color:'#1e293b', margin:'0 0 14px' }}>{T.compareTitle}</h2>
        <div className="compare-row">
          {[
            { c:'#1d4ed8', bg:'#eff6ff', bc:'#93c5fd', icon:'🔄', tEn:'Dynamic IP (Auto)', tAr:'IP ديناميكي (تلقائي)',
              rows: isAr
                ? [['✅','سهل — لا يحتاج تدخلاً'],['✅','يُوزّع IPs تلقائياً'],['✅','يُعيد IPs غير المستخدمة'],['❌','IP قد يتغير عند كل اتصال'],['❌','لا يناسب الخوادم'],['📌','مناسب لـ: الهواتف، اللابتوبات، الضيوف']]
                : [['✅','Easy — no manual config needed'],['✅','Automatically assigns IPs'],['✅','Returns unused IPs to pool'],['❌','IP may change each connection'],['❌','Not suitable for servers'],['📌','Best for: phones, laptops, guests']] },
            { c:'#7e22ce', bg:'#faf5ff', bc:'#d8b4fe', icon:'🔒', tEn:'Static IP (Manual)', tAr:'IP ثابت (يدوي)',
              rows: isAr
                ? [['✅','العنوان لا يتغير أبداً'],['✅','أجهزة تجده بنفس العنوان دائماً'],['✅','أفضل للأمان والتحكم'],['❌','يتطلب إعداداً يدوياً'],['❌','تعارضات إذا استُخدم نفس IP'],['📌','مناسب لـ: الخوادم، الطابعات، CCTV']]
                : [['✅','Address never changes'],['✅','Devices always find it at same IP'],['✅','Better for security and control'],['❌','Requires manual setup per device'],['❌','Conflicts if same IP used twice'],['📌','Best for: servers, printers, CCTV']] },
          ].map(col => (
            <div key={col.tEn} style={{ background:col.bg, border:`2px solid ${col.bc}`, borderRadius:12, padding:14 }}>
              <div style={{ fontSize:14, fontWeight:800, color:col.c, marginBottom:8 }}>{col.icon} {isAr ? col.tAr : col.tEn}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {col.rows.map(([icon, text]) => (
                  <div key={text} style={{ display:'flex', gap:7, fontSize:12, color:col.c, alignItems:'flex-start' }}>
                    <span style={{ flexShrink:0 }}>{icon}</span><span style={{ opacity:0.8 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Real-world examples ── */}
      <div style={{ background:'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius:14, padding:18, marginBottom:20 }}>
        <h2 style={{ fontSize:15, fontWeight:800, color:'white', margin:'0 0 12px' }}>{isAr ? '🌍 أمثلة من الواقع' : '🌍 Real-World Examples'}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:10 }}>
          {(isAr ? [
            ['🏠','شبكة منزلية','الراوتر يمنح IPs للهواتف واللابتوبات تلقائياً عند اتصالها بالـ Wi-Fi'],
            ['🏢','شبكة شركة','خادم مركزي يُدير آلاف IPs ويسجل كل جهاز وصاحبه ووقت اتصاله'],
            ['🍕','واي فاي مطعم','نطاق معزول للضيوف — يمنعهم من الوصول لشبكة الموظفين'],
            ['📡','شبكة الجوال','المزود يُعطيك IP عند استخدام البيانات — يتغير مع كل جلسة'],
          ] : [
            ['🏠','Home Network','Router auto-assigns IPs to phones and laptops when they connect to Wi-Fi'],
            ['🏢','Company Network','Central server manages thousands of IPs and logs each device owner'],
            ['🍕','Restaurant WiFi','Isolated pool for guests — blocks access to the staff network'],
            ['📡','Mobile Network','ISP gives you an IP when using data — changes each session'],
          ]).map(([emoji, title, desc]) => (
            <div key={title} style={{ background:'rgba(255,255,255,0.05)', borderRadius:10, padding:12 }}>
              <div style={{ fontSize:22, marginBottom:5 }}>{emoji}</div>
              <div style={{ fontSize:12, fontWeight:700, color:'white', marginBottom:3 }}>{title}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', lineHeight:1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      </Explanation>

      {/* ── Home button ── */}
      <div style={{ display:'flex', justifyContent:'center' }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:6, color:'#1d4ed8', background:'#eff6ff', border:'2px solid #bfdbfe', borderRadius:10, padding:'10px 28px', cursor:'pointer', fontSize:14, fontWeight:700 }}>
          <ChevronLeft size={15} />{T.home}
        </button>
      </div>
    </div>
  )
}
