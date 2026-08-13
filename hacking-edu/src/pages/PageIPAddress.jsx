import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

// ── Realistic router SVG ──────────────────────────────────────────────────────
const RouterSVG = ({ size = 38 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Left antenna */}
    <line x1="15" y1="20" x2="8"  y2="6"  stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="8"  cy="5"  r="2.5" fill="#06b6d4"/>
    {/* Right antenna */}
    <line x1="33" y1="20" x2="40" y2="6"  stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="40" cy="5"  r="2.5" fill="#06b6d4"/>
    {/* Body */}
    <rect x="4"  y="20" width="40" height="19" rx="3.5" fill="#1e293b"/>
    {/* Top stripe */}
    <rect x="4"  y="20" width="40" height="5.5" rx="3.5" fill="#334155"/>
    {/* Status LEDs */}
    <circle cx="12" cy="30" r="2.5" fill="#22c55e"/>
    <circle cx="19" cy="30" r="2.5" fill="#22c55e"/>
    <circle cx="26" cy="30" r="2.5" fill="#f59e0b"/>
    <circle cx="33" cy="30" r="2.5" fill="#3b82f6" opacity="0.7"/>
    {/* Ethernet port slots */}
    <rect x="38" y="27" width="3" height="2.5" rx="0.5" fill="#475569"/>
    <rect x="38" y="31" width="3" height="2.5" rx="0.5" fill="#475569"/>
    {/* Feet */}
    <rect x="8"  y="39" width="9" height="3.5" rx="1.5" fill="#0f172a"/>
    <rect x="31" y="39" width="9" height="3.5" rx="1.5" fill="#0f172a"/>
  </svg>
)

// ── Devices ───────────────────────────────────────────────────────────────────
const DEVICES = [
  { id: 'computer', emoji: '💻', nameAr: 'كمبيوتر',  nameEn: 'Computer',  ip: '192.168.1.10',  roleAr: 'يُستخدم للعمل والدراسة',         roleEn: 'Used for work and study',           color: 'bg-blue-100 border-blue-300',     ring: 'ring-blue-400' },
  { id: 'phone',    emoji: '📱', nameAr: 'هاتف',      nameEn: 'Phone',     ip: '192.168.1.11',  roleAr: 'يُستخدم للتواصل والترفيه',       roleEn: 'Used for communication',            color: 'bg-green-100 border-green-300',   ring: 'ring-green-400' },
  { id: 'printer',  emoji: '🖨️', nameAr: 'طابعة',     nameEn: 'Printer',   ip: '192.168.1.12',  roleAr: 'تطبع الوثائق وتُرسل الملفات',   roleEn: 'Prints documents and files',        color: 'bg-orange-100 border-orange-300', ring: 'ring-orange-400' },
  { id: 'server',   emoji: '🖥️', nameAr: 'خادم',      nameEn: 'Server',    ip: '192.168.1.100', roleAr: 'يخزن البيانات ويوفر الخدمات',   roleEn: 'Stores data and provides services', color: 'bg-purple-100 border-purple-300', ring: 'ring-purple-400' },
  { id: 'router',   emoji: null, nameAr: 'راوتر',     nameEn: 'Router',    ip: '192.168.1.1',   roleAr: 'يربط جميع الأجهزة بالإنترنت',   roleEn: 'Connects all devices to internet',  color: 'bg-slate-100 border-slate-300',   ring: 'ring-slate-400' },
]

// Approximate center of each device card as % of the diagram container
const DEV_POS = {
  computer: { x: 12, y: 12 },
  phone:    { x: 88, y: 12 },
  printer:  { x: 12, y: 86 },
  server:   { x: 88, y: 86 },
  router:   { x: 50, y: 50 },
}

// Ease-in-out cubic
const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2

