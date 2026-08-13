import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, RotateCcw, MessageSquare, Shuffle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Explanation from '../components/Explanation'

const EN_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const AR_ALPHA = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'

// ── Cipher logic ──────────────────────────────────────────────

function encryptText(text, shift, mode) {
  if (mode === 'ar') {
    const n = AR_ALPHA.length
    return text.split('').map(c => {
      const idx = AR_ALPHA.indexOf(c)
      return idx !== -1 ? AR_ALPHA[(idx + shift + n) % n] : c
    }).join('')
  }
  return text.split('').map(c => {
    if (/[A-Z]/.test(c)) return EN_ALPHA[(c.charCodeAt(0) - 65 + shift + 26) % 26]
    if (/[a-z]/.test(c)) return EN_ALPHA[(c.charCodeAt(0) - 97 + shift + 26) % 26].toLowerCase()
    return c
  }).join('')
}

function decryptText(text, shift, mode) {
  const n = mode === 'ar' ? AR_ALPHA.length : 26
  return encryptText(text, n - (shift % n), mode)
}

function getBreakdown(text, shift, mode) {
  if (mode === 'ar') {
    const n = AR_ALPHA.length
    return text.split('').slice(0, 12).map(char => {
      const idx = AR_ALPHA.indexOf(char)
      if (idx !== -1) return { original: char, result: AR_ALPHA[(idx + shift) % n], isLetter: true }
      return { original: char, result: char, isLetter: false }
    })
  }
  return text.toUpperCase().split('').slice(0, 12).map(char => {
    if (/[A-Z]/.test(char)) {
      return { original: char, result: EN_ALPHA[(char.charCodeAt(0) - 65 + shift) % 26], isLetter: true }
    }
    return { original: char, result: char, isLetter: false }
  })
}

// ── Redesigned Cipher Wheel ────────────────────────────────────

