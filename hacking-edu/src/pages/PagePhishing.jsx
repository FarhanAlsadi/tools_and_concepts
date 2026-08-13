import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  ChevronLeft, Star, User, History, Inbox, Clock, Send, File, Pencil,
  Search, Settings, Menu, Trash2, Archive, MoreVertical, ChevronDown,
  RotateCw, ArrowLeft, ArrowRight, Tag, Users, LayoutGrid, CornerUpLeft, Mail,
} from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   SPOT THE PHISHING — a realistic Gmail inbox
   The lesson now looks like Gmail opened in a browser: a left sidebar (Compose,
   Inbox, Starred…), a list of several emails, category tabs, and a reading pane.
   Open an email, HOVER the sender / links / buttons — a real browser-style status
   bar at the bottom reveals the true destination URL and sender address — then
   decide Phishing or Legit. Feedback lists the exact red flags. Score across all.
   ──────────────────────────────────────────────────────────────────────────── */

const MSGS = [
  {
    id: 1, template: 'gdocs', phish: true,
    from: { name: 'Luke Johnson', email: 'luke.json8000@gmail.com', color: '#e05a47' },
    time: '7:11 AM',
    subjectAr: 'ميزانية القسم 2026 — دعوة للتعديل', subjectEn: 'Invitation to edit — 2026 Department Budget',
    docTitle: '2026 Department Budget',
    msgAr: 'مرحباً. هذا هو المستند الذي طلبته. أخبرني إن احتجت أي شيء آخر!',
    msgEn: 'Hey there. Here is the doc you asked for. Let me know if you need anything else!',
    open: { href: 'https://docs-google.secure-share.web.app/edit?id=8830', },
    flags: [
      { ar: 'المرسل بريد Gmail عشوائي (luke.json8000) ينتحل زميلاً — ليس عنوان مشاركة رسمياً من Google.', en: 'The sender is a random Gmail (luke.json8000) impersonating a colleague — not an official Google share address.' },
      { ar: 'زر «Open» يقود إلى docs-google.secure-share.web.app وليس إلى docs.google.com.', en: 'The “Open” button goes to docs-google.secure-share.web.app, not docs.google.com.' },
      { ar: 'مستند «ميزانية» مغرٍ لفتحه — طُعم كلاسيكي.', en: 'A tempting “budget” document — a classic bait.' },
    ],
    whyAr: 'رسالة مشاركة مستند مزيفة: زر الفتح يوجّهك لموقع ليس تابعاً لـ Google ليسرق بيانات دخولك.',
    whyEn: 'A fake document-share email: the Open button sends you to a non-Google site to steal your login.',
  },
  {
    id: 2, template: 'gdocs', phish: false,
    from: { name: 'Sara Al-Ansari', email: 'sara.alansari@camelcode.io', color: '#4285f4' },
    time: '9:02 AM',
    subjectAr: 'خطة درس CSYC — دعوة للتعديل', subjectEn: 'Invitation to edit — CSYC Lesson Plan',
    docTitle: 'CSYC Lesson Plan',
    msgAr: 'خطة الدرس القادم كما اتفقنا. أضيفي ملاحظاتك مباشرة على المستند.',
    msgEn: 'Next lesson plan as we agreed. Add your notes directly on the doc.',
    open: { href: 'https://docs.google.com/document/d/1aZ9k/edit' },
    flags: [
      { ar: 'المرسل من نطاق العمل الحقيقي camelcode.io وتعرفه.', en: 'The sender is from the real work domain camelcode.io and you know them.' },
      { ar: 'زر «Open» يقود فعلاً إلى docs.google.com.', en: 'The “Open” button really goes to docs.google.com.' },
      { ar: 'سياق متوقَّع (خطة درس اتفقتما عليها).', en: 'Expected context (a lesson plan you agreed on).' },
    ],
    whyAr: 'مشاركة مستند حقيقية: النطاق موثوق، والرابط يقود لموقع Google الرسمي.',
    whyEn: 'A genuine document share: trusted domain, and the link goes to the official Google site.',
  },
  {
    id: 3, template: 'security', phish: true,
    from: { name: 'Apple', email: 'appleid@apple-support-id.com', color: '#111827' },
    time: '2:20 AM',
    subjectAr: 'تم قفل معرّف Apple الخاص بك', subjectEn: 'Your Apple ID has been locked',
    service: 'Apple', serviceIcon: '', brandColor: '#111827',
    titleAr: 'تم قفل معرّف Apple الخاص بك', titleEn: 'Your Apple ID has been locked',
    bodyAr: 'لأسباب أمنية تم قفل حسابك. أعد تفعيله خلال 24 ساعة بإدخال بياناتك وبطاقتك وإلا سيُحذف نهائياً.',
    bodyEn: 'For security reasons your account is locked. Reactivate it within 24 hours by entering your details and card, or it will be permanently deleted.',
    open: { href: 'https://appleid-unlock.support-id.com/verify' }, openAr: 'إعادة تفعيل الحساب', openEn: 'Unlock account',
    flags: [
      { ar: 'نطاق المرسل مزيّف: Apple تستخدم apple.com فقط.', en: 'Fake sender domain: Apple only uses apple.com.' },
      { ar: 'زر التفعيل يقود إلى appleid-unlock.support-id.com — ليس Apple.', en: 'The unlock button goes to appleid-unlock.support-id.com — not Apple.' },
      { ar: 'تهديد وعجلة («خلال 24 ساعة وإلا…») + طلب بطاقة.', en: 'Threat + urgency (“within 24 hours or…”) and a request for your card.' },
    ],
    whyAr: 'تصيّد كلاسيكي: أبل لا تطلب بطاقتك ولا تهدد بالحذف، والرابط لموقع مزيف.',
    whyEn: "Classic phishing: Apple never asks for your card or threatens deletion, and the link is a fake site.",
  },
  {
    id: 4, template: 'security', phish: false,
    from: { name: 'Google', email: 'no-reply@accounts.google.com', color: '#4285f4' },
    time: '6:45 PM',
    subjectAr: 'تنبيه أمني: تسجيل دخول جديد', subjectEn: 'Security alert: new sign-in',
    service: 'Google', serviceIcon: '', brandColor: '#4285f4',
    titleAr: 'تنبيه أمني: تسجيل دخول جديد', titleEn: 'Security alert: new sign-in',
    bodyAr: 'تم تسجيل الدخول إلى حسابك من جهاز Windows جديد. إن كنت أنت، فلا حاجة لأي إجراء.',
    bodyEn: 'Your account was just signed in to on a new Windows device. If this was you, no action is needed.',
    open: { href: 'https://myaccount.google.com/notifications' }, openAr: 'مراجعة النشاط', openEn: 'Review activity',
    flags: [
      { ar: 'النطاق حقيقي: accounts.google.com.', en: 'Real domain: accounts.google.com.' },
      { ar: 'الزر يقود إلى myaccount.google.com الحقيقي.', en: 'The button goes to the real myaccount.google.com.' },
      { ar: 'إعلامي، لا يطلب كلمة المرور ولا يهدّد.', en: 'Informational — no password request, no threats.' },
    ],
    whyAr: 'تنبيه حقيقي من Google: النطاق صحيح والرابط رسمي ولا يطلب بيانات.',
    whyEn: 'A genuine Google alert: correct domain, official link, and it asks for nothing.',
  },
  {
    id: 5, template: 'delivery', phish: true,
    from: { name: 'Qatar Post', email: 'info@qpost-delivery-fee.net', color: '#7c3aed' },
    time: '11:30 AM',
    subjectAr: 'طردك محتجز — مطلوب رسوم تخليص', subjectEn: 'Parcel on hold — clearance fee required',
    courier: 'Qatar Post', parcelId: 'QP-88213-QA',
    bodyAr: 'طردك محتجز في المستودع بانتظار رسوم تخليص 5 ر.ق. ادفع الآن لتحديد موعد التسليم.',
    bodyEn: 'Your parcel is held at the warehouse pending a 5 QAR clearance fee. Pay now to schedule delivery.',
    open: { href: 'https://qatarpost.tracking-fee-pay.com/pay' }, openAr: 'ادفع الرسوم وتتبّع', openEn: 'Pay fee & track',
    flags: [
      { ar: 'نطاق غريب: qpost-delivery-fee.net (البريد الرسمي qatarpost.qa).', en: 'Strange domain: qpost-delivery-fee.net (the official one is qatarpost.qa).' },
      { ar: 'رابط الدفع يقود إلى tracking-fee-pay.com — موقع دفع مزيف.', en: 'The pay link goes to tracking-fee-pay.com — a fake payment site.' },
      { ar: 'طلب دفع رسوم صغيرة مفاجئة = خدعة شائعة لسرقة البطاقة.', en: 'Asking for a small surprise fee = a common trick to steal your card.' },
    ],
    whyAr: 'احتيال توصيل: نطاق مزيف ورابط دفع مزيف لسرقة بيانات بطاقتك مقابل «رسوم» وهمية.',
    whyEn: 'A delivery scam: fake domain and fake payment link to steal your card details for a bogus “fee”.',
  },
  {
    id: 6, template: 'delivery', phish: false,
    from: { name: 'Aramex', email: 'notifications@aramex.com', color: '#e11d48' },
    time: '8:15 AM',
    subjectAr: 'شحنتك في طريقها إليك اليوم', subjectEn: 'Your shipment is out for delivery',
    courier: 'Aramex', parcelId: '4471192083',
    bodyAr: 'شحنتك في طريقها إليك اليوم بين 2م و6م. لا حاجة لأي إجراء أو دفع.',
    bodyEn: 'Your shipment is out for delivery today between 2 PM and 6 PM. No action or payment needed.',
    open: { href: 'https://www.aramex.com/track/shipments' }, openAr: 'تتبّع الشحنة', openEn: 'Track shipment',
    flags: [
      { ar: 'النطاق الرسمي الحقيقي: aramex.com.', en: 'The real official domain: aramex.com.' },
      { ar: 'رابط التتبّع يقود إلى www.aramex.com الحقيقي.', en: 'The track link goes to the real www.aramex.com.' },
      { ar: 'لا يطلب دفعاً ولا بيانات — مجرد إشعار.', en: 'No payment or data requested — just a notification.' },
    ],
    whyAr: 'إشعار توصيل حقيقي: النطاق صحيح، رابط التتبّع رسمي، ولا طلب دفع.',
    whyEn: 'A genuine delivery notice: correct domain, official tracking link, and no payment request.',
  },
  {
    id: 7, template: 'prize', phish: true,
    from: { name: 'LuLu Rewards', email: 'win@lulu-giftcard-prize.info', color: '#16a34a' },
    time: '3:03 PM',
    subjectAr: '🎉 ربحت بطاقة هدايا LuLu بقيمة 1000 ر.ق!', subjectEn: '🎉 You won a 1000 QAR LuLu gift card!',
    bodyAr: '🎉 مبروك! تم اختيارك لربح بطاقة هدايا LuLu بقيمة 1000 ر.ق. اطلب جائزتك خلال ساعة قبل انتهائها.',
    bodyEn: '🎉 Congratulations! You were selected to win a 1000 QAR LuLu gift card. Claim your prize within 1 hour before it expires.',
    open: { href: 'https://bit.ly/lulu-win-qa' }, openAr: 'اطلب جائزتك', openEn: 'Claim your prize',
    flags: [
      { ar: 'جائزة لم تشترك بها + نطاق غريب lulu-giftcard-prize.info.', en: "A prize you never entered + a strange domain lulu-giftcard-prize.info." },
      { ar: 'الرابط مختصر (bit.ly) يخفي الوجهة الحقيقية.', en: 'The link is shortened (bit.ly), hiding the real destination.' },
      { ar: 'عجلة مصطنعة («خلال ساعة قبل انتهائها»).', en: 'Artificial urgency (“within 1 hour before it expires”).' },
    ],
    whyAr: 'احتيال جوائز: جائزة وهمية ورابط مختصر وعجلة — لا تضغط أبداً.',
    whyEn: 'A prize scam: fake prize, shortened link, and urgency — never click.',
  },
]

