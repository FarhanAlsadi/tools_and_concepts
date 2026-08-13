import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

const REAL_IP = '192.168.1.45'
const PROXY_IP = '185.220.101.45'

const ROTATION_LOG = [
  { ip: '45.32.100.55',  action: 'GET /login',        time: '02:14:05', status: 200 },
  { ip: '185.100.23.4',  action: 'GET /dashboard',    time: '02:16:22', status: 200 },
  { ip: '91.205.200.7',  action: 'GET /export-data',  time: '02:31:44', status: 200 },
  { ip: '178.62.58.45',  action: 'GET /users/list',   time: '02:48:10', status: 200 },
  { ip: '45.32.100.55',  action: 'GET /admin',         time: '02:49:33', status: 403 },
]

const INVESTIGATION_LOGS = [
  { id: 1, ip: '45.32.100.55',  account: 'ahmed99',  action: 'Login',      time: '02:14', suspect: true  },
  { id: 2, ip: '45.32.100.55',  account: 'ahmed99',  action: 'View Data',  time: '02:16', suspect: true  },
  { id: 3, ip: '185.100.23.4',  account: 'ahmed99',  action: 'Login',      time: '02:31', suspect: true  },
  { id: 4, ip: '91.205.200.7',  account: 'sara22',   action: 'Login',      time: '10:05', suspect: false },
  { id: 5, ip: '91.205.200.7',  account: 'ahmed99',  action: 'Export',     time: '02:48', suspect: true  },
  { id: 6, ip: '185.100.23.4',  account: 'sara22',   action: 'View Data',  time: '10:08', suspect: false },
]

const suspectIds = new Set(INVESTIGATION_LOGS.filter(l => l.suspect).map(l => l.id))

