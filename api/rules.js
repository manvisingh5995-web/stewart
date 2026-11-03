// GET: list rules.  POST: add.  PATCH: turn on or off.  DELETE: remove.
// A rule is identified by its pattern and project.
import { redis, authed, getRules } from '../lib/store.js';

export default async function handler(req, res) {
  if (!authed(req, res)) return;
  const r = redis();
  const rules = await getRules(r);
  if (req.method === 'GET') return res.status(200).json(rules);

  const { pattern, project, on } = req.body || {};
  if (typeof pattern !== 'string' || typeof project !== 'string' || !pattern || !project) {
    return res.status(400).json({ error: 'Send a pattern and a project.' });
  }
  const i = rules.findIndex(x => x.pattern === pattern && x.project === project);

  if (req.method === 'POST') {
    if (i === -1) rules.push({ pattern, project, on: true, used: 0, createdAt: Date.now() });
  } else if (req.method === 'PATCH') {
    if (i === -1) return res.status(404).json({ error: 'No such rule.' });
    rules[i].on = Boolean(on);
  } else if (req.method === 'DELETE') {
    if (i !== -1) rules.splice(i, 1);
  } else {
    return res.status(405).json({ error: 'Use GET, POST, PATCH or DELETE.' });
  }
  await r.set('rules', rules);
  res.status(200).json(rules);
}
