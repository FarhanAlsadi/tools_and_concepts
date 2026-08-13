import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'
import { parseExif, buildExifApp1, injectExif } from '../utils/exif'

/* ────────────────────────────────────────────────────────────────────────────
   PHOTO METADATA / EXIF — real parsing
   Upload any real image and the page reads its ACTUAL EXIF (camera, date, and —
   the privacy shock — GPS location). A built-in sample image is generated on a
   canvas with real EXIF embedded, so there is always something to inspect.
   ──────────────────────────────────────────────────────────────────────────── */

const dataURLtoBytes = (dataURL) => {
  const bin = atob(dataURL.split(',')[1])
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}
const bytesToDataURL = (bytes) => {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return 'data:image/jpeg;base64,' + btoa(bin)
}

export default function PageExif() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [img, setImg]       = useState(null)   // data URL / object URL for preview
  const [meta, setMeta]     = useState(null)   // parseExif result
  const [fileName, setName] = useState('')
  const fileRef = useRef(null)
  const urlRef  = useRef(null)                  // last object URL, so we can revoke it

  // revoke any outstanding object URL on unmount
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current) }, [])

  const showImage = (url, isBlob) => {
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null }
    if (isBlob) urlRef.current = url
    setImg(url)
  }

  const onUpload = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const buf = await file.arrayBuffer()          // parse first, then update preview + meta together
    setName(file.name)
    showImage(URL.createObjectURL(file), true)
    setMeta(parseExif(buf))
  }

  const useSample = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 320; canvas.height = 220
    const ctx = canvas.getContext('2d')
    // sky
    const g = ctx.createLinearGradient(0, 0, 0, 140)
    g.addColorStop(0, '#79c4ef'); g.addColorStop(1, '#e2f2fb')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 320, 140)
    // sun
    ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.arc(262, 44, 20, 0, Math.PI * 2); ctx.fill()
    // dunes
    ctx.fillStyle = '#e8c07d'; ctx.beginPath()
    ctx.moveTo(0, 145); ctx.quadraticCurveTo(90, 112, 175, 145); ctx.quadraticCurveTo(250, 168, 320, 138)
    ctx.lineTo(320, 220); ctx.lineTo(0, 220); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#d4a55f'; ctx.beginPath()
    ctx.moveTo(0, 175); ctx.quadraticCurveTo(120, 150, 220, 178); ctx.quadraticCurveTo(280, 192, 320, 175)
    ctx.lineTo(320, 220); ctx.lineTo(0, 220); ctx.closePath(); ctx.fill()
    // camel + label
    ctx.font = '38px serif'; ctx.fillText('🐪', 132, 182)
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('Doha, Qatar', 12, 210)

    const jpeg = dataURLtoBytes(canvas.toDataURL('image/jpeg', 0.85))
    const app1 = buildExifApp1({ make: 'Apple', model: 'iPhone 13 Pro', dateTime: '2026:03:15 14:22:31', lat: 25.28667, lon: 51.53389 })
    const withExif = injectExif(jpeg, app1)
    setName('sample_qatar.jpg')
    showImage(bytesToDataURL(withExif), false)
    setMeta(parseExif(withExif.buffer))
  }

  // build the metadata rows from whatever the parser found
  const rows = []
  if (meta && meta.hasExif) {
    const t = meta.tags
    const camera = [t.Make, t.Model].filter(Boolean).join(' ')
    if (camera) rows.push({ ic: '📷', ar: 'الكاميرا / الجهاز', en: 'Camera / device', v: camera })
    if (t.DateTimeOriginal || t.DateTime) rows.push({ ic: '📅', ar: 'تاريخ الالتقاط', en: 'Date taken', v: t.DateTimeOriginal || t.DateTime })
    if (t.PixelXDimension && t.PixelYDimension) rows.push({ ic: '📐', ar: 'الأبعاد', en: 'Dimensions', v: `${t.PixelXDimension} × ${t.PixelYDimension}` })
    if (t.Software) rows.push({ ic: '🛠️', ar: 'البرنامج', en: 'Software', v: t.Software })
    if (t.ISO) rows.push({ ic: '🎞️', ar: 'ISO', en: 'ISO', v: String(t.ISO) })
    if (t.FocalLength) rows.push({ ic: '🔭', ar: 'البُعد البؤري', en: 'Focal length', v: `${t.FocalLength} mm` })
    if (t.Orientation) rows.push({ ic: '🧭', ar: 'الاتجاه', en: 'Orientation', v: String(t.Orientation) })
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '20px 14px', fontFamily: 'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🔐 {isAr ? 'الخصوصية' : 'Privacy'}</span>
        <button onClick={() => navigate('/')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '3px 10px', fontSize: 12, color: '#64748b', cursor: 'pointer' }}>{isAr ? '← الرئيسية' : '← Home'}</button>
      </div>
      <h1 style={{ fontSize: 23, fontWeight: 900, color: '#1e293b', margin: '0 0 12px' }}>📷 {isAr ? 'البيانات المخفية في الصور — EXIF' : 'The Hidden Data in Photos — EXIF'}</h1>

      {/* actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={() => fileRef.current && fileRef.current.click()} style={{ flex: 1, minWidth: 200, padding: '12px', borderRadius: 12, border: '2px dashed #93c5fd', background: '#eff6ff', color: '#1d4ed8', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
          📁 {isAr ? 'ارفع صورتك الحقيقية' : 'Upload your real photo'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onClick={e => { e.currentTarget.value = '' }} onChange={onUpload} style={{ display: 'none' }} />
        <button onClick={useSample} style={{ flex: 1, minWidth: 200, padding: '12px', borderRadius: 12, border: '2px solid #e2e8f0', background: 'white', color: '#0e1f39', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
          🏞️ {isAr ? 'استخدم صورة تجريبية' : 'Use a sample image'}
        </button>
      </div>

      {/* results */}
      {meta && (
        <div style={{ display: 'grid', gridTemplateColumns: img ? '260px 1fr' : '1fr', gap: 16, alignItems: 'start' }}>
          {/* preview */}
          {img && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#f8fafc' }}>
              <img src={img} alt="preview" style={{ width: '100%', display: 'block' }} />
              <div style={{ padding: '6px 10px', fontSize: 11, color: '#64748b', fontFamily: 'monospace', wordBreak: 'break-all' }} dir="ltr">{fileName}</div>
            </div>
          )}

          {/* metadata */}
          <div>
            {/* GPS — the headline */}
            {meta.gps && (
              <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#b91c1c', marginBottom: 4 }}>📍 {isAr ? 'مكان التقاط الصورة مكشوف!' : "The photo's location is exposed!"}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#7f1d1d', fontWeight: 700 }} dir="ltr">{meta.gps.lat.toFixed(5)}, {meta.gps.lon.toFixed(5)}</div>
                <a href={`https://www.google.com/maps?q=${meta.gps.lat},${meta.gps.lon}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, background: '#dc2626', color: 'white', textDecoration: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 700 }}>
                  🗺️ {isAr ? 'افتح الموقع على الخريطة' : 'Open location on the map'}
                </a>
                <div style={{ fontSize: 11.5, color: '#991b1b', marginTop: 8, lineHeight: 1.6 }}>{isAr ? 'أي شخص يحصل على هذه الصورة يعرف أين كنت بالضبط. لهذا انتبه قبل مشاركة صورك الأصلية.' : 'Anyone who gets this photo knows exactly where you were. This is why you should be careful sharing original photos.'}</div>
              </div>
            )}

            {/* tag table */}
            {rows.length > 0 && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ background: '#0e1f39', color: 'white', fontSize: 12.5, fontWeight: 800, padding: '9px 14px' }}>🗂 {isAr ? 'البيانات الوصفية المستخرجة' : 'Extracted metadata'}</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} style={{ borderTop: i ? '1px solid #f1f5f9' : 'none' }}>
                        <td style={{ padding: '9px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{r.ic} {isAr ? r.ar : r.en}</td>
                        <td style={{ padding: '9px 14px', color: '#0e1f39', fontWeight: 600, fontFamily: 'monospace', textAlign: isAr ? 'left' : 'right' }} dir="ltr">{r.v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* no-exif / not-jpeg messages (teaching points) */}
            {!meta.isJpeg && (
              <div style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#15803d' }}>✓ {isAr ? 'لا توجد بيانات EXIF' : 'No EXIF data'}</div>
                <p style={{ fontSize: 12.5, color: '#166534', margin: '6px 0 0', lineHeight: 1.7 }}>{isAr ? 'هذا الملف ليس JPEG. عادةً لا تحمل صور PNG أو لقطات الشاشة بيانات EXIF — وهذا أفضل لخصوصيتك.' : 'This is not a JPEG. PNGs and screenshots usually carry no EXIF data — which is better for your privacy.'}</p>
              </div>
            )}
            {meta.isJpeg && !meta.hasExif && (
              <div style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#15803d' }}>✓ {isAr ? 'الصورة نظيفة من البيانات الوصفية' : 'This image has no metadata'}</div>
                <p style={{ fontSize: 12.5, color: '#166534', margin: '6px 0 0', lineHeight: 1.7 }}>{isAr ? 'لا توجد EXIF — غالباً جُرِّدت. منصّات مثل واتساب وإنستغرام وفيسبوك تحذف EXIF تلقائياً عند الرفع (خبر جيد لخصوصيتك). جرّب صورة أصلية من كاميرا الهاتف مباشرة لترى الفرق.' : 'No EXIF — likely stripped. WhatsApp, Instagram and Facebook remove EXIF automatically on upload (good for your privacy). Try an original photo straight from a phone camera to see the difference.'}</p>
              </div>
            )}
            {meta.hasExif && rows.length === 0 && !meta.gps && (
              <div style={{ background: '#fffbeb', border: '2px solid #fde68a', borderRadius: 12, padding: '12px 14px', fontSize: 12.5, color: '#92610a' }}>{isAr ? 'تحتوي الصورة على EXIF لكن دون حقول معروفة لعرضها.' : 'The image has EXIF, but no recognizable fields to display.'}</div>
            )}
          </div>
        </div>
      )}

      {/* explanation — collapsed by default, sits under the practical part */}
      <Explanation>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', maxWidth: 760, lineHeight: 1.7 }}>
          {isAr
            ? 'كل صورة تلتقطها كاميرا أو هاتف تحمل بيانات مخفية (EXIF): نوع الجهاز، وقت الالتقاط، وأحياناً مكانك بالضبط عبر GPS! ارفع صورة حقيقية من جهازك، أو استخدم الصورة التجريبية، وشاهد ما تكشفه عنك.'
            : "Every photo a camera or phone takes carries hidden data (EXIF): the device, the exact time, and sometimes your precise GPS location! Upload a real photo from your device, or use the sample image, and see what it reveals about you."}
        </p>
        <div style={{ background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#1e40af', marginBottom: 6 }}>🛡️ {isAr ? 'كيف تحمي خصوصيتك' : 'How to protect your privacy'}</div>
          <ul style={{ margin: 0, paddingInlineStart: 20, color: '#1e3a8a', fontSize: 12.5, lineHeight: 1.9 }}>
            <li>{isAr ? 'أوقف حفظ الموقع في إعدادات الكاميرا (Location / Geotagging).' : 'Turn off location saving in your camera settings (Location / Geotagging).' }</li>
            <li>{isAr ? 'شارك «لقطة شاشة» للصورة بدلاً من الأصل — لقطة الشاشة لا تحمل EXIF.' : 'Share a screenshot of the photo instead of the original — screenshots carry no EXIF.'}</li>
            <li>{isAr ? 'استخدم خيار «إزالة بيانات الموقع» قبل المشاركة، أو أداة لتنظيف EXIF.' : 'Use “remove location data” before sharing, or an EXIF-cleaning tool.'}</li>
            <li>{isAr ? 'تذكّر: منصّات التواصل تحذف EXIF غالباً، لكن الإرسال المباشر للملف الأصلي (بريد/بلوتوث) لا يحذفه.' : 'Remember: social platforms usually strip EXIF, but sending the original file directly (email/Bluetooth) does not.'}</li>
          </ul>
        </div>
      </Explanation>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1d4ed8', background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 10, padding: '10px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          <ChevronLeft size={15} />{isAr ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
