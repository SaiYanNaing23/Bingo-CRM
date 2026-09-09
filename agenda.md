# BINGO CRM Backend Agenda

Goal: build a production-grade backend first for a career + project CRM, then wire frontend modules cleanly.

Client roadmap: [client-agenda.md](./client-agenda.md). This file remains the backend agenda.

Workstream status (2026-09-08): backend Phases 0-6 are implemented and verified, including Projects and Notes. Client Phases 0-5 and 8-9 (Projects and Notes) are implemented and verified in their separate agenda. Backend Phase 4-6 user manual checks remain separate and pending; client manual checks are also recorded separately. Backend Phases 7-11 remain future work.

## Implementation Progress

- [x] 0.1 Backend shell
- [x] 0.2 API contract
- [x] 0.3 Domain data foundation
- [x] 0.4 Module + folder pattern
- [x] 0.5 Auth baseline
- [x] 0.6 Pagination + soft-delete defaults
- [x] 0.7 Phase 0 runbook
- [x] Phase 1 - Companies module
- [x] Phase 2 - Contacts module
- [x] Phase 3 - Applications module
- [x] Phase 4 - Tasks module
- [x] Phase 5 - Projects module
- [x] Phase 6 - Notes module
- [ ] Phase 7 - Calendar module
- [ ] Phase 8 - Documents module
- [ ] Phase 9 - Learning module
- [ ] Phase 10 - Interviews
- [ ] Phase 11 - Analytics

## Decision Lock (Phase 0)

The following are fixed for this run:

- Auth strategy: `JWT`
- Multi-user from day one
- ID style: `UUID` for `id` fields
- Soft delete: `deletedAt` from the start
- Pagination: enabled on all list endpoints from phase 0

## Decision Lock (Runtime + API Contract)

Stable decisions now frozen for implementation:

- Error envelope shape is locked to include `success`, `error`, `code`, and optional `details`.
- Invalid payloads and JSON parse failures use a stable validation error path (`code: "VALIDATION_ERROR"`).
- Prisma source is explicitly bound via `DATABASE_URL` in `server/prisma/schema.prisma`.
- Seed/bootstrap path is fixed to `server/prisma/seed.mjs` through `server/prisma.config.ts`.

## Architecture target

- Node.js + Express + TypeScript
- PostgreSQL + Prisma
- Domain modules:
  - Companies
  - Contacts
  - Applications + Pipeline
  - Projects + Project Activities
  - Tasks + Calendar
  - Notes (Markdown-ready)
  - Documents
  - Learning Tracker
  - Analytics
  - Interviews (Version 2 but scaffold-ready)

## Phase 0 - Foundation (must be done first)

This phase creates the foundation your next modules can safely trust.

### 0.1 Backend shell

Goal: a stable, observable, typed API surface before any business modules.

Deliverables:

- `dotenv` + Zod env validation for runtime config.
- Middleware stack: `helmet`, `cors`, `compression`, `cookieParser`, `rateLimit`.
- `requestId` middleware for traceability and request logs.
- Global error + 404 handling with stable response contract.
- Route mount at `/api/v1`.

Acceptance checks:

- `GET /api/v1/health` returns `{ success: true, data: ... }`.
- Invalid payloads return a stable validation error shape.
- Unknown routes return `{ success: false, error: "Not Found", path: ... }`.

### 0.2 API contract

Goal: predictable frontend integration from day one.

Deliverables:

- Shared response types (`ApiResponse`, paginated variants).
- `AppError` with `code` + `details`.
- Shared response utils: `sendSuccess`, `sendError`, `sendPaginated`.

Acceptance checks:

- Every route in shared patterns uses consistent envelope.
- Frontend can read success and error payloads without conditional guessing.

### 0.3 Domain data foundation

Goal: one user model that owns every record.

Deliverables:

- Prisma base schema:
  - `User` model with `id`, `fullName`, `email`, `passwordHash`, `role`, `deletedAt`, timestamps.
- Migration + seed strategy:
  - First migration includes UUID and soft-delete columns.
  - Seed creates at least one admin user for local run.

Acceptance checks:

- `prisma migrate dev` can create the base tables.
- Seed user exists in local DB.
- Auth checks `deletedAt` where appropriate.

### 0.4 Module + folder pattern

Goal: every future feature follows the same structure.

Deliverables:

- `src/modules/<module>/{controllers,services,dto,routes,validators,types}`.
- Shared helpers under `src/shared/` for pagination/filtering/enums.
- Shared infra under `src/lib/` (prisma logger etc.).

Acceptance checks:

- A new module can be added without guessing where files belong.

### 0.5 Auth baseline (JWT, multi-user)

Goal: identity + authorization are in place before feature modules.

