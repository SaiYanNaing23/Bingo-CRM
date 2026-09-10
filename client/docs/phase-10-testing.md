# Client Phase 10 testing guide

This guide verifies the Calendar client against backend Phase 7.

## Prerequisites

- Start MongoDB and the backend API.
- Apply backend migrations through the Calendar migration.
- Start the client with its API base URL pointed at the backend.
- Sign in with a user that has a company, contact, application, task, and project for source-link checks.

## Routes

- /calendar lists and filters events.
- /calendar/range shows day, week, and month agendas.
- /calendar/reminders shows reminders due within a maximum 31-day window.
- /calendar/new creates an event.
- /calendar/:id displays an event.
- /calendar/:id/edit updates an event.

## 10.1 Navigation and loading

- [ ] Calendar appears under Plan your day in desktop navigation.
- [ ] Calendar remains reachable from mobile navigation.
- [ ] Events, Agenda, and Reminders tabs indicate the active view.
- [ ] Direct navigation to every Calendar route survives a browser refresh.
- [ ] Loading, empty, and API error states render without breaking the workspace.

## 10.2 Event list

- [ ] Search updates the URL and filters by event title.
- [ ] Event-type filtering supports Interview, Follow-up, Deadline, and Other.
- [ ] Start, title, created, and updated sorting work in both directions.
- [ ] Pagination updates the URL and preserves active filters.
- [ ] Opening an event and returning restores the exact filtered list URL.

## 10.3 Create and edit

- [ ] A standalone event can be created with title, type, start, timezone, and optional end.
- [ ] Reminder offsets accept comma-separated whole minutes and remove duplicates.
- [ ] Invalid reminder offsets show inline validation.
- [ ] End dates before the start show inline validation.
- [ ] A source-linked event can target a company, contact, application, task, or project.
- [ ] Changing the source type clears the previously selected source record.
- [ ] Backend field errors map to matching form fields.
- [ ] Unsaved edits prompt before internal navigation or browser unload.
- [ ] Editing an unchanged timestamp does not introduce timestamp drift.

## 10.4 Event detail and deletion

- [ ] Detail displays timezone, start, end, reminders, and source state.
- [ ] An available source opens its CRM detail route.
- [ ] A deleted or inaccessible source is labeled unavailable and is not linked.
- [ ] Delete requires confirmation.
- [ ] Successful delete returns to the originating Calendar URL.
- [ ] Failed delete preserves the event and displays an error toast.

## 10.5 Agenda ranges

- [ ] Day, week, and month views use the backend-defined local range.
- [ ] Changing the anchor date updates the returned range.
- [ ] Changing timezone updates day grouping and displayed range boundaries.
- [ ] Type filtering and pagination preserve date, view, and timezone.

## 10.6 Reminder queue

- [ ] The default reminder window covers the next seven days.
- [ ] Applying a valid window persists its timestamps and display timezone in the URL.
- [ ] An end before the start is rejected before applying an API request.
- [ ] A window greater than 31 days is rejected before applying an API request.
- [ ] Reminder rows display due time, offset, event type, and title.
- [ ] Opening a reminder returns to the same reminder window.
- [ ] Reminder pagination preserves the selected window.

## 10.7 Responsive and accessibility checks

- [ ] Calendar controls remain usable at 320 CSS pixels.
- [ ] Event and reminder cards do not overflow at mobile widths.
- [ ] All controls are keyboard reachable.
- [ ] Dialog focus remains trapped and returns to its trigger.
- [ ] Search has an accessible label and Calendar tabs expose navigation semantics.
- [ ] Light and dark themes preserve readable contrast.

## API smoke matrix

| Client action | Expected endpoint |
| --- | --- |
| Load events | GET /api/calendar/events |
| Load detail | GET /api/calendar/events/:id |
| Create event | POST /api/calendar/events |
| Update event | PUT /api/calendar/events/:id |
| Delete event | DELETE /api/calendar/events/:id |
| Load agenda | GET /api/calendar/range |
| Load reminders | GET /api/calendar/reminders |

## Completion record

- [ ] Client typecheck passes.
- [ ] Client lint passes.
- [ ] Client automated tests pass.
- [ ] Backend Calendar integration suite passes.
- [ ] Manual route and responsive checks pass.
- [ ] Phase 10 can be marked complete in client-agenda.md.
