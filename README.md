# League of Coders — frontend

Real-time coding battles. Create a lobby, share the invite link, and race your friends through the same set of
LeetCode problems with live, verified scoring.

Stack: Vite · React 18 · React Router 6 · Tailwind CSS · socket.io-client · Monaco editor.

## Run locally

```bash
cp .env.example .env        # point VITE_API_URL at your backend
npm install
npm run dev                 # http://localhost:5173
npm run build               # production build in ./build
```

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend base URL (defaults to the Render deployment) |
| `VITE_GOOGLE_CLIENT_ID` | Optional. Enables "Continue with Google" (must match backend `GOOGLE_CLIENT_ID`) |
| `VITE_HASH_ROUTER` | `true` for static hosts without SPA rewrites (GitHub Pages). Invite links become `/#/m/CODE` |

Netlify (`public/_redirects`) and Vercel (`vercel.json`) rewrites are included so invite links like
`https://your-site/m/ABC123` work on refresh.

## Pages

- **Compete** (`/`) — hero with create / join-by-code, your active battles, open public lobbies, live battles to
  spectate, top players and recent results.
- **New battle** (`/new`) — duration, Easy/Medium/Hard mix, question pool, topic filter, max players, visibility.
- **Battle room** (`/m/:code`) — the invite link target. One URL that moves through lobby → countdown → arena → results.
  - Lobby: players with online presence, host controls (edit settings, remove players, start), per-player
    "skip problems I've solved" toggle, invite link/code/share, chat.
  - Arena: timer, problem list with live "worth now" points, the problem statement rendered in-site, a Monaco
    scratchpad with LeetCode starter code, live scoreboard and chat. Spectators see everything read-only.
  - Results: podium, per-problem solve times and points, rating changes, rematch, share to community.
- **Practice** (`/practice`) — the same problem bank battles draw from, with filters and solved tracking.
- **Leaderboard**, **Community** (posts, likes, comments), **Profile** (`/u/:id`, LeetCode linking and history).

## Sharing, analytics and SEO

- Share links use `/s/...` paths (battle, result, profile, challenge). Netlify (`public/_redirects`) and Vercel
  (`vercel.json`) proxy `/s/*`, `/og/*` and `/sitemap.xml` to the API, which serves preview tags and images.
  Links carry `?ref=<username>` so sign-ups credit the sharer.
- Analytics: set `VITE_POSTHOG_KEY` to turn on PostHog. Events include `signup_completed`, `leetcode_linked`,
  `match_created`, `match_joined`, `match_finished`, `share_clicked`, `challenge_created`, `quick_play`.
- Static landing pages for search live in `public/<slug>/index.html` and are listed in the sitemap.
  Problem pages are marked `noindex` because their text is LeetCode's.

## Why problems open on LeetCode

LeetCode forbids embedding (`X-Frame-Options: SAMEORIGIN`) and doesn't offer a public judge. So the statement and
starter code are shown inside the arena, players submit on LeetCode, and the backend reads their public accepted
submissions to score them. See the backend README for the exact rules.
