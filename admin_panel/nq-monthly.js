/* ==========================================================================
   নুরুল কোরআন মাদরাসা — স্বয়ংক্রিয় মাসিক ইঞ্জিন + লগইন আইডি ব্যবস্থাপনা
   --------------------------------------------------------------------------
   এই ফাইলটি admin.html-এর মূল স্ক্রিপ্টের পরে লোড হয় এবং যুক্ত করে:

   ১) প্রতি মাসে শিক্ষার্থীর মাসিক বেতন স্বয়ংক্রিয়ভাবে বকেয়ায় যোগ (আদায়
      মডিউলের সাথেই কাজ করে) — ভর্তির মাস থেকে চলতি মাস পর্যন্ত।
   ২) প্রতি মাসে স্টাফের বেতন শীট স্বয়ংক্রিয়ভাবে তৈরি — পরিশোধ করলে
      সরাসরি ব্যয় (expense) হিসেবে হিসাবে যুক্ত হয়।
   ৩) "মাসিক বেতন (স্বয়ংক্রিয়)", "স্টাফ বেতন শীট" ও "লগইন আইডি" — তিনটি
      নতুন পেজ ও মেনু।
   ৪) বাড়ির কাজ সংরক্ষণ করলে সংশ্লিষ্ট শ্রেণীর শিক্ষার্থী/অভিভাবকের
      অ্যাপে নোটিফিকেশন পাঠানো।
   ========================================================================== */
