import { useState, useRef, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { Shield, CheckCircle, AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react'
import Explanation from '../components/Explanation'

// ─── Password pool (wrong guesses) ────────────────────────────────────────────
const WRONG_PASSWORDS = [
  'password','123456','admin','letmein','qwerty','password123','admin123',
  '111111','abc123','dragon','master','monkey','test123','login','welcome',
  'sunshine','superman','batman','football','iloveyou','princess','starwars',
  '12345678','pass1234','secure1','pass@123','admin@123','user123','changeme',
  'access','shadow','hunter2','trustno1','baseball','mustang','blahblah',
  'r3d@ct3d','p@ssw0rd','c0mpl3x!','Str0ng#1','xK9mP2qL','nT4sWv8z',
  'bQ7yRj3m','hG5kDp1x','zA2kLm9n','pQ8rSt5u','vW3xYz6a','bC7dEf0g',
  'hI1jKl4m','nO5pQr8s','tU9vWx2y','zA3bCd6e','fG7hIj0k','lM1nOp4q',
  'rS5tUv8w','cD3eF6g','hI7jK0l','mN1oP4r','sT5uV8w','xY9zA2bC',
  'dEf3gHi6','jKl0mNp1','qR4sTu7v','wX8yZa2b','cDe5fGh8','iJk9lMn2',
  'oPq3rSt6','uVw7xYz0','aB1cDe4f','gH5iJk8l','mN9oP2q','rS3tUv6w',
  'xY7zA0bC','dE1fGh4i','jK5lMn8o','pQ9rSt2u','vW3xYz6b','cD7eF0gH',
  'iJ1kLm4n','oP5qRs8t','uV9wXy2z','aB3cDe6f','gH7iJk0l','mN1oP4q',
  'Doha2024!','Qatar123','gulf@pass','q8rXp2mN','doha_net','pearl_qtr',
  'q@tar2023','AL_thani9','msheireb1','lusail_77','aspire_q8','Qatarnet1',
  'w0rngpass','b4dgu3ss1','n0match99','tryagain2','wrongkey3','badlogin4',
  'cristiano','ronaldo7','CR7_2024','c_ronaldo','realmadrid',
]

const PLATFORMS = {
  instagram: { name: 'Instagram', nameAr: 'إنستغرام', icon: '📷', gradient: 'bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-500', light: 'bg-gradient-to-br from-pink-50 to-purple-50', border: 'border-pink-200', text: 'text-pink-600' },
  tiktok:    { name: 'TikTok',    nameAr: 'تيك توك',  icon: '🎵', gradient: 'bg-gradient-to-br from-slate-800 to-slate-950',                  light: 'bg-slate-50',                               border: 'border-slate-200', text: 'text-slate-700' },
  snapchat:  { name: 'Snapchat',  nameAr: 'سناب شات', icon: '👻', gradient: 'bg-gradient-to-br from-yellow-400 to-yellow-500',                 light: 'bg-yellow-50',                              border: 'border-yellow-200', text: 'text-yellow-700' },
  roblox:    { name: 'Roblox',    nameAr: 'روبلوكس',  icon: '🎮', gradient: 'bg-gradient-to-br from-red-600 to-red-800',                       light: 'bg-red-50',                                 border: 'border-red-200',    text: 'text-red-700' },
  minecraft: { name: 'Minecraft', nameAr: 'ماينكرافت',icon: '⛏️', gradient: 'bg-gradient-to-br from-green-600 to-emerald-800',                 light: 'bg-green-50',                               border: 'border-green-200',  text: 'text-green-700' },
  twitter:   { name: 'Twitter/X', nameAr: 'تويتر',    icon: '🐦', gradient: 'bg-gradient-to-br from-sky-400 to-blue-600',                      light: 'bg-sky-50',                                 border: 'border-sky-200',    text: 'text-sky-600' },
  facebook:  { name: 'Facebook',  nameAr: 'فيسبوك',   icon: '👍', gradient: 'bg-gradient-to-br from-blue-600 to-blue-800',                     light: 'bg-blue-50',                                border: 'border-blue-200',   text: 'text-blue-700' },
  discord:   { name: 'Discord',   nameAr: 'ديسكورد',  icon: '💬', gradient: 'bg-gradient-to-br from-indigo-500 to-violet-700',                  light: 'bg-indigo-50',                              border: 'border-indigo-200', text: 'text-indigo-700' },
  youtube:   { name: 'YouTube',   nameAr: 'يوتيوب',   icon: '▶️', gradient: 'bg-gradient-to-br from-red-500 to-red-700',                       light: 'bg-red-50',                                 border: 'border-red-100',    text: 'text-red-600' },
  gmail:          { name: 'Gmail',      nameAr: 'جيميل',      icon: '📧', gradient: 'bg-gradient-to-br from-red-500 to-orange-400',                    light: 'bg-orange-50',                              border: 'border-orange-200', text: 'text-orange-700' },
  'snapzi':  { name: 'snapzi',nameAr: 'سنابزي',      icon: '📸', gradient: 'bg-gradient-to-br from-amber-600 to-yellow-700',                   light: 'bg-amber-50',                               border: 'border-amber-200',  text: 'text-amber-700' },
}

// ─── FS helpers ────────────────────────────────────────────────────────────────
function getNode(fs, pathArr) {
  let node = { type: 'dir', children: fs }
  for (const seg of pathArr) {
    if (!node.children || !(seg in node.children)) return null
    node = node.children[seg]
  }
  return node
}
function setNode(fs, pathArr, name, node) {
  if (pathArr.length === 0) return { ...fs, [name]: node }
  const [h, ...rest] = pathArr
  if (!fs[h] || fs[h].type !== 'dir') return fs
  return { ...fs, [h]: { ...fs[h], children: setNode(fs[h].children || {}, rest, name, node) } }
}
function removeNode(fs, pathArr, name) {
  if (pathArr.length === 0) { const n = { ...fs }; delete n[name]; return n }
  const [h, ...rest] = pathArr
  if (!fs[h] || fs[h].type !== 'dir') return fs
  return { ...fs, [h]: { ...fs[h], children: removeNode(fs[h].children || {}, rest, name) } }
}

const INITIAL_FS = {
  'passwords.txt': { type: 'file', content: `قائمة كلمات المرور الشائعة — تعليمية
=====================================
password    |  123456    |  admin
letmein     |  qwerty    |  password123
admin123    |  111111    |  abc123
dragon      |  master    |  monkey
test123     |  login     |  welcome
sunshine    |  superman  |  batman
cristiano   |  ronaldo7  |  CR7_2024
... (100 كلمة مرور إجمالاً)

استخدم: barq admin passwords.txt instagram
استخدم: barq falsaadi passwords.txt snapzi` },
  'common.txt': { type: 'file', content: `كلمات مرور شائعة أخرى — تعليمية
==================================
football  |  iloveyou |  princess
starwars  |  pass1234 |  secure1
pass@123  |  access   |  shadow
hunter2   |  trustno1 |  baseball
mustang   |  Doha2024!|  Qatar123
...

استخدم: barq sara common.txt tiktok` },
  'guide.txt': { type: 'file', content: `دليل أداة برق — Barq Tool Guide
=================================
الأمر: barq <مستخدم> <ملف> <منصة>

أمثلة:
  barq admin passwords.txt instagram
  barq sara  common.txt     tiktok
  barq ahmed passwords.txt  roblox

المنصات المتاحة (11):
  instagram | tiktok    | snapchat | roblox
  minecraft | twitter   | facebook | discord
  youtube   | gmail     | snapzi

ملاحظة: كلمة المرور تتغير حسب اسم المستخدم
جرّب نفس المنصة بأسماء مختلفة!
مثال: barq falsaadi passwords.txt snapzi` },
  'tools': {
    type: 'dir', children: {
      'barq_guide.txt': { type: 'file', content: `كيف يعمل هجوم القوة الغاشمة؟
================================
1. المهاجم يحصل على قائمة كلمات مرور شائعة
2. يجرب كل كلمة مرور بالتسلسل على النظام
3. إذا كانت كلمة المرور في القائمة → اختُرق الحساب!
4. كلمات المرور القصيرة (أقل من 8 أحرف) تُكسر في ثوانٍ

الحماية:
  ✅ استخدم كلمة مرور طويلة وفريدة (+12 حرف)
  ✅ أضف رموزاً وأرقاماً وحروفاً كبيرة
  ✅ استخدم مدير كلمات المرور
  ✅ فعّل المصادقة الثنائية (2FA)` },
    }
  },
}

// ─── Password derivation ───────────────────────────────────────────────────────
function deriveBarqPassword(username, platform) {
  const base = (username || 'user').split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toLowerCase() || 'user'
  const cap = base.charAt(0).toUpperCase() + base.slice(1)
  const pools = {
    instagram: [base+'2024', cap+'123',    base+'_ig',   'ig_'+base,   base+'!'],
    tiktok:    [base+'_tok', 'tok'+base,   cap+'2024',   base+'321',   base+'@tok'],
    snapchat:  [base+'_snap','snap'+cap,   base+'2023',  's_'+base,    cap+'000'],
    roblox:    ['rblx_'+base,base+'_rblx', cap+'99',     base+'2024',  'r'+base+'1'],
    minecraft: [base+'_mc', 'mc'+cap,      base+'1234',  cap+'Mine',   'mine_'+base],
    twitter:   [base+'_tw', 'tw_'+base,    cap+'2024',   base+'@tw',   base+'123'],
    facebook:  ['fb_'+base, base+'_fb',    cap+'321',    'f'+base,     base+'2024'],
    discord:   [base+'_dc', 'dc'+cap,      base+'#001',  base+'2024',  'd_'+base],
    youtube:   [base+'_yt', 'yt_'+base,    cap+'tube',   base+'2024',  base+'_yt'],
    gmail:          [base+'@gml','g_'+base,     cap+'2024',   base+'!g',    base+'_gml'],
    'snapzi':  ['sn@p2024',  'cristiano',  'snap123',    'sn4p!',      'snap@2'],
  }
  const list = pools[platform] || [base+'123', cap+'2024', base+'!']
  const hash = [...(username || 'user')].reduce((a, c) => a + c.charCodeAt(0), 0)
  return list[hash % list.length]
}

function generatePasswordList(username, platform) {
  const correct = deriveBarqPassword(username, platform)
  const pool = WRONG_PASSWORDS.filter(p => p !== correct).slice(0, 92)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const insertAt = Math.floor(Math.random() * 40) + 30
  pool.splice(insertAt, 0, correct)
  return pool.slice(0, 100)
}

// ─── Nano Editor ───────────────────────────────────────────────────────────────
function NanoEditor({ filename, content, onSave, onExit }) {
  const [text, setText] = useState(content)
  const [saved, setSaved] = useState(false)
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus() }, [])
  const save = () => { onSave(text); setSaved(true); setTimeout(() => setSaved(false), 1500) }
  const onKey = e => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); save() }
    if (e.ctrlKey && (e.key === 'x' || e.key === 'o')) { e.preventDefault(); onExit(text) }
  }
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 font-mono">
      <div className="bg-slate-700 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-6">
        <span className="text-slate-400">GNU nano 6.4</span>
        <span className="font-bold">File: {filename}</span>
        {saved && <span className="text-green-400 font-bold">[ Saved ]</span>}
      </div>
      <textarea ref={ref} value={text}
        onChange={e => { setText(e.target.value); setSaved(false) }}
        onKeyDown={onKey}
        className="flex-1 bg-slate-900 text-green-300 p-4 resize-none outline-none text-sm font-mono leading-relaxed"
        spellCheck={false} />
      <div className="bg-slate-800 border-t border-slate-700 text-slate-300 text-xs px-3 py-1.5 flex gap-5">
        <span><span className="text-white font-bold">^X</span> Exit</span>
        <span><span className="text-white font-bold">^S</span> Save</span>
        <span><span className="text-white font-bold">^O</span> Write Out</span>
      </div>
    </div>
  )
}

