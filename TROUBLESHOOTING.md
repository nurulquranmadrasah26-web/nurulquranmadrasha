# 🔧 সমস্যা সমাধান গাইড

এই ফাইলে সব সাধারণ সমস্যা এবং তাদের সমাধান আছে।

---

## ❌ "সার্ভারের সাথে সংযোগ করা যায়নি" (এডমিন প্যানেলে নতুন ব্যবহারকারী যোগ করার সময়)

### কারণ সমূহ:

1. **Backend সার্ভার চলছে না**
2. **API URL ভুল (config.js)**
3. **CORS ব্লক করা হয়েছে**
4. **MongoDB সংযুক্ত নয়**

### ✅ সমাধান ধাপে ধাপে:

#### পদক্ষেপ ১: Backend চেক করুন

```bash
# Backend ডিরেক্টরিতে যান
cd backend

# .env.local অথবা .env.production আছে কিনা দেখুন
ls -la .env*

# MONGODB_URI আছে কিনা যাচাই করুন
echo $MONGODB_URI
```

যদি `.env` ফাইল না থাকে:
```bash
cp ../.env.example .env.local
# এবং MONGODB_URI সম্পাদনা করুন
```

#### পদক্ষেপ ২: Backend সার্ভার স্টার্ট করুন

```bash
npm start
```

আউটপুট দেখতে হবে:
```
[db] MongoDB connected
[api] listening on :5000
```

#### পদক্ষেপ ৩: Health Check চালান

```bash
node healthcheck.js
```

সফল হলে দেখাবে:
```
✅ সার্ভার সাড়া দিয়েছে: 200
📊 ডাটাবেস স্থিতি: ✅ সংযুক্ত
✨ সবকিছু সঠিক আছে!
```

#### পদক্ষেপ ৪: API URL চেক করুন

**admin_panel/config.js** খুলুন এবং দেখুন:

```javascript
var getAPIBase = function() {
  if (isLocal) return "http://localhost:5000";  // ✅ এটি সঠিক হওয়া উচিত
  return "https://nurulquranmadrasha-api.onrender.com";
};
```

**Production এ**: আপনার প্রকৃত API সার্ভার URL দিয়ে প্রতিস্থাপন করুন।

#### পদক্ষেপ ৫: Browser Console দেখুন

1. এডমিন পেজ খুলুন
2. **F12** বা **Right Click > Inspect** করুন
3. **Console** ট্যাব খুলুন
4. নতুন ব্যবহারকারী যোগ করার চেষ্টা করুন
5. Error দেখুন এবং নোট করুন

উদাহরণ error:
```
POST http://localhost:5000/api/users 404 (Not Found)
```

---

## ❌ লগইন এর পরে এডমিন প্যানেল ব্লাংক পেজ দেখাচ্ছে

### কারণ:

1. **admin.html পাথ ভুল**
2. **JavaScript লোড হচ্ছে না**
3. **auth.js ত্রুটি আছে**

### ✅ সমাধান:

#### পদক্ষেপ ১: URL যাচাই করুন

লগইন সফল হলে এই URL এ থাকতে হবে:
```
http://localhost:8000/admin_panel/admin.html
অথবা
https://yourdomain.com/admin_panel/admin.html
```

**ভুল**:
```
https://yourdomain.com/admin_panel/admin.html (যখন ফ্রন্টএন্ড root এ)
```

#### পদক্ষেপ ২: frontend/config.js এডিট করুন

```javascript
// Production এ এটি সঠিক করুন:
ADMIN_URL: isLocal ? "../admin_panel/admin.html" : "./admin_panel/admin.html"
// ❌ /admin_panel/admin.html নয়!
// ✅ ./admin_panel/admin.html ব্যবহার করুন
```

#### পদক্ষেপ ৩: JavaScript Console দেখুন

1. **F12** খুলুন
2. **Console** ট্যাবে যান
3. কোনো red error আছে কিনা দেখুন

উদাহরণ সাধারণ error:
```javascript
// Error: NQAuth is not defined
// => auth.js লোড হচ্ছে না
```

#### পদক্ষেপ ৪: HTML Structure যাচাই করুন

