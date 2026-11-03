// GET  ?id=...  the hook checks whether you've decided.
// POST {id, decision}  the inbox sends allowed or denied; the hook sends expired when it gives up.
import { redis, authed, record } from '../lib/store.js';

const DECISIONS = ['allowed', 'denied', 'expired'];

export default async function handler(req, res) {
  if (!authed(req, res)) return;
  const r = redis();

  if (req.method === 'GET') {
    const id = String(req.query.id || '');
    const item = await r.get('req:' + id);
    if (!item) return res.status(404).json({ error: 'No request with that id.' });
    return res.status(200).json({ id, status: item.status });
  }

  if (req.method === 'POST') {
    const { id, decision } = req.body || {};
    if (!DECISIONS.includes(decision)) {
      return res.status(400).json({ error: 'Decision must be allowed, denied or expired.' });
    }
    const item = await r.get('req:' + id);
    if (!item) return res.status(404).json({ error: 'No request with that id.' });
    if (item.status !== 'waiting') {
      return res.status(409).json({ error: 'This request was already decided.', status: item.status });
    }
    Object.assign(item, { status: decision, decidedAt: Date.now() });
    await record(r, item);
    return res.status(200).json({ id, status: decision });
  }

  res.status(405).json({ error: 'Use GET or POST.' });
}
