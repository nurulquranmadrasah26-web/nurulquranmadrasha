/**
 * অ্যাডমিন প্যানেল কনফিগ — ব্যাকএন্ড API বেস URL।
 * Render এ ডিপ্লয়ের পর PRODUCTION_API পরিবর্তন করুন।
 */
(function () {
  var isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "";

  // ⬇️ Render এ ডিপ্লয়ের পর এই URL পরিবর্তন করুন
  var PRODUCTION_API = "https://nurulquran-backend.onrender.com";

  window.APP_CONFIG = {
    API_BASE: isLocal ? "http://localhost:5000" : PRODUCTION_API,
    // লগইন পেজ (ফ্রন্টএন্ড) — লগআউট/অননুমোদিত হলে এখানে ফেরত পাঠানো হবে
    LOGIN_URL: isLocal ? "../frontend/index.html" : "/",
  };
})();
