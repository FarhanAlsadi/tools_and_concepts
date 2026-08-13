import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   DoS / DDoS LAB — real commands + slow, narratable traffic visualization
   Normal users flow slowly through the Internet to the server (readable
   request/response titles). Type a real tool command (hping3, goldeneye,
   slowloris, ping) in the terminal and press Enter to flood the server until
   legit users can no longer get a reply. Toggle a single source (DoS) vs a
   botnet (DDoS). FOR AUTHORIZED LAB / EDUCATIONAL USE ONLY.
   ──────────────────────────────────────────────────────────────────────────── */

const HOST = 'orbyx.store'
const HOST_IP = '203.0.113.10'   // TEST-NET-3, safe documentation IP

// Positions in the scene, as percentages (x,y). The Internet cloud is the hub:
// everyone (users AND the attacker) connects to it, and it connects to the server.
const POS = {
  server:     { x:87, y:44 },
  cloud:      { x:57, y:44 },
  users:      [{ x:10, y:15 }, { x:10, y:33 }],
  dos:        { x:12, y:74 },
  c2:         { x:7,  y:90 },
  bots: [
    { x:11, y:52 }, { x:24, y:50 }, { x:37, y:54 },
    { x:9,  y:68 }, { x:22, y:66 }, { x:35, y:69 },
    { x:13, y:85 }, { x:26, y:86 }, { x:38, y:83 },
  ],
}

// ── SVG icons (look good for kids) ────────────────────────────────────────────
const HackerIcon = ({ size = 30, glow }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} style={{ filter: glow ? `drop-shadow(0 0 7px ${glow})` : 'none' }}>
    {/* hoodie / shoulders */}
    <path d="M5 47 C5 34 13 28 24 28 C35 28 43 34 43 47 Z" fill="#0f172a" />
    {/* hood */}
    <path d="M24 5 C14 5 10 13 10 23 L10 27 C10 31 13 34 17 35 L31 35 C35 34 38 31 38 27 L38 23 C38 13 34 5 24 5 Z" fill="#1e293b" />
    {/* face shadow */}
    <ellipse cx="24" cy="24" rx="9.5" ry="8.5" fill="#0b1220" />
    {/* eyes */}
    <circle cx="20.3" cy="23.5" r="1.9" fill={glow || '#34d399'} />
    <circle cx="27.7" cy="23.5" r="1.9" fill={glow || '#34d399'} />
  </svg>
)

const UserIcon = ({ size = 30 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size}>
    {/* desk */}
    <rect x="3" y="40" width="42" height="3" rx="1.5" fill="#64748b" />
    {/* monitor */}
    <rect x="7" y="12" width="22" height="15" rx="2" fill="#334155" />
    <rect x="9" y="14" width="18" height="11" rx="1" fill="#38bdf8" />
    <rect x="16" y="27" width="4" height="4" fill="#334155" />
    <rect x="11" y="31" width="14" height="2" rx="1" fill="#334155" />
    {/* seated person facing the screen */}
    <circle cx="36" cy="21" r="5" fill="#f4c790" />
    <path d="M27 40 C27 31 45 31 45 40 Z" fill="#2563eb" />
  </svg>
)

