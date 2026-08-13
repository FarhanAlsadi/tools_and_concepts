import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   ANTIVIRUS — HANDS-ON PRACTICE
   Two modes (tabs):
   1) "You are the antivirus" triage game — allow/quarantine simulated files.
   2) Hash & VirusTotal scanner — hash a word or a real uploaded file (SHA-256,
      in-browser), then check the hash against VirusTotal. The check calls a
      same-origin proxy /api/vt/<hash>; if that isn't configured it falls back
      to a built-in demo database (the standard, harmless EICAR test file).
   ──────────────────────────────────────────────────────────────────────────── */

const FILES = [
  {
    name: 'family_photo.jpg', icon: '🖼️', kindIcon: '🖼️',
    srcAr: 'واتساب العائلة', srcEn: 'Family WhatsApp', srcIcon: '📱', size: '240 KB',
    signature: null, behaviors: [], disguise: null, safe: true,
    whyAr: 'صورة عادية — لا بصمة ضارة ولا سلوك مشبوه.',
    whyEn: 'A normal image — no malware signature and no suspicious behavior.',
  },
  {
    name: 'invoice.pdf.exe', icon: '🧾', kindIcon: '⚙️',
    srcAr: 'مرفق بريد إلكتروني', srcEn: 'Email attachment', srcIcon: '✉️', size: '1.2 MB',
    signature: { ar: 'حصان طروادة', en: 'Trojan.GenericKD' },
    behaviors: [{ icon: '🚪', ar: 'يفتح باباً خلفياً للمخترق', en: 'Opens a backdoor for an attacker' }],
    disguise: { ar: 'يبدو ملف PDF، لكنه برنامج تنفيذي (‎.exe‎)', en: "Looks like a PDF, but it's an executable (.exe)" },
    safe: false,
    whyAr: 'امتداد مزدوج! الاسم ينتهي بـ‎.exe‎ (برنامج)، ويطابق بصمة حصان طروادة معروف.',
    whyEn: "Double extension! The name ends in .exe (a program), and it matches a known Trojan signature.",
  },
  {
    name: 'homework.docx', icon: '📄', kindIcon: '📄',
    srcAr: 'موقع المدرسة', srcEn: 'School website', srcIcon: '🏫', size: '88 KB',
    signature: null, behaviors: [], disguise: null, safe: true,
    whyAr: 'ملف Word عادي من مصدر موثوق — آمن.',
    whyEn: 'A normal Word file from a trusted source — safe.',
  },
  {
    name: 'free_robux.exe', icon: '🎮', kindIcon: '⚙️',
    srcAr: 'موقع مجهول على الإنترنت', srcEn: 'Unknown website', srcIcon: '🌐', size: '3.4 MB',
    signature: null,
    behaviors: [
      { icon: '🔑', ar: 'يسرق كلمات المرور المحفوظة', en: 'Steals your saved passwords' },
      { icon: '🌐', ar: 'يتصل بخادم مجهول', en: 'Connects to an unknown server' },
    ],
    disguise: null, safe: false,
    whyAr: 'لا توجد بصمة معروفة، لكن سلوكه يكشفه: يسرق كلمات المرور ويتصل بخادم مجهول.',
    whyEn: "No known signature — but its behavior gives it away: it steals passwords and calls an unknown server.",
  },
  {
    name: 'game_setup.exe', icon: '🎮', kindIcon: '⚙️',
    srcAr: 'المتجر الرسمي ✓', srcEn: 'Official store ✓', srcIcon: '🏬', size: '45 MB',
    signature: null, behaviors: [], disguise: null, safe: true,
    whyAr: 'نعم إنه ‎.exe‎ — لكنه من متجر رسمي وبلا بصمة ضارة أو سلوك مشبوه. ليس كل ‎.exe‎ خطيراً!',
    whyEn: "Yes it's an .exe — but it's from the official store with no bad signature or behavior. Not every .exe is dangerous!",
  },
  {
    name: 'cute_puppy.scr', icon: '🐶', kindIcon: '⚙️',
    srcAr: 'مرفق بريد إلكتروني', srcEn: 'Email attachment', srcIcon: '✉️', size: '900 KB',
    signature: { ar: 'دودة كونفيكر', en: 'Worm.Conficker' },
    behaviors: [{ icon: '🔁', ar: 'ينسخ نفسه إلى الأجهزة الأخرى', en: 'Copies itself to other devices' }],
    disguise: { ar: 'ملفات ‎.scr‎ برامج تنفيذية، وليست صوراً', en: '.scr files are executable programs, not pictures' },
    safe: false,
    whyAr: 'امتداد ‎.scr‎ برنامج تنفيذي، وهذا يطابق بصمة دودة تنتشر بين الأجهزة.',
    whyEn: '.scr is an executable, and this one matches a worm that spreads between devices.',
  },
  {
    name: 'song.mp3', icon: '🎵', kindIcon: '🎵',
    srcAr: 'ذاكرة USB', srcEn: 'USB stick', srcIcon: '💾', size: '5 MB',
    signature: null, behaviors: [], disguise: null, safe: true,
    whyAr: 'ملف صوتي عادي — آمن.',
    whyEn: 'A normal audio file — safe.',
  },
  {
    name: 'system_update.exe', icon: '🔄', kindIcon: '⚙️',
    srcAr: 'USB أعطاك إياه شخص غريب', srcEn: 'USB from a stranger', srcIcon: '💾', size: '2 MB',
    signature: { ar: 'برنامج فدية واناكراي', en: 'Ransomware.WannaCry' },
    behaviors: [
      { icon: '🔒', ar: 'يشفّر كل ملفاتك ويطلب فدية', en: 'Encrypts all your files and demands a ransom' },
      { icon: '🛡️', ar: 'يحاول تعطيل برنامج الحماية', en: 'Tries to disable your antivirus' },
    ],
    disguise: null, safe: false,
    whyAr: 'يتظاهر بأنه تحديث، لكنه برنامج فدية يشفّر ملفاتك ويعطّل الحماية.',
    whyEn: 'It pretends to be an update, but it is ransomware that encrypts your files and disables protection.',
  },
]

