# Phase 7: Calendar sample requests

This guide matches [backend Phase 7](../../agenda.md#phase-7---calendar-module). Calendar provides seven JWT-protected endpoints under `/api/v1/calendar`. Automated results are recorded in the agenda; the manual checklist below is reserved for your results.

## Setup and endpoints

In `server/`, apply migrations, generate Prisma, build, and start the API:

```powershell
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run build
npm.cmd run start
```

Run `npm.cmd run test:calendar` for the build and integration suite in a unique temporary schema. Tests replay every migration, use dedicated fixtures, and remove the schema afterward. The Prisma CLI uses the configured direct database connection as explained in [the server runbook](../src/README.md).

After building, run all implemented module suites sequentially to limit concurrent connections to the hosted database:

```powershell
node --test --test-concurrency=1 tests/contacts.integration.test.cjs tests/applications.integration.test.cjs tests/tasks.integration.test.cjs tests/projects.integration.test.cjs tests/notes.integration.test.cjs tests/calendar.integration.test.cjs
```

Log in through `POST /api/v1/auth/login` with your own email/password. Send `Authorization: Bearer <token>` on all Calendar requests and `Content-Type: application/json` on POST/PUT. GET and DELETE have no body. Examples below use the local API at `http://localhost:4000/api/v1`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/calendar/events` | Create an event |
| GET | `/calendar/events` | List, search, filter, and sort events |
| GET | `/calendar/events/:id` | Read one event |
| PUT | `/calendar/events/:id` | Partially update an event |
| DELETE | `/calendar/events/:id` | Soft-delete an event |
| GET | `/calendar/range` | Day, week, month, or custom overlap view |
| GET | `/calendar/reminders` | List reminder times within a window |

## Field rules

| Field | Rule |
| --- | --- |
| title | Required; trimmed; 2–200 characters; valid Unicode without NUL |
| type | INTERVIEW, FOLLOW_UP, DEADLINE, OTHER; defaults to OTHER |
| startAt | Required ISO timestamp with Z or an explicit offset; maximum millisecond precision |
| endAt | Null or omitted for a point event; otherwise strictly later than startAt |
| timezone | Supported named timezone; defaults to UTC; controls display metadata, not reinterpretation of timestamp offsets |
| sourceEntityType | COMPANY, CONTACT, APPLICATION, TASK, PROJECT; optional together with sourceEntityId |
| sourceEntityId | UUID of an owned active source; optional together with sourceEntityType |
| reminders | Up to five supplied integer minute offsets, each 0–10,080; duplicates removed and values sorted; defaults to [] |

Times must stay within UTC years 0001–9999, including calculated reminders and named range boundaries. UTC instants are returned in ISO format. Unknown fields, including userId, id, timestamps controlled by the server, and internal foreign-key columns, are rejected. Arrays/objects cannot replace string query parameters.

Calendar events are saved plans. Linking an event does not change or automatically follow a task dueDate or a contact nextFollowUpAt. Existing task/contact schedules are not automatically inserted into Calendar. The later Interviews module can use APPLICATION links without requiring an Interview table now.

## 7.3 Create, read, edit, and delete

Create a timed interview:

```http
POST /api/v1/calendar/events
```

```json
{
  "title": "Technical interview",
  "type": "INTERVIEW",
  "startAt": "2026-10-08T09:00:00+06:30",
  "endAt": "2026-10-08T10:00:00+06:30",
  "timezone": "Asia/Yangon",
  "reminders": [60, 15, 0, 60]
}
```

Expected: 201 with `{ "success": true, "data": { ... } }`. Save `data.id` as `<eventId>`. The response has startAt `2026-10-08T02:30:00.000Z`, endAt `2026-10-08T03:30:00.000Z`, reminders `[0,15,60]`, sourceEntityType/sourceEntityId/sourceAvailable all null, and owner/lifecycle fields. Internal companyId/contactId/applicationId/taskId/projectId columns are omitted.

Create a point deadline:

```json
{
  "title": "Submit the take-home assignment",
  "type": "DEADLINE",
  "startAt": "2026-10-12T17:00:00+06:30",
  "timezone": "Asia/Yangon",
  "reminders": [1440, 60]
}
```

GET `/calendar/events/<eventId>` returns the saved event. To reschedule a timed event, send both timestamps when the new start would otherwise pass its current end:

```http
PUT /api/v1/calendar/events/<eventId>
```

```json
{
  "startAt": "2026-10-09T09:00:00+06:30",
  "endAt": "2026-10-09T10:00:00+06:30"
}
```

Omitted values stay unchanged. A title-only edit can send `{"title":"Final technical interview"}`. Send `{"endAt":null,"reminders":[]}` to make it a point event and clear all reminders. General updates validate the resulting combined start/end state inside the same locked transaction as the write.

DELETE `/calendar/events/<eventId>` returns `{"success":true,"data":{"id":"<eventId>","deleted":true}}`. The row is retained with deletedAt; event lists, range views, reminder schedules, and subsequent GET/PUT/DELETE exclude it. Delete testing records last.

## 7.4 Source links

Create an event with both source fields, or attach an existing event with:

```json
{
  "sourceEntityType": "APPLICATION",
  "sourceEntityId": "<yourApplicationId>"
}
```

Replace the placeholder with your own active record UUID. Repeat with COMPANY, CONTACT, TASK, and PROJECT records. A successful response has sourceAvailable:true. A new source is authorized and locked before the event write commits. Missing, foreign-owned, and deleted targets all return 404 CALENDAR_SOURCE_NOT_FOUND. Archived projects/companies/applications and completed/cancelled tasks can still be linked when not deleted.

To detach, set both fields to null:

```json
{
  "sourceEntityType": null,
  "sourceEntityId": null
}
```

Soft-delete the source of a disposable event. Expected: the event remains readable, retains the source pair, and reports sourceAvailable:false. Edits omitting the source fields continue to work. Selecting a new source requires a complete valid pair; re-sending the unavailable pair counts as selecting that source again and is rejected. Physical database deletion of a source clears its FK and returns a null source pair without deleting the event.

Changing or deleting an event never deletes or reschedules its source. Availability is checked in batches by source type, without returning foreign source details.

## 7.3 Event lists and filters

```http
GET /api/v1/calendar/events?page=1&limit=20&sortBy=startAt&order=asc
GET /api/v1/calendar/events?type=INTERVIEW&search=technical
GET /api/v1/calendar/events?sourceEntityType=APPLICATION&sourceEntityId=<yourApplicationId>
GET /api/v1/calendar/events?from=2026-10-01T00:00:00Z&to=2026-11-01T00:00:00Z
```

Filters combine with AND. Search matches title case-insensitively. Source filters need both type and ID. Sorting allows startAt, title, createdAt, updatedAt; order is asc or desc, with an ID tie-breaker. Default ordering is startAt ascending. Pagination defaults to the shared settings (normally 20, capped at 100); page must be 1–1,000,000.

Expected envelope: `{ "success": true, "data": [ ...events ], "meta": { "page": 1, "limit": 20, "total": 3, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false } }`. Totals and items share a database snapshot. Empty/out-of-range pages contain an empty array with accurate totals.

Optional from/to must appear together and span at most 366 days. Bounds use the overlap rules below. URL-encode query parameters, especially `+` in timestamp offsets; use Z timestamps in URLs when convenient.

## 7.5 Calendar views and overlap boundaries

```http
GET /api/v1/calendar/range?view=day&date=2026-10-08&timezone=Asia%2FYangon
GET /api/v1/calendar/range?view=week&date=2026-10-08&timezone=Asia%2FYangon
GET /api/v1/calendar/range?view=month&date=2026-10-08&timezone=Asia%2FYangon
GET /api/v1/calendar/range?from=2026-10-01T00:00:00Z&to=2026-11-01T00:00:00Z&timezone=UTC
```

Use view/date **or** from/to, never a mixture. Timezone defaults to UTC. Add type/search/source filters and page/limit as on the event list. Range views always order by startAt and ID.

Expected response shape for the Yangon day view:

```json
{
  "success": true,
  "data": {
    "view": "day",
    "timezone": "Asia/Yangon",
    "range": {
      "from": "2026-10-07T17:30:00.000Z",
      "to": "2026-10-08T17:30:00.000Z"
    },
    "events": [],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

The example shows an empty view; created matching events populate events and change meta. Custom ranges return view:"custom". Their supplied offsets already identify the instants; timezone is returned as view metadata.

- Windows include from and exclude to.
- Point events match when `from <= startAt < to`.
- Timed events match when `startAt < to` and `endAt > from`, including events that began before the view.
- An event ending exactly at from, or starting exactly at to, is excluded.
- Day views use local midnight to the next local midnight. Weeks run Monday through the next Monday; months run first-of-month through the next first-of-month.
- DST days can be 23 or 25 hours. For America/New_York on 2026-03-08 the UTC range is 05:00Z through next-day 04:00Z. On 2026-11-01 it is 04:00Z through next-day 05:00Z. A skipped local day such as Pacific/Apia 2011-12-30 returns a validation error.

Local boundaries use PostgreSQL's [date/time operations](https://www.postgresql.org/docs/current/functions-datetime.html). A named timezone remains separate from an explicit timestamp offset; offset input is never reinterpreted as a different instant.

## 7.6 Reminder schedules

```http
GET /api/v1/calendar/reminders?from=2026-10-08T00:00:00Z&to=2026-10-09T00:00:00Z&page=1&limit=20
```

Both bounds are required, use the same half-open convention, and may span at most 31 days. Results use the standard list envelope with data and meta. Each reminder contains:

```json
{
  "id": "<eventId>:60",
  "eventId": "<eventId>",
  "title": "Technical interview",
  "type": "INTERVIEW",
  "startAt": "2026-10-08T02:30:00.000Z",
  "timezone": "Asia/Yangon",
  "minutesBefore": 60,
  "remindAt": "2026-10-08T01:30:00.000Z"
}
```

The schedule is calculated from the current startAt and offsets. Minutes are elapsed time, including across DST changes. Offset zero means the event's start instant. Results sort by remindAt, eventId, and minutesBefore. They include reminders whose event starts outside the requested reminder window when the reminder itself falls inside it.

Reschedule the event, clear reminders, or delete it and query again: the schedule changes immediately. GET does not mark reminders sent/read, and past windows remain queryable. This phase does not send email, push notifications, or browser notifications; a later dispatcher can consume this schedule with its own delivery tracking.

## Failure and concurrency checks

- Send an impossible date, a timestamp without an offset, more than three fractional digits, invalid timezone, blank/overlong title, malformed Unicode, unknown fields, invalid source pair, or invalid reminder values: expect 400 VALIDATION_ERROR.
- Send an empty PUT or move startAt beyond the unchanged endAt: expect 400 and the previous event intact.
- Send only one range boundary, reverse/equal bounds, an oversized window, or both named/custom range modes: expect 400.
- Use another account's event ID, a missing ID, or a deleted ID: expect 404 CALENDAR_EVENT_NOT_FOUND.
- Select a foreign/deleted source: expect 404 CALENDAR_SOURCE_NOT_FOUND and no partial title/time/reminder changes.
- Send concurrent start/end changes that would conflict together: only a valid combined state can commit. A concurrent soft delete is rechecked after waiting on row locks.
- Force persistence failure after a write in the integration harness: creation or update, reminders, and source binding all roll back together.

## Manual checklist

- [ ] Create/read/edit/delete an interview and point deadline.
- [ ] Test title, timestamp, timezone, source, and reminder validation.
- [ ] Search/filter/sort/page events and verify totals and deleted-record exclusion.
- [ ] Check day/week/month/custom ranges, midnight overlap edges, leap dates, and DST days.
- [ ] Attach all five source types, rebind, detach, and edit after source deletion.
- [ ] Check reminder offsets, pagination, rescheduling, clearing, and event deletion.
- [ ] Verify another account cannot read or modify your events or reminders.

These checkboxes are completed only after you report your manual results.
