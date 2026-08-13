/* ────────────────────────────────────────────────────────────────────────────
   Shared Linux-lab engine: a real-ish filesystem (FHS) + path helpers + the
   gobuster/hydra behavior. Realistic scans: a 2000-password rockyou.txt where
   the admin passwords are buried deep, and a bigger dirb wordlist.
   ──────────────────────────────────────────────────────────────────────────── */

export const dir  = (children = {}) => ({ type: 'dir',  children })
export const file = (content = '')  => ({ type: 'file', content })

export const HOME = '/home/user'
export const USER = 'user'
export const HOST = 'camelcode'
export const TARGET = 'orbyx.store'
export const TARGET_IP = '10.10.10.20'
export const QA_HOST = 'brightbyte.io'
export const QA_IP = '10.10.10.30'

// the admin passwords are buried deep in rockyou (0-based index → 1508th / 1700th try)
const QA_PASS_IDX = 1507
const SITE_PASS_IDX = 1699
export const QA_PASS = 'Sunshine@23'
export const SITE_PASS = 'Orbyx2024!'

// ── dirb/big.txt — a realistic web-content wordlist ───────────────────────────
const BIG_WORDS = [
  'index', 'index.html', 'home', 'about', 'about.html', 'contact', 'contact.html', 'login', 'logout', 'register',
  'signup', 'signin', 'admin', 'administrator', 'admin.php', 'dashboard', 'panel', 'cpanel', 'controlpanel',
  'user', 'users', 'account', 'accounts', 'profile', 'settings', 'config', 'config.php', 'configuration',
  'setup', 'install', 'installer', 'backup', 'backups', 'bak', 'old', 'new', 'test', 'testing', 'dev',
  'development', 'staging', 'prod', 'api', 'api.php', 'v1', 'v2', 'rest', 'graphql', 'ajax', 'json',
  'upload', 'uploads', 'files', 'file', 'download', 'downloads', 'images', 'img', 'image', 'media', 'assets',
  'static', 'css', 'js', 'javascript', 'scripts', 'style', 'styles', 'fonts', 'vendor', 'lib', 'libs',
  'includes', 'inc', 'src', 'source', 'tmp', 'temp', 'cache', 'logs', 'log', 'data', 'database', 'db',
  'sql', 'mysql', 'phpmyadmin', 'pma', 'adminer', 'wp-admin', 'wp-login', 'wp-content', 'wp-includes',
  'wordpress', 'blog', 'blogs', 'news', 'article', 'articles', 'post', 'posts', 'page', 'pages', 'category',
  'categories', 'tag', 'tags', 'search', 'sitemap', 'sitemap.xml', 'robots.txt', 'humans.txt', 'favicon.ico',
  '.git', '.gitignore', '.env', '.htaccess', '.htpasswd', '.svn', '.ssh', 'server-status', 'phpinfo',
  'info', 'info.php', 'help', 'faq', 'support', 'ticket', 'tickets', 'contactus', 'team', 'staff',
  'employees', 'employee', 'customers', 'customer', 'clients', 'client', 'members', 'member', 'store',
  'shop', 'cart', 'checkout', 'order', 'orders', 'invoice', 'invoices', 'payment', 'payments', 'billing',
  'product', 'products', 'catalog', 'courses', 'course', 'lesson', 'lessons', 'training', 'events', 'event',
  'gallery', 'portfolio', 'services', 'service', 'pricing', 'plans', 'subscribe', 'newsletter', 'feedback',
  'review', 'reviews', 'comment', 'comments', 'forum', 'forums', 'community', 'chat', 'messages', 'inbox',
  'notifications', 'reports', 'report', 'stats', 'statistics', 'analytics', 'export', 'import', 'private',
  'secret', 'secrets', 'hidden', 'internal', 'restricted', 'secure', 'security', 'auth', 'oauth', 'token',
  'session', 'sessions', 'cookie', 'reset', 'forgot', 'password', 'passwords', 'credentials', 'keys', 'flag',
  'challenge', 'challenges', 'ctf', 'debug', 'console', 'terminal', 'shell', 'cmd', 'exec', 'run',
]
export const WORDLIST_BIG = BIG_WORDS.join('\n') + '\n'

