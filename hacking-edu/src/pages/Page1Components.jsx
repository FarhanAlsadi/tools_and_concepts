import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, ChevronLeft, Info, MousePointerClick } from 'lucide-react'
import { COMPONENT_DEFINITIONS, COMPONENT_ORDER } from '../data/components'
import { useApp } from '../context/AppContext'
import Explanation from '../components/Explanation'

const SAMPLE_IMAGES = [
  { label: 'طبيعة', labelEn: 'Nature', emoji: '🌿', bg: 'from-green-300 to-emerald-500', src: 'nature.jpg' },
  { label: 'مدينة', labelEn: 'City',   emoji: '🏙️', bg: 'from-blue-400 to-slate-500',    src: 'city.jpg'   },
  { label: 'طعام',  labelEn: 'Food',   emoji: '🍕', bg: 'from-orange-300 to-red-400',     src: 'food.jpg'   },
  { label: 'تقنية', labelEn: 'Tech',   emoji: '💻', bg: 'from-purple-400 to-indigo-600',  src: 'tech.jpg'   },
  { label: 'فضاء',  labelEn: 'Space',  emoji: '🌌', bg: 'from-slate-700 to-slate-900',    src: 'space.jpg'  },
]

const BUTTON_COLORS = [
  { key: 'indigo',  label: 'أزرق',    labelEn: 'Blue',   cls: 'bg-indigo-600' },
  { key: 'green',   label: 'أخضر',    labelEn: 'Green',  cls: 'bg-green-600'  },
  { key: 'red',     label: 'أحمر',    labelEn: 'Red',    cls: 'bg-red-600'    },
  { key: 'orange',  label: 'برتقالي', labelEn: 'Orange', cls: 'bg-orange-500' },
]

const DEFAULT_PROPS_AR = {
  title:     { text: 'مرحباً بك في موقعنا', tag: 'h1' },
  paragraph: { text: 'هذا نص توضيحي يشرح محتوى الموقع للزوار.' },
  image:     { sampleIdx: 0, alt: 'صورة توضيحية' },
  button:    { text: 'انقر هنا', color: 'indigo' },
  link:      { links: [{ label: '/home', href: '/home' }, { label: '/about', href: '/about' }, { label: '/admin', href: '/admin' }] },
  input:     { placeholder: 'اكتب هنا...', inputType: 'text' },
  navbar:    { items: [{ label: 'الرئيسية', href: '/home' }, { label: 'من نحن', href: '/about' }, { label: 'تواصل', href: '/contact' }, { label: 'المشرف', href: '/admin' }] },
  comment:   { text: 'هذا تعليق لا يظهر للمستخدم' },
}

const DEFAULT_PROPS_EN = {
  title:     { text: 'Welcome to our Website', tag: 'h1' },
  paragraph: { text: 'This is a sample paragraph that describes the website content to visitors.' },
  image:     { sampleIdx: 0, alt: 'Sample image' },
  button:    { text: 'Click here', color: 'indigo' },
  link:      { links: [{ label: '/home', href: '/home' }, { label: '/about', href: '/about' }, { label: '/admin', href: '/admin' }] },
  input:     { placeholder: 'Type here...', inputType: 'text' },
  navbar:    { items: [{ label: 'Home', href: '/home' }, { label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }, { label: 'Admin', href: '/admin' }] },
  comment:   { text: 'This comment is not visible to users' },
}

function generateCode(type, props) {
  const tag = props.tag || 'h1'
  switch (type) {
    case 'title':     return `<${tag}>${props.text}</${tag}>`
    case 'paragraph': return `<p>${props.text}</p>`
    case 'image':     return `<img src="${SAMPLE_IMAGES[props.sampleIdx].src}"\n     alt="${props.alt}" />`
    case 'button':    return `<button class="${props.color}">\n  ${props.text}\n</button>`
    case 'link':      return props.links.map(l => `<a href="${l.href}">${l.label}</a>`).join('\n')
    case 'input':     return `<input type="${props.inputType}"\n  placeholder="${props.placeholder}" />`
    case 'navbar':    return `<nav>\n${props.items.map(i => `  <a href="${i.href}">${i.label}</a>`).join('\n')}\n</nav>`
    case 'comment':   return `<!-- ${props.text} -->`
    default:          return ''
  }
}

