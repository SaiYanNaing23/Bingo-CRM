# Phase 4: Tasks sample requests

## Setup and field rules (4.1-4.2)

Use `http://localhost:4000` as the API base URL. Restart a compiled server after the
new build if you run `npm.cmd run start`; the development server reloads source changes.

Use these headers for JSON requests:

```http
Authorization: Bearer <your_access_token>
Content-Type: application/json
```

GET, DELETE, and completion requests need Authorization and no request body.
Copy `data.id` from creation and replace `<taskId>` below. Run deletion tests last.

| Field | Values and defaults |
| --- | --- |
| title | Required text, 2-200 characters |
| type | JOB_APPLICATION, FOLLOW_UP, INTERVIEW, LEARNING, PROJECT, OTHER; default OTHER |
| priority | LOW, MEDIUM, HIGH, URGENT; default MEDIUM |
| dueDate | Valid ISO timestamp with Z or an explicit offset; optional, defaults to null |
| timezone | Named timezone such as Asia/Yangon; default UTC |
| status | TODO, IN_PROGRESS, CANCELLED on create/update; default TODO |
| repeatPattern | NONE, DAILY, WEEKLY, MONTHLY; default NONE |

COMPLETED is a readable/filterable status set only by the completion endpoint.
The server controls userId, completedAt, recurrenceSourceId, timestamps, and deletedAt.
Repeating tasks require dueDate. Timezone controls repeat calendar arithmetic;
dueDate is still an explicit instant and responses serialize it in UTC.

## 4.3: Create a task

```http
POST http://localhost:4000/api/v1/tasks
```

```json
{
  "title": "Follow up with Sarah about the backend role",
  "type": "FOLLOW_UP",
  "priority": "HIGH",
  "dueDate": "2026-09-08T09:00:00.000Z",
  "timezone": "Asia/Yangon",
  "status": "TODO",
  "repeatPattern": "NONE"
}
```

Expected: **201**, `success: true`, and the saved task in `data`. Save `data.id`.

A minimal task can be created with:

```json
{ "title": "Review job boards" }
```

This creates an unscheduled TODO task with the defaults above.

## 4.3: Read and update

```http
GET http://localhost:4000/api/v1/tasks/<taskId>
```

No body. Expected: **200**, with the task.

```http
PUT http://localhost:4000/api/v1/tasks/<taskId>
```

```json
{
  "title": "Send Sarah an updated resume",
  "priority": "URGENT",
  "status": "IN_PROGRESS"
}
```

Expected: **200**. Omitted fields stay unchanged. A non-repeating due date may be
cleared with `{"dueDate":null}`. To remove a repeating task's due date, also set
repeatPattern to NONE in the same update.

To cancel an open task, PUT `{"status":"CANCELLED"}`. To reopen a cancelled task,
PUT `{"status":"TODO"}` or `{"status":"IN_PROGRESS"}`. Completed tasks are final:
PUT returns **409**, TASK_COMPLETED; use the next occurrence or create a new task.

## 4.4: List, filter, search, and sort

```http
GET http://localhost:4000/api/v1/tasks?page=1&limit=10
```

```http
GET http://localhost:4000/api/v1/tasks?status=IN_PROGRESS&type=FOLLOW_UP&priority=URGENT&repeatPattern=NONE&search=Sarah&sortBy=dueDate&order=asc&page=1&limit=10
```

```http
GET http://localhost:4000/api/v1/tasks?dueDateFrom=2026-09-01T00:00:00.000Z&dueDateTo=2026-09-30T23:59:59.999Z
```

Expected: **200**, `data` as an array and shared pagination `meta`. All filters can
be combined. Date bounds are inclusive; title search ignores case. Sort by dueDate,
priority, title, createdAt, or updatedAt. Default order is dueDate ascending, higher
priority first when dates tie, then ID. Null due dates always sort last.

Only your non-deleted tasks and their totals are returned. Completed and cancelled
tasks remain listable unless filtered out or soft-deleted.

## 4.5: Complete a task

```http
PATCH http://localhost:4000/api/v1/tasks/<taskId>/complete
```

No body is required; `{}` is also accepted. Expected: **200**, with:

- `data.task`: the full completed task, status COMPLETED and a server-set completedAt.
- `data.nextTask`: null for a one-time task, or the full new TODO occurrence for a repeat.

Repeat this request to test retries. completedAt/updatedAt stay unchanged and an
existing successor is returned instead of creating a duplicate. Concurrent requests
are serialized, and the database also enforces one successor per source task.

Completing a cancelled task returns **409**, TASK_CANCELLED. Reopen it first using PUT.

## 4.5: Create and complete a recurring task

```http
POST http://localhost:4000/api/v1/tasks
```

```json
{
  "title": "Practice interview questions",
  "type": "LEARNING",
  "priority": "MEDIUM",
  "dueDate": "2026-09-08T02:30:00.000Z",
  "timezone": "Asia/Yangon",
  "status": "TODO",
  "repeatPattern": "DAILY"
}
```

Complete the new task using its returned ID. The original stays COMPLETED; nextTask
is TODO, has dueDate `2026-09-09T02:30:00.000Z`, and its recurrenceSourceId points to
the original. The task's title, type, priority, repeatPattern, and timezone carry over.

