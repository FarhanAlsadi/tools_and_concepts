import { useState, useEffect, useCallback } from 'react'
import { Globe, Server, Database, RotateCcw, Code2, Eye } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Explanation from '../components/Explanation'

// ── Keyframe animations injected once ────────────────────────────────────────
const ANIM_CSS = `
@keyframes pkt-right { 0%{left:88px;opacity:0} 5%{opacity:1} 90%{opacity:1} 100%{left:calc(100% - 88px);opacity:0} }
@keyframes pkt-left  { 0%{right:88px;opacity:0} 5%{opacity:1} 90%{opacity:1} 100%{right:calc(100% - 88px);opacity:0} }
@keyframes pkt-down  { 0%{top:0px;opacity:0} 5%{opacity:1} 90%{opacity:1} 100%{top:calc(100% - 32px);opacity:0} }
@keyframes pkt-up    { 0%{bottom:0px;opacity:0} 5%{opacity:1} 90%{opacity:1} 100%{bottom:calc(100% - 32px);opacity:0} }
`

// ── Mock database — Qatar data ────────────────────────────────────────────────
const DB = {
  employees: {
    labelAr: 'الموظفون', labelEn: 'Employees', icon: '👥',
    colsAr: ['#', 'الاسم', 'الوظيفة', 'الراتب', 'البريد'],
    colsEn: ['#', 'Name', 'Role', 'Salary', 'Email'],
    rows: [
      { id: 1, cells: ['1', 'عبدالله المري',   'مطوّر برمجيات',      '12,000 ر.ق', 'abdullah@nexora.io'] },
      { id: 2, cells: ['2', 'مريم الكواري',   'مصمّمة UI/UX',       '10,500 ر.ق', 'mariam@nexora.io']   },
      { id: 3, cells: ['3', 'خالد الغانم',    'محلل بيانات',         '11,000 ر.ق', 'khalid@nexora.io']   },
      { id: 4, cells: ['4', 'نور العبيدلي',   'مديرة مشاريع',        '14,000 ر.ق', 'noor@nexora.io']     },
      { id: 5, cells: ['5', 'فهد الهاجري',    'مختبر أمان سيبراني', '13,500 ر.ق', 'fahad@nexora.io']    },
    ],
  },
  customers: {
    labelAr: 'العملاء', labelEn: 'Customers', icon: '🏢',
    colsAr: ['#', 'اسم الشركة', 'المدينة', 'الهاتف', 'الطلبات'],
    colsEn: ['#', 'Company', 'City', 'Phone', 'Orders'],
    rows: [
      { id: 1, cells: ['1', 'قطر للتقنية',    'الدوحة', '+974-4400-1111', '42'] },
      { id: 2, cells: ['2', 'لوسيل ديجيتال',  'لوسيل',  '+974-4400-2222', '17'] },
      { id: 3, cells: ['3', 'الريان سوفت',    'الريان',  '+974-4400-3333', '89'] },
      { id: 4, cells: ['4', 'الوكرة للأنظمة', 'الوكرة',  '+974-4400-4444', '31'] },
    ],
  },
  departments: {
    labelAr: 'الأقسام', labelEn: 'Departments', icon: '🏛️',
    colsAr: ['#', 'القسم', 'المدير', 'الموظفون', 'الميزانية'],
    colsEn: ['#', 'Department', 'Manager', 'Employees', 'Budget'],
    rows: [
      { id: 1, cells: ['1', 'تطوير البرمجيات', 'عبدالله المري',  '12', '500,000 ر.ق'] },
      { id: 2, cells: ['2', 'التسويق الرقمي',  'نور العبيدلي',   '8',  '300,000 ر.ق'] },
      { id: 3, cells: ['3', 'الأمن السيبراني', 'فهد الهاجري',    '5',  '250,000 ر.ق'] },
      { id: 4, cells: ['4', 'دعم الطلاب',      'مريم الكواري',   '10', '200,000 ر.ق'] },
    ],
  },
  invoices: {
    labelAr: 'الفواتير', labelEn: 'Invoices', icon: '🧾',
    colsAr: ['#', 'رقم الفاتورة', 'العميل', 'المبلغ', 'التاريخ'],
    colsEn: ['#', 'Invoice', 'Client', 'Amount', 'Date'],
    rows: [
      { id: 1, cells: ['1', 'INV-001', 'قطر للتقنية',    '45,000 ر.ق', '2024-01-15'] },
      { id: 2, cells: ['2', 'INV-002', 'لوسيل ديجيتال',  '12,500 ر.ق', '2024-02-01'] },
      { id: 3, cells: ['3', 'INV-003', 'الريان سوفت',    '88,000 ر.ق', '2024-02-18'] },
      { id: 4, cells: ['4', 'INV-004', 'الوكرة للأنظمة', '23,000 ر.ق', '2024-03-05'] },
      { id: 5, cells: ['5', 'INV-005', 'قطر للتقنية',    '67,000 ر.ق', '2024-03-22'] },
    ],
  },
  courses: {
    labelAr: 'الدورات', labelEn: 'Courses', icon: '📚',
    colsAr: ['#', 'اسم الدورة', 'الفئة', 'السعر', 'المتسجلون'],
    colsEn: ['#', 'Course Name', 'Category', 'Price', 'Enrolled'],
    rows: [
      { id: 1, cells: ['1', 'أساسيات البرمجة بـ Python',  'برمجة',        '1,200 ر.ق', '340 طالب'] },
      { id: 2, cells: ['2', 'تصميم المواقع بـ React',      'تطوير الويب',  '1,500 ر.ق', '210 طالب'] },
      { id: 3, cells: ['3', 'أمن المعلومات للمبتدئين',     'أمن سيبراني',  '1,800 ر.ق', '155 طالب'] },
      { id: 4, cells: ['4', 'تحليل البيانات بـ Excel',     'بيانات',       '900 ر.ق',   '420 طالب'] },
      { id: 5, cells: ['5', 'تطوير تطبيقات الجوال',        'تطبيقات',      '2,000 ر.ق', '98 طالب']  },
    ],
  },
}

