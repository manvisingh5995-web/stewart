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
