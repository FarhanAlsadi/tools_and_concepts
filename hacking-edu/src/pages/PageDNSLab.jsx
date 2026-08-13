import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'

// ── Data ──────────────────────────────────────────────────────────────────────
const LAPTOP_CACHE_INIT = {
  'instagram.com': '157.240.22.35',
  'snapchat.com':  '34.120.55.10',
  'tiktok.com':    '23.44.12.88',
}
const ROUTER_CACHE_INIT = {
  'instagram.com': '157.240.22.35',
  'youtube.com':   '142.250.190.46',
  'google.com':    '142.250.190.14',
  'facebook.com':  '157.240.1.35',
}
const ISP_DB = {
  'instagram.com':   '157.240.22.35',
  'snapchat.com':    '34.120.55.10',
  'tiktok.com':      '23.44.12.88',
  'youtube.com':     '142.250.190.46',
  'google.com':      '142.250.190.14',
  'facebook.com':    '157.240.1.35',
  'x.com':           '104.244.42.1',
  'brightbyte.io': '104.21.90.100',
}
const SITE_INFO = {
  'instagram.com':   { emoji:'📸', color:'#E1306C', bg:'#fce4ec', name:'Instagram' },
  'snapchat.com':    { emoji:'👻', color:'#D4AC0D', bg:'#fefce8', name:'Snapchat' },
  'tiktok.com':      { emoji:'🎵', color:'#333',    bg:'#f0f0f0', name:'TikTok' },
  'youtube.com':     { emoji:'▶️', color:'#FF0000', bg:'#ffebee', name:'YouTube' },
  'google.com':      { emoji:'🔍', color:'#4285F4', bg:'#e3f2fd', name:'Google' },
  'facebook.com':    { emoji:'👥', color:'#1877F2', bg:'#e8f4fd', name:'Facebook' },
  'x.com':           { emoji:'✖️', color:'#14171A', bg:'#f5f5f5', name:'X (Twitter)' },
  'brightbyte.io': { emoji:'💡', color:'#F5821F', bg:'#fff3e0', name:'Brightbyte' },
}
const ALL_DOMAINS = Object.keys(ISP_DB)
const DEFAULT_DOMAIN = 'google.com'
const NX = { laptop:6, router:26, isp:50, cloud:70, siteRouter:84, siteServer:94 }
const PKT_COLORS = { 'dns-req':'#3B82F6', 'dns-resp':'#22C55E', 'http-req':'#8B5CF6', 'http-resp':'#F97316' }
const PKT_LABELS = { 'dns-req':'DNS?', 'dns-resp':'DNS!', 'http-req':'HTTP→', 'http-resp':'←Page' }

