import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Explanation from '../components/Explanation'

// ── File system helpers (immutable) ──────────────────────────────────────────
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
  const [head, ...rest] = pathArr
  if (!fs[head] || fs[head].type !== 'dir') return fs
  return { ...fs, [head]: { ...fs[head], children: setNode(fs[head].children, rest, name, node) } }
}

function removeNode(fs, pathArr, name) {
  if (pathArr.length === 0) {
    const copy = { ...fs }
    delete copy[name]
    return copy
  }
  const [head, ...rest] = pathArr
  if (!fs[head] || fs[head].type !== 'dir') return fs
  return { ...fs, [head]: { ...fs[head], children: removeNode(fs[head].children, rest, name) } }
}

const INITIAL_FS = {
  'welcome.txt': { type: 'file', content: 'مرحباً بك في بيئة الطرفية التعليمية!\nيمكنك تصفح الملفات وإنشاءها وتعديلها.\nاكتب "help" لعرض قائمة الأوامر.' },
  documents: {
    type: 'dir', children: {
      'notes.txt': { type: 'file', content: 'ملاحظاتي:\n- تعلم أوامر الطرفية\n- ممارسة display وenter وcreate\n- إنشاء ملفات ومجلدات بـ create' },
      'hello.txt': { type: 'file', content: 'مرحباً بك في الطرفية!\nهذا ملف نصي تجريبي.' },
    }
  },
  projects: {
    type: 'dir', children: {
      'readme.txt': { type: 'file', content: 'مجلد المشاريع\nأنشئ مشاريعك هنا باستخدام mkdir' },
    }
  },
}

// ── Kashif / Barq demo data ───────────────────────────────────────────────────
const DEMO_KASHIF_PATHS = [
  { path: '/',           kind: 'found', statusEn: '200 OK',           statusAr: '200 موجودة'      },
  { path: '/about',      kind: 'found', statusEn: '200 OK',           statusAr: '200 موجودة'      },
  { path: '/contact',    kind: 'found', statusEn: '200 OK',           statusAr: '200 موجودة'      },
  { path: '/login',      kind: 'found', statusEn: '200 OK',           statusAr: '200 موجودة'      },
  { path: '/admin',      kind: 'warn',  statusEn: '401 Unauthorized', statusAr: '401 محمية!'      },
  { path: '/wp-admin',   kind: 'miss',  statusEn: '404 Not Found',    statusAr: '404 غير موجودة' },
  { path: '/robots.txt', kind: 'found', statusEn: '200 OK',           statusAr: '200 موجودة'      },
  { path: '/api',        kind: 'warn',  statusEn: '401 Unauthorized', statusAr: '401 محمية!'      },
  { path: '/phpmyadmin', kind: 'miss',  statusEn: '404 Not Found',    statusAr: '404 غير موجودة' },
]

const DEMO_BARQ_TRIES = ['password123','admin123','12345678','letmein','qwerty123','demo2024']

// ── Mini Tasks ────────────────────────────────────────────────────────────────
const TASKS_AR = [
  { id: 1, desc: 'اعرض محتويات المجلد الحالي', hint: 'display', check: (cmd) => cmd.trim() === 'display' || cmd.startsWith('display ') },
  { id: 2, desc: 'اعرض المجلد الحالي كاملاً', hint: 'location', check: (cmd) => cmd.trim() === 'location' },
  { id: 3, desc: 'انتقل إلى مجلد documents', hint: 'enter documents', check: (cmd) => cmd.startsWith('enter') && cmd.includes('document') },
  { id: 4, desc: 'أنشئ ملفاً اسمه myfile.txt', hint: 'create myfile.txt', check: (cmd) => cmd.startsWith('create') && cmd.includes('.txt') },
  { id: 5, desc: 'اعرض محتوى ملف hello.txt', hint: 'cat hello.txt  أو  show hello.txt', check: (cmd) => (cmd.startsWith('cat') || cmd.startsWith('show')) && cmd.includes('.txt') },
  { id: 6, desc: 'أنشئ مجلداً جديداً باسم myfolder', hint: 'create myfolder', check: (cmd) => cmd.startsWith('create') && !cmd.includes('.') },
  { id: 7, desc: 'افتح ملفاً في المحرر', hint: 'nano myfile.txt  أو  open myfile.txt', check: (cmd) => cmd.startsWith('nano') || cmd.startsWith('open') },
  { id: 8, desc: 'امسح موقعاً للبحث عن صفحاته المخفية', hint: 'kashif pages.txt example.com', check: (cmd) => cmd.startsWith('kashif') },
  { id: 9, desc: 'جرّب كسر كلمة مرور بأداة barq', hint: 'barq user wordlist.txt http://example.com', check: (cmd) => cmd.startsWith('barq') },
]