function validateCode(type, code, isAr) {
  const s = code.trim()
  switch (type) {
    case 'title': {
      const openM = s.match(/^<(h[1-6])>/)
      if (!openM) return isAr ? 'يجب أن يبدأ الكود بوسم عنوان مثل <h1>' : 'Code must start with a heading tag like <h1>'
      const tag = openM[1]
      const closeM = s.match(/<\/(h[1-6])>\s*$/)
      if (!closeM) return isAr ? `الكود غير مكتمل — يجب إغلاقه بـ </${tag}>` : `Incomplete — must be closed with </${tag}>`
      if (closeM[1] !== tag) return isAr ? `وسم الإغلاق </${closeM[1]}> لا يطابق وسم الفتح <${tag}>` : `Closing tag </${closeM[1]}> does not match opening tag <${tag}>`
      return null
    }
    case 'paragraph': {
      if (!s.startsWith('<p>')) return isAr ? 'يجب أن يبدأ الكود بـ <p>' : 'Code must start with <p>'
      if (!s.match(/<\/p>\s*$/)) return isAr ? 'يجب إغلاق الوسم بـ </p>' : 'Must close with </p>'
      return null
    }
    case 'button': {
      if (!s.startsWith('<button')) return isAr ? 'يجب أن يبدأ الكود بـ <button>' : 'Code must start with <button>'
      if (!s.match(/<\/button>\s*$/)) return isAr ? 'يجب إغلاق الوسم بـ </button>' : 'Must close with </button>'
      return null
    }
    case 'link': {
      const opens = [...s.matchAll(/<a\s/g)].length
      const closes = [...s.matchAll(/<\/a>/g)].length
      if (opens === 0) return isAr ? 'يجب أن يحتوي الكود على وسم <a href="..."> على الأقل' : 'Code must contain at least one <a href="..."> tag'
      if (opens !== closes) return isAr ? `عدد وسوم الفتح (${opens}) لا يساوي وسوم الإغلاق (${closes})` : `Opening tags (${opens}) don't match closing tags (${closes})`
      if (!s.includes('href=')) return isAr ? 'يجب إضافة خاصية href="..." للرابط' : 'Must add href="..." attribute to the link'
      return null
    }
    case 'image': {
      if (!s.startsWith('<img')) return isAr ? 'يجب أن يبدأ الكود بـ <img' : 'Code must start with <img'
      if (!s.includes('src=')) return isAr ? 'يجب إضافة خاصية src="..."' : 'Must add src="..." attribute'
      if (!s.includes('alt=')) return isAr ? 'يجب إضافة خاصية alt="..."' : 'Must add alt="..." attribute'
      return null
    }
    case 'input': {
      if (!s.startsWith('<input')) return isAr ? 'يجب أن يبدأ الكود بـ <input' : 'Code must start with <input'
      if (!s.includes('type=')) return isAr ? 'يجب إضافة خاصية type="..."' : 'Must add type="..." attribute'
      return null
    }
    case 'navbar': {
      if (!s.includes('<nav>')) return isAr ? 'يجب أن يبدأ الكود بـ <nav>' : 'Code must contain <nav>'
      if (!s.includes('</nav>')) return isAr ? 'يجب إغلاق الوسم بـ </nav>' : 'Must close with </nav>'
      const opens = [...s.matchAll(/<a\s/g)].length
      const closes = [...s.matchAll(/<\/a>/g)].length
      if (opens !== closes) return isAr ? `عدد وسوم <a> (${opens}) لا يساوي وسوم </a> (${closes})` : `<a> tags (${opens}) don't match </a> tags (${closes})`
      return null
    }
    case 'comment': {
      if (!s.startsWith('<!--')) return isAr ? 'يجب أن يبدأ التعليق بـ <!--' : 'Comment must start with <!--'
      if (!s.endsWith('-->')) return isAr ? 'يجب إغلاق التعليق بـ -->' : 'Comment must end with -->'
      return null
    }
    default: return null
  }
}

