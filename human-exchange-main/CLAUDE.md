# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session Start — READ THIS FIRST

At the start of every session, read all files in the CLAUDE_BRAIN folder before doing anything else:

```
C:\Users\david\Documents\HUMANEX\HUMANEX Brain\CLAUDE_BRAIN\
```

Files to read in order:
1. `LOAD_ME_FIRST.md` — context overview
2. `DAVID.md` — who you're working with
3. `AGENTS.md` — agent team and how to use them
4. `PROTOCOLS.md` — rules of engagement
5. `PROJECT_SNAPSHOT.md` — current technical state
6. `SESSION_LOG.md` — what happened in previous sessions

After reading, confirm to David: "Am citit CLAUDE_BRAIN. [one-line summary of current status + top blocker]"

## Commands

```bash
bun run dev          # Start development server (Vite)
bun run build        # Production build
bun run build:dev    # Build in development mode
bun run preview      # Preview production build locally
bun run lint         # ESLint (flat config, TypeScript + React)
bun run format       # Prettier (printWidth 100, double quotes, trailing commas)
```

No test suite is configured — there are no jest/vitest/playwright setups.

## Architecture

HUMANEX is a virtual stock exchange where users trade public figures (personalities) using HMX coins. It's a single-package TanStack Start (React meta-framework) app bundled by Vite and deployed on Cloudflare Workers, backed by Supabase (PostgreSQL + Realtime).

### Routing

File-based routing via TanStack Router. `src/routes/routeTree.gen.ts` is **auto-generated** — never edit it directly; it regenerates on `dev`/`build`.

| Route | File | Purpose |
|---|---|---|
| `/` | `src/routes/index.tsx` | Market page — list of all personalities with live prices |
| `/auth` | `src/routes/auth.tsx` | Sign in / Sign up |
| `/portfolio` | `src/routes/portfolio.tsx` | User holdings and transaction history |
| `/leaderboard` | `src/routes/leaderboard.tsx` | Top 10 users by net worth |
| `/p/:slug` | `src/routes/p.$slug.tsx` | Personality detail: chart, news, buy/sell |
| `POST /api/public/hooks/update-prices` | `src/routes/api/public/hooks/update-prices.ts` | Webhook: fetches YouTube subscriber counts and triggers price updates |

The root layout (`src/routes/__root.tsx`) wraps everything in `AuthProvider` + `Header` + `Toaster`.

### Data Flow

- **Supabase client** — `src/integrations/supabase/client.ts` uses `VITE_` prefixed env vars for browser-side access (public key only).
- **Supabase server client** — `src/integrations/supabase/client.server.ts` uses the service role key; only used inside TanStack Start server functions and API routes. Never import this on the client.
- **Real-time prices** — The market page subscribes to Supabase Realtime (`supabase.channel("market-personalities")`) listening for `UPDATE` events on the `personalities` table, updating price and `change_pct` in-memory.

### Price Movement Logic

Personality prices are driven by multiple signals, all coordinated in `src/lib/`:

- `algorithm.ts` — core price movement calculation
- `dailyPrice.ts` — daily price update with variance
- `reputationScore.ts` — aggregates cross-signal reputation
- `newsapi.ts` + `newsProcessor.ts` — keyword/phrase-based sentiment analysis on fetched news; hard-negative keywords (scandal, arrest, lawsuit) and positive phrases (breaks record, wins title) shift prices
- `wikipedia.ts` — Wikipedia page view trends as a secondary signal
- `trends.ts` — trending personalities logic
- `useMarketSimulation.ts` — dev-only React hook to simulate market updates locally

### Database Schema (Supabase)

Key tables (see `supabase/migrations/` for full schema):
- `profiles` — users with `balance` (HMX coins)
- `personalities` — tradable figures with `current_price`, `change_pct`, `youtube_channel_id`, `last_subscriber_count`
- `holdings` — user positions (`shares`, `avg_cost`)
- `price_history` — time-series price records
- `events` — personality events with `impact`
- `news_articles` — cached news with `sentiment`

Regenerate TypeScript types after schema changes: `supabase gen types typescript --local > src/integrations/supabase/types.ts`

### Key Conventions

- Path alias `@/*` maps to `src/*` (configured in `tsconfig.json` and Vite).
- UI components in `src/components/ui/` are shadcn/ui — modify them directly; don't replace with re-imports.
- Formatting: Prettier enforces `printWidth: 100`, double quotes, `trailingComma: "all"`. Run `bun run format` before committing.
- `SUPABASE_SERVICE_ROLE_KEY` and `YOUTUBE_API_KEY` must be set as Cloudflare Worker secrets for production — they are not in `.env`.
