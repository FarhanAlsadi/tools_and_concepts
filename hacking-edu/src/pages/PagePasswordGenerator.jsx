import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Key, ChevronLeft, AlertTriangle, Download } from 'lucide-react'
import LinuxTerminal from '../components/LinuxTerminal'
import Explanation from '../components/Explanation'

// ─── Fields collected interactively ──────────────────────────────────────────
const FIELDS = [
  { key: 'first',  ar: 'الاسم الأول',            en: 'First name',         ex: 'ahmed'    },
  { key: 'last',   ar: 'اسم العائلة',             en: 'Last name',          ex: 'ali'      },
  { key: 'year',   ar: 'سنة الميلاد',             en: 'Year of birth',      ex: '1998'     },
  { key: 'dob',    ar: 'يوم/شهر الميلاد (DD/MM)', en: 'Day/Month of birth', ex: '15/03'    },
  { key: 'num',    ar: 'رقم مميز',                en: 'Favourite number',   ex: '7'        },
  { key: 'pet',    ar: 'اسم حيوان أليف',          en: 'Pet name',           ex: 'fluffy'   },
  { key: 'city',   ar: 'مدينة الإقامة',           en: 'City',               ex: 'doha'     },
  { key: 'mother', ar: 'اسم الأم',                en: "Mother's name",      ex: 'sara'     },
  { key: 'nick',   ar: 'الكنية أو اللقب',         en: 'Nickname',           ex: 'abu_ali'  },
]

