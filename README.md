# GoMini — gomini.elclic.net

A web app for playing **Go on small boards (7×7 and 9×9) against KataGo**. Built with **Next.js 15 (App Router) + TypeScript**, with no external UI dependencies: the board is SVG and the rules are written in TypeScript. The opponent is **KataGo** (analysis engine) behind an API route, with a fast bot as a lightweight fallback.

## What it does

- **7×7 / 9×9 board selector** (the engine is size-agnostic; komi 9 on 7×7 and 7 on 9×9).
- SVG board with wood texture and 3D relief, matte textured stones, coordinate labels on the margin, hover preview and a last-move marker.
- Full rules engine: liberties, captures, **ko rule**, **suicide ban**, passing and game end.
- **Area scoring** (Chinese style) with size-based komi at the end of the game.
- **Counting phase** when the game ends (two passes): you can **mark dead stones** by tapping them (the whole connected group toggles), they are drawn dimmed and treated as captured. Each color's **territory** is marked with a small square (black/white) on empty intersections surrounded by a single color; neutral points (dame) are not marked. The score and markers are **recalculated live** and there is a button to **finish the count** (and resume it). Works on desktop and mobile.
- **Opponent selector**: fast bot (instant, no load) or KataGo (on demand).
- **Light/dark theme** and a game that is **saved and resumed** after a refresh.
- **Trilingual** (Catalan, Spanish, English) with a language selector; custom i18n with no libraries (`src/lib/i18n.tsx`), lesson texts localized in `lessons.ts`.
- **KataGo** opponent with **adjustable difficulty** (Easy / Medium / Hard → fewer or more *visits*).
- **Heuristic fallback bot**: if KataGo is not configured or does not respond, the app stays playable with a simple TypeScript opponent. When KataGo is present, it takes over.
- **Hint button**: highlights KataGo's best move on the board and shows its evaluation (win probability, expected points and the predicted sequence).
- **Interactive tutorial** (`/aprendre`): 13 step-by-step lessons with prepared positions, validated against the rules engine. Fundamentals (liberties, capture, chains, atari, double atari, ko), shapes and technique (extending/nobi, hane, connecting cutting points, tiger's mouth, empty triangle, two eyes) and strategy (corners first, 9×9 opening).
- Controls: pass, hint, undo, new game.
- **Light/dark theme** with a toggle (☀️/🌙) that remembers your preference. Board with wood texture and 3D relief, glossy stones.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

You can play without configuring KataGo (fallback bot). To enable KataGo, see the
next section.

## Configuring KataGo

> **KataGo is NOT in the Ubuntu repositories** (`apt install katago` fails). You install it
> by downloading a precompiled binary from GitHub. On CPU (no GPU) you use the
> **Eigen** build; on modern processors, the **eigenavx2** variant is faster.

### Quick option: script

```bash
bash scripts/install-katago.sh
```

Downloads the CPU build (eigenavx2) of KataGo v1.16.4 and a model, places them in
`/opt/katago` and prints the environment variables to add to your `.env.local`.

### Manual option

1. **Binary** (CPU, AVX2) — [KataGo releases](https://github.com/lightvector/KataGo/releases):

   ```bash
   cd /opt && sudo mkdir -p katago && cd katago
   sudo wget https://github.com/lightvector/KataGo/releases/download/v1.16.4/katago-v1.16.4-eigenavx2-linux-x64.zip
   sudo apt install unzip -y && sudo unzip katago-v1.16.4-eigenavx2-linux-x64.zip
   ./katago version
   ```

   If it throws `Illegal instruction`, use the `katago-v1.16.4-eigen-linux-x64.zip`
   build (compatible with any CPU).

2. **Model** (neural network):

   ```bash
   sudo mkdir -p /opt/katago/models && cd /opt/katago/models
   sudo wget https://github.com/lightvector/KataGo/releases/download/v1.4.5/g170e-b20c256x2-s5303129600-d1228401921.bin.gz
   ```

   To use **less RAM** (recommended on laptops), use a smaller net
   (b10 or b6): on 9×9 it plays more than well enough, and there are some on the
   networks page at [katagotraining.org](https://katagotraining.org/networks). Large nets
   (b20, b40) play stronger but use much more memory.

3. **Environment variables** (copy `.env.example` to `.env.local`):

   ```
   KATAGO_BIN=/opt/katago/katago
   KATAGO_MODEL=/opt/katago/models/g170e-b20c256x2-s5303129600-d1228401921.bin.gz
   KATAGO_CONFIG=/path/to/repo/katago-config/analysis.cfg
   ```

   The `katago-config/analysis.cfg` file ships with the repo with base values for CPU/9x9.

4. Restart `npm run dev` (or the app in production). In the panel you should see the
   opponent is now **KataGo** instead of the fallback bot.

### Difficulty

Strength is controlled by KataGo's number of *visits* per move
(`src/lib/go/remoteEngine.ts`):

| Level  | visits | Notes                                   |
|--------|--------|-----------------------------------------|
| Easy   | 8      | fast and accessible                     |
| Medium | 80     | balanced                                |
| Hard   | 600    | strong; more CPU and a few seconds/move |

Tune these numbers to taste depending on your Hetzner's power.

## Structure

```
src/
  app/
    layout.tsx            base html (ca) and metadata
    page.tsx              main page (client)
    globals.css           styles (dark wood theme, modern)
    aprendre/page.tsx     interactive tutorial page
    api/move/route.ts     API: receives the game and returns KataGo's move
    api/hint/route.ts     API: recommended move + evaluation (hint)
    api/engine/route.ts   API: checks whether KataGo is available
  components/
    GoBoard.tsx           interactive SVG board (stones, hover, hint)
    GamePanel.tsx         engine, difficulty, hint, captures, result, controls
    Tutorial.tsx          interactive tutorial (lessons + validation)
  hooks/
    useGoGame.ts          orchestrates the game, the machine's turn and hints
  lib/go/
    types.ts              types (Player, Move, Score…)
    board.ts              board engine: groups, captures, ko, suicide, history
    scoring.ts            area scoring + komi
    engine.ts             GoEngine interface + heuristic bot (fallback)
    remoteEngine.ts       KataGo client (implements GoEngine) + difficulty + hints
    vertex.ts             internal point ↔ GTP vertex conversion ("E5")
    lessons.ts            tutorial lesson content
  server/
    katago.ts             manager of the `katago analysis` process (server only)
katago-config/
  analysis.cfg            base analysis-engine config
```

The rules logic (`lib/go`) does not depend on React and can be tested in isolation.

## How it talks to KataGo

The app uses KataGo's **analysis engine** (`katago analysis`), not GTP:
it is *stateless*, so every move sends the whole game and asks for the best
move with a *visits* limit. This avoids managing state or desyncs,
and lets you change difficulty move by move. `src/server/katago.ts` keeps a
single KataGo process and queues queries by `id`.

## Deployment to Hetzner (CloudPanel + PM2 + GitHub Actions)

Same pattern as ScribaAI: **standalone** build served with **PM2** behind the
CloudPanel proxy, and **automatic deployment** on every `push` to `main`.

Repo files: `next.config.mjs` (`output: "standalone"`), `ecosystem.config.js`
(PM2), `deploy.sh` (build + PM2) and `.github/workflows/deploy.yml` (CI/CD).

### Server preparation (one-time)

1. **CloudPanel:** create a *Node.js Site* for the domain (e.g. `gomini.elclic.net`),
   Node 22, and note the assigned **App Port**. Site user: `gomini` (always
   connect over SSH as this user).
2. **Node 22 + PM2** via nvm (no root):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   source ~/.nvm/nvm.sh && nvm install 22 && nvm alias default 22
   npm install -g pm2
   ```
3. **Clone the repo** into the site folder (public repo → HTTPS):
   ```bash
   cd ~/htdocs/gomini.elclic.net
   find . -mindepth 1 -delete
   git clone https://github.com/carlesmelgarejo/gomini.git .
   ```
4. **`.env.local`** (not in the repo). At minimum the port; KataGo is optional
   (without it, the app plays with the fast bot):
   ```
   PORT=<site App Port>
   # Optional, only if you install KataGo on the server:
   # KATAGO_BIN=/opt/katago/katago
   # KATAGO_MODEL=/opt/katago/models/....bin.gz
   # KATAGO_CONFIG=/home/gomini/htdocs/gomini.elclic.net/katago-config/analysis.cfg
   ```
5. First manual deployment: `bash deploy.sh`.
6. **SSL** Let's Encrypt from CloudPanel. The CloudPanel proxy already redirects
   to `PORT`; no need to touch `client_max_body_size` (there are no large uploads).
7. **PM2 persistence:** `pm2 save` (done by `deploy.sh`) + `pm2 startup` if you want
   resurrection on reboot.

### Automatic deployment (GitHub Actions)

1. **Dedicated deployment SSH key** (as user `gomini`):
   ```bash
   ssh-keygen -t ed25519 -f ~/deploy_key -N ""
   cat ~/deploy_key.pub >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys
   cat ~/deploy_key   # the PRIVATE key → GitHub secret
   ```
2. **Repo secrets** (Settings → Secrets and variables → Actions):
   - `SSH_HOST`: server IP · `SSH_USER`: `gomini` · `SSH_PORT`: `22`
   - `SSH_KEY`: contents of the **private** key (`~/deploy_key`)
   - `PROJECT_DIR`: `/home/gomini/htdocs/gomini.elclic.net`
3. From then on, every `push` to `main` deploys on its own (SSH in, runs
   `git reset --hard origin/main` and `bash deploy.sh`). It can also be triggered
   manually from the *Actions* tab.

> The workflow **contains no secrets** (they live in GitHub Secrets). `.env.local` is in
> `.gitignore` and is never touched during deployment.

## No indexing

`src/app/robots.ts` blocks all crawlers and the metadata in `layout.tsx`
includes `robots: { index: false, follow: false }`, so GoMini is **not indexed**.

## KataGo on the server (optional)

KataGo is NOT required to deploy: without the `KATAGO_*` variables, the app plays with
the fast bot. If you want KataGo in production, install it on the server (CPU/Eigen +
small model) and set the `KATAGO_*` variables in `.env.local`. Keeping a KataGo process
alive uses memory and CPU; on 9×9 with a small model it is manageable.