Deliverables:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login` (returns JWT + public user)
- `GET /api/v1/auth/me` (JWT-protected)
- `authMiddleware` injecting `req.user` with `id`, `email`, `role`
- `rate-limit` and JWT error handling in app-wide error path

Acceptance checks:

- `GET /api/v1/auth/me` without token => `401`.
- Invalid token => `401`.
- Password hashing with bcrypt is used for storage.

### 0.6 Pagination + soft-delete defaults

Goal: make list endpoints production-ready from day one.

Deliverables:

- Shared `parsePaginationQuery` + `toPaginationMeta`.
- Default limit and max limit via env vars.
- Soft delete filter defaults enforced in service methods (`where: { deletedAt: null }`).

Acceptance checks:

- `page`, `limit` query args work on list APIs.
- Deleted rows never leak from normal list/read flows.

### 0.7 Phase 0 runbook

Execution order:

1. Implement / confirm `server/src/config/env.ts` and `.env`.
2. Confirm middleware + route mount in `server/src/app.ts` and `server/src/routes/index.ts`.
3. Confirm shared contracts in `server/src/shared`.
4. Confirm Prisma baseline (`server/prisma/schema.prisma`, migration, generated client path).
5. Finish auth module and middleware (`server/src/modules/auth`, `server/src/middlewares/auth.middleware.ts`).
6. Add seed + migration wiring (`server/prisma/seed.mjs`, `server/prisma.config.ts`, package scripts).
7. Validate build and run DB bootstrap scripts.

Acceptance checks:

- `npm run build` passes.
- `npm run prisma:migrate` succeeds.
- `npm run prisma:seed` succeeds.
- You can authenticate and call `/api/v1/auth/me`.

## Phase 1 - Companies module (core entity)

Purpose: central CRM record for applications + contacts.

### 1.1 Companies foundation data model

Goal: one company model that belongs to a user and supports lifecycle + filtering from day one.

Deliverables:

- Prisma model with required fields:
  - `logo`, `name`, `country`, `industry`, `website`, `linkedIn`, `careerPage`, `techStack`, `size`, `salaryRange`, `remote`, `notes`, `status`.
- Ownership fields: `userId` with FK + cascade/relation behavior.
- Soft-delete field `deletedAt`.
- Timestamps and useful indexes.
- Migration + generated schema update.

Acceptance checks:

- `prisma migrate dev` creates company table and relation.
- One seeded admin can create/read a company.
- Deleted rows are excluded from normal list/get paths.

### 1.2 Companies module structure

Goal: keep the module fully in the standard folder pattern.

Deliverables:

- `src/modules/companies/{controllers,services,dto,routes,validators,types}` folder set.
- Shared types and DTOs used by controllers/services.

Acceptance checks:

- Team can find controller/service/validator/type paths without ambiguity.

### 1.3 Companies API baseline

Goal: implement stable CRUD and auth-protected access.

Deliverables:

- `POST /api/v1/companies` create
- `GET /api/v1/companies` list
- `GET /api/v1/companies/:id` read
- `PUT /api/v1/companies/:id` update (or `PATCH`, documented)
- `DELETE /api/v1/companies/:id` soft-delete
- `PATCH /api/v1/companies/:id/status` transition endpoint (optional in first pass)

Acceptance checks:

- All responses follow shared envelope.
- Auth-protected routes work with JWT.
- Invalid payloads return stable validation errors.

### 1.4 Companies list behavior

Goal: production-ready list from the first version.

Deliverables:

- `page`, `limit` on list with shared pagination contract.
- Filtering by status/country/industry/remote.
- Search by text (`name`, `notes`).
- Sorting by at least `name`, `createdAt`, `updatedAt`.

Acceptance checks:

- List returns paginated `meta`.
- Soft-delete exclusion happens on list.

### 1.5 Companies phase 1 verification

Goal: finalize readiness before moving to contacts.

Acceptance checks:

- Create/update/read/list/archive one company successfully.
- `npm run build` passes.
- `npm run prisma:migrate` and `npm run prisma:seed` still behave as expected in local bootstrap context.

### 1.6 Progress

- [x] 1.1 Companies foundation data model
- [x] 1.2 Companies module structure
- [x] 1.3 Companies API baseline
- [x] 1.4 Companies list behavior
- [x] 1.5 Companies phase 1 verification

## Phase 2 - Contacts module

- Purpose: recruiter/contact tracking for each company.
- Mandatory fields: photo, name, companyId, email, phone, linkedin, role, notes, lastContactAt, nextFollowUpAt.
- API: CRUD + follow-up update endpoint.
- Deliverables:

### 2.1 Contacts foundation data model

- Add `Contact` model in Prisma schema with required lifecycle fields and user/company ownership links.
- Required indexes for list ownership and company lookups.
- Migration for contact table and constraints.

### 2.2 Contacts module structure

- Add `src/modules/contacts/{controllers,services,dto,routes,types,validators}`.
- Standard response/error patterns and middleware usage.

### 2.3 Contacts API baseline

- `POST /api/v1/contacts` create
- `GET /api/v1/contacts` list
- `GET /api/v1/contacts/:id` read
- `PUT /api/v1/contacts/:id` update
- `DELETE /api/v1/contacts/:id` soft-delete

### 2.4 Contacts follow-up behavior

- `PATCH /api/v1/contacts/:id/follow-up` updates `lastContactAt` and/or `nextFollowUpAt`.
- Require at least one valid ISO timestamp with a timezone; reject empty updates, invalid dates, and null/non-string dates with `VALIDATION_ERROR`.
- Preserve the omitted date when only one date is supplied.

### 2.5 Phase 2 verification

- CRUD + follow-up update works for authenticated users.
- Contacts are filtered by owner (`userId`) and exclude soft-deleted records.
- Follow-up updates reject unauthenticated requests and return `CONTACT_NOT_FOUND` for missing, another user's, or soft-deleted contacts.

### 2.6 Progress

- [x] 2.1 Contacts foundation data model
- [x] 2.2 Contacts module structure
- [x] 2.3 Contacts API baseline
- [x] 2.4 Contacts follow-up behavior
- [x] 2.5 Phase 2 verification

Verification repair (2026-09-07):

- Fixed contact creation failing with Prisma `P2021`: the Contact table migration had not been applied.
- Moved the unapplied migration after the User/Company TEXT key conversion and applied `20260907000000_contacts` to the configured database.
- Verified fresh migration replay, a passing build, and authenticated contact CRUD, pagination, ownership, validation, follow-up updates, and soft-delete behavior. Integration fixtures are rolled back.
- Local setup now applies checked-in migrations with `npm.cmd run prisma:deploy` before starting the API; rerun the Contacts checks with `npm.cmd run test:contacts` in `server`.

2.4/2.5 verification (2026-09-08):

- Verified updates to either follow-up date and both dates, persistence, timezone offsets, authentication, ownership, and soft-delete exclusion.
- Fixed date coercion accepting impossible calendar dates and null/non-string values; these now return validation errors.
- `npm.cmd run test:contacts` passes the build and all nine integration scenarios (10 passing tests including the parent test). Fixtures are rolled back.
- Implementation and automated verification are complete. User manual testing has a separate checklist in [Contacts testing requests](server/docs/contacts-testing.md).

## Phase 3 - Applications module

Purpose: track job applications for each company, move them through the career pipeline, and retain stage history.

Stage model: `Wishlist -> Applied -> HR -> Technical -> Assignment -> Final -> Offer -> Rejected -> Archived`.

Required field set: `companyId`, `position`, `dateApplied`, `salary`, `timezone`, `recruiter`, `stage`, `notes`.

Phase 3 API decisions:

- `companyId` and `position` are required on create. The company must be active and owned by the authenticated user.
- `recruiter` is an optional Contact UUID, returned under the same field name; it must belong to the selected company and user and be active when assigned. Use `null` to clear it.
- `salary` is optional text, for example `USD 70,000-90,000/year`; include the currency and period in the text. Salary, recruiter, notes, and dateApplied default to `null`.
- `timezone` is a named timezone recognized by the runtime, such as `Asia/Yangon`, and defaults to `UTC`.
- `dateApplied` accepts a valid ISO timestamp with `Z` or an explicit offset. It is required for `APPLIED`, `HR`, `TECHNICAL`, `ASSIGNMENT`, `FINAL`, and `OFFER`; it can be null for `WISHLIST`, `REJECTED`, and `ARCHIVED`.
- Set `dateApplied` through the detail update before moving a Wishlist application into a stage requiring it; the stage endpoint does not invent an application date.
- All distinct valid stage moves are allowed, including skipping stages, moving backward, rejection, archiving, and reopening, subject to the application-date rule. Repeating the current stage changes nothing and creates no history entry.
- List date filters include their boundaries. Sorting by dateApplied always places null dates last; lists and history use an ID tie-breaker.

### 3.1 Applications foundation data model

Goal: an application belongs to one user and one company, with lifecycle fields and a durable stage history.

Deliverables:

- Add an `Application` Prisma model with the required field set above.
- Add UUID-generated `id`, `userId`, `createdAt`, `updatedAt`, and nullable `deletedAt`, matching the existing TEXT key types for User and Company relations.
- Add an `ApplicationStage` enum: `WISHLIST`, `APPLIED`, `HR`, `TECHNICAL`, `ASSIGNMENT`, `FINAL`, `OFFER`, `REJECTED`, `ARCHIVED`.
- Default new applications to `WISHLIST` when no stage is supplied.
- Define request formats and required/null rules before writing the migration: when `dateApplied` is required for a Wishlist application, how `salary` represents amounts/ranges and currency, the `timezone` format, and whether `recruiter` stores text or references a Contact.
- Add an `ApplicationStageHistory` model with `id`, `applicationId`, nullable `fromStage`, `toStage`, `changedById`, and `createdAt`.
- Add ownership and company relations, history relations, and useful indexes for owner/soft-delete, company, stage, application date, and history ordering.
- Create a migration ordered after the existing migrations and regenerate the Prisma client.

Acceptance checks:

- The new migration applies to the existing database without resetting data and replays successfully with the full migration history on a fresh schema.
- Application and history tables exist with matching foreign-key types.
- Payload examples document the chosen field formats and how a Wishlist record is created before applying.

### 3.2 Applications module structure and validation

Goal: follow the established module pattern and reject invalid requests consistently.

Deliverables:

- Add `src/modules/applications/{controllers,services,dto,routes,validators,types}`.
- Mount application routes at `/api/v1/applications`.
- Reuse JWT authentication, shared success/error envelopes, pagination, and soft-delete helpers.
- Validate create, update, list, and stage-transition payloads, including IDs, stage values, and the field formats established in 3.1.
- Validate dates before converting them so impossible calendar dates and invalid input types return `VALIDATION_ERROR`.
- Require the selected company to be active and owned by the authenticated user. If recruiter uses a Contact reference, require an active contact belonging to that user and company.

Acceptance checks:

- Missing authentication returns `401`.
- Invalid payloads return `400` with `VALIDATION_ERROR`.
- Users cannot create or reassign applications using another user's company or recruiter contact.

### 3.3 Applications API baseline

Goal: authenticated CRUD for application details.

Deliverables:

- `POST /api/v1/applications` creates an application.
- `GET /api/v1/applications` lists applications.
- `GET /api/v1/applications/:id` reads one application.
- `PUT /api/v1/applications/:id` updates application details; omitted fields stay unchanged, matching the existing modules.
- `DELETE /api/v1/applications/:id` soft-deletes an application.
- Take ownership from the authenticated user; clients cannot assign or change `userId`.
- Reserve stage changes on existing applications for the dedicated endpoint in 3.5; reject `stage` in the general update payload to prevent bypassing history.

Acceptance checks:

- Create returns `201`; read/list/update/soft-delete return `200` with the shared envelope.
- Missing, another user's, or soft-deleted applications return `404` with `APPLICATION_NOT_FOUND` on read/update/delete.
- Soft-delete sets `deletedAt` while retaining the application and its stage history.
- `ARCHIVED` is a pipeline stage; archived applications remain readable and listable until soft-deleted.

### 3.4 Applications list behavior

Goal: browse and filter the application pipeline with predictable pagination.

Deliverables:

- Support `page` and `limit` through the shared pagination contract.
- Filter by `companyId`, `stage`, and an optional `dateAppliedFrom`/`dateAppliedTo` range.
- Search application text in `position` and `notes`.
- Sort by at least `position`, `dateApplied`, `createdAt`, and `updatedAt`, with `order=asc|desc`.
- Use deterministic ordering with an ID tie-breaker and document how null application dates sort if 3.1 permits them.
- Always scope results and totals to the authenticated owner and `deletedAt: null`.

Acceptance checks:

- Lists return `data` and the standard pagination `meta`.
- Filters and search work together; totals reflect the same filters as the returned records.
- Invalid date ranges and unsupported sort/stage values return validation errors.
- Another user's and soft-deleted applications are excluded from both results and totals.

### 3.5 Application stage transitions

Goal: change pipeline stages while keeping application state and history consistent.

Deliverables:

- `PATCH /api/v1/applications/:id/stage` accepts a target `stage` and returns the updated application.
- Document allowed stage moves, including rejection/archive and whether skipping stages, moving backward, or reopening is supported. The stage list alone must not imply that every application must pass through every outcome.
- Validate the target stage and enforce the documented transition rules.
- Apply the stage update and its history entry in one database transaction.
- Record the actual previous stage, new stage, authenticated actor, and change time.
- Treat a repeated request for the current stage as a successful no-op without adding duplicate history.
- Ensure concurrent transitions cannot record a stale previous stage or leave the application and its history inconsistent.

Acceptance checks:

- A valid transition persists the new stage and exactly one corresponding history entry.
- Invalid/disallowed transitions leave both the application and history unchanged and return a documented error code.
- Missing, another user's, and soft-deleted applications cannot be transitioned.
- A failed history write rolls back the stage update; retry and concurrency checks preserve a consistent history.

### 3.6 Application stage history

Goal: read a reliable timeline of an application's pipeline changes.

Deliverables:

- `GET /api/v1/applications/:id/stage-history` returns paginated history using `page` and `limit`.
- Write an initial history entry when the application is created, with `fromStage: null` and the initial stage, in the same transaction as creation.
- Return `fromStage`, `toStage`, `changedById`, and `createdAt` for each entry.
- Order history from oldest to newest with a stable tie-breaker.
- Authorize history access through the owning application and exclude soft-deleted applications from this route.
- Keep history entries immutable through the public API.

Acceptance checks:

- Creation and subsequent transitions appear in chronological order with correct stages and actor IDs.
- Pagination returns the shared metadata and accurate totals.
- Another user's, missing, and soft-deleted application IDs return `404` with `APPLICATION_NOT_FOUND`.
- General application edits do not create stage-history entries.

### 3.7 Phase 3 verification and testing requests

Goal: complete automated verification and provide manual requests before checking off Phase 3.

Deliverables:

- Add an Applications integration test command following the Contacts test pattern, using disposable fixtures and cleanup/rollback.
- Cover CRUD, payload validation, ownership, company/recruiter rules, pagination, filters, search, and soft-delete behavior.
- Cover initial history, stage transitions, repeated transitions, transaction rollback, concurrency, and history access/pagination.
- Add a manual testing guide with authentication setup, request URLs, JSON bodies, expected responses, and a separate user checklist. Run deletion checks last.

Acceptance checks:

- `npm.cmd run build` passes.
- The Applications integration tests and existing Contacts regression tests pass.
- `npm.cmd run prisma:deploy` applies the checked-in migration and `npm.cmd run prisma:status` reports an up-to-date database.
- Existing Companies and Contacts workflows still work.
- Mark each progress item complete only after its implementation and acceptance checks pass; record manual testing results separately.

### 3.8 Progress

- [x] 3.1 Applications foundation data model
- [x] 3.2 Applications module structure and validation
- [x] 3.3 Applications API baseline
- [x] 3.4 Applications list behavior
- [x] 3.5 Application stage transitions
- [x] 3.6 Application stage history
- [x] 3.7 Phase 3 verification and testing requests

Phase 3 verification (2026-09-08):

- Applied `20260908000000_applications` to the configured database and regenerated the Prisma client. Migration status is up to date; database-to-schema comparison reports no difference.
- Build passes. All 13 Applications integration scenarios pass (14 tests including the parent), covering fresh migration replay, CRUD, filters/pagination, field rules, ownership, stage/history consistency, concurrent transitions, duplicate retries, rollback, and soft-delete.
- All nine Contacts regression scenarios pass (10 tests including the parent). Companies create/read/update/list/delete and Contacts interactions also pass in the Applications suite.
- Applications tests use and remove a unique temporary schema; Contacts fixtures are rolled back.
- Manual requests, expected results, and a separate user checklist are in [Applications testing requests](server/docs/applications-testing.md).
- [x] User confirmed all seven Applications endpoints pass manual testing (2026-09-08): create, list, read, update, stage transition, stage history, and soft-delete.

## Phase 4 - Tasks module

Purpose: organize daily job-search work, track completion, and carry recurring work forward.

Field set: `title`, `type`, `priority`, `dueDate`, `status`, `repeatPattern`.

Phase 4 API decisions:

- Require `title`; default `type` to `OTHER`, `priority` to `MEDIUM`, `status` to `TODO`, `repeatPattern` to `NONE`, and `dueDate` to null.
- Types: `JOB_APPLICATION`, `FOLLOW_UP`, `INTERVIEW`, `LEARNING`, `PROJECT`, `OTHER`.
- Priorities, in ascending order: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- Statuses: `TODO`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. Only the completion endpoint can set COMPLETED and completedAt.
- Support `NONE`, `DAILY`, `WEEKLY`, and `MONTHLY` repetition. Repeating tasks require a dueDate and use an additional named `timezone` field (default UTC) for calendar arithmetic.
- Completing a repeat creates exactly one TODO successor, one calendar day/week/month after that occurrence's due date in its timezone. Retain the completed occurrence. Overdue repeats advance one occurrence at a time; monthly repeats clamp to the target month's last valid day.
- Completion is final: completed records can be read or soft-deleted, but not edited/reopened. Cancelled tasks can be reopened through PUT before completion; completing a cancelled task returns a conflict.
- Today's endpoint accepts a timezone (default UTC), lists tasks due during that local calendar day, and returns status counts plus open overdue and unscheduled counts. Day ranges include their start and exclude the next midnight.

### 4.1 Tasks foundation data model

Goal: tasks belong to one user and retain completion and recurrence information.

Deliverables:

- Add Task and the type, priority, status, and repeat-pattern enums.
- Add UUID-generated TEXT id/userId, timestamps, nullable deletedAt/completedAt, and timezone.
- Link a generated occurrence to its source through a unique nullable recurrenceSourceId self-relation, preventing duplicate successors.
- Add ownership/soft-delete, due-date, status, type, and priority indexes.
- Add an ordered migration and regenerate the Prisma client.

Acceptance checks:

- The migration applies without resetting existing data and replays with the complete migration history on a fresh schema.
- Foreign keys match existing User key types; successor uniqueness is enforced by the database.

### 4.2 Tasks module structure and validation

Goal: use the existing module, authentication, and response patterns.

Deliverables:

- Add `src/modules/tasks/{controllers,services,dto,routes,validators,types}` and mount `/api/v1/tasks`.
- Validate IDs, enums, title, named timezones, ISO dates, pagination, and date ranges.
- Reject impossible dates, invalid types, unknown fields, empty updates, and client-supplied ownership/completion/recurrence-link fields.
- Enforce the required due date on repeating tasks, including partial updates against existing values.

Acceptance checks:

- Missing authentication returns 401; invalid inputs return 400 with a stable error code.
- Users cannot assign tasks to other owners or manufacture completed/recurrence records.

### 4.3 Tasks API baseline

Goal: authenticated CRUD with the same lifecycle rules as the earlier modules.

Deliverables:

- `POST /api/v1/tasks` creates a task.
- `GET /api/v1/tasks` lists tasks.
- `GET /api/v1/tasks/:id` reads a task.
- `PUT /api/v1/tasks/:id` updates details and editable statuses, preserving omitted fields.
- `DELETE /api/v1/tasks/:id` soft-deletes a task.
- Scope all actions to the authenticated owner and active records.

Acceptance checks:

- Create returns 201; successful read/list/update/delete return 200.
- Missing, another user's, and soft-deleted task IDs return 404 with TASK_NOT_FOUND.
- Deletion retains storage while excluding the task from normal access and totals.

### 4.4 Tasks list behavior

Goal: find relevant work with consistent filters, sorting, and pagination.

Deliverables:

- Support page/limit, status/type/priority/repeatPattern filters, title search, and inclusive dueDateFrom/dueDateTo filters.
- Sort by dueDate, priority, title, createdAt, or updatedAt with asc/desc order; use stable tie-breakers and put null due dates last.
- Default to earliest due date, then higher priority, then ID.
- Use the same ownership and soft-delete filters for records and totals.

Acceptance checks:

- Combined filters/search return accurate shared pagination metadata.
- Priority follows the documented priority order, not alphabetical order.
- Another user's and deleted tasks are absent from results and totals.

### 4.5 Completion and recurring tasks

Goal: complete work once, with safe retries and one next recurring occurrence.

Deliverables:

- `PATCH /api/v1/tasks/:id/complete` requires no body and returns `{ task, nextTask }` in data.
- Set status/completedAt on the server. Repeat requests return the same completed task and its existing active successor without duplicating work.
- Lock the task before completion, update, or deletion so concurrent mutations use consistent state.
- Complete and create a successor in one database transaction; copy title/type/priority/repeatPattern/timezone, calculate the next due date, and reset the successor to TODO.
- Handle calendar month lengths and timezone daylight-saving changes. Use the prior occurrence's due date as the schedule base.

Acceptance checks:

- One-time completion creates no successor; daily/weekly/monthly tasks create the expected occurrence.
- Duplicate and simultaneous completion requests create at most one successor.
- Failure to create the successor rolls back completion. Deleted successors are not recreated by retrying the completed source.
- Cancelled tasks cannot complete; completed tasks cannot be edited or reopened.

### 4.6 Today's tasks aggregate

Goal: show the user's current local day's workload and outstanding work.

Deliverables:

- `GET /api/v1/tasks/today?timezone=Asia/Yangon&page=1&limit=20` returns date/timezone, UTC range boundaries, paginated tasks, shared meta, and summary counts.
- Count dueToday plus TODO/IN_PROGRESS/COMPLETED/CANCELLED tasks due on that day. Separately count open tasks due before today and open tasks with no due date.
- Return all statuses in today's task list; exclude deleted and other-owner records everywhere.
- Resolve local calendar boundaries with timezone rules, including 23/25-hour daylight-saving days.
- Register the static today route before the :id route.

Acceptance checks:

- Local-midnight boundaries, timezone offsets, DST days, empty days, and pagination behave correctly.
- Summary totals reflect the full day rather than the current page.
- Overdue and unscheduled counts include only TODO/IN_PROGRESS records for the authenticated owner.

### 4.7 Phase 4 verification and sample requests

Goal: finish implementation and automated checks, then hand over copyable manual requests.

Deliverables:

- Add Tasks integration tests using an isolated temporary schema, including fresh migration replay, CRUD, validation, ownership, filtering, completion, recurrence, concurrency, rollback, and today's date boundaries.
- Run the build, Tasks tests, and Applications/Contacts regression suites.
- Apply the checked-in migration, verify migration status, and compare the database to the Prisma schema.
- Provide sample payloads, expected responses, and a separate manual testing checklist.

Acceptance checks:

- All required builds, tests, and migration checks pass before checking off this phase.
- Test fixtures are removed; manual completion is recorded only after the user reports it.

### 4.8 Progress

- [x] 4.1 Tasks foundation data model
- [x] 4.2 Tasks module structure and validation
- [x] 4.3 Tasks API baseline
- [x] 4.4 Tasks list behavior
- [x] 4.5 Completion and recurring tasks
- [x] 4.6 Today's tasks aggregate
- [x] 4.7 Phase 4 verification and sample requests

Phase 4 verification (2026-09-08):

- Applied `20260908010000_tasks` and regenerated the Prisma client. Migration status is up to date; database-to-schema comparison reports no difference.
- Build passes. All 15 Tasks integration scenarios pass (16 tests including the parent), covering migration replay/constraints, CRUD, merged-field validation, ownership, filters, priority/date sorting, completion, recurring calendar dates, concurrent retries, rollback, and timezone/daylight-saving boundaries.
- All 13 Applications and nine Contacts regression scenarios pass (14 and 10 tests including their parent tests). The Applications suite also verifies Companies workflows.
- Temporary Tasks/Applications schemas are removed; Contacts fixtures are rolled back.
- Sample requests, expected responses, recurrence rules, and the pending manual checklist are in [Tasks sample requests](server/docs/tasks-testing.md). User manual testing has not yet been reported for Phase 4.

## Phase 5 - Projects module

Purpose: track portfolio projects, record progress, and retain a timeline of meaningful updates.

Implementation status: complete and automatically verified (2026-09-08), following the user's request to implement the Phase 5 breakdown. Ready-to-use requests and the separate pending manual checklist are in [Projects sample requests](server/docs/projects-testing.md).

### Phase 5 API decisions

- Required create field: `name` (trimmed, 2-200 characters).
- Fields: `name`, nullable `githubUrl` and `liveDemoUrl`, `status`, `stack`, `screenshots`, nullable `lessonsLearned`, and integer `progress` (0-100).
- Defaults: `status: PLANNED`, `progress: 0`, empty stack/screenshots arrays, and null optional text/URLs.
- Statuses: `PLANNED`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`.
- PLANNED requires progress 0; IN_PROGRESS and ON_HOLD allow 0-99; COMPLETED requires 100; ARCHIVED retains any progress from 0-100. Check the final merged values on every create/progress update. No automatic status changes.
- URLs are plain absolute HTTP(S) strings, at most 2,048 characters. Screenshot entries are URL metadata; the API does not upload or fetch images.
- Stack: at most 30 trimmed entries of 1-50 characters; lowercase and deduplicate while retaining the first occurrence's order. Screenshot URLs: at most 20, trimmed and deduplicated; preserve URL case. Reject blank entries and null arrays. `lessonsLearned` allows up to 50,000 characters and preserves line breaks.
- General PUT edits project details. Existing `status` and `progress` change only through the dedicated progress endpoint, which writes activity history atomically.
- ARCHIVED is a status, separate from soft deletion. Archived projects remain readable and editable; reopening requires a valid status/progress pair.
- Server-owned fields: UUID `id`, `userId`, timestamps, `deletedAt`, and all generated activity fields. Never accept these from a project payload.

