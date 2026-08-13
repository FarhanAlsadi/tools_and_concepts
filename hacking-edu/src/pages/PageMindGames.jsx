import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../context/AppContext'

// ─── DATA ────────────────────────────────────────────────────────────────────

const QATAR_CARDS = [
  { img:'/images/qatar-world-cup.jpg',       ar:'كأس العالم 2022',         en:'World Cup 2022'       },
  { img:'/images/qatar-zubara.jpg',           ar:'قلعة الزبارة',            en:'Al Zubara Fort'       },
  { img:'/images/qatar-aspire.jpg',           ar:'منطقة أسباير',            en:'Aspire Zone'          },
  { img:'/images/qatar-souq-waqif.webp',      ar:'سوق واقف',                en:'Souq Waqif'           },
  { img:'/images/qatar-islamic-art.jpg',      ar:'متحف الفن الإسلامي',      en:'Islamic Art Museum'   },
  { img:'/images/qatar-lusail.jpg',           ar:'لوسيل',                   en:'Lusail'               },
  { img:'/images/qatar-katara.webp',          ar:'كتارا',                   en:'Katara'               },
  { img:'/images/qatar-msherib.jpg',          ar:'مشيرب',                   en:'Msheireb'             },
  { img:'/images/qatar-pearl.jpg',            ar:'اللؤلؤة',                 en:'The Pearl'            },
  { img:'/images/qatar-dafna.jpg',            ar:'الدفنة',                  en:'West Bay'             },
  { img:'/images/qatar-karak.jpg',            ar:'شاي الكرك',               en:'Karak Tea'            },
  { img:'/images/qatar-hawk.jpg',             ar:'الصقر',                   en:'Falcon'               },
  { img:'/images/qatar-souq-wakrah.jpg',      ar:'سوق الوكرة',              en:'Souq Al Wakrah'       },
  { img:'/images/qatar-company-house.jpg',    ar:'بيت الشركة',              en:'Company House'        },
  { img:'/images/qatar-radwani-house.jpg',    ar:'بيت الرضواني',            en:'Radwani House'        },
  { img:'/images/qatar-mhd-bin-jassim.jpg',   ar:'بيت محمد بن جاسم',       en:'Bin Jassim House'     },
  { img:'/images/qatar-bin-jelmood.webp',     ar:'بيت بن جلمود',            en:'Bin Jelmood House'    },
  { img:'/images/qatar-wajbah-fort.webp',     ar:'قلعة الوجبة',             en:'Al Wajbah Fort'       },
  { img:'/images/qatar-badea-park.jpg',       ar:'حديقة البدع',             en:'Al Bidda Park'        },
  { img:'/images/qatar-stadium-south.jpg',    ar:'استاد الجنوب',            en:'Al Janoub Stadium'    },
  { img:'/images/qatar-stadium-lusail.png',   ar:'استاد اللوسيل',           en:'Lusail Stadium'       },
  { img:'/images/qatar-stadium-albait.webp',  ar:'استاد البيت',             en:'Al Bayt Stadium'      },
  { img:'/images/qatar-stadium-thumama.jpg',  ar:'استاد الثمامة',           en:'Al Thumama Stadium'   },
  { img:'/images/qatar-stadium-edu.jpg',      ar:'استاد المدينة التعليمية', en:'Education City Stadium'},
  { img:'/images/qatar-stadium-khalifa.jpg',  ar:'استاد خليفة',             en:'Khalifa Stadium'      },
  { img:'/images/qatar-laib.png',             ar:'شعار لعيب',               en:'La\'eeb Mascot'       },
]

const MEMORY_LEVELS = [
  { cols:4,  showMs:4000, pairs: QATAR_CARDS.slice(0,  6) },  // 12 cards  → 4×3
  { cols:4,  showMs:3500, pairs: QATAR_CARDS.slice(0,  8) },  // 16 cards  → 4×4
  { cols:5,  showMs:3000, pairs: QATAR_CARDS.slice(0, 10) },  // 20 cards  → 5×4
  { cols:6,  showMs:2500, pairs: QATAR_CARDS.slice(0, 18) },  // 36 cards  → 6×6
]

const SEQUENCE_LEVELS = [
  [
    { seq:[2,4,6,null,10], ans:8, hintAr:'أضف 2 في كل مرة', hintEn:'Add 2 each time' },
    { seq:[5,10,null,20,25], ans:15, hintAr:'أضف 5 في كل مرة', hintEn:'Add 5 each time' },
    { seq:[1,3,5,7,null], ans:9, hintAr:'الأعداد الفردية', hintEn:'Odd numbers' },
  ],
  [
    { seq:[1,2,4,8,null], ans:16, hintAr:'اضرب في 2', hintEn:'Multiply by 2' },
    { seq:[81,27,9,null,1], ans:3, hintAr:'اقسم على 3', hintEn:'Divide by 3' },
    { seq:[2,6,18,null,162], ans:54, hintAr:'اضرب في 3', hintEn:'Multiply by 3' },
  ],
  [
    { seq:[1,3,6,10,null], ans:15, hintAr:'الفرق يزيد بـ1 كل مرة', hintEn:'Difference increases by 1 each time' },
    { seq:[1,4,9,16,null], ans:25, hintAr:'مربعات الأعداد الطبيعية', hintEn:'Square numbers: 1²,2²,3²...' },
    { seq:[0,1,1,2,3,null,8], ans:5, hintAr:'مجموع العددين السابقين', hintEn:'Sum of the previous two numbers' },
  ],
  [
    { seq:[1,1,2,3,5,null,13], ans:8, hintAr:'متتالية فيبوناتشي', hintEn:'Fibonacci sequence' },
    { seq:[2,5,11,23,null], ans:47, hintAr:'اضرب في 2 ثم أضف 1', hintEn:'×2 then +1' },
    { seq:[3,8,15,24,null], ans:35, hintAr:'الفرق: 5،7،9،11...', hintEn:'Differences: 5,7,9,11...' },
  ],
  [
    { seq:[1,8,27,null,125], ans:64, hintAr:'مكعبات الأعداد', hintEn:'Cube numbers: 1³,2³,3³...' },
    { seq:[2,3,5,7,11,null], ans:13, hintAr:'الأعداد الأولية', hintEn:'Prime numbers' },
    { seq:[1,2,6,24,null], ans:120, hintAr:'المضروب n!', hintEn:'Factorial: 1!,2!,3!,4!,5!' },
  ],
  // ── level 6 ──
  [
    { seq:[1,4,9,16,25,36,null], ans:49,
      hintAr:'مربعات الأعداد الطبيعية: 1²، 2²، 3²...', hintEn:'Perfect squares: 1²,2²,3²,4²,5²,6²,7²' },
    { seq:[2,6,12,20,30,42,null], ans:56,
      hintAr:'n×(n+1): 1×2، 2×3، 3×4...', hintEn:'n×(n+1): 1×2, 2×3, 3×4, 4×5, 5×6, 6×7, 7×8' },
    { seq:[1,3,6,10,15,21,null], ans:28,
      hintAr:'الأعداد المثلثية: الفرق يزيد بـ1 في كل خطوة', hintEn:'Triangular numbers: differences are 2,3,4,5,6,7' },
  ],
  // ── level 7 ──
  [
    { seq:[3,7,15,31,63,null], ans:127,
      hintAr:'اضرب في 2 ثم أضف 1 في كل خطوة', hintEn:'×2 then +1 each step: 3→7→15→31→63→127' },
    { seq:[2,4,12,48,240,null], ans:1440,
      hintAr:'اضرب في 2، ثم 3، ثم 4، ثم 5، ثم 6', hintEn:'Multiply by increasing numbers: ×2,×3,×4,×5,×6' },
    { seq:[2,3,5,8,13,21,34,null], ans:55,
      hintAr:'مجموع العددين السابقين دائماً (فيبوناتشي)', hintEn:'Each term = sum of the two before it (Fibonacci)' },
  ],
  // ── level 8 ──
  [
    { seq:[1,2,9,4,25,6,49,null], ans:8,
      hintAr:'مواضع الفردية: مربعات (1،9،25،49)، مواضع الزوجية: أعداد زوجية (2،4،6،8)',
      hintEn:'Odd positions are squares (1,9,25,49); even positions are even numbers (2,4,6,8)' },
    { seq:[1,7,19,37,61,91,null], ans:127,
      hintAr:'الفروق: 6،12،18،24،30،36 (مضاعفات 6 متصاعدة)', hintEn:'Differences are multiples of 6: +6,+12,+18,+24,+30,+36' },
    { seq:[10,9,7,4,0,null], ans:-5,
      hintAr:'الفروق: −1،−2،−3،−4،−5 (تتزايد سالباً)', hintEn:'Subtract increasing amounts: −1,−2,−3,−4,−5' },
  ],
]

const COLORS_MAP = { red:'#ef4444', blue:'#3b82f6', green:'#22c55e', yellow:'#eab308', purple:'#a855f7' }

function ShapeCell({ s, c, size=52, dimmed=false }) {
  const fill = dimmed ? '#cbd5e1' : COLORS_MAP[c]
  const S = size
  const shapes = {
    circle:   <circle cx={S/2} cy={S/2} r={S*0.36} fill={fill} />,
    square:   <rect x={S*0.14} y={S*0.14} width={S*0.72} height={S*0.72} fill={fill} rx={S*0.08} />,
    triangle: <polygon points={`${S/2},${S*0.1} ${S*0.9},${S*0.88} ${S*0.1},${S*0.88}`} fill={fill} />,
    diamond:  <polygon points={`${S/2},${S*0.1} ${S*0.9},${S/2} ${S/2},${S*0.9} ${S*0.1},${S/2}`} fill={fill} />,
  }
  return <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>{shapes[s]}</svg>
}

const PATTERN_LEVELS = [
  {
    grid: [
      {s:'circle',c:'red'},{s:'square',c:'red'},{s:'triangle',c:'red'},
      {s:'circle',c:'blue'},{s:'square',c:'blue'},{s:'triangle',c:'blue'},
      {s:'circle',c:'green'},{s:'square',c:'green'},null,
    ],
    answer:{s:'triangle',c:'green'},
    opts:[{s:'triangle',c:'green'},{s:'circle',c:'green'},{s:'triangle',c:'blue'},{s:'square',c:'red'}],
    hintAr:'كل صف له نفس اللون، كل عمود له نفس الشكل', hintEn:'Each row: same color. Each column: same shape.',
  },
  {
    grid: [
      {s:'circle',c:'red'},{s:'square',c:'blue'},{s:'triangle',c:'green'},
      {s:'square',c:'green'},{s:'triangle',c:'red'},{s:'circle',c:'blue'},
      {s:'triangle',c:'blue'},{s:'circle',c:'green'},null,
    ],
    answer:{s:'square',c:'red'},
    opts:[{s:'square',c:'red'},{s:'square',c:'blue'},{s:'circle',c:'red'},{s:'triangle',c:'green'}],
    hintAr:'كل صف يحتوي على الأشكال الثلاثة — ما الشكل واللون المفقودان؟',
    hintEn:'Each row has all 3 shapes — which shape and color are missing?',
  },
  {
    grid: [
      {s:'circle',c:'red'},{s:'circle',c:'blue'},{s:'circle',c:'green'},
      {s:'square',c:'blue'},{s:'square',c:'green'},{s:'square',c:'red'},
      {s:'triangle',c:'green'},{s:'triangle',c:'red'},null,
    ],
    answer:{s:'triangle',c:'blue'},
    opts:[{s:'triangle',c:'blue'},{s:'triangle',c:'green'},{s:'diamond',c:'blue'},{s:'circle',c:'blue'}],
    hintAr:'كل صف له شكل ثابت، والألوان تتحرك خطوة لليمين مع كل صف',
    hintEn:'Each row has one fixed shape; colors shift right by 1 step per row',
  },
  {
    grid: [
      {s:'circle',c:'red'},{s:'square',c:'blue'},{s:'diamond',c:'green'},
      {s:'square',c:'green'},{s:'diamond',c:'red'},{s:'circle',c:'blue'},
      {s:'diamond',c:'blue'},{s:'circle',c:'green'},null,
    ],
    answer:{s:'square',c:'red'},
    opts:[{s:'square',c:'red'},{s:'diamond',c:'red'},{s:'square',c:'blue'},{s:'circle',c:'red'}],
    hintAr:'القطر الرئيسي له نفس اللون — انظر للعمود الأخير',
    hintEn:'Check which shape and color complete all rows and columns uniquely',
  },
  {
    grid: [
      {s:'circle',c:'red'},{s:'square',c:'blue'},{s:'triangle',c:'green'},
      {s:'triangle',c:'red'},{s:'diamond',c:'blue'},{s:'circle',c:'green'},
      {s:'diamond',c:'red'},{s:'circle',c:'blue'},null,
    ],
    answer:{s:'square',c:'green'},
    opts:[{s:'square',c:'green'},{s:'triangle',c:'green'},{s:'square',c:'red'},{s:'diamond',c:'green'}],
    hintAr:'الأشكال تتقدم بترتيب دائري في كل عمود: دائرة→مربع→مثلث→معين',
    hintEn:'Shapes cycle in each column: circle→square→triangle→diamond',
  },
  // ── level 6: introduces yellow ──
  {
    grid: [
      {s:'circle',  c:'red' },{s:'square',  c:'blue'  },{s:'triangle',c:'yellow'},
      {s:'triangle',c:'blue'},{s:'circle',  c:'yellow'},{s:'square',  c:'red'   },
      {s:'square',  c:'yellow'},{s:'triangle',c:'red' },null,
    ],
    answer:{s:'circle',c:'blue'},
    opts:[{s:'circle',c:'blue'},{s:'circle',c:'red'},{s:'square',c:'blue'},{s:'triangle',c:'blue'}],
    hintAr:'كل صف يحتوي على الألوان الثلاثة (أحمر، أزرق، أصفر) وكل عمود يحتوي على الأشكال الثلاثة',
    hintEn:'Each row has red, blue & yellow exactly once. Each column has all 3 shapes.',
  },
  // ── level 7: introduces diamond + colour alternation ──
  {
    grid: [
      {s:'circle', c:'red' },{s:'diamond',c:'blue'},{s:'square', c:'red' },
      {s:'square', c:'blue'},{s:'circle', c:'red' },{s:'diamond',c:'blue'},
      {s:'diamond',c:'red' },{s:'square', c:'blue'},null,
    ],
    answer:{s:'circle',c:'red'},
    opts:[{s:'circle',c:'red'},{s:'circle',c:'blue'},{s:'diamond',c:'red'},{s:'triangle',c:'red'}],
    hintAr:'كل عمود يدور: دائرة→مربع→معين. الألوان تتبادل أحمر-أزرق في كل صف',
    hintEn:'Each column cycles circle→square→diamond. Colors alternate red-blue per row.',
  },
  // ── level 8: full latin square (shapes + colors) ──
  {
    grid: [
      {s:'circle', c:'red'  },{s:'square', c:'blue' },{s:'diamond',c:'green'},
      {s:'diamond',c:'blue' },{s:'circle', c:'green'},{s:'square', c:'red'  },
      {s:'square', c:'green'},{s:'diamond',c:'red'  },null,
    ],
    answer:{s:'circle',c:'blue'},
    opts:[{s:'circle',c:'blue'},{s:'circle',c:'green'},{s:'square',c:'blue'},{s:'diamond',c:'blue'}],
    hintAr:'كل شكل ولون يظهر مرة واحدة بالضبط في كل صف وكل عمود',
    hintEn:'Every shape and every color appears exactly once in each row and each column.',
  },
]

const mkH = (rows, cols) => Array.from({length:rows+1}, () => Array(cols).fill(true))
const mkV = (rows, cols) => Array.from({length:rows}, () => Array(cols+1).fill(true))

function countSquares(h, v, rows, cols) {
  let n = 0
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (h[r][c] && h[r+1][c] && v[r][c] && v[r][c+1]) n++
  return n
}

function countTriangles(active, triangleDefs) {
  return triangleDefs.filter(tri => tri.every(sIdx => active[sIdx])).length
}

// ── Triangle level geometry ──────────────────────────────────────────────────
// Triforce: 6 vertices, 9 sticks → 4 triangles
//     A
//    / \
//   B---C
//  / \ / \
// D---E---F
const TF_PTS    = [[115,12],[58,108],[172,108],[5,202],[115,202],[225,202]]
const TF_STICKS = [[0,1],[0,2],[1,2],[1,3],[3,4],[1,4],[2,4],[4,5],[2,5]]
//                  A-B    A-C    B-C   B-D   D-E   B-E   C-E   E-F   C-F
const TF_TRIS   = [[0,1,2],[3,4,5],[2,5,6],[6,7,8]]
//                  top    botL   mid↓   botR

// Zigzag: 5 vertices, 7 sticks → 3 triangles (alternating up/down)
//  B   D
// /|\ /
//A---C---E
//     \ /|\
//       same pattern
const ZZ_PTS    = [[10,98],[70,10],[130,98],[190,10],[250,98]]
const ZZ_STICKS = [[0,1],[1,2],[0,2],[2,3],[1,3],[3,4],[2,4]]
//                  A-B   B-C   A-C   C-D   B-D   D-E   C-E
const ZZ_TRIS   = [[0,1,2],[1,3,4],[3,5,6]]
//                  upABC  downBCD upCDE

// Star of 6 (two overlapping triangles — 12 sticks, 8 small triangles)
// We'll skip this complexity and use a simpler 5-triangle strip instead:
// Row of 5 same-direction triangles arranged in a 2-row grid: same as squares but triangular

