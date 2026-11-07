# Stewart: context for Claude Code

## What this is
An approval inbox for Claude Code, and a flagship portfolio piece for Manvi Singh
(product designer). Claude Code's PreToolUse hook sends risky actions to this
app; Manvi allows or denies them from her phone.

The portfolio story: Manvi uses Stewart to govern every Claude Code session
while she builds her other portfolio projects, then shows the real data.

## Architecture
- `index.html`: the whole inbox UI (vanilla HTML, CSS, JS). Demo mode with
  simulated requests when no token is saved; live mode polls the API.
- `api/requests.js`, `api/decision.js`, `api/history.js`, `api/rules.js`:
  Vercel serverless functions.
- `lib/store.js`: Upstash Redis client, token check, history helpers.
- `lib/notify.js`, `api/push.js`, `sw.js`: web push. One notification per
  high-risk request, one per project for low and medium, plus a halfway reminder.
- `hooks/stewart-hook.mjs`: the Claude Code hook. `classify()` turns a tool
  call into a plain-language request with a risk level.

## Rules that must not break
- High-risk actions can never be auto-allowed or turned into rules.
- An unknown risk level is treated as high.
- If Stewart is unreachable, the hook answers "ask", never "allow".
- Never send file contents to the server. Only titles, commands and paths.
- Decisions go to the server only after the 5-second undo window.

## Design direction
Air traffic control strips: each request is a strip in a bay, with a
risk-coloured edge. Calm by default, loud only for danger. One-thumb decisions.
The raw command is never hidden.

Tokens (light / dark):
- bay `#E3E8EB` / `#11171B`, strip `#FFFFFF` / `#1A2329`, ink `#0E1A21` / `#E3EAEE`
- muted `#56666F` / `#8C9DA7`, line `#CCD5DA` / `#2B373F`
- risk low `#4F7290`, medium `#C98A10`, high `#C2352B`, allow `#1D6B4B`
- Type: IBM Plex Sans Condensed for UI, IBM Plex Mono only for commands.
- Radius 3px everywhere. No shadows except the switch thumb.

Writing: sentence case, plain verbs, the same verb all the way through
(Allow → “Allowed”). Errors say what happened and how to fix it.

## Voice
Calm and plain. Every message says what will happen next, in words a
Claude Code user would use. Never scare and never blame: state the
consequence, not a warning, and when something fails, say what to do.

## Skills plan
Use skills one phase at a time, not all at once.
1. **Motion polish:** Emil Kowalski skill on the hold-to-allow fill, strip
   exit, and toast. Motion only where it answers a tap.
2. **Design critique:** Impeccable for a full polish pass against the
   direction above. Don't let it change the direction itself.
3. **Audit:** Web Design Guidelines for accessibility and UX issues, then
   Playwright CLI to screenshot phone, desktop and dark mode, and to test
   the allow, deny, hold and undo flows.
4. **System:** Extract Design System to write `DESIGN.md` from the finished
   UI, so the portfolio site reuses the same tokens.
5. **Story:** Remotion for a 30-second demo video for the case study.

Not used here: Taste and UI UX Pro Max (they overlap with Impeccable and
would pull the style in different directions), img2threejs and Brandkit
(saved for the craft showpiece), Image to Code (no source mockups).

## Build log
Log decisions, problems and numbers in `notes/build-log.md` as you go.
The case study is written from that file.
