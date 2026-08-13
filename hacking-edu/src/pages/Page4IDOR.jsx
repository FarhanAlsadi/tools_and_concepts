import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, User, CreditCard, ArrowLeftRight, Globe, Send,
  ShieldCheck, ShieldAlert, ShieldX,
} from 'lucide-react'
import { BANK_USERS } from '../data/bankUsers'
import { useApp } from '../context/AppContext'
import Explanation from '../components/Explanation'

// ── UUID map (hardcoded, deterministic) ────────────────────────────────────
const UUID_MAP = {
  1: '9f3a1b2c-d4e5-4f67-8901-a2b3c4d5e6f7',
  2: '69c89e9f-c6a0-4393-ac17-45690fda3704',
  3: 'b5c7d8e9-f0a1-4b23-c456-d7e8f9a0b1c2',
  4: 'c3d4e5f6-a7b8-4c90-d123-e4f5a6b7c8d9',
  5: 'd1e2f3a4-b5c6-4d78-e901-f2a3b4c5d6e7',
}
const UUID_REVERSE = Object.fromEntries(
  Object.entries(UUID_MAP).map(([k, v]) => [v, parseInt(k)])
)

function buildUrl(id, mode) {
  if (!id) return 'https://bank.com/account?id=???'
  if (mode === 'sequential') return `https://bank.com/account?id=${100 + id}`
  return `https://bank.com/account?id=${UUID_MAP[id]}`
}

function computeAccessResult(mode, currentId) {
  if (!currentId) return 'not-found'
  if (currentId === 1) return 'own'
  if (mode === 'uuid-auth') return 'denied'
  return 'unauthorized'
}

// ── BrowserBar ──────────────────────────────────────────────────────────────
function BrowserBar({ id, mode, accessResult, onNavigate, isAr }) {
  const [inputVal, setInputVal] = useState(buildUrl(id, mode))

  useEffect(() => {
    setInputVal(buildUrl(id, mode))
  }, [id, mode])

  const handleNavigate = () => {
    if (mode === 'sequential') {
      const match = inputVal.match(/[?&]id=(\d+)/)
      if (match) {
        const num = parseInt(match[1])
        if (num >= 101 && num <= 105) { onNavigate(num - 100); return }
        if (num >= 1 && num <= 5)     { onNavigate(num); return }
      }
      onNavigate(null)
    } else {
      const match = inputVal.match(/[?&]id=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
      if (match) {
        const userId = UUID_REVERSE[match[1].toLowerCase()]
        onNavigate(userId || null)
      } else {
        onNavigate(null)
      }
    }
  }

  return (
    <div className="bg-slate-100 rounded-xl px-4 py-2 flex items-center gap-3" dir="ltr">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
      </div>
      <div className="flex-1 bg-white rounded-lg flex items-center gap-2 px-3 py-1.5 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-300 min-w-0">
        <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <input
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleNavigate()}
          className="flex-1 text-sm font-mono text-slate-700 bg-transparent outline-none min-w-0"
          dir="ltr"
        />
        <button
          onClick={handleNavigate}
          className="text-indigo-500 hover:text-indigo-700 text-xs font-bold px-1.5 py-0.5 bg-indigo-50 rounded flex-shrink-0"
        >
          ↵
        </button>
      </div>
      {accessResult === 'unauthorized' && (
        <div className="flex items-center gap-1 text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded-lg border border-red-200 flex-shrink-0">
          <AlertTriangle className="w-3 h-3" />
          {isAr ? 'وصول غير مصرح!' : 'Unauthorized!'}
        </div>
      )}
      {accessResult === 'denied' && (
        <div className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-100 px-2 py-1 rounded-lg border border-red-300 flex-shrink-0">
          <ShieldX className="w-3 h-3" />
          {isAr ? 'محجوب!' : 'Blocked!'}
        </div>
      )}
    </div>
  )
}

