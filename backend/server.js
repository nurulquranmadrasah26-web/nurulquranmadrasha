/**
 * নুরুল কোরআন মাদরাসা — Backend API
 * Express + MongoDB (Mongoose) + JWT Auth + Role Based Access Control (RBAC)
 * + Cloudinary image upload + generic data store for the admin panel.
 *
 * Deploy target: Render (Web Service)
 * Start:  node server.js   (or: npm start)
 */

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

const app = express();

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "MySuperSecretKey_2026_X9A7Bt8LmN5YQr";
const MONGODB_URI = process.env.MONGODB_URI;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ------------------------------------------------------------------ */
/*  Middleware                                                         */
/* ------------------------------------------------------------------ */
app.use(express.json({ limit: "12mb" }));

app.use(
  cors({
    origin(origin, cb) {
      // allow requests with no origin (curl / mobile / same-origin)
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.length === 0) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      // Allow any *.vercel.app preview/production deployment
      if (/\.vercel\.app$/.test(new URL(origin).hostname)) return cb(null, true);
      // Allow localhost and 127.0.0.1
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

/* ------------------------------------------------------------------ */
/*  DB readiness gate                                                  */
/*  সার্ভার আগে চালু হয়, ডাটাবেস ব্যাকগ্রাউন্ডে কানেক্ট হয়।            */
/*  ফলে Render-এ cold start-এ health/স্ট্যাটিক রেসপন্স সাথে সাথে আসে।   */
/* ------------------------------------------------------------------ */
let dbReady = null;

function connectDb() {
  return mongoose.connect(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    autoIndex: process.env.NODE_ENV !== "production",
  });
}

app.use(async (req, res, next) => {
  // ডাটাবেস ছাড়াই উত্তর দেওয়া যায় এমন রুট
  if (req.path === "/" || req.path === "/api/health" || req.method === "OPTIONS") return next();
  if (mongoose.connection.readyState === 1) return next();
  try {
    if (!dbReady) dbReady = connectDb();
    await dbReady;
    next();
  } catch (e) {
    dbReady = null;
    res.status(503).json({ message: "ডাটাবেস সংযোগ পাওয়া যাচ্ছে না, আবার চেষ্টা করুন" });
  }
});

/* ------------------------------------------------------------------ */
/*  Roles & Permissions                                                */
/* ------------------------------------------------------------------ */
/**
 * Each admin-panel module is a "permission key". A role maps to the set of
 * modules it may access. "*" means every module.
 *
 * Modules:
 *  dash      -> ড্যাশবোর্ড
 *  student   -> শিক্ষার্থী
 *  staff     -> স্টাফ
 *  fee       -> ফি
 *  exam      -> পরীক্ষা
 *  routine   -> ক্লাস রুটিন
 *  accounts  -> হিসাব
 *  others    -> অন্যান্য (সাইট প্যানেল/সেটিংস)
 *  homework  -> বাড়ির কাজ
 *  inventory -> ইনভেন্টরি
 *  message   -> ম্যাসেজ
 *  users     -> ব্যবহারকারী ব্যবস্থাপনা
 */
const ROLE_PERMISSIONS = {
  "Super Admin": ["*"],
  Admin: [
    "dash",
    "student",
    "staff",
    "fee",
    "exam",
    "routine",
    "accounts",
    "others",
    "homework",
    "message",
    "users",
  ],
  Teacher: ["dash", "student", "staff", "fee", "exam", "routine", "homework", "inventory", "others", "message"],
  Student: ["dash", "student", "exam", "routine", "homework", "fee"],
  Support: ["dash", "others", "message", "users"],
};

// Whether the role may create/update/delete inside the users module.
const USER_MANAGERS = ["Super Admin", "Admin"];

function permissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || ["dash"];
}

/* ------------------------------------------------------------------ */
/*  Schemas                                                            */
/* ------------------------------------------------------------------ */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    uid: { type: String, required: true, unique: true, trim: true }, // login id
    mobile: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["Super Admin", "Admin", "Teacher", "Student", "Support"],
      required: true,
    },
    photoUrl: { type: String, default: "" },
    active: { type: Boolean, default: true },
    protected: { type: Boolean, default: false }, // seed accounts cannot be deleted
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// Student schema (শিক্ষার্থী তথ্য সংরক্ষণ)
const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rollNo: { type: String, required: true },
    className: { type: String, required: true },
    branch: { type: String, default: "" },
    session: { type: String, default: "" },
    fatherName: { type: String, default: "" },
    motherName: { type: String, default: "" },
    mobileNo: { type: String, default: "" },
    address: { type: String, default: "" },
    admissionDate: { type: Date, default: Date.now },
    photoUrl: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const Student = mongoose.model("Student", studentSchema);

// Message schema (ব্যবহারকারীদের মধ্যে মেসেজ)
const messageSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, default: "" },
    body: { type: String, required: true },
    read: { type: Boolean, default: false },
    // প্রেরকের অতিরিক্ত তথ্য (শিক্ষার্থীর আইডি, শ্রেণী, রোল ইত্যাদি)
    senderInfo: { type: mongoose.Schema.Types.Mixed, default: null },
    // কোন মেসেজের উত্তর
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
  },
  { timestamps: true }
);
const Message = mongoose.model("Message", messageSchema);

// Generic store: one document per (collection) holding the admin panel data array.
const storeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
);
const Store = mongoose.model("Store", storeSchema);

// ওয়েবসাইটের যোগাযোগ ফর্ম থেকে আসা বার্তা
const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    subject: { type: String, default: "" },
    message: { type: String, required: true },
    ip: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const ContactMessage = mongoose.model("ContactMessage", contactSchema);

/* ------------------------------------------------------------------ */
/*  Auth helpers                                                       */
/* ------------------------------------------------------------------ */
function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      name: user.name,
      uid: user.uid,
      role: user.role,
      perms: permissionsForRole(user.role),
    },
    JWT_SECRET,
    { expiresIn: "12h" }
  );
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "লগইন প্রয়োজন" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ message: "সেশন মেয়াদোত্তীর্ণ, আবার লগইন করুন" });
  }
}

// Require that the logged-in user has a given module permission.
function requirePerm(mod) {
  return (req, res, next) => {
    const perms = req.user.perms || [];
    if (perms.includes("*") || perms.includes(mod)) return next();
    return res.status(403).json({ message: "এই অংশে প্রবেশের অনুমতি নেই" });
  };
}

/**
 * ডিফল্ট শিক্ষার্থী তালিকা — "শিক্ষার্থীর তালিকা (2).xls" থেকে নেওয়া
 */
