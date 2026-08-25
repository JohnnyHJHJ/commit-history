# Commit History

Frontend for the Commit History project.

## Current frontend

`index.html` contains the current dark-mode version, including:
- Grid view as the default
- Single React button with an emoji selection popup
- Admin login with Remember Me
- Existing Commit History UI/functionality

> The current frontend still uses browser `localStorage`. Do not put a Neon database password in this file.

## Neon backend plan

Use a separate backend/API to connect the frontend to Neon PostgreSQL.

Recommended flow:

Browser -> your API/backend -> Neon PostgreSQL

Never put `DATABASE_URL`, a Neon password, or other database credentials in `index.html`.

## Files

- `index.html` — frontend
- `schema.sql` — optional starter database schema for Neon
- `.env.example` — example environment variable
- `.gitignore` — prevents secrets and local dependencies from being committed

## Local Git setup

```bash
git init
git add .
git commit -m "Add Commit History frontend"
git branch -M main
git remote add origin YOUR_COMMIT_HISTORY_REPO_URL
git push -u origin main
```

If the repository already has files, clone/pull it first and copy these files into the repository instead of running `git init`.

## Next backend step

After creating the Neon database, build an API with endpoints such as:

GET  /api/confessions
POST /api/confessions
GET  /api/memories
POST /api/memories
POST /api/reactions
GET  /api/reactions

Then replace the frontend's localStorage read/write functions with fetch() calls to those endpoints.
