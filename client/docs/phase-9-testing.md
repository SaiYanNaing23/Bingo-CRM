# Client Phase 9 — Notes

Client Phase 9 uses **backend Phase 6**. Start the client and API using [the runbook](../README.md#run-locally), sign in, and create dedicated records for linking tests. The backend Notes migration must be applied.

## Write and preview

Open **Notes → New note**. Enter the title `Interview preparation`, then paste this into **Markdown content**:

````markdown
# Interview preparation

- [x] Review SQL indexes
- [ ] Practice transaction examples

## Code example

```ts
  const ready = true
```

| Topic | Next step |
| --- | --- |
| PostgreSQL | Explain row locks |

[Reference](https://example.com/interview-notes)
````

Enter `Interview` and `backend` on separate lines in Tags. Leave **Link to → Standalone note**. Toggle Write/Preview: headings, task lists, code, tables, and links should be readable. The original draft remains when returning to Write. Preview omits raw HTML, displays unsafe links as text, and shows Markdown images as links that you open explicitly.

Click **Create note**. The UI calls `POST /api/v1/notes`:

```json
{
  "title": "Interview preparation",
  "content": "# Interview preparation\n\n- [x] Review SQL indexes\n- [ ] Practice transaction examples\n\n```ts\n  const ready = true\n```\n",
  "tags": ["Interview", "backend"],
  "entity": null
}
```

Expected: 201, detail page with tags `interview` and `backend`, entity:null, entityAvailable:null. **Source** displays the saved Markdown; **Preview** displays its formatted version. Use plain URLs in Markdown link syntax. Blank content, excessive content/tags, and invalid Unicode display validation errors.

The editor accepts up to 100,000 characters. Title is 2–200 characters; tags are up to 20 entries of 1–40 characters, one per line. The server trims/lowercases/deduplicates tags. The editor does not trim content. Editing only the title or tags leaves the stored source untouched, including existing CRLF line endings.

## Select a linked record

Open a company, contact, application, task, or project detail page and use its **Notes → New note** action. It preselects that entity. Alternatively choose **Link to** in the Notes form, then search the **Linked record** picker by name. Use Next options/Previous options for additional pages.

For a project-linked create, replace the ID with your own active project:

```json
{
  "title": "Project decisions",
  "content": "## Decisions\n\nKeep backend and client agendas separate.\n",
  "tags": ["architecture"],
  "entity": { "type": "PROJECT", "id": "<projectId>" }
}
```

Supported types are COMPANY, CONTACT, APPLICATION, TASK, PROJECT. A note links to at most one record. Changing type clears the old selection; select a record before saving. Archived records and completed/cancelled tasks remain valid targets while not deleted. Selected records retain their labels across picker pages. Another account's records are unavailable.

Expected: 201 and entityAvailable:true. The note appears on that record's Notes section; the section shows five recent notes plus the total, with **View all notes** for full pagination.

## Edit, rebind, or detach

Click **Edit**, change only the title, then save. `PUT /api/v1/notes/<noteId>`:

```json
{ "title": "Project implementation decisions" }
```

Expected: 200; omitted content/tags/entity stay unchanged. Clearing Tags sends `{"tags":[]}`. Changing the selected record sends a complete replacement entity:

```json
{ "entity": { "type": "TASK", "id": "<taskId>" } }
```

Choose **Standalone note** to detach:

```json
{ "entity": null }
```

Expected: entity:null and entityAvailable:null. Failed saves/rebinds preserve your draft, and leaving a changed form offers Keep editing or Discard changes. Drafts are kept in the current form, not browser storage.

## Search and filters

Search matches title or Markdown source. Open Filters for an exact tag and optional record type/record pair. Select a record before that entity filter applies. Incomplete or invalid filter URLs show an explanation while the list uses other valid filters.

```http
GET /api/v1/notes?search=SQL&tag=Interview&sortBy=updatedAt&order=desc&page=1&limit=10
GET /api/v1/notes?entityType=PROJECT&entityId=<projectId>&sortBy=title&order=asc&page=1&limit=10
GET /api/v1/notes/<noteId>
```

Expected: 200, owned active notes, correct server totals, case-insensitive search, and full tag matches. `tag=inter` does not match `interview`. Sorting supports title/created/updated. Search, filters, sorting, and pagination survive refresh and returning from saved edits. The list shows standalone, available, or unavailable linked-record state.

## Linked deletion and note deletion

1. Create a disposable project and linked note.
2. Delete the project, then open the note.
3. Expect the source intact and **Linked record unavailable**. The note still matches its old entity filter.
4. Edit only the note title/content: the unchanged entity is omitted and saving still works.
5. Select another record or choose Standalone note; save successfully.
6. If a selected target is deleted before Save, expect an error with the draft retained. Select a different record or detach, then retry.
7. Click Delete on the note, then confirm Delete record.

```http
DELETE /api/v1/notes/<noteId>
```

No body. Expected: 200, return to list, deleted note excluded from results/counts, and linked entities unchanged. GET/PUT/DELETE of that deleted note returns 404. Missing/other-account note IDs display the unavailable-record page. An expired token returns to sign-in.

All requests require `Authorization: Bearer <token>`; JSON writes also require `Content-Type: application/json`. Full API contracts and additional failure examples: [Notes requests](../../server/docs/notes-testing.md).

## Manual checklist

- [ ] Create, read, edit, tags clearing, and soft-delete work.
- [ ] Markdown source, indentation, code, and line breaks survive saves.
- [ ] Preview is readable and raw HTML/unsafe links do not execute.
- [ ] Search, exact tag, entity filters, sorting, pagination, and back navigation work.
- [ ] All five entity types, picker search/pagination, preselection, rebind, and detach work.
- [ ] Related Notes sections show the correct notes and total.
- [ ] Linked-record deletion and failed writes retain content and allow recovery.
- [ ] Unsaved-change protection, account isolation, expired sessions, keyboard, mobile, and dark theme work.

These boxes record your manual results. Automated verification is recorded separately in [the client agenda](../../client-agenda.md#phase-9---notes).
