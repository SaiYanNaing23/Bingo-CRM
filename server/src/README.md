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

Prisma CLI uses `DIRECT_URL` when supplied; it must address the same database as
the runtime `DATABASE_URL`. When DIRECT_URL is absent and DATABASE_URL uses a Neon
`-pooler` hostname, `prisma.config.ts` derives the direct hostname for CLI work.
The API continues using DATABASE_URL. This keeps migration advisory locks on a
single connection; [Neon recommends direct connections for migrations](https://neon.com/docs/connect/connection-pooling).

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

## Projects verification (Phase 5)

Apply migrations with `npm.cmd run prisma:deploy`, regenerate the client with
`npm.cmd run prisma:generate`, and build/restart a compiled API. Projects adds eight
authenticated endpoints for CRUD, progress/status updates, and activity comments/history.
General PUT edits details; status/progress updates use PATCH `/:id/progress` so the
state change and its history entry commit together. Archived projects remain accessible
until soft-deleted. Stack membership uses a [GIN array index](https://docs.prisma.io/docs/orm/prisma-schema/data-model/indexes).

`npm.cmd run test:projects` runs the build and 14 integration scenarios against a
disposable schema, including fresh migrations, constraints, validation, ownership,
pagination, progress history, concurrency, and rollback. Fixtures are removed afterward.

See [Projects sample requests](../docs/projects-testing.md) for every endpoint's
payload, state rules, expected results, and the separate user testing checklist.

## Notes verification (Phase 6)

Apply migrations, regenerate Prisma, and build/restart a compiled API as above.
Notes provides five authenticated CRUD endpoints under `/api/v1/notes`, with raw
Markdown content, normalized tags, search/pagination, and optional entity links.
Supported targets are Company, Contact, Application, Task, and Project. Links use
real foreign keys and ownership checks. A soft-deleted target leaves its notes
readable with entityAvailable:false; entity:null detaches a note.

`npm.cmd run test:notes` runs the build and 19 integration scenarios in a disposable
schema. It covers Markdown preservation, validation/body limits, ownership, all
target types, batched availability, target deletion, concurrent links/edits, and rollback.

See [Notes sample requests](../docs/notes-testing.md) for every endpoint's payload,
entity-link examples, expected results, and a separate user checklist. Markdown is
returned as source text; a future client renderer must disable or sanitize raw HTML.

## Calendar verification (Phase 7)

Apply migrations, regenerate Prisma, and build before starting or restarting a compiled API.
Calendar adds seven authenticated routes under `/api/v1/calendar`: event CRUD at `/events`,
day/week/month/custom views at `/range`, and reminder schedules at `/reminders`.
Events have named timezone metadata, explicit-offset start/end instants, and an optional
source pair linking an owned Company, Contact, Application, Task, or Project. Sources are
not automatically rescheduled; soft-deleted sources leave their events available.

`npm.cmd run test:calendar` builds and exercises fresh migrations, database constraints,
validation, ownership, pagination, interval overlaps, DST windows, source lifecycle,
reminder rescheduling, concurrent edits/deletion, and rollback in a disposable schema.
Reminders are schedules calculated from event start times; this phase does not dispatch notifications.
See [Calendar sample requests](../docs/calendar-testing.md) for all payloads, range/reminder
semantics, expected results, and the separate manual checklist.

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