const DEFAULT_STUDENTS = [
  {
    "name": "মোঃ আজিম",
    "rollNo": "1",
    "className": "নার্সারী",
    "branch": "নুরানি",
    "session": "২০২৬",
    "fatherName": "মোঃ আপেল আলী",
    "motherName": "েমাসাঃ আদরী খাতুন",
    "mobileNo": "01726736416",
    "address": "হরিপুর, ভূঁইশালপাড়া, চৌহদ্দীটোলা, চাঁপাইনবাবগঞ্জ"
  },
  {
    "name": "মোঃ আব্দুর রহমান",
    "rollNo": "2",
    "className": "নার্সারী",
    "branch": "নুরানি",
    "session": "২০২৭",
    "fatherName": "মোঃ রাকিবুল হাসান",
    "motherName": "মোসাঃ মিম আখতার",
    "mobileNo": "01739530343",
    "address": "হরিপুর, ভূঁইশালপাড়া, চৌহদ্দীটোলা, চাঁপাইনবাবগঞ্জ"
  },
  {
    "name": "মাহাবুব হোসেন",
    "rollNo": "3",
    "className": "নার্সারী",
    "branch": "নুরানি",
    "session": "২০২৬",
    "fatherName": "মোহাঃ রুবেল",
    "motherName": "মোসাঃ হালিমা  খাতুন",
    "mobileNo": "01779331989",
    "address": "হরিপুর সাহাপাড়া"
  },
  {
    "name": "আব্দুর রউফ",
    "rollNo": "4",
    "className": "নার্সারী",
    "branch": "নুরানি",
    "session": "২০২৬",
    "fatherName": "রাকিব আলি",
    "motherName": "হাবিবা খাতুন",
    "mobileNo": "01305450714",
    "address": "হরিপুর সাহাপাড়া"
  },
  {
    "name": "আবু বক্কর সিদ্দিক",
    "rollNo": "5",
    "className": "নার্সারী",
    "branch": "নুরানি",
    "session": "২০২৬",
    "fatherName": "শামীম হোসেন",
    "motherName": "আক্তারা খাতুন",
    "mobileNo": "01929975550",
    "address": "হরিপুর"
  },
  {
    "name": "আকতারুজ্জামান নিরব",
    "rollNo": "6",
    "className": "নার্সারী",
    "branch": "নুরানি",
    "session": "২০২৬",
    "fatherName": "শামীম হোসেন",
    "motherName": "আকতারা খাতুন",
    "mobileNo": "01929975550",
    "address": "হরিপুর"
  },
  {
    "name": "সাফিন আহমেদ শিশির",
    "rollNo": "7",
    "className": "প্রথম",
    "branch": "নুরানি",
    "session": "২০২৬",
    "fatherName": "ফিরোজ কবির",
    "motherName": "শিরিন শিলা",
    "mobileNo": "০১৮১৯২২৫৩৯৬",
    "address": "হরিপুর"
  },
  {
    "name": "আবরার মাহির",
    "rollNo": "8",
    "className": "নার্সারী",
    "branch": "নুরানি",
    "session": "২০২৬",
    "fatherName": "আশরাফুর হক",
    "motherName": "মোসাঃ মরিয়ম নেশা",
    "mobileNo": "01750208470",
    "address": "হরিপুর ভুইশালপাড়া"
  },
  {
    "name": "ইয়ামিন আহমেদ",
    "rollNo": "9",
    "className": "প্রথম",
    "branch": "নুরানি",
    "session": "২০২৬",
    "fatherName": "মোঃ শফিকুল ইসলাম",
    "motherName": "মোসাঃ মমতাজ মহাল",
    "mobileNo": "01797392681",
    "address": "হরিপুর সাহাপাড়া"
  },
  {
    "name": "আব্দুর রহিম",
    "rollNo": "11",
    "className": "প্রথম",
    "branch": "নুরানি",
    "session": "২০২৬",
    "fatherName": "রজব আলী",
    "motherName": "মোসাঃ খাতিজা খাতুন",
    "mobileNo": "01325366405",
    "address": "শিবপুর ফুলতলামোড়"
  },
  {
    "name": "আব্দুর রহমান",
    "rollNo": "12",
    "className": "নার্সারী",
    "branch": "নুরানি",
    "session": "২০২৬",
    "fatherName": "জাহাঙ্গীর আলম",
    "motherName": "মাসরুফা তাসলিমা  সুমি",
    "mobileNo": "01724594622",
    "address": "হরিপুর সাহাপাড়া"
  },
  {
    "name": "আরহাম বারী আয়াস",
    "rollNo": "13",
    "className": "নার্সারী",
    "branch": "নুরানি",
    "session": "২০২৬",
    "fatherName": "আজিজুল বারী",
    "motherName": "নাসরিন আক্তার",
    "mobileNo": "01723591966",
    "address": "হরিপুর মহালদার পাড়া"
  },
  {
    "name": "আয়মান জাহান সোহানা",
    "rollNo": "14",
    "className": "নার্সারী",
    "branch": "নুরানি",
    "session": "২০২৬",
    "fatherName": "আসাদুজ্জামান",
    "motherName": "রোজী আকতার",
    "mobileNo": "01765139694",
    "address": "মহালদারপাড়া"
  },
  {
    "name": "আনিসা আখতার জুঁই",
    "rollNo": "15",
    "className": "নাজেরা বালিকা",
    "branch": "বালিকা",
    "session": "২০২৬",
    "fatherName": "আরিফুল ইসলাম",
    "motherName": "মোসাঃ জান্নাতুন ফেরদাউস",
    "mobileNo": "01713718970",
    "address": "সংকরবাটি, বটতলাহাট, চাঁপাইনবাবগঞ্জ সদর"
  },
  {
    "name": "মোসাঃ হালিমাতুস্সাদিয়া",
    "rollNo": "16",
    "className": "হেফজ বালিকা",
    "branch": "বালিকা",
    "session": "২০২৬",
    "fatherName": "মোঃ আব্দুল হাকিম",
    "motherName": "মোসাঃ জান্নাতুন",
    "mobileNo": "01796469198",
    "address": "ফুলবাগান, বটতলা হাট, চাঁপাইনবাবগঞ্জ সদর"
  },
  {
    "name": "মোসাঃ হাবিবা আক্তার তিসা",
    "rollNo": "17",
    "className": "হেফজ বালিকা",
    "branch": "বালিকা",
    "session": "২০২৬",
    "fatherName": "মোঃ আব্দুল হাকিম",
    "motherName": "মোসাঃ জান্নাতুন",
    "mobileNo": "01796469198",
    "address": ""
  },
  {
    "name": "মোসাঃ সালমা আক্তার জুই",
    "rollNo": "18",
    "className": "হেফজ বালিকা",
    "branch": "বালিকা",
    "session": "২০২৬",
    "fatherName": "মোঃ শাহ জামাল",
    "motherName": "মোসাঃ আয়েশা বেগম",
    "mobileNo": "01735822343",
    "address": "ফুলবাগান, বটতলা হাট, চাঁপাইনবাবগঞ্জ সদর"
  },
  {
    "name": "আবু সুফিয়ান",
    "rollNo": "19",
    "className": "প্রথম",
    "branch": "নুরানি",
    "session": "২০২৬",
    "fatherName": "মোঃ সুজন মিয়া",
    "motherName": "মোসাঃ নিসাত তাইবা নিশা",
    "mobileNo": "হরিপুর মহাল",
    "address": "হরিপুর মহাল্দারপাড়া, চৌহদ্দীটোলা চাঁপাইনবাবগঞ্জ"
  },
  {
    "name": "মোসাঃ রিফা খাতুন",
    "rollNo": "20",
    "className": "হেফজ বালিকা",
    "branch": "বালিকা",
    "session": "২০২৬",
    "fatherName": "রানা",
    "motherName": "মোসাঃ শামলি বেগম",
    "mobileNo": "01331166786",
    "address": "কমলা কান্তপুর, রানিহাটি"
  },
  {
    "name": "মোসাঃ তামান্না খাতুন",
    "rollNo": "21",
    "className": "হেফজ বালিকা",
    "branch": "বালিকা",
    "session": "২০২৬",
    "fatherName": "মোঃতরিকুল ইসলাম",
    "motherName": "মোসাঃ পিংকি খাতুন",
    "mobileNo": "01753779818",
    "address": "ছত্রাজপুর, ছত্রাজপুর, রানিহাটি"
  },
  {
    "name": "আনিসা আক্তার জুই",
    "rollNo": "22",
    "className": "প্রথম",
    "branch": "বালিকা",
    "session": "২০২৬",
    "fatherName": "আরিফ",
    "motherName": "জান্নাতুর কলি",
    "mobileNo": "0123456789",
    "address": "ফুলবাগান, বটতলাহাট"
  },
  {
    "name": "তায়ি্যবা আক্তার মুসকান",
    "rollNo": "23",
    "className": "নার্সারী",
    "branch": "নুরানি",
    "session": "২০২৬",
    "fatherName": "মোঃ শহিদুল ইসরাম",
    "motherName": "মোসাঃ সাদিকা খাতুন",
    "mobileNo": "01725095278",
    "address": "তেলিপাড়া, পুটিয়া, রাজশাহী"
  },
  {
    "name": "সায়ীদা  তাবাসসুম",
    "rollNo": "24",
    "className": "নাজেরা বালিকা",
    "branch": "বালিকা",
    "session": "২০২৬",
    "fatherName": "শরিফুল ইসলাম সায়েদ",
    "motherName": "শামীমা আখতার মুন",
    "mobileNo": "01733129400",
    "address": "64, হরিপুর ইউপি পাড়া চৌহদ্দীটোলা, 6300, ওয়র্ড নং 5 চাঁপাইনবাবগঞ্জ সদর"
  },
  {
    "name": "নাদিয়া আক্তার মাইশা",
    "rollNo": "28",
    "className": "নার্সারী",
    "branch": "নুরানি",
    "session": "২০২৬",
    "fatherName": "মোঃ শাহাবুল আলম",
    "motherName": "মোসাঃ সালমা খাতুন",
    "mobileNo": "01779064958",
    "address": "৪১/২ হরিপুর ভুঁইশাল পাড়া, চৌহহদ্দীটোল, চাঁপাইনবাবগঞ্জ"
  },
  {
    "name": "মোঃ সাদিক",
    "rollNo": "29",
    "className": "প্রথম",
    "branch": "নুরানি",
    "session": "২০২৬",
    "fatherName": "মোঃ শাহাবুল আলম",
    "motherName": "মোসাঃ সালমা খাতুন",
    "mobileNo": "01779064958",
    "address": "৪১/২ হরিপুর ভুঁইশাল পাড়া, চৌহহদ্দীটোল, চাঁপাইনবাবগঞ্জ"
  }
];

/* সিড সংস্করণ — বদলালে পুরোনো শিক্ষার্থী/শিক্ষক ডেটা মুছে নতুন তালিকা বসে */
const STUDENT_SEED_VERSION = "xls-2026-v1";

/**
 * পুরোনো সব শিক্ষার্থী ও শিক্ষক মুছে নতুন তালিকা বসানো হয় (প্রতি সংস্করণে একবার)
 */
