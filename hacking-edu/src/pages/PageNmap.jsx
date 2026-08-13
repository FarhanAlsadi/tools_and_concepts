import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

const HOSTS = [
  { id:'router',  ip:'192.168.1.1',  emoji:'🔁', nameAr:'راوتر',        nameEn:'Router',    active:true,  mac:'E4:8D:8C:A1:B2:C3' },
  { id:'server',  ip:'192.168.1.10', emoji:'🖥️', nameAr:'خادم ويب',    nameEn:'Web Server',active:true,  mac:'00:1A:2B:3C:4D:5E' },
  { id:'laptop',  ip:'192.168.1.20', emoji:'💻', nameAr:'حاسوب محمول', nameEn:'Laptop',    active:true,  mac:'DC:A6:32:7F:8E:9A' },
  { id:'printer', ip:'192.168.1.30', emoji:'🖨️', nameAr:'طابعة',       nameEn:'Printer',   active:true,  mac:'30:65:EC:AA:BB:CC' },
  { id:'phone',   ip:'192.168.1.40', emoji:'📱', nameAr:'هاتف',         nameEn:'Phone',     active:false, mac:null                },
  { id:'camera',  ip:'192.168.1.50', emoji:'📷', nameAr:'كاميرا IP',   nameEn:'IP Camera', active:true,  mac:'B4:E6:2D:11:22:33' },
]

const DEVICE_PORTS = {
  router:  [
    { port:22,  proto:'tcp', state:'open',   service:'ssh',       info:'OpenSSH 8.9'   },
    { port:53,  proto:'tcp', state:'open',   service:'domain',    info:'dnsmasq 2.87'  },
    { port:80,  proto:'tcp', state:'open',   service:'http',      info:'nginx 1.22'    },
    { port:443, proto:'tcp', state:'open',   service:'https',     info:'nginx 1.22'    },
  ],
  server: [
    { port:21,   proto:'tcp', state:'closed',   service:'ftp',        info:''           },
    { port:22,   proto:'tcp', state:'open',     service:'ssh',        info:'OpenSSH 8.9'},
    { port:80,   proto:'tcp', state:'open',     service:'http',       info:'Apache 2.4' },
    { port:443,  proto:'tcp', state:'open',     service:'https',      info:'Apache 2.4' },
    { port:3306, proto:'tcp', state:'open',     service:'mysql',      info:'MySQL 8.0'  },
    { port:8080, proto:'tcp', state:'filtered', service:'http-proxy', info:''           },
  ],
  laptop: [
    { port:22,   proto:'tcp', state:'closed', service:'ssh',           info:''            },
    { port:80,   proto:'tcp', state:'closed', service:'http',          info:''            },
    { port:445,  proto:'tcp', state:'open',   service:'microsoft-ds',  info:'Windows SMB' },
    { port:3389, proto:'tcp', state:'open',   service:'ms-wbt-server', info:'RDP'         },
  ],
  printer: [
    { port:80,   proto:'tcp', state:'open', service:'http',      info:'HP JetDirect' },
    { port:443,  proto:'tcp', state:'open', service:'https',     info:'HP JetDirect' },
    { port:631,  proto:'tcp', state:'open', service:'ipp',       info:'CUPS 2.3'     },
    { port:9100, proto:'tcp', state:'open', service:'jetdirect', info:'HP Print'     },
  ],
  camera: [
    { port:23,   proto:'tcp', state:'open', service:'telnet', info:'⚠️ Insecure!'  },
    { port:80,   proto:'tcp', state:'open', service:'http',   info:'Hikvision'     },
    { port:554,  proto:'tcp', state:'open', service:'rtsp',   info:'Hikvision v2.8'},
    { port:8080, proto:'tcp', state:'open', service:'http',   info:'Hikvision Web' },
  ],
}

// ── Visualization geometry (percent coordinates within the scene box) ──────────
const SX = 9, SY = 52            // scanner (our device) center
const COLS = 2                   // building window columns
const winPos = (i, n) => {
  const rows = Math.max(Math.ceil(n / COLS), 1)
  const col  = i % COLS
  const row  = Math.floor(i / COLS)
  return { x: 61 + (col + 0.5) * (28 / COLS), y: 24 + (row + 0.5) * (58 / rows) }
}
// wave timing (kept slow on purpose so the echo is easy to follow)
const OUT = 1200, BACK = 1100, STEP = 780

const stateColor  = s => s === 'open' ? '#15803d' : s === 'filtered' ? '#b45309' : '#dc2626'
const findHostByIp = ip => HOSTS.find(h => h.ip === ip)