// ── Step builder ──────────────────────────────────────────────────────────────
function buildSteps(domain) {
  const steps = []
  const ip   = ISP_DB[domain]
  const site = SITE_INFO[domain]
  const name = site?.name || domain
  const add  = (s) => steps.push(s)

  // Step 1: laptop checks cache
  add({
    desc:   `Laptop is checking its own DNS cache for "${domain}"`,
    descAr: `الحاسوب يفحص ذاكرته التخزينية بحثاً عن "${domain}"`,
    node:'laptop', showTable:'laptop', hlT:'laptop', hlD:domain, hlS:'checking',
  })

  // ── Scenario 1: Laptop cache hit ──
  if (LAPTOP_CACHE_INIT[domain]) {
    add({
      desc:   `✅ Found in Laptop Cache! IP address = ${LAPTOP_CACHE_INIT[domain]}`,
      descAr: `✅ موجود في ذاكرة الحاسوب! عنوان IP = ${LAPTOP_CACHE_INIT[domain]}`,
      node:'laptop', showTable:'laptop', hlT:'laptop', hlD:domain, hlS:'found',
      setIP:LAPTOP_CACHE_INIT[domain], scenario:1,
    })
    addHTTP(steps, domain, LAPTOP_CACHE_INIT[domain], name)
    return steps
  }

  add({
    desc:   `❌ Not in Laptop Cache — Laptop asks Router: "What is the IP of ${domain}?"`,
    descAr: `❌ غير موجود في ذاكرة الحاسوب — الحاسوب يسأل الراوتر: "ما هو عنوان IP لـ ${domain}؟"`,
    node:'laptop', showTable:null, hlT:'laptop', hlD:domain, hlS:'miss',
    pkt:{ type:'dns-req', fromX:NX.laptop, toX:NX.router },
  })

  add({
    desc:   `Router received the query — checking its own DNS cache for "${domain}"`,
    descAr: `الراوتر استلم السؤال — يفحص ذاكرته التخزينية بحثاً عن "${domain}"`,
    node:'router', showTable:'router', hlT:'router', hlD:domain, hlS:'checking',
  })

  // ── Scenario 2: Router cache hit ──
  if (ROUTER_CACHE_INIT[domain]) {
    add({
      desc:   `✅ Found in Router Cache! IP found = ${ROUTER_CACHE_INIT[domain]} — sending reply to Laptop`,
      descAr: `✅ موجود في ذاكرة الراوتر! عنوان IP = ${ROUTER_CACHE_INIT[domain]} — إرسال الرد إلى الحاسوب`,
      node:'router', showTable:'router', hlT:'router', hlD:domain, hlS:'found',
      setIP:ROUTER_CACHE_INIT[domain], scenario:2,
      pkt:{ type:'dns-resp', fromX:NX.router, toX:NX.laptop },
    })
    add({
      desc:   `Laptop received the reply: IP = ${ROUTER_CACHE_INIT[domain]} — saving to Laptop Cache`,
      descAr: `الحاسوب استلم الرد: IP = ${ROUTER_CACHE_INIT[domain]} — يحفظه في ذاكرته التخزينية`,
      node:'laptop', showTable:'laptop', hlT:'laptop', hlD:domain, hlS:'added',
      addToLaptop:{ domain, ip:ROUTER_CACHE_INIT[domain] },
    })
    addHTTP(steps, domain, ROUTER_CACHE_INIT[domain], name)
    return steps
  }

  if (ip) {
    // ── Scenario 3: ISP lookup ──
    add({
      desc:   `❌ Not in Router Cache — Router asks ISP DNS Server: "What is the IP of ${domain}?"`,
      descAr: `❌ غير موجود في ذاكرة الراوتر — الراوتر يسأل خادم DNS مزود الخدمة: "ما هو IP لـ ${domain}؟"`,
      node:'router', showTable:null, hlT:'router', hlD:domain, hlS:'miss',
      pkt:{ type:'dns-req', fromX:NX.router, toX:NX.isp },
    })
    add({
      desc:   `ISP DNS Server (Ooredoo/Vodafone) received the query — searching its full database`,
      descAr: `خادم DNS مزود الخدمة (أوريدو/فودافون) استلم السؤال — يبحث في قاعدة بياناته الكاملة`,
      node:'isp', showTable:'isp', hlT:'isp', hlD:domain, hlS:'checking',
    })
    add({
      desc:   `✅ Found in ISP Database! IP found = ${ip} — sending reply back to Router`,
      descAr: `✅ موجود في قاعدة بيانات المزود! عنوان IP = ${ip} — إرسال الرد إلى الراوتر`,
      node:'isp', showTable:'isp', hlT:'isp', hlD:domain, hlS:'found',
      setIP:ip, scenario:3,
      pkt:{ type:'dns-resp', fromX:NX.isp, toX:NX.router },
    })
    add({
      desc:   `Router received the reply: IP = ${ip} — saving to Router Cache, forwarding to Laptop`,
      descAr: `الراوتر استلم الرد: IP = ${ip} — يحفظه في ذاكرته ويرسله إلى الحاسوب`,
      node:'router', showTable:'router', hlT:'router', hlD:domain, hlS:'added',
      addToRouter:{ domain, ip },
      pkt:{ type:'dns-resp', fromX:NX.router, toX:NX.laptop },
    })
    add({
      desc:   `Laptop received the reply: IP = ${ip} — DNS complete! Saving to Laptop Cache`,
      descAr: `الحاسوب استلم الرد: IP = ${ip} — اكتمل DNS! يحفظه في ذاكرته التخزينية`,
      node:'laptop', showTable:'laptop', hlT:'laptop', hlD:domain, hlS:'added',
      addToLaptop:{ domain, ip },
    })
    addHTTP(steps, domain, ip, name)
    return steps
  }

  // ── Scenario 4: Not found ──
  add({
    desc:   `❌ Not in Router Cache — Router asks ISP DNS Server: "What is the IP of ${domain}?"`,
    descAr: `❌ غير موجود في ذاكرة الراوتر — الراوتر يسأل خادم DNS مزود الخدمة عن IP لـ ${domain}`,
    node:'router', showTable:null, hlT:'router', hlD:domain, hlS:'miss',
    pkt:{ type:'dns-req', fromX:NX.router, toX:NX.isp },
  })
  add({
    desc:   `ISP DNS Server searching its entire database for "${domain}"`,
    descAr: `خادم DNS مزود الخدمة يبحث في كامل قاعدة بياناته عن "${domain}"`,
    node:'isp', showTable:'isp', hlT:'isp', hlD:domain, hlS:'checking',
  })
  add({
    desc:   `❌ Not found in ISP Database — "${domain}" does not exist anywhere`,
    descAr: `❌ غير موجود في قاعدة بيانات المزود — "${domain}" غير مسجّل`,
    node:'isp', showTable:'isp', hlT:'isp', hlD:domain, hlS:'miss',
  })
  add({
    desc:   `DNS resolution failed — browser will show "Website Not Found"`,
    descAr: `فشل حل DNS — سيعرض المتصفح خطأ "تعذّر الوصول إلى الموقع"`,
    node:null, showTable:null, error:true, scenario:4,
  })
  return steps
}

