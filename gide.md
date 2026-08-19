# নূরুল কোরআন মাদরাসা — আপডেট নোট

## ১) লগইন ও লোডিং গতি
- `backend/server.js` — সার্ভার এখন ডাটাবেস সংযোগের জন্য অপেক্ষা না করেই পোর্টে
  চালু হয় (Render-এর কোল্ড স্টার্ট দ্রুত শেষ হয়)। ডাটাবেস প্রস্তুত না থাকলে
  শুধু API রিকোয়েস্ট অপেক্ষা করে; `/api/health` সাথে সাথেই উত্তর দেয়।
- Mongoose কানেকশন পুলিং (maxPoolSize ১০) ও টাইমআউট অপটিমাইজ করা হয়েছে।
- নতুন `nq-warmup.js` (frontend + admin_panel) — পেজ খোলার সাথে সাথেই
  `/api/health`-এ পিং যায়, ফলে ব্যবহারকারী পাসওয়ার্ড লেখা শেষ করার আগেই
  সার্ভার জেগে যায় এবং লগইন সেকেন্ডে হয়। সাথে `preconnect`/`dns-prefetch`।
- লগইন ও সব এডমিন API কলে অটো-রিট্রাই + টাইমআউট। সার্ভার জাগতে দেরি হলে
  বাটনে "সার্ভার চালু হচ্ছে..." দেখায়।
- এডমিন প্যানেলে প্রতি রিফ্রেশে পুরো ডেটা আবার সার্ভারে আপলোড হওয়া বন্ধ করা
  হয়েছে (এখন শুধু প্রথমবার সিড হয়) — লোডিং অনেক দ্রুত।
- সব লোগো/আইকন base64 থেকে অপটিমাইজড ইমেজ ফাইলে সরানো হয়েছে
  (`index.html` ~৬৮০KB → ~৪৯KB)।

## ২) রশিদ
- নতুন ডিজাইনের রশিদ (`printReceipt`): মাদরাসার ব্যানার হেডার, রশিদ নম্বর,
  বাংলা সংখ্যা/তারিখ, মোট–ডিসকাউন্ট–পরিশোধিত–বকেয়া সারি, সময় স্ট্যাম্প।
- ব্যানার লোগো: `assets/receipt-header.png` (দ্বিতীয় ইমেজ)।
- অ্যাপ/সাইট লোগো ও আইকন: `assets/app-logo.png`, `icons/*` (তৃতীয় ইমেজ)।
- রশিদ এখন এই সব স্থানে: ফি আদায়, ভর্তির ফি, ডোনেশন আদায়,
  ইনভেন্টরি বিক্রয় (নতুন), ড্রাইভার পেমেন্ট (নতুন)।

## ৩) অকার্যকর বিষয় — যা ঠিক করা হলো
1. ফি আদায়ে মাস ও তারিখ হার্ডকোড ছিল ('জুলাই ২০২৬') → এখন প্রকৃত তারিখ বসে।
2. "ফলাফলের ব্যাচ যোগ করুন" মডালের `saveResultPublishBatch()` ফাংশনই ছিল না →
   মডাল ও বাটন এখন সম্পূর্ণ কার্যকর।
3. ওয়েবসাইটের যোগাযোগ ফর্ম শুধু alert দেখাতো, কোথাও সংরক্ষিত হতো না →
   নতুন `POST /api/public/contact` এন্ডপয়েন্টে সংরক্ষিত হয়; মোবাইল ও বিষয়
   ফিল্ড যোগ করা হয়েছে; এডমিন প্যানেলে "ম্যাসেজ → ওয়েবসাইটের বার্তা"
   পেজে সব বার্তা দেখা যায়।
4. ইনভেন্টরি বিক্রয় ও ড্রাইভার পেমেন্টে রশিদ ছিল না → যোগ করা হয়েছে।

## যা এখনো বাকি (সার্ভার/সেবা নির্ভর)
- SMS পাঠানো: প্রকৃত SMS গেটওয়ে (API কী) প্রয়োজন — এখন শুধু তালিকায় জমা হয়।
- পুশ নোটিফিকেশন: Render-এ `VAPID_PUBLIC_KEY` ও `VAPID_PRIVATE_KEY` সেট করলেই চালু হবে।
- Render ফ্রি প্লানে ১৫ মিনিট নিষ্ক্রিয় থাকলে সার্ভার ঘুমায়। সম্পূর্ণ সমাধান
  পেইড প্লান, অথবা cron-job.org থেকে প্রতি ১০ মিনিটে `/api/health` পিং করান।

## ৪) SEO ও ডোমেইন সিস্টেম (নতুন আপডেট)
- ফ্রন্টএন্ড ডোমেইন: **https://www.nurulqurane.online** (apex `nurulqurane.online` → www এ রিডাইরেক্ট)
- এডমিন প্যানেল ডোমেইন: **https://admin.nurulqurane.online** (রুট `/` → `admin.html`)
- `frontend/index.html` — সম্পূর্ণ SEO: টাইটেল, description, বিস্তৃত keywords
  (নুরুল কুরআন / নুরুল কোরআন / নুরুল কুরআন অনলাইন / নুরুল কুরআন ডট অনলাইন /
  Nurul Quran / Nurul Quran Online / nurulqurane.online সহ সব বানানভেদ),
  canonical, hreflang (bn/en/x-default), Open Graph, Twitter Card, geo মেটা,
  এবং JSON-LD স্কিমা (EducationalOrganization + School + LocalBusiness,
  WebSite + SearchAction, BreadcrumbList, Course তালিকা)।
- নতুন `frontend/robots.txt` ও `frontend/sitemap.xml` (Sitemap লিঙ্ক robots.txt-এ)।
- নতুন `frontend/vercel.json` — cleanUrls, `/admin` → এডমিন সাবডোমেইন রিডাইরেক্ট,
  robots/sitemap সঠিক Content-Type, নিরাপত্তা হেডার।
- `admin_panel/` — `robots.txt` (Disallow: /), সব HTML-এ `noindex` মেটা,
  `vercel.json`-এ `X-Robots-Tag: noindex` ও `/admin`,`/student`,`/teacher` রিরাইট।
  ফলে এডমিন প্যানেল কখনো Google-এ আসবে না।
- `backend/server.js` — CORS-এ ডিফল্টভাবেই `www.nurulqurane.online`,
  `nurulqurane.online`, `admin.nurulqurane.online` এবং যেকোনো
  `*.nurulqurane.online` অনুমোদিত।

### ডিপ্লয় ধাপ (Vercel)
1. `frontend` ফোল্ডার = প্রজেক্ট ১ → ডোমেইন `www.nurulqurane.online` (+ apex রিডাইরেক্ট)।
2. `admin_panel` ফোল্ডার = প্রজেক্ট ২ → ডোমেইন `admin.nurulqurane.online`।
3. Render backend-এ `ALLOWED_ORIGINS` ঐচ্ছিক (কোডে ডিফল্ট আছে)।
4. Google Search Console-এ দুই প্রপার্টি যোগ করে
   `https://www.nurulqurane.online/sitemap.xml` সাবমিট করুন।
