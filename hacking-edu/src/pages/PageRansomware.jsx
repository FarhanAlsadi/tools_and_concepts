import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   RANSOMWARE SIMULATION (safe, in-page only)
   Flow: the student opens a Gmail-style inbox (navigable folders: Inbox, Spam,
   …), reads a booby-trapped email and downloads its attachment. The view then
   switches to their DESKTOP and the "files" get locked one by one. A ransom note
   with a countdown appears, followed by a multiple-choice question asking for
   their response — teaching that BACKUPS (not paying) are the real defense.
   ──────────────────────────────────────────────────────────────────────────── */

const INIT_FILES = [
  { name: 'صور_العائلة.jpg', en: 'family_photos.jpg', icon: '🖼️' },
  { name: 'الواجب.pdf',       en: 'homework.pdf',       icon: '📄' },
  { name: 'مشروعي.pptx',      en: 'my_project.pptx',    icon: '📊' },
  { name: 'حساباتي.xlsx',     en: 'accounts.xlsx',      icon: '📗' },
  { name: 'سيرتي_الذاتية.docx',en: 'resume.docx',        icon: '📝' },
  { name: 'أغنية.mp3',        en: 'song.mp3',           icon: '🎵' },
  { name: 'رحلة_قطر.jpg',     en: 'qatar_trip.jpg',     icon: '🏞️' },
  { name: 'ألعاب.zip',        en: 'games.zip',          icon: '🗜️' },
]

const PREVENT = [
  { icon: '💾', ar: 'خذ نسخة احتياطية دورية لملفاتك (سحابية أو قرص خارجي) — أهم دفاع على الإطلاق.', en: 'Back up your files regularly (cloud or an external disk) — the single most important defense.' },
  { icon: '📎', ar: 'لا تفتح مرفقاً أو رابطاً من مصدر مجهول أو غير متوقَّع.', en: "Never open an attachment or link from an unknown or unexpected source." },
  { icon: '🔄', ar: 'حدّث نظامك وبرامجك — الفدية تدخل غالباً عبر ثغرات قديمة.', en: 'Update your OS and apps — ransomware often enters through old vulnerabilities.' },
  { icon: '🚫', ar: 'لا تدفع الفدية: لا ضمان لاستعادة ملفاتك، وأنت تموّل المجرمين.', en: "Don't pay the ransom: no guarantee you'll get files back, and you fund the criminals." },
  { icon: '🛡️', ar: 'استخدم برنامج حماية محدّثاً يكشف سلوك التشفير المفاجئ.', en: 'Use up-to-date protection that detects sudden encryption behavior.' },
]

// Gmail-style folders (shown on the right in RTL).
const FOLDERS = [
  { key: 'inbox',   ar: 'الوارد',              en: 'Inbox',   icon: '📥' },
  { key: 'starred', ar: 'المميّزة بنجمة',       en: 'Starred', icon: '⭐' },
  { key: 'snoozed', ar: 'المؤجّلة',             en: 'Snoozed', icon: '⏰' },
  { key: 'sent',    ar: 'المُرسَلة',            en: 'Sent',    icon: '📤' },
  { key: 'drafts',  ar: 'المسودّات',            en: 'Drafts',  icon: '📄' },
  { key: 'spam',    ar: 'المزعجة (سبام)',        en: 'Spam',    icon: '⚠️' },
  { key: 'trash',   ar: 'المهملات',             en: 'Trash',   icon: '🗑️' },
]

// Mailboxes. The booby-trapped email lives in the Inbox.
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