function addHTTP(steps, domain, ip, name) {
  const add = (s) => steps.push(s)
  add({
    desc:   `DNS done ✔ — Laptop sends HTTP request to IP ${ip} to load the website`,
    descAr: `اكتمل DNS ✔ — الحاسوب يرسل طلب HTTP إلى IP ${ip} لتحميل الموقع`,
    node:'laptop', showTable:null, phase2:true,
    pkt:{ type:'http-req', fromX:NX.laptop, toX:NX.router },
  })
  add({
    desc:   `HTTP request traveling through Home Router`,
    descAr: `طلب HTTP يعبر الراوتر المنزلي`,
    node:'router', showTable:null,
    pkt:{ type:'http-req', fromX:NX.router, toX:NX.cloud },
  })
  add({
    desc:   `Request traveling through the Internet toward ${name} servers`,
    descAr: `الطلب يسافر عبر الإنترنت نحو خوادم ${name}`,
    node:'cloud', activeSite:domain, showTable:null,
    pkt:{ type:'http-req', fromX:NX.cloud, toX:NX.siteRouter },
  })
  add({
    desc:   `Request arrived at ${name} Router — routing to the correct server`,
    descAr: `الطلب وصل إلى راوتر ${name} — يوجّهه إلى الخادم الصحيح`,
    node:'site-router', showTable:null,
    pkt:{ type:'http-req', fromX:NX.siteRouter, toX:NX.siteServer },
  })
  add({
    desc:   `${name} Server received the request — processing and preparing the page`,
    descAr: `خادم ${name} استلم الطلب — يعالجه ويجهّز الصفحة`,
    node:'site-server', showTable:null,
  })
  add({
    desc:   `${name} Server sending the response back through the Internet`,
    descAr: `خادم ${name} يرسل الرد عبر الإنترنت`,
    node:'cloud', showTable:null,
    pkt:{ type:'http-resp', fromX:NX.siteServer, toX:NX.siteRouter },
  })
  add({
    desc:   `Response traveling back: Internet → Home Router`,
    descAr: `الرد في طريقه: الإنترنت ← الراوتر المنزلي`,
    node:'router', showTable:null,
    pkt:{ type:'http-resp', fromX:NX.cloud, toX:NX.router },
  })
  add({
    desc:   `Response delivered to Laptop — browser is loading the page`,
    descAr: `الرد وصل إلى الحاسوب — المتصفح يحمّل الصفحة`,
    node:'laptop', showTable:null,
    pkt:{ type:'http-resp', fromX:NX.router, toX:NX.laptop },
  })
  add({
    desc:   `🎉 ${name} loaded successfully!`,
    descAr: `🎉 تم تحميل ${name} بنجاح!`,
    node:null, showTable:null, done:true, loadSite:domain,
  })
}