### 5.1 Projects foundation data model

Goal: store user-owned portfolio records and their activity history.

Deliverables:

- Add `Project` with the field set above, UUID-generated TEXT keys, User relation, timestamps, and nullable deletedAt.
- Add `ProjectStatus` and `ProjectActivityType` enums. Activity types: `CREATED`, `PROGRESS_UPDATE`, `COMMENT`.
- Add `ProjectActivity`: id, projectId, createdById, type, nullable fromStatus/toStatus, nullable fromProgress/toProgress, nullable content, and createdAt.
- CREATED records have null previous values and the project's initial status/progress. PROGRESS_UPDATE records store both previous and resulting values. COMMENT records have content and null state-change fields.
- Add ownership/soft-delete, status, date, and activity-ordering indexes, plus a GIN index for stack membership filters.
- Enforce progress range and status/progress consistency with database checks as well as request/service validation.
- Add a new migration after Tasks and regenerate the Prisma client.

Acceptance checks:

- Full migration history replays in a temporary schema; the new migration applies to the existing database without resetting records.
- Foreign keys match the current TEXT identifiers, and invalid progress/state combinations cannot be inserted directly.

### 5.2 Projects module structure and validation

Goal: follow the existing module architecture and reject malformed inputs consistently.

Deliverables:

- Add `src/modules/projects/{controllers,services,dto,routes,validators,types}` and mount `/api/v1/projects`.
- Reuse JWT authentication, AppError, success/pagination envelopes, and active-record filtering.
- Validate create, detail update, progress update, activity comment, UUID parameters, and list/history queries with strict schemas.
- Reject unknown fields, empty updates, invalid types, non-integer/out-of-range progress, malformed URLs, oversized text/arrays, and invalid status/progress combinations.
- Derive ownership and activity actor from the authenticated user.

