# Build log

Write one entry per working session. Keep the numbers; the case study needs them.

## Template
- **Date and time:**
- **What I did:**
- **Decision and why:**
- **What broke and how I fixed it:**
- **Numbers so far:** requests, allowed, denied, by rule, timed out

## Entries

### 2026-11-03: Repo setup
- **Date and time:** 2026-11-03
- **What I did:** Set up git, made the first commit ("Stewart v1", 13 files), created the public repo github.com/manvisingh5995-web/stewart and pushed `main`.
- **Decision and why:** Commits use GitHub's private email address (`…@users.noreply.github.com`) so my Gmail never shows in the public history. Before the first commit I checked the files for secrets: none, and `.gitignore` already leaves out `.env` and `.vercel`.
- **What broke and how I fixed it:** The GitHub CLI wasn't installed and the Mac has no Homebrew. Claude downloaded gh 2.103.3 from GitHub's official releases page into `~/.local/bin`, checked it against GitHub's published checksum and confirmed with `gh attestation verify` that GitHub's own build system made it. Claude's attempt to add `~/.local/bin` to `~/.zshrc` was blocked by a permission check, so for now I use the full path or export PATH myself.
- **Numbers so far:** none yet (Stewart isn't deployed).

### 2026-11-03: Vercel setup for Claude Code
- **Date and time:** 2026-11-03
- **What I did:** Followed vercel.com/get-started.md. Installed Vercel CLI 65.10.0, the Vercel plugin for Claude Code (0.54.1) and Vercel's MCP server, then signed in to both the CLI and the MCP.
- **Decision and why:** Installed the CLI just for my user in `~/.local` because the system-wide npm folder needs an admin password. Used the MCP server that comes with the plugin instead of adding a second copy.
- **What broke and how I fixed it:** The plugin installer couldn't find Claude Code because the desktop app has no `claude` command on PATH, so it needed `--target claude-code`. The first MCP sign-in didn't take and had to be repeated through `/mcp`.
- **Numbers so far:** none yet (Stewart isn't deployed).

### 2026-11-03: First deploy
- **Date and time:** 2026-11-03
- **What I did:** Created the Vercel project `manvihub/stewart`, added Upstash Redis (`stewart-redis`, free plan) and `STEWART_TOKEN` (production, hidden), then deployed to production at https://stewart-omega.vercel.app.
- **Decision and why:** The token was generated on my Mac and sent straight to Vercel without appearing on screen. A private copy lives in `~/.config/stewart/token` for the phone and hook setup. It's not in the repo.
- **What broke and how I fixed it:** Connecting the GitHub repo for push-to-deploy was blocked by a permission check, so the first deploy went through the CLI. The Vercel MCP connection can only see my personal account, not the Manvihub team, so team lookups used the CLI.
- **Checks:** page 200; API without a token 401; wrong token 401; right token 200 with an empty inbox (Redis connected). Build took 6s.
- **Numbers so far:** 0 requests (hook not installed yet).
- **Update:** Installed the Vercel GitHub app on just the `stewart` repo and connected it, so every push to `main` now deploys to production.

### 2026-11-03: Hook installed, first real requests
- **Date and time:** 2026-11-03, 14:18
- **What I did:** Connected my phone with the token, then added the hook, `STEWART_URL` and `STEWART_TOKEN` to `~/.claude/settings.json` (merged with the existing settings, file made readable only by me, old version kept as `settings.json.before-stewart`). Sent a test `npm install left-pad` request through the hook.
- **Decision and why:** The token is copied from `~/.config/stewart/token` by a script, so it never appears on screen or in the transcript.
- **What broke and how I fixed it:** Nothing broke, but the test took 8.6 minutes from request to decision, close to the 9-minute limit. A request from another open session (in `Handover`) went unanswered and expired. Cause: the request reached my phone straight away, but I only saw it later. The `Handover` request came from a session I was running in parallel; I denied a later delegate-project request from it. Lesson: Stewart only works if I notice the request, and a page in the background doesn't alert me. My feedback: it needs notifications.
- **Numbers so far:** 3 requests: 2 allowed (test 8m39s, a follow-up command 26s), 1 expired, 0 denied, 0 by rule.

### 2026-11-03: Notification test on iPhone
- **Date and time:** 2026-11-03
- **What I did:** Added Stewart to my Home Screen and ran three push tests from a temporary test panel: two separate high-risk notifications, a grouped notification that counted 1 → 2 → 3, and the same grouped test with "alert each time" (`renotify`) turned on.
- **Results:** Separate notifications each arrived with a sound. The grouped one stayed as one notification and its number went up. Every update made a sound in both grouped tests, so on iPhone replacing a notification alerts again whether or not `renotify` is set. The Home Screen icon showed a red count, and clearing removed it.
- **Decision and why:** Grouping cuts clutter but not noise: each new low or medium request will still buzz. Separate notifications for high risk work as planned.
- **My feedback:** The writing in the whole setup is poor and the icon is weak. Notification copy must drop risk-level words and emoji, say who wants what and where in the title, give the plain consequence in the body, and end high-risk ones with "Claude is paused until you decide." Add one reminder halfway through the wait saying Claude will ask on the laptop if there's no answer. Risk labels and colours stay inside the app.
- **Numbers so far:** unchanged (tests only).

### 2026-11-05: Voice, copy audit and real notifications
- **Date and time:** 2026-11-03 to 2026-11-05
- **What I did:** Added a Voice section to CLAUDE.md (calm, plain, says what happens next, never scares or blames). Ran the ux-writing skill over every user-facing string, using my draft in `notes/copy-draft.md` as input, and wrote the results to `notes/copy-audit.md` (location, current, proposed, reason). Approved it with five decisions, then shipped real notifications and the new copy.
- **Decisions and why:**
  1. Low and medium requests pause Claude Code too, because the hook blocks every request it sends. So their bodies say "Waiting for your answer." and high-risk ones say "Paused until you decide."
  2. "Claude Code" is dropped from notification bodies. It appears only in the reminder and in setup and connection screens.
  3. Every title is action + project, about 40 characters, e.g. "Push stewart to GitHub?". iPhone already adds "from Stewart".
  4. The halfway reminder works out the minutes left from `STEWART_WAIT_SECONDS` instead of saying a fixed "5 minutes" (9-minute wait → "No answer in 4 minutes and Claude Code will ask on your laptop instead.").
  5. The first low or medium request in a project makes a sound. More requests there within 2 minutes are quiet for now: they don't send at all, because the first phone test showed iPhone sounds on every replaced notification. High risk always sounds. Not final until the quiet-update test on my phone.
- **How it works:** The hook adds plain notification words to each request (no commands, paths or file contents). The server (`lib/notify.js`) sends one notification per high-risk request and one per project for low and medium, which updates in place (the service worker closes the old one first). At halfway, the hook asks the server for one reminder, at most one per project every 2 minutes. When the inbox is open, it closes notifications for answered requests and keeps the icon count right.
- **App changes:** New Settings view from the header holds the notification tests and "Disconnect this phone". The main screen shows only "Turn on notifications" until they're on (or how to fix it if they're blocked or Stewart isn't on the Home Screen). Buttons wrap instead of cutting off labels. The empty state lines up with the header. Copy fixes include "Used once" (was "Used 1 times"), "No answer" instead of "Timed out", and a clear message when the token in Vercel changes.
- **Audit findings worth keeping:** The draft missed four high-risk cases: discarding changes, system commands, editing files outside the project, and a command that reads `.env`. Reading `.env` is a different risk from editing it, because Claude Code would see the keys. "Touch your secret keys file" used a Unix command as a verb.
- **What broke and how I fixed it:** The draft file arrived named `notes:copy-draft.md.md` in the repo root (macOS shows `/` as `:`), so it was moved to `notes/copy-draft.md`. The new hook was syntax-checked before replacing the live one, because every Claude Code session runs it.
- **Numbers so far:** not counted this session.
