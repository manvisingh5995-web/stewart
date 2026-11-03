#!/usr/bin/env node
// Stewart hook for Claude Code.
// Claude Code runs this before risky tools (see README). It files the action in
// your Stewart inbox, waits for your tap, then tells Claude Code allow or deny.
// If Stewart isn't set up or can't be reached, Claude Code asks in the terminal as usual.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = (process.env.STEWART_URL || '').replace(/\/+$/, '');
const TOKEN = process.env.STEWART_TOKEN || '';
const WAIT_MS = Number(process.env.STEWART_WAIT_SECONDS || 540) * 1000;
const POLL_MS = 1500;

const SAFE = /^(ls|pwd|cat|head|tail|wc|echo|which|node -v|npm -v|git (status|diff|log|branch|show))\b/;

function trunc(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

// Turns a raw tool call into a plain-language request with a risk level.
// Returns null for harmless actions, which Stewart lets Claude Code handle normally.
export function classify(tool, input = {}, cwd = process.cwd()) {
  const project = path.basename(cwd);
  const base = { project, tool };

  if (tool === 'Bash') {
    const cmd = String(input.command || '').trim();
    const c = cmd.replace(/\s+/g, ' ');
    const parts = c.split(/&&|\|\||;|\|/).map(s => s.trim()).filter(Boolean);
    if (parts.length && parts.every(p => SAFE.test(p)) && !/>|\.env\b/.test(c)) return null;

    const high = (title, why) => ({ ...base, risk: 'high', title, cmd, why, pattern: null });
    if (/\bgit\s+push\b/.test(c)) return high('Push code to GitHub', 'Sends your changes to the shared copy of your code. Anyone with access will see them.');
    if (/\b(vercel|netlify)\b.*--prod\b/.test(c)) return high('Deploy to your live site', 'Replaces what visitors see right now.');
    if (/\brm\s/.test(c)) {
      const seg = parts.find(p => /^(sudo\s+)?rm\s/.test(p)) || c;
      const targets = seg.split(' ').slice(1).filter(a => !a.startsWith('-') && a !== 'rm');
      return high('Delete: ' + trunc(targets.join(', ') || 'files', 60), 'Removes files permanently. Nothing goes to the trash.');
    }
    if (/\bgit\s+(reset\s+--hard|clean\s+-|checkout\s+--\s|branch\s+-D)\b/.test(c)) return high('Throw away code changes', 'Discards work that may not be saved anywhere else.');
    if (/\bsudo\b|\bchmod\b|\bchown\b|(curl|wget)[^|]*\|\s*(ba|z)?sh\b/.test(c)) return high('Run a system-level command', 'Can change your computer outside this project.');
    if (/\.env\b/.test(c)) return high('Touch your secret keys file', 'This file holds passwords and API keys.');

    let m;
    if ((m = c.match(/\b(npm|pnpm|yarn|bun)\s+(i|install|add)\b(.*)$/))) {
      const pkgs = m[3].split(' ').filter(a => a && !a.startsWith('-'));
      return { ...base, risk: 'medium', title: pkgs.length ? 'Install: ' + trunc(pkgs.join(', '), 50) : 'Install project packages', cmd, why: 'Downloads code from the internet into your project. Check the names are spelled right.', pattern: 'npm-install' };
    }
    if (/\bplaywright\b|\b(npm|pnpm|yarn)\s+(run\s+)?test\b/.test(c)) return { ...base, risk: 'medium', title: 'Run the tests', cmd, why: 'Runs code on your machine.', pattern: 'tests' };
    if (/\b(npm|pnpm|yarn)\s+run\s+build\b|\b(next|vite)\s+build\b/.test(c)) return { ...base, risk: 'medium', title: 'Run a build', cmd, why: 'Compiles your project. Runs code on your machine.', pattern: 'build' };
    if (/\b(npm|pnpm|yarn)\s+run\s+lint\b|\beslint\b/.test(c)) return { ...base, risk: 'low', title: 'Check code style', cmd, why: 'Reads your code and reports problems. Changes nothing.', pattern: 'lint' };
    return { ...base, risk: 'medium', title: 'Run: ' + trunc(c, 48), cmd, why: 'Runs a command on your machine.', pattern: null };
  }

  if (['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
    const file = String(input.file_path || input.notebook_path || '');
    const rel = path.relative(cwd, file);
    const name = path.basename(file);
    const verb = tool === 'Write' ? 'Create or replace' : 'Edit';
    const changed = String(input.new_string ?? input.content ?? '').split('\n').length;
    const cmd = `${tool}  ${rel || name}${changed ? `\n${changed} lines` : ''}`;
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
      return { ...base, risk: 'high', title: 'Change a file outside this project: ' + name, cmd, why: 'This file is not part of the project you are working on.', pattern: null };
    }
    if (/(^|[\\/])\.env/.test(rel)) return { ...base, risk: 'high', title: 'Change your secret keys file', cmd, why: 'This file holds passwords and API keys. A wrong edit can break the app or leak a key.', pattern: null };
    if (/^(package\.json|vercel\.json|\.claude[\\/].*|.*config\.(js|mjs|ts))$/.test(rel)) {
      return { ...base, risk: 'medium', title: `${verb} project settings: ${name}`, cmd, why: 'Settings files change how the whole project builds or runs.', pattern: null };
    }
    return { ...base, risk: 'low', title: `${verb} ${name}`, cmd, why: 'Changes one file inside your project. Easy to undo with git.', pattern: rel.startsWith('src') ? 'edit-src' : 'edit-files' };
  }

  if (tool === 'WebFetch') {
    let host = 'the web';
    try { host = new URL(input.url).host; } catch {}
    return { ...base, risk: 'medium', title: 'Read a page on ' + host, cmd: 'WebFetch  ' + input.url, why: 'Web pages can contain misleading instructions.', pattern: 'fetch-web' };
  }

  if (tool.startsWith('mcp__')) {
    const name = tool.split('__').slice(1).join(': ');
    return { ...base, risk: 'medium', title: 'Use a connected tool: ' + trunc(name, 50), cmd: tool + '\n' + trunc(JSON.stringify(input), 400), why: 'Connected tools can read or change things outside your computer.', pattern: null };
  }

  return null;
}

function reply(decision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: reason }
  }));
  process.exit(0);
}