Acceptance checks:

- Missing/invalid authentication returns 401. Invalid requests return 400 with `VALIDATION_ERROR`.
- Clients cannot set userId, fabricate activity actors/history, or bypass progress history using PUT.

### 5.3 Projects API baseline

Goal: consistent authenticated CRUD for portfolio details.

Deliverables:

- `POST /api/v1/projects` creates a project and its CREATED activity in one transaction.
- `GET /api/v1/projects` lists projects.
- `GET /api/v1/projects/:id` reads one project.
- `PUT /api/v1/projects/:id` updates name, URLs, stack, screenshots, and lessonsLearned. Omitted values remain unchanged; null clears optional text/URLs; empty arrays clear collections.
- `DELETE /api/v1/projects/:id` sets deletedAt and preserves the project and activity rows.
- Scope every operation to the authenticated owner and active rows. Return activity history separately to keep project detail payloads bounded.

Acceptance checks:

- Create returns 201; read/list/update/delete return 200. Delete returns `data: { id, deleted: true }`.
- Missing, another user's, and soft-deleted IDs return 404 with `PROJECT_NOT_FOUND`.
- General detail edits do not generate progress events. Deletion hides the project from normal list/read and activity routes.

### 5.4 Projects list behavior

Goal: find portfolio projects with predictable filters and pagination.

