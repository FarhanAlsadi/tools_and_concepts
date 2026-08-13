import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'

// ─── SITE CONSTANTS ───────────────────────────────────────────────────────────

const SITE_URL    = 'http://meridian-corp.com'
const ADMIN_EMAIL = 'khalid@meridian-corp.com'
const ADMIN_PASS  = 'meridian2024'

// ─── DATA ─────────────────────────────────────────────────────────────────────

const EMPLOYEES = [
  { name:'Khalid Al Ali',     nameAr:'خالد العلي',       role:'CEO',               roleAr:'المدير التنفيذي',      salary:85000 },
  { name:'Noura Al Mansoori', nameAr:'نورة المنصوري',    role:'CFO',               roleAr:'المدير المالي',         salary:72000 },
  { name:'Ahmed Al Kuwari',   nameAr:'أحمد الكواري',      role:'Lead Developer',    roleAr:'المطور الرئيسي',       salary:68500 },
  { name:'Fatima Al Shamri',  nameAr:'فاطمة الشمري',      role:'Marketing Manager', roleAr:'مدير التسويق',         salary:45000 },
  { name:'Saad Al Dosari',    nameAr:'سعد الدوسري',       role:'Sales Manager',     roleAr:'مدير المبيعات',        salary:42000 },
  { name:'Mona Al Qahtani',   nameAr:'منى القحطاني',      role:'HR Manager',        roleAr:'مدير الموارد البشرية', salary:38000 },
]

const CONTRACTS = [
  { company:'Qatar Data Corp',        companyAr:'شركة بيانات قطر',         value:2500000, status:'Active',    statusAr:'نشط'    },
  { company:'Gulf Tech Group',        companyAr:'مجموعة الخليج التقنية',    value:1800000, status:'Active',    statusAr:'نشط'    },
  { company:'Ministry of Transport',  companyAr:'وزارة المواصلات',          value:1200000, status:'Completed', statusAr:'مكتمل'  },
  { company:'Qatar First Bank',       companyAr:'بنك قطر الأول',            value:950000,  status:'Active',    statusAr:'نشط'    },
  { company:'Al Rumailah Hospital',   companyAr:'مستشفى الرميلة',           value:780000,  status:'Pending',   statusAr:'معلق'   },
]