(function () {
  'use strict';

  /* ───────────────── সহায়ক ───────────────── */
  var BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

  function BN(n) { return (typeof bn === 'function') ? bn(n) : String(n); }
  function toEnDigits(s) {
    return String(s == null ? '' : s).replace(/[০-৯]/g, function (d) { return '০১২৩৪৫৬৭৮৯'.indexOf(d); });
  }
  function taka(n) { return BN(Number(n || 0).toLocaleString('en')) + '/-'; }
  function ymNow() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }
  function ymLabel(ym) {
    var p = ym.split('-');
    return BN_MONTHS[parseInt(p[1], 10) - 1] + ' ' + BN(p[0]);
  }
  function ymRange(from, to) {
    var out = [];
    if (!from || from > to) from = to;
    var y = parseInt(from.split('-')[0], 10), m = parseInt(from.split('-')[1], 10);
    var ty = parseInt(to.split('-')[0], 10), tm = parseInt(to.split('-')[1], 10);
    var guard = 0;
    while ((y < ty || (y === ty && m <= tm)) && guard++ < 240) {
      out.push(y + '-' + String(m).padStart(2, '0'));
      m++; if (m > 12) { m = 1; y++; }
    }
    return out;
  }
  /* যেকোনো ফরম্যাটের তারিখ (ইং/বাংলা সংখ্যা, dd-mm-yyyy বা yyyy-mm-dd) → YYYY-MM */
  function toYm(value) {
    if (!value) return null;
    var s = toEnDigits(value).trim().replace(/\s*ইং\s*/g, '');
    var m = s.match(/^(\d{4})[-/](\d{1,2})/);
    if (m) return m[1] + '-' + String(m[2]).padStart(2, '0');
    m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (m) return m[3] + '-' + String(m[2]).padStart(2, '0');
    // "জুলাই ২০২৬" ধরনের লেখা
    for (var i = 0; i < BN_MONTHS.length; i++) {
      if (String(value).indexOf(BN_MONTHS[i]) !== -1) {
        var yr = (s.match(/(\d{4})/) || [])[1] || String(new Date().getFullYear());
        return yr + '-' + String(i + 1).padStart(2, '0');
      }
    }
    return null;
  }
  function nid() { return Date.now() + Math.floor(Math.random() * 100000); }
  function toast(m) { if (typeof showToast === 'function') showToast(m); }

  /* ─────────── স্থায়ী অবস্থা (সার্ভারে সংরক্ষিত) ─────────── */
  window.nqAutoFeeLog = window.nqAutoFeeLog || {};      // { studentId: ['2026-01', ...] }
  window.nqAutoSalaryLog = window.nqAutoSalaryLog || {}; // { staffId: ['2026-01', ...] }
  window.staffSalaries = window.staffSalaries || [];     // বেতন শীট
  window.nqMonthlyMeta = window.nqMonthlyMeta || { lastRun: '' };

  /* সেভ/লোডে নতুন কী-গুলো যুক্ত করা */
  var _snap = window.nqStateSnapshot;
  if (typeof _snap === 'function') {
    window.nqStateSnapshot = function () {
      var s = _snap.apply(this, arguments) || {};
      s.nqAutoFeeLog = window.nqAutoFeeLog;
      s.nqAutoSalaryLog = window.nqAutoSalaryLog;
      s.staffSalaries = window.staffSalaries;
      s.nqMonthlyMeta = window.nqMonthlyMeta;
      return s;
    };
  }
  var _apply = window.nqApplyLoadedState;
  if (typeof _apply === 'function') {
    window.nqApplyLoadedState = function (data) {
      var r = _apply.apply(this, arguments);
      if (data && typeof data === 'object') {
        if (data.nqAutoFeeLog) window.nqAutoFeeLog = data.nqAutoFeeLog;
        if (data.nqAutoSalaryLog) window.nqAutoSalaryLog = data.nqAutoSalaryLog;
        if (Array.isArray(data.staffSalaries)) window.staffSalaries = data.staffSalaries;
        if (data.nqMonthlyMeta) window.nqMonthlyMeta = data.nqMonthlyMeta;
      }
      setTimeout(function () { NQMonthly.run(false); }, 300);
      return r;
    };
  }

  /* ───────────────── বেতনের পরিমাণ নির্ণয় ───────────────── */
  function monthlyFeeOf(s) {
    if (s.monthlyFee) return Number(s.monthlyFee) || 0;
    var fb = s.feeBreakdown || [];
    for (var i = 0; i < fb.length; i++) {
      if (/মাসিক বেতন/.test(fb[i].label || '')) {
        return Number(fb[i].selected != null ? fb[i].selected : fb[i].original) || 0;
      }
    }
    var residential = /আবাসিক/.test((s.branch || '') + (s.attDept || '') + (s.group || ''));
    var wanted = residential ? 'আবাসিক মাসিক বেতন' : 'মাসিক বেতন';
    if (typeof feeTypes !== 'undefined' && Array.isArray(feeTypes)) {
      var ft = feeTypes.filter(function (f) { return f.name === wanted; })[0] ||
        feeTypes.filter(function (f) { return f.name === 'মাসিক বেতন'; })[0];
      if (ft) return Number(ft.amount) || 0;
    }
    return residential ? 4500 : 500;
  }
  function studentStartYm(s) {
    return toYm(s.startMonth) || toYm(s.admission) || toYm(s.session) || ymNow();
  }
  function staffStartYm(t) {
    return toYm(t.join) || toYm(t.recruitDate) || ymNow();
  }
  function isActive(x) { return !x.status || x.status === 'সক্রিয়'; }

  /* ───────────────── মূল ইঞ্জিন ───────────────── */
  var NQMonthly = {
    run: function (manual) {
      if (typeof students === 'undefined' || typeof studentDues === 'undefined') return { fees: 0, salaries: 0 };
      var cur = ymNow(), addedFee = 0, addedSal = 0;

      /* ১) শিক্ষার্থীর মাসিক বেতন → বকেয়া */
      students.filter(isActive).forEach(function (s) {
        var amount = monthlyFeeOf(s);
        if (!amount) return;
        var log = window.nqAutoFeeLog[s.id] || (window.nqAutoFeeLog[s.id] = []);
        if (!studentDues[s.id]) studentDues[s.id] = [];
        ymRange(studentStartYm(s), cur).forEach(function (ym) {
          if (log.indexOf(ym) !== -1) return;         // আগেই তৈরি হয়েছে
          log.push(ym);
          studentDues[s.id].push({
            id: nid(), label: 'মাসিক বেতন — ' + ymLabel(ym),
            amount: amount, month: ym, auto: true
          });
          addedFee++;
        });
      });

      /* ২) স্টাফের মাসিক বেতন শীট */
      if (typeof teachers !== 'undefined') {
        teachers.filter(isActive).forEach(function (t) {
          var amount = Number(t.salary) || 0;
          if (!amount) return;
          var log = window.nqAutoSalaryLog[t.id] || (window.nqAutoSalaryLog[t.id] = []);
          ymRange(staffStartYm(t), cur).forEach(function (ym) {
            if (log.indexOf(ym) !== -1) return;
            log.push(ym);
            window.staffSalaries.push({
              id: nid(), staffId: t.id, name: t.name, title: t.title || '',
              month: ym, amount: amount, paid: 0, status: 'বকেয়া', paidDate: ''
            });
            addedSal++;
          });
        });
      }

      window.nqMonthlyMeta.lastRun = cur;
      if (addedFee || addedSal) {
        if (typeof rebuildDueDetails === 'function') rebuildDueDetails();
        if (typeof nqScheduleSave === 'function') nqScheduleSave();
        if (typeof renderAll === 'function') try { renderAll(); } catch (e) {}
      }
      if (manual) {
        toast('স্বয়ংক্রিয় হিসাব সম্পন্ন — ' + BN(addedFee) + ' টি বেতন বকেয়া, ' + BN(addedSal) + ' টি স্টাফ বেতন যোগ হয়েছে');
        renderMonthlyFeePage();
        renderSalarySheet();
      }
      return { fees: addedFee, salaries: addedSal };
    }
  };
  window.NQMonthly = NQMonthly;

  /* ───────────── স্টাফ বেতন পরিশোধ ───────────── */
  window.nqPaySalary = function (rowId) {
    var row = window.staffSalaries.filter(function (r) { return r.id === rowId; })[0];
    if (!row || row.status === 'পরিশোধিত') return;
    var rest = row.amount - (row.paid || 0);
    var input = prompt('পরিশোধের পরিমাণ (বাকি ' + rest + ' টাকা):', String(rest));
    if (input === null) return;
    var amt = parseFloat(toEnDigits(input)) || 0;
    if (amt <= 0) return;
    row.paid = (row.paid || 0) + amt;
    row.status = row.paid >= row.amount ? 'পরিশোধিত' : 'আংশিক';
    row.paidDate = new Date().toISOString().slice(0, 10);

    if (typeof financeTx !== 'undefined') {
      financeTx.unshift({
        id: (typeof financeTxSeq !== 'undefined' ? financeTxSeq++ : nid()),
        date: row.paidDate, name: row.name,
        desc: 'স্টাফ বেতন — ' + ymLabel(row.month),
        type: 'expense', amount: amt,
        by: (typeof currentUserName === 'function' ? currentUserName() : 'ব্যবহারকারী')
      });
    }
    if (typeof nqScheduleSave === 'function') nqScheduleSave();
    renderSalarySheet();
    toast('বেতন পরিশোধ করা হয়েছে — ' + taka(amt));
    nqNotifyStaff(row);
  };

  function nqNotifyStaff(row) {
    var t = (typeof teachers !== 'undefined') ? teachers.filter(function (x) { return x.id === row.staffId; })[0] : null;
    if (!t || !window.NQAuth) return;
    var uid = t.uid || t.loginUid || t.name;
    window.NQAuth.postJSON('/api/notifications/send', {
      uids: [uid], type: 'salary',
      title: 'বেতন পরিশোধ',
      body: ymLabel(row.month) + ' মাসের বেতন বাবদ ' + row.amount + ' টাকার মধ্যে ' + row.paid + ' টাকা পরিশোধ করা হয়েছে।'
    }).catch(function () {});
  }

  /* ───────────────── পেজ ইনজেকশন ───────────────── */
  function pageHtml(id, inner) {
    var d = document.createElement('div');
    d.className = 'page';
    d.id = 'page-' + id;
    d.innerHTML = inner;
    return d;
  }

  function injectPages() {
    var content = document.querySelector('.content');
    if (!content || document.getElementById('page-monthlyFee')) return;

    content.appendChild(pageHtml('monthlyFee',
      '<div class="card"><div class="card-head"><h3>মাসিক বেতন (স্বয়ংক্রিয়)</h3>' +
      '<button class="btn btn-green" onclick="NQMonthly.run(true)">এখনই হিসাব করুন</button></div>' +
      '<p style="margin:0 0 10px;color:#666;font-size:13.5px;">ভর্তির মাস থেকে চলতি মাস পর্যন্ত প্রতিটি শিক্ষার্থীর মাসিক বেতন স্বয়ংক্রিয়ভাবে বকেয়ায় যুক্ত হয়। আদায় করলে বকেয়া কমে যায়।</p>' +
      '<div style="overflow:auto;"><table class="tbl"><thead><tr>' +
      '<th>ক্রম</th><th>রেজি নং</th><th>নাম</th><th>শ্রেণী</th><th>মাসিক বেতন</th><th>মোট মাস</th><th>মোট বকেয়া</th>' +
      '</tr></thead><tbody id="nqMonthlyFeeBody"></tbody></table></div></div>'));

    content.appendChild(pageHtml('salarySheet',
      '<div class="card"><div class="card-head"><h3>স্টাফ বেতন শীট</h3>' +
      '<span><select id="nqSalMonth" onchange="renderSalarySheet()" style="padding:7px 10px;border:1px solid #ddd;border-radius:8px;"></select> ' +
      '<button class="btn btn-green" onclick="NQMonthly.run(true)">হালনাগাদ</button></span></div>' +
      '<div style="overflow:auto;"><table class="tbl"><thead><tr>' +
      '<th>ক্রম</th><th>নাম</th><th>পদবী</th><th>মাস</th><th>বেতন</th><th>পরিশোধিত</th><th>বাকি</th><th>অবস্থা</th><th>অ্যাকশন</th>' +
      '</tr></thead><tbody id="nqSalaryBody"></tbody></table></div>' +
      '<div id="nqSalarySummary" style="margin-top:10px;font-weight:600;"></div></div>'));

    content.appendChild(pageHtml('loginIds',
      '<div class="card"><div class="card-head"><h3>লগইন আইডি ব্যবস্থাপনা</h3>' +
      '<button class="btn btn-green" onclick="renderLoginIds()">রিফ্রেশ</button></div>' +
      '<p style="margin:0 0 10px;color:#666;font-size:13.5px;">শিক্ষার্থীর আইডি স্বয়ংক্রিয়ভাবে ০১, ০২... এবং পাসওয়ার্ড অভিভাবকের মোবাইল নম্বর। স্টাফের আইডি তাঁর নাম ও পাসওয়ার্ড মোবাইল নম্বর। প্রয়োজনে নিচে পরিবর্তন করুন।</p>' +
      '<div style="margin-bottom:10px;"><input id="nqLidSearch" oninput="renderLoginIds()" placeholder="নাম বা আইডি দিয়ে খুঁজুন" style="padding:8px 12px;border:1px solid #ddd;border-radius:8px;min-width:240px;"></div>' +
      '<div style="overflow:auto;"><table class="tbl"><thead><tr>' +
      '<th>ক্রম</th><th>নাম</th><th>ধরন</th><th>লগইন আইডি</th><th>পাসওয়ার্ড</th><th>অবস্থা</th><th>অ্যাকশন</th>' +
      '</tr></thead><tbody id="nqLoginIdBody"></tbody></table></div></div>'));
  }

  function injectNav() {
    var feeMenu = document.querySelector('.nav-drop[data-mod="fee"] .nav-drop-menu');
    if (feeMenu && !feeMenu.querySelector('[data-nq="monthlyFee"]')) {
      var b1 = document.createElement('button');
      b1.className = 'nav-drop-item'; b1.setAttribute('data-nq', 'monthlyFee');
      b1.textContent = 'মাসিক বেতন (স্বয়ংক্রিয়)';
      b1.onclick = function () { showPage('monthlyFee'); renderMonthlyFeePage(); };
      feeMenu.appendChild(b1);
    }
    var staffMenu = document.querySelector('.nav-drop[data-mod="staff"] .nav-drop-menu') ||
      document.querySelector('.nav-drop[data-mod="teacher"] .nav-drop-menu');
    if (staffMenu && !staffMenu.querySelector('[data-nq="salarySheet"]')) {
      var b2 = document.createElement('button');
      b2.className = 'nav-drop-item'; b2.setAttribute('data-nq', 'salarySheet');
      b2.textContent = 'বেতন শীট (স্বয়ংক্রিয়)';
      b2.onclick = function () { showPage('salarySheet'); renderSalarySheet(); };
      staffMenu.appendChild(b2);
    }
    var userMenu = document.querySelector('.nav-drop[data-mod="users"] .nav-drop-menu');
    if (userMenu && !userMenu.querySelector('[data-nq="loginIds"]')) {
      var b3 = document.createElement('button');
      b3.className = 'nav-drop-item'; b3.setAttribute('data-nq', 'loginIds');
      b3.textContent = 'লগইন আইডি ব্যবস্থাপনা';
      b3.onclick = function () { showPage('loginIds'); renderLoginIds(); };
      userMenu.appendChild(b3);
    }
  }

  /* ───────────────── রেন্ডার ───────────────── */
  window.renderMonthlyFeePage = function () {
    var body = document.getElementById('nqMonthlyFeeBody');
    if (!body || typeof students === 'undefined') return;
    var rows = students.filter(isActive).map(function (s, i) {
      var dues = (studentDues[s.id] || []).filter(function (d) { return d.auto; });
      var total = dues.reduce(function (a, d) { return a + Number(d.amount || 0); }, 0);
      return '<tr><td>' + BN(i + 1) + '</td><td>' + BN(s.regNo || s.id) + '</td><td>' + s.name +
        '</td><td>' + (s.cls || '-') + '</td><td>' + taka(monthlyFeeOf(s)) + '</td><td>' + BN(dues.length) +
        '</td><td style="color:' + (total ? '#c0392b' : '#16a34a') + ';font-weight:700;">' + taka(total) + '</td></tr>';
    });
    body.innerHTML = rows.join('') ||
      '<tr><td colspan="7" style="text-align:center;padding:18px;color:#888;">কোনো শিক্ষার্থী নেই</td></tr>';
  };

  window.renderSalarySheet = function () {
    var body = document.getElementById('nqSalaryBody');
    if (!body) return;
    var sel = document.getElementById('nqSalMonth');
    var months = [];
    window.staffSalaries.forEach(function (r) { if (months.indexOf(r.month) === -1) months.push(r.month); });
    months.sort().reverse();
    if (sel && sel.options.length !== months.length + 1) {
      var keep = sel.value;
      sel.innerHTML = '<option value="">সব মাস</option>' +
        months.map(function (m) { return '<option value="' + m + '">' + ymLabel(m) + '</option>'; }).join('');
      sel.value = keep || (months[0] || '');
    }
    var filter = sel ? sel.value : '';
    var rows = window.staffSalaries
      .filter(function (r) { return !filter || r.month === filter; })
      .sort(function (a, b) { return a.month < b.month ? 1 : -1; });

    body.innerHTML = rows.map(function (r, i) {
      var rest = Math.max(r.amount - (r.paid || 0), 0);
      var color = r.status === 'পরিশোধিত' ? '#16a34a' : (r.status === 'আংশিক' ? '#d97706' : '#c0392b');
      return '<tr><td>' + BN(i + 1) + '</td><td>' + r.name + '</td><td>' + (r.title || '-') +
        '</td><td>' + ymLabel(r.month) + '</td><td>' + taka(r.amount) + '</td><td>' + taka(r.paid || 0) +
        '</td><td>' + taka(rest) + '</td><td style="color:' + color + ';font-weight:700;">' + r.status + '</td>' +
        '<td>' + (rest > 0
          ? '<button class="btn btn-green" style="padding:5px 12px;font-size:12.5px;" onclick="nqPaySalary(' + r.id + ')">পরিশোধ</button>'
          : '<span style="color:#16a34a;">✔</span>') + '</td></tr>';
    }).join('') || '<tr><td colspan="9" style="text-align:center;padding:18px;color:#888;">কোনো তথ্য নেই</td></tr>';

    var totalAmt = rows.reduce(function (a, r) { return a + r.amount; }, 0);
    var totalPaid = rows.reduce(function (a, r) { return a + (r.paid || 0); }, 0);
    var sum = document.getElementById('nqSalarySummary');
    if (sum) sum.innerHTML = 'মোট বেতন: ' + taka(totalAmt) + ' &nbsp;|&nbsp; পরিশোধিত: ' + taka(totalPaid) +
      ' &nbsp;|&nbsp; <span style="color:#c0392b;">বকেয়া: ' + taka(totalAmt - totalPaid) + '</span>';
  };

  window.renderLoginIds = function () {
    var body = document.getElementById('nqLoginIdBody');
    if (!body) return;
    var q = (document.getElementById('nqLidSearch') || {}).value || '';
    q = q.trim().toLowerCase();
    var list = [];
    if (typeof students !== 'undefined') {
      students.forEach(function (s) {
        list.push({
          kind: 'শিক্ষার্থী', name: s.name,
          uid: s.uid || s.loginUid || String(s.id).padStart(2, '0'),
          pass: s.guardianMobile || s.mobile || '',
          ref: s, refType: 'student'
        });
      });
    }
    if (typeof teachers !== 'undefined') {
      teachers.forEach(function (t) {
        list.push({
          kind: 'স্টাফ', name: t.name, uid: t.uid || t.loginUid || t.name,
          pass: t.mobile || '', ref: t, refType: 'staff'
        });
      });
    }
    var users = (typeof usersListData !== 'undefined' ? usersListData : []);
    var rows = list.filter(function (r) {
      return !q || r.name.toLowerCase().indexOf(q) !== -1 || String(r.uid).toLowerCase().indexOf(q) !== -1;
    });

    body.innerHTML = rows.map(function (r, i) {
      var acct = users.filter(function (u) { return u.uid === String(r.uid); })[0];
      var state = acct
        ? '<span class="badge badge-green">অ্যাকাউন্ট আছে</span>'
        : '<span class="badge badge-blue">তৈরি হয়নি</span>';
      var act = acct
        ? '<button class="btn btn-green" style="padding:5px 10px;font-size:12.5px;" onclick="nqEditCred(\'' + acct.id + '\')">পরিবর্তন</button>'
        : '<button class="btn btn-green" style="padding:5px 10px;font-size:12.5px;" onclick="nqCreateCred(\'' + r.refType + '\',' + r.ref.id + ')">আইডি তৈরি</button>';
      return '<tr><td>' + BN(i + 1) + '</td><td>' + r.name + '</td><td>' + r.kind + '</td><td><b>' + r.uid +
        '</b></td><td>' + (r.pass ? r.pass : '<span style="color:#c0392b;">মোবাইল নেই</span>') +
        '</td><td>' + state + '</td><td>' + act + '</td></tr>';
    }).join('') || '<tr><td colspan="7" style="text-align:center;padding:18px;color:#888;">কোনো তথ্য নেই</td></tr>';

    if (!users.length && typeof loadUsers === 'function') {
      loadUsers().then(function () { setTimeout(window.renderLoginIds, 50); }).catch(function () {});
    }
  };

  window.nqEditCred = function (userId) {
    if (typeof editUser === 'function') editUser(userId);
  };

  window.nqCreateCred = async function (kind, id) {
    try {
      if (kind === 'student' && typeof createStudentLoginAccount === 'function') {
        var s = students.filter(function (x) { return x.id === id; })[0];
        var r = await createStudentLoginAccount(s.id, s.name, s.guardianMobile || s.mobile);
        if (r && r.uid) { s.loginUid = r.uid; s.uid = r.uid; toast('আইডি: ' + r.uid + ' / পাসওয়ার্ড: ' + r.password); }
        else toast((r && r.error) || 'তৈরি করা যায়নি');
      } else if (kind === 'staff' && typeof createTeacherLoginAccount === 'function') {
        var t = teachers.filter(function (x) { return x.id === id; })[0];
        var r2 = await createTeacherLoginAccount(t.name, t.mobile);
        if (r2 && r2.uid) { t.loginUid = r2.uid; t.uid = r2.uid; toast('আইডি: ' + r2.uid + ' / পাসওয়ার্ড: ' + r2.password); }
        else toast((r2 && r2.error) || 'তৈরি করা যায়নি');
      }
      if (typeof nqScheduleSave === 'function') nqScheduleSave();
      if (typeof loadUsers === 'function') await loadUsers();
      window.renderLoginIds();
    } catch (e) { toast('ত্রুটি: ' + e.message); }
  };

  /* ───── অ্যাকাউন্ট তৈরি হলে রেকর্ডে লগইন আইডি সংরক্ষণ ───── */
  var _cs = window.createStudentLoginAccount;
  if (typeof _cs === 'function') {
    window.createStudentLoginAccount = async function (startId, name, mobile) {
      var r = await _cs.apply(this, arguments);
      if (r && r.uid && typeof students !== 'undefined') {
        var s = students.filter(function (x) { return x.id === startId; })[0];
        if (s) { s.loginUid = r.uid; s.uid = r.uid; if (typeof nqScheduleSave === 'function') nqScheduleSave(); }
      }
      return r;
    };
  }
  var _ct = window.createTeacherLoginAccount;
  if (typeof _ct === 'function') {
    window.createTeacherLoginAccount = async function (name, mobile) {
      var r = await _ct.apply(this, arguments);
      if (r && r.uid && typeof teachers !== 'undefined') {
        var t = teachers.filter(function (x) { return x.name === name; }).pop();
        if (t) { t.loginUid = r.uid; t.uid = r.uid; if (typeof nqScheduleSave === 'function') nqScheduleSave(); }
      }
      return r;
    };
  }

  /* ───────── বাড়ির কাজ → নোটিফিকেশন ───────── */
  function uidsOfStudents(list) {
    return list.map(function (s) { return s.uid || s.loginUid || String(s.id).padStart(2, '0'); });
  }
  function sendNotify(uids, title, body) {
    if (!uids.length || !window.NQAuth) return;
    window.NQAuth.postJSON('/api/notifications/send', {
      uids: uids, title: title, body: body, type: 'homework', url: './student.html#homework'
    }).then(function () {
      toast('অভিভাবক/শিক্ষার্থীর অ্যাপে নোটিফিকেশন পাঠানো হয়েছে (' + BN(uids.length) + ' জন)');
    }).catch(function () {});
  }

  var _hwd = window.saveHwDaily;
  if (typeof _hwd === 'function') {
    window.saveHwDaily = function () {
      var cls = (document.getElementById('hwdClass') || {}).value || '';
      var subject = (document.getElementById('hwdSubject') || {}).value || '';
      var task = ((document.getElementById('hwdTask') || {}).value || '').trim();
      var before = (typeof hwDailyList !== 'undefined') ? hwDailyList.length : 0;
      _hwd.apply(this, arguments);
      if (typeof hwDailyList !== 'undefined' && hwDailyList.length > before) {
        var targets = students.filter(function (s) { return isActive(s) && (s.cls === cls || s.attCls === cls); });
        sendNotify(uidsOfStudents(targets), 'নতুন বাড়ির কাজ — ' + cls,
          subject + ': ' + task);
      }
    };
  }
  var _hwr = window.saveHwResidential;
  if (typeof _hwr === 'function') {
    window.saveHwResidential = function () {
      var ids = Array.prototype.slice.call(document.querySelectorAll('.hwr-stu-check:checked'))
        .map(function (c) { return Number(c.value); });
      var comment = ((document.getElementById('hwrComment') || {}).value || '').trim();
      var category = (document.querySelector('input[name="hwrCategory"]:checked') || {}).value || 'আবাসিক';
      var before = (typeof hwResidentialList !== 'undefined') ? hwResidentialList.length : 0;
      _hwr.apply(this, arguments);
      if (typeof hwResidentialList !== 'undefined' && hwResidentialList.length > before) {
        var targets = students.filter(function (s) { return ids.indexOf(s.id) !== -1; });
        sendNotify(uidsOfStudents(targets), 'নতুন বাড়ির কাজ — ' + category, comment || category);
      }
    };
  }

  /* ───────────────── শুরু ───────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    injectPages();
    injectNav();
    setTimeout(function () { NQMonthly.run(false); }, 1500);
    // প্রতি ঘন্টায় একবার নতুন মাস এসেছে কিনা দেখা হয়
    setInterval(function () {
      if (window.nqMonthlyMeta.lastRun !== ymNow()) NQMonthly.run(false);
    }, 60 * 60 * 1000);
  });
})();
