# Free deployment: Cloudflare Worker + Render + Neon

This repository has a Vite React client in `client/` and an Express API in
`server/`. The existing Cloudflare Worker `bingo-crm` serves the built client
as static assets. Render runs the API, and Neon stores the data. Render's free
API sleeps after 15 minutes without incoming requests; no keep-awake job is
configured.

## 1. Neon database

Use a Neon PostgreSQL project. Keep its connection strings private and never
put them in client build variables or Git. Before using a new database, apply
the checked-in migrations from `server/` with `DATABASE_URL` set to the Neon
pooled connection string and `DIRECT_URL` set to its direct connection string:

```sh
npm ci
npm run prisma:generate
npm run prisma:deploy
```

Run `prisma:deploy` again whenever a later release adds migrations. Render
Free has no pre-deploy command; the API intentionally does not run migrations
on every wake-up.

## 2. Render API

Use one Render **Web Service** with root directory `server`, free compute,
build command `npm ci && npm run prisma:generate && npm run build`, start
command `npm start`, and health check `/api/v1/health`. Choose Singapore if
using Neon `ap-southeast-1`.

Set these Render environment variables:

- `DATABASE_URL`: the Neon pooled connection string.
- `JWT_SECRET`: a strong random secret.
- `CORS_ORIGIN`: the exact Cloudflare Worker origin, such as
  `https://bingo-crm.pesilay2372002.workers.dev` (no trailing slash).
- `UPLOADTHING_TOKEN`: needed only for document uploads.

The existing `render.yaml` describes an alternative Blueprint deployment. If
the Render Web Service already exists, configure that service directly; do not
create a second service from the Blueprint. Do not run `prisma:seed` with the
default admin password from `.env.example` on a public database.

Verify `https://bingo-crm.onrender.com/api/v1/health` returns `status: "ok"`.
The bare API origin may return 404 because the routes live under `/api/v1`.

## 3. Existing Cloudflare Worker for the client

Commit and push `client/wrangler.jsonc` to the GitHub branch connected to the
existing `bingo-crm` Worker. The Wrangler config tells Cloudflare to upload
`client/dist` and serve `index.html` for React Router navigation.

In the Worker's **Settings > Build** page, set:

| Setting | Value |
| --- | --- |
| Production branch | `master` |
| Root directory | `client` |
| Build command | `npm ci && npm run build` |
| Deploy command | `npx wrangler deploy` |
| Build variable | `VITE_API_BASE_URL=https://bingo-crm.onrender.com/api/v1` |

`VITE_API_BASE_URL` is embedded during the client build, so rebuild after
changing it. This is a build variable, not a runtime Worker secret. The
Wrangler `name` must match the existing Worker name `bingo-crm`.

After a successful deployment, open the Worker's `*.workers.dev` URL and try
both `/` and a client route such as `/companies`. If a browser API request is
blocked by CORS, compare its origin with Render's `CORS_ORIGIN` exactly. A
first API request after Render sleeps may take about a minute.
