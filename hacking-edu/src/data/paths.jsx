import { GraduationCap, Swords, ShieldAlert, Bug, Network } from 'lucide-react'

/* ────────────────────────────────────────────────────────────────────────────
   Learning paths (role roadmaps).
   Each PATH targets a role, and is split into ordered LEVELS. Each level lists
   its ROOMS by lesson route (page). The SAME room can appear in several paths
   and several levels — the metadata (title, icon, type) is looked up from the
   shared LESSONS list, so a room is defined once and reused everywhere.
   ──────────────────────────────────────────────────────────────────────────── */
export const PATHS = [
  {
    id: 'fundamentals',
    icon: <GraduationCap className="w-6 h-6" />,
    accent: '#16a34a',
    titleAr: 'أساسيات الأمن السيبراني', titleEn: 'Cyber Security Fundamentals',
    taglineAr: 'ابدأ من الصفر: كيف يعمل الويب والشبكات، وأول خطواتك في الأمن.',
    taglineEn: 'Start from zero: how the web and networks work, and your first steps in security.',
    levels: [
      { titleAr: 'كيف يعمل الويب', titleEn: 'How the web works', rooms: ['/page1', '/page2', '/page3', '/ip-mac'] },
      { titleAr: 'البيانات والأنظمة', titleEn: 'Data & systems', rooms: ['/database', '/terminal', '/linux-fs', '/dns'] },
      { titleAr: 'حافظ على أمانك', titleEn: 'Stay safe online', rooms: ['/password-gen', '/phishing', '/cookies', '/antivirus'] },
      { titleAr: 'أول اختراق لك', titleEn: 'Your first hack', rooms: ['/view-source', '/page5', '/page6'] },
    ],
  },
  {
    id: 'pentester',
    icon: <Swords className="w-6 h-6" />,
    accent: '#dc2626',
    titleAr: 'مختبِر الاختراق', titleEn: 'Penetration Tester',
    taglineAr: 'من الأساسيات إلى الاستطلاع واستغلال الثغرات واختراق الأنظمة.',
    taglineEn: 'From fundamentals to recon, exploiting vulnerabilities, and breaking into systems.',
    levels: [
      { titleAr: 'الأساسيات', titleEn: 'Fundamentals', rooms: ['/page1', '/page2', '/database', '/ip-mac'] },
      { titleAr: 'الاستطلاع والمسح', titleEn: 'Recon & scanning', rooms: ['/nmap', '/dorking', '/view-source', '/page3', '/page4', '/exif'] },
      { titleAr: 'استغلال الويب', titleEn: 'Web exploitation', rooms: ['/sqli', '/xss', '/csrf', '/page5', '/cookies'] },
      { titleAr: 'كلمات المرور والوصول', titleEn: 'Passwords & access', rooms: ['/brute-force', '/barq', '/mac-spoofing'] },
      { titleAr: 'لينكس والطرفية', titleEn: 'Linux & terminal', rooms: ['/terminal', '/terminal-lab', '/linux-fs'] },
      { titleAr: 'التحدي النهائي', titleEn: 'Capstone challenge', rooms: ['/challenge'] },
    ],
  },
  {
    id: 'soc',
    icon: <ShieldAlert className="w-6 h-6" />,
    accent: '#2563eb',
    titleAr: 'محلل عمليات الأمن (SOC)', titleEn: 'SOC Analyst (Blue Team)',
    taglineAr: 'راقب، وحقّق، واكتشف التهديدات والبرمجيات الخبيثة، ودافِع عن الشبكة.',
    taglineEn: 'Monitor, investigate, spot threats and malware, and defend the network.',
    levels: [
      { titleAr: 'الأساسيات', titleEn: 'Foundations', rooms: ['/page2', '/ip-mac', '/dns', '/database'] },
      { titleAr: 'المراقبة والفرز', titleEn: 'Monitoring & triage', rooms: ['/siem', '/soc', '/nmap'] },
      { titleAr: 'التهديدات والبرمجيات الخبيثة', titleEn: 'Threats & malware', rooms: ['/phishing', '/antivirus', '/ransomware', '/xss'] },
      { titleAr: 'الدفاع عن الشبكة', titleEn: 'Network defense', rooms: ['/firewall', '/dns-spoofing', '/dos', '/vpn'] },
    ],
  },
  {
    id: 'webapp',
    icon: <Bug className="w-6 h-6" />,
    accent: '#7c3aed',
    titleAr: 'أمن تطبيقات الويب', titleEn: 'Web Application Security',
    taglineAr: 'تعمّق في ثغرات الويب: الحقن والسكربتات وعيوب المنطق والجلسات.',
    taglineEn: 'Go deep on web bugs: injection, scripting, and logic & session flaws.',
    levels: [
      { titleAr: 'أساسيات الويب', titleEn: 'Web foundations', rooms: ['/page1', '/page2', '/page3', '/database', '/cookies'] },
      { titleAr: 'الاستطلاع', titleEn: 'Recon', rooms: ['/view-source', '/dorking', '/page4'] },
      { titleAr: 'الحقن والسكربتات', titleEn: 'Injection & scripting', rooms: ['/sqli', '/xss'] },
      { titleAr: 'عيوب المنطق والجلسات', titleEn: 'Logic & session flaws', rooms: ['/page5', '/csrf', '/brute-force'] },
      { titleAr: 'الدفاع', titleEn: 'Defense', rooms: ['/page6'] },
    ],
  },
  {
    id: 'network',
    icon: <Network className="w-6 h-6" />,
    accent: '#0891b2',
    titleAr: 'الشبكات والبنية التحتية', titleEn: 'Networking & Infrastructure',
    taglineAr: 'افهم العناوين وأسماء النطاقات والخدمات والخصوصية وهجمات الشبكة.',
    taglineEn: 'Master addressing, name resolution, services, privacy, and network attacks.',
    levels: [
      { titleAr: 'العنونة', titleEn: 'Addressing', rooms: ['/ip', '/ip-mac', '/dhcp'] },
      { titleAr: 'الأسماء والخدمات', titleEn: 'Names & services', rooms: ['/dns', '/dns-lab', '/ftp'] },
      { titleAr: 'الخصوصية والأنفاق', titleEn: 'Privacy & tunneling', rooms: ['/vpn', '/ip-masking', '/mac-spoofing'] },
      { titleAr: 'الهجمات والدفاع', titleEn: 'Attacks & defense', rooms: ['/nmap', '/dns-spoofing', '/dos', '/dos-lab', '/firewall'] },
    ],
  },
]

// unique room routes across a path's levels (a room shared between levels counts once)
export const pathRooms = p => [...new Set(p.levels.flatMap(l => l.rooms))]
export const pathById = Object.fromEntries(PATHS.map(p => [p.id, p]))
