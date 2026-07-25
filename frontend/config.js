/**
 * সাইট কনফিগ — ব্যাকএন্ড API বেস URL।
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
    // অ্যাডমিন প্যানেলের অবস্থান (লগইনের পর এখানে পাঠানো হবে)
    ADMIN_URL: isLocal ? "../admin_panel/admin.html" : "./admin_panel/admin.html",
  };
  
  console.log('[Frontend Config] API_BASE:', window.APP_CONFIG.API_BASE);
})();
