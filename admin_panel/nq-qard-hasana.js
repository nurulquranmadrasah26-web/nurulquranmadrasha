/* কর্জে হাসানা — Super Admin / Admin / Teacher panel module */
(function () {
  'use strict';

  function role() {
    return String((window.NQAuth && window.NQAuth.role) || '').toLowerCase().replace(/[\s_-]+/g, '');
  }
  function allowed() { return ['superadmin', 'admin', 'teacher'].indexOf(role()) !== -1; }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }
  function bn(v) { return String(v == null ? '' : v).replace(/[০-৯]/g, function (d) { return String('০১২৩৪৫৬৭৮৯'.indexOf(d)); }); }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function dateBn(v) {
    var p = String(v || '').split('-');
    return p.length === 3 ? bn(p[2] + '/' + p[1] + '/' + p[0]) : (v || '-');
  }
  var remoteStudentCache = [];
  var remoteStudentPromise = null;
  function storeStudents() {
    if (typeof students !== 'undefined' && Array.isArray(students) && students.length) return students;
    if (Array.isArray(window.students) && window.students.length) return window.students;
    if (window.S && Array.isArray(window.S.students) && window.S.students.length) return window.S.students;
    return remoteStudentCache;
  }
  function loadStudentsIfNeeded() {
    if (storeStudents().length || remoteStudentPromise) return remoteStudentPromise || Promise.resolve(storeStudents());
    remoteStudentPromise = api('/api/store').then(function (data) {
      remoteStudentCache = Array.isArray(data.students) ? data.students : [];
      renderSuggestions();
      return remoteStudentCache;
    }).catch(function () {
      remoteStudentCache = [];
      return remoteStudentCache;
    });
    return remoteStudentPromise;
  }
  function api(path, options) {
    return window.NQAuth.authFetch(path, options || {}).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) throw new Error(data.message || 'সার্ভার ত্রুটি');
        return data;
      });
    });
  }

  function addStyles() {
    if (document.getElementById('nqQardStyles')) return;
    var s = document.createElement('style');
    s.id = 'nqQardStyles';
    s.textContent = [
      '.nq-qard-wrap{background:#fff;border-radius:14px;padding:18px;box-shadow:0 2px 12px rgba(15,23,42,.06);}',
      '.nq-qard-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px;}',
      '.nq-qard-head h2{margin:0;color:#173b2c;font-size:20px;}',
      '.nq-qard-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}',
      '.nq-qard-field{display:flex;flex-direction:column;gap:5px;position:relative;}',
      '.nq-qard-field.full{grid-column:1/-1;}',
      '.nq-qard-field label{font-size:13px;font-weight:700;color:#475569;}',
      '.nq-qard-field input,.nq-qard-field textarea{font:inherit;border:1px solid #d9e1dc;border-radius:8px;padding:9px 11px;background:#fbfdfb;}',
      '.nq-qard-field textarea{min-height:74px;resize:vertical;}',
      '.nq-qard-suggest{position:absolute;left:0;right:0;top:100%;z-index:20;background:#fff;border:1px solid #cbd5e1;border-radius:0 0 8px 8px;max-height:190px;overflow:auto;box-shadow:0 6px 18px rgba(0,0,0,.12);}',
      '.nq-qard-suggest button{display:block;width:100%;text-align:left;background:#fff;padding:9px 11px;border:0;border-bottom:1px solid #eef2f0;font:inherit;cursor:pointer;}',
      '.nq-qard-suggest button:hover{background:#edf8f0;}',
      '.nq-qard-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:14px;}',
      '.nq-qard-btn{border:0;border-radius:8px;padding:9px 15px;background:#176b42;color:#fff;font:600 14px inherit;cursor:pointer;}',
      '.nq-qard-btn.secondary{background:#e8f3ec;color:#176b42;}.nq-qard-btn.warn{background:#b45309;}',
      '.nq-qard-table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px;}.nq-qard-table th,.nq-qard-table td{padding:9px 8px;border-bottom:1px solid #edf0ee;text-align:left;vertical-align:top;}.nq-qard-table th{background:#f2f8f3;color:#315642;white-space:nowrap;}',
      '.nq-qard-status{display:inline-block;border-radius:999px;padding:3px 8px;font-size:12px;font-weight:700;}.nq-qard-status.outstanding{background:#fff4d6;color:#9a6700;}.nq-qard-status.returned{background:#e1f5e8;color:#176b42;}',
      '.nq-qard-empty{text-align:center;color:#94a3b8;padding:24px;}.nq-qard-note{font-size:12px;color:#64748b;margin-top:6px;}',
      '@media(max-width:700px){.nq-qard-grid{grid-template-columns:1fr;}.nq-qard-field.full{grid-column:auto;}.nq-qard-table{display:block;overflow:auto;white-space:nowrap;}}',
      '@media print{body *{visibility:hidden!important}.nq-qard-wrap,.nq-qard-wrap *{visibility:visible!important}.nq-qard-wrap{position:absolute;left:0;top:0;width:100%;box-shadow:none}.nq-qard-form{display:none!important}.nq-qard-table button{display:none!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  var qardItems = [];
  var selectedStudent = null;

  function ensureView() {
    if (document.getElementById('nqQardPage')) return;
    var host = document.querySelector('.content') || document.querySelector('main') || document.body;
    var page = document.createElement('section');
    page.id = 'nqQardPage';
    page.className = 'page view nq-qard-view';
    page.innerHTML =
      '<div class="nq-qard-wrap">' +
      '<div class="nq-qard-head"><h2>কর্জে হাসানা</h2><div class="nq-qard-actions" style="margin:0"><button class="nq-qard-btn secondary" onclick="nqQardPrint()"><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg> ইতিহাস প্রিন্ট</button><button class="nq-qard-btn secondary" onclick="nqQardLoad()">↻ রিফ্রেশ</button></div></div>' +
      '<div class="nq-qard-form">' +
      '<div class="nq-qard-grid">' +
      '<div class="nq-qard-field"><label>শিক্ষার্থী (শ্রেণী/আইডি/নাম দিয়ে খুঁজুন)</label><input id="nqQardStudentSearch" autocomplete="off" placeholder="শিক্ষার্থীর নাম বা আইডি"><div id="nqQardSuggestions" class="nq-qard-suggest" style="display:none"></div><div id="nqQardSelected" class="nq-qard-note">কোনো শিক্ষার্থী নির্বাচিত হয়নি</div></div>' +
      '<div class="nq-qard-field"><label>কর্জ প্রদানকারী (লগইন করা আইডি)</label><input id="nqQardLender" readonly></div>' +
      '<div class="nq-qard-field"><label>কর্জ নেওয়ার তারিখ</label><input id="nqQardIssueDate" type="date"></div>' +
      '<div class="nq-qard-field"><label>ফেরত দেওয়ার তারিখ</label><input id="nqQardDueDate" type="date"></div>' +
      '<div class="nq-qard-field full"><label>কী কর্জ নিচ্ছে / বিবরণ</label><textarea id="nqQardDescription" placeholder="যেমন: চিকিৎসার জন্য সাময়িক সহায়তা"></textarea></div>' +
      '</div><div class="nq-qard-actions"><button class="nq-qard-btn" onclick="nqQardSubmit()">✓ কর্জে হাসানা সংরক্ষণ করুন</button><span class="nq-qard-note">এটি আয়/ব্যয়ের হিসাবে যোগ হবে না।</span></div>' +
      '</div>' +
      '<div id="nqQardHistory"><div class="nq-qard-empty">লোড হচ্ছে...</div></div>' +
      '</div>';
    host.appendChild(page);
    var u = window.NQAuth && window.NQAuth.user || {};
    document.getElementById('nqQardLender').value = (u.name || u.uid || '') + ' (' + (u.uid || '-') + ')';
    document.getElementById('nqQardIssueDate').value = today();
    var due = new Date(); due.setDate(due.getDate() + 30);
    document.getElementById('nqQardDueDate').value = due.getFullYear() + '-' + String(due.getMonth() + 1).padStart(2, '0') + '-' + String(due.getDate()).padStart(2, '0');
    document.getElementById('nqQardStudentSearch').addEventListener('input', renderSuggestions);
    loadStudentsIfNeeded();
  }

  function renderSuggestions() {
    var input = document.getElementById('nqQardStudentSearch');
    var box = document.getElementById('nqQardSuggestions');
    if (!input || !box) return;
    var q = String(input.value || '').trim().toLowerCase();
    if (!q) { box.style.display = 'none'; return; }
    var available = storeStudents();
    if (!available.length) {
      box.innerHTML = '<div style="padding:10px;color:#64748b">শিক্ষার্থীদের তালিকা লোড হচ্ছে...</div>';
      box.style.display = 'block';
      loadStudentsIfNeeded();
      return;
    }
    var list = available.filter(function (s) {
      return [s.name, s.id, s.uid, s.regNo, s.cls, s.className, s.branch, s.type].join(' ').toLowerCase().indexOf(q) !== -1;
    }).slice(0, 12);
    box.innerHTML = list.map(function (s) {
      return '<button type="button" onclick="nqQardSelectStudent(' + JSON.stringify(String(s.id)) + ')"><b>' + esc(s.name || '-') + '</b> • ' + esc(s.cls || s.className || '-') + ' • আইডি: ' + esc(s.uid || s.regNo || s.id || '-') + '</button>';
    }).join('') || '<div style="padding:10px;color:#94a3b8">কোনো শিক্ষার্থী পাওয়া যায়নি</div>';
    box.style.display = 'block';
  }

  window.nqQardSelectStudent = function (id) {
    selectedStudent = storeStudents().find(function (s) { return String(s.id) === String(id); }) || null;
    var input = document.getElementById('nqQardStudentSearch');
    var box = document.getElementById('nqQardSuggestions');
    var label = document.getElementById('nqQardSelected');
    if (!selectedStudent) return;
    input.value = selectedStudent.name || '';
    box.style.display = 'none';
    label.textContent = 'নির্বাচিত: ' + (selectedStudent.name || '-') + ' • শ্রেণী: ' + (selectedStudent.cls || selectedStudent.className || '-') + ' • আইডি: ' + (selectedStudent.uid || selectedStudent.regNo || selectedStudent.id || '-');
  };

  function renderHistory() {
    var box = document.getElementById('nqQardHistory');
    if (!box) return;
    if (!qardItems.length) { box.innerHTML = '<div class="nq-qard-empty">কোনো কর্জে হাসানার ইতিহাস নেই</div>'; return; }
    box.innerHTML = '<div class="nq-qard-note" style="margin-top:20px">সর্বশেষ ' + bn(qardItems.length) + 'টি রেকর্ড</div><table class="nq-qard-table"><thead><tr><th>#</th><th>শিক্ষার্থী</th><th>বিবরণ</th><th>কর্জদাতা</th><th>নেওয়ার তারিখ</th><th>ফেরতের তারিখ</th><th>অবস্থা</th><th>অ্যাকশন</th></tr></thead><tbody>' +
      qardItems.map(function (x, i) {
        var returned = x.status === 'returned';
        return '<tr><td>' + bn(i + 1) + '</td><td><b>' + esc(x.studentName || '-') + '</b><br><small>' + esc(x.studentClass || '-') + ' • ' + esc(x.studentUid || x.studentId || '-') + '</small></td><td>' + esc(x.description || '-') + '</td><td>' + esc(x.lenderName || '-') + '</td><td>' + dateBn(x.issueDate) + '</td><td>' + dateBn(x.dueDate) + '</td><td><span class="nq-qard-status ' + (returned ? 'returned' : 'outstanding') + '">' + (returned ? 'ফেরত পাওয়া গেছে' : 'চলমান') + '</span></td><td>' + (returned ? '<small style="color:#64748b">সম্পন্ন</small>' : '<button class="nq-qard-btn warn" onclick="nqQardReturn(' + JSON.stringify(String(x._id || x.id)) + ')">ফেরত পেয়েছি</button>') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  window.nqQardLoad = function () {
    if (!window.NQAuth || !window.NQAuth.isLoggedIn()) return;
    Promise.all([api('/api/qard-hasana'), loadStudentsIfNeeded()]).then(function (results) {
      qardItems = Array.isArray(results[0].items) ? results[0].items : [];
      renderHistory();
    }).catch(function (e) {
      var box = document.getElementById('nqQardHistory'); if (box) box.innerHTML = '<div class="nq-qard-empty" style="color:#b91c1c">' + esc(e.message) + '</div>';
    });
  };
  window.nqQardSubmit = function () {
    var desc = document.getElementById('nqQardDescription').value.trim();
    var issueDate = document.getElementById('nqQardIssueDate').value;
    var dueDate = document.getElementById('nqQardDueDate').value;
    if (!selectedStudent || !desc || !issueDate || !dueDate) { alert('শিক্ষার্থী, বিবরণ ও দুইটি তারিখ পূরণ করুন'); return; }
    if (dueDate < issueDate) { alert('ফেরতের তারিখ নেওয়ার তারিখের আগে হতে পারবে না'); return; }
    api('/api/qard-hasana', { method: 'POST', body: JSON.stringify({ studentId: selectedStudent.id, description: desc, issueDate: issueDate, dueDate: dueDate }) })
      .then(function (data) {
        document.getElementById('nqQardDescription').value = '';
        selectedStudent = null;
        document.getElementById('nqQardStudentSearch').value = '';
        document.getElementById('nqQardSelected').textContent = 'কোনো শিক্ষার্থী নির্বাচিত হয়নি';
        qardItems.unshift(data.item); renderHistory();
        alert(data.notified ? 'কর্জে হাসানা সংরক্ষণ হয়েছে এবং শিক্ষার্থীর আইডিতে নোটিফিকেশন গেছে' : 'সংরক্ষণ হয়েছে; শিক্ষার্থীর User ID পাওয়া যায়নি');
      }).catch(function (e) { alert(e.message); });
  };
  window.nqQardReturn = function (id) {
    if (!confirm('এই কর্জে হাসানা ফেরত পাওয়া গেছে হিসেবে চিহ্নিত করবেন? শিক্ষার্থীর নোটিফিকেশনও সরিয়ে দেওয়া হবে।')) return;
    api('/api/qard-hasana/' + encodeURIComponent(id) + '/return', { method: 'PATCH' })
      .then(function (data) { qardItems = qardItems.map(function (x) { return String(x._id) === String(id) ? data.item : x; }); renderHistory(); })
      .catch(function (e) { alert(e.message); });
  };
  window.nqQardPrint = function () { window.print(); };
  window.nqOpenQardPage = function () {
    ensureView();
    document.querySelectorAll('.page,.view').forEach(function (x) { if (x.id !== 'nqQardPage') x.classList.remove('active'); });
    document.getElementById('nqQardPage').classList.add('active');
    nqQardLoad();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function addLinks() {
    if (!allowed()) return;
    ensureView();
    if (document.querySelector('[data-nq-qard-link]')) return;
    var adminMenu = document.querySelector('[data-mod="others"] .nav-drop-menu');
    if (adminMenu) {
      var b = document.createElement('button');
      b.className = 'nav-drop-item'; b.setAttribute('data-nq-qard-link', '1'); b.innerHTML = '<span class="ndi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 16h5"/></svg></span><span class="ndi-text">কর্জে হাসানা</span>'; b.onclick = window.nqOpenQardPage;
      adminMenu.appendChild(b);
    }
    var teacherNav = document.querySelector('nav.mainnav');
    if (teacherNav) {
      var a = document.createElement('a');
      a.href = '#'; a.setAttribute('data-nq-qard-link', '1'); a.innerHTML = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><path d="M5 4h14v16H5z"/></svg> কর্জে হাসানা';
      a.onclick = function (e) { e.preventDefault(); window.nqOpenQardPage(); };
      teacherNav.appendChild(a);
    }
  }
  document.addEventListener('DOMContentLoaded', function () {
    if (!allowed()) return;
    addStyles();
    setTimeout(addLinks, 0);
  });
})();