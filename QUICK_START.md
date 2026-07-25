# ⚡ দ্রুত শুরু করুন (5 মিনিট)

## 1️⃣ ডাউনলোড করুন এবং এক্সট্র্যাক্ট করুন

```bash
tar -xzf nurulquranmadrasha-fixed.tar.gz
cd v0-project/backend
```

## 2️⃣ Environment Variables সেটআপ করুন

```bash
# MongoDB URI এবং অন্যান্য সেটিংস সহ একটি .env.local ফাইল তৈরি করুন
cp ../.env.example .env.local

# এডিট করুন এবং এই তিনটি মুখ্য ভেরিয়েবল পূরণ করুন:
# 1. MONGODB_URI=mongodb+srv://... (MongoDB Atlas থেকে)
# 2. JWT_SECRET=... (openssl rand -base64 32 থেকে)
# 3. CLOUDINARY_* (Cloudinary থেকে)
```

## 3️⃣ Backend চালু করুন

```bash
npm install
npm start
```

**আপনি দেখবেন**:
```
[db] MongoDB connected
[api] listening on :5000
```

✅ এটি কাজ করছে মানে OK!

## 4️⃣ Frontend চালু করুন (নতুন টার্মিনালে)

```bash
cd frontend
python -m http.server 8000
# অথবা: npx http-server -p 8000
```

## 5️⃣ লগইন করুন

**ব্রাউজার এ**: `http://localhost:8000`

**লগইন করুন**:
- আইডি: `admin`
- পাসওয়ার্ড: `changeme123`

## 6️⃣ নতুন ব্যবহারকারী যোগ করুন

1. এডমিন প্যানেলে যান
2. **ব্যবহারকারী** > **নতুন ব্যবহারকারী**
3. ফর্ম পূরণ করুন এবং সংরক্ষণ করুন
4. **সাফল্য!** ✅

---

## 🆘 কাজ করছে না?

### সমস্যা: "সার্ভারের সাথে সংযোগ করা যায়নি"

```bash
# Backend যাচাই করুন
cd backend
node healthcheck.js

# আউটপুট দেখতে হবে:
# ✅ সার্ভার সাড়া দিয়েছে: 200
# 📊 ডাটাবেস স্থিতি: ✅ সংযুক্ত
```

### সমস্যা: "ব্লাংক এডমিন পেজ"

Browser Console খুলুন (**F12**) এবং red error খুঁজুন।

সাধারণত এটি API URL সম্পর্কে।

---

## 📚 সম্পূর্ণ গাইড

- **README.md** - সম্পূর্ণ ডকুমেন্টেশন
- **TROUBLESHOOTING.md** - বিস্তারিত সমাধান
- **FIXES_APPLIED.md** - কী কী ফিক্স করা হয়েছে

---

**হ্যাপি কোডিং! 🎉**
