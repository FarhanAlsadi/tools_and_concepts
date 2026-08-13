import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

const DOMAIN_DATA = {
  'google.com':    { ip: '142.250.80.46', siteIdx: 0, emoji: '🔍' },
  'orbyx.store':   { ip: '192.168.1.20',  siteIdx: 1, emoji: '🛒' },
  'instagram.com': { ip: '157.240.3.35',  siteIdx: 2, emoji: '📸' },
}

const CONTACTS = [
  { nameAr: 'أحمد الكواري',  nameEn: 'Ahmed Al Kuwari',  phone: '+974 5551 1234' },
  { nameAr: 'نورة المنصوري', nameEn: 'Noura Al Mansoori', phone: '+974 5552 5678' },
  { nameAr: 'سعد الدوسري',   nameEn: 'Saad Al Dosari',    phone: '+974 5553 9012' },
  { nameAr: 'فاطمة الشمري',  nameEn: 'Fatima Al Shamri',  phone: '+974 5554 3456' },
]

// Node positions as % of container (x=left%, y=top%)
const NP = {
  pc:    { x: 7,  y: 26 },
  phone: { x: 7,  y: 74 },
  rtr:   { x: 50, y: 50 },
  s0:    { x: 90, y: 17 },
  s1:    { x: 90, y: 50 },
  s2:    { x: 90, y: 83 },
}

const LINES = [['pc','rtr'],['phone','rtr'],['rtr','s0'],['rtr','s1'],['rtr','s2']]

function getPacketState(step, devKey, siteKey, domain, ip, isAr) {
  if (step === 0) return { pos: NP[devKey],  visible: false, label: '', cls: '' }
  // DNS phase (violet)
  if (step === 1) return { pos: NP.rtr,      visible: true,  label: `🔍 DNS? ${domain}`,              cls: 'bg-violet-500 text-white' }
  if (step === 2) return { pos: NP.rtr,      visible: true,  label: `🔍 DNS? ${domain}`,              cls: 'bg-violet-500 text-white' }
  if (step === 3) return { pos: NP[devKey],  visible: true,  label: `✅ IP: ${ip}`,                   cls: 'bg-emerald-500 text-white' }
  // HTTP phase (cyan) — all traffic via router
  if (step === 4) return { pos: NP.rtr,      visible: true,  label: `📤 GET ${domain}`,               cls: 'bg-cyan-500 text-white' }
  if (step === 5) return { pos: NP[siteKey], visible: true,  label: `📤 GET ${domain}`,               cls: 'bg-cyan-600 text-white' }
  if (step === 6) return { pos: NP.rtr,      visible: true,  label: isAr ? '📄 الصفحة' : '📄 Page',  cls: 'bg-slate-600 text-white' }
  if (step === 7) return { pos: NP[devKey],  visible: true,  label: isAr ? '✅ تم التحميل' : '✅ Loaded', cls: 'bg-emerald-600 text-white' }
  return { pos: NP[devKey], visible: false, label: '', cls: '' }
}

const MAX_STEP = 7

