import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   PUBLIC WIFI SNIFFING (safe, in-page only)
   The student plays the attacker on an open café WiFi, running a Wireshark-style
   capture. Packets stream into a color-coded list. Clicking an HTTP packet
   reveals its plaintext content (logins, messages) — the hacker can read it.
   Clicking an HTTPS/TLS packet reveals only encrypted bytes — unreadable.
   Lesson: HTTP is readable by anyone on the network; HTTPS encrypts the content.
   ──────────────────────────────────────────────────────────────────────────── */

const ATTACKER_IP = '10.0.0.31'

// The captured packets, in order. `secure` = encrypted (HTTPS/TLS).
const PACKETS = [
  {
    proto: 'DNS', dev: 'sara', dst: '8.8.8.8', len: 74, secure: false, kind: 'dns',
    infoAr: 'استعلام: forum.qa', infoEn: 'Standard query A forum.qa',
    host: 'forum.qa',
  },
  {
    proto: 'HTTP', dev: 'sara', dst: 'forum.qa', len: 402, secure: false, kind: 'http',
    infoAr: 'GET /login  (نص صريح)', infoEn: 'GET /login HTTP/1.1',
    text: 'GET /login HTTP/1.1\nHost: forum.qa\nUser-Agent: Chrome/124.0\nAccept: text/html',
  },
  {
    proto: 'HTTP', dev: 'sara', dst: 'forum.qa', len: 389, secure: false, kind: 'login',
    infoAr: 'POST /login  ← اسم المستخدم وكلمة المرور!', infoEn: 'POST /login  ← username & password!',
    text: 'POST /login HTTP/1.1\nHost: forum.qa\nContent-Type: application/x-www-form-urlencoded\n\nusername=sara&password=Qatar#2024',
    secret: 'username=sara&password=Qatar#2024',
  },
  {
    proto: 'TLS', dev: 'omar', dst: 'mail.google.com', len: 233, secure: true, kind: 'handshake',
    infoAr: 'Client Hello', infoEn: 'Client Hello (TLS 1.3)',
  },
  {
    proto: 'TLS', dev: 'omar', dst: 'mail.google.com', len: 517, secure: true, kind: 'tls',
    infoAr: 'Application Data (مشفّر)', infoEn: 'Application Data (encrypted)', bytes: 512,
  },
  {
    proto: 'HTTP', dev: 'sara', dst: 'chat.qa', len: 356, secure: false, kind: 'chat',
    infoAr: 'GET /send  ← رسالة محادثة', infoEn: 'GET /send  ← chat message',
    text: 'GET /send?to=ahmed&msg=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D8%A3%D8%AD%D9%85%D8%AF HTTP/1.1\nHost: chat.qa',
    secret: 'to=ahmed  msg="مرحبا أحمد، رمز الحساب 8842"',
  },
  {
    proto: 'DNS', dev: 'layan', dst: '8.8.8.8', len: 78, secure: false, kind: 'dns',
    infoAr: 'استعلام: shop.qa', infoEn: 'Standard query A shop.qa',
    host: 'shop.qa',
  },
  {
    proto: 'TLS', dev: 'layan', dst: 'shop.qa', len: 605, secure: true, kind: 'tls',
    infoAr: 'Application Data (مشفّر)', infoEn: 'Application Data (encrypted)', bytes: 600,
  },
  {
    proto: 'HTTP', dev: 'layan', dst: 'search.qa', len: 344, secure: false, kind: 'search',
    infoAr: 'GET /search  ← عبارة البحث', infoEn: 'GET /search  ← search query',
    text: 'GET /search?q=cheap+flights+to+dubai HTTP/1.1\nHost: search.qa',
    secret: 'q=cheap flights to dubai',
  },
  {
    proto: 'TLS', dev: 'omar', dst: 'qnb-bank.qa', len: 733, secure: true, kind: 'tls',
    infoAr: 'Application Data (مشفّر)', infoEn: 'Application Data (encrypted)', bytes: 728,
  },
]

const DEVICES = {
  sara:  { ar: 'لابتوب سارة', en: "Sara's laptop", ip: '10.0.0.12' },
  omar:  { ar: 'جوال عمر',    en: "Omar's phone",  ip: '10.0.0.18' },
  layan: { ar: 'لابتوب ليان', en: "Layan's laptop", ip: '10.0.0.23' },
}

const PROTO_STYLE = {
  HTTP: { bg: '#fef2f2', badge: '#b91c1c', badgeBg: '#fee2e2' },
  TLS:  { bg: '#ecfdf5', badge: '#047857', badgeBg: '#d1fae5' },
  DNS:  { bg: '#f8fafc', badge: '#475569', badgeBg: '#e2e8f0' },
}

