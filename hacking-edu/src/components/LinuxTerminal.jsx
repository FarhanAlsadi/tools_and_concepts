import { useState, useRef, useEffect } from 'react'
import { baseFs, resolvePath, getNode, pathStr, displayPath, dir, file, HOME, USER, HOST } from '../lib/linuxLab'

/* A reusable REAL-command Linux terminal: ls, cd, pwd, mkdir, touch, rm, cat,
   nano, echo (with >/>>), tree, mv, cp, whoami, id, uname, clear, help — plus
   pluggable tools (gobuster, hydra) supplied via `extraCommands`.            */

const LINE_STYLE = {
  cmd:  { color:'#e2e8f0' },
  out:  { color:'#86efac' },
  ok:   { color:'#4ade80', fontWeight:700 },
  warn: { color:'#fbbf24' },
  info: { color:'#7dd3fc' },
  err:  { color:'#f87171' },
  dim:  { color:'#64748b' },
}

const tokenize = s => (s.match(/"[^"]*"|'[^']*'|\S+/g) || []).map(t => t.replace(/^["']|["']$/g, ''))

// CamelCode command aliases → the real Linux command they map to (BOTH work)
const ALIASES = { display:'ls', enter:'cd', location:'pwd', show:'cat', open:'nano' }
// what each pluggable tool DOES — shown in `help` (its purpose, never the syntax)
const TOOL_DESC = {
  gobuster: { ar:'يكتشف صفحات الموقع ومجلداته المخفية', en:'Discovers a site’s hidden pages and folders' },
  hydra:    { ar:'يكسر كلمة مرور تسجيل الدخول بتجربة كلمات مرور كثيرة', en:'Cracks a login password by trying many passwords' },
  barq:     { ar:'أداة كامل كود لكسر كلمات المرور بتجربة قائمة كلمات', en:'CamelCode tool that cracks passwords using a wordlist' },
  kashif:   { ar:'يكشف الصفحات المخفية في الموقع', en:'Reveals a site’s hidden pages' },
}
// every command shown in `help`, each on its own line with an Arabic + English description
const HELP_ROWS = [
  ['ls',    'display',  'يعرض الملفات والمجلدات في مكانك الحالي',   'List the files and folders where you are'],
  ['cd',    'enter',    'ينقلك إلى مجلد آخر (cd .. للرجوع للخلف)',   'Move into another folder (cd .. to go back)'],
  ['pwd',   'location', 'يعرض مسار مكانك الحالي',                    'Show your current path'],
  ['cat',   'show',     'يعرض محتوى ملف نصّي',                       'Print a text file’s contents'],
  ['nano',  'open',     'يفتح ملفاً في محرّر النصوص',                'Open a file in the text editor'],
  ['tree',  '',         'يعرض شجرة الملفات والمجلدات',               'Show the files/folders as a tree'],
  ['touch', '',         'ينشئ ملفاً فارغاً جديداً',                  'Create a new empty file'],
  ['mkdir', '',         'ينشئ مجلداً جديداً',                        'Create a new folder'],
  ['rm',    '',         'يحذف ملفاً (rm -r لحذف مجلد)',              'Delete a file (rm -r for a folder)'],
  ['create','',         'ينشئ ملفاً (إن كان فيه نقطة) أو مجلداً',    'Create a file (if it has a dot) or a folder'],
  ['delete','',         'يحذف ملفاً أو مجلداً',                      'Delete a file or a folder'],
  ['cp',    '',         'ينسخ ملفاً أو مجلداً',                      'Copy a file or folder'],
  ['mv',    '',         'ينقل ملفاً أو يعيد تسميته',                 'Move or rename a file'],
  ['echo',  '',         'يطبع نصاً (أو يكتبه في ملف بـ >)',          'Print text (or write it to a file with >)'],
  ['head',  '',         'يعرض أوّل أسطر ملف',                        'Show the first lines of a file'],
  ['tail',  '',         'يعرض آخر أسطر ملف',                         'Show the last lines of a file'],
  ['wc',    '',         'يعدّ أسطر وكلمات ملف',                      'Count a file’s lines and words'],
  ['whoami','',         'يعرض اسم المستخدم الحالي',                  'Show the current username'],
  ['clear', '',         'يمسح شاشة الطرفية',                         'Clear the terminal screen'],
  ['help',  '',         'يعرض هذه القائمة',                          'Show this list'],
]
// built-in commands eligible for Tab-completion (aliases + tools are added at runtime)
const BUILTIN_CMDS = ['cat', 'cd', 'clear', 'cp', 'create', 'delete', 'echo', 'head', 'help', 'hostname', 'id', 'ls', 'mkdir', 'mv', 'nano', 'pwd', 'rm', 'tail', 'touch', 'tree', 'uname', 'wc', 'whoami']
const commonPrefix = arr => { if (!arr.length) return ''; let p = arr[0]; for (const s of arr) while (!s.startsWith(p)) p = p.slice(0, -1); return p }

