// Shared helpers for Stewart's API: storage, auth and history.
import { Redis } from '@upstash/redis';

let client;

export function redis() {
  if (!client) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
      throw new Error('Missing Redis settings. In Vercel, open Storage and connect Upstash Redis to this project.');
    }
    client = new Redis({ url, token });
  }
  return client;
}

// Used by local tests to swap in an in-memory store.
export function setClient(c) { client = c; }

// Every route needs the shared secret, so only you can approve actions.
export function authed(req, res) {
  const want = process.env.STEWART_TOKEN;
  if (!want) {
    res.status(500).json({ error: 'STEWART_TOKEN isn’t set. Add it in Vercel under Settings › Environment Variables, then redeploy.' });
    return false;
  }
  if (req.headers['x-stewart-token'] !== want) {
    res.status(401).json({ error: 'Wrong or missing Stewart token.' });
    return false;
  }
  return true;
}

const KEEP = 60 * 60 * 24 * 30; // keep requests for 30 days
export const HISTORY_MAX = 200;
export const STALE_MS = 15 * 60 * 1000; // a waiting request older than this has been abandoned

export async function saveItem(r, item) {
  await r.set('req:' + item.id, item, { ex: KEEP });
}

export async function record(r, item) {
  await saveItem(r, item);
  await r.zrem('waiting', item.id);
  await r.lpush('history', item.id);
  await r.ltrim('history', 0, HISTORY_MAX - 1);
}

export async function getRules(r) {
  return (await r.get('rules')) || [];
}
