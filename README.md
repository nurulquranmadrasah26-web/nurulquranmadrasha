# নুরুল কোরআন মাদরাসা — সম্পূর্ণ ম্যানেজমেন্ট সিস্টেম

একটি সম্পূর্ণ ওয়েব-ভিত্তিক স্কুল/মাদরাসা ম্যানেজমেন্ট সিস্টেম। ফ্রন্টএন্ড, এডমিন প্যানেল এবং ব্যাকএন্ড API সহ তিন-স্তরীয় আর্কিটেকচার।

## প্রজেক্ট স্ট্রাকচার

```
nurulquranmadrasha/
├── frontend/                   # ফ্রন্টএন্ড (সার্বজনীন ওয়েবসাইট)
│   ├── index.html             # প্রধান ওয়েবসাইট (HTML)
│   ├── config.js              # ফ্রন্টএন্ড কনফিগারেশন
│   └── assets/                # ছবি এবং সম্পদ
├── admin_panel/               # এডমিন প্যানেল (শিক্ষক/কর্মচারী ব্যবস্থাপনা)
│   ├── admin.html             # এডমিন ড্যাশবোর্ড (HTML)
│   ├── auth.js                # লগইন/অথেন্টিকেশন জাভাস্ক্রিপ্ট
│   ├── config.js              # এডমিন পেনেল কনফিগারেশন
│   ├── vercel.json            # Vercel ডিপ্লয়মেন্ট কনফিগ
│   └── assets/                # ছবি এবং সম্পদ
└── backend/                   # ব্যাকএন্ড API (Express + MongoDB)
    ├── server.js              # মূল API সার্ভার
    ├── .env                   # পরিবেশ ভেরিয়েবল
    ├── .gitignore             # গিট ইগনোর ফাইল
    ├── healthcheck.js         # স্বাস্থ্য পরীক্ষা এন্ডপয়েন্ট
    ├── package.json           # Node.js প্যাকেজ কনফিগ
    └── package-lock.json      # লক ফাইল
```

## প্রযুক্তি স্ট্যাক

### ফ্রন্টএন্ড
- HTML5 + CSS3 + Vanilla JavaScript
- Responsive Design (মোবাইল-ফার্স্ট)
- বাংলা টাইপোগ্রাফি সাপোর্ট

### এডমিন প্যানেল
- HTML5 + CSS3 + Vanilla JavaScript
- JWT-ভিত্তিক অথেন্টিকেশন
- রোল-ভিত্তিক অ্যাক্সেস কন্ট্রোল (RBAC)

### ব্যাকএন্ড
- **Node.js + Express.js** - ওয়েব ফ্রেমওয়ার্ক
- **MongoDB + Mongoose** - ডেটাবেস এবং ODM
- **JWT** - টোকেন-ভিত্তিক অথেন্টিকেশন
- **Bcrypt** - পাসওয়ার্ড হ্যাশিং
- **Cloudinary** - ইমেজ আপলোড এবং স্টোরেজ
- **CORS** - ক্রস-অরিজিন রিসোর্স শেয়ারিং

## সেটআপ এবং ইনস্টলেশন

### প্রয়োজনীয়তা
- Node.js >= 18
- MongoDB অ্যাকাউন্ট
- Cloudinary অ্যাকাউন্ট (ছবি আপলোডের জন্য)

### ব্যাকএন্ড সেটআপ

1. **ডিপেন্ডেন্সি ইনস্টল করুন:**
```bash
cd backend
npm install
```

2. **পরিবেশ ভেরিয়েবল সেট করুন (.env ফাইল):**
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key-here
SEED_SUPERADMIN_UID=admin_user_id
SEED_SUPERADMIN_PASSWORD=admin_password
SEED_SUPERADMIN_NAME=Admin Name
ALLOWED_ORIGINS=http://localhost:5500,https://yourdomain.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

3. **সার্ভার চালান:**
```bash
npm start           # প্রোডাকশন
npm run dev        # ডেভেলপমেন্ট (ওয়াচ মোড)
```

সার্ভার চলবে: `http://localhost:5000`

### ফ্রন্টএন্ড সেটআপ

1. **লোকাল ওয়েব সার্ভার চালান (Live Server বা সিমিলার টুল):**
```bash
cd frontend
# Live Server ব্যবহার করুন বা:
python -m http.server 5500
```

অ্যাক্সেস করুন: `http://localhost:5500`

### এডমিন প্যানেল সেটআপ

1. **লোকাল ওয়েব সার্ভার চালান:**
```bash
cd admin_panel
python -m http.server 5500  # বা অন্য পোর্ট
```

## এন্ডপয়েন্ট এবং API রেফারেন্স

### অথেন্টিকেশন

#### লগইন
```
POST /api/auth/login
Body: { uid: "user_id", password: "password" }
Response: { token: "jwt_token", user: {...} }
```

#### বর্তমান ব্যবহারকারী
```
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: { id, name, uid, role, perms, photoUrl }
```

### ব্যবহারকারী ব্যবস্থাপনা

#### সব ব্যবহারকারী
```
GET /api/users
```

#### নতুন ব্যবহারকারী তৈরি করুন
```
POST /api/users
Body: { name, uid, mobile, password, role, photoUrl }
```

#### ব্যবহারকারী আপডেট করুন
```
PUT /api/users/:id
Body: { name, uid, mobile, password, role, photoUrl }
```