const CHALLENGES = [
  {
    id: 1, icon: '📧',
    q:   'What is the admin login username (email)?',
    qAr: 'ما هو اسم المستخدم (البريد الإلكتروني) لتسجيل الدخول؟',
    hint:   'Visit the /contact page and read carefully.',
    hintAr: 'تفضل صفحة /contact وتمعن فيها جيداً.',
    check: v => v.trim().toLowerCase() === ADMIN_EMAIL,
  },
  {
    id: 2, icon: '🔑',
    q:   'What is the admin password?',
    qAr: 'ما هي كلمة مرور المسؤول؟',
    hint:   'Use barq in the terminal. Example: barq <user> <wordlist> <url>',
    hintAr: 'استخدم barq في الطرفية. مثال: barq <مستخدم> <قائمة> <رابط>',
    check: v => v.trim() === ADMIN_PASS,
  },
  {
    id: 3, icon: '👑',
    q:   'Who is the CEO / owner of the company?',
    qAr: 'من هو المدير التنفيذي / مالك الشركة؟',
    hint:   'Visit the /about page.',
    hintAr: 'تفضل صفحة /about.',
    check: v => v.trim().toLowerCase().includes('khalid') || v.trim().includes('خالد'),
  },
  {
    id: 4, icon: '💰',
    q:   'Who is the highest-paid employee? (full name)',
    qAr: 'من هو الموظف الأعلى راتباً؟ (الاسم الكامل)',
    hint:   'Log in first, then visit /admin/employees.',
    hintAr: 'سجّل الدخول أولاً ثم تفضل /admin/employees.',
    check: v => v.trim().toLowerCase().includes('khalid') || v.trim().includes('خالد'),
  },
  {
    id: 5, icon: '🤝',
    q:   'Which company has the highest contract value?',
    qAr: 'أي شركة لديها أعلى قيمة عقد؟',
    hint:   'Log in, then visit /admin/contracts.',
    hintAr: 'سجّل الدخول ثم تفضل /admin/contracts.',
    check: v => v.trim().toLowerCase().includes('qatar data') || v.trim().includes('بيانات قطر'),
  },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmtQAR = n => n.toLocaleString() + ' QAR'

const BARQ_TRIES = [
  'password','password1','password123','123456','12345678',
  'admin','admin123','letmein','qwerty123','meridian123',
  'qatar2024','admin@2024','meridian@2024','khalid123',
  ADMIN_PASS,
]

const DIRB_PATHS = [
  ['/',                  '200 OK',           'found'],
  ['/about',             '200 OK',           'found'],
  ['/contact',           '200 OK',           'found'],
  ['/services',          '200 OK',           'found'],
  ['/login',             '200 OK',           'found'],
  ['/wp-admin',          '404 Not Found',    'miss'],
  ['/phpmyadmin',        '404 Not Found',    'miss'],
  ['/robots.txt',        '200 OK',           'found'],
  ['/admin',             '401 Unauthorized', 'warn'],
  ['/admin/employees',   '401 Unauthorized', 'warn'],
  ['/admin/contracts',   '401 Unauthorized', 'warn'],
  ['/admin/settings',    '401 Unauthorized', 'warn'],
]

const CURL_PAGES = {
  '/':        `HTTP/1.1 200 OK\n\n<html>\n  <title>Meridian Solutions</title>\n  <h1>Welcome to Meridian</h1>\n  <p>Leading technology solutions in Qatar since 2015.</p>\n</html>`,
  '/about':   `HTTP/1.1 200 OK\n\n<html>\n  <title>About Us</title>\n  <h1>About Meridian</h1>\n  <p>Founded in 2015 by <strong>Khalid Al Ali</strong></p>\n  <p>HQ: West Bay, Doha, Qatar</p>\n</html>`,
  '/contact': `HTTP/1.1 200 OK\n\n<html>\n  <title>Contact Us</title>\n  <h1>Contact Us</h1>\n  <p>📧 khalid@meridian-corp.com</p>\n  <p>📞 +974 4444 7788</p>\n  <p>📍 West Bay, Doha, Qatar</p>\n</html>`,
  '/admin':         `HTTP/1.1 401 Unauthorized\n\nAccess denied. Please authenticate at /login`,
  '/login':         `HTTP/1.1 200 OK\n\n<html>\n  <form action="/login" method="POST">\n    <input name="username" type="email"/>\n    <input name="password" type="password"/>\n    <button>Login</button>\n  </form>\n</html>`,
  '/api/profile':   `HTTP/1.1 200 OK\n\n⚠️  IDOR Vulnerability Detected!\nThis endpoint returns any employee profile without authorization checks.\nTry: /api/profile?id=1 through /api/profile?id=6`,
}

// ─── KASHIF PATHS ─────────────────────────────────────────────────────────────

const KASHIF_PATHS = [
  { path: '/',                  kind: 'found', statusEn: '200 OK',           statusAr: '200 موجودة'   },
  { path: '/about',             kind: 'found', statusEn: '200 OK',           statusAr: '200 موجودة'   },
  { path: '/contact',           kind: 'found', statusEn: '200 OK',           statusAr: '200 موجودة'   },
  { path: '/services',          kind: 'found', statusEn: '200 OK',           statusAr: '200 موجودة'   },
  { path: '/blog',              kind: 'miss',  statusEn: '404 Not Found',    statusAr: '404 غير موجودة'},
  { path: '/login',             kind: 'found', statusEn: '200 OK',           statusAr: '200 موجودة'   },
  { path: '/register',          kind: 'miss',  statusEn: '404 Not Found',    statusAr: '404 غير موجودة'},
  { path: '/admin',             kind: 'warn',  statusEn: '401 Unauthorized', statusAr: '401 محمية!'   },
  { path: '/admin/employees',   kind: 'warn',  statusEn: '401 Unauthorized', statusAr: '401 محمية!'   },
  { path: '/admin/contracts',   kind: 'warn',  statusEn: '401 Unauthorized', statusAr: '401 محمية!'   },
  { path: '/robots.txt',        kind: 'found', statusEn: '200 OK',           statusAr: '200 موجودة'   },
  { path: '/api/v1',            kind: 'miss',  statusEn: '404 Not Found',    statusAr: '404 غير موجودة'},
  { path: '/api/profile',      kind: 'found', statusEn: '200 OK',           statusAr: '200 موجودة'   },
]

// ─── SIMULATED FILESYSTEM ─────────────────────────────────────────────────────

const PENTEST_FS = {
  'Desktop': {
    type: 'dir',
    children: {
      'notes.txt': {
        type: 'file',
        content: `مهمة اليوم: اختبار اختراق meridian-corp.com
- اكتشف الصفحات المخفية: kashif pages.txt meridian-corp.com
- ابحث عن البريد الإلكتروني للمسؤول في صفحة /contact
- استخدم barq لكسر كلمة المرور: barq khalid@meridian-corp.com passwords.txt meridian-corp.com
- سجّل الدخول واستخرج بيانات الموظفين والعقود`,
      },
      'pages.txt': {
        type: 'file',
        content: [
          '/','/about','/contact','/services','/blog','/login','/register',
          '/admin','/admin/employees','/admin/contracts','/robots.txt','/api/v1',
          '/home','/index','/index.html','/index.php','/default','/main',
          '/shop','/store','/products','/product','/cart','/checkout',
          '/news','/events','/gallery','/portfolio','/team','/careers',
          '/jobs','/faq','/support','/help','/docs','/documentation',
          '/terms','/privacy','/sitemap','/sitemap.xml','/feed','/rss',
          '/signup','/signin','/logout','/forgot-password','/reset-password',
          '/profile','/account','/dashboard','/settings','/preferences',
          '/admin/login','/admin/dashboard','/admin/settings','/admin/users',
          '/admin/reports','/admin/logs','/admin/backup','/admin/config',
          '/api','/api/v2','/api/v1/users','/api/v1/admin','/api/v1/data',
          '/api/v1/login','/api/v1/token','/api/v1/status','/api/health',
          '/uploads','/files','/assets','/static','/media','/images',
          '/.env','/.git','/config','/config.php','/config.json',
          '/wp-admin','/wp-login.php','/wordpress','/wp-content',
          '/phpmyadmin','/mysql','/database','/db','/sql',
          '/test','/testing','/dev','/development','/staging','/beta',
          '/old','/backup','/bak','/archive','/temp','/tmp',
          '/search','/explore','/discover','/categories','/tags',
          '/user','/users','/members','/member','/guest',
          '/invoice','/invoices','/orders','/order','/payments',
          '/report','/reports','/analytics','/stats','/logs',
          '/cgi-bin','/cgi','/scripts','/bin','/shell',
        ].join('\n'),
      },
      'passwords.txt': {
        type: 'file',
        content: [
          'password','password1','password123','password1234','password12345',
          '123456','1234567','12345678','123456789','1234567890',
          'admin','admin1','admin123','admin1234','admin@123',
          'letmein','letmein1','letmein123',
          'welcome','welcome1','welcome123',
          'qwerty','qwerty1','qwerty123','qwertyuiop',
          'abc123','abc1234','abcdef','abcd1234',
          'iloveyou','sunshine','monkey','dragon','master',
          'pass','pass1','pass123','pass1234',
          'test','test1','test123','testing','testing123',
          'hello','hello1','hello123','hello1234',
          'login','login1','login123',
          'user','user1','user123','user1234',
          'guest','guest1','guest123',
          'root','root1','root123','root1234',
          'meridian','meridian1','meridian123','meridiancode','meridiancode1',
          'qatar','qatar1','qatar123','qatar2023','qatar2024','qatar2025',
          'doha','doha1','doha123','doha2024',
          'khalid','khalid1','khalid123','khalid2024',
          'khalid.alali','khalid.alali1','khalid.alali123',
          'meridian2023','meridian2024','meridian2025',
          'meridian@2024','meridian@2025','admin@2024','admin@2025',
          'Meridian2024','Meridian@2024','MeridianCode1','MeridianCode123',
          'P@ssword','P@ssw0rd','P@ss1234','Passw0rd','Passw0rd1',
          'Summer2024','Winter2024','Spring2024','Fall2024',
          'Company1','Company123','Company@1','Company@123',
          'Secret1','Secret123','Secret@1','Secure123',
          'change_me','changeme','changeme1','changeme123',
          'newpassword','newpass','newpass1','newpass123',
          'mypassword','mypass','mypass1','mypass123',
        ].join('\n'),
      },
      'targets': {
        type: 'dir', children: {
          'site.txt': {
            type: 'file',
            content: `الهدف    : meridian-corp.com\nالنطاق   : meridian-corp.com\nالنوع    : موقع شركة تقنية\nالمدينة  : الدوحة، قطر`,
          },
        },
      },
      'tools': {
        type: 'dir', children: {
          'readme.txt': {
            type: 'file',
            content: `الأدوات المتاحة في هذه الجلسة:\n  kashif <url>                    — اكتشاف الصفحات المخفية\n  barq <مستخدم> <قائمة> <رابط>   — كسر كلمات المرور\n  display / enter / show / open   — التنقل في نظام الملفات`,
          },
        },
      },
    },
  },
}

function getFsNode(path) {
  let node = PENTEST_FS
  for (const seg of path) {
    if (!node[seg] || node[seg].type !== 'dir') return null
    node = node[seg].children
  }
  return node
}

// ─── TERMINAL ─────────────────────────────────────────────────────────────────

function Terminal({ isAr, lines, input, setInput, onCommand, busy, outputRef, prompt }) {
  const handleKey = e => {
    if (e.key === 'Enter' && !busy && input.trim()) {
      onCommand(input.trim())
      setInput('')
    }
  }

  return (
    <div dir="ltr" className="flex flex-col h-full bg-gray-950 rounded-xl overflow-hidden border border-gray-700 font-mono text-sm">
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 border-b border-gray-700 shrink-0">
        <span className="w-3 h-3 rounded-full bg-red-500"/>
        <span className="w-3 h-3 rounded-full bg-yellow-500"/>
        <span className="w-3 h-3 rounded-full bg-green-500"/>
        <span className="text-gray-400 text-xs ml-2">
          {isAr ? 'طرفية التحكم' : 'Terminal'}
        </span>
      </div>

      {/* Output — ref on this div so scrollTop stays internal, page never scrolls */}
      <div ref={outputRef} className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {lines.map((l, i) => (
          <div key={i} className={
            l.type === 'cmd'     ? 'text-white' :
            l.type === 'success' ? 'text-green-400' :
            l.type === 'warn'    ? 'text-yellow-400' :
            l.type === 'error'   ? 'text-red-400' :
            l.type === 'fail'    ? 'text-red-400' :
            l.type === 'dim'     ? 'text-gray-500' :
            'text-green-300'
          }>
            {l.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-700 bg-gray-900 shrink-0" dir="ltr">
        <span className="text-green-400 select-none text-xs whitespace-nowrap">
          {busy ? '▓' : prompt}
        </span>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={busy}
          placeholder={busy
            ? (isAr ? 'جارٍ التنفيذ...' : 'Running...')
            : (isAr ? 'اكتب أمراً...' : 'Type a command...')}
          className="flex-1 bg-transparent text-green-300 outline-none placeholder-gray-600 text-sm"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  )
}

// ─── BROWSER ──────────────────────────────────────────────────────────────────

const PROTECTED_PATHS = ['/admin', '/admin/employees', '/admin/contracts', '/admin/settings']

function SitePage({ path, isAr, loggedIn, onLogin, navigate }) {
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loginErr,  setLoginErr]  = useState('')

  const isProtected = PROTECTED_PATHS.some(p => path === p || path.startsWith(p + '/'))

  if (isProtected && !loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
        <div className="text-5xl">🔒</div>
        <div className="text-red-600 font-bold text-lg">401 — Unauthorized</div>
        <div className="text-slate-500 text-sm">
          {isAr ? 'هذه الصفحة محمية. يجب عليك تسجيل الدخول أولاً.' : 'This page is protected. You must log in first.'}
        </div>
        <button onClick={() => navigate('/login')}
          className="mt-2 px-4 py-1.5 rounded-lg bg-[#0E1F39] text-white text-sm hover:opacity-80">
          {isAr ? 'الذهاب إلى تسجيل الدخول' : 'Go to /login'}
        </button>
      </div>
    )
  }

  const NavBar = () => (
    <nav className="flex flex-wrap gap-2 bg-[#0E1F39] px-4 py-2 items-center" dir="ltr">
      <span className="text-amber-400 font-bold text-sm mr-3">Meridian</span>
      {[['/', isAr?'الرئيسية':'Home'], ['/about', isAr?'من نحن':'About'],
        ['/services', isAr?'الخدمات':'Services'], ['/contact', isAr?'تواصل':'Contact']
      ].map(([p, l]) => (
        <button key={p} onClick={() => navigate(p)}
          className={`text-xs px-2 py-1 rounded transition-colors ${path === p ? 'bg-amber-400 text-[#0E1F39] font-bold' : 'text-gray-300 hover:text-white'}`}>
          {l}
        </button>
      ))}
      {loggedIn && (
        <button onClick={() => navigate('/admin')}
          className={`text-xs px-2 py-1 rounded ml-auto ${path.startsWith('/admin') ? 'bg-green-500 text-white font-bold' : 'text-green-400 border border-green-600 hover:bg-green-900'}`}>
          {isAr ? 'لوحة التحكم' : 'Admin Panel'}
        </button>
      )}
    </nav>
  )

  const AdminNav = () => (
    <nav className="flex gap-3 bg-slate-800 px-4 py-2">
      {[['/admin', isAr?'لوحة القيادة':'Dashboard'],
        ['/admin/employees', isAr?'الموظفون':'Employees'],
        ['/admin/contracts', isAr?'العقود':'Contracts'],
      ].map(([p, l]) => (
        <button key={p} onClick={() => navigate(p)}
          className={`text-xs px-3 py-1 rounded ${path === p ? 'bg-white text-slate-800 font-bold' : 'text-slate-300 hover:text-white'}`}>
          {l}
        </button>
      ))}
    </nav>
  )

  // ── Page contents ────────────────────────────────────────────────────────────

  if (path === '/') return (
    <div className="flex flex-col h-full">
      <NavBar />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#0E1F39] flex items-center justify-center text-2xl">💡</div>
          <div>
            <h1 className="font-bold text-xl text-[#0E1F39]">
              {isAr ? 'شركة ميريديان للحلول التقنية' : 'Meridian Solutions'}
            </h1>
            <p className="text-slate-500 text-sm">{isAr ? 'حلول تقنية رائدة في قطر' : 'Leading technology solutions in Qatar'}</p>
          </div>
        </div>
        <p className="text-slate-600 text-sm mb-4 leading-relaxed">
          {isAr
            ? 'نقدم خدمات تقنية متطورة للشركات والحكومات في قطر منذ عام 2015. تخصصنا في تطوير البرمجيات والأمن السيبراني والحلول السحابية.'
            : 'We provide cutting-edge technology services to businesses and governments in Qatar since 2015. We specialise in software development, cybersecurity, and cloud solutions.'}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[[isAr?'موظف':'Employee','150+','👥'],[isAr?'عميل':'Client','80+','🤝'],[isAr?'مشروع':'Project','320+','📁']].map(([l,v,ic])=>(
            <div key={l} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
              <div className="text-2xl mb-1">{ic}</div>
              <div className="font-bold text-[#0E1F39] text-lg">{v}</div>
              <div className="text-xs text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (path === '/about') return (
    <div className="flex flex-col h-full">
      <NavBar />
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="font-bold text-lg text-[#0E1F39] mb-1">{isAr ? 'من نحن' : 'About Us'}</h2>
        <div className="border-b border-slate-200 mb-4"/>
        <div className="space-y-3 text-sm text-slate-700">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <span className="font-bold text-amber-700">{isAr ? 'المؤسس والمدير التنفيذي:' : 'Founder & CEO:'}</span>
            <span className="ml-2 font-bold text-[#0E1F39]">{isAr ? 'خالد العلي' : 'Khalid Al Ali'}</span>
          </div>
          <p>{isAr
            ? 'تأسست شركة ميريديان للتقنية عام 2015 على يد خالد العلي في الدوحة، قطر. بدأت كشركة ناشئة صغيرة وأصبحت الآن من أبرز شركات التقنية في المنطقة.'
            : 'Meridian was founded in 2015 by Khalid Al Ali in Doha, Qatar. Starting as a small startup, it has grown into one of the region\'s leading technology firms.'
          }</p>
          <div className="grid grid-cols-2 gap-2">
            {[[isAr?'التأسيس':'Founded','2015'],[isAr?'المقر':'HQ', isAr?'الدوحة، قطر':'Doha, Qatar'],
              [isAr?'الموظفون':'Employees','150+'],[isAr?'التخصص':'Speciality',isAr?'أمن سيبراني':'Cybersecurity']
            ].map(([k,v])=>(
              <div key={k} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                <div className="text-xs text-slate-400">{k}</div>
                <div className="font-semibold text-[#0E1F39]">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  if (path === '/contact') return (
    <div className="flex flex-col h-full">
      <NavBar />
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="font-bold text-lg text-[#0E1F39] mb-1">{isAr ? 'تواصل معنا' : 'Contact Us'}</h2>
        <div className="border-b border-slate-200 mb-4"/>
        <div className="space-y-3">
          {[
            ['📧', isAr?'البريد الإلكتروني':'Email', ADMIN_EMAIL, 'text-blue-600 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded select-all'],
            ['📞', isAr?'الهاتف':'Phone', '66730918', 'text-slate-700'],
            ['📍', isAr?'العنوان':'Address', isAr?'البحر الغربي، الدوحة، قطر':'West Bay, Doha, Qatar', 'text-slate-700'],
            ['🕐', isAr?'ساعات العمل':'Working Hours', isAr?'الأحد – الخميس، 8ص – 5م':'Sun–Thu, 8AM–5PM', 'text-slate-700'],
          ].map(([ic,label,val,cls])=>(
            <div key={label} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-xl">{ic}</span>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">{label}</div>
                <div className={cls || 'text-slate-700'}>{val}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (path === '/services') return (
    <div className="flex flex-col h-full">
      <NavBar />
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="font-bold text-lg text-[#0E1F39] mb-1">{isAr ? 'خدماتنا' : 'Our Services'}</h2>
        <div className="border-b border-slate-200 mb-4"/>
        <div className="grid grid-cols-2 gap-3">
          {[
            ['🔐', isAr?'الأمن السيبراني':'Cybersecurity', isAr?'حماية البنية التحتية الرقمية':'Protecting digital infrastructure'],
            ['☁️', isAr?'الحلول السحابية':'Cloud Solutions', isAr?'بنية سحابية موسّعة':'Scalable cloud architecture'],
            ['💻', isAr?'تطوير البرمجيات':'Software Dev', isAr?'تطبيقات مخصصة':'Custom applications'],
            ['📊', isAr?'استشارات تقنية':'IT Consulting', isAr?'استراتيجية تحول رقمي':'Digital transformation strategy'],
          ].map(([ic,title,desc])=>(
            <div key={title} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="text-2xl mb-1">{ic}</div>
              <div className="font-semibold text-[#0E1F39] text-sm">{title}</div>
              <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (path === '/login') return (
    <div className="flex flex-col h-full">
      <NavBar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xs">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔐</div>
            <h2 className="font-bold text-lg text-[#0E1F39]">{isAr ? 'تسجيل دخول المسؤول' : 'Admin Login'}</h2>
            <p className="text-slate-400 text-xs mt-1">{isAr ? 'صفحة محمية' : 'Protected area'}</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">{isAr ? 'اسم المستخدم (البريد الإلكتروني)' : 'Username (Email)'}</label>
              <input value={loginUser} onChange={e=>setLoginUser(e.target.value)}
                type="email" placeholder="user@example.com"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E1F39]" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{isAr ? 'كلمة المرور' : 'Password'}</label>
              <div className="relative">
                <input value={loginPass} onChange={e=>setLoginPass(e.target.value)}
                  type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  onKeyDown={e => e.key==='Enter' && (() => {
                    if (loginUser===ADMIN_EMAIL && loginPass===ADMIN_PASS) { onLogin(); navigate('/admin') }
                    else setLoginErr(isAr?'بيانات الدخول غير صحيحة':'Invalid credentials')
                  })()}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E1F39] pr-10" />
                <button onClick={()=>setShowPw(p=>!p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {loginErr && <div className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{loginErr}</div>}
            <button
              onClick={() => {
                if (loginUser===ADMIN_EMAIL && loginPass===ADMIN_PASS) { onLogin(); navigate('/admin') }
                else setLoginErr(isAr?'بيانات الدخول غير صحيحة':'Invalid credentials')
              }}
              className="w-full py-2 bg-[#0E1F39] text-white rounded-lg font-bold text-sm hover:opacity-90">
              {isAr ? 'تسجيل الدخول' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (path === '/admin') return (
    <div className="flex flex-col h-full">
      <NavBar />
      <AdminNav />
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🛡️</span>
          <h2 className="font-bold text-[#0E1F39]">{isAr ? 'لوحة تحكم المسؤول' : 'Admin Dashboard'}</h2>
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
            {isAr ? '✓ مسجل الدخول' : '✓ Logged in'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            [isAr?'إجمالي الموظفين':'Total Employees', EMPLOYEES.length, '👥', 'bg-blue-50 border-blue-100'],
            [isAr?'إجمالي العقود':'Total Contracts', CONTRACTS.length, '📄', 'bg-amber-50 border-amber-100'],
            [isAr?'إجمالي الإيرادات':'Total Revenue', CONTRACTS.reduce((s,c)=>s+c.value,0).toLocaleString()+' QAR', '💵', 'bg-green-50 border-green-100'],
          ].map(([label,val,ic,cls])=>(
            <div key={label} className={`${cls} rounded-xl p-3 border text-center`}>
              <div className="text-2xl mb-1">{ic}</div>
              <div className="font-bold text-[#0E1F39] text-sm">{val}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={()=>navigate('/admin/employees')}
            className="bg-slate-800 text-white rounded-xl p-4 text-left hover:bg-slate-700 transition-colors">
            <div className="text-xl mb-1">👥</div>
            <div className="font-bold text-sm">{isAr?'إدارة الموظفين':'Manage Employees'}</div>
            <div className="text-xs text-slate-400">{isAr?'عرض الرواتب والبيانات':'View salaries & data'}</div>
          </button>
          <button onClick={()=>navigate('/admin/contracts')}
            className="bg-slate-800 text-white rounded-xl p-4 text-left hover:bg-slate-700 transition-colors">
            <div className="text-xl mb-1">📄</div>
            <div className="font-bold text-sm">{isAr?'إدارة العقود':'Manage Contracts'}</div>
            <div className="text-xs text-slate-400">{isAr?'عرض قيم العقود':'View contract values'}</div>
          </button>
        </div>
      </div>
    </div>
  )

  if (path === '/admin/employees') return (
    <div className="flex flex-col h-full">
      <NavBar />
      <AdminNav />
      <div className="flex-1 p-4 overflow-y-auto">
        <h2 className="font-bold text-[#0E1F39] mb-3">{isAr ? 'قائمة الموظفين' : 'Employees'}</h2>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#0E1F39] text-white">
              <th className="px-2 py-2 text-start rounded-tl-lg">{isAr?'الاسم':'Name'}</th>
              <th className="px-2 py-2 text-start">{isAr?'المنصب':'Role'}</th>
              <th className="px-2 py-2 text-end rounded-tr-lg">{isAr?'الراتب (ر.ق)':'Salary (QAR)'}</th>
            </tr>
          </thead>
          <tbody>
            {[...EMPLOYEES].sort((a,b)=>b.salary-a.salary).map((e,i)=>(
              <tr key={e.name} className={`border-b border-slate-100 ${i%2===0?'bg-slate-50':''}`}>
                <td className="px-2 py-2">{isAr ? e.nameAr : e.name}</td>
                <td className="px-2 py-2 text-slate-500">{isAr ? e.roleAr : e.role}</td>
                <td className="px-2 py-2 text-end font-mono">{e.salary.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  if (path === '/admin/contracts') return (
    <div className="flex flex-col h-full">
      <NavBar />
      <AdminNav />
      <div className="flex-1 p-4 overflow-y-auto">
        <h2 className="font-bold text-[#0E1F39] mb-3">{isAr ? 'العقود' : 'Contracts'}</h2>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#0E1F39] text-white">
              <th className="px-2 py-2 text-start rounded-tl-lg">{isAr?'الشركة':'Company'}</th>
              <th className="px-2 py-2 text-end">{isAr?'القيمة (ر.ق)':'Value (QAR)'}</th>
              <th className="px-2 py-2 text-start rounded-tr-lg">{isAr?'الحالة':'Status'}</th>
            </tr>
          </thead>
          <tbody>
            {[...CONTRACTS].sort((a,b)=>b.value-a.value).map((c,i)=>(
              <tr key={c.company} className={`border-b border-slate-100 ${i%2===0?'bg-slate-50':''}`}>
                <td className="px-2 py-2">{isAr ? c.companyAr : c.company}</td>
                <td className="px-2 py-2 text-end font-mono">{c.value.toLocaleString()}</td>
                <td className="px-2 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    c.status==='Active'?'bg-green-100 text-green-700':
                    c.status==='Completed'?'bg-blue-100 text-blue-700':
                    'bg-yellow-100 text-yellow-700'
                  }`}>{isAr?c.statusAr:c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  // IDOR — /api/profile?id=N
  if (path.startsWith('/api/profile')) {
    const params  = new URLSearchParams(path.split('?')[1] || '')
    const idParam = parseInt(params.get('id') || '0', 10)
    const emp     = EMPLOYEES[idParam - 1]
    return (
      <div className="flex flex-col h-full">
        <NavBar />
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔌</span>
            <h2 className="font-bold text-[#0E1F39] font-mono text-sm">GET /api/profile?id={idParam || '?'}</h2>
            <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
              ⚠️ IDOR
            </span>
          </div>
          {!idParam || idParam < 1 || idParam > 6 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-sm space-y-1">
              <p className="text-red-500">"error": "{isAr ? 'معرّف غير صالح' : 'Invalid id parameter'}"</p>
              <p className="text-xs text-slate-400 mt-3">{isAr ? 'جرّب: /api/profile?id=1 حتى /api/profile?id=6' : 'Try: /api/profile?id=1 through /api/profile?id=6'}</p>
            </div>
          ) : idParam === 4 ? (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs font-bold text-red-600 mb-1">🚨 {isAr ? 'ثغرة IDOR — لا يوجد تحقق من الصلاحيات!' : 'IDOR Vulnerability — No authorization check!'}</p>
                <p className="text-xs text-red-500">{isAr ? 'وجدت بيانات حساسة!' : 'Sensitive data found!'}</p>
              </div>
              <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm space-y-1" dir="ltr">
                <p className="text-slate-400">{'{'}</p>
                <p className="ml-4"><span className="text-blue-400">"id"</span><span className="text-slate-300">: </span><span className="text-amber-400">4</span><span className="text-slate-300">,</span></p>
                <p className="ml-4"><span className="text-blue-400">"name"</span><span className="text-slate-300">: </span><span className="text-green-400">"Fatima Al Shamri"</span><span className="text-slate-300">,</span></p>
                <p className="ml-4"><span className="text-blue-400">"role"</span><span className="text-slate-300">: </span><span className="text-green-400">"<span className="text-yellow-300">Marketing</span> Manager"</span><span className="text-slate-300">,</span></p>
                <p className="ml-4"><span className="text-blue-400">"department"</span><span className="text-slate-300">: </span><span className="text-green-400">"Marketing"</span></p>
                <p className="text-slate-400">{'}'}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[1,2,3,4,5,6].map(i => (
                  <button key={i} onClick={() => navigate(`/api/profile?id=${i}`)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${idParam === i ? 'bg-[#0E1F39] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    id={i}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm space-y-1" dir="ltr">
                <p className="text-slate-400">{'{'}</p>
                <p className="ml-4"><span className="text-blue-400">"id"</span><span className="text-slate-300">: </span><span className="text-amber-400">{idParam}</span><span className="text-slate-300">,</span></p>
                <p className="ml-4"><span className="text-blue-400">"message"</span><span className="text-slate-300">: </span><span className="text-slate-400">"{isAr ? 'جرّب البحث في صفحات أخرى' : 'try searching for other pages'}"</span></p>
                <p className="text-slate-400">{'}'}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[1,2,3,4,5,6].map(i => (
                  <button key={i} onClick={() => navigate(`/api/profile?id=${i}`)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${idParam === i ? 'bg-[#0E1F39] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    id={i}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 404
  return (
    <div className="flex flex-col h-full">
      <NavBar />
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-6">
        <div className="text-5xl">🔍</div>
        <div className="font-bold text-xl text-slate-700">404 — Not Found</div>
        <div className="text-slate-400 text-sm font-mono">{SITE_URL}{path}</div>
        <button onClick={()=>navigate('/')}
          className="mt-3 px-4 py-1.5 bg-[#0E1F39] text-white rounded-lg text-sm hover:opacity-80">
          {isAr ? 'العودة للرئيسية' : 'Back to Home'}
        </button>
      </div>
    </div>
  )
}

function Browser({ isAr, loggedIn, onLogin, url, urlInput, setUrlInput, navigate }) {
  const handleUrlSubmit = e => {
    e.preventDefault()
    let raw = urlInput.trim()
    if (raw.startsWith(SITE_URL)) raw = raw.slice(SITE_URL.length)
    if (!raw.startsWith('/')) raw = '/' + raw
    navigate(raw || '/')
  }

  const lockColor = loggedIn ? 'text-green-500' : 'text-slate-400'

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Browser chrome */}
      <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 shrink-0">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-3 h-3 rounded-full bg-red-400"/>
          <span className="w-3 h-3 rounded-full bg-yellow-400"/>
          <span className="w-3 h-3 rounded-full bg-green-400"/>
          <span className="text-slate-500 text-xs ml-2">{isAr ? 'المتصفح' : 'Browser'}</span>
        </div>
        <form onSubmit={handleUrlSubmit} className="flex gap-2" dir="ltr">
          <span className={`text-sm mt-1 ${lockColor}`}>{loggedIn ? '🔓' : '🔒'}</span>
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            dir="ltr"
            className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button type="submit" className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs transition-colors">
            {isAr ? 'انتقل' : 'Go'}
          </button>
        </form>
      </div>

      {/* Page */}
      <div className="flex-1 overflow-hidden text-sm">
        <SitePage
          path={url}
          isAr={isAr}
          loggedIn={loggedIn}
          onLogin={onLogin}
          navigate={navigate}
        />
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function PageFinalChallenge() {
  const { lang } = useApp()
  const isAr = lang === 'ar'

  // Browser state
  const [url,      setUrl]      = useState('/')
  const [urlInput, setUrlInput] = useState(SITE_URL + '/')
  const [loggedIn, setLoggedIn] = useState(false)

  // Terminal state
  const [termLines, setTermLines] = useState(() => [
    { type:'dim',     text: '' },
    { type:'success', text: isAr
        ? 'اكتب help لرؤية الأوامر المتاحة.'
        : 'Type help to see available commands.' },
  ])
  const [termInput, setTermInput] = useState('')
  const [termBusy,  setTermBusy]  = useState(false)
  const [cwd,       setCwd]       = useState(['Desktop'])  // filesystem path segments
  const termOutputRef = useRef(null)                   // ref on the scrollable output div

  // Challenges
  const [answers,   setAnswers]   = useState({})
  const [results,   setResults]   = useState({})

  // Scroll ONLY inside the terminal div — never scrolls the page
  useEffect(() => {
    if (termOutputRef.current) {
      termOutputRef.current.scrollTop = termOutputRef.current.scrollHeight
    }
  }, [termLines])

  // Dynamic shell prompt
  const cwdStr    = '~' + (cwd.length ? '/' + cwd.join('/') : '')
  const promptStr = loggedIn
    ? `admin@meridian:${cwdStr}$ `
    : `guest@pentest:${cwdStr}$ `

  // ── Navigation ───────────────────────────────────────────────────────────────
  const navigate = path => {
    setUrl(path)
    setUrlInput(SITE_URL + path)
  }

  // ── Terminal helpers ─────────────────────────────────────────────────────────
  const addLine = (text, type = 'info') =>
    setTermLines(l => [...l, { type, text }])

  const addLines = lines =>
    setTermLines(l => [...l, ...lines])

  // ── Command processor ────────────────────────────────────────────────────────
  const handleCommand = cmd => {
    addLine(`${promptStr}${cmd}`, 'cmd')
    const parts = cmd.trim().split(/\s+/)
    // support aliases from the Linux FS lesson
    const rawVerb = parts[0].toLowerCase()
    const verb = rawVerb === 'display' ? 'ls'
               : rawVerb === 'enter'   ? 'cd'
               : rawVerb === 'location'? 'pwd'
               : rawVerb === 'show'    ? 'show'
               : rawVerb === 'open'    ? 'open'
               : rawVerb
    // treat 'parent' as '..' for the cd command
    if (parts[1] === 'parent') parts[1] = '..'

    // ── clear ──
    if (verb === 'clear') { setTermLines([]); return }

    // ── help ──
    if (verb === 'help') {
      if (isAr) {
        addLines([
          { type:'dim',     text: '══════════════════════════════════════════════════════' },
          { type:'success', text: '  الأوامر المتاحة — دليل الاستخدام' },
          { type:'dim',     text: '══════════════════════════════════════════════════════' },
          { type:'dim',     text: '' },
          { type:'warn',    text: '  ─── التنقل في الملفات ───────────────────────────' },
          { type:'info',    text: '  display' },
          { type:'dim',     text: '      يعرض قائمة الملفات والمجلدات في موقعك الحالي' },
          { type:'info',    text: '  enter <مجلد>' },
          { type:'dim',     text: '      ينقلك داخل مجلد — مثال: enter Desktop' },
          { type:'dim',     text: '      للعودة للأعلى اكتب: enter parent' },
          { type:'info',    text: '  location' },
          { type:'dim',     text: '      يعرض المسار الكامل لموقعك الحالي' },
          { type:'info',    text: '  tree' },
          { type:'dim',     text: '      يعرض هيكل الملفات كاملاً على شكل شجرة' },
          { type:'dim',     text: '' },
          { type:'warn',    text: '  ─── قراءة الملفات ───────────────────────────────' },
          { type:'info',    text: '  show <ملف>' },
          { type:'dim',     text: '      يعرض محتوى الملف النصي مباشرة في الطرفية' },
          { type:'info',    text: '  open <ملف>' },
          { type:'dim',     text: '      يفتح الملف في عارض المحرر النصي' },
          { type:'dim',     text: '' },
          { type:'warn',    text: '  ─── أدوات الاختراق ──────────────────────────────' },
          { type:'info',    text: '  kashif ملف_صفحات موقع' },
          { type:'dim',     text: '      أداة اكتشاف الصفحات المخفية — تحتاج ملف يحتوي الصفحات المراد فحصها' },
          { type:'dim',     text: '      مثال: kashif pages.txt meridian-corp.com' },
          { type:'info',    text: '  barq اسم_مستخدم ملف_باسوردات موقع' },
          { type:'dim',     text: '      هجوم القوة الغاشمة — يجرّب كلمات المرور من الملف واحدة تلو الأخرى' },
          { type:'dim',     text: '      مثال: barq khalid@meridian-corp.com passwords.txt meridian-corp.com' },
          { type:'dim',     text: '' },
          { type:'warn',    text: '  ─── أوامر أخرى ──────────────────────────────────' },
          { type:'info',    text: '  whoami' },
          { type:'dim',     text: '      يعرض اسم المستخدم الحالي في الجلسة' },
          { type:'info',    text: '  clear' },
          { type:'dim',     text: '      يمسح شاشة الطرفية ويبدأ من جديد' },
          { type:'dim',     text: '' },
          { type:'dim',     text: '══════════════════════════════════════════════════════' },
        ])
      } else {
        addLines([
          { type:'dim',     text: '======================================================' },
          { type:'success', text: '  Available Commands — Usage Guide' },
          { type:'dim',     text: '======================================================' },
          { type:'dim',     text: '' },
          { type:'warn',    text: '  --- File Navigation -----------------------------------' },
          { type:'info',    text: '  display' },
          { type:'dim',     text: '      List all files and folders in your current location' },
          { type:'info',    text: '  enter <folder>' },
          { type:'dim',     text: '      Move into a folder — e.g.: enter Desktop' },
          { type:'dim',     text: '      To go back up, type: enter parent' },
          { type:'info',    text: '  location' },
          { type:'dim',     text: '      Show the full path of your current location' },
          { type:'info',    text: '  tree' },
          { type:'dim',     text: '      Show the full file/folder structure as a tree' },
          { type:'dim',     text: '' },
          { type:'warn',    text: '  --- Reading Files -------------------------------------' },
          { type:'info',    text: '  show <file>' },
          { type:'dim',     text: '      Print a text file\'s contents in the terminal' },
          { type:'info',    text: '  open <file>' },
          { type:'dim',     text: '      Open a file in the text editor viewer' },
          { type:'dim',     text: '' },
          { type:'warn',    text: '  --- Hacking Tools -------------------------------------' },
          { type:'info',    text: '  kashif pages_file site' },
          { type:'dim',     text: '      Discover hidden pages — needs a file listing paths to scan' },
          { type:'dim',     text: '      e.g.: kashif pages.txt meridian-corp.com' },
          { type:'info',    text: '  barq site passwords_file username' },
          { type:'dim',     text: '      Brute-force attack — tries each password in the file one by one' },
          { type:'dim',     text: '      e.g.: barq meridian-corp.com passwords.txt khalid@meridian-corp.com' },
          { type:'dim',     text: '' },
          { type:'warn',    text: '  --- Other Commands ------------------------------------' },
          { type:'info',    text: '  whoami' },
          { type:'dim',     text: '      Show the current session username' },
          { type:'info',    text: '  clear' },
          { type:'dim',     text: '      Clear the terminal screen and start fresh' },
          { type:'dim',     text: '' },
          { type:'dim',     text: '======================================================' },
        ])
      }
      return
    }

    // ── whoami ──
    if (verb === 'whoami') {
      addLine(loggedIn
        ? `khalid@meridian-corp.com`
        : (isAr ? 'guest — غير مصادق (لم تسجّل الدخول بعد)' : 'guest — not authenticated'), 'info')
      return
    }

    // ── pwd ──
    if (verb === 'pwd') {
      addLine('/home/student/' + cwdStr.replace('~', '').replace(/^\//, ''), 'info')
      return
    }

    // ── ls ──
    if (verb === 'ls') {
      const node = getFsNode(cwd)
      if (!node) { addLine(isAr ? 'خطأ: المجلد غير موجود' : 'Error: directory not found', 'error'); return }
      const entries = Object.entries(node)
      if (entries.length === 0) {
        addLine(isAr ? '(مجلد فارغ)' : '(empty directory)', 'dim')
      } else {
        const dirs  = entries.filter(([,v]) => v.type === 'dir' ).map(([k]) => k + '/')
        const files = entries.filter(([,v]) => v.type === 'file').map(([k]) => k)
        addLine([...dirs, ...files].join('   '), 'info')
      }
      return
    }

    // ── cd ──
    if (verb === 'cd') {
      const target = parts[1]
      if (!target || target === '~' || target === '/') { setCwd([]); return }
      if (target === '..') {
        if (cwd.length === 0) {
          addLine(isAr ? 'أنت بالفعل في المجلد الجذر' : 'Already at root', 'error')
        } else {
          setCwd(p => p.slice(0, -1))
        }
        return
      }
      const node = getFsNode(cwd)
      if (!node || !node[target] || node[target].type !== 'dir') {
        addLine(`cd: ${target}: ${isAr ? 'لا يوجد مجلد بهذا الاسم' : 'No such directory'}`, 'error')
        return
      }
      setCwd(p => [...p, target])
      return
    }

    // ── show (renamed from cat) ──
    if (verb === 'show' || verb === 'cat') {
      const fname = parts[1]
      if (!fname) {
        addLine(isAr ? 'الاستخدام: show <ملف>' : 'Usage: show <file>', 'error')
        return
      }
      const node = getFsNode(cwd)
      if (!node || !node[fname] || node[fname].type !== 'file') {
        addLine(`show: ${fname}: ${isAr ? 'الملف غير موجود' : 'No such file'}`, 'error')
        return
      }
      node[fname].content.split('\n').forEach(l => addLine(l, 'dim'))
      return
    }

    // ── open / nano (editor-style view) ──
    if (verb === 'open' || verb === 'nano') {
      const fname = parts[1]
      if (!fname) {
        addLine(isAr ? 'الاستخدام: open <ملف>  أو  nano <ملف>' : 'Usage: open <file>  or  nano <file>', 'error')
        return
      }
      const node = getFsNode(cwd)
      if (!node || !node[fname] || node[fname].type !== 'file') {
        addLine(`${verb}: ${fname}: ${isAr ? 'الملف غير موجود' : 'No such file'}`, 'error')
        return
      }
      const border = '─'.repeat(38)
      addLines([
        { type:'dim',  text: `┌${border}┐` },
        { type:'warn', text: `│  ${fname.padEnd(36)}│` },
        { type:'dim',  text: `├${border}┤` },
        ...node[fname].content.split('\n').map(l => ({ type:'info', text: `│  ${l}` })),
        { type:'dim',  text: `└${border}┘` },
        { type:'dim',  text: isAr ? '  [Ctrl+X للخروج — للقراءة فقط]' : '  [Ctrl+X to exit — read-only]' },
      ])
      return
    }

    // ── tree ──
    if (verb === 'tree' || rawVerb === 'tree') {
      const renderTree = (node, prefix = '') => {
        const entries = Object.entries(node)
        entries.forEach(([name, val], idx) => {
          const isLast = idx === entries.length - 1
          const branch = isLast ? '└── ' : '├── '
          const label  = val.type === 'dir' ? name + '/' : name
          addLine(prefix + branch + label, val.type === 'dir' ? 'warn' : 'info')
          if (val.type === 'dir') renderTree(val.children, prefix + (isLast ? '    ' : '│   '))
        })
      }
      addLine(isAr ? '~ (المجلد الحالي)' : '~ (current directory)', 'success')
      const node = getFsNode(cwd)
      if (node) renderTree(node)
      return
    }

    // ── kashif ──  syntax: kashif <pages_file> <site>
    if (verb === 'kashif') {
      if (termBusy) { addLine(isAr ? 'جاري فحص آخر، انتظر...' : 'Another scan is running, please wait.', 'warn'); return }
      const pagesArg = parts[1]
      const target   = parts[2]
      if (!pagesArg || !target) {
        addLines([
          { type:'error', text: isAr
            ? 'الاستخدام: kashif ملف_صفحات موقع'
            : 'Usage: kashif pages_file site' },
          { type:'dim', text: isAr
            ? 'مثال: kashif pages.txt meridian-corp.com'
            : 'Example: kashif pages.txt meridian-corp.com' },
        ])
        return
      }
      const dirNode  = getFsNode(cwd)
      const fileNode = dirNode && dirNode[pagesArg]
      if (!fileNode || fileNode.type !== 'file') {
        addLine(`kashif: ${pagesArg}: ${isAr ? 'الملف غير موجود' : 'No such file'}`, 'error')
        return
      }
      // parse paths from file
      const filePaths = (fileNode.content || '').split('\n').map(l => l.trim()).filter(Boolean)
      // build scan list: match against KASHIF_PATHS, unknowns get [?]
      const scanList = filePaths.map(p => {
        const known = KASHIF_PATHS.find(k => k.path === p)
        return known ? known : { path: p, kind: 'unknown' }
      })
      setTermBusy(true)
      addLines(isAr ? [
        { type:'info', text: `[*] كاشف v2.0 — أداة اكتشاف الصفحات` },
        { type:'info', text: `[*] الهدف      : ${target}` },
        { type:'info', text: `[*] ملف الصفحات: ${pagesArg} (${filePaths.length} صفحة)` },
        { type:'dim',  text: '' },
      ] : [
        { type:'info', text: `[*] Kashif v2.0 — Page Discovery Tool` },
        { type:'info', text: `[*] Target    : ${target}` },
        { type:'info', text: `[*] Pages file: ${pagesArg} (${filePaths.length} paths)` },
        { type:'dim',  text: '' },
      ])
      let i = 0
      const iv = setInterval(() => {
        if (i >= scanList.length) {
          clearInterval(iv)
          const foundPages     = scanList.filter(p => p.kind === 'found')
          const protectedPages = scanList.filter(p => p.kind === 'warn')
          const sep = '─'.repeat(44)
          addLines([
            { type:'dim',     text: '' },
            { type:'dim',     text: sep },
            { type:'success', text: isAr ? `[✓] الفحص مكتمل! النتائج:` : `[✓] Scan complete! Results:` },
            { type:'dim',     text: '' },
            { type:'success', text: isAr
              ? `  📄 الصفحات المكتشفة (${foundPages.length}):`
              : `  📄 Accessible pages (${foundPages.length}):` },
            ...foundPages.map(p => ({ type:'success', text: `      ${target}${p.path}` })),
            { type:'dim',     text: '' },
            { type:'warn',    text: isAr
              ? `  🔒 الصفحات المحمية بكلمة مرور (${protectedPages.length}):`
              : `  🔒 Password-protected pages (${protectedPages.length}):` },
            ...protectedPages.map(p => ({ type:'warn', text: `      ${target}${p.path}` })),
            { type:'dim',     text: '' },
            { type:'dim',     text: sep },
          ])
          setTermBusy(false)
          return
        }
        const entry = scanList[i]
        if (entry.kind === 'unknown') {
          addLine(`[?] ${target}${entry.path}`, 'dim')
        } else {
          const type   = entry.kind === 'found' ? 'success' : entry.kind === 'warn' ? 'warn' : 'fail'
          const marker = entry.kind === 'found' ? '[+]' : entry.kind === 'warn' ? '[!]' : '[-]'
          addLine(`${marker} ${target}${entry.path}  →  ${isAr ? entry.statusAr : entry.statusEn}`, type)
        }
        i++
      }, 200)
      return
    }

    // ── barq ──  syntax: barq <site> <passwords_file> <username>
    if (verb === 'barq') {
      if (termBusy) { addLine(isAr ? 'جاري تنفيذ أمر آخر، انتظر...' : 'Another command is running, please wait.', 'warn'); return }
      const username  = parts[1] || null
      const pwdFile   = parts[2] || null
      const target    = parts[3] || null

      if (!username || !pwdFile || !target) {
        addLines([
          { type:'error', text: isAr
            ? 'الاستخدام: barq اسم_مستخدم ملف_باسوردات موقع'
            : 'Usage: barq username passwords_file site' },
          { type:'dim', text: isAr
            ? 'مثال: barq khalid@meridian-corp.com passwords.txt meridian-corp.com'
            : 'Example: barq khalid@meridian-corp.com passwords.txt meridian-corp.com' },
        ])
        return
      }

      // read passwords from filesystem file
      const dirNode  = getFsNode(cwd)
      const pwdNode  = dirNode && dirNode[pwdFile]
      if (!pwdNode || pwdNode.type !== 'file') {
        addLine(`barq: ${pwdFile}: ${isAr ? 'الملف غير موجود' : 'No such file'}`, 'error')
        return
      }
      const passwords = (pwdNode.content || '').split('\n').map(l => l.trim()).filter(Boolean)

      if (username !== ADMIN_EMAIL) {
        addLines([
          { type:'warn',  text: `[*] ${isAr ? 'جاري المحاولة بالمستخدم' : 'Trying username'}: ${username}` },
          { type:'error', text: isAr ? '[✗] لا توجد بيانات صالحة لهذا المستخدم.' : '[✗] No valid credentials found for that username.' },
        ])
        return
      }

      setTermBusy(true)
      addLines(isAr ? [
        { type:'info', text: `[*] جاري هجوم القوة الغاشمة...` },
        { type:'info', text: `[*] الهدف      : ${target}` },
        { type:'info', text: `[*] المستخدم   : ${username}` },
        { type:'info', text: `[*] ملف الكلمات: ${pwdFile} (${passwords.length} كلمة)` },
        { type:'dim',  text: '' },
      ] : [
        { type:'info', text: `[*] Starting brute-force attack...` },
        { type:'info', text: `[*] Target  : ${target}` },
        { type:'info', text: `[*] Username: ${username}` },
        { type:'info', text: `[*] Wordlist: ${pwdFile} (${passwords.length} passwords)` },
        { type:'dim',  text: '' },
      ])

      let i = 0
      const iv = setInterval(() => {
        const pw = passwords[i]
        if (pw === undefined) {
          clearInterval(iv)
          addLine(isAr ? '[✗] لم يتم العثور على كلمة المرور في القائمة.' : '[✗] Password not found in wordlist.', 'error')
          setTermBusy(false)
          return
        }
        if (pw === ADMIN_PASS) {
          clearInterval(iv)
          addLine(`[*] ${isAr ? 'جاري التجربة' : 'Trying'}: ${pw} ...`, 'info')
          setTimeout(() => {
            addLines(isAr ? [
              { type:'dim',     text: '' },
              { type:'success', text: `[✓] ══════════════════════════════════` },
              { type:'success', text: `[✓] تم اكتشاف كلمة المرور!` },
              { type:'success', text: `[✓]   المستخدم  : ${username}` },
              { type:'success', text: `[✓]   كلمة المرور: ${pw}` },
              { type:'success', text: `[✓] ══════════════════════════════════` },
              { type:'dim',     text: '' },
              { type:'warn',    text: `[*] استخدم هذه البيانات لتسجيل الدخول في /login` },
            ] : [
              { type:'dim',     text: '' },
              { type:'success', text: `[✓] ══════════════════════════════════` },
              { type:'success', text: `[✓] PASSWORD FOUND!` },
              { type:'success', text: `[✓]   Username: ${username}` },
              { type:'success', text: `[✓]   Password: ${pw}` },
              { type:'success', text: `[✓] ══════════════════════════════════` },
              { type:'dim',     text: '' },
              { type:'warn',    text: `[*] Use these credentials at /login` },
            ])
            setTermBusy(false)
          }, 400)
        } else {
          addLine(`[*] ${isAr ? 'جاري التجربة' : 'Trying'}: ${pw} ... ✗`, 'fail')
          i++
        }
      }, 350)
      return
    }

    // ── mkdir ──  always creates a FOLDER (even if the name contains a dot)
    if (verb === 'mkdir') {
      const name = parts[1]
      if (!name) { addLine(isAr ? 'الاستخدام: mkdir <اسم>' : 'Usage: mkdir <name>', 'error'); return }
      const node = getFsNode(cwd)
      if (!node) { addLine(isAr ? 'خطأ: المجلد غير موجود' : 'Error: directory not found', 'error'); return }
      if (node[name]) {
        addLine(`mkdir: ${name}: ${isAr ? 'موجود بالفعل' : 'already exists'}`, 'error')
        return
      }
      node[name] = { type: 'dir', children: {} }
      setTermLines(l => [...l])   // force a re-render so display/ls reflects the new folder
      return
    }

    // ── touch ──  always creates a FILE (even if the name has no dot)
    if (verb === 'touch') {
      const name = parts[1]
      if (!name) { addLine(isAr ? 'الاستخدام: touch <اسم>' : 'Usage: touch <name>', 'error'); return }
      const node = getFsNode(cwd)
      if (!node) { addLine(isAr ? 'خطأ: المجلد غير موجود' : 'Error: directory not found', 'error'); return }
      if (node[name]) {
        addLine(`touch: ${name}: ${isAr ? 'موجود بالفعل' : 'already exists'}`, 'error')
        return
      }
      node[name] = { type: 'file', content: '' }
      setTermLines(l => [...l])   // force a re-render so display/ls reflects the new file
      return
    }

    // ── rm ──  rm <file>  removes a file;  rm -r <name>  also removes a directory
    if (verb === 'rm') {
      const recursive = parts.includes('-r') || parts.includes('-rf') || parts.includes('-R')
      const name = parts.slice(1).find(p => !p.startsWith('-'))
      if (!name) { addLine(isAr ? 'الاستخدام: rm <ملف>  أو  rm -r <مجلد>' : 'Usage: rm <file>  or  rm -r <dir>', 'error'); return }
      const node = getFsNode(cwd)
      if (!node || !node[name]) {
        addLine(`rm: ${name}: ${isAr ? 'لا يوجد ملف أو مجلد بهذا الاسم' : 'No such file or directory'}`, 'error')
        return
      }
      if (node[name].type === 'dir' && !recursive) {
        addLine(`rm: ${name}: ${isAr ? 'مجلد — استخدم rm -r لحذفه' : 'is a directory — use rm -r to remove it'}`, 'error')
        return
      }
      delete node[name]
      setTermLines(l => [...l])   // force a re-render so display/ls reflects the removal
      return
    }

    addLine(`bash: ${verb}: ${isAr ? 'الأمر غير موجود' : 'command not found'}`, 'error')
  }

  // ── Challenges ───────────────────────────────────────────────────────────────
  const checkAnswer = id => {
    const ch = CHALLENGES.find(c => c.id === id)
    setResults(r => ({ ...r, [id]: ch.check(answers[id] || '') }))
  }

  const solved = Object.values(results).filter(Boolean).length

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="min-h-screen px-4 py-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🏴</span>
          <h1 className="font-black text-2xl text-[#0E1F39]">
            {isAr ? 'التحدي النهائي' : 'Final Challenge'}
          </h1>
        </div>
        {/* Progress bar */}
        <div className="mt-3 ml-12 flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${(solved / CHALLENGES.length) * 100}%` }}/>
          </div>
          <span className="text-sm font-bold text-slate-600">{solved}/{CHALLENGES.length}</span>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6" style={{ height: 520 }}>
        {/* Terminal — left */}
        <Terminal
          isAr={isAr}
          lines={termLines}
          input={termInput}
          setInput={setTermInput}
          onCommand={handleCommand}
          busy={termBusy}
          outputRef={termOutputRef}
          prompt={promptStr}
        />
        {/* Browser — right */}
        <Browser
          isAr={isAr}
          loggedIn={loggedIn}
          onLogin={() => setLoggedIn(true)}
          url={url}
          urlInput={urlInput}
          setUrlInput={setUrlInput}
          navigate={navigate}
        />
      </div>

      {/* Challenges */}
      <div>
        <h2 className="font-bold text-lg text-[#0E1F39] mb-3 flex items-center gap-2">
          <span>📋</span>
          {isAr ? 'أسئلة التحدي' : 'Challenge Questions'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHALLENGES.map(ch => {
            const res = results[ch.id]
            return (
              <div key={ch.id}
                className={`rounded-2xl border-2 p-4 transition-all ${
                  res === true  ? 'border-green-400 bg-green-50' :
                  res === false ? 'border-red-300 bg-red-50' :
                  'border-slate-200 bg-white'
                }`}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xl">{ch.icon}</span>
                  <div>
                    <span className="text-xs font-bold text-slate-400">Q{ch.id}</span>
                    <p className="font-semibold text-sm text-[#0E1F39] leading-snug">
                      {isAr ? ch.qAr : ch.q}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <input
                    value={answers[ch.id] || ''}
                    onChange={e => {
                      setAnswers(a => ({ ...a, [ch.id]: e.target.value }))
                      setResults(r => ({ ...r, [ch.id]: undefined }))
                    }}
                    onKeyDown={e => e.key === 'Enter' && checkAnswer(ch.id)}
                    placeholder={isAr ? 'اكتب إجابتك...' : 'Your answer...'}
                    disabled={res === true}
                    className={`flex-1 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0E1F39] ${
                      res === true  ? 'bg-green-50 border-green-300 text-green-700' :
                      res === false ? 'bg-red-50 border-red-300' :
                      'border-slate-200'
                    }`}
                  />
                  {res !== true && (
                    <button onClick={() => checkAnswer(ch.id)}
                      className="px-3 py-1.5 bg-[#0E1F39] text-white rounded-lg text-xs font-bold hover:opacity-90">
                      {isAr ? 'تحقق' : 'Check'}
                    </button>
                  )}
                </div>

                <div className="mt-2">
                  {res === true  && <span className="text-green-600 text-xs font-bold">✓ {isAr?'صحيح!':'Correct!'}</span>}
                  {res === false && <span className="text-red-500 text-xs font-bold">✗ {isAr?'خطأ، حاول مجدداً':'Wrong, try again'}</span>}
                </div>
              </div>
            )
          })}
        </div>

        {solved === CHALLENGES.length && (
          <div className="mt-6 bg-green-50 border-2 border-green-400 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-2">🎉</div>
            <h3 className="font-black text-xl text-green-700 mb-1">
              {isAr ? 'أحسنت! اجتزت التحدي النهائي!' : 'Well done! You completed the final challenge!'}
            </h3>
            <p className="text-green-600 text-sm">
              {isAr
                ? 'لقد أثبتت قدرتك على استكشاف الثغرات، اكتشاف الصفحات المحمية، وتحليل بيانات الشركة.'
                : 'You demonstrated your ability to enumerate vulnerabilities, crack credentials, and extract sensitive company data.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
