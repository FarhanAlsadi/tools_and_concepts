import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   SQL INJECTION LESSON
   A vulnerable login page. The user's raw input is concatenated straight into a
   SQL query (the classic bug). A small real SQL WHERE-evaluator then scans the
   users table row by row — so ' OR 1=1 --  genuinely bypasses because the LOGIC
   evaluates to true, not because of a hardcoded string match.
   ──────────────────────────────────────────────────────────────────────────── */

const USERS = [
  { id: 1,  username: 'admin',  password: 'S3cr3t!',    role: 'Administrator', roleAr: 'مدير النظام' },
  { id: 2,  username: 'sara',   password: 'sara2024',   role: 'Instructor',    roleAr: 'مدرّبة' },
  { id: 3,  username: 'omar',   password: 'qatar123',   role: 'Student',       roleAr: 'طالب' },
  { id: 4,  username: 'lina',   password: 'lina#88',    role: 'Instructor',    roleAr: 'مدرّبة' },
  { id: 5,  username: 'yousef', password: 'pass1234',   role: 'Student',       roleAr: 'طالب' },
  { id: 6,  username: 'mariam', password: 'm@riam21',   role: 'Student',       roleAr: 'طالبة' },
  { id: 7,  username: 'hassan', password: 'hassan_q8',  role: 'Staff',         roleAr: 'موظف' },
  { id: 8,  username: 'noura',  password: 'Noura2023',  role: 'Manager',       roleAr: 'مديرة' },
  { id: 9,  username: 'khalid', password: 'kh@lid99',   role: 'Student',       roleAr: 'طالب' },
  { id: 10, username: 'aisha',  password: 'aisha!love', role: 'Student',       roleAr: 'طالبة' },
  { id: 11, username: 'fatima', password: 'f4tima_pw',  role: 'Instructor',    roleAr: 'مدرّبة' },
  { id: 12, username: 'ali',    password: 'ali12345',   role: 'Student',       roleAr: 'طالب' },
  { id: 13, username: 'sultan', password: 'sultan#qa',  role: 'Staff',         roleAr: 'موظف' },
  { id: 14, username: 'reem',   password: 'reem2024',   role: 'Student',       roleAr: 'طالبة' },
  { id: 15, username: 'saad',   password: 'saadS@ad',   role: 'Support',       roleAr: 'دعم فني' },
  { id: 16, username: 'huda',   password: 'huda_doha',  role: 'Student',       roleAr: 'طالبة' },
  { id: 17, username: 'tariq',  password: 't@riq_77',   role: 'Student',       roleAr: 'طالب' },
  { id: 18, username: 'layla',  password: 'layla2022',  role: 'Instructor',    roleAr: 'مدرّبة' },
  { id: 19, username: 'nasser', password: 'n@sser88',   role: 'Manager',       roleAr: 'مدير' },
  { id: 20, username: 'dana',   password: 'dana#pass',  role: 'Student',       roleAr: 'طالبة' },
  { id: 21, username: 'ahmad',  password: 'ahmad!23',   role: 'Student',       roleAr: 'طالب' },
  { id: 22, username: 'salma',  password: 'salma_qtr',  role: 'Staff',         roleAr: 'موظفة' },
  { id: 23, username: 'guest',  password: 'guest',      role: 'Guest',         roleAr: 'زائر' },
]

