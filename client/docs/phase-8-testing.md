# Client Phase 8 — Projects

Client Phase 8 uses **backend Phase 5**. Start the API and client using [the runbook](../README.md#run-locally), then sign in with your own account. The backend migrations through Notes must be applied. Use dedicated test records and delete them after their Notes checks.

## Create a project

Open **Projects → New project**. Enter:

| Field | Example |
| --- | --- |
| Project name | BINGO CRM Portfolio |
| GitHub URL | https://github.com/your-username/bingo-crm |
| Live demo URL | https://example.com/bingo-crm |
| Initial status | In progress |
| Initial progress (%) | 40 |
| Technology stack | React, TypeScript, PostgreSQL — **one per line** |
| Screenshot URLs | Your own HTTP(S) image URLs, **one per line** |
| Lessons learned | Keep API contracts consistent. |

The UI sends `POST /api/v1/projects` with this shape:

```json
{
  "name": "BINGO CRM Portfolio",
  "githubUrl": "https://github.com/your-username/bingo-crm",
  "liveDemoUrl": "https://example.com/bingo-crm",
  "status": "IN_PROGRESS",
  "progress": 40,
  "stack": ["React", "TypeScript", "PostgreSQL"],
  "screenshots": [],
  "lessonsLearned": "Keep API contracts consistent."
}
```

Expected: 201, navigation to the detail page, progress 40%, normalized stack entries, and one Created activity. Blank URLs become null and blank array fields become []. An unavailable screenshot displays a fallback with an external link. There is no screenshot upload endpoint.

Try a Planned project at 40%: the form should explain the status/percentage rules and preserve the input. Cancel with unsaved changes should offer Keep editing or Discard changes.

## List, read, and edit

Search matches project name or lessons. Open **Filters** for Status and **Stack (exact entry)**. `React` matches the saved `react` entry; `rea` does not. Sort by name, progress, created, or updated; change direction and rows per page. Refresh and returning from a saved detail edit retain list filters.

```http
GET /api/v1/projects?search=BINGO&status=IN_PROGRESS&stack=React&sortBy=updatedAt&order=desc&page=1&limit=10
GET /api/v1/projects/<projectId>
```

Click **Edit** on a project, change the name, and clear the demo URL and screenshot list. The client sends only changed detail fields to `PUT /api/v1/projects/<projectId>`, for example:

```json
{
  "name": "BINGO CRM Portfolio v2",
  "liveDemoUrl": null,
  "screenshots": []
}
```

Expected: 200 and updated detail. PUT does not send status, progress, userId, or timestamps. Clearing stack sends []; clearing lessons sends null. A failed save shows the error and retains the entered values for retry.

## Progress and activity

Click **Update progress**. Select a status and enter a percentage explicitly. Planned requires 0; In progress/On hold accept 0–99; Completed requires 100; Archived accepts 0–100.

`PATCH /api/v1/projects/<projectId>/progress`:

```json
{
  "status": "COMPLETED",
  "progress": 100,
  "content": "Implementation and verification are complete."
}
```

Expected: 200, updated percentage/status, and a Progress updated timeline entry with before/after values. Try archiving at 100, then reopening as In progress at 80. Archived projects remain readable and editable. An unchanged state explains that a new message belongs in Add comment.

Use **Add a comment** below the oldest-first history. `POST /api/v1/projects/<projectId>/activities`:

```json
{ "content": "Reviewed the portfolio and collected feedback." }
```

Expected: 201, comment displayed on the last activity page, and unchanged status/progress. Blank comments are rejected; failed comments stay in the form. Duplicate submissions are disabled while pending; submitting the same comment later creates a separate entry.

```http
GET /api/v1/projects/<projectId>/activities?page=1&limit=10
```

Use Previous/Next when there are more than 10 activities. Activity entries cannot be edited or deleted through these APIs.

## Linked notes and deletion

The **Notes** section shows up to five recent linked notes and the total. **New note** preselects this project; **View all notes** opens the paired project filter. Follow [the client Notes guide](phase-9-testing.md) before deleting your fixture project.

Click **Delete**, then confirm **Delete record**. This calls `DELETE /api/v1/projects/<projectId>` with no body. Expected: 200, return to the list, deleted project excluded from results/counts, and recovery to the last valid page if necessary. Linked notes remain readable with an unavailable-record message. Direct access to the deleted project displays the missing-record state.

All requests require `Authorization: Bearer <token>`; JSON writes also require `Content-Type: application/json`. Full API examples and backend rules: [Projects requests](../../server/docs/projects-testing.md).

## Manual checklist

- [ ] Create, read, edit, null/array clearing, and screenshots work.
- [ ] Search, exact stack/status filters, sorting, pagination, and back navigation work.
- [ ] Progress, pause, complete, archive, reopen, and no-change feedback behave correctly.
- [ ] Activity pagination and comments work, including failed request retry.
- [ ] Related notes are preselected and retained after project deletion.
- [ ] Soft-delete, missing records, account isolation, and expired sessions behave correctly.
- [ ] Keyboard controls and phone/desktop layouts are usable with my theme.

These boxes record your manual results. Automated verification is recorded separately in [the client agenda](../../client-agenda.md#phase-8---projects).
