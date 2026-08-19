/* ==========================================================================
   নুরুল কোরআন মাদরাসা — Service Worker (PWA + Push Notification)
   --------------------------------------------------------------------------
   • অ্যাপ শেল ক্যাশ (অফলাইনে খোলা যাবে)
   • HTML → network-first (সবসময় নতুন ভার্সন)
   • push ইভেন্টে নোটিফিকেশন দেখানো (বাড়ির কাজ, নোটিশ, ফি ইত্যাদি)
   ========================================================================== */

var CACHE = 'nq-panel-v4';
var SHELL = [
  './',
  './admin.html',
  './student.html',
  './teacher.html',
  './nq-host.js',
  './config.js',
  './auth.js',
  './pwa-install.js',
  './nq-monthly.js',
  './nq-notify.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.allSettled(SHELL.map(function (u) { return c.add(u); }));
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  // API কল কখনো ক্যাশ করা হবে না
  if (url.pathname.indexOf('/api/') === 0 || url.origin !== self.location.origin) return;

  var isDoc = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1;

  if (isDoc) {
    // network-first
    e.respondWith(
      fetch(req)
        .then(function (res) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (r) { return r || caches.match('./admin.html'); });
        })
    );
    return;
  }

  // static asset → cache-first
  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});

/* ───────────── Push Notification ───────────── */
self.addEventListener('push', function (e) {
  var payload = {};
  try { payload = e.data ? e.data.json() : {}; } catch (err) { payload = { title: 'নতুন বার্তা', body: e.data ? e.data.text() : '' }; }

  var title = payload.title || 'নুরুল কোরআন মাদরাসা';
  var options = {
    body: payload.body || '',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: payload.tag || ('nq-' + Date.now()),
    data: { url: payload.url || './student.html#homework' },
    vibrate: [120, 60, 120],
    requireInteraction: false
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var target = (e.notification.data && e.notification.data.url) || './student.html';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf(self.location.origin) === 0 && 'focus' in list[i]) {
          list[i].navigate(target);
          return list[i].focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
