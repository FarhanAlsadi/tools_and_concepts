// Live Quiz — trainer page: PIN gate -> quiz library -> editor -> live hosting.
import { useRef, useState } from 'react'
import {
  Lock, Plus, Play, Pencil, Trash2, FileSpreadsheet, Download,
  Loader2, ShieldCheck, Gamepad2,
} from 'lucide-react'
import { apiPost, errMsg } from './api'
import { NAVY, GOLD, TYPE_LABELS, ar, newQuestion, packQuiz } from './shared.jsx'
import QuizEditor from './QuizEditor'
import HostGame from './HostGame'
import { downloadTemplate, parseWorkbook } from './xlsxUtils'

const QUIZZES_KEY = 'quiz_saved_quizzes'
const HOSTING_KEY = 'quiz_hosting' // survives a refresh of the host screen

const loadQuizzes = () => {
  try { return JSON.parse(localStorage.getItem(QUIZZES_KEY)) || [] } catch { return [] }
}
const persistQuizzes = (list) => localStorage.setItem(QUIZZES_KEY, JSON.stringify(list))

export default function PageHost() {
  const [pin, setPin] = useState('')
  const [pinOk, setPinOk] = useState(false)
  const [pinError, setPinError] = useState('')
  const [checking, setChecking] = useState(false)

  const [quizzes, setQuizzes] = useState(loadQuizzes)
  const [view, setView] = useState('library') // library | editor | hosting
  const [editing, setEditing] = useState(null) // { index, quiz }
  const [hosting, setHosting] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(HOSTING_KEY)) || null } catch { return null }
  })
  const [hostError, setHostError] = useState('')
  const [importReport, setImportReport] = useState(null)
  const fileRef = useRef(null)

  const saveQuizzes = (list) => { setQuizzes(list); persistQuizzes(list) }

  // ── PIN gate ──
  const verifyPin = async () => {
    setChecking(true); setPinError('')
    const res = await apiPost('/host/verify', { pin })
    setChecking(false)
    if (res.ok) setPinOk(true)
    else setPinError(errMsg(res.error))
  }

  // ── hosting ──
  const hostQuiz = async (quiz) => {
    setHostError('')
    const res = await apiPost('/host', { pin, quiz: packQuiz(quiz) })
    if (!res.ok) { setHostError(errMsg(res.error)); return }
    const h = { code: res.code, token: res.host_token }
    sessionStorage.setItem(HOSTING_KEY, JSON.stringify(h))
    setHosting(h); setView('hosting')
  }
  const exitHosting = () => {
    sessionStorage.removeItem(HOSTING_KEY)
    setHosting(null); setView('library')
  }

  // ── import ──
  const importFile = async (file) => {
    if (!file) return
    try {
      const { questions, errors } = await parseWorkbook(await file.arrayBuffer())
      if (questions.length) {
        const title = file.name.replace(/\.(xlsx|xls|csv)$/i, '')
        saveQuizzes([...quizzes, { title, questions }])
      }
      setImportReport({ added: questions.length, errors })
    } catch {
      setImportReport({ added: 0, errors: ['تعذّر قراءة الملف — تأكد أنه بصيغة Excel (.xlsx)'] })
    }
  }

  // ─── resumed or live hosting screen ───
  if (hosting) {
    return (
      <div className="min-h-[calc(100vh-48px)]" dir="rtl">
        <HostGame code={hosting.code} token={hosting.token} onExit={exitHosting} />
      </div>
    )
  }

  // ─── PIN gate ───
  if (!pinOk) {
    return (
      <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4" dir="rtl">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: NAVY }}>
            <Lock className="w-8 h-8" style={{ color: GOLD }} />
          </div>
          <h1 className="text-2xl font-black mb-1" style={{ color: NAVY }}>لوحة المدرب</h1>
          <p className="text-sm text-slate-500 mb-6">اكتب رمز المدرب للمتابعة</p>
          <input
            type="password" value={pin} onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && pin && verifyPin()}
            placeholder="رمز المدرب" dir="ltr"
            className="w-full text-center text-2xl font-black tracking-widest rounded-2xl border-2 border-slate-200 py-3 mb-4 focus:outline-none focus:border-amber-400"
          />
          {pinError && <p className="text-sm font-bold text-red-600 mb-3">{pinError}</p>}
          <button onClick={verifyPin} disabled={!pin || checking}
            className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: GOLD, color: NAVY }}>
            {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> دخول</>}
          </button>
        </div>
      </div>
    )
  }

  // ─── editor ───
  if (view === 'editor' && editing) {
    return (
      <div className="min-h-[calc(100vh-48px)]" dir="rtl">
        <QuizEditor
          initial={editing.quiz}
          onBack={() => { setEditing(null); setView('library') }}
          onSave={(quiz) => {
            const list = [...quizzes]
            if (editing.index === -1) list.push(quiz)
            else list[editing.index] = quiz
            saveQuizzes(list)
            setEditing(null); setView('library')
          }}
        />
      </div>
    )
  }

  // ─── library ───
  return (
    <div className="min-h-[calc(100vh-48px)]" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-1">
          <Gamepad2 className="w-7 h-7" style={{ color: GOLD }} />
          <h1 className="text-2xl font-black" style={{ color: NAVY }}>مسابقاتي</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">جهّز الأسئلة هنا ثم استضف لعبة مباشرة — المسابقات تُحفظ على هذا الجهاز</p>

        {/* actions */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => { setEditing({ index: -1, quiz: { title: '', questions: [newQuestion()] } }); setView('editor') }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm" style={{ background: GOLD, color: NAVY }}>
            <Plus className="w-4 h-4" /> مسابقة جديدة
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm bg-white border border-slate-200 hover:border-amber-400" style={{ color: NAVY }}>
            <FileSpreadsheet className="w-4 h-4" /> استيراد من Excel
          </button>
          <button onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm bg-white border border-slate-200 hover:border-amber-400" style={{ color: NAVY }}>
            <Download className="w-4 h-4" /> تحميل قالب الأسئلة
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={(e) => { importFile(e.target.files?.[0]); e.target.value = '' }} />
        </div>

        {/* import report */}
        {importReport && (
          <div className="rounded-2xl border p-4 mb-6"
            style={{ background: importReport.errors.length ? '#FFFBEB' : '#ECFDF5', borderColor: importReport.errors.length ? '#FCD34D' : '#6EE7B7' }}>
            <p className="font-black text-sm mb-1" style={{ color: NAVY }}>
              تم استيراد {ar(importReport.added)} سؤال
              {importReport.errors.length > 0 && ` — و${ar(importReport.errors.length)} صف لم يُفهم:`}
            </p>
            {importReport.errors.slice(0, 8).map((e, i) => (
              <p key={i} className="text-xs font-bold text-amber-700">• {e}</p>
            ))}
            <button onClick={() => setImportReport(null)} className="text-xs font-bold text-slate-400 underline mt-2">إخفاء</button>
          </div>
        )}

        {hostError && <p className="text-sm font-bold text-red-600 mb-4">{hostError}</p>}

        {/* quiz list */}
        {quizzes.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl">
            لا توجد مسابقات بعد — أنشئ واحدة أو استورد ملف Excel
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz, i) => {
              const counts = quiz.questions.reduce((acc, q) => {
                acc[q.type] = (acc[q.type] || 0) + 1; return acc
              }, {})
              return (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg truncate" style={{ color: NAVY }}>{quiz.title || 'بدون اسم'}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                      {ar(quiz.questions.length)} سؤال — {Object.entries(counts).map(([t, n]) => `${TYPE_LABELS[t]}: ${ar(n)}`).join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => hostQuiz(quiz)} title="استضافة الآن"
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-sm text-white" style={{ background: NAVY }}>
                      <Play className="w-4 h-4" /> استضف
                    </button>
                    <button onClick={() => { setEditing({ index: i, quiz: JSON.parse(JSON.stringify(quiz)) }); setView('editor') }}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50" title="تعديل">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => window.confirm(`حذف «${quiz.title}»؟`) && saveQuizzes(quizzes.filter((_, x) => x !== i))}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50" title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
