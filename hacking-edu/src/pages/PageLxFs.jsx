import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'
import LinuxTerminal from '../components/LinuxTerminal'
import { baseFs, pathStr } from '../lib/linuxLab'

const FHS = [
  ['/',      'الجذر — قمة الشجرة، كل شيء يبدأ منه', 'root — the top of the tree; everything lives under it'],
  ['/etc',   'ملفات الإعدادات (passwd، hosts، hostname)', 'configuration files (passwd, hosts, hostname)'],
  ['/home',  'مجلدات المستخدمين — /home/user هو منزلك (~)', 'user home folders — /home/user is your home (~)'],
  ['/root',  'منزل المستخدم الجذر (root)', 'the root user’s home'],
  ['/usr',   'برامج وبيانات النظام — بداخله share/wordlists', 'programs & shared data — contains share/wordlists'],
  ['/var',   'بيانات متغيّرة: السجلات (log) وموقع الويب (www)', 'variable data: logs and the web root (www)'],
  ['/tmp',   'ملفات مؤقتة تُحذف عند إعادة التشغيل', 'temporary files, cleared on reboot'],
  ['/usr/share/wordlists', 'قوائم الكلمات لأدوات مثل gobuster و hydra', 'wordlists for tools like gobuster & hydra'],
]

const TASKS = [
  { id:'etc',  ar:'انتقل إلى الإعدادات: cd /etc',        en:'Go to config: cd /etc' },
  { id:'pass', ar:'اقرأ المستخدمين: cat /etc/passwd',    en:'Read users: cat /etc/passwd' },
  { id:'wl',   ar:'اذهب لقوائم الكلمات: cd /usr/share/wordlists', en:'Go to wordlists: cd /usr/share/wordlists' },
  { id:'ls',   ar:'اعرض ما بداخلها: ls',                en:'List them: ls' },
  { id:'home', ar:'ارجع للمنزل: cd ~',                  en:'Return home: cd ~' },
]

function Tree({ node, name, prefix, path, cur, depth }) {
  const isDir = node.type === 'dir'
  const here = path === cur
  const onPath = cur === path || cur.startsWith(path === '/' ? '/' : path + '/')
  return (
    <div>
      <div style={{ fontFamily:'monospace', fontSize:11.5, padding:'1px 4px', borderRadius:4,
        background: here ? '#fcad0f' : 'transparent', color: here ? '#0e1f39' : onPath ? '#a5f3fc' : isDir ? '#93c5fd' : '#94a3b8', fontWeight: here || onPath ? 700 : 400 }}>
        {prefix}{isDir ? '📁' : '📄'} {name}{isDir && name !== '/' ? '/' : ''}{here ? '  ← ' + (path) : ''}
      </div>
      {isDir && depth < 4 && Object.keys(node.children).filter(k => !k.startsWith('.')).sort().map((k, i, arr) => (
        <Tree key={k} node={node.children[k]} name={k} prefix={prefix + '  '} path={(path === '/' ? '' : path) + '/' + k} cur={cur} depth={depth + 1} />
      ))}
    </div>
  )
}

