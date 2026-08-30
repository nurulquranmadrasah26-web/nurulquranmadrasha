## Teacher approval workflow

Teacher-created homework, syllabus, leave applications, result entries, and admission applications are stored as pending approval requests. Super Admins receive them in the notification bell, can inspect the submitted details, and approve or reject them. Only approved records are written to the shared student-facing store and approved items generate a student notification.

The teacher panel sends admission, fee collection, inventory changes, homework, syllabus, leave, result, notice, and exam-subject changes to Super Admin for approval. Attendance is restricted to one submission per date/class/branch on the server; only Super Admin can submit that same scope again. Pending teacher requests can be edited by their creator until a Super Admin makes a decision.

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
- SMS পাঠানো: এডমিন প্যানেলের ম্যাসেজ পেজ এখন Automass-এর JSON API v4 ব্যবহার করে
  সরাসরি SMS পাঠায়, Unicode/বাংলা SMS-এর জন্য `smsformat=8`, ব্যালেন্স দেখা,
  গ্রুপভিত্তিক শিক্ষার্থী/অভিভাবক/স্টাফ নির্বাচন এবং সফল/ব্যর্থ ফলাফল সংরক্ষণ করে।
  নিরাপত্তার জন্য `SMS_API_KEY` কোড বা frontend-এ রাখা হয়নি; Render/ব্যাকএন্ডের
  environment secret-এ `backend/.env.example` অনুযায়ী সেট করুন।
- পুশ নোটিফিকেশন: Render-এ `VAPID_PUBLIC_KEY` ও `VAPID_PRIVATE_KEY` সেট করলেই চালু হবে।
- Render ফ্রি প্লানে ১৫ মিনিট নিষ্ক্রিয় থাকলে সার্ভার ঘুমায়। সম্পূর্ণ সমাধান
  পেইড প্লান, অথবা cron-job.org থেকে প্রতি ১০ মিনিটে `/api/health` পিং করান।

## Render Backend সেটআপ

এই ZIP-এর ভেতরে backend আলাদা ফোল্ডারে আছে। Render Web Service-এ নিচের মানগুলো ব্যবহার করুন:

- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Required environment variables:** `MONGODB_URI`, `JWT_SECRET`, `SEED_SUPERADMIN_NAME`,
  `SEED_SUPERADMIN_UID`, `SEED_SUPERADMIN_PASSWORD`, `ALLOWED_ORIGINS`
- SMS-এর জন্য: `SMS_API_KEY`, `SMS_SENDER_ID`
- `ALLOWED_ORIGINS`-এ কমা দিয়ে `https://admin.nurulqurane.online`,
  `https://www.nurulqurane.online` এবং `https://nurulqurane.online` রাখুন।

Root Directory `backend` না দিলে Render `server.js` খুঁজে পাবে না এবং কোনো port open হবে না।
এই কারণেই একই ZIP-এর project root-এ `package.json` ও `render.yaml`-ও রাখা হয়েছে। Existing
Render service-এর Root Directory যদি পরিবর্তন করা না যায়, project root-এ থেকে Build Command
`npm install` এবং Start Command `npm start` ব্যবহার করলেও backend চালু হবে।
`MONGODB_URI` না থাকলেও server এখন Render-এর `PORT`-এ bind করবে, তবে database/auth API
চালাতে অবশ্যই Render Environment-এ সেটি যোগ করতে হবে।

## SMS না পৌঁছানো ও balance কাটার সুরক্ষা

- Automass-এর `status: 0` মানে gateway request গ্রহণ করেছে; এই API-তে handset delivery
  report নেই। তাই panel এখন “gateway-তে গৃহীত, delivery নিশ্চিত নয়” দেখায়—মিথ্যা delivered
  success দেখায় না।
- বাংলা ৭০ অক্ষর বা ASCII ১৬০ অক্ষরের বেশি হলে request-এ `type: "long"` পাঠানো হয় এবং
  বাংলা হলে `smsformat: 8` যোগ হয়।
- মোবাইল নাম্বারের বাংলা অঙ্ক, `017XXXXXXXX` এবং `8801...` ইনপুট normalize হয়;
  gateway-তে সব নম্বর একক `8801...` international format-এ পাঠানো হয়।
- একই request-এর browser retry/double-send আটকাতে `requestId` ও server-side log check যোগ
  করা হয়েছে। SMS POST-এ automatic retry বন্ধ করা হয়েছে, কারণ timeout-এর পরে provider
  request গ্রহণ করে থাকলে retry করলে balance দুবার কাটতে পারে।
- Gateway response-এ per-recipient status না থাকলে এখন HTTP status, gateway status এবং
  provider-এর message log/panel-এ দেখাবে; আগে এই অবস্থাকে ভুলভাবে শুধু `3300` বলা হতো।
- Gateway যে `id` ফেরত দেয়, সেটি এখন ম্যাসেজ তালিকায় দেখা যাবে; Automass-এর Delivery Log
  Report বা support-এ অনুসন্ধানের সময় এই ID ব্যবহার করুন।
- নতুন test না করে আগে balance, sender ID approval, DND/route এবং gateway portal-এর
  delivery report যাচাই করুন। Provider যদি `status: 0` দিয়ে charge করে কিন্তু delivery না
  দেয়, refund/route correction Automass account support-এর মাধ্যমেই করতে হবে; application
  code provider-এর charge ফেরত দিতে পারে না।

## ৪) সর্বশেষ আপডেট (১৯ আগস্ট ২০২৬)
- **বাড়ির কাজ (আবাসিক)** — "বালিকা শাখা" নির্বাচন করলে আগে কোনো শিক্ষার্থী আসত না
  (ডাটাতে শাখার নাম "বালিকা", রেডিওতে "বালিকা শাখা")। এখন শাখার নাম নরমালাইজ করে
  মেলানো হয় (`branch`, `dept`, `attDept`, `cls`, `attCls` সব ফিল্ড দেখা হয়) — তাই
  নাজেরা বালিকা/হেফজ বালিকা সব শিক্ষার্থী তালিকায় আসে (চারটি লেআউট ও কায়দা চেকলিস্টেও)।
- **Google ইনডেক্সিং ("Robots.txt unreachable")** —
  `frontend/robots.txt` (Allow + Sitemap), `frontend/sitemap.xml`,
  `frontend/vercel.json` (robots/sitemap-এর সঠিক Content-Type ও হেডার),
  `admin_panel/robots.txt` (এডমিন প্যানেল ইনডেক্স হবে না) যোগ করা হয়েছে।
  সার্ভিস ওয়ার্কার এখন `robots.txt`/`sitemap.xml` ইন্টারসেপ্ট করে না।
- `frontend/index.html`-এ meta description, canonical, Open Graph, Twitter card ও
  JSON-LD (EducationalOrganization) যোগ করা হয়েছে।
- ⚠️ ডোমেইন হিসেবে `https://nurulqurane.online/` ধরা হয়েছে। আপনার মূল সাইটের ডোমেইন
  ভিন্ন হলে `robots.txt`, `sitemap.xml` ও `index.html`-এর লিঙ্কগুলো বদলে নিন।
  ডিপ্লয়ের পর Search Console-এ URL Inspection → "Test Live URL" → "Request Indexing" দিন।
