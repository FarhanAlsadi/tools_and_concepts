import { useState, useEffect, useCallback, useRef } from 'react'
import { Server, Globe, RotateCcw, Shield } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Explanation from '../components/Explanation'

// ─── Animation CSS ────────────────────────────────────────────────────────────
const ANIM_ID = 'ddos-page-css'
const ANIM_CSS = `
@keyframes pkt-fly {
  0%   { opacity:0; transform:translate(0,0) scale(.5); }
  10%  { opacity:1; transform:translate(calc(var(--tx)*.10),calc(var(--ty)*.10)) scale(1); }
  85%  { opacity:1; transform:translate(calc(var(--tx)*.85),calc(var(--ty)*.85)) scale(1); }
  100% { opacity:0; transform:translate(var(--tx),var(--ty)) scale(.3); }
}
@keyframes pkt-blocked {
  0%   { opacity:0; transform:translate(0,0) scale(.5); }
  10%  { opacity:1; transform:translate(calc(var(--tx)*.10),calc(var(--ty)*.10)) scale(1); }
  80%  { opacity:1; transform:translate(var(--tx),var(--ty)) scale(1.2); }
  100% { opacity:0; transform:translate(var(--tx),var(--ty)) scale(0); }
}
@keyframes pkt-hang {
  0%   { opacity:0;  transform:translate(0,0) scale(.5); }
  12%  { opacity:1;  transform:translate(calc(var(--tx)*.12),calc(var(--ty)*.12)) scale(1); }
  76%  { opacity:1;  transform:translate(var(--tx),var(--ty)) scale(1); }
  82%  { opacity:1;  transform:translate(var(--tx),var(--ty)) scale(1.3); }
  88%  { opacity:1;  transform:translate(var(--tx),var(--ty)) scale(0.82); }
  100% { opacity:.6; transform:translate(var(--tx),var(--ty)) scale(1); }
}
@keyframes srv-shake {
  0%,100%{ transform:translate(-50%,-50%); }
  20%    { transform:translate(calc(-50% - 5px),-50%); }
  60%    { transform:translate(calc(-50% + 5px),-50%); }
}
@keyframes shield-pulse {
  0%,100%{ box-shadow:0 0 0 0 rgba(34,197,94,0); }
  50%    { box-shadow:0 0 0 8px rgba(34,197,94,.25); }
}
@keyframes fw-pulse {
  0%,100%{ box-shadow:0 0 0 0 rgba(251,146,60,0); }
  50%    { box-shadow:0 0 0 8px rgba(251,146,60,.25); }
}
@keyframes lb-pulse {
  0%,100%{ box-shadow:0 0 0 0 rgba(59,130,246,0); }
  50%    { box-shadow:0 0 0 8px rgba(59,130,246,.25); }
}
@keyframes cant-reach-in {
  0%   { opacity:0; transform:translateY(6px); }
  100% { opacity:1; transform:translateY(0); }
}
@keyframes captcha-in {
  0%   { opacity:0; transform:scale(.9) translateY(-14px); }
  100% { opacity:1; transform:scale(1)  translateY(0); }
}
`

// ─── Constants ────────────────────────────────────────────────────────────────
const SIM_H = 500

const USER_URLS = [
  'orbyx.store/home',
  'orbyx.store/products',
  'orbyx.store/courses',
  'orbyx.store/about',
  'orbyx.store/contact',
]

const PAGE_RESPONSE_LABELS = {
  'orbyx.store/home':     { ar: 'الصفحة الرئيسية',   en: 'Home Page' },
  'orbyx.store/products': { ar: 'صفحة المنتجات',     en: 'Products Page' },
  'orbyx.store/courses':  { ar: 'صفحة الدورات',      en: 'Courses Page' },
  'orbyx.store/about':    { ar: 'صفحة من نحن',       en: 'About Page' },
  'orbyx.store/contact':  { ar: 'صفحة تواصل معنا',   en: 'Contact Page' },
}
const ATK_URLS = [
  'orbyx.store/home',
  'orbyx.store/api/data',
  'orbyx.store/search',
  'orbyx.store/login',
  'orbyx.store/checkout',
]

// ─── CAPTCHA challenges ───────────────────────────────────────────────────────
const CAPTCHA_CHALLENGES = [
  {
    instruction: { ar: 'حدّد جميع الصور التي تحتوي على سيارات', en: 'Select all images with cars' },
    grid: ['🚗','🌳','🏠','🚕','🐕','🌊','🚙','🍎','✈️'],
    correct: new Set([0, 3, 6]),
  },
  {
    instruction: { ar: 'حدّد جميع الصور التي تحتوي على حيوانات', en: 'Select all images with animals' },
    grid: ['🐱','🏠','🌳','🐶','🚗','🦁','🔑','🐰','🌊'],
    correct: new Set([0, 3, 5, 7]),
  },
  {
    instruction: { ar: 'حدّد جميع الصور التي تحتوي على طعام', en: 'Select all images with food' },
    grid: ['🍕','🌳','🚗','🍔','🐶','🍦','✈️','🏠','🍩'],
    correct: new Set([0, 3, 5, 8]),
  },
]

// ─── Layout (fractional coords) ───────────────────────────────────────────────
const LAYOUT = {
  server:         { fx: 0.84, fy: 0.27 },
  serverA:        { fx: 0.88, fy: 0.17 },
  serverB:        { fx: 0.88, fy: 0.40 },
  lbNode:         { fx: 0.75, fy: 0.28 },
  firewall:       { fx: 0.57, fy: 0.27 },
  ddosShield:     { fx: 0.70, fy: 0.27 },
  users: [
    { id: 'u1', fx: 0.07, fy: 0.09, labelAr: 'مستخدم ١', labelEn: 'User 1' },
    { id: 'u2', fx: 0.07, fy: 0.32, labelAr: 'مستخدم ٢', labelEn: 'User 2' },
    { id: 'u3', fx: 0.07, fy: 0.55, labelAr: 'مستخدم ٣', labelEn: 'User 3' },
  ],
  dosAttacker:    { id: 'atk',  fx: 0.27, fy: 0.82 },
  // DDoS: groups (infected devices) are ABOVE the controller (hacker)
  ddosController: { id: 'ctrl', fx: 0.44, fy: 0.84 },
  ddosGroups: [
    { id: 'eg', fx: 0.14, fy: 0.65, devs: 4 },
    { id: 'ru', fx: 0.44, fy: 0.65, devs: 5 },
    { id: 'sy', fx: 0.74, fy: 0.65, devs: 3 },
  ],
}

