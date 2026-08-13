import { useLocation, useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { useApp } from '../context/AppContext'

const PAGE_TITLES = {
  '/page1': { ar: 'مكونات الموقع', en: 'Website Components' },
  '/page2': { ar: 'كيف يعمل الويب', en: 'Client-Server' },
  '/page3': { ar: 'المسارات والصفحات', en: 'Routes & Hidden Pages' },
  '/page4': { ar: 'أداة كاشف', en: 'Kashif Tool' },
  '/page5': { ar: 'ثغرة IDOR', en: 'IDOR Vulnerability' },
  '/page6': { ar: 'مختبر الحماية', en: 'Defense Lab' },
  '/page7': { ar: 'تشفير الرسائل', en: 'Shift Cipher' },
  '/terminal': { ar: 'مقدمة إلى الطرفية', en: 'Terminal Introduction' },
  '/firewall': { ar: 'محاكاة الجدار الناري', en: 'Firewall Simulation' },
  '/dns': { ar: 'ما هو DNS؟', en: 'What is DNS?' },
  '/dns-lab': { ar: 'مختبر DNS التفاعلي', en: 'DNS Resolution Lab' },
  '/dhcp': { ar: 'كيف يعمل خادم DHCP؟', en: 'How DHCP Works' },
  '/ip': { ar: 'عنوان IP', en: 'IP Address' },
  '/dns-spoofing': { ar: 'محاكاة DNS Spoofing', en: 'DNS Spoofing' },
  '/siem': { ar: 'محاكاة SIEM', en: 'SIEM Simulation' },
  '/soc': { ar: 'مختبر محلل الأمن (SOC)', en: 'SOC Analyst Lab' },
  '/quiz': { ar: 'بنك الأسئلة', en: 'Question Bank' },
  '/barq': { ar: 'أداة برق', en: 'Barq Tool' },
  '/terminal-lab': { ar: 'مختبر الطرفية', en: 'Terminal Lab' },
  '/vpn': { ar: 'كيف يعمل VPN؟', en: 'How VPN Works' },
  '/ip-masking': { ar: 'إخفاء IP وتدوير العناوين', en: 'IP Masking & Rotation' },
  '/linux-fs':   { ar: 'نظام الملفات', en: 'File System' },
  '/dos':        { ar: 'هجمات DoS و DDoS',      en: 'DoS & DDoS Attacks' },
  '/dos-lab':    { ar: 'مختبر DoS / DDoS',      en: 'DoS / DDoS Lab' },
  '/nmap':       { ar: 'Nmap — فحص الشبكات',    en: 'Nmap — Network Scanner' },
  '/linux':      { ar: 'مسار لينكس',            en: 'Linux Track' },
  '/lx-terminal':{ ar: 'لينكس — الطرفية',       en: 'Linux — Terminal' },
  '/lx-fs':      { ar: 'لينكس — نظام الملفات',   en: 'Linux — File System' },
  '/lx-gobuster':{ ar: 'لينكس — Gobuster',       en: 'Linux — Gobuster' },
  '/lx-hydra':   { ar: 'لينكس — Hydra',          en: 'Linux — Hydra' },
  '/lx-challenge':{ ar: 'لينكس — التحدي',        en: 'Linux — Challenge' },
  '/database':   { ar: 'كيف تعمل قواعد البيانات', en: 'How SQL Databases Work' },
  '/sqli':       { ar: 'حقن SQL',               en: 'SQL Injection' },
  '/view-source':{ ar: 'ثغرة كود المصدر',        en: 'Page Source Vulnerability' },
  '/brute-force':{ ar: 'هجوم القوة الغاشمة',      en: 'Brute-Force Attack' },
  '/mac-spoofing':{ ar: 'تمويه عنوان MAC',        en: 'MAC Spoofing' },
  '/phishing':   { ar: 'اكتشف التصيّد',           en: 'Spot the Phishing' },
  '/ransomware': { ar: 'محاكاة برامج الفدية',      en: 'Ransomware Simulation' },
  '/xss':        { ar: 'حقن السكربتات XSS',        en: 'Cross-Site Scripting' },
  '/exif':       { ar: 'بيانات الصور EXIF',        en: 'Photo Metadata (EXIF)' },
  '/dorking':    { ar: 'الاختراق عبر جوجل',        en: 'Google Dorking' },
  '/ip-mac':     { ar: 'كيف تتواصل الأجهزة',        en: 'How Devices Communicate' },
  '/cookies':    { ar: 'الكوكيز',                   en: 'Cookies' },
  '/csrf':       { ar: 'تزوير الطلب CSRF',          en: 'CSRF' },
  '/ftp':        { ar: 'بروتوكول FTP',              en: 'FTP' },
  '/mind-games':    { ar: 'ألعاب التفكير',          en: 'Mind Games' },
  '/challenge':     { ar: 'التحدي النهائي',         en: 'Final Challenge' },
  '/password-gen':  { ar: 'مولّد كلمات المرور',     en: 'Password Generator' },
  '/antivirus':     { ar: 'مكافحة الفيروسات',       en: 'Antivirus' },
  '/path/fundamentals': { ar: 'مسار الأساسيات',        en: 'Fundamentals Path' },
  '/path/pentester':    { ar: 'مسار مختبِر الاختراق',   en: 'Penetration Tester Path' },
  '/path/soc':          { ar: 'مسار محلل SOC',          en: 'SOC Analyst Path' },
  '/path/webapp':       { ar: 'مسار أمن الويب',         en: 'Web App Security Path' },
  '/path/network':      { ar: 'مسار الشبكات',           en: 'Networking Path' },
}

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { lang } = useApp()

  const pageTitle = PAGE_TITLES[location.pathname]

  return (
    <nav className="sticky top-0 z-50" style={{ background: '#0E1F39' }}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">

        {/* Home button (CamelCode logo hidden) */}
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
