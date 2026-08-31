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
    admission: '<span class="nqi nqi-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>', attendance: '<span class="nqi nqi-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>', fee: '<span class="nqi nqi-amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12"/><circle cx="12" cy="12" r="2.5"/><line x1="6" y1="12" x2="6" y2="12"/></svg></span>', inventory: '<span class="nqi nqi-amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><line x1="12" y1="13" x2="12" y2="21"/></svg></span>',
    'hw-subject': '<span class="nqi nqi-purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v12l-4 4H4z"/><polyline points="20 16 16 16 16 20"/><line x1="8" y1="9" x2="16" y2="9"/></svg></span>', 'hw-residential': '<span class="nqi nqi-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg></span>', 'hw-list': '<span class="nqi nqi-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h9a3 3 0 013 3v13a2.5 2.5 0 00-2.5-2.5H4z"/><path d="M20 4h-3a3 3 0 00-3 3v13a2.5 2.5 0 012.5-2.5H20z"/></svg></span>',
    syllabus: '<span class="nqi nqi-purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>', leave: '<span class="nqi nqi-purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>', notice: '<span class="nqi nqi-red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 001 1h3l7 4V6L7 10H4a1 1 0 00-1 1z"/><path d="M18 9a4 4 0 010 6"/></svg></span>', 'exam-subjects': '<span class="nqi nqi-maroon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3h4v18H4z"/><path d="M10 3h4v18h-4z"/><path d="M16.5 4l3.5 1-4 16-3.4-1z"/></svg></span>',
    requests: '<span class="nqi nqi-amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg></span>', dashboard: '<span class="nqi nqi-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg></span>', profile: '<span class="nqi nqi-muted"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-2.9 1.2V21a2 2 0 11-4 0v-.1A1.7 1.7 0 007 19.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.7 1.7 0 003 13.6H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 7l-.1-.1a2 2 0 112.8-2.8l.1.1A1.7 1.7 0 0010 3.6V3a2 2 0 114 0v.1a1.7 1.7 0 002.9 1.2l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 001.2 2.9H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg></span>'
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
 var label = (a.textContent || '').replace(/[+＋]/g, '').trim();
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
 btn.innerHTML = '<span class="nqi nqi-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></span>';
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
