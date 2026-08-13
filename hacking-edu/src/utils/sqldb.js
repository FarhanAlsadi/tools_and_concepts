/* ────────────────────────────────────────────────────────────────────────────
   sqldb.js — a tiny, dependency-free SQL engine for the "How SQL Works" lesson.

   It is NOT a full database. It supports the read-only slice of SQL that the
   lesson teaches, executed for real against in-memory tables:

     SELECT  <*, cols, table.col, FN(col), FN(*) [AS alias]>
     FROM    <table [alias]>
     [INNER|LEFT] JOIN <table [alias]> ON <cond>      (any number of joins)
     WHERE   <boolean expression: = <> < <= > >= LIKE IN IS NULL AND OR NOT ()>
     GROUP BY <cols>
     HAVING  <boolean expression over aggregates / group cols>
     ORDER BY <col [ASC|DESC], ...>
     LIMIT   <n> [OFFSET <m>]
     [DISTINCT]

   Aggregates: COUNT(*), COUNT(col), SUM, AVG, MIN, MAX.

   Everything runs by genuinely evaluating the parsed query row by row — so the
   results a student sees are computed, not hard-coded. Errors are thrown as
   Error objects carrying both `.en` and `.ar` friendly messages so the lesson
   can show them in either language.
   ──────────────────────────────────────────────────────────────────────────── */

// ── The database ────────────────────────────────────────────────────────────
// Three linked tables (a classic many-to-many via a join table):
//   students 1───∞ enrollments ∞───1 courses
export const DB = {
  students: {
    columns: ['id', 'name', 'age', 'city', 'grade', 'joined'],
    types:   { id: 'int', name: 'text', age: 'int', city: 'text', grade: 'int', joined: 'date' },
    pk: 'id',
    rows: [
      { id: 1,  name: 'Sara',   age: 19, city: 'Doha',      grade: 92, joined: '2023-09-01' },
      { id: 2,  name: 'Omar',   age: 22, city: 'Doha',      grade: 74, joined: '2022-02-15' },
      { id: 3,  name: 'Lina',   age: 20, city: 'Al Wakrah', grade: 88, joined: '2023-01-10' },
      { id: 4,  name: 'Yousef', age: 23, city: 'Doha',      grade: 65, joined: '2021-11-05' },
      { id: 5,  name: 'Mariam', age: 18, city: 'Al Khor',   grade: 95, joined: '2024-03-20' },
      { id: 6,  name: 'Khalid', age: 21, city: 'Doha',      grade: 79, joined: '2022-09-12' },
      { id: 7,  name: 'Aisha',  age: 20, city: 'Al Wakrah', grade: 83, joined: '2023-05-30' },
      { id: 8,  name: 'Hassan', age: 24, city: 'Al Khor',   grade: 71, joined: '2021-08-19' },
      { id: 9,  name: 'Noura',  age: 19, city: 'Doha',      grade: 90, joined: '2024-01-08' },
      { id: 10, name: 'Ali',    age: 22, city: 'Al Wakrah', grade: 68, joined: '2022-04-25' },
    ],
  },
  courses: {
    columns: ['id', 'title', 'instructor', 'credits', 'level'],
    types:   { id: 'int', title: 'text', instructor: 'text', credits: 'int', level: 'text' },
    pk: 'id',
    rows: [
      { id: 101, title: 'Web Security',  instructor: 'Sara',   credits: 4, level: 'Beginner' },
      { id: 102, title: 'Networking',    instructor: 'Omar',   credits: 3, level: 'Beginner' },
      { id: 103, title: 'Python',        instructor: 'Lina',   credits: 4, level: 'Intermediate' },
      { id: 104, title: 'Cryptography',  instructor: 'Hassan', credits: 3, level: 'Advanced' },
      { id: 105, title: 'Linux Basics',  instructor: 'Noura',  credits: 2, level: 'Beginner' },
    ],
  },
  enrollments: {
    columns: ['id', 'student_id', 'course_id', 'score'],
    types:   { id: 'int', student_id: 'int', course_id: 'int', score: 'int' },
    pk: 'id',
    fk: { student_id: 'students.id', course_id: 'courses.id' },
    rows: [
      { id: 1,  student_id: 1,  course_id: 101, score: 95 },
      { id: 2,  student_id: 1,  course_id: 103, score: 88 },
      { id: 3,  student_id: 2,  course_id: 101, score: 70 },
      { id: 4,  student_id: 3,  course_id: 102, score: 91 },
      { id: 5,  student_id: 3,  course_id: 104, score: 84 },
      { id: 6,  student_id: 4,  course_id: 105, score: 60 },
      { id: 7,  student_id: 5,  course_id: 101, score: 99 },
      { id: 8,  student_id: 5,  course_id: 103, score: 93 },
      { id: 9,  student_id: 6,  course_id: 102, score: 77 },
      { id: 10, student_id: 7,  course_id: 104, score: 80 },
      { id: 11, student_id: 8,  course_id: 105, score: 66 },
      { id: 12, student_id: 9,  course_id: 101, score: 90 },
      { id: 13, student_id: 9,  course_id: 102, score: 85 },
      { id: 14, student_id: 10, course_id: 103, score: 72 },
      { id: 15, student_id: 2,  course_id: 105, score: 68 },
    ],
  },
}

