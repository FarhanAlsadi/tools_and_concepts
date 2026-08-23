// Excel (.xlsx) template + import for quiz questions.
// The xlsx library is imported dynamically so only the trainer page pays for it.
import { ar } from './shared.jsx'

const HEADERS = [
  'النوع', 'السؤال',
  'خيار 1', 'خيار 2', 'خيار 3', 'خيار 4', 'خيار 5', 'خيار 6',
  'الإجابة الصحيحة', 'الوقت (ثواني)', 'النقاط',
]

const SAMPLE_ROWS = [
  ['اختيار واحد', 'ما هي أشهر أداة لالتقاط حزم الشبكة؟',
    'Wireshark', 'Excel', 'Photoshop', 'Chrome', '', '', '1', 20, 1000],
  ['صح أو خطأ', 'مواقع HTTPS تظهر مشفّرة لمن يتنصّت على الشبكة',
    '', '', '', '', '', '', 'صح', 15, 1000],
  ['عدة إجابات', 'أي مما يلي يساعد في الحماية من برامج الفدية؟',
    'نسخ احتياطي منتظم', 'فتح كل المرفقات', 'تحديث النظام', 'مشاركة كلمة المرور',
    '', '', '1,3', 30, 1500],
  ['سؤال مفتوح', 'اشرح بجملة واحدة: لماذا الواي فاي العام خطير؟',
    '', '', '', '', '', '', 'أي شخص على نفس الشبكة يمكنه التقاط البيانات غير المشفّرة', 60, 2000],
]

const INSTRUCTIONS = [
  ['تعليمات تعبئة قالب الأسئلة'],
  [''],
  ['النوع — اكتب واحداً من:'],
  ['اختيار واحد', 'سؤال بإجابة صحيحة واحدة (حتى ٦ خيارات)'],
  ['صح أو خطأ', 'اترك أعمدة الخيارات فارغة'],
  ['عدة إجابات', 'سؤال بأكثر من إجابة صحيحة'],
  ['سؤال مفتوح', 'المتسابق يكتب إجابة حرة والمدرب يقيّمها أثناء اللعبة'],
  [''],
  ['الإجابة الصحيحة:'],
  ['اختيار واحد', 'رقم الخيار الصحيح (مثال: 1) أو نص الخيار نفسه'],
  ['صح أو خطأ', 'اكتب: صح — أو — خطأ'],
  ['عدة إجابات', 'أرقام الخيارات مفصولة بفاصلة (مثال: 1,3)'],
  ['سؤال مفتوح', 'اختياري: إجابة نموذجية تظهر للمدرب أثناء التقييم'],
  [''],
  ['الوقت بالثواني (من ٥ إلى ٣٠٠) — إن تُرك فارغاً: ٢٠ ثانية'],
  ['النقاط الأساسية للسؤال — إن تُركت فارغة: ١٠٠٠ نقطة'],
  ['ملاحظة: الإجابة الأسرع تكسب نقاطاً أكثر (النقاط كاملة فور ظهور السؤال، وتتناقص حتى النصف مع نهاية الوقت)'],
]

export async function downloadTemplate() {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...SAMPLE_ROWS])
  ws['!cols'] = [{ wch: 14 }, { wch: 50 }, { wch: 18 }, { wch: 18 },
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 20 }, { wch: 12 }, { wch: 10 }]
  const wsInfo = XLSX.utils.aoa_to_sheet(INSTRUCTIONS)
  wsInfo['!cols'] = [{ wch: 24 }, { wch: 70 }]
  XLSX.utils.book_append_sheet(wb, ws, 'الأسئلة')
  XLSX.utils.book_append_sheet(wb, wsInfo, 'تعليمات')
  wb.Workbook = { Views: [{ RTL: true }] }
  XLSX.writeFile(wb, 'قالب-اسئلة-المسابقة.xlsx')
}

const strip = (s) => String(s ?? '').trim()
const stripDiacritics = (s) => strip(s).replace(/[أإآ]/g, 'ا').toLowerCase()

function parseType(raw) {
  const t = stripDiacritics(raw)
  if (['اختيار واحد', 'اختيار', 'mc', 'mcq', 'multiple choice'].includes(t)) return 'mc'
  if (['صح او خطا', 'صح وخطا', 'صح خطا', 'tf', 'true/false', 'true false'].includes(t)) return 'tf'
  if (['عدة اجابات', 'متعدد', 'اختيار متعدد', 'multi', 'multiselect'].includes(t)) return 'multi'
  if (['سؤال مفتوح', 'سوال مفتوح', 'مفتوح', 'open'].includes(t)) return 'open'
  return null
}

function parseCorrect(type, raw, options) {
  const value = strip(raw)
  if (type === 'tf') {
    const v = stripDiacritics(value)
    if (['صح', 'true', 't', '1'].includes(v)) return [0]
    if (['خطا', 'false', 'f', '0', '2'].includes(v)) return [1]
    return null
  }
  // Accept western + Arabic-Indic digits, comma or Arabic comma separated.
  const normalized = value
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[،؛;]/g, ',')
  const nums = normalized.split(',').map((s) => s.trim()).filter(Boolean)
  if (nums.every((n) => /^\d+$/.test(n)) && nums.length) {
    const idx = nums.map((n) => parseInt(n, 10) - 1)
    if (idx.every((i) => i >= 0 && i < options.length)) return [...new Set(idx)].sort()
    return null
  }
  // Otherwise match the option text itself (single answer).
  const found = options.findIndex((o) => strip(o) === value)
  return found >= 0 ? [found] : null
}

// Parse an uploaded workbook -> { questions, errors } (both may be non-empty).
export async function parseWorkbook(arrayBuffer) {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = wb.SheetNames.includes('الأسئلة') ? 'الأسئلة' : wb.SheetNames[0]
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' })

  const questions = []
  const errors = []
  rows.slice(1).forEach((row, i) => {
    const rowNum = ar(i + 2)
    if (row.every((cell) => !strip(cell))) return // skip blank lines
    const type = parseType(row[0])
    if (!type) { errors.push(`الصف ${rowNum}: نوع غير معروف «${strip(row[0])}»`); return }
    const text = strip(row[1])
    if (!text) { errors.push(`الصف ${rowNum}: نص السؤال فارغ`); return }

    const time = Math.min(Math.max(parseInt(row[9], 10) || 20, 5), 300)
    const points = Math.min(Math.max(parseInt(row[10], 10) || 1000, 0), 10000)
    const q = { type, text, time, points, model: '', options: [], correct: [] }

    if (type === 'open') {
      q.model = strip(row[8])
    } else if (type === 'tf') {
      q.options = ['صح', 'خطأ']
      const correct = parseCorrect('tf', row[8], q.options)
      if (!correct) { errors.push(`الصف ${rowNum}: الإجابة الصحيحة يجب أن تكون «صح» أو «خطأ»`); return }
      q.correct = correct
    } else {
      q.options = row.slice(2, 8).map(strip).filter(Boolean)
      if (q.options.length < 2) { errors.push(`الصف ${rowNum}: أضف خيارين على الأقل`); return }
      const correct = parseCorrect(type, row[8], q.options)
      if (!correct || !correct.length) { errors.push(`الصف ${rowNum}: تعذّر فهم الإجابة الصحيحة «${strip(row[8])}»`); return }
      if (type === 'mc' && correct.length > 1) { errors.push(`الصف ${rowNum}: اختيار واحد يقبل إجابة صحيحة واحدة فقط`); return }
      q.correct = correct
    }
    questions.push(q)
  })

  return { questions, errors }
}
