// Live Quiz — attendee (player) experience. Mobile-first, Arabic RTL.
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gamepad2, Users, CheckCircle2, XCircle, Clock, Trophy, Medal,
  Send, Loader2, PartyPopper,
} from 'lucide-react'
import { apiGet, apiPost, usePoll, noteServerNow, secondsLeft, errMsg } from './api'
import { NAVY, GOLD, OPTION_STYLES, ar } from './shared.jsx'

const SESSION_KEY = 'quiz_player_session'

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null } catch { return null }
}
const saveSession = (s) => localStorage.setItem(SESSION_KEY, JSON.stringify(s))
const clearSession = () => localStorage.removeItem(SESSION_KEY)

// ─── Countdown bar (follows the server clock) ────────────────────────────────
function TimerBar({ endsAt, total }) {
  const [left, setLeft] = useState(() => secondsLeft(endsAt))
  useEffect(() => {
    const id = setInterval(() => setLeft(secondsLeft(endsAt)), 100)
    return () => clearInterval(id)
  }, [endsAt])
  const frac = total ? Math.min(left / total, 1) : 0
  return (
    <div className="flex items-center gap-3" dir="ltr">
      <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-100"
          style={{ width: `${frac * 100}%`, background: frac < 0.25 ? '#E5484D' : GOLD }} />
      </div>
      <span className="flex items-center gap-1 text-sm font-black tabular-nums" style={{ color: NAVY }}>
        <Clock className="w-4 h-4" />{ar(Math.ceil(left))}
      </span>
    </div>
  )
}