function CipherWheel({ shift, mode }) {
  const alpha = mode === 'ar' ? AR_ALPHA : EN_ALPHA
  const N = alpha.length
  const cx = 170, cy = 170, size = 340

  const R_OUTER = 158   // outer edge of outer (white) ring
  const R_MID = 120     // boundary between outer and inner rings
  const R_INNER = 48    // inner edge of inner (brown) ring

  const outerLetterR = (R_OUTER + R_MID) / 2   // ≈ 139
  const innerLetterR = (R_MID + R_INNER) / 2   // ≈ 84

  const fontFam = mode === 'ar'
    ? 'system-ui, -apple-system, Arial, sans-serif'
    : '"Courier New", Courier, monospace'

  const outerFontSize = N > 26 ? '12' : '13'
  const innerFontSize = N > 26 ? '11' : '13'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto max-w-full">
      {/* Subtle drop shadow ring */}
      <circle cx={cx} cy={cy} r={R_OUTER + 4} fill="#edf2f7" />

      {/* Outer ring — white */}
      <circle cx={cx} cy={cy} r={R_OUTER} fill="white" />

      {/* Inner ring — stone/brown like a real cipher wheel */}
      <circle cx={cx} cy={cy} r={R_MID} fill="#9c8468" />

      {/* Center circle — white */}
      <circle cx={cx} cy={cy} r={R_INNER} fill="white" />

      {/* Outer ring dividers */}
      {Array.from({ length: N }, (_, i) => {
        const angle = (i / N) * Math.PI * 2 - Math.PI / 2
        return (
          <line key={`od${i}`}
            x1={cx + R_MID * Math.cos(angle)} y1={cy + R_MID * Math.sin(angle)}
            x2={cx + R_OUTER * Math.cos(angle)} y2={cy + R_OUTER * Math.sin(angle)}
            stroke="#e2e8f0" strokeWidth="1"
          />
        )
      })}

      {/* Inner ring dividers */}
      {Array.from({ length: N }, (_, i) => {
        const angle = (i / N) * Math.PI * 2 - Math.PI / 2
        return (
          <line key={`id${i}`}
            x1={cx + (R_INNER + 1) * Math.cos(angle)} y1={cy + (R_INNER + 1) * Math.sin(angle)}
            x2={cx + (R_MID - 1) * Math.cos(angle)} y2={cy + (R_MID - 1) * Math.sin(angle)}
            stroke="#7a6245" strokeWidth="0.8"
          />
        )
      })}

      {/* Ring border lines */}
      <circle cx={cx} cy={cy} r={R_OUTER} fill="none" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={R_MID} fill="none" stroke="#a89070" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={R_INNER} fill="none" stroke="#6366f1" strokeWidth="2.5" />

      {/* Outer letters — plain alphabet (fixed) */}
      {alpha.split('').map((letter, i) => {
        const angle = (i / N) * Math.PI * 2 - Math.PI / 2
        const x = cx + outerLetterR * Math.cos(angle)
        const y = cy + outerLetterR * Math.sin(angle)
        const isFirst = i === 0
        return (
          <text key={`o${i}`} x={x} y={y}
            textAnchor="middle" dominantBaseline="central"
            fontSize={isFirst ? '14' : outerFontSize}
            fontWeight={isFirst ? 'bold' : 'normal'}
            fill={isFirst ? '#1e293b' : '#475569'}
            fontFamily={fontFam}
          >
            {letter}
          </text>
        )
      })}

      {/* Inner letters — cipher alphabet (shifted) */}
      {alpha.split('').map((_, i) => {
        const angle = (i / N) * Math.PI * 2 - Math.PI / 2
        const x = cx + innerLetterR * Math.cos(angle)
        const y = cy + innerLetterR * Math.sin(angle)
        const cipherLetter = alpha[(i + shift) % N]
        const isFirst = i === 0
        return (
          <text key={`in${i}`} x={x} y={y}
            textAnchor="middle" dominantBaseline="central"
            fontSize={isFirst ? '14' : innerFontSize}
            fontWeight={isFirst ? 'bold' : 'normal'}
            fill={isFirst ? '#fefce8' : '#e8d8b8'}
            fontFamily={fontFam}
          >
            {cipherLetter}
          </text>
        )
      })}

      {/* Top pointer arrow */}
      <polygon
        points={`${cx},${cy - R_OUTER - 3} ${cx - 7},${cy - R_OUTER + 11} ${cx + 7},${cy - R_OUTER + 11}`}
        fill="#f59e0b"
      />

      {/* Center — shift number */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fontSize="18" fontWeight="bold" fill="#6366f1" fontFamily='"Courier New", monospace'>
        +{shift}
      </text>
    </svg>
  )
}

// ── Challenge data ─────────────────────────────────────────────

const EN_CHALLENGES = [
  { id: 1, typeAr: 'شفّر', typeEn: 'Encrypt', textAr: 'HELLO بالإزاحة 3', textEn: 'HELLO with shift 3', shift: 3, answer: 'KHOOR', hintAr: 'H+3=K, E+3=H, L+3=O, L+3=O, O+3=R', hintEn: 'H+3=K, E+3=H, L+3=O, L+3=O, O+3=R' },
  { id: 2, typeAr: 'فكّ تشفير', typeEn: 'Decrypt', textAr: 'KHOOR بالإزاحة 3', textEn: 'KHOOR with shift 3', shift: 3, answer: 'HELLO', hintAr: 'K-3=H, H-3=E, O-3=L, O-3=L, R-3=O', hintEn: 'K-3=H, H-3=E, O-3=L, O-3=L, R-3=O' },
  { id: 3, typeAr: 'شفّر', typeEn: 'Encrypt', textAr: 'CAT بالإزاحة 1', textEn: 'CAT with shift 1', shift: 1, answer: 'DBU', hintAr: 'C+1=D, A+1=B, T+1=U', hintEn: 'C+1=D, A+1=B, T+1=U' },
]