function parseCode(type, code) {
  try {
    switch (type) {
      case 'title': {
        const m = code.match(/<(h[1-6])>([\s\S]*?)<\/h[1-6]>/)
        if (m) return { tag: m[1], text: m[2] }
        break
      }
      case 'paragraph': {
        const m = code.match(/<p>([\s\S]*?)<\/p>/)
        if (m) return { text: m[1] }
        break
      }
      case 'button': {
        const m = code.match(/<button[^>]*>\s*([\s\S]*?)\s*<\/button>/)
        if (m) return { text: m[1] }
        break
      }
      case 'link': {
        const matches = [...code.matchAll(/<a href="([^"]*)">([\s\S]*?)<\/a>/g)]
        if (matches.length) return { links: matches.map(m => ({ href: m[1], label: m[2] })) }
        break
      }
      case 'image': {
        const srcM = code.match(/src="([^"]*)"/)
        const altM = code.match(/alt="([^"]*)"/)
        const idx = srcM ? SAMPLE_IMAGES.findIndex(img => img.src === srcM[1]) : -1
        return { sampleIdx: idx >= 0 ? idx : 0, alt: altM ? altM[1] : '' }
      }
      case 'input': {
        const typeM = code.match(/type="([^"]*)"/)
        const phM   = code.match(/placeholder="([^"]*)"/)
        return { inputType: typeM ? typeM[1] : 'text', placeholder: phM ? phM[1] : '' }
      }
      case 'navbar': {
        const matches = [...code.matchAll(/<a href="([^"]*)">([\s\S]*?)<\/a>/g)]
        if (matches.length) return { items: matches.map(m => ({ href: m[1], label: m[2] })) }
        break
      }
      case 'comment': {
        const m = code.match(/<!--([\s\S]*?)-->/)
        if (m) return { text: m[1].trim() }
        break
      }
    }
  } catch {}
  return null
}

const TITLE_SIZES = { h1: 'text-2xl', h2: 'text-xl', h3: 'text-lg', h4: 'text-base' }

const RENDER_MAP = {
  title: (props) => {
    const Tag = props.tag || 'h1'
    return <Tag className={`${TITLE_SIZES[Tag] || 'text-xl'} font-bold text-slate-800 py-2`}>{props.text}</Tag>
  },
  paragraph: (props) => (
    <p className="text-slate-600 py-1 text-sm leading-relaxed">{props.text}</p>
  ),
  image: (props, isAr) => {
    const img = SAMPLE_IMAGES[props.sampleIdx] || SAMPLE_IMAGES[0]
    return (
      <div className={`w-full h-28 bg-gradient-to-br ${img.bg} rounded-lg flex items-center justify-center my-1 gap-2`}>
        <span className="text-3xl">{img.emoji}</span>
        <span className="text-white font-medium text-sm">{isAr ? img.label : img.labelEn}</span>
      </div>
    )
  },
  button: (props) => {
    const colorCls = BUTTON_COLORS.find(c => c.key === props.color)?.cls || 'bg-indigo-600'
    return (
      <div className="py-1">
        <button className={`px-5 py-2 ${colorCls} text-white rounded-lg font-medium text-sm`}>{props.text}</button>
      </div>
    )
  },
  link: (props) => (
    <div className="py-1 flex flex-wrap gap-3 text-sm">
      {props.links.map((l, i) => (
        <a key={i} className={`${l.href.toLowerCase().includes('admin') ? 'text-red-500' : 'text-indigo-600'} underline cursor-pointer`}>
          {l.label} →
        </a>
      ))}
    </div>
  ),
  input: (props) => (
    <div className="py-1">
      <input className="border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 w-48 text-sm"
        placeholder={props.placeholder} type={props.inputType} readOnly />
    </div>
  ),
  navbar: (props) => (
    <nav className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg flex gap-4 text-xs my-1 flex-wrap">
      {props.items.map((item, i) => (
        <a key={i} className={`${item.href.toLowerCase().includes('admin') ? 'text-yellow-300' : 'hover:text-indigo-300'} cursor-pointer`}>
          {item.label}
        </a>
      ))}
    </nav>
  ),
  comment: (props, isAr) => (
    <div className="my-1 border border-dashed border-yellow-300 bg-yellow-50 rounded-lg px-3 py-2 flex items-center gap-2">
      <span className="text-yellow-500 text-base flex-shrink-0">💬</span>
      <span className="text-yellow-700 text-xs font-mono flex-1 opacity-75 italic">{props.text}</span>
      <span className="bg-yellow-200 text-yellow-700 text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0">
        {isAr ? 'مخفي' : 'hidden'}
      </span>
    </div>
  ),
}

function CanvasComponent({ item, isSelected, onClick, isAr }) {
  const render = RENDER_MAP[item.type]
  return (
    <div onClick={onClick}
      className={`canvas-item px-3 py-2 rounded-lg mb-2 ${isSelected ? 'selected' : 'hover:bg-slate-50'}`}>
      {render && render(item.props, isAr)}
    </div>
  )
}

