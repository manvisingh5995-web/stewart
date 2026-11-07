// Push notifications for waiting requests.
// High risk: one notification per request, always with a sound.
// Low and medium: one notification per project that updates in place. The first
// request makes a sound; more requests in that project within QUIET_MS stay quiet.
// Copy never includes commands, paths or file contents, only the hook's plain words.
import webpush from 'web-push';

const QUIET_MS = 2 * 60 * 1000;
// iPhone sounds every time a notification is replaced, so "quiet" can only mean
// not sending. 'silent' sends with the silent flag instead, if the phone test shows it works.
export const QUIET_MODE = 'skip';

const HIGH_END = 'Paused until you decide.';
const WAIT_END = 'Waiting for your answer.';

export function setupPush() {
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error('Missing push keys. Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Vercel, then redeploy.');
  webpush.setVapidDetails('https://stewart-omega.vercel.app', pub, priv);
  return pub;
}

export async function sendAll(r, payload) {
  const subs = (await r.hgetall('push:subs')) || {};
  await Promise.all(Object.entries(subs).map(async ([endpoint, raw]) => {
    const sub = typeof raw === 'string' ? JSON.parse(raw) : raw;
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 600, urgency: 'high' });
    } catch (err) {
      // 404 and 410 mean the device unsubscribed or removed the app.
      if (err.statusCode === 404 || err.statusCode === 410) await r.hdel('push:subs', endpoint);
      else console.error('Push failed', err.statusCode, err.body);
    }
  }));
}

// Requests filed by an older hook have no note, so fall back to plain words.
function note(item) {
  const n = item.note || {};
  return {
    title: n.title || `Claude Code is waiting in ${item.project}`,
    body: n.body || '',
    one: n.one || 'a request',
    many: n.many || 'requests'
  };
}

async function waitingItems(r) {
  const ids = await r.zrange('waiting', 0, -1);
  if (!ids.length) return [];
  return (await r.mget(...ids.map(i => 'req:' + i))).filter(x => x && x.status === 'waiting');
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function list(parts) {
  return parts.length < 2 ? parts.join('') : parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
}

// "3 file edits and a package install."
export function summary(items) {
  const kinds = new Map();
  for (const it of items) {
    const n = note(it), k = kinds.get(n.many) || { ...n, count: 0 };
    k.count++; kinds.set(n.many, k);
  }
  const parts = [...kinds.values()].sort((a, b) => b.count - a.count)
    .map(k => k.count === 1 ? k.one : `${k.count} ${k.many}`);
  return cap(list(parts)) + '.';
}

const highTag = item => 'req-' + item.id;
const groupTag = project => 'group-' + project;

function highPayload(item, badge, reminder) {
  const n = note(item);
  return { title: n.title, body: reminder || `${n.body} ${HIGH_END}`.trim(), tag: highTag(item), ids: [item.id], badge };
}

function groupPayload(project, items, badge, reminder) {
  const ids = items.map(x => x.id);
  if (items.length === 1) {
    return { title: note(items[0]).title, body: reminder || WAIT_END, tag: groupTag(project), ids, badge };
  }
  const title = reminder ? `${items.length} requests still waiting in ${project}` : `${items.length} requests waiting in ${project}`;
  return { title, body: reminder || `${summary(items)} ${WAIT_END}`, tag: groupTag(project), ids, badge };
}

// Called once a new request is saved and waiting.
export async function notifyNew(r, item) {
  const all = await waitingItems(r);
  const badge = all.length;
  if (item.risk === 'high') return sendAll(r, highPayload(item, badge));

  const group = all.filter(x => x.risk !== 'high' && x.project === item.project);
  if (!group.length) return;
  const key = 'push:sound:' + item.project;
  const last = Number(await r.get(key)) || 0;
  const payload = groupPayload(item.project, group, badge);
  if (Date.now() - last < QUIET_MS) {
    if (QUIET_MODE === 'skip') return;
    payload.silent = true;
  } else {
    await r.set(key, Date.now(), { ex: 3600 });
  }
  return sendAll(r, payload);
}

// Called by the hook halfway through its wait. A project's group gets at most one
// reminder per QUIET_MS, so a burst of requests doesn't turn into a burst of reminders.
export async function notifyReminder(r, id, minutesLeft) {
  const item = await r.get('req:' + id);
  if (!item || item.status !== 'waiting') return;
  const mins = Math.max(1, Math.floor(minutesLeft));
  const text = `No answer in ${mins} minute${mins === 1 ? '' : 's'} and Claude Code will ask on your laptop instead.`;
  const all = await waitingItems(r);
  if (item.risk === 'high') return sendAll(r, highPayload(item, all.length, text));

  const key = 'push:remind:' + item.project;
  if (Date.now() - (Number(await r.get(key)) || 0) < QUIET_MS) return;
  await r.set(key, Date.now(), { ex: 3600 });
  const group = all.filter(x => x.risk !== 'high' && x.project === item.project);
  return sendAll(r, groupPayload(item.project, group, all.length, text));
}
