import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft, Search } from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   GOOGLE DORKING / GOOGLE HACKING (safe simulation)
   A fake search engine indexes a fictional school. The student uses real Google
   dork operators (site:, filetype:, intitle:, inurl:, intext:, "phrase", -word)
   to complete an "authorized audit" — finding what the school accidentally left
   public: an admin login, an open directory listing, a leaked grades sheet, and
   a password file. Nothing hits the real internet.
   ──────────────────────────────────────────────────────────────────────────── */

const DOMAIN = 'alnoor-school.edu.qa'

// canonical (English) fields are used for matching; *Ar are for display only
const INDEX = [
  { url: `${DOMAIN}/`, ft: 'html', tag: 'normal',
    title: 'Al-Noor International School — Home', titleAr: 'مدرسة النور الدولية — الرئيسية',
    snippet: 'Welcome to Al-Noor International School in Doha. Admissions, news and academics.',
    snippetAr: 'مرحباً بكم في مدرسة النور الدولية بالدوحة. القبول والأخبار والأكاديميات.' },
  { url: `${DOMAIN}/about`, ft: 'html', tag: 'normal',
    title: 'About Us — Al-Noor School', titleAr: 'من نحن — مدرسة النور',
    snippet: 'Our mission, vision and campus in Qatar.', snippetAr: 'رسالتنا ورؤيتنا وحرمنا المدرسي في قطر.' },
  { url: `${DOMAIN}/files/admissions-2026.pdf`, ft: 'pdf', tag: 'normal',
    title: 'Admissions Guide 2026 (PDF)', titleAr: 'دليل القبول 2026 (PDF)',
    snippet: 'How to apply, fees and required documents for the 2026 intake.',
    snippetAr: 'كيفية التقديم والرسوم والمستندات المطلوبة لدفعة 2026.' },
  { url: `${DOMAIN}/news/sports-day`, ft: 'html', tag: 'normal',
    title: 'Sports Day 2026 — News', titleAr: 'اليوم الرياضي 2026 — الأخبار',
    snippet: 'Photos and results from our annual sports day.', snippetAr: 'صور ونتائج يومنا الرياضي السنوي.' },
  { url: `qatar-schools-guide.com/alnoor-review`, ft: 'html', tag: 'normal',
    title: 'Al-Noor School Review — Qatar Schools Guide', titleAr: 'مراجعة مدرسة النور — دليل مدارس قطر',
    snippet: 'An independent review of Al-Noor International School.', snippetAr: 'مراجعة مستقلة لمدرسة النور الدولية.' },
  { url: `portal.${DOMAIN}/login`, ft: 'html', tag: 'normal',
    title: 'Parent Portal Login', titleAr: 'دخول بوابة أولياء الأمور',
    snippet: 'Sign in to view your child grades and attendance.', snippetAr: 'سجّل الدخول لعرض درجات وحضور طفلك.' },

  // ── the exposed / sensitive pages (the audit targets) ──────────────────────
  { url: `${DOMAIN}/admin/login.php`, ft: 'php', tag: 'login',
    title: 'Administrator Login', titleAr: 'دخول المسؤول (Administrator Login)',
    snippet: 'Staff admin portal sign in. Username and password required.',
    snippetAr: 'دخول بوابة إدارة الموظفين. مطلوب اسم مستخدم وكلمة مرور.',
    exposedAr: 'صفحة دخول الإدارة مكشوفة ومفهرسة في جوجل — يجب حجبها عن الفهرسة وحمايتها.',
    exposedEn: 'The admin login page is exposed and indexed by Google — it should be blocked from indexing and protected.' },
  { url: `${DOMAIN}/backups/`, ft: 'html', tag: 'dirlist',
    title: 'Index of /backups', titleAr: 'Index of /backups (قائمة مجلد)',
    snippet: 'Parent Directory   db_backup.sql   passwords.txt   grades.zip   config.env',
    snippetAr: 'المجلد الأصلي   db_backup.sql   passwords.txt   grades.zip   config.env',
    exposedAr: 'قائمة مجلد مفتوحة تعرض كل الملفات على الخادم — بوابة ذهبية للمهاجم.',
    exposedEn: 'An open directory listing shows every file on the server — a goldmine for an attacker.' },
  { url: `${DOMAIN}/uploads/student_grades_2026.xlsx`, ft: 'xlsx', tag: 'sheet',
    title: 'student_grades_2026.xlsx', titleAr: 'student_grades_2026.xlsx',
    snippet: 'Student ID, Full Name, Class, Grade, Parent Phone, Address ...',
    snippetAr: 'رقم الطالب، الاسم الكامل، الصف، الدرجة، هاتف ولي الأمر، العنوان ...',
    exposedAr: 'جدول درجات الطلاب وبياناتهم الشخصية مكشوف للعامة — تسريب خطير للبيانات.',
    exposedEn: "A spreadsheet of students' grades and personal data is publicly exposed — a serious data leak." },
  { url: `${DOMAIN}/backups/passwords.txt`, ft: 'txt', tag: 'creds',
    title: 'passwords.txt', titleAr: 'passwords.txt',
    snippet: 'admin:P@ssw0rd2024   ftp_user:school#123   wifi_password:AlNoor2026',
    snippetAr: 'admin:P@ssw0rd2024   ftp_user:school#123   wifi_password:AlNoor2026',
    exposedAr: 'ملف يحتوي كلمات مرور بنص صريح ومكشوف للجميع — كارثة أمنية كاملة.',
    exposedEn: 'A file with plain-text passwords, exposed to everyone — a complete security disaster.' },
  { url: `${DOMAIN}/config/.env`, ft: 'env', tag: 'creds',
    title: '.env — environment config', titleAr: '.env — ملف الإعدادات',
    snippet: 'DB_HOST=localhost  DB_PASSWORD=SuperSecret123  API_KEY=sk_live_9f2a...',
    snippetAr: 'DB_HOST=localhost  DB_PASSWORD=SuperSecret123  API_KEY=sk_live_9f2a...',
    exposedAr: 'ملف إعدادات يحتوي كلمة مرور قاعدة البيانات ومفاتيح API — لا يجب نشره أبداً.',
    exposedEn: 'A config file with the database password and API keys — must never be published.' },
  { url: `${DOMAIN}/backups/db_backup.sql`, ft: 'sql', tag: 'db',
    title: 'db_backup.sql', titleAr: 'db_backup.sql',
    snippet: '-- MySQL dump   INSERT INTO users (email,password_hash) VALUES ...',
    snippetAr: '-- نسخة MySQL   INSERT INTO users (email,password_hash) VALUES ...',
    exposedAr: 'نسخة احتياطية كاملة لقاعدة البيانات مكشوفة — تحتوي كل حسابات المستخدمين.',
    exposedEn: 'A full database backup is exposed — it contains every user account.' },
  { url: `${DOMAIN}/files/staff-directory.pdf`, ft: 'pdf', tag: 'normal',
    title: 'Staff Directory (PDF)', titleAr: 'دليل الموظفين (PDF)',
    snippet: 'Names, emails and phone numbers of all staff members.',
    snippetAr: 'أسماء وبريد وأرقام هواتف جميع الموظفين.',
    exposedAr: 'دليل الموظفين يكشف بيانات التواصل — يُستخدم في هجمات التصيّد.',
    exposedEn: 'The staff directory leaks contact info — handy for phishing attacks.' },
  { url: `${DOMAIN}/robots.txt`, ft: 'txt', tag: 'robots',
    title: 'robots.txt', titleAr: 'robots.txt',
    snippet: 'User-agent: *   Disallow: /admin/   Disallow: /backups/   Disallow: /config/',
    snippetAr: 'User-agent: *   Disallow: /admin/   Disallow: /backups/   Disallow: /config/',
    exposedAr: 'مفارقة! ملف robots.txt يخبر المهاجم بالمسارات «السرية» التي يجب أن ينظر فيها.',
    exposedEn: 'Ironic! robots.txt tells the attacker exactly which "secret" paths to look at.' },
]