async function seedDefaultStudents() {
  const marker = await Store.findOne({ key: "__seed_students_version" }).lean();
  if (marker && marker.data === STUDENT_SEED_VERSION) return;

  // ── ১) পুরোনো শিক্ষার্থী ও শিক্ষক ডেটা সম্পূর্ণ মুছে ফেলা ──
  await Student.deleteMany({});
  await User.deleteMany({ role: { $in: ["Student", "Teacher"] } });
  await Promise.all(
    [
      "students",
      "teachers",
      "attendance",
      "attendanceHistory",
      "studentDues",
      "payments",
      "paymentDetails",
      "dueDetails",
    ].map((k) => Store.findOneAndUpdate({ key: k }, { data: [] }, { upsert: true }))
  );

  // ── ২) নতুন তালিকা বসানো ──
  await Student.insertMany(DEFAULT_STUDENTS);

  // এডমিন প্যানেলের ডেটা-স্টোরেও একই তালিকা (প্যানেলের ফরম্যাটে)
  const panelStudents = DEFAULT_STUDENTS.map((s, i) => ({
    id: i + 1,
    regNo: s.rollNo,
    classRoll: s.rollNo,
    name: s.name,
    cls: s.className,
    attCls: s.className,
    attDept: s.branch || "",
    branch: s.branch || "",
    dept: s.branch || "",
    mobile: s.mobileNo,
    fee: 860,
    parent: s.fatherName,
    mother: s.motherName,
    guardianName: s.fatherName,
    guardianMobile: s.mobileNo,
    fatherMobile: s.mobileNo,
    curAddr: s.address,
    permAddr: s.address,
    session: s.session || "",
    type: "অনাবাসিক",
    status: "সক্রিয়",
  }));
  await Store.findOneAndUpdate({ key: "students" }, { data: panelStudents }, { upsert: true });
  await Store.findOneAndUpdate(
    { key: "__seed_students_version" },
    { data: STUDENT_SEED_VERSION },
    { upsert: true }
  );

  console.log(
    `[seed] ${DEFAULT_STUDENTS.length} students seeded — পুরোনো শিক্ষার্থী/শিক্ষক ডেটা মুছে ফেলা হয়েছে`
  );
}

/**
 * Seed First Super Admin
 */
async function seedSuperAdmin() {
  // .env / Render-এ SEED_SUPERADMIN_* নামে সেট করা আছে; আগে ভুলবশত
  // SUPER_ADMIN_* নাম খোঁজা হতো যা কখনো মিলতো না — তাই কোনো Super Admin
  // তৈরি হতো না এবং লগইন সবসময় ব্যর্থ হতো। এখন উভয় নাম গ্রহণ করা হচ্ছে।
  const name = process.env.SEED_SUPERADMIN_NAME || process.env.SUPER_ADMIN_NAME;
  const uid = process.env.SEED_SUPERADMIN_UID || process.env.SUPER_ADMIN_UID;
  const pass = process.env.SEED_SUPERADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD;

  if (!name || !uid || !pass) {
    console.warn(
      "[seed] SEED_SUPERADMIN_NAME, SEED_SUPERADMIN_UID, SEED_SUPERADMIN_PASSWORD missing"
    );
    return;
  }

  // If this uid already exists, or any Super Admin already exists, skip.
  const existing = await User.findOne({ uid });
  if (existing) return;

  const anySuper = await User.countDocuments({
    role: "Super Admin",
  });

  if (anySuper > 0) return;

  const passwordHash = await bcrypt.hash(pass, 10);

  await User.create({
    name,
    uid,
    passwordHash,
    role: "Super Admin",
    active: true,
    protected: true,
  });

  console.log(
    `[seed] First Super Admin created -> uid: ${uid}`
  );
}
/* ------------------------------------------------------------------ */
/*  Routes: health                                                     */
/* ------------------------------------------------------------------ */
app.get("/", (_req, res) => res.json({ ok: true, service: "nurulquran-api" }));
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? "connected" : "down" })
);