// ── tiny SQL WHERE tokenizer (stops at -- or # comment) ───────────────────────
function tokenize(s) {
  const toks = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (c === ' ' || c === '\t' || c === '\n') { i++; continue }
    if (c === '#') break
    if (c === '-' && s[i + 1] === '-') break
    if (c === "'") {
      let j = i + 1, val = ''
      while (j < s.length && s[j] !== "'") { val += s[j]; j++ }
      if (j >= s.length) { toks.push({ t: 'str', v: val, bad: true }); return toks }
      toks.push({ t: 'str', v: val }); i = j + 1; continue
    }
    if (c === '=') { toks.push({ t: 'op', v: '=' }); i++; continue }
    if ((c === '<' && s[i + 1] === '>') || (c === '!' && s[i + 1] === '=')) { toks.push({ t: 'op', v: '<>' }); i += 2; continue }
    if (c === '(') { toks.push({ t: 'lp' }); i++; continue }
    if (c === ')') { toks.push({ t: 'rp' }); i++; continue }
    if (/[0-9]/.test(c)) { let j = i, n = ''; while (j < s.length && /[0-9]/.test(s[j])) { n += s[j]; j++ } toks.push({ t: 'num', v: n }); i = j; continue }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i, id = ''
      while (j < s.length && /[a-zA-Z0-9_]/.test(s[j])) { id += s[j]; j++ }
      const up = id.toUpperCase()
      toks.push(up === 'AND' || up === 'OR' ? { t: 'logic', v: up } : { t: 'ident', v: id })
      i = j; continue
    }
    toks.push({ t: 'err', v: c }); i++
  }
  return toks
}

// evaluate the WHERE clause against a single row → true/false (throws on syntax error)
function evalWhere(toks, row) {
  let p = 0
  const peek = () => toks[p]
  const next = () => toks[p++]
  const resolve = term => term.type === 'col'
    ? (row[term.v] !== undefined ? String(row[term.v]) : null)
    : term.v
  const parseTerm = () => {
    const tk = next()
    if (!tk) throw new Error('unexpected end of query')
    if (tk.t === 'str') { if (tk.bad) throw new Error('unterminated string'); return { type: 'val', v: tk.v } }
    if (tk.t === 'num') return { type: 'val', v: tk.v }
    if (tk.t === 'ident') return { type: 'col', v: tk.v.toLowerCase() }
    throw new Error('syntax error near "' + (tk.v || tk.t) + '"')
  }
  const parseCmp = () => {
    if (peek() && peek().t === 'lp') { next(); const e = parseOr(); if (peek() && peek().t === 'rp') next(); else throw new Error('missing )'); return e }
    const left = parseTerm(); const op = peek()
    if (op && op.t === 'op') { next(); const right = parseTerm(); const eq = resolve(left) === resolve(right); return op.v === '=' ? eq : !eq }
    const v = resolve(left); return v != null && v !== '' && v !== '0'
  }
  const parseAnd = () => { let v = parseCmp(); while (peek() && peek().t === 'logic' && peek().v === 'AND') { next(); v = parseCmp() && v } return v }
  function parseOr() { let v = parseAnd(); while (peek() && peek().t === 'logic' && peek().v === 'OR') { next(); v = parseAnd() || v } return v }
  const r = parseOr()
  if (p < toks.length) throw new Error('unexpected token near "' + (peek().v || peek().t) + '"')
  return r
}

const PAYLOADS = [
  { field: 'user', val: "' OR 1=1 --",  ar: "' OR 1=1 --  (في اسم المستخدم)", en: "' OR 1=1 --  (username)" },
  { field: 'user', val: "admin' --",     ar: "admin' --  (تسجيل دخول كـ admin)", en: "admin' --  (log in as admin)" },
  { field: 'pass', val: "' OR '1'='1",   ar: "' OR '1'='1  (في كلمة المرور)", en: "' OR '1'='1  (password field)" },
]