Deliverables:

- Support page/limit, exact status, single stack membership, and case-insensitive search over name/lessonsLearned.
- Normalize stack query values with the same trim/lowercase rules as writes; match full entries, not substrings.
- Support sortBy=name|progress|createdAt|updatedAt and order=asc|desc; default updatedAt desc, with id asc as tie-breaker.
- Return the shared top-level meta. Records and totals must use the same owner, deletion, and filter conditions and a consistent database snapshot.

Acceptance checks:

- Combined filters, empty results, page boundaries, stable ordering, and accurate totals work.
- Other-owner and soft-deleted projects never appear in records or totals.

### 5.5 Project progress and status updates

Goal: update progress consistently and retain an accurate history under retries/concurrency.

Deliverables:

- `PATCH /api/v1/projects/:id/progress` accepts status and/or progress plus optional content describing the change (trimmed, 1-5,000 characters when supplied).
- Require at least status or progress; merge omitted fields with the current record, then validate the status/progress rules above.
- Return the updated project in data. An unchanged status/progress pair is a no-op and creates no activity, even when content was supplied; use the comment endpoint for a standalone update message.
- Serialize project detail updates, progress updates, comment creation, and deletion through the same project row lock.
- Update the project and insert a PROGRESS_UPDATE event in one transaction. Preserve the sequence with monotonically increasing per-project activity timestamps plus an ID tie-breaker.

