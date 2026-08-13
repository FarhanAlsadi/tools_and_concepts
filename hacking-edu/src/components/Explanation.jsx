import { useState } from 'react'
import { useApp } from '../context/AppContext'

/* Collapsible "explanation" panel — placed AFTER the practical part of a lesson.
   Collapsed by default, so the hands-on content comes first and the theory /
   takeaways / fix notes are revealed only on demand. Inline-styled so it drops
   into both Tailwind and inline-styled lessons. Bilingual via useApp(). */
export default function Explanation({ children, titleAr, titleEn }) {
  const { lang } = useApp()
  const ar = lang === 'ar'
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginTop: 16, border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: 'white' }} dir={ar ? 'rtl' : 'ltr'}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '12px 16px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: '#0e1f39' }}>
        <span>📖 {ar ? (titleAr || 'الشرح والتفاصيل') : (titleEn || 'Explanation & details')}</span>
        <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>{open ? (ar ? 'إخفاء ▲' : 'Hide ▲') : (ar ? 'اعرض ▼' : 'Show ▼')}</span>
      </button>
      {open && <div style={{ padding: '6px 16px 16px' }}>{children}</div>}
    </div>
  )
}