function Nano({ path, content, onSave, onExit, isAr }) {
  const [text, setText] = useState(content)
  const ref = useRef(null)
  useEffect(() => { ref.current && ref.current.focus() }, [])
  const onKey = e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); onSave(text) }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') { e.preventDefault(); onExit() }
  }
  return (
    <div style={{ position:'absolute', inset:0, background:'#0b1020', display:'flex', flexDirection:'column', zIndex:20 }} dir="ltr">
      <div style={{ background:'#111827', color:'#e2e8f0', fontFamily:'monospace', fontSize:11, padding:'4px 10px' }}>GNU nano — {path}</div>
      <textarea ref={ref} value={text} onChange={e => setText(e.target.value)} onKeyDown={onKey} spellCheck={false}
        style={{ flex:1, background:'#0b1020', color:'#e2e8f0', border:'none', outline:'none', resize:'none', fontFamily:'monospace', fontSize:12, padding:'8px 10px', lineHeight:1.6 }} />
      <div style={{ background:'#111827', color:'#94a3b8', fontFamily:'monospace', fontSize:10.5, padding:'4px 10px', display:'flex', gap:16 }}>
        <span><b style={{ color:'#e2e8f0' }}>^S</b> {isAr ? 'حفظ' : 'Save'}</span>
        <span><b style={{ color:'#e2e8f0' }}>^X</b> {isAr ? 'خروج' : 'Exit'}</span>
      </div>
    </div>
  )
}

