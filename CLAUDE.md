# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project structure

This repo has **no root package.json and no workspace tooling** — `client/` and
`server/` are two independent Node projects, each with their own `package.json`,
lockfile, and `node_modules`. Always `cd` into the relevant one before running
commands; there is no root-level script that runs both.

- `client/` — Vite + React 19 + TypeScript SPA (project is named "fsl-pwa" but PWA
  plumbing — manifest, service worker, `vite-plugin-pwa` — is not yet implemented).
- `server/` — Express 5 + TypeScript REST API backed by PostgreSQL via Prisma 7.

The app domain: FSL (Filipino Sign Language) learning — students work through
learning areas/categories, practice gesture recognition, and take assessments;
teachers author assessments.

## Common commands

### Client (`cd client`)
- `npm run dev` — Vite dev server (default port 5173). Dev server proxies `/api/*`
  to `http://localhost:5001` (see `vite.config.ts`).
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — ESLint (flat config)
- `npm run preview` — preview a production build
- No test script/framework is configured on the client.

### Server (`cd server`)
- `npm run dev` — `tsx watch src/index.ts` (default port 5001, or `PORT` env var)
- `npm run build` — `tsc` to `dist/`
- `npm start` — run built `dist/index.js`
- `npm test` is a stub that exits 1 — **no real test suite exists on the server either.**
- No lint script / ESLint config on the server.
- Seed scripts (run after migrating): `npm run seed:learning-areas`,
  `seed:categories`, `seed:fsl-gestures`, `seed:assessments` (each runs a
  `prisma/seeder/*.ts` file via `tsx`).
- Prisma CLI is invoked directly (no package.json wrapper scripts): `npx prisma
  migrate dev`, `npx prisma generate`. Config is in `prisma7.config.ts`, schema in
  `prisma/schema.prisma`.
- Required env vars (`server/.env`, see `server/.env.example`): `DATABASE_URL`,
  `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV`. Also read in code but **not**
  listed in `.env.example`: `JWT_COOKIE_EXPIRES_IN` (`src/config/env.ts`) and
  `CLIENT_ORIGIN` (`src/index.ts`, used for CORS).

To develop end-to-end, run the client and server dev servers concurrently in two
terminals.

## Server architecture

Layered Express app, one feature slice per domain area, mirrored across
`routes/`, `controllers/`, and (for the more complex features) `services/`:
auth, learning, categories, assessment, progress. Each router is mounted in
`src/index.ts` at `/api/<feature>`.

- **Prisma client is generated to a custom path**: `src/generated/prisma` (not the
  default `node_modules/.prisma` location), configured via the custom generator in
  `prisma/schema.prisma` + `prisma7.config.ts`. This directory is gitignored and
  auto-generated — never hand-edit it; run `npx prisma generate` after schema changes.
- **Auth**: JWT-based, via `src/middleware/authMiddleware.ts`. Token is read from
  either an `Authorization: Bearer <token>` header or a `jwt` cookie, verified with
  `jwt.verify`, then the user is loaded from the DB and attached to `req.user`
  (type augmented in `src/types/express.d.ts`). Token creation is in
  `src/utils/generateToken.ts`. Routers opt into protection with
  `.use(authMiddleware)` per-router (e.g. `progress.routes.ts`), not globally.
- `src/middleware/errorHandler.ts` exists but is **not wired up** in `index.ts` —
  there is currently no centralized error-handling middleware.
- Core Prisma data model (see `prisma/schema.prisma` for full detail):
  - `User` (role: ADMIN/TEACHER/LEARNER) 1:1 with `LearnerProfile` / `TeacherProfile`.
  - `LearningArea` → `Category` → `CategoryGesture` (join table) → `FslGesture`.
  - `Category` 1:1 `Assessment` (created by a `TeacherProfile`) → `AssessmentQuestion`
    (each tied to an `FslGesture`) → `QuestionChoice` (also tied to an `FslGesture`).
  - `AssessmentAttempt` (by a `LearnerProfile`) → `AssessmentAnswer`.
  - `CategoryProgress` tracks a learner's per-category status plus lesson-resume
    checkpoint fields (`lastGestureIndex`, `lastLessonStep`).
  - `PracticeSession` logs gesture-recognition practice attempts with a confidence score.
  - Migration names don't always match their contents — e.g.
    `20260906161324_add_last_gesture_index` actually drops columns and tightens a FK
    constraint; the `lastGestureIndex` column itself was added by the prior
    `add_lesson_checkpoint` migration. Don't trust a migration's name alone; check its
    SQL when it matters.
- `server/.agents/skills/` and `server/.windsurf/skills/` contain vendored Prisma
  reference skills (prisma-cli, prisma-client-api, prisma-postgres, etc.) pulled from
  `prisma/skills` — useful reference docs for Prisma work, not project-specific rules.

## Client architecture

- Routing lives entirely in `src/router/index.tsx` using **react-router v8**
  (imported from `"react-router"`, not `"react-router-dom"`) via
  `createBrowserRouter`. `src/main.tsx` renders `<RouterProvider>` directly —
  **`src/App.tsx` is dead code** (`function App() { return null }`) and isn't
  rendered anywhere.
- Two layout wrappers: `StudentPageLayout` (with sidebar) and `NoSidebarLayout`
  (full-screen, used for in-progress lesson/practice/assessment screens).
- **Backend calls live in `src/api/`** (e.g. `learning-api.ts`, `progress-api.ts`) —
  this is a recent move off of `src/lib/`; `src/lib/` is now for generic utilities
  only (`utils.ts`, `camera-session.ts`, `practice.ts`). Put new backend-communication
  modules in `src/api/`, not `src/lib/`.
- No shared fetch wrapper/axios instance — each `api/*.ts` module independently uses
  raw `fetch()`, reads `import.meta.env.VITE_API_URL` (falls back to
  `http://localhost:5001`), and attaches `Authorization: Bearer <token>` from
  `localStorage.getItem("token")`. Responses are expected as `{ data: T }` on success.
  `VITE_API_URL` isn't documented anywhere (no client `.env.example`).
- No `AuthContext` or route guards exist — `LoginPage.tsx` just stores the JWT in
  `localStorage` on success and navigates; protection is enforced only server-side.
  `src/features/auth/` is an empty scaffold for a future proper auth module.
- `src/features/*` (admin, auth, fsl-recognition, lessons, progress, quizzes,
  student, teacher) are all currently **empty scaffold directories** — actual page
  code still lives under `src/pages/`.
- `zustand` and `@tanstack/react-query` are installed but not yet used anywhere in
  the codebase — data fetching is still plain `fetch()` with no caching layer.
- Styling: Tailwind v4 via the `@tailwindcss/vite` plugin (not the PostCSS plugin);
  shadcn-style primitives live in `src/components/ui/`; the `cn()` class-merge
  helper is in `src/lib/utils.ts`.
- Path alias `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`).
