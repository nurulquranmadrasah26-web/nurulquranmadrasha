# Backend নতুন করে সেটআপ (Render) — ধাপে ধাপে

`/api/health`-এ "Not Found" (Render-এর কালো ডিফল্ট পেজ) মানে সার্ভিসটা আসলে
আমাদের `server.js` চালাচ্ছেই না। এর সবচেয়ে বড় কারণ: আপনার GitHub রিপোতে
`backend` ফোল্ডারটা একটা সাবফোল্ডারের ভেতরে (`nurulquranmadrasha/backend`),
কিন্তু Render-এর **Root Directory** সেটিং হয়তো খালি বা ভুল আছে — তাই Render
রিপোর একদম উপরের লেভেলে `package.json`/`server.js` খুঁজে না পেয়ে ঠিকমতো
চালাতে পারছে না, অথবা সার্ভিসটা "Static Site" হিসেবে বানানো হয়েছে।

নিচের ধাপগুলো অনুসরণ করে **একদম নতুন করে** Web Service বানান।

## ধাপ ০ — প্রথমে আপনার GitHub রিপো স্ট্রাকচার দেখে নিন
GitHub-এ আপনার রিপো খুলুন। দেখুন `backend` ফোল্ডারটা রিপোর একদম রুটে আছে, নাকি
`nurulquranmadrasha` নামের ফোল্ডারের ভেতরে। এর উপর ভিত্তি করে Root Directory
বসবে:
- রিপো রুটেই যদি সরাসরি `backend/`, `frontend/`, `admin_panel/` দেখেন →
  Root Directory = `backend`
- আর যদি রুটে একটা `nurulquranmadrasha/` ফোল্ডার থাকে যার ভেতরে
  `backend/`, `frontend/` ইত্যাদি থাকে → Root Directory =
  `nurulquranmadrasha/backend`

এই zip-এ থাকা `nurulquranmadrasha/server.js`, `nurulquranmadrasha/backend/`
— এই কাঠামোটা আপনি যেভাবে GitHub-এ আপলোড/পুশ করবেন সেভাবেই রিপোতে থাকবে,
তাই উপরের চেকটা করে নেওয়া জরুরি।

## ধাপ ১ — পুরনো ব্যাকএন্ড সার্ভিস মুছে ফেলুন (ঐচ্ছিক কিন্তু সুপারিশকৃত)
Render Dashboard → পুরনো `nurulquranmadrasha-backend` সার্ভিস খুলুন →
**Settings** → নিচে স্ক্রল করে **Delete Web Service**। (এতে আপনার
GitHub কোড বা MongoDB ডাটা মুছবে না, শুধু Render-এর ভুল কনফিগারেশনটা মুছবে।)

## ধাপ ২ — নতুন Web Service বানান
1. Render Dashboard → **New +** → **Web Service**
2. আপনার GitHub রিপো সিলেক্ট করুন
3. নিচের সেটিংসগুলো **হুবহু** বসান:

| সেটিং | মান |
|---|---|
| **Name** | `nurulquranmadrasha-backend` |
| **Region** | Singapore (বা যেকোনো কাছেরটা) |
| **Branch** | `main` (আপনার ডিফল্ট ব্রাঞ্চ) |
| **Root Directory** | ধাপ ০ অনুযায়ী `backend` অথবা `nurulquranmadrasha/backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

⚠️ **"Root Directory" খালি রাখবেন না** — এটাই মূল ভুল ছিল সম্ভবত।

## ধাপ ৩ — Environment Variables যোগ করুন
একই পেজে নিচে **Environment Variables** সেকশনে **Add Environment Variable**
চেপে একে একে বসান:

```
MONGODB_URI=<আপনার MongoDB Atlas connection string>
JWT_SECRET=MySuperSecretKey_2026_X9A7Bt8LmN5YQr
ALLOWED_ORIGINS=https://nurulquranmadrasha.vercel.app,https://nurulquranmadrasha-y9xo.vercel.app
SEED_SUPERADMIN_UID=nqsuperadmin
SEED_SUPERADMIN_PASSWORD=NQadmin@2026#Secure
SEED_SUPERADMIN_NAME=সুপার এডমিন
CLOUDINARY_CLOUD_NAME=hsbvc5l6
CLOUDINARY_API_KEY=763578951449426
CLOUDINARY_API_SECRET=jabm1EOjla6oz6-WDoQQ0RWhj6Y
```

> নিরাপত্তার কারণে MongoDB পাসওয়ার্ড ও Cloudinary secret আগে একবার এই
> চ্যাটে দেখা গেছে বলে সুযোগ পেলে Atlas ও Cloudinary-তে গিয়ে এগুলো
> রিসেট করে নতুন মান বসানো ভালো।

## ধাপ ৪ — Health Check Path বসান
**Settings** ট্যাবে (সার্ভিস তৈরি হওয়ার পর) → **Health Check Path** ফিল্ডে
বসান:
```
/api/health
```
এতে Render নিজে থেকে বুঝবে সার্ভার সত্যিই সাড়া দিচ্ছে কিনা, আর সমস্যা হলে
Dashboard-এই স্পষ্ট এরর দেখাবে।

## ধাপ ৫ — Deploy করে যাচাই করুন
**Create Web Service** চাপুন। বিল্ড শেষ হলে Logs-এ এই লাইনগুলো খুঁজুন:
```
[db] MongoDB connected
[seed] First Super Admin created -> uid: nqsuperadmin
[api] listening on :5000 (বা Render-এর দেওয়া PORT)
```
এরপর ব্রাউজারে খুলুন:
```
https://nurulquranmadrasha-backend.onrender.com/api/health
```
`{"ok":true,"db":"connected"}` দেখলে ব্যাকএন্ড ঠিকমতো চলছে। তারপর লগইন পেজ
থেকে **uid: nqsuperadmin, password: NQadmin@2026#Secure** দিয়ে ঢুকুন।

## এই zip-এ যা আছে
- `nurulquranmadrasha/backend/server.js` — CORS ও Super Admin সিডিং বাগ
  ঠিক করা কোড
- `nurulquranmadrasha/render.yaml` — চাইলে Render-এর **Blueprint**
  (New + → Blueprint) দিয়ে এই ফাইল থেকে সরাসরি সঠিক Root Directory ও
  কমান্ড সহ সার্ভিস বানাতে পারেন, তাহলে ধাপ ২-এর ম্যানুয়াল সেটিং লাগবে না
  (শুধু ধাপ ৩-এর ভ্যালুগুলো Render Dashboard-এ গিয়ে বসাতে হবে, কারণ
  সিক্রেট মান blueprint ফাইলে রাখা হয় না)।
