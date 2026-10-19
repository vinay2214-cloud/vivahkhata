# Vivah Khata — Family Wedding Ledger

A shared, family-run workspace for Indian weddings: every rupee spent, every vendor due, every gift received, every guest — recorded together, in English and తెలుగు, and usable offline at the venue.

**Deploying? Read [DEPLOY-GUIDE.md](DEPLOY-GUIDE.md).**

## Stack
- React 19 + TypeScript + Vite + Tailwind CSS
- Firebase Authentication (Google + demo sign-in) and Cloud Firestore with offline cache
- Small Node/Express server (`server/`) that calls Gemini for voice entry and bill / UPI screenshot reading — the `GEMINI_API_KEY` stays on the server
- Hosted as one free Web Service on Render (`render.yaml`)

## Run on your computer
```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev:server           # AI server on :8787
npm run dev                  # app on http://localhost:3000
npm run build && npm start   # production build + server
npm run lint                 # type check
```

## Project layout
| Path | What it is |
|---|---|
| `src/pages` | Screens (Dashboard, Money, Gifts, Gift Desk, Members, …) |
| `src/components` | UI building blocks, sheets and modals |
| `src/services` | All Firestore writes |
| `src/domain` | Pure calculations (totals, vendor balances) |
| `server/index.ts` | Serves the app and `/api/ai/read` (Gemini, signed-in users only) |
| `src/lib/geminiParser.ts` | Sends notes/photos to the server and turns the result into a draft |
| `src/lib/aiParser.ts` | Offline fallback for voice notes (never guesses amounts or names) |
| `src/i18n` | English and Telugu text |
| `firestore.rules` | Security rules — publish in Firebase Console after any change |
| `src/lib/firebaseConfig.ts` | Firebase web settings, read from `VITE_FIREBASE_*` environment variables |

## Principles
- Money is stored as whole paise; shown as ₹1,23,456.
- AI results are drafts — nothing is saved until a person checks it and taps Save.
- No dowry tracking of any kind.