// ─── Answer widgets per question type ────────────────────────────────────────
function AnswerButtons({ question, onAnswer }) {
  const [picked, setPicked] = useState([]) // multi selections
  const [text, setText] = useState('')

  if (question.type === 'open') {
    return (
      <div className="space-y-3">
        <textarea
          value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={500}
          placeholder="اكتب إجابتك هنا…"
          className="w-full rounded-2xl border-2 border-slate-200 p-4 text-base focus:outline-none"
          style={{ borderColor: text ? GOLD : undefined }}
        />
        <button
          onClick={() => text.trim() && onAnswer({ text: text.trim() })}
          disabled={!text.trim()}
          className="w-full py-4 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: NAVY }}
        >
          <Send className="w-5 h-5" /> إرسال الإجابة
        </button>
      </div>
    )
  }

  const isMulti = question.type === 'multi'
  const toggle = (i) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))

  return (
    <div className="space-y-3">
      <div className={`grid gap-3 ${question.options.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {question.options.map((option, i) => {
          const { bg, Icon } = OPTION_STYLES[i % OPTION_STYLES.length]
          const selected = picked.includes(i)
          return (
            <motion.button
              key={i} whileTap={{ scale: 0.95 }}
              onClick={() => (isMulti ? toggle(i) : onAnswer({ choice: i }))}
              className="rounded-2xl p-4 min-h-[76px] text-white font-bold text-base flex items-center gap-3 text-start shadow-md"
              style={{ background: bg, outline: selected ? `4px solid ${NAVY}` : 'none' }}
            >
              <Icon className="w-6 h-6 shrink-0" fill="white" />
              <span className="leading-snug">{option}</span>
              {isMulti && selected && <CheckCircle2 className="w-5 h-5 ms-auto shrink-0" />}
            </motion.button>
          )
        })}
      </div>
      {isMulti && (
        <button
          onClick={() => picked.length && onAnswer({ choices: picked })}
          disabled={!picked.length}
          className="w-full py-4 rounded-2xl font-black text-white text-lg disabled:opacity-40"
          style={{ background: NAVY }}
        >
          إرسال ({ar(picked.length)})
        </button>
      )}
    </div>
  )
}

// ─── Phase screens ───────────────────────────────────────────────────────────
function CenterCard({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8 text-center"
    >
      {children}
    </motion.div>
  )
}

function RankBadge({ rank }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  return <span className="text-2xl">{medals[rank] || `#${ar(rank)}`}</span>
}

export default function PagePlay() {
  const [session, setSession] = useState(loadSession)
  const [code, setCode] = useState(session?.code || '')
  const [name, setName] = useState(session?.name || '')
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)
  const [state, setState] = useState(null)
  const inGame = !!session

  // ── join ──
  const join = async () => {
    setJoining(true); setJoinError('')
    const res = await apiPost('/join', {
      code: code.trim(), name: name.trim(),
      player_id: session?.code === code.trim() ? session?.player_id : undefined,
    })
    setJoining(false)
    if (!res.ok) { setJoinError(errMsg(res.error)); return }
    const s = { code: code.trim(), player_id: res.player_id, name: res.name }
    saveSession(s); setSession(s); setState(null)
  }

  const leave = () => { clearSession(); setSession(null); setState(null) }

  // ── game state polling ──
  usePoll(async () => {
    if (!inGame) return
    const res = await apiGet('/state', { code: session.code, player_id: session.player_id })
    if (res.ok) { noteServerNow(res.server_now); setState(res) }
    else if (res.error === 'no_such_game' || res.error === 'no_such_player') {
      setJoinError(errMsg(res.error)); leave()
    }
  }, 1000, inGame)

  const answer = async (payload) => {
    // Optimistic: flip to "answered" immediately so the UI feels instant.
    setState((s) => (s ? { ...s, answered: true } : s))
    await apiPost('/answer', { code: session.code, player_id: session.player_id, ...payload })
  }

  const phase = state?.phase
  const question = state?.question
  // Remount answer widgets on every new question so local picks reset.
  const qKey = useMemo(() => `${session?.code}-${state?.q_index}`, [session?.code, state?.q_index])

  // ─── join screen ───
  if (!inGame) {
    return (
      <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4" dir="rtl">
        <div className="w-full max-w-sm">
          <CenterCard>
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: NAVY }}>
              <Gamepad2 className="w-8 h-8" style={{ color: GOLD }} />
            </div>
            <h1 className="text-2xl font-black mb-1" style={{ color: NAVY }}>انضم للمسابقة</h1>
            <p className="text-sm text-slate-500 mb-6">اكتب الرمز الظاهر على شاشة المدرب</p>
            <input
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric" placeholder="رمز اللعبة" dir="ltr"
              className="w-full text-center text-3xl font-black tracking-[0.4em] rounded-2xl border-2 border-slate-200 py-3 mb-3 focus:outline-none focus:border-amber-400"
            />
            <input
              value={name} onChange={(e) => setName(e.target.value.slice(0, 20))}
              placeholder="اسمك المستعار" maxLength={20}
              className="w-full text-center text-lg font-bold rounded-2xl border-2 border-slate-200 py-3 mb-4 focus:outline-none focus:border-amber-400"
            />
            {joinError && <p className="text-sm font-bold text-red-600 mb-3">{joinError}</p>}
            <button
              onClick={join} disabled={joining || code.length !== 6 || name.trim().length < 2}
              className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: GOLD, color: NAVY }}
            >
              {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ادخل اللعبة'}
            </button>
          </CenterCard>
        </div>
      </div>
    )
  }

  // ─── in-game header ───
  return (
    <div className="min-h-[calc(100vh-48px)]" dir="rtl">
      <div className="text-white px-4 py-2.5 flex items-center justify-between text-sm" style={{ background: NAVY }}>
        <span className="font-bold truncate">{state?.title || '…'}</span>
        <div className="flex items-center gap-4">
          <span className="font-black" style={{ color: GOLD }}>{ar(state?.score ?? 0)} نقطة</span>
          <span className="opacity-70">{session.name}</span>
          <button onClick={leave} className="opacity-60 hover:opacity-100 underline">خروج</button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">

          {/* lobby */}
          {phase === 'lobby' && (
            <motion.div key="lobby" exit={{ opacity: 0 }}>
              <CenterCard>
                <div className="text-5xl mb-3">🎮</div>
                <h2 className="text-xl font-black mb-2" style={{ color: NAVY }}>أنت داخل اللعبة!</h2>
                <p className="text-slate-500 text-sm mb-4">انتظر المدرب حتى يبدأ المسابقة…</p>
                <div className="inline-flex items-center gap-2 text-sm font-bold rounded-full px-4 py-2 bg-slate-100" style={{ color: NAVY }}>
                  <Users className="w-4 h-4" /> {ar(state.players_count)} متسابق
                </div>
              </CenterCard>
            </motion.div>
          )}

          {/* question */}
          {phase === 'question' && question && (
            <motion.div key={`q-${qKey}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-400">
                <span>سؤال {ar(state.q_index + 1)} من {ar(state.q_total)}</span>
                <span>{ar(question.points)} نقطة</span>
              </div>
              <TimerBar endsAt={state.ends_at} total={question.time} />
              <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-5 my-4">
                <p className="text-lg font-black leading-relaxed" style={{ color: NAVY }}>{question.text}</p>
              </div>
              {state.answered ? (
                <CenterCard>
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                  <p className="font-black text-lg" style={{ color: NAVY }}>تم استلام إجابتك!</p>
                  <p className="text-sm text-slate-500 mt-1">كلما أجبت أسرع، كسبت نقاطاً أكثر ⚡</p>
                </CenterCard>
              ) : (
                <AnswerButtons key={qKey} question={question} onAnswer={answer} />
              )}
            </motion.div>
          )}

          {/* grading (open questions) */}
          {phase === 'grading' && (
            <motion.div key="grading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CenterCard>
                <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin" style={{ color: GOLD }} />
                <p className="font-black text-lg" style={{ color: NAVY }}>المدرب يقيّم الإجابات الآن…</p>
                <p className="text-sm text-slate-500 mt-1">النقاط على الطريق 👀</p>
              </CenterCard>
            </motion.div>
          )}

          {/* reveal */}
          {phase === 'reveal' && (
            <motion.div key={`r-${qKey}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <CenterCard>
                {!state.my_answer ? (
                  <>
                    <Clock className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="font-black text-lg" style={{ color: NAVY }}>لم تجب في الوقت المحدد</p>
                  </>
                ) : state.my_answer.correct ? (
                  <>
                    <CheckCircle2 className="w-14 h-14 mx-auto mb-3 text-emerald-500" />
                    <p className="font-black text-2xl text-emerald-600 mb-1">إجابة صحيحة!</p>
                    <p className="font-black text-lg" style={{ color: NAVY }}>+{ar(state.my_answer.points)} نقطة</p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-14 h-14 mx-auto mb-3 text-red-500" />
                    <p className="font-black text-2xl text-red-600 mb-1">
                      {state.question?.type === 'open' ? 'بدون نقاط هذه المرة' : 'إجابة خاطئة'}
                    </p>
                  </>
                )}
                {state.correct?.length > 0 && state.question?.options?.length > 0 && (
                  <p className="text-sm text-slate-500 mt-3">
                    الإجابة الصحيحة: <b style={{ color: NAVY }}>
                      {state.correct.map((c) => state.question.options[c]).join(' ، ')}
                    </b>
                  </p>
                )}
                <p className="text-sm font-bold mt-4 rounded-full inline-block px-4 py-1.5 bg-slate-100" style={{ color: NAVY }}>
                  رصيدك: {ar(state.score)} نقطة
                </p>
              </CenterCard>
            </motion.div>
          )}

          {/* leaderboard */}
          {phase === 'leaderboard' && (
            <motion.div key={`l-${qKey}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <CenterCard>
                <Trophy className="w-10 h-10 mx-auto mb-2" style={{ color: GOLD }} />
                <h2 className="font-black text-xl mb-4" style={{ color: NAVY }}>الترتيب الحالي</h2>
                <div className="space-y-2 text-start">
                  {(state.leaderboard || []).map((row) => (
                    <div key={row.id}
                      className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                      style={{ background: row.id === session.player_id ? '#FEF3C7' : '#F8FAFC' }}>
                      <RankBadge rank={row.rank} />
                      <span className="font-bold flex-1 truncate" style={{ color: NAVY }}>{row.name}</span>
                      <span className="font-black tabular-nums" style={{ color: NAVY }}>{ar(row.score)}</span>
                    </div>
                  ))}
                </div>
                {state.my_rank > 5 && (
                  <p className="text-sm font-bold text-slate-500 mt-3">ترتيبك: #{ar(state.my_rank)}</p>
                )}
              </CenterCard>
            </motion.div>
          )}

          {/* podium */}
          {phase === 'podium' && (
            <motion.div key="podium" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <CenterCard>
                <PartyPopper className="w-12 h-12 mx-auto mb-2" style={{ color: GOLD }} />
                <h2 className="font-black text-2xl mb-1" style={{ color: NAVY }}>انتهت المسابقة!</h2>
                <p className="font-black text-lg mb-5" style={{ color: GOLD }}>
                  ترتيبك النهائي: #{ar(state.my_rank || 0)} — {ar(state.score)} نقطة
                </p>
                <div className="flex items-end justify-center gap-2 mb-6" dir="ltr">
                  {[2, 1, 3].map((place) => {
                    const row = (state.podium || [])[place - 1]
                    const heights = { 1: 'h-28', 2: 'h-20', 3: 'h-14' }
                    return (
                      <div key={place} className="flex flex-col items-center w-24">
                        <span className="text-2xl mb-1">{['🥇', '🥈', '🥉'][place - 1]}</span>
                        <span className="text-xs font-bold truncate w-full text-center" style={{ color: NAVY }}>
                          {row?.name || '—'}
                        </span>
                        <div className={`w-full ${heights[place]} rounded-t-xl mt-1 flex items-start justify-center pt-1.5`}
                          style={{ background: place === 1 ? GOLD : place === 2 ? '#CBD5E1' : '#D6A87C' }}>
                          <span className="font-black text-sm" style={{ color: NAVY }}>{ar(row?.score ?? 0)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button onClick={leave} className="px-6 py-3 rounded-2xl font-black" style={{ background: NAVY, color: 'white' }}>
                  لعبة جديدة
                </button>
              </CenterCard>
            </motion.div>
          )}

          {/* kicked */}
          {phase === 'kicked' && (
            <motion.div key="kicked" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <CenterCard>
                <Medal className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                <p className="font-black text-lg mb-4" style={{ color: NAVY }}>أخرجك المدرب من اللعبة</p>
                <button onClick={leave} className="px-6 py-3 rounded-2xl font-black text-white" style={{ background: NAVY }}>
                  عودة
                </button>
              </CenterCard>
            </motion.div>
          )}

          {/* connecting */}
          {!phase && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <CenterCard>
                <Loader2 className="w-10 h-10 mx-auto animate-spin" style={{ color: GOLD }} />
              </CenterCard>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
