import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

// ── the hotel & the student's laptop ──────────────────────────────────
const SSID          = 'Pearl-Hotel-Guest'
const OWN_PERMANENT = '5C:3A:45:1B:9E:22'   // the laptop's real hardware MAC
const FREE_MINUTES  = 30                     // free allowance the portal gives per device
const PREMIUM_MAC   = 'A4:83:E7:2C:19:5F'    // a paying guest's device (Room 305)

// the hotel access-controller remembers every device by its MAC address
const SEED_DEVICES = [
  { id: 1, mac: PREMIUM_MAC,        tier: 'premium', used: false, ar: 'غرفة ٣٠٥ — عميل مميّز (مدفوع)', en: 'Room 305 — Premium guest (paid)' },
  { id: 2, mac: 'F0:9F:C2:88:14:AB', tier: 'free',    used: true,  ar: 'هاتف زائر آخر — انتهت مدته', en: "Another guest's phone — used up" },
]

// a random, locally-administered MAC — exactly what `macchanger -r` produces
function randomMac() {
  const first = (Math.floor(Math.random() * 256) & 0xFC) | 0x02  // locally administered, unicast
  const rest  = Array.from({ length: 5 }, () => Math.floor(Math.random() * 256))
  return [first, ...rest].map(o => o.toString(16).padStart(2, '0').toUpperCase()).join(':')
}

