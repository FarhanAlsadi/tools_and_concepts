import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Explanation from '../components/Explanation'

// ── Immutable FS helpers ──────────────────────────────────────────────────────
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
  if (pathArr.length === 0) { const c = { ...fs }; delete c[name]; return c }
  const [head, ...rest] = pathArr
  if (!fs[head] || fs[head].type !== 'dir') return fs
  return { ...fs, [head]: { ...fs[head], children: removeNode(fs[head].children, rest, name) } }
}
function buildTreeLines(node, prefix, name, isLast, result) {
  const connector = isLast ? '└── ' : '├── '
  const childPrefix = isLast ? '    ' : '│   '
  result.push({ text: prefix + connector + name + (node.type === 'dir' ? '/' : ''), isDir: node.type === 'dir' })
  if (node.type === 'dir' && node.children) {
    const entries = Object.entries(node.children)
    entries.forEach(([n, nd], i) => buildTreeLines(nd, prefix + childPrefix, n, i === entries.length - 1, result))
  }
}

// ── Desktop file system (Desktop = root) — several levels of nesting ─────────
const INITIAL_FS = {
  'welcome.txt': { type: 'file', content: 'أهلاً بك في Desktop!\nهذا مجلدك الرئيسي.\nجرب: display  أو  cat welcome.txt' },
  'todo.txt':    { type: 'file', content: 'قائمة المهام:\n1. تعلم نظام الملفات\n2. ممارسة enter وdisplay\n3. إنشاء ملفاتي الخاصة' },
  Documents: {
    type: 'dir', children: {
      'notes.txt':  { type: 'file', content: 'ملاحظاتي:\n- نبدأ من Desktop كنقطة رئيسية\n- كل مجلد يحتوي ملفات ومجلدات أخرى\n- المسار يبدأ دائماً من Desktop' },
      'resume.pdf': { type: 'file', content: '(ملف PDF — سيرتي الذاتية)' },
      projects: {
        type: 'dir', children: {
          website: {
            type: 'dir', children: {
              'index.html': { type: 'file', content: '<h1>موقعي الأول</h1>\n<p>مرحباً بالعالم!</p>' },
              'style.css':  { type: 'file', content: 'body { color: navy; background: #f8fafc; }' },
              img: { type: 'dir', children: {
                'logo.png': { type: 'file', content: '(صورة الشعار)' },
              } },
            },
          },
          game: {
            type: 'dir', children: {
              'main.py':   { type: 'file', content: "print('مرحباً باللاعب!')" },
              'README.md': { type: 'file', content: '# لعبتي\nكيف تلعب: اضغط ابدأ.' },
            },
          },
        },
      },
      reports: {
        type: 'dir', children: {
          '2024': { type: 'dir', children: {
            'q1.txt': { type: 'file', content: 'تقرير الربع الأول 2024' },
            'q2.txt': { type: 'file', content: 'تقرير الربع الثاني 2024' },
          } },
        },
      },
    },
  },
  Downloads: {
    type: 'dir', children: {
      'readme.txt': { type: 'file', content: 'مجلد التنزيلات.\nضع هنا الملفات التي تنزلها.' },
      'photo.jpg':  { type: 'file', content: '(صورة نزّلتها من الإنترنت)' },
      music: {
        type: 'dir', children: {
          'song.mp3': { type: 'file', content: '(ملف صوتي)' },
        },
      },
    },
  },
  Pictures: {
    type: 'dir', children: {
      'family.jpg': { type: 'file', content: '(صورة العائلة)' },
      vacation: {
        type: 'dir', children: {
          'beach.jpg':  { type: 'file', content: '(صورة الشاطئ)' },
          'sunset.jpg': { type: 'file', content: '(صورة الغروب)' },
        },
      },
    },
  },
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
const TASKS_AR = [
  { id: 1, desc: 'اعرض مكانك الحالي',            hint: 'location',             check: c => c.trim() === 'location' },
  { id: 2, desc: 'اعرض محتويات المجلد الحالي',   hint: 'display',              check: c => c.trim() === 'display' },
  { id: 3, desc: 'انتقل إلى مجلد Documents',      hint: 'enter Documents',      check: c => c.startsWith('enter') && c.toLowerCase().includes('document') },
  { id: 4, desc: 'ارجع للمجلد الأعلى (Desktop)',  hint: 'enter parent',         check: c => c.trim() === 'enter parent' },
  { id: 5, desc: 'ارجع إلى Desktop',              hint: 'enter Desktop',        check: c => c.trim() === 'enter Desktop' },
  { id: 6, desc: 'اعرض هيكل الملفات شجرياً',     hint: 'tree',                 check: c => c.trim() === 'tree' },
  { id: 7, desc: 'أنشئ مجلداً جديداً',            hint: 'create myfolder',      check: c => c.startsWith('create') && !c.includes('.') },
  { id: 8, desc: 'أنشئ ملفاً جديداً',             hint: 'create myfile.txt',    check: c => c.startsWith('create') && c.includes('.') },
]
const TASKS_EN = [
  { id: 1, desc: 'Show your current location',        hint: 'location',             check: c => c.trim() === 'location' },
  { id: 2, desc: 'List current directory contents',   hint: 'display',              check: c => c.trim() === 'display' },
  { id: 3, desc: 'Navigate into Documents folder',    hint: 'enter Documents',      check: c => c.startsWith('enter') && c.toLowerCase().includes('document') },
  { id: 4, desc: 'Go back to Desktop (parent)',        hint: 'enter parent',         check: c => c.trim() === 'enter parent' },
  { id: 5, desc: 'Reset back to Desktop root',         hint: 'enter Desktop',        check: c => c.trim() === 'enter Desktop' },
  { id: 6, desc: 'Show the file tree structure',      hint: 'tree',                 check: c => c.trim() === 'tree' },
  { id: 7, desc: 'Create a new folder',               hint: 'create myfolder',      check: c => c.startsWith('create') && !c.includes('.') },
  { id: 8, desc: 'Create a new file',                 hint: 'create myfile.txt',    check: c => c.startsWith('create') && c.includes('.') },
]

// ── Nano editor ───────────────────────────────────────────────────────────────
function NanoEditor({ filename, content, onSave, onExit }) {
  const [text, setText] = useState(content)
  const [saved, setSaved] = useState(false)
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus() }, [])
  const save = () => { onSave(text); setSaved(true); setTimeout(() => setSaved(false), 1500) }
  const onKey = e => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); save() }
    if (e.ctrlKey && (e.key === 'x' || e.key === 'o')) { e.preventDefault(); onExit(text) }
  }
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 font-mono">
      <div className="bg-slate-700 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-6">
        <span className="text-slate-400">GNU nano 6.4</span>
        <span className="font-bold">File: {filename}</span>
        {saved && <span className="text-green-400 font-bold">[ Saved ]</span>}
      </div>
      <div className="bg-slate-800 border-b border-slate-700 text-slate-200 text-xs px-4 py-2 flex items-center justify-center gap-8">
        <span>اضغط <kbd className="bg-slate-600 text-white font-bold px-1.5 py-0.5 rounded text-xs font-mono">Ctrl + S</kbd> لحفظ الملف</span>
        <span>اضغط <kbd className="bg-slate-600 text-white font-bold px-1.5 py-0.5 rounded text-xs font-mono">Ctrl + X</kbd> للخروج</span>
      </div>
      <textarea ref={ref} value={text}
        onChange={e => { setText(e.target.value); setSaved(false) }}
        onKeyDown={onKey}
        className="flex-1 bg-slate-900 text-green-300 p-4 resize-none outline-none text-sm font-mono leading-relaxed"
        spellCheck={false} />
      <div className="bg-slate-800 border-t border-slate-700 text-slate-200 text-xs px-4 py-2 flex items-center justify-center gap-8">
        <span>اضغط <kbd className="bg-slate-600 text-white font-bold px-1.5 py-0.5 rounded text-xs font-mono">Ctrl + S</kbd> لحفظ الملف</span>
        <span>اضغط <kbd className="bg-slate-600 text-white font-bold px-1.5 py-0.5 rounded text-xs font-mono">Ctrl + X</kbd> للخروج</span>
      </div>
    </div>
  )
}

