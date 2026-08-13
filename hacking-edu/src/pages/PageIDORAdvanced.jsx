import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Explanation from '../components/Explanation'

// ─── DATA ─────────────────────────────────────────────────────────────────────

const SCENARIOS = [
  {
    id: 1,
    titleAr: 'صفحة الملف الشخصي',
    titleEn: 'User Profile Page',
    urlBefore: '/profile?user_id=42',
    urlAfter:  '/profile?user_id=43',
    fieldAr: 'user_id',
    fieldEn: 'user_id',
    victimDataAr: 'الاسم: سارة المنصوري\nالبريد: sara@example.com\nالعمر: 27',
    victimDataEn: 'Name: Sara Al-Mansouri\nEmail: sara@example.com\nAge: 27',
    typeAr: 'IDOR أفقي — مستخدم يصل لبيانات مستخدم آخر بنفس الصلاحية',
    typeEn: 'Horizontal IDOR — user accesses another user\'s data at the same privilege level',
    fixAr: 'تحقق من أن user_id في الجلسة == user_id في الطلب قبل إرجاع البيانات',
    fixEn: 'Verify session user_id == requested user_id before returning data',
  },
  {
    id: 2,
    titleAr: 'تحميل الفاتورة',
    titleEn: 'Invoice Download',
    urlBefore: '/invoices/download/1001',
    urlAfter:  '/invoices/download/1002',
    fieldAr: 'رقم الفاتورة',
    fieldEn: 'Invoice ID',
    victimDataAr: 'فاتورة #1002\nالعميل: شركة النخيل\nالمبلغ: 45,000 QAR\nتاريخ: 2024-03-15',
    victimDataEn: 'Invoice #1002\nClient: Al-Nakheel Co.\nAmount: 45,000 QAR\nDate: 2024-03-15',
    typeAr: 'IDOR على ملف — تغيير رقم الفاتورة في الرابط لتحميل فاتورة شخص آخر',
    typeEn: 'File IDOR — changing the invoice number to download someone else\'s invoice',
    fixAr: 'تحقق من أن الفاتورة المطلوبة مرتبطة بحساب المستخدم الحالي قبل السماح بالتحميل',
    fixEn: 'Verify the invoice belongs to the current user\'s account before allowing download',
  },
  {
    id: 3,
    titleAr: 'رسائل المستخدم',
    titleEn: 'User Messages',
    urlBefore: '/api/messages?inbox_id=88',
    urlAfter:  '/api/messages?inbox_id=89',
    fieldAr: 'inbox_id',
    fieldEn: 'inbox_id',
    victimDataAr: 'صندوق بريد #89\nمن: مدير الموارد البشرية\nالموضوع: تفاصيل العقد السري',
    victimDataEn: 'Inbox #89\nFrom: HR Manager\nSubject: Confidential contract details',
    typeAr: 'IDOR في API — تغيير معرّف صندوق البريد في طلب API لقراءة رسائل شخص آخر',
    typeEn: 'API IDOR — changing the inbox ID in an API call to read someone else\'s messages',
    fixAr: 'تحقق من أن inbox_id مرتبط بالمستخدم المُسجَّل في الجلسة الحالية',
    fixEn: 'Verify the inbox_id is linked to the currently authenticated session user',
  },
  {
    id: 4,
    titleAr: 'لوحة الإدارة',
    titleEn: 'Admin Panel',
    urlBefore: '/dashboard',
    urlAfter:  '/admin/users',
    fieldAr: 'المسار',
    fieldEn: 'Path',
    victimDataAr: 'قائمة المستخدمين:\n1. admin@site.com — مشرف\n2. user@site.com — مستخدم\n3. guest@site.com — زائر',
    victimDataEn: 'User list:\n1. admin@site.com — Admin\n2. user@site.com — User\n3. guest@site.com — Guest',
    typeAr: 'IDOR عمودي (تصعيد الصلاحيات) — مستخدم عادي يصل لموارد المشرف',
    typeEn: 'Vertical IDOR (privilege escalation) — regular user accessing admin resources',
    fixAr: 'تحقق من دور المستخدم (role) على الخادم في كل طلب لمسارات الإدارة',
    fixEn: 'Check the user\'s role server-side on every request to admin paths',
  },
]