// ── rockyou.txt — 2000 passwords, admin passwords buried deep ─────────────────
const RK_COMMON = [
  '123456', 'password', '12345678', 'qwerty', '123456789', '12345', '1234', '111111', '1234567', 'dragon',
  '123123', 'baseball', 'abc123', 'football', 'monkey', 'letmein', 'shadow', 'master', '666666', 'qwertyuiop',
  '123321', 'mustang', '1234567890', 'michael', '654321', 'superman', '1qaz2wsx', '7777777', '121212', '000000',
  'qazwsx', '123qwe', 'killer', 'trustno1', 'jordan', 'jennifer', 'zxcvbnm', 'asdfgh', 'hunter', 'buster',
  'soccer', 'harley', 'batman', 'andrew', 'tigger', 'sunshine', 'iloveyou', '2000', 'charlie', 'robert',
  'thomas', 'hockey', 'ranger', 'daniel', 'starwars', 'klaster', '112233', 'george', 'computer', 'michelle',
  'jessica', 'pepper', '1111', 'zxcvbn', '555555', '11111111', '131313', 'freedom', '777777', 'pass',
  'maggie', '159753', 'aaaaaa', 'ginger', 'princess', 'joshua', 'cheese', 'amanda', 'summer', 'love',
  'ashley', 'nicole', 'chelsea', 'biteme', 'matthew', 'access', 'yankees', '987654321', 'dallas', 'austin',
  'thunder', 'taylor', 'matrix', 'mobilemail', 'mom', 'monitor', 'monitoring', 'montana', 'moon', 'moscow',
  'hello', 'welcome', 'admin', 'root', 'passw0rd', 'p@ssword', 'qatar123', 'doha2022', 'sunshine1', 'welcome1',
]
const RK_WORDS = [
  'love', 'dragon', 'shadow', 'master', 'ninja', 'football', 'baseball', 'princess', 'superman', 'batman',
  'welcome', 'monkey', 'summer', 'winter', 'qatar', 'doha', 'jaguar', 'falcon', 'desert', 'soccer',
  'hunter', 'ranger', 'jordan', 'harley', 'george', 'pepper', 'ginger', 'flower', 'purple', 'orange',
  'banana', 'guitar', 'cookie', 'silver', 'golden', 'tiger', 'eagle', 'cobra', 'phoenix', 'thunder',
]
const RK_SUF = ['', '1', '2', '3', '7', '12', '21', '13', '23', '69', '88', '99', '00', '01', '11', '123', '1234', '2020', '2021', '2022', '2023', '2024', '!', '@', '#', '007', '321', '777', '111', '_1', '.1', '99!', '00!', '12!', '23!']

function buildRockyou() {
  const seen = new Set(); const out = []
  const add = p => { if (out.length < 2000 && !seen.has(p)) { seen.add(p); out.push(p) } }
  RK_COMMON.forEach(add)
  outer: for (const s of RK_SUF) for (const w of RK_WORDS) { add(w + s); if (out.length >= 2000) break outer }
  let n = 1000; while (out.length < 2000) add('u53r' + (n++))
  ;[QA_PASS, SITE_PASS].forEach(p => { const i = out.indexOf(p); if (i > -1) { out.splice(i, 1); add('u53r' + (n++)) } })
  out[QA_PASS_IDX] = QA_PASS
  out[SITE_PASS_IDX] = SITE_PASS
  return out
}
const ROCKYOU = buildRockyou()
export const WORDLIST_ROCKYOU = ROCKYOU.join('\n') + '\n'

