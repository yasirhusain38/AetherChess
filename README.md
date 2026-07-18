<<<<<<< HEAD
# Aether

**Play free. Scout deeper.**

Free-first chess platform: live scouting, Twin Bot, tournaments, clubs, unlimited tools.

## Quick start

```bash
cd "C:\Users\Mohd Yasir Husain\Downloads\Chess"
npm install
copy .env.example .env.local   # optional: add Google/Facebook keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy (GitHub + Vercel)

```powershell
# 1) Log in to GitHub (browser)
gh auth login --web

# 2) Create repo + push + deploy
powershell -ExecutionPolicy Bypass -File .\scripts\deploy.ps1
```

Or manually:

```bash
gh repo create aether-chess --public --source=. --remote=origin --push
npx vercel --prod
```

**Vercel env vars (required for production auth):**

| Variable | Value |
|----------|--------|
| `AUTH_SECRET` | Random long string (`openssl rand -base64 32`) |
| `AUTH_URL` | `https://your-app.vercel.app` |
| OAuth keys | Optional — from `.env.example` |

> Email/password accounts use a local `.data/users.json` file (fine for local). On Vercel’s serverless FS this is ephemeral — use **Google/GitHub OAuth** in production for durable sign-in.

### Auth (Sign up / Log in)

| Method | Works out of the box? |
|--------|------------------------|
| **Email + password** | Yes (stored in `.data/users.json`) |
| **Google** | After `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` |
| **Facebook** | After `AUTH_FACEBOOK_ID` / `AUTH_FACEBOOK_SECRET` |
| **GitHub, Discord, Apple, X** | Same — see [`.env.example`](.env.example) |

Pages: `/signup` · `/login` · header **Sign up / Log in** menu.

## Features

| Area | Details |
|------|---------|
| **Play** | Bots, Twin, Pass & Play, Chess960, ratings, promotion picker, game history |
| **Scout** | **Live Lichess + Chess.com** game pull (API proxies), demo fallback, Twin handoff |
| **Analyze** | PGN, saved games, eval bar, multi-PV minimax |
| **Train** | Coach plan, puzzles, Puzzle Storm |
| **Explore** | Opening book explorer |
| **Studies** | Local multi-chapter notebooks |
| **Events** | Bot gauntlet tournament (rated locally) |
| **Ladder** | Elo-style ratings + leaderboard |
| **Clubs** | Join/leave clubs, feed shell |
| **Watch** | Featured bot broadcast + party chat |
| **Settings** | Themes, sound, stats |

## API routes (server proxies)

- `GET /api/lichess/user/[username]`
- `GET /api/lichess/games/[username]?max=50`
- `GET /api/chesscom/player/[username]`
- `GET /api/chesscom/games/[username]?max=50`

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind 4 · chess.js

## Roadmap

1. WebSocket multiplayer matchmaking  
2. Stockfish WASM worker  
3. Auth + cloud sync  
4. Real club chat / Swiss human events  
=======
# AetherChess
AetherChess — The ultimate modern chess platform. Unlimited free analysis, AI opponent scouting, Twin Bots, personalized coaching &amp; beautiful interface. Open-source alternative that beats Chess.com + Lichess.
>>>>>>> 4135a7d38871bb09ea19867209fd44ae42120fa5
