import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'
import { DB, runQuery } from '../utils/sqldb'

/* ────────────────────────────────────────────────────────────────────────────
   HOW SQL DATABASES WORK
   A real (tiny, dependency-free) SQL engine runs the student's queries against
   three linked in-memory tables. The results are genuinely computed row by row.
   A mission tracker turns the seven core SQL concepts into a guided discovery
   path — click a mission to load a ready example, run it, and the concept ticks.
   ──────────────────────────────────────────────────────────────────────────── */

// column badges per table (PK / FK markers)
const PK = { students: 'id', courses: 'id', enrollments: 'id' }
const FK = { enrollments: { student_id: 'students.id', course_id: 'courses.id' } }

// the seven guided missions — each maps to one SQL concept, with a ready example
const MISSIONS = [
  {
    id: 'all', ar: 'اعرض كل الطلاب', en: 'Show every student',
    ex: 'SELECT * FROM students',
    // every student must actually be DISPLAYED (so LIMIT 1 doesn't count)
    check: i => i.fromTable === 'students' && i.joinCount === 0 && !i.hasGroupBy && i.aggregates.length === 0 && i.returned === DB.students.rows.length,
  },
  {
    id: 'project', ar: 'اختر أعمدة محددة فقط', en: 'Pick specific columns',
    ex: 'SELECT name, city, grade FROM students',
    // a PURE projection — so the sort/filter/join examples don't incidentally tick this
    check: i => !i.selectStar && i.selectedCols.length >= 2 && i.aggregates.length === 0 && !i.hasGroupBy && !i.hasOrderBy && !i.hasWhere && i.joinCount === 0 && i.returned >= 1,
  },
  {
    id: 'filter', ar: 'رشِّح الصفوف بـ WHERE', en: 'Filter rows with WHERE',
    ex: "SELECT name, age FROM students WHERE age > 20",
    // WHERE must genuinely drop rows (not just look small after GROUP BY/DISTINCT)
    check: i => i.hasWhere && i.joinCount === 0 && i.whereRemoved > 0,
  },
  {
    id: 'sort', ar: 'رتّب النتائج بـ ORDER BY', en: 'Sort results with ORDER BY',
    ex: 'SELECT name, grade FROM students ORDER BY grade DESC',
    check: i => i.hasOrderBy && i.returned >= 2,
  },
  {
    id: 'agg', ar: 'لخّص بـ COUNT / AVG / SUM', en: 'Summarize with an aggregate',
    ex: 'SELECT COUNT(*), AVG(grade) FROM students',
    check: i => i.aggregates.length >= 1,
  },
  {
    id: 'group', ar: 'اجمع الصفوف بـ GROUP BY', en: 'Group rows with GROUP BY',
    ex: 'SELECT city, COUNT(*) FROM students GROUP BY city',
    check: i => i.hasGroupBy && i.returned >= 2,
  },
  {
    id: 'join', ar: 'اربط الجداول بـ JOIN', en: 'Combine tables with JOIN',
    ex: 'SELECT students.name, courses.title, enrollments.score\nFROM enrollments\nJOIN students ON enrollments.student_id = students.id\nJOIN courses ON enrollments.course_id = courses.id',
    check: i => i.joinCount >= 1 && i.returned >= 1,
  },
]

// a small free-exploration cookbook
const EXAMPLES = [
  { ar: 'كل الطلاب', en: 'All students', q: 'SELECT * FROM students' },
  { ar: 'طلاب الدوحة', en: 'Students in Doha', q: "SELECT name, age, grade FROM students WHERE city = 'Doha'" },
  { ar: 'الأعلى درجةً', en: 'Top 3 by grade', q: 'SELECT name, grade FROM students ORDER BY grade DESC LIMIT 3' },
  { ar: 'اسم يبدأ بـ A', en: "Name starts with 'A'", q: "SELECT name FROM students WHERE name LIKE 'A%'" },
  { ar: 'عدد الطلاب بكل مدينة', en: 'Count per city', q: 'SELECT city, COUNT(*) AS students FROM students GROUP BY city' },
  { ar: 'متوسط الدرجة لكل مدينة', en: 'Avg grade per city', q: 'SELECT city, AVG(grade) AS avg_grade FROM students GROUP BY city ORDER BY avg_grade DESC' },
  { ar: 'الكورسات المبتدئة', en: 'Beginner courses', q: "SELECT title, instructor, credits FROM courses WHERE level = 'Beginner'" },
  { ar: 'من يدرس ماذا؟ (ربط)', en: 'Who studies what? (JOIN)', q: 'SELECT students.name, courses.title, enrollments.score\nFROM enrollments\nJOIN students ON enrollments.student_id = students.id\nJOIN courses ON enrollments.course_id = courses.id\nORDER BY enrollments.score DESC' },
  { ar: 'عدد المسجّلين بكل كورس', en: 'Enrolled per course', q: 'SELECT courses.title, COUNT(*) AS enrolled\nFROM enrollments JOIN courses ON enrollments.course_id = courses.id\nGROUP BY courses.title ORDER BY enrolled DESC' },
]

