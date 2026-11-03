// POST: Claude Code's hook files a new request.
// GET:  the inbox lists everything still waiting.
import { randomUUID } from 'node:crypto';
import { redis, authed, getRules, saveItem, record, STALE_MS } from '../lib/store.js';

const RISKS = ['low', 'medium', 'high'];

export default async function handler(req, res) {
  if (!authed(req, res)) return;
  const r = redis();

  if (req.method === 'POST') {
    const b = req.body || {};
    const item = {
      id: randomUUID(),
      project: String(b.project || 'unknown').slice(0, 80),
      tool: String(b.tool || '').slice(0, 80),
      title: String(b.title || 'Unknown action').slice(0, 140),
      cmd: String(b.cmd || '').slice(0, 2000),
      why: String(b.why || '').slice(0, 300),
      risk: RISKS.includes(b.risk) ? b.risk : 'high', // unknown risk is treated as high
      pattern: typeof b.pattern === 'string' ? b.pattern.slice(0, 40) : null,
      ts: Date.now(),
      status: 'waiting'
    };

    // Rules can only ever cover low and medium risk.
    const rules = await getRules(r);
    const rule = item.risk !== 'high' && item.pattern &&
      rules.find(x => x.on && x.pattern === item.pattern && x.project === item.project);
    if (rule) {
      rule.used = (rule.used || 0) + 1;
      await r.set('rules', rules);
      Object.assign(item, { status: 'rule', decidedAt: Date.now() });
      await record(r, item);
      return res.status(200).json({ id: item.id, status: 'rule' });
    }

    await saveItem(r, item);
    await r.zadd('waiting', { score: item.ts, member: item.id });
    return res.status(201).json({ id: item.id, status: 'waiting' });
  }

  if (req.method === 'GET') {
    const ids = await r.zrange('waiting', 0, -1);
    if (!ids.length) return res.status(200).json([]);
    const items = (await r.mget(...ids.map(i => 'req:' + i))).filter(Boolean);
    const now = Date.now();
    const live = [];
    for (const it of items) {
      if (it.status !== 'waiting') { await r.zrem('waiting', it.id); continue; }
      if (now - it.ts > STALE_MS) {
        Object.assign(it, { status: 'expired', decidedAt: now });
        await record(r, it);
        continue;
      }
      live.push(it);
    }
    return res.status(200).json(live);
  }

  res.status(405).json({ error: 'Use GET or POST.' });
}