const RULES = [
  { icon: '🔍', ar: 'افحص كل ملف قبل أن تفتحه — دائماً.', en: 'Scan every file before you open it — always.' },
  { icon: '🎭', ar: 'احذر الامتداد المزدوج: ‎invoice.pdf.exe‎ هو برنامج ‎.exe‎، لا ملف PDF.', en: 'Beware double extensions: invoice.pdf.exe is an .exe program, not a PDF.' },
  { icon: '⚙️', ar: 'الامتدادات ‎.exe .scr .bat‎ تشغّل أوامر — لا تفتحها إلا من مصدر تثق به.', en: '.exe .scr .bat run code — only open them from a source you trust.' },
  { icon: '🚨', ar: 'إذا شفّر الملف ملفاتك، أو سرق كلمات المرور، أو عطّل الحماية → اعزله فوراً.', en: 'If a file encrypts files, steals passwords, or disables protection → quarantine it.' },
  { icon: '🧠', ar: 'الملف ليس آمناً لمجرد أن اسمه أو أيقونته جميلة.', en: "A file isn't safe just because it has a nice name or icon." },
]

// The standard EICAR anti-malware test file — a harmless string that every real
// antivirus (and VirusTotal) flags as malware. Perfect, safe classroom demo.
const EICAR = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'

