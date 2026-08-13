import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   XSS — STORED / PERSISTENT CROSS-SITE SCRIPTING (real execution)
   Three-step flow the student drives:
     1) Post a comment  → it is SAVED on the "server" (a visible store).
     2) A visitor opens the page → the page LOADS all comments from the server.
     3) If a stored comment is a script, it RUNS in that visitor's browser —
        every single time anyone opens the page.
   Vulnerable mode renders stored comments as raw HTML and executes any stored
   <script>; Secure mode escapes them to harmless text (the real-world fix).
   Fully contained to this page and the student's own browser — safe.
   ──────────────────────────────────────────────────────────────────────────── */

const SEED = () => ([
  { author: 'سارة / Sara', text: 'درس رائع اليوم! 🎉' },
  { author: 'عمر / Omar',  text: 'شكراً على الشرح 👍' },
])

const PAYLOADS = [
  { kind: 'html',   ar: 'حقن HTML — تشويه الصفحة',       en: 'HTML injection — deface',        value: '<b style="color:#dc2626;font-weight:900;font-size:17px">💀 HACKED</b>' },
  { kind: 'script', ar: 'سكربت — نافذة منبثقة',           en: 'Script — pop-up',                value: `<script>alert('Stored XSS! هذا الكود محفوظ على الخادم ويعمل لكل زائر')</script>` },
  { kind: 'cookie', ar: 'سكربت — سرقة الكوكيز 🍪',        en: 'Script — steal the cookie 🍪',   value: `<script>window.__xssLoot(document.cookie)</script>` },
]

// run any <script>…</script> found in the stored comments (innerHTML never runs
// script tags, so we execute their contents to faithfully simulate a server that
// echoes stored HTML into the page).
const runStoredScripts = (comments) => {
  comments.forEach(c => {
    const re = /<script[^>]*>([\s\S]*?)<\/script>/gi
    let m
    while ((m = re.exec(c.text))) { try { new Function(m[1])() } catch (e) {} }
  })
}

