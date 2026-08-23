// لعبة الذاكرة — 3×3 memory board: icons show for 10 seconds, then the team
// finds the matching pairs with the fewest mistakes. One team or two teams
// (each plays its own shuffle; fewer mistakes wins, faster time breaks ties).
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, Bug, ShieldCheck, KeyRound, Star, Eye, Play, RotateCcw,
  Brain, Trophy, Clock,
} from 'lucide-react'
import { NAVY, GOLD, ar } from '../quiz/shared.jsx'

const PREVIEW_SECONDS = 10

const PAIR_ICONS = [
  { key: 'lock', Icon: Lock, color: '#D97706', soft: '#FEF3C7' },
  { key: 'bug', Icon: Bug, color: '#E5484D', soft: '#FEE2E2' },
  { key: 'shield', Icon: ShieldCheck, color: '#1F9D63', soft: '#D1FAE5' },
  { key: 'key', Icon: KeyRound, color: '#8E4EC6', soft: '#F3E8FF' },
]
const FREE_ICON = { key: 'free', Icon: Star, color: '#FCAD0F', soft: '#FEF3C7' }

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 9 cells: 4 pairs + the free star. The star lands on a random cell and is
// auto-revealed after the preview (it has no partner, so it's never a guess).
function newBoard() {
  const keys = shuffle([...PAIR_ICONS, ...PAIR_ICONS, FREE_ICON].map((x) => x.key))
  return keys.map((key, i) => ({ id: i, key, matched: key === 'free' }))
}

const iconFor = (key) => (key === 'free' ? FREE_ICON : PAIR_ICONS.find((p) => p.key === key))

function PreviewRing({ onDone }) {
  const [left, setLeft] = useState(PREVIEW_SECONDS)
  const fired = useRef(false)
  useEffect(() => {
    const end = Date.now() + PREVIEW_SECONDS * 1000
    const id = setInterval(() => {
      const remaining = Math.max(0, (end - Date.now()) / 1000)
      setLeft(remaining)
      if (remaining <= 0 && !fired.current) { fired.current = true; onDone() }
    }, 100)
    return () => clearInterval(id)
  }, [onDone])
  return (
    <div className="flex items-center justify-center gap-2 font-black text-xl" style={{ color: NAVY }}>
      <Eye className="w-6 h-6" style={{ color: GOLD }} />
      احفظوا الأماكن! <span className="tabular-nums" style={{ color: '#E5484D' }}>{ar(Math.ceil(left))}</span>
    </div>
  )
}