// Arabic alphabet indices: ا=0 ب=1 ت=2 ث=3 ج=4 ح=5 خ=6 د=7 ذ=8 ر=9 ز=10
//   س=11 ش=12 ص=13 ض=14 ط=15 ظ=16 ع=17 غ=18 ف=19 ق=20 ك=21 ل=22 م=23 ن=24 ه=25 و=26 ي=27
// "كتب" + shift3: ك(21)→ن(24), ت(2)→ح(5), ب(1)→ج(4) = "نحج"
// "باب" + shift2: ب(1)→ث(3), ا(0)→ت(2), ب(1)→ث(3)  = "ثتث"
const AR_CHALLENGES = [
  { id: 1, typeAr: 'شفّر', typeEn: 'Encrypt', textAr: '"كتب" بالإزاحة 3', textEn: '"كتب" with shift 3', shift: 3, answer: 'نحج', hintAr: 'ك→ن، ت→ح، ب→ج', hintEn: 'ك→ن، ت→ح، ب→ج' },
  { id: 2, typeAr: 'فكّ تشفير', typeEn: 'Decrypt', textAr: '"نحج" بالإزاحة 3', textEn: '"نحج" with shift 3', shift: 3, answer: 'كتب', hintAr: 'ن-3=ك، ح-3=ت، ج-3=ب', hintEn: 'ن-3=ك، ح-3=ت، ج-3=ب' },
  { id: 3, typeAr: 'شفّر', typeEn: 'Encrypt', textAr: '"باب" بالإزاحة 2', textEn: '"باب" with shift 2', shift: 2, answer: 'ثتث', hintAr: 'ب→ث، ا→ت، ب→ث', hintEn: 'ب→ث، ا→ت، ب→ث' },
]

const EN_RANDOM_WORDS = ['HELLO', 'WORLD', 'SECRET', 'CIPHER', 'CODE', 'APPLE', 'SCHOOL', 'PYTHON', 'HACKER', 'BRAVE']
const AR_RANDOM_WORDS = ['كتب', 'باب', 'سلام', 'نور', 'بحر', 'ليل', 'قمر', 'شمس', 'ماء', 'نهر']

// ── Cipher Table (letters + numbers) ───────────────────────────