const MATCHSTICK_LEVELS = [
  { rows:2, cols:2, h:mkH(2,2), v:mkV(2,2), moves:2, goal:2,
    taskAr:'أزل ٢ أعواد لتُبقي مربعَين بالضبط', taskEn:'Remove 2 sticks to leave exactly 2 squares',
    hintAr:'أزل عودَين من الجوانب الخارجية لمربعَين منفصلَين', hintEn:'Remove 2 outer sticks from 2 different squares' },
  { rows:1, cols:3, h:mkH(1,3), v:mkV(1,3), moves:2, goal:1,
    taskAr:'أزل ٢ أعواد لتُبقي مربعاً واحداً فقط', taskEn:'Remove 2 sticks to leave exactly 1 square',
    hintAr:'أزل العود العلوي من أول مربعَين لتبقى الثالث', hintEn:'Remove the top sticks of the first 2 squares' },
  { rows:2, cols:3, h:mkH(2,3), v:mkV(2,3), moves:4, goal:2,
    taskAr:'أزل ٤ أعواد لتُبقي مربعَين بالضبط', taskEn:'Remove 4 sticks to leave exactly 2 squares',
    hintAr:'ركّز على صف واحد وأبقِ مربعَين متجاورَين', hintEn:'Focus on one row and keep 2 adjacent squares' },
  { rows:2, cols:2, h:mkH(2,2), v:mkV(2,2), moves:3, goal:1,
    taskAr:'أزل ٣ أعواد لتُبقي مربعاً واحداً فقط', taskEn:'Remove 3 sticks to leave exactly 1 square',
    hintAr:'اختر مربعاً واحداً وأتلف الثلاثة الباقية', hintEn:'Pick one square to keep and break the other three' },
  { rows:3, cols:3, h:mkH(3,3), v:mkV(3,3), moves:6, goal:3,
    taskAr:'أزل ٦ أعواد لتُبقي ٣ مربعات بالضبط', taskEn:'Remove 6 sticks to leave exactly 3 squares',
    hintAr:'فكّر في إبقاء مربعات في القطر الرئيسي', hintEn:'Try keeping squares along the main diagonal' },

  // ── Triangle levels ──────────────────────────────────────────────────────
  { type:'triangle', pts:TF_PTS, sticks:TF_STICKS, triangles:TF_TRIS,
    sticksInit: TF_STICKS.map(() => true),
    moves:2, goal:2,
    taskAr:'أزل عودَين لتُبقي مثلثَين بالضبط', taskEn:'Remove 2 sticks to leave exactly 2 triangles',
    hintAr:'أزل عوداً خارجياً من الجهة العلوية-اليسرى وآخر من الجهة السفلية-اليمنى', hintEn:'Remove one outer stick from top-left and one from bottom-right' },

  { type:'triangle', pts:TF_PTS, sticks:TF_STICKS, triangles:TF_TRIS,
    sticksInit: TF_STICKS.map(() => true),
    moves:3, goal:1,
    taskAr:'أزل ٣ أعواد لتُبقي مثلثاً واحداً فقط', taskEn:'Remove 3 sticks to leave exactly 1 triangle',
    hintAr:'المثلث المقلوب في الوسط يمكن إبقاؤه بإزالة أعواد من المثلثات الثلاثة الأخرى', hintEn:'The inverted middle triangle can stay — remove one key stick from each other triangle' },

  { type:'triangle', pts:ZZ_PTS, sticks:ZZ_STICKS, triangles:ZZ_TRIS,
    sticksInit: ZZ_STICKS.map(() => true),
    moves:2, goal:1,
    taskAr:'هذه مثلثات متعرجة (أعلى وأسفل)! أزل ٢ عوداً لتُبقي مثلثاً واحداً', taskEn:'Zigzag triangles (up & down)! Remove 2 sticks to leave exactly 1 triangle',
    hintAr:'أزل الأعواد المشتركة بين المثلثات الجانبية والوسطى', hintEn:'Remove the shared sticks between the middle and side triangles' },
]

const SLIDING_CFG = [
  { size:3, shuffles:12 }, { size:3, shuffles:24 }, { size:3, shuffles:40 },
  { size:4, shuffles:15 }, { size:4, shuffles:30 },
]

function makeSolved(size) { return [...Array(size*size).keys()].map((_,i) => i===size*size-1?0:i+1) }
function getNeighbors(pos, size) {
  const r=Math.floor(pos/size), c=pos%size, nb=[]
  if(r>0) nb.push(pos-size); if(r<size-1) nb.push(pos+size)
  if(c>0) nb.push(pos-1); if(c<size-1) nb.push(pos+1)
  return nb
}
function generatePuzzle(size, shuffles) {
  let t=makeSolved(size), ep=size*size-1, prev=-1
  for(let i=0;i<shuffles;i++){
    const nb=getNeighbors(ep,size).filter(n=>n!==prev)
    const m=nb[Math.floor(Math.random()*nb.length)]
    ;[t[ep],t[m]]=[t[m],t[ep]]; prev=ep; ep=m
  }
  return t
}
function isSolved(tiles, size) { return tiles.every((v,i)=>v===makeSolved(size)[i]) }

// ─── TIMER ───────────────────────────────────────────────────────────────────

function Timer({ ar, onTimeUp }) {
  const [duration, setDuration] = useState(90)
  const [inputVal, setInputVal] = useState('90')
  const [seconds, setSeconds] = useState(90)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) { clearInterval(intervalRef.current); setRunning(false); onTimeUp?.(); return 0 }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const handleReset = () => { clearInterval(intervalRef.current); setRunning(false); setSeconds(duration) }
  const handleChangeDuration = () => {
    const v = parseInt(inputVal)
    if (!isNaN(v) && v > 0) { setDuration(v); setSeconds(v); setRunning(false); clearInterval(intervalRef.current) }
  }

  const mm = String(Math.floor(seconds/60)).padStart(2,'0')
  const ss = String(seconds%60).padStart(2,'0')
  const color = seconds > 30 ? 'text-green-600' : seconds > 10 ? 'text-amber-500' : 'text-red-500'
  const pulse = seconds < 5 && seconds > 0 ? 'animate-pulse' : ''

  return (
    <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl px-3 py-2 shadow border border-slate-100">
      <span className={`font-mono font-bold text-2xl ${color} ${pulse}`}>{mm}:{ss}</span>
      <button onClick={() => setRunning(r => !r)}
        className="px-3 py-1 rounded-lg text-sm font-bold bg-slate-800 text-white hover:bg-slate-700">
        {running ? (ar ? 'إيقاف' : 'Pause') : (ar ? 'تشغيل' : 'Play')}
      </button>
      <button onClick={handleReset}
        className="px-3 py-1 rounded-lg text-sm font-bold bg-slate-200 text-slate-700 hover:bg-slate-300">
        {ar ? 'إعادة' : 'Reset'}
      </button>
      <div className="flex items-center gap-1">
        <input type="number" min="5" max="600" value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center" />
        <button onClick={handleChangeDuration}
          className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-400 text-slate-900 hover:bg-amber-500">
          {ar ? 'تعيين' : 'Set'}
        </button>
      </div>
    </div>
  )
}

// ─── LEVEL BAR ───────────────────────────────────────────────────────────────

function LevelBar({ level, onLevel, ar, hintsLeft, onHint, totalLevels = 5, showHintBtn = true }) {
  return (
    <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: totalLevels }, (_, i) => i + 1).map(l => (
          <button key={l} onClick={() => onLevel(l)}
            className={`w-9 h-9 rounded-full font-bold text-sm transition-all
              ${l === level ? 'bg-[#0E1F39] text-white scale-110 shadow' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
            {l}
          </button>
        ))}
      </div>
      {showHintBtn && (
        <button onClick={onHint} disabled={hintsLeft === 0}
          className={`flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm transition-all
            ${hintsLeft > 0 ? 'bg-amber-400 text-slate-900 hover:bg-amber-500' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
          💡 {ar ? `تلميح (${hintsLeft})` : `Hint (${hintsLeft})`}
        </button>
      )}
    </div>
  )
}

// ─── GAME 1: MEMORY MATCH ────────────────────────────────────────────────────

function shuffle(arr) { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a }

