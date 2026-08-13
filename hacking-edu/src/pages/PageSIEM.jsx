import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ShieldAlert, ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   SIEM — SOC INCIDENT RESPONSE (discover the threat)
   The alert feed is NEUTRAL: every activity looks the same — no colors, no
   severity labels, no hints. The analyst must INVESTIGATE each activity, read
   the details, and DISCOVER which one is malicious, then CHECK the IP in a
   threat database (VirusTotal) and, if malicious, BLOCK it in the firewall — a
   live topology cuts that host off. Benign items should be dismissed; one is a
   false positive that looks odd but is clean. Safe simulation.
   ──────────────────────────────────────────────────────────────────────────── */

const EXTERNALS = ['185.220.101.47', '91.189.88.152']   // remote IPs shown in the topology

// every row is presented neutrally; the revealing detail is only seen on investigation
const ACTIVITIES = [
  { id: 1, time: '09:02', ip: null, kind: 'benign', correct: 'dismiss',
    srcAr: 'المستخدم sara.ali', srcEn: 'User sara.ali', sumAr: 'حدث تسجيل دخول', sumEn: 'Login event',
    detAr: 'دخول من الدوحة (10.0.0.4) مع مصادقة ثنائية — جهاز معروف وفي وقت العمل المعتاد.',
    detEn: 'Login from Doha (10.0.0.4) with 2FA — a known device during normal working hours.' },
  { id: 2, time: '09:05', ip: '20.190.160.14', kind: 'benign', correct: 'dismiss',
    srcAr: 'الجهاز PC-A', srcEn: 'PC-A', sumAr: 'تحديث برمجي', sumEn: 'Software update',
    detAr: 'نزّل PC-A تحديث Windows بحجم 250 ميجابايت من 20.190.160.14.',
    detEn: 'PC-A downloaded a 250 MB Windows update from 20.190.160.14.',
    vtScore: 0, vtTotal: 94, vtGoodAr: 'Microsoft — خادم معروف وآمن', vtGoodEn: 'Microsoft — known & safe' },
  { id: 3, time: '09:06', ip: null, kind: 'benign', correct: 'dismiss',
    srcAr: 'المستخدم omar', srcEn: 'User omar', sumAr: 'حدث تسجيل دخول', sumEn: 'Login event',
    detAr: 'محاولة دخول فاشلة واحدة ثم نجاح من نفس الجهاز — على الأرجح خطأ في الكتابة.',
    detEn: 'One failed login then a success from the same device — most likely a typo.' },
  { id: 4, time: '09:07', ip: '185.220.101.47', kind: 'attack', correct: 'block',
    srcAr: 'عنوان خارجي 185.220.101.47', srcEn: 'External 185.220.101.47', sumAr: 'نشاط اتصال SSH', sumEn: 'SSH connection activity',
    detAr: '٣١٢ محاولة دخول SSH فاشلة خلال دقيقتين على الخادم 10.0.0.5 — منفذ 22، من عنوان خارجي غير معروف.',
    detEn: '312 failed SSH logins in 2 minutes against Server 10.0.0.5 — port 22, from an unknown external IP.',
    vtScore: 58, vtTotal: 94, vtTagsAr: ['قوة غاشمة', 'بوت نت', 'عقدة Tor'], vtTagsEn: ['brute-force', 'botnet', 'tor-exit'] },
  { id: 5, time: '09:09', ip: '91.189.88.152', kind: 'fp', correct: 'dismiss',
    srcAr: 'الجهاز PC-B', srcEn: 'PC-B', sumAr: 'نقل بيانات', sumEn: 'Data transfer',
    detAr: 'نزّل PC-B (10.0.0.7) ‏2.1 جيجابايت من 91.189.88.152.',
    detEn: 'PC-B (10.0.0.7) downloaded 2.1 GB from 91.189.88.152.',
    vtScore: 0, vtTotal: 94, vtGoodAr: 'خادم تحديثات Ubuntu (Canonical) — تنزيل تحديث كبير أمر طبيعي', vtGoodEn: 'Ubuntu update server (Canonical) — a large update download is normal' },
  { id: 6, time: '09:11', ip: null, kind: 'benign', correct: 'dismiss',
    srcAr: 'المستخدم reem', srcEn: 'User reem', sumAr: 'وصول إلى ملفات', sumEn: 'File access',
    detAr: 'فتحت reem المجلد المشترك \\\\files — صلاحية معتادة لقسمها.',
    detEn: 'reem opened the shared \\\\files folder — a normal permission for her department.' },
]

