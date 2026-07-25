# সমস্যার সমাধান — লগইন / CORS এরর

## যা ঘটেছিল (মূল কারণ)

আপনার `backend/.env` ফাইলটি `.gitignore`-এ থাকায় GitHub-এ যায়নি — এটাই ঠিক আছে
(সিক্রেট কী GitHub-এ রাখা উচিত না)। কিন্তু এর মানে হলো, Render-এ যখন এই কোড
ডিপ্লয় হয়েছে, তখন Render-এর কাছে `MONGODB_URI`, `JWT_SECRET`,
`ALLOWED_ORIGINS`, `SEED_SUPERADMIN_*`, `CLOUDINARY_*` — এই এনভায়রনমেন্ট
ভ্যারিয়েবলগুলোর **কোনোটাই ছিল না**, যদি সেগুলো Render Dashboard-এ আলাদাভাবে
বসানো না হয়ে থাকে।

`server.js`-এ কোড আছে:
```js
if (!MONGODB_URI) {
  console.error("FATAL: MONGODB_URI is not set");
  process.exit(1);
}
```
অর্থাৎ `MONGODB_URI` না থাকলে সার্ভার সাথে সাথে ক্র্যাশ করে বন্ধ হয়ে যায় এবং
কোনো রিকোয়েস্টের জবাবই দেয় না। ব্রাউজার তখন কোনো রেসপন্স/হেডার না পেয়ে এটাকে
"CORS policy" এরর হিসেবে দেখায় — যদিও আসল সমস্যা CORS না, সমস্যা হলো সার্ভারটা
আদৌ চলছেই না বা রেসপন্স দিচ্ছে না।

এছাড়া কোডে আরেকটি বাগ ছিল: `seedSuperAdmin` নামের ফাংশনটি **দুইবার** ডিফাইন
করা ছিল (JavaScript-এ পরেরটাই কার্যকর হয়)। প্রথমটি `admin/admin123`
হার্ডকোড করত, কিন্তু সেটি চাপা পড়ে দ্বিতীয়টি চলত — যেটি
`SUPER_ADMIN_UID/PASSWORD/NAME` এনভায়রনমেন্ট ভ্যারিয়েবল খুঁজত, অথচ আপনার
`.env`-এ ভ্যারিয়েবলের নাম ছিল `SEED_SUPERADMIN_UID/PASSWORD/NAME` — নাম না
মেলায় কোনো Super Admin-ই তৈরি হতো না।

## যা ঠিক করা হয়েছে (`backend/server.js`)

1. পুরনো/ডুপ্লিকেট `seedSuperAdmin` ফাংশনটি সরানো হয়েছে।
2. বাকি থাকা ফাংশনটি এখন `SUPER_ADMIN_*` এবং `SEED_SUPERADMIN_*` — দুই নামই
   গ্রহণ করে, এবং কোনোটাই সেট করা না থাকলে নিরাপদভাবে ডিফল্ট
   `admin / admin123` দিয়ে Super Admin তৈরি করে, যাতে প্রথমবার লগইন করার
   পথ কখনো বন্ধ না থাকে।
3. CORS মিডলওয়্যার আরো শক্তিশালী করা হয়েছে — কোনো origin চেক করতে গিয়ে এরর
   হলে (আগে যেটা পুরো রিকোয়েস্ট ভেঙে দিতে পারত) এখন সেটা নিরাপদে "not
   allowed" হিসেবে হ্যান্ডেল হয়, এবং সুস্পষ্টভাবে সব প্রিফ্লাইট (`OPTIONS`)
   রিকোয়েস্টের জবাব দেওয়া নিশ্চিত করা হয়েছে।

## আপনাকে যা করতে হবে (এটাই আসল, জরুরি ধাপ)

### ধাপ ১ — Render Dashboard-এ Environment Variables বসান
Render-এ আপনার backend service খুলুন → **Environment** ট্যাব → নিচের
ভ্যারিয়েবলগুলো একে একে যোগ করুন (মান আপনার পুরনো `.env` থেকে):

