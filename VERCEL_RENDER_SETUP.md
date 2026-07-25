# Vercel + Render Setup গাইড

## সমস্যার কারণ

আপনি যখন দেখেছিলেন "Cannot read properties of undefined (reading 'authFetch')", এটি হয়েছিল কারণ:

1. **config.js সঠিক API URL না দিচ্ছিল**
2. **authFetch window.NQAuth থেকে কল হচ্ছিল কিন্তু API সঠিক ছিল না**

---

## সমাধান: ৩ ধাপে কনফিগারেশন

### ধাপ 1: আপনার Render Backend URL খুঁজুন

1. [Render.com](https://render.com) এ লগইন করুন
2. আপনার Backend সার্ভিস খুলুন
3. **Environment** ট্যাব → **API Endpoint** এর নিচে দেখুন:
   - এটি এরকম দেখাবে: `https://nurulquranmadrasha-backend.onrender.com`
   - **এটি কপি করুন**

### ধাপ 2: config.js ফাইল আপডেট করুন

#### admin_panel/config.js
```javascript
return "https://nurulquranmadrasha-backend.onrender.com"; // আপনার Render URL
```

#### frontend/config.js
```javascript
return "https://nurulquranmadrasha-backend.onrender.com"; // আপনার Render URL
```

**সার্চ করুন**: `RENDER_BACKEND_URL` এবং এটি দিয়ে প্রতিস্থাপন করুন।

### ধাপ 3: Vercel এ Deploy করুন

```bash
git add admin_panel/config.js frontend/config.js
git commit -m "Update Render API URL"
git push
```

Vercel স্বয়ংক্রিয়ভাবে নতুন বিল্ড করবে।

---

## CORS সেটিংস (Backend - Render)

আপনার Backend `server.js` এ নিশ্চিত করুন CORS সেটিংস সঠিক:

```javascript
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    // Vercel এর সব ডোমেইন allow করুন
    if (/\.vercel\.app$/.test(new URL(origin).hostname)) return cb(null, true);
    // localhost allow করুন
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
```

---

## দ্রুত চেকলিস্ট

- [ ] আপনার Render Backend URL খুঁজেছেন (https://... এ শেষ হয়)
- [ ] admin_panel/config.js এ URL দিয়েছেন
- [ ] frontend/config.js এ URL দিয়েছেন
- [ ] git push করেছেন
- [ ] Vercel এ নতুন বিল্ড দেখেছেন
- [ ] Backend সঠিকভাবে চলছে (Render এ স্থিতি: "running")

---

## যদি এখনও কাজ না করে

### 1. Browser Console খুলুন (F12)

মেসেজ দেখুন:
```
[Frontend Config] API_BASE: https://nurulquranmadrasha-backend.onrender.com
[Admin Config] API_BASE: https://nurulquranmadrasha-backend.onrender.com
```

URL সঠিক কিনা দেখুন।

### 2. নেটওয়ার্ক ট্যাব চেক করুন

অ্যাডমিন প্যানেলে ব্যবহারকারী যোগ করার সময় দেখুন:
- **Request URL**: https://nurulquranmadrasha-backend.onrender.com/api/users
- **Status**: 200 (সফল) বা 401 (অথেন্টিকেশন)

### 3. Backend সার্ভার লগ দেখুন

Render এ:
1. আপনার Backend সার্ভিস খুলুন
2. **Logs** ট্যাব দেখুন
3. API কল পাচ্ছে কিনা দেখুন

---

## উদাহরণ

### সফল সেটআপ

```
Frontend: https://nurulquranmadrasha.vercel.app/
Admin Panel: https://admin.nurulquranmadrasha.vercel.app/admin_panel/admin.html
Backend: https://nurulquranmadrasha-backend.onrender.com

[Frontend Config] API_BASE: https://nurulquranmadrasha-backend.onrender.com
[Admin Config] API_BASE: https://nurulquranmadrasha-backend.onrender.com

নতুন ব্যবহারকারী যোগ করার সময়:
POST https://nurulquranmadrasha-backend.onrender.com/api/users
Response: 200 OK ✅
```

---

## মনে রাখবেন

- **কখনও Render URL hardcode করবেন না** (পরিবর্তন হতে পারে)
- **Frontend এবং Admin Panel উভয়ে একই URL থাকতে হবে**
- **Render Backend সবসময় চলমান থাকতে হবে** (প্রয়োজনে paid plan)
- **CORS ত্রুটি থাকলে Backend logs দেখুন**

---

সবকিছু সেট হয়েছে। এখন আপনার ফ্রন্টএন্ড থেকে লগইন করুন এবং এডমিন প্যানেল ব্যবহার করুন।