const PAGES = [
  { id: 'employees',   labelAr: 'الموظفون', labelEn: 'Employees',   icon: '👥', path: '/employees',   table: 'employees'   },
  { id: 'customers',   labelAr: 'العملاء',  labelEn: 'Customers',   icon: '🏢', path: '/customers',   table: 'customers'   },
  { id: 'courses',     labelAr: 'الدورات',  labelEn: 'Courses',     icon: '📚', path: '/courses',     table: 'courses'     },
  { id: 'departments', labelAr: 'الأقسام',  labelEn: 'Departments', icon: '🏛️', path: '/departments', table: 'departments' },
  { id: 'invoices',    labelAr: 'الفواتير', labelEn: 'Invoices',    icon: '🧾', path: '/invoices',    table: 'invoices'    },
]

const STEPS = {
  ar: [
    { label: 'اختر صفحة للبدء',                      desc: 'اختر إحدى الصفحات لتبدأ محاكاة الطلب' },
    { label: '📤 المتصفح يرسل الطلب للخادم',         desc: 'المتصفح يرسل طلب GET للخادم يحتوي على الرابط الكامل للصفحة المطلوبة' },
    { label: '🔍 الخادم يستعلم قاعدة البيانات',      desc: 'الخادم استلم الطلب ويحتاج بيانات — يرسل استعلاماً (Query) لقاعدة البيانات' },
    { label: '🗄️ قاعدة البيانات جاهزة',              desc: 'اختر الجدول والصفوف التي تريد إرجاعها، ثم اضغط "إرسال الاستعلام"' },
    { label: '📦 قاعدة البيانات ترسل البيانات للخادم', desc: 'قاعدة البيانات أرسلت الصفوف المختارة إلى الخادم' },
    { label: '📥 الخادم يرسل الصفحة للمتصفح',        desc: 'الخادم بنى صفحة الويب باستخدام البيانات وأرسلها للمتصفح' },
    { label: '✅ اكتملت العملية',                     desc: 'المتصفح استلم البيانات وعرضها للمستخدم — هكذا تعمل معظم صفحات الويب!' },
  ],
  en: [
    { label: 'Choose a page to start',               desc: 'Select one of the pages to begin the request simulation' },
    { label: '📤 Browser Sends Request to Server',   desc: 'The browser sends a GET request to the server with the full page URL' },
    { label: '🔍 Server Queries Database',           desc: 'Server received the request and needs data — sends a query to the database' },
    { label: '🗄️ Database Ready',                   desc: 'Choose which table and rows to return, then click "Send Query"' },
    { label: '📦 Database Returns Data to Server',   desc: 'The database sent the selected rows back to the server' },
    { label: '📥 Server Sends Page to Browser',      desc: 'The server built the webpage using the data and sent it to the browser' },
    { label: '✅ Complete',                          desc: 'Browser received the data and displayed it — this is how most web pages work!' },
  ],
}