// ── ComparisonPanel ─────────────────────────────────────────────────────────
function ComparisonPanel({ mode, currentId, accessResult, lang }) {
  const isAr = lang === 'ar'
  const loggedIn = BANK_USERS[1]
  const requested = currentId ? BANK_USERS[currentId] : null

  const loggedInId = mode === 'sequential' ? 'ID = 101' : `${UUID_MAP[1].slice(0, 8)}…`
  const requestedId = currentId
    ? (mode === 'sequential' ? `ID = ${100 + currentId}` : `${UUID_MAP[currentId].slice(0, 8)}…`)
    : (isAr ? 'غير صالح' : 'Invalid')

  const cfg = {
    own:          { icon: '✅', ar: 'وصول مسموح',            en: 'Access Granted',        cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    unauthorized: { icon: '⚠️', ar: 'غير مصرح — لكن مرئي!', en: 'Unauthorized — Visible!', cls: 'bg-orange-50 border-orange-200 text-orange-700' },
    denied:       { icon: '🚫', ar: 'وصول مرفوض',            en: 'Access Denied',          cls: 'bg-red-50 border-red-200 text-red-700' },
    'not-found':  { icon: '🔍', ar: 'لا توجد بيانات',         en: 'No Data Found',          cls: 'bg-slate-50 border-slate-200 text-slate-500' },
  }[accessResult] || { icon: '🔍', ar: 'لا توجد بيانات', en: 'No Data Found', cls: 'bg-slate-50 border-slate-200 text-slate-500' }

  return (
    <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-center" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <p className="text-xs text-slate-400 mb-1">{isAr ? 'المستخدم المسجل' : 'Logged-in User'}</p>
        <p className="font-bold text-slate-700 text-sm">{loggedIn.avatar} {isAr ? loggedIn.name : loggedIn.nameEn}</p>
        <p className="font-mono text-xs text-slate-400 mt-0.5 break-all" dir="ltr">{loggedInId}</p>
      </div>
      <div className="border-x border-slate-200">
        <p className="text-xs text-slate-400 mb-1">{isAr ? 'الطلب الحالي' : 'Current Request'}</p>
        <p className="font-bold text-slate-700 text-sm">{requested ? `${requested.avatar} ${isAr ? requested.name : requested.nameEn}` : '—'}</p>
        <p className="font-mono text-xs text-slate-400 mt-0.5 break-all" dir="ltr">{requestedId}</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-1">{isAr ? 'النتيجة' : 'Result'}</p>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold ${cfg.cls}`}>
          {cfg.icon} {isAr ? cfg.ar : cfg.en}
        </span>
      </div>
    </div>
  )
}

// ── BankCard ────────────────────────────────────────────────────────────────
function BankCard({ user, liveBalance, isAr }) {
  const display = liveBalance !== undefined
    ? (isAr ? liveBalance.toLocaleString('en') + ' ر.ق' : 'QAR ' + liveBalance.toLocaleString('en'))
    : (isAr ? user.balance : user.balanceEn)
  return (
    <div className="bank-card p-6 rounded-2xl shadow-xl" dir="ltr">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-blue-200 text-xs mb-1 font-medium">
            {isAr ? 'بنك تعليمي — للمحاكاة فقط' : 'Educational Bank — Simulation Only'}
          </p>
          <p className="text-white/60 text-xs">{isAr ? user.type : user.typeEn}</p>
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
          {user.avatar}
        </div>
      </div>
      <div className="mb-4">
        <p className="text-white/60 text-xs mb-1">{isAr ? 'رقم الحساب' : 'Account Number'}</p>
        <p className="text-white font-mono text-sm tracking-wider">{user.accountNumber}</p>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-white/60 text-xs mb-1">{isAr ? 'اسم صاحب الحساب' : 'Account Holder'}</p>
          <p className="text-white font-bold text-lg">{isAr ? user.name : user.nameEn}</p>
        </div>
        <div className="text-right">
          <p className="text-white/60 text-xs mb-1">{isAr ? 'الرصيد' : 'Balance'}</p>
          <p className="text-white font-black text-xl">{display}</p>
        </div>
      </div>
    </div>
  )
}

// ── Security mode config ────────────────────────────────────────────────────
const SECURITY_MODES = [
  {
    id: 'sequential',
    Icon: ShieldX,
    colorOff: 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100',
    colorOn: 'bg-red-500 text-white border-red-500 shadow-md',
    labelAr: 'ID تسلسلي — ضعيف',
    labelEn: 'Sequential ID — Vulnerable',
    explainAr: 'في الوضع الأول، يمكن تغيير الرقم بسهولة والوصول إلى بيانات الآخرين.',
    explainEn: 'In mode 1, the sequential ID is easy to guess — just change 101 to 102 and you see another user\'s data.',
    bgExplain: 'bg-red-50 border-red-200 text-red-800',
  },
  {
    id: 'uuid',
    Icon: ShieldAlert,
    colorOff: 'border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100',
    colorOn: 'bg-amber-500 text-white border-amber-500 shadow-md',
    labelAr: 'UUID — أصعب للتخمين',
    labelEn: 'UUID — Hard to Guess',
    explainAr: 'في الوضع الثاني، يتم استخدام UUID مما يجعل التخمين أصعب، لكن النظام لا يزال غير آمن إذا لم يتم التحقق من صلاحية المستخدم.',
    explainEn: 'In mode 2, UUIDs replace sequential IDs — much harder to guess. But if someone knows the UUID, the server still returns the data. No authorization check.',
    bgExplain: 'bg-amber-50 border-amber-200 text-amber-800',
  },
  {
    id: 'uuid-auth',
    Icon: ShieldCheck,
    colorOff: 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100',
    colorOn: 'bg-emerald-500 text-white border-emerald-500 shadow-md',
    labelAr: 'UUID + تفويض — آمن',
    labelEn: 'UUID + Auth — Secure',
    explainAr: 'في الوضع الثالث، يتم التحقق من أن المستخدم هو صاحب البيانات، وهذا هو الحل الصحيح لمنع ثغرة IDOR.',
    explainEn: 'In mode 3, the server checks that the requesting user owns the account. Even with the correct UUID, access is denied if it doesn\'t belong to you.',
    bgExplain: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  },
]

// ── Page ────────────────────────────────────────────────────────────────────
export default function Page4IDOR() {
  const [currentId, setCurrentId]       = useState(1)
  const [securityMode, setSecurityMode] = useState('sequential')
  const [showExplanation, setShowExplanation] = useState(false)
  const navigate = useNavigate()
  const { lang } = useApp()

  const [balances, setBalances] = useState(() =>
    Object.fromEntries(Object.entries(BANK_USERS).map(([k, v]) => [k, v.balanceRaw]))
  )
  const [transferTo,  setTransferTo]  = useState('2')
  const [transferAmt, setTransferAmt] = useState('')
  const [transferMsg, setTransferMsg] = useState(null)

  const user         = currentId ? BANK_USERS[currentId] : null
  const hasChangedId = currentId !== 1
  const accessResult = computeAccessResult(securityMode, currentId)
  const isAr         = lang === 'ar'

  useEffect(() => {
    const other = Object.keys(BANK_USERS).find(k => parseInt(k) !== currentId)
    if (other) setTransferTo(other)
    setTransferMsg(null)
  }, [currentId])

  const applyId = (val) => {
    if (val === null) { setCurrentId(null); return }
    const num = typeof val === 'number' ? val : parseInt(val)
    if (num >= 1 && num <= 5) {
      setCurrentId(num)
      if (num !== 1) setShowExplanation(true)
    } else {
      setCurrentId(null)
    }
  }

  const switchMode = (modeId) => {
    setSecurityMode(modeId)
    setCurrentId(1)
    setTransferMsg(null)
    setShowExplanation(false)
  }

  const handleTransfer = () => {
    if (securityMode === 'uuid-auth' && currentId !== 1) return
    const amt = parseInt(transferAmt)
    if (!amt || amt <= 0 || amt > 999999) return
    const toId = parseInt(transferTo)
    if (toId === currentId) return
    if (amt > balances[currentId]) { setTransferMsg({ type: 'error' }); return }
    setBalances(prev => ({
      ...prev,
      [currentId]: prev[currentId] - amt,
      [toId]: prev[toId] + amt,
    }))
    setTransferMsg({ type: 'success', fromId: currentId, toId, amount: amt })
    setTransferAmt('')
    if (currentId !== 1) setShowExplanation(true)
  }

  const activeModeConfig = SECURITY_MODES.find(m => m.id === securityMode)

  const T = {
    ar: {
      lesson: 'درس ٥', title: 'ثغرة IDOR', subtitle: 'تعلم مفهوم الإشارة المباشرة غير الآمنة للكائنات من خلال مثال بنكي',
      conceptTitle: 'ما هي ثغرة IDOR؟',
      conceptText: 'IDOR اختصار لـ Insecure Direct Object Reference أي "الإشارة المباشرة غير الآمنة للكائنات". تحدث عندما يستطيع المستخدم تغيير قيمة مثل رقم id في الرابط للوصول إلى بيانات مستخدم آخر.',
      modesTitle: 'أوضاع الأمان — جرّب الفرق',
      scenario: 'السيناريو:',
      scenarioSeq: 'أنت مسجل دخولك كـ مريم المنصوري (ID=101). ماذا يحدث لو غيّرت الرقم في الرابط؟',
      scenarioUuid: 'أنت مسجل دخولك كـ مريم المنصوري. الآن يتم استخدام UUID بدلاً من الأرقام. جرّب تغيير UUID في الرابط.',
      scenarioAuth: 'أنت مسجل دخولك كـ مريم المنصوري. النظام الآن يتحقق من هويتك قبل إرسال البيانات. جرّب الوصول لحساب آخر.',
      bankTitle: 'بوابة الحساب البنكي (محاكاة تعليمية)',
      warningBadge: 'تحذير: بيانات مستخدم آخر!',
      noAccess: 'أنت لا تملك صلاحية رؤيتها.',
      transactions: 'آخر المعاملات',
      noUser: 'لا يوجد مستخدم بهذا الـ ID',
      tryTitle: 'جرب تغيير الحساب',
      tryDescSeq: 'غيّر رقم الـ ID من 101 إلى 105 في شريط العنوان أو استخدم الأزرار أدناه',
      tryDescUuid: 'انقر على أزرار الحسابات الأخرى — سيتغير الـ UUID في شريط العنوان تلقائياً',
      tryDescAuth: 'انقر على أي حساب آخر — ستتم محاولة الوصول لكن النظام سيرفضها',
      idRange: { sequential: '(الأرقام في الرابط: 101-105)', uuid: '(UUID يتغير في الرابط)', 'uuid-auth': '(UUID + تحقق من الصلاحية)' },
      ownAccount: 'الحساب رقم 1 = حسابك الخاص',
      otherAccount: 'الحسابات 2-5 = حسابات شخص آخر!',
      idorTitle: 'هذه هي ثغرة IDOR!',
      idorExplain: 'يجب على الموقع التأكد أن رقم المستخدم الذي يطلب البيانات هو نفس رقم المستخدم المسجل دخوله. إذا لم يتطابق الرقمان، فهذا يعني أن المستخدم غير مصرح له.',
      summary: '📚 ملخص ثغرة IDOR',
      sum1: 'IDOR تحدث عندما يُغيّر المستخدم معرّفاً في الرابط ويصل لبيانات لا تخصه',
      sum2: 'الثغرة سببها أن الخادم لا يتحقق من هوية طالب البيانات',
      sum3: 'الحل: دائماً تحقق أن المستخدم يملك صلاحية الوصول قبل إرسال البيانات',
      transferTitle: 'تحويل رصيد',
      transferIDOR: 'أنت تحوّل الآن من حساب شخص آخر — هذا ما يفعله المهاجم باستخدام ثغرة IDOR!',
      transferTo: 'إلى حساب',
      amountLabel: 'المبلغ (ر.ق)',
      sendBtn: 'حوّل',
      successOwn: 'تم التحويل بنجاح',
      successIDOR: '⚠️ تحويل غير مصرح! سرقت الرصيد من حساب',
      toLabel: 'إلى',
      errorBalance: '❌ الرصيد غير كافٍ',
      accessDeniedTitle: '🚫 وصول مرفوض',
      accessDeniedMsg: 'ليس لديك صلاحية الوصول إلى هذا الحساب.',
      accessDeniedSub: 'النظام تحقق من هويتك ورفض الطلب — هذا هو الحل الصحيح.',
    },
    en: {
      lesson: 'Lesson 5', title: 'IDOR Vulnerability', subtitle: 'Learn Insecure Direct Object Reference through a simple banking example',
      conceptTitle: 'What is IDOR?',
      conceptText: 'IDOR stands for Insecure Direct Object Reference. It occurs when a user can change a value like an id number in the URL to access another user\'s data without authorization.',
      modesTitle: 'Security Modes — Try the Difference',
      scenario: 'Scenario:',
      scenarioSeq: 'You are logged in as Mariam Al-Mansouri (ID=101). What happens if you change the number in the URL?',
      scenarioUuid: 'You are logged in as Mariam Al-Mansouri. IDs are now UUIDs. Try changing the UUID in the URL.',
      scenarioAuth: 'You are logged in as Mariam Al-Mansouri. The server now checks your identity before sending data. Try accessing another account.',
      bankTitle: 'Bank Account Portal (Educational Simulation)',
      warningBadge: 'Warning: Another user\'s data!',
      noAccess: 'You do not have permission to view this.',
      transactions: 'Recent Transactions',
      noUser: 'No user found with this ID',
      tryTitle: 'Try Switching Accounts',
      tryDescSeq: 'Change the ID from 101 to 105 in the address bar, or use the buttons below',
      tryDescUuid: 'Click another account button — the UUID in the address bar updates automatically',
      tryDescAuth: 'Click any other account — the request is made but the server will reject it',
      idRange: { sequential: '(URL IDs: 101–105)', uuid: '(UUID changes in URL)', 'uuid-auth': '(UUID + authorization check)' },
      ownAccount: 'Account 1 = Your own account',
      otherAccount: 'Accounts 2–5 = Someone else\'s account!',
      idorTitle: 'This is the IDOR vulnerability!',
      idorExplain: 'The website must verify that the user requesting data has the same ID as the logged-in user. If the two IDs don\'t match, the user is unauthorized.',
      summary: '📚 IDOR Summary',
      sum1: 'IDOR occurs when a user changes an ID in the URL and accesses data that is not theirs',
      sum2: 'The vulnerability exists because the server does not verify the requester\'s identity',
      sum3: 'Solution: Always verify that the user has access permission before sending data',
      transferTitle: 'Transfer Funds',
      transferIDOR: 'You are transferring from someone else\'s account — this is what an attacker does using IDOR!',
      transferTo: 'To account',
      amountLabel: 'Amount (QAR)',
      sendBtn: 'Transfer',
      successOwn: 'Transfer successful',
      successIDOR: '⚠️ Unauthorized transfer! Stole funds from',
      toLabel: 'to',
      errorBalance: '❌ Insufficient balance',
      accessDeniedTitle: '🚫 Access Denied',
      accessDeniedMsg: 'You do not have permission to access this account.',
      accessDeniedSub: 'The server verified your identity and rejected the request — this is the correct fix.',
    }
  }
  const t = T[lang]

  const scenarioText = {
    sequential: t.scenarioSeq,
    uuid: t.scenarioUuid,
    'uuid-auth': t.scenarioAuth,
  }[securityMode]

  const tryDesc = {
    sequential: t.tryDescSeq,
    uuid: t.tryDescUuid,
    'uuid-auth': t.tryDescAuth,
  }[securityMode]

  return (
    <div className="page-transition max-w-5xl mx-auto px-4 py-8" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="mb-6">
        <span className="bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{t.lesson}</span>
        <h1 className="text-3xl font-black text-slate-800 mt-2 mb-2">{t.title}</h1>
      </div>

      {/* Scenario */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
        <User className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-blue-800 text-sm">{t.scenario}</p>
          <p className="text-blue-700 text-sm">{scenarioText}</p>
        </div>
      </div>

      {/* Browser & Bank UI */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <BrowserBar
            id={currentId || 1}
            mode={securityMode}
            accessResult={accessResult}
            onNavigate={applyId}
            isAr={isAr}
          />
        </div>

        <div className="p-5">
          {/* Comparison Panel */}
          <ComparisonPanel
            mode={securityMode}
            currentId={currentId}
            accessResult={accessResult}
            lang={lang}
          />

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-700 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {t.bankTitle}
            </h2>
            {hasChangedId && accessResult === 'unauthorized' && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5 text-xs font-bold warning-pulse">
                <AlertTriangle className="w-4 h-4" />
                {t.warningBadge}
              </div>
            )}
            {hasChangedId && accessResult === 'denied' && (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                {isAr ? 'النظام يحمي البيانات ✓' : 'System protected ✓'}
              </div>
            )}
          </div>

          {/* Mode 3 + other user → Access Denied screen */}
          {accessResult === 'denied' ? (
            <div className="text-center py-14">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldX className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-black text-red-700 text-xl mb-2">{t.accessDeniedTitle}</h3>
              <p className="text-red-600 text-sm mb-1">{t.accessDeniedMsg}</p>
              <p className="text-slate-400 text-xs">{t.accessDeniedSub}</p>
            </div>

          ) : user ? (
            <div className="grid grid-cols-5 gap-5">
              <div className="col-span-2">
                <BankCard user={user} liveBalance={balances[currentId]} isAr={isAr} />
                {!user.isCurrentUser && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-red-700 text-xs font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {isAr ? `هذه بيانات ${user.name}!` : `This is ${user.nameEn}'s data!`} {t.noAccess}
                    </p>
                  </div>
                )}
              </div>

              <div className="col-span-3">
                <h3 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4" />
                  {t.transactions}
                </h3>
                <div className="space-y-2 mb-4">
                  {user.transactions.map((tx, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-slate-700 text-sm font-medium">{isAr ? tx.desc : tx.descEn}</p>
                        <p className="text-slate-400 text-xs">{isAr ? tx.date : tx.dateEn}</p>
                      </div>
                      <span className={`font-bold text-sm ${tx.color}`} dir="ltr">
                        {isAr ? tx.amount : tx.amountEn}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h4 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {t.transferTitle}
                  </h4>

                  {currentId !== 1 && (
                    <div className="mb-3 bg-red-50 border-2 border-red-300 rounded-xl p-3 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-red-700 text-xs font-bold">{t.transferIDOR}</p>
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 mb-1 block">{t.transferTo}</label>
                      <select
                        value={transferTo}
                        onChange={e => { setTransferTo(e.target.value); setTransferMsg(null) }}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        dir={isAr ? 'rtl' : 'ltr'}
                      >
                        {Object.values(BANK_USERS).filter(u => u.id !== currentId).map(u => (
                          <option key={u.id} value={u.id}>{isAr ? u.name : u.nameEn}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-28">
                      <label className="text-xs text-slate-500 mb-1 block">{t.amountLabel}</label>
                      <input
                        type="number"
                        value={transferAmt}
                        onChange={e => { setTransferAmt(e.target.value); setTransferMsg(null) }}
                        onKeyDown={e => e.key === 'Enter' && handleTransfer()}
                        placeholder="0"
                        min="1"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        dir="ltr"
                      />
                    </div>
                    <button
                      onClick={handleTransfer}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors text-white ${
                        currentId !== 1 ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {t.sendBtn}
                    </button>
                  </div>

                  {transferMsg?.type === 'success' && (
                    <div className={`mt-2 text-xs rounded-xl px-3 py-2 ${
                      transferMsg.fromId !== 1
                        ? 'bg-red-50 border border-red-200 text-red-700'
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    }`}>
                      {transferMsg.fromId !== 1
                        ? `${t.successIDOR} ${isAr ? BANK_USERS[transferMsg.fromId].name : BANK_USERS[transferMsg.fromId].nameEn} ${t.toLabel} ${isAr ? BANK_USERS[transferMsg.toId].name : BANK_USERS[transferMsg.toId].nameEn} — ${isAr ? transferMsg.amount.toLocaleString('en') + ' ر.ق' : 'QAR ' + transferMsg.amount.toLocaleString('en')}`
                        : `✅ ${t.successOwn}: ${isAr ? transferMsg.amount.toLocaleString('en') + ' ر.ق' : 'QAR ' + transferMsg.amount.toLocaleString('en')} ${t.toLabel} ${isAr ? BANK_USERS[transferMsg.toId].name : BANK_USERS[transferMsg.toId].nameEn}`
                      }
                    </div>
                  )}
                  {transferMsg?.type === 'error' && (
                    <div className="mt-2 text-xs rounded-xl px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700">
                      {t.errorBalance}
                    </div>
                  )}
                </div>
              </div>
            </div>

          ) : (
            <div className="text-center py-8 text-slate-400">
              <p className="text-4xl mb-2">🔍</p>
              <p>{t.noUser}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick account switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-5">
        <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          {t.tryTitle}
        </h3>
        <p className="text-slate-500 text-sm mb-4">{tryDesc}</p>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => applyId(n)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                  currentId === n
                    ? 'bg-indigo-600 text-white shadow-md'
                    : n === 1
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-red-50 text-red-500 hover:bg-red-100'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400">{t.idRange[securityMode]}</span>
        </div>

        <div className="mt-4 flex gap-3 text-xs">
          <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />{t.ownAccount}
          </span>
          <span className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-lg">
            <span className="w-2 h-2 bg-red-500 rounded-full inline-block" />{t.otherAccount}
          </span>
        </div>
      </div>

      {/* ── Security Modes Selector ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 mb-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="font-bold text-slate-800">{t.modesTitle}</h3>
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          {SECURITY_MODES.map(m => {
            const Icon = m.Icon
            const isActive = securityMode === m.id
            return (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${isActive ? m.colorOn : m.colorOff}`}
              >
                <Icon className="w-4 h-4" />
                {isAr ? m.labelAr : m.labelEn}
              </button>
            )
          })}
        </div>

        {/* Per-mode explanation */}
        <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed border ${activeModeConfig.bgExplain}`}>
          {isAr ? activeModeConfig.explainAr : activeModeConfig.explainEn}
        </div>
      </div>

      <Explanation>
        <p className="text-slate-500 mb-4">{t.subtitle}</p>

        {/* IDOR Concept */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-5">
          <h2 className="font-bold text-orange-800 mb-2">{t.conceptTitle}</h2>
          <p className="text-orange-700 text-sm leading-relaxed">{t.conceptText}</p>
        </div>

        {/* IDOR explanation (appears after first unauthorized access) */}
        {showExplanation && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-5 slide-in">
            <h3 className="font-bold text-red-800 text-lg mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {t.idorTitle}
            </h3>
            <p className="text-red-700 text-sm leading-relaxed">{t.idorExplain}</p>
          </div>
        )}

        {/* Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <h3 className="font-bold text-slate-800 mb-2">{t.summary}</h3>
          <ul className="space-y-2 text-slate-600 text-sm">
            <li className="flex items-start gap-2"><span className="text-orange-500">◆</span> {t.sum1}</li>
            <li className="flex items-start gap-2"><span className="text-orange-500">◆</span> {t.sum2}</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500">✓</span> {t.sum3}</li>
          </ul>
        </div>
      </Explanation>

      <div className="flex items-center pt-6 border-t border-slate-100">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">
          ← {isAr ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
