/* ============================================================
   নূরুল কুরআন মাদরাসা — Admin Panel Auth & RBAC
   ------------------------------------------------------------
   - টোকেন যাচাই ও লগইন গার্ড
   - রোল-ভিত্তিক মেনু ও পেজ অ্যাক্সেস (Super Admin / Admin /
     Support / Teacher / Student)
   - authFetch(): টোকেনসহ ব্যাকএন্ড কল
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.APP_CONFIG || {};
  var API = CFG.API_BASE || '';
  var LOGIN_URL = CFG.LOGIN_URL || './index.html';

  /* ---------- ফ্রন্টএন্ড থেকে আসা লগইন হ্যান্ডঅফ (ক্রস-ডোমেইন) ---------- */
  // ফ্রন্টএন্ড ও এডমিন প্যানেল আলাদা ডোমেইনে থাকলে localStorage শেয়ার হয় না,
  // তাই ফ্রন্টএন্ড লগইনের পর টোকেন URL হ্যাশে (#nq_auth=...) পাঠায়।
  // এখানে সেটা পড়ে নিজের storage-এ সেভ করে URL থেকে মুছে ফেলা হচ্ছে।
  (function consumeAuthHandoff() {
    var hash = window.location.hash || '';
    var marker = '#nq_auth=';
    if (hash.indexOf(marker) !== 0) return;
    try {
      var payload = JSON.parse(decodeURIComponent(hash.slice(marker.length)));
      if (payload && payload.token && payload.user) {
        var store = payload.remember ? localStorage : sessionStorage;
        var other = payload.remember ? sessionStorage : localStorage;
        store.setItem('nq_token', payload.token);
        store.setItem('nq_user', JSON.stringify(payload.user));
        other.removeItem('nq_token');
        other.removeItem('nq_user');
      }
    } catch (e) {
      console.error('লগইন হ্যান্ডঅফ পার্স করতে সমস্যা:', e);
    }
    // URL থেকে টোকেনযুক্ত হ্যাশ মুছে ফেলা (ব্রাউজার হিস্টোরি/ঠিকানায় যাতে না থাকে)
    var cleanUrl = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', cleanUrl);
  })();

  /* ---------- স্টোরেজ থেকে সেশন ---------- */
  function getToken() {
    return localStorage.getItem('nq_token') || sessionStorage.getItem('nq_token') || '';
  }
  function getUser() {
    var raw = localStorage.getItem('nq_user') || sessionStorage.getItem('nq_user') || '';
    try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function clearSession() {
    ['nq_token', 'nq_user'].forEach(function (k) {
      localStorage.removeItem(k); sessionStorage.removeItem(k);
    });
  }

  /* সুপার এডমিন কোনো ব্যবহারকারীর প্যানেলে গেলে আগের সেশনটি
     nq_impersonator-এ রাখা হয়। এখান থেকেই নিরাপদে মূল প্যানেলে ফেরা যায়। */
  function getImpersonator() {
    try {
      var raw = localStorage.getItem('nq_impersonator');
      var value = raw ? JSON.parse(raw) : null;
      return value && value.token && value.user ? value : null;
    } catch (e) {
      return null;
    }
  }

  function returnToAdmin() {
    var original = getImpersonator();
    if (!original) {
      window.location.replace(LOGIN_URL);
      return;
    }
    localStorage.setItem('nq_token', original.token);
    var originalUser = original.user;
    if (typeof originalUser === 'string') {
      try { originalUser = JSON.parse(originalUser); } catch (e) { originalUser = null; }
    }
    if (!originalUser || typeof originalUser !== 'object') {
      localStorage.removeItem('nq_impersonator');
      window.location.replace(LOGIN_URL);
      return;
    }
    localStorage.setItem('nq_user', JSON.stringify(originalUser));
    sessionStorage.removeItem('nq_token');
    sessionStorage.removeItem('nq_user');
    localStorage.removeItem('nq_impersonator');
    window.location.replace('./admin.html');
  }

  /* ---------- রোল সাধারণীকরণ ---------- */
  // ব্যাকএন্ড role ভ্যালু: superadmin / admin / support / teacher / student
  function normalizeRole(r) {
    if (!r) return '';
    r = String(r).toLowerCase().replace(/[\s_-]+/g, '');
    if (r === 'superadmin' || r === 'super') return 'superadmin';
    if (r === 'admin') return 'admin';
    if (r === 'support') return 'support';
    if (r === 'teacher' || r === 'shikkhok') return 'teacher';
    if (r === 'student' || r === 'shikkharthi') return 'student';
    return r;
  }

  /* ---------- মডিউল অনুযায়ী রোল অনুমতি ---------- *
     মডিউল কী গুলো admin.html এর nav-drop data-mod এর সাথে মেলে:
     dash, student, staff, fee, exam, routine, accounts,
     others, homework, inventory, message, users
  ------------------------------------------------------------- */
  var ROLE_MODULES = {
    // সুপার এডমিন — সম্পূর্ণ নিয়ন্ত্রণ (ব্যবহারকারী ব্যবস্থাপনাসহ)
    superadmin: ['dash', 'student', 'staff', 'fee', 'exam', 'routine', 'accounts', 'others', 'homework', 'inventory', 'message', 'users'],

    // এডমিন — ব্যবহারকারী ব্যবস্থাপনা ছাড়া প্রায় সবকিছু
    admin: ['dash', 'student', 'staff', 'fee', 'exam', 'routine', 'accounts', 'others', 'homework', 'message'],

    // সাপোর্ট — কারিগরি/যোগাযোগ: ড্যাশবোর্ড, ম্যাসেজ, নোটিশ/সাইট, ব্যবহারকারী দেখা
    support: ['dash', 'message', 'others', 'users'],

    // শিক্ষক — শিক্ষার্থী, পরীক্ষা, রুটিন, বাড়ির কাজ, ম্যাসেজ
    teacher: ['dash', 'student', 'staff', 'fee', 'exam', 'routine', 'homework', 'inventory', 'others', 'message'],

    // শিক্ষার্থী — নিজের রুটিন, বাড়ির কাজ, ফলাফল, ফি, ম্যাসেজ
    student: ['dash', 'routine', 'homework', 'exam', 'fee', 'message']
  };

  /* সাপোর্ট রোল ব্যবহারকারী মডিউলে শুধু 'দেখা' পারবে (এড/এডিট নয়) */
  var READONLY_MODULES = {
    support: ['users']
  };

  /* ---------- পেজ → মডিউল ম্যাপ ---------- */
  var PAGE_MODULE = {
    dashboard: 'dash',
    // শিক্ষার্থী
    studentDashboard: 'student', admission: 'student', students: 'student', hajira: 'student',
    hazlist: 'student', leaveapply: 'student', leaveadmin: 'student', grouptransfer: 'student',
    classtransfer: 'student', stumobile: 'student', stutransfer: 'student',
    // স্টাফ
    staffdash: 'staff', staffAdmission: 'staff', teachers: 'staff', staffhaz: 'staff',
    staffmonthly: 'staff', staffhazdetail: 'staff', staffoutwork: 'staff', staffsalary: 'staff',
    staffleaveapply: 'staff', staffleaveadmin: 'staff', staffclassschedule: 'staff', staffdesignation: 'staff',
    // ফি
    feedash: 'fee', feeadd: 'fee', feelist: 'fee', duelist: 'fee', adai: 'fee',
    duedetail: 'fee', collectiondetail: 'fee', monthlyFee: 'fee',
    // স্বয়ংক্রিয় বেতন শীট ও লগইন আইডি
    salarySheet: 'staff', loginIds: 'users',
    // পরীক্ষা
    examsubject: 'exam', examtype: 'exam', examcreate: 'exam', syllabus: 'exam', examlist: 'exam',
    resultcreate: 'exam', resultlist: 'exam', resultpublish: 'exam', marksheet: 'exam',
    // রুটিন
    crDailyNew: 'routine', crResidentialNew: 'routine', crList: 'routine', crDailyTable: 'routine',
    crResidentialTable: 'routine', crTimeSlot: 'routine',
    // হিসাব
    studentFinance: 'accounts', income: 'accounts', expense: 'accounts', expenseList: 'accounts',
    donationGroup: 'accounts', donationCollect: 'accounts', donationReport: 'accounts',
    accounts: 'accounts', cashbook: 'accounts', finance: 'accounts',
    // অন্যান্য
    othersDashboard: 'others', feeTypes: 'others', transportFare: 'others', otClass: 'others',
    otDivision: 'others', classGroup: 'others', ieFund: 'others', ieCategory: 'others',
    mealRoutine: 'others', noticeBoard: 'others', sitePanel: 'others',
    // বাড়ির কাজ
    hwDailyNew: 'homework', hwResidentialNew: 'homework', hwList: 'homework',
    // ম্যাসেজ
    msgDashboard: 'message', msgSend: 'message', msgList: 'message', msgTemplate: 'message',
    // ব্যবহারকারী
    userNew: 'users', userList: 'users'
  };

  var currentUser = getUser();
  var currentRole = currentUser ? normalizeRole(currentUser.role) : '';
  var allowedModules = ROLE_MODULES[currentRole] || ['dash'];

  /* ---------- পাবলিক API ---------- */
  var NQAuth = {
    user: currentUser,
    role: currentRole,
    modules: allowedModules,

    isLoggedIn: function () { return !!getToken() && !!currentUser; },

    isImpersonating: function () { return !!getImpersonator(); },

    returnToAdmin: returnToAdmin,

    canAccessModule: function (mod) {
      if (!mod) return true;
      return allowedModules.indexOf(mod) !== -1;
    },

    canAccessPage: function (pageId) {
      var mod = PAGE_MODULE[pageId];
      if (!mod) return true; // ম্যাপবিহীন সাধারণ পেজ (প্রোফাইল ইত্যাদি)
      return allowedModules.indexOf(mod) !== -1;
    },

    isReadOnlyModule: function (mod) {
      var list = READONLY_MODULES[currentRole] || [];
      return list.indexOf(mod) !== -1;
    },

    logout: function () {
      clearSession();
      try {
        localStorage.removeItem('nq_last_page');
        localStorage.removeItem('nq_last_subpage');
        localStorage.removeItem('nq_impersonator');
      } catch (e) {}
      window.location.href = LOGIN_URL;
    },

    // JSON হেল্পার — এডমিন প্যানেলের ডেটা স্টোর পড়া/লেখা
    getJSON: function (path) {
      return NQAuth.authFetch(path).then(function (r) {
        if (!r.ok) throw new Error(path + ' -> ' + r.status);
        return r.json();
      });
    },
    postJSON: function (path, body, method) {
      return NQAuth.authFetch(path, {
        method: method || 'POST',
        body: JSON.stringify(body || {})
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          if (!r.ok) throw new Error(data.message || ('ত্রুটি: ' + r.status));
          return data;
        });
      });
    },
    // এডমিন প্যানেলের পূর্ণ ডেটা স্টোর (students, hwDailyList, attendance ...)
    loadStore: function () {
      return NQAuth.getJSON('/api/store').catch(function () { return {}; });
    },
    // এক বা একাধিক স্টোর-কী সংরক্ষণ (এডমিন প্যানেলের সাথে একই ডেটা)
    saveStore: function (keys) {
      return NQAuth.postJSON('/api/store', { keys: keys }, 'PUT');
    },

    // টোকেনসহ fetch — 401 হলে লগআউট
    authFetch: function (path, options, fetchOpts) {
      options = options || {};
      fetchOpts = fetchOpts || {};
      options.headers = options.headers || {};
      options.headers['Authorization'] = 'Bearer ' + getToken();
      if (!(options.body instanceof FormData) && options.body && !options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
      }
      var url = /^https?:/.test(path) ? path : (API + path);
      // সার্ভার ঘুমিয়ে থাকলে (Render cold start) টাইমআউট/রিট্রাইসহ কল
      var call = (window.NQ_API && window.NQ_API.fetch && !/^https?:/.test(path))
        ? window.NQ_API.fetch(path, options, {
            retries: fetchOpts.retries != null ? fetchOpts.retries : 2,
            timeout: fetchOpts.timeout || 60000
          })
        : fetch(url, options);
      return call.then(function (res) {
        if (res.status === 401) { NQAuth.logout(); throw new Error('unauthorized'); }
        return res;
      });
    }
  };
  window.NQAuth = NQAuth;

  /* ---------- মেনু ও UI রোল অনুযায়ী সাজানো ---------- */
  function applyRoleUI() {
    // মডিউল nav গ্রুপ লুকানো
    document.querySelectorAll('[data-mod]').forEach(function (el) {
      var mod = el.getAttribute('data-mod');
      if (!NQAuth.canAccessModule(mod)) {
        el.style.display = 'none';
      }
    });

    // রিড-অনলি মডিউলে "নতুন/সেভ" বাটন নিষ্ক্রিয় (সাপোর্ট)
    // (মডিউল কনটেইনারে data-mod থাকলে সেই কনটেইনার-লেভেলে)
    // ইউজার তথ্য হেডারে দেখানো
    var u = NQAuth.user || {};
    var roleLabels = {
      superadmin: 'সুপার এডমিন', admin: 'এডমিন', support: 'সাপোর্ট',
      teacher: 'শিক্ষক', student: 'শিক্ষার্থী'
    };
    var nameEls = document.querySelectorAll('[data-user-name]');
    nameEls.forEach(function (n) { n.textContent = u.name || u.uid || 'ব্যবহারকারী'; });
    var roleEls = document.querySelectorAll('[data-user-role]');
    roleEls.forEach(function (n) { n.textContent = roleLabels[currentRole] || currentRole; });

    // লগআউট বাটন সংযুক্ত
    document.querySelectorAll('[data-logout]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); NQAuth.logout(); });
    });
  }

  /* শিক্ষার্থী/শিক্ষক/অন্য ব্যবহারকারীর প্যানেলে সবসময় দৃশ্যমান রিটার্ন
     অ্যাকশন — ব্রাউজারের back-এর উপর নির্ভর করতে হয় না। */
  function mountImpersonationReturn() {
    if (!getImpersonator() || document.getElementById('nqReturnAdminBtn')) return;
    var btn = document.createElement('button');
    btn.id = 'nqReturnAdminBtn';
    btn.type = 'button';
    btn.textContent = '↩ মূল এডমিন প্যানেলে ফিরুন';
    btn.title = 'সুপার এডমিন প্যানেলে ফিরে যান';
    btn.style.cssText = [
      'position:fixed', 'top:12px', 'right:12px', 'z-index:9999',
      'border:1px solid rgba(255,255,255,.45)', 'border-radius:999px',
      'padding:9px 14px', 'background:#1a237e', 'color:#fff',
      'font:600 13px Kalpurush,Hind Siliguri,Noto Sans Bengali,sans-serif',
      'box-shadow:0 4px 14px rgba(0,0,0,.22)', 'cursor:pointer'
    ].join(';');
    btn.addEventListener('click', returnToAdmin);
    document.body.appendChild(btn);
  }

  /* ---------- রোল-ভিত্তিক রিডাইরেক্ট ---------- */
  function handleRoleBasedRedirect() {
    if (!NQAuth.isLoggedIn()) return; // পরে চেক হবে
    
    var user = NQAuth.user || {};
    var role = NQAuth.role || '';
    
    var here = (window.location.pathname || '').split('/').pop().toLowerCase();

    // শিক্ষার্থী রোলে Student পেজে রিডাইরেক্ট করা (ইতিমধ্যে সেখানে থাকলে নয়)
    if (role === 'student') {
      if (here === 'student.html') return;
      // ব্যাকএন্ডে student.html থেকে শিক্ষার্থীর ড্যাশবোর্ড দেখাবে
      // কিন্তু এখানে সরাসরি student.html এ পাঠাচ্ছি (যা তার ব্যক্তিগত ড্যাশবোর্ড)
      window.location.replace('./student.html');
      return;
    }
    
    // শিক্ষক রোলে Teacher পেজে রিডাইরেক্ট করা
    if (role === 'teacher') {
      if (here === 'teacher.html') return;
      window.location.replace('./teacher.html');
      return;
    }
    
    // অন্যরা (Admin, SuperAdmin, Support) admin.html এ থাকবে
    if (here === 'teacher.html' || here === 'student.html') {
      window.location.replace('./admin.html');
    }
  }

  /* ---------- বুট: গার্ড ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    if (!NQAuth.isLoggedIn()) {
      window.location.replace(LOGIN_URL);
      return;
    }
    
    // রোল-ভিত্তিক রিডাইরেক্ট
    handleRoleBasedRedirect();
    
    applyRoleUI();
    mountImpersonationReturn();
  });
})();
