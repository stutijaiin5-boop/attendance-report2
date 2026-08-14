# Attendance Report

A full-stack attendance tracker that tells you your real number: how safe your bunks are, how many classes you need to recover, and what your streak looks like — synced across every device.

**Live site:** review Netlify dashboard (this repo deploys to Netlify)

## Features

- Email/password + Google sign-in (Firebase Auth)
- Subjects with target attendance % (default 75%) and weekly schedule
- Daily marking: Present / Absent / Cancelled via a week strip and a tappable month calendar
- Per-subject stats: current %, attended/held, **Safe to bunk**, **Need to attend**
- Overall dashboard with an aggregate ring chart and 🔥 full-attendance streak
- Low-attendance alerts when a subject drops below target
- Weekly and monthly history views with per-period summaries
- Mobile-first Tailwind UI, no component libraries

## Tech stack

| Layer | Tool |
| --- | --- |
| Frontend | React 18 + Vite 4 + Tailwind CSS |
| Auth + DB | Firebase Auth + Cloud Firestore |
| Serverless | Netlify Functions |
| Hosting | Netlify (static site + functions) |

## Data model (Firestore)

```
users/{userId}                          # implicit, created on first sign-in
users/{userId}/subjects/{subjectId}     # { name, targetPercent, scheduledDays[], createdAt }
users/{userId}/subjects/{subjectId}/records/{YYYY-MM-DD}   # { status: present|absent|cancelled }
```

Records are stored with the local date as the document ID — one document per subject per day.

### Firestore security rules

Enable these in **Firestore > Rules** so each user can only read/write their own data:

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

> Rule of thumb for the rules editor: paste, then hit "Publish" — the default editor UI validates the syntax automatically.

## Getting started

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com) → **Add project**.
2. **Build > Authentication > Get started**:
   - Enable *Email/Password* sign-in.
   - Enable *Google* sign-in (choose your support email).
   - Add your Netlify domain (e.g. `https://attendance-report2.netlify.app`) to **Authorized domains**. `localhost` is allowed by default.
3. **Build > Firestore Database > Create database** (production mode, nearest region). Delete the default playground rules and publish the rules above.

### 2. Register a web app

Project settings **⚙ → Project settings → Your apps → Web app** (</> icon). Copy the `firebaseConfig` values.

### 3. Configure env vars

**Local dev** — create `.env` (copy from `.env.example`):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

**Netlify (production)** — set the *same* values without the `VITE_` prefix in **Site settings → Environment variables**:

```
FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID,
FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID
```

In production the app fetches its config from `/.netlify/functions/get-firebase-config`, so the keys are **not** baked into the client bundle. (Note: Firebase web config is public by design — real security comes from the Firestore rules above. Keep private keys, like a Firebase service account, server-side only.)

### 4. Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

### 5. Deploy to Netlify

**Option A — Git integration (recommended):** in Netlify dashboard → *Add new site → Import existing project*, pick this GitHub repo and set:

- Build command: `npm run build`
- Publish directory: `dist`

Then add the `FIREBASE_*` env vars (step 3) and deploy. Functions deploy automatically.

**Option B — CLI:**

```bash
npm i -g netlify-cli
netlify login
netlify init --manual     # or: netlify link --name attendance-report2
netlify env:import .env   # sets FIREBASE_* vars (strips VITE_ prefix)
netlify deploy --prod
```

## Netlify functions

- `netlify/functions/get-firebase-config.js` — serves Firebase config from env vars in production, so keys aren't bundled into the static site.

## Project structure

```
├── netlify/functions/        # serverless functions
├── src/
│   ├── components/           # ProgressRing, SubjectCard, MonthCalendar, …
│   ├── context/AuthContext   # auth state + actions
│   ├── hooks/useData.js      # live Firestore subscriptions
│   ├── pages/                # Auth, Dashboard, SubjectForm (onboarding), SubjectDetail, History
│   ├── services/attendance.js# Firestore writes
│   └── utils/                # dates.js, attendanceMath.js (pure logic)
└── netlify.toml              # build config + SPA redirects
```

## Stats explained

- **Attendance %** = `present / (present + absent)` — cancelled classes are excluded from totals.
- **Safe to bunk** = `floor(P·(1−t)/t − A)` — extra classes you can miss while staying ≥ target `t`.
- **Need to attend** = `ceil((t·held − P)/(1−t))` — consecutive attends needed to climb back to target.
- **Streak** = consecutive days (ending today) with zero absences; unscheduled days are skipped, cancelled days don't break it.