function buildSQL(tableName, rowIds) {
  if (!tableName) return ''
  if (rowIds.length === 0) return `SELECT * FROM ${tableName};`
  if (rowIds.length === 1) return `SELECT * FROM ${tableName}\nWHERE id = ${rowIds[0]};`
  return `SELECT * FROM ${tableName}\nWHERE id IN (${rowIds.join(', ')});`
}

// ── Node box ──────────────────────────────────────────────────────────────────
function NodeBox({ Icon, label, active, done, pulse, color }) {
  const C = {
    blue:   { ring: 'ring-2 ring-blue-400 bg-blue-100',     icon: 'text-blue-600',    text: 'text-blue-700'   },
    cyan:   { ring: 'ring-2 ring-cyan-400 bg-cyan-100',     icon: 'text-cyan-600',    text: 'text-cyan-700'   },
    purple: { ring: 'ring-2 ring-purple-400 bg-purple-100', icon: 'text-purple-600',  text: 'text-purple-700' },
    green:  { ring: 'ring-2 ring-emerald-400 bg-emerald-100', icon: 'text-emerald-600', text: 'text-emerald-700' },
    slate:  { ring: 'border border-slate-200 bg-white',     icon: 'text-slate-400',   text: 'text-slate-500'  },
  }
  const c = C[active ? color : done ? 'green' : 'slate']
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-500 ${c.ring}`}>
        <Icon className={`w-7 h-7 transition-colors duration-500 ${c.icon} ${pulse && active ? 'animate-pulse' : ''}`} />
      </div>
      <span className={`text-xs font-bold text-center leading-tight transition-colors duration-500 ${c.text}`} style={{ maxWidth: 72 }}>{label}</span>
    </div>
  )
}

// ── Animated packet label ─────────────────────────────────────────────────────
function Packet({ text, dir, color = 'cyan', topOffset = 20 }) {
  const bg  = color === 'cyan' ? 'bg-cyan-500 text-white' : 'bg-emerald-500 text-white'
  const anim = { right: 'pkt-right', left: 'pkt-left', down: 'pkt-down', up: 'pkt-up' }[dir]
  const isH = dir === 'right' || dir === 'left'
  return (
    <div
      className={`absolute z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono shadow-lg whitespace-nowrap ${bg}`}
      style={{ animation: `${anim} 2s ease forwards`, pointerEvents: 'none', ...(isH ? { top: topOffset } : { [dir === 'down' ? 'left' : 'right']: 8 }) }}
    >
      {text}
    </div>
  )
}

// ── Flow diagram — L-shape layout ─────────────────────────────────────────────
function FlowDiagram({ step, selectedPage, lang }) {
  const ar = lang === 'ar'
  const fullUrl  = selectedPage ? `https://nexora.io${selectedPage.path}` : ''
  const shortUrl = selectedPage ? `GET ${selectedPage.path}` : ''

  // Which arrows are lit — step-specific only (not cumulative)
  const hReq = step === 1 // Browser→Server active only during step 1
  const hRes = step === 5 // Server→Browser active only during step 5
  const vReq = step === 2 // Server→DB active only during step 2
  const vRes = step === 4 // DB→Server active only during step 4

  // Which nodes are done
  const bDone  = step >= 6
  const sDone  = step >= 5
  const dbDone = step >= 4

  return (
    <div dir="ltr" className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-4 select-none">

      {/* Full URL bar when in flight */}
      {step >= 1 && step <= 5 && fullUrl && (
        <div className="mb-3 flex items-center gap-2 bg-white border border-cyan-200 rounded-xl px-3 py-2">
          <span className="text-xs text-slate-400 font-medium flex-shrink-0">{ar ? 'الطلب:' : 'Request:'}</span>
          <code className="text-xs font-mono text-cyan-700 font-bold">{fullUrl}</code>
        </div>
      )}

      {/* Top row: Browser ←—————————→ Server */}
      <div className="flex items-center gap-2">

        {/* Browser */}
        <NodeBox Icon={Globe} label={ar ? 'المتصفح' : 'Browser'}
          active={[1,5,6].includes(step)} done={bDone} pulse={step===1} color="blue" />

        {/* Horizontal track */}
        <div className="flex-1 relative" style={{ height: 64 }}>
          {/* → request line */}
          <div className={`absolute left-0 right-0 h-0.5 rounded-full transition-colors duration-500 ${hReq ? 'bg-cyan-400' : 'bg-slate-200'}`} style={{ top: 14 }} />
          {/* ← response line */}
          <div className={`absolute left-0 right-0 h-0.5 rounded-full transition-colors duration-500 ${hRes ? 'bg-emerald-400' : 'bg-slate-200'}`} style={{ top: 44 }} />

          {/* → label (below the request line) */}
          <div className="absolute left-0 right-0 flex justify-center" style={{ top: 20 }}>
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full transition-colors duration-300 ${hReq ? 'text-cyan-600 bg-cyan-50' : 'text-slate-300'}`}>
              {ar ? 'طلب ←' : '→ request'}
            </span>
          </div>
          {/* ← label (below the response line) */}
          <div className="absolute left-0 right-0 flex justify-center" style={{ top: 50 }}>
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full transition-colors duration-300 ${hRes ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300'}`}>
              {ar ? '→ استجابة' : '← response'}
            </span>
          </div>

          {/* Animated packets — request travels above the label, response between the lines */}
          {step === 1 && <Packet key={`bs-req-${step}`} text={shortUrl} dir="right" color="cyan" topOffset={2} />}
          {step === 5 && <Packet key={`bs-res-${step}`} text={ar ? 'صفحة الويب ✓' : 'Web Page ✓'} dir="left" color="green" topOffset={30} />}
        </div>

        {/* Server */}
        <NodeBox Icon={Server} label={ar ? 'خادم الموقع' : 'Web Server'}
          active={[1,2,4,5].includes(step)} done={sDone} pulse={step===2} color="cyan" />
      </div>

      {/* Right side: vertical track from Server down to Database */}
      <div className="flex">
        <div className="flex-1" /> {/* spacer to push vertical track to the right */}

        {/* Vertical track + Database node below server */}
        <div className="flex flex-col items-center" style={{ width: 64 }}>
          {/* Vertical track */}
          <div className="relative flex flex-col items-center" style={{ width: 64, height: 72 }}>
            {/* → down line */}
            <div className={`absolute top-0 bottom-0 w-0.5 rounded-full transition-colors duration-500 ${vReq ? 'bg-cyan-400' : 'bg-slate-200'}`} style={{ left: 22 }} />
            {/* ← up line */}
            <div className={`absolute top-0 bottom-0 w-0.5 rounded-full transition-colors duration-500 ${vRes ? 'bg-emerald-400' : 'bg-slate-200'}`} style={{ left: 34 }} />

            {/* Labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-center gap-1" style={{ marginLeft: -28 }}>
              <span className={`text-xs font-mono whitespace-nowrap transition-colors duration-300 ${vReq ? 'text-cyan-600' : 'text-slate-300'}`}>{ar ? '↓ استعلام' : '↓ query'}</span>
              <span className={`text-xs font-mono whitespace-nowrap transition-colors duration-300 ${vRes ? 'text-emerald-600' : 'text-slate-300'}`}>{ar ? '↑ بيانات' : '↑ data'}</span>
            </div>

            {/* Animated packets on vertical track */}
            {step === 2 && (
              <div className="absolute z-20" style={{ left: 10, top: 0, animation: 'pkt-down 2s ease forwards' }}>
                <span className="bg-cyan-500 text-white text-xs font-mono px-2 py-0.5 rounded-full shadow whitespace-nowrap">Query</span>
              </div>
            )}
            {step === 4 && (
              <div className="absolute z-20" style={{ left: 10, bottom: 0, animation: 'pkt-up 2s ease forwards' }}>
                <span className="bg-emerald-500 text-white text-xs font-mono px-2 py-0.5 rounded-full shadow whitespace-nowrap">Data</span>
              </div>
            )}
          </div>

          {/* Database node */}
          <NodeBox Icon={Database} label={ar ? 'قاعدة البيانات' : 'Database'}
            active={[2,3,4].includes(step)} done={dbDone} pulse={step===3} color="purple" />
        </div>
      </div>
    </div>
  )
}

