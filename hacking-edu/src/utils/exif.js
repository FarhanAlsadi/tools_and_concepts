/* ────────────────────────────────────────────────────────────────────────────
   Minimal, dependency-free EXIF reader + a tiny EXIF writer (for the sample
   image). Real parsing of real JPEG bytes — no libraries.

   parseExif(arrayBuffer) → { isJpeg, hasExif, tags, gps }
     tags: { Make, Model, Software, DateTime, DateTimeOriginal, Orientation,
             ISO, PixelXDimension, PixelYDimension, ExposureTime, FocalLength }
     gps:  { lat, lon } | null   (decimal degrees)

   buildExifApp1({make, model, dateTime, lat, lon}) → Uint8Array (a JPEG APP1
     segment) and injectExif(jpegBytes, app1) → Uint8Array insert it after SOI.
   ──────────────────────────────────────────────────────────────────────────── */

const TAGS = {
  0x010F: 'Make', 0x0110: 'Model', 0x0131: 'Software', 0x0132: 'DateTime',
  0x0112: 'Orientation', 0x9003: 'DateTimeOriginal', 0x8827: 'ISO',
  0xA002: 'PixelXDimension', 0xA003: 'PixelYDimension',
  0x829A: 'ExposureTime', 0x920A: 'FocalLength',
}
const GPS_TAGS = { 0x0001: 'LatRef', 0x0002: 'Lat', 0x0003: 'LonRef', 0x0004: 'Lon', 0x0006: 'Altitude' }
const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }

function readValue(view, tiff, entry, little) {
  const type = view.getUint16(entry + 2, little)
  const count = view.getUint32(entry + 4, little)
  const total = (TYPE_SIZE[type] || 1) * count
  const at = total <= 4 ? entry + 8 : tiff + view.getUint32(entry + 8, little)
  if (at < 0 || at + total > view.byteLength) return null
  if (type === 2) { // ASCII
    let s = ''
    for (let i = 0; i < count; i++) { const c = view.getUint8(at + i); if (c === 0) break; s += String.fromCharCode(c) }
    return s.trim()
  }
  if (type === 3) { // SHORT
    if (count === 1) return view.getUint16(at, little)
    const arr = []; for (let i = 0; i < count; i++) arr.push(view.getUint16(at + i * 2, little)); return arr
  }
  if (type === 4) { // LONG
    if (count === 1) return view.getUint32(at, little)
    const arr = []; for (let i = 0; i < count; i++) arr.push(view.getUint32(at + i * 4, little)); return arr
  }
  if (type === 5) { // RATIONAL (num/den)
    const rat = i => { const n = view.getUint32(at + i * 8, little); const d = view.getUint32(at + i * 8 + 4, little); return d ? n / d : 0 }
    if (count === 1) return rat(0)
    const arr = []; for (let i = 0; i < count; i++) arr.push(rat(i)); return arr
  }
  return null
}

function readIFD(view, tiff, dir, little, tags, ptrs, isGps) {
  if (dir + 2 > view.byteLength) return
  const n = view.getUint16(dir, little)
  for (let i = 0; i < n; i++) {
    const entry = dir + 2 + i * 12
    if (entry + 12 > view.byteLength) break
    const tag = view.getUint16(entry, little)
    if (!isGps && tag === 0x8769) { ptrs.exif = view.getUint32(entry + 8, little); continue }
    if (!isGps && tag === 0x8825) { ptrs.gps = view.getUint32(entry + 8, little); continue }
    const name = isGps ? GPS_TAGS[tag] : TAGS[tag]
    if (!name) continue
    const v = readValue(view, tiff, entry, little)
    if (v !== null) tags[name] = v
  }
}

function computeGps(g) {
  if (!Array.isArray(g.Lat) || !Array.isArray(g.Lon) || g.Lat.length < 3 || g.Lon.length < 3) return null
  const dms = a => a[0] + a[1] / 60 + a[2] / 3600
  let lat = dms(g.Lat), lon = dms(g.Lon)
  if (g.LatRef === 'S') lat = -lat
  if (g.LonRef === 'W') lon = -lon
  if (!isFinite(lat) || !isFinite(lon)) return null
  return { lat, lon }
}

function readTiff(view, tiff) {
  const bom = view.getUint16(tiff)
  const little = bom === 0x4949
  if (!little && bom !== 0x4D4D) return { tags: {}, gps: null }
  const ifd0 = tiff + view.getUint32(tiff + 4, little)
  const tags = {}, ptrs = {}
  readIFD(view, tiff, ifd0, little, tags, ptrs, false)
  if (ptrs.exif) readIFD(view, tiff, tiff + ptrs.exif, little, tags, {}, false)
  let gps = null
  if (ptrs.gps) { const g = {}; readIFD(view, tiff, tiff + ptrs.gps, little, g, {}, true); gps = computeGps(g) }
  return { tags, gps }
}