// ── base filesystem (FHS) ─────────────────────────────────────────────────────
export function baseFs() {
  return dir({
    bin:  dir({}), boot: dir({}), dev: dir({}),
    etc: dir({
      hostname: file(HOST + '\n'),
      hosts:    file(`127.0.0.1\tlocalhost\n${TARGET_IP}\t${TARGET}\n${QA_IP}\t${QA_HOST}\n`),
      passwd:   file('root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:CamelCode Student:/home/user:/bin/bash\n'),
      'os-release': file('PRETTY_NAME="CamelCode Kali (lab)"\n'),
    }),
    home: dir({
      user: dir({
        'readme.txt': file('Welcome to the CamelCode Linux lab!\nThis is a REAL shell — use real commands: ls, cd, pwd, cat, nano, mkdir, touch, rm, tree, head, wc.\nType  help  to see everything you can do.\n'),
        'notes.txt': file('targets:\n  - ' + TARGET + ' (' + TARGET_IP + ')\n  - ' + QA_HOST + ' (' + QA_IP + ')\ntools to learn: gobuster, hydra\n'),
        Documents: dir({}), Downloads: dir({}),
        '.bashrc':  file('# ~/.bashrc\nexport PATH=$PATH:/usr/local/bin\nalias ll="ls -la"\n'),
      }),
    }),
    root: dir({}),
    usr: dir({
      bin: dir({}),
      share: dir({
        wordlists: dir({
          dirb: dir({ 'big.txt': file(WORDLIST_BIG), 'common.txt': file(['admin', 'login', 'images', 'test', 'backup'].join('\n') + '\n') }),
          'rockyou.txt': file(WORDLIST_ROCKYOU),
        }),
      }),
    }),
    var: dir({ log: dir({ 'auth.log': file('') }), www: dir({ html: dir({ 'index.html': file(`<h1>${TARGET}</h1>\n`) }) }) }),
    tmp: dir({}),
  })
}

// ── path helpers ──────────────────────────────────────────────────────────────
export function resolvePath(cwd, input, home = HOME) {
  if (!input || input === '.') return [...cwd]
  let p = input
  if (p === '~') p = home
  else if (p.startsWith('~/')) p = home + p.slice(1)
  const segs = p.startsWith('/') ? [] : [...cwd]
  for (const part of p.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') segs.pop()
    else segs.push(part)
  }
  return segs
}
export const pathStr = segs => '/' + segs.join('/')
export function getNode(fs, segs) {
  let n = fs
  for (const s of segs) { if (!n || n.type !== 'dir' || !n.children[s]) return null; n = n.children[s] }
  return n
}
export const displayPath = (segs, home = HOME) => {
  const p = pathStr(segs)
  return p === home ? '~' : p.startsWith(home + '/') ? '~' + p.slice(home.length) : p
}

export const flagVal = (argv, name) => { const i = argv.indexOf(name); return i > -1 ? argv[i + 1] : null }

// ── target scenarios ──────────────────────────────────────────────────────────
// gobuster/hydra LESSONS → brightbyte.io (admin account)
export const QA = {
  host: QA_HOST,
  found: [
    { path:'/index.html', status:200, size:734 },
    { path:'/about',      status:200, size:512 },
    { path:'/courses',    status:200, size:980 },
    { path:'/team',       status:200, size:640 },
    { path:'/blog',       status:200, size:770 },
    { path:'/contact',    status:200, size:430 },
    { path:'/images',     status:301, size:310 },
    { path:'/css',        status:301, size:308 },
    { path:'/js',         status:301, size:307 },
    { path:'/login',      status:200, size:842 },
    { path:'/admin',      status:403, size:285 },
    { path:'/robots.txt', status:200, size:96  },
  ],
  user: 'admin',
  pass: QA_PASS,
}