function TermLine({ line }) {
  const style = {
    cmd:      { color:'#a78bfa', fontWeight:700 },
    info:     { color:'#94a3b8' },
    sep:      { color:'#1e293b' },
    head:     { color:'#f59e0b', fontWeight:700 },
    host:     { color:'#e2e8f0', fontWeight:700, marginTop:6 },
    up:       { color:'#4ade80' },
    down:     { color:'#f87171' },
    mac:      { color:'#7dd3fc' },
    done:     { color:'#34d399', fontWeight:700 },
    open:     { color:'#4ade80' },
    filtered: { color:'#fb923c' },
    closed:   { color:'#f87171' },
    err:      { color:'#f87171' },
  }[line.k] || { color:'#94a3b8' }
  return (
    <div style={{ ...style, fontFamily:'monospace', fontSize:11, lineHeight:1.75, whiteSpace:'pre', animation:'nmap-line-in 0.2s ease' }}>
      {line.v || ' '}
    </div>
  )
}

export default function PageNmap() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  // Interactive terminal
  const initialLines = () => ([
    { k:'info', v: isAr ? 'محطة Nmap التفاعلية — اكتب أمراً ثم اضغط Enter.' : 'Interactive Nmap terminal — type a command and press Enter.' },
    { k:'info', v: isAr ? 'جرّب:  nmap 192.168.1.10   (أو اكتب  help)' : 'Try:  nmap 192.168.1.10   (or type  help)' },
    { k:'sep',  v: '' },
  ])
  const [lines, setLines] = useState(initialLines)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)

  // Scan / building visualization
  const [target,   setTarget]   = useState(null)   // host id being scanned
  const [wave,     setWave]     = useState('idle')  // idle | scanning | done
  const [winState, setWinState] = useState([])      // per-window: idle|probing|open|closed|filtered
  const [pulses,   setPulses]   = useState([])      // live echo dots + return chips

  const [answer, setAnswer] = useState(null)

  const timers  = useRef([])
  const termRef = useRef(null)
  const inputRef = useRef(null)

  const addT   = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t) }
  const clearT = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => () => clearT(), [])
  useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight }, [lines])

  const say    = arr => setLines(prev => [...prev, ...arr])
  const setWin = (i, v) => setWinState(prev => { const c = [...prev]; c[i] = v; return c })

  const addPulse  = p => setPulses(prev => [...prev, p])
  const movePulse = (id, x, y) => setPulses(prev => prev.map(p => p.id === id ? { ...p, x, y } : p))
  const delPulse  = id => setPulses(prev => prev.filter(p => p.id !== id))

  const targetHost = target ? HOSTS.find(h => h.id === target) : null
  const ports = target ? (DEVICE_PORTS[target] || []) : []
  const busy = wave === 'scanning'

  // ── The scan: echo wave out to each window, wave back with the result ─────────
  const startScan = host => {
    clearT()
    const hostPorts = DEVICE_PORTS[host.id] || []
    setTarget(host.id)
    setWave('scanning')
    setWinState(hostPorts.map(() => 'idle'))
    setPulses([])

    say([
      { k:'info', v: 'Starting Nmap 7.94 ( https://nmap.org )' },
      { k:'host', v: `Nmap scan report for ${host.ip}` },
      { k:'up',   v: 'Host is up (0.0012s latency).' },
      { k:'sep',  v: '' },
      { k:'head', v: 'PORT'.padEnd(9) + 'STATE'.padEnd(9) + 'SERVICE'.padEnd(13) + 'VERSION' },
    ])

    hostPorts.forEach((p, i) => {
      const t0  = i * STEP
      const pos = winPos(i, hostPorts.length)

      // echo wave travels OUT to the window
      addT(() => {
        setWin(i, 'probing')
        const id = `o${i}`
        addPulse({ id, type:'dot', x:SX, y:SY, dur:OUT, color:'#a78bfa' })
        addT(() => movePulse(id, pos.x, pos.y), 30)
      }, t0)

      // wave reaches the window: reveal state, send a wave BACK carrying the answer
      addT(() => {
        delPulse(`o${i}`)
        setWin(i, p.state)
        const label = p.state === 'open'     ? p.service
                    : p.state === 'filtered' ? (isAr ? 'مُفلتَر' : 'filtered')
                    :                          (isAr ? 'مغلق'   : 'closed')
        const rid = `r${i}`
        addPulse({ id:rid, type:'chip', x:pos.x, y:pos.y, dur:BACK, state:p.state, label })
        addT(() => movePulse(rid, SX, SY), 30)
        addT(() => delPulse(rid), BACK + 250)

        const portStr = `${p.port}/${p.proto}`.padEnd(9)
        say([{ k:p.state, v: portStr + p.state.padEnd(9) + p.service.padEnd(13) + (p.info || '') }])
      }, t0 + OUT)
    })

    // summary once every window has answered
    addT(() => {
      const open = hostPorts.filter(p => p.state === 'open').length
      setWave('done')
      say([
        { k:'sep',  v: '' },
        { k:'done', v: `Nmap done: 1 IP address (1 host up) scanned in ${((hostPorts.length * STEP + OUT + BACK) / 1000).toFixed(1)}s` },
        { k:'info', v: isAr ? `${open} منفذ مفتوح تم اكتشافه.` : `${open} open port(s) discovered.` },
      ])
    }, (hostPorts.length - 1) * STEP + OUT + BACK + 200)
  }

  // ── Command interpreter ───────────────────────────────────────────────────────
  const runCommand = raw => {
    const text = raw.trim()
    say([{ k:'cmd', v: `$ ${raw}` }])
    setInput('')
    if (!text) return
    setHistory(prev => [...prev, text]); setHistIdx(-1)

    const tokens = text.split(/\s+/)
    const cmd = tokens[0].toLowerCase()

    if (cmd === 'clear') { setLines([]); return }

    if (cmd === 'help') {
      say([
        { k:'head', v: isAr ? '── الأوامر ──' : '── commands ──' },
        { k:'info', v: 'nmap <ip>          ' + (isAr ? 'فحص منافذ وخدمات جهاز' : 'scan ports & services of a host') },
        { k:'info', v: 'nmap -sn <subnet>  ' + (isAr ? 'اكتشاف الأجهزة النشطة' : 'discover live hosts') },
        { k:'info', v: 'help               ' + (isAr ? 'عرض هذه القائمة' : 'show this list') },
        { k:'info', v: 'clear              ' + (isAr ? 'مسح الشاشة' : 'clear the screen') },
        { k:'sep',  v: '' },
        { k:'head', v: isAr ? 'أهداف الشبكة:' : 'Network targets:' },
        ...HOSTS.filter(h => h.active).map(h => ({ k:'info', v: '  ' + h.ip.padEnd(16) + (isAr ? h.nameAr : h.nameEn) })),
      ])
      return
    }

    if (cmd === 'nmap') {
      const targetArg = tokens.slice(1).find(t => !t.startsWith('-'))
      if (!targetArg) { say([{ k:'err', v: isAr ? 'الاستخدام:  nmap <عنوان IP>' : 'Usage:  nmap <ip address>' }]); return }

      // subnet / host discovery
      if (targetArg.includes('/') || targetArg.endsWith('.0')) {
        const live = HOSTS.filter(h => h.active)
        say([
          { k:'info', v: 'Starting Nmap 7.94 ( https://nmap.org )' },
          { k:'info', v: isAr ? `فحص ${targetArg} ...` : `Scanning ${targetArg} ...` },
          { k:'sep',  v: '' },
          ...live.flatMap(h => ([
            { k:'host', v: `Nmap scan report for ${h.ip}` },
            { k:'up',   v: `Host is up  (${isAr ? h.nameAr : h.nameEn})` },
          ])),
          { k:'sep',  v: '' },
          { k:'done', v: `Nmap done: 256 IP addresses (${live.length} hosts up) scanned` },
          { k:'info', v: isAr ? 'اكتب  nmap <ip>  لفحص منافذ أي جهاز.' : 'Type  nmap <ip>  to scan any host’s ports.' },
        ])
        return
      }

      // single host port scan
      const host = findHostByIp(targetArg)
      if (host && host.active) { startScan(host); return }

      // unknown or offline
      setTarget(null); setWave('idle'); setWinState([])
      say([
        { k:'info', v: 'Starting Nmap 7.94 ( https://nmap.org )' },
        { k:'host', v: `Nmap scan report for ${targetArg}` },
        { k:'down', v: isAr ? 'الجهاز لا يستجيب — قد يكون مطفأ أو غير موجود.' : 'Host seems down (no response).' },
        { k:'done', v: 'Nmap done: 0 hosts up' },
      ])
      return
    }

    say([{ k:'err', v: (isAr ? 'أمر غير معروف: ' : 'command not found: ') + cmd + (isAr ? '  — جرّب  nmap <ip>  أو  help' : '  — try  nmap <ip>  or  help') }])
  }

  const onKey = e => {
    if (e.key === 'Enter') { if (!busy) runCommand(input) }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); if (!history.length) return; const ni = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1); setHistIdx(ni); setInput(history[ni]) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (histIdx < 0) return; const ni = histIdx + 1; if (ni >= history.length) { setHistIdx(-1); setInput('') } else { setHistIdx(ni); setInput(history[ni]) } }
  }

  const reset = () => { clearT(); setTarget(null); setWave('idle'); setWinState([]); setPulses([]); setLines(initialLines()) }

  const winCls = st => (st === 'probing' ? 'probing' : (st === 'open' || st === 'closed' || st === 'filtered') ? st : '')
  const beamColor = st => st === 'open' ? '#22c55e' : st === 'filtered' ? '#f59e0b' : st === 'closed' ? '#ef4444' : '#a78bfa'

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'20px 14px', fontFamily:'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{`
        @keyframes nmap-line-in { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:translateY(0)} }
        @keyframes nmap-sonar { from{width:24px;height:24px;opacity:0.55} to{width:360px;height:360px;opacity:0} }
        @keyframes nmap-win-probe { 0%,100%{box-shadow:0 0 0 0 rgba(167,139,250,0.5)} 50%{box-shadow:0 0 0 7px rgba(167,139,250,0)} }
        @keyframes nmap-blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
        .nmap-btn { border:none; border-radius:9px; padding:9px 20px; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.2s; }
        .nmap-btn:hover:not(:disabled) { filter:brightness(1.07); transform:translateY(-1px); }
        .nmap-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .term { background:#0f172a; border-radius:0 0 11px 11px; padding:12px 16px; overflow-y:auto; height:210px; }
        .flag { display:inline-flex; flex-direction:column; align-items:center; }
        .flag code { background:#1e293b; border:1px solid #334155; border-radius:5px; padding:2px 8px; font-family:monospace; font-size:11px; color:#a78bfa; }
        .flag small { font-size:9px; color:#64748b; margin-top:1px; }
        /* scene */
        .scene { position:relative; height:340px; background:radial-gradient(120% 120% at 10% 50%, #111c34 0%, #0b1220 60%); border-radius:12px; overflow:hidden; border:2px solid #1e293b; }
        .win { position:absolute; transform:translate(-50%,-50%); width:56px; height:40px; border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:monospace; border:2px solid #334155; background:#0b1220; color:#64748b; transition:all 0.35s; z-index:2; }
        .win.probing { border-color:#a78bfa; color:#c4b5fd; animation:nmap-win-probe 0.85s infinite; }
        .win.open { background:#052e16; border-color:#22c55e; color:#4ade80; box-shadow:0 0 14px rgba(34,197,94,0.55); }
        .win.closed { background:#180a0a; border-color:#7f1d1d; color:#9ca3af; opacity:0.6; }
        .win.filtered { background:#2a1a04; border-color:#b45309; color:#fbbf24; }
        .win b { font-size:13px; font-weight:800; line-height:1; }
        .win small { font-size:8px; margin-top:2px; opacity:0.9; }
        .pulse { position:absolute; width:13px; height:13px; border-radius:50%; transform:translate(-50%,-50%); z-index:6; box-shadow:0 0 10px 2px currentColor; }
        .chip { position:absolute; transform:translate(-50%,-50%); padding:2px 8px; border-radius:20px; font-family:monospace; font-size:10px; font-weight:800; white-space:nowrap; z-index:7; box-shadow:0 3px 10px rgba(0,0,0,0.45); }
        .sonar { position:absolute; border:2px solid #a78bfa; border-radius:50%; transform:translate(-50%,-50%); z-index:1; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <span style={{ background:'#fdf2f8', color:'#9d174d', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
            🔍 {isAr ? 'أمن الشبكات' : 'Network Security'}
          </span>
          <button onClick={() => navigate('/')}
            style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:7, padding:'3px 10px', fontSize:12, color:'#64748b', cursor:'pointer' }}>
            {isAr ? '← الرئيسية' : '← Home'}
          </button>
        </div>
        <h1 style={{ fontSize:24, fontWeight:900, color:'#1e293b', margin:'0 0 5px' }}>
          🗺️ {isAr ? 'Nmap — فحص الشبكات والمنافذ' : 'Nmap — Network & Port Scanner'}
        </h1>
      </div>

      {/* ── Interactive scan ─────────────────────────────────────────────────── */}
      <div style={{ background:'white', border:'2px solid #e2e8f0', borderRadius:14, padding:18, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:5 }}>
          <div style={{ width:30, height:30, background:'#7c3aed', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:900, fontSize:15, flexShrink:0 }}>▶</div>
          <h2 style={{ fontSize:16, fontWeight:800, color:'#1e293b', margin:0 }}>{isAr ? 'جرّبها بنفسك — افحص المبنى' : 'Try It Yourself — Scan the Building'}</h2>
        </div>
        <p style={{ fontSize:12, color:'#64748b', margin:'0 0 14px 39px', lineHeight:1.65 }}>
          {isAr
            ? 'اكتب  nmap  متبوعاً بعنوان IP للجهاز في الطرفية بالأسفل. سيُرسل الفاحص موجات صدى إلى كل نافذة (منفذ) في المبنى، وتعود الموجة باسم الخدمة إن كانت النافذة مفتوحة، أو "مغلق" إن كانت مغلقة. (لا تعرف العناوين؟ اكتب  help)'
            : 'Type  nmap  followed by a device IP in the terminal below. The scanner sends echo waves to each window (port) of the building — the wave returns with the service name if the window is open, or "closed" if it is shut. (Don’t know the IPs? type  help)'}
        </p>

        {/* Flags helper */}
        <div style={{ background:'#0f172a', borderRadius:10, padding:'10px 16px', marginBottom:14, display:'flex', alignItems:'flex-start', gap:14, flexWrap:'wrap' }} dir="ltr">
          <span style={{ fontFamily:'monospace', fontSize:13, color:'#e2e8f0', fontWeight:700, paddingTop:4 }}>$</span>
          <span style={{ fontFamily:'monospace', fontSize:13, color:'#a78bfa', fontWeight:700, paddingTop:4 }}>nmap</span>
          {[
            ['<ip>', isAr ? 'عنوان الجهاز الهدف' : 'target device IP'],
            ['-sn', isAr ? 'اكتشاف الأجهزة فقط' : 'host discovery only'],
          ].map(([f, d]) => (
            <div key={f} className="flag"><code>{f}</code><small>{d}</small></div>
          ))}
        </div>

        {/* Scene: scanner on the left, company building on the right */}
        <div className="scene" dir="ltr">
          {/* subtle grid glow */}
          {/* beams (drawn behind windows, in the same % coordinate space) */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:1 }}>
            {ports.map((p, i) => {
              const st = winState[i]
              if (!st || st === 'idle') return null
              const pos = winPos(i, ports.length)
              return <line key={i} x1={SX} y1={SY} x2={pos.x} y2={pos.y} stroke={beamColor(st)} strokeWidth="1.2"
                vectorEffect="non-scaling-stroke" strokeDasharray="4 4" opacity={st === 'probing' ? 0.5 : 0.35} />
            })}
          </svg>

          {/* sonar rings while scanning */}
          {busy && [0, 1, 2].map(n => (
            <div key={n} className="sonar" style={{ left:`${SX}%`, top:`${SY}%`, animation:`nmap-sonar 2.4s ${n * 0.8}s infinite ease-out` }} />
          ))}

          {/* scanner (our device) */}
          <div style={{ position:'absolute', left:`${SX}%`, top:`${SY}%`, transform:'translate(-50%,-50%)', textAlign:'center', zIndex:4 }}>
            <div style={{ fontSize:34, filter: busy ? 'drop-shadow(0 0 8px #a78bfa)' : 'none' }}>🕵️‍♂️</div>
            <div style={{ fontFamily:'monospace', fontSize:9, color:'#a78bfa', fontWeight:700, marginTop:2 }}>192.168.1.200</div>
            <div style={{ fontSize:9, color:'#64748b' }}>{isAr ? 'الفاحص' : 'scanner'}</div>
            {busy && <div style={{ fontSize:10, color:'#a78bfa', fontWeight:700, marginTop:2, animation:'nmap-blink 0.8s infinite' }}>📡 {isAr ? 'يفحص' : 'scanning'}</div>}
          </div>

          {/* company building */}
          <div style={{ position:'absolute', left:'53%', width:'42%', top:'12%', bottom:'6%', background:'linear-gradient(180deg,#233350,#0f1a2e)', border:'2px solid #33456b', borderRadius:'8px 8px 4px 4px', boxShadow:'0 10px 30px rgba(0,0,0,0.4)', zIndex:1 }}>
            {/* antenna */}
            <div style={{ position:'absolute', top:-16, left:'50%', transform:'translateX(-50%)', width:2, height:16, background:'#33456b' }} />
            <div style={{ position:'absolute', top:-20, left:'50%', transform:'translateX(-50%)', width:6, height:6, borderRadius:'50%', background: busy ? '#a78bfa' : '#475569', boxShadow: busy ? '0 0 8px #a78bfa' : 'none' }} />
            {/* sign */}
            <div style={{ position:'absolute', top:8, left:0, right:0, textAlign:'center' }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#e2e8f0', letterSpacing:0.5 }}>🏢 {targetHost ? (isAr ? targetHost.nameAr : targetHost.nameEn) : (isAr ? 'المبنى الهدف' : 'Target Building')}</div>
              <div style={{ fontFamily:'monospace', fontSize:9, color:'#7dd3fc' }}>{targetHost ? targetHost.ip : '—'}</div>
            </div>
          </div>

          {/* windows (ports) */}
          {ports.map((p, i) => {
            const pos = winPos(i, ports.length)
            const st = winState[i] || 'idle'
            const open = st === 'open'
            return (
              <div key={i} className={`win ${winCls(st)}`} style={{ left:`${pos.x}%`, top:`${pos.y}%` }}>
                <b>{p.port}</b>
                {open && <small>{p.service}</small>}
                {st === 'closed' && <small>✕</small>}
                {st === 'filtered' && <small>?</small>}
              </div>
            )
          })}

          {/* placeholder before first scan */}
          {!target && (
            <div style={{ position:'absolute', left:'53%', width:'42%', top:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', color:'#475569', fontSize:12, padding:20, zIndex:3 }}>
              {isAr ? 'اكتب  nmap <ip>  بالأسفل لبدء فحص المبنى' : 'Type  nmap <ip>  below to scan the building'}
            </div>
          )}

          {/* live echo pulses + return chips */}
          {pulses.map(p => p.type === 'dot'
            ? <div key={p.id} className="pulse" style={{ left:`${p.x}%`, top:`${p.y}%`, color:p.color, background:p.color, transition:`left ${p.dur}ms linear, top ${p.dur}ms linear` }} />
            : <div key={p.id} className="chip" style={{
                left:`${p.x}%`, top:`${p.y}%`, transition:`left ${p.dur}ms linear, top ${p.dur}ms linear`,
                background: p.state === 'open' ? '#052e16' : p.state === 'filtered' ? '#2a1a04' : '#180a0a',
                color: p.state === 'open' ? '#4ade80' : p.state === 'filtered' ? '#fbbf24' : '#f87171',
                border: `1px solid ${beamColor(p.state)}`,
              }}>{p.label}</div>
          )}
        </div>

        {/* Terminal */}
        <div style={{ marginTop:14 }}>
          <div style={{ background:'#1e293b', borderRadius:'11px 11px 0 0', padding:'6px 14px', display:'flex', alignItems:'center', gap:6 }} dir="ltr">
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#ef4444' }} />
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#f59e0b' }} />
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#22c55e' }} />
            <span style={{ fontFamily:'monospace', fontSize:11, color:'#94a3b8', marginLeft:8 }}>nmap@nmaplab: ~</span>
          </div>
          <div className="term" ref={termRef} onClick={() => inputRef.current && inputRef.current.focus()} dir="ltr">
            {lines.map((l, i) => <TermLine key={i} line={l} />)}
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
              <span style={{ fontFamily:'monospace', fontSize:12, color:'#a78bfa', fontWeight:700 }}>$</span>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                disabled={busy}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                placeholder={busy ? (isAr ? 'جارٍ الفحص...' : 'scanning...') : 'nmap 192.168.1.10'}
                style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#e2e8f0', fontFamily:'monospace', fontSize:12 }}
              />
            </div>
          </div>
        </div>

        {/* quick-try + reset */}
        <div style={{ display:'flex', gap:7, marginTop:10, flexWrap:'wrap', alignItems:'center' }} dir="ltr">
          <span style={{ fontSize:10, color:'#94a3b8', fontWeight:700 }}>{isAr ? 'جرّب:' : 'try:'}</span>
          {['nmap 192.168.1.10', 'nmap 192.168.1.50', 'nmap -sn 192.168.1.0/24', 'help'].map(c => (
            <button key={c} onClick={() => { if (!busy) runCommand(c) }} disabled={busy}
              style={{ fontFamily:'monospace', fontSize:11, background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:7, padding:'4px 10px', color:'#475569', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1 }}>
              {c}
            </button>
          ))}
          <button onClick={reset} className="nmap-btn" style={{ background:'#f1f5f9', color:'#64748b', border:'1.5px solid #e2e8f0', padding:'4px 12px', fontSize:11, marginLeft:'auto' }}>
            ↺ {isAr ? 'إعادة تعيين' : 'reset'}
          </button>
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:14, marginTop:12, flexWrap:'wrap' }}>
          {[['🟢', isAr ? 'نافذة مفتوحة — خدمة نشطة' : 'Open window — service active', '#15803d'],
            ['🟠', isAr ? 'مُفلترة — يحجبها الجدار الناري' : 'Filtered — blocked by firewall', '#b45309'],
            ['🔴', isAr ? 'مغلقة — لا خدمة' : 'Closed — no service', '#dc2626']
          ].map(([dot, label, color]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color }}><span>{dot}</span><span>{label}</span></div>
          ))}
        </div>
      </div>

      {/* Challenge */}
      <div style={{ background:'white', border:'2px solid #e2e8f0', borderRadius:14, padding:18, marginBottom:20 }}>
        <h2 style={{ fontSize:15, fontWeight:800, color:'#1e293b', margin:'0 0 10px' }}>🧩 {isAr ? 'تحدٍّ سريع' : 'Quick Challenge'}</h2>
        <p style={{ fontSize:13, color:'#334155', marginBottom:12, lineHeight:1.6 }}>
          {isAr
            ? 'افحص الأجهزة في الطرفية أعلاه. أيٌّ منها يمتلك خدمة Telnet (المنفذ 23) مفتوحة، ولماذا يُعدّ ذلك خطيراً؟'
            : 'Scan the devices in the terminal above. Which one has Telnet (port 23) open — and why is it dangerous?'}
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {(isAr
            ? ['الراوتر (192.168.1.1)', 'كاميرا IP (192.168.1.50) — Telnet يُرسل كلمات المرور بدون تشفير ⚠️', 'الخادم (192.168.1.10)', 'الطابعة (192.168.1.30)']
            : ['Router (192.168.1.1)', 'IP Camera (192.168.1.50) — Telnet sends passwords without encryption ⚠️', 'Web Server (192.168.1.10)', 'Printer (192.168.1.30)']
          ).map((opt, i) => (
            <button key={i} onClick={() => setAnswer(i)}
              style={{
                textAlign: isAr ? 'right' : 'left', padding:'10px 14px', borderRadius:9, cursor:'pointer',
                border:`2px solid ${answer === null ? '#e2e8f0' : i === 1 ? '#86efac' : i === answer ? '#fca5a5' : '#e2e8f0'}`,
                background: answer === null ? 'white' : i === 1 ? '#f0fdf4' : i === answer ? '#fef2f2' : '#f8fafc',
                color: answer === null ? '#334155' : i === 1 ? '#15803d' : i === answer ? '#dc2626' : '#94a3b8',
                fontSize:12, fontWeight: i === 1 && answer !== null ? 700 : 400, transition:'all 0.15s',
              }}>
              {opt}
            </button>
          ))}
        </div>
        {answer !== null && (
          <div style={{ marginTop:10, fontSize:12, fontWeight:700, padding:'9px 13px', borderRadius:9, animation:'nmap-line-in 0.3s ease',
            color: answer === 1 ? '#15803d' : '#dc2626', background: answer === 1 ? '#f0fdf4' : '#fef2f2' }}>
            {answer === 1
              ? (isAr ? '✅ صحيح! الكاميرا تستخدم Telnet وهو بروتوكول قديم يُرسل البيانات بدون تشفير — يجب استبداله بـ SSH.' : '✅ Correct! The camera uses Telnet, an old protocol that sends data unencrypted — it should be replaced with SSH.')
              : (isAr ? '❌ حاول مجدداً — افحص كاميرا IP (192.168.1.50) وابحث عن المنفذ 23' : '❌ Try again — scan the IP Camera (192.168.1.50) and look for port 23')}
          </div>
        )}
      </div>

      <Explanation>
        <p style={{ fontSize:13, color:'#64748b', margin:'0 0 18px', maxWidth:720, lineHeight:1.7 }}>
          {isAr
            ? 'Nmap هو أداة الاستطلاع الأولى في أمن الشبكات — تكتشف الأجهزة النشطة، والمنافذ المفتوحة، والخدمات المُشغَّلة. يستخدمها فريقا الهجوم والدفاع على حدٍّ سواء.'
            : 'Nmap is the go-to reconnaissance tool in network security — it discovers active devices, open ports, and running services. Used by both offensive and defensive security teams.'}
        </p>

        {/* Concept cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:11, marginBottom:22 }}>
          {[
            { icon:'🗺️', tAr:'ما هو Nmap؟',       tEn:'What is Nmap?',        bAr:'Network Mapper — أداة مفتوحة المصدر تمنحك "خريطة" كاملة لكل جهاز وخدمة على الشبكة.', bEn:'Network Mapper — an open-source tool that gives you a complete map of every device and service on a network.' },
            { icon:'🚪', tAr:'ما هو المنفذ؟',       tEn:'What is a Port?',      bAr:'كل منفذ كأنه نافذة في المبنى — نافذة مفتوحة تعني خدمة نشطة تستمع للاتصالات.', bEn:'Each port is like a window in a building — an open window means an active service listening for connections.' },
            { icon:'📡', tAr:'كيف يفحص Nmap؟',     tEn:'How Nmap Probes',      bAr:'يُرسل Nmap "نبضة" لكل منفذ ويستمع للرد: رد يعني مفتوح، صمت أو رفض يعني مغلق.', bEn:'Nmap sends a probe to each port and listens for a reply: a reply means open, silence or refusal means closed.' },
            { icon:'🛡️', tAr:'وجهة المدافع',       tEn:"Defender's View",      bAr:'فرق الأمن تفحص شبكاتها بانتظام للعثور على المنافذ المكشوفة قبل المهاجمين.', bEn:'Security teams scan their own networks regularly to find exposed ports before attackers do.' },
          ].map(c => (
            <div key={c.tEn} style={{ background:'white', border:'2px solid #e2e8f0', borderRadius:12, padding:14 }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{c.icon}</div>
              <div style={{ fontSize:12, fontWeight:800, color:'#1e293b', marginBottom:4 }}>{isAr ? c.tAr : c.tEn}</div>
              <div style={{ fontSize:11, color:'#64748b', lineHeight:1.6 }}>{isAr ? c.bAr : c.bEn}</div>
            </div>
          ))}
        </div>

        {/* Defender note */}
        <div style={{ background:'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius:14, padding:18 }}>
          <h2 style={{ fontSize:15, fontWeight:800, color:'white', margin:'0 0 12px' }}>
            🛡️ {isAr ? 'من وجهة المدافع (Blue Team)' : "From the Defender's Perspective (Blue Team)"}
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:10 }}>
            {(isAr ? [
              ['🔍','فحص دوري','مديرو الأمن يُجرون فحص Nmap لشبكاتهم كل أسبوع لاكتشاف المنافذ المكشوفة.'],
              ['🚨','IDS / IPS','أنظمة كشف التسلل تلتقط عمليات فحص Nmap وتُنبّه الفريق الأمني فوراً.'],
              ['🔒','إغلاق المنافذ','كل منفذ مفتوح غير ضروري يجب إغلاقه — يُقلّل سطح الهجوم.'],
              ['📋','جرد الأصول','Nmap يساعد في الحفاظ على قائمة محدّثة بجميع الأجهزة على الشبكة.'],
            ] : [
              ['🔍','Regular Scanning','Security admins run Nmap scans of their own networks weekly to spot exposed ports.'],
              ['🚨','IDS / IPS','Intrusion detection systems catch Nmap scans and alert the security team immediately.'],
              ['🔒','Close Ports','Every unnecessary open port should be closed — reduces the attack surface.'],
              ['📋','Asset Inventory','Nmap helps maintain an up-to-date list of every device on the network.'],
            ]).map(([icon, title, desc]) => (
              <div key={title} style={{ background:'rgba(255,255,255,0.05)', borderRadius:10, padding:12 }}>
                <div style={{ fontSize:20, marginBottom:5 }}>{icon}</div>
                <div style={{ fontSize:12, fontWeight:700, color:'white', marginBottom:3 }}>{title}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', lineHeight:1.55 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Explanation>

      {/* Nav */}
      <div style={{ display:'flex', justifyContent:'center' }}>
        <button onClick={() => navigate('/')}
          style={{ display:'flex', alignItems:'center', gap:6, color:'#1d4ed8', background:'#eff6ff',
            border:'2px solid #bfdbfe', borderRadius:10, padding:'10px 28px', cursor:'pointer', fontSize:14, fontWeight:700 }}>
          <ChevronLeft size={15} />{isAr ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
