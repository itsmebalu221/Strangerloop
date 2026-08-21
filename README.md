# StrangrLoop — strangrloop.chat

**Random chats. Real wavelength.** An interest-based random stranger chat platform: meet a random person, discover shared interests, talk — and optionally turn it into a lasting connection.

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

> **Note on the live layer:** this build ships as a static frontend. The stranger queue, presence and chat partners are a local simulation engine (`src/engine.ts` + personas in `src/data.ts`) behind a clean matching interface — swap it for a WebSocket matching service + database to go fully live without touching the UI.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

The app runs immediately in **demo auth** mode — no keys, no server, no signup friction. Create an account with any email/password, or continue as guest.

## Environment variables

All config lives in `.env` (copy `.env.example`):

| Variable               | Required | Purpose                                                        |
| ---------------------- | -------- | -------------------------------------------------------------- |
| `VITE_APP_NAME`        | no       | Display name (default `StrangrLoop`)                           |
| `VITE_APP_URL`         | no       | Public URL, used as the OAuth redirect target                  |
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

The build is a plain static SPA — host `dist/` anywhere:

- **Vercel:** import the repo, framework preset "Vite", add the `VITE_*` env vars in the dashboard. Done.
- **Netlify:** build command `npm run build`, publish directory `dist`, add env vars under Site settings → Environment.
- **GitHub Pages / S3 / any static host:** upload `dist/`.

Remember to set `VITE_APP_URL` to the deployed origin so Google OAuth redirects land correctly.

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
src/
  config.ts            # env-driven app configuration
  auth.ts              # Supabase Auth + demo fallback (single API)
  types.ts             # shared types
  data.ts              # interests, personas, starters, guidelines
  engine.ts            # matching algorithm + conversation simulation
  store.tsx            # global state + persistence + auth subscription
  components/
    ui.tsx             # icon set, logo, modal, toasts, confetti…
    PrefsEditor.tsx    # shared matching-preferences editor
  screens/
    Auth.tsx           # sign in / sign up / Google / guest
    Onboarding.tsx     # age gate → identity → languages → interests → prefs
    Home.tsx           # matching console + live queue board
    MatchFlow.tsx      # searching radar + "you're connected"
    Chat.tsx           # chat, next, connect, report, block
    Connections.tsx    # mutual connections
    Profile.tsx        # editable identity
    Settings.tsx       # prefs, notifications, privacy, session, delete
```

## Roadmap (designed for, not built)

- **V2** — friend profiles, presence, direct messaging, notifications
- **V3** — interest groups with moderators and discovery
- **V4** — forum (posts, votes, tags) closing the loop: conversation → connection → group → discussion → community

## Safety

18+ only · no real names/emails/locations exposed · anonymous reporting · one-tap blocking · safety features are never paywalled.
