import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { EyeOff, Globe, AlertTriangle } from 'lucide-react'
import { MOCK_EMPLOYEES, MOCK_CUSTOMERS } from '../data/pageContents'
import { useApp } from '../context/AppContext'
import Explanation from '../components/Explanation'

const VISIBLE_PAGES = [
  { path: '/home', labelAr: 'الرئيسية', labelEn: 'Home', icon: '🏠', descAr: 'الصفحة الرئيسية للموقع', descEn: 'Website homepage', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { path: '/about', labelAr: 'من نحن', labelEn: 'About', icon: '👥', descAr: 'معلومات عن الموقع والفريق', descEn: 'About the company and team', color: 'bg-green-50 border-green-200 text-green-700' },
  { path: '/contact', labelAr: 'تواصل معنا', labelEn: 'Contact', icon: '📬', descAr: 'بيانات التواصل', descEn: 'Contact information', color: 'bg-purple-50 border-purple-200 text-purple-700' },
]

const HIDDEN_PAGES = [
  { path: '/admin', labelAr: 'لوحة التحكم', labelEn: 'Admin Panel', icon: '⚙️', descAr: 'إدارة الموقع - حساسة جداً', descEn: 'Site management - very sensitive', sensitive: true, color: 'bg-red-50 border-red-300 text-red-700' },
  { path: '/employees', labelAr: 'الموظفون', labelEn: 'Employees', icon: '👔', descAr: 'قائمة موظفي الشركة', descEn: 'Company employee list', sensitive: true, color: 'bg-orange-50 border-orange-300 text-orange-700' },
  { path: '/customers', labelAr: 'العملاء', labelEn: 'Customers', icon: '🏢', descAr: 'قاعدة بيانات العملاء', descEn: 'Customer database', sensitive: true, color: 'bg-orange-50 border-orange-300 text-orange-700' },
  { path: '/challenge', labelAr: 'التحدي', labelEn: 'Challenge', icon: '🎯', descAr: 'صفحة تحدي مخفية', descEn: 'Hidden challenge page', sensitive: false, color: 'bg-yellow-50 border-yellow-300 text-yellow-700' },
  { path: '/flag', labelAr: 'العلم السري', labelEn: 'Secret Flag', icon: '🚩', descAr: 'رمز سري في الموقع', descEn: 'Secret code in the site', sensitive: true, color: 'bg-red-50 border-red-300 text-red-700' },
  { path: '/final', labelAr: 'النهاية', labelEn: 'Final', icon: '🏆', descAr: 'الصفحة الختامية', descEn: 'Final page', sensitive: false, color: 'bg-indigo-50 border-indigo-300 text-indigo-700' },
]

const ALL_PAGES = [...VISIBLE_PAGES, ...HIDDEN_PAGES]

function BrowserBar({ url, onNavigate }) {
  const [inputVal, setInputVal] = useState(`https://orbyx.store${url}`)

  useEffect(() => {
    setInputVal(`https://orbyx.store${url}`)
  }, [url])

  const handleNavigate = () => {
    let path = inputVal.trim()
    if (path.includes('orbyx.store')) {
      path = path.replace(/https?:\/\/orbyx\.store/, '')
    }
    if (!path) path = '/home'
    if (!path.startsWith('/')) path = '/' + path
    onNavigate(path)
  }

  return (
    <div className="bg-slate-100 rounded-xl px-4 py-2.5 flex items-center gap-3" dir="ltr">
      <div className="flex gap-1.5 flex-shrink-0">
        <div className="w-3 h-3 rounded-full bg-red-400"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
        <div className="w-3 h-3 rounded-full bg-green-400"></div>
      </div>
      <div className="flex-1 bg-white rounded-lg flex items-center gap-2 px-3 py-1.5 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-300">
        <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <input
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleNavigate()}
          className="flex-1 text-sm font-mono text-slate-700 bg-transparent outline-none"
          dir="ltr"
        />
        <button
          onClick={handleNavigate}
          className="text-indigo-500 hover:text-indigo-700 text-xs font-bold px-1.5 py-0.5 bg-indigo-50 rounded transition-colors"
        >
          ↵
        </button>
      </div>
    </div>
  )
}