// FINAL CHALLENGE → orbyx.store (the admin username is the FOUNDER, adam — OSINT)
export const SITE = {
  host: TARGET,
  founder: 'Adam Karim',
  found: [
    { path:'/index.html', status:200, size:640 },
    { path:'/about',      status:200, size:512 },
    { path:'/products',   status:200, size:900 },
    { path:'/customers',  status:200, size:1180 },
    { path:'/login',      status:200, size:842 },
    { path:'/admin',      status:403, size:285 },
    { path:'/employees',  status:403, size:285 },
    { path:'/robots.txt', status:200, size:80  },
    { path:'/images',     status:301, size:310 },
    { path:'/css',        status:301, size:308 },
  ],
  user: 'adam',
  pass: SITE_PASS,
  flag: 'FLAG{0rbyx_r00t_pwn3d}',
  products: ['Wireless Earbuds', 'Smart Watch Pro', 'Gaming Mouse', '4K Monitor', 'Mechanical Keyboard'],
  employees: [
    { name:'Sara Al Kuwari', role:'CEO',                salary:52000 },
    { name:'Omar Al Marri',  role:'CTO',                salary:41000 },
    { name:'Lina Haddad',    role:'Operations Manager', salary:28000 },
    { name:'Yousef Khan',    role:'Warehouse Lead',     salary:19000 },
    { name:'Aisha Nasser',   role:'UX Designer',        salary:17000 },
  ],
  customers: [
    { name:'Ahmed Ali',   plan:'Smart Watch Pro',   phone:'+974 5512 1122' },
    { name:'Fatima Noor', plan:'Wireless Earbuds',   phone:'+974 5533 3344' },
    { name:'Hassan Omar', plan:'4K Monitor',         phone:'+974 5555 5566' },
    { name:'Mariam Saad', plan:'Gaming Mouse',       phone:'+974 5577 7788' },
  ],
}

// ── final-challenge home-folder wordlists (~/pages.txt & ~/passwords.txt) ──────
// pages.txt → for gobuster directory enumeration (the real paths + many decoys)
const CHALLENGE_PAGE_WORDS = [
  'index', 'index.html', 'home', 'about', 'about-us', 'contact', 'contact-us', 'courses', 'course', 'lessons',
  'customers', 'customer', 'clients', 'client', 'members', 'employees', 'employee', 'staff', 'team', 'hr',
  'login', 'signin', 'sign-in', 'logout', 'register', 'signup', 'admin', 'administrator', 'admin.php', 'dashboard',
  'panel', 'cpanel', 'portal', 'account', 'accounts', 'profile', 'settings', 'config', 'config.php', 'api',
  'api/v1', 'users', 'user', 'images', 'img', 'media', 'css', 'js', 'assets', 'static',
  'uploads', 'files', 'download', 'backup', 'backups', 'old', 'test', 'dev', 'staging', 'tmp',
  'blog', 'news', 'shop', 'store', 'cart', 'checkout', 'products', 'product', 'orders', 'invoices',
  'reports', 'private', 'secret', 'internal', 'robots.txt', 'sitemap.xml', '.git', '.env', 'wp-admin', 'phpmyadmin',
]
export const CHALLENGE_PAGES = CHALLENGE_PAGE_WORDS.join('\n') + '\n'