// ─── Terminal line renderer ───────────────────────────────────────────────────
function BarqLine({ line }) {
  if (line.type === 'cmd')     return <div className="flex gap-1.5" dir="ltr"><span className="text-green-400 text-xs select-none">{line.prompt}</span><span className="text-white text-xs">{line.text}</span></div>
  if (line.type === 'header')  return <div className="text-yellow-400 text-xs font-bold" dir="ltr">{line.text}</div>
  if (line.type === 'info')    return <div className="text-blue-400 text-xs" dir="ltr">{line.text}</div>
  if (line.type === 'fail')    return <div className="text-slate-500 text-xs font-mono" dir="ltr">{line.text}</div>
  if (line.type === 'success') return <div className="text-green-400 text-xs font-bold" dir="ltr">{line.text}</div>
  if (line.type === 'error')   return <div className="text-red-400 text-xs" dir="ltr">{line.text}</div>
  if (line.type === 'output')  return <div className="text-slate-300 text-xs pl-2" dir="ltr">{line.text}</div>
  if (line.type === 'sep')     return <div className="text-slate-700 text-xs" dir="ltr">{'─'.repeat(52)}</div>
  if (line.type === 'cat')     return <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed pl-2" dir="ltr">{line.text}</pre>
  if (line.type === 'ls') {
    return (
      <div className="flex flex-wrap gap-x-5 gap-y-0.5 pl-2" dir="ltr">
        {line.items.map((item, i) => (
          <span key={i} className={`text-xs font-mono ${item.isDir ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>
            {item.name}{item.isDir ? '/' : ''}
          </span>
        ))}
      </div>
    )
  }
  if (line.type === 'help') return (
    <div className="pl-2 space-y-0.5" dir="ltr">
      <div className="text-blue-400 text-xs font-bold mb-1">الأوامر المتاحة / Available commands:</div>
      {[
        ['barq <user> <file> <platform>', 'برق — instagram|tiktok|snapchat|roblox|minecraft|twitter|facebook|discord|youtube|gmail|snapzi'],
        ['platforms',                     'عرض المنصات المتاحة'],
        ['display',                       'عرض الملفات والمجلدات في موقعك الحالي'],
        ['enter <dir>',                   'الانتقال إلى مجلد — مثال: enter tools'],
        ['enter parent',                  'الرجوع للمجلد الأعلى'],
        ['enter Desktop',                 'الرجوع إلى Desktop (نقطة البداية)'],
        ['location',                      'عرض موقعك الحالي الكامل'],
        ['tree',                          'عرض هيكل الملفات والمجلدات شجرياً'],
        ['create <name>',                 'إنشاء — بدون امتداد: مجلد، مع امتداد (.txt): ملف'],
        ['show <file> / cat <file>',      'عرض محتوى ملف نصي'],
        ['open <file> / nano <file>',     'فتح ملف في المحرر — Ctrl+S للحفظ، Ctrl+X للخروج'],
        ['rm <file>',                     'حذف ملف'],
        ['delete <name>',                 'حذف ملف أو مجلد'],
        ['echo <text>',                   'طباعة نص على الشاشة'],
        ['help',                          'عرض هذه المساعدة'],
        ['clear',                         'مسح الشاشة'],
      ].map(([c, d]) => (
        <div key={c} className="text-xs flex gap-2">
          <span className="text-green-400 font-mono shrink-0 w-44">{c}</span>
          <span className="text-slate-400">{d}</span>
        </div>
      ))}
    </div>
  )
  return <div className="text-xs text-slate-300 pl-2" dir="ltr">{line.text || ''}</div>
}

// ─── Login panel (automated attack view + manual login form) ──────────────────
function LoginPanel({ platform, username, currentAttempt, attemptIdx, total, cracked, isCracking, isAr }) {
  const [showPass, setShowPass] = useState(false)
  const [selPlat, setSelPlat]   = useState(platform || 'instagram')
  const [mUser, setMUser]       = useState('')
  const [mPass, setMPass]       = useState('')
  const [result, setResult]     = useState(null)   // null | 'ok' | 'fail'
  const [tries, setTries]       = useState(0)

  // follow the terminal attack when it picks a platform / username
  useEffect(() => { if (platform) { setSelPlat(platform); setResult(null) } }, [platform])
  useEffect(() => { if (username) setMUser(username) }, [username])

  const p = PLATFORMS[selPlat] || PLATFORMS.instagram
  const attacking  = isCracking && platform === selPlat
  const autoCracked = cracked && platform === selPlat
  const locked = attacking

  const submit = () => {
    const u = mUser.trim()
    if (!u || !mPass) return
    const correct = deriveBarqPassword(u, selPlat)
    if (mPass === correct) setResult('ok')
    else { setResult('fail'); setTries(t => t + 1) }
  }

  const uVal = attacking ? (username || '') : mUser
  const pVal = attacking ? (currentAttempt || '') : mPass
  const passOk = autoCracked || result === 'ok'

  return (
    <div className={`h-full flex flex-col ${p.light} rounded-xl overflow-hidden border ${p.border}`}>
      <div className={`${p.gradient} p-4 flex items-center gap-3`}>
        <span className="text-3xl">{p.icon}</span>
        <div className="min-w-0">
          <div className="text-white font-black text-lg leading-tight">{isAr ? p.nameAr : p.name}</div>
          <select value={selPlat} onChange={e => { setSelPlat(e.target.value); setResult(null) }} disabled={locked}
            className="mt-1 bg-white/20 text-white text-xs rounded px-1.5 py-0.5 outline-none border border-white/30 disabled:opacity-60 cursor-pointer" dir="ltr">
            {Object.entries(PLATFORMS).map(([k, v]) => <option key={k} value={k} className="text-slate-800">{v.name}</option>)}
          </select>
        </div>
        {passOk && <div className="ms-auto bg-white/20 rounded-full px-3 py-1 text-white text-xs font-bold flex items-center gap-1 self-start"><CheckCircle className="w-3.5 h-3.5" />{isAr ? 'دخول!' : 'In!'}</div>}
      </div>
      <div className="flex-1 p-5 flex flex-col justify-center gap-3 overflow-y-auto">
        {/* username */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">{isAr ? 'اسم المستخدم' : 'Username'}</label>
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono flex items-center gap-2">
            <span className="text-slate-400 text-xs">@</span>
            <input value={uVal} disabled={locked}
              onChange={e => { setMUser(e.target.value); setResult(null) }}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              placeholder={isAr ? 'اسم المستخدم' : 'username'} dir="ltr" spellCheck={false} autoCapitalize="off" autoComplete="off"
              className="flex-1 min-w-0 bg-transparent outline-none border-none text-slate-700 disabled:text-slate-400" />
          </div>
        </div>
        {/* password */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">{isAr ? 'كلمة المرور' : 'Password'}</label>
          <div className={`bg-white rounded-xl border-2 px-4 py-2.5 text-sm font-mono flex items-center gap-2 transition-all ${passOk ? 'border-emerald-400 bg-emerald-50' : result === 'fail' ? 'border-red-300' : attacking ? 'border-amber-300' : 'border-slate-200'}`}>
            <input type={showPass ? 'text' : 'password'} value={pVal} disabled={locked}
              onChange={e => { setMPass(e.target.value); setResult(null) }}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              placeholder={isAr ? 'كلمة المرور' : 'password'} dir="ltr" spellCheck={false} autoCapitalize="off" autoComplete="off"
              className={`flex-1 min-w-0 bg-transparent outline-none border-none disabled:text-slate-400 ${passOk ? 'text-emerald-700 font-bold' : 'text-slate-700'}`} />
            <button onClick={() => setShowPass(s => !s)} className="text-slate-400 hover:text-slate-600 shrink-0">
              {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            {attacking && <span className="w-2 h-4 bg-amber-400 animate-pulse rounded-sm shrink-0" />}
          </div>
        </div>
        {attacking && attemptIdx > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{isAr ? `محاولة ${attemptIdx} من ${total}` : `Attempt ${attemptIdx} of ${total}`}</span>
              <span>{Math.round((attemptIdx / total) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div className="h-1.5 rounded-full transition-all duration-100 bg-amber-400" style={{ width: `${(attemptIdx / total) * 100}%` }} />
            </div>
          </div>
        )}
        {passOk ? (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="font-black text-emerald-700 text-sm mb-1">{autoCracked ? (isAr ? 'تم اختراق الحساب!' : 'Account Cracked!') : (isAr ? 'تم تسجيل الدخول!' : 'Logged in!')}</div>
            <div className="text-xs text-emerald-600 font-mono" dir="ltr">{(autoCracked ? username : mUser)} : {(autoCracked ? currentAttempt : mPass)}</div>
          </div>
        ) : attacking ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-amber-700 text-xs font-medium">{isAr ? 'الأداة تجرّب كلمات المرور...' : 'The tool is trying passwords...'}</span>
          </div>
        ) : (
          <>
            {result === 'fail' && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <span className="text-base">⛔</span>
                <span className="text-red-700 text-xs font-medium">{isAr ? `كلمة مرور خاطئة (${tries} محاولة)` : `Wrong password (${tries} tries)`}</span>
              </div>
            )}
            <button onClick={submit} className={`${p.gradient} text-white font-bold text-sm rounded-xl py-2.5 hover:brightness-110 transition-all`}>
              {isAr ? 'تسجيل الدخول' : 'Sign in'}
            </button>
            <p className="text-slate-500 text-[11px] text-center leading-relaxed">
              {isAr ? '💡 جرّب اسم مستخدم وكلمة مرور يدوياً، أو شغّل أداة barq في الطرفية لتجربة آلاف الكلمات تلقائياً.' : '💡 Try a username & password manually, or run the barq tool in the terminal to try thousands automatically.'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PageBarq() {
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [lines, setLines] = useState([
    { type: 'info',   text: '[*] اكتب help لعرض الأوامر — أو: barq admin passwords.txt instagram' },
    { type: 'sep' },
  ])
  const [input, setInput]           = useState('')
  const [history, setHistory]       = useState([])
  const [histIdx, setHistIdx]       = useState(-1)
  const [isCracking, setIsCracking] = useState(false)
  const [loginState, setLoginState] = useState({ platform: null, username: null, currentAttempt: '', attemptIdx: 0, total: 100, cracked: false })

  const [fs, setFs]         = useState(INITIAL_FS)
  const [cwd, setCwd]       = useState([])
  const [nanoOpen, setNanoOpen]     = useState(false)
  const [nanoFile, setNanoFile]     = useState(null)
  const [nanoContent, setNanoContent] = useState('')

  const termRef    = useRef(null)
  const inputRef   = useRef(null)
  const wasAtBottomRef = useRef(true)

  const currentPath = cwd.length === 0 ? 'Desktop' : 'Desktop/' + cwd.join('/')
  const prompt = `student@barq:${currentPath}$ `

  const checkBottom = useCallback(() => {
    const el = termRef.current
    if (!el) return
    wasAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 30
  }, [])

  useEffect(() => {
    if (wasAtBottomRef.current && termRef.current)
      termRef.current.scrollTop = termRef.current.scrollHeight
  }, [lines])

  function addLines(newLines) { setLines(prev => [...prev, ...newLines]) }

  const handleNanoSave = (text) => {
    setFs(prev => setNode(prev, nanoFile.path.slice(0, -1), nanoFile.name, { type: 'file', content: text }))
    setNanoContent(text)
  }
  const handleNanoExit = (text) => {
    if (text !== nanoContent)
      setFs(prev => setNode(prev, nanoFile.path.slice(0, -1), nanoFile.name, { type: 'file', content: text }))
    setNanoOpen(false)
    addLines([{ type: 'info', text: `nano: تم إغلاق الملف: ${nanoFile.name}` }])
    inputRef.current?.focus({ preventScroll: true })
  }

  function runCommand(raw) {
    const cmd = raw.trim()
    if (!cmd) return
    addLines([{ type: 'cmd', prompt, text: cmd }])
    setHistory(h => [cmd, ...h.slice(0, 49)])
    setHistIdx(-1)

    const parts   = cmd.split(/\s+/)
    let command   = parts[0].toLowerCase()
    // real Linux command aliases → existing pedagogical commands
    const ALIAS = { ls: 'display', cd: 'enter', pwd: 'location' }
    if (ALIAS[command]) command = ALIAS[command]
    const args    = parts.slice(1)

    const curNode  = getNode(fs, cwd)
    const children = curNode?.children || {}

    if (command === 'clear') { setLines([]); return }
    if (command === 'help')  { addLines([{ type: 'help' }]); return }

    if (command === 'location') {
      addLines([{ type: 'output', text: currentPath }])
      return
    }

    if (command === 'display') {
      const entries = Object.entries(children)
      if (!entries.length) { addLines([{ type: 'output', text: '(المجلد فارغ)' }]); return }
      const items = [
        ...entries.filter(([, n]) => n.type === 'dir').map(([name]) => ({ name, isDir: true })),
        ...entries.filter(([, n]) => n.type === 'file').map(([name]) => ({ name, isDir: false })),
      ]
      addLines([{ type: 'ls', items }])
      return
    }

    if (command === 'enter') {
      if (!args[0] || args[0] === '~' || args[0] === 'Desktop' || args[0] === '/') {
        setCwd([])
        addLines([{ type: 'output', text: '📁 Desktop' }])
        return
      }
      if (args[0] === 'parent' || args[0] === '..') {
        if (!cwd.length) { addLines([{ type: 'error', text: 'enter: أنت بالفعل في Desktop' }]); return }
        const next = cwd.slice(0, -1)
        setCwd(next)
        addLines([{ type: 'output', text: '📁 ' + (next.length === 0 ? 'Desktop' : 'Desktop/' + next.join('/')) }])
        return
      }
      const target = children[args[0]]
      if (!target) { addLines([{ type: 'error', text: `enter: ${args[0]}: لا يوجد مجلد بهذا الاسم` }]); return }
      if (target.type !== 'dir') { addLines([{ type: 'error', text: `enter: ${args[0]}: ليس مجلداً` }]); return }
      setCwd([...cwd, args[0]])
      addLines([{ type: 'output', text: '📁 Desktop/' + [...cwd, args[0]].join('/') }])
      return
    }

    if (command === 'create') {
      if (!args[0]) { addLines([{ type: 'error', text: 'create: يجب تحديد اسم — بدون امتداد: مجلد، مع امتداد: ملف' }]); return }
      const name = args[0]
      if (children[name]) { addLines([{ type: 'error', text: `create: ${name}: موجود مسبقاً` }]); return }
      if (name.includes('.')) {
        setFs(f => setNode(f, cwd, name, { type: 'file', content: '' }))
        addLines([{ type: 'output', text: `✅ تم إنشاء الملف: ${name}` }])
      } else {
        setFs(f => setNode(f, cwd, name, { type: 'dir', children: {} }))
        addLines([{ type: 'output', text: `✅ تم إنشاء المجلد: ${name}/` }])
      }
      return
    }

    if (command === 'mkdir') {
      if (!args[0]) { addLines([{ type: 'error', text: 'mkdir: يجب تحديد اسم المجلد' }]); return }
      const name = args[0]
      if (children[name]) { addLines([{ type: 'error', text: `mkdir: ${name}: موجود مسبقاً` }]); return }
      setFs(f => setNode(f, cwd, name, { type: 'dir', children: {} }))
      addLines([{ type: 'output', text: `✅ تم إنشاء المجلد: ${name}/` }])
      return
    }

    if (command === 'touch') {
      if (!args[0]) { addLines([{ type: 'error', text: 'touch: يجب تحديد اسم الملف' }]); return }
      const name = args[0]
      if (children[name]) { addLines([{ type: 'error', text: `touch: ${name}: موجود مسبقاً` }]); return }
      setFs(f => setNode(f, cwd, name, { type: 'file', content: '' }))
      addLines([{ type: 'output', text: `✅ تم إنشاء الملف: ${name}` }])
      return
    }

    if (command === 'show' || command === 'cat') {
      if (!args[0]) { addLines([{ type: 'error', text: `${command}: يجب تحديد اسم الملف` }]); return }
      const node = children[args[0]]
      if (!node) { addLines([{ type: 'error', text: `${command}: ${args[0]}: لا يوجد` }]); return }
      if (node.type === 'dir') { addLines([{ type: 'error', text: `${command}: ${args[0]}: هذا مجلد` }]); return }
      addLines([{ type: 'cat', text: node.content || '(ملف فارغ)' }])
      return
    }

    if (command === 'open' || command === 'nano') {
      if (!args[0]) { addLines([{ type: 'error', text: `${command}: يجب تحديد اسم الملف` }]); return }
      const node = children[args[0]]
      if (node?.type === 'dir') { addLines([{ type: 'error', text: `${command}: ${args[0]}: هذا مجلد` }]); return }
      setNanoFile({ name: args[0], path: [...cwd, args[0]] })
      setNanoContent(node?.content ?? '')
      setNanoOpen(true)
      return
    }

    if (command === 'rm') {
      const flags     = args.filter(a => a.startsWith('-'))
      const recursive = flags.some(f => f.includes('r'))
      const targets   = args.filter(a => !a.startsWith('-'))
      const name      = targets[0]
      if (!name) { addLines([{ type: 'error', text: 'rm: يجب تحديد اسم الملف' }]); return }
      if (!children[name]) { addLines([{ type: 'error', text: `rm: ${name}: لا يوجد` }]); return }
      if (children[name].type === 'dir' && !recursive) {
        addLines([{ type: 'error', text: `rm: ${name}: هذا مجلد — استخدم rm -r` }]); return
      }
      setFs(f => removeNode(f, cwd, name))
      addLines([{ type: 'output', text: `🗑️ تم حذف: ${name}` }])
      return
    }

    if (command === 'delete') {
      if (!args[0]) { addLines([{ type: 'error', text: 'delete: يجب تحديد الاسم' }]); return }
      if (!children[args[0]]) { addLines([{ type: 'error', text: `delete: ${args[0]}: لا يوجد` }]); return }
      setFs(f => removeNode(f, cwd, args[0]))
      addLines([{ type: 'output', text: `🗑️ تم الحذف: ${args[0]}` }])
      return
    }

    if (command === 'platforms') {
      addLines([
        { type: 'info', text: 'المنصات المتاحة / Available platforms:' },
        { type: 'info', text: '  instagram  —  إنستغرام 📷' },
        { type: 'info', text: '  tiktok     —  تيك توك 🎵' },
        { type: 'info', text: '  snapchat   —  سناب شات 👻' },
        { type: 'info', text: '  roblox     —  روبلوكس 🎮' },
        { type: 'info', text: '  minecraft  —  ماينكرافت ⛏️' },
        { type: 'info', text: '  twitter    —  تويتر 🐦' },
        { type: 'info', text: '  facebook   —  فيسبوك 👍' },
        { type: 'info', text: '  discord    —  ديسكورد 💬' },
        { type: 'info', text: '  youtube     —  يوتيوب ▶️' },
        { type: 'info', text: '  gmail       —  جيميل 📧' },
        { type: 'info', text: '  snapzi —  سنابزي 📸' },
      ])
      return
    }

    if (command === 'barq') {
      if (isCracking) { addLines([{ type: 'error', text: '[!] جاري تشغيل هجوم بالفعل، انتظر...' }]); return }
      const [, user, file, platform] = parts
      if (!user || !file || !platform) {
        addLines([
          { type: 'error', text: '[!] الاستخدام: barq <username> <passwordfile> <platform>' },
          { type: 'info',  text: '    مثال: barq admin passwords.txt instagram' },
        ])
        return
      }
      if (!Object.keys(PLATFORMS).includes(platform.toLowerCase())) {
        addLines([{ type: 'error', text: `[!] منصة غير معروفة: ${platform}. اكتب: platforms` }])
        return
      }
      if (!file.endsWith('.txt')) {
        addLines([{ type: 'error', text: `[!] يجب أن ينتهي اسم الملف بـ .txt — مثال: passwords.txt` }])
        return
      }
      runBarq(user, file, platform.toLowerCase())
      return
    }

    if (command === 'echo') {
      const rest = cmd.slice(4).trim()
      const gt = rest.indexOf('>')
      if (gt !== -1) {
        const text = rest.slice(0, gt).trim().replace(/^["']|["']$/g, '')
        const file = rest.slice(gt + 1).trim()
        setFs(f => setNode(f, cwd, file, { type: 'file', content: text }))
        addLines([{ type: 'output', text: `كُتب في: ${file}` }])
      } else {
        addLines([{ type: 'output', text: rest.replace(/^["']|["']$/g, '') }])
      }
      return
    }

    if (command === 'tree') {
      const renderTree = (node, prefix = '') => {
        const entries = Object.entries(node?.children || {})
        entries.forEach(([name, child], idx) => {
          const isLast = idx === entries.length - 1
          const label  = child.type === 'dir' ? name + '/' : name
          addLines([{ type: child.type === 'dir' ? 'info' : 'output', text: prefix + (isLast ? '└── ' : '├── ') + label }])
          if (child.type === 'dir') renderTree(child, prefix + (isLast ? '    ' : '│   '))
        })
      }
      addLines([{ type: 'success', text: currentPath }])
      renderTree(getNode(fs, cwd))
      return
    }

    addLines([{ type: 'error', text: `[!] أمر غير معروف: ${command}. اكتب help` }])
  }

  function runBarq(user, file, platform) {
    setIsCracking(true)
    const passwords = generatePasswordList(user, platform)
    const correct = deriveBarqPassword(user, platform)
    setLoginState({ platform, username: user, currentAttempt: '', attemptIdx: 0, total: passwords.length, cracked: false })
    addLines([
      { type: 'sep' },
      { type: 'header', text: `[*] برق — هجوم القوة الغاشمة التعليمي` },
      { type: 'info',   text: `[*] المنصة  : ${PLATFORMS[platform].name}` },
      { type: 'info',   text: `[*] المستخدم: ${user}` },
      { type: 'info',   text: `[*] الملف   : ${file} (${passwords.length} كلمة مرور)` },
      { type: 'info',   text: `[*] بدء الهجوم...` },
      { type: 'sep' },
    ])
    let i = 0
    function tryNext() {
      if (i >= passwords.length) {
        addLines([{ type: 'error', text: '[!] استنفدت كل كلمات المرور بدون نجاح.' }])
        setIsCracking(false)
        return
      }
      const pw = passwords[i++]
      if (pw === correct) {
        addLines([
          { type: 'success', text: `[+] SUCCESS! --> ${user}:${pw}` },
          { type: 'sep' },
          { type: 'success', text: `[+] تم اختراق الحساب بنجاح!` },
          { type: 'success', text: `[+] اسم المستخدم: ${user}` },
          { type: 'success', text: `[+] كلمة المرور : ${pw}` },
          { type: 'sep' },
          { type: 'info', text: '[!] تذكير: هذه محاكاة تعليمية فقط.' },
          { type: 'info', text: '[!] استخدام كلمات مرور قوية يمنع هذا النوع من الهجمات.' },
        ])
        setLoginState(s => ({ ...s, currentAttempt: pw, attemptIdx: i, cracked: true }))
        setIsCracking(false)
      } else {
        addLines([{ type: 'fail', text: `[-] محاولة ${i.toString().padStart(3, ' ')}: ${pw.padEnd(20)} ... FAIL` }])
        setLoginState(s => ({ ...s, currentAttempt: pw, attemptIdx: i }))
        setTimeout(tryNext, 200)
      }
    }
    setTimeout(tryNext, 500)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      const val = input; setInput(''); runCommand(val)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(idx); setInput(history[idx] || '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histIdx > 0) { const idx = histIdx - 1; setHistIdx(idx); setInput(history[idx] || '') }
      else { setHistIdx(-1); setInput('') }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50" dir={isAr ? 'rtl' : 'ltr'}>
      {nanoOpen && (
        <NanoEditor filename={nanoFile.name} content={nanoContent} onSave={handleNanoSave} onExit={handleNanoExit} />
      )}

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg">{isAr ? 'أداة برق' : 'Barq Tool'}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Two-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 h-[calc(100vh-260px)] min-h-[500px]">

          {/* Terminal panel */}
          <div className="rounded-2xl overflow-hidden border border-slate-700 flex flex-col" onClick={() => inputRef.current?.focus()}>
            <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-slate-400 text-xs font-mono ms-2">barq — {currentPath}</span>
              </div>
              {isCracking && (
                <div className="flex items-center gap-1.5 text-xs text-red-400">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  {isAr ? 'جاري الهجوم...' : 'Attacking...'}
                </div>
              )}
            </div>
            <div ref={termRef} onScroll={checkBottom}
              className="bg-slate-950 flex-1 overflow-y-auto p-4 space-y-0.5 cursor-text" dir="ltr">
              {lines.map((line, i) => <BarqLine key={i} line={line} />)}
              <div className="flex items-center gap-1 mt-1">
                <span className="text-green-400 text-xs select-none">{prompt}</span>
                <input ref={inputRef} value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isCracking}
                  className="flex-1 bg-transparent text-white text-xs outline-none border-none font-mono caret-white"
                  autoComplete="off" spellCheck={false} autoCapitalize="off"
                  placeholder={isCracking ? '' : (isAr ? 'اكتب أمراً...' : 'type a command...')}
                />
              </div>
            </div>
          </div>

          {/* Login panel */}
          <div className="rounded-2xl overflow-hidden border border-slate-700 bg-white">
            <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-2 shrink-0">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 text-xs font-mono">{isAr ? 'لوحة تسجيل الدخول (محاكاة)' : 'Login Panel (simulation)'}</span>
            </div>
            <div className="h-[calc(100%-36px)]">
              <LoginPanel
                platform={loginState.platform}
                username={loginState.username}
                currentAttempt={loginState.currentAttempt}
                attemptIdx={loginState.attemptIdx}
                total={loginState.total}
                cracked={loginState.cracked}
                isCracking={isCracking}
                isAr={isAr}
              />
            </div>
          </div>
        </div>

        {/* Quick commands */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-slate-500 text-xs self-center">{isAr ? 'جرب:' : 'Try:'}</span>
          {[
            ['barq ahmed passwords.txt instagram', 'Instagram'],
            ['barq ahmed passwords.txt tiktok',    'TikTok'],
            ['barq ahmed passwords.txt roblox',    'Roblox'],
            ['barq sara common.txt snapchat',      'Snapchat'],
            ['barq sara common.txt discord',       'Discord'],
            ['barq admin passwords.txt gmail',     'Gmail'],
            ['display',   'display'],
            ['platforms', 'Platforms'],
            ['help',      'Help'],
          ].map(([cmd, label]) => (
            <button key={label} disabled={isCracking}
              onClick={() => { setInput(cmd); inputRef.current?.focus() }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700 transition-colors disabled:opacity-40">
              {cmd}
            </button>
          ))}
        </div>

        {/* Explanation — collapsed by default, sits under the practical part */}
        <div className="mt-4">
          <Explanation>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-amber-800 text-xs leading-relaxed">
                {isAr
                  ? 'هجوم القوة الغاشمة (Brute Force) هو محاولة تخمين كلمة المرور بتجربة آلاف الاحتمالات. كلمات المرور القصيرة أو الشائعة تُكسر في ثوانٍ. الحل: استخدم كلمات مرور طويلة وفريدة ومدير كلمات المرور.'
                  : 'Brute force attacks try thousands of password guesses. Short or common passwords are cracked in seconds. Solution: use long, unique passwords and a password manager.'}
              </div>
            </div>
          </Explanation>
        </div>
      </div>
    </div>
  )
}
