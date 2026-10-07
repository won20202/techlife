// 앱 설치(PWA) + 미리 받기: 그림·코드를 기기에 저장해 두고 끊김 없이 실행
const CACHE = 'tlg-v18';
const FILES = ['./', 'index.html', 'css/style.css', 'js/ui.js', 'js/engine.js', 'js/art.js', 'js/data/config.js', 'js/data/events.js', 'js/data/jobs.js', 'js/data/quiz.js', 'js/net.js', 'js/lobby.js', 'js/teacher.js', 'js/vendor/qrcode.js', 'js/sound.js', 'js/town.js', 'teacher.html', 'css/teacher.css', 'manifest.webmanifest', 'icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// 네트워크 먼저(새 버전 바로 반영), 안 되면 저장본
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
