import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { SCAN_LINES, PAGES_FILE_CONTENT } from '../data/terminalData'
import { useApp } from '../context/AppContext'

const TARGET = 'https://novacart.shop'

// --- Immutable file system helpers ---
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
  if (pathArr.length === 0) {
    const n = { ...fs }; delete n[name]; return n
  }
  const [h, ...rest] = pathArr
  if (!fs[h] || fs[h].type !== 'dir') return fs
  return { ...fs, [h]: { ...fs[h], children: removeNode(fs[h].children || {}, rest, name) } }
}

const INITIAL_FS = {
  'readme.txt': { type: 'file', content: `أكاديمية الويب — أداة كاشف التعليمية
=====================================
مرحباً بك في سطر الأوامر التفاعلي!

اكتب "help" لعرض الأوامر المتاحة.

للبدء بالفحص:
  kashif ${TARGET} pages_file.txt` },
  'pages_file.txt': { type: 'file', content: PAGES_FILE_CONTENT },
  'documents': {
    type: 'dir',
    children: {
      'notes.txt': { type: 'file', content: `ملاحظات درس كاشف
====================
• أداة كاشف تعليمية لاكتشاف الصفحات المخفية
• تجرب كل مسار في ملف الكلمات على الموقع
• كود 200 = الصفحة موجودة ✓
• كود 404 = الصفحة غير موجودة ✗
• الصفحات الحساسة مثل /admin يجب حمايتها!` },
      'kashif_guide.txt': { type: 'file', content: `دليل استخدام أداة كاشف
========================
الوصف: أداة تعليمية لاكتشاف الصفحات المخفية داخل المواقع

الأمر الأساسي:
  kashif <الموقع> <ملف_الكلمات>

مثال:
  kashif ${TARGET} pages_file.txt

الإخراج:
  [200] /home (145ms)        ← صفحة موجودة
  [404] /login (278ms)       ← صفحة غير موجودة
  [200] /admin (167ms) ⚠    ← صفحة حساسة!` },
    }
  },
  'targets': {
    type: 'dir',
    children: {
      'novacart.txt': { type: 'file', content: `الهدف: ${TARGET}
النوع: موقع تعليمي (محاكاة آمنة)
الحالة: مسموح بالفحص للأغراض التعليمية فقط

تحذير: لا تستخدم أدوات الفحص على مواقع حقيقية
بدون إذن صريح من أصحابها!` },
    }
  }
}

// --- Nano Editor Overlay ---
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