// ── Terminal line renderer ────────────────────────────────────────────────────
function TermLine({ line }) {
  if (line.type === 'ls') {
    return (
      <div className="text-sm font-mono flex flex-wrap gap-x-4 gap-y-0.5 py-0.5">
        {line.items.map((item, i) => (
          <span key={i} className={item.isDir ? 'text-blue-400 font-semibold' : 'text-slate-300'}>
            {item.name}{item.isDir ? '/' : ''}
          </span>
        ))}
      </div>
    )
  }
  if (line.type === 'tree') {
    return (
      <div className="font-mono text-xs space-y-0 py-0.5">
        {line.lines.map((l, i) => (
          <div key={i} className={l.isDir ? 'text-blue-400' : 'text-slate-400'}>{l.text}</div>
        ))}
      </div>
    )
  }
  const cls = {
    prompt: 'text-green-400', output: 'text-slate-300', error: 'text-red-400',
    info: 'text-cyan-400', success: 'text-emerald-400', header: 'text-amber-300 font-bold',
  }
  return (
    <div className={`text-sm leading-snug font-mono whitespace-pre-wrap break-all ${cls[line.type] || 'text-slate-300'}`}>
      {line.text}
    </div>
  )
}

// ── Pyramid tree — level spacing grows wider per depth ────────────────────────
const LEVEL_GAP = [32, 24, 16] // gap in px per depth level (shrinks as nesting goes deeper)

