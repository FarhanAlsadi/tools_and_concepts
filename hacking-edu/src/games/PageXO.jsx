// إكس-أو التحدي — team tic-tac-toe: answer a question in 30s to claim a square.
// Fully client-side; questions come from the built-in bank or a saved Live
// Quiz from the trainer's library (localStorage).
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X as XIcon, Circle as OIcon, Clock, CheckCircle2, XCircle,
  RotateCcw, Eye, Play, PartyPopper,
} from 'lucide-react'
import { NAVY, GOLD, OPTION_STYLES, ar } from '../quiz/shared.jsx'
import { BUILTIN_QUESTIONS } from './questionBank'

const QUESTION_SECONDS = 30
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

const TEAMS = {
  X: { color: '#E5484D', soft: '#FEE2E2', Icon: XIcon },
  O: { color: '#2F6FED', soft: '#DBEAFE', Icon: OIcon },
}

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function loadSavedQuizzes() {
  try { return JSON.parse(localStorage.getItem('quiz_saved_quizzes')) || [] } catch { return [] }
}

// ─── 30-second countdown bar ─────────────────────────────────────────────────
function Countdown({ deadline, onTimeout }) {
  const [left, setLeft] = useState(QUESTION_SECONDS)
  const fired = useRef(false)
  useEffect(() => {
    fired.current = false
    const id = setInterval(() => {
      const remaining = Math.max(0, (deadline - Date.now()) / 1000)
      setLeft(remaining)
      if (remaining <= 0 && !fired.current) { fired.current = true; onTimeout() }
    }, 100)
    return () => clearInterval(id)
  }, [deadline, onTimeout])
  const frac = left / QUESTION_SECONDS
  return (
    <div className="flex items-center gap-3 mb-4" dir="ltr">
      <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-100"
          style={{ width: `${frac * 100}%`, background: frac < 0.25 ? '#E5484D' : GOLD }} />
      </div>
      <span className="flex items-center gap-1 font-black tabular-nums text-lg" style={{ color: frac < 0.25 ? '#E5484D' : NAVY }}>
        <Clock className="w-5 h-5" />{ar(Math.ceil(left))}
      </span>
    </div>
  )
}

