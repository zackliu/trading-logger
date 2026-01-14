# Trading Logger (Local-first)

A local trading journal + analytics tool built with Fastify + SQLite + React.

## Prerequisites
- Node.js 20+
- npm 10+ (comes with Node 20)

## Setup
```bash
npm install
```

## Development
Runs API (Fastify) on port 4000 and web (Vite) on port 5173.
```bash
npm run dev
```

## Build
```bash
npm run build
```

## Use
```
http://localhost:5173/
```

Frontend uses `VITE_API_BASE` (defaults to `http://localhost:4000/api`).

## Analytics calculations
- Total/Wins/Losses/Breakeven: counts of trades where `result` is takeProfit/stopLoss/breakeven, or `r_multiple` > 0 / < 0 / = 0.
- Win Rate: `wins / total`.
- Profit Factor: `sum(positive r_multiple) / |sum(negative r_multiple)|` (shown as `-` if either side is missing/zero).
- Expectancy (Avg R): average of `r_multiple` across all trades.
- Avg Win R / Avg Loss R: average `r_multiple` for winning and losing trades respectively.
- Payoff Ratio: `Avg Win R / |Avg Loss R|` (shown as `-` if either side is missing/zero).

## Database & migrations
- SQLite database lives at `data/app.db` (created on first run).
- Migrations are SQL files in `apps/server/drizzle/migrations`.
- The server automatically runs pending migrations on start.
- Manual run: `npm run migrate`

## Seeding
Optional sample tags/custom fields:
```bash
npm run seed
```

## Uploads
- Uploaded images are stored under `data/uploads`.
- Files are served at `http://localhost:4000/uploads/<filename>`.

## Project structure
- `apps/server`: Fastify API, Drizzle ORM, migrations, analytics.
- `apps/web`: React + Vite frontend with TanStack Query.
- `packages/shared`: Shared Zod schemas & types used by both.
