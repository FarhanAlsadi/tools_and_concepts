import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Terminal, Cpu, Shield, Globe, ChevronLeft } from 'lucide-react'
import { SCAN_LINES, PAGES_FILE_CONTENT } from '../data/terminalData'

// ─── File system (shared across all lesson contexts) ──────────────────────────
function getNode(fs, pathArr) {
  let node = { type: 'dir', children: fs }
  for (const seg of pathArr) {
    if (!node.children || !(seg in node.children)) return null
    node = node.children[seg]
  }
  return node
}
function setNode(fs, pathArr, name, node) {
  if (pathArr.length === 0) return { ...fs, [name]: node }
  const [h, ...rest] = pathArr
  if (!fs[h] || fs[h].type !== 'dir') return fs
  return { ...fs, [h]: { ...fs[h], children: setNode(fs[h].children || {}, rest, name, node) } }
}
function removeNode(fs, pathArr, name) {
  if (pathArr.length === 0) { const n = { ...fs }; delete n[name]; return n }
  const [h, ...rest] = pathArr
  if (!fs[h] || fs[h].type !== 'dir') return fs
  return { ...fs, [h]: { ...fs[h], children: removeNode(fs[h].children || {}, rest, name) } }
}

const TARGET = 'https://qatartech.qa'

const INITIAL_FS = {
  'readme.txt': { type: 'file', content: `مختبر الطرفية التفاعلي — بيئة تعليمية
=====================================
مرحباً بك في المختبر المركزي للطرفية!

هذا المختبر يجمع أدوات جميع الدروس في مكان واحد.

الأدوات المتاحة:
  kashif  — اكتشاف الصفحات المخفية
  barq    — محاكاة هجوم القوة الغاشمة
  nslookup — استعلام DNS
  firewall — عرض قواعد الجدار الناري
  whoami  — معلومات المستخدم الحالي

اكتب: help  لعرض جميع الأوامر` },
  'passwords.txt': { type: 'file', content: `# ملف كلمات المرور التعليمي
# يُستخدم مع أداة barq
password
123456
admin
letmein
qwerty
qatar2024
doha@2024
sunshine1
admin123
test123
# ... (100 كلمة مرور إجمالاً)` },
  'pages_file.txt': { type: 'file', content: PAGES_FILE_CONTENT },
  'tools': {
    type: 'dir',
    children: {
      'kashif_guide.txt': { type: 'file', content: `دليل أداة كاشف
================
الأمر: kashif <موقع> <ملف_كلمات>
مثال:  kashif ${TARGET} pages_file.txt

ما تفعله:
  تجرب كل مسار في ملف الكلمات على الموقع
  وتسجل الصفحات التي تستجيب بنجاح` },
      'barq_guide.txt': { type: 'file', content: `دليل أداة برق
================
الأمر: barq <مستخدم> <ملف_كلمات> <منصة>
مثال:  barq ahmed passwords.txt instagram
       barq sara passwords.txt tiktok

المنصات المتاحة (10):
  instagram | tiktok | snapchat | roblox | minecraft
  twitter | facebook | discord | youtube | gmail

ملاحظة: كلمة المرور تتغير حسب اسم المستخدم!
جرّب نفس المنصة بأسماء مختلفة لترى الفرق.

ما تفعله:
  تجرب كل كلمة مرور في الملف
  وتوقف عند اكتشاف الكلمة الصحيحة` },
      'nslookup_guide.txt': { type: 'file', content: `دليل استعلام DNS
==================
الأمر: nslookup <نطاق>
مثال:  nslookup instagram.com
        nslookup google.com

ما تفعله:
  يُرجع عنوان IP للنطاق المطلوب
  يُظهر كيف يعمل نظام DNS` },
    }
  },
  'lessons': {
    type: 'dir',
    children: {
      'lesson1_routes.txt': { type: 'file', content: `درس المسارات والصفحات المخفية
==============================
المسارات الموجودة في ${TARGET}:
  /home       - الصفحة الرئيسية
  /about      - من نحن
  /contact    - تواصل معنا
  /admin      - ⚠️ لوحة التحكم (حساسة!)
  /employees  - ⚠️ بيانات الموظفين (حساسة!)
  /flag       - ⚠️ الرمز السري

جرب: kashif ${TARGET} pages_file.txt` },
      'lesson2_dns.txt': { type: 'file', content: `درس DNS
==========
DNS = Domain Name System (نظام أسماء النطاقات)
يحول الأسماء إلى أرقام IP:
  instagram.com  →  157.240.3.35
  google.com     →  142.250.185.78
  qatartech.qa   →  185.77.23.10

جرب: nslookup instagram.com` },
    }
  },
}

