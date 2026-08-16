import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import LinuxTerminal from '../components/LinuxTerminal'
import Explanation from '../components/Explanation'

const HOST = 'zaad-store.com'

const PRODUCTS = [
  { ar:'هاتف Galaxy S24',   en:'Galaxy S24',      price:3299, emoji:'📱', bg:'linear-gradient(135deg,#6366f1,#8b5cf6)', tagAr:'الأكثر مبيعاً', tagEn:'Best seller' },
  { ar:'حاسوب MacBook Air', en:'MacBook Air',     price:4599, emoji:'💻', bg:'linear-gradient(135deg,#0ea5e9,#2563eb)' },
  { ar:'سماعات AirPods',    en:'AirPods Pro',     price:899,  emoji:'🎧', bg:'linear-gradient(135deg,#10b981,#059669)' },
  { ar:'ساعة Watch Ultra',  en:'Watch Ultra',     price:2499, emoji:'⌚', bg:'linear-gradient(135deg,#f59e0b,#ef4444)', tagAr:'جديد', tagEn:'New' },
  { ar:'كاميرا Sony A7',    en:'Sony A7 Camera',  price:5999, emoji:'📷', bg:'linear-gradient(135deg,#334155,#0f172a)' },
  { ar:'مكبر صوت JBL',      en:'JBL Speaker',     price:649,  emoji:'🔊', bg:'linear-gradient(135deg,#ec4899,#db2777)' },
  { ar:'جهاز لوحي iPad',    en:'iPad Air',        price:2199, emoji:'📲', bg:'linear-gradient(135deg,#8b5cf6,#6d28d9)' },
  { ar:'شاحن لاسلكي',       en:'Wireless Charger', price:149, emoji:'🔌', bg:'linear-gradient(135deg,#14b8a6,#0d9488)' },
]

// ── the cracker tool ────────────────────────────────────────────────────────────
// brute-forces IN ORDER, trying EVERY possibility at each length: length 1
// (0-9, then a-z, then A-Z, then symbols), then every 2-character combination,
// then every 3-character … up to -n. A fixed 3-char password is only found once -n ≥ 3.
const ALPHA = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ#@!$%&*'
const B = ALPHA.length
const candFromIndex = (idx, L) => { let s = ''; for (let k = L - 1; k >= 0; k--) s += ALPHA[Math.floor(idx / Math.pow(B, k)) % B]; return s }
const indexOfCand = c => { let i = 0; for (const ch of c) i = i * B + ALPHA.indexOf(ch); return i }
// deterministic pseudo-random password of length L for a username
const passFor = (user, L) => { let seed = [...user].reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 5381); let s = ''; for (let i = 0; i < L; i++) { seed = (seed * 1103515245 + 12345) >>> 0; s += ALPHA[seed % B] } return s }
// password length = the number in the command, capped at 4 so the search stays
// watchable — and always ≤ N, so it is always found within 1..N
const passLen = maxLen => Math.max(1, Math.min(4, maxLen))

