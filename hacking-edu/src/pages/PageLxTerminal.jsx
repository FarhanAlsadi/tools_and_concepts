import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import LinuxTerminal from '../components/LinuxTerminal'
import Explanation from '../components/Explanation'

const TASKS = [
  { id:'pwd',   ar:'اعرف مكانك: pwd',            en:'Find where you are: pwd',        ck:(c) => c === 'pwd' },
  { id:'ls',    ar:'اعرض محتويات المجلد: ls',     en:'List the folder: ls',           ck:(c) => c === 'ls' },
  { id:'cat',   ar:'اقرأ ملفاً: cat readme.txt',  en:'Read a file: cat readme.txt',   ck:(c, a) => c === 'cat' && a.some(x => x.includes('readme')) },
  { id:'cd',    ar:'ادخل مجلداً: cd Documents',   en:'Enter a folder: cd Documents',  ck:(c, a) => c === 'cd' && a[1] && !['..', '~', '-', '/'].includes(a[1]) },
  { id:'mkdir', ar:'أنشئ مجلداً: mkdir loot',     en:'Make a folder: mkdir loot',     ck:(c) => c === 'mkdir' },
  { id:'touch', ar:'أنشئ ملفاً: touch report.txt', en:'Make a file: touch report.txt', ck:(c) => c === 'touch' },
  { id:'nano',  ar:'حرّر واحفظ ملفاً بـ nano',     en:'Edit & save a file with nano',  ck:(c) => c === 'nano:save' },
  { id:'up',    ar:'ارجع للخلف: cd ..',           en:'Go back up: cd ..',             ck:(c, a) => c === 'cd' && a[1] === '..' },
  { id:'tree',  ar:'اعرض الشجرة: tree',           en:'Show the tree: tree',           ck:(c) => c === 'tree' },
]

const CHEATS = [
  ['pwd', 'اطبع المجلد الحالي', 'print current directory'],
  ['ls -la', 'اعرض كل الملفات (حتى المخفية)', 'list all files (incl. hidden)'],
  ['cd <dir>', 'ادخل مجلداً (.. للأعلى، ~ للمنزل)', 'change directory (.. up, ~ home)'],
  ['mkdir <n>', 'أنشئ مجلداً', 'make a directory'],
  ['touch <f>', 'أنشئ ملفاً فارغاً', 'create an empty file'],
  ['cat <f>', 'اعرض محتوى ملف', 'show a file'],
  ['nano <f>', 'حرّر ملفاً (^S حفظ، ^X خروج)', 'edit a file (^S save, ^X exit)'],
  ['rm <f>', 'احذف ملفاً (rm -r لمجلد)', 'remove a file (rm -r for a folder)'],
  ['tree', 'اعرض الشجرة الكاملة', 'show the full tree'],
]

