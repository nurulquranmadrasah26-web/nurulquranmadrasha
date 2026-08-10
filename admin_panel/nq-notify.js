/* ==========================================================================
   নুরুল কোরআন মাদরাসা — নোটিফিকেশন ক্লায়েন্ট (ইন-অ্যাপ + Web Push)
   --------------------------------------------------------------------------
   • NQNotify.enablePush()  → ব্রাউজার/অ্যাপে পুশ নোটিফিকেশন চালু করে
   • NQNotify.list()        → নিজের নোটিফিকেশনের তালিকা
   • NQNotify.send({...})   → শিক্ষার্থী/অভিভাবক/স্টাফকে নোটিফিকেশন পাঠায়
   • NQNotify.mountBell(el) → নোটিফিকেশন বেল + তালিকা UI বসায় (পোলিং সহ)
   ========================================================================== */
(function () {
  'use strict';

  function A() { return window.NQAuth; }

  function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var raw = window.atob(base64);
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  var NQNotify = {
    items: [],
    unread: 0,

    /* ---------- পুশ নোটিফিকেশন চালু ---------- */
    enablePush: function () {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return Promise.reject(new Error('এই ব্রাউজারে পুশ নোটিফিকেশন সাপোর্ট করে না'));
      }
      return Notification.requestPermission().then(function (perm) {
        if (perm !== 'granted') throw new Error('নোটিফিকেশনের অনুমতি দেওয়া হয়নি');
        return A().getJSON('/api/push/public-key');
      }).then(function (res) {
        if (!res || !res.key) throw new Error('সার্ভারে পুশ কী পাওয়া যায়নি');
        return navigator.serviceWorker.ready.then(function (reg) {
          return reg.pushManager.getSubscription().then(function (sub) {
            if (sub) return sub;
            return reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(res.key)
            });
          });
        });
      }).then(function (sub) {
        return A().postJSON('/api/push/subscribe', { subscription: sub.toJSON ? sub.toJSON() : sub });
      });
    },

    isPushOn: function () {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return Promise.resolve(false);
      return navigator.serviceWorker.ready
        .then(function (reg) { return reg.pushManager.getSubscription(); })
        .then(function (s) { return !!s && Notification.permission === 'granted'; })
        .catch(function () { return false; });
    },

    disablePush: function () {
      return navigator.serviceWorker.ready.then(function (reg) {
        return reg.pushManager.getSubscription().then(function (sub) {
          if (!sub) return null;
          var ep = sub.endpoint;
          return sub.unsubscribe().then(function () {
            return A().postJSON('/api/push/unsubscribe', { endpoint: ep });
          });
        });
      });
    },

    /* ---------- তালিকা ---------- */
    list: function () {
      return A().getJSON('/api/notifications').then(function (res) {
        NQNotify.items = (res && res.items) || [];
        NQNotify.unread = NQNotify.items.filter(function (n) { return !n.read; }).length;
        return NQNotify.items;
      });
    },

    markRead: function (id) {
      return A().postJSON('/api/notifications/' + id + '/read', {}, 'PATCH');
    },
    markAllRead: function () {
      return A().postJSON('/api/notifications/read-all', {});
    },

    /* ---------- পাঠানো ---------- *
       payload: { uids:[], roles:[], title, body, url, type }             */
    send: function (payload) {
      return A().postJSON('/api/notifications/send', payload || {});
    },

    /* ---------- বেল UI ---------- */
    mountBell: function (host) {
      if (!host) return;
      host.innerHTML =
        '<button type="button" id="nqBellBtn" style="position:relative;background:rgba(255,255,255,.2);' +
        'border:1px solid rgba(255,255,255,.35);color:#fff;border-radius:999px;width:38px;height:38px;' +
        'font-size:17px;cursor:pointer;">🔔<span id="nqBellDot" style="display:none;position:absolute;' +
        'top:-3px;right:-3px;min-width:18px;height:18px;border-radius:999px;background:#ef4444;color:#fff;' +
        'font-size:11px;line-height:18px;font-weight:700;padding:0 4px;"></span></button>' +
        '<div id="nqBellPanel" style="display:none;position:fixed;left:0;right:0;bottom:0;z-index:9999;' +
        'max-width:460px;margin:0 auto;background:#fff;border-radius:18px 18px 0 0;max-height:70vh;' +
        'overflow:auto;box-shadow:0 -12px 34px rgba(0,0,0,.25);padding:14px 16px 20px;color:#1f2937;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<b style="font-size:16px;">নোটিফিকেশন</b>' +
        '<span><button type="button" id="nqBellAllRead" style="background:#eef2ef;border:0;border-radius:8px;' +
        'padding:6px 10px;font-family:inherit;font-size:12.5px;cursor:pointer;">সব পড়া হয়েছে</button> ' +
        '<button type="button" id="nqBellClose" style="background:#fee2e2;border:0;border-radius:8px;' +
        'padding:6px 10px;font-family:inherit;font-size:12.5px;cursor:pointer;">বন্ধ</button></span></div>' +
        '<div id="nqBellList"></div></div>';

      function render() {
        var box = document.getElementById('nqBellList');
        var dot = document.getElementById('nqBellDot');
        if (!box) return;
        if (!NQNotify.items.length) {
          box.innerHTML = '<div style="text-align:center;color:#9ca3af;padding:22px 0;">কোনো নোটিফিকেশন নেই</div>';
        } else {
          box.innerHTML = NQNotify.items.map(function (n) {
            var d = new Date(n.createdAt);
            var when = d.toLocaleDateString('bn-BD') + ' ' + d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
            return '<div data-nid="' + n.id + '" data-url="' + (n.url || '') + '" class="nq-noti" style="cursor:pointer;' +
              'border:1px solid #e5e7eb;border-left:4px solid ' + (n.read ? '#d1d5db' : '#16a34a') + ';' +
              'border-radius:10px;padding:10px 12px;margin-bottom:8px;background:' + (n.read ? '#fafafa' : '#f0fdf4') + ';">' +
              '<div style="font-weight:700;font-size:14px;">' + (n.title || '') + '</div>' +
              '<div style="font-size:13px;color:#4b5563;margin-top:2px;">' + (n.body || '') + '</div>' +
              '<div style="font-size:11.5px;color:#9ca3af;margin-top:4px;">' + when + '</div></div>';
          }).join('');
          box.querySelectorAll('.nq-noti').forEach(function (el) {
            el.addEventListener('click', function () {
              var id = el.getAttribute('data-nid');
              var url = el.getAttribute('data-url');
              NQNotify.markRead(id).catch(function () {});
              if (url) { location.hash = url.indexOf('#') === 0 ? url : ('#' + url.split('#')[1] || ''); }
              document.getElementById('nqBellPanel').style.display = 'none';
              NQNotify.list().then(render).catch(function () {});
              if (typeof window.nqOnNotificationOpen === 'function') window.nqOnNotificationOpen(url);
            });
          });
        }
        if (dot) {
          dot.style.display = NQNotify.unread ? 'inline-block' : 'none';
          dot.textContent = String(NQNotify.unread);
        }
      }

      document.getElementById('nqBellBtn').addEventListener('click', function () {
        var p = document.getElementById('nqBellPanel');
        p.style.display = p.style.display === 'none' ? 'block' : 'none';
        NQNotify.list().then(render).catch(function () {});
      });
      document.getElementById('nqBellClose').addEventListener('click', function () {
        document.getElementById('nqBellPanel').style.display = 'none';
      });
      document.getElementById('nqBellAllRead').addEventListener('click', function () {
        NQNotify.markAllRead().then(function () { return NQNotify.list(); }).then(render).catch(function () {});
      });

      NQNotify.list().then(render).catch(function () {});
      setInterval(function () { NQNotify.list().then(render).catch(function () {}); }, 60000);
    }
  };

  window.NQNotify = NQNotify;
})();
