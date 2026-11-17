/* Service worker ของแอปสแกน กีฬาอัญมณี
   - หน้าเว็บ (index.html): ใช้จากเน็ตก่อนเสมอ เพื่อให้ได้เวอร์ชันล่าสุด ถ้าออฟไลน์จึงใช้ที่เก็บไว้
   - ไฟล์ประกอบ (jsqr.js, ไอคอน, manifest): ใช้ที่เก็บไว้ก่อน แล้วอัปเดตเบื้องหลัง
   - ฟอนต์ Google: เก็บไว้ใช้ตอนออฟไลน์
   - ข้อมูล Firebase/Google sign-in: ไม่ยุ่ง ปล่อยผ่านเน็ตตามปกติ */
const VER = 'gem-scan-v1';
const LIB = /^https:\/\/www\.gstatic\.com\/firebasejs\//;
const CORE = ['./', './index.html', './jsqr.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate' && url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VER).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
    return;
  }
  if (url.origin === location.origin && /\.(js|png|webmanifest)$/.test(url.pathname) && !/sw\.js$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then(hit => { const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VER).then(c => c.put(req, cp)); } return r; }).catch(() => hit); return hit || net; }));
    return;
  }
  /* ไลบรารี Firebase (ระบุเวอร์ชันใน URL ไม่เปลี่ยน) เก็บไว้ให้เปิดแอปได้ตอนออฟไลน์ */
  if (LIB.test(req.url) || /^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const cp = r.clone(); caches.open(VER).then(c => c.put(req, cp)); return r; })));
  }
});