export default function PageLxTerminal() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'
  const [done, setDone] = useState(new Set())

  const onCommand = (cmd, argv) => setDone(prev => {
    const n = new Set(prev)
    TASKS.forEach(t => { if (!n.has(t.id) && t.ck(cmd, argv)) n.add(t.id) })
    return n
  })

  return (
    <div style={{ maxWidth:1120, margin:'0 auto', padding:'20px 14px', fontFamily:'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <span style={{ background:'#f0fdf4', color:'#15803d', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>🐧 {isAr ? 'مسار لينكس' : 'Linux Track'}</span>
        <button onClick={() => navigate('/linux')} style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:7, padding:'3px 10px', fontSize:12, color:'#64748b', cursor:'pointer' }}>{isAr ? '← مسار لينكس' : '← Linux Track'}</button>
      </div>
      <h1 style={{ fontSize:23, fontWeight:900, color:'#1e293b', margin:'0 0 16px' }}>⌨️ {isAr ? 'الطرفية — أوامر لينكس الحقيقية' : 'The Terminal — Real Linux Commands'}</h1>

      <div style={{ display:'grid', gridTemplateColumns:'1fr minmax(0,300px)', gap:16, alignItems:'start' }}>
        {/* terminal */}
        <div>
          <LinuxTerminal isAr={isAr} height={320} onCommand={onCommand}
            welcome={[
              { k:'info', v: isAr ? '# مرحباً بك في طرفية لينكس. اكتب: ls  ثم  help' : '# Welcome to the Linux terminal. Try: ls  then  help' },
            ]} />
        </div>

        {/* tasks */}
        <div style={{ background:'white', border:'2px solid #e2e8f0', borderRadius:12, padding:14, position:'sticky', top:70 }}>
          <div style={{ fontSize:12, fontWeight:800, color:'#1e293b', marginBottom:4 }}>✅ {isAr ? 'المهام' : 'Practice Tasks'}</div>
          <div style={{ fontSize:11, color:'#94a3b8', marginBottom:10 }}>{done.size} / {TASKS.length}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {TASKS.map(t => {
              const ok = done.has(t.id)
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color: ok ? '#15803d' : '#475569' }}>
                  <span style={{ width:18, height:18, borderRadius:5, border:`2px solid ${ok ? '#22c55e' : '#cbd5e1'}`, background: ok ? '#22c55e' : 'white', color:'white', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{ok ? '✓' : ''}</span>
                  <span style={{ textDecoration: ok ? 'line-through' : 'none' }}>{isAr ? t.ar : t.en}</span>
                </div>
              )
            })}
          </div>
          {done.size === TASKS.length && (
            <div style={{ marginTop:12, background:'#f0fdf4', border:'2px solid #86efac', borderRadius:10, padding:'10px 12px', fontSize:12, color:'#15803d', fontWeight:700 }}>
              🎉 {isAr ? 'أتقنت الطرفية! انتقل إلى نظام الملفات.' : 'Terminal mastered! Move on to the File System.'}
              <button onClick={() => navigate('/lx-fs')} style={{ display:'block', marginTop:8, background:'#0e1f39', color:'white', border:'none', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:700, cursor:'pointer' }}>{isAr ? 'نظام الملفات →' : 'File System →'}</button>
            </div>
          )}
        </div>
      </div>

      {/* explanation — collapsed by default, sits under the practical part */}
      <Explanation>
        <p style={{ fontSize:13, color:'#64748b', margin:'0 0 14px', maxWidth:820, lineHeight:1.7 }}>
          {isAr ? 'هذه طرفية لينكس حقيقية. جرّب الأوامر الحقيقية بنفسك وأكمِل المهام. اكتب help لرؤية كل الأوامر.' : 'This is a real Linux terminal. Try the real commands and complete the tasks. Type help to see everything.'}
        </p>
        {/* cheatsheet */}
        <div style={{ background:'white', border:'2px solid #e2e8f0', borderRadius:12, padding:12 }}>
          <div style={{ fontSize:12, fontWeight:800, color:'#1e293b', marginBottom:8 }}>📋 {isAr ? 'الأوامر' : 'Command cheatsheet'}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:6 }}>
            {CHEATS.map(([c, a, e]) => (
              <div key={c} style={{ display:'flex', alignItems:'baseline', gap:8, fontSize:11 }}>
                <code style={{ background:'#0b1020', color:'#a5f3fc', borderRadius:5, padding:'1px 7px', fontFamily:'monospace', whiteSpace:'nowrap' }}>{c}</code>
                <span style={{ color:'#64748b' }}>{isAr ? a : e}</span>
              </div>
            ))}
          </div>
        </div>
      </Explanation>

      <div style={{ display:'flex', justifyContent:'center', marginTop:20 }}>
        <button onClick={() => navigate('/linux')} style={{ display:'flex', alignItems:'center', gap:6, color:'#1d4ed8', background:'#eff6ff', border:'2px solid #bfdbfe', borderRadius:10, padding:'10px 28px', cursor:'pointer', fontSize:14, fontWeight:700 }}>
          <ChevronLeft size={15} />{isAr ? 'مسار لينكس' : 'Linux Track'}
        </button>
      </div>
    </div>
  )
}
