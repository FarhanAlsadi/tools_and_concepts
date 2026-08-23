import { useNavigate } from 'react-router-dom'
import {
  Globe, Layers, Map, Server, Terminal, Shield, Lock,
  KeyRound, MessageSquare, Flame, BookOpen, Wifi, Network, ShieldAlert, Activity, HelpCircle, Swords, MonitorDot, VenetianMask, Fingerprint, FolderOpen, Zap, ShieldCheck, Database, Code2, Gamepad2, Fish, FileLock2, Bug, Camera, ScanSearch, Cookie, Send, ArrowDownUp, Table2
} from 'lucide-react'
import { useApp } from '../context/AppContext'

export const LESSONS = [
  {
    icon: <Swords className="w-5 h-5" />,
    color: 'bg-rose-100 text-rose-700',
    badge: 'bg-rose-50 text-rose-600 border-rose-200',
    titleAr: 'هجوم القوة الغاشمة', titleEn: 'Brute-Force Attack',
    descAr: 'شغّل أداة cracker وحدّد اسم المستخدم وعدد أحرف كلمة المرور والموقع — وشاهد صفحة الدخول في متجر حقيقي تُجرَّب كلمة مرور تلو الأخرى حتى تُكسَر',
    descEn: 'Run the cracker tool — give it a username, password length, and website — and watch a real store’s login page get tried one password after another until it cracks',
    page: '/brute-force', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <KeyRound className="w-5 h-5" />,
    color: 'bg-violet-100 text-violet-700',
    badge: 'bg-violet-50 text-violet-600 border-violet-200',
    titleAr: 'تشفير الرسائل',    titleEn: 'Shift Cipher',
    descAr: 'تعلم تشفير الحروف باستخدام عجلة التشفير وتحديات تفاعلية',
    descEn: 'Learn to encrypt letters using the cipher wheel with interactive challenges',
    page: '/page7', typeAr: 'درس', typeEn: 'Lesson',
  },
  {
    icon: <VenetianMask className="w-5 h-5" />,
    color: 'bg-indigo-100 text-indigo-700',
    badge: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    titleAr: 'كيف يعمل VPN؟',    titleEn: 'How VPN Works',
    descAr: 'شاهد كيف يُغير VPN مسار الاتصال ويخفي وجهتك عن ISP — محاكاة بصرية خطوة بخطوة مع الفرق بين VPN وبدونه',
    descEn: 'See how a VPN changes your connection path and hides your destination from ISP — step-by-step visual with and without VPN',
    page: '/vpn', typeAr: 'درس', typeEn: 'Lesson',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    color: 'bg-red-100 text-red-700',
    badge: 'bg-red-50 text-red-600 border-red-200',
    titleAr: 'هجمات DoS و DDoS',
    titleEn: 'DoS & DDoS Attacks',
    descAr: 'شاهد كيف تُشلّ هجمات حرمان الخدمة الخوادم — محاكاة تفاعلية مع ٦ تقنيات حماية مختلفة',
    descEn: 'Watch how denial-of-service attacks cripple servers — interactive simulation with 6 defense techniques',
    page: '/dos', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <KeyRound className="w-5 h-5" />,
    color: 'bg-teal-100 text-teal-700',
    badge: 'bg-teal-50 text-teal-600 border-teal-200',
    titleAr: 'مولّد كلمات المرور',
    titleEn: 'Password Generator',
    descAr: 'تعلّم مبادئ كلمات المرور القوية — وَلّد كلمات مرور آمنة وافهم لماذا تكون بعضها أقوى من غيرها',
    descEn: 'Learn the principles of strong passwords — generate secure passwords and understand what makes them strong',
    page: '/password-gen', typeAr: 'درس', typeEn: 'Lesson',
  },
  {
    icon: <Fish className="w-5 h-5" />,
    color: 'bg-amber-100 text-amber-700',
    badge: 'bg-amber-50 text-amber-600 border-amber-200',
    titleAr: 'اكتشف رسائل التصيّد',
    titleEn: 'Spot the Phishing',
    descAr: 'اختبار عملي بريد واقعي: مرّر فوق المُرسِل والأزرار والروابط لكشف وجهتها الحقيقية في شريط الحالة، ثم قرّر تصيّد أم حقيقية — أهم مهارة أمان يومية',
    descEn: 'A realistic email quiz: hover over the sender, buttons, and links to reveal their true destination in the status bar, then decide phishing or legit — the most useful everyday security skill',
    page: '/phishing', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <FileLock2 className="w-5 h-5" />,
    color: 'bg-red-100 text-red-700',
    badge: 'bg-red-50 text-red-600 border-red-200',
    titleAr: 'محاكاة برامج الفدية',
    titleEn: 'Ransomware Simulation',
    descAr: 'محاكاة آمنة ومثيرة: افتح المرفق المشبوه وشاهد ملفاتك تُقفَل واحداً تلو الآخر، ثم تظهر مطالبة الفدية — واختر ردّك الصحيح لتتعلّم لماذا النسخ الاحتياطي هو الحل',
    descEn: "A safe, dramatic simulation: open the booby-trapped attachment, watch your files lock one by one and the ransom note appear — then choose your response to learn why backups are the answer",
    page: '/ransomware', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Wifi className="w-5 h-5" />,
    color: 'bg-rose-100 text-rose-700',
    badge: 'bg-rose-50 text-rose-600 border-rose-200',
    titleAr: 'التنصّت على الواي فاي العام',
    titleEn: 'Public WiFi Sniffing',
    descAr: 'كن المهاجم على شبكة مقهى مفتوحة: شغّل أداة التقاط مثل Wireshark وشاهد الحزم تتدفّق — اقرأ محتوى مواقع HTTP بنص صريح (دخول ورسائل)، بينما تظهر مواقع HTTPS مشفّرة لا يمكن قراءتها',
    descEn: 'Be the attacker on an open café network: run a Wireshark-style capture and watch packets stream — read HTTP sites in plaintext (logins, messages), while HTTPS sites show only unreadable encrypted bytes',
    page: '/wifi-sniff', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <FolderOpen className="w-5 h-5" />,
    color: 'bg-amber-100 text-amber-700',
    badge: 'bg-amber-50 text-amber-600 border-amber-200',
    titleAr: 'Gobuster — كشف المجلدات المخفية',
    titleEn: 'Gobuster — Directory Busting',
    descAr: 'شغّل أداة gobuster الحقيقية من الطرفية مع قائمة كلمات لاكتشاف الصفحات والمجلدات المخفية على موقع الهدف، ثم زُرها في المتصفح — وتعرّف على الحالات ٢٠٠ و٣٠١ و٤٠٣',
    descEn: 'Run the real gobuster from the terminal with a wordlist to discover hidden pages and folders on the target site, then visit them in the browser — and learn the 200, 301 and 403 statuses',
    page: '/lx-gobuster', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <KeyRound className="w-5 h-5" />,
    color: 'bg-red-100 text-red-700',
    badge: 'bg-red-50 text-red-600 border-red-200',
    titleAr: 'Hydra — كسر تسجيل الدخول',
    titleEn: 'Hydra — Login Brute-Force',
    descAr: 'شغّل أداة hydra الحقيقية مع قائمة كلمات rockyou.txt لتجربة آلاف كلمات المرور على نموذج تسجيل الدخول حتى تكسر حساب المدير وتدخل لوحة الإدارة',
    descEn: 'Run the real hydra with the rockyou.txt wordlist to try thousands of passwords against the login form until it cracks the admin account and opens the admin panel',
    page: '/lx-hydra', typeAr: 'مختبر', typeEn: 'Lab',
  },
]

