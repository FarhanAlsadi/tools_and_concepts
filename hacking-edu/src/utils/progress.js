/* ────────────────────────────────────────────────────────────────────────────
   progress.js — tiny localStorage tracker of which rooms (lesson pages) the
   student has covered. Used by the learning paths / roadmaps to show progress.
   A room is keyed by its route (e.g. "/sqli"), so the same room counts across
   every path it appears in.

   Two signals are stored:
     hx_done   — rooms considered complete
     hx_undone — rooms the student EXPLICITLY un-checked, so that merely
                 re-opening such a room later does not silently re-complete it.
   ──────────────────────────────────────────────────────────────────────────── */
const KEY = 'hx_done'
const UNKEY = 'hx_undone'

function read(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')) } catch (e) { return new Set() }
}
function persist(key, set) { try { localStorage.setItem(key, JSON.stringify([...set])) } catch (e) {} }

export function getDone() { return read(KEY) }

/* explicit toggle from the per-room check. Un-checking records an explicit
   "not done" so a later re-open won't flip it back to done. */
export function toggleDone(page) {
  const done = read(KEY), undone = read(UNKEY)
  if (done.has(page)) { done.delete(page); undone.add(page) }
  else { done.add(page); undone.delete(page) }
  persist(KEY, done); persist(UNKEY, undone)
  return done
}

/* cover a room by opening it — auto-completes it UNLESS the student has
   explicitly un-checked it before (then their choice is respected). */
export function coverRoom(page) {
  const undone = read(UNKEY)
  if (undone.has(page)) return read(KEY)   // respect an explicit un-check
  const done = read(KEY)
  done.add(page)
  persist(KEY, done)
  return done
}
