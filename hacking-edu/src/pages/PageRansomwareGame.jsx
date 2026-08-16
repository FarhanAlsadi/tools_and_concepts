import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft, Shield, Trophy, AlertTriangle, RotateCcw } from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   RANSOMWARE — GAMIFIED INCIDENT-RESPONSE SIMULATION  (safe, in-page only)

   A scored, multi-stage "serious game". The student plays the newest member of
   the IT team at a fictional company on a Monday morning and must:
     1) TRIAGE the inbox — tell safe mail from a phishing attack, spot red flags.
     2) Survive (or trigger) the INFECTION — watch files lock, ransom note + timer.
     3) Run the INCIDENT RESPONSE — pick the right action at each turn while a
        network-spread meter climbs and the ransom clock ticks.
     4) Read the DEBRIEF — score, rank, decision recap, and how to prevent it.

   Everything is a local simulation: no real files, network, or attacks.
   This is the experimental "/testing" build — the original /ransomware is kept.
   ──────────────────────────────────────────────────────────────────────────── */

/* ── desktop files that get "encrypted" during the infection ─────────────── */
const FILES = [
  { ar: 'صور_العائلة.jpg',  en: 'family_photos.jpg', icon: '🖼️' },
  { ar: 'عقود_العملاء.pdf', en: 'client_contracts.pdf', icon: '📄' },
  { ar: 'الرواتب.xlsx',     en: 'payroll.xlsx',      icon: '📗' },
  { ar: 'العرض_التقديمي.pptx', en: 'pitch_deck.pptx', icon: '📊' },
  { ar: 'قاعدة_البيانات.db', en: 'database.db',       icon: '🗄️' },
  { ar: 'الفواتير.docx',    en: 'invoices.docx',      icon: '📝' },
  { ar: 'النسخة_الاحتياطية.zip', en: 'backup.zip',    icon: '🗜️' },
  { ar: 'الشعار.png',       en: 'logo.png',           icon: '🎨' },
]

/* ── the three inbox messages ────────────────────────────────────────────── */
const EMAILS = {
  sales: {
    id: 'sales',
    avatar: 'KH', avatarBg: 'bg-emerald-100 text-emerald-700',
    fromAr: 'خالد المنصوري — المبيعات', fromEn: 'Khalid Al-Mansoori — Sales',
    address: 'k.almansoori@nakheel-trading.qa',
    subjAr: 'تقرير مبيعات الأسبوع 📈', subjEn: 'Weekly sales report 📈',
    timeAr: '٨:٤٠ ص', timeEn: '8:40 AM',
    bodyAr: 'صباح الخير،\nمرفق ملخّص مبيعات هذا الأسبوع كالمعتاد. لا يوجد ما يستدعي القلق، فقط للاطّلاع.\nشكراً، خالد',
    bodyEn: 'Good morning,\nHere is this week’s sales summary as usual. Nothing urgent — just for your records.\nThanks, Khalid',
    verdict: 'safe',
  },
  news: {
    id: 'news',
    avatar: 'TW', avatarBg: 'bg-sky-100 text-sky-700',
    fromAr: 'نشرة التقنية الأسبوعية', fromEn: 'Tech Weekly Newsletter',
    address: 'news@techweekly.com',
    subjAr: 'أهم ٥ أخبار تقنية هذا الأسبوع', subjEn: 'Top 5 tech stories this week',
    timeAr: '٧:١٥ ص', timeEn: '7:15 AM',
    bodyAr: 'نشرتك الأسبوعية وصلت! اقرأ أبرز أخبار الذكاء الاصطناعي والأمن السيبراني.\nلإلغاء الاشتراك اضغط أسفل الرسالة.',
    bodyEn: 'Your weekly digest is here! Read the top AI and cybersecurity headlines.\nTo unsubscribe, use the link at the bottom.',
    verdict: 'safe',
  },
  attack: {
    id: 'attack',
    avatar: 'HR', avatarBg: 'bg-red-100 text-red-700',
    fromAr: 'قسم الموارد البشرية', fromEn: 'HR Department',
    address: 'hr@nakheel-tradlng.qa',
    subjAr: 'عاجل: حدّث بيانات راتبك قبل نهاية اليوم', subjEn: 'URGENT: Update your payroll info before end of day',
    timeAr: '٩:٠٢ ص', timeEn: '9:02 AM',
    verdict: 'attack',
    fileAr: 'كشف_الراتب.pdf.exe', fileEn: 'payslip.pdf.exe', fileSize: '312 KB',
  },
}

/* Red flags the player can "discover" by clicking inside the attack email.
   key must be unique; each is worth points once. */
const FLAGS = {
  domain:  { ar: 'نطاق مزيّف: الصحيح "trading" وليس "tradlng" — تزييف بحرف واحد.', en: 'Spoofed domain: the real one is “trading”, not “tradlng” — a one-letter trick.' },
  urgency: { ar: 'استعجال مصطنع ("قبل نهاية اليوم") للضغط عليك كي لا تفكّر.', en: 'Manufactured urgency (“before end of day”) to pressure you into not thinking.' },
  greeting:{ ar: 'تحية عامة "عزيزي الموظف" بلا اسمك — علامة تصيّد شائعة.', en: 'Generic “Dear Employee” with no real name — a classic phishing sign.' },
  ext:     { ar: 'امتداد مزدوج ‎.pdf.exe‎ — برنامج تنفيذي متنكّر في هيئة ملف PDF.', en: 'Double extension .pdf.exe — an executable disguised as a PDF.' },
}

