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
