import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft, Eye, Plus, X } from 'lucide-react'
import Explanation from '../components/Explanation'

const DEFAULT_WEBSITE = 'orbyx.store'
const VPN_IP = '185.220.101.45'
const EXAMPLE_SITES = ['youtube.com', 'google.com', 'wikipedia.org', 'github.com']

const NP_DIRECT = {
  device:  { x: 7,  y: 50 },
  isp:     { x: 46, y: 50 },
  website: { x: 88, y: 50 },
}
const NP_VPN = {
  device:  { x: 7,  y: 50 },
  isp:     { x: 33, y: 50 },
  vpn:     { x: 65, y: 20 },
  website: { x: 90, y: 50 },
}

function getPkt(step, mode, NP, website, blocked) {
  if (step === 0) return { pos: NP.device, visible: false, label: '', cls: '' }
  if (mode === 'direct') {
    if (step === 1) return { pos: NP.isp,     visible: true, label: `🌐 https://${website}`,           cls: 'bg-cyan-600 text-white' }
    if (step === 2) return { pos: NP.isp,     visible: true,
      label: blocked ? '🔍 موجود في قائمة الحجب' : '✅ غير موجود في القائمة',
      cls: blocked ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white' }
    if (step === 3) return blocked
      ? { pos: NP.isp,     visible: true, label: '🚫 محجوب!',             cls: 'bg-red-600 text-white' }
      : { pos: NP.website, visible: true, label: `✅ https://${website}`,  cls: 'bg-emerald-600 text-white' }
  }
  if (mode === 'vpn') {
    if (step === 1) return { pos: NP.isp,     visible: true, label: `🔒 خادم VPN`,                                  cls: 'bg-indigo-600 text-white' }
    if (step === 2) return { pos: NP.vpn,     visible: true, label: '📡 شخص ما يتصل بك',                              cls: 'bg-amber-500 text-white'  }
    if (step === 3) return { pos: NP.website, visible: true, label: `هناك مستخدم طلب الدخول الى ${website}`,          cls: 'bg-emerald-600 text-white'}
    if (step === 4) return { pos: NP.vpn,     visible: true, label: '📩 رد من الموقع',         cls: 'bg-green-500 text-white'  }
    if (step === 5) return { pos: NP.isp,     visible: true, label: '📩 مُمرَّر عبر VPN',      cls: 'bg-green-600 text-white'  }
    if (step === 6) return { pos: NP.device,  visible: true, label: '✅ وصل الرد!',            cls: 'bg-green-700 text-white'  }
  }
  return { pos: NP.device, visible: false, label: '', cls: '' }
}

const MAX_STEP = { direct: 3, vpn: 6 }

export default function PageVPN() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [mode, setMode] = useState('direct')
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState(null)

  // Block list feature
  const [blockList, setBlockList] = useState(['orbyx.store', 'twitter.com', 'tiktok.com', 'snapchat.com'])
  const [addSiteInput, setAddSiteInput] = useState('')
  const [visitInput, setVisitInput] = useState('')
  const [activeVisit, setActiveVisit] = useState(DEFAULT_WEBSITE)
  const [targetBlocked, setTargetBlocked] = useState(false)

  // VPN popup
  const [showVpnPopup, setShowVpnPopup] = useState(false)

  const isDirect = mode === 'direct'
  const isVpn    = mode === 'vpn'
  const NP       = isDirect ? NP_DIRECT : NP_VPN
  const maxStep  = MAX_STEP[mode]
  const pkt      = getPkt(step, mode, NP, isVpn ? DEFAULT_WEBSITE : activeVisit, targetBlocked)

  const isBlocked      = isDirect && step === 3 && targetBlocked
  const passedThrough  = isDirect && step === 3 && !targetBlocked
  const requestArrived = isVpn && step >= 3
  const isResponsePhase = isVpn && step >= 4
  const responseArrived = isVpn && step >= 6

  useEffect(() => {
    if (isVpn && step === 2) setShowVpnPopup(true)
  }, [step, isVpn])

  const advance = () => {
    if (busy || step >= maxStep || showVpnPopup) return
    if (step === 0 && isDirect) {
      const target = visitInput.trim() || DEFAULT_WEBSITE
      const blocked = blockList.some(s => s.toLowerCase() === target.toLowerCase())
      setActiveVisit(target)
      setTargetBlocked(blocked)
    }
    setBusy(true)
    setStep(s => s + 1)
    setTimeout(() => setBusy(false), 1350)
  }

  const reset = () => { setStep(0); setBusy(false); setShowVpnPopup(false) }
  const switchMode = m => { setMode(m); setStep(0); setBusy(false); setShowVpnPopup(false); setActiveVisit(DEFAULT_WEBSITE) }

  const addSite = () => {
    const s = addSiteInput.trim().toLowerCase()
    if (s && !blockList.includes(s)) setBlockList(p => [...p, s])
    setAddSiteInput('')
  }
  const removeSite = s => setBlockList(p => p.filter(x => x !== s))

  // Two decorative sites for the diagram (exclude activeVisit)
  const otherDiagramSites = EXAMPLE_SITES.filter(s => s !== activeVisit.toLowerCase()).slice(0, 2)

  // ISP panel data
  const ispData = (() => {
    if (step === 0) return null
    if (isDirect) return {
      destLabel: isAr ? 'الوجهة' : 'Destination',
      dest: `https://${activeVisit}`,
      verdictText: targetBlocked
        ? (isAr ? '🚫 محجوب — الموقع ممنوع' : '🚫 BLOCKED — site not allowed')
        : (isAr ? '✅ مسموح — الموقع غير محجوب' : '✅ ALLOWED — site not blocked'),
      cls: targetBlocked
        ? 'bg-red-100 text-red-700 border-red-300'
        : 'bg-emerald-100 text-emerald-700 border-emerald-300',
    }
    if (isVpn && step >= 1) return {
      destLabel: isAr
        ? (isResponsePhase ? 'مصدر الرد (VPN)' : 'الوجهة المرئية')
        : (isResponsePhase ? 'Response Source (VPN)' : 'Visible Destination'),
      dest: VPN_IP,
      hiddenLabel: isAr ? 'الهدف الحقيقي' : 'Real Destination',
      hidden: isAr ? `🔒 مخفي (https://${DEFAULT_WEBSITE})` : `🔒 Hidden (https://${DEFAULT_WEBSITE})`,
      verdictText: isAr ? '✅ مسموح — VPN مسجّل' : '✅ ALLOWED — VPN registered',
      cls: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    }
    return null
  })()

  // Step descriptions
  const STEPS_DIRECT_AR = [
    'اكتب الموقع الذي تريد زيارته، ثم اضغط "ابدأ"',
    `[↗ طلب] الجهاز يُرسل مباشرةً — Ooredoo يرى الوجهة: https://${activeVisit}`,
    `[🔍] Ooredoo يفحص الطلب — يُطابق قائمة الحجب — الموقع ${targetBlocked ? 'موجود في القائمة' : 'غير موجود في القائمة'}`,
    targetBlocked
      ? '🚫 Ooredoo رفض الطلب. لا رد يصل للجهاز.'
      : `✅ Ooredoo مرّر الطلب! وصل إلى https://${activeVisit}`,
  ]
  const STEPS_VPN_AR = [
    'اضغط "ابدأ" لمشاهدة رحلة الطلب والرد ذهاباً وإياباً مع VPN',
    `[↗ طلب] الجهاز يُرسل رسالة مشفَّرة إلى Ooredoo — يطلب منه تمريرها إلى خادم VPN`,
    `[↗ طلب] Ooredoo يُمرّر الرسالة إلى VPN — الرسالة: "هناك مستخدم طلب الدخول الى ${DEFAULT_WEBSITE}"`,
    `[↗ طلب] ✅ وصل الطلب إلى https://${DEFAULT_WEBSITE} — الموقع يُجهّز الرد`,
    `[↙ رد] الموقع يُرسل الرد إلى خادم VPN`,
    `[↙ رد] خادم VPN يُشفّر الرد ويُرسله عبر Ooredoo إلى الجهاز`,
    `✅ [↙ رد] الرد وصل إلى جهازك! الرحلة ذهاباً وإياباً اكتملت بنجاح`,
  ]
  const STEPS_DIRECT_EN = [
    `Type the website you want to visit, then click "Start"`,
    `[↗ Request] Device sends directly — Ooredoo sees destination: https://${activeVisit}`,
    `[🔍] Ooredoo inspects — website ${targetBlocked ? 'matches block list' : 'not in block list'}`,
    targetBlocked
      ? '🚫 Ooredoo rejected the request. No response returns to device.'
      : `✅ Ooredoo forwarded the request! Reached https://${activeVisit}`,
  ]
  const STEPS_VPN_EN = [
    `Click "Start" to watch the full request & response round-trip with VPN`,
    `[↗ Request] Device sends encrypted message to Ooredoo — forward to VPN server`,
    `[↗ Request] Ooredoo forwards to VPN — message: "A user wants access to ${DEFAULT_WEBSITE}"`,
    `[↗ Request] ✅ Request reached https://${DEFAULT_WEBSITE} — Website prepares response`,
    `[↙ Response] Website sends response to VPN server`,
    `[↙ Response] VPN encrypts response and sends through Ooredoo to device`,
    `✅ [↙ Response] Response arrived at your device! Round-trip journey complete`,
  ]

  const steps = isAr
    ? (isDirect ? STEPS_DIRECT_AR : STEPS_VPN_AR)
    : (isDirect ? STEPS_DIRECT_EN : STEPS_VPN_EN)

  const T = {
    ar: {
      badge: 'أمن الشبكات', title: 'كيف يعمل VPN؟',
      subtitle: `VPN يُغيّر المسار المرئي لاتصالك — يرى ISP خادم VPN بدلاً من وجهتك الحقيقية، في الذهاب والإياب معاً.`,
      safeNote: 'محاكاة تعليمية آمنة — لا يتم الاتصال بأي خادم حقيقي',
      scenario1: 'بدون VPN', scenario2: 'مع VPN 🔒',
      startBtn: 'ابدأ المحاكاة', nextBtn: 'الخطوة التالية ←', replayBtn: '↺ إعادة',
      device: 'جهازك', vpnServer: 'خادم VPN', isp: 'Ooredoo',
      ispLabel: 'ماذا يرى Ooredoo؟', encLabel: '🔒 مشفَّر',
      reqPhase: '↗ إرسال الطلب', resPhase: '↙ استقبال الرد',
      blockListTitle: '🚫 المواقع المحجوبة',
      blockListHint: 'اكتب الموقع المراد حجبه',
      addBtn: 'أضف',
      visitLabel: '🌐 الموقع الذي تريد زيارته',
      visitPlaceholder: 'مثال: orbyx.store',
      vpnPopupTitle: '⚠️ VPN تلقّى اتصالاً!',
      vpnPopupBody: (site) => `شخص ما يريد الوصول إلى ${site} — هل تريد تمرير الطلب؟`,
      vpnPopupFrom: 'من:', vpnPopupDest: 'الوجهة:', vpnPopupEnc: 'مشفَّر:',
      vpnPopupBtn: '✅ أرسل الطلب إلى الموقع',
      flowTitle: '📡 كيف يسير الاتصال؟',
      flowExplain: `عند إرسال الطلب، يمر من الجهاز إلى Ooredoo، ثم إلى خادم الـ VPN (في حال استخدامه)، ثم إلى الموقع. وعند الرد، يعود بنفس المسار بالعكس حتى يصل إلى الجهاز.`,
      flowDirect: `بدون VPN: الجهاز ← Ooredoo (حجب) ✗`,
      flowVpnReq: `مع VPN: الجهاز ← Ooredoo ← VPN ← الموقع`,
      flowVpnRes: `الرد: الموقع ← Ooredoo ← VPN ← الجهاز`,
      limitTitle: '⚠️ حدود VPN — مهم جداً',
      limitNote: 'استخدام VPN لا يعني إخفاء الهوية بالكامل، وإنما يغيّر طريقة ظهور الاتصال فقط.',
      limitPoints: [
        'خادم VPN نفسه يعرف هويتك وعنوانك الحقيقي',
        'مزود VPN يمكنه تسجيل نشاطك وتسليمه للجهات القانونية',
        'الحسابات المسجّلة (Google، Twitter...) تكشف هويتك بصرف النظر عن VPN',
        'VPN لا يحميك من التتبع عبر ملفات تعريف الارتباط (Cookies) أو بصمة المتصفح',
      ],
      qTitle: '🧩 ما هو المسار الذي سيسلكه رد الموقع حتى يصل إليك؟',
      qOpts: [
        'الموقع ← جهازك مباشرة',
        'الموقع ← VPN ← Ooredoo ← جهازك',
        'الموقع ← Ooredoo ← جهازك (بدون VPN)',
        'الموقع ← DNS ← جهازك',
      ],
      qAns: 1,
      qCorrect: '✅ صحيح! الرد يعود عبر نفس المسار بالعكس: الموقع → VPN → Ooredoo → جهازك.',
      qWrong: '❌ حاول مجدداً — انظر إلى محاكاة الرد في الخطوات 4-6.',
      nextLabel: 'الدرس التالي',
      nextText: 'تعلّم كيف يعمل إخفاء IP وتدوير العناوين، ولماذا لا يضمن الإخفاء التام.',
      nextBtn2: '← درس إخفاء IP',
    },
    en: {
      badge: 'Network Security', title: 'How Does VPN Work?',
      subtitle: `A VPN changes the visible path of your connection — Ooredoo sees the VPN server instead of your actual destination, in both directions.`,
      safeNote: 'Safe educational simulation — no real servers contacted',
      scenario1: 'Without VPN', scenario2: 'With VPN 🔒',
      startBtn: 'Start Simulation', nextBtn: 'Next Step →', replayBtn: '↺ Replay',
      device: 'Your Device', vpnServer: 'VPN Server', isp: 'Ooredoo',
      ispLabel: 'What does Ooredoo see?', encLabel: '🔒 Encrypted',
      reqPhase: '↗ Sending Request', resPhase: '↙ Receiving Response',
      blockListTitle: '🚫 Blocked Websites',
      blockListHint: 'Enter a website to block',
      addBtn: 'Add',
      visitLabel: '🌐 Website you want to visit',
      visitPlaceholder: 'e.g. orbyx.store',
      vpnPopupTitle: '⚠️ VPN Received a Connection!',
      vpnPopupBody: (site) => `Someone wants to access ${site} — forward the request?`,
      vpnPopupFrom: 'From:', vpnPopupDest: 'Destination:', vpnPopupEnc: 'Encrypted:',
      vpnPopupBtn: '✅ Forward to Website',
      flowTitle: '📡 How does the connection work?',
      flowExplain: `When sending a request, it travels from the device to Ooredoo, then to the VPN server (if used), then to the website. On the way back, the response follows the exact same path in reverse until it reaches the device.`,
      flowDirect: `Without VPN: Device → Ooredoo (blocked) ✗`,
      flowVpnReq: `With VPN: Device → Ooredoo → VPN → Website`,
      flowVpnRes: `Response: Website → VPN → Ooredoo → Device`,
      limitTitle: '⚠️ VPN Limits — Very Important',
      limitNote: 'Using a VPN does not mean full anonymity — it only changes how your connection appears.',
      limitPoints: [
        'The VPN server itself knows your real identity and IP address',
        'VPN providers can log your activity and share with law enforcement',
        'Logged-in accounts (Google, Twitter...) reveal your identity regardless of VPN',
        'VPN does not protect from tracking via cookies or browser fingerprinting',
      ],
      qTitle: '🧩 What is the path that the website reply will take to reach you?',
      qOpts: [
        'Website → Your device directly',
        'Website → VPN → Ooredoo → Your device',
        'Website → Ooredoo → Your device (no VPN)',
        'Website → DNS → Your device',
      ],
      qAns: 1,
      qCorrect: '✅ Correct! The response travels back in reverse: Website → VPN → Ooredoo → Your device.',
      qWrong: '❌ Try again — watch the response animation in steps 4-6.',
      nextLabel: 'Next Lesson',
      nextText: 'Learn how IP masking and rotation work, and why they don\'t guarantee full anonymity.',
      nextBtn2: 'IP Masking Lesson →',
    },
  }
  const t = T[lang]

  // SVG line colors — direct mode
  const lineColorDirectDevIsp = step >= 1 ? (targetBlocked ? '#ef4444' : '#6366f1') : '#cbd5e1'
  const lineColorDirectIspWeb = passedThrough ? '#16a34a' : '#cbd5e1'

  // SVG line colors — VPN mode
  const lineColorVpnDevIsp = step >= 5 ? '#16a34a' : step >= 1 ? '#6366f1' : '#cbd5e1'
  const lineColorVpnIspVpn  = (step >= 4 && step <= 5) ? '#16a34a' : step >= 2 ? '#6366f1' : '#cbd5e1'
  const lineColorVpnVpnWeb  = step >= 4 ? '#16a34a' : step >= 3 ? '#10b981' : '#cbd5e1'

  return (
    <div className="page-transition max-w-5xl mx-auto px-4 py-8" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="mb-5">
        <span className="inline-block bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-bold mb-2">{t.badge}</span>
        <h1 className="text-3xl font-black text-slate-800 mb-1">{t.title}</h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-5 flex items-center gap-3">
        <span className="text-lg flex-shrink-0">⚠️</span>
        <span className="text-amber-700 text-xs font-medium">{t.safeNote}</span>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => switchMode('direct')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${isDirect ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
          {t.scenario1}
        </button>
        <button onClick={() => switchMode('vpn')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${isVpn ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
          {t.scenario2}
        </button>
      </div>

      {/* Block list + visit input (direct mode only) */}
      {isDirect && (
        <div className="bg-white border-2 border-red-200 rounded-2xl p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Block list */}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-2">{t.blockListTitle}</p>
              <div className="space-y-1 mb-2 max-h-36 overflow-y-auto">
                {blockList.map(site => (
                  <div key={site} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-1.5" dir="ltr">
                    <span className="text-xs font-mono text-red-700">{site}</span>
                    <button onClick={() => removeSite(site)} className="text-red-400 hover:text-red-600 transition-colors ml-2">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2" dir="ltr">
                <input
                  value={addSiteInput}
                  onChange={e => setAddSiteInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSite()}
                  placeholder={t.blockListHint}
                  className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-red-400"
                  dir="ltr"
                />
                <button onClick={addSite}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" />{t.addBtn}
                </button>
              </div>
            </div>

            {/* Visit input */}
            <div className="flex flex-col justify-center">
              <p className="text-sm font-bold text-slate-700 mb-2">{t.visitLabel}</p>
              <input
                value={visitInput}
                onChange={e => setVisitInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && step === 0 && advance()}
                placeholder={t.visitPlaceholder}
                disabled={step > 0}
                className="border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-400 transition-colors"
                dir="ltr"
              />
              {step === 0 && (
                <p className="text-xs text-slate-400 mt-1.5">
                  {isAr ? 'اتركه فارغاً لاستخدام orbyx.store' : 'Leave empty to use orbyx.store'}
                </p>
              )}
              {step > 0 && (
                <div className={`mt-2 text-xs font-bold px-3 py-1.5 rounded-lg border ${targetBlocked ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`} dir="ltr">
                  {targetBlocked
                    ? `🚫 ${activeVisit} — ${isAr ? 'محجوب' : 'Blocked'}`
                    : `✅ ${activeVisit} — ${isAr ? 'مسموح' : 'Allowed'}`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simulation card */}
      <div className={`border-2 rounded-2xl p-5 mb-5 transition-all ${isDirect ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-200'}`}>
        <div className="grid grid-cols-12 gap-5">

          {/* ── Diagram ── */}
          <div className="col-span-12 md:col-span-8">
            <div className="relative w-full h-72 bg-white rounded-xl border border-slate-200 shadow-inner overflow-hidden" dir="ltr">

              {/* SVG connection lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {isDirect && <>
                  <line x1={NP_DIRECT.device.x} y1={NP_DIRECT.device.y} x2={NP_DIRECT.isp.x} y2={NP_DIRECT.isp.y}
                    stroke={lineColorDirectDevIsp} strokeWidth={step >= 1 ? '1.5' : '0.7'} strokeDasharray="2 2" />
                  {/* Lines to all 3 websites */}
                  <line x1={NP_DIRECT.isp.x} y1={NP_DIRECT.isp.y} x2={88} y2={22}
                    stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
                  <line x1={NP_DIRECT.isp.x} y1={NP_DIRECT.isp.y} x2={NP_DIRECT.website.x} y2={NP_DIRECT.website.y}
                    stroke={lineColorDirectIspWeb} strokeWidth={passedThrough ? '1.5' : '0.7'} strokeDasharray="2 2" />
                  <line x1={NP_DIRECT.isp.x} y1={NP_DIRECT.isp.y} x2={88} y2={78}
                    stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
                </>}
                {isVpn && <>
                  <line x1={NP_VPN.device.x} y1={NP_VPN.device.y} x2={NP_VPN.isp.x} y2={NP_VPN.isp.y}
                    stroke={lineColorVpnDevIsp} strokeWidth={step >= 1 ? '1.5' : '0.7'} strokeDasharray="2 2" />
                  <line x1={NP_VPN.isp.x} y1={NP_VPN.isp.y} x2={NP_VPN.vpn.x} y2={NP_VPN.vpn.y}
                    stroke={lineColorVpnIspVpn} strokeWidth={step >= 2 ? '1.5' : '0.7'} strokeDasharray="2 2" />
                  <line x1={NP_VPN.vpn.x} y1={NP_VPN.vpn.y} x2={NP_VPN.website.x} y2={NP_VPN.website.y}
                    stroke={lineColorVpnVpnWeb} strokeWidth={step >= 3 ? '1.5' : '0.7'} strokeDasharray="2 2" />
                </>}
              </svg>

              {/* Device */}
              <div style={{ position: 'absolute', left: `${NP.device.x}%`, top: `${NP.device.y}%`, transform: 'translate(-50%,-50%)' }}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border-2 transition-all duration-500
                  ${responseArrived ? 'bg-green-100 border-green-400 ring-4 ring-green-200 scale-110' :
                    passedThrough ? 'bg-emerald-100 border-emerald-400 ring-4 ring-emerald-200 scale-110' :
                    step > 0 ? (isDirect ? 'bg-red-100 border-red-300' : 'bg-indigo-100 border-indigo-300') : 'bg-white border-slate-200'}`}>
                  {responseArrived || passedThrough ? '🎉' : '💻'}
                </div>
                <p className="text-xs font-bold text-slate-600 text-center mt-1">{t.device}</p>
              </div>

              {/* ISP */}
              <div style={{ position: 'absolute', left: `${NP.isp.x}%`, top: `${NP.isp.y}%`, transform: 'translate(-50%,-50%)' }}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow border-2 transition-all duration-500
                  ${step === 2 && isDirect && targetBlocked ? 'bg-amber-100 border-amber-400 ring-4 ring-amber-200 scale-110 animate-pulse' :
                    isBlocked ? 'bg-red-100 border-red-500 ring-4 ring-red-200' :
                    (step === 5 || step === 6) && isVpn ? 'bg-green-50 border-green-300' :
                    step >= 1 && isVpn ? 'bg-emerald-50 border-emerald-300' :
                    step >= 1 && isDirect ? 'bg-red-50 border-red-300' :
                    'bg-white border-slate-200'}`}>
                  {isBlocked ? '🚫' : step === 2 && isDirect ? '🔍' : '🏢'}
                </div>
                <p className="text-xs font-bold text-slate-600 text-center mt-1">{t.isp}</p>
              </div>

              {/* VPN server (VPN mode only) */}
              {isVpn && (
                <div style={{ position: 'absolute', left: `${NP_VPN.vpn.x}%`, top: `${NP_VPN.vpn.y}%`, transform: 'translate(-50%,-50%)' }}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border-2 transition-all duration-500
                    ${step >= 4 ? 'bg-green-100 border-green-400 ring-2 ring-green-200' :
                      step >= 2 ? 'bg-indigo-100 border-indigo-400 ring-2 ring-indigo-200' :
                      'bg-white border-indigo-200'}`}>
                    🔒
                  </div>
                  <p className="text-xs font-bold text-indigo-600 text-center mt-1">{t.vpnServer}</p>
                  <p className="text-xs text-indigo-400 text-center font-mono" style={{ fontSize: '9px' }}>{VPN_IP}</p>
                </div>
              )}

              {/* Target website (middle, always shown) */}
              <div style={{ position: 'absolute', left: `${NP.website.x}%`, top: `${NP.website.y}%`, transform: 'translate(-50%,-50%)' }}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border-2 transition-all duration-500
                  ${(requestArrived && !isResponsePhase) || passedThrough ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300 scale-110' :
                    isResponsePhase ? 'bg-green-50 border-green-300' :
                    isBlocked ? 'opacity-20 bg-white border-slate-200' : 'bg-white border-slate-200 opacity-60'}`}>
                  🌐
                </div>
                <p className={`text-center mt-1 font-bold font-mono ${(requestArrived || passedThrough) ? 'text-emerald-600' : isBlocked ? 'text-slate-200' : 'text-slate-400'}`}
                  style={{ fontSize: '8px' }}>
                  {isDirect ? activeVisit : DEFAULT_WEBSITE}
                </p>
              </div>

              {/* Decorative website nodes (direct mode only) */}
              {isDirect && (
                <>
                  <div style={{ position: 'absolute', left: '88%', top: '22%', transform: 'translate(-50%,-50%)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base bg-white border border-slate-200 opacity-35">🌐</div>
                    <p className="text-center text-slate-300 mt-0.5 font-mono" style={{ fontSize: '7px' }}>{otherDiagramSites[0]}</p>
                  </div>
                  <div style={{ position: 'absolute', left: '88%', top: '78%', transform: 'translate(-50%,-50%)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base bg-white border border-slate-200 opacity-35">🌐</div>
                    <p className="text-center text-slate-300 mt-0.5 font-mono" style={{ fontSize: '7px' }}>{otherDiagramSites[1]}</p>
                  </div>
                </>
              )}

              {/* Animated packet */}
              <div style={{
                position: 'absolute',
                left: `${pkt.pos.x}%`, top: `${pkt.pos.y}%`,
                transform: 'translate(-50%,-50%) translateY(-30px)',
                transition: 'left 1.2s cubic-bezier(0.4,0,0.2,1), top 1.2s cubic-bezier(0.4,0,0.2,1), opacity 0.3s',
                opacity: pkt.visible ? 1 : 0, zIndex: 30, pointerEvents: 'none',
              }}>
                <div className={`${pkt.cls} rounded-xl px-2.5 py-1 text-xs font-mono shadow-lg whitespace-nowrap`} dir="ltr">
                  {pkt.label}
                </div>
              </div>

              {/* Block overlay */}
              {isBlocked && (
                <div className="absolute inset-0 bg-red-50/50 flex items-end justify-center pb-4 pointer-events-none">
                  <div className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg animate-bounce">
                    {isAr ? '🚫 اتصال مرفوض — لا رد' : '🚫 Connection Refused — no response'}
                  </div>
                </div>
              )}

              {/* Pass-through success overlay */}
              {passedThrough && (
                <div className="absolute inset-0 bg-emerald-50/40 flex items-end justify-center pb-4 pointer-events-none">
                  <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
                    {isAr ? `✅ وصلت إلى ${activeVisit}` : `✅ Reached ${activeVisit}`}
                  </div>
                </div>
              )}

              {/* VPN response success overlay */}
              {responseArrived && (
                <div className="absolute inset-0 bg-green-50/40 flex items-end justify-center pb-4 pointer-events-none">
                  <div className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
                    {isAr ? '✅ الرحلة اكتملت ذهاباً وإياباً' : '✅ Full round-trip complete'}
                  </div>
                </div>
              )}

              {/* Phase badge */}
              {step > 0 && (
                <div className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-lg border transition-all duration-300 ${
                  isResponsePhase ? 'bg-green-100 text-green-700 border-green-200' :
                  isDirect ? 'bg-red-50 text-red-600 border-red-200' :
                  'bg-indigo-100 text-indigo-700 border-indigo-200'
                }`} dir="ltr">
                  {isResponsePhase ? t.resPhase : t.reqPhase}
                </div>
              )}

              {/* Encrypted badge */}
              {isVpn && step >= 1 && (
                <div className="absolute top-2 right-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-lg border border-indigo-200" dir="ltr">
                  {t.encLabel}
                </div>
              )}

              {/* VPN popup */}
              {showVpnPopup && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl">
                    <div className="text-3xl text-center mb-2">🔒</div>
                    <h3 className="font-black text-slate-800 text-sm mb-1 text-center">{t.vpnPopupTitle}</h3>
                    <p className="text-xs text-slate-500 mb-3 text-center leading-relaxed">
                      {t.vpnPopupBody(DEFAULT_WEBSITE)}
                    </p>
                    <div className="bg-slate-50 rounded-xl p-3 text-xs font-mono text-slate-600 mb-3 space-y-1" dir="ltr">
                      <div><span className="text-slate-400">{t.vpnPopupFrom}</span> Ooredoo</div>
                      <div><span className="text-slate-400">{t.vpnPopupDest}</span> <span className="text-emerald-600 font-bold">{DEFAULT_WEBSITE}</span></div>
                      <div><span className="text-slate-400">{t.vpnPopupEnc}</span> <span className="text-indigo-600">✓ Yes</span></div>
                    </div>
                    <button onClick={() => setShowVpnPopup(false)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                      {t.vpnPopupBtn}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step label */}
            <div className="mt-3 min-h-10 text-center">
              <p className={`text-sm font-medium leading-relaxed ${
                isBlocked ? 'text-red-700 font-bold' :
                responseArrived || passedThrough ? 'text-green-700 font-bold' :
                isResponsePhase ? 'text-green-600' : 'text-slate-600'}`}>
                {steps[step]}
              </p>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="col-span-12 md:col-span-4 space-y-3">

            {/* ISP sees */}
            <div className="bg-white rounded-xl border-2 border-slate-200 p-3">
              <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                <Eye className="w-3 h-3" /> {t.ispLabel}
              </p>
              {ispData ? (
                <div className="space-y-2">
                  <div className="bg-slate-50 rounded-lg p-2 font-mono text-xs" dir="ltr">
                    <div className="text-slate-400 text-xs mb-0.5">{ispData.destLabel}:</div>
                    <div className="font-bold text-slate-700 break-all">{ispData.dest}</div>
                    {ispData.hidden && <>
                      <div className="text-slate-400 text-xs mt-1.5 mb-0.5">{ispData.hiddenLabel}:</div>
                      <div className="font-bold text-indigo-500 break-all">{ispData.hidden}</div>
                    </>}
                  </div>
                  <div className={`text-xs rounded-lg px-2 py-1.5 font-medium border ${ispData.cls}`}>
                    {ispData.verdictText}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-3">
                  {isAr ? 'ابدأ لترى ما يراه ISP' : 'Start to see what ISP sees'}
                </p>
              )}
            </div>

            {/* Flow path indicator */}
            {step > 0 && (
              <div className={`rounded-xl p-3 border text-xs font-mono space-y-1 transition-all ${
                isResponsePhase ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
              }`} dir="ltr">
                {isDirect ? (
                  <>
                    <div className={step >= 1 ? (targetBlocked ? 'text-red-600 font-bold' : 'text-indigo-600 font-bold') : 'text-slate-400'}>💻 → 🏢 Ooredoo</div>
                    {targetBlocked
                      ? <div className="text-red-400">🚫 (blocked)</div>
                      : <div className={step >= 3 ? 'text-emerald-600 font-bold' : 'text-slate-300'}>🏢 → 🌐 {activeVisit}</div>}
                  </>
                ) : (
                  <>
                    <div className="text-xs font-bold text-slate-500 mb-1">{isAr ? 'مسار الطلب ↗' : 'Request ↗'}</div>
                    <div className={step >= 1 ? 'text-indigo-600 font-bold' : 'text-slate-300'}>💻 → 🏢 Ooredoo</div>
                    <div className={step >= 2 ? 'text-indigo-600 font-bold' : 'text-slate-300'}>🏢 → 🔒 VPN</div>
                    <div className={step >= 3 ? 'text-emerald-600 font-bold' : 'text-slate-300'}>🔒 → 🌐 Website</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">{isAr ? 'مسار الرد ↙' : 'Response ↙'}</div>
                    <div className={step >= 4 ? 'text-green-600 font-bold' : 'text-slate-300'}>🌐 → 🔒 VPN</div>
                    <div className={step >= 5 ? 'text-green-600 font-bold' : 'text-slate-300'}>🔒 → 🏢 Ooredoo</div>
                    <div className={step >= 6 ? 'text-green-700 font-bold' : 'text-slate-300'}>🏢 → 💻 {isAr ? 'جهازك ✅' : 'Device ✅'}</div>
                  </>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="space-y-2">
              {step < maxStep ? (
                <button onClick={advance} disabled={busy || showVpnPopup}
                  className={`w-full text-white py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-40
                    ${isDirect ? 'bg-red-600 hover:bg-red-700' : isResponsePhase ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {step === 0 ? t.startBtn : t.nextBtn}
                </button>
              ) : (
                <div className={`w-full text-center py-2.5 rounded-xl text-sm font-bold
                  ${isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {isAr
                    ? (isBlocked ? '🚫 تم الحجب' : '✅ الرحلة اكتملت')
                    : (isBlocked ? '🚫 Blocked' : '✅ Journey Complete')}
                </div>
              )}
              {step > 0 && (
                <button onClick={reset} className="w-full bg-white border border-slate-200 text-slate-500 py-2 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  {t.replayBtn}
                </button>
              )}
            </div>

            {/* Step progress bars */}
            {isVpn ? (
              <div className="space-y-1" dir="ltr">
                <div className="text-xs text-slate-400 mb-1">{isAr ? 'طلب ↗' : 'Request ↗'}</div>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                  ))}
                </div>
                <div className="text-xs text-slate-400 mt-1">{isAr ? 'رد ↙' : 'Response ↙'}</div>
                <div className="flex gap-1">
                  {[4, 5, 6].map(i => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? 'bg-green-500' : 'bg-slate-200'}`} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex gap-1" dir="ltr">
                {Array.from({ length: maxStep }, (_, i) => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i < step ? (targetBlocked ? 'bg-red-500' : 'bg-emerald-500') : 'bg-slate-200'}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Challenge */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-5">
        <h3 className="font-bold text-indigo-800 text-sm mb-3">{t.qTitle}</h3>
        <div className="space-y-2">
          {t.qOpts.map((opt, i) => (
            <button key={i} onClick={() => setAnswer(i)}
              className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-medium border transition-all
                ${answer === null ? 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                  : answer === t.qAns
                    ? i === t.qAns ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                      : 'bg-white border-slate-200 text-slate-400 opacity-50'
                    : i === answer ? 'bg-red-100 border-red-400 text-red-700'
                      : i === t.qAns ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-400 opacity-50'}`}
              dir={isAr ? 'rtl' : 'ltr'}>{opt}
            </button>
          ))}
        </div>
        {answer !== null && (
          <p className={`mt-3 text-sm font-bold ${answer === t.qAns ? 'text-emerald-700' : 'text-red-600'}`}>
            {answer === t.qAns ? t.qCorrect : t.qWrong}
          </p>
        )}
      </div>

      {/* Next lesson */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-indigo-600 mb-0.5">{t.nextLabel}</p>
          <p className="text-sm text-indigo-800 leading-relaxed">{t.nextText}</p>
        </div>
        <button onClick={() => navigate('/ip-masking')}
          className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap">
          {t.nextBtn2}
        </button>
      </div>

      <Explanation>
        <p className="text-slate-500 text-sm leading-relaxed mb-4">{t.subtitle}</p>

        {/* Educational explanation */}
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5 mb-5">
          <h3 className="font-black text-indigo-800 text-base mb-2">{t.flowTitle}</h3>
          <p className="text-indigo-900 text-sm leading-relaxed mb-4">{t.flowExplain}</p>
          <div className="space-y-2">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 font-mono text-xs text-red-700">
              {t.flowDirect}
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 font-mono text-xs text-emerald-700 space-y-1">
              <div>{t.flowVpnReq}</div>
              <div>{t.flowVpnRes}</div>
            </div>
          </div>
        </div>

        {/* VPN Limits */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
          <h3 className="font-black text-amber-800 text-base mb-1">{t.limitTitle}</h3>
          <p className="text-amber-800 text-sm font-bold mb-3 leading-relaxed border-r-4 border-amber-400 pr-3">{t.limitNote}</p>
          <ul className="space-y-1.5">
            {t.limitPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                <span className="text-amber-500 flex-shrink-0 mt-0.5">•</span>{p}
              </li>
            ))}
          </ul>
        </div>
      </Explanation>

      <div className="flex items-center justify-between pt-6 border-t border-slate-100">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">
          <ChevronLeft className="w-4 h-4" />{isAr ? '← الرئيسية' : '← Home'}
        </button>
      </div>
    </div>
  )
}
