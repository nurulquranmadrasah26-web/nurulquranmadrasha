/**
 * অ্যাডমিন প্যানেল কনফিগ — ব্যাকএন্ড API বেস URL।
 * API সার্ভার উভয় লোকাল এবং Production এ সংযুক্ত।
 */
(function () {
  var isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "";

  var getAPIBase = function() {
    if (isLocal) return "http://localhost:5000";
    // Production: API সার্ভারের পূর্ণ URL
    return "https://nurulquranmadrasha-api.onrender.com"; // বা আপনার API URL
  };

  window.APP_CONFIG = {
    API_BASE: getAPIBase(),
    // লগইন পেজ (ফ্রন্টএন্ড) — লগআউট/অননুমোদিত হলে এখানে ফেরত পাঠানো হবে
    LOGIN_URL: isLocal ? "../frontend/index.html" : "./index.html",
  };
})();
