import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'
import Explanation from '../components/Explanation'

/* ────────────────────────────────────────────────────────────────────────────
   SOC ANALYST LAB — SIEM + Threat Intelligence
   Students triage a queue of security alerts, investigate each one, correlate
   the indicators with the Cyber-Threat-Intelligence (CTI) files, decide whether
   it is a real threat (True Positive) or a false alarm (False Positive), and
   choose the correct response action. A deliberate mix of both is included.
   ──────────────────────────────────────────────────────────────────────────── */

const SEV = {
  critical: { ar:'حرج',    en:'Critical', color:'#dc2626', bg:'#fef2f2', border:'#fca5a5' },
  high:     { ar:'عالٍ',   en:'High',     color:'#ea580c', bg:'#fff7ed', border:'#fdba74' },
  medium:   { ar:'متوسط',  en:'Medium',   color:'#ca8a04', bg:'#fefce8', border:'#fde047' },
  low:      { ar:'منخفض',  en:'Low',      color:'#2563eb', bg:'#eff6ff', border:'#93c5fd' },
  info:     { ar:'معلومة', en:'Info',     color:'#64748b', bg:'#f8fafc', border:'#cbd5e1' },
}

// Response actions the analyst can take
const ACTIONS = [
  { id:'block_ip',     icon:'🚫', ar:'حظر عنوان IP',                 en:'Block source IP' },
  { id:'isolate_host', icon:'🔌', ar:'عزل الجهاز عن الشبكة',          en:'Isolate the host' },
  { id:'disable_acct', icon:'🔒', ar:'تعطيل حساب المستخدم',           en:'Disable the account' },
  { id:'reset_creds',  icon:'🔑', ar:'إعادة تعيين كلمة المرور + MFA', en:'Reset password + MFA' },
  { id:'escalate',     icon:'🚨', ar:'التصعيد لفريق الاستجابة',       en:'Escalate to IR team' },
  { id:'quarantine',   icon:'🧪', ar:'عزل الملف الخبيث',              en:'Quarantine the file' },
  { id:'close_fp',     icon:'✅', ar:'إغلاق كإنذار كاذب / ضبط القاعدة', en:'Close as false positive / tune' },
  { id:'monitor',      icon:'👁️', ar:'مراقبة ومتابعة',               en:'Monitor & watch' },
  { id:'notify',       icon:'📧', ar:'إبلاغ المستخدم / الدعم',        en:'Notify user / IT' },
]
const actionLabel = (id, ar) => { const a = ACTIONS.find(x => x.id === id); return a ? `${a.icon} ${ar ? a.ar : a.en}` : id }

/* ── Cyber Threat Intelligence dossiers ──────────────────────────────────────
   Three threat actors + one INTERNAL reference sheet. The internal sheet is the
   key to recognising false positives. IOC values are language-neutral; the
   human context lives in the bilingual facts/note fields. */
const CTI_FILES = [
  {
    id:'desert_serpent', emoji:'🐍', code:'TA-01',
    nameAr:'أفعى الصحراء', nameEn:'Desert Serpent',
    kindAr:'مجموعة تجسّس (APT)', kindEn:'Espionage group (APT-class)',
    motiveAr:'تجسّس وسرقة بيانات — تستهدف قطاعي الطاقة والمال في الخليج.',
    motiveEn:'Espionage & data theft — targets Gulf energy and finance sectors.',
    ips:['185.220.101.45', '45.147.230.12'],
    hashes:['a1b2c3d4e5f6a1b2 (SerpentRAT)'],
    tools:['SerpentRAT (custom)', 'Spearphishing', 'Cloud exfil → mega.nz'],
    factsAr:['تصيّد موجّه بالبريد ثم تثبيت RAT مخصص', 'تسرّب البيانات إلى تخزين سحابي مثل mega.nz'],
    factsEn:['Spearphishing → installs a custom RAT', 'Exfiltrates data to cloud storage such as mega.nz'],
    noteAr:'بطيئة وصبورة — قد تبقى مختبئة أسابيع.',
    noteEn:'Slow and patient — can hide for weeks.',
  },
  {
    id:'ghostbear', emoji:'🐻', code:'TA-02',
    nameAr:'الدبّ الشبح', nameEn:'GhostBear',
    kindAr:'عصابة برامج فدية', kindEn:'Ransomware crew',
    motiveAr:'ربح مالي عبر التشفير والابتزاز.',
    motiveEn:'Financial gain via encryption and extortion.',
    ips:['45.147.88.20', '45.147.88.0/24'],
    hashes:['d4e5f6a1b2c3d4e5 (BearCrypt)'],
    tools:['SSH/RDP brute force', 'Cobalt Strike', 'vssadmin delete shadows'],
    factsAr:['تدخل عبر القوة الغاشمة ثم تتحرك جانبياً', 'تحذف النسخ الاحتياطية ثم تشفّر الملفات (.locked)'],
    factsEn:['Breaks in via brute force, then moves laterally', 'Deletes backups then encrypts files (.locked)'],
    noteAr:'سريعة وصاخبة بمجرد الدخول — الوقت حرج جداً.',
    noteEn:'Fast and noisy once inside — time is critical.',
  },
  {
    id:'scriptkid', emoji:'👾', code:'TA-03',
    nameAr:'سكربت-كيدي ٤٧', nameEn:'ScriptKid_47',
    kindAr:'مخترق مبتدئ', kindEn:'Low-skill attacker',
    motiveAr:'استعراض وفضول — يستخدم أدوات جاهزة.',
    motiveEn:'Clout and curiosity — uses off-the-shelf tools.',
    ips:['91.203.145.7'],
    hashes:[],
    tools:['nmap', 'hydra', 'sqlmap', 'default-credential attempts'],
    factsAr:['فحص صاخب وعالي الحجم للمنافذ', 'يجرّب كلمات المرور الافتراضية'],
    factsEn:['Noisy, high-volume port scanning', 'Tries default passwords'],
    noteAr:'حجم كبير وضجيج عالٍ لكن مهارة منخفضة — تهديد حقيقي ولكن بسيط.',
    noteEn:'High volume, low skill — a real but low-impact threat.',
  },
  {
    id:'assets', emoji:'🏢', code:'REF',
    nameAr:'أصول الشركة والقائمة البيضاء', nameEn:'Internal Assets & Allow-list',
    kindAr:'مرجع داخلي — ليس تهديداً', kindEn:'Internal reference — NOT a threat',
    motiveAr:'استخدم هذا الملف لتمييز الإنذارات الكاذبة عن الهجمات الحقيقية.',
    motiveEn:'Use this file to tell false positives apart from real attacks.',
    ips:['10.10.10.5', '80.150.44.9'],
    hashes:[],
    tools:['BACKUP-SRV-01', 'sara.h', 'Maint window: Tue 02:00–04:00'],
    factsAr:[
      '10.10.10.5 = فاحص فريق الأمن (Kali) — فحص مُصرّح الأحد 22:00–02:00',
      '80.150.44.9 = مخرج VPN للشركة في فرانكفورت',
      'sara.h = المديرة المالية في رحلة عمل (فرانكفورت) هذا الأسبوع',
      'BACKUP-SRV-01 = نسخ احتياطي ليلي خارجي يبدأ 01:00',
    ],
    factsEn:[
      '10.10.10.5 = security-team scanner (Kali) — authorized scan Sun 22:00–02:00',
      '80.150.44.9 = corporate VPN exit node in Frankfurt',
      'sara.h = CFO on an approved business trip (Frankfurt) this week',
      'BACKUP-SRV-01 = nightly offsite backup job starting 01:00',
    ],
    noteAr:'النشاط المطابق لهذا الملف غالباً إنذار كاذب — لكن تحقّق دائماً.',
    noteEn:'Activity matching this file is usually a false positive — but always verify.',
  },
]

