import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   FTP — File Transfer Protocol
   A terminal FTP client (connect, USER, PASS, ls, get, put) against a fake server,
   next to a live network sniffer. In FTP mode the sniffer shows everything in
   cleartext — including your password! Switch to SFTP and the same traffic becomes
   encrypted gibberish. Teaches how file transfer works and why plain FTP is unsafe.
   ──────────────────────────────────────────────────────────────────────────── */

const CREDS = { user: 'admin', pass: 'Dukkan#2026' }
const FILES = ['index.html', 'style.css', 'backup.zip', 'config.php', 'images/']
const HOST = 'dukkan.shop'

// deterministic "encrypted" gibberish for SFTP sniffer lines
const enc = (seed) => {
  const hex = '0123456789abcdef'
  let s = '', n = seed * 2654435761 % 4294967296
  for (let i = 0; i < 24; i++) { n = (n * 1103515245 + 12345) % 4294967296; s += hex[(n >> 8) & 15]; if (i % 4 === 3) s += ' ' }
  return s.trim()
}

export default function PageFTP() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const ar = lang === 'ar'

  const [proto, setProto]   = useState('ftp')     // 'ftp' | 'sftp'
  const [lines, setLines]   = useState([])        // terminal output
  const [sniff, setSniff]   = useState([])        // wire capture
  const [input, setInput]   = useState('')
  const [conn, setConn]     = useState(false)
  const [authed, setAuthed] = useState(false)
  const [pendUser, setPend] = useState(null)
  // objectives
  const [listed, setListed]   = useState(false)
  const [downloaded, setDl]   = useState(false)
  const seedRef = useRef(0)
  const termRef = useRef(null)
  const sniffRef = useRef(null)

  useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight }, [lines])
  useEffect(() => { if (sniffRef.current) sniffRef.current.scrollTop = sniffRef.current.scrollHeight }, [sniff])

  const port = proto === 'ftp' ? 21 : 22
  const prompt = proto === 'ftp' ? 'ftp>' : 'sftp>'

  const print = (t, c = '#cbd5e1') => setLines(l => [...l, { t, c }])
  const printMany = arr => setLines(l => [...l, ...arr])
  // add a line to the sniffer. `plain` is the real command; over SFTP it is shown encrypted.
  const wire = (dir, plain, secret = false) => {
    seedRef.current += 1
    if (proto === 'sftp') setSniff(s => [...s, { dir, text: enc(seedRef.current), enc: true }])
    else setSniff(s => [...s, { dir, text: plain, secret }])
  }

  const switchProto = (p) => {
    if (p === proto) return
    setProto(p); setConn(false); setAuthed(false); setPend(null); setSniff([])
    setLines(l => [...l, { t: `— ${p === 'ftp' ? 'FTP (port 21, cleartext)' : 'SFTP (port 22, encrypted)'} —`, c: '#fbbf24' }])
  }

  const run = (raw) => {
    const cmd = raw.trim()
    if (!cmd) return
    print(`${prompt} ${cmd}`, '#fbbf24')
    const p = cmd.split(/\s+/)
    const c0 = p[0].toLowerCase()

    if (c0 === 'help') {
      printMany([
        { t: ar ? 'الأوامر:' : 'Commands:', c: '#93c5fd' },
        { t: `  open ${HOST}        ${ar ? '# اتصل بالخادم' : '# connect to the server'}`, c: '#cbd5e1' },
        { t: `  USER ${CREDS.user}         ${ar ? '# اسم المستخدم' : '# username'}`, c: '#cbd5e1' },
        { t: '  PASS <password>     ' + (ar ? '# كلمة المرور' : '# password'), c: '#cbd5e1' },
        { t: '  ls                  ' + (ar ? '# اعرض الملفات' : '# list files'), c: '#cbd5e1' },
        { t: '  get <file>          ' + (ar ? '# نزّل ملفاً' : '# download a file'), c: '#cbd5e1' },
        { t: '  put <file>          ' + (ar ? '# ارفع ملفاً' : '# upload a file'), c: '#cbd5e1' },
        { t: '  bye                 ' + (ar ? '# اقطع الاتصال' : '# disconnect'), c: '#cbd5e1' },
      ])
      return
    }
    if (c0 === 'clear') { setLines([]); return }

    if (c0 === 'open' || c0 === 'connect') {
      if (conn) { print(ar ? 'متصل بالفعل.' : 'Already connected.', '#fca5a5'); return }
      setConn(true)
      const host = p[1] || HOST
      wire('C', `TCP connect ${host}:${port}`)
      if (proto === 'sftp') {
        wire('S', 'SSH-2.0 handshake')
        print(ar ? `تم الاتصال بـ ${host}. قناة SSH مشفّرة وآمنة. 🔒` : `Connected to ${host}. Secure SSH channel established. 🔒`, '#86efac')
        print(ar ? '✓ جاهز للمصادقة عبر SSH' : '✓ Ready to authenticate over SSH', '#7dd3fc')
      } else {
        print(ar ? `تم الاتصال بـ ${host}.` : `Connected to ${host}.`, '#86efac')
        print('220 Welcome to Dukkan FTP server', '#7dd3fc')
      }
      return
    }

    if (!conn) { print(ar ? 'غير متصل. اكتب: open ' + HOST : 'Not connected. Type: open ' + HOST, '#fca5a5'); return }

    if (c0 === 'user') {
      setPend(p[1] || '')
      wire('C', `USER ${p[1] || ''}`)
      print('331 Please specify the password.', '#7dd3fc')
      return
    }
    if (c0 === 'pass') {
      const pw = cmd.slice(cmd.indexOf(' ') + 1)
      wire('C', `PASS ${pw}`, true)     // ← the sensitive one
      if (pendUser === CREDS.user && pw === CREDS.pass) {
        setAuthed(true)
        print('230 Login successful. 🎉', '#86efac')
      } else {
        print('530 Login incorrect.', '#fca5a5')
      }
      setPend(null)
      return
    }

    if (!authed) { print('530 Please login first (USER / PASS).', '#fca5a5'); return }

    if (c0 === 'ls' || c0 === 'dir' || c0 === 'list') {
      wire('C', 'LIST'); wire('S', '150 Here comes the directory listing')
      printMany(FILES.map(f => ({ t: '  ' + f, c: f.endsWith('/') ? '#7dd3fc' : '#e2e8f0' })))
      print('226 Directory send OK', '#7dd3fc'); setListed(true)
      return
    }
    if (c0 === 'get' || c0 === 'retr') {
      const f = p[1]
      if (!f) { print(ar ? 'حدّد اسم ملف: get backup.zip' : 'Specify a file: get backup.zip', '#fca5a5'); return }
      if (!FILES.includes(f)) { print(`550 ${f}: No such file.`, '#fca5a5'); return }
      wire('C', `RETR ${f}`); wire('S', '150 Opening data connection')
      print(ar ? `226 اكتمل النقل — نُزّل ${f} ✅` : `226 Transfer complete — downloaded ${f} ✅`, '#86efac'); setDl(true)
      return
    }
    if (c0 === 'put' || c0 === 'stor') {
      const f = p[1] || 'file.txt'
      wire('C', `STOR ${f}`); print(ar ? `226 اكتمل الرفع — رُفع ${f}` : `226 Upload complete — uploaded ${f}`, '#86efac')
      return
    }
    if (c0 === 'pwd') { print('257 "/"', '#7dd3fc'); return }
    if (c0 === 'cd') { print('250 Directory changed', '#7dd3fc'); return }
    if (c0 === 'bye' || c0 === 'quit' || c0 === 'close') {
      setConn(false); setAuthed(false); setPend(null); print('221 Goodbye.', '#7dd3fc'); return
    }
    print((ar ? 'أمر غير معروف: ' : 'unknown command: ') + c0 + ' — help', '#fca5a5')
  }

  const onKey = e => { if (e.key === 'Enter') { run(input); setInput('') } }

  const passExposed = proto === 'ftp' && sniff.some(s => s.secret)
  const steps = [
    { ok: authed, ar: 'اتصل وسجّل الدخول (USER / PASS)', en: 'Connect and log in (USER / PASS)', ic: '🔌' },
    { ok: listed, ar: 'اعرض ملفات الخادم (ls)', en: 'List the server files (ls)', ic: '📂' },
    { ok: downloaded, ar: 'نزّل ملفاً (get)', en: 'Download a file (get)', ic: '⬇️' },
    { ok: proto === 'sftp' && authed, ar: 'بدّل إلى SFTP وسجّل الدخول — كلمة المرور محميّة', en: 'Switch to SFTP and log in — the password is protected', ic: '🔒' },
  ]

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '20px 14px', fontFamily: 'sans-serif' }} dir={ar ? 'rtl' : 'ltr'}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ background: '#ecfeff', color: '#0e7490', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>📁 {ar ? 'بروتوكولات الشبكة' : 'Network Protocols'}</span>
        <button onClick={() => navigate('/')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '3px 10px', fontSize: 12, color: '#64748b', cursor: 'pointer' }}>{ar ? '← الرئيسية' : '← Home'}</button>
      </div>
      <h1 style={{ fontSize: 23, fontWeight: 900, color: '#1e293b', margin: '0 0 14px' }}>📁 {ar ? 'بروتوكول نقل الملفات — FTP' : 'File Transfer Protocol — FTP'}</h1>

      {/* objectives */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, minWidth: 190, display: 'flex', alignItems: 'center', gap: 8, background: s.ok ? '#f0fdf4' : 'white', border: `2px solid ${s.ok ? '#86efac' : '#e2e8f0'}`, borderRadius: 10, padding: '8px 10px' }}>
            <span style={{ width: 20, height: 20, borderRadius: 6, background: s.ok ? '#22c55e' : '#f1f5f9', color: s.ok ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>{s.ok ? '✓' : s.ic}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: s.ok ? '#15803d' : '#475569' }}>{ar ? s.ar : s.en}</span>
          </div>
        ))}
      </div>

      {/* protocol toggle */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{ar ? 'البروتوكول:' : 'Protocol:'}</span>
        <button onClick={() => switchProto('ftp')} style={{ fontSize: 12.5, fontWeight: 700, padding: '5px 13px', borderRadius: 8, border: '1px solid', cursor: 'pointer', background: proto === 'ftp' ? '#dc2626' : 'white', color: proto === 'ftp' ? 'white' : '#64748b', borderColor: proto === 'ftp' ? '#dc2626' : '#e2e8f0' }}>🔓 FTP · {ar ? 'منفذ 21 · نص صريح' : 'port 21 · cleartext'}</button>
        <button onClick={() => switchProto('sftp')} style={{ fontSize: 12.5, fontWeight: 700, padding: '5px 13px', borderRadius: 8, border: '1px solid', cursor: 'pointer', background: proto === 'sftp' ? '#16a34a' : 'white', color: proto === 'sftp' ? 'white' : '#64748b', borderColor: proto === 'sftp' ? '#16a34a' : '#e2e8f0' }}>🔒 SFTP · {ar ? 'منفذ 22 · مشفّر' : 'port 22 · encrypted'}</button>
      </div>

      {/* terminal + sniffer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 12 }}>
        {/* terminal */}
        <div style={{ border: '2px solid #0e1f39', borderRadius: 12, overflow: 'hidden', background: '#0b1020', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#0e1f39', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8 }} dir="ltr">
            <span style={{ display: 'flex', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444' }} /><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }} /><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e' }} /></span>
            <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 12 }}>{proto}-client — {HOST}</span>
          </div>
          <div ref={termRef} onClick={() => document.getElementById('ftp-inp')?.focus()} style={{ flex: 1, padding: '10px 12px', fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.6, overflowY: 'auto', minHeight: 300, maxHeight: 340, cursor: 'text' }} dir="ltr">
            {lines.length === 0 && <div style={{ color: '#475569' }}>{ar ? '# ابدأ بـ:  open ' + HOST + '  ثم  USER admin  ثم  PASS Dukkan#2026' : '# start with:  open ' + HOST + '  then  USER admin  then  PASS Dukkan#2026'}</div>}
            {lines.map((l, i) => <div key={i} style={{ color: l.c, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{l.t}</div>)}
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ color: '#fbbf24' }}>{prompt}</span>
              <input id="ftp-inp" value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} autoFocus spellCheck={false} autoComplete="off"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontFamily: 'monospace', fontSize: 12.5 }} />
            </div>
          </div>
        </div>

        {/* sniffer */}
        <div style={{ border: `2px solid ${passExposed ? '#dc2626' : '#e2e8f0'}`, borderRadius: 12, overflow: 'hidden', background: 'white', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: passExposed ? '#7f1d1d' : '#334155', color: 'white', padding: '7px 12px', fontSize: 12, fontWeight: 800 }}>📡 {ar ? 'مُتنصّت الشبكة (Wireshark)' : 'Network Sniffer (Wireshark)'}</div>
          <div ref={sniffRef} style={{ flex: 1, padding: '10px 12px', fontFamily: 'monospace', fontSize: 11.5, lineHeight: 1.7, overflowY: 'auto', minHeight: 300, maxHeight: 340, background: '#f8fafc' }} dir="ltr">
            {sniff.length === 0 ? <div style={{ color: '#94a3b8' }}>{ar ? '(لا حركة مرور بعد — شغّل أمراً)' : '(no traffic yet — run a command)'}</div>
              : sniff.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, background: s.secret ? '#fee2e2' : 'transparent', borderRadius: 4, padding: s.secret ? '1px 4px' : 0 }}>
                  <span style={{ color: '#94a3b8', flexShrink: 0 }}>{s.dir === 'C' ? '→' : '←'}</span>
                  <span style={{ color: s.secret ? '#b91c1c' : s.enc ? '#16a34a' : '#334155', fontWeight: s.secret ? 800 : 400, wordBreak: 'break-all' }}>{s.text}</span>
                  {s.secret && <span style={{ color: '#dc2626', flexShrink: 0 }}>⚠</span>}
                </div>
              ))}
          </div>
          {passExposed && (
            <div style={{ background: '#fef2f2', borderTop: '1px solid #fecaca', padding: '8px 12px', fontSize: 11.5, color: '#b91c1c', lineHeight: 1.6 }} dir={ar ? 'rtl' : 'ltr'}>
              ⚠️ {ar ? 'كلمة مرورك ظهرت بنصٍّ صريح على الشبكة! أي شخص متنصّت يراها. بدّل إلى SFTP وأعد تسجيل الدخول.' : 'Your password appeared in cleartext on the network! Anyone sniffing sees it. Switch to SFTP and log in again.'}
            </div>
          )}
          {proto === 'sftp' && sniff.length > 0 && (
            <div style={{ background: '#f0fdf4', borderTop: '1px solid #bbf7d0', padding: '8px 12px', fontSize: 11.5, color: '#15803d', lineHeight: 1.6 }} dir={ar ? 'rtl' : 'ltr'}>
              ✓ {ar ? 'كل شيء مشفّر — المتنصّت يرى أحرفاً عشوائية فقط، وكلمة مرورك آمنة.' : 'Everything is encrypted — the sniffer sees only random bytes, and your password is safe.'}
            </div>
          )}
        </div>
      </div>

      {/* explanation — collapsed by default, sits under the practical part */}
      <Explanation>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px', maxWidth: 880, lineHeight: 1.7 }}>
          {ar
            ? 'FTP بروتوكول قديم لرفع وتنزيل الملفات من خادم (مثلاً لرفع موقعك). تتصل، تسجّل الدخول باسم مستخدم وكلمة مرور، ثم تنقل الملفات بأوامر مثل ls و get و put. المشكلة الكبرى: FTP يرسل كل شيء — حتى كلمة مرورك — كنصٍّ صريح! شغّل الأوامر وراقب المُتنصّت.'
            : "FTP is an old protocol for uploading and downloading files from a server (e.g. to publish your website). You connect, log in with a username and password, then move files with commands like ls, get, and put. The big problem: FTP sends everything — even your password — in cleartext! Run the commands and watch the sniffer."}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '13px 15px' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#0e1f49', marginBottom: 6 }}>⚙️ {ar ? 'كيف يعمل FTP' : 'How FTP works'}</div>
            <ul style={{ margin: 0, paddingInlineStart: 20, color: '#475569', fontSize: 12, lineHeight: 1.8 }}>
              <li>{ar ? 'قناة تحكّم على المنفذ 21 للأوامر (USER, PASS, LIST, RETR, STOR).' : 'A control channel on port 21 for commands (USER, PASS, LIST, RETR, STOR).' }</li>
              <li>{ar ? 'قناة بيانات منفصلة لنقل محتوى الملفات نفسها.' : 'A separate data channel to transfer the actual file contents.'}</li>
              <li>{ar ? 'get = تنزيل (RETR)، put = رفع (STOR)، ls = عرض القائمة (LIST).' : 'get = download (RETR), put = upload (STOR), ls = list (LIST).'}</li>
            </ul>
          </div>
          <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: 12, padding: '13px 15px' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#b91c1c', marginBottom: 6 }}>🛑 {ar ? 'لماذا FTP غير آمن — والحل' : 'Why FTP is unsafe — and the fix'}</div>
            <ul style={{ margin: 0, paddingInlineStart: 20, color: '#991b1b', fontSize: 12, lineHeight: 1.8 }}>
              <li>{ar ? 'FTP يرسل الاسم وكلمة المرور والملفات بنصٍّ صريح — يلتقطها أي متنصّت على الشبكة.' : 'FTP sends the username, password, and files in cleartext — any sniffer on the network grabs them.'}</li>
              <li>{ar ? 'الحل: استخدم SFTP (عبر SSH، منفذ 22) أو FTPS — يشفّر كل شيء.' : 'Fix: use SFTP (over SSH, port 22) or FTPS — it encrypts everything.'}</li>
              <li>{ar ? 'لا تستخدم FTP العادي على شبكات عامة أبداً.' : 'Never use plain FTP on public networks.'}</li>
            </ul>
          </div>
        </div>
      </Explanation>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1d4ed8', background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 10, padding: '10px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          <ChevronLeft size={15} />{ar ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
