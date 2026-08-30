/* ==========================================================================
   নুরুল কোরআন মাদরাসা — PWA ইনস্টল পপআপ + সার্ভিস ওয়ার্কার রেজিস্ট্রেশন
   --------------------------------------------------------------------------
   যে কোনো ব্রাউজার থেকে সাইটে ঢুকলেই নিচে একটি "অ্যাপ ইনস্টল করুন" পপআপ
   দেখাবে। ক্লিক করলেই ব্রাউজারের ইনস্টল প্রম্পট চালু হবে (Chrome/Edge/
   Samsung/Opera – Android ও ডেস্কটপ)। iPhone/Safari-তে ইনস্টল প্রম্পট
   সাপোর্ট নেই, তাই সেখানে ধাপে ধাপে নির্দেশনা দেখানো হয়।
   ========================================================================== */
(function () {
  'use strict';

  var LS_KEY = 'nq_pwa_dismissed_at';
  var SHOW_AGAIN_AFTER = 3 * 24 * 60 * 60 * 1000; // ৩ দিন পর আবার দেখাবে
  var deferredPrompt = null;

  /* ---------- সার্ভিস ওয়ার্কার ---------- */
  function swPath() {
    var parts = location.pathname.split('/');
    parts.pop();
    return parts.join('/') + '/sw.js';
  }

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register(swPath()).catch(function (e) {
        console.warn('[pwa] service worker রেজিস্টার হয়নি:', e);
      });
    });
  }

  /* ---------- সহায়ক ---------- */
  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
  }
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }
  function recentlyDismissed() {
    try {
      var t = parseInt(localStorage.getItem(LS_KEY) || '0', 10);
      return t && (Date.now() - t) < SHOW_AGAIN_AFTER;
    } catch (e) { return false; }
  }
  function remember() {
    try { localStorage.setItem(LS_KEY, String(Date.now())); } catch (e) {}
  }

  /* ---------- স্টাইল ---------- */
  var css = '' +
    '#nqPwaWrap{position:fixed;inset:0;z-index:99999;display:none;}' +
    '#nqPwaWrap.on{display:block;}' +
    '#nqPwaBackdrop{position:absolute;inset:0;background:rgba(8,20,14,.55);backdrop-filter:blur(2px);}' +
    '#nqPwaCard{position:absolute;left:0;right:0;bottom:0;margin:0 auto;max-width:460px;background:#fff;' +
      'border-radius:20px 20px 0 0;box-shadow:0 -14px 40px rgba(0,0,0,.28);padding:18px 18px 16px;' +
      'font-family:"Hind Siliguri",system-ui,sans-serif;animation:nqPwaUp .3s ease;}' +
    '@keyframes nqPwaUp{from{transform:translateY(110%)}to{transform:translateY(0)}}' +
    '#nqPwaCard .row{display:flex;gap:14px;align-items:center;}' +
    '#nqPwaCard img{width:60px;height:60px;border-radius:14px;box-shadow:0 4px 12px rgba(0,0,0,.18);}' +
    '#nqPwaCard h3{margin:0;font-size:17px;font-weight:700;color:#0b3d24;}' +
    '#nqPwaCard p{margin:4px 0 0;font-size:13.5px;color:#5b6b62;line-height:1.5;}' +
    '#nqPwaCard .btns{display:flex;gap:10px;margin-top:16px;}' +
    '#nqPwaCard button{flex:1;border:0;border-radius:12px;padding:13px 10px;font-size:15px;font-weight:700;' +
      'font-family:inherit;cursor:pointer;}' +
    '#nqPwaInstall{background:linear-gradient(120deg,#0f7a3d,#16a34a);color:#fff;}' +
    '#nqPwaLater{background:#eef2ef;color:#4b5563;flex:0 0 34%;}' +
    '#nqPwaSteps{margin:14px 0 0;padding:12px 14px;background:#f3f8f4;border-radius:12px;font-size:13.5px;' +
      'color:#28483a;line-height:1.7;display:none;}' +
    '#nqPwaSteps.on{display:block;}' +
    '#nqPwaBtnFloat{position:fixed;right:14px;bottom:78px;z-index:9998;display:none;align-items:center;gap:7px;' +
      'background:linear-gradient(120deg,#0f7a3d,#16a34a);color:#fff;border:0;border-radius:999px;padding:11px 16px;' +
      'font-family:"Hind Siliguri",system-ui,sans-serif;font-size:13.5px;font-weight:700;cursor:pointer;' +
      'box-shadow:0 8px 20px rgba(15,122,61,.35);}' +
    '#nqPwaBtnFloat.on{display:inline-flex;}';

  function iconUrl() {
    var base = location.pathname.split('/');
    base.pop();
    return base.join('/') + '/icons/icon-192.png';
  }

  var html = '' +
    '<div id="nqPwaWrap">' +
      '<div id="nqPwaBackdrop"></div>' +
      '<div id="nqPwaCard">' +
        '<div class="row">' +
          '<img src="' + iconUrl() + '" alt="নুরুল কোরআন মাদরাসা অ্যাপ আইকন">' +
          '<div>' +
            '<h3>নুরুল কোরআন মাদরাসা অ্যাপ</h3>' +
            '<p>ফোনে ইনস্টল করে নিন — বাড়ির কাজ, বেতন ও নোটিশের নোটিফিকেশন সরাসরি পাবেন।</p>' +
          '</div>' +
        '</div>' +
        '<div id="nqPwaSteps">' +
          '<b>iPhone / Safari-তে ইনস্টল করার নিয়ম:</b><br>' +
          '১) নিচের <b>Share (⤴)</b> বাটনে চাপ দিন<br>' +
          '২) <b>Add to Home Screen</b> নির্বাচন করুন<br>' +
          '৩) <b>Add</b> চাপুন — অ্যাপ আইকন হোম স্ক্রিনে যুক্ত হবে' +
        '</div>' +
        '<div class="btns">' +
          '<button id="nqPwaLater" type="button">পরে</button>' +
          '<button id="nqPwaInstall" type="button">📲 ইনস্টল করুন</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<button id="nqPwaBtnFloat" type="button">📲 অ্যাপ ইনস্টল</button>';

  function mount() {
    if (document.getElementById('nqPwaWrap')) return;
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    var div = document.createElement('div');
    div.innerHTML = html;
    while (div.firstChild) document.body.appendChild(div.firstChild);

    document.getElementById('nqPwaBackdrop').addEventListener('click', hide);
    document.getElementById('nqPwaLater').addEventListener('click', function () { remember(); hide(); showFloat(); });
    document.getElementById('nqPwaInstall').addEventListener('click', doInstall);
    document.getElementById('nqPwaBtnFloat').addEventListener('click', show);
  }

  function show() {
    if (isStandalone()) return;
    mount();
    document.getElementById('nqPwaWrap').classList.add('on');
    document.getElementById('nqPwaBtnFloat').classList.remove('on');
    if (isIOS() || !deferredPrompt) {
      // iOS বা প্রম্পট না পাওয়া গেলে ম্যানুয়াল নির্দেশনা
      if (isIOS()) {
        document.getElementById('nqPwaSteps').classList.add('on');
        document.getElementById('nqPwaInstall').textContent = 'বুঝেছি';
      }
    }
  }
  function hide() {
    var w = document.getElementById('nqPwaWrap');
    if (w) w.classList.remove('on');
  }
  function showFloat() {
    if (isStandalone()) return;
    mount();
    document.getElementById('nqPwaBtnFloat').classList.add('on');
  }

  function doInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (res) {
        if (res && res.outcome === 'accepted') { hide(); }
        else { remember(); hide(); showFloat(); }
        deferredPrompt = null;
      });
      return;
    }
    if (isIOS()) {
      var steps = document.getElementById('nqPwaSteps');
      if (steps.classList.contains('on')) { remember(); hide(); showFloat(); }
      else steps.classList.add('on');
      return;
    }
    // অন্য ব্রাউজার (Firefox ইত্যাদি) — ম্যানুয়াল নির্দেশনা
    var s = document.getElementById('nqPwaSteps');
    s.innerHTML = '<b>ইনস্টল করার নিয়ম:</b><br>ব্রাউজারের মেনু (⋮) খুলুন → ' +
      '<b>Install app</b> / <b>Add to Home screen</b> নির্বাচন করুন।';
    s.classList.add('on');
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    // Native prompt-টি preventDefault না করে browser banner-ও চালু থাকতে
    // দেওয়া হয়; custom Install button থাকলে deferred event-এ prompt() হবে।
    deferredPrompt = e;
    if (!recentlyDismissed()) setTimeout(show, 1200);
    else showFloat();
  });

  window.addEventListener('appinstalled', function () {
    hide();
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
  });

  document.addEventListener('DOMContentLoaded', function () {
    if (isStandalone()) return;
    mount();
    // beforeinstallprompt না আসলেও (iOS/Firefox) পপআপ দেখানো হবে
    setTimeout(function () {
      if (isStandalone()) return;
      var w = document.getElementById('nqPwaWrap');
      if (w && w.classList.contains('on')) return;
      if (recentlyDismissed()) { showFloat(); return; }
      show();
    }, 2500);
  });

  window.NQPwa = { show: show, hide: hide, isStandalone: isStandalone };
})();
