import { useNavigate } from 'react-router-dom'
import {
  Globe, Layers, Map, Server, Terminal, Shield, Lock,
  KeyRound, MessageSquare, Flame, BookOpen, Wifi, Network, ShieldAlert, Activity, HelpCircle, Swords, MonitorDot, VenetianMask, Fingerprint, FolderOpen, Zap, ShieldCheck, Database, Code2, Gamepad2, Fish, FileLock2, Bug, Camera, ScanSearch, Cookie, Send, ArrowDownUp, Table2
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { PATHS, pathRooms } from '../data/paths'
import { getDone } from '../utils/progress'

export const LESSONS = [
  {
    icon: <Layers className="w-5 h-5" />,
    color: 'bg-purple-100 text-purple-700',
    badge: 'bg-purple-50 text-purple-600 border-purple-200',
    titleAr: 'مكونات الموقع',    titleEn: 'Website Components',
    descAr: 'تعرف على اللبنات الأساسية لبناء صفحات الويب من عناوين وأزرار ونصوص',
    descEn: 'Learn the fundamental building blocks of web pages: headings, buttons, text',
    page: '/page1', typeAr: 'درس', typeEn: 'Lesson',
  },
  {
    icon: <Server className="w-5 h-5" />,
    color: 'bg-cyan-100 text-cyan-700',
    badge: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    titleAr: 'كيف يعمل الويب',   titleEn: 'Client-Server',
    descAr: 'شاهد رحلة الطلب من المتصفح إلى الخادم مع محاكاة بصرية بطيئة',
    descEn: 'Watch a request travel from browser to server with a slow-motion animation',
    page: '/page2', typeAr: 'درس', typeEn: 'Lesson',
  },
  {
    icon: <Map className="w-5 h-5" />,
    color: 'bg-blue-100 text-blue-700',
    badge: 'bg-blue-50 text-blue-600 border-blue-200',
    titleAr: 'المسارات والصفحات المخفية', titleEn: 'Routes & Hidden Pages',
    descAr: 'اكتشف كيف تعمل مسارات المواقع وابحث عن صفحات مخفية لا يوجد رابط يؤدي إليها',
    descEn: 'Discover how website routes work and find hidden pages with no visible link',
    page: '/page3', typeAr: 'درس', typeEn: 'Lesson',
  },
  {
    icon: <Terminal className="w-5 h-5" />,
    color: 'bg-emerald-100 text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    titleAr: 'أداة كاشف',        titleEn: 'Kashif Tool',
    descAr: 'جرب طرفية تفاعلية حقيقية واكتشف الصفحات المخفية باستخدام أداة كاشف',
    descEn: 'Use an interactive terminal and discover hidden pages with the Kashif tool',
    page: '/page4', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    color: 'bg-orange-100 text-orange-700',
    badge: 'bg-orange-50 text-orange-600 border-orange-200',
    titleAr: 'ثغرة IDOR',         titleEn: 'IDOR Vulnerability',
    descAr: 'افهم كيف يستطيع المهاجم الوصول لبيانات مستخدم آخر بتغيير رقم في الرابط',
    descEn: 'Understand how an attacker accesses other users\' data by changing a number in the URL',
    page: '/page5', typeAr: 'درس', typeEn: 'Lesson',
  },
  {
    icon: <Table2 className="w-5 h-5" />,
    color: 'bg-indigo-100 text-indigo-700',
    badge: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    titleAr: 'كيف تعمل قواعد البيانات (SQL)', titleEn: 'How SQL Databases Work',
    descAr: 'قاعدة بيانات حقيقية مصغّرة بثلاثة جداول مترابطة — اكتب استعلامات SQL حقيقية (SELECT وWHERE وORDER BY وGROUP BY وJOIN) وشاهد النتيجة تُحسب فعلياً، وأكمل ٧ مهام تُتقن بها كل مفهوم',
    descEn: 'A real mini-database with three linked tables — write genuine SQL (SELECT, WHERE, ORDER BY, GROUP BY, JOIN) and watch the result actually computed, completing 7 missions that master each concept',
    page: '/database', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Database className="w-5 h-5" />,
    color: 'bg-purple-100 text-purple-700',
    badge: 'bg-purple-50 text-purple-600 border-purple-200',
    titleAr: 'حقن SQL — SQL Injection', titleEn: 'SQL Injection',
    descAr: 'صفحة دخول مصابة: شاهد جملة SQL تُبنى مباشرةً من إدخالك، وتبحث في الجدول صفاً صفاً — ثم تجاوز التحقق بحقن مثل \' OR 1=1 --',
    descEn: 'A vulnerable login: watch the SQL query build live from your input and scan the table row by row — then bypass it with \' OR 1=1 --',
    page: '/sqli', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Bug className="w-5 h-5" />,
    color: 'bg-fuchsia-100 text-fuchsia-700',
    badge: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200',
    titleAr: 'حقن السكربتات المُخزّن — XSS', titleEn: 'Stored Cross-Site Scripting (XSS)',
    descAr: 'احفظ «تعليقاً» هو في الحقيقة كود على الخادم، ثم افتح الصفحة كزائر جديد وشاهد الكود المحفوظ يُنفَّذ في متصفح كل زائر — نافذة منبثقة أو سرقة كوكيز! ثم بدّل للوضع المحمي لترى الحل',
    descEn: 'Save a “comment” that is really code on the server, then open the page as a new visitor and watch the stored code run in every visitor’s browser — a pop-up or cookie theft! Then switch to secure mode to see the fix',
    page: '/xss', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Cookie className="w-5 h-5" />,
    color: 'bg-amber-100 text-amber-700',
    badge: 'bg-amber-50 text-amber-600 border-amber-200',
    titleAr: 'ما هي الكوكيز؟',
    titleEn: 'What Are Cookies?',
    descAr: 'سجّل الدخول وشاهد الخادم يرسل Set-Cookie ومتصفحك يعيدها تلقائياً في كل طلب — مع رؤوس HTTP الحقيقية وجرة الكوكيز، وشرح HttpOnly و Secure و SameSite وعلاقتها بـ XSS و CSRF',
    descEn: 'Log in and watch the server send Set-Cookie and your browser auto-return it on every request — with real HTTP headers and a cookie jar, plus HttpOnly, Secure and SameSite and how they tie into XSS and CSRF',
    page: '/cookies', typeAr: 'درس', typeEn: 'Lesson',
  },
  {
    icon: <Send className="w-5 h-5" />,
    color: 'bg-fuchsia-100 text-fuchsia-700',
    badge: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200',
    titleAr: 'تزوير الطلب عبر المواقع — CSRF',
    titleEn: 'Cross-Site Request Forgery (CSRF)',
    descAr: 'سجّل الدخول إلى بنكك، ثم زُر موقعاً خبيثاً يُرسل سرّاً طلب «حوّل المال» — ومتصفحك يُرفق كوكيك تلقائياً فيُسرق رصيدك دون أن تضغط! ثم فعّل حماية SameSite ورمز CSRF لتفشل الهجمة',
    descEn: "Log into your bank, then visit a malicious site that secretly sends a “transfer money” request — your browser auto-attaches your cookie and your balance is stolen without a click! Then enable SameSite + a CSRF token to make it fail",
    page: '/csrf', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Code2 className="w-5 h-5" />,
    color: 'bg-indigo-100 text-indigo-700',
    badge: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    titleAr: 'ثغرة كود المصدر', titleEn: 'Page Source Vulnerability',
    descAr: 'اضغط Ctrl+U على صفحة دخول لترى اسم المستخدم وكلمة المرور مكتوبين داخل كود HTML — وتعلّم لماذا يجب حذف الأسرار من كود الواجهة قبل النشر',
    descEn: 'Press Ctrl+U on a login page to find the username and password left inside the HTML — and learn why secrets must be removed from front-end code before publishing',
    page: '/view-source', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Swords className="w-5 h-5" />,
    color: 'bg-rose-100 text-rose-700',
    badge: 'bg-rose-50 text-rose-600 border-rose-200',
    titleAr: 'هجوم القوة الغاشمة', titleEn: 'Brute-Force Attack',
    descAr: 'شغّل أداة cracker وحدّد اسم المستخدم وعدد أحرف كلمة المرور والموقع — وشاهد صفحة الدخول في متجر حقيقي تُجرَّب كلمة مرور تلو الأخرى حتى تُكسَر',
    descEn: 'Run the cracker tool — give it a username, password length, and website — and watch a real store’s login page get tried one password after another until it cracks',
    page: '/brute-force', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Lock className="w-5 h-5" />,
    color: 'bg-red-100 text-red-700',
    badge: 'bg-red-50 text-red-600 border-red-200',
    titleAr: 'مختبر الحماية',    titleEn: 'Defense Lab',
    descAr: 'طبّق الحمايات بنفسك وشاهد الفرق بين الموقع المحمي وغير المحمي',
    descEn: 'Apply security controls and see the difference between a protected and unprotected site',
    page: '/page6', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <KeyRound className="w-5 h-5" />,
    color: 'bg-violet-100 text-violet-700',
    badge: 'bg-violet-50 text-violet-600 border-violet-200',
    titleAr: 'تشفير الرسائل',    titleEn: 'Shift Cipher',
    descAr: 'تعلم تشفير الحروف باستخدام عجلة التشفير وتحديات تفاعلية',
    descEn: 'Learn to encrypt letters using the cipher wheel with interactive challenges',
    page: '/page7', typeAr: 'درس', typeEn: 'Lesson',
  },
  {
    icon: <Terminal className="w-5 h-5" />,
    color: 'bg-slate-100 text-slate-700',
    badge: 'bg-slate-50 text-slate-600 border-slate-200',
    titleAr: 'مقدمة إلى الطرفية', titleEn: 'Terminal Introduction',
    descAr: 'تعلم أوامر الطرفية الأساسية مثل ls وcd وnano في بيئة محاكاة آمنة',
    descEn: 'Learn basic terminal commands like ls, cd, nano in a safe simulation environment',
    page: '/terminal', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Wifi className="w-5 h-5" />,
    color: 'bg-violet-100 text-violet-700',
    badge: 'bg-violet-50 text-violet-600 border-violet-200',
    titleAr: 'ما هو DNS؟',        titleEn: 'What is DNS?',
    descAr: 'شاهد كيف يترجم الإنترنت أسماء المواقع إلى عناوين IP عبر محاكاة بصرية خطوة بخطوة',
    descEn: 'Watch how the internet translates domain names into IP addresses with a step-by-step visual simulation',
    page: '/dns', typeAr: 'درس', typeEn: 'Lesson',
  },
  {
    icon: <Wifi className="w-5 h-5" />,
    color: 'bg-blue-100 text-blue-700',
    badge: 'bg-blue-50 text-blue-600 border-blue-200',
    titleAr: 'مختبر DNS التفاعلي', titleEn: 'DNS Resolution Lab',
    descAr: 'محاكاة كاملة لرحلة DNS — ذاكرة التخزين المؤقت في اللابتوب والراوتر وخادم مزود الإنترنت، مع تحريك الحزم وصفحات المواقع الوهمية',
    descEn: 'Full DNS journey simulation — laptop, router & ISP caches, animated packets, and 8 website mockups',
    page: '/dns-lab', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Server className="w-5 h-5" />,
    color: 'bg-emerald-100 text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    titleAr: 'كيف يعمل خادم DHCP؟', titleEn: 'How DHCP Works',
    descAr: 'اكتشف كيف يمنح خادم DHCP عناوين IP للأجهزة تلقائياً — محاكاة DORA التفاعلية، مجمع IPs، والفرق بين الثابت والديناميكي',
    descEn: 'Discover how DHCP auto-assigns IP addresses to devices — interactive DORA simulation, IP pool manager, and static vs dynamic comparison',
    page: '/dhcp', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Network className="w-5 h-5" />,
    color: 'bg-cyan-100 text-cyan-700',
    badge: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    titleAr: 'عنوان IP',          titleEn: 'IP Address',
    descAr: 'تعرّف على عناوين IP من خلال شبكة تفاعلية — أرسل رسائل بين الأجهزة واكتشف أهمية العنوان الصحيح',
    descEn: 'Learn IP addresses through an interactive network — send messages between devices and see why the correct address matters',
    page: '/ip', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Network className="w-5 h-5" />,
    color: 'bg-cyan-100 text-cyan-700',
    badge: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    titleAr: 'كيف تتواصل الأجهزة؟ — IP و MAC',
    titleEn: 'How Devices Communicate — IP & MAC',
    descAr: 'مخطط تفاعلي: افهم العنوان الخاص والعام وعنوان MAC، وشاهد حزمة تسافر من جهازك إلى خدمة إنترنت عبر NAT في الراوتر، مقابل تواصل محلي بين جهازين عبر MAC',
    descEn: 'An interactive diagram: understand private vs public IP and the MAC address, and watch a packet travel from your device to an internet service through the router’s NAT — vs local device-to-device delivery by MAC',
    page: '/ip-mac', typeAr: 'درس', typeEn: 'Lesson',
  },
  {
    icon: <ArrowDownUp className="w-5 h-5" />,
    color: 'bg-teal-100 text-teal-700',
    badge: 'bg-teal-50 text-teal-600 border-teal-200',
    titleAr: 'بروتوكول نقل الملفات — FTP',
    titleEn: 'File Transfer Protocol (FTP)',
    descAr: 'عميل FTP طرفي (connect و USER و PASS و ls و get) بجانب مُتنصّت شبكة — شاهد كلمة مرورك تظهر بنصٍّ صريح على الشبكة، ثم بدّل إلى SFTP لتراها مشفّرة وآمنة',
    descEn: 'A terminal FTP client (connect, USER, PASS, ls, get) next to a network sniffer — watch your password appear in cleartext on the wire, then switch to SFTP to see it encrypted and safe',
    page: '/ftp', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <ShieldAlert className="w-5 h-5" />,
    color: 'bg-red-100 text-red-700',
    badge: 'bg-red-50 text-red-600 border-red-200',
    titleAr: 'محاكاة DNS Spoofing', titleEn: 'DNS Spoofing',
    descAr: 'شاهد كيف يستغل المهاجم نظام DNS لإعادة توجيه المستخدمين إلى مواقع مزيفة — محاكاة تعليمية آمنة',
    descEn: 'See how an attacker exploits DNS to redirect users to fake sites — safe educational simulation',
    page: '/dns-spoofing', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Activity className="w-5 h-5" />,
    color: 'bg-rose-100 text-rose-700',
    badge: 'bg-rose-50 text-rose-600 border-rose-200',
    titleAr: 'محاكاة SIEM — اكتشف التهديد',       titleEn: 'SIEM — Discover the Threat',
    descAr: 'سجل أحداث محايد بلا أي تلميحات أو ألوان — حقّق في كل نشاط واكتشف بنفسك أيّها مشبوه، ثم افحص العنوان على VirusTotal واحظره في الجدار الناري، وشاهد طوبولوجيا حيّة تقطع المهاجم عن الشبكة (مع إنذار كاذب يعلّمك التحقّق أولاً)',
    descEn: "A neutral event feed with no hints or colors — investigate each activity and discover for yourself which is suspicious, then check the IP on VirusTotal and block it in the firewall, watching a live topology cut the attacker off the network (plus a false positive that teaches you to verify first)",
    page: '/siem', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <ShieldAlert className="w-5 h-5" />,
    color: 'bg-indigo-100 text-indigo-700',
    badge: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    titleAr: 'مختبر محلل الأمن (SOC)', titleEn: 'SOC Analyst Lab',
    descAr: 'حقّق في تنبيهات SIEM حقيقية، وطابِقها مع ملفات استخبارات عن المهاجمين، وميّز التهديد الحقيقي من الإنذار الكاذب واتخذ الإجراء الصحيح',
    descEn: 'Investigate real SIEM alerts, correlate them with threat-intel files on attackers, tell true threats from false positives, and take the right action',
    page: '/soc', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Flame className="w-5 h-5" />,
    color: 'bg-amber-100 text-amber-700',
    badge: 'bg-amber-50 text-amber-600 border-amber-200',
    titleAr: 'محاكاة الجدار الناري', titleEn: 'Firewall Simulation',
    descAr: 'أنشئ قواعد الجدار الناري وشاهد كيف تُسمح أو تُحجب الرسائل بصرياً',
    descEn: 'Create firewall rules and watch messages get allowed or blocked visually',
    page: '/firewall', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <HelpCircle className="w-5 h-5" />,
    color: 'bg-indigo-100 text-indigo-700',
    badge: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    titleAr: 'بنك الأسئلة',       titleEn: 'Question Bank',
    descAr: 'اختبر معلوماتك في جميع الدروس — أسئلة متعددة الأنواع بالعربية والإنجليزية',
    descEn: 'Test your knowledge across all lessons — multiple question types in Arabic and English',
    page: '/quiz', typeAr: 'اختبار', typeEn: 'Quiz',
  },
  {
    icon: <Swords className="w-5 h-5" />,
    color: 'bg-red-100 text-red-700',
    badge: 'bg-red-50 text-red-600 border-red-200',
    titleAr: 'أداة برق',           titleEn: 'Barq Tool',
    descAr: 'محاكاة هجوم القوة الغاشمة — جرب كسر كلمة مرور بشكل تعليمي وآمن',
    descEn: 'Brute force simulation — safely crack a password in an educational environment',
    page: '/barq', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <MonitorDot className="w-5 h-5" />,
    color: 'bg-green-100 text-green-700',
    badge: 'bg-green-50 text-green-600 border-green-200',
    titleAr: 'مختبر الطرفية المركزي', titleEn: 'Terminal Lab',
    descAr: 'طرفية مركزية تجمع أدوات جميع الدروس: كاشف، برق، nslookup، الجدار الناري وأكثر',
    descEn: 'Central terminal with all lesson tools: kashif, barq, nslookup, firewall and more',
    page: '/terminal-lab', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <VenetianMask className="w-5 h-5" />,
    color: 'bg-indigo-100 text-indigo-700',
    badge: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    titleAr: 'كيف يعمل VPN؟',    titleEn: 'How VPN Works',
    descAr: 'شاهد كيف يُغير VPN مسار الاتصال ويخفي وجهتك عن ISP — محاكاة بصرية خطوة بخطوة مع الفرق بين VPN وبدونه',
    descEn: 'See how a VPN changes your connection path and hides your destination from ISP — step-by-step visual with and without VPN',
    page: '/vpn', typeAr: 'درس', typeEn: 'Lesson',
  },
  {
    icon: <Fingerprint className="w-5 h-5" />,
    color: 'bg-violet-100 text-violet-700',
    badge: 'bg-violet-50 text-violet-600 border-violet-200',
    titleAr: 'إخفاء IP وتدوير العناوين', titleEn: 'IP Masking & Rotation',
    descAr: 'تعلّم كيف يعمل إخفاء IP وتدوير العناوين، ولماذا لا يضمن الإخفاء التام — تحدٍّ تحقيقي تفاعلي',
    descEn: 'Learn how IP masking and rotation work, and why they don\'t guarantee full anonymity — interactive investigation challenge',
    page: '/ip-masking', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <FolderOpen className="w-5 h-5" />,
    color: 'bg-emerald-100 text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    titleAr: 'نظام الملفات',
    titleEn: 'File System',
    descAr: 'تعلّم الهيكل الشجري لنظام الملفات — تصفح المجلدات بصرياً وعبر الطرفية في آن واحد مع مهام تفاعلية',
    descEn: 'Learn the Linux directory tree — browse folders visually and via terminal simultaneously with interactive tasks',
    page: '/linux-fs', typeAr: 'درس', typeEn: 'Lesson',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    color: 'bg-red-100 text-red-700',
    badge: 'bg-red-50 text-red-600 border-red-200',
    titleAr: 'هجمات DoS و DDoS',
    titleEn: 'DoS & DDoS Attacks',
    descAr: 'شاهد كيف تُشلّ هجمات حرمان الخدمة الخوادم — محاكاة تفاعلية مع ٦ تقنيات حماية مختلفة',
    descEn: 'Watch how denial-of-service attacks cripple servers — interactive simulation with 6 defense techniques',
    page: '/dos', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    color: 'bg-rose-100 text-rose-700',
    badge: 'bg-rose-50 text-rose-600 border-rose-200',
    titleAr: 'مختبر DoS / DDoS — أوامر حقيقية',
    titleEn: 'DoS / DDoS Lab — Real Commands',
    descAr: 'طرفية بأوامر حقيقية (hping3، goldeneye، slowloris) و٦ أنواع إغراق، مع طوبولوجيا محسّنة وتدفّق بطيء يمكنك شرحه خطوة بخطوة',
    descEn: 'A terminal with real commands (hping3, goldeneye, slowloris) and 6 flood types, an improved topology, and a slow flow you can narrate step-by-step',
    page: '/dos-lab', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <KeyRound className="w-5 h-5" />,
    color: 'bg-teal-100 text-teal-700',
    badge: 'bg-teal-50 text-teal-600 border-teal-200',
    titleAr: 'مولّد كلمات المرور',
    titleEn: 'Password Generator',
    descAr: 'تعلّم مبادئ كلمات المرور القوية — وَلّد كلمات مرور آمنة وافهم لماذا تكون بعضها أقوى من غيرها',
    descEn: 'Learn the principles of strong passwords — generate secure passwords and understand what makes them strong',
    page: '/password-gen', typeAr: 'درس', typeEn: 'Lesson',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    color: 'bg-green-100 text-green-700',
    badge: 'bg-green-50 text-green-600 border-green-200',
    titleAr: 'كن أنت برنامج الحماية',
    titleEn: 'You Are the Antivirus',
    descAr: 'تدريب عملي بثلاثة أوضاع: لعبة الفرز، وبحث بصمة الملف يدوياً في جدول برامج ضارة أبلغ عنها الناس لتقرّر مشبوه أم سليم، وأداة تحسب هاش أي نص أو ملف حقيقي ثم تفحصه على VirusTotal',
    descEn: 'Hands-on, three modes: a triage game, a manual hash lookup where you search a file’s hash in a community-reported malware table to decide suspicious or legit, and a tool that hashes any word or real file and checks it on VirusTotal',
    page: '/antivirus', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Fish className="w-5 h-5" />,
    color: 'bg-amber-100 text-amber-700',
    badge: 'bg-amber-50 text-amber-600 border-amber-200',
    titleAr: 'اكتشف رسائل التصيّد',
    titleEn: 'Spot the Phishing',
    descAr: 'اختبار عملي بريد واقعي: مرّر فوق المُرسِل والأزرار والروابط لكشف وجهتها الحقيقية في شريط الحالة، ثم قرّر تصيّد أم حقيقية — أهم مهارة أمان يومية',
    descEn: 'A realistic email quiz: hover over the sender, buttons, and links to reveal their true destination in the status bar, then decide phishing or legit — the most useful everyday security skill',
    page: '/phishing', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <FileLock2 className="w-5 h-5" />,
    color: 'bg-red-100 text-red-700',
    badge: 'bg-red-50 text-red-600 border-red-200',
    titleAr: 'محاكاة برامج الفدية',
    titleEn: 'Ransomware Simulation',
    descAr: 'محاكاة آمنة ومثيرة: افتح المرفق المشبوه وشاهد ملفاتك تُقفَل واحداً تلو الآخر، ثم تظهر مطالبة الفدية — واختر ردّك الصحيح لتتعلّم لماذا النسخ الاحتياطي هو الحل',
    descEn: "A safe, dramatic simulation: open the booby-trapped attachment, watch your files lock one by one and the ransom note appear — then choose your response to learn why backups are the answer",
    page: '/ransomware', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Camera className="w-5 h-5" />,
    color: 'bg-blue-100 text-blue-700',
    badge: 'bg-blue-50 text-blue-600 border-blue-200',
    titleAr: 'البيانات المخفية في الصور — EXIF',
    titleEn: 'Photo Metadata (EXIF)',
    descAr: 'ارفع صورة حقيقية من جهازك (أو استخدم صورة تجريبية) وشاهد ما تكشفه عنك: نوع الجهاز، وقت الالتقاط، وحتى مكانك بالضبط عبر GPS على الخريطة!',
    descEn: 'Upload a real photo from your device (or use a sample) and see what it reveals about you: the device, the time it was taken, even your exact GPS location on the map!',
    page: '/exif', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <ScanSearch className="w-5 h-5" />,
    color: 'bg-indigo-100 text-indigo-700',
    badge: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    titleAr: 'الاختراق عبر جوجل — Dorking',
    titleEn: 'Google Hacking — Dorking',
    descAr: 'محرك بحث محاكى: استخدم عوامل جوجل المتقدّمة (site: filetype: intitle: intext:) لإتمام «فحص أمني» وإيجاد ما تركته مدرسة مكشوفاً — صفحة دخول، قائمة مجلد، جدول درجات مسرّب، وملف كلمات مرور',
    descEn: 'A simulated search engine: use advanced Google operators (site: filetype: intitle: intext:) to run an “audit” and find what a school left exposed — a login page, a directory listing, a leaked grades sheet, and a password file',
    page: '/dorking', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Network className="w-5 h-5" />,
    color: 'bg-pink-100 text-pink-700',
    badge: 'bg-pink-50 text-pink-600 border-pink-200',
    titleAr: 'Nmap — فحص الشبكات',
    titleEn: 'Nmap — Network Scanner',
    descAr: 'اكتشف الأجهزة النشطة على الشبكة وافحص المنافذ المفتوحة — محاكاة تفاعلية بمخرجات Nmap الحقيقية',
    descEn: 'Discover active devices on a network and scan open ports — interactive simulation with real Nmap-style output',
    page: '/nmap', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <VenetianMask className="w-5 h-5" />,
    color: 'bg-teal-100 text-teal-700',
    badge: 'bg-teal-50 text-teal-600 border-teal-200',
    titleAr: 'تمويه عنوان MAC',
    titleEn: 'MAC Spoofing',
    descAr: 'واي فاي الفندق مجاني ٣٠ دقيقة لكل جهاز — يعرفك عبر عنوان MAC. غيّر عنوانك من الطرفية ليظنّك جهازاً جديداً فتحصل على جلسة جديدة، أو انتحل جهاز عميل مدفوع لوصول غير محدود',
    descEn: "The hotel WiFi gives 30 free minutes per device — it knows you by your MAC address. Change it from the terminal so it thinks you're a new device for a fresh session, or impersonate a paying guest for unlimited access",
    page: '/mac-spoofing', typeAr: 'مختبر', typeEn: 'Lab',
  },
  {
    icon: <Swords className="w-5 h-5" />,
    color: 'bg-rose-100 text-rose-700',
    badge: 'bg-rose-50 text-rose-600 border-rose-200',
    titleAr: 'التحدي النهائي',
    titleEn: 'Final Challenge',
    descAr: 'اختبار شامل حقيقي — استخدم جميع أدواتك لاختراق شركة وهمية واكتشاف بياناتها السرية',
    descEn: 'A real comprehensive test — use all your tools to penetrate a simulated company and uncover its secret data',
    page: '/challenge', typeAr: 'تحدي', typeEn: 'Challenge',
  },
  {
    icon: <Gamepad2 className="w-5 h-5" />,
    color: 'bg-indigo-100 text-indigo-700',
    badge: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    titleAr: 'ألعاب التفكير',
    titleEn: 'Mind Games',
    descAr: 'استرِح من الاختراق وتحدَّ عقلك بألعاب ذكاء ممتعة ومتدرّجة الصعوبة عبر ٥ مستويات',
    descEn: 'Take a break from hacking and challenge your mind with fun brain games across 5 difficulty levels',
    page: '/mind-games', typeAr: 'ألعاب', typeEn: 'Games',
  },
]

export default function Welcome() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const isAr = lang === 'ar'
  const done = getDone()
  const num = n => isAr ? Number(n).toLocaleString('ar-EG') : String(n)

  return (
    <div className="min-h-screen bg-cc-cream" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="dark-keep text-white relative overflow-hidden" style={{ background: '#0E1F39' }}>

        {/* Decorative chevron shapes */}
        <svg
          className="absolute opacity-[0.07] pointer-events-none"
          style={{ top: '-60px', right: isAr ? 'auto' : '-40px', left: isAr ? '-40px' : 'auto', width: '420px', height: '420px' }}
          viewBox="0 0 400 400" fill="none"
        >
          <path d="M60 30 C60 30 220 80 300 200 C380 320 320 370 320 370" stroke="#FCAD0F" strokeWidth="90" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
        <svg
          className="absolute opacity-[0.04] pointer-events-none"
          style={{ bottom: '-80px', left: isAr ? 'auto' : '-60px', right: isAr ? '-60px' : 'auto', width: '340px', height: '340px' }}
          viewBox="0 0 400 400" fill="none"
        >
          <path d="M60 30 C60 30 220 80 300 200 C380 320 320 370 320 370" stroke="#FCAD0F" strokeWidth="90" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>

        <div className="max-w-6xl mx-auto px-6 py-7 relative z-10">
          <div className="flex items-center justify-between gap-6">

            {/* Left / Main content */}
            <div className="flex-1 min-w-0">
              <span
                className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 border"
                style={{ background: 'rgba(252,173,15,0.15)', borderColor: 'rgba(252,173,15,0.35)', color: '#FCAD0F' }}
              >
                {isAr ? 'بيئة تعليمية تفاعلية' : 'Interactive Learning Environment'}
              </span>

              <h1 className="text-2xl md:text-3xl font-black leading-tight mb-2" style={{ color: '#ffffff' }}>
                {isAr ? 'تعلّم الاختراق من سيناريوهات واقعية' : 'Learn Hacking Through Real-World Scenarios'}
              </h1>
              <p className="text-sm max-w-lg leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {isAr
                  ? 'كل درس مبني على تقنية تُستخدم في حياتنا اليومية — فهمها يُمكّننا كمخترقين من اكتشاف ثغراتها ونقاط ضعفها.'
                  : 'Every lesson is built around a technology used in our daily lives — understanding it enables us, as hackers, to discover its vulnerabilities and weak points.'}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-5">
                {[
                  [isAr ? LESSONS.length.toLocaleString('ar-EG') : String(LESSONS.length), isAr ? 'درساً ومختبراً'   : 'Lessons & Labs'],
                  [isAr ? '١٠٠٪' : '100%', isAr ? 'محاكاة آمنة'      : 'Safe Simulation'],
                  [isAr ? 'تفاعلي' : 'Live', isAr ? 'بدون قيود تسلسلية' : 'Open Navigation'],
                ].map(([val, label]) => (
                  <div key={label}>
                    <span className="text-lg font-black block" style={{ color: '#FCAD0F' }}>{val}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gold divider line */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #FCAD0F 0%, #e09b00 50%, transparent 100%)' }} />
      </div>

      {/* ── Learning paths (role roadmaps) ────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Map className="w-6 h-6" style={{ color: '#FCAD0F' }} />
            <h2 className="text-2xl font-black" style={{ color: '#0E1F39' }}>{isAr ? 'مسارات التعلّم' : 'Learning Paths'}</h2>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-6 max-w-2xl">
          {isAr
            ? 'اختر دوراً وابدأ رحلة مرتّبة عبر مستويات — تقودك الغرف خطوة بخطوة نحو المهارة. الغرفة نفسها قد تظهر في أكثر من مسار.'
            : 'Pick a role and follow an ordered journey through levels — the rooms lead you step by step toward the skill. The same room may appear in more than one path.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PATHS.map((p) => {
            const rooms = pathRooms(p)
            const total = rooms.length
            const dc = rooms.filter(r => done.has(r)).length
            const pct = total ? Math.round((dc / total) * 100) : 0
            return (
              <button
                key={p.id}
                onClick={() => navigate(`/path/${p.id}`)}
                className={`bg-white rounded-2xl p-5 border-2 hover:shadow-xl hover:-translate-y-1 transition-all ${isAr ? 'text-right' : 'text-left'} group relative overflow-hidden`}
                style={{ borderColor: '#e2e8f0' }}
                dir={isAr ? 'rtl' : 'ltr'}
                onMouseEnter={e => e.currentTarget.style.borderColor = p.accent}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform" style={{ background: p.accent }}>
                    {p.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-base leading-tight" style={{ color: '#0E1F39' }}>{isAr ? p.titleAr : p.titleEn}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">{num(p.levels.length)} {isAr ? 'مستويات' : 'levels'} · {num(total)} {isAr ? 'غرفة' : 'rooms'}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{isAr ? p.taglineAr : p.taglineEn}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.accent }} />
                  </div>
                  <span className="text-xs font-bold whitespace-nowrap" style={{ color: dc ? p.accent : '#64748b' }}>{num(dc)}/{num(total)}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Lessons grid ──────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black" style={{ color: '#0E1F39' }}>
              {isAr ? 'الدروس والمختبرات' : 'Lessons & Labs'}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#FCAD0F' }}>
            <BookOpen className="w-4 h-4" />
            <span className="font-bold">{isAr ? `${LESSONS.length.toLocaleString('ar-EG')} متاح` : `${LESSONS.length} available`}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {LESSONS.map((lesson) => (
            <button
              key={lesson.page}
              onClick={() => navigate(lesson.page)}
              className={`bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all ${isAr ? 'text-right' : 'text-left'} group relative overflow-hidden`}
              style={{ '--tw-border-color': '#e2e8f0' }}
              dir={isAr ? 'rtl' : 'ltr'}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#FCAD0F'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              {/* Icon + badge */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 ${lesson.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {lesson.icon}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${lesson.badge}`}>
                  {isAr ? lesson.typeAr : lesson.typeEn}
                </span>
              </div>

              {/* Title + description */}
              <h3 className="font-bold text-base mb-1.5 leading-tight" style={{ color: '#0E1F39' }}>
                {isAr ? lesson.titleAr : lesson.titleEn}
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                {isAr ? lesson.descAr : lesson.descEn}
              </p>

              {lesson.note && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-pink-500 font-medium">
                  <span>🔗</span>
                  <span>{isAr ? 'يتبع درس التشفير' : 'Follows Cipher lesson'}</span>
                </div>
              )}

              {/* Hover arrow — brand gold (logical end-4 so it mirrors in RTL) */}
              <div className="absolute bottom-4 end-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#FCAD0F' }}>
                  <span className="text-sm font-black" style={{ color: '#0E1F39' }}>{isAr ? '←' : '→'}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ── Important note ──────────────────────────────────────── */}
        <div className="dark-keep mt-10 rounded-2xl p-5 relative overflow-hidden" style={{ background: '#0E1F39' }}>
          {/* Mini chevron decoration */}
          <svg className="absolute opacity-10 pointer-events-none" style={{ top: '-20px', left: isAr ? 'auto' : '-10px', right: isAr ? '-10px' : 'auto', width: 120, height: 120 }} viewBox="0 0 400 400" fill="none">
            <path d="M60 30 C60 30 220 80 300 200 C380 320 320 370 320 370" stroke="#FCAD0F" strokeWidth="90" strokeLinecap="round" fill="none"/>
          </svg>
          <div className="relative z-10" dir={isAr ? 'rtl' : 'ltr'}>
            <h3 className="font-bold mb-1.5 flex items-center gap-2" style={{ color: '#FCAD0F' }}>
              <span>📌</span>
              {isAr ? 'ملاحظة مهمة' : 'Important Note'}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {isAr
                ? 'هذا الموقع هو محاكاة تعليمية آمنة بالكامل. جميع البيانات والسيناريوهات وهمية ومصممة للتعلم. لا يتم إجراء أي فحص حقيقي لأي موقع خارجي.'
                : 'This website is a fully safe educational simulation. All data and scenarios are fictional and designed for learning. No real scanning of any external website is performed.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