export const TABLE_NAMES = Object.keys(DB)

// ── Friendly bilingual error helper ─────────────────────────────────────────
function qerr(en, ar) {
  const e = new Error(en)
  e.en = en
  e.ar = ar
  e.friendly = true
  return e
}

// Levenshtein distance — powers "did you mean …?" hints on typos.
function editDistance(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase()
  const m = a.length, n = b.length
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) d[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[m][n]
}
function suggest(name, candidates) {
  let best = null, bd = Infinity
  for (const c of candidates) { const dd = editDistance(name, c); if (dd < bd) { bd = dd; best = c } }
  return bd <= Math.max(2, Math.ceil(name.length / 3)) ? best : null
}

// ── Tokenizer ───────────────────────────────────────────────────────────────
const AGG_FNS = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'])
const KEYWORDS = new Set([
  'SELECT', 'DISTINCT', 'FROM', 'AS', 'WHERE', 'GROUP', 'BY', 'HAVING', 'ORDER',
  'ASC', 'DESC', 'LIMIT', 'OFFSET', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER',
  'ON', 'AND', 'OR', 'NOT', 'LIKE', 'IN', 'IS', 'NULL', 'BETWEEN', 'TRUE', 'FALSE',
])

function tokenize(sql) {
  const toks = []
  let i = 0
  const n = sql.length
  while (i < n) {
    const c = sql[i]
    // whitespace
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue }
    // line comment --
    if (c === '-' && sql[i + 1] === '-') { while (i < n && sql[i] !== '\n') i++; continue }
    // block comment /* */
    if (c === '/' && sql[i + 1] === '*') { i += 2; while (i < n && !(sql[i] === '*' && sql[i + 1] === '/')) i++; i += 2; continue }
    // string literal '...'  ('' escapes a quote) or "..." (treated as string too)
    if (c === "'" || c === '"') {
      const q = c; let j = i + 1, val = ''
      while (j < n) {
        if (sql[j] === q) { if (sql[j + 1] === q) { val += q; j += 2; continue } break }
        val += sql[j]; j++
      }
      if (j >= n) throw qerr('Unterminated string literal — you opened a quote that is never closed.', 'نص غير مُغلق — فتحت علامة اقتباس ولم تُغلقها.')
      toks.push({ type: 'str', value: val }); i = j + 1; continue
    }
    // number
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(sql[i + 1]))) {
      let j = i, num = ''
      while (j < n && /[0-9.]/.test(sql[j])) { num += sql[j]; j++ }
      const val = Number(num)
      if (Number.isNaN(val) || (num.match(/\./g) || []).length > 1) throw qerr(`Invalid number "${num}".`, `رقم غير صالح "${num}".`)
      toks.push({ type: 'num', value: val }); i = j; continue
    }
    // word (identifier or keyword)
    if (/[A-Za-z_]/.test(c)) {
      let j = i, w = ''
      while (j < n && /[A-Za-z0-9_]/.test(sql[j])) { w += sql[j]; j++ }
      toks.push({ type: 'word', value: w, up: w.toUpperCase() }); i = j; continue
    }
    // multi-char operators
    const two = sql.slice(i, i + 2)
    if (two === '<=' || two === '>=' || two === '<>' || two === '!=') { toks.push({ type: 'op', value: two === '!=' ? '<>' : two }); i += 2; continue }
    // single-char symbols
    if (c === '=' || c === '<' || c === '>') { toks.push({ type: 'op', value: c }); i++; continue }
    if (c === '*') { toks.push({ type: 'star', value: '*' }); i++; continue }
    if (c === ',' || c === '(' || c === ')' || c === '.') { toks.push({ type: 'punct', value: c }); i++; continue }
    if (c === ';') { i++; continue } // tolerate a trailing semicolon
    throw qerr(`Unexpected character "${c}" in the query.`, `رمز غير متوقع "${c}" في الاستعلام.`)
  }
  toks.push({ type: 'eof', value: '<end>' })
  return toks
}