/* ── The alert queue ─────────────────────────────────────────────────────────
   verdict: 'malicious' (True Positive) | 'benign' (False Positive / not an attack)
   good: array of acceptable action ids · cti: related CTI file id (for feedback) */
const ALERTS = [
  {
    id:1, sev:'high', catAr:'قوة غاشمة', catEn:'Brute Force',
    titleAr:'٣٢١٤ محاولة دخول فاشلة ثم نجاح على root', titleEn:'3,214 failed logins then a SUCCESS on root',
    time:'02:41', user:'root', host:'WEB-SRV-02', srcIp:'45.147.88.20',
    detailAr:'٣٢١٤ محاولة تسجيل دخول SSH فاشلة خلال ٩٠ ثانية من العنوان 45.147.88.20، ثم تسجيل دخول ناجح واحد على حساب root.',
    detailEn:'3,214 failed SSH logins in 90 seconds from 45.147.88.20, followed by ONE successful login as root.',
    log:'sshd[2213]: Accepted password for root from 45.147.88.20 after 3214 failed attempts',
    ind:[{t:'ip',v:'45.147.88.20'},{t:'account',v:'root'}],
    whyAr:'ارتفاع هائل في محاولات الدخول الفاشلة يتبعه نجاح.', whyEn:'Massive spike of failed logins followed by a success.',
    verdict:'malicious', good:['block_ip','isolate_host'], cti:'ghostbear',
    expAr:'العنوان 45.147.88.20 يقع ضمن نطاق GhostBear للقوة الغاشمة (45.147.88.0/24). النجاح بعد آلاف المحاولات يعني أن الخادم اخترق. احظر العنوان واعزل الخادم وأعد ضبط كلمة مرور root وصعّد.',
    expEn:'45.147.88.20 sits in GhostBear’s brute-force range (45.147.88.0/24). A success after thousands of tries means the server is compromised. Block the IP, isolate the host, rotate root’s password, and escalate.',
  },
  {
    id:2, sev:'critical', catAr:'برمجية خبيثة', catEn:'Malware',
    titleAr:'EDR رصد تشغيل ملف خبيث معروف', titleEn:'EDR flagged a known-malicious file executing',
    time:'09:12', user:'omar.f', host:'FIN-WS-07', srcIp:'—',
    detailAr:'رصد الـ EDR تشغيل الملف invoice_q3.exe على الجهاز FIN-WS-07، وبصمته (hash) مطابقة لبرمجية معروفة، وفشل عزله تلقائياً.',
    detailEn:'EDR saw invoice_q3.exe execute on FIN-WS-07. Its hash matches a known malware sample, and auto-quarantine failed.',
    log:'EDR: quarantine FAILED — a1b2c3d4e5f6a1b2 (invoice_q3.exe) executed on FIN-WS-07',
    ind:[{t:'hash',v:'a1b2c3d4e5f6a1b2'},{t:'host',v:'FIN-WS-07'}],
    whyAr:'بصمة الملف مطابقة لعينة برمجية خبيثة معروفة.', whyEn:'The file hash matches a known malware sample.',
    verdict:'malicious', good:['isolate_host','quarantine','escalate'], cti:'desert_serpent',
    expAr:'البصمة a1b2c3… مطابقة لـ SerpentRAT الخاص بمجموعة «أفعى الصحراء». هذا تهديد مؤكد. اعزل الجهاز فوراً واعزل الملف وصعّد للاستجابة.',
    expEn:'Hash a1b2c3… matches Desert Serpent’s SerpentRAT — a confirmed threat. Isolate the host, quarantine the file, and escalate to IR.',
  },
  {
    id:3, sev:'high', catAr:'تصيّد', catEn:'Phishing',
    titleAr:'مستخدم أدخل بياناته في موقع تصيّد', titleEn:'User submitted credentials to a phishing site',
    time:'11:47', user:'lina.k', host:'HR-WS-03', srcIp:'—',
    detailAr:'ضغطت المستخدمة lina.k رابطاً لموقع paypa1-secure[.]com (تزييف لاسم paypal) وأدخلت بيانات دخولها الوظيفية.',
    detailEn:'User lina.k clicked a link to paypa1-secure[.]com (a typosquat of paypal) and entered her corporate credentials.',
    log:'proxy: POST https://paypa1-secure[.]com/login user=lina.k (credential submission)',
    ind:[{t:'domain',v:'paypa1-secure[.]com'},{t:'account',v:'lina.k'}],
    whyAr:'اسم النطاق مزيّف وتم إرسال بيانات دخول إليه.', whyEn:'The domain is a typosquat and credentials were sent to it.',
    verdict:'malicious', good:['reset_creds','notify'], cti:null,
    expAr:'سرقة بيانات دخول حقيقية. أعد تعيين كلمة مرور lina.k وفعّل MFA وأبلغها، وراقب حسابها لأي استخدام مشبوه. الاسم المزيّف paypa1 دليل واضح.',
    expEn:'A real credential theft. Reset lina.k’s password, enforce MFA, notify her, and watch her account for misuse. The paypa1 typosquat is the giveaway.',
  },
  {
    id:4, sev:'medium', catAr:'دخول شاذ', catEn:'Anomalous Login',
    titleAr:'سفر مستحيل: الدوحة ثم فرانكفورت خلال ٤٠ دقيقة', titleEn:'Impossible travel: Doha then Frankfurt in 40 min',
    time:'14:20', user:'sara.h', host:'—', srcIp:'80.150.44.9',
    detailAr:'سجّلت sara.h الدخول من الدوحة الساعة 13:40 ثم من فرانكفورت (80.150.44.9) الساعة 14:20 — سرعة تنقّل مستحيلة.',
    detailEn:'sara.h logged in from Doha at 13:40, then from Frankfurt (80.150.44.9) at 14:20 — impossible geo-velocity.',
    log:'auth: user=sara.h login OK from 80.150.44.9 (Frankfurt, DE) — geo-velocity anomaly',
    ind:[{t:'ip',v:'80.150.44.9'},{t:'account',v:'sara.h'}],
    whyAr:'موقعان متباعدان جداً خلال وقت قصير.', whyEn:'Two far-apart locations within a short time.',
    verdict:'benign', good:['close_fp','monitor'], cti:'assets',
    expAr:'راجع ملف الأصول الداخلية: sara.h (المديرة المالية) في رحلة عمل بفرانكفورت، والعنوان 80.150.44.9 هو مخرج VPN الرسمي للشركة هناك. إنذار كاذب — تحقّق ثم أغلقه واضبط القاعدة.',
    expEn:'Check the internal assets file: sara.h (CFO) is on an approved Frankfurt trip, and 80.150.44.9 is the company’s Frankfurt VPN exit. A false positive — verify, then close and tune the rule.',
  },
  {
    id:5, sev:'medium', catAr:'فحص منافذ', catEn:'Port Scan',
    titleAr:'فحص شامل للمنافذ عبر الشبكة الداخلية', titleEn:'Full port scan across the internal network',
    time:'Sun 23:10', user:'—', host:'الشبكة / network', srcIp:'10.10.10.5',
    detailAr:'فحص كامل للمنافذ من 10.10.10.5 استهدف ٢٥٤ جهازاً على الشبكة 192.168.0.0/24 مساء الأحد الساعة 23:10.',
    detailEn:'A full port scan from 10.10.10.5 hit 254 hosts on 192.168.0.0/24 on Sunday at 23:10.',
    log:'ids: portscan from 10.10.10.5 -> 192.168.0.0/24 (254 hosts, 1000+ ports)',
    ind:[{t:'ip',v:'10.10.10.5'}],
    whyAr:'نشاط فحص واسع النطاق للمنافذ.', whyEn:'Broad port-scanning activity.',
    verdict:'benign', good:['close_fp'], cti:'assets',
    expAr:'العنوان 10.10.10.5 هو فاحص فريق الأمن (Kali)، والوقت ضمن نافذة الفحص المُصرّح بها (الأحد 22:00–02:00). لا تحظر أدوات فريقك — إنذار كاذب، أضِفه للقائمة البيضاء.',
    expEn:'10.10.10.5 is the security team’s own scanner (Kali), and the time is inside the authorized window (Sun 22:00–02:00). Don’t block your own pentest — a false positive; add it to the allow-list.',
  },
  {
    id:6, sev:'critical', catAr:'تسريب بيانات', catEn:'Data Exfiltration',
    titleAr:'رفع ٨.٤ جيجابايت إلى mega.nz من نفس الجهاز المصاب', titleEn:'8.4 GB uploaded to mega.nz from the infected host',
    time:'03:05', user:'omar.f', host:'FIN-WS-07', srcIp:'—',
    detailAr:'رُفعت ٨.٤ جيجابايت من الجهاز FIN-WS-07 إلى mega.nz الساعة 03:05 — وهو نفس الجهاز في تنبيه البرمجية الخبيثة (#2).',
    detailEn:'8.4 GB uploaded from FIN-WS-07 to mega.nz at 03:05 — the same host as the malware alert (#2).',
    log:'proxy: 8.4GB upload FIN-WS-07 -> mega.nz over 20 min (03:05)',
    ind:[{t:'host',v:'FIN-WS-07'},{t:'tool',v:'mega.nz'}],
    whyAr:'نقل كمية كبيرة من البيانات إلى تخزين سحابي خارجي ليلاً.', whyEn:'Large data transfer to external cloud storage at night.',
    verdict:'malicious', good:['isolate_host','escalate'], cti:'desert_serpent',
    expAr:'اربط الأدلة: نفس الجهاز FIN-WS-07 المصاب بـ SerpentRAT (#2)، ومجموعة «أفعى الصحراء» تسرّب البيانات إلى mega.nz. سرقة بيانات نشطة — اعزل الجهاز فوراً وصعّد للاستجابة. هذا هو جوهر الربط (Correlation).',
    expEn:'Correlate: same host FIN-WS-07 infected by SerpentRAT (#2), and Desert Serpent exfiltrates to mega.nz. Active data theft — isolate the host now and escalate. This is what correlation is about.',
  },
  {
    id:7, sev:'low', catAr:'استطلاع', catEn:'Recon',
    titleAr:'فحص nmap على خادم الويب العام', titleEn:'nmap scan against the public web server',
    time:'16:30', user:'—', host:'WEB-SRV-01', srcIp:'91.203.145.7',
    detailAr:'فحص منافذ من نوع nmap من العنوان 91.203.145.7 استهدف كل منافذ خادم الويب العام.',
    detailEn:'An nmap SYN scan from 91.203.145.7 swept every port of the public web server.',
    log:'fw: 91.203.145.7 nmap SYN scan -> WEB-SRV-01:1-65535',
    ind:[{t:'ip',v:'91.203.145.7'},{t:'tool',v:'nmap'}],
    whyAr:'فحص منافذ خارجي من عنوان غير معروف.', whyEn:'External port scan from an unknown address.',
    verdict:'malicious', good:['block_ip','monitor'], cti:'scriptkid',
    expAr:'العنوان 91.203.145.7 وأداة nmap يطابقان ملف ScriptKid_47. تهديد حقيقي لكنه منخفض المهارة والخطورة — احظر العنوان وراقب. لا حاجة لاستجابة كاملة. تعلّم: تناسب الاستجابة مع الخطر.',
    expEn:'91.203.145.7 + nmap match the ScriptKid_47 file. A real but low-skill, low-impact threat — block the IP and monitor; no full IR needed. Lesson: match the response to the risk.',
  },
  {
    id:8, sev:'high', catAr:'نقل بيانات كبير', catEn:'Large Data Transfer',
    titleAr:'نقل ٢١٠ جيجابايت من خادم النسخ الاحتياطي', titleEn:'210 GB transfer from the backup server',
    time:'01:00', user:'—', host:'BACKUP-SRV-01', srcIp:'—',
    detailAr:'نُقلت ٢١٠ جيجابايت من BACKUP-SRV-01 إلى عنوان خارجي بين 01:00 و01:48.',
    detailEn:'210 GB transferred from BACKUP-SRV-01 to an external IP between 01:00 and 01:48.',
    log:'netflow: BACKUP-SRV-01 -> 203.0.113.7 210GB (01:00-01:48)',
    ind:[{t:'host',v:'BACKUP-SRV-01'}],
    whyAr:'حجم بيانات ضخم يغادر الشبكة.', whyEn:'A very large volume of data leaving the network.',
    verdict:'benign', good:['close_fp'], cti:'assets',
    expAr:'ملف الأصول يوضّح أن BACKUP-SRV-01 يُشغّل نسخة احتياطية خارجية مجدولة الساعة 01:00. سلوك متوقّع — إنذار كاذب. تعلّم: اعرف السلوك الطبيعي (Baseline) قبل أن تصدر حكماً.',
    expEn:'The assets file shows BACKUP-SRV-01 runs a scheduled offsite backup at 01:00. Expected behavior — a false positive. Lesson: know your baseline before you judge.',
  },
  {
    id:9, sev:'high', catAr:'تصعيد صلاحيات', catEn:'Privilege Escalation',
    titleAr:'مستخدم أضاف نفسه إلى Domain Admins ليلاً', titleEn:'A user added themselves to Domain Admins at night',
    time:'02:14', user:'dev.omar', host:'DC-01', srcIp:'—',
    detailAr:'أضاف الحساب dev.omar نفسه إلى مجموعة «Domain Admins» الساعة 02:14 خارج أوقات العمل ودون تذكرة تغيير.',
    detailEn:'Account dev.omar added itself to the “Domain Admins” group at 02:14, off-hours, with no change ticket.',
    log:'ad: dev.omar added to group "Domain Admins" (02:14, no change ticket)',
    ind:[{t:'account',v:'dev.omar'}],
    whyAr:'رفع صلاحيات حسّاس في وقت غير معتاد وبلا تفويض.', whyEn:'A sensitive privilege change at an unusual time with no authorization.',
    verdict:'malicious', good:['disable_acct','escalate'], cti:null,
    expAr:'ترقية ذاتية إلى Domain Admin ليلاً وبلا تذكرة = حساب مخترق أو تهديد داخلي. عطّل الحساب فوراً وصعّد، وتحقّق من المستخدم عبر قناة أخرى. راقب دائماً تغييرات الهوية والصلاحيات.',
    expEn:'Self-elevation to Domain Admin at night with no ticket = a compromised account or an insider threat. Disable the account, escalate, and verify with the user out-of-band. Always watch identity and privilege changes.',
  },
  {
    id:10, sev:'info', catAr:'سياسة/صحّة', catEn:'Policy / Hygiene',
    titleAr:'توقيعات مكافح الفيروسات قديمة على جهاز', titleEn:'Endpoint has outdated antivirus signatures',
    time:'08:00', user:'—', host:'SALES-WS-12', srcIp:'—',
    detailAr:'الجهاز SALES-WS-12 يُبلّغ أن توقيعات مكافح الفيروسات متأخرة ٦ أيام.',
    detailEn:'SALES-WS-12 reports that its antivirus signatures are 6 days out of date.',
    log:'edr: SALES-WS-12 AV signatures outdated (age 6d)',
    ind:[{t:'host',v:'SALES-WS-12'}],
    whyAr:'مخالفة لسياسة تحديث التوقيعات.', whyEn:'A signature-update policy violation.',
    verdict:'benign', good:['notify','monitor'], cti:null,
    expAr:'هذه مشكلة صحّة/سياسة وليست هجوماً — لا يوجد مهاجم. لا تعزل ولا تحظر؛ أبلغ الدعم لتحديث التوقيعات وراقب. تعلّم: ليست كل الإنذارات هجمات، ولا تُبالغ في ردّ الفعل.',
    expEn:'This is a hygiene/policy issue, not an attack — there is no adversary. Don’t isolate or block; notify IT to update signatures and monitor. Lesson: not every alert is an attack, and don’t over-react.',
  },
  {
    id:11, sev:'critical', catAr:'برنامج فدية', catEn:'Ransomware',
    titleAr:'حذف النسخ الاحتياطية وتشفير جماعي جارٍ الآن', titleEn:'Shadow copies deleted, mass encryption in progress',
    time:'02:58', user:'—', host:'FIN-WS-09', srcIp:'—',
    detailAr:'نُفّذ الأمر «vssadmin delete shadows /all» على FIN-WS-09، وأُعيدت تسمية ٤١٢٠ ملفاً إلى .locked مع ظهور مذكرة فدية.',
    detailEn:'“vssadmin delete shadows /all” ran on FIN-WS-09, 4,120 files were renamed to .locked, and a ransom note appeared.',
    log:'edr: FIN-WS-09 vssadmin delete shadows /all + 4120 files -> *.locked (02:58)',
    ind:[{t:'host',v:'FIN-WS-09'},{t:'tool',v:'vssadmin delete shadows'},{t:'hash',v:'d4e5f6a1b2c3d4e5'}],
    whyAr:'حذف النسخ الاحتياطية وتشفير جماعي للملفات.', whyEn:'Backup deletion and mass file encryption.',
    verdict:'malicious', good:['isolate_host','escalate'], cti:'ghostbear',
    expAr:'برنامج فدية GhostBear قيد التنفيذ: بصمة BearCrypt وأسلوب vssadmin مطابقان للملف. اعزل الجهاز فوراً لإيقاف الانتشار ثم صعّد للاستجابة. السرعة أهم شيء مع الفدية — احتواء أولاً.',
    expEn:'GhostBear ransomware in progress: the BearCrypt hash and the vssadmin technique match the file. Isolate the host immediately to stop the spread, then escalate. With ransomware, speed matters most — contain first.',
  },
]

