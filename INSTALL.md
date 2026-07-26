# ইনস্টলেশন গাইড

## দ্রুত শুরু করুন

### 1. ব্যাকএন্ড সেটআপ

```bash
cd backend
npm install
```

`.env` ফাইল তৈরি করুন এবং এই তথ্যগুলি পূরণ করুন:

```env
# MongoDB (mongodb.com থেকে একটি ফ্রি ক্লাস্টার তৈরি করুন)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname

# JWT (নিরাপত্তার জন্য যেকোনো জটিল স্ট্রিং)
JWT_SECRET=your_random_secret_key_here_make_it_long_and_complex

# প্রথম সুপার এডমিন তৈরির জন্য
SEED_SUPERADMIN_UID=admin
SEED_SUPERADMIN_PASSWORD=Admin@2026
SEED_SUPERADMIN_NAME=সিস্টেম এডমিন

# ফ্রন্টএন্ড/এডমিন অনুমোদিত অরিজিন (CORS)
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500

# Cloudinary (cloudinary.com থেকে বিনামূল্যে অ্যাকাউন্ট তৈরি করুন)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

সার্ভার চালান:
```bash
npm start
```

সার্ভার চলবে: `http://localhost:5000`

### 2. ফ্রন্টএন্ড সেটআপ

```bash
# নতুন টার্মিনাল/কমান্ড প্রম্পটে
cd frontend

# যেকোনো লোকাল ওয়েব সার্ভার চালান
# অপশন 1: Python ব্যবহার করে
python -m http.server 5500

# অপশন 2: Node.js সার্ভার (যদি installed থাকে)
npx http-server -p 5500

# অপশন 3: VS Code Live Server এক্সটেনশন ব্যবহার করুন
```

ব্রাউজারে খুলুন: `http://localhost:5500`

### 3. এডমিন প্যানেল সেটআপ

```bash
# আরেকটি নতুন টার্মিনাল/কমান্ড প্রম্পটে
cd admin_panel

# লোকাল ওয়েব সার্ভার চালান (ভিন্ন পোর্টে)
python -m http.server 5501
# বা
npx http-server -p 5501
```

ব্রাউজারে খুলুন: `http://localhost:5501`

## লগইন করুন

### প্রথম লগইন
1. এডমিন প্যানেল খুলুন: `http://localhost:5501`
2. লগইন করুন:
   - **UID**: `admin`
   - **Password**: `Admin@2026`

### সুপার এডমিন পাসওয়ার্ড পরিবর্তন করুন
1. লগইন করার পর "ব্যবহারকারী ব্যবস্থাপনা" মডিউলে যান
2. নিজের অ্যাকাউন্ট খুঁজে বের করুন এবং সম্পাদনা করুন
3. নতুন শক্তিশালী পাসওয়ার্ড সেট করুন

## মডিউল এবং ফিচার

### ড্যাশবোর্ড
- সমস্ত মূল তথ্যের সংক্ষিপ্ত বিবরণ
- পরিসংখ্যান এবং গতিশীল ডেটা

### শিক্ষার্থী ব্যবস্থাপনা
- শিক্ষার্থী তথ্য যোগ/সম্পাদনা/মুছুন
- রোল নম্বর, ক্লাস, পিতামাতার যোগাযোগ
- ছবি আপলোড করুন

### ব্যবহারকারী ব্যবস্থাপনা
- নতুন শিক্ষক/কর্মচারী যোগ করুন
- রোল নির্ধারণ করুন (Admin, Teacher, Student, Support)
- অ্যাকাউন্ট অক্ষম/সক্ষম করুন

### অন্যান্য মডিউল
- রুটিন (ক্লাস সময়সূচী)
- পরীক্ষা (পরীক্ষার তথ্য)
- ফি (ফি পরিচালনা)
- হোমওয়ার্ক (অ্যাসাইনমেন্ট)
- বার্তা (গুরুত্বপূর্ণ নোটিশ)
- হিসাব (আর্থিক লেনদেন)

## MongoDB সেটআপ (ক্লাউড)

### MongoDB Atlas বিনামূল্যে ব্যবহার করুন

1. [mongodb.com](https://www.mongodb.com) এ যান
2. "Try Free" ক্লিক করুন
3. অ্যাকাউন্ট তৈরি করুন
4. নতুন প্রজেক্ট তৈরি করুন
5. ক্লাস্টার তৈরি করুন (Free Tier)
6. নেটওয়ার্ক অ্যাক্সেস যোগ করুন: `0.0.0.0/0` (সব জায়গা থেকে অ্যাক্সেস)
7. ডাটাবেস ইউজার তৈরি করুন
8. Connection String কপি করুন এবং `.env` এ যোগ করুন

## Cloudinary সেটআপ

1. [cloudinary.com](https://cloudinary.com) এ যান
2. বিনামূল্যে অ্যাকাউন্ট তৈরি করুন
3. ড্যাশবোর্ড খুলুন
4. API Key এবং API Secret কপি করুন
5. Cloud Name দেখুন
6. `.env` ফাইলে এই মানগুলি পূরণ করুন

## সাধারণ ত্রুটি সমাধান

### "Cannot find module 'express'"
```bash
npm install  # নিশ্চিত করুন যে আপনি backend/ ডিরেক্টরিতে আছেন
```

### "connection refused 127.0.0.1:5000"
- নিশ্চিত করুন যে ব্যাকএন্ড সার্ভার চলছে
- অন্য পোর্ট ব্যবহার করছে কিনা চেক করুন

### "MongoDB connection failed"
- `.env` এ সঠিক URI আছে কিনা চেক করুন
- ইন্টারনেট সংযোগ যাচাই করুন
- MongoDB Atlas এ IP whitelist যোগ করুন

### "CORS error"
- ফ্রন্টএন্ড URL, `.env` ফাইলের `ALLOWED_ORIGINS` এ যোগ করুন
- সার্ভার পুনরায় চালু করুন

## প্রোডাকশনে ডিপ্লয় করুন

### Vercel এ ডিপ্লয় করুন (ফ্রন্টএন্ড/এডমিন)

1. GitHub এ কোড পুশ করুন
2. [vercel.com](https://vercel.com) এ যান
3. প্রজেক্ট ইম্পোর্ট করুন
4. Root Directory সেট করুন (`frontend` বা `admin_panel`)
5. ডিপ্লয় করুন

### Render এ ডিপ্লয় করুন (ব্যাকএন্ড)

1. GitHub এ কোড পুশ করুন
2. [render.com](https://render.com) এ যান
3. নতুন Web Service তৈরি করুন
4. রিপোজিটরি কানেক্ট করুন
5. কনফিগারেশন:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - পরিবেশ ভেরিয়েবল যোগ করুন
6. ডিপ্লয় করুন

## পরবর্তী ধাপ

- সেটিংস মডিউলে স্কুলের তথ্য যোগ করুন
- কয়েকজন শিক্ষার্থী যোগ করুন
- শিক্ষক অ্যাকাউন্ট তৈরি করুন
- ক্লাস রুটিন সেট আপ করুন
- পরীক্ষা এবং ফি ব্যবস্থাপনা কনফিগার করুন

সফল সেটআপের জন্য অভিনন্দন! 🎉
