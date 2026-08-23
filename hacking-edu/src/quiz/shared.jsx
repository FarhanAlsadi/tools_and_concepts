// Shared UI constants + helpers for the Live Quiz (player + host screens).
import { Triangle, Square, Circle, Star, Diamond, Hexagon } from 'lucide-react'

export const NAVY = '#0E1F39'
export const GOLD = '#FCAD0F'
export const CREAM = '#FCF5F0'

// Kahoot-style answer buttons: bold color + shape per option slot.
export const OPTION_STYLES = [
  { bg: '#E5484D', Icon: Triangle },
  { bg: '#2F6FED', Icon: Square },
  { bg: '#D97706', Icon: Circle },
  { bg: '#1F9D63', Icon: Star },
  { bg: '#8E4EC6', Icon: Diamond },
  { bg: '#0E7490', Icon: Hexagon },
]

export const TYPE_LABELS = {
  mc: 'اختيار واحد',
  tf: 'صح أو خطأ',
  multi: 'عدة إجابات',
  open: 'سؤال مفتوح',
}

export const ar = (n) => Number(n ?? 0).toLocaleString('ar-EG')

export function newQuestion(type = 'mc') {
  const base = { type, text: '', time: 20, points: 1000, model: '' }
  if (type === 'tf') return { ...base, options: ['صح', 'خطأ'], correct: [0] }
  if (type === 'open') return { ...base, options: [], correct: [] }
  return { ...base, options: ['', '', '', ''], correct: [] }
}

// Validate a quiz client-side before hosting; returns list of Arabic errors.
export function validateQuiz(quiz) {
  const errors = []
  if (!quiz.questions.length) errors.push('أضف سؤالاً واحداً على الأقل')
  quiz.questions.forEach((q, i) => {
    const n = ar(i + 1)
    if (!q.text.trim()) errors.push(`السؤال ${n}: نص السؤال فارغ`)
    if (q.type === 'mc' || q.type === 'multi') {
      const filled = q.options.filter((o) => o.trim())
      if (filled.length < 2) errors.push(`السؤال ${n}: أضف خيارين على الأقل`)
      if (!q.correct.length) errors.push(`السؤال ${n}: حدّد الإجابة الصحيحة`)
      if (q.type === 'mc' && q.correct.length > 1)
        errors.push(`السؤال ${n}: اختيار واحد يقبل إجابة صحيحة واحدة فقط`)
      if (q.correct.some((c) => !q.options[c] || !q.options[c].trim()))
        errors.push(`السؤال ${n}: إجابة صحيحة تشير إلى خيار فارغ`)
    }
  })
  return errors
}

// Strip empty options and remap correct indices before sending to the server.
export function packQuiz(quiz) {
  return {
    title: quiz.title,
    questions: quiz.questions.map((q) => {
      if (q.type !== 'mc' && q.type !== 'multi') return q
      const keep = q.options
        .map((text, i) => ({ text: text.trim(), i }))
        .filter((o) => o.text)
      const remap = new Map(keep.map((o, newIndex) => [o.i, newIndex]))
      return {
        ...q,
        options: keep.map((o) => o.text),
        correct: q.correct.filter((c) => remap.has(c)).map((c) => remap.get(c)),
      }
    }),
  }
}