export default function PageRansomware() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const ar = lang === 'ar'

  const [phase, setPhase]     = useState('email')  // email | desktop | encrypting | ransom | paid | restored | rebooted
  const [folder, setFolder]   = useState('inbox')  // active Gmail folder
  const [openMail, setOpenMail] = useState(null)   // id of the opened email (null = list view)
  const [locked, setLocked]   = useState(() => INIT_FILES.map(() => false))
  const [secs, setSecs]       = useState(71 * 3600 + 59 * 60 + 59)
  const timers = useRef([])
  const tick   = useRef(null)

  useEffect(() => () => { timers.current.forEach(clearTimeout); clearInterval(tick.current) }, [])

  const lockedCount = locked.filter(Boolean).length
  const filesLight  = phase === 'desktop' || phase === 'restored'
  const num         = n => (ar ? Number(n).toLocaleString('ar-EG') : String(n))
  const mailList    = MAIL[folder] || []
  const openObj     = openMail ? mailList.find(m => m.id === openMail) : null
  const inboxUnread = MAIL.inbox.filter(m => m.unread).length

  // Download + open the attachment → land on the desktop, then encrypt slowly.
  const downloadFile = () => {
    if (phase !== 'email') return
    setPhase('desktop')                         // switch to the desktop, files still intact
    timers.current.push(setTimeout(() => {
      setPhase('encrypting')                    // then the malware starts locking files one by one
      INIT_FILES.forEach((_, i) => {
        timers.current.push(setTimeout(() => {
          setLocked(prev => { const n = [...prev]; n[i] = true; return n })
          if (i === INIT_FILES.length - 1) {
            timers.current.push(setTimeout(() => {
              setPhase('ransom')
              tick.current = setInterval(() => setSecs(s => (s > 0 ? s - 1 : 0)), 1000)
            }, 600))
          }
        }, 500 * (i + 1)))
      })
    }, 900))
  }

  const respond = (which) => {
    clearInterval(tick.current)
    if (which === 'restored') setLocked(INIT_FILES.map(() => false))
    setPhase(which)
  }

  const restart = () => {
    timers.current.forEach(clearTimeout); timers.current = []; clearInterval(tick.current)
    setPhase('email'); setFolder('inbox'); setOpenMail(null)
    setLocked(INIT_FILES.map(() => false)); setSecs(71 * 3600 + 59 * 60 + 59)
  }

  const OUTCOME = {
    paid:     { ok: false, icon: '💸', titleAr: 'دفعت الفدية… وخسرت', titleEn: 'You paid… and lost', bodyAr: 'أرسلت المال، لكن نصف الضحايا لا يستعيدون ملفاتهم حتى بعد الدفع — وأنت الآن موّلت عصابة إجرامية وأصبحت هدفاً سهلاً مرة أخرى. الملفات ما زالت مقفلة.', bodyEn: 'You sent the money, but half of victims never get their files back even after paying — and you just funded a criminal gang and became an easy target again. The files are still locked.' },
    restored: { ok: true,  icon: '💾', titleAr: 'استعدت ملفاتك — أحسنت!', titleEn: 'You restored your files — well done!', bodyAr: 'فصلت الجهاز عن الشبكة لإيقاف الانتشار، ثم مسحت النظام واستعدت كل ملفاتك من نسخة الأمس الاحتياطية. لم تدفع فلساً واحداً. النسخة الاحتياطية أنقذتك.', bodyEn: "You disconnected from the network to stop the spread, wiped the system, and restored every file from yesterday's backup. You paid nothing. The backup saved you." },
    rebooted: { ok: false, icon: '🔌', titleAr: 'أعدت التشغيل فقط — الملفات ما زالت مقفلة', titleEn: 'You just rebooted — files still locked', bodyEn: 'Rebooting does nothing: the files are encrypted with a key only the attacker has. Without a backup, they are gone. This is why backups matter.', bodyAr: 'إعادة التشغيل لا تفعل شيئاً: الملفات مشفّرة بمفتاح لدى المهاجم فقط. بدون نسخة احتياطية، فقدتها. لهذا النُّسخ الاحتياطية مهمة.' },
  }

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-5">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#fee2e2', color: '#b91c1c' }}>{ar ? '🧪 محاكاة آمنة' : '🧪 Safe simulation'}</span>
        <h1 className="text-2xl font-black text-slate-800 mt-2 mb-1">🔒 {ar ? 'محاكاة برامج الفدية' : 'Ransomware Simulation'}</h1>
      </div>

      {/* ── Phase 1: Gmail-style inbox ────────────────────────────────── */}
      {phase === 'email' && (
        <div className="rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm bg-white">
          {/* top bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200">
            <span className="text-slate-500 text-lg">☰</span>
            <span className="flex items-center gap-1.5 font-bold text-slate-700 text-lg">
              <span style={{ color: '#EA4335' }}>✉️</span><span className="hidden sm:inline">{ar ? 'البريد' : 'Mail'}</span>
            </span>
            <div className="flex-1 mx-1">
              <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-slate-400 text-sm" style={{ background: '#eaf1fb' }}>🔍 <span className="truncate">{ar ? 'ابحث في البريد' : 'Search mail'}</span></div>
            </div>
            <span className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#1a73e8' }}>{ar ? 'أ' : 'A'}</span>
          </div>

          <div className="flex" style={{ minHeight: 400 }}>
            {/* sidebar — first child so it sits on the RIGHT in RTL */}
            <div className="w-36 sm:w-44 flex-shrink-0 py-3 px-2">
              <button className="flex items-center gap-2 px-4 py-2.5 mb-3 rounded-2xl shadow-sm font-bold text-sm text-slate-700" style={{ background: '#c2e7ff' }}>
                <span className="text-lg">✏️</span>{ar ? 'إنشاء' : 'Compose'}
              </button>
              <div className="space-y-0.5">
                {FOLDERS.map(f => {
                  const active = folder === f.key
                  const count = (MAIL[f.key] || []).filter(m => m.unread).length
                  return (
                    <button
                      key={f.key}
                      onClick={() => { setFolder(f.key); setOpenMail(null) }}
                      className={`w-full flex items-center gap-3 px-4 py-1.5 rounded-full text-sm text-start transition-colors ${active ? 'font-bold' : 'text-slate-700 hover:bg-slate-100'}`}
                      style={active ? { background: '#fde3e1', color: '#c5221f' } : undefined}
                    >
                      <span className="text-base flex-shrink-0">{f.icon}</span>
                      <span className="flex-1 truncate">{ar ? f.ar : f.en}</span>
                      {count > 0 && <span className="text-xs font-bold flex-shrink-0">{num(count)}</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* main area — email list or opened email */}
            <div className="flex-1 min-w-0 border-s border-slate-200 bg-white">
              {!openObj ? (
                mailList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-2" style={{ minHeight: 400 }}>
                    <span className="text-4xl">📭</span>
                    <span className="text-sm">{ar ? 'لا توجد رسائل هنا' : 'No messages here'}</span>
                  </div>
                ) : (
                  <div>
                    {mailList.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setOpenMail(m.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 border-b border-slate-100 text-start hover:bg-slate-50 transition-colors ${m.unread ? 'bg-white' : 'bg-slate-50/60'}`}
                      >
                        <span className="text-slate-300 flex-shrink-0">☆</span>
                        <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: m.avatarBg }}>{m.initials}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm truncate ${m.unread ? 'font-black text-slate-900' : 'text-slate-600'}`}>{ar ? m.from : m.fromEn}</span>
                            {m.danger && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0" style={{ background: '#fee2e2', color: '#b91c1c' }}>{ar ? 'مشبوهة' : 'suspicious'}</span>}
                          </div>
                          <div className={`text-xs truncate ${m.unread ? 'font-bold text-slate-700' : 'text-slate-500'}`}>
                            {ar ? m.subj : m.subjEn} <span className="text-slate-400 font-normal">— {ar ? m.preview : m.previewEn}</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 flex-shrink-0">{ar ? m.time : m.timeEn}</span>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                /* opened email */
                <div className="p-4">
                  <button onClick={() => setOpenMail(null)} className="text-slate-500 text-sm mb-3 flex items-center gap-1 hover:text-slate-800">↩ {ar ? 'رجوع' : 'Back'}</button>
                  <h2 className="text-lg font-black text-slate-800">{ar ? openObj.subj : openObj.subjEn}{folder === 'spam' && ' ⚠️'}</h2>
                  <div className="flex items-center gap-3 mt-3 pb-3 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-black flex-shrink-0" style={{ background: openObj.avatarBg }}>{openObj.initials}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-800">{ar ? openObj.from : openObj.fromEn}</div>
                      <div className="text-xs text-slate-500 font-mono truncate" dir="ltr">{openObj.addr}</div>
                    </div>
                    <div className="text-[11px] text-slate-400 flex-shrink-0">{ar ? openObj.time : openObj.timeEn}</div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mt-3" style={{ whiteSpace: 'pre-line' }}>{ar ? openObj.body : openObj.bodyEn}</p>

                  {openObj.attachment && (
                    <>
                      <div className="mt-4 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl flex-shrink-0">📄</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-800 truncate" dir="ltr">{openObj.attachment.name}</div>
                          <div className="text-xs text-slate-400">{openObj.attachment.size}</div>
                        </div>
                        <button onClick={downloadFile} className="px-4 py-2 rounded-xl text-sm font-black text-white flex-shrink-0" style={{ background: '#dc2626' }}>⬇️ {ar ? 'تنزيل' : 'Download'}</button>
                      </div>
                      <p className="text-xs text-slate-400 mt-3">{ar ? '💡 لاحظ الامتداد المزدوج ‎.pdf.exe‎ — يبدو ملف PDF لكنه في الحقيقة برنامج تنفيذي. هذا فخّ (نزّله بأمان لترى العاقبة).' : '💡 Notice the double extension .pdf.exe — it looks like a PDF but is really an executable. It’s a trap (download it safely to see the consequence).'}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop with files — appears once the attachment is opened ── */}
      {phase !== 'email' && (
        <div className="rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm" style={{ background: filesLight ? '#eef2f7' : '#1a0d0d' }}>
          <div className="px-4 py-2 flex items-center justify-between" style={{ background: filesLight ? '#0E1F39' : '#7f1d1d' }}>
            <span className="text-white text-xs font-bold">🖥️ {ar ? 'سطح المكتب — ملفاتي' : 'Desktop — My Files'}</span>
            <span className="text-white text-xs font-mono">{lockedCount}/{INIT_FILES.length} {ar ? 'مقفل' : 'locked'}</span>
          </div>
          <div className="grid grid-cols-4 gap-3 p-4">
            {INIT_FILES.map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-1" style={{ transition: 'all .3s' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: locked[i] ? '#450a0a' : 'white', border: locked[i] ? '1px solid #b91c1c' : '1px solid #e2e8f0', transform: locked[i] ? 'scale(0.96)' : 'none' }}>
                  {locked[i] ? '🔒' : f.icon}
                </div>
                <span className="text-[10px] font-mono leading-tight break-all" style={{ color: locked[i] ? '#fca5a5' : '#64748b' }}>
                  {locked[i] ? ((ar ? f.name : f.en) + '.locked') : (ar ? f.name : f.en)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'encrypting' && (
        <div className="mt-4 text-center bg-red-950 rounded-2xl p-4">
          <div className="text-red-300 font-black text-sm animate-pulse">🔒 {ar ? 'جارٍ تشفير ملفاتك…' : 'Encrypting your files…'}</div>
          <div className="mt-2 h-2 bg-red-900 rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${(lockedCount / INIT_FILES.length) * 100}%` }} /></div>
        </div>
      )}

      {/* Ransom note */}
      {phase === 'ransom' && (
        <>
          <div className="mt-4 rounded-2xl border-2 border-red-600 bg-black p-6 text-center" style={{ boxShadow: '0 0 0 3px rgba(220,38,38,0.25)' }}>
            <div className="text-5xl mb-2">☠️</div>
            <h2 className="text-xl font-black text-red-500">{ar ? 'ملفاتك مشفّرة!' : 'YOUR FILES ARE ENCRYPTED!'}</h2>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed max-w-md mx-auto">
              {ar ? 'كل مستنداتك وصورك مقفلة بتشفير قوي. لاستعادتها، ادفع ٠.٠٥ بيتكوين خلال المهلة، وإلا ستُحذف نهائياً.'
                  : 'All your documents and photos are locked with strong encryption. To recover them, pay 0.05 BTC before the timer ends, or they will be deleted forever.'}
            </p>
            <div className="mt-3 inline-block bg-red-950 border border-red-700 rounded-xl px-5 py-2">
              <div className="text-[10px] text-red-400 font-bold">{ar ? 'الوقت المتبقّي' : 'TIME LEFT'}</div>
              <div className="text-2xl font-mono font-black text-red-400 tracking-widest">{fmtTime(secs)}</div>
            </div>
            <div className="mt-3 text-xs font-mono text-slate-500 break-all" dir="ltr">BTC: 1A2b3C4d5E6f7G8h9I0jK1l2M3n4O5p6Q7</div>
          </div>

          {/* Multiple-choice question — separated from the ransom note */}
          <div className="mt-4 bg-white rounded-2xl border-2 border-slate-200 p-5">
            <h3 className="text-base font-black text-slate-800 mb-1">❓ {ar ? 'ما ردّك الصحيح على هذا الهجوم؟' : 'What is your correct response to this attack?'}</h3>
            <p className="text-xs text-slate-500 mb-4">{ar ? 'اختر إجابة واحدة:' : 'Choose one answer:'}</p>
            <div className="space-y-2.5">
              {[
                { key: 'paid',     letter: ar ? 'أ' : 'A', emoji: '💸', label: ar ? 'ادفع الفدية' : 'Pay the ransom' },
                { key: 'restored', letter: ar ? 'ب' : 'B', emoji: '💾', label: ar ? 'افصل الشبكة واستعد نسخة احتياطية' : 'Disconnect + restore backup' },
                { key: 'rebooted', letter: ar ? 'ج' : 'C', emoji: '🔌', label: ar ? 'أعد تشغيل الجهاز فقط' : 'Just reboot' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => respond(opt.key)}
                  className="w-full flex items-center gap-3 text-start p-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 hover:border-red-400 hover:bg-red-50 transition-all"
                >
                  <span className="w-7 h-7 rounded-full bg-slate-800 text-white text-sm font-black flex items-center justify-center flex-shrink-0">{opt.letter}</span>
                  <span className="text-xl flex-shrink-0">{opt.emoji}</span>
                  <span className="text-sm font-bold text-slate-800">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Outcome */}
      {(phase === 'paid' || phase === 'restored' || phase === 'rebooted') && (
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
      )}

      {/* explanation — collapsed by default, sits under the practical part */}
      <Explanation>
        <p className="text-slate-500 text-sm leading-relaxed">
          {ar ? 'برنامج الفدية يشفّر كل ملفاتك ويطلب مالاً لفكّها. جرّب السيناريو بأمان: تصفّح البريد وافتح الرسالة المشبوهة ونزّل مرفقها، شاهد ملفاتك تُقفَل على سطح المكتب واحداً تلو الآخر — ثم أجب عن السؤال باختيار ردّك الصحيح.'
              : 'Ransomware encrypts all your files and demands money to unlock them. Try the scenario safely: browse the inbox, open the suspicious email and download its attachment, watch your desktop files lock one by one — then answer the question by choosing your correct response.'}
        </p>
      </Explanation>
    </div>
  )
}
