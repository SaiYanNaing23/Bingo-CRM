# DevTrack CRM Backend Agenda

Goal: build a production-grade backend first for a career + project CRM, then wire frontend modules cleanly.

Client roadmap: [client-agenda.md](./client-agenda.md). This file remains the backend agenda.

Workstream status (2026-09-08): backend implementation is paused after Phase 4 at the user's request. Client Phases 0-5 are implemented and verified; see the separate client agenda. Backend Phases 5-11 remain future work. Backend Phase 4 implementation and automated checks are complete; its user manual testing remains pending as recorded below.

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
- [ ] Phase 5 - Projects module
- [ ] Phase 6 - Notes module
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

- Purpose: portfolio tracking.
- Fields: name, githubUrl, liveDemoUrl, status, stack, screenshots, lessonsLearned.
- APIs: CRUD + filter by status/stack + progress.

## Phase 6 - Notes module

- Purpose: reusable markdown notes connected to entities.
- Features: markdown storage, tagging, entity binding, search by text.

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