/* ── live topology (neutral until you block) ───────────────────────────────── */
function Topology({ rules, ar }) {
  const node = (extra) => ({ position: 'absolute', transform: 'translate(-50%,-50%)', textAlign: 'center', ...extra })
  const chip = { fontSize: 9, fontFamily: 'monospace', color: '#64748b' }
  const anyBlock = rules.length > 0
  return (
    <div style={{ position: 'relative', height: 240, minWidth: 660, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }} dir="ltr">
      <div style={{ position: 'absolute', top: '30%', left: '15%', width: '52%', height: 2, background: '#cbd5e1' }} />
      {EXTERNALS.map((ip, i) => <div key={'l' + i} style={{ position: 'absolute', top: `${58 + i * 20}%`, left: '15%', width: '71%', height: 2, background: rules.includes(ip) ? '#fecaca' : '#cbd5e1' }} />)}

      {/* internal network */}
      <div style={node({ left: '10%', top: '46%' })}>
        <div style={{ border: '1px dashed #94a3b8', borderRadius: 10, padding: '8px 6px', background: 'white' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#0e7490', marginBottom: 3 }}>🏢 {ar ? 'الشبكة الداخلية' : 'Internal LAN'}</div>
          <div style={{ fontSize: 20 }}>🖥️ 💻 💻</div>
          <div style={chip}>{ar ? 'الخادم' : 'Server'} 10.0.0.5</div>
        </div>
      </div>

      {/* firewall */}
      <div style={node({ left: '44%', top: '50%' })}>
        <div style={{ width: 30, height: 170, borderRadius: 8, background: anyBlock ? '#dc2626' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: anyBlock ? '0 0 0 4px rgba(220,38,38,0.2)' : 'none', transition: 'all .3s' }}>🧱</div>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: anyBlock ? '#dc2626' : '#64748b', marginTop: 3 }}>{ar ? 'جدار ناري' : 'Firewall'}</div>
        {anyBlock && <div style={{ fontSize: 9, color: '#dc2626', fontWeight: 700 }}>⛔ {ar ? 'إسقاط' : 'DROP'}</div>}
      </div>

      {/* internet + external sources */}
      <div style={node({ left: '70%', top: '30%' })}><div style={{ fontSize: 22 }}>☁️</div><div style={chip}>{ar ? 'الإنترنت' : 'Internet'}</div></div>
      {EXTERNALS.map((ip, i) => {
        const b = rules.includes(ip)
        return (
          <div key={'e' + i} style={node({ left: '90%', top: `${58 + i * 20}%` })}>
            <div style={{ fontSize: 16 }}>{b ? '🚫' : '🖧'}</div>
            <div style={{ fontSize: 8.5, fontFamily: 'monospace', color: b ? '#dc2626' : '#64748b', fontWeight: b ? 800 : 400 }}>{ip}</div>
          </div>
        )
      })}

      {/* neutral internal ↔ internet packets */}
      {[0, 1, 2].map(i => <span key={'n' + i} className="siem-pkt" style={{ top: '30%', background: '#22c55e', animation: `siemInternal 3.2s linear ${i * 1.05}s infinite` }} />)}
      {/* external inbound packets — neutral, or dropped at the firewall when blocked */}
      {EXTERNALS.map((ip, i) => {
        const b = rules.includes(ip)
        return [0, 1, 2].map(k => (
          <span key={'x' + i + k} className="siem-pkt" style={{ top: `${58 + i * 20}%`, background: b ? '#ef4444' : '#38bdf8', animation: `${b ? 'siemDrop 1.7s' : 'siemFlow 2.6s'} linear ${k * (b ? 0.5 : 0.75)}s infinite` }} />
        ))
      })}

      <style>{`
        .siem-pkt { position:absolute; width:9px; height:9px; border-radius:50%; transform:translate(-50%,-50%); }
        @keyframes siemInternal { 0%{left:16%;opacity:0} 8%{opacity:1} 92%{opacity:1} 100%{left:69%;opacity:0} }
        @keyframes siemFlow { 0%{left:88%;opacity:1} 100%{left:15%;opacity:1} }
        @keyframes siemDrop { 0%{left:88%;opacity:1} 55%{left:45%;opacity:1} 65%{left:45%;opacity:1} 100%{left:45%;opacity:0} }
      `}</style>
    </div>
  )
}

