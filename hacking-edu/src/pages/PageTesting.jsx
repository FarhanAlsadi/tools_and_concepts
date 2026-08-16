import { useNavigate } from 'react-router-dom'
import { FileLock2, ArrowLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'

/* ────────────────────────────────────────────────────────────────────────────
   TESTING AREA (hidden hub)

   A staging ground for new, experimental / gamified versions of lessons. It is
   reachable only by URL (#/testing) and is intentionally NOT listed in the
   Welcome LESSONS grid, so it stays invisible on the public lessons page.

   Add a new experimental lesson by:
     1) creating its PageXxx.jsx,
     2) registering its route in App.jsx,
     3) adding an entry to TESTING_LESSONS below.
   ──────────────────────────────────────────────────────────────────────────── */

export const TESTING_LESSONS = [
  {
    icon: <FileLock2 className="w-5 h-5" />,
    color: 'bg-red-100 text-red-700',
    badge: 'bg-violet-50 text-violet-600 border-violet-200',
    titleAr: 'مهمّة: أوقف هجوم الفدية',
    titleEn: 'Mission: Stop the Ransomware',
    descAr: 'نسخة مُلعّبة بالكامل: العب دور مسؤول تقنية المعلومات — افحص الوارد لكشف التصيّد، واجه الإصابة، ثم أدِر الاستجابة للحادث خطوة بخطوة واكسب النقاط.',
    descEn: 'A fully gamified build: play the IT responder — triage the inbox for phishing, face the infection, then run the incident response step by step and score points.',
    page: '/testing/ransomware',
    typeAr: 'لعبة', typeEn: 'Game',
  },
]

export default function PageTesting() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  return (
    <div className="min-h-screen bg-cc-cream" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* header */}
        <div className="rounded-2xl p-6 mb-8 relative overflow-hidden" style={{ background: '#0E1F39' }}>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(252,173,15,.15)', color: '#FCAD0F' }}>
                {isAr ? '🧪 منطقة اختبار داخلية' : '🧪 Internal testing area'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              {isAr ? 'مختبر النسخ التجريبية' : 'Experimental Builds Lab'}
            </h1>
            <p className="text-sm mt-2 max-w-2xl" style={{ color: 'rgba(255,255,255,.7)' }}>
              {isAr
                ? 'هذه الصفحة غير معروضة في صفحة الدروس الرئيسية. تُستخدم لتجربة نسخ جديدة ومُلعّبة من الدروس قبل نقلها للموقع. تُضاف الدروس هنا واحداً تلو الآخر.'
                : 'This page is hidden from the main lessons page. It is used to try new, gamified versions of lessons before moving them to the site. Lessons are added here one by one.'}
            </p>
          </div>
        </div>

        {/* section title */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black" style={{ color: '#0E1F39' }}>
            {isAr ? 'الدروس التجريبية' : 'Experimental Lessons'}
          </h2>
          <span className="text-xs font-bold" style={{ color: '#FCAD0F' }}>
            {isAr ? `${TESTING_LESSONS.length.toLocaleString('ar-EG')} متاح` : `${TESTING_LESSONS.length} available`}
          </span>
        </div>

        {/* grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTING_LESSONS.map((lesson) => (
            <button
              key={lesson.page}
              onClick={() => navigate(lesson.page)}
              className={`bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all ${isAr ? 'text-right' : 'text-left'} group relative overflow-hidden`}
              dir={isAr ? 'rtl' : 'ltr'}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#FCAD0F'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 ${lesson.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {lesson.icon}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${lesson.badge}`}>
                  {isAr ? lesson.typeAr : lesson.typeEn}
                </span>
              </div>
              <h3 className="font-bold text-base mb-1.5 leading-tight" style={{ color: '#0E1F39' }}>
                {isAr ? lesson.titleAr : lesson.titleEn}
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                {isAr ? lesson.descAr : lesson.descEn}
              </p>
              <div className="absolute bottom-4 end-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#FCAD0F' }}>
                  <span className="text-sm font-black" style={{ color: '#0E1F39' }}>{isAr ? '←' : '→'}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* back link */}
        <button onClick={() => navigate('/')} className="mt-10 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
          {isAr ? 'العودة إلى الدروس الرئيسية' : 'Back to main lessons'}
        </button>

      </div>
    </div>
  )
}
