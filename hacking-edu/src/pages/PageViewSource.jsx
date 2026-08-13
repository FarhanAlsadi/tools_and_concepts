import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

// the target site — a developer left the admin credentials in the HTML comment
const SITE = { host: 'alwasl-tech.com', user: 'admin', pass: 'Wasl@2024', companyAr: 'شركة الوصل التقنية', companyEn: 'Al Wasl Tech' }

// the page source — the credentials sit in an HTML comment (the vulnerability)
const SOURCE = [
  { t: '<!DOCTYPE html>' },
  { t: '<html lang="ar" dir="rtl">' },
  { t: '<head>' },
  { t: '  <meta charset="UTF-8" />' },
  { t: '  <title>لوحة تحكم — شركة الوصل التقنية</title>' },
  { t: '  <link rel="stylesheet" href="/css/style.css" />' },
  { t: '</head>' },
  { t: '<body>' },
  { t: '  <form action="/login" method="POST" class="login-box">' },
  { t: '    <h1>تسجيل دخول المدير</h1>' },
  { t: '    <input name="username" type="text" placeholder="اسم المستخدم" />' },
  { t: '    <input name="password" type="password" placeholder="كلمة المرور" />' },
  { t: '    <button type="submit">دخول</button>' },
  { t: '  </form>' },
  { t: '' },
  { t: '  <!-- TODO: بيانات دخول المدير للاختبار - احذفها قبل النشر! -->', secret: true },
  { t: `  <!-- username: ${SITE.user} -->`, secret: true },
  { t: `  <!-- password: ${SITE.pass} -->`, secret: true },
  { t: '' },
  { t: '  <script src="/js/app.js"></script>' },
  { t: '</body>' },
  { t: '</html>' },
]

