import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   RANSOMWARE SIMULATION (safe, in-page only) — simulated PC
   A realistic desktop (wallpaper, icons, taskbar). Files actually open in their
   apps (image viewer, Word, Excel, PowerPoint, PDF, music player, archive), and
   the browser opens a Gmail-style inbox — switch between them like a real PC.
   Downloading the booby-trapped attachment closes windows, encrypts the desktop
   files one by one, and a full-screen ransom note (< 24h) takes over, followed
   by a multiple-choice question. Lesson: BACKUPS (not paying) are the defense.
   ──────────────────────────────────────────────────────────────────────────── */

const INIT_FILES = [
  { name: 'صور_العائلة.png', en: 'family_photo.png', icon: '🖼️', kind: 'photoFamily' },
  { name: 'الواجب.pdf',       en: 'homework.pdf',       icon: '📄', kind: 'pdf' },
  { name: 'مشروعي.pptx',      en: 'my_project.pptx',    icon: '📊', kind: 'slides' },
  { name: 'حساباتي.xlsx',     en: 'accounts.xlsx',      icon: '📗', kind: 'sheet' },
  { name: 'سيرتي_الذاتية.docx',en: 'resume.docx',        icon: '📝', kind: 'doc' },
  { name: 'أغنية.mp3',        en: 'song.mp3',           icon: '🎵', kind: 'audio' },
  { name: 'رحلة_قطر.jpg',     en: 'qatar_trip.jpg',     icon: '🏞️', kind: 'photoTrip' },
  { name: 'ألعاب.zip',        en: 'games.zip',          icon: '🗜️', kind: 'zip' },
]

const PREVENT = [
  { icon: '💾', ar: 'خذ نسخة احتياطية دورية لملفاتك (سحابية أو قرص خارجي) — أهم دفاع على الإطلاق.', en: 'Back up your files regularly (cloud or an external disk) — the single most important defense.' },
  { icon: '📎', ar: 'لا تفتح مرفقاً أو رابطاً من مصدر مجهول أو غير متوقَّع.', en: "Never open an attachment or link from an unknown or unexpected source." },
  { icon: '🔄', ar: 'حدّث نظامك وبرامجك — الفدية تدخل غالباً عبر ثغرات قديمة.', en: 'Update your OS and apps — ransomware often enters through old vulnerabilities.' },
  { icon: '🚫', ar: 'لا تدفع الفدية: لا ضمان لاستعادة ملفاتك، وأنت تموّل المجرمين.', en: "Don't pay the ransom: no guarantee you'll get files back, and you fund the criminals." },
  { icon: '🛡️', ar: 'استخدم برنامج حماية محدّثاً يكشف سلوك التشفير المفاجئ.', en: 'Use up-to-date protection that detects sudden encryption behavior.' },
]

const FOLDERS = [
  { key: 'inbox',   ar: 'الوارد',              en: 'Inbox',   icon: '📥' },
  { key: 'starred', ar: 'المميّزة بنجمة',       en: 'Starred', icon: '⭐' },
  { key: 'snoozed', ar: 'المؤجّلة',             en: 'Snoozed', icon: '⏰' },
  { key: 'sent',    ar: 'المُرسَلة',            en: 'Sent',    icon: '📤' },
  { key: 'drafts',  ar: 'المسودّات',            en: 'Drafts',  icon: '📄' },
  { key: 'spam',    ar: 'المزعجة (سبام)',        en: 'Spam',    icon: '⚠️' },
  { key: 'trash',   ar: 'المهملات',             en: 'Trash',   icon: '🗑️' },
]

