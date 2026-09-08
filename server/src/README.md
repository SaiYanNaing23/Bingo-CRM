# Server Folder Structure

This layout keeps the Express API easy to scale as the CRM grows.

## Layout

- `src/config`: environment parsing and app config.
- `src/lib`: cross-cutting infrastructure clients (logger, database client, external SDK wrappers).
- `src/middlewares`: request middleware shared by routes (`error`, `not-found`, etc.).
- `src/routes`: route aggregation/registration.
- `src/modules`: feature modules (controllers/services/routes) kept close to the domain.
- `src/types`: ambient project types (e.g., `req.user` typing).
- `src/shared`: shared utilities/errors used across modules.
- `src/utils`: small generic helpers.
- `src/app.ts`: app composition (middleware + routing).
- `src/server.ts`: bootstrap and process lifecycle hooks.

## Run this backend locally

1. Open a terminal in `server`.
2. Install dependencies (first time only):
   `npm.cmd install`
3. Make sure `server/.env` has your `DATABASE_URL`:
   - We accept remote PostgreSQL URLs (like Neon), no local DB required.
4. Apply the checked-in database migrations (also required after pulling new modules):
   `npm.cmd run prisma:deploy`
5. Generate Prisma client:
   `npm.cmd run prisma:generate`
6. Build:
   `npm.cmd run build`
7. Start API:
   `npm.cmd run start`
8. Verify:
   `GET http://localhost:4000/api/v1/health`
   should return:
   `{"success":true,"data":{"status":"ok",...}}`

Bootstrap database (first run):

1. Apply existing migrations:
   `npm.cmd run prisma:deploy`
2. Seed data:
   `npm.cmd run prisma:seed`

Use `npm.cmd run prisma:migrate -- --name <change_name>` when authoring a new schema change.
Use `npm.cmd run prisma:status` to check for unapplied migrations. Generating the Prisma client
or building the server does not create database tables.

## Contacts verification (Phase 2)

If contact creation returns `INTERNAL_ERROR` and the server log reports Prisma `P2021`
(`public.Contact` does not exist), run `npm.cmd run prisma:deploy` against the same
`DATABASE_URL` used by the API, then retry. The Contacts migration must follow
`20260813094426_init_crm_foundation` so its TEXT foreign keys match User and Company.

Run `npm.cmd run test:contacts` after applying migrations. It exercises authenticated
CRUD, pagination, ownership, follow-up updates, and soft-delete behavior against the
configured database. Test fixtures are created inside a transaction and rolled back.

See [Contacts 2.4 and 2.5 manual testing](../docs/contacts-testing.md) for request
bodies, expected responses, and a manual completion checklist.

Send `photo` and `linkedIn` as plain URL strings (without Markdown link syntax), and
send email as `sarah.johnson@example.com` (without a backslash before `@`).

## Applications verification (Phase 3)

Apply the checked-in migration with `npm.cmd run prisma:deploy`, generate the client
with `npm.cmd run prisma:generate`, and build before restarting a compiled server.
Run `npm.cmd run test:applications` for the build, fresh migration replay, CRUD,
ownership, filtering, stage history, concurrent transitions, and rollback checks.
The tests use a unique temporary schema and remove it afterward.

See [Applications testing requests](../docs/applications-testing.md) for field rules,
request bodies, expected responses, stage transitions, and a manual checklist.

## Tasks verification (Phase 4)

Apply the migration with `npm.cmd run prisma:deploy`, regenerate the client with
`npm.cmd run prisma:generate`, and build before restarting a compiled server.
`npm.cmd run test:tasks` checks the build, migration replay, CRUD, completion,
recurrence, concurrency/rollback, and today's timezone boundaries in a temporary schema.

See [Tasks sample requests](../docs/tasks-testing.md) for every endpoint's payload,
expected results, recurrence rules, today-summary definitions, and a manual checklist.

## Phase 0 shared utilities

- Pagination defaults:
  - `PAGINATION_DEFAULT_LIMIT` and `PAGINATION_MAX_LIMIT` are validated in `src/config/env.ts`.
  - `src/shared/utils/pagination.ts` provides `parsePaginationQuery` and `toPaginationMeta`.
- Soft-delete defaults:
  - `src/shared/utils/soft-delete.ts` provides `withActiveRecordFilter` and should be used in list/read service queries.
- Error contract:
  - `src/shared/types/api-response.ts` and `src/shared/utils/response.ts` define stable success/error envelopes.
- Auth baseline:
  - `src/modules/auth` and `src/middlewares/auth.middleware.ts` expose `/api/v1/auth/{register,login,me}`.

If you hit DB/tooling issues on Windows, keep commands as `npm.cmd ...` (PowerShell blocks direct `npm` via execution policy).
