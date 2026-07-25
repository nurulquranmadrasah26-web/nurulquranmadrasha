/**
 * সাইট কনফিগ — ব্যাকএন্ড API বেস URL।
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

  var getAdminURL = function() {
    if (isLocal) return "../admin_panel/admin.html";
    // Production: এডমিন প্যানেল যদি আলাদা Vercel ডোমেইনে ডিপ্লয় করা থাকে
    // (ফ্রন্টএন্ড ও এডমিন প্যানেল ভিন্ন প্রজেক্ট হলে), এখানে তার পূর্ণ (absolute)
    // ঠিকানা দিন। প্রয়োজনে নিচের লিঙ্ক আপনার আসল এডমিন প্যানেল ডোমেইন দিয়ে বদলে নিন।
    return "https://nurulquranmadrasha-y9xo.vercel.app/admin.html";
  };

  window.APP_CONFIG = {
    API_BASE: getAPIBase(),
    // অ্যাডমিন প্যানেলের অবস্থান (লগইনের পর এখানে পাঠানো হবে)
    ADMIN_URL: getAdminURL(),
  };
})();