/* ------------------------------------------------------------------ */
/*  Routes: auth                                                       */
/* ------------------------------------------------------------------ */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { uid, password } = req.body || {};
    if (!uid || !password)
      return res.status(400).json({ message: "আইডিি ও পাসওয়ার্ড দিন" });

    const user = await User.findOne({ uid: uid.trim() });
    if (!user) return res.status(401).json({ message: "ভুল আইডিি বা পাসওয়ার্ড" });
    if (!user.active)
      return res.status(403).json({ message: "আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "ভুল আইডিি বা পাসওয়ার্ড" });

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        uid: user.uid,
        role: user.role,
        perms: permissionsForRole(user.role),
        photoUrl: user.photoUrl,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

app.get("/api/auth/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(401).json({ message: "ব্যবহারকারী পাওয়া যায়নি" });
  if (!user.active) return res.status(403).json({ message: "অ্যাকাউন্ট নিষ্ক্রিয়" });
  res.json({
    id: user._id,
    name: user.name,
    uid: user.uid,
    role: user.role,
    perms: permissionsForRole(user.role),
    photoUrl: user.photoUrl,
  });
});

/* ------------------------------------------------------------------ */
/*  Routes: change own password                                        */
/* ------------------------------------------------------------------ */
app.post("/api/auth/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "বর্তমান ও নতুন পাসওয়ার্ড দিন" });
    if (String(newPassword).length < 6)
      return res.status(400).json({ message: "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "ব্যবহারকারী পাওয়া যায়নি" });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(400).json({ message: "বর্তমান পাসওয়ার্ড সঠিক নয়" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

/* ------------------------------------------------------------------ */
/*  Routes: directory (messaging recipients for every logged-in user)  */
/* ------------------------------------------------------------------ */
app.get("/api/directory", auth, async (req, res) => {
  try {
    const query = { active: true, _id: { $ne: req.user.id } };
    // শিক্ষার্থী শুধু শিক্ষক/প্রশাসনের সাথে যোগাযোগ করতে পারবে
    // শিক্ষার্থী শুধুমাত্র সুপার এডমিনকে মেসেজ পাঠাতে পারবে
    if (req.user.role === "Student") query.role = "Super Admin";
    const users = await User.find(query).select("name uid role").sort({ name: 1 }).lean();
    res.json(users.map((u) => ({ id: u._id, name: u.name, uid: u.uid, role: u.role })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

/* ------------------------------------------------------------------ */
/*  Routes: image upload (Cloudinary)                                  */
/* ------------------------------------------------------------------ */
app.post("/api/upload", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "কোনো ছবি পাওয়া যায়নি" });
    const folder = (req.body && req.body.folder) || "nurulquran";
    const b64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(b64, { folder });
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "ছবি আপলোড ব্যর্থ" });
  }
});

/* ------------------------------------------------------------------ */
/*  Routes: users (RBAC protected)                                     */
/* ------------------------------------------------------------------ */
function canManage(actorRole, targetRole) {
  if (actorRole === "Super Admin") return true;
  if (actorRole === "Admin") return targetRole !== "Super Admin"; // Admin can't touch Super Admin
  return false;
}

app.get("/api/users", auth, requirePerm("users"), async (_req, res) => {
  const users = await User.find().sort({ createdAt: 1 }).lean();
  res.json(
    users.map((u) => ({
      id: u._id,
      name: u.name,
      uid: u.uid,
      mobile: u.mobile,
      role: u.role,
      photoUrl: u.photoUrl,
      active: u.active,
      protected: u.protected,
    }))
  );
});

app.post("/api/users", auth, requirePerm("users"), async (req, res) => {
  try {
    if (!USER_MANAGERS.includes(req.user.role))
      return res.status(403).json({ message: "ব্যবহারকারী তৈরির অনুমতি নেই" });

    const { name, uid, mobile, password, role, photoUrl } = req.body || {};
    if (!name || !uid || !password || !role)
      return res.status(400).json({ message: "প্রয়োজনীয় তথ্য দিন" });
    if (!ROLE_PERMISSIONS[role])
      return res.status(400).json({ message: "অবৈধ রোল" });
    if (!canManage(req.user.role, role))
      return res.status(403).json({ message: "এই রোলের ব্যবহারকারী তৈরির অনুমতি নেই" });

    const exists = await User.findOne({ uid: uid.trim() });
    if (exists) return res.status(409).json({ message: "এই আইডিইতিমধ্যে ব্যবহৃত" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      uid: uid.trim(),
      mobile: mobile || "",
      passwordHash,
      role,
      photoUrl: photoUrl || "",
      active: true,
    });
    res.status(201).json({ id: user._id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

app.put("/api/users/:id", auth, requirePerm("users"), async (req, res) => {
  try {
    if (!USER_MANAGERS.includes(req.user.role))
      return res.status(403).json({ message: "সম্পাদনার অনুমতি নেই" });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "পাওয়া যায়নি" });
    if (!canManage(req.user.role, user.role))
      return res.status(403).json({ message: "এই ব্যবহারকারী সম্পাদনার অনুমতি নেই" });

    const { name, uid, mobile, password, role, photoUrl } = req.body || {};
    if (role && !canManage(req.user.role, role))
      return res.status(403).json({ message: "এই রোল নির্ধারণের অনুমতি নেই" });

    if (name) user.name = name;
    if (uid) user.uid = uid.trim();
    if (mobile !== undefined) user.mobile = mobile;
    if (role) user.role = role;
    if (photoUrl !== undefined) user.photoUrl = photoUrl;
    if (password) user.passwordHash = await bcrypt.hash(password, 10);

    await user.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

app.patch("/api/users/:id/status", auth, requirePerm("users"), async (req, res) => {
  try {
    if (!USER_MANAGERS.includes(req.user.role))
      return res.status(403).json({ message: "অনুমতি নেই" });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "পাওয়া যায়নি" });
    if (user.protected)
      return res.status(400).json({ message: "এই অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না" });
    if (!canManage(req.user.role, user.role))
      return res.status(403).json({ message: "অনুমতি নেই" });
    user.active = !user.active;
    await user.save();
    res.json({ active: user.active });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

app.delete("/api/users/:id", auth, requirePerm("users"), async (req, res) => {
  try {
    if (!USER_MANAGERS.includes(req.user.role))
      return res.status(403).json({ message: "মুছে ফেলার অনুমতি নেই" });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "পাওয়া যায়নি" });
    if (user.protected)
      return res.status(400).json({ message: "এই অ্যাকাউন্ট মুছে ফেলা যাবে না" });
    if (!canManage(req.user.role, user.role))
      return res.status(403).json({ message: "অনুমতি নেই" });
    await user.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

/* ── সুপার এডমিন: যেকোনো ব্যবহারকারী হিসেবে সরাসরি লগইন (impersonate) ── */
app.post("/api/users/:id/impersonate", auth, requirePerm("users"), async (req, res) => {
  try {
    if (req.user.role !== "Super Admin")
      return res.status(403).json({ message: "শুধুমাত্র সুপার এডমিন এই সুবিধা ব্যবহার করতে পারবেন" });

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "ব্যবহারকারী পাওয়া যায়নি" });
    if (!target.active)
      return res.status(403).json({ message: "এই অ্যাকাউন্ট নিষ্ক্রিয় — আগে সক্রিয় করুন" });
    if (String(target._id) === String(req.user.id))
      return res.status(400).json({ message: "আপনি ইতিমধ্যে এই অ্যাকাউন্টে লগইন আছেন" });

    const token = signToken(target);
    res.json({
      token,
      user: {
        id: target._id,
        name: target.name,
        uid: target.uid,
        role: target.role,
        perms: permissionsForRole(target.role),
        photoUrl: target.photoUrl,
        impersonatedBy: { id: req.user.id, name: req.user.name, uid: req.user.uid },
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

/* ------------------------------------------------------------------ */
/*  Routes: students (শিক্ষার্থী)                                      */
/* ------------------------------------------------------------------ */
app.get("/api/students", auth, async (_req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: 1 }).lean();
    res.json(students);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

app.post("/api/students", auth, async (req, res) => {
  try {
    const { name, rollNo, className, fatherName, motherName, mobileNo, address, photoUrl } = req.body || {};
    if (!name || !rollNo || !className)
      return res.status(400).json({ message: "নাম, রোল ও ক্লাস প্রয়োজন" });

    const student = await Student.create({
      name,
      rollNo,
      className,
      fatherName: fatherName || "",
      motherName: motherName || "",
      mobileNo: mobileNo || "",
      address: address || "",
      photoUrl: photoUrl || "",
      active: true,
    });
    res.status(201).json({ id: student._id, ...student.toObject() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

app.put("/api/students/:id", auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "পাওয়া যায়নি" });

    const { name, rollNo, className, fatherName, motherName, mobileNo, address, photoUrl, active } = req.body || {};
    if (name) student.name = name;
    if (rollNo) student.rollNo = rollNo;
    if (className) student.className = className;
    if (fatherName !== undefined) student.fatherName = fatherName;
    if (motherName !== undefined) student.motherName = motherName;
    if (mobileNo !== undefined) student.mobileNo = mobileNo;
    if (address !== undefined) student.address = address;
    if (photoUrl !== undefined) student.photoUrl = photoUrl;
    if (active !== undefined) student.active = active;

    await student.save();
    res.json({ ok: true, ...student.toObject() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

app.delete("/api/students/:id", auth, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: "পাওয়া যায়নি" });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

/* ------------------------------------------------------------------ */
/*  Routes: generic data store (all admin panel modules)               */
/*  GET  /api/store/:key         -> returns saved array (or [])         */
/*  PUT  /api/store/:key         -> replaces the array                  */
/*  GET  /api/store              -> returns all keys as an object       */
/* ------------------------------------------------------------------ */
const STORE_KEY_RE = /^[a-zA-Z0-9_]{1,60}$/;

app.get("/api/store", auth, async (_req, res) => {
  const docs = await Store.find().lean();
  const out = {};
  docs.forEach((d) => (out[d.key] = d.data));
  res.json(out);
});

app.get("/api/store/:key", auth, async (req, res) => {
  if (!STORE_KEY_RE.test(req.params.key))
    return res.status(400).json({ message: "অবৈধ কী" });
  const doc = await Store.findOne({ key: req.params.key }).lean();
  res.json({ key: req.params.key, data: doc ? doc.data : [] });
});

function canWriteStore(req, res, next) {
  // শিক্ষার্থী শুধু তথ্য দেখতে পারে, পরিবর্তন করতে পারে না
  if (req.user.role === "Student")
    return res.status(403).json({ message: "তথ্য পরিবর্তনের অনুমতি নেই" });
  // শিক্ষক প্যানেলের সরাসরি লেখা কেবল হাজিরা ও ফি-সংক্রান্ত কী-তে সীমিত।
  // বাড়ির কাজ/সিলেবাস/ছুটি/ফলাফল approval workflow-এর মাধ্যমে যাবে।
  if (req.user.role === "Teacher") {
    const allowed = new Set([
      "attendance",
      "attendanceHistory",
      "payments",
      "paymentDetails",
      "studentDues",
      "invProducts",
    ]);
    const key = req.params && req.params.key;
    const keys = req.body && req.body.keys ? Object.keys(req.body.keys) : [];
    if ((key && !allowed.has(key)) || (keys.length && keys.some((k) => !allowed.has(k)))) {
      return res.status(403).json({
        message: "এই তথ্য সরাসরি পরিবর্তন করা যাবে না — সুপার এডমিনের অনুমোদন প্রয়োজন",
      });
    }
  }
  return next();
}

app.put("/api/store/:key", auth, canWriteStore, async (req, res) => {
  if (!STORE_KEY_RE.test(req.params.key))
    return res.status(400).json({ message: "অবৈধ কী" });
  const data = req.body && "data" in req.body ? req.body.data : req.body;
  const doc = await Store.findOneAndUpdate(
    { key: req.params.key },
    { data },
    { upsert: true, new: true }
  );
  res.json({ ok: true, key: doc.key });
});

/* ------------------------------------------------------------------ */
/*  Public API: ওয়েবসাইটের যোগাযোগ ফর্ম (অথেন্টিকেশন ছাড়া)             */
/* ------------------------------------------------------------------ */
const contactHits = new Map(); // সরল রেট-লিমিট (প্রতি IP, ১০ মিনিটে ৫টি)

app.post("/api/public/contact", async (req, res) => {
  try {
    const ip = (req.headers["x-forwarded-for"] || req.ip || "").toString().split(",")[0].trim();
    const now = Date.now();
    const hits = (contactHits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
    if (hits.length >= 5) {
      return res.status(429).json({ message: "অনেকবার চেষ্টা করা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন" });
    }
    hits.push(now);
    contactHits.set(ip, hits);

    const str = (v, max) => String(v == null ? "" : v).trim().slice(0, max);
    const name = str(req.body && req.body.name, 120);
    const email = str(req.body && req.body.email, 160);
    const phone = str(req.body && req.body.phone, 40);
    const subject = str(req.body && req.body.subject, 200);
    const message = str(req.body && req.body.message, 4000);

    if (!name || !message) {
      return res.status(400).json({ message: "নাম এবং বার্তা প্রয়োজন" });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "সঠিক ইমেইল দিন" });
    }

    const doc = await ContactMessage.create({ name, email, phone, subject, message, ip });
    res.json({ ok: true, id: doc._id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "বার্তা পাঠাতে ব্যর্থ" });
  }
});

// অ্যাডমিন: যোগাযোগ ফর্মের বার্তা তালিকা / পড়া চিহ্নিত / মুছে ফেলা
app.get("/api/contact-messages", auth, async (_req, res) => {
  try {
    const items = await ContactMessage.find().sort({ createdAt: -1 }).limit(500).lean();
    res.json({ ok: true, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "বার্তা আনতে ব্যর্থ" });
  }
});

app.patch("/api/contact-messages/:id/read", auth, async (req, res) => {
  try {
    const doc = await ContactMessage.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!doc) return res.status(404).json({ message: "পাওয়া যায়নি" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "আপডেট করতে ব্যর্থ" });
  }
});

app.delete("/api/contact-messages/:id", auth, async (req, res) => {
  try {
    const doc = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "পাওয়া যায়নি" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "মুছতে ব্যর্থ" });
  }
});

/* ------------------------------------------------------------------ */
/*  Message API (মেসেজিং সিস্টেম)                                      */
/* ------------------------------------------------------------------ */
// পোস্ট মেসেজ (ব্যবহারকারী থেকে ব্যবহারকারীকে)
// প্রেরকের বিস্তারিত তথ্য তৈরি (শিক্ষার্থী হলে তার আইডি/শ্রেণী/রোল নম্বরসহ)
async function buildSenderInfo(user) {
  const info = { name: user.name || "", uid: user.uid || "", role: user.role || "" };
  try {
    if (user.role === "Student") {
      const me = await User.findById(user.id).lean();
      if (me) {
        info.name = me.name;
        info.uid = me.uid;
        info.mobile = me.mobile || "";
        info.photoUrl = me.photoUrl || "";
      }
      const doc = await Store.findOne({ key: "students" }).lean();
      const list = Array.isArray(doc && doc.data) ? doc.data : [];
      const st =
        list.find((x) => x && me && String(x.uid) === String(me.uid)) ||
        list.find((x) => x && me && String(x.name) === String(me.name));
      if (st) {
        info.studentId = st.id || st.uid || "";
        info.className = st.cls || st.className || "";
        info.classRoll = st.classRoll || st.roll || "";
        info.regNo = st.regNo || "";
        info.session = st.session || "";
        info.branch = st.branch || "";
        info.father = st.parent || st.fatherName || "";
        info.mobile = info.mobile || st.mobile || "";
        info.photoUrl = info.photoUrl || st.photo || "";
      }
    }
  } catch (e) {
    console.error("senderInfo তৈরিতে সমস্যা:", e);
  }
  return info;
}

app.post("/api/messages/send", auth, async (req, res) => {
  try {
    const { toUserId, subject, body } = req.body;
    if (!toUserId || !body) {
      return res.status(400).json({ message: "প্রাপক এবং বার্তা প্রয়োজন" });
    }
    
    // যাচাই করুন যে প্রাপক বিদ্যমান
    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ message: "ব্যবহারকারী পাওয়া যায়নি" });
    }

    // শিক্ষার্থী শুধুমাত্র সুপার এডমিনকে মেসেজ পাঠাতে পারবে
    if (req.user.role === "Student" && toUser.role !== "Super Admin") {
      return res
        .status(403)
        .json({ message: "শুধুমাত্র সুপার এডমিনকে মেসেজ পাঠানো যাবে" });
    }

    const msg = new Message({
      fromUserId: req.user.id,
      toUserId,
      subject: subject || "",
      body,
      senderInfo: await buildSenderInfo(req.user),
    });
    await msg.save();
    res.json({ ok: true, message: msg });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "মেসেজ পাঠাতে ব্যর্থ" });
  }
});

// আমার পাঠানো মেসেজ পান
app.get("/api/messages/sent", auth, async (req, res) => {
  try {
    const messages = await Message.find({ fromUserId: req.user.id })
      .populate("toUserId", "name uid role")
      .sort({ createdAt: -1 });
    res.json({ ok: true, messages });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "মেসেজ আনতে ব্যর্থ" });
  }
});

// আমার গৃহীত মেসেজ পান
app.get("/api/messages/inbox", auth, async (req, res) => {
  try {
    const messages = await Message.find({ toUserId: req.user.id })
      .populate("fromUserId", "name uid role")
      .sort({ createdAt: -1 });
    res.json({ ok: true, messages });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "ইনবক্স আনতে ব্যর্থ" });
  }
});

// মেসেজ পড়া হিসেবে চিহ্নিত করুন
app.patch("/api/messages/:id/read", auth, async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json({ ok: true, message: msg });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "আপডেট করতে ব্যর্থ" });
  }
});

// অপঠিত মেসেজ সংখ্যা (এডমিন প্যানেলের bell আইকনের জন্য)
app.get("/api/messages/unread-count", auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ toUserId: req.user.id, read: false });
    res.json({ ok: true, count });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

// মেসেজের উত্তর দিন (এডমিন প্যানেল থেকে শিক্ষার্থীকে)
app.post("/api/messages/:id/reply", auth, async (req, res) => {
  try {
    const body = (req.body && req.body.body ? String(req.body.body) : "").trim();
    if (!body) return res.status(400).json({ message: "বার্তা লিখুন" });

    const original = await Message.findById(req.params.id);
    if (!original) return res.status(404).json({ message: "মেসেজ পাওয়া যায়নি" });
    if (String(original.toUserId) !== String(req.user.id))
      return res.status(403).json({ message: "এই মেসেজের উত্তর দেওয়ার অনুমতি নেই" });

    const reply = new Message({
      fromUserId: req.user.id,
      toUserId: original.fromUserId,
      subject: original.subject
        ? original.subject.indexOf("Re:") === 0
          ? original.subject
          : "Re: " + original.subject
        : "উত্তর",
      body,
      replyTo: original._id,
      senderInfo: await buildSenderInfo(req.user),
    });
    await reply.save();

    original.read = true;
    await original.save();

    res.json({ ok: true, message: reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "উত্তর পাঠাতে ব্যর্থ" });
  }
});

// একটি মেসেজ মুছে ফেলা (প্রাপক)
app.delete("/api/messages/:id", auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "মেসেজ পাওয়া যায়নি" });
    if (String(msg.toUserId) !== String(req.user.id))
      return res.status(403).json({ message: "অনুমতি নেই" });
    await msg.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "মুছতে ব্যর্থ" });
  }
});