// ─── DNS simulation ───────────────────────────────────────────────────────────
const DNS_RECORDS = {
  'instagram.com': '157.240.3.35',
  'google.com': '142.250.185.78',
  'snapchat.com': '199.16.156.39',
  'twitter.com': '104.244.42.65',
  'qatartech.qa': '185.77.23.10',
  'doha.gov.qa': '212.58.40.20',
  'qu.edu.qa': '193.188.48.10',
}

// ─── Firewall rules ───────────────────────────────────────────────────────────
const FW_RULES = [
  { id: 1, type: 'BLOCK', match: 'IP',      value: '185.77.23.10',  desc: 'حجب المهاجم المعروف' },
  { id: 2, type: 'BLOCK', match: 'keyword', value: 'hack',          desc: 'حجب الكلمات الخطرة' },
  { id: 3, type: 'ALLOW', match: 'keyword', value: 'email',         desc: 'السماح بحركة البريد' },
  { id: 4, type: 'ALLOW', match: 'ALL',     value: '*',             desc: 'السماح بباقي الحركة' },
]

// ─── Nano Editor Overlay ─────────────────────────────────────────────────────
function NanoEditor({ filename, content, onSave, onExit }) {
  const [text, setText] = useState(content)
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef(null)
  useEffect(() => { textareaRef.current?.focus() }, [])
  const handleSave = () => { onSave(text); setSaved(true); setTimeout(() => setSaved(false), 1500) }
  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'x') { e.preventDefault(); onExit(text) }
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSave() }
    if (e.ctrlKey && e.key === 'o') { e.preventDefault(); handleSave() }
  }
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 font-mono">
      <div className="bg-slate-700 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-6">
        <span className="text-slate-400">GNU nano 6.4</span>
        <span className="font-bold text-white">File: {filename}</span>
        {saved && <span className="text-green-400 font-bold">[ Saved ]</span>}
      </div>
      <textarea ref={textareaRef} value={text} onChange={e => { setText(e.target.value); setSaved(false) }} onKeyDown={handleKeyDown}
        className="flex-1 bg-slate-900 text-green-300 p-4 resize-none outline-none text-sm font-mono leading-relaxed" spellCheck={false} />
      <div className="bg-slate-800 border-t border-slate-700 text-slate-300 text-xs px-3 py-1.5 flex flex-wrap gap-x-5 gap-y-1">
        <span><span className="text-white font-bold">^X</span> Exit</span>
        <span><span className="text-white font-bold">^S</span> Save</span>
        <span><span className="text-white font-bold">^O</span> Write Out</span>
        <span className="text-slate-500">( Ctrl + key )</span>
      </div>
    </div>
  )
}