const isMac = s => /^([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$/.test(s)

export default function PageMacSpoofing() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [mac, setMac]         = useState(OWN_PERMANENT)   // the laptop's *current* MAC
  const [conn, setConn]       = useState('offline')       // offline | connecting | online | blocked
  const [plan, setPlan]       = useState(null)            // free | premium
  const [minsLeft, setMins]   = useState(FREE_MINUTES)
  const [devices, setDevices] = useState(SEED_DEVICES)
  const [lines, setLines]     = useState([
    { t: `macchanger 1.7.0 — ${SSID}`, c: '#64748b' },
    { t: isAr ? "اكتب  help  لعرض الأوامر المتاحة." : 'Type  help  to see available commands.', c: '#64748b' },
  ])
  const [input, setInput]     = useState('')

  // objectives
  const [checkedMac, setChecked] = useState(false)
  const [gotBlocked, setBlocked] = useState(false)
  const [bypassed, setBypassed]  = useState(false)

  const spoofed = mac !== OWN_PERMANENT
  const termRef  = useRef(null)
  const tickRef  = useRef(null)
  const connRef  = useRef(null)

  useEffect(() => () => { clearInterval(tickRef.current); clearTimeout(connRef.current) }, [])
  useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight }, [lines])

  const print = (t, c = '#cbd5e1') => setLines(l => [...l, { t, c }])
  const printMany = arr => setLines(l => [...l, ...arr])

  // ── connect / reconnect to the hotel WiFi ───────────────────────────
  function connect() {
    if (conn === 'connecting') return
    clearInterval(tickRef.current)
    setConn('connecting'); setPlan(null)
    connRef.current = setTimeout(() => {
      const known = devices.find(d => d.mac === mac)

      // a paying guest's device → unlimited premium access (impersonation!)
      if (known && known.tier === 'premium') {
        setConn('online'); setPlan('premium')
        markCurrent()
        if (spoofed) winBypass()
        return
      }
      // a free device that already burned its allowance → blocked
      if (known && known.tier === 'free' && known.used) {
        setConn('blocked'); setBlocked(true)
        return
      }
      // brand-new (unknown) device, or a free device with time left → fresh 30 min
      if (!known) {
        setDevices(d => [...d, {
          id: Date.now(), mac, tier: 'free', used: false,
          ar: spoofed ? 'جهازك — هوية مموّهة' : 'جهازك (اللابتوب)',
          en: spoofed ? 'Your device — spoofed identity' : 'Your laptop',
          you: true,
        }])
      }
      setConn('online'); setPlan('free'); setMins(FREE_MINUTES)
      if (spoofed) winBypass()
      startCountdown()
    }, 850)
  }

  function startCountdown() {
    clearInterval(tickRef.current)
    tickRef.current = setInterval(() => {
      setMins(m => {
        if (m <= 1) {
          clearInterval(tickRef.current)
          setConn('blocked'); setBlocked(true)
          setDevices(d => d.map(x => x.mac === mac ? { ...x, used: true } : x))
          return 0
        }
        return m - 1
      })
    }, 260)
  }

  const markCurrent = () => {}   // current row is derived from `mac` at render time

  function winBypass() {
    setBypassed(true)
  }

  // ── terminal ────────────────────────────────────────────────────────
  const IFACE_UP = () => ([
    { t: `wlan0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500`, c: '#7dd3fc' },
    { t: `        ether ${mac.toLowerCase()}  txqueuelen 1000  (Ethernet)`, c: '#a7f3d0' },
    { t: `        RX packets 1284  bytes 982340   TX packets 903  bytes 118442`, c: '#64748b' },
  ])

  function run(raw) {
    const cmd = raw.trim()
    if (!cmd) return
    print(`student@kali:~$ ${cmd}`, '#fbbf24')
    const parts = cmd.split(/\s+/)
    const c0 = parts[0]

    if (c0 === 'help') {
      printMany([
        { t: isAr ? 'الأوامر:' : 'Commands:', c: '#93c5fd' },
        { t: '  ifconfig                         ' + (isAr ? '# اعرض عنوان MAC الحالي' : '# show your current MAC'), c: '#cbd5e1' },
        { t: '  macchanger -r wlan0              ' + (isAr ? '# عنوان MAC عشوائي (جهاز جديد)' : '# random MAC (new device)'), c: '#cbd5e1' },
        { t: '  macchanger -m <MAC> wlan0        ' + (isAr ? '# انتحل عنوان MAC محدد' : '# impersonate a specific MAC'), c: '#cbd5e1' },
        { t: '  macchanger -p wlan0              ' + (isAr ? '# أعد العنوان الأصلي' : '# restore the permanent MAC'), c: '#cbd5e1' },
        { t: '  connect                          ' + (isAr ? '# اتصل بشبكة الفندق' : '# connect to the hotel WiFi'), c: '#cbd5e1' },
        { t: '  clear', c: '#cbd5e1' },
      ])
      return
    }
    if (c0 === 'clear') { setLines([]); return }

    if (c0 === 'ifconfig' || (c0 === 'ip' && parts[1] === 'link')) {
      printMany(IFACE_UP()); setChecked(true); return
    }

    if (c0 === 'connect') { connect(); return }

    if (c0 === 'macchanger') {
      const flag = parts[1]
      if (!flag || flag === '-s' || flag === '--show') {
        printMany([
          { t: `Current MAC:   ${mac.toLowerCase()} (unknown)`, c: '#cbd5e1' },
          { t: `Permanent MAC: ${OWN_PERMANENT.toLowerCase()} (unknown)`, c: '#cbd5e1' },
        ]); setChecked(true); return
      }
      const old = mac
      let next = null, err = null
      if (flag === '-r' || flag === '--random') next = randomMac()
      else if (flag === '-p' || flag === '--permanent') next = OWN_PERMANENT
      else if (flag === '-m' || flag === '--mac' || flag.startsWith('--mac=')) {
        const val = flag.startsWith('--mac=') ? flag.split('=')[1] : parts[2]
        if (isMac(val)) next = val.toUpperCase()
        else err = isAr ? '[error] عنوان MAC غير صالح. الصيغة: XX:XX:XX:XX:XX:XX' : '[error] invalid MAC. Format: XX:XX:XX:XX:XX:XX'
      } else err = isAr ? `[error] خيار غير معروف: ${flag}` : `[error] unknown option: ${flag}`

      if (err) { print(err, '#fca5a5'); return }
      setMac(next)
      if (conn !== 'offline') { clearInterval(tickRef.current); setConn('offline'); setPlan(null) }
      printMany([
        { t: `Current MAC:   ${old.toLowerCase()} (unknown)`, c: '#cbd5e1' },
        { t: `Permanent MAC: ${OWN_PERMANENT.toLowerCase()} (unknown)`, c: '#cbd5e1' },
        { t: `New MAC:       ${next.toLowerCase()} (unknown)`, c: '#86efac' },
        { t: isAr ? '↳ عنوانك تغيّر. اكتب  connect  للاتصال من جديد.' : '↳ Your address changed. Type  connect  to reconnect.', c: '#64748b' },
      ])
      return
    }

    print(isAr ? `الأمر غير موجود: ${c0} — اكتب help` : `command not found: ${c0} — type help`, '#fca5a5')
  }

  function onKey(e) { if (e.key === 'Enter') { run(input); setInput('') } }

  // ── UI helpers ──────────────────────────────────────────────────────
  const steps = [
    { ok: checkedMac, ar: 'اعرض عنوان MAC لجهازك (ifconfig)', en: 'Show your MAC address (ifconfig)', ic: '🔍' },
    { ok: gotBlocked, ar: 'اتصل واستهلك دقائقك المجانية حتى تُحجب', en: 'Connect & burn your free minutes until blocked', ic: '⏳' },
    { ok: bypassed,   ar: 'موّه عنوان MAC واتصل من جديد لتتجاوز الحظر', en: 'Spoof your MAC & reconnect to bypass the block', ic: '🎭' },
  ]

  const tierPill = d => {
    const cur = d.mac === mac
    if (d.tier === 'premium') return { bg: '#faf5ff', bd: '#e9d5ff', fg: '#7e22ce', txt: isAr ? 'مميّز • غير محدود' : 'Premium • unlimited' }
    if (d.used) return { bg: '#fef2f2', bd: '#fecaca', fg: '#b91c1c', txt: isAr ? 'مجاني — انتهى' : 'Free — used up' }
    return { bg: '#f0fdf4', bd: '#bbf7d0', fg: '#15803d', txt: isAr ? 'مجاني — نشط' : 'Free — active' }
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '20px 14px', fontFamily: 'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ background: '#eef2ff', color: '#4338ca', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🧪 {isAr ? 'مختبر أمان الشبكات' : 'Network Security Lab'}</span>
        <button onClick={() => navigate('/')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '3px 10px', fontSize: 12, color: '#64748b', cursor: 'pointer' }}>{isAr ? '← الرئيسية' : '← Home'}</button>
      </div>
      <h1 style={{ fontSize: 23, fontWeight: 900, color: '#0e1f39', margin: '0 0 14px' }}>🎭 {isAr ? 'تمويه عنوان MAC — سيناريو واي فاي الفندق' : 'MAC Spoofing — The Hotel WiFi Scenario'}</h1>

      {/* objectives */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: s.ok ? '#f0fdf4' : 'white', border: `2px solid ${s.ok ? '#86efac' : '#e2e8f0'}`, borderRadius: 10, padding: '8px 11px' }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: s.ok ? '#22c55e' : '#f1f5f9', color: s.ok ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{s.ok ? '✓' : s.ic}</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: s.ok ? '#15803d' : '#475569' }}>{i + 1}. {isAr ? s.ar : s.en}</span>
          </div>
        ))}
      </div>

      {/* two columns: captive portal (laptop) + terminal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'stretch' }}>

        {/* ── LEFT: laptop with the captive portal ─────────────────── */}
        <div style={{ border: '2px solid #cbd5e1', borderRadius: 12, overflow: 'hidden', background: 'white', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
          {/* browser chrome */}
          <div style={{ background: '#e2e8f0', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }} dir="ltr">
            <span style={{ display: 'flex', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444' }} /><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }} /><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e' }} /></span>
            <div style={{ flex: 1, background: 'white', borderRadius: 20, padding: '4px 12px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: 11.5, color: '#334155' }}>🌐 http://pearl-hotel.wifi/login</div>
          </div>

          {/* portal body */}
          <div style={{ padding: '18px 16px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', minHeight: 360 }}>
            <div style={{ fontSize: 34 }}>🏨</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#0e1f39' }}>{isAr ? 'فندق اللؤلؤة' : 'Pearl Hotel'}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }} dir="ltr">📶 {SSID}</div>

            {/* current device MAC */}
            <div style={{ background: '#0e1f39', color: '#a7f3d0', fontFamily: 'monospace', fontSize: 12.5, padding: '5px 12px', borderRadius: 8, margin: '8px 0 14px', letterSpacing: 0.5 }} dir="ltr">
              {isAr ? '' : ''}MAC: {mac}{spoofed && <span style={{ color: '#fbbf24' }}> {isAr ? '• مموّه' : '• spoofed'}</span>}
            </div>

            {/* status area */}
            {conn === 'offline' && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 12px', lineHeight: 1.7, maxWidth: 280 }}>
                  {isAr ? 'انضم إلى الشبكة لتحصل على ٣٠ دقيقة مجانية لهذا الجهاز.' : 'Join the network to get 30 free minutes for this device.'}
                </p>
                <button onClick={connect} style={{ background: '#8dc63f', color: '#0e1f39', border: 'none', borderRadius: 9, padding: '10px 26px', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>
                  {isAr ? '⚡ اتصل بالشبكة' : '⚡ Connect'}
                </button>
              </div>
            )}

            {conn === 'connecting' && (
              <div style={{ textAlign: 'center', color: '#475569' }}>
                <div style={{ fontSize: 26, animation: 'spin 1s linear infinite' }}>◌</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>{isAr ? 'جارٍ التحقق من الجهاز…' : 'Checking device…'}</div>
              </div>
            )}

            {conn === 'online' && plan === 'free' && (
              <div style={{ textAlign: 'center', width: '100%', maxWidth: 300 }}>
                <div style={{ fontSize: 30 }}>✅</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#15803d' }}>{isAr ? 'أنت متصل بالإنترنت' : "You're online"}</div>
                <div style={{ fontSize: 12, color: '#64748b', margin: '4px 0 8px' }}>{isAr ? `الدقائق المجانية المتبقية: ${minsLeft}` : `Free minutes left: ${minsLeft}`}</div>
                <div style={{ height: 10, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(minsLeft / FREE_MINUTES) * 100}%`, background: minsLeft > 8 ? '#8dc63f' : '#f59e0b', transition: 'width .25s linear' }} />
                </div>
              </div>
            )}

            {conn === 'online' && plan === 'premium' && (
              <div style={{ textAlign: 'center', maxWidth: 300 }}>
                <div style={{ fontSize: 30 }}>👑</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#7e22ce' }}>{isAr ? 'وصول مميّز — غير محدود' : 'Premium access — unlimited'}</div>
                <div style={{ fontSize: 11.5, color: '#7e22ce', marginTop: 6, lineHeight: 1.7, background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: '7px 10px' }}>
                  {isAr ? 'الفندق يظنّ أنك جهاز غرفة ٣٠٥ المدفوع — لقد انتحلت هويّته!' : "The hotel thinks you are Room 305's paid device — you impersonated it!"}
                </div>
              </div>
            )}

            {conn === 'blocked' && (
              <div style={{ textAlign: 'center', maxWidth: 300 }}>
                <div style={{ fontSize: 30 }}>⛔</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#b91c1c' }}>{isAr ? 'انتهت مدتك المجانية' : 'Your free trial is over'}</div>
                <div style={{ fontSize: 12, color: '#7f1d1d', marginTop: 6, lineHeight: 1.7 }}>
                  {isAr ? 'استهلك هذا الجهاز دقائقه الـ ٣٠ المجانية. للاستمرار ادفع ٥٠ ريالاً… أو غيّر عنوان MAC من الطرفية 👉' : 'This device used its 30 free minutes. Pay 50 QAR to continue… or change your MAC in the terminal 👉'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: terminal ──────────────────────────────────────── */}
        <div style={{ border: '2px solid #0e1f39', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#0b1020', boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
          <div style={{ background: '#0e1f39', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8 }} dir="ltr">
            <span style={{ display: 'flex', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444' }} /><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }} /><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e' }} /></span>
            <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 12 }}>student@kali: ~</span>
          </div>
          <div ref={termRef} onClick={() => document.getElementById('mac-inp')?.focus()} style={{ flex: 1, padding: '10px 12px', fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.65, overflowY: 'auto', minHeight: 360, maxHeight: 420, cursor: 'text' }} dir="ltr">
            {lines.map((l, i) => <div key={i} style={{ color: l.c, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{l.t}</div>)}
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ color: '#fbbf24' }}>student@kali:~$</span>
              <input id="mac-inp" value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} autoFocus spellCheck={false} autoComplete="off"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontFamily: 'monospace', fontSize: 12.5 }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── hotel access-controller: known devices ───────────────────── */}
      <div style={{ marginTop: 14, border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: 'white' }}>
        <div style={{ background: '#0e1f39', color: 'white', padding: '9px 14px', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          📋 {isAr ? 'ذاكرة راوتر الفندق — الأجهزة المعروفة (حسب عنوان MAC)' : "Hotel router's memory — known devices (by MAC address)"}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }} dir="ltr">
            <thead>
              <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '8px 14px', fontWeight: 700 }}>MAC</th>
                <th style={{ padding: '8px 14px', fontWeight: 700 }}>{isAr ? 'الجهاز' : 'Device'}</th>
                <th style={{ padding: '8px 14px', fontWeight: 700 }}>{isAr ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(d => {
                const p = tierPill(d)
                const cur = d.mac === mac
                return (
                  <tr key={d.id} style={{ borderTop: '1px solid #f1f5f9', background: cur ? '#fffbeb' : 'transparent' }}>
                    <td style={{ padding: '8px 14px', fontFamily: 'monospace', color: '#0e1f39', fontWeight: cur ? 800 : 500 }}>
                      {d.mac}{cur && <span style={{ color: '#b45309' }}> ◀ {isAr ? 'أنت' : 'you'}</span>}
                    </td>
                    <td style={{ padding: '8px 14px', color: '#475569' }} dir={isAr ? 'rtl' : 'ltr'}>{isAr ? d.ar : d.en}</td>
                    <td style={{ padding: '8px 14px' }}>
                      <span style={{ background: p.bg, border: `1px solid ${p.bd}`, color: p.fg, fontWeight: 700, fontSize: 11, padding: '2px 9px', borderRadius: 20 }}>{p.txt}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '8px 14px', fontSize: 11.5, color: '#94a3b8', borderTop: '1px solid #f1f5f9' }} dir={isAr ? 'rtl' : 'ltr'}>
          💡 {isAr ? 'كل عنوان MAC جديد = سطر جديد يظنّه الفندق «جهازاً جديداً». راقب كيف تمتلئ القائمة بهوياتك المزيّفة.' : 'Every new MAC = a new row the hotel treats as a "new device". Watch the list fill up with your fake identities.'}
        </div>
      </div>

      <Explanation>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px', maxWidth: 900, lineHeight: 1.7 }}>
          {isAr
            ? 'واي فاي الفندق «مجاني» — لكن ٣٠ دقيقة فقط لكل جهاز. كيف يعرف الفندق أنه «جهازك»؟ عبر عنوان الـ MAC، وهو رقم فريد لكل كرت شبكة. المشكلة: هذا الرقم يمكن تغييره ببساطة! عندما تنتهي دقائقك، غيّر عنوان MAC فيظنّ الفندق أنك جهاز جديد ويمنحك ٣٠ دقيقة أخرى… أو انتحل جهاز عميل مدفوع لتحصل على وصول غير محدود.'
            : 'The hotel WiFi is "free" — but only 30 minutes per device. How does the hotel know it is your device? By its MAC address, a unique ID burned into every network card. The catch: that ID can simply be changed! When your minutes run out, change your MAC and the hotel thinks you are a brand-new device and gives you another 30 minutes… or impersonate a paying guest for unlimited access.'}
        </p>

        {/* ── success + vulnerability/fix note (after a successful spoof) ── */}
        {bypassed && (
          <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#b91c1c', marginBottom: 6 }}>🎭 {isAr ? 'تجاوزت الحظر! — الثغرة والحل' : 'You bypassed the block! — The Vulnerability & The Fix'}</div>
            <p style={{ fontSize: 13, color: '#7f1d1d', margin: '0 0 8px', lineHeight: 1.8, fontWeight: 700 }}>
              ⚠️ {isAr
                ? 'التحكم في الوصول بالاعتماد على عنوان MAC وحده ضعيف؛ لأن عنوان MAC يمكن تزويره بسهولة.'
                : 'Access control based on MAC address alone is weak, because a MAC address is trivially spoofable.'}
            </p>
            <ul style={{ margin: 0, paddingInlineStart: 20, color: '#991b1b', fontSize: 12.5, lineHeight: 1.9 }}>
              <li>{isAr ? 'عنوان MAC يُرسَل نصّاً صريحاً مع كل حزمة — أي جهاز يستطيع قراءته ثم انتحاله.' : 'A MAC address is sent in clear text with every packet — any device can read it and then impersonate it.'}</li>
              <li>{isAr ? 'الحل: اربط الوصول بحساب مستخدم (تسجيل دخول) وليس بالجهاز، أو استخدم بوابة أسيرة مع مصادقة WPA2-Enterprise / RADIUS.' : 'Fix: tie access to a user account (login), not a device — or use a captive portal with WPA2-Enterprise / RADIUS authentication.'}</li>
              <li>{isAr ? 'انتحال عنوان جهاز عميل مدفوع هو سرقة خدمة — تعلّمناه هنا للدفاع، لا للإضرار.' : "Impersonating a paying guest's device is theft of service — we learn it here to defend, not to harm."}</li>
            </ul>
          </div>
        )}
      </Explanation>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1d4ed8', background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 10, padding: '10px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          <ChevronLeft size={15} />{isAr ? 'الرئيسية' : 'Home'}
        </button>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
