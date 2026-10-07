# StrangrLoop — strangrloop.chat

**Random chats. Real connections.** An interest-based random stranger chat platform: meet a random person, discover shared interests, talk — and optionally turn it into a lasting connection.

> Random chat → Connections → Groups → Communities → Forum → Networking

---

## What's inside (V1)

- **Onboarding** — 18+ age gate, display name (never real identity), gender, country, languages, 3–10 interests, matching preferences
- **Scoring-based matching** — shared interests +20, shared language +20, age compatibility +15, gender preference +20, conversation style +15, country +10 — with a 5-level fallback ladder so nobody sits on "no one found"
- **Chat** — real-time text UI, shared-interest icebreakers, typing indicators, **Next** (instant re-queue), **Connect** (mutual opt-in), **Report** (9 anonymous categories), **Block**
- **Connections** — mutual connects persist; say hi again later, all inside the platform
- **Profile & Settings** — preferences, notifications, privacy toggles, blocked-users management, safety center, account deletion
- **Auth** — Google OAuth + email/password via [Supabase Auth](https://supabase.com) when configured, with a zero-setup **demo auth** fallback
- **Safety by default** — link filtering, anonymous reporting, age bracket only (no birthdays), content guidelines

> **Note on the live layer:** the app ships with two modes. Without `VITE_SERVER_URL` it runs as a static frontend backed by a local simulation engine (`src/engine.ts`). Set `VITE_SERVER_URL` (or use the Docker image, which serves both) to switch matching + chat to **real people** via the bundled server (`server/`) — Fastify REST + Socket.IO matching/chat/moderation with SQLite persistence through Node's built-in `node:sqlite` (zero native dependencies).

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000 — demo simulation mode
```

The app runs immediately in **demo auth** mode — no keys, no server, no signup friction. Create an account with any email/password, or continue as guest.

## Run the live server (real people, real-time)

```bash
cd server
npm install
npm run dev        # REST + websockets on http://localhost:8787
```

Then start the frontend pointed at it:

```bash
# repo root, .env:
VITE_SERVER_URL=http://localhost:8787
npm run dev
```

Verify the full pipeline (profile → match → chat → connect) against a running server:

```bash
cd server && npm run smoke
```

Server environment variables: see `.env.example`. Highlights — `CLIENT_ORIGIN` (allowed browser origins), `SUPABASE_JWT_SECRET` (enables real token verification; empty = demo tokens for local dev only), `ADMIN_TOKEN` (enables `/admin/*`), `STATIC_DIR` (serve a built frontend from the same process), `TRUST_PROXY`, `DATABASE_PATH`.

## One-container deploy (Docker)

Builds the SPA and server, serves everything from one Node 24 process on :8787 — same-origin websockets, no CORS juggling:

```bash
docker compose up --build     # → http://localhost:8787
```

Data persists in the `strangrloop-data` volume; healthchecks hit `/health`.

## Environment variables

All config lives in `.env` (copy `.env.example`):

| Variable               | Required | Purpose                                                        |
| ---------------------- | -------- | -------------------------------------------------------------- |
| `VITE_APP_NAME`        | no       | Display name (default `StrangrLoop`)                           |
| `VITE_APP_URL`         | no       | Public URL, used as the OAuth redirect target                  |
| `VITE_SERVER_URL`      | no       | Live server URL — switches matching/chat from simulation to real people |
| `VITE_SUPABASE_URL`    | optional | Enables real auth (Google OAuth + email/password)              |
| `VITE_SUPABASE_ANON_KEY` | optional | Enables real auth                                            |
| `VITE_ENABLE_DEMO_AUTH`| no       | `true` (default) allows browser-local demo accounts & guest mode |

**Auth modes**

- `VITE_SUPABASE_*` empty → **demo auth**: accounts stored in the browser, guest mode available. Perfect for local dev and demos.
- Both set → **live auth**: Supabase sessions, Google OAuth button works, email confirmation respected.

## Auth setup (Supabase + Google OAuth, ~5 min)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. **Authentication → Providers → Google → Enable.**
3. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an OAuth client (Web application) and add Supabase's callback as an authorized redirect URI:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
4. Paste the Google client ID/secret into the Supabase Google provider settings.
5. Copy your **Project URL** and **anon public key** (Supabase → Project Settings → API) into `.env`.
6. (Optional) Add `https://strangrloop.chat` (and `http://localhost:3000` for dev) to Supabase → Authentication → URL Configuration → Redirect URLs.
7. Restart `npm run dev` — the auth screen switches to **live auth** automatically.

## Build & deploy

```bash
npm run build      # outputs static site to dist/
```

**Option A — full stack (recommended):** `docker compose up --build` serves the SPA + API + websockets from one container on :8787.

**Option B — static frontend only:** host `dist/` anywhere (Vercel / Netlify / GitHub Pages — the included workflow deploys to Pages on push to `main`) and run `server/` separately; set `VITE_SERVER_URL` at build time to its public URL and add that origin to the server's `CLIENT_ORIGIN`.

Remember to set `VITE_APP_URL` to the deployed origin so Google OAuth redirects land correctly. For production auth, set `SUPABASE_JWT_SECRET` on the server so tokens are actually verified — demo-token mode is for local development only.

## Push to GitHub

From the project root:

```bash
git init
git add .
git commit -m "StrangrLoop v1 — interest-based stranger chat"

# Option A: GitHub CLI
gh repo create strangrloop --private --source=. --remote=origin --push

# Option B: manually (create an empty repo on github.com first, no README)
git remote add origin git@github.com:YOUR_USERNAME/strangrloop.git
git branch -M main
git push -u origin main
```

`.env` is git-ignored — your Supabase keys never leave your machine or CI secrets.

## Project structure

```
src/                  # frontend (React + Vite + Tailwind 4)
  config.ts            # env-driven app configuration
  auth.ts              # Supabase Auth + demo fallback (single API)
  types.ts             # shared types
  data.ts              # interests, personas, starters, guidelines
  engine.ts            # local matching simulation (demo mode)
  live.ts              # live-server socket layer (real mode)
  store.tsx            # per-user persisted global state + auth subscription
  components/
    ui.tsx             # icon set, logo, modal, toasts…
    PrefsEditor.tsx    # shared matching-preferences editor
  screens/
    Auth.tsx           # sign in / sign up / Google / guest
    Onboarding.tsx     # age gate → identity → languages → interests → prefs
    Home.tsx           # matching console + queue board
    MatchFlow.tsx      # searching radar + "you're connected"
    Chat.tsx           # chat, next, connect, report, block
    Connections.tsx    # mutual connections
    Profile.tsx        # editable identity
    Settings.tsx       # prefs, notifications, privacy, session, delete

server/               # live backend (Fastify + Socket.IO + node:sqlite)
  src/
    index.ts           # bootstrap, static SPA serving, graceful shutdown
    config.ts          # env config + wire types shared with the client
    db.ts              # SQLite persistence (WAL) — zero native deps
    auth.ts            # bearer-token identity (Supabase JWT or demo)
    matching.ts        # scoring engine + queue + fallback ladder
    moderation.ts      # content rules, rate limits, anti-abuse janitor
    sockets.ts         # realtime: queue, chat relay, connect, reports
    routes.ts          # REST: profile, connections, blocks, reports, admin
  scripts/
    smoke.mjs          # end-to-end lifecycle test (`npm run smoke`)
```

## Roadmap (designed for, not built)

- **V2** — friend profiles, presence, direct messaging, notifications
- **V3** — interest groups with moderators and discovery
- **V4** — forum (posts, votes, tags) closing the loop: conversation → connection → group → discussion → community

## Safety

18+ only · no real names/emails/locations exposed · anonymous reporting · one-tap blocking · safety features are never paywalled.
