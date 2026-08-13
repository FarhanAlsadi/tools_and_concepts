import { useState } from 'react'

/* A simulated browser: an editable address bar + a page area. The parent
   supplies renderPage(path, nav) which returns the JSX for a path (or null
   for a 404). Students can edit the URL to visit discovered pages.          */

export default function SimBrowser({ host, initial = '/', isAr = false, onNavigate, renderPage, height = 380 }) {
  const [path, setPath] = useState(initial)
  const [addr, setAddr] = useState(host + initial)

  const nav = p => {
    let clean = (p || '/').trim()
    clean = clean.replace(/^https?:\/\//i, '').replace(new RegExp('^' + host.replace(/\./g, '\\.'), 'i'), '').toLowerCase()
    if (!clean.startsWith('/')) clean = '/' + clean
    clean = clean.replace(/\/+$/, '') || '/'
    setPath(clean); setAddr(host + (clean === '/' ? '/' : clean))
    onNavigate && onNavigate(clean)
  }

  const content = renderPage(path, nav)

  return (
    <div style={{ border:'2px solid #cbd5e1', borderRadius:12, overflow:'hidden', background:'white', boxShadow:'0 6px 18px rgba(0,0,0,0.06)' }}>
      {/* chrome + address bar */}
      <div style={{ background:'#e2e8f0', padding:'7px 10px', display:'flex', alignItems:'center', gap:8 }} dir="ltr">
        <span style={{ display:'flex', gap:4 }}>
          <span style={{ width:9, height:9, borderRadius:'50%', background:'#ef4444' }} />
          <span style={{ width:9, height:9, borderRadius:'50%', background:'#f59e0b' }} />
          <span style={{ width:9, height:9, borderRadius:'50%', background:'#22c55e' }} />
        </span>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:4, background:'white', borderRadius:20, padding:'4px 12px', border:'1px solid #cbd5e1' }}>
          <span style={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace' }}>🔒 http://</span>
          <input value={addr} onChange={e => setAddr(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') nav(addr) }}
            spellCheck={false} autoCapitalize="off" autoComplete="off"
            style={{ flex:1, border:'none', outline:'none', fontFamily:'monospace', fontSize:12, color:'#334155' }} />
        </div>
        <button onClick={() => nav(path)} title="reload" style={{ background:'white', border:'1px solid #cbd5e1', borderRadius:7, cursor:'pointer', fontSize:13, padding:'2px 8px' }}>⟳</button>
      </div>
      {/* page */}
      <div dir={isAr ? 'rtl' : 'ltr'} style={{ height, overflow:'auto', padding:'16px 18px', background:'#fff', color:'#1e293b', fontSize:13, lineHeight:1.6 }}>
        {content || (
          <div style={{ textAlign:'center', color:'#94a3b8', paddingTop:40 }}>
            <div style={{ fontSize:40, fontWeight:900, color:'#cbd5e1' }}>404</div>
            <div style={{ fontFamily:'monospace', fontSize:12 }}>{host}{path}</div>
            <div style={{ marginTop:6, fontSize:12 }}>{isAr ? 'الصفحة غير موجودة' : 'Page not found'}</div>
          </div>
        )}
      </div>
    </div>
  )
}

/* Small helpers pages can reuse for a consistent website look */
export const WebNav = ({ links, nav, isAr, brand = '🌐 Site' }) => (
  <div style={{ display:'flex', gap:14, flexWrap:'wrap', borderBottom:'2px solid #f1f5f9', paddingBottom:10, marginBottom:14 }}>
    <span style={{ fontWeight:900, color:'#0e1f39' }}>{brand}</span>
    {links.map(([p, ar, en]) => (
      <a key={p} onClick={() => nav(p)} style={{ color:'#2563eb', cursor:'pointer', fontSize:12.5, fontWeight:600 }}>{isAr ? ar : en}</a>
    ))}
  </div>
)