function EditPanel({ item, onUpdate, onCodeChange, isAr }) {
  const { type, props, rawCode } = item
  const def = COMPONENT_DEFINITIONS[type]

  const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300'

  const Field = ({ label, children }) => (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-full overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <div className={`inline-flex items-center gap-2 ${def.color} px-3 py-1.5 rounded-xl text-sm font-bold mb-4`}>
        <span>{def.icon}</span>
        <span>{isAr ? def.arabicName : def.englishName}</span>
        <code className="font-mono text-xs opacity-70">&lt;{def.htmlTag}&gt;</code>
      </div>

      <h3 className="text-sm font-bold text-slate-700 mb-3">✏️ {isAr ? 'تعديل المكون' : 'Edit Component'}</h3>

      {/* ── title ── */}
      {type === 'title' && (
        <>
          <Field label={isAr ? 'مستوى العنوان' : 'Heading Level'}>
            <div className="flex gap-1.5">
              {['h1', 'h2', 'h3', 'h4'].map(t => (
                <button key={t} onClick={() => onUpdate({ tag: t })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all
                    ${props.tag === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                  &lt;{t}&gt;
                </button>
              ))}
            </div>
          </Field>
          <Field label={isAr ? 'نص العنوان' : 'Heading Text'}>
            <input className={inputCls} value={props.text} dir={isAr ? 'rtl' : 'ltr'}
              onChange={e => onUpdate({ text: e.target.value })} />
          </Field>
        </>
      )}

      {/* ── paragraph ── */}
      {type === 'paragraph' && (
        <Field label={isAr ? 'نص الفقرة' : 'Paragraph Text'}>
          <textarea className={`${inputCls} resize-none h-20`} value={props.text} dir={isAr ? 'rtl' : 'ltr'}
            onChange={e => onUpdate({ text: e.target.value })} />
        </Field>
      )}

      {/* ── image ── */}
      {type === 'image' && (
        <>
          <Field label={isAr ? 'اختر صورة' : 'Choose Image'}>
            <div className="grid grid-cols-5 gap-1.5 mb-1.5">
              {SAMPLE_IMAGES.map((img, i) => (
                <button key={i} onClick={() => onUpdate({ sampleIdx: i })}
                  className={`h-12 rounded-lg bg-gradient-to-br ${img.bg} flex items-center justify-center text-lg transition-all
                    ${props.sampleIdx === i ? 'ring-2 ring-indigo-500 ring-offset-1 scale-105' : 'opacity-60 hover:opacity-100'}`}>
                  {img.emoji}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              {isAr ? 'المختارة' : 'Selected'}: {isAr ? SAMPLE_IMAGES[props.sampleIdx]?.label : SAMPLE_IMAGES[props.sampleIdx]?.labelEn}
            </p>
          </Field>
          <Field label={isAr ? 'وصف الصورة (alt)' : 'Image Description (alt)'}>
            <input className={inputCls} value={props.alt} dir={isAr ? 'rtl' : 'ltr'}
              onChange={e => onUpdate({ alt: e.target.value })} />
          </Field>
        </>
      )}

      {/* ── button ── */}
      {type === 'button' && (
        <>
          <Field label={isAr ? 'نص الزر' : 'Button Text'}>
            <input className={inputCls} value={props.text} dir={isAr ? 'rtl' : 'ltr'}
              onChange={e => onUpdate({ text: e.target.value })} />
          </Field>
          <Field label={isAr ? 'لون الزر' : 'Button Color'}>
            <div className="flex gap-2 flex-wrap">
              {BUTTON_COLORS.map(c => (
                <button key={c.key} onClick={() => onUpdate({ color: c.key })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white ${c.cls} transition-all
                    ${props.color === c.key ? 'ring-2 ring-offset-1 ring-slate-400 scale-105' : 'opacity-60 hover:opacity-100'}`}>
                  {isAr ? c.label : c.labelEn}
                </button>
              ))}
            </div>
          </Field>
        </>
      )}

      {/* ── link ── */}
      {type === 'link' && (
        <Field label={isAr ? 'الروابط (النص | المسار)' : 'Links (Label | Path)'}>
          <div className="space-y-1.5">
            {props.links.map((l, i) => (
              <div key={i} className="flex gap-1.5 items-center">
                <input className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
                  value={l.label} placeholder={isAr ? 'النص' : 'Label'} dir={isAr ? 'rtl' : 'ltr'}
                  onChange={e => onUpdate({ links: props.links.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
                <input className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-300"
                  value={l.href} placeholder="/path" dir="ltr"
                  onChange={e => onUpdate({ links: props.links.map((x, j) => j === i ? { ...x, href: e.target.value } : x) })} />
                {props.links.length > 1 && (
                  <button onClick={() => onUpdate({ links: props.links.filter((_, j) => j !== i) })}
                    className="text-red-400 hover:text-red-600 text-sm px-1">×</button>
                )}
              </div>
            ))}
            <button onClick={() => onUpdate({ links: [...props.links, { label: isAr ? 'رابط جديد' : 'New Link', href: '/new' }] })}
              className="text-xs text-indigo-600 hover:text-indigo-800 mt-1">
              {isAr ? '+ إضافة رابط' : '+ Add Link'}
            </button>
          </div>
        </Field>
      )}

      {/* ── input ── */}
      {type === 'input' && (
        <>
          <Field label={isAr ? 'نص التلميح (placeholder)' : 'Placeholder Text'}>
            <input className={inputCls} value={props.placeholder} dir={isAr ? 'rtl' : 'ltr'}
              onChange={e => onUpdate({ placeholder: e.target.value })} />
          </Field>
          <Field label={isAr ? 'نوع الحقل' : 'Field Type'}>
            <select className={inputCls} value={props.inputType}
              onChange={e => onUpdate({ inputType: e.target.value })}>
              <option value="text">{isAr ? 'نص — text' : 'Text — text'}</option>
              <option value="password">{isAr ? 'كلمة مرور — password' : 'Password — password'}</option>
              <option value="email">{isAr ? 'بريد إلكتروني — email' : 'Email — email'}</option>
              <option value="number">{isAr ? 'رقم — number' : 'Number — number'}</option>
            </select>
          </Field>
        </>
      )}

      {/* ── comment ── */}
      {type === 'comment' && (
        <Field label={isAr ? 'نص التعليق' : 'Comment Text'}>
          <textarea className={`${inputCls} resize-none h-16`} value={props.text} dir={isAr ? 'rtl' : 'ltr'}
            onChange={e => onUpdate({ text: e.target.value })} />
          <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
            <span>💡</span>
            {isAr ? 'هذا النص لن يظهر في الصفحة للمستخدمين' : 'This text will not be visible to users on the page'}
          </p>
        </Field>
      )}

      {/* ── navbar ── */}
      {type === 'navbar' && (
        <Field label={isAr ? 'عناصر شريط التنقل (الاسم | المسار)' : 'Navigation Items (Name | Path)'}>
          <div className="space-y-1.5">
            {props.items.map((item, i) => (
              <div key={i} className="flex gap-1.5 items-center">
                <input className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
                  value={item.label} placeholder={isAr ? 'الاسم' : 'Name'} dir={isAr ? 'rtl' : 'ltr'}
                  onChange={e => onUpdate({ items: props.items.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
                <input className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-300"
                  value={item.href} placeholder="/path" dir="ltr"
                  onChange={e => onUpdate({ items: props.items.map((x, j) => j === i ? { ...x, href: e.target.value } : x) })} />
                {props.items.length > 1 && (
                  <button onClick={() => onUpdate({ items: props.items.filter((_, j) => j !== i) })}
                    className="text-red-400 hover:text-red-600 text-sm px-1">×</button>
                )}
              </div>
            ))}
            <button onClick={() => onUpdate({ items: [...props.items, { label: isAr ? 'صفحة جديدة' : 'New Page', href: '/new' }] })}
              className="text-xs text-indigo-600 hover:text-indigo-800 mt-1">
              {isAr ? '+ إضافة عنصر' : '+ Add Item'}
            </button>
          </div>
        </Field>
      )}

      {/* ── Live editable code ── */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            {isAr ? 'الكود — عدّله مباشرة' : 'Code — Edit Directly'}
          </p>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">HTML</span>
        </div>
        <textarea
          value={rawCode}
          onChange={e => onCodeChange(e.target.value)}
          spellCheck={false}
          dir="ltr"
          className={`w-full bg-slate-900 rounded-xl p-3 text-xs font-mono resize-none focus:outline-none leading-relaxed transition-all
            ${item.codeError ? 'text-red-400 ring-2 ring-red-500' : 'text-green-400 focus:ring-2 focus:ring-indigo-500'}`}
          rows={Math.max(3, rawCode.split('\n').length + 1)}
        />
        {item.codeError ? (
          <div className="mt-1.5 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-2" dir={isAr ? 'rtl' : 'ltr'}>
            <span className="flex-shrink-0">⚠️</span>
            <span>{item.codeError}</span>
          </div>
        ) : (
          <p className="text-xs text-slate-400 mt-1.5">
            💡 {isAr ? 'عدّل الكود مباشرة وشاهد التغيير في اللوحة' : 'Edit the code directly and see changes in the canvas'}
          </p>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-slate-400 text-xs leading-relaxed">{isAr ? def.description : def.descriptionEn}</p>
      </div>
    </div>
  )
}

export default function Page1Components() {
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [canvasItems, setCanvasItems] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [browserTab, setBrowserTab] = useState('preview')
  const [browserHighlight, setBrowserHighlight] = useState(null)
  const codeBlockRefs = useRef({})
  const navigate = useNavigate()

  // Auto-scroll to highlighted code block when switching to source tab
  useEffect(() => {
    if (browserHighlight && browserTab === 'source') {
      codeBlockRefs.current[browserHighlight]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [browserHighlight, browserTab])

  const selectedItem = canvasItems.find(i => i.id === selectedId) || null

  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('componentType', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true) }

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const type = e.dataTransfer.getData('componentType')
    if (type) {
      const defaultProps = isAr ? DEFAULT_PROPS_AR : DEFAULT_PROPS_EN
      const props = JSON.parse(JSON.stringify(defaultProps[type]))
      const newItem = { id: Date.now(), type, props, rawCode: generateCode(type, props), codeError: null }
      setCanvasItems(prev => [...prev, newItem])
      setSelectedId(newItem.id)
    }
  }

  const clearCanvas = () => { setCanvasItems([]); setSelectedId(null) }

  const removeItem = (id) => {
    setCanvasItems(prev => prev.filter(i => i.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  // Visual controls changed → update props AND re-derive code
  const updateItemProps = (id, newProps) => {
    setCanvasItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updatedProps = { ...item.props, ...newProps }
      return { ...item, props: updatedProps, rawCode: generateCode(item.type, updatedProps) }
    }))
  }

  // Code textarea changed → validate first, then parse back to props
  const updateItemCode = (id, rawCode) => {
    setCanvasItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const error = validateCode(item.type, rawCode, isAr)
      if (error) return { ...item, rawCode, codeError: error }
      const parsed = parseCode(item.type, rawCode)
      return { ...item, rawCode, codeError: null, ...(parsed ? { props: { ...item.props, ...parsed } } : {}) }
    }))
  }

  return (
    <div className="page-transition max-w-7xl mx-auto px-4 py-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
            {isAr ? 'درس ١' : 'Lesson 1'}
          </span>
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-2">
          {isAr ? 'مستكشف مكونات الموقع' : 'Website Component Explorer'}
        </h1>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <MousePointerClick className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-indigo-800 text-sm">{isAr ? 'كيفية الاستخدام:' : 'How to use:'}</p>
          <p className="text-indigo-700 text-sm">
            {isAr
              ? 'اسحب مكونًا من القائمة اليمنى وأفلته في اللوحة. انقر عليه لتعديل خصائصه عبر الأدوات أو بتعديل الكود مباشرة — كلاهما يُحدّث اللوحة فورًا.'
              : 'Drag a component from the left panel and drop it onto the canvas. Click it to edit its properties using the tools or by editing the code directly — both update the canvas instantly.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Sidebar */}
        <div className="col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span>🧩</span> {isAr ? 'مكونات الموقع' : 'Website Components'}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              {isAr ? 'اسحب أيًا من هذه المكونات إلى اللوحة' : 'Drag any of these components onto the canvas'}
            </p>
            <div className="space-y-2">
              {COMPONENT_ORDER.map(type => {
                const def = COMPONENT_DEFINITIONS[type]
                return (
                  <div key={type} draggable onDragStart={(e) => handleDragStart(e, type)}
                    className={`drag-item flex items-center gap-3 p-3 rounded-xl border ${def.color} select-none`}>
                    <span className="text-xl">{def.icon}</span>
                    <div>
                      <div className="font-semibold text-sm">{isAr ? def.arabicName : def.englishName}</div>
                      <code className="text-xs opacity-60 font-mono">&lt;{def.htmlTag}&gt;</code>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span>🖥️</span> {isAr ? 'لوحة البناء' : 'Build Canvas'}
              </h2>
              <div className="flex items-center gap-2">
                {canvasItems.length > 0 && (
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                    {canvasItems.length} {isAr ? 'مكون' : 'component(s)'}
                  </span>
                )}
                {canvasItems.length > 0 && (
                  <button onClick={clearCanvas}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> {isAr ? 'مسح' : 'Clear'}
                  </button>
                )}
              </div>
            </div>

            <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              className={`canvas-drop-zone rounded-xl border-2 p-4 transition-all ${
                isDragOver ? 'border-indigo-400 bg-indigo-50 drag-over' : 'border-dashed border-slate-300'
              }`}>
              {canvasItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <span className="text-5xl mb-3">🖱️</span>
                  <p className="text-sm font-medium">{isAr ? 'اسحب المكونات هنا' : 'Drag components here'}</p>
                  <p className="text-xs text-slate-300 mt-1">{isAr ? 'ابدأ ببناء صفحتك' : 'Start building your page'}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {canvasItems.map(item => (
                    <div key={item.id} className="relative group">
                      <CanvasComponent item={item} isSelected={selectedId === item.id}
                        onClick={() => setSelectedId(item.id)} isAr={isAr} />
                      <button onClick={() => removeItem(item.id)}
                        className={`absolute top-1 ${isAr ? 'left-1' : 'right-1'} w-5 h-5 bg-red-100 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 text-xs`}>
                        ×
                      </button>
                    </div>
                  ))}
                  {isDragOver && (
                    <div className="border-2 border-dashed border-indigo-400 rounded-lg p-3 text-center text-indigo-500 text-sm">
                      {isAr ? 'أفلت هنا ✓' : 'Drop here ✓'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Panel */}
        <div className="col-span-4">
          {selectedItem ? (
            <EditPanel
              item={selectedItem}
              onUpdate={(p) => updateItemProps(selectedItem.id, p)}
              onCodeChange={(code) => updateItemCode(selectedItem.id, code)}
              isAr={isAr}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 h-full flex flex-col items-center justify-center text-center">
              <Info className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-400 font-medium text-sm">
                {isAr ? 'انقر على أي مكون في اللوحة لتعديله' : 'Click on any component in the canvas to edit it'}
              </p>
              <p className="text-slate-300 text-xs mt-2">
                {isAr ? 'ستظهر هنا أدوات التعديل مع الكود القابل للتعديل' : 'Edit tools and editable code will appear here'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Browser Simulator ──────────────────────────────── */}
      {canvasItems.length > 0 && (
        <div className="mt-8" dir="ltr">
          <div className="flex items-center gap-2 mb-3" dir={isAr ? 'rtl' : 'ltr'}>
            <span className="text-xl">🌐</span>
            <h3 className="font-bold text-slate-700">{isAr ? 'معاينة الموقع' : 'Website Preview'}</h3>
            <span className="text-xs text-slate-400">
              {isAr ? '— انقر على أي عنصر في المعاينة لعرض كوده' : '— click any element in the preview to see its code'}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            {/* Browser chrome */}
            <div className="bg-slate-100 border-b border-slate-200 px-3 pt-2.5 pb-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex gap-1 mx-3">
                  <button
                    onClick={() => { setBrowserTab('preview'); setBrowserHighlight(null) }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      browserTab === 'preview' ? 'bg-white shadow text-slate-700' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    👁 {isAr ? 'معاينة' : 'Preview'}
                  </button>
                  <button
                    onClick={() => setBrowserTab('source')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      browserTab === 'source' ? 'bg-white shadow text-slate-700' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {'</>'} {isAr ? 'الكود المصدري' : 'Source Code'}
                  </button>
                </div>
              </div>
              {/* URL bar */}
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-slate-200">
                <span className="text-green-500 text-xs">🔒</span>
                <span className="text-slate-500 text-xs font-mono flex-1 select-all">https://my-website.com</span>
              </div>
            </div>

            {/* Page content */}
            <div style={{ minHeight: 180, maxHeight: 520, overflowY: 'auto' }}>
              {browserTab === 'preview' ? (
                <div className="bg-white p-5" dir={isAr ? 'rtl' : 'ltr'}>
                  {canvasItems.map(item => {
                    // Comments are invisible in a real browser — only show in source
                    if (item.type === 'comment') return null
                    return (
                      <div
                        key={item.id}
                        onClick={() => { setBrowserHighlight(item.id); setBrowserTab('source') }}
                        className={`rounded-lg px-2 transition-all cursor-pointer
                          hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1
                          ${browserHighlight === item.id ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
                        title={isAr ? 'انقر لعرض الكود المصدري' : 'Click to view source code'}
                      >
                        {RENDER_MAP[item.type]?.(item.props, isAr)}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-slate-950 p-4 font-mono text-xs overflow-x-auto">
                  {/* HTML wrapper — top */}
                  {[
                    `<!DOCTYPE html>`,
                    `<html lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}">`,
                    `<head>`,
                    `  <meta charset="UTF-8" />`,
                    `  <title>${isAr ? 'موقعي' : 'My Website'}</title>`,
                    `</head>`,
                    `<body>`,
                    ``,
                  ].map((line, i) => (
                    <div key={i} className="text-slate-500 whitespace-pre leading-5">{line || ' '}</div>
                  ))}

                  {/* Component code blocks */}
                  {canvasItems.map(item => {
                    const isHl = browserHighlight === item.id
                    return (
                      <div
                        key={item.id}
                        ref={el => { if (el) codeBlockRefs.current[item.id] = el; else delete codeBlockRefs.current[item.id] }}
                        onClick={() => { setBrowserHighlight(item.id); setBrowserTab('preview') }}
                        className={`my-1 rounded px-2 py-1 cursor-pointer transition-all
                          ${isHl ? 'bg-yellow-400/15 ring-1 ring-yellow-400' : 'hover:bg-slate-800'}`}
                      >
                        {item.rawCode.split('\n').map((line, li) => (
                          <div key={li} className={`whitespace-pre leading-5 ${isHl ? 'text-yellow-200' : 'text-green-400'}`}>
                            {line || ' '}
                          </div>
                        ))}
                      </div>
                    )
                  })}

                  {/* HTML wrapper — bottom */}
                  {[``, `</body>`, `</html>`].map((line, i) => (
                    <div key={i} className="text-slate-500 whitespace-pre leading-5">{line || ' '}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {browserTab === 'source' && browserHighlight && (
            <p className="text-xs text-indigo-500 mt-2 text-center" dir={isAr ? 'rtl' : 'ltr'}>
              💡 {isAr
                ? 'الكود المميز باللون الأصفر هو المكون الذي اخترته — انقر أي كود لتحديده'
                : 'Yellow-highlighted code is the component you selected — click any block to highlight it'}
            </p>
          )}
        </div>
      )}

      <Explanation>
        <p className="text-slate-500 text-base mb-4">
          {isAr
            ? 'تعلم كيف تُبنى صفحات الويب من مكونات مختلفة عن طريق السحب والإفلات'
            : 'Learn how web pages are built from different components using drag and drop'}
        </p>
        {canvasItems.length >= 3 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5" dir={isAr ? 'rtl' : 'ltr'}>
            <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
              <span>🎉</span> {isAr ? 'أحسنت! ماذا تعلمت؟' : 'Well done! What did you learn?'}
            </h3>
            <p className="text-emerald-700 text-sm leading-relaxed">
              {isAr ? (
                <>
                  لقد تعرفت على المكونات الأساسية لبناء صفحات الويب. كل موقع تراه على الإنترنت مبني من هذه المكونات:
                  العناوين، الفقرات، الصور، الأزرار، الروابط، حقول الإدخال، وأشرطة التنقل.
                  الروابط مهمة جدًا لأنها تشير إلى <strong>مسارات</strong> مثل{' '}
                  <code className="font-mono bg-emerald-100 px-1 rounded text-xs">/home</code> و
                  <code className="font-mono bg-emerald-100 px-1 rounded text-xs">/admin</code> — سنتعلم عن هذه المسارات في الدرس القادم!
                </>
              ) : (
                <>
                  You've learned about the basic building blocks of web pages. Every website you see online is built from these components:
                  headings, paragraphs, images, buttons, links, input fields, and navigation bars.
                  Links are especially important because they point to <strong>paths</strong> like{' '}
                  <code className="font-mono bg-emerald-100 px-1 rounded text-xs">/home</code> and{' '}
                  <code className="font-mono bg-emerald-100 px-1 rounded text-xs">/admin</code> — we'll learn about these paths in the next lesson!
                </>
              )}
            </p>
          </div>
        )}
      </Explanation>

      <div className="flex items-center pt-6 border-t border-slate-100 mt-8">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">
          <ChevronLeft className="w-4 h-4 rotate-180" />
          {isAr ? '← الرئيسية' : '← Home'}
        </button>
      </div>
    </div>
  )
}