// ── DB panel ──────────────────────────────────────────────────────────────────
function DBPanel({ step, selectedTable, setSelectedTable, selectedRows, setSelectedRows, onSendQuery, sqlMode, lang }) {
  if (step !== 3) return null
  const ar = lang === 'ar'
  const table = selectedTable ? DB[selectedTable] : null
  const allSelected = table && selectedRows.length === table.rows.length
  const toggleRow = id => setSelectedRows(p => p.includes(id) ? p.filter(r => r !== id) : [...p, id])
  const toggleAll = () => { if (!table) return; setSelectedRows(allSelected ? [] : table.rows.map(r => r.id)) }

  return (
    <div className="bg-white rounded-2xl border-2 border-purple-200 overflow-hidden shadow-sm mt-5">
      <div className="bg-purple-600 px-4 py-2.5 flex items-center gap-2">
        <Database className="w-4 h-4 text-white" />
        <span className="text-white font-bold text-sm">{ar ? '🗄️ قاعدة البيانات — اختر الجدول والصفوف' : '🗄️ Database — Choose Table & Rows'}</span>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tables */}
        <div>
          <p className="text-xs font-bold text-slate-600 mb-2">{ar ? '① اختر الجدول:' : '① Choose a table:'}</p>
          <div className="space-y-1.5">
            {Object.keys(DB).map(key => {
              const t = DB[key]
              return (
                <button key={key} onClick={() => { setSelectedTable(key); setSelectedRows([]) }}
                  className={`w-full text-start flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${selectedTable === key ? 'bg-purple-50 border-purple-400 text-purple-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-purple-200'}`}>
                  <span>{t.icon}</span>
                  <span>{ar ? t.labelAr : t.labelEn}</span>
                  {selectedTable === key && <span className="ml-auto text-purple-500">✓</span>}
                </button>
              )
            })}
          </div>
        </div>
        {/* Rows */}
        <div>
          {table ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-600">{ar ? '② اختر الصفوف:' : '② Select rows:'}</p>
                <button onClick={toggleAll} className="text-xs px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium transition-colors">
                  {allSelected ? (ar ? 'إلغاء الكل' : 'Deselect All') : (ar ? 'اختر الكل' : 'Select All')}
                </button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {table.rows.map(row => {
                  const checked = selectedRows.includes(row.id)
                  return (
                    <label key={row.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 cursor-pointer transition-all ${checked ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-emerald-200'}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleRow(row.id)} className="accent-emerald-500 w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-mono text-slate-700 truncate">{row.cells.slice(0, 3).join(' · ')}</span>
                    </label>
                  )
                })}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{ar ? `${selectedRows.length === 0 ? 'كل' : selectedRows.length} صف محدد` : `${selectedRows.length === 0 ? 'All' : selectedRows.length} row${selectedRows.length !== 1 ? 's' : ''} selected`}</p>
              {sqlMode && (
                <div className="mt-2 bg-slate-900 rounded-xl p-3 font-mono text-xs text-green-300 whitespace-pre" dir="ltr">{buildSQL(selectedTable, selectedRows)}</div>
              )}
              <button onClick={onSendQuery} className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors">
                {ar ? '▶ إرسال الاستعلام للخادم' : '▶ Send Query to Server'}
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm py-10">{ar ? '← اختر جدولاً أولاً' : '← Choose a table first'}</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Website browser mockup ────────────────────────────────────────────────────
function WebsiteBrowser({ step, selectedPage, selectedTable, selectedRows, lang }) {
  const ar = lang === 'ar'
  const url = selectedPage && step >= 1 ? `https://nexora.io${selectedPage.path}` : 'https://nexora.io/home'
  const table = selectedTable ? DB[selectedTable] : null
  const cols  = table ? (ar ? table.colsAr : table.colsEn) : []
  const rows  = table ? (selectedRows.length === 0 ? table.rows : table.rows.filter(r => selectedRows.includes(r.id))) : []
  const loading = step >= 1 && step <= 5

  return (
    <div className="rounded-2xl border-2 border-slate-300 overflow-hidden shadow-xl bg-white">
      {/* Chrome bar */}
      <div className="bg-slate-200 px-3 py-2 flex items-center gap-2.5 border-b border-slate-300">
        <div className="flex gap-1.5 flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        {/* URL bar — full, never truncated */}
        <div className="flex-1 bg-white rounded-lg flex items-center gap-2 px-3 py-1 border border-slate-300 min-w-0">
          <Globe className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-mono text-slate-700 flex-1">{url}</span>
          {loading && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />}
          {step === 6 && <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />}
        </div>
      </div>

      {/* Page content */}
      <div style={{ minHeight: 240 }}>
        {/* Skeleton while loading */}
        {loading && (
          <div className="p-5 space-y-3 animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-48" />
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-4/5" />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}
            </div>
            <div className="h-3 bg-slate-100 rounded w-3/5 mt-2" />
          </div>
        )}

        {/* Home page (step 0 or no selection) */}
        {!loading && step === 0 && (
          <div>
            <div className="bg-gradient-to-br from-[#0E1F39] to-[#1a3a6b] text-white px-5 py-7">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🐪</span>
                <span className="font-black text-base tracking-tight">Nexora</span>
                <span className="text-xs text-blue-300 ml-auto font-mono">nexora.io</span>
              </div>
              <h2 className="text-lg font-black mb-1 leading-snug">
                {ar ? 'تعلّم البرمجة في قطر 🇶🇦' : 'Learn Coding in Qatar 🇶🇦'}
              </h2>
              <p className="text-blue-200 text-xs leading-relaxed max-w-xs mb-4">
                {ar
                  ? 'أكاديمية كود قطر — نُعلّم الجيل القادم أساسيات البرمجة والأمن السيبراني من الصفر حتى الاحتراف.'
                  : "Qatar's leading coding academy — teaching the next generation programming & cybersecurity from zero to professional."}
              </p>
              <div className="flex gap-2">
                <span className="bg-[#FCAD0F] text-[#0E1F39] text-xs font-bold px-3 py-1.5 rounded-lg cursor-default">{ar ? 'استعرض الدورات' : 'Browse Courses'}</span>
                <span className="border border-blue-400 text-blue-200 text-xs px-3 py-1.5 rounded-lg cursor-default">{ar ? 'تواصل معنا' : 'Contact Us'}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
              {[['🎓', '+1,200', ar ? 'طالب في قطر' : 'Students in Qatar'],
                ['📚', '15+',   ar ? 'دورة متخصصة'  : 'Specialised Courses'],
                ['⭐', '4.9',   ar ? 'تقييم الطلاب'  : 'Student Rating']].map(([ic, v, l]) => (
                <div key={l} className="flex flex-col items-center py-3">
                  <span className="text-lg">{ic}</span>
                  <span className="font-black text-slate-800 text-sm">{v}</span>
                  <span className="text-slate-400 text-xs text-center">{l}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 mb-2">🔥 {ar ? 'أبرز الدورات' : 'Featured Courses'}</p>
              {[['🐍', ar ? 'Python للمبتدئين' : 'Python for Beginners', '1,200'],
                ['🌐', ar ? 'تطوير الويب بـ React' : 'Web Dev with React', '1,500'],
                ['🔐', ar ? 'الأمن السيبراني' : 'Cybersecurity', '1,800']].map(([ic, n, p]) => (
                <div key={n} className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg px-2 py-1.5 mb-1">
                  <span>{ic}</span>
                  <span className="flex-1 text-slate-700 font-medium">{n}</span>
                  <span className="text-[#FCAD0F] font-bold">{p} {ar ? 'ر.ق' : 'QAR'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result page (step 6) */}
        {!loading && step === 6 && table && (
          <div>
            <div className="bg-gradient-to-r from-[#0E1F39] to-[#1a3a6b] text-white px-4 py-3 flex items-center gap-3">
              <span className="text-xl">{table.icon}</span>
              <div>
                <p className="font-bold text-sm">{ar ? table.labelAr : table.labelEn}</p>
                <p className="text-blue-300 text-xs font-mono">{url}</p>
              </div>
              <span className="ml-auto bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {rows.length} {ar ? 'صف' : 'rows'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" dir="ltr">
                <thead>
                  <tr className="bg-slate-100">
                    {cols.map(c => <th key={c} className="px-3 py-2 text-left font-bold text-slate-600 border-b border-slate-200 whitespace-nowrap">{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                      {row.cells.map((cell, i) => <td key={i} className="px-3 py-2 text-slate-700 whitespace-nowrap">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Page3ClientServer() {
  const { lang } = useApp()
  const ar = lang === 'ar'

  const [step, setStep]                   = useState(0)
  const [selectedPage, setSelectedPage]   = useState(null)
  const [selectedTable, setSelectedTable] = useState(null)
  const [selectedRows, setSelectedRows]   = useState([])
  const [sqlMode, setSqlMode]             = useState(false)

  // Inject keyframe CSS once
  useEffect(() => {
    if (document.getElementById('pkt-anim-css')) return
    const s = document.createElement('style')
    s.id = 'pkt-anim-css'
    s.textContent = ANIM_CSS
    document.head.appendChild(s)
  }, [])

  // Auto-advance non-interactive steps
  useEffect(() => {
    if (step === 1) { const t = setTimeout(() => setStep(2), 2200); return () => clearTimeout(t) }
    if (step === 2) { const t = setTimeout(() => setStep(3), 2200); return () => clearTimeout(t) }
    if (step === 4) { const t = setTimeout(() => setStep(5), 2000); return () => clearTimeout(t) }
    if (step === 5) { const t = setTimeout(() => setStep(6), 2000); return () => clearTimeout(t) }
  }, [step])

  const startRequest = useCallback(page => {
    setSelectedPage(page); setSelectedTable(page.table); setSelectedRows([]); setStep(1)
  }, [])
  const sendQuery = useCallback(() => setStep(4), [])
  const reset     = useCallback(() => { setStep(0); setSelectedPage(null); setSelectedTable(null); setSelectedRows([]) }, [])

  const stepInfo = STEPS[lang][step] || STEPS[lang][0]

  return (
    <div className="page-transition max-w-5xl mx-auto px-4 py-8" dir={ar ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="mb-5">
        <span className="bg-cyan-100 text-cyan-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{ar ? 'درس ٢' : 'Lesson 2'}</span>
        <h1 className="text-3xl font-black text-slate-800 mt-2 mb-1">{ar ? 'كيف يعمل الويب؟' : 'How Does the Web Work?'}</h1>
      </div>

      {/* Two-column layout: main content | page selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left / main (col-span-2) ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {step > 0 && (
              <button onClick={reset} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />{ar ? 'إعادة' : 'Reset'}
              </button>
            )}
            <button onClick={() => setSqlMode(s => !s)} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl transition-colors ${sqlMode ? 'bg-slate-800 text-green-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {sqlMode ? <Code2 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {sqlMode ? 'SQL Mode' : (ar ? 'الوضع المرئي' : 'Visual Mode')}
            </button>
          </div>

          {/* Flow diagram */}
          <FlowDiagram step={step} selectedPage={selectedPage} lang={lang} />

          {/* Step explanation */}
          <div className={`rounded-2xl px-4 py-3 border transition-all ${step === 6 ? 'bg-emerald-50 border-emerald-200' : step === 3 ? 'bg-purple-50 border-purple-200' : step > 0 ? 'bg-cyan-50 border-cyan-200' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`font-bold text-sm mb-0.5 ${step === 6 ? 'text-emerald-800' : step === 3 ? 'text-purple-800' : step > 0 ? 'text-cyan-800' : 'text-slate-700'}`}>{stepInfo.label}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{stepInfo.desc}</p>
          </div>

          {/* In-flight status (steps 1-2, 4-5) */}
          {([1,2,4,5].includes(step)) && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium animate-pulse ${step <= 2 ? 'bg-cyan-100 text-cyan-700' : 'bg-emerald-100 text-emerald-700'}`}>
              <span className="w-2 h-2 rounded-full bg-current flex-shrink-0" />
              {step === 1 && (ar ? 'المتصفح يرسل الطلب...' : 'Browser sending request...')}
              {step === 2 && (ar ? 'الخادم يستعلم قاعدة البيانات...' : 'Server querying database...')}
              {step === 4 && (ar ? `إرسال ${selectedRows.length || 'كل'} صف للخادم...` : `Sending ${selectedRows.length || 'all'} rows to server...`)}
              {step === 5 && (ar ? 'الخادم يبني الصفحة ويرسلها...' : 'Server building and sending page...')}
            </div>
          )}

          {/* DB panel */}
          <DBPanel step={step} selectedTable={selectedTable} setSelectedTable={setSelectedTable}
            selectedRows={selectedRows} setSelectedRows={setSelectedRows}
            onSendQuery={sendQuery} sqlMode={sqlMode} lang={lang} />

          {/* SQL summary at step 6 */}
          {step === 6 && sqlMode && selectedTable && (
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1.5 font-mono">{ar ? '-- الاستعلام الذي نُفِّذ:' : '-- Query executed:'}</p>
              <pre className="font-mono text-green-300 text-sm" dir="ltr">{buildSQL(selectedTable, selectedRows)}</pre>
            </div>
          )}

          {/* Reset CTA */}
          {step === 6 && (
            <div className="flex justify-center">
              <button onClick={reset} className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors">
                <RotateCcw className="w-4 h-4" />{ar ? 'جرّب صفحة أخرى' : 'Try Another Page'}
              </button>
            </div>
          )}

          {/* Browser window */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-bold text-slate-600">{ar ? 'نافذة المتصفح' : 'Browser Window'}</span>
              {step === 6 && <span className="ml-auto text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">✅ {ar ? 'استُلمت الاستجابة' : 'Response received'}</span>}
            </div>
            <WebsiteBrowser step={step} selectedPage={selectedPage} selectedTable={selectedTable} selectedRows={selectedRows} lang={lang} />
          </div>

        </div>

        {/* ── Right sidebar: page selector ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <p className="text-sm font-bold text-slate-700 mb-3">
              {step === 0
                ? (ar ? '🌐 اختر صفحة للطلب:' : '🌐 Choose a page to request:')
                : (ar ? '🌐 الصفحات المتاحة:' : '🌐 Available pages:')}
            </p>
            <div className="space-y-2">
              {PAGES.map(page => {
                const isSelected = selectedPage?.id === page.id
                return (
                  <button key={page.id}
                    onClick={() => step === 0 ? startRequest(page) : undefined}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-start ${
                      isSelected
                        ? 'bg-cyan-50 border-cyan-400 shadow-md'
                        : step === 0
                          ? 'bg-white border-slate-200 hover:border-cyan-200 hover:bg-cyan-50/40 shadow-sm cursor-pointer'
                          : 'bg-white border-slate-100 opacity-60 cursor-default'
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0">{page.icon}</span>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold leading-tight ${isSelected ? 'text-cyan-700' : 'text-slate-700'}`}>
                        {ar ? page.labelAr : page.labelEn}
                      </p>
                      <code className={`text-xs font-mono ${isSelected ? 'text-cyan-500' : 'text-slate-400'}`}>{page.path}</code>
                    </div>
                    {isSelected && <span className="ml-auto text-cyan-500 text-sm flex-shrink-0">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

      </div>

      <Explanation>
        <p className="text-slate-500 text-sm mb-4">{ar ? 'شاهد رحلة الطلب: المتصفح → الخادم → قاعدة البيانات → الخادم → المتصفح' : 'Watch the journey: Browser → Server → Database → Server → Browser'}</p>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <h3 className="font-bold text-amber-800 text-sm mb-2">💡 {ar ? 'ماذا تعلمنا؟' : 'Key Takeaways'}</h3>
          <ul className="space-y-1.5">
            {(ar ? [
              'المتصفح يرسل الرابط الكامل للخادم',
              'الخادم يستعلم قاعدة البيانات',
              'قاعدة البيانات ترسل الصفوف المطلوبة',
              'الخادم يبني الصفحة من البيانات',
            ] : [
              'Browser sends the full URL to server',
              'Server queries the database',
              'Database returns the requested rows',
              'Server builds the page from data',
            ]).map((t, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-amber-800">
                <span className="text-amber-500 flex-shrink-0">✓</span>{t}
              </li>
            ))}
          </ul>
        </div>
      </Explanation>
    </div>
  )
}
