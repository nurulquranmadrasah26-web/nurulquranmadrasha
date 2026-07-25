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
    // উদাহরণ: https://nurulquranmadrasha.onrender.com
    // নিচের লিঙ্ক আপডেট করুন
    return "https://nurulquranmadrasha.onrender.com";
  };

  window.APP_CONFIG = {
    API_BASE: getAPIBase(),
    // অ্যাডমিন প্যানেলের অবস্থান (লগইনের পর এখানে পাঠানো হবে)
    ADMIN_URL: isLocal ? "../admin_panel/admin.html" : "./admin_panel/admin.html",
  };
})();
