// Web push. GET: the public key a device needs to subscribe.
// POST {action:'subscribe', sub}: remember this device.
// POST {action:'remind', id, minutesLeft}: the hook's halfway reminder.
// POST {action:'test', test}: send a test sequence from Settings, to see how the phone handles it.
import { waitUntil } from '@vercel/functions';
import { redis, authed } from '../lib/store.js';
import { setupPush, sendAll, notifyReminder } from '../lib/notify.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const START_MS = 10000;  // time to lock the phone before the first one arrives
const GAP_MS = 12000;

const update = (n, tag, silent) => ({
  title: n === 1 ? 'Edit a file in stewart?' : `${n} requests waiting in stewart`,
  body: n === 1 ? 'Test. Waiting for your answer.' : `Test. ${n} file edits. Waiting for your answer.`,
  tag, badge: n, ...(silent && n > 1 ? { silent: true } : {})
});

const TESTS = {
  high: [
    { title: 'Push stewart to GitHub?', body: 'Test. Your new commits go to GitHub, where anyone who can see the repo will see them. Paused until you decide.', tag: 'test-high-1', badge: 1 },
    { title: 'Delete files in portfolio-site?', body: 'Test. They skip the Trash and can’t be restored. Paused until you decide.', tag: 'test-high-2', badge: 2 }
  ],
  grouped: [1, 2, 3].map(n => update(n, 'test-group', false)),
  // The first one sounds; the next two ask the phone to update without a sound.
  quiet: [1, 2, 3].map(n => update(n, 'test-quiet', true))
};

export default async function handler(req, res) {
  if (!authed(req, res)) return;
  let pub;
  try { pub = setupPush(); } catch (err) { return res.status(500).json({ error: err.message }); }
  const r = redis();

  if (req.method === 'GET') return res.status(200).json({ key: pub });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use GET or POST.' });

  const { action, sub, test, id, minutesLeft } = req.body || {};
  if (action === 'subscribe') {
    if (!sub?.endpoint || !sub?.keys) return res.status(400).json({ error: 'Send the subscription from pushManager.subscribe().' });
    await r.hset('push:subs', { [sub.endpoint]: JSON.stringify(sub) });
    return res.status(200).json({ ok: true });
  }
  if (action === 'remind') {
    if (!id || !(Number(minutesLeft) > 0)) return res.status(400).json({ error: 'Send an id and minutesLeft.' });
    await notifyReminder(r, String(id), Number(minutesLeft));
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
  res.status(400).json({ error: 'Unknown action. Use subscribe, remind or test.' });
}