const DEFENSES = [
  {
    icon: '🔐',
    titleAr: 'التحقق من الصلاحيات على الخادم',
    titleEn: 'Server-Side Authorization Checks',
    descAr: 'قبل إرجاع أي بيانات، تحقق: هل المستخدم الحالي يملك هذا المورد؟ هذا الإجراء لا غنى عنه.',
    descEn: 'Before returning any data, check: does the current user own this resource? This check is non-negotiable.',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  },
  {
    icon: '🎲',
    titleAr: 'معرّفات UUID غير قابلة للتخمين',
    titleEn: 'Unpredictable UUID Identifiers',
    descAr: 'استبدال الأرقام المتسلسلة (1, 2, 3) بـ UUID عشوائية يُصعّب التخمين — لكنه لا يُغني عن التحقق من الصلاحيات.',
    descEn: 'Replacing sequential numbers (1, 2, 3) with random UUIDs makes guessing hard — but does not replace authorization checks.',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  {
    icon: '📋',
    titleAr: 'سجلات الوصول والتنبيهات',
    titleEn: 'Access Logs and Alerts',
    descAr: 'سجّل كل محاولة وصول مرفوضة ونبّه على الأنماط المشبوهة مثل تخمين المعرّفات بتسلسل سريع.',
    descEn: 'Log every denied access attempt and alert on suspicious patterns like rapid sequential ID guessing.',
    color: 'bg-amber-50 border-amber-200 text-amber-800',
  },
  {
    icon: '🧪',
    titleAr: 'اختبار الاختراق الدوري',
    titleEn: 'Regular Penetration Testing',
    descAr: 'اطلب من متخصصين أمنيين فحص تطبيقك بحثاً عن ثغرات IDOR وغيرها بشكل دوري.',
    descEn: 'Have security specialists regularly test your application for IDOR and other access control vulnerabilities.',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
  },
]

const REAL_CASES = [
  {
    companyAr: 'Facebook',
    companyEn: 'Facebook',
    yearAr: '2012',
    yearEn: '2012',
    descAr: 'باحث أمني اكتشف إمكانية حذف أي صورة على المنصة بتغيير معرّف الصورة في طلب API.',
    descEn: 'A security researcher discovered it was possible to delete any photo on the platform by changing the photo ID in an API request.',
    rewardAr: '500$',
    rewardEn: '$500',
  },
  {
    companyAr: 'Instagram',
    companyEn: 'Instagram',
    yearAr: '2015',
    yearEn: '2015',
    descAr: 'ثغرة سمحت بالوصول لصور المستخدمين الخاصة عبر تغيير معرّف الوسائط في طلبات API.',
    descEn: 'A vulnerability allowed access to private user photos by changing the media ID in API requests.',
    rewardAr: 'مكافأة علنية',
    rewardEn: 'Public Bug Bounty',
  },
  {
    companyAr: 'Snapchat',
    companyEn: 'Snapchat',
    yearAr: '2014',
    yearEn: '2014',
    descAr: 'ثغرة IDOR في API الصداقة سمحت باسترجاع أرقام هواتف أي مستخدم بتغيير معرّف الحساب.',
    descEn: 'An IDOR in the friendship API allowed retrieval of any user\'s phone number by changing the account ID.',
    rewardAr: 'غير معلن',
    rewardEn: 'Undisclosed',
  },
]

// ─── INTERACTIVE DEMO ─────────────────────────────────────────────────────────

function IDORDemo({ ar }) {
  const [selected, setSelected]   = useState(0)
  const [attacked, setAttacked]   = useState(false)
  const [showFix, setShowFix]     = useState(false)

  const s = SCENARIOS[selected]

  const reset = (idx) => { setSelected(idx); setAttacked(false); setShowFix(false) }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Scenario tabs */}
      <div className="flex gap-1 p-3 bg-slate-50 border-b border-slate-200 flex-wrap">
        {SCENARIOS.map((sc, i) => (
          <button key={sc.id} onClick={() => reset(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${selected === i ? 'bg-orange-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-300'}`}>
            {ar ? sc.titleAr : sc.titleEn}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {/* URL bar */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{ar ? 'الرابط في المتصفح' : 'Browser URL'}</p>
          <div className={`rounded-xl p-3 font-mono text-sm border transition-colors ${attacked ? 'bg-red-50 border-red-300 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
            dir="ltr">
            {attacked ? s.urlAfter : s.urlBefore}
          </div>
          {!attacked && (
            <p className="text-xs text-slate-400">{ar ? `الحقل المُغيَّر: ${s.fieldAr}` : `Changed field: ${s.fieldEn}`}</p>
          )}
        </div>

        {/* Attack button */}
        {!attacked ? (
          <button onClick={() => setAttacked(true)}
            className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">
            {ar ? '⚠️ تنفيذ الهجوم — تغيير المعرّف' : '⚠️ Execute Attack — Change the ID'}
          </button>
        ) : (
          <div className="space-y-3">
            {/* Data exposed */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs font-bold text-red-600 mb-2">{ar ? '🚨 تم الوصول لبيانات شخص آخر!' : '🚨 Another user\'s data was exposed!'}</p>
              <pre className="text-xs text-red-700 whitespace-pre-wrap font-mono">{ar ? s.victimDataAr : s.victimDataEn}</pre>
            </div>
            {/* Type label */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-orange-700">{ar ? '🏷 نوع الثغرة:' : '🏷 Vulnerability type:'}</p>
              <p className="text-xs text-orange-600 mt-1">{ar ? s.typeAr : s.typeEn}</p>
            </div>
            {/* Fix toggle */}
            <button onClick={() => setShowFix(!showFix)}
              className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors">
              {showFix ? (ar ? 'إخفاء الحل' : 'Hide Fix') : (ar ? '✅ كيف نُصلح هذا؟' : '✅ How do we fix this?')}
            </button>
            {showFix && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-xs font-bold text-emerald-700 mb-1">{ar ? '🔐 الحل الصحيح:' : '🔐 Correct fix:'}</p>
                <p className="text-xs text-emerald-700">{ar ? s.fixAr : s.fixEn}</p>
              </div>
            )}
            <button onClick={() => { setAttacked(false); setShowFix(false) }}
              className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 transition-colors">
              {ar ? 'إعادة المحاولة' : 'Try Again'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CODE COMPARISON ─────────────────────────────────────────────────────────

function CodeComparison({ ar }) {
  const [tab, setTab] = useState('vulnerable')
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex bg-slate-800">
        {[['vulnerable', ar ? '❌ كود مُعرَّض للثغرة' : '❌ Vulnerable Code'],
          ['secure',    ar ? '✅ كود آمن' : '✅ Secure Code']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-xs font-semibold transition-colors ${tab === k ? (k === 'vulnerable' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white') : 'text-slate-400 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="bg-slate-900 p-4 overflow-x-auto" dir="ltr">
        {tab === 'vulnerable' ? (
          <pre className="text-xs text-slate-300 leading-relaxed">{`// ❌ VULNERABLE — no authorization check
app.get('/profile', (req, res) => {
  const userId = req.query.user_id   // taken from URL
  const profile = db.getUser(userId) // fetches ANY user
  res.json(profile)                  // returned without check!
})`}</pre>
        ) : (
          <pre className="text-xs text-slate-300 leading-relaxed">{`// ✅ SECURE — session-based authorization
app.get('/profile', requireAuth, (req, res) => {
  const requestedId = req.query.user_id
  const sessionId   = req.session.userId  // from login

  // Check: does the logged-in user own this resource?
  if (requestedId !== sessionId) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const profile = db.getUser(requestedId)
  res.json(profile)
})`}</pre>
        )}
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function PageIDORAdvanced() {
  const { lang } = useApp()
  const ar = lang === 'ar'

  return (
    <div className={`min-h-screen pb-16 ${ar ? 'text-right' : 'text-left'}`} style={{ background: '#FCF5F0' }}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-semibold">
            🔓 {ar ? 'ثغرة IDOR المتقدمة' : 'Advanced IDOR'}
          </div>
          <h1 className="text-3xl font-black text-[#0E1F39]">
            {ar ? 'مرجع الكائن المباشر غير الآمن' : 'Insecure Direct Object Reference'}
          </h1>
        </div>

        {/* Interactive Demo */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#0E1F39]">{ar ? 'محاكاة تفاعلية' : 'Interactive Simulation'}</h2>
          <p className="text-sm text-slate-500">{ar ? 'اختر سيناريو وشاهد كيف تعمل ثغرة IDOR — ثم اكتشف كيفية إصلاحها.' : 'Choose a scenario and see how IDOR works in practice — then discover how to fix it.'}</p>
          <IDORDemo ar={ar} />
        </section>

        {/* Code comparison */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#0E1F39]">{ar ? 'الكود المُعرَّض مقابل الآمن' : 'Vulnerable vs Secure Code'}</h2>
          <p className="text-sm text-slate-500">{ar ? 'مثال بسيط يوضح الفرق بين كود بدون تحقق وكود بتحقق صحيح من الصلاحيات.' : 'A simple example showing the difference between code without checks and code with proper authorization.'}</p>
          <CodeComparison ar={ar} />
        </section>

        {/* explanation — collapsed by default, sits under the practical part */}
        <Explanation>
          <div className="space-y-8">
            <p className="text-slate-500 text-sm leading-relaxed">
              {ar
                ? 'تعلم أنواع ثغرات IDOR، كيف تعمل في الواقع، وكيف تمنعها — مع أمثلة تفاعلية وكود حقيقي.'
                : 'Learn IDOR vulnerability types, how they work in practice, and how to prevent them — with interactive examples and real code.'}
            </p>

            {/* What is IDOR */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <h2 className="text-xl font-bold text-[#0E1F39]">{ar ? 'ما هي ثغرة IDOR؟' : 'What is IDOR?'}</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                {ar
                  ? 'IDOR (Insecure Direct Object Reference) تحدث عندما يعرض التطبيق مرجعاً مباشراً لكائن داخلي — مثل رقم في الرابط — دون التحقق من أن المستخدم الحالي يملك صلاحية الوصول لذلك المورد.'
                  : 'IDOR (Insecure Direct Object Reference) occurs when an application exposes a direct reference to an internal object — like a number in the URL — without verifying that the current user is authorized to access that resource.'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {[
                  { icon: '1️⃣', ar: 'المهاجم يُسجّل دخوله بحسابه الخاص', en: 'Attacker logs in with their own account' },
                  { icon: '2️⃣', ar: 'يُغيّر معرّفاً في الرابط أو الطلب', en: 'Changes an ID in the URL or request' },
                  { icon: '3️⃣', ar: 'يصل لبيانات مستخدم آخر بدون إذن', en: 'Accesses another user\'s data without permission' },
                ].map((s, i) => (
                  <div key={i} className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <p className="text-xs text-orange-700 font-medium">{ar ? s.ar : s.en}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* IDOR Types */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#0E1F39]">{ar ? 'أنواع ثغرات IDOR' : 'Types of IDOR'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: '↔️', titleAr: 'IDOR أفقي', titleEn: 'Horizontal IDOR',
                    descAr: 'مستخدم يصل لبيانات مستخدم آخر بنفس مستوى الصلاحية. مثال: مستخدم يرى ملف شخص آخر.',
                    descEn: 'User accesses another user\'s data at the same privilege level. Example: viewing someone else\'s profile.', color: 'bg-red-50 border-red-200' },
                  { icon: '⬆️', titleAr: 'IDOR عمودي', titleEn: 'Vertical IDOR',
                    descAr: 'مستخدم عادي يصل لموارد أو وظائف تخص مستوى أعلى مثل المشرف.',
                    descEn: 'Regular user accesses resources or functions belonging to a higher level like admin.', color: 'bg-purple-50 border-purple-200' },
                  { icon: '📁', titleAr: 'IDOR على الملفات', titleEn: 'File-based IDOR',
                    descAr: 'تغيير اسم ملف أو مساره في الطلب للوصول لملفات شخص آخر.',
                    descEn: 'Changing a filename or path in the request to access another person\'s files.', color: 'bg-blue-50 border-blue-200' },
                  { icon: '🔌', titleAr: 'IDOR في API', titleEn: 'API IDOR',
                    descAr: 'تغيير معرّف في جسم طلب JSON أو معامل API للوصول لبيانات غير مصرح بها.',
                    descEn: 'Changing an ID in a JSON body or API parameter to access unauthorized data.', color: 'bg-amber-50 border-amber-200' },
                ].map((t, i) => (
                  <div key={i} className={`rounded-2xl border p-4 ${t.color}`}>
                    <div className="text-2xl mb-2">{t.icon}</div>
                    <h3 className="font-bold text-[#0E1F39] text-sm mb-1">{ar ? t.titleAr : t.titleEn}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{ar ? t.descAr : t.descEn}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Defenses */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#0E1F39]">{ar ? 'كيف تمنع ثغرات IDOR؟' : 'How to Prevent IDOR?'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DEFENSES.map((d, i) => (
                  <div key={i} className={`rounded-2xl border p-4 ${d.color}`}>
                    <div className="text-2xl mb-2">{d.icon}</div>
                    <h3 className="font-bold text-sm mb-1">{ar ? d.titleAr : d.titleEn}</h3>
                    <p className="text-xs leading-relaxed opacity-80">{ar ? d.descAr : d.descEn}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Real-world cases */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#0E1F39]">{ar ? 'حالات حقيقية مشهورة' : 'Real-World Cases'}</h2>
              <div className="space-y-3">
                {REAL_CASES.map((c, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 items-start">
                    <div className="bg-slate-100 rounded-xl px-3 py-2 text-center flex-shrink-0">
                      <div className="font-black text-[#0E1F39] text-base">{c.companyAr}</div>
                      <div className="text-xs text-slate-400">{ar ? c.yearAr : c.yearEn}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-600 leading-relaxed">{ar ? c.descAr : c.descEn}</p>
                      <span className="inline-block mt-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        {ar ? `المكافأة: ${c.rewardAr}` : `Reward: ${c.rewardEn}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* OWASP context */}
            <section className="bg-[#0E1F39] rounded-2xl p-6 text-white space-y-3">
              <h2 className="text-lg font-bold">{ar ? 'IDOR في OWASP Top 10' : 'IDOR in OWASP Top 10'}</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {ar
                  ? 'تندرج ثغرات IDOR تحت فئة "Broken Access Control" في قائمة OWASP Top 10 — وهي المرتبة الأولى في قائمة أخطر ثغرات تطبيقات الويب منذ عام 2021.'
                  : 'IDOR falls under "Broken Access Control" in the OWASP Top 10 — ranked #1 in the most critical web application security risks since 2021.'}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {['A01: Broken Access Control', 'IDOR', 'Privilege Escalation', 'Horizontal IDOR', 'Vertical IDOR'].map(t => (
                  <span key={t} className="text-xs bg-white/10 px-2 py-1 rounded-lg text-slate-300">{t}</span>
                ))}
              </div>
            </section>
          </div>
        </Explanation>

      </div>
    </div>
  )
}
