/* ============================================================
   nq-en-digits.js — সকল স্থানে সংখ্যা ইংরেজিতে দেখানোর ব্যবস্থা
   ------------------------------------------------------------
   - বাংলা অঙ্ক (০-৯) ইনপুটে দিলেও সব জায়গায় ইংরেজি (0-9) হয়ে যাবে
   - পেজে রেন্ডার হওয়া টেক্সট, ইনপুট/টেক্সট-এরিয়ার মান, placeholder সব
     স্বয়ংক্রিয়ভাবে ইংরেজি অঙ্কে রূপান্তরিত হয়
   - window.toEn(value) দিয়ে যেকোনো জায়গা থেকে রূপান্তর করা যায়
   ============================================================ */
(function () {
  'use strict';

  var BN = '০১২৩৪৫৬৭৮৯';
  var RE = /[০-৯٠-٩]/g;

  function toEn(v) {
    if (v == null) return v;
    return String(v).replace(RE, function (d) {
      var i = BN.indexOf(d);
      if (i > -1) return String(i);
      return String(d.charCodeAt(0) - 0x0660); // আরবি-ইন্ডিক অঙ্ক
    });
  }
  window.toEn = toEn;
  window.NQEnDigits = { toEn: toEn };

  function fixTextNode(node) {
    if (!node.nodeValue || !RE.test(node.nodeValue)) return;
    RE.lastIndex = 0;
    node.nodeValue = toEn(node.nodeValue);
  }

  function fixField(el) {
    if (!el) return;
    var tag = el.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
    if (el.type === 'password' || el.type === 'file') return;
    if (typeof el.value === 'string') {
      var next = toEn(el.value);
      if (next !== el.value) {
        var start = null, end = null;
        try { start = el.selectionStart; end = el.selectionEnd; } catch (e) { /* ignore */ }
        el.value = next;
        try { if (start != null) el.setSelectionRange(start, end); } catch (e) { /* ignore */ }
      }
    }
    var ph = el.getAttribute('placeholder');
    if (ph) {
      var nph = toEn(ph);
      if (nph !== ph) el.setAttribute('placeholder', nph);
    }
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { fixTextNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n, list = [];
    while ((n = walker.nextNode())) {
      var p = n.parentNode;
      if (p && (p.tagName === 'SCRIPT' || p.tagName === 'STYLE')) continue;
      list.push(n);
    }
    list.forEach(fixTextNode);
    if (root.querySelectorAll) {
      var fields = root.querySelectorAll('input, textarea');
      for (var i = 0; i < fields.length; i++) fixField(fields[i]);
    }
    fixField(root);
  }

  function start() {
    walk(document.body);

    var observer = new MutationObserver(function (mutations) {
      observer.disconnect();
      try {
        mutations.forEach(function (m) {
          if (m.type === 'characterData') fixTextNode(m.target);
          else if (m.type === 'attributes') fixField(m.target);
          else for (var i = 0; i < m.addedNodes.length; i++) walk(m.addedNodes[i]);
        });
      } finally {
        observer.observe(document.body, {
          childList: true, subtree: true, characterData: true,
          attributes: true, attributeFilter: ['placeholder', 'value']
        });
      }
    });
    observer.observe(document.body, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ['placeholder', 'value']
    });

    ['input', 'change', 'blur'].forEach(function (evt) {
      document.addEventListener(evt, function (e) { fixField(e.target); }, true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