// --- Line renderer ---
function TerminalLine({ line }) {
  if (line.type === 'cmd') {
    return (
      <div dir="ltr" className="flex gap-1.5">
        <span className="text-green-400 text-xs select-none">{line.prompt}</span>
        <span className="text-white text-xs">{line.text}</span>
      </div>
    )
  }
  if (line.type === 'ls') {
    return (
      <div dir="ltr" className="flex flex-wrap gap-x-5 gap-y-0.5 pl-2">
        {line.items.map((item, i) => (
          <span key={i} className={`text-xs font-mono ${item.isDir ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>
            {item.name}{item.isDir ? '/' : ''}
          </span>
        ))}
      </div>
    )
  }
  if (line.type === 'cat') {
    return <pre dir="ltr" className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed pl-2">{line.text}</pre>
  }
  if (line.type === 'error') {
    return <div dir="ltr" className="text-xs text-red-400 pl-2">{line.text}</div>
  }
  if (line.type === 'success') {
    return <div dir="ltr" className="text-xs text-green-400 pl-2">{line.text}</div>
  }
  if (line.type === 'info') {
    return <div dir="ltr" className="text-xs text-blue-400 pl-2">{line.text}</div>
  }
  if (line.type === 'output') {
    return <div dir="ltr" className="text-xs text-slate-300 pl-2">{line.text}</div>
  }
  if (line.type === 'sep') {
    return <div dir="ltr" className="text-xs text-slate-600">{'─'.repeat(50)}</div>
  }
  if (line.type === 'scan-found') {
    return (
      <div dir="ltr" className={`text-xs flex gap-2 pl-2 ${line.sensitive ? 'text-red-400' : 'text-green-400'}`}>
        <span className="font-bold">[200]</span>
        <span className="font-mono flex-1">{TARGET}{line.url}</span>
        <span className="text-slate-500">({line.ms}ms)</span>
        {line.sensitive && <span className="font-bold text-red-400">⚠ حساسة</span>}
      </div>
    )
  }
  if (line.type === 'scan-nf') {
    return (
      <div dir="ltr" className="text-xs text-slate-600 flex gap-2 pl-2">
        <span>[404]</span>
        <span className="font-mono">{TARGET}{line.url}</span>
        <span>({line.ms}ms)</span>
      </div>
    )
  }
  if (line.type === 'scan-sum') {
    return <div dir="ltr" className="text-xs text-yellow-400 font-bold mt-1 pl-2">{line.text}</div>
  }
  if (line.type === 'scan-res') {
    return (
      <div dir="ltr" className={`text-xs font-mono pl-4 ${line.sensitive ? 'text-red-300' : 'text-green-300'}`}>
        {'→ '}{line.url}{line.sensitive ? '  ⚠' : ''}
      </div>
    )
  }
  if (line.type === 'welcome') {
    return <div dir="rtl" className="text-xs text-slate-400 italic">{line.text}</div>
  }
  if (line.type === 'help') {
    return (
      <div dir="ltr" className="pl-2 space-y-0.5">
        <div className="text-blue-400 text-xs font-bold mb-1">الأوامر المتاحة:</div>
        {[
          ['display', 'عرض الملفات والمجلدات الموجودة في موقعك الحالي'],
          ['enter <dir>', 'الانتقال إلى مجلد آخر — مثال: enter documents'],
          ['enter parent', 'الرجوع للمجلد الأعلى'],
          ['enter Desktop', 'الرجوع إلى Desktop (نقطة البداية)'],
          ['tree', 'عرض هيكل الملفات والمجلدات شجرياً'],
          ['create <name>', 'إنشاء — بدون امتداد: مجلد، مع امتداد (.txt): ملف'],
          ['cat <file>', 'اقرأ وعرض محتوى ملف نصي على الشاشة'],
          ['show <file>', 'نفس cat — اسم بديل أسهل للقراءة'],
          ['rm <file>', 'حذف ملف نهائياً بدون سلة المحذوفات'],
          ['delete <name>', 'حذف ملف أو مجلد'],
          ['nano <file>', 'فتح محرر نصوص لتعديل ملف — Ctrl+S للحفظ، Ctrl+X للخروج'],
          ['open <file>', 'نفس nano — فتح ملف في المحرر'],
          ['location', 'طباعة المسار الكامل للمجلد الذي أنت فيه الآن'],
          ['echo <text>', 'طباعة نص على الشاشة — مثال: echo مرحبا'],
          ['clear', 'مسح كل ما يظهر في الطرفية وتنظيف الشاشة'],
          ['kashif <url> <file>', 'اكتشاف صفحات مخفية داخل موقع باستخدام قائمة أسماء'],
        ].map(([cmd, desc]) => (
          <div key={cmd} className="text-xs flex gap-3">
            <span className="text-green-400 font-mono w-32 flex-shrink-0">{cmd}</span>
            <span className="text-slate-400">{desc}</span>
          </div>
        ))}
      </div>
    )
  }
  return <div dir="ltr" className="text-xs text-slate-300 pl-2">{line.text || ''}</div>
}

const INIT_LINES = [
  { type: 'welcome', text: 'اكتب help لعرض الأوامر، أو جرب: kashif pages_file.txt novacart.shop' },
]

export default function Page3Terminal() {
  const [lines, setLines] = useState(INIT_LINES)
  const [inputVal, setInputVal] = useState('')
  const [cwd, setCwd] = useState([])
  const [fs, setFs] = useState(INITIAL_FS)
  const [cmdHistory, setCmdHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const [scanning, setScanning] = useState(false)
  const [browserPath, setBrowserPath] = useState('/home')
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState(false)
  const [browserInput, setBrowserInput] = useState('novacart.shop/home')
  const [nanoOpen, setNanoOpen] = useState(false)
  const [nanoFile, setNanoFile] = useState(null)
  const [nanoContent, setNanoContent] = useState('')
  const inputRef = useRef(null)
  const termScrollRef = useRef(null)
  const wasAtBottomRef = useRef(true)
  const navigate = useNavigate()
  const { lang } = useApp()

  const checkBottom = () => {
    const el = termScrollRef.current
    if (!el) return
    wasAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 30
  }

  useEffect(() => {
    if (wasAtBottomRef.current && termScrollRef.current) {
      termScrollRef.current.scrollTop = termScrollRef.current.scrollHeight
    }
  }, [lines])

  const currentPath = cwd.length === 0 ? 'Desktop' : 'Desktop/' + cwd.join('/')
  const prompt = `student@kashif:${currentPath}$ `

  const addLines = (newLines) => setLines(prev => [...prev, ...newLines])

  const processCmd = (raw) => {
    const cmd = raw.trim()
    if (!cmd) return
    addLines([{ type: 'cmd', prompt, text: cmd }])
    setCmdHistory(h => [cmd, ...h.slice(0, 49)])
    setHistIdx(-1)

    const parts = cmd.split(/\s+/)
    // Real Linux command aliases → the lesson's pedagogical command names
    const ALIAS = { ls: 'display', cd: 'enter', pwd: 'location' }
    const rawCommand = parts[0].toLowerCase()
    let command = ALIAS[rawCommand] || rawCommand
    let args = parts.slice(1)

    // Map real `cd` argument conventions onto `enter`'s vocabulary
    if (rawCommand === 'cd') {
      if (args[0] === '..') args = ['parent', ...args.slice(1)]
      else if (args[0] === '/' || args[0] === '~') args = ['~', ...args.slice(1)]
    }

    switch (command) {
      case 'help':
        addLines([{ type: 'help' }])
        break

      case 'location':
        addLines([{ type: 'output', text: currentPath }])
        break

      case 'clear':
        setLines([])
        break

      case 'echo':
        addLines([{ type: 'output', text: args.join(' ') }])
        break

      case 'display': {
        const node = getNode(fs, cwd)
        if (!node || node.type !== 'dir') { addLines([{ type: 'error', text: 'خطأ: ليس مجلداً' }]); break }
        const children = node.children || {}
        const items = Object.entries(children).map(([name, n]) => ({ name, isDir: n.type === 'dir' }))
        if (items.length === 0) { addLines([{ type: 'output', text: '(المجلد فارغ)' }]); break }
        if (args[0] === '-l' || args[0] === '-la') {
          items.forEach(item => addLines([{ type: 'output', text: `${item.isDir ? 'd' : '-'}rw-r--r--  ${item.name}${item.isDir ? '/' : ''}` }]))
        } else {
          addLines([{ type: 'ls', items }])
        }
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
        if (!args[0]) { addLines([{ type: 'error', text: `الاستخدام: ${command} <اسم الملف>` }]); break }
        const node = getNode(fs, [...cwd, args[0]])
        if (!node) { addLines([{ type: 'error', text: `${command}: ${args[0]}: الملف غير موجود` }]); break }
        if (node.type === 'dir') { addLines([{ type: 'error', text: `${command}: ${args[0]}: هذا مجلد وليس ملفاً` }]); break }
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
        if (!args[0]) { addLines([{ type: 'error', text: 'الاستخدام: mkdir <اسم المجلد>' }]); break }
        const name = args[0]
        if (getNode(fs, [...cwd, name])) { addLines([{ type: 'error', text: `mkdir: ${name}: موجود بالفعل` }]); break }
        setFs(prev => setNode(prev, cwd, name, { type: 'dir', children: {} }))
        addLines([{ type: 'success', text: `تم إنشاء المجلد: ${name}/` }])
        break
      }

      case 'touch': {
        if (!args[0]) { addLines([{ type: 'error', text: 'الاستخدام: touch <اسم الملف>' }]); break }
        const name = args[0]
        if (getNode(fs, [...cwd, name])) { addLines([{ type: 'error', text: `touch: ${name}: موجود بالفعل` }]); break }
        setFs(prev => setNode(prev, cwd, name, { type: 'file', content: '' }))
        addLines([{ type: 'success', text: `تم إنشاء الملف: ${name}` }])
        break
      }

      case 'rm': {
        // rm -r / rm -rf <dir> removes a directory (like delete); plain rm removes files only
        const recursive = args.some(a => a === '-r' || a === '-rf' || a === '-fr' || a === '-R')
        const targetArg = args.find(a => !a.startsWith('-'))
        if (!targetArg) { addLines([{ type: 'error', text: 'الاستخدام: rm <اسم الملف>' }]); break }
        const name = targetArg
        const node = getNode(fs, [...cwd, name])
        if (!node) { addLines([{ type: 'error', text: `rm: ${name}: الملف غير موجود` }]); break }
        if (node.type === 'dir' && !recursive) { addLines([{ type: 'error', text: `rm: ${name}: هذا مجلد. استخدم rmdir` }]); break }
        setFs(prev => removeNode(prev, cwd, name))
        addLines([{ type: 'success', text: `تم حذف: ${name}` }])
        break
      }

      case 'delete': {
        if (!args[0]) { addLines([{ type: 'error', text: 'الاستخدام: delete <اسم الملف أو المجلد>' }]); break }
        const delName = args[0]
        const delNode = getNode(fs, [...cwd, delName])
        if (!delNode) { addLines([{ type: 'error', text: `delete: ${delName}: غير موجود` }]); break }
        setFs(prev => removeNode(prev, cwd, delName))
        addLines([{ type: 'success', text: `🗑️ تم حذف: ${delName}` }])
        break
      }

      case 'kashif': {
        if (scanning) { addLines([{ type: 'error', text: 'جاري فحص آخر، انتظر...' }]); break }
        const url = args[0]; const wordlist = args[1]
        if (!url || !wordlist) {
          addLines([{ type: 'error', text: 'الاستخدام: kashif <موقع> <ملف_كلمات>' }])
          addLines([{ type: 'info', text: `مثال: kashif ${TARGET} pages_file.txt` }])
          break
        }
        const wlNode = getNode(fs, [...cwd, wordlist])
        if (!wlNode) { addLines([{ type: 'error', text: `kashif: الملف "${wordlist}" غير موجود في المجلد الحالي` }]); break }
        if (wlNode.type === 'dir') { addLines([{ type: 'error', text: `kashif: "${wordlist}" هو مجلد وليس ملفاً` }]); break }
        const pathsFromFile = (wlNode.content || '').split('\n').map(l => l.trim()).filter(Boolean)
        runKashif(url, wordlist, pathsFromFile)
        break
      }

      case 'open':
      case 'nano': {
        if (!args[0]) { addLines([{ type: 'error', text: `الاستخدام: ${command} <اسم الملف>` }]); break }
        const node = getNode(fs, [...cwd, args[0]])
        if (node?.type === 'dir') { addLines([{ type: 'error', text: `${command}: ${args[0]}: هذا مجلد وليس ملفاً` }]); break }
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
        addLines([{ type: 'error', text: `'${command}': أمر غير معروف. اكتب help.` }])
    }
  }

  const runKashif = (url, wordlist, pathsFromFile) => {
    setScanning(true)

    // Build scan entries from the file paths
    const scanEntries = pathsFromFile.map(raw => {
      const p = raw.startsWith('/') ? raw : '/' + raw
      const known = SCAN_LINES.find(sl => sl.url === p)
      return known ? { ...known, fromFile: true } : { url: p, unknown: true }
    })

    const validEntries = scanEntries.filter(e => !e.unknown)
    const foundEntries = validEntries.filter(e => e.found)

    const headerLines = [
      { type: 'sep' },
      { type: 'info', text: '[*] كاشف — أداة اكتشاف الصفحات المخفية (تعليمية)' },
      { type: 'info', text: `[*] الهدف   : ${url}` },
      { type: 'info', text: `[*] الملف   : ${wordlist}` },
      { type: 'info', text: `[*] الكلمات : ${pathsFromFile.length}` },
      { type: 'sep' },
      { type: 'info', text: '[*] بدء الفحص...' },
      { type: 'sep' },
    ]

    const scanLines = scanEntries.map(e =>
      e.unknown
        ? { type: 'output', text: `[?] ${url}${e.url}` }
        : e.found
          ? { type: 'scan-found', url: e.url, ms: e.ms, sensitive: e.sensitive }
          : { type: 'scan-nf',   url: e.url, ms: e.ms }
    )

    const summaryLines = [
      { type: 'sep' },
      { type: 'scan-sum', text: `[+] اكتمل الفحص! تم اكتشاف ${foundEntries.length} صفحات من أصل ${pathsFromFile.length}` },
      { type: 'sep' },
      { type: 'scan-sum', text: 'الصفحات المكتشفة:' },
      ...foundEntries.map(f => ({ type: 'scan-res', url: f.url, sensitive: f.sensitive })),
      { type: 'sep' },
    ]

    addLines(headerLines)

    let i = 0
    const addNext = () => {
      if (i >= scanLines.length) {
        addLines(summaryLines)
        setScanning(false)
        return
      }
      addLines([scanLines[i]])
      i++
      const delay = scanLines[i - 1].type === 'scan-found' ? 130 : 90
      setTimeout(addNext, delay)
    }
    setTimeout(addNext, 400)
  }

  const handleNanoSave = (text) => {
    setFs(prev => setNode(prev, nanoFile.path.slice(0, -1), nanoFile.name, { type: 'file', content: text }))
    setNanoContent(text)
  }
  const handleNanoExit = (text) => {
    if (text !== nanoContent) {
      setFs(prev => setNode(prev, nanoFile.path.slice(0, -1), nanoFile.name, { type: 'file', content: text }))
    }
    setNanoOpen(false)
    addLines([{ type: 'info', text: `nano: تم إغلاق الملف: ${nanoFile.name}` }])
    inputRef.current?.focus({ preventScroll: true })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const val = inputVal
      setInputVal('')
      processCmd(val)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (cmdHistory.length > 0) {
        const idx = Math.min(histIdx + 1, cmdHistory.length - 1)
        setHistIdx(idx)
        setInputVal(cmdHistory[idx] || '')
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histIdx > 0) {
        const idx = histIdx - 1
        setHistIdx(idx)
        setInputVal(cmdHistory[idx] || '')
      } else {
        setHistIdx(-1)
        setInputVal('')
      }
    }
  }

  const SITE_DOMAIN = 'novacart.shop'

  const SITE_PAGES = {
    '/home': {
      title: 'الصفحة الرئيسية — NovaCart',
      content: (
        <div className="space-y-3">
          <div className="text-4xl">🐪</div>
          <h1 className="text-xl font-black text-[#0E1F39]">مرحباً بك في NovaCart</h1>
          <p className="text-slate-500 text-sm">حلول تقنية رائدة في قطر منذ 2015.</p>
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[['150+','موظف','👥'],['80+','عميل','🤝'],['320+','مشروع','📁']].map(([v,l,ic])=>(
              <div key={l} className="bg-slate-50 rounded-xl p-2 text-center border border-slate-200">
                <div className="text-xl">{ic}</div>
                <div className="font-bold text-[#0E1F39] text-sm">{v}</div>
                <div className="text-xs text-slate-400">{l}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    '/about': {
      title: 'من نحن — NovaCart',
      content: (
        <div className="space-y-3">
          <h1 className="text-xl font-black text-[#0E1F39]">من نحن</h1>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
            <span className="font-bold text-amber-700">المؤسس والمدير التنفيذي: </span>
            <span className="font-bold text-[#0E1F39]">خالد العلي</span>
          </div>
          <p className="text-slate-600 text-sm">تأسست شركة NovaCart عام 2015 في الدوحة، قطر. تخصصنا في تطوير البرمجيات والأمن السيبراني.</p>
        </div>
      ),
    },
    '/contact': {
      title: 'تواصل معنا — NovaCart',
      content: (
        <div className="space-y-3">
          <h1 className="text-xl font-black text-[#0E1F39]">تواصل معنا</h1>
          {[['📧','البريد','khalid@novacart.shop'],['📞','الهاتف','66730918'],['📍','العنوان','البحر الغربي، الدوحة']].map(([ic,l,v])=>(
            <div key={l} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-lg">{ic}</span>
              <div><p className="text-xs text-slate-400">{l}</p><p className="text-sm font-medium text-slate-700">{v}</p></div>
            </div>
          ))}
        </div>
      ),
    },
    '/login': {
      title: 'تسجيل الدخول — NovaCart',
      content: (
        <div className="space-y-4 max-w-xs mx-auto py-2">
          <div className="text-center">
            <div className="text-4xl mb-1">🔐</div>
            <h1 className="text-lg font-black text-[#0E1F39]">تسجيل الدخول</h1>
            <p className="text-xs text-slate-400">NovaCart Admin Portal</p>
          </div>
          {loggedIn ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
              <div className="text-2xl">✅</div>
              <p className="text-emerald-700 font-bold text-sm">تم تسجيل الدخول بنجاح!</p>
              <button onClick={() => navigateBrowser('/admin')} className="w-full bg-emerald-500 text-white rounded-lg py-1.5 text-xs font-bold hover:bg-emerald-600 transition-colors">
                الذهاب إلى لوحة التحكم ←
              </button>
            </div>
          ) : (
            <form onSubmit={e => {
              e.preventDefault()
              if (loginEmail.trim().toLowerCase() === 'khalid@novacart.shop' && loginPass === 'novacart2024') {
                setLoggedIn(true)
                setLoginError(false)
              } else {
                setLoginError(true)
              }
            }} className="space-y-3">
              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-600 text-center">بيانات الدخول غير صحيحة</div>
              )}
              <div>
                <label className="text-xs text-slate-500 block mb-1">البريد الإلكتروني</label>
                <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  dir="ltr" placeholder="user@novacart.shop" onClick={e => e.stopPropagation()} />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">كلمة المرور</label>
                <input value={loginPass} onChange={e => setLoginPass(e.target.value)}
                  type="password"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  dir="ltr" placeholder="••••••••" onClick={e => e.stopPropagation()} />
              </div>
              <button type="submit" className="w-full bg-[#0E1F39] text-white rounded-lg py-2 text-sm font-bold hover:bg-[#1a3055] transition-colors">
                دخول
              </button>
            </form>
          )}
        </div>
      ),
    },
    '/admin': {
      title: loggedIn ? 'لوحة التحكم — NovaCart' : '401 Unauthorized — NovaCart',
      content: loggedIn ? (
        <div className="space-y-3">
          <h1 className="text-xl font-black text-[#0E1F39]">👑 لوحة تحكم المسؤول</h1>
          <div className="grid grid-cols-2 gap-2">
            {[['👥','الموظفون','6'],['📁','المشاريع','320'],['🤝','العملاء','80'],['💰','الإيرادات','12M QAR']].map(([ic,l,v])=>(
              <div key={l} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-xl">{ic}</div>
                <div className="font-bold text-[#0E1F39] text-sm">{v}</div>
                <div className="text-xs text-slate-400">{l}</div>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            مرحباً، <span className="font-bold">خالد العلي</span> — أنت مسجّل الدخول كمسؤول.
          </div>
        </div>
      ) : (
        <div className="text-center space-y-3 py-4">
          <div className="text-5xl">🔒</div>
          <h1 className="text-xl font-black text-red-600">401 — غير مصرح</h1>
          <p className="text-slate-500 text-sm">هذه منطقة محمية. يجب تسجيل الدخول للوصول.</p>
          <button onClick={() => navigateBrowser('/login')} className="bg-slate-100 border border-slate-300 text-slate-600 rounded-lg px-4 py-1.5 text-xs hover:bg-slate-200 transition-colors">
            الذهاب إلى صفحة الدخول
          </button>
        </div>
      ),
    },
    '/employees': {
      title: 'بيانات الموظفين — NovaCart',
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-red-600">⚠️ بيانات حساسة مكشوفة!</h1>
          </div>
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl p-2">هذه الصفحة يجب أن تكون محمية — لكنها مكشوفة بدون حماية!</p>
          <div className="space-y-1">
            {['خالد العلي — CEO','نورة المنصوري — CFO','أحمد الكواري — Lead Developer'].map(e=>(
              <div key={e} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">{e}</div>
            ))}
          </div>
        </div>
      ),
    },
    '/customers': {
      title: 'بيانات العملاء — NovaCart',
      content: (
        <div className="space-y-3">
          <h1 className="text-xl font-black text-red-600">⚠️ بيانات العملاء مكشوفة!</h1>
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl p-2">هذه الصفحة تحتوي معلومات سرية للعملاء!</p>
          <div className="space-y-1">
            {['شركة بيانات قطر','مجموعة الخليج التقنية','وزارة المواصلات'].map(c=>(
              <div key={c} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">{c}</div>
            ))}
          </div>
        </div>
      ),
    },
    '/challenge': {
      title: 'التحدي — NovaCart',
      content: (
        <div className="text-center space-y-3 py-4">
          <div className="text-5xl">🏴</div>
          <h1 className="text-xl font-black text-[#0E1F39]">صفحة التحدي</h1>
          <p className="text-slate-500 text-sm">وجدت هذه الصفحة المخفية! أحسنت.</p>
        </div>
      ),
    },
    '/final': {
      title: 'النهاية — NovaCart',
      content: (
        <div className="text-center space-y-3 py-4">
          <div className="text-5xl">🎯</div>
          <h1 className="text-xl font-black text-[#0E1F39]">صفحة النهاية</h1>
          <p className="text-slate-500 text-sm">اكتشفت صفحة مخفية أخرى!</p>
        </div>
      ),
    },
  }

  const navigateBrowser = (path) => {
    const p = path.startsWith('/') ? path : '/' + path
    setBrowserPath(p)
    setBrowserInput(`${SITE_DOMAIN}${p}`)
  }

  const handleBrowserSubmit = (e) => {
    e.preventDefault()
    let raw = browserInput.trim().replace(/^https?:\/\//, '').replace(SITE_DOMAIN, '')
    const p = raw.startsWith('/') ? raw : raw ? '/' + raw : '/home'
    setBrowserPath(p)
    setBrowserInput(`${SITE_DOMAIN}${p}`)
  }

  const currentSitePage = SITE_PAGES[browserPath]

  const T = {
    ar: {
      lesson: 'درس ٤', title: 'أداة كاشف',
      concept: 'ما هي أداة كاشف؟',
      conceptText: 'كاشف هي أداة تعليمية تُستخدم لاكتشاف الصفحات المخفية داخل المواقع. تعمل عن طريق تجربة قائمة من أسماء الصفحات المحتملة، وتسجيل أي صفحة تستجيب بنجاح. هذا يساعد متخصصي الأمن في العثور على صفحات لم تُحذف أو لم تُحمَ بشكل صحيح.',
      hints: ['اكتب الأوامر', 'جرّب: display', 'ثم: kashif pages_file.txt novacart.shop'],
      clickHint: '(انقر على الطرفية للكتابة)',
      learnTitle: '📚 ماذا تعلمنا؟',
      learns: ['أداة كاشف تستخدم قائمة كلمات لاكتشاف الصفحات المخفية', 'وجود الصفحة لا يعني حمايتها — يجب تأمين الصفحات الحساسة', 'متخصصو الأمن يستخدمون هذه الأدوات لاكتشاف الثغرات قبل المهاجمين'],
      browserTitle: 'متصفح الموقع — novacart.shop',
      prev: '← الدرس السابق', next: 'الدرس التالي: ثغرة IDOR',
    },
    en: {
      lesson: 'Lesson 4', title: 'Kashif Tool',
      concept: 'What is Kashif?',
      conceptText: 'Kashif is an educational tool used to discover hidden pages within websites. It works by trying a list of possible page names and recording any page that responds successfully. This helps security professionals find pages that were not deleted or protected properly.',
      hints: ['Type commands', 'Try: display', 'Then: kashif pages_file.txt novacart.shop'],
      clickHint: '(Click terminal to type)',
      learnTitle: '📚 What we learned:',
      learns: ['Kashif uses a wordlist to discover hidden pages', 'A page existing does not mean it is protected — sensitive pages must be secured', 'Security professionals use these tools to find vulnerabilities before attackers do'],
      browserTitle: 'Site Browser — novacart.shop',
      prev: '← Previous Lesson', next: 'Next Lesson: IDOR Vulnerability',
    }
  }
  const t = T[lang]

  return (
    <div className="page-transition max-w-5xl mx-auto px-4 py-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {nanoOpen && (
        <NanoEditor filename={nanoFile.name} content={nanoContent} onSave={handleNanoSave} onExit={handleNanoExit} />
      )}
      <div className="mb-6">
        <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{t.lesson}</span>
        <h1 className="text-3xl font-black text-slate-800 mt-2 mb-2">{t.title}</h1>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-5">
        <h2 className="font-bold text-emerald-800 mb-2">{t.concept}</h2>
        <p className="text-emerald-700 text-sm leading-relaxed">{t.conceptText}</p>
      </div>

      <div className="bg-slate-700 text-slate-200 rounded-xl px-4 py-3 mb-3 text-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-emerald-400">💡</span>
          <span className="text-emerald-300 font-semibold">{lang === 'ar' ? 'كيف تبدأ:' : 'How to start:'}</span>
        </div>
        <ul className="space-y-1 pr-4">
          {t.hints.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-slate-300">
              <span className="text-emerald-400 mt-0.5">•</span>
              <span dir="ltr" className="font-mono">{h}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Terminal + Browser side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        {/* Interactive Terminal */}
        <div
          className="rounded-2xl overflow-hidden border border-slate-700 shadow-xl cursor-text flex flex-col"
          onClick={() => inputRef.current?.focus({ preventScroll: true })}
        >
          <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-slate-400 text-xs font-mono mr-2">كاشف — terminal</span>
            </div>
            <div className="flex items-center gap-3">
              {scanning && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 warning-pulse"></div>
                  {lang === 'ar' ? 'جاري الفحص...' : 'Scanning...'}
                </div>
              )}
              <span className="text-slate-500 text-xs">{t.clickHint}</span>
            </div>
          </div>

          <div ref={termScrollRef} onScroll={checkBottom} className="terminal-screen p-4 h-[480px] overflow-y-auto space-y-0.5 flex-1" dir="ltr">
            {lines.map((line, i) => (
              <TerminalLine key={i} line={line} />
            ))}
            <div className="flex items-center gap-1 mt-1" dir="ltr">
              <span className="text-green-400 text-xs select-none">{prompt}</span>
              <input
                ref={inputRef}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={scanning}
                className="flex-1 bg-transparent text-white text-xs outline-none border-none font-mono caret-white"
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="off"
              />
            </div>
          </div>
        </div>

        {/* Simulated Browser */}
        <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-lg flex flex-col">
          {/* Browser chrome */}
          <div className="bg-slate-100 border-b border-slate-300 px-3 py-2 flex items-center gap-2 flex-shrink-0">
            <div className="flex gap-1.5 flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <form onSubmit={handleBrowserSubmit} className="flex-1 flex">
              <input
                value={browserInput}
                onChange={e => setBrowserInput(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                dir="ltr"
              />
            </form>
          </div>
          {/* Page content */}
          <div className="bg-white p-5 flex-1 overflow-y-auto" dir="rtl">
            {currentSitePage ? (
              currentSitePage.content
            ) : (
              <div className="text-center space-y-3 py-4">
                <div className="text-5xl">🔍</div>
                <h1 className="text-xl font-black text-slate-500">404 — الصفحة غير موجودة</h1>
                <p className="text-slate-400 text-sm font-mono">{SITE_DOMAIN}{browserPath}</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
        <h3 className="font-bold text-slate-800 mb-3">{t.learnTitle}</h3>
        <ul className="space-y-2">
          {t.learns.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
              <span className={`mt-0.5 flex-shrink-0 ${i === 3 ? 'text-orange-500' : 'text-emerald-500'}`}>{i === 3 ? '⚠' : '✓'}</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center pt-6 border-t border-slate-100">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">
          ← {lang === 'ar' ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