const OPERATORS = [
  { op: 'site:', ex: 'site:alnoor-school.edu.qa', ar: 'حصر البحث في موقع واحد', en: 'Limit the search to one website' },
  { op: 'filetype:', ex: 'filetype:xlsx', ar: 'البحث عن نوع ملف معيّن (ext: مثله)', en: 'Find a specific file type (ext: too)' },
  { op: 'intitle:', ex: 'intitle:"index of"', ar: 'كلمة داخل عنوان الصفحة', en: 'A word in the page title' },
  { op: 'inurl:', ex: 'inurl:admin', ar: 'كلمة داخل الرابط', en: 'A word inside the URL' },
  { op: 'intext:', ex: 'intext:password', ar: 'كلمة داخل نص الصفحة', en: 'A word in the page text' },
  { op: '"…"', ex: '"student grades"', ar: 'عبارة مطابقة تماماً', en: 'An exact-match phrase' },
  { op: '-word', ex: 'login -parent', ar: 'استبعاد كلمة من النتائج', en: 'Exclude a word from results' },
]

const CHIPS = [
  `site:${DOMAIN}`, 'filetype:xlsx', 'filetype:sql', 'intitle:"index of"', 'inurl:admin', 'intext:password',
]

const MISSIONS = [
  { key: 'login',   is: p => p.tag === 'login',   ar: 'اعثر على صفحة دخول الإدارة', en: 'Find the admin login page', hintAr: 'جرّب: inurl:admin', hintEn: 'Try: inurl:admin' },
  { key: 'dirlist', is: p => p.tag === 'dirlist', ar: 'اعثر على قائمة مجلد مفتوحة', en: 'Find an open directory listing', hintAr: 'جرّب: intitle:"index of"', hintEn: 'Try: intitle:"index of"' },
  { key: 'sheet',   is: p => p.tag === 'sheet',   ar: 'اعثر على جدول درجات مسرّب', en: 'Find a leaked grades spreadsheet', hintAr: 'جرّب: filetype:xlsx', hintEn: 'Try: filetype:xlsx' },
  { key: 'creds',   is: p => p.tag === 'creds',   ar: 'اعثر على ملف يحتوي كلمات مرور', en: 'Find a file containing passwords', hintAr: 'جرّب: intext:password', hintEn: 'Try: intext:password' },
]