export default function PageLxFs() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'
  const fsRef = useRef(baseFs())
  const [cur, setCur] = useState('/home/user')
  const [visited, setVisited] = useState(new Set(['/home/user']))
  const [lastCat, setLastCat] = useState(new Set())
  const [, bump] = useState(0)

  const onCwd = segs => { const p = pathStr(segs); setCur(p); setVisited(v => new Set(v).add(p)) }
  const onCommand = (cmd, argv) => {
    if (cmd === 'cat') setLastCat(s => { const n = new Set(s); argv.slice(1).forEach(a => n.add(a)); return n })
    bump(x => x + 1)  // refresh tree after mkdir/touch/rm/nano
  }

  const done = {
    etc:  visited.has('/etc'),
    pass: [...lastCat].some(a => a.includes('passwd')),
    wl:   visited.has('/usr/share/wordlists'),
    ls:   visited.has('/usr/share/wordlists'),
    home: cur === '/home/user' && visited.size > 1,
  }
  const count = TASKS.filter(t => done[t.id]).length

  return (
    <div style={{ maxWidth:1120, margin:'0 auto', padding:'20px 14px', fontFamily:'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>🐧 {isAr ? 'مسار لينكس' : 'Linux Track'}</span>
        <button onClick={() => navigate('/linux')} style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:7, padding:'3px 10px', fontSize:12, color:'#64748b', cursor:'pointer' }}>{isAr ? '← مسار لينكس' : '← Linux Track'}</button>
      </div>
      <h1 style={{ fontSize:23, fontWeight:900, color:'#1e293b', margin:'0 0 16px' }}>🗂️ {isAr ? 'نظام الملفات — تسلسل مجلدات لينكس' : 'The File System — Linux Hierarchy (FHS)'}</h1>

      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,300px) 1fr minmax(0,240px)', gap:14, alignItems:'start' }}>
        {/* live tree */}
        <div style={{ background:'#0b1020', borderRadius:12, padding:'12px 10px', maxHeight:480, overflow:'auto' }} dir="ltr">
          <div style={{ fontSize:10, color:'#64748b', fontWeight:700, marginBottom:6, fontFamily:'monospace' }}>FILESYSTEM TREE</div>
          <Tree node={fsRef.current} name="/" prefix="" path="/" cur={cur} depth={0} />
        </div>

        {/* terminal */}
        <div>
          <div style={{ background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:9, padding:'7px 12px', marginBottom:8, fontSize:12, color:'#4338ca', fontFamily:'monospace' }} dir="ltr">📍 {isAr ? 'أنت هنا:' : 'You are here:'} {cur}</div>
          <LinuxTerminal isAr={isAr} height={360} fsRef={fsRef} onCwd={onCwd} onCommand={onCommand}
            welcome={[{ k:'info', v: isAr ? '# جرّب: cd /etc  ثم  ls  ثم  cat /etc/passwd' : '# Try: cd /etc  then  ls  then  cat /etc/passwd' }]} />
        </div>

        {/* tasks */}
        <div style={{ background:'white', border:'2px solid #e2e8f0', borderRadius:12, padding:14, position:'sticky', top:70 }}>
          <div style={{ fontSize:12, fontWeight:800, color:'#1e293b', marginBottom:4 }}>✅ {isAr ? 'المهام' : 'Tasks'}</div>
          <div style={{ fontSize:11, color:'#94a3b8', marginBottom:10 }}>{count} / {TASKS.length}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {TASKS.map(t => {
              const ok = done[t.id]
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11.5, color: ok ? '#15803d' : '#475569' }}>
                  <span style={{ width:18, height:18, borderRadius:5, border:`2px solid ${ok ? '#22c55e' : '#cbd5e1'}`, background: ok ? '#22c55e' : 'white', color:'white', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{ok ? '✓' : ''}</span>
                  <span style={{ textDecoration: ok ? 'line-through' : 'none' }}>{isAr ? t.ar : t.en}</span>
                </div>
              )
            })}
          </div>
          {count === TASKS.length && (
            <button onClick={() => navigate('/lx-gobuster')} style={{ marginTop:12, width:'100%', background:'#0e1f39', color:'white', border:'none', borderRadius:8, padding:'8px 14px', fontSize:12, fontWeight:700, cursor:'pointer' }}>{isAr ? 'التالي: Gobuster →' : 'Next: Gobuster →'}</button>
          )}
        </div>
      </div>

      <Explanation>
        <p style={{ fontSize:13, color:'#475569', margin:'0 0 14px', maxWidth:820, lineHeight:1.7 }}>
          {isAr ? 'كل شيء في لينكس شجرة تبدأ من الجذر /. تنقّل بين المجلدات بأوامر حقيقية وشاهد موقعك يتحرّك في الشجرة على اليسار.' : 'Everything in Linux is a tree starting at the root /. Navigate with real commands and watch your position move in the tree.'}
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:8 }}>
          {FHS.map(([p, a, e]) => (
            <div key={p} style={{ background:'white', border:'2px solid #e2e8f0', borderRadius:10, padding:'8px 11px' }}>
              <code style={{ fontFamily:'monospace', fontSize:12, fontWeight:800, color:'#0e7490' }}>{p}</code>
              <div style={{ fontSize:11, color:'#64748b', lineHeight:1.5, marginTop:2 }}>{isAr ? a : e}</div>
            </div>
          ))}
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
