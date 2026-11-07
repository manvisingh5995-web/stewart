# Notification copy: draft

Input for the UX writing audit. Not final. The skill should improve it.

## Rules

- Titles: about 40 characters max. Never include "Stewart" (iPhone adds "from Stewart").
- Readers are Claude Code users: use Claude Code, commit, push, deploy.
- Never show raw commands, flags or file paths in notifications. Keep those inside the app.
- No risk-level words and no emoji in notifications.
- High-risk bodies end with: "Claude Code is paused until you decide."

## Draft

| Case | Title | Body |
| --- | --- | --- |
| One request | Claude Code is waiting in portfolio-site | Wants to install a package. Tap to allow or deny. |
| Several requests | 4 requests waiting in portfolio-site | File edits and a package install. Tap to review. |
| Delete | Delete 2 folders in craft-showpiece? | Deleted files can’t be recovered. Claude Code is paused until you decide. |
| Push | Push stewart to GitHub? | Your latest commits become visible to anyone with access to the repo. Claude Code is paused until you decide. |
| Deploy | Deploy stewart to your live site? | Visitors see the new version right away. Claude Code is paused until you decide. |
| Secret keys | Change secret keys in portfolio-site? | A wrong edit can break the app or expose a key. Claude Code is paused until you decide. |
| Reminder | Still waiting in craft-showpiece | No answer in 5 minutes and Claude Code will ask on your laptop instead. |