export function parseExif(buffer) {
  const view = new DataView(buffer)
  if (view.byteLength < 4 || view.getUint16(0) !== 0xFFD8) return { isJpeg: false, hasExif: false, tags: {}, gps: null }
  let offset = 2
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xFF) { offset++; continue }
    const marker = view.getUint8(offset + 1)
    if (marker === 0xD8 || marker === 0xD9) { offset += 2; continue }
    if (marker === 0xDA) break // start of scan → compressed image data
    const size = view.getUint16(offset + 2)
    if (size < 2) break
    if (marker === 0xE1 && offset + 10 <= view.byteLength &&
        view.getUint32(offset + 4) === 0x45786966 && view.getUint16(offset + 8) === 0x0000) {
      return { isJpeg: true, hasExif: true, ...readTiff(view, offset + 10) }
    }
    offset += 2 + size
  }
  return { isJpeg: true, hasExif: false, tags: {}, gps: null }
}

/* ── tiny EXIF writer (for the built-in sample image) ─────────────────────── */
export function buildExifApp1({ make, model, dateTime, lat, lon }) {
  const toDMS = dec => {
    const a = Math.abs(dec), d = Math.floor(a), mf = (a - d) * 60, m = Math.floor(mf), s = (mf - m) * 60
    return [[d, 1], [m, 1], [Math.round(s * 100), 100]]
  }
  const latRef = lat >= 0 ? 'N' : 'S', lonRef = lon >= 0 ? 'E' : 'W'
  const latDMS = toDMS(lat), lonDMS = toDMS(lon)

  const buf = new ArrayBuffer(512)
  const dv = new DataView(buf)
  const u8 = (o, v) => dv.setUint8(o, v)
  const u16 = (o, v) => dv.setUint16(o, v, true)
  const u32 = (o, v) => dv.setUint32(o, v, true)
  const ascii = (o, s) => { for (let i = 0; i < s.length; i++) u8(o + i, s.charCodeAt(i)); u8(o + s.length, 0) }

  // TIFF header (little-endian), IFD0 at offset 8
  u16(0, 0x4949); u16(2, 0x002A); u32(4, 8)

  const IFD0 = 8, IFD0_N = 5
  const EXIF = IFD0 + 2 + IFD0_N * 12 + 4
  const EXIF_N = 1
  const GPS = EXIF + 2 + EXIF_N * 12 + 4
  const GPS_N = 4
  let data = GPS + 2 + GPS_N * 12 + 4
  const put = len => { const at = data; data += len; return at }

  const makeOff = put(make.length + 1); ascii(makeOff, make)
  const modelOff = put(model.length + 1); ascii(modelOff, model)
  const dtOff = put(dateTime.length + 1); ascii(dtOff, dateTime)
  const dtoOff = put(dateTime.length + 1); ascii(dtoOff, dateTime)
  const latOff = put(24); latDMS.forEach((r, i) => { u32(latOff + i * 8, r[0]); u32(latOff + i * 8 + 4, r[1]) })
  const lonOff = put(24); lonDMS.forEach((r, i) => { u32(lonOff + i * 8, r[0]); u32(lonOff + i * 8 + 4, r[1]) })

  let e = 0
  const entry = (tag, type, count, valOrOff, inline) => {
    u16(e, tag); u16(e + 2, type); u32(e + 4, count)
    if (inline) inline(e + 8); else u32(e + 8, valOrOff)
    e += 12
  }

  e = IFD0; u16(e, IFD0_N); e += 2
  entry(0x010F, 2, make.length + 1, makeOff)
  entry(0x0110, 2, model.length + 1, modelOff)
  entry(0x0132, 2, dateTime.length + 1, dtOff)
  entry(0x8769, 4, 1, EXIF)
  entry(0x8825, 4, 1, GPS)
  u32(e, 0); e += 4

  e = EXIF; u16(e, EXIF_N); e += 2
  entry(0x9003, 2, dateTime.length + 1, dtoOff)
  u32(e, 0); e += 4

  e = GPS; u16(e, GPS_N); e += 2
  entry(0x0001, 2, 2, null, o => { u8(o, latRef.charCodeAt(0)); u8(o + 1, 0) })
  entry(0x0002, 5, 3, latOff)
  entry(0x0003, 2, 2, null, o => { u8(o, lonRef.charCodeAt(0)); u8(o + 1, 0) })
  entry(0x0004, 5, 3, lonOff)
  u32(e, 0); e += 4

  const tiffLen = data
  const app1 = new Uint8Array(4 + 6 + tiffLen)
  app1[0] = 0xFF; app1[1] = 0xE1
  const segLen = 2 + 6 + tiffLen
  app1[2] = (segLen >> 8) & 0xFF; app1[3] = segLen & 0xFF
  app1[4] = 0x45; app1[5] = 0x78; app1[6] = 0x69; app1[7] = 0x66; app1[8] = 0; app1[9] = 0 // 'Exif\0\0'
  app1.set(new Uint8Array(buf, 0, tiffLen), 10)
  return app1
}

export function injectExif(jpeg, app1) {
  const out = new Uint8Array(jpeg.length + app1.length)
  out.set(jpeg.subarray(0, 2), 0)                 // SOI (FFD8)
  out.set(app1, 2)
  out.set(jpeg.subarray(2), 2 + app1.length)
  return out
}