const RULES = [
  { icon: '🖱️', ar: 'مرّر فوق أي رابط أو زر (بدون ضغط) لترى وجهته الحقيقية في شريط الحالة أسفل النافذة.', en: 'Hover over any link or button (without clicking) to see its real destination in the status bar at the bottom.' },
  { icon: '🔗', ar: 'طابِق النطاق: زر مستند Google يجب أن يقود إلى docs.google.com، لا إلى نطاق يشبهه.', en: 'Match the domain: a Google Docs button must go to docs.google.com, not a look-alike.' },
  { icon: '✉️', ar: 'افحص عنوان المرسل كاملاً — الاسم المعروض قد يكون مزيفاً.', en: 'Check the full sender address — the display name can be faked.' },
  { icon: '⏰', ar: 'العجلة والتهديد وطلب المال أو البطاقة = أعلام حمراء.', en: 'Urgency, threats, and requests for money or your card = red flags.' },
  { icon: '🔤', ar: 'احذر النطاقات المتشابهة: qpost-delivery-fee.net ، apple-support-id.com ، secure-share.web.app.', en: 'Beware look-alike domains: qpost-delivery-fee.net, apple-support-id.com, secure-share.web.app.' },
]

// the multicolour Gmail “M” envelope logo
const GmailLogo = () => (
  <svg width="30" height="23" viewBox="0 0 52 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="#4285F4" d="M3.64 40h7.27V22.36L.55 14.18v22.18C.55 38.36 1.91 40 3.64 40z" />
    <path fill="#34A853" d="M41.09 40h7.27c1.82 0 3.09-1.45 3.09-3.18V14.18L41.09 22.36V40z" />
    <path fill="#FBBC04" d="M41.09 7.09v15.27l10.36-8.18V8.73c0-6.09-6.91-9.55-11.73-5.82z" />
    <path fill="#EA4335" d="M10.91 22.36V6L26 17.27 41.09 6v16.36L26 33.64z" />
    <path fill="#C5221F" d="M.55 8.73v5.45l10.36 8.18V6L6.27 2.91C1.45-.82.55 2.64.55 8.73z" />
  </svg>
)

