# StrangrLoop — strangrloop.chat

**Random chats. Real connections.** An interest-based random stranger chat platform: meet a random person, discover shared interests, talk — and optionally turn it into a lasting connection.

> Random chat → Connections → Groups → Communities → Forum → Networking

---

## What's inside

**Client (this repo root — Vite + React + Tailwind v4)**
- Sign-in / sign-up with **Google OAuth + email/password** (Supabase Auth), browser-local **demo auth** + guest mode when no keys are set
- Onboarding: 18+ age gate, display name, gender, country, languages, 3–10 interests, matching preferences
- Scoring-based matching with a 5-level fallback ladder, live radar search, "you're connected" intro
- Chat with shared-interest icebreakers, **Next**, mutual **Connect**, anonymous **Report** (9 categories), **Block**
- Connections, editable profile, settings (preferences, notifications, privacy, blocked users, session, delete account)
- Error boundary, localStorage persistence, env-driven config

**Server (`server/` — Fastify + Socket.IO + SQLite)**
- Real-time matching queue with the same scoring algorithm + level ladder
- Chat relay with per-user rate limiting (token bucket), link/pattern moderation, risk levels, flood + repeat-spam detection
- Sessions, messages, connections, blocks, reports persisted in SQLite (WAL)
- REST API: profile, preferences, connections, reports, blocks, live stats
- Admin endpoints (token-gated): stats, users, reports with moderation actions

---

## Run it for real (two terminals)

**1. Start the server**
```bash
cd server
npm install
npm run dev          # → http://localhost:8787 (API + WebSockets + /admin)
```
No config needed for local dev — it creates `strangrloop.db` automatically and accepts the client's demo-auth tokens.

**2. Start the client pointed at it**
```bash
# repo root — create .env from .env.example, then:
echo "VITE_SERVER_URL=http://localhost:8787" >> .env
npm install
npm run dev          # → http://localhost:3000
```
Open **two browsers** (or two private windows), sign in as two different users, hit **FIND SOMEONE** in both — you'll be matched with each other over real WebSockets.

Without `VITE_SERVER_URL` the client runs in **demo mode**: fully functional, with a local simulation standing in for other people (clearly labeled in the UI).

## Auth setup (Supabase + Google, optional but recommended)

1. Create a project at [supabase.com](https://supabase.com).
2. **Authentication → Providers → Google → Enable**, using an OAuth client from the Google Cloud Console with redirect URI:
   `https://<project-ref>.supabase.co/auth/v1/callback`
3. Put **Project URL** + **anon key** into the client `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4. For the **server** to verify those tokens, set `server/.env`:
   ```
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_JWT_SECRET=<Project Settings → API → JWT Settings → JWT Secret>
   ```
   Without it the server stays in demo-auth mode (dev only).

## Environment reference

| Where | Variable | Purpose |
|---|---|---|
| client `.env` | `VITE_APP_NAME`, `VITE_APP_URL` | Identity + OAuth redirect target |
| client `.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Real auth (empty → demo auth) |
| client `.env` | `VITE_ENABLE_DEMO_AUTH` | `false` disables guest/demo accounts |
| client `.env` | `VITE_SERVER_URL` | Live server URL (empty → simulation) |
| `server/.env` | `PORT`, `CLIENT_ORIGIN` | Listen port + allowed CORS origins |
| `server/.env` | `DATABASE_PATH` | SQLite file location |
| `server/.env` | `SUPABASE_URL`, `SUPABASE_JWT_SECRET` | Token verification |
| `server/.env` | `ADMIN_TOKEN` | Unlocks `/admin/*` endpoints |

## Deploy

| Piece | Where | Notes |
|---|---|---|
| Client | Vercel / Netlify / GitHub Pages | Static build (`npm run build` → `dist/`). Pages uses the included workflow (`.github/workflows/deploy.yml`) which auto-sets the base path — just enable Pages → Actions. Set env vars in the host dashboard. |
| Server | Fly.io / Render / Railway / any VPS | `npm start` in `server/`. Persist the SQLite file on a volume or switch `db.ts` to Postgres later. Set `CLIENT_ORIGIN` to your deployed client origin(s). |

```bash
# client example (Vercel auto-detects Vite):
VITE_SERVER_URL=https://api.strangrloop.chat  VITE_SUPABASE_URL=…  VITE_SUPABASE_ANON_KEY=…

# server example (Render/Fly):
PORT=8787 CLIENT_ORIGIN=https://strangrloop.chat SUPABASE_JWT_SECRET=… ADMIN_TOKEN=…
```

## Push to GitHub

```bash
git init && git add . && git commit -m "StrangrLoop v1 — client + real-time server"

gh repo create strangrloop --private --source=. --remote=origin --push
# or manually:
git remote add origin git@github.com:YOUR_USERNAME/strangrloop.git
git branch -M main && git push -u origin main
```
`.env` files are git-ignored — secrets never leave your machine or CI.

## Admin API (server)

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:8787/admin/stats
curl -H "Authorization: Bearer $ADMIN_TOKEN" "http://localhost:8787/admin/users?q=mid"
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:8787/admin/reports
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"warn"}' http://localhost:8787/admin/reports/1
```

## Project structure

```
├── src/                     client
│   ├── config.ts            env-driven config (auth mode, server URL)
│   ├── auth.ts              Supabase Auth + demo fallback + server tokens
│   ├── live.ts              socket + REST client for the live server
│   ├── engine.ts            matching algorithm + local simulation
│   ├── store.tsx            state, persistence, auth subscription
│   ├── components/          design system, icons, prefs editor
│   └── screens/             Auth, Onboarding, Home, MatchFlow, Chat,
│                            Connections, Profile, Settings
├── server/                  real-time backend (Fastify + Socket.IO + SQLite)
│   └── src/  index · config · auth · db · matching · moderation · routes · sockets
└── .github/workflows/deploy.yml   GitHub Pages deployment
```

## Roadmap (designed for, not built)

- **V2** — friend profiles, presence, DMs, notifications
- **V3** — interest groups with moderators and discovery
- **V4** — forum (posts, votes, tags): conversation → connection → group → discussion → community

## Safety

18+ only · real names/emails/locations never exposed · anonymous reporting · one-tap blocking · automated moderation with human review · safety features are never paywalled.
