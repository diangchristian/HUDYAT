# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project structure

This repo has **no root package.json and no workspace tooling** — `client/` and
`server/` are two independent Node projects, each with their own `package.json`,
lockfile, and `node_modules`. Always `cd` into the relevant one before running
commands; there is no root-level script that runs both.

- `client/` — Vite + React 19 + TypeScript SPA, installable as a PWA via
  `vite-plugin-pwa` (see `vite.config.ts`, `src/lib/register-pwa.ts`, `src/lib/pwa.ts`).
- `server/` — Express 5 + TypeScript REST API backed by PostgreSQL via Prisma 7.

The app domain: FSL (Filipino Sign Language) learning — students work through
learning areas/categories, practice gesture recognition, and take assessments;
teachers author assessments and monitor learner progress.

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
  `seed:categories`, `seed:fsl-gestures`, `seed:test-teacher`, `seed:assessments`
  (each runs a `prisma/seeder/*.ts` file via `tsx`). `seed:assessments` attributes
  assessments to the test teacher, so run `seed:test-teacher` first. Test accounts
  (`testteacher@hudyat.local` / `testlearner@hudyat.local`, password `Test1234!`)
  come from `testTeacherSeeder.ts` / `testLearnerSeeder.ts`; the learner one has no
  npm script — run it with `npx tsx prisma/seeder/testLearnerSeeder.ts`.
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
auth, learning, categories, assessment, progress, teacher. Each router is mounted in
`src/index.ts` at `/api/<feature>`.

- **Prisma client is generated to a custom path**: `src/generated/prisma` (not the
  default `node_modules/.prisma` location), configured via the custom generator in
  `prisma/schema.prisma` + `prisma7.config.ts`. This directory is gitignored and
  auto-generated — never hand-edit it; run `npx prisma generate` after schema changes.
- **Auth**: JWT-based, via `src/middleware/authMiddleware.ts`. Token is read from
  either an `Authorization: Bearer <token>` header or a `jwt` cookie, verified with
  `jwt.verify`, then the user is loaded from the DB and attached to `req.user`
  (type augmented in `src/types/express.d.ts`). Token creation is in
  `src/utils/generateToken.ts`. Routers opt into protection per-router, not
  globally, with `.use(authMiddleware, requireRole(...))`
  (`src/middleware/requireRole.ts`): learning/assessment/progress are
  `LEARNER`-only, `/api/teacher/*` is `TEACHER`-only.
- **Roles share one auth system, with separate login portals**: one `users` table,
  one JWT, one `GET/PATCH /api/auth/me`. `POST /api/auth/login` only accepts
  learners and `POST /api/auth/teacher/login` only accepts teachers (both go through
  `authenticate()` in `auth.controller.ts`). `PATCH /me` updates `LearnerProfile` or
  `TeacherProfile` depending on role.
- **Assessment correctness has no `isCorrect` flag**: the correct `QuestionChoice`
  is the one whose `gestureId` equals the question's `gestureId`. Teacher authoring
  (`services/teacher-assessment.service.ts`) enforces that the choices include the
  target gesture and come from the category's gestures. Once an assessment has any
  attempts it is "locked": only question text can change — gestures, choices, points,
  type, reference media and the passing score are frozen (409 otherwise).
- Services signal HTTP errors by throwing `httpError(status, message)`
  (`src/utils/httpError.ts`); controllers map `statusCode` to the response.
  Learners see choices in `displayOrder` (no shuffling).
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
- Layouts: `StudentPageLayout` wraps `SidebarLayout` (the playful gold student UI);
  `TeacherPageLayout` wraps `StaffLayout` (the blue staff portal, meant to be reused
  for admin). `NoSidebarLayout` is full-screen, used for in-progress
  lesson/practice/assessment screens.
- **Two visual systems**: student pages use the gold Hudyat look (`ElevatedButton`,
  `components/common/*`). Staff pages follow the Figma teacher prototype and use
  shadcn primitives (`components/ui/*`, base-ui flavored: popups take a `render`
  prop, not `asChild`) plus staff building blocks in `components/staff/*`. The staff
  theme is the `.theme-staff` token override in `index.css`, applied to `<html>` by
  `useStaffTheme()` so portaled dialogs/selects inherit it.
- When adding shadcn components (`npx shadcn@latest add ...`), check the generated
  imports: the CLI has resolved `cn` to the unrelated npm package `"cn"` instead of
  `@/lib/utils` — fix the imports and don't keep that dependency. Decline overwriting
  the customized `button.tsx`.
- **Backend calls live in `src/api/`** (e.g. `learning-api.ts`, `progress-api.ts`) —
  this is a recent move off of `src/lib/`; `src/lib/` is now for generic utilities
  only (`utils.ts`, `camera-session.ts`, `practice.ts`). Put new backend-communication
  modules in `src/api/`, not `src/lib/`.
- All `api/*.ts` modules share the axios instance in `src/api/http.ts` (base URL from
  `import.meta.env.VITE_API_URL`, falling back to `http://localhost:5001`; attaches
  `Authorization: Bearer <token>` from `localStorage`) and unwrap `{ data: T }`
  responses with `unwrap()`. A 401 clears the token and redirects to `/login`, or
  `/teacher/login` when on a `/teacher/*` page. `VITE_API_URL` isn't documented
  anywhere (no client `.env.example`).
- Data fetching uses `@tanstack/react-query` via one-hook-per-file wrappers in
  `src/hooks/` (e.g. `use-my-progress.ts`, `use-teacher-assessment.ts`).
- Auth state: the JWT lives in `localStorage`; the current user comes from
  `useCurrentUser()` (`/api/auth/me`). Route guards in `src/router/route-guards.tsx`:
  `RequireGuest` for public pages, and `RequireRole allowedRoles loginPath` for
  role areas, which redirects to each role's home (`ROLE_HOME_PATH`) or login.
- Role areas: student pages under `src/pages/student/` (`/student/*`), teacher pages
  under `src/pages/teacher/` (`/teacher/dashboard`, `lessons`, `quizzes`,
  `quizzes/:categoryId`, `students`, `students/:learnerId`, `settings`; login at
  `/teacher/login`). The UI says "Lessons"/"Quizzes"/"Students" for what the backend
  calls categories/assessments/learners. Login forms send `identifier` (username or
  email) — the server accepts either.
- `src/features/*` are mostly **empty scaffold directories** (only
  `fsl-recognition` has code) — actual page code lives under `src/pages/`.
- `zustand` is installed but not yet used.
- Styling: Tailwind v4 via the `@tailwindcss/vite` plugin (not the PostCSS plugin);
  shadcn-style primitives live in `src/components/ui/`; the `cn()` class-merge
  helper is in `src/lib/utils.ts`.
- Path alias `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`).

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one root `CONTEXT.md` plus `docs/adr/`. See `docs/agents/domain.md`.