export default function PageMemory() {
  const [screen, setScreen] = useState('setup')     // setup | ready | preview | play | results
  const [teamCount, setTeamCount] = useState(2)
  const [teamIndex, setTeamIndex] = useState(0)
  const [results, setResults] = useState([])        // [{mistakes, seconds}]
  const [board, setBoard] = useState([])
  const [open, setOpen] = useState([])              // ids of the 1-2 currently flipped cells
  const [mistakes, setMistakes] = useState(0)
  const busy = useRef(false)
  const openRef = useRef([])  // synchronous mirror of `open`: two taps can land
                              // in the same JS task, before React re-renders
  const startedAt = useRef(0)

  const teamName = (i) => (teamCount === 1 ? 'فريقكم' : i === 0 ? 'الفريق الأول' : 'الفريق الثاني')

  const beginTeamRun = () => {
    setBoard(newBoard())
    setOpen([]); openRef.current = []
    setMistakes(0); busy.current = false
    setScreen('preview')
  }

  const startPlay = () => {
    startedAt.current = Date.now()
    setScreen('play')
  }

  const finishRun = (finalMistakes) => {
    const seconds = Math.round((Date.now() - startedAt.current) / 10) / 100
    const next = [...results, { mistakes: finalMistakes, seconds }]
    setResults(next)
    if (teamIndex + 1 < teamCount) {
      setTeamIndex(teamIndex + 1)
      setScreen('ready')
    } else {
      setScreen('results')
    }
  }

  const clickCell = (cell) => {
    if (screen !== 'play' || busy.current || cell.matched || openRef.current.includes(cell.id)) return
    const flipped = [...openRef.current, cell.id]
    openRef.current = flipped
    setOpen(flipped)
    if (flipped.length < 2) return

    busy.current = true
    const clear = () => { openRef.current = []; setOpen([]); busy.current = false }
    const [a, b] = flipped.map((id) => board.find((c) => c.id === id))
    if (a.key === b.key) {
      const next = board.map((c) => (c.key === a.key ? { ...c, matched: true } : c))
      setTimeout(() => {
        setBoard(next); clear()
        if (next.every((c) => c.matched)) finishRun(mistakes)
      }, 450)
    } else {
      setMistakes((m) => m + 1)
      setTimeout(clear, 900)
    }
  }

  const restart = () => {
    setResults([]); setTeamIndex(0); setScreen('setup')
  }

  // ─── setup ───
  if (screen === 'setup') {
    return (
      <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: NAVY }}>
            <Brain className="w-8 h-8" style={{ color: GOLD }} />
          </div>
          <h1 className="text-2xl font-black mb-2" style={{ color: NAVY }}>لعبة الذاكرة</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            تظهر الأيقونات لمدة {ar(PREVIEW_SECONDS)} ثوانٍ ثم تختفي — اعثروا على الأزواج
            المتشابهة بأقل عدد من الأخطاء. كل زوج خاطئ يُحسب خطأً واحداً!
          </p>

          <p className="text-sm font-black mb-2 text-start" style={{ color: NAVY }}>عدد الفرق</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[1, 2].map((n) => (
              <button key={n} onClick={() => setTeamCount(n)}
                className="py-3.5 rounded-2xl font-black text-base border-2 transition-colors"
                style={teamCount === n
                  ? { background: NAVY, color: 'white', borderColor: NAVY }
                  : { background: 'white', color: '#94A3B8', borderColor: '#E2E8F0' }}>
                {n === 1 ? 'فريق واحد' : 'فريقان يتنافسان'}
              </button>
            ))}
          </div>

          <button onClick={() => { setTeamIndex(0); setResults([]); setScreen('ready') }}
            className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2" style={{ background: GOLD, color: NAVY }}>
            <Play className="w-5 h-5" /> ابدأ
          </button>
        </div>
      </div>
    )
  }

  // ─── ready (hand over to the next team) ───
  if (screen === 'ready') {
    return (
      <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4" dir="rtl">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-lg p-8 text-center">
          <p className="text-5xl mb-3">{teamIndex === 0 ? '1️⃣' : '2️⃣'}</p>
          <h2 className="text-2xl font-black mb-2" style={{ color: NAVY }}>دور {teamName(teamIndex)}</h2>
          <p className="text-sm text-slate-500 mb-6">
            عند الضغط ستظهر اللوحة لمدة {ar(PREVIEW_SECONDS)} ثوانٍ — ركّزوا جيداً!
          </p>
          <button onClick={beginTeamRun}
            className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2" style={{ background: GOLD, color: NAVY }}>
            <Eye className="w-5 h-5" /> أظهر اللوحة
          </button>
        </motion.div>
      </div>
    )
  }

  // ─── results ───
  if (screen === 'results') {
    let winnerIndex = null
    if (teamCount === 2) {
      const [r0, r1] = results
      if (r0.mistakes !== r1.mistakes) winnerIndex = r0.mistakes < r1.mistakes ? 0 : 1
      else if (r0.seconds !== r1.seconds) winnerIndex = r0.seconds < r1.seconds ? 0 : 1
    }
    return (
      <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-lg p-8 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-2" style={{ color: GOLD }} />
          <h2 className="text-2xl font-black mb-6" style={{ color: NAVY }}>
            {teamCount === 2
              ? (winnerIndex === null ? 'تعادل تام! 🤝' : `فاز ${teamName(winnerIndex)}! 🎉`)
              : 'النتيجة'}
          </h2>
          <div className="space-y-3 mb-6">
            {results.map((r, i) => (
              <div key={i} className="rounded-2xl border-2 p-4 flex items-center justify-between"
                style={{ borderColor: i === winnerIndex ? GOLD : '#E2E8F0', background: i === winnerIndex ? '#FFFBEB' : 'white' }}>
                <span className="font-black" style={{ color: NAVY }}>
                  {i === winnerIndex && '🏆 '}{teamName(i)}
                </span>
                <span className="text-sm font-bold text-slate-500 flex items-center gap-3">
                  <span style={{ color: r.mistakes === 0 ? '#1F9D63' : '#E5484D' }}>{ar(r.mistakes)} خطأ</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{ar(r.seconds)} ث</span>
                </span>
              </div>
            ))}
          </div>
          {teamCount === 1 && results[0]?.mistakes === 0 && (
            <p className="font-black mb-4" style={{ color: '#1F9D63' }}>🧠 ذاكرة حديدية — بدون أي خطأ!</p>
          )}
          <button onClick={restart}
            className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2" style={{ background: NAVY, color: 'white' }}>
            <RotateCcw className="w-5 h-5" /> لعبة جديدة
          </button>
        </div>
      </div>
    )
  }

  // ─── preview + play (the board) ───
  const isPreview = screen === 'preview'
  return (
    <div className="min-h-[calc(100vh-48px)] px-4 py-8" dir="rtl">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-2 font-black" style={{ color: NAVY }}>{teamName(teamIndex)}</div>
        <div className="mb-5 min-h-[36px]">
          {isPreview ? (
            <PreviewRing onDone={startPlay} />
          ) : (
            <div className="flex items-center justify-center gap-4 font-black" style={{ color: NAVY }}>
              <span>الأخطاء: <span style={{ color: mistakes === 0 ? '#1F9D63' : '#E5484D' }}>{ar(mistakes)}</span></span>
              <span className="text-slate-300">|</span>
              <span>الأزواج: {ar(board.filter((c) => c.matched && c.key !== 'free').length / 2)} / {ar(4)}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {board.map((cell) => {
            const revealed = isPreview || cell.matched || open.includes(cell.id)
            const info = iconFor(cell.key)
            return (
              <button key={cell.id} onClick={() => clickCell(cell)}
                disabled={isPreview || cell.matched}
                className="aspect-square rounded-2xl border-2 flex items-center justify-center transition-all"
                style={{
                  background: revealed ? info.soft : NAVY,
                  borderColor: revealed ? info.color : NAVY,
                }}>
                {revealed
                  ? <info.Icon className="w-12 h-12" style={{ color: info.color }} strokeWidth={2.2} />
                  : <span className="font-black text-2xl" style={{ color: 'rgba(255,255,255,0.25)' }}>؟</span>}
              </button>
            )
          })}
        </div>

        <div className="text-center mt-6">
          <button onClick={restart} className="text-sm font-bold text-slate-400 hover:text-slate-600 underline">
            إنهاء والعودة
          </button>
        </div>
      </div>
    </div>
  )
}
