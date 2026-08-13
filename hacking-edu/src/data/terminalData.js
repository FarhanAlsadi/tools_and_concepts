export const PAGES_FILE_CONTENT = `home
about
contact
login
admin
employees
customers
dashboard
challenge
settings
profile
final
api
uploads
backup
test
dev
staging
old`

export const SCAN_LINES = [
  { url: '/home',      status: 200, ms: 145, found: true,  sensitive: false },
  { url: '/about',     status: 200, ms: 189, found: true,  sensitive: false },
  { url: '/contact',   status: 200, ms: 201, found: true,  sensitive: false },
  { url: '/login',     status: 200, ms: 278, found: true,  sensitive: false },
  { url: '/admin',     status: 200, ms: 167, found: true,  sensitive: true  },
  { url: '/employees', status: 200, ms: 234, found: true,  sensitive: true  },
  { url: '/customers', status: 200, ms: 156, found: true,  sensitive: true  },
  { url: '/dashboard', status: 404, ms: 312, found: false, sensitive: false },
  { url: '/challenge', status: 200, ms: 198, found: true,  sensitive: false },
  { url: '/settings',  status: 404, ms: 289, found: false, sensitive: false },
  { url: '/profile',   status: 404, ms: 267, found: false, sensitive: false },
  { url: '/final',     status: 200, ms: 191, found: true,  sensitive: false },
  { url: '/api',       status: 404, ms: 301, found: false, sensitive: false },
  { url: '/uploads',   status: 404, ms: 245, found: false, sensitive: false },
  { url: '/backup',    status: 404, ms: 267, found: false, sensitive: false },
  { url: '/test',      status: 404, ms: 189, found: false, sensitive: false },
  { url: '/dev',       status: 404, ms: 234, found: false, sensitive: false },
  { url: '/staging',   status: 404, ms: 256, found: false, sensitive: false },
  { url: '/old',       status: 404, ms: 278, found: false, sensitive: false },
]