function PyramidNode({ name, node, pathArr, cwd, onClickFolder, onClickFile, depth = 1 }) {
  const isDir = node.type === 'dir'
  const isCurrent  = pathArr.join('/') === cwd.join('/')
  const isAncestor = cwd.length > pathArr.length &&
    cwd.slice(0, pathArr.length).join('/') === pathArr.join('/')

  const entries = isDir ? Object.entries(node.children || {}) : []
  const sorted  = [
    ...entries.filter(([, n]) => n.type === 'dir'),
    ...entries.filter(([, n]) => n.type === 'file'),
  ]

  // progressive disclosure: a folder reveals its children only when it is the
  // current folder or an ancestor of it — so you drill down one level per click
  const hasChildren  = isDir && sorted.length > 0
  const showChildren = hasChildren && (isCurrent || isAncestor)

  const gap = LEVEL_GAP[Math.min(depth, LEVEL_GAP.length - 1)]

  const handleClick = isDir
    ? () => onClickFolder(pathArr)
    : () => onClickFile(pathArr, node)

  return (
    <div className="flex flex-col items-center">
      {/* Node box */}
      <div
        role="button"
        tabIndex={0}
        dir="ltr"
        onClick={handleClick}
        onKeyDown={e => e.key === 'Enter' && handleClick()}
        className={`
          px-2.5 py-1.5 rounded-xl border text-xs font-mono whitespace-nowrap select-none transition-all cursor-pointer
          ${isCurrent
            ? 'bg-indigo-100 border-indigo-400 text-indigo-700 font-bold shadow-md ring-2 ring-indigo-300 scale-105'
            : isAncestor
              ? 'bg-indigo-100 border-indigo-400 text-indigo-700 font-semibold hover:bg-indigo-200 shadow-sm'
              : isDir
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 shadow-sm'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 shadow-sm'
          }
        `}
      >
        {isDir ? '📁' : '📄'} {name}{isDir ? '/' : ''}
        {hasChildren && <span className="ml-1 text-[10px] align-middle opacity-70">{showChildren ? '▾' : '▸'}</span>}
        {isCurrent && <span className="text-indigo-400 ml-1.5 text-xs font-normal">←</span>}
      </div>

      {/* Children with connecting lines — only when this folder is opened */}
      {showChildren && (
        <>
          <div className="w-px h-5 bg-indigo-400 flex-shrink-0" />
          <div className="relative flex items-start" style={{ gap: `${gap}px` }}>
            {sorted.length > 1 && (
              <div className="absolute left-0 right-0 top-0 h-px bg-slate-300 pointer-events-none" />
            )}
            {sorted.map(([n, nd]) => {
              const childOnPath = cwd.length > pathArr.length && cwd[pathArr.length] === n
              return (
                <div key={n} className="flex flex-col items-center">
                  <div className={`w-px h-5 ${childOnPath ? 'bg-indigo-400' : 'bg-slate-300'}`} />
                  <PyramidNode
                    name={n} node={nd}
                    pathArr={[...pathArr, n]}
                    cwd={cwd} onClickFolder={onClickFolder} onClickFile={onClickFile}
                    depth={depth + 1}
                  />
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── Pyramid tree — Desktop root ───────────────────────────────────────────────
function PyramidTree({ fs, cwd, onClickFolder, onClickFile, onClickRoot, isAr }) {
  const isRootCurrent = cwd.length === 0
  const sorted = [
    ...Object.entries(fs).filter(([, n]) => n.type === 'dir'),
    ...Object.entries(fs).filter(([, n]) => n.type === 'file'),
  ]
  const rootGap = LEVEL_GAP[0]

  return (
    <div className="flex justify-center overflow-x-auto py-2">
      <div className="flex flex-col items-center min-w-max">

        {/* Desktop root — apex of pyramid */}
        <div
          role="button" tabIndex={0} dir="ltr"
          onClick={onClickRoot}
          onKeyDown={e => e.key === 'Enter' && onClickRoot()}
          className={`
            px-4 py-2 rounded-2xl border-2 text-sm font-mono font-bold whitespace-nowrap
            cursor-pointer select-none transition-all shadow-md
            ${isRootCurrent
              ? 'bg-indigo-100 border-indigo-500 text-indigo-700 ring-2 ring-indigo-300 scale-105'
              : 'bg-indigo-100 border-indigo-500 text-indigo-700 shadow-md hover:bg-indigo-200'
            }
          `}
        >
          🖥️ Desktop{isRootCurrent ? '  ←' : '/'}
        </div>

        {sorted.length > 0 && (
          <>
            <div className={`w-px h-5 ${cwd.length > 0 ? 'bg-indigo-400' : 'bg-slate-300'}`} />
            <div className="relative flex items-start" style={{ gap: `${rootGap}px` }}>
              {sorted.length > 1 && (
                <div className="absolute left-0 right-0 top-0 h-px bg-slate-300 pointer-events-none" />
              )}
              {sorted.map(([name, node]) => {
                const childOnPath = cwd.length > 0 && cwd[0] === name
                return (
                  <div key={name} className="flex flex-col items-center">
                    <div className={`w-px h-5 ${childOnPath ? 'bg-indigo-400' : 'bg-slate-300'}`} />
                    <PyramidNode
                      name={name} node={node}
                      pathArr={[name]}
                      cwd={cwd} onClickFolder={onClickFolder} onClickFile={onClickFile}
                      depth={1}
                    />
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PageLinuxFS() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [fs, setFs]           = useState(INITIAL_FS)
  const [cwd, setCwd]         = useState([])             // [] = Desktop root
  const [lines, setLines]     = useState([
    { type: 'info', text: 'اكتب "help" لعرض الأوامر المتاحة' },
  ])
  const [input, setInput]       = useState('')
  const [history, setHistory]   = useState([])
  const [histIdx, setHistIdx]   = useState(-1)
  const [nanoOpen, setNanoOpen] = useState(false)
  const [nanoFile, setNanoFile] = useState(null)
  const [nanoContent, setNanoContent] = useState('')
  const [completedTasks, setCompletedTasks] = useState(new Set())

  const outputRef = useRef(null)
  const inputRef  = useRef(null)
  const TASKS = isAr ? TASKS_AR : TASKS_EN

  // Desktop/subdir path string
  const currentPath = cwd.length === 0 ? 'Desktop' : 'Desktop/' + cwd.join('/')
  const prompt = `abdullah@abdullah_pc:${currentPath}$ `

  // Scroll terminal output only (not the page)
  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight
  }, [lines])

  const push = useCallback((...newLines) => {
    setLines(prev => [
      ...prev,
      ...newLines.map(l => typeof l === 'string' ? { type: 'output', text: l } : l),
    ])
  }, [])

  const checkTask = useCallback(cmd => {
    TASKS.forEach(task => {
      if (!completedTasks.has(task.id) && task.check(cmd))
        setCompletedTasks(prev => new Set([...prev, task.id]))
    })
  }, [TASKS, completedTasks])

  const onClickFile = useCallback((pathArr, node) => {
    const fileName = pathArr[pathArr.length - 1]
    push({ type: 'prompt', text: prompt + 'nano ' + fileName })
    setNanoFile({ name: fileName, path: pathArr })
    setNanoContent(node?.content ?? '')
    setNanoOpen(true)
    checkTask('nano ' + fileName)
  }, [prompt, push, checkTask])

  const onClickFolder = useCallback((pathArr) => {
    const node = getNode(fs, pathArr)
    if (!node || node.type !== 'dir') return
    const promptNow = `abdullah@abdullah_pc:${currentPath}$ `
    // clicking the folder you are already inside → go up one level (collapse it)
    if (pathArr.join('/') === cwd.join('/')) {
      const next = cwd.slice(0, -1)
      const dest = next.length ? 'Desktop/' + next.join('/') : 'Desktop'
      push({ type: 'prompt', text: promptNow + 'enter parent' }, { type: 'success', text: '📁 ' + dest })
      setCwd(next)
      checkTask('enter parent')
      inputRef.current?.focus({ preventScroll: true })
      return
    }
    const dest  = 'Desktop/' + pathArr.join('/')
    const label = pathArr[pathArr.length - 1]
    push(
      { type: 'prompt',  text: promptNow + 'enter ' + label },
      { type: 'success', text: '📁 ' + dest },
    )
    setCwd(pathArr)
    checkTask('enter ' + label)
    inputRef.current?.focus({ preventScroll: true })
  }, [fs, cwd, currentPath, push, checkTask])

  const onClickRoot = useCallback(() => {
    const promptNow = `abdullah@abdullah_pc:${currentPath}$ `
    push(
      { type: 'prompt',  text: promptNow + 'enter Desktop' },
      { type: 'success', text: '📁 Desktop' },
    )
    setCwd([])
    checkTask('enter Desktop')
    inputRef.current?.focus({ preventScroll: true })
  }, [currentPath, push, checkTask])

  const runCommand = useCallback((raw) => {
    const trimmed = raw.trim()
    if (!trimmed) return
    push({ type: 'prompt', text: prompt + trimmed })
    setHistory(h => [trimmed, ...h.slice(0, 49)])
    checkTask(trimmed)

    const parts = trimmed.split(/\s+/)
    // Real Linux command aliases → the lesson's pedagogical commands
    const ALIAS = { ls: 'display', cd: 'enter', pwd: 'location' }
    let cmd     = parts[0].toLowerCase()
    let args    = parts.slice(1)
    if (ALIAS[cmd]) {
      // cd argument normalization:  cd ..  → parent,  cd / → Desktop (home)
      if (cmd === 'cd') {
        const t = args.find(a => !a.startsWith('-'))
        if (t === '..') args = ['parent']
        else if (t === '/') args = []
        else args = t ? [t] : []
      }
      // ls flags (-l, -a) are cosmetic here — display takes no arguments
      if (cmd === 'ls') args = []
      cmd = ALIAS[cmd]
    }
    const curNode  = getNode(fs, cwd)
    const children = curNode?.children || {}

    if (cmd === 'clear') { setLines([]); return }

    if (cmd === 'help') {
      push(
        { type: 'info',   text: '── الأوامر المتاحة ─────────────────────────' },
        { type: 'output', text: '  display          عرض الملفات والمجلدات في موقعك الحالي' },
        { type: 'output', text: '  enter <dir>      الانتقال إلى مجلد — مثال: enter Documents' },
        { type: 'output', text: '  enter parent     الرجوع للمجلد الأعلى' },
        { type: 'output', text: '  enter Desktop    الرجوع إلى Desktop (نقطة البداية)' },
        { type: 'output', text: '  location         عرض موقعك الحالي الكامل' },
        { type: 'output', text: '  tree             عرض هيكل المجلدات شجرياً' },
        { type: 'output', text: '  create <n>       إنشاء — بدون امتداد: مجلد ، مع امتداد (.txt): ملف' },
        { type: 'output', text: '  cat <file>       عرض محتوى ملف نصي' },
        { type: 'output', text: '  show <file>      نفس cat — اسم بديل أسهل' },
        { type: 'output', text: '  nano <file>      فتح محرر نصوص — Ctrl+S للحفظ، Ctrl+X للخروج' },
        { type: 'output', text: '  open <file>      نفس nano — فتح ملف في المحرر' },
        { type: 'output', text: '  rm <file>        حذف ملف نهائياً' },
        { type: 'output', text: '  delete <name>    حذف ملف أو مجلد' },
        { type: 'output', text: '  echo <text>      طباعة نص على الشاشة' },
        { type: 'output', text: '  clear            مسح الطرفية' },
        { type: 'output', text: '' },
      )
      return
    }

    if (cmd === 'location') {
      push({ type: 'output', text: currentPath })
      return
    }

    if (cmd === 'display') {
      const entries = Object.entries(children)
      if (!entries.length) { push({ type: 'output', text: isAr ? '(المجلد فارغ)' : '(empty directory)' }); return }
      const items = [
        ...entries.filter(([, n]) => n.type === 'dir').map(([name]) => ({ name, isDir: true })),
        ...entries.filter(([, n]) => n.type === 'file').map(([name]) => ({ name, isDir: false })),
      ]
      push({ type: 'ls', items })
      return
    }

    if (cmd === 'tree') {
      const treeLines = [{ text: currentPath, isDir: true }]
      const entries = Object.entries(children)
      entries.forEach(([name, node], i) => buildTreeLines(node, '', name, i === entries.length - 1, treeLines))
      push({ type: 'tree', lines: treeLines })
      return
    }

    if (cmd === 'enter') {
      if (!args[0] || args[0] === '~' || args[0] === 'Desktop') {
        setCwd([])
        push({ type: 'success', text: '📁 Desktop' })
        return
      }
      if (args[0] === 'parent') {
        if (!cwd.length) { push({ type: 'error', text: 'enter: أنت بالفعل في Desktop' }); return }
        const next = cwd.slice(0, -1)
        setCwd(next)
        push({ type: 'success', text: '📁 ' + (next.length === 0 ? 'Desktop' : 'Desktop/' + next.join('/')) })
        return
      }
      const target = children[args[0]]
      if (!target) { push({ type: 'error', text: `enter: ${args[0]}: لا يوجد مجلد بهذا الاسم` }); return }
      if (target.type !== 'dir') { push({ type: 'error', text: `enter: ${args[0]}: ليس مجلداً` }); return }
      const next = [...cwd, args[0]]
      setCwd(next)
      push({ type: 'success', text: '📁 Desktop/' + next.join('/') })
      return
    }

    if (cmd === 'mkdir') {
      if (!args[0]) { push({ type: 'error', text: 'mkdir: يجب تحديد اسم المجلد' }); return }
      const cname = args[0]
      if (children[cname]) { push({ type: 'error', text: `mkdir: ${cname}: موجود مسبقاً` }); return }
      setFs(f => setNode(f, cwd, cname, { type: 'dir', children: {} }))
      push({ type: 'success', text: `✅ تم إنشاء المجلد: ${cname}/` })
      return
    }

    if (cmd === 'touch') {
      if (!args[0]) { push({ type: 'error', text: 'touch: يجب تحديد اسم الملف' }); return }
      const cname = args[0]
      if (children[cname]) { push({ type: 'error', text: `touch: ${cname}: موجود مسبقاً` }); return }
      setFs(f => setNode(f, cwd, cname, { type: 'file', content: '' }))
      push({ type: 'success', text: `✅ تم إنشاء الملف: ${cname}` })
      return
    }

    if (cmd === 'create') {
      if (!args[0]) { push({ type: 'error', text: 'create: يجب تحديد اسم — بدون امتداد: مجلد، مع امتداد (.txt): ملف' }); return }
      const cname = args[0]
      if (children[cname]) { push({ type: 'error', text: `create: ${cname}: موجود مسبقاً` }); return }
      if (cname.includes('.')) {
        setFs(f => setNode(f, cwd, cname, { type: 'file', content: '' }))
        push({ type: 'success', text: `✅ تم إنشاء الملف: ${cname}` })
      } else {
        setFs(f => setNode(f, cwd, cname, { type: 'dir', children: {} }))
        push({ type: 'success', text: `✅ تم إنشاء المجلد: ${cname}/` })
      }
      return
    }

    if (cmd === 'rm') {
      const recursive = args.includes('-r') || args.includes('-rf')
      const target = args.find(a => !a.startsWith('-'))
      if (!target) { push({ type: 'error', text: 'rm: يجب تحديد اسم الملف' }); return }
      if (!children[target]) { push({ type: 'error', text: `rm: ${target}: لا يوجد` }); return }
      if (children[target].type === 'dir' && !recursive) {
        push({ type: 'error', text: `rm: ${target}: هو مجلد — استخدم rm -r` }); return
      }
      setFs(f => removeNode(f, cwd, target))
      push({ type: 'success', text: `🗑️ تم حذف: ${target}` })
      return
    }

    if (cmd === 'delete') {
      const target = args[0]
      if (!target) { push({ type: 'error', text: 'delete: يجب تحديد الاسم' }); return }
      if (!children[target]) { push({ type: 'error', text: `delete: ${target}: لا يوجد` }); return }
      setFs(f => removeNode(f, cwd, target))
      push({ type: 'success', text: `🗑️ تم الحذف: ${target}` })
      return
    }

    if (cmd === 'cat' || cmd === 'show') {
      if (!args[0]) { push({ type: 'error', text: `${cmd}: يجب تحديد اسم الملف` }); return }
      const node = children[args[0]]
      if (!node) { push({ type: 'error', text: `${cmd}: ${args[0]}: لا يوجد` }); return }
      if (node.type === 'dir') { push({ type: 'error', text: `${cmd}: ${args[0]}: هو مجلد` }); return }
      push({ type: 'output', text: node.content || '(ملف فارغ)' })
      return
    }

    if (cmd === 'echo') {
      const rest = trimmed.slice(5)
      const gt = rest.indexOf('>')
      if (gt !== -1) {
        const text = rest.slice(0, gt).trim().replace(/^["']|["']$/g, '')
        const file = rest.slice(gt + 1).trim()
        setFs(f => setNode(f, cwd, file, { type: 'file', content: text }))
        push({ type: 'success', text: `✅ كُتب في: ${file}` })
      } else {
        push({ type: 'output', text: rest.trim().replace(/^["']|["']$/g, '') })
      }
      return
    }

    if (cmd === 'nano' || cmd === 'open') {
      if (!args[0]) { push({ type: 'error', text: `${cmd}: يجب تحديد اسم الملف` }); return }
      const node = children[args[0]]
      if (node?.type === 'dir') { push({ type: 'error', text: `${cmd}: ${args[0]}: هو مجلد` }); return }
      setNanoFile({ name: args[0], path: [...cwd, args[0]] })
      setNanoContent(node?.content ?? '')
      setNanoOpen(true)
      return
    }

    push({ type: 'error', text: `${cmd}: أمر غير معروف. اكتب "help"` })
  }, [fs, cwd, currentPath, prompt, push, checkTask, isAr])

  const handleKeyDown = e => {
    if (e.key === 'Enter') { runCommand(input); setInput(''); setHistIdx(-1) }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHistIdx(i => { const n = Math.min(i + 1, history.length - 1); setInput(history[n] ?? ''); return n })
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHistIdx(i => { const n = Math.max(i - 1, -1); setInput(n === -1 ? '' : history[n]); return n })
    }
  }

  const handleNanoSave = text => {
    setFs(f => setNode(f, nanoFile.path.slice(0, -1), nanoFile.name, { type: 'file', content: text }))
    setNanoContent(text)
  }
  const handleNanoExit = text => {
    if (text !== nanoContent) setFs(f => setNode(f, nanoFile.path.slice(0, -1), nanoFile.name, { type: 'file', content: text }))
    setNanoOpen(false)
    push({ type: 'info', text: `nano: تم إغلاق الملف: ${nanoFile.name}` })
    inputRef.current?.focus({ preventScroll: true })
  }

  // Breadcrumb: Desktop / Documents / ...
  const crumbs = [
    { label: 'Desktop', path: [] },
    ...cwd.map((seg, i) => ({ label: seg, path: cwd.slice(0, i + 1) })),
  ]

  return (
    <div className="min-h-screen bg-slate-50" dir={isAr ? 'rtl' : 'ltr'}>
      {nanoOpen && (
        <NanoEditor filename={nanoFile.name} content={nanoContent}
          onSave={handleNanoSave} onExit={handleNanoExit} />
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {isAr ? 'درس تفاعلي' : 'Interactive Lesson'}
            </span>
            <h1 className="text-3xl font-black text-slate-800 mt-2 mb-1">
              {isAr ? 'نظام الملفات' : 'File System'}
            </h1>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 mb-5 flex items-center gap-1 overflow-x-auto" dir="ltr">
          <span className="text-xs text-slate-400 font-medium mr-2 flex-shrink-0">
            {isAr ? 'موقعك:' : 'Location:'}
          </span>
          {crumbs.map((seg, i) => (
            <span key={i} className="flex items-center gap-1 flex-shrink-0">
              {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
              <button
                onClick={() => {
                  const dest = seg.path.length === 0 ? 'Desktop' : 'Desktop/' + seg.path.join('/')
                  push(
                    { type: 'prompt', text: `abdullah@abdullah_pc:${currentPath}$ cd /` },
                    { type: 'success', text: '📁 ' + dest },
                  )
                  setCwd(seg.path)
                }}
                className={`font-mono text-xs px-1.5 py-0.5 rounded transition-colors ${
                  i === crumbs.length - 1
                    ? 'bg-indigo-100 text-indigo-700 font-bold'
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {seg.label}
              </button>
            </span>
          ))}
        </div>

        {/* Pyramid tree — full width */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-5">
          <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-slate-400 text-xs font-mono">
              {isAr ? 'هيكل الملفات — منظر هرمي' : 'File Hierarchy — Pyramid View'}
            </span>
          </div>
          {/* Pyramid background — subtle gradient to hint at triangle shape */}
          <div className="px-4 py-6" style={{
            background: 'linear-gradient(to bottom, #f8fafc 0%, #eef2ff 60%, #e0e7ff 100%)'
          }}>
            <PyramidTree
              fs={fs} cwd={cwd}
              onClickFolder={onClickFolder}
              onClickFile={onClickFile}
              onClickRoot={onClickRoot}
              isAr={isAr}
            />
          </div>
          <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400 text-center" dir={isAr ? 'rtl' : 'ltr'}>
              {isAr
                ? '🖥️ يظهر المستوى الأول فقط — انقر مجلداً (▸) لفتحه وإظهار ما بداخله، وانقر المجلد المفتوح (▾) للرجوع • انقر ملفاً لفتحه'
                : '🖥️ Only the first level shows — click a folder (▸) to open it and reveal its contents, click the open folder (▾) to go back • click a file to open it'}
            </p>
          </div>
        </div>

        {/* Main grid: tasks + terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">

          {/* Left: tasks */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <span>🎯</span>
                {isAr ? 'المهام التدريبية' : 'Practice Tasks'}
                <span className="text-xs text-slate-400 font-normal mr-auto">
                  {completedTasks.size}/{TASKS.length}
                </span>
              </h3>
              {completedTasks.size === TASKS.length && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 mb-3 text-center text-xs text-emerald-700 font-bold">
                  🎉 {isAr ? 'أحسنت! أكملت جميع المهام' : 'Well done! All tasks complete'}
                </div>
              )}
              <div className="space-y-1.5">
                {TASKS.map((task, i) => {
                  const done = completedTasks.has(task.id)
                  return (
                    <div key={task.id} className={`rounded-xl p-2.5 border text-xs transition-all ${
                      done ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 mt-0.5">{done ? '✅' : `${i + 1}.`}</span>
                        <div>
                          <p className="leading-snug">{task.desc}</p>
                          {!done && <code className="text-xs text-slate-400 mt-0.5 block font-mono" dir="ltr">{task.hint}</code>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: terminal */}
          <div className="lg:col-span-8">
            <div
              className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl flex flex-col cursor-text"
              style={{ height: '560px' }}
              onClick={() => inputRef.current?.focus({ preventScroll: true })}
              dir="ltr"
            >
              <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-slate-400 text-xs font-mono">abdullah@abdullah_pc: {currentPath}</span>
              </div>
              <div ref={outputRef} className="flex-1 overflow-y-auto p-4 space-y-0.5">
                {lines.map((line, i) => <TermLine key={i} line={line} />)}
              </div>
              <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-800 flex-shrink-0">
                <span className="text-green-400 font-mono text-sm whitespace-nowrap flex-shrink-0">{prompt}</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-slate-100 font-mono text-sm outline-none caret-green-400"
                  autoFocus autoComplete="off" autoCorrect="off" spellCheck={false} dir="ltr"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              {isAr
                ? 'اضغط على الطرفية وابدأ الكتابة • السهم ↑↓ لتصفح السجل • الشجرة تتحدث تلقائياً'
                : 'Click terminal and type • ↑↓ for history • tree updates automatically'}
            </p>
          </div>
        </div>

        {/* explanation — collapsed by default, sits under the practical part */}
        <Explanation>
          <p className="text-slate-500 text-sm leading-relaxed mb-5">
            {isAr
              ? 'تعلّم كيف يُنظَّم نظام الملفات — يظهر المستوى الأول فقط، وكلما فتحت مجلداً ظهر ما بداخله من ملفات ومجلدات، مستوى تلو الآخر.'
              : 'Learn how the file system is organized — only the first level shows; open a folder to reveal the files and folders inside it, one level at a time.'}
          </p>

        {/* Educational sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5">
            <h3 className="font-black text-indigo-800 text-base mb-3">
              🗂️ {isAr ? 'ماذا يوجد في كل مجلد؟' : 'What is in each folder?'}
            </h3>
            <div className="space-y-2">
              {[
                { dir: 'Desktop',             ar: 'نقطة البداية — يظهر أولاً المستوى الأول فقط', en: 'Starting point — only the first level shows at first' },
                { dir: 'Documents/projects',  ar: 'مشاريعك — بداخله website و game (مجلدات فرعية)', en: 'Your projects — contains website and game subfolders' },
                { dir: 'Documents/projects/website/img', ar: 'مثال على تعشيش عميق: مجلد داخل مجلد داخل مجلد', en: 'Deep nesting: a folder inside a folder inside a folder' },
                { dir: 'Pictures/vacation',   ar: 'مجلد صور فرعي بداخله صور الإجازة', en: 'A pictures subfolder holding vacation photos' },
              ].map(({ dir, ar, en }) => (
                <div key={dir} className="flex gap-3 items-start">
                  <code className="text-indigo-600 font-bold font-mono text-xs bg-indigo-100 px-2 py-0.5 rounded flex-shrink-0 mt-0.5 break-all" dir="ltr">{dir}</code>
                  <span className="text-indigo-900 text-xs leading-relaxed">{isAr ? ar : en}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
            <h3 className="font-black text-amber-800 text-base mb-3">
              📁 vs 📄 {isAr ? 'مجلد أم ملف؟' : 'Folder or File?'}
            </h3>
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-3 border border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📁</span>
                  <span className="font-bold text-amber-800 text-sm">{isAr ? 'المجلد (Directory / Folder)' : 'Folder (Directory / Folder)'}</span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  {isAr
                    ? 'صندوق يحتوي على ملفات أو مجلدات أخرى. المجلد يُستخدم لتنظيم ملفاتنا في الجهاز — مثلاً يمكن أن يكون لكل فرد في العائلة مجلد خاص به يحتوي على ملفاته فقط.'
                    : 'A box that holds files or other folders. Folders are used to organize our files on the device — for example, each family member can have their own folder containing only their files.'}
                </p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📄</span>
                  <span className="font-bold text-amber-800 text-sm">{isAr ? 'الملف (File)' : 'File'}</span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  {isAr
                    ? 'يحتوي على بيانات فعلية — نص، صورة، كود، إلخ. لا يمكنه احتواء ملفات أخرى.'
                    : 'Contains actual data — text, images, code, etc. Cannot contain other files.'}
                </p>
                <div className="mt-2 pt-2 border-t border-amber-100">
                  <p className="text-xs text-amber-800 font-semibold mb-1">
                    {isAr ? '🔍 كيف تعرف نوع الملف؟ من الامتداد!' : '🔍 How to tell file type? By its extension!'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { ext: '.txt',  label: isAr ? 'نص' : 'text' },
                      { ext: '.jpg',  label: isAr ? 'صورة' : 'image' },
                      { ext: '.pdf',  label: isAr ? 'وثيقة' : 'document' },
                      { ext: '.mp3',  label: isAr ? 'صوت' : 'audio' },
                      { ext: '.mp4',  label: isAr ? 'فيديو' : 'video' },
                      { ext: '.py',   label: isAr ? 'بايثون' : 'Python' },
                      { ext: '.html', label: isAr ? 'ويب' : 'web' },
                      { ext: '.zip',  label: isAr ? 'مضغوط' : 'archive' },
                    ].map(({ ext, label }) => (
                      <span key={ext} className="bg-amber-100 text-amber-800 font-mono text-xs px-1.5 py-0.5 rounded" dir="ltr">
                        {ext} <span className="text-amber-600 font-sans font-normal">({label})</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Path syntax */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-6">
          <h3 className="font-black text-white text-base mb-3">
            🛣️ {isAr ? 'كيف تُقرأ المسارات؟' : 'How to Read Paths?'}
          </h3>
          <div className="font-mono text-sm bg-slate-900 rounded-xl p-4 mb-3 overflow-x-auto" dir="ltr">
            <div className="text-slate-500 text-xs mb-1"># {isAr ? 'مثال على مسار كامل:' : 'Example of a full path:'}</div>
            <div className="text-amber-300 text-base mb-3">Desktop/Documents/notes.txt</div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
              {[
                ['Desktop', isAr ? 'نقطة البداية' : 'starting point'],
                ['Documents/', isAr ? 'مجلد Documents' : 'Documents folder'],
                ['notes.txt', isAr ? 'الملف النهائي' : 'the file'],
              ].map(([seg, desc]) => (
                <div key={seg}>
                  <span className="text-slate-500">{seg} </span>
                  <span className={`text-slate-300 ${seg === 'notes.txt' ? 'text-emerald-400' : ''}`}>→ {desc}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            {isAr
              ? 'القراءة من اليسار إلى اليمين: تبدأ من Desktop ثم تتنقل عبر كل مجلد حتى تصل للملف. الفاصل / يفصل بين مجلد وآخر.'
              : 'Read left to right: start from Desktop then move through each folder until you reach the file. Each / separates one folder from the next.'}
          </p>
        </div>
        </Explanation>

      </div>
    </div>
  )
}
