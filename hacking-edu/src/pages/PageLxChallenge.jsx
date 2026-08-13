import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import LinuxTerminal from '../components/LinuxTerminal'
import SimBrowser, { WebNav } from '../components/SimBrowser'
import { runGobuster, runHydra, runBarq, siteChallengeFs, SITE } from '../lib/linuxLab'

// only the PUBLIC pages appear in the navbar — the rest (customers, login,
// employees, admin, …) are hidden and must be discovered with gobuster.
const NAV = [
  ['/', 'الرئيسية', 'Home'], ['/about', 'من نحن', 'About'], ['/products', 'المنتجات', 'Products'],
]

const HIGH_SALARY = Math.max(...SITE.employees.map(e => e.salary))   // 52000 — Sara (CEO)

// terse questions — NO hints about where to look or which tool to use, and no answer-shaped placeholders
const QUESTIONS = [
  { id:'q1', icon:'👤', ar:'ما اسم المستخدم الخاص بحساب الإدارة؟', en:'What is the admin account’s username?', check:v => v.trim().toLowerCase() === SITE.user },
  { id:'q2', icon:'🔑', ar:'ما كلمة المرور الخاصة بحساب الإدارة؟', en:'What is the admin account’s password?', check:v => v.trim() === SITE.pass },
  { id:'q3', icon:'📋', ar:'ما اسم الصفحة التي تسرّب بيانات العملاء؟', en:'What is the name of the page leaking customer data?', check:v => v.trim().toLowerCase().replace(/[^a-z/]/g, '').includes('customers') },
  { id:'q4', icon:'👑', ar:'من هو المدير التنفيذي (CEO) للشركة؟', en:'Who is the company’s CEO?', check:v => v.trim().toLowerCase().includes('sara') },
  { id:'q5', icon:'💰', ar:'ما أعلى راتب بين موظفي الشركة؟', en:'What is the highest salary among the company’s employees?', check:v => v.replace(/[^\d]/g, '') === String(HIGH_SALARY) },
  { id:'q6', icon:'🏴', ar:'ما العلم (flag) السرّي للموقع؟', en:'What is the site’s secret flag?', check:v => v.trim().replace(/\s/g, '').toLowerCase() === SITE.flag.toLowerCase() },
]

