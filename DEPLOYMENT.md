# Free deployment: Cloudflare Pages + Render + Neon

This repository has two deployable roots: `client/` (Vite static site) and
`server/` (Express API). Use Neon PostgreSQL for persistent data. Render's free
API sleeps after 15 minutes without incoming requests; no keep-awake job is
configured.

## 1. Database: Neon

Create a Neon PostgreSQL project in `ap-southeast-1` (Singapore), or use an
existing project. Copy its **pooled** connection string for the API and its
**direct** connection string for Prisma migrations. Keep both private and never
add them to client environment variables or Git.

Before the first API deployment, apply the checked-in schema to the intended
Neon database. From `server/`, set `DATABASE_URL` to that database and
`DIRECT_URL` to its direct connection string, then run:

```sh
npm ci
npm run prisma:generate
npm run prisma:deploy
```

Run `prisma:deploy` again when a later release adds migrations. Render Free
does not provide a pre-deploy command, so the Blueprint intentionally does
not run migrations during build or on every wake-up.

## 2. Reserve the Cloudflare Pages URL

Create a Pages project from this repository with root directory `client`,
React (Vite) preset, build command `npm ci && npm run build`, and output
directory `dist`. The initial build can complete before the API exists; sign-in
will not work yet. Copy the new `https://your-project.pages.dev` origin for the
Render configuration.

## 3. API: Render Free

Create a Render Blueprint from this repository's `render.yaml`. It defines a
Node web service with root directory `server/`, the production build/start
commands, Singapore region, free plan, and `/api/v1/health` check.

At Blueprint creation, enter:

- `DATABASE_URL`: the Neon pooled connection string.
- `CORS_ORIGIN`: the exact Cloudflare Pages origin, such as
  `https://your-project.pages.dev` (no trailing slash).

Render generates `JWT_SECRET`. If document uploads are needed, add
`UPLOADTHING_TOKEN` to the Render service's environment settings. Do not run
`prisma:seed` with the default admin password from `.env.example` on a public
database.

After deploy, confirm `https://your-api.onrender.com/api/v1/health` returns
`status: "ok"`. The API URL is HTTPS and has no `/api/v1` suffix in Render's
dashboard; add that suffix when configuring the client.

## 4. Finish the Cloudflare Pages client

Set this build environment variable on the Pages project and trigger a new
deployment:

| Setting | Value |
| --- | --- |
| Build environment variable | `VITE_API_BASE_URL=https://your-api.onrender.com/api/v1` |

Set `VITE_API_BASE_URL` **before the final build**; Vite embeds it in the
browser bundle. Cloudflare Pages serves React Router paths via its default SPA
fallback because this project has no top-level `404.html`.

The two public origins must match the Render `CORS_ORIGIN` setting exactly. If
you change the Pages domain, update `CORS_ORIGIN` on Render. If you change the
Render API URL, update `VITE_API_BASE_URL` on Cloudflare Pages and redeploy the
client.

## Final check

Open the Pages URL, register or sign in, and create a test record. A first API
request after Render has slept may take about a minute. Do not put real CRM
records in a demo database unless you have a backup and access plan.