export default function PageSIEM() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const ar = lang === 'ar'

  const [selected, setSelected] = useState(null)   // activity id under investigation
  const [checked, setChecked]   = useState({})     // id -> true (VirusTotal run)
  const [checking, setChecking] = useState(false)
  const [resolved, setResolved] = useState({})     // id -> { action, correct }
  const [rules, setRules]       = useState([])     // blocked IPs
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const a = ACTIVITIES.find(x => x.id === selected)
  const resolvedCount = Object.keys(resolved).length
  const correctCount = Object.values(resolved).filter(r => r.correct).length
  const allDone = resolvedCount === ACTIVITIES.length

  const open = (id) => { if (resolved[id]) return; setSelected(id); setChecking(false) }
  const back = () => setSelected(null)
  const runCheck = () => { setChecking(true); timer.current = setTimeout(() => { setChecking(false); setChecked(c => ({ ...c, [a.id]: true })) }, 1100) }
  const resolve = (action) => {
    setResolved(r => ({ ...r, [a.id]: { action, correct: a.correct === action } }))
    if (action === 'block' && a.ip) setRules(r => r.includes(a.ip) ? r : [...r, a.ip])
    setSelected(null)
  }
  const restart = () => { setSelected(null); setChecked({}); setResolved({}); setRules([]); setChecking(false) }

  const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }
  const btn = (bg, fg = 'white', bd) => ({ background: bg, color: fg, border: bd || 'none', borderRadius: 9, padding: '9px 16px', fontWeight: 800, cursor: 'pointer', fontSize: 13 })
  const vt = a && a.kind === 'attack'   // malicious verdict when checked

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 14px', fontFamily: 'sans-serif' }} dir={ar ? 'rtl' : 'ltr'}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🛡️ {ar ? 'مركز عمليات الأمن (SOC)' : 'Security Operations (SOC)'}</span>
        <button onClick={() => navigate('/')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '3px 10px', fontSize: 12, color: '#64748b', cursor: 'pointer' }}>{ar ? '← الرئيسية' : '← Home'}</button>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', margin: '0 0 5px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <ShieldAlert style={{ width: 24, height: 24, color: '#ef4444' }} /> {ar ? 'محاكاة SIEM — اكتشف التهديد' : 'SIEM — Discover the Threat'}
      </h1>

      {/* how to work an alert (static guidance, not a spoiler) */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, fontSize: 11, color: '#475569' }}>
        {[[ar ? 'راجع الأنشطة' : 'Review activity', '🔍'], [ar ? 'حقّق في التفاصيل' : 'Investigate details', '🕵️'], [ar ? 'افحص السمعة' : 'Check reputation', '🌐'], [ar ? 'قرّر: تجاهل أو احظر' : 'Decide: dismiss or block', '⚖️']].map(([t, ic], i) => (
          <span key={i} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 20, padding: '3px 10px', fontWeight: 700 }}>{i + 1}. {ic} {t}</span>
        ))}
      </div>

      {/* live topology */}
      <div style={{ overflowX: 'auto', marginBottom: 12 }}><Topology rules={rules} ar={ar} /></div>

      {/* progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(resolvedCount / ACTIVITIES.length) * 100}%`, background: '#8dc63f', transition: 'width .3s' }} /></div>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>{ar ? `عولج ${resolvedCount} / ${ACTIVITIES.length}` : `Handled ${resolvedCount} / ${ACTIVITIES.length}`}</span>
      </div>

      {/* main: feed OR investigation */}
      <div style={card}>
        {!a ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#0e1f39', marginBottom: 8 }}>📡 {ar ? 'سجل الأحداث — اضغط أي نشاط للتحقيق فيه' : 'Event feed — click any activity to investigate it'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ACTIVITIES.map(x => {
                const r = resolved[x.id]
                return (
                  <button key={x.id} onClick={() => open(x.id)} disabled={!!r}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 8, border: '1px solid #eef2f7', background: r ? '#f8fafc' : 'white', cursor: r ? 'default' : 'pointer', textAlign: ar ? 'right' : 'left', opacity: r ? 0.85 : 1 }}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8', flexShrink: 0 }}>{x.time}</span>
                    <span style={{ fontSize: 12.5, color: '#334155', fontWeight: 700, minWidth: 0, flexShrink: 0 }}>{ar ? x.srcAr : x.srcEn}</span>
                    <span style={{ fontSize: 12, color: '#64748b', flex: 1 }}>{ar ? x.sumAr : x.sumEn}</span>
                    {r
                      ? <span style={{ fontSize: 11, fontWeight: 800, color: r.correct ? '#15803d' : '#b91c1c', flexShrink: 0 }}>{r.correct ? '✓' : '✗'} {r.action === 'block' ? (ar ? 'محظور' : 'blocked') : (ar ? 'تجاهل' : 'dismissed')}</span>
                      : <span style={{ fontSize: 14, color: '#cbd5e1', flexShrink: 0 }}>{ar ? '‹' : '›'}</span>}
                  </button>
                )
              })}
            </div>

            {allDone && (
              <div style={{ marginTop: 12, background: correctCount === ACTIVITIES.length ? '#f0fdf4' : '#fffbeb', border: `2px solid ${correctCount === ACTIVITIES.length ? '#86efac' : '#fde68a'}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 26 }}>{correctCount === ACTIVITIES.length ? '🏆' : '📋'}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: correctCount === ACTIVITIES.length ? '#15803d' : '#92610a' }}>{ar ? `قرارات صحيحة: ${correctCount} / ${ACTIVITIES.length}` : `Correct decisions: ${correctCount} / ${ACTIVITIES.length}`}</div>
                <p style={{ fontSize: 12, color: '#475569', margin: '4px auto 8px', maxWidth: 560, lineHeight: 1.7 }}>{correctCount === ACTIVITIES.length ? (ar ? 'ممتاز! اكتشفت المهاجم المخبّأ وسط النشاط العادي، حظرته، وتجاهلت الإنذار الكاذب بشكل صحيح.' : 'Excellent! You found the attacker hidden among normal activity, blocked it, and correctly dismissed the false positive.') : (ar ? 'راجع أخطاءك: تحقّق من السمعة قبل الحظر، ولا تحظر إلا ما ثبت أنه خبيث.' : 'Review your mistakes: check reputation before blocking, and only block what is confirmed malicious.')}</p>
                <button onClick={restart} style={btn('#0e1f39')}>↺ {ar ? 'أعد المحاولة' : 'Try again'}</button>
              </div>
            )}
          </>
        ) : (
          <div>
            <button onClick={back} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12, marginBottom: 8 }}>← {ar ? 'رجوع إلى السجل' : 'Back to feed'}</button>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#0e1f39', marginBottom: 8 }}>🔍 {ar ? `التحقيق — ${a.time} · ${a.srcAr}` : `Investigation — ${a.time} · ${a.srcEn}`}</div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', fontSize: 12.5, color: '#334155', lineHeight: 1.7, marginBottom: 12 }} dir={ar ? 'rtl' : 'ltr'}>{ar ? a.detAr : a.detEn}</div>

            {/* threat-intel result once checked */}
            {checked[a.id] && (
              <div style={{ borderRadius: 10, border: `2px solid ${vt ? '#fecaca' : '#bbf7d0'}`, background: vt ? '#fef2f2' : '#f0fdf4', padding: '11px 13px', marginBottom: 12 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#0e1f39', marginBottom: 3 }} dir="ltr">🌐 VirusTotal · {a.ip}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: vt ? '#b91c1c' : '#15803d' }}>
                  {vt ? (ar ? `⚠️ ${a.vtScore} من ${a.vtTotal} محرّك صنّفه كخبيث` : `⚠️ ${a.vtScore} / ${a.vtTotal} engines flagged it malicious`)
                      : (ar ? `✓ ${a.vtScore} من ${a.vtTotal} — نظيف` : `✓ ${a.vtScore} / ${a.vtTotal} — clean`)}
                </div>
                {vt ? <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>{(ar ? a.vtTagsAr : a.vtTagsEn).map(t => <span key={t} style={{ fontSize: 11, background: '#fee2e2', color: '#b91c1c', borderRadius: 20, padding: '2px 9px', fontWeight: 700 }}>{t}</span>)}</div>
                     : <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>✅ {ar ? a.vtGoodAr : a.vtGoodEn}</div>}
              </div>
            )}

            {/* actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {a.ip && !checked[a.id] && (
                <button onClick={runCheck} disabled={checking} style={btn('#2563eb')}>{checking ? (ar ? '⏳ جارٍ الفحص…' : '⏳ Querying…') : (ar ? `🌐 افحص ${a.ip} على VirusTotal` : `🌐 Check ${a.ip} on VirusTotal`)}</button>
              )}
              {checked[a.id] && vt && <button onClick={() => resolve('block')} style={btn('#dc2626')}>🧱 {ar ? 'احظر العنوان في الجدار الناري' : 'Block the IP in the firewall'}</button>}
              {a.ip && checked[a.id] && !vt && <button onClick={() => resolve('block')} style={btn('#fff', '#b91c1c', '2px solid #fecaca')}>🧱 {ar ? 'احظره على أي حال' : 'Block anyway'}</button>}
              <button onClick={() => resolve('dismiss')} style={btn('#16a34a')}>✓ {ar ? 'تجاهله كأمر عادي' : 'Dismiss as normal'}</button>
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>{ar ? '💡 لا تحظر قبل فحص السمعة — قد يكون نشاطاً شرعياً.' : '💡 Don’t block before checking reputation — it may be legitimate activity.'}</p>
          </div>
        )}
      </div>

      {/* firewall rules */}
      {rules.length > 0 && (
        <div style={{ marginTop: 12, border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: '#0e1f39', color: 'white', fontSize: 12.5, fontWeight: 800, padding: '8px 14px' }}>🧱 {ar ? 'قواعد الجدار الناري' : 'Firewall rules'}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'monospace' }} dir="ltr">
            <tbody>{rules.map((ip, i) => (
              <tr key={i} style={{ borderTop: i ? '1px solid #f1f5f9' : 'none' }}>
                <td style={{ padding: '7px 14px', color: '#dc2626', fontWeight: 800 }}>DENY</td>
                <td style={{ padding: '7px 14px', color: '#0e1f39' }}>src {ip} → any</td>
                <td style={{ padding: '7px 14px', color: '#64748b' }}>{ar ? 'إسقاط كل الحِزم' : 'drop all packets'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* explanation — collapsed by default, sits under the practical part */}
      <Explanation>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px', maxWidth: 880, lineHeight: 1.7 }}>
          {ar
            ? 'أنت محلل أمني. لا شيء مُلوَّن ولا مُصنَّف بالخطورة — كل الأنشطة تبدو متشابهة. حقّق في كل نشاط، اقرأ تفاصيله، واكتشف بنفسك أيّها مشبوه. عند الاشتباه، افحص العنوان في قاعدة بيانات المهاجمين (VirusTotal)، وإن كان خبيثاً احظره في الجدار الناري. تجاهل الأنشطة العادية — وانتبه لإنذار كاذب يبدو غريباً لكنه سليم!'
            : "You're a security analyst. Nothing is colored or pre-labeled by severity — every activity looks the same. Investigate each one, read its details, and discover for yourself which is suspicious. When suspicious, check the IP in an attacker database (VirusTotal); if malicious, block it in the firewall. Dismiss the normal activity — and watch out for a false positive that looks odd but is fine!"}
        </p>
        <div style={{ background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#1e40af', marginBottom: 6 }}>🎯 {ar ? 'كيف يكتشف المحلل التهديد' : 'How an analyst finds the threat'}</div>
          <ul style={{ margin: 0, paddingInlineStart: 20, color: '#1e3a8a', fontSize: 12.5, lineHeight: 1.9 }}>
            <li>{ar ? 'الأنشطة الحقيقية لا تأتي موسومة بـ«خطر». عليك التحقيق في كلٍّ منها واكتشاف الشاذّ بنفسك.' : "Real activity doesn't come labeled 'danger'. You must investigate each one and spot the anomaly yourself."}</li>
            <li>{ar ? 'ابحث عن الشذوذ: عدد محاولات ضخم، عنوان خارجي غير معروف، سلوك لا يناسب المستخدم.' : 'Look for anomalies: a huge attempt count, an unknown external IP, behavior that does not fit the user.'}</li>
            <li>{ar ? 'أكّد شكّك: افحص العنوان في قاعدة سمعة (VirusTotal) قبل أي إجراء.' : 'Confirm your suspicion: check the IP in a reputation database (VirusTotal) before acting.'}</li>
            <li>{ar ? 'قرّر: احظر ما ثبت أنه خبيث فقط، وتجاهل الأنشطة العادية والإنذارات الكاذبة.' : 'Decide: block only what is confirmed malicious; dismiss normal activity and false positives.'}</li>
          </ul>
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
