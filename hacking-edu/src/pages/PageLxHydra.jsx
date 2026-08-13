import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'
import LinuxTerminal from '../components/LinuxTerminal'
import { runHydra, QA } from '../lib/linuxLab'

const CMD = `hydra -l admin -P /usr/share/wordlists/rockyou.txt ${QA.host} http-post-form "/admin:username=^USER^&password=^PASS^:F=Incorrect username or password" -V -f`

export default function PageLxHydra() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'
  const [atk, setAtk] = useState(null)          // { user, pass, n, total } — live attack state
  const [cracked, setCracked] = useState(null)  // { user, pass }

  const hydra = ctx => runHydra(ctx, {
    user: QA.user, pass: QA.pass,
    onProgress: setAtk,
    onCrack: p => setCracked({ user: QA.user, pass: p }),
  })

  const pct = atk && atk.total ? Math.round((atk.n / atk.total) * 100) : 0

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 14px', fontFamily: 'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{`@keyframes lxh-blink{0%,100%{opacity:1}50%{opacity:0}} @keyframes lxh-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🐧 {isAr ? 'مسار لينكس' : 'Linux Track'}</span>
        <button onClick={() => navigate('/linux')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '3px 10px', fontSize: 12, color: '#64748b', cursor: 'pointer' }}>{isAr ? '← مسار لينكس' : '← Linux Track'}</button>
      </div>
      <h1 style={{ fontSize: 23, fontWeight: 900, color: '#1e293b', margin: '0 0 12px' }}>🐉 {isAr ? 'Hydra — كسر تسجيل الدخول' : 'Hydra — Login Brute-Force'}</h1>

      {/* command */}
      <div style={{ background: '#0b1020', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }} dir="ltr">
        <span style={{ color: '#4ade80', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, paddingTop: 1 }}>$</span>
        <code style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, color: '#a5f3fc', minWidth: 200, lineHeight: 1.5, wordBreak: 'break-all' }}>{CMD}</code>
        <button onClick={() => navigator.clipboard && navigator.clipboard.writeText(CMD)} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: 11, padding: '3px 10px' }}>{isAr ? '⧉ نسخ' : '⧉ copy'}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,420px)', gap: 16, alignItems: 'start' }}>
        {/* terminal */}
        <LinuxTerminal isAr={isAr} height={470} extraCommands={{ hydra }}
          welcome={[{ k: 'info', v: isAr ? '# الصق أمر hydra وشغّله. راقب صفحة الدخول على اليمين وهي تُكسَر.' : '# Paste the hydra command and run it. Watch the login page on the right get cracked.' }]} />

        {/* live login browser */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 8 }}>{isAr ? 'صفحة الدخول (تُكسَر أمامك)' : 'THE LOGIN PAGE (CRACKED LIVE)'}</div>
          <div style={{ border: '2px solid #cbd5e1', borderRadius: 12, overflow: 'hidden', background: 'white', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
            {/* chrome */}
            <div style={{ background: '#e2e8f0', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8 }} dir="ltr">
              <span style={{ display: 'flex', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444' }} /><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b' }} /><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e' }} /></span>
              <div style={{ flex: 1, background: 'white', borderRadius: 20, padding: '4px 12px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: 11.5, color: '#334155' }}>🔒 http://{QA.host}/admin</div>
            </div>
            {/* gradient header */}
            <div style={{ background: 'linear-gradient(135deg,#dc2626,#7c3aed)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>🔐</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontWeight: 900, fontSize: 15 }}>{isAr ? 'دخول المدير' : 'Admin Login'}</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>{QA.host}</div>
              </div>
              {cracked && <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 20, padding: '3px 10px', color: 'white', fontSize: 11, fontWeight: 800 }}>✓ {isAr ? 'مُخترَق' : 'Cracked!'}</div>}
            </div>
            {/* body */}
            <div dir={isAr ? 'rtl' : 'ltr'} style={{ padding: '18px', minHeight: 230 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{isAr ? 'اسم المستخدم' : 'Username'}</label>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', marginTop: 4, marginBottom: 12, fontFamily: 'monospace', fontSize: 13, color: '#334155' }} dir="ltr">{atk || cracked ? 'admin' : '—'}</div>

              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{isAr ? 'كلمة المرور' : 'Password'}</label>
              <div style={{ background: '#f8fafc', border: `2px solid ${cracked ? '#22c55e' : atk ? '#f59e0b' : '#e2e8f0'}`, borderRadius: 8, padding: '9px 12px', marginTop: 4, marginBottom: 12, fontFamily: 'monospace', fontSize: 13, color: cracked ? '#15803d' : '#334155', display: 'flex', alignItems: 'center', gap: 6, transition: 'border-color .2s' }} dir="ltr">
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: cracked ? 800 : 400 }}>{cracked ? cracked.pass : atk ? atk.pass : '••••••••'}</span>
                {atk && !cracked && <span style={{ width: 2, height: 16, background: '#f59e0b', animation: 'lxh-blink .8s infinite' }} />}
              </div>

              {atk && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }} dir="ltr">
                    <span>{isAr ? `محاولة ${atk.n} من ${atk.total}` : `Attempt ${atk.n} of ${atk.total}`}</span>
                    <span>{pct}%</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: cracked ? '#22c55e' : '#f59e0b', transition: 'width .1s' }} />
                  </div>
                </div>
              )}

              {cracked ? (
                <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 10, padding: 12, textAlign: 'center', animation: 'lxh-in .3s ease' }}>
                  <div style={{ fontSize: 28 }}>✅</div>
                  <div style={{ fontWeight: 900, color: '#15803d', fontSize: 14 }}>{isAr ? 'تم اختراق الحساب!' : 'Account Cracked!'}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#166534', marginTop: 4 }} dir="ltr">{cracked.user} : {cracked.pass}</div>
                </div>
              ) : atk ? (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 9, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#92610a' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: 'lxh-blink .8s infinite' }} />
                  {isAr ? 'جاري تجربة كلمات المرور...' : 'Trying passwords...'}
                </div>
              ) : (
                <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 9, padding: '10px 12px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                  {isAr ? '▶ شغّل أمر hydra في الطرفية لكسر هذا الدخول' : '▶ Run the hydra command in the terminal to crack this login'}
                </div>
              )}
            </div>
          </div>
          {cracked && (
            <button onClick={() => navigate('/lx-challenge')} style={{ marginTop: 10, width: '100%', background: '#0e1f39', color: 'white', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>{isAr ? 'التالي: التحدي النهائي →' : 'Next: Final Challenge →'}</button>
          )}
          <div style={{ marginTop: 10, fontSize: 11.5, color: '#64748b', lineHeight: 1.6 }}>💡 {isAr ? 'كلمة المرور Sunshine@23 مدفونة عميقاً في rockyou.txt — لهذا تأخذ ١٥٠٨ محاولة. الأمر ينجح مع admin فقط.' : 'The password Sunshine@23 is buried deep in rockyou.txt — that is why it takes 1508 tries. It only works for admin.'}</div>
        </div>
      </div>

      <Explanation>
        <p style={{ fontSize: 13, color: '#475569', margin: '0 0 12px', maxWidth: 880, lineHeight: 1.7 }}>
          {isAr
            ? `الهدف ${QA.host}. شغّل hydra في الطرفية وشاهد صفحة الدخول على اليمين وهي تُجرَّب كلمة مرور تلو الأخرى حتى تُكسَر عند المحاولة ١٥٠٨. تنجح hydra مع المستخدم admin فقط.`
            : `Target: ${QA.host}. Run hydra in the terminal and watch the login page on the right get tried password after password until it cracks on attempt #1508. hydra only succeeds for the admin user.`}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['-l admin', isAr ? 'اسم المستخدم' : 'the username'], ['-P rockyou.txt', isAr ? 'قائمة ٢٠٠٠ كلمة مرور' : '2000-password list'], ['^USER^ / ^PASS^', isAr ? 'مكان الحقلين' : 'where the fields go'], ['F=Incorrect…', isAr ? 'نص فشل الدخول' : 'the login-failure text'], ['-V -f', isAr ? 'أظهر المحاولات وتوقّف عند النجاح' : 'verbose, stop on success']].map(([c, d]) => (
            <div key={c} style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: 9, padding: '6px 10px' }}>
              <code style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 800, color: '#b91c1c' }}>{c}</code>
              <div style={{ fontSize: 10, color: '#64748b' }}>{d}</div>
            </div>
          ))}
        </div>
      </Explanation>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <button onClick={() => navigate('/linux')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1d4ed8', background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 10, padding: '10px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          <ChevronLeft size={15} />{isAr ? 'مسار لينكس' : 'Linux Track'}
        </button>
      </div>
    </div>
  )
}