// ─── question modal ──────────────────────────────────────────────────────────
function QuestionModal({ question, team, onResolve }) {
  const [deadline] = useState(() => Date.now() + QUESTION_SECONDS * 1000)
  const [picked, setPicked] = useState([])         // multi selections
  const [showModel, setShowModel] = useState(false) // open: reveal model answer
  const [result, setResult] = useState(null)        // null | 'correct' | 'wrong'
  const teamInfo = TEAMS[team]

  const finish = (ok) => {
    if (result) return
    setResult(ok ? 'correct' : 'wrong')
    setTimeout(() => onResolve(ok), 1600)
  }

  const answerChoice = (i) => {
    if (question.type === 'multi') {
      setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))
    } else {
      finish(question.correct.includes(i))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(14,31,57,0.75)' }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl"
        dir="rtl"
      >
        {/* whose question */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: teamInfo.color }}>
            <teamInfo.Icon className="w-5 h-5" strokeWidth={3} />
          </span>
          <span className="font-black" style={{ color: NAVY }}>سؤال لفريق {team}</span>
        </div>

        {!result && <Countdown deadline={deadline} onTimeout={() => finish(false)} />}

        <p className="font-black text-xl leading-relaxed mb-5" style={{ color: NAVY }}>{question.text}</p>

        {/* result flash */}
        {result ? (
          <div className="text-center py-6">
            {result === 'correct' ? (
              <>
                <CheckCircle2 className="w-16 h-16 mx-auto mb-2 text-emerald-500" />
                <p className="font-black text-2xl text-emerald-600">إجابة صحيحة — المربع لكم!</p>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 mx-auto mb-2 text-red-500" />
                <p className="font-black text-2xl text-red-600 mb-2">للأسف — الدور ينتقل للفريق الآخر</p>
                {question.options?.length > 0 && question.correct?.length > 0 && (
                  <p className="text-sm font-bold text-slate-500">
                    الإجابة الصحيحة: {question.correct.map((c) => question.options[c]).join(' ، ')}
                  </p>
                )}
              </>
            )}
          </div>
        ) : question.type === 'open' ? (
          /* open question: the trainer judges the spoken answer */
          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-500">الفريق يجيب شفهياً — والمدرب يحكم:</p>
            {question.model && (
              showModel
                ? <p className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm font-bold text-emerald-700">الإجابة النموذجية: {question.model}</p>
                : <button onClick={() => setShowModel(true)} className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-slate-600">
                    <Eye className="w-4 h-4" /> إظهار الإجابة النموذجية
                  </button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => finish(true)} className="py-4 rounded-2xl font-black text-white text-lg" style={{ background: '#1F9D63' }}>
                إجابة صحيحة ✓
              </button>
              <button onClick={() => finish(false)} className="py-4 rounded-2xl font-black text-white text-lg" style={{ background: '#E5484D' }}>
                إجابة خاطئة ✗
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`grid gap-3 ${question.options.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {question.options.map((option, i) => {
                const { bg, Icon } = OPTION_STYLES[i % OPTION_STYLES.length]
                const selected = picked.includes(i)
                return (
                  <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => answerChoice(i)}
                    className="rounded-2xl p-4 min-h-[64px] text-white font-bold text-base flex items-center gap-3 text-start shadow-md"
                    style={{ background: bg, outline: selected ? `4px solid ${NAVY}` : 'none' }}>
                    <Icon className="w-5 h-5 shrink-0" fill="white" />
                    <span className="leading-snug">{option}</span>
                  </motion.button>
                )
              })}
            </div>
            {question.type === 'multi' && (
              <button onClick={() => picked.length && finish([...picked].sort().join() === [...question.correct].sort().join())}
                disabled={!picked.length}
                className="w-full mt-3 py-4 rounded-2xl font-black text-white text-lg disabled:opacity-40" style={{ background: NAVY }}>
                تأكيد الإجابة ({ar(picked.length)})
              </button>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────
export default function PageXO() {
  const savedQuizzes = useMemo(loadSavedQuizzes, [])
  const [screen, setScreen] = useState('setup') // setup | game
  const [source, setSource] = useState('builtin')
  const [board, setBoard] = useState(Array(9).fill(null))
  const [turn, setTurn] = useState('X')
  const [wins, setWins] = useState({ X: 0, O: 0 })
  const [activeCell, setActiveCell] = useState(null)  // cell index being contested
  const [question, setQuestion] = useState(null)
  const [roundOver, setRoundOver] = useState(null)    // null | {winner:'X'|'O'|'draw', line}
  const deck = useRef([])

  const questionPool = useMemo(() => {
    if (source === 'builtin') return BUILTIN_QUESTIONS
    const quiz = savedQuizzes[Number(source)]
    return quiz?.questions?.length ? quiz.questions : BUILTIN_QUESTIONS
  }, [source, savedQuizzes])

  const nextQuestion = () => {
    if (!deck.current.length) deck.current = shuffle(questionPool)
    return deck.current.pop()
  }

  const startRound = (resetWins) => {
    deck.current = shuffle(questionPool)
    setBoard(Array(9).fill(null))
    setTurn('X')
    setActiveCell(null); setQuestion(null); setRoundOver(null)
    if (resetWins) setWins({ X: 0, O: 0 })
    setScreen('game')
  }

  const clickCell = (i) => {
    if (board[i] || activeCell !== null || roundOver) return
    setActiveCell(i)
    setQuestion(nextQuestion())
  }

  const resolve = (correct) => {
    const i = activeCell
    setActiveCell(null); setQuestion(null)
    let next = board
    if (correct && i !== null) {
      next = [...board]; next[i] = turn
      setBoard(next)
      const line = WIN_LINES.find((l) => l.every((c) => next[c] === turn))
      if (line) {
        setWins((w) => ({ ...w, [turn]: w[turn] + 1 }))
        setRoundOver({ winner: turn, line })
        return
      }
      if (next.every(Boolean)) { setRoundOver({ winner: 'draw' }); return }
    }
    setTurn((t) => (t === 'X' ? 'O' : 'X'))
  }

  // ─── setup ───
  if (screen === 'setup') {
    return (
      <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: TEAMS.X.color }}><XIcon className="w-7 h-7" strokeWidth={3} /></span>
              <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: TEAMS.O.color }}><OIcon className="w-7 h-7" strokeWidth={3} /></span>
            </div>
            <h1 className="text-2xl font-black mb-1" style={{ color: NAVY }}>إكس-أو التحدي</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              فريقان يتناوبان — لوضع علامتك في المربع أجب على السؤال خلال {ar(QUESTION_SECONDS)} ثانية.
              إجابة خاطئة أو انتهاء الوقت؟ لا علامة، والدور ينتقل!
            </p>
          </div>

          <label className="block text-sm font-black mb-2" style={{ color: NAVY }}>مصدر الأسئلة</label>
          <select value={source} onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-bold bg-white focus:outline-none focus:border-amber-400 mb-6">
            <option value="builtin">بنك الأسئلة الجاهز ({ar(BUILTIN_QUESTIONS.length)} سؤال أمن سيبراني)</option>
            {savedQuizzes.map((quiz, i) => (
              <option key={i} value={i}>{quiz.title || 'بدون اسم'} ({ar(quiz.questions.length)} سؤال)</option>
            ))}
          </select>

          <button onClick={() => startRound(true)}
            className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2" style={{ background: GOLD, color: NAVY }}>
            <Play className="w-5 h-5" /> ابدأ اللعبة
          </button>
          {savedQuizzes.length === 0 && (
            <p className="text-xs text-slate-400 font-bold text-center mt-3">
              💡 يمكنك أيضاً استخدام أسئلة مسابقاتك المحفوظة من لوحة المدرب
            </p>
          )}
        </div>
      </div>
    )
  }

  // ─── game ───
  const teamInfo = TEAMS[turn]
  return (
    <div className="min-h-[calc(100vh-48px)] px-4 py-6" dir="rtl">
      <div className="max-w-2xl mx-auto">

        {/* scoreboard */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {['X', 'O'].map((team) => {
            const info = TEAMS[team]
            const active = turn === team && !roundOver
            return (
              <div key={team} className="flex items-center gap-3 rounded-2xl px-5 py-3 border-2 transition-all"
                style={{ background: active ? info.soft : 'white', borderColor: active ? info.color : '#E2E8F0', transform: active ? 'scale(1.05)' : 'scale(1)' }}>
                <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: info.color }}>
                  <info.Icon className="w-5 h-5" strokeWidth={3} />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-400">فريق {team}</p>
                  <p className="font-black text-lg leading-none" style={{ color: NAVY }}>{ar(wins[team])} فوز</p>
                </div>
              </div>
            )
          })}
        </div>

        {!roundOver && (
          <p className="text-center font-black mb-4" style={{ color: teamInfo.color }}>
            دور فريق {turn} — اختاروا مربعاً
          </p>
        )}

        {/* board */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-6">
          {board.map((cell, i) => {
            const inWinLine = roundOver?.line?.includes(i)
            const CellIcon = cell ? TEAMS[cell].Icon : null
            return (
              <button key={i} onClick={() => clickCell(i)}
                disabled={!!cell || activeCell !== null || !!roundOver}
                className="aspect-square rounded-2xl border-2 flex items-center justify-center transition-all disabled:cursor-default"
                style={{
                  background: cell ? TEAMS[cell].soft : 'white',
                  borderColor: inWinLine ? GOLD : cell ? TEAMS[cell].color : '#E2E8F0',
                  borderWidth: inWinLine ? 4 : 2,
                  boxShadow: cell ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                {CellIcon
                  ? <CellIcon className="w-14 h-14" strokeWidth={3} style={{ color: TEAMS[cell].color }} />
                  : <span className="text-slate-200 font-black text-2xl">؟</span>}
              </button>
            )
          })}
        </div>

        <div className="text-center">
          <button onClick={() => setScreen('setup')} className="text-sm font-bold text-slate-400 hover:text-slate-600 underline">
            إنهاء والعودة للإعدادات
          </button>
        </div>
      </div>

      {/* question modal */}
      <AnimatePresence>
        {question && activeCell !== null && (
          <QuestionModal key={activeCell} question={question} team={turn} onResolve={resolve} />
        )}
      </AnimatePresence>

      {/* round-over overlay */}
      <AnimatePresence>
        {roundOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(14,31,57,0.75)' }}>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full" dir="rtl">
              {roundOver.winner === 'draw' ? (
                <>
                  <p className="text-5xl mb-3">🤝</p>
                  <h2 className="font-black text-2xl mb-1" style={{ color: NAVY }}>تعادل!</h2>
                </>
              ) : (
                <>
                  <PartyPopper className="w-14 h-14 mx-auto mb-2" style={{ color: GOLD }} />
                  <h2 className="font-black text-3xl mb-1" style={{ color: TEAMS[roundOver.winner].color }}>
                    فاز فريق {roundOver.winner}!
                  </h2>
                </>
              )}
              <p className="text-sm font-bold text-slate-400 mb-6">
                النتيجة: فريق X {ar(wins.X)} — فريق O {ar(wins.O)}
              </p>
              <div className="flex gap-3">
                <button onClick={() => startRound(false)}
                  className="flex-1 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2" style={{ background: GOLD, color: NAVY }}>
                  <RotateCcw className="w-5 h-5" /> جولة جديدة
                </button>
                <button onClick={() => setScreen('setup')}
                  className="flex-1 py-3.5 rounded-2xl font-black text-white" style={{ background: NAVY }}>
                  إنهاء اللعبة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
