// Thin client for the Live Quiz API (/api/quiz/…) + a polling hook.
import { useEffect, useRef } from 'react'

async function request(path, options) {
  const res = await fetch(`/api/quiz${path}`, options)
  let data = null
  try { data = await res.json() } catch { /* non-JSON error page */ }
  if (!data) data = { ok: false, error: `http_${res.status}` }
  return data
}

export function apiGet(path, params) {
  const qs = new URLSearchParams(params).toString()
  return request(`${path}?${qs}`)
}

export function apiPost(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Human-readable Arabic messages for API error codes.
export const ERRORS = {
  no_such_game: 'لا توجد لعبة بهذا الرمز',
  game_over: 'انتهت هذه اللعبة',
  bad_name: 'اكتب اسماً من حرفين على الأقل',
  name_taken: 'هذا الاسم مستخدم — جرّب اسماً آخر',
  game_full: 'اللعبة ممتلئة',
  server_full: 'الخادم مشغول حالياً — جرّب بعد قليل',
  bad_pin: 'رمز المدرب غير صحيح',
  too_many_attempts: 'محاولات كثيرة — انتظر ١٠ دقائق ثم جرّب مجدداً',
  question_closed: 'انتهى وقت هذا السؤال',
  already_answered: 'أجبت على هذا السؤال بالفعل',
}

export const errMsg = (code) => ERRORS[code] || 'حدث خطأ — حاول مرة أخرى'

// Poll `fn` every `ms` while `enabled`; fires immediately on mount/deps change.
export function usePoll(fn, ms, enabled = true) {
  const saved = useRef(fn)
  useEffect(() => { saved.current = fn }, [fn])
  useEffect(() => {
    if (!enabled) return undefined
    let alive = true
    const run = () => { if (alive) saved.current() }
    run()
    const id = setInterval(run, ms)
    return () => { alive = false; clearInterval(id) }
  }, [ms, enabled])
}

// Countdown that follows the SERVER clock: every state response carries
// server_now, from which we keep a rolling offset to the local clock.
let clockOffset = 0
export function noteServerNow(serverNow) {
  if (serverNow) clockOffset = serverNow * 1000 - Date.now()
}
export function secondsLeft(endsAt) {
  if (!endsAt) return 0
  return Math.max(0, (endsAt * 1000 - (Date.now() + clockOffset)) / 1000)
}
