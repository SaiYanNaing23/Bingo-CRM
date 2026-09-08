# Client Phase 5 - Tasks and Today

Sign in and open All tasks. All API requests require a bearer token; requests with bodies also require `Content-Type: application/json`.

## One-time task

1. New task > title `Follow up with Sarah`; Type Follow-up; Priority High; Status To do; Repeat Does not repeat.
2. Select timezone `Asia/Yangon` and due date `2026-09-08 09:00`. For a Today check, use the actual current date in that timezone instead.
3. Create the task. Expect its detail page and save `<TASK_ID>`.
4. Edit the title/priority, save, and reload.
5. Complete task. Expect Completed and a completion time. Edit/complete controls are no longer offered; deletion remains available. One-time tasks do not create a next occurrence.

Create (201):

```http
POST /api/v1/tasks
```

```json
{
  "title": "Follow up with Sarah",
  "type": "FOLLOW_UP",
  "priority": "HIGH",
  "dueDate": "2026-09-08T02:30:00.000Z",
  "timezone": "Asia/Yangon",
  "status": "TODO",
  "repeatPattern": "NONE"
}
```

`02:30Z` equals `09:00` in Yangon. Optional dueDate may be `null` when Repeat is None. Backend task types do not create automatic links to a company/contact/application.

Edit before completion (200):

```http
PUT /api/v1/tasks/<TASK_ID>
```

```json
{ "title": "Send Sarah the updated resume", "priority": "URGENT", "status": "IN_PROGRESS" }
```

Complete (200):

```http
PATCH /api/v1/tasks/<TASK_ID>/complete
```

```json
{}
```

The response contains `data.task` and `data.nextTask`; nextTask is `null` for a one-time task. Completion retries are idempotent. Do not set `COMPLETED` through PUT.

## Repeating and cancelled tasks

Create a separate task with the same sample body but a different title and `repeatPattern: "DAILY"` (also supported: `WEEKLY`, `MONTHLY`). A repeating task requires a due date.

1. Complete it and expect an Open next task link.
2. Open the next occurrence. Expect To do, the same timezone/repeat settings, and the next date calculated by the backend.
3. Repeat scheduling starts from the previous due date. An overdue task's next occurrence may still be overdue. Monthly schedules adjust month-end dates to a valid day.
4. On an unfinished occurrence, edit Status to Cancelled and save. Expect Reopen task. Reopen it, then complete it.
5. Delete the previous completed occurrence and verify the next occurrence still exists.

Cancellation/reopening use PUT with one of these bodies:

```json
{ "status": "CANCELLED" }
```

```json
{ "status": "TODO" }
```

Completed tasks are read-only and cannot be reopened. The backend enforces this with `TASK_COMPLETED` (409). Completing a cancelled task before reopening returns `TASK_CANCELLED` (409).

## Lists and Today

```http
GET /api/v1/tasks?page=1&limit=20&status=TODO&priority=HIGH&sortBy=dueDate&order=asc
GET /api/v1/tasks/<TASK_ID>
GET /api/v1/tasks/today?timezone=Asia%2FYangon&page=1&limit=20
DELETE /api/v1/tasks/<TASK_ID>
```

No bodies are needed. Successful reads/deletion return 200; read after deletion returns 404.

All tasks supports search, type/priority/status/repeat filters, due-date bounds, sort, and pagination. Today uses the selected named timezone and refreshes each minute. Its response differs from a normal list: read `data.tasks`, `data.meta`, `data.summary`, `data.date`, and `data.range`.

Today definitions:

- Due today includes every status due within the selected local day.
- Open today combines To do and In progress due in that day.
- Completed · due today counts completed tasks due that day, regardless of when they were completed.
- Overdue counts open tasks due before the start of that local day.
- Open without a due date excludes completed/cancelled tasks.
- All summary counts cover all pages. Cancelled tasks due today remain visible with their status.

Manual checks:

- [ ] Create/read/edit and list controls work.
- [ ] One-time completion returns no next task.
- [ ] Repeating completion creates one next occurrence.
- [ ] Cancelling/reopening works; completed tasks remain read-only.
- [ ] Today matches the chosen timezone and includes all statuses.
- [ ] Empty, error, and missing-record states are clear.
- [ ] Delete removes only the selected occurrence.

Existing backend request guide: [Tasks API](../../server/docs/tasks-testing.md).
