import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'
import LinuxTerminal from '../components/LinuxTerminal'
import SimBrowser, { WebNav } from '../components/SimBrowser'
import { runGobuster, QA } from '../lib/linuxLab'

const CMD = `gobuster -u website -w file`
const NAV = [['/', 'الرئيسية', 'Home'], ['/about', 'من نحن', 'About'], ['/courses', 'الدورات', 'Courses'], ['/team', 'الفريق', 'Team'], ['/blog', 'المدونة', 'Blog'], ['/contact', 'اتصل بنا', 'Contact']]

// each discovered page shows content that reflects its name
function renderQaPage(path, nav, isAr) {
  const shell = body => <div><WebNav links={NAV} nav={nav} isAr={isAr} brand="💡 Brightbyte" />{body}</div>
  const H = t => <h1 style={{ fontSize:22, fontWeight:900, color:'#0e1f39', margin:'0 0 10px' }}>{t}</h1>
  const P = t => <p style={{ color:'#475569', margin:'0 0 10px' }}>{t}</p>

  if (path === '/' || path === '/index.html') return shell(<>
    {H(isAr ? 'برايت بايت — قطر' : 'Brightbyte — Qatar')}
    {P(isAr ? 'نُعلّم البرمجة والأمن السيبراني للطلاب في قطر. تصفّح الدورات، وتعرّف على الفريق، واقرأ المدونة.' : 'We teach coding and cybersecurity to students in Qatar. Browse our courses, meet the team, and read the blog.')}
    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#166534' }}>{isAr ? '💡 عدّل العنوان بالأعلى لزيارة الصفحات التي اكتشفتها بـ gobuster.' : '💡 Edit the address bar above to visit the pages you discovered with gobuster.'}</div>
  </>)
  if (path === '/about') return shell(<>
    {H(isAr ? 'من نحن' : 'About Us')}
    {P(isAr ? 'برايت بايت أكاديمية برمجة تأسست عام 2020 في الدوحة، تمكّن الجيل القادم من المطوّرين.' : 'Brightbyte, a coding academy founded in 2020 in Doha, empowering the next generation of developers.')}
    {P(isAr ? 'أكثر من 500 طالب و12 مدرباً معتمداً.' : '500+ students and 12 certified instructors.')}
  </>)
  if (path === '/courses') return shell(<>
    {H(isAr ? 'الدورات' : 'Our Courses')}
    <ul style={{ color:'#475569', paddingInlineStart:20, lineHeight:1.9 }}>
      {['Python Programming', 'Web Development', 'Cybersecurity', 'AI & Data Science', 'Game Design'].map(c => <li key={c}>{c}</li>)}
    </ul>
  </>)
  if (path === '/team') return shell(<>
    {H(isAr ? 'الفريق' : 'The Team')}
    {[['Sara Al Kuwari', 'CEO'], ['Omar Al Marri', 'CTO'], ['Lina Haddad', 'Lead Instructor']].map(([n, r]) => (
      <div key={n} style={{ display:'flex', gap:10, alignItems:'center', padding:'6px 0', borderBottom:'1px solid #f1f5f9' }}>
        <span style={{ fontSize:22 }}>👤</span><b>{n}</b><span style={{ color:'#94a3b8', fontSize:12 }}>{r}</span>
      </div>
    ))}
  </>)
  if (path === '/blog') return shell(<>
    {H(isAr ? 'المدونة' : 'Blog')}
    {[isAr ? 'كيف تبدأ في الأمن السيبراني' : 'How to get started in Cybersecurity', isAr ? '٥ مشاريع بايثون للمبتدئين' : '5 Python projects for beginners', isAr ? 'ما هو اختبار الاختراق؟' : 'What is penetration testing?'].map((t, i) => (
      <div key={i} style={{ padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}><b style={{ color:'#2563eb' }}>{t}</b><div style={{ fontSize:11, color:'#94a3b8' }}>{isAr ? 'مايو 2024' : 'May 2024'}</div></div>
    ))}
  </>)
  if (path === '/contact') return shell(<>
    {H(isAr ? 'اتصل بنا' : 'Contact')}
    {P('📧 info@brightbyte.io')}{P('📞 +974 4444 1234')}{P(isAr ? '📍 الدوحة، قطر' : '📍 Doha, Qatar')}
  </>)
  if (path === '/login') return shell(<>
    {H(isAr ? 'تسجيل الدخول' : 'Login')}
    <div style={{ maxWidth:280 }}>
      <input placeholder={isAr ? 'اسم المستخدم' : 'username'} style={{ width:'100%', padding:'8px 10px', border:'1px solid #cbd5e1', borderRadius:8, marginBottom:8 }} />
      <input placeholder={isAr ? 'كلمة المرور' : 'password'} type="password" style={{ width:'100%', padding:'8px 10px', border:'1px solid #cbd5e1', borderRadius:8, marginBottom:8 }} />
      <button style={{ background:'#0e1f39', color:'white', border:'none', borderRadius:8, padding:'8px 16px', fontWeight:700, cursor:'pointer' }}>{isAr ? 'دخول' : 'Sign in'}</button>
    </div>
  </>)
  if (path === '/admin') return (
    <div style={{ textAlign:'center', paddingTop:36 }}>
      <div style={{ fontSize:40 }}>🚫</div>
      <div style={{ fontSize:26, fontWeight:900, color:'#dc2626' }}>403 Forbidden</div>
      <div style={{ color:'#64748b', marginTop:6 }}>{isAr ? 'هذه الصفحة محمية بتسجيل دخول. تحتاج كلمة المرور — وهذا عمل hydra في الدرس التالي.' : 'This page is protected by a login. You need the password — that is hydra’s job in the next lesson.'}</div>
    </div>
  )
  if (path === '/robots.txt') return <pre style={{ fontFamily:'monospace', fontSize:12.5, color:'#334155' }}>{'User-agent: *\nDisallow: /admin\nDisallow: /login'}</pre>
  if (['/images', '/css', '/js'].includes(path)) return <pre style={{ fontFamily:'monospace', fontSize:12.5, color:'#334155' }}>{`Index of ${path}/\n\n  ../\n  ${path === '/images' ? 'logo.png\n  hero.jpg\n  team.jpg' : path === '/css' ? 'style.css\n  theme.css' : 'app.js\n  vendor.js'}`}</pre>
  return null
}

export default function PageLxGobuster() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'
  const [found, setFound] = useState([])

  const gobuster = ctx => runGobuster(ctx, { found: QA.found, onFound: () => setFound(QA.found) })

  const stColor = s => s === 200 ? '#16a34a' : s === 403 ? '#ca8a04' : '#2563eb'
  const done = found.length > 0

  return (
    <div style={{ maxWidth:1180, margin:'0 auto', padding:'20px 14px', fontFamily:'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <span style={{ background:'#fff7ed', color:'#c2410c', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>🐧 {isAr ? 'مسار لينكس' : 'Linux Track'}</span>
        <button onClick={() => navigate('/linux')} style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:7, padding:'3px 10px', fontSize:12, color:'#64748b', cursor:'pointer' }}>{isAr ? '← مسار لينكس' : '← Linux Track'}</button>
      </div>
      <h1 style={{ fontSize:23, fontWeight:900, color:'#1e293b', margin:'0 0 14px' }}>📂 {isAr ? 'Gobuster — كشف المجلدات المخفية' : 'Gobuster — Directory Busting'}</h1>

      {/* command */}
      <div style={{ background:'#0b1020', borderRadius:10, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }} dir="ltr">
        <span style={{ color:'#4ade80', fontFamily:'monospace', fontSize:12, fontWeight:700 }}>$</span>
        <code style={{ flex:1, fontFamily:'monospace', fontSize:12.5, color:'#a5f3fc', minWidth:200 }}>{CMD}</code>
        <button onClick={() => navigator.clipboard && navigator.clipboard.writeText(CMD)} style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:6, color:'#94a3b8', cursor:'pointer', fontSize:11, padding:'3px 10px' }}>{isAr ? '⧉ نسخ' : '⧉ copy'}</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:16, alignItems:'start' }}>
        {/* terminal + discovered */}
        <div>
          <LinuxTerminal isAr={isAr} height={280} extraCommands={{ gobuster }}
            welcome={[{ k:'info', v: isAr ? '# الصق أمر gobuster بالأعلى وشغّله' : '# Paste the gobuster command above and run it' }]} />
          <div style={{ marginTop:10, background:'white', border:'2px solid #e2e8f0', borderRadius:12, padding:12 }}>
            <div style={{ fontSize:12, fontWeight:800, color:'#1e293b', marginBottom:8 }}>🗺️ {isAr ? 'المسارات المكتشفة' : 'Discovered paths'}</div>
            {!done ? <div style={{ fontSize:11.5, color:'#94a3b8', padding:'8px 4px' }}>{isAr ? 'شغّل gobuster لملء القائمة، ثم زُر المسارات في المتصفح ←' : 'Run gobuster to fill the list, then visit the paths in the browser →'}</div> : (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {found.map(f => (
                  <span key={f.path} style={{ display:'inline-flex', alignItems:'center', gap:5, fontFamily:'monospace', fontSize:11.5, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:7, padding:'3px 8px' }} dir="ltr">
                    <span style={{ fontSize:9, fontWeight:800, color:stColor(f.status) }}>{f.status}</span>{f.path}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* browser */}
        <div>
          <SimBrowser host={QA.host} isAr={isAr} height={430} renderPage={(p, nav) => renderQaPage(p, nav, isAr)} />
          <button onClick={() => navigate('/lx-hydra')} style={{ marginTop:10, width:'100%', background:'#0e1f39', color:'white', border:'none', borderRadius:8, padding:'8px 14px', fontSize:12, fontWeight:700, cursor:'pointer' }}>{isAr ? 'التالي: Hydra (كسر /admin) →' : 'Next: Hydra (crack /admin) →'}</button>
        </div>
      </div>

      <Explanation>
        <p style={{ fontSize:13, color:'#475569', margin:0, maxWidth:860, lineHeight:1.7 }}>
          {isAr ? `الهدف هو موقع ${QA.host}. يجرّب gobuster كل كلمة كمسار ويخبرك أيّها موجود (200)، أو تحويل (301)، أو محمي (403). ثم افتح المتصفح على اليمين وعدّل العنوان لزيارة الصفحات التي اكتشفتها.` : `The target is ${QA.host}. gobuster tries every word as a path and tells you which exist (200), redirect (301), or are protected (403). Then use the browser on the right — edit the URL to visit the pages you discovered.`}
        </p>
      </Explanation>

      <div style={{ display:'flex', justifyContent:'center', marginTop:20 }}>
        <button onClick={() => navigate('/linux')} style={{ display:'flex', alignItems:'center', gap:6, color:'#1d4ed8', background:'#eff6ff', border:'2px solid #bfdbfe', borderRadius:10, padding:'10px 28px', cursor:'pointer', fontSize:14, fontWeight:700 }}>
          <ChevronLeft size={15} />{isAr ? 'مسار لينكس' : 'Linux Track'}
        </button>
      </div>
    </div>
  )
}