export function runCracker(ctx, { speed = 'medium', onStart, onProgress, onCrack, onFail }) {
  const { argv, print, printAll, schedule, setBusy } = ctx
  // positional syntax:  cracker <username> <number_of_digits> <website>
  const parts  = argv.slice(1).filter(a => !a.startsWith('-'))
  const user   = parts[0]
  const digits = parts.find(p => /^\d+$/.test(p))
  const maxLen = Math.max(1, Math.min(8, parseInt(digits || '3', 10) || 3))
  const host   = parts.find(p => p !== user && !/^\d+$/.test(p)) || HOST

  if (!user) { printAll([{ k:'err', v:'cracker: username required' }, { k:'dim', v:'usage: cracker <username> <number_of_digits> <website>' }]); return }

  const pass = passFor(user, passLen(maxLen))   // length grows with N (capped at 4), always ≤ N
  setBusy(true)
  onStart && onStart({ user, host, maxLen })
  printAll([
    { k:'info', v:'⚡ cracker v1.3 — CamelCode brute-forcer (verbose)' },
    { k:'out',  v:`[*] target     : http://${host}/login` },
    { k:'out',  v:`[*] username   : ${user}` },
    { k:'out',  v:`[*] charset    : 0-9  a-z  A-Z  # @ ! $ % & *  (${B} symbols)` },
    { k:'out',  v:`[*] max length : ${maxLen}` },
    { k:'out',  v:`[*] speed      : ${speed}` },
    { k:'dim',  v:'' },
  ])

  // one segment per length. The length that holds the password stops at the
  // password's index (found); every other length is streamed in FULL — no skips.
  const plan = []
  for (let L = 1; L <= maxLen; L++) {
    const countL = Math.pow(B, L)
    if (pass.length === L) { const t = indexOfCand(pass); plan.push({ L, countL, last: t, foundIdx: t }); break }
    plan.push({ L, countL, last: countL - 1, foundIdx: -1 })
  }
  // total candidates until (and including) the found one — used to size batches
  let total = 0
  for (const seg of plan) total += (seg.foundIdx >= 0 ? seg.foundIdx + 1 : seg.countL)

  // speed profiles — how fast attempts stream. `frames` bounds total run time:
  // batches grow so any search finishes in ~frames frames (with `batch` as the
  // floor for short searches). `readable` tries are shown one-by-one first.
  const SPEEDS = {
    slow:   { readable: 35, readableDelay: 90, batch: 30,  batchDelay: 50, frames: 450 },
    medium: { readable: 25, readableDelay: 55, batch: 80,  batchDelay: 16, frames: 220 },
    fast:   { readable: 10, readableDelay: 20, batch: 400, batchDelay: 6,  frames: 90 },
  }
  const S = SPEEDS[speed] || SPEEDS.medium
  const READABLE = S.readable   // first N tries shown one-by-one so the order is clear
  let li = 0, idx = 0, counter = 0, header = false

  const tick = () => {
    if (li >= plan.length) {                 // ran out of lengths → not found
      printAll([
        { k:'dim', v:'' },
        { k:'err', v:`[✗] exhausted every password up to ${maxLen} characters (${counter.toLocaleString()} tried) — not found.` },
        { k:'warn',v:`[!] the password is longer than ${maxLen} characters. try a bigger number (e.g. cracker ${user} ${maxLen + 1} ${host}).` },
      ])
      onFail && onFail(); setBusy(false); return
    }
    const seg = plan[li]
    if (!header) { print({ k:'info', v:`[*] trying ${seg.L}-character passwords  (${seg.countL.toLocaleString()} combinations)` }); header = true }

    const readablePhase = counter < READABLE
    const size = readablePhase ? 1 : Math.max(S.batch, Math.ceil(total / S.frames))
    const step = Math.max(1, Math.floor(size / 40))   // count every candidate, draw ≤ ~40 lines/frame
    const batch = []
    let lastCand = '', found = false
    for (let n = 0; n < size && idx <= seg.last; n++, idx++) {
      counter++
      lastCand = candFromIndex(idx, seg.L)
      if (idx === seg.foundIdx) {
        batch.push({ k:'ok', v:`[✓] ${String(counter).padStart(7)}   FOUND    ${user} : ${lastCand}` })
        found = true; idx++; break
      }
      if (n % step === 0) batch.push({ k:'dim', v:`[⚡] ${String(counter).padStart(7)}   trying   ${user} : ${lastCand}` })
    }
    printAll(batch)
    onProgress && onProgress({ user, pass: lastCand, n: counter })

    if (found) {
      printAll([
        { k:'dim', v:'' },
        { k:'ok',  v:`[✓] PASSWORD FOUND after ${counter.toLocaleString()} attempts` },
        { k:'ok',  v:`[✓] ${host}   →   ${user} : ${pass}` },
        { k:'warn',v:'[*] each extra character multiplies the work — this is why long passwords are safe!' },
      ])
      onCrack && onCrack({ user, pass }); setBusy(false); return
    }
    if (idx > seg.last) { li++; idx = 0; header = false }
    schedule(tick, readablePhase ? S.readableDelay : S.batchDelay)
  }
  schedule(tick, 300)
}

