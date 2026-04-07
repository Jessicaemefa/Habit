# Habit & Task Tracker

A personal productivity dashboard for tracking daily habits, streaks, and to-do tasks — with cloud sync so your data follows you across devices.

---

## Features

- **Daily Habits** — set a daily goal, track progress, earn streaks, and hit milestones
- **Tasks / To-dos** — one-off checklist items that reset each day
- **Streak tracking** — current and best streaks with milestone badges
- **History & Insights** — 48-hour activity log, calendar heat map, and completion stats
- **Cloud sync** — data saved to Redis on every change; loads from cloud on login
- **Name-based login** — no password, just your name; data is keyed to you
- **Dark / light mode** — system-aware with a manual toggle
- **PWA ready** — installable on mobile, works offline via localStorage fallback
- **Smooth animations** — items slide and fade left when completed

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Redis (Redis Cloud) |
| Deployment | Vercel |
| Analytics | Vercel Analytics |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Jessicaemefa/Habit.git
cd Habit
npm install
```

### 2. Set up Redis

Create a free database at [Redis Cloud](https://redis.com/try-free/) and copy your connection string.

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
REDIS_URL="redis://default:<password>@<host>:<port>"
```

Or if you're deploying to Vercel, add `REDIS_URL` via:

```bash
npx vercel env add REDIS_URL
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

Push to GitHub — Vercel auto-deploys on every commit. Make sure `REDIS_URL` is set in your Vercel project's environment variables (Production + Preview + Development).

---

## Project Structure

```
src/
├── app/
│   ├── api/data/        # Redis GET/POST route
│   ├── history/         # History & insights page
│   └── page.tsx         # Today dashboard
├── components/
│   ├── Dashboard.tsx    # Main habits + tasks view
│   ├── HabitCard.tsx    # Individual habit card
│   ├── TaskItem.tsx     # Individual task row
│   ├── HistoryPage.tsx  # History page component
│   ├── LoginScreen.tsx  # Name-only login form
│   ├── AppShell.tsx     # Login gate wrapper
│   └── AppHeader.tsx    # Top navigation bar
├── context/
│   └── UserContext.tsx  # Username state + login/logout
├── lib/
│   ├── tracker-storage.ts  # localStorage read/write + parsing
│   ├── cloud-sync.ts       # loadFromCloud / saveToCloud
│   ├── habit-progress.ts   # Daily progress logic
│   └── completion-stats.ts # Weighted completion %
└── types/
    └── tracker.ts       # Shared TypeScript types
```

---

## How Data Persistence Works

1. On first visit — enter your name to create your profile
2. On login — your data loads from Redis into the app
3. On every change — saved to `localStorage` immediately, then synced to Redis after a 3-second debounce
4. If Redis is unavailable — `localStorage` acts as a silent fallback; nothing breaks

Data is keyed by your name (`ht:<name>`) so different users on the same device stay separate.