export default function PageViewSource() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [view, setView]     = useState('page')   // 'page' | 'source'
  const [viewed, setViewed] = useState(false)    // has the student opened the source?
  const [lu, setLu]         = useState('')
  const [lp, setLp]         = useState('')
  const [lerr, setLerr]     = useState(false)
  const [authed, setAuthed] = useState(false)

  const showSource = () => { setView('source'); setViewed(true) }

  // Ctrl+U (or Cmd+U) → view page source, exactly like a real browser
  useEffect(() => {
    const onKey = e => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault()
        showSource()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const login = () => {
    if (lu.trim() === SITE.user && lp === SITE.pass) { setAuthed(true); setLerr(false) }
    else setLerr(true)
  }

  const steps = [
    { ok: viewed, ar: 'افتح كود المصدر (Ctrl+U)', en: 'Open the page source (Ctrl+U)', ic: '🔍' },
    { ok: viewed, ar: 'ابحث عن اسم المستخدم وكلمة المرور', en: 'Find the username & password', ic: '🕵️' },
    { ok: authed, ar: 'سجّل الدخول بالبيانات التي وجدتها', en: 'Log in with the credentials you found', ic: '🔑' },
  ]

  const box = { border:'1px solid #cbd5e1', borderRadius:8, padding:'9px 11px', width:'100%', boxSizing:'border-box', marginBottom:8, fontSize:13 }

  return (
    <div style={{ maxWidth:1080, margin:'0 auto', padding:'20px 14px', fontFamily:'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      {/* header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <span style={{ background:'#eef2ff', color:'#4338ca', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>🧪 {isAr ? 'مختبر أمان الويب' : 'Web Security Lab'}</span>
        <button onClick={() => navigate('/')} style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:7, padding:'3px 10px', fontSize:12, color:'#64748b', cursor:'pointer' }}>{isAr ? '← الرئيسية' : '← Home'}</button>
      </div>
      <h1 style={{ fontSize:23, fontWeight:900, color:'#1e293b', margin:'0 0 14px' }}>🔎 {isAr ? 'ثغرة كود المصدر (View Source)' : 'Page Source Vulnerability (View Source)'}</h1>

      {/* objectives */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex:1, minWidth:180, display:'flex', alignItems:'center', gap:8, background: s.ok ? '#f0fdf4' : 'white', border:`2px solid ${s.ok ? '#86efac' : '#e2e8f0'}`, borderRadius:10, padding:'8px 11px' }}>
            <span style={{ width:22, height:22, borderRadius:6, background: s.ok ? '#22c55e' : '#f1f5f9', color: s.ok ? 'white' : '#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0 }}>{s.ok ? '✓' : s.ic}</span>
            <span style={{ fontSize:11.5, fontWeight:700, color: s.ok ? '#15803d' : '#475569' }}>{i + 1}. {isAr ? s.ar : s.en}</span>
          </div>
        ))}
      </div>

      {/* simulated browser */}
      <div style={{ border:'2px solid #cbd5e1', borderRadius:12, overflow:'hidden', background:'white', boxShadow:'0 6px 18px rgba(0,0,0,0.08)' }}>
        {/* chrome */}
        <div style={{ background:'#e2e8f0', padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }} dir="ltr">
          <span style={{ display:'flex', gap:4 }}><span style={{ width:9, height:9, borderRadius:'50%', background:'#ef4444' }} /><span style={{ width:9, height:9, borderRadius:'50%', background:'#f59e0b' }} /><span style={{ width:9, height:9, borderRadius:'50%', background:'#22c55e' }} /></span>
          <div style={{ flex:1, background:'white', borderRadius:20, padding:'4px 12px', border:'1px solid #cbd5e1', fontFamily:'monospace', fontSize:11.5, color:'#334155' }}>🔒 https://{SITE.host}/login</div>
        </div>

        {/* tab bar */}
        <div style={{ display:'flex', gap:6, alignItems:'center', padding:'7px 10px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
          <button onClick={() => setView('page')} style={{ fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:7, border:'1px solid', cursor:'pointer', background: view === 'page' ? '#0e1f39' : 'white', color: view === 'page' ? 'white' : '#64748b', borderColor: view === 'page' ? '#0e1f39' : '#e2e8f0' }}>👁 {isAr ? 'الصفحة' : 'Page'}</button>
          <button onClick={showSource} style={{ fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:7, border:'1px solid', cursor:'pointer', background: view === 'source' ? '#0e1f39' : 'white', color: view === 'source' ? 'white' : '#64748b', borderColor: view === 'source' ? '#0e1f39' : '#e2e8f0' }} dir="ltr">{'</>'} {isAr ? 'كود المصدر' : 'Page Source'}</button>
          <span style={{ marginInlineStart:'auto', fontSize:11, color:'#94a3b8' }}>{isAr ? 'اضغط ' : 'Press '}<kbd style={{ background:'#e2e8f0', border:'1px solid #cbd5e1', borderRadius:4, padding:'1px 6px', fontFamily:'monospace', fontSize:11, color:'#334155' }}>Ctrl + U</kbd>{isAr ? ' لعرض المصدر' : ' to view source'}</span>
        </div>

        {/* body */}
        {view === 'page' ? (
          <div style={{ padding:'26px 18px', minHeight:260, display:'flex', alignItems:'center', justifyContent:'center', background:'#f1f5f9' }}>
            {authed ? (
              <div style={{ textAlign:'center', animation:'none' }}>
                <div style={{ fontSize:44 }}>✅</div>
                <div style={{ fontSize:18, fontWeight:900, color:'#15803d' }}>{isAr ? `مرحباً ${SITE.user} — تم تسجيل الدخول` : `Welcome ${SITE.user} — Logged in`}</div>
                <div style={{ fontSize:12.5, color:'#166534', marginTop:6, maxWidth:340, lineHeight:1.7 }}>{isAr ? 'لقد دخلت لوحة الإدارة باستخدام بيانات وجدتها في كود المصدر — هكذا يستغل المهاجم هذه الثغرة!' : 'You reached the admin panel using credentials found in the page source — that is exactly how an attacker exploits this bug!'}</div>
              </div>
            ) : (
              <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:14, padding:'22px 20px', width:320, boxShadow:'0 4px 14px rgba(0,0,0,0.06)' }}>
                <div style={{ textAlign:'center', marginBottom:14 }}>
                  <div style={{ fontSize:30 }}>🔐</div>
                  <div style={{ fontSize:16, fontWeight:900, color:'#0e1f39' }}>{isAr ? 'تسجيل دخول المدير' : 'Admin Login'}</div>
                  <div style={{ fontSize:11.5, color:'#94a3b8' }}>{isAr ? SITE.companyAr : SITE.companyEn}</div>
                </div>
                <input value={lu} onChange={e => setLu(e.target.value)} placeholder={isAr ? 'اسم المستخدم' : 'username'} style={box} dir="ltr" />
                <input value={lp} onChange={e => setLp(e.target.value)} type="password" placeholder={isAr ? 'كلمة المرور' : 'password'} onKeyDown={e => { if (e.key === 'Enter') login() }} style={box} dir="ltr" />
                <button onClick={login} style={{ width:'100%', background:'#0e1f39', color:'white', border:'none', borderRadius:8, padding:'9px', fontWeight:700, cursor:'pointer', fontSize:13 }}>{isAr ? 'دخول' : 'Sign in'}</button>
                {lerr && <div style={{ color:'#dc2626', fontSize:12, marginTop:8, textAlign:'center' }}>{isAr ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Incorrect username or password'}</div>}
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:10, textAlign:'center', lineHeight:1.6 }}>{isAr ? '💡 لا تعرف البيانات؟ اضغط Ctrl+U لرؤية كود المصدر.' : '💡 Don’t know the credentials? Press Ctrl+U to view the source.'}</div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ background:'#fffbeb', borderBottom:'1px solid #fde68a', padding:'8px 14px', fontSize:12, color:'#92610a', fontWeight:600 }} dir={isAr ? 'rtl' : 'ltr'}>
              ⚠️ {isAr ? 'انظر السطور المميّزة بالأحمر — بيانات الدخول مكتوبة داخل الكود!' : 'Look at the red-highlighted lines — the login credentials are written inside the code!'}
            </div>
            <pre style={{ margin:0, background:'#0b1020', padding:'14px 16px', fontFamily:'monospace', fontSize:12.5, lineHeight:1.7, overflowX:'auto', minHeight:220 }} dir="ltr">
              {SOURCE.map((l, i) => (
                <div key={i} style={{ display:'flex', gap:12, background: l.secret ? 'rgba(239,68,68,0.16)' : 'transparent', borderRadius:4, padding:'0 4px' }}>
                  <span style={{ color:'#475569', userSelect:'none', minWidth:22, textAlign:'right' }}>{i + 1}</span>
                  <span style={{ color: l.secret ? '#fca5a5' : '#7dd3fc', fontWeight: l.secret ? 800 : 400, whiteSpace:'pre' }}>{l.t || ' '}</span>
                </div>
              ))}
            </pre>
          </div>
        )}
      </div>

      {/* explanation — collapsed by default, sits under the practical part */}
      <Explanation>
        <p style={{ fontSize:13, color:'#64748b', margin:'0 0 14px', maxWidth:820, lineHeight:1.7 }}>
          {isAr
            ? 'أي زائر يستطيع رؤية كود HTML لأي صفحة ويب بالضغط على Ctrl+U. إذا ترك المطوّر بيانات سرية (مثل اسم المستخدم وكلمة المرور) داخل الكود، فسيراها الجميع! جرّب بنفسك على صفحة الدخول أدناه.'
            : 'Anyone can view a web page’s HTML by pressing Ctrl+U. If the developer leaves secrets (like a username and password) inside the code, everyone can see them! Try it yourself on the login page below.'}
        </p>
        {viewed && (
          <div style={{ background:'#fef2f2', border:'2px solid #fecaca', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:14, fontWeight:900, color:'#b91c1c', marginBottom:6 }}>🛑 {isAr ? 'الثغرة والحل' : 'The Vulnerability & The Fix'}</div>
            <p style={{ fontSize:13, color:'#7f1d1d', margin:'0 0 8px', lineHeight:1.8, fontWeight:700 }}>
              ⚠️ {isAr
                ? 'احذف اسم المستخدم وكلمة المرور من كود المصدر قبل نشر الموقع.'
                : 'Remove the username and password from the page source before publishing the website.'}
            </p>
            <ul style={{ margin:0, paddingInlineStart:20, color:'#991b1b', fontSize:12.5, lineHeight:1.9 }}>
              <li>{isAr ? 'أي شخص يستطيع قراءة كود الواجهة (HTML و JavaScript) — لا تضع فيه أي بيانات سرية.' : 'Anyone can read your front-end code (HTML & JavaScript) — never put secrets there.'}</li>
              <li>{isAr ? 'التعليقات <!-- ... --> والحقول المخفية ليست مخفية فعلاً؛ تظهر كاملة في كود المصدر.' : 'Comments <!-- ... --> and hidden fields are not really hidden; they appear fully in the source.'}</li>
              <li>{isAr ? 'يجب أن يتم التحقق من كلمة المرور على الخادم (Server)، ولا تصل كلمات المرور إلى المتصفح أبداً.' : 'Password checks must happen on the server; passwords should never reach the browser.'}</li>
            </ul>
          </div>
        )}
      </Explanation>

      <div style={{ display:'flex', justifyContent:'center', marginTop:20 }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:6, color:'#1d4ed8', background:'#eff6ff', border:'2px solid #bfdbfe', borderRadius:10, padding:'10px 28px', cursor:'pointer', fontSize:14, fontWeight:700 }}>
          <ChevronLeft size={15} />{isAr ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