async function api(method, route, body) {
  const res = await fetch(BASE + route, {
    method,
    headers: { 'content-type': 'application/json', 'x-stewart-token': TOKEN },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`${method} ${route} returned ${res.status}`);
  return res.json();
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  const event = JSON.parse(raw || '{}');

  const req = classify(event.tool_name || '', event.tool_input || {}, event.cwd || process.cwd());
  if (!req) process.exit(0);                 // harmless: normal Claude Code behaviour
  if (!BASE || !TOKEN) process.exit(0);      // Stewart not configured: normal behaviour

  let filed;
  try { filed = await api('POST', '/api/requests', req); }
  catch { reply('ask', 'Stewart is unreachable, so asking here instead.'); }

  if (filed.status === 'rule') reply('allow', 'Allowed by your Stewart rule.');

  const end = Date.now() + WAIT_MS;
  while (Date.now() < end) {
    await sleep(POLL_MS);
    try {
      const d = await api('GET', '/api/decision?id=' + encodeURIComponent(filed.id));
      if (d.status === 'allowed') reply('allow', 'Allowed in Stewart.');
      if (d.status === 'denied') reply('deny', 'Denied in Stewart. Do not retry this action; ask the user what they want instead.');
      if (d.status === 'expired') break;
    } catch { /* network blip: keep waiting */ }
  }
  try { await api('POST', '/api/decision', { id: filed.id, decision: 'expired' }); } catch {}
  reply('ask', 'No answer in Stewart, so asking here instead.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
