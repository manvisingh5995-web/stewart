// Stewart service worker: shows push notifications and opens the inbox when one is tapped.
// Every push must show a notification, or iPhone may stop delivering them.

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { /* not JSON: fall back to a plain notice */ }
  const tag = d.tag || 'stewart';
  const opts = { body: d.body || 'Open the app to see what it needs.', tag, data: { url: '/', ids: d.ids || [] } };
  if (d.silent) opts.silent = true;   // asks for no sound; the phone may ignore it
  e.waitUntil((async () => {
    // One notification per tag: close the old one so a project never shows two.
    const old = self.registration.getNotifications ? await self.registration.getNotifications({ tag }) : [];
    old.forEach(n => n.close());
    await self.registration.showNotification(d.title || 'Claude Code is waiting', opts);
    if (typeof d.badge === 'number' && self.navigator.setAppBadge) await self.navigator.setAppBadge(d.badge).catch(() => {});
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins.length) return wins[0].focus();
    return self.clients.openWindow(e.notification.data?.url || '/');
  })());
});
