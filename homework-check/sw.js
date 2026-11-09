/* 作業抽查紀錄 — 離線外殼（Service Worker）
   目的：學校網路不穩或斷線時，網頁仍能開啟（登記先存在本機，恢復連線後自動補送）。
   策略：網路優先——有網路就一定拿最新版並順便更新快取；網路 3.5 秒沒回應或斷線，才用快取。
   只處理本網站自己的檔案；Google Apps Script（資料）與 Google 字型不經過這裡。
   若要停用：把本檔換成只有 self.registration.unregister() 的版本即可。 */
const CACHE = 'hc-shell-v1';
const CORE = ['./', './index.html', './config.js', './assets/app.js', './assets/style.css', './manifest.webmanifest', './icon-192.png', './icon-180.png'];
const TIMEOUT = 3500;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => { })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('hc-shell-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;              // 資料、字型：不處理
  if (!url.pathname.startsWith(new URL('./', self.registration.scope).pathname)) return;
  if (url.pathname.includes('/tests/')) return;
  // 只處理網頁本身的檔案（頁面、js、css、圖示）；資料請求一律直接走網路，不快取
  if (req.mode !== 'navigate' && !/\.(?:html|js|css|png|svg|webmanifest|woff2?)$/i.test(url.pathname)) return;
  e.respondWith(networkFirst(req, e));
});

function networkFirst(req, e) {
  const net = fetch(req).then(res => {
    if (res && res.ok && res.type === 'basic') { const copy = res.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put(req, copy))); }
    return res;
  });
  const fromCache = () => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') || caches.match('./') : undefined));
  return new Promise(resolve => {
    let done = false;
    const timer = setTimeout(() => { fromCache().then(r => { if (r && !done) { done = true; resolve(r); } }); }, TIMEOUT);
    net.then(res => { if (!done) { done = true; clearTimeout(timer); resolve(res); } })
      .catch(() => { clearTimeout(timer); fromCache().then(r => { if (!done) { done = true; resolve(r || Response.error()); } }); });
  });
}
