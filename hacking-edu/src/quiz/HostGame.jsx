// Live Quiz — the trainer's live hosting screen (meant to be projected).
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Play, SkipForward, Trophy, Clock, CheckCircle2, XCircle,
  UserX, PartyPopper, Loader2, StopCircle, MessageSquareText,
} from 'lucide-react'
import { apiGet, apiPost, usePoll, noteServerNow, secondsLeft } from './api'
import { NAVY, GOLD, OPTION_STYLES, ar } from './shared.jsx'

function BigTimer({ endsAt, total }) {
  const [left, setLeft] = useState(() => secondsLeft(endsAt))
  useEffect(() => {
    const id = setInterval(() => setLeft(secondsLeft(endsAt)), 100)
    return () => clearInterval(id)
  }, [endsAt])
  const frac = total ? Math.min(left / total, 1) : 0
  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl text-white shrink-0"
        style={{ background: frac < 0.25 ? '#E5484D' : NAVY }}>
        {ar(Math.ceil(left))}
      </div>
      <div className="flex-1 h-4 rounded-full bg-slate-200 overflow-hidden" dir="ltr">
        <div className="h-full rounded-full transition-[width] duration-100"
          style={{ width: `${frac * 100}%`, background: frac < 0.25 ? '#E5484D' : GOLD }} />
      </div>
    </div>
  )
}