// ── Flood types ──────────────────────────────────────────────────────────────
// category: volumetric | protocol | application   layer: L3/L4/L7
const FLOODS = [
  {
    id:'syn', color:'#3b82f6', pkt:'SYN', layer:'L4 · TCP', catKey:'protocol',
    nameAr:'إغراق SYN', nameEn:'SYN Flood',
    cmdDos:`sudo hping3 -S -p 80 --flood ${HOST}`,
    cmdDdos:`sudo hping3 -S -p 80 --flood --rand-source ${HOST}`,
    howAr:'يرسل سيلاً من طلبات فتح اتصال TCP (SYN) دون إكمال المصافحة، فتمتلئ جداول الاتصالات نصف المفتوحة ويعجز الخادم عن قبول اتصالات جديدة.',
    howEn:'Floods the server with TCP SYN packets and never completes the handshake, filling the half-open connection table until it can no longer accept new connections.',
    mitAr:'SYN cookies، تحديد معدل الاتصالات، تنظيف الترافيك عند المزوّد (Scrubbing).',
    mitEn:'SYN cookies, connection rate-limiting, upstream scrubbing.',
    dosOk:true, weight:3,
  },
  {
    id:'udp', color:'#a855f7', pkt:'UDP', layer:'L4 · UDP', catKey:'volumetric',
    nameAr:'إغراق UDP', nameEn:'UDP Flood',
    cmdDos:`sudo hping3 --udp -p 53 --flood ${HOST}`,
    cmdDdos:`sudo hping3 --udp -p 53 --flood --rand-source ${HOST}`,
    howAr:'يغرق منافذ UDP عشوائية؛ يهدر الخادم موارده بالرد بـ«ICMP port unreachable» ويُشبع عرض النطاق الترددي.',
    howEn:'Floods random UDP ports; the server wastes resources replying “ICMP port unreachable” and the bandwidth saturates.',
    mitAr:'تحديد معدل UDP عند الحافة وإسقاط ما لا يلزم منه.',
    mitEn:'Rate-limit UDP at the edge and drop what is not needed.',
    dosOk:true, weight:3,
  },
  {
    id:'icmp', color:'#f59e0b', pkt:'PING', layer:'L3 · ICMP', catKey:'volumetric',
    nameAr:'إغراق ICMP (Ping)', nameEn:'ICMP / Ping Flood',
    cmdDos:`sudo hping3 --icmp --flood ${HOST}`,
    cmdDdos:`sudo hping3 --icmp --flood --rand-source ${HOST}`,
    howAr:'يرسل سيلاً من طلبات echo (ping) لإشباع عرض النطاق ومعالج الخادم. البديل: sudo ping -f ' + HOST,
    howEn:'Floods ICMP echo-requests to saturate bandwidth and CPU. Alternative: sudo ping -f ' + HOST,
    mitAr:'تحديد معدل ICMP أو حظره عند الجدار الناري.',
    mitEn:'Rate-limit or deny ICMP at the firewall.',
    dosOk:true, weight:2,
  },
  {
    id:'http', color:'#22c55e', pkt:'GET', layer:'L7 · HTTP', catKey:'application',
    nameAr:'إغراق HTTP', nameEn:'HTTP Flood',
    cmdDos:`python3 goldeneye.py http://${HOST} -w 50 -s 200`,
    cmdDdos:`python3 goldeneye.py http://${HOST} -w 200 -s 500`,
    howAr:'يرسل سيلاً من طلبات GET/POST تبدو شرعية وتصل إلى التطبيق وقاعدة البيانات، فتستنزف المعالج والذاكرة — ويصعب تمييزها عن المستخدمين الحقيقيين. البديل: ab -n 200000 -c 500 http://' + HOST + '/',
    howEn:'Sends a flood of legitimate-looking GET/POST requests that reach the app and database, exhausting CPU and RAM — hard to tell from real users. Alternative: ab -n 200000 -c 500 http://' + HOST + '/',
    mitAr:'جدار حماية تطبيقات (WAF)، تحديد المعدل لكل IP، CAPTCHA، التخزين المؤقت عبر CDN.',
    mitEn:'Web Application Firewall (WAF), per-IP rate limiting, CAPTCHA, CDN caching.',
    dosOk:true, weight:4,
  },
  {
    id:'slow', color:'#94a3b8', pkt:'slow', layer:'L7 · Slow', catKey:'application',
    nameAr:'Slowloris (بطيء)', nameEn:'Slowloris (Low & Slow)',
    cmdDos:`slowloris ${HOST} -p 80 -s 500`,
    cmdDdos:`for i in $(seq 1 50); do slowloris ${HOST} -s 200 & done`,
    howAr:'يفتح مئات الاتصالات ويرسل ترويسات HTTP جزئية ببطء شديد ليُبقي المنافذ (sockets) مفتوحة ويستنزف مجمع الاتصالات — باستهلاك شبه معدوم لعرض النطاق. البديل: python3 slowloris.py ' + HOST,
    howEn:'Opens hundreds of connections and sends partial HTTP headers very slowly to hold sockets open and exhaust the connection pool — using almost no bandwidth. Alternative: python3 slowloris.py ' + HOST,
    mitAr:'مهلات الاتصال (mod_reqtimeout)، حدّ الاتصالات لكل IP، وسيط عكسي / CDN.',
    mitEn:'Connection timeouts (mod_reqtimeout), per-IP connection limits, reverse proxy / CDN.',
    dosOk:true, weight:5,
  },
  {
    id:'amp', color:'#ef4444', pkt:'AMP', layer:'L4 · Reflect', catKey:'volumetric',
    nameAr:'تضخيم/انعكاس (DDoS فقط)', nameEn:'Amplification / Reflection (DDoS only)',
    cmdDos:'',
    cmdDdos:`sudo hping3 --udp -p 53 -a ${HOST_IP} --flood open-resolver.net`,
    howAr:'يرسل طلبات صغيرة مُزيّفة المصدر (بعنوان الضحية) إلى خوادم DNS/NTP مفتوحة، فترد هذه الخوادم بردود أكبر ٥٠ إلى ٥٠٠٠٠ مرة موجَّهة كلها نحو الضحية. يتطلب تزييف المصدر وشبكة روبوتات — لذا فهو DDoS بطبيعته.',
    howEn:'Sends small spoofed-source requests (with the victim’s IP) to open DNS/NTP servers; they reply with responses 50–50,000× larger, all aimed at the victim. It needs source spoofing and reflectors — so it is inherently DDoS.',
    mitAr:'منع تزييف المصدر (BCP38)، إغلاق الـ resolvers المفتوحة، تحديد معدل الردود.',
    mitEn:'Anti-spoofing (BCP38), close open resolvers, response-rate-limiting.',
    dosOk:false, weight:6,
  },
]

