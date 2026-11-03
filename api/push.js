// Web push. GET: the public key a device needs to subscribe.
// POST {action:'subscribe', sub}: remember this device.
// POST {action:'test', test}: send a test sequence, to find out how iPhone handles each kind.
import webpush from 'web-push';
import { waitUntil } from '@vercel/functions';
import { redis, authed } from '../lib/store.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const START_MS = 10000;  // time to lock the phone before the first one arrives
const GAP_MS = 12000;

const grouped = (tag, renotify) => [1, 2, 3].map(n => ({
  title: `${n} waiting in stewart`,
  body: 'Test. Low and medium risk. Open Stewart to review.',
  tag, renotify, badge: n
}));

const TESTS = {
  high: [
    { title: 'High risk: Push code to GitHub', body: 'Test in stewart. Open Stewart to decide.', tag: 'test-high-1', badge: 1 },
    { title: 'High risk: Delete dist, node_modules', body: 'Test in portfolio-site. Open Stewart to decide.', tag: 'test-high-2', badge: 2 }
  ],
  grouped: grouped('test-group', false),
  'grouped-renotify': grouped('test-group-renotify', true)
};

function setup() {
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error('Missing push keys. Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Vercel, then redeploy.');
  webpush.setVapidDetails('https://stewart-omega.vercel.app', pub, priv);
  return pub;
}

async function sendAll(r, payload) {
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

export default async function handler(req, res) {
  if (!authed(req, res)) return;
  let pub;
  try { pub = setup(); } catch (err) { return res.status(500).json({ error: err.message }); }
  const r = redis();

  if (req.method === 'GET') return res.status(200).json({ key: pub });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use GET or POST.' });

  const { action, sub, test } = req.body || {};
  if (action === 'subscribe') {
    if (!sub?.endpoint || !sub?.keys) return res.status(400).json({ error: 'Send the subscription from pushManager.subscribe().' });
    await r.hset('push:subs', { [sub.endpoint]: JSON.stringify(sub) });
    return res.status(200).json({ ok: true });
  }
  if (action === 'test') {
    const steps = TESTS[test];
    if (!steps) return res.status(400).json({ error: 'Unknown test. Use ' + Object.keys(TESTS).join(', ') + '.' });
    waitUntil((async () => {
      await sleep(START_MS);
      for (const [i, p] of steps.entries()) {
        if (i) await sleep(GAP_MS);
        await sendAll(r, p);
      }
    })());
    return res.status(202).json({ ok: true, count: steps.length, startsInSeconds: START_MS / 1000, gapSeconds: GAP_MS / 1000 });
  }
  res.status(400).json({ error: 'Unknown action. Use subscribe or test.' });
}
