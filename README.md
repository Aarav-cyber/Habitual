# 🔥 Habitual — Cycle-Based Habit Tracker

A full-stack, production-ready habit tracking app with AI coaching, cycle-based consistency tracking, gamification, and rich analytics.

---

## 🗂 Project Structure

```
habit-tracker/
├── backend/          # Node.js + Express + MongoDB API
│   ├── server.js     # Entry point + cron jobs
│   ├── routes.js     # All API routes
│   ├── models.js     # Mongoose schemas
│   ├── middleware.js # JWT auth middleware
│   └── .env          # Environment variables
└── frontend/         # React + Vite SPA
    └── src/
        ├── pages/    # Dashboard, Today, Analytics, Insights, Settings
        ├── components/ # HabitCard, HabitModal, CycleModal, Sidebar
        ├── context/  # AuthContext
        └── utils/    # Axios API client
```

---

## ⚡ Quick Start

### 1. Backend

```bash
cd backend
npm install
# Edit .env — add your ANTHROPIC_API_KEY for AI chat
npm run dev          # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173 hhshhs
```

---

## 🔑 Environment Variables (backend/.env)

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Your MongoDB Atlas URI |
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID |
| `JWT_SECRET` | Any long random string |
| `ANTHROPIC_API_KEY` | Get from console.anthropic.com |
| `PORT` | 5000 (default) |

---

## ✅ Features

### Core
- **Daily tracking** — Yes/No, Count, and Time-based habit types
- **Cycle system** — Each habit runs in monthly cycles with start/end dates
- **Auto-consistency** — When a cycle ends (via cron on the 1st), completed/total days are calculated and stored as history
- **Streak tracking** — Per-habit streak calculation
- **Schedule flexibility** — Custom days of the week per habit

### UI/UX
- **Dark mode** aesthetic with gradient accents
- **Progress bars**, **heatmap**, **area charts**, **radar charts**, **line charts**
- **Mood tracker** — log daily mood (1–5), visualized against habit completion
- **Animated** cards, FAB button, modals

### Gamification
- **XP system** — 10 XP per habit completion
- **Levels** — Level up every 500 XP
- **Badges** — Auto-awarded (First Step, On a Roll, Century)
- **Streak Freeze** — Use ❄️ to protect a streak on a missed day (3 given on signup)

### AI (requires ANTHROPIC_API_KEY)
- **Habit Coach chatbot** — Ask questions about your habits, get personalized advice
- **Pattern suggestions** — Heuristic-based warnings for habits below 40% consistency
- **Science-backed tips** — Built-in evidence-based habit guidance

### Analytics
- 30-day activity area chart
- Per-habit weekly bar chart
- Category radar chart
- Mood vs habit correlation line chart
- Cycle history consistency scores

---

## 🔄 Cycle System

1. When you create a habit, a cycle is auto-created for the current month.
2. Click **Cycles** on any habit card to see history or start a new cycle manually.
3. Every 1st of the month, a cron job:
   - Closes the active cycle and calculates `completedDays / totalDays` → `consistencyScore`
   - Opens a fresh cycle for the new month
4. Historical cycles are displayed as % cards in the Dashboard.

---

## 🚀 Deployment

### Backend (Railway / Render / Fly.io)
```bash
# Set env vars in the dashboard, then:
npm start
```

### Frontend (Vercel / Netlify)
```bash
npm run build
# Deploy the dist/ folder
# Set VITE_API_URL if backend is on a different domain
```

Update `vite.config.js` proxy → your deployed backend URL for production.

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Google OAuth login |
| GET | `/api/habits` | List all habits |
| POST | `/api/habits` | Create habit + first cycle |
| PATCH | `/api/habits/:id` | Update habit |
| DELETE | `/api/habits/:id` | Soft-delete habit |
| GET | `/api/cycles/:habitId` | List cycles for habit |
| POST | `/api/cycles/:habitId/new` | Close current cycle, open new |
| GET | `/api/entries` | List entries (with date filters) |
| POST | `/api/entries/toggle` | Toggle daily completion |
| POST | `/api/entries/freeze` | Use streak freeze |
| POST | `/api/mood` | Log mood |
| GET | `/api/analytics/overview` | All habits + streaks + cycle history |
| GET | `/api/analytics/heatmap` | Year heatmap data |
| GET | `/api/analytics/insights` | Consistency + weekly data |
| GET | `/api/ai/suggestions` | Heuristic habit suggestions |
| POST | `/api/ai/chat` | Claude AI habit coach chat |