const CATS = {
  volumetric:  { ar:'حجمي — يُشبع النطاق', en:'Volumetric — floods bandwidth', color:'#a855f7' },
  protocol:    { ar:'بروتوكولي — يُنهك الحالة', en:'Protocol — exhausts state', color:'#3b82f6' },
  application: { ar:'طبقة التطبيق — يُنهك التطبيق', en:'Application — exhausts the app', color:'#22c55e' },
}

const SPEEDS = {
  slow:   { dur:2600, interval:1000, ar:'🐢 بطيء', en:'🐢 Slow' },
  normal: { dur:1300, interval:420,  ar:'▶ عادي',  en:'▶ Normal' },
}
const LEGIT_LEG = 1500       // per hop (user↔cloud, cloud↔server) — slow & readable
const LEGIT_INTERVAL = 5200  // how often each normal user sends a fresh request

const loadState = l => l >= 100 ? 'down' : l >= 75 ? 'critical' : l >= 40 ? 'strained' : 'ok'
const LOAD_THEME = {
  ok:       { color:'#16a34a', ar:'طبيعي',  en:'Healthy' },
  strained: { color:'#ca8a04', ar:'مُجهَد',  en:'Strained' },
  critical: { color:'#ea580c', ar:'حرِج',   en:'Critical' },
  down:     { color:'#dc2626', ar:'معطّل ❌', en:'DOWN ❌' },
}