const TASKS_EN = [
  { id: 1, desc: 'List the contents of the current directory', hint: 'display', check: (cmd) => cmd.trim() === 'display' || cmd.startsWith('display ') },
  { id: 2, desc: 'Show the current full directory path', hint: 'location', check: (cmd) => cmd.trim() === 'location' },
  { id: 3, desc: 'Navigate into the documents folder', hint: 'enter documents', check: (cmd) => cmd.startsWith('enter') && cmd.includes('document') },
  { id: 4, desc: 'Create a new file called myfile.txt', hint: 'create myfile.txt', check: (cmd) => cmd.startsWith('create') && cmd.includes('.txt') },
  { id: 5, desc: 'Show the contents of hello.txt', hint: 'cat hello.txt  or  show hello.txt', check: (cmd) => (cmd.startsWith('cat') || cmd.startsWith('show')) && cmd.includes('.txt') },
  { id: 6, desc: 'Create a new folder called myfolder', hint: 'create myfolder', check: (cmd) => cmd.startsWith('create') && !cmd.includes('.') },
  { id: 7, desc: 'Open a file in the editor', hint: 'nano myfile.txt  or  open myfile.txt', check: (cmd) => cmd.startsWith('nano') || cmd.startsWith('open') },
  { id: 8, desc: 'Scan a site for hidden pages using kashif', hint: 'kashif pages.txt example.com', check: (cmd) => cmd.startsWith('kashif') },
  { id: 9, desc: 'Try cracking a password with barq', hint: 'barq user wordlist.txt http://example.com', check: (cmd) => cmd.startsWith('barq') },
]

// ── Nano Editor Overlay ───────────────────────────────────────────────────────
function NanoEditor({ filename, content, onSave, onExit }) {
  const [text, setText] = useState(content)
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => { textareaRef.current?.focus() }, [])

  const handleSave = () => {
    onSave(text)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'x') { e.preventDefault(); onExit(text) }
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSave() }
    if (e.ctrlKey && e.key === 'o') { e.preventDefault(); handleSave() }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 font-mono">
      {/* Title bar */}
      <div className="bg-slate-700 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-6">
        <span className="text-slate-400">GNU nano 6.4</span>
        <span className="font-bold text-white">File: {filename}</span>
        {saved && <span className="text-green-400 font-bold">[ Saved ]</span>}
      </div>

      {/* Editor area */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => { setText(e.target.value); setSaved(false) }}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-slate-900 text-green-300 p-4 resize-none outline-none text-sm font-mono leading-relaxed"
        spellCheck={false}
      />

      {/* Help bar */}
      <div className="bg-slate-800 border-t border-slate-700 text-slate-300 text-xs px-3 py-1.5 flex flex-wrap gap-x-5 gap-y-1">
        <span><span className="text-white font-bold">^X</span> Exit</span>
        <span><span className="text-white font-bold">^S</span> Save</span>
        <span><span className="text-white font-bold">^O</span> Write Out</span>
        <span><span className="text-white font-bold">^K</span> Cut Line</span>
        <span className="text-slate-500 text-xs">( Ctrl + key )</span>
      </div>
    </div>
  )
}

