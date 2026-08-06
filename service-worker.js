/*
  ╔══════════════════════════════════════════════════════════════════╗
  ║   ZUNEXA — ARCHON AI · ADVANCED PRODUCTION SERVICE WORKER        ║
  ║   Author  : ahmed_dev_a & Archon AI Core Engineering             ║
  ║   Purpose : Cache the app shell for instant repeat loads, and    ║
  ║             automatically serve offline.html whenever a page     ║
  ║             navigation fails because the network is down.        ║
  ║   Scope   : Must live at the SITE ROOT (same folder as ai.html)  ║
  ╚══════════════════════════════════════════════════════════════════╝
*/

/* زيادة رقم الإصدار هذا مع كل عملية نشر (Deploy) تغيّر أي ملف ثابت 
 * لتجبار المتصفحات القديمة على جلب النسخ الجديدة تماماً وتجنب التخزين المؤقت القديم. */
const ZX_SW_VERSION = 'zunexa-archon-v2';

const ZX_STATIC_CACHE  = ZX_SW_VERSION + '-static';
const ZX_RUNTIME_CACHE = ZX_SW_VERSION + '-runtime';

/* صفحة الاحتياط عند انقطاع الإنترنت. يجب تخزينها مؤقتاً أثناء التثبيت. */
const ZX_OFFLINE_URL = 'offline.html';

/* ملفات هيكل التطبيق الأساسية المتاحة للتخزين المؤقت الفوري / أوفلاين. */
const ZX_PRECACHE_URLS = [
  './',
  'ai.html',
  'offline.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png'
];

/* ════════════════════════════════════════════════════════
   INSTALL — التثبيت المسبق لهيكل التطبيق.
   يستخدم Promise.allSettled بدلاً من Cache.addAll لتجنب فشل 
   عملية التثبيت بالكامل إذا كان هناك ملف واحد مفقود أو غير موجود.
════════════════════════════════════════════════════════ */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(ZX_STATIC_CACHE);
      const results = await Promise.allSettled(
        ZX_PRECACHE_URLS.map(async (url) => {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res.ok) throw new Error('precache failed: ' + url + ' (' + res.status + ')');
          return cache.put(url, res);
        })
      );

      // التأكد الإلزامي من تخزين صفحة offline.html
      const offlineResult = results[ZX_PRECACHE_URLS.indexOf(ZX_OFFLINE_URL)];
      if (offlineResult && offlineResult.status === 'rejected') {
        console.error('[Zunexa SW] CRITICAL: failed to precache offline.html —', offlineResult.reason);
      }

      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.warn('[Zunexa SW] precache skipped:', ZX_PRECACHE_URLS[i], r.reason && r.reason.message);
        }
      });

      // تفعيل الخدمة الجديدة فوراً دون الانتظار لإغلاق علامات التبويب المفتوحة.
      await self.skipWaiting();
    })()
  );
});

/* ════════════════════════════════════════════════════════
   ACTIVATE — تنظيف التخزين المؤقت للإصدارات القديمة والسيطرة فوراً.
════════════════════════════════════════════════════════ */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== ZX_STATIC_CACHE && key !== ZX_RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

/* ════════════════════════════════════════════════════════
   FETCH — منطق المعالجة الكامل للطلبات (Offline Logic).
════════════════════════════════════════════════════════ */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // التعامل حصرياً مع طلبات GET فقط؛ طلبات الكتابة (POST/PUT/DELETE) 
  // الخاصة بـ Supabase ورفع الملفات يجب أن تذهب مباشرة للشبكة.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // اقتصر فقط على الطلبات ذات الأصل المشترك (Same-Origin). 
  // جميع الاتصالات الخارجية (Supabase, HuggingFace, APIs, Fonts, etc.) تمر مباشرة بلا اعتراض.
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(handleNavigation(req));
    return;
  }

  event.respondWith(handleAsset(req));
});

async function handleNavigation(req) {
  try {
    const networkRes = await fetch(req);
    if (networkRes && networkRes.ok) {
      const cache = await caches.open(ZX_RUNTIME_CACHE);
      cache.put(req, networkRes.clone());
    }
    return networkRes;
  } catch (err) {
    // انقطاع الاتصال بالإنترنت - يتم عرض صفحة offline.html المحفوظة مؤقتاً تلقائياً.
    const offlinePage = await caches.match(ZX_OFFLINE_URL, { cacheName: ZX_STATIC_CACHE });
    if (offlinePage) return offlinePage;

    // استجابة احتياطية أخيرة في حال عدم توفر صفحة offline.html لأي سبب طارئ
    return new Response(
      '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">' +
      '<title>لا يوجد اتصال</title></head><body style="background:#060606;color:#edeae2;' +
      'font-family:sans-serif;display:flex;align-items:center;justify-content:center;' +
      'height:100vh;text-align:center;padding:24px">' +
      '<div><h1 style="color:#D4AF37">لا يوجد اتصال بالإنترنت</h1>' +
      '<p>تعذّر تحميل الصفحة. تحقق من اتصالك وأعد المحاولة.</p>' +
      '<button onclick="location.reload()" style="margin-top:16px;padding:12px 24px;' +
      'background:#D4AF37;color:#060606;border:none;border-radius:8px;font-weight:700;' +
      'cursor:pointer">إعادة المحاولة</button></div></body></html>',
      { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } }
    );
  }
}

async function handleAsset(req) {
  const cached = await caches.match(req);
  if (cached) {
    refreshAssetInBackground(req);
    return cached;
  }

  try {
    const networkRes = await fetch(req);
    if (networkRes && networkRes.ok) {
      const cache = await caches.open(ZX_RUNTIME_CACHE);
      cache.put(req, networkRes.clone());
    }
    return networkRes;
  } catch (err) {
    return new Response('', { status: 504, statusText: 'Offline and not cached' });
  }
}

function refreshAssetInBackground(req) {
  fetch(req)
    .then((res) => {
      if (res && res.ok) {
        caches.open(ZX_RUNTIME_CACHE).then((cache) => cache.put(req, res));
      }
    })
    .catch(() => {
      /* الصمت مقصود عند فشل التحديث في الخلفية طالما النسخة المخزنة متوفرة */
    });
}

/* ════════════════════════════════════════════════════════
   MESSAGE — السماح للتطبيق بتنشيط العامل فوراً عند توفر إصدار جديد.
════════════════════════════════════════════════════════ */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
