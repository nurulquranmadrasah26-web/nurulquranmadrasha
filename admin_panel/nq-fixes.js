/* ==========================================================================
   নুরুল কোরআন মাদরাসা — সংশোধনী প্যাচ (nq-fixes.js)
   --------------------------------------------------------------------------
   ১) সকল শিক্ষার্থীর লগইন আইডি/পাসওয়ার্ড স্বয়ংক্রিয়ভাবে "ব্যবহারকারী"তে
      যুক্ত হয় — এবং নতুন শিক্ষার্থী যোগ করলেও সাথে সাথে আইডি তৈরি হয়।
   ২) "ফির তালিকা" পেজের Action বাটনে সম্পূর্ণ কার্যকর বিস্তারিত পপআপ।
   ৩) "মাসিক বেতন (স্বয়ংক্রিয়)" ও "লগইন আইডি ব্যবস্থাপনা" পেজ সঠিকভাবে
      দেখা যায় এবং মোবাইলেও সম্পূর্ণ রেস্পন্সিভ।
   এই ফাইলটি nq-monthly.js এর পরে লোড হয়।
   ========================================================================== */
(function () {
  'use strict';

  /* ───────────────── সহায়ক ───────────────── */
  function BN(n) { return (typeof bn === 'function') ? bn(n) : String(n); }
  function toEn(s) {
    return String(s == null ? '' : s).replace(/[০-৯]/g, function (d) { return '০১২৩৪৫৬৭৮৯'.indexOf(d); });
  }
  function tk(n) { return (typeof fmtTk === 'function' ? fmtTk(Number(n || 0)) : BN(Number(n || 0))) + '/-'; }
  function toast(m) { if (typeof showToast === 'function') showToast(m); else console.log(m); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* ══════════════════════════════════════════════════════════════════
     ৩) স্টাইল — nq পেজগুলোর কার্ড, টেবিল ও রেস্পন্সিভ লেআউট
     ══════════════════════════════════════════════════════════════════ */
  function injectStyles() {
    if (document.getElementById('nq-fixes-style')) return;
    var st = document.createElement('style');
    st.id = 'nq-fixes-style';
    st.textContent = [
      /* nq পেজের কার্ড */
      '.nq-card{background:#fff;border:1px solid #e3e7ef;border-radius:12px;padding:16px 18px;',
      '  box-shadow:0 1px 3px rgba(20,30,60,.06);margin-bottom:16px;}',
      '.nq-card-head{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;',
      '  margin:0 0 12px;padding-bottom:10px;border-bottom:2px solid #c5cae9;}',
      '.nq-card-head h3{font-size:17px;font-weight:700;color:#1a237e;margin:0;}',
      '.nq-head-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}',
      '.nq-note{margin:0 0 12px;color:#667085;font-size:13.5px;line-height:1.7;}',
      '.nq-btn{border:none;border-radius:8px;padding:8px 14px;font-size:13.5px;font-weight:600;cursor:pointer;',
      '  color:#fff;background:#1565c0;font-family:inherit;white-space:nowrap;}',
      '.nq-btn:hover{filter:brightness(1.07);} .nq-btn:disabled{opacity:.6;cursor:not-allowed;}',
      '.nq-btn.green{background:#2e7d32;} .nq-btn.orange{background:#ef6c00;}',
      '.nq-btn.grey{background:#eceff1;color:#37474f;} .nq-btn.sm{padding:5px 11px;font-size:12.5px;}',
      '.nq-field{padding:8px 12px;border:1.5px solid #dfe3ea;border-radius:8px;font-family:inherit;',
      '  font-size:13.5px;background:#fff;min-width:0;}',
      '.nq-filters{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px;}',
      '.nq-filters .nq-field{flex:1 1 200px;}',
      '.nq-tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:10px;}',
      '.nq-tbl{width:100%;border-collapse:collapse;background:#fff;min-width:640px;}',
      '.nq-tbl thead{background:#1565c0;color:#fff;}',
      '.nq-tbl th,.nq-tbl td{padding:10px 13px;text-align:left;font-size:13.5px;',
      '  border-bottom:1px solid #eef1f6;vertical-align:middle;}',
      '.nq-tbl tbody tr:nth-child(even){background:#f7f9fc;}',
      '.nq-tbl tbody tr:hover{background:#e8f1fd;}',
      '.nq-summary{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px 18px;font-weight:600;font-size:14px;}',
      '.nq-chip{display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;}',
      '.nq-chip.ok{background:#c8e6c9;color:#2e7d32;} .nq-chip.wait{background:#bbdefb;color:#1565c0;}',
      '.nq-chip.due{background:#ffcdd2;color:#c62828;} .nq-chip.part{background:#ffe0b2;color:#e65100;}',
      '.nq-progress{font-size:13px;color:#1565c0;font-weight:600;}',
      /* মোবাইল: টেবিল → কার্ড */
      '@media (max-width:820px){',
      '  .nq-tbl{min-width:0;}',
      '  .nq-tbl thead{display:none;}',
      '  .nq-tbl,.nq-tbl tbody,.nq-tbl tr,.nq-tbl td{display:block;width:100%;}',
      '  .nq-tbl tr{background:#fff !important;border:1px solid #e3e7ef;border-radius:10px;',
      '    margin-bottom:10px;padding:6px 4px;box-shadow:0 1px 2px rgba(20,30,60,.05);}',
      '  .nq-tbl td{display:flex;gap:12px;align-items:center;justify-content:space-between;',
      '    border:none;border-bottom:1px dashed #eef1f6;padding:8px 12px;text-align:right;}',
      '  .nq-tbl tr td:last-child{border-bottom:none;}',
      '  .nq-tbl td::before{content:attr(data-label);font-weight:600;color:#5a6472;',
      '    text-align:left;flex:0 0 45%;font-size:12.5px;}',
      '  .nq-tbl td.nq-empty{display:block;text-align:center;}',
      '  .nq-tbl td.nq-empty::before{content:"";}',
      '  .nq-card{padding:14px;}',
      '  .nq-card-head{flex-direction:column;align-items:stretch;}',
      '  .nq-head-actions .nq-btn{flex:1 1 auto;}',
      '}',
      /* ফি বিস্তারিত পপআপ */
      '.nq-modal{position:fixed;inset:0;z-index:400;display:flex;align-items:center;justify-content:center;',
      '  background:rgba(15,23,42,.55);padding:16px;opacity:0;visibility:hidden;pointer-events:none;',
      '  transition:opacity .2s ease,visibility 0s linear .2s;}',
      '.nq-modal.open{opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s;}',
      '.nq-modal-box{background:#fff;border-radius:14px;width:100%;max-width:760px;max-height:92vh;',
      '  overflow-y:auto;transform:translateY(14px) scale(.97);transition:transform .24s cubic-bezier(.34,1.4,.64,1);}',
      '.nq-modal.open .nq-modal-box{transform:none;}',
      '.nq-modal-head{display:flex;align-items:center;justify-content:space-between;gap:10px;',
      '  padding:16px 20px;background:linear-gradient(135deg,#1565c0,#1a237e);color:#fff;',
      '  border-radius:14px 14px 0 0;position:sticky;top:0;z-index:2;}',
      '.nq-modal-head h3{margin:0;font-size:17px;font-weight:700;}',
      '.nq-modal-head .sub{font-size:12.5px;opacity:.85;margin-top:2px;}',
      '.nq-x{background:rgba(255,255,255,.18);border:none;color:#fff;width:32px;height:32px;',
      '  border-radius:50%;font-size:18px;line-height:1;cursor:pointer;flex:0 0 auto;}',
      '.nq-modal-body{padding:18px 20px;}',
      '.nq-info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;}',
      '.nq-info{background:#f6f8fc;border:1px solid #e6eaf2;border-radius:10px;padding:9px 12px;}',
      '.nq-info .k{display:block;font-size:11.5px;color:#77808f;margin-bottom:2px;}',
      '.nq-info .v{font-size:14px;font-weight:600;color:#1f2937;word-break:break-word;}',
      '.nq-stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0;}',
      '.nq-stat{border-radius:10px;padding:12px;text-align:center;color:#fff;}',
      '.nq-stat .k{font-size:12px;opacity:.9;} .nq-stat .v{font-size:18px;font-weight:700;margin-top:3px;}',
      '.nq-stat.b1{background:#1e88e5;} .nq-stat.b2{background:#2e7d32;} .nq-stat.b3{background:#c62828;}',
      '.nq-sub-title{font-size:14px;font-weight:700;color:#1a237e;margin:16px 0 8px;}',
      '.nq-modal-foot{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;',
      '  padding:14px 20px;border-top:1px solid #eef1f6;position:sticky;bottom:0;background:#fff;}',
      '@media (max-width:640px){',
      '  .nq-info-grid,.nq-stat-row{grid-template-columns:1fr 1fr;}',
      '  .nq-modal-box{max-height:94vh;} .nq-modal-foot .nq-btn{flex:1 1 45%;}',
      '}',
      '@media (max-width:420px){ .nq-info-grid,.nq-stat-row{grid-template-columns:1fr;} }'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* মোবাইল কার্ড ভিউয়ের জন্য প্রতিটি td তে হেডার লেবেল বসানো */
  function labelize(tbl) {
    if (!tbl) return;
    var heads = [].map.call(tbl.querySelectorAll('thead th'), function (th) { return th.textContent.trim(); });
    [].forEach.call(tbl.querySelectorAll('tbody tr'), function (tr) {
      var tds = tr.children;
      if (tds.length === 1) { tds[0].className = 'nq-empty'; return; }
      for (var i = 0; i < tds.length; i++) tds[i].setAttribute('data-label', heads[i] || '');
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     ৩ক) nq পেজগুলোর মার্কআপ পুনর্গঠন (আইডি অপরিবর্তিত)
     ══════════════════════════════════════════════════════════════════ */
  function rebuildPages() {
    var mf = document.getElementById('page-monthlyFee');
    if (mf && !mf.dataset.nqFixed) {
      mf.dataset.nqFixed = '1';
      mf.innerHTML =
        '<div class="section-title">মাসিক বেতন (স্বয়ংক্রিয়)</div>' +
        '<div class="nq-card">' +
        '  <div class="nq-card-head"><h3>শিক্ষার্থীভিত্তিক মাসিক বেতন</h3>' +
        '    <div class="nq-head-actions">' +
        '      <input id="nqMfSearch" class="nq-field" placeholder="নাম / রেজি নং দিয়ে খুঁজুন" oninput="renderMonthlyFeePage()">' +
        '      <button class="nq-btn green" onclick="NQMonthly.run(true)">এখনই হিসাব করুন</button>' +
        '    </div>' +
        '  </div>' +
        '  <p class="nq-note">ভর্তির মাস থেকে চলতি মাস পর্যন্ত প্রতিটি শিক্ষার্থীর মাসিক বেতন স্বয়ংক্রিয়ভাবে বকেয়ায় যুক্ত হয়। আদায় করলে বকেয়া কমে যায়।</p>' +
        '  <div class="nq-tbl-wrap"><table class="nq-tbl" id="nqMonthlyFeeTable"><thead><tr>' +
        '    <th>ক্রম</th><th>রেজি নং</th><th>নাম</th><th>শ্রেণী</th><th>মাসিক বেতন</th><th>মোট মাস</th><th>মোট বকেয়া</th><th>অ্যাকশন</th>' +
        '  </tr></thead><tbody id="nqMonthlyFeeBody"></tbody></table></div>' +
        '  <div class="nq-summary" id="nqMonthlyFeeSummary"></div>' +
        '</div>';
    }

    var ss = document.getElementById('page-salarySheet');
    if (ss && !ss.dataset.nqFixed) {
      ss.dataset.nqFixed = '1';
      ss.innerHTML =
        '<div class="section-title">স্টাফ বেতন শীট</div>' +
        '<div class="nq-card">' +
        '  <div class="nq-card-head"><h3>মাসভিত্তিক বেতন শীট</h3>' +
        '    <div class="nq-head-actions">' +
        '      <select id="nqSalMonth" class="nq-field" onchange="renderSalarySheet()"></select>' +
        '      <button class="nq-btn green" onclick="NQMonthly.run(true)">হালনাগাদ</button>' +
        '    </div>' +
        '  </div>' +
        '  <div class="nq-tbl-wrap"><table class="nq-tbl" id="nqSalaryTable"><thead><tr>' +
        '    <th>ক্রম</th><th>নাম</th><th>পদবী</th><th>মাস</th><th>বেতন</th><th>পরিশোধিত</th><th>বাকি</th><th>অবস্থা</th><th>অ্যাকশন</th>' +
        '  </tr></thead><tbody id="nqSalaryBody"></tbody></table></div>' +
        '  <div class="nq-summary" id="nqSalarySummary"></div>' +
        '</div>';
    }

    var li = document.getElementById('page-loginIds');
    if (li && !li.dataset.nqFixed) {
      li.dataset.nqFixed = '1';
      li.innerHTML =
        '<div class="section-title">লগইন আইডি ব্যবস্থাপনা</div>' +
        '<div class="nq-card">' +
        '  <div class="nq-card-head"><h3>শিক্ষার্থী ও স্টাফের লগইন তথ্য</h3>' +
        '    <div class="nq-head-actions">' +
        '      <span id="nqIdProgress" class="nq-progress"></span>' +
        '      <button class="nq-btn" id="nqBulkIdBtn" onclick="nqCreateAllStudentAccounts(true)">সকল শিক্ষার্থীর আইডি তৈরি</button>' +
        '      <button class="nq-btn grey" onclick="nqReloadLoginIds()">রিফ্রেশ</button>' +
        '    </div>' +
        '  </div>' +
        '  <p class="nq-note">শিক্ষার্থীর আইডি স্বয়ংক্রিয়ভাবে ০১, ০২... এবং পাসওয়ার্ড অভিভাবকের মোবাইল নম্বর (নম্বর না থাকলে স্বয়ংক্রিয় পাসওয়ার্ড)। স্টাফের আইডি তাঁর নাম ও পাসওয়ার্ড মোবাইল নম্বর। নতুন শিক্ষার্থী যোগ করলে আইডি–পাসওয়ার্ড নিজে থেকেই তৈরি হয়ে "ব্যবহারকারী" তালিকায় যুক্ত হয়।</p>' +
        '  <div class="nq-filters">' +
        '    <input id="nqLidSearch" class="nq-field" oninput="renderLoginIds()" placeholder="নাম বা আইডি দিয়ে খুঁজুন">' +
        '    <select id="nqLidKind" class="nq-field" onchange="renderLoginIds()">' +
        '      <option value="">সকল ধরন</option><option value="শিক্ষার্থী">শিক্ষার্থী</option><option value="স্টাফ">স্টাফ</option></select>' +
        '    <select id="nqLidState" class="nq-field" onchange="renderLoginIds()">' +
        '      <option value="">সকল অবস্থা</option><option value="yes">অ্যাকাউন্ট আছে</option><option value="no">তৈরি হয়নি</option></select>' +
        '  </div>' +
        '  <div class="nq-tbl-wrap"><table class="nq-tbl" id="nqLoginIdTable"><thead><tr>' +
        '    <th>ক্রম</th><th>নাম</th><th>ধরন</th><th>লগইন আইডি</th><th>পাসওয়ার্ড</th><th>অবস্থা</th><th>অ্যাকশন</th>' +
        '  </tr></thead><tbody id="nqLoginIdBody"></tbody></table></div>' +
        '  <div class="nq-summary" id="nqLoginIdSummary"></div>' +
        '</div>';
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     ১) শিক্ষার্থীর লগইন আইডি — স্বয়ংক্রিয় তৈরি
     ══════════════════════════════════════════════════════════════════ */
  function uidOf(s) {
    return s.loginUid || s.uid || String(s.id).padStart(2, '0');
  }
  function mobileOf(s) {
    var cands = [s.guardianMobile, s.mobile, s.fatherMobile, s.motherMobile];
    for (var i = 0; i < cands.length; i++) {
      var v = toEn(cands[i] || '').replace(/[^0-9]/g, '');
      if (v.length >= 6) return v;
    }
    return '';
  }
  function passOf(s) {
    return s.loginPass || mobileOf(s) || ('nq' + uidOf(s) + '2026');
  }

  function accountExists(uid) {
    var list = (typeof usersListData !== 'undefined') ? usersListData : [];
    return list.some(function (u) { return String(u.uid) === String(uid); });
  }

  /* একজন শিক্ষার্থীর জন্য অ্যাকাউন্ট নিশ্চিত করা */
  window.nqEnsureStudentAccount = async function (s, silent) {
    if (!s || !window.NQAuth || !window.NQAuth.authFetch) return { error: 'অনুমতি নেই' };
    var uid = uidOf(s), pass = passOf(s);
    if (accountExists(uid)) {
      s.loginUid = uid; s.uid = uid; s.loginPass = pass;
      return { uid: uid, password: pass, existed: true };
    }
    for (var attempt = 0; attempt < 30; attempt++) {
      var payload = { name: s.name, uid: uid, mobile: mobileOf(s), password: pass, role: 'Student' };
      try {
        var res = await window.NQAuth.authFetch('/api/users', { method: 'POST', body: JSON.stringify(payload) });
        var data = await res.json().catch(function () { return {}; });
        if (res.ok) {
          s.loginUid = uid; s.uid = uid; s.loginPass = pass;
          if (typeof nqScheduleSave === 'function') nqScheduleSave();
          if (!silent) toast('আইডি: ' + uid + ' / পাসওয়ার্ড: ' + pass);
          return { uid: uid, password: pass };
        }
        if (res.status === 409) {
          // একই আইডি ব্যবহৃত — পরবর্তী উপলব্ধ নম্বর
          uid = String(parseInt(toEn(uid), 10) + 1).padStart(2, '0');
          continue;
        }
        return { error: data.message || 'তৈরি করা যায়নি' };
      } catch (e) {
        return { error: e.message || 'সার্ভারের সাথে সংযোগ করা যায়নি' };
      }
    }
    return { error: 'ইউনিক আইডি নির্ধারণ করা যায়নি' };
  };

  /* সব শিক্ষার্থীর আইডি একসাথে তৈরি */
  var bulkRunning = false;
  window.nqCreateAllStudentAccounts = async function (manual) {
    if (bulkRunning) return;
    if (typeof students === 'undefined' || !window.NQAuth || !window.NQAuth.authFetch) return;
    bulkRunning = true;
    var btn = document.getElementById('nqBulkIdBtn');
    var prog = document.getElementById('nqIdProgress');
    if (btn) { btn.disabled = true; }
    try {
      if (typeof loadUsers === 'function') { try { await loadUsers(); } catch (e) {} }
      var pending = students.filter(function (s) {
        return (!s.status || s.status === 'সক্রিয়') && !accountExists(uidOf(s));
      });
      if (!pending.length) {
        if (prog) prog.textContent = '';
        if (manual) toast('সব শিক্ষার্থীর আইডি ইতিমধ্যেই তৈরি আছে');
        return;
      }
      var done = 0, failed = 0;
      for (var i = 0; i < pending.length; i++) {
        var r = await window.nqEnsureStudentAccount(pending[i], true);
        if (r && r.uid) done++; else failed++;
        if (prog) prog.textContent = 'তৈরি হচ্ছে... ' + BN(i + 1) + '/' + BN(pending.length);
      }
      if (prog) prog.textContent = '';
      if (typeof nqScheduleSave === 'function') nqScheduleSave();
      if (typeof loadUsers === 'function') { try { await loadUsers(); } catch (e) {} }
      if (typeof window.renderLoginIds === 'function') window.renderLoginIds();
      toast('লগইন আইডি তৈরি হয়েছে — ' + BN(done) + ' জন' + (failed ? (', ব্যর্থ ' + BN(failed) + ' জন') : ''));
    } finally {
      bulkRunning = false;
      if (btn) btn.disabled = false;
    }
  };

  window.nqReloadLoginIds = async function () {
    if (typeof loadUsers === 'function') { try { await loadUsers(); } catch (e) {} }
    if (typeof window.renderLoginIds === 'function') window.renderLoginIds();
    toast('তালিকা হালনাগাদ হয়েছে');
  };

  /* নতুন শিক্ষার্থী যোগ করলে অটো অ্যাকাউন্ট */
  function hookNewStudent() {
    var _add = window.addStudent;
    if (typeof _add === 'function' && !_add.__nqWrapped) {
      var wrapped = function () {
        var before = (typeof students !== 'undefined') ? students.length : 0;
        var r = _add.apply(this, arguments);
        if (typeof students !== 'undefined' && students.length > before) {
          var s = students[students.length - 1];
          setTimeout(function () {
            window.nqEnsureStudentAccount(s, true).then(function (res) {
              if (res && res.uid) toast('লগইন আইডি তৈরি — আইডি: ' + res.uid + ' / পাসওয়ার্ড: ' + res.password);
            }).catch(function () {});
          }, 50);
        }
        return r;
      };
      wrapped.__nqWrapped = true;
      window.addStudent = wrapped;
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     ৩খ) রেন্ডারার — মাসিক বেতন / বেতন শীট / লগইন আইডি
     ══════════════════════════════════════════════════════════════════ */
  function isActive(x) { return !x.status || x.status === 'সক্রিয়'; }
  function monthlyFeeOf(s) {
    if (typeof s.monthlyFee !== 'undefined' && s.monthlyFee) return Number(s.monthlyFee) || 0;
    if (s.fee) return Number(s.fee) || 0;
    return 0;
  }

  window.renderMonthlyFeePage = function () {
    var body = document.getElementById('nqMonthlyFeeBody');
    if (!body || typeof students === 'undefined') return;
    var q = toEn((document.getElementById('nqMfSearch') || {}).value || '').trim().toLowerCase();
    var list = students.filter(isActive).filter(function (s) {
      if (!q) return true;
      return String(s.name).toLowerCase().indexOf(q) !== -1 ||
        toEn(s.regNo || '').indexOf(q) !== -1 || String(s.id).indexOf(q) !== -1;
    });
    var totalDue = 0, totalMonths = 0;
    body.innerHTML = list.map(function (s, i) {
      var dues = ((typeof studentDues !== 'undefined' && studentDues[s.id]) || []).filter(function (d) { return d.auto; });
      var total = dues.reduce(function (a, d) { return a + Number(d.amount || 0); }, 0);
      totalDue += total; totalMonths += dues.length;
      return '<tr><td>' + BN(i + 1) + '</td><td>' + BN(s.regNo || s.id) + '</td><td>' + esc(s.name) +
        '</td><td>' + esc(s.attCls || s.cls || '-') + '</td><td>' + tk(monthlyFeeOf(s)) +
        '</td><td>' + BN(dues.length) + '</td>' +
        '<td style="color:' + (total ? '#c62828' : '#2e7d32') + ';font-weight:700;">' + tk(total) + '</td>' +
        '<td><button class="nq-btn sm" onclick="nqOpenFeeDetail(' + s.id + ')">বিস্তারিত</button></td></tr>';
    }).join('') || '<tr><td colspan="8" style="text-align:center;padding:18px;color:#888;">কোনো শিক্ষার্থী নেই</td></tr>';
    labelize(document.getElementById('nqMonthlyFeeTable'));
    var sum = document.getElementById('nqMonthlyFeeSummary');
    if (sum) sum.innerHTML = '<span>মোট শিক্ষার্থী: ' + BN(list.length) + ' জন</span>' +
      '<span>মোট মাস: ' + BN(totalMonths) + '</span>' +
      '<span style="color:#c62828;">মোট বকেয়া: ' + tk(totalDue) + '</span>';
  };

  var _rss = window.renderSalarySheet;
  if (typeof _rss === 'function') {
    window.renderSalarySheet = function () {
      var r = _rss.apply(this, arguments);
      labelize(document.getElementById('nqSalaryTable'));
      return r;
    };
  }

  window.renderLoginIds = function () {
    var body = document.getElementById('nqLoginIdBody');
    if (!body) return;
    var q = toEn((document.getElementById('nqLidSearch') || {}).value || '').trim().toLowerCase();
    var fKind = (document.getElementById('nqLidKind') || {}).value || '';
    var fState = (document.getElementById('nqLidState') || {}).value || '';
    var users = (typeof usersListData !== 'undefined') ? usersListData : [];
    var list = [];

    if (typeof students !== 'undefined') {
      students.filter(isActive).forEach(function (s) {
        list.push({ kind: 'শিক্ষার্থী', name: s.name, uid: uidOf(s), pass: passOf(s), ref: s, refType: 'student' });
      });
    }
    if (typeof teachers !== 'undefined') {
      teachers.forEach(function (t) {
        list.push({
          kind: 'স্টাফ', name: t.name, uid: t.loginUid || t.uid || t.name,
          pass: toEn(t.mobile || '').replace(/[^0-9]/g, ''), ref: t, refType: 'staff'
        });
      });
    }

    var rows = list.filter(function (r) {
      var acct = accountExists(r.uid);
      if (fKind && r.kind !== fKind) return false;
      if (fState === 'yes' && !acct) return false;
      if (fState === 'no' && acct) return false;
      if (!q) return true;
      return String(r.name).toLowerCase().indexOf(q) !== -1 || toEn(r.uid).toLowerCase().indexOf(q) !== -1;
    });

    var have = 0;
    body.innerHTML = rows.map(function (r, i) {
      var acct = users.filter(function (u) { return String(u.uid) === String(r.uid); })[0];
      if (acct) have++;
      var state = acct ? '<span class="nq-chip ok">অ্যাকাউন্ট আছে</span>' : '<span class="nq-chip wait">তৈরি হয়নি</span>';
      var act = acct
        ? '<button class="nq-btn sm grey" onclick="nqEditCred(\'' + acct.id + '\')">পরিবর্তন</button>'
        : '<button class="nq-btn sm green" onclick="nqCreateCred(\'' + r.refType + '\',' + (typeof r.ref.id === 'number' ? r.ref.id : "'" + r.ref.id + "'") + ')">আইডি তৈরি</button>';
      return '<tr><td>' + BN(i + 1) + '</td><td>' + esc(r.name) + '</td><td>' + r.kind +
        '</td><td><b>' + esc(r.uid) + '</b></td><td>' + (r.pass ? esc(r.pass) : '<span style="color:#c62828;">মোবাইল নেই</span>') +
        '</td><td>' + state + '</td><td>' + act + '</td></tr>';
    }).join('') || '<tr><td colspan="7" style="text-align:center;padding:18px;color:#888;">কোনো তথ্য নেই</td></tr>';
    labelize(document.getElementById('nqLoginIdTable'));

    var sum = document.getElementById('nqLoginIdSummary');
    if (sum) sum.innerHTML = '<span>মোট: ' + BN(rows.length) + ' জন</span>' +
      '<span style="color:#2e7d32;">অ্যাকাউন্ট আছে: ' + BN(have) + '</span>' +
      '<span style="color:#c62828;">বাকি: ' + BN(rows.length - have) + '</span>';

    if (!users.length && typeof loadUsers === 'function') {
      loadUsers().then(function () { setTimeout(window.renderLoginIds, 60); }).catch(function () {});
    }
  };

  window.nqCreateCred = async function (kind, id) {
    try {
      if (kind === 'student') {
        var s = students.filter(function (x) { return String(x.id) === String(id); })[0];
        var r = await window.nqEnsureStudentAccount(s, false);
        if (r && r.error) toast(r.error);
      } else if (typeof createTeacherLoginAccount === 'function') {
        var t = teachers.filter(function (x) { return String(x.id) === String(id); })[0];
        var r2 = await createTeacherLoginAccount(t.name, t.mobile);
        if (r2 && r2.uid) { t.loginUid = r2.uid; t.uid = r2.uid; toast('আইডি: ' + r2.uid + ' / পাসওয়ার্ড: ' + r2.password); }
        else toast((r2 && r2.error) || 'তৈরি করা যায়নি');
      }
      if (typeof nqScheduleSave === 'function') nqScheduleSave();
      if (typeof loadUsers === 'function') await loadUsers();
      window.renderLoginIds();
    } catch (e) { toast('ত্রুটি: ' + e.message); }
  };

  /* ══════════════════════════════════════════════════════════════════
     ২) "ফির তালিকা" — Action বাটনের কার্যকর পপআপ
     ══════════════════════════════════════════════════════════════════ */
  function ensureFeeModal() {
    if (document.getElementById('nqFeeDetailModal')) return;
    var d = document.createElement('div');
    d.className = 'nq-modal';
    d.id = 'nqFeeDetailModal';
    d.innerHTML =
      '<div class="nq-modal-box">' +
      '  <div class="nq-modal-head">' +
      '    <div><h3 id="nqFdName">—</h3><div class="sub" id="nqFdSub">—</div></div>' +
      '    <button class="nq-x" onclick="nqCloseFeeDetail()" aria-label="বন্ধ">✕</button>' +
      '  </div>' +
      '  <div class="nq-modal-body" id="nqFdBody"></div>' +
      '  <div class="nq-modal-foot">' +
      '    <button class="nq-btn grey" onclick="nqCloseFeeDetail()">বন্ধ করুন</button>' +
      '    <button class="nq-btn orange" id="nqFdPrint">রশিদ প্রিন্ট</button>' +
      '    <button class="nq-btn green" id="nqFdCollect">ফি আদায় করুন</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(d);
    d.addEventListener('click', function (e) { if (e.target === d) window.nqCloseFeeDetail(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && d.classList.contains('open')) window.nqCloseFeeDetail();
    });
  }

  window.nqCloseFeeDetail = function () {
    var m = document.getElementById('nqFeeDetailModal');
    if (m) m.classList.remove('open');
  };

  window.nqOpenFeeDetail = function (id) {
    if (typeof students === 'undefined') return;
    var s = students.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!s) return;
    ensureFeeModal();

    var dues = (typeof studentDues !== 'undefined' && studentDues[s.id]) || [];
    var totalDue = dues.reduce(function (a, d) { return a + Number(d.amount || 0); }, 0);
    var pays = (typeof payments !== 'undefined' ? payments : []).filter(function (p) {
      return (p.studentId != null ? String(p.studentId) === String(s.id) : p.student === s.name);
    }).sort(function (a, b) { return (a.dateISO || a.date) < (b.dateISO || b.date) ? 1 : -1; });
    var totalPaid = pays.reduce(function (a, p) { return a + Number(p.amount || 0); }, 0);

    document.getElementById('nqFdName').textContent = s.name;
    document.getElementById('nqFdSub').textContent =
      'রেজি নং: ' + BN(s.regNo || s.id) + ' • ' + (s.attCls || s.cls || '-') + ' • ' + (s.branch || s.attDept || '-');

    var info = [
      ['অভিভাবক', s.guardianName || s.parent || '—'],
      ['মোবাইল', mobileOf(s) || '—'],
      ['বিভাগ', s.attDept || s.dept || '—'],
      ['শাখা', s.branch || '—'],
      ['সেশন', s.session || '—'],
      ['মাসিক বেতন', tk(monthlyFeeOf(s))]
    ].map(function (r) {
      return '<div class="nq-info"><span class="k">' + r[0] + '</span><span class="v">' + esc(r[1]) + '</span></div>';
    }).join('');

    var dueRows = dues.map(function (d, i) {
      return '<tr><td data-label="ক্রম">' + BN(i + 1) + '</td>' +
        '<td data-label="বিবরণ">' + esc(d.label || 'ফি') + '</td>' +
        '<td data-label="মাস">' + esc(d.month || '—') + '</td>' +
        '<td data-label="পরিমাণ" style="color:#c62828;font-weight:700;">' + tk(d.amount) + '</td></tr>';
    }).join('') || '<tr><td class="nq-empty" colspan="4" style="text-align:center;color:#2e7d32;padding:14px;">কোনো বকেয়া নেই ✔</td></tr>';

    var payRows = pays.slice(0, 12).map(function (p, i) {
      return '<tr><td data-label="ক্রম">' + BN(i + 1) + '</td>' +
        '<td data-label="তারিখ">' + esc(p.date || p.dateISO || '—') + '</td>' +
        '<td data-label="মাস">' + esc(p.month || '—') + '</td>' +
        '<td data-label="পরিমাণ" style="color:#2e7d32;font-weight:700;">' + tk(p.amount) + '</td></tr>';
    }).join('') || '<tr><td class="nq-empty" colspan="4" style="text-align:center;color:#888;padding:14px;">কোনো আদায় পাওয়া যায়নি</td></tr>';

    document.getElementById('nqFdBody').innerHTML =
      '<div class="nq-info-grid">' + info + '</div>' +
      '<div class="nq-stat-row">' +
      '  <div class="nq-stat b1"><div class="k">মোট ফি (বকেয়া+আদায়)</div><div class="v">' + tk(totalDue + totalPaid) + '</div></div>' +
      '  <div class="nq-stat b2"><div class="k">পরিশোধিত</div><div class="v">' + tk(totalPaid) + '</div></div>' +
      '  <div class="nq-stat b3"><div class="k">বকেয়া</div><div class="v">' + tk(totalDue) + '</div></div>' +
      '</div>' +
      '<div class="nq-sub-title">বকেয়ার বিবরণ</div>' +
      '<div class="nq-tbl-wrap"><table class="nq-tbl"><thead><tr><th>ক্রম</th><th>বিবরণ</th><th>মাস</th><th>পরিমাণ</th></tr></thead><tbody>' + dueRows + '</tbody></table></div>' +
      '<div class="nq-sub-title">সাম্প্রতিক আদায়</div>' +
      '<div class="nq-tbl-wrap"><table class="nq-tbl"><thead><tr><th>ক্রম</th><th>তারিখ</th><th>মাস</th><th>পরিমাণ</th></tr></thead><tbody>' + payRows + '</tbody></table></div>';

    document.getElementById('nqFdCollect').onclick = function () {
      window.nqCloseFeeDetail();
      if (typeof showPage === 'function') showPage('adai');
      if (typeof selectAdaiStudent === 'function') setTimeout(function () { selectAdaiStudent(s.id); }, 60);
    };
    var printBtn = document.getElementById('nqFdPrint');
    printBtn.style.display = pays.length ? '' : 'none';
    printBtn.onclick = function () {
      if (typeof printReceipt !== 'function' || !pays.length) { toast('প্রিন্ট করার মতো রশিদ নেই'); return; }
      var last = pays[0];
      printReceipt({
        payerName: s.name,
        extraInfo: [
          ['রেজিস্ট্রেশন নং', BN(s.regNo || s.id)],
          ['শ্রেণী / শাখা', (s.attCls || s.cls || '') + ' - ' + (s.branch || '')]
        ],
        rows: [{ label: 'ফি — ' + (last.month || ''), amount: Number(last.amount || 0) }],
        discount: 0,
        paid: Number(last.amount || 0),
        due: totalDue,
        method: 'ক্যাশ',
        collectedBy: last.by || (typeof nqCurrentUserName === 'function' ? nqCurrentUserName() : 'ব্যবহারকারী')
      });
    };

    document.getElementById('nqFeeDetailModal').classList.add('open');
  };

  /* ফির তালিকার Action বাটন → পপআপ */
  function hookFeeList() {
    var _rfl = window.renderFeeList;
    if (typeof _rfl !== 'function' || _rfl.__nqWrapped) return;
    var wrapped = function () {
      var r = _rfl.apply(this, arguments);
      var body = document.getElementById('feeListBody');
      if (body) {
        [].forEach.call(body.querySelectorAll('tr'), function (tr) {
          var cell = tr.children[8];
          if (!cell) return;
          var m = /selectAdaiStudent\((\d+)\)/.exec(cell.innerHTML || '');
          if (!m) return;
          cell.innerHTML = '<button class="nq-btn sm" onclick="nqOpenFeeDetail(' + m[1] + ')">বিস্তারিত</button>';
        });
      }
      return r;
    };
    wrapped.__nqWrapped = true;
    window.renderFeeList = wrapped;
  }

  /* ══════════════════════════════════════════════════════════════════
     শুরু
     ══════════════════════════════════════════════════════════════════ */
  ready(function () {
    injectStyles();
    ensureFeeModal();
    hookFeeList();
    setTimeout(function () {
      rebuildPages();
      hookNewStudent();
      hookFeeList();
      if (typeof window.renderMonthlyFeePage === 'function') window.renderMonthlyFeePage();
      if (typeof window.renderLoginIds === 'function') window.renderLoginIds();
      if (typeof window.renderFeeList === 'function') try { window.renderFeeList(); } catch (e) {}
    }, 400);

    /* প্রথমবার সব শিক্ষার্থীর আইডি স্বয়ংক্রিয়ভাবে তৈরি */
    setTimeout(function () {
      try {
        if (localStorage.getItem('nq_auto_student_ids_v1') === 'done') return;
        if (!window.NQAuth || !window.NQAuth.authFetch) return;
        window.nqCreateAllStudentAccounts(false).then(function () {
          localStorage.setItem('nq_auto_student_ids_v1', 'done');
        }).catch(function () {});
      } catch (e) {}
    }, 4000);
  });
})();
