# TranscribeBoard — Frontend

The React/Vite single-page app for **Meeting to Kanban AI**. Paste a meeting
transcript and the backend turns it into a shared, real-time Kanban board with a
summary, key decisions, sentiment, and assignable action items.

This repo is **frontend only**. The API, WebSockets, database, and AI live in the
separate backend repo (`meeting-to-kanban-ai-backend`) and are deployed as their
own service.

## Tech stack

| Layer    | Choice                                       |
| -------- | -------------------------------------------- |
| Frontend | React 19, Vite 6, Tailwind CSS 4, React Router 7 |
| Realtime | Socket.IO client                             |

## Architecture

```
src/
  api/client.ts     # typed REST client (talks to ${VITE_API_URL}/api)
  auth/             # auth context (session restored from the httpOnly cookie)
  components/       # board, kanban, comments, share, header, …
  hooks/            # useBoard (REST + Socket.IO live state), dark mode, media query
  pages/            # login, register, dashboard, board, billing
  types.ts          # shared API types
```

All API calls are same-origin `/api/*` in development (proxied to the backend by
Vite) and absolute `${VITE_API_URL}/api/*` in production.

## Local development

The frontend and backend run as two processes. Start the backend first (see its
README — it listens on `http://localhost:3000`), then:

```bash
npm install
npm run dev          # http://localhost:5173
```

`npm run dev` proxies `/api` and `/socket.io` to the backend (default
`http://localhost:3000`, override with `BACKEND_URL`). Because the browser only
talks to the dev origin, auth cookies are first-party and "just work" locally.

## Environment variables

| Variable       | When        | Description                                                       |
| -------------- | ----------- | ----------------------------------------------------------------- |
| `VITE_API_URL` | build (prod)| Backend origin, inlined into the bundle. Leave unset in dev.      |
| `BACKEND_URL`  | dev only    | Proxy target for `npm run dev`. Defaults to `http://localhost:3000`. |

> This app holds **no secrets**. Never put API keys or database URLs here — Vite
> bundles everything into the public client.

## Build

```bash
npm run build        # → dist/   (static files for any CDN/host)
npm run preview      # serve the production build locally
npm run typecheck    # tsc --noEmit
```

## Deploy on Render (Static Site)

This repo ships a `render.yaml` blueprint.

1. Deploy the **backend** first and note its URL (e.g. `https://kanban-ai-backend.onrender.com`).
2. Render Dashboard → **New → Blueprint** → select this repo.
3. Set **`VITE_API_URL`** to the backend URL when prompted (it is baked into the
   build), then deploy.

> **Cross-site cookie note:** `*.onrender.com` subdomains are on the Public Suffix
> List, so the frontend and backend are treated as *different sites*. Auth cookies
> are sent as `SameSite=None; Secure`, which Chrome allows but Safari blocks by
> default (third-party cookies). For reliable auth in all browsers, put both
> services behind one parent domain — e.g. `app.yourdomain.com` (this site) and
> `api.yourdomain.com` (backend) — and set `COOKIE_DOMAIN=.yourdomain.com` on the
> backend. Then cookies are first-party.
