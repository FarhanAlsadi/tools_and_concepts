import { useLocation, useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { useApp } from '../context/AppContext'

const PAGE_TITLES = {
  '/brute-force':{ ar: 'هجوم القوة الغاشمة',      en: 'Brute-Force Attack' },
  '/page7': { ar: 'تشفير الرسائل', en: 'Shift Cipher' },
  '/vpn': { ar: 'كيف يعمل VPN؟', en: 'How VPN Works' },
  '/dos':        { ar: 'هجمات DoS و DDoS',      en: 'DoS & DDoS Attacks' },
  '/password-gen':  { ar: 'مولّد كلمات المرور',     en: 'Password Generator' },
  '/phishing':   { ar: 'اكتشف التصيّد',           en: 'Spot the Phishing' },
  '/ransomware': { ar: 'محاكاة برامج الفدية',      en: 'Ransomware Simulation' },
  '/linux':      { ar: 'مسار لينكس',            en: 'Linux Track' },
  '/lx-terminal':{ ar: 'لينكس — الطرفية',       en: 'Linux — Terminal' },
  '/lx-fs':      { ar: 'لينكس — نظام الملفات',   en: 'Linux — File System' },
  '/lx-gobuster':{ ar: 'لينكس — Gobuster',       en: 'Linux — Gobuster' },
  '/lx-hydra':   { ar: 'لينكس — Hydra',          en: 'Linux — Hydra' },
  '/lx-challenge':{ ar: 'لينكس — التحدي',        en: 'Linux — Challenge' },
}

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { lang } = useApp()

  const pageTitle = PAGE_TITLES[location.pathname]

  return (
    <nav className="sticky top-0 z-50" style={{ background: '#0E1F39' }}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">

        {/* Home button */}
        <button onClick={() => navigate('/')} className="flex-shrink-0 flex items-center gap-1.5 text-sm font-bold"
          style={{ color: 'rgba(255,255,255,0.85)' }}>
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
        </button>

        {/* Breadcrumb */}
        {pageTitle && (
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-xs transition-colors flex-shrink-0"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#FCAD0F'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </button>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            <span className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {lang === 'ar' ? pageTitle.ar : pageTitle.en}
            </span>
          </div>
        )}

      </div>
    </nav>
  )
}