/* ── incident-response turns ─────────────────────────────────────────────── */
const TURNS = [
  {
    key: 'contain',
    qAr: 'ملفاتك بدأت تُشفَّر والبرمجية قد تنتشر إلى مجلدات الشبكة المشتركة. ما أول تصرّف؟',
    qEn: 'Your files are being encrypted and the malware may spread to shared network drives. What do you do first?',
    options: [
      { ar: 'افصل الجهاز عن الشبكة فوراً (اسحب سلك الشبكة / أطفئ الواي‑فاي)', en: 'Disconnect the machine from the network now (pull the cable / turn off Wi-Fi)', pts: 150, good: true, set: 'disconnected',
        fbAr: '✅ عزل صحيح! فصل الجهاز يوقف انتشار الفدية إلى بقية الشبكة — أهم خطوة أولى.', fbEn: '✅ Correct isolation! Disconnecting stops the ransomware from spreading across the network — the critical first step.' },
      { ar: 'ادفع الفدية فوراً لتوفير الوقت', en: 'Pay the ransom right away to save time', pts: -120, good: false,
        fbAr: '❌ الدفع لا يوقف الانتشار ولا يضمن استعادة الملفات — وأنت تموّل المجرمين.', fbEn: '❌ Paying stops nothing and guarantees nothing — and it funds the criminals.' },
      { ar: 'أعد تشغيل الجهاز لعلّ المشكلة تختفي', en: 'Reboot and hope the problem goes away', pts: -40, good: false,
        fbAr: '❌ إعادة التشغيل لا تفكّ التشفير وقد تُكمل البرمجية عملها بعد الإقلاع.', fbEn: '❌ Rebooting won’t decrypt anything and the malware may just resume after boot.' },
      { ar: 'تابع عملك وتجاهل التحذير', en: 'Keep working and ignore the warning', pts: -80, good: false, spread: 25,
        fbAr: '❌ كل ثانية تأخير تعني ملفات ومشاركات شبكة أكثر تُصاب. لا تتجاهل.', fbEn: '❌ Every second of delay means more files and network shares infected. Never ignore it.' },
    ],
  },
  {
    key: 'report',
    qAr: 'عزلت الجهاز. ما الخطوة التالية الأصح؟',
    qEn: 'The machine is isolated. What’s the best next step?',
    options: [
      { ar: 'أبلغ فريق الأمن والإدارة فوراً، ووثّق الوقت وما رأيته', en: 'Alert the security team and management now, and document the time and what you saw', pts: 150, good: true, set: 'reported',
        fbAr: '✅ التبليغ والتوثيق يبدآن الاستجابة الرسمية ويساعدان التحقيق ومنع تكرار الهجوم.', fbEn: '✅ Reporting and documenting kick off the formal response and help the investigation.' },
      { ar: 'احذف الملفات المشفّرة لعلّها تختفي', en: 'Delete the encrypted files so they “go away”', pts: -90, good: false,
        fbAr: '❌ الحذف يدمّر الأدلة وقد يمنع استرجاعاً محتملاً — لا تحذف.', fbEn: '❌ Deleting destroys evidence and any chance of recovery — don’t.' },
      { ar: 'نزّل "أداة فك تشفير" مجانية من أول نتيجة في غوغل', en: 'Download a free “decryptor” from the first Google result', pts: -70, good: false,
        fbAr: '❌ معظم هذه الأدوات فخّ يضيف برمجيات خبيثة أخرى. لا تنزّل من مصادر مجهولة.', fbEn: '❌ Most of these are traps that add more malware. Never download from unknown sources.' },
      { ar: 'أخفِ الأمر حتى لا تتحمّل اللوم', en: 'Hide it so you don’t get blamed', pts: -110, good: false,
        fbAr: '❌ الإخفاء يمنح الهجوم وقتاً أطول ويضاعف الضرر. الإبلاغ المبكر هو الصحيح.', fbEn: '❌ Hiding it buys the attack more time and multiplies the damage. Early reporting is right.' },
    ],
  },
  {
    key: 'recover',
    qAr: 'حان وقت استعادة العمل. كيف تستعيد ملفاتك؟',
    qEn: 'Time to recover. How do you get your files back?',
    options: [
      { ar: 'امسح النظام بالكامل واستعد من نسخة احتياطية غير متصلة (backup الأمس)', en: 'Wipe the system and restore from an offline backup (yesterday’s backup)', pts: 200, good: true, set: 'recovery', val: 'restored',
        fbAr: '✅ هذا هو الحل الحقيقي: نظام نظيف + نسخة احتياطية = استعادة كاملة بلا دفع فلس واحد.', fbEn: '✅ This is the real fix: a clean system + a backup = full recovery without paying a cent.' },
      { ar: 'ادفع 0.05 بيتكوين للمهاجم', en: 'Pay 0.05 BTC to the attacker', pts: -160, good: false, set: 'recovery', val: 'paid',
        fbAr: '❌ نصف من يدفع لا يستعيد ملفاته، والدفع يجعلك هدفاً متكرراً.', fbEn: '❌ Half of those who pay never recover their files, and paying marks you as a repeat target.' },
      { ar: 'أعد التشغيل فقط وتأمل عودة الملفات', en: 'Just reboot and hope the files come back', pts: -50, good: false, set: 'recovery', val: 'reboot',
        fbAr: '❌ التشفير لا يزول بإعادة التشغيل. بدون نسخة احتياطية، الملفات مفقودة.', fbEn: '❌ Encryption doesn’t undo on reboot. Without a backup, the files are gone.' },
    ],
  },
]