export default function PageDatabase() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [query, setQuery] = useState('SELECT * FROM students')
  const [result, setResult] = useState(null)   // { columns, rows, info }
  const [error, setError] = useState(null)      // { en, ar }
  const [ranQuery, setRanQuery] = useState('')  // the query text that produced the current result
  const [done, setDone] = useState(() => new Set())
  const taRef = useRef(null)

  const run = (sqlArg) => {
    const sql = typeof sqlArg === 'string' ? sqlArg : query
    try {
      const res = runQuery(sql)
      setResult(res); setError(null); setRanQuery(sql)
      // tick any newly-satisfied missions
      setDone(prev => {
        const next = new Set(prev)
        MISSIONS.forEach(m => { try { if (m.check(res.info)) next.add(m.id) } catch (e) {} })
        return next
      })
    } catch (e) {
      setResult(null); setError({ en: e.en || e.message, ar: e.ar || e.en || e.message }); setRanQuery(sql)
    }
  }

  const load = (sql) => { setQuery(sql); run(sql); if (taRef.current) taRef.current.focus() }
  const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run() } }

  const allDone = done.size === MISSIONS.length
  const S = { mono: { fontFamily: 'monospace' } }
  const fmt = v => v === null || v === undefined ? <span style={{ color: '#64748b', fontStyle: 'italic' }}>NULL</span> : String(v)

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 14px', fontFamily: 'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{`
        @keyframes db-in { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .db-btn{ border:none;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:800;cursor:pointer;transition:all .15s }
        .db-btn:hover:not(:disabled){ filter:brightness(1.08);transform:translateY(-1px) }
        .db-chip{ font-size:12px;border-radius:9px;padding:7px 11px;cursor:pointer;font-weight:700;transition:all .12s;border:2px solid transparent }
        .db-chip:hover{ transform:translateY(-1px);filter:brightness(1.03) }
        .db-ta{ width:100%;box-sizing:border-box;background:#0b1020;color:#e2e8f0;border:1px solid #334155;border-radius:0 0 12px 12px;
                padding:12px 14px;font-family:monospace;font-size:14px;line-height:1.7;resize:vertical;min-height:96px;outline:none }
        .db-ta:focus{ border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.18) }
        .db-tbl-name{ cursor:pointer }
        .db-tbl-name:hover{ text-decoration:underline }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ background: '#eef2ff', color: '#4338ca', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🗄️ {isAr ? 'قواعد البيانات' : 'Databases'}</span>
        <button onClick={() => navigate('/')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '3px 10px', fontSize: 12, color: '#64748b', cursor: 'pointer' }}>{isAr ? '← الرئيسية' : '← Home'}</button>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: '0 0 4px' }}>🗄️ {isAr ? 'كيف تعمل قواعد البيانات (SQL)' : 'How SQL Databases Work'}</h1>
      <p style={{ fontSize: 13.5, color: '#64748b', margin: '0 0 16px', maxWidth: 820, lineHeight: 1.7 }}>
        {isAr
          ? 'قاعدة بيانات حقيقية مصغّرة بثلاثة جداول مترابطة. اكتب استعلام SQL واضغط «تشغيل» لترى النتيجة تُحسب فعلياً — أكمل المهام السبع لتتقن كل مفهوم.'
          : 'A real mini-database with three linked tables. Write an SQL query and press Run to see the result actually computed — complete the seven missions to master each concept.'}
      </p>

      {/* ── Missions tracker ─────────────────────────────────────────────────── */}
      <div style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: 14, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0e1f39' }}>🎯 {isAr ? 'المهام — أتقِن مفاهيم SQL' : 'Missions — master the SQL concepts'}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: allDone ? '#15803d' : '#6366f1' }}>{done.size} / {MISSIONS.length}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {MISSIONS.map((m, idx) => {
            const ok = done.has(m.id)
            return (
              <button key={m.id} onClick={() => load(m.ex)} className="db-chip" title={isAr ? 'اضغط لتحميل مثال يُكمل هذه المهمة' : 'Click to load an example that completes this'}
                style={{ background: ok ? '#f0fdf4' : '#f8fafc', borderColor: ok ? '#86efac' : '#e2e8f0', color: ok ? '#15803d' : '#475569' }} dir={isAr ? 'rtl' : 'ltr'}>
                <span style={{ marginInlineEnd: 6 }}>{ok ? '✅' : `${idx + 1}.`}</span>{isAr ? m.ar : m.en}
              </button>
            )
          })}
        </div>
        {allDone && (
          <div style={{ marginTop: 12, background: '#052e16', color: '#86efac', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, animation: 'db-in .3s ease' }}>
            🏆 {isAr ? 'أحسنت! أكملت جميع المفاهيم الأساسية في SQL — SELECT و WHERE و ORDER BY والدوال التجميعية و GROUP BY و JOIN.' : 'Well done! You covered every core SQL concept — SELECT, WHERE, ORDER BY, aggregates, GROUP BY and JOIN.'}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        {/* ── Schema browser ─────────────────────────────────────────────────── */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 8 }}>{isAr ? 'الجداول في قاعدة البيانات — اضغط اسم جدول لعرضه' : 'TABLES IN THE DATABASE — click a table name to view it'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {Object.entries(DB).map(([tname, t]) => (
              <div key={tname} style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }} dir="ltr">
                <div onClick={() => load(`SELECT * FROM ${tname}`)} className="db-tbl-name"
                  style={{ background: '#0e1f39', color: 'white', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ ...S.mono, fontSize: 13, fontWeight: 800 }}>📋 {tname}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{t.rows.length} {isAr ? 'صف' : 'rows'}</span>
                </div>
                <div style={{ padding: '8px 12px' }}>
                  {t.columns.map(c => {
                    const isPk = PK[tname] === c
                    const fkTarget = FK[tname] && FK[tname][c]
                    return (
                      <div key={c} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 0', fontSize: 12, ...S.mono }}>
                        <span style={{ color: '#0f172a', fontWeight: isPk ? 800 : 500 }}>
                          {isPk && <span title={isAr ? 'المفتاح الأساسي' : 'primary key'}>🔑 </span>}
                          {fkTarget && <span title={(isAr ? 'مفتاح أجنبي ← ' : 'foreign key → ') + fkTarget}>🔗 </span>}
                          {c}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: 10.5 }}>{t.types[c]}{fkTarget ? ` → ${fkTarget}` : ''}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 11.5, color: '#64748b', lineHeight: 1.6 }}>
            🔗 {isAr
              ? 'جدول enrollments يربط الطلاب بالكورسات: student_id يشير إلى students.id، و course_id يشير إلى courses.id. هذا هو "المفتاح الأجنبي" الذي يجعل قاعدة البيانات "علائقية".'
              : 'The enrollments table links students to courses: student_id points to students.id, and course_id points to courses.id. That “foreign key” is what makes the database “relational”.'}
          </div>
        </div>

        {/* ── Query editor ───────────────────────────────────────────────────── */}
        <div>
          <div style={{ background: '#111a2e', borderRadius: '12px 12px 0 0', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8 }} dir="ltr">
            <span style={{ display: 'flex', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444' }} /><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }} /><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e' }} /></span>
            <span style={{ ...S.mono, fontSize: 11, color: '#94a3b8' }}>{isAr ? 'محرر استعلامات SQL' : 'SQL query editor'}</span>
          </div>
          <textarea ref={taRef} className="db-ta" dir="ltr" spellCheck={false} value={query}
            onChange={e => setQuery(e.target.value)} onKeyDown={onKey}
            placeholder="SELECT * FROM students" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <button onClick={() => run()} className="db-btn" style={{ background: '#0e1f39', color: 'white' }}>▶ {isAr ? 'تشغيل' : 'Run'}</button>
            <button onClick={() => { setQuery(''); setResult(null); setError(null); setRanQuery(''); if (taRef.current) taRef.current.focus() }} className="db-btn" style={{ background: '#f1f5f9', color: '#475569' }}>{isAr ? 'مسح' : 'Clear'}</button>
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>{isAr ? 'أو اضغط Ctrl+Enter' : 'or press Ctrl+Enter'}</span>
          </div>

          {/* ── Results — directly under the query ───────────────────────────── */}
          <div style={{ marginTop: 14 }}>
            {error && (
              <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 12, padding: '12px 14px', animation: 'db-in .2s ease' }} dir={isAr ? 'rtl' : 'ltr'}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#fca5a5', letterSpacing: 1, marginBottom: 6 }}>⚠ {isAr ? 'خطأ SQL' : 'SQL ERROR'}</div>
                <div style={{ ...S.mono, fontSize: 13, color: '#fecaca', lineHeight: 1.6 }}>{isAr ? error.ar : error.en}</div>
              </div>
            )}
            {result && (
              <div style={{ animation: 'db-in .2s ease' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 8 }} dir={isAr ? 'rtl' : 'ltr'}>
                  ⬇ {isAr ? 'النتيجة' : 'RESULT'} — {result.rows.length} {isAr ? (result.rows.length === 1 ? 'صف' : 'صف') : (result.rows.length === 1 ? 'row' : 'rows')}
                  {result.info.limited && result.info.matchedBeforeLimit > result.rows.length && (
                    <span style={{ color: '#a5b4fc' }}> {isAr ? `(من أصل ${result.info.matchedBeforeLimit} صف قبل LIMIT)` : `(of ${result.info.matchedBeforeLimit} before LIMIT)`}</span>
                  )}
                </div>
                <div style={{ background: '#0b1020', borderRadius: 12, padding: 12, border: '1px solid #1e293b' }} dir="ltr">
                  {result.rows.length === 0 ? (
                    <div style={{ ...S.mono, fontSize: 12.5, color: '#94a3b8', padding: '10px 4px' }}>
                      ✔ {isAr ? '٠ صف — الاستعلام صحيح لكنه لم يُطابق أي صف.' : '0 rows — the query is valid but matched nothing.'}
                    </div>
                  ) : (
                    <div style={{ maxHeight: 340, overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', ...S.mono, fontSize: 12.5 }}>
                        <thead>
                          <tr>
                            {result.columns.map((c, ci) => (
                              <th key={ci} style={{ textAlign: 'left', padding: '6px 10px', color: '#c7d2fe', fontSize: 11, fontWeight: 800, position: 'sticky', top: 0, background: '#0b1020', borderBottom: '1px solid #334155', whiteSpace: 'nowrap' }}>{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.rows.map((row, ri) => (
                            <tr key={ri} style={{ background: ri % 2 ? 'transparent' : 'rgba(99,102,241,0.05)' }}>
                              {row.map((v, vi) => (
                                <td key={vi} style={{ padding: '5px 10px', color: '#e2e8f0', borderTop: '1px solid #1e293b', whiteSpace: 'nowrap' }}>{fmt(v)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
            {!result && !error && (
              <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, padding: '16px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                {isAr ? 'اكتب استعلاماً واضغط «تشغيل» لرؤية النتيجة هنا.' : 'Write a query and press Run to see the result here.'}
              </div>
            )}
          </div>

          {/* ── Quick examples ───────────────────────────────────────────────── */}
          <div style={{ marginTop: 16, background: 'white', border: '2px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>⚡ {isAr ? 'أمثلة جاهزة — اضغط لتجربتها' : 'Quick examples — click to try'}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex, i) => (
                <button key={i} onClick={() => load(ex.q)} className="db-chip" style={{ background: '#eef2ff', borderColor: '#c7d2fe', color: '#4338ca' }} dir={isAr ? 'rtl' : 'ltr'}>
                  {isAr ? ex.ar : ex.en}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Explanation — collapsed by default, under the practical part ──────── */}
      <Explanation>
        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.85, maxWidth: 900 }} dir={isAr ? 'rtl' : 'ltr'}>
          {isAr ? (
            <>
              <p style={{ marginTop: 0 }}><b>ما هي قاعدة البيانات العلائقية؟</b> هي مجموعة من <b>الجداول</b>. كل جدول يشبه ورقة Excel: له <b>أعمدة</b> (حقول مثل name و age) و<b>صفوف</b> (كل صف سجل واحد، مثل طالب واحد).</p>
              <p><b>المفتاح الأساسي (Primary Key 🔑):</b> عمود يميّز كل صف بشكل فريد — مثل <code>id</code>. <b>المفتاح الأجنبي (Foreign Key 🔗):</b> عمود يشير إلى مفتاح أساسي في جدول آخر — مثل <code>enrollments.student_id</code> الذي يشير إلى <code>students.id</code>. بهذه الروابط «تتكلم» الجداول مع بعضها.</p>
              <p><b>تشريح جملة SELECT:</b></p>
              <ul style={{ margin: '4px 0', paddingInlineStart: 20 }}>
                <li><code>SELECT</code> — أي أعمدة تريد (أو <code>*</code> لكلها، أو دالة مثل <code>COUNT(*)</code>).</li>
                <li><code>FROM</code> — من أي جدول.</li>
                <li><code>JOIN … ON</code> — ادمج جدولاً آخر بمطابقة مفتاحيهما.</li>
                <li><code>WHERE</code> — أبقِ الصفوف التي تحقق شرطاً (<code>=</code>, <code>&gt;</code>, <code>LIKE</code>, <code>AND/OR</code>).</li>
                <li><code>GROUP BY</code> — اجمع الصفوف المتشابهة في مجموعات لتلخيصها بدالة تجميعية.</li>
                <li><code>ORDER BY</code> — رتّب النتيجة تصاعدياً (ASC) أو تنازلياً (DESC).</li>
                <li><code>LIMIT</code> — خذ أول N صف فقط.</li>
              </ul>
              <p style={{ marginBottom: 0 }}><b>وعلاقتها بالأمن:</b> كل استعلام هنا مبني بأمان. لكن عندما يبني موقعٌ استعلاماً بدمج نصٍّ كتبه المستخدم مباشرةً داخل الجملة، يظهر خطر <b>حقن SQL</b> — وهو ما تجرّبه في درس «حقن SQL».</p>
            </>
          ) : (
            <>
              <p style={{ marginTop: 0 }}><b>What is a relational database?</b> A set of <b>tables</b>. Each table is like an Excel sheet: it has <b>columns</b> (fields such as name and age) and <b>rows</b> (each row is one record, e.g. one student).</p>
              <p><b>Primary key (🔑):</b> a column that uniquely identifies each row — such as <code>id</code>. <b>Foreign key (🔗):</b> a column that points at another table's primary key — e.g. <code>enrollments.student_id</code> points to <code>students.id</code>. These links are how tables “talk” to each other.</p>
              <p><b>Anatomy of a SELECT:</b></p>
              <ul style={{ margin: '4px 0', paddingInlineStart: 20 }}>
                <li><code>SELECT</code> — which columns you want (or <code>*</code> for all, or a function like <code>COUNT(*)</code>).</li>
                <li><code>FROM</code> — which table to read.</li>
                <li><code>JOIN … ON</code> — merge another table by matching their keys.</li>
                <li><code>WHERE</code> — keep only rows that meet a condition (<code>=</code>, <code>&gt;</code>, <code>LIKE</code>, <code>AND/OR</code>).</li>
                <li><code>GROUP BY</code> — bucket similar rows together to summarize them with an aggregate.</li>
                <li><code>ORDER BY</code> — sort the result ascending (ASC) or descending (DESC).</li>
                <li><code>LIMIT</code> — take only the first N rows.</li>
              </ul>
              <p style={{ marginBottom: 0 }}><b>The security tie-in:</b> every query here is built safely. But when a website builds a query by pasting user-typed text straight into it, you get <b>SQL injection</b> — exactly what you exploit in the “SQL Injection” lesson.</p>
            </>
          )}
        </div>
      </Explanation>

      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1d4ed8', background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 10, padding: '10px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          <ChevronLeft size={15} />{isAr ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