// ── Parser (recursive descent) ──────────────────────────────────────────────
function parse(sql) {
  const toks = tokenize(sql)
  let pos = 0
  const peek = () => toks[pos]
  const isKw = w => peek().type === 'word' && peek().up === w
  const isAnyKw = () => peek().type === 'word' && KEYWORDS.has(peek().up)
  const eatKw = w => { if (isKw(w)) { pos++; return true } return false }
  const isSym = v => (peek().type === 'punct' || peek().type === 'op' || peek().type === 'star') && peek().value === v
  const eatSym = v => { if (isSym(v)) { pos++; return true } return false }
  const near = () => { const t = peek(); return t.type === 'eof' ? 'the end of the query' : `"${t.value}"` }
  const nearAr = () => { const t = peek(); return t.type === 'eof' ? 'نهاية الاستعلام' : `"${t.value}"` }
  const expectSym = v => { if (!eatSym(v)) throw qerr(`Expected "${v}" but found ${near()}.`, `توقعت "${v}" لكن وجدت ${nearAr()}.`) }

  // an identifier that is NOT a reserved keyword (what = {en, ar} label)
  const ident = what => {
    const t = peek()
    if (t.type !== 'word' || KEYWORDS.has(t.up)) throw qerr(`Expected ${what.en} but found ${near()}.`, `توقعت ${what.ar} لكن وجدت ${nearAr()}.`)
    pos++; return t.value
  }
  const L = {
    col:       { en: 'a column name', ar: 'اسم عمود' },
    colDot:    { en: 'a column name after "."', ar: 'اسم عمود بعد "."' },
    alias:     { en: 'an alias name', ar: 'اسماً بديلاً' },
    table:     { en: 'a table name', ar: 'اسم جدول' },
    tableAlias:{ en: 'a table alias', ar: 'اسماً بديلاً للجدول' },
  }

  // column reference:  name  |  table.name
  const parseColRef = () => {
    const first = ident(L.col)
    if (isSym('.')) { pos++; if (isSym('*')) { pos++; return { table: first, name: '*' } } const second = ident(L.colDot); return { table: first, name: second } }
    return { table: null, name: first }
  }

  // ── SELECT list ──
  const parseSelectItem = () => {
    // *  or  table.*
    if (isSym('*')) { pos++; return { kind: 'star', table: null } }
    // aggregate function?  COUNT( ... )
    if (peek().type === 'word' && AGG_FNS.has(peek().up) && toks[pos + 1] && toks[pos + 1].type === 'punct' && toks[pos + 1].value === '(') {
      const fn = peek().up; pos++; expectSym('(')
      const distinct = eatKw('DISTINCT')
      let arg
      if (isSym('*')) { pos++; arg = { star: true } }
      else arg = { star: false, col: parseColRef() }
      expectSym(')')
      let text = `${fn}(${distinct ? 'DISTINCT ' : ''}${arg.star ? '*' : (arg.col.table ? arg.col.table + '.' : '') + arg.col.name})`
      let alias = null
      if (eatKw('AS')) alias = ident(L.alias)
      return { kind: 'agg', fn, arg, distinct, alias, text }
    }
    // table.*  (star for one table)
    if (peek().type === 'word' && toks[pos + 1] && toks[pos + 1].type === 'punct' && toks[pos + 1].value === '.'
        && toks[pos + 2] && toks[pos + 2].type === 'star') {
      const table = peek().value; pos += 3; return { kind: 'star', table }
    }
    // plain column ref
    const col = parseColRef()
    let alias = null
    if (eatKw('AS')) alias = ident(L.alias)
    return { kind: 'col', table: col.table, name: col.name, alias }
  }

  // ── expression parser for WHERE / HAVING / ON ──
  //   OR → AND → NOT → comparison → primary
  const parseValue = () => {
    const t = peek()
    if (t.type === 'num') { pos++; return { v: 'lit', value: t.value } }
    if (t.type === 'str') { pos++; return { v: 'lit', value: t.value } }
    if (isKw('NULL')) { pos++; return { v: 'lit', value: null } }
    if (isKw('TRUE')) { pos++; return { v: 'lit', value: 1 } }
    if (isKw('FALSE')) { pos++; return { v: 'lit', value: 0 } }
    // aggregate value (used in HAVING)
    if (t.type === 'word' && AGG_FNS.has(t.up) && toks[pos + 1] && toks[pos + 1].value === '(') {
      const fn = t.up; pos++; expectSym('(')
      const distinct = eatKw('DISTINCT')
      let arg
      if (isSym('*')) { pos++; arg = { star: true } } else arg = { star: false, col: parseColRef() }
      expectSym(')')
      return { v: 'agg', fn, arg, distinct }
    }
    if (t.type === 'word' && !KEYWORDS.has(t.up)) { const c = parseColRef(); return { v: 'col', table: c.table, name: c.name } }
    throw qerr(`Expected a value or column but found ${near()}.`, `توقعت قيمة أو عمود لكن وجدت ${nearAr()}.`)
  }

  const parsePrimaryBool = () => {
    if (isSym('(')) { pos++; const e = parseOr(); expectSym(')'); return e }
    // left value
    const left = parseValue()
    // IS [NOT] NULL
    if (eatKw('IS')) { const neg = eatKw('NOT'); if (!eatKw('NULL')) throw qerr(`Expected NULL after IS but found ${near()}.`, `توقعت NULL بعد IS لكن وجدت ${nearAr()}.`); return { b: 'isnull', neg, expr: left } }
    // [NOT] LIKE / IN / BETWEEN
    let neg = false
    if (isKw('NOT') && toks[pos + 1] && toks[pos + 1].type === 'word' && (toks[pos + 1].up === 'LIKE' || toks[pos + 1].up === 'IN' || toks[pos + 1].up === 'BETWEEN')) { neg = true; pos++ }
    if (eatKw('LIKE')) { const pat = parseValue(); return { b: 'like', neg, expr: left, pattern: pat } }
    if (eatKw('IN')) {
      expectSym('('); const list = [parseValue()]; while (eatSym(',')) list.push(parseValue()); expectSym(')')
      return { b: 'in', neg, expr: left, list }
    }
    if (eatKw('BETWEEN')) { const lo = parseValue(); if (!eatKw('AND')) throw qerr('Expected AND in BETWEEN ... AND ... .', 'توقعت AND داخل BETWEEN ... AND ... .'); const hi = parseValue(); return { b: 'between', neg, expr: left, lo, hi } }
    // comparison op
    if (peek().type === 'op') { const op = peek().value; pos++; const right = parseValue(); return { b: 'cmp', op, left, right } }
    // a bare value used as a truth test (e.g. WHERE 1)
    return { b: 'truthy', expr: left }
  }
  const parseNot = () => { if (eatKw('NOT')) return { b: 'not', expr: parseNot() }; return parsePrimaryBool() }
  const parseAnd = () => { let e = parseNot(); while (eatKw('AND')) e = { b: 'and', l: e, r: parseNot() }; return e }
  function parseOr() { let e = parseAnd(); while (eatKw('OR')) e = { b: 'or', l: e, r: parseAnd() }; return e }

  // ── the statement ──
  if (!eatKw('SELECT')) throw qerr(`Only SELECT queries are supported here. Start your query with SELECT. (found ${near()})`, `تُدعم هنا استعلامات SELECT فقط. ابدأ استعلامك بـ SELECT. (وجدت ${nearAr()})`)
  const distinct = eatKw('DISTINCT')
  const columns = [parseSelectItem()]
  while (eatSym(',')) columns.push(parseSelectItem())

  if (!eatKw('FROM')) throw qerr(`Expected FROM after the selected columns, but found ${near()}. A query reads FROM a table.`, `توقعت FROM بعد الأعمدة المختارة، لكن وجدت ${nearAr()}. الاستعلام يقرأ FROM جدول.`)
  const parseTableRef = () => {
    const name = ident(L.table)
    let alias = null
    if (eatKw('AS')) alias = ident(L.tableAlias)
    else if (peek().type === 'word' && !KEYWORDS.has(peek().up)) alias = ident(L.tableAlias)
    return { name, alias: alias || name }
  }
  const from = parseTableRef()

  const joins = []
  while (true) {
    let kind = 'INNER'
    if (isKw('INNER')) { pos++; kind = 'INNER' }
    else if (isKw('LEFT')) { pos++; eatKw('OUTER'); kind = 'LEFT' }
    else if (isKw('RIGHT')) { pos++; eatKw('OUTER'); kind = 'RIGHT' }
    if (!eatKw('JOIN')) { if (kind !== 'INNER') throw qerr('Expected JOIN after the join type.', 'توقعت JOIN بعد نوع الربط.'); break }
    const tref = parseTableRef()
    if (!eatKw('ON')) throw qerr(`Expected ON to specify how to join, but found ${near()}.`, `توقعت ON لتحديد كيفية الربط، لكن وجدت ${nearAr()}.`)
    const on = parseOr()
    joins.push({ kind, table: tref.name, alias: tref.alias, on })
  }

  let where = null
  if (eatKw('WHERE')) where = parseOr()

  let groupBy = null
  if (eatKw('GROUP')) { if (!eatKw('BY')) throw qerr('Expected BY after GROUP.', 'توقعت BY بعد GROUP.'); groupBy = [parseColRef()]; while (eatSym(',')) groupBy.push(parseColRef()) }

  let having = null
  if (eatKw('HAVING')) having = parseOr()

  let orderBy = null
  if (eatKw('ORDER')) {
    if (!eatKw('BY')) throw qerr('Expected BY after ORDER.', 'توقعت BY بعد ORDER.')
    orderBy = []
    const parseOrderTerm = () => {
      // ORDER BY may reference an aggregate, a column, or a select alias
      let expr
      if (peek().type === 'word' && AGG_FNS.has(peek().up) && toks[pos + 1] && toks[pos + 1].value === '(') expr = parseValue()
      else if (peek().type === 'num') { expr = { v: 'lit', value: peek().value }; pos++ } // ORDER BY 2 (position) — value flagged below
      else expr = { v: 'col', ...parseColRef() }
      let dir = 'ASC'
      if (eatKw('ASC')) dir = 'ASC'; else if (eatKw('DESC')) dir = 'DESC'
      return { expr, dir }
    }
    orderBy.push(parseOrderTerm()); while (eatSym(',')) orderBy.push(parseOrderTerm())
  }

  let limit = null, offset = 0
  if (eatKw('LIMIT')) {
    if (peek().type !== 'num') throw qerr(`Expected a number after LIMIT but found ${near()}.`, `توقعت رقماً بعد LIMIT لكن وجدت ${nearAr()}.`)
    limit = peek().value; pos++
    if (!Number.isInteger(limit) || limit < 0) throw qerr('LIMIT must be a whole number ≥ 0.', 'يجب أن يكون LIMIT عدداً صحيحاً ≥ 0.')
    if (eatKw('OFFSET')) {
      if (peek().type !== 'num') throw qerr('Expected a number after OFFSET.', 'توقعت رقماً بعد OFFSET.')
      offset = peek().value; pos++
      if (!Number.isInteger(offset) || offset < 0) throw qerr('OFFSET must be a whole number ≥ 0.', 'يجب أن يكون OFFSET عدداً صحيحاً ≥ 0.')
    }
  }

  if (peek().type !== 'eof') throw qerr(`Unexpected extra input near ${near()}.`, `مدخلات إضافية غير متوقعة قرب ${nearAr()}.`)
  return { distinct, columns, from, joins, where, groupBy, having, orderBy, limit, offset }
}