// ─── Line renderer ────────────────────────────────────────────────────────────
function TLine({ line }) {
  const base = 'text-xs font-mono'
  if (line.type === 'cmd')     return <div className="flex gap-1.5" dir="ltr"><span className="text-green-400 select-none">{line.prompt}</span><span className="text-white">{line.text}</span></div>
  if (line.type === 'error')   return <div className={`${base} text-red-400 pl-2`} dir="ltr">{line.text}</div>
  if (line.type === 'success') return <div className={`${base} text-green-400 pl-2`} dir="ltr">{line.text}</div>
  if (line.type === 'info')    return <div className={`${base} text-blue-400 pl-2`} dir="ltr">{line.text}</div>
  if (line.type === 'warn')    return <div className={`${base} text-yellow-400 pl-2`} dir="ltr">{line.text}</div>
  if (line.type === 'output')  return <div className={`${base} text-slate-300 pl-2`} dir="ltr">{line.text}</div>
  if (line.type === 'cat')     return <pre className={`${base} text-slate-300 whitespace-pre-wrap leading-relaxed pl-2`} dir="ltr">{line.text}</pre>
  if (line.type === 'sep')     return <div className={`${base} text-slate-700`} dir="ltr">{'─'.repeat(56)}</div>
  if (line.type === 'ls') {
    return (
      <div className="flex flex-wrap gap-x-5 gap-y-0.5 pl-2" dir="ltr">
        {line.items.map((item, i) => (
          <span key={i} className={`text-xs font-mono ${item.isDir ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>
            {item.name}{item.isDir ? '/' : ''}
          </span>
        ))}
      </div>
    )
  }
  if (line.type === 'scan-found') return <div className={`${base} flex gap-2 pl-2 ${line.sensitive ? 'text-red-400' : 'text-green-400'}`} dir="ltr"><span className="font-bold">[200]</span><span className="flex-1">{TARGET}{line.url}</span><span className="text-slate-500">({line.ms}ms)</span>{line.sensitive && <span className="font-bold">⚠ حساسة</span>}</div>
  if (line.type === 'scan-nf')    return <div className={`${base} text-slate-600 flex gap-2 pl-2`} dir="ltr"><span>[404]</span><span>{TARGET}{line.url}</span><span>({line.ms}ms)</span></div>
  if (line.type === 'scan-sum')   return <div className={`${base} text-yellow-400 font-bold mt-1 pl-2`} dir="ltr">{line.text}</div>
  if (line.type === 'scan-res')   return <div className={`${base} pl-4 ${line.sensitive ? 'text-red-300' : 'text-green-300'}`} dir="ltr">{'→ '}{line.url}{line.sensitive ? '  ⚠' : ''}</div>
  if (line.type === 'fw-rule')    return (
    <div className="text-xs flex gap-3 pl-2 font-mono" dir="ltr">
      <span className="text-slate-500 w-4">{line.id}.</span>
      <span className={`w-14 font-bold ${line.rtype === 'ALLOW' ? 'text-green-400' : 'text-red-400'}`}>{line.rtype}</span>
      <span className="text-blue-400 w-16">{line.match}</span>
      <span className="text-amber-300 flex-1">{line.value}</span>
      <span className="text-slate-500"># {line.desc}</span>
    </div>
  )
  if (line.type === 'help') return (
    <div className="pl-2 space-y-1" dir="ltr">
      <div className="text-blue-400 text-xs font-bold mb-2">═══ الأوامر المتاحة ═══</div>
      {[
        ['🗂  نظام الملفات:', ''],
        ['  display', 'عرض الملفات والمجلدات الموجودة في موقعك الحالي'],
        ['  enter <مجلد>', 'الانتقال إلى مجلد آخر — مثال: enter projects'],
        ['  enter parent', 'الرجوع للمجلد الأعلى'],
        ['  enter Desktop', 'الرجوع إلى Desktop (نقطة البداية)'],
        ['  tree', 'عرض هيكل الملفات والمجلدات شجرياً'],
        ['  cat <ملف>', 'اقرأ وعرض محتوى ملف نصي على الشاشة'],
        ['  show <ملف>', 'نفس cat — اسم بديل أسهل للقراءة'],
        ['  location', 'طباعة المسار الكامل للمجلد الذي أنت فيه الآن'],
        ['  create <اسم>', 'إنشاء — بدون امتداد: مجلد ، مع امتداد (.txt): ملف — مثال: create myfolder أو create notes.txt'],
        ['  rm <ملف>', 'حذف ملف نهائياً بدون سلة المحذوفات'],
        ['  delete <اسم>', 'حذف ملف أو مجلد'],
        ['  nano <ملف>', 'فتح محرر نصوص لتعديل ملف — Ctrl+S للحفظ، Ctrl+X للخروج'],
        ['  open <ملف>', 'نفس nano — فتح ملف في المحرر'],
        ['🔍  أدوات الأمن:', ''],
        ['  kashif رابط_الموقع اسم_الملف', 'اكتشاف صفحات مخفية داخل موقع باستخدام قائمة أسماء'],
        ['  barq اسم_المستخدم اسم_الملف المنصة', 'محاكاة هجوم قوة غاشمة لتجربة كلمات مرور من قائمة'],
        ['  nslookup <نطاق>', 'استعلام DNS لمعرفة عنوان IP المرتبط بنطاق'],
        ['  firewall rules', 'عرض قواعد الجدار الناري وما يسمح به أو يمنعه'],
        ['  whoami', 'عرض اسم المستخدم الحالي وصلاحياته في النظام'],
        ['💡  عام:', ''],
        ['  echo <نص>', 'طباعة نص على الشاشة — مثال: echo مرحبا'],
        ['  clear', 'مسح كل ما يظهر في الطرفية وتنظيف الشاشة'],
        ['  help', 'عرض قائمة الأوامر المتاحة هذه'],
      ].map(([cmd, desc]) => (
        <div key={cmd} className={`text-xs flex gap-3 ${cmd.includes(':') && !cmd.startsWith(' ') ? 'mt-2' : ''}`}>
          <span dir="ltr" className={`font-mono ${cmd.includes(':') && !cmd.startsWith(' ') ? 'text-yellow-400 font-bold' : 'text-green-400 whitespace-nowrap shrink-0'}`}>{cmd}</span>
          {desc && <span className="text-slate-400">{desc}</span>}
        </div>
      ))}
    </div>
  )
  return <div className={`${base} text-slate-300 pl-2`} dir="ltr">{line.text || ''}</div>
}

// ─── Module badges ────────────────────────────────────────────────────────────
const MODULES = [
  { icon: <Globe className="w-3.5 h-3.5" />, label: 'kashif', desc: 'اكتشاف المسارات', color: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40' },
  { icon: <Shield className="w-3.5 h-3.5" />, label: 'barq', desc: 'القوة الغاشمة', color: 'bg-red-900/40 text-red-400 border-red-700/40' },
  { icon: <Cpu className="w-3.5 h-3.5" />, label: 'nslookup', desc: 'استعلام DNS', color: 'bg-violet-900/40 text-violet-400 border-violet-700/40' },
  { icon: <Shield className="w-3.5 h-3.5" />, label: 'firewall', desc: 'الجدار الناري', color: 'bg-amber-900/40 text-amber-400 border-amber-700/40' },
]

// ─── Main component ───────────────────────────────────────────────────────────
export default function PageTerminalLab() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [lines, setLines] = useState([
    { type: 'output', text: 'اكتب help لعرض جميع الأوامر المتاحة.' },
    { type: 'sep' },
  ])
  const [input, setInput] = useState('')
  const [cwd, setCwd] = useState([])
  const [fs, setFs] = useState(INITIAL_FS)
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const [scanning, setScanning] = useState(false)
  const [cracking, setCracking] = useState(false)
  const [nanoOpen, setNanoOpen] = useState(false)
  const [nanoFile, setNanoFile] = useState(null)
  const [nanoContent, setNanoContent] = useState('')

  const termRef = useRef(null)
  const inputRef = useRef(null)
  const wasAtBottomRef = useRef(true)
  const currentPath = cwd.length === 0 ? 'Desktop' : 'Desktop/' + cwd.join('/')
  const prompt = `lab@terminal:${currentPath}$ `

  // Smart scroll — only auto-scroll if user was at bottom
  const checkBottom = useCallback(() => {
    const el = termRef.current
    if (!el) return
    wasAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 30
  }, [])

  useEffect(() => {
    if (wasAtBottomRef.current && termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight
    }
  }, [lines])

  function addLines(newLines) { setLines(prev => [...prev, ...newLines]) }

  function processCmd(raw) {
    const cmd = raw.trim()
    if (!cmd) return
    addLines([{ type: 'cmd', prompt, text: cmd }])
    setHistory(h => [cmd, ...h.slice(0, 49)])
    setHistIdx(-1)

    const parts = cmd.split(/\s+/)
    // Map real Linux command names to the lesson's pedagogical aliases
    const ALIAS = { ls: 'display', cd: 'enter', pwd: 'location' }
    let command = parts[0].toLowerCase()
    let args = parts.slice(1)
    // Normalize `cd` argument semantics to the `enter` case's expectations
    if (command === 'cd') {
      if (args[0] === '..') args = ['parent', ...args.slice(1)]
      else if (args[0] === '/' || args[0] === '~') args = ['Desktop', ...args.slice(1)]
    }
    command = ALIAS[command] || command

    switch (command) {
      case 'help':   addLines([{ type: 'help' }]); break
      case 'clear':  setLines([]); break
      case 'location': addLines([{ type: 'output', text: currentPath }]); break
      case 'whoami': addLines([{ type: 'output', text: 'lab-student' }, { type: 'info', text: 'مستخدم مختبر الطرفية التعليمي — صلاحيات قراءة فقط' }]); break
      case 'echo':   addLines([{ type: 'output', text: args.join(' ') }]); break

      case 'display': {
        const node = getNode(fs, cwd)
        if (!node || node.type !== 'dir') { addLines([{ type: 'error', text: 'خطأ: ليس مجلداً' }]); break }
        const items = Object.entries(node.children || {}).map(([name, n]) => ({ name, isDir: n.type === 'dir' }))
        if (!items.length) { addLines([{ type: 'output', text: '(المجلد فارغ)' }]); break }
        if (args[0] === '-l') items.forEach(item => addLines([{ type: 'output', text: `${item.isDir ? 'd' : '-'}rw-r--r--  ${item.name}${item.isDir ? '/' : ''}` }]))
        else addLines([{ type: 'ls', items }])
        break
      }

      case 'enter': {
        const target = args[0]
        if (!target || target === '~' || target === 'Desktop') { setCwd([]); break }
        if (target === 'parent') {
          if (cwd.length === 0) { addLines([{ type: 'error', text: 'enter: أنت بالفعل في Desktop' }]); break }
          setCwd(prev => prev.slice(0, -1)); break
        }
        const newPath = [...cwd, target]
        const node = getNode(fs, newPath)
        if (!node) { addLines([{ type: 'error', text: `enter: ${target}: لا يوجد مجلد بهذا الاسم` }]); break }
        if (node.type !== 'dir') { addLines([{ type: 'error', text: `enter: ${target}: ليس مجلداً` }]); break }
        setCwd(newPath)
        break
      }

      case 'show':
      case 'cat': {
        if (!args[0]) { addLines([{ type: 'error', text: `الاستخدام: ${command} <ملف>` }]); break }
        const node = getNode(fs, [...cwd, args[0]])
        if (!node) { addLines([{ type: 'error', text: `${command}: ${args[0]}: الملف غير موجود` }]); break }
        if (node.type === 'dir') { addLines([{ type: 'error', text: `${command}: ${args[0]}: هذا مجلد` }]); break }
        addLines([{ type: 'cat', text: node.content || '(ملف فارغ)' }])
        break
      }

      case 'create': {
        if (!args[0]) { addLines([{ type: 'error', text: 'الاستخدام: create <اسم> — بدون امتداد: مجلد، مع امتداد (.txt): ملف' }]); break }
        const name = args[0]
        if (getNode(fs, [...cwd, name])) { addLines([{ type: 'error', text: `create: ${name}: موجود بالفعل` }]); break }
        if (name.includes('.')) {
          setFs(prev => setNode(prev, cwd, name, { type: 'file', content: '' }))
          addLines([{ type: 'success', text: `تم إنشاء الملف: ${name}` }])
        } else {
          setFs(prev => setNode(prev, cwd, name, { type: 'dir', children: {} }))
          addLines([{ type: 'success', text: `تم إنشاء المجلد: ${name}/` }])
        }
        break
      }

      case 'mkdir': {
        if (!args[0]) { addLines([{ type: 'error', text: 'الاستخدام: mkdir <اسم>' }]); break }
        const name = args[0]
        if (getNode(fs, [...cwd, name])) { addLines([{ type: 'error', text: `mkdir: ${name}: موجود بالفعل` }]); break }
        setFs(prev => setNode(prev, cwd, name, { type: 'dir', children: {} }))
        addLines([{ type: 'success', text: `تم إنشاء المجلد: ${name}/` }])
        break
      }

      case 'touch': {
        if (!args[0]) { addLines([{ type: 'error', text: 'الاستخدام: touch <اسم>' }]); break }
        const name = args[0]
        if (getNode(fs, [...cwd, name])) { addLines([{ type: 'error', text: `touch: ${name}: موجود بالفعل` }]); break }
        setFs(prev => setNode(prev, cwd, name, { type: 'file', content: '' }))
        addLines([{ type: 'success', text: `تم إنشاء الملف: ${name}` }])
        break
      }

      case 'rm': {
        const recursive = args[0] === '-r' || args[0] === '-rf' || args[0] === '-fr'
        const targetName = recursive ? args[1] : args[0]
        if (!targetName) { addLines([{ type: 'error', text: 'الاستخدام: rm <ملف>  |  rm -r <مجلد>' }]); break }
        const node = getNode(fs, [...cwd, targetName])
        if (!node) { addLines([{ type: 'error', text: `rm: ${targetName}: غير موجود` }]); break }
        if (node.type === 'dir' && !recursive) { addLines([{ type: 'error', text: `rm: ${targetName}: هذا مجلد` }]); break }
        setFs(prev => removeNode(prev, cwd, targetName))
        addLines([{ type: 'success', text: `تم الحذف: ${targetName}` }])
        break
      }

      case 'delete': {
        if (!args[0]) { addLines([{ type: 'error', text: 'الاستخدام: delete <ملف أو مجلد>' }]); break }
        const delNode = getNode(fs, [...cwd, args[0]])
        if (!delNode) { addLines([{ type: 'error', text: `delete: ${args[0]}: غير موجود` }]); break }
        setFs(prev => removeNode(prev, cwd, args[0]))
        addLines([{ type: 'success', text: `🗑️ تم الحذف: ${args[0]}` }])
        break
      }

      case 'nslookup': {
        if (!args[0]) { addLines([{ type: 'error', text: 'الاستخدام: nslookup <نطاق>' }]); break }
        const domain = args[0].toLowerCase()
        const ip = DNS_RECORDS[domain]
        addLines([{ type: 'sep' }])
        addLines([{ type: 'info', text: `[DNS] استعلام عن: ${domain}` }])
        setTimeout(() => {
          if (ip) {
            addLines([
              { type: 'output', text: `Server:   8.8.8.8 (Google DNS)` },
              { type: 'output', text: `Address:  8.8.8.8#53` },
              { type: 'output', text: `` },
              { type: 'success', text: `Name:     ${domain}` },
              { type: 'success', text: `Address:  ${ip}` },
              { type: 'info',   text: `[*] DNS ترجم "${domain}" إلى "${ip}"` },
            ])
          } else {
            addLines([{ type: 'error', text: `NXDOMAIN: "${domain}" — النطاق غير موجود في السجلات` }])
          }
          addLines([{ type: 'sep' }])
        }, 400)
        break
      }

      case 'firewall': {
        if (args[0] === 'rules' || !args[0]) {
          addLines([
            { type: 'sep' },
            { type: 'info', text: '[*] قواعد الجدار الناري الحالية:' },
            { type: 'sep' },
            { type: 'output', text: '#    النوع    المطابقة  القيمة              الوصف' },
            ...FW_RULES.map(r => ({ type: 'fw-rule', id: r.id, rtype: r.type, match: r.match, value: r.value, desc: r.desc })),
            { type: 'sep' },
            { type: 'info', text: `[*] إجمالي القواعد: ${FW_RULES.length}` },
          ])
        } else {
          addLines([{ type: 'error', text: 'الاستخدام: firewall rules' }])
        }
        break
      }

      case 'kashif': {
        if (scanning) { addLines([{ type: 'error', text: '[!] يوجد فحص قيد التشغيل، انتظر...' }]); break }
        if (!args[0] || !args[1]) {
          addLines([{ type: 'error', text: 'الاستخدام: kashif <موقع> <ملف_كلمات>' }, { type: 'info', text: `مثال: kashif ${TARGET} pages_file.txt` }])
          break
        }
        runKashif(args[0], args[1])
        break
      }

      case 'barq': {
        if (cracking) { addLines([{ type: 'error', text: '[!] يوجد هجوم قيد التشغيل، انتظر...' }]); break }
        if (!args[0] || !args[1] || !args[2]) {
          addLines([
            { type: 'error', text: 'الاستخدام: barq <username> <passwordfile> <platform>' },
            { type: 'info',  text: 'المنصات: instagram | tiktok | snapchat | roblox | minecraft' },
            { type: 'info',  text: '         twitter | facebook | discord | youtube | gmail' },
          ])
          break
        }
        runBarq(args[0], args[1], args[2].toLowerCase())
        break
      }

      case 'open':
      case 'nano': {
        if (!args[0]) { addLines([{ type: 'error', text: `الاستخدام: ${command} <ملف>` }]); break }
        const node = getNode(fs, [...cwd, args[0]])
        if (node?.type === 'dir') { addLines([{ type: 'error', text: `${command}: ${args[0]}: هذا مجلد` }]); break }
        setNanoFile({ name: args[0], path: [...cwd, args[0]] })
        setNanoContent(node?.content ?? '')
        setNanoOpen(true)
        break
      }

      case 'tree': {
        const renderTree = (node, prefix = '') => {
          const entries = Object.entries(node.children || {})
          entries.forEach(([name, child], idx) => {
            const isLast = idx === entries.length - 1
            const label  = child.type === 'dir' ? name + '/' : name
            addLines([{ type: child.type === 'dir' ? 'info' : 'output', text: prefix + (isLast ? '└── ' : '├── ') + label }])
            if (child.type === 'dir') renderTree(child, prefix + (isLast ? '    ' : '│   '))
          })
        }
        const root = getNode(fs, cwd)
        addLines([{ type: 'success', text: currentPath }])
        if (root) renderTree(root)
        break
      }

      default:
        addLines([{ type: 'error', text: `'${command}': أمر غير معروف. اكتب help` }])
    }
  }

  function runKashif(url, wordlist) {
    setScanning(true)
    addLines([
      { type: 'sep' },
      { type: 'info', text: '[*] كاشف — اكتشاف الصفحات المخفية' },
      { type: 'info', text: `[*] الهدف: ${url}` },
      { type: 'info', text: `[*] الملف: ${wordlist} (${SCAN_LINES.length} مسار)` },
      { type: 'sep' },
    ])
    let i = 0
    const scanLines = SCAN_LINES.map(sl => sl.found
      ? { type: 'scan-found', url: sl.url, ms: sl.ms, sensitive: sl.sensitive }
      : { type: 'scan-nf', url: sl.url, ms: sl.ms })
    const addNext = () => {
      if (i >= scanLines.length) {
        const found = SCAN_LINES.filter(l => l.found)
        addLines([
          { type: 'sep' },
          { type: 'scan-sum', text: `[+] اكتمل! ${found.length} صفحة من أصل ${SCAN_LINES.length}` },
          { type: 'sep' },
          { type: 'scan-sum', text: 'الصفحات المكتشفة:' },
          ...found.map(f => ({ type: 'scan-res', url: f.url, sensitive: f.sensitive })),
          { type: 'sep' },
        ])
        setScanning(false)
        return
      }
      addLines([scanLines[i]])
      i++
      setTimeout(addNext, scanLines[i - 1].type === 'scan-found' ? 120 : 80)
    }
    setTimeout(addNext, 400)
  }

  function deriveBarqPassword(username, platform) {
    const base = (username || 'user').split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toLowerCase() || 'user'
    const cap = base.charAt(0).toUpperCase() + base.slice(1)
    const pools = {
      instagram: [base+'2024', cap+'123',    base+'_ig',   'ig_'+base,   base+'!'],
      tiktok:    [base+'_tok', 'tok'+base,   cap+'2024',   base+'321',   base+'@tok'],
      snapchat:  [base+'_snap','snap'+cap,   base+'2023',  's_'+base,    cap+'000'],
      roblox:    ['rblx_'+base,base+'_rblx', cap+'99',     base+'2024',  'r'+base+'1'],
      minecraft: [base+'_mc', 'mc'+cap,      base+'1234',  cap+'Mine',   'mine_'+base],
      twitter:   [base+'_tw', 'tw_'+base,    cap+'2024',   base+'@tw',   base+'123'],
      facebook:  ['fb_'+base, base+'_fb',    cap+'321',    'f'+base,     base+'2024'],
      discord:   [base+'_dc', 'dc'+cap,      base+'#001',  base+'2024',  'd_'+base],
      youtube:   [base+'_yt', 'yt_'+base,    cap+'tube',   base+'2024',  base+'_yt'],
      gmail:     [base+'@gml','g_'+base,     cap+'2024',   base+'!g',    base+'_gml'],
    }
    const list = pools[platform] || [base+'123', cap+'2024', base+'!']
    const hash = [...(username || 'user')].reduce((a, c) => a + c.charCodeAt(0), 0)
    return list[hash % list.length]
  }

  const BARQ_PLATFORMS = ['instagram','tiktok','snapchat','roblox','minecraft','twitter','facebook','discord','youtube','gmail']

  function runBarq(user, file, platform) {
    if (!BARQ_PLATFORMS.includes(platform)) {
      addLines([
        { type: 'error', text: `[!] منصة غير معروفة: ${platform}` },
        { type: 'info',  text: `[*] المنصات: ${BARQ_PLATFORMS.join(' | ')}` },
      ]); return
    }
    setCracking(true)
    const correct = deriveBarqPassword(user, platform)
    const pool = ['password','123456','admin','letmein','qwerty','admin123','111111','abc123','dragon','master',
      'monkey','test123','login','welcome','sunshine','superman','batman','football','iloveyou','princess',
      'starwars','12345678','pass1234','secure1','r3d@ct3d','xK9mP2qL','nT4sWv8z','Doha2024!','Qatar123','gulf@pass']
    const shuffled = pool.filter(p => p !== correct)
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    shuffled.splice(Math.floor(Math.random() * 15) + 8, 0, correct)
    const list = shuffled.slice(0, 30)

    addLines([
      { type: 'sep' },
      { type: 'warn',  text: `[*] برق — هجوم القوة الغاشمة (محاكاة)` },
      { type: 'info',  text: `[*] المنصة: ${platform}  |  المستخدم: ${user}` },
      { type: 'info',  text: `[*] كلمة المرور المستهدفة مشتقة من اسم المستخدم` },
      { type: 'info',  text: `[*] بدء التجربة...` },
      { type: 'sep' },
    ])

    let i = 0
    const tryNext = () => {
      if (i >= list.length) { addLines([{ type: 'error', text: '[!] استنفدت كل كلمات المرور.' }]); setCracking(false); return }
      const pw = list[i]; i++
      if (pw === correct) {
        addLines([
          { type: 'success', text: `[+] SUCCESS! ${user}:${pw}` },
          { type: 'sep' },
          { type: 'info', text: '[!] تعلّمنا: كلمات المرور المبنية على الاسم تُكسر بسرعة.' },
          { type: 'info', text: '[!] الحل: كلمة مرور عشوائية طويلة + مدير كلمات مرور.' },
        ])
        setCracking(false)
      } else {
        addLines([{ type: 'output', text: `[-] ${i.toString().padStart(3, ' ')}: ${pw.padEnd(22)} FAIL` }])
        setTimeout(tryNext, 100)
      }
    }
    setTimeout(tryNext, 300)
  }

  function handleNanoSave(text) {
    setFs(prev => setNode(prev, nanoFile.path.slice(0, -1), nanoFile.name, { type: 'file', content: text }))
    setNanoContent(text)
  }
  function handleNanoExit(text) {
    if (text !== nanoContent) {
      setFs(prev => setNode(prev, nanoFile.path.slice(0, -1), nanoFile.name, { type: 'file', content: text }))
    }
    setNanoOpen(false)
    addLines([{ type: 'info', text: `nano: تم إغلاق الملف: ${nanoFile.name}` }])
    inputRef.current?.focus({ preventScroll: true })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { const v = input; setInput(''); processCmd(v) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); const idx = Math.min(histIdx + 1, history.length - 1); setHistIdx(idx); setInput(history[idx] || '') }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (histIdx > 0) { const idx = histIdx - 1; setHistIdx(idx); setInput(history[idx] || '') } else { setHistIdx(-1); setInput('') } }
  }

  return (
    <div className="min-h-screen bg-slate-50" dir={isAr ? 'rtl' : 'ltr'}>
      {nanoOpen && (
        <NanoEditor filename={nanoFile.name} content={nanoContent} onSave={handleNanoSave} onExit={handleNanoExit} />
      )}
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-800">
              <ChevronLeft className="w-4 h-4" />
              {isAr ? 'الدروس' : 'Lessons'}
            </button>
            <div className="w-px h-6 bg-slate-700" />
            <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center">
              <Terminal className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg">{isAr ? 'مختبر الطرفية المركزي' : 'Central Terminal Lab'}</h1>
              <p className="text-slate-400 text-xs">{isAr ? 'جميع أدوات الدروس في مكان واحد' : 'All lesson tools in one place'}</p>
            </div>
          </div>
          {/* Module badges */}
          <div className="flex flex-wrap gap-2">
            {MODULES.map(m => (
              <div key={m.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${m.color}`}>
                {m.icon} <span className="font-mono">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Terminal */}
        <div
          className="rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
          style={{ height: 'calc(100vh - 180px)', minHeight: '500px', display: 'flex', flexDirection: 'column' }}
          onClick={() => { if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true }) }}
        >
          {/* Title bar */}
          <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-slate-400 text-xs font-mono ms-2">lab@terminal:{currentPath}$</span>
            </div>
            <div className="flex items-center gap-3">
              {scanning && <div className="flex items-center gap-1.5 text-xs text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{isAr ? 'فحص...' : 'scanning...'}</div>}
              {cracking && <div className="flex items-center gap-1.5 text-xs text-red-400"><div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />{isAr ? 'هجوم...' : 'cracking...'}</div>}
              <span className="text-slate-600 text-xs">{isAr ? 'انقر للكتابة' : 'click to type'}</span>
            </div>
          </div>

          {/* Output */}
          <div
            ref={termRef}
            onScroll={checkBottom}
            className="bg-slate-950 flex-1 overflow-y-auto p-4 space-y-0.5 cursor-text"
            dir="ltr"
          >
            {lines.map((line, i) => <TLine key={i} line={line} />)}
            <div className="flex items-center gap-1 mt-1">
              <span className="text-green-400 text-xs select-none">{prompt}</span>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={scanning || cracking}
                className="flex-1 bg-transparent text-white text-xs outline-none border-none font-mono caret-white"
                autoComplete="off" spellCheck={false} autoCapitalize="off"
              />
            </div>
          </div>
        </div>

        {/* Quick commands bar */}
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-slate-500 text-xs">{isAr ? 'جرب:' : 'Try:'}</span>
          {[
            `kashif ${TARGET} pages_file.txt`,
            'barq ahmed passwords.txt instagram',
            'barq sara passwords.txt tiktok',
            'barq ahmed passwords.txt roblox',
            `nslookup instagram.com`,
            'firewall rules',
            'ls',
            'help',
          ].map(cmd => (
            <button key={cmd} disabled={scanning || cracking} onClick={() => { setInput(cmd); inputRef.current?.focus({ preventScroll: true }) }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700 transition-colors disabled:opacity-40">
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