// Bulk upsert: PUT /api/store  { keys: { key1: data1, key2: data2, ... } }
// Lets the admin panel persist the entire in-memory app state (students,
// staff, fee, exam, routine, accounts, homework, message, etc.) in one call.
app.put("/api/store", auth, canWriteStore, async (req, res) => {
  try {
    const keys = (req.body && req.body.keys) || {};
    const entries = Object.entries(keys).filter(([k]) => STORE_KEY_RE.test(k));
    if (entries.length === 0) return res.json({ ok: true, saved: [] });

    await Promise.all(
      entries.map(([key, data]) =>
        Store.findOneAndUpdate({ key }, { data }, { upsert: true })
      )
    );
    res.json({ ok: true, saved: entries.map(([k]) => k) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

/* ------------------------------------------------------------------ */
/*  শিক্ষার্থীর নিজের প্রোফাইল আপডেট (student.html সেটিংস পেজ)         */
/*  - আইডি/রেজি/রোল/শ্রেণী/ফি/স্ট্যাটাস পরিবর্তন করা যাবে না           */
/*  - বাংলা অঙ্ক দিলেও ইংরেজি অঙ্কে সংরক্ষণ হবে                        */
/* ------------------------------------------------------------------ */
const STUDENT_EDITABLE_FIELDS = [
  "name",
  "mobile",
  "parent",
  "mother",
  "fatherJob",
  "fatherMobile",
  "motherJob",
  "motherMobile",
  "guardianName",
  "guardianRel",
  "guardianMobile",
  "curAddr",
  "permAddr",
  "address",
  "dob",
  "gender",
  "birthReg",
  "email",
  "bloodGroup",
  "photo",
];

// লক করা ফিল্ড (কখনোই শিক্ষার্থী পরিবর্তন করতে পারবে না)
const STUDENT_LOCKED_FIELDS = [
  "id",
  "uid",
  "regNo",
  "classRoll",
  "roll",
  "cls",
  "attCls",
  "attDept",
  "group",
  "branch",
  "session",
  "admission",
  "startMonth",
  "fee",
  "feeBreakdown",
  "status",
];

function bnDigitsToEn(v) {
  return String(v == null ? "" : v).replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
}

app.put("/api/student/profile", auth, async (req, res) => {
  try {
    if (req.user.role !== "Student")
      return res.status(403).json({ message: "শুধু শিক্ষার্থী নিজের প্রোফাইল পরিবর্তন করতে পারবে" });

    const me = await User.findById(req.user.id).lean();
    if (!me) return res.status(404).json({ message: "ব্যবহারকারী পাওয়া যায়নি" });

    const doc = await Store.findOne({ key: "students" });
    const list = Array.isArray(doc && doc.data) ? doc.data.slice() : [];
    let idx = list.findIndex((st) => st && String(st.uid) === String(me.uid));
    if (idx < 0) idx = list.findIndex((st) => st && String(st.name) === String(me.name));
    if (idx < 0) return res.status(404).json({ message: "শিক্ষার্থীর রেকর্ড পাওয়া যায়নি" });

    const body = req.body || {};
    const record = Object.assign({}, list[idx]);
    let changed = 0;
    STUDENT_EDITABLE_FIELDS.forEach((f) => {
      if (!(f in body)) return;
      let val = body[f];
      if (typeof val === "string") {
        val = bnDigitsToEn(val).trim().slice(0, f === "photo" ? 500000 : 300);
      }
      record[f] = val;
      changed++;
    });
    if (!changed) return res.status(400).json({ message: "পরিবর্তনের কোনো তথ্য পাওয়া যায়নি" });

    // লক করা ফিল্ড আগের মানেই থাকবে
    STUDENT_LOCKED_FIELDS.forEach((f) => {
      if (f in list[idx]) record[f] = list[idx][f];
      else delete record[f];
    });

    list[idx] = record;
    await Store.findOneAndUpdate({ key: "students" }, { data: list }, { upsert: true });

    // ব্যবহারকারী অ্যাকাউন্টের নাম/ছবিও সমন্বয় করা হচ্ছে
    const patch = {};
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
    if (typeof body.photo === "string" && body.photo) patch.photoUrl = body.photo;
    if (typeof body.mobile === "string") patch.mobile = bnDigitsToEn(body.mobile).trim();
    if (Object.keys(patch).length) await User.findByIdAndUpdate(req.user.id, patch);

    res.json({ ok: true, student: record });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "প্রোফাইল আপডেট ব্যর্থ" });
  }
});

/* ------------------------------------------------------------------ */
/*  Notification API (বাড়ির কাজ / বেতন / নোটিশ — অভিভাবক ও শিক্ষার্থী)  */
/* ------------------------------------------------------------------ */
const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    url: { type: String, default: "" },
    type: { type: String, default: "general" }, // homework | fee | salary | notice | general
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const Notification = mongoose.model("Notification", notificationSchema);

/* শিক্ষক → সুপার এডমিন → শিক্ষার্থী approval workflow */
const approvalRequestSchema = new mongoose.Schema(
  {
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    submittedByName: { type: String, default: "" },
    kind: {
      type: String,
      enum: ["homework", "syllabus", "leave", "result", "admission", "inventory", "notice", "exam-subject", "fee"],
      required: true,
    },
    title: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    decisionNote: { type: String, default: "" },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
const ApprovalRequest = mongoose.model("ApprovalRequest", approvalRequestSchema);

// এক শ্রেণীর হাজিরা একই দিনে একবারের বেশি নেওয়া ঠেকাতে সার্ভার-সাইড রেকর্ড।
// Super Admin বিদ্যমান রেকর্ডটি আপডেট করতে পারবেন।
const attendanceSubmissionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    date: { type: String, required: true, index: true },
    className: { type: String, default: "" },
    branch: { type: String, default: "" },
    records: { type: mongoose.Schema.Types.Mixed, default: [] },
    takenBy: { type: String, default: "" },
    takenByRole: { type: String, default: "" },
  },
  { timestamps: true }
);
const AttendanceSubmission = mongoose.model("AttendanceSubmission", attendanceSubmissionSchema);

// Web Push সাবস্ক্রিপশন (প্রতি ডিভাইস একটি)
const pushSubSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);
const PushSub = mongoose.model("PushSub", pushSubSchema);

/* web-push ঐচ্ছিক — VAPID কী না থাকলে শুধু ইন-অ্যাপ নোটিফিকেশন কাজ করবে */
let webpush = null;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
try {
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush = require("web-push");
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@nurulquran.local",
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    console.log("[push] web push সক্রিয়");
  } else {
    console.log("[push] VAPID কী নেই — শুধু ইন-অ্যাপ নোটিফিকেশন চালু");
  }
} catch (e) {
  console.warn("[push] web-push প্যাকেজ পাওয়া যায়নি:", e.message);
}

app.get("/api/push/public-key", auth, (_req, res) =>
  res.json({ key: VAPID_PUBLIC_KEY || null })
);

app.post("/api/push/subscribe", auth, async (req, res) => {
  try {
    const sub = (req.body && req.body.subscription) || req.body;
    if (!sub || !sub.endpoint) return res.status(400).json({ message: "সাবস্ক্রিপশন প্রয়োজন" });
    await PushSub.findOneAndUpdate(
      { endpoint: sub.endpoint },
      { userId: req.user.id, endpoint: sub.endpoint, keys: sub.keys || {} },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "সার্ভার ত্রুটি" });
  }
});

