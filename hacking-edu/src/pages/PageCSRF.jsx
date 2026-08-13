import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   CSRF — Cross-Site Request Forgery
   You log into your bank (session cookie). Then you visit a malicious page that
   secretly fires a "transfer money" request to the bank. The browser auto-attaches
   your bank cookie, so the bank thinks it's you — and the money moves. Turn on the
   defense (SameSite cookie + CSRF token) and the same attack fails.
   Builds on the Cookies lesson. Safe simulation.
   ──────────────────────────────────────────────────────────────────────────── */

const START_BALANCE = 1000
const STOLEN = 500

export default function PageCSRF() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const ar = lang === 'ar'

  const [loggedIn, setLoggedIn] = useState(false)
  const [balance, setBalance]   = useState(START_BALANCE)
  const [defense, setDefense]   = useState(false)   // SameSite + CSRF token
  const [site, setSite]         = useState('bank')  // 'bank' | 'evil'
  const [log, setLog]           = useState(null)    // outcome of the forged request

  const login = () => { setLoggedIn(true); setBalance(START_BALANCE); setLog(null) }
  const reset = () => { setLoggedIn(false); setBalance(START_BALANCE); setLog(null); setSite('bank'); setDefense(false) }

  // visiting the malicious site auto-fires the forged transfer
  const visitEvil = () => {
    setSite('evil')
    // the forged cross-site request the attacker's page makes
    if (!loggedIn) {
      setLog({ ok: true, cookie: false, blocked: 'noauth' })
      return
    }
    if (defense) {
      setLog({ ok: false, cookie: false, blocked: 'defense' })    // no cookie sent + missing CSRF token
      return
    }
    // vulnerable: cookie rides along, bank accepts → money moves
    setBalance(b => Math.max(0, b - STOLEN))
    setLog({ ok: false, cookie: true, blocked: null })
  }

  const attacked = log && log.cookie && !log.blocked

  const steps = [
    { ok: loggedIn, ar: 'سجّل الدخول إلى البنك (تحصل على كوكي جلسة)', en: 'Log into the bank (you get a session cookie)', ic: '🏦' },
    { ok: attacked, ar: 'زُر الموقع الخبيث — يُسرق منك المال دون أن تضغط شيئاً', en: 'Visit the malicious site — money is stolen without you clicking anything', ic: '💀' },
    { ok: defense && log && log.blocked === 'defense', ar: 'فعّل الحماية وأعد المحاولة — يفشل الهجوم', en: 'Turn on protection and retry — the attack fails', ic: '🛡️' },
  ]

  const box = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12 }
  const mono = { fontFamily: 'monospace', fontSize: 12, lineHeight: 1.65 }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '20px 14px', fontFamily: 'sans-serif' }} dir={ar ? 'rtl' : 'ltr'}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ background: '#faf5ff', color: '#7c3aed', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🎯 {ar ? 'أمن التطبيقات' : 'App Security'}</span>
        <button onClick={() => navigate('/')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '3px 10px', fontSize: 12, color: '#64748b', cursor: 'pointer' }}>{ar ? '← الرئيسية' : '← Home'}</button>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', margin: '0 0 14px' }}>🎯 {ar ? 'تزوير الطلب عبر المواقع — CSRF' : 'Cross-Site Request Forgery — CSRF'}</h1>

      {/* objectives */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, minWidth: 210, display: 'flex', alignItems: 'center', gap: 8, background: s.ok ? '#f0fdf4' : 'white', border: `2px solid ${s.ok ? '#86efac' : '#e2e8f0'}`, borderRadius: 10, padding: '8px 11px' }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: s.ok ? '#22c55e' : '#f1f5f9', color: s.ok ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{s.ok ? '✓' : s.ic}</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: s.ok ? '#15803d' : '#475569' }}>{i + 1}. {ar ? s.ar : s.en}</span>
          </div>
        ))}
      </div>

      {/* defense toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap', background: defense ? '#f0fdf4' : '#fef2f2', border: `2px solid ${defense ? '#86efac' : '#fecaca'}`, borderRadius: 10, padding: '9px 13px' }}>
        <label style={{ fontSize: 13, fontWeight: 800, color: defense ? '#15803d' : '#b91c1c', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={defense} onChange={e => { setDefense(e.target.checked); setLog(null); setBalance(START_BALANCE) }} />
          {ar ? 'حماية CSRF في البنك (SameSite=Strict + رمز CSRF)' : "Bank's CSRF protection (SameSite=Strict + CSRF token)"}
        </label>
        <span style={{ fontSize: 11.5, color: defense ? '#15803d' : '#b91c1c' }}>{defense ? (ar ? 'مُفعّلة' : 'ON') : (ar ? 'مُعطّلة — البنك ضعيف' : 'OFF — bank is vulnerable')}</span>
      </div>

      {/* two windows: bank + evil */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* bank */}
        <div style={{ ...box, overflow: 'hidden', outline: site === 'bank' ? '2px solid #0e7490' : 'none' }}>
          <div style={{ background: '#0e1f39', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8 }} dir="ltr">
            <span style={{ color: '#8dc63f' }}>🔒</span>
            <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 11.5, color: '#cbd5e1' }}>https://safe-bank.qa</div>
            <button onClick={() => setSite('bank')} style={{ fontSize: 10, background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: 5, padding: '2px 7px', cursor: 'pointer' }}>{ar ? 'تبويب البنك' : 'bank tab'}</button>
          </div>
          <div style={{ padding: '16px', textAlign: 'center', minHeight: 150 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0e1f39' }}>🏦 {ar ? 'بنك الأمان' : 'SafeBank'}</div>
            {loggedIn ? (
              <>
                <div style={{ fontSize: 11.5, color: '#15803d', marginTop: 4 }}>✓ {ar ? 'مسجّل الدخول' : 'Logged in'} — session=9f2c…</div>
                <div style={{ marginTop: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px' }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{ar ? 'رصيدك' : 'Your balance'}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: balance < START_BALANCE ? '#dc2626' : '#0e1f39' }}>{balance} <span style={{ fontSize: 13 }}>QAR</span></div>
                  {balance < START_BALANCE && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>▼ {START_BALANCE - balance} {ar ? 'حُوّلت للمهاجم!' : 'transferred to attacker!'}</div>}
                </div>
              </>
            ) : (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 10 }}>{ar ? 'لست مسجّل الدخول.' : 'You are not logged in.'}</div>
                <button onClick={login} style={{ background: '#0e1f39', color: 'white', border: 'none', borderRadius: 8, padding: '9px 22px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>🔓 {ar ? 'تسجيل الدخول' : 'Log in'}</button>
              </div>
            )}
          </div>
        </div>

        {/* evil site */}
        <div style={{ ...box, overflow: 'hidden', outline: site === 'evil' ? '2px solid #dc2626' : 'none' }}>
          <div style={{ background: '#7f1d1d', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8 }} dir="ltr">
            <span>😈</span>
            <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 11.5, color: '#fecaca' }}>http://free-prizes.win</div>
          </div>
          <div style={{ padding: '16px', textAlign: 'center', minHeight: 150 }}>
            <div style={{ fontSize: 26 }}>🎁</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0e1f39' }}>{ar ? 'ربحت آيفون مجاناً!' : 'You won a free iPhone!'}</div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', margin: '4px 0 12px' }}>{ar ? 'اضغط لتستلم جائزتك 🎉' : 'Click to claim your prize 🎉'}</div>
            <button onClick={visitEvil} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, padding: '9px 22px', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>🎁 {ar ? 'استلم جائزتك' : 'Claim prize'}</button>
            {/* the hidden attack */}
            <div style={{ marginTop: 12, background: '#0b1020', borderRadius: 8, padding: '8px 10px', textAlign: 'left' }} dir="ltr">
              <div style={{ fontSize: 9.5, color: '#f87171', fontWeight: 700, letterSpacing: 0.5, marginBottom: 3 }}>{ar ? 'مخفي في الصفحة:' : 'HIDDEN IN THE PAGE:'}</div>
              <code style={{ ...mono, color: '#fca5a5', fontSize: 10.5, wordBreak: 'break-all' }}>{'<img src="https://safe-bank.qa/transfer?to=hacker&amount=500">'}</code>
            </div>
          </div>
        </div>
      </div>

      {/* outcome of the forged request */}
      {log && (
        <div style={{ marginTop: 12, background: '#0b1020', borderRadius: 12, padding: 14 }} dir="ltr">
          <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: 1, marginBottom: 6 }}>{ar ? 'الطلب المزوّر الذي أرسله متصفحك إلى البنك:' : 'THE FORGED REQUEST YOUR BROWSER SENT TO THE BANK:'}</div>
          <div style={{ ...mono, color: '#7dd3fc' }}>GET https://safe-bank.qa/transfer?to=hacker&amount=500</div>
          <div style={{ ...mono, color: log.cookie ? '#4ade80' : '#475569' }}>Cookie: {log.cookie
            ? `session=9f2c… ${ar ? '(أُرفقت تلقائياً!)' : '(attached automatically!)'}`
            : (defense && loggedIn
                ? `session=… ✗ ${ar ? 'لم تُرسَل (منعها SameSite=Strict)' : 'NOT sent (SameSite=Strict blocked it)'}`
                : (ar ? '(لا شيء — لست مسجّل الدخول)' : '(none — you were not logged in)'))}</div>
          {defense && loggedIn && <div style={{ ...mono, color: '#f87171' }}>X-CSRF-Token: {ar ? '(مفقود — لا يستطيع المهاجم تخمينه)' : "(missing — attacker can't guess it)"}</div>}
          <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: attacked ? '#450a0a' : '#052e16', border: `1px solid ${attacked ? '#7f1d1d' : '#14532d'}` }} dir={ar ? 'rtl' : 'ltr'}>
            {attacked
              ? <span style={{ color: '#fca5a5', fontSize: 12.5, fontWeight: 700 }}>💀 {ar ? 'نجح الهجوم! أرفق المتصفح كوكيك تلقائياً، فظنّ البنك أن الطلب منك ونفّذ التحويل — وأنت لم تضغط «تحويل» أبداً.' : "Attack succeeded! The browser auto-attached your cookie, so the bank thought the request was from you and made the transfer — you never clicked “transfer”."}</span>
              : log.blocked === 'defense'
                ? <span style={{ color: '#86efac', fontSize: 12.5, fontWeight: 700 }}>🛡️ {ar ? 'فشل الهجوم! لم يُرسل المتصفح الكوكي في طلب من موقع آخر (SameSite)، ولا يملك المهاجم رمز CSRF — فرفض البنك الطلب.' : "Attack blocked! The browser didn't send the cookie on a cross-site request (SameSite), and the attacker has no CSRF token — so the bank rejected it."}</span>
                : <span style={{ color: '#94a3b8', fontSize: 12.5 }}>{ar ? 'لا كوكي مرفقة (لست مسجّل الدخول) — لا شيء يحدث. سجّل الدخول أولاً لترى الهجوم.' : 'No cookie attached (you are not logged in) — nothing happens. Log in first to see the attack.'}</span>}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <button onClick={reset} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 18px', fontSize: 12.5, color: '#475569', cursor: 'pointer', fontWeight: 700 }}>↺ {ar ? 'إعادة ضبط' : 'Reset'}</button>
      </div>

      {/* explanation — collapsed by default, sits under the practical part */}
      <Explanation>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px', maxWidth: 840, lineHeight: 1.7 }}>
          {ar
            ? 'تذكّر من درس الكوكيز: متصفحك يُرفق كوكي البنك تلقائياً مع أي طلب يذهب إلى البنك — حتى لو كان الطلب صادراً من موقع آخر! في هجوم CSRF، يخدعك موقع خبيث لتُرسِل — دون علمك — طلباً «حوّل المال» إلى بنكك، فيقبله البنك لأن كوكيك مرفقة. جرّب السيناريو.'
            : "Remember from the Cookies lesson: your browser auto-attaches your bank cookie to any request going to the bank — even one triggered by another site! In a CSRF attack, a malicious site tricks you into silently sending a “transfer money” request to your bank, which accepts it because your cookie rode along. Try the scenario."}
        </p>
        <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#b91c1c', marginBottom: 6 }}>🛑 {ar ? 'الثغرة والحل' : 'The Vulnerability & The Fix'}</div>
          <ul style={{ margin: 0, paddingInlineStart: 20, color: '#991b1b', fontSize: 12.5, lineHeight: 1.9 }}>
            <li>{ar ? 'السبب: المتصفح يُرفق كوكي الموقع تلقائياً مع كل طلب إليه، حتى الطلبات التي يبدأها موقع آخر.' : 'Cause: the browser auto-attaches a site’s cookie to every request to it — even requests started by another site.'}</li>
            <li>{ar ? 'الحل ١ — رمز CSRF: رمز سرّي عشوائي داخل كل نموذج، لا يعرفه الموقع الخبيث، ويتحقق منه الخادم.' : 'Fix 1 — CSRF token: a secret random token inside every form that the malicious site can’t know, checked by the server.'}</li>
            <li>{ar ? 'الحل ٢ — كوكي SameSite=Strict/Lax: يمنع المتصفح من إرسال الكوكي في الطلبات القادمة من مواقع أخرى.' : 'Fix 2 — SameSite=Strict/Lax cookie: the browser won’t send the cookie on requests coming from other sites.'}</li>
            <li>{ar ? 'الحل ٣: أعد طلب كلمة المرور أو تأكيد إضافي للعمليات الحساسة (كالتحويلات).' : 'Fix 3: re-ask for the password or an extra confirmation for sensitive actions (like transfers).'}</li>
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