// ─── Protection definitions (ddosProtect removed per request) ─────────────────
const PROT_DEF = [
  {
    id: 'rateLimit', icon: '⏱️',
    ar: 'تحديد المعدّل', en: 'Rate Limiting',
    descAr: 'يُجبر المهاجم على الانتظار ثانيتين بين كل نقرة — يُقلّل من سرعة الهجوم',
    descEn: 'Forces attacker to wait 2s between clicks — slows down the attack significantly',
    dosEffAr: 'فعّال جداً', dosEffEn: 'Very Effective', dosEff: 4,
    ddosEffAr: 'محدود',     ddosEffEn: 'Limited',        ddosEff: 1,
    color: 'cyan',
  },
  {
    id: 'blockIP', icon: '🚫',
    ar: 'حظر IP', en: 'Block IP',
    descAr: 'انقر على جهاز المهاجم لحظر عنوان IP الخاص به وإيقافه كلياً',
    descEn: 'Click any attacker node to block its IP address and stop it completely',
    dosEffAr: 'فعّال جداً', dosEffEn: 'Very Effective', dosEff: 4,
    ddosEffAr: 'ضعيف',      ddosEffEn: 'Weak',           ddosEff: 1,
    color: 'red',
  },
  {
    id: 'firewall', icon: '🔥',
    ar: 'جدار ناري', en: 'Firewall',
    descAr: 'جميع الطلبات (مستخدمون ومهاجمون) تمر عبر الجدار — يحجب الأنماط المشبوهة تلقائياً (55٪)',
    descEn: 'All traffic (users & attackers) passes through the firewall — auto-blocks suspicious patterns (55%)',
    dosEffAr: 'متوسط', dosEffEn: 'Moderate', dosEff: 3,
    ddosEffAr: 'متوسط', ddosEffEn: 'Moderate', ddosEff: 3,
    color: 'orange',
  },
  {
    id: 'captcha', icon: '🤖',
    ar: 'CAPTCHA', en: 'CAPTCHA',
    descAr: 'تظهر نافذة CAPTCHA لتحدّي الروبوتات — جرّب حلّها وشاهد كيف تحمي الخادم',
    descEn: 'A CAPTCHA popup challenges bots — try solving it and see how it protects the server',
    dosEffAr: 'فعّال',  dosEffEn: 'Effective', dosEff: 3,
    ddosEffAr: 'متوسط', ddosEffEn: 'Moderate',  ddosEff: 2,
    color: 'purple',
  },
  {
    id: 'loadBalancer', icon: '⚖️',
    ar: 'موازن الأحمال', en: 'Load Balancer',
    descAr: 'يوزع الأحمال بالتساوي بين خادمَين — يُبطّئ الانهيار ويحافظ على توفّر الخدمة',
    descEn: 'Splits load evenly across two servers — delays failure and keeps service available',
    dosEffAr: 'متوسط', dosEffEn: 'Moderate', dosEff: 3,
    ddosEffAr: 'متوسط', ddosEffEn: 'Moderate', ddosEff: 3,
    color: 'blue',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getLoadState = l => l >= 100 ? 'failed' : l >= 75 ? 'overloaded' : l >= 40 ? 'slow' : 'normal'

const LOAD_THEME = {
  normal:     { bar:'bg-emerald-500', ring:'ring-emerald-400', badge:'bg-emerald-100 text-emerald-800 border-emerald-300', ar:'طبيعي',    en:'Normal' },
  slow:       { bar:'bg-amber-400',   ring:'ring-amber-400',   badge:'bg-amber-100 text-amber-800 border-amber-300',       ar:'بطيء',     en:'Slow' },
  overloaded: { bar:'bg-red-500',     ring:'ring-red-400',     badge:'bg-red-100 text-red-800 border-red-300',             ar:'محمّل',    en:'Overloaded' },
  failed:     { bar:'bg-slate-400',   ring:'ring-slate-600',   badge:'bg-slate-200 text-slate-700 border-slate-400',       ar:'معطّل ❌', en:'Down ❌' },
}
const USER_DOT   = { normal:'bg-emerald-400', slow:'bg-amber-400', overloaded:'bg-red-500 animate-pulse', failed:'bg-slate-400' }
const EFF_BAR_CLR= { cyan:'bg-cyan-500', red:'bg-red-500', orange:'bg-orange-500', purple:'bg-purple-500', blue:'bg-blue-500', green:'bg-green-500' }
const PROT_TEXT  = { cyan:'text-cyan-700', red:'text-red-700', orange:'text-orange-700', purple:'text-purple-700', blue:'text-blue-700', green:'text-green-700' }
const PROT_CARD  = { cyan:'bg-cyan-50 border-cyan-300', red:'bg-red-50 border-red-300', orange:'bg-orange-50 border-orange-300', purple:'bg-purple-50 border-purple-300', blue:'bg-blue-50 border-blue-300', green:'bg-green-50 border-green-300' }

// ─── Packet ───────────────────────────────────────────────────────────────────
function Packet({ pkt }) {
  const bg = pkt.color === 'cyan'   ? 'bg-cyan-500 text-white'    :
             pkt.color === 'green'  ? 'bg-emerald-500 text-white' :
             pkt.color === 'orange' ? 'bg-orange-400 text-white'  : 'bg-red-500 text-white'
  return (
    <div
      style={{
        position:'absolute', left:pkt.sx, top:pkt.sy,
        '--tx':`${pkt.tx}px`, '--ty':`${pkt.ty}px`,
        animation:`${pkt.anim} ${pkt.dur}s ease-out forwards`,
        pointerEvents:'none', zIndex:30,
      }}
    >
      {/* Bigger font + padding so URLs are clearly readable */}
      <div className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shadow-md whitespace-nowrap ${bg}`}
           style={{ fontSize:11, letterSpacing:'-0.2px' }}>
        {pkt.label}
      </div>
    </div>
  )
}

// ─── CAPTCHA Modal ────────────────────────────────────────────────────────────
function CaptchaModal({ open, challengeIdx, selected, onSelect, result, onVerify, onClose, ar }) {
  if (!open) return null
  const ch = CAPTCHA_CHALLENGES[challengeIdx] || CAPTCHA_CHALLENGES[0]
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background:'rgba(0,0,0,.65)', backdropFilter:'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl overflow-hidden select-none"
        style={{ width:308, animation:'captcha-in .22s ease-out' }}
        dir="ltr"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3" style={{ background:'#4a90d9' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">🤖</div>
            <div>
              <div className="text-white font-black text-sm tracking-tight">reCAPTCHA</div>
              <div className="text-blue-100 text-[10px]">
                {ar ? 'تحقق أنك لست روبوتاً' : "Verify you're human"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >×</button>
        </div>

        {/* Instruction */}
        <div className="px-4 pt-3 pb-2 bg-gray-50 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700 text-center leading-snug">
            {ar ? ch.instruction.ar : ch.instruction.en}
          </p>
          <p className="text-[10px] text-gray-400 text-center mt-0.5">
            {ar ? 'اضغط على جميع الصور المطابقة ثم اضغط تحقق' : 'Click all matching images then press Verify'}
          </p>
        </div>

        {/* Image grid */}
        <div className="relative p-3">
          <div className="grid grid-cols-3 gap-1.5">
            {ch.grid.map((emoji, i) => (
              <button
                key={i}
                onClick={() => !result && onSelect(i)}
                className={`relative rounded-lg border-2 transition-all flex items-center justify-center
                  ${selected.has(i)
                    ? 'border-blue-500 bg-blue-50 shadow-inner'
                    : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50'
                  }
                  ${result ? 'pointer-events-none opacity-70' : 'cursor-pointer active:scale-95'}`}
                style={{ height:78, fontSize:36 }}
              >
                {emoji}
                {selected.has(i) && (
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[9px] font-black">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Result overlay */}
          {result && (
            <div
              className={`absolute inset-3 rounded-xl flex flex-col items-center justify-center gap-2
                ${result === 'blocked' ? 'bg-red-500/92' : 'bg-amber-500/92'}`}
            >
              <div className="text-5xl">{result === 'blocked' ? '🤖' : '⚠️'}</div>
              <div className="text-white font-black text-sm text-center px-3 leading-snug">
                {result === 'blocked'
                  ? (ar ? 'روبوت مكتشف!\nتم رفض الوصول' : 'Bot Detected!\nAccess Denied')
                  : (ar ? 'نشاط مشبوه!\nتم الحظر للحماية' : 'Suspicious Activity!\nBlocked for safety')}
              </div>
              <div className="text-white/70 text-xs text-center px-4">
                {ar ? 'الطلبات الآلية لا تستطيع خداع CAPTCHA' : 'Automated requests cannot fool CAPTCHA'}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="px-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-400 hover:bg-gray-50 text-xs transition-colors">↻</button>
              <button className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-400 hover:bg-gray-50 text-xs transition-colors">⊞</button>
            </div>
            <button
              onClick={onVerify}
              className="font-bold text-sm px-5 py-2 rounded-lg transition-colors text-white"
              style={{ background:'#4a90d9' }}
              onMouseEnter={e => e.currentTarget.style.background='#3a7bc8'}
              onMouseLeave={e => e.currentTarget.style.background='#4a90d9'}
            >
              {ar ? 'تحقق' : 'Verify'}
            </button>
          </div>
        )}

        {/* Google branding row */}
        <div className="flex items-center justify-center gap-1 pb-2.5 pt-0.5">
          <span className="text-[9px] text-gray-300">Protected by</span>
          <span className="text-[9px] font-bold text-gray-400">reCAPTCHA</span>
          <span className="text-[9px] text-gray-300">·</span>
          <span className="text-[9px] text-gray-400">Privacy · Terms</span>
        </div>
      </div>
    </div>
  )
}

// ─── User Node ────────────────────────────────────────────────────────────────
function UserNode({ user, loadState, frozen, ar }) {
  const dot = USER_DOT[loadState]
  return (
    <>
      <div style={{ position:'absolute', left:`${user.fx*100}%`, top:`${user.fy*100}%`, transform:'translate(-50%,-50%)', zIndex:10 }}>
        <div className="flex flex-col items-center gap-0.5">
          <div className="relative w-11 h-11 bg-white rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-center">
            <Globe className="w-5 h-5 text-slate-400" />
            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${dot}`} />
          </div>
          <span className="text-xs text-slate-400 font-medium">{ar ? user.labelAr : user.labelEn}</span>
        </div>
      </div>
      {/* "Can't reach" bubble when frozen */}
      {frozen && (
        <div style={{
          position:'absolute',
          left:`${(user.fx + 0.07)*100}%`,
          top:`${(user.fy - 0.07)*100}%`,
          transform:'translateY(-100%)',
          zIndex:22,
          animation:'cant-reach-in .3s ease',
        }}>
          <div className="bg-red-900/90 text-red-200 text-[9px] font-bold px-2 py-0.5 rounded-lg border border-red-700 whitespace-nowrap">
            {ar ? '❌ تعذّر الوصول' : "❌ Can't reach"}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Server Node (single) ─────────────────────────────────────────────────────
function ServerNode({ load, shaking, ar }) {
  const state = getLoadState(load)
  const t = LOAD_THEME[state]
  return (
    <div style={{
      position:'absolute', left:`${LAYOUT.server.fx*100}%`, top:`${LAYOUT.server.fy*100}%`,
      transform:'translate(-50%,-50%)',
      animation: shaking ? 'srv-shake .12s ease 4' : 'none',
      zIndex:10,
    }}>
      <div className="flex flex-col items-center gap-1.5">
        <div className={`relative w-16 h-16 bg-white rounded-2xl border-2 border-slate-200 ring-2 ${t.ring} flex items-center justify-center shadow-lg transition-all duration-300`}>
          <Server className={`w-8 h-8 transition-colors duration-500 ${state==='failed'?'text-slate-300':state==='overloaded'?'text-red-500':state==='slow'?'text-amber-500':'text-cyan-600'}`} />
          {state === 'failed' && <div className="absolute inset-0 bg-slate-100/80 rounded-2xl flex items-center justify-center text-2xl">❌</div>}
        </div>
        <div className="w-24 bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div className={`h-2.5 rounded-full transition-all duration-200 ${t.bar}`} style={{ width:`${Math.min(100,load)}%` }} />
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border transition-all duration-300 ${t.badge}`}>
          {Math.round(load)}% · {ar ? t.ar : t.en}
        </span>
        <span className="text-xs font-mono text-slate-400">orbyx.store</span>
      </div>
    </div>
  )
}

// ─── Two Servers (LB mode) ────────────────────────────────────────────────────
function LbServersView({ loadA, loadB, ar }) {
  const mkServer = (load, pos, label) => {
    const state = getLoadState(load)
    const t = LOAD_THEME[state]
    return (
      <div style={{ position:'absolute', left:`${pos.fx*100}%`, top:`${pos.fy*100}%`, transform:'translate(-50%,-50%)', zIndex:10 }}>
        <div className="flex flex-col items-center gap-1">
          <div className={`bg-white rounded-xl border-2 ring-2 ${t.ring} flex items-center justify-center shadow-md`} style={{ width:52, height:52 }}>
            <Server className={`w-6 h-6 ${state==='failed'?'text-slate-300':state==='overloaded'?'text-red-500':state==='slow'?'text-amber-500':'text-cyan-600'}`} />
          </div>
          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className={`h-1.5 rounded-full transition-all duration-200 ${t.bar}`} style={{ width:`${Math.min(100,load)}%` }} />
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${t.badge}`}>{Math.round(load)}%</span>
          <span className="text-[9px] font-mono text-slate-400">{label}</span>
        </div>
      </div>
    )
  }
  return (
    <>
      {mkServer(loadA, LAYOUT.serverA, 'Server-A')}
      {mkServer(loadB, LAYOUT.serverB, 'Server-B')}
    </>
  )
}

// ─── Firewall Node ────────────────────────────────────────────────────────────
function FirewallNode({ ar }) {
  return (
    <div style={{ position:'absolute', left:`${LAYOUT.firewall.fx*100}%`, top:`${LAYOUT.firewall.fy*100}%`, transform:'translate(-50%,-50%)', zIndex:12, animation:'fw-pulse 2s ease-in-out infinite' }}>
      <div className="flex flex-col items-center gap-1">
        <div className="w-10 h-20 bg-orange-100 border-2 border-orange-400 rounded-xl flex flex-col items-center justify-center gap-0.5 shadow-lg">
          <span className="text-base">🔥</span>
          <div className="w-0.5 h-3 bg-orange-400 rounded" />
          <span className="text-base">🔥</span>
        </div>
        <span className="text-[9px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded-lg border border-orange-300 whitespace-nowrap">{ar?'جدار ناري':'Firewall'}</span>
      </div>
    </div>
  )
}

// ─── DDoS Shield Node (kept but never rendered since ddosProtect removed) ─────
function DdosShieldNode({ ar }) {
  return (
    <div style={{ position:'absolute', left:`${LAYOUT.ddosShield.fx*100}%`, top:`${LAYOUT.ddosShield.fy*100}%`, transform:'translate(-50%,-50%)', zIndex:12, animation:'shield-pulse 2s ease-in-out infinite' }}>
      <div className="flex flex-col items-center gap-1">
        <div className="w-12 h-12 bg-emerald-100 border-2 border-emerald-400 rounded-2xl flex items-center justify-center shadow-lg">
          <Shield className="w-6 h-6 text-emerald-600" />
        </div>
        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-lg border border-emerald-300 whitespace-nowrap">{ar?'حماية DDoS':'DDoS Shield'}</span>
      </div>
    </div>
  )
}

// ─── Load Balancer Node ───────────────────────────────────────────────────────
function LoadBalancerNode({ ar }) {
  return (
    <div style={{ position:'absolute', left:`${LAYOUT.lbNode.fx*100}%`, top:`${LAYOUT.lbNode.fy*100}%`, transform:'translate(-50%,-50%)', zIndex:12, animation:'lb-pulse 2s ease-in-out infinite' }}>
      <div className="flex flex-col items-center gap-1">
        <div className="w-11 h-11 bg-blue-100 border-2 border-blue-400 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-xl">⚖️</span>
        </div>
        <span className="text-[9px] font-bold text-blue-700 whitespace-nowrap bg-blue-100 px-1.5 py-0.5 rounded-lg border border-blue-300">{ar?'موازن أحمال':'Load Balancer'}</span>
      </div>
    </div>
  )
}

// ─── DoS Attacker Node ────────────────────────────────────────────────────────
function DosAttackerNode({ blocked, canBlock, rateLimited, onSend, onBlock, ar }) {
  return (
    <div style={{ position:'absolute', left:`${LAYOUT.dosAttacker.fx*100}%`, top:`${LAYOUT.dosAttacker.fy*100}%`, transform:'translate(-50%,-50%)', zIndex:10 }}>
      <div className="flex flex-col items-center gap-1.5">
        <div
          onClick={canBlock && !blocked ? onBlock : undefined}
          className={`relative w-12 h-12 rounded-2xl border-2 flex items-center justify-center shadow transition-all cursor-pointer
            ${blocked?'bg-slate-100 border-slate-300 opacity-60':'bg-red-100 border-red-400 hover:scale-105'}
            ${canBlock&&!blocked?'ring-2 ring-red-300 ring-offset-1':''}`}
          title={canBlock&&!blocked?(ar?'انقر لحظر IP':'Click to block IP'):''}
        >
          <span className="text-xl">💻</span>
          {blocked && <div className="absolute inset-0 bg-slate-900/40 rounded-2xl flex items-center justify-center text-lg">🚫</div>}
          {canBlock && !blocked && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center"><span className="text-white text-xs font-black">!</span></div>}
        </div>
        <span className="text-xs font-bold text-red-400">{ar?'المهاجم':'Attacker'}</span>
        {!blocked
          ? <button onClick={onSend} disabled={rateLimited}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all
                ${rateLimited?'bg-slate-700 text-slate-500 cursor-not-allowed':'bg-red-500 hover:bg-red-600 active:scale-95 text-white shadow-md'}`}>
              {rateLimited?(ar?'⏱ انتظر':'⏱ Wait'):(ar?'📤 إرسال حزمة':'📤 Send Packet')}
            </button>
          : <span className="text-xs font-bold text-slate-500">🚫 {ar?'محظور':'Blocked'}</span>
        }
      </div>
    </div>
  )
}

// ─── DDoS Group Node (renamed "أجهزة مخترقة" / "Infected Devices") ───────────
function DdosGroupNode({ group, blocked, canBlock, onBlock, ar }) {
  return (
    <div style={{ position:'absolute', left:`${group.fx*100}%`, top:`${group.fy*100}%`, transform:'translate(-50%,-50%)', zIndex:10 }}>
      <div className="flex flex-col items-center gap-1">
        <div
          className={`relative rounded-2xl border-2 p-2 transition-all ${blocked?'bg-slate-800 border-slate-600 opacity-50':'bg-red-900/40 border-red-500/60'}`}
          style={{ minWidth:68 }}
        >
          <div className="flex flex-wrap gap-0.5 justify-center mb-1 max-w-[64px]">
            {Array.from({ length: group.devs }).map((_, i) => (
              <span key={i} className="text-sm leading-none">💻</span>
            ))}
          </div>
          <div className="text-center">
            <span className="text-[10px] font-bold text-red-400 leading-tight">
              {ar ? 'أجهزة مخترقة' : 'Infected Devices'}
            </span>
          </div>
          {blocked && <div className="absolute inset-0 bg-slate-900/50 rounded-2xl flex items-center justify-center text-xl">🚫</div>}
          {canBlock && !blocked && (
            <button onClick={onBlock} className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white text-xs font-black">✕</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── DDoS Controller Node (now "المخترق (هكر)" / "Hacker", positioned at bottom) ──
function DdosControllerNode({ rateLimitedCtrl, allGroupsBlocked, onSendAll, ar }) {
  return (
    <div style={{ position:'absolute', left:`${LAYOUT.ddosController.fx*100}%`, top:`${LAYOUT.ddosController.fy*100}%`, transform:'translate(-50%,-50%)', zIndex:11 }}>
      <div className="flex flex-col items-center gap-1.5">
        <div
          className="w-14 h-14 bg-slate-900 border-2 border-red-500 rounded-2xl flex items-center justify-center shadow-xl"
          style={{ boxShadow:'0 0 14px rgba(239,68,68,.35)' }}
        >
          <span className="text-2xl">😈</span>
        </div>
        <div className="text-center">
          <span className="text-xs font-bold text-red-300 whitespace-nowrap">
            {ar ? 'المخترق (هكر)' : 'Hacker'}
          </span>
        </div>
        <button
          onClick={onSendAll}
          disabled={rateLimitedCtrl || allGroupsBlocked}
          className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border
            ${rateLimitedCtrl||allGroupsBlocked
              ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 active:scale-95 text-white border-red-500 shadow-md'}`}
        >
          {rateLimitedCtrl ? '⏱' : (ar ? '🚨 أرسل الجميع' : '🚨 Send All')}
        </button>
      </div>
    </div>
  )
}

// ─── Simulation Canvas ────────────────────────────────────────────────────────
function SimulationCanvas({
  containerRef, mode, serverLoad, loadA, loadB,
  packets, protections, blockedSources, rateLimitedSources,
  serverShaking, frozen, freezeCountdown, firstAttackSent,
  onSendAttack, onBlockSource, onSendAll, ar,
}) {
  const effectiveLoad = protections.loadBalancer ? Math.max(loadA, loadB) : serverLoad
  const loadState = getLoadState(effectiveLoad)

  // Where attack traffic hits first
  const atkTarget = protections.ddosProtect ? LAYOUT.ddosShield
                  : protections.firewall    ? LAYOUT.firewall
                  : protections.loadBalancer? LAYOUT.lbNode
                  : LAYOUT.server

  // Where user traffic hits first
  const userTarget = protections.firewall      ? LAYOUT.firewall
                   : protections.loadBalancer  ? LAYOUT.lbNode
                   : LAYOUT.server

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className="relative rounded-2xl border border-slate-700 overflow-hidden select-none"
      style={{ height:SIM_H, background:'linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)' }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ backgroundImage:'radial-gradient(circle,rgba(148,163,184,.12) 1px,transparent 1px)', backgroundSize:'28px 28px' }} />

      {/* Mode badge */}
      <div className="absolute top-3 left-3 z-20">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border
          ${mode==='dos'?'bg-orange-500/20 text-orange-300 border-orange-500/40':'bg-red-500/20 text-red-300 border-red-500/40'}`}>
          {mode==='dos'?'⚡ DoS':'💥 DDoS'}
        </span>
      </div>
      <div className="absolute top-3 right-3 z-20">
        <span className="text-xs font-mono text-slate-400 bg-slate-800/70 px-2.5 py-1 rounded-full border border-slate-700">orbyx.store</span>
      </div>

      {/* SVG connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex:2 }} aria-hidden>
        {/* User → first hop */}
        {LAYOUT.users.map(u => (
          <line key={u.id}
            x1={`${u.fx*100}%`} y1={`${u.fy*100}%`}
            x2={`${userTarget.fx*100}%`} y2={`${userTarget.fy*100}%`}
            stroke={frozen?'rgba(71,85,105,.2)':'rgba(56,189,248,.18)'}
            strokeWidth="1.5" strokeDasharray="5 4" />
        ))}
        {/* Firewall → LB or server */}
        {protections.firewall && (
          <line
            x1={`${LAYOUT.firewall.fx*100}%`} y1={`${LAYOUT.firewall.fy*100}%`}
            x2={`${(protections.loadBalancer?LAYOUT.lbNode.fx:LAYOUT.server.fx)*100}%`}
            y2={`${(protections.loadBalancer?LAYOUT.lbNode.fy:LAYOUT.server.fy)*100}%`}
            stroke="rgba(251,146,60,.4)" strokeWidth="2" strokeDasharray="4 3" />
        )}
        {/* Shield → server */}
        {protections.ddosProtect && (
          <line
            x1={`${LAYOUT.ddosShield.fx*100}%`} y1={`${LAYOUT.ddosShield.fy*100}%`}
            x2={`${LAYOUT.server.fx*100}%`} y2={`${LAYOUT.server.fy*100}%`}
            stroke="rgba(34,197,94,.4)" strokeWidth="2" strokeDasharray="4 3" />
        )}
        {/* LB → serverA, serverB */}
        {protections.loadBalancer && (
          <>
            <line x1={`${LAYOUT.lbNode.fx*100}%`} y1={`${LAYOUT.lbNode.fy*100}%`}
                  x2={`${LAYOUT.serverA.fx*100}%`} y2={`${LAYOUT.serverA.fy*100}%`}
                  stroke="rgba(59,130,246,.45)" strokeWidth="2" strokeDasharray="4 3" />
            <line x1={`${LAYOUT.lbNode.fx*100}%`} y1={`${LAYOUT.lbNode.fy*100}%`}
                  x2={`${LAYOUT.serverB.fx*100}%`} y2={`${LAYOUT.serverB.fy*100}%`}
                  stroke="rgba(59,130,246,.45)" strokeWidth="2" strokeDasharray="4 3" />
          </>
        )}
        {/* DoS attacker → attack target (red dashed) */}
        {mode === 'dos' && !blockedSources.has('atk') && (
          <line
            x1={`${LAYOUT.dosAttacker.fx*100}%`} y1={`${LAYOUT.dosAttacker.fy*100}%`}
            x2={`${atkTarget.fx*100}%`} y2={`${atkTarget.fy*100}%`}
            stroke="rgba(239,68,68,.35)" strokeWidth="1.5" strokeDasharray="5 4" />
        )}
        {/* DDoS: hacker (controller) → infected device groups (yellow command lines, going UP) */}
        {mode === 'ddos' && LAYOUT.ddosGroups.map(g => (
          <line key={`cmd-${g.id}`}
            x1={`${LAYOUT.ddosController.fx*100}%`} y1={`${LAYOUT.ddosController.fy*100}%`}
            x2={`${g.fx*100}%`} y2={`${g.fy*100}%`}
            stroke="rgba(251,191,36,.5)" strokeWidth="1.5" strokeDasharray="4 3" />
        ))}
        {/* DDoS: groups → attack target (red) */}
        {mode === 'ddos' && LAYOUT.ddosGroups.filter(g => !blockedSources.has(g.id)).map(g => (
          <line key={`atk-${g.id}`}
            x1={`${g.fx*100}%`} y1={`${g.fy*100}%`}
            x2={`${atkTarget.fx*100}%`} y2={`${atkTarget.fy*100}%`}
            stroke="rgba(239,68,68,.30)" strokeWidth="1.5" strokeDasharray="5 4" />
        ))}
      </svg>

      {/* Users */}
      {LAYOUT.users.map(u => <UserNode key={u.id} user={u} loadState={loadState} frozen={frozen} ar={ar} />)}

      {/* Protection nodes */}
      {protections.firewall     && <FirewallNode ar={ar} />}
      {protections.ddosProtect  && <DdosShieldNode ar={ar} />}
      {protections.loadBalancer && <LoadBalancerNode ar={ar} />}

      {/* Server(s) */}
      {protections.loadBalancer
        ? <LbServersView loadA={loadA} loadB={loadB} ar={ar} />
        : <ServerNode load={serverLoad} shaking={serverShaking} ar={ar} />
      }

      {/* DoS attacker */}
      {mode === 'dos' && (
        <DosAttackerNode
          blocked={blockedSources.has('atk')}
          canBlock={protections.blockIP}
          rateLimited={rateLimitedSources.has('atk')}
          onSend={() => onSendAttack('atk')}
          onBlock={() => onBlockSource('atk')}
          ar={ar} />
      )}

      {/* DDoS: hacker controller (bottom) + infected device groups (above) */}
      {mode === 'ddos' && (
        <>
          <DdosControllerNode
            rateLimitedCtrl={rateLimitedSources.has('ctrl')}
            allGroupsBlocked={LAYOUT.ddosGroups.every(g => blockedSources.has(g.id))}
            onSendAll={onSendAll}
            ar={ar} />
          {LAYOUT.ddosGroups.map(g => (
            <DdosGroupNode
              key={g.id} group={g}
              blocked={blockedSources.has(g.id)}
              canBlock={protections.blockIP}
              onSend={() => onSendAttack(g.id)}
              onBlock={() => onBlockSource(g.id)}
              ar={ar} />
          ))}
        </>
      )}

      {/* Packets */}
      {packets.map(p => <Packet key={p.id} pkt={p} />)}

      {/* First-use hint */}
      {!firstAttackSent && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-slate-800/80 text-slate-300 text-xs px-4 py-2 rounded-full border border-slate-600 whitespace-nowrap animate-pulse">
            {ar ? '👆 اضغط لإرسال هجوم وشاهد التأثير' : '👆 Click to send an attack and see the effect'}
          </div>
        </div>
      )}

      {/* Frozen overlay */}
      {frozen && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
             style={{ zIndex:25, background:'rgba(15,23,42,.62)' }}>
          <div className="text-center bg-slate-900/90 border-2 border-red-600 rounded-2xl px-8 py-5 shadow-2xl">
            <div className="text-4xl mb-2">🛑</div>
            <div className="text-white font-black text-lg">{ar ? 'الخادم متجمّد!' : 'Server Frozen!'}</div>
            <div className="text-red-300 text-sm mt-1 font-mono">
              {ar ? `يُستعاد خلال ${freezeCountdown}ث` : `Recovering in ${freezeCountdown}s`}
            </div>
            <div className="text-slate-400 text-xs mt-2">
              {ar ? 'الطلبات لا تُقبل — الخدمة غير متاحة' : 'Requests rejected — service unavailable'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Metrics Panel ────────────────────────────────────────────────────────────
function MetricsPanel({ serverLoad, loadA, loadB, metrics, rps, protections, ar }) {
  const effLoad = protections.loadBalancer ? Math.max(loadA, loadB) : serverLoad
  const t = LOAD_THEME[getLoadState(effLoad)]
  const cards = [
    { icon:'📊', labelAr:'حمل الخادم',     labelEn:'Server Load',  value:`${Math.round(effLoad)}%`, cls:t.badge },
    { icon:'⚡', labelAr:'طلب / ثانية',     labelEn:'Req / sec',    value:rps,                       cls:'bg-orange-100 text-orange-800 border-orange-300' },
    { icon:'✅', labelAr:'مستخدمون خُدموا', labelEn:'Users Served', value:metrics.served,            cls:'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { icon:'🛡️', labelAr:'هجمات حُجبت',    labelEn:'Blocked',      value:metrics.blocked,           cls:'bg-purple-100 text-purple-800 border-purple-300' },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
      {cards.map(c => (
        <div key={c.labelEn} className={`rounded-2xl border p-3 text-center transition-all duration-300 ${c.cls}`}>
          <div className="text-2xl mb-1">{c.icon}</div>
          <div className="text-2xl font-black">{c.value}</div>
          <div className="text-xs font-semibold opacity-75">{ar ? c.labelAr : c.labelEn}</div>
        </div>
      ))}
    </div>
  )
}

// ─── DDoS SVG Diagram (radial) ────────────────────────────────────────────────
function DdosDiagram() {
  const angles = [0, 40, 80, 120, 160, 200, 240, 300]
  const devices = angles.map(deg => {
    const rad = (deg * Math.PI) / 180
    return { x: 120 + 92 * Math.cos(rad), y: 120 + 92 * Math.sin(rad) }
  })
  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[200px] mx-auto my-2">
      {devices.map((d, i) => (
        <line key={i} x1={d.x} y1={d.y} x2={120} y2={120}
              stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.65" />
      ))}
      <circle cx={120} cy={120} r={26} fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
      <text x={120} y={126} textAnchor="middle" fontSize="22">🖥️</text>
      {devices.map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy={d.y} r={17} fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
          <text x={d.x} y={d.y+5} textAnchor="middle" fontSize="15">💻</text>
        </g>
      ))}
      <text x={120} y={158} textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">orbyx.store</text>
    </svg>
  )
}

// ─── Explanation Section ──────────────────────────────────────────────────────
function ExplanationSection({ lang }) {
  const ar = lang === 'ar'
  return (
    <div className="mt-8 space-y-5">
      <h2 className="text-2xl font-black text-slate-800">
        {ar ? '📖 ما هو الفرق بين DoS و DDoS؟' : '📖 What is the Difference?'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DoS */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">⚡</span>
            <div>
              <h3 className="font-black text-orange-900 text-lg">DoS Attack</h3>
              <p className="text-xs text-orange-600 font-medium">{ar?'هجوم حرمان الخدمة':'Denial of Service'}</p>
            </div>
          </div>
          <div className="bg-white/70 rounded-xl p-3 mb-4 flex items-center justify-center gap-3">
            <span className="text-3xl">💻</span>
            <div className="flex gap-0.5">{['→','→','→','→','→'].map((a,i)=><span key={i} className="text-orange-500 font-black text-sm">{a}</span>)}</div>
            <span className="text-3xl">🖥️</span>
          </div>
          <p className="text-sm text-orange-800 italic mb-4 leading-relaxed">
            {ar?'"هجوم يتم من جهاز واحد لإرسال عدد كبير من الطلبات لإيقاف الخدمة"':'"A single device floods the server with massive requests to stop the service"'}
          </p>
          <div className="space-y-2">
            {(ar?[
              {ok:true, t:'سهل الاكتشاف — مصدر واحد'},
              {ok:true, t:'يمكن إيقافه بحظر IP واحد'},
              {ok:false,t:'أقل قوة من DDoS'},
            ]:[
              {ok:true, t:'Easy to detect — single source'},
              {ok:true, t:'Stoppable by blocking one IP'},
              {ok:false,t:'Less powerful than DDoS'},
            ]).map((item,i)=>(
              <div key={i} className="flex items-center gap-2 text-xs text-orange-800">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-[10px] ${item.ok?'bg-emerald-500':'bg-orange-400'}`}>{item.ok?'✓':'!'}</span>
                {item.t}
              </div>
            ))}
          </div>
        </div>
        {/* DDoS */}
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">💥</span>
            <div>
              <h3 className="font-black text-red-900 text-lg">DDoS Attack</h3>
              <p className="text-xs text-red-600 font-medium">{ar?'هجوم حرمان الخدمة الموزّع':'Distributed Denial of Service'}</p>
            </div>
          </div>
          <div className="bg-slate-900 rounded-xl p-2 mb-3">
            <DdosDiagram />
          </div>
          <p className="text-sm text-red-800 italic mb-4 leading-relaxed">
            {ar?'"هجوم يتم من عدة أجهزة في نفس الوقت مما يجعل إيقافه أصعب بكثير"':'"Multiple devices attack simultaneously making it much harder to stop"'}
          </p>
          <div className="space-y-2">
            {(ar?[
              {t:'صعب الاكتشاف — مصادر كثيرة'},
              {t:'حظر IP واحد لا يكفي'},
              {t:'يحتاج حماية متعددة الطبقات'},
            ]:[
              {t:'Hard to detect — many sources'},
              {t:"Blocking one IP isn't enough"},
              {t:'Requires multi-layer protection'},
            ]).map((item,i)=>(
              <div key={i} className="flex items-center gap-2 text-xs text-red-800">
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-[10px] bg-red-500">!</span>
                {item.t}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Key notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon:'💡', title:ar?'الهجمات تؤثر على التوفر':'Attacks Target Availability', desc:ar?'هجمات DoS/DDoS تهدف إلى جعل الخدمة غير متاحة للمستخدمين الشرعيين — حتى بدون سرقة بيانات':'DoS/DDoS aim to make the service unavailable to legitimate users — even without stealing data', cls:'bg-amber-50 border-amber-200 text-amber-800' },
          { icon:'⚡', title:ar?'مصدر واحد vs آلاف الأجهزة':'One Source vs Thousands',      desc:ar?'"جهاز واحد يمكن إيقافه بسهولة، لكن عدة أجهزة تجعل الهجوم أقوى بكثير"':'"One device is easy to stop, but thousands of devices make the attack far stronger"', cls:'bg-blue-50 border-blue-200 text-blue-800' },
          { icon:'🔒', title:ar?'الحماية متعددة الطبقات':'Multi-Layer Protection',           desc:ar?'"الحماية الحقيقية تعتمد على عدة طبقات وليس حل واحد" — جرّب الدمج بين أكثر من تقنية':'"Real protection requires multiple layers, not one solution" — try combining techniques', cls:'bg-emerald-50 border-emerald-200 text-emerald-800' },
        ].map(c=>(
          <div key={c.title} className={`rounded-2xl border-2 p-4 ${c.cls}`}>
            <div className="text-2xl mb-2">{c.icon}</div>
            <h4 className="font-black text-sm mb-1.5">{c.title}</h4>
            <p className="text-xs leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Effectiveness Bar ────────────────────────────────────────────────────────
function EffBar({ level, color }) {
  const filled = EFF_BAR_CLR[color] || 'bg-slate-500'
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <div key={i} className={`h-1.5 w-4 rounded-full ${i<=level?filled:'bg-slate-200'}`} />
      ))}
    </div>
  )
}