export default function PageDNS() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [device, setDevice] = useState('pc')
  const [domain, setDomain] = useState('google.com')
  const [step, setStep]     = useState(0)
  const [busy, setBusy]     = useState(false)
  const [answer, setAnswer] = useState(null)
  const [callState, setCallState] = useState(null)

  // Advance call animation through steps 0→3
  useEffect(() => {
    if (callState === null) return
    if (callState.step >= 3) return
    const delays = [500, 700, 800, 800]
    const timer = setTimeout(() => {
      setCallState(prev => prev ? { ...prev, step: prev.step + 1 } : null)
    }, delays[callState.step])
    return () => clearTimeout(timer)
  }, [callState])

  const handleCall = (idx) => {
    setCallState({ contactIdx: idx, step: 0, phone: CONTACTS[idx].phone })
  }

  const getCallStepLabel = (cs) => {
    if (!cs) return null
    const phone = cs.phone
    if (cs.step === 0) return isAr ? '🔍 البحث عن الاسم في جهات الاتصال...' : '🔍 Searching contacts by name...'
    if (cs.step === 1) return isAr ? `📋 وجدنا الرقم: ${phone}` : `📋 Found number: ${phone}`
    if (cs.step === 2) return isAr ? `📞 جارٍ الاتصال بـ ${phone}...` : `📞 Dialing ${phone}...`
    if (cs.step === 3) return isAr ? '✅ متصل!' : '✅ Connected!'
    return null
  }

  const DNS_COMPARISON = [
    { phoneEmoji: '👤', phoneTextAr: 'اسم جهة الاتصال',    phoneTextEn: 'Contact Name',  netEmoji: '🔗', netTextAr: 'النطاق (google.com)',      netTextEn: 'Domain (google.com)' },
    { phoneEmoji: '📞', phoneTextAr: 'رقم الهاتف',          phoneTextEn: 'Phone Number',  netEmoji: '🖥️', netTextAr: 'عنوان IP (142.250.80.46)', netTextEn: 'IP (142.250.80.46)' },
    { phoneEmoji: '📋', phoneTextAr: 'تطبيق جهات الاتصال', phoneTextEn: 'Contacts App',  netEmoji: '🗄️', netTextAr: 'خادم DNS',                 netTextEn: 'DNS Server' },
    { phoneEmoji: '☎️', phoneTextAr: 'الاتصال بالرقم',      phoneTextEn: 'Dial by Number',netEmoji: '🔌', netTextAr: 'الاتصال بعنوان IP',       netTextEn: 'Connect by IP' },
  ]

  const rec     = DOMAIN_DATA[domain]
  const devKey  = device
  const siteKey = `s${rec.siteIdx}`

  const advance = () => {
    if (busy || step >= MAX_STEP) return
    setBusy(true)
    setStep(s => s + 1)
    setTimeout(() => setBusy(false), 1350)
  }

  const reset = () => { setStep(0); setBusy(false) }

  const pkt = getPacketState(step, devKey, siteKey, domain, rec.ip, isAr)

  const T = {
    ar: {
      badge: 'شبكات', title: 'ما هو DNS؟',
      concept: 'DNS هو "دليل هاتفي" الإنترنت — يُحوّل أسماء المواقع (مثل google.com) إلى عناوين IP يفهمها الحاسوب.',
      deviceLabel: 'اختر الجهاز:', domainLabel: 'اختر الموقع:',
      startBtn: 'ابدأ المحاكاة', nextBtn: 'الخطوة التالية ←', replayBtn: '↺ إعادة',
      steps: [
        'اختر جهازاً وموقعاً، ثم اضغط "ابدأ"',
        `[DNS] ${device === 'pc' ? 'الحاسوب' : 'الهاتف'} يسأل الراوتر: ما هو IP لـ "${domain}"؟`,
        '[DNS] الراوتر يبحث في جدول DNS...',
        `[DNS] الراوتر يُجيب: عنوان IP هو ${rec.ip}`,
        '[HTTP] الجهاز يُرسل الطلب إلى الراوتر',
        `[HTTP] الراوتر يُوجّه الطلب إلى ${domain}`,
        `[HTTP] ${domain} يُرسل الرد إلى الراوتر`,
        '[HTTP] الراوتر يُسلّم الصفحة لجهازك ✅',
      ],
      tableTitle: 'جدول DNS في الراوتر',
      pc: 'حاسوب', phone: 'هاتف', router: 'راوتر',
      routingNote: 'بعد الحصول على عنوان IP، لا يتواصل الجهاز مباشرةً مع الموقع، بل يتم إرسال الطلب عبر الراوتر الذي يقوم بتوجيهه إلى الوجهة الصحيحة.',
      nextLesson: '← درس DNS Spoofing',
      learnMore: 'في الدرس التالي، ستشاهد كيف يستغل المهاجم نظام DNS ليوجّهك إلى موقع مزيف.',
      challenge: 'ماذا يُرجع DNS؟',
      opts: ['اسم الموقع', 'عنوان IP', 'كلمة المرور', 'ملف الصفحة'],
      ans: 1, correct: '✅ صحيح! DNS يُرجع عنوان IP.', wrong: '❌ حاول مجدداً',
    },
    en: {
      badge: 'Networking', title: 'What is DNS?',
      concept: 'DNS is the internet\'s "phone book" — it converts website names (like google.com) into IP addresses that computers understand.',
      deviceLabel: 'Choose a device:', domainLabel: 'Choose a website:',
      startBtn: 'Start Simulation', nextBtn: 'Next Step →', replayBtn: '↺ Replay',
      steps: [
        'Choose a device and website, then click "Start"',
        `[DNS] ${device === 'pc' ? 'Computer' : 'Phone'} asks the router: what is the IP for "${domain}"?`,
        '[DNS] Router is searching the DNS table...',
        `[DNS] Router replies: IP address is ${rec.ip}`,
        '[HTTP] Device sends request to router',
        `[HTTP] Router forwards request to ${domain}`,
        `[HTTP] ${domain} sends response back to router`,
        '[HTTP] Router delivers the page to your device ✅',
      ],
      tableTitle: 'DNS Table in Router',
      pc: 'Computer', phone: 'Phone', router: 'Router',
      routingNote: 'After receiving the IP address, the device does not communicate directly with the website. Instead, the request is sent through the router, which forwards it to the correct destination.',
      nextLesson: 'DNS Spoofing lesson →',
      learnMore: 'In the next lesson, you\'ll see how an attacker exploits DNS to redirect you to a fake website.',
      challenge: 'What does DNS return?',
      opts: ['The website name', 'An IP address', 'A password', 'The web page file'],
      ans: 1, correct: '✅ Correct! DNS returns an IP address.', wrong: '❌ Try again',
    },
  }
  const t = T[lang]

  return (
    <div className="page-transition max-w-5xl mx-auto px-4 py-8" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="mb-5">
        <span className="bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{t.badge}</span>
        <h1 className="text-3xl font-black text-slate-800 mt-2 mb-1">{t.title}</h1>
      </div>

      {/* Phone Contacts Analogy */}
      <div className="bg-white rounded-2xl shadow border border-slate-100 p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📱</span>
          <h2 className="font-bold text-slate-800 text-base">
            {isAr ? 'مثال من الحياة اليومية' : 'Real-Life Analogy'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Phone contacts simulation */}
          <div>
            <p className="text-sm font-bold text-slate-700 mb-1">
              {isAr
                ? '📋 عندما تريد الاتصال بصديقك، تبحث باسمه لأن حفظ الأرقام صعب!'
                : '📋 When you call a friend, you search by name — memorizing numbers is hard!'}
            </p>
            <p className="text-xs text-slate-500 mb-2">
              {isAr ? 'اضغط "اتصال" لترى كيف يعمل هاتفك:' : 'Press "Call" to see how your phone works:'}
            </p>
            <div className="space-y-2">
              {CONTACTS.map((contact, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl px-3 py-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span>👤</span>
                    <span className="font-medium text-sm text-slate-700">
                      {isAr ? contact.nameAr : contact.nameEn}
                    </span>
                  </span>
                  <button
                    onClick={() => handleCall(idx)}
                    className="bg-green-500 text-white rounded-lg px-3 py-1 text-xs font-medium hover:bg-green-600 transition-colors"
                  >
                    📞 {isAr ? 'اتصال' : 'Call'}
                  </button>
                </div>
              ))}
            </div>
            {callState !== null && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-bold text-green-700 mb-1">
                  {isAr
                    ? `📱 الاتصال بـ ${CONTACTS[callState.contactIdx].nameAr}`
                    : `📱 Calling ${CONTACTS[callState.contactIdx].nameEn}`}
                </p>
                {[0, 1, 2, 3].map((stepIdx) => {
                  const label = getCallStepLabel({ ...callState, step: stepIdx })
                  const visible = callState.step >= stepIdx
                  return (
                    <p key={stepIdx}
                      className="text-xs text-green-800 transition-opacity duration-500"
                      style={{ opacity: visible ? 1 : 0 }}>
                      {label}
                    </p>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: DNS comparison table */}
          <div>
            <p className="text-sm font-bold text-slate-700 mb-2">🌐 {isAr ? 'الـ DNS يعمل بنفس الطريقة!' : 'DNS Works the Same Way!'}</p>
            <div className="space-y-0">
              {DNS_COMPARISON.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm py-2 border-b border-slate-100">
                  <span className="text-slate-600 flex-1 flex items-center gap-1.5">
                    <span>{row.phoneEmoji}</span>
                    <span className="text-xs">{isAr ? row.phoneTextAr : row.phoneTextEn}</span>
                  </span>
                  <span className="text-violet-500 font-bold flex-shrink-0">↔</span>
                  <span className="text-violet-700 font-semibold flex-1 flex items-center gap-1 justify-end text-right">
                    <span className="text-xs">{isAr ? row.netTextAr : row.netTextEn}</span>
                    <span>{row.netEmoji}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 mt-3 text-xs text-violet-800 text-center leading-relaxed">
              {isAr
                ? '💡 تماماً كما يبحث هاتفك بالاسم ويتصل بالرقم، يبحث المتصفح بالنطاق ويتصل بعنوان IP'
                : '💡 Just as your phone searches by name and dials by number, your browser searches by domain and connects by IP'}
            </div>
          </div>
        </div>
      </div>

      {/* Simulation card */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-5 mb-5">
        <div className="grid grid-cols-12 gap-5">

          {/* Network diagram: col 8 */}
          <div className="col-span-12 md:col-span-8">
            <div className="relative w-full h-64" dir="ltr">

              {/* SVG connection lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {LINES.map(([a, b], i) => {
                  const active =
                    (step === 1 || step === 2) && ((a === devKey && b === 'rtr') || (a === 'rtr' && b === devKey)) ||
                    (step === 3) && ((a === devKey && b === 'rtr') || (a === 'rtr' && b === devKey)) ||
                    (step === 4 || step === 5) && ((a === 'rtr' && b === siteKey) || (a === siteKey && b === 'rtr'))
                  return (
                    <line key={i}
                      x1={NP[a].x} y1={NP[a].y} x2={NP[b].x} y2={NP[b].y}
                      stroke={active ? '#8b5cf6' : '#cbd5e1'}
                      strokeWidth={active ? '1.2' : '0.7'}
                      strokeDasharray={active ? '3 2' : '2 2'}
                      opacity={active ? 1 : 0.6}
                    />
                  )
                })}
              </svg>

              {/* PC node */}
              <NodeEl
                pos={NP.pc} label={t.pc} emoji="💻"
                selected={device === 'pc'} active={devKey === 'pc' && step > 0}
                onClick={() => step === 0 && setDevice('pc')}
                clickable={step === 0}
                ring={devKey === 'pc' && step >= 3 && step <= 5 ? 'emerald' : devKey === 'pc' && step >= 1 ? 'violet' : null}
              />

              {/* Phone node */}
              <NodeEl
                pos={NP.phone} label={t.phone} emoji="📱"
                selected={device === 'phone'} active={devKey === 'phone' && step > 0}
                onClick={() => step === 0 && setDevice('phone')}
                clickable={step === 0}
                ring={devKey === 'phone' && step >= 3 && step <= 5 ? 'emerald' : devKey === 'phone' && step >= 1 ? 'violet' : null}
              />

              {/* Router node (larger) */}
              <div style={{ position:'absolute', left:`${NP.rtr.x}%`, top:`${NP.rtr.y}%`, transform:'translate(-50%,-50%)' }}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow border-2 transition-all duration-500
                  ${step === 2 ? 'bg-amber-100 border-amber-400 ring-4 ring-amber-200 scale-110' :
                    step === 1 ? 'bg-violet-100 border-violet-300 scale-105' :
                    step === 3 ? 'bg-emerald-100 border-emerald-300 scale-105' :
                    'bg-white border-slate-200'}`}>
                  🔁
                </div>
                <p className="text-xs font-bold text-slate-500 text-center mt-1">{t.router}</p>
              </div>

              {/* Website nodes */}
              {Object.entries(DOMAIN_DATA).map(([d, info], i) => {
                const key = `s${i}`
                const isChosen = domain === d
                return (
                  <div key={d} style={{ position:'absolute', left:`${NP[key].x}%`, top:`${NP[key].y}%`, transform:'translate(-50%,-50%)' }}>
                    <button
                      onClick={() => step === 0 && setDomain(d)}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-sm border-2 transition-all duration-300
                        ${isChosen ? 'bg-cyan-100 border-cyan-400 scale-110' : 'bg-white border-slate-200'}
                        ${step === 0 ? 'hover:border-cyan-300 cursor-pointer' : 'cursor-default'}
                        ${step === 5 && isChosen ? 'ring-2 ring-cyan-400 bg-cyan-100' : ''}
                        ${step === 6 && isChosen ? 'ring-2 ring-emerald-100 bg-emerald-100' : ''}`}>
                      {info.emoji}
                    </button>
                    <p className="text-center mt-0.5 text-slate-400 font-mono" style={{ fontSize:'9px' }}>{d}</p>
                  </div>
                )
              })}

              {/* Animated packet */}
              <div style={{
                position: 'absolute',
                left: `${pkt.pos.x}%`,
                top: `${pkt.pos.y}%`,
                transform: 'translate(-50%, -50%) translateY(-26px)',
                transition: 'left 1.2s cubic-bezier(0.4,0,0.2,1), top 1.2s cubic-bezier(0.4,0,0.2,1), opacity 0.3s',
                opacity: pkt.visible ? 1 : 0,
                zIndex: 30,
                pointerEvents: 'none',
              }}>
                <div className={`${pkt.cls} rounded-xl px-2.5 py-1 text-xs font-mono shadow-lg whitespace-nowrap`} dir="ltr">
                  {pkt.label}
                </div>
              </div>
            </div>

            {/* Step label */}
            <div className="mt-3 min-h-8 text-center" dir={isAr ? 'rtl' : 'ltr'}>
              <p className={`text-sm font-medium transition-all
                ${step === MAX_STEP ? 'text-emerald-700 font-bold' :
                  step === 2 ? 'text-amber-700 animate-pulse' : 'text-slate-600'}`}>
                {t.steps[step]}
              </p>
            </div>
          </div>

          {/* Right panel: col 4 */}
          <div className="col-span-12 md:col-span-4 space-y-3">

            {/* Device selector */}
            <div>
              <p className="text-xs font-bold text-slate-600 mb-1.5">{t.deviceLabel}</p>
              <div className="flex gap-2">
                {['pc', 'phone'].map(d => (
                  <button key={d} onClick={() => step === 0 && setDevice(d)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-sm border-2 transition-all
                      ${device === d ? 'bg-indigo-100 border-indigo-400 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}
                      ${step === 0 ? 'hover:border-indigo-300 cursor-pointer' : 'cursor-default opacity-70'}`}>
                    <span className="text-lg">{d === 'pc' ? '💻' : '📱'}</span>
                    <span className="text-xs font-bold">{t[d]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* DNS table — appears only when request reaches router (step 2+) */}
            {step >= 2 ? (
              <div className="bg-white border-2 border-amber-300 rounded-xl p-3" style={{ animation:'dns-tbl-in 0.3s ease' }}>
                <style>{`@keyframes dns-tbl-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm">🔁</span>
                  <p className="text-xs font-bold text-amber-700">{t.tableTitle}</p>
                  {step === 2 && <span className="text-xs bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 font-bold" style={{ fontSize:9 }}>🔍 {isAr ? 'يبحث...' : 'searching...'}</span>}
                </div>
                <div className="space-y-1.5">
                  {Object.entries(DOMAIN_DATA).map(([d, info]) => (
                    <div key={d}
                      className={`flex items-center gap-1 text-xs rounded-lg px-2 py-1.5 transition-all font-mono
                        ${step === 2 && domain === d ? 'bg-amber-100 ring-2 ring-amber-300' :
                          step >= 3 && domain === d ? 'bg-emerald-50 ring-1 ring-emerald-300' : 'bg-slate-50'}`}
                      dir="ltr">
                      <span className="mr-1">{info.emoji}</span>
                      <span className="text-slate-600 flex-1 truncate">{d}</span>
                      <span className="text-slate-300 mx-1">→</span>
                      <span className={`font-bold flex-shrink-0 ${step >= 3 && domain === d ? 'text-emerald-700' : 'text-violet-600'}`}>{info.ip}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Controls */}
            <div className="space-y-2">
              {step < MAX_STEP ? (
                <button onClick={advance} disabled={busy}
                  className="w-full bg-violet-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-violet-700 disabled:bg-violet-300 transition-colors shadow-sm">
                  {step === 0 ? t.startBtn : t.nextBtn}
                </button>
              ) : (
                <div className="w-full bg-emerald-100 text-emerald-700 text-center py-2.5 rounded-xl text-sm font-bold">
                  {t.steps[MAX_STEP]}
                </div>
              )}
              {step > 0 && (
                <button onClick={reset}
                  className="w-full bg-white border border-slate-200 text-slate-500 py-2 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  {t.replayBtn}
                </button>
              )}
            </div>

            {/* Phase + step dots */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5" dir="ltr">
                <span className="text-xs font-bold text-violet-600 w-12 flex-shrink-0">DNS</span>
                {[1,2,3].map(i => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-violet-500' : 'bg-slate-200'}`} />
                ))}
              </div>
              <div className="flex items-center gap-1.5" dir="ltr">
                <span className="text-xs font-bold text-cyan-600 w-12 flex-shrink-0">HTTP</span>
                {[4,5,6,7].map(i => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-cyan-500' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge */}
      <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 mb-5">
        <h3 className="font-bold text-violet-800 text-sm mb-3">🧩 {t.challenge}</h3>
        <div className="flex flex-wrap gap-2">
          {t.opts.map((opt, i) => (
            <button key={i} onClick={() => setAnswer(i)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all
                ${answer === null ? 'bg-white border-slate-200 text-slate-700 hover:border-violet-400'
                  : answer === t.ans
                    ? i === t.ans ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                      : 'bg-white border-slate-200 text-slate-400 opacity-50'
                    : i === answer ? 'bg-red-100 border-red-400 text-red-700'
                      : i === t.ans ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-400 opacity-50'}`}>
              {opt}
            </button>
          ))}
        </div>
        {answer !== null && (
          <p className={`mt-3 text-sm font-bold ${answer === t.ans ? 'text-emerald-700' : 'text-red-600'}`}>
            {answer === t.ans ? t.correct : t.wrong}
          </p>
        )}
      </div>

      {/* Next lesson teaser */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-amber-600 mb-0.5">الدرس التالي</p>
          <p className="text-sm text-amber-800 leading-relaxed">{t.learnMore}</p>
        </div>
        <button onClick={() => navigate('/dns-spoofing')}
          className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap">
          {t.nextLesson}
        </button>
      </div>

      {/* explanation — collapsed by default, sits under the practical part */}
      <Explanation>
        <p className="text-slate-600 text-sm leading-relaxed mb-4">{t.concept}</p>
        <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">🔁</span>
          <p className="text-cyan-800 text-sm leading-relaxed">{t.routingNote}</p>
        </div>
      </Explanation>

      <div className="flex items-center pt-6 mt-5 border-t border-slate-100">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-violet-600 text-sm font-medium transition-colors">
          <ChevronLeft className="w-4 h-4" />
          {isAr ? '← الرئيسية' : '← Home'}
        </button>
      </div>
    </div>
  )
}

function NodeEl({ pos, label, emoji, selected, active, onClick, clickable, ring }) {
  return (
    <div style={{ position:'absolute', left:`${pos.x}%`, top:`${pos.y}%`, transform:'translate(-50%,-50%)' }}>
      <button
        onClick={onClick}
        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-sm border-2 transition-all duration-300
          ${selected ? 'bg-indigo-100 border-indigo-400 scale-110' : 'bg-white border-slate-200'}
          ${clickable ? 'hover:border-indigo-300 cursor-pointer' : 'cursor-default'}
          ${ring === 'emerald' ? 'ring-2 ring-emerald-400' : ring === 'violet' ? 'ring-2 ring-violet-400' : ''}`}>
        {emoji}
      </button>
      <p className="text-xs font-bold text-slate-500 text-center mt-1">{label}</p>
    </div>
  )
}
