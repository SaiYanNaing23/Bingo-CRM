# Phase 3: Applications testing requests

The Applications API tracks job applications, their current stage, and stage history.

## Setup and field rules (3.1-3.2)

Run the API at `http://localhost:4000`. Restart it after building if you use
`npm.cmd run start`; `npm.cmd run dev` reloads source changes.

Use these headers for JSON requests:

```http
Authorization: Bearer <your_access_token>
Content-Type: application/json
```

GET and DELETE need the Authorization header and no body. Replace `<applicationId>`
in the requests below with the ID returned by POST. Run deletion tests last.

| Field | Format and behavior |
| --- | --- |
| `companyId` | Required UUID of an active company belonging to your account |
| `position` | Required text, 2-200 characters |
| `dateApplied` | ISO timestamp with `Z` or an offset; defaults to null |
| `salary` | Optional text, for example `USD 70,000-90,000/year`; defaults to null |
| `timezone` | Named timezone such as `Asia/Yangon`; defaults to `UTC` |
| `recruiter` | Optional UUID of an active Contact belonging to this company and account; defaults to null |
| `stage` | Defaults to `WISHLIST`; use one of the uppercase values below |
| `notes` | Optional text; defaults to null |

Stages: `WISHLIST`, `APPLIED`, `HR`, `TECHNICAL`, `ASSIGNMENT`, `FINAL`, `OFFER`,
`REJECTED`, `ARCHIVED`.

`dateApplied` is required for APPLIED through OFFER. WISHLIST, REJECTED, and ARCHIVED
may have a null date. Dates serialize in UTC. Nullable details can be cleared with
`null`, except dateApplied while the current stage requires a date.

Unknown body fields, including userId and deletedAt, are rejected. Ownership comes
from your JWT. Recruiter is a Contact ID, not a person's name; use null if unknown.

## 3.3: Create, read, update, and soft-delete

Create a Wishlist application for your existing company:

```http
POST http://localhost:4000/api/v1/applications
```

```json
{
  "companyId": "f5558c03-3d18-481b-868d-7b90af0e2af1",
  "position": "Backend Engineer",
  "dateApplied": null,
  "salary": "USD 70,000-90,000/year",
  "timezone": "Asia/Yangon",
  "recruiter": null,
  "stage": "WISHLIST",
  "notes": "Found the role on the company career page."
}
```

Expected: **201**, `success: true`, the saved application in `data`, and one initial
stage-history entry. Save `data.id` as `<applicationId>`. Replace the company ID if
the example company was deleted or belongs to another account.

You may supply an active Contact ID in `recruiter` to link your recruiter. A minimum
Wishlist create body needs only companyId and position. To create directly at APPLIED
or a later interview/offer stage, supply a valid dateApplied.

Read the application:

```http
GET http://localhost:4000/api/v1/applications/<applicationId>
```

Expected: **200**, with the saved application.

Update details and record the date you applied:

```http
PUT http://localhost:4000/api/v1/applications/<applicationId>
```

```json
{
  "position": "Senior Backend Engineer",
  "dateApplied": "2026-09-08T09:00:00.000Z",
  "notes": "Submitted my resume through the company website."
}
```

Expected: **200**. Omitted fields stay unchanged. Stage remains WISHLIST and no stage
history is added by this detail edit. PUT rejects a stage field; use 3.5 to change it.

To move the application to another company, provide a recruiter belonging to that
company or set recruiter to null in the same PUT. The existing recruiter must not
remain linked across unrelated companies.

Soft-delete after completing the other checks:

```http
DELETE http://localhost:4000/api/v1/applications/<applicationId>
```

No body. Expected: **200**:

```json
{
  "success": true,
  "data": { "message": "Application deleted" }
}
```

## 3.4: List, filter, search, and sort

```http
GET http://localhost:4000/api/v1/applications?page=1&limit=10
```

Combine filters:

```http
GET http://localhost:4000/api/v1/applications?companyId=f5558c03-3d18-481b-868d-7b90af0e2af1&stage=APPLIED&search=backend&sortBy=dateApplied&order=desc&page=1&limit=10
```

Filter an inclusive application-date range:

```http
GET http://localhost:4000/api/v1/applications?dateAppliedFrom=2026-09-01T00:00:00.000Z&dateAppliedTo=2026-09-30T23:59:59.999Z
```

Expected: **200**, an array in `data`, and pagination `meta` including page, limit,
total, totalPages, hasNextPage, and hasPreviousPage. Totals use the same filters.
Search matches position and notes without case sensitivity. Supported sortBy values
are position, dateApplied, createdAt, and updatedAt. Default sorting is updatedAt
descending; dateApplied nulls sort last in either direction.

