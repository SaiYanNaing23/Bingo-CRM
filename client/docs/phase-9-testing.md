# Client Phase 9 — Notes

Client Phase 9 uses **backend Phase 6**. Start the client and API using [the runbook](../README.md#run-locally), sign in, and create dedicated records for linking tests. The backend Notes migration must be applied.

## Write and format

Open **Notes → New note**. Enter the title `Interview preparation`. In **Content**, type `Review SQL indexes`, select it, and click **Bold** and **Italic**. The text should be formatted immediately. Keyboard shortcuts Ctrl/Cmd+B and Ctrl/Cmd+I also work.

Use the toolbar to try headings, bulleted/numbered lists, checklists, quotes, inline code, and code blocks. Use Tab inside a code block to indent. Select text, click **Link**, enter `https://example.com/interview-notes`, and click **Apply link**. Reopen Link to change or remove it. Try Undo, Redo, and Clear formatting. There is no Markdown source field or preview switch.

Enter `Interview` and `backend` on separate lines in Tags. Leave **Link to → Standalone note**. Click **Create note**. The UI calls `POST /api/v1/notes`, converting formatting to the existing text format internally. A simple bold note produces this shape:

```json
{
  "title": "Interview preparation",
  "content": "**Review SQL indexes**",
  "tags": ["Interview", "backend"],
  "entity": null
}
```

Expected: 201, formatted detail with tags `interview` and `backend`, entity:null, entityAvailable:null. Click Edit and confirm formatting and text remain. Title is 2–200 characters; tags are up to 20 entries of 1–40 characters, one per line. The server trims/lowercases/deduplicates tags. Content is required, valid Unicode without NUL, and at most 100,000 characters including stored formatting. Empty headings/lists and whitespace-only text must not save.

Existing notes load into the visual editor, including tables and checklists. Code indentation is preserved. Editing only the title or tags leaves the stored content untouched, including existing CRLF line endings. Content edits serialize the formatted document, so equivalent source syntax may normalize. Existing image references remain links and are never automatically fetched. Unsafe links do not become clickable; stored HTML never executes. Pasted supported formatting is retained through the editor schema.

Make a content-only edit, then navigate away: choose **Keep editing** and verify the draft. Force a failed save in browser tools and retry: the draft, formatting, and undo history must remain. While saving, the content editor and controls must be disabled. Clear all content and verify validation prevents saving. Test at a 390px viewport in the dark theme; the toolbar should wrap without horizontal page scrolling.

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

Search matches title or stored note content. Open Filters for an exact tag and optional record type/record pair. Select a record before that entity filter applies. Incomplete or invalid filter URLs show an explanation while the list uses other valid filters.

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
- [ ] Toolbar formatting and keyboard shortcuts work; formatting and code indentation survive reopening.
- [ ] Title-only/tag-only edits preserve existing saved content exactly.
- [ ] Formatted detail is readable and stored HTML/unsafe links do not execute or fetch images.
- [ ] Search, exact tag, entity filters, sorting, pagination, and back navigation work.
- [ ] All five entity types, picker search/pagination, preselection, rebind, and detach work.
- [ ] Related Notes sections show the correct notes and total.
- [ ] Linked-record deletion and failed writes retain content and allow recovery.
- [ ] Unsaved-change protection, account isolation, expired sessions, keyboard, mobile, and dark theme work.

These boxes record your manual results. Automated verification is recorded separately in [the client agenda](../../client-agenda.md#phase-9---notes).