// ─── Protection Panel ─────────────────────────────────────────────────────────
function ProtectionPanel({ protections, onToggle, ar }) {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-black text-slate-800 mb-1">🛡️ {ar?'لوحة الحماية':'Defense Panel'}</h2>
      <p className="text-slate-500 text-sm mb-5">{ar?'فعّل تقنيات الحماية وشاهد تأثيرها المباشر في المحاكاة أعلاه':'Enable protection techniques and watch their real-time effect in the simulation above'}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROT_DEF.map(p => {
          const on = protections[p.id]
          return (
            <div key={p.id} className={`rounded-2xl border-2 p-4 transition-all duration-300 ${on?PROT_CARD[p.color]:'bg-white border-slate-200'}`}>
              <div className="flex items-start justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl leading-none">{p.icon}</span>
                  <h3 className="font-black text-sm text-slate-800">{ar?p.ar:p.en}</h3>
                </div>
                <button onClick={()=>onToggle(p.id)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${on?'bg-emerald-500':'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${on?'translate-x-5':''}`} />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">{ar?p.descAr:p.descEn}</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500 flex-shrink-0">DoS</span>
                  <div className="flex items-center gap-1.5">
                    <EffBar level={p.dosEff} color={p.color} />
                    <span className="text-xs text-slate-500 whitespace-nowrap">{ar?p.dosEffAr:p.dosEffEn}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500 flex-shrink-0">DDoS</span>
                  <div className="flex items-center gap-1.5">
                    <EffBar level={p.ddosEff} color={p.color} />
                    <span className="text-xs text-slate-500 whitespace-nowrap">{ar?p.ddosEffAr:p.ddosEffEn}</span>
                  </div>
                </div>
              </div>
              {on && <div className={`mt-3 text-xs font-bold text-center py-1 rounded-lg bg-white/60 ${PROT_TEXT[p.color]}`}>✓ {ar?'مُفعّل':'Active'}</div>}
              {p.id==='blockIP' && on && <p className="text-xs text-slate-500 mt-1 text-center italic">{ar?'← انقر على أيقونة المهاجم':'← Click the attacker icon'}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PageDDoS() {
  const { lang } = useApp()
  const ar = lang === 'ar'

  // ── Simulation state ──────────────────────────────────────────────────────────
  const [mode, setMode]                       = useState('dos')
  const [serverLoad, setServerLoad]           = useState(5)
  const [loadA, setLoadA]                     = useState(5)
  const [loadB, setLoadB]                     = useState(5)
  const [packets, setPackets]                 = useState([])
  const [blockedSources, setBlockedSources]   = useState(new Set())
  const [rateLimited, setRateLimited]         = useState(new Set())
  const [serverShaking, setServerShaking]     = useState(false)
  const [firstAttackSent, setFirstAttackSent] = useState(false)
  const [frozen, setFrozen]                   = useState(false)
  const [freezeCountdown, setFreezeCountdown] = useState(0)
  const [protections, setProtections]         = useState({
    rateLimit:false, blockIP:false, firewall:false,
    captcha:false,   loadBalancer:false, ddosProtect:false,
  })
  const [metrics, setMetrics] = useState({ served:0, blocked:0 })
  const [rps, setRps]         = useState(0)

  // ── CAPTCHA modal state ───────────────────────────────────────────────────────
  const [captchaOpen,     setCaptchaOpen]     = useState(false)
  const [captchaIdx,      setCaptchaIdx]      = useState(0)
  const [captchaSelected, setCaptchaSelected] = useState(new Set())
  const [captchaResult,   setCaptchaResult]   = useState(null)
  const captchaActiveRef  = useRef(false)
  const captchaIdxRef     = useRef(0)
  const captchaSelectedRef= useRef(new Set())

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const containerRef   = useRef(null)
  const arRef          = useRef(ar)
  const protRef        = useRef(protections)
  const blockedRef     = useRef(blockedSources)
  const frozenRef      = useRef(false)
  const srvLoadRef     = useRef(5)
  const loadARef       = useRef(5)
  const loadBRef       = useRef(5)
  const lastClickRef   = useRef({})
  const pktTimestamps  = useRef([])
  const pktCountRef    = useRef(0)
  const shakingRef     = useRef(false)
  const modeRef        = useRef(mode)
  const freezeInterval = useRef(null)

  // Ref that always holds the latest "open captcha" function
  const openCaptchaFnRef = useRef(null)
  openCaptchaFnRef.current = () => {
    if (captchaActiveRef.current) return
    captchaActiveRef.current = true
    const ci = Math.floor(Math.random() * CAPTCHA_CHALLENGES.length)
    captchaIdxRef.current = ci
    captchaSelectedRef.current = new Set()
    setCaptchaIdx(ci)
    setCaptchaSelected(new Set())
    setCaptchaResult(null)
    setCaptchaOpen(true)
  }

  useEffect(() => { arRef.current       = ar },            [ar])
  useEffect(() => { protRef.current    = protections },   [protections])
  useEffect(() => { blockedRef.current = blockedSources }, [blockedSources])
  useEffect(() => { modeRef.current    = mode },           [mode])
  useEffect(() => { srvLoadRef.current = serverLoad },     [serverLoad])
  useEffect(() => { loadARef.current   = loadA },          [loadA])
  useEffect(() => { loadBRef.current   = loadB },          [loadB])

  // ── CSS injection ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById(ANIM_ID)) return
    const s = document.createElement('style')
    s.id = ANIM_ID; s.textContent = ANIM_CSS
    document.head.appendChild(s)
  }, [])

  // ── CAPTCHA callbacks ─────────────────────────────────────────────────────────
  const closeCaptcha = useCallback(() => {
    captchaActiveRef.current = false
    setCaptchaOpen(false)
    setCaptchaResult(null)
    setCaptchaSelected(new Set())
    captchaSelectedRef.current = new Set()
  }, [])

  const onCaptchaSelect = useCallback((i) => {
    setCaptchaSelected(prev => {
      const n = new Set(prev)
      if (n.has(i)) n.delete(i); else n.add(i)
      captchaSelectedRef.current = n
      return n
    })
  }, [])

  const onCaptchaVerify = useCallback(() => {
    const ch   = CAPTCHA_CHALLENGES[captchaIdxRef.current]
    const sel  = captchaSelectedRef.current
    const isCorrect = ch.correct.size === sel.size && [...ch.correct].every(i => sel.has(i))
    // Correct → "suspicious", Wrong → "bot detected" — both blocked in the simulation
    setCaptchaResult(isCorrect ? 'pass' : 'blocked')
    setTimeout(closeCaptcha, 2200)
  }, [closeCaptcha])

  // ── Freeze logic ──────────────────────────────────────────────────────────────
  const triggerFreeze = useCallback(() => {
    if (frozenRef.current) return
    frozenRef.current = true
    setFrozen(true)
    setFreezeCountdown(30)
    let count = 30
    clearInterval(freezeInterval.current)
    freezeInterval.current = setInterval(() => {
      count--
      setFreezeCountdown(count)
      if (count <= 0) {
        clearInterval(freezeInterval.current)
        frozenRef.current = false
        setFrozen(false); setFreezeCountdown(0)
        setServerLoad(60); setLoadA(40); setLoadB(40)
        srvLoadRef.current=60; loadARef.current=40; loadBRef.current=40
      }
    }, 1000)
  }, [])

  // ── Load decay ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      if (frozenRef.current) return
      if (protRef.current.loadBalancer) {
        setLoadA(p => Math.max(0, p - 0.4))
        setLoadB(p => Math.max(0, p - 0.4))
      } else {
        setServerLoad(p => Math.max(0, p - 0.4))
      }
    }, 100)
    return () => clearInterval(iv)
  }, [])

  // ── RPS tracking ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now()
      pktTimestamps.current = pktTimestamps.current.filter(t => now - t < 2000)
      setRps(pktTimestamps.current.filter(t => now - t < 1000).length)
    }, 400)
    return () => clearInterval(iv)
  }, [])

  // ── addPkt ────────────────────────────────────────────────────────────────────
  const addPkt = useCallback((sx, sy, toX, toY, color, label, anim, dur) => {
    const id  = `p${Date.now()}-${Math.random()}`
    const pkt = { id, sx, sy, tx:toX-sx, ty:toY-sy, color, label, anim, dur }
    setPackets(prev => [...prev.slice(-80), pkt])
    // Hung packets stay visible longer to show the queue building up
    const removeDur = anim === 'pkt-hang' ? (dur + 4.5) : (dur + 0.3)
    setTimeout(() => setPackets(prev => prev.filter(p => p.id !== id)), removeDur * 1000)
  }, [])

  // ── applyArrival ──────────────────────────────────────────────────────────────
  const applyArrival = useCallback((isAttack, serverSlot) => {
    const prots = protRef.current
    let inc = isAttack ? 9 : 1.5
    if (isAttack && prots.rateLimit) inc *= 0.65

    if (prots.loadBalancer && serverSlot) {
      if (serverSlot === 'A') {
        const nl = Math.min(100, loadARef.current + inc)
        setLoadA(nl); loadARef.current = nl
        if (nl >= 100) triggerFreeze()
      } else {
        const nl = Math.min(100, loadBRef.current + inc)
        setLoadB(nl); loadBRef.current = nl
        if (nl >= 100) triggerFreeze()
      }
    } else {
      const nl = Math.min(100, srvLoadRef.current + inc)
      setServerLoad(nl); srvLoadRef.current = nl
      if (nl >= 100) triggerFreeze()
    }

    if (!isAttack) setMetrics(m => ({ ...m, served: m.served + 1 }))

    if (isAttack && !shakingRef.current && srvLoadRef.current > 55) {
      shakingRef.current = true
      setServerShaking(true)
      setTimeout(() => { shakingRef.current = false; setServerShaking(false) }, 500)
    }
  }, [triggerFreeze])

  // ── spawnPkt ──────────────────────────────────────────────────────────────────
  const spawnPkt = useCallback(({ fx, fy, isAttack, sourceId }) => {
    const el = containerRef.current
    if (!el) return
    const { width:W, height:H } = el.getBoundingClientRect()
    if (!W) return

    const prots    = protRef.current
    const isFrozen = frozenRef.current

    const url   = isAttack
      ? ATK_URLS[Math.floor(Math.random() * ATK_URLS.length)]
      : USER_URLS[Math.floor(Math.random() * USER_URLS.length)]
    const color = isAttack ? 'red' : 'cyan'

    // Pixel positions for all nodes
    const P = (n) => ({ x: LAYOUT[n].fx * W, y: LAYOUT[n].fy * H })
    const fwPos   = P('firewall')
    const shPos   = P('ddosShield')
    const srvPos  = P('server')
    const lbPos   = P('lbNode')
    const srvAPos = P('serverA')
    const srvBPos = P('serverB')

    const srcX = fx * W
    const srcY = fy * H

    // Block probability (stacked)
    let blockP = 0
    if (isAttack) {
      if (prots.firewall)    blockP = 1 - (1-blockP)*(1-0.55)
      if (prots.captcha)     blockP = 1 - (1-blockP)*(1-0.65)
      if (prots.ddosProtect) blockP = 1 - (1-blockP)*(1-0.90)
    }
    const blocked = isAttack && Math.random() < Math.min(blockP, 0.97)

    // Alternate LB server assignment
    pktCountRef.current++
    const useServerA = pktCountRef.current % 2 === 0
    const finalSrv   = prots.loadBalancer ? (useServerA ? srvAPos : srvBPos) : srvPos
    const slotLabel  = prots.loadBalancer ? (useServerA ? 'A' : 'B') : null

    if (isAttack) pktTimestamps.current.push(Date.now())

    const D = 2.0 + Math.random() * 0.45  // slow enough to read URL text

    // Helper: when server is frozen, packets stop BESIDE the server (queue area),
    // not ON it — offset leftward with vertical spread so packets don't overlap
    const getHangPos = (baseX, baseY) => ({
      x: baseX - 48,
      y: baseY + (Math.random() - 0.5) * 65,
    })

    // Spawn a response packet from the server back to the user (only for user traffic, only when server is up)
    const spawnResponse = (fromPos, delayMs) => {
      if (isAttack) return
      setTimeout(() => {
        if (frozenRef.current) return  // server is down, no response
        const resp = PAGE_RESPONSE_LABELS[url]
        const label = resp ? (arRef.current ? resp.ar : resp.en) : '200 OK'
        addPkt(fromPos.x, fromPos.y, srcX, srcY, 'green', label, 'pkt-fly', D * 1.8)
      }, delayMs)
    }

    // ── Firewall ON: all traffic goes source → firewall → … ──────────────────
    if (prots.firewall) {
      addPkt(srcX, srcY, fwPos.x, fwPos.y, color, url, blocked ? 'pkt-blocked' : 'pkt-fly', D)
      if (blocked) {
        setTimeout(() => setMetrics(m => ({ ...m, blocked:m.blocked+1 })), D*1000)
        return
      }
      const d2 = 0.9 + Math.random() * 0.25
      setTimeout(() => {
        if (prots.loadBalancer) {
          addPkt(fwPos.x, fwPos.y, lbPos.x, lbPos.y, color, url, 'pkt-fly', d2)
          const d3 = 0.65 + Math.random() * 0.2
          setTimeout(() => {
            const isFr = frozenRef.current
            const dest = isFr ? getHangPos(finalSrv.x, finalSrv.y) : finalSrv
            addPkt(lbPos.x, lbPos.y, dest.x, dest.y, color, url, isFr ? 'pkt-hang' : 'pkt-fly', d3)
            if (!isFr) {
              setTimeout(() => applyArrival(isAttack, slotLabel), d3*1000)
              spawnResponse(finalSrv, d3*1000 + 300)
            }
          }, d2*1000)
        } else {
          const isFr = frozenRef.current
          const dest = isFr ? getHangPos(finalSrv.x, finalSrv.y) : finalSrv
          addPkt(fwPos.x, fwPos.y, dest.x, dest.y, color, url, isFr ? 'pkt-hang' : 'pkt-fly', d2)
          if (!isFr) {
            setTimeout(() => applyArrival(isAttack, slotLabel), d2*1000)
            spawnResponse(finalSrv, d2*1000 + 300)
          }
        }
      }, D*1000)
      return
    }

    // ── CAPTCHA only (no firewall): show real CAPTCHA popup ───────────────────
    if (blocked && prots.captcha && !prots.firewall) {
      openCaptchaFnRef.current()
      setMetrics(m => ({ ...m, blocked:m.blocked+1 }))
      return
    }

    // ── DDoS Shield only (no firewall) ────────────────────────────────────────
    if (prots.ddosProtect && !prots.firewall) {
      addPkt(srcX, srcY, shPos.x, shPos.y, color, url, blocked ? 'pkt-blocked' : 'pkt-fly', D)
      if (blocked) {
        setTimeout(() => setMetrics(m => ({ ...m, blocked:m.blocked+1 })), D*1000)
        return
      }
      const d2 = 0.8 + Math.random() * 0.2
      setTimeout(() => {
        const isFr = frozenRef.current
        const dest = isFr ? getHangPos(finalSrv.x, finalSrv.y) : finalSrv
        addPkt(shPos.x, shPos.y, dest.x, dest.y, color, url, isFr ? 'pkt-hang' : 'pkt-fly', d2)
        if (!isFr) {
          setTimeout(() => applyArrival(isAttack, slotLabel), d2*1000)
          spawnResponse(finalSrv, d2*1000 + 300)
        }
      }, D*1000)
      return
    }

    // ── Load Balancer only (no firewall) ──────────────────────────────────────
    if (prots.loadBalancer && !prots.firewall) {
      addPkt(srcX, srcY, lbPos.x, lbPos.y, color, url, 'pkt-fly', D)
      const d2 = 0.7 + Math.random() * 0.2
      setTimeout(() => {
        const isFr = frozenRef.current
        const dest = isFr ? getHangPos(finalSrv.x, finalSrv.y) : finalSrv
        addPkt(lbPos.x, lbPos.y, dest.x, dest.y, color, url, isFr ? 'pkt-hang' : 'pkt-fly', d2)
        if (!isFr) {
          setTimeout(() => applyArrival(isAttack, slotLabel), d2*1000)
          spawnResponse(finalSrv, d2*1000 + 300)
        }
      }, D*1000)
      return
    }

    // ── Direct to server ──────────────────────────────────────────────────────
    const dest = isFrozen ? getHangPos(finalSrv.x, finalSrv.y) : finalSrv
    addPkt(srcX, srcY, dest.x, dest.y, color, url, isFrozen ? 'pkt-hang' : 'pkt-fly', D)
    if (!isFrozen) {
      setTimeout(() => applyArrival(isAttack, slotLabel), D*1000)
      spawnResponse(finalSrv, D*1000 + 300)
    }
  }, [addPkt, applyArrival])

  // ── Auto normal-user packets ──────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      const u = LAYOUT.users[Math.floor(Math.random() * 3)]
      spawnPkt({ fx:u.fx, fy:u.fy, isAttack:false, sourceId:u.id })
    }, 3500)
    return () => clearInterval(iv)
  }, [spawnPkt])

  // ── onSendAttack ──────────────────────────────────────────────────────────────
  const onSendAttack = useCallback((sourceId) => {
    if (blockedRef.current.has(sourceId)) return
    if (protRef.current.rateLimit) {
      const now  = Date.now()
      const last = lastClickRef.current[sourceId] || 0
      if (now - last < 2000) {
        setRateLimited(prev => new Set([...prev, sourceId]))
        setTimeout(() => setRateLimited(prev => { const n=new Set(prev); n.delete(sourceId); return n }), 1800)
        return
      }
      lastClickRef.current[sourceId] = now
    }
    setFirstAttackSent(true)
    let fx, fy
    if (sourceId === 'atk') { fx=LAYOUT.dosAttacker.fx; fy=LAYOUT.dosAttacker.fy }
    else { const g=LAYOUT.ddosGroups.find(x=>x.id===sourceId); if(!g) return; fx=g.fx; fy=g.fy }
    const count = modeRef.current === 'ddos' ? Math.floor(Math.random()*2)+2 : 1
    for (let i=0; i<count; i++) setTimeout(() => spawnPkt({ fx, fy, isAttack:true, sourceId }), i*120)
  }, [spawnPkt])

  // ── onSendAll (DDoS hacker controller) ───────────────────────────────────────
  const onSendAll = useCallback(() => {
    if (protRef.current.rateLimit) {
      const now  = Date.now()
      const last = lastClickRef.current['ctrl'] || 0
      if (now - last < 2000) {
        setRateLimited(prev => new Set([...prev, 'ctrl']))
        setTimeout(() => setRateLimited(prev => { const n=new Set(prev); n.delete('ctrl'); return n }), 1800)
        return
      }
      lastClickRef.current['ctrl'] = now
    }
    setFirstAttackSent(true)
    LAYOUT.ddosGroups.forEach((g, i) => {
      if (blockedRef.current.has(g.id)) return
      setTimeout(() => {
        const count = Math.floor(Math.random()*2)+2
        for (let j=0; j<count; j++) setTimeout(() => spawnPkt({ fx:g.fx, fy:g.fy, isAttack:true, sourceId:g.id }), j*110)
      }, i*180)
    })
  }, [spawnPkt])

  // ── onBlockSource ─────────────────────────────────────────────────────────────
  const onBlockSource = useCallback((id) => setBlockedSources(prev => new Set([...prev, id])), [])

  // ── toggleProtection ──────────────────────────────────────────────────────────
  const toggleProtection = useCallback((id) => setProtections(p => ({ ...p, [id]:!p[id] })), [])

  // ── reset ─────────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    clearInterval(freezeInterval.current)
    frozenRef.current = false
    setFrozen(false); setFreezeCountdown(0)
    setServerLoad(5); setLoadA(5); setLoadB(5)
    srvLoadRef.current=5; loadARef.current=5; loadBRef.current=5
    setPackets([]); setBlockedSources(new Set()); setRateLimited(new Set())
    setMetrics({ served:0, blocked:0 })
    setServerShaking(false); setFirstAttackSent(false)
    lastClickRef.current={}; pktTimestamps.current=[]; pktCountRef.current=0; shakingRef.current=false
    // also close captcha if open
    captchaActiveRef.current = false
    setCaptchaOpen(false); setCaptchaResult(null); setCaptchaSelected(new Set())
  }, [])

  useEffect(() => { reset() }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveLoad  = protections.loadBalancer ? Math.max(loadA, loadB) : serverLoad
  const loadStateName  = getLoadState(effectiveLoad)

  return (
    <div className="page-transition max-w-5xl mx-auto px-4 py-8" dir={ar?'rtl':'ltr'}>

      {/* Header */}
      <div className="mb-5">
        <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
          {ar?'درس أمن سيبراني':'Cybersecurity Lesson'}
        </span>
        <h1 className="text-3xl font-black text-slate-800 mt-2 mb-1">
          {ar?'هجمات DoS و DDoS':'DoS & DDoS Attacks'}
        </h1>
      </div>

      {/* Mode tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={()=>setMode('dos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all
            ${mode==='dos'?'bg-orange-500 text-white shadow-md':'bg-white border-2 border-slate-200 text-slate-600 hover:border-orange-300'}`}>
          ⚡ DoS <span className="font-normal opacity-80">({ar?'مهاجم واحد':'1 attacker'})</span>
        </button>
        <button onClick={()=>setMode('ddos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all
            ${mode==='ddos'?'bg-red-600 text-white shadow-md':'bg-white border-2 border-slate-200 text-slate-600 hover:border-red-300'}`}>
          💥 DDoS <span className="font-normal opacity-80">({ar?'مهاجمون متعددون':'multiple attackers'})</span>
        </button>
        <button onClick={reset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors ms-auto">
          <RotateCcw className="w-3.5 h-3.5" /> {ar?'إعادة':'Reset'}
        </button>
      </div>

      {/* Mode info strip */}
      <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2
        ${mode==='dos'?'bg-orange-50 border border-orange-200 text-orange-800':'bg-red-50 border border-red-200 text-red-800'}`}>
        {mode==='dos'?'⚡':'💥'}
        {mode==='dos'
          ? (ar?'مهاجم واحد يرسل حزماً للخادم — اضغط "إرسال حزمة" عدة مرات وشاهد الأثر':'One attacker sends packets — click "Send Packet" repeatedly to see the effect')
          : (ar?'أجهزة مخترقة يتحكم بها هكر — انقر "أرسل الجميع" لإرسال هجوم متزامن من الجميع':'Infected devices controlled by a hacker — click "Send All" for a simultaneous attack')
        }
      </div>

      {/* Simulation canvas */}
      <SimulationCanvas
        containerRef={containerRef} mode={mode}
        serverLoad={serverLoad} loadA={loadA} loadB={loadB}
        packets={packets} protections={protections}
        blockedSources={blockedSources} rateLimitedSources={rateLimited}
        serverShaking={serverShaking} frozen={frozen} freezeCountdown={freezeCountdown}
        firstAttackSent={firstAttackSent}
        onSendAttack={onSendAttack} onBlockSource={onBlockSource} onSendAll={onSendAll}
        ar={ar}
      />

      {/* Metrics */}
      <MetricsPanel
        serverLoad={serverLoad} loadA={loadA} loadB={loadB}
        metrics={metrics} rps={rps} protections={protections} ar={ar} />

      {/* Status strip */}
      {(() => {
        if (frozen) return (
          <div className="mt-3 px-4 py-2.5 rounded-xl border font-medium text-sm bg-slate-100 border-slate-400 text-slate-700 animate-pulse">
            ⚫ {ar
              ? `الخادم متجمّد — الخدمة معطّلة لمدة ${freezeCountdown} ثانية أخرى`
              : `Server frozen — service unavailable for ${freezeCountdown} more seconds`}
          </div>
        )
        const msgs = {
          slow:       { ar:'🟡 الخادم يستجيب ببطء — المستخدمون يلاحظون التأخير', en:'🟡 Server responding slowly — users notice the delay',          cls:'bg-amber-50 border-amber-300 text-amber-800' },
          overloaded: { ar:'🔴 الخادم محمّل — بعض المستخدمين لا يصلون',           en:'🔴 Server overloaded — some users cannot access the site',       cls:'bg-red-50 border-red-300 text-red-800' },
        }
        const m = msgs[loadStateName]
        if (!m) return null
        return <div className={`mt-3 px-4 py-2.5 rounded-xl border font-medium text-sm ${m.cls}`}>{ar?m.ar:m.en}</div>
      })()}

      {/* Protection panel */}
      <ProtectionPanel protections={protections} onToggle={toggleProtection} ar={ar} />

      {/* explanation — collapsed by default, sits under the practical part */}
      <Explanation>
        <p className="text-slate-500 text-sm" style={{ marginBottom: 12 }}>
          {ar?'شاهد كيف تؤثر هجمات حرمان الخدمة على الخوادم، وجرّب تقنيات الحماية المختلفة':'See how denial-of-service attacks affect servers, and test different protection techniques'}
        </p>
        <ExplanationSection lang={lang} />
      </Explanation>

      {/* CAPTCHA modal (portaled to document body via fixed positioning) */}
      <CaptchaModal
        open={captchaOpen}
        challengeIdx={captchaIdx}
        selected={captchaSelected}
        onSelect={onCaptchaSelect}
        result={captchaResult}
        onVerify={onCaptchaVerify}
        onClose={closeCaptcha}
        ar={ar}
      />
    </div>
  )
}
