import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Plus, Trash2, ShieldCheck, ShieldX, ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

// ── Device definitions (x/y = % of diagram container) ─────────────────────────
const DEVICES = {
  ext1: { id:'ext1', nameAr:'مهاجم',         nameEn:'Attacker',      emoji:'🕵️', ip:'185.77.23.10',  zone:'ext', x:9,  y:22 },
  ext2: { id:'ext2', nameAr:'مستخدم خارجي',  nameEn:'External User', emoji:'🌐', ip:'91.108.4.15',   zone:'ext', x:9,  y:50 },
  ext3: { id:'ext3', nameAr:'جهاز مجهول',    nameEn:'Unknown PC',    emoji:'❓', ip:'203.55.111.44', zone:'ext', x:9,  y:78 },
  int1: { id:'int1', nameAr:'PC-1',           nameEn:'PC-1',          emoji:'💻', ip:'10.0.0.1',      zone:'int', x:91, y:22 },
  int2: { id:'int2', nameAr:'PC-2',           nameEn:'PC-2',          emoji:'💻', ip:'10.0.0.2',      zone:'int', x:91, y:50 },
  int3: { id:'int3', nameAr:'خادم',           nameEn:'Server',        emoji:'🖥️', ip:'10.0.0.100',    zone:'int', x:91, y:78 },
}
const FW = { x:50, y:50 }

const EXT = Object.values(DEVICES).filter(d => d.zone === 'ext')
const INT = Object.values(DEVICES).filter(d => d.zone === 'int')

// Lines: each external device → firewall, each internal device → firewall
const LINES = [
  ...EXT.map(d => ({ from: d.id, to: 'fw' })),
  ...INT.map(d => ({ from: 'fw', to: d.id })),
]

// ── Firewall check ─────────────────────────────────────────────────────────────
function checkFirewall(message, srcIp, direction, rules) {
  const msg = message.toLowerCase()
  for (const rule of rules) {
    if (rule.direction !== 'both' && rule.direction !== direction) continue
    if (rule.match === 'all')
      return { result: rule.type, ruleLabel: rule.type === 'block' ? '🚫 حظر الكل' : '✅ السماح للكل' }
    if (rule.match === 'ip' && rule.ip && srcIp === rule.ip)
      return { result: rule.type, ruleLabel: `${rule.type === 'block' ? '🚫' : '✅'} IP: ${rule.ip}` }
    if (rule.match === 'keyword' && rule.keyword && msg.includes(rule.keyword.toLowerCase()))
      return { result: rule.type, ruleLabel: `${rule.type === 'block' ? '🚫' : '✅'} "${rule.keyword}"` }
  }
  return { result: 'allowed', ruleLabel: '✅ القاعدة الافتراضية: مسموح' }
}

const DEFAULT_RULES = [
  { id:1, type:'block', match:'ip',      ip:'185.77.23.10', keyword:'',     direction:'inbound' },
  { id:2, type:'block', match:'keyword', ip:'',             keyword:'hack', direction:'both' },
  { id:3, type:'allow', match:'keyword', ip:'',             keyword:'email',direction:'both' },
]
let nextId = 10