function CipherTable({ shift, mode, isArabic }) {
  const alpha = mode === 'ar' ? AR_ALPHA : EN_ALPHA
  const N = alpha.length
  const font = mode === 'ar' ? { fontFamily: 'Cairo, sans-serif' } : undefined
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto pb-1" dir="ltr">
        <div className="flex gap-1 min-w-max justify-center">
          {alpha.split('').map((ch, i) => {
            const ci = (i + shift + N) % N
            return (
              <div key={i} className="flex flex-col items-center rounded-lg overflow-hidden border border-slate-200 text-center" style={{ minWidth: 32 }}>
                <div className="w-full bg-slate-100 text-slate-700 font-bold text-sm py-1" style={font}>{ch}</div>
                <div className="w-full bg-white text-slate-400 text-[10px] font-mono py-0.5 border-y border-slate-100">{i}</div>
                <div className="w-full bg-amber-50 text-amber-700 font-black text-sm py-1" style={font}>{alpha[ci]}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 inline-block" />{isArabic ? 'الحرف' : 'letter'}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border border-slate-200 inline-block" />{isArabic ? 'رقمه' : 'number'}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-50 border border-amber-200 inline-block" />{isArabic ? 'المشفّر' : 'cipher'}</span>
      </div>
      <div className="bg-slate-800 text-green-300 rounded-lg px-3 py-2 text-center font-mono text-sm" dir="ltr">
        cipher = ( number + {shift} ) mod {N}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────

export default function Page7Cipher() {
  const navigate = useNavigate()
  const { lang, cipherShift, setCipherShift } = useApp()

  const [cipherMode, setCipherMode] = useState('en')  // 'en' | 'ar'
  const [view, setView] = useState('wheel')            // 'wheel' | 'table'
  const [plainText, setPlainText] = useState('HELLO')
  const [cipherText, setCipherText] = useState(() => encryptText('HELLO', 0, 'en'))
  const [challengeIdx, setChallengeIdx] = useState(0)
  const [challengeInput, setChallengeInput] = useState('')
  const [challengeResult, setChallengeResult] = useState(null)

  const challenges = cipherMode === 'ar' ? AR_CHALLENGES : EN_CHALLENGES
  const randomWords = cipherMode === 'ar' ? AR_RANDOM_WORDS : EN_RANDOM_WORDS

  const switchMode = (newMode) => {
    setCipherMode(newMode)
    setChallengeIdx(0)
    setChallengeInput('')
    setChallengeResult(null)
    if (newMode === 'ar') {
      setPlainText('كتب')
      setCipherText(encryptText('كتب', cipherShift, 'ar'))
    } else {
      setPlainText('HELLO')
      setCipherText(encryptText('HELLO', cipherShift, 'en'))
    }
  }

  const handlePlainChange = (val) => {
    setPlainText(val)
    setCipherText(encryptText(val, cipherShift, cipherMode))
  }

  const handleCipherChange = (val) => {
    setCipherText(val)
    setPlainText(decryptText(val, cipherShift, cipherMode))
  }

  const setShift = (val) => {
    const n = cipherMode === 'ar' ? AR_ALPHA.length : 26
    const newShift = ((val % n) + n) % n
    setCipherShift(newShift)
    setCipherText(encryptText(plainText, newShift, cipherMode))
  }

  const checkChallenge = () => {
    const ch = challenges[challengeIdx]
    setChallengeResult(challengeInput.trim() === ch.answer)
  }

  const nextChallenge = () => {
    setChallengeIdx(i => (i + 1) % challenges.length)
    setChallengeInput('')
    setChallengeResult(null)
  }

  const randomWord = () => {
    const word = randomWords[Math.floor(Math.random() * randomWords.length)]
    handlePlainChange(word)
  }

  const breakdown = getBreakdown(plainText, cipherShift, cipherMode)
  const ch = challenges[challengeIdx]
  const isArabic = cipherMode === 'ar'

  const T = {
    ar: {
      lesson: 'درس ٧', title: 'Shift Cipher — تشفير الإزاحة',
      subtitle: 'يُستخدم Shift Cipher لإخفاء الرسائل عن طريق تحريك الحروف بعدد معين من الخطوات',
      example: 'مثال إنجليزي: A → D (إزاحة 3) • HELLO → KHOOR',
      exampleAr: 'مثال عربي: ب → ه (إزاحة 3) • كتب → نحج',
      wheelTitle: 'عجلة الشيفرة',
      outerRing: 'الحلقة الخارجية: الحرف الأصلي',
      innerRing: 'الحلقة الداخلية: الحرف المشفر',
      shiftLabel: 'الإزاحة الحالية:',
      decrease: '−', increase: '+', reset: 'صفر',
      modeLabel: 'اختر الأبجدية:',
      plainLabel: 'النص الأصلي (Plain Text)',
      cipherLabel: 'النص المشفر (Cipher Text)',
      plainPlaceholder: 'اكتب النص هنا...',
      cipherPlaceholder: 'النص المشفر...',
      randomBtn: 'كلمة عشوائية',
      breakdownTitle: 'تحليل الحروف:',
      noBreakdown: 'اكتب نصاً للتحليل',
      arrow: '→',
      challengeTitle: '🎯 تحدي!',
      challengeNum: `تحدي ${challengeIdx + 1} من ${challenges.length}`,
      answerPlaceholder: 'إجابتك...',
      checkBtn: 'تحقق',
      nextBtn: 'التحدي التالي →',
      correct: '✅ إجابة صحيحة! ممتاز!',
      wrong: '❌ حاول مرة أخرى!',
      hint: 'تلميح:',
      chatBtn: 'جرب المحادثة المشفرة →',
      next: 'الدرس التالي: المحادثة المشفرة',
      modeEN: 'English',
      modeAR: 'عربي',
    },
    en: {
      lesson: 'Lesson 7', title: 'Shift Cipher',
      subtitle: 'Shift Cipher hides messages by shifting each letter by a fixed number of steps',
      example: 'English example: A → D (shift 3) • HELLO → KHOOR',
      exampleAr: 'Arabic example: ب → ه (shift 3) • كتب → نحج',
      wheelTitle: 'Cipher Wheel',
      outerRing: 'Outer ring: plain letter',
      innerRing: 'Inner ring: cipher letter',
      shiftLabel: 'Current shift:',
      decrease: '−', increase: '+', reset: 'Reset',
      modeLabel: 'Choose alphabet:',
      plainLabel: 'Plain Text',
      cipherLabel: 'Cipher Text',
      plainPlaceholder: 'Type text here...',
      cipherPlaceholder: 'Encrypted text...',
      randomBtn: 'Random Word',
      breakdownTitle: 'Letter breakdown:',
      noBreakdown: 'Type text to see breakdown',
      arrow: '→',
      challengeTitle: '🎯 Challenge!',
      challengeNum: `Challenge ${challengeIdx + 1} of ${challenges.length}`,
      answerPlaceholder: 'Your answer...',
      checkBtn: 'Check',
      nextBtn: 'Next Challenge →',
      correct: '✅ Correct! Excellent!',
      wrong: '❌ Try again!',
      hint: 'Hint:',
      chatBtn: 'Try Encrypted Chat →',
      next: 'Next: Encrypted Chat',
      modeEN: 'English',
      modeAR: 'عربي',
    }
  }
  const t = T[lang]

  return (
    <div className="page-transition max-w-6xl mx-auto px-4 py-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <span className="bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{t.lesson}</span>
        <h1 className="text-3xl font-black text-slate-800 mt-2 mb-2">{t.title}</h1>
      </div>

      <div className="grid grid-cols-12 gap-5 mb-6">
        {/* Left: Cipher Wheel */}
        <div className="col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">

            {/* Alphabet mode toggle */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-slate-500 font-medium">{t.modeLabel}</span>
              <div className="flex gap-1.5 bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => switchMode('en')}
                  className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${
                    cipherMode === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t.modeEN}
                </button>
                <button
                  onClick={() => switchMode('ar')}
                  className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${
                    cipherMode === 'ar' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t.modeAR}
                </button>
              </div>
            </div>

            {/* View toggle: wheel vs table */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-slate-500 font-medium">{lang === 'ar' ? 'العرض:' : 'View:'}</span>
              <div className="flex gap-1.5 bg-slate-100 rounded-xl p-1">
                <button onClick={() => setView('wheel')} className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${view === 'wheel' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {lang === 'ar' ? '🎡 العجلة' : '🎡 Wheel'}
                </button>
                <button onClick={() => setView('table')} className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${view === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {lang === 'ar' ? '🔢 الجدول' : '🔢 Table'}
                </button>
              </div>
            </div>

            <h2 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
              <span>{view === 'wheel' ? '⚙️' : '🔢'}</span> {view === 'wheel' ? t.wheelTitle : (lang === 'ar' ? 'جدول التشفير (حروف وأرقام)' : 'Cipher table (letters & numbers)')}
              {isArabic && (
                <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {lang === 'ar' ? '٢٨ حرفاً عربياً' : '28 Arabic letters'}
                </span>
              )}
            </h2>

            {view === 'wheel' ? (
              <>
                <CipherWheel shift={cipherShift} mode={cipherMode} />
                <div className="mt-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1 justify-center">
                    <span className="w-3 h-3 rounded-full bg-slate-300 inline-block"></span>
                    <span className="text-xs text-slate-500">{t.outerRing}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    <span className="w-3 h-3 rounded-full inline-block" style={{background:'#9c8468'}}></span>
                    <span className="text-xs text-amber-700">{t.innerRing}</span>
                  </div>
                </div>
              </>
            ) : (
              <CipherTable shift={cipherShift} mode={cipherMode} isArabic={isArabic} />
            )}

            {/* Shift controls */}
            <div className="mt-4 flex items-center justify-center gap-3" dir="ltr">
              <button
                onClick={() => setShift(cipherShift - 1)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg transition-colors"
              >
                {t.decrease}
              </button>
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-400">{t.shiftLabel}</span>
                <span className="text-2xl font-black text-indigo-600">+{cipherShift}</span>
              </div>
              <button
                onClick={() => setShift(cipherShift + 1)}
                className="w-10 h-10 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-lg transition-colors"
              >
                {t.increase}
              </button>
              <button
                onClick={() => setShift(0)}
                className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-xl transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                {t.reset}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Encrypt/Decrypt + Challenge */}
        <div className="col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-700 text-sm">{lang === 'ar' ? 'التشفير وفك التشفير' : 'Encryption & Decryption'}</h2>
              <button onClick={randomWord} className="flex items-center gap-1.5 text-xs bg-violet-50 hover:bg-violet-100 text-violet-600 px-3 py-1.5 rounded-xl transition-colors">
                <Shuffle className="w-3.5 h-3.5" />
                {t.randomBtn}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">{t.plainLabel}</label>
                <textarea
                  value={plainText}
                  onChange={e => handlePlainChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none h-24"
                  placeholder={t.plainPlaceholder}
                  dir={isArabic ? 'rtl' : 'ltr'}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-indigo-600 block mb-1.5">{t.cipherLabel}</label>
                <textarea
                  value={cipherText}
                  onChange={e => handleCipherChange(e.target.value)}
                  className="w-full border border-indigo-200 rounded-xl p-3 text-sm font-mono text-indigo-700 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none h-24"
                  placeholder={t.cipherPlaceholder}
                  dir={isArabic ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            {/* Letter breakdown */}
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">{t.breakdownTitle}</p>
              {breakdown.length > 0 ? (
                <div className={`flex flex-wrap gap-2`} dir={isArabic ? 'rtl' : 'ltr'}>
                  {breakdown.map((item, i) => (
                    item.isLetter ? (
                      <div key={i} className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 min-w-[3rem]">
                        <span className="text-sm font-bold font-mono text-slate-700">{item.original}</span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="text-sm font-bold font-mono text-indigo-600">{item.result}</span>
                      </div>
                    ) : (
                      <div key={i} className="flex flex-col items-center bg-slate-50 border border-dashed border-slate-200 rounded-xl px-2 py-1.5 min-w-[2rem]">
                        <span className="text-sm font-mono text-slate-300">{item.original === ' ' ? '⎵' : item.original}</span>
                        <span className="text-xs text-slate-300">—</span>
                        <span className="text-sm font-mono text-slate-300">{item.result === ' ' ? '⎵' : item.result}</span>
                      </div>
                    )
                  ))}
                  {plainText.length > 12 && (
                    <div className="flex flex-col items-center justify-center text-slate-400 text-xs px-2">
                      +{plainText.length - 12}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-xs">{t.noBreakdown}</p>
              )}
            </div>
          </div>

          {/* Challenge */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-amber-800">{t.challengeTitle}</h3>
              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{t.challengeNum}</span>
            </div>

            <p className="text-amber-700 text-sm mb-1">
              <strong>{lang === 'ar' ? ch.typeAr : ch.typeEn}:</strong> {lang === 'ar' ? ch.textAr : ch.textEn}
            </p>

            <div className="flex gap-2 mt-3">
              <input
                value={challengeInput}
                onChange={e => setChallengeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkChallenge()}
                placeholder={t.answerPlaceholder}
                className="flex-1 border border-amber-300 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                dir={isArabic ? 'rtl' : 'ltr'}
              />
              <button onClick={checkChallenge} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors">
                {t.checkBtn}
              </button>
            </div>

            {challengeResult === true && (
              <div className="mt-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">{t.correct}</div>
            )}
            {challengeResult === false && (
              <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                {t.wrong} <span className="text-xs block mt-1">{t.hint} {lang === 'ar' ? ch.hintAr : ch.hintEn}</span>
              </div>
            )}
            {challengeResult !== null && (
              <button onClick={nextChallenge} className="mt-2 text-xs text-amber-700 hover:text-amber-900 font-medium">
                {t.nextBtn}
              </button>
            )}
          </div>
        </div>
      </div>

      <Explanation>
        <p className="text-slate-500 text-sm mb-3">{t.subtitle}</p>
        <div className="flex flex-wrap gap-2">
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-2 text-sm text-violet-700 font-medium inline-block">
            {t.example}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-700 font-medium inline-block">
            {t.exampleAr}
          </div>
        </div>
      </Explanation>

      <div className="flex justify-center items-center pt-6 mt-6 border-t border-slate-100">
        <button onClick={() => navigate('/')} className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">
          {lang === 'ar' ? '← الرئيسية' : '← Home'}
        </button>
      </div>
    </div>
  )
}
