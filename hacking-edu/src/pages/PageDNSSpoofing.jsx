import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

const REAL_RECORDS = [
  { domain: 'instagram.com', ip: '157.240.3.35'    },
  { domain: 'google.com',    ip: '142.250.80.46'   },
  { domain: 'facebook.com',  ip: '31.13.64.35'     },
  { domain: 'twitter.com',   ip: '104.244.42.65'   },
  { domain: 'youtube.com',   ip: '142.250.185.78'  },
]
const FAKE_IP = '192.168.99.99'

// Node positions (% of diagram container)
const NP = {
  victim:   { x: 7,  y: 30 },
  router:   { x: 50, y: 50 },
  real:     { x: 90, y: 20 },
  fake:     { x: 90, y: 58 },
  attacker: { x: 90, y: 85 },
}

const MAX_STEP = 7

function getPkt(step, dnsIp, realIp, domain) {
  const isSpoofed = dnsIp !== realIp
  const siteDest = isSpoofed ? NP.fake : NP.real
  if (step === 0) return { pos: NP.victim, visible: false, label: '', cls: '' }
  if (step === 1) return { pos: NP.router, visible: true, label: `🔍 DNS? ${domain}`, cls: 'bg-violet-500 text-white' }
  if (step === 2) return { pos: NP.router, visible: true, label: `🔍 DNS? ${domain}`, cls: 'bg-violet-500 text-white' }
  if (step === 3) return { pos: NP.victim, visible: true,
    label: `${isSpoofed ? '⚠️' : '✅'} IP: ${dnsIp}`,
    cls: isSpoofed ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white' }
  if (step === 4) return { pos: NP.router, visible: true, label: `📤 GET ${domain}`, cls: isSpoofed ? 'bg-red-400 text-white' : 'bg-cyan-500 text-white' }
  if (step === 5) return { pos: siteDest,  visible: true, label: `📤 GET ${dnsIp}`,  cls: isSpoofed ? 'bg-red-500 text-white' : 'bg-cyan-600 text-white' }
  if (step === 6) return { pos: NP.router, visible: true,
    label: isSpoofed ? '🔑 بيانات الدخول' : '📄 الصفحة',
    cls: isSpoofed ? 'bg-red-600 text-white' : 'bg-slate-600 text-white' }
  if (step === 7) return { pos: NP.victim, visible: true,
    label: isSpoofed ? '❌ مسروقة!' : '✅ تم التحميل',
    cls: isSpoofed ? 'bg-red-700 text-white' : 'bg-emerald-600 text-white' }
  return { pos: NP.victim, visible: false, label: '', cls: '' }
}

export default function PageDNSSpoofing() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  // DNS records state — editing per-row
  const [records, setRecords] = useState(REAL_RECORDS.map(r => ({ ...r, editing: r.ip })))
  const [editErrors, setEditErrors] = useState({})

  // active domain for simulation (first spoofed, or first record)
  const spoofedRecord = records.find(r => r.ip !== REAL_RECORDS.find(rr => rr.domain === r.domain).ip)
  const activeRecord = spoofedRecord || records[0]
  const realIp = REAL_RECORDS.find(r => r.domain === activeRecord.domain).ip
  const isSpoofed = activeRecord.ip !== realIp

  const [step, setStep] = useState(0)
  const [busy, setBusy]  = useState(false)
  const [answer, setAnswer] = useState(null)

  const pkt = getPkt(step, activeRecord.ip, realIp, activeRecord.domain)

  const advance = () => {
    if (busy || step >= MAX_STEP) return
    setBusy(true)
    setStep(s => s + 1)
    setTimeout(() => setBusy(false), 1350)
  }
  const reset = () => { setStep(0); setBusy(false) }

  const applyRecord = (domain) => {
    const rec = records.find(r => r.domain === domain)
    const trimmed = rec.editing.trim()
    const ipRe = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRe.test(trimmed)) {
      setEditErrors(e => ({ ...e, [domain]: isAr ? 'تنسيق IP غير صحيح' : 'Invalid IP format' }))
      return
    }
    setEditErrors(e => { const n = { ...e }; delete n[domain]; return n })
    setRecords(prev => prev.map(r => r.domain === domain ? { ...r, ip: trimmed } : r))
    reset()
  }

  const restoreRecord = (domain) => {
    const real = REAL_RECORDS.find(r => r.domain === domain).ip
    setEditErrors(e => { const n = { ...e }; delete n[domain]; return n })
    setRecords(prev => prev.map(r => r.domain === domain ? { ...r, ip: real, editing: real } : r))
    reset()
  }

  const restoreAll = () => {
    setEditErrors({})
    setRecords(REAL_RECORDS.map(r => ({ ...r, editing: r.ip })))
    reset()
  }

  const T = {
    ar: {
      badge: 'أمن الشبكات', title: 'محاكاة DNS Spoofing',
      concept: 'DNS Spoofing يعني أن المهاجم يُعدّل جدول DNS في الراوتر ليُرجع عنوان IP مزيف — فيصل المستخدم إلى موقع مزيف بدلاً من الحقيقي.',
      tableTitle: 'جدول DNS في الراوتر (كل السجلات قابلة للتعديل)',
      tableHint: 'غيّر أي عنوان IP لترى كيف يعمل الهجوم',
      applyBtn: 'تطبيق', restoreBtn: 'استعادة',
      restoreAllBtn: 'استعادة الكل',
      attackerNote: `⚠️ المهاجم عدّل جدول DNS! الضحية ستُوجَّه إلى الموقع المزيف (${activeRecord.domain}).`,
      normalNote: '✅ جدول DNS يحتوي على العناوين الحقيقية.',
      startBtn: 'ابدأ المحاكاة', nextBtn: 'الخطوة التالية ←', replayBtn: '↺ إعادة',
      steps: [
        'اضغط "ابدأ" لمشاهدة رحلة الضحية',
        `[DNS] الضحية تسأل الراوتر: ما هو IP لـ "${activeRecord.domain}"؟`,
        '[DNS] الراوتر يبحث في جدول DNS...',
        `[DNS] الراوتر يُجيب: IP هو ${activeRecord.ip}${isSpoofed ? ' ⚠️ (مزيف!)' : ' ✅ (حقيقي)'}`,
        '[HTTP] الضحية تُرسل الطلب إلى الراوتر',
        isSpoofed ? `[HTTP] الراوتر يُوجّه الطلب إلى الموقع المزيف (${activeRecord.ip})` : `[HTTP] الراوتر يُوجّه الطلب إلى ${activeRecord.domain}`,
        isSpoofed ? '[HTTP] الموقع المزيف يُرسل رداً مزيفاً إلى الراوتر' : `[HTTP] ${activeRecord.domain} يُرسل الصفحة إلى الراوتر`,
        isSpoofed ? '❌ الراوتر يُسلّم رداً مزيفاً — بيانات الضحية مسروقة!' : '✅ الراوتر يُسلّم الصفحة الحقيقية للضحية.',
      ],
      routingNote: 'بعد الحصول على عنوان IP، لا يتصل الجهاز مباشرةً بالموقع — كل الطلبات تمر عبر الراوتر. في حال DNS Spoofing، يوجّه الراوتر الطلب إلى العنوان المزيف.',
      victim: 'الضحية', router: 'راوتر',
      realSite: 'الموقع الحقيقي', fakeSite: 'موقع مزيف', attacker: 'المهاجم',
      attackerControls: 'يتحكم به',
      challenge: 'ماذا يفعل المهاجم في DNS Spoofing؟',
      opts: ['يُعطّل الموقع', 'يُعدّل جدول DNS ليُوجّه للموقع المزيف', 'يسرق كلمة المرور مباشرة', 'يُرسل فيروساً'],
      ans: 1, correct: '✅ صحيح! المهاجم يُعدّل جدول DNS.', wrong: '❌ حاول مجدداً',
      prevLesson: 'درس DNS ←', learnMore: 'الآن اكتشف كيف يكتشف نظام SIEM هجمات DNS Spoofing.',
      nextLesson: '← درس SIEM',
    },
    en: {
      badge: 'Network Security', title: 'DNS Spoofing Simulation',
      concept: 'DNS Spoofing means an attacker modifies the router\'s DNS table to return a fake IP — sending the user to a fake website instead of the real one.',
      tableTitle: 'DNS Table in Router (all records editable)',
      tableHint: 'Change any IP address to see how the attack works',
      applyBtn: 'Apply', restoreBtn: 'Restore',
      restoreAllBtn: 'Restore All',
      attackerNote: `⚠️ Attacker modified the DNS table! Victim will be redirected to fake site (${activeRecord.domain}).`,
      normalNote: '✅ DNS table contains the real IP addresses.',
      startBtn: 'Start Simulation', nextBtn: 'Next Step →', replayBtn: '↺ Replay',
      steps: [
        'Click "Start" to follow the victim\'s journey',
        `[DNS] Victim asks the router: what is the IP for "${activeRecord.domain}"?`,
        '[DNS] Router is searching the DNS table...',
        `[DNS] Router replies: IP is ${activeRecord.ip}${isSpoofed ? ' ⚠️ (FAKE!)' : ' ✅ (real)'}`,
        '[HTTP] Victim sends request to the router',
        isSpoofed ? `[HTTP] Router forwards request to fake site (${activeRecord.ip})` : `[HTTP] Router forwards request to ${activeRecord.domain}`,
        isSpoofed ? '[HTTP] Fake site sends fake response back to router' : `[HTTP] ${activeRecord.domain} sends the page back to router`,
        isSpoofed ? '❌ Router delivers fake response — victim credentials stolen!' : '✅ Router delivers the real page to victim.',
      ],
      routingNote: 'After getting the IP address, the device never contacts the website directly — all requests go through the router. In DNS Spoofing, the router forwards the request to the fake IP.',
      victim: 'Victim', router: 'Router',
      realSite: 'Real Website', fakeSite: 'Fake Website', attacker: 'Attacker',
      attackerControls: 'controls it',
      challenge: 'What does the attacker do in DNS Spoofing?',
      opts: ['Disable the website', 'Modify DNS table to point to fake site', 'Steal password directly', 'Send a virus'],
      ans: 1, correct: '✅ Correct! The attacker modifies the DNS table.', wrong: '❌ Try again',
      prevLesson: 'DNS lesson ←', learnMore: 'Now discover how SIEM systems detect DNS Spoofing attacks.',
      nextLesson: 'SIEM lesson →',
    },
  }
  const t = T[lang]

  return (
    <div className="page-transition max-w-5xl mx-auto px-4 py-8" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="mb-5">
        <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{t.badge}</span>
        <h1 className="text-3xl font-black text-slate-800 mt-2 mb-1">{t.title}</h1>
      </div>

      {/* Simulation card */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-5 mb-5">
        <div className="grid grid-cols-12 gap-5">

          {/* Network diagram: col 8 */}
          <div className="col-span-12 md:col-span-8">
            <div className="relative w-full h-72" dir="ltr">

              {/* SVG lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {/* Victim — Router */}
                <line x1={NP.victim.x} y1={NP.victim.y} x2={NP.router.x} y2={NP.router.y}
                  stroke={(step >= 1 && step <= 3) ? '#8b5cf6' : '#cbd5e1'}
                  strokeWidth={(step >= 1 && step <= 3) ? '1.2' : '0.7'}
                  strokeDasharray="2 2" opacity="0.8" />
                {/* Router — Real site */}
                <line x1={NP.router.x} y1={NP.router.y} x2={NP.real.x} y2={NP.real.y}
                  stroke={(step >= 4 && !isSpoofed) ? '#10b981' : '#cbd5e1'}
                  strokeWidth={(step >= 4 && !isSpoofed) ? '1.2' : '0.7'}
                  strokeDasharray="2 2" opacity="0.8" />
                {/* Router — Fake site */}
                <line x1={NP.router.x} y1={NP.router.y} x2={NP.fake.x} y2={NP.fake.y}
                  stroke={(step >= 4 && isSpoofed) ? '#ef4444' : '#cbd5e1'}
                  strokeWidth={(step >= 4 && isSpoofed) ? '1.2' : '0.7'}
                  strokeDasharray="2 2" opacity="0.8" />
                {/* Attacker — Fake site (attacker controls fake site) */}
                <line x1={NP.fake.x} y1={NP.fake.y} x2={NP.attacker.x} y2={NP.attacker.y}
                  stroke={isSpoofed ? '#ef4444' : '#94a3b8'}
                  strokeWidth={isSpoofed ? '1.5' : '0.8'}
                  strokeDasharray={isSpoofed ? '1 1.5' : '2 3'} opacity="0.9" />
              </svg>

              {/* Victim PC */}
              <div style={{ position:'absolute', left:`${NP.victim.x}%`, top:`${NP.victim.y}%`, transform:'translate(-50%,-50%)' }}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border-2 transition-all duration-500
                  ${step === 5 && isSpoofed ? 'bg-red-100 border-red-400 ring-2 ring-red-300' :
                    step === 5 && !isSpoofed ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300' :
                    step >= 1 ? 'bg-violet-100 border-violet-300' : 'bg-white border-slate-200'}`}>
                  💻
                </div>
                <p className="text-xs font-bold text-slate-500 text-center mt-1">{t.victim}</p>
              </div>

              {/* Router */}
              <div style={{ position:'absolute', left:`${NP.router.x}%`, top:`${NP.router.y}%`, transform:'translate(-50%,-50%)' }}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow border-2 transition-all duration-500
                  ${step === 2 ? 'bg-amber-100 border-amber-400 ring-4 ring-amber-200 scale-110 animate-pulse' :
                    isSpoofed ? 'bg-red-50 border-red-300' :
                    step === 1 ? 'bg-violet-100 border-violet-300 scale-105' :
                    step === 3 ? (isSpoofed ? 'bg-red-100 border-red-300' : 'bg-emerald-100 border-emerald-300') :
                    'bg-white border-slate-200'}`}>
                  {isSpoofed && step === 0 ? '⚠️' : '🔁'}
                </div>
                <p className="text-xs font-bold text-slate-500 text-center mt-1">{t.router}</p>
              </div>

              {/* Real site */}
              <div style={{ position:'absolute', left:`${NP.real.x}%`, top:`${NP.real.y}%`, transform:'translate(-50%,-50%)' }}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border-2 transition-all duration-500
                  ${step === 5 && !isSpoofed ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300 scale-110' :
                    step === 4 && !isSpoofed ? 'bg-emerald-100 border-emerald-300 scale-105' :
                    'bg-white border-emerald-200'}`}>
                  📸
                </div>
                <p className="text-xs font-medium text-emerald-600 text-center mt-1">{t.realSite}</p>
                <p className="text-xs text-emerald-700 text-center font-mono font-bold" style={{ fontSize:'9px' }}>{activeRecord.domain}</p>
                <p className="text-xs text-slate-400 text-center font-mono" style={{ fontSize:'9px' }}>{realIp}</p>
              </div>

              {/* Fake site */}
              <div style={{ position:'absolute', left:`${NP.fake.x}%`, top:`${NP.fake.y}%`, transform:'translate(-50%,-50%)' }}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border-2 transition-all duration-500
                  ${step === 5 && isSpoofed ? 'bg-red-100 border-red-500 ring-2 ring-red-400 scale-110' :
                    step === 4 && isSpoofed ? 'bg-red-100 border-red-300 scale-105' :
                    isSpoofed ? 'bg-red-50 border-red-300' : 'bg-white border-red-200 opacity-50'}`}>
                  ☠️
                </div>
                <p className="text-xs font-medium text-red-500 text-center mt-1">{t.fakeSite}</p>
                <p className="text-xs text-slate-400 text-center font-mono" style={{ fontSize:'9px' }}>{FAKE_IP}</p>
              </div>

              {/* Attacker — behind/below fake site */}
              <div style={{ position:'absolute', left:`${NP.attacker.x}%`, top:`${NP.attacker.y}%`, transform:'translate(-50%,-50%)' }}>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shadow-sm border-2 transition-all duration-500
                  ${isSpoofed ? 'bg-red-100 border-red-400 ring-2 ring-red-200' : 'bg-slate-100 border-slate-300 opacity-60'}`}>
                  🕵️
                </div>
                <p className={`text-xs font-bold text-center mt-0.5 ${isSpoofed ? 'text-red-500' : 'text-slate-400'}`}>{t.attacker}</p>
                {isSpoofed && (
                  <p className="text-xs text-red-400 text-center" style={{ fontSize:'9px' }}>▲ {t.attackerControls}</p>
                )}
              </div>

              {/* DNS table popup — appears when request reaches router (step >= 2) */}
              {step >= 2 && (
                <div style={{
                  position:'absolute', left:'28%', top:'2%',
                  background:'white', border:'2px solid #f59e0b', borderRadius:10,
                  padding:'7px 10px', zIndex:25, minWidth:200,
                  boxShadow:'0 4px 16px rgba(0,0,0,0.18)',
                  animation:'dns-table-in 0.3s ease',
                }} dir="ltr">
                  <style>{`@keyframes dns-table-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
                  <div style={{ fontSize:10, fontWeight:800, color:'#92400e', marginBottom:5, display:'flex', alignItems:'center', gap:5 }}>
                    🔁 {isAr ? 'جدول DNS في الراوتر' : 'Router DNS Table'}
                    {step === 2 && <span style={{ background:'#fef3c7', color:'#92400e', borderRadius:5, padding:'1px 6px', fontSize:9, fontWeight:700, animation:'pulse 1s infinite' }}>
                      {isAr ? '🔍 يبحث...' : '🔍 Looking...'}
                    </span>}
                  </div>
                  {[
                    { emoji:'🔍', domain:'google.com',    ip:'142.250.80.46' },
                    { emoji:'🛒', domain:'orbyx.store',   ip:'192.168.1.20'  },
                    { emoji:'📸', domain:'instagram.com', ip:'157.240.3.35'  },
                  ].map(row => {
                    const isActive = activeRecord.domain === row.domain
                    return (
                      <div key={row.domain} style={{
                        display:'flex', alignItems:'center', gap:5, padding:'3px 4px',
                        borderRadius:6, fontSize:10, fontFamily:'monospace',
                        background: isActive ? (isSpoofed ? '#fee2e2' : '#dcfce7') : 'transparent',
                        border: isActive ? `1px solid ${isSpoofed ? '#fca5a5' : '#86efac'}` : '1px solid transparent',
                        marginBottom:2,
                      }}>
                        <span>{row.emoji}</span>
                        <span style={{ color:'#1e293b', fontWeight:700, flex:1 }}>{row.domain}</span>
                        <span style={{ color:'#64748b' }}>→</span>
                        <span style={{ color: isActive ? (isSpoofed ? '#dc2626' : '#15803d') : '#6366f1', fontWeight:700 }}>
                          {isActive ? activeRecord.ip : row.ip}
                          {isActive && isSpoofed && ' ⚠️'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

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
              <p className={`text-sm font-medium
                ${step === MAX_STEP && isSpoofed ? 'text-red-700 font-bold' :
                  step === MAX_STEP && !isSpoofed ? 'text-emerald-700 font-bold' :
                  step === 2 ? 'text-amber-700 animate-pulse' : 'text-slate-600'}`}>
                {t.steps[step]}
              </p>
            </div>
          </div>

          {/* Right panel: col 4 */}
          <div className="col-span-12 md:col-span-4 space-y-3">

            {/* Editable DNS table */}
            <div className={`rounded-xl border-2 p-3 transition-all ${isSpoofed ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'}`}>
              <p className="text-xs font-bold text-slate-600 mb-0.5">{t.tableTitle}</p>
              <p className="text-xs text-slate-400 mb-2">{t.tableHint}</p>

              <div className="space-y-1.5">
                {records.map(rec => {
                  const origIp = REAL_RECORDS.find(r => r.domain === rec.domain).ip
                  const isModified = rec.ip !== origIp
                  return (
                    <div key={rec.domain}
                      className={`rounded-lg border p-2 transition-all ${isModified ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'}`}
                      dir="ltr">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold font-mono ${isModified ? 'text-red-700' : 'text-slate-600'}`}>{rec.domain}</span>
                        {isModified && (
                          <button onClick={() => restoreRecord(rec.domain)}
                            className="text-xs text-slate-400 hover:text-emerald-600 transition-colors px-1">
                            ↩ {t.restoreBtn}
                          </button>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <input
                          value={rec.editing}
                          onChange={e => {
                            const v = e.target.value
                            setEditErrors(err => { const n = { ...err }; delete n[rec.domain]; return n })
                            setRecords(prev => prev.map(r => r.domain === rec.domain ? { ...r, editing: v } : r))
                          }}
                          onKeyDown={e => e.key === 'Enter' && applyRecord(rec.domain)}
                          className={`flex-1 text-xs font-mono px-2 py-1 rounded border outline-none transition-all
                            ${editErrors[rec.domain] ? 'border-red-400 bg-red-50 text-red-700' :
                              isModified ? 'border-red-300 bg-white text-red-700 font-bold' :
                              'border-slate-200 bg-white text-emerald-700 font-bold'}
                            focus:ring-2 focus:ring-violet-300`}
                        />
                        <button onClick={() => applyRecord(rec.domain)}
                          className="bg-violet-600 text-white text-xs px-2 py-1 rounded font-bold hover:bg-violet-700 transition-colors">
                          {t.applyBtn}
                        </button>
                      </div>
                      {editErrors[rec.domain] && <p className="text-red-500 text-xs mt-0.5">{editErrors[rec.domain]}</p>}
                    </div>
                  )
                })}
              </div>

              {isSpoofed && (
                <button onClick={restoreAll}
                  className="w-full mt-2 bg-slate-100 text-slate-600 text-xs py-1.5 rounded-lg font-medium hover:bg-slate-200 transition-colors">
                  ↩ {t.restoreAllBtn}
                </button>
              )}

              {/* Status indicator */}
              <div className={`mt-2 text-xs rounded-lg px-2 py-1.5 font-medium
                ${isSpoofed ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {isSpoofed ? t.attackerNote : t.normalNote}
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-2">
              {step < MAX_STEP ? (
                <button onClick={advance} disabled={busy}
                  className="w-full bg-red-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 disabled:bg-red-300 transition-colors shadow-sm">
                  {step === 0 ? t.startBtn : t.nextBtn}
                </button>
              ) : (
                <div className={`w-full text-center py-2.5 rounded-xl text-sm font-bold
                  ${isSpoofed ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
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

            {/* Phase progress bars */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5" dir="ltr">
                <span className="text-xs font-bold text-violet-600 w-12 flex-shrink-0">DNS</span>
                {[1,2,3].map(i => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-violet-500' : 'bg-slate-200'}`} />
                ))}
              </div>
              <div className="flex items-center gap-1.5" dir="ltr">
                <span className={`text-xs font-bold w-12 flex-shrink-0 ${isSpoofed ? 'text-red-500' : 'text-cyan-600'}`}>HTTP</span>
                {[4,5,6,7].map(i => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= step ? (isSpoofed ? 'bg-red-500' : 'bg-cyan-500') : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-5">
        <h3 className="font-bold text-red-800 text-sm mb-3">🧩 {t.challenge}</h3>
        <div className="space-y-2">
          {t.opts.map((opt, i) => (
            <button key={i} onClick={() => setAnswer(i)}
              className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-medium border transition-all
                ${answer === null ? 'bg-white border-slate-200 text-slate-700 hover:border-red-300'
                  : answer === t.ans
                    ? i === t.ans ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                      : 'bg-white border-slate-200 text-slate-400 opacity-50'
                    : i === answer ? 'bg-red-100 border-red-400 text-red-700'
                      : i === t.ans ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-400 opacity-50'}`}
              dir={isAr ? 'rtl' : 'ltr'}>
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
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-rose-600 mb-0.5">{isAr ? 'الدرس التالي' : 'Next Lesson'}</p>
          <p className="text-sm text-rose-800 leading-relaxed">{t.learnMore}</p>
        </div>
        <button onClick={() => navigate('/siem')}
          className="flex-shrink-0 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap">
          {t.nextLesson}
        </button>
      </div>

      <Explanation>
        <p className="text-slate-600 text-sm leading-relaxed mb-4">{t.concept}</p>
        <div className={`border rounded-2xl p-4 flex items-start gap-3 ${isSpoofed ? 'bg-red-50 border-red-200' : 'bg-cyan-50 border-cyan-200'}`}>
          <span className="text-xl flex-shrink-0">🔁</span>
          <p className={`text-sm leading-relaxed ${isSpoofed ? 'text-red-800' : 'text-cyan-800'}`}>{t.routingNote}</p>
        </div>
      </Explanation>

      <div className="flex items-center justify-between pt-6 border-t border-slate-100">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-red-600 text-sm font-medium transition-colors">
          <ChevronLeft className="w-4 h-4" />
          {isAr ? '← الرئيسية' : '← Home'}
        </button>
        <button onClick={() => navigate('/dns')} className="text-sm text-slate-400 hover:text-violet-600 transition-colors">
          {t.prevLesson}
        </button>
      </div>
    </div>
  )
}