Acceptance checks:

- Starting, pausing, resuming, completing, archiving, and reopening work with valid status/progress pairs.
- Invalid merged values return 400 `VALIDATION_ERROR` without changing the project/history.
- Consecutive identical retries create no duplicate activity. Concurrent state changes produce a consistent from/to chain; an injected activity-write failure rolls back the project change.
- This is state-based retry behavior, not a general idempotency-key API: a later request after an intervening state change is a new change.

### 5.6 Project activity timeline

Goal: retrieve automatic progress events and add short manual project updates.

Deliverables:

- `GET /api/v1/projects/:id/activities?page=1&limit=20` returns immutable activity records with shared pagination, oldest first by createdAt then id.
- `POST /api/v1/projects/:id/activities` accepts only `{ content }` (trimmed, 1-5,000 characters), creates a COMMENT, and returns 201 with the activity in data.
- Authorize both routes through the active, user-owned project. Populate actor, event type, state snapshots, and timestamp on the server.
- Do not expose update/delete routes for activity events. Repeated comment POSTs create separate comments; no duplicate suppression is promised for comment creation.

Acceptance checks:

- Creation, progress/status changes, and manual comments appear in the correct order with accurate actor/state values.
- Detail-only PUT does not create a progress entry; comment creation does not change project progress/status.
- Missing/other-owner/deleted projects return 404 `PROJECT_NOT_FOUND` from both activity routes.

### 5.7 Phase 5 verification and testing requests

Goal: complete Projects before starting Notes implementation.

Deliverables:

- Add `test:projects` integration coverage using the existing disposable-schema test pattern.
- Cover migration replay/constraints, CRUD, validation, normalization, ownership, archive vs deletion, filters/pagination, progress/history, concurrent changes, no-op retries, and rollback.
- Run build, Projects integration tests, and Contacts/Applications/Tasks regressions. Exercise the existing Companies workflow as part of regression coverage.
- Apply the checked-in migration, regenerate, verify migration status/schema agreement, and restart a compiled API as needed.
- Reconcile [Projects sample requests](server/docs/projects-testing.md) with the implemented responses and remove the draft label only after verification.

Acceptance checks:

