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