const Chip = ({ label, value, mono = true }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#0f172a', border:'1px solid #334155',
    borderRadius:7, padding:'3px 9px', fontSize:11, color:'#e2e8f0', fontFamily: mono ? 'monospace' : 'inherit' }} dir="ltr">
    {label && <span style={{ fontSize:9, color:'#7dd3fc', fontWeight:700, textTransform:'uppercase' }}>{label}</span>}
    <span>{value}</span>
  </span>
)

export default function PageSOCLab() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [selId, setSelId]       = useState(ALERTS[0].id)
  const [decisions, setDec]     = useState({})    // id -> { verdict, action, vOk, aOk, result }
  const [verdict, setVerdict]   = useState(null)  // draft verdict for current alert
  const [action, setAction]     = useState(null)  // draft action for current alert
  const [openCti, setOpenCti]   = useState(() => new Set())

  const current = ALERTS.find(a => a.id === selId)
  const done    = decisions[selId]
  const triaged = Object.keys(decisions).length
  const correct = Object.values(decisions).filter(d => d.result === 'correct').length
  const allDone = triaged === ALERTS.length

  const selectAlert = id => { setSelId(id); const d = decisions[id]; setVerdict(d ? d.verdict : null); setAction(d ? d.action : null) }

  const submit = () => {
    if (!verdict || !action || done) return
    const vOk = verdict === current.verdict
    const aOk = current.good.includes(action)
    const result = vOk && aOk ? 'correct' : vOk ? 'partial' : 'wrong'
    setDec(prev => ({ ...prev, [current.id]: { verdict, action, vOk, aOk, result } }))
  }

  const toggleCti = id => setOpenCti(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const resetLab = () => { setDec({}); setVerdict(null); setAction(null); setSelId(ALERTS[0].id) }

  const sev = SEV[current.sev]

  return (
    <div style={{ maxWidth:1180, margin:'0 auto', padding:'20px 14px', fontFamily:'sans-serif' }} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{`
        @keyframes soc-in { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes soc-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .soc-alert { text-align:start; width:100%; border:2px solid #e2e8f0; background:white; border-radius:11px; cursor:pointer; transition:all .15s; }
        .soc-btn { border:none; border-radius:9px; padding:9px 18px; font-size:13px; font-weight:700; cursor:pointer; transition:all .2s; }
        .soc-btn:hover:not(:disabled){ filter:brightness(1.07); transform:translateY(-1px); }
        .soc-btn:disabled{ opacity:.5; cursor:not-allowed; }
        .soc-act { border:2px solid #e2e8f0; background:white; border-radius:9px; font-size:11.5px; font-weight:600; color:#334155; cursor:pointer; text-align:start; transition:all .15s; }
        .soc-act:hover:not(:disabled){ border-color:#7c3aed; }
        .soc-act:disabled{ cursor:default; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <span style={{ background:'#eef2ff', color:'#4338ca', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
            🛰️ {isAr ? 'مركز العمليات الأمنية' : 'Security Operations (SOC)'}
          </span>
          <button onClick={() => navigate('/')}
            style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:7, padding:'3px 10px', fontSize:12, color:'#64748b', cursor:'pointer' }}>
            {isAr ? '← الرئيسية' : '← Home'}
          </button>
        </div>
        <h1 style={{ fontSize:24, fontWeight:900, color:'#1e293b', margin:'0 0 5px' }}>
          🛰️ {isAr ? 'مختبر محلل الأمن — SIEM والاستخبارات' : 'SOC Analyst Lab — SIEM & Threat Intel'}
        </h1>
      </div>

      {/* ── CTI files ─────────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius:14, padding:16, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <h2 style={{ fontSize:15, fontWeight:800, color:'white', margin:0 }}>📁 {isAr ? 'ملفات الاستخبارات (CTI)' : 'Threat Intelligence Files (CTI)'}</h2>
        </div>
        <p style={{ fontSize:11.5, color:'rgba(255,255,255,0.55)', margin:'0 0 12px', lineHeight:1.6 }}>
          {isAr ? 'اقرأها أولاً ثم طابِق مؤشرات كل تنبيه معها. الملف الأخير 🏢 مرجع داخلي يكشف الإنذارات الكاذبة.'
                : 'Read these first, then match each alert’s indicators against them. The last file 🏢 is an internal reference that reveals false positives.'}
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:10 }}>
          {CTI_FILES.map(f => {
            const open = openCti.has(f.id)
            const ref = f.id === 'assets'
            return (
              <div key={f.id} style={{ background: ref ? 'rgba(252,173,15,0.08)' : 'rgba(255,255,255,0.05)',
                border:`1.5px solid ${ref ? 'rgba(252,173,15,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius:11, overflow:'hidden' }}>
                <button onClick={() => toggleCti(f.id)} style={{ width:'100%', textAlign:'start', background:'transparent', border:'none',
                  cursor:'pointer', padding:'11px 13px', display:'flex', alignItems:'center', gap:9 }}>
                  <span style={{ fontSize:24 }}>{f.emoji}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:'white' }}>{isAr ? f.nameAr : f.nameEn}</div>
                    <div style={{ fontSize:10, color: ref ? '#fcad0f' : '#7dd3fc', fontWeight:600 }}>{f.code} · {isAr ? f.kindAr : f.kindEn}</div>
                  </div>
                  <span style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>{open ? '▲' : '▼'}</span>
                </button>
                {open && (
                  <div style={{ padding:'0 13px 13px', animation:'soc-in .2s ease' }}>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', lineHeight:1.6, marginBottom:9 }}>{isAr ? f.motiveAr : f.motiveEn}</div>
                    {[['IP', f.ips], ['HASH', f.hashes], [isAr ? 'أدوات / أصول' : 'TOOLS / ASSETS', f.tools]].map(([lbl, arr]) => arr.length > 0 && (
                      <div key={lbl} style={{ marginBottom:7 }}>
                        <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontWeight:700, marginBottom:4, letterSpacing:0.5 }}>{lbl}</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>{arr.map(v => <Chip key={v} value={v} />)}</div>
                      </div>
                    ))}
                    <ul style={{ margin:'8px 0 0', paddingInlineStart:18, fontSize:11, color:'rgba(255,255,255,0.65)', lineHeight:1.65 }}>
                      {(isAr ? f.factsAr : f.factsEn).map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                    <div style={{ fontSize:10.5, color: ref ? '#fcad0f' : '#93c5fd', marginTop:8, fontStyle:'italic' }}>💡 {isAr ? f.noteAr : f.noteEn}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:14 }}>
        {[
          [isAr ? 'تم فرزها' : 'Triaged', `${triaged} / ${ALERTS.length}`, '#7c3aed'],
          [isAr ? 'صحيحة تماماً' : 'Fully correct', `${correct}`, '#16a34a'],
          [isAr ? 'الدقّة' : 'Accuracy', triaged ? `${Math.round((correct / triaged) * 100)}%` : '—', '#0891b2'],
        ].map(([lbl, val, col]) => (
          <div key={lbl} style={{ flex:1, minWidth:120, background:'white', border:'2px solid #e2e8f0', borderRadius:11, padding:'9px 14px' }}>
            <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700 }}>{lbl}</div>
            <div style={{ fontSize:20, fontWeight:900, color:col }}>{val}</div>
          </div>
        ))}
      </div>

      {/* ── SIEM console: queue + investigation ──────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,320px) 1fr', gap:16, marginBottom:20, alignItems:'start' }}>

        {/* Alert queue */}
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:1, marginBottom:8 }}>{isAr ? 'قائمة التنبيهات' : 'ALERT QUEUE'}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {ALERTS.map(a => {
              const s = SEV[a.sev]; const d = decisions[a.id]; const active = a.id === selId
              const mark = d ? (d.result === 'correct' ? '✅' : d.result === 'partial' ? '🟡' : '❌') : ''
              return (
                <button key={a.id} onClick={() => selectAlert(a.id)} className="soc-alert"
                  style={{ borderColor: active ? '#7c3aed' : '#e2e8f0', background: active ? '#faf5ff' : d ? '#f8fafc' : 'white',
                    padding:'10px 12px', opacity: d && !active ? 0.75 : 1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                    <span style={{ width:9, height:9, borderRadius:'50%', background:s.color, flexShrink:0, animation: a.sev === 'critical' && !d ? 'soc-pulse 1s infinite' : 'none' }} />
                    <span style={{ fontSize:9, fontWeight:800, color:s.color, background:s.bg, border:`1px solid ${s.border}`, borderRadius:5, padding:'1px 6px' }}>{isAr ? s.ar : s.en}</span>
                    <span style={{ fontSize:9, color:'#94a3b8', fontFamily:'monospace' }} dir="ltr">{a.time}</span>
                    <span style={{ marginInlineStart:'auto', fontSize:12 }}>{mark}</span>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#1e293b', lineHeight:1.4 }}>{isAr ? a.titleAr : a.titleEn}</div>
                  <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>{isAr ? a.catAr : a.catEn}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Investigation panel */}
        <div style={{ background:'white', border:'2px solid #e2e8f0', borderRadius:14, padding:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:8 }}>
            <span style={{ fontSize:11, fontWeight:800, color:sev.color, background:sev.bg, border:`1px solid ${sev.border}`, borderRadius:6, padding:'2px 9px' }}>{isAr ? sev.ar : sev.en}</span>
            <span style={{ fontSize:11, fontWeight:700, color:'#64748b', background:'#f1f5f9', borderRadius:6, padding:'2px 9px' }}>{isAr ? current.catAr : current.catEn}</span>
            <span style={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace' }} dir="ltr">#{current.id} · {current.time}</span>
          </div>
          <h3 style={{ fontSize:16, fontWeight:800, color:'#1e293b', margin:'0 0 10px' }}>{isAr ? current.titleAr : current.titleEn}</h3>

          {/* meta grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:8, marginBottom:12 }}>
            {[[isAr ? 'المستخدم' : 'User', current.user], [isAr ? 'الجهاز' : 'Host', current.host], [isAr ? 'عنوان المصدر' : 'Source IP', current.srcIp]].map(([l, v]) => (
              <div key={l} style={{ background:'#f8fafc', borderRadius:8, padding:'6px 10px' }}>
                <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700 }}>{l}</div>
                <div style={{ fontSize:12, fontWeight:700, color:'#334155', fontFamily:'monospace' }} dir="ltr">{v}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize:13, color:'#334155', lineHeight:1.7, margin:'0 0 12px' }}>{isAr ? current.detailAr : current.detailEn}</p>

          {/* raw log */}
          <div style={{ background:'#0f172a', borderRadius:9, padding:'10px 13px', marginBottom:12, overflowX:'auto' }} dir="ltr">
            <div style={{ fontSize:9, color:'#64748b', fontWeight:700, marginBottom:4 }}>RAW LOG</div>
            <code style={{ fontFamily:'monospace', fontSize:11, color:'#a5f3fc', whiteSpace:'pre', lineHeight:1.6 }}>{current.log}</code>
          </div>

          {/* indicators */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:6 }}>
              {isAr ? '🔗 المؤشرات (طابِقها مع ملفات الاستخبارات):' : '🔗 Indicators (match them against the CTI files):'}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {current.ind.map((i, k) => <Chip key={k} label={i.t} value={i.v} />)}
            </div>
          </div>

          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:9, padding:'8px 12px', marginBottom:14, fontSize:11.5, color:'#92610a' }}>
            ⚠️ {isAr ? 'سبب التنبيه: ' : 'Why flagged: '}{isAr ? current.whyAr : current.whyEn}
          </div>

          {/* ── Decision ─────────────────────────────────────────────────────── */}
          {!done ? (
            <div style={{ borderTop:'1px dashed #e2e8f0', paddingTop:14 }}>
              {/* verdict */}
              <div style={{ fontSize:12, fontWeight:800, color:'#1e293b', marginBottom:7 }}>{isAr ? '١) ما حكمك؟' : '1) Your verdict?'}</div>
              <div style={{ display:'flex', gap:10, marginBottom:14 }}>
                {[['malicious', '🛑', isAr ? 'تهديد حقيقي' : 'True Positive', '#dc2626', '#fef2f2', '#fca5a5'],
                  ['benign', '✅', isAr ? 'إنذار كاذب' : 'False Positive', '#16a34a', '#f0fdf4', '#86efac']].map(([v, ic, lbl, col, bg, bd]) => (
                  <button key={v} onClick={() => setVerdict(v)} style={{ flex:1, padding:'11px', borderRadius:11, cursor:'pointer',
                    border:`2px solid ${verdict === v ? col : '#e2e8f0'}`, background: verdict === v ? bg : 'white',
                    color: verdict === v ? col : '#64748b', fontSize:13, fontWeight:800, transition:'all .15s' }}>
                    {ic} {lbl}
                  </button>
                ))}
              </div>
              {/* action */}
              <div style={{ fontSize:12, fontWeight:800, color:'#1e293b', marginBottom:7 }}>{isAr ? '٢) اختر الإجراء المناسب' : '2) Choose the response action'}</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:7, marginBottom:14 }}>
                {ACTIONS.map(a => (
                  <button key={a.id} onClick={() => setAction(a.id)} className="soc-act"
                    style={{ padding:'8px 10px', borderColor: action === a.id ? '#7c3aed' : '#e2e8f0', background: action === a.id ? '#faf5ff' : 'white', color: action === a.id ? '#6d28d9' : '#334155' }}>
                    {a.icon} {isAr ? a.ar : a.en}
                  </button>
                ))}
              </div>
              <button onClick={submit} disabled={!verdict || !action} className="soc-btn"
                style={{ background: (!verdict || !action) ? '#cbd5e1' : '#7c3aed', color:'white', width:'100%' }}>
                {isAr ? '🔎 أرسِل القرار' : '🔎 Submit decision'}
              </button>
            </div>
          ) : (
            /* ── Feedback ─────────────────────────────────────────────────────── */
            <div style={{ borderTop:'1px dashed #e2e8f0', paddingTop:14, animation:'soc-in .25s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <span style={{ fontSize:22 }}>{done.result === 'correct' ? '✅' : done.result === 'partial' ? '🟡' : '❌'}</span>
                <span style={{ fontSize:14, fontWeight:800, color: done.result === 'correct' ? '#16a34a' : done.result === 'partial' ? '#ca8a04' : '#dc2626' }}>
                  {done.result === 'correct' ? (isAr ? 'قرار صحيح تماماً!' : 'Fully correct!')
                    : done.result === 'partial' ? (isAr ? 'الحكم صحيح، لكن الإجراء ليس الأمثل' : 'Right verdict, but not the best action')
                    : (isAr ? 'حكم غير صحيح — راجع الشرح' : 'Wrong verdict — review the explanation')}
                </span>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10, fontSize:11.5 }}>
                <span style={{ background: done.vOk ? '#f0fdf4' : '#fef2f2', color: done.vOk ? '#16a34a' : '#dc2626', border:`1px solid ${done.vOk ? '#86efac' : '#fca5a5'}`, borderRadius:7, padding:'3px 9px', fontWeight:700 }}>
                  {isAr ? 'الحكم الصحيح: ' : 'Correct verdict: '}{current.verdict === 'malicious' ? (isAr ? 'تهديد حقيقي 🛑' : 'True Positive 🛑') : (isAr ? 'إنذار كاذب ✅' : 'False Positive ✅')}
                </span>
              </div>
              <div style={{ fontSize:11.5, color:'#475569', marginBottom:10 }}>
                <span style={{ fontWeight:700 }}>{isAr ? 'أفضل إجراء: ' : 'Best action(s): '}</span>
                {current.good.map(g => actionLabel(g, isAr)).join(isAr ? '  أو  ' : '  or  ')}
              </div>
              {current.cti && (
                <div style={{ background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:9, padding:'8px 12px', marginBottom:10, fontSize:11.5, color:'#4338ca' }}>
                  📁 {isAr ? 'الربط مع الاستخبارات: ' : 'Correlates with CTI: '}
                  <b>{(() => { const f = CTI_FILES.find(x => x.id === current.cti); return f ? `${f.emoji} ${isAr ? f.nameAr : f.nameEn}` : '' })()}</b>
                </div>
              )}
              <div style={{ background:'#f8fafc', borderRadius:9, padding:'11px 13px', fontSize:12.5, color:'#334155', lineHeight:1.75 }}>
                🎓 {isAr ? current.expAr : current.expEn}
              </div>

              {/* next */}
              {(() => {
                const idx = ALERTS.findIndex(a => a.id === selId); const next = ALERTS[idx + 1]
                return next && !allDone ? (
                  <button onClick={() => selectAlert(next.id)} className="soc-btn" style={{ background:'#0e1f39', color:'white', width:'100%', marginTop:12 }}>
                    {isAr ? 'التنبيه التالي →' : 'Next alert →'}
                  </button>
                ) : null
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Debrief */}
      {allDone && (
        <div style={{ background:'linear-gradient(135deg,#7c3aed,#4338ca)', borderRadius:14, padding:20, marginBottom:20, color:'white', animation:'soc-in .3s ease' }}>
          <div style={{ fontSize:22, fontWeight:900, marginBottom:6 }}>🎓 {isAr ? 'انتهت الوردية!' : 'Shift complete!'}</div>
          <div style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>
            {isAr ? `قرارات صحيحة تماماً: ${correct} من ${ALERTS.length}` : `Fully correct decisions: ${correct} of ${ALERTS.length}`}
            {'  ·  '}
            {correct >= 9 ? (isAr ? 'محلل ممتاز! 🏆' : 'Excellent analyst! 🏆') : correct >= 6 ? (isAr ? 'أداء جيد 👍' : 'Solid work 👍') : (isAr ? 'راجع الشروحات وحاول مجدداً' : 'Review the explanations and retry')}
          </div>
          <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 15px', fontSize:12.5, lineHeight:1.8 }}>
            <b>{isAr ? 'خلاصة المحلل:' : 'Analyst takeaways:'}</b>
            <ul style={{ margin:'6px 0 0', paddingInlineStart:18 }}>
              <li>{isAr ? 'ليست كل التنبيهات هجمات — تحقّق من السياق قبل الحكم (كان ٤ منها إنذارات كاذبة).' : 'Not every alert is an attack — check context first (4 of these were false positives).'}</li>
              <li>{isAr ? 'اربط المؤشرات مع الاستخبارات: نفس الجهاز أو نفس البصمة يكشف سلسلة الهجوم.' : 'Correlate indicators with CTI: the same host or hash reveals the attack chain.'}</li>
              <li>{isAr ? 'ناسِب الاستجابة مع الخطر: الفدية = احتواء فوري، والاستطلاع البسيط = حظر ومراقبة.' : 'Match response to risk: ransomware = contain now; simple recon = block & monitor.'}</li>
            </ul>
          </div>
          <button onClick={resetLab} className="soc-btn" style={{ background:'white', color:'#4338ca', marginTop:14 }}>
            {isAr ? '↺ ابدأ وردية جديدة' : '↺ Start a new shift'}
          </button>
        </div>
      )}

      {/* explanation — collapsed by default, sits under the practical part */}
      <Explanation>
        <p style={{ fontSize:13, color:'#64748b', margin:'0 0 16px', maxWidth:820, lineHeight:1.7 }}>
          {isAr
            ? 'أنت محلل في مركز عمليات أمنية. راجع التنبيهات، وحقّق فيها، وطابِق مؤشراتها مع ملفات الاستخبارات (CTI)، ثم قرّر: تهديد حقيقي أم إنذار كاذب؟ واختر الإجراء الصحيح. بعض التنبيهات بسيطة وبعضها يحتاج ربطاً — والبعض إنذارات كاذبة!'
            : 'You are a SOC analyst. Review the alerts, investigate them, match their indicators against the Threat-Intel (CTI) files, then decide: real threat or false alarm? Pick the right response. Some alerts are simple, some need correlation — and some are false positives!'}
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:11 }}>
          {[
            { icon:'🛰️', tAr:'ما هو SIEM؟', tEn:'What is a SIEM?', bAr:'نظام يجمع سجلات كل الأجهزة في مكان واحد ويطلق تنبيهاً عند رصد نشاط مشبوه.', bEn:'A system that gathers logs from every device in one place and raises an alert when it spots suspicious activity.' },
            { icon:'🕵️', tAr:'دور محلل SOC', tEn:'The SOC Analyst', bAr:'يفرز التنبيهات، يحقّق في السياق، ويقرّر الإجراء — من يفرز أولاً وبأي سرعة يهم كثيراً.', bEn:'Triages alerts, investigates the context, and decides the action — what you triage first, and how fast, matters.' },
            { icon:'📁', tAr:'الاستخبارات (CTI)', tEn:'Threat Intel (CTI)', bAr:'ملفات عن المهاجمين المعروفين ومؤشراتهم (IP، بصمات، أدوات) — تربطها بالتنبيه لتفهمه.', bEn:'Files on known attackers and their indicators (IPs, hashes, tools) — you correlate them with an alert to understand it.' },
            { icon:'⚖️', tAr:'حقيقي أم كاذب؟', tEn:'True vs False Positive', bAr:'ليست كل التنبيهات هجمات. الإنذار الكاذب نشاط شرعي أطلق تنبيهاً — تعلّم أن تميّزه.', bEn:'Not every alert is an attack. A false positive is legitimate activity that tripped an alert — learn to tell them apart.' },
          ].map(c => (
            <div key={c.tEn} style={{ background:'white', border:'2px solid #e2e8f0', borderRadius:12, padding:14 }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{c.icon}</div>
              <div style={{ fontSize:12, fontWeight:800, color:'#1e293b', marginBottom:4 }}>{isAr ? c.tAr : c.tEn}</div>
              <div style={{ fontSize:11, color:'#64748b', lineHeight:1.6 }}>{isAr ? c.bAr : c.bEn}</div>
            </div>
          ))}
        </div>
      </Explanation>

      {/* Nav */}
      <div style={{ display:'flex', justifyContent:'center', marginTop:20 }}>
        <button onClick={() => navigate('/')}
          style={{ display:'flex', alignItems:'center', gap:6, color:'#1d4ed8', background:'#eff6ff',
            border:'2px solid #bfdbfe', borderRadius:10, padding:'10px 28px', cursor:'pointer', fontSize:14, fontWeight:700 }}>
          <ChevronLeft size={15} />{isAr ? 'الرئيسية' : 'Home'}
        </button>
      </div>
    </div>
  )
}