const MAIL = {
  inbox: [
    {
      id: 'phish', danger: true, unread: true, initials: 'HR', avatarBg: '#1a73e8',
      from: 'قسم الموارد البشرية', fromEn: 'HR Department', addr: 'hr@company-qa.com', time: 'الآن', timeEn: 'now',
      subj: 'ملف مهم — يرجى مراجعته فوراً', subjEn: 'Important file — please review immediately',
      preview: 'مرفق مستند مهم يخص حسابك ويتطلب مراجعتك العاجلة قبل انتهاء المهلة.',
      previewEn: 'Attached is an important document about your account that needs your urgent review.',
      body: 'مرحباً،\nمرفق مستند مهم يخص حسابك ويتطلب مراجعتك العاجلة. يرجى تنزيل الملف وفتحه اليوم قبل انتهاء المهلة.\n\nمع التحية،\nقسم الموارد البشرية',
      bodyEn: 'Hello,\nAttached is an important document about your account that needs your urgent review. Please download and open the file today before the deadline.\n\nRegards,\nHR Department',
      attachment: { name: 'التقرير_المهم.pdf.exe', size: '248 KB' },
    },
    {
      id: 'i2', unread: true, initials: 'ن', avatarBg: '#34a853',
      from: 'نادي اللياقة', fromEn: 'Fitness Club', addr: 'no-reply@fitclub.qa', time: '9:41', timeEn: '9:41',
      subj: 'تذكير: تجديد اشتراكك', subjEn: 'Reminder: renew your subscription',
      preview: 'يُجدَّد اشتراكك الشهري بعد ٣ أيام — لا حاجة لأي إجراء.',
      previewEn: 'Your monthly subscription renews in 3 days — no action needed.',
      body: 'يُجدَّد اشتراكك الشهري بعد ٣ أيام. لا حاجة لأي إجراء من طرفك.', bodyEn: 'Your monthly subscription renews in 3 days. No action needed on your part.',
    },
    {
      id: 'i3', initials: 'G', avatarBg: '#ea4335',
      from: 'Google', fromEn: 'Google', addr: 'no-reply@accounts.google.com', time: 'أمس', timeEn: 'Yesterday',
      subj: 'تنبيه أمان', subjEn: 'Security alert',
      preview: 'تم تسجيل الدخول إلى حسابك من جهاز جديد.', previewEn: 'A new sign-in to your account.',
      body: 'تم تسجيل الدخول إلى حسابك من جهاز جديد. إذا كان هذا أنت فتجاهل هذه الرسالة.', bodyEn: 'A new sign-in to your account. If this was you, you can ignore this message.',
    },
  ],
  spam: [
    {
      id: 'sp1', initials: '🎁', avatarBg: '#f59e0b',
      from: 'سحب الجوائز', fromEn: 'Prize Draw', addr: 'winner@lucky-draw.info', time: 'أمس', timeEn: 'Yesterday',
      subj: '🎉 مبروك! لقد ربحت ١٬٠٠٠٬٠٠٠ ريال', subjEn: '🎉 Congrats! You won 1,000,000',
      preview: 'اضغط لاستلام جائزتك الآن قبل فوات الأوان!', previewEn: 'Click to claim your prize now!',
      body: 'لقد تم اختيارك للفوز بالجائزة الكبرى! أرسل بياناتك البنكية لاستلام المبلغ فوراً.', bodyEn: 'You have been selected for the grand prize! Send your bank details to claim it now.',
    },
  ],
  starred: [], snoozed: [], sent: [], drafts: [], trash: [],
}

