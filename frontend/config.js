/**
 * সাইট কনফিগ — ব্যাকএন্ড API বেস URL।
 *
 * লোকাল ডেভেলপমেন্টে localhost ব্যবহার হবে; ডিপ্লয় করা সাইটে
 * সমস্ত vercel.app ডোমেইন আপনার API সার্ভারের সাথে সংযুক্ত হবে।
 */
(function () {
  var isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "";

  var getAPIBase = function() {
    if (isLocal) return "http://localhost:5000";
    // Production: API সার্ভারের পূর্ণ URL (Render, Railway, ইত্যাদি)
    // আপনার ব্যাকএন্ড সার্ভারের প্রকৃত ডোমেইন দিয়ে প্রতিস্থাপন করুন
    return "https://nurulquranmadrasha-api.onrender.com"; // বা আপনার API URL
  };

  window.APP_CONFIG = {
    API_BASE: getAPIBase(),
    // অ্যাডমিন প্যানেলের অবস্থান (লগইনের পর এখানে পাঠানো হবে)
    ADMIN_URL: isLocal ? "../admin_panel/admin.html" : "./admin_panel/admin.html",
  };
})();
