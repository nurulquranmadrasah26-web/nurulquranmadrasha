/* ============================================================
   শিক্ষক প্যানেল — মোবাইল অভিজ্ঞতা উন্নয়ন
   ------------------------------------------------------------
   - মোবাইলে সব মেনু পাওয়ার জন্য নিচ থেকে ওঠা ড্রয়ার
   - টেবিলগুলো মোবাইলে পাশাপাশি স্ক্রলযোগ্য করা
   - নিচের নেভিগেশনে সক্রিয় ট্যাব ঠিক রাখা
   কোনো ডেটা বা লজিক পরিবর্তন করা হয় না।
   ============================================================ */
(function () {
  'use strict';

  var ICONS = {
    admission: '➕', attendance: '📅', fee: '💰', inventory: '📦',
    'hw-subject': '📝', 'hw-residential': '🏠', 'hw-list': '📖',
    syllabus: '📃', leave: '📄', notice: '📢', 'exam-subjects': '📚',
    requests: '⏳', dashboard: '🏠', profile: '⚙️'
  };

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  /* ---------- মেনু আইটেম সংগ্রহ (ডেস্কটপ nav থেকে) ---------- */
  function collectMenu() {
    var items = [];
    document.querySelectorAll('nav.mainnav a').forEach(function (a) {
      var attr = a.getAttribute('onclick') || '';
      var m = attr.match(/goto\('([^']+)'\)/);
      if (!m) return;
      var label = (a.textContent || '').replace(/[+＋📦📃📄📢📚📖⏳]/g, '').trim();
      items.push({ view: m[1], label: label || m[1] });
    });
    // নিচের নেভিগেশনে না থাকা গুরুত্বপূর্ণ পেজগুলোও যোগ
    [{ view: 'dashboard', label: 'ড্যাশবোর্ড' }, { view: 'profile', label: 'প্রোফাইল' }]
      .forEach(function (extra) {
        if (!items.some(function (i) { return i.view === extra.view; })) items.unshift(extra);
      });
    return items;
  }

  /* ---------- ড্রয়ার তৈরি ---------- */
  function buildDrawer(items) {
    var backdrop = document.createElement('div');
    backdrop.className = 'nq-drawer-backdrop';

    var drawer = document.createElement('div');
    drawer.className = 'nq-drawer';
    drawer.innerHTML = '<div class="grab"></div><h3>সকল মেনু</h3>';

    var grid = document.createElement('div');
    grid.className = 'nq-drawer-grid';

    items.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = '<span class="ic">' + (ICONS[it.view] || '•') + '</span><span>' + it.label + '</span>';
      b.addEventListener('click', function () {
        close();
        if (typeof window.goto === 'function') window.goto(it.view);
      });
      grid.appendChild(b);
    });

    drawer.appendChild(grid);
    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    function open() {
      backdrop.classList.add('open');
      drawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      backdrop.classList.remove('open');
      drawer.classList.remove('open');
      document.body.style.overflow = '';
    }
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    return { open: open, close: close };
  }

  /* ---------- হেডারে বার্গার বাটন ---------- */
  function mountBurger(drawer) {
    var right = document.querySelector('header.topbar .topbar-right');
    if (!right || document.querySelector('.nq-burger')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nq-burger';
    btn.setAttribute('aria-label', 'সকল মেনু');
    btn.textContent = '☰';
    btn.addEventListener('click', drawer.open);
    right.insertBefore(btn, right.firstChild);
  }

  /* ---------- টেবিল স্ক্রলযোগ্য ---------- */
  function wrapTables(root) {
    (root || document).querySelectorAll('table').forEach(function (t) {
      var parent = t.parentElement;
      if (!parent || parent.classList.contains('nq-scroll-x')) return;
      var wrap = document.createElement('div');
      wrap.className = 'nq-scroll-x';
      parent.insertBefore(wrap, t);
      wrap.appendChild(t);
    });
  }

  ready(function () {
    var items = collectMenu();
    if (items.length) mountBurger(buildDrawer(items));
    wrapTables(document);

    // পরে যোগ হওয়া টেবিলও মোড়ানো
    var pending = null;
    new MutationObserver(function () {
      clearTimeout(pending);
      pending = setTimeout(function () { wrapTables(document); }, 200);
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