DAILY advances one local calendar day, WEEKLY seven local calendar days, and MONTHLY
one local month. Overdue repeats advance one occurrence at a time from the previous
due date rather than from completion time. Each month uses the previous due date:
January 31 becomes February 28 (29 in a leap year), then March 28 (or 29).

Calendar arithmetic uses PostgreSQL's [date/time and timezone rules](https://www.postgresql.org/docs/current/functions-datetime.html),
including month-end clamping and daylight-saving transitions.

Completion and successor creation use one transaction. If successor creation fails,
the original task remains open. Deleting a completed occurrence does not delete its
successor. Deleting a successor then retrying the source's completion returns
nextTask null and does not recreate it. Set repeatPattern to NONE on an open occurrence
to stop further repetition, or cancel/delete that open occurrence.

## 4.6: Today's tasks and summary

```http
GET http://localhost:4000/api/v1/tasks/today?timezone=Asia/Yangon&page=1&limit=20
```

No body. Expected: **200**. The success response's `data` contains:

| Property | Meaning |
| --- | --- |
| date | Today's calendar date in the requested timezone |
| timezone | The requested timezone; default UTC |
| range.from / range.to | UTC instants for local midnight and the following midnight |
| tasks | Paginated tasks due in that day, including all statuses |
| meta | Shared pagination metadata for all tasks due in that day |
| summary.dueToday | Total non-deleted tasks due in that local day |
| summary.pendingToday | TODO tasks due in that day |
| summary.inProgressToday | IN_PROGRESS tasks due in that day |
| summary.completedToday | COMPLETED tasks due in that day, regardless of completion timestamp |
| summary.cancelledToday | CANCELLED tasks due in that day |
| summary.overdue | TODO/IN_PROGRESS tasks due before today's local midnight |
| summary.unscheduled | TODO/IN_PROGRESS tasks without a dueDate |

Summary counts cover the whole day, not just the current page. Overdue and unscheduled
tasks contribute to their summary counts but are not included in the due-today list.
The day includes range.from and excludes range.to; a task exactly at the following
midnight belongs to the next day. DST days can be 23 or 25 hours.

For testing today, set a task's dueDate to a timestamp within the returned range.
The fixed example dates above may not be today when you run these requests. To inspect
overdue or unscheduled tasks individually, use the regular list endpoint and date/status filters.

## 4.3 / 4.7: Soft-delete last

```http
DELETE http://localhost:4000/api/v1/tasks/<taskId>
```

No body. Expected: **200**:

```json
{
  "success": true,
  "data": { "message": "Task deleted" }
}
```

The row remains with deletedAt set. GET, PUT, complete, and repeated DELETE for that
ID return **404**, TASK_NOT_FOUND. Lists and today's summary exclude it.

## 4.7: Negative test requests

| Request | Expected |
| --- | --- |
| Any Tasks endpoint without Authorization | 401, AUTH_MISSING_TOKEN |
| GET/PUT/DELETE/complete for another owner's or missing UUID | 404, TASK_NOT_FOUND |
| POST with `{"title":"Repeat task","repeatPattern":"DAILY"}` | 400, VALIDATION_ERROR |
| PUT clearing the due date while still repeating | 400, TASK_DUE_DATE_REQUIRED |
| POST/PUT with `"dueDate":"2026-02-30T09:00:00.000Z"` | 400, VALIDATION_ERROR |
| POST/PUT with dueDate true, 123, or a date-only string | 400, VALIDATION_ERROR |
| POST/PUT with an unknown enum, timezone, or client-supplied userId/completedAt | 400, VALIDATION_ERROR |
| POST/PUT with status COMPLETED | 400, VALIDATION_ERROR |
| PUT with `{}` | 400, VALIDATION_ERROR |
| PATCH complete with `{"completedAt":"2026-09-08T09:00:00.000Z"}` | 400, VALIDATION_ERROR |
| List with page=0, unsupported sorting, or a reversed date range | 400, VALIDATION_ERROR |
| GET today with timezone=Invalid/Zone | 400, VALIDATION_ERROR |
| Complete a cancelled task | 409, TASK_CANCELLED |
| Edit/reopen a completed task | 409, TASK_COMPLETED |

## Manual checklist

- [ ] Create, read, and update a task.
- [ ] Check list pagination, filters, search, and priority/date sorting.
- [ ] Complete a one-time task and retry without changing completion timestamps.
- [ ] Complete a recurring task and verify one successor with the expected due date.
- [ ] Check today's timezone, task list, and summary counts.
- [ ] Check invalid payloads, authentication, and another account's access.
- [ ] Soft-delete and confirm exclusion from normal access and totals.

Run automated checks from `server`:

```powershell
npm.cmd run test:tasks
npm.cmd run test:applications
npm.cmd run test:contacts
```

Tasks and Applications tests replay all migrations in unique temporary schemas and
remove those schemas afterward. They include real transactions, concurrency, and
injected write failures. Contacts test fixtures are rolled back. Agenda completion
marks describe implementation and automated verification; this checklist records
your separate manual results.