// ─── Password generator engine ────────────────────────────────────────────────
function generatePasswords({ first='', last='', year='', dob='', num='', pet='', city='', mother='', nick='' }) {
  // ── Helpers ────────────────────────────────────────────────────────────────
  const cap  = s => s ? s[0].toUpperCase() + s.slice(1) : ''
  const leet = s => s.replace(/a/gi,'4').replace(/e/gi,'3').replace(/i/gi,'1')
                      .replace(/o/gi,'0').replace(/s/gi,'5').replace(/t/gi,'7')
                      .replace(/b/gi,'8').replace(/g/gi,'9')
  const variants = raw => {
    if (!raw) return []
    const s = raw.trim().toLowerCase()
    if (!s) return []
    const c = cap(s)
    const u = s.toUpperCase()
    const lt = leet(s)
    const ltC = cap(lt)
    return [...new Set([s, c, u, lt, ltC])].filter(Boolean)
  }

  // ── Normalize inputs ───────────────────────────────────────────────────────
  const f  = first.trim().toLowerCase()
  const l  = last.trim().toLowerCase()
  const y  = year.trim()
  const y2 = y.slice(-2)
  const n  = num.trim()
  const dparts = dob.trim().split('/')
  const dd = (dparts[0] || '').padStart(2, '0')
  const mm = (dparts[1] || '').padStart(2, '0')
  const dobStr  = dd && mm ? dd + mm : ''         // "1503"
  const dobFull = dd && mm && y ? dd + mm + y : ''  // "15031998"
  const dobShort= dd && mm && y2 ? dd + mm + y2 : '' // "150398"

  // ── Token groups ───────────────────────────────────────────────────────────
  const nameVars   = variants(f)
  const lastVars   = variants(l)
  const petVars    = variants(pet.trim())
  const cityVars   = variants(city.trim())
  const motherVars = variants(mother.trim())
  const nickVars   = variants(nick.trim())

  // Combined name tokens (first+last permutations)
  const nameComboBase = []
  if (f && l) {
    nameComboBase.push(
      f+l, l+f, cap(f)+cap(l), cap(l)+cap(f),
      f+'_'+l, l+'_'+f, f+'.'+l, l+'.'+f, f+'-'+l, l+'-'+f,
      f[0]+l, l[0]+f, f+l[0], l+f[0],
      f[0]+'.'+l, f[0]+'_'+l,
      leet(f)+leet(l), leet(f+l),
    )
  }
  const nameComboVars = [...new Set([...nameComboBase, ...nameComboBase.map(cap)])]

  // All "word" tokens to use as bases
  const wordTokens = [
    ...nameVars,
    ...lastVars,
    ...nameComboVars,
    ...petVars,
    ...cityVars,
    ...motherVars,
    ...nickVars,
  ].filter(Boolean)

  // Number-like suffixes (year variants + num + dob)
  const numSuffixes = [...new Set([
    y, y2, n,
    dobStr, dobFull, dobShort, dd, mm,
    y && n ? y+n : '', y && n ? n+y : '',
    y2 && n ? y2+n : '', y2 && n ? n+y2 : '',
  ].filter(Boolean))]

  // Symbol suffixes
  const symSuffixes = ['!', '@', '#', '$', '_', '!!', '@!', '123!', '!123']

  // Common trailing patterns people add
  const commonSuffix = [
    '', '1', '12', '123', '1234', '12345', '123456',
    '!', '!!', '@', '@1', '@12', '@123',
    '#', '#1', '#123',
    '2020','2021','2022','2023','2024','2025',
    '_1', '_12', '_123',
  ]

  const seen = new Set()
  const result = []
  const add = v => {
    if (v && v.length >= 4 && !seen.has(v)) { seen.add(v); result.push(v) }
  }

  // ── 1. Each word token + common suffixes ──────────────────────────────────
  for (const w of wordTokens) {
    for (const s of commonSuffix) add(w + s)
    for (const s of commonSuffix) add(s + w)
  }

  // ── 2. Word token + number suffixes ───────────────────────────────────────
  for (const w of wordTokens) {
    for (const ns of numSuffixes) {
      add(w + ns)
      add(ns + w)
      for (const sym of symSuffixes) {
        add(w + ns + sym)
        add(sym + w + ns)
      }
    }
  }

  // ── 3. Word token + separator + number suffix ──────────────────────────────
  for (const w of wordTokens) {
    for (const sep of ['_', '.', '-', '@']) {
      for (const ns of numSuffixes) {
        add(w + sep + ns)
        add(ns + sep + w)
      }
    }
  }

  // ── 4. Two-word combinations ──────────────────────────────────────────────
  const shortWords = wordTokens.filter(w => w.length <= 8)
  for (let i = 0; i < shortWords.length; i++) {
    for (let j = 0; j < shortWords.length; j++) {
      if (i === j) continue
      const w1 = shortWords[i], w2 = shortWords[j]
      add(w1 + w2)
      for (const ns of numSuffixes) add(w1 + w2 + ns)
      for (const sep of ['_', '.', '-']) add(w1 + sep + w2)
      for (const sep of ['_', '.', '-']) {
        for (const ns of numSuffixes) add(w1 + sep + w2 + sep + ns)
      }
    }
  }

  // ── 5. DoB-centric patterns ────────────────────────────────────────────────
  for (const d of [dobStr, dobFull, dobShort, dd+mm, mm+dd].filter(Boolean)) {
    add(d)
    for (const w of wordTokens) { add(w + d); add(d + w) }
    for (const s of symSuffixes) add(d + s)
  }

  // ── 6. Keyboard-walk / common base + personalised suffix ─────────────────
  const commonBases = ['password','pass','admin','user','login','welcome','secure','letmein','qwerty']
  for (const base of commonBases) {
    for (const ns of numSuffixes) { add(base + ns); add(cap(base) + ns) }
    for (const w of nameVars)     { add(base + w);  add(w + base) }
    for (const s of symSuffixes)  { add(base + s);  add(cap(base) + s) }
  }

  // ── 7. Leet-speak on all word tokens + year/num ──────────────────────────
  for (const w of wordTokens) {
    const lt = leet(w)
    add(lt)
    for (const ns of numSuffixes) add(lt + ns)
    for (const s  of symSuffixes) add(lt + s)
  }

  // ── 8. Truncated first-name prefix patterns ───────────────────────────────
  if (f.length >= 3) {
    for (let len = 2; len <= Math.min(f.length, 5); len++) {
      const pfx = f.slice(0, len)
      for (const ns of numSuffixes) { add(pfx + ns); add(cap(pfx) + ns) }
      for (const lv of lastVars)    { add(pfx + lv); add(cap(pfx) + lv) }
    }
  }

  return result
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PagePasswordGenerator() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [lastPasswords, setLastPasswords] = useState([])
  const savedFilename = 'passwords.txt'

  // interactive OSINT tool — runs INSIDE the real Linux terminal (ls, cd, nano, … all work)
  const password_generator = ctx => {
    const data = {}
    let step = 0
    ctx.printAll([
      { k:'info', v: isAr ? '── password_generator — الإدخال التفاعلي (OSINT) ──' : '── password_generator — interactive input (OSINT) ──' },
      { k:'dim',  v: isAr ? 'أجب عن كل حقل. اكتب skip لتخطّي حقل، أو done للبدء بالتوليد.' : 'Answer each field. Type skip to skip a field, or done to generate.' },
    ])
    const ask = () => { const fld = FIELDS[step]; ctx.capturePrompt(`[?] ${isAr ? fld.ar : fld.en} (${fld.ex}): `) }
    const finish = () => {
      ctx.endCapture()
      const hasData = Object.values(data).some(v => v && v.trim())
      if (!hasData) { ctx.print({ k:'err', v: isAr ? '[!] لم تُدخل أي معلومات. اكتب password_generator للمحاولة مجدداً.' : '[!] No info entered. Type password_generator to try again.' }); return }
      const passwords = generatePasswords(data)
      ctx.writeFile('passwords.txt', passwords.join('\n') + '\n')
      setLastPasswords(passwords)
      const preview = passwords.slice(0, 12).map((p, i) => ({ k:'out', v: `  ${String(i + 1).padStart(4)}. ${p}` }))
      ctx.printAll([
        { k:'dim',  v:'' },
        { k:'ok',   v: isAr ? `[+] تم توليد ${passwords.length.toLocaleString()} كلمة مرور محتملة وحُفظت في passwords.txt` : `[+] Generated ${passwords.length.toLocaleString()} candidate passwords → saved to passwords.txt` },
        { k:'info', v: isAr ? '[*] عيّنة من الملف:' : '[*] sample from the file:' },
        ...preview,
        { k:'dim',  v:'  ...' },
        { k:'dim',  v: isAr ? '[*] جرّب:  ls   ·   cat passwords.txt   ·   head passwords.txt   ·   wc -l passwords.txt' : '[*] try:  ls   ·   cat passwords.txt   ·   head passwords.txt   ·   wc -l passwords.txt' },
        { k:'warn', v: isAr ? '⚠️  لهذا يجب ألا تستخدم اسمك أو تاريخ ميلادك في كلمة المرور!' : '⚠️  This is why you must never use your name or birthday in a password!' },
      ])
    }
    ctx.startCapture(line => {
      const fld = FIELDS[step]
      const t = line.trim().toLowerCase()
      if (t === 'done') { finish(); return }
      if (t === 'skip' || !line.trim()) ctx.print({ k:'dim', v: `  ~ ${isAr ? 'تخطّي' : 'skipped'} ${isAr ? fld.ar : fld.en}` })
      else { data[fld.key] = line.trim(); ctx.print({ k:'ok', v: `  ✓ ${isAr ? fld.ar : fld.en}: ${line.trim()}` }) }
      step++
      if (step >= FIELDS.length) finish()
      else ask()
    })
    ask()
  }

  function downloadFile() {
    if (!lastPasswords.length) return
    const blob = new Blob([lastPasswords.join('\n')], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = savedFilename; a.click()
    URL.revokeObjectURL(url)
  }

  const welcome = [
    { k:'info', v: isAr ? '# مولّد كلمات المرور (OSINT) — طرفية لينكس حقيقية.' : '# Password generator (OSINT) — a real Linux terminal.' },
    { k:'dim',  v: isAr ? '# اكتب  password_generator  للبدء.  اكتب  help  لكل الأوامر (ls, cd, nano, cat, display, open, create...).' : '# Type  password_generator  to start.  Type  help  for all commands (ls, cd, nano, cat, display, open, create...).' },
  ]

  return (
    <div className="min-h-screen bg-slate-50" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-800">
              <ChevronLeft className="w-4 h-4" />
              {isAr ? 'الدروس' : 'Lessons'}
            </button>
            <div className="w-px h-6 bg-slate-700" />
            <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
              <Key className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg">{isAr ? 'مولّد كلمات المرور' : 'Password Generator'}</h1>
              <p className="text-slate-400 text-xs">{isAr ? 'محاكاة OSINT — تعليمية فقط' : 'OSINT simulation — educational only'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-xs font-bold">{isAr ? 'بيئة تعليمية آمنة' : 'Safe educational environment'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Two-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

          {/* Terminal panel — the shared real Linux terminal */}
          <div dir="ltr">
            <LinuxTerminal isAr={isAr} height={480} extraCommands={{ password_generator }} welcome={welcome} />
          </div>

          {/* Info panel */}
          <div className="rounded-2xl overflow-hidden border border-slate-700 bg-white flex flex-col">
            <div className="bg-slate-800 px-4 py-2.5 shrink-0">
              <span className="text-slate-300 text-xs font-bold">{isAr ? '🔑 ما يعرفه المهاجم عنك' : '🔑 What Attackers Know'}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">

              {/* How-to steps */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-700 mb-2">{isAr ? '🖥️ كيف تستخدم الأداة:' : '🖥️ How to use:'}</p>
                {[
                  ['1', isAr ? 'اكتب: password_generator' : 'Type: password_generator'],
                  ['2', isAr ? 'أدخل المعلومات تباعاً' : 'Enter each piece of info'],
                  ['3', isAr ? 'اكتب skip لتخطي أي حقل' : 'Type skip to skip any field'],
                  ['4', isAr ? 'اكتب done للبدء' : 'Type done to generate'],
                  ['5', isAr ? 'الناتج يُحفظ في passwords.txt' : 'Output is saved to passwords.txt'],
                  ['6', isAr ? 'اقرأه: cat passwords.txt' : 'Read it: cat passwords.txt'],
                ].map(([n, t]) => (
                  <div key={n} className="flex items-start gap-2 mb-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center shrink-0 font-bold">{n}</span>
                    <span className="text-xs text-slate-600">{t}</span>
                  </div>
                ))}
              </div>

              {/* OSINT sources */}
              <div>
                <p className="text-xs font-bold text-slate-600 mb-2">{isAr ? '📱 مصادر OSINT الشائعة:' : '📱 Common OSINT Sources:'}</p>
                {[
                  ['👤', isAr ? 'الاسم الكامل'        : 'Full name',       isAr ? 'من وسائل التواصل'  : 'Social media'],
                  ['🎂', isAr ? 'تاريخ الميلاد'       : 'Birthday',        isAr ? 'إنستغرام / فيسبوك' : 'Instagram / Facebook'],
                  ['🐾', isAr ? 'اسم الحيوان الأليف'  : 'Pet name',        isAr ? 'من الصور'           : 'From photos'],
                  ['🏙️', isAr ? 'مدينة الإقامة'       : 'City',            isAr ? 'من الملف الشخصي'   : 'Profile'],
                  ['🔢', isAr ? 'الأرقام المفضلة'     : 'Favourite number', isAr ? 'قميص رياضي إلخ'   : 'Sports jersey etc.'],
                ].map(([icon, label, src]) => (
                  <div key={label} className="flex items-start gap-2 mb-2">
                    <span className="text-base shrink-0">{icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{label}</p>
                      <p className="text-xs text-slate-400">{src}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Strong password rules */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-bold text-slate-600 mb-2">{isAr ? '⚠️ قواعد كلمة المرور القوية:' : '⚠️ Strong Password Rules:'}</p>
                {[
                  isAr ? '✅ 12+ حرف' : '✅ 12+ characters',
                  isAr ? '✅ أرقام + رموز + أحرف' : '✅ Numbers + symbols + letters',
                  isAr ? '✅ لا تعلق بحياتك الشخصية' : '✅ No personal info',
                  isAr ? '✅ مختلفة لكل موقع' : '✅ Unique per site',
                  isAr ? '✅ مدير كلمات مرور' : '✅ Use a password manager',
                ].map((rule, i) => <p key={i} className="text-xs text-slate-700 mb-1">{rule}</p>)}
              </div>

              {/* Download button when file is ready */}
              {lastPasswords.length > 0 && (
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <p className="text-xs font-bold text-emerald-700">
                    {isAr ? `✅ الملف جاهز: ${savedFilename}` : `✅ File ready: ${savedFilename}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isAr ? `${lastPasswords.length.toLocaleString()} كلمة مرور محتملة` : `${lastPasswords.length.toLocaleString()} possible passwords`}
                  </p>
                  <button
                    onClick={downloadFile}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {isAr ? `تحميل ${savedFilename}` : `Download ${savedFilename}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* explanation — collapsed by default, sits under the practical part */}
        <Explanation>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-amber-800 text-xs leading-relaxed">
              {isAr
                ? 'OSINT (Open Source Intelligence) يعني جمع معلومات عامة عن الضحية من الإنترنت. يستخدم المهاجمون هذه المعلومات لتوليد قوائم كلمات مرور محتملة. الطرفية هنا حقيقية — تعمل بكل أوامر لينكس (ls، cd، nano) وأوامرك (display، open، create). اكتب password_generator ليُحفظ الناتج في الملف passwords.txt.'
                : 'OSINT means gathering public info about a target from the internet. Attackers use it to build password lists. This terminal is real — it runs every Linux command (ls, cd, nano) and your commands (display, open, create). Type password_generator to save the output to passwords.txt.'}
            </div>
          </div>
        </Explanation>
      </div>
    </div>
  )
}
