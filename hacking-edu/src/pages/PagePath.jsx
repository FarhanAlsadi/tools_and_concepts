import { useState, useMemo } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft, CheckCircle2, Circle, Home } from 'lucide-react'
import { LESSONS } from './Welcome'
import { PATHS, pathRooms, pathById } from '../data/paths'
import { getDone, coverRoom, toggleDone } from '../utils/progress'

/* ────────────────────────────────────────────────────────────────────────────
   A single learning-path roadmap: ordered levels down a spine, each level a row
   of room cards. Opening a room marks it covered; a per-room check lets you
   toggle it. Progress is shown per level and for the whole path. The same room
   can appear in several levels/paths — its "done" state is shared everywhere.
   ──────────────────────────────────────────────────────────────────────────── */
export default function PagePath() {
  const { pathId } = useParams()
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const path = pathById[pathId]
  const byPage = useMemo(() => Object.fromEntries(LESSONS.map(l => [l.page, l])), [])
  const [done, setDone] = useState(() => getDone())

  if (!path) return <Navigate to="/" replace />

  const openRoom = page => { setDone(new Set(coverRoom(page))); navigate(page) }
  const toggle = page => setDone(new Set(toggleDone(page)))
  const num = n => isAr ? Number(n).toLocaleString('ar-EG') : String(n)

  const rooms = pathRooms(path)
  const total = rooms.length
  const doneCount = rooms.filter(r => done.has(r)).length
  const pct = total ? Math.round((doneCount / total) * 100) : 0

  const fallback = page => ({ titleAr: page, titleEn: page, descAr: '', descEn: '', typeAr: 'غرفة', typeEn: 'Room', color: 'bg-slate-100 text-slate-600', badge: 'bg-slate-50 text-slate-500 border-slate-200', icon: null })

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 16px', fontFamily: 'sans-serif' }}>
      {/* top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 12px', fontSize: 12.5, color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
          <Home size={14} />{isAr ? 'كل المسارات' : 'All paths'}
        </button>
      </div>

      {/* header card */}
      <div style={{ borderRadius: 18, padding: '22px 24px', color: 'white', background: `linear-gradient(135deg, ${path.accent}, ${path.accent}cc)`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{path.icon}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, letterSpacing: 1 }}>{isAr ? 'مسار تعليمي' : 'LEARNING PATH'}</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, lineHeight: 1.2 }}>{isAr ? path.titleAr : path.titleEn}</h1>
          </div>
        </div>
        <p style={{ fontSize: 13.5, opacity: 0.92, margin: '0 0 16px', maxWidth: 640, lineHeight: 1.6 }}>{isAr ? path.taglineAr : path.taglineEn}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180, height: 10, background: 'rgba(255,255,255,0.25)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'white', borderRadius: 20, transition: 'width .3s' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 800 }}>{num(doneCount)} / {num(total)} {isAr ? 'غرفة' : 'rooms'} · {num(pct)}%</span>
        </div>
        <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 8 }}>{num(path.levels.length)} {isAr ? 'مستويات' : 'levels'}</div>
      </div>

      {/* roadmap: levels down a spine */}
      <div style={{ position: 'relative', marginTop: 24 }}>
        {/* the spine */}
        <div style={{ position: 'absolute', insetInlineStart: 19, top: 14, bottom: 14, width: 2, background: '#e2e8f0' }} />

        {path.levels.map((lvl, li) => {
          const lvlDone = lvl.rooms.filter(r => done.has(r)).length
          const lvlPct = lvl.rooms.length ? Math.round((lvlDone / lvl.rooms.length) * 100) : 0
          const complete = lvlDone === lvl.rooms.length
          return (
            <div key={li} style={{ position: 'relative', marginBottom: 26 }}>
              {/* level header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: complete ? '#16a34a' : path.accent, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, flexShrink: 0, position: 'relative', zIndex: 1, boxShadow: '0 0 0 4px #FCF5F0' }}>
                  {complete ? '✓' : num(li + 1)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0E1F39' }}>{isAr ? lvl.titleAr : lvl.titleEn}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div style={{ flex: 1, maxWidth: 160, height: 5, background: '#e2e8f0', borderRadius: 20, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${lvlPct}%`, background: path.accent, borderRadius: 20 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{num(lvlDone)}/{num(lvl.rooms.length)}</span>
                  </div>
                </div>
              </div>

              {/* rooms in this level */}
              <div style={{ paddingInlineStart: 52 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
                  {lvl.rooms.map((page, ri) => {
                    const meta = byPage[page] || fallback(page)
                    const isRoomDone = done.has(page)
                    const roomTitle = isAr ? meta.titleAr : meta.titleEn
                    return (
                      <div key={page + ri} onClick={() => openRoom(page)}
                        role="button" tabIndex={0}
                        aria-label={(isAr ? 'افتح: ' : 'Open: ') + roomTitle}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openRoom(page) } }}
                        style={{ position: 'relative', cursor: 'pointer', background: 'white', border: `2px solid ${isRoomDone ? '#86efac' : '#e2e8f0'}`, borderRadius: 14, padding: 14, transition: 'all .15s', outlineOffset: 2 }}
                        onFocus={e => { e.currentTarget.style.borderColor = path.accent }}
                        onBlur={e => { e.currentTarget.style.borderColor = isRoomDone ? '#86efac' : '#e2e8f0' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                          <div className={meta.color} style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{meta.icon}</div>
                          <button onClick={e => { e.stopPropagation(); toggle(page) }}
                            title={isAr ? 'وضع علامة كمُنجَز' : 'Toggle complete'}
                            aria-label={(isRoomDone ? (isAr ? 'إلغاء إنجاز: ' : 'Mark not done: ') : (isAr ? 'وضع علامة كمُنجَز: ' : 'Mark done: ')) + roomTitle}
                            aria-pressed={isRoomDone}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}>
                            {isRoomDone ? <CheckCircle2 size={22} color="#16a34a" /> : <Circle size={22} color="#cbd5e1" />}
                          </button>
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0E1F39', lineHeight: 1.3, marginBottom: 4 }}>{isAr ? meta.titleAr : meta.titleEn}</div>
                        <p style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.5, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{isAr ? meta.descAr : meta.descEn}</p>
                        <span className={meta.badge} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, borderWidth: 1, borderStyle: 'solid' }}>{isAr ? meta.typeAr : meta.typeEn}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* other paths */}
      <div style={{ marginTop: 28, borderTop: '1px solid #e2e8f0', paddingTop: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 10 }}>{isAr ? 'مسارات أخرى' : 'Other paths'}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PATHS.filter(p => p.id !== path.id).map(p => (
            <button key={p.id} onClick={() => navigate(`/path/${p.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '2px solid #e2e8f0', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: '#0E1F39' }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, background: p.accent, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.icon && <span style={{ transform: 'scale(0.6)', display: 'flex' }}>{p.icon}</span>}</span>
              {isAr ? p.titleAr : p.titleEn}
            </button>
          ))}
        </div>
      </div>

      {/* home nav */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1d4ed8', background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 10, padding: '10px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          <ChevronLeft size={15} />{isAr ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
