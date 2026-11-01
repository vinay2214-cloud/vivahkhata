# Contributing to Vivah Khata

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev:server   # AI server
npm run dev          # app
```

## Before you open a pull request

```bash
npm run lint           # ESLint (no `any`, no stray console calls) + tsc
npm run format:check   # Prettier
npm test               # Vitest
npm run build
```

CI runs the same checks.

## Conventions

- **Money is integer paise.** Never store or add floating-point rupees.
- **Firestore writes go through `src/services`** (audit fields, soft delete). Components never call `setDoc` directly.
- **Business rules live in `src/domain` and `src/lib` as pure functions** with a test in `tests/`.
- **AI output is a draft.** It must pass through `src/lib/aiDraft.ts` and the confirm screen; nothing is saved automatically.
- **No `any`, no raw `console.*`.** Use `unknown` + `errorMessage()` for caught errors and `logger` for diagnostics.
- **User-facing text goes in all three locale files** (`en`, `te`, `hi`); `tests/i18n.test.ts` fails if a key is missing.
- Dowry is never recorded; do not remove that guard.