// ── Terminal Line rendering ───────────────────────────────────────────────────
function TermLine({ line }) {
  if (line.type === 'ls-items') {
    return (
      <div className="text-sm font-mono flex flex-wrap gap-x-5 gap-y-0.5">
        {line.items.map((item, i) => (
          <span key={i} className={item.isDir ? 'text-blue-400 font-semibold' : 'text-slate-300'}>
            {item.name}
          </span>
        ))}
      </div>
    )
  }

  if (line.type === 'ls-detail') {
    return (
      <div className="text-sm font-mono space-y-0.5">
        {line.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-slate-500 text-xs">{item.isDir ? 'drwxr-xr-x' : '-rw-r--r--'}</span>
            <span className="text-slate-500 text-xs">student</span>
            <span className={item.isDir ? 'text-blue-400 font-semibold' : 'text-slate-300'}>
              {item.name}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const styles = {
    prompt:  'text-green-400',
    output:  'text-slate-300',
    error:   'text-red-400',
    info:    'text-cyan-400',
    success: 'text-emerald-400',
    header:  'text-amber-300 font-bold',
  }
  return (
    <div className={`text-sm leading-snug font-mono whitespace-pre-wrap break-all ${styles[line.type] || 'text-slate-300'}`}>
      {line.text}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PageTerminalIntro() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [fs, setFs] = useState(INITIAL_FS)
  const [cwd, setCwd] = useState([])
  const [lines, setLines] = useState([
    { type: 'header', text: '╔══════════════════════════════════════════╗' },
    { type: 'header', text: isAr ? '║    بيئة الطرفية التعليمية              ║' : '║    Educational Terminal Environment     ║' },
    { type: 'header', text: '╚══════════════════════════════════════════╝' },
    { type: 'info',   text: isAr ? 'اكتب "help" لعرض قائمة الأوامر المتاحة.' : 'Type "help" to see available commands.' },
    { type: 'output', text: '' },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)

  const [nanoOpen, setNanoOpen] = useState(false)
  const [nanoFile, setNanoFile] = useState(null)
  const [nanoContent, setNanoContent] = useState('')

  const [termBusy, setTermBusy] = useState(false)
  const [completedTasks, setCompletedTasks] = useState(new Set())

  const outputRef = useRef(null)
  const inputRef = useRef(null)
  const TASKS = isAr ? TASKS_AR : TASKS_EN

  const currentPath = cwd.length === 0 ? 'Desktop' : 'Desktop/' + cwd.join('/')
  const prompt = `student@lab:${currentPath}$ `

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [lines])

  const push = useCallback((...newLines) => {
    setLines(prev => [...prev, ...newLines.map(l =>
      typeof l === 'string' ? { type: 'output', text: l } : l
    )])
  }, [])

  const checkTask = useCallback((cmd) => {
    TASKS.forEach(task => {
      if (!completedTasks.has(task.id) && task.check(cmd)) {
        setCompletedTasks(prev => new Set([...prev, task.id]))
      }
    })
  }, [TASKS, completedTasks])

  const runCommand = useCallback((raw) => {
    const trimmed = raw.trim()
    if (!trimmed) return

    push({ type: 'prompt', text: prompt + trimmed })
    setHistory(h => [trimmed, ...h.slice(0, 49)])
    checkTask(trimmed)

    const parts = trimmed.split(/\s+/)
    let cmd = parts[0].toLowerCase()
    // Real Linux commands → existing pedagogical aliases (same behavior)
    const ALIAS = { ls: 'display', cd: 'enter', pwd: 'location' }
    if (ALIAS[cmd]) cmd = ALIAS[cmd]
    const args = parts.slice(1)

    const curNode = getNode(fs, cwd)
    const children = curNode?.children || {}

    if (cmd === 'clear') { setLines([]); return }

    if (cmd === 'help') {
      push(
        { type: 'info',   text: isAr ? '── الأوامر المتاحة ──────────────────────────────' : '── Available Commands ──────────────────────────' },
        { type: 'output', text: '  display             ' + (isAr ? 'عرض الملفات والمجلدات في موقعك الحالي' : 'show files and folders in your current location') },
        { type: 'output', text: '  enter <dir>         ' + (isAr ? 'الانتقال إلى مجلد — مثال: enter documents' : 'move into a folder — e.g. enter documents') },
        { type: 'output', text: '  enter parent        ' + (isAr ? 'الرجوع للمجلد الأعلى' : 'go up to the parent folder') },
        { type: 'output', text: '  enter Desktop       ' + (isAr ? 'الرجوع إلى Desktop (نقطة البداية)' : 'go back to Desktop root') },
        { type: 'output', text: '  location            ' + (isAr ? 'طباعة المسار الكامل للمجلد الحالي' : 'show your current full path') },
        { type: 'output', text: '  tree                ' + (isAr ? 'عرض هيكل الملفات والمجلدات شجرياً' : 'show directory tree structure') },
        { type: 'output', text: '  create <n>          ' + (isAr ? 'إنشاء — بدون امتداد: مجلد، مع امتداد: ملف — مثال: create myfolder أو create notes.txt' : 'create — no extension: folder, with extension: file — e.g. create myfolder or create notes.txt') },
        { type: 'output', text: '  cat <f>             ' + (isAr ? 'عرض محتوى ملف نصي على الشاشة' : 'display the contents of a text file') },
        { type: 'output', text: '  show <f>            ' + (isAr ? 'نفس cat — اسم بديل أسهل للقراءة' : 'same as cat — a friendlier alias') },
        { type: 'output', text: '  nano <f>            ' + (isAr ? 'فتح محرر نصوص — Ctrl+S حفظ، Ctrl+X خروج' : 'open text editor — Ctrl+S to save, Ctrl+X to exit') },
        { type: 'output', text: '  open <f>            ' + (isAr ? 'نفس nano — فتح ملف في المحرر' : 'same as nano — open a file in the editor') },
        { type: 'output', text: '  rm <f>              ' + (isAr ? 'حذف ملف نهائياً' : 'delete a file permanently') },
        { type: 'output', text: '  rm -r <d>           ' + (isAr ? 'حذف مجلد وكل محتوياته' : 'delete a folder and all its contents') },
        { type: 'output', text: '  delete <name>       ' + (isAr ? 'حذف ملف أو مجلد' : 'delete a file or folder') },
        { type: 'output', text: '  echo <txt>          ' + (isAr ? 'طباعة نص — مثال: echo مرحبا' : 'print text — e.g. echo hello') },
        { type: 'info',   text: isAr ? '── أدوات الأمن السيبراني ────────────────────────' : '── Cybersecurity Tools ─────────────────────────' },
        { type: 'output', text: '  kashif <url> [ملف]             ' + (isAr ? 'اكتشاف الصفحات — يمكن تحديد ملف مسارات' : 'discover hidden pages — optionally pass a paths file') },
        { type: 'output', text: '  barq <user> <wordlist> <url>   ' + (isAr ? 'كسر كلمة المرور بالقوة الغاشمة' : 'brute-force a login password') },
        { type: 'info',   text: '─────────────────────────────────────────────────' },
        { type: 'output', text: '  clear               ' + (isAr ? 'مسح الشاشة' : 'clear the terminal screen') },
        { type: 'output', text: '  help                ' + (isAr ? 'عرض هذه القائمة' : 'show this list') },
        { type: 'output', text: '' },
      )
      return
    }

    if (cmd === 'location') {
      push({ type: 'output', text: currentPath })
      return
    }

    if (cmd === 'display') {
      const detailed = args.includes('-l') || args.includes('-la') || args.includes('-al')
      const entries = Object.entries(children)
      if (entries.length === 0) {
        push({ type: 'output', text: isAr ? '(المجلد فارغ)' : '(empty directory)' })
      } else if (detailed) {
        const items = entries.map(([name, node]) => ({ name, isDir: node.type === 'dir' }))
        push({ type: 'ls-detail', items })
      } else {
        const items = [
          ...entries.filter(([, n]) => n.type === 'dir').map(([name]) => ({ name, isDir: true })),
          ...entries.filter(([, n]) => n.type === 'file').map(([name]) => ({ name, isDir: false })),
        ]
        push({ type: 'ls-items', items })
      }
      return
    }

    if (cmd === 'enter') {
      if (!args[0] || args[0] === '~' || args[0] === 'Desktop') {
        setCwd([])
        return
      }
      if (args[0] === 'parent' || args[0] === '..') {
        if (cwd.length === 0) { push({ type: 'error', text: isAr ? 'أنت بالفعل في Desktop' : 'already at Desktop root' }); return }
        setCwd(prev => prev.slice(0, -1))
        return
      }
      if (args[0].startsWith('/')) {
        const segs = args[0].split('/').filter(Boolean)
        if (getNode(fs, segs)?.type === 'dir') { setCwd(segs) }
        else push({ type: 'error', text: `enter: ${args[0]}: ${isAr ? 'لا يوجد مجلد بهذا الاسم' : 'No such directory'}` })
        return
      }
      const target = { ...children }[args[0]]
      if (!target) { push({ type: 'error', text: `enter: ${args[0]}: ${isAr ? 'لا يوجد' : 'No such file or directory'}` }); return }
      if (target.type !== 'dir') { push({ type: 'error', text: `enter: ${args[0]}: ${isAr ? 'ليس مجلداً' : 'Not a directory'}` }); return }
      setCwd(prev => [...prev, args[0]])
      return
    }

    if (cmd === 'mkdir') {
      if (!args[0]) { push({ type: 'error', text: isAr ? 'mkdir: يجب تحديد اسم المجلد' : 'mkdir: missing operand' }); return }
      const name = args[0]
      if (children[name]) { push({ type: 'error', text: `mkdir: ${name}: ${isAr ? 'موجود مسبقاً' : 'already exists'}` }); return }
      setFs(f => setNode(f, cwd, name, { type: 'dir', children: {} }))
      push({ type: 'success', text: `${isAr ? 'تم إنشاء المجلد' : 'Directory created'}: ${name}/` })
      return
    }

    if (cmd === 'touch') {
      if (!args[0]) { push({ type: 'error', text: isAr ? 'touch: يجب تحديد اسم الملف' : 'touch: missing operand' }); return }
      const name = args[0]
      if (children[name]) { push({ type: 'error', text: `touch: ${name}: ${isAr ? 'موجود مسبقاً' : 'already exists'}` }); return }
      setFs(f => setNode(f, cwd, name, { type: 'file', content: '' }))
      push({ type: 'success', text: `${isAr ? 'تم إنشاء الملف' : 'File created'}: ${name}` })
      return
    }

    if (cmd === 'create') {
      if (!args[0]) { push({ type: 'error', text: isAr ? 'create: يجب تحديد اسم — بدون امتداد: مجلد، مع امتداد: ملف' : 'create: missing operand — no extension: folder, with extension: file' }); return }
      const name = args[0]
      if (children[name]) { push({ type: 'error', text: `create: ${name}: ${isAr ? 'موجود مسبقاً' : 'already exists'}` }); return }
      if (name.includes('.')) {
        setFs(f => setNode(f, cwd, name, { type: 'file', content: '' }))
        push({ type: 'success', text: `${isAr ? 'تم إنشاء الملف' : 'File created'}: ${name}` })
      } else {
        setFs(f => setNode(f, cwd, name, { type: 'dir', children: {} }))
        push({ type: 'success', text: `${isAr ? 'تم إنشاء المجلد' : 'Directory created'}: ${name}/` })
      }
      return
    }

    if (cmd === 'rm') {
      const force = args.includes('-r') || args.includes('-rf') || args.includes('-f')
      const target = args.find(a => !a.startsWith('-'))
      if (!target) { push({ type: 'error', text: isAr ? 'rm: يجب تحديد الملف' : 'rm: missing operand' }); return }
      if (!children[target]) { push({ type: 'error', text: `rm: ${target}: ${isAr ? 'لا يوجد' : 'No such file'}` }); return }
      if (children[target].type === 'dir' && !force) {
        push({ type: 'error', text: `rm: ${target}: ${isAr ? 'استخدم rm -r لحذف مجلد' : 'Is a directory, use rm -r'}` }); return
      }
      setFs(f => removeNode(f, cwd, target))
      push({ type: 'success', text: `${isAr ? 'تم حذف' : 'Removed'}: ${target}` })
      return
    }

    if (cmd === 'delete') {
      const target = args[0]
      if (!target) { push({ type: 'error', text: isAr ? 'delete: يجب تحديد الاسم' : 'delete: missing operand' }); return }
      if (!children[target]) { push({ type: 'error', text: `delete: ${target}: ${isAr ? 'لا يوجد' : 'No such file or folder'}` }); return }
      setFs(f => removeNode(f, cwd, target))
      push({ type: 'success', text: `🗑️ ${isAr ? 'تم الحذف' : 'Deleted'}: ${target}` })
      return
    }

    if (cmd === 'cat' || cmd === 'show') {
      if (!args[0]) { push({ type: 'error', text: isAr ? `${cmd}: يجب تحديد اسم الملف` : `${cmd}: missing operand` }); return }
      const node = children[args[0]]
      if (!node) { push({ type: 'error', text: `${cmd}: ${args[0]}: ${isAr ? 'لا يوجد' : 'No such file'}` }); return }
      if (node.type === 'dir') { push({ type: 'error', text: `${cmd}: ${args[0]}: ${isAr ? 'هو مجلد' : 'Is a directory'}` }); return }
      push({ type: 'output', text: node.content || (isAr ? '(ملف فارغ)' : '(empty file)') })
      return
    }

    if (cmd === 'echo') {
      const rest = trimmed.slice(5)
      const gtIdx = rest.indexOf('>')
      if (gtIdx !== -1) {
        const text = rest.slice(0, gtIdx).trim().replace(/^["']|["']$/g, '')
        const file = rest.slice(gtIdx + 1).trim()
        setFs(f => setNode(f, cwd, file, { type: 'file', content: text }))
        push({ type: 'success', text: `${isAr ? 'كُتب في' : 'Written to'}: ${file}` })
      } else {
        push({ type: 'output', text: rest.trim().replace(/^["']|["']$/g, '') })
      }
      return
    }

    if (cmd === 'nano' || cmd === 'open') {
      if (!args[0]) { push({ type: 'error', text: isAr ? `${cmd}: يجب تحديد اسم الملف` : `${cmd}: missing operand` }); return }
      const name = args[0]
      const node = children[name]
      if (node?.type === 'dir') { push({ type: 'error', text: `${cmd}: ${name}: ${isAr ? 'هو مجلد' : 'Is a directory'}` }); return }
      setNanoFile({ name, path: [...cwd, name] })
      setNanoContent(node?.content ?? '')
      setNanoOpen(true)
      return
    }

    // ── tree ──
    if (cmd === 'tree') {
      const renderTree = (node, prefix = '') => {
        const entries = Object.entries(node?.children || node || {})
        entries.forEach(([name, child], idx) => {
          const isLast = idx === entries.length - 1
          const label  = child.type === 'dir' ? name + '/' : name
          push({ type: child.type === 'dir' ? 'info' : 'output', text: prefix + (isLast ? '└── ' : '├── ') + label })
          if (child.type === 'dir') renderTree(child, prefix + (isLast ? '    ' : '│   '))
        })
      }
      push({ type: 'success', text: currentPath })
      renderTree(getNode(fs, cwd))
      return
    }

    // ── kashif ──
    if (cmd === 'kashif') {
      if (termBusy) { push({ type: 'error', text: isAr ? 'جاري فحص آخر، انتظر...' : 'Another scan is running, please wait.' }); return }
      const target   = args[0] || 'http://example.com'
      const wordFile = args[1] || null

      // Build scan list: from file if provided, else default demo list
      let scanPaths // array of { path, kind, statusEn, statusAr } | { path, unknown: true }
      if (wordFile) {
        const fileNode = children[wordFile]
        if (!fileNode || fileNode.type !== 'file') {
          push({ type: 'error', text: isAr ? `kashif: الملف "${wordFile}" غير موجود في المجلد الحالي` : `kashif: file "${wordFile}" not found in current directory` })
          return
        }
        const lines_ = fileNode.content.split('\n').map(l => l.trim()).filter(Boolean)
        scanPaths = lines_.map(line => {
          const p = line.startsWith('/') ? line : '/' + line
          const known = DEMO_KASHIF_PATHS.find(k => k.path === p)
          return known ? { ...known } : { path: p, unknown: true }
        })
      } else {
        scanPaths = DEMO_KASHIF_PATHS
      }

      setTermBusy(true)
      const wordlistLabel = wordFile
        ? (isAr ? `${wordFile} (${scanPaths.length} مسار)` : `${wordFile} (${scanPaths.length} paths)`)
        : (isAr ? 'common_pages.txt (300 صفحة)' : 'common_pages.txt (300 pages)')

      push(
        ...(isAr ? [
          { type: 'info', text: `[*] كاشف v2.0 — أداة اكتشاف الصفحات` },
          { type: 'info', text: `[*] الهدف   : ${target}` },
          { type: 'info', text: `[*] القائمة : ${wordlistLabel}` },
          { type: 'output', text: '' },
        ] : [
          { type: 'info', text: `[*] Kashif v2.0 — Page Discovery Tool` },
          { type: 'info', text: `[*] Target  : ${target}` },
          { type: 'info', text: `[*] Wordlist: ${wordlistLabel}` },
          { type: 'output', text: '' },
        ])
      )

      let ki = 0
      const kiv = setInterval(() => {
        if (ki >= scanPaths.length) {
          clearInterval(kiv)
          const validPaths = scanPaths.filter(p => !p.unknown)
          const found      = validPaths.filter(p => p.kind === 'found')
          const protected_ = validPaths.filter(p => p.kind === 'warn')
          const sep = '─'.repeat(44)
          push(
            { type: 'output',  text: '' },
            { type: 'output',  text: sep },
            { type: 'success', text: isAr ? '[✓] الفحص مكتمل! النتائج:' : '[✓] Scan complete! Results:' },
            { type: 'output',  text: '' },
            { type: 'success', text: isAr ? `  📄 الصفحات المكتشفة (${found.length}):` : `  📄 Accessible pages (${found.length}):` },
            ...found.map(p => ({ type: 'success', text: `      ${target}${p.path}` })),
            { type: 'output',  text: '' },
            { type: 'info',    text: isAr ? `  🔒 الصفحات المحمية (${protected_.length}):` : `  🔒 Password-protected pages (${protected_.length}):` },
            ...protected_.map(p => ({ type: 'info', text: `      ${target}${p.path}` })),
            { type: 'output',  text: '' },
            { type: 'output',  text: sep },
          )
          setTermBusy(false)
          return
        }
        const entry = scanPaths[ki]
        if (entry.unknown) {
          push({ type: 'output', text: `[?] ${target}${entry.path}` })
        } else {
          const type   = entry.kind === 'found' ? 'success' : entry.kind === 'warn' ? 'info' : 'error'
          const marker = entry.kind === 'found' ? '[+]' : entry.kind === 'warn' ? '[!]' : '[-]'
          push({ type, text: `${marker} ${target}${entry.path}  →  ${isAr ? entry.statusAr : entry.statusEn}` })
        }
        ki++
      }, 200)
      return
    }

    // ── barq ──
    if (cmd === 'barq') {
      if (termBusy) { push({ type: 'error', text: isAr ? 'جاري تنفيذ أمر آخر، انتظر...' : 'Another command is running, please wait.' }); return }
      const username = args[0] || null
      const target   = args[2] || args[1] || null
      if (!username || !target) {
        push(
          { type: 'error',  text: isAr ? 'الاستخدام: barq <مستخدم> <قائمة_كلمات> <رابط>' : 'Usage: barq <user> <wordlist> <url>' },
          { type: 'output', text: isAr ? 'مثال: barq admin wordlist.txt http://example.com' : 'Example: barq admin wordlist.txt http://example.com' },
        )
        return
      }
      setTermBusy(true)
      push(
        ...(isAr ? [
          { type: 'info', text: `[*] جاري هجوم القوة الغاشمة...` },
          { type: 'info', text: `[*] الهدف    : ${target}` },
          { type: 'info', text: `[*] المستخدم : ${username}` },
          { type: 'info', text: `[*] القائمة  : common.txt (1,000 كلمة مرور)` },
          { type: 'output', text: '' },
        ] : [
          { type: 'info', text: `[*] Starting brute-force attack...` },
          { type: 'info', text: `[*] Target  : ${target}` },
          { type: 'info', text: `[*] Username: ${username}` },
          { type: 'info', text: `[*] Wordlist: common.txt (1,000 passwords)` },
          { type: 'output', text: '' },
        ])
      )
      let bi = 0
      const biv = setInterval(() => {
        const pw = DEMO_BARQ_TRIES[bi]
        const isLast = bi === DEMO_BARQ_TRIES.length - 1
        if (isLast) {
          clearInterval(biv)
          push({ type: 'info', text: `[*] ${isAr ? 'جاري التجربة' : 'Trying'}: ${pw} ...` })
          setTimeout(() => {
            push(
              { type: 'output',  text: '' },
              { type: 'success', text: `[✓] ══════════════════════════════════` },
              { type: 'success', text: isAr ? `[✓] تم اكتشاف كلمة المرور!` : `[✓] PASSWORD FOUND!` },
              { type: 'success', text: `[✓]   ${isAr ? 'المستخدم' : 'Username'}: ${username}` },
              { type: 'success', text: `[✓]   ${isAr ? 'كلمة المرور' : 'Password'}: ${pw}` },
              { type: 'success', text: `[✓] ══════════════════════════════════` },
              { type: 'output',  text: '' },
              { type: 'info',    text: isAr ? `[*] استخدم هذه البيانات لتسجيل الدخول في ${target}/login` : `[*] Use these credentials at ${target}/login` },
            )
            setTermBusy(false)
          }, 400)
        } else {
          push({ type: 'error', text: `[*] ${isAr ? 'جاري التجربة' : 'Trying'}: ${pw} ... ✗` })
          bi++
        }
      }, 350)
      return
    }

    push({ type: 'error', text: `${cmd}: ${isAr ? 'أمر غير معروف. اكتب "help"' : 'command not found. Type "help"'}` })
  }, [fs, cwd, prompt, push, checkTask, isAr, TASKS, termBusy, setTermBusy])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      runCommand(input)
      setInput('')
      setHistIdx(-1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHistIdx(i => {
        const next = Math.min(i + 1, history.length - 1)
        setInput(history[next] ?? '')
        return next
      })
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHistIdx(i => {
        const next = Math.max(i - 1, -1)
        setInput(next === -1 ? '' : history[next])
        return next
      })
    }
  }

  const handleNanoSave = (text) => {
    setFs(f => setNode(f, nanoFile.path.slice(0, -1), nanoFile.name, { type: 'file', content: text }))
    setNanoContent(text)
  }

  const handleNanoExit = (text) => {
    if (text !== nanoContent) {
      setFs(f => setNode(f, nanoFile.path.slice(0, -1), nanoFile.name, { type: 'file', content: text }))
    }
    setNanoOpen(false)
    push({ type: 'info', text: `nano: ${isAr ? 'تم إغلاق الملف' : 'File closed'}: ${nanoFile.name}` })
    inputRef.current?.focus({ preventScroll: true })
  }

  return (
    <div className="min-h-screen bg-slate-50" dir={isAr ? 'rtl' : 'ltr'}>
      {nanoOpen && (
        <NanoEditor
          filename={nanoFile.name}
          content={nanoContent}
          onSave={handleNanoSave}
          onExit={handleNanoExit}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-5">
          <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
            {isAr ? 'مختبر' : 'Lab'}
          </span>
          <h1 className="text-3xl font-black text-slate-800 mt-2 mb-1">
            {isAr ? 'مقدمة إلى الطرفية' : 'Terminal Introduction'}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Left: Tasks + Help */}
          <div className="lg:col-span-1 space-y-4">
            {/* Mini tasks */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <span>🎯</span>
                {isAr ? 'المهام التدريبية' : 'Practice Tasks'}
                <span className="text-xs text-slate-400 font-normal">({completedTasks.size}/{TASKS.length})</span>
              </h3>
              <div className="space-y-2">
                {TASKS.map((task, i) => {
                  const done = completedTasks.has(task.id)
                  return (
                    <div key={task.id} className={`rounded-xl p-2.5 border text-xs transition-all ${
                      done
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 mt-0.5">{done ? '✅' : `${i + 1}.`}</span>
                        <div>
                          <p className="leading-snug">{task.desc}</p>
                          {!done && (
                            <code className="text-xs text-slate-400 mt-1 block font-mono">{task.hint}</code>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: Terminal */}
          <div className="lg:col-span-3">
            <div
              className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl flex flex-col cursor-text" dir="ltr"
              style={{ height: '500px' }}
              onClick={() => { if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true }) }}
            >
              {/* Terminal title bar */}
              <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-slate-400 text-xs font-mono">
                  student@lab: {currentPath}
                </span>
              </div>

              {/* Output */}
              <div ref={outputRef} className="flex-1 overflow-y-auto p-4 space-y-0.5">
                {lines.map((line, i) => <TermLine key={i} line={line} />)}
              </div>

              {/* Input row */}
              <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-800 flex-shrink-0">
                <span className="text-green-400 font-mono text-sm whitespace-nowrap flex-shrink-0">
                  {prompt}
                </span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-slate-100 font-mono text-sm outline-none caret-green-400"
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  dir="ltr"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              {isAr
                ? 'اضغط على الطرفية وابدأ الكتابة • السهم ↑↓ لتصفح السجل'
                : 'Click on the terminal and start typing • ↑↓ arrows for history'}
            </p>
          </div>
        </div>

        {/* explanation — collapsed by default, sits under the practical part */}
        <Explanation>
          <p className="text-slate-500 text-sm mb-4">
            {isAr ? 'تعلم أوامر الطرفية الأساسية في بيئة محاكاة آمنة' : 'Learn basic terminal commands in a safe simulation environment'}
          </p>

          {/* Concept box */}
          <div className="bg-slate-800 text-slate-200 rounded-2xl p-5 mb-5">
            <h2 className="font-bold text-white mb-2 text-base">
              {isAr ? '💻 ما هي الطرفية؟' : '💻 What is a Terminal?'}
            </h2>
            <p className="text-sm leading-relaxed text-slate-300">
              {isAr
                ? 'الطرفية (Terminal) أو سطر الأوامر هي واجهة نصية تتيح لك التواصل مع نظام التشغيل مباشرةً عن طريق الكتابة. بدلاً من النقر على أيقونات، تكتب أوامر مثل ls وcd وmkdir. يستخدمها المطورون ومتخصصو الأمن السيبراني يومياً.'
                : 'The terminal (command line) is a text interface that lets you communicate directly with the operating system by typing. Instead of clicking icons, you type commands like ls, cd, mkdir. Developers and cybersecurity professionals use it daily.'}
            </p>
          </div>

          {/* Command cheat sheet */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="font-bold text-slate-800 text-sm mb-3">
              {isAr ? '📋 مرجع الأوامر' : '📋 Command Reference'}
            </h3>
            <div className="space-y-1.5 font-mono text-xs" dir="ltr">
              {[
                ['ls',              isAr ? 'عرض الملفات' : 'list files'],
                ['cd dir',          isAr ? 'انتقل لمجلد' : 'go to dir'],
                ['cd ..',           isAr ? 'ارجع للأعلى' : 'go up'],
                ['pwd',             isAr ? 'المسار الحالي' : 'current path'],
                ['mkdir d',         isAr ? 'أنشئ مجلد' : 'create dir'],
                ['touch f',         isAr ? 'أنشئ ملف' : 'create file'],
                ['cat f / show f',  isAr ? 'اعرض ملف' : 'show file'],
                ['nano f / open f', isAr ? 'عدّل ملف' : 'edit file'],
                ['rm f',            isAr ? 'احذف ملف' : 'delete file'],
                ['clear',           isAr ? 'امسح الشاشة' : 'clear screen'],
              ].map(([cmd, desc]) => (
                <div key={cmd} className="flex justify-between gap-2 items-baseline">
                  <code className="text-indigo-600 font-bold whitespace-nowrap">{cmd}</code>
                  <span className="text-slate-400 text-right" dir={isAr ? 'rtl' : 'ltr'}>{desc}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-1.5 mt-1">
                <div className="text-slate-400 text-[10px] mb-1">{isAr ? '🔐 أدوات الأمن السيبراني' : '🔐 Cybersecurity Tools'}</div>
                {[
                  ['kashif <url>',    isAr ? 'اكتشف صفحات' : 'scan pages'],
                  ['barq <u> <w> <url>', isAr ? 'كسر كلمة مرور' : 'brute-force'],
                ].map(([cmd, desc]) => (
                  <div key={cmd} className="flex justify-between gap-2 items-baseline">
                    <code className="text-rose-500 font-bold whitespace-nowrap">{cmd}</code>
                    <span className="text-slate-400 text-right" dir={isAr ? 'rtl' : 'ltr'}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Explanation>

        {/* Back to home */}
        <div className="flex items-center mt-8 pt-5 border-t border-slate-200">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
          >
            ← {isAr ? 'الرئيسية' : 'Home'}
          </button>
        </div>
      </div>
    </div>
  )
}
