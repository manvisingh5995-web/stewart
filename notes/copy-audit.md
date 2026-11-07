# Copy audit

Every user-facing string in Stewart, checked against the Voice section in
CLAUDE.md, the rules in the copy draft and the ux-writing skill. Nothing is applied yet.

"Keep" means the current text already works. "Remove" goes with the test panel.

## Decisions for you first

1. **Low and medium requests also pause Claude Code.** The hook blocks every request it sends, whatever the risk. The draft's grouped copy ("Tap to review") makes it sound as if Claude Code carries on, and it doesn't. I suggest low and medium bodies end with "Claude Code is waiting for your answer." High-risk ones keep "Claude Code is paused until you decide." Both are true, and the high-risk wording is the firmer of the two.
2. **"Claude" or "Claude Code".** Your message said "Claude is paused", but the draft says "Claude Code is paused". I used "Claude Code", following the draft's rule to use the words its readers use.
3. **"Who" in the title.** With a 40-character limit, "who + what + where" doesn't fit, and iPhone already adds "from Stewart". Your own high-risk drafts ("Push stewart to GitHub?") leave "who" out. I suggest every title follows *action + project*, and "Claude Code" goes in the body.
4. **Reminder timing.** The wait is 9 minutes, so halfway leaves 4.5 minutes, not 5. I suggest "in 4 minutes", which rounds down so the reminder never promises more time than you have.
5. **Grouped updates make a sound every time on iPhone.** This came from the phone test. The copy can't fix it. The fix is to limit how often the grouped notification updates.

## Notifications

| Location | Current text | Proposed text | Reason |
| --- | --- | --- | --- |
| One low/medium request: title | Draft: "Claude Code is waiting in portfolio-site" | **Install a package in portfolio-site?** | The draft title says where but not what. Leading with the action lets you decide from the lock screen. The question form matches the high-risk titles. |
| One low/medium request: body | Draft: "Wants to install a package. Tap to allow or deny." | **Claude Code is waiting for your answer.** | The action is now in the title. This line states the real consequence (decision 1). "Tap to…" adds nothing, because tapping is the only thing a notification can do. |
| Several low/medium: title | Draft: "4 requests waiting in portfolio-site" | **4 requests waiting in portfolio-site** (keep) | Clear, and about 36 characters. When it drops back to 1, it switches to the single-request form under the same tag, so it updates in place. |
| Several low/medium: body | Draft: "File edits and a package install. Tap to review." | **3 file edits and a package install. Claude Code is waiting for your answer.** | Counts are more useful than kinds alone, and the ending states the consequence (decision 1). |
| Delete: title | Draft: "Delete 2 folders in craft-showpiece?" | **Delete files in craft-showpiece?** | The hook can't tell folders from files, so "2 folders" may be wrong. "Files" is always true. |
| Delete: body | Draft: "Deleted files can't be recovered. Claude Code is paused until you decide." | **They skip the Trash and can't be restored. Claude Code is paused until you decide.** | Same fact, put as what happens rather than a warning. "Skip the Trash" is a picture every Mac user has. |
| Push: title | Draft: "Push stewart to GitHub?" | **Push stewart to GitHub?** (keep) | Good. It assumes the remote is GitHub, which the classifier already assumes. |
| Push: body | Draft: "Your latest commits become visible to anyone with access to the repo. …" | **Your new commits go to GitHub, where anyone who can see the repo will see them. Claude Code is paused until you decide.** | "Anyone with access" undersells a public repo like stewart. This version is true for both public and private repos. |
| Deploy: title | Draft: "Deploy stewart to your live site?" | **Deploy stewart to your live site?** (keep) | Clear, 33 characters. |
| Deploy: body | Draft: "Visitors see the new version right away. …" | **Visitors will see the new version right away. Claude Code is paused until you decide.** | "Will" makes it about what happens if you allow it, not what is happening now. |
| Secret keys file edited: title | Draft: "Change secret keys in portfolio-site?" | **Edit secret keys in portfolio-site?** | Uses "edit", the same verb as the other file actions. |
| Secret keys file edited: body | Draft: "A wrong edit can break the app or expose a key. …" | **A mistake here can stop the app from starting. Claude Code is paused until you decide.** | Editing the file doesn't expose a key, so "expose" scares without being true. The realistic consequence is a broken start-up. |
| Secret keys read by a command: title | Not in draft (a command that mentions `.env`) | **Use secret keys in portfolio-site?** | This is a different risk from editing: Claude Code would read the keys. The draft didn't cover it. |
| Secret keys read by a command: body | Not in draft | **Claude Code would see the passwords and API keys stored there. Claude Code is paused until you decide.** | States the real consequence without naming the file. |
| Discard changes: title / body | Not in draft (`reset --hard`, `clean`, `branch -D`) | **Discard changes in stewart?** / **Work you haven't committed will be lost. Claude Code is paused until you decide.** | A high-risk case the draft missed. |
| System command: title / body | Not in draft (`sudo`, `chmod`, piping a download into a shell) | **Run a system command from stewart?** / **It can change your Mac outside this project. Claude Code is paused until you decide.** | A high-risk case the draft missed. |
| File outside the project: title / body | Not in draft | **Edit a file outside stewart?** / **That file isn't part of this project. Claude Code is paused until you decide.** | A high-risk case the draft missed. No path, per the rules. |
| Reminder, high risk: title | Draft: "Still waiting in craft-showpiece" | **Still waiting: delete files in craft-showpiece?** | The draft title doesn't say what's waiting. This one replaces that request's own notification, so you don't get a second one. |
| Reminder, grouped: title | Draft: same as above | **4 requests still waiting in portfolio-site** | Replaces the grouped notification in place. |
| Reminder: body | Draft: "No answer in 5 minutes and Claude Code will ask on your laptop instead." | **If you don't answer in 4 minutes, Claude Code will ask on your laptop instead.** | Matches the real time left (decision 4). An "If…, will…" sentence reads more easily than "No answer and…". |
| Fallback in sw.js: title / body | "Stewart" / "Open Stewart to review." | **Claude Code is waiting** / **Open the app to see what it needs.** | Used only if a push arrives without its details. The draft rule says no "Stewart" in titles. |
| Test notifications in api/push.js | "High risk: Push code to GitHub", "N waiting in stewart", etc. | **Remove** | Test only. They also break the no-risk-words rule. |