// ── Component ──────────────────────────────────────────────────────────────────
export default function PageFirewall() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [rules, setRules]   = useState(DEFAULT_RULES)
  const [newRule, setNewRule] = useState({ type:'block', match:'keyword', keyword:'', ip:'', direction:'both' })
  const [src, setSrc]       = useState('ext1')
  const [dst, setDst]       = useState('int1')
  const [msg, setMsg]       = useState('')
  const [step, setStep]     = useState(0)  // 0=idle 1=→fw 2=checking 3=result 4=clearing
  const [animData, setAnimData] = useState(null)
  const [log, setLog]       = useState([])

  const srcDev = DEVICES[src]
  const dstDev = DEVICES[dst]
  const direction = srcDev?.zone === 'ext' ? 'inbound' : 'outbound'

  // When source changes, auto-pick valid destination from opposite zone
  const handleSrcChange = (id) => {
    setSrc(id)
    const zone = DEVICES[id]?.zone
    const oppZone = zone === 'ext' ? 'int' : 'ext'
    if (DEVICES[dst]?.zone === zone) {
      setDst(Object.values(DEVICES).find(d => d.zone === oppZone)?.id ?? dst)
    }
  }

  const simulate = useCallback(() => {
    if (step > 0 || !msg.trim()) return
    const { result, ruleLabel } = checkFirewall(msg, srcDev.ip, direction, rules)
    const data = {
      message: msg, direction, result, ruleLabel,
      src, dst, srcIp: srcDev.ip, dstIp: dstDev?.ip,
      time: new Date().toLocaleTimeString('ar-SA'),
    }
    setAnimData(data)
    setStep(1)
    setTimeout(() => setStep(2), 1300)
    setTimeout(() => setStep(3), 2400)
    setTimeout(() => {
      setStep(0)
      setLog(prev => [data, ...prev.slice(0, 19)])
    }, 4200)
  }, [step, msg, srcDev, dstDev, direction, rules, src, dst])

  // Packet position per step
  const pktSrc = DEVICES[animData?.src]
  const pktDst = DEVICES[animData?.dst]
  const pktPos = (() => {
    if (!pktSrc) return FW
    if (step === 0) return { x: pktSrc.x, y: pktSrc.y }
    if (step === 1 || step === 2) return FW
    if (step === 3 && animData?.result === 'allowed') return { x: pktDst?.x ?? FW.x, y: pktDst?.y ?? FW.y }
    return FW  // blocked: stays at firewall
  })()
  const pktVisible = step >= 1 && step <= 3

  // Active line detection for highlighting
  const isActiveLine = (fromId, toId) => {
    if (step === 1) {
      // packet going from src → fw
      return (fromId === animData?.src && toId === 'fw') || (fromId === 'fw' && toId === animData?.src)
    }
    if (step === 3 && animData?.result === 'allowed') {
      // packet going from fw → dst
      return (fromId === 'fw' && toId === animData?.dst) || (fromId === animData?.dst && toId === 'fw')
    }
    return false
  }

  const addRule = () => {
    if (newRule.match === 'keyword' && !newRule.keyword.trim()) return
    if (newRule.match === 'ip' && !newRule.ip.trim()) return
    setRules(r => [...r, { ...newRule, id: nextId++, keyword: newRule.keyword.trim(), ip: newRule.ip.trim() }])
    setNewRule(r => ({ ...r, keyword: '', ip: '' }))
  }
  const removeRule = id => setRules(r => r.filter(x => x.id !== id))

  const T = {
    ar: {
      badge: 'مختبر', title: 'محاكاة الجدار الناري',
      subtitle: 'شاهد كيف يتحكم الجدار الناري في الاتصالات بين الشبكة الداخلية والإنترنت',
      concept: 'الجدار الناري هو الحارس على بوابة الشبكة — كل رسالة داخلة أو خارجة يجب أن تمر عبره. يفحصها ويقرر: هل تعبر أم تُحجب؟',
      extZone: 'الإنترنت (خارج)', intZone: 'شبكة الشركة (داخل)', fwLabel: 'الجدار الناري',
      checking: '🔍 يفحص...',
      srcLabel: 'المُرسِل:', dstLabel: 'المستقبل:',
      msgLabel: 'محتوى الرسالة:', msgPh: 'اكتب رسالة...',
      sendBtn: 'إرسال عبر الجدار الناري',
      rulesTitle: 'قواعد الجدار الناري', addRule: 'إضافة قاعدة',
      logTitle: 'سجل الفحص', noLog: 'لم تُرسل أي رسائل بعد',
      block: 'حظر', allow: 'سماح',
      matchKw: 'كلمة مفتاح', matchIp: 'عنوان IP', matchAll: 'الكل',
      dirBoth: 'كلا الاتجاهين', dirIn: 'داخل الشركة', dirOut: 'خارج الشركة',
      kwPh: 'كلمة...', ipPh: 'مثال: 185.77.23.10',
      allowedBanner: 'مسموح بالمرور ✅', blockedBanner: 'محجوب 🚫',
      dirInLabel: '← داخل', dirOutLabel: 'خارج →',
      educNote: '📌 كل رسالة — سواء جاءت من الخارج أو أُرسلت من الداخل — يجب أن تمر عبر الجدار الناري. لا يوجد اتصال مباشر بين الأجهزة.',
      back: '← الرئيسية',
    },
    en: {
      badge: 'Lab', title: 'Firewall Simulation',
      subtitle: 'See how a firewall controls communication between the internal network and the internet',
      concept: 'The firewall is the gatekeeper of the network — every inbound and outbound message must pass through it. It inspects each one and decides: allow or block?',
      extZone: 'Internet (Outside)', intZone: 'Company Network (Inside)', fwLabel: 'Firewall',
      checking: '🔍 Checking...',
      srcLabel: 'Sender:', dstLabel: 'Receiver:',
      msgLabel: 'Message content:', msgPh: 'Type a message...',
      sendBtn: 'Send through Firewall',
      rulesTitle: 'Firewall Rules', addRule: 'Add Rule',
      logTitle: 'Inspection Log', noLog: 'No messages sent yet',
      block: 'Block', allow: 'Allow',
      matchKw: 'Keyword', matchIp: 'IP Address', matchAll: 'All traffic',
      dirBoth: 'Both directions', dirIn: 'Inbound', dirOut: 'Outbound',
      kwPh: 'keyword...', ipPh: 'e.g. 185.77.23.10',
      allowedBanner: 'Allowed through ✅', blockedBanner: 'Blocked 🚫',
      dirInLabel: '→ Inbound', dirOutLabel: '← Outbound',
      educNote: '📌 Every message — whether coming from outside or sent from inside — must pass through the firewall. There is no direct connection between devices.',
      back: '← Home',
    },
  }
  const t = T[lang]

  // Destination options = opposite zone from source
  const dstOptions = Object.values(DEVICES).filter(d => d.zone !== srcDev?.zone)

  return (
    <div className="min-h-screen bg-slate-50" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-5">
          <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{t.badge}</span>
          <h1 className="text-3xl font-black text-slate-800 mt-2 mb-1">{t.title}</h1>
        </div>

        {/* ── Simulation card ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-5">

          {/* Network diagram */}
          <div className="relative w-full h-72 rounded-xl overflow-hidden mb-5" dir="ltr">

            {/* Zone backgrounds */}
            <div className="absolute inset-0 flex">
              <div className="w-[38%] bg-red-50 border-r border-red-200 flex flex-col items-center justify-start pt-3 gap-0.5">
                <span className="text-lg">🌐</span>
                <span className="text-xs font-bold text-red-600 text-center leading-tight px-1">{t.extZone}</span>
              </div>
              <div className="w-[24%] bg-amber-50 border-x border-amber-200 flex flex-col items-center justify-start pt-3 gap-0.5">
                <span className="text-xs font-bold text-amber-700 text-center leading-tight">{t.fwLabel}</span>
              </div>
              <div className="w-[38%] bg-blue-50 border-l border-blue-200 flex flex-col items-center justify-start pt-3 gap-0.5">
                <span className="text-lg">🏢</span>
                <span className="text-xs font-bold text-blue-600 text-center leading-tight px-1">{t.intZone}</span>
              </div>
            </div>

            {/* SVG connection lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {LINES.map((line, i) => {
                const a = line.from === 'fw' ? FW : DEVICES[line.from]
                const b = line.to   === 'fw' ? FW : DEVICES[line.to]
                const active = isActiveLine(line.from, line.to)
                return (
                  <line key={i}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={active ? '#f59e0b' : '#cbd5e1'}
                    strokeWidth={active ? '1.4' : '0.7'}
                    strokeDasharray={active ? '3 2' : '2 2'}
                    opacity={active ? 1 : 0.7}
                  />
                )
              })}
            </svg>

            {/* Firewall node */}
            <div style={{ position:'absolute', left:`${FW.x}%`, top:`${FW.y}%`, transform:'translate(-50%,-50%)' }}>
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 shadow-md transition-all duration-500
                ${step === 2 ? 'bg-amber-100 border-amber-400 ring-4 ring-amber-200 scale-110' :
                  step === 3 && animData?.result === 'allowed' ? 'bg-emerald-100 border-emerald-400 scale-105' :
                  step === 3 ? 'bg-red-100 border-red-400 scale-105' :
                  'bg-white border-amber-300'}`}>
                <span className="text-xl">
                  {step === 2 ? '🔍' : step === 3 && animData?.result !== 'allowed' ? '🛑' : step === 3 ? '✅' : '🔥'}
                </span>
                {step === 2 && (
                  <span className="text-xs text-amber-700 font-bold animate-pulse leading-none mt-0.5">{t.checking}</span>
                )}
              </div>
            </div>

            {/* Device nodes */}
            {Object.values(DEVICES).map(dev => {
              const isSrc = src === dev.id && step === 0
              const isDst = dst === dev.id && step === 0
              const isAnimSrc = animData?.src === dev.id && step > 0
              const isAnimDst = animData?.dst === dev.id && step === 3 && animData?.result === 'allowed'
              return (
                <div key={dev.id}
                  style={{ position:'absolute', left:`${dev.x}%`, top:`${dev.y}%`, transform:'translate(-50%,-50%)' }}>
                  <button
                    onClick={() => {
                      if (step > 0) return
                      if (dev.zone === srcDev?.zone || dev.id === src) {
                        handleSrcChange(dev.id)
                      } else {
                        setDst(dev.id)
                      }
                    }}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-sm border-2 transition-all duration-300
                      ${isSrc ? 'bg-orange-100 border-orange-400 ring-2 ring-orange-300 scale-110' :
                        isDst ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300 scale-110' :
                        isAnimSrc ? 'bg-orange-100 border-orange-300 scale-105' :
                        isAnimDst ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300 scale-110' :
                        'bg-white border-slate-200 hover:border-slate-400'}
                      ${step > 0 ? 'cursor-default' : 'cursor-pointer'}`}>
                    {dev.emoji}
                  </button>
                  <p className="text-center mt-0.5">
                    <span className={`text-xs font-bold block leading-tight
                      ${isSrc ? 'text-orange-600' : isDst ? 'text-blue-600' : 'text-slate-500'}`}>
                      {isAr ? dev.nameAr : dev.nameEn}
                    </span>
                    <span className="font-mono text-slate-400" style={{ fontSize:'9px' }} dir="ltr">{dev.ip}</span>
                  </p>
                </div>
              )
            })}

            {/* Animated packet */}
            <div style={{
              position: 'absolute',
              left: `${pktPos.x}%`,
              top: `${pktPos.y}%`,
              transform: 'translate(-50%, -50%) translateY(-28px)',
              transition: 'left 1.2s cubic-bezier(0.4,0,0.2,1), top 1.2s cubic-bezier(0.4,0,0.2,1), opacity 0.3s',
              opacity: pktVisible ? 1 : 0,
              zIndex: 30,
              pointerEvents: 'none',
            }}>
              <div className={`rounded-xl px-2.5 py-1 text-xs font-mono shadow-lg whitespace-nowrap border
                ${step === 3 && animData?.result === 'allowed' ? 'bg-emerald-500 text-white border-emerald-600' :
                  step === 3 ? 'bg-red-500 text-white border-red-600' :
                  'bg-white text-slate-800 border-slate-300'}`}
                dir="ltr">
                {animData?.message?.slice(0, 18)}{(animData?.message?.length ?? 0) > 18 ? '…' : ''}
              </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 text-xs" dir="ltr">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
                <span className="text-slate-500">{isAr ? 'مُرسِل' : 'Sender'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" />
                <span className="text-slate-500">{isAr ? 'مستقبل' : 'Receiver'}</span>
              </span>
            </div>
          </div>

          {/* Result banner */}
          {step === 3 && animData && (
            <div className={`rounded-xl p-3 mb-4 flex items-center gap-3 text-sm
              ${animData.result === 'allowed'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'}`}>
              {animData.result === 'allowed'
                ? <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                : <ShieldX className="w-5 h-5 text-red-600 flex-shrink-0" />}
              <div>
                <span className="font-bold">{animData.result === 'allowed' ? t.allowedBanner : t.blockedBanner}</span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="text-xs">{animData.ruleLabel}</span>
              </div>
            </div>
          )}

          {/* Controls: source, destination, message */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Source selector */}
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2">{t.srcLabel}</p>
              <div className="space-y-1.5">
                {Object.values(DEVICES).map(dev => (
                  <button key={dev.id}
                    onClick={() => handleSrcChange(dev.id)}
                    disabled={step > 0}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all
                      ${src === dev.id
                        ? 'bg-orange-100 border-orange-400 text-orange-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}
                      ${step > 0 ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
                    dir="ltr">
                    <span>{dev.emoji}</span>
                    <span className="flex-1 text-left font-mono">{dev.ip}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                      ${dev.zone === 'ext' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {dev.zone === 'ext' ? (isAr ? 'خارج' : 'EXT') : (isAr ? 'داخل' : 'INT')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Destination selector */}
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2">{t.dstLabel}</p>
              <div className="space-y-1.5">
                {dstOptions.map(dev => (
                  <button key={dev.id}
                    onClick={() => step === 0 && setDst(dev.id)}
                    disabled={step > 0}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all
                      ${dst === dev.id
                        ? 'bg-blue-100 border-blue-400 text-blue-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}
                      ${step > 0 ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
                    dir="ltr">
                    <span>{dev.emoji}</span>
                    <span className="flex-1 text-left font-mono">{dev.ip}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                      ${dev.zone === 'ext' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {dev.zone === 'ext' ? (isAr ? 'خارج' : 'EXT') : (isAr ? 'داخل' : 'INT')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message + send */}
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-bold text-slate-600 mb-1.5">{t.msgLabel}</p>
                <textarea
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && simulate()}
                  rows={4}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder={t.msgPh}
                  dir="auto"
                />
              </div>

              {/* Direction badge */}
              <div className={`text-xs text-center font-bold py-1.5 rounded-lg
                ${direction === 'inbound' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                {direction === 'inbound' ? t.dirInLabel : t.dirOutLabel}
                {' · '}
                {isAr ? srcDev?.nameAr : srcDev?.nameEn}
                {' → '}
                {isAr ? dstDev?.nameAr : dstDev?.nameEn}
              </div>

              <button onClick={simulate} disabled={!msg.trim() || step > 0}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
                🔥 {t.sendBtn}
              </button>
            </div>
          </div>
        </div>

        {/* ── Rules + Log ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Rules panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              🔥 {t.rulesTitle}
              <span className="text-xs text-slate-400 font-normal">({rules.length})</span>
            </h3>

            {/* Existing rules */}
            <div className="space-y-2 mb-4 max-h-52 overflow-y-auto">
              {rules.length === 0 && (
                <p className="text-slate-400 text-xs text-center py-4">
                  {isAr ? 'لا توجد قواعد — كل الحركة مسموحة' : 'No rules — all traffic allowed'}
                </p>
              )}
              {rules.map(rule => (
                <div key={rule.id}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs
                    ${rule.type === 'block' ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <span className="flex-shrink-0 text-base">{rule.type === 'block' ? '🚫' : '✅'}</span>
                  <div className="flex-1 font-mono min-w-0">
                    <span className={`font-bold ${rule.type === 'block' ? 'text-red-700' : 'text-emerald-700'}`}>
                      {rule.type === 'block' ? (isAr ? 'حظر' : 'BLOCK') : (isAr ? 'سماح' : 'ALLOW')}
                    </span>
                    {' '}
                    <span className="text-slate-700">
                      {rule.match === 'all' ? (isAr ? '(الكل)' : '(ALL)') :
                       rule.match === 'ip' ? `IP: ${rule.ip}` :
                       `"${rule.keyword}"`}
                    </span>
                    {' '}
                    <span className="text-slate-400">
                      [{rule.direction === 'both' ? (isAr ? 'كلاهما' : 'BOTH') :
                        rule.direction === 'inbound' ? (isAr ? 'داخل' : 'IN') : (isAr ? 'خارج' : 'OUT')}]
                    </span>
                  </div>
                  <button onClick={() => removeRule(rule.id)}
                    className="flex-shrink-0 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add rule form */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-bold text-slate-600 mb-3">{t.addRule}:</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select value={newRule.type} onChange={e => setNewRule(r => ({ ...r, type: e.target.value }))}
                  className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300">
                  <option value="block">{isAr ? '🚫 حظر' : '🚫 Block'}</option>
                  <option value="allow">{isAr ? '✅ سماح' : '✅ Allow'}</option>
                </select>
                <select value={newRule.match} onChange={e => setNewRule(r => ({ ...r, match: e.target.value }))}
                  className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300">
                  <option value="keyword">{t.matchKw}</option>
                  <option value="ip">{t.matchIp}</option>
                  <option value="all">{t.matchAll}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <select value={newRule.direction} onChange={e => setNewRule(r => ({ ...r, direction: e.target.value }))}
                  className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300">
                  <option value="both">{t.dirBoth}</option>
                  <option value="inbound">{t.dirIn}</option>
                  <option value="outbound">{t.dirOut}</option>
                </select>
                {newRule.match === 'keyword' && (
                  <input value={newRule.keyword} onChange={e => setNewRule(r => ({ ...r, keyword: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addRule()}
                    className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder={t.kwPh} dir="ltr" />
                )}
                {newRule.match === 'ip' && (
                  <input value={newRule.ip} onChange={e => setNewRule(r => ({ ...r, ip: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addRule()}
                    className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder={t.ipPh} dir="ltr" />
                )}
                {newRule.match === 'all' && <div />}
              </div>
              <button onClick={addRule}
                disabled={(newRule.match === 'keyword' && !newRule.keyword.trim()) || (newRule.match === 'ip' && !newRule.ip.trim())}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 text-white font-bold py-2 rounded-xl text-xs transition-colors">
                <Plus className="w-3.5 h-3.5" /> {t.addRule}
              </button>
            </div>
          </div>

          {/* Log panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              📋 {t.logTitle}
            </h3>
            {log.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <span className="text-4xl mb-2">📭</span>
                <p className="text-sm">{t.noLog}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {log.map((entry, i) => (
                  <div key={i}
                    className={`rounded-xl p-3 border text-xs
                      ${entry.result === 'allowed' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`font-bold flex items-center gap-1 ${entry.result === 'allowed' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {entry.result === 'allowed'
                          ? <><ShieldCheck className="w-3.5 h-3.5" />{isAr ? 'مسموح' : 'ALLOWED'}</>
                          : <><ShieldX className="w-3.5 h-3.5" />{isAr ? 'محجوب' : 'BLOCKED'}</>}
                      </span>
                      <span className="text-slate-400">{entry.time}</span>
                    </div>
                    <div className="font-mono bg-white/70 rounded-lg px-2 py-1 mb-1.5 text-slate-700 truncate" dir="ltr">
                      {DEVICES[entry.src]?.emoji} {entry.srcIp} → {DEVICES[entry.dst]?.ip ?? '?'}: "{entry.message}"
                    </div>
                    <div className="text-slate-500">{isAr ? 'القاعدة: ' : 'Rule: '}{entry.ruleLabel}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Explanation>
          <p className="text-slate-600 text-sm mb-4">{t.subtitle}</p>

          {/* Concept */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🔥</span>
            <p className="text-amber-800 text-sm leading-relaxed">{t.concept}</p>
          </div>

          {/* Educational note */}
          <div className="bg-slate-800 text-slate-200 rounded-2xl p-4 text-sm leading-relaxed">
            {t.educNote}
          </div>
        </Explanation>

        <div className="flex items-center mt-8 pt-5 border-t border-slate-200">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-amber-600 text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" /> {t.back}
          </button>
        </div>
      </div>
    </div>
  )
}
