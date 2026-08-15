# Self Attendance

A full-stack calendar attendance tracker with attendance cards, a tap-to-mark month calendar, and automatic monthly percentages. Synced across every device via Firebase.

**Live site:** deploy this repo to Netlify (see below)

## Features

- 🔐 Email/Password + Google sign-in (Firebase Auth)
- 🃏 **Home list** — attendance cards (e.g. "clg") with a circular %, colored red/orange/green, plus search
- 🗓️ **Month calendar** — SUN–SAT grid, PREV / NEXT pills, swipe left/right to change month, today outlined
- 👆 **Tap a date** to mark: Present, Absent, Half Day, OverTime (with hours), Shift (soon), More Options → Holiday / Weekly Off / Leave (soon) / Note — and Clear
- 🎨 Cell coloring: Present = green cell, Absent = red cell, Half Day = orange cell, Holiday/Week Off/Leave = labels, OT = tinted cell
- 📊 **Monthly summary panel**: Present / Absent / Half Days / OT hours-days, percentage, and a More Info day-by-day detail
- 🔄 Cross-device sync via Firestore

## Tech stack

| Layer | Tool |
| --- | --- |
| Frontend | React 18 + Vite 4 + Tailwind CSS |
| Auth + DB | Firebase Auth + Cloud Firestore |
| Hosting | Netlify (static site only — no serverless functions) |

## Data model (Firestore)

```
users/{userId}                                # implicit, created on first sign-in
users/{userId}/cards/{cardId}                 # { name, createdAt }
users/{userId}/cards/{cardId}/attendance/{YYYY-MM-DD}
    # { status: "present" | "absent" | "half_day" | "overtime" | "holiday" | "weekly_off" | "leave",
    #   otHours: <number, only if overtime>, note: <string, only if note added> }
```

### Firestore security rules

**Firestore → Rules → Publish:**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Monthly percentage formula

```
(Present + Half Day × 0.5) ÷ (Present + Absent + Half Day) × 100
```

Holiday, Weekly Off, Leave, OT and unmarked days are excluded from the denominator.

## Getting started

### 1. Create a Firebase project

1. [Firebase Console](https://console.firebase.google.com) → **Add project** (e.g. `attendance-report`).
2. **Build → Authentication → Get started:**
   - Enable *Email/Password*.
   - Enable *Google* (choose your support email).
   - **Settings → Authorized domains**: add your Netlify domain, e.g. `https://your-site.netlify.app`. `localhost` is pre-allowed.
3. **Build → Firestore Database → Create database** (production mode). Publish the security rules above.

### 2. Register a web app and copy the config

Project settings **⚙ → Your apps → Web app (**</>**)**. Copy:

```
apiKey, authDomain, projectId, storageBucket,
messagingSenderId, appId, measurementId
```

### 3. Add env vars (VITE_ prefix, all 7)

**Local dev** — create `.env` (see `.env.example`):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

> The app shows a **Setup required** screen listing exactly which of the seven `VITE_FIREBASE_*` variables are missing when config is incomplete.

**Netlify (production)** — Site configuration → Environment variables → add the same seven names with the `VITE_FIREBASE_` prefix. Scope may stay *All scopes* or *Builds* — the app reads these at build/runtime via `import.meta.env`, no serverless functions involved. No `FIREBASE_*` (unprefixed) copies are needed.

### 4. Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

### 5. Deploy to Netlify

1. Netlify dashboard → **Add new site → Import an existing project → GitHub** → pick this repo.
2. Set: Build command `npm run build`, publish directory `dist` (already wired via `netlify.toml`).
3. Add the seven `VITE_FIREBASE_*` env vars in Site configuration → Environment variables.
4. Deploy. SPA routing is handled by the `_redirects`/`netlify.toml` catch-all.
5. Add `https://your-site.netlify.app` to Firebase **Authentication → Settings → Authorized domains** and test Google sign-in.

## Project structure

```
├── netlify.toml                # build config + SPA redirects
├── public/_redirects           # SPA fallback
└── src/
    ├── components/             # ActionMenu, SummaryPanel, Modals, ProgressRing, icons, …
    ├── context/AuthContext     # auth state + actions
    ├── hooks/useData.js        # live Firestore subscriptions (cards, attendance)
    ├── pages/                  # AuthPage, Home (list), Calendar (month grid)
    ├── services/attendance.js  # Firestore writes
    ├── firebase.js             # client-only config from import.meta.env.VITE_FIREBASE_*
    └── utils/                  # dates.js, attendanceMath.js (pure logic)
```

## Status meanings

| Status | Cell |
| --- | --- |
| Present | solid green cell |
| Absent | solid red cell |
| Half Day | solid orange cell |
| OverTime | green-tinted cell with OT hours |
| Holiday | solid amber/orange cell with "Holiday" label |
| Weekly Off | plain cell, gray "Week off" label |
| Leave | plain cell, amber "Leave" label |
| Note | stored on the day; ✎ marker if no status |
| Clear | removes the day's record entirely |