export default function PageSQLi() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [scanIdx, setScanIdx] = useState(-1)   // row currently being tested
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)   // { matched, injected } | { error } | null
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const clearT = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  const whereStr = `username = '${user}' AND password = '${pass}'`
  const fullQuery = `SELECT * FROM users WHERE ${whereStr}`
  const commentIdx = (() => { const m = fullQuery.match(/(--|#)/); return m ? m.index : -1 })()
  const effective = commentIdx > -1 ? fullQuery.slice(0, commentIdx).trim() : null

  const runLogin = () => {
    clearT()
    setResult(null); setScanIdx(-1)
    let toks
    try { toks = tokenize(whereStr) } catch (e) { setResult({ error: e.message }); return }
    // validate parse once up front (catches broken injection → SQL error, also educational)
    try { evalWhere(toks, USERS[0]) } catch (e) { setResult({ error: e.message }); return }

    setScanning(true)
    const matched = []   // ALL rows the query returns (an injection can return many)
    // per-row scan delay shrinks as the table grows, so a big table stays snappy
    const STEP = Math.min(550, Math.max(170, Math.round(5000 / USERS.length)))
    USERS.forEach((row, i) => {
      timers.current.push(setTimeout(() => {
        setScanIdx(i)
        if (evalWhere(toks, row)) matched.push(row)
      }, STEP * (i + 1)))
    })
    timers.current.push(setTimeout(() => {
      setScanning(false); setScanIdx(-1)
      if (matched.length) {
        const first = matched[0]
        const legit = matched.length === 1 && first.username === user && first.password === pass
        setResult({ matched: first, rows: matched, injected: !legit })
      } else {
        setResult({ matched: null, rows: [], injected: false })
      }
    }, STEP * (USERS.length + 1)))
  }

  const reset = () => { clearT(); setUser(''); setPass(''); setScanIdx(-1); setScanning(false); setResult(null) }
  const usePayload = p => { clearT(); setResult(null); setScanIdx(-1); p.field === 'user' ? setUser(p.val) : setPass(p.val) }

  const loggedIn = result && result.matched
  const S = { mono: { fontFamily: 'monospace' } }

  // Highlight only the characters that stay INSIDE the string quotes. As soon as
  // the input escapes the field with a ' the rest is real SQL, shown un-highlighted.
  const HL = { background: '#78350f', color: '#fde68a', borderRadius: 3, padding: '0 2px' }
  const renderField = v => {
    if (!v) return <span style={HL}><span style={{ opacity: .4 }}>…</span></span>
    const k = v.indexOf("'")
    if (k === -1) return <span style={HL}>{v}</span>
    const inside = v.slice(0, k), escaped = v.slice(k)
    return (<>{inside && <span style={HL}>{inside}</span>}<span style={{ color: '#e2e8f0' }}>{escaped}</span></>)
  }

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 14px', fontFamily: 'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{`
        @keyframes sqli-in { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sqli-scan { 0%,100%{background:#fef9c3} 50%{background:#fde68a} }
        .sqli-btn{ border:none;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s }
        .sqli-btn:hover:not(:disabled){ filter:brightness(1.07);transform:translateY(-1px) }
        .sqli-btn:disabled{ opacity:.5;cursor:not-allowed }
        .sqli-in{ width:100%;padding:9px 11px;border:1px solid #cbd5e1;border-radius:8px;box-sizing:border-box;font-size:13px }
        .sqli-in:focus{ outline:none;border-color:#7c3aed }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ background: '#faf5ff', color: '#7c3aed', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>💉 {isAr ? 'أمن التطبيقات' : 'App Security'}</span>
        <button onClick={() => navigate('/')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '3px 10px', fontSize: 12, color: '#64748b', cursor: 'pointer' }}>{isAr ? '← الرئيسية' : '← Home'}</button>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: '0 0 16px' }}>💉 {isAr ? 'حقن SQL — SQL Injection' : 'SQL Injection'}</h1>

      {/* ── Browser (login) — spans 80% of the page ────────────────────────────── */}
      <div style={{ width: '80%', margin: '0 auto' }}>
        {/* Browser */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 8 }}>{isAr ? 'المتصفح' : 'BROWSER'}</div>
          <div style={{ border: '2px solid #cbd5e1', borderRadius: 12, overflow: 'hidden', background: 'white', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
            <div style={{ background: '#e2e8f0', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8 }} dir="ltr">
              <span style={{ display: 'flex', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444' }} /><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }} /><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e' }} /></span>
              <div style={{ flex: 1, background: 'white', borderRadius: 20, padding: '4px 12px', border: '1px solid #cbd5e1', ...S.mono, fontSize: 11.5, color: '#334155' }}>🔒 http://dukkan.shop/login</div>
            </div>

            <div dir={isAr ? 'rtl' : 'ltr'} style={{ padding: '22px 22px', minHeight: 250 }}>
              {loggedIn ? (
                <div style={{ animation: 'sqli-in .25s ease' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 40 }}>{result.injected ? '🔓' : '✅'}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#15803d' }}>{isAr ? `مرحباً، ${result.matched.username}!` : `Welcome, ${result.matched.username}!`}</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>{isAr ? result.matched.roleAr : result.matched.role} · {isAr ? 'لوحة التحكم' : 'Dashboard'}</div>
                  </div>
                  {result.injected && (
                    <div style={{ marginTop: 14, background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: 10, padding: '10px 13px', fontSize: 12.5, color: '#b91c1c', lineHeight: 1.6 }}>
                      🚨 <b>{isAr ? 'تم التجاوز عبر حقن SQL!' : 'Bypassed via SQL Injection!'}</b> {isAr ? 'دخلت دون معرفة كلمة المرور الحقيقية — جعلت شرط الاستعلام صحيحاً دائماً.' : 'You logged in without knowing the real password — you made the query condition always true.'}
                    </div>
                  )}
                  <button onClick={reset} className="sqli-btn" style={{ background: '#0e1f39', color: 'white', width: '100%', marginTop: 14 }}>{isAr ? '↺ تسجيل الخروج' : '↺ Log out'}</button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#0e1f39', textAlign: 'center', marginBottom: 16 }}>🔐 {isAr ? 'تسجيل الدخول' : 'Member Login'}</div>
                  <div style={{ maxWidth: 300, margin: '0 auto' }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{isAr ? 'اسم المستخدم' : 'Username'}</label>
                    <input className="sqli-in" value={user} onChange={e => setUser(e.target.value)} placeholder={isAr ? 'اسم المستخدم' : 'username'} style={{ marginTop: 4, marginBottom: 12 }} dir="ltr" />
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{isAr ? 'كلمة المرور' : 'Password'}</label>
                    <input className="sqli-in" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') runLogin() }} placeholder={isAr ? 'كلمة المرور' : 'password'} style={{ marginTop: 4, marginBottom: 14 }} dir="ltr" />
                    <button onClick={runLogin} disabled={scanning} className="sqli-btn" style={{ background: scanning ? '#94a3b8' : '#0e1f39', color: 'white', width: '100%' }}>
                      {scanning ? (isAr ? '⏳ جارٍ التحقق...' : '⏳ Checking...') : (isAr ? 'دخول' : 'Login')}
                    </button>
                    {result && result.matched === null && !result.error && (
                      <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '9px 12px', color: '#dc2626', fontSize: 12.5, fontWeight: 700, textAlign: 'center', animation: 'sqli-in .25s ease' }}>
                        ❌ {isAr ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Incorrect username or password'}
                      </div>
                    )}
                    {result && result.error && (
                      <div style={{ marginTop: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '9px 12px', color: '#92610a', fontSize: 12, ...S.mono, animation: 'sqli-in .25s ease' }} dir="ltr">
                        ⚠️ SQL error: {result.error}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Live SQL query — 80%, below the login page ─────────────────────────── */}
      <div style={{ width: '80%', margin: '16px auto 0', background: '#0b1020', borderRadius: 12, padding: '14px 16px' }} dir="ltr">
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 8 }}>{isAr ? '⬇ الجملة التي يبنيها إدخالك (مباشرة):' : '⬇ THE QUERY YOUR INPUT BUILDS (LIVE):'}</div>
        <code style={{ ...S.mono, fontSize: 14, lineHeight: 1.8, display: 'block', wordBreak: 'break-word' }}>
          <span style={{ color: '#c084fc' }}>SELECT </span><span style={{ color: '#e2e8f0' }}>* </span><span style={{ color: '#c084fc' }}>FROM </span><span style={{ color: '#7dd3fc' }}>users </span><span style={{ color: '#c084fc' }}>WHERE </span>
          <span style={{ color: '#7dd3fc' }}>username </span><span style={{ color: '#e2e8f0' }}>= '</span>
          {renderField(user)}
          <span style={{ color: '#e2e8f0' }}>' </span><span style={{ color: '#c084fc' }}>AND </span>
          <span style={{ color: '#7dd3fc' }}>password </span><span style={{ color: '#e2e8f0' }}>= '</span>
          {renderField(pass)}
          <span style={{ color: '#e2e8f0' }}>'</span>
        </code>
        {effective && (
          <div style={{ marginTop: 10, borderTop: '1px dashed #334155', paddingTop: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', letterSpacing: 1, marginBottom: 6 }}>{isAr ? '⚠ ما ينفّذه الخادم فعلاً (بعد التعليق --):' : '⚠ WHAT THE SERVER ACTUALLY RUNS (AFTER THE -- COMMENT):'}</div>
            <code style={{ ...S.mono, fontSize: 13.5, color: '#4ade80', display: 'block', wordBreak: 'break-word' }}>{effective}</code>
          </div>
        )}
      </div>

      {/* ── Returned rows — a separate table, directly under the query ─────────── */}
      {loggedIn && result.rows.length > 0 && (
        <div style={{ width: '80%', margin: '14px auto 0' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 8 }}>
            ⬇ {isAr ? `الصفوف التي أعادتها الجملة — ${result.rows.length} صف` : `ROWS RETURNED BY THE QUERY — ${result.rows.length} row(s)`}
          </div>
          <div style={{ background: '#0b1020', borderRadius: 12, padding: 14, border: `1px solid ${result.injected ? '#7f1d1d' : '#14532d'}` }} dir="ltr">
            <div style={{ ...S.mono, fontSize: 11, color: '#64748b', marginBottom: 8 }}>
              ↳ {isAr ? 'نتيجة' : 'result of'} <span style={{ color: '#c084fc' }}>SELECT * FROM</span> <span style={{ color: '#7dd3fc' }}>users</span>
              {result.injected && <span style={{ color: '#f87171' }}> {isAr ? '— كل الصفوف تسرّبت بسبب الحقن!' : '— every row leaked via injection!'}</span>}
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', ...S.mono, fontSize: 12.5 }}>
                <thead>
                  <tr style={{ color: '#94a3b8', fontSize: 10 }}>
                    <th style={{ textAlign: 'left', padding: '5px 8px', position: 'sticky', top: 0, background: '#0b1020' }}>id</th>
                    <th style={{ textAlign: 'left', padding: '5px 8px', position: 'sticky', top: 0, background: '#0b1020' }}>username</th>
                    <th style={{ textAlign: 'left', padding: '5px 8px', position: 'sticky', top: 0, background: '#0b1020' }}>password</th>
                    <th style={{ textAlign: 'left', padding: '5px 8px', position: 'sticky', top: 0, background: '#0b1020' }}>role</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map(r => (
                    <tr key={r.id} style={{ background: '#052e16' }}>
                      <td style={{ padding: '5px 8px', color: '#4ade80', borderTop: '1px solid #14532d' }}>{r.id}</td>
                      <td style={{ padding: '5px 8px', color: '#4ade80', fontWeight: 700, borderTop: '1px solid #14532d' }}>{r.username}</td>
                      <td style={{ padding: '5px 8px', color: '#86efac', borderTop: '1px solid #14532d' }}>{r.password}</td>
                      <td style={{ padding: '5px 8px', color: '#86efac', borderTop: '1px solid #14532d' }}>{isAr ? r.roleAr : r.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Database (server-side) — at the end, after the query ───────────────── */}
      <div style={{ width: '80%', margin: '16px auto 0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 8 }}>{isAr ? 'قاعدة البيانات (على الخادم) — تبحث فيها الجملة صفاً صفاً' : 'DATABASE (SERVER-SIDE) — the query scans it row by row'}</div>
        <div style={{ background: '#0b1020', borderRadius: 12, padding: 14 }}>
          <div style={{ ...S.mono, fontSize: 11, color: '#64748b', marginBottom: 8 }}>📋 {isAr ? 'جدول' : 'table'} <span style={{ color: '#7dd3fc' }}>users</span></div>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...S.mono, fontSize: 12 }} dir="ltr">
            <thead>
              <tr style={{ color: '#94a3b8', fontSize: 10 }}>
                <th style={{ textAlign: 'left', padding: '4px 6px' }}>id</th>
                <th style={{ textAlign: 'left', padding: '4px 6px' }}>username</th>
                <th style={{ textAlign: 'left', padding: '4px 6px' }}>password</th>
              </tr>
            </thead>
            <tbody>
              {USERS.map((r, i) => {
                const isScan = scanIdx === i
                const isMatch = loggedIn && result.rows.some(m => m.id === r.id)
                return (
                  <tr key={r.id} style={{
                    background: isMatch ? '#052e16' : isScan ? '#3f3f14' : 'transparent',
                    animation: isScan ? 'sqli-scan .5s' : 'none',
                  }}>
                    <td style={{ padding: '6px 6px', color: '#e2e8f0', borderTop: '1px solid #1e293b' }}>{r.id}</td>
                    <td style={{ padding: '6px 6px', color: isMatch ? '#4ade80' : '#e2e8f0', borderTop: '1px solid #1e293b', fontWeight: isMatch ? 800 : 400 }}>{r.username}</td>
                    <td style={{ padding: '6px 6px', color: isMatch ? '#4ade80' : '#fbbf24', borderTop: '1px solid #1e293b' }}>{r.password}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 10, minHeight: 20, fontSize: 11, ...S.mono }}>
            {scanning && scanIdx > -1 && <span style={{ color: '#fbbf24' }}>{isAr ? `يفحص الصف ${scanIdx + 1}...` : `scanning row ${scanIdx + 1}...`}</span>}
            {loggedIn && <span style={{ color: '#4ade80' }}>✔ {result.rows.length} {isAr ? (result.rows.length === 1 ? 'صف مُعاد' : 'صف مُعاد') : (result.rows.length === 1 ? 'row returned' : 'rows returned')} → {isAr ? 'الدخول مسموح' : 'access granted'}</span>}
            {result && result.matched === null && !result.error && <span style={{ color: '#f87171' }}>✖ 0 rows returned</span>}
          </div>
        </div>
      </div>

      {/* ── Payload buttons ────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 14, background: 'white', border: '2px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>🧪 {isAr ? 'جرّب هذه الحمولات (Payloads)' : 'Try these payloads'}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>{isAr ? 'اضغط لملء الحقل، ثم اضغط «دخول».' : 'Click to fill the field, then press Login.'}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PAYLOADS.map(p => (
            <button key={p.val} onClick={() => usePayload(p)} style={{ ...S.mono, fontSize: 12, background: '#faf5ff', border: '2px solid #d8b4fe', color: '#6d28d9', borderRadius: 8, padding: '6px 11px', cursor: 'pointer', fontWeight: 700 }} dir="ltr">
              {isAr ? p.ar : p.en}
            </button>
          ))}
          <button onClick={() => { setUser('admin'); setPass('S3cr3t!'); setResult(null) }} style={{ ...S.mono, fontSize: 12, background: '#f0fdf4', border: '2px solid #86efac', color: '#15803d', borderRadius: 8, padding: '6px 11px', cursor: 'pointer', fontWeight: 700 }} dir="ltr">
            admin / S3cr3t! {isAr ? '(دخول سليم)' : '(legit login)'}
          </button>
        </div>
      </div>

      {/* explanation — collapsed by default, sits under the practical part */}
      <Explanation>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0, maxWidth: 860, lineHeight: 1.7 }}>
          {isAr
            ? 'صفحة دخول مصابة بثغرة. كل ما تكتبه يُدمج مباشرة داخل جملة SQL بالأسفل. عند الضغط على «دخول» تبحث الجملة في جدول المستخدمين صفاً صفاً. جرّب دخولاً عادياً، ثم جرّب حقناً مثل  ⁨\' OR 1=1 --⁩  وشاهد كيف تتغيّر الجملة وتتجاوز التحقق.'
            : "A vulnerable login page. Everything you type is concatenated straight into the SQL query below. On “Login”, the query scans the users table row by row. Try a normal login, then try an injection like  ' OR 1=1 --  and watch the query change and bypass the check."}
        </p>
      </Explanation>

      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1d4ed8', background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 10, padding: '10px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          <ChevronLeft size={15} />{isAr ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
