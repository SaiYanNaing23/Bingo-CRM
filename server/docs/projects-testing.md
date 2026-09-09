# Phase 5: Projects sample requests

**Status: implemented and automatically verified (2026-09-08).** These requests match [backend Phase 5](../../agenda.md#phase-5---projects-module). All eight endpoints are mounted under `/api/v1/projects`. Build, 14 Projects integration scenarios, and the existing module regression suites pass. The manual checklist below is reserved for your own results.

## Setup

The Projects migration is already applied in this workspace and the local compiled API has been restarted. On another checkout or database, run these in `server/`:

```powershell
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run build
npm.cmd run start
```

A successful build alone does not create tables. Restart an existing compiled server after rebuilding. Run `npm.cmd run test:projects` for the build and disposable-schema integration suite; its fixtures are removed afterward.

Use your existing account to log in:

```http
POST http://localhost:4000/api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "your-account@example.com",
  "password": "your-password"
}
```

Replace the credentials with your own. Copy `data.token`; send these headers on every JSON write below:

```http
Authorization: Bearer <your_access_token>
Content-Type: application/json
```

GET and DELETE need Authorization and **no body**. Replace `<projectId>` with `data.id` from project creation. Use dedicated testing records; run deletion checks last, after any Notes checks that need the project.

## Endpoint checklist

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| POST | `/api/v1/projects` | Project create fields | 201, project in data |
| GET | `/api/v1/projects` | None | 200, data array + top-level meta |
| GET | `/api/v1/projects/:id` | None | 200, project in data |
| PUT | `/api/v1/projects/:id` | At least one detail field | 200, project in data |
| PATCH | `/api/v1/projects/:id/progress` | status and/or progress, optional content | 200, project in data |
| GET | `/api/v1/projects/:id/activities` | None | 200, activity array + top-level meta |
| POST | `/api/v1/projects/:id/activities` | content | 201, activity in data |
| DELETE | `/api/v1/projects/:id` | None | 200, `{ id, deleted: true }` in data |

## Field rules (5.1–5.2)

| Field | Rule |
| --- | --- |
| name | Required, trimmed, 2–200 characters |
| githubUrl, liveDemoUrl | Optional plain absolute HTTP(S) URL, max 2,048 characters, default null; null clears |
| status | PLANNED, IN_PROGRESS, ON_HOLD, COMPLETED, ARCHIVED; default PLANNED |
| progress | Integer 0–100; default 0 |
| stack | Array of up to 30 strings, 1–50 characters each; trimmed, lowercase, deduplicated; default [] |
| screenshots | Array of up to 20 plain HTTP(S) URLs; max 2,048 characters each, trimmed/deduplicated; default [] |
| lessonsLearned | Optional text, max 50,000 characters, default null; null clears |

Status and progress must agree:

| Status | Allowed progress |
| --- | --- |
| PLANNED | 0 |
| IN_PROGRESS | 0–99 |
| ON_HOLD | 0–99 |
| COMPLETED | 100 |
| ARCHIVED | 0–100 |

The server does not change status automatically. Send both fields together when a transition requires it. `userId`, lifecycle fields, and activity actor/type/state snapshots are server-controlled. Do not paste Markdown links into URL fields. Screenshot URLs are metadata; these endpoints do not upload or fetch images.

## Create (5.3)

```http
POST http://localhost:4000/api/v1/projects
```

```json
{
  "name": "BINGO CRM Portfolio",
  "githubUrl": "https://github.com/your-username/bingo-crm",
  "liveDemoUrl": "https://example.com/bingo-crm",
  "status": "IN_PROGRESS",
  "progress": 40,
  "stack": ["react", "typescript", "express", "postgresql"],
  "screenshots": ["https://example.com/images/bingo-crm-dashboard.png"],
  "lessonsLearned": "Keep API contracts consistent.\nValidate record ownership before linking entities."
}
```

Expected: **201**, `success: true`, saved fields plus id/userId/timestamps/deletedAt in data, and one CREATED activity. Replace the example URLs with your own when testing real portfolio content; URL validation does not assert that an external page exists.

Minimal create:

```json
{ "name": "Interview Practice App" }
```

Expected defaults: PLANNED, progress 0, stack/screenshots [], optional URLs/lessonsLearned null. Each POST creates a separate project.

## Read and update details (5.3)

```http
GET http://localhost:4000/api/v1/projects/<projectId>
```

Expected: **200**, project in data.

```http
PUT http://localhost:4000/api/v1/projects/<projectId>
```

```json
{
  "name": "BINGO CRM Portfolio v2",
  "stack": [" React ", "TYPESCRIPT", "react", "postgresql"],
  "liveDemoUrl": null,
  "screenshots": [],
  "lessonsLearned": "Use a shared module structure.\nAdd integration coverage for linked records."
}
```

Expected: **200**. stack becomes `["react", "typescript", "postgresql"]`; liveDemoUrl becomes null; screenshots becomes []; omitted fields stay unchanged. This does not add a progress activity.

PUT does not accept status or progress. Use the dedicated endpoint below.

## List, filter, search, and sort (5.4)

```http
GET http://localhost:4000/api/v1/projects?page=1&limit=10
```

```http
GET http://localhost:4000/api/v1/projects?status=IN_PROGRESS&stack=react&search=BINGO&sortBy=updatedAt&order=desc&page=1&limit=10
```

```http
GET http://localhost:4000/api/v1/projects?sortBy=progress&order=desc&page=1&limit=5
```

Expected: **200**, data array and top-level meta with page, limit, total, totalPages, hasNextPage, hasPreviousPage. Empty results follow the existing convention: total 0 and totalPages 1. Page size is capped by the shared configured maximum.

Filters combine with AND. Search matches name OR lessonsLearned, case-insensitively. stack matches a normalized full entry; `stack=React` matches react, while `stack=rea` does not. Sorting supports name, progress, createdAt, updatedAt; defaults to updatedAt descending with id ascending as a tie-breaker. Deleted and other-owner records are excluded from data and totals.

## Change progress and status (5.5)

For the main sample project, currently IN_PROGRESS at 40:

```http
PATCH http://localhost:4000/api/v1/projects/<projectId>/progress
```

```json
{
  "progress": 65,
  "content": "Projects CRUD is ready; integration checks are next."
}
```

Expected: **200**, progress 65 and status IN_PROGRESS. The timeline gets one PROGRESS_UPDATE with before/after status and progress. The response contains the project; retrieve history with GET activities.

Pause, using the same PATCH URL:

```json
{
  "status": "ON_HOLD",
  "content": "Paused while collecting feedback."
}
```

Expected: status ON_HOLD and progress remains 65.

Complete:

```json
{
  "status": "COMPLETED",
  "progress": 100,
  "content": "Implementation and verification are complete."
}
```

Archive:

```json
{ "status": "ARCHIVED" }
```

Expected: progress remains 100 and the record is still readable/listable. Archive is not deletion.

Reopen:

```json
{
  "status": "IN_PROGRESS",
  "progress": 80,
  "content": "Reopened for a new feature."
}
```

Repeat that exact request immediately: expect **200**, the same project state, and no extra activity. No-op progress requests ignore content; add a comment through the next endpoint if only the message is new. A repeat after an intervening state change is a new change, not an idempotency-key retry.

## Add a comment and read activity history (5.6)

```http
POST http://localhost:4000/api/v1/projects/<projectId>/activities
```

```json
{ "content": "Reviewed the portfolio with a recruiter and collected UI feedback." }
```

Expected: **201**, a COMMENT activity with projectId, createdById, content, createdAt, and null state-change fields. Project status/progress stay unchanged. Sending the same comment again creates another comment.

```http
GET http://localhost:4000/api/v1/projects/<projectId>/activities?page=1&limit=10
```

Expected: **200**, shared pagination with oldest-first activities. Each record has id, projectId, type, fromStatus, toStatus, fromProgress, toProgress, content, createdById, createdAt. CREATED has null previous state and the initial resulting state. Activity entries have no public edit/delete endpoints.

## Validation and access checks (5.7)

Run each invalid body separately against the indicated endpoint; these are intentionally invalid cases.

| Request | Body or condition | Expected |
| --- | --- | --- |
| Any Projects endpoint | Missing/invalid Bearer token | 401 |
| POST projects | `{ "name": "" }` | 400 VALIDATION_ERROR |
| POST projects | `{ "name": "Test project", "progress": 25 }` | 400; default PLANNED requires progress 0 |
| POST projects | `{ "name": "Test project", "githubUrl": "[link](https://example.com)" }` | 400 VALIDATION_ERROR |
| POST projects | `{ "name": "Test project", "stack": [""] }` | 400 VALIDATION_ERROR |
| PUT project | `{}` | 400 VALIDATION_ERROR |
| PUT project | `{ "status": "COMPLETED", "progress": 100 }` | 400; use progress endpoint |
| PATCH progress | `{ "progress": 101 }` or `{ "progress": 2.5 }` | 400 VALIDATION_ERROR |
| PATCH progress on IN_PROGRESS/80 | `{ "status": "COMPLETED" }` | 400; merged progress must be 100 |
| PATCH progress on IN_PROGRESS/80 | `{ "progress": 100 }` | 400; also send status COMPLETED |
| PATCH progress | `{ "content": "Message only" }` | 400; use POST activities |
| POST activities | `{ "content": "   " }` | 400 VALIDATION_ERROR |
| Any write | Add userId, deletedAt, or fabricated history fields | 400 VALIDATION_ERROR |
| GET project | Use `not-a-uuid` as the ID | 400 VALIDATION_ERROR |
| GET list | `?page=0`, `?limit=0`, or `?status=UNKNOWN` | 400 VALIDATION_ERROR |
| Read/update/progress/delete/activity routes | A valid UUID that is missing, belongs to another account, or is soft-deleted | 404 PROJECT_NOT_FOUND |

Verify failed progress/comment writes leave the project and history unchanged. For ownership checks, use a second test account and its real project ID; do not use the user's existing records as fixtures.

## Soft-delete — last

```http
DELETE http://localhost:4000/api/v1/projects/<projectId>
```

No body. Expected **200**:

```json
{
  "success": true,
  "data": { "id": "<projectId>", "deleted": true }
}
```

Then GET, PUT, PATCH progress, DELETE again, and both activity routes must return **404 PROJECT_NOT_FOUND**. List totals exclude the deleted project. Its row and timeline remain stored. Attached Notes retain their text and link, with entityAvailable:false; see [Notes lifecycle checks](notes-testing.md#linked-record-deletion-64).

## Manual checklist

- [ ] All eight endpoints work with my token.
- [ ] Create defaults, detail edits, null clearing, arrays, and URL rules behave as documented.
- [ ] Search, filters, sorting, and pagination return correct records and totals.
- [ ] Progress/status changes and activity history agree; identical state retries add no event.
- [ ] Comments work and do not change progress.
- [ ] Validation, authentication, and other-account access checks pass.
- [ ] Archive/reopen and soft deletion behave as documented.

These checkboxes record the user's manual results only. Automated implementation verification is recorded separately in the backend agenda.