export default function PagePhishing() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const ar = lang === 'ar'

  const [openId, setOpenId]       = useState(null)     // which email is open (null = inbox list)
  const [hover, setHover]         = useState(null)      // browser status-bar text
  const [inspected, setInspected] = useState({})       // id -> hovered-at-least-once
  const [answers, setAnswers]     = useState({})        // id -> { choice, correct }
  const [showResults, setShow]    = useState(false)

  const m = openId != null ? MSGS.find(x => x.id === openId) : null
  const answeredCount = Object.keys(answers).length
  const score = Object.values(answers).filter(a => a.correct).length
  const unreadCount = MSGS.length - answeredCount

  const onLink = href  => { setHover('🔗 ' + href); if (openId != null) setInspected(s => ({ ...s, [openId]: true })) }
  const onFrom = email => { setHover('✉️ ' + email); if (openId != null) setInspected(s => ({ ...s, [openId]: true })) }
  const clearHover = () => setHover(null)

  const openEmail = id => { setOpenId(id); setHover(null) }
  const backToInbox = () => { setOpenId(null); setHover(null) }

  const decide = isPhish => {
    if (answers[openId]) return
    setAnswers(a => ({ ...a, [openId]: { choice: isPhish, correct: isPhish === m.phish } }))
  }
  const goNext = () => {
    const remaining = MSGS.filter(x => !answers[x.id])
    if (remaining.length === 0) { setShow(true); return }
    openEmail(remaining[0].id)
  }
  const restart = () => { setOpenId(null); setHover(null); setInspected({}); setAnswers({}); setShow(false) }

  const snippet = (mm) => mm.template === 'gdocs' ? (ar ? mm.msgAr : mm.msgEn) : (ar ? mm.bodyAr : mm.bodyEn)
  const initialOf = (mm) => mm.from.name.trim()[0]

  // ── shared reading-view bits ──────────────────────────────────────────────────
  const Avatar = ({ mm, size = 40 }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', background: mm.from.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.42, flexShrink: 0 }}>{initialOf(mm)}</div>
  )
  const OpenBtn = ({ label }) => (
    <button onMouseEnter={() => onLink(m.open.href)} onMouseLeave={clearHover} onFocus={() => onLink(m.open.href)} onClick={e => e.preventDefault()}
      style={{ background: '#1a73e8', color: 'white', border: 'none', borderRadius: 22, padding: '9px 26px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
      {label}
    </button>
  )
  const InlineLink = ({ href, children }) => (
    <a href={href} onClick={e => e.preventDefault()} onMouseEnter={() => onLink(href)} onMouseLeave={clearHover}
      style={{ color: '#1a73e8', textDecoration: 'none', cursor: 'pointer' }}>{children}</a>
  )

  // ── email body per template ──────────────────────────────────────────────────
  const Body = () => {
    if (m.template === 'gdocs') return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '20px 22px' }}>
        <div style={{ fontSize: 24, color: '#202124', marginBottom: 16 }}>{m.from.name} {ar ? 'شارك مستنداً' : 'shared a document'}</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#4285f4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{initialOf(m)}</div>
          <div style={{ fontSize: 14, color: '#3c4043', lineHeight: 1.6 }} dir={ar ? 'rtl' : 'ltr'}>
            {m.from.name} (<span dir="ltr">{m.from.email}</span>) {ar ? 'دعاك إلى ' : 'has invited you to '}<b>{ar ? 'تعديل' : 'edit'}</b>{ar ? ' المستند التالي:' : ' the following document:'}
          </div>
        </div>
        <div style={{ fontSize: 14, color: '#5f6368', marginBottom: 18, paddingInlineStart: 46 }} dir={ar ? 'rtl' : 'ltr'}>{ar ? m.msgAr : m.msgEn}</div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ color: '#4285f4' }}>📄</span>
            <span style={{ fontSize: 14, color: '#202124', flex: 1 }}>{m.docTitle}</span>
            <Star size={16} color="#9aa0a6" />
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 58, height: 58, borderRadius: 8, background: '#4285f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 26 }}>≣</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13, color: '#5f6368' }}><User size={14} /> {m.from.name} {ar ? 'هو المالك' : 'is the owner'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 13, color: '#5f6368' }}><History size={14} /> {ar ? `آخر تعديل بواسطة ${m.from.name} قبل ساعة` : `Last edited by ${m.from.name} 1 hour ago`}</div>
        </div>
        <OpenBtn label={ar ? 'فتح' : 'Open'} />
        <div style={{ fontSize: 12, color: '#5f6368', marginTop: 20 }} dir={ar ? 'rtl' : 'ltr'}>
          {ar ? 'إن لم ترغب في استلام ملفات من هذا الشخص، ' : "If you don't want to receive files from this person, "}
          <InlineLink href="https://drive.google.com/settings/block">{ar ? 'احظر المُرسِل' : 'block the sender'}</InlineLink>
          {ar ? ' من Drive' : ' from Drive'}
        </div>
      </div>
    )

    if (m.template === 'security') return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '22px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ width: 30, height: 30, borderRadius: 7, background: m.brandColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{m.service[0]}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#202124' }}>{m.service}</span>
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, color: '#202124', marginBottom: 10 }} dir={ar ? 'rtl' : 'ltr'}>{ar ? m.titleAr : m.titleEn}</div>
        <div style={{ fontSize: 14, color: '#5f6368', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 20px' }} dir={ar ? 'rtl' : 'ltr'}>{ar ? m.bodyAr : m.bodyEn}</div>
        <OpenBtn label={ar ? m.openAr : m.openEn} />
      </div>
    )

    if (m.template === 'delivery') return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 26 }}>📦</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#202124' }}>{m.courier}</div>
            <div style={{ fontSize: 12, color: '#9aa0a6', fontFamily: 'monospace' }} dir="ltr">#{m.parcelId}</div>
          </div>
        </div>
        <div style={{ fontSize: 14, color: '#3c4043', lineHeight: 1.7, marginBottom: 18 }} dir={ar ? 'rtl' : 'ltr'}>{ar ? m.bodyAr : m.bodyEn}</div>
        <OpenBtn label={ar ? m.openAr : m.openEn} />
      </div>
    )

    // prize
    return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '22px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎁</div>
        <div style={{ fontSize: 15, color: '#3c4043', lineHeight: 1.7, maxWidth: 430, margin: '0 auto 20px' }} dir={ar ? 'rtl' : 'ltr'}>{ar ? m.bodyAr : m.bodyEn}</div>
        <OpenBtn label={ar ? m.openAr : m.openEn} />
      </div>
    )
  }

  // ── results screen ───────────────────────────────────────────────────────────
  if (showResults) {
    const pct = Math.round((score / MSGS.length) * 100)
    const stars = score >= MSGS.length ? 3 : score >= MSGS.length - 2 ? 2 : 1
    return (
      <div dir={ar ? 'rtl' : 'ltr'} className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 text-center shadow-sm">
          <div className="text-5xl mb-2">{stars === 3 ? '🏆' : stars === 2 ? '🎉' : '💪'}</div>
          <h1 className="text-2xl font-black text-slate-800">{ar ? 'انتهى التدريب!' : 'Practice complete!'}</h1>
          <p className="text-slate-500 text-sm mt-1">{ar ? `أصبت في ${score} من ${MSGS.length} رسائل` : `You got ${score} of ${MSGS.length} emails right`}</p>
          <div className="text-3xl mt-3 tracking-widest">{'★'.repeat(stars)}<span className="text-slate-200">{'★'.repeat(3 - stars)}</span></div>
          <div className="mt-4 h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? '#8DC63F' : pct >= 60 ? '#FCAD0F' : '#f87171' }} /></div>
        </div>
        <div className="mt-5 bg-slate-50 border-2 border-slate-200 rounded-2xl p-5">
          <h2 className="font-black text-slate-800 text-sm mb-3">{ar ? '🎓 قواعد كشف التصيّد' : '🎓 Your phishing-detection rules'}</h2>
          <div className="space-y-2">
            {RULES.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5"><span className="text-base flex-shrink-0">{r.icon}</span><p className="text-sm text-slate-700 leading-relaxed">{ar ? r.ar : r.en}</p></div>
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={restart} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: '#0E1F39' }}>{ar ? '↻ العب مرة أخرى' : '↻ Play again'}</button>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 border-2 border-slate-200 flex items-center gap-1.5"><ChevronLeft size={15} />{ar ? 'الرئيسية' : 'Home'}</button>
        </div>
      </div>
    )
  }

  // ── sidebar item ──────────────────────────────────────────────────────────────
  const SideItem = ({ icon, label, count, active }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '0 12px 0 22px', height: 34,
      borderRadius: '0 20px 20px 0', cursor: 'pointer', color: active ? '#001d35' : '#444746',
      background: active ? '#d3e3fd' : 'transparent', fontWeight: active ? 700 : 500, fontSize: 13.5,
    }} className="gm-sideitem">
      <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span className="gm-label" style={{ flex: 1, whiteSpace: 'nowrap' }}>{label}</span>
      {count > 0 && <span className="gm-label" style={{ fontSize: 12, fontWeight: 700, color: active ? '#001d35' : '#444746' }}>{count}</span>}
    </div>
  )

  const Tab = ({ icon, label, active }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9, padding: '0 22px', height: 46, minWidth: 120,
      cursor: 'pointer', color: active ? '#0b57d0' : '#5f6368', fontWeight: active ? 700 : 500, fontSize: 13.5,
      borderBottom: active ? '3px solid #0b57d0' : '3px solid transparent',
    }}>
      <span style={{ display: 'flex' }}>{icon}</span><span className="gm-tablabel">{label}</span>
    </div>
  )

  const answered = m ? answers[m.id] : null
  const canDecide = m ? !!inspected[m.id] : false

  // ── main Gmail window ─────────────────────────────────────────────────────────
  return (
    <div dir={ar ? 'rtl' : 'ltr'} style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 14px', fontFamily: 'sans-serif' }}>
      <style>{`
        .gm-sideitem:hover{ background:#eef0f2 !important }
        .gm-row:hover{ box-shadow: inset 0 0 0 9999px rgba(0,0,0,0.015); z-index:1 }
        .gm-iconbtn{ width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#5f6368;cursor:pointer }
        .gm-iconbtn:hover{ background:#eceff1 }
        @media (max-width: 720px){
          .gm-side{ width:60px !important; padding-inline:0 !important }
          .gm-label{ display:none !important }
          .gm-compose-text{ display:none !important }
          .gm-compose{ width:48px !important; padding:0 !important; justify-content:center !important }
          .gm-sideitem{ padding:0 !important; justify-content:center !important }
          .gm-search{ display:none !important }
          .gm-tablabel{ display:none !important }
          .gm-snippet{ display:none !important }
        }
      `}</style>

      {/* Lesson header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ background: '#fef3c7', color: '#92610a', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🎣 {ar ? 'اختبار عملي' : 'Hands-on quiz'}</span>
        <button onClick={() => navigate('/')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '3px 10px', fontSize: 12, color: '#64748b', cursor: 'pointer' }}>{ar ? '← الرئيسية' : '← Home'}</button>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: '0 0 4px' }}>🎣 {ar ? 'اكتشف رسائل التصيّد' : 'Spot the Phishing'}</h1>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px' }}>
        {ar ? 'هذا صندوق بريدك في Gmail. افتح كل رسالة، مرّر فوق المُرسِل والأزرار والروابط لكشف وجهتها الحقيقية، ثم قرّر: تصيّد أم حقيقية؟'
            : 'This is your Gmail inbox. Open each email, hover the sender and the links/buttons to reveal where they really go, then decide: phishing or legit?'}
      </p>

      {/* progress + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 20, width: `${(answeredCount / MSGS.length) * 100}%`, background: '#8DC63F', transition: 'width .3s' }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>{ar ? `فُحصت ${answeredCount} / ${MSGS.length}` : `${answeredCount} / ${MSGS.length} reviewed`}</span>
        <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: '#0E1F39', color: '#FCAD0F', whiteSpace: 'nowrap' }}>{ar ? `النقاط: ${score}` : `Score: ${score}`}</span>
      </div>

      {/* ── the Gmail window ─────────────────────────────────────────────────── */}
      <div style={{ border: '1px solid #dadce0', borderRadius: 14, overflow: 'hidden', background: '#f6f8fc', boxShadow: '0 10px 30px rgba(0,0,0,0.10)' }}>

        {/* top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f6f8fc', borderBottom: '1px solid #e5e7eb' }}>
          <div className="gm-iconbtn"><Menu size={20} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingInlineEnd: 8 }}>
            <GmailLogo />
            <span style={{ fontSize: 20, color: '#5f6368', fontWeight: 400, letterSpacing: '-.5px' }}>Gmail</span>
          </div>
          <div className="gm-search" style={{ flex: 1, maxWidth: 640, display: 'flex', alignItems: 'center', gap: 12, background: '#eaf1fb', borderRadius: 24, padding: '9px 16px', margin: '0 8px' }}>
            <Search size={18} color="#5f6368" />
            <span style={{ fontSize: 14, color: '#5f6368' }} dir={ar ? 'rtl' : 'ltr'}>{ar ? 'ابحث في البريد' : 'Search mail'}</span>
          </div>
          <div style={{ flex: 1 }} className="gm-search-spacer" />
          <div className="gm-iconbtn"><Settings size={20} /></div>
          <div className="gm-iconbtn"><LayoutGrid size={20} /></div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0E1F39', color: '#FCAD0F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, marginInlineStart: 4 }}>{ar ? 'أ' : 'Y'}</div>
        </div>

        {/* body: sidebar + main */}
        <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 520 }}>

          {/* sidebar */}
          <div className="gm-side" style={{ width: 232, flexShrink: 0, padding: '8px 8px 8px 0', background: '#f6f8fc' }}>
            <button className="gm-compose" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 8px 12px 16px', padding: '0 24px 0 16px', height: 48, border: 'none', borderRadius: 16, background: '#c2e7ff', color: '#001d35', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Pencil size={18} /><span className="gm-compose-text">{ar ? 'إنشاء' : 'Compose'}</span>
            </button>
            <SideItem icon={<Inbox size={18} />} label={ar ? 'البريد الوارد' : 'Inbox'} count={unreadCount} active />
            <SideItem icon={<Star size={18} />} label={ar ? 'المميزة بنجمة' : 'Starred'} count={0} />
            <SideItem icon={<Clock size={18} />} label={ar ? 'المؤجلة' : 'Snoozed'} count={0} />
            <SideItem icon={<Send size={18} />} label={ar ? 'المُرسَلة' : 'Sent'} count={0} />
            <SideItem icon={<File size={18} />} label={ar ? 'المسودّات' : 'Drafts'} count={0} />
            <SideItem icon={<ChevronDown size={18} />} label={ar ? 'المزيد' : 'More'} count={0} />
          </div>

          {/* main pane */}
          <div style={{ flex: 1, minWidth: 0, background: 'white', borderRadius: '16px 16px 0 0', border: '1px solid #e5e7eb', borderBottom: 'none', display: 'flex', flexDirection: 'column' }}>

            {!m ? (
              /* ── INBOX LIST ── */
              <>
                {/* list toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderBottom: '1px solid #f1f3f4' }}>
                  <div className="gm-iconbtn" style={{ width: 34, height: 34 }}><input type="checkbox" readOnly style={{ width: 16, height: 16, accentColor: '#5f6368' }} /></div>
                  <div className="gm-iconbtn" style={{ width: 34, height: 34 }}><RotateCw size={18} /></div>
                  <div className="gm-iconbtn" style={{ width: 34, height: 34 }}><MoreVertical size={18} /></div>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 12, color: '#5f6368' }} dir="ltr">1–{MSGS.length} {ar ? 'من' : 'of'} {MSGS.length}</span>
                </div>

                {/* category tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f1f3f4' }}>
                  <Tab icon={<Inbox size={18} />} label={ar ? 'الرئيسية' : 'Primary'} active />
                  <Tab icon={<Tag size={18} />} label={ar ? 'العروض' : 'Promotions'} />
                  <Tab icon={<Users size={18} />} label={ar ? 'اجتماعي' : 'Social'} />
                </div>

                {/* rows */}
                <div>
                  {MSGS.map(mm => {
                    const a = answers[mm.id]
                    const unread = !a
                    return (
                      <div key={mm.id} className="gm-row" onClick={() => openEmail(mm.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 44, borderBottom: '1px solid #f1f3f4', cursor: 'pointer', background: unread ? 'white' : '#f8fafc', position: 'relative' }}>
                        <input type="checkbox" readOnly onClick={e => e.stopPropagation()} style={{ width: 15, height: 15, accentColor: '#5f6368', flexShrink: 0 }} />
                        <Star size={16} color="#dadce0" style={{ flexShrink: 0 }} />
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: mm.from.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{initialOf(mm)}</div>
                        <span style={{ width: 150, flexShrink: 0, fontSize: 13.5, color: '#202124', fontWeight: unread ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mm.from.name}</span>
                        <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ color: '#202124', fontWeight: unread ? 700 : 400 }}>{ar ? mm.subjectAr : mm.subjectEn}</span>
                          <span className="gm-snippet" style={{ color: '#5f6368', fontWeight: 400 }}>{'  -  '}{snippet(mm)}</span>
                        </div>
                        {a
                          ? <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: a.correct ? '#e6f4ea' : '#fce8e6', color: a.correct ? '#137333' : '#c5221f' }}>{a.correct ? (ar ? '✓ صحيح' : '✓ correct') : (ar ? '✗ خطأ' : '✗ wrong')}</span>
                          : <span style={{ flexShrink: 0, fontSize: 12, color: '#202124', fontWeight: 700 }}>{mm.time}</span>}
                      </div>
                    )
                  })}
                </div>

                {answeredCount === MSGS.length && (
                  <div style={{ margin: 14, background: '#e6f4ea', border: '1px solid #a8dab5', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }} dir={ar ? 'rtl' : 'ltr'}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#137333' }}>✅ {ar ? 'راجعت كل الرسائل!' : "You've reviewed every email!"}</span>
                    <button onClick={() => setShow(true)} style={{ background: '#0E1F39', color: 'white', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{ar ? 'شاهد نتيجتك ←' : 'See your results →'}</button>
                  </div>
                )}
              </>
            ) : (
              /* ── READING VIEW ── */
              <>
                {/* reading toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '6px 10px', borderBottom: '1px solid #f1f3f4' }}>
                  <div className="gm-iconbtn" onClick={backToInbox} title={ar ? 'رجوع' : 'Back'}>{ar ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}</div>
                  <div className="gm-iconbtn"><Archive size={19} /></div>
                  <div className="gm-iconbtn"><Trash2 size={19} /></div>
                  <div className="gm-iconbtn"><Mail size={19} /></div>
                  <div style={{ flex: 1 }} />
                  <div className="gm-iconbtn"><MoreVertical size={19} /></div>
                </div>

                <div style={{ padding: '16px 22px 4px', overflowY: 'auto' }}>
                  {/* subject + label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 500, color: '#202124', margin: 0 }} dir={ar ? 'rtl' : 'ltr'}>{ar ? m.subjectAr : m.subjectEn}</h2>
                    <span style={{ fontSize: 11, color: '#5f6368', background: '#f1f3f4', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>{ar ? 'الوارد' : 'Inbox'}</span>
                  </div>

                  {/* sender row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                    <Avatar mm={m} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#202124' }}>{m.from.name}</span>
                        <span onMouseEnter={() => onFrom(m.from.email)} onMouseLeave={clearHover}
                          style={{ fontSize: 13, color: '#5f6368', cursor: 'help' }} dir="ltr">&lt;{m.from.email}&gt;</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#5f6368', marginTop: 2 }}>{ar ? 'إليّ ▾' : 'to me ▾'}</div>
                    </div>
                    <span style={{ fontSize: 12, color: '#5f6368', flexShrink: 0 }}>{m.time}</span>
                    <CornerUpLeft size={16} color="#5f6368" style={{ flexShrink: 0, marginTop: 2 }} />
                  </div>

                  {/* body */}
                  <div style={{ paddingTop: 8 }}><Body /></div>

                  {/* decision / feedback */}
                  <div style={{ margin: '18px 0 20px' }}>
                    {!answered ? (
                      <>
                        {!canDecide && <p style={{ textAlign: 'center', fontSize: 12, color: '#b45309', fontWeight: 600, marginBottom: 10 }}>{ar ? '🔍 افحص أولاً: مرّر فوق زر «فتح» وعنوان المُرسِل (بدون ضغط).' : '🔍 Inspect first: hover the “Open” button and the sender address (without clicking).'}</p>}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <button onClick={() => decide(true)} disabled={!canDecide} style={{ padding: '12px', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 14, color: 'white', background: '#dc2626', cursor: canDecide ? 'pointer' : 'not-allowed', opacity: canDecide ? 1 : 0.4 }}>🎣 {ar ? 'تصيّد' : 'Phishing'}</button>
                          <button onClick={() => decide(false)} disabled={!canDecide} style={{ padding: '12px', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 14, color: 'white', background: '#16a34a', cursor: canDecide ? 'pointer' : 'not-allowed', opacity: canDecide ? 1 : 0.4 }}>✅ {ar ? 'حقيقية' : 'Legit'}</button>
                        </div>
                      </>
                    ) : (
                      <div style={{ borderRadius: 12, border: `2px solid ${answered.correct ? '#86efac' : '#fca5a5'}`, background: answered.correct ? '#f0fdf4' : '#fef2f2', padding: 16 }} dir={ar ? 'rtl' : 'ltr'}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: answered.correct ? '#166534' : '#991b1b' }}>
                          {answered.correct ? (ar ? '✅ صحيح!' : '✅ Correct!') : (ar ? '❌ خطأ' : '❌ Wrong')} — {m.phish ? (ar ? 'هذه رسالة تصيّد' : 'this was phishing') : (ar ? 'هذه رسالة حقيقية' : 'this was legit')}
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {m.flags.map((fl, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                              <span style={{ color: m.phish ? '#ef4444' : '#16a34a', flexShrink: 0 }}>{m.phish ? '🚩' : '✓'}</span>
                              <span style={{ color: m.phish ? '#b91c1c' : '#15803d' }}>{ar ? fl.ar : fl.en}</span>
                            </div>
                          ))}
                        </div>
                        <p style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.7, color: answered.correct ? '#15803d' : '#b91c1c' }}>{ar ? m.whyAr : m.whyEn}</p>
                        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                          <button onClick={goNext} style={{ flex: 1, minWidth: 160, padding: '10px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13, color: 'white', background: '#0E1F39', cursor: 'pointer' }}>
                            {answeredCount >= MSGS.length ? (ar ? 'شاهد نتيجتك ←' : 'See your results →') : (ar ? 'الرسالة التالية ←' : 'Next email →')}
                          </button>
                          <button onClick={backToInbox} style={{ padding: '10px 18px', borderRadius: 10, border: '2px solid #e2e8f0', fontWeight: 700, fontSize: 13, color: '#475569', background: 'white', cursor: 'pointer' }}>{ar ? 'صندوق الوارد' : 'Inbox'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* browser-style status bar (bottom of the window) */}
        <div style={{ borderTop: '1px solid #e5e7eb', background: '#f1f3f4', padding: '7px 14px', minHeight: 32, display: 'flex', alignItems: 'center' }} dir="ltr">
          {hover
            ? <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hover}</span>
            : <span style={{ fontSize: 12, color: '#94a3b8' }} dir={ar ? 'rtl' : 'ltr'}>{m ? (ar ? '🖱️ مرّر فوق المُرسِل أو الأزرار أو الروابط لفحصها…' : '🖱️ Hover the sender, buttons, or links to inspect…') : (ar ? '📥 افتح رسالة من القائمة لفحصها' : '📥 Open an email from the list to inspect it')}</span>}
        </div>
      </div>

      {/* explanation — collapsed by default, under the practical part */}
      <Explanation>
        <p className="text-slate-500 text-sm leading-relaxed">{ar ? 'افحص كل رسالة كما في بريدك الحقيقي: مرّر فوق المُرسِل والأزرار والروابط لكشف وجهتها الحقيقية، ثم قرّر: تصيّد أم رسالة حقيقية؟ الاسم المعروض والشعار يسهل تزويرهما — النطاق الحقيقي في العنوان والرابط هو ما يكشف الحقيقة.' : 'Inspect each email like in your real inbox: hover over the sender, buttons, and links to reveal their true destination, then decide: phishing or legit? A display name and logo are easy to fake — the real domain in the address and the link is what gives it away.'}</p>
      </Explanation>

      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1d4ed8', background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 10, padding: '10px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          <ChevronLeft size={15} />{ar ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
