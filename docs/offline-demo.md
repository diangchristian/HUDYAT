# Presenting without internet

Start PostgreSQL on this laptop, then run these in two terminals from the project folder:

```powershell
cd server
npm run dev:offline
```

```powershell
cd client
npm run dev
```

Open http://localhost:5173 on the same laptop and allow camera access.
Keep both terminals open. Dependencies must already be installed.

The offline server uses `LOCAL_DATABASE_URL` from `server/.env`. It does not change
the normal `DATABASE_URL`; `npm run dev` in the server still uses the normal connection.
Stop any normal server on port 5001 before starting the offline server.

Accounts and lesson data come from the local snapshot. Newer online accounts or
edits are not automatically copied. Changes made offline stay in the local database.
`npm run db:backup-local` replaces local data with a fresh online snapshot, so do not
run it if you need to preserve local changes.

Recognition models and MediaPipe assets are on this laptop. Cloudinary images,
videos, uploads, and uncached external pictures need internet. Image/video quiz
questions may therefore lack the media needed to answer them.

Before presenting, disconnect Wi-Fi and rehearse the actual camera workflow in the
browser. Local API and saved model predictions can be checked without a camera,
but those checks do not replace this rehearsal.
