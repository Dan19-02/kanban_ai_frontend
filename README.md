# TranscribeBoard — Meeting to Kanban AI

Turn meeting transcripts into shared, real-time Kanban boards. Paste a
transcript and Gemini extracts a summary, key decisions, sentiment, and a set of
assignable action items. Boards are private to your account and can be shared
with teammates via a link, with live collaboration over WebSockets.

## Features

- **Accounts** — email/password auth with hashed passwords and httpOnly session cookies.
- **Persistent boards** — every board, action item, and comment is stored in PostgreSQL.
- **AI analysis** — Google Gemini turns a transcript into summary, decisions, sentiment, and action items.
- **Real-time collaboration** — changes sync instantly to everyone on a board, with live presence.
- **Sharing & roles** — owners can generate a share link granting *edit* or *view* access, and manage members.
- **Exports** — download action items as Trello- or Jira-compatible CSV.
- **Plans & metered billing** — 3 free transcriptions, then Stripe subscriptions ($10 / $30 / $99 per month) with per-plan transcription quotas enforced server-side.

## Tech stack

| Layer     | Choice                                            |
| --------- | ------------------------------------------------- |
| Frontend  | React 19, Vite, Tailwind CSS 4, React Router      |
| Backend   | Express, Socket.IO                                |
| Database  | PostgreSQL via Prisma ORM                         |
| Auth      | bcrypt + JWT in httpOnly cookies                  |
| AI        | Google Gemini (`@google/genai`)                   |
| Payments  | Stripe subscriptions (Checkout + Billing Portal)  |

## Architecture

```
server/
  index.ts              # app assembly: security, routes, realtime, static serving
  env.ts                # validated environment config (fails fast if misconfigured)
  prisma.ts             # shared Prisma client
  auth/                 # password hashing, JWT, cookies, auth middleware
  middleware/           # rate limiters
  routes/               # /api/auth, /api/boards, /api/billing REST handlers
  services/             # board access, Gemini analysis, plans, Stripe billing
  realtime/             # authenticated Socket.IO + board broadcasts
  validation.ts         # zod request schemas
prisma/
  schema.prisma         # data model
  migrations/           # SQL migrations
src/                    # React frontend (pages, components, hooks, API client)
```

Mutations go through authenticated REST endpoints (validated + authorized), then
the server broadcasts the updated board state to everyone in that board's room.

## Prerequisites

- Node.js 20+
- A PostgreSQL database (use the bundled Docker setup, or any hosted Postgres)
- A Google Gemini API key (optional — the app runs without it, minus AI analysis)

## Quick start (local development)

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Configure environment
cp .env.example .env
#    Edit .env: set JWT_SECRET (openssl rand -base64 48) and, optionally, GEMINI_API_KEY.
#    The default DATABASE_URL matches the Docker database below.

# 3. Start PostgreSQL (requires Docker)
docker compose up -d

# 4. Apply the database schema
npm run db:deploy        # or: npm run db:migrate  (for an interactive dev migration)

# 5. Run the app
npm run dev
```

Open http://localhost:3000, create an account, and create your first board.

> No Docker? Point `DATABASE_URL` at any Postgres instance (e.g. a free
> [Neon](https://neon.tech) or [Supabase](https://supabase.com) database) and run
> `npm run db:deploy`.

## Environment variables

| Variable         | Required | Description                                                        |
| ---------------- | -------- | ------------------------------------------------------------------ |
| `DATABASE_URL`   | yes      | PostgreSQL connection string.                                      |
| `JWT_SECRET`     | yes      | Secret for signing session tokens (≥ 32 chars, random).            |
| `GEMINI_API_KEY` | no       | Google Gemini key. Without it, AI analysis returns a clear error.  |
| `NODE_ENV`       | no       | `development` (default) or `production`.                           |
| `PORT`           | no       | Defaults to `3000`.                                                |
| `APP_URL`        | no       | Public URL; used for share links, Stripe redirects, and CORS.      |
| `STRIPE_SECRET_KEY`     | no | Enables paid plans. Without it, only the free tier works.      |
| `STRIPE_WEBHOOK_SECRET` | no | Signing secret for the `/api/billing/webhook` endpoint.        |
| `STRIPE_PRICE_*`        | no | Price IDs for the Starter / Pro / Unlimited monthly plans.     |

## Database scripts

```bash
npm run db:migrate    # create & apply a migration in development
npm run db:deploy     # apply existing migrations (use in production/CI)
npm run db:generate   # regenerate the Prisma client after schema changes
npm run db:studio     # open Prisma Studio to inspect data
```

## Production build & deploy

```bash
npm run build         # generates Prisma client, builds the frontend, bundles the server
npm run db:deploy     # apply migrations to the production database
npm start             # serves the built app on $PORT
```

The production server serves the built frontend from `dist/` and the API from the
same origin, so no separate web server is required.

Deployment checklist:

- Set `NODE_ENV=production`, a strong `JWT_SECRET`, the production `DATABASE_URL`, and `APP_URL`.
- Run behind HTTPS — auth cookies are `Secure` in production and the app sends HSTS.
- `npm run db:deploy` as part of your release step.

## Billing & plans

A **transcription** = one AI analysis of a transcript (`POST /api/boards/:id/analyze`).
Quotas are enforced server-side before the AI is ever called.

| Plan      | Price      | Transcriptions      |
| --------- | ---------- | ------------------- |
| Free      | $0         | 3 total (lifetime)  |
| Starter   | $10 / mo   | 30 per month        |
| Pro       | $30 / mo   | 100 per month       |
| Unlimited | $99 / mo   | Unlimited           |

- Subscriptions use **Stripe Checkout** (hosted) and the **Billing Portal** for upgrades/cancellation.
- The user's plan, status, and period are kept in sync via Stripe webhooks at
  `/api/billing/webhook`. Paid-plan usage resets when the billing period renews;
  the free allowance is a one-time lifetime count.
- The app runs fine **without** Stripe configured — paid upgrades are disabled and
  the free tier is still enforced.

> **Provider note:** Stripe makes *you* the merchant of record, so you're
> responsible for collecting/remitting sales tax/VAT/GST as you scale. If you'd
> rather offload that, a Merchant-of-Record such as **Lemon Squeezy** or **Paddle**
> is a drop-in alternative — billing is isolated in `server/services/billing.ts`.

### Local testing with Stripe

```bash
# 1. Put your test-mode keys + price IDs in .env (see .env.example)
# 2. Forward webhooks to your local server:
stripe listen --forward-to localhost:3000/api/billing/webhook
#    Copy the printed signing secret into STRIPE_WEBHOOK_SECRET, then restart.
# 3. Use Stripe's test card 4242 4242 4242 4242 at checkout.
```

## Security notes

- Passwords are hashed with bcrypt (cost 12); login responses are constant-time
  to avoid user enumeration.
- Sessions are stateless JWTs stored in `httpOnly`, `SameSite=Lax` cookies
  (`Secure` in production).
- Every board request is authorized by role (owner / editor / viewer); the
  Socket.IO handshake is authenticated from the same cookie.
- Security headers via Helmet (CSP, HSTS, etc.); rate limiting on auth and AI endpoints.
- All request bodies are validated with zod.