export default function Welcome() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  return (
    <div className="min-h-screen bg-cc-cream" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Lessons grid ──────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* ── Live Quiz banner ─────────────────────────────────────── */}
        <button
          onClick={() => navigate('/play')}
          className="w-full mb-8 rounded-2xl p-5 relative overflow-hidden text-start hover:shadow-xl hover:-translate-y-0.5 transition-all group"
          style={{ background: '#0E1F39' }}
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <div className="relative z-10 flex items-center gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(252,173,15,0.15)' }}>
              <Gamepad2 className="w-6 h-6" style={{ color: '#FCAD0F' }} />
            </div>
            <div className="flex-1 min-w-[200px]">
              <h3 className="font-black text-lg text-white mb-0.5">
                {isAr ? 'مسابقة مباشرة 🎉' : 'Live Quiz 🎉'}
              </h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {isAr
                  ? 'عندك رمز من المدرب؟ ادخل نافس زملاءك على لوحة الصدارة!'
                  : 'Got a code from your trainer? Join and race your classmates on the leaderboard!'}
              </p>
            </div>
            <span
              className="px-6 py-2.5 rounded-xl font-black text-sm shrink-0 group-hover:scale-105 transition-transform"
              style={{ background: '#FCAD0F', color: '#0E1F39' }}
            >
              {isAr ? 'انضم الآن ←' : 'Join now →'}
            </span>
          </div>
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black" style={{ color: '#0E1F39' }}>
              {isAr ? 'الدروس والمختبرات' : 'Lessons & Labs'}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#FCAD0F' }}>
            <BookOpen className="w-4 h-4" />
            <span className="font-bold">{isAr ? `${LESSONS.length.toLocaleString('ar-EG')} متاح` : `${LESSONS.length} available`}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {LESSONS.map((lesson) => (
            <button
              key={lesson.page}
              onClick={() => navigate(lesson.page)}
              className={`bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all ${isAr ? 'text-right' : 'text-left'} group relative overflow-hidden`}
              style={{ '--tw-border-color': '#e2e8f0' }}
              dir={isAr ? 'rtl' : 'ltr'}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#FCAD0F'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              {/* Icon + badge */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 ${lesson.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {lesson.icon}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${lesson.badge}`}>
                  {isAr ? lesson.typeAr : lesson.typeEn}
                </span>
              </div>

              {/* Title + description */}
              <h3 className="font-bold text-base mb-1.5 leading-tight" style={{ color: '#0E1F39' }}>
                {isAr ? lesson.titleAr : lesson.titleEn}
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                {isAr ? lesson.descAr : lesson.descEn}
              </p>

              {lesson.note && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-pink-500 font-medium">
                  <span>🔗</span>
                  <span>{isAr ? 'يتبع درس التشفير' : 'Follows Cipher lesson'}</span>
                </div>
              )}

              {/* Hover arrow — brand gold (logical end-4 so it mirrors in RTL) */}
              <div className="absolute bottom-4 end-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#FCAD0F' }}>
                  <span className="text-sm font-black" style={{ color: '#0E1F39' }}>{isAr ? '←' : '→'}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ── Important note ──────────────────────────────────────── */}
        <div className="dark-keep mt-10 rounded-2xl p-5 relative overflow-hidden" style={{ background: '#0E1F39' }}>
          {/* Mini chevron decoration */}
          <svg className="absolute opacity-10 pointer-events-none" style={{ top: '-20px', left: isAr ? 'auto' : '-10px', right: isAr ? '-10px' : 'auto', width: 120, height: 120 }} viewBox="0 0 400 400" fill="none">
            <path d="M60 30 C60 30 220 80 300 200 C380 320 320 370 320 370" stroke="#FCAD0F" strokeWidth="90" strokeLinecap="round" fill="none"/>
          </svg>
          <div className="relative z-10" dir={isAr ? 'rtl' : 'ltr'}>
            <h3 className="font-bold mb-1.5 flex items-center gap-2" style={{ color: '#FCAD0F' }}>
              <span>📌</span>
              {isAr ? 'ملاحظة مهمة' : 'Important Note'}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {isAr
                ? 'هذا الموقع هو محاكاة تعليمية آمنة بالكامل. جميع البيانات والسيناريوهات وهمية ومصممة للتعلم. لا يتم إجراء أي فحص حقيقي لأي موقع خارجي.'
                : 'This website is a fully safe educational simulation. All data and scenarios are fictional and designed for learning. No real scanning of any external website is performed.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
