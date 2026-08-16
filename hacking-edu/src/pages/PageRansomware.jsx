import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   RANSOMWARE SIMULATION (safe, in-page only)
   Flow: the student sees an EMAIL inbox with a booby-trapped attachment. When
   they download it, the view switches to their DESKTOP and the "files" get
   locked one by one. A ransom note with a countdown appears, and then a
   multiple-choice question asks for their response — teaching that BACKUPS (not
   paying) are the real defense.
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
  const [locked, setLocked]   = useState(() => INIT_FILES.map(() => false))
  const [secs, setSecs]       = useState(71 * 3600 + 59 * 60 + 59)
  const timers = useRef([])
  const tick   = useRef(null)

  useEffect(() => () => { timers.current.forEach(clearTimeout); clearInterval(tick.current) }, [])

  const lockedCount = locked.filter(Boolean).length
  const filesLight  = phase === 'desktop' || phase === 'restored'

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
    setPhase('email'); setLocked(INIT_FILES.map(() => false)); setSecs(71 * 3600 + 59 * 60 + 59)
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

      {/* ── Phase 1: EMAIL inbox — the victim receives a message with an attachment ── */}
      {phase === 'email' && (
        <div className="rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm bg-white">
          <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: '#0E1F39' }}>
            <span className="text-white text-sm font-bold">📥 {ar ? 'البريد الوارد' : 'Inbox'}</span>
            <span className="text-white/60 text-xs">{ar ? 'رسالة واحدة غير مقروءة' : '1 unread'}</span>
          </div>

          <div className="p-5">
            {/* sender row */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black flex-shrink-0">HR</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-slate-800">{ar ? 'قسم الموارد البشرية' : 'HR Department'}</div>
                <div className="text-xs text-slate-500 font-mono truncate" dir="ltr">hr@company-qa.com</div>
              </div>
              <div className="text-[11px] text-slate-400 flex-shrink-0">{ar ? 'الآن' : 'now'}</div>
            </div>

            {/* subject + body */}
            <h2 className="text-base font-black text-slate-800 mt-3">{ar ? '📎 ملف مهم — يرجى مراجعته فوراً' : '📎 Important file — please review immediately'}</h2>
            <p className="text-sm text-slate-600 leading-relaxed mt-2" style={{ whiteSpace: 'pre-line' }}>
              {ar ? 'مرحباً،\nمرفق مستند مهم يخص حسابك ويتطلب مراجعتك العاجلة. يرجى تنزيل الملف وفتحه اليوم قبل انتهاء المهلة.\nمع التحية.'
                  : 'Hello,\nAttached is an important document about your account that needs your urgent review. Please download and open the file today before the deadline.\nRegards.'}
            </p>

            {/* attachment */}
            <div className="mt-4 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl flex-shrink-0">📄</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-800 truncate" dir="ltr">التقرير_المهم.pdf.exe</div>
                <div className="text-xs text-slate-400">248 KB</div>
              </div>
              <button onClick={downloadFile} className="px-4 py-2 rounded-xl text-sm font-black text-white flex-shrink-0" style={{ background: '#dc2626' }}>⬇️ {ar ? 'تنزيل' : 'Download'}</button>
            </div>

            <p className="text-xs text-slate-400 mt-3">{ar ? '💡 لاحظ الامتداد المزدوج ‎.pdf.exe‎ — يبدو ملف PDF لكنه في الحقيقة برنامج تنفيذي. هذا فخّ (نزّله بأمان لترى العاقبة).' : '💡 Notice the double extension .pdf.exe — it looks like a PDF but is really an executable. It’s a trap (download it safely to see the consequence).'}</p>
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
          {ar ? 'برنامج الفدية يشفّر كل ملفاتك ويطلب مالاً لفكّها. جرّب السيناريو بأمان: نزّل المرفق من البريد، شاهد ملفاتك تُقفَل على سطح المكتب واحداً تلو الآخر — ثم أجب عن السؤال باختيار ردّك الصحيح.'
              : 'Ransomware encrypts all your files and demands money to unlock them. Try the scenario safely: download the email attachment, watch your desktop files lock one by one — then answer the question by choosing your correct response.'}
        </p>
      </Explanation>
    </div>
  )
}