export default function LinuxTerminal({
  fsRef: extFsRef, initialFs, welcome = [], extraCommands = {}, onCommand, onCwd,
  height = 300, isAr = false, prompt = '$', maxLines = 0,
}) {
  const internal = useRef(null)
  const fsRef = extFsRef || internal
  if (!fsRef.current) fsRef.current = typeof initialFs === 'function' ? initialFs() : (initialFs || baseFs())

  const [lines, setLines] = useState(welcome)
  const [input, setInput] = useState('')
  const [cwd, setCwd] = useState(HOME.split('/').filter(Boolean))
  const [nano, setNano] = useState(null)
  const [busy, setBusy] = useState(false)
  const [capPrompt, setCapPrompt] = useState(null)   // interactive-capture prompt (null = off)
  const captureRef = useRef(null)                     // { onLine } while capturing input
  const [, force] = useState(0)
  const hist = useRef([]); const hi = useRef(-1); const prev = useRef(null)
  const timers = useRef([]); const boxRef = useRef(null); const inRef = useRef(null)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight }, [lines])
  useEffect(() => { onCwd && onCwd(cwd) }, [cwd]) // eslint-disable-line

  // cap scrollback (opt-in via maxLines) so tools that stream tens of thousands
  // of lines scroll old lines off instead of piling up unbounded DOM nodes
  const cap = arr => (maxLines && arr.length > maxLines ? arr.slice(arr.length - maxLines) : arr)
  const print = l => setLines(p => cap([...p, l]))
  const printAll = arr => setLines(p => cap([...p, ...arr]))
  const replaceLast = l => setLines(p => (p.length ? [...p.slice(0, -1), l] : [l]))
  const bumpFs = () => force(x => x + 1)
  const promptStr = () => `${USER}@${HOST}:${displayPath(cwd)}${prompt} `

  const schedule = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t }
  const stream = (arr, interval, done) => {
    if (!arr.length) { done && done(); return }
    setBusy(true)
    arr.forEach((l, i) => schedule(() => { print(l); if (i === arr.length - 1) { setBusy(false); done && done() } }, interval * (i + 1)))
  }

  const nodeAt = segs => getNode(fsRef.current, segs)
  const parentOf = segs => ({ parent: nodeAt(segs.slice(0, -1)), name: segs[segs.length - 1] })
  const readFile = path => { const n = nodeAt(resolvePath(cwd, path)); return n && n.type === 'file' ? n.content : null }
  const writeFile = (path, content) => {
    const segs = resolvePath(cwd, path); const { parent, name } = parentOf(segs)
    if (!parent || parent.type !== 'dir') return false
    parent.children[name] = file(content); bumpFs(); return true
  }
  // interactive capture: route the next Enter(s) to a handler instead of exec
  const startCapture = onLine => { captureRef.current = { onLine } }
  const capturePrompt = text => setCapPrompt(text)
  const endCapture = () => { captureRef.current = null; setCapPrompt(null) }

  const lsFormat = (node, long, all) => {
    let names = Object.keys(node.children)
    if (!all) names = names.filter(n => !n.startsWith('.'))
    names.sort()
    if (all) names = ['.', '..', ...names]
    if (!long) return [{ k:'out', v: names.map(n => (node.children[n] && node.children[n].type === 'dir') || n === '.' || n === '..' ? n + '/' : n).join('   ') || ' ' }]
    return names.map(n => {
      const c = n === '.' || n === '..' ? { type:'dir' } : node.children[n]
      const d = c.type === 'dir'
      const size = c.type === 'file' ? String(c.content.length).padStart(5) : '4096'
      return { k:'out', v: `${d ? 'drwxr-xr-x' : '-rw-r--r--'} 1 ${USER} ${USER} ${String(size).padStart(6)} Jun 12 09:00 ${d && n !== '.' && n !== '..' ? n + '/' : n}` }
    })
  }

  const exec = raw => {
    const cmdText = raw
    printAll([{ k:'cmd', v: promptStr() + cmdText }])
    const t = raw.trim()
    if (!t) return
    hist.current.push(t); hi.current = -1
    const argv = tokenize(t)
    // resolve CamelCode aliases → real commands (display=ls, show=cat, open=nano, enter=cd, location=pwd)
    if (ALIASES[argv[0]]) argv[0] = ALIASES[argv[0]]
    for (let i = 1; i < argv.length; i++) if (argv[i] === 'parent') argv[i] = '..'
    const cmd = argv[0]

    // echo redirection
    let redirect = null
    const gt = argv.indexOf('>'); const gg = argv.indexOf('>>')
    if (cmd === 'echo' && (gt > -1 || gg > -1)) {
      const app = gg > -1; const idx = app ? gg : gt
      redirect = { append: app, path: argv[idx + 1] }
      argv.splice(idx)
    }

    const err = m => print({ k:'err', v: m })
    const out = m => print({ k:'out', v: m })

    switch (cmd) {
      case 'pwd': out(pathStr(cwd)); break
      case 'whoami': out(USER); break
      case 'id': out(`uid=1000(${USER}) gid=1000(${USER}) groups=1000(${USER})`); break
      case 'uname': out(argv.includes('-a') ? 'Linux camelcode 6.1.0-kali lab x86_64 GNU/Linux' : 'Linux'); break
      case 'hostname': out(HOST); break
      case 'clear': setLines([]); break
      case 'help': {
        const label = (c, a) => (a ? `${c} / ${a}` : c)
        const names = HELP_ROWS.map(r => label(r[0], r[1])).concat(Object.keys(extraCommands))
        const w = Math.max(...names.map(n => n.length)) + 3
        printAll([
          { k:'info', v: isAr ? '── الأوامر ──' : '── commands ──' },
          ...HELP_ROWS.map(([c, a, ar, en]) => ({ k:'dim', v: label(c, a).padEnd(w) + (isAr ? ar : en) })),
          ...(Object.keys(extraCommands).length ? [
            { k:'info', v: isAr ? '── الأدوات ──' : '── tools ──' },
            ...Object.keys(extraCommands).map(tool => {
              const d = TOOL_DESC[tool]
              return { k:'dim', v: tool.padEnd(w) + (d ? (isAr ? d.ar : d.en) : (isAr ? 'أداة اختراق' : 'a hacking tool')) }
            }),
          ] : []),
        ]); break
      }
      case 'ls': {
        const target = argv.find((a, i) => i > 0 && !a.startsWith('-')) || '.'
        const node = nodeAt(resolvePath(cwd, target))
        if (!node) { err(`ls: cannot access '${target}': No such file or directory`); break }
        if (node.type === 'file') { out(target); break }
        printAll(lsFormat(node, argv.includes('-l') || argv.includes('-la') || argv.includes('-al'), argv.includes('-a') || argv.includes('-la') || argv.includes('-al')))
        break
      }
      case 'cd': {
        const target = argv[1]
        if (!target || target === '~') { prev.current = cwd; setCwd(HOME.split('/').filter(Boolean)); break }
        if (target === '-') { if (prev.current) { const p = cwd; setCwd(prev.current); prev.current = p }; break }
        const segs = resolvePath(cwd, target); const node = nodeAt(segs)
        if (!node) err(`cd: no such file or directory: ${target}`)
        else if (node.type !== 'dir') err(`cd: not a directory: ${target}`)
        else { prev.current = cwd; setCwd(segs) }
        break
      }
      case 'mkdir': {
        const names = argv.slice(1).filter(a => !a.startsWith('-')); const p = argv.includes('-p')
        if (!names.length) { err('mkdir: missing operand'); break }
        names.forEach(nm => {
          const segs = resolvePath(cwd, nm); const { parent, name } = parentOf(segs)
          if (!parent && p) { /* -p would create parents; keep simple */ }
          if (!parent || parent.type !== 'dir') return err(`mkdir: cannot create directory '${nm}': No such file or directory`)
          if (parent.children[name] && !p) return err(`mkdir: cannot create directory '${nm}': File exists`)
          if (!parent.children[name]) parent.children[name] = dir({})
        })
        bumpFs(); break
      }
      case 'touch': {
        argv.slice(1).forEach(nm => {
          const segs = resolvePath(cwd, nm); const { parent, name } = parentOf(segs)
          if (!parent || parent.type !== 'dir') return err(`touch: cannot touch '${nm}': No such file or directory`)
          if (!parent.children[name]) parent.children[name] = file('')
        })
        bumpFs(); break
      }
      case 'rm': {
        const names = argv.slice(1).filter(a => !a.startsWith('-')); const rec = argv.includes('-r') || argv.includes('-rf') || argv.includes('-fr')
        names.forEach(nm => {
          const segs = resolvePath(cwd, nm); const { parent, name } = parentOf(segs); const node = parent && parent.children[name]
          if (!node) return err(`rm: cannot remove '${nm}': No such file or directory`)
          if (node.type === 'dir' && !rec) return err(`rm: cannot remove '${nm}': Is a directory`)
          delete parent.children[name]
        })
        bumpFs(); break
      }
      case 'create': {   // CamelCode: create a file (name has a dot) or a folder (no dot)
        const nm = argv[1]
        if (!nm) { err('create: missing name'); break }
        const segs = resolvePath(cwd, nm); const { parent, name } = parentOf(segs)
        if (!parent || parent.type !== 'dir') { err(`create: cannot create '${nm}': No such file or directory`); break }
        if (parent.children[name]) { err(`create: '${nm}': already exists`); break }
        parent.children[name] = nm.includes('.') ? file('') : dir({})
        bumpFs(); break
      }
      case 'delete': {   // CamelCode: delete a file or a folder (no -r needed)
        const nm = argv[1]
        if (!nm) { err('delete: missing name'); break }
        const segs = resolvePath(cwd, nm); const { parent, name } = parentOf(segs)
        if (!parent || !parent.children[name]) { err(`delete: cannot remove '${nm}': No such file or directory`); break }
        delete parent.children[name]; bumpFs(); break
      }
      case 'cat': {
        argv.slice(1).forEach(nm => {
          const node = nodeAt(resolvePath(cwd, nm))
          if (!node) err(`cat: ${nm}: No such file or directory`)
          else if (node.type === 'dir') err(`cat: ${nm}: Is a directory`)
          else node.content.split('\n').forEach((l, i, a) => { if (!(i === a.length - 1 && l === '')) out(l) })
        })
        break
      }
      case 'head':
      case 'tail': {
        let n = 10; const ni = argv.indexOf('-n'); if (ni > -1) n = parseInt(argv[ni + 1]) || 10
        const nm = argv.slice(1).find(a => !a.startsWith('-') && isNaN(parseInt(a)))
        const node = nm && nodeAt(resolvePath(cwd, nm))
        if (!nm) { err(`${cmd}: missing file operand`); break }
        if (!node || node.type !== 'file') { err(`${cmd}: cannot open '${nm}' for reading`); break }
        const arr = node.content.split('\n'); if (arr.length && arr[arr.length - 1] === '') arr.pop()
        printAll((cmd === 'head' ? arr.slice(0, n) : arr.slice(-n)).map(v => ({ k:'out', v })))
        break
      }
      case 'wc': {
        const lonly = argv.includes('-l')
        const nm = argv.slice(1).find(a => !a.startsWith('-'))
        const node = nm && nodeAt(resolvePath(cwd, nm))
        if (!node || node.type !== 'file') { err(`wc: ${nm}: No such file or directory`); break }
        const arr = node.content.split('\n'); if (arr.length && arr[arr.length - 1] === '') arr.pop()
        out(lonly ? `${arr.length} ${nm}` : `${arr.length} ${node.content.split(/\s+/).filter(Boolean).length} ${node.content.length} ${nm}`)
        break
      }
      case 'nano': {
        const nm = argv[1]; if (!nm) { err('nano: missing filename'); break }
        const segs = resolvePath(cwd, nm); const node = nodeAt(segs)
        if (node && node.type === 'dir') { err(`nano: ${nm}: Is a directory`); break }
        setNano({ path: pathStr(segs), segs, content: node ? node.content : '' })
        break
      }
      case 'echo': {
        const text = argv.slice(1).join(' ')
        if (redirect && redirect.path) {
          const segs = resolvePath(cwd, redirect.path); const { parent, name } = parentOf(segs)
          if (!parent || parent.type !== 'dir') { err(`bash: ${redirect.path}: No such file or directory`); break }
          const existing = parent.children[name]
          const val = (redirect.append && existing && existing.type === 'file' ? existing.content : '') + text + '\n'
          parent.children[name] = file(val); bumpFs()
        } else out(text)
        break
      }
      case 'tree': {
        const root = nodeAt(resolvePath(cwd, argv[1] || '.'))
        if (!root || root.type !== 'dir') { err('tree: not a directory'); break }
        const acc = ['.']
        const walk = (node, pre) => {
          const keys = Object.keys(node.children).filter(k => !k.startsWith('.')).sort()
          keys.forEach((k, i) => {
            const last = i === keys.length - 1
            acc.push(`${pre}${last ? '└── ' : '├── '}${k}${node.children[k].type === 'dir' ? '/' : ''}`)
            if (node.children[k].type === 'dir') walk(node.children[k], pre + (last ? '    ' : '│   '))
          })
        }
        walk(root, ''); printAll(acc.map(v => ({ k:'out', v }))); break
      }
      case 'mv':
      case 'cp': {
        const src = argv[1], dst = argv[2]
        if (!src || !dst) { err(`${cmd}: missing operand`); break }
        const sSegs = resolvePath(cwd, src); const sn = nodeAt(sSegs)
        if (!sn) { err(`${cmd}: cannot stat '${src}': No such file or directory`); break }
        const dSegs = resolvePath(cwd, dst); let dParent = nodeAt(dSegs); let dName
        if (dParent && dParent.type === 'dir') { dName = sSegs[sSegs.length - 1] } else { const p = parentOf(dSegs); dParent = p.parent; dName = p.name }
        if (!dParent || dParent.type !== 'dir') { err(`${cmd}: target is not a directory`); break }
        const clone = n => n.type === 'file' ? file(n.content) : dir(Object.fromEntries(Object.entries(n.children).map(([k, v]) => [k, clone(v)])))
        dParent.children[dName] = clone(sn)
        if (cmd === 'mv') { const { parent, name } = parentOf(sSegs); delete parent.children[name] }
        bumpFs(); break
      }
      default:
        if (extraCommands[cmd]) {
          extraCommands[cmd]({ argv, raw: t, cwd, fs: fsRef.current, print, printAll, replaceLast, stream, setBusy, schedule, readFile, writeFile,
            startCapture, capturePrompt, endCapture, clear: () => setLines([]),
            resolve: p => resolvePath(cwd, p), getNode: segs => nodeAt(segs), isAr })
        } else {
          err(`${cmd}: command not found`)
        }
    }
    onCommand && onCommand(cmd, argv, cwd)
  }

  // Tab completion: first word → commands; later words → files/dirs in the target directory
  const complete = () => {
    if (busy) return
    const val = input
    const endsWithSpace = /\s$/.test(val)
    const tokens = val.split(/\s+/).filter(Boolean)
    const frag = endsWithSpace ? '' : (tokens[tokens.length - 1] || '')
    const prefixTokens = endsWithSpace ? tokens : tokens.slice(0, -1)
    const isFirst = prefixTokens.length === 0
    let names = []
    const suffix = {}
    if (isFirst) {
      const cmds = [...new Set([...BUILTIN_CMDS, ...Object.keys(ALIASES), ...Object.keys(extraCommands)])].sort()
      names = cmds.filter(c => c.startsWith(frag))
      names.forEach(n => { suffix[n] = ' ' })
    } else {
      const slash = frag.lastIndexOf('/')
      const dirPart = slash >= 0 ? frag.slice(0, slash + 1) : ''
      const base = slash >= 0 ? frag.slice(slash + 1) : frag
      const dirNode = nodeAt(resolvePath(cwd, dirPart || '.'))
      if (dirNode && dirNode.type === 'dir') {
        const kids = Object.keys(dirNode.children)
          .filter(n => base.startsWith('.') || !n.startsWith('.'))
          .filter(n => n.startsWith(base)).sort()
        names = kids.map(n => dirPart + n)
        kids.forEach(n => { suffix[dirPart + n] = dirNode.children[n].type === 'dir' ? '/' : ' ' })
      }
    }
    if (!names.length) return
    const apply = completed => setInput([...prefixTokens, completed].join(' '))
    if (names.length === 1) { apply(names[0] + suffix[names[0]]); return }
    const cp = commonPrefix(names)
    if (cp.length > frag.length) apply(cp)
    else printAll([{ k:'cmd', v: promptStr() + val }, { k:'out', v: names.map(n => n.split('/').pop() + (suffix[n] === '/' ? '/' : '')).join('   ') }])
  }

  const onKey = e => {
    if (e.key === 'Enter') {
      if (busy) return
      const v = input; setInput('')
      if (captureRef.current) { printAll([{ k:'cmd', v: (capPrompt || '') + v }]); captureRef.current.onLine(v) }
      else exec(v)
    }
    else if (e.key === 'Tab') { e.preventDefault(); complete() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); const h = hist.current; if (!h.length) return; hi.current = hi.current < 0 ? h.length - 1 : Math.max(0, hi.current - 1); setInput(h[hi.current]) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); const h = hist.current; if (hi.current < 0) return; hi.current++; if (hi.current >= h.length) { hi.current = -1; setInput('') } else setInput(h[hi.current]) }
  }

  const saveNano = text => {
    const { parent, name } = parentOf(nano.segs)
    if (parent && parent.type === 'dir') { parent.children[name] = file(text); bumpFs() }
    setNano(null); print({ k:'dim', v: `[ saved ${nano.path} ]` })
    onCommand && onCommand('nano:save', ['nano', nano.path], cwd)
  }

  return (
    <div style={{ position:'relative', borderRadius:'11px', overflow:'hidden', border:'1px solid #1e293b' }}>
      <div style={{ background:'#1e293b', padding:'6px 12px', display:'flex', alignItems:'center', gap:6 }} dir="ltr">
        <span style={{ width:10, height:10, borderRadius:'50%', background:'#ef4444' }} />
        <span style={{ width:10, height:10, borderRadius:'50%', background:'#f59e0b' }} />
        <span style={{ width:10, height:10, borderRadius:'50%', background:'#22c55e' }} />
        <span style={{ fontFamily:'monospace', fontSize:11, color:'#94a3b8', marginLeft:8 }}>{USER}@{HOST}: {displayPath(cwd)}</span>
      </div>
      <div ref={boxRef} onClick={() => inRef.current && inRef.current.focus()} dir="ltr"
        style={{ background:'#0b1020', padding:'10px 12px', height, overflowY:'auto', fontFamily:'monospace', fontSize:12 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ ...(LINE_STYLE[l.k] || LINE_STYLE.out), lineHeight:1.65, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{l.v || ' '}</div>
        ))}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ color: capPrompt != null ? '#67e8f9' : '#4ade80', whiteSpace:'nowrap' }}>{capPrompt != null ? capPrompt : `${USER}@${HOST}:${displayPath(cwd)}${prompt}`}</span>
          <input ref={inRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} disabled={busy}
            spellCheck={false} autoCapitalize="off" autoComplete="off"
            placeholder={busy ? '…' : ''} style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#e2e8f0', fontFamily:'monospace', fontSize:12 }} />
        </div>
      </div>
      {nano && <Nano path={nano.path} content={nano.content} onSave={saveNano} onExit={() => setNano(null)} isAr={isAr} />}
    </div>
  )
}