Only your active records are listed. An ARCHIVED stage record remains visible until
soft-deleted. An empty result returns an empty array and total 0.

## 3.5: Change application stage

```http
PATCH http://localhost:4000/api/v1/applications/<applicationId>/stage
```

```json
{ "stage": "APPLIED" }
```

Expected: **200**, with `data.stage: "APPLIED"`. Set dateApplied first using PUT if
it is still null; otherwise the API returns **400**, `APPLICATION_DATE_REQUIRED`.

Try the same endpoint with each body, one request at a time:

```json
{ "stage": "HR" }
```

```json
{ "stage": "TECHNICAL" }
```

```json
{ "stage": "OFFER" }
```

All distinct valid stage moves are allowed, including skipping, moving backward,
rejection, archiving, and reopening, subject to the dateApplied rule. Every change
adds one history entry. Repeating the current stage returns **200** without changing
updatedAt or adding another history entry. Stage and history writes are atomic.

## 3.6: Read stage history

```http
GET http://localhost:4000/api/v1/applications/<applicationId>/stage-history?page=1&limit=10
```

Expected: **200**, with entries in chronological order and pagination metadata.
Each entry has id, applicationId, fromStage, toStage, changedById, and createdAt.

After the sequence above, the stage pairs should be:

| fromStage | toStage |
| --- | --- |
| null | WISHLIST |
| WISHLIST | APPLIED |
| APPLIED | HR |
| HR | TECHNICAL |
| TECHNICAL | OFFER |

The initial entry and the application are created together. changedById identifies
the authenticated user. Public APIs do not edit or delete individual history entries.

## 3.7: Validation and ownership checks

| Test | Expected |
| --- | --- |
| Any Applications request without Authorization | 401, `AUTH_MISSING_TOKEN` |
| POST with another user's or deleted company | 404, `APPLICATION_COMPANY_NOT_FOUND` |
| POST/PUT assigning another company's, another user's, or deleted recruiter Contact | 404, `APPLICATION_RECRUITER_NOT_FOUND` |
| POST with `"dateApplied":"2026-02-30T09:00:00.000Z"` | 400, `VALIDATION_ERROR` |
| POST at APPLIED with no dateApplied | 400, `VALIDATION_ERROR` |
| POST with recruiter name instead of a Contact UUID | 400, `VALIDATION_ERROR` |
| POST with numeric salary or an invalid timezone | 400, `VALIDATION_ERROR` |
| PUT with `{}` or `{"stage":"HR"}` | 400, `VALIDATION_ERROR` |
| PUT clearing dateApplied while at APPLIED through OFFER | 400, `APPLICATION_DATE_REQUIRED` |
| PATCH stage with `{}` or `{"stage":"UNKNOWN"}` | 400, `VALIDATION_ERROR` |
| GET with malformed ID, unsupported sort field, page=0, or reversed date range | 400, `VALIDATION_ERROR` |
| Read/update/delete/transition/history using another account's JWT | 404, `APPLICATION_NOT_FOUND` |
| List using another account's JWT | Only that account's active applications and totals |

After soft-delete, read/update/delete/stage/history requests for that ID return
**404**, `APPLICATION_NOT_FOUND`, and lists/totals exclude it. The application and
its history remain stored. Invalid requests must not modify application data/history.

## Manual checklist

- [x] All seven Applications endpoints tested successfully, confirmed by the user on 2026-09-08: create, list, read, update, stage transition, stage history, and soft-delete.

The detailed behavior cases below are available for additional manual checks; they are covered by the automated suite.

- [ ] Create a Wishlist application and read its initial history.
- [ ] Update details and verify omitted fields are preserved.
- [ ] Assign an active recruiter from the correct company.
- [ ] Verify list pagination, filters, search, and sorting.
- [ ] Change stages and verify chronological history.
- [ ] Repeat the current stage and verify no duplicate entry.
- [ ] Verify invalid dates, stages, IDs, and payloads.
- [ ] Verify authentication and ownership with a second account.
- [ ] Soft-delete last and verify exclusion from all normal access.

Automated checks from `server`:

```powershell
npm.cmd run test:applications
npm.cmd run test:contacts
```

The Applications checks replay all migrations in a unique temporary database schema,
exercise real HTTP requests and concurrent transactions, inject history-write failures
to verify rollback, and drop that test schema afterward. For Neon they use the direct
endpoint of the same database so each test connection can select its isolated schema.
The Contacts checks roll back their fixtures. The agenda checkmarks record implementation
and automated verification; the checklist above is for your manual results.
