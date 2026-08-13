import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   HOW DEVICES COMMUNICATE — Public IP, Private IP & MAC address
   An interactive diagram: pick a device and watch a packet travel to an internet
   service (through the router's NAT: private IP → public IP → back) or to another
   device on the same network (delivered locally by MAC, never touching the
   internet). Shows the packet header changing at each hop + a live NAT table.
   ──────────────────────────────────────────────────────────────────────────── */

const ROUTER  = { lanIp: '192.168.1.1', mac: 'B8:27:EB:0A:11:00', publicIp: '82.148.30.117' }
const SERVICE = { name: 'youtube.com', ip: '142.250.184.14', icon: '📺' }

const DEVICES = [
  { id: 'laptop', icon: '💻', ar: 'اللابتوب', en: 'Laptop', ip: '192.168.1.5', mac: 'A4:83:E7:2C:19:5F', port: 51001 },
  { id: 'phone',  icon: '📱', ar: 'الهاتف',   en: 'Phone',  ip: '192.168.1.6', mac: 'F0:9F:C2:88:14:AB', port: 51002 },
  { id: 'tv',     icon: '📺', ar: 'التلفاز',  en: 'Smart TV', ip: '192.168.1.7', mac: '5C:3A:45:1B:9E:22', port: 51003 },
  { id: 'tablet', icon: '🖥️', ar: 'الجهاز اللوحي', en: 'Tablet', ip: '192.168.1.8', mac: '3C:5A:B4:77:2D:9E', port: 51004 },
]

const ADDR = [
  { icon: '🏷️', color: '#7c3aed', bg: '#faf5ff', bd: '#e9d5ff',
    tAr: 'عنوان MAC', tEn: 'MAC address', vEn: 'A4:83:E7:2C:19:5F',
    dAr: 'رقم فريد ثابت لكل كرت شبكة. يُستخدم للتسليم المحلي: إيصال الحزمة للجهاز التالي داخل شبكتك (جهازك ← الراوتر).',
    dEn: 'A fixed, unique ID burned into every network card. Used for local delivery: getting the packet to the next device inside your network (your device → the router).',
    anAr: 'مثل اسم الشخص المكتوب على الظرف داخل المبنى.', anEn: "Like the person's name written on the envelope inside the building." },
  { icon: '🏠', color: '#0e7490', bg: '#ecfeff', bd: '#a5f3fc',
    tAr: 'العنوان الخاص (Private IP)', tEn: 'Private IP', vEn: '192.168.1.5',
    dAr: 'عنوان يمنحه الراوتر لكل جهاز داخل شبكتك فقط. يتكرر في كل بيت — 192.168.1.5 عندك غير 192.168.1.5 عند جارك.',
    dEn: 'An address the router gives each device inside your network only. It repeats in every home — your 192.168.1.5 is not your neighbor’s 192.168.1.5.',
    anAr: 'مثل رقم الشقة — له معنى داخل المبنى فقط.', anEn: 'Like your apartment number — only meaningful inside the building.' },
  { icon: '🌍', color: '#b45309', bg: '#fffbeb', bd: '#fde68a',
    tAr: 'العنوان العام (Public IP)', tEn: 'Public IP', vEn: '82.148.30.117',
    dAr: 'عنوان واحد فريد على مستوى العالم يمنحه مزوّد الإنترنت للراوتر. كل أجهزة البيت تشترك فيه للخروج إلى الإنترنت.',
    dEn: 'One globally-unique address the ISP gives your router. All your home devices share it to reach the internet.',
    anAr: 'مثل عنوان المبنى في الشارع — ما يراه العالم الخارجي.', anEn: 'Like the building’s street address — what the outside world sees.' },
]

// ── build the step-by-step journeys ─────────────────────────────────────────────
function serviceFlow(dev, ar) {
  const pub = `${ROUTER.publicIp}:${40000 + (dev.port - 51000)}`
  const priv = `${dev.ip}:${dev.port}`
  return [
    { node: 'home', env: { src: priv, dst: `${SERVICE.ip}:443`, mac: ROUTER.mac },
      ar: `يريد ${dev.ar} فتح ${SERVICE.name}. وجهته خارج الشبكة، فيُرسل الحزمة أولاً إلى الراوتر — باستخدام عنوان MAC الخاص بالراوتر للتسليم المحلي.`,
      en: `${dev.en} wants ${SERVICE.name}. The destination is outside the network, so it first sends the packet to the router — using the router's MAC address for local delivery.` },
    { node: 'router', env: { src: priv, dst: `${SERVICE.ip}:443`, mac: ROUTER.mac },
      ar: 'وصلت الحزمة إلى الراوتر عبر عنوان MAC. لاحظ أن الـ IP المصدر ما زال خاصاً (‎192.168.x‎) ولا يصلح على الإنترنت.',
      en: 'The packet reaches the router via its MAC. Note the source IP is still private (192.168.x) — which does not work on the internet.' },
    { node: 'router', nat: { dev, priv, pub }, env: { src: pub, dst: `${SERVICE.ip}:443`, mac: '—' },
      ar: 'NAT: يستبدل الراوتر العنوان الخاص بعنوانه العام الوحيد، ويسجّل ذلك في جدول NAT ليتذكّر أن هذا الرد يخص هذا الجهاز.',
      en: 'NAT: the router swaps the private IP for its single public IP and records it in the NAT table so it remembers this reply belongs to this device.' },
    { node: 'cloud', env: { src: pub, dst: `${SERVICE.ip}:443`, mac: '(next hop)' },
      ar: 'بعد الراوتر، تعبر الحزمة الإنترنت باستخدام العناوين العامة. يتغيّر عنوان MAC في كل قفزة بين الراوترات، بينما يبقى العنوانان العامّان (المصدر والوجهة) ثابتين حتى تصل.',
      en: 'Past the router, the packet crosses the internet using public IPs. The MAC changes at every hop between routers, while the public source and destination IPs stay the same until it arrives.' },
    { node: 'service', env: { src: pub, dst: `${SERVICE.ip}:443`, mac: '—' },
      ar: `يستقبل خادم ${SERVICE.name} الطلب، ويرى أنه قادم من العنوان العام ${ROUTER.publicIp} — لا يعرف شيئاً عن جهازك الخاص.`,
      en: `${SERVICE.name}'s server receives the request and sees it coming from the public IP ${ROUTER.publicIp} — it knows nothing about your private device.` },
    { node: 'router', env: { src: `${SERVICE.ip}:443`, dst: pub, mac: '(next hop)' },
      ar: `يرد الخادم إلى العنوان العام ${ROUTER.publicIp}. يصل الرد إلى الراوتر.`,
      en: `The server replies to the public IP ${ROUTER.publicIp}. The reply arrives at the router.` },
    { node: 'router', env: { src: `${SERVICE.ip}:443`, dst: priv, mac: dev.mac },
      ar: 'يبحث الراوتر في جدول NAT: هذا الرد يخص جهازك. يعيد كتابة الوجهة إلى عنوانك الخاص، ويسلّمه إليك عبر عنوان MAC الخاص بجهازك.',
      en: 'The router checks the NAT table: this reply belongs to your device. It rewrites the destination to your private IP and delivers it via your device’s MAC.' },
    { node: 'home', env: { src: `${SERVICE.ip}:443`, dst: priv, mac: dev.mac },
      ar: `وصل الفيديو إلى ${dev.ar}! هكذا تشارك كل أجهزة البيت عنواناً عاماً واحداً وتتواصل مع خدمات الإنترنت.`,
      en: `The video reaches ${dev.en}! This is how all home devices share one public IP and talk to internet services.` },
  ]
}

function lanFlow(a, b, ar) {
  return [
    { node: 'home', env: { src: a.ip, dst: b.ip, mac: b.mac },
      ar: `يريد ${a.ar} إرسال رسالة إلى ${b.ar}. كلاهما على نفس الشبكة (‎192.168.1.x‎)، فيجد ${a.ar} عنوان MAC الخاص بـ${b.ar}.`,
      en: `${a.en} wants to message ${b.en}. Both are on the same network (192.168.1.x), so ${a.en} finds ${b.en}'s MAC address.` },
    { node: 'router', env: { src: a.ip, dst: b.ip, mac: b.mac },
      ar: 'تمر الرسالة عبر السويتش داخل الشبكة فقط (تبديل محلي وليس توجيهاً) — لا تخرج إلى الإنترنت ولا تستخدم العنوان العام إطلاقاً.',
      en: 'It passes through the switch inside the LAN only (local switching, not routing) — it never goes to the internet and never uses the public IP.' },
    { node: 'home', env: { src: a.ip, dst: b.ip, mac: b.mac },
      ar: `يستلم ${b.ar} الرسالة، مُسلَّمة مباشرة عبر عنوان MAC الخاص به. التواصل المحلي سريع ولا يحتاج الإنترنت.`,
      en: `${b.en} receives it, delivered directly by its MAC address. Local communication is fast and needs no internet.` },
  ]
}

export default function PageIpMac() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const ar = lang === 'ar'

  const [senderId, setSenderId] = useState('laptop')
  const [peerId, setPeerId]     = useState('phone')
  const [flow, setFlow]         = useState(null)   // { type, steps }
  const [step, setStep]         = useState(0)
  const [playing, setPlaying]   = useState(false)
  const timer = useRef(null)

  const sender = DEVICES.find(d => d.id === senderId)
  const peer   = DEVICES.find(d => d.id === peerId)

  useEffect(() => () => clearTimeout(timer.current), [])

  // keep the peer different from the sender, so the <select> value always exists
  useEffect(() => {
    if (peerId === senderId) setPeerId(DEVICES.find(d => d.id !== senderId).id)
  }, [senderId, peerId])

  // auto-advance
  useEffect(() => {
    clearTimeout(timer.current)
    if (!flow || !playing) return
    if (step >= flow.steps.length - 1) { setPlaying(false); return }
    timer.current = setTimeout(() => setStep(s => s + 1), 1900)
  }, [flow, playing, step])

  const startService = () => { setFlow({ type: 'service', steps: serviceFlow(sender, ar) }); setStep(0); setPlaying(true) }
  const startLan = () => {
    if (peerId === senderId) return
    setFlow({ type: 'lan', steps: lanFlow(sender, peer, ar) }); setStep(0); setPlaying(true)
  }

  const cur = flow ? flow.steps[step] : null
  const activeNode = cur ? cur.node : null

  // NAT rows derived from the current step (service flow only): scrubbing back
  // removes rows, and LAN flows never show a NAT table
  const natRows = (flow && flow.type === 'service')
    ? flow.steps.slice(0, step + 1).filter(s => s.nat).map(s => s.nat)
    : []

  // node highlight helper
  const nodeStyle = (id) => ({
    border: `2px solid ${activeNode === id ? '#8dc63f' : '#e2e8f0'}`,
    boxShadow: activeNode === id ? '0 0 0 4px rgba(141,198,63,0.25)' : 'none',
    transition: 'all .3s', background: 'white', borderRadius: 12,
  })

  const Node = ({ id, children, w }) => (
    <div style={{ ...nodeStyle(id), padding: '10px 8px', width: w, flexShrink: 0, textAlign: 'center' }}>{children}</div>
  )
  const Arrow = () => (
    <div style={{ flex: 1, minWidth: 18, height: 2, background: '#cbd5e1', alignSelf: 'center', position: 'relative' }}>
      <span style={{ position: 'absolute', top: -8, right: -2, color: '#cbd5e1', fontSize: 14 }}>▸</span>
    </div>
  )

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 14px', fontFamily: 'sans-serif' }} dir={ar ? 'rtl' : 'ltr'}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ background: '#ecfeff', color: '#0e7490', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🌐 {ar ? 'أساسيات الشبكات' : 'Networking Basics'}</span>
        <button onClick={() => navigate('/')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '3px 10px', fontSize: 12, color: '#64748b', cursor: 'pointer' }}>{ar ? '← الرئيسية' : '← Home'}</button>
      </div>
      <h1 style={{ fontSize: 23, fontWeight: 900, color: '#1e293b', margin: '0 0 14px' }}>🌐 {ar ? 'كيف تتواصل الأجهزة؟ — IP و MAC' : 'How Devices Communicate — IP & MAC'}</h1>

      {/* controls */}
      <div style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#0e1f39', marginBottom: 8 }}>1) {ar ? 'اختر الجهاز المُرسِل:' : 'Pick the sending device:'}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {DEVICES.map(d => (
            <button key={d.id} onClick={() => setSenderId(d.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: `2px solid ${senderId === d.id ? '#0e1f39' : '#e2e8f0'}`, background: senderId === d.id ? '#0e1f39' : 'white', color: senderId === d.id ? 'white' : '#475569', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>
              <span>{d.icon}</span> {ar ? d.ar : d.en}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#0e1f39', marginBottom: 8 }}>2) {ar ? 'اختر وجهة التواصل:' : 'Choose where to communicate:'}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={startService} style={{ background: '#b45309', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>🌍 {ar ? `افتح ${SERVICE.name} (خدمة إنترنت)` : `Visit ${SERVICE.name} (internet service)`}</button>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>{ar ? 'أو' : 'or'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={startLan} disabled={peerId === senderId} style={{ background: peerId === senderId ? '#cbd5e1' : '#0e7490', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 800, cursor: peerId === senderId ? 'not-allowed' : 'pointer', fontSize: 13 }}>📨 {ar ? 'أرسل إلى' : 'Send to'}</button>
            <select value={peerId} onChange={e => setPeerId(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', fontSize: 12.5 }}>
              {DEVICES.filter(d => d.id !== senderId).map(d => <option key={d.id} value={d.id}>{d.icon} {ar ? d.ar : d.en}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* diagram */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, minWidth: 720, padding: '6px 2px' }} dir="ltr">
          {/* home network */}
          <Node id="home" w={210}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#0e7490', marginBottom: 6 }}>🏠 {ar ? 'شبكة البيت' : 'Home Network'} · 192.168.1.0/24</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {DEVICES.map(d => {
                const isSender = d.id === senderId
                const isPeer = flow?.type === 'lan' && d.id === peerId
                return (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left', border: `1px solid ${isSender ? '#0e1f39' : isPeer ? '#0e7490' : '#eef2f7'}`, background: isSender ? '#f0f9ff' : isPeer ? '#ecfeff' : '#f8fafc', borderRadius: 8, padding: '4px 6px' }}>
                    <span style={{ fontSize: 16 }}>{d.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 10.5, fontFamily: 'monospace', color: '#0e7490' }}>{d.ip}</div>
                      <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#94a3b8' }}>{d.mac}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Node>
          <Arrow />
          {/* router */}
          <Node id="router" w={130}>
            <div style={{ fontSize: 22 }}>📡</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#0e1f39' }}>{ar ? 'الراوتر' : 'Router'} + NAT</div>
            <div style={{ fontSize: 9.5, fontFamily: 'monospace', color: '#0e7490', marginTop: 3 }}>LAN {ROUTER.lanIp}</div>
            <div style={{ fontSize: 9.5, fontFamily: 'monospace', color: '#b45309' }}>WAN {ROUTER.publicIp}</div>
          </Node>
          <Arrow />
          {/* internet */}
          <Node id="cloud" w={100}>
            <div style={{ fontSize: 22 }}>☁️</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>{ar ? 'الإنترنت' : 'Internet'}</div>
            <div style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 3 }}>{ar ? 'عناوين عامة' : 'public IPs'}</div>
          </Node>
          <Arrow />
          {/* service */}
          <Node id="service" w={120}>
            <div style={{ fontSize: 22 }}>{SERVICE.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#0e1f39' }}>{SERVICE.name}</div>
            <div style={{ fontSize: 9.5, fontFamily: 'monospace', color: '#b45309', marginTop: 3 }}>{SERVICE.ip}</div>
          </Node>
        </div>
      </div>

      {/* narration + envelope + player */}
      {flow ? (
        <div style={{ marginTop: 12, background: '#0b1020', borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: 1 }}>
              {flow.type === 'service' ? (ar ? 'رحلة إلى خدمة إنترنت' : 'JOURNEY TO AN INTERNET SERVICE') : (ar ? 'تواصل محلي بين جهازين' : 'LOCAL DEVICE-TO-DEVICE')} — {ar ? 'خطوة' : 'step'} {step + 1}/{flow.steps.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { setStep(0); setPlaying(true) }} style={playerBtn}>⏮</button>
              <button onClick={() => setStep(s => Math.max(0, s - 1))} style={playerBtn}>‹</button>
              <button onClick={() => { if (step >= flow.steps.length - 1) { setStep(0); setPlaying(true) } else setPlaying(p => !p) }} style={playerBtn}>{playing ? '⏸' : '▶'}</button>
              <button onClick={() => setStep(s => Math.min(flow.steps.length - 1, s + 1))} style={playerBtn}>›</button>
            </div>
          </div>

          {/* the "envelope" (packet header) */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }} dir="ltr">
            <Field label={ar ? 'من (IP)' : 'From (IP)'} value={cur.env.src} color="#7dd3fc" />
            <Field label={ar ? 'إلى (IP)' : 'To (IP)'} value={cur.env.dst} color="#fca5a5" />
            <Field label={ar ? 'MAC الوجهة' : 'Dest MAC'} value={cur.env.mac} color="#c4b5fd" />
          </div>

          <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.75, margin: 0 }} dir={ar ? 'rtl' : 'ltr'}>{ar ? cur.ar : cur.en}</p>

          {/* progress dots */}
          <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
            {flow.steps.map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? '#8dc63f' : '#334155' }} />)}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 12, textAlign: 'center', color: '#94a3b8', fontSize: 13, background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, padding: '22px 10px' }}>
          {ar ? '👆 اختر جهازاً ثم اضغط «افتح youtube.com» أو «أرسل إلى» لبدء المحاكاة.' : '👆 Pick a device, then press “Visit youtube.com” or “Send to” to start the simulation.'}
        </div>
      )}

      {/* NAT table */}
      {natRows.length > 0 && (
        <div style={{ marginTop: 12, border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: '#0e1f39', color: 'white', fontSize: 12.5, fontWeight: 800, padding: '9px 14px' }}>📒 {ar ? 'جدول NAT في الراوتر (كيف يتذكّر لمن يعيد الرد)' : 'Router NAT table (how it remembers whom to reply to)'}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'monospace' }} dir="ltr">
            <thead><tr style={{ background: '#f8fafc', color: '#64748b' }}>
              <th style={{ textAlign: 'left', padding: '7px 14px' }}>{ar ? 'الجهاز' : 'Device'}</th>
              <th style={{ textAlign: 'left', padding: '7px 14px' }}>{ar ? 'داخلي (خاص)' : 'Inside (private)'}</th>
              <th style={{ textAlign: 'left', padding: '7px 14px' }}>{ar ? 'خارجي (عام)' : 'Outside (public)'}</th>
            </tr></thead>
            <tbody>
              {natRows.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '7px 14px', color: '#0e1f39' }}>{r.dev.icon} {ar ? r.dev.ar : r.dev.en}</td>
                  <td style={{ padding: '7px 14px', color: '#0e7490' }}>{r.priv}</td>
                  <td style={{ padding: '7px 14px', color: '#b45309' }}>{r.pub}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Explanation>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px', maxWidth: 880, lineHeight: 1.7 }}>
          {ar
            ? 'كل جهاز في بيتك له عنوان MAC ثابت وعنوان IP خاص. الراوتر وحده له عنوان IP عام واحد يواجه الإنترنت. اختر جهازاً وشاهد كيف تسافر الحزمة إلى خدمة على الإنترنت (عبر NAT في الراوتر)، وكيف تتواصل الأجهزة محلياً عبر عنوان MAC.'
            : 'Every device in your home has a fixed MAC address and a private IP. Only the router has one public IP facing the internet. Pick a device and watch how a packet travels to an internet service (through the router’s NAT) — and how devices talk to each other locally by MAC.'}
        </p>

        {/* three addresses */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10, marginBottom: 16 }}>
          {ADDR.map(a => (
            <div key={a.tEn} style={{ background: a.bg, border: `1px solid ${a.bd}`, borderRadius: 12, padding: '12px 13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 18 }}>{a.icon}</span>
                <span style={{ fontSize: 13.5, fontWeight: 900, color: a.color }}>{ar ? a.tAr : a.tEn}</span>
              </div>
              <code style={{ fontFamily: 'monospace', fontSize: 12, color: a.color, background: 'white', border: `1px solid ${a.bd}`, borderRadius: 6, padding: '2px 7px', display: 'inline-block', marginBottom: 6 }} dir="ltr">{a.vEn}</code>
              <p style={{ fontSize: 12, color: '#475569', margin: '0 0 6px', lineHeight: 1.65 }}>{ar ? a.dAr : a.dEn}</p>
              <p style={{ fontSize: 11.5, color: a.color, margin: 0, fontStyle: 'italic' }}>💡 {ar ? a.anAr : a.anEn}</p>
            </div>
          ))}
        </div>

        {/* key takeaways */}
        <div style={{ marginTop: 16, background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#1e40af', marginBottom: 6 }}>🎯 {ar ? 'الخلاصة' : 'Key takeaways'}</div>
          <ul style={{ margin: 0, paddingInlineStart: 20, color: '#1e3a8a', fontSize: 12.5, lineHeight: 1.9 }}>
            <li>{ar ? 'الـ IP يقول «أين» (عنوان منطقي للتوجيه بين الشبكات)، وعنوان MAC يقول «أي جهاز» (تسليم محلي لقفزة واحدة).' : 'IP says “where” (a logical address for routing between networks); MAC says “which device” (local delivery for one hop).'}</li>
            <li>{ar ? 'العنوان الخاص يعمل داخل شبكتك فقط ويتكرر في كل بيت؛ العنوان العام فريد عالمياً وتشترك فيه كل أجهزتك.' : 'A private IP works only inside your network and repeats in every home; the public IP is globally unique and shared by all your devices.'}</li>
            <li>{ar ? 'NAT في الراوتر هو ما يسمح لعشرات الأجهزة بمشاركة عنوان عام واحد، ويعيد كل رد إلى الجهاز الصحيح.' : 'The router’s NAT is what lets dozens of devices share one public IP, and routes each reply back to the right device.'}</li>
            <li>{ar ? 'التواصل بين جهازين في نفس الشبكة يبقى محلياً عبر عنوان MAC ولا يمر بالإنترنت.' : 'Communication between two devices on the same network stays local via MAC and never goes through the internet.'}</li>
          </ul>
        </div>
      </Explanation>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1d4ed8', background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 10, padding: '10px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          <ChevronLeft size={15} />{ar ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}

const playerBtn = { width: 30, height: 30, borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer', fontSize: 13 }

function Field({ label, value, color }) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 8, padding: '6px 10px', flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700, letterSpacing: 0.5 }}>{label}</div>
      <code style={{ fontFamily: 'monospace', fontSize: 12.5, color, wordBreak: 'break-all' }}>{value}</code>
    </div>
  )
}