app.post("/api/push/unsubscribe", auth, async (req, res) => {
  const endpoint = (req.body && req.body.endpoint) || "";
  if (endpoint) await PushSub.deleteOne({ endpoint });
  res.json({ ok: true });
});

// একজন ব্যবহারকারীর কাছে পুশ পাঠানো (নীরবে ব্যর্থ হতে পারে)
async function pushToUser(userId, payload) {
  if (!webpush) return;
  const subs = await PushSub.find({ userId }).lean();
  await Promise.all(
    subs.map((s) =>
      webpush
        .sendNotification(
          { endpoint: s.endpoint, keys: s.keys },
          JSON.stringify(payload)
        )
        .catch(async (err) => {
          if (err && (err.statusCode === 404 || err.statusCode === 410)) {
            await PushSub.deleteOne({ endpoint: s.endpoint });
          }
        })
    )
  );
}

// নিজের নোটিফিকেশন তালিকা
app.get("/api/notifications", auth, async (req, res) => {
  try {
    const items = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();
    res.json({
      ok: true,
      items: items.map((n) => ({
        id: n._id,
        title: n.title,
        body: n.body,
        url: n.url,
        type: n.type,
        data: n.data || {},
        read: n.read,
        createdAt: n.createdAt,
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "নোটিফিকেশন আনতে ব্যর্থ" });
  }
});

app.patch("/api/notifications/:id/read", auth, async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, userId: req.user.id }, { read: true });
  res.json({ ok: true });
});

app.post("/api/notifications/read-all", auth, async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
  res.json({ ok: true });
});

/* নোটিফিকেশন পাঠান (শিক্ষক/অ্যাডমিন)
   body: { uids: ["01","02"], roles: ["Student"], title, body, url, type } */
app.post("/api/notifications/send", auth, canWriteStore, async (req, res) => {
  try {
    const { uids, roles, title, body, url, type } = req.body || {};
    if (!title) return res.status(400).json({ message: "শিরোনাম প্রয়োজন" });

    const or = [];
    if (Array.isArray(uids) && uids.length)
      or.push({ uid: { $in: uids.map((u) => String(u).trim()) } });
    if (Array.isArray(roles) && roles.length) or.push({ role: { $in: roles } });
    if (!or.length) return res.status(400).json({ message: "প্রাপক নির্বাচন করুন" });

    const users = await User.find({ active: true, $or: or }).select("_id").lean();
    if (!users.length) return res.json({ ok: true, sent: 0 });

    const docs = users.map((u) => ({
      userId: u._id,
      title,
      body: body || "",
      url: url || "",
      type: type || "general",
    }));
    await Notification.insertMany(docs);

    // ব্যাকগ্রাউন্ড পুশ (ব্লক করবে না)
    Promise.all(
      users.map((u) =>
        pushToUser(u._id, { title, body: body || "", url: url || "", tag: (type || "general") + "-" + Date.now() })
      )
    ).catch(() => {});

    res.json({ ok: true, sent: users.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "নোটিফিকেশন পাঠাতে ব্যর্থ" });
  }
});

/* ------------------------------------------------------------------ */
/* Teacher approval workflow                                           */
/* ------------------------------------------------------------------ */
const APPROVAL_LABELS = {
  homework: "বাড়ির কাজ",
  syllabus: "সিলেবাস",
  leave: "ছুটির আবেদন",
  result: "ফলাফলের তালিকা",
  admission: "ভর্তি আবেদন",
  inventory: "ইনভেন্টরি",
  notice: "নোটিশ",
  "exam-subject": "পরীক্ষার বিষয়",
  fee: "ফি আদায়",
};

function workflowDateBn(iso) {
  if (!iso) return "";
  const p = String(iso).slice(0, 10).split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : String(iso);
}

function workflowSummary(kind, payload) {
  const p = payload || {};
  if (kind === "homework") return `${p.className || "-"} • ${p.subject || "-"} • ${p.task || ""}`;
  if (kind === "syllabus") return `${p.className || "-"} • ${p.subjectName || "-"} • ${p.details || p.title || ""}`;
  if (kind === "leave") return `${p.studentName || "-"} • ${p.reason || "-"} • ${p.from || ""} — ${p.to || ""}`;
  if (kind === "result") return `${p.studentName || "-"} • ${p.exam || "-"} • প্রাপ্ত নম্বর: ${p.total == null ? "-" : p.total}`;
  if (kind === "admission") return `${p.name || "-"} • ${p.className || "-"} • ${p.mobileNo || ""}`;
  if (kind === "inventory") return `${p.productName || "-"} • ${p.mode === "add" ? "স্টকে যোগ" : "স্টক থেকে বিতরণ"} • পরিমাণ: ${p.qty || "-"}`;
  if (kind === "notice") return `${p.title || "-"} • ${p.body || p.desc || ""}`;
  if (kind === "exam-subject") return `${p.name || p.subject || "-"} • ${p.classes || "সব শ্রেণী"}`;
  if (kind === "fee") return `${p.studentName || "-"} • ${p.amount || 0} টাকা • ${p.remark || ""}`;
  return "";
}

async function workflowStudentUsers(payload) {
  const doc = await Store.findOne({ key: "students" }).lean();
  const records = Array.isArray(doc && doc.data) ? doc.data : [];
  const p = payload || {};
  const wantedIds = []
    .concat(Array.isArray(p.studentIds) ? p.studentIds : [])
    .concat(p.studentId != null ? [p.studentId] : [])
    .map((x) => String(x));
  const className = String(p.className || "").trim();
  const selected = records.filter((st) => {
    if (!st) return false;
    if (wantedIds.length) return wantedIds.includes(String(st.id));
    const cls = st.cls || st.className || st.attCls || "";
    return className ? String(cls) === className : false;
  });
  const users = await User.find({ role: "Student", active: true })
    .select("_id uid name")
    .lean();
  return users.filter((u) =>
    selected.some((st) =>
      (st.uid && String(st.uid) === String(u.uid)) ||
      (st.name && String(st.name) === String(u.name)) ||
      (st.regNo && String(st.regNo) === String(u.uid))
    )
  );
}

