/**
 * অ্যাডমিন প্যানেল কনফিগ — ব্যাকএন্ড API বেস URL।
 * Local: http://localhost:5000
 * Production: আপনার Render Backend URL সেট করুন
 */
(function () {
  var isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "";

  var getAPIBase = function() {
    if (isLocal) return "http://localhost:5000";
    
    // Production: Render backend URL
    // উদাহরণ: https://nurulquranmadrasha-backend.onrender.com
    // নিচের লিঙ্ক আপডেট করুন
    return "https://nurulquranmadrasha.onrender.com";
  };

  var getLoginURL = function() {
    if (isLocal) return "../frontend/index.html";
    // Production: ফ্রন্টএন্ড যদি আলাদা Vercel ডোমেইনে ডিপ্লয় করা থাকে, এখানে তার
    // পূর্ণ (absolute) ঠিকানা দিন। প্রয়োজনে নিচের লিঙ্ক আপনার আসল ফ্রন্টএন্ড ডোমেইন
    // দিয়ে বদলে নিন।
    return "https://nurulquranmadrasha.vercel.app/";
  };

  window.APP_CONFIG = {
    API_BASE: getAPIBase(),
    // লগইন পেজ (ফ্রন্টএন্ড) — লগআউট/অননুমোদিত হলে এখানে ফেরত পাঠানো হবে
    LOGIN_URL: getLoginURL(),
  };
})();