```
MONGODB_URI=mongodb+srv://.....(আপনার আসল URI)
JWT_SECRET=MySuperSecretKey_2026_X9A7Bt8LmN5YQr
ALLOWED_ORIGINS=https://nurulquranmadrasha.vercel.app,https://nurulquranmadrasha-y9xo.vercel.app
SEED_SUPERADMIN_UID=nqsuperadmin
SEED_SUPERADMIN_PASSWORD=NQadmin@2026#Secure
SEED_SUPERADMIN_NAME=সুপার এডমিন
CLOUDINARY_CLOUD_NAME=hsbvc5l6
CLOUDINARY_API_KEY=763578951449426
CLOUDINARY_API_SECRET=jabm1EOjla6oz6-WDoQQ0RWhj6Y
```

> ⚠️ নিরাপত্তার জন্য পরামর্শ: `MONGODB_URI`-এর পাসওয়ার্ড এবং
> `CLOUDINARY_API_SECRET` যেহেতু এই কথোপকথনে দেখা গেছে, চাইলে MongoDB Atlas ও
> Cloudinary-তে গিয়ে এগুলো রিসেট/রোটেট করে নেওয়া ভালো অভ্যাস।

সেভ করার পর Render নিজে থেকেই সার্ভার রিস্টার্ট করবে (Manual Deploy ->
"Clear build cache & deploy" করলেও চলবে)।

### ধাপ ২ — নতুন `server.js` আপলোড/পুশ করুন
এই zip-এর ভেতরের `backend/server.js` ফাইলটি আপনার GitHub রিপোতে আপলোড করুন
(অথবা Render-এ ম্যানুয়ালি রিডিপ্লয় করুন)। Render আবার বিল্ড শুরু করবে।

### ধাপ ৩ — লগইন করুন
- যদি ধাপ ১-এ `SEED_SUPERADMIN_UID`/`SEED_SUPERADMIN_PASSWORD` বসিয়ে থাকেন:
  **uid: `nqsuperadmin`, password: `NQadmin@2026#Secure`**
- যদি ওগুলো না বসান (শুধু `MONGODB_URI` ইত্যাদি বসান): তাহলে ডিফল্ট
  **uid: `admin`, password: `admin123`** কাজ করবে।

⚠️ মনে রাখবেন, Super Admin কেবল **একবারই** সিড হয় — ডাটাবেজে যদি ইতিমধ্যে
কোনো Super Admin থেকে থাকে (আগের ব্যর্থ প্রচেষ্টায় তৈরি না হয়ে থাকলে সমস্যা
নেই), নতুন কিছু তৈরি হবে না। যদি লগইন তারপরও কাজ না করে, MongoDB Atlas-এ গিয়ে
`users` কালেকশনে কোনো ডকুমেন্ট আছে কিনা দেখুন — না থাকলে Render-এর Logs ট্যাবে
`[seed] First Super Admin created -> uid: ...` লাইনটি খুঁজুন, সেটাই আসল uid।

### ধাপ ৪ — Render Free Tier "ঘুমিয়ে পড়া" সমস্যা
Render-এর ফ্রি প্ল্যানে ১৫ মিনিট নিষ্ক্রিয় থাকলে সার্ভিসটি স্লিপ মোডে চলে
যায়। এরপর প্রথম রিকোয়েস্টে ৩০–৫০ সেকেন্ড দেরি হয়, আর সেই দেরির মধ্যে ব্রাউজার
রিকোয়েস্টটা টাইমআউট/ফেইল করলে সেটাও দেখতে "CORS blocked" এররের মতোই লাগে।
সমাধান: প্রথমবার লগইন ব্যর্থ হলে ৩০ সেকেন্ড অপেক্ষা করে আবার চেষ্টা করুন, অথবা
[UptimeRobot](https://uptimerobot.com)-এর মতো ফ্রি টুল দিয়ে প্রতি ১০ মিনিটে
`https://nurulquranmadrasha-backend.onrender.com/api/health`-এ পিং করে
সার্ভিসটাকে জাগিয়ে রাখুন, অথবা Render-এর পেইড প্ল্যানে নিন।

## দ্রুত যাচাই
ডিপ্লয়ের পর ব্রাউজারে/নতুন ট্যাবে এই লিংক খুলুন:
```
https://nurulquranmadrasha-backend.onrender.com/api/health
```
`{"ok":true,"db":"connected"}` দেখলে বুঝবেন সার্ভার ও ডাটাবেজ ঠিক আছে, এরপর
লগইন পেজ থেকে চেষ্টা করুন।