async function appendStoreArray(key, item) {
  const doc = await Store.findOne({ key }).lean();
  const list = Array.isArray(doc && doc.data) ? doc.data.slice() : [];
  const numericIds = list.map((x) => Number(x && x.id)).filter((x) => Number.isFinite(x));
  const nextId = numericIds.length ? Math.max(...numericIds) + 1 : 1;
  const value = Object.assign({ id: nextId }, item);
  list.push(value);
  await Store.findOneAndUpdate({ key }, { data: list }, { upsert: true });
  return value;
}

async function updateStoreArrayItem(key, id, item) {
  const doc = await Store.findOne({ key }).lean();
  const list = Array.isArray(doc && doc.data) ? doc.data.slice() : [];
  const index = list.findIndex((x) => String(x && x.id) === String(id));
  if (index < 0) return null;
  list[index] = Object.assign({}, list[index], item, { id: list[index].id });
  await Store.findOneAndUpdate({ key }, { data: list }, { upsert: true });
  return list[index];
}

async function applyApprovedWorkflow(request, approver) {
  const p = request.payload || {};
  const common = {
    teacher: request.submittedByName || p.teacherName || "শিক্ষক",
    teacherId: request.submittedBy,
    approvalRequestId: request._id,
    approvedBy: approver.name || approver.uid || "",
    approvedAt: new Date(),
  };

  if (request.kind === "homework") {
    if (p.homeworkType === "residential") {
      const item = Object.assign({}, common, {
        branchName: p.branchName || "আবাসিক",
        category: p.category || p.subject || "আবাসিক",
        subject: p.subject || "",
        comment: p.task || p.comment || "",
        details: p.details || "",
        students: Array.isArray(p.studentIds) ? p.studentIds : [],
        progress: [],
        date: workflowDateBn(p.date),
        dateISO: p.date || "",
        ts: Date.now(),
        status: "অনুমোদিত",
        branch: "আবাসিক",
      });
      if (p.editId != null) {
        const updated = await updateStoreArrayItem("hwResidentialList", p.editId, item);
        if (!updated) throw new Error("বাড়ির কাজের রেকর্ড পাওয়া যায়নি");
        return updated;
      }
      return appendStoreArray("hwResidentialList", item);
    }
    const item = Object.assign({}, common, {
      cls: p.className || p.cls || "",
      subject: p.subject || "",
      task: p.task || "",
      khata: !!p.khata,
      date: workflowDateBn(p.date),
      dateISO: p.date || "",
      ts: Date.now(),
      status: "অনুমোদিত",
    });
    if (p.editId != null) {
      const updated = await updateStoreArrayItem("hwDailyList", p.editId, item);
      if (!updated) throw new Error("বাড়ির কাজের রেকর্ড পাওয়া যায়নি");
      return updated;
    }
    return appendStoreArray("hwDailyList", item);
  }

  if (request.kind === "syllabus") {
    return appendStoreArray("syllabusItems", Object.assign({}, common, {
      className: p.className || "",
      subjectName: p.subjectName || p.subject || "",
      title: p.title || "",
      details: p.details || p.desc || "",
      showFrom: p.showFrom || "",
      showTo: p.showTo || "",
      status: "প্রকাশিত",
    }));
  }

  if (request.kind === "leave") {
    return appendStoreArray("leaveRequests", Object.assign({}, common, {
      studentId: p.studentId,
      name: p.studentName || "",
      reason: p.reason || "",
      from: workflowDateBn(p.from),
      to: workflowDateBn(p.to),
      fromISO: p.from || "",
      toISO: p.to || "",
      days: Math.max(1, Math.round((new Date(p.to) - new Date(p.from)) / 86400000) + 1),
      detail: p.detail || "",
      status: "অনুমোদিত",
      rejectReason: "",
    }));
  }

  if (request.kind === "result") {
    const result = await appendStoreArray("results", Object.assign({}, common, {
      studentId: p.studentId,
      student: p.studentName || "",
      exam: p.exam || "",
      total: p.total == null ? "" : p.total,
      grade: p.grade || "",
      position: p.position == null ? "" : p.position,
      remark: p.remark || "",
      published: true,
    }));
    return result;
  }

  if (request.kind === "admission") {
    return appendStoreArray("students", Object.assign({}, common, {
      regNo: p.regNo || "",
      classRoll: p.classRoll || "",
      name: p.name || "",
      cls: p.className || "",
      attCls: p.className || "",
      attDept: p.dept || p.branch || "",
      branch: p.branch || "",
      dept: p.dept || p.branch || "",
      group: p.group || "",
      startMonth: p.startMonth || "",
      birthReg: p.birthReg || "",
      dob: p.dob || "",
      age: p.age || "",
      gender: p.gender || "",
      fatherJob: p.fatherJob || "",
      fatherMobile: p.fatherMobile || "",
      motherName: p.motherName || "",
      motherJob: p.motherJob || "",
      motherMobile: p.motherMobile || "",
      curAddr: p.curAddr || "",
      permAddr: p.permAddr || "",
      guardianRel: p.guardianRel || "",
      guardianName: p.guardianName || p.fatherName || "",
      prevInst: p.prevInst || "",
      prevClass: p.prevClass || "",
      referrer: p.referrer || "",
      photo: p.photo || "",
      mobile: p.mobileNo || "",
      fee: Number(p.fee) || 0,
      parent: p.fatherName || "",
      guardianMobile: p.mobileNo || "",
      session: p.session || "",
      type: p.type || "অনাবাসিক",
      status: "সক্রিয়",
    }));
  }

  if (request.kind === "inventory") {
    const productsDoc = await Store.findOne({ key: "invProducts" }).lean();
    const products = Array.isArray(productsDoc && productsDoc.data) ? productsDoc.data.slice() : [];
    const product = products.find((x) => String(x && x.id) === String(p.productId));
    if (!product) throw new Error("ইনভেন্টরি পণ্য পাওয়া যায়নি");
    const qty = Number(p.qty);
    if (!Number.isFinite(qty) || qty < 1) throw new Error("সঠিক পরিমাণ দিন");
    const stock = Number(product.stock) || 0;
    if (p.mode === "issue" && qty > stock) throw new Error("বর্তমান স্টকের চেয়ে বেশি বিতরণ করা যাবে না");
    product.stock = p.mode === "add" ? stock + qty : stock - qty;
    await Store.findOneAndUpdate({ key: "invProducts" }, { data: products }, { upsert: true });
    return product;
  }

  if (request.kind === "notice") {
    return appendStoreArray("notices", Object.assign({}, common, {
      title: p.title || "নোটিশ",
      desc: p.body || p.desc || "",
      date: workflowDateBn(p.date),
      dateISO: p.date || "",
      status: "প্রকাশিত",
    }));
  }

  if (request.kind === "exam-subject") {
    return appendStoreArray("examSubjects", Object.assign({}, common, {
      name: p.name || p.subject || "",
      classes: Array.isArray(p.classes) ? p.classes : [],
      status: "প্রকাশিত",
    }));
  }

  if (request.kind === "fee") {
    const studentId = p.studentId;
    const paymentsDoc = await Store.findOne({ key: "payments" }).lean();
    const paymentDetailsDoc = await Store.findOne({ key: "paymentDetails" }).lean();
    const duesDoc = await Store.findOne({ key: "studentDues" }).lean();
    const payments = Array.isArray(paymentsDoc && paymentsDoc.data) ? paymentsDoc.data.slice() : [];
    const paymentDetails = Array.isArray(paymentDetailsDoc && paymentDetailsDoc.data) ? paymentDetailsDoc.data.slice() : [];
    const dues = duesDoc && duesDoc.data && typeof duesDoc.data === "object" ? Object.assign({}, duesDoc.data) : {};
    const amount = Number(p.amount) || 0;
    if (studentId == null || amount <= 0) throw new Error("শিক্ষার্থী ও সঠিক পরিশোধের পরিমাণ প্রয়োজন");
    const dateISO = p.date || new Date().toISOString().slice(0, 10);
    const nextPaymentId = Math.max(0, ...payments.map((x) => Number(x && x.id) || 0)) + 1;
    const billNo = Math.max(99, ...paymentDetails.map((x) => Number(x && x.billNo) || 0)) + 1;
    payments.push({
      id: nextPaymentId, studentId, student: p.studentName || "", regNo: p.regNo || "",
      cls: p.className || "", amount, month: p.month || "-", date: workflowDateBn(dateISO),
      dateISO, by: common.teacher, method: p.method || "নগদ",
      remark: p.remark || "শিক্ষক প্যানেল থেকে আদায়", approvalRequestId: request._id,
    });
    paymentDetails.push({
      id: Math.max(0, ...paymentDetails.map((x) => Number(x && x.id) || 0)) + 1,
      billNo, studentId, studentName: p.studentName || "", date: workflowDateBn(dateISO),
      dateISO, label: p.label || "ফি আদায়", amount, month: p.month || "-",
      method: p.method || "নগদ", by: common.teacher, remark: p.remark || "",
      approvalRequestId: request._id,
    });
    if (Array.isArray(dues[String(studentId)])) {
      const selectedIds = Array.isArray(p.dueIds) ? p.dueIds.map(String) : [];
      if (selectedIds.length) dues[String(studentId)] = dues[String(studentId)].filter((d) => !selectedIds.includes(String(d.id)));
    }
    await Promise.all([
      Store.findOneAndUpdate({ key: "payments" }, { data: payments }, { upsert: true }),
      Store.findOneAndUpdate({ key: "paymentDetails" }, { data: paymentDetails }, { upsert: true }),
      Store.findOneAndUpdate({ key: "studentDues" }, { data: dues }, { upsert: true }),
    ]);
    return payments[payments.length - 1];
  }

  throw new Error("অজানা approval type");
}

