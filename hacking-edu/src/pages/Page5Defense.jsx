import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff, Home, Globe } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Explanation from '../components/Explanation'

const PROTECTED_PAGES = [
  { path: '/admin',     label: 'لوحة التحكم', labelEn: 'Admin Panel', icon: '⚙️', sensitive: true },
  { path: '/employees', label: 'الموظفون',    labelEn: 'Employees',   icon: '👔', sensitive: true },
  { path: '/customers', label: 'العملاء',     labelEn: 'Customers',   icon: '👥', sensitive: true },
  { path: '/flag',      label: 'العلم',       labelEn: 'Flag',        icon: '🚩', sensitive: true },
]

const PUBLIC_PAGES = [
  { path: '/home',    label: 'الرئيسية', labelEn: 'Home',     icon: '🏠' },
  { path: '/about',   label: 'من نحن',   labelEn: 'About Us', icon: '👥' },
  { path: '/contact', label: 'تواصل',    labelEn: 'Contact',  icon: '📬' },
]

function ToggleSwitch({ enabled, onChange, label, desc, color = 'indigo' }) {
  return (
    <div
      onClick={onChange}
      className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${
        enabled
          ? `border-${color}-300 bg-${color}-50`
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className={`font-bold text-sm ${enabled ? `text-${color}-800` : 'text-slate-700'}`}>{label}</h3>
          <p className={`text-xs mt-1 leading-relaxed ${enabled ? `text-${color}-600` : 'text-slate-400'}`}>{desc}</p>
        </div>
        <div className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? `bg-${color}-500` : 'bg-slate-300'}`}>
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
        </div>
      </div>
    </div>
  )
}

function SimulatedBrowser({ tryPath, loginEnabled, protectEnabled, onLogin, isAr }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginResult, setLoginResult] = useState(null)
  const [loggedIn, setLoggedIn] = useState(false)

  const isProtectedPage = PROTECTED_PAGES.some(p => p.path === tryPath)
  const pageInfo = [...PROTECTED_PAGES, ...PUBLIC_PAGES].find(p => p.path === tryPath)

  const handleLogin = () => {
    if (username === 'admin' && password === '1234') {
      setLoginResult('success')
      setLoggedIn(true)
      if (onLogin) onLogin()
    } else {
      setLoginResult('wrong')
    }
  }

  const resetLogin = () => {
    setLoginResult(null)
    setLoggedIn(false)
    setUsername('')
    setPassword('')
  }

  const showLoginForm = isProtectedPage && loginEnabled && !loggedIn
  const accessDenied  = isProtectedPage && !loginEnabled && protectEnabled && !loggedIn
  const openAccess    = !isProtectedPage || (!loginEnabled && !protectEnabled)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Browser chrome */}
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100">
        <div className="flex items-center gap-3" dir="ltr">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white rounded-lg px-3 py-1 text-xs font-mono text-slate-500 border border-slate-200 flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            <span>https://orbyx.store{tryPath}</span>
          </div>
          {isProtectedPage && (
            <div className={`text-xs px-2 py-1 rounded-lg font-bold ${loggedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
              {loggedIn
                ? (isAr ? '🔓 مسموح' : '🔓 Allowed')
                : (isAr ? '🔒 محمية' : '🔒 Protected')}
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="p-6 min-h-52">
        {showLoginForm && (
          <div className="max-w-sm mx-auto">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">
                {isAr ? 'تسجيل الدخول مطلوب' : 'Login Required'}
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                {isAr
                  ? <>للوصول إلى <code className="font-mono bg-slate-100 px-1 rounded">{tryPath}</code> يجب تسجيل الدخول</>
                  : <>To access <code className="font-mono bg-slate-100 px-1 rounded">{tryPath}</code> you must log in</>}
              </p>
            </div>

            <div className="space-y-3">
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={isAr ? 'اسم المستخدم' : 'Username'}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder={isAr ? 'كلمة المرور' : 'Password'}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={handleLogin}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
              >
                {isAr ? 'تسجيل الدخول' : 'Log In'}
              </button>
            </div>

            {loginResult === 'wrong' && (
              <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm">
                <XCircle className="w-4 h-4" />
                {isAr ? 'بيانات خاطئة! الوصول مرفوض.' : 'Wrong credentials! Access denied.'}
              </div>
            )}
            {loginResult === 'success' && (
              <div className="mt-3 flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm">
                <CheckCircle className="w-4 h-4" />
                {isAr ? 'تم الدخول بنجاح!' : 'Logged in successfully!'}
              </div>
            )}

            <p className="text-center text-xs text-slate-400 mt-3">
              {isAr
                ? <> تلميح: المستخدم <code className="font-mono">admin</code> وكلمة المرور <code className="font-mono">1234</code></>
                : <>Hint: username <code className="font-mono">admin</code> and password <code className="font-mono">1234</code></>}
            </p>
          </div>
        )}

        {loggedIn && (
          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">{pageInfo?.icon || '🔓'}</span>
            </div>
            <h3 className="font-bold text-slate-800 text-lg">
              {isAr ? pageInfo?.label : pageInfo?.labelEn}
            </h3>
            <p className="text-emerald-600 text-sm font-medium mt-1">
              {isAr ? 'تم الدخول بصلاحية المسؤول ✓' : 'Logged in as Admin ✓'}
            </p>
            <p className="text-slate-400 text-xs mt-2">
              {isAr ? 'تم التحقق من هويتك. يمكنك الوصول إلى هذه الصفحة.' : 'Identity verified. You can access this page.'}
            </p>
            <button onClick={resetLogin} className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline">
              {isAr ? 'تسجيل خروج وإعادة المحاولة' : 'Log out and try again'}
            </button>
          </div>
        )}

        {accessDenied && (
          <div className="text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-bold text-slate-800">
              {isAr ? 'وصول مرفوض' : 'Access Denied'}
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              {isAr
                ? <> الصفحة <code className="font-mono bg-slate-100 px-1 rounded text-xs">{tryPath}</code> محجوبة</>
                : <>The page <code className="font-mono bg-slate-100 px-1 rounded text-xs">{tryPath}</code> is blocked</>}
            </p>
          </div>
        )}

        {openAccess && !loggedIn && (
          <div className="text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">{pageInfo?.icon || '📄'}</span>
            </div>
            <h3 className="font-bold text-slate-800">
              {pageInfo ? (isAr ? pageInfo.label : pageInfo.labelEn) : tryPath}
            </h3>
            {isProtectedPage && !protectEnabled && (
              <div className="mt-3 flex items-center gap-2 justify-center text-red-600 bg-red-50 rounded-xl px-4 py-2 text-xs border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                {isAr ? 'أي شخص يستطيع الوصول لهذه الصفحة الحساسة!' : 'Anyone can access this sensitive page!'}
              </div>
            )}
            {!isProtectedPage && (
              <p className="text-slate-400 text-xs mt-1">
                {isAr ? 'صفحة عامة — متاحة للجميع' : 'Public page — accessible to everyone'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Page5Defense() {
  const { lang } = useApp()
  const isAr = lang === 'ar'
  const [loginEnabled,   setLoginEnabled]   = useState(false)
  const [protectEnabled, setProtectEnabled] = useState(false)
  const [tryPath,        setTryPath]        = useState('/admin')
  const [loginDone,      setLoginDone]      = useState(false)
  const navigate = useNavigate()

  const isFullyProtected = loginEnabled && protectEnabled

  const explanations = []
  if (loginEnabled) {
    explanations.push({
      icon: '🔐',
      title: isAr ? 'صفحة تسجيل الدخول' : 'Login Page',
      text: isAr
        ? 'أضفت صفحة تسجيل دخول تمنع الوصول المباشر للصفحات الحساسة. أي زيارة لهذه الصفحات ستوجّه المستخدم لتسجيل الدخول أولاً.'
        : 'A login page now redirects visitors before they can access sensitive pages.',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    })
  }
  if (protectEnabled) {
    explanations.push({
      icon: '🛡️',
      title: isAr ? 'حماية المسارات' : 'Route Protection',
      text: isAr
        ? 'أصبحت الصفحات الحساسة تتطلب صلاحيات خاصة للوصول. بدون بيانات صحيحة، سيُرفض الوصول تلقائياً.'
        : 'Sensitive pages now require proper authorization. Without valid credentials, access is automatically denied.',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    })
  }

  return (
    <div className="page-transition max-w-6xl mx-auto px-4 py-8" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-8">
        <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
          {isAr ? 'درس ٦' : 'Lesson 6'}
        </span>
        <h1 className="text-3xl font-black text-slate-800 mt-2 mb-2">
          {isAr ? 'مختبر الحماية' : 'Defense Lab'}
        </h1>
      </div>

      {/* Security status bar */}
      <div className={`rounded-2xl p-4 mb-6 flex items-center gap-4 transition-all ${
        isFullyProtected ? 'bg-emerald-50 border-2 border-emerald-300' : 'bg-red-50 border-2 border-red-200'
      }`}>
        {isFullyProtected
          ? <Shield className="w-8 h-8 text-emerald-600 shield-glow flex-shrink-0" />
          : <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />}
        <div>
          <p className={`font-bold text-sm ${isFullyProtected ? 'text-emerald-800' : 'text-red-700'}`}>
            {isFullyProtected
              ? (isAr ? '✅ الموقع محمي بشكل كامل!' : '✅ Site is fully protected!')
              : (isAr ? '⚠️ الموقع غير محمي — الصفحات الحساسة مكشوفة' : '⚠️ Site unprotected — sensitive pages are exposed')}
          </p>
          <p className={`text-xs ${isFullyProtected ? 'text-emerald-600' : 'text-red-500'}`}>
            {isFullyProtected
              ? (isAr ? 'تم تفعيل جميع وسائل الحماية. أداء ممتاز!' : 'All protections activated. Excellent!')
              : (isAr ? 'فعّل وسائل الحماية أدناه لتأمين الموقع' : 'Enable security measures below to protect the site')}
          </p>
        </div>
        <div className={`${isAr ? 'mr-auto' : 'ml-auto'} flex gap-2`}>
          <div className={`w-3 h-3 rounded-full ${loginEnabled   ? 'bg-emerald-500' : 'bg-red-400'}`} />
          <div className={`w-3 h-3 rounded-full ${protectEnabled ? 'bg-emerald-500' : 'bg-red-400'}`} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Controls Panel */}
        <div className="col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              {isAr ? 'وسائل الحماية' : 'Security Controls'}
            </h2>
            <p className="text-slate-400 text-xs mb-4">
              {isAr ? 'انقر على كل حماية لتفعيلها أو إيقافها' : 'Click each control to enable or disable it'}
            </p>

            <div className="space-y-3">
              <ToggleSwitch
                enabled={loginEnabled}
                onChange={() => setLoginEnabled(!loginEnabled)}
                label={isAr ? 'إضافة صفحة تسجيل الدخول' : 'Add Login Page'}
                desc={isAr
                  ? 'إنشاء صفحة login تُعيد توجيه الزوار قبل دخول الصفحات الحساسة'
                  : 'Create a login page that redirects visitors before accessing sensitive pages'}
                color="indigo"
              />
              <ToggleSwitch
                enabled={protectEnabled}
                onChange={() => setProtectEnabled(!protectEnabled)}
                label={isAr ? 'حماية الصفحات الحساسة' : 'Protect Sensitive Pages'}
                desc={isAr
                  ? 'منع الوصول المباشر لصفحات مثل /admin و/employees إلا بعد التحقق'
                  : 'Prevent direct access to pages like /admin and /employees without authentication'}
                color="emerald"
              />
            </div>
          </div>

          {/* Page selector */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-700 text-sm mb-3">
              {isAr ? 'اختر صفحة لتجربتها:' : 'Choose a page to test:'}
            </h3>

            <div className="space-y-2">
              <div>
                <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {isAr ? 'صفحات عامة (لا تحتاج حماية)' : 'Public pages (no protection needed)'}
                </p>
                {PUBLIC_PAGES.map(p => (
                  <button
                    key={p.path}
                    onClick={() => setTryPath(p.path)}
                    className={`w-full ${isAr ? 'text-right' : 'text-left'} flex items-center gap-2 px-3 py-2 rounded-xl text-sm mb-1 transition-all ${
                      tryPath === p.path ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{isAr ? p.label : p.labelEn}</span>
                    <code className={`text-xs font-mono opacity-60 ${isAr ? 'mr-auto' : 'ml-auto'}`}>{p.path}</code>
                  </button>
                ))}
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  {isAr ? 'صفحات حساسة (يجب حمايتها)' : 'Sensitive pages (must be protected)'}
                </p>
                {PROTECTED_PAGES.map(p => (
                  <button
                    key={p.path}
                    onClick={() => setTryPath(p.path)}
                    className={`w-full ${isAr ? 'text-right' : 'text-left'} flex items-center gap-2 px-3 py-2 rounded-xl text-sm mb-1 transition-all ${
                      tryPath === p.path ? 'bg-orange-100 text-orange-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{isAr ? p.label : p.labelEn}</span>
                    <code className={`text-xs font-mono opacity-60 ${isAr ? 'mr-auto' : 'ml-auto'}`}>{p.path}</code>
                    <AlertTriangle className="w-3 h-3 text-orange-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Simulation */}
        <div className="col-span-7 space-y-4">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {isAr ? 'المحاكاة الحية' : 'Live Simulation'}
              </h3>
              <div className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                isFullyProtected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
              }`}>
                {isFullyProtected
                  ? (isAr ? '🔒 محمي' : '🔒 Protected')
                  : (isAr ? '🔓 غير محمي' : '🔓 Unprotected')}
              </div>
            </div>
            <SimulatedBrowser
              tryPath={tryPath}
              loginEnabled={loginEnabled}
              protectEnabled={protectEnabled}
              onLogin={() => setLoginDone(true)}
              isAr={isAr}
            />
          </div>

          {/* Explanations */}
          {explanations.length > 0 && (
            <div className="space-y-3">
              {explanations.map((exp, i) => (
                <div key={i} className={`${exp.color} border rounded-2xl p-4 slide-in`}>
                  <h4 className="font-bold text-sm flex items-center gap-2 mb-1">
                    <span>{exp.icon}</span>
                    {exp.title}
                  </h4>
                  <p className="text-sm leading-relaxed opacity-80">{exp.text}</p>
                </div>
              ))}
            </div>
          )}

          {!loginEnabled && !protectEnabled && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-amber-800 text-sm font-medium">
                {isAr
                  ? <> 💡 جرب الوصول لصفحة مثل <code className="font-mono bg-amber-100 px-1 rounded">/admin</code> الآن — ستدخل مباشرة بدون أي تحقق! ثم فعّل الحمايات وشاهد الفرق.</>
                  : <> 💡 Try accessing a page like <code className="font-mono bg-amber-100 px-1 rounded">/admin</code> now — you'll get in without any verification! Then enable protections and see the difference.</>}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Final Summary */}
      {isFullyProtected && loginDone && (
        <div className="mt-8 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-8 text-center slide-in">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-emerald-800 mb-3">
            {isAr ? 'أحسنت! أكملت جميع الدروس!' : 'Well done! You completed all lessons!'}
          </h2>
          <p className="text-emerald-700 text-sm leading-relaxed max-w-2xl mx-auto mb-6">
            {isAr
              ? 'لقد تعلمت كيف تعمل مكونات المواقع، وكيف تعمل المسارات والصفحات المخفية، وكيف تعمل أدوات الاكتشاف مثل كاشف، وما هي ثغرة IDOR، وكيف نحمي المواقع بتسجيل الدخول والتحقق من الصلاحيات.'
              : 'You learned how website components work, how routes and hidden pages function, how discovery tools like Kashif work, what the IDOR vulnerability is, and how to protect websites with login and authorization checks.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md"
          >
            <Home className="w-4 h-4" />
            {isAr ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
          </button>
        </div>
      )}

      {/* explanation — collapsed by default, sits under the practical part */}
      <div className="mt-8">
        <Explanation>
          <p className="text-slate-500 mb-4">
            {isAr
              ? 'طبّق وسائل الحماية بنفسك وشاهد كيف يتغير سلوك الموقع فوراً'
              : 'Apply security measures yourself and watch how the site behavior changes instantly'}
          </p>
          {/* Key Takeaways */}
          <div className="bg-slate-800 text-white rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              {isAr ? 'أهم ما تعلمناه في هذه الرحلة' : 'Key Takeaways'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300">
              {[
                ['🧩', 'المواقع تُبنى من مكونات: عناوين، فقرات، صور، أزرار، وروابط',                    'Websites are built from components: headings, paragraphs, images, buttons, and links'],
                ['🗺️', 'كل صفحة لها مسار URL مثل /home و/admin حتى لو لم تكن مرئية',                   "Every page has a URL path like /home and /admin — even if it's not visible in navigation"],
                ['🔍', 'أدوات مثل كاشف تكتشف الصفحات المخفية من خلال التخمين المنظّم',                  'Tools like Kashif discover hidden pages through systematic guessing'],
                ['⚠️', 'ثغرة IDOR تسمح بالوصول لبيانات شخص آخر بتغيير رقم ID فقط',                    "The IDOR vulnerability lets users access another person's data by changing an ID number"],
                ['🔐', 'الحماية الصحيحة تتطلب تسجيل دخول والتحقق من صلاحيات كل مستخدم',               "Proper protection requires authentication and checking each user's permissions"],
                ['🛡️', 'دور متخصص الأمن هو اكتشاف هذه الثغرات قبل المهاجمين وإصلاحها',               "A security specialist's role is to find these vulnerabilities before attackers do, and fix them"],
              ].map(([icon, textAr, textEn], i) => (
                <div key={i} className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2">
                  <span>{icon}</span>
                  <span className="text-xs leading-relaxed">{isAr ? textAr : textEn}</span>
                </div>
              ))}
            </div>
          </div>
        </Explanation>
      </div>

      {/* Navigation */}
      <div className="flex items-center mt-8 pt-6 border-t border-slate-100">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">
          {isAr ? '← الرئيسية' : '← Home'}
        </button>
      </div>
    </div>
  )
}
