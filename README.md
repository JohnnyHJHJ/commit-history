# Commit History — Vercel + Neon

## Files

- `index.html` — frontend connected to `/api/*`
- `api/confessions.js` — confession API
- `api/memories.js` — memory API
- `api/reactions.js` — reaction API
- `package.json` — Neon dependency
- `.env.example` — environment variable example

## Vercel

Add this environment variable in Vercel:

`DATABASE_URL`

Use your Neon PostgreSQL connection string as the value.

Then redeploy the Vercel project.

The frontend expects these routes:

- `/api/confessions`
- `/api/memories`
- `/api/reactions`

Do not commit the actual `.env` file.
