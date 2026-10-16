/*
 * Изоляция страницы (cross-origin isolation) силами service worker.
 *
 * Зачем. Человекоподобные боты — это lc0 с сетью Maia, собранный
 * emscripten'ом с pthreads. Ему нужен SharedArrayBuffer, а тот доступен
 * только на изолированной странице, то есть при заголовках
 *   Cross-Origin-Opener-Policy: same-origin
 *   Cross-Origin-Embedder-Policy: require-corp
 * На GitHub Pages свои заголовки выставить нельзя — отсюда этот приём:
 * заголовки дописывает service worker, отдавая документ странице.
 *
 * Почему только навигации. Файл подключается в начало сгенерированного
 * Workbox'ом sw.js, и его обработчик fetch регистрируется первым. Если
 * перехватывать всё подряд, мы перебьём маршруты Workbox и сломаем
 * офлайн. Поэтому берём на себя РОВНО запросы документа, а всё
 * остальное (предзагруженные файлы, движок, фигуры) пропускаем дальше,
 * к Workbox. Версионируемые ресурсы engine/piece/lc0 кешируются ниже. Подресурсам заголовки и не нужны: они свои, того же
 * происхождения, а COEP спрашивает только с чужих.
 *
 * Изоляция включается со второго открытия: service worker намеренно не
 * захватывает уже открытую страницу (skipWaiting/clientsClaim выключены
 * — в Safari захват ломал сеть страницы целиком, см. vite.config.ts).
 * Пока изоляции нет, приложение просто не показывает Maia-ботов.
 */

// Each installation owns its caches; changed resource bytes create a new cache.
const CACHE_SCOPE = `sciencechess:${self.registration.scope}:`;
const CACHE_PREFIX = `${CACHE_SCOPE}${self.LAB_RESOURCE_VERSION || 'legacy'}:`;
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(
    names.filter(name => name.startsWith(CACHE_SCOPE) && !name.startsWith(CACHE_PREFIX))
      .map(name => caches.delete(name)),
  )));
});

/**
 * Заголовки, без которых изолированная страница не примет ресурс.
 * CORP — чтобы ресурс вообще разрешалось встраивать при COEP.
 * COEP на скрипте — отдельное требование ИМЕННО к воркерам: lc0 собран
 * с pthreads и запускает себя же вторым воркером, а тот обязан сам быть
 * изолированным, иначе внутри него нет SharedArrayBuffer. Без этого
 * заголовка воркер молча падает с пустым ErrorEvent.
 */
function isolateHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  const scopedPath = url.href.startsWith(self.registration.scope)
    ? url.pathname.slice(new URL(self.registration.scope).pathname.length) : '';
  const resource = /^(lc0|engine|piece)\//.exec(scopedPath)?.[1];
  if (request.method === 'GET' && url.origin === self.location.origin && resource) {
    event.respondWith((async () => {
      let cache;
      let response;
      try {
        cache = await caches.open(`${CACHE_PREFIX}${resource}`);
        response = await cache.match(request);
      } catch { /* Storage may be disabled; use the network in that case. */ }
      if (!response) {
        response = await fetch(request);
        if (response.ok && cache) {
          try {
            await cache.put(request, response.clone());
            const keys = await cache.keys();
            const limit = resource === 'piece' ? 64 : 8;
            await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map(key => cache.delete(key)));
          } catch { /* Cache quota must not prevent a fresh resource from loading. */ }
        }
      }
      return resource === 'lc0' ? isolateHeaders(response) : response;
    })());
    return;
  }

  if (request.mode !== 'navigate') return;

  event.respondWith(
    (async () => {
      let response;
      try {
        response = await fetch(request);
      } catch {
        // Офлайн: тем же запасным документом, что и у navigateFallback.
        // ignoreSearch — потому что в предзагрузке он лежит с меткой
        // ревизии в строке запроса (index.html?__WB_REVISION__=…).
        response = await caches.match(new URL('index.html', self.registration.scope).href, {
          ignoreSearch: true,
        });
        if (!response) return Response.error();
      }

      // opaque-ответ пересобрать нельзя, да и незачем: свой документ
      // таким не приходит.
      if (response.type === 'opaque' || response.type === 'opaqueredirect') return response;

      const headers = new Headers(response.headers);
      headers.set('Cross-Origin-Opener-Policy', 'same-origin');
      headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    })(),
  );
});