const fmtTime = s => {
  const h = String(Math.floor(s / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return `${h}:${m}:${sec}`
}

// A single desktop icon (module-scope for a stable identity across renders).
function DeskIcon({ emoji, label, onClick, locked }) {
  return (
    <button onClick={onClick} disabled={!onClick} className="flex flex-col items-center gap-1 w-[74px] p-1 rounded-lg hover:bg-white/15 transition-colors" style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <span className="text-3xl leading-none drop-shadow">{locked ? '🔒' : emoji}</span>
      <span className="text-[10px] text-white leading-tight text-center break-all px-0.5" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{label}</span>
    </button>
  )
}

// A generic application window (title bar + scrollable content).
function AppWindow({ ar, title, icon, onClose, children }) {
  return (
    <div className="absolute z-30 bg-white rounded-lg overflow-hidden shadow-2xl flex flex-col" style={{ top: 10, bottom: 54, insetInlineStart: 10, insetInlineEnd: 10 }}>
      <div className="flex items-center gap-2 px-3 h-9 flex-shrink-0" style={{ background: '#dee1e6' }}>
        <div className="flex items-center gap-1.5">
          <button onClick={onClose} title={ar ? 'إغلاق' : 'Close'} className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold ms-2">{icon} {title}</div>
        <div className="flex-1" />
        <button onClick={onClose} className="text-slate-500 text-sm font-bold px-1" title={ar ? 'إغلاق' : 'Close'}>✕</button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">{children}</div>
    </div>
  )
}

export default function PageRansomware() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const ar = lang === 'ar'

  const [phase, setPhase]         = useState('pc')     // pc | ransom | paid | restored | rebooted
  const [browserOpen, setBrowser] = useState(false)
  const [openFile, setOpenFile]   = useState(null)     // index of the open desktop file (null = none)
  const [folder, setFolder]       = useState('inbox')
  const [openMail, setOpenMail]   = useState(null)
  const [attacking, setAttacking] = useState(false)
  const [locked, setLocked]       = useState(() => INIT_FILES.map(() => false))
  const [secs, setSecs]           = useState(5 * 3600 + 59 * 60 + 59)   // < 24h deadline
  const timers = useRef([])
  const tick   = useRef(null)

  useEffect(() => () => { timers.current.forEach(clearTimeout); clearInterval(tick.current) }, [])

  const lockedCount = locked.filter(Boolean).length
  const num         = n => (ar ? Number(n).toLocaleString('ar-EG') : String(n))
  const mailList    = MAIL[folder] || []
  const openObj     = openMail ? mailList.find(m => m.id === openMail) : null
  const everOpened  = useRef(false)
  if (browserOpen) everOpened.current = true

  const showBrowser = () => { setOpenFile(null); setBrowser(true) }
  const showDesktop = () => { setOpenFile(null); setBrowser(false) }
  const openFileWin = i => { if (phase !== 'pc' || locked[i]) return; setBrowser(false); setOpenFile(i) }

  // Open the attachment → close windows, encrypt the desktop, then the note.
  const downloadFile = () => {
    if (attacking || phase !== 'pc') return
    setAttacking(true)
    timers.current.push(setTimeout(() => { setBrowser(false); setOpenFile(null) }, 500))
    INIT_FILES.forEach((_, i) => {
      timers.current.push(setTimeout(() => {
        setLocked(prev => { const n = [...prev]; n[i] = true; return n })
        if (i === INIT_FILES.length - 1) {
          timers.current.push(setTimeout(() => {
            setPhase('ransom')
            tick.current = setInterval(() => setSecs(s => (s > 0 ? s - 1 : 0)), 1000)
          }, 700))
        }
      }, 900 + 430 * (i + 1)))
    })
  }

  const respond = (which) => {
    clearInterval(tick.current)
    if (which === 'restored') setLocked(INIT_FILES.map(() => false))
    setPhase(which)
  }

  const restart = () => {
    timers.current.forEach(clearTimeout); timers.current = []; clearInterval(tick.current)
    everOpened.current = false
    setPhase('pc'); setBrowser(false); setOpenFile(null); setFolder('inbox'); setOpenMail(null)
    setAttacking(false); setLocked(INIT_FILES.map(() => false)); setSecs(5 * 3600 + 59 * 60 + 59)
  }

  const OUTCOME = {
    paid:     { ok: false, icon: '💸', titleAr: 'دفعت الفدية… وخسرت', titleEn: 'You paid… and lost', bodyAr: 'أرسلت المال، لكن نصف الضحايا لا يستعيدون ملفاتهم حتى بعد الدفع — وأنت الآن موّلت عصابة إجرامية وأصبحت هدفاً سهلاً مرة أخرى. الملفات ما زالت مقفلة.', bodyEn: 'You sent the money, but half of victims never get their files back even after paying — and you just funded a criminal gang and became an easy target again. The files are still locked.' },
    restored: { ok: true,  icon: '💾', titleAr: 'استعدت ملفاتك — أحسنت!', titleEn: 'You restored your files — well done!', bodyAr: 'فصلت الجهاز عن الشبكة لإيقاف الانتشار، ثم مسحت النظام واستعدت كل ملفاتك من نسخة الأمس الاحتياطية. لم تدفع فلساً واحداً. النسخة الاحتياطية أنقذتك.', bodyEn: "You disconnected from the network to stop the spread, wiped the system, and restored every file from yesterday's backup. You paid nothing. The backup saved you." },
    rebooted: { ok: false, icon: '🔌', titleAr: 'أعدت التشغيل فقط — الملفات ما زالت مقفلة', titleEn: 'You just rebooted — files still locked', bodyEn: 'Rebooting does nothing: the files are encrypted with a key only the attacker has. Without a backup, they are gone. This is why backups matter.', bodyAr: 'إعادة التشغيل لا تفعل شيئاً: الملفات مشفّرة بمفتاح لدى المهاجم فقط. بدون نسخة احتياطية، فقدتها. لهذا النُّسخ الاحتياطية مهمة.' },
  }

  const showHint = phase === 'pc' && !browserOpen && openFile === null && !attacking && !everOpened.current

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-5">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#fee2e2', color: '#b91c1c' }}>{ar ? '🧪 محاكاة آمنة' : '🧪 Safe simulation'}</span>
        <h1 className="text-2xl font-black text-slate-800 mt-2 mb-1">🔒 {ar ? 'محاكاة برامج الفدية' : 'Ransomware Simulation'}</h1>
        <p className="text-sm text-slate-500">{ar ? 'هذا حاسوبك. افتح ملفاتك أو تصفّح بريدك، وبدّل بين النوافذ كما في جهاز حقيقي.' : 'This is your PC. Open your files or browse your email, and switch between windows like a real machine.'}</p>
      </div>

      {phase === 'paid' || phase === 'restored' || phase === 'rebooted' ? (
        <>
          {Monitor()}
          <div className={`mt-4 rounded-2xl border-2 p-5 ${OUTCOME[phase].ok ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <div className="text-center">
              <div className="text-4xl mb-1">{OUTCOME[phase].icon}</div>
              <div className={`font-black text-base ${OUTCOME[phase].ok ? 'text-green-800' : 'text-red-800'}`}>{ar ? OUTCOME[phase].titleAr : OUTCOME[phase].titleEn}</div>
              <p className={`text-sm mt-2 leading-relaxed max-w-lg mx-auto ${OUTCOME[phase].ok ? 'text-green-700' : 'text-red-700'}`}>{ar ? OUTCOME[phase].bodyAr : OUTCOME[phase].bodyEn}</p>
            </div>
            <div className="mt-5 bg-white/70 rounded-xl p-4 border border-slate-200">
              <h3 className="font-black text-slate-800 text-sm mb-3">🛡️ {ar ? 'كيف تحمي نفسك من الفدية' : 'How to defend against ransomware'}</h3>
              <div className="space-y-2">
                {PREVENT.map((r, i) => (
                  <div key={i} className="flex items-start gap-2.5"><span className="text-base flex-shrink-0">{r.icon}</span><p className="text-sm text-slate-700 leading-relaxed">{ar ? r.ar : r.en}</p></div>
                ))}
              </div>
            </div>
            <div className="flex justify-center gap-3 mt-5">
              <button onClick={restart} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: '#0E1F39' }}>{ar ? '↻ جرّب مرة أخرى' : '↻ Try again'}</button>
              <button onClick={() => navigate('/')} className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 border-2 border-slate-200 flex items-center gap-1.5"><ChevronLeft size={15} />{ar ? 'الرئيسية' : 'Home'}</button>
            </div>
          </div>
        </>
      ) : (
        Monitor()
      )}

      {/* Multiple-choice question — separate card under the screen */}
      {phase === 'ransom' && (
        <div className="mt-4 bg-white rounded-2xl border-2 border-slate-200 p-5">
          <h3 className="text-base font-black text-slate-800 mb-1">❓ {ar ? 'ما ردّك الصحيح على هذا الهجوم؟' : 'What is your correct response to this attack?'}</h3>
          <p className="text-xs text-slate-500 mb-4">{ar ? 'اختر إجابة واحدة:' : 'Choose one answer:'}</p>
          <div className="space-y-2.5">
            {[
              { key: 'paid',     letter: ar ? 'أ' : 'A', emoji: '💸', label: ar ? 'ادفع الفدية' : 'Pay the ransom' },
              { key: 'restored', letter: ar ? 'ب' : 'B', emoji: '💾', label: ar ? 'افصل الشبكة واستعد نسخة احتياطية' : 'Disconnect + restore backup' },
              { key: 'rebooted', letter: ar ? 'ج' : 'C', emoji: '🔌', label: ar ? 'أعد تشغيل الجهاز فقط' : 'Just reboot' },
            ].map(opt => (
              <button key={opt.key} onClick={() => respond(opt.key)}
                className="w-full flex items-center gap-3 text-start p-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 hover:border-red-400 hover:bg-red-50 transition-all">
                <span className="w-7 h-7 rounded-full bg-slate-800 text-white text-sm font-black flex items-center justify-center flex-shrink-0">{opt.letter}</span>
                <span className="text-xl flex-shrink-0">{opt.emoji}</span>
                <span className="text-sm font-bold text-slate-800">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Explanation>
        <p className="text-slate-500 text-sm leading-relaxed">
          {ar ? 'برنامج الفدية يشفّر كل ملفاتك ويطلب مالاً لفكّها. جرّب السيناريو بأمان: تصفّح ملفاتك وبريدك، افتح الرسالة المشبوهة ونزّل مرفقها، شاهد ملفاتك تُقفَل — ثم أجب عن السؤال باختيار ردّك الصحيح.'
              : 'Ransomware encrypts all your files and demands money to unlock them. Try the scenario safely: browse your files and email, open the suspicious message and download its attachment, watch your files get locked — then answer the question by choosing your correct response.'}
        </p>
      </Explanation>
    </div>
  )

  // ── Monitor (desktop + windows + ransom overlay + taskbar) ──────────────
  function Monitor() {
    return (
      <div className="rounded-2xl p-2 sm:p-3 shadow-xl" style={{ background: '#0b0f19' }}>
        <div className="relative rounded-lg overflow-hidden" style={{ height: 520, background: 'radial-gradient(120% 120% at 30% 20%, #2f6df6 0%, #1e40af 45%, #0b2a6b 100%)' }} dir={ar ? 'rtl' : 'ltr'}>

          {/* desktop icons */}
          <div className="absolute inset-0 p-3 flex flex-col flex-wrap content-start gap-1" style={{ paddingBottom: 56 }}>
            <DeskIcon emoji="🌐" label={ar ? 'المتصفح' : 'Browser'} onClick={phase === 'pc' ? showBrowser : undefined} />
            {INIT_FILES.map((f, i) => (
              <DeskIcon key={i} emoji={f.icon} locked={locked[i]}
                label={locked[i] ? ((ar ? f.name : f.en) + '.locked') : (ar ? f.name : f.en)}
                onClick={phase === 'pc' && !locked[i] ? () => openFileWin(i) : undefined} />
            ))}
          </div>

          {/* encrypting toast */}
          {attacking && phase === 'pc' && (
            <div className="absolute left-1/2 top-4 -translate-x-1/2 z-20 bg-black/80 text-red-300 text-xs font-black px-4 py-2 rounded-full animate-pulse">
              🔒 {ar ? 'جارٍ تشفير ملفاتك…' : 'Encrypting your files…'} {num(lockedCount)}/{num(INIT_FILES.length)}
            </div>
          )}

          {/* hint bubble */}
          {showHint && (
            <div className="absolute z-20 bottom-14 left-1/2 -translate-x-1/2 bg-white text-slate-800 text-xs font-bold px-3 py-2 rounded-xl shadow-lg">
              🖱️ {ar ? 'انقر أي ملف لفتحه، أو افتح المتصفح لقراءة بريدك' : 'Click any file to open it, or open the browser for your email'}
            </div>
          )}

          {/* file window */}
          {openFile !== null && phase === 'pc' && (() => {
            const app = fileApp(openFile)
            return <AppWindow ar={ar} title={app.title} icon={app.icon} onClose={() => setOpenFile(null)}>{app.node}</AppWindow>
          })()}

          {/* browser window */}
          {browserOpen && phase === 'pc' && (
            <div className="absolute z-30 bg-white rounded-lg overflow-hidden shadow-2xl flex flex-col" style={{ top: 10, bottom: 54, insetInlineStart: 10, insetInlineEnd: 10 }}>
              <div className="flex items-center gap-2 px-3 h-9 flex-shrink-0" style={{ background: '#dee1e6' }}>
                <div className="flex items-center gap-1.5">
                  <button onClick={showDesktop} title={ar ? 'إغلاق' : 'Close'} className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
                </div>
                <div className="flex items-center gap-1.5 bg-white/70 rounded-t-lg px-3 py-1 text-xs text-slate-600 font-bold ms-2">✉️ {ar ? 'البريد' : 'Mail'}</div>
                <div className="flex-1" />
                <button onClick={showDesktop} className="text-slate-500 text-sm font-bold px-1" title={ar ? 'تصغير' : 'Minimize'}>—</button>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-200 flex-shrink-0 bg-white">
                <span className="text-slate-400 text-sm">←&nbsp;→&nbsp;⟳</span>
                <div className="flex-1 flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1 text-xs text-slate-500" dir="ltr">🔒 mail.google.com/mail/u/0/#inbox</div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">{Gmail()}</div>
            </div>
          )}

          {/* ransom takeover */}
          {phase === 'ransom' && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center px-6" style={{ background: 'rgba(0,0,0,0.92)' }} dir={ar ? 'rtl' : 'ltr'}>
              <div className="text-6xl mb-2">☠️</div>
              <h2 className="text-2xl font-black text-red-500">{ar ? 'ملفاتك مشفّرة!' : 'YOUR FILES ARE ENCRYPTED!'}</h2>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed max-w-md">
                {ar ? 'كل مستنداتك وصورك مقفلة بتشفير قوي. لاستعادتها، ادفع ٠.٠٥ بيتكوين خلال المهلة، وإلا ستُحذف نهائياً.'
                    : 'All your documents and photos are locked with strong encryption. To recover them, pay 0.05 BTC before the timer ends, or they will be deleted forever.'}
              </p>
              <div className="mt-4 inline-block bg-red-950 border border-red-700 rounded-xl px-6 py-2">
                <div className="text-[10px] text-red-400 font-bold">{ar ? 'الوقت المتبقّي' : 'TIME LEFT'}</div>
                <div className="text-3xl font-mono font-black text-red-400 tracking-widest">{fmtTime(secs)}</div>
              </div>
              <div className="mt-4 text-xs font-mono text-slate-500 break-all max-w-xs" dir="ltr">BTC: 1A2b3C4d5E6f7G8h9I0jK1l2M3n4O5p6Q7</div>
              <div className="mt-4 text-[11px] text-slate-400">{ar ? '↓ اختر ردّك من الأسفل' : '↓ choose your response below'}</div>
            </div>
          )}

          {/* taskbar */}
          <div className="absolute bottom-0 inset-x-0 z-30 h-[46px] flex items-center gap-2 px-3" style={{ background: 'rgba(10,14,25,0.82)', backdropFilter: 'blur(6px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button className="w-8 h-8 rounded-md flex items-center justify-center text-white/90 hover:bg-white/10" title={ar ? 'ابدأ' : 'Start'}>⊞</button>
            <button onClick={() => phase === 'pc' && (browserOpen ? showDesktop() : showBrowser())}
              className={`w-8 h-8 rounded-md flex items-center justify-center text-lg hover:bg-white/10 ${showHint ? 'animate-pulse' : ''}`}
              style={{ background: browserOpen ? 'rgba(255,255,255,0.18)' : 'transparent' }} title={ar ? 'المتصفح' : 'Browser'}>🌐</button>
            <button onClick={showDesktop} className="w-8 h-8 rounded-md flex items-center justify-center text-lg hover:bg-white/10" title={ar ? 'سطح المكتب' : 'Show desktop'}>🗂️</button>
            <div className="flex-1" />
            <div className="text-white/80 text-xs font-mono leading-tight text-center">
              <div>10:30</div>
              <div className="text-[9px] text-white/50">{ar ? 'الثلاثاء' : 'Tue'}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── File viewers (what opens when you click a desktop file) ─────────────
  function fileApp(i) {
    const f = INIT_FILES[i]
    switch (f.kind) {
      case 'photoFamily':
        return { title: ar ? 'عارض الصور' : 'Photos', icon: '🖼️', node: (
          <div className="h-full flex flex-col items-center justify-center gap-3 p-4" style={{ background: '#0f172a' }}>
            <div className="rounded-xl w-full max-w-sm flex items-center justify-center text-7xl" style={{ aspectRatio: '4 / 3', background: 'linear-gradient(135deg,#fca5a5,#fdba74,#fcd34d)' }}>👨‍👩‍👧‍👦</div>
            <div className="text-white/80 text-sm">{ar ? 'عائلتي في العيد 🎉' : 'My family on Eid 🎉'}</div>
          </div>
        ) }
      case 'photoTrip':
        return { title: ar ? 'عارض الصور' : 'Photos', icon: '🏞️', node: (
          <div className="h-full flex flex-col items-center justify-center gap-3 p-4" style={{ background: '#0f172a' }}>
            <div className="rounded-xl w-full max-w-sm flex items-end justify-center text-6xl pb-5" style={{ aspectRatio: '4 / 3', background: 'linear-gradient(180deg,#38bdf8,#0ea5e9 55%,#f59e0b)' }}>🕌 🏙️</div>
            <div className="text-white/80 text-sm">{ar ? 'كتارا، الدوحة' : 'Katara, Doha'}</div>
          </div>
        ) }
      case 'pdf':
        return { title: ar ? 'عارض PDF' : 'PDF Viewer', icon: '📄', node: (
          <div className="p-5 bg-slate-100 min-h-full">
            <div className="bg-white shadow max-w-md mx-auto p-6 rounded">
              <h3 className="font-black text-slate-800 text-center">{ar ? 'واجب الرياضيات — الصف السابع' : 'Math Homework — Grade 7'}</h3>
              <ol className="mt-4 space-y-3 text-sm text-slate-700 list-decimal ps-5">
                <li>{ar ? 'احسب: ٢٥ × ٤ = ؟' : 'Compute: 25 × 4 = ?'}</li>
                <li>{ar ? 'ما محيط مربع طول ضلعه ٦ سم؟' : 'Perimeter of a square with side 6 cm?'}</li>
                <li>{ar ? 'بسّط الكسر ٨ / ١٢.' : 'Simplify the fraction 8/12.'}</li>
                <li>{ar ? 'اذكر ثلاثة أعداد أولية.' : 'Name three prime numbers.'}</li>
              </ol>
              <div className="text-[10px] text-slate-400 text-center mt-6">— {ar ? 'صفحة ١ من ١' : 'Page 1 of 1'} —</div>
            </div>
          </div>
        ) }
      case 'slides':
        return { title: 'PowerPoint', icon: '📊', node: (
          <div className="p-5 min-h-full flex items-center justify-center" style={{ background: '#cbb' }}>
            <div className="bg-white shadow-lg w-full max-w-md rounded p-6 flex flex-col relative" style={{ aspectRatio: '16 / 9', borderTop: '6px solid #d24726' }}>
              <h3 className="font-black text-2xl text-slate-800">{ar ? 'النظام الشمسي' : 'The Solar System'}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-600 list-disc ps-5">
                <li>{ar ? 'الكواكب الثمانية' : 'The eight planets'}</li>
                <li>{ar ? 'الشمس نجم في مركز المجموعة' : 'The Sun is a star at the center'}</li>
                <li>{ar ? 'الأرض هي كوكبنا' : 'Earth is our planet'}</li>
              </ul>
              <div className="absolute bottom-2 end-3 text-[10px] text-slate-400">{ar ? 'شريحة ١ / ٥' : 'Slide 1 / 5'}</div>
            </div>
          </div>
        ) }
      case 'sheet': {
        const rows = [[ar ? 'مصروف' : 'Allowance', 500], [ar ? 'كتب' : 'Books', 120], [ar ? 'مواصلات' : 'Transport', 300], [ar ? 'توفير' : 'Savings', 80]]
        return { title: 'Excel', icon: '📗', node: (
          <div className="min-h-full bg-white p-3">
            <table className="w-full text-sm border-collapse">
              <thead><tr>
                <th className="border border-slate-300 px-3 py-1.5 text-white text-start" style={{ background: '#217346' }}>{ar ? 'البند' : 'Item'}</th>
                <th className="border border-slate-300 px-3 py-1.5 text-white text-start" style={{ background: '#217346' }}>{ar ? 'المبلغ (ريال)' : 'Amount (QAR)'}</th>
              </tr></thead>
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k}><td className="border border-slate-200 px-3 py-1.5 text-slate-700">{k}</td><td className="border border-slate-200 px-3 py-1.5 text-slate-700 font-mono">{num(v)}</td></tr>
                ))}
                <tr className="font-black"><td className="border border-slate-200 px-3 py-1.5 text-slate-800">{ar ? 'الإجمالي' : 'Total'}</td><td className="border border-slate-200 px-3 py-1.5 text-slate-800 font-mono">{num(1000)}</td></tr>
              </tbody>
            </table>
          </div>
        ) }
      }
      case 'doc':
        return { title: 'Word', icon: '📝', node: (
          <div className="p-5 bg-slate-100 min-h-full">
            <div className="bg-white shadow max-w-md mx-auto p-6 rounded" style={{ borderTop: '6px solid #2b579a' }}>
              <h3 className="font-black text-xl text-slate-800">{ar ? 'أحمد الكواري' : 'Ahmed Al-Kuwari'}</h3>
              <div className="text-xs text-slate-500">{ar ? 'طالب ومطوّر ويب' : 'Student & Web Developer'}</div>
              <h4 className="font-bold text-sm text-slate-700 mt-4 mb-1">{ar ? 'المهارات' : 'Skills'}</h4>
              <p className="text-sm text-slate-600">Python · HTML · CSS · {ar ? 'أمن سيبراني' : 'Cybersecurity'}</p>
              <h4 className="font-bold text-sm text-slate-700 mt-3 mb-1">{ar ? 'التعليم' : 'Education'}</h4>
              <p className="text-sm text-slate-600">{ar ? 'ثانوية الدوحة — ٢٠٢٥' : 'Doha High School — 2025'}</p>
            </div>
          </div>
        ) }
      case 'audio':
        return { title: ar ? 'مشغّل الموسيقى' : 'Music Player', icon: '🎵', node: (
          <div className="h-full flex flex-col items-center justify-center gap-3 p-6" style={{ background: '#111827' }}>
            <div className="w-40 h-40 rounded-xl flex items-center justify-center text-6xl shadow-lg" style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }}>🎵</div>
            <div className="text-white font-bold mt-1">{ar ? 'أغنيتي المفضّلة' : 'My Favorite Song'}</div>
            <div className="text-white/50 text-xs">{ar ? 'فنان مجهول' : 'Unknown Artist'}</div>
            <div className="w-full max-w-xs mt-1">
              <div className="h-1 bg-white/20 rounded-full"><div className="h-1 bg-white rounded-full" style={{ width: '35%' }} /></div>
              <div className="flex justify-between text-[10px] text-white/50 mt-1" dir="ltr"><span>1:23</span><span>3:45</span></div>
            </div>
            <div className="flex items-center gap-6 text-white text-2xl mt-1">⏮️ ▶️ ⏭️</div>
          </div>
        ) }
      case 'zip': {
        const items = [['Minecraft.exe', '12 MB'], ['setup.dat', '4 MB'], ['readme.txt', '2 KB'], ['save1.dat', '340 KB']]
        return { title: ar ? 'مدير الأرشيف' : 'Archive Manager', icon: '🗜️', node: (
          <div className="min-h-full bg-white p-3">
            <div className="text-xs text-slate-500 mb-2">📦 games.zip — {ar ? '٤ عناصر' : '4 items'}</div>
            <table className="w-full text-xs">
              <thead><tr className="text-slate-400 border-b border-slate-200"><th className="text-start py-1 font-bold">{ar ? 'الاسم' : 'Name'}</th><th className="text-start py-1 font-bold">{ar ? 'الحجم' : 'Size'}</th></tr></thead>
              <tbody>
                {items.map(([n, s]) => (
                  <tr key={n} className="border-b border-slate-100"><td className="py-1.5 text-slate-700 font-mono" dir="ltr">📄 {n}</td><td className="py-1.5 text-slate-500 font-mono" dir="ltr">{s}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) }
      }
      default:
        return { title: ar ? 'ملف' : 'File', icon: '📄', node: <div className="p-6 text-slate-500 text-sm">{ar ? 'لا يمكن عرض هذا الملف.' : 'Cannot preview this file.'}</div> }
    }
  }

  // ── Gmail app (rendered inside the browser window) ──────────────────────
  function Gmail() {
    return (
      <div className="flex flex-col h-full bg-white" dir={ar ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-200 flex-shrink-0">
          <span className="text-slate-500">☰</span>
          <span className="flex items-center gap-1 font-bold text-slate-700"><span style={{ color: '#EA4335' }}>✉️</span><span className="hidden sm:inline text-sm">{ar ? 'البريد' : 'Mail'}</span></span>
          <div className="flex-1 mx-1"><div className="flex items-center gap-2 rounded-lg px-3 py-1 text-slate-400 text-xs" style={{ background: '#eaf1fb' }}>🔍 <span className="truncate">{ar ? 'ابحث في البريد' : 'Search mail'}</span></div></div>
          <span className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#1a73e8' }}>{ar ? 'أ' : 'A'}</span>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-32 sm:w-40 flex-shrink-0 py-2 px-1.5 overflow-y-auto">
            <button className="flex items-center gap-2 px-3 py-2 mb-2 rounded-2xl shadow-sm font-bold text-xs text-slate-700" style={{ background: '#c2e7ff' }}><span>✏️</span>{ar ? 'إنشاء' : 'Compose'}</button>
            <div className="space-y-0.5">
              {FOLDERS.map(f => {
                const active = folder === f.key
                const count = (MAIL[f.key] || []).filter(m => m.unread).length
                return (
                  <button key={f.key} onClick={() => { setFolder(f.key); setOpenMail(null) }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-start ${active ? 'font-bold' : 'text-slate-700 hover:bg-slate-100'}`}
                    style={active ? { background: '#fde3e1', color: '#c5221f' } : undefined}>
                    <span className="flex-shrink-0">{f.icon}</span><span className="flex-1 truncate">{ar ? f.ar : f.en}</span>
                    {count > 0 && <span className="text-[10px] font-bold flex-shrink-0">{num(count)}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex-1 min-w-0 border-s border-slate-200 overflow-y-auto">
            {!openObj ? (
              mailList.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2 h-full py-16"><span className="text-4xl">📭</span><span className="text-xs">{ar ? 'لا توجد رسائل هنا' : 'No messages here'}</span></div>
              ) : (
                mailList.map(m => (
                  <button key={m.id} onClick={() => setOpenMail(m.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 border-b border-slate-100 text-start hover:bg-slate-50 ${m.unread ? 'bg-white' : 'bg-slate-50/60'}`}>
                    <span className="text-slate-300 flex-shrink-0">☆</span>
                    <div className="w-7 h-7 rounded-full text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: m.avatarBg }}>{m.initials}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs truncate ${m.unread ? 'font-black text-slate-900' : 'text-slate-600'}`}>{ar ? m.from : m.fromEn}</span>
                        {m.danger && <span className="text-[8px] px-1 py-0.5 rounded font-bold flex-shrink-0" style={{ background: '#fee2e2', color: '#b91c1c' }}>{ar ? 'مشبوهة' : 'suspicious'}</span>}
                      </div>
                      <div className={`text-[11px] truncate ${m.unread ? 'font-bold text-slate-700' : 'text-slate-500'}`}>{ar ? m.subj : m.subjEn} <span className="text-slate-400 font-normal">— {ar ? m.preview : m.previewEn}</span></div>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{ar ? m.time : m.timeEn}</span>
                  </button>
                ))
              )
            ) : (
              <div className="p-3">
                <button onClick={() => setOpenMail(null)} className="text-slate-500 text-xs mb-2 hover:text-slate-800">↩ {ar ? 'رجوع' : 'Back'}</button>
                <h2 className="text-base font-black text-slate-800">{ar ? openObj.subj : openObj.subjEn}{folder === 'spam' && ' ⚠️'}</h2>
                <div className="flex items-center gap-2 mt-2 pb-2 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-black text-xs flex-shrink-0" style={{ background: openObj.avatarBg }}>{openObj.initials}</div>
                  <div className="min-w-0 flex-1"><div className="text-xs font-bold text-slate-800">{ar ? openObj.from : openObj.fromEn}</div><div className="text-[10px] text-slate-500 font-mono truncate" dir="ltr">{openObj.addr}</div></div>
                  <div className="text-[10px] text-slate-400 flex-shrink-0">{ar ? openObj.time : openObj.timeEn}</div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mt-2" style={{ whiteSpace: 'pre-line' }}>{ar ? openObj.body : openObj.bodyEn}</p>
                {openObj.attachment && (
                  <>
                    <div className="mt-3 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                      <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center text-lg flex-shrink-0">📄</div>
                      <div className="flex-1 min-w-0"><div className="text-xs font-bold text-slate-800 truncate" dir="ltr">{openObj.attachment.name}</div><div className="text-[10px] text-slate-400">{openObj.attachment.size}</div></div>
                      <button onClick={downloadFile} className="px-3 py-1.5 rounded-lg text-xs font-black text-white flex-shrink-0" style={{ background: '#dc2626' }}>⬇️ {ar ? 'تنزيل' : 'Download'}</button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">{ar ? '💡 لاحظ الامتداد المزدوج ‎.pdf.exe‎ — يبدو ملف PDF لكنه في الحقيقة برنامج تنفيذي. هذا فخّ.' : '💡 Notice the double extension .pdf.exe — it looks like a PDF but is really an executable. It’s a trap.'}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}