// ── Evaluation helpers ──────────────────────────────────────────────────────
const isNumeric = v => (typeof v === 'number' && !Number.isNaN(v)) || (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)))

// three-way compare for ordering & comparison ops (case-insensitive on text)
function cmpVals(a, b) {
  if (a == null && b == null) return 0
  if (a == null) return 1   // NULLs sort last
  if (b == null) return -1
  if (isNumeric(a) && isNumeric(b)) { const x = Number(a), y = Number(b); return x < y ? -1 : x > y ? 1 : 0 }
  const x = String(a).toLowerCase(), y = String(b).toLowerCase()
  return x < y ? -1 : x > y ? 1 : 0
}

function likeToRegex(pattern) {
  let re = ''
  for (const ch of String(pattern)) {
    if (ch === '%') re += '.*'
    else if (ch === '_') re += '.'
    else re += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp('^' + re + '$', 'i')
}

// resolve a column reference against a joined environment
// env = { aliasName: rowObjectOrNull, ... };  aliasCols = { aliasName: [colNames] }
function resolveCol(ref, env, aliasCols) {
  if (ref.table) {
    if (!(ref.table in env)) throw qerr(`Unknown table "${ref.table}" in "${ref.table}.${ref.name}".`, `جدول غير معروف "${ref.table}" في "${ref.table}.${ref.name}".`)
    const row = env[ref.table]
    if (row == null) return null
    if (!(ref.name in row)) {
      const s = suggest(ref.name, aliasCols[ref.table] || [])
      throw qerr(`Unknown column "${ref.name}" in table "${ref.table}".${s ? ` Did you mean "${s}"?` : ''}`, `عمود غير معروف "${ref.name}" في الجدول "${ref.table}".${s ? ` هل تقصد "${s}"؟` : ''}`)
    }
    return row[ref.name]
  }
  // unqualified — search every joined table
  const owners = []
  for (const a of Object.keys(env)) if ((aliasCols[a] || []).includes(ref.name)) owners.push(a)
  if (owners.length === 0) {
    const all = Object.values(aliasCols).flat()
    const s = suggest(ref.name, all)
    throw qerr(`Unknown column "${ref.name}".${s ? ` Did you mean "${s}"?` : ''}`, `عمود غير معروف "${ref.name}".${s ? ` هل تقصد "${s}"؟` : ''}`)
  }
  if (owners.length > 1) throw qerr(`Column "${ref.name}" is ambiguous — it exists in ${owners.join(', ')}. Qualify it like ${owners[0]}.${ref.name}.`, `العمود "${ref.name}" غير محدد — موجود في ${owners.join('، ')}. حدّده هكذا ${owners[0]}.${ref.name}.`)
  const row = env[owners[0]]
  return row == null ? null : row[ref.name]
}

function evalValue(node, env, aliasCols) {
  if (node.v === 'lit') return node.value
  if (node.v === 'col') return resolveCol(node, env, aliasCols)
  throw qerr('Aggregates are only allowed in SELECT and HAVING.', 'الدوال التجميعية مسموحة فقط في SELECT و HAVING.')
}

function evalBool(node, env, aliasCols) {
  switch (node.b) {
    case 'or':  return evalBool(node.l, env, aliasCols) || evalBool(node.r, env, aliasCols)
    case 'and': return evalBool(node.l, env, aliasCols) && evalBool(node.r, env, aliasCols)
    case 'not': return !evalBool(node.expr, env, aliasCols)
    case 'truthy': { const v = evalValue(node.expr, env, aliasCols); return v != null && v !== 0 && v !== '' && v !== '0' }
    case 'isnull': { const v = evalValue(node.expr, env, aliasCols); const r = v == null; return node.neg ? !r : r }
    case 'like': { const v = evalValue(node.expr, env, aliasCols); if (v == null) return false; const r = likeToRegex(evalValue(node.pattern, env, aliasCols)).test(String(v)); return node.neg ? !r : r }
    case 'in': { const v = evalValue(node.expr, env, aliasCols); if (v == null) return false; const r = node.list.some(x => cmpVals(v, evalValue(x, env, aliasCols)) === 0); return node.neg ? !r : r }
    case 'between': { const v = evalValue(node.expr, env, aliasCols); if (v == null) return false; const lo = evalValue(node.lo, env, aliasCols), hi = evalValue(node.hi, env, aliasCols); const r = cmpVals(v, lo) >= 0 && cmpVals(v, hi) <= 0; return node.neg ? !r : r }
    case 'cmp': {
      const a = evalValue(node.left, env, aliasCols), b = evalValue(node.right, env, aliasCols)
      if (a == null || b == null) return false
      const c = cmpVals(a, b)
      switch (node.op) {
        case '=':  return c === 0
        case '<>': return c !== 0
        case '<':  return c < 0
        case '<=': return c <= 0
        case '>':  return c > 0
        case '>=': return c >= 0
      }
    }
  }
  return false
}

// compute an aggregate over a group (list of envs)
function evalAgg(fn, arg, distinct, group, aliasCols) {
  if (fn === 'COUNT' && arg.star) return group.length
  let vals = group.map(env => arg.star ? 1 : resolveCol(arg.col, env, aliasCols)).filter(v => v != null)
  if (distinct) { const seen = new Set(); vals = vals.filter(v => { const k = String(v); if (seen.has(k)) return false; seen.add(k); return true }) }
  if (fn === 'COUNT') return vals.length
  if (vals.length === 0) return null
  if (fn === 'MIN') return vals.reduce((m, v) => (cmpVals(v, m) < 0 ? v : m))
  if (fn === 'MAX') return vals.reduce((m, v) => (cmpVals(v, m) > 0 ? v : m))
  const nums = vals.map(Number)
  if (nums.some(isNaN)) throw qerr(`${fn} needs numeric values.`, `${fn} يحتاج قيماً رقمية.`)
  const sum = nums.reduce((a, b) => a + b, 0)
  if (fn === 'SUM') return sum
  if (fn === 'AVG') return Math.round((sum / nums.length) * 100) / 100
  return null
}

// value/bool evaluation in a GROUP context (for HAVING & aggregate ORDER BY)
function evalValueG(node, group, aliasCols) {
  if (node.v === 'lit') return node.value
  if (node.v === 'agg') return evalAgg(node.fn, node.arg, node.distinct, group, aliasCols)
  if (node.v === 'col') return resolveCol(node, group[0], aliasCols) // representative row (a group column)
  return null
}
function evalBoolG(node, group, aliasCols) {
  const V = n => evalValueG(n, group, aliasCols)
  switch (node.b) {
    case 'or':  return evalBoolG(node.l, group, aliasCols) || evalBoolG(node.r, group, aliasCols)
    case 'and': return evalBoolG(node.l, group, aliasCols) && evalBoolG(node.r, group, aliasCols)
    case 'not': return !evalBoolG(node.expr, group, aliasCols)
    case 'truthy': { const v = V(node.expr); return v != null && v !== 0 && v !== '' && v !== '0' }
    case 'isnull': { const v = V(node.expr); const r = v == null; return node.neg ? !r : r }
    case 'like': { const v = V(node.expr); if (v == null) return false; const r = likeToRegex(V(node.pattern)).test(String(v)); return node.neg ? !r : r }
    case 'in': { const v = V(node.expr); if (v == null) return false; const r = node.list.some(x => cmpVals(v, V(x)) === 0); return node.neg ? !r : r }
    case 'between': { const v = V(node.expr); if (v == null) return false; const r = cmpVals(v, V(node.lo)) >= 0 && cmpVals(v, V(node.hi)) <= 0; return node.neg ? !r : r }
    case 'cmp': { const a = V(node.left), b = V(node.right); if (a == null || b == null) return false; const c = cmpVals(a, b); return { '=': c === 0, '<>': c !== 0, '<': c < 0, '<=': c <= 0, '>': c > 0, '>=': c >= 0 }[node.op] }
  }
  return false
}

// ── The executor ────────────────────────────────────────────────────────────
export function runQuery(sql) {
  if (!sql || !sql.trim()) throw qerr('Type a query first.', 'اكتب استعلاماً أولاً.')
  const q = parse(sql)

  // validate FROM + JOIN tables, build alias → columns map
  const aliasCols = {}
  const aliasTable = {}
  const useTable = (ref) => {
    if (!(ref.name in DB)) {
      const s = suggest(ref.name, TABLE_NAMES)
      throw qerr(`Unknown table "${ref.name}".${s ? ` Did you mean "${s}"?` : ''} Tables: ${TABLE_NAMES.join(', ')}.`, `جدول غير معروف "${ref.name}".${s ? ` هل تقصد "${s}"؟` : ''} الجداول: ${TABLE_NAMES.join('، ')}.`)
    }
    if (ref.alias in aliasCols) throw qerr(`Duplicate table name "${ref.alias}". Give one an alias.`, `اسم جدول مكرر "${ref.alias}". أعطِ أحدهما اسماً بديلاً.`)
    aliasCols[ref.alias] = DB[ref.name].columns
    aliasTable[ref.alias] = ref.name
  }
  useTable(q.from)
  q.joins.forEach(j => useTable({ name: j.table, alias: j.alias }))

  // ── validate every column reference against the schema up front, so typos
  //    fail with a clear message even when the result set turns out empty ──
  const checkRef = ref => {
    if (ref.name === '*') { if (ref.table && !(ref.table in aliasCols)) throw qerr(`Unknown table "${ref.table}" in "${ref.table}.*".`, `جدول غير معروف "${ref.table}" في "${ref.table}.*".`); return }
    if (ref.table) {
      if (!(ref.table in aliasCols)) throw qerr(`Unknown table "${ref.table}" in "${ref.table}.${ref.name}".`, `جدول غير معروف "${ref.table}" في "${ref.table}.${ref.name}".`)
      if (!aliasCols[ref.table].includes(ref.name)) { const s = suggest(ref.name, aliasCols[ref.table]); throw qerr(`Unknown column "${ref.name}" in table "${ref.table}".${s ? ` Did you mean "${s}"?` : ''}`, `عمود غير معروف "${ref.name}" في الجدول "${ref.table}".${s ? ` هل تقصد "${s}"؟` : ''}`) }
      return
    }
    const owners = Object.keys(aliasCols).filter(a => aliasCols[a].includes(ref.name))
    if (owners.length === 0) { const s = suggest(ref.name, Object.values(aliasCols).flat()); throw qerr(`Unknown column "${ref.name}".${s ? ` Did you mean "${s}"?` : ''}`, `عمود غير معروف "${ref.name}".${s ? ` هل تقصد "${s}"؟` : ''}`) }
    if (owners.length > 1) throw qerr(`Column "${ref.name}" is ambiguous — it exists in ${owners.join(', ')}. Qualify it like ${owners[0]}.${ref.name}.`, `العمود "${ref.name}" غير محدد — موجود في ${owners.join('، ')}. حدّده هكذا ${owners[0]}.${ref.name}.`)
  }
  const walkVal = node => { if (!node) return; if (node.v === 'col') checkRef(node); else if (node.v === 'agg' && !node.arg.star) checkRef(node.arg.col) }
  const walkBool = node => {
    if (!node) return
    switch (node.b) {
      case 'or': case 'and': walkBool(node.l); walkBool(node.r); break
      case 'not': walkBool(node.expr); break
      case 'truthy': case 'isnull': walkVal(node.expr); break
      case 'like': walkVal(node.expr); walkVal(node.pattern); break
      case 'in': walkVal(node.expr); node.list.forEach(walkVal); break
      case 'between': walkVal(node.expr); walkVal(node.lo); walkVal(node.hi); break
      case 'cmp': walkVal(node.left); walkVal(node.right); break
    }
  }
  q.columns.forEach(item => {
    if (item.kind === 'star') { if (item.table && !(item.table in aliasCols)) throw qerr(`Unknown table "${item.table}" in "${item.table}.*".`, `جدول غير معروف "${item.table}" في "${item.table}.*".`) }
    else if (item.kind === 'col') checkRef({ table: item.table, name: item.name })
    else if (item.kind === 'agg' && !item.arg.star) checkRef(item.arg.col)
  })
  if (q.where) walkBool(q.where)
  q.joins.forEach(j => walkBool(j.on))
  if (q.groupBy) q.groupBy.forEach(checkRef)
  if (q.having) walkBool(q.having)

  // build the row environments, starting from FROM then applying each JOIN.
  // leftAliases tracks every table already joined, so an unmatched RIGHT JOIN can
  // null them out even when the left side collapsed to zero rows.
  let envs = DB[q.from.name].rows.map(r => ({ [q.from.alias]: r }))
  const leftAliases = [q.from.alias]
  for (const j of q.joins) {
    const right = DB[j.table].rows
    const nullRow = Object.fromEntries(DB[j.table].columns.map(c => [c, null]))
    const out = []
    if (j.kind === 'RIGHT') {
      // right join: keep every right row, matched with left envs (or nulls)
      for (const rr of right) {
        let matched = false
        for (const env of envs) { const cand = { ...env, [j.alias]: rr }; if (evalBool(j.on, cand, aliasCols)) { out.push(cand); matched = true } }
        if (!matched) { const base = {}; for (const a of leftAliases) base[a] = null; out.push({ ...base, [j.alias]: rr }) }
      }
    } else {
      for (const env of envs) {
        let matched = false
        for (const rr of right) { const cand = { ...env, [j.alias]: rr }; if (evalBool(j.on, cand, aliasCols)) { out.push(cand); matched = true } }
        if (!matched && j.kind === 'LEFT') out.push({ ...env, [j.alias]: nullRow })
      }
    }
    envs = out
    leftAliases.push(j.alias)
  }

  // WHERE
  const beforeWhere = envs.length
  if (q.where) envs = envs.filter(env => evalBool(q.where, env, aliasCols))
  const matchedByWhere = envs.length   // real post-WHERE row count (before GROUP BY / DISTINCT collapse)

  const multiTable = Object.keys(aliasCols).length > 1

  // expand a star select item → list of {name, ref}
  const expandStar = (table) => {
    const aliases = table ? [table] : Object.keys(aliasCols)
    if (table && !(table in aliasCols)) throw qerr(`Unknown table "${table}" in "${table}.*".`, `جدول غير معروف "${table}" في "${table}.*".`)
    const cols = []
    for (const a of aliases) for (const c of aliasCols[a]) cols.push({ name: multiTable ? `${a}.${c}` : c, ref: { table: a, name: c } })
    return cols
  }

  // figure out the output column list (works even for 0 rows)
  const outCols = []       // { name, kind:'col'|'agg', ref?, node? }
  for (const item of q.columns) {
    if (item.kind === 'star') expandStar(item.table).forEach(c => outCols.push({ name: c.name, kind: 'col', ref: c.ref }))
    else if (item.kind === 'col') { const name = item.alias || (item.table && multiTable ? `${item.table}.${item.name}` : item.name); outCols.push({ name, kind: 'col', ref: { table: item.table, name: item.name } }) }
    else outCols.push({ name: item.alias || item.text, kind: 'agg', node: { v: 'agg', fn: item.fn, arg: item.arg, distinct: item.distinct } })
  }
  const columns = outCols.map(c => c.name)

  const isAggregate = !!q.groupBy || q.columns.some(c => c.kind === 'agg')

  // HAVING filters GROUPS — it only makes sense on a grouped / aggregated query
  if (q.having && !isAggregate) throw qerr('HAVING filters groups — it needs GROUP BY or an aggregate. To filter individual rows, use WHERE.', 'شرط HAVING يُصفّي المجموعات — يحتاج GROUP BY أو دالة تجميعية. لتصفية الصفوف الفردية استخدم WHERE.')

  // strict grouping (like real SQL): every plain selected column must be a GROUP BY key,
  // otherwise its value is ambiguous across the group. Aggregated columns are exempt.
  if (isAggregate) {
    const canon = ref => ref.table ? `${ref.table}.${ref.name}` : `${Object.keys(aliasCols).find(a => aliasCols[a].includes(ref.name)) || ''}.${ref.name}`
    const groupKeys = new Set((q.groupBy || []).map(canon))
    for (const oc of outCols) {
      if (oc.kind !== 'col') continue
      if (!groupKeys.has(canon(oc.ref))) throw qerr(`Column "${oc.ref.name}" must appear in GROUP BY or inside an aggregate like COUNT/SUM/AVG.`, `العمود "${oc.ref.name}" يجب أن يظهر في GROUP BY أو داخل دالة تجميعية مثل COUNT/SUM/AVG.`)
    }
  }

  // build the output records: each { values:{colName->v}, env|group }
  let records = []
  if (isAggregate) {
    // group the envs
    let groups
    if (q.groupBy) {
      const map = new Map()
      for (const env of envs) {
        const key = q.groupBy.map(g => JSON.stringify(resolveCol(g, env, aliasCols))).join('')
        if (!map.has(key)) map.set(key, [])
        map.get(key).push(env)
      }
      groups = [...map.values()]
    } else {
      groups = envs.length ? [envs] : [[]]   // one group over everything (even if empty → one summary row)
    }
    if (q.having) groups = groups.filter(g => g.length && evalBoolG(q.having, g, aliasCols))
    for (const g of groups) {
      if (!g.length) { // empty aggregate (e.g. COUNT over 0 rows) — still emit a row of aggregates
        const values = {}
        outCols.forEach(oc => { values[oc.name] = oc.kind === 'agg' ? (oc.node.fn === 'COUNT' ? 0 : null) : null })
        records.push({ values, group: g }); continue
      }
      const values = {}
      outCols.forEach(oc => { values[oc.name] = oc.kind === 'agg' ? evalAgg(oc.node.fn, oc.node.arg, oc.node.distinct, g, aliasCols) : resolveCol(oc.ref, g[0], aliasCols) })
      records.push({ values, group: g })
    }
  } else {
    for (const env of envs) {
      const values = {}
      outCols.forEach(oc => { values[oc.name] = resolveCol(oc.ref, env, aliasCols) })
      records.push({ values, env })
    }
  }

  // ORDER BY
  if (q.orderBy) {
    // a bare number is a 1-based position into the select list — reject out-of-range
    for (const term of q.orderBy) {
      if (term.expr.v === 'lit') {
        const p = term.expr.value
        if (!(Number.isInteger(p) && p >= 1 && p <= columns.length)) throw qerr(`ORDER BY position "${p}" is not in the select list (1..${columns.length}).`, `الترتيب حسب الموضع "${p}" خارج قائمة الأعمدة (1..${columns.length}).`)
      }
    }
    records = records.slice().sort((ra, rb) => {
      for (const term of q.orderBy) {
        let av, bv
        // ORDER BY <select alias> ?
        const aliasName = term.expr.v === 'col' && !term.expr.table ? term.expr.name : null
        if (aliasName && aliasName in ra.values) { av = ra.values[aliasName]; bv = rb.values[aliasName] }
        else if (term.expr.v === 'lit' && typeof term.expr.value === 'number' && Number.isInteger(term.expr.value) && term.expr.value >= 1 && term.expr.value <= columns.length) {
          const cn = columns[term.expr.value - 1]; av = ra.values[cn]; bv = rb.values[cn]   // ORDER BY <position>
        } else if (isAggregate) { av = evalValueG(term.expr.v === 'col' ? term.expr : term.expr, ra.group, aliasCols); bv = evalValueG(term.expr, rb.group, aliasCols) }
        else { av = evalValue(term.expr, ra.env, aliasCols); bv = evalValue(term.expr, rb.env, aliasCols) }
        const c = cmpVals(av, bv)
        if (c !== 0) return term.dir === 'DESC' ? -c : c
      }
      return 0
    })
  }

  // DISTINCT
  if (q.distinct) {
    const seen = new Set()
    records = records.filter(r => { const k = columns.map(c => JSON.stringify(r.values[c])).join(''); if (seen.has(k)) return false; seen.add(k); return true })
  }

  // LIMIT / OFFSET
  const total = records.length
  if (q.offset) records = records.slice(q.offset)
  if (q.limit != null) records = records.slice(0, q.limit)

  const rows = records.map(r => columns.map(c => r.values[c]))

  // metadata used by the lesson's mission tracker + result header
  const info = {
    fromTable: q.from.name,
    fromCount: DB[q.from.name].rows.length,
    hasWhere: !!q.where,
    hasOrderBy: !!q.orderBy,
    hasGroupBy: !!q.groupBy,
    joinCount: q.joins.length,
    aggregates: q.columns.filter(c => c.kind === 'agg').map(c => c.fn),
    selectStar: q.columns.some(c => c.kind === 'star'),
    selectedCols: q.columns.filter(c => c.kind === 'col').map(c => c.name),
    distinct: !!q.distinct,
    limited: q.limit != null,
    returned: rows.length,
    matchedBeforeLimit: total,
    matchedByWhere,                 // rows kept right after WHERE (pre GROUP BY/DISTINCT)
    whereRemoved: q.where ? beforeWhere - matchedByWhere : 0,
  }
  return { columns, rows, info }
}
