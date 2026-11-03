// Stewart service worker: shows push notifications and opens the inbox when one is tapped.
// Every push must show a notification, or iPhone may stop delivering them.

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { /* not JSON: fall back to a plain notice */ }
  const opts = { body: d.body || 'Open Stewart to review.', tag: d.tag || 'stewart', data: { url: '/' } };
  if (d.renotify) opts.renotify = true;   // only valid with a tag, which is always set above
  const jobs = [self.registration.showNotification(d.title || 'Stewart', opts)];
  if (typeof d.badge === 'number' && self.navigator.setAppBadge) jobs.push(self.navigator.setAppBadge(d.badge).catch(() => {}));
  e.waitUntil(Promise.all(jobs));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins.length) return wins[0].focus();
    return self.clients.openWindow(e.notification.data?.url || '/');
  })());
});
