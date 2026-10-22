# HUDYAT · DABEST conference build

> **Do not merge this branch into `main` or any other branch.** It cuts HUDYAT down to four categories,
> replaces the database seeders with DABEST-only ones and changes how moving signs are captured.

The `dabest` branch is HUDYAT for the DABEST research conference. It covers only the categories the study
did: **Alphabet, Numbers, Greetings and Colors** (Colors: Red, Orange, Yellow, Green, Blue, Violet). The
list lives in `server/src/config/dabest.ts` (and `client/src/components/common/categories.constants.ts`).

## What is different from HUDYAT

- **Models:** Numbers, Colors and Greetings use the HUDYAT Trainer's models (`server/model-assets`);
  Alphabet keeps the current release.
- **Moving signs** (`client/src/features/fsl-recognition`): a sign ends when no hand has been seen for 0.5 s
  (or after 3 s) and is cut and squeezed to 32 frames the way the models were trained; a left-handed sign is
  mirrored (`sign-capture.js`, `timed-segmenter.ts`). A sign held steady is answered once the same confident
  answer comes twice, 0.5 s apart (`early-check.ts`). Letters are unchanged.
- **Only the four categories are shown** to learners and teachers. On a full HUDYAT database the others are
  hidden, never changed.
- **Own database:** the seeders build a database with only the four categories.

## Database

DABEST uses its own Neon database. Put its connection string in `server/.env` as `DATABASE_URL`, then in
`server/`:

```
npx prisma migrate deploy
npm run seed:dabest
```

The seeders refuse to run on a database that has other categories (such as the real HUDYAT one), so they
cannot overwrite it. `server/.env` is not in git: when switching between this branch and HUDYAT, switch
`DATABASE_URL` too.

Test accounts: `testlearner` and `testteacher`, password `Test1234!`.

## Running and testing

```
cd server && npm run dev        # API on port 5001
cd client && npm run dev        # http://localhost:5173
```

Add `?lab=1` to a lesson or Free Play address for the Recognition lab: compare captures, tune the early
answer and the no-hand time, and see why each moving-sign answer was given.

Still needed: real Greetings lesson videos and a Violet video.