// passwords.txt → for hydra/barq login brute-force. SITE_PASS ('Orbyx2024!') is
// buried near the end so it cracks around attempt ~109 of the list.
const CHALLENGE_PW_WORDS = [
  '123456', 'password', '123456789', '12345678', '12345', '1234567', 'qwerty', 'abc123', 'password1', '111111',
  '123123', 'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'dragon', 'sunshine', 'iloveyou', 'princess',
  'football', 'charlie', 'aa123456', 'donald', 'qwerty123', '1q2w3e4r', 'master', '666666', 'superman', '654321',
  '7777777', '123321', '000000', 'qazwsx', 'trustno1', 'shadow', 'baseball', 'hunter', 'harley', 'ranger',
  'root', 'toor', 'guest', 'test', 'test123', 'demo', 'changeme', 'secret', 'pass123', 'login123',
  'user', 'user123', 'default', 'temp', 'temp123', 'backup', 'system', 'oracle', 'manager', 'support',
  'qatar', 'qatar1', 'qatar123', 'qatar2022', 'qatar2023', 'qatar2024', 'doha', 'doha123', 'doha2023', 'doha2024',
  'dohaqatar', 'lusail', 'alwakrah', 'falcon', 'desert', 'oryx', 'pearl', 'orbyx', 'orbyx1', 'orbyx12',
  'orbyx123', 'orbyxcode', 'orbyxcode1', 'orbyxcode123', 'Orbyx', 'Orbyx1', 'Orbyxcode', 'Orbyxcode1', 'orbyx2022', 'orbyx2023',
  'orbyx2024', 'Orbyx2022', 'Orbyx2023', 'orbyx@2023', 'orbyx@2024', 'Orbyx@2023', 'Orbyxcode2024', 'orbyxshop', 'orbyxshop1', 'orbyxstore',
  'Orbyx2023!', 'Orbyx2024', 'orbyx2024!', 'ORBYX2024', 'Orbyx_2024', 'Orbyx#2024', 'Orbyx2024$', 'Orbyx24!', SITE_PASS, '0rbyx2024!',
  'adam', 'adam123', 'adam2024', 'Adam2024', 'admin2024', 'admin@2024', 'shop2024', 'welcome2024',
]
export const CHALLENGE_PASSWORDS = CHALLENGE_PW_WORDS.join('\n') + '\n'

// a base filesystem with the two wordlists (and a mission note) in /home/user
export function siteChallengeFs() {
  const fs = baseFs()
  const home = fs.children.home.children.user.children
  home['pages.txt']     = file(CHALLENGE_PAGES)
  home['passwords.txt'] = file(CHALLENGE_PASSWORDS)
  home['notes.txt'] = file(
    `target: ${TARGET} (${TARGET_IP})\n\n` +
    `wordlists in this folder:\n` +
    `  pages.txt      — page/directory names (for enumeration)\n` +
    `  passwords.txt  — candidate passwords (for the login brute-force)\n\n` +
    `note: the admin username is NOT "admin" — gather info from the site first.\n`
  )
  return fs
}

// ── gobuster (streamed with progress so it feels like scanning a big list) ─────
export function gobusterLines(url, wordlistPath, found, count) {
  const bar = '==============================================================='
  const head = [
    { k:'dim', v:bar }, { k:'dim', v:'Gobuster v3.6' }, { k:'dim', v:bar },
    { k:'out', v:`[+] Url:            http://${url}` },
    { k:'out', v:'[+] Method:         GET' },
    { k:'out', v:'[+] Threads:        10' },
    { k:'out', v:`[+] Wordlist:       ${wordlistPath}` },
    { k:'out', v:'[+] Status codes:   200,204,301,302,307,401,403' },
    { k:'dim', v:bar },
    { k:'dim', v:`Starting gobuster in directory enumeration mode (${count} words)` },
    { k:'dim', v:bar },
  ]
  const body = []
  const step = Math.max(1, Math.floor(count / (found.length + 1)))
  found.forEach((f, i) => {
    const col = f.status === 200 ? 'ok' : f.status === 403 ? 'warn' : 'info'
    const redir = f.status >= 300 && f.status < 400 ? `  [--> http://${url}${f.path}/]` : ''
    body.push({ k: col, v: `${f.path.padEnd(20)} (Status: ${f.status}) [Size: ${f.size}]${redir}` })
    if (i % 2 === 1) body.push({ k:'dim', v:`Progress: ${step * (i + 1)} / ${count}` })
  })
  const tail = [{ k:'dim', v:`Progress: ${count} / ${count}` }, { k:'dim', v:bar }, { k:'dim', v:'Finished' }, { k:'dim', v:bar }]
  return [...head, ...body, ...tail]
}

