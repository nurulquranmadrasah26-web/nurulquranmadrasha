/* ============================================================
   নূরুল কোরআন মাদরাসা — API Warm-up (Render cold start ফিক্স)
   ------------------------------------------------------------
   Render-এর ফ্রি/স্টার্টার সার্ভার নিষ্ক্রিয় থাকলে প্রথম রিকোয়েস্টে
   ৩০-৫০ সেকেন্ড পর্যন্ত সময় লাগে। পেজ খোলার সাথে সাথেই এখানে
   /api/health-এ পিং পাঠানো হয়, তাই ব্যবহারকারী আইডি–পাসওয়ার্ড
   লেখা শেষ করার আগেই সার্ভার জেগে যায় এবং লগইন সেকেন্ডে হয়।
   ============================================================ */
(function () {
  'use strict';
  var API = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || '';
  var warm = false;

  function ping() {
    if (!API) return Promise.resolve(false);
    return fetch(API + '/api/health', { cache: 'no-store', keepalive: true })
      .then(function (r) { warm = r.ok; return r.ok; })
      .catch(function () { return false; });
  }

  // পেজ খোলার সাথে সাথে পিং, না জাগলে ৩ সেকেন্ড পরপর আবার (সর্বোচ্চ ২০ বার)
  var tries = 0;
  var readyPromise = new Promise(function (resolve) {
    (function loop() {
      tries++;
      ping().then(function (ok) {
        if (ok || tries >= 20) return resolve(ok);
        setTimeout(loop, 3000);
      });
    })();
  });

  /* টাইমআউট ও রিট্রাইসহ API কল */
  function apiFetch(path, options, opts) {
    options = options || {};
    opts = opts || {};
    var attempts = opts.retries != null ? opts.retries : 2;
    var timeout = opts.timeout || 60000;

    function once() {
      var ctrl = new AbortController();
      var t = setTimeout(function () { ctrl.abort(); }, timeout);
      return fetch(API + path, Object.assign({}, options, { signal: ctrl.signal }))
        .finally(function () { clearTimeout(t); });
    }

    function run(left) {
      return once().catch(function (err) {
        if (left <= 0) throw err;
        return new Promise(function (r) { setTimeout(r, 1500); }).then(function () { return run(left - 1); });
      });
    }
    return run(attempts);
  }

  window.NQ_API = {
    base: API,
    isWarm: function () { return warm; },
    warmUp: ping,
    ready: readyPromise,
    fetch: apiFetch
  };

  // ট্যাব আবার দেখা হলে সার্ভার সচল রাখা
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) ping();
  });
})();