// fake hex dump for encrypted payloads
const hexDump = n => {
  const hx = '0123456789abcdef'
  let out = '17 03 03 02 00'   // TLS record header-ish
  for (let i = 0; i < Math.min(n, 96); i++) out += ' ' + hx[(i * 7 + 3) % 16] + hx[(i * 13 + 5) % 16]
  return out + ' …'
}

export default function PageWifiSniff() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const ar = lang === 'ar'

  const [phase, setPhase] = useState('idle')   // idle | capturing | done
  const [rows, setRows]   = useState([])        // captured packets so far
  const [sel, setSel]     = useState(null)      // selected packet index (into rows)
  const [filter, setFilter] = useState('ALL')   // ALL | HTTP | TLS | DNS
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const start = () => {
    if (phase === 'capturing') return
    timers.current.forEach(clearTimeout); timers.current = []
    setRows([]); setSel(null); setPhase('capturing')
    PACKETS.forEach((p, i) => {
      timers.current.push(setTimeout(() => {
        setRows(prev => [...prev, { ...p, no: i + 1, t: (i * 0.487 + (i % 3) * 0.11).toFixed(3) }])
        if (i === PACKETS.length - 1) timers.current.push(setTimeout(() => setPhase('done'), 400))
      }, 650 * (i + 1)))
    })
  }

  const reset = () => {
    timers.current.forEach(clearTimeout); timers.current = []
    setRows([]); setSel(null); setPhase('idle')
  }

  const shown = rows.filter(r => filter === 'ALL' || r.proto === filter)
  const httpCount = rows.filter(r => !r.secure && r.proto === 'HTTP').length
  const tlsCount  = rows.filter(r => r.secure).length
  const selPkt = sel != null ? rows[sel] : null

  const dev = k => DEVICES[k]
  const num = n => (ar ? Number(n).toLocaleString('ar-EG') : String(n))

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="max-w-3xl mx-auto px-4 py-8">
      <style>{`@keyframes wsniff-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}} @keyframes wsniff-blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>

      <div className="mb-4">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#fef2f2', color: '#b91c1c' }}>{ar ? '🛜 مختبر أمان الشبكات' : '🛜 Network Security Lab'}</span>
        <h1 className="text-2xl font-black text-slate-800 mt-2 mb-1">🐺 {ar ? 'التنصّت على شبكة الواي فاي العامة' : 'Public WiFi Sniffing'}</h1>
        <p className="text-sm text-slate-500">{ar ? 'أنت متصل بشبكة مقهى مفتوحة — وكذلك ضحاياك. شغّل أداة الالتقاط وشاهد ما يمكنك قراءته.' : "You're on an open café network — and so are your victims. Run the capture and see what you can read."}</p>
      </div>

      {/* café scene */}
      <div className="rounded-2xl border-2 border-slate-200 p-4 mb-4" style={{ background: 'linear-gradient(135deg,#eef2ff,#faf5ff)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">📶 {ar ? 'واي فاي المقهى المجاني' : 'Free Café WiFi'} <span className="text-[10px] font-normal px-2 py-0.5 rounded-full" style={{ background: '#fee2e2', color: '#b91c1c' }}>{ar ? 'غير مشفّرة' : 'Open · unencrypted'}</span></div>
          <div className="flex items-center gap-3">
            {Object.entries(DEVICES).map(([k, d]) => (
              <div key={k} className="text-center">
                <div className="text-2xl">{k === 'omar' ? '📱' : '💻'}</div>
                <div className="text-[10px] text-slate-500">{ar ? d.ar : d.en}</div>
              </div>
            ))}
            <div className="text-center">
              <div className="text-2xl">🐺</div>
              <div className="text-[10px] font-bold" style={{ color: '#b91c1c' }}>{ar ? 'أنت (المهاجم)' : 'You (attacker)'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {phase !== 'capturing' ? (
          <button onClick={start} className="px-4 py-2 rounded-xl text-sm font-black text-white" style={{ background: '#dc2626' }}>{phase === 'done' ? (ar ? '↻ التقاط جديد' : '↻ Re-capture') : (ar ? '▶ ابدأ الالتقاط' : '▶ Start capture')}</button>
        ) : (
          <button onClick={reset} className="px-4 py-2 rounded-xl text-sm font-black text-white flex items-center gap-2" style={{ background: '#334155' }}><span className="w-2 h-2 rounded-full bg-red-400" style={{ animation: 'wsniff-blink 1s infinite' }} />{ar ? '⏺ يلتقط… إيقاف' : '⏺ Capturing… stop'}</button>
        )}
        <span className="text-xs text-slate-500 font-mono">{ar ? `${num(rows.length)} حزمة` : `${rows.length} packets`}</span>
        <div className="flex-1" />
        {['ALL', 'HTTP', 'TLS', 'DNS'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="px-2.5 py-1 rounded-lg text-xs font-bold border-2 transition-colors"
            style={{ borderColor: filter === f ? '#7c3aed' : '#e2e8f0', background: filter === f ? '#7c3aed' : 'white', color: filter === f ? 'white' : '#475569' }}>
            {f === 'ALL' ? (ar ? 'الكل' : 'All') : f}
          </button>
        ))}
      </div>

      {/* Wireshark-style packet list */}
      <div className="rounded-xl border-2 border-slate-200 overflow-hidden" style={{ fontFamily: 'monospace' }}>
        <div className="grid text-[11px] font-bold text-slate-500 px-2 py-1.5 border-b border-slate-200 bg-slate-50" style={{ gridTemplateColumns: '34px 60px 1fr 1fr 56px 52px', gap: 6 }} dir="ltr">
          <span>No.</span><span>Time</span><span>{ar ? 'المصدر' : 'Source'}</span><span>{ar ? 'الوجهة' : 'Destination'}</span><span>Proto</span><span>Len</span>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 300 }} dir="ltr">
          {shown.length === 0 ? (
            <div className="text-center text-slate-400 text-xs py-12" style={{ fontFamily: 'sans-serif' }}>{phase === 'capturing' ? (ar ? 'يلتقط الحزم…' : 'Capturing packets…') : (ar ? 'اضغط «ابدأ الالتقاط» لرؤية حركة الشبكة' : 'Press “Start capture” to see the network traffic')}</div>
          ) : shown.map((r) => {
            const st = PROTO_STYLE[r.proto]
            const realIdx = rows.indexOf(r)
            const active = realIdx === sel
            return (
              <div key={r.no} onClick={() => setSel(realIdx)}
                className="grid items-center px-2 py-1.5 text-[11px] cursor-pointer border-b border-slate-100"
                style={{ gridTemplateColumns: '34px 60px 1fr 1fr 56px 52px', gap: 6, background: active ? '#dbeafe' : st.bg, animation: 'wsniff-in .2s' }}>
                <span className="text-slate-500">{r.no}</span>
                <span className="text-slate-500">{r.t}</span>
                <span className="text-slate-700 truncate" title={dev(r.dev).ip}>{dev(r.dev).ip}</span>
                <span className="text-slate-700 truncate">{r.dst}</span>
                <span><span className="px-1.5 py-0.5 rounded text-[9px] font-black" style={{ background: st.badgeBg, color: st.badge }}>{r.proto}</span></span>
                <span className="text-slate-400">{r.len}</span>
                <span className="col-span-6 text-[11px] truncate" style={{ fontFamily: ar ? 'inherit' : 'monospace', color: r.secure ? '#047857' : (r.kind === 'login' || r.secret ? '#b91c1c' : '#475569'), gridColumn: '1 / -1', paddingInlineStart: 40 }} dir={ar ? 'rtl' : 'ltr'}>
                  {r.secure ? '🔒 ' : (r.secret ? '🔓 ' : '')}{ar ? r.infoAr : r.infoEn}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* packet detail */}
      {selPkt && (
        <div className="mt-3 rounded-xl overflow-hidden border-2" style={{ borderColor: selPkt.secure ? '#a7f3d0' : '#fecaca' }}>
          <div className="px-3 py-2 text-xs font-bold flex items-center justify-between" style={{ background: selPkt.secure ? '#d1fae5' : '#fee2e2', color: selPkt.secure ? '#065f46' : '#991b1b' }} dir={ar ? 'rtl' : 'ltr'}>
            <span>{selPkt.secure ? (ar ? '🔒 حزمة مشفّرة (HTTPS/TLS)' : '🔒 Encrypted packet (HTTPS/TLS)') : (ar ? '🔓 حزمة بنص صريح (HTTP)' : '🔓 Plaintext packet (HTTP)')} — {dev(selPkt.dev).ip} → {selPkt.dst}</span>
          </div>
          <div className="p-3 text-xs" style={{ background: '#0b1020', color: '#a5f3fc', fontFamily: 'monospace' }} dir="ltr">
            {selPkt.secure ? (
              <>
                <div className="text-slate-400">Transport Layer Security · Application Data</div>
                <div className="mt-1 break-all leading-relaxed text-slate-500">{hexDump(selPkt.bytes || 200)}</div>
                <div className="mt-2 text-emerald-300" dir={ar ? 'rtl' : 'ltr'} style={{ fontFamily: ar ? 'inherit' : 'monospace' }}>🔒 {ar ? `مشفّر — ${selPkt.bytes || 0} بايت لا يمكنك قراءتها. محتوى عمر آمن.` : `Encrypted — ${selPkt.bytes || 0} unreadable bytes. The victim's content is safe.`}</div>
              </>
            ) : selPkt.kind === 'dns' ? (
              <>
                <div className="text-slate-300">Domain Name System (query)</div>
                <div className="mt-1">Name: <span className="text-yellow-300">{selPkt.host}</span></div>
                <div className="mt-2 text-amber-300" dir={ar ? 'rtl' : 'ltr'} style={{ fontFamily: ar ? 'inherit' : 'monospace' }}>👀 {ar ? 'حتى مع HTTPS، ترى أيّ المواقع يزورها الضحية (اسم الموقع)، وإن لم تر المحتوى.' : 'Even with HTTPS, you can see WHICH sites the victim visits (the domain) — just not the content.'}</div>
              </>
            ) : (
              <>
                <div className="whitespace-pre-wrap leading-relaxed text-cyan-100">{selPkt.text}</div>
                {selPkt.secret && (
                  <div className="mt-2 px-2 py-1.5 rounded" style={{ background: '#450a0a', color: '#fca5a5' }} dir={ar ? 'rtl' : 'ltr'}>
                    🔓 {ar ? 'التقطتَ:' : 'Captured:'} <span className="font-black" style={{ fontFamily: 'monospace' }} dir="ltr">{selPkt.secret}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* verdict */}
      {phase === 'done' && (
        <div className="mt-4 rounded-2xl border-2 border-slate-200 p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-xl p-3 text-center" style={{ background: '#fef2f2' }}>
              <div className="text-2xl font-black" style={{ color: '#b91c1c' }}>🔓 {num(httpCount)}</div>
              <div className="text-[11px] text-red-700">{ar ? 'حزم HTTP قرأتها بالكامل (دخول، رسائل، بحث)' : 'HTTP packets you read in full (logins, messages, searches)'}</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: '#ecfdf5' }}>
              <div className="text-2xl font-black" style={{ color: '#047857' }}>🔒 {num(tlsCount)}</div>
              <div className="text-[11px] text-emerald-700">{ar ? 'حزم HTTPS مشفّرة لم تستطع قراءتها' : "HTTPS packets you couldn't read"}</div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <h3 className="font-black text-slate-800 text-sm mb-2">🛡️ {ar ? 'كيف تحمي نفسك على الواي فاي العام' : 'How to protect yourself on public WiFi'}</h3>
            <div className="space-y-1.5 text-sm text-slate-700">
              {[
                ['🔒', ar ? 'تأكّد أن الموقع يبدأ بـ https:// (قفل في المتصفح) قبل إدخال أي بيانات.' : 'Make sure the site starts with https:// (padlock) before entering any data.'],
                ['🛡️', ar ? 'استخدم VPN — يشفّر كل حركتك حتى على شبكة مفتوحة.' : 'Use a VPN — it encrypts all your traffic even on an open network.'],
                ['🚫', ar ? 'تجنّب تسجيل الدخول للبنوك أو البريد على واي فاي عام غير موثوق.' : "Avoid logging into banking or email on untrusted public WiFi."],
                ['📶', ar ? 'بيانات هاتفك (4G/5G) مشفّرة وأأمن من الواي فاي المفتوح.' : 'Your phone data (4G/5G) is encrypted and safer than open WiFi.'],
              ].map(([ic, t]) => (
                <div key={t} className="flex items-start gap-2"><span className="flex-shrink-0">{ic}</span><span>{t}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Explanation>
        <p className="text-slate-500 text-sm leading-relaxed">
          {ar
            ? 'على شبكة واي فاي مفتوحة، كل الأجهزة تتشارك الهواء نفسه — فيستطيع أي شخص «التقاط» الحزم المارّة (كما تفعل أداة Wireshark). المواقع التي تستخدم HTTP ترسل كل شيء بنص صريح، فيقرأ المهاجم اسم المستخدم وكلمة المرور والرسائل. أمّا HTTPS فيشفّر المحتوى، فلا يرى المهاجم إلا بايتات غير مفهومة. جرّب: شغّل الالتقاط، ثم اضغط على حزمة HTTP لتقرأها، وعلى حزمة HTTPS لترى التشفير.'
            : 'On an open WiFi network every device shares the same air, so anyone can “capture” the passing packets (like Wireshark does). HTTP sites send everything in plaintext, so the attacker reads usernames, passwords and messages. HTTPS encrypts the content, so the attacker sees only meaningless bytes. Try it: start the capture, click an HTTP packet to read it, and a HTTPS packet to see the encryption.'}
        </p>
      </Explanation>

      <div className="flex justify-center mt-6">
        <button onClick={() => navigate('/')} className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 border-2 border-slate-200 flex items-center gap-1.5"><ChevronLeft size={15} />{ar ? 'الرئيسية' : 'Home'}</button>
      </div>
    </div>
  )
}