export function runGobuster(ctx, { found, onFound }) {
  const { argv, printAll, stream, readFile } = ctx
  // simple form:  gobuster -u website -w file   (the "dir" subcommand is optional)
  const url = flagVal(argv, '-u'); const wl = flagVal(argv, '-w')
  if (!url || !wl) {
    printAll([{ k:'err', v:'gobuster: missing arguments' }, { k:'dim', v:'usage: gobuster -u website -w file' }])
    return
  }
  const content = readFile(wl)
  const count = content ? content.split('\n').filter(Boolean).length : 220
  stream(gobusterLines(url.replace(/^https?:\/\//, ''), wl, found, count), 320, () => onFound && onFound())
}

// ── hydra (streams every attempt with an "X of N" counter, batched) ────────────
export function runHydra(ctx, { user: targetUser, pass: targetPass, onCrack, onProgress }) {
  const { argv, print, printAll, replaceLast, schedule, setBusy, readFile } = ctx
  const user = flagVal(argv, '-l'); const wl = flagVal(argv, '-P')
  const form = argv.find(a => a.includes('^USER^') || a.includes('^PASS^')) || ''
  const consumed = new Set([argv[0], '-l', user, '-P', wl, '-V', '-f', 'http-post-form', form])
  const host = argv.slice(1).find(a => !a.startsWith('-') && !consumed.has(a) && a !== 'http-post-form')
  if (!user) { print({ k:'err', v:'hydra: -l <login> is required' }); return }
  if (!wl)   { print({ k:'err', v:'hydra: -P <password list> is required' }); return }
  if (readFile(wl) === null) { print({ k:'err', v:`hydra: could not open password file: ${wl}` }); return }
  if (!host) { print({ k:'err', v:'hydra: target host missing' }); return }

  const rock = readFile(wl).split('\n').filter(Boolean)
  const path = form.split(':')[0] || '/login'
  const N = rock.length
  const hit = user === targetUser ? rock.indexOf(targetPass) : -1   // only the right user has a match
  const target = hit >= 0 ? hit + 1 : Math.min(N, 80)              // wrong user → try ~80 then give up

  setBusy(true)
  printAll([
    { k:'dim', v:'Hydra v9.5 (c) 2024 by van Hauser/THC & David Maciejak - for legal purposes only' },
    { k:'out', v:`[DATA] max 16 tasks per 1 server, overall 16 tasks, ${N} login tries (l:1/p:${N})` },
    { k:'out', v:`[DATA] attacking http-post-form://${host}${path}` },
  ])
  // a single "live" attempt line whose counter races up — cheap to update, and it
  // leaves a permanent milestone every 300 tries so there's a visible trail.
  const attempt = n => ({ k:'dim', v:`[ATTEMPT] target ${host} - login "${user}" - pass "${rock[n - 1]}" - ${n} of ${N} [child ${(n - 1) % 16}]` })
  print(attempt(1))
  let n = 1
  const step = 13, ms = 26
  const tick = () => {
    const prev = n
    n = Math.min(n + step, target)
    const line = attempt(n)
    onProgress && onProgress({ user, pass: rock[n - 1], n, total: N })
    if (Math.floor(n / 300) > Math.floor(prev / 300) && n < target) { replaceLast(line); print(line) } // freeze a milestone
    else replaceLast(line)
    if (n < target) { schedule(tick, ms); return }
    if (hit >= 0) {
      printAll([
        { k:'ok', v:`[80][http-post-form] host: ${host}   login: ${user}   password: ${targetPass}` },
        { k:'out', v:'1 of 1 target successfully completed, 1 valid password found' },
        { k:'dim', v:`Hydra finished — password cracked on try ${hit + 1} of ${N}.` },
      ])
      setBusy(false); onCrack && onCrack(targetPass)
    } else {
      printAll([
        { k:'err', v:`[ERROR] 0 valid passwords found for login "${user}" (tried ${target} of ${N})` },
        { k:'warn', v:'hint: is that the right username? do some info gathering first.' },
        { k:'dim', v:'Hydra finished.' },
      ])
      setBusy(false)
    }
  }
  schedule(tick, 300)
}

// ── barq (CamelCode ⚡ brute-forcer) — same idea as hydra, simpler CLI ─────────
// Simple form:  barq user file website   (also accepts flags  barq -l user -w file website).
// Cracks ONLY the real user, exactly like hydra, so students can use either tool.
export function runBarq(ctx, { user: targetUser, pass: targetPass, host: hostArg, onCrack, onProgress }) {
  const { argv, print, printAll, replaceLast, schedule, setBusy, readFile } = ctx
  const fUser = flagVal(argv, '-l') || flagVal(argv, '-u')
  const fWl   = flagVal(argv, '-w') || flagVal(argv, '-P')
  const skip  = new Set([argv[0], '-l', '-u', '-w', '-P', fUser, fWl].filter(Boolean))
  const pos   = argv.filter(a => !skip.has(a) && !a.startsWith('-'))
  const user  = fUser || pos[0]
  const wl    = fWl   || pos[1]
  const host  = hostArg || pos.find(p => p.includes('.')) || TARGET

  if (!user) { printAll([{ k:'err', v:'barq: username required' }, { k:'dim', v:'usage: barq user file website' }]); return }
  if (!wl)   { printAll([{ k:'err', v:'barq: wordlist required' }, { k:'dim', v:'usage: barq user file website' }]); return }
  const content = readFile(wl)
  if (content === null) { print({ k:'err', v:`barq: cannot open wordlist: ${wl}` }); return }

  const rock = content.split('\n').filter(Boolean)
  const N = rock.length
  const hit = user === targetUser ? rock.indexOf(targetPass) : -1   // only the right user has a match
  const target = hit >= 0 ? hit + 1 : Math.min(N, 80)              // wrong user → try ~80 then give up

  setBusy(true)
  printAll([
    { k:'info', v:'⚡ Barq v2.0 — CamelCode brute-forcer' },
    { k:'out',  v:`[*] target   : ${host}` },
    { k:'out',  v:`[*] username : ${user}` },
    { k:'out',  v:`[*] wordlist : ${wl} (${N} passwords)` },
    { k:'dim',  v:'' },
  ])
  // one live "trying" line whose counter races up (cheap to update), leaving a
  // permanent milestone every 300 tries so there's a visible trail.
  const attempt = n => ({ k:'dim', v:`[⚡] ${String(n).padStart(4)}/${N}  trying  ${user} : ${rock[n - 1]}` })
  print(attempt(1))
  let n = 1
  const step = 13, ms = 26
  const tick = () => {
    const prev = n
    n = Math.min(n + step, target)
    const line = attempt(n)
    onProgress && onProgress({ user, pass: rock[n - 1], n, total: N })
    if (Math.floor(n / 300) > Math.floor(prev / 300) && n < target) { replaceLast(line); print(line) } // freeze a milestone
    else replaceLast(line)
    if (n < target) { schedule(tick, ms); return }
    if (hit >= 0) {
      printAll([
        { k:'dim',  v:'' },
        { k:'ok',   v:`[✓] PASSWORD FOUND   →   ${user} : ${targetPass}` },
        { k:'out',  v:`[✓] cracked on attempt ${hit + 1} of ${N}` },
        { k:'warn', v:'[*] use these credentials at /login' },
      ])
      setBusy(false); onCrack && onCrack(targetPass)
    } else {
      printAll([
        { k:'dim',  v:'' },
        { k:'err',  v:`[✗] no valid password for "${user}" (tried ${target} of ${N})` },
        { k:'warn', v:'[!] wrong username? gather more info first — check /about.' },
      ])
      setBusy(false)
    }
  }
  schedule(tick, 300)
}