// SHA-256 → hex, for a string or an ArrayBuffer, using the browser's Web Crypto.
async function sha256Hex(input) {
  const data = typeof input === 'string' ? new TextEncoder().encode(input) : input
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const fmtSize = n => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`

/* ═══════════════════════════ TRIAGE GAME ═══════════════════════════ */
function TriageGame({ ar }) {
  const navigate = useNavigate()
  const [idx, setIdx]       = useState(0)
  const [phase, setPhase]   = useState('unscanned') // unscanned | scanning | scanned | answered
  const [choice, setChoice] = useState(null)
  const [results, setResults] = useState([])
  const [finished, setFinished] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const f = FILES[idx]
  const score = results.filter(r => r.correct).length

  const startScan = () => { setPhase('scanning'); timer.current = setTimeout(() => setPhase('scanned'), 850) }
  const decide = (allow) => {
    if (phase !== 'scanned') return
    setChoice(allow)
    setResults(r => [...r, { correct: allow === f.safe, choseSafe: allow, name: f.name }])
    setPhase('answered')
  }
  const next = () => {
    if (idx + 1 >= FILES.length) { setFinished(true); return }
    setIdx(i => i + 1); setPhase('unscanned'); setChoice(null)
  }
  const restart = () => { clearTimeout(timer.current); setIdx(0); setPhase('unscanned'); setChoice(null); setResults([]); setFinished(false) }

  if (finished) {
    const pct = Math.round((score / FILES.length) * 100)
    const stars = score >= FILES.length ? 3 : score >= FILES.length - 2 ? 2 : 1
    const mistakes = FILES.filter((file, i) => results[i] && !results[i].correct)
    return (
      <div>
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 text-center shadow-sm">
          <div className="text-5xl mb-2">{stars === 3 ? '🏆' : stars === 2 ? '🎉' : '💪'}</div>
          <h2 className="text-2xl font-black text-slate-800">{ar ? 'انتهى التدريب!' : 'Practice complete!'}</h2>
          <p className="text-slate-500 text-sm mt-1">{ar ? `أصبت في ${score} من ${FILES.length} ملفات` : `You got ${score} of ${FILES.length} files right`}</p>
          <div className="text-3xl mt-3 tracking-widest">{'★'.repeat(stars)}<span className="text-slate-200">{'★'.repeat(3 - stars)}</span></div>
          <div className="mt-4 h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? '#8DC63F' : pct >= 60 ? '#FCAD0F' : '#f87171' }} />
          </div>
        </div>

        {mistakes.length > 0 && (
          <div className="mt-5 bg-red-50 border-2 border-red-200 rounded-2xl p-5">
            <h3 className="font-black text-red-900 text-sm mb-3">{ar ? '📌 راجِع أخطاءك' : '📌 Review your mistakes'}</h3>
            <div className="space-y-2">
              {mistakes.map(m => (
                <div key={m.name} className="bg-white rounded-xl border border-red-100 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{m.kindIcon}</span>
                    <span className="font-mono text-xs text-slate-700 flex-1">{m.name}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${m.safe ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                      {m.safe ? (ar ? 'كان آمناً ✅' : 'was Safe ✅') : (ar ? 'كان ضاراً 🚫' : 'was Malware 🚫')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ar ? m.whyAr : m.whyEn}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 bg-slate-50 border-2 border-slate-200 rounded-2xl p-5">
          <h3 className="font-black text-slate-800 text-sm mb-3">{ar ? '🎓 القواعد التي تدرّبت عليها' : '🎓 The rules you practiced'}</h3>
          <div className="space-y-2">
            {RULES.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-base flex-shrink-0">{r.icon}</span>
                <p className="text-sm text-slate-700 leading-relaxed">{ar ? r.ar : r.en}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-6">
          <button onClick={restart} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: '#0E1F39' }}>{ar ? '↻ العب مرة أخرى' : '↻ Play again'}</button>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 border-2 border-slate-200 flex items-center gap-1.5"><ChevronLeft size={15} />{ar ? 'الرئيسية' : 'Home'}</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${(results.length / FILES.length) * 100}%`, background: '#8DC63F' }} />
        </div>
        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{ar ? `ملف ${idx + 1} / ${FILES.length}` : `File ${idx + 1} / ${FILES.length}`}</span>
        <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: '#0E1F39', color: '#FCAD0F' }}>{ar ? `النقاط: ${score}` : `Score: ${score}`}</span>
      </div>

      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 flex items-center gap-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: '#f1f5f9' }}>{f.kindIcon}</div>
          <div className="min-w-0 flex-1">
            <div className="font-mono font-bold text-slate-800 text-lg break-all">{f.name}</div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">{f.srcIcon} {ar ? f.srcAr : f.srcEn}</span>
              <span className="text-xs text-slate-400 font-mono">{f.size}</span>
            </div>
          </div>
        </div>

        <div className="p-5">
          {phase === 'unscanned' && (
            <button onClick={startScan} className="w-full py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all hover:brightness-110" style={{ background: '#2563eb' }}>🔍 {ar ? 'افحص الملف' : 'Scan file'}</button>
          )}
          {phase === 'scanning' && (
            <div className="text-center py-3">
              <div className="text-2xl animate-pulse">🔍</div>
              <div className="text-sm font-bold text-blue-600 mt-1">{ar ? 'جارٍ فحص الملف…' : 'Scanning file…'}</div>
              <div className="mt-2 h-1.5 bg-blue-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ animation: 'av-load .85s linear forwards' }} /></div>
            </div>
          )}
          {(phase === 'scanned' || phase === 'answered') && (
            <>
              <div className="rounded-xl border border-slate-200 overflow-hidden mb-4">
                <div className="bg-slate-800 text-white text-xs font-bold px-3 py-2">📋 {ar ? 'تقرير الفحص' : 'Scan report'}</div>
                <div className="p-3 space-y-2 bg-slate-50">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="flex-shrink-0">{f.signature ? '🔴' : '🟢'}</span>
                    <span className={f.signature ? 'text-red-700 font-semibold' : 'text-green-700'}>
                      {f.signature ? (ar ? `تطابق بصمة برنامج ضار: ${f.signature.ar}` : `Matches a known malware signature: ${f.signature.en}`) : (ar ? 'لا تطابق مع أي بصمة برنامج ضار معروف' : 'No match with any known malware signature')}
                    </span>
                  </div>
                  {f.behaviors.length === 0 ? (
                    <div className="flex items-start gap-2 text-sm"><span className="flex-shrink-0">🟢</span><span className="text-green-700">{ar ? 'لم يُرصد أي سلوك مشبوه' : 'No suspicious behavior observed'}</span></div>
                  ) : (
                    f.behaviors.map((b, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm"><span className="flex-shrink-0">🔴</span><span className="text-red-700 font-semibold">{b.icon} {ar ? b.ar : b.en}</span></div>
                    ))
                  )}
                  {f.disguise && (
                    <div className="flex items-start gap-2 text-sm bg-orange-50 border border-orange-200 rounded-lg px-2 py-1.5"><span className="flex-shrink-0">⚠️</span><span className="text-orange-800 font-semibold">{ar ? f.disguise.ar : f.disguise.en}</span></div>
                  )}
                </div>
              </div>

              {phase === 'scanned' && (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => decide(true)} className="py-3 rounded-xl font-black text-sm text-white transition-all hover:brightness-110" style={{ background: '#16a34a' }}>✅ {ar ? 'اسمح به' : 'Allow'}</button>
                  <button onClick={() => decide(false)} className="py-3 rounded-xl font-black text-sm text-white transition-all hover:brightness-110" style={{ background: '#dc2626' }}>🚫 {ar ? 'اعزله' : 'Quarantine'}</button>
                </div>
              )}

              {phase === 'answered' && (
                <div className={`rounded-xl border-2 p-4 ${results[idx].correct ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                  <div className={`font-black text-sm ${results[idx].correct ? 'text-green-800' : 'text-red-800'}`}>
                    {results[idx].correct ? (ar ? '✅ قرار صحيح!' : '✅ Correct call!') : (choice ? (ar ? '❌ سمحت ببرنامج ضار!' : '❌ You allowed malware!') : (ar ? '❌ عزلت ملفاً آمناً' : '❌ You quarantined a safe file'))}
                  </div>
                  <p className={`text-sm mt-1 leading-relaxed ${results[idx].correct ? 'text-green-700' : 'text-red-700'}`}>{ar ? f.whyAr : f.whyEn}</p>
                  <button onClick={next} className="mt-3 w-full py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: '#0E1F39' }}>
                    {idx + 1 >= FILES.length ? (ar ? 'شاهد نتيجتك ←' : 'See your results →') : (ar ? 'الملف التالي ←' : 'Next file →')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Explanation>
        <p className="text-slate-500 text-sm leading-relaxed mb-2">{ar ? 'تصل الملفات واحداً تلو الآخر. افحص كل ملف، اقرأ التقرير، ثم قرّر: هل تسمح به أم تعزله؟' : 'Files arrive one by one. Scan each file, read the report, then decide: allow it or quarantine it?'}</p>
        <p className="text-xs text-slate-400">{ar ? '💡 لا يوجد زر «افتح» — برنامج الحماية يفحص أولاً، ثم يقرر.' : '💡 There is no “open” button — the antivirus scans first, then decides.'}</p>
      </Explanation>
    </div>
  )
}

/* ═══════════════════════ HASH & VIRUSTOTAL SCANNER ═══════════════════════ */
function HashScanner({ ar }) {
  const [text, setText]         = useState('')
  const [textHash, setTextHash] = useState('')
  const [fileInfo, setFileInfo] = useState(null)
  const [fileHash, setFileHash] = useState('')
  const [vt, setVt]             = useState(null)      // { for:'text'|'file', source, found, malicious, suspicious, total, name }
  const [checking, setChecking] = useState(null)      // 'text' | 'file' | null
  const knownBad = useRef({})

  // seed the demo database with the EICAR hash (computed, never hand-typed)
  useEffect(() => {
    sha256Hex(EICAR).then(h => { knownBad.current[h] = { malicious: 63, suspicious: 1, total: 72, name: 'EICAR-Test-File (malware test)' } })
  }, [])

  // live-hash the text field
  useEffect(() => {
    let cancelled = false
    if (!text) { setTextHash(''); return }
    sha256Hex(text).then(h => { if (!cancelled) setTextHash(h) })
    return () => { cancelled = true }
  }, [text])

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setVt(v => (v && v.for === 'file') ? null : v)
    const buf = await file.arrayBuffer()
    const h = await sha256Hex(buf)
    setFileInfo({ name: file.name, size: file.size }); setFileHash(h)
  }

  const check = async (hash, which) => {
    if (!hash || checking) return
    setChecking(which); setVt(null)
    let result = null
    // 1) try the live proxy (present only once VT_API_KEY is configured server-side)
    try {
      const res = await fetch(`/api/vt/${hash}`, { headers: { Accept: 'application/json' } })
      const ct = res.headers.get('content-type') || ''
      if (res.ok && ct.includes('application/json')) {
        const d = await res.json()
        if (d && d.configured !== false && typeof d.malicious === 'number') {
          const total = d.total || (d.malicious + (d.suspicious || 0) + (d.harmless || 0) + (d.undetected || 0)) || 72
          result = { for: which, source: 'live', found: d.found !== false, malicious: d.malicious, suspicious: d.suspicious || 0, total, name: d.name || null }
        }
      }
    } catch (e) { /* fall back to demo */ }
    // small delay so the "querying" state is visible
    await new Promise(r => setTimeout(r, 650))
    // 2) fall back to the built-in demo database
    if (!result) {
      const bad = knownBad.current[hash]
      result = bad
        ? { for: which, source: 'demo', found: true, malicious: bad.malicious, suspicious: bad.suspicious, total: bad.total, name: bad.name }
        : { for: which, source: 'demo', found: false, malicious: 0, suspicious: 0, total: 72, name: null }
    }
    setChecking(null); setVt(result)
  }

  const copy = (h) => { try { navigator.clipboard.writeText(h) } catch (e) {} }

  const HashLine = ({ hash }) => (
    <div className="mt-2 bg-slate-900 rounded-lg p-2.5 flex items-center gap-2" dir="ltr">
      <span className="text-[10px] font-black text-slate-500 flex-shrink-0">SHA-256</span>
      <code className="text-emerald-400 text-xs font-mono break-all flex-1 leading-relaxed">{hash}</code>
      <button onClick={() => copy(hash)} title="copy" className="text-slate-400 hover:text-white text-xs flex-shrink-0">📋</button>
    </div>
  )

  const Verdict = ({ v }) => {
    if (!v) return null
    const badge = v.source === 'live'
      ? <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">🌐 {ar ? 'VirusTotal (مباشر)' : 'VirusTotal (live)'}</span>
      : <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">🧪 {ar ? 'قاعدة تجريبية' : 'demo database'}</span>
    if (v.malicious > 0) {
      return (
        <div className="mt-3 rounded-xl border-2 border-red-300 bg-red-50 p-4">
          <div className="flex items-center justify-between gap-2 mb-1"><span className="font-black text-red-800 text-sm">⚠️ {ar ? 'برنامج ضار!' : 'Malicious!'}</span>{badge}</div>
          <p className="text-sm text-red-700 leading-relaxed">
            {ar ? `صنّفه ${v.malicious} من ${v.total} محرّك فحص كبرنامج ضار.` : `${v.malicious} of ${v.total} scan engines flagged this as malware.`}
            {v.name ? (ar ? ` النوع: ${v.name}.` : ` Detected as: ${v.name}.`) : ''}
          </p>
          <p className="text-xs text-red-600 font-bold mt-1">{ar ? '→ لا تفتحه، واعزله فوراً.' : '→ Do not open it. Quarantine it now.'}</p>
        </div>
      )
    }
    if (v.found) {
      return (
        <div className="mt-3 rounded-xl border-2 border-green-300 bg-green-50 p-4">
          <div className="flex items-center justify-between gap-2 mb-1"><span className="font-black text-green-800 text-sm">✓ {ar ? 'يبدو نظيفاً' : 'Looks clean'}</span>{badge}</div>
          <p className="text-sm text-green-700 leading-relaxed">{ar ? `لم يُصنّفه أي محرّك (0 من ${v.total}) كبرنامج ضار.` : `No engine flagged it (0 of ${v.total}).`}</p>
        </div>
      )
    }
    return (
      <div className="mt-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
        <div className="flex items-center justify-between gap-2 mb-1"><span className="font-black text-amber-800 text-sm">❔ {ar ? 'غير معروف' : 'Unknown'}</span>{badge}</div>
        <p className="text-sm text-amber-700 leading-relaxed">{ar ? 'لم يُبلَّغ عن هذا الهاش من قبل. كن حذراً مع الملفات المجهولة.' : "This hash hasn't been reported before. Be careful with unknown files."}</p>
      </div>
    )
  }

  const CheckBtn = ({ hash, which }) => (
    <button onClick={() => check(hash, which)} disabled={!hash || checking === which}
      className="mt-3 w-full py-2.5 rounded-xl font-black text-sm text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: '#0E1F39' }}>
      {checking === which ? <>⏳ {ar ? 'جارٍ الاستعلام…' : 'Querying…'}</> : <>🌐 {ar ? 'افحص الهاش على VirusTotal' : 'Check the hash on VirusTotal'}</>}
    </button>
  )

  return (
    <div>
      {/* 1) word / text hasher */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm">
        <h3 className="font-black text-slate-800 text-sm mb-1">1) {ar ? 'افهم الفكرة — جزّئ نصاً' : 'Get the idea — hash a word'}</h3>
        <p className="text-xs text-slate-400 mb-3">{ar ? 'اكتب أي كلمة وشاهد بصمتها. غيّر حرفاً واحداً — سيتغيّر كل شيء.' : 'Type any word and watch its fingerprint. Change one letter — everything changes.'}</p>
        <input value={text} onChange={e => setText(e.target.value)} placeholder={ar ? 'اكتب هنا…' : 'type here…'} dir="ltr"
          className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-400 outline-none text-sm font-mono" />
        <div className="flex gap-2 mt-2 flex-wrap">
          <button onClick={() => setText('camelcode')} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">camelcode</button>
          <button onClick={() => setText('Camelcode')} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">Camelcode <span className="text-slate-400">({ar ? 'حرف كبير' : 'one capital'})</span></button>
          <button onClick={() => setText(EICAR)} className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 font-bold">🧪 {ar ? 'نص اختبار EICAR' : 'EICAR test string'}</button>
        </div>
        {textHash && <>
          <HashLine hash={textHash} />
          <div className="text-[11px] text-slate-400 mt-1">{ar ? '٦٤ رمزاً (٢٥٦ بت) — دائماً بنفس الطول مهما كان حجم المدخل.' : '64 characters (256 bits) — always the same length, whatever the input size.'}</div>
          <CheckBtn hash={textHash} which="text" />
          {vt && vt.for === 'text' && <Verdict v={vt} />}
        </>}
      </div>

      {/* 2) real file hasher */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm mt-4">
        <h3 className="font-black text-slate-800 text-sm mb-1">2) {ar ? 'جزّئ ملفاً حقيقياً من جهازك' : 'Hash a real file from your device'}</h3>
        <p className="text-xs text-slate-400 mb-3">{ar ? 'اختر أي ملف — يُحسب الهاش داخل متصفحك فقط، ولا يُرفع الملف إلى أي مكان.' : 'Pick any file — the hash is computed inside your browser; the file is never uploaded anywhere.'}</p>
        <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-bold cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-all">
          📁 {ar ? 'اختر ملفاً…' : 'Choose a file…'}
          <input type="file" onChange={onFile} className="hidden" />
        </label>
        {fileInfo && <>
          <div className="mt-3 flex items-center gap-2 text-sm"><span>📄</span><span className="font-mono text-slate-700 break-all flex-1">{fileInfo.name}</span><span className="text-xs text-slate-400 font-mono flex-shrink-0">{fmtSize(fileInfo.size)}</span></div>
          {fileHash && <>
            <HashLine hash={fileHash} />
            <CheckBtn hash={fileHash} which="file" />
            {vt && vt.for === 'file' && <Verdict v={vt} />}
          </>}
        </>}
      </div>

      <Explanation>
        <p className="text-slate-500 text-sm leading-relaxed mb-2">{ar ? 'الهاش (Hash) هو بصمة رقمية فريدة لأي نص أو ملف. أي تغيير بسيط يغيّر الهاش بالكامل. محللو الأمن يأخذون هاش ملف مشبوه ويبحثون عنه في VirusTotal ليعرفوا إن كان برنامجاً ضاراً — دون فتح الملف.' : "A hash is a unique digital fingerprint of any text or file. The tiniest change rewrites the whole hash. Security analysts take a suspicious file's hash and look it up on VirusTotal to learn if it's malware — without ever opening the file."}</p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500 leading-relaxed">
          🔒 {ar ? 'الخصوصية: الهاش يُحسب في متصفحك. عند الفحص نرسل الهاش فقط (لا الملف نفسه) إلى VirusTotal.' : 'Privacy: the hash is computed in your browser. On a check, only the hash (never the file itself) is sent to VirusTotal.'}
        </div>
      </Explanation>
    </div>
  )
}

/* ═══════════════ HASH DATABASE — manual signature lookup ═══════════════
   Scan a file → get its SHA-256 hash → search it MANUALLY in a table of malware
   hashes reported by people worldwide → decide suspicious or legit. This is how
   signature-based antivirus detection actually works. File hashes and the extra
   "reported" hashes are all computed at runtime so the malicious files genuinely
   match their database rows. */
const DB_FILES = [
  { name: 'family_photo.jpg', icon: '🖼️', content: 'IMG_family_holiday_doha_2026_clean', mal: false },
  { name: 'invoice.pdf.exe', icon: '⚙️', content: 'MZ_PE_invoice_trojan_generickd_backdoor', mal: true, threat: 'Trojan.GenericKD', reports: 3210, date: '2026-01-08' },
  { name: 'homework.docx', icon: '📄', content: 'DOCX_math_homework_ch3_clean', mal: false },
  { name: 'free_robux.exe', icon: '🎮', content: 'MZ_PE_free_robux_generator_pwstealer', mal: true, threat: 'PWS.RobuxStealer', reports: 1975, date: '2026-02-11' },
  { name: 'song.mp3', icon: '🎵', content: 'ID3_audio_song_track7_clean', mal: false },
  { name: 'flash_update.exe', icon: '🔄', content: 'MZ_PE_fake_flash_update_wannacry_ransom', mal: true, threat: 'Ransomware.WannaCry', reports: 6840, date: '2025-12-20' },
]
const EXTRA = [
  { seed: 'ex1', threat: 'Worm.Conficker', reports: 4120, date: '2025-11-02' },
  { seed: 'ex2', threat: 'Adware.BrowseFox', reports: 880, date: '2026-01-19' },
  { seed: 'ex3', threat: 'Backdoor.DarkComet', reports: 2670, date: '2025-09-27' },
  { seed: 'ex4', threat: 'Spyware.KeyLogger', reports: 1530, date: '2026-02-05' },
  { seed: 'ex5', threat: 'Trojan.Emotet', reports: 5940, date: '2026-01-30' },
]

function HashDatabase({ ar }) {
  const [db, setDb]             = useState([])
  const [selected, setSelected] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanHash, setScanHash] = useState(null)
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState({})   // name -> { choice, correct }

  // build the reported-malware table (malicious file hashes + extra reported hashes)
  useEffect(() => {
    let alive = true
    Promise.all([
      ...DB_FILES.filter(f => f.mal).map(f => sha256Hex(f.content).then(h => ({ hash: h, threat: f.threat, reports: f.reports, date: f.date }))),
      ...EXTRA.map(e => sha256Hex('reported::' + e.seed).then(h => ({ hash: h, threat: e.threat, reports: e.reports, date: e.date }))),
    ]).then(rows => {
      if (!alive) return
      const nMal = DB_FILES.filter(f => f.mal).length
      const malRows = rows.slice(0, nMal), exRows = rows.slice(nMal)
      const out = []; const n = Math.max(malRows.length, exRows.length)
      for (let i = 0; i < n; i++) { if (exRows[i]) out.push(exRows[i]); if (malRows[i]) out.push(malRows[i]) }
      setDb(out)
    })
    return () => { alive = false }
  }, [])

  const cur = selected ? results[selected.name] : null
  const pick = (f) => { setSelected(f); setScanHash(null); setQuery(''); setScanning(false) }
  // compute the file's hash on-demand (matches its database row, which uses the same content)
  const scan = () => { if (!selected || scanning) return; setScanning(true); sha256Hex(selected.content).then(h => setTimeout(() => { setScanHash(h); setScanning(false) }, 500)) }
  const searched = query.trim().length >= 6
  const decide = (choice) => {
    if (!selected || !scanHash || !searched || cur) return
    setResults(r => ({ ...r, [selected.name]: { choice, correct: (choice === 'sus') === selected.mal } }))
  }
  const advance = () => {
    const rest = DB_FILES.filter(f => !results[f.name])
    if (rest.length === 0) { setResults({}); setSelected(null); setScanHash(null); setQuery('') }
    else pick(rest[0])
  }

  const q = query.trim().toLowerCase()
  const filtered = q ? db.filter(r => r.hash.includes(q) || r.threat.toLowerCase().includes(q)) : db
  const handled = Object.keys(results).length
  const score = Object.values(results).filter(r => r.correct).length
  const trunc = h => h.slice(0, 22) + '…' + h.slice(-6)

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(handled / DB_FILES.length) * 100}%`, background: '#8DC63F' }} /></div>
        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{ar ? `صحيح ${score} · عولج ${handled}/${DB_FILES.length}` : `Correct ${score} · done ${handled}/${DB_FILES.length}`}</span>
      </div>

      {/* file tray */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
        {DB_FILES.map(f => {
          const r = results[f.name]; const sel = selected && selected.name === f.name
          return (
            <button key={f.name} onClick={() => pick(f)} className="flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all"
              style={{ borderColor: sel ? '#0E1F39' : r ? (r.correct ? '#86efac' : '#fecaca') : '#e2e8f0', background: sel ? '#f0f9ff' : 'white' }}>
              <span className="text-xl">{f.icon}</span>
              <span className="text-[9px] font-mono text-slate-500 break-all leading-tight text-center">{f.name}</span>
              {r && <span className="text-[10px]">{r.correct ? '✅' : '❌'}</span>}
            </button>
          )
        })}
      </div>

      {/* selected file: scan → hash */}
      {selected && !cur && (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2"><span className="text-xl">{selected.icon}</span><span className="font-mono text-sm text-slate-800 flex-1 break-all">{selected.name}</span></div>
          {!scanHash ? (
            <button onClick={scan} disabled={scanning} className="w-full py-2.5 rounded-xl font-black text-sm text-white" style={{ background: '#2563eb' }}>
              {scanning ? (ar ? '⏳ يحسب البصمة…' : '⏳ Computing hash…') : (ar ? '🔍 افحص الملف (احسب البصمة)' : '🔍 Scan file (compute hash)')}
            </button>
          ) : (
            <>
              <div className="bg-slate-900 rounded-lg p-2.5 flex items-center gap-2" dir="ltr">
                <span className="text-[10px] font-black text-slate-500 flex-shrink-0">SHA-256</span>
                <code className="text-emerald-400 text-xs font-mono break-all flex-1 leading-relaxed">{scanHash}</code>
              </div>
              <button onClick={() => setQuery(scanHash)} className="mt-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">🔎 {ar ? 'ابحث عن هذه البصمة في الجدول' : 'Search this hash in the table'}</button>
            </>
          )}
        </div>
      )}

      {/* the reported-malware database + manual search */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-800 text-white px-4 py-2.5 text-sm font-bold">🗄️ {ar ? 'قاعدة بصمات البرامج الضارة المُبلَّغ عنها' : 'Reported-malware hash database'}</div>
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          <input value={query} onChange={e => setQuery(e.target.value)} dir="ltr"
            placeholder={ar ? 'الصق البصمة أو اكتب جزءاً منها للبحث…' : 'paste the hash or type part of it to search…'}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono outline-none focus:border-blue-400" />
        </div>
        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-xs" dir="ltr">
            <thead><tr className="bg-slate-100 text-slate-500">
              <th className="text-left px-3 py-2">Hash (SHA-256)</th>
              <th className="text-left px-3 py-2">{ar ? 'التهديد' : 'Threat'}</th>
              <th className="text-left px-3 py-2">{ar ? 'بلاغات' : 'Reports'}</th>
              <th className="text-left px-3 py-2">{ar ? 'أول ظهور' : 'First seen'}</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-green-600 font-semibold">{ar ? '✓ لا نتائج مطابقة — هذه البصمة غير موجودة في قاعدة البرامج الضارة.' : '✓ No matching entries — this hash is not in the malware database.'}</td></tr>
              ) : filtered.map((r, i) => {
                const match = r.hash === scanHash
                return (
                  <tr key={i} className="border-t border-slate-100" style={{ background: match ? '#fee2e2' : 'transparent' }}>
                    <td className="px-3 py-2 font-mono break-all" style={{ maxWidth: 250, color: match ? '#b91c1c' : '#475569', fontWeight: match ? 800 : 400 }}>{trunc(r.hash)}{match ? ' ⬅' : ''}</td>
                    <td className="px-3 py-2 text-slate-700">{r.threat}</td>
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">👥 {r.reports.toLocaleString()}</td>
                    <td className="px-3 py-2 text-slate-400 font-mono whitespace-nowrap">{r.date}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* decide */}
      {scanHash && !cur && (
        <div className="mt-4">
          {!searched && <p className="text-center text-xs text-amber-600 font-semibold mb-2">{ar ? '🔎 ابحث عن البصمة في الجدول أولاً، ثم قرّر.' : '🔎 Search the hash in the table first, then decide.'}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => decide('sus')} disabled={!searched} className="py-3 rounded-xl font-black text-sm text-white disabled:opacity-40" style={{ background: '#dc2626' }}>🚫 {ar ? 'مشبوه (ضار)' : 'Suspicious (malware)'}</button>
            <button onClick={() => decide('safe')} disabled={!searched} className="py-3 rounded-xl font-black text-sm text-white disabled:opacity-40" style={{ background: '#16a34a' }}>✅ {ar ? 'سليم (آمن)' : 'Legit (safe)'}</button>
          </div>
        </div>
      )}
      {cur && (
        <div className={`mt-4 rounded-xl border-2 p-4 ${cur.correct ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
          <div className={`font-black text-sm ${cur.correct ? 'text-green-800' : 'text-red-800'}`}>{cur.correct ? (ar ? '✅ قرار صحيح!' : '✅ Correct!') : (ar ? '❌ قرار خاطئ' : '❌ Wrong')}</div>
          <p className={`text-sm mt-1 leading-relaxed ${cur.correct ? 'text-green-700' : 'text-red-700'}`}>
            {selected.mal
              ? (ar ? `بصمة الملف موجودة في القاعدة — إنه ${selected.threat} معروف. اعزله فوراً.` : `The file's hash IS in the database — it's known ${selected.threat}. Quarantine it.`)
              : (ar ? 'بصمة الملف غير موجودة في القاعدة — ليس برنامجاً ضاراً معروفاً. (لكن البرامج الجديدة قد لا تكون مُبلَّغاً عنها بعد — لذلك نستخدم أيضاً كشف السلوك.)' : "The file's hash is NOT in the database — not known malware. (But brand-new malware may not be reported yet — which is why we also use behavior detection.)")}
          </p>
          <button onClick={advance} className="mt-3 w-full py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: '#0E1F39' }}>{handled >= DB_FILES.length ? (ar ? '↺ من البداية' : '↺ Start over') : (ar ? 'ملف آخر ←' : 'Another file →')}</button>
        </div>
      )}

      <Explanation>
        <p className="text-slate-500 text-sm leading-relaxed mb-2">{ar ? 'كل ملف له بصمة (Hash) فريدة. تتشارك فرق الأمن قواعد بيانات ببصمات برامج ضارة أبلغ عنها الناس حول العالم. للتحقق من ملف: احسب بصمته، ثم ابحث عنها يدوياً في الجدول — إن وُجدت فهو برنامج ضار معروف، وإن لم تُوجد فليس ضاراً معروفاً.' : 'Every file has a unique hash. Security teams share databases of malware hashes reported by people worldwide. To check a file: compute its hash, then search it manually in the table — if it’s there, it’s known malware; if not, it isn’t known malware.'}</p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500 leading-relaxed">
          💡 {ar ? 'هكذا يعمل الكشف بالتوقيع (Signature): يقارن برنامج الحماية بصمة كل ملف بملايين البصمات المعروفة. عيبه: لا يكتشف إلا ما أُبلغ عنه سابقاً.' : 'This is signature-based detection: the antivirus compares each file’s hash to millions of known ones. Its weakness: it only catches what was already reported.'}
        </div>
      </Explanation>
    </div>
  )
}

/* ═══════════════════════════ PAGE (tabs) ═══════════════════════════ */
export default function PageAntivirus() {
  const { lang } = useApp()
  const ar = lang === 'ar'
  const [mode, setMode] = useState('game')

  const Tab = ({ id, emoji, labelAr, labelEn }) => (
    <button onClick={() => setMode(id)}
      className="px-4 py-2 rounded-xl text-sm font-bold transition-all border-2"
      style={mode === id
        ? { background: '#0E1F39', color: 'white', borderColor: '#0E1F39' }
        : { background: 'white', color: '#64748b', borderColor: '#e2e8f0' }}>
      {emoji} {ar ? labelAr : labelEn}
    </button>
  )

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-4">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#eafce0', color: '#4d7c1a' }}>
          {ar ? '🧪 تدريب عملي' : '🧪 Hands-on practice'}
        </span>
        <h1 className="text-2xl font-black text-slate-800 mt-2 mb-3">🛡️ {ar ? 'كن أنت برنامج الحماية' : 'You Are the Antivirus'}</h1>
        <div className="flex gap-2 flex-wrap">
          <Tab id="game" emoji="🎮" labelAr="التدريب" labelEn="Practice game" />
          <Tab id="db" emoji="🗄️" labelAr="بحث في قاعدة البصمات" labelEn="Hash database lookup" />
          <Tab id="scan" emoji="🔬" labelAr="الهاش وفايروس توتال" labelEn="Hash & VirusTotal" />
        </div>
      </div>

      {mode === 'game' ? <TriageGame ar={ar} /> : mode === 'db' ? <HashDatabase ar={ar} /> : <HashScanner ar={ar} />}

      <style>{`@keyframes av-load{from{width:0}to{width:100%}}`}</style>
    </div>
  )
}