// ── dork parser ────────────────────────────────────────────────────────────────
function parse(q) {
  const ops = { site: [], filetype: [], intitle: [], inurl: [], intext: [] }
  const phrases = [], terms = [], excl = []
  const re = /(\w+):"([^"]+)"|(\w+):(\S+)|"([^"]+)"|(\S+)/g
  let m
  const addOp = (k, v) => {
    k = k.toLowerCase(); v = v.toLowerCase()
    if (k === 'ext') k = 'filetype'
    if (k === 'filetype') v = v.replace(/^\./, '')
    if (ops[k]) ops[k].push(v)
    else terms.push(k + ':' + v)   // unknown operator → treat as a plain term
  }
  while ((m = re.exec(q))) {
    if (m[1]) addOp(m[1], m[2])
    else if (m[3]) addOp(m[3], m[4])
    else if (m[5]) phrases.push(m[5].toLowerCase())
    else if (m[6]) {
      const w = m[6]
      if (w.startsWith('-') && w.length > 1) excl.push(w.slice(1).toLowerCase())
      else terms.push(w.toLowerCase())
    }
  }
  return { ops, phrases, terms, excl }
}

function search(q) {
  if (!q.trim()) return null
  const { ops, phrases, terms, excl } = parse(q)
  return INDEX.filter(p => {
    const hay = (p.title + ' ' + p.url + ' ' + p.snippet).toLowerCase()
    for (const s of ops.site)     if (!p.url.toLowerCase().includes(s)) return false
    for (const f of ops.filetype) if (p.ft.toLowerCase() !== f) return false
    for (const t of ops.intitle)  if (!p.title.toLowerCase().includes(t)) return false
    for (const u of ops.inurl)    if (!p.url.toLowerCase().includes(u)) return false
    for (const x of ops.intext)   if (!p.snippet.toLowerCase().includes(x)) return false
    for (const p2 of phrases)     if (!hay.includes(p2)) return false
    for (const t of terms)        if (!hay.includes(t)) return false
    for (const e of excl)         if (hay.includes(e)) return false
    return true
  })
}

export default function PageDorking() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const ar = lang === 'ar'

  const [query, setQuery]   = useState('')
  const [run, setRun]       = useState('')          // the executed query
  const [found, setFound]   = useState({})          // mission key -> true
  const [showOps, setShowOps] = useState(false)

  const results = run ? search(run) : null

  const doSearch = (qArg) => {
    const q = (qArg !== undefined ? qArg : query)
    setRun(q)
    const res = search(q) || []
    setFound(prev => {
      const next = { ...prev }
      MISSIONS.forEach(mi => { if (res.some(mi.is)) next[mi.key] = true })
      return next
    })
  }

  const addChip = (chip) => setQuery(q => (q.trim() ? q.trim() + ' ' : '') + chip)
  const foundCount = MISSIONS.filter(mi => found[mi.key]).length

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 14px', fontFamily: 'sans-serif' }} dir={ar ? 'rtl' : 'ltr'}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ background: '#eef2ff', color: '#4338ca', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🔎 {ar ? 'استطلاع وجمع معلومات (OSINT)' : 'Recon & OSINT'}</span>
        <button onClick={() => navigate('/')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '3px 10px', fontSize: 12, color: '#64748b', cursor: 'pointer' }}>{ar ? '← الرئيسية' : '← Home'}</button>
      </div>
      <h1 style={{ fontSize: 23, fontWeight: 900, color: '#1e293b', margin: '0 0 12px' }}>🔎 {ar ? 'الاختراق عبر جوجل — Google Dorking' : 'Google Hacking — Google Dorking'}</h1>

      {/* missions */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0e1f39' }}>🎯 {ar ? 'المهمة' : 'Mission'}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: foundCount === MISSIONS.length ? '#15803d' : '#64748b' }}>{ar ? `${foundCount} / ${MISSIONS.length}` : `${foundCount} / ${MISSIONS.length}`}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 8 }}>
          {MISSIONS.map(mi => {
            const ok = found[mi.key]
            return (
              <div key={mi.key} style={{ display: 'flex', alignItems: 'center', gap: 8, background: ok ? '#f0fdf4' : 'white', border: `2px solid ${ok ? '#86efac' : '#e2e8f0'}`, borderRadius: 10, padding: '8px 10px' }}>
                <span style={{ width: 20, height: 20, borderRadius: 6, background: ok ? '#22c55e' : '#f1f5f9', color: ok ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{ok ? '✓' : '🎯'}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: ok ? '#15803d' : '#475569' }}>{ar ? mi.ar : mi.en}</div>
                  {!ok && <div style={{ fontSize: 10.5, color: '#94a3b8', fontFamily: 'monospace' }} dir="ltr">{ar ? mi.hintAr : mi.hintEn}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* search engine */}
      <div style={{ border: '2px solid #e2e8f0', borderRadius: 14, background: 'white', boxShadow: '0 6px 18px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 10px' }}>
          <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, marginBottom: 10, letterSpacing: -0.5 }}>
            <span style={{ color: '#4285f4' }}>G</span><span style={{ color: '#ea4335' }}>o</span><span style={{ color: '#fbbc05' }}>o</span><span style={{ color: '#4285f4' }}>g</span><span style={{ color: '#34a853' }}>l</span><span style={{ color: '#ea4335' }}>e</span>
            <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}> {ar ? '(محاكاة)' : '(simulation)'}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: 24, padding: '6px 8px 6px 14px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <Search size={16} color="#9aa0a6" style={{ flexShrink: 0 }} />
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') doSearch() }}
              placeholder={ar ? 'اكتب استعلام دورك… مثال: site:alnoor-school.edu.qa filetype:pdf' : 'Type a dork query… e.g. site:alnoor-school.edu.qa filetype:pdf'}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'monospace', minWidth: 0 }} dir="ltr" />
            {query && <button onClick={() => setQuery('')} style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 15 }}>✕</button>}
            <button onClick={() => doSearch()} style={{ background: '#1a73e8', color: 'white', border: 'none', borderRadius: 20, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>{ar ? 'بحث' : 'Search'}</button>
          </div>
          {/* chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {CHIPS.map(c => (
              <button key={c} onClick={() => addChip(c)} style={{ fontFamily: 'monospace', fontSize: 11.5, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', borderRadius: 16, padding: '4px 10px', cursor: 'pointer' }} dir="ltr">+ {c}</button>
            ))}
            <button onClick={() => setShowOps(v => !v)} style={{ fontSize: 11.5, background: '#eef2ff', border: '1px solid #c7d2fe', color: '#4338ca', borderRadius: 16, padding: '4px 10px', cursor: 'pointer', fontWeight: 700 }}>📖 {ar ? 'دليل العوامل' : 'Operators guide'}</button>
          </div>
          {showOps && (
            <div style={{ marginTop: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10 }}>
              {OPERATORS.map(o => (
                <div key={o.op} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '3px 0', fontSize: 12 }} dir={ar ? 'rtl' : 'ltr'}>
                  <code style={{ fontFamily: 'monospace', color: '#7c3aed', fontWeight: 700, minWidth: 70 }} dir="ltr">{o.op}</code>
                  <span style={{ color: '#475569', flex: 1 }}>{ar ? o.ar : o.en}</span>
                  <code style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: 11 }} dir="ltr">{o.ex}</code>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* results */}
        <div style={{ borderTop: '1px solid #eef2f7', background: '#fbfcfe', padding: '12px 16px', minHeight: 160 }}>
          {results === null ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '30px 10px' }}>{ar ? 'اكتب استعلاماً واضغط «بحث». استخدم الأزرار أعلاه لبناء الدورك.' : 'Type a query and press Search. Use the chips above to build a dork.'}</div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '30px 10px' }}>{ar ? 'لا توجد نتائج مطابقة. جرّب عوامل مختلفة.' : 'No matching results. Try different operators.'}</div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }} dir="ltr">≈ {results.length} {ar ? 'نتيجة لـ' : 'results for'} <code style={{ fontFamily: 'monospace', color: '#334155' }}>{run}</code></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {results.map((p, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 12.5, color: '#0b7a34' }} dir="ltr">{p.url}</div>
                    <div style={{ fontSize: 17, color: '#1a0dab', lineHeight: 1.3, cursor: 'pointer' }}>{ar ? p.titleAr : p.title}</div>
                    <div style={{ fontSize: 12.5, color: '#4d5156', lineHeight: 1.5, marginTop: 2 }} dir={/[A-Za-z]/.test((ar ? p.snippetAr : p.snippet)[0]) ? 'ltr' : (ar ? 'rtl' : 'ltr')}>{ar ? p.snippetAr : p.snippet}</div>
                    {p.exposedEn && (
                      <div style={{ marginTop: 5, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 10px', fontSize: 11.5, color: '#b91c1c', lineHeight: 1.6 }} dir={ar ? 'rtl' : 'ltr'}>
                        ⚠️ <b>{ar ? 'بيانات مكشوفة:' : 'Exposed:'}</b> {ar ? p.exposedAr : p.exposedEn}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* success */}
      {foundCount === MISSIONS.length && (
        <div style={{ marginTop: 14, background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 30 }}>🏆</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#15803d' }}>{ar ? 'أكملت الفحص! وجدت كل ما تركته المدرسة مكشوفاً.' : 'Audit complete! You found everything the school left exposed.'}</div>
          <div style={{ fontSize: 12.5, color: '#166534', marginTop: 4 }}>{ar ? 'هكذا يبدأ المهاجم — والمدافع — كل تقييم: بمعرفة ما هو منشور علناً.' : 'This is how both attacker and defender start every assessment: by learning what is publicly exposed.'}</div>
        </div>
      )}

      {/* explanation — collapsed by default, sits under the practical part */}
      <Explanation>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px', maxWidth: 820, lineHeight: 1.7 }}>
          {ar
            ? '«الدوركينغ» هو استخدام عوامل بحث متقدّمة في جوجل للعثور على أشياء منشورة على الإنترنت لكنها لم تكن مقصودة للعلن — ملفات وصفحات دخول ونسخ احتياطية مكشوفة. مهمتك: أنت باحث أمني كلّفتك مدرسة النور بفحص ما تركته مكشوفاً. استخدم العوامل لإيجاد الأهداف الأربعة.'
            : "“Dorking” is using advanced Google search operators to find things published online that were never meant to be public — exposed files, login pages, and backups. Your mission: you're a security researcher hired by Al-Noor School to audit what it left exposed. Use the operators to find the four targets."}
        </p>
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: '#92610a', marginBottom: 14, lineHeight: 1.6 }} dir={ar ? 'rtl' : 'ltr'}>
          ⚖️ {ar ? 'هذه محاكاة تعليمية آمنة. في الواقع: استخدم الدوركينغ على مواقعك أنت أو بإذن صريح فقط — الوصول لبيانات الآخرين المكشوفة قد يكون مخالفاً للقانون.' : 'This is a safe educational simulation. In real life: only dork your own sites or with explicit permission — accessing other people’s exposed data can be illegal.'}
        </div>
        <div style={{ background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#1e40af', marginBottom: 6 }}>🛡️ {ar ? 'كيف تحمي موقعك من الدوركينغ' : 'How to protect your site from dorking'}</div>
          <ul style={{ margin: 0, paddingInlineStart: 20, color: '#1e3a8a', fontSize: 12.5, lineHeight: 1.9 }}>
            <li>{ar ? 'لا تضع ملفات حساسة (نسخ احتياطية، جداول، ‎.env‎) في مجلد الويب العام أبداً.' : 'Never put sensitive files (backups, spreadsheets, .env) in the public web folder.'}</li>
            <li>{ar ? 'احمِ صفحات الدخول ولوحات الإدارة بكلمة مرور، ولا تعتمد على «صعوبة إيجاد الرابط».' : 'Protect login and admin pages with authentication — don’t rely on “nobody will find the URL”.'}</li>
            <li>{ar ? 'أوقف قوائم المجلدات (Directory Listing) على الخادم.' : 'Disable directory listing on the server.'}</li>
            <li>{ar ? 'لإخفاء صفحة عن جوجل استخدم noindex أو أداة إزالة المحتوى — و robots.txt لا يُخفي، بل قد يكشف مساراتك!' : 'To hide a page from Google use noindex or the removal tool — robots.txt does NOT hide it, it can reveal your paths!'}</li>
            <li>{ar ? 'افحص موقعك بنفسك بنفس الدوركات لتجد ما تركته مكشوفاً قبل غيرك.' : 'Dork your own site with these same queries to find what you left exposed before others do.'}</li>
          </ul>
        </div>
      </Explanation>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1d4ed8', background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 10, padding: '10px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          <ChevronLeft size={15} />{ar ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
