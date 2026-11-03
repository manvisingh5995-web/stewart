// GET: your last 200 decisions, newest first.
import { redis, authed, HISTORY_MAX } from '../lib/store.js';

export default async function handler(req, res) {
  if (!authed(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });
  const r = redis();
  const ids = await r.lrange('history', 0, HISTORY_MAX - 1);
  if (!ids.length) return res.status(200).json([]);
  const items = (await r.mget(...ids.map(i => 'req:' + i))).filter(Boolean);
  res.status(200).json(items);
}
