// Live Quiz — trainer's quiz editor (create / edit questions of all types).
import { useState } from 'react'
import {
  Plus, Trash2, Copy, ChevronUp, ChevronDown, ArrowRight,
  CheckCircle2, Circle, Clock, Award,
} from 'lucide-react'
import { NAVY, GOLD, TYPE_LABELS, newQuestion, validateQuiz } from './shared.jsx'

const inputCls =
  'w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:border-amber-400 bg-white'

function QuestionCard({ q, index, total, onChange, onDelete, onDuplicate, onMove }) {
  const set = (patch) => onChange({ ...q, ...patch })

  const setType = (type) => {
    if (type === q.type) return
    const fresh = newQuestion(type)
    onChange({ ...fresh, text: q.text, time: q.time, points: q.points })
  }

  const setOption = (i, text) => {
    const options = [...q.options]; options[i] = text
    set({ options })
  }

  const toggleCorrect = (i) => {
    if (q.type === 'mc' || q.type === 'tf') set({ correct: [i] })
    else if (q.type === 'multi') {
      set({ correct: q.correct.includes(i) ? q.correct.filter((c) => c !== i) : [...q.correct, i].sort() })
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      {/* header row */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white shrink-0" style={{ background: NAVY }}>
          {index + 1}
        </span>
        <select value={q.type} onChange={(e) => setType(e.target.value)}
          className="rounded-xl border-2 border-slate-200 px-2 py-1.5 text-sm font-bold bg-white focus:outline-none">
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <div className="ms-auto flex items-center gap-1 text-slate-400">
          <button onClick={() => onMove(-1)} disabled={index === 0} className="p-1.5 hover:text-slate-700 disabled:opacity-30" title="تحريك لأعلى"><ChevronUp className="w-4 h-4" /></button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} className="p-1.5 hover:text-slate-700 disabled:opacity-30" title="تحريك لأسفل"><ChevronDown className="w-4 h-4" /></button>
          <button onClick={onDuplicate} className="p-1.5 hover:text-slate-700" title="نسخ السؤال"><Copy className="w-4 h-4" /></button>
          <button onClick={onDelete} className="p-1.5 hover:text-red-600" title="حذف السؤال"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* question text */}
      <textarea value={q.text} onChange={(e) => set({ text: e.target.value })}
        rows={2} maxLength={500} placeholder="اكتب نص السؤال…" className={inputCls} />

      {/* options */}
      {(q.type === 'mc' || q.type === 'multi') && (
        <div className="grid sm:grid-cols-2 gap-2 mt-3">
          {q.options.map((option, i) => {
            const isCorrect = q.correct.includes(i)
            return (
              <div key={i} className="flex items-center gap-2">
                <button onClick={() => toggleCorrect(i)} title="الإجابة الصحيحة"
                  className={isCorrect ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-400'}>
                  {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>
                <input value={option} onChange={(e) => setOption(i, e.target.value)}
                  maxLength={200} placeholder={`الخيار ${i + 1}`} className={inputCls} />
                {q.options.length > 2 && (
                  <button onClick={() => set({
                    options: q.options.filter((_, x) => x !== i),
                    correct: q.correct.filter((c) => c !== i).map((c) => (c > i ? c - 1 : c)),
                  })} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            )
          })}
          {q.options.length < 6 && (
            <button onClick={() => set({ options: [...q.options, ''] })}
              className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-slate-600 py-2">
              <Plus className="w-4 h-4" /> إضافة خيار
            </button>
          )}
        </div>
      )}

      {q.type === 'tf' && (
        <div className="flex gap-2 mt-3">
          {['صح', 'خطأ'].map((label, i) => (
            <button key={i} onClick={() => toggleCorrect(i)}
              className="flex-1 py-3 rounded-xl font-black text-base border-2 transition-colors"
              style={q.correct[0] === i
                ? { background: i === 0 ? '#1F9D63' : '#E5484D', color: 'white', borderColor: 'transparent' }
                : { background: 'white', color: '#94A3B8', borderColor: '#E2E8F0' }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {q.type === 'open' && (
        <input value={q.model} onChange={(e) => set({ model: e.target.value })}
          maxLength={500} placeholder="إجابة نموذجية (اختياري — تظهر لك أثناء التقييم)"
          className={`${inputCls} mt-3`} />
      )}

      {/* time + points */}
      <div className="flex items-center gap-4 mt-4 text-sm">
        <label className="flex items-center gap-1.5 font-bold text-slate-500">
          <Clock className="w-4 h-4" />
          <input type="number" min={5} max={300} value={q.time}
            onChange={(e) => set({ time: parseInt(e.target.value, 10) || 20 })}
            className="w-20 rounded-lg border-2 border-slate-200 px-2 py-1 text-center font-bold focus:outline-none" />
          ثانية
        </label>
        <label className="flex items-center gap-1.5 font-bold text-slate-500">
          <Award className="w-4 h-4" />
          <input type="number" min={0} max={10000} step={100} value={q.points}
            onChange={(e) => set({ points: parseInt(e.target.value, 10) || 0 })}
            className="w-24 rounded-lg border-2 border-slate-200 px-2 py-1 text-center font-bold focus:outline-none" />
          نقطة
        </label>
      </div>
    </div>
  )
}

export default function QuizEditor({ initial, onSave, onBack }) {
  const [quiz, setQuiz] = useState(initial)
  const [errors, setErrors] = useState([])

  const updateQuestion = (i, updated) => {
    const questions = [...quiz.questions]; questions[i] = updated
    setQuiz({ ...quiz, questions })
  }
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= quiz.questions.length) return
    const questions = [...quiz.questions]
    ;[questions[i], questions[j]] = [questions[j], questions[i]]
    setQuiz({ ...quiz, questions })
  }

  const save = () => {
    const errs = validateQuiz(quiz)
    setErrors(errs)
    if (!errs.length) onSave({ ...quiz, title: quiz.title.trim() || 'مسابقة' })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" dir="rtl">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-slate-600 mb-4">
        <ArrowRight className="w-4 h-4" /> رجوع للقائمة
      </button>

      <input
        value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value.slice(0, 120) })}
        placeholder="اسم المسابقة…"
        className="w-full bg-transparent text-2xl font-black mb-6 focus:outline-none border-b-2 border-transparent focus:border-amber-400 pb-1"
        style={{ color: NAVY }}
      />

      <div className="space-y-4">
        {quiz.questions.map((q, i) => (
          <QuestionCard
            key={i} q={q} index={i} total={quiz.questions.length}
            onChange={(updated) => updateQuestion(i, updated)}
            onDelete={() => setQuiz({ ...quiz, questions: quiz.questions.filter((_, x) => x !== i) })}
            onDuplicate={() => {
              const questions = [...quiz.questions]
              questions.splice(i + 1, 0, JSON.parse(JSON.stringify(q)))
              setQuiz({ ...quiz, questions })
            }}
            onMove={(dir) => move(i, dir)}
          />
        ))}
      </div>

      <button
        onClick={() => setQuiz({ ...quiz, questions: [...quiz.questions, newQuestion()] })}
        className="w-full mt-4 py-4 rounded-2xl border-2 border-dashed border-slate-300 font-black text-slate-400 hover:border-amber-400 hover:text-amber-500 flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" /> سؤال جديد
      </button>

      {errors.length > 0 && (
        <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-4 space-y-1">
          {errors.map((e, i) => <p key={i} className="text-sm font-bold text-red-600">• {e}</p>)}
        </div>
      )}

      <button onClick={save} className="w-full mt-4 py-4 rounded-2xl font-black text-lg" style={{ background: GOLD, color: NAVY }}>
        حفظ المسابقة
      </button>
    </div>
  )
}
