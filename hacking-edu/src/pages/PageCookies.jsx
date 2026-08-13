import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   COOKIES — how a website remembers you
   Interactive: log in → the server sends Set-Cookie; the browser stores it and
   auto-sends it on every later request, so the site "remembers" you. Shows the
   real request/response headers + the cookie jar, then explains the attributes
   (Expires, Secure, HttpOnly, SameSite) and how they tie into XSS and CSRF.
   ──────────────────────────────────────────────────────────────────────────── */

const SESSION = 'a3f8b1c9d2e47'

const ATTRS = [
  { k: 'Expires / Max-Age', ar: 'المدة', color: '#0e7490',
    dAr: 'متى تنتهي الكوكي. بدونها تكون «كوكي جلسة» تُحذف عند إغلاق المتصفح؛ ومعها تبقى أياماً أو سنين («تذكّرني»).',
    dEn: 'When the cookie expires. Without it, it is a "session cookie" deleted when you close the browser; with it, it persists for days or years ("remember me").' },
  { k: 'Secure', ar: 'آمن', color: '#15803d',
    dAr: 'تُرسَل الكوكي فقط عبر HTTPS المشفّر، فلا يستطيع أحد التقاطها على الشبكة.',
    dEn: 'The cookie is sent only over encrypted HTTPS, so nobody can capture it on the network.' },
  { k: 'HttpOnly', ar: 'حجب الجافاسكربت', color: '#7c3aed',
    dAr: 'تمنع الجافاسكربت (document.cookie) من قراءة الكوكي — دفاع أساسي ضد سرقة الجلسة عبر XSS.',
    dEn: 'Blocks JavaScript (document.cookie) from reading the cookie — a key defense against session theft via XSS.' },
  { k: 'SameSite', ar: 'نفس الموقع', color: '#b45309',
    dAr: 'تتحكّم متى تُرسَل الكوكي مع طلبات قادمة من موقع آخر. القيمة Strict/Lax تقيّد إرسالها في طلبات المواقع الأخرى — دفاع ضد CSRF.',
    dEn: 'Controls when the cookie is sent on requests coming from another site. Strict/Lax restrict it from being sent on other sites’ requests — a defense against CSRF.' },
]

export default function PageCookies() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const ar = lang === 'ar'

  const [session, setSession] = useState(null)     // the stored session cookie value
  const [req, setReq] = useState(null)             // last request headers
  const [res, setRes] = useState(null)             // last response
  const [httpOnly, setHttpOnly] = useState(true)   // for the JS-read demo

  const login = () => {
    setSession(SESSION)
    setReq({ line: 'POST /login HTTP/1.1', host: 'dukkan.shop', cookie: null })
    setRes({ status: '200 OK', setCookie: `session=${SESSION}; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`, bodyAr: '✅ أهلاً! تم تسجيل دخولك.', bodyEn: "✅ Welcome! You're logged in." })
  }
  const reload = () => {
    if (session) {
      setReq({ line: 'GET / HTTP/1.1', host: 'dukkan.shop', cookie: `session=${session}` })
      setRes({ status: '200 OK', setCookie: null, bodyAr: '👋 مرحباً بعودتك! أتذكّرك.', bodyEn: '👋 Welcome back! I remember you.' })
    } else {
      setReq({ line: 'GET / HTTP/1.1', host: 'dukkan.shop', cookie: null })
      setRes({ status: '200 OK', setCookie: null, bodyAr: '🤔 مرحباً أيها الغريب — الرجاء تسجيل الدخول.', bodyEn: '🤔 Hello stranger — please log in.' })
    }
  }
  const clear = () => {
    setSession(null)
    setReq({ line: 'GET / HTTP/1.1', host: 'dukkan.shop', cookie: null })
    setRes({ status: '200 OK', setCookie: null, bodyAr: '🧹 مُسحت الكوكيز. الموقع لم يعد يعرفك.', bodyEn: "🧹 Cookies cleared. The site no longer knows you." })
  }

  // what JavaScript on the page can read via document.cookie
  const jsSees = session ? (httpOnly ? 'theme=dark' : `theme=dark; session=${session}`) : 'theme=dark'

  const box = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12 }
  const hdr = { fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7 }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '20px 14px', fontFamily: 'sans-serif' }} dir={ar ? 'rtl' : 'ltr'}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ background: '#fef3c7', color: '#92610a', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🍪 {ar ? 'أساسيات الويب' : 'Web Basics'}</span>
        <button onClick={() => navigate('/')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '3px 10px', fontSize: 12, color: '#64748b', cursor: 'pointer' }}>{ar ? '← الرئيسية' : '← Home'}</button>
      </div>
      <h1 style={{ fontSize: 23, fontWeight: 900, color: '#1e293b', margin: '0 0 14px' }}>🍪 {ar ? 'ما هي الكوكيز (Cookies)؟' : 'What Are Cookies?'}</h1>

      {/* interactive: browser + network + jar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* browser */}
        <div style={{ ...box, overflow: 'hidden' }}>
          <div style={{ background: '#e2e8f0', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8 }} dir="ltr">
            <span style={{ display: 'flex', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444' }} /><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }} /><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e' }} /></span>
            <div style={{ flex: 1, background: 'white', borderRadius: 20, padding: '4px 12px', fontFamily: 'monospace', fontSize: 11.5, color: '#334155', border: '1px solid #cbd5e1' }}>🔒 https://dukkan.shop</div>
          </div>
          <div style={{ padding: '20px 16px', minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0e1f39', minHeight: 22 }}>{res ? (ar ? res.bodyAr : res.bodyEn) : (ar ? '👋 مرحباً! هذا متجر دُكان.' : '👋 Welcome to Dukkan shop.')}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{session ? (ar ? `جلستك: ${session.slice(0, 8)}…` : `your session: ${session.slice(0, 8)}…`) : (ar ? 'لا توجد جلسة' : 'no session')}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '0 12px 12px', flexWrap: 'wrap' }}>
            <button onClick={login} style={{ flex: 1, minWidth: 90, background: '#0e1f39', color: 'white', border: 'none', borderRadius: 8, padding: '8px', fontWeight: 700, cursor: 'pointer', fontSize: 12.5 }}>🔓 {ar ? 'تسجيل الدخول' : 'Log in'}</button>
            <button onClick={reload} style={{ flex: 1, minWidth: 90, background: '#0e7490', color: 'white', border: 'none', borderRadius: 8, padding: '8px', fontWeight: 700, cursor: 'pointer', fontSize: 12.5 }}>🔄 {ar ? 'إعادة تحميل' : 'Reload'}</button>
            <button onClick={clear} style={{ flex: 1, minWidth: 90, background: '#94a3b8', color: 'white', border: 'none', borderRadius: 8, padding: '8px', fontWeight: 700, cursor: 'pointer', fontSize: 12.5 }}>🗑️ {ar ? 'مسح الكوكيز' : 'Clear'}</button>
          </div>
        </div>

        {/* network + jar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#0b1020', borderRadius: 12, padding: 12 }} dir="ltr">
            <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: 1, marginBottom: 6 }}>🌐 {ar ? 'الشبكة' : 'NETWORK'}</div>
            {req ? (
              <>
                <div style={{ ...hdr, color: '#7dd3fc' }}>▲ {req.line}</div>
                <div style={{ ...hdr, color: '#64748b' }}>Host: {req.host}</div>
                <div style={{ ...hdr, color: req.cookie ? '#4ade80' : '#475569' }}>Cookie: {req.cookie || '(none)'}</div>
                <div style={{ height: 8 }} />
                <div style={{ ...hdr, color: '#fca5a5' }}>▼ HTTP/1.1 {res.status}</div>
                {res.setCookie && <div style={{ ...hdr, color: '#fbbf24', wordBreak: 'break-all' }}>Set-Cookie: {res.setCookie}</div>}
              </>
            ) : <div style={{ ...hdr, color: '#475569' }}>{ar ? '(اضغط زراً لترى الطلب والرد)' : '(press a button to see the request & response)'}</div>}
          </div>
          <div style={{ ...box, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#92610a', marginBottom: 6 }}>🍪 {ar ? 'جرة الكوكيز (المخزّنة في متصفحك)' : 'Cookie jar (stored in your browser)'}</div>
            {session ? (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '7px 10px', fontFamily: 'monospace', fontSize: 11.5, color: '#92610a', wordBreak: 'break-all' }} dir="ltr">
                session = {session}<br /><span style={{ color: '#b45309' }}>HttpOnly · Secure · SameSite=Lax · Max-Age=7d</span>
              </div>
            ) : <div style={{ fontSize: 12, color: '#94a3b8' }}>{ar ? 'فارغة — لا كوكيز محفوظة.' : 'Empty — no cookies stored.'}</div>}
          </div>
        </div>
      </div>

      {/* JS read demo (HttpOnly ↔ XSS) */}
      <div style={{ marginTop: 16, ...box, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#7c3aed' }}>🔐 {ar ? 'HttpOnly ضد سرقة الكوكيز (يرتبط بدرس XSS)' : 'HttpOnly vs cookie theft (ties into the XSS lesson)'}</div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={httpOnly} onChange={e => setHttpOnly(e.target.checked)} /> {ar ? 'كوكي الجلسة HttpOnly' : 'session cookie is HttpOnly'}
          </label>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px', lineHeight: 1.6 }}>
          {ar ? 'لو نجح مهاجم في حقن جافاسكربت (XSS)، سيحاول قراءة كوكيز جلستك عبر document.cookie. شاهد ما يستطيع رؤيته:' : "If an attacker injects JavaScript (XSS), they'll try to read your session cookie via document.cookie. See what they can read:"}
        </p>
        <div style={{ background: '#0b1020', borderRadius: 8, padding: '9px 12px', fontFamily: 'monospace', fontSize: 12.5 }} dir="ltr">
          <span style={{ color: '#7dd3fc' }}>&gt; document.cookie</span><br />
          <span style={{ color: httpOnly ? '#4ade80' : '#f87171' }}>"{jsSees}"</span>
          {session && (httpOnly
            ? <div style={{ color: '#4ade80', fontSize: 11, marginTop: 4 }} dir={ar ? 'rtl' : 'ltr'}>✓ {ar ? 'كوكي الجلسة محميّة — الجافاسكربت لا يراها.' : 'The session cookie is protected — JavaScript cannot see it.'}</div>
            : <div style={{ color: '#f87171', fontSize: 11, marginTop: 4 }} dir={ar ? 'rtl' : 'ltr'}>⚠ {ar ? 'كوكي الجلسة مكشوفة! يستطيع المهاجم سرقتها وانتحال جلستك.' : 'The session cookie is exposed! An attacker could steal it and hijack your session.'}</div>)}
        </div>
      </div>

      {/* explanation — collapsed by default, sits under the practical part */}
      <Explanation>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px', maxWidth: 840, lineHeight: 1.7 }}>
          {ar
            ? 'الـ HTTP «بلا ذاكرة» — الخادم ينسى من أنت بعد كل طلب. الكوكي حلٌّ بسيط: قطعة نص صغيرة يمنحها الخادم لمتصفحك (Set-Cookie)، ويعيدها المتصفح تلقائياً مع كل طلب تالٍ (Cookie)، فيعرف الخادم أنك أنت. جرّب بنفسك.'
            : "HTTP is “stateless” — the server forgets who you are after every request. A cookie is the simple fix: a small piece of text the server gives your browser (Set-Cookie), which the browser automatically sends back on every later request (Cookie), so the server knows it's you. Try it."}
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0e1f39', margin: '4px 0 8px' }}>🏷️ {ar ? 'ماذا يوجد داخل الكوكي؟' : "What's inside a cookie?"}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10 }}>
          {ATTRS.map(a => (
            <div key={a.k} style={{ ...box, padding: '11px 13px', borderTop: `3px solid ${a.color}` }}>
              <code style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 800, color: a.color }} dir="ltr">{a.k}</code>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{ar ? a.ar : ''}</div>
              <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.6 }}>{ar ? a.dAr : a.dEn}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#1e40af', marginBottom: 6 }}>🎯 {ar ? 'الخلاصة' : 'Key takeaways'}</div>
          <ul style={{ margin: 0, paddingInlineStart: 20, color: '#1e3a8a', fontSize: 12.5, lineHeight: 1.9 }}>
            <li>{ar ? 'الكوكي يجعل الموقع «يتذكّرك»: يرسلها الخادم مرة، ويعيدها متصفحك تلقائياً مع كل طلب.' : 'A cookie makes a site “remember” you: the server sends it once, and your browser auto-returns it on every request.' }</li>
            <li>{ar ? 'كوكي الجلسة هي مفتاح دخولك — من يسرقها يدخل كأنه أنت (بدون كلمة مرور).' : 'A session cookie is your entry key — whoever steals it logs in as you (no password needed).'}</li>
            <li>{ar ? 'HttpOnly تحمي من سرقة الكوكي عبر XSS، و Secure تحميها على الشبكة، و SameSite تحمي من CSRF.' : 'HttpOnly protects against XSS theft, Secure protects it on the network, and SameSite protects against CSRF.'}</li>
            <li>{ar ? 'كوكيز الطرف الثالث تُستخدم لتتبّعك عبر المواقع — لهذا تحذفها متصفحات الخصوصية.' : 'Third-party cookies are used to track you across sites — which is why privacy browsers block them.'}</li>
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