**admin_panel/admin.html** এ এই লাইনগুলি আছে কিনা চেক করুন:

```html
<script src="config.js"></script>
<script src="auth.js"></script>
```

এই লাইনগুলি সাধারণত `</body>` এর আগে থাকে।

---

## ❌ "ব্যবহারকারী পাওয়া যায়নি" (লগইন এর পরে)

### কারণ:

1. **DB এ ব্যবহারকারী সংরক্ষিত নয়**
2. **Token সঠিক নয়**
3. **DB সংযোগ বিচ্ছিন্ন**

### ✅ সমাধান:

#### পদক্ষেপ ১: সুপার এডমিন পুনরায় তৈরি করুন

`.env.local` এডিট করুন:

```
SEED_SUPERADMIN_UID=admin
SEED_SUPERADMIN_PASSWORD=changeme123
SEED_SUPERADMIN_NAME=সুপার এডমিন
```

এবং সার্ভার পুনরায় শুরু করুন:
```bash
npm start
```

#### পদক্ষেপ ২: MongoDB এ ম্যানুয়ালি যোগ করুন

MongoDB Atlas Dashboard এ:

```javascript
db.users.insertOne({
  name: "সুপার এডমিন",
  uid: "admin",
  passwordHash: "$2a$10$...", // bcrypt হ্যাশ
  role: "Super Admin",
  active: true,
  protected: true,
  mobile: "",
  photoUrl: "",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## ❌ MongoDB সংযোগ ব্যর্থ

### কারণ:

1. **MONGODB_URI ভুল বা মিসিং**
2. **IP Whitelist সেট নয়**
3. **ডাটাবেস পাসওয়ার্ড ভুল**

### ✅ সমাধান:

#### পদক্ষেপ ১: MongoDB Atlas যাচাই করুন

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) এ লগইন করুন
2. **Clusters** খুলুন
3. **Connect** বাটন ক্লিক করুন
4. **Connection String** কপি করুন

#### পদক্ষেপ ২: `.env.local` আপডেট করুন

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nurulquran?retryWrites=true&w=majority
```

#### পদক্ষেপ ৩: IP Whitelist যোগ করুন

1. MongoDB Atlas এ **Network Access** খুলুন
2. **+ ADD IP ADDRESS** ক্লিক করুন
3. **Allow Access from Anywhere** (development) অথবা নির্দিষ্ট IP

#### পদক্ষেপ ৪: সংযোগ পরীক্ষা করুন

```bash
node healthcheck.js
```

---

## ❌ Cloudinary ছবি আপলোড ব্যর্থ

### কারণ:

1. **CLOUDINARY_* মিসিং বা ভুল**
2. **API Key অবৈধ**

### ✅ সমাধান:

#### পদক্ষেপ ১: `.env.local` যাচাই করুন

```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### পদক্ষেপ ২: Cloudinary থেকে কপি করুন

1. [Cloudinary Dashboard](https://cloudinary.com/console) খুলুন
2. **Account Details** খুলুন
3. Cloud Name, API Key, API Secret কপি করুন

#### পদক্ষেপ ৩: Backend পুনরায় চালু করুন

```bash
npm start
```

---

## ✅ সবকিছু কাজ করছে নিশ্চিত করতে এই চেকলিস্ট ব্যবহার করুন:

- [ ] Backend সার্ভার চলছে (`npm start`)
- [ ] `http://localhost:5000/api/health` সফল (200)
- [ ] MongoDB সংযুক্ত (`node healthcheck.js`)
- [ ] `.env.local` সব ভেরিয়েবল আছে
- [ ] `config.js` API_BASE সঠিক
- [ ] Browser Console (F12) এ কোনো red error নেই
- [ ] টোকেন localStorage এ সংরক্ষিত (F12 > Application > localStorage)
- [ ] Admin panel URL সঠিক

---

## 📞 এরপরও সমস্যা হলে:

1. **সম্পূর্ণ error message নোট করুন** (Browser Console)
2. **screenshot নিন** (.env এর প্রথম অক্ষর ছাড়া)
3. **logs দেখুন**: `npm start` এর output