#### অ্যাকাউন্ট স্ট্যাটাস টগল করুন
```
PATCH /api/users/:id/status
```

#### ব্যবহারকারী মুছুন
```
DELETE /api/users/:id
```

### শিক্ষার্থী ব্যবস্থাপনা

#### সব শিক্ষার্থী
```
GET /api/students
```

#### নতুন শিক্ষার্থী যোগ করুন
```
POST /api/students
Body: { name, rollNo, className, fatherName, motherName, mobileNo, address, photoUrl }
```

#### শিক্ষার্থী আপডেট করুন
```
PUT /api/students/:id
```

#### শিক্ষার্থী মুছুন
```
DELETE /api/students/:id
```

### ছবি আপলোড

```
POST /api/upload
Header: Authorization: "Bearer <token>"
Form Data: image (file), folder (optional)
Response: { url: "cloudinary_url", publicId: "public_id" }
```

### জেনেরিক ডেটা স্টোর (এডমিন প্যানেল ডেটা)

#### কীভাবে ডেটা সংরক্ষণ/লোড করতে হয়

```
GET /api/store/:key           # কী থেকে ডেটা পান
PUT /api/store/:key          # কী-তে ডেটা সংরক্ষণ করুন
PUT /api/store               # একাধিক কী ব্যাপক আপডেট

GET /api/store               # সব কী হিসাবে অবজেক্ট পান
```

## রোল এবং অনুমতি (RBAC)

| রোল | মডিউল অ্যাক্সেস |
|------|------------------|
| Super Admin | সব মডিউল (*) |
| Admin | ড্যাশবোর্ড, শিক্ষার্থী, স্টাফ, ফি, পরীক্ষা, রুটিন, হিসাব, সেটিংস, হোমওয়ার্ক, বার্তা, ব্যবহারকারী ব্যবস্থাপনা |
| Teacher | ড্যাশবোর্ড, শিক্ষার্থী, পরীক্ষা, রুটিন, হোমওয়ার্ক, বার্তা |
| Student | ড্যাশবোর্ড, শিক্ষার্থী, পরীক্ষা, রুটিন, হোমওয়ার্ক, ফি |
| Support | ড্যাশবোর্ড, সেটিংস, বার্তা, ব্যবহারকারী |

## ডিপ্লয়মেন্ট গাইড

### ব্যাকএন্ড (Render.com বা অন্যত্র)

1. Render একাউন্ট তৈরি করুন
2. নতুন Web Service তৈরি করুন
3. GitHub রিপোজিটরি কানেক্ট করুন
4. বিল্ড কমান্ড: `npm install`
5. স্টার্ট কমান্ড: `npm start`
6. পরিবেশ ভেরিয়েবল সেট করুন
7. ডিপ্লয় করুন

### ফ্রন্টএন্ড (Vercel)

1. Vercel একাউন্ট তৈরি করুন
2. GitHub রিপোজিটরি ইম্পোর্ট করুন
3. Root Directory: `frontend`
4. ডিপ্লয় করুন

### এডমিন প্যানেল (Vercel)

1. GitHub রিপোজিটরি ইম্পোর্ট করুন
2. Root Directory: `admin_panel`
3. ডিপ্লয় করুন

## কনফিগারেশন

### frontend/config.js
```javascript
window.APP_CONFIG = {
  API_BASE: "http://localhost:5000",      // ব্যাকএন্ড API URL
  ADMIN_URL: "../admin_panel/admin.html"  // এডমিন পেনেল URL
}
```

### admin_panel/config.js
```javascript
window.APP_CONFIG = {
  API_BASE: "http://localhost:5000",      // ব্যাকএন্ড API URL
  LOGIN_URL: "../frontend/index.html"     // লগইন পেজ URL
}
```

## লগইন শংসাপত্র

### প্রথম সুপার এডমিন (শুধুমাত্র প্রথম চালু সময়)
- **UID**: `nqsuperadmin`
- **Password**: `NQadmin@2026#Secure`

প্রথম লগইনের পর পাসওয়ার্ড পরিবর্তন করুন!

## সাধারণ সমস্যা সমাধান

### "MongoDB connection failed"
- MongoDB URI সঠিক কিনা চেক করুন
- নেটওয়ার্ক অ্যাক্সেস সক্ষম করুন (MongoDB Atlas)

### "CORS error"
- `ALLOWED_ORIGINS` এ আপনার ডোমেইন যোগ করুন
- স্থানীয় পরীক্ষার জন্য `http://localhost` যোগ করুন

### "Cloudinary upload fails"
- API কী এবং গোপন কী সঠিক কিনা যাচাই করুন
- ইমেজ সাইজ 8MB এর নিচে থাকা উচিত

## নিরাপত্তা টিপস

1. **.env ফাইল গিটে কমিট করবেন না**
2. **শক্তিশালী পাসওয়ার্ড ব্যবহার করুন**
3. **JWT_SECRET পরিবর্তন করুন** (প্রোডাকশনে অনন্য করুন)
4. **HTTPS ব্যবহার করুন** (প্রোডাকশনে)
5. **নিয়মিত ব্যাকআপ নিন**

## সাপোর্ট এবং যোগাযোগ

যেকোনো প্রশ্ন বা সমস্যার জন্য প্রযুক্তিগত দলের সাথে যোগাযোগ করুন।

---

**সংস্করণ**: 1.0.0  
**শেষ আপডেট**: জুলাই ২০২৬
