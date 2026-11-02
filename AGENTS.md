# AGENTS.md: fsl-pwa

This repo has **two independent Node projects** (client/ and server/) with no root tooling.
Always cd into the relevant package before running commands.

## Project structure

- client/ — Vite + React 19 + TypeScript SPA, installable as a PWA via ite-plugin-pwa.
  - src/App.tsx is dead code (unction App() { return null }) — not rendered anywhere.
  - Routing: react-router v8 (createBrowserRouter) in src/router/index.tsx.
  - Two visual systems: student pages (gold Hudyat look, ElevatedButton, components/common/*)
    vs teacher pages (shadcn primitives, components/ui/*, staff theme via .theme-staff token).
  - src/lib/ = generic utilities only (utils.ts, camera-session.ts, practice.ts).
    **New backend-communication modules go in src/api/, not src/lib/.**
  - src/pages/ has the real page code; src/features/ are empty scaffolds.
  - Tailwind v4 via @tailwindcss/vite (not PostCSS plugin).
  - Path alias @/* ? src/* (configured in ite.config.ts and 	sconfig.app.json).
  - zustand installed but not yet used.
  - Axios instance in src/api/http.ts; base URL from import.meta.env.VITE_API_URL,
    falling back to http://localhost:5001. 401 clears token and redirects to /login
    or /teacher/login.

- server/ — Express 5 + TypeScript REST API backed by PostgreSQL via Prisma 7.
  - Prisma client generated to custom path: src/generated/prisma (gitignored, auto-generated).
    **Never hand-edit**; run 
px prisma generate after schema changes.
  - Migration names don't always match their contents — **check the SQL when it matters**.
  - src/middleware/errorHandler.ts exists but is **not wired up** in index.ts.
  - src/middleware/authMiddleware.ts — JWT from Authorization: Bearer header or jwt cookie.
  - Routers opt into protection per-router with uthMiddleware + equireRole();
    learning/assessment/progress are LEARNER-only, /api/teacher/* is TEACHER-only.
  - Auth: one users table, one JWT, one GET/PATCH /api/auth/me.
    POST /api/auth/login accepts learners; POST /api/auth/teacher/login accepts teachers.
  - Assessment correctness: **no isCorrect flag** — the correct QuestionChoice is the one whose
    gestureId equals the question's gestureId. Once an assessment has any attempts it is  locked:
    only question text can change — gestures, choices, points, type and passing score are frozen.
  - Question media: IMAGE_GESTURE shows choice gestures' eferenceImageUrls;
    VIDEO_GESTURE plays the target gesture's eferenceVideoUrl. Server rejects video questions
    whose target sign has no video. AssessmentQuestion.referenceMediaUrl is legacy (all null).

## Common commands

### Client (cd client)
- 
pm run dev — Vite dev server (port 5173). Proxies /api/* to http://localhost:5001.
- 
pm run build — 	sc -b && vite build.
- 
pm run lint — ESLint (flat config).
- 
pm run preview — preview a production build.
- 
pm test — 
ode:test suites in 	ests/*.test.mjs; needs
  --experimental-strip-types on Node 22.13.
  Model-fixture checks run separately via 
pm run test:models.

### Server (cd server)
- 
pm run dev — 	sx watch src/index.ts (port 5001, or PORT env var).
- 
pm run build — 	sc to dist/.
- 
pm start — run built dist/index.js.
- 
pm test — stub that exits 1; **no real test suite**.
- Seed scripts (run after migrating):
  
pm run seed:learning-areas, seed:categories, seed:fsl-gestures,
  seed:assessments, seed:test-teacher (run 	estLearnerSeeder.ts manually with 
px tsx).
  **Run seed:test-teacher first** — seed:assessments attributes assessments to the test teacher.
- **Required env vars** (server/.env): DATABASE_URL, PORT, JWT_SECRET,
  JWT_EXPIRES_IN, NODE_ENV, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET. Also read in code but **not listed in .env.example**:
  JWT_COOKIE_EXPIRES_IN (src/config/env.ts) and CLIENT_ORIGIN (src/index.ts).
- Prisma CLI invoked directly: 
px prisma migrate dev, 
px prisma generate.
- **Critical**: Migration names don't always match their contents — e.g.
  20260906161324_add_last_gesture_index actually drops columns and tightens a FK constraint.
  Check the SQL when it matters.

### End-to-end
Run the client and server dev servers concurrently in two terminals.

## Model integration per category (critical for recognition)

- Category model release fetched from GET /api/models/:category; Category.modelRelease JSON
  stores version, hashes, and file URLs.
- Model assets served from server/model-assets/ via GET /api/models/files.
- **Browser performs all landmark extraction and classification** (TensorFlow.js) — camera images
  never go to the API.
- Each category has registered model releases (e.g., Alphabet, Colors). Clients download only the
  requested category's model, SHA-256 verified and cached in Cache Storage.
- Publishing a new model run: export from sl_trainer, then 
pm run models:register on the server.
- **Never commit real environment files** — server/.env and client/.env are local-only.

## Issue tracking

- Issues and specs live as markdown files under .scratch/<feature-slug>/.
- Triage states: 
eeds-triage, 
eeds-info, eady-for-agent, eady-for-human, wontfix.
- Status recorded as a Status: line near the top of each issue file.

## Quick reconcilation with CLAUDE.md

This AGENTS.md mirrors the highest-signal facts from CLAUDE.md but focused on
what an OpenCode agent would likely miss without help. When in doubt, trust
CLAUDE.md for detailed runtime behavior and this file for structural/operational gotchas.
