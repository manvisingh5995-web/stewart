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

// Notification words for a request. Never a command, path or file contents.
// High risk: a title and the plain consequence. Low and medium: a title, plus
// "a file edit" / "file edits" so several requests can share one notification.
const high = (title, body) => ({ title, body });
const ask = (title, one, many) => ({ title, one, many });

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

    const danger = (title, why, note) => ({ ...base, risk: 'high', title, cmd, why, pattern: null, note });
    if (/\bgit\s+push\b/.test(c)) return danger('Push code to GitHub', 'Sends your commits to GitHub. Anyone who can see the repo will see them.',
      high(`Push ${project} to GitHub?`, 'Your new commits go to GitHub, where anyone who can see the repo will see them.'));
    if (/\b(vercel|netlify)\b.*--prod\b/.test(c)) return danger('Deploy to your live site', 'Replaces what visitors see right now.',
      high(`Deploy ${project} to your live site?`, 'Visitors will see the new version right away.'));
    if (/\brm\s/.test(c)) {
      const seg = parts.find(p => /^(sudo\s+)?rm\s/.test(p)) || c;
      const targets = seg.split(' ').slice(1).filter(a => !a.startsWith('-') && a !== 'rm');
      return danger('Delete: ' + trunc(targets.join(', ') || 'files', 60), 'Deletes these for good. They skip the Trash.',
        high(`Delete files in ${project}?`, 'They skip the Trash and can’t be restored.'));
    }
    if (/\bgit\s+(reset\s+--hard|clean\s+-|checkout\s+--\s|branch\s+-D)\b/.test(c)) return danger('Discard code changes', 'Work you haven’t committed will be lost.',
      high(`Discard changes in ${project}?`, 'Work you haven’t committed will be lost.'));
    if (/\bsudo\b|\bchmod\b|\bchown\b|(curl|wget)[^|]*\|\s*(ba|z)?sh\b/.test(c)) return danger('Run a system-level command', 'Can change your computer outside this project.',
      high(`Run a system command from ${project}?`, 'It can change your Mac outside this project.'));
    if (/\.env\b/.test(c)) return danger('Use your secret keys file', 'Claude Code would see the passwords and API keys in it.',
      high(`Use secret keys in ${project}?`, 'The passwords and API keys stored there would be read.'));

    let m;
    if ((m = c.match(/\b(npm|pnpm|yarn|bun)\s+(i|install|add)\b(.*)$/))) {
      const pkgs = m[3].split(' ').filter(a => a && !a.startsWith('-'));
      return { ...base, risk: 'medium', title: pkgs.length ? 'Install: ' + trunc(pkgs.join(', '), 50) : 'Install project packages', cmd,
        why: 'Downloads code from the internet into your project. Check each name is spelled right.', pattern: 'npm-install',
        note: ask(pkgs.length > 1 || !pkgs.length ? `Install packages in ${project}?` : `Install a package in ${project}?`, 'a package install', 'package installs') };
    }
    if (/\bplaywright\b|\b(npm|pnpm|yarn)\s+(run\s+)?test\b/.test(c)) return { ...base, risk: 'medium', title: 'Run the tests', cmd, why: 'Runs code on your machine.', pattern: 'tests',
      note: ask(`Run the tests in ${project}?`, 'a test run', 'test runs') };
    if (/\b(npm|pnpm|yarn)\s+run\s+build\b|\b(next|vite)\s+build\b/.test(c)) return { ...base, risk: 'medium', title: 'Run a build', cmd, why: 'Compiles your project. Runs code on your machine.', pattern: 'build',
      note: ask(`Run a build in ${project}?`, 'a build', 'builds') };
    if (/\b(npm|pnpm|yarn)\s+run\s+lint\b|\beslint\b/.test(c)) return { ...base, risk: 'low', title: 'Check code style', cmd, why: 'Reads your code and reports problems. Changes nothing.', pattern: 'lint',
      note: ask(`Check code style in ${project}?`, 'a style check', 'style checks') };
    return { ...base, risk: 'medium', title: 'Run: ' + trunc(c, 48), cmd, why: 'Runs a command on your machine.', pattern: null,
      note: ask(`Run a command in ${project}?`, 'a command', 'commands') };
  }

  if (['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
    const file = String(input.file_path || input.notebook_path || '');
    const rel = path.relative(cwd, file);
    const name = path.basename(file);
    const verb = tool === 'Write' ? 'Create or replace' : 'Edit';
    const changed = String(input.new_string ?? input.content ?? '').split('\n').length;
    const cmd = `${tool}  ${rel || name}${changed ? `\n${changed} lines` : ''}`;
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
      return { ...base, risk: 'high', title: 'Edit a file outside this project: ' + name, cmd, why: 'This file isn’t part of the project Claude Code is working in.', pattern: null,
        note: high(`Edit a file outside ${project}?`, 'That file isn’t part of this project.') };
    }
    if (/(^|[\\/])\.env/.test(rel)) return { ...base, risk: 'high', title: 'Change your secret keys file', cmd, why: 'This file holds your passwords and API keys. A mistake here can stop the app from starting.', pattern: null,
      note: high(`Edit secret keys in ${project}?`, 'A mistake here can stop the app from starting.') };
    if (/^(package\.json|vercel\.json|\.claude[\\/].*|.*config\.(js|mjs|ts))$/.test(rel)) {
      return { ...base, risk: 'medium', title: `${verb} project settings: ${name}`, cmd, why: 'Settings files change how the whole project builds or runs.', pattern: null,
        note: ask(`Edit project settings in ${project}?`, 'a settings change', 'settings changes') };
    }
    return { ...base, risk: 'low', title: `${verb} ${name}`, cmd, why: 'Changes one file inside your project. Easy to undo with git.', pattern: rel.startsWith('src') ? 'edit-src' : 'edit-files',
      note: ask(tool === 'Write' ? `Write a file in ${project}?` : `Edit a file in ${project}?`, 'a file edit', 'file edits') };
  }

  if (tool === 'WebFetch') {
    let host = 'the web';
    try { host = new URL(input.url).host; } catch {}
    return { ...base, risk: 'medium', title: 'Read a page on ' + host, cmd: 'WebFetch  ' + input.url, why: 'Claude Code will read this page. Some pages include instructions meant to mislead it.', pattern: 'fetch-web',
      note: ask(`Read a web page in ${project}?`, 'a web page to read', 'web pages to read') };
  }

  if (tool.startsWith('mcp__')) {
    // mcp__plugin_vercel_vercel__list_teams → "vercel, list teams"
    const [server = '', ...rest] = tool.split('__').slice(1);
    const short = server.split('_').filter(Boolean).pop() || server;
    const name = [short, rest.join(' ').replace(/_/g, ' ')].filter(Boolean).join(', ');
    return { ...base, risk: 'medium', title: 'Use a connected tool: ' + trunc(name, 50), cmd: tool + '\n' + trunc(JSON.stringify(input), 400), why: 'Connected tools can read or change things outside your computer.', pattern: null,
      note: ask(`Use a connected tool in ${project}?`, 'a connected tool', 'connected tools') };
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
const minutes = ms => { const m = Math.round(ms / 60000); return m === 1 ? '1 minute' : m + ' minutes'; };

async function main() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  const event = JSON.parse(raw || '{}');

  const req = classify(event.tool_name || '', event.tool_input || {}, event.cwd || process.cwd());
  if (!req) process.exit(0);                 // harmless: normal Claude Code behaviour
  if (!BASE || !TOKEN) process.exit(0);      // Stewart not configured: normal behaviour

  let filed;
  try { filed = await api('POST', '/api/requests', req); }
  catch { reply('ask', 'Couldn’t reach Stewart, so asking here instead.'); }

  if (filed.status === 'rule') reply('allow', 'Allowed by your Stewart rule.');

  const end = Date.now() + WAIT_MS;
  const remindAt = Date.now() + WAIT_MS / 2;
  let reminded = false;
  while (Date.now() < end) {
    await sleep(POLL_MS);
    try {
      const d = await api('GET', '/api/decision?id=' + encodeURIComponent(filed.id));
      if (d.status === 'allowed') reply('allow', 'Allowed in Stewart.');
      if (d.status === 'denied') reply('deny', 'Denied in Stewart. Do not retry this action; ask the user what they want instead.');
      if (d.status === 'expired') break;
    } catch { /* network blip: keep waiting */ }
    // Halfway through, remind the phone how long is left. Skipped if under a minute remains.
    const left = end - Date.now();
    if (!reminded && Date.now() >= remindAt && left >= 60000) {
      reminded = true;
      api('POST', '/api/push', { action: 'remind', id: filed.id, minutesLeft: left / 60000 }).catch(() => {});
    }
  }
  try { await api('POST', '/api/decision', { id: filed.id, decision: 'expired' }); } catch {}
  reply('ask', `No answer on your phone in ${minutes(WAIT_MS)}, so asking here instead.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