// POST /api/attendance/submit
// একই date + class + branch-এ Teacher/Admin একবারই জমা দিতে পারবেন।
app.post("/api/attendance/submit", auth, async (req, res) => {
  try {
    if (!["Teacher", "Admin", "Super Admin"].includes(req.user.role))
      return res.status(403).json({ message: "হাজিরা নেওয়ার অনুমতি নেই" });
    const date = String(req.body && req.body.date || "").slice(0, 10);
    const className = String(req.body && req.body.className || "").trim();
    const branch = String(req.body && req.body.branch || "").trim();
    const records = req.body && req.body.records;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(records) || !records.length)
      return res.status(400).json({ message: "তারিখ, শ্রেণী ও হাজিরার তথ্য প্রয়োজন" });
    const key = `${date}|${className}|${branch}`;
    const existing = await AttendanceSubmission.findOne({ key }).lean();
    if (existing && req.user.role !== "Super Admin")
      return res.status(409).json({ message: "এই শ্রেণীর হাজিরা আজ ইতিমধ্যে নেওয়া হয়েছে", takenBy: existing.takenBy });
    const item = await AttendanceSubmission.findOneAndUpdate(
      { key },
      { key, date, className, branch, records, takenBy: req.user.name || req.user.uid || "", takenByRole: req.user.role },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ ok: true, updated: !!existing, item });
  } catch (e) {
    if (e && e.code === 11000) return res.status(409).json({ message: "এই শ্রেণীর হাজিরা আজ ইতিমধ্যে নেওয়া হয়েছে" });
    console.error(e);
    res.status(500).json({ message: "হাজিরা সংরক্ষণ করা যায়নি" });
  }
});

async function notifyApprovalRequest(request) {
  const admins = await User.find({ role: "Super Admin", active: true }).select("_id").lean();
  if (!admins.length) return;
  const label = APPROVAL_LABELS[request.kind] || "তথ্য";
  const body = `${request.submittedByName || "শিক্ষক"} • ${workflowSummary(request.kind, request.payload)}`;
  await Notification.insertMany(admins.map((u) => ({
    userId: u._id,
    title: `অনুমোদনের জন্য ${label}`,
    body,
    url: `#approval-${request._id}`,
    type: "approval",
    data: { approvalRequestId: String(request._id), kind: request.kind },
    read: false,
  })));
}

async function notifyWorkflowStudents(request, users) {
  if (!users.length) return;
  const label = APPROVAL_LABELS[request.kind] || "তথ্য";
  const p = request.payload || {};
  const detail = workflowSummary(request.kind, p);
  await Notification.insertMany(users.map((u) => ({
    userId: u._id,
    title: `${label} প্রকাশিত হয়েছে`,
    body: detail,
    url: "#home",
    type: request.kind,
    data: { approvalRequestId: String(request._id), kind: request.kind },
    read: false,
  })));
}

app.post("/api/approval-requests", auth, async (req, res) => {
  try {
    if (req.user.role !== "Teacher")
      return res.status(403).json({ message: "শুধু শিক্ষক approval request পাঠাতে পারবেন" });
    const kind = String(req.body && req.body.kind || "").trim();
    const payload = req.body && req.body.payload;
    if (!APPROVAL_LABELS[kind] || !payload || typeof payload !== "object" || Array.isArray(payload))
      return res.status(400).json({ message: "সঠিক তথ্য দিন" });

    const request = await ApprovalRequest.create({
      submittedBy: req.user.id,
      submittedByName: req.user.name || req.user.uid || "শিক্ষক",
      kind,
      title: String(req.body.title || APPROVAL_LABELS[kind]).slice(0, 160),
      payload,
    });
    await notifyApprovalRequest(request);
    res.status(201).json({ ok: true, request });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "অনুমোদনের আবেদন পাঠানো যায়নি" });
  }
});

app.get("/api/approval-requests/mine", auth, async (req, res) => {
  if (req.user.role !== "Teacher")
    return res.status(403).json({ message: "অনুমতি নেই" });
  const items = await ApprovalRequest.find({ submittedBy: req.user.id }).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ ok: true, items });
});

app.get("/api/approval-requests", auth, async (req, res) => {
  if (req.user.role !== "Super Admin")
    return res.status(403).json({ message: "শুধু সুপার এডমিন approval requests দেখতে পারবেন" });
  const items = await ApprovalRequest.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json({ ok: true, items });
});

app.put("/api/approval-requests/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "Teacher")
      return res.status(403).json({ message: "অনুমতি নেই" });
    const request = await ApprovalRequest.findOne({ _id: req.params.id, submittedBy: req.user.id });
    if (!request) return res.status(404).json({ message: "আবেদন পাওয়া যায়নি" });
    if (request.status !== "pending")
      return res.status(400).json({ message: "অনুমোদিত/প্রত্যাখ্যাত আবেদন এডিট করা যাবে না" });
    const payload = req.body && req.body.payload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      return res.status(400).json({ message: "সঠিক তথ্য দিন" });
    request.payload = payload;
    if (req.body.title) request.title = String(req.body.title).slice(0, 160);
    await request.save();
    res.json({ ok: true, request });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "আবেদন আপডেট করা যায়নি" });
  }
});

app.post("/api/approval-requests/:id/approve", auth, async (req, res) => {
  try {
    if (req.user.role !== "Super Admin")
      return res.status(403).json({ message: "শুধু সুপার এডমিন অনুমোদন করতে পারবেন" });
    const request = await ApprovalRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "আবেদন পাওয়া যায়নি" });
    if (request.status !== "pending")
      return res.status(400).json({ message: "আবেদনটি ইতিমধ্যে নিষ্পত্তি হয়েছে" });
    await applyApprovedWorkflow(request, req.user);
    request.status = "approved";
    request.decisionNote = String(req.body && req.body.note || "").slice(0, 500);
    request.decidedBy = req.user.id;
    request.decidedAt = new Date();
    await request.save();
    const users = request.kind === "admission" ? [] : await workflowStudentUsers(request.payload);
    await notifyWorkflowStudents(request, users);
    res.json({ ok: true, sent: users.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "অনুমোদন সম্পন্ন করা যায়নি" });
  }
});

app.post("/api/approval-requests/:id/reject", auth, async (req, res) => {
  try {
    if (req.user.role !== "Super Admin")
      return res.status(403).json({ message: "শুধু সুপার এডমিন প্রত্যাখ্যান করতে পারবেন" });
    const request = await ApprovalRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "আবেদন পাওয়া যায়নি" });
    if (request.status !== "pending")
      return res.status(400).json({ message: "আবেদনটি ইতিমধ্যে নিষ্পত্তি হয়েছে" });
    request.status = "rejected";
    request.decisionNote = String(req.body && req.body.note || "").slice(0, 500);
    request.decidedBy = req.user.id;
    request.decidedAt = new Date();
    await request.save();
    await Notification.create({
      userId: request.submittedBy,
      title: `${APPROVAL_LABELS[request.kind] || "আবেদন"} প্রত্যাখ্যাত`,
      body: request.decisionNote || "সুপার এডমিন আবেদনটি প্রত্যাখ্যান করেছেন",
      type: "approval",
      data: { approvalRequestId: String(request._id), kind: request.kind },
      read: false,
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "আবেদন প্রত্যাখ্যান করা যায়নি" });
  }
});

/* ------------------------------------------------------------------ */
/*  Start                                                              */
/* ------------------------------------------------------------------ */
async function start() {
  if (!MONGODB_URI) {
    console.error("FATAL: MONGODB_URI is not set");
    process.exit(1);
  }

  // ── ১) আগে পোর্ট খুলি (Render-এ cold start দ্রুত হয়) ──
  const server = app.listen(PORT, () => console.log(`[api] listening on :${PORT}`));
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 70000;

  // ── ২) এরপর ব্যাকগ্রাউন্ডে ডাটাবেস সংযোগ ও সিডিং ──
  dbReady = (async () => {
    await connectDb();
    console.log("[db] MongoDB connected");
    await seedSuperAdmin();
    await seedDefaultStudents();
    console.log("[db] ready");
  })();

  dbReady.catch((e) => {
    console.error("[db] connect failed:", e.message);
    dbReady = null; // পরের রিকোয়েস্টে আবার চেষ্টা হবে
  });

  // ── ৩) Render free tier-এ sleep আটকাতে নিজেকেই পিং (ঐচ্ছিক) ──
  const selfUrl = process.env.KEEP_ALIVE_URL;
  if (selfUrl) {
    setInterval(() => {
      fetch(selfUrl.replace(/\/+$/, "") + "/api/health").catch(() => {});
    }, 10 * 60 * 1000).unref();
  }
}

start().catch((e) => {
  console.error("Startup error:", e);
  process.exit(1);
});