const REVENUE_DATA = [
  { month: 'يناير', monthEn: 'January', amount: 18500 },
  { month: 'فبراير', monthEn: 'February', amount: 22000 },
  { month: 'مارس', monthEn: 'March', amount: 19800 },
  { month: 'أبريل', monthEn: 'April', amount: 25000 },
  { month: 'مايو', monthEn: 'May', amount: 21700 },
  { month: 'يونيو', monthEn: 'June', amount: 17000 },
]

function PageView({ path, lang }) {
  const [adminPanel, setAdminPanel] = useState(null)
  const [revenues, setRevenues] = useState(REVENUE_DATA)
  const pageData = ALL_PAGES.find(p => p.path === path)

  if (!pageData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <div className="text-5xl mb-3">❌</div>
        <p className="text-lg font-bold text-red-500">404 — {lang === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found'}</p>
        <p className="text-sm mt-1 font-mono text-slate-400">{path}</p>
      </div>
    )
  }

  if (path === '/home') {
    return (
      <div>
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl p-6 mb-4">
          <h2 className="text-2xl font-black mb-2">{lang === 'ar' ? 'مرحباً بك في Orbyx' : 'Welcome to Orbyx'}</h2>
          <p className="text-indigo-200 text-sm">{lang === 'ar' ? 'متجرك الرقمي الموثوق في قطر' : 'Your trusted digital store in Qatar'}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[['📦', lang === 'ar' ? 'منتجاتنا' : 'Products', '245+'], ['⭐', lang === 'ar' ? 'تقييم العملاء' : 'Rating', '4.9'], ['🚚', lang === 'ar' ? 'توصيل سريع' : 'Fast Delivery', '24h']].map(([icon, label, val]) => (
            <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-2xl">{icon}</div>
              <p className="font-bold text-slate-800 text-sm">{val}</p>
              <p className="text-slate-400 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (path === '/about') {
    return (
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-3">{lang === 'ar' ? 'من نحن' : 'About Us'}</h2>
        <p className="text-slate-600 text-sm leading-relaxed mb-3">
          {lang === 'ar'
            ? 'شركة Orbyx هي شركة تقنية قطرية تأسست في عام 2020. نقدم حلولاً رقمية متكاملة للأفراد والشركات.'
            : 'Orbyx is a Qatari tech company founded in 2020. We provide integrated digital solutions for individuals and businesses.'}
        </p>
        <div className="flex gap-3">
          {[['🏢', lang === 'ar' ? 'الدوحة' : 'Doha'], ['👥', '50+'], ['🌍', lang === 'ar' ? 'منذ 2020' : 'Since 2020']].map(([icon, t]) => (
            <div key={t} className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-center">
              <div className="text-xl">{icon}</div>
              <p className="text-blue-700 text-xs font-bold">{t}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (path === '/contact') {
    return (
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">{lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}</h2>
        <div className="space-y-3">
          {[
            ['📧', lang === 'ar' ? 'البريد' : 'Email', 'info@orbyx.store'],
            ['📞', lang === 'ar' ? 'الهاتف' : 'Phone', '+974-4455-0000'],
            ['📍', lang === 'ar' ? 'العنوان' : 'Address', lang === 'ar' ? 'الدوحة، قطر' : 'Doha, Qatar'],
          ].map(([icon, label, val]) => (
            <div key={label} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <span className="text-xl">{icon}</span>
              <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-slate-700 text-sm font-medium font-mono">{val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (path === '/employees') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-bold text-slate-800">{lang === 'ar' ? 'قائمة الموظفين' : 'Employee List'}</h2>
          <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">{lang === 'ar' ? 'سري' : 'Confidential'}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-3 py-2 text-right font-bold text-slate-600">ID</th>
                <th className="px-3 py-2 text-right font-bold text-slate-600">{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                <th className="px-3 py-2 text-right font-bold text-slate-600">{lang === 'ar' ? 'الوظيفة' : 'Role'}</th>
                <th className="px-3 py-2 text-right font-bold text-slate-600">{lang === 'ar' ? 'الراتب' : 'Salary'}</th>
                <th className="px-3 py-2 text-right font-bold text-slate-600">{lang === 'ar' ? 'البريد' : 'Email'}</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_EMPLOYEES.map(e => (
                <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-slate-400">{e.id}</td>
                  <td className="px-3 py-2 font-semibold text-slate-700">{lang === 'ar' ? e.name : e.nameEn}</td>
                  <td className="px-3 py-2 text-slate-500">{lang === 'ar' ? e.role : e.roleEn}</td>
                  <td className="px-3 py-2 font-bold text-emerald-600">{e.salary} {lang === 'ar' ? 'ر.ق' : 'QAR'}</td>
                  <td className="px-3 py-2 font-mono text-indigo-600">{e.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (path === '/customers') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-bold text-slate-800">{lang === 'ar' ? 'قاعدة بيانات العملاء' : 'Customer Database'}</h2>
          <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">{lang === 'ar' ? 'سري' : 'Confidential'}</span>
        </div>
        <div className="space-y-2">
          {MOCK_CUSTOMERS.map(c => (
            <div key={c.id} className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600 text-xs">{c.id}</div>
              <div className="flex-1">
                <p className="font-bold text-slate-700 text-sm">{lang === 'ar' ? c.name : c.nameEn}</p>
                <p className="text-slate-400 text-xs">{lang === 'ar' ? c.contact : c.contactEn} • {c.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">{lang === 'ar' ? 'الطلبات' : 'Orders'}: <strong>{c.orders}</strong></p>
                <p className="text-xs font-bold text-emerald-600">{c.total}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (path === '/admin') {
    const ar = lang === 'ar'
    const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0)
    const totalK = Math.round(totalRevenue / 1000)
    const ADMIN_STATS = [
      { id: 'users',   icon: '👥', labelAr: 'المستخدمون', labelEn: 'Users',    valAr: '1,247',              valEn: '1,247',           clickable: true  },
      { id: 'orders',  icon: '📦', labelAr: 'الطلبات',    labelEn: 'Orders',   valAr: '89',                 valEn: '89',              clickable: false },
      { id: 'revenue', icon: '💰', labelAr: 'الإيرادات',  labelEn: 'Revenue',  valAr: `${totalK}K ر.ق`,    valEn: `QAR ${totalK}K`,  clickable: true  },
      { id: 'settings',icon: '⚙️', labelAr: 'الإعدادات',  labelEn: 'Settings', valAr: 'نشط',               valEn: 'Active',          clickable: false },
    ]
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-800">{ar ? 'لوحة التحكم' : 'Admin Dashboard'}</h2>
          {adminPanel && (
            <button onClick={() => setAdminPanel(null)}
              className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors">
              {ar ? '← رجوع' : '← Back'}
            </button>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {ADMIN_STATS.map(stat => (
            <div key={stat.id}
              onClick={() => stat.clickable && setAdminPanel(adminPanel === stat.id ? null : stat.id)}
              className={`border rounded-xl p-3 transition-all ${
                stat.clickable
                  ? `cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 ${adminPanel === stat.id ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300' : 'bg-slate-50 border-slate-200'}`
                  : 'bg-slate-50 border-slate-200 cursor-default'
              }`}>
              <div className="flex items-center gap-2">
                <span>{stat.icon}</span>
                <span className="text-xs text-slate-500">{ar ? stat.labelAr : stat.labelEn}</span>
                {stat.clickable && <span className="ml-auto text-indigo-400 text-xs font-bold">↗</span>}
              </div>
              <p className="font-bold text-slate-800 text-sm mt-1">{ar ? stat.valAr : stat.valEn}</p>
            </div>
          ))}
        </div>

        {/* Users panel */}
        {adminPanel === 'users' && (
          <div className="border border-indigo-200 rounded-xl overflow-hidden">
            <div className="bg-indigo-600 px-3 py-2">
              <p className="text-white font-bold text-xs">👥 {ar ? 'بيانات المستخدمين (عينة)' : 'User Data (Sample)'}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" dir="ltr">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-3 py-1.5 text-left font-bold text-slate-600">ID</th>
                    <th className="px-3 py-1.5 text-left font-bold text-slate-600">{ar ? 'الاسم' : 'Name'}</th>
                    <th className="px-3 py-1.5 text-left font-bold text-slate-600">{ar ? 'الوظيفة' : 'Role'}</th>
                    <th className="px-3 py-1.5 text-left font-bold text-slate-600">{ar ? 'البريد' : 'Email'}</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_EMPLOYEES.map(e => (
                    <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-1.5 font-mono text-slate-400">{e.id}</td>
                      <td className="px-3 py-1.5 font-semibold text-slate-700">{ar ? e.name : e.nameEn}</td>
                      <td className="px-3 py-1.5 text-slate-500">{ar ? e.role : e.roleEn}</td>
                      <td className="px-3 py-1.5 font-mono text-indigo-600 text-xs">{e.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 px-3 py-2 border-t border-slate-100">
              {ar ? '* إجمالي المستخدمين المسجلين: 1,247' : '* Total registered users: 1,247'}
            </p>
          </div>
        )}

        {/* Revenue panel */}
        {adminPanel === 'revenue' && (
          <div className="border border-emerald-200 rounded-xl overflow-hidden">
            <div className="bg-emerald-600 px-3 py-2 flex items-center justify-between">
              <p className="text-white font-bold text-xs">💰 {ar ? 'تفاصيل الإيرادات' : 'Revenue Details'}</p>
              <span className="text-white/80 text-xs font-mono" dir="ltr">
                {ar ? `${totalRevenue.toLocaleString()} ر.ق` : `QAR ${totalRevenue.toLocaleString()}`}
              </span>
            </div>
            <div className="p-3 space-y-2">
              {revenues.map((r, i) => (
                <div key={i} className="flex items-center gap-2" dir="ltr">
                  <span className="text-xs text-slate-500 w-20 flex-shrink-0 text-right">{ar ? r.month : r.monthEn}</span>
                  <input
                    type="number"
                    value={r.amount}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0
                      setRevenues(prev => prev.map((x, j) => j === i ? { ...x, amount: val } : x))
                    }}
                    className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-300 text-right"
                  />
                  <span className="text-xs text-slate-400 flex-shrink-0">{ar ? 'ر.ق' : 'QAR'}</span>
                </div>
              ))}
            </div>
            <div className="px-3 py-2 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
              <span className="text-xs text-emerald-700 font-bold">{ar ? 'المجموع' : 'Total'}</span>
              <span className="text-sm font-black text-emerald-700" dir="ltr">
                {ar ? `${totalRevenue.toLocaleString()} ر.ق` : `QAR ${totalRevenue.toLocaleString()}`}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (path === '/flag') {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-3">🚩</div>
        <p className="font-bold text-slate-800 text-lg mb-2">{lang === 'ar' ? 'وجدت الرمز السري!' : 'You found the secret flag!'}</p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 inline-block">
          <code className="font-mono text-red-600 font-bold">FLAG{'{hidden_page_found}'}</code>
        </div>
        <p className="text-slate-400 text-xs mt-3">{lang === 'ar' ? 'هذه صفحة حساسة! يجب حمايتها.' : 'This is a sensitive page! It must be protected.'}</p>
      </div>
    )
  }

  if (path === '/challenge') {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-3">🎯</div>
        <p className="font-bold text-slate-800 text-lg">{lang === 'ar' ? 'تحدي الأمن' : 'Security Challenge'}</p>
        <p className="text-slate-500 text-sm mt-2">{lang === 'ar' ? 'وجدت الصفحة المخفية! هل تستطيع إيجاد /flag أيضاً؟' : 'You found the hidden page! Can you find /flag too?'}</p>
      </div>
    )
  }

  if (path === '/final') {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-3">🏆</div>
        <p className="font-bold text-slate-800 text-lg">{lang === 'ar' ? 'الصفحة الختامية' : 'Final Page'}</p>
        <p className="text-slate-500 text-sm mt-2">{lang === 'ar' ? 'أحسنت! اكتشفت جميع الصفحات المخفية.' : 'Well done! You discovered all hidden pages.'}</p>
      </div>
    )
  }

  return (
    <div className="text-center py-8">
      <div className="text-4xl mb-3">{pageData.icon}</div>
      <h2 className="text-xl font-bold text-slate-800">{lang === 'ar' ? pageData.labelAr : pageData.labelEn}</h2>
      <p className="text-slate-500 text-sm mt-1">{lang === 'ar' ? pageData.descAr : pageData.descEn}</p>
    </div>
  )
}

export default function Page2Routes() {
  const [activePage, setActivePage] = useState('/home')
  const [discovered, setDiscovered] = useState([])   // hidden paths found by typing in the address bar
  const navigate = useNavigate()
  const { lang } = useApp()

  const handleNavigate = (path) => {
    setActivePage(path)
    if (HIDDEN_PAGES.some(p => p.path === path)) {
      setDiscovered(prev => prev.includes(path) ? prev : [...prev, path])
    }
  }

  const currentPageData = ALL_PAGES.find(p => p.path === activePage)

  const T = {
    ar: { lesson: 'درس ٣', title: 'المسارات والصفحات المخفية', subtitle: 'تعرف على كيفية عمل مسارات المواقع واكتشف بنفسك أن هناك صفحات موجودة رغم أنها ليست في القائمة', hint: '💡 اكتب أي مسار في شريط العنوان (مثل ‎/something‎) واضغط ↵ لتزور الصفحة — جرّب واكتشف!', routeWhat: 'ما هو المسار (Route)؟', routeExplain: 'المسار هو الجزء من الرابط الذي يأتي بعد اسم الموقع. مثلاً في الرابط', routeIs: 'فإن المسار هو', sensitive: 'هذه صفحة حساسة! لا ينبغي أن يصل إليها أي شخص بدون صلاحية.', menu: 'قائمة الموقع:', foundTitle: 'الصفحات المخفية التي اكتشفتها', foundEmpty: 'لا توجد روابط في قائمة الموقع لهذه الصفحات — عليك تخمين مساراتها! اكتب مسارات محتملة في شريط العنوان بالأعلى (أسماء صفحات تحاول المواقع إخفاءها) واضغط ↵. كل صفحة مخفية تكتشفها ستظهر هنا.', insightTitle: 'الفكرة الأساسية', insight: 'اكتشفت أن هناك صفحات موجودة في الموقع رغم عدم وجود أي رابط لها في القائمة. أي شخص يعرف عنوان الصفحة يستطيع فتحها مباشرة بكتابته في شريط العنوان! لهذا يجب حماية الصفحات الحساسة بكلمة مرور، لا بإخفاء رابطها فقط. في الدرس القادم سنستخدم أداة كاشف لاكتشاف هذه الصفحات تلقائياً.' },
    en: { lesson: 'Lesson 3', title: 'Routes & Hidden Pages', subtitle: 'Learn how website routes work and discover for yourself that pages can exist even though they are not in the menu', hint: '💡 Type any path in the address bar (like /something) and press ↵ to visit the page — guess and discover!', routeWhat: 'What is a Route?', routeExplain: 'A route is the part of the URL that comes after the domain name. For example in', routeIs: 'the route is', sensitive: 'This is a sensitive page! No one should access it without permission.', menu: 'Site menu:', foundTitle: 'Hidden pages you discovered', foundEmpty: 'No links in the site menu point to these pages — you have to guess their paths! Type likely paths in the address bar above (names that sites tend to hide) and press ↵. Every hidden page you discover will appear here.', insightTitle: 'Key Insight', insight: 'You discovered that pages exist on the site even though no link in the menu points to them. Anyone who knows a page’s address can open it directly by typing it in the address bar! That is why sensitive pages must be protected with a password — not just by hiding their link. In the next lesson we will use the Kashif tool to discover such pages automatically.' },
  }
  const t = T[lang]

  return (
    <div className="page-transition max-w-3xl mx-auto px-4 py-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{t.lesson}</span>
        <h1 className="text-3xl font-black text-slate-800 mt-2 mb-2">{t.title}</h1>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-indigo-700 font-medium">
        {t.hint}
      </div>

      {/* The mock website — address bar + the site's real menu + the page content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <BrowserBar url={activePage} onNavigate={handleNavigate} />
        </div>
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 flex-wrap">
          <span className="text-xs text-slate-400 me-1">{t.menu}</span>
          {VISIBLE_PAGES.map(p => (
            <button key={p.path} onClick={() => handleNavigate(p.path)}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${activePage === p.path ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {p.icon} {lang === 'ar' ? p.labelAr : p.labelEn}
            </button>
          ))}
        </div>
        <div className="p-5 min-h-52">
          {currentPageData?.sensitive && (
            <div className="mb-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-xs font-medium">{t.sensitive}</p>
            </div>
          )}
          <PageView path={activePage} lang={lang} />
        </div>
      </div>

      {/* Discovery tracker — records what you find, without revealing the rest */}
      <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-orange-600" /> {t.foundTitle}
          </h3>
          <span className="text-sm font-black text-orange-600">{discovered.length} / {HIDDEN_PAGES.length}</span>
        </div>
        {discovered.length === 0 ? (
          <p className="text-xs text-slate-400 leading-relaxed">{t.foundEmpty}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {discovered.map(path => {
              const p = HIDDEN_PAGES.find(x => x.path === path)
              return (
                <button key={path} onClick={() => handleNavigate(path)}
                  className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 text-xs hover:bg-emerald-100 transition-colors">
                  <span>{p.icon}</span>
                  <code className="font-mono text-emerald-700">{path}</code>
                  {p.sensitive && <AlertTriangle className="w-3 h-3 text-red-500" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Explanation>
        <p className="text-slate-500 text-base mb-4">{t.subtitle}</p>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mb-4">
          <h2 className="font-bold text-blue-800 text-lg mb-2">{t.routeWhat}</h2>
          <p className="text-blue-700 text-sm leading-relaxed mb-3">
            {t.routeExplain} <code className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-xs">https://orbyx.store/admin</code> {t.routeIs} <code className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-xs">/admin</code>
          </p>
          <div className="bg-white rounded-xl p-3 font-mono text-sm" dir="ltr">
            <span className="text-slate-400">https://orbyx.store</span>
            <span className="text-indigo-600 font-bold">/admin</span>
            <span className="text-amber-500 text-xs mr-3">← {lang === 'ar' ? 'المسار' : 'route'}</span>
          </div>
        </div>

        {discovered.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
              <span>💡</span> {t.insightTitle}
            </h3>
            <p className="text-amber-700 text-sm leading-relaxed">{t.insight}</p>
          </div>
        )}
      </Explanation>

      <div className="flex items-center mt-6 pt-6 border-t border-slate-100">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">
          ← {lang === 'ar' ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
