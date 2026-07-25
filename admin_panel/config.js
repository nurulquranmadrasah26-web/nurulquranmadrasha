/**
 * অ্যাডমিন প্যানেল কনফিগ — ব্যাকএন্ড API বেস URL।
 * ⚠️ গুরুত্বপূর্ণ: নিচে RENDER_BACKEND_URL দিয়ে প্রতিস্থাপন করুন
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
    return "RENDER_BACKEND_URL";
  };

  window.APP_CONFIG = {
    API_BASE: getAPIBase(),
    // লগইন পেজ (ফ্রন্টএন্ড) — লগআউট/অননুমোদিত হলে এখানে ফেরত পাঠানো হবে
    LOGIN_URL: isLocal ? "../frontend/index.html" : "../",
  };
  
  console.log('[Admin Config] API_BASE:', window.APP_CONFIG.API_BASE);
})();