// ── Site mockups ──────────────────────────────────────────────────────────────
function SiteMockup({ domain }) {
  const site = SITE_INFO[domain]
  if (!site) return null
  if (domain === 'instagram.com') return (
    <div style={{ background:'white', fontFamily:'sans-serif', height:'100%' }}>
      <div style={{ borderBottom:'1px solid #ddd', padding:'8px 14px', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:20 }}>📸</span>
        <span style={{ fontWeight:700, fontSize:16, fontFamily:'Georgia' }}>Instagram</span>
      </div>
      <div style={{ padding:8, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:3 }}>
        {['🌅','🎉','🐾','🌺','✨','🎨'].map((e,i) => (
          <div key={i} style={{ background:['#f8bbd0','#f48fb1','#e91e63','#fce4ec','#e8eaf6','#c5cae9'][i], height:60, borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{e}</div>
        ))}
      </div>
    </div>
  )
  if (domain === 'youtube.com') return (
    <div style={{ background:'white', fontFamily:'sans-serif', height:'100%' }}>
      <div style={{ background:'#ff0000', padding:'7px 14px' }}>
        <span style={{ color:'white', fontWeight:700, fontSize:14 }}>▶ YouTube</span>
      </div>
      <div style={{ padding:10, display:'flex', flexDirection:'column', gap:6 }}>
        {[['🎮','Gaming Highlights','1.2M'],['🎵','Music Mix 2025','800K'],['🤖','AI Explained','500K']].map(([e,t,v],i) => (
          <div key={i} style={{ display:'flex', gap:7, alignItems:'center' }}>
            <div style={{ width:70, height:44, background:'#f0f0f0', borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{e}</div>
            <div><div style={{ fontWeight:600, fontSize:11 }}>{t}</div><div style={{ color:'#666', fontSize:10 }}>{v} views</div></div>
          </div>
        ))}
      </div>
    </div>
  )
  if (domain === 'google.com') return (
    <div style={{ background:'white', fontFamily:'sans-serif', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, textAlign:'center' }}>
      <div style={{ fontSize:28, fontWeight:700, marginBottom:14 }}>
        {'Google'.split('').map((ch,i) => <span key={i} style={{ color:['#4285F4','#EA4335','#FBBC05','#4285F4','#34A853','#EA4335'][i] }}>{ch}</span>)}
      </div>
      <div style={{ display:'flex', gap:6, border:'1px solid #ddd', borderRadius:24, padding:'6px 14px', maxWidth:240, alignItems:'center' }}>
        <span>🔍</span><span style={{ color:'#aaa', fontSize:12 }}>Search the web...</span>
      </div>
      <div style={{ display:'flex', gap:8, marginTop:12 }}>
        {['Google Search',"I'm Feeling Lucky"].map((t,i) => (
          <div key={i} style={{ background:'#f8f9fa', border:'1px solid #ddd', borderRadius:4, padding:'5px 12px', fontSize:11 }}>{t}</div>
        ))}
      </div>
    </div>
  )
  if (domain === 'brightbyte.io') return (
    <div style={{ background:'#fff3e0', fontFamily:'sans-serif', height:'100%' }}>
      <div style={{ background:'#F5821F', padding:'7px 14px', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:18 }}>💡</span>
        <span style={{ color:'white', fontWeight:700, fontSize:14 }}>Brightbyte</span>
      </div>
      <div style={{ padding:10 }}>
        <p style={{ fontSize:11, color:'#666', marginBottom:7 }}>Welcome to Brightbyte — Learn to Code!</p>
        {['🐍 Python Basics','🌐 Web Security','🤖 AI & Robotics'].map((c,i) => (
          <div key={i} style={{ background:'white', border:'1px solid #ffe0b2', borderRadius:5, padding:'5px 9px', fontSize:11, fontWeight:600, color:'#E65100', marginBottom:4 }}>{c}</div>
        ))}
      </div>
    </div>
  )
  if (domain === 'facebook.com') return (
    <div style={{ background:'white', fontFamily:'sans-serif', height:'100%' }}>
      <div style={{ background:'#1877F2', padding:'7px 14px' }}>
        <span style={{ color:'white', fontWeight:900, fontSize:18 }}>f</span>
        <span style={{ color:'white', fontWeight:700, fontSize:13, marginLeft:4 }}>Facebook</span>
      </div>
      <div style={{ padding:9, display:'flex', flexDirection:'column', gap:5 }}>
        {['Ahmed posted a photo 📷','Sarah shared a link 🔗','Your friend liked a post ❤️'].map((p,i) => (
          <div key={i} style={{ background:'#f0f2f5', borderRadius:5, padding:'6px 9px', fontSize:11 }}>{p}</div>
        ))}
      </div>
    </div>
  )
  if (domain === 'snapchat.com') return (
    <div style={{ background:'#FFFC00', fontFamily:'sans-serif', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
      <div style={{ fontSize:40 }}>👻</div>
      <div style={{ fontWeight:900, fontSize:18, color:'#333' }}>Snapchat</div>
      <div style={{ fontSize:11, color:'#666', marginTop:6 }}>Share the moment.</div>
    </div>
  )
  if (domain === 'tiktok.com') return (
    <div style={{ background:'#010101', fontFamily:'sans-serif', height:'100%' }}>
      <div style={{ padding:'7px 14px', display:'flex', alignItems:'center', gap:7 }}>
        <span style={{ fontSize:16 }}>🎵</span><span style={{ color:'white', fontWeight:700, fontSize:13 }}>TikTok</span>
      </div>
      <div style={{ padding:'0 9px 9px', display:'flex', flexDirection:'column', gap:4 }}>
        {['Trending Dance 💃 4.2M','Comedy Sketch 😂 2.1M','Science Facts 🔬 900K'].map((v,i) => (
          <div key={i} style={{ background:'#1a1a1a', borderRadius:5, padding:'6px 9px', fontSize:11, color:'#eee' }}>▶ {v}</div>
        ))}
      </div>
    </div>
  )
  if (domain === 'x.com') return (
    <div style={{ background:'#15202B', fontFamily:'sans-serif', height:'100%' }}>
      <div style={{ padding:'7px 14px' }}>
        <span style={{ color:'white', fontWeight:900, fontSize:15 }}>✖ X</span>
      </div>
      <div style={{ padding:'0 9px 9px', display:'flex', flexDirection:'column', gap:4 }}>
        {['Trending: #AI 24K posts','Tech news update 🔥','Breaking: Global summit 🌍'].map((p,i) => (
          <div key={i} style={{ background:'#1e2732', borderRadius:5, padding:'6px 9px', fontSize:11, color:'#ccc' }}>{p}</div>
        ))}
      </div>
    </div>
  )
  return (
    <div style={{ background:site.bg, height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', fontFamily:'sans-serif' }}>
      <div style={{ fontSize:40 }}>{site.emoji}</div>
      <div style={{ fontWeight:700, fontSize:16, color:site.color, marginTop:6 }}>{site.name}</div>
      <div style={{ fontSize:11, color:'#888', marginTop:4 }}>Website loaded successfully.</div>
    </div>
  )
}

function ErrorPage({ domain }) {
  return (
    <div style={{ background:'white', fontFamily:'sans-serif', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, textAlign:'center' }}>
      <div style={{ fontSize:44, marginBottom:8 }}>⚠️</div>
      <h2 style={{ fontSize:16, fontWeight:800, color:'#dc2626', margin:'0 0 6px' }}>This site can't be reached</h2>
      <p style={{ fontSize:12, color:'#666', margin:'0 0 12px' }}>{domain}'s server IP address could not be found.</p>
      <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:6, padding:'5px 12px', fontFamily:'monospace', fontSize:11, color:'#dc2626' }}>ERR_NAME_NOT_RESOLVED</div>
    </div>
  )
}

function LoadingScreen({ domain }) {
  return (
    <div style={{ background:'#f1f5f9', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10, fontFamily:'sans-serif' }}>
      <div style={{ width:30, height:30, border:'3px solid #e2e8f0', borderTopColor:'#6366f1', borderRadius:'50%', animation:'dnslab-spin 0.8s linear infinite' }} />
      <span style={{ fontSize:12, color:'#94a3b8' }}>Connecting to {domain}...</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PageDNSLab() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [inputDomain,  setInputDomain]  = useState(DEFAULT_DOMAIN)
  const [started,      setStarted]      = useState(false)
  const [stepIdx,      setStepIdx]      = useState(-1)
  const [animating,    setAnimating]    = useState(false)
  const [activeNode,   setActiveNode]   = useState(null)
  const [activeSite,   setActiveSite]   = useState(null)
  const [hlT, setHlT] = useState(null)
  const [hlD, setHlD] = useState(null)
  const [hlS, setHlS] = useState(null)
  const [packet,       setPacket]       = useState(null)
  const [pktPos,       setPktPos]       = useState(null)
  const [resolvedIP,   setResolvedIP]   = useState(null)
  const [loadedSite,   setLoadedSite]   = useState(DEFAULT_DOMAIN)
  const [phase2,       setPhase2]       = useState(false)
  const [simDone,      setSimDone]      = useState(false)
  const [simError,     setSimError]     = useState(false)
  const [currentTable, setCurrentTable] = useState(null)
  const [laptopCache,  setLaptopCache]  = useState({ ...LAPTOP_CACHE_INIT })
  const [routerCache,  setRouterCache]  = useState({ ...ROUTER_CACHE_INIT })

  const stepsRef  = useRef([])
  const timersRef = useRef([])

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }

  const resetAll = () => {
    clearTimers()
    setStarted(false); setStepIdx(-1); setAnimating(false)
    setActiveNode(null); setActiveSite(null)
    setHlT(null); setHlD(null); setHlS(null)
    setPacket(null); setPktPos(null)
    setResolvedIP(null); setPhase2(false)
    setSimDone(false); setSimError(false)
    setCurrentTable(null)
    setLaptopCache({ ...LAPTOP_CACHE_INIT })
    setRouterCache({ ...ROUTER_CACHE_INIT })
    stepsRef.current = []
  }

  const applyStep = (step) => {
    if (step.node !== undefined)   setActiveNode(step.node)
    if (step.hlT)                  { setHlT(step.hlT); setHlD(step.hlD); setHlS(step.hlS) }
    if ('showTable' in step)       setCurrentTable(step.showTable)
    if (step.setIP)                setResolvedIP(step.setIP)
    if (step.activeSite)           setActiveSite(step.activeSite)
    if (step.phase2)               setPhase2(true)
    if (step.addToLaptop)          setLaptopCache(prev => ({ ...prev, [step.addToLaptop.domain]: step.addToLaptop.ip }))
    if (step.addToRouter)          setRouterCache(prev => ({ ...prev, [step.addToRouter.domain]: step.addToRouter.ip }))
    if (step.done)                 { setSimDone(true); setLoadedSite(step.loadSite) }
    if (step.error)                setSimError(true)
  }

  const startSim = () => {
    const d = inputDomain.trim().toLowerCase()
    if (!d) return
    resetAll()
    stepsRef.current = buildSteps(d)
    setStarted(true)
    setLoadedSite(null)
    setStepIdx(-1)
  }

  const goNext = () => {
    if (animating) return
    const next = stepIdx + 1
    if (next >= stepsRef.current.length) return
    const step = stepsRef.current[next]
    setStepIdx(next)
    applyStep(step)
    if (step.pkt) {
      setAnimating(true)
      setPacket(step.pkt)
      setPktPos(step.pkt.fromX)
      const t1 = setTimeout(() => setPktPos(step.pkt.toX), 60)
      const t2 = setTimeout(() => { setPacket(null); setPktPos(null); setAnimating(false) }, 820)
      timersRef.current.push(t1, t2)
    }
  }

  const totalSteps  = stepsRef.current.length
  const currentStep = stepsRef.current[stepIdx]
  const isLastStep  = started && stepIdx >= totalSteps - 1
  const canNext     = started && !isLastStep && !animating

  const browserContent = () => {
    if (!started && loadedSite)            return <SiteMockup domain={loadedSite} />
    if (simError)                          return <ErrorPage domain={inputDomain} />
    if (simDone && loadedSite)             return <SiteMockup domain={loadedSite} />
    if (started && stepIdx >= 0)           return <LoadingScreen domain={inputDomain} />
    return <SiteMockup domain={DEFAULT_DOMAIN} />
  }

  const tblData = { laptop:laptopCache, router:routerCache, isp:ISP_DB }
  const tblMeta = {
    laptop: { label: isAr ? '💻 ذاكرة الحاسوب DNS' : '💻 Laptop DNS Cache',    color:'#6366f1', bg:'#eef2ff' },
    router: { label: isAr ? '🔁 ذاكرة الراوتر DNS' : '🔁 Router DNS Cache',    color:'#f59e0b', bg:'#fffbeb' },
    isp:    { label: isAr ? '🏢 قاعدة بيانات المزود' : '🏢 ISP DNS Database',  color:'#0ea5e9', bg:'#f0f9ff' },
  }

  const T = {
    badge:      isAr ? '🌐 مختبر الشبكات'                                              : '🌐 Networking Lab',
    backBtn:    isAr ? '← درس DNS الأساسي'                                              : '← Basic DNS lesson',
    title:      isAr ? 'كيف يعمل DNS وكيف تتواصل المواقع'                               : 'How DNS Resolution & Website Communication Work',
    subtitle:   isAr ? 'اضغط زيارة للبدء، ثم استخدم التالي للانتقال خطوة بخطوة.'        : 'Press Visit to start, then use Next → to step through the process manually.',
    topology:   isAr ? 'رسم الشبكة'                                                    : 'NETWORK TOPOLOGY',
    phase1:     isAr ? 'المرحلة ١: DNS'                                                 : 'PHASE 1: DNS',
    phase2lbl:  isAr ? 'المرحلة ٢: HTTP'                                                : 'PHASE 2: HTTP',
    ready:      isAr ? 'جاهز'                                                          : 'READY',
    simReady:   isAr ? 'المحاكاة جاهزة — اضغط التالي للبدء'                             : 'Simulation ready — press Next to begin.',
    clickVisit: isAr ? `اضغط زيارة لمحاكاة زيارة "${inputDomain}" خطوة بخطوة.`          : `Click Visit to simulate visiting "${inputDomain}" step by step.`,
    visitFirst: isAr ? 'اضغط زيارة أولاً'                                               : 'Press Visit first',
    nextBtn:    isAr ? 'التالي ←'                                                       : 'Next →',
    sending:    isAr ? 'جارٍ الإرسال...'                                                : 'Sending...',
    done:       isAr ? '✅ اكتمل'                                                       : '✅ Done',
    failed:     isAr ? '❌ فشل'                                                         : '❌ Failed',
    notFound:   isAr ? '❌ تعذّر الوصول إلى الموقع'                                      : '❌ Website Not Found',
    loaded:     isAr ? `✅ تم تحميل ${SITE_INFO[loadedSite || '']?.name || loadedSite} بنجاح!` : `✅ ${SITE_INFO[loadedSite || '']?.name || loadedSite} loaded!`,
    visit:      isAr ? '▶ زيارة'                                                        : '▶ Visit',
    reset:      '↺',
  }

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'20px 14px', fontFamily:'sans-serif' }}
      dir={isAr ? 'rtl' : 'ltr'}>
      <style>{`
        .dnslab-node { border-radius:10px; border:2px solid #334155; background:#1e293b;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:6px 4px; min-width:60px; transition:all 0.35s; }
        .dnslab-node.active { border-color:#6366f1!important; background:#eef2ff!important;
          box-shadow:0 0 0 4px #c7d2fe; transform:scale(1.08); }
        .dnslab-node.isp-style { border-color:#f59e0b; background:#1c1810; }
        .dnslab-node.cloud-style { border-color:#38bdf8; background:#0c1820; }
        .dns-row { border-radius:5px; padding:3px 7px; font-size:11px; font-family:monospace;
          display:flex; gap:5px; align-items:center; transition:all 0.4s; }
        .hl-checking { background:#fef9c3; border:1px solid #fbbf24; animation:dnslab-pulse 0.8s infinite; }
        .hl-found    { background:#dcfce7; border:1px solid #4ade80; }
        .hl-miss     { background:#fee2e2; border:1px solid #f87171; }
        .hl-added    { background:#dbeafe; border:1px solid #60a5fa; }
        @keyframes dnslab-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes dnslab-spin  { to{transform:rotate(360deg)} }
        .pkt-ball { position:absolute; top:50%; transform:translateY(-50%);
          padding:2px 7px; border-radius:16px; color:white; font-size:10px; font-weight:700;
          white-space:nowrap; transition:left 0.7s cubic-bezier(0.4,0,0.2,1);
          z-index:20; pointer-events:none; box-shadow:0 2px 8px rgba(0,0,0,0.4); }
        .next-btn { color:white; border:none; border-radius:10px; padding:10px 28px;
          font-size:14px; font-weight:700; cursor:pointer; transition:all 0.2s; width:100%; }
        .next-btn:hover:not(:disabled) { transform:scale(1.03); filter:brightness(1.1); }
        .next-btn:disabled { background:#94a3b8!important; cursor:not-allowed; }
        .visit-btn { background:#6366f1; color:white; border:none; border-radius:8px;
          padding:6px 18px; font-size:13px; font-weight:700; cursor:pointer; }
        .visit-btn:hover { background:#4f46e5; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <span style={{ background:'#dbeafe', color:'#1d4ed8', padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>{T.badge}</span>
          <button onClick={() => navigate('/dns')}
            style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:7, padding:'3px 10px', fontSize:12, color:'#64748b', cursor:'pointer' }}>
            {T.backBtn}
          </button>
        </div>
        <h1 style={{ fontSize:20, fontWeight:800, color:'#1e293b', margin:'0 0 3px' }}>{T.title}</h1>
        <p style={{ fontSize:12, color:'#64748b', margin:0 }}>{T.subtitle}</p>
      </div>

      {/* ── BROWSER ── */}
      <div style={{ background:'#1e293b', borderRadius:14, overflow:'hidden', marginBottom:16, boxShadow:'0 4px 24px rgba(0,0,0,0.25)' }}>
        <div style={{ padding:'9px 13px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid #334155' }}>
          <div style={{ display:'flex', gap:5, flexShrink:0 }}>
            {['#ef4444','#f59e0b','#22c55e'].map((c,i) => <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:c }} />)}
          </div>
          <div style={{ background:'#334155', borderRadius:8, flex:1, display:'flex', alignItems:'center', gap:7, padding:'5px 10px' }}>
            <span style={{ color:simDone?'#22c55e':simError?'#ef4444':'#94a3b8', fontSize:12, flexShrink:0 }}>
              {simDone ? '🔒' : simError ? '⚠️' : '🔒'}
            </span>
            <input value={inputDomain}
              onChange={e => { setInputDomain(e.target.value); if (started) resetAll() }}
              onKeyDown={e => e.key === 'Enter' && startSim()}
              placeholder="Type domain name..."
              list="dnslab-domains"
              style={{ background:'transparent', border:'none', outline:'none', color:'white', fontSize:13, flex:1, fontFamily:'monospace' }} />
            <datalist id="dnslab-domains">
              {ALL_DOMAINS.map(d => <option key={d} value={d} />)}
              <option value="notexist.xyz" />
            </datalist>
            {resolvedIP && <span style={{ color:'#64748b', fontSize:10, fontFamily:'monospace', flexShrink:0 }}>{resolvedIP}</span>}
          </div>
          <button className="visit-btn" onClick={startSim}>{T.visit}</button>
          {started && (
            <button onClick={() => { resetAll(); setLoadedSite(DEFAULT_DOMAIN) }}
              style={{ background:'#334155', color:'#94a3b8', border:'none', borderRadius:7, padding:'6px 11px', fontSize:12, cursor:'pointer' }}>
              {T.reset}
            </button>
          )}
        </div>
        <div style={{ height:220, background:'#f8fafc', overflow:'hidden' }}>
          {browserContent()}
        </div>
      </div>

      {/* ── NETWORK + STEP PANEL ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:14, marginBottom:14 }}>

        {/* Network diagram */}
        <div style={{ background:'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius:13, padding:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:10, color:'#64748b', fontWeight:700, letterSpacing:1 }}>{T.topology}</span>
            <div style={{ display:'flex', gap:6 }}>
              {started && !phase2 && !simDone && !simError &&
                <span style={{ background:'#3B82F6', color:'white', borderRadius:5, padding:'1px 8px', fontSize:10, fontWeight:700 }}>{T.phase1}</span>}
              {(phase2 || simDone) &&
                <span style={{ background:'#8B5CF6', color:'white', borderRadius:5, padding:'1px 8px', fontSize:10, fontWeight:700 }}>{T.phase2lbl}</span>}
            </div>
          </div>

          <div style={{ position:'relative', height:88 }}>
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} preserveAspectRatio="none">
              <line x1="8%"  y1="50%" x2="24%" y2="50%" stroke={activeNode==='router'||activeNode==='laptop'?'#6366f1':'#334155'} strokeWidth="2" strokeDasharray="5 3" />
              <line x1="28%" y1="50%" x2="48%" y2="50%" stroke={activeNode==='isp'?'#f59e0b':'#334155'} strokeWidth="2" strokeDasharray="5 3" />
              <line x1="52%" y1="50%" x2="68%" y2="50%" stroke={activeNode==='cloud'?'#38bdf8':'#334155'} strokeWidth="2" strokeDasharray="5 3" />
              <line x1="72%" y1="50%" x2="82%" y2="50%" stroke={activeNode==='site-router'||activeSite?'#8B5CF6':'#334155'} strokeWidth="2" strokeDasharray="5 3" />
              <line x1="86%" y1="50%" x2="92%" y2="50%" stroke={activeNode==='site-server'?'#F97316':'#334155'} strokeWidth="2" strokeDasharray="5 3" />
            </svg>

            {packet && pktPos !== null && (
              <div className="pkt-ball" style={{ left:`${pktPos}%`, background:PKT_COLORS[packet.type]||'#6366f1' }}>
                {PKT_LABELS[packet.type]}
              </div>
            )}

            {[
              { id:'laptop',      x:4,  emoji:'💻', label: isAr?'الحاسوب':'Laptop',        sub: isAr?'جهازك':'Your Device' },
              { id:'router',      x:24, emoji:'🔁', label: isAr?'الراوتر':'Home Router',    sub:'192.168.1.1' },
              { id:'isp',         x:44, emoji:'🏢', label: isAr?'DNS المزود':'ISP DNS',     sub: isAr?'أوريدو/فودافون':'Ooredoo/Vodafone', cls:'isp-style' },
              { id:'cloud',       x:64, emoji:'☁️', label: isAr?'الإنترنت':'Internet',     sub:'', cls:'cloud-style' },
              { id:'site-router', x:79, emoji:'📡', label: isAr?'راوتر الموقع':'Site Router', sub:activeSite?(SITE_INFO[activeSite]?.name||activeSite):'---' },
              { id:'site-server', x:90, emoji:'🖥️', label: isAr?'خادم الويب':'Web Server',  sub:activeSite?(SITE_INFO[activeSite]?.emoji||''):'---' },
            ].map(n => (
              <div key={n.id} style={{ position:'absolute', left:`${n.x}%`, top:'50%', transform:'translate(-50%,-50%)', zIndex:10 }}>
                <div className={`dnslab-node ${n.cls||''} ${activeNode===n.id?'active':''}`} style={{ minWidth:55 }}>
                  <span style={{ fontSize:16 }}>{n.emoji}</span>
                  <span style={{ fontSize:8, fontWeight:700, color:activeNode===n.id?'#1e293b':'#94a3b8', marginTop:1, textAlign:'center', whiteSpace:'nowrap' }}>{n.label}</span>
                  {n.sub && <span style={{ fontSize:7, color:activeNode===n.id?'#4b5563':'#475569', textAlign:'center' }}>{n.sub}</span>}
                </div>
              </div>
            ))}
          </div>

          {resolvedIP && (
            <div style={{ marginTop:10, background:'#22c55e1a', border:'1px solid #22c55e', borderRadius:7, padding:'4px 10px', fontSize:11, color:'#16a34a', fontFamily:'monospace', display:'flex', gap:6, alignItems:'center' }}>
              ✅ <strong>{inputDomain}</strong> → <strong>{resolvedIP}</strong>
            </div>
          )}
        </div>

        {/* Step panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ background:'linear-gradient(135deg,#eef2ff,#e0e7ff)', border:'2px solid #818cf8', borderRadius:12, padding:14, flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between', gap:10 }}>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:10, fontWeight:700, color:'#6366f1', letterSpacing:0.5 }}>
                  {!started ? T.ready : (phase2||simDone) ? T.phase2lbl : T.phase1}
                </span>
                {started && totalSteps > 0 && (
                  <span style={{ fontSize:10, color:'#94a3b8', fontWeight:600 }}>
                    {Math.max(0, stepIdx+1)}/{totalSteps}
                  </span>
                )}
              </div>

              {started && totalSteps > 0 && (
                <div style={{ background:'#e2e8f0', borderRadius:4, height:4, marginBottom:10 }}>
                  <div style={{ background:simError?'#ef4444':simDone?'#22c55e':'#6366f1', height:'100%', borderRadius:4,
                    width:`${((stepIdx+1)/totalSteps)*100}%`, transition:'width 0.4s' }} />
                </div>
              )}

              <p style={{ fontSize:13, color:'#1e293b', lineHeight:1.65, margin:0, fontWeight:500, minHeight:72 }}>
                {!started
                  ? T.clickVisit
                  : stepIdx < 0
                  ? T.simReady
                  : (isAr ? currentStep?.descAr : currentStep?.desc) || ''}
              </p>
            </div>

            {(simDone || simError) && (
              <div style={{ borderRadius:8, padding:'6px 10px', fontSize:12, fontWeight:700, textAlign:'center',
                background:simError?'#fee2e2':'#dcfce7', color:simError?'#dc2626':'#16a34a',
                border:`1.5px solid ${simError?'#fca5a5':'#86efac'}` }}>
                {simError ? T.notFound : T.loaded}
              </div>
            )}
          </div>

          <button className="next-btn"
            disabled={!canNext}
            onClick={goNext}
            style={{ background: animating?'#6366f180':simDone||simError?'#64748b':'#6366f1' }}>
            {!started     ? T.visitFirst
              : stepIdx<0 ? T.nextBtn
              : isLastStep ? (simDone ? T.done : T.failed)
              : animating  ? T.sending
              : T.nextBtn}
          </button>

          <button onClick={() => navigate('/')}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, color:'#1d4ed8', background:'#eff6ff', border:'2px solid #bfdbfe', borderRadius:8, padding:'8px 12px', cursor:'pointer', fontSize:13, fontWeight:700, width:'100%' }}>
            <ChevronLeft size={14} />
            الرئيسية
          </button>
        </div>
      </div>

      {/* ── DNS TABLE (single, progressive) ── */}
      {currentTable && (() => {
        const meta = tblMeta[currentTable]
        const data = tblData[currentTable]
        return (
          <div style={{ background:'white', border:`2px solid ${meta.color}`, borderRadius:12, overflow:'hidden',
            boxShadow:`0 0 0 3px ${meta.color}33`, transition:'all 0.4s' }}>
            <div style={{ background:meta.bg, padding:'8px 12px', borderBottom:'1px solid #e2e8f0' }}>
              <span style={{ fontSize:13, fontWeight:700, color:meta.color }}>{meta.label}</span>
            </div>
            <div style={{ padding:10 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px 0', marginBottom:4 }}>
                <span style={{ fontSize:10, fontWeight:700, color:'#94a3b8', padding:'1px 7px' }}>Domain</span>
                <span style={{ fontSize:10, fontWeight:700, color:'#94a3b8', padding:'1px 7px', textAlign:'right' }}>IP Address</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                {Object.entries(data).map(([d, ip]) => {
                  const isHl = hlT===currentTable && hlD===d
                  const cls  = isHl ? `hl-${hlS}` : ''
                  return (
                    <div key={d} className={`dns-row ${cls}`} style={{ background:cls?undefined:'#f8fafc' }}>
                      <span style={{ flex:1, color:'#1e293b', fontSize:11 }}>{d}</span>
                      <span style={{ color:'#6366f1', fontWeight:700, fontSize:11 }}>{ip}</span>
                      {isHl && hlS==='checking' && <span>⏳</span>}
                      {isHl && hlS==='found'    && <span>✅</span>}
                      {isHl && hlS==='miss'     && <span>❌</span>}
                      {isHl && hlS==='added'    && <span>🆕</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
