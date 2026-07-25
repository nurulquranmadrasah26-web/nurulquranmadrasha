/**
 * সাইট কনফিগ — ব্যাকএন্ড API বেস URL।
 *
 * লোকাল ডেভেলপমেন্টে localhost ব্যবহার হবে; ডিপ্লয় করা সাইটে
 * নিচের প্রোডাকশন URL টি Render এর URL দিয়ে বদলান।
 */
(function () {
  var isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "";

  // ⬇️ Render এ ডিপ্লয়ের পর এই URL পরিবর্তন করুন
  var PRODUCTION_API = "https://nurulquranmadrasha.onrender.com";

  window.APP_CONFIG = {
    API_BASE: isLocal ? "http://localhost:5000" : PRODUCTION_API,
    // অ্যাডমিন প্যানেলের অবস্থান (লগইনের পর এখানে পাঠানো হবে)
    ADMIN_URL: isLocal ? "../admin_panel/admin.html" : "/admin_panel/admin.html",
  };
})();