export default function HostGame({ code, token, onExit }) {
  const [state, setState] = useState(null)
  const [customPoints, setCustomPoints] = useState({}) // player_id -> text field

  usePoll(async () => {
    const res = await apiGet('/host/state', { code, token })
    if (res.ok) { noteServerNow(res.server_now); setState(res) }
    else if (res.error === 'no_such_game') onExit()
  }, 1000, true)

  const act = async (action, extra = {}) => {
    const res = await apiPost('/host/action', { code, token, action, ...extra })
    if (res.ok && res.phase === 'closed') onExit()
  }

  if (!state) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: GOLD }} />
      </div>
    )
  }

  const { phase, question } = state
  const players = state.players.filter((p) => !p.kicked)
  const answeredCount = players.filter((p) => p.answered).length
  const isOpenQ = question?.type === 'open'

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">

      {/* control bar */}
      <div className="flex items-center justify-between mb-6 text-sm">
        <div className="flex items-center gap-3 font-bold" style={{ color: NAVY }}>
          <span className="rounded-lg px-3 py-1.5 text-white font-black tracking-widest" style={{ background: NAVY }} dir="ltr">{code}</span>
          <span className="truncate max-w-[200px]">{state.title}</span>
          {state.q_index >= 0 && <span className="text-slate-400">سؤال {ar(state.q_index + 1)} / {ar(state.q_total)}</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-slate-500"><Users className="w-4 h-4" /> {ar(players.length)}</span>
          {phase !== 'podium' && (
            <button onClick={() => act('end_game')} className="flex items-center gap-1 font-bold text-red-500 hover:text-red-700">
              <StopCircle className="w-4 h-4" /> إنهاء اللعبة
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── lobby ── */}
        {phase === 'lobby' && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <p className="font-bold text-slate-500 mb-2">ادخلوا من الموقع ثم اكتبوا الرمز:</p>
            <div className="inline-block rounded-3xl px-10 py-6 mb-2 shadow-lg" style={{ background: NAVY }}>
              <span className="font-black tracking-[0.3em] text-white" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)' }} dir="ltr">{code}</span>
            </div>
            <p className="text-sm font-bold text-slate-400 mb-8" dir="ltr">{window.location.origin}/play</p>

            <div className="flex flex-wrap justify-center gap-2 mb-8 min-h-[48px]">
              {players.length === 0 && <p className="text-slate-400 font-bold">بانتظار المتسابقين…</p>}
              {players.map((p) => (
                <motion.span key={p.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="group flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-4 py-2 font-bold shadow-sm"
                  style={{ color: NAVY }}>
                  {p.name}
                  <button onClick={() => act('kick', { player_id: p.id })}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500" title="إخراج">
                    <UserX className="w-4 h-4" />
                  </button>
                </motion.span>
              ))}
            </div>

            <button onClick={() => act('start')} disabled={!players.length}
              className="px-10 py-4 rounded-2xl font-black text-xl disabled:opacity-40 inline-flex items-center gap-2"
              style={{ background: GOLD, color: NAVY }}>
              <Play className="w-6 h-6" /> ابدأ المسابقة
            </button>
          </motion.div>
        )}

        {/* ── question ── */}
        {phase === 'question' && question && (
          <motion.div key={`q-${state.q_index}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <BigTimer endsAt={state.ends_at} total={question.time} />
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8 my-6 text-center">
              <p className="font-black leading-relaxed" style={{ color: NAVY, fontSize: 'clamp(1.4rem, 3vw, 2.2rem)' }}>
                {question.text}
              </p>
            </div>

            {question.options.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {question.options.map((option, i) => {
                  const { bg, Icon } = OPTION_STYLES[i % OPTION_STYLES.length]
                  return (
                    <div key={i} className="rounded-2xl p-4 text-white font-bold text-lg flex items-center gap-3" style={{ background: bg }}>
                      <Icon className="w-6 h-6 shrink-0" fill="white" />
                      {option}
                    </div>
                  )
                })}
              </div>
            )}
            {isOpenQ && (
              <p className="text-center font-bold text-slate-500 mb-6 flex items-center justify-center gap-2">
                <MessageSquareText className="w-5 h-5" /> المتسابقون يكتبون إجاباتهم الحرة الآن
              </p>
            )}

            <div className="flex items-center justify-between">
              <span className="font-black text-lg" style={{ color: NAVY }}>
                أجاب {ar(answeredCount)} من {ar(players.length)}
              </span>
              <button onClick={() => act('end_question')}
                className="px-6 py-3 rounded-2xl font-black text-white inline-flex items-center gap-2" style={{ background: NAVY }}>
                <SkipForward className="w-5 h-5" /> إنهاء السؤال
              </button>
            </div>
          </motion.div>
        )}

        {/* ── grading (open questions) ── */}
        {phase === 'grading' && question && (
          <motion.div key={`g-${state.q_index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
              <p className="font-black text-lg mb-1" style={{ color: NAVY }}>{question.text}</p>
              {question.model && (
                <p className="text-sm font-bold text-emerald-600">الإجابة النموذجية: {question.model}</p>
              )}
              <p className="text-xs font-bold text-slate-400 mt-1">قيّم كل إجابة — النقاط الكاملة للسؤال: {ar(question.points)}</p>
            </div>

            <div className="space-y-3 mb-4">
              {state.answers.length === 0 && (
                <p className="text-center font-bold text-slate-400 py-6">لم تصل أي إجابات</p>
              )}
              {state.answers.map((row) => {
                const graded = row.awarded !== undefined && row.awarded !== null
                return (
                  <div key={row.player_id} className="bg-white rounded-2xl border p-4"
                    style={{ borderColor: graded ? '#6EE7B7' : '#E2E8F0' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black" style={{ color: NAVY }}>{row.name}</span>
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {ar(Math.round(row.at))} ث
                        {graded && <span className="text-emerald-600 ms-2">✓ {ar(row.awarded)} نقطة</span>}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-700 mb-3 leading-relaxed">{row.text}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[0, Math.round(question.points / 2), question.points].map((pts, i) => (
                        <button key={i} onClick={() => act('grade', { player_id: row.player_id, points: pts })}
                          className="px-4 py-1.5 rounded-full text-sm font-black border-2 transition-colors"
                          style={row.awarded === pts
                            ? { background: NAVY, color: 'white', borderColor: NAVY }
                            : { background: 'white', color: NAVY, borderColor: '#E2E8F0' }}>
                          {i === 0 ? '٠' : ar(pts)}
                        </button>
                      ))}
                      <input
                        type="number" min={0} max={10000} placeholder="مخصص"
                        value={customPoints[row.player_id] ?? ''}
                        onChange={(e) => setCustomPoints({ ...customPoints, [row.player_id]: e.target.value })}
                        onBlur={(e) => {
                          const v = parseInt(e.target.value, 10)
                          if (!Number.isNaN(v)) act('grade', { player_id: row.player_id, points: v })
                        }}
                        className="w-24 rounded-full border-2 border-slate-200 px-3 py-1.5 text-sm font-bold text-center focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <button onClick={() => act('finish_grading')}
              className="w-full py-4 rounded-2xl font-black text-lg" style={{ background: GOLD, color: NAVY }}>
              اعتماد النقاط وعرض النتيجة
            </button>
          </motion.div>
        )}

        {/* ── reveal ── */}
        {phase === 'reveal' && question && (
          <motion.div key={`r-${state.q_index}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 mb-6 text-center">
              <p className="font-black text-xl mb-1" style={{ color: NAVY }}>{question.text}</p>
              <p className="text-sm font-bold text-slate-400">أجاب {ar(state.answers.length)} من {ar(players.length)}</p>
            </div>

            {question.options.length > 0 ? (
              <div className="space-y-3 mb-6">
                {question.options.map((option, i) => {
                  const { bg, Icon } = OPTION_STYLES[i % OPTION_STYLES.length]
                  const count = state.option_counts[i] || 0
                  const isCorrect = question.correct.includes(i)
                  const frac = state.answers.length ? count / state.answers.length : 0
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-56 rounded-xl px-3 py-2.5 text-white font-bold flex items-center gap-2 shrink-0"
                        style={{ background: bg, opacity: isCorrect ? 1 : 0.45 }}>
                        <Icon className="w-4 h-4 shrink-0" fill="white" />
                        <span className="truncate text-sm">{option}</span>
                      </div>
                      <div className="flex-1 h-8 bg-slate-100 rounded-xl overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${frac * 100}%` }}
                          className="h-full rounded-xl" style={{ background: bg, opacity: isCorrect ? 1 : 0.45 }} />
                      </div>
                      <span className="w-14 font-black tabular-nums flex items-center gap-1" style={{ color: NAVY }}>
                        {ar(count)}
                        {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center font-bold text-slate-500 mb-6">تم اعتماد نقاط الإجابات المفتوحة ✓</p>
            )}

            <div className="text-center">
              <button onClick={() => act('next')}
                className="px-8 py-3.5 rounded-2xl font-black text-lg inline-flex items-center gap-2" style={{ background: GOLD, color: NAVY }}>
                <Trophy className="w-5 h-5" /> عرض الترتيب
              </button>
            </div>
          </motion.div>
        )}

        {/* ── leaderboard ── */}
        {phase === 'leaderboard' && (
          <motion.div key={`l-${state.q_index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="text-center font-black text-2xl mb-6 flex items-center justify-center gap-2" style={{ color: NAVY }}>
              <Trophy className="w-7 h-7" style={{ color: GOLD }} /> الترتيب
            </h2>
            <div className="max-w-xl mx-auto space-y-2 mb-8">
              {state.leaderboard.slice(0, 8).map((row, i) => (
                <motion.div key={row.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-3 shadow-sm">
                  <span className="font-black text-lg w-10" style={{ color: row.rank <= 3 ? GOLD : '#94A3B8' }}>
                    {['🥇', '🥈', '🥉'][row.rank - 1] || `#${ar(row.rank)}`}
                  </span>
                  <span className="font-bold flex-1 truncate" style={{ color: NAVY }}>{row.name}</span>
                  <span className="font-black tabular-nums text-lg" style={{ color: NAVY }}>{ar(row.score)}</span>
                </motion.div>
              ))}
            </div>
            <div className="text-center">
              <button onClick={() => act('next')}
                className="px-8 py-3.5 rounded-2xl font-black text-lg inline-flex items-center gap-2" style={{ background: NAVY, color: 'white' }}>
                <SkipForward className="w-5 h-5" />
                {state.q_index + 1 < state.q_total ? 'السؤال التالي' : 'النتيجة النهائية'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── podium ── */}
        {phase === 'podium' && (
          <motion.div key="podium" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <PartyPopper className="w-12 h-12 mx-auto mb-2" style={{ color: GOLD }} />
            <h2 className="font-black text-3xl mb-8" style={{ color: NAVY }}>انتهت المسابقة!</h2>

            <div className="flex items-end justify-center gap-3 mb-10" dir="ltr">
              {[2, 1, 3].map((place) => {
                const row = state.leaderboard[place - 1]
                const heights = { 1: 'h-40', 2: 'h-28', 3: 'h-20' }
                return (
                  <motion.div key={place} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: place === 1 ? 0.5 : place === 2 ? 0.25 : 0 }}
                    className="flex flex-col items-center w-36">
                    <span className="text-4xl mb-1">{['🥇', '🥈', '🥉'][place - 1]}</span>
                    <span className="font-black truncate w-full" style={{ color: NAVY }}>{row?.name || '—'}</span>
                    <div className={`w-full ${heights[place]} rounded-t-2xl mt-2 flex items-start justify-center pt-3`}
                      style={{ background: place === 1 ? GOLD : place === 2 ? '#CBD5E1' : '#D6A87C' }}>
                      <span className="font-black text-xl" style={{ color: NAVY }}>{ar(row?.score ?? 0)}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {state.leaderboard.length > 3 && (
              <div className="max-w-md mx-auto space-y-1.5 mb-8">
                {state.leaderboard.slice(3, 10).map((row) => (
                  <div key={row.id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-2 text-sm">
                    <span className="font-black text-slate-400 w-8">#{ar(row.rank)}</span>
                    <span className="font-bold flex-1 truncate text-start" style={{ color: NAVY }}>{row.name}</span>
                    <span className="font-black tabular-nums" style={{ color: NAVY }}>{ar(row.score)}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => act('close')}
              className="px-8 py-3.5 rounded-2xl font-black text-lg text-white" style={{ background: NAVY }}>
              إغلاق اللعبة والعودة
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