// ── Component ─────────────────────────────────────────────────────────────────
export default function PageIPAddress() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [selected, setSelected] = useState(null)
  const [fromId, setFromId]     = useState('computer')
  const [toId, setToId]         = useState('server')
  const [typedIP, setTypedIP]   = useState('')
  const [sendResult, setSendResult] = useState(null) // null | 'correct' | 'wrong' | 'self'
  const [answer, setAnswer]     = useState(null)

  // Packet animation: {x,y,success} or null
  const [packet, setPacket] = useState(null)
  const animRef = useRef(null)

  // Clean up on unmount
  useEffect(() => () => cancelAnimationFrame(animRef.current), [])

  const runAnimation = (fromId, toId, success) => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const from   = DEV_POS[fromId]
    const router = DEV_POS['router']
    const to     = success ? DEV_POS[toId] : from   // wrong → bounce back

    const PHASE = 700  // ms per leg
    const start = performance.now()

    const step = (now) => {
      const elapsed = now - start
      if (elapsed < PHASE) {
        // Leg 1: fromDevice → router
        const t = ease(Math.min(elapsed / PHASE, 1))
        setPacket({ x: from.x + (router.x - from.x) * t, y: from.y + (router.y - from.y) * t, success })
        animRef.current = requestAnimationFrame(step)
      } else if (elapsed < PHASE * 2) {
        // Leg 2: router → destination (or bounce back)
        const t = ease(Math.min((elapsed - PHASE) / PHASE, 1))
        setPacket({ x: router.x + (to.x - router.x) * t, y: router.y + (to.y - router.y) * t, success })
        animRef.current = requestAnimationFrame(step)
      } else {
        setPacket(null)
      }
    }

    animRef.current = requestAnimationFrame(step)
  }

  const T = {
    ar: {
      badge: 'شبكات', title: 'ما هو عنوان IP؟', subtitle: 'تعرّف على عناوين IP وكيف تتواصل الأجهزة في الشبكة',
      conceptTitle: 'الفكرة الأساسية',
      concept: 'عنوان IP هو كأنه عنوان المنزل لكل جهاز في الشبكة. عندما تريد إرسال بيانات، يجب أن تعرف العنوان الصحيح وإلا لن تصل البيانات.',
      clickHint: 'انقر على أي جهاز لمعرفة تفاصيله',
      deviceTitle: 'تفاصيل الجهاز', ipLabel: 'عنوان IP:', roleLabel: 'الدور:',
      sendTitle: 'محاكاة إرسال رسالة',
      sendFrom: 'من:', sendTo: 'إلى:', sendIPLabel: 'اكتب عنوان IP الهدف:',
      sendBtn: 'أرسل الرسالة', resetBtn: 'إعادة',
      resultCorrect: '✅ الرسالة وصلت! عنوان IP صحيح.',
      resultWrong: '❌ الرسالة لم تصل — عنوان IP خاطئ.',
      resultSelf: '⚠️ لا يمكن الإرسال لنفس الجهاز.',
      ipHint: 'تلميح: عنوان IP للجهاز المستهدف هو',
      learnTitle: 'ماذا تعلمنا؟',
      learns: [
        'كل جهاز في الشبكة يملك عنوان IP فريد',
        'عنوان IP يساعد البيانات على الوصول للجهاز الصحيح',
        'بدون عنوان IP صحيح، البيانات تضيع أو لا تصل',
        'الراوتر يوزع العناوين ويوجّه البيانات',
      ],
      challenge: 'تحدٍّ: لماذا تحتاج الأجهزة لعنوان IP؟',
      challengeOpts: ['ليعمل الشاشة', 'لتحديد موقع الجهاز في الشبكة', 'لحفظ الملفات', 'لتشغيل البرامج'],
      challengeAnswer: 1,
      correct: '✅ صحيح! عنوان IP يحدد موقع الجهاز في الشبكة',
      wrong: '❌ حاول مجدداً',
    },
    en: {
      badge: 'Networking', title: 'What is an IP Address?', subtitle: 'Learn how IP addresses allow devices to communicate on a network',
      conceptTitle: 'The Core Idea',
      concept: 'An IP address is like a home address for every device on a network. When you want to send data, you must know the correct address — otherwise the data will not arrive.',
      clickHint: 'Click any device to see its details',
      deviceTitle: 'Device Details', ipLabel: 'IP Address:', roleLabel: 'Role:',
      sendTitle: 'Message Sending Simulation',
      sendFrom: 'From:', sendTo: 'To:', sendIPLabel: 'Type the destination IP address:',
      sendBtn: 'Send Message', resetBtn: 'Reset',
      resultCorrect: '✅ Message delivered! Correct IP address.',
      resultWrong: '❌ Message failed — wrong IP address.',
      resultSelf: '⚠️ Cannot send a message to the same device.',
      ipHint: 'Hint: the target device IP is',
      learnTitle: 'What we learned:',
      learns: [
        'Every device on a network has a unique IP address',
        'The IP address helps data reach the correct device',
        'Without the correct IP address, data gets lost',
        'The router distributes addresses and routes data',
      ],
      challenge: 'Challenge: Why do devices need an IP address?',
      challengeOpts: ['To power the screen', 'To identify the device on the network', 'To save files', 'To run programs'],
      challengeAnswer: 1,
      correct: '✅ Correct! IP addresses identify a device on the network',
      wrong: '❌ Try again',
    },
  }
  const t = T[lang]

  const fromDevice = DEVICES.find(d => d.id === fromId)
  const toDevice   = DEVICES.find(d => d.id === toId)

  const sendMessage = () => {
    const ip = typedIP.trim()
    const fromDevice2 = DEVICES.find(d => d.id === fromId)
    if (ip === fromDevice2?.ip) { setSendResult('self'); return }
    const destDevice = DEVICES.find(d => d.ip === ip)
    if (destDevice) {
      setToId(destDevice.id)
      setSendResult('correct')
      runAnimation(fromId, destDevice.id, true)
    } else {
      setSendResult('wrong')
      runAnimation(fromId, toId, false)
    }
  }

  return (
    <div className="page-transition max-w-5xl mx-auto px-4 py-8" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <span className="bg-cyan-100 text-cyan-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{t.badge}</span>
        <h1 className="text-3xl font-black text-slate-800 mt-2 mb-1">{t.title}</h1>
      </div>

      {/* Network diagram + device detail */}
      <div className="grid grid-cols-3 gap-4 mb-5">

        {/* ── Hub diagram ── */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-400 mb-3 text-center">{t.clickHint}</p>

          {/* Diagram container */}
          <div className="relative h-64">

            {/* SVG: connection lines (dashed, behind everything) */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {['computer','phone','printer','server'].map(id => {
                const p = DEV_POS[id]
                const r = DEV_POS.router
                const highlighted = packet && (id === fromId || id === toId)
                return (
                  <line key={id}
                    x1={p.x} y1={p.y} x2={r.x} y2={r.y}
                    stroke={highlighted ? (packet.success ? '#10b981' : '#ef4444') : '#cbd5e1'}
                    strokeWidth={highlighted ? 1.2 : 0.8}
                    strokeDasharray="3 2"
                    opacity={highlighted ? 0.8 : 0.6}
                  />
                )
              })}
            </svg>

            {/* Animated packet dot */}
            {packet && (
              <div
                className="absolute z-30 pointer-events-none"
                style={{ left: `${packet.x}%`, top: `${packet.y}%`, transform: 'translate(-50%,-50%)' }}
              >
                <div className={`w-6 h-6 rounded-full shadow-lg border-2 border-white flex items-center justify-center
                  ${packet.success ? 'bg-emerald-500' : 'bg-red-500'}`}>
                  <span className="text-xs leading-none">{packet.success ? '✉️' : '✉️'}</span>
                </div>
                {/* Glow ring */}
                <div className={`absolute inset-0 rounded-full animate-ping opacity-50
                  ${packet.success ? 'bg-emerald-400' : 'bg-red-400'}`} />
              </div>
            )}

            {/* Router in center */}
            {(() => {
              const router = DEVICES.find(d => d.id === 'router')
              const isActive = packet && (fromId === 'router' || toId === 'router')
              return (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <button
                    onClick={() => setSelected(router.id === selected ? null : router.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${router.color}
                      ${selected === router.id ? `${router.ring} ring-2 scale-110` : 'hover:scale-105'}
                      ${isActive ? 'ring-2 ring-cyan-400 scale-110' : ''}`}
                  >
                    <RouterSVG size={36} />
                    <span className="text-xs font-bold text-slate-600">{isAr ? router.nameAr : router.nameEn}</span>
                    <span className="text-xs font-mono text-slate-500" dir="ltr">{router.ip}</span>
                  </button>
                </div>
              )
            })()}

            {/* Corner devices */}
            {[
              { id: 'computer', pos: 'top-0 left-0' },
              { id: 'phone',    pos: 'top-0 right-0' },
              { id: 'printer',  pos: 'bottom-0 left-0' },
              { id: 'server',   pos: 'bottom-0 right-0' },
            ].map(({ id, pos }) => {
              const dev = DEVICES.find(d => d.id === id)
              const isActive = packet && (id === fromId || id === toId)
              return (
                <div key={id} className={`absolute ${pos} z-10`}>
                  <button
                    onClick={() => setSelected(id === selected ? null : id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${dev.color}
                      ${selected === id ? `${dev.ring} ring-2 scale-110` : 'hover:scale-105'}
                      ${isActive ? `${dev.ring} ring-2 scale-105` : ''}`}
                  >
                    <span className="text-2xl">{dev.emoji}</span>
                    <span className="text-xs font-bold text-slate-600">{isAr ? dev.nameAr : dev.nameEn}</span>
                    <span className="text-xs font-mono text-slate-500" dir="ltr">{dev.ip}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Device detail card */}
        <div className="col-span-1">
          {selected ? (() => {
            const dev = DEVICES.find(d => d.id === selected)
            return (
              <div className={`rounded-2xl border-2 p-5 h-full flex flex-col justify-center ${dev.color}`}>
                <div className="mb-3 flex justify-center">
                  {dev.id === 'router' ? <RouterSVG size={48} /> : <span className="text-4xl">{dev.emoji}</span>}
                </div>
                <h3 className="font-black text-slate-800 text-lg text-center mb-4">
                  {isAr ? dev.nameAr : dev.nameEn}
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-0.5">{t.ipLabel}</p>
                    <p className="font-black text-slate-800 font-mono text-base" dir="ltr">{dev.ip}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-0.5">{t.roleLabel}</p>
                    <p className="text-sm text-slate-700">{isAr ? dev.roleAr : dev.roleEn}</p>
                  </div>
                </div>
              </div>
            )
          })() : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-5 h-full flex flex-col items-center justify-center text-center text-slate-400">
              <span className="text-4xl mb-3">👆</span>
              <p className="text-sm">{t.clickHint}</p>
            </div>
          )}
        </div>
      </div>

      {/* Send message simulation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-5">
        <h3 className="font-bold text-slate-700 mb-1 flex items-center gap-2">
          📨 {t.sendTitle}
        </h3>
        <p className="text-slate-400 text-xs mb-4">{isAr ? 'اكتب عنوان IP الجهاز الذي تريد إرساله — الراوتر سيكتشف الجهاز ويوصّل الرسالة.' : 'Type the IP address of the device you want to reach — the router will identify it and deliver the message.'}</p>

        {/* From device selector */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-500 block mb-1.5">{t.sendFrom}</label>
          <select
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-white"
            value={fromId}
            onChange={e => { setFromId(e.target.value); setSendResult(null) }}
          >
            {DEVICES.map(d => (
              <option key={d.id} value={d.id}>{d.emoji ?? '🌐'} {isAr ? d.nameAr : d.nameEn} ({d.ip})</option>
            ))}
          </select>
        </div>

        {/* IP input + send */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-500 block mb-1.5">{t.sendIPLabel}</label>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              value={typedIP}
              onChange={e => { setTypedIP(e.target.value); setSendResult(null) }}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="192.168.1.???"
              dir="ltr"
            />
            <button
              onClick={sendMessage}
              className="bg-cyan-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-cyan-700 transition-colors shadow-sm flex-shrink-0"
            >
              {t.sendBtn}
            </button>
            {sendResult && (
              <button
                onClick={() => { setSendResult(null); setTypedIP('') }}
                className="text-slate-400 hover:text-slate-600 text-sm px-3 py-2 bg-slate-100 rounded-xl flex-shrink-0"
              >
                {t.resetBtn}
              </button>
            )}
          </div>
        </div>

        {/* Router detection step — shown after typing */}
        {sendResult && (
          <div className="space-y-2 mt-2">
            {/* Step 1: sent to router */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
              <span className="text-lg flex-shrink-0">📤</span>
              <span className="text-slate-600">
                {isAr
                  ? <>{isAr ? DEVICES.find(d=>d.id===fromId)?.nameAr : DEVICES.find(d=>d.id===fromId)?.nameEn} أرسل الرسالة إلى الراوتر مع العنوان <span className="font-mono font-bold text-cyan-700" dir="ltr">{typedIP.trim()}</span></>
                  : <>{DEVICES.find(d=>d.id===fromId)?.nameEn} sent the message to the router with address <span className="font-mono font-bold text-cyan-700" dir="ltr">{typedIP.trim()}</span></>
                }
              </span>
            </div>
            {/* Step 2: router checking */}
            <div className="flex items-center gap-3 bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-2.5 text-sm">
              <span className="text-lg flex-shrink-0">🔁</span>
              <span className="text-cyan-800">
                {isAr ? 'الراوتر يبحث في جدول الأجهزة عن هذا العنوان...' : 'Router is looking up this IP in the device table...'}
              </span>
            </div>
            {/* Step 3: result */}
            {sendResult === 'correct' && (() => {
              const dest = DEVICES.find(d => d.ip === typedIP.trim())
              return (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm">
                  <span className="text-lg flex-shrink-0">✅</span>
                  <span className="text-emerald-800 font-medium">
                    {isAr
                      ? <>الراوتر وجد الجهاز: <span className="font-bold">{dest?.emoji} {dest?.nameAr}</span> — الرسالة وصلت!</>
                      : <>Router found the device: <span className="font-bold">{dest?.emoji} {dest?.nameEn}</span> — message delivered!</>
                    }
                  </span>
                </div>
              )
            })()}
            {sendResult === 'wrong' && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm">
                <span className="text-lg flex-shrink-0">❌</span>
                <span className="text-red-700 font-medium">
                  {isAr
                    ? <>الراوتر لم يجد جهازاً بهذا العنوان — الرسالة لم تصل. <span className="text-slate-500 font-mono text-xs">{t.ipHint}: {toDevice?.ip}</span></>
                    : <>Router found no device with this address — message not delivered. <span className="text-slate-500 font-mono text-xs">{t.ipHint}: {toDevice?.ip}</span></>
                  }
                </span>
              </div>
            )}
            {sendResult === 'self' && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm">
                <span className="text-lg flex-shrink-0">⚠️</span>
                <span className="text-amber-700 font-medium">{t.resultSelf}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Takeaways + Challenge */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4">
          <h3 className="font-bold text-cyan-800 text-sm mb-3">🧩 {t.challenge}</h3>
          <div className="space-y-2">
            {t.challengeOpts.map((opt, i) => (
              <button key={i} onClick={() => setAnswer(i)}
                className={`w-full text-right px-3 py-2 rounded-xl text-xs font-medium border transition-all
                  ${answer === null ? 'bg-white border-slate-200 text-slate-700 hover:border-cyan-400'
                    : answer === t.challengeAnswer
                      ? i === t.challengeAnswer ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-400 opacity-50'
                      : i === answer ? 'bg-red-100 border-red-400 text-red-700'
                        : i === t.challengeAnswer ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-400 opacity-50'}`}
                dir={isAr ? 'rtl' : 'ltr'}>
                {opt}
              </button>
            ))}
          </div>
          {answer !== null && (
            <p className={`mt-2 text-xs font-bold ${answer === t.challengeAnswer ? 'text-emerald-700' : 'text-red-600'}`}>
              {answer === t.challengeAnswer ? t.correct : t.wrong}
            </p>
          )}
        </div>
      </div>

      <Explanation>
        <p className="text-slate-500 mb-4">{t.subtitle}</p>
        <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-5 mb-4">
          <h2 className="font-bold text-cyan-800 mb-1.5">{t.conceptTitle}</h2>
          <p className="text-cyan-700 text-sm leading-relaxed">{t.concept}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <h3 className="font-bold text-slate-800 text-sm mb-3">📚 {t.learnTitle}</h3>
          <ul className="space-y-1.5">
            {t.learns.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="text-cyan-500 mt-0.5 flex-shrink-0">✓</span>{item}
              </li>
            ))}
          </ul>
        </div>
      </Explanation>

      <div className="flex items-center pt-6 border-t border-slate-100">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-cyan-600 text-sm font-medium transition-colors">
          <ChevronLeft className="w-4 h-4" />
          {isAr ? '← الرئيسية' : '← Home'}
        </button>
      </div>
    </div>
  )
}
