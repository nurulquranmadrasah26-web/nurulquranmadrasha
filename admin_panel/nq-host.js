/* ============================================================
   নূরুল কুরআন মাদরাসা — Admin Panel Canonical Host & Clean URL
   ------------------------------------------------------------
   উদ্দেশ্য:
   - এডমিন প্যানেল সবসময় https://admin.nurulqurane.online/ ঠিকানায় দেখাবে
     (যেমন *.vercel.app ঠিকানায় খুললে সেখান থেকে রিডাইরেক্ট হবে)
   - ঠিকানার শেষে /admin.html, /student.html, /teacher.html দেখাবে না —
     বদলে /, /student, /teacher দেখাবে
   - NQ_PAGE('admin'|'student'|'teacher') দিয়ে সঠিক (পরিচ্ছন্ন) লিঙ্ক পাওয়া যাবে
   ============================================================ */
(function () {
  'use strict';

  var CANON_HOST = 'admin.nurulqurane.online';

  // ফাইলনাম → পরিচ্ছন্ন ঠিকানা
  var CLEAN_MAP = {
    '/admin.html': '/',
    '/index.html': '/',
    '/student.html': '/student',
    '/teacher.html': '/teacher'
  };

  var host = location.hostname;
  var isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '' ||
    location.protocol === 'file:';

  var path = location.pathname || '/';
  var clean = CLEAN_MAP[path.toLowerCase()] || path;

  if (!isLocal && host !== CANON_HOST) {
    // অন্য কোনো হোস্ট (যেমন xxx.vercel.app) → আসল এডমিন ডোমেইনে পাঠানো
    // লগইন হ্যান্ডঅফ হ্যাশ (#nq_auth=...) সহই পাঠানো হয়, তাই সেশন হারায় না।
    location.replace('https://' + CANON_HOST + clean + location.search + location.hash);
    return;
  }

  if (!isLocal && clean !== path) {
    // পেজ রিলোড ছাড়াই ঠিকানা পরিচ্ছন্ন করা
    try {
      history.replaceState(null, '', clean + location.search + location.hash);
    } catch (e) {}
  }

  // অ্যাপের ভেতরের নেভিগেশনে ব্যবহারের জন্য
  window.NQ_PAGE = function (page) {
    var p = String(page || 'admin').toLowerCase();
    if (isLocal) return './' + p + '.html';
    return p === 'admin' ? '/' : '/' + p;
  };
})();