- All required automated checks and migration checks pass; temporary fixtures are removed.
- Manual request examples cover every endpoint and failure rules, with delete checks last. User manual checkboxes stay separate from implementation progress.

### 5.8 Progress

- [x] 5.1 Projects foundation data model
- [x] 5.2 Projects module structure and validation
- [x] 5.3 Projects API baseline
- [x] 5.4 Projects list behavior
- [x] 5.5 Project progress and status updates
- [x] 5.6 Project activity timeline
- [x] 5.7 Phase 5 verification and testing requests

Phase 5 verification (2026-09-08):

- Applied `20260908020000_projects` to the configured database and regenerated the Prisma client. Migration status is up to date; database-to-schema comparison reports no difference.
- Build and all 14 Projects integration scenarios pass (15 tests including the parent). Coverage includes fresh migration replay, database constraints, CRUD/defaults, strict validation, URL/array normalization, ownership, filters/pagination, progress/status history, comments, concurrent updates, no-op retries, injected-write rollback, and soft deletion.
- Contacts, Applications, and Tasks regression suites pass: 37 scenarios, 40 tests including the parent tests. Existing Companies workflows are exercised in Applications coverage.
- Disposable schemas were removed; Contacts fixtures were rolled back. The local compiled API was restarted to load the new routes.
- Sample requests and expected responses cover all eight endpoints in [Projects sample requests](server/docs/projects-testing.md). User manual completion has not yet been reported.

## Phase 6 - Notes module

Purpose: keep reusable Markdown notes, organize them with tags, and optionally attach each note to a CRM record.

Implementation status: complete and automatically verified (2026-09-08), following verified backend Phase 5. Ready-to-use requests and the separate pending manual checklist are in [Notes sample requests](server/docs/notes-testing.md).

### Phase 6 API decisions

- Required create fields: `title` (trimmed, 2-200 characters) and `content` (a non-whitespace Markdown string, at most 100,000 characters).
- Preserve content exactly, including indentation, line endings, code fences, and leading/trailing whitespace; use trimming only to check that content is not blank.
- Text must be valid Unicode without NUL characters, so it can be stored without alteration. Invalid text/field limits return 400 `VALIDATION_ERROR`; JSON bodies over the shared 1 MB transport limit return 413 `PAYLOAD_TOO_LARGE`.
- `tags` defaults to []; allow at most 20 input entries, each trimmed and 1-40 characters. Lowercase and deduplicate, preserving first occurrence order. Reject null arrays and blank entries; [] clears tags.
- `entity` defaults to null for a standalone note. Otherwise send the complete pair `{ "type": "PROJECT", "id": "<projectId>" }`.
- Supported types: COMPANY, CONTACT, APPLICATION, TASK, PROJECT. Notes, activities, and future modules are not valid link targets in this phase.
- One note has at most one target; an entity can have many notes. Omit entity on PUT to keep the link, supply a complete new pair to rebind, or use `entity: null` to detach.
- The selected target must be owned by the authenticated user and not soft-deleted. Archived, completed, or cancelled records are valid targets when they still exist and belong to that user.
- Response fields: id, userId, title, content, tags, entity, entityAvailable, createdAt, updatedAt, deletedAt. entityAvailable is true for an active owned target, false for an unavailable linked target, and null for a standalone note. It is read-only.
- Existing inline Company/Contact/Application notes and Project lessonsLearned remain their own fields. No automatic import, synchronization, or deletion of those values is included.

### 6.1 Notes foundation data model

Goal: store Markdown and tags with real ownership and entity relationships.

Deliverables:

- Add Note with UUID-generated TEXT id/userId, title, content, tags, timestamps, and nullable deletedAt.
- Internally store five nullable foreign keys: companyId, contactId, applicationId, taskId, projectId. Add a database check allowing at most one target FK to be non-null.
- Translate the public entity object to/from those columns in the Notes service/serializer. Do not expose the internal FK columns as additional editable fields.
- Add the User relation and reverse Note relations on each supported target; use SetNull for physical target deletion so a note becomes standalone. Normal API deletion remains soft deletion.
- Add owner/deletedAt, updatedAt, and entity lookup indexes, plus a GIN index for tag membership.
- Add a migration after Projects and regenerate the client.

Acceptance checks:

- Migrations replay in a temporary schema and apply without resetting existing records.
- Foreign keys reject nonexistent physical targets; the one-target check rejects multiple links. Existing entity notes fields retain their data and API behavior.

### 6.2 Notes module structure and validation

Goal: follow the existing architecture and validate the complete public contract.

Deliverables:

- Add `src/modules/notes/{controllers,services,dto,routes,validators,types}` and mount `/api/v1/notes` with JWT authentication.
- Add strict create/update/list schemas, UUID checks, and an allowlisted entity type mapping.
- Reject empty updates, unknown fields, whitespace-only content/title, invalid tags, incomplete entity objects, unsupported entity types, and client-supplied ownership/lifecycle/internal FK fields.
- Enforce the documented limits within the existing 1 MB JSON request limit; oversized transport bodies return the shared error envelope with 413 `PAYLOAD_TOO_LARGE`.

Acceptance checks:

- Missing/invalid authentication returns 401; malformed requests return 400 `VALIDATION_ERROR`.
- Markdown text is not altered during validation or serialization.

### 6.3 Notes API baseline

Goal: authenticated CRUD for standalone and linked notes.

Deliverables:

- `POST /api/v1/notes` creates a note and returns 201.
- `GET /api/v1/notes` lists notes with shared pagination.
- `GET /api/v1/notes/:id` reads one note.
- `PUT /api/v1/notes/:id` updates title/content/tags/entity; omitted fields remain unchanged and arrays replace the existing collection.
- `DELETE /api/v1/notes/:id` soft-deletes only the note and returns `data: { id, deleted: true }` with 200.
- Scope records and counts to the owner and deletedAt:null. Serialize update/delete with a row lock so a racing edit cannot return or modify an already deleted note.

Acceptance checks:

- Read/list/update return 200 with shared envelopes. Missing, another user's, and deleted note IDs return 404 `NOTE_NOT_FOUND`.
- Soft deletion retains the note row, hides it from access/totals, and does not modify its linked entity.

### 6.4 Entity binding and lifecycle

Goal: attach notes safely while keeping the user's writing accessible when related records are removed.

Deliverables:

- Validate target existence, ownership, and deletedAt when an entity is assigned/reassigned; return 404 `NOTE_ENTITY_NOT_FOUND` for missing, other-owner, or deleted targets without revealing which case occurred.
- Perform target validation and note write in one transaction. Lock a target row before checking its active state so link creation and the target's soft-delete serialize consistently; a target may become unavailable after a successful link if it is subsequently deleted.
- Retain the stored link when a target is soft-deleted. Notes remain readable/listable by their owner, with entityAvailable:false and no embedded target details.
- Allow content/tag/title edits of a note whose target is now unavailable when entity is omitted. Explicitly assigning the same deleted target still fails; entity:null or a valid replacement can detach/rebind it.
- Batch target availability lookups for list results to avoid one query per note. Apply ownership checks to availability as well as assignment.

Acceptance checks:

- Standalone notes, all five target types, reassignment, detachment, and invalid cross-owner binding are covered.
- A deleted target does not erase/hide the note or expose another user's record. A failed rebind leaves the note and original link unchanged.
- Concurrency tests cover linking/rebinding vs target deletion and note editing vs note deletion; no mutation resurrects a deleted note or target.

### 6.5 Notes tagging, search, and list behavior

Goal: find notes by their content, tags, or linked entity.

Deliverables:

- Support page/limit, a single normalized tag membership filter, and case-insensitive search over title and raw Markdown content.
- Support entityType and entityId together as an exact link filter. Require both or neither and validate the pair; unsupported/incomplete pairs return 400 `VALIDATION_ERROR`.
- List filters operate on stored links and never return target details. A valid pair with no owned active notes returns an empty list, even if the target is missing or unavailable; this preserves access to notes of soft-deleted targets without exposing target existence.
- Combine supplied filters with AND; search itself matches title OR content.
- Support sortBy=title|createdAt|updatedAt, order=asc|desc; default updatedAt desc and id asc tie-breaker. Return records/totals from a consistent snapshot.

Acceptance checks:

- Tag normalization, duplicate removal, full-tag matching, combined filters, entity filtering, raw-Markdown search, ordering, and pagination work with accurate totals.
- Another user's and soft-deleted notes are excluded everywhere.

### 6.6 Markdown storage contract

Goal: return faithful source text for the future client editor and preview.

Deliverables:

- Store Markdown as text and return it in JSON. Do not render HTML, execute code, or fetch URLs from note content.
- Document that a future client Markdown renderer must disable or sanitize raw HTML before inserting rendered content into the page. Backend storage is not an HTML sanitization guarantee.
- Include round-trip examples with headings, lists, fenced code, links, Unicode, and line breaks, plus maximum-length/blank-content cases.

Acceptance checks:

- Saved/retrieved content matches the submitted text exactly, including code indentation and Unicode.
- Search operates on the stored source; there is no HTML execution or external URL request during CRUD.

### 6.7 Phase 6 verification and testing requests

Goal: finish Notes with integration coverage and runnable user requests.

Deliverables:

- Add `test:notes` with the existing disposable-schema pattern. Cover migration/FK/check constraints, Markdown round trips, CRUD, validation, tags/search/pagination, all entity types, cross-owner access, target deletion, detach/rebind, and concurrency/rollback.
- Run build, Notes and Projects integration tests, and Contacts/Applications/Tasks regressions, including existing Companies workflows.
- Apply the migration, regenerate, verify migration status/schema agreement, and restart a compiled API as needed.
- Reconcile [Notes sample requests](server/docs/notes-testing.md) with the implemented API, then remove the draft label after verification.

Acceptance checks:

- All required checks pass and temporary schemas/fixtures are removed before marking completion.
- Every endpoint has a copyable request, expected result, and negative checks. Manual completion is recorded only after the user reports it.

### 6.8 Progress

- [x] 6.1 Notes foundation data model
- [x] 6.2 Notes module structure and validation
- [x] 6.3 Notes API baseline
- [x] 6.4 Entity binding and lifecycle
- [x] 6.5 Notes tagging, search, and list behavior
- [x] 6.6 Markdown storage contract
- [x] 6.7 Phase 6 verification and testing requests

Phase 6 verification (2026-09-08):

- Applied `20260908030000_notes` and regenerated the Prisma client. Migration status is up to date; database-to-schema comparison reports no difference. The compiled local API was restarted with Notes enabled.
- Build and all 19 Notes integration scenarios pass (20 tests including the parent), covering migration/FK/check constraints, exact Markdown round trips, CRUD, strict validation/body limits, tags/search/pagination, all five entity types, ownership, archive/completion rules, target deletion, detach/rebind, batched availability, rollback, and concurrent mutation/deletion.
- Contacts, Applications, Tasks, and Projects regression suites pass: 51 scenarios, 55 tests including parent tests. Existing Companies workflows are included. Total for this verification: 75 passing tests.
- Test schemas were removed and Contacts fixtures rolled back. No user manual completion has been reported; the separate checklist remains unchecked in [Notes sample requests](server/docs/notes-testing.md).
- Repaired a migration advisory-lock timeout left on an idle Neon pooled connection: released the identified stale lock, then applied the migration using the direct endpoint. `prisma.config.ts` now honors optional DIRECT_URL, otherwise derives a direct endpoint for Neon CLI operations. Runtime API connections continue using DATABASE_URL.

## Phase 7 - Calendar module

- Purpose: interviews + follow-ups + deadlines planning.
- Fields: title, type, startAt, endAt, sourceEntityId, reminders.
- APIs: range views + event list.

## Phase 8 - Documents module

- Purpose: resume, certificates, assignments, offer docs.
- Storage abstraction with metadata-first DB, Cloudinary later.
- APIs: upload metadata + list versions + soft delete.

## Phase 9 - Learning module

- Purpose: continuous growth tracking.
- Fields: topic, hoursSpent, totalHoursGoal, resources, notes, status.
- API: topic progress + streak summary.

## Phase 10 - Interviews

- Interviews: questions, answers quality, mistakes, result.

Completion checks:

- You can create/update/read interview entries tied to an application.
- You can track outcome + notes and read interview history.

## Phase 11 - Analytics

- Analytics: funnel by stage, response rate, country distribution.

Completion checks:

- API provides pipeline-level funnel and response metrics.
- Analytics can be consumed by dashboards with stable response envelopes.

## Execution rule

After each phase:

- Run `npm run build`.
- Run feature tests (unit/integration) for touched module.
- Confirm pagination + soft delete behavior for every list endpoint.
- Then move to next module.
