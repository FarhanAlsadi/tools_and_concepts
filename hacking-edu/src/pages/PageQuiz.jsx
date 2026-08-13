import { useState, useMemo, useRef } from 'react'
import { useApp } from '../context/AppContext'
import {
  CheckCircle, XCircle, ChevronRight, ChevronLeft, RotateCcw, BookOpen,
  Pencil, Trash2, Plus, Settings, X, Image, Upload, Link,
} from 'lucide-react'

// ─── Default question bank ────────────────────────────────────────────────────
const DEFAULT_QB = [
  {
    id: 1, titleAr: 'مكونات الموقع', titleEn: 'Website Components',
    color: 'bg-purple-100 text-purple-700', accent: 'purple',
    questions: [
      { type: 'mc', qAr: 'ما وسم HTML المستخدم لإنشاء زر قابل للضغط؟', qEn: 'Which HTML tag creates a clickable button?',
        options: [{ ar: '<btn>', en: '<btn>' }, { ar: '<press>', en: '<press>' }, { ar: '<button>', en: '<button>' }, { ar: '<click>', en: '<click>' }],
        correct: 2, expAr: '<button> هو الوسم الصحيح لإنشاء زر في HTML.', expEn: '<button> is the correct HTML tag for creating a button.' },
      { type: 'tf', qAr: 'CSS تعني "Cascading Style Sheets".', qEn: 'CSS stands for "Cascading Style Sheets".',
        correct: true, expAr: 'صحيح — CSS هي Cascading Style Sheets وتُستخدم لتنسيق صفحات الويب.', expEn: 'True — CSS stands for Cascading Style Sheets, used to style web pages.' },
      { type: 'mc', qAr: 'أي وسم ينشئ أكبر عنوان في HTML؟', qEn: 'Which HTML tag creates the largest heading?',
        options: [{ ar: '<h6>', en: '<h6>' }, { ar: '<head>', en: '<head>' }, { ar: '<title>', en: '<title>' }, { ar: '<h1>', en: '<h1>' }],
        correct: 3, expAr: '<h1> أكبر عنوان. تتراوح العناوين من h1 (أكبر) إلى h6 (أصغر).', expEn: '<h1> is the largest heading. Headings range from h1 (largest) to h6 (smallest).' },
      { type: 'mapping', qAr: 'طابق كل وسم HTML بوظيفته:', qEn: 'Match each HTML tag to its purpose:',
        pairs: [
          { leftAr: '<p>', leftEn: '<p>', rightAr: 'فقرة نصية', rightEn: 'Paragraph' },
          { leftAr: '<img>', leftEn: '<img>', rightAr: 'صورة', rightEn: 'Image' },
          { leftAr: '<a>', leftEn: '<a>', rightAr: 'رابط تشعبي', rightEn: 'Hyperlink' },
          { leftAr: '<ul>', leftEn: '<ul>', rightAr: 'قائمة غير مرتبة', rightEn: 'Unordered list' },
        ],
        expAr: 'p للفقرات، img للصور، a للروابط، ul للقوائم غير المرتبة.', expEn: 'p = paragraph, img = image, a = link, ul = unordered list.' },
      { type: 'mc', qAr: 'ماذا تعني اختصار HTML؟', qEn: 'What does HTML stand for?',
        options: [{ ar: 'HyperText Machine Language', en: 'HyperText Machine Language' }, { ar: 'HyperText Markup Language', en: 'HyperText Markup Language' }, { ar: 'HighText Markup Language', en: 'HighText Markup Language' }, { ar: 'HyperText Meta Language', en: 'HyperText Meta Language' }],
        correct: 1, expAr: 'HTML تعني HyperText Markup Language — لغة ترميز النص التشعبي.', expEn: 'HTML stands for HyperText Markup Language.' },
      { type: 'mc', qAr: 'ما الوسم المستخدم لإنشاء رابط في HTML؟', qEn: 'Which HTML tag creates a hyperlink?',
        options: [{ ar: '<link>', en: '<link>' }, { ar: '<href>', en: '<href>' }, { ar: '<a>', en: '<a>' }, { ar: '<url>', en: '<url>' }],
        correct: 2, expAr: '<a> ينشئ الروابط؛ href تحدد وجهة الرابط.', expEn: 'The <a> tag creates hyperlinks; the href attribute specifies the destination URL.' },
      { type: 'tf', qAr: 'JavaScript تُستخدم لتحديد ألوان وخطوط الموقع.', qEn: 'JavaScript is used to define colors and fonts on a website.',
        correct: false, expAr: 'خطأ — CSS مسؤولة عن التنسيق. JavaScript تضيف التفاعل والمنطق.', expEn: 'False — CSS handles styling. JavaScript adds interactive behavior and logic.' },
      { type: 'mc', qAr: 'أي خاصية CSS تُغيّر لون الخلفية؟', qEn: 'Which CSS property changes the background color?',
        options: [{ ar: 'color', en: 'color' }, { ar: 'background-color', en: 'background-color' }, { ar: 'fill', en: 'fill' }, { ar: 'bg', en: 'bg' }],
        correct: 1, expAr: 'background-color تُحدد لون خلفية العنصر. خاصية color تُغيّر لون النص.', expEn: 'background-color sets the element\'s background. The color property changes text color.' },
      { type: 'tf', qAr: 'يمكن تضمين CSS مباشرةً داخل وسم HTML باستخدام خاصية style.', qEn: 'CSS can be embedded directly in an HTML tag using the style attribute.',
        correct: true, expAr: 'صحيح — هذا يُسمى CSS المضمّن (Inline CSS).', expEn: 'True — this is called inline CSS, e.g. <div style="color:red">.' },
      { type: 'mc', qAr: 'أين يجب وضع وسم <title> في مستند HTML؟', qEn: 'Where should the <title> tag be placed in an HTML document?',
        options: [{ ar: 'داخل <body>', en: 'Inside <body>' }, { ar: 'داخل <footer>', en: 'Inside <footer>' }, { ar: 'داخل <head>', en: 'Inside <head>' }, { ar: 'داخل <main>', en: 'Inside <main>' }],
        correct: 2, expAr: '<title> يوضع في <head> ويظهر كعنوان في تبويب المتصفح.', expEn: '<title> goes inside <head> and appears as the browser tab title.' },
      { type: 'mc', qAr: 'ما الوسم الصحيح لإدراج صورة في HTML؟', qEn: 'Which HTML tag is used to insert an image?',
        options: [{ ar: '<image>', en: '<image>' }, { ar: '<pic>', en: '<pic>' }, { ar: '<photo>', en: '<photo>' }, { ar: '<img>', en: '<img>' }],
        correct: 3, expAr: '<img> يُدرج الصور؛ src يحدد المسار وalt يصف الصورة.', expEn: '<img> inserts images; src specifies the path and alt provides a text description.' },
      { type: 'tf', qAr: 'محدد CSS بنقطة (.) يختار عنصراً بمعرّف فريد (ID).', qEn: 'A CSS dot (.) selector targets an element by its unique ID.',
        correct: false, expAr: 'خطأ — النقطة (.) لمحدد الكلاس (class). المعرّف الفريد يستخدم #.', expEn: 'False — the dot (.) is the class selector. The # symbol targets unique IDs.' },
      { type: 'mc', qAr: 'ما الوسم المستخدم لقائمة مرتبة (مرقّمة) في HTML؟', qEn: 'Which HTML tag creates an ordered (numbered) list?',
        options: [{ ar: '<ul>', en: '<ul>' }, { ar: '<list>', en: '<list>' }, { ar: '<ol>', en: '<ol>' }, { ar: '<dl>', en: '<dl>' }],
        correct: 2, expAr: '<ol> تُنشئ قائمة مرقمة. <ul> تُنشئ قائمة ببنود غير مرتبة.', expEn: '<ol> creates a numbered ordered list. <ul> creates a bulleted unordered list.' },
      { type: 'mapping', qAr: 'طابق كل وسم HTML بنوع المحتوى الذي ينشئه:', qEn: 'Match each HTML tag to the content it creates:',
        pairs: [
          { leftAr: '<h2>', leftEn: '<h2>', rightAr: 'عنوان ثانوي', rightEn: 'Second-level heading' },
          { leftAr: '<table>', leftEn: '<table>', rightAr: 'جدول بيانات', rightEn: 'Data table' },
          { leftAr: '<form>', leftEn: '<form>', rightAr: 'نموذج إدخال', rightEn: 'Input form' },
          { leftAr: '<span>', leftEn: '<span>', rightAr: 'حاوية سطرية', rightEn: 'Inline container' },
        ],
        expAr: 'كل وسم له دور معياري في هيكل صفحة HTML.', expEn: 'Each tag has a standard role in HTML page structure.' },
      { type: 'mc', qAr: 'أيٌّ من التالي يصف دور JavaScript بشكل صحيح؟', qEn: 'Which best describes the role of JavaScript on a webpage?',
        options: [{ ar: 'تنسيق وتجميل العناصر', en: 'Styling and beautifying elements' }, { ar: 'وصف هيكل الصفحة', en: 'Describing the page structure' }, { ar: 'إضافة التفاعل والمنطق البرمجي', en: 'Adding interactivity and programming logic' }, { ar: 'بروتوكول اتصال شبكي', en: 'A network communication protocol' }],
        correct: 2, expAr: 'JavaScript تضيف التفاعل وتتحكم في الأحداث والبيانات ديناميكياً.', expEn: 'JavaScript adds interactivity, controls events, and manipulates data dynamically.' },
    ],
  },
  {
    id: 2, titleAr: 'كيف يعمل الويب', titleEn: 'Client-Server',
    color: 'bg-cyan-100 text-cyan-700', accent: 'cyan',
    questions: [
      { type: 'tf', qAr: 'الخادم (Server) هو الذي يرسل الطلب والمتصفح يستجيب له.', qEn: 'The server sends the request and the browser responds.',
        correct: false, expAr: 'خطأ — المتصفح (العميل) يرسل الطلب، والخادم يستجيب بالصفحة.', expEn: 'False — the browser (client) sends the request; the server responds with the page.' },
      { type: 'mc', qAr: 'ماذا يعني رمز الحالة HTTP 404؟', qEn: 'What does HTTP status code 404 mean?',
        options: [{ ar: 'خطأ في الخادم', en: 'Server error' }, { ar: 'إعادة توجيه', en: 'Redirect' }, { ar: 'الصفحة غير موجودة', en: 'Not Found' }, { ar: 'ممنوع الوصول', en: 'Forbidden' }],
        correct: 2, expAr: '404 تعني أن الصفحة أو المورد المطلوب غير موجود على الخادم.', expEn: '404 means the requested page or resource was not found on the server.' },
      { type: 'mc', qAr: 'ما البروتوكول المستخدم للاتصال الآمن بالمواقع؟', qEn: 'Which protocol is used for secure web communication?',
        options: [{ ar: 'FTP', en: 'FTP' }, { ar: 'SMTP', en: 'SMTP' }, { ar: 'Telnet', en: 'Telnet' }, { ar: 'HTTPS', en: 'HTTPS' }],
        correct: 3, expAr: 'HTTPS يشفر البيانات بين المتصفح والخادم باستخدام TLS.', expEn: 'HTTPS encrypts data between browser and server using TLS.' },
      { type: 'mapping', qAr: 'طابق كل رمز HTTP بمعناه:', qEn: 'Match each HTTP status code to its meaning:',
        pairs: [
          { leftAr: '200', leftEn: '200', rightAr: 'ناجح', rightEn: 'OK / Success' },
          { leftAr: '301', leftEn: '301', rightAr: 'إعادة توجيه دائمة', rightEn: 'Permanent Redirect' },
          { leftAr: '403', leftEn: '403', rightAr: 'ممنوع', rightEn: 'Forbidden' },
          { leftAr: '500', leftEn: '500', rightAr: 'خطأ داخلي في الخادم', rightEn: 'Internal Server Error' },
        ],
        expAr: '200 نجاح، 301 إعادة توجيه، 403 ممنوع، 500 خطأ خادم.', expEn: '200=OK, 301=Redirect, 403=Forbidden, 500=Server Error.' },
      { type: 'tf', qAr: 'المتصفح (Browser) هو نوع من العملاء (Clients).', qEn: 'A web browser is a type of client.',
        correct: true, expAr: 'صحيح — المتصفح عميل يرسل طلبات HTTP ويعرض الاستجابات.', expEn: 'True — a browser is a client that sends HTTP requests and renders responses.' },
      { type: 'mc', qAr: 'أي طريقة HTTP تُستخدم لإرسال بيانات نموذج إلى الخادم؟', qEn: 'Which HTTP method is used to submit form data to the server?',
        options: [{ ar: 'GET', en: 'GET' }, { ar: 'PUT', en: 'PUT' }, { ar: 'POST', en: 'POST' }, { ar: 'DELETE', en: 'DELETE' }],
        correct: 2, expAr: 'POST يُرسل البيانات في جسم الطلب دون إظهارها في الرابط.', expEn: 'POST sends data in the request body without exposing it in the URL.' },
      { type: 'tf', qAr: 'طريقة HTTP GET تُعدّل البيانات على الخادم.', qEn: 'The HTTP GET method modifies data on the server.',
        correct: false, expAr: 'خطأ — GET يسترجع البيانات فقط دون تعديلها (قراءة فقط).', expEn: 'False — GET only retrieves data; it never modifies server-side resources.' },
      { type: 'mc', qAr: 'ما رمز HTTP الذي يعني "تم إنشاء المورد بنجاح"؟', qEn: 'Which HTTP status code means "resource created successfully"?',
        options: [{ ar: '200', en: '200' }, { ar: '204', en: '204' }, { ar: '201', en: '201' }, { ar: '301', en: '301' }],
        correct: 2, expAr: '201 Created يُرجعه الخادم عند إنشاء مورد جديد بنجاح.', expEn: '201 Created is returned when a new resource is successfully created (e.g., user registration).' },
      { type: 'mc', qAr: 'ما المنفذ الافتراضي لبروتوكول HTTPS؟', qEn: 'What is the default port for HTTPS?',
        options: [{ ar: '80', en: '80' }, { ar: '22', en: '22' }, { ar: '8080', en: '8080' }, { ar: '443', en: '443' }],
        correct: 3, expAr: 'HTTPS يعمل على المنفذ 443 افتراضياً. HTTP يعمل على المنفذ 80.', expEn: 'HTTPS uses port 443 by default. HTTP uses port 80.' },
      { type: 'tf', qAr: 'كوكيز الجلسة (Session Cookies) تُخزَّن بشكل دائم على القرص الصلب.', qEn: 'Session cookies are stored permanently on the hard drive.',
        correct: false, expAr: 'خطأ — كوكيز الجلسة تُحذف تلقائياً عند إغلاق المتصفح.', expEn: 'False — session cookies are deleted automatically when the browser is closed.' },
      { type: 'mc', qAr: 'ما الهدف من الكوكيز (Cookies) في HTTP؟', qEn: 'What is the main purpose of cookies in HTTP?',
        options: [{ ar: 'تشفير الاتصال', en: 'Encrypting the connection' }, { ar: 'تسريع الشبكة', en: 'Speeding up the network' }, { ar: 'الحفاظ على حالة الجلسة وتخزين معلومات المستخدم', en: 'Maintaining session state and storing user information' }, { ar: 'حجب الإعلانات', en: 'Blocking advertisements' }],
        correct: 2, expAr: 'الكوكيز تُستخدم للحفاظ على حالة تسجيل الدخول وتخزين التفضيلات.', expEn: 'Cookies maintain login state and store user preferences across multiple HTTP requests.' },
      { type: 'mc', qAr: 'أي طريقة HTTP تُستخدم لحذف مورد من الخادم؟', qEn: 'Which HTTP method is used to delete a resource on the server?',
        options: [{ ar: 'REMOVE', en: 'REMOVE' }, { ar: 'CANCEL', en: 'CANCEL' }, { ar: 'DELETE', en: 'DELETE' }, { ar: 'PURGE', en: 'PURGE' }],
        correct: 2, expAr: 'DELETE هي طريقة HTTP القياسية لحذف الموارد من الخادم.', expEn: 'DELETE is the standard HTTP method for removing resources from the server.' },
      { type: 'mapping', qAr: 'طابق كل طريقة HTTP بوظيفتها:', qEn: 'Match each HTTP method to its function:',
        pairs: [
          { leftAr: 'GET', leftEn: 'GET', rightAr: 'استرجاع بيانات', rightEn: 'Retrieve data' },
          { leftAr: 'POST', leftEn: 'POST', rightAr: 'إرسال بيانات جديدة', rightEn: 'Send new data' },
          { leftAr: 'PUT', leftEn: 'PUT', rightAr: 'تحديث مورد كامل', rightEn: 'Update full resource' },
          { leftAr: 'DELETE', leftEn: 'DELETE', rightAr: 'حذف مورد', rightEn: 'Delete a resource' },
        ],
        expAr: 'طرق HTTP الأربع الأساسية تشكّل أساس REST API.', expEn: 'These four HTTP methods form the foundation of REST APIs.' },
      { type: 'tf', qAr: 'رمز HTTP 503 يعني "الخادم غير متاح مؤقتاً".', qEn: 'HTTP status code 503 means the server is temporarily unavailable.',
        correct: true, expAr: 'صحيح — 503 Service Unavailable يعني أن الخادم مشغول أو في صيانة.', expEn: 'True — 503 Service Unavailable means the server is overloaded or under maintenance.' },
      { type: 'mc', qAr: 'ما الفرق الرئيسي بين GET و POST؟', qEn: 'What is the main difference between GET and POST requests?',
        options: [{ ar: 'GET أسرع دائماً من POST', en: 'GET is always faster than POST' }, { ar: 'GET يُظهر البيانات في الرابط بينما POST يُرسلها في الجسم', en: 'GET shows data in the URL while POST sends it in the request body' }, { ar: 'POST يستخدم HTTPS فقط', en: 'POST only works over HTTPS' }, { ar: 'لا فرق بينهما', en: 'There is no difference between them' }],
        correct: 1, expAr: 'GET يُظهر البيانات في الرابط. POST يُخفيها في جسم الطلب — أكثر أماناً للبيانات الحساسة.', expEn: 'GET exposes data in the URL. POST hides it in the request body — better for sensitive data.' },
    ],
  },
  {
    id: 3, titleAr: 'المسارات والصفحات المخفية', titleEn: 'Routes & Hidden Pages',
    color: 'bg-blue-100 text-blue-700', accent: 'blue',
    questions: [
      { type: 'mc', qAr: 'ماذا يعني مسار "/admin" لخادم الويب؟', qEn: 'What does the path "/admin" tell a web server?',
        options: [{ ar: 'يشفّر الطلب', en: 'It encrypts the request' }, { ar: 'يحدد المورد المطلوب', en: 'It identifies the resource to serve' }, { ar: 'يُسرّع الاتصال', en: 'It speeds up the connection' }, { ar: 'يخفي الصفحة من محركات البحث', en: 'It hides the page from search engines' }],
        correct: 1, expAr: 'المسار يحدد للخادم أي مورد أو صفحة يجب تقديمها.', expEn: 'The path tells the server which resource or page to serve.' },
      { type: 'tf', qAr: 'جميع صفحات الموقع يجب أن يكون لها رابط مرئي في الصفحة الرئيسية.', qEn: 'All website pages must have a visible link on the homepage.',
        correct: false, expAr: 'خطأ — يمكن أن توجد صفحات بدون روابط مرئية، ولكنها قابلة للوصول بكتابة مسارها مباشرة.', expEn: 'False — pages can exist without visible links; they are accessible by typing the path directly.' },
      { type: 'mc', qAr: 'ما التقنية التي تُستخدم لاكتشاف المسارات المخفية بتخمين أسمائها؟', qEn: 'What technique is used to discover hidden paths by guessing their names?',
        options: [{ ar: 'SQL Injection', en: 'SQL Injection' }, { ar: 'Directory Fuzzing', en: 'Directory Fuzzing' }, { ar: 'Cross-Site Scripting', en: 'Cross-Site Scripting' }, { ar: 'Session Hijacking', en: 'Session Hijacking' }],
        correct: 1, expAr: 'Directory Fuzzing (اختبار المسارات) يستخدم قوائم كلمات لتخمين المسارات الموجودة.', expEn: 'Directory Fuzzing uses wordlists to guess and discover existing paths on a server.' },
      { type: 'mapping', qAr: 'طابق كل مسار بمحتواه المتوقع:', qEn: 'Match each URL path to its expected content:',
        pairs: [
          { leftAr: '/login', leftEn: '/login', rightAr: 'نموذج تسجيل الدخول', rightEn: 'Login form' },
          { leftAr: '/admin', leftEn: '/admin', rightAr: 'لوحة تحكم المشرف', rightEn: 'Admin dashboard' },
          { leftAr: '/api', leftEn: '/api', rightAr: 'بيانات برمجية (JSON)', rightEn: 'API data (JSON)' },
          { leftAr: '/robots.txt', leftEn: '/robots.txt', rightAr: 'قواعد الزحف لمحركات البحث', rightEn: 'Crawl rules for search engines' },
        ],
        expAr: 'كل مسار له غرض متعارف عليه.', expEn: 'Each path has a conventional purpose.' },
      { type: 'mc', qAr: 'أي مما يلي يمكن أن يكشف عن صفحات مخفية في موقع ويب؟', qEn: 'Which of the following can reveal hidden pages on a website?',
        options: [{ ar: 'قراءة شهادة SSL', en: 'Reading the SSL certificate' }, { ar: 'فحص خريطة الموقع sitemap.xml', en: 'Checking the sitemap.xml file' }, { ar: 'جميع ما سبق', en: 'All of the above' }, { ar: 'فحص ملف robots.txt', en: 'Checking the robots.txt file' }],
        correct: 2, expAr: 'كلاهما (sitemap.xml و robots.txt) يمكن أن يكشفا عن مسارات غير مرئية.', expEn: 'Both sitemap.xml and robots.txt can expose paths not visible to regular visitors.' },
      { type: 'mc', qAr: 'ما هو الجزء من الرابط الذي يأتي بعد "?" ؟', qEn: 'What is the part of a URL that comes after "?"?',
        options: [{ ar: 'المسار (Path)', en: 'The path' }, { ar: 'سلسلة الاستعلام (Query String)', en: 'The query string' }, { ar: 'البروتوكول', en: 'The protocol' }, { ar: 'المجال (Domain)', en: 'The domain' }],
        correct: 1, expAr: 'سلسلة الاستعلام تنقل معلمات للخادم مثل ?id=5&page=2.', expEn: 'The query string passes parameters to the server, e.g. ?id=5&page=2.' },
      { type: 'tf', qAr: 'ملف robots.txt يمنع فعلياً محركات البحث من الزحف إلى المسارات المذكورة فيه.', qEn: 'The robots.txt file technically prevents search engines from crawling listed paths.',
        correct: false, expAr: 'خطأ — robots.txt مجرد توجيه للروبوتات المحترمة. الخادم لا يمنع الوصول فعلياً.', expEn: 'False — robots.txt is only a guideline for well-behaved bots. The server does not technically block access.' },
      { type: 'mc', qAr: 'أي مما يلي يُعدّ جزءاً من بنية URL الكاملة؟', qEn: 'Which of the following is part of a full URL structure?',
        options: [{ ar: 'البروتوكول فقط (https)', en: 'Protocol only (https)' }, { ar: 'البروتوكول + المجال + المسار', en: 'Protocol + domain + path' }, { ar: 'المسار فقط', en: 'Path only' }, { ar: 'المجال فقط', en: 'Domain only' }],
        correct: 1, expAr: 'URL كاملة: https://example.com/path?query=value', expEn: 'A full URL: https://example.com/path?query=value (protocol + domain + path + query).' },
      { type: 'mc', qAr: 'ما معنى رمز HTTP 403 عند محاولة الوصول لمسار معين؟', qEn: 'What does HTTP 403 mean when accessing a specific path?',
        options: [{ ar: 'المسار غير موجود', en: 'The path does not exist' }, { ar: 'الخادم معطل', en: 'The server is down' }, { ar: 'الوصول ممنوع — المورد موجود لكن المستخدم غير مصرح له', en: 'Forbidden — resource exists but user is not authorized' }, { ar: 'تمت إعادة التوجيه', en: 'Redirected' }],
        correct: 2, expAr: '403 Forbidden يعني المورد موجود لكن ليس لديك صلاحية الوصول.', expEn: '403 Forbidden means the resource exists but you are not authorized to access it.' },
      { type: 'tf', qAr: 'صفحة /admin يمكن الوصول إليها فقط إذا وُجد رابط مرئي يؤدي إليها.', qEn: 'The /admin page can only be reached if there is a visible link pointing to it.',
        correct: false, expAr: 'خطأ — يمكن الوصول لأي مسار بكتابته مباشرةً في شريط العنوان.', expEn: 'False — any path can be accessed by typing it directly into the address bar.' },
      { type: 'mc', qAr: 'ما الغرض من ملف sitemap.xml في المواقع؟', qEn: 'What is the purpose of the sitemap.xml file on websites?',
        options: [{ ar: 'تخزين كلمات المرور', en: 'Storing passwords' }, { ar: 'مساعدة محركات البحث في اكتشاف صفحات الموقع', en: 'Helping search engines discover site pages' }, { ar: 'تشفير الاتصال', en: 'Encrypting the connection' }, { ar: 'منع الهجمات', en: 'Preventing attacks' }],
        correct: 1, expAr: 'sitemap.xml يُدرج جميع صفحات الموقع لمساعدة محركات البحث في الزحف والفهرسة.', expEn: 'sitemap.xml lists all site pages to help search engines crawl and index them — and may expose hidden paths.' },
      { type: 'mapping', qAr: 'طابق كل جزء من URL بتعريفه:', qEn: 'Match each URL component to its definition:',
        pairs: [
          { leftAr: 'https', leftEn: 'https', rightAr: 'البروتوكول الآمن', rightEn: 'Secure protocol' },
          { leftAr: 'example.com', leftEn: 'example.com', rightAr: 'اسم النطاق', rightEn: 'Domain name' },
          { leftAr: '/page/1', leftEn: '/page/1', rightAr: 'مسار المورد', rightEn: 'Resource path' },
          { leftAr: '?id=5', leftEn: '?id=5', rightAr: 'معامل الاستعلام', rightEn: 'Query parameter' },
        ],
        expAr: 'URL الكاملة: https://example.com/page/1?id=5', expEn: 'Full URL: https://example.com/page/1?id=5' },
      { type: 'tf', qAr: 'HTTPS يُخفي مسار الصفحة (/login) عن المراقبين على الشبكة.', qEn: 'HTTPS hides the page path (/login) from observers on the network.',
        correct: false, expAr: 'خطأ — HTTPS يُشفّر المحتوى والبيانات المرسلة، لكن اسم النطاق والمسار قد يكونان مرئيَّين.', expEn: 'False — HTTPS encrypts the payload, but the domain and path can still be visible via SNI or DNS.' },
      { type: 'mc', qAr: 'مهاجم يُجرّب المسارات: /admin، /backup، /secret على موقع. ما هذه التقنية؟', qEn: 'An attacker tries paths /admin, /backup, /secret on a site. What technique is this?',
        options: [{ ar: 'SQL Injection', en: 'SQL Injection' }, { ar: 'XSS', en: 'XSS' }, { ar: 'Directory Enumeration / Fuzzing', en: 'Directory Enumeration / Fuzzing' }, { ar: 'Phishing', en: 'Phishing' }],
        correct: 2, expAr: 'Directory Enumeration (تعداد المسارات) يُجرّب أسماء مسارات شائعة لاكتشاف صفحات مخفية.', expEn: 'Directory Enumeration tries common path names to discover hidden pages and directories.' },
    ],
  },
  {
    id: 4, titleAr: 'أداة كاشف', titleEn: 'Kashif Tool',
    color: 'bg-emerald-100 text-emerald-700', accent: 'emerald',
    questions: [
      { type: 'mc', qAr: 'ما الهدف الرئيسي لأدوات فحص المسارات مثل كاشف؟', qEn: 'What is the primary use of directory scanning tools like Kashif?',
        options: [{ ar: 'اختراق كلمات المرور', en: 'Cracking passwords' }, { ar: 'تشفير الملفات', en: 'Encrypting files' }, { ar: 'اكتشاف مسارات URL المخفية', en: 'Discovering hidden URL paths' }, { ar: 'تجاوز الجدران النارية', en: 'Bypassing firewalls' }],
        correct: 2, expAr: 'أدوات فحص المسارات تستخدم قوائم كلمات لاكتشاف صفحات ومجلدات غير مرتبطة.', expEn: 'Directory scanning tools use wordlists to discover unlinked pages and folders.' },
      { type: 'tf', qAr: 'أداة كاشف تستخدم قائمة كلمات (wordlist) لتخمين مسارات الموقع.', qEn: 'The Kashif tool uses a wordlist to guess website paths.',
        correct: true, expAr: 'صحيح — تُرسَل طلبات HTTP لكل كلمة في القائمة وتُسجَّل المسارات التي ترد بـ 200.', expEn: 'True — HTTP requests are sent for each word in the list, and paths returning 200 are recorded.' },
      { type: 'mc', qAr: 'أي رمز HTTP يعني عادةً أن المسار موجود وتم الوصول إليه بنجاح؟', qEn: 'Which HTTP response code usually indicates a path exists and was accessed successfully?',
        options: [{ ar: '404', en: '404' }, { ar: '301', en: '301' }, { ar: '500', en: '500' }, { ar: '200', en: '200' }],
        correct: 3, expAr: '200 OK يعني أن الطلب نجح والصفحة موجودة.', expEn: '200 OK means the request succeeded and the page exists.' },
      { type: 'tf', qAr: 'فقط الصفحات المرتبطة من الصفحة الرئيسية يمكن اكتشافها بأدوات الفحص.', qEn: 'Only pages linked from the homepage can be found by scanning tools.',
        correct: false, expAr: 'خطأ — أدوات الفحص تجرب مسارات من قائمة كلمات بصرف النظر عن الروابط الظاهرة.', expEn: 'False — scanning tools try paths from a wordlist regardless of visible links.' },
      { type: 'mc', qAr: 'ما المدخلات التي تحتاجها أداة فحص المسارات لتعمل؟', qEn: 'What inputs does a directory scanning tool need to operate?',
        options: [{ ar: 'اسم المستخدم وكلمة المرور', en: 'A username and password' }, { ar: 'عنوان URL وقائمة كلمات', en: 'A target URL and a wordlist' }, { ar: 'رقم المنفذ والبروتوكول', en: 'A port number and protocol' }, { ar: 'عنوان MAC وعنوان IP', en: 'A MAC address and an IP address' }],
        correct: 1, expAr: 'الأداة تحتاج رابط الهدف وقائمة كلمات لتجربة المسارات.', expEn: 'The tool needs a target URL and a wordlist to try paths against.' },
      { type: 'mc', qAr: 'ما هي "قائمة الكلمات" (Wordlist) في سياق أدوات فحص المسارات؟', qEn: 'What is a "wordlist" in the context of directory scanning tools?',
        options: [{ ar: 'قاموس لغوي للترجمة', en: 'A language dictionary for translation' }, { ar: 'قائمة بأسماء مسارات شائعة للتجربة', en: 'A list of common path names to try' }, { ar: 'قائمة بعناوين IP المحظورة', en: 'A list of blocked IP addresses' }, { ar: 'قائمة بكلمات مرور شائعة', en: 'A list of common passwords' }],
        correct: 1, expAr: 'قائمة الكلمات تحتوي أسماء مسارات شائعة مثل admin، login، backup تُجرّبها الأداة.', expEn: 'A wordlist contains common path names like admin, login, backup that the tool tries one by one.' },
      { type: 'tf', qAr: 'عند فحص مسار يعطي رمز 404، يعني ذلك أن المسار موجود ولكن ممنوع.', qEn: 'A 404 response during scanning means the path exists but is forbidden.',
        correct: false, expAr: 'خطأ — 404 يعني المسار غير موجود. 403 يعني موجود لكن ممنوع الوصول.', expEn: 'False — 404 means the path does not exist. 403 means it exists but access is denied.' },
      { type: 'mc', qAr: 'ماذا يعني "تحديد معدل الطلبات" (Rate Limiting) عند تأثيره على أدوات الفحص؟', qEn: 'How does rate limiting affect directory scanning tools?',
        options: [{ ar: 'يسرّع عملية الفحص', en: 'It speeds up the scanning process' }, { ar: 'يزيد دقة النتائج', en: 'It improves result accuracy' }, { ar: 'يُبطئ أو يمنع الفحص بتقييد عدد الطلبات', en: 'It slows or blocks scanning by limiting requests per second' }, { ar: 'لا تأثير له', en: 'It has no effect' }],
        correct: 2, expAr: 'Rate Limiting يُقيّد عدد الطلبات في الثانية مما يُبطئ الفحص أو يؤدي لحجب الأداة.', expEn: 'Rate limiting restricts requests per second, slowing or blocking the scan entirely.' },
      { type: 'mc', qAr: 'أي من التالي يُعدّ استخداماً مشروعاً لأدوات فحص المسارات؟', qEn: 'Which of the following is a legitimate use of directory scanning tools?',
        options: [{ ar: 'فحص مواقع الآخرين دون إذن', en: 'Scanning other sites without permission' }, { ar: 'سرقة بيانات المستخدمين', en: 'Stealing user data' }, { ar: 'اختبار الاختراق المصرّح به لموقعك الخاص', en: 'Authorized penetration testing of your own site' }, { ar: 'تعطيل الخوادم', en: 'Taking down servers' }],
        correct: 2, expAr: 'اختبار الاختراق المصرّح به يُساعد في اكتشاف الثغرات وتأمين الموقع.', expEn: 'Authorized penetration testing helps discover vulnerabilities to secure the site.' },
      { type: 'tf', qAr: 'جميع المواقع تستخدم نفس هيكل المسارات الافتراضية.', qEn: 'All websites use the same default path structure.',
        correct: false, expAr: 'خطأ — هيكل المسارات يختلف من موقع لآخر، لكن هناك مسارات شائعة تظهر في كثير منها.', expEn: 'False — paths vary by site, but common ones (like /admin, /login) appear frequently.' },
      { type: 'mc', qAr: 'أي رمز HTTP يُشير إلى أن المسار موجود وتمت إعادة توجيهه إلى عنوان آخر؟', qEn: 'Which HTTP code indicates a path exists and has been permanently redirected?',
        options: [{ ar: '404', en: '404' }, { ar: '200', en: '200' }, { ar: '301', en: '301' }, { ar: '500', en: '500' }],
        correct: 2, expAr: '301 Moved Permanently يعني المسار موجود لكنه انتقل — وهو مفيد في الفحص أيضاً.', expEn: '301 Moved Permanently means the path exists but has moved — still a useful finding during scanning.' },
      { type: 'mapping', qAr: 'طابق كل رمز HTTP بمعناه في سياق فحص المسارات:', qEn: 'Match each HTTP code to its meaning during path scanning:',
        pairs: [
          { leftAr: '200', leftEn: '200', rightAr: 'المسار موجود ويُستجاب له', rightEn: 'Path exists and responds' },
          { leftAr: '403', leftEn: '403', rightAr: 'موجود لكن ممنوع الوصول', rightEn: 'Exists but access denied' },
          { leftAr: '404', leftEn: '404', rightAr: 'المسار غير موجود', rightEn: 'Path not found' },
          { leftAr: '301', leftEn: '301', rightAr: 'إعادة توجيه دائمة', rightEn: 'Permanent redirect' },
        ],
        expAr: 'رموز HTTP المختلفة تُخبر الأداة عن حالة كل مسار جرى فحصه.', expEn: 'Different HTTP codes tell the tool the status of each scanned path.' },
      { type: 'tf', qAr: 'فحص المسارات بدون إذن صريح من مالك الموقع يُعدّ سلوكاً غير أخلاقي وقد يكون غير قانوني.', qEn: 'Scanning paths without explicit permission from the site owner is unethical and potentially illegal.',
        correct: true, expAr: 'صحيح — يجب الحصول على إذن خطي قبل إجراء أي فحص أمني.', expEn: 'True — written authorization must be obtained before conducting any security scan.' },
      { type: 'mc', qAr: 'ما الفائدة من الفحص "العميق" أو التكراري (Recursive Scanning)؟', qEn: 'What is the benefit of recursive (deep) directory scanning?',
        options: [{ ar: 'تسريع الفحص', en: 'Speeding up the scan' }, { ar: 'تجنب الاكتشاف', en: 'Avoiding detection' }, { ar: 'اكتشاف المسارات داخل المسارات الفرعية الموجودة', en: 'Discovering paths within found subdirectories' }, { ar: 'تشفير الطلبات', en: 'Encrypting requests' }],
        correct: 2, expAr: 'الفحص التكراري يدخل إلى المجلدات المكتشفة ويُكرّر الفحص بداخلها بحثاً عن مزيد من المسارات.', expEn: 'Recursive scanning enters discovered directories and repeats the scan inside them for deeper discovery.' },
    ],
  },
  {
    id: 5, titleAr: 'ثغرة IDOR', titleEn: 'IDOR Vulnerability',
    color: 'bg-orange-100 text-orange-700', accent: 'orange',
    questions: [
      { type: 'mc', qAr: 'ماذا تعني اختصار IDOR؟', qEn: 'What does IDOR stand for?',
        options: [{ ar: 'Insecure Direct Object Reference', en: 'Insecure Direct Object Reference' }, { ar: 'Internal Data Object Redirect', en: 'Internal Data Object Redirect' }, { ar: 'Invalid Direct Object Request', en: 'Invalid Direct Object Request' }, { ar: 'Insecure Data Object Retrieval', en: 'Insecure Data Object Retrieval' }],
        correct: 0, expAr: 'IDOR تعني Insecure Direct Object Reference — مرجع الكائن المباشر غير الآمن.', expEn: 'IDOR stands for Insecure Direct Object Reference.' },
      { type: 'tf', qAr: 'تغيير ?id=5 إلى ?id=6 في الرابط يُسبب دائمًا خطأً في الخادم.', qEn: 'Changing ?id=5 to ?id=6 in a URL always causes a server error.',
        correct: false, expAr: 'خطأ — في غياب التحقق من الصلاحيات، قد يعرض الخادم بيانات المستخدم الآخر دون خطأ.', expEn: 'False — without authorization checks, the server may return another user\'s data without any error.' },
      { type: 'mc', qAr: 'أي من التالي يمنع ثغرات IDOR بشكل أفضل؟', qEn: 'Which of the following best prevents IDOR vulnerabilities?',
        options: [{ ar: 'تصفية المدخلات', en: 'Input sanitization' }, { ar: 'تحديد معدل الطلبات', en: 'Rate limiting' }, { ar: 'فحص الصلاحيات', en: 'Authorization checks' }, { ar: 'تشفير كلمات المرور', en: 'Password hashing' }],
        correct: 2, expAr: 'يجب أن يتحقق الخادم من أن المستخدم مصرح له بالوصول إلى المورد المطلوب.', expEn: 'The server must verify the user is authorized to access the requested resource.' },
      { type: 'mc', qAr: 'مهاجم يصل إلى /profile?user_id=100 لرؤية بيانات مستخدم آخر. ما نوع الثغرة؟', qEn: 'An attacker accesses /profile?user_id=100 to view another user\'s data. What vulnerability is this?',
        options: [{ ar: 'XSS', en: 'XSS' }, { ar: 'CSRF', en: 'CSRF' }, { ar: 'Buffer Overflow', en: 'Buffer Overflow' }, { ar: 'IDOR', en: 'IDOR' }],
        correct: 3, expAr: 'هذا IDOR — الوصول المباشر لمورد باستخدام معرف يخص مستخدمًا آخر دون إذن.', expEn: 'This is IDOR — directly accessing a resource using another user\'s ID without authorization.' },
      { type: 'tf', qAr: 'ثغرة IDOR تتطلب من المهاجم معرفة مسبقة بكلمة مرور الضحية.', qEn: 'An IDOR attack requires the attacker to know the victim\'s password.',
        correct: false, expAr: 'خطأ — IDOR تستغل غياب التحقق من الصلاحيات دون الحاجة لكلمة المرور.', expEn: 'False — IDOR exploits missing authorization checks, no password needed.' },
      { type: 'mc', qAr: 'ثغرة IDOR تنتمي إلى أي فئة في قائمة OWASP Top 10؟', qEn: 'IDOR belongs to which OWASP Top 10 category?',
        options: [{ ar: 'Injection', en: 'Injection' }, { ar: 'Broken Access Control', en: 'Broken Access Control' }, { ar: 'Cryptographic Failures', en: 'Cryptographic Failures' }, { ar: 'Security Misconfiguration', en: 'Security Misconfiguration' }],
        correct: 1, expAr: 'IDOR تندرج تحت "Broken Access Control" — ضعف التحكم في الصلاحيات.', expEn: 'IDOR falls under "Broken Access Control" — the #1 risk in OWASP Top 10.' },
      { type: 'tf', qAr: 'استخدام معرّفات UUID عشوائية بدلاً من أرقام متسلسلة يُقلّل خطر IDOR.', qEn: 'Using random UUIDs instead of sequential numbers reduces the risk of IDOR.',
        correct: true, expAr: 'صحيح — UUID يصعّب تخمين معرّفات المستخدمين الآخرين، لكنه لا يُغني عن التحقق من الصلاحيات.', expEn: 'True — UUIDs are hard to guess, but server-side authorization checks are still essential.' },
      { type: 'mc', qAr: 'ما الفرق بين "مصادقة" (Authentication) و"تفويض" (Authorization)؟', qEn: 'What is the difference between authentication and authorization?',
        options: [{ ar: 'لا فرق بينهما', en: 'They are the same thing' }, { ar: 'المصادقة تتحقق من الهوية؛ التفويض يحدد الصلاحيات', en: 'Authentication verifies identity; authorization determines permissions' }, { ar: 'التفويض يتحقق من الهوية؛ المصادقة تحدد الصلاحيات', en: 'Authorization verifies identity; authentication sets permissions' }, { ar: 'المصادقة للمديرين فقط', en: 'Authentication is only for admins' }],
        correct: 1, expAr: 'المصادقة: من أنت؟ التفويض: ماذا يُسمح لك بفعله؟ IDOR تستغل غياب التفويض.', expEn: 'Authentication = who are you? Authorization = what are you allowed to do? IDOR exploits missing authorization.' },
      { type: 'mc', qAr: 'مستخدم يُغيّر /invoice/1001 إلى /invoice/1002 ويرى فاتورة شخص آخر. ما التوصية؟', qEn: 'A user changes /invoice/1001 to /invoice/1002 and sees someone else\'s invoice. What is the fix?',
        options: [{ ar: 'إخفاء الرابط', en: 'Hide the URL' }, { ar: 'التحقق من أن المستخدم الحالي يملك الفاتورة المطلوبة قبل إرجاعها', en: 'Verify the current user owns the requested invoice before returning it' }, { ar: 'استخدام HTTPS', en: 'Use HTTPS' }, { ar: 'تغيير اسم المسار', en: 'Rename the path' }],
        correct: 1, expAr: 'الخادم يجب أن يتحقق: هل المستخدم المُسجّل يملك الفاتورة رقم 1002؟ قبل إرجاعها.', expEn: 'The server must check: does the logged-in user own invoice 1002 before returning it.' },
      { type: 'tf', qAr: 'ثغرة IDOR يمكن أن تحدث في نقاط API وليس فقط في روابط الموقع.', qEn: 'IDOR vulnerabilities can occur in API endpoints, not just website URLs.',
        correct: true, expAr: 'صحيح — أي نقطة وصول تعتمد على معرّف دون تحقق من الصلاحيات قد تكون عرضة لـ IDOR.', expEn: 'True — any endpoint relying on an ID without authorization checks is vulnerable to IDOR.' },
      { type: 'mc', qAr: 'أي من التالي مثال على ثغرة IDOR في تطبيق بنكي؟', qEn: 'Which is an example of an IDOR vulnerability in a banking app?',
        options: [{ ar: 'تسجيل الدخول بكلمة مرور ضعيفة', en: 'Logging in with a weak password' }, { ar: 'الوصول إلى /account/9999 لرؤية رصيد حساب شخص آخر', en: 'Accessing /account/9999 to view another person\'s balance' }, { ar: 'إرسال بريد تصيّد', en: 'Sending a phishing email' }, { ar: 'اختراق الشبكة عبر WiFi', en: 'Breaking into the network via WiFi' }],
        correct: 1, expAr: 'هذا نموذج كلاسيكي لـ IDOR — تغيير رقم الحساب في الرابط للوصول لبيانات شخص آخر.', expEn: 'Classic IDOR — changing the account number in the URL to access another person\'s financial data.' },
      { type: 'mapping', qAr: 'طابق كل سيناريو بنوع ثغرة التحكم في الوصول:', qEn: 'Match each scenario to the access control issue it represents:',
        pairs: [
          { leftAr: 'تغيير ?user_id=5 إلى 6', leftEn: 'Changing ?user_id=5 to 6', rightAr: 'IDOR أفقي', rightEn: 'Horizontal IDOR' },
          { leftAr: 'مستخدم عادي يصل /admin', leftEn: 'Regular user accessing /admin', rightAr: 'تصعيد الصلاحيات عمودياً', rightEn: 'Vertical privilege escalation' },
          { leftAr: 'لا تحقق من الصلاحيات', leftEn: 'No authorization check', rightAr: 'Broken Access Control', rightEn: 'Broken Access Control' },
          { leftAr: 'UUID صعب التخمين', leftEn: 'Hard-to-guess UUID', rightAr: 'تخفيف (لكن ليس حلاً كاملاً)', rightEn: 'Mitigation (not a full fix)' },
        ],
        expAr: 'التحكم في الوصول يشمل أنواعاً متعددة من الثغرات.', expEn: 'Access control covers multiple types of vulnerabilities beyond just IDOR.' },
      { type: 'tf', qAr: 'إخفاء رابط الصفحة الحساسة كافٍ لمنع ثغرة IDOR.', qEn: 'Hiding the link to a sensitive page is sufficient to prevent IDOR.',
        correct: false, expAr: 'خطأ — الإخفاء ليس أماناً. يجب تطبيق التحقق من الصلاحيات على الخادم.', expEn: 'False — security through obscurity is not enough. Server-side authorization checks are required.' },
      { type: 'mc', qAr: 'أي أداة يستخدمها الباحثون الأمنيون لاكتشاف ثغرات IDOR؟', qEn: 'Which type of tool do security researchers use to discover IDOR vulnerabilities?',
        options: [{ ar: 'برامج مكافحة الفيروسات', en: 'Antivirus software' }, { ar: 'وكلاء اعتراض HTTP مثل Burp Suite', en: 'HTTP interception proxies like Burp Suite' }, { ar: 'جدران نارية', en: 'Firewalls' }, { ar: 'أدوات ضغط الملفات', en: 'File compression tools' }],
        correct: 1, expAr: 'Burp Suite يُتيح اعتراض وتعديل طلبات HTTP لاختبار ثغرات IDOR ضمن بيئة اختبار مصرّح به.', expEn: 'Burp Suite intercepts and modifies HTTP requests to test for IDOR in authorized testing environments.' },
      { type: 'mc', qAr: 'ما الفرق بين IDOR الأفقي (Horizontal) والعمودي (Vertical)؟', qEn: 'What is the difference between horizontal and vertical IDOR?',
        options: [{ ar: 'لا فرق بينهما', en: 'There is no difference' }, { ar: 'الأفقي: الوصول لبيانات مستخدم آخر بنفس الصلاحية. العمودي: الوصول لبيانات ذات صلاحية أعلى', en: 'Horizontal: accessing another user\'s data at the same privilege level. Vertical: accessing higher-privilege data' }, { ar: 'العمودي يحتاج كلمة مرور', en: 'Vertical requires a password' }, { ar: 'الأفقي للمواقع فقط والعمودي للتطبيقات', en: 'Horizontal is for websites only, vertical for apps' }],
        correct: 1, expAr: 'الأفقي: مستخدم يرى بيانات مستخدم آخر بنفس مستواه. العمودي: مستخدم عادي يصل لبيانات مشرف.', expEn: 'Horizontal: same-level user accessing peer data. Vertical: normal user accessing admin-level data.' },
      { type: 'tf', qAr: 'ثغرة IDOR تؤثر فقط على بيانات المستخدمين ولا تطال الملفات أو الصور.', qEn: 'IDOR vulnerabilities only affect user data records, not files or images.',
        correct: false, expAr: 'خطأ — IDOR يمكن أن تطال الملفات والصور والتقارير وأي مورد يُعرَّف بمعرّف.', expEn: 'False — IDOR can affect files, images, reports, and any resource identified by an ID.' },
      { type: 'mc', qAr: 'مستخدم يُغيّر /download?file=report_5.pdf إلى report_1.pdf ويحمّل ملف شخص آخر. ما هذا؟', qEn: 'A user changes /download?file=report_5.pdf to report_1.pdf and downloads someone else\'s file. What is this?',
        options: [{ ar: 'XSS', en: 'XSS' }, { ar: 'Path Traversal', en: 'Path Traversal' }, { ar: 'IDOR على مورد ملف', en: 'IDOR on a file resource' }, { ar: 'CSRF', en: 'CSRF' }],
        correct: 2, expAr: 'هذا IDOR — تغيير اسم الملف في المعامل للوصول لملف يخص مستخدماً آخر دون تحقق من الصلاحيات.', expEn: 'This is IDOR on a file resource — changing the filename parameter to access another user\'s file.' },
      { type: 'mc', qAr: 'أيٌّ من التالي يُعدّ تطبيقاً صحيحاً للتحقق من الصلاحيات لمنع IDOR؟', qEn: 'Which of the following is a correct server-side authorization check to prevent IDOR?',
        options: [{ ar: 'إخفاء حقل id من واجهة المستخدم', en: 'Hiding the id field from the UI' }, { ar: 'التحقق من أن user_id في الجلسة يساوي user_id في الطلب قبل إرجاع البيانات', en: 'Checking that the session user_id equals the requested user_id before returning data' }, { ar: 'تشفير الرابط بالكامل', en: 'Encrypting the entire URL' }, { ar: 'استخدام POST بدلاً من GET', en: 'Using POST instead of GET' }],
        correct: 1, expAr: 'الخادم يجب أن يُقارن هوية المستخدم المُسجّل بصاحب المورد المطلوب قبل إرجاع أي بيانات.', expEn: 'The server must compare the logged-in user\'s identity with the resource owner before returning any data.' },
      { type: 'tf', qAr: 'تشفير معرّف المورد في الرابط (Base64 مثلاً) يمنع ثغرة IDOR تماماً.', qEn: 'Encoding the resource ID in the URL (e.g. Base64) completely prevents IDOR.',
        correct: false, expAr: 'خطأ — Base64 ليس تشفيراً حقيقياً ويمكن عكسه بسهولة. التحقق من الصلاحيات على الخادم هو الحل الوحيد.', expEn: 'False — Base64 is not encryption and can be easily reversed. Server-side authorization is the only real fix.' },
      { type: 'mc', qAr: 'مهاجم يُغيّر /api/orders/4421 إلى /api/orders/4420 في طلب API ويرى بيانات طلب آخر. ما الإجراء الصحيح للإصلاح؟', qEn: 'An attacker changes /api/orders/4421 to /api/orders/4420 in an API call and sees another order\'s data. What is the correct fix?',
        options: [{ ar: 'تغيير أرقام الطلبات لأرقام عشوائية', en: 'Change order numbers to random numbers' }, { ar: 'منع طلبات GET على الـ API', en: 'Block GET requests to the API' }, { ar: 'التحقق من أن المستخدم المُسجَّل هو صاحب الطلب قبل إرجاع البيانات', en: 'Verify the logged-in user owns the order before returning the data' }, { ar: 'إضافة CAPTCHA', en: 'Add a CAPTCHA' }],
        correct: 2, expAr: 'الإصلاح الصحيح دائماً هو التحقق من الصلاحيات على الخادم: هل هذا المستخدم يملك هذا المورد؟', expEn: 'The correct fix is always server-side: does this user own this resource before returning it?' },
      { type: 'mapping', qAr: 'طابق كل نوع IDOR بمثاله:', qEn: 'Match each IDOR type to its example:',
        pairs: [
          { leftAr: 'IDOR في URL', leftEn: 'URL-based IDOR', rightAr: '/profile?id=42 → /profile?id=43', rightEn: '/profile?id=42 → /profile?id=43' },
          { leftAr: 'IDOR في JSON', leftEn: 'JSON body IDOR', rightAr: '{"order_id":5} → {"order_id":6}', rightEn: '{"order_id":5} → {"order_id":6}' },
          { leftAr: 'IDOR في ملف', leftEn: 'File-based IDOR', rightAr: '/download?f=invoice_5.pdf → invoice_6.pdf', rightEn: '/download?f=invoice_5.pdf → invoice_6.pdf' },
          { leftAr: 'IDOR عمودي', leftEn: 'Vertical IDOR', rightAr: 'مستخدم عادي يصل /admin/users', rightEn: 'Normal user accessing /admin/users' },
        ],
        expAr: 'IDOR يظهر في أشكال متعددة — URL أو جسم الطلب أو الملفات أو تصعيد الصلاحيات.', expEn: 'IDOR appears in many forms — URL params, request body, files, or privilege escalation.' },
      { type: 'mc', qAr: 'ما المصطلح الأمني الذي يصف مبدأ "منح المستخدم أدنى صلاحية ضرورية فقط"؟', qEn: 'What security principle describes "granting users only the minimum permissions they need"?',
        options: [{ ar: 'Defense in Depth', en: 'Defense in Depth' }, { ar: 'Principle of Least Privilege', en: 'Principle of Least Privilege' }, { ar: 'Zero Trust', en: 'Zero Trust' }, { ar: 'Security by Obscurity', en: 'Security by Obscurity' }],
        correct: 1, expAr: 'Principle of Least Privilege (مبدأ أدنى صلاحية) يُقلّل الضرر المحتمل عند اختراق أي حساب.', expEn: 'Principle of Least Privilege minimizes the damage if any account is compromised.' },
    ],
  },
  {
    id: 6, titleAr: 'مختبر الحماية', titleEn: 'Defense Lab',
    color: 'bg-red-100 text-red-700', accent: 'red',
    questions: [
      { type: 'mc', qAr: 'أي تقنية تمنع SQL Injection بمعالجة مدخلات المستخدم كبيانات لا كشيفرة؟', qEn: 'Which technique prevents SQL injection by treating user input as data, not code?',
        options: [{ ar: 'تصفية المدخلات فقط', en: 'Input validation only' }, { ar: 'Prepared Statements', en: 'Prepared Statements' }, { ar: 'Rate Limiting', en: 'Rate Limiting' }, { ar: 'HTTPS', en: 'HTTPS' }],
        correct: 1, expAr: 'Prepared Statements تفصل الشيفرة عن البيانات، مما يمنع حقن SQL.', expEn: 'Prepared Statements separate code from data, preventing SQL injection entirely.' },
      { type: 'tf', qAr: 'HTTPS يُشفّر البيانات المنقولة بين المتصفح والخادم.', qEn: 'HTTPS encrypts the data sent between the browser and server.',
        correct: true, expAr: 'صحيح — HTTPS يستخدم TLS لتشفير البيانات أثناء النقل.', expEn: 'True — HTTPS uses TLS to encrypt data in transit.' },
      { type: 'mc', qAr: 'ما الهدف من التحقق من صحة المدخلات (Input Validation)؟', qEn: 'What is the purpose of input validation?',
        options: [{ ar: 'تنسيق البيانات جمالياً', en: 'Formatting data nicely' }, { ar: 'ضغط البيانات', en: 'Compressing data' }, { ar: 'التأكد من أن البيانات تستوفي المعايير المتوقعة', en: 'Ensuring data meets expected criteria' }, { ar: 'تسجيل أنشطة المستخدمين', en: 'Logging user activities' }],
        correct: 2, expAr: 'تُتحقق من أن البيانات المدخلة مطابقة للنوع والشكل المتوقع قبل معالجتها.', expEn: 'It ensures input data matches the expected type and format before processing.' },
      { type: 'mapping', qAr: 'طابق كل إجراء حماية بالتهديد الذي يصده:', qEn: 'Match each defense to the threat it mitigates:',
        pairs: [
          { leftAr: 'Prepared Statements', leftEn: 'Prepared Statements', rightAr: 'حقن SQL', rightEn: 'SQL Injection' },
          { leftAr: 'HTTPS', leftEn: 'HTTPS', rightAr: 'التنصت على الشبكة', rightEn: 'Network eavesdropping' },
          { leftAr: 'Rate Limiting', leftEn: 'Rate Limiting', rightAr: 'هجمات القوة الغاشمة', rightEn: 'Brute force attacks' },
          { leftAr: 'Authorization checks', leftEn: 'Authorization checks', rightAr: 'ثغرة IDOR', rightEn: 'IDOR vulnerability' },
        ],
        expAr: 'كل إجراء حماية مصمم لصد نوع محدد من الهجمات.', expEn: 'Each defense is designed to counter a specific attack type.' },
      { type: 'tf', qAr: 'الموقع آمن تمامًا إذا كان يستخدم HTTPS فقط دون أي حمايات أخرى.', qEn: 'A website is fully secure if it uses HTTPS, even without any other protections.',
        correct: false, expAr: 'خطأ — HTTPS يحمي النقل فقط. لا يزال الموقع عرضة لـ IDOR وSQL Injection وغيرها.', expEn: 'False — HTTPS only protects data in transit. The site is still vulnerable to IDOR, SQL injection, etc.' },
      { type: 'mc', qAr: 'ما هجوم XSS (Cross-Site Scripting)؟', qEn: 'What is a Cross-Site Scripting (XSS) attack?',
        options: [{ ar: 'حقن استعلامات SQL في قاعدة البيانات', en: 'Injecting SQL queries into the database' }, { ar: 'حقن سكريبت خبيث في صفحات الويب لتنفيذه في متصفح الضحية', en: 'Injecting malicious scripts into web pages to execute in the victim\'s browser' }, { ar: 'اختراق الشبكة اللاسلكية', en: 'Breaking into a wireless network' }, { ar: 'سرقة ملفات الخادم', en: 'Stealing server files' }],
        correct: 1, expAr: 'XSS يُحقن كود JavaScript خبيث في الموقع فينفّذه متصفح الضحية دون علمها.', expEn: 'XSS injects malicious JavaScript into a site that executes in the victim\'s browser without their knowledge.' },
      { type: 'tf', qAr: 'سياسة أمان المحتوى (CSP) تساعد في منع هجمات XSS.', qEn: 'Content Security Policy (CSP) helps prevent XSS attacks.',
        correct: true, expAr: 'صحيح — CSP تُقيّد مصادر السكريبتات المسموح بتشغيلها في الصفحة.', expEn: 'True — CSP restricts which script sources are allowed to execute on the page.' },
      { type: 'mc', qAr: 'ما الفرق بين "التشفير" (Encryption) و"التجزئة" (Hashing)؟', qEn: 'What is the key difference between encryption and hashing?',
        options: [{ ar: 'لا فرق', en: 'No difference' }, { ar: 'التشفير قابل للعكس، التجزئة أحادية الاتجاه', en: 'Encryption is reversible; hashing is one-way' }, { ar: 'التجزئة أسرع دائماً', en: 'Hashing is always faster' }, { ar: 'التشفير للنصوص فقط', en: 'Encryption is for text only' }],
        correct: 1, expAr: 'التشفير يمكن عكسه بالمفتاح. التجزئة لا يمكن عكسها — تُستخدم لتخزين كلمات المرور.', expEn: 'Encryption is reversible with a key. Hashing is one-way — used to safely store passwords.' },
      { type: 'mc', qAr: 'لماذا يُفضَّل استخدام bcrypt لتجزئة كلمات المرور بدلاً من MD5؟', qEn: 'Why is bcrypt preferred over MD5 for password hashing?',
        options: [{ ar: 'MD5 أسرع وأكثر أماناً', en: 'MD5 is faster and more secure' }, { ar: 'bcrypt بطيء ومُصمَّم للمقاومة ضد هجمات القوة الغاشمة', en: 'bcrypt is slow by design, resisting brute-force attacks' }, { ar: 'MD5 أحدث من bcrypt', en: 'MD5 is newer than bcrypt' }, { ar: 'لا فرق عملياً', en: 'No practical difference' }],
        correct: 1, expAr: 'بطء bcrypt المتعمد يجعل هجمات القوة الغاشمة مكلفة جداً زمنياً.', expEn: 'bcrypt\'s intentional slowness makes brute-force attacks computationally expensive.' },
      { type: 'tf', qAr: 'تحقق المدخلات (Input Validation) وحده يكفي لمنع جميع هجمات Injection.', qEn: 'Input validation alone is sufficient to prevent all injection attacks.',
        correct: false, expAr: 'خطأ — يجب تطبيق Prepared Statements مع التحقق من المدخلات لمنع SQL Injection بشكل موثوق.', expEn: 'False — Prepared Statements must be combined with validation for reliable injection prevention.' },
      { type: 'mc', qAr: 'ما مبدأ "الصلاحيات الدنيا" (Principle of Least Privilege)؟', qEn: 'What is the "Principle of Least Privilege"?',
        options: [{ ar: 'منح جميع المستخدمين صلاحيات المدير', en: 'Give all users admin privileges' }, { ar: 'منح المستخدمين الحد الأدنى من الصلاحيات اللازمة لعملهم فقط', en: 'Give users only the minimum permissions needed for their tasks' }, { ar: 'حظر جميع المستخدمين افتراضياً', en: 'Block all users by default' }, { ar: 'مشاركة الصلاحيات بين الفريق', en: 'Share privileges among the team' }],
        correct: 1, expAr: 'الصلاحيات الدنيا تُقلّل سطح الهجوم — كل مستخدم يحصل فقط على ما يحتاجه.', expEn: 'Least privilege reduces the attack surface — each user gets only what they need to do their job.' },
      { type: 'mc', qAr: 'ما الهدف من "ترميز المخرجات" (Output Encoding) في تطبيقات الويب؟', qEn: 'What is the purpose of output encoding in web applications?',
        options: [{ ar: 'تسريع تحميل الصفحة', en: 'Speed up page loading' }, { ar: 'منع تفسير المتصفح للمحتوى كشيفرة HTML أو JavaScript', en: 'Prevent the browser from interpreting content as HTML or JavaScript code' }, { ar: 'تشفير الاتصال', en: 'Encrypt the connection' }, { ar: 'ضغط البيانات', en: 'Compress data' }],
        correct: 1, expAr: 'ترميز المخرجات يُحوّل الأحرف الخاصة (< > &) إلى كيانات HTML فيمنع تنفيذ XSS.', expEn: 'Output encoding converts special chars (< > &) to HTML entities, preventing XSS execution.' },
      { type: 'mapping', qAr: 'طابق كل إجراء أمني بمكان تطبيقه:', qEn: 'Match each security measure to where it is applied:',
        pairs: [
          { leftAr: 'Input Validation', leftEn: 'Input Validation', rightAr: 'قبل معالجة البيانات', rightEn: 'Before data processing' },
          { leftAr: 'Output Encoding', leftEn: 'Output Encoding', rightAr: 'عند عرض البيانات للمستخدم', rightEn: 'When displaying data to users' },
          { leftAr: 'Prepared Statements', leftEn: 'Prepared Statements', rightAr: 'عند بناء استعلامات SQL', rightEn: 'When building SQL queries' },
          { leftAr: 'HTTPS', leftEn: 'HTTPS', rightAr: 'عند نقل البيانات عبر الشبكة', rightEn: 'During data transmission over network' },
        ],
        expAr: 'الأمان الشامل يتطلب تطبيق طبقات حماية متعددة.', expEn: 'Comprehensive security requires applying multiple defense layers.' },
      { type: 'tf', qAr: 'شهادة SSL/TLS تثبت هوية الموقع وتُشفّر الاتصال في آنٍ واحد.', qEn: 'An SSL/TLS certificate both proves the site\'s identity and encrypts the connection.',
        correct: true, expAr: 'صحيح — TLS يوفر التشفير والمصادقة على هوية الخادم في نفس الوقت.', expEn: 'True — TLS provides both encryption and server identity authentication simultaneously.' },
      { type: 'mc', qAr: 'أي من التالي مدرج في OWASP Top 10؟', qEn: 'Which of the following is listed in the OWASP Top 10?',
        options: [{ ar: 'Slow WiFi', en: 'Slow WiFi' }, { ar: 'Broken Access Control', en: 'Broken Access Control' }, { ar: 'غياب التوثيق', en: 'Missing documentation' }, { ar: 'واجهة مستخدم ضعيفة', en: 'Poor user interface' }],
        correct: 1, expAr: 'Broken Access Control احتل المرتبة الأولى في OWASP Top 10 لعام 2021.', expEn: 'Broken Access Control was ranked #1 in the OWASP Top 10 for 2021.' },
    ],
  },
  {
    id: 7, titleAr: 'تشفير الرسائل', titleEn: 'Shift Cipher',
    color: 'bg-violet-100 text-violet-700', accent: 'violet',
    questions: [
      { type: 'mc', qAr: 'في شيفرة قيصر بإزاحة 3، ماذا تُصبح الحرف "A"؟', qEn: 'In a Caesar cipher with shift 3, what does the letter "A" become?',
        options: [{ ar: 'B', en: 'B' }, { ar: 'C', en: 'C' }, { ar: 'Z', en: 'Z' }, { ar: 'D', en: 'D' }],
        correct: 3, expAr: 'A (1) + 3 إزاحة = D (4). كل حرف ينتقل 3 مواضع للأمام في الأبجدية.', expEn: 'A(1) + 3 = D(4). Each letter shifts 3 positions forward in the alphabet.' },
      { type: 'tf', qAr: 'شيفرة قيصر توفر أمانًا عاليًا ضد الهجمات الحديثة.', qEn: 'The Caesar cipher provides strong security against modern attacks.',
        correct: false, expAr: 'خطأ — شيفرة قيصر ضعيفة جداً ويمكن كسرها بـ 25 محاولة فقط.', expEn: 'False — Caesar cipher is very weak and can be broken in only 25 attempts.' },
      { type: 'mc', qAr: 'ما هو "المفتاح" في شيفرة الإزاحة؟', qEn: 'What is the "key" in a shift cipher?',
        options: [{ ar: 'الأبجدية كاملة', en: 'The full alphabet' }, { ar: 'الرسالة النصية', en: 'The plaintext message' }, { ar: 'مقدار الإزاحة', en: 'The shift amount' }, { ar: 'طول الرسالة', en: 'The message length' }],
        correct: 2, expAr: 'المفتاح هو مقدار الإزاحة (عدد) الذي يُستخدم للتشفير وفك التشفير.', expEn: 'The key is the shift amount (a number) used to encrypt and decrypt the message.' },
      { type: 'mc', qAr: 'لفك تشفير رسالة مُشفَّرة بإزاحة 3، ماذا يجب أن تفعل؟', qEn: 'To decrypt a message encrypted with shift 3, what must you do?',
        options: [{ ar: 'إزاحة الحروف 3 للأمام', en: 'Shift letters 3 positions forward' }, { ar: 'إزاحة الحروف 3 للخلف', en: 'Shift letters 3 positions backward' }, { ar: 'إزاحة الحروف 6 للأمام', en: 'Shift letters 6 positions forward' }, { ar: 'عكس ترتيب الحروف', en: 'Reverse the alphabet order' }],
        correct: 1, expAr: 'فك التشفير = التشفير بالاتجاه المعاكس. إزاحة +3 تُفك بإزاحة -3.', expEn: 'Decryption reverses encryption. Shift +3 to encrypt, shift -3 to decrypt.' },
      { type: 'tf', qAr: 'لكسر شيفرة قيصر دون معرفة المفتاح، يكفي تجربة 25 احتمالاً فقط.', qEn: 'To break a Caesar cipher without knowing the key, trying 25 possibilities is sufficient.',
        correct: true, expAr: 'صحيح — الأبجدية الإنجليزية 26 حرفاً، فلا توجد سوى 25 إزاحة ممكنة غير الصفرية.', expEn: 'True — with 26 letters, there are only 25 possible non-zero shifts to try.' },
      { type: 'mc', qAr: 'ما قيمة إزاحة ROT13؟', qEn: 'What shift value does ROT13 use?',
        options: [{ ar: '3', en: '3' }, { ar: '26', en: '26' }, { ar: '13', en: '13' }, { ar: '1', en: '1' }],
        correct: 2, expAr: 'ROT13 تُزيح كل حرف 13 موضعاً — وهي نسخة من شيفرة قيصر تطبيق عليها نفسها مرتين يُعيد الأصل.', expEn: 'ROT13 shifts each letter 13 positions — applying it twice returns the original text.' },
      { type: 'tf', qAr: 'تحليل التردد (Frequency Analysis) يمكن استخدامه لكسر شيفرة الإزاحة.', qEn: 'Frequency analysis can be used to break a shift cipher.',
        correct: true, expAr: 'صحيح — في اللغة الإنجليزية، E هي الأكثر تكراراً؛ يُمكن مطابقة الأحرف الأكثر تكراراً في النص المشفر لكسره.', expEn: 'True — E is the most frequent letter in English; matching frequency patterns in ciphertext breaks the cipher.' },
      { type: 'mc', qAr: 'إذا كانت الإزاحة 3، ماذا يُصبح حرف "Z"؟', qEn: 'With a shift of 3, what does the letter "Z" become?',
        options: [{ ar: 'C', en: 'C' }, { ar: 'A', en: 'A' }, { ar: 'W', en: 'W' }, { ar: 'X', en: 'X' }],
        correct: 0, expAr: 'Z(25) + 3 = 28 mod 26 = 2 = C. الإزاحة تلتف حول الأبجدية.', expEn: 'Z(25) + 3 = 28 mod 26 = 2 = C. The shift wraps around the alphabet.' },
      { type: 'mc', qAr: 'ما عدد مفاتيح الإزاحة الممكنة في الأبجدية العربية (28 حرفاً)؟', qEn: 'How many possible shift keys exist for the Arabic alphabet (28 letters)?',
        options: [{ ar: '26', en: '26' }, { ar: '28', en: '28' }, { ar: '27', en: '27' }, { ar: '25', en: '25' }],
        correct: 2, expAr: '27 إزاحة ممكنة غير الصفرية (من 1 إلى 27) في الأبجدية العربية ذات 28 حرفاً.', expEn: '27 non-zero shifts possible (1 to 27) with the 28-letter Arabic alphabet.' },
      { type: 'tf', qAr: 'شيفرة الإزاحة تُعدّ نوعاً من التشفير المتماثل (Symmetric Encryption).', qEn: 'A shift cipher is a form of symmetric encryption.',
        correct: true, expAr: 'صحيح — نفس المفتاح (الإزاحة) يُستخدم للتشفير وفك التشفير.', expEn: 'True — the same key (the shift value) is used for both encryption and decryption.' },
      { type: 'mc', qAr: 'لماذا تُعدّ شيفرة Vigenère أقوى من شيفرة قيصر؟', qEn: 'Why is the Vigenère cipher stronger than the Caesar cipher?',
        options: [{ ar: 'لأنها تستخدم أبجدية مختلفة', en: 'It uses a different alphabet' }, { ar: 'لأنها تستخدم مفتاح كلمة يُغيّر الإزاحة لكل حرف', en: 'It uses a keyword that changes the shift for each letter' }, { ar: 'لأنها أسرع', en: 'It is faster to compute' }, { ar: 'لأنها تستخدم أرقاماً بدلاً من حروف', en: 'It uses numbers instead of letters' }],
        correct: 1, expAr: 'Vigenère تُغيّر الإزاحة لكل حرف بناءً على حروف الكلمة المفتاحية، مما يُعقّد تحليل التردد.', expEn: 'Vigenère varies the shift per letter using a keyword, defeating simple frequency analysis.' },
      { type: 'mc', qAr: 'ما معنى "Ciphertext" في علم التشفير؟', qEn: 'What does "Ciphertext" mean in cryptography?',
        options: [{ ar: 'النص الأصلي قبل التشفير', en: 'The original text before encryption' }, { ar: 'مفتاح التشفير', en: 'The encryption key' }, { ar: 'النص بعد التشفير', en: 'The text after encryption' }, { ar: 'خوارزمية التشفير', en: 'The encryption algorithm' }],
        correct: 2, expAr: 'Ciphertext هو الناتج المشفر. Plaintext هو النص الأصلي.', expEn: 'Ciphertext is the encrypted output. Plaintext is the original readable text.' },
      { type: 'mapping', qAr: 'طابق كل مصطلح بتعريفه في شيفرة الإزاحة:', qEn: 'Match each term to its definition in shift cipher context:',
        pairs: [
          { leftAr: 'إزاحة 0', leftEn: 'Shift 0', rightAr: 'لا تشفير — النص لا يتغير', rightEn: 'No encryption — text unchanged' },
          { leftAr: 'Plaintext', leftEn: 'Plaintext', rightAr: 'الرسالة الأصلية قبل التشفير', rightEn: 'Original message before encryption' },
          { leftAr: 'Ciphertext', leftEn: 'Ciphertext', rightAr: 'الرسالة بعد تطبيق الإزاحة', rightEn: 'Message after applying the shift' },
          { leftAr: 'فك التشفير', leftEn: 'Decryption', rightAr: 'تطبيق الإزاحة العكسية', rightEn: 'Applying the reverse shift' },
        ],
        expAr: 'مصطلحات شيفرة الإزاحة الأساسية تصف دورة التشفير الكاملة.', expEn: 'These terms describe the complete shift cipher cycle.' },
      { type: 'tf', qAr: 'إزاحة مقدارها 26 في الأبجدية الإنجليزية تُعيد النص الأصلي دون تغيير.', qEn: 'A shift of 26 on the English alphabet returns the original text unchanged.',
        correct: true, expAr: 'صحيح — الإزاحة 26 تُكمل دورة كاملة وتعود للحرف الأصلي (26 mod 26 = 0).', expEn: 'True — shifting 26 completes a full cycle and returns each letter to itself (26 mod 26 = 0).' },
      { type: 'mc', qAr: 'أي خوارزمية تشفير حديثة تُستخدم لتأمين الاتصالات اليوم بدلاً من شيفرة قيصر؟', qEn: 'Which modern encryption algorithm replaces Caesar cipher for securing communications today?',
        options: [{ ar: 'ROT13', en: 'ROT13' }, { ar: 'شيفرة Vigenère', en: 'Vigenère cipher' }, { ar: 'AES (معيار التشفير المتقدم)', en: 'AES (Advanced Encryption Standard)' }, { ar: 'شيفرة أتباش', en: 'Atbash cipher' }],
        correct: 2, expAr: 'AES هو معيار التشفير المتماثل المعتمد عالمياً — لا يمكن كسره بتجربة 25 احتمالاً.', expEn: 'AES is the globally adopted symmetric encryption standard — unbreakable with only 25 attempts.' },
    ],
  },
  {
    id: 8, titleAr: 'محادثة مشفرة', titleEn: 'Encrypted Chat',
    color: 'bg-pink-100 text-pink-700', accent: 'pink',
    questions: [
      { type: 'tf', qAr: 'إذا شارك شخصان نفس مفتاح التشفير، يمكن لكل منهما قراءة رسائل الآخر المشفرة.', qEn: 'If two people share the same cipher key, each can read the other\'s encrypted messages.',
        correct: true, expAr: 'صحيح — في التشفير المتماثل، نفس المفتاح يُستخدم للتشفير وفك التشفير.', expEn: 'True — in symmetric encryption, the same key is used for both encryption and decryption.' },
      { type: 'mc', qAr: 'ما الذي يجب مشاركته بين طرفين لاستخدام التشفير المتماثل؟', qEn: 'What must two parties share to use symmetric encryption?',
        options: [{ ar: 'عناوين IP الخاصة بهم', en: 'Their IP addresses' }, { ar: 'أسماء المستخدمين', en: 'Their usernames' }, { ar: 'مفتاح التشفير', en: 'The encryption key' }, { ar: 'الخوارزمية فقط', en: 'The algorithm only' }],
        correct: 2, expAr: 'يجب أن يمتلك كلا الطرفين نفس المفتاح السري لتشفير وفك تشفير الرسائل.', expEn: 'Both parties must possess the same secret key to encrypt and decrypt messages.' },
      { type: 'mc', qAr: 'ما معنى "نص واضح" (Plaintext) في علم التشفير؟', qEn: 'What is "plaintext" in cryptography?',
        options: [{ ar: 'نص مكتوب بخط واضح', en: 'Text written in a clear font' }, { ar: 'البيانات بعد تشفيرها', en: 'Data after it is encrypted' }, { ar: 'رسالة بالإنجليزية فقط', en: 'A message written in English only' }, { ar: 'البيانات الأصلية غير المشفرة', en: 'Original unencrypted data' }],
        correct: 3, expAr: 'Plaintext هو البيانات الأصلية قبل التشفير. Ciphertext هو الناتج المشفر.', expEn: 'Plaintext is the original data before encryption. Ciphertext is the encrypted output.' },
      { type: 'mapping', qAr: 'طابق كل مصطلح تشفيري بتعريفه:', qEn: 'Match each cryptography term to its definition:',
        pairs: [
          { leftAr: 'Plaintext', leftEn: 'Plaintext', rightAr: 'الرسالة الأصلية قبل التشفير', rightEn: 'Original message before encryption' },
          { leftAr: 'Ciphertext', leftEn: 'Ciphertext', rightAr: 'الرسالة بعد التشفير', rightEn: 'Message after encryption' },
          { leftAr: 'Key', leftEn: 'Key', rightAr: 'المفتاح للتشفير وفك التشفير', rightEn: 'Used to encrypt and decrypt' },
          { leftAr: 'Decrypt', leftEn: 'Decrypt', rightAr: 'تحويل النص المشفر إلى أصلي', rightEn: 'Convert ciphertext back to plaintext' },
        ],
        expAr: 'المصطلحات الأربعة تصف دورة التشفير الكاملة.', expEn: 'These four terms describe the complete encryption cycle.' },
      { type: 'mc', qAr: 'ما هو التشفير من طرف إلى طرف (End-to-End Encryption)؟', qEn: 'What is End-to-End Encryption (E2EE)?',
        options: [{ ar: 'تشفير البيانات على الخادم فقط', en: 'Encrypting data only on the server' }, { ar: 'تشفير يضمن أن الرسائل لا يمكن قراءتها إلا من قِبل المُرسِل والمُستقبِل', en: 'Encryption ensuring messages can only be read by sender and recipient' }, { ar: 'تشفير اتصال الإنترنت', en: 'Encrypting the internet connection' }, { ar: 'تشفير ملفات الجهاز', en: 'Encrypting device files' }],
        correct: 1, expAr: 'E2EE يضمن أن حتى مزود الخدمة لا يستطيع قراءة رسائلك.', expEn: 'E2EE ensures even the service provider cannot read your messages.' },
      { type: 'tf', qAr: 'في التشفير من طرف إلى طرف، يستطيع خادم التطبيق قراءة الرسائل المشفرة.', qEn: 'In E2EE, the application server can read the encrypted messages.',
        correct: false, expAr: 'خطأ — E2EE يضمن أن الخادم يرى نصاً مشفراً فقط لا يستطيع فك تشفيره.', expEn: 'False — E2EE ensures the server only sees ciphertext it cannot decrypt.' },
      { type: 'mc', qAr: 'ما الفرق الرئيسي بين التشفير المتماثل وغير المتماثل؟', qEn: 'What is the main difference between symmetric and asymmetric encryption?',
        options: [{ ar: 'المتماثل أبطأ دائماً', en: 'Symmetric is always slower' }, { ar: 'المتماثل يستخدم مفتاحاً واحداً؛ غير المتماثل يستخدم مفتاحاً عاماً وخاصاً', en: 'Symmetric uses one key; asymmetric uses a public and private key pair' }, { ar: 'غير المتماثل أقل أماناً', en: 'Asymmetric is less secure' }, { ar: 'لا فرق', en: 'No difference' }],
        correct: 1, expAr: 'التشفير المتماثل: مفتاح واحد للتشفير وفك التشفير. غير المتماثل: مفتاح عام للتشفير، خاص لفك التشفير.', expEn: 'Symmetric: one key for both. Asymmetric: public key encrypts, private key decrypts.' },
      { type: 'tf', qAr: 'تطبيقات المراسلة مثل WhatsApp تستخدم التشفير من طرف إلى طرف.', qEn: 'Messaging apps like WhatsApp use end-to-end encryption.',
        correct: true, expAr: 'صحيح — WhatsApp يستخدم بروتوكول Signal للتشفير من طرف إلى طرف.', expEn: 'True — WhatsApp uses the Signal protocol for end-to-end encryption.' },
      { type: 'mc', qAr: 'ما "مشكلة تبادل المفاتيح" في التشفير المتماثل؟', qEn: 'What is the "key exchange problem" in symmetric encryption?',
        options: [{ ar: 'صعوبة إنشاء المفتاح', en: 'Difficulty generating the key' }, { ar: 'صعوبة مشاركة المفتاح السري بشكل آمن مع الطرف الآخر', en: 'Difficulty sharing the secret key securely with the other party' }, { ar: 'المفتاح طويل جداً', en: 'The key is too long' }, { ar: 'المفتاح يتغير كثيراً', en: 'The key changes too often' }],
        correct: 1, expAr: 'كيف تُشارك مفتاحاً سرياً مع شخص عبر قناة غير آمنة؟ هذه هي مشكلة تبادل المفاتيح.', expEn: 'How do you share a secret key with someone over an insecure channel? That\'s the key exchange problem.' },
      { type: 'mc', qAr: 'ما الغرض من التوقيع الرقمي (Digital Signature)؟', qEn: 'What is the purpose of a digital signature?',
        options: [{ ar: 'تشفير الرسالة', en: 'Encrypting the message' }, { ar: 'ضغط البيانات', en: 'Compressing data' }, { ar: 'التحقق من هوية المُرسِل وسلامة الرسالة', en: 'Verifying the sender\'s identity and message integrity' }, { ar: 'إخفاء عنوان IP المُرسِل', en: 'Hiding the sender\'s IP address' }],
        correct: 2, expAr: 'التوقيع الرقمي يثبت أن الرسالة صدرت من مُرسِل بعينه ولم يُعبَّث بها.', expEn: 'A digital signature proves the message came from a specific sender and was not tampered with.' },
      { type: 'mapping', qAr: 'طابق كل نوع تشفير بخصائصه:', qEn: 'Match each encryption type to its characteristics:',
        pairs: [
          { leftAr: 'متماثل', leftEn: 'Symmetric', rightAr: 'مفتاح واحد مشترك — سريع', rightEn: 'One shared key — fast' },
          { leftAr: 'غير متماثل', leftEn: 'Asymmetric', rightAr: 'مفتاح عام وخاص — أبطأ', rightEn: 'Public + private key — slower' },
          { leftAr: 'E2EE', leftEn: 'E2EE', rightAr: 'الخادم لا يقرأ الرسائل', rightEn: 'Server cannot read messages' },
          { leftAr: 'تجزئة', leftEn: 'Hashing', rightAr: 'أحادي الاتجاه — للتحقق لا للتشفير', rightEn: 'One-way — for verification not encryption' },
        ],
        expAr: 'أنواع التشفير المختلفة تخدم أغراضاً مختلفة في منظومة الأمان.', expEn: 'Different encryption types serve different purposes in a security architecture.' },
      { type: 'tf', qAr: 'في المحادثة المشفرة، يجب أن يعرف الطرفان مفتاح التشفير مسبقاً.', qEn: 'In an encrypted chat using symmetric encryption, both parties must know the key in advance.',
        correct: true, expAr: 'صحيح — التشفير المتماثل يتطلب مشاركة المفتاح مسبقاً بين الطرفين.', expEn: 'True — symmetric encryption requires both parties to share the key beforehand.' },
      { type: 'mc', qAr: 'ما هجوم "الرجل في المنتصف" (Man-in-the-Middle)؟', qEn: 'What is a Man-in-the-Middle (MITM) attack?',
        options: [{ ar: 'مهاجم يجلس بين الطرفين ويعترض ويعدّل الاتصال', en: 'An attacker sits between two parties, intercepting and potentially altering communication' }, { ar: 'مهاجم يخمين كلمة المرور', en: 'An attacker guessing the password' }, { ar: 'مهاجم يُعطّل الخادم', en: 'An attacker taking down the server' }, { ar: 'مهاجم يسرق قاعدة البيانات', en: 'An attacker stealing the database' }],
        correct: 0, expAr: 'MITM: المهاجم يجلس بين المُرسِل والمُستقبِل ويقرأ أو يُعدّل الرسائل — E2EE يمنعه.', expEn: 'MITM: attacker intercepts communication between two parties — E2EE prevents this.' },
    ],
  },
  {
    id: 9, titleAr: 'مقدمة إلى الطرفية', titleEn: 'Terminal Introduction',
    color: 'bg-slate-100 text-slate-700', accent: 'slate',
    questions: [
      { type: 'mc', qAr: 'ماذا تفعل أمر "ls" في الطرفية؟', qEn: 'What does the "ls" command do in the terminal?',
        options: [{ ar: 'يُدرج العمليات الجارية', en: 'Lists running processes' }, { ar: 'يُدرج الملفات في المجلد الحالي', en: 'Lists files in the current directory' }, { ar: 'يُحمّل سكريبت', en: 'Loads a script' }, { ar: 'يربط ملفين معاً', en: 'Links two files together' }],
        correct: 1, expAr: 'ls (list) تعرض محتويات المجلد الحالي من ملفات ومجلدات.', expEn: 'ls (list) displays files and folders in the current directory.' },
      { type: 'tf', qAr: 'الأمر "cd .." ينقلك إلى مجلد فرعي (داخلي).', qEn: 'The command "cd .." moves you into a subdirectory.',
        correct: false, expAr: 'خطأ — cd .. ينقلك للأعلى إلى المجلد الأب، وليس داخلاً.', expEn: 'False — cd .. moves you up to the parent directory, not into a subdirectory.' },
      { type: 'mc', qAr: 'أي أمر يعرض مسار المجلد الحالي كاملاً؟', qEn: 'Which command shows your full current directory path?',
        options: [{ ar: 'path', en: 'path' }, { ar: 'dir', en: 'dir' }, { ar: 'loc', en: 'loc' }, { ar: 'pwd', en: 'pwd' }],
        correct: 3, expAr: 'pwd (print working directory) يطبع المسار الكامل للمجلد الحالي.', expEn: 'pwd (print working directory) prints the full path of the current directory.' },
      { type: 'mapping', qAr: 'طابق كل أمر طرفية بوظيفته:', qEn: 'Match each terminal command to its function:',
        pairs: [
          { leftAr: 'ls', leftEn: 'ls', rightAr: 'عرض محتويات المجلد', rightEn: 'List directory contents' },
          { leftAr: 'cd', leftEn: 'cd', rightAr: 'تغيير المجلد الحالي', rightEn: 'Change current directory' },
          { leftAr: 'pwd', leftEn: 'pwd', rightAr: 'طباعة المسار الحالي', rightEn: 'Print working directory' },
          { leftAr: 'nano', leftEn: 'nano', rightAr: 'محرر نصوص في الطرفية', rightEn: 'Terminal text editor' },
        ],
        expAr: 'هذه أوامر Linux الأساسية لإدارة الملفات والمجلدات.', expEn: 'These are essential Linux commands for file and directory management.' },
      { type: 'mc', qAr: 'كيف تنتقل إلى المجلد الجذر في Linux؟', qEn: 'How do you navigate to the root directory in Linux?',
        options: [{ ar: 'cd root', en: 'cd root' }, { ar: 'cd home', en: 'cd home' }, { ar: 'cd ~', en: 'cd ~' }, { ar: 'cd /', en: 'cd /' }],
        correct: 3, expAr: 'cd / ينقلك إلى المجلد الجذر. cd ~ ينقلك إلى مجلد المستخدم.', expEn: 'cd / navigates to the root directory. cd ~ goes to the current user\'s home directory.' },
      { type: 'mc', qAr: 'ماذا يفعل الأمر "mkdir"؟', qEn: 'What does the "mkdir" command do?',
        options: [{ ar: 'يحذف مجلداً', en: 'Deletes a directory' }, { ar: 'ينقل مجلداً', en: 'Moves a directory' }, { ar: 'يُنشئ مجلداً جديداً', en: 'Creates a new directory' }, { ar: 'يُغيّر صلاحيات مجلد', en: 'Changes directory permissions' }],
        correct: 2, expAr: 'mkdir (make directory) يُنشئ مجلداً جديداً في المسار المحدد.', expEn: 'mkdir (make directory) creates a new directory at the specified path.' },
      { type: 'tf', qAr: 'الأمر "rm" في Linux ينقل الملفات إلى سلة المهملات.', qEn: 'The "rm" command in Linux moves files to the trash/recycle bin.',
        correct: false, expAr: 'خطأ — rm يحذف الملفات نهائياً وفورياً دون سلة مهملات.', expEn: 'False — rm permanently and immediately deletes files with no recycle bin.' },
      { type: 'mc', qAr: 'ماذا يفعل الأمر "cat" في الطرفية؟', qEn: 'What does the "cat" command do in the terminal?',
        options: [{ ar: 'يُشغّل سكريبت', en: 'Runs a script' }, { ar: 'يضغط الملفات', en: 'Compresses files' }, { ar: 'يُنشئ مجلداً', en: 'Creates a directory' }, { ar: 'يعرض محتوى الملف', en: 'Displays file content' }],
        correct: 3, expAr: 'cat (concatenate) يطبع محتوى الملف في الطرفية.', expEn: 'cat (concatenate) prints the content of a file to the terminal.' },
      { type: 'mc', qAr: 'أي خيار مع "ls" يعرض الملفات المخفية؟', qEn: 'Which option with "ls" shows hidden files?',
        options: [{ ar: 'ls -r', en: 'ls -r' }, { ar: 'ls -a', en: 'ls -a' }, { ar: 'ls -h', en: 'ls -h' }, { ar: 'ls -l', en: 'ls -l' }],
        correct: 1, expAr: 'ls -a يعرض جميع الملفات بما فيها المخفية (التي تبدأ بنقطة في Linux).', expEn: 'ls -a shows all files including hidden ones (those starting with a dot in Linux).' },
      { type: 'tf', qAr: '"man ls" تعرض صفحة دليل الأمر ls.', qEn: '"man ls" displays the manual page for the ls command.',
        correct: true, expAr: 'صحيح — man (manual) يعرض التوثيق الكامل لأي أمر.', expEn: 'True — man (manual) shows the complete documentation for any command.' },
      { type: 'mc', qAr: 'ماذا يفعل الأمر "chmod"؟', qEn: 'What does the "chmod" command do?',
        options: [{ ar: 'يُغيّر مالك الملف', en: 'Changes file owner' }, { ar: 'يُشفّر الملف', en: 'Encrypts the file' }, { ar: 'يُغيّر صلاحيات الملف أو المجلد', en: 'Changes file or directory permissions' }, { ar: 'يحذف الملف', en: 'Deletes the file' }],
        correct: 2, expAr: 'chmod يُعدّل صلاحيات القراءة والكتابة والتنفيذ لملف أو مجلد.', expEn: 'chmod modifies read, write, and execute permissions for a file or directory.' },
      { type: 'mapping', qAr: 'طابق كل أمر بوظيفته:', qEn: 'Match each command to its function:',
        pairs: [
          { leftAr: 'mkdir', leftEn: 'mkdir', rightAr: 'إنشاء مجلد جديد', rightEn: 'Create a new directory' },
          { leftAr: 'rm', leftEn: 'rm', rightAr: 'حذف ملف أو مجلد', rightEn: 'Delete a file or directory' },
          { leftAr: 'cat', leftEn: 'cat', rightAr: 'عرض محتوى ملف', rightEn: 'Display file content' },
          { leftAr: 'cp', leftEn: 'cp', rightAr: 'نسخ ملف إلى مكان آخر', rightEn: 'Copy a file to another location' },
        ],
        expAr: 'هذه أوامر أساسية لإدارة الملفات في Linux.', expEn: 'These are essential file management commands in Linux.' },
      { type: 'mc', qAr: 'ما اسم المستخدم ذو الصلاحيات الكاملة في Linux؟', qEn: 'What is the name of the superuser in Linux?',
        options: [{ ar: 'admin', en: 'admin' }, { ar: 'sudo', en: 'sudo' }, { ar: 'root', en: 'root' }, { ar: 'superuser', en: 'superuser' }],
        correct: 2, expAr: 'root هو المستخدم ذو الصلاحيات الكاملة في Linux ويمكنه تنفيذ أي أمر.', expEn: 'root is the superuser in Linux with full system access and can execute any command.' },
      { type: 'tf', qAr: '"sudo" يمنح صلاحيات مؤقتة كالمستخدم root لتنفيذ أوامر محددة.', qEn: '"sudo" grants temporary root-level privileges to execute specific commands.',
        correct: true, expAr: 'صحيح — sudo (superuser do) يُتيح تنفيذ أمر واحد بصلاحيات المسؤول.', expEn: 'True — sudo (superuser do) allows executing a single command with administrator privileges.' },
      { type: 'mc', qAr: 'ماذا يفعل الأمر "grep"؟', qEn: 'What does the "grep" command do?',
        options: [{ ar: 'يحذف الأسطر المكررة', en: 'Removes duplicate lines' }, { ar: 'يُنشئ ملفاً نصياً', en: 'Creates a text file' }, { ar: 'يُرتّب الملفات أبجدياً', en: 'Sorts files alphabetically' }, { ar: 'يبحث عن نص معين داخل الملفات', en: 'Searches for specific text within files' }],
        correct: 3, expAr: 'grep يبحث عن نمط نصي محدد داخل الملفات ويعرض الأسطر المطابقة.', expEn: 'grep searches for a specific text pattern inside files and displays matching lines.' },
    ],
  },
  {
    id: 10, titleAr: 'محاكاة الجدار الناري', titleEn: 'Firewall Simulation',
    color: 'bg-amber-100 text-amber-700', accent: 'amber',
    questions: [
      { type: 'mc', qAr: 'ما الهدف الرئيسي للجدار الناري (Firewall)؟', qEn: 'What is the primary purpose of a firewall?',
        options: [{ ar: 'تشفير حركة الشبكة', en: 'Encrypting network traffic' }, { ar: 'ضغط البيانات', en: 'Compressing data' }, { ar: 'تصفية حركة الشبكة بناءً على قواعد', en: 'Filtering network traffic based on rules' }, { ar: 'تسريع الاتصالات', en: 'Speeding up connections' }],
        correct: 2, expAr: 'الجدار الناري يفحص حركة الشبكة ويسمح أو يحجب الحزم وفق قواعد محددة.', expEn: 'A firewall inspects network traffic and allows or blocks packets according to defined rules.' },
      { type: 'tf', qAr: 'يمكن للجدار الناري حجب الحركة بناءً على عنوان IP المصدر.', qEn: 'A firewall can block traffic based on the source IP address.',
        correct: true, expAr: 'صحيح — عنوان IP هو أحد أكثر معايير تصفية الجدار الناري شيوعاً.', expEn: 'True — IP address is one of the most common firewall filtering criteria.' },
      { type: 'mc', qAr: 'الحركة "الواردة" (Inbound) في قواعد الجدار الناري تعني:', qEn: 'In firewall rules, "inbound" traffic refers to:',
        options: [{ ar: 'الحركة الخارجة من الشبكة', en: 'Traffic leaving the network' }, { ar: 'الحركة بين الأجهزة الداخلية', en: 'Traffic between internal devices' }, { ar: 'الحركة المشفرة', en: 'Encrypted traffic' }, { ar: 'الحركة الداخلة إلى الشبكة', en: 'Traffic entering the network' }],
        correct: 3, expAr: 'Inbound = الحركة القادمة من الخارج إلى الداخل.', expEn: 'Inbound = traffic coming from outside to inside.' },
      { type: 'mc', qAr: 'مستخدم خارجي يحاول الوصول إلى خادم داخلي — ما اتجاه الحركة؟', qEn: 'An external user tries to access an internal server — what is the traffic direction?',
        options: [{ ar: 'Outbound', en: 'Outbound' }, { ar: 'Lateral', en: 'Lateral' }, { ar: 'Inbound', en: 'Inbound' }, { ar: 'لا يوجد اتجاه محدد', en: 'No specific direction' }],
        correct: 2, expAr: 'مستخدم خارجي → الجدار الناري → الخادم الداخلي = حركة واردة (Inbound).', expEn: 'External user → Firewall → Internal server = Inbound traffic.' },
      { type: 'tf', qAr: 'قاعدة "اسمح بكل شيء" هي الإعداد الافتراضي الأكثر أماناً للجدار الناري.', qEn: '"Allow All" is the most secure default setting for a firewall.',
        correct: false, expAr: 'خطأ — المبدأ الصحيح هو "حجب كل شيء افتراضياً والسماح باستثناءات محددة".', expEn: 'False — the correct principle is "deny all by default, allow specific exceptions".' },
      { type: 'mc', qAr: 'ما الفرق الرئيسي بين الجدار الناري الحالة (Stateful) وغير الحالة (Stateless)؟', qEn: 'What is the main difference between a stateful and stateless firewall?',
        options: [{ ar: 'Stateful يتتبع حالة الاتصالات النشطة', en: 'Stateful tracks the state of active connections' }, { ar: 'Stateless أسرع ويتتبع الجلسات', en: 'Stateless is faster and tracks sessions' }, { ar: 'لا فرق بينهما', en: 'There is no difference between them' }, { ar: 'Stateful يعمل فقط مع IPv6', en: 'Stateful only works with IPv6' }],
        correct: 0, expAr: 'Stateful يتتبع جلسات الاتصال ويأخذ السياق بعين الاعتبار، بينما Stateless يفحص كل حزمة بشكل مستقل.', expEn: 'Stateful tracks connection sessions and considers context, while stateless inspects each packet independently.' },
      { type: 'tf', qAr: 'المنفذ 80 (Port 80) يُستخدم عادةً لبروتوكول HTTPS.', qEn: 'Port 80 is commonly used for HTTPS traffic.',
        correct: false, expAr: 'خطأ — المنفذ 80 لـ HTTP (غير مشفر)، والمنفذ 443 لـ HTTPS (مشفر).', expEn: 'False — Port 80 is for HTTP (unencrypted), port 443 is for HTTPS (encrypted).' },
      { type: 'mc', qAr: 'ما هو DMZ في سياق الشبكات؟', qEn: 'What is a DMZ in a network context?',
        options: [{ ar: 'بروتوكول تشفير متقدم', en: 'An advanced encryption protocol' }, { ar: 'نوع من هجمات رفض الخدمة', en: 'A type of denial-of-service attack' }, { ar: 'منطقة شبكية معزولة تستضيف خدمات عامة', en: 'An isolated network zone hosting public-facing services' }, { ar: 'خادم DNS خاص', en: 'A private DNS server' }],
        correct: 2, expAr: 'DMZ (Demilitarized Zone) منطقة شبكية معزولة بين الشبكة الداخلية والإنترنت لاستضافة الخوادم العامة.', expEn: 'DMZ (Demilitarized Zone) is an isolated network segment between the internal network and internet for hosting public servers.' },
      { type: 'mc', qAr: 'ما رقم المنفذ الافتراضي لبروتوكول HTTPS؟', qEn: 'What is the default port number for HTTPS?',
        options: [{ ar: '21', en: '21' }, { ar: '80', en: '80' }, { ar: '8080', en: '8080' }, { ar: '443', en: '443' }],
        correct: 3, expAr: 'HTTPS يستخدم المنفذ 443 افتراضياً للاتصالات المشفرة.', expEn: 'HTTPS uses port 443 by default for encrypted connections.' },
      { type: 'tf', qAr: 'جدار الحماية لتطبيقات الويب (WAF) يحمي خصيصاً تطبيقات الويب من هجمات مثل SQL Injection وXSS.', qEn: 'A Web Application Firewall (WAF) specifically protects web applications from attacks like SQL Injection and XSS.',
        correct: true, expAr: 'صحيح — WAF متخصص في حماية طبقة التطبيق من هجمات الويب الشائعة.', expEn: 'True — WAF specializes in protecting the application layer from common web attacks.' },
      { type: 'mc', qAr: 'أي نوع من الجدران النارية يفحص محتوى الحزمة (Payload) وليس فقط الترويسة؟', qEn: 'Which type of firewall inspects packet payload/content, not just the header?',
        options: [{ ar: 'Packet Filter', en: 'Packet Filter' }, { ar: 'Circuit-Level Gateway', en: 'Circuit-Level Gateway' }, { ar: 'Deep Packet Inspection (DPI)', en: 'Deep Packet Inspection (DPI)' }, { ar: 'Stateless Firewall', en: 'Stateless Firewall' }],
        correct: 2, expAr: 'DPI يفحص محتوى الحزمة الكامل بحثاً عن تهديدات خفية داخل البيانات.', expEn: 'DPI examines the full packet content searching for hidden threats inside the payload.' },
      { type: 'mapping', qAr: 'طابق كل نوع جدار ناري بوصفه:', qEn: 'Match each firewall type to its description:',
        pairs: [
          { leftAr: 'Packet Filter', leftEn: 'Packet Filter', rightAr: 'يفحص الترويسة فقط (IP، منفذ)', rightEn: 'Inspects header only (IP, port)' },
          { leftAr: 'Stateful', leftEn: 'Stateful', rightAr: 'يتتبع حالة جلسات الاتصال', rightEn: 'Tracks connection session state' },
          { leftAr: 'WAF', leftEn: 'WAF', rightAr: 'يحمي تطبيقات الويب', rightEn: 'Protects web applications' },
          { leftAr: 'DPI', leftEn: 'DPI', rightAr: 'يفحص محتوى الحزمة كاملاً', rightEn: 'Inspects full packet payload' },
        ],
        expAr: 'أنواع الجدران النارية تختلف في عمق الفحص والحماية التي توفرها.', expEn: 'Firewall types differ in the depth of inspection and protection they provide.' },
      { type: 'mc', qAr: 'ما هو معنى سياسة "Deny All" الافتراضية في الجدار الناري؟', qEn: 'What does a "Deny All" default policy mean in a firewall?',
        options: [{ ar: 'يُحجب كل شيء دائماً', en: 'Everything is blocked permanently' }, { ar: 'يُسمح لكل الحركة مروراً', en: 'All traffic is allowed through' }, { ar: 'يُسمح فقط للحركة التي تطابق قواعد السماح الصريحة', en: 'Only traffic matching explicit allow rules is permitted' }, { ar: 'يُحجب الإنترنت الخارجي فقط', en: 'Only external internet is blocked' }],
        correct: 2, expAr: '"Deny All" تعني حجب كل الحركة غير المصرح بها صراحةً — أكثر منهجيات الأمان أماناً.', expEn: '"Deny All" means blocking all traffic not explicitly authorized — the most secure security approach.' },
      { type: 'tf', qAr: 'الجدران النارية تستطيع الحماية الكاملة من التهديدات الداخلية (Insider Threats).', qEn: 'Firewalls can fully protect against insider threats.',
        correct: false, expAr: 'خطأ — الجدران النارية تركز على حركة الشبكة الخارجية؛ التهديدات الداخلية تحتاج أدوات إضافية كـ SIEM والتدقيق الداخلي.', expEn: 'False — firewalls focus on external network traffic; insider threats require additional tools like SIEM and internal auditing.' },
      { type: 'mc', qAr: 'المنفذ 22 مرتبط بأي بروتوكول؟', qEn: 'Port 22 is associated with which protocol?',
        options: [{ ar: 'FTP', en: 'FTP' }, { ar: 'HTTP', en: 'HTTP' }, { ar: 'SSH', en: 'SSH' }, { ar: 'SMTP', en: 'SMTP' }],
        correct: 2, expAr: 'SSH (Secure Shell) يستخدم المنفذ 22 للاتصال الآمن بالخوادم عن بُعد.', expEn: 'SSH (Secure Shell) uses port 22 for secure remote server access.' },
    ],
  },
  {
    id: 11, titleAr: 'ما هو DNS؟', titleEn: 'What is DNS?',
    color: 'bg-violet-100 text-violet-700', accent: 'violet',
    questions: [
      { type: 'mc', qAr: 'ماذا تعني اختصار DNS؟', qEn: 'What does DNS stand for?',
        options: [{ ar: 'Dynamic Network Service', en: 'Dynamic Network Service' }, { ar: 'Domain Name System', en: 'Domain Name System' }, { ar: 'Domain Network Security', en: 'Domain Network Security' }, { ar: 'Direct Name Server', en: 'Direct Name Server' }],
        correct: 1, expAr: 'DNS تعني Domain Name System — نظام أسماء النطاقات.', expEn: 'DNS stands for Domain Name System.' },
      { type: 'tf', qAr: 'DNS يحوّل أسماء النطاقات (مثل google.com) إلى عناوين IP رقمية.', qEn: 'DNS converts domain names (like google.com) into numeric IP addresses.',
        correct: true, expAr: 'صحيح — DNS يعمل مثل دليل الهاتف للإنترنت.', expEn: 'True — DNS acts like the internet\'s phone book, mapping names to numeric addresses.' },
      { type: 'mc', qAr: 'ماذا يُرجع خادم DNS عند الاستعلام عن "instagram.com"؟', qEn: 'What does a DNS server return when queried for "instagram.com"?',
        options: [{ ar: 'شيفرة HTML للموقع', en: 'The website\'s HTML code' }, { ar: 'كلمة مرور الموقع', en: 'The website\'s password' }, { ar: 'مالك الموقع', en: 'The website\'s owner' }, { ar: 'عنوان IP الخاص بالموقع', en: 'The website\'s IP address' }],
        correct: 3, expAr: 'خادم DNS يُرجع السجل A الذي يحتوي على عنوان IP المقابل للنطاق.', expEn: 'The DNS server returns the A record containing the IP address mapped to the domain.' },
      { type: 'mapping', qAr: 'طابق كل خطوة في عملية DNS بوصفها:', qEn: 'Match each DNS step to its description:',
        pairs: [
          { leftAr: 'استعلام DNS', leftEn: 'DNS Query', rightAr: 'المتصفح يسأل: ما IP هذا النطاق؟', rightEn: 'Browser asks: what IP is this domain?' },
          { leftAr: 'سجل DNS', leftEn: 'DNS Record', rightAr: 'يربط اسم النطاق بعنوان IP', rightEn: 'Maps domain name to IP address' },
          { leftAr: 'استجابة DNS', leftEn: 'DNS Response', rightAr: 'الخادم يُرجع عنوان IP', rightEn: 'Server returns the IP address' },
          { leftAr: 'التخزين المؤقت', leftEn: 'DNS Cache', rightAr: 'يحفظ النتائج لتسريع الاستعلامات المستقبلية', rightEn: 'Stores results to speed future queries' },
        ],
        expAr: 'عملية DNS تمر بمراحل: استعلام، بحث، استجابة، تخزين مؤقت.', expEn: 'DNS process: query, lookup, response, and caching.' },
      { type: 'tf', qAr: 'بدون DNS، ستحتاج لحفظ عنوان IP لكل موقع تريد زيارته.', qEn: 'Without DNS, you would need to memorize the IP address of every website you want to visit.',
        correct: true, expAr: 'صحيح — DNS يتيح استخدام أسماء سهلة الحفظ بدلاً من أرقام IP المعقدة.', expEn: 'True — DNS lets us use memorable names instead of complex IP numbers.' },
      { type: 'mc', qAr: 'ما هو سجل DNS من نوع "A"؟', qEn: 'What is a DNS "A" record?',
        options: [{ ar: 'يُدير نقل البريد الإلكتروني', en: 'Manages email transfer' }, { ar: 'يُنشئ اسماً بديلاً لنطاق آخر', en: 'Creates an alias for another domain' }, { ar: 'يُوجّه اسم نطاق إلى عنوان IPv4', en: 'Maps a domain name to an IPv4 address' }, { ar: 'يحتوي على معلومات المسؤول', en: 'Contains administrator information' }],
        correct: 2, expAr: 'سجل A يربط اسم النطاق بعنوان IPv4 المقابل له.', expEn: 'An A record maps a domain name to its corresponding IPv4 address.' },
      { type: 'tf', qAr: 'خدمة DNS تعمل على المنفذ 53 افتراضياً.', qEn: 'The DNS service operates on port 53 by default.',
        correct: true, expAr: 'صحيح — DNS يستخدم المنفذ 53 لكل من UDP (الاستعلامات العادية) وTCP (النقل الكامل).', expEn: 'True — DNS uses port 53 for both UDP (regular queries) and TCP (zone transfers).' },
      { type: 'mc', qAr: 'ماذا يعني TTL في سياق DNS؟', qEn: 'What does TTL mean in the context of DNS?',
        options: [{ ar: 'Time To Leave — وقت انتهاء الاتصال', en: 'Time To Leave — connection timeout' }, { ar: 'مدة بقاء السجل في التخزين المؤقت قبل انتهاء صلاحيته', en: 'Duration a record stays in cache before expiring' }, { ar: 'عدد مرات الاستعلام عن النطاق', en: 'Number of times a domain is queried' }, { ar: 'وقت استجابة خادم DNS', en: 'DNS server response time' }],
        correct: 1, expAr: 'TTL (Time to Live) يحدد كم يبقى السجل في التخزين المؤقت قبل أن يُحتاج لتحديثه.', expEn: 'TTL (Time to Live) specifies how long a record stays cached before needing to be refreshed.' },
      { type: 'mc', qAr: 'ما وظيفة سجل CNAME في DNS؟', qEn: 'What is the purpose of a CNAME record in DNS?',
        options: [{ ar: 'يُوجّه النطاق إلى عنوان IPv6', en: 'Maps domain to IPv6 address' }, { ar: 'يُحدّد خوادم البريد الإلكتروني', en: 'Specifies email mail servers' }, { ar: 'يُعرّف باسم المسؤول عن النطاق', en: 'Defines the domain administrator' }, { ar: 'ينشئ اسماً بديلاً يُشير إلى نطاق آخر', en: 'Creates an alias name pointing to another domain' }],
        correct: 3, expAr: 'CNAME (Canonical Name) يُتيح إنشاء اسم بديل لنطاق آخر، مثل www.example.com → example.com.', expEn: 'CNAME (Canonical Name) creates an alias pointing to another domain, e.g., www.example.com → example.com.' },
      { type: 'tf', qAr: 'استعلامات DNS مشفرة دائماً بشكل افتراضي.', qEn: 'DNS queries are always encrypted by default.',
        correct: false, expAr: 'خطأ — DNS التقليدي غير مشفر. DNS over HTTPS (DoH) وDNS over TLS (DoT) هما حلول للتشفير.', expEn: 'False — traditional DNS is unencrypted. DNS over HTTPS (DoH) and DNS over TLS (DoT) are encryption solutions.' },
      { type: 'mc', qAr: 'ما هو المحلل العودي (Recursive DNS Resolver)؟', qEn: 'What is a recursive DNS resolver?',
        options: [{ ar: 'خادم يحفظ سجلات النطاقات الجذرية فقط', en: 'A server storing only root domain records' }, { ar: 'خادم يبحث في سلسلة DNS الكاملة نيابةً عن المستخدم', en: 'A server that searches the full DNS chain on behalf of the user' }, { ar: 'خادم يرفض الاستعلامات الخارجية', en: 'A server that rejects external queries' }, { ar: 'خادم يُخزن ملفات الويب محلياً', en: 'A server storing web files locally' }],
        correct: 1, expAr: 'المحلل العودي يتلقى الاستعلام ويتتبع سلسلة خوادم DNS كاملةً للحصول على الإجابة.', expEn: 'The recursive resolver receives the query and traverses the full DNS server chain to get the answer.' },
      { type: 'mapping', qAr: 'طابق كل نوع سجل DNS بوظيفته:', qEn: 'Match each DNS record type to its function:',
        pairs: [
          { leftAr: 'سجل A', leftEn: 'A Record', rightAr: 'يُوجّه النطاق إلى IPv4', rightEn: 'Maps domain to IPv4' },
          { leftAr: 'سجل MX', leftEn: 'MX Record', rightAr: 'يُحدّد خوادم البريد الإلكتروني', rightEn: 'Specifies email servers' },
          { leftAr: 'سجل CNAME', leftEn: 'CNAME Record', rightAr: 'اسم بديل لنطاق آخر', rightEn: 'Alias for another domain' },
          { leftAr: 'سجل TXT', leftEn: 'TXT Record', rightAr: 'بيانات نصية تحقق أو معلومات', rightEn: 'Text data for verification or info' },
        ],
        expAr: 'كل نوع من سجلات DNS له دور محدد في توجيه حركة الإنترنت.', expEn: 'Each DNS record type has a specific role in routing internet traffic.' },
      { type: 'mc', qAr: 'ما الذي يحدث في عملية تسميم ذاكرة التخزين المؤقت DNS (Cache Poisoning)؟', qEn: 'What happens in DNS cache poisoning?',
        options: [{ ar: 'يُحذف خادم DNS', en: 'A DNS server is deleted' }, { ar: 'يُحجب المنفذ 53', en: 'Port 53 is blocked' }, { ar: 'يُدخل المهاجم سجلات DNS مزيفة في التخزين المؤقت', en: 'Attacker injects fake DNS records into the cache' }, { ar: 'يُعطّل خادم DNS بهجوم DoS', en: 'DNS server is disabled via DoS attack' }],
        correct: 2, expAr: 'Cache Poisoning: زرع سجلات DNS كاذبة في التخزين المؤقت لتوجيه المستخدمين إلى مواقع خبيثة.', expEn: 'Cache Poisoning: injecting false DNS records into cache to redirect users to malicious sites.' },
      { type: 'tf', qAr: 'مزود خدمة الإنترنت (ISP) يوفر عادةً خادم DNS افتراضياً لعملائه.', qEn: 'Your Internet Service Provider (ISP) typically provides a default DNS server for its customers.',
        correct: true, expAr: 'صحيح — معظم مزودي الإنترنت يُعيّنون خادم DNS الخاص بهم افتراضياً، لكن يمكن تغييره.', expEn: 'True — most ISPs assign their own DNS server by default, but it can be changed.' },
      { type: 'mc', qAr: 'ما البروتوكول الذي يستخدمه DNS أساساً لنقل الاستعلامات السريعة؟', qEn: 'What protocol does DNS primarily use for fast queries?',
        options: [{ ar: 'TCP', en: 'TCP' }, { ar: 'FTP', en: 'FTP' }, { ar: 'UDP', en: 'UDP' }, { ar: 'SMTP', en: 'SMTP' }],
        correct: 2, expAr: 'DNS يستخدم UDP للاستعلامات العادية لسرعته، ويلجأ لـ TCP للنقل الكامل للمناطق.', expEn: 'DNS uses UDP for regular queries due to speed, and falls back to TCP for full zone transfers.' },
    ],
  },
  {
    id: 12, titleAr: 'عنوان IP', titleEn: 'IP Address',
    color: 'bg-cyan-100 text-cyan-700', accent: 'cyan',
    questions: [
      { type: 'mc', qAr: 'ما هو عنوان IP؟', qEn: 'What is an IP address?',
        options: [{ ar: 'موقع جغرافي فيزيائي للجهاز', en: 'A physical geographic location' }, { ar: 'معرّف فريد للجهاز على الشبكة', en: 'A unique identifier for a device on a network' }, { ar: 'نوع من بروتوكولات التشفير', en: 'A type of encryption protocol' }, { ar: 'كلمة مرور الشبكة', en: 'A network password' }],
        correct: 1, expAr: 'عنوان IP معرف فريد يُتيح للأجهزة التعرف على بعضها وتبادل البيانات.', expEn: 'An IP address is a unique identifier that allows devices to identify each other and exchange data.' },
      { type: 'tf', qAr: 'جهازان على نفس الشبكة يمكن أن يمتلكا نفس عنوان IP.', qEn: 'Two devices on the same network can have the same IP address.',
        correct: false, expAr: 'خطأ — عنوان IP يجب أن يكون فريداً على نفس الشبكة لتجنب تعارض العناوين.', expEn: 'False — IP addresses must be unique on the same network to avoid address conflicts.' },
      { type: 'mc', qAr: 'أي من التالي عنوان IPv4 صالح؟', qEn: 'Which of the following is a valid IPv4 address?',
        options: [{ ar: '999.1.1.1', en: '999.1.1.1' }, { ar: '1234.5.6.7', en: '1234.5.6.7' }, { ar: '300.168.0.1', en: '300.168.0.1' }, { ar: '192.168.1.1', en: '192.168.1.1' }],
        correct: 3, expAr: '192.168.1.1 صالح — كل جزء يتراوح بين 0 و255.', expEn: '192.168.1.1 is valid — each octet ranges from 0-255.' },
      { type: 'mapping', qAr: 'طابق كل عنوان IP بوصفه:', qEn: 'Match each IP address to its description:',
        pairs: [
          { leftAr: '127.0.0.1', leftEn: '127.0.0.1', rightAr: 'عنوان الإرجاع (Loopback)', rightEn: 'Loopback / localhost' },
          { leftAr: '192.168.1.x', leftEn: '192.168.1.x', rightAr: 'شبكة محلية خاصة', rightEn: 'Private local network' },
          { leftAr: '8.8.8.8', leftEn: '8.8.8.8', rightAr: 'خادم DNS عام من Google', rightEn: 'Google public DNS server' },
          { leftAr: '10.0.0.1', leftEn: '10.0.0.1', rightAr: 'عنوان IP داخلي خاص', rightEn: 'Private internal IP address' },
        ],
        expAr: 'نطاقات IP الخاصة (192.168.x.x، 10.x.x.x) مخصصة للشبكات الداخلية.', expEn: 'Private IP ranges (192.168.x.x, 10.x.x.x) are reserved for internal networks.' },
      { type: 'mc', qAr: 'ما الفرق بين IP الخاص والعام؟', qEn: 'What distinguishes a private IP from a public IP?',
        options: [{ ar: 'لا فرق، كلاهما يصل للإنترنت', en: 'No difference, both accessible from the internet' }, { ar: 'IP الخاص يُستخدم داخل الشبكات المحلية فقط', en: 'Private IP is used inside local networks and not routable on the internet' }, { ar: 'IP الخاص أسرع من العام', en: 'Private IP is faster than public IP' }, { ar: 'لا شيء مما سبق', en: 'None of the above' }],
        correct: 1, expAr: 'IP الخاص للشبكات الداخلية فقط. IP العام للتواصل عبر الإنترنت.', expEn: 'Private IP is for internal networks only. Public IP is used for internet communication.' },
      { type: 'mc', qAr: 'كم عدد البتات في عنوان IPv4؟', qEn: 'How many bits are in an IPv4 address?',
        options: [{ ar: '16 بت', en: '16 bits' }, { ar: '64 بت', en: '64 bits' }, { ar: '128 بت', en: '128 bits' }, { ar: '32 بت', en: '32 bits' }],
        correct: 3, expAr: 'عنوان IPv4 يتكون من 32 بت مقسمة إلى 4 أجزاء (Octets) كل منها 8 بت.', expEn: 'IPv4 address consists of 32 bits divided into 4 octets of 8 bits each.' },
      { type: 'tf', qAr: 'عنوان IPv6 يتكون من 128 بت.', qEn: 'An IPv6 address consists of 128 bits.',
        correct: true, expAr: 'صحيح — IPv6 يستخدم 128 بت مما يُتيح عدداً هائلاً من العناوين مقارنةً بـ IPv4.', expEn: 'True — IPv6 uses 128 bits, allowing a vastly larger number of addresses compared to IPv4.' },
      { type: 'mc', qAr: 'ما هو NAT (Network Address Translation)؟', qEn: 'What is NAT (Network Address Translation)?',
        options: [{ ar: 'بروتوكول تشفير البيانات', en: 'A data encryption protocol' }, { ar: 'تقنية تُترجم عناوين IP الخاصة إلى عام للوصول للإنترنت', en: 'A technique that translates private IPs to a public IP for internet access' }, { ar: 'خادم توزيع العناوين تلقائياً', en: 'A server that automatically distributes addresses' }, { ar: 'نوع من الجدران النارية', en: 'A type of firewall' }],
        correct: 1, expAr: 'NAT يُتيح لأجهزة متعددة بعناوين IP خاصة مشاركة عنوان IP عام واحد للوصول للإنترنت.', expEn: 'NAT allows multiple devices with private IPs to share a single public IP for internet access.' },
      { type: 'mc', qAr: 'ما هو DHCP وما وظيفته؟', qEn: 'What is DHCP and what does it do?',
        options: [{ ar: 'بروتوكول لنقل الملفات بأمان', en: 'A protocol for secure file transfer' }, { ar: 'بروتوكول لتشفير الاتصالات', en: 'A protocol for encrypting communications' }, { ar: 'بروتوكول يُوزّع عناوين IP تلقائياً للأجهزة', en: 'A protocol that automatically assigns IP addresses to devices' }, { ar: 'بروتوكول لإدارة المسارات', en: 'A protocol for managing routes' }],
        correct: 2, expAr: 'DHCP (Dynamic Host Configuration Protocol) يُعيّن عناوين IP تلقائياً للأجهزة عند اتصالها بالشبكة.', expEn: 'DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses to devices when they join a network.' },
      { type: 'tf', qAr: 'عنوان IPv4 يوفر عدداً أكبر من العناوين مقارنةً بـ IPv6.', qEn: 'IPv4 provides more addresses than IPv6.',
        correct: false, expAr: 'خطأ — IPv4 يوفر نحو 4.3 مليار عنوان فقط، بينما IPv6 يوفر 340 أُندسيليون عنوان.', expEn: 'False — IPv4 provides about 4.3 billion addresses, while IPv6 provides 340 undecillion addresses.' },
      { type: 'mc', qAr: 'ما وظيفة قناع الشبكة الفرعية (Subnet Mask)؟', qEn: 'What is the purpose of a subnet mask?',
        options: [{ ar: 'تشفير حركة الشبكة', en: 'Encrypting network traffic' }, { ar: 'تحديد الجزء الخاص بالشبكة والجزء الخاص بالمضيف في عنوان IP', en: 'Identifying which part of an IP belongs to the network vs. the host' }, { ar: 'تحديد سرعة الاتصال', en: 'Determining connection speed' }, { ar: 'تصفية حزم الشبكة', en: 'Filtering network packets' }],
        correct: 1, expAr: 'قناع الشبكة الفرعية يُحدد أي جزء من عنوان IP يمثل الشبكة وأيهما يمثل الجهاز.', expEn: 'Subnet mask determines which portion of an IP address represents the network and which represents the host.' },
      { type: 'mapping', qAr: 'طابق كل نطاق IP بتصنيفه:', qEn: 'Match each IP range to its classification:',
        pairs: [
          { leftAr: '10.0.0.0/8', leftEn: '10.0.0.0/8', rightAr: 'Class A خاص', rightEn: 'Class A Private' },
          { leftAr: '172.16.0.0/12', leftEn: '172.16.0.0/12', rightAr: 'Class B خاص', rightEn: 'Class B Private' },
          { leftAr: '192.168.0.0/16', leftEn: '192.168.0.0/16', rightAr: 'Class C خاص', rightEn: 'Class C Private' },
          { leftAr: '127.0.0.1', leftEn: '127.0.0.1', rightAr: 'عنوان الإرجاع المحلي', rightEn: 'Local loopback address' },
        ],
        expAr: 'نطاقات IP الخاصة محجوزة للشبكات الداخلية ولا يمكن توجيهها عبر الإنترنت.', expEn: 'Private IP ranges are reserved for internal networks and not routable on the internet.' },
      { type: 'mc', qAr: 'ماذا يعني "/24" في العنوان "192.168.1.0/24"؟', qEn: 'What does "/24" mean in the address "192.168.1.0/24"?',
        options: [{ ar: 'الشبكة تدعم 24 جهازاً فقط', en: 'The network supports 24 devices only' }, { ar: 'عنوان IP مكون من 24 رقماً', en: 'An IP address with 24 digits' }, { ar: '24 بت الأولى تمثل الشبكة، والباقي للأجهزة', en: 'First 24 bits represent the network, rest for hosts' }, { ar: 'المنفذ 24 مستخدم افتراضياً', en: 'Port 24 is used by default' }],
        correct: 2, expAr: '/24 تعني أن الـ 24 بت الأولى هي معرّف الشبكة، مما يُتيح 254 جهازاً قابلاً للاستخدام.', expEn: '/24 means the first 24 bits identify the network, allowing 254 usable host addresses.' },
      { type: 'tf', qAr: 'عنوان IP الخاص يمكن الوصول إليه مباشرةً من الإنترنت.', qEn: 'A private IP address can be accessed directly from the internet.',
        correct: false, expAr: 'خطأ — عناوين IP الخاصة غير قابلة للتوجيه عبر الإنترنت ومخصصة للشبكات الداخلية فقط.', expEn: 'False — private IP addresses are not internet-routable and are reserved for internal networks only.' },
      { type: 'mc', qAr: 'كم عدد الأجهزة القابلة للاستخدام في شبكة /24؟', qEn: 'How many usable host addresses are in a /24 network?',
        options: [{ ar: '256', en: '256' }, { ar: '254', en: '254' }, { ar: '128', en: '128' }, { ar: '512', en: '512' }],
        correct: 1, expAr: '/24 تعني 256 عنواناً إجمالاً، منها 254 قابلة للاستخدام (يُستبعد عنوان الشبكة والبث).', expEn: 'A /24 network has 256 total addresses, with 254 usable (network and broadcast addresses excluded).' },
    ],
  },
  {
    id: 13, titleAr: 'محاكاة DNS Spoofing', titleEn: 'DNS Spoofing',
    color: 'bg-red-100 text-red-700', accent: 'red',
    questions: [
      { type: 'mc', qAr: 'ما هو DNS Spoofing؟', qEn: 'What is DNS Spoofing?',
        options: [{ ar: 'تخمين اسم نطاق', en: 'Guessing a domain name' }, { ar: 'تقديم عنوان IP مزيف لنطاق حقيقي', en: 'Providing a false IP address for a legitimate domain' }, { ar: 'حجب خادم DNS', en: 'Blocking a DNS server' }, { ar: 'تشفير استعلامات DNS', en: 'Encrypting DNS queries' }],
        correct: 1, expAr: 'DNS Spoofing = تعديل سجل DNS لتوجيه الضحايا إلى عنوان IP مزيف.', expEn: 'DNS Spoofing = modifying a DNS record to redirect victims to a fake IP address.' },
      { type: 'tf', qAr: 'هجوم DNS Spoofing يمكن أن يُعيد توجيه المستخدمين إلى مواقع مزيفة دون أن يعلموا.', qEn: 'A DNS Spoofing attack can redirect users to fake websites without them knowing.',
        correct: true, expAr: 'صحيح — الضحية تكتب اسم الموقع الصحيح لكنها تُوجَّه إلى موقع مزيف.', expEn: 'True — the victim types the correct domain but is redirected to a fake site.' },
      { type: 'mc', qAr: 'أي تقنية تساعد في الحماية من DNS Spoofing؟', qEn: 'Which technology helps protect against DNS Spoofing?',
        options: [{ ar: 'FTP', en: 'FTP' }, { ar: 'SMTP', en: 'SMTP' }, { ar: 'ARP', en: 'ARP' }, { ar: 'DNSSEC', en: 'DNSSEC' }],
        correct: 3, expAr: 'DNSSEC تُضيف توقيعاً رقمياً لسجلات DNS للتحقق من صحتها.', expEn: 'DNSSEC adds digital signatures to DNS records to verify their authenticity.' },
      { type: 'mc', qAr: 'في هجوم DNS Spoofing، ماذا يستبدل المهاجم بعنوان IP الشرعي؟', qEn: 'In a DNS Spoofing attack, what does the attacker replace the legitimate IP with?',
        options: [{ ar: 'رقم منفذ', en: 'A port number' }, { ar: 'مفتاح تشفير', en: 'An encryption key' }, { ar: 'عنوان MAC', en: 'A MAC address' }, { ar: 'عنوان IP مزيف يؤدي إلى خادم خبيث', en: 'A fake IP pointing to a malicious server' }],
        correct: 3, expAr: 'المهاجم يُدخل عنوان IP خبيث في سجل DNS حتى تتوجه الضحية إلى موقعه المزيف.', expEn: 'The attacker injects a malicious IP into the DNS record to redirect victims to their fake server.' },
      { type: 'mapping', qAr: 'طابق كل خطوة في هجوم DNS Spoofing بما يحدث:', qEn: 'Match each DNS Spoofing step to what happens:',
        pairs: [
          { leftAr: 'تعديل سجل DNS', leftEn: 'DNS record modified', rightAr: 'المهاجم يزرع IP مزيف', rightEn: 'Attacker plants fake IP' },
          { leftAr: 'زيارة الضحية', leftEn: 'Victim visits site', rightAr: 'يُوجَّه إلى الموقع المزيف', rightEn: 'Redirected to fake site' },
          { leftAr: 'الموقع المزيف يبدو حقيقياً', leftEn: 'Fake site looks real', rightAr: 'الضحية تُدخل بياناتها', rightEn: 'Victim enters credentials' },
          { leftAr: 'فحص شهادة SSL', leftEn: 'Check SSL certificate', rightAr: 'يكشف الموقع المزيف', rightEn: 'Reveals the fake site' },
        ],
        expAr: 'يمكن للمستخدم اكتشاف الهجوم بفحص شهادة SSL.', expEn: 'Users can detect the attack by checking the SSL certificate for validity.' },
      { type: 'mc', qAr: 'ما هو تسميم ذاكرة التخزين المؤقت (Cache Poisoning)؟', qEn: 'What is cache poisoning?',
        options: [{ ar: 'حذف ذاكرة التخزين المؤقت للمتصفح', en: 'Deleting the browser cache' }, { ar: 'إدخال بيانات خبيثة في ذاكرة التخزين المؤقت لـ DNS', en: 'Injecting malicious data into the DNS cache' }, { ar: 'تشفير استعلامات DNS', en: 'Encrypting DNS queries' }, { ar: 'زيادة حجم ذاكرة التخزين المؤقت', en: 'Increasing cache size' }],
        correct: 1, expAr: 'Cache Poisoning يزرع سجلات DNS مزيفة في التخزين المؤقت لتحويل المستخدمين إلى مواقع خبيثة.', expEn: 'Cache Poisoning plants fake DNS records in cache to redirect users to malicious sites.' },
      { type: 'tf', qAr: 'استخدام HTTPS يحمي تماماً من هجوم DNS Spoofing.', qEn: 'Using HTTPS completely protects you from DNS Spoofing attacks.',
        correct: false, expAr: 'خطأ — HTTPS يُشفّر البيانات لكن لا يمنع التوجيه لموقع مزيف يمتلك شهادة SSL.', expEn: 'False — HTTPS encrypts data but does not prevent being redirected to a fake site that also has an SSL certificate.' },
      { type: 'mc', qAr: 'ما هو هجوم الرجل في المنتصف (Man-in-the-Middle / MITM)؟', qEn: 'What is a Man-in-the-Middle (MITM) attack?',
        options: [{ ar: 'هجوم يستهدف سرقة بيانات قاعدة البيانات', en: 'An attack targeting database theft' }, { ar: 'هجوم يتم فيه اعتراض الاتصال بين طرفين دون علمهما', en: 'An attack where communication between two parties is intercepted without their knowledge' }, { ar: 'هجوم يُعطّل الخوادم بإرسال كميات كبيرة من الطلبات', en: 'An attack that disables servers with massive requests' }, { ar: 'اختراق جدار الحماية عبر ثغرة برمجية', en: 'Penetrating a firewall through a software vulnerability' }],
        correct: 1, expAr: 'MITM: المهاجم يعترض الاتصال بين الضحية والخادم ليقرأ أو يُعدّل البيانات.', expEn: 'MITM: the attacker intercepts communication between victim and server to read or modify data.' },
      { type: 'mc', qAr: 'ما الأداة التي تساعد في التحقق من صحة سجلات DNS لنطاق معين؟', qEn: 'Which tool helps verify the DNS records of a specific domain?',
        options: [{ ar: 'ping', en: 'ping' }, { ar: 'nmap', en: 'nmap' }, { ar: 'nslookup أو dig', en: 'nslookup or dig' }, { ar: 'tracert', en: 'tracert' }],
        correct: 2, expAr: 'nslookup وdig أدوات لاستعلام سجلات DNS والتحقق من صحتها.', expEn: 'nslookup and dig are tools for querying DNS records and verifying their correctness.' },
      { type: 'tf', qAr: 'DNS Spoofing يُعدّ نوعاً من هجمات التصيد الاحتيالي (Phishing).', qEn: 'DNS Spoofing is considered a type of phishing attack.',
        correct: true, expAr: 'صحيح — DNS Spoofing يُستخدم لتوجيه الضحايا إلى مواقع مزيفة لسرقة بياناتهم، مما يجعله تصيداً احتيالياً تقنياً.', expEn: 'True — DNS Spoofing redirects victims to fake sites to steal credentials, making it a form of technical phishing.' },
      { type: 'mc', qAr: 'ما هو ARP Spoofing؟', qEn: 'What is ARP Spoofing?',
        options: [{ ar: 'هجوم على نظام الأسماء الرئيسي', en: 'An attack on the root name system' }, { ar: 'هجوم يستبدل عناوين MAC في جدول ARP للشبكة المحلية', en: 'An attack that replaces MAC addresses in the local network ARP table' }, { ar: 'تشفير حركة ARP', en: 'Encrypting ARP traffic' }, { ar: 'تعطيل بروتوكول ARP كلياً', en: 'Disabling the ARP protocol entirely' }],
        correct: 1, expAr: 'ARP Spoofing: يُعدّل جدول ARP لتوجيه الحركة عبر جهاز المهاجم في الشبكة المحلية.', expEn: 'ARP Spoofing: modifies the ARP table to route traffic through the attacker\'s device on the local network.' },
      { type: 'mapping', qAr: 'طابق كل نوع هجوم بوصفه:', qEn: 'Match each attack type to its description:',
        pairs: [
          { leftAr: 'DNS Spoofing', leftEn: 'DNS Spoofing', rightAr: 'تزوير سجل DNS لتوجيه الضحية', rightEn: 'Forging DNS records to redirect victim' },
          { leftAr: 'ARP Spoofing', leftEn: 'ARP Spoofing', rightAr: 'تزوير جدول MAC لاعتراض الاتصال', rightEn: 'Forging MAC table to intercept traffic' },
          { leftAr: 'Phishing', leftEn: 'Phishing', rightAr: 'خداع المستخدم لكشف بياناته', rightEn: 'Tricking user into revealing credentials' },
          { leftAr: 'MITM', leftEn: 'MITM', rightAr: 'اعتراض الاتصال بين طرفين', rightEn: 'Intercepting communication between two parties' },
        ],
        expAr: 'هذه الهجمات تشترك في خداع المستخدم أو التلاعب بالبنية التحتية للشبكة.', expEn: 'These attacks share the goal of deceiving users or manipulating network infrastructure.' },
      { type: 'mc', qAr: 'كيف يُساعد DNS over HTTPS (DoH) في الحماية؟', qEn: 'How does DNS over HTTPS (DoH) help with security?',
        options: [{ ar: 'يمنع جميع هجمات الشبكة', en: 'Prevents all network attacks' }, { ar: 'يُسرّع استعلامات DNS', en: 'Speeds up DNS queries' }, { ar: 'يُشفّر استعلامات DNS مانعاً التنصت والتلاعب', en: 'Encrypts DNS queries preventing eavesdropping and tampering' }, { ar: 'يستبدل DNS بالكامل', en: 'Completely replaces DNS' }],
        correct: 2, expAr: 'DoH يُشفّر استعلامات DNS عبر HTTPS مما يمنع التنصت والتلاعب بها.', expEn: 'DoH encrypts DNS queries over HTTPS, preventing eavesdropping and tampering.' },
      { type: 'tf', qAr: 'مسح ذاكرة التخزين المؤقت لـ DNS يمكن أن يساعد بعد هجوم DNS Spoofing.', qEn: 'Clearing the DNS cache can help recover after a DNS Spoofing attack.',
        correct: true, expAr: 'صحيح — مسح التخزين المؤقت يُزيل السجلات المزيفة ويُجبر النظام على طلب سجلات جديدة.', expEn: 'True — clearing the cache removes fake records and forces the system to fetch fresh DNS records.' },
      { type: 'mc', qAr: 'ما الهدف الرئيسي لهجوم DNS Spoofing؟', qEn: 'What is the primary goal of a DNS Spoofing attack?',
        options: [{ ar: 'تعطيل خادم DNS', en: 'Disabling the DNS server' }, { ar: 'سرقة عرض النطاق الترددي', en: 'Stealing bandwidth' }, { ar: 'توجيه المستخدمين إلى مواقع مزيفة لسرقة بياناتهم أو خداعهم', en: 'Redirecting users to fake sites to steal data or deceive them' }, { ar: 'تسريع استعلامات DNS', en: 'Speeding up DNS queries' }],
        correct: 2, expAr: 'هدف DNS Spoofing توجيه الضحية إلى موقع خبيث يبدو شرعياً لسرقة بياناتها.', expEn: 'DNS Spoofing aims to redirect victims to a malicious site that appears legitimate to steal their data.' },
    ],
  },
  {
    id: 14, titleAr: 'محاكاة SIEM', titleEn: 'SIEM Simulation',
    color: 'bg-rose-100 text-rose-700', accent: 'rose',
    questions: [
      { type: 'mc', qAr: 'ماذا تعني اختصار SIEM؟', qEn: 'What does SIEM stand for?',
        options: [{ ar: 'Security Information and Event Management', en: 'Security Information and Event Management' }, { ar: 'System Intelligence and Error Monitoring', en: 'System Intelligence and Error Monitoring' }, { ar: 'Security Interface and Encryption Module', en: 'Security Interface and Encryption Module' }, { ar: 'Synchronized Information Exchange Module', en: 'Synchronized Information Exchange Module' }],
        correct: 0, expAr: 'SIEM = Security Information and Event Management — إدارة معلومات الأمان والأحداث.', expEn: 'SIEM stands for Security Information and Event Management.' },
      { type: 'tf', qAr: 'نظام SIEM يُصلح تلقائياً كل الحوادث الأمنية دون تدخل بشري.', qEn: 'A SIEM system automatically fixes all security incidents without human intervention.',
        correct: false, expAr: 'خطأ — SIEM يكتشف ويُنبّه، لكن الاستجابة تحتاج تدخلاً بشرياً عادةً.', expEn: 'False — SIEM detects and alerts; response typically requires human intervention.' },
      { type: 'mc', qAr: 'ما معنى "تنبيه" (Alert) في نظام SIEM؟', qEn: 'What is an "alert" in a SIEM system?',
        options: [{ ar: 'مهمة صيانة مجدولة', en: 'A scheduled maintenance task' }, { ar: 'نسخة احتياطية مشفرة', en: 'An encrypted backup' }, { ar: 'إشعار بحدث مشبوه محتمل', en: 'A notification of a potentially suspicious event' }, { ar: 'تسجيل دخول مستخدم عادي', en: 'A regular user login' }],
        correct: 2, expAr: 'التنبيه يُخطر المحلل بنشاط مشبوه يستدعي التحقيق.', expEn: 'An alert notifies the analyst of suspicious activity that requires investigation.' },
      { type: 'mapping', qAr: 'طابق كل وظيفة SIEM بهدفها:', qEn: 'Match each SIEM function to its purpose:',
        pairs: [
          { leftAr: 'ربط الأحداث', leftEn: 'Event correlation', rightAr: 'اكتشاف أنماط الهجوم', rightEn: 'Detect attack patterns' },
          { leftAr: 'توليد التنبيهات', leftEn: 'Alert generation', rightAr: 'إخطار المحللين بالأنشطة المشبوهة', rightEn: 'Notify analysts of suspicious activity' },
          { leftAr: 'الاحتفاظ بالسجلات', leftEn: 'Log retention', rightAr: 'الامتثال والتحليل الجنائي', rightEn: 'Compliance and forensics' },
          { leftAr: 'لوحة المعلومات', leftEn: 'Dashboard', rightAr: 'عرض الوضع الأمني بصرياً', rightEn: 'Visualize security posture' },
        ],
        expAr: 'SIEM يجمع هذه الوظائف لمنح المحللين رؤية شاملة للتهديدات.', expEn: 'SIEM combines these functions to give analysts comprehensive threat visibility.' },
      { type: 'tf', qAr: 'يمكن لأنظمة SIEM اكتشاف الهجمات بربط أحداث متعددة من مصادر مختلفة.', qEn: 'SIEM systems can detect attacks by correlating multiple events across different sources.',
        correct: true, expAr: 'صحيح — قوة SIEM تكمن في ربط الأحداث المتفرقة لاكتشاف أنماط الهجوم الكاملة.', expEn: 'True — SIEM\'s strength lies in correlating scattered events to detect full attack patterns.' },
      { type: 'mc', qAr: 'ما هو SOC (Security Operations Center)؟', qEn: 'What is a SOC (Security Operations Center)?',
        options: [{ ar: 'خادم DNS متخصص بالأمن', en: 'A DNS server specialized in security' }, { ar: 'فريق ومركز عمليات يراقب التهديدات الأمنية ويستجيب لها', en: 'A team and operations center that monitors and responds to security threats' }, { ar: 'نوع من أنواع الجدار الناري', en: 'A type of firewall' }, { ar: 'بروتوكول تشفير متقدم', en: 'An advanced encryption protocol' }],
        correct: 1, expAr: 'SOC مركز عمليات أمنية يضم محللين يستخدمون أدوات مثل SIEM لمراقبة التهديدات والاستجابة لها.', expEn: 'SOC is a security operations center with analysts who use tools like SIEM to monitor threats and respond to incidents.' },
      { type: 'tf', qAr: 'أنظمة SIEM تستطيع فقط مراقبة حركة الشبكة دون مراقبة السجلات الأخرى.', qEn: 'SIEM systems can only monitor network traffic and not other types of logs.',
        correct: false, expAr: 'خطأ — SIEM يجمع سجلات من مصادر متعددة: الشبكة، الخوادم، التطبيقات، قواعد البيانات وغيرها.', expEn: 'False — SIEM collects logs from multiple sources: network, servers, applications, databases, and more.' },
      { type: 'mc', qAr: 'ما هو "الإيجابي الكاذب" (False Positive) في سياق SIEM؟', qEn: 'What is a "False Positive" in the context of SIEM?',
        options: [{ ar: 'تنبيه حقيقي يُشير إلى هجوم فعلي', en: 'A real alert indicating an actual attack' }, { ar: 'هجوم لم يكتشفه النظام', en: 'An attack the system missed' }, { ar: 'تنبيه يُشير إلى نشاط خبيث لكنه في الواقع نشاط طبيعي', en: 'An alert indicating malicious activity that is actually normal behavior' }, { ar: 'تقرير مُولَّد يومياً', en: 'A daily generated report' }],
        correct: 2, expAr: 'False Positive: تنبيه خاطئ يُعالجه المحلل ليكتشف أنه نشاط عادي وليس هجوماً.', expEn: 'False Positive: a false alarm that analysts investigate only to find it is normal activity, not an attack.' },
      { type: 'mc', qAr: 'ما هو "صيد التهديدات" (Threat Hunting)؟', qEn: 'What is threat hunting?',
        options: [{ ar: 'انتظار التنبيهات الآلية للاستجابة', en: 'Waiting for automated alerts to respond' }, { ar: 'إنشاء قواعد جديدة للجدار الناري', en: 'Creating new firewall rules' }, { ar: 'البحث الاستباقي عن تهديدات خفية لم تُكتشف بعد', en: 'Proactively searching for hidden threats not yet detected' }, { ar: 'حذف السجلات القديمة', en: 'Deleting old logs' }],
        correct: 2, expAr: 'Threat Hunting بحث استباقي يقوده محللون بشريون للكشف عن تهديدات خفية لم تُثر تنبيهات آلية.', expEn: 'Threat Hunting is proactive search led by human analysts to uncover hidden threats that did not trigger automated alerts.' },
      { type: 'tf', qAr: 'أنظمة SIEM تحتاج إلى جمع السجلات يدوياً من كل مصدر على حدة.', qEn: 'SIEM systems require manual log collection from each source individually.',
        correct: false, expAr: 'خطأ — SIEM يستخدم عوامل تجميع (Agents/Collectors) لجمع السجلات تلقائياً من مصادر متعددة.', expEn: 'False — SIEM uses agents/collectors to automatically gather logs from multiple sources.' },
      { type: 'mc', qAr: 'ما هو SOAR وكيف يكمل SIEM؟', qEn: 'What is SOAR and how does it complement SIEM?',
        options: [{ ar: 'بروتوكول اتصال شبكي', en: 'A network communication protocol' }, { ar: 'منصة تُؤتمت الاستجابة للحوادث الأمنية المكتشفة بواسطة SIEM', en: 'A platform that automates response to security incidents detected by SIEM' }, { ar: 'نوع من أنواع التشفير', en: 'A type of encryption' }, { ar: 'قاعدة بيانات التوقيعات الخبيثة', en: 'A malware signature database' }],
        correct: 1, expAr: 'SOAR (Security Orchestration, Automation and Response) يُؤتمت الاستجابة للحوادث التي يكتشفها SIEM.', expEn: 'SOAR (Security Orchestration, Automation and Response) automates incident response to threats detected by SIEM.' },
      { type: 'mapping', qAr: 'طابق كل مصطلح أمني بتعريفه:', qEn: 'Match each security term to its definition:',
        pairs: [
          { leftAr: 'SIEM', leftEn: 'SIEM', rightAr: 'جمع وتحليل سجلات الأمان', rightEn: 'Collecting and analyzing security logs' },
          { leftAr: 'SOC', leftEn: 'SOC', rightAr: 'مركز عمليات أمنية', rightEn: 'Security operations center' },
          { leftAr: 'SOAR', leftEn: 'SOAR', rightAr: 'أتمتة الاستجابة للحوادث', rightEn: 'Automated incident response' },
          { leftAr: 'False Positive', leftEn: 'False Positive', rightAr: 'تنبيه خاطئ لنشاط طبيعي', rightEn: 'False alarm for normal activity' },
        ],
        expAr: 'هذه المصطلحات تشكل أساس عمليات الأمن الحديثة.', expEn: 'These terms form the foundation of modern security operations.' },
      { type: 'mc', qAr: 'ما هو إطار MITRE ATT&CK؟', qEn: 'What is the MITRE ATT&CK framework?',
        options: [{ ar: 'بروتوكول تشفير حديث', en: 'A modern encryption protocol' }, { ar: 'نوع من برامج SIEM', en: 'A type of SIEM software' }, { ar: 'قاعدة معرفة بأساليب وتكتيكات المهاجمين المعروفة', en: 'A knowledge base of known attacker tactics and techniques' }, { ar: 'معيار قانوني لحماية البيانات', en: 'A legal standard for data protection' }],
        correct: 2, expAr: 'MITRE ATT&CK قاعدة معرفة عالمية تُصنّف تكتيكات وتقنيات المهاجمين وتُستخدم لتحسين الكشف والاستجابة.', expEn: 'MITRE ATT&CK is a global knowledge base classifying attacker tactics and techniques, used to improve detection and response.' },
      { type: 'tf', qAr: 'الاحتفاظ بالسجلات في SIEM يساعد في التحقيقات الجنائية (Forensics) بعد الحوادث.', qEn: 'Log retention in SIEM helps with forensic investigations after incidents.',
        correct: true, expAr: 'صحيح — السجلات التاريخية تُتيح لمحللين إعادة بناء مسار الهجوم وفهم ما حدث.', expEn: 'True — historical logs allow analysts to reconstruct the attack timeline and understand what happened.' },
      { type: 'mc', qAr: 'ما الدور الرئيسي لمحلل SIEM؟', qEn: 'What is the primary role of a SIEM analyst?',
        options: [{ ar: 'كتابة الكود البرمجي لتطبيقات الويب', en: 'Writing code for web applications' }, { ar: 'مراقبة التنبيهات والتحقيق في الحوادث الأمنية', en: 'Monitoring alerts and investigating security incidents' }, { ar: 'إدارة قواعد البيانات', en: 'Managing databases' }, { ar: 'تصميم واجهات المستخدم', en: 'Designing user interfaces' }],
        correct: 1, expAr: 'محلل SIEM يراقب التنبيهات ويُحقق في الحوادث ويُقرر إن كانت تهديدات حقيقية تستدعي الاستجابة.', expEn: 'A SIEM analyst monitors alerts, investigates incidents, and decides whether they are real threats requiring response.' },
    ],
  },
  {
    id: 15, titleAr: 'أداة برق', titleEn: 'Barq Tool',
    color: 'bg-yellow-100 text-yellow-800', accent: 'yellow',
    questions: [
      { type: 'mc', qAr: 'ما هو الهدف الرئيسي لأداة برق (Barq)؟', qEn: 'What is the main purpose of the Barq tool?',
        options: [{ ar: 'تشفير الملفات', en: 'Encrypting files' }, { ar: 'اختبار قوة كلمات المرور عبر محاولات متعددة', en: 'Testing password strength through multiple attempts' }, { ar: 'فحص الثغرات في الشبكة', en: 'Scanning network vulnerabilities' }, { ar: 'مراقبة حركة الشبكة', en: 'Monitoring network traffic' }],
        correct: 1, expAr: 'أداة برق تُحاكي هجوم القوة الغاشمة لاختبار مدى قوة كلمات المرور.', expEn: 'Barq simulates a brute force attack to test how strong passwords are.' },
      { type: 'tf', qAr: 'هجوم القوة الغاشمة (Brute Force) يجرب جميع التوليفات الممكنة لكلمة المرور.', qEn: 'A brute force attack tries all possible combinations of a password.',
        correct: true, expAr: 'صحيح — الهجوم يُجرّب كل تركيبة ممكنة حتى يجد كلمة المرور الصحيحة.', expEn: 'True — the attack tries every possible combination until it finds the correct password.' },
      { type: 'mc', qAr: 'ما هو هجوم القاموس (Dictionary Attack)؟', qEn: 'What is a dictionary attack?',
        options: [{ ar: 'هجوم يستهدف قواميس اللغة العربية', en: 'An attack targeting Arabic language dictionaries' }, { ar: 'هجوم يستخدم قائمة كلمات مرور شائعة بدلاً من التجربة العشوائية', en: 'An attack using a list of common passwords instead of random guessing' }, { ar: 'هجوم يشفّر كلمات المرور', en: 'An attack that encrypts passwords' }, { ar: 'هجوم يُعطّل خوادم المصادقة', en: 'An attack that disables authentication servers' }],
        correct: 1, expAr: 'هجوم القاموس يستخدم قائمة كلمات مرور شائعة ومسربة لتجربتها بدلاً من التجربة العشوائية الكاملة.', expEn: 'A dictionary attack uses a list of common and leaked passwords to try instead of fully random guessing.' },
      { type: 'mc', qAr: 'ما هي "قائمة الكلمات" (Wordlist) في سياق اختبار كلمات المرور؟', qEn: 'What is a "wordlist" in the context of password testing?',
        options: [{ ar: 'قاموس اللغة العربية', en: 'An Arabic language dictionary' }, { ar: 'ملف يحتوي على قائمة من كلمات المرور المحتملة للتجربة', en: 'A file containing a list of potential passwords to try' }, { ar: 'قائمة بأسماء المستخدمين المسجلين', en: 'A list of registered usernames' }, { ar: 'بروتوكول لإدارة كلمات المرور', en: 'A protocol for managing passwords' }],
        correct: 1, expAr: 'Wordlist ملف نصي يحتوي على آلاف أو ملايين كلمات المرور الشائعة المسربة للاختبار.', expEn: 'A wordlist is a text file containing thousands or millions of common and leaked passwords to test against.' },
      { type: 'tf', qAr: 'استخدام كلمة مرور طويلة ومعقدة يجعل هجوم القوة الغاشمة أصعب بشكل كبير.', qEn: 'Using a long and complex password makes brute force attacks significantly harder.',
        correct: true, expAr: 'صحيح — كل حرف إضافي يضاعف عدد التوليفات المحتملة بشكل أسي مما يجعل الاختراق مستحيلاً عملياً.', expEn: 'True — each additional character exponentially multiplies possible combinations, making cracking practically impossible.' },
      { type: 'mc', qAr: 'ما هو "تحديد المعدل" (Rate Limiting) وكيف يحمي من هجمات Brute Force؟', qEn: 'What is "rate limiting" and how does it protect against brute force attacks?',
        options: [{ ar: 'تشفير طلبات المصادقة', en: 'Encrypting authentication requests' }, { ar: 'تحديد عدد محاولات تسجيل الدخول في فترة زمنية معينة', en: 'Limiting the number of login attempts within a time period' }, { ar: 'منع المستخدمين من تغيير كلمات مرورهم', en: 'Preventing users from changing their passwords' }, { ar: 'مراقبة استخدام النطاق الترددي', en: 'Monitoring bandwidth usage' }],
        correct: 1, expAr: 'Rate Limiting يحد من عدد محاولات تسجيل الدخول خلال فترة زمنية، مما يُعيق هجمات Brute Force.', expEn: 'Rate limiting restricts the number of login attempts within a time window, blocking brute force attacks.' },
      { type: 'mc', qAr: 'أي من التالي يُعدّ كلمة مرور قوية؟', qEn: 'Which of the following is considered a strong password?',
        options: [{ ar: 'password123', en: 'password123' }, { ar: 'محمد1990', en: 'محمد1990' }, { ar: 'qwerty', en: 'qwerty' }, { ar: 'X#9kL$mN2!pQ', en: 'X#9kL$mN2!pQ' }],
        correct: 3, expAr: 'كلمة مرور قوية تجمع أحرفاً كبيرة وصغيرة وأرقاماً ورموزاً وتكون طويلة (12+ حرفاً).', expEn: 'A strong password combines uppercase, lowercase, numbers, and symbols, and is long (12+ characters).' },
      { type: 'tf', qAr: 'المصادقة الثنائية (2FA) يمكنها إيقاف هجوم Brute Force حتى لو اكتشف المهاجم كلمة المرور.', qEn: '2FA can stop a brute force attack even if the attacker discovers the password.',
        correct: true, expAr: 'صحيح — 2FA يتطلب عاملاً ثانياً (مثل رمز SMS) مما يُوقف المهاجم حتى مع معرفة كلمة المرور.', expEn: 'True — 2FA requires a second factor (like SMS code), stopping the attacker even if the password is known.' },
      { type: 'mapping', qAr: 'طابق كل مفهوم بتعريفه:', qEn: 'Match each concept to its definition:',
        pairs: [
          { leftAr: 'Brute Force', leftEn: 'Brute Force', rightAr: 'تجربة كل التوليفات الممكنة', rightEn: 'Trying all possible combinations' },
          { leftAr: 'Dictionary Attack', leftEn: 'Dictionary Attack', rightAr: 'استخدام قائمة كلمات مرور شائعة', rightEn: 'Using a list of common passwords' },
          { leftAr: 'Rate Limiting', leftEn: 'Rate Limiting', rightAr: 'تحديد محاولات تسجيل الدخول', rightEn: 'Limiting login attempts' },
          { leftAr: 'Wordlist', leftEn: 'Wordlist', rightAr: 'ملف يحتوي كلمات مرور للاختبار', rightEn: 'File containing passwords to test' },
        ],
        expAr: 'هذه المفاهيم أساسية لفهم هجمات كلمات المرور والحماية منها.', expEn: 'These concepts are fundamental to understanding password attacks and how to defend against them.' },
      { type: 'mc', qAr: 'ما هو حشو البيانات (Credential Stuffing)؟', qEn: 'What is credential stuffing?',
        options: [{ ar: 'هجوم يُجرب كلمات مرور عشوائية', en: 'An attack trying random passwords' }, { ar: 'هجوم يستخدم بيانات تسجيل دخول مسربة من مواقع أخرى', en: 'An attack using credentials leaked from other websites' }, { ar: 'تشفير بيانات المستخدم في قاعدة البيانات', en: 'Encrypting user data in a database' }, { ar: 'هجوم يستهدف قواعد البيانات مباشرةً', en: 'An attack targeting databases directly' }],
        correct: 1, expAr: 'Credential Stuffing يستخدم أسماء مستخدمين وكلمات مرور مسربة من خروقات بيانات سابقة لاختبارها على مواقع أخرى.', expEn: 'Credential stuffing uses usernames and passwords leaked from previous data breaches to test them on other websites.' },
      { type: 'tf', qAr: 'استخدام نفس كلمة المرور على مواقع متعددة يزيد من خطر نجاح هجوم Credential Stuffing.', qEn: 'Using the same password on multiple sites increases the risk of a successful credential stuffing attack.',
        correct: true, expAr: 'صحيح — إذا سُرّبت كلمة المرور من موقع واحد، تصبح جميع حساباتك على مواقع أخرى في خطر.', expEn: 'True — if your password leaks from one site, all your accounts on other sites using the same password are at risk.' },
      { type: 'mc', qAr: 'ما أفضل طريقة لإدارة كلمات مرور قوية ومختلفة لكل موقع؟', qEn: 'What is the best way to manage strong unique passwords for each site?',
        options: [{ ar: 'كتابتها على ورقة', en: 'Writing them on paper' }, { ar: 'استخدام كلمة مرور واحدة لجميع المواقع', en: 'Using one password for all sites' }, { ar: 'استخدام مدير كلمات المرور (Password Manager)', en: 'Using a Password Manager' }, { ar: 'حفظها في ملف نصي على الجهاز', en: 'Storing them in a text file on your device' }],
        correct: 2, expAr: 'مدير كلمات المرور يُولّد ويُخزّن كلمات مرور قوية ومختلفة لكل موقع بأمان.', expEn: 'A password manager generates and securely stores strong unique passwords for every site.' },
      { type: 'mc', qAr: 'ما هو "الملح" (Salt) في سياق تخزين كلمات المرور؟', qEn: 'What is a "salt" in the context of password storage?',
        options: [{ ar: 'نوع من التشفير المتماثل', en: 'A type of symmetric encryption' }, { ar: 'بيانات عشوائية تُضاف لكلمة المرور قبل تجزئتها', en: 'Random data added to a password before hashing it' }, { ar: 'مفتاح تشفير ثابت لجميع كلمات المرور', en: 'A fixed encryption key for all passwords' }, { ar: 'كلمة مرور احتياطية', en: 'A backup password' }],
        correct: 1, expAr: 'Salt بيانات عشوائية فريدة تُضاف لكل كلمة مرور قبل التجزئة لمنع هجمات Rainbow Table.', expEn: 'Salt is unique random data added to each password before hashing to prevent Rainbow Table attacks.' },
      { type: 'tf', qAr: 'كلما زاد طول كلمة المرور، كلما طالت مدة هجوم القوة الغاشمة بشكل أسي.', qEn: 'The longer the password, the longer a brute force attack takes, exponentially.',
        correct: true, expAr: 'صحيح — إضافة حرف واحد تُضاعف عدد التوليفات الممكنة أسياً (بحجم مجموعة الأحرف المستخدمة).', expEn: 'True — adding one character multiplies possible combinations exponentially (by the size of the character set used).' },
      { type: 'mc', qAr: 'أي من التالي يُساعد في الحماية من هجمات Brute Force على صفحات تسجيل الدخول؟', qEn: 'Which of the following helps protect login pages from brute force attacks?',
        options: [{ ar: 'إخفاء رقم المنفذ', en: 'Hiding the port number' }, { ar: 'تشفير صفحة تسجيل الدخول', en: 'Encrypting the login page' }, { ar: 'CAPTCHA والقفل التلقائي للحساب بعد محاولات فاشلة متعددة', en: 'CAPTCHA and automatic account lockout after multiple failed attempts' }, { ar: 'استخدام HTTPS فقط', en: 'Using HTTPS only' }],
        correct: 2, expAr: 'CAPTCHA يتحقق أن المستخدم إنسان، والقفل التلقائي يُوقف المحاولات المتكررة — معاً يُوقفان Brute Force.', expEn: 'CAPTCHA verifies a human user, and account lockout stops repeated attempts — together they stop brute force attacks.' },
    ],
  },
  {
    id: 16, titleAr: 'مختبر الطرفية', titleEn: 'Terminal Lab',
    color: 'bg-emerald-100 text-emerald-800', accent: 'emerald',
    questions: [
      { type: 'mc', qAr: 'في مختبر الطرفية، ما الأمر المستخدم لعرض محتويات المجلد الحالي؟', qEn: 'In the terminal lab, which command is used to list the current directory contents?',
        options: [{ ar: 'dir', en: 'dir' }, { ar: 'show', en: 'show' }, { ar: 'list', en: 'list' }, { ar: 'ls', en: 'ls' }],
        correct: 3, expAr: 'ls هو أمر Linux الأساسي لعرض محتويات المجلد.', expEn: 'ls is the basic Linux command to display directory contents.' },
      { type: 'tf', qAr: 'الأمر "cd .." يُعيدك إلى المجلد الأب.', qEn: 'The command "cd .." takes you back to the parent directory.',
        correct: true, expAr: 'صحيح — .. يمثل المجلد الأب في نظام الملفات.', expEn: 'True — .. represents the parent directory in the file system.' },
      { type: 'mc', qAr: 'ما الأمر الذي يُنشئ ملفاً فارغاً جديداً في Linux؟', qEn: 'Which command creates a new empty file in Linux?',
        options: [{ ar: 'new', en: 'new' }, { ar: 'create', en: 'create' }, { ar: 'touch', en: 'touch' }, { ar: 'make', en: 'make' }],
        correct: 2, expAr: 'touch ينشئ ملفاً فارغاً جديداً أو يُحدّث وقت تعديل ملف موجود.', expEn: 'touch creates a new empty file or updates the modification time of an existing file.' },
      { type: 'mc', qAr: 'ما الأمر المستخدم لنقل ملف من مكان لآخر في Linux؟', qEn: 'What command is used to move a file from one location to another in Linux?',
        options: [{ ar: 'cp', en: 'cp' }, { ar: 'transfer', en: 'transfer' }, { ar: 'mv', en: 'mv' }, { ar: 'shift', en: 'shift' }],
        correct: 2, expAr: 'mv (move) ينقل الملف إلى المسار الجديد، ويمكن استخدامه أيضاً لإعادة تسميته.', expEn: 'mv (move) transfers the file to a new path and can also be used to rename it.' },
      { type: 'tf', qAr: 'الأمر "ls -l" يعرض تفاصيل إضافية عن الملفات مثل الصلاحيات والحجم.', qEn: 'The command "ls -l" displays additional details about files like permissions and size.',
        correct: true, expAr: 'صحيح — ls -l يعرض القائمة التفصيلية (Long listing) مع الصلاحيات والحجم والتاريخ.', expEn: 'True — ls -l shows the long listing with permissions, size, and date for each file.' },
      { type: 'mc', qAr: 'ما وظيفة الأمر "echo" في الطرفية؟', qEn: 'What does the "echo" command do in the terminal?',
        options: [{ ar: 'يُنشئ نسخة احتياطية من الملف', en: 'Creates a backup of a file' }, { ar: 'يطبع نصاً أو قيمة متغير على الطرفية', en: 'Prints text or a variable value to the terminal' }, { ar: 'يُشغّل سكريبت من ملف', en: 'Runs a script from a file' }, { ar: 'يفتح محرر النصوص', en: 'Opens a text editor' }],
        correct: 1, expAr: 'echo يطبع النص أو قيمة المتغير على الطرفية، ويُستخدم أيضاً لكتابة النص في ملفات.', expEn: 'echo prints text or variable values to the terminal, and can also write text to files.' },
      { type: 'mc', qAr: 'ما معنى الصلاحية "rwx" في نظام Linux؟', qEn: 'What does "rwx" mean in Linux permissions?',
        options: [{ ar: 'Read, Write, eXecute — قراءة وكتابة وتنفيذ', en: 'Read, Write, eXecute — read, write, and execute' }, { ar: 'Run, Write, eXchange', en: 'Run, Write, eXchange' }, { ar: 'Restrict, Write, eXpand', en: 'Restrict, Write, eXpand' }, { ar: 'Root, Write, eXtract', en: 'Root, Write, eXtract' }],
        correct: 0, expAr: 'rwx تمثل ثلاث صلاحيات: Read (قراءة) وWrite (كتابة) وeXecute (تنفيذ).', expEn: 'rwx represents three permissions: Read, Write, and eXecute.' },
      { type: 'mapping', qAr: 'طابق كل أمر بوظيفته في مختبر الطرفية:', qEn: 'Match each terminal lab command to its function:',
        pairs: [
          { leftAr: 'touch', leftEn: 'touch', rightAr: 'إنشاء ملف فارغ', rightEn: 'Create an empty file' },
          { leftAr: 'mv', leftEn: 'mv', rightAr: 'نقل أو إعادة تسمية ملف', rightEn: 'Move or rename a file' },
          { leftAr: 'echo', leftEn: 'echo', rightAr: 'طباعة نص على الطرفية', rightEn: 'Print text to terminal' },
          { leftAr: 'chmod', leftEn: 'chmod', rightAr: 'تغيير صلاحيات الملف', rightEn: 'Change file permissions' },
        ],
        expAr: 'هذه الأوامر تُشكّل الأساس العملي للعمل في بيئة الطرفية.', expEn: 'These commands form the practical foundation for working in a terminal environment.' },
      { type: 'tf', qAr: 'الأمر "rm -r" يحذف المجلدات وكل محتوياتها بشكل متكرر.', qEn: 'The command "rm -r" deletes directories and all their contents recursively.',
        correct: true, expAr: 'صحيح — الخيار -r يجعل الحذف متكرراً (Recursive) ليطال المجلدات الفرعية والملفات داخلها.', expEn: 'True — the -r flag makes deletion recursive, affecting subdirectories and all files inside them.' },
      { type: 'mc', qAr: 'ما الرمز المستخدم لتحويل مخرجات أمر إلى مدخلات أمر آخر (Pipe)؟', qEn: 'What symbol is used to pipe the output of one command as input to another?',
        options: [{ ar: '>', en: '>' }, { ar: '&', en: '&' }, { ar: '|', en: '|' }, { ar: '>>', en: '>>' }],
        correct: 2, expAr: 'رمز | (Pipe) يُمرّر مخرجات الأمر الأول كمدخلات للأمر الثاني، مثل: ls | grep txt', expEn: 'The | (pipe) symbol passes the output of the first command as input to the second, e.g., ls | grep txt' },
      { type: 'mc', qAr: 'ما وظيفة الرمز ">" في الطرفية؟', qEn: 'What does the ">" symbol do in the terminal?',
        options: [{ ar: 'يُقارن بين قيمتين', en: 'Compares two values' }, { ar: 'يُحوّل مخرجات أمر إلى ملف (يستبدل المحتوى)', en: 'Redirects command output to a file (replaces content)' }, { ar: 'يُشغّل الأمر كمسؤول', en: 'Runs the command as administrator' }, { ar: 'يعرض سجل الأوامر', en: 'Shows command history' }],
        correct: 1, expAr: '> يُعيد توجيه المخرجات إلى ملف ويستبدل محتواه، بينما >> يُضيف إلى آخر الملف.', expEn: '> redirects output to a file replacing its content, while >> appends to the end of the file.' },
      { type: 'tf', qAr: 'الأمر "history" يعرض قائمة بالأوامر السابقة التي نفّذتها في الطرفية.', qEn: 'The "history" command displays a list of previously executed commands in the terminal.',
        correct: true, expAr: 'صحيح — history يعرض سجل الأوامر التي نُفّذت في الجلسة الحالية والسابقة.', expEn: 'True — history shows the record of commands executed in the current and previous sessions.' },
      { type: 'mc', qAr: 'كيف يمكنك إلغاء أمر قيد التشغيل في الطرفية؟', qEn: 'How can you cancel a running command in the terminal?',
        options: [{ ar: 'Ctrl + Z', en: 'Ctrl + Z' }, { ar: 'Ctrl + S', en: 'Ctrl + S' }, { ar: 'Ctrl + X', en: 'Ctrl + X' }, { ar: 'Ctrl + C', en: 'Ctrl + C' }],
        correct: 3, expAr: 'Ctrl + C يُرسل إشارة SIGINT لإنهاء العملية الجارية في الطرفية.', expEn: 'Ctrl + C sends the SIGINT signal to terminate the currently running process in the terminal.' },
      { type: 'mc', qAr: 'ما الأمر الذي يعرض أول 10 أسطر من ملف؟', qEn: 'Which command displays the first 10 lines of a file?',
        options: [{ ar: 'top', en: 'top' }, { ar: 'first', en: 'first' }, { ar: 'head', en: 'head' }, { ar: 'start', en: 'start' }],
        correct: 2, expAr: 'head يعرض أول 10 أسطر افتراضياً، ويمكن تحديد عدد مختلف مثل head -20 للأول 20 سطراً.', expEn: 'head displays the first 10 lines by default; a different count can be specified like head -20 for 20 lines.' },
      { type: 'tf', qAr: 'يمكن استخدام "grep" لتصفية نتائج أمر آخر باستخدام Pipe.', qEn: 'You can use "grep" to filter results of another command using a pipe.',
        correct: true, expAr: 'صحيح — مثال: ls -l | grep ".txt" يعرض فقط الملفات التي تحتوي ".txt" في اسمها.', expEn: 'True — example: ls -l | grep ".txt" displays only files containing ".txt" in their name.' },
    ],
  },
  {
    id: 17, titleAr: 'كيف يعمل VPN؟', titleEn: 'How VPN Works',
    color: 'bg-indigo-100 text-indigo-700', accent: 'indigo',
    questions: [
      { type: 'mc', qAr: 'ماذا يعني اختصار VPN؟', qEn: 'What does VPN stand for?',
        options: [{ ar: 'Virtual Private Network', en: 'Virtual Private Network' }, { ar: 'Virtual Protected Node', en: 'Virtual Protected Node' }, { ar: 'Verified Proxy Network', en: 'Verified Proxy Network' }, { ar: 'Variable Packet Navigator', en: 'Variable Packet Navigator' }],
        correct: 0, expAr: 'VPN = Virtual Private Network — الشبكة الافتراضية الخاصة.', expEn: 'VPN stands for Virtual Private Network.' },
      { type: 'tf', qAr: 'عند استخدام VPN، يرى ISP وجهتك الحقيقية على الإنترنت.', qEn: 'When using a VPN, the ISP sees your real internet destination.',
        correct: false, expAr: 'خطأ — ISP يرى عنوان IP خادم VPN فقط، وليس الموقع الحقيقي الذي تزوره.', expEn: 'False — the ISP only sees the VPN server IP address, not the actual website you visit.' },
      { type: 'mc', qAr: 'ما الذي يراه ISP عند استخدامك VPN؟', qEn: 'What does the ISP see when you use a VPN?',
        options: [{ ar: 'الموقع الحقيقي الذي تزوره', en: 'The real website you visit' }, { ar: 'محتوى رسائلك المشفرة', en: 'The content of your encrypted messages' }, { ar: 'عنوان IP خادم VPN فقط', en: 'Only the VPN server IP address' }, { ar: 'لا يرى أي شيء', en: 'Nothing at all' }],
        correct: 2, expAr: 'ISP يرى فقط الاتصال بخادم VPN — الوجهة الحقيقية مخفية بالتشفير.', expEn: 'The ISP only sees a connection to the VPN server — the real destination is hidden by encryption.' },
      { type: 'mc', qAr: 'ما مسار الطلب عند استخدام VPN؟', qEn: 'What is the request path when using a VPN?',
        options: [{ ar: 'جهاز → موقع مباشرة', en: 'Device → Website directly' }, { ar: 'جهاز → ISP → موقع', en: 'Device → ISP → Website' }, { ar: 'جهاز → VPN → ISP → موقع', en: 'Device → VPN → ISP → Website' }, { ar: 'جهاز → DNS → موقع', en: 'Device → DNS → Website' }],
        correct: 2, expAr: 'VPN يُدرج خطوة إضافية: جهاز → خادم VPN → ISP → الموقع. ISP يرى VPN لا الموقع.', expEn: 'VPN inserts an extra hop: Device → VPN server → ISP → Website. The ISP sees VPN, not the website.' },
      { type: 'tf', qAr: 'خادم VPN نفسه يعرف عنوان IP الحقيقي للمستخدم.', qEn: 'The VPN server itself knows the user\'s real IP address.',
        correct: true, expAr: 'صحيح — خادم VPN يعرف هويتك لأن الاتصال يبدأ منك إليه مباشرةً.', expEn: 'True — the VPN server knows your identity because the connection originates directly from you to it.' },
      { type: 'mc', qAr: 'أي بروتوكول VPN حديث معروف بسرعته وأمانه؟', qEn: 'Which modern VPN protocol is known for its speed and security?',
        options: [{ ar: 'FTP', en: 'FTP' }, { ar: 'WireGuard', en: 'WireGuard' }, { ar: 'HTTP', en: 'HTTP' }, { ar: 'SMTP', en: 'SMTP' }],
        correct: 1, expAr: 'WireGuard بروتوكول VPN حديث وسريع يُستخدم على نطاق واسع بسبب بساطته وأمانه العالي.', expEn: 'WireGuard is a modern fast VPN protocol widely used for its simplicity and high security.' },
      { type: 'mapping', qAr: 'طابق كل مفهوم VPN بوصفه:', qEn: 'Match each VPN concept to its description:',
        pairs: [
          { leftAr: 'خادم VPN', leftEn: 'VPN Server', rightAr: 'الوسيط الذي تمر عبره الاتصالات', rightEn: 'The intermediary through which connections pass' },
          { leftAr: 'التشفير', leftEn: 'Encryption', rightAr: 'يمنع ISP من قراءة البيانات', rightEn: 'Prevents ISP from reading the data' },
          { leftAr: 'ISP', leftEn: 'ISP', rightAr: 'يرى VPN فقط لا الوجهة الحقيقية', rightEn: 'Only sees the VPN, not the real destination' },
          { leftAr: 'Tor', leftEn: 'Tor', rightAr: 'يمرر عبر 3 عقد مشفرة', rightEn: 'Routes through 3 encrypted nodes' },
        ],
        expAr: 'VPN يعمل بإخفاء الوجهة عبر خادم وسيط وتشفير الاتصال.', expEn: 'VPN works by hiding the destination via an intermediary server and encrypting the connection.' },
      { type: 'tf', qAr: 'استخدام VPN يجعل المستخدم مجهول الهوية تماماً على الإنترنت.', qEn: 'Using a VPN makes the user completely anonymous on the internet.',
        correct: false, expAr: 'خطأ — VPN يغير طريقة ظهور الاتصال فقط. الحسابات والسلوك وبصمة المتصفح تكشف هويتك.', expEn: 'False — VPN only changes how the connection appears. Accounts, behavior, and browser fingerprints still reveal your identity.' },
      { type: 'mc', qAr: 'لماذا قد يحجب ISP موقعاً معيناً؟', qEn: 'Why might an ISP block a specific website?',
        options: [{ ar: 'لأن الموقع يستخدم HTTPS', en: 'Because the site uses HTTPS' }, { ar: 'لأن عنوان IP الموقع مدرج في قائمة حجب', en: 'Because the site IP is on a block list' }, { ar: 'لأن الموقع سريع جداً', en: 'Because the site is too fast' }, { ar: 'لأن الموقع يستخدم DNS', en: 'Because the site uses DNS' }],
        correct: 1, expAr: 'ISP يُطابق عنوان IP الوجهة بقائمة الحجب — إذا تطابق، يُرفض الاتصال.', expEn: 'The ISP matches the destination IP against a block list — if matched, the connection is rejected.' },
      { type: 'mc', qAr: 'كيف يُساعد VPN في تجاوز حجب ISP؟', qEn: 'How does a VPN help bypass ISP blocking?',
        options: [{ ar: 'يُبطئ الاتصال ليتجاوز الفحص', en: 'It slows the connection to bypass inspection' }, { ar: 'يحذف قائمة الحجب من خادم ISP', en: 'It deletes the block list from the ISP server' }, { ar: 'يُخفي الوجهة الحقيقية — ISP يرى VPN لا الموقع المحجوب', en: 'It hides the real destination — ISP sees VPN not the blocked site' }, { ar: 'يُشفّر ISP ويجعله غير قادر على العمل', en: 'It encrypts the ISP and makes it unable to function' }],
        correct: 2, expAr: 'VPN يُخفي الوجهة الحقيقية — ISP يرى خادم VPN الذي غالباً غير محجوب.', expEn: 'VPN hides the real destination — the ISP sees the VPN server which is usually not on the block list.' },
      { type: 'tf', qAr: 'VPN يحميك من التتبع عبر ملفات تعريف الارتباط (Cookies) في المتصفح.', qEn: 'A VPN protects you from tracking via browser cookies.',
        correct: false, expAr: 'خطأ — VPN يُخفي IP فقط. Cookies وبصمة المتصفح مستقلة عن IP وتستمر في التتبع.', expEn: 'False — VPN only hides the IP. Cookies and browser fingerprints are independent of IP and continue tracking.' },
      { type: 'mc', qAr: 'ما الفرق الرئيسي بين VPN و Tor؟', qEn: 'What is the main difference between VPN and Tor?',
        options: [{ ar: 'VPN يُشفّر بينما Tor لا يُشفّر', en: 'VPN encrypts while Tor does not' }, { ar: 'Tor أسرع بكثير من VPN', en: 'Tor is much faster than VPN' }, { ar: 'Tor يُمرّر عبر عقد متعددة مجهولة بينما VPN يُمرّر عبر خادم واحد', en: 'Tor routes through multiple anonymous nodes while VPN routes through a single server' }, { ar: 'لا فرق بينهما', en: 'There is no difference between them' }],
        correct: 2, expAr: 'Tor يُمرّر الاتصال عبر 3 عقد مشفرة (أبطأ، لكن أكثر خصوصية). VPN يعبر خادماً واحداً (أسرع).', expEn: 'Tor routes through 3 encrypted nodes (slower, more private). VPN goes through a single server (faster).' },
      { type: 'tf', qAr: 'المزود التجاري لـ VPN يمكنه نظرياً الاطلاع على نشاط المستخدم وتسليمه للجهات القانونية.', qEn: 'A commercial VPN provider can theoretically view user activity and share it with legal authorities.',
        correct: true, expAr: 'صحيح — مزود VPN يرى كل ما تفعله. "سياسة عدم الاحتفاظ بالسجلات" لا تُطبَّق دائماً.', expEn: 'True — the VPN provider sees everything you do. "No-log policies" are not always enforced.' },
      { type: 'mc', qAr: 'أي من التالي يعتبر قيداً حقيقياً لـ VPN؟', qEn: 'Which of the following is a real limitation of VPN?',
        options: [{ ar: 'لا يمكنه تشفير الاتصالات', en: 'It cannot encrypt connections' }, { ar: 'تسجيل الدخول لحسابات الإنترنت يكشف هويتك بصرف النظر عن VPN', en: 'Logging into internet accounts reveals your identity regardless of VPN' }, { ar: 'لا يعمل مع HTTPS', en: 'It does not work with HTTPS' }, { ar: 'يوقف عمل الجدار الناري', en: 'It disables the firewall' }],
        correct: 1, expAr: 'الحسابات (Google، Twitter...) تعرف هويتك سواء استخدمت VPN أم لا — تسجيل الدخول ينقض الإخفاء.', expEn: 'Accounts (Google, Twitter...) know your identity whether or not you use VPN — logging in defeats the anonymity.' },
      { type: 'mc', qAr: 'ما هي وظيفة التشفير في اتصال VPN؟', qEn: 'What is the role of encryption in a VPN connection?',
        options: [{ ar: 'يُسرّع الاتصال بضغط البيانات', en: 'Speeds up the connection by compressing data' }, { ar: 'يمنع ISP والمتطفلين من قراءة محتوى الاتصال', en: 'Prevents ISP and eavesdroppers from reading the connection content' }, { ar: 'يُوثّق هوية المستخدم', en: 'Authenticates the user\'s identity' }, { ar: 'يُحسّن جودة البث', en: 'Improves streaming quality' }],
        correct: 1, expAr: 'التشفير يجعل البيانات المنقولة غير مقروءة لأي طرف يعترضها — بما في ذلك ISP.', expEn: 'Encryption makes transmitted data unreadable to any intercepting party — including the ISP.' },
    ],
  },
  {
    id: 18, titleAr: 'إخفاء IP وتدوير العناوين', titleEn: 'IP Masking & Rotation',
    color: 'bg-violet-100 text-violet-700', accent: 'violet',
    questions: [
      { type: 'mc', qAr: 'ما هو إخفاء IP (IP Masking)؟', qEn: 'What is IP masking?',
        options: [{ ar: 'حذف عنوان IP من الجهاز', en: 'Deleting the IP address from the device' }, { ar: 'إخفاء عنوان IP الحقيقي بإظهار عنوان وسيط بدلاً منه', en: 'Hiding the real IP by showing an intermediary address instead' }, { ar: 'تشفير عنوان IP فقط', en: 'Encrypting only the IP address' }, { ar: 'تغيير MAC Address', en: 'Changing the MAC address' }],
        correct: 1, expAr: 'IP Masking يُخفي عنوان IP الحقيقي باستخدام وسيط (Proxy أو VPN) يظهر عنوانه بدلاً من عنوانك.', expEn: 'IP masking hides the real IP by using a proxy or VPN whose address appears instead of yours.' },
      { type: 'tf', qAr: 'تغيير عنوان IP يكفي لضمان الإخفاء التام على الإنترنت.', qEn: 'Changing your IP address is sufficient to guarantee full anonymity online.',
        correct: false, expAr: 'خطأ — الحسابات والسلوك وبصمة المتصفح والتوقيت تكشف هويتك حتى مع تغيير IP.', expEn: 'False — accounts, behavior, browser fingerprints, and timing reveal your identity even with a different IP.' },
      { type: 'mc', qAr: 'ما هو تدوير IP (IP Rotation)؟', qEn: 'What is IP rotation?',
        options: [{ ar: 'تغيير عنوان IP بشكل دوري لكل طلب أو فترة', en: 'Changing the IP address periodically for each request or time period' }, { ar: 'استخدام نفس IP باستمرار', en: 'Using the same IP continuously' }, { ar: 'مشاركة IP مع مستخدمين آخرين', en: 'Sharing IP with other users' }, { ar: 'حجز نطاق من عناوين IP', en: 'Reserving a range of IP addresses' }],
        correct: 0, expAr: 'IP Rotation يُغير عنوان IP تلقائياً بين الطلبات أو الفترات لتصعيب التتبع.', expEn: 'IP rotation automatically changes the IP address between requests or time periods to make tracking harder.' },
      { type: 'mc', qAr: 'ما هي "بصمة المتصفح" (Browser Fingerprint)؟', qEn: 'What is a "browser fingerprint"?',
        options: [{ ar: 'كلمة مرور المتصفح', en: 'The browser password' }, { ar: 'مجموعة خصائص فريدة للمتصفح تُستخدم للتعرف على المستخدم', en: 'A unique set of browser characteristics used to identify a user' }, { ar: 'سجل مواقع الزيارة', en: 'History of visited sites' }, { ar: 'الإصدار الأمني للمتصفح', en: 'Browser security version' }],
        correct: 1, expAr: 'Browser Fingerprint مجموعة خصائص فريدة (دقة الشاشة، اللغة، الإضافات...) تُعرّف المستخدم حتى بدون Cookies.', expEn: 'Browser fingerprint is a unique set of characteristics (screen resolution, language, plugins...) that identifies a user even without cookies.' },
      { type: 'tf', qAr: 'في التحقيق الجنائي الرقمي، يعتمد المحقق على IP فقط لتحديد هوية المستخدم.', qEn: 'In digital forensic investigation, investigators rely solely on IP to identify a user.',
        correct: false, expAr: 'خطأ — المحقق يربط الأنماط: الحسابات والتوقيت والسلوك وبصمة المتصفح معاً.', expEn: 'False — investigators correlate patterns: accounts, timing, behavior, and browser fingerprints together.' },
      { type: 'mc', qAr: 'ما هو Proxy Server وكيف يختلف عن VPN؟', qEn: 'What is a Proxy Server and how does it differ from VPN?',
        options: [{ ar: 'هما نفس الشيء تماماً', en: 'They are exactly the same' }, { ar: 'Proxy يُغير IP فقط دون تشفير، VPN يُشفّر الاتصال كاملاً', en: 'Proxy only changes IP without encryption, VPN encrypts the full connection' }, { ar: 'VPN يُغير IP فقط، Proxy يُشفّر', en: 'VPN only changes IP, Proxy encrypts' }, { ar: 'كلاهما لا يُشفّران البيانات', en: 'Neither encrypts data' }],
        correct: 1, expAr: 'Proxy يُغير IP لكن لا يُشفّر الاتصال — أقل أماناً. VPN يُغير IP ويُشفّر كل البيانات.', expEn: 'Proxy changes the IP but does not encrypt traffic — less secure. VPN changes IP and encrypts all data.' },
      { type: 'mapping', qAr: 'طابق كل مصطلح بتعريفه:', qEn: 'Match each term to its definition:',
        pairs: [
          { leftAr: 'IP Masking', leftEn: 'IP Masking', rightAr: 'إخفاء IP الحقيقي بوسيط', rightEn: 'Hiding real IP via intermediary' },
          { leftAr: 'IP Rotation', leftEn: 'IP Rotation', rightAr: 'تغيير IP بين الطلبات', rightEn: 'Changing IP between requests' },
          { leftAr: 'Browser Fingerprint', leftEn: 'Browser Fingerprint', rightAr: 'خصائص فريدة للمتصفح', rightEn: 'Unique browser characteristics' },
          { leftAr: 'Proxy', leftEn: 'Proxy', rightAr: 'وسيط يُغير IP دون تشفير', rightEn: 'Intermediary that changes IP without encryption' },
        ],
        expAr: 'هذه التقنيات تُستخدم لتقليل الأثر الرقمي لكنها لا تضمن الإخفاء التام.', expEn: 'These techniques reduce digital footprint but do not guarantee full anonymity.' },
      { type: 'mc', qAr: 'ما معنى "الأثر الرقمي" (Digital Footprint)؟', qEn: 'What is a "digital footprint"?',
        options: [{ ar: 'حجم الملفات المخزنة على الجهاز', en: 'Size of files stored on the device' }, { ar: 'مجموع البيانات التي يتركها المستخدم عبر نشاطه على الإنترنت', en: 'The total data a user leaves behind through internet activity' }, { ar: 'عدد المواقع التي تزورها يومياً', en: 'Number of websites visited daily' }, { ar: 'سرعة الإنترنت المستخدمة', en: 'Internet speed used' }],
        correct: 1, expAr: 'الأثر الرقمي كل ما تتركه على الإنترنت: IP، حسابات، سلوك، ملفات، تعليقات، وغيرها.', expEn: 'Digital footprint is everything you leave online: IP, accounts, behavior, files, comments, and more.' },
      { type: 'tf', qAr: 'التحقيق الجنائي الرقمي يمكنه كشف نفس المستخدم حتى لو غيّر IP في كل طلب.', qEn: 'Digital forensic investigation can identify the same user even if they change IP with every request.',
        correct: true, expAr: 'صحيح — ربط الحسابات والتوقيت والسلوك يكشف هوية المستخدم بصرف النظر عن تغيير IP.', expEn: 'True — correlating accounts, timing, and behavior reveals user identity regardless of IP changes.' },
      { type: 'mc', qAr: 'أي من التالي يُعدّ دليلاً جنائياً رقمياً على هوية المستخدم بصرف النظر عن IP؟', qEn: 'Which of the following serves as digital forensic evidence of user identity regardless of IP?',
        options: [{ ar: 'سرعة الإنترنت', en: 'Internet speed' }, { ar: 'نفس الحساب المستخدم في جلسات متعددة', en: 'Same account used across multiple sessions' }, { ar: 'نوع الكابل المستخدم', en: 'Type of cable used' }, { ar: 'دقة الشاشة فقط', en: 'Screen resolution only' }],
        correct: 1, expAr: 'نفس الحساب في جلسات بـ IPs مختلفة دليل قاطع على أن نفس الشخص خلف الجلسات جميعاً.', expEn: 'The same account across sessions with different IPs is conclusive evidence that the same person is behind all sessions.' },
      { type: 'mc', qAr: 'ما هي "أنماط السلوك" (Behavioral Patterns) في سياق التحقيق الرقمي؟', qEn: 'What are "behavioral patterns" in the context of digital investigation?',
        options: [{ ar: 'سرعة كتابة المستخدم فقط', en: 'Only the user\'s typing speed' }, { ar: 'أنماط متكررة في النشاط كالتوقيت وتسلسل الأوامر وأسلوب الاستخدام', en: 'Repeated patterns in activity like timing, command sequences, and usage style' }, { ar: 'لون الخلفية المستخدمة في التطبيق', en: 'Background color used in the application' }, { ar: 'عدد الملفات المحذوفة', en: 'Number of deleted files' }],
        correct: 1, expAr: 'الأنماط السلوكية فريدة لكل مستخدم — التوقيت، تسلسل الأنشطة، الأخطاء المتكررة — تُشكّل توقيعاً رقمياً.', expEn: 'Behavioral patterns are unique to each user — timing, activity sequences, repeated errors — form a digital signature.' },
      { type: 'tf', qAr: 'استخدام وضع التصفح الخفي (Incognito) يُخفي عنوان IP عن الموقع الذي تزوره.', qEn: 'Using incognito/private browsing mode hides your IP address from the website you visit.',
        correct: false, expAr: 'خطأ — وضع التصفح الخفي يمنع حفظ السجل محلياً فقط. IP لا يزال مرئياً للموقع وISP.', expEn: 'False — incognito only prevents local history saving. Your IP remains visible to the site and ISP.' },
      { type: 'mc', qAr: 'لماذا لا يضمن Tor الإخفاء التام أيضاً؟', qEn: 'Why doesn\'t Tor guarantee complete anonymity either?',
        options: [{ ar: 'لأنه يستخدم خادماً واحداً فقط', en: 'Because it uses only a single server' }, { ar: 'لا يُشفّر البيانات', en: 'It does not encrypt data' }, { ar: 'عقدة الخروج (Exit Node) يمكنها رؤية حركة غير المشفرة، والحسابات تكشف الهوية', en: 'The exit node can see unencrypted traffic, and accounts still reveal identity' }, { ar: 'لأنه أبطأ من VPN', en: 'Because it is slower than VPN' }],
        correct: 2, expAr: 'عقدة خروج Tor يمكنها رؤية حركة HTTP غير المشفرة. والتسجيل في حسابات يُبطل الإخفاء.', expEn: 'Tor\'s exit node can see unencrypted HTTP traffic. Logging into accounts defeats anonymity.' },
      { type: 'mc', qAr: 'ما الخلاصة الصحيحة عن إخفاء IP؟', qEn: 'What is the correct conclusion about IP masking?',
        options: [{ ar: 'يضمن الإخفاء التام إذا استخدمت VPN وProxy معاً', en: 'Guarantees full anonymity if VPN and Proxy are used together' }, { ar: 'لا يوجد إخفاء تام — IP واحد من أدوات التتبع الكثيرة', en: 'There is no full anonymity — IP is just one of many tracking tools' }, { ar: 'الإخفاء ممكن بحذف الحساب فقط', en: 'Anonymity is achievable by just deleting the account' }, { ar: 'يكفي تغيير IP مرة واحدة', en: 'Changing IP once is sufficient' }],
        correct: 1, expAr: 'IP مجرد أداة تتبع واحدة من بين كثيرة. الإخفاء الحقيقي يتطلب التحكم في كل طبقات الأثر الرقمي.', expEn: 'IP is just one of many tracking tools. Real anonymity requires controlling all layers of digital footprint.' },
    ],
  },
]