function GameMemory({ level, ar, showHint, setHintUsed }) {
  const cfg = MEMORY_LEVELS[level-1]
  const [cards, setCards] = useState([])
  const [selected, setSelected] = useState([])
  const [phase, setPhase] = useState('reveal')
  const [moves, setMoves] = useState(0)
  const [matchCount, setMatchCount] = useState(0)
  const [peekSec, setPeekSec] = useState(() => Math.round(cfg.showMs / 1000))
  const lockRef = useRef(false)

  // Responsive column capping: more columns on desktop, fewer on mobile
  const [winW, setWinW] = useState(() => window.innerWidth)
  useEffect(() => {
    const fn = () => setWinW(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // Measure the grid container so we can size cards to fill it exactly.
  // Measure immediately + after paint + on resize (not only via ResizeObserver)
  // so the grid always renders even if the RO callback is delayed.
  const gridContainerRef = useRef(null)
  const [gridSize, setGridSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = gridContainerRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      setGridSize(prev => (Math.abs(prev.w - r.width) > 1 || Math.abs(prev.h - r.height) > 1)
        ? { w: r.width, h: r.height } : prev)
    }
    measure()
    const raf = requestAnimationFrame(measure)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => { ro.disconnect(); cancelAnimationFrame(raf) }
  }, [winW])

  const init = useCallback(() => {
    const pairs = cfg.pairs
    const deck = shuffle([...pairs,...pairs].map((card,id) => ({
      id, img:card.img, labelAr:card.ar, labelEn:card.en, flipped:false, matched:false,
    })))
    // Start face-down; wait for the player to press "Show Cards"
    setCards(deck); setSelected([]); setMoves(0); setMatchCount(0); setPhase('waiting'); lockRef.current = false
  }, [cfg])

  const handleShowCards = useCallback(() => {
    const ms = Math.max(500, peekSec * 1000)
    setPhase('reveal')
    setCards(d => d.map(c => ({ ...c, flipped: true })))
    setTimeout(() => {
      setCards(d => d.map(c => ({ ...c, flipped: false })))
      setPhase('playing')
    }, ms)
  }, [peekSec])

  useEffect(() => { init() }, [level])

  useEffect(() => {
    if (!showHint) return
    setHintUsed(true)
    const unmatched = cards.filter(c => !c.matched)
    if (unmatched.length < 2) return
    const pick = unmatched[0]
    const pair = unmatched.find(c => c.img === pick.img && c.id !== pick.id)
    if (!pair) return
    setCards(d => d.map(c => c.id===pick.id||c.id===pair.id ? {...c,flipped:true} : c))
    setTimeout(() => setCards(d => d.map(c => c.id===pick.id||c.id===pair.id ? {...c,flipped:false} : c)), 1000)
  }, [showHint])

  const handleClick = (idx) => {
    if (phase !== 'playing' || lockRef.current) return
    const card = cards[idx]
    if (card.flipped || card.matched) return
    if (selected.length === 1 && selected[0] === idx) return

    const newSel = [...selected, idx]
    setCards(d => d.map((c,i) => i===idx ? {...c,flipped:true} : c))

    if (newSel.length === 2) {
      lockRef.current = true
      setMoves(m => m+1)
      const [a,b] = newSel
      if (cards[a].img === card.img) {
        setCards(d => d.map((c,i) => i===a||i===b ? {...c,matched:true} : c))
        const newMatch = matchCount+1
        setMatchCount(newMatch)
        if (newMatch === cfg.pairs.length) setPhase('won')
        lockRef.current = false
        setSelected([])
      } else {
        setSelected(newSel)
        setTimeout(() => {
          setCards(d => d.map((c,i) => i===a||i===b ? {...c,flipped:false} : c))
          setSelected([]); lockRef.current = false
        }, 800)
        return
      }
    } else {
      setSelected(newSel)
    }
  }

  if (phase === 'won') return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🎉</div>
      <div className="text-2xl font-bold text-green-600 mb-2">{ar ? 'أحسنت!' : 'Well done!'}</div>
      <div className="text-slate-600 mb-6">{ar ? `أنهيت في ${moves} حركة` : `Finished in ${moves} moves`}</div>
      <button onClick={init} className="px-6 py-2 bg-[#0E1F39] text-white rounded-xl font-bold hover:opacity-90">
        {ar ? 'العب مجدداً' : 'Play Again'}
      </button>
    </div>
  )

  // Desktop: full cols. Tablet: cap so cards stay readable. Mobile: 3 cols.
  const effectiveCols = winW < 640
    ? Math.min(cfg.cols, 3)
    : winW < 1024
    ? Math.min(cfg.cols, 6)
    : cfg.cols

  // ── Card sizing: fit within the container (both height and width) so every
  //    card is visible with no scrolling ────────────────────────────────────────
  const GAP        = 6                                            // px between cells
  const MAX_ROW_H  = 300                                          // hard cap (px)
  const totalCards = cfg.pairs.length * 2
  const numRows    = Math.ceil(totalCards / effectiveCols)

  const rowH_byH = gridSize.h > 0
    ? (gridSize.h - (numRows - 1) * GAP) / numRows
    : MAX_ROW_H
  const rowH_byW = gridSize.w > 0
    ? ((gridSize.w - (effectiveCols - 1) * GAP) / effectiveCols) * (3 / 4)
    : MAX_ROW_H

  const rowH = Math.min(rowH_byH, rowH_byW, MAX_ROW_H)
  const colW = rowH * (4 / 3)

  return (
    /* Flex column: top bar shrinks, grid fills the rest */
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top bar ── */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
        <div className="text-xs text-slate-500">
          {ar ? `حركات: ${moves}` : `Moves: ${moves}`}
        </div>

        {/* Duration input + action button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Seconds control — always visible so teacher can adjust before peeking */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: '#f8fafc', border: '1.5px solid #e2e8f0',
            borderRadius: 10, padding: '3px 8px 3px 6px',
          }}>
            <input
              type="number" min={1} max={60} value={peekSec}
              onChange={e => setPeekSec(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
              style={{
                width: 36, textAlign: 'center', border: 'none', outline: 'none',
                background: 'transparent', fontWeight: 800, fontSize: '0.85rem', color: '#0E1F39',
              }}
            />
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>
              {ar ? 'ث' : 's'}
            </span>
          </div>

          {phase === 'waiting' && (
            <button
              onClick={handleShowCards}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm shadow-md transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#FCAD0F', color: '#0E1F39' }}
            >
              <span>👁️</span>
              <span>{ar ? 'اعرض البطاقات' : 'Show Cards'}</span>
            </button>
          )}

          {phase === 'reveal' && (
            <span className="text-amber-600 font-bold text-sm animate-pulse">
              {ar ? '! احفظ البطاقات' : 'Memorize!'}
            </span>
          )}

          {phase === 'playing' && (
            <button
              onClick={handleShowCards}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs border border-slate-300 text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-all"
            >
              <span>👁️</span>
              <span>{ar ? 'اعرض مجدداً' : 'Peek again'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Grid — takes all remaining height ── */}
      <div ref={gridContainerRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Only render once we have real measurements */}
        {(gridSize.h > 0 || gridSize.w > 0) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${effectiveCols}, ${colW}px)`,
            gridTemplateRows:    `repeat(${numRows}, ${rowH}px)`,
            gap:                 `${GAP}px`,
            justifyContent:      'center',
            alignContent:        'center',
            height:              '100%',
          }}>
            {cards.map((card, idx) => {
              const visible = card.flipped || card.matched
              return (
                <button
                  key={card.id}
                  onClick={() => handleClick(idx)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 shadow-md
                    ${card.matched
                      ? 'border-green-400 ring-2 ring-green-300 opacity-80'
                      : card.flipped
                      ? 'border-amber-400 ring-2 ring-amber-200'
                      : 'border-[#1a3060] hover:shadow-xl hover:brightness-110 cursor-pointer'}`}
                >
                  {visible ? (
                    <>
                      <div className="absolute inset-0" style={{ background: '#f1f5f9' }} />
                      <img
                        src={import.meta.env.BASE_URL + card.img.replace(/^\//, '')}
                        alt={ar ? card.labelAr : card.labelEn}
                        className="absolute inset-0 w-full h-full"
                        style={{ objectFit: 'contain' }}
                        onError={e => { e.target.style.display = 'none' }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-1 py-0.5 text-center z-10">
                        <span
                          className="text-white font-bold leading-tight drop-shadow block truncate"
                          style={{ fontSize: `clamp(8px, ${colW * 0.09}px, 13px)` }}
                        >
                          {ar ? card.labelAr : card.labelEn}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #0E1F39 0%, #1a3a6e 100%)' }}
                    >
                      {/* Watermark flag */}
                      <span
                        className="absolute"
                        style={{ fontSize: `clamp(14px, ${colW * 0.28}px, 52px)`, opacity: 0.1, userSelect: 'none' }}
                      >🇶🇦</span>
                      {/* Card number — students call this out to pick a card */}
                      <span
                        style={{
                          fontSize:   `clamp(16px, ${rowH * 0.38}px, 72px)`,
                          fontWeight: 900,
                          color:      '#FCAD0F',
                          lineHeight: 1,
                          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                          fontFamily: 'Montserrat, Cairo, sans-serif',
                          letterSpacing: '-1px',
                          userSelect: 'none',
                        }}
                      >
                        {idx + 1}
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── GAME 2: NUMBER SEQUENCES ─────────────────────────────────────────────────

function GameSequence({ level, ar, showHint, setHintUsed }) {
  const seqs = SEQUENCE_LEVELS[level-1]
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState(null) // 'correct'|'wrong'|null
  const [won, setWon] = useState(false)
  const [hintText, setHintText] = useState('')

  useEffect(() => { setIdx(0); setInput(''); setStatus(null); setWon(false); setHintText('') }, [level])

  useEffect(() => {
    if (!showHint) return
    setHintUsed(true)
    const cur = seqs[idx]
    setHintText(ar ? cur.hintAr : cur.hintEn)
  }, [showHint])

  const submit = () => {
    const val = parseInt(input)
    const cur = seqs[idx]
    if (val === cur.ans) {
      setStatus('correct')
      setTimeout(() => {
        if (idx+1 >= seqs.length) { setWon(true) }
        else { setIdx(i=>i+1); setInput(''); setStatus(null); setHintText('') }
      }, 700)
    } else {
      setStatus('wrong')
      setTimeout(() => setStatus(null), 700)
    }
  }

  if (won) return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🧠</div>
      <div className="text-2xl font-bold text-green-600 mb-4">{ar ? 'ممتاز! أكملت جميع التسلسلات' : 'Excellent! All sequences solved!'}</div>
      <button onClick={() => { setIdx(0); setInput(''); setStatus(null); setWon(false); setHintText('') }}
        className="px-6 py-2 bg-[#0E1F39] text-white rounded-xl font-bold hover:opacity-90">
        {ar ? 'العب مجدداً' : 'Play Again'}
      </button>
    </div>
  )

  const cur = seqs[idx]
  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center text-sm text-slate-500 mb-4">{ar ? `${idx+1} من ${seqs.length}` : `${idx+1} of ${seqs.length}`}</div>
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {cur.seq.map((n,i) => (
          <div key={i} className={`min-w-[52px] h-14 rounded-xl flex items-center justify-center text-xl font-bold border-2
            ${n===null ? 'bg-amber-100 border-amber-400 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-800'}`}>
            {n===null ? '?' : n}
          </div>
        ))}
      </div>
      {hintText && <div className="text-center text-amber-700 bg-amber-50 rounded-xl px-4 py-2 mb-4 text-sm font-medium">{hintText}</div>}
      <div className={`flex gap-2 justify-center transition-all ${status==='wrong'?'animate-bounce':''}`}>
        <input type="number" value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&submit()}
          className={`w-28 border-2 rounded-xl px-3 py-2 text-center text-lg font-bold outline-none
            ${status==='correct'?'border-green-400 bg-green-50':status==='wrong'?'border-red-400 bg-red-50':'border-slate-200'}`}
          placeholder={ar?'الجواب':'Answer'} />
        <button onClick={submit}
          className="px-6 py-2 bg-[#0E1F39] text-white rounded-xl font-bold hover:opacity-90">
          {ar ? 'تحقق' : 'Submit'}
        </button>
      </div>
      {status==='correct' && <div className="text-center text-green-600 font-bold mt-3">{ar?'صحيح!':'Correct!'}</div>}
      {status==='wrong' && <div className="text-center text-red-500 font-bold mt-3">{ar?'خطأ، حاول مجدداً':'Wrong, try again!'}</div>}
    </div>
  )
}

// ─── GAME 3: PATTERN MATRIX ──────────────────────────────────────────────────

function GamePattern({ level, ar, showHint, setHintUsed }) {
  const data = PATTERN_LEVELS[level-1]
  const [chosen, setChosen] = useState(null)
  const [result, setResult] = useState(null)
  const [hintText, setHintText] = useState('')

  useEffect(() => { setChosen(null); setResult(null); setHintText('') }, [level])

  useEffect(() => {
    if (!showHint) return
    setHintUsed(true)
    setHintText(ar ? data.hintAr : data.hintEn)
  }, [showHint])

  const pick = (opt) => {
    if (result) return
    setChosen(opt)
    const correct = opt.s === data.answer.s && opt.c === data.answer.c
    setResult(correct ? 'win' : 'lose')
  }

  const optKey = o => `${o.s}-${o.c}`

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex justify-center mb-6">
        <div className="grid grid-cols-3 gap-2">
          {data.grid.map((cell,i) => (
            <div key={i} className="w-16 h-16 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center">
              {cell ? <ShapeCell s={cell.s} c={cell.c} size={48} /> : <span className="text-2xl font-bold text-slate-400">?</span>}
            </div>
          ))}
        </div>
      </div>
      {hintText && <div className="text-center text-amber-700 bg-amber-50 rounded-xl px-4 py-2 mb-4 text-sm font-medium">{hintText}</div>}
      <div className="text-center text-sm font-medium text-slate-600 mb-3">{ar?'اختر الشكل الصحيح:':'Pick the correct shape:'}</div>
      <div className="flex justify-center gap-3 flex-wrap">
        {data.opts.map(opt => {
          const k = optKey(opt)
          const isChosen = chosen && optKey(chosen)===k
          const isAnswer = optKey(data.answer)===k
          let cls = 'w-20 h-20 border-2 rounded-xl flex items-center justify-center transition-all hover:scale-105 '
          if (result && isAnswer) cls += 'border-green-400 bg-green-50 scale-110 '
          else if (result && isChosen && !isAnswer) cls += 'border-red-400 bg-red-50 '
          else cls += 'border-slate-200 bg-white hover:border-slate-400 '
          return (
            <button key={k} onClick={() => pick(opt)} className={cls}>
              <ShapeCell s={opt.s} c={opt.c} size={52} />
            </button>
          )
        })}
      </div>
      {result === 'win' && <div className="text-center text-green-600 font-bold mt-4 text-lg">{ar?'أحسنت! إجابة صحيحة ✓':'Correct! ✓'}</div>}
      {result === 'lose' && <div className="text-center text-red-500 font-bold mt-4">{ar?'خطأ! حاول مستوى آخر':'Wrong! Try another level'}</div>}
    </div>
  )
}

// ─── GAME 4: MATCHSTICK ──────────────────────────────────────────────────────

function GameMatchstick({ level, ar, showHint, setHintUsed }) {
  const cfg = MATCHSTICK_LEVELS[level-1]
  const isTriangle = cfg.type === 'triangle'

  // Square state
  const [hS, setHS] = useState(() => cfg.h ? cfg.h.map(r => [...r]) : [])
  const [vS, setVS] = useState(() => cfg.v ? cfg.v.map(r => [...r]) : [])
  // Triangle state
  const [sticksActive, setSticksActive] = useState(() => isTriangle ? [...cfg.sticksInit] : [])

  const [removed, setRemoved] = useState(0)
  const [done, setDone]       = useState(false)
  const [hintText, setHintText] = useState('')

  const init = useCallback(() => {
    if (isTriangle) {
      setSticksActive([...cfg.sticksInit])
    } else {
      setHS(cfg.h.map(r=>[...r]))
      setVS(cfg.v.map(r=>[...r]))
    }
    setRemoved(0); setDone(false); setHintText('')
  }, [cfg, isTriangle])

  useEffect(() => { init() }, [level])

  useEffect(() => {
    if (!showHint) return
    setHintUsed(true)
    setHintText(ar ? cfg.hintAr : cfg.hintEn)
  }, [showHint])

  // ── Square helpers ─────────────────────────────────────────────────────────
  const CS=56, pad=16
  const sqW = !isTriangle ? pad*2 + cfg.cols*CS : 0
  const sqH = !isTriangle ? pad*2 + cfg.rows*CS : 0

  const clickH = (r,c) => {
    if (done) return
    const newH = hS.map(row=>[...row])
    const wasOn = newH[r][c]
    if (wasOn && removed >= cfg.moves) return
    newH[r][c] = !wasOn
    const nr = removed + (wasOn ? 1 : -1)
    setHS(newH); setRemoved(nr)
    if (nr===cfg.moves && countSquares(newH,vS,cfg.rows,cfg.cols)===cfg.goal) setDone(true)
  }

  const clickV = (r,c) => {
    if (done) return
    const newV = vS.map(row=>[...row])
    const wasOn = newV[r][c]
    if (wasOn && removed >= cfg.moves) return
    newV[r][c] = !wasOn
    const nr = removed + (wasOn ? 1 : -1)
    setVS(newV); setRemoved(nr)
    if (nr===cfg.moves && countSquares(hS,newV,cfg.rows,cfg.cols)===cfg.goal) setDone(true)
  }

  // ── Triangle helpers ───────────────────────────────────────────────────────
  const clickStick = (sIdx) => {
    if (done) return
    const wasOn = sticksActive[sIdx]
    if (wasOn && removed >= cfg.moves) return
    const newActive = [...sticksActive]
    newActive[sIdx] = !wasOn
    const nr = removed + (wasOn ? 1 : -1)
    setSticksActive(newActive); setRemoved(nr)
    if (nr===cfg.moves && countTriangles(newActive, cfg.triangles)===cfg.goal) setDone(true)
  }

  // ── compute display counts ─────────────────────────────────────────────────
  const shapeCount = isTriangle
    ? countTriangles(sticksActive, cfg.triangles)
    : countSquares(hS, vS, cfg.rows, cfg.cols)
  const shapeLabel = isTriangle
    ? (ar ? 'مثلثات' : 'Triangles')
    : (ar ? 'مربعات' : 'Squares')

  // Bounding box for triangle SVG
  let triVB = '0 0 240 220', triW = 240, triH = 220
  if (isTriangle && cfg.pts) {
    const xs = cfg.pts.map(p=>p[0]), ys = cfg.pts.map(p=>p[1])
    const minX=Math.min(...xs)-12, minY=Math.min(...ys)-12
    const maxX=Math.max(...xs)+12, maxY=Math.max(...ys)+12
    triVB = `${minX} ${minY} ${maxX-minX} ${maxY-minY}`
    triW = maxX-minX; triH = maxY-minY
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 text-center font-medium text-slate-700 text-sm px-4">
        {ar ? cfg.taskAr : cfg.taskEn}
      </div>
      <div className="mb-2 text-sm text-slate-500">
        {ar ? `أُزيل: ${removed} / ${cfg.moves}` : `Removed: ${removed} / ${cfg.moves}`}
        {' · '}
        {ar ? `${shapeLabel}: ${shapeCount} / ${cfg.goal}` : `${shapeLabel}: ${shapeCount} / ${cfg.goal}`}
      </div>
      {hintText && <div className="text-amber-700 bg-amber-50 rounded-xl px-4 py-2 mb-3 text-sm font-medium text-center max-w-xs">{hintText}</div>}
      {done && (
        <div className="text-green-600 font-bold text-lg mb-3">
          {ar ? `أحسنت! تبقّى ${cfg.goal} ${shapeLabel} ✓` : `Well done! ${cfg.goal} ${shapeLabel} remain ✓`}
        </div>
      )}

      {isTriangle ? (
        /* ── Triangle SVG ── */
        <svg width={Math.min(triW, 320)} height={Math.min(triH*Math.min(triW,320)/triW, 220)}
          viewBox={triVB} className="overflow-visible">
          {cfg.sticks.map((stick, sIdx) => {
            const [aIdx, bIdx] = stick
            const [ax, ay] = cfg.pts[aIdx]
            const [bx, by] = cfg.pts[bIdx]
            const on = sticksActive[sIdx]
            const mx=(ax+bx)/2, my=(ay+by)/2
            const len=Math.sqrt((bx-ax)**2+(by-ay)**2)
            const nx=(by-ay)/len*12, ny=(ax-bx)/len*12
            return (
              <g key={`s-${sIdx}`} onClick={() => clickStick(sIdx)} style={{cursor:'pointer'}}>
                <line x1={ax} y1={ay} x2={bx} y2={by}
                  stroke={on ? '#f59e0b' : '#e2e8f0'}
                  strokeWidth={on ? 6 : 3}
                  strokeLinecap="round" />
                {/* wide invisible hit target */}
                <line x1={ax} y1={ay} x2={bx} y2={by}
                  stroke="transparent" strokeWidth={20} strokeLinecap="round" />
              </g>
            )
          })}
          {cfg.pts.map(([x,y], pIdx) => (
            <circle key={`p-${pIdx}`} cx={x} cy={y} r={5} fill="#94a3b8" />
          ))}
        </svg>
      ) : (
        /* ── Square grid SVG ── */
        <svg width={sqW} height={sqH} className="overflow-visible">
          {hS.map((row,r) => row.map((on,c) => (
            <g key={`h-${r}-${c}`} onClick={() => clickH(r,c)} style={{cursor:'pointer'}}>
              <line x1={pad+c*CS} y1={pad+r*CS} x2={pad+(c+1)*CS} y2={pad+r*CS}
                stroke={on?'#f59e0b':'#e2e8f0'} strokeWidth={on?5:3} strokeLinecap="round" />
              <rect x={pad+c*CS-4} y={pad+r*CS-8} width={CS+8} height={16} fill="transparent" />
            </g>
          )))}
          {vS.map((row,r) => row.map((on,c) => (
            <g key={`v-${r}-${c}`} onClick={() => clickV(r,c)} style={{cursor:'pointer'}}>
              <line x1={pad+c*CS} y1={pad+r*CS} x2={pad+c*CS} y2={pad+(r+1)*CS}
                stroke={on?'#f59e0b':'#e2e8f0'} strokeWidth={on?5:3} strokeLinecap="round" />
              <rect x={pad+c*CS-8} y={pad+r*CS-4} width={16} height={CS+8} fill="transparent" />
            </g>
          )))}
          {Array.from({length:cfg.rows+1},(_,r)=>Array.from({length:cfg.cols+1},(_,c)=>(
            <circle key={`dot-${r}-${c}`} cx={pad+c*CS} cy={pad+r*CS} r={4} fill="#94a3b8" />
          )))}
        </svg>
      )}

      <button onClick={init} className="mt-4 px-5 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 text-sm">
        {ar?'إعادة':'Reset'}
      </button>
    </div>
  )
}

// ─── GAME 5: SLIDING PUZZLE ──────────────────────────────────────────────────

function GameSliding({ level, ar, showHint, setHintUsed }) {
  const cfg = SLIDING_CFG[level-1]
  const [tiles, setTiles] = useState([])
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)
  const [hintHighlight, setHintHighlight] = useState(null)

  const init = useCallback(() => {
    setTiles(generatePuzzle(cfg.size, cfg.shuffles))
    setMoves(0); setWon(false); setHintHighlight(null)
  }, [cfg])

  useEffect(() => { init() }, [level])

  useEffect(() => {
    if (!showHint) return
    setHintUsed(true)
    const ep = tiles.indexOf(0)
    const nb = getNeighbors(ep, cfg.size)
    const sol = makeSolved(cfg.size)
    let best = null, bestDist = Infinity
    nb.forEach(n => {
      const val = tiles[n]
      const targetIdx = sol.indexOf(val)
      const curR=Math.floor(n/cfg.size), curC=n%cfg.size
      const tarR=Math.floor(targetIdx/cfg.size), tarC=targetIdx%cfg.size
      const dist = Math.abs(curR-tarR)+Math.abs(curC-tarC)
      if (dist < bestDist) { bestDist=dist; best=n }
    })
    setHintHighlight(best)
    setTimeout(() => setHintHighlight(null), 1500)
  }, [showHint])

  const clickTile = (idx) => {
    if (won) return
    const ep = tiles.indexOf(0)
    if (!getNeighbors(ep, cfg.size).includes(idx)) return
    const newTiles = [...tiles]
    ;[newTiles[ep],newTiles[idx]]=[newTiles[idx],newTiles[ep]]
    setTiles(newTiles); setMoves(m=>m+1)
    if (isSolved(newTiles, cfg.size)) setWon(true)
  }

  const tileSize = cfg.size === 3 ? 80 : 64
  const fontSize = cfg.size === 3 ? 'text-2xl' : 'text-lg'

  if (won) return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🏆</div>
      <div className="text-2xl font-bold text-green-600 mb-2">{ar?'حللت البازل!':'Puzzle Solved!'}</div>
      <div className="text-slate-600 mb-6">{ar?`في ${moves} حركة`:`In ${moves} moves`}</div>
      <button onClick={init} className="px-6 py-2 bg-[#0E1F39] text-white rounded-xl font-bold hover:opacity-90">
        {ar?'العب مجدداً':'Play Again'}
      </button>
    </div>
  )

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm text-slate-500 mb-4">{ar?`حركات: ${moves}`:`Moves: ${moves}`}</div>
      <div className="grid gap-1" style={{gridTemplateColumns:`repeat(${cfg.size},minmax(0,1fr))`}}>
        {tiles.map((val,idx) => (
          <button key={idx} onClick={() => clickTile(idx)}
            style={{width:tileSize, height:tileSize}}
            className={`rounded-xl font-bold ${fontSize} flex items-center justify-center transition-all duration-150
              ${val===0 ? 'bg-slate-200 cursor-default' :
                hintHighlight===idx ? 'bg-amber-300 border-2 border-amber-500 scale-105 shadow-md' :
                'bg-[#0E1F39] text-white hover:bg-slate-700 hover:scale-105 shadow'}`}>
            {val !== 0 ? val : ''}
          </button>
        ))}
      </div>
      <button onClick={init} className="mt-4 px-5 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 text-sm">
        {ar?'إعادة':'Shuffle'}
      </button>
    </div>
  )
}

// ─── GAME 6 DATA: LINE VARIETY ──────────────────────────────────────────────
// Diverse puzzle types: add stroke · remove stroke · Roman numerals · inequality · drawing
// method labels shown as colour-coded badges on each puzzle

const METHOD_LABEL = {
  add:        { ar:'➕ أضف خطاً واحداً فقط لتصحيح المعادلة',          en:'➕ Add exactly ONE stroke to fix the equation'    },
  remove:     { ar:'➖ أزل خطاً واحداً فقط لتصحيح المعادلة',          en:'➖ Remove exactly ONE stroke to fix the equation'  },
  roman:      { ar:'🏛️ صحّح المعادلة الرومانية بإضافة أو حذف رمز',   en:'🏛️ Fix the Roman numeral — add or remove one symbol' },
  inequality: { ar:'↔️ أضف خطاً واحداً فقط لتصحيح المتراجحة',        en:'↔️ Add ONE stroke to fix the inequality'            },
}

const LINE_PUZZLES = [
  // ── Add one stroke (5 puzzles) ────────────────────────────────────────────
  {
    type:'mcq', method:'add',
    displayAr:'8 − 3 = 11',   displayEn:'8 − 3 = 11',
    hintAr:'أضف خطاً رأسياً للإشارة "−" لتصبح "+"',
    hintEn:'Add a vertical stroke to "−" to turn it into "+"',
    opts:[
      { text:'8 + 3 = 11', correct:true  },
      { text:'8 − 3 = 41', correct:false },
      { text:'18 − 3 = 11', correct:false },
      { text:'8 − 3 = 14', correct:false },
    ],
  },
  {
    type:'mcq', method:'add',
    displayAr:'3 − 1 = 4',   displayEn:'3 − 1 = 4',
    hintAr:'أضف خطاً رأسياً للإشارة "−" لتصبح "+"',
    hintEn:'Add a vertical stroke to "−" to turn it into "+"',
    opts:[
      { text:'3 + 1 = 4', correct:true  },
      { text:'3 − 7 = 4', correct:false },
      { text:'8 − 1 = 4', correct:false },
      { text:'3 − 1 = 7', correct:false },
    ],
  },
  {
    type:'mcq', method:'add',
    displayAr:'9 − 3 = 5',   displayEn:'9 − 3 = 5',
    hintAr:'أضف شريحة للرقم 5 في الناتج ليصبح 6',
    hintEn:'Add one segment to the result "5" to make "6"',
    opts:[
      { text:'9 − 3 = 6', correct:true  },
      { text:'9 + 3 = 5', correct:false },
      { text:'9 − 3 = 9', correct:false },
      { text:'9 − 8 = 5', correct:false },
    ],
  },
  {
    type:'mcq', method:'add',
    displayAr:'5 + 5 + 5 = 550',   displayEn:'5 + 5 + 5 = 550',
    hintAr:'أضف خطاً للـ "+" الثاني ليصبح "4" — ٥ + ٥٤٥ = ٥٥٠',
    hintEn:'Add a line to the second "+" to make it "4" — 5 + 545 = 550',
    opts:[
      { text:'5 + 545 = 550',   correct:true  },
      { text:'55 + 5 = 550',    correct:false },
      { text:'5 + 5 × 5 = 550', correct:false },
      { text:'5 + 5 + 5 = 555', correct:false },
    ],
  },
  {
    type:'mcq', method:'add',
    displayAr:'1 + 6 = 9',   displayEn:'1 + 6 = 9',
    hintAr:'أضف شريحة للرقم 6 ليصبح 8 — ١ + ٨ = ٩',
    hintEn:'Add one segment to "6" to make "8" — 1 + 8 = 9',
    opts:[
      { text:'1 + 8 = 9', correct:true  },
      { text:'7 + 6 = 9', correct:false },
      { text:'1 + 9 = 9', correct:false },
      { text:'1 + 6 = 8', correct:false },
    ],
  },
  // ── Remove one stroke (2 puzzles) ─────────────────────────────────────────
  {
    type:'mcq', method:'remove',
    displayAr:'8 + 3 = 5',   displayEn:'8 + 3 = 5',
    hintAr:'أزل الخط الرأسي من "+" لتصبح "−"',
    hintEn:'Remove the vertical stroke from "+" to turn it into "−"',
    opts:[
      { text:'8 − 3 = 5', correct:true  },
      { text:'8 + 3 = 11', correct:false },
      { text:'0 + 3 = 5',  correct:false },
      { text:'8 + 2 = 5',  correct:false },
    ],
  },
  {
    type:'mcq', method:'remove',
    displayAr:'9 + 4 = 5',   displayEn:'9 + 4 = 5',
    hintAr:'أزل الخط الرأسي من "+" لتصبح "−"',
    hintEn:'Remove the vertical stroke from "+" to turn it into "−"',
    opts:[
      { text:'9 − 4 = 5', correct:true  },
      { text:'9 + 4 = 13', correct:false },
      { text:'9 + 1 = 5',  correct:false },
      { text:'0 + 4 = 5',  correct:false },
    ],
  },
  // ── Roman numerals (3 puzzles) ────────────────────────────────────────────
  {
    type:'mcq', method:'roman',
    displayAr:'VI + I = VIII',   displayEn:'VI + I = VIII',
    hintAr:'٦ + ١ = ٧، وليس ٨ — غيّر الطرف الأيسر',
    hintEn:'6 + 1 = 7, not 8 — fix the left side',
    opts:[
      { text:'VII + I = VIII', correct:true  },
      { text:'VI + II = VIII', correct:false },
      { text:'VI + I = VII',   correct:false },
      { text:'IV + I = VIII',  correct:false },
    ],
  },
  {
    type:'mcq', method:'roman',
    displayAr:'III − I = III',   displayEn:'III − I = III',
    hintAr:'٣ − ١ = ٢، وليس ٣ — صحّح الناتج',
    hintEn:'3 − 1 = 2, not 3 — fix the result',
    opts:[
      { text:'III − I = II', correct:true  },
      { text:'II − I = III', correct:false },
      { text:'III − I = I',  correct:false },
      { text:'III + I = III', correct:false },
    ],
  },
  {
    type:'mcq', method:'roman',
    displayAr:'IX − I = VII',   displayEn:'IX − I = VII',
    hintAr:'٩ − ١ = ٨، وليس ٧ — صحّح الناتج',
    hintEn:'9 − 1 = 8, not 7 — correct the result',
    opts:[
      { text:'IX − I = VIII', correct:true  },
      { text:'X − I = VII',   correct:false },
      { text:'IX − II = VII', correct:false },
      { text:'IX − I = IX',   correct:false },
    ],
  },
  // ── Inequality (2 puzzles) ────────────────────────────────────────────────
  {
    type:'mcq', method:'inequality',
    displayAr:'3 > 5',   displayEn:'3 > 5',
    hintAr:'أضف شريحة للرقم 3 ليصبح 9 — ٩ > ٥ صحيح',
    hintEn:'Add one segment to "3" to make "9" — 9 > 5 is true',
    opts:[
      { text:'9 > 5', correct:true  },
      { text:'3 > 8', correct:false },
      { text:'3 < 5', correct:false },
      { text:'3 > 9', correct:false },
    ],
  },
  {
    type:'mcq', method:'inequality',
    displayAr:'2 < 1',   displayEn:'2 < 1',
    hintAr:'أضف خطاً أفقياً أعلى الرقم 1 ليصبح 7 — ٢ < ٧ صحيح',
    hintEn:'Add a top stroke to "1" to make "7" — 2 < 7 is true',
    opts:[
      { text:'2 < 7', correct:true  },
      { text:'2 < 4', correct:false },
      { text:'2 > 1', correct:false },
      { text:'8 < 1', correct:false },
    ],
  },
  // ── Drawing puzzles (3 puzzles) ───────────────────────────────────────────
  // dots: [x,y] array in a 260×260 viewBox
  // existingLines: pairs of dot indices already drawn
  // solutions: all valid [a,b] (or [b,a]) lines that complete the shape
  {
    type:'draw',
    titleAr:'🟦 أكمل المربع — ارسم الضلع المفقود',
    titleEn:'🟦 Complete the Square — draw the missing side',
    hintAr:'المربع ينقصه الضلع الأيسر — انقر على الزاوية العلوية اليسرى ثم السفلية اليسرى',
    hintEn:'The square is missing its left side — click top-left dot then bottom-left dot',
    dots:[[40,40],[220,40],[220,220],[40,220]],
    existingLines:[[0,1],[1,2],[2,3]],   // top, right, bottom — missing: left (3→0)
    solutions:[[3,0],[0,3]],
  },
  {
    type:'draw',
    titleAr:'🔺 أكمل المثلث — ارسم الضلع المفقود',
    titleEn:'🔺 Complete the Triangle — draw the missing side',
    hintAr:'المثلث ينقصه الضلع الأيمن — انقر على القمة العلوية ثم الزاوية السفلية اليمنى',
    hintEn:'The triangle is missing its right side — click the top vertex then the bottom-right corner',
    dots:[[130,25],[25,215],[235,215]],
    existingLines:[[0,1],[1,2]],         // left side, base — missing: right side (0→2)
    solutions:[[0,2],[2,0]],
  },
  {
    type:'draw',
    titleAr:'💎 أكمل المعين — ارسم الضلع المفقود',
    titleEn:'💎 Complete the Diamond — draw the missing side',
    hintAr:'المعين ينقصه الضلع العلوي الأيسر — انقر على أعلى نقطة ثم النقطة اليسرى',
    hintEn:'The diamond is missing its top-left side — click the top dot then the left dot',
    dots:[[130,20],[230,130],[130,240],[30,130]],
    existingLines:[[0,1],[1,2],[2,3]],   // top-right, right-bottom, bottom-left — missing: left-top (3→0)
    solutions:[[3,0],[0,3]],
  },
]

// ─── GAME 6: LINE VARIETY ─────────────────────────────────────────────────────

const METHOD_COLORS = {
  add:        { bg:'#ecfdf5', border:'#4ade80', text:'#166534' },
  remove:     { bg:'#fff1f2', border:'#fca5a5', text:'#991b1b' },
  roman:      { bg:'#faf5ff', border:'#c084fc', text:'#6b21a8' },
  inequality: { bg:'#eff6ff', border:'#93c5fd', text:'#1e40af' },
}

function GameLineVariety({ ar, showHint, setHintUsed }) {
  const [idx, setIdx]           = useState(0)
  const [chosen, setChosen]     = useState(null)
  const [result, setResult]     = useState(null)    // 'correct' | 'wrong' | null
  const [hintText, setHintText] = useState('')
  const [score, setScore]       = useState(0)
  const [done, setDone]         = useState(false)
  // Drawing state
  const [dotA, setDotA]         = useState(null)    // index of first selected dot
  const [drawnLine, setDrawnLine] = useState(null)  // [a, b] indices

  const restart = () => {
    setIdx(0); setChosen(null); setResult(null); setHintText('')
    setScore(0); setDone(false); setDotA(null); setDrawnLine(null)
  }

  useEffect(() => { restart() }, [])

  useEffect(() => {
    if (!showHint) return
    setHintUsed(true)
    const cur = LINE_PUZZLES[idx]
    setHintText(ar ? cur.hintAr : cur.hintEn)
  }, [showHint])

  const advance = () => {
    if (idx + 1 >= LINE_PUZZLES.length) { setDone(true) }
    else {
      setIdx(i => i + 1)
      setChosen(null); setResult(null); setHintText('')
      setDotA(null); setDrawnLine(null)
    }
  }

  // ── MCQ pick ────────────────────────────────────────────────────────────────
  const pick = (optIdx) => {
    if (result) return
    const isOk = LINE_PUZZLES[idx].opts[optIdx].correct
    setChosen(optIdx)
    setResult(isOk ? 'correct' : 'wrong')
    if (isOk) setScore(s => s + 1)
    setTimeout(advance, 900)
  }

  // ── Drawing: click a dot ─────────────────────────────────────────────────
  const clickDot = (dIdx) => {
    if (result) return
    if (dotA === null) {
      setDotA(dIdx)
    } else {
      if (dotA === dIdx) { setDotA(null); return }  // deselect same dot
      const cur = LINE_PUZZLES[idx]
      const isOk = cur.solutions.some(([a, b]) =>
        (dotA === a && dIdx === b) || (dotA === b && dIdx === a)
      )
      setDrawnLine([dotA, dIdx])
      setResult(isOk ? 'correct' : 'wrong')
      if (isOk) setScore(s => s + 1)
      setDotA(null)
      if (isOk) {
        setTimeout(advance, 1200)
      } else {
        // Let them retry on wrong draw
        setTimeout(() => { setResult(null); setDrawnLine(null) }, 1000)
      }
    }
  }

  if (done) return (
    <div className="text-center py-10 flex flex-col items-center gap-4">
      <div style={{ fontSize:'3rem' }}>🎉</div>
      <div style={{ fontSize:'1.5rem', fontWeight:900, color:'#0E1F39' }}>
        {ar ? 'أنهيت جميع الألغاز!' : 'All puzzles complete!'}
      </div>
      <div style={{ fontSize:'1.1rem', fontWeight:700, color:'#FCAD0F' }}>
        {ar ? `نتيجتك: ${score} / ${LINE_PUZZLES.length}` : `Score: ${score} / ${LINE_PUZZLES.length}`}
      </div>
      <button onClick={restart} style={{
        background:'#0E1F39', color:'#fff', border:'none', borderRadius:12,
        padding:'10px 28px', fontWeight:800, fontSize:'1rem', cursor:'pointer',
      }}>
        {ar ? 'العب مجدداً' : 'Play Again'}
      </button>
    </div>
  )

  const cur    = LINE_PUZZLES[idx]
  const isDraw = cur.type === 'draw'
  const mc     = cur.method ? METHOD_COLORS[cur.method] : { bg:'#f8fafc', border:'#e2e8f0', text:'#0E1F39' }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', gap:10 }}>

      {/* ── Progress row ─────────────────────────────────────────────────────── */}
      <div style={{ flexShrink:0, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#94a3b8' }}>
          {idx + 1} / {LINE_PUZZLES.length}
        </span>
        <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#FCAD0F' }}>✓ {score}</span>
      </div>

      {/* ── Method badge (MCQ only) ───────────────────────────────────────────── */}
      {!isDraw && cur.method && (
        <div style={{
          flexShrink:0, textAlign:'center', fontWeight:700, fontSize:'0.82rem',
          background:mc.bg, border:`1px solid ${mc.border}`, color:mc.text,
          borderRadius:10, padding:'6px 12px',
        }}>
          {ar ? METHOD_LABEL[cur.method].ar : METHOD_LABEL[cur.method].en}
        </div>
      )}

      {isDraw ? (
        /* ════════════════════════════════════════════════════════════════════
           DRAWING PUZZLE
           ════════════════════════════════════════════════════════════════════ */
        <>
          <div style={{ flexShrink:0, textAlign:'center', fontWeight:800, fontSize:'1rem', color:'#0E1F39' }}>
            {ar ? cur.titleAr : cur.titleEn}
          </div>
          <div style={{ flexShrink:0, textAlign:'center', fontSize:'0.78rem', color:'#64748b' }}>
            {ar ? 'انقر على نقطتين لرسم الضلع المفقود' : 'Click two dots to draw the missing side'}
          </div>

          {hintText && (
            <div style={{
              flexShrink:0, background:'rgba(252,173,15,0.1)', border:'1px solid rgba(252,173,15,0.4)',
              borderRadius:12, padding:'7px 12px', textAlign:'center',
              color:'#92610a', fontWeight:600, fontSize:'0.82rem', direction: ar ? 'rtl' : 'ltr',
            }}>💡 {hintText}</div>
          )}

          {/* SVG canvas */}
          <div style={{ flex:1, minHeight:0, display:'flex', justifyContent:'center', alignItems:'center' }}>
            <svg viewBox="0 0 260 260"
              style={{ width:'min(260px, 100%)', height:'min(260px, 100%)', display:'block' }}>
              {/* Dark background */}
              <rect width="260" height="260" rx="18" fill="#0E1F39" />

              {/* Existing (correct) lines */}
              {cur.existingLines.map(([a, b], i) => (
                <line key={`ex-${i}`}
                  x1={cur.dots[a][0]} y1={cur.dots[a][1]}
                  x2={cur.dots[b][0]} y2={cur.dots[b][1]}
                  stroke="#FCAD0F" strokeWidth="5" strokeLinecap="round" />
              ))}

              {/* Drawn line feedback */}
              {drawnLine && (
                <line
                  x1={cur.dots[drawnLine[0]][0]} y1={cur.dots[drawnLine[0]][1]}
                  x2={cur.dots[drawnLine[1]][0]} y2={cur.dots[drawnLine[1]][1]}
                  stroke={result === 'correct' ? '#4ade80' : '#ef4444'}
                  strokeWidth="5" strokeLinecap="round" strokeDasharray="10 5" />
              )}

              {/* Dots */}
              {cur.dots.map(([x, y], dIdx) => {
                const isSelected = dIdx === dotA
                return (
                  <g key={`dot-${dIdx}`} onClick={() => clickDot(dIdx)} style={{ cursor:'pointer' }}>
                    {/* Wide invisible hit target */}
                    <circle cx={x} cy={y} r={22} fill="transparent" />
                    {/* Outer ring when selected */}
                    {isSelected && <circle cx={x} cy={y} r={16} fill="none" stroke="#FCAD0F" strokeWidth="2" opacity={0.5} />}
                    {/* Dot */}
                    <circle cx={x} cy={y} r={isSelected ? 12 : 9}
                      fill={isSelected ? '#FCAD0F' : 'rgba(255,255,255,0.9)'}
                      stroke={isSelected ? '#e09b00' : '#FCAD0F'} strokeWidth="2" />
                    {/* Dot number */}
                    <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle"
                      fill={isSelected ? '#0E1F39' : '#FCAD0F'}
                      fontSize="9" fontWeight="800" style={{ userSelect:'none' }}>
                      {dIdx + 1}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Status messages */}
          {result === 'correct' && (
            <div style={{ flexShrink:0, textAlign:'center', fontWeight:800, color:'#16a34a', fontSize:'1rem' }}>
              ✓ {ar ? 'رائع! أتممت الشكل!' : 'Well done! Shape complete!'}
            </div>
          )}
          {result === 'wrong' && (
            <div style={{ flexShrink:0, textAlign:'center', fontWeight:800, color:'#dc2626', fontSize:'0.9rem' }}>
              ✗ {ar ? 'ليس هذا الضلع المفقود — حاول مجدداً' : 'Not the missing side — try again!'}
            </div>
          )}
          {dotA !== null && !result && (
            <div style={{ flexShrink:0, textAlign:'center', fontSize:'0.78rem', color:'#FCAD0F', fontWeight:700 }}>
              {ar ? `النقطة ${dotA + 1} محددة — انقر على نقطة أخرى` : `Dot ${dotA + 1} selected — click another dot`}
            </div>
          )}
        </>

      ) : (
        /* ════════════════════════════════════════════════════════════════════
           MCQ PUZZLE (add / remove / roman / inequality)
           ════════════════════════════════════════════════════════════════════ */
        <>
          {/* Equation display */}
          <div style={{
            flexShrink:0, background:'#0E1F39', borderRadius:18, padding:'18px 20px', textAlign:'center',
          }}>
            <div style={{
              fontFamily:"'Courier New', 'Lucida Console', monospace",
              fontSize:'clamp(1.5rem, 4vw, 2.5rem)',
              fontWeight:900, color:'#FCAD0F', letterSpacing:'4px', direction:'ltr',
            }}>
              {ar ? cur.displayAr : cur.displayEn}
            </div>
            <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.4)', marginTop:6 }}>
              {ar ? '— هذا خاطئ —' : '— this is wrong —'}
            </div>
          </div>

          {/* Hint */}
          {hintText && (
            <div style={{
              flexShrink:0, background:'rgba(252,173,15,0.1)', border:'1px solid rgba(252,173,15,0.4)',
              borderRadius:12, padding:'8px 14px', textAlign:'center',
              color:'#92610a', fontWeight:600, fontSize:'0.85rem', direction: ar ? 'rtl' : 'ltr',
            }}>
              💡 {hintText}
            </div>
          )}

          {/* Options 2×2 grid */}
          <div style={{ flex:1, minHeight:0, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {cur.opts.map((opt, i) => {
              const isChosen  = chosen === i
              const isCorrect = opt.correct
              let bg     = '#f8fafc'
              let border = '2px solid #e2e8f0'
              let color  = '#0E1F39'
              if (result && isCorrect)                   { bg='#f0fdf4'; border='2px solid #4ade80'; color='#166534' }
              else if (result && isChosen && !isCorrect) { bg='#fef2f2'; border='2px solid #fca5a5'; color='#991b1b' }
              return (
                <button key={i} onClick={() => pick(i)} style={{
                  background:bg, border, color, borderRadius:14,
                  fontFamily:"'Courier New', monospace",
                  fontSize:'clamp(0.85rem, 1.6vw, 1.1rem)',
                  fontWeight:800, cursor: result ? 'default' : 'pointer',
                  letterSpacing:'1px', direction:'ltr', transition:'all 0.15s',
                  display:'flex', alignItems:'center', justifyContent:'center', padding:'10px 6px',
                }}>
                  {opt.text}
                </button>
              )
            })}
          </div>

          {/* Feedback */}
          {result === 'correct' && (
            <div style={{ flexShrink:0, textAlign:'center', fontWeight:800, color:'#16a34a', fontSize:'1rem' }}>
              ✓ {ar ? 'إجابة صحيحة!' : 'Correct!'}
            </div>
          )}
          {result === 'wrong' && (
            <div style={{ flexShrink:0, textAlign:'center', fontWeight:800, color:'#dc2626', fontSize:'1rem' }}>
              ✗ {ar ? 'خطأ! الجواب الصحيح مظلل بالأخضر' : 'Wrong! The correct answer is highlighted'}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── GAME 7 DATA: POINT BOXES ────────────────────────────────────────────────
// (formerly Game 6 — renamed after Add-One-Line was inserted before it)
// 10 difficulty levels — questions get harder as points increase

const POINTBOX_QUESTIONS = {
  1: [
    { ar:'ما هو أشهر برنامج لتصفح الإنترنت؟', en:'What is the most popular web browser?' },
    { ar:'ماذا يعني اختصار WWW؟', en:'What does WWW stand for?' },
    { ar:'ما هو الفيروس في عالم الحاسوب؟', en:'What is a computer virus?' },
  ],
  2: [
    { ar:'ما معنى كلمة "IP" في عالم الشبكات؟', en:'What does "IP" mean in networking?' },
    { ar:'ما الفرق بين HTTP وHTTPS؟', en:'What is the difference between HTTP and HTTPS?' },
    { ar:'ما هو جدار الحماية (Firewall)?', en:'What is a Firewall?' },
  ],
  3: [
    { ar:'ما هو هجوم التصيد الاحتيالي (Phishing)?', en:'What is a Phishing attack?' },
    { ar:'ما الفرق بين اسم المستخدم وكلمة المرور؟', en:'What is the difference between username and password?' },
    { ar:'ما هو التشفير (Encryption)?', en:'What is Encryption?' },
  ],
  4: [
    { ar:'اذكر ثلاثة أنواع من البرمجيات الخبيثة', en:'Name three types of malware' },
    { ar:'ما هو مثلث CIA في الأمن السيبراني؟', en:'What is the CIA triad in cybersecurity?' },
    { ar:'ما معنى VPN وما فائدته؟', en:'What does VPN mean and what is it used for?' },
  ],
  5: [
    { ar:'ما هو هجوم Man-in-the-Middle؟', en:'What is a Man-in-the-Middle attack?' },
    { ar:'ما الفرق بين الهاكر الأخلاقي والخبيث؟', en:'What is the difference between ethical and malicious hackers?' },
    { ar:'ما هو برنامج Wireshark ويستخدم لماذا؟', en:'What is Wireshark used for?' },
  ],
  6: [
    { ar:'اشرح كيف يعمل هجوم DoS/DDoS', en:'Explain how a DoS/DDoS attack works' },
    { ar:'ما الفرق بين المسح (Scanning) والاستطلاع (Reconnaissance)?', en:'What is the difference between Scanning and Reconnaissance?' },
    { ar:'ما هو الـ Port وكم عدده الأقصى؟', en:'What is a Port and what is the maximum number?' },
  ],
  7: [
    { ar:'ما هو SQL Injection وكيف يعمل؟', en:'What is SQL Injection and how does it work?' },
    { ar:'اشرح الفرق بين التشفير المتماثل وغير المتماثل', en:'Explain the difference between symmetric and asymmetric encryption' },
    { ar:'ما هو الـ Hash وأين يُستخدم في الأمن؟', en:'What is a Hash and where is it used in security?' },
  ],
  8: [
    { ar:'ما هو هجوم XSS (Cross-Site Scripting)?', en:'What is an XSS (Cross-Site Scripting) attack?' },
    { ar:'اشرح مراحل اختبار الاختراق (Pen Testing)', en:'Explain the phases of penetration testing' },
    { ar:'ما هو الـ Buffer Overflow وكيف يُستغل؟', en:'What is Buffer Overflow and how is it exploited?' },
  ],
  9: [
    { ar:'ما هو الـ Zero-Day وكيف يُستغل من قِبَل المهاجمين؟', en:'What is a Zero-Day vulnerability and how is it exploited?' },
    { ar:'اشرح كيف يعمل بروتوكول TLS لتأمين الاتصالات', en:'Explain how TLS protocol secures communications' },
    { ar:'ما هو الـ Privilege Escalation في اختبار الاختراق؟', en:'What is Privilege Escalation in penetration testing?' },
  ],
  10: [
    { ar:'اشرح هجوم SSRF (Server-Side Request Forgery) مع مثال', en:'Explain an SSRF attack with an example' },
    { ar:'كيف يعمل هجوم Race Condition؟ اذكر سيناريو استغلال', en:'How does a Race Condition attack work? Give an exploitation scenario' },
    { ar:'ما الفرق بين CVE وCWE وNVD في عالم الثغرات الأمنية؟', en:'What is the difference between CVE, CWE, and NVD in vulnerability management?' },
  ],
}

// ─── GAME 7 DATA: BIDDING ────────────────────────────────────────────────────

const BIDDING_QUESTIONS = [
  { ar:'اشرح مفهوم الأمن السيبراني بكلماتك الخاصة', en:'Explain cybersecurity in your own words' },
  { ar:'ما الفرق بين الـ White Hat والـ Black Hat؟', en:'What is the difference between White Hat and Black Hat hackers?' },
  { ar:'اذكر ثلاث طرق لحماية كلمة المرور', en:'Name three ways to protect your password' },
  { ar:'ما هو الـ Social Engineering وكيف تحمي نفسك منه؟', en:'What is Social Engineering and how do you protect yourself?' },
  { ar:'اشرح مفهوم مثلث CIA مع مثال لكل عنصر', en:'Explain the CIA triad with an example for each element' },
  { ar:'ما أهمية النسخ الاحتياطي (Backup) في أمن المعلومات؟', en:'Why is Backup important in information security?' },
  { ar:'اشرح الفرق بين الـ Authentication والـ Authorization', en:'Explain the difference between Authentication and Authorization' },
  { ar:'متى تكون كلمة المرور قوية؟ اذكر المعايير', en:'When is a password strong? List the criteria' },
  { ar:'ما هو الـ Honeypot ولماذا يستخدمه المختصون؟', en:'What is a Honeypot and why do security professionals use it?' },
  { ar:'اشرح دورة حياة الهجوم السيبراني (Cyber Kill Chain)', en:'Explain the Cyber Kill Chain lifecycle' },
  { ar:'ما الفرق بين IDS وIPS وكيف يعمل كلٌّ منهما؟', en:'What is the difference between IDS and IPS?' },
  { ar:'ما هو الـ OSINT وكيف يستخدمه الهاكر الأخلاقي؟', en:'What is OSINT and how does an ethical hacker use it?' },
]

// ─── SHARED: QUESTION BANK HOOK + PICKER ────────────────────────────────────

const SUBJECT_LABELS = {
  Ethical_Hacking_1:      'اختراق أخلاقي 1',
  Ethical_Hacking_2:      'اختراق أخلاقي 2',
  Explore_AI:             'الذكاء الاصطناعي',
  Game_Design_1:          'تصميم الألعاب',
  Online_Ethical_Hacking: 'اختراق أخلاقي أونلاين',
  Robotics:               'الروبوتات',
}

function useQuestionBank() {
  const [subjects, setSubjects] = useState([])
  const [selected, setSelected] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    fetch('/api/xo/subjects')
      .then(r => r.json())
      .then(d => setSubjects(d.subjects || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selected.length) { setQuestions([]); return }
    setLoading(true)
    Promise.all(
      selected.map(s =>
        fetch(`/api/xo/questions?subject=${encodeURIComponent(s)}`)
          .then(r => r.json()).then(d => d.questions || []).catch(() => [])
      )
    ).then(arrays => { setQuestions(arrays.flat()); setLoading(false) })
  }, [selected])

  const toggle    = s => setSelected(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])
  const toggleAll = () => setSelected(p => p.length === subjects.length ? [] : [...subjects])
  return { subjects, selected, questions, loading, toggle, toggleAll }
}

function QuestionBankPicker({ bank, ar }) {
  const [open, setOpen] = useState(false)
  const { subjects, selected, questions, loading, toggle, toggleAll } = bank
  return (
    <div style={{ flexShrink: 0, position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 12,
        border: selected.length ? '1.5px solid #FCAD0F' : '1.5px solid #e2e8f0',
        background: selected.length ? 'rgba(252,173,15,0.09)' : '#f8fafc',
        color: '#0E1F39', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all 0.15s',
      }}>
        📚 {ar ? 'بنك الأسئلة' : 'Question Bank'}
        {selected.length > 0 && (
          <span style={{ background: '#FCAD0F', color: '#0E1F39', borderRadius: 999,
            padding: '1px 7px', fontSize: '0.7rem', fontWeight: 900 }}>
            {loading ? '…' : questions.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, zIndex: 200,
          background: '#fff', borderRadius: 16, padding: 16,
          boxShadow: '0 8px 32px rgba(14,31,57,0.18)',
          border: '1.5px solid rgba(14,31,57,0.1)',
          minWidth: 270, marginTop: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0E1F39' }}>
              {ar ? 'اختر المواد' : 'Select Subjects'}
            </span>
            <button onClick={toggleAll} style={{
              padding: '3px 10px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: '#f8fafc', color: '#64748b', fontSize: '0.72rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {selected.length === subjects.length
                ? (ar ? 'إلغاء الكل' : 'Clear all')
                : (ar ? 'اختر الكل' : 'All')}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {subjects.map(s => {
              const active = selected.includes(s)
              return (
                <button key={s} onClick={() => toggle(s)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 10,
                  border: active ? '1.5px solid #FCAD0F' : '1.5px solid #e2e8f0',
                  background: active ? 'rgba(252,173,15,0.09)' : '#fafafa',
                  color: '#0E1F39', fontWeight: 700, fontSize: '0.8rem',
                  cursor: 'pointer', textAlign: 'right', transition: 'all 0.12s',
                  fontFamily: 'inherit', width: '100%',
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: active ? 'none' : '2px solid #cbd5e1',
                    background: active ? '#FCAD0F' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem',
                  }}>{active ? '✓' : ''}</span>
                  {SUBJECT_LABELS[s] || s.replace(/_/g, ' ')}
                </button>
              )
            })}
          </div>

          {loading && (
            <div style={{ textAlign: 'center', marginTop: 10, color: '#94a3b8', fontSize: '0.8rem' }}>
              {ar ? 'جاري التحميل…' : 'Loading…'}
            </div>
          )}
          {!loading && selected.length > 0 && (
            <div style={{ marginTop: 8, textAlign: 'center', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
              {questions.length} {ar ? 'سؤال متاح' : 'questions available'}
            </div>
          )}

          <button onClick={() => setOpen(false)} style={{
            marginTop: 12, width: '100%', background: '#0E1F39', color: '#fff',
            border: 'none', borderRadius: 10, padding: '8px', fontWeight: 800,
            fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {ar ? 'حسناً ✓' : 'Done ✓'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── SHARED: TRAINER-UPLOADED QUESTIONS (upload on the fly + template) ────────
function parseCsvRows(text) {
  const rows = []; let row = [], cur = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++ } else inQ = false }
      else cur += c
    } else if (c === '"') inQ = true
    else if (c === ',') { row.push(cur); cur = '' }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
    else if (c !== '\r') cur += c
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row) }
  return rows.filter(r => r.some(cell => (cell || '').trim() !== ''))
}

// Parse an uploaded file (CSV or JSON) into [{ question, answer }]
function parseUploadedQuestions(name, text) {
  if (/\.json$/i.test(name)) {
    try {
      const data = JSON.parse(text)
      const arr = Array.isArray(data) ? data : (data.questions || [])
      return arr.map(x => typeof x === 'string'
        ? { question: x.trim(), answer: '' }
        : { question: (x.question || x.ar || x.q || '').trim(), answer: (x.answer || x.a || '').trim() }
      ).filter(x => x.question)
    } catch { return [] }
  }
  const rows = parseCsvRows(text)
  if (!rows.length) return []
  const h0 = (rows[0][0] || '').trim().toLowerCase()
  const start = (h0 === 'question' || h0 === 'q' || h0 === 'سؤال') ? 1 : 0
  const out = []
  for (let i = start; i < rows.length; i++) {
    const q = (rows[i][0] || '').trim()
    if (q) out.push({ question: q, answer: (rows[i][1] || '').trim() })
  }
  return out
}

function downloadQuestionTemplate(ar) {
  const csv =
    'question,answer\n' +
    '"' + (ar ? 'اكتب سؤالك هنا' : 'Write your question here') + '","' + (ar ? 'الإجابة النموذجية (اختياري)' : 'Model answer (optional)') + '"\n' +
    '"ما هو التصيّد الاحتيالي (Phishing)؟","خداع المستخدم لسرقة بياناته"\n' +
    '"What is a strong password?","Long, unique, with symbols and numbers"\n'
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'questions-template.csv'
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Trainer control: download a ready template, then upload your own questions on the fly.
function CustomQuestionsControl({ custom, setCustom, ar }) {
  const inputRef = useRef(null)
  const onFile = e => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCustom(parseUploadedQuestions(file.name, String(reader.result || '')))
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }
  const btn = {
    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 12,
    border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0E1F39',
    fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
  }
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
      <button onClick={() => downloadQuestionTemplate(ar)} style={btn} title={ar ? 'نموذج جاهز للمدرّب' : 'Ready-made template for trainers'}>
        ⬇️ {ar ? 'تنزيل القالب' : 'Template'}
      </button>
      <button onClick={() => inputRef.current && inputRef.current.click()}
        style={{ ...btn, border: custom.length ? '1.5px solid #FCAD0F' : btn.border, background: custom.length ? 'rgba(252,173,15,0.09)' : btn.background }}>
        ⬆️ {ar ? 'رفع أسئلتي' : 'Upload'}
        {custom.length > 0 && (
          <span style={{ background: '#FCAD0F', color: '#0E1F39', borderRadius: 999, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 900 }}>{custom.length}</span>
        )}
      </button>
      <input ref={inputRef} type="file" accept=".csv,.json,text/csv,application/json" onChange={onFile} style={{ display: 'none' }} />
      {custom.length > 0 && (
        <button onClick={() => setCustom([])} style={{ ...btn, padding: '6px 10px', color: '#dc2626' }} title={ar ? 'مسح أسئلتي' : 'Clear'}>✕</button>
      )}
    </div>
  )
}

// ─── GAME 6: POINT BOXES ─────────────────────────────────────────────────────

function GamePointBoxes({ ar }) {
  const bank = useQuestionBank()
  const [custom, setCustom]       = useState([])
  const effQs = custom.length ? custom : bank.questions
  const [scores, setScores]       = useState({ A: 0, B: 0 })
  const [usedBoxes, setUsedBoxes] = useState(new Set())
  const [activeBox, setActiveBox] = useState(null)   // null | 1-10
  const [question, setQuestion]   = useState(null)
  const [answered, setAnswered]   = useState(false)  // true after teacher marks

  const reset = () => {
    setScores({ A: 0, B: 0 })
    setUsedBoxes(new Set())
    setActiveBox(null)
    setQuestion(null)
    setAnswered(false)
  }

  const pickBox = (pts) => {
    if (usedBoxes.has(pts) || activeBox !== null) return
    let q
    if (effQs.length > 0) {
      const bq = effQs[Math.floor(Math.random() * effQs.length)]
      q = { ar: bq.question, en: bq.question, answer: bq.answer }
    } else {
      const pool = POINTBOX_QUESTIONS[pts]
      q = pool[Math.floor(Math.random() * pool.length)]
    }
    setActiveBox(pts)
    setQuestion(q)
    setAnswered(false)
  }

  const markAnswer = (team) => {
    if (!activeBox || answered) return
    setScores(prev => ({ ...prev, [team]: prev[team] + activeBox }))
    setUsedBoxes(prev => new Set([...prev, activeBox]))
    setAnswered(true)
    setTimeout(() => { setActiveBox(null); setQuestion(null); setAnswered(false) }, 1500)
  }

  const markWrong = () => {
    if (!activeBox || answered) return
    setUsedBoxes(prev => new Set([...prev, activeBox]))
    setAnswered(true)
    setTimeout(() => { setActiveBox(null); setQuestion(null); setAnswered(false) }, 1000)
  }

  const allUsed  = usedBoxes.size === 10
  const winner   = allUsed
    ? (scores.A > scores.B ? 'A' : scores.B > scores.A ? 'B' : null)
    : null

  // Color for each box based on state — CamelCode brand palette:
  //  gold #FCAD0F → magenta #91278E → navy #0E1F39 gradient across the 10 boxes,
  //  brand grey #D0DBD3 for used boxes, brand gold for the active box.
  const boxStyle = (pts) => {
    if (usedBoxes.has(pts) && activeBox !== pts) {
      return { background: '#D0DBD3', color: '#8a9a90', cursor: 'default', border: '2px solid #D0DBD3' }
    }
    if (activeBox === pts) {
      return { background: '#FCAD0F', color: '#0E1F39', cursor: 'default', border: '2px solid #e09b00',
               boxShadow: '0 0 0 3px rgba(252,173,15,0.35)' }
    }
    // brand gradient (HSL, short-hue path → clean colours): gold → magenta → navy
    const p = (pts - 1) / 9
    let h, s, l
    if (p < 0.5) { const t = p / 0.5;         h = 40 - 97 * t;  s = 98 - 40 * t; l = 52 - 16 * t }   // gold → magenta
    else         { const t = (p - 0.5) / 0.5; h = 303 - 85 * t; s = 58 + 4 * t;  l = 36 - 22 * t }   // magenta → navy
    if (h < 0) h += 360
    return {
      background: `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`,
      color: l > 47 ? '#0E1F39' : '#FCF5F0',
      cursor: 'pointer',
      border: '2px solid transparent',
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Score board + bank picker */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {['A','B'].map(t => (
          <div key={t} style={{
            flex: 1, minWidth: 100, background: t === 'A' ? 'rgba(252,173,15,0.1)' : 'rgba(14,31,57,0.06)',
            border: `2px solid ${t === 'A' ? '#FCAD0F' : '#0E1F39'}`,
            borderRadius: 14, padding: '8px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: 1 }}>
              {ar ? `الفريق ${t}` : `Team ${t}`}
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: t === 'A' ? '#FCAD0F' : '#0E1F39', lineHeight: 1.1 }}>
              {scores[t]}
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <QuestionBankPicker bank={bank} ar={ar} />
            <CustomQuestionsControl custom={custom} setCustom={setCustom} ar={ar} />
          </div>
          <button onClick={reset} style={{
            padding: '6px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0',
            background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
          }}>
            {ar ? '↺ إعادة' : '↺ Reset'}
          </button>
        </div>
      </div>

      {/* Question source hint */}
      {bank.selected.length === 0 && custom.length === 0 && (
        <div style={{
          flexShrink: 0, background: 'rgba(252,173,15,0.08)', border: '1px dashed rgba(252,173,15,0.5)',
          borderRadius: 12, padding: '8px 14px', fontSize: '0.8rem', fontWeight: 600,
          color: '#92400e', textAlign: 'center',
        }}>
          📚 {ar ? 'اختر مادة من "بنك الأسئلة"، أو ارفع أسئلتك بزر "رفع أسئلتي" (نزّل القالب أولاً) — وإلا ستُستخدم الأسئلة الافتراضية' : 'Pick a subject from "Question Bank", or upload your own with "Upload" (download the template first) — otherwise default questions are used'}
        </div>
      )}
      {custom.length > 0 && (
        <div style={{
          flexShrink: 0, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.4)',
          borderRadius: 12, padding: '8px 14px', fontSize: '0.8rem', fontWeight: 700,
          color: '#15803d', textAlign: 'center',
        }}>
          ✅ {ar ? `يتم استخدام ${custom.length} سؤالاً من ملفك المرفوع` : `Using ${custom.length} questions from your uploaded file`}
        </div>
      )}

      {/* Point boxes grid */}
      <div style={{
        flexShrink: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 8,
      }}>
        {[1,2,3,4,5,6,7,8,9,10].map(pts => (
          <button
            key={pts}
            onClick={() => pickBox(pts)}
            style={{
              ...boxStyle(pts),
              borderRadius: 14, padding: '14px 4px',
              fontWeight: 900, fontSize: '1.5rem', transition: 'all 0.15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}
          >
            <span>{pts}</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 600, opacity: 0.75 }}>
              {ar ? 'نقطة' : 'pts'}
            </span>
          </button>
        ))}
      </div>

      {/* Question display */}
      {question && (
        <div style={{
          flex: 1, minHeight: 0,
          background: '#0E1F39', borderRadius: 16, padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{
              background: '#FCAD0F', color: '#0E1F39', borderRadius: 999,
              padding: '2px 12px', fontWeight: 900, fontSize: '0.8rem',
            }}>
              {activeBox} {ar ? 'نقاط' : 'pts'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem' }}>
              {ar ? 'السؤال:' : 'Question:'}
            </span>
          </div>
          <div style={{
            flex: 1,
            color: '#fff', fontWeight: 700,
            fontSize: 'clamp(0.9rem, 1.5vw, 1.3rem)', lineHeight: 1.65,
            direction: ar ? 'rtl' : 'ltr', textAlign: ar ? 'right' : 'left',
          }}>
            {ar ? question.ar : question.en}
          </div>
          {question.answer && answered && (
            <div style={{
              flexShrink: 0, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)',
              borderRadius: 10, padding: '8px 14px', color: '#4ade80',
              fontWeight: 700, fontSize: '0.88rem', direction: 'rtl', textAlign: 'right',
            }}>
              ✅ {ar ? 'الإجابة:' : 'Answer:'} {question.answer}
            </div>
          )}
          {!answered ? (
            <div style={{ flexShrink: 0, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 600, alignSelf: 'center', flex: 1 }}>
                {ar ? 'من أجاب صحيحاً؟' : 'Who answered correctly?'}
              </span>
              <button onClick={() => markAnswer('A')} style={{
                background: '#FCAD0F', color: '#0E1F39', border: 'none', borderRadius: 12,
                padding: '8px 20px', fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem',
              }}>
                {ar ? 'الفريق أ ✓' : 'Team A ✓'}
              </button>
              <button onClick={() => markAnswer('B')} style={{
                background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 12, padding: '8px 20px', fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem',
              }}>
                {ar ? 'الفريق ب ✓' : 'Team B ✓'}
              </button>
              <button onClick={markWrong} style={{
                background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 12, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
              }}>
                {ar ? 'لا أحد ✗' : 'No one ✗'}
              </button>
            </div>
          ) : (
            <div style={{ flexShrink: 0, color: '#4ade80', fontWeight: 800, textAlign: 'center' }}>
              {ar ? '✓ تم التسجيل!' : '✓ Recorded!'}
            </div>
          )}
        </div>
      )}

      {!question && !allUsed && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem',
        }}>
          {ar ? 'اختر صندوقاً لعرض السؤال' : 'Click a box to reveal its question'}
        </div>
      )}

      {allUsed && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <div style={{ fontSize: '2.5rem' }}>🏆</div>
          {winner
            ? <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0E1F39' }}>
                {ar ? `الفريق ${winner} يفوز!` : `Team ${winner} wins!`}
              </div>
            : <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#64748b' }}>
                {ar ? 'تعادل!' : "It's a tie!"}
              </div>
          }
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            {ar ? `أ: ${scores.A} | ب: ${scores.B}` : `A: ${scores.A} | B: ${scores.B}`}
          </div>
          <button onClick={reset} style={{
            marginTop: 8, background: '#0E1F39', color: '#fff', border: 'none',
            borderRadius: 12, padding: '10px 28px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem',
          }}>
            {ar ? 'لعبة جديدة' : 'New Game'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── GAME 7: BIDDING ─────────────────────────────────────────────────────────
// Flow: bidding → active (timer + question revealed) → reveal → next round / done

function GameBidding({ ar }) {
  const bank = useQuestionBank()
  const [custom, setCustom]     = useState([])
  const effQs = custom.length ? custom : bank.questions
  const [qOrder, setQOrder]     = useState(() => shuffle([...Array(BIDDING_QUESTIONS.length).keys()]))
  const [qIdx, setQIdx]         = useState(0)
  const [bids, setBids]         = useState({ A: null, B: null })
  const [usedBids, setUsedBids] = useState({ A: new Set(), B: new Set() })
  const [scores, setScores]     = useState({ A: 0, B: 0 })
  // phases: 'bidding' → 'active' (question shown + timer) → 'reveal' → 'done'
  const [phase, setPhase]       = useState('bidding')
  const [winner, setWinner]     = useState(null)
  const [timerSec, setTimerSec] = useState(30)   // configurable countdown length
  const [timeLeft, setTimeLeft] = useState(30)
  const [timerOn, setTimerOn]   = useState(false)
  const intervalRef             = useRef(null)

  // Re-shuffle when the question source changes (bank load or custom upload)
  useEffect(() => {
    const src = effQs.length > 0 ? effQs : BIDDING_QUESTIONS
    setQOrder(shuffle([...Array(src.length).keys()]))
    setQIdx(0)
  }, [custom, bank.questions])

  // Countdown tick
  useEffect(() => {
    if (timerOn) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(intervalRef.current); setTimerOn(false); return 0 }
          return t - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [timerOn])

  const src = effQs.length > 0 ? effQs : BIDDING_QUESTIONS
  const rawQ = src[qOrder[qIdx % src.length] ?? 0] ?? src[0]
  const question = effQs.length > 0
    ? { ar: rawQ.question, en: rawQ.question, answer: rawQ.answer }
    : rawQ

  const setBid = (team, val) => {
    if (phase !== 'bidding') return
    if (usedBids[team].has(val)) return
    setBids(prev => ({ ...prev, [team]: val }))
  }

  // Start timer → reveal question
  const startTimer = () => {
    if (bids.A === null || bids.B === null) return
    setTimeLeft(timerSec)
    setTimerOn(true)
    setPhase('active')
  }

  // Stop timer + go to reveal
  const goReveal = () => {
    setTimerOn(false)
    setPhase('reveal')
  }

  const awardPoints = (team) => {
    const newScores = { ...scores }
    if (team === 'A') newScores.A += bids.A
    if (team === 'B') newScores.B += bids.B
    if (team === 'both') { newScores.A += bids.A; newScores.B += bids.B }

    const newUsed = {
      A: new Set([...usedBids.A, bids.A]),
      B: new Set([...usedBids.B, bids.B]),
    }
    setScores(newScores)
    setUsedBids(newUsed)

    if (newUsed.A.size >= 10 && newUsed.B.size >= 10) {
      setPhase('done')
      setWinner(newScores.A > newScores.B ? 'A' : newScores.B > newScores.A ? 'B' : 'tie')
    } else {
      setQIdx(i => i + 1)
      setBids({ A: null, B: null })
      setTimeLeft(timerSec)
      setTimerOn(false)
      setPhase('bidding')
    }
  }

  const reset = () => {
    clearInterval(intervalRef.current)
    setQIdx(0)
    setBids({ A: null, B: null })
    setUsedBids({ A: new Set(), B: new Set() })
    setScores({ A: 0, B: 0 })
    setPhase('bidding')
    setWinner(null)
    setTimeLeft(timerSec)
    setTimerOn(false)
  }

  // Timer ring — shows countdown as an SVG arc
  const radius = 22, circ = 2 * Math.PI * radius
  const progress = timeLeft / timerSec
  const urgent = timeLeft <= 10

  const BidPicker = ({ team, color }) => (
    <div style={{ flex: 1 }}>
      <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.85rem', color, marginBottom: 6 }}>
        {ar ? `الفريق ${team}` : `Team ${team}`}
        <span style={{ fontWeight: 900, fontSize: '1.1rem', marginRight: ar ? 0 : 6, marginLeft: ar ? 6 : 0 }}>
          {scores[team]}
        </span>
        {ar ? ' نقطة' : ' pts'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
        {[1,2,3,4,5,6,7,8,9,10].map(v => {
          const used     = usedBids[team].has(v)
          const selected = bids[team] === v
          return (
            <button key={v} onClick={() => setBid(team, v)} style={{
              padding: '6px 2px', borderRadius: 8, fontWeight: 800, fontSize: '0.85rem',
              border: selected ? `2px solid ${color}` : '2px solid #e2e8f0',
              background: selected ? `${color}22` : used ? '#f1f5f9' : '#fff',
              color: used ? '#cbd5e1' : selected ? color : '#0E1F39',
              cursor: used ? 'not-allowed' : 'pointer',
              textDecoration: used ? 'line-through' : 'none',
              transition: 'all 0.12s',
            }}>
              {v}
            </button>
          )
        })}
      </div>
      {bids[team] !== null && (
        <div style={{ textAlign: 'center', marginTop: 4, fontWeight: 800, color, fontSize: '0.8rem' }}>
          {ar ? `راهنت بـ ${bids[team]}` : `Bid: ${bids[team]}`}
        </div>
      )}
    </div>
  )

  if (phase === 'done') return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <div style={{ fontSize: '3rem' }}>🏆</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0E1F39' }}>
        {winner === 'tie' ? (ar ? 'تعادل!' : "It's a tie!") :
          (ar ? `الفريق ${winner} يفوز!` : `Team ${winner} wins!`)}
      </div>
      <div style={{ color: '#64748b', fontWeight: 600 }}>
        {ar ? `أ: ${scores.A} | ب: ${scores.B}` : `A: ${scores.A} | B: ${scores.B}`}
      </div>
      <button onClick={reset} style={{
        background: '#0E1F39', color: '#fff', border: 'none',
        borderRadius: 12, padding: '10px 28px', fontWeight: 800, cursor: 'pointer',
      }}>
        {ar ? 'لعبة جديدة' : 'New Game'}
      </button>
    </div>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b' }}>
          {ar ? `سؤال ${qIdx + 1}` : `Question ${qIdx + 1}`}
          {' · '}
          {ar ? `أ: ${scores.A} | ب: ${scores.B}` : `A: ${scores.A} | B: ${scores.B}`}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <QuestionBankPicker bank={bank} ar={ar} />
          <CustomQuestionsControl custom={custom} setCustom={setCustom} ar={ar} />
          <button onClick={reset} style={{
            padding: '4px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
          }}>
            {ar ? '↺ إعادة' : '↺ Reset'}
          </button>
        </div>
      </div>
      {custom.length > 0 && (
        <div style={{
          flexShrink: 0, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.4)',
          borderRadius: 12, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700,
          color: '#15803d', textAlign: 'center',
        }}>
          ✅ {ar ? `يتم استخدام ${custom.length} سؤالاً من ملفك المرفوع` : `Using ${custom.length} questions from your uploaded file`}
        </div>
      )}

      {/* Question box — hidden in bidding phase */}
      {phase === 'bidding' ? (
        <div style={{
          flexShrink: 0, background: '#0E1F39', borderRadius: 14, padding: '22px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <span style={{ fontSize: '2rem' }}>🔒</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '1rem' }}>
            {ar ? 'السؤال مخفي — راهن أولاً ثم ابدأ الوقت' : 'Question hidden — bid first, then start timer'}
          </span>
        </div>
      ) : (
        <div style={{
          flexShrink: 0, background: '#0E1F39', borderRadius: 14, padding: '14px 18px',
          color: '#fff', fontWeight: 700, fontSize: 'clamp(0.9rem, 1.4vw, 1.2rem)', lineHeight: 1.65,
          direction: ar ? 'rtl' : 'ltr', textAlign: ar ? 'right' : 'left',
        }}>
          {ar ? question.ar : question.en}
          {question.answer && phase === 'reveal' && (
            <div style={{
              marginTop: 10, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)',
              borderRadius: 10, padding: '8px 12px', color: '#4ade80',
              fontWeight: 700, fontSize: '0.85rem',
            }}>
              ✅ {ar ? 'الإجابة:' : 'Answer:'} {question.answer}
            </div>
          )}
        </div>
      )}

      {phase === 'bidding' && (
        <>
          {/* Bid pickers */}
          <div style={{ flexShrink: 0, display: 'flex', gap: 14 }}>
            <BidPicker team="A" color="#FCAD0F" />
            <div style={{ width: 1, background: '#e2e8f0', flexShrink: 0 }} />
            <BidPicker team="B" color="#0E1F39" />
          </div>

          {/* Timer config + Start button */}
          <div style={{ flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '4px 10px',
              fontSize: '0.8rem', fontWeight: 700, color: '#64748b',
            }}>
              ⏱ {ar ? 'الوقت:' : 'Time:'}
              <input
                type="number" min={5} max={120} value={timerSec}
                onChange={e => { const v = Math.max(5, Math.min(120, +e.target.value||30)); setTimerSec(v); setTimeLeft(v) }}
                style={{ width: 40, textAlign: 'center', border: 'none', outline: 'none',
                  background: 'transparent', fontWeight: 800, fontSize: '0.9rem', color: '#0E1F39' }}
              />
              {ar ? 'ثانية' : 's'}
            </div>
            <button onClick={startTimer}
              disabled={bids.A === null || bids.B === null}
              style={{
                flex: 1, background: bids.A !== null && bids.B !== null ? '#22c55e' : '#e2e8f0',
                color: bids.A !== null && bids.B !== null ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: 12, padding: '10px', fontWeight: 800,
                fontSize: '0.95rem', cursor: bids.A !== null && bids.B !== null ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}>
              {ar ? '▶ ابدأ الوقت — اكشف السؤال' : '▶ Start Timer — Reveal Question'}
            </button>
          </div>
        </>
      )}

      {phase === 'active' && (
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Timer display */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <svg width={56} height={56} viewBox="0 0 56 56">
              <circle cx={28} cy={28} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={5}/>
              <circle cx={28} cy={28} r={radius} fill="none"
                stroke={urgent ? '#ef4444' : '#22c55e'} strokeWidth={5}
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - progress)}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
                style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
              />
              <text x={28} y={33} textAnchor="middle" fontWeight="900"
                fontSize={14} fill={urgent ? '#ef4444' : '#0E1F39'}>
                {timeLeft}
              </text>
            </svg>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setTimerOn(t => !t)} style={{
                padding: '8px 16px', borderRadius: 10,
                background: timerOn ? 'rgba(234,179,8,0.12)' : 'rgba(34,197,94,0.12)',
                border: `1.5px solid ${timerOn ? '#eab308' : '#22c55e'}`,
                color: timerOn ? '#854d0e' : '#15803d',
                fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
              }}>
                {timerOn ? (ar ? '⏸ إيقاف' : '⏸ Pause') : (ar ? '▶ متابعة' : '▶ Resume')}
              </button>
              <button onClick={goReveal} style={{
                padding: '8px 16px', borderRadius: 10,
                background: '#0E1F39', color: '#fff',
                border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
              }}>
                {ar ? 'كشف الإجابات ⟵' : '→ Reveal'}
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
            {ar ? `مراهنة أ: ${bids.A} | مراهنة ب: ${bids.B}` : `A bid: ${bids.A} | B bid: ${bids.B}`}
          </div>
        </div>
      )}

      {phase === 'reveal' && (
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }}>
            {ar ? `مراهنة الفريق أ: ${bids.A} | مراهنة الفريق ب: ${bids.B}` :
                  `Team A bid: ${bids.A} pts | Team B bid: ${bids.B} pts`}
          </div>
          <div style={{ textAlign: 'center', fontWeight: 800, color: '#0E1F39', fontSize: '0.9rem' }}>
            {ar ? 'من أجاب صحيحاً؟' : 'Who answered correctly?'}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => awardPoints('A')} style={{
              background: '#FCAD0F', color: '#0E1F39', border: 'none', borderRadius: 12,
              padding: '10px 20px', fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem',
            }}>
              {ar ? `الفريق أ (+${bids.A})` : `Team A (+${bids.A})`}
            </button>
            <button onClick={() => awardPoints('B')} style={{
              background: '#0E1F39', color: '#fff', border: 'none', borderRadius: 12,
              padding: '10px 20px', fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem',
            }}>
              {ar ? `الفريق ب (+${bids.B})` : `Team B (+${bids.B})`}
            </button>
            <button onClick={() => awardPoints('both')} style={{
              background: '#22c55e', color: '#fff', border: 'none', borderRadius: 12,
              padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
            }}>
              {ar ? 'كلاهما ✓' : 'Both ✓'}
            </button>
            <button onClick={() => awardPoints('none')} style={{
              background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fecaca',
              borderRadius: 12, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
            }}>
              {ar ? 'لا أحد ✗' : 'No one ✗'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── GAME 9 DATA: خمن الكلمة (rebus) ─────────────────────────────────────────
// Each puzzle has `parts`: an ordered list of letter tiles and/or emoji tiles.
// Rule: read parts RIGHT → LEFT (Arabic direction), say each name aloud — answer = the combined word/phrase.
// Two puzzle types:
//   • letter+emoji  : single letter tile + one emoji tile → one word
//   • multi-emoji   : two or more emoji tiles             → compound word or phrase

const REBUS_PUZZLES = [
  // ── Letter + Image — easy/medium ──────────────────────────────────────────
  { parts:[ { t:'letter', v:'ع' }, { t:'img', img:'/images/rebus/walnut.jpg', ar:'جوز', en:'walnut' } ],
    answer:'عجوز', answerEn:'old person',
    hintAr:'ع + جوز (المكسّرة) → عجوز', hintEn:'ʿ + jawz (walnut) → ʿajūz (old person)' },

  { parts:[ { t:'letter', v:'ب' }, { t:'img', img:'/images/rebus/heat.jpg', ar:'حَر', en:'heat' } ],
    answer:'بحر', answerEn:'sea',
    hintAr:'ب + حَر (الحرارة) → بحر', hintEn:'b + ḥar (heat) → baḥr (sea)' },

  { parts:[ { t:'letter', v:'س' }, { t:'img', img:'/images/rebus/water.jpg', ar:'ماء', en:'water' } ],
    answer:'سماء', answerEn:'sky',
    hintAr:'س + ماء (الماء) → سماء', hintEn:'s + māʾ (water) → samāʾ (sky)' },

  { parts:[ { t:'letter', v:'م' }, { t:'img', img:'/images/rebus/fire.jpg', ar:'نار', en:'fire' } ],
    answer:'منار', answerEn:'minaret / lighthouse',
    hintAr:'م + نار (النار) → منار', hintEn:'m + nār (fire) → manār (minaret)' },

  { parts:[ { t:'letter', v:'ح' }, { t:'img', img:'/images/rebus/lion.jpg', ar:'أسد', en:'lion' } ],
    answer:'حسد', answerEn:'envy',
    hintAr:'ح + أسد (الأسد) → حسد', hintEn:'ḥ + ʾasad (lion) → ḥasad (envy)' },

  { parts:[ { t:'letter', v:'م' }, { t:'img', img:'/images/rebus/books.jpg', ar:'كتب', en:'books' } ],
    answer:'مكتب', answerEn:'office / desk',
    hintAr:'م + كتب (الكتب) → مكتب', hintEn:'m + kutub (books) → maktab (office)' },

  { parts:[ { t:'letter', v:'ج' }, { t:'img', img:'/images/rebus/button.jpg', ar:'زر', en:'button' } ],
    answer:'جزر', answerEn:'islands / carrots',
    hintAr:'ج + زِر (زرار الملابس) → جزر', hintEn:'j + zirr (button) → juzur (islands) / jazar (carrots)' },

  { parts:[ { t:'letter', v:'ح' }, { t:'img', img:'/images/rebus/worm.jpg', ar:'دود', en:'worms' } ],
    answer:'حدود', answerEn:'borders',
    hintAr:'ح + دود (الديدان) → حدود', hintEn:'ḥ + dūd (worms) → ḥudūd (borders)' },

  // ── With extra letters ─────────────────────────────────────────────────────
  { parts:[ { t:'letter', v:'ع' }, { t:'img', img:'/images/rebus/cow.jpg', ar:'بقر', en:'cow' }, { t:'letter', v:'ي' } ],
    answer:'عبقري', answerEn:'genius',
    hintAr:'ع + بقر (البقرة) + ي → عبقري', hintEn:'ʿ + baqar (cow) + ī → ʿabqarī (genius)' },

  { parts:[ { t:'letter', v:'م' }, { t:'img', img:'/images/rebus/gold.jpg', ar:'ذهب', en:'gold' } ],
    answer:'مذهب', answerEn:'doctrine / school of thought',
    hintAr:'م + ذهب (المعدن) → مذهب', hintEn:'m + dhahab (gold) → madhhab (doctrine)' },

  { parts:[ { t:'letter', v:'ت' }, { t:'letter', v:'م' }, { t:'img', img:'/images/rebus/icecream.jpg', ar:'ساح', en:'melted' } ],
    answer:'تمساح', answerEn:'crocodile',
    hintAr:'تم + ساح (المثلجات تذوب/تسيح) → تمساح', hintEn:'tam + sāḥ (melting ice cream) → timsāḥ (crocodile)' },

  { parts:[ { t:'letter', v:'ب' }, { t:'letter', v:'ر' }, { t:'letter', v:'و' }, { t:'img', img:'/images/rebus/fig.jpg', ar:'تين', en:'fig' } ],
    answer:'بروتين', answerEn:'protein',
    hintAr:'برو + تين (ثمرة التين) → بروتين', hintEn:'brō + tīn (fig) → brūtīn (protein)' },

  // ── Image + Image — compound words & phrases ────────────────────────────────
  { parts:[ { t:'img', img:'/images/rebus/ball.jpg', ar:'كرة', en:'ball' }, { t:'img', img:'/images/rebus/foot.jpg', ar:'قدم', en:'foot' } ],
    answer:'كرة القدم', answerEn:'football / soccer',
    hintAr:'كرة + قدم → كرة القدم', hintEn:'ball + foot → football' },

  { parts:[ { t:'img', img:'/images/rebus/lion.jpg', ar:'أسد', en:'lion' }, { t:'img', img:'/images/rebus/sea.jpg', ar:'بحر', en:'sea' } ],
    answer:'أسد البحر', answerEn:'sea lion',
    hintAr:'أسد + بحر → أسد البحر', hintEn:'lion + sea → sea lion' },

  { parts:[ { t:'img', img:'/images/rebus/horse.jpg', ar:'فرس', en:'mare' }, { t:'img', img:'/images/rebus/river.jpg', ar:'نهر', en:'river' } ],
    answer:'فرس النهر', answerEn:'hippopotamus',
    hintAr:'فرس + نهر → فرس النهر', hintEn:'mare + river → hippopotamus' },

  { parts:[ { t:'img', img:'/images/rebus/horse.jpg', ar:'حصان', en:'horse' }, { t:'img', img:'/images/rebus/sea.jpg', ar:'بحر', en:'sea' } ],
    answer:'حصان البحر', answerEn:'seahorse',
    hintAr:'حصان + بحر → حصان البحر', hintEn:'horse + sea → seahorse' },

  { parts:[ { t:'img', img:'/images/rebus/cucumber.jpg', ar:'خيار', en:'cucumber' }, { t:'img', img:'/images/rebus/sea.jpg', ar:'بحر', en:'sea' } ],
    answer:'خيار البحر', answerEn:'sea cucumber',
    hintAr:'خيار + بحر → خيار البحر', hintEn:'cucumber + sea → sea cucumber' },
]

// ─── GAME 9: خمن الكلمة ───────────────────────────────────────────────────────

function GameRebus({ ar, showHint, setHintUsed }) {
  const TOTAL = REBUS_PUZZLES.length

  // Shuffle once per mount
  const [order] = useState(() => {
    const o = [...Array(TOTAL).keys()]
    for (let i = o.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [o[i], o[j]] = [o[j], o[i]]
    }
    return o
  })

  const [seq,          setSeq]          = useState(0)
  const [revealLabel,  setRevealLabel]  = useState(false)   // emoji names shown
  const [revealAnswer, setRevealAnswer] = useState(false)   // answer shown
  const [hintText,     setHintText]     = useState('')
  const [score,        setScore]        = useState(0)
  const [done,         setDone]         = useState(false)

  const cur = REBUS_PUZZLES[order[seq % TOTAL]]

  // Hint button → show emoji labels + hint sentence
  useEffect(() => {
    if (!showHint) return
    setHintUsed(true)
    setRevealLabel(true)
    setHintText(ar ? cur.hintAr : cur.hintEn)
  }, [showHint])

  // Clear per-question state when moving to next puzzle
  useEffect(() => {
    setRevealLabel(false)
    setRevealAnswer(false)
    setHintText('')
  }, [seq])

  const advance = (correct) => {
    if (correct) setScore(s => s + 1)
    if (seq + 1 >= TOTAL) { setDone(true); return }
    setSeq(s => s + 1)
  }

  const restart = () => {
    setSeq(0); setScore(0); setDone(false)
    setRevealLabel(false); setRevealAnswer(false); setHintText('')
  }

  if (done) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  height:'100%', gap:16, textAlign:'center', direction: ar ? 'rtl' : 'ltr' }}>
      <div style={{ fontSize:'3.5rem' }}>🎉</div>
      <div style={{ fontSize:'1.5rem', fontWeight:900, color:'#0E1F39' }}>
        {ar ? 'أنهيت جميع الألغاز!' : 'All puzzles complete!'}
      </div>
      <div style={{ fontSize:'1.1rem', fontWeight:700, color:'#FCAD0F' }}>
        {ar ? `النتيجة: ${score} / ${TOTAL}` : `Score: ${score} / ${TOTAL}`}
      </div>
      <button onClick={restart} style={{
        background:'#0E1F39', color:'#fff', border:'none', borderRadius:12,
        padding:'10px 28px', fontWeight:800, fontSize:'1rem', cursor:'pointer',
      }}>
        {ar ? '↺ العب مجدداً' : '↺ Play Again'}
      </button>
    </div>
  )

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', gap:10,
                  direction: ar ? 'rtl' : 'ltr' }}>

      {/* ── Progress ──────────────────────────────────────────────────────────── */}
      <div style={{ flexShrink:0, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#94a3b8' }}>
          {seq + 1} / {TOTAL}
        </span>
        <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#FCAD0F' }}>✓ {score}</span>
      </div>

      {/* ── Instruction ───────────────────────────────────────────────────────── */}
      <div style={{ flexShrink:0, textAlign:'center', fontWeight:700, fontSize:'0.82rem', color:'#64748b' }}>
        {ar
          ? '🖼️ انطق كل صورة من اليمين لليسار — ما الكلمة أو الجملة الناتجة؟'
          : '🖼️ Read each image right to left — what word or phrase do you get?'}
      </div>

      {/* ── Rebus card ── RTL: parts flow right → left ────────────────────────── */}
      <div style={{
        flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        flexWrap:'wrap', gap:10, padding:'20px 16px',
        background:'#0E1F39', borderRadius:22,
        direction:'rtl',   // parts rendered RTL → rightmost part = first element
      }}>
        {/* Parts: each tile (letter or emoji), separated by + */}
        {cur.parts.flatMap((part, i) => {
          const elems = []
          if (i > 0) elems.push(
            <span key={`op-${i}`} style={{
              fontSize:'2rem', fontWeight:900, color:'rgba(255,255,255,0.4)',
              userSelect:'none',
            }}>+</span>
          )
          if (part.t === 'letter') {
            elems.push(
              <div key={`p-${i}`} style={{
                display:'flex', flexDirection:'column', alignItems:'center',
                background:'rgba(252,173,15,0.12)', borderRadius:18,
                border:'2px solid rgba(252,173,15,0.4)',
                padding:'12px 20px', minWidth:76,
              }}>
                <span style={{
                  fontSize:'3.8rem', fontWeight:900, lineHeight:1,
                  color:'#FCAD0F', fontFamily:'Cairo, sans-serif',
                  textShadow:'0 0 24px rgba(252,173,15,0.4)',
                }}>{part.v}</span>
                <span style={{ fontSize:'0.58rem', fontWeight:600, color:'rgba(255,255,255,0.3)', marginTop:4 }}>
                  {ar ? 'حرف' : 'letter'}
                </span>
              </div>
            )
          } else {
            elems.push(
              <div key={`p-${i}`} style={{
                display:'flex', flexDirection:'column', alignItems:'center',
                background:'rgba(255,255,255,0.07)', borderRadius:18,
                border:'2px solid rgba(255,255,255,0.12)',
                padding:'12px 18px', minWidth:86,
                transition:'border-color 0.2s',
              }}>
                {part.t === 'img' ? (
                  <img
                    src={import.meta.env.BASE_URL + part.img.replace(/^\//, '')}
                    alt=""
                    loading="lazy"
                    style={{
                      width:'clamp(62px,13vw,90px)', height:'clamp(62px,13vw,90px)',
                      objectFit:'cover', borderRadius:12, display:'block',
                      boxShadow:'0 3px 12px rgba(0,0,0,0.35)',
                    }}
                  />
                ) : (
                  <span style={{ fontSize:'3.2rem', lineHeight:1 }}>{part.emoji}</span>
                )}
                {revealLabel ? (
                  <span style={{
                    fontSize:'0.95rem', fontWeight:900, color:'#FCAD0F',
                    fontFamily:'Cairo, sans-serif', marginTop:5, direction:'rtl',
                  }}>{ar ? part.ar : part.en}</span>
                ) : (
                  <span style={{ fontSize:'0.65rem', fontWeight:600, color:'rgba(255,255,255,0.25)', marginTop:5 }}>
                    {ar ? 'ما اسمها؟' : 'name?'}
                  </span>
                )}
              </div>
            )
          }
          return elems
        })}

        {/* = sign */}
        <span style={{ fontSize:'2rem', fontWeight:900, color:'rgba(255,255,255,0.4)', userSelect:'none' }}>=</span>

        {/* Answer box */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'center',
          background: revealAnswer ? 'rgba(252,173,15,0.18)' : 'rgba(252,173,15,0.07)',
          borderRadius:18,
          border: revealAnswer ? '2.5px solid rgba(252,173,15,0.7)' : '2.5px dashed rgba(252,173,15,0.35)',
          minWidth:100, minHeight:84, padding:'10px 14px',
          transition:'all 0.35s',
        }}>
          {revealAnswer ? (
            <div style={{ textAlign:'center' }}>
              <div style={{
                fontSize:'clamp(1.2rem,3.5vw,1.9rem)', fontWeight:900,
                color:'#FCAD0F', fontFamily:'Cairo, sans-serif', lineHeight:1.25, direction:'rtl',
              }}>{cur.answer}</div>
              {cur.answerEn && (
                <div style={{ fontSize:'0.62rem', color:'rgba(252,173,15,0.55)', marginTop:4, direction:'ltr' }}>
                  {cur.answerEn}
                </div>
              )}
            </div>
          ) : (
            <span style={{
              fontSize:'2.8rem', fontWeight:900,
              color:'rgba(252,173,15,0.5)', fontFamily:'Cairo, sans-serif',
            }}>؟</span>
          )}
        </div>
      </div>

      {/* ── Hint text ─────────────────────────────────────────────────────────── */}
      {hintText && (
        <div style={{
          flexShrink:0, background:'rgba(252,173,15,0.1)', border:'1px solid rgba(252,173,15,0.4)',
          borderRadius:12, padding:'8px 14px', textAlign:'center',
          color:'#92610a', fontWeight:600, fontSize:'0.85rem',
        }}>
          💡 {hintText}
        </div>
      )}

      {/* ── Action area ───────────────────────────────────────────────────────── */}
      <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center', gap:12 }}>
        {!revealAnswer ? (
          /* Reveal button */
          <button
            onClick={() => setRevealAnswer(true)}
            style={{
              background:'#0E1F39', color:'#FCAD0F',
              border:'2px solid rgba(252,173,15,0.45)',
              borderRadius:16, padding:'14px 40px',
              fontFamily:'Cairo, sans-serif', fontSize:'1.05rem', fontWeight:800,
              cursor:'pointer', letterSpacing:0.5,
              transition:'all 0.2s',
              boxShadow:'0 4px 16px rgba(14,31,57,0.18)',
            }}
          >
            {ar ? '👁️ اكشف الجواب' : '👁️ Reveal Answer'}
          </button>
        ) : (
          /* صح / غلط scoring buttons */
          <div style={{ display:'flex', gap:14 }}>
            <button onClick={() => advance(false)} style={{
              background:'#fef2f2', color:'#dc2626',
              border:'2px solid #fca5a5', borderRadius:16,
              padding:'12px 32px', fontFamily:'Cairo, sans-serif',
              fontSize:'1rem', fontWeight:800, cursor:'pointer',
              transition:'all 0.15s',
            }}>
              {ar ? '✗ غلط' : '✗ Wrong'}
            </button>
            <button onClick={() => advance(true)} style={{
              background:'#f0fdf4', color:'#16a34a',
              border:'2px solid #4ade80', borderRadius:16,
              padding:'12px 32px', fontFamily:'Cairo, sans-serif',
              fontSize:'1rem', fontWeight:800, cursor:'pointer',
              transition:'all 0.15s',
            }}>
              {ar ? '✓ صح' : '✓ Correct'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── GAME 10 DATA: HAROOF (حروف) ────────────────────────────────────────────
// Arabic hangman-style: hidden word shown as blank boxes.
// Player clicks letters from the alphabet; 6 wrong guesses = game over.

/** Collapse all alef variants → ا, ى → ي (for matching). ة stays as ة. */
const normalizeAr = (c) => ({ 'أ':'ا','إ':'ا','آ':'ا','ى':'ي' }[c] || c)

// Alphabet grid (3 rows of 8, 1 short row) — alphabet order for classroom clarity
const ARABIC_KB = [
  ['ا','ب','ت','ث','ج','ح','خ','د'],
  ['ذ','ر','ز','س','ش','ص','ض','ط'],
  ['ظ','ع','غ','ف','ق','ك','ل','م'],
  ['ن','ه','و','ي','ء','ة','أ','ئ'],
]

const HAROOF_WORDS = [
  // ── Cybersecurity ─────────────────────────────────────────────────────────
  { word:'هاكر',   categoryAr:'أمن سيبراني', categoryEn:'Cybersecurity', hintAr:'يخترق الأنظمة الإلكترونية',    hintEn:'breaks into electronic systems'   },
  { word:'شبكة',   categoryAr:'تقنية',        categoryEn:'Technology',    hintAr:'ربط الأجهزة مع بعضها',         hintEn:'connects devices together'         },
  { word:'فيروس',  categoryAr:'أمن سيبراني', categoryEn:'Cybersecurity', hintAr:'برنامج ضار يتنقل بين الأجهزة', hintEn:'harmful program that spreads'      },
  { word:'تشفير',  categoryAr:'أمن سيبراني', categoryEn:'Cybersecurity', hintAr:'يحول البيانات لشكل مشفر',       hintEn:'converts data to coded form'       },
  { word:'بيانات', categoryAr:'تقنية',        categoryEn:'Technology',    hintAr:'معلومات مخزنة في الحاسوب',     hintEn:'information stored in a computer'  },
  { word:'سيرفر',  categoryAr:'تقنية',        categoryEn:'Technology',    hintAr:'يخدم المواقع والتطبيقات',      hintEn:'hosts websites and applications'   },
  // ── Nature ────────────────────────────────────────────────────────────────
  { word:'قمر',    categoryAr:'فلك',           categoryEn:'Astronomy',     hintAr:'يضيء سماء الليل',              hintEn:'lights the night sky'              },
  { word:'بحر',    categoryAr:'طبيعة',         categoryEn:'Nature',        hintAr:'ماء مالح شاسع',                hintEn:'vast salty water'                  },
  { word:'جبل',    categoryAr:'طبيعة',         categoryEn:'Nature',        hintAr:'تضاريس شاهقة الارتفاع',        hintEn:'tall elevated terrain'             },
  { word:'نهر',    categoryAr:'طبيعة',         categoryEn:'Nature',        hintAr:'مياه جارية نحو البحر',         hintEn:'flowing water toward the sea'      },
  { word:'صحراء',  categoryAr:'طبيعة',         categoryEn:'Nature',        hintAr:'رمال شاسعة وحرارة شديدة',     hintEn:'vast sands and extreme heat'       },
  { word:'سماء',   categoryAr:'طبيعة',         categoryEn:'Nature',        hintAr:'فوق رؤوسنا وفيها الغيوم',     hintEn:'above us, where clouds float'      },
  // ── Animals ───────────────────────────────────────────────────────────────
  { word:'نمر',    categoryAr:'حيوانات',       categoryEn:'Animals',       hintAr:'حيوان مخطط وسريع جداً',       hintEn:'striped and very fast animal'      },
  { word:'جمل',    categoryAr:'حيوانات',       categoryEn:'Animals',       hintAr:'سفينة الصحراء',                hintEn:'ship of the desert'                },
  { word:'ذئب',    categoryAr:'حيوانات',       categoryEn:'Animals',       hintAr:'يعوي في الليل ويعيش في قطيع', hintEn:'howls at night, lives in packs'    },
  { word:'قرد',    categoryAr:'حيوانات',       categoryEn:'Animals',       hintAr:'يتسلق الأشجار ويقلد البشر',   hintEn:'climbs trees and mimics humans'    },
  { word:'نسر',    categoryAr:'حيوانات',       categoryEn:'Animals',       hintAr:'طائر كبير يحلق عالياً جداً',  hintEn:'large bird that soars high'        },
  { word:'ثعلب',   categoryAr:'حيوانات',       categoryEn:'Animals',       hintAr:'حيوان ذكي ذو ذيل فضفاض',      hintEn:'clever animal with a bushy tail'   },
  // ── Education ─────────────────────────────────────────────────────────────
  { word:'كتاب',   categoryAr:'تعليم',         categoryEn:'Education',     hintAr:'نقرأ منه ونتعلم',              hintEn:'we read from it and learn'         },
  { word:'قلم',    categoryAr:'تعليم',         categoryEn:'Education',     hintAr:'أداة نكتب بها',                hintEn:'a tool we write with'              },
  { word:'معلم',   categoryAr:'تعليم',         categoryEn:'Education',     hintAr:'يشرح الدروس في الفصل',        hintEn:'explains lessons in class'         },
  { word:'مكتبة',  categoryAr:'تعليم',         categoryEn:'Education',     hintAr:'مكان تجد فيه الكتب',           hintEn:'a place full of books'             },
  // ── Qatar / Geography ─────────────────────────────────────────────────────
  { word:'دوحة',   categoryAr:'قطر',           categoryEn:'Qatar',         hintAr:'عاصمة دولة قطر',              hintEn:'capital city of Qatar'             },
  { word:'خليج',   categoryAr:'جغرافيا',       categoryEn:'Geography',     hintAr:'ماء البحر بين شبه جزيرة',     hintEn:'sea water between a peninsula'     },
  { word:'صحراء',  categoryAr:'جغرافيا',       categoryEn:'Geography',     hintAr:'رمال شاسعة في قطر',           hintEn:'vast sands in Qatar'               },
]

// ─── GAME 10: HAROOF ──────────────────────────────────────────────────────────
// Team quiz: all letters shown, first letter highlighted.
// Teacher picks which team answered correctly each round.

function GameHaroof({ ar }) {
  const TOTAL   = HAROOF_WORDS.length
  const [order] = useState(() => shuffle([...Array(TOTAL).keys()]))
  const [seq,        setSeq]        = useState(0)
  const [scores,     setScores]     = useState({ A: 0, B: 0 })
  const [turn,       setTurn]       = useState('A')   // whose turn this round
  const [phase,      setPhase]      = useState('playing') // 'playing' | 'result'
  const [lastWinner, setLastWinner] = useState(null)  // 'A' | 'B' | null (skip)
  const [roundNum,   setRoundNum]   = useState(1)

  const puzzle      = HAROOF_WORDS[order[seq % TOTAL]]
  const chars       = [...puzzle.word]
  const firstLetter = normalizeAr(chars[0])  // highlighted letter

  // Box sizing
  const boxSz   = chars.length <= 4 ? 58 : chars.length <= 6 ? 50 : 42
  const boxFont = chars.length <= 4 ? '1.9rem' : chars.length <= 6 ? '1.6rem' : '1.3rem'

  const awardPoint = (team) => {
    setScores(prev => ({ ...prev, [team]: prev[team] + 1 }))
    setLastWinner(team)
    setPhase('result')
  }

  const skipWord = () => {
    setLastWinner(null)
    setPhase('result')
  }

  const next = () => {
    setSeq(s => s + 1)
    setTurn(t => t === 'A' ? 'B' : 'A')
    setPhase('playing')
    setLastWinner(null)
    setRoundNum(r => r + 1)
  }

  const reset = () => {
    setSeq(0); setScores({ A: 0, B: 0 }); setTurn('A')
    setPhase('playing'); setLastWinner(null); setRoundNum(1)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Score row ─────────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
        {['A', 'B'].map(t => {
          const active = turn === t && phase === 'playing'
          return (
            <div key={t} style={{
              flex: 1, textAlign: 'center', padding: '8px 12px', borderRadius: 14,
              background: active ? 'rgba(252,173,15,0.1)' : 'rgba(14,31,57,0.04)',
              border: `2px solid ${active ? '#FCAD0F' : 'rgba(14,31,57,0.1)'}`,
              transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: active ? '#FCAD0F' : '#94a3b8', letterSpacing: 1 }}>
                {ar ? `الفريق ${t}` : `Team ${t}`}
                {active && <span style={{ marginInlineStart: 4 }}>◀</span>}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: active ? '#FCAD0F' : '#0E1F39', lineHeight: 1.1 }}>
                {scores[t]}
              </div>
            </div>
          )
        })}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>
            {ar ? `جولة ${roundNum}` : `Round ${roundNum}`}
          </span>
          <button onClick={reset} style={{
            padding: '5px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: '#f8fafc', color: '#64748b', fontWeight: 700,
            fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {ar ? '↺ إعادة' : '↺ Reset'}
          </button>
        </div>
      </div>

      {/* ── Category badge + hint ─────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, background: '#0E1F39', borderRadius: 14,
        padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            background: 'rgba(252,173,15,0.2)', color: '#FCAD0F', borderRadius: 999,
            padding: '2px 12px', fontSize: '0.68rem', fontWeight: 800, letterSpacing: 1.2,
          }}>
            {ar ? puzzle.categoryAr : puzzle.categoryEn}
          </span>
        </div>
        <div style={{
          color: '#fff', fontWeight: 700, fontSize: '1rem', lineHeight: 1.6,
          direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo, sans-serif',
        }}>
          💡 {ar ? puzzle.hintAr : puzzle.hintEn}
        </div>
      </div>

      {/* ── Word boxes ────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, display: 'flex', justifyContent: 'center',
        gap: 6, direction: 'rtl', flexWrap: 'wrap', padding: '4px 0',
      }}>
        {chars.map((ch, i) => {
          const isFirst  = i === 0
          const revealed = isFirst || phase === 'result'
          return (
            <div key={i} style={{
              width: boxSz, height: boxSz + 8, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isFirst
                ? 'rgba(252,173,15,0.15)'
                : revealed ? 'rgba(74,222,128,0.1)' : 'rgba(14,31,57,0.05)',
              border: isFirst
                ? '2px solid rgba(252,173,15,0.6)'
                : revealed ? '2px solid rgba(74,222,128,0.4)' : '2px solid rgba(14,31,57,0.12)',
              transition: 'all 0.3s',
            }}>
              {revealed ? (
                <span style={{
                  fontSize: boxFont, fontWeight: 900, lineHeight: 1,
                  fontFamily: 'Cairo, sans-serif',
                  color: isFirst ? '#FCAD0F' : '#16a34a',
                }}>
                  {ch}
                </span>
              ) : (
                <div style={{ width: '55%', height: 3, background: 'rgba(14,31,57,0.15)', borderRadius: 2 }} />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Alphabet grid ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5 }}>
        {ARABIC_KB.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            {row.map(letter => {
              const norm      = normalizeAr(letter)
              const isHighlit = norm === firstLetter
              return (
                <div key={letter} style={{
                  width: 38, height: 44, borderRadius: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Cairo, sans-serif',
                  fontSize: '1.1rem',
                  fontWeight: isHighlit ? 900 : 500,
                  background: isHighlit ? '#FCAD0F' : '#f1f5f9',
                  border: isHighlit ? '2px solid #d99000' : '2px solid #e2e8f0',
                  color: isHighlit ? '#0E1F39' : '#cbd5e1',
                  boxShadow: isHighlit ? '0 3px 14px rgba(252,173,15,0.45)' : 'none',
                  transform: isHighlit ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s',
                  userSelect: 'none',
                }}>
                  {letter}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Teacher controls ──────────────────────────────────────────────── */}
      {phase === 'playing' && (
        <div style={{ flexShrink: 0, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => awardPoint('A')} style={{
            flex: 1, padding: '10px 8px', borderRadius: 12,
            background: 'rgba(252,173,15,0.12)', border: '1.5px solid rgba(252,173,15,0.5)',
            color: '#854d0e', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}>
            ✓ {ar ? 'الفريق أ أجاب' : 'Team A Correct'}
          </button>
          <button onClick={() => awardPoint('B')} style={{
            flex: 1, padding: '10px 8px', borderRadius: 12,
            background: 'rgba(14,31,57,0.06)', border: '1.5px solid rgba(14,31,57,0.2)',
            color: '#0E1F39', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}>
            ✓ {ar ? 'الفريق ب أجاب' : 'Team B Correct'}
          </button>
          <button onClick={skipWord} style={{
            padding: '10px 14px', borderRadius: 12,
            background: '#f8fafc', border: '1.5px solid #e2e8f0',
            color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            {ar ? 'تجاوز ←' : 'Skip →'}
          </button>
        </div>
      )}

      {/* ── Result banner ─────────────────────────────────────────────────── */}
      {phase === 'result' && (
        <div style={{
          flexShrink: 0, borderRadius: 14, padding: '12px 16px',
          background: lastWinner ? 'rgba(74,222,128,0.1)' : 'rgba(148,163,184,0.1)',
          border: `1.5px solid ${lastWinner ? '#4ade80' : '#e2e8f0'}`,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, fontWeight: 800, fontSize: '0.95rem',
            color: lastWinner ? '#16a34a' : '#64748b',
            fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
            {lastWinner
              ? (ar ? `🎉 الفريق ${lastWinner} أجاب صحيحاً! الكلمة: "${puzzle.word}"` : `🎉 Team ${lastWinner} correct! Word: "${puzzle.word}"`)
              : (ar ? `⏭ الكلمة كانت: "${puzzle.word}"` : `⏭ Word was: "${puzzle.word}"`)}
          </div>
          <button onClick={next} style={{
            background: '#0E1F39', color: '#fff', border: 'none', borderRadius: 10,
            padding: '9px 22px', fontWeight: 800, fontSize: '0.88rem',
            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
          }}>
            {ar ? 'التالي ←' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── GAME: XO — CSYC 2026 (the real cloned XO game, embedded as-is) ───────────
// The full XO game (board, sounds, timer, styling) lives untouched under
// public/csyc-xo/ and is embedded here via an iframe so it plays inside this
// tab. Its questions come from the self-contained CSYC 2026 bank (data.js).
function GameXO({ ar }) {
  const src = import.meta.env.BASE_URL + 'csyc-xo/index.html'
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
        <a href={src} target="_blank" rel="noreferrer"
          style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0E1F39', textDecoration: 'none', border: '1.5px solid #e2e8f0', background: '#f8fafc', borderRadius: 10, padding: '5px 12px' }}>
          ⛶ {ar ? 'فتح بملء الشاشة' : 'Open full-screen'}
        </a>
      </div>
      <iframe src={src} title="CSYC 2026 — XO"
        style={{ flex: 1, width: '100%', border: '2px solid #e2e8f0', borderRadius: 12, background: '#0e1f39' }}
        allow="autoplay" />
    </div>
  )
}


// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const GAMES = [
  { id:'xo',         emojiIcon:'⭕', ar:'إكس أو — CSYC',     en:'XO — CSYC'          },
  { id:'memory',     emojiIcon:'🃏', ar:'تطابق البطاقات',   en:'Memory Match'       },
  { id:'sequence',   emojiIcon:'🔢', ar:'التسلسل الرقمي',   en:'Number Sequences'   },
  { id:'sliding',    emojiIcon:'🧩', ar:'البازل المتحرك',   en:'Sliding Puzzle'     },
  { id:'pointboxes', emojiIcon:'🎯', ar:'صندوق النقاط',     en:'Point Boxes'        },
  { id:'bidding',    emojiIcon:'🎲', ar:'المزايدة',          en:'Bidding'            },
]

const GAME_LEVELS = {
  memory:     MEMORY_LEVELS.length,
  sequence:   SEQUENCE_LEVELS.length,
  sliding:    SLIDING_CFG.length,
  pointboxes: 0,   // no levels — level bar hidden
  bidding:    0,   // no levels — level bar hidden
  xo:         0,   // no levels — level bar hidden
}

export default function PageMindGames() {
  const { lang } = useApp()
  const ar = lang === 'ar'
  const [activeGame, setActiveGame] = useState('xo')
  const [level, setLevel] = useState(1)
  const [hintsLeft, setHintsLeft] = useState(3)
  const [showHint, setShowHint] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const hintUsedRef = useRef(false)

  // Reset hints and hint state when game or level changes
  useEffect(() => { setHintsLeft(3); setShowHint(false); hintUsedRef.current = false }, [activeGame, level])

  const handleHint = () => {
    if (hintsLeft <= 0) return
    hintUsedRef.current = false
    setShowHint(s => !s)
    setHintsLeft(h => h - 1)
  }

  // setHintUsed is called by child after consuming the hint signal
  const setHintUsed = () => { hintUsedRef.current = true }

  const handleChangeGame = (id) => { setActiveGame(id); setLevel(1); setTimeUp(false) }
  const handleChangeLevel = (l) => { setLevel(l) }

  const gameProps = { level, ar, showHint, setHintUsed }

  const gameComponent = {
    memory:     <GameMemory {...gameProps} key={`memory-${level}`} />,
    sequence:   <GameSequence {...gameProps} key={`seq-${level}`} />,
    sliding:    <GameSliding {...gameProps} key={`slide-${level}`} />,
    pointboxes: <GamePointBoxes ar={ar} key="pointboxes" />,
    bidding:    <GameBidding ar={ar} key="bidding" />,
    xo:         <GameXO ar={ar} key="xo" />,
  }

  return (
    <div /* outer wrapper: fills viewport below navbar, no scrolling */
      dir={ar?'rtl':'ltr'}
      style={{
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '4px 14px 4px',
        width: '95vw',
        maxWidth: '1500px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Top bar: game tabs + timer in ONE compact row (frees vertical space
          for the grid — the page title already shows in the navbar). */}
      <div style={{ flexShrink: 0, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ flex: 1, minWidth: 0 }}>
          {GAMES.map(g => (
            <button key={g.id} onClick={() => handleChangeGame(g.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-sm transition-all
                ${activeGame===g.id ? 'bg-[#0E1F39] text-white shadow' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'}`}>
              <span>{g.emojiIcon}</span>
              <span>{ar?g.ar:g.en}</span>
            </button>
          ))}
        </div>
        <div style={{ flexShrink: 0 }}>
          <Timer ar={ar} onTimeUp={() => setTimeUp(true)} />
        </div>
      </div>

      {timeUp && (
        <div style={{ flexShrink: 0, marginBottom: 6 }}
             className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center text-red-600 font-bold text-sm">
          {ar ? '⏰ انتهى الوقت!' : '⏰ Time is up!'}
          <button onClick={() => setTimeUp(false)} className="ms-3 text-sm underline font-normal">{ar?'إغلاق':'Dismiss'}</button>
        </div>
      )}

      {/* Game Card — takes all remaining vertical space */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
          border: '1px solid #f1f5f9',
          padding: '6px 14px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
          {gameComponent[activeGame]}
        </div>
      </div>

      {/* Level Bar + Hint — hidden for no-level games EXCEPT lineeq/rebus which still need hints */}
      {(GAME_LEVELS[activeGame] > 0 || activeGame === 'lineeq' || activeGame === 'rebus' || activeGame === 'haroof') && (
        <div style={{ flexShrink: 0 }}>
          <LevelBar level={level} onLevel={handleChangeLevel} ar={ar}
            hintsLeft={hintsLeft} onHint={handleHint} showHintBtn={activeGame !== 'memory'}
            totalLevels={GAME_LEVELS[activeGame]} />
        </div>
      )}
    </div>
  )
}