## Header and tabs

| Location | Current text | Proposed text | Reason |
| --- | --- | --- | --- |
| App name, tab title | "Stewart" | Keep | |
| Status, demo | "Watching 3 demo sessions" | **Showing 3 sample sessions** | "Watching" suggests real activity. "Sample" is plainer than "demo" for anyone new. |
| Status, demo paused | "Demo sessions paused" | **Sample sessions paused** | Matches the line above. |
| Demo button | "Pause" / "Resume" | Keep | |
| Status, live | "Connected to Claude Code" | Keep | |
| Status, offline | "Can't reach your Stewart server. Retrying." | **Can't reach Stewart. Trying again. Check this phone's connection.** | Adds what you can do. "Server" is jargon here. |
| Tabs | "Waiting", "History", "Rules" | Keep | |

## Waiting tab

| Location | Current text | Proposed text | Reason |
| --- | --- | --- | --- |
| Empty, title | "Nothing waiting" | Keep | |
| Empty, live | "Claude Code checks in here before anything risky. Keep this open and you'll see it the moment it asks." | **When Claude Code needs your answer, it shows up here and as a notification.** | "Keep this open" is no longer true once notifications exist. "Before anything risky" is wrong too, because file edits come here as well. |
| Empty, demo | "Claude Code checks in here before anything risky. You'll see it the moment it asks." | **Sample requests appear here every few seconds.** | Says what will actually happen in the demo. |
| Rule suggestion | "You've allowed "X" 3 times in P. Allow it automatically from now on?" | **You've allowed "X" 3 times in P. Allow it without asking from now on?** | "Without asking" says exactly what changes. "Automatically" is vaguer. |
| Suggestion buttons | "Keep asking" / "Make it a rule" | Keep | |
| Risk labels | "Low risk", "Medium risk", "High risk" | Keep | You asked to keep these. |
| Meta line | "portfolio-site, 12s ago" | Keep | |
| Expand | "Show command" / "Hide command" | Keep | (CLAUDE.md says the raw command is never hidden, but it is collapsed for low and medium. That's a design question, not copy.) |
| Buttons | "Deny", "Allow", "Hold to allow" | Keep | |
| Hold, screen reader | "Press and hold to allow" | Keep | |

## Request titles and reasons (from the hook, shown on strips)

| Location | Current text | Proposed text | Reason |
| --- | --- | --- | --- |
| Push, reason | "Sends your changes to the shared copy of your code. Anyone with access will see them." | **Sends your commits to GitHub. Anyone who can see the repo will see them.** | Claude Code users say "commits" and "GitHub", not "shared copy". |
| Deploy, reason | "Replaces what visitors see right now." | Keep | |
| Delete, reason | "Removes files permanently. Nothing goes to the trash." | **Deletes these for good. They skip the Trash.** | Calmer, and "Trash" is the Mac word. |
| Discard changes, title / reason | "Throw away code changes" / "Discards work that may not be saved anywhere else." | **Discard code changes** / **Work you haven't committed will be lost.** | "Throw away" is casual for a serious action. "May not be saved anywhere" is vague. |
| System command, reason | "Can change your computer outside this project." | Keep | |
| Secret keys, command: title / reason | "Touch your secret keys file" / "This file holds passwords and API keys." | **Use your secret keys file** / **Claude Code would see the passwords and API keys in it.** | "Touch" is a Unix command, so it reads as jargon. The reason now says what happens. |
| Secret keys, edit: reason | "This file holds passwords and API keys. A wrong edit can break the app or leak a key." | **This file holds your passwords and API keys. A mistake here can stop the app from starting.** | "Leak" scares, and an edit doesn't leak anything. |
| Install, reason | "Downloads code from the internet into your project. Check the names are spelled right." | **Downloads code from the internet into your project. Check each name is spelled right.** | A small grammar fix. The advice is good: lookalike package names are a real risk. |
| Tests / build / other command, reasons | "Runs code on your machine." etc. | Keep | |
| Outside the project, title / reason | "Change a file outside this project: name" / "This file is not part of the project you are working on." | **Edit a file outside this project: name** / **This file isn't part of the project Claude Code is working in.** | Uses the same verb as other file actions. The reason says who is working there. |
| Web page, reason | "Web pages can contain misleading instructions." | **Claude Code will read this page. Some pages include instructions meant to mislead it.** | Says who might be misled, and why it matters. |
| Connected tool, title | "Use a connected tool: plugin_vercel_vercel: list_teams" | **Use a connected tool: vercel, list teams** | The raw tool ID is unreadable. The full ID stays visible in the command. |
| Settings file, title | "Create or replace project settings: package.json" | Keep | |

## Toasts

| Location | Current text | Proposed text | Reason |
| --- | --- | --- | --- |
| After a decision | "Allowed: X" / "Denied: X" + "Undo" | Keep | |
| Decision arrived too late | "Too late: that request had already timed out." | **Too late. Claude Code is asking on your laptop instead.** | Says what's happening now and where to go. |
| Decision failed to send | "Couldn't send that decision. Check your connection." | **Couldn't send your answer. It's back in Waiting. Check your connection and try again.** | Tells you the request isn't lost. |
| Rule created | "Rule added: Install npm packages in stewart" | Keep | |
| Rule used (demo) | "Handled by your rule: X" | **Allowed by your rule: X** | Same verb all the way through (CLAUDE.md). |

## History tab

| Location | Current text | Proposed text | Reason |
| --- | --- | --- | --- |
| Labels | "Allowed", "Denied", "By rule", "Timed out" | **Allowed**, **Denied**, **Allowed by rule**, **No answer** | "By rule" leaves out the verb. "Timed out" describes the system, while "No answer" describes you. |
| Summary | "So far: 2 allowed by you, 0 denied, 0 handled by your rules, 1 timed out." | **2 allowed, 0 denied, 0 allowed by rules, 1 with no answer.** | Uses the same words as the labels. "So far" and "by you" add nothing. |
| Empty | "No decisions yet. Everything you allow or deny shows up here." | Keep | |

## Rules tab

| Location | Current text | Proposed text | Reason |
| --- | --- | --- | --- |
| Empty | "No rules yet" / "When you allow the same kind of action 3 times in a project, Stewart offers to make it a rule." | Keep | |
| Rule row | "Always allow: X" / "In P. Used 1 times." | "Always allow: X" / **In P. Used once.** (or "Used 2 times") | Fixes a plural bug. |
| Switch, screen reader | "Rule on" | **Allow X in P without asking** | "Rule on" doesn't say which rule. |
| Remove button | "Remove" | Keep | |
| Guard note | "High-risk actions, like deleting files, pushing code or deploying, always come to you. Stewart never turns them into rules." | **High-risk actions, like deleting files, pushing code or deploying, always come to you. They can't become rules.** | Shorter. "Can't" states a fact, not a promise. |

## Footer and connecting

| Location | Current text | Proposed text | Reason |
| --- | --- | --- | --- |
| Footer, live | "Connected to your Claude Code sessions." | **This phone gets requests from every Claude Code session on your laptop.** | Removes the repeat of the header. It says something new instead. |
| Footer, live button | "Disconnect this device" | **Disconnect this phone** | Plainer. Use "device" if desktop use matters. |
| Footer, demo | "This is a demo. Requests are simulated to show how Claude Code sessions check in with Stewart." | **This is a demo with sample requests. Connect to see real ones from Claude Code.** | Shorter, and it points to the next step. |
| Footer, demo buttons | "Connect to Claude Code" / "Reset demo" | Keep | |
| Connect, label | "Your Stewart token" | Keep | |
| Connect, hint | "It's the STEWART_TOKEN you set in Vercel. It stays on this device." | **Paste the STEWART_TOKEN you added in Vercel. It's saved only on this phone.** | Starts with the action. |
| Connect, hint in the Home Screen app (new) | None | **The Home Screen app doesn't share Safari's sign-in, so paste your token once more.** | You were caught out by this during setup. It explains why you're asked a second time. |
| Connect, buttons | "Cancel" / "Connect" | Keep | |
| Connect error, wrong token | "That token doesn't match STEWART_TOKEN in Vercel." | **That token doesn't match the one in Vercel. Check nothing was cut off, then paste it again.** | Adds the fix without blaming you. |
| Connect error, server error | "The server answered with error 500." | **Stewart isn't working right now (error 500). Try again in a minute.** | Says what to do. The code stays for debugging. |
| Connect error, offline | "Couldn't reach the server. Connecting only works on your deployed Stewart site." | **Couldn't reach Stewart. Check your connection and try again.** | The second sentence covered a case only a developer meets. |
| Signed out because the token changed (alert) | "Your token doesn't match the one in Vercel. Connect again." | **This phone was disconnected because the token in Vercel changed. Connect again with the new one.** | Explains what happened, then the fix. |

## Notification setting (replaces the test panel)

| Location | Current text | Proposed text | Reason |
| --- | --- | --- | --- |
| Heading | "Notification test" | **Notifications** | It becomes a real setting. |
| Intro (new) | Checklist of Yes/No checks | **Get a notification when Claude Code needs your answer.** | Says the benefit before asking for permission (ux-writing permission pattern). The debug checklist is removed. |
| Button | "Turn on notifications" | Keep | |
| On | "Notifications are on for this device." | **Notifications are on for this phone.** | |
| Blocked | "Notifications are off. Turn them on in Settings, Notifications, Stewart." | **Notifications are off for Stewart. To turn them on, open Settings › Notifications › Stewart.** | Says where the problem is, then the exact path. |
| Not available (Safari) | "Push isn't available here. On iPhone, open Stewart from its Home Screen icon." | **To get notifications on iPhone, add Stewart to your Home Screen: tap Share, then Add to Home Screen.** | "Push" is jargon. This covers the case where there's no icon yet. |
| Failed | "Couldn't turn on notifications: [raw error]" | **Couldn't turn on notifications. Try again.** | Raw error text isn't for you. It goes to the console. |
| Test buttons, test messages | "Test high risk", "Sending 3 in 10 seconds…", "Cleared 2 notifications…" | **Remove** | Test only. |

## Claude Code's terminal (reasons the hook gives)

| Location | Current text | Proposed text | Reason |
| --- | --- | --- | --- |
| Stewart unreachable | "Stewart is unreachable, so asking here instead." | **Couldn't reach Stewart, so asking here instead.** | Plainer verb. |
| No answer | "No answer in Stewart, so asking here instead." | **No answer on your phone in 9 minutes, so asking here instead.** | Says what happened and how long it waited. |
| Allowed | "Allowed in Stewart." / "Allowed by your Stewart rule." | Keep | |
| Denied | "Denied in Stewart. Do not retry this action; ask the user what they want instead." | Keep | The second sentence is an instruction for Claude, not for you. |

## Server errors

The errors in `lib/store.js` can reach the connect screen. Change one:
"STEWART_TOKEN is not set. Add it in Vercel under Settings, Environment Variables."
→ **"STEWART_TOKEN isn't set. Add it in Vercel under Settings › Environment Variables, then redeploy."**
The variable only takes effect after a redeploy, and the current message doesn't say so.

Keep the rest ("Use GET or POST.", "No request with that id.", "Send a pattern and a project."). Only developers calling the API see them.

## Not covered here
- `README.md` is setup documentation, not UI. I can audit it separately.
- The icon.