export default function PageXSS() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [mode, setMode]       = useState('vuln')     // 'vuln' | 'safe'
  const [server, setServer]   = useState(SEED)       // the server-side store
  const [input, setInput]     = useState('')
  const [rendered, setRendered] = useState([])       // what the current visitor's page loaded
  const [visit, setVisit]     = useState(0)          // how many visitors have opened the page
  const [loot, setLoot]       = useState(null)

  const [postedNormal, setPostedNormal] = useState(false)
  const [storedScript, setStoredScript] = useState(false)
  const [ranForVisitor, setRan]         = useState(false)
  const [defended, setDefended]         = useState(false)

  // demo session cookie (so the cookie-theft payload has a target) + exfil bridge
  useEffect(() => {
    try { if (!document.cookie.includes('sessionId=')) document.cookie = 'sessionId=SxR7-93Kd-QATAR-2026; path=/' } catch (e) {}
    window.__xssLoot = (c) => setLoot(c || '(no cookies)')
    return () => { try { delete window.__xssLoot } catch (e) { window.__xssLoot = undefined } }
  }, [])

  const post = () => {
    const text = input.trim()
    if (!text) return
    setServer(s => [...s, { author: isAr ? 'أنت / You' : 'You', text }])
    if (/<[a-z]/i.test(text)) setStoredScript(true); else setPostedNormal(true)
    setInput('')
  }

  // a new visitor opens the page → load all comments from the server and render
  const openPage = () => {
    const snapshot = server.map(c => ({ ...c }))
    setLoot(null)
    setRendered(snapshot)
    setVisit(v => v + 1)
    const hasCode = server.some(c => /<[a-z]/i.test(c.text))
    if (mode === 'vuln') {
      if (hasCode) setRan(true)
      setTimeout(() => runStoredScripts(snapshot), 30)   // scripts run after the DOM paints
    } else if (hasCode) {
      setDefended(true)
    }
  }

  const switchMode = (m) => { setMode(m); setRendered([]); setLoot(null) }
  const clearServer = () => { setServer(SEED()); setRendered([]); setVisit(0); setLoot(null) }

  const steps = [
    { ok: postedNormal || storedScript, ar: 'اكتب تعليقاً — يُحفظ على الخادم', en: 'Write a comment — it is saved on the server', ic: '✍️' },
    { ok: storedScript, ar: 'احفظ تعليقاً يحتوي على كود (سكربت)', en: 'Save a comment containing code (a script)', ic: '💾' },
    { ok: ranForVisitor, ar: 'افتح الصفحة كزائر — الكود المحفوظ يُنفَّذ تلقائياً', en: 'Open the page as a visitor — the stored code runs automatically', ic: '🌐' },
  ]

  const box = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12 }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 14px', fontFamily: 'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ background: '#faf5ff', color: '#7c3aed', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🐞 {isAr ? 'أمن التطبيقات' : 'App Security'}</span>
        <button onClick={() => navigate('/')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '3px 10px', fontSize: 12, color: '#64748b', cursor: 'pointer' }}>{isAr ? '← الرئيسية' : '← Home'}</button>
      </div>
      <h1 style={{ fontSize: 23, fontWeight: 900, color: '#1e293b', margin: '0 0 12px' }}>🐞 {isAr ? 'حقن السكربتات المُخزّن — Stored XSS' : 'Stored Cross-Site Scripting (XSS)'}</h1>

      {/* objectives */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, background: s.ok ? '#f0fdf4' : 'white', border: `2px solid ${s.ok ? '#86efac' : '#e2e8f0'}`, borderRadius: 10, padding: '8px 11px' }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: s.ok ? '#22c55e' : '#f1f5f9', color: s.ok ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{s.ok ? '✓' : s.ic}</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: s.ok ? '#15803d' : '#475569' }}>{i + 1}. {isAr ? s.ar : s.en}</span>
          </div>
        ))}
      </div>

      {/* mode toggle */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{isAr ? 'حالة الموقع:' : 'Site mode:'}</span>
        <button onClick={() => switchMode('vuln')} style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 7, border: '1px solid', cursor: 'pointer', background: mode === 'vuln' ? '#dc2626' : 'white', color: mode === 'vuln' ? 'white' : '#64748b', borderColor: mode === 'vuln' ? '#dc2626' : '#e2e8f0' }}>🔓 {isAr ? 'مصاب' : 'Vulnerable'}</button>
        <button onClick={() => switchMode('safe')} style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 7, border: '1px solid', cursor: 'pointer', background: mode === 'safe' ? '#16a34a' : 'white', color: mode === 'safe' ? 'white' : '#64748b', borderColor: mode === 'safe' ? '#16a34a' : '#e2e8f0' }}>🔒 {isAr ? 'محمي (يُنظّف عند العرض)' : 'Secure (escapes on display)'}</button>
      </div>

      {/* STEP 1 — write a comment (saved to server) */}
      <div style={{ ...box, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#0e1f39', marginBottom: 2 }}>① {isAr ? 'اكتب تعليقاً (كأنك مهاجم)' : 'Write a comment (as an attacker)'}</div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 10 }}>{isAr ? 'هذا لا يُنفِّذ شيئاً الآن — فقط يحفظ التعليق على الخادم.' : 'This does not run anything now — it only saves the comment on the server.'}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') post() }} placeholder={isAr ? 'اكتب تعليقاً…' : 'write a comment…'} style={{ flex: 1, minWidth: 220, border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 11px', fontSize: 13, fontFamily: 'monospace' }} dir="ltr" />
          <button onClick={post} style={{ background: '#0e1f39', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>💾 {isAr ? 'احفظ على الخادم' : 'Save to server'}</button>
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>🧪 {isAr ? 'حمولات جاهزة (اضغط لملء الحقل ثم احفظ):' : 'Ready payloads (click to fill, then Save):'}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PAYLOADS.map(p => (
              <button key={p.kind} onClick={() => setInput(p.value)} style={{ fontFamily: 'monospace', fontSize: 12, background: '#faf5ff', border: '2px solid #d8b4fe', color: '#6d28d9', borderRadius: 8, padding: '6px 11px', cursor: 'pointer', fontWeight: 700 }}>
                {isAr ? p.ar : p.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* THE SERVER — stored comments */}
      <div style={{ background: '#0b1020', borderRadius: 12, padding: 14, marginBottom: 12 }} dir="ltr">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: 1 }}>🗄️ {isAr ? 'الخادم — التعليقات المحفوظة' : 'SERVER — STORED COMMENTS'} ({server.length})</span>
          <button onClick={clearServer} style={{ fontSize: 11, background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 6, padding: '3px 9px', cursor: 'pointer' }}>{isAr ? 'مسح' : 'Clear'}</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {server.map((c, i) => {
            const isCode = /<[a-z]/i.test(c.text)
            return (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, fontFamily: 'monospace', background: isCode ? 'rgba(239,68,68,0.12)' : 'transparent', borderRadius: 4, padding: '2px 6px' }}>
                <span style={{ color: '#64748b', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ color: '#7dd3fc', flexShrink: 0 }}>{c.author.split(' / ')[isAr ? 0 : 1] || c.author}:</span>
                <span style={{ color: isCode ? '#fca5a5' : '#e2e8f0', wordBreak: 'break-word' }}>{c.text}</span>
                {isCode && <span style={{ color: '#f87171', flexShrink: 0, fontWeight: 700 }}>⚠</span>}
              </div>
            )
          })}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }} dir={isAr ? 'rtl' : 'ltr'}>
          {isAr ? '💡 التعليق المحفوظ يبقى على الخادم ويُحمَّل لكل زائر. السطور الحمراء تحتوي كوداً.' : '💡 A saved comment stays on the server and loads for every visitor. Red lines contain code.'}
        </div>
      </div>

      {/* STEP 2 — a visitor opens the page (loads from server → executes) */}
      <div style={{ border: '2px solid #cbd5e1', borderRadius: 12, overflow: 'hidden', ...box }}>
        <div style={{ background: '#e2e8f0', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8 }} dir="ltr">
          <span style={{ display: 'flex', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444' }} /><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }} /><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e' }} /></span>
          <div style={{ flex: 1, background: 'white', borderRadius: 20, padding: '4px 12px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: 11.5, color: '#334155' }}>🌐 http://student-forum.qa/guestbook</div>
        </div>

        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#0e1f39' }}>② {isAr ? 'صفحة التعليقات (كما يراها الزائر)' : 'The comments page (what a visitor sees)'}</div>
            <button onClick={openPage} style={{ background: '#8dc63f', color: '#0e1f39', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 800, cursor: 'pointer', fontSize: 12.5 }}>🌐 {isAr ? 'افتح الصفحة (زائر جديد)' : 'Open the page (new visitor)'}</button>
          </div>

          {visit > 0 && (
            <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 8, background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 8, padding: '6px 10px' }}>
              👥 {isAr ? `الزائر رقم ${visit} — حمّلت الصفحة ${server.length} تعليقاً من الخادم.` : `Visitor #${visit} — the page loaded ${rendered.length} comments from the server.`}
              {mode === 'vuln' && ranForVisitor && <span style={{ color: '#b91c1c', fontWeight: 700 }}> {isAr ? 'ونُفِّذ الكود المحفوظ!' : 'And the stored code executed!'}</span>}
            </div>
          )}

          {rendered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '26px 10px', fontSize: 13, background: '#f8fafc', borderRadius: 10, border: '1px dashed #cbd5e1' }}>
              {isAr ? 'لم يفتح أحد الصفحة بعد. اضغط «افتح الصفحة» لمحاكاة زائر يدخل ويحمّل التعليقات.' : "Nobody has opened the page yet. Click “Open the page” to simulate a visitor loading the comments."}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rendered.map((c, i) => (
                <div key={visit + '-' + i} style={{ background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 10, padding: '8px 11px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 3 }}>{c.author}</div>
                  {mode === 'vuln'
                    ? <div style={{ fontSize: 13.5, color: '#334155', wordBreak: 'break-word' }} dangerouslySetInnerHTML={{ __html: c.text }} />
                    : <div style={{ fontSize: 13.5, color: '#334155', wordBreak: 'break-word', fontFamily: /<[a-z]/i.test(c.text) ? 'monospace' : 'inherit' }}>{c.text}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* attacker capture panel */}
      {loot && (
        <div style={{ marginTop: 14, background: '#0b1020', border: '2px solid #7f1d1d', borderRadius: 12, padding: 14 }} dir="ltr">
          <div style={{ fontSize: 11, fontWeight: 800, color: '#f87171', letterSpacing: 1, marginBottom: 6 }}>🕵️ {isAr ? 'خادم المهاجم — سُرقت كوكيز الزائر!' : "ATTACKER'S SERVER — VISITOR'S COOKIE STOLEN!"}</div>
          <code style={{ fontFamily: 'monospace', fontSize: 13, color: '#4ade80', display: 'block', wordBreak: 'break-word' }}>{loot}</code>
          <div style={{ fontSize: 11.5, color: '#fca5a5', marginTop: 6 }} dir={isAr ? 'rtl' : 'ltr'}>
            {isAr ? 'الكود المحفوظ سرق كوكيز هذا الزائر لحظة فتحه الصفحة — وسيتكرر مع كل زائر جديد.' : "The stored code stole this visitor's cookie the moment they opened the page — and it repeats for every new visitor."}
          </div>
        </div>
      )}

      {/* explanation — collapsed by default, sits under the practical part */}
      <Explanation>
        <p style={{ fontSize: 13, color: '#475569', margin: '0 0 12px', lineHeight: 1.7 }}>
          {isAr
            ? 'في منتدى التعليقات، يُحفَظ كل تعليق على الخادم. وعندما يفتح أي زائر الصفحة، تُحمّل كل التعليقات المحفوظة وتُعرض له. المشكلة: إذا حفظ المهاجم «تعليقاً» هو في الحقيقة كود (سكربت)، فسيُنفَّذ في متصفّح كل زائر يفتح الصفحة — دون أن يفعل الزائر شيئاً.'
            : "In a comments forum, every comment is saved on the server. When any visitor opens the page, all saved comments load and are shown to them. The catch: if an attacker saves a “comment” that is really code (a script), it runs in every visitor's browser when they open the page — without the visitor doing anything."}
        </p>
        <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#b91c1c', marginBottom: 6 }}>🛑 {isAr ? 'الثغرة والحل' : 'The Vulnerability & The Fix'}</div>
          <ul style={{ margin: 0, paddingInlineStart: 20, color: '#991b1b', fontSize: 12.5, lineHeight: 1.9 }}>
            <li>{isAr ? 'هذا هو XSS «المُخزَّن»: الكود يُحفَظ مرة واحدة على الخادم، ثم يُنفَّذ في متصفح كل زائر يفتح الصفحة — وهو الأخطر لأنه يصيب الجميع.' : "This is “stored” XSS: the code is saved once on the server, then runs in the browser of every visitor who opens the page — the most dangerous kind because it hits everyone."}</li>
            <li>{isAr ? 'الحل: «تهريب/تنظيف» التعليق عند عرضه (Escape/Encode) — جرّب الوضع المحمي 🔒 ثم افتح الصفحة: نفس التعليق يظهر كنص عادي ولا يُنفَّذ.' : 'Fix: escape/encode the comment when displaying it — try Secure mode 🔒 then open the page: the same comment shows as plain text and does not run.'}</li>
            <li>{isAr ? 'دفاع إضافي: نظّف المدخلات عند الحفظ أيضاً، واستخدم سياسة أمان المحتوى (CSP) وكوكيز HttpOnly لمنع سرقة الجلسة.' : 'Extra defense: sanitize on save too, and use a Content-Security-Policy and HttpOnly cookies to stop session theft.'}</li>
            {defended && <li style={{ color: '#15803d', fontWeight: 700 }}>{isAr ? '✓ أحسنت — في الوضع المحمي، الكود المحفوظ ظهر كنص ولم يُنفَّذ.' : '✓ Nice — in Secure mode the stored code appeared as text and did not run.'}</li>}
          </ul>
        </div>
      </Explanation>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1d4ed8', background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 10, padding: '10px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          <ChevronLeft size={15} />{isAr ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