/* ── prevention checklist shown at the debrief ───────────────────────────── */
const PREVENT = [
  { icon: '💾', ar: 'نسخ احتياطية دورية وغير متصلة (٣‑٢‑١): أهم دفاع على الإطلاق.', en: 'Regular, offline backups (the 3-2-1 rule): the single most important defense.' },
  { icon: '📎', ar: 'لا تفتح مرفقاً أو رابطاً غير متوقَّع — تحقّق من المُرسِل أولاً.', en: 'Never open an unexpected attachment or link — verify the sender first.' },
  { icon: '🔎', ar: 'افحص النطاق والامتداد المزدوج: ‎.pdf.exe‎ ليس ملف PDF.', en: 'Check the domain and double extensions: .pdf.exe is not a PDF.' },
  { icon: '🔄', ar: 'حدّث النظام والبرامج — الفدية تدخل غالباً عبر ثغرات قديمة.', en: 'Patch your OS and apps — ransomware often enters through old vulnerabilities.' },
  { icon: '🔌', ar: 'عند الإصابة: اعزل الجهاز فوراً، بلّغ، لا تدفع، ثم استعد من النسخة.', en: 'If hit: isolate the machine, report, don’t pay, then restore from backup.' },
]

const fmtTime = s => {
  const h = String(Math.floor(s / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return `${h}:${m}:${sec}`
}

const RANKS = [
  { min: 700, icon: '🏆', ar: 'خبير الاستجابة للحوادث', en: 'Incident-Response Expert' },
  { min: 450, icon: '🛡️', ar: 'محلّل أمني واعد',        en: 'Promising Security Analyst' },
  { min: 200, icon: '📚', ar: 'متدرّب يتعلّم',           en: 'Trainee — keep learning' },
  { min: -9999, icon: '💀', ar: 'وقعت في الفخ — جرّب مجدداً', en: 'Fell into the trap — try again' },
]

export default function PageRansomwareGame() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const ar = lang === 'ar'

  const [stage, setStage] = useState('brief')      // brief | inbox | infect | respond | debrief
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState(null)         // {good:bool, text} score-change toast
  const [feedback, setFeedback] = useState(null)   // {good:bool, ar, en} persistent per-choice banner

  // inbox
  const [openEmail, setOpenEmail] = useState('attack')
  const [verdicts, setVerdicts] = useState({})     // {emailId: 'safe'|'reported'|'opened'}
  const [foundFlags, setFoundFlags] = useState([])

  // infection
  const [locked, setLocked] = useState(() => FILES.map(() => false))
  const [secs, setSecs] = useState(71 * 3600 + 59 * 60 + 59)

  // response
  const [turn, setTurn] = useState(0)
  const [spread, setSpread] = useState(8)
  const [state, setState] = useState({ opened: false, disconnected: false, reported: false, recovery: null, prevented: false })

  const timers = useRef([])
  const tick = useRef(null)
  const spreadTick = useRef(null)
  const clearAll = () => { timers.current.forEach(clearTimeout); timers.current = []; clearInterval(tick.current); clearInterval(spreadTick.current) }
  useEffect(() => clearAll, [])

  const lockedCount = locked.filter(Boolean).length

  /* small helper: change score + show a floating toast */
  const addScore = (n) => {
    setScore(s => Math.max(0, s + n))
    if (n !== 0) {
      setFlash({ good: n > 0, text: `${n > 0 ? '+' : ''}${n}` })
      const t = setTimeout(() => setFlash(null), 1100)
      timers.current.push(t)
    }
  }

  /* ── INBOX actions ─────────────────────────────────────────────────────── */
  const findFlag = (key) => {
    if (foundFlags.includes(key)) return
    setFoundFlags(f => [...f, key])
    addScore(60)
  }

  const classify = (id, choice) => {
    if (verdicts[id]) return
    const email = EMAILS[id]
    const correct = email.verdict === 'safe' ? choice === 'safe' : choice === 'reported'
    addScore(correct ? 100 : -40)
    setVerdicts(v => ({ ...v, [id]: choice }))
    setFeedback(correct
      ? { good: true,  ar: '✅ قرار صحيح.', en: '✅ Correct call.' }
      : { good: false, ar: id === 'attack' ? '❌ هذه رسالة تصيّد كان يجب التبليغ عنها!' : '❌ هذه رسالة شرعية — بلّغت عنها بالخطأ.', en: id === 'attack' ? '❌ That was a phishing email you should have reported!' : '❌ That was a legitimate email — you reported it by mistake.' })
    const t = setTimeout(() => setFeedback(null), 2600); timers.current.push(t)
  }

  const openAttachment = () => {
    setVerdicts(v => ({ ...v, attack: 'opened' }))
    setState(s => ({ ...s, opened: true }))
    startInfection()
  }

  const reportAttack = () => {
    classify('attack', 'reported')
    setState(s => ({ ...s, prevented: true }))
  }

  const allResolved = verdicts.sales && verdicts.news && verdicts.attack

  /* ── INFECTION sequence ────────────────────────────────────────────────── */
  const startInfection = () => {
    setStage('infect')
    setLocked(FILES.map(() => false))
    timers.current.push(setTimeout(() => {
      FILES.forEach((_, i) => {
        timers.current.push(setTimeout(() => {
          setLocked(prev => { const n = [...prev]; n[i] = true; return n })
          if (i === FILES.length - 1) {
            const t = setTimeout(() => {
              tick.current = setInterval(() => setSecs(s => (s > 0 ? s - 1 : 0)), 1000)
            }, 500)
            timers.current.push(t)
          }
        }, 420 * (i + 1)))
      })
    }, 700))
  }

  const beginResponse = () => {
    setStage('respond')
    // network-spread meter climbs until the player disconnects
    spreadTick.current = setInterval(() => {
      setSpread(sp => {
        setState(st => { if (st.disconnected) { clearInterval(spreadTick.current) } return st })
        return Math.min(100, sp + 3)
      })
    }, 900)
  }

  const choose = (opt) => {
    addScore(opt.pts)
    if (opt.set) setState(s => ({ ...s, [opt.set]: opt.val !== undefined ? opt.val : true }))
    if (opt.set === 'disconnected' || (opt.good && TURNS[turn].key === 'contain')) { clearInterval(spreadTick.current) }
    if (opt.spread) setSpread(sp => Math.min(100, sp + opt.spread))
    setFeedback({ good: opt.good, ar: opt.fbAr, en: opt.fbEn })
    const t = setTimeout(() => {
      setFeedback(null)
      if (turn < TURNS.length - 1) setTurn(turn + 1)
      else { clearInterval(tick.current); setStage('debrief') }
    }, 2400)
    timers.current.push(t)
  }

  const restart = () => {
    clearAll()
    setStage('brief'); setScore(0); setFlash(null); setFeedback(null)
    setOpenEmail('attack'); setVerdicts({}); setFoundFlags([])
    setLocked(FILES.map(() => false)); setSecs(71 * 3600 + 59 * 60 + 59)
    setTurn(0); setSpread(8); setState({ opened: false, disconnected: false, reported: false, recovery: null, prevented: false })
  }

  const rank = RANKS.find(r => score >= r.min)
  const stageNum = { brief: 0, inbox: 1, infect: 2, respond: 3, debrief: 4 }[stage]

  /* flag-word helper: renders a clickable red-flag span inside the email */
  const Flag = ({ k, children }) => {
    const found = foundFlags.includes(k)
    return (
      <button onClick={() => findFlag(k)}
        className="inline align-baseline font-bold rounded px-1 transition-colors"
        style={{ background: found ? '#dcfce7' : '#fef9c3', color: found ? '#166534' : '#854d0e', border: `1px dashed ${found ? '#86efac' : '#fde047'}`, cursor: found ? 'default' : 'pointer' }}
        title={found ? (ar ? '✔ اكتُشِف' : '✔ found') : (ar ? 'اضغط: يبدو مريباً' : 'click: looks suspicious')}>
        {children}{found ? ' ✔' : ''}
      </button>
    )
  }

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="max-w-3xl mx-auto px-4 py-8">
      <style>{`
        @keyframes rwShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-3px)} 40%{transform:translateX(3px)} 60%{transform:translateX(-2px)} 80%{transform:translateX(2px)} }
        @keyframes rwPop { 0%{transform:translateY(6px) scale(.8);opacity:0} 40%{opacity:1} 100%{transform:translateY(-18px) scale(1);opacity:0} }
        @keyframes rwGlow { 0%,100%{box-shadow:0 0 0 3px rgba(220,38,38,.25)} 50%{box-shadow:0 0 22px 4px rgba(220,38,38,.55)} }
        .rw-shake{animation:rwShake .5s ease-in-out}
        .rw-glow{animation:rwGlow 1.6s ease-in-out infinite}
      `}</style>

      {/* ── header ───────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#fee2e2', color: '#b91c1c' }}>{ar ? '🧪 محاكاة آمنة' : '🧪 Safe simulation'}</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#ede9fe', color: '#6d28d9' }}>{ar ? '🎮 نسخة تفاعلية (تجريبية)' : '🎮 Interactive build (testing)'}</span>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mt-2">🕹️ {ar ? 'مهمّة: أوقف هجوم الفدية' : 'Mission: Stop the Ransomware'}</h1>
        <p className="text-sm text-slate-500 mt-1">{ar ? 'أنت أحدث عضو في فريق تقنية المعلومات بشركة نخيل للتجارة. قراراتك تُحتسب.' : 'You are the newest member of IT at Nakheel Trading Co. Every decision counts.'}</p>
      </div>

      {/* ── HUD: score + stage progress (after the briefing) ─────────────── */}
      {stage !== 'brief' && (
        <div className="sticky top-14 z-20 mb-4 flex items-center justify-between gap-3 bg-white/95 backdrop-blur rounded-xl border-2 border-slate-200 px-4 py-2.5 shadow-sm">
          <div className="relative flex items-center gap-2">
            <Trophy size={16} style={{ color: '#FCAD0F' }} />
            <span className="text-xs font-bold text-slate-500">{ar ? 'النقاط' : 'Score'}</span>
            <span className="text-lg font-black tabular-nums" style={{ color: '#0E1F39' }}>{score}</span>
            {flash && (
              <span className="absolute -top-1 start-full ms-1 text-sm font-black" style={{ color: flash.good ? '#16a34a' : '#dc2626', animation: 'rwPop 1.1s ease-out forwards' }}>{flash.text}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {['inbox', 'infect', 'respond', 'debrief'].map((s, i) => (
              <span key={s} className="h-1.5 rounded-full transition-all" style={{ width: stageNum >= i + 1 ? 26 : 14, background: stageNum >= i + 1 ? '#FCAD0F' : '#e2e8f0' }} />
            ))}
            <span className="text-xs font-bold text-slate-400 ms-1">{stageNum}/4</span>
          </div>
        </div>
      )}

      {/* per-choice feedback banner */}
      {feedback && (
        <div className={`mb-4 rounded-xl border-2 p-3.5 text-sm font-semibold ${feedback.good ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
          {ar ? feedback.ar : feedback.en}
        </div>
      )}

      {/* ── STAGE: BRIEFING ──────────────────────────────────────────────── */}
      {stage === 'brief' && (
        <div className="rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm">
          <div className="p-6 text-center" style={{ background: '#0E1F39' }}>
            <div className="text-5xl mb-2">🕹️</div>
            <h2 className="text-xl font-black text-white">{ar ? 'مناوبة يوم الإثنين — ٩:٠٣ صباحاً' : 'Monday shift — 9:03 AM'}</h2>
            <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,.7)' }}>
              {ar ? 'وصلت للتوّ إلى مكتبك. صندوق الوارد ممتلئ، وأحد الموظفين أبلغ عن رسالة "غريبة". مهمّتك: احمِ الشركة عبر قرارات ذكية — واكسب أعلى نقاط.'
                  : 'You just reached your desk. The inbox is full and a colleague flagged a “weird” email. Your job: protect the company with smart decisions — and score as high as you can.'}
            </p>
          </div>
          <div className="bg-white p-5">
            <div className="grid grid-cols-3 gap-3 text-center mb-5">
              {[
                { icon: '📥', ar: 'افحص الوارد', en: 'Triage inbox' },
                { icon: '🔒', ar: 'واجه الإصابة', en: 'Face the attack' },
                { icon: '🛡️', ar: 'أدِر الاستجابة', en: 'Run the response' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-2xl">{s.icon}</div>
                  <div className="text-xs font-bold text-slate-600 mt-1">{ar ? s.ar : s.en}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setStage('inbox')} className="w-full py-3 rounded-xl font-black text-white text-sm" style={{ background: '#FCAD0F', color: '#0E1F39' }}>
              {ar ? '▶ ابدأ المناوبة' : '▶ Start shift'}
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE: INBOX TRIAGE ──────────────────────────────────────────── */}
      {stage === 'inbox' && (
        <div>
          <div className="rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm bg-white">
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: '#0E1F39' }}>
              <span className="text-white text-sm font-bold">📥 {ar ? 'البريد الوارد — ٣ رسائل' : 'Inbox — 3 messages'}</span>
              <span className="text-white/60 text-xs">{Object.keys(verdicts).length}/3 {ar ? 'تمّت مراجعتها' : 'reviewed'}</span>
            </div>

            {/* email list */}
            <div className="divide-y divide-slate-100">
              {Object.values(EMAILS).map(em => {
                const v = verdicts[em.id]
                return (
                  <button key={em.id} onClick={() => setOpenEmail(em.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-start transition-colors ${openEmail === em.id ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                    <div className={`w-9 h-9 rounded-full ${em.avatarBg} flex items-center justify-center font-black text-xs flex-shrink-0`}>{em.avatar}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-800 truncate">{ar ? em.fromAr : em.fromEn}</div>
                      <div className="text-xs text-slate-500 truncate">{ar ? em.subjAr : em.subjEn}</div>
                    </div>
                    {v && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={ v === 'safe' ? { background: '#dcfce7', color: '#166534' } : v === 'reported' ? { background: '#fee2e2', color: '#b91c1c' } : { background: '#1a0d0d', color: '#fca5a5' } }>
                        {v === 'safe' ? (ar ? 'آمن' : 'safe') : v === 'reported' ? (ar ? 'مُبلَّغ' : 'reported') : (ar ? 'فُتِح' : 'opened')}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 flex-shrink-0">{ar ? em.timeAr : em.timeEn}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* reading pane */}
          {openEmail && (() => {
            const em = EMAILS[openEmail]
            const resolved = !!verdicts[em.id]
            return (
              <div className="mt-4 rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className={`w-10 h-10 rounded-full ${em.avatarBg} flex items-center justify-center font-black flex-shrink-0`}>{em.avatar}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-800">{ar ? em.fromAr : em.fromEn}</div>
                    <div className="text-xs text-slate-500 font-mono truncate" dir="ltr">
                      {em.id === 'attack'
                        ? <>hr@nakheel-<Flag k="domain">tradlng</Flag>.qa</>
                        : em.address}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 flex-shrink-0">{ar ? em.timeAr : em.timeEn}</div>
                </div>

                <h2 className="text-base font-black text-slate-800 mt-3">{ar ? em.subjAr : em.subjEn}</h2>

                {em.id === 'attack' ? (
                  <>
                    <p className="text-sm text-slate-600 leading-relaxed mt-2">
                      <Flag k="greeting">{ar ? 'عزيزي الموظف' : 'Dear Employee'}</Flag>{ar ? '، لاحظنا مشكلة في بيانات راتبك. يجب تحديثها ' : ', we noticed an issue with your payroll. You must update it '}
                      <Flag k="urgency">{ar ? 'قبل نهاية اليوم' : 'before end of day'}</Flag>{ar ? ' وإلا سيتوقّف راتب هذا الشهر. حمّل المرفق واتبع التعليمات.' : ' or this month’s salary will be held. Download the attachment and follow the steps.'}
                    </p>

                    {/* attachment */}
                    <div className="mt-4 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl flex-shrink-0">📄</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800 truncate" dir="ltr">
                          <Flag k="ext">{ar ? em.fileAr : em.fileEn}</Flag>
                        </div>
                        <div className="text-xs text-slate-400">{em.fileSize}</div>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                      <span>🔎</span>
                      <span>{ar ? `اكتشفت ${foundFlags.length}/4 علامات خطر — اضغط على أي شيء يبدو مريباً.` : `You found ${foundFlags.length}/4 red flags — click anything that looks suspicious.`}</span>
                    </div>

                    {!resolved && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button onClick={reportAttack} className="py-2.5 rounded-xl font-black text-sm text-white" style={{ background: '#16a34a' }}>🚩 {ar ? 'بلّغ واحذف' : 'Report & delete'}</button>
                        <button onClick={openAttachment} className="py-2.5 rounded-xl font-black text-sm text-white" style={{ background: '#dc2626' }}>⬇️ {ar ? 'افتح المرفق' : 'Open attachment'}</button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 leading-relaxed mt-2" style={{ whiteSpace: 'pre-line' }}>{ar ? em.bodyAr : em.bodyEn}</p>
                    {!resolved && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button onClick={() => classify(em.id, 'safe')} className="py-2.5 rounded-xl font-black text-sm text-white" style={{ background: '#16a34a' }}>✅ {ar ? 'وضع: آمن' : 'Mark safe'}</button>
                        <button onClick={() => classify(em.id, 'reported')} className="py-2.5 rounded-xl font-black text-sm text-slate-700 bg-slate-100 border-2 border-slate-200">🚩 {ar ? 'بلّغ' : 'Report'}</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })()}

          {/* prevention success → offer to continue into the IR training */}
          {state.prevented && allResolved && (
            <div className="mt-4 rounded-2xl border-2 border-green-300 bg-green-50 p-5 text-center">
              <div className="text-3xl mb-1">🛡️</div>
              <div className="font-black text-green-800">{ar ? 'أحسنت! أوقفت الهجوم قبل أن يبدأ.' : 'Well done! You stopped the attack before it began.'}</div>
              <p className="text-sm text-green-700 mt-1 max-w-md mx-auto">{ar ? 'التبليغ عن الرسالة وعدم فتح المرفق هو أفضل نتيجة ممكنة. لكن لنتدرّب على الاستجابة لو أنّ زميلاً آخر فتحها.' : 'Reporting the email and not opening the attachment is the best possible outcome. But let’s train the response in case a coworker opens it.'}</p>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                <button onClick={startInfection} className="px-5 py-2.5 rounded-xl font-black text-sm text-white" style={{ background: '#dc2626' }}>🔒 {ar ? 'شاهد ماذا لو فُتح المرفق' : 'See what if it was opened'}</button>
                <button onClick={() => setStage('debrief')} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-white border-2 border-slate-200">{ar ? 'إنهاء وعرض النتيجة' : 'Finish & see results'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STAGE: INFECTION ─────────────────────────────────────────────── */}
      {stage === 'infect' && (
        <div>
          <div className="rounded-2xl border-2 overflow-hidden shadow-sm" style={{ background: '#1a0d0d', borderColor: '#7f1d1d' }}>
            <div className="px-4 py-2 flex items-center justify-between" style={{ background: '#7f1d1d' }}>
              <span className="text-white text-xs font-bold">🖥️ {ar ? 'سطح المكتب — ملفاتي' : 'Desktop — My Files'}</span>
              <span className="text-white text-xs font-mono">{lockedCount}/{FILES.length} {ar ? 'مقفل' : 'locked'}</span>
            </div>
            <div className="grid grid-cols-4 gap-3 p-4">
              {FILES.map((f, i) => (
                <div key={i} className={`flex flex-col items-center text-center gap-1 ${locked[i] ? 'rw-shake' : ''}`}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: locked[i] ? '#450a0a' : 'white', border: locked[i] ? '1px solid #b91c1c' : '1px solid #e2e8f0', transform: locked[i] ? 'scale(.96)' : 'none', transition: 'all .3s' }}>
                    {locked[i] ? '🔒' : f.icon}
                  </div>
                  <span className="text-[10px] font-mono leading-tight break-all" style={{ color: locked[i] ? '#fca5a5' : '#94a3b8' }}>
                    {locked[i] ? ((ar ? f.ar : f.en) + '.locked') : (ar ? f.ar : f.en)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {lockedCount < FILES.length ? (
            <div className="mt-4 text-center bg-red-950 rounded-2xl p-4">
              <div className="text-red-300 font-black text-sm animate-pulse">🔒 {ar ? 'جارٍ تشفير ملفاتك…' : 'Encrypting your files…'}</div>
              <div className="mt-2 h-2 bg-red-900 rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${(lockedCount / FILES.length) * 100}%` }} /></div>
            </div>
          ) : (
            <>
              <div className="mt-4 rounded-2xl border-2 border-red-600 bg-black p-6 text-center rw-glow">
                <div className="text-5xl mb-2">☠️</div>
                <h2 className="text-xl font-black text-red-500">{ar ? 'ملفاتك مشفّرة!' : 'YOUR FILES ARE ENCRYPTED!'}</h2>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed max-w-md mx-auto">
                  {ar ? 'كل مستنداتك وقواعد بياناتك مقفلة بتشفير قوي. لاستعادتها ادفع ٠.٠٥ بيتكوين قبل انتهاء المهلة، وإلا تُحذف نهائياً.'
                      : 'All your documents and databases are locked with strong encryption. Pay 0.05 BTC before the timer ends or they are deleted forever.'}
                </p>
                <div className="mt-3 inline-block bg-red-950 border border-red-700 rounded-xl px-5 py-2">
                  <div className="text-[10px] text-red-400 font-bold">{ar ? 'الوقت المتبقّي' : 'TIME LEFT'}</div>
                  <div className="text-2xl font-mono font-black text-red-400 tracking-widest">{fmtTime(secs)}</div>
                </div>
                <div className="mt-3 text-xs font-mono text-slate-500 break-all" dir="ltr">BTC: 1A2b3C4d5E6f7G8h9I0jK1l2M3n4O5p6Q7</div>
              </div>
              <button onClick={beginResponse} className="mt-4 w-full py-3 rounded-xl font-black text-sm text-white" style={{ background: '#0E1F39' }}>
                🧑‍💻 {ar ? 'ابدأ الاستجابة للحادث' : 'Begin incident response'}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── STAGE: INCIDENT RESPONSE ─────────────────────────────────────── */}
      {stage === 'respond' && (
        <div>
          {/* live meters */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1"><AlertTriangle size={13} /> {ar ? 'انتشار الشبكة' : 'Network spread'}</span>
                <span style={{ color: state.disconnected ? '#16a34a' : '#dc2626' }}>{state.disconnected ? (ar ? 'مُوقَف' : 'contained') : `${spread}%`}</span>
              </div>
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${spread}%`, background: state.disconnected ? '#16a34a' : spread > 60 ? '#dc2626' : '#f59e0b' }} />
              </div>
            </div>
            <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>⏳ {ar ? 'مهلة الفدية' : 'Ransom timer'}</span>
                <span className="font-mono text-red-600">{fmtTime(secs)}</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">{ar ? 'العدّاد مجرّد ضغط نفسي — لا تدَعه يقودك للدفع.' : 'The timer is pure pressure — don’t let it push you to pay.'}</div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-400 mb-1">{ar ? `القرار ${turn + 1} من ${TURNS.length}` : `Decision ${turn + 1} of ${TURNS.length}`}</div>
            <h3 className="text-base font-black text-slate-800 mb-4">{ar ? TURNS[turn].qAr : TURNS[turn].qEn}</h3>
            <div className="space-y-2.5">
              {TURNS[turn].options.map((opt, i) => (
                <button key={i} onClick={() => !feedback && choose(opt)} disabled={!!feedback}
                  className="w-full flex items-center gap-3 text-start p-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 hover:border-amber-400 hover:bg-amber-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="w-7 h-7 rounded-full bg-slate-800 text-white text-sm font-black flex items-center justify-center flex-shrink-0">{ar ? ['أ', 'ب', 'ج', 'د'][i] : ['A', 'B', 'C', 'D'][i]}</span>
                  <span className="text-sm font-bold text-slate-800">{ar ? opt.ar : opt.en}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE: DEBRIEF ───────────────────────────────────────────────── */}
      {stage === 'debrief' && (
        <div>
          <div className="rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm">
            <div className="p-6 text-center" style={{ background: '#0E1F39' }}>
              <div className="text-5xl mb-1">{rank.icon}</div>
              <div className="text-xs font-bold" style={{ color: '#FCAD0F' }}>{ar ? 'رتبتك' : 'YOUR RANK'}</div>
              <div className="text-lg font-black text-white">{ar ? rank.ar : rank.en}</div>
              <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-full px-5 py-2">
                <Trophy size={16} style={{ color: '#FCAD0F' }} />
                <span className="text-white font-black text-xl tabular-nums">{score}</span>
                <span className="text-white/60 text-xs font-bold">{ar ? 'نقطة' : 'pts'}</span>
              </div>
            </div>

            <div className="bg-white p-5">
              {/* decision recap */}
              <h3 className="font-black text-slate-800 text-sm mb-3">🧾 {ar ? 'ملخّص قراراتك' : 'Your decisions'}</h3>
              <div className="space-y-2 mb-5">
                {[
                  { ok: state.prevented, ar: state.prevented ? 'بلّغت عن رسالة التصيّد ولم تفتح المرفق.' : 'فتحت المرفق الخبيث — بدأت الإصابة.', en: state.prevented ? 'Reported the phishing email and didn’t open the attachment.' : 'Opened the malicious attachment — the infection began.' },
                  { ok: state.disconnected, ar: state.disconnected ? 'عزلت الجهاز عن الشبكة بسرعة.' : 'لم تعزل الجهاز — سُمِح للفدية بالانتشار.', en: state.disconnected ? 'Isolated the machine from the network quickly.' : 'Didn’t isolate the machine — the ransomware was allowed to spread.' },
                  { ok: state.reported, ar: state.reported ? 'أبلغت فريق الأمن ووثّقت الحادث.' : 'لم تُبلّغ فريق الأمن كما ينبغي.', en: state.reported ? 'Alerted the security team and documented the incident.' : 'Didn’t properly alert the security team.' },
                  { ok: state.recovery === 'restored', ar: state.recovery === 'restored' ? 'استعدت الملفات من نسخة احتياطية — دون دفع.' : state.recovery === 'paid' ? 'دفعت الفدية — خيار خطير وغير مضمون.' : 'اعتمدت على إعادة التشغيل — الملفات ما زالت مفقودة.', en: state.recovery === 'restored' ? 'Restored files from backup — without paying.' : state.recovery === 'paid' ? 'Paid the ransom — risky and not guaranteed.' : 'Relied on a reboot — the files are still gone.' },
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 mt-0.5">{r.ok ? '✅' : '❌'}</span>
                    <p className={`text-sm leading-relaxed ${r.ok ? 'text-slate-700' : 'text-red-700'}`}>{ar ? r.ar : r.en}</p>
                  </div>
                ))}
              </div>

              {/* key takeaway */}
              <div className="rounded-xl p-4 mb-5" style={{ background: '#0E1F39' }}>
                <div className="flex items-start gap-2.5">
                  <Shield size={18} style={{ color: '#FCAD0F', flexShrink: 0, marginTop: 2 }} />
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,.85)' }}>
                    {ar ? 'البطل الحقيقي ليس الدفع، بل النسخ الاحتياطية + عدم فتح المرفقات المشبوهة. من يملك نسخة احتياطية جيدة يتجاهل الفدية تماماً.'
                        : 'The real hero isn’t paying — it’s backups + not opening suspicious attachments. Anyone with a good backup can ignore the ransom entirely.'}
                  </p>
                </div>
              </div>

              {/* prevention checklist */}
              <h3 className="font-black text-slate-800 text-sm mb-3">🛡️ {ar ? 'كيف تمنع هجوم الفدية' : 'How to prevent ransomware'}</h3>
              <div className="space-y-2">
                {PREVENT.map((r, i) => (
                  <div key={i} className="flex items-start gap-2.5"><span className="text-base flex-shrink-0">{r.icon}</span><p className="text-sm text-slate-700 leading-relaxed">{ar ? r.ar : r.en}</p></div>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <button onClick={restart} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white flex items-center gap-1.5" style={{ background: '#0E1F39' }}><RotateCcw size={15} />{ar ? 'العب مرة أخرى' : 'Play again'}</button>
                <button onClick={() => navigate('/testing')} className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 border-2 border-slate-200">🧪 {ar ? 'منطقة الاختبار' : 'Testing area'}</button>
                <button onClick={() => navigate('/')} className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 border-2 border-slate-200 flex items-center gap-1.5"><ChevronLeft size={15} />{ar ? 'الرئيسية' : 'Home'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── explanation — collapsed, sits under the game ──────────────────── */}
      <Explanation>
        <p className="text-slate-500 text-sm leading-relaxed">
          {ar ? 'برنامج الفدية (Ransomware) يشفّر ملفاتك ويطلب مالاً لفكّها. في هذه المحاكاة تلعب دور مسؤول تقنية المعلومات: تفحص البريد لكشف التصيّد، وتشاهد الإصابة تحدث، ثم تدير الاستجابة للحادث خطوة بخطوة. الدرس الأهم: النسخ الاحتياطية المنتظمة وغير المتصلة، وعدم فتح المرفقات المشبوهة، تجعلانك في مأمن — أمّا الدفع فلا يضمن شيئاً ويموّل المجرمين.'
              : 'Ransomware encrypts your files and demands money to unlock them. In this simulation you play the IT responder: triage the mail to catch phishing, watch the infection unfold, then run the incident response step by step. The key lesson: regular, offline backups and not opening suspicious attachments keep you safe — while paying guarantees nothing and funds criminals.'}
        </p>
      </Explanation>
    </div>
  )
}