export default function PageIPMasking() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [maskMode, setMaskMode] = useState('direct')
  const [rotIdx, setRotIdx] = useState(0)
  const [autoRot, setAutoRot] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [answer, setAnswer] = useState(null)

  useEffect(() => {
    if (!autoRot) return
    const id = setInterval(() => setRotIdx(i => (i + 1) % ROTATION_LOG.length), 1600)
    return () => clearInterval(id)
  }, [autoRot])

  const isDirect = maskMode === 'direct'
  const visibleIp = isDirect ? REAL_IP : PROXY_IP

  const toggleSelect = id => {
    if (submitted) return
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const investigationCorrect = submitted &&
    [...selected].every(id => suspectIds.has(id)) &&
    [...suspectIds].every(id => selected.has(id))

  const T = {
    ar: {
      badge: 'أمن الشبكات',
      title: 'إخفاء IP وتدوير العناوين',
      subtitle: 'تعلّم كيف يعمل إخفاء عنوان IP وتدوير العناوين، ولماذا لا يضمن الإخفاء التام.',
      s1: '1. محاكاة إخفاء IP',
      s2: '2. تدوير عناوين IP',
      s3: '3. الكشف الجنائي',
      s4: '4. تحدٍّ: تحقيق في السجلات',
      directBtn: 'اتصال مباشر', proxyBtn: 'عبر وسيط (Proxy)',
      device: 'جهازك', proxy: 'خادم Proxy', website: 'الموقع',
      realIp: 'IP الحقيقي', visibleIp: 'IP المرئي',
      directNote: '⚠️ الموقع يرى عنوانك الحقيقي مباشرةً — يمكن تتبعك بسهولة.',
      proxyNote: '✅ الموقع يرى عنوان الـ Proxy فقط — لكن Proxy نفسه يعرف هويتك.',
      autoBtn: '▶ تشغيل تلقائي', stopBtn: '⏸ إيقاف', nextBtn: 'الطلب التالي →',
      logLabel: 'سجل الطلبات — كل طلب يظهر من IP مختلف:',
      rotNote: 'رغم تغيير IP في كل طلب، يظل النمط السلوكي ثابتاً ويمكن تتبعه جنائياً.',
      forensicTitle: 'ماذا يرى المحقق؟',
      forensicNote: 'حتى مع تغيير IP، هذه الإشارات تكشف هوية المستخدم الحقيقي:',
      forensicPoints: [
        { icon: '👤', label: 'نفس الحساب',          detail: 'ahmed99@email.com في كل الطلبات' },
        { icon: '🕐', label: 'نفس نافذة التوقيت',   detail: '02:00 – 03:00 صباحاً في كل مرة' },
        { icon: '📊', label: 'نفس تسلسل الأنشطة',  detail: 'Login → View → Export دائماً' },
        { icon: '🖥️', label: 'نفس بصمة المتصفح',   detail: 'Mozilla/5.0 Chrome/120.0' },
        { icon: '🌍', label: 'نفس المنطقة الجغرافية', detail: 'ASN: Riyadh, Saudi Arabia' },
      ],
      invTitle: 'المهمة: حدِّد جميع السجلات التي تخص نفس الشخص (ahmed99) رغم اختلاف عناوين IP',
      invHint: '💡 انظر إلى عمود الحساب والنمط الزمني، وليس IP فقط',
      colTime: 'الوقت', colIp: 'عنوان IP', colAcc: 'الحساب', colAct: 'النشاط',
      submitBtn: 'تحقق من الإجابة', resetBtn: '↺ إعادة',
      invCorrect: '✅ ممتاز! وجدت جميع سجلات ahmed99 — نفس الشخص يستخدم IPs مختلفة.',
      invWrong: '❌ لم تكن الإجابة صحيحة. انتبه إلى عمود "الحساب" — ليس IP فقط.',
      conclusionTitle: '💡 الخلاصة',
      conclusionPoints: [
        'عنوان IP ≠ الهوية — يمكن تغييره لكن لا يمكن تغيير السلوك.',
        'تغيير IP لا يكفي: الحسابات والتوقيت وبصمة المتصفح تكشف الهوية.',
        'التحقيق الجنائي يعتمد على ربط الأنماط، وليس IP فقط.',
        'لا يوجد إخفاء تام على الإنترنت — فقط درجات متفاوتة من الصعوبة.',
      ],
      qTitle: '🧩 ما الذي يستخدمه المحقق للكشف عن هوية المستخدم رغم تغيير IP؟',
      qOpts: ['عنوان IP وحده', 'ربط الأنماط والحسابات والسلوك والتوقيت', 'سرعة الاتصال', 'نوع المتصفح فقط'],
      qAns: 1,
      qCorrect: '✅ صحيح! المحقق يعتمد على ربط الأنماط والحسابات والسلوك.',
      qWrong: '❌ حاول مجدداً',
      prevLesson: 'درس VPN ←',
    },
    en: {
      badge: 'Network Security',
      title: 'IP Masking & IP Rotation',
      subtitle: 'Learn how IP masking and rotation work, and why they don\'t guarantee full anonymity.',
      s1: '1. IP Masking Simulation',
      s2: '2. IP Rotation',
      s3: '3. Forensic Detection',
      s4: '4. Challenge: Log Investigation',
      directBtn: 'Direct Connection', proxyBtn: 'Via Proxy',
      device: 'Your Device', proxy: 'Proxy Server', website: 'Website',
      realIp: 'Real IP', visibleIp: 'Visible IP',
      directNote: '⚠️ The website sees your real IP directly — you are easily traceable.',
      proxyNote: '✅ Website only sees the Proxy IP — but the Proxy itself knows your identity.',
      autoBtn: '▶ Auto-rotate', stopBtn: '⏸ Stop', nextBtn: 'Next Request →',
      logLabel: 'Request log — each request appears from a different IP:',
      rotNote: 'Even with a different IP per request, the behavioral pattern stays constant and is forensically traceable.',
      forensicTitle: 'What does the investigator see?',
      forensicNote: 'Even with IP changes, these signals reveal the real user\'s identity:',
      forensicPoints: [
        { icon: '👤', label: 'Same account',           detail: 'ahmed99@email.com in every request' },
        { icon: '🕐', label: 'Same time window',       detail: '02:00 – 03:00 AM every time' },
        { icon: '📊', label: 'Same activity sequence', detail: 'Login → View → Export always' },
        { icon: '🖥️', label: 'Same browser fingerprint', detail: 'Mozilla/5.0 Chrome/120.0' },
        { icon: '🌍', label: 'Same geographic region', detail: 'ASN: Riyadh, Saudi Arabia' },
      ],
      invTitle: 'Task: Identify all log entries belonging to the same person (ahmed99) despite different IP addresses',
      invHint: '💡 Look at the account column and time pattern — not just IP',
      colTime: 'Time', colIp: 'IP Address', colAcc: 'Account', colAct: 'Activity',
      submitBtn: 'Check Answer', resetBtn: '↺ Reset',
      invCorrect: '✅ Excellent! You found all ahmed99 logs — same person, different IPs.',
      invWrong: '❌ Not quite right. Focus on the "Account" column, not just IP.',
      conclusionTitle: '💡 Key Takeaways',
      conclusionPoints: [
        'IP ≠ Identity — it can be changed, but behavior cannot.',
        'Changing IPs isn\'t enough: accounts, timing, and fingerprints reveal identity.',
        'Forensic investigation correlates patterns, not just IPs.',
        'There is no perfect anonymity online — only varying degrees of difficulty.',
      ],
      qTitle: '🧩 What do investigators use to identify a user despite IP changes?',
      qOpts: ['IP address alone', 'Correlating patterns, accounts, behavior, and timing', 'Connection speed', 'Browser type only'],
      qAns: 1,
      qCorrect: '✅ Correct! Investigators rely on correlating patterns, accounts, and behavior.',
      qWrong: '❌ Try again',
      prevLesson: 'VPN Lesson ←',
    },
  }
  const t = T[lang]

  return (
    <div className="page-transition max-w-5xl mx-auto px-4 py-8" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="mb-5">
        <span className="inline-block bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full text-xs font-bold mb-2">{t.badge}</span>
        <h1 className="text-3xl font-black text-slate-800 mb-1">{t.title}</h1>
      </div>

      {/* Section 1: IP Masking */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-sm">
        <h2 className="text-base font-black text-slate-700 mb-4">{t.s1}</h2>

        <div className="flex gap-2 mb-5">
          <button onClick={() => setMaskMode('direct')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${isDirect ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
            {t.directBtn}
          </button>
          <button onClick={() => setMaskMode('proxy')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${!isDirect ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
            🔀 {t.proxyBtn}
          </button>
        </div>

        {/* Flow diagram */}
        <div className="flex items-center gap-2 mb-5" dir="ltr">
          {/* Device */}
          <div className="text-center flex-shrink-0">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 mx-auto transition-all ${isDirect ? 'bg-red-100 border-red-300' : 'bg-violet-100 border-violet-300'}`}>💻</div>
            <p className="text-xs font-bold text-slate-600 mt-1">{t.device}</p>
            <p className="text-xs font-mono text-red-500 mt-0.5">{REAL_IP}</p>
          </div>

          <div className={`flex-1 h-0.5 ${isDirect ? 'bg-red-400' : 'bg-violet-400'}`} />

          {/* Proxy node */}
          {!isDirect && <>
            <div className="text-center flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 bg-violet-100 border-violet-400 ring-2 ring-violet-200 mx-auto">🔀</div>
              <p className="text-xs font-bold text-violet-600 mt-1">{t.proxy}</p>
              <p className="text-xs font-mono text-violet-500 mt-0.5">{PROXY_IP}</p>
            </div>
            <div className="flex-1 h-0.5 bg-emerald-400" />
          </>}

          {/* Website */}
          <div className="text-center flex-shrink-0">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 mx-auto transition-all ${isDirect ? 'bg-red-100 border-red-300' : 'bg-emerald-100 border-emerald-300'}`}>🌐</div>
            <p className="text-xs font-bold text-slate-600 mt-1">{t.website}</p>
            <p className={`text-xs font-mono font-bold mt-0.5 ${isDirect ? 'text-red-600' : 'text-emerald-600'}`}>{t.visibleIp}: {visibleIp}</p>
          </div>
        </div>

        {/* IP comparison boxes */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200" dir="ltr">
            <p className="text-xs text-slate-500 mb-1">{t.realIp}</p>
            <p className="font-mono font-bold text-red-600">{REAL_IP}</p>
          </div>
          <div className={`rounded-xl p-3 border transition-all ${isDirect ? 'bg-red-50 border-red-200' : 'bg-violet-50 border-violet-200'}`} dir="ltr">
            <p className="text-xs text-slate-500 mb-1">{t.visibleIp}</p>
            <p className={`font-mono font-bold ${isDirect ? 'text-red-600' : 'text-violet-600'}`}>{visibleIp}</p>
          </div>
        </div>

        <div className={`rounded-xl p-3 text-sm font-medium ${isDirect ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          {isDirect ? t.directNote : t.proxyNote}
        </div>
      </div>

      {/* Section 2: IP Rotation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-sm">
        <h2 className="text-base font-black text-slate-700 mb-1">{t.s2}</h2>
        <p className="text-xs text-slate-500 mb-4">{t.logLabel}</p>

        <div className="bg-slate-900 rounded-xl p-4 mb-4 font-mono text-xs overflow-x-auto" dir="ltr">
          <div className="text-slate-500 mb-2"># server access.log</div>
          {ROTATION_LOG.map((entry, i) => (
            <div key={i} className={`flex items-center gap-3 py-1 rounded transition-all duration-300
              ${i === rotIdx ? 'bg-yellow-400/20 px-1' : i < rotIdx ? 'opacity-50' : 'opacity-25'}`}>
              <span className="text-slate-500 w-16 flex-shrink-0">{entry.time}</span>
              <span className={`w-28 flex-shrink-0 font-bold ${i === rotIdx ? 'text-yellow-400' : 'text-emerald-400'}`}>{entry.ip}</span>
              <span className="text-cyan-400 flex-1">{entry.action}</span>
              <span className={entry.status === 200 ? 'text-emerald-400' : 'text-red-400'}>{entry.status}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-3">
          <button onClick={() => setAutoRot(a => !a)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${autoRot ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}>
            {autoRot ? t.stopBtn : t.autoBtn}
          </button>
          <button onClick={() => { setAutoRot(false); setRotIdx(i => (i + 1) % ROTATION_LOG.length) }}
            className="flex-1 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            {t.nextBtn}
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">⚠️ {t.rotNote}</div>
      </div>

      {/* Section 3: Forensics */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-5">
        <h2 className="text-base font-black text-white mb-1">{t.forensicTitle}</h2>
        <p className="text-slate-400 text-xs mb-4">{t.forensicNote}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {t.forensicPoints.map((point, i) => (
            <div key={i} className="bg-slate-700/60 rounded-xl p-3 flex items-start gap-3 border border-slate-600">
              <span className="text-xl flex-shrink-0">{point.icon}</span>
              <div>
                <p className="text-sm font-bold text-white">{point.label}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{point.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Investigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-sm">
        <h2 className="text-base font-black text-slate-700 mb-1">{t.s4}</h2>
        <p className="text-sm text-slate-500 mb-1">{t.invTitle}</p>
        <p className="text-xs text-violet-600 mb-4">{t.invHint}</p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm" dir="ltr">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2 text-xs text-slate-500 font-bold text-left rounded-tl-lg w-8">✓</th>
                <th className="px-3 py-2 text-xs text-slate-500 font-bold text-left">{t.colTime}</th>
                <th className="px-3 py-2 text-xs text-slate-500 font-bold text-left">{t.colIp}</th>
                <th className="px-3 py-2 text-xs text-slate-500 font-bold text-left">{t.colAcc}</th>
                <th className="px-3 py-2 text-xs text-slate-500 font-bold text-left rounded-tr-lg">{t.colAct}</th>
              </tr>
            </thead>
            <tbody>
              {INVESTIGATION_LOGS.map(log => {
                const isSel = selected.has(log.id)
                const isOk  = submitted && log.suspect && isSel
                const isBad = submitted && !log.suspect && isSel
                const miss  = submitted && log.suspect && !isSel
                return (
                  <tr key={log.id} onClick={() => toggleSelect(log.id)}
                    className={`border-t border-slate-100 cursor-pointer transition-all
                      ${isOk ? 'bg-emerald-50' : isBad ? 'bg-red-50' : miss ? 'bg-amber-50' : isSel ? 'bg-violet-50' : 'hover:bg-slate-50'}`}>
                    <td className="px-3 py-2.5">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                        ${isOk ? 'bg-emerald-500 border-emerald-500' : isBad ? 'bg-red-500 border-red-500' : isSel ? 'bg-violet-500 border-violet-500' : 'border-slate-300'}`}>
                        {isSel && <span className="text-white text-xs leading-none">✓</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{log.time}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{log.ip}</td>
                    <td className={`px-3 py-2.5 text-xs font-bold ${log.account === 'ahmed99' ? 'text-violet-700' : 'text-slate-500'}`}>{log.account}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{log.action}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2">
          {!submitted ? (
            <button onClick={() => setSubmitted(true)} disabled={selected.size === 0}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
              {t.submitBtn}
            </button>
          ) : (
            <button onClick={() => { setSelected(new Set()); setSubmitted(false) }}
              className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
              {t.resetBtn}
            </button>
          )}
        </div>
        {submitted && (
          <p className={`mt-3 text-sm font-bold ${investigationCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>
            {investigationCorrect ? t.invCorrect : t.invWrong}
          </p>
        )}
      </div>

      {/* Quiz */}
      <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 mb-5">
        <h3 className="font-bold text-violet-800 text-sm mb-3">{t.qTitle}</h3>
        <div className="space-y-2">
          {t.qOpts.map((opt, i) => (
            <button key={i} onClick={() => setAnswer(i)}
              className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-medium border transition-all
                ${answer === null ? 'bg-white border-slate-200 text-slate-700 hover:border-violet-300'
                  : answer === t.qAns
                    ? i === t.qAns ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                      : 'bg-white border-slate-200 text-slate-400 opacity-50'
                    : i === answer ? 'bg-red-100 border-red-400 text-red-700'
                      : i === t.qAns ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-400 opacity-50'}`}
              dir={isAr ? 'rtl' : 'ltr'}>{opt}
            </button>
          ))}
        </div>
        {answer !== null && (
          <p className={`mt-3 text-sm font-bold ${answer === t.qAns ? 'text-emerald-700' : 'text-red-600'}`}>
            {answer === t.qAns ? t.qCorrect : t.qWrong}
          </p>
        )}
      </div>

      <Explanation>
        <p className="text-slate-600 text-sm leading-relaxed mb-5">{t.subtitle}</p>

        {/* Conclusion */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <h3 className="font-black text-slate-800 text-base mb-3">{t.conclusionTitle}</h3>
          <ul className="space-y-2">
            {t.conclusionPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-violet-500 font-black flex-shrink-0 mt-0.5">{i + 1}.</span>{p}
              </li>
            ))}
          </ul>
        </div>
      </Explanation>

      <div className="flex items-center justify-between pt-6 border-t border-slate-100">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-violet-600 text-sm font-medium transition-colors">
          <ChevronLeft className="w-4 h-4" />{isAr ? '← الرئيسية' : '← Home'}
        </button>
        <button onClick={() => navigate('/vpn')} className="text-sm text-slate-400 hover:text-indigo-600 transition-colors">
          {t.prevLesson}
        </button>
      </div>
    </div>
  )
}