export default function PageDDoSLab() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [mode, setMode]     = useState('dos')          // dos | ddos
  const [floodId, setFlood] = useState('syn')
  const [speedKey, setSpeed]= useState('slow')
  const [running, setRunning] = useState(false)
  const [load, setLoad]     = useState(0)
  const [pkts, setPkts]     = useState([])
  const [lines, setLines]   = useState([])
  const [cmd, setCmd]       = useState('')

  const timers  = useRef([])          // attack timers (cleared on stop/reset)
  const legitTimers = useRef([])      // legit-traffic timers (cleared on unmount only)
  const pid     = useRef(0)
  const runRef  = useRef(false)
  const loadRef = useRef(0)
  const termRef = useRef(null)
  const inRef   = useRef(null)

  const flood = FLOODS.find(f => f.id === floodId)
  const sources = mode === 'dos' ? [POS.dos] : POS.bots
  const ls = LOAD_THEME[loadState(load)]
  const cmdFor = (f, m) => (m === 'ddos' ? f.cmdDdos : f.cmdDos) || f.cmdDdos

  const addT = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t) }
  const addL = (fn, ms) => { const t = setTimeout(fn, ms); legitTimers.current.push(t) }
  const clearAll = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  useEffect(() => () => { runRef.current = false; clearAll(); legitTimers.current.forEach(clearTimeout) }, [])
  useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight }, [lines])
  useEffect(() => { loadRef.current = load }, [load])

  // load decays when the attack is not running
  useEffect(() => {
    const iv = setInterval(() => { setLoad(l => runRef.current ? l : Math.max(0, l - 5)) }, 500)
    return () => clearInterval(iv)
  }, [])

  // ── a packet that travels through a list of waypoints (leg by leg) ─────────
  const travel = (waypoints, { label, color, dur, kind }, onDone, addFn) => {
    const add = addFn || addT
    const id = ++pid.current
    const p0 = waypoints[0]
    setPkts(prev => prev.length > 80 ? prev : [...prev, { id, x:p0.x, y:p0.y, color, label, dur, kind }])
    for (let i = 1; i < waypoints.length; i++) {
      const wp = waypoints[i]
      add(() => setPkts(prev => prev.map(p => p.id === id ? { ...p, x:wp.x, y:wp.y } : p)), 30 + (i - 1) * dur)
    }
    add(() => { setPkts(prev => prev.filter(p => p.id !== id)); onDone && onDone() }, 30 + (waypoints.length - 1) * dur + 40)
  }

  // ── DEFAULT: a normal user sends a request and (if the server is up) gets a
  //    response back — slowly, through the Internet, with readable titles ─────
  const fireLegit = i => {
    const u = POS.users[i]
    travel([u, POS.cloud, POS.server], { label:'GET /', color:'#22c55e', dur:LEGIT_LEG, kind:'req' }, () => {
      if (loadRef.current >= 100) return                    // server down → no reply
      const slow = loadRef.current >= 40
      travel([POS.server, POS.cloud, u], { label: slow ? '200 OK ·slow' : '200 OK', color:'#38bdf8', dur:LEGIT_LEG, kind:'res' }, null, addL)
    }, addL)
  }

  // legit traffic runs forever (independent of the attack)
  useEffect(() => {
    let alive = true
    const loop = () => {
      if (!alive) return
      POS.users.forEach((u, i) => addL(() => fireLegit(i), i * 900))
      addL(loop, LEGIT_INTERVAL)
    }
    addL(loop, 700)
    return () => { alive = false }
  }, []) // eslint-disable-line

  // ── one attack wave: every source fires a packet through the Internet ──────
  const fireWaveFor = (f, m) => {
    const srcs = m === 'dos' ? [POS.dos] : POS.bots
    const dur = SPEEDS[speedKey].dur / 2   // two legs (source→cloud→server)
    srcs.forEach((s, i) => addT(() => {
      travel([s, POS.cloud, POS.server], { label:f.pkt, color:f.color, dur, kind:'atk' }, () => {
        setLoad(l => Math.min(100, l + f.weight))
      }, addT)
    }, i * 90))
  }

  const stream = (arr, done) => arr.forEach((ln, i) => addT(() => { setLines(prev => [...prev, ln]); if (i === arr.length - 1 && done) done() }, 260 * (i + 1)))

  const banner = (f, m) => {
    const spoof = m === 'ddos'
    if (f.id === 'http') return [
      { k:'out', v:'GoldenEye v2.1 by Jan Seidl' },
      { k:'out', v:`Hitting web server in mode 'get' with ${spoof ? 200 : 50} workers, ${spoof ? 500 : 200} connections each.` },
      { k:'dim', v:'Hit CTRL+C to cancel.' },
    ]
    if (f.id === 'slow') return [
      { k:'out', v:`[*] Attacking ${HOST} with ${spoof ? '50×200' : 500} sockets.` },
      { k:'out', v:'[*] Creating sockets...' },
      { k:'dim', v:'[*] Sending keep-alive headers... Socket count: 500' },
    ]
    const flag = f.id === 'syn' ? 'S set' : f.id === 'udp' ? 'udp mode' : f.id === 'icmp' ? 'icmp mode' : 'udp mode (spoofed)'
    return [
      { k:'out', v:`HPING ${f.id === 'amp' ? 'open-resolver.net' : HOST} (eth0 ${HOST_IP}): ${flag}, 40 headers + 0 data bytes` },
      spoof || f.id === 'amp' ? { k:'warn', v:`using --rand-source / -a ${HOST_IP} (spoofed source)` } : null,
      { k:'dim', v:'hping in flood mode, no replies will be shown' },
    ].filter(Boolean)
  }

  const detectFlood = c => {
    const t = c.toLowerCase()
    if (t.includes('-a ') || t.includes('open-resolver')) return 'amp'
    if (t.includes('slowloris')) return 'slow'
    if (t.includes('goldeneye') || t.includes('hulk') || t.includes('ab -n')) return 'http'
    if (t.includes('--icmp') || t.includes('ping -f')) return 'icmp'
    if (t.includes('--udp')) return 'udp'
    if (t.includes('-s') || t.includes('hping3')) return 'syn'
    return null
  }

  const startAttack = (f, m) => {
    clearAll()
    runRef.current = true; setRunning(true)
    stream(banner(f, m))
    const loop = () => { if (!runRef.current) return; fireWaveFor(f, m); addT(loop, SPEEDS[speedKey].interval) }
    addT(loop, 900)
  }

  const stop = () => {
    if (!runRef.current) { setLines(prev => [...prev, { k:'dim', v: isAr ? 'لا يوجد هجوم قيد التشغيل.' : 'no attack running.' }]); return }
    runRef.current = false; setRunning(false); clearAll()
    setLines(prev => [...prev, { k:'dim', v:'^C' }, { k:'out', v:`--- ${HOST} flood statistic ---` }, { k:'out', v:'1.28M packets transmitted (flood mode)' }])
  }

  const reset = () => { runRef.current = false; setRunning(false); clearAll(); setPkts(prev => prev.filter(p => p.kind === 'req' || p.kind === 'res')); setLoad(0); setLines([]) }

  // ── the terminal: type a command, press Enter — no start button ────────────
  const runCmd = () => {
    const raw = cmd.trim()
    setCmd('')
    if (!raw) return
    setLines(prev => [...prev, { k:'cmd', v:`# ${raw}` }])
    const low = raw.toLowerCase()
    if (low === 'clear' || low === 'cls') { setLines([]); return }
    if (low === 'reset') { reset(); return }
    if (low === 'stop' || low === '^c' || low === 'c') { stop(); return }
    if (low === 'help') {
      setLines(prev => [...prev,
        { k:'out', v: isAr ? 'اكتب أمر إغراق حقيقياً واضغط Enter، مثل:' : 'type a real flood command and press Enter, e.g.:' },
        { k:'dim', v:`  ${cmdFor(flood, mode)}` },
        { k:'dim', v: isAr ? '  stop / clear لإيقاف الهجوم أو مسح الشاشة (أو Ctrl+C).' : '  stop / clear to end the attack or clear the screen (or Ctrl+C).' },
      ])
      return
    }
    const det = detectFlood(raw)
    if (!det) { setLines(prev => [...prev, { k:'warn', v:`${raw.split(' ')[0]}: command not found — try hping3 / goldeneye / slowloris (help)` }]); return }
    const f = FLOODS.find(x => x.id === det)
    const wantDdos = /--rand-source|-a\s|open-resolver|seq\s+1/.test(raw) || det === 'amp'
    const m = wantDdos ? 'ddos' : 'dos'
    setFlood(det); setMode(m)
    startAttack(f, m)
  }

  const onTermKey = e => {
    if (e.key === 'Enter') { e.preventDefault(); runCmd() }
    else if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); setCmd(''); stop() }
  }

  const px = n => `${n}%`
  const serverDown = load >= 100

  return (
    <div style={{ maxWidth:1180, margin:'0 auto', padding:'20px 14px', fontFamily:'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{`
        @keyframes ddl-in { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ddl-dash { to{ stroke-dashoffset:-16; } }
        @keyframes ddl-flow { to{ stroke-dashoffset:-12; } }
        @keyframes ddl-shake { 0%,100%{transform:translate(-50%,-50%)} 25%{transform:translate(calc(-50% - 4px),-50%)} 75%{transform:translate(calc(-50% + 4px),-50%)} }
        @keyframes ddl-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        .ddl-btn{ border:none;border-radius:9px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s }
        .ddl-btn:hover:not(:disabled){ filter:brightness(1.08);transform:translateY(-1px) }
        .ddl-btn:disabled{ opacity:.45;cursor:not-allowed }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <span style={{ background:'#fef2f2', color:'#b91c1c', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>⚡ {isAr ? 'أمن الشبكات — هجمات الحرمان من الخدمة' : 'Network Security — Denial of Service'}</span>
          <button onClick={() => navigate('/')} style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:7, padding:'3px 10px', fontSize:12, color:'#64748b', cursor:'pointer' }}>{isAr ? '← الرئيسية' : '← Home'}</button>
        </div>
        <h1 style={{ fontSize:24, fontWeight:900, color:'#1e293b', margin:'0 0 5px' }}>⚡ {isAr ? 'مختبر DoS / DDoS — أوامر حقيقية' : 'DoS / DDoS Lab — Real Commands'}</h1>
      </div>

      {/* Controls: mode + speed + load */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', marginBottom:14 }}>
        <div style={{ display:'flex', gap:6, background:'#f1f5f9', borderRadius:11, padding:4 }}>
          {[['dos', isAr?'🎯 DoS (مصدر واحد)':'🎯 DoS (single)'],['ddos', isAr?'🕸️ DDoS (شبكة روبوتات)':'🕸️ DDoS (botnet)']].map(([m, lbl]) => (
            <button key={m} onClick={() => { reset(); setMode(m) }} className="ddl-btn"
              style={{ background: mode===m ? '#0e1f39' : 'transparent', color: mode===m ? 'white' : '#64748b' }}>{lbl}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:6, background:'#f1f5f9', borderRadius:11, padding:4 }}>
          {Object.entries(SPEEDS).map(([k, s]) => (
            <button key={k} onClick={() => setSpeed(k)} className="ddl-btn"
              style={{ background: speedKey===k ? '#7c3aed' : 'transparent', color: speedKey===k ? 'white' : '#64748b' }}>{isAr?s.ar:s.en}</button>
          ))}
        </div>
        <div style={{ marginInlineStart:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:11, color:'#94a3b8', fontWeight:700 }}>{isAr?'حمل الخادم':'Server load'}</span>
          <div style={{ width:140, height:12, background:'#e2e8f0', borderRadius:6, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${load}%`, background:ls.color, transition:'width .4s, background .4s' }} />
          </div>
          <span style={{ fontSize:12, fontWeight:800, color:ls.color, minWidth:74 }}>{Math.round(load)}% · {isAr?ls.ar:ls.en}</span>
        </div>
      </div>

      {/* ── Topology scene ────────────────────────────────────────────────────── */}
      <div dir="ltr" style={{ position:'relative', height:440, borderRadius:14, overflow:'hidden', marginBottom:16,
        background:'radial-gradient(130% 120% at 85% 40%, #16233d 0%, #0b1220 60%)', border:'2px solid #1e293b' }}>
        {/* connection lines — the Internet cloud is the hub for EVERYONE */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
          {/* Internet backbone: cloud → server */}
          <line x1={POS.cloud.x} y1={POS.cloud.y} x2={POS.server.x} y2={POS.server.y} stroke="#38bdf8" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeDasharray="2 3" opacity=".55" style={{ animation:'ddl-flow 1s linear infinite' }} />
          {/* users → cloud (legit) */}
          {POS.users.map((u, i) => <line key={'u'+i} x1={u.x} y1={u.y} x2={POS.cloud.x} y2={POS.cloud.y} stroke="#22c55e" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="1 3" opacity=".45" />)}
          {/* attacker(s) → cloud (the hacker is connected to the Internet too) */}
          {sources.map((s, i) => <line key={'s'+i} x1={s.x} y1={s.y} x2={POS.cloud.x} y2={POS.cloud.y} stroke={flood.color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" strokeDasharray="4 4" opacity={running ? .6 : .32} style={{ animation: running ? 'ddl-dash .6s linear infinite' : 'none' }} />)}
          {/* DDoS: C2 → bots (control) and C2 → cloud */}
          {mode==='ddos' && POS.bots.map((b, i) => <line key={'c'+i} x1={POS.c2.x} y1={POS.c2.y} x2={b.x} y2={b.y} stroke="#ef4444" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="2 3" opacity=".32" />)}
          {mode==='ddos' && <line x1={POS.c2.x} y1={POS.c2.y} x2={POS.cloud.x} y2={POS.cloud.y} stroke="#ef4444" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="1 4" opacity=".25" />}
        </svg>

        {/* internet cloud */}
        <div style={{ position:'absolute', left:px(POS.cloud.x), top:px(POS.cloud.y), transform:'translate(-50%,-50%)', textAlign:'center', zIndex:2 }}>
          <div style={{ fontSize:34, opacity:.9 }}>☁️</div>
          <div style={{ fontSize:9, color:'#7dd3fc', fontWeight:800 }}>{isAr?'الإنترنت':'Internet'}</div>
        </div>

        {/* users — a person sitting at their PC */}
        {POS.users.map((u, i) => (
          <div key={'usr'+i} style={{ position:'absolute', left:px(u.x), top:px(u.y), transform:'translate(-50%,-50%)', textAlign:'center', zIndex:3 }}>
            <UserIcon size={34} />
            <div style={{ fontSize:8.5, color:'#4ade80', fontWeight:700 }}>{isAr?'مستخدم':'user'}</div>
            {serverDown && <div style={{ fontSize:8.5, color:'#f87171', fontWeight:800, animation:'ddl-in .3s ease' }}>{isAr?'لا يصل! ✕':'no reply! ✕'}</div>}
          </div>
        ))}

        {/* attacker nodes — a hooded hacker */}
        {mode==='dos' ? (
          <div style={{ position:'absolute', left:px(POS.dos.x), top:px(POS.dos.y), transform:'translate(-50%,-50%)', textAlign:'center', zIndex:3 }}>
            <HackerIcon size={38} glow={running ? flood.color : null} />
            <div style={{ fontSize:9, color:flood.color, fontWeight:800 }}>{isAr?'المهاجم':'attacker'}</div>
          </div>
        ) : (
          <>
            <div style={{ position:'absolute', left:px(POS.c2.x), top:px(POS.c2.y), transform:'translate(-50%,-50%)', textAlign:'center', zIndex:3 }}>
              <HackerIcon size={34} glow={running ? '#ef4444' : null} />
              <div style={{ fontSize:8.5, color:'#ef4444', fontWeight:800 }}>{isAr?'المهاجم · C2':'attacker · C2'}</div>
            </div>
            {POS.bots.map((b, i) => (
              <div key={'bot'+i} style={{ position:'absolute', left:px(b.x), top:px(b.y), transform:'translate(-50%,-50%)', textAlign:'center', zIndex:3 }}>
                <div style={{ fontSize:18, filter: running ? `drop-shadow(0 0 5px ${flood.color})` : 'none' }}>{['🖥️','💻','📱','📷','🖨️'][i%5]}</div>
                <div style={{ fontSize:7, color:'#94a3b8', fontWeight:700 }}>bot</div>
              </div>
            ))}
          </>
        )}

        {/* packets */}
        {pkts.map(p => (
          <div key={p.id} style={{ position:'absolute', left:px(p.x), top:px(p.y), transform:'translate(-50%,-50%)',
            transition:`left ${p.dur}ms linear, top ${p.dur}ms linear`, zIndex:5,
            fontFamily:'monospace', fontSize:8.5, fontWeight:800,
            color: p.kind==='req' ? '#052e16' : p.kind==='res' ? '#082f49' : 'white', background:p.color,
            border:'1px solid rgba(255,255,255,.55)', borderRadius:5, padding:'1px 5px', boxShadow:`0 0 8px ${p.color}` }}>{p.label}</div>
        ))}

        {/* server rack */}
        <div style={{ position:'absolute', left:px(POS.server.x), top:px(POS.server.y), transform:'translate(-50%,-50%)', zIndex:4,
          animation: load>=75 && running ? 'ddl-shake .3s infinite' : 'none' }}>
          <div style={{ width:96, borderRadius:10, overflow:'hidden', border:`2px solid ${serverDown ? '#dc2626' : ls.color}`, boxShadow:`0 0 20px ${serverDown ? 'rgba(220,38,38,.5)' : 'rgba(0,0,0,.4)'}`, background:'#0f172a' }}>
            <div style={{ background: serverDown ? '#7f1d1d' : '#1e293b', padding:'4px 8px', fontSize:9, color:'white', fontWeight:800, textAlign:'center' }}>🖥️ {HOST}</div>
            {[0,1,2].map(r => (
              <div key={r} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 8px', borderTop:'1px solid #1e293b' }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background: serverDown ? '#64748b' : ls.color, animation: running && !serverDown ? 'ddl-blink .7s infinite' : 'none' }} />
                <div style={{ flex:1, height:4, background:'#1e293b', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(100, load + r*4)}%`, background: serverDown ? '#64748b' : ls.color }} />
                </div>
              </div>
            ))}
            <div style={{ background: serverDown ? '#dc2626' : '#0b1220', padding:'3px 8px', fontSize:8.5, color:'white', fontWeight:800, textAlign:'center' }}>
              {serverDown ? (isAr?'الخادم معطّل':'SERVER DOWN') : `${Math.round(load)}%`}
            </div>
          </div>
        </div>

        {/* legend */}
        <div style={{ position:'absolute', top:8, left:8, background:'rgba(15,23,42,.7)', borderRadius:8, padding:'5px 9px', fontSize:9, color:'#cbd5e1', zIndex:6 }}>
          <span style={{ color:flood.color, fontWeight:800 }}>■ {isAr?flood.nameAr:flood.nameEn}</span> · {flood.layer}
          {' · '}{mode==='dos' ? (isAr?'مصدر واحد':'1 source') : (isAr?`${POS.bots.length} روبوت`:`${POS.bots.length} bots`)}
        </div>
      </div>

      {/* ── Flood picker + terminal ───────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,300px) 1fr', gap:16, marginBottom:18, alignItems:'start' }}>
        {/* flood type picker */}
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:1, marginBottom:8 }}>{isAr?'نوع الإغراق':'FLOOD TYPE'}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {FLOODS.map(f => {
              const active = f.id === floodId
              const disabled = f.id === 'amp' && mode === 'dos'
              return (
                <button key={f.id} onClick={() => { if (disabled) return; reset(); setFlood(f.id) }} disabled={disabled}
                  style={{ textAlign:'start', border:`2px solid ${active ? f.color : '#e2e8f0'}`, background: active ? '#f8fafc' : 'white',
                    borderRadius:10, padding:'9px 12px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .45 : 1, transition:'all .15s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <span style={{ width:10, height:10, borderRadius:3, background:f.color, flexShrink:0 }} />
                    <span style={{ fontSize:12.5, fontWeight:800, color:'#1e293b' }}>{isAr?f.nameAr:f.nameEn}</span>
                    <span style={{ marginInlineStart:'auto', fontSize:9, fontFamily:'monospace', color:'#94a3b8' }}>{f.layer}</span>
                  </div>
                  <div style={{ fontSize:9.5, color:CATS[f.catKey].color, fontWeight:700, marginTop:3 }}>{isAr?CATS[f.catKey].ar:CATS[f.catKey].en}{disabled ? (isAr?' · DDoS فقط':' · DDoS only'):''}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* terminal + info */}
        <div>
          {/* selected flood info */}
          <div style={{ background:'white', border:`2px solid #e2e8f0`, borderTop:`4px solid ${flood.color}`, borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
              <h3 style={{ fontSize:15, fontWeight:800, color:'#1e293b', margin:0 }}>{isAr?flood.nameAr:flood.nameEn}</h3>
              <span style={{ fontSize:10, fontFamily:'monospace', color:'#64748b', background:'#f1f5f9', borderRadius:6, padding:'2px 8px' }}>{flood.layer}</span>
            </div>
            <p style={{ fontSize:12.5, color:'#334155', lineHeight:1.7, margin:'0 0 8px' }}>{isAr?flood.howAr:flood.howEn}</p>
            <div style={{ fontSize:11.5, color:'#166534', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'7px 11px', marginBottom:10 }}>
              🛡️ <b>{isAr?'الحماية: ':'Mitigation: '}</b>{isAr?flood.mitAr:flood.mitEn}
            </div>
            {/* the exact command to TYPE into the terminal */}
            <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, marginBottom:4 }}>{isAr?'اكتب هذا الأمر في الطرفية أدناه ثم اضغط Enter:':'Type this command in the terminal below, then press Enter:'}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'#0f172a', borderRadius:8, padding:'8px 11px' }} dir="ltr">
              <span style={{ color:'#ef4444', fontFamily:'monospace', fontSize:12, fontWeight:700 }}>#</span>
              <code style={{ flex:1, color:'#a5f3fc', fontFamily:'monospace', fontSize:11.5, wordBreak:'break-all' }}>{cmdFor(flood, mode)}</code>
              <button onClick={() => navigator.clipboard && navigator.clipboard.writeText(cmdFor(flood, mode))} title="copy"
                style={{ background:'transparent', border:'1px solid #334155', borderRadius:6, color:'#94a3b8', cursor:'pointer', fontSize:11, padding:'2px 8px' }}>⧉</button>
            </div>
          </div>

          {/* terminal — type the command, press Enter (no start button) */}
          <div style={{ background:'#1e293b', borderRadius:'11px 11px 0 0', padding:'6px 12px', display:'flex', alignItems:'center', gap:6 }} dir="ltr">
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#ef4444' }} />
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#f59e0b' }} />
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#22c55e' }} />
            <span style={{ fontFamily:'monospace', fontSize:11, color:'#94a3b8', marginLeft:8 }}>root@kali: ~ · {mode.toUpperCase()}{running ? ' · attacking…' : ''}</span>
          </div>
          <div ref={termRef} onClick={() => inRef.current && inRef.current.focus()} dir="ltr"
            style={{ background:'#0f172a', borderRadius:'0 0 11px 11px', padding:'12px 14px', height:210, overflowY:'auto', cursor:'text' }}>
            {lines.length === 0 && <div style={{ color:'#475569', fontFamily:'monospace', fontSize:11, lineHeight:1.7 }}>{isAr?'# اكتب أمر الإغراق واضغط Enter لبدء الهجوم (اكتب help للمساعدة).':'# type a flood command and press Enter to start (type help).'}</div>}
            {lines.map((l, i) => (
              <div key={i} style={{ fontFamily:'monospace', fontSize:11, lineHeight:1.7, whiteSpace:'pre-wrap', animation:'ddl-in .2s ease',
                color: l.k==='cmd' ? '#a78bfa' : l.k==='warn' ? '#fbbf24' : l.k==='dim' ? '#64748b' : '#86efac', fontWeight: l.k==='cmd'?700:400 }}>{l.v}</div>
            ))}
            {/* live prompt line — this IS the input, like a real terminal */}
            <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:2 }}>
              <span style={{ color:'#ef4444', fontFamily:'monospace', fontSize:12, fontWeight:700 }}>#</span>
              <input ref={inRef} value={cmd} onChange={e => setCmd(e.target.value)} onKeyDown={onTermKey} spellCheck={false}
                autoCapitalize="off" autoComplete="off" placeholder={isAr?'اكتب الأمر واضغط Enter…':'type a command and press Enter…'}
                style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#e2e8f0', fontFamily:'monospace', fontSize:12 }} />
            </div>
          </div>

          <div style={{ fontSize:10.5, color:'#94a3b8', marginTop:8, lineHeight:1.6 }}>
            💡 {isAr ? 'اكتب الأمر في الطرفية واضغط Enter لبدء الهجوم — لا يوجد زر. لإيقافه اكتب stop أو اضغط Ctrl+C. استخدم سرعة «بطيء» لتتبّع الحزم وقراءة عناوينها بالعين.'
                     : 'Type the command in the terminal and press Enter to start the attack — there is no button. To stop it, type stop or press Ctrl+C. Use “Slow” speed to follow the packets and read their titles by eye.'}
          </div>
        </div>
      </div>

      {/* explanation — collapsed by default, sits under the practical part */}
      <Explanation>
        <p style={{ fontSize:13, color:'#64748b', margin:'0 0 12px', maxWidth:860, lineHeight:1.7 }}>
          {isAr ? 'يتدفّق المستخدمون العاديون ببطء عبر الإنترنت بين متصفحهم والخادم، فتقرأ عناوين الطلبات (GET) والردود (200 OK). اكتب أمر الهجوم في الطرفية واضغط Enter لتُغرق الخادم حتى ينهار ويعجز المستخدمون عن الوصول. بدّل بين مصدر واحد (DoS) وشبكة روبوتات (DDoS).'
                : 'Normal users flow slowly through the Internet between their browser and the server, so you can read the request (GET) and response (200 OK) titles. Type an attack command in the terminal and press Enter to flood the server until it collapses and users can no longer reach it. Toggle a single source (DoS) vs a botnet (DDoS).'}
        </p>
        <div style={{ background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:10, padding:'8px 13px', fontSize:12, color:'#92610a', lineHeight:1.6 }}>
          ⚠️ <b>{isAr ? 'أدوات حقيقية:' : 'Real tools:'}</b> {isAr ? 'هذه أوامر حقيقية (hping3، goldeneye، slowloris). استخدمها فقط على أنظمة تملكها أو مصرّح لك باختبارها. مهاجمة أنظمة الآخرين جريمة.' : 'these are real commands (hping3, goldeneye, slowloris). Use them only on systems you own or are authorized to test. Attacking others is a crime.'}
        </div>
      </Explanation>

      {/* Nav */}
      <div style={{ display:'flex', justifyContent:'center', marginTop:20 }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:6, color:'#1d4ed8', background:'#eff6ff', border:'2px solid #bfdbfe', borderRadius:10, padding:'10px 28px', cursor:'pointer', fontSize:14, fontWeight:700 }}>
          <ChevronLeft size={15} />{isAr ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
