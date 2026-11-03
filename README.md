# Stewart

An approval inbox for Claude Code. Before Claude Code does something risky
(deleting files, installing packages, pushing code, deploying), the request
lands on your phone. You allow or deny it in one tap. High-risk actions need
a press-and-hold. Repeated safe actions can become rules.

## How the pieces fit

```
Claude Code on your laptop
   │  wants to run "git push"
   ▼
hooks/stewart-hook.mjs   ← Claude Code runs this first and waits for its answer
   │  sends the request to your server
   ▼
Your Stewart site on Vercel (api/ + index.html)
   │  stores it in Upstash Redis
   ▼
Your phone  →  you tap Allow  →  the hook tells Claude Code "allow"
```

- **Hook:** a small script Claude Code runs before certain tools. It can answer allow, deny or ask.
- **Vercel:** hosts the inbox page and the API. Free for personal projects.
- **Upstash Redis:** a tiny database that remembers waiting requests, history and rules.
- **Token:** a password shared by the hook and your phone, so only you can approve.

## Setup (about 45 minutes the first time)

### 1. Install the tools
- **Node.js (LTS):** download from nodejs.org. Check with `node -v` in Terminal.
- **git:** Mac: run `git --version` and accept the install prompt. Windows: install from git-scm.com.
- **GitHub CLI:** install from cli.github.com, then run `gh auth login` and follow the prompts.

### 2. Put the code on GitHub
Unzip this folder somewhere permanent, for example `~/projects/stewart`.
Open Terminal in that folder and start Claude Code with `claude`, then ask:

> Initialize git, make a first commit, and create a public GitHub repo called stewart with `gh repo create stewart --public --source=. --push`.

Or run it yourself:
```
git init && git add . && git commit -m "Stewart v1"
gh repo create stewart --public --source=. --push
```

### 3. Deploy on Vercel
1. Sign up at vercel.com with your GitHub account.
2. Click **Add New → Project**, import `stewart`, and click **Deploy**. No settings to change.
3. In the project, open **Storage → Create Database → Upstash for Redis**, then connect it to this project. Vercel adds the database settings for you.

### 4. Create your token
In Terminal:
```
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```
Copy the result. In Vercel, open **Settings → Environment Variables**, add
`STEWART_TOKEN` with that value, then open **Deployments** and **Redeploy**
(settings only apply after a redeploy).

### 5. Connect your phone
Open your Vercel URL (like `https://stewart-abc.vercel.app`) on your phone.
Tap **Connect to Claude Code**, paste the token, then use **Share → Add to Home Screen**.

### 6. Install the hook
Open `~/.claude/settings.json` (create it if it doesn't exist). Add the block from
`claude-settings-example.json`, replacing:
- `STEWART_URL` with your Vercel URL,
- `STEWART_TOKEN` with your token,
- the path with the real location of `hooks/stewart-hook.mjs` (run `pwd` inside the hooks folder to see it).

If the file already has content, merge the `env` and `hooks` sections instead of replacing the file.
Restart Claude Code. Type `/hooks` to check it's listed.

### 7. Test it
In any project, ask Claude Code: “run npm install left-pad”.
Your phone shows the request. Tap **Allow** and Claude Code continues 5 seconds later (that's the undo window).

## Good to know
- **Claude Code waits for you.** Up to 9 minutes per request, then it falls back to asking in the terminal. Change this with `STEWART_WAIT_SECONDS`.
- **If Stewart is down,** Claude Code asks in the terminal as usual. Nothing gets silently allowed.
- **High-risk actions can never become rules.** That's on purpose.
- **What leaves your laptop:** the action's title, the command or file path, and the project folder name. File contents are never sent. A shell command can contain a secret if you type one into it, so don't.
- **To switch Stewart off,** remove `STEWART_URL` from `~/.claude/settings.json`. The hook then lets Claude Code behave normally.
- **Deploying is `git push`.** Vercel redeploys on every push to GitHub, and Stewart will ask you before Claude Code pushes.

## Troubleshooting
- **Phone says the token doesn't match:** the token in Vercel and on your phone differ, or you didn't redeploy after adding it.
- **“Missing Redis settings”:** connect Upstash Redis to the project in Vercel's Storage tab, then redeploy.
- **Nothing reaches your phone:** check `STEWART_URL` has no typo, and that `/hooks` in Claude Code lists the hook.
