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
  Teacher: ["dash", "student", "exam", "routine", "homework", "message"],
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
 * Seed default students (ডিফল্ট শিক্ষার্থী)
 */
async function seedDefaultStudents() {
  const count = await Student.countDocuments();

  if (count > 0) return; // Already seeded

  const defaultStudents = [
    {
      name: "আহমদ আলী",
      rollNo: "001",
      className: "প্রথম বর্ষ",
      fatherName: "করিম আহমেদ",
      motherName: "ফাতিমা বেগম",
      mobileNo: "01712345671",
      address: "ঢাকা",
    },
    {
      name: "ফাতিমা খান",
      rollNo: "002",
      className: "প্রথম বর্ষ",
      fatherName: "খান সা��েব",
      motherName: "আয়শা খান",
      mobileNo: "01712345672",
      address: "চট্টগ্রাম",
    },
    {
      name: "মুহাম্মদ হাসান",
      rollNo: "003",
      className: "দ্বিতীয় বর্ষ",
      fatherName: "হাসান সাহেব",
      motherName: "লাইলা আক্তার",
      mobileNo: "01712345673",
      address: "সিলেট",
    },
    {
      name: "আয়শা সুলতানা",
      rollNo: "004",
      className: "দ্বিতীয় বর্ষ",
      fatherName: "সুলতান আহমেদ",
      motherName: "রাহিমা বেগম",
      mobileNo: "01712345674",
      address: "খুলনা",
    },
    {
      name: "করিম উদ্দিন",
      rollNo: "005",
      className: "তৃতীয় বর্ষ",
      fatherName: "উদ্দিন সাহেব",
      motherName: "হামিদা বেগম",
      mobileNo: "01712345675",
      address: "রাজশাহী",
    },
  ];

  await Student.insertMany(defaultStudents);

  console.log(
    `[seed] ${defaultStudents.length} default students created`
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
    if (req.user.role === "Student")
      query.role = { $in: ["Teacher", "Admin", "Super Admin", "Support"] };
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
/*  Message API (মেসেজিং সিস্টেম)                                      */
/* ------------------------------------------------------------------ */
// পোস্ট মেসেজ (ব্যবহারকারী থেকে ব্যবহারকারীকে)
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
    
    const msg = new Message({
      fromUserId: req.user.id,
      toUserId,
      subject: subject || "",
      body
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
/*  Notification API (বাড়ির কাজ / বেতন / নোটিশ — অভিভাবক ও শিক্ষার্থী)  */
/* ------------------------------------------------------------------ */
const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    url: { type: String, default: "" },
    type: { type: String, default: "general" }, // homework | fee | salary | notice | general
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const Notification = mongoose.model("Notification", notificationSchema);

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
/*  Start                                                              */
/* ------------------------------------------------------------------ */
async function start() {
  if (!MONGODB_URI) {
    console.error("FATAL: MONGODB_URI is not set");
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  console.log("[db] MongoDB connected");
  await seedSuperAdmin();
  await seedDefaultStudents();
  app.listen(PORT, () => console.log(`[api] listening on :${PORT}`));
}

start().catch((e) => {
  console.error("Startup error:", e);
  process.exit(1);
});