// ── the lesson page ─────────────────────────────────────────────────────────────
export default function PageBruteForce() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [page, setPage] = useState('/')
  const [addr, setAddr] = useState(HOST + '/')
  const [atk, setAtk]   = useState(null)   // { user, pass, n } live attack
  const [cracked, setCracked] = useState(null) // { user, pass }
  const [failed, setFailed] = useState(false)  // attack exhausted -n without finding
  const [mUser, setMUser]   = useState('')     // manual login: username field
  const [mPass, setMPass]   = useState('')     // manual login: password field
  const [loginErr, setLoginErr] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [speed, setSpeed] = useState('medium')   // cracker streaming speed: slow | medium | fast
  const speedRef = useRef(speed)
  speedRef.current = speed                        // keep the latest speed for the terminal command
  const [lastN, setLastN] = useState(3)           // last "number of characters" run, for manual-login checks

  const go = p => {
    let c = (p || '/').trim().replace(/^https?:\/\//i, '').replace(new RegExp('^' + HOST.replace(/\./g, '\\.'), 'i'), '').toLowerCase()
    if (!c.startsWith('/')) c = '/' + c
    c = c.replace(/\/+$/, '') || '/'
    setPage(c); setAddr(HOST + (c === '/' ? '/' : c))
  }

  const cracker = ctx => runCracker(ctx, {
    speed: speedRef.current,
    onStart: ({ maxLen }) => { setLastN(maxLen); setCracked(null); setFailed(false); setAtk({ user: '', pass: '', n: 0 }); setPage('/login'); setAddr(HOST + '/login') },
    onProgress: setAtk,
    onCrack: setCracked,
    onFail: () => setFailed(true),
  })

  // manual login: type a username + password and try them against the store
  const tryLogin = () => {
    const u = mUser.trim()
    if (!u || !mPass) return
    const correct = passFor(u, Math.max(1, Math.min(4, lastN)))
    if (mPass === correct) { setLoginErr(false); setFailed(false); setAtk(null); setCracked({ user: u, pass: mPass }) }
    else { setLoginErr(true) }
  }

  const qar = n => n.toLocaleString('en') + (isAr ? ' ر.ق' : ' QAR')

  // ── store UI ──────────────────────────────────────────────────────────────
  const NAV = [['/', 'الرئيسية', 'Home'], ['/shop', 'المتجر', 'Shop'], ['/about', 'من نحن', 'About'], ['/contact', 'تواصل', 'Contact']]
  const StoreNav = () => (
    <div style={{ display:'flex', alignItems:'center', gap:14, borderBottom:'1px solid #e2e8f0', paddingBottom:11, marginBottom:16, flexWrap:'wrap' }}>
      <span onClick={() => go('/')} style={{ fontWeight:900, color:'#0e1f39', fontSize:15, cursor:'pointer' }}>⚡ {isAr ? 'زاد ستور' : 'Zaad Store'}</span>
      {NAV.map(([p, ar, en]) => (
        <a key={p} onClick={() => go(p)} style={{ cursor:'pointer', fontSize:12.5, fontWeight:600, color: page === p ? '#7c3aed' : '#475569' }}>{isAr ? ar : en}</a>
      ))}
      <a onClick={() => go(cracked ? '/account' : '/login')} style={{ marginInlineStart:'auto', cursor:'pointer', fontSize:12, fontWeight:700, background: cracked ? '#dcfce7' : '#eef2ff', color: cracked ? '#15803d' : '#4338ca', border:`1px solid ${cracked ? '#86efac' : '#c7d2fe'}`, borderRadius:8, padding:'4px 12px' }}>
        {cracked ? (isAr ? `👤 ${cracked.user}` : `👤 ${cracked.user}`) : (isAr ? '🔒 دخول' : '🔒 Login')}
      </a>
    </div>
  )
  const Footer = () => (
    <div style={{ marginTop:20, borderTop:'1px solid #e2e8f0', paddingTop:12, fontSize:11, color:'#94a3b8', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
      <span>© 2026 {isAr ? 'زاد ستور — كل الحقوق محفوظة' : 'Zaad Store — All rights reserved'}</span>
      <span>{isAr ? 'الدفع عند الاستلام · شحن مجاني فوق 200 ر.ق' : 'Cash on delivery · Free shipping over 200 QAR'}</span>
    </div>
  )
  const ProductCard = (p, i) => (
    <div key={i} style={{ border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden', background:'white' }}>
      <div style={{ height:84, background:p.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, position:'relative' }}>
        {p.emoji}
        {(isAr ? p.tagAr : p.tagEn) && <span style={{ position:'absolute', top:6, insetInlineStart:6, background:'rgba(0,0,0,0.55)', color:'white', fontSize:9, fontWeight:800, borderRadius:6, padding:'2px 6px' }}>{isAr ? p.tagAr : p.tagEn}</span>}
      </div>
      <div style={{ padding:'8px 10px' }}>
        <div style={{ fontSize:12.5, fontWeight:700, color:'#1e293b' }}>{isAr ? p.ar : p.en}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:5 }}>
          <span style={{ fontSize:12.5, fontWeight:900, color:'#7c3aed' }} dir="ltr">{qar(p.price)}</span>
          <span style={{ fontSize:9, color:'#f59e0b' }}>★★★★☆</span>
        </div>
        <button style={{ marginTop:7, width:'100%', background:'#0e1f39', color:'white', border:'none', borderRadius:7, padding:'5px', fontSize:11, fontWeight:700, cursor:'pointer' }}>{isAr ? 'أضِف للسلة' : 'Add to cart'}</button>
      </div>
    </div>
  )

  const renderPage = () => {
    if (page === '/' || page === '/home' || page === '/index.html') return (<><StoreNav />
      <div style={{ background:'linear-gradient(135deg,#0e1f39,#312e81)', borderRadius:14, padding:'20px', color:'white', marginBottom:16 }}>
        <div style={{ fontSize:20, fontWeight:900 }}>{isAr ? 'أحدث الأجهزة الإلكترونية 🎧' : 'The latest electronics 🎧'}</div>
        <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.8)', marginTop:6 }}>{isAr ? 'توصيل سريع في قطر · ضمان سنتين · أفضل الأسعار' : 'Fast delivery in Qatar · 2-year warranty · best prices'}</div>
        <button onClick={() => go('/shop')} style={{ marginTop:12, background:'#FCAD0F', color:'#0e1f39', border:'none', borderRadius:9, padding:'8px 18px', fontWeight:800, cursor:'pointer', fontSize:12.5 }}>{isAr ? 'تسوّق الآن ←' : 'Shop now →'}</button>
      </div>
      <div style={{ fontSize:13, fontWeight:800, color:'#0e1f39', marginBottom:10 }}>{isAr ? '🔥 الأكثر رواجاً' : '🔥 Featured'}</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:12 }}>{PRODUCTS.slice(0, 4).map(ProductCard)}</div>
      <Footer />
    </>)

    if (page === '/shop' || page === '/products') return (<><StoreNav />
      <div style={{ fontSize:15, fontWeight:900, color:'#0e1f39', marginBottom:4 }}>{isAr ? 'كل المنتجات' : 'All products'}</div>
      <div style={{ fontSize:11.5, color:'#94a3b8', marginBottom:12 }}>{PRODUCTS.length} {isAr ? 'منتج' : 'products'}</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:12 }}>{PRODUCTS.map(ProductCard)}</div>
      <Footer />
    </>)

    if (page === '/about') return (<><StoreNav />
      <div style={{ fontSize:16, fontWeight:900, color:'#0e1f39', marginBottom:8 }}>{isAr ? 'من نحن' : 'About Us'}</div>
      <p style={{ color:'#475569', fontSize:12.5, lineHeight:1.9 }}>{isAr ? 'زاد ستور متجر إلكتروني قطري تأسّس عام 2019 لبيع أحدث الأجهزة الإلكترونية بأسعار منافسة. نخدم أكثر من ٥٠ ألف عميل في الدوحة والمناطق المجاورة.' : 'Zaad Store is a Qatari online shop founded in 2019, selling the latest electronics at competitive prices. We serve 50,000+ customers across Doha and beyond.'}</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:12 }}>
        {[[isAr ? 'عميل' : 'Customers', '50K+'], [isAr ? 'منتج' : 'Products', '1,200+'], [isAr ? 'تقييم' : 'Rating', '4.8★']].map(([l, v]) => (
          <div key={l} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'10px', textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:900, color:'#7c3aed' }} dir="ltr">{v}</div><div style={{ fontSize:10.5, color:'#64748b' }}>{l}</div>
          </div>
        ))}
      </div>
      <Footer />
    </>)

    if (page === '/contact') return (<><StoreNav />
      <div style={{ fontSize:16, fontWeight:900, color:'#0e1f39', marginBottom:10 }}>{isAr ? 'تواصل معنا' : 'Contact Us'}</div>
      {[['📧', 'support@zaad-store.com'], ['📞', '+974 4012 3456'], ['📍', isAr ? 'الدوحة، قطر — شارع الخليج' : 'Doha, Qatar — Gulf Street'], ['🕐', isAr ? 'السبت–الخميس، 9ص–9م' : 'Sat–Thu, 9AM–9PM']].map(([ic, v]) => (
        <div key={v} style={{ display:'flex', gap:10, alignItems:'center', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:9, padding:'9px 12px', marginBottom:8 }}>
          <span style={{ fontSize:18 }}>{ic}</span><span style={{ fontSize:12.5, color:'#334155' }} dir="ltr">{v}</span>
        </div>
      ))}
      <Footer />
    </>)

    if (page === '/account') return (<><StoreNav />
      {cracked ? (<>
        <div style={{ background:'#f0fdf4', border:'2px solid #86efac', borderRadius:12, padding:'14px 16px', marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:900, color:'#15803d' }}>👤 {isAr ? `مرحباً ${cracked.user}` : `Welcome, ${cracked.user}`}</div>
          <div style={{ fontSize:12, color:'#166534', marginTop:4 }}>{isAr ? 'دخلتَ إلى الحساب باستخدام كلمة المرور التي كسرها cracker.' : 'You are in the account using the password cracker recovered.'}</div>
        </div>
        <div style={{ fontSize:13, fontWeight:800, color:'#0e1f39', marginBottom:8 }}>{isAr ? '🧾 طلباتي' : '🧾 My orders'}</div>
        {[[isAr ? 'ساعة Watch Ultra' : 'Watch Ultra', '#ZS-4821', isAr ? 'تم التوصيل' : 'Delivered'], [isAr ? 'سماعات AirPods' : 'AirPods Pro', '#ZS-4790', isAr ? 'قيد الشحن' : 'Shipping']].map(([n, id, st]) => (
          <div key={id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:9, padding:'9px 12px', marginBottom:8, fontSize:12 }}>
            <span style={{ fontWeight:700, color:'#1e293b' }}>{n}</span><span style={{ fontFamily:'monospace', color:'#64748b' }}>{id}</span><span style={{ color:'#7c3aed', fontWeight:700 }}>{st}</span>
          </div>
        ))}
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, padding:'9px 12px', marginTop:10, fontSize:11.5, color:'#b91c1c' }}>💳 {isAr ? 'بطاقة محفوظة: **** **** **** 4471' : 'Saved card: **** **** **** 4471'}</div>
      </>) : (
        <div style={{ textAlign:'center', paddingTop:26, color:'#64748b' }}>
          <div style={{ fontSize:34 }}>🔒</div>
          <div style={{ fontSize:15, fontWeight:800, color:'#dc2626' }}>{isAr ? 'يجب تسجيل الدخول' : 'Login required'}</div>
          <div style={{ fontSize:12, marginTop:6 }}>{isAr ? 'سجّل الدخول من /login أولاً.' : 'Sign in at /login first.'}</div>
        </div>
      )}
      <Footer />
    </>)

    if (page === '/login') {
      const busy = atk && !cracked && !failed
      const showAttempt = atk && (busy || failed || cracked)
      const locked = busy || !!cracked           // fields read-only while the tool runs or after login
      const uVal = cracked ? cracked.user : busy ? (atk.user || '') : mUser
      const pVal = cracked ? cracked.pass : busy ? (atk.pass || '') : mPass
      const passBorder = cracked ? '#22c55e' : (failed || loginErr) ? '#ef4444' : busy ? '#f59e0b' : '#e2e8f0'
      return (<><StoreNav />
        <div style={{ maxWidth:340, margin:'6px auto' }}>
          <div style={{ textAlign:'center', marginBottom:14 }}>
            <div style={{ fontSize:30 }}>🔐</div>
            <div style={{ fontSize:16, fontWeight:900, color:'#0e1f39' }}>{isAr ? 'تسجيل الدخول' : 'Sign in'}</div>
            <div style={{ fontSize:11, color:'#94a3b8' }}>{HOST}</div>
          </div>
          {/* username — type it manually */}
          <label style={{ fontSize:11, fontWeight:700, color:'#64748b' }}>{isAr ? 'اسم المستخدم' : 'Username'}</label>
          <input value={uVal} disabled={locked}
            onChange={e => { setMUser(e.target.value); setLoginErr(false) }}
            onKeyDown={e => { if (e.key === 'Enter') tryLogin() }}
            spellCheck={false} autoCapitalize="off" autoComplete="off" placeholder={isAr ? 'اكتب اسم المستخدم' : 'enter username'} dir="ltr"
            style={{ width:'100%', boxSizing:'border-box', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'9px 12px', margin:'4px 0 12px', fontFamily:'monospace', fontSize:13, color:'#334155', outline:'none' }} />
          {/* password — type it manually */}
          <label style={{ fontSize:11, fontWeight:700, color:'#64748b' }}>{isAr ? 'كلمة المرور' : 'Password'}</label>
          <div style={{ background:'#f8fafc', border:`2px solid ${passBorder}`, borderRadius:8, padding:'5px 12px', margin:'4px 0 12px', display:'flex', alignItems:'center', gap:6, transition:'border-color .2s' }} dir="ltr">
            <input type={showPass ? 'text' : 'password'} value={pVal} disabled={locked}
              onChange={e => { setMPass(e.target.value); setLoginErr(false) }}
              onKeyDown={e => { if (e.key === 'Enter') tryLogin() }}
              spellCheck={false} autoCapitalize="off" autoComplete="off" placeholder={isAr ? 'اكتب كلمة المرور' : 'enter password'}
              style={{ flex:1, minWidth:0, background:'transparent', border:'none', outline:'none', fontFamily:'monospace', fontSize:13, fontWeight: cracked ? 800 : 400, color: cracked ? '#15803d' : (failed || loginErr) ? '#b91c1c' : '#334155' }} />
            <button onClick={() => setShowPass(s => !s)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, padding:0, lineHeight:1 }} title={showPass ? 'hide' : 'show'}>{showPass ? '🙈' : '👁️'}</button>
            {busy && <span style={{ width:2, height:15, background:'#f59e0b', animation:'bf-blink .8s infinite' }} />}
          </div>
          {showAttempt && (
            <div style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748b', marginBottom:4 }} dir="ltr">
                <span>{isAr ? `المحاولة رقم ${atk.n.toLocaleString('en')}` : `Attempt #${atk.n.toLocaleString('en')}`}</span>
                <span>{cracked ? '✓' : failed ? '✗' : ''}</span>
              </div>
              <div style={{ background:'#e2e8f0', borderRadius:6, height:6, overflow:'hidden' }}>
                <div style={{ height:'100%', width: (cracked || failed) ? '100%' : '60%', background: cracked ? '#22c55e' : failed ? '#ef4444' : '#f59e0b', animation: busy ? 'bf-blink 1s infinite' : 'none' }} />
              </div>
            </div>
          )}
          {cracked ? (
            <div style={{ background:'#f0fdf4', border:'2px solid #86efac', borderRadius:10, padding:12, textAlign:'center' }}>
              <div style={{ fontSize:26 }}>✅</div>
              <div style={{ fontWeight:900, color:'#15803d', fontSize:14 }}>{isAr ? 'تم تسجيل الدخول!' : 'Logged in!'}</div>
              <div style={{ fontFamily:'monospace', fontSize:13, color:'#166534', marginTop:4 }} dir="ltr">{cracked.user} : {cracked.pass}</div>
              <button onClick={() => go('/account')} style={{ marginTop:10, width:'100%', background:'#15803d', color:'white', border:'none', borderRadius:8, padding:'8px', fontWeight:700, cursor:'pointer', fontSize:12 }}>{isAr ? 'ادخل إلى الحساب ←' : 'Open the account →'}</button>
            </div>
          ) : busy ? (
            <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:9, padding:'8px 12px', display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#92610a' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#f59e0b', animation:'bf-blink .8s infinite' }} />{isAr ? 'الأداة تجرّب كلمات المرور...' : 'The tool is trying passwords...'}
            </div>
          ) : (
            <>
              {failed && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, padding:'8px 12px', marginBottom:10, fontSize:11.5, color:'#b91c1c', lineHeight:1.5 }}>
                  🛡️ {isAr ? 'فشل الهجوم — كلمة المرور أطول من عدد الأحرف الذي حدّدته. جرّب عدداً أكبر، أو سجّل الدخول يدوياً.' : 'Attack failed — the password is longer than the number of characters you set. Try a bigger number, or log in manually.'}
                </div>
              )}
              {loginErr && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, padding:'8px 12px', marginBottom:10, fontSize:12, color:'#b91c1c', display:'flex', alignItems:'center', gap:7 }}>
                  <span>⛔</span>{isAr ? 'اسم المستخدم أو كلمة المرور غير صحيحة.' : 'Wrong username or password.'}
                </div>
              )}
              <button onClick={tryLogin} style={{ width:'100%', background:'#0e1f39', color:'white', border:'none', borderRadius:8, padding:'9px', fontWeight:700, cursor:'pointer', fontSize:12.5 }}>{isAr ? 'دخول' : 'Sign in'}</button>
              <div style={{ fontSize:11, color:'#94a3b8', marginTop:10, textAlign:'center', lineHeight:1.6 }}>{isAr ? '💡 جرّب تسجيل الدخول يدوياً، أو استخدم أداة cracker في الطرفية لكسر كلمة المرور.' : '💡 Try logging in manually, or use the cracker tool in the terminal to brute-force the password.'}</div>
            </>
          )}
        </div>
        <Footer />
      </>)
    }

    if (page === '/robots.txt') return <pre style={{ fontFamily:'monospace', fontSize:12.5, color:'#334155' }}>{'User-agent: *\nDisallow: /account'}</pre>
    return null
  }

  return (
    <div style={{ maxWidth:1180, margin:'0 auto', padding:'20px 14px', fontFamily:'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{`@keyframes bf-blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>

      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <span style={{ background:'#fef2f2', color:'#b91c1c', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>🧨 {isAr ? 'مختبر أمان الويب' : 'Web Security Lab'}</span>
        <button onClick={() => navigate('/')} style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:7, padding:'3px 10px', fontSize:12, color:'#64748b', cursor:'pointer' }}>{isAr ? '← الرئيسية' : '← Home'}</button>
      </div>
      <h1 style={{ fontSize:23, fontWeight:900, color:'#1e293b', margin:'0 0 12px' }}>🧨 {isAr ? 'هجوم القوة الغاشمة (Brute Force)' : 'Brute-Force Attack'}</h1>

      {/* command explainer */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
        {[['admin', isAr ? 'اسم المستخدم' : 'the username'], ['4', isAr ? 'عدد أحرف كلمة المرور (١–٤)' : 'password length (1–4)'], [HOST, isAr ? 'الموقع الهدف' : 'the target website']].map(([c, d]) => (
          <div key={c} style={{ background:'white', border:'2px solid #e2e8f0', borderRadius:9, padding:'6px 10px' }}>
            <code style={{ fontFamily:'monospace', fontSize:11, fontWeight:800, color:'#b91c1c' }}>{c}</code>
            <div style={{ fontSize:10, color:'#64748b' }}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'#0b1020', borderRadius:10, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }} dir="ltr">
        <span style={{ color:'#4ade80', fontFamily:'monospace', fontSize:12, fontWeight:700 }}>$</span>
        <code style={{ flex:1, fontFamily:'monospace', fontSize:12.5, color:'#a5f3fc', minWidth:200 }}>cracker admin 4 {HOST}</code>
        <button onClick={() => navigator.clipboard && navigator.clipboard.writeText(`cracker admin 4 ${HOST}`)} style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:6, color:'#94a3b8', cursor:'pointer', fontSize:11, padding:'3px 10px' }}>{isAr ? '⧉ نسخ' : '⧉ copy'}</button>
      </div>

      {/* speed selector */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <span style={{ fontSize:12, fontWeight:800, color:'#64748b' }}>{isAr ? 'سرعة الأداة:' : 'Tool speed:'}</span>
        {[['slow', isAr ? 'بطيء' : 'Slow', '🐢'], ['medium', isAr ? 'متوسط' : 'Medium', '⚡'], ['fast', isAr ? 'سريع' : 'Fast', '🚀']].map(([key, label, emoji]) => (
          <button key={key} onClick={() => setSpeed(key)}
            style={{ border:`2px solid ${speed === key ? '#7c3aed' : '#e2e8f0'}`, background: speed === key ? '#7c3aed' : 'white', color: speed === key ? 'white' : '#475569', borderRadius:8, padding:'5px 14px', fontSize:12, fontWeight:800, cursor:'pointer', transition:'all .15s' }}>
            {emoji} {label}
          </button>
        ))}
        <span style={{ fontSize:11, color:'#94a3b8' }}>{isAr ? '(اختر قبل تشغيل الأداة)' : '(choose before running the tool)'}</span>
      </div>

      {/* terminal + browser side by side */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:16, alignItems:'start' }}>
        <LinuxTerminal isAr={isAr} height={470} maxLines={240} extraCommands={{ cracker }}
          welcome={[{ k:'info', v: isAr ? '# الصق أمر cracker وشغّله، وراقب صفحة الدخول على اليمين. اكتب help لكل الأوامر.' : '# Paste the cracker command and run it, watch the login on the right. Type help for all commands.' }]} />

        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:1, marginBottom:8 }}>{isAr ? 'الموقع الهدف — zaad-store.com' : 'TARGET WEBSITE — zaad-store.com'}</div>
          <div style={{ border:'2px solid #cbd5e1', borderRadius:12, overflow:'hidden', background:'white', boxShadow:'0 6px 18px rgba(0,0,0,0.08)' }}>
            <div style={{ background:'#e2e8f0', padding:'7px 10px', display:'flex', alignItems:'center', gap:8 }} dir="ltr">
              <span style={{ display:'flex', gap:4 }}><span style={{ width:9, height:9, borderRadius:'50%', background:'#ef4444' }} /><span style={{ width:9, height:9, borderRadius:'50%', background:'#f59e0b' }} /><span style={{ width:9, height:9, borderRadius:'50%', background:'#22c55e' }} /></span>
              <div style={{ flex:1, display:'flex', alignItems:'center', gap:4, background:'white', borderRadius:20, padding:'4px 12px', border:'1px solid #cbd5e1' }}>
                <span style={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace' }}>🔒 http://</span>
                <input value={addr} onChange={e => setAddr(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') go(addr) }} spellCheck={false} autoCapitalize="off" autoComplete="off"
                  style={{ flex:1, border:'none', outline:'none', fontFamily:'monospace', fontSize:12, color:'#334155' }} />
              </div>
              <button onClick={() => go(page)} title="reload" style={{ background:'white', border:'1px solid #cbd5e1', borderRadius:7, cursor:'pointer', fontSize:13, padding:'2px 8px' }}>⟳</button>
            </div>
            <div style={{ height:520, overflow:'auto', padding:'16px 18px', background:'#fff', color:'#1e293b', fontSize:13, lineHeight:1.6 }}>
              {renderPage() || (
                <div style={{ textAlign:'center', color:'#94a3b8', paddingTop:40 }}><div style={{ fontSize:40, fontWeight:900, color:'#cbd5e1' }}>404</div><div style={{ fontFamily:'monospace', fontSize:12 }}>{HOST}{page}</div></div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Explanation>
        <p style={{ fontSize:13, color:'#64748b', margin:0, lineHeight:1.7 }}>
          {isAr
            ? `أداة cracker تجرّب كل الاحتمالات الممكنة بالترتيب: أولاً كل الحروف المفردة (0-9 ثم a-z ثم A-Z ثم الرموز)، ثم كل التركيبات من حرفين، ثم ثلاثة، حتى العدد الذي تحدّده في الأمر (١ إلى ٤). الأمر: cracker اسم_المستخدم عدد_الأحرف الموقع. طول كلمة المرور يساوي هذا العدد — فتظهر دائماً ضمن المدى، وكلّما زاد العدد أصبح البحث أطول وأصعب. اختر السرعة وشاهد المحاولات على اليمين.`
            : `cracker tries every possibility in order: first every single character (0-9, then a-z, then A-Z, then symbols), then every 2-character combination, then 3, up to the number you set in the command (1 to 4). The command is: cracker <username> <number_of_digits> <website>. The password's length equals that number — so it always appears within the range, and the bigger the number the longer and harder the search. Pick a speed and watch the attempts on the right.`}
        </p>
      </Explanation>

      <div style={{ display:'flex', justifyContent:'center', marginTop:20 }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:6, color:'#1d4ed8', background:'#eff6ff', border:'2px solid #bfdbfe', borderRadius:10, padding:'10px 28px', cursor:'pointer', fontSize:14, fontWeight:700 }}>
          <ChevronLeft size={15} />{isAr ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
