# Phase 6: Notes sample requests

**Status: implemented and automatically verified (2026-09-08).** These requests match [backend Phase 6](../../agenda.md#phase-6---notes-module). All five endpoints are mounted under `/api/v1/notes`. Build, 19 Notes integration scenarios, and the existing module regression suites pass. The manual checklist below is reserved for your own results.

## Setup

The Notes migration is already applied in this workspace and the local compiled API has been restarted. On another checkout or database, run these in `server/`:

```powershell
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run build
npm.cmd run start
```

Restart an existing compiled server after rebuilding. `npm.cmd run test:notes` runs the build and disposable-schema integration suite and removes its fixtures afterward. Prisma CLI uses a direct Neon connection automatically, or DIRECT_URL when supplied; see the [backend runbook](../src/README.md#run-this-backend-locally).

Use the login request in [Projects setup](projects-testing.md#setup) and copy `data.token`. Headers for JSON writes:

```http
Authorization: Bearer <your_access_token>
Content-Type: application/json
```

GET and DELETE need Authorization and **no body**. Replace `<noteId>` with data.id from note creation. Replace entity IDs with active records owned by your account. For PROJECT, create a dedicated project using [the Phase 5 requests](projects-testing.md#create-53). Do not delete linked test entities until their other tests are finished.

## Endpoint checklist

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| POST | `/api/v1/notes` | title, content; optional tags/entity | 201, note in data |
| GET | `/api/v1/notes` | None | 200, note array + top-level meta |
| GET | `/api/v1/notes/:id` | None | 200, note in data |
| PUT | `/api/v1/notes/:id` | At least one of title/content/tags/entity | 200, note in data |
| DELETE | `/api/v1/notes/:id` | None | 200, `{ id, deleted: true }` in data |

## Field rules (6.1–6.2)

| Field | Rule |
| --- | --- |
| title | Required, trimmed, 2–200 characters |
| content | Required Markdown string, non-whitespace, at most 100,000 characters; preserved exactly |
| tags | Up to 20 strings, each trimmed and 1–40 characters; lowercase/deduplicated; default [] |
| entity | null, or a complete `{ type, id }` object; default null |
| entity.type | COMPANY, CONTACT, APPLICATION, TASK, PROJECT |
| entity.id | UUID of an owned record that is not soft-deleted when assigned |

The server supplies id, userId, entityAvailable, createdAt, updatedAt, deletedAt. Do not send them or internal companyId/contactId/applicationId/taskId/projectId columns in the note body.

One note links to at most one entity. Omit entity on update to preserve it, send a new complete pair to rebind, or send null to detach. Tags replace the whole list; [] clears them. Content cannot be null or blank. Existing inline notes fields in other modules are separate from these Notes records.

Text must be valid Unicode without NUL characters; these invalid inputs return 400 VALIDATION_ERROR instead of being modified during storage. JSON bodies over the shared 1 MB limit return 413 PAYLOAD_TOO_LARGE. Oversized individual fields within that transport limit return 400 VALIDATION_ERROR.

## Create a standalone Markdown note (6.3, 6.6)

```http
POST http://localhost:4000/api/v1/notes
```

```json
{
  "title": "Backend interview checklist",
  "content": "# Backend interview checklist\n\n- Review SQL indexes\n- Explain JWT authentication\n- Practice transaction examples\n\n```ts\nconst ready = true\n```\n\n[Reference](https://example.com/interview-notes)\n",
  "tags": [" Interview ", "backend", "INTERVIEW"],
  "entity": null
}
```

Expected: **201**, success:true and a note in data. Tags normalize to `["interview", "backend"]`; entity and entityAvailable are null. Save its data.id as `<standaloneNoteId>`.

The escaped `\n` sequences in the JSON become actual line breaks. Content returned by GET must match the submitted string, including code indentation and its final newline.

Minimal create:

```json
{
  "title": "Weekly review",
  "content": "Review applications and plan the next follow-ups."
}
```

Expected: tags [], entity null, entityAvailable null. Each POST creates a separate note.

## Create a project-linked note (6.3–6.4)

```http
POST http://localhost:4000/api/v1/notes
```

```json
{
  "title": "BINGO CRM project decisions",
  "content": "# Decisions\n\n- React + TypeScript client\n- Express API with PostgreSQL\n- Keep backend and client agendas separate\n\n## Next steps\n\nVerify Projects before implementing Notes.",
  "tags": ["bingo-crm", "architecture"],
  "entity": {
    "type": "PROJECT",
    "id": "<projectId>"
  }
}
```

Replace `<projectId>` before sending. Expected: **201**, entity contains that type/id and entityAvailable is true. Save data.id as `<noteId>` for the linked-note flow below.

The same create body can link to these other types by replacing the complete entity object with one of the following; replace every ID with an owned existing record:

```json
{ "type": "COMPANY", "id": "<companyId>" }
```

```json
{ "type": "CONTACT", "id": "<contactId>" }
```

```json
{ "type": "APPLICATION", "id": "<applicationId>" }
```

```json
{ "type": "TASK", "id": "<taskId>" }
```

These are entity object replacements, not complete create bodies. Each target must belong to your account and have deletedAt:null. Archived companies/applications/projects and completed/cancelled tasks are valid targets while they remain owned and not soft-deleted.

## Read and update (6.3)

```http
GET http://localhost:4000/api/v1/notes/<noteId>
```

Expected: **200**, note in data containing id, userId, title, content, tags, entity, entityAvailable, createdAt, updatedAt, deletedAt. Entity record details are not embedded.

```http
PUT http://localhost:4000/api/v1/notes/<noteId>
```

```json
{
  "title": "BINGO CRM implementation notes",
  "content": "# Implementation notes\n\n1. Finish Projects integration tests.\n2. Add reusable Markdown notes.\n\nKeep existing inline notes unchanged.",
  "tags": ["bingo-crm", "implementation"]
}
```

Expected: **200**, updated title/content/tags. The omitted entity remains the original PROJECT link. No linked project fields are modified.

Clear tags, using the same PUT URL:

```json
{ "tags": [] }
```

Expected: tags []. All other values stay unchanged.

## Rebind and detach (6.4)

Rebind the note using PUT and an owned company's real ID:

```json
{
  "entity": {
    "type": "COMPANY",
    "id": "<companyId>"
  }
}
```

Expected: **200**, entity changes to COMPANY, entityAvailable:true. No second entity link is retained.

Detach:

```json
{ "entity": null }
```

Expected: **200**, entity:null and entityAvailable:null; content remains intact.

Reattach to the original project when needed for later filter/deletion checks:

```json
{
  "entity": {
    "type": "PROJECT",
    "id": "<projectId>"
  },
  "tags": ["bingo-crm", "architecture"]
}
```

Missing, another user's, and soft-deleted target IDs return **404 NOTE_ENTITY_NOT_FOUND**. A failed rebind must leave the note's previous link, content, and tags unchanged.

## List, tag filters, text search, and entity filters (6.5)

```http
GET http://localhost:4000/api/v1/notes?page=1&limit=10
```

```http
GET http://localhost:4000/api/v1/notes?tag=architecture&search=BINGO&sortBy=updatedAt&order=desc&page=1&limit=10
```

```http
GET http://localhost:4000/api/v1/notes?entityType=PROJECT&entityId=<projectId>&sortBy=createdAt&order=asc&page=1&limit=10
```

```http
GET http://localhost:4000/api/v1/notes?search=JWT&sortBy=title&order=asc
```

Expected: **200**, note array plus shared top-level meta. Empty results use total:0, totalPages:1. Defaults are updatedAt descending and id ascending as a stable tie-breaker; supported sort fields are title, createdAt, updatedAt.

Filters combine with AND; search matches title OR raw Markdown content case-insensitively. Tags use exact normalized membership: `tag=Architecture` matches architecture, while `tag=arch` does not. Both entityType and entityId are required together. URL-encode spaces and special characters in query values.

Entity filters match stored links on your owned active notes. They return an empty list when no notes match, including for valid IDs of missing/other-owner entities. They do not reveal whether a target exists. Notes linked to a subsequently deleted target can still match and return entityAvailable:false.

## Linked-record deletion (6.4)

Use a **separate disposable project/note pair** for this sequence so other tests can keep using their records:

1. Create a project, then a note linked to it. Save both IDs.
2. DELETE that project using the Phase 5 endpoint.
3. GET the note: expect **200**, unchanged content, its original entity pair, and entityAvailable:false.
4. List notes filtered by that PROJECT/type/id pair: the note still appears for its owner.
5. PUT only the note's title or content: expect **200**; unavailable links do not block ordinary edits.
6. Explicitly PUT the same deleted project as entity: expect **404 NOTE_ENTITY_NOT_FOUND** with no note changes.
7. PUT `{ "entity": null }`: expect **200** and a standalone note.
8. DELETE the disposable note when finished.

Repeat with other supported target types in automated coverage. Removing a note never deletes or edits its linked target. Physical target deletion, outside normal API soft-delete routes, clears the stored FK and makes the note standalone.

## Validation and access checks (6.7)

Run each invalid case separately:

| Request | Body or condition | Expected |
| --- | --- | --- |
| Any Notes endpoint | Missing/invalid Bearer token | 401 |
| POST notes | `{ "title": "Missing content" }` | 400 VALIDATION_ERROR |
| POST notes | `{ "title": "Test note", "content": "   " }` | 400 VALIDATION_ERROR |
| PUT note | `{}` | 400 VALIDATION_ERROR |
| PUT note | `{ "content": null }` | 400 VALIDATION_ERROR |
| POST/PUT note | NUL or malformed Unicode in text, or content longer than 100,000 characters within the JSON limit | 400 VALIDATION_ERROR |
| JSON write | Request body larger than 1 MB | 413 PAYLOAD_TOO_LARGE |
| PUT note | `{ "tags": null }`, `{ "tags": [""] }`, or `{ "tags": "backend" }` | 400 VALIDATION_ERROR |
| PUT note | `{ "entity": { "type": "PROJECT" } }` | 400 VALIDATION_ERROR |
| PUT note | `{ "entity": { "type": "DOCUMENT", "id": "<validUuid>" } }` | 400 VALIDATION_ERROR |
| PUT note | `{ "entity": { "type": "PROJECT", "id": "not-a-uuid" } }` | 400 VALIDATION_ERROR |
| Any write | Add userId, entityAvailable, deletedAt, or internal FK fields | 400 VALIDATION_ERROR |
| POST/PUT note | Assign a missing, other-owner, or soft-deleted entity with a valid UUID | 404 NOTE_ENTITY_NOT_FOUND |
| GET note | Use `not-a-uuid` as the ID | 400 VALIDATION_ERROR |
| GET list | `?page=0`, `?limit=0`, or `?sortBy=content` | 400 VALIDATION_ERROR |
| GET list | `?entityType=PROJECT` without entityId, or entityId without entityType | 400 VALIDATION_ERROR |
| GET/PUT/DELETE note | A missing, other-owner, or soft-deleted note UUID | 404 NOTE_NOT_FOUND |

Also test the documented text/array limits, Unicode, Markdown code indentation, and leading/trailing line breaks. The backend returns Markdown source as JSON; a future client preview must handle HTML safely. No HTML is rendered and no content URLs are fetched by these endpoints.

## Soft-delete — last (6.3)

```http
DELETE http://localhost:4000/api/v1/notes/<noteId>
```

No body. Expected **200**:

```json
{
  "success": true,
  "data": { "id": "<noteId>", "deleted": true }
}
```

Then GET/PUT/DELETE that note must return **404 NOTE_NOT_FOUND**; lists and totals exclude it. The linked project/company/contact/application/task remains unchanged. Delete any separate standalone notes created for testing when their checks are complete.

## Manual checklist

- [ ] All five endpoints work with my token.
- [ ] Standalone and linked notes preserve Markdown exactly.
- [ ] Tags normalize/deduplicate, clear correctly, and filter by full tag.
- [ ] Text search, entity filters, sorting, and pagination work with accurate totals.
- [ ] All five entity types, rebind, and detach work.
- [ ] Other-owner/deleted target assignment is rejected without changing the note.
- [ ] Notes survive target soft deletion and can still be edited or detached.
- [ ] Authentication, validation, and note soft-delete checks pass.

These checkboxes record the user's manual results only. Automated implementation verification is recorded separately in the backend agenda.
