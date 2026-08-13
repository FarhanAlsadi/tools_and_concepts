import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'

const LESSONS = [
  { page:'/lx-terminal', icon:'⌨️', color:'#22c55e', typeAr:'درس', typeEn:'Lesson',
    tAr:'الطرفية (Terminal)', tEn:'The Terminal',
    dAr:'تعلّم أوامر لينكس الحقيقية: ls، cd، pwd، mkdir، touch، cat، nano، rm، tree.',
    dEn:'Learn the real Linux commands: ls, cd, pwd, mkdir, touch, cat, nano, rm, tree.' },
  { page:'/lx-fs', icon:'🗂️', color:'#3b82f6', typeAr:'درس', typeEn:'Lesson',
    tAr:'نظام الملفات (FHS)', tEn:'The File System (FHS)',
    dAr:'استكشف تسلسل مجلدات لينكس: / و etc و home و usr و var و usr/share/wordlists.',
    dEn:'Explore the Linux hierarchy: /, etc, home, usr, var, and usr/share/wordlists.' },
  { page:'/lx-gobuster', icon:'📂', color:'#f59e0b', typeAr:'مختبر', typeEn:'Lab',
    tAr:'Gobuster — كشف المجلدات', tEn:'Gobuster — Directory Busting',
    dAr:'استخدم gobuster الحقيقي مع قائمة كلمات لاكتشاف الصفحات المخفية على brightbyte.io.',
    dEn:'Use the real gobuster with a wordlist to discover hidden pages on brightbyte.io.' },
  { page:'/lx-hydra', icon:'🐉', color:'#ef4444', typeAr:'مختبر', typeEn:'Lab',
    tAr:'Hydra — كسر تسجيل الدخول', tEn:'Hydra — Login Brute-Force',
    dAr:'استخدم hydra الحقيقي مع rockyou.txt لكسر كلمة مرور لوحة الإدارة.',
    dEn:'Use the real hydra with rockyou.txt to brute-force the admin login password.' },
  { page:'/lx-challenge', icon:'🏴', color:'#7c3aed', typeAr:'تحدي', typeEn:'Challenge',
    tAr:'التحدي النهائي (CTF)', tEn:'Final Challenge (CTF)',
    dAr:'اجمع كل شيء: عدّد المجلدات، اكسر الدخول، والتقط العلم من لوحة الإدارة.',
    dEn:'Put it all together: enumerate, crack the login, and capture the flag from the admin panel.' },
]

export default function PageLinuxHub() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  return (
    <div style={{ maxWidth:1000, margin:'0 auto', padding:'20px 14px', fontFamily:'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <span style={{ background:'#111827', color:'#a5f3fc', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, fontFamily:'monospace' }}>🐧 Linux</span>
        <button onClick={() => navigate('/')} style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:7, padding:'3px 10px', fontSize:12, color:'#64748b', cursor:'pointer' }}>{isAr ? '← الرئيسية' : '← Home'}</button>
      </div>
      <h1 style={{ fontSize:26, fontWeight:900, color:'#1e293b', margin:'0 0 6px' }}>🐧 {isAr ? 'مسار لينكس' : 'Linux Track'}</h1>
      <p style={{ fontSize:13.5, color:'#64748b', margin:'0 0 20px', maxWidth:760, lineHeight:1.7 }}>
        {isAr
          ? 'طرفية لينكس حقيقية تعمل بالأوامر الحقيقية فقط (ls، cd، nano، …) وبأدوات اختبار اختراق حقيقية (gobuster و hydra) على نظام ملفات كامل بتسلسله القياسي. ابدأ من الأعلى وتدرّج حتى التحدي النهائي.'
          : 'A real Linux terminal that runs only real commands (ls, cd, nano, …) and real pentest tools (gobuster & hydra) over a full standard filesystem. Start at the top and work down to the final challenge.'}
      </p>

      {/* Lesson cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14 }}>
        {LESSONS.map((l, i) => (
          <button key={l.page} onClick={() => navigate(l.page)}
            style={{ textAlign:'start', background:'white', border:'2px solid #e2e8f0', borderRadius:14, padding:16, cursor:'pointer',
              borderLeft: isAr ? undefined : `5px solid ${l.color}`, borderRight: isAr ? `5px solid ${l.color}` : undefined, transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <span style={{ fontSize:28 }}>{l.icon}</span>
              <span style={{ marginInlineStart:'auto', fontSize:10, fontWeight:800, color:l.color, background:`${l.color}18`, borderRadius:20, padding:'2px 10px' }}>{i + 1} · {isAr ? l.typeAr : l.typeEn}</span>
            </div>
            <div style={{ fontSize:15, fontWeight:800, color:'#1e293b', marginBottom:5 }}>{isAr ? l.tAr : l.tEn}</div>
            <div style={{ fontSize:12, color:'#64748b', lineHeight:1.6 }}>{isAr ? l.dAr : l.dEn}</div>
          </button>
        ))}
      </div>

      {/* Nav */}
      <div style={{ display:'flex', justifyContent:'center', marginTop:24 }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:6, color:'#1d4ed8', background:'#eff6ff', border:'2px solid #bfdbfe', borderRadius:10, padding:'10px 28px', cursor:'pointer', fontSize:14, fontWeight:700 }}>
          <ChevronLeft size={15} />{isAr ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