export default function PageLxChallenge() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [enumerated, setEnum] = useState(false)
  const [cracked, setCracked] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [lu, setLu] = useState(''); const [lp, setLp] = useState(''); const [lerr, setLerr] = useState(false)
  const [ans, setAns] = useState({}); const [ok, setOk] = useState({})

  // ── terminal tools (the browser IS the website) — barq & hydra crack only the REAL user ──
  const gobuster = ctx => runGobuster(ctx, { found: SITE.found, onFound: () => setEnum(true) })
  const hydra = ctx => runHydra(ctx, { user: SITE.user, pass: SITE.pass, onCrack: () => setCracked(true) })
  const barq  = ctx => runBarq(ctx,  { user: SITE.user, pass: SITE.pass, host: SITE.host, onCrack: () => setCracked(true) })

  const login = () => { if (lu.trim() === SITE.user && lp === SITE.pass) { setAuthed(true); setLerr(false) } else setLerr(true) }
  const check = q => setOk(o => ({ ...o, [q.id]: q.check(ans[q.id] || '') }))
  const solvedCount = QUESTIONS.filter(q => ok[q.id] === true).length
  const allSolved = solvedCount === QUESTIONS.length

  // ── the orbyx.store website ────────────────────────────────────────────────
  const H = t => <h1 style={{ fontSize:22, fontWeight:900, color:'#0e1f39', margin:'0 0 10px' }}>{t}</h1>
  const P = t => <p style={{ color:'#475569', margin:'0 0 10px' }}>{t}</p>

  const renderPage = (path, nav) => {
    const shell = body => <div><WebNav links={NAV} nav={nav} isAr={isAr} brand="🛒 Orbyx" />{body}</div>
    // the login page — protected pages (employees, admin) render this when not signed in
    const loginView = note => shell(<>
      {H(isAr ? 'تسجيل الدخول' : 'Login')}
      {note && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'7px 11px', fontSize:11.5, color:'#b91c1c', marginBottom:10 }}>🔒 {note}</div>}
      {authed ? (
        <div style={{ background:'#f0fdf4', border:'2px solid #86efac', borderRadius:10, padding:'12px', color:'#15803d', fontWeight:700 }}>✅ {isAr ? `أنت مسجّل الدخول كـ ${SITE.user}. زُر /admin و /employees.` : `You are logged in as ${SITE.user}. Visit /admin and /employees.`}</div>
      ) : (
        <div style={{ maxWidth:300 }}>
          <input value={lu} onChange={e => setLu(e.target.value)} placeholder={isAr ? 'اسم المستخدم' : 'username'} style={{ width:'100%', padding:'8px 10px', border:'1px solid #cbd5e1', borderRadius:8, marginBottom:8, boxSizing:'border-box' }} dir="ltr" />
          <input value={lp} onChange={e => setLp(e.target.value)} type="password" placeholder={isAr ? 'كلمة المرور' : 'password'} onKeyDown={e => { if (e.key === 'Enter') login() }} style={{ width:'100%', padding:'8px 10px', border:'1px solid #cbd5e1', borderRadius:8, marginBottom:8, boxSizing:'border-box' }} dir="ltr" />
          <button onClick={login} style={{ background:'#0e1f39', color:'white', border:'none', borderRadius:8, padding:'8px 18px', fontWeight:700, cursor:'pointer' }}>{isAr ? 'دخول' : 'Sign in'}</button>
          {lerr && <div style={{ color:'#dc2626', fontSize:12, marginTop:8 }}>{isAr ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Incorrect username or password'}</div>}
        </div>
      )}
    </>)
    if (path === '/' || path === '/home' || path === '/index.html') return shell(<>
      {H(isAr ? 'أوربكس — orbyx.store' : 'Orbyx — orbyx.store')}
      {P(isAr ? 'متجر ومنصة تدريب. هدفك: اختراق هذا الموقع باستخدام ما تعلّمته.' : 'A shop & training platform. Your goal: break into this site using what you learned.')}
      <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#1e40af' }}>{isAr ? '💡 القائمة بالأعلى تُظهر الصفحات العامة فقط. صفحات كثيرة مخفية — اكتشفها بـ gobuster ثم اكتب مسارها في شريط العنوان. بعضها محمي بتسجيل دخول.' : '💡 The menu above shows only the public pages. Many pages are hidden — discover them with gobuster, then type the path in the address bar. Some are protected by a login.'}</div>
    </>)
    if (path === '/about') return shell(<>
      {H(isAr ? 'من نحن' : 'About')}
      {P(isAr ? 'orbyx.store متجر إلكترونيات عبر الإنترنت في الدوحة، تأسّس عام 2021.' : 'orbyx.store is an online electronics store based in Doha, founded in 2021.')}
      <div style={{ display:'flex', alignItems:'center', gap:10, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 12px' }}>
        <span style={{ fontSize:26 }}>👤</span>
        <div><b style={{ color:'#0e1f39' }}>{SITE.founder}</b><div style={{ fontSize:12, color:'#64748b' }}>{isAr ? 'المؤسّس ومدير الموقع — يدير حساب الإدارة بنفسه.' : 'Founder & site administrator — he runs the admin account himself.'}</div></div>
      </div>
    </>)
    if (path === '/products') return shell(<>{H(isAr ? 'المنتجات' : 'Products')}<ul style={{ color:'#475569', paddingInlineStart:20, lineHeight:1.9 }}>{SITE.products.map(c => <li key={c}>{c}</li>)}</ul></>)
    if (path === '/customers') return shell(<>
      {H(isAr ? 'العملاء' : 'Customers')}
      <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'7px 11px', fontSize:11.5, color:'#b91c1c', marginBottom:10 }}>⚠️ {isAr ? 'هذه الصفحة غير محمية — تسريب بيانات! (جمع معلومات)' : 'This page is NOT protected — a data leak! (info gathering)'}</div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}><thead><tr style={{ background:'#f1f5f9' }}>{[isAr ? 'الاسم' : 'Name', isAr ? 'المنتج' : 'Product', isAr ? 'الهاتف' : 'Phone'].map(h => <th key={h} style={{ textAlign:'start', padding:'6px 8px' }}>{h}</th>)}</tr></thead>
        <tbody>{SITE.customers.map(c => <tr key={c.name} style={{ borderTop:'1px solid #f1f5f9' }}><td style={{ padding:'6px 8px' }}>{c.name}</td><td style={{ padding:'6px 8px' }}>{c.plan}</td><td style={{ padding:'6px 8px', fontFamily:'monospace' }} dir="ltr">{c.phone}</td></tr>)}</tbody></table>
    </>)
    if (path === '/employees') return authed ? shell(<>
      {H(isAr ? 'الموظفون (سرّي)' : 'Employees (confidential)')}
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}><thead><tr style={{ background:'#f1f5f9' }}>{[isAr ? 'الاسم' : 'Name', isAr ? 'الدور' : 'Role', isAr ? 'الراتب (ر.ق)' : 'Salary (QAR)'].map(h => <th key={h} style={{ textAlign:'start', padding:'6px 8px' }}>{h}</th>)}</tr></thead>
        <tbody>{SITE.employees.map(e => <tr key={e.name} style={{ borderTop:'1px solid #f1f5f9' }}><td style={{ padding:'6px 8px' }}>{e.name}</td><td style={{ padding:'6px 8px' }}>{e.role}</td><td style={{ padding:'6px 8px', fontFamily:'monospace' }} dir="ltr">{e.salary.toLocaleString('en')}</td></tr>)}</tbody></table>
    </>) : loginView(isAr ? 'صفحة الموظفين محمية — سجّل الدخول لعرضها.' : 'The employees page is protected — sign in to view it.')
    if (path === '/login') return loginView()
    if (path === '/admin') return authed ? shell(<>
      {H(isAr ? 'لوحة الإدارة' : 'Admin Panel')}
      {P(isAr ? `مرحباً ${SITE.user}. الروابط: /employees و /customers.` : `Welcome, ${SITE.user}. Links: /employees and /customers.`)}
      <div style={{ background:'#0b1020', borderRadius:8, padding:'10px 12px', fontFamily:'monospace', fontSize:13 }}><span style={{ color:'#64748b' }}>{'<!-- '}</span><span style={{ color:'#4ade80', fontWeight:800 }}>{SITE.flag}</span><span style={{ color:'#64748b' }}>{' -->'}</span></div>
    </>) : loginView(isAr ? 'لوحة الإدارة محمية — سجّل الدخول للمتابعة.' : 'The admin panel is protected — sign in to continue.')
    if (path === '/robots.txt') return <pre style={{ fontFamily:'monospace', fontSize:12.5, color:'#334155' }}>{'User-agent: *\nDisallow: /admin\nDisallow: /employees'}</pre>
    if (['/images', '/css'].includes(path)) return <pre style={{ fontFamily:'monospace', fontSize:12.5, color:'#334155' }}>{`Index of ${path}/\n\n  ../\n  ${path === '/images' ? 'logo.png' : 'style.css'}`}</pre>
    return null
  }

  const steps = [
    { ok: enumerated, ar:'عدّد الصفحات بـ gobuster',    en:'Enumerate with gobuster', ic:'📂' },
    { ok: cracked,    ar:'اكسر الدخول بـ barq أو hydra', en:'Crack the login with barq or hydra', ic:'⚡' },
    { ok: authed,     ar:'سجّل الدخول في الموقع',         en:'Log into the website', ic:'🔑' },
    { ok: allSolved,  ar:'حُلّ أسئلة التحدي',            en:'Solve the challenge questions', ic:'🏴' },
  ]

  return (
    <div style={{ maxWidth:1180, margin:'0 auto', padding:'20px 14px', fontFamily:'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <span style={{ background:'#faf5ff', color:'#7c3aed', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>🐧 {isAr ? 'مسار لينكس' : 'Linux Track'}</span>
        <button onClick={() => navigate('/linux')} style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:7, padding:'3px 10px', fontSize:12, color:'#64748b', cursor:'pointer' }}>{isAr ? '← مسار لينكس' : '← Linux Track'}</button>
      </div>
      <h1 style={{ fontSize:23, fontWeight:900, color:'#1e293b', margin:'0 0 5px' }}>🏴 {isAr ? 'التحدي النهائي — اخترق orbyx.store' : 'Final Challenge — Break into orbyx.store'}</h1>

      {/* mission brief — NO command hints */}
      <div style={{ background:'linear-gradient(135deg,#0e1f39,#312e81)', borderRadius:12, padding:'13px 16px', marginBottom:14, color:'white' }}>
        <div style={{ fontSize:13, fontWeight:800, marginBottom:4 }}>🎯 {isAr ? 'المهمّة' : 'Mission'}</div>
        <div style={{ fontSize:12.5, lineHeight:1.7, color:'rgba(255,255,255,0.88)' }}>
          {isAr ? 'الهدف orbyx.store. لا أوامر جاهزة هذه المرة. المستخدم الإداري ليس "admin" — اجمع المعلومات من الموقع لتكتشف اسمه الحقيقي أولاً، ثم اكسر كلمة المرور بأداتك المفضّلة (barq أو hydra)، وسجّل الدخول، واقرأ الصفحات المحمية، ثم حُلّ أسئلة التحدي بالأسفل.' : 'Target: orbyx.store. No ready-made commands. The admin user is NOT "admin" — gather info from the site to find the real username first, then crack the password with your tool of choice (barq or hydra), log in, read the protected pages, and solve the challenge questions below.'}
        </div>
        <div style={{ fontSize:11.5, marginTop:8, color:'rgba(255,255,255,0.65)' }}>{isAr ? 'قوائم الكلمات (pages.txt و passwords.txt) في مجلدك — اكتب ls. القائمة العلوية للموقع تُظهر الصفحات العامة فقط؛ الباقي يُكتشف بـ gobuster ثم يُكتب مساره في العنوان.' : 'Your wordlists (pages.txt & passwords.txt) are in your folder — type ls. The site’s top menu shows only public pages; find the rest with gobuster, then type the path in the address bar.'}</div>
      </div>

      {/* objectives */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex:1, minWidth:150, display:'flex', alignItems:'center', gap:8, background: s.ok ? '#f0fdf4' : 'white', border:`2px solid ${s.ok ? '#86efac' : '#e2e8f0'}`, borderRadius:10, padding:'8px 11px' }}>
            <span style={{ width:22, height:22, borderRadius:6, background: s.ok ? '#22c55e' : '#f1f5f9', color: s.ok ? 'white' : '#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0 }}>{s.ok ? '✓' : s.ic}</span>
            <span style={{ fontSize:11.5, fontWeight:700, color: s.ok ? '#15803d' : '#475569' }}>{i + 1}. {isAr ? s.ar : s.en}</span>
          </div>
        ))}
      </div>

      {/* terminal + website */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:16, alignItems:'start' }}>
        <LinuxTerminal isAr={isAr} height={470} initialFs={siteChallengeFs} extraCommands={{ gobuster, barq, hydra }}
          welcome={[{ k:'info', v: isAr ? '# اكتب help للأوامر والأدوات، و ls لرؤية قوائم الكلمات في مجلدك. ابدأ بالاستطلاع.' : '# Type help for commands/tools, and ls to see the wordlists in your folder. Start with recon.' }]} />
        <SimBrowser host={SITE.host} isAr={isAr} height={520} renderPage={renderPage} />
      </div>

      {/* ── challenge questions panel (solved on the page) ─────────────────────── */}
      <div style={{ marginTop:22 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap' }}>
          <span style={{ fontSize:20 }}>📋</span>
          <h2 style={{ fontSize:18, fontWeight:900, color:'#0e1f39', margin:0 }}>{isAr ? 'أسئلة التحدي' : 'Challenge Questions'}</h2>
          <div style={{ marginInlineStart:'auto', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:140, height:8, background:'#f1f5f9', borderRadius:20, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(solvedCount / QUESTIONS.length) * 100}%`, background:'#22c55e', transition:'width .4s' }} />
            </div>
            <span style={{ fontSize:13, fontWeight:800, color:'#475569' }}>{solvedCount}/{QUESTIONS.length}</span>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:12 }}>
          {QUESTIONS.map((q, i) => (
            <div key={q.id} style={{ border:`2px solid ${ok[q.id] === true ? '#86efac' : ok[q.id] === false ? '#fecaca' : '#e2e8f0'}`, background: ok[q.id] === true ? '#f0fdf4' : ok[q.id] === false ? '#fef2f2' : 'white', borderRadius:12, padding:'12px 14px' }}>
              <div style={{ display:'flex', gap:9, marginBottom:9 }}>
                <span style={{ fontSize:19, flexShrink:0 }}>{q.icon}</span>
                <div>
                  <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8' }}>Q{i + 1}</div>
                  <div style={{ fontSize:12.5, fontWeight:700, color:'#1e293b', lineHeight:1.5 }}>{isAr ? q.ar : q.en}</div>
                </div>
              </div>
              {ok[q.id] === true ? (
                <div style={{ fontSize:12.5, fontWeight:800, color:'#15803d' }}>✓ {isAr ? 'صحيح!' : 'Correct!'}</div>
              ) : (
                <>
                  <div style={{ display:'flex', gap:7 }}>
                    <input value={ans[q.id] || ''} onChange={e => { setAns(a => ({ ...a, [q.id]: e.target.value })); setOk(o => ({ ...o, [q.id]: undefined })) }} onKeyDown={e => { if (e.key === 'Enter') check(q) }} placeholder={isAr ? 'اكتب إجابتك…' : 'Your answer…'}
                      style={{ flex:1, padding:'7px 10px', border:'1px solid #cbd5e1', borderRadius:8, fontFamily:'monospace', fontSize:12.5, minWidth:0 }} dir={isAr ? 'rtl' : 'ltr'} />
                    <button onClick={() => check(q)} style={{ background:'#7c3aed', color:'white', border:'none', borderRadius:8, padding:'7px 14px', fontWeight:700, cursor:'pointer', fontSize:12, flexShrink:0 }}>{isAr ? 'تحقّق' : 'Check'}</button>
                  </div>
                  {ok[q.id] === false && <div style={{ color:'#dc2626', fontSize:11.5, marginTop:6, fontWeight:700 }}>✗ {isAr ? 'خطأ، حاول مجدداً' : 'Wrong, try again'}</div>}
                </>
              )}
            </div>
          ))}
        </div>

        {allSolved && (
          <div style={{ marginTop:16, background:'linear-gradient(135deg,#16a34a,#15803d)', borderRadius:14, padding:'18px 20px', color:'white', textAlign:'center' }}>
            <div style={{ fontSize:34 }}>🏆</div>
            <div style={{ fontSize:18, fontWeight:900 }}>{isAr ? 'أحسنت! اخترقت orbyx.store بالكامل!' : 'Well done! You fully compromised orbyx.store!'}</div>
            <div style={{ fontSize:12.5, marginTop:6, color:'rgba(255,255,255,0.9)', lineHeight:1.7 }}>{isAr ? 'من الاستطلاع بـ gobuster، إلى كسر الدخول بـ barq/hydra، إلى جمع المعلومات وقراءة الصفحات المحمية والعلم. 👏' : 'From gobuster recon, to cracking with barq/hydra, to info gathering, protected pages and the flag. 👏'}</div>
          </div>
        )}
      </div>

      <div style={{ display:'flex', justifyContent:'center', marginTop:20 }}>
        <button onClick={() => navigate('/linux')} style={{ display:'flex', alignItems:'center', gap:6, color:'#1d4ed8', background:'#eff6ff', border:'2px solid #bfdbfe', borderRadius:10, padding:'10px 28px', cursor:'pointer', fontSize:14, fontWeight:700 }}>
          <ChevronLeft size={15} />{isAr ? 'مسار لينكس' : 'Linux Track'}
        </button>
      </div>
    </div>
  )
}