// ─── localStorage persistence ─────────────────────────────────────────────────
const LS_KEY = 'web_edu_quiz_v3'

function loadData() {
  try {
    const s = localStorage.getItem(LS_KEY)
    return s ? JSON.parse(s) : DEFAULT_QB
  } catch { return DEFAULT_QB }
}

function saveData(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function blankQuestion(type = 'mc') {
  const base = { type, qAr: '', qEn: '', expAr: '', expEn: '', image: null }
  if (type === 'mc') return { ...base, options: [{ ar: '', en: '' }, { ar: '', en: '' }, { ar: '', en: '' }, { ar: '', en: '' }], correct: 0 }
  if (type === 'tf') return { ...base, correct: true }
  return { ...base, pairs: [{ leftAr: '', leftEn: '', rightAr: '', rightEn: '' }, { leftAr: '', leftEn: '', rightAr: '', rightEn: '' }] }
}

// ─── MappingQuestion (quiz display) ──────────────────────────────────────────
function MappingQuestion({ q, isAr, answer, onChange, submitted }) {
  const shuffledRight = useMemo(() => shuffle(q.pairs.map(p => ({ val: p.rightEn, ar: p.rightAr, en: p.rightEn }))), [q])
  return (
    <div className="space-y-3">
      {q.pairs.map((pair, i) => {
        const userVal = answer?.[i]
        const correct = userVal === pair.rightEn
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-40 shrink-0 bg-slate-100 rounded-lg px-3 py-2 text-sm font-mono font-semibold text-slate-700 text-center">{isAr ? pair.leftAr : pair.leftEn}</div>
            <span className="text-slate-400">→</span>
            <select
              disabled={submitted}
              value={userVal || ''}
              onChange={e => onChange({ ...answer, [i]: e.target.value })}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none transition-colors ${submitted ? (correct ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-red-50 border-red-300 text-red-700') : 'bg-white border-slate-200 text-slate-700 focus:ring-2 focus:ring-indigo-300'}`}
            >
              <option value="">{isAr ? '— اختر —' : '— Select —'}</option>
              {shuffledRight.map(opt => <option key={opt.val} value={opt.val}>{isAr ? opt.ar : opt.en}</option>)}
            </select>
            {submitted && (correct ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />)}
          </div>
        )
      })}
    </div>
  )
}

function isMappingCorrect(q, answer) {
  return answer && q.pairs.every((p, i) => answer[i] === p.rightEn)
}

// ─── Question Editor Modal ────────────────────────────────────────────────────
function QuestionEditor({ isAr, initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial ? JSON.parse(JSON.stringify(initial)) : blankQuestion('mc'))
  const [imgMode, setImgMode] = useState('upload') // 'upload' | 'url'
  const fileRef = useRef()

  function set(path, value) {
    setForm(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const keys = path.split('.')
      let cur = next
      for (let i = 0; i < keys.length - 1; i++) {
        if (keys[i].includes('[')) {
          const [k, idx] = keys[i].replace(']', '').split('[')
          cur = cur[k][parseInt(idx)]
        } else cur = cur[keys[i]]
      }
      const last = keys[keys.length - 1]
      if (last.includes('[')) {
        const [k, idx] = last.replace(']', '').split('[')
        cur[k][parseInt(idx)] = value
      } else cur[last] = value
      return next
    })
  }

  function changeType(t) {
    setForm(prev => ({ ...blankQuestion(t), qAr: prev.qAr, qEn: prev.qEn, expAr: prev.expAr, expEn: prev.expEn, image: prev.image }))
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, image: { ...(f.image || {}), src: ev.target.result, captionAr: f.image?.captionAr || '', captionEn: f.image?.captionEn || '' } }))
    reader.readAsDataURL(file)
  }

  function removeImage() { setForm(f => ({ ...f, image: null })) }

  function addPair() { setForm(f => ({ ...f, pairs: [...f.pairs, { leftAr: '', leftEn: '', rightAr: '', rightEn: '' }] })) }
  function removePair(i) { setForm(f => ({ ...f, pairs: f.pairs.filter((_, idx) => idx !== i) })) }

  function validate() {
    if (form.type === 'mc') {
      if (!form.qAr && !form.qEn && !form.image) return false
      if (form.options.some(o => !o.ar && !o.en)) return false
    }
    if (form.type === 'tf') {
      if (!form.qAr && !form.qEn && !form.image) return false
    }
    if (form.type === 'mapping') {
      if (!form.qAr && !form.qEn && !form.image) return false
      if (form.pairs.length < 2) return false
      if (form.pairs.some(p => (!p.leftAr && !p.leftEn) || (!p.rightAr && !p.rightEn))) return false
    }
    return true
  }

  const labelCls = 'block text-xs font-bold text-slate-500 mb-1'
  const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white'
  const textareaCls = inputCls + ' resize-none'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4" dir="ltr">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-black text-slate-800 text-lg">{initial ? 'Edit Question' : 'Add Question'}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Type */}
          <div>
            <label className={labelCls}>Question Type</label>
            <div className="flex gap-2">
              {[['mc', 'Multiple Choice'], ['tf', 'True / False'], ['mapping', 'Matching']].map(([t, lbl]) => (
                <button key={t} onClick={() => changeType(t)} className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition-colors ${form.type === t ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>{lbl}</button>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Image className="w-4 h-4" /> Question Image (optional)</label>
              <div className="flex gap-1">
                {['upload', 'url'].map(m => (
                  <button key={m} onClick={() => setImgMode(m)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${imgMode === m ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-500 hover:bg-slate-100'}`}>
                    {m === 'upload' ? <><Upload className="w-3 h-3 inline mr-1" />Upload</> : <><Link className="w-3 h-3 inline mr-1" />URL</>}
                  </button>
                ))}
              </div>
            </div>
            {imgMode === 'upload' ? (
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-slate-300 rounded-lg py-3 text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> Click to upload image
                </button>
              </div>
            ) : (
              <input className={inputCls} dir="ltr" placeholder="https://..." value={form.image?.src || ''} onChange={e => setForm(f => ({ ...f, image: { ...(f.image || {}), src: e.target.value, captionAr: f.image?.captionAr || '', captionEn: f.image?.captionEn || '' } }))} />
            )}
            {form.image?.src && (
              <div className="space-y-2">
                <div className="relative">
                  <img src={form.image.src} alt="preview" className="max-h-40 rounded-lg mx-auto border border-slate-200 object-contain" onError={e => e.target.style.display = 'none'} />
                  <button onClick={removeImage} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"><X className="w-3 h-3" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>Caption (Arabic)</label><input className={inputCls} dir="rtl" placeholder="وصف الصورة" value={form.image.captionAr || ''} onChange={e => setForm(f => ({ ...f, image: { ...f.image, captionAr: e.target.value } }))} /></div>
                  <div><label className={labelCls}>Caption (English)</label><input className={inputCls} dir="ltr" placeholder="Image caption" value={form.image.captionEn || ''} onChange={e => setForm(f => ({ ...f, image: { ...f.image, captionEn: e.target.value } }))} /></div>
                </div>
              </div>
            )}
          </div>

          {/* Question text */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Question (Arabic)</label><textarea className={textareaCls} rows={2} dir="rtl" placeholder="نص السؤال بالعربية" value={form.qAr} onChange={e => set('qAr', e.target.value)} /></div>
            <div><label className={labelCls}>Question (English)</label><textarea className={textareaCls} rows={2} dir="ltr" placeholder="Question text in English" value={form.qEn} onChange={e => set('qEn', e.target.value)} /></div>
          </div>

          {/* MC options */}
          {form.type === 'mc' && (
            <div>
              <label className={labelCls}>Options — click the circle to mark as correct</label>
              <div className="space-y-2">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button onClick={() => set('correct', i)} className={`w-7 h-7 rounded-full border-2 shrink-0 flex items-center justify-center text-xs font-black transition-colors ${form.correct === i ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-slate-400 hover:border-emerald-400'}`}>{['A','B','C','D'][i]}</button>
                    <input className={inputCls} dir="rtl" placeholder={`الخيار ${['أ','ب','ج','د'][i]}`} value={opt.ar} onChange={e => { const o = [...form.options]; o[i] = { ...o[i], ar: e.target.value }; setForm(f => ({ ...f, options: o })) }} />
                    <input className={inputCls} dir="ltr" placeholder={`Option ${['A','B','C','D'][i]}`} value={opt.en} onChange={e => { const o = [...form.options]; o[i] = { ...o[i], en: e.target.value }; setForm(f => ({ ...f, options: o })) }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TF */}
          {form.type === 'tf' && (
            <div>
              <label className={labelCls}>Correct Answer</label>
              <div className="flex gap-3">
                {[true, false].map(v => (
                  <button key={String(v)} onClick={() => setForm(f => ({ ...f, correct: v }))} className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-colors ${form.correct === v ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                    {v ? '✅ True / صحيح' : '❌ False / خطأ'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mapping pairs */}
          {form.type === 'mapping' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls}>Matching Pairs</label>
                <button onClick={addPair} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold"><Plus className="w-3.5 h-3.5" /> Add pair</button>
              </div>
              <div className="space-y-2">
                {form.pairs.map((pair, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                    <div className="grid grid-cols-2 gap-1">
                      <input className={inputCls} dir="rtl" placeholder="يسار (عربي)" value={pair.leftAr} onChange={e => { const p = [...form.pairs]; p[i] = { ...p[i], leftAr: e.target.value }; setForm(f => ({ ...f, pairs: p })) }} />
                      <input className={inputCls} dir="ltr" placeholder="Left (EN)" value={pair.leftEn} onChange={e => { const p = [...form.pairs]; p[i] = { ...p[i], leftEn: e.target.value }; setForm(f => ({ ...f, pairs: p })) }} />
                    </div>
                    <span className="text-slate-300 text-lg font-bold">→</span>
                    <div className="grid grid-cols-2 gap-1">
                      <input className={inputCls} dir="rtl" placeholder="يمين (عربي)" value={pair.rightAr} onChange={e => { const p = [...form.pairs]; p[i] = { ...p[i], rightAr: e.target.value }; setForm(f => ({ ...f, pairs: p })) }} />
                      <input className={inputCls} dir="ltr" placeholder="Right (EN)" value={pair.rightEn} onChange={e => { const p = [...form.pairs]; p[i] = { ...p[i], rightEn: e.target.value }; setForm(f => ({ ...f, pairs: p })) }} />
                    </div>
                    {form.pairs.length > 2 && <button onClick={() => removePair(i)} className="text-red-400 hover:text-red-600 transition-colors"><X className="w-4 h-4" /></button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Explanation (Arabic)</label><textarea className={textareaCls} rows={2} dir="rtl" placeholder="شرح الإجابة الصحيحة" value={form.expAr} onChange={e => set('expAr', e.target.value)} /></div>
            <div><label className={labelCls}>Explanation (English)</label><textarea className={textareaCls} rows={2} dir="ltr" placeholder="Explanation for the correct answer" value={form.expEn} onChange={e => set('expEn', e.target.value)} /></div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={() => validate() && onSave(form)} disabled={!validate()} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Save Question
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PageQuiz() {
  const { lang } = useApp()
  const isAr = lang === 'ar'

  const [qb, setQb] = useState(loadData)
  const [lessonIdx, setLessonIdx] = useState(null)
  const [qIdx, setQIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState({})
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editor, setEditor] = useState(null)   // null | { lessonIdx, qIdx: number|null }
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { lessonIdx, qIdx }

  function updateQb(newQb) { setQb(newQb); saveData(newQb) }

  function saveQuestion(form) {
    const next = qb.map((l, li) => {
      if (li !== editor.lessonIdx) return l
      const qs = [...l.questions]
      if (editor.qIdx === null) qs.push(form)
      else qs[editor.qIdx] = form
      return { ...l, questions: qs }
    })
    updateQb(next)
    setEditor(null)
  }

  function deleteQuestion(li, qi) {
    const next = qb.map((l, idx) => idx !== li ? l : { ...l, questions: l.questions.filter((_, i) => i !== qi) })
    updateQb(next)
    setDeleteConfirm(null)
  }

  function resetToDefaults() {
    if (window.confirm('Reset all questions to defaults? This cannot be undone.')) {
      updateQb(DEFAULT_QB)
    }
  }

  const lesson = lessonIdx !== null ? qb[lessonIdx] : null
  const question = lesson ? lesson.questions[qIdx] : null
  const totalQ = lesson ? lesson.questions.length : 0
  const curAnswer = answers[qIdx]
  const isSubmitted = submitted[qIdx]

  function checkCorrect(q, ans) {
    if (q.type === 'mc') return ans === q.correct
    if (q.type === 'tf') return ans === q.correct
    if (q.type === 'mapping') return isMappingCorrect(q, ans)
    return false
  }

  function handleSubmit() {
    if (curAnswer === undefined || curAnswer === null || curAnswer === '') return
    if (question.type === 'mapping' && !question.pairs.every((_, i) => curAnswer?.[i])) return
    const correct = checkCorrect(question, curAnswer)
    setSubmitted(s => ({ ...s, [qIdx]: true }))
    if (correct) setScore(sc => sc + 1)
  }

  function handleNext() {
    if (qIdx + 1 < totalQ) setQIdx(q => q + 1)
    else setFinished(true)
  }

  function startLesson(idx) {
    setLessonIdx(idx); setQIdx(0); setAnswers({}); setSubmitted({}); setScore(0); setFinished(false)
  }

  function backToMenu() { setLessonIdx(null); setFinished(false) }
  function restartLesson() { setQIdx(0); setAnswers({}); setSubmitted({}); setScore(0); setFinished(false) }

  const isCorrect = isSubmitted ? checkCorrect(question, curAnswer) : null

  // ── Lesson Selection ────────────────────────────────────────────────────────
  if (lessonIdx === null) {
    return (
      <div className="min-h-screen bg-slate-50" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 text-white">
          <div className="max-w-5xl mx-auto px-6 py-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-black">{isAr ? 'بنك الأسئلة' : 'Question Bank'}</h1>
                  <p className="text-slate-400 text-sm">{isAr ? 'اختر درساً لبدء الاختبار' : 'Select a lesson to start the quiz'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editMode && (
                  <button onClick={resetToDefaults} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors border border-red-400/30">
                    {isAr ? 'إعادة الضبط' : 'Reset Defaults'}
                  </button>
                )}
                <button onClick={() => setEditMode(e => !e)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${editMode ? 'bg-amber-400 text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  <Settings className="w-4 h-4" />
                  {editMode ? (isAr ? 'إنهاء التحرير' : 'Done Editing') : (isAr ? 'تحرير' : 'Edit')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {qb.map((lesson, idx) => (
              <div key={lesson.id} className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-all relative group" dir="rtl">
                <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mb-3 ${lesson.color}`}>#{lesson.id}</div>
                <h3 className="font-bold text-slate-800 text-sm leading-tight mb-1">{isAr ? lesson.titleAr : lesson.titleEn}</h3>
                <p className="text-slate-400 text-xs mb-3">{lesson.questions.length} {isAr ? 'سؤال' : 'questions'}</p>
                <div className="flex gap-2">
                  <button onClick={() => startLesson(idx)} className="flex-1 bg-indigo-600 text-white rounded-lg py-1.5 text-xs font-bold hover:bg-indigo-700 transition-colors">
                    {isAr ? 'ابدأ' : 'Start'}
                  </button>
                  {editMode && (
                    <button onClick={() => setEditor({ lessonIdx: idx, qIdx: null })} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors flex items-center gap-1">
                      <Plus className="w-3 h-3" />{isAr ? 'سؤال' : 'Add'}
                    </button>
                  )}
                </div>

                {/* Questions list in edit mode */}
                {editMode && lesson.questions.length > 0 && (
                  <div className="mt-3 border-t border-slate-100 pt-3 space-y-1.5">
                    {lesson.questions.map((q, qi) => (
                      <div key={qi} className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 py-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-bold shrink-0 ${q.type === 'mc' ? 'bg-blue-100 text-blue-600' : q.type === 'tf' ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-100 text-violet-600'}`}>
                          {q.type === 'mc' ? 'MC' : q.type === 'tf' ? 'TF' : 'M'}
                        </span>
                        {q.image && <Image className="w-3 h-3 text-slate-400 shrink-0" />}
                        <span className="text-xs text-slate-600 flex-1 truncate">{isAr ? (q.qAr || q.qEn) : (q.qEn || q.qAr) || '(image)'}</span>
                        <button onClick={() => setEditor({ lessonIdx: idx, qIdx: qi })} className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => setDeleteConfirm({ lessonIdx: idx, qIdx: qi })} className="text-slate-400 hover:text-red-600 transition-colors shrink-0"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Delete confirm dialog */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
              <h3 className="font-black text-slate-800 mb-2">Delete Question?</h3>
              <p className="text-slate-500 text-sm mb-5">This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Cancel</button>
                <button onClick={() => deleteQuestion(deleteConfirm.lessonIdx, deleteConfirm.qIdx)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Editor modal */}
        {editor && (
          <QuestionEditor
            isAr={isAr}
            initial={editor.qIdx !== null ? qb[editor.lessonIdx].questions[editor.qIdx] : null}
            onSave={saveQuestion}
            onCancel={() => setEditor(null)}
          />
        )}
      </div>
    )
  }

  // ── Results screen ──────────────────────────────────────────────────────────
  if (finished) {
    const pct = Math.round((score / totalQ) * 100)
    const grade = pct >= 80 ? (isAr ? 'ممتاز! 🎉' : 'Excellent! 🎉') : pct >= 60 ? (isAr ? 'جيد 👍' : 'Good 👍') : (isAr ? 'تحتاج مراجعة 📖' : 'Needs Review 📖')
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">{pct >= 80 ? '🏆' : pct >= 60 ? '✅' : '📖'}</div>
          <h2 className="text-2xl font-black text-slate-800 mb-1">{grade}</h2>
          <p className="text-slate-500 mb-6">{isAr ? lesson.titleAr : lesson.titleEn}</p>
          <div className="text-5xl font-black text-indigo-600 mb-2">{score}/{totalQ}</div>
          <div className="w-full bg-slate-100 rounded-full h-3 mb-6"><div className="bg-indigo-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
          <div className="flex gap-3 justify-center">
            <button onClick={restartLesson} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors text-sm"><RotateCcw className="w-4 h-4" />{isAr ? 'إعادة' : 'Retry'}</button>
            <button onClick={backToMenu} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm">{isAr ? 'القائمة' : 'All Lessons'}</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Quiz screen ─────────────────────────────────────────────────────────────
  if (!question) return null

  const typeLabel = question.type === 'mc' ? (isAr ? 'اختيار متعدد' : 'Multiple Choice') : question.type === 'tf' ? (isAr ? 'صح أم خطأ' : 'True / False') : (isAr ? 'مطابقة' : 'Matching')
  const typeCls = question.type === 'mc' ? 'bg-blue-100 text-blue-700' : question.type === 'tf' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'

  return (
    <div className="min-h-screen bg-slate-50" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Sticky header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button onClick={backToMenu} className="text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center gap-1 transition-colors">
            {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {isAr ? 'الدروس' : 'Lessons'}
          </button>
          <span className="font-bold text-slate-800 text-sm">{isAr ? lesson.titleAr : lesson.titleEn}</span>
          <span className="text-sm text-slate-500 font-mono">{qIdx + 1}/{totalQ}</span>
        </div>
        <div className="h-1 bg-slate-100"><div className="h-1 bg-indigo-500 transition-all duration-300" style={{ width: `${((qIdx + (isSubmitted ? 1 : 0)) / totalQ) * 100}%` }} /></div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          {/* Score + type badge */}
          <div className="flex items-center justify-between mb-5">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${typeCls}`}>{typeLabel}</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>{score} {isAr ? 'صحيحة' : 'correct'}</span>
            </div>
          </div>

          {/* Image (if any) */}
          {question.image?.src && (
            <div className="mb-5 text-center">
              <img src={question.image.src} alt={isAr ? question.image.captionAr : question.image.captionEn} className="max-h-56 rounded-xl mx-auto border border-slate-100 object-contain" onError={e => e.target.style.display = 'none'} />
              {(question.image.captionAr || question.image.captionEn) && (
                <p className="text-xs text-slate-400 mt-2">{isAr ? question.image.captionAr : question.image.captionEn}</p>
              )}
            </div>
          )}

          {/* Question text */}
          {(question.qAr || question.qEn) && (
            <div className="mb-6">
              <div className="text-slate-800 font-bold text-base leading-relaxed">{isAr ? question.qAr : question.qEn}</div>
              {isAr && question.qEn && <div className="text-slate-400 text-xs mt-1">{question.qEn}</div>}
              {!isAr && question.qAr && <div className="text-slate-400 text-xs mt-1 font-medium" dir="rtl">{question.qAr}</div>}
            </div>
          )}

          {/* TF */}
          {question.type === 'tf' && (
            <div className="flex gap-3">
              {[{ val: true, labelAr: '✅ صحيح', labelEn: '✅ True' }, { val: false, labelAr: '❌ خطأ', labelEn: '❌ False' }].map(opt => {
                const selected = curAnswer === opt.val
                const isThisCorrect = opt.val === question.correct
                let cls = 'flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all '
                cls += isSubmitted ? (isThisCorrect ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : (selected ? 'bg-red-50 border-red-300 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-400')) : (selected ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50')
                return <button key={String(opt.val)} disabled={isSubmitted} onClick={() => setAnswers(a => ({ ...a, [qIdx]: opt.val }))} className={cls}>{isAr ? opt.labelAr : opt.labelEn}</button>
              })}
            </div>
          )}

          {/* MC */}
          {question.type === 'mc' && (
            <div className="space-y-2.5">
              {question.options.map((opt, i) => {
                const selected = curAnswer === i
                const isThisCorrect = i === question.correct
                let cls = 'w-full text-right px-4 py-3 rounded-xl font-medium text-sm border-2 transition-all flex items-center gap-3 '
                cls += isSubmitted ? (isThisCorrect ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : (selected ? 'bg-red-50 border-red-300 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-400')) : (selected ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50')
                return (
                  <button key={i} disabled={isSubmitted} onClick={() => setAnswers(a => ({ ...a, [qIdx]: i }))} className={cls} dir={isAr ? 'rtl' : 'ltr'}>
                    <span className="shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-black">{['A','B','C','D'][i]}</span>
                    <span className="flex-1">{isAr ? opt.ar : opt.en}</span>
                    {isSubmitted && isThisCorrect && <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />}
                    {isSubmitted && selected && !isThisCorrect && <XCircle className="w-4 h-4 shrink-0 text-red-500" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* Mapping */}
          {question.type === 'mapping' && (
            <MappingQuestion q={question} isAr={isAr} answer={curAnswer} onChange={val => setAnswers(a => ({ ...a, [qIdx]: val }))} submitted={isSubmitted} />
          )}

          {/* Feedback */}
          {isSubmitted && (
            <div className={`mt-5 rounded-xl p-4 flex gap-3 ${isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              {isCorrect ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
              <div>
                <div className={`font-bold text-sm mb-1 ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>{isCorrect ? (isAr ? 'إجابة صحيحة!' : 'Correct!') : (isAr ? 'إجابة خاطئة' : 'Incorrect')}</div>
                <div className="text-sm text-slate-600 leading-relaxed">{isAr ? question.expAr : question.expEn}</div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 gap-3">
            <button onClick={() => qIdx > 0 && setQIdx(q => q - 1)} disabled={qIdx === 0} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-slate-100">
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}{isAr ? 'السابق' : 'Prev'}
            </button>
            {!isSubmitted ? (
              <button onClick={handleSubmit} disabled={curAnswer === undefined || curAnswer === null || curAnswer === ''} className="flex-1 max-w-xs mx-auto bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {isAr ? 'تحقق من الإجابة' : 'Check Answer'}
              </button>
            ) : (
              <button onClick={handleNext} className="flex-1 max-w-xs mx-auto bg-slate-800 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-slate-900 transition-colors flex items-center justify-center gap-2">
                {qIdx + 1 < totalQ ? (isAr ? 'السؤال التالي' : 'Next Question') : (isAr ? 'عرض النتيجة' : 'See Results')}
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
            <div className="w-16 text-right"><span className="text-xs text-slate-400 font-mono">{qIdx + 1}/{totalQ}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
