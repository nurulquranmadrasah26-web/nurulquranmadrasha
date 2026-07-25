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
    // উদাহরণ: https://nurulquranmadrasha.onrender.com
    // নিচের লিঙ্ক আপডেট করুন
    return "https://nurulquranmadrasha.onrender.com";
  };

  window.APP_CONFIG = {
    API_BASE: getAPIBase(),
    // লগইন পেজ (ফ্রন্টএন্ড) — লগআউট/অননুমোদিত হলে এখানে ফেরত পাঠানো হবে
    LOGIN_URL: isLocal ? "../frontend/index.html" : "../",
  };
})();
