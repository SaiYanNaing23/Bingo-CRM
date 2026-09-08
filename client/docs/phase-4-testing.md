# Client Phase 4 - Applications

Prerequisites: sign in and create a company/contact using Phases 2-3. Replace IDs in API examples; the client uses searchable name selectors.

1. Open Applications > New application. Enter `Frontend Engineer`, select your company and its recruiter, choose timezone `UTC`, and leave Initial stage as Wishlist.
2. Salary and notes are optional. Leave Date applied empty for this first check. Submit and save `<APPLICATION_ID>` from the detail page/response.
3. Choose Change stage > Applied. Because Date applied is missing, the dialog asks for it. Enter `2026-09-08 09:00`. Save and check that the stage becomes Applied and Stage history contains a new entry.
4. Edit salary/notes and save. Stage editing remains a separate action.
5. Move to HR, then Technical, then back to Applied. Every distinct successful move should appear in history. Paging history should keep its oldest-first ordering.
6. Filter/search the application list and check the company's Applications section.
7. Edit the company selection. The previous recruiter must clear; the new recruiter picker must list contacts from the new company.
8. Archive by stage change, then reopen if wanted. Deleting is a separate confirmation action. Read the deleted application's old URL to check its unavailable state.

All requests require `Authorization: Bearer <TOKEN>`. Requests with JSON bodies require `Content-Type: application/json`.

Create (201):

```http
POST /api/v1/applications
```

```json
{
  "companyId": "<COMPANY_ID>",
  "position": "Frontend Engineer",
  "dateApplied": null,
  "salary": "USD 80,000-100,000 / year",
  "timezone": "UTC",
  "recruiter": "<CONTACT_ID>",
  "stage": "WISHLIST",
  "notes": "Interested in the web platform team."
}
```

`recruiter` is a Contact ID belonging to the selected company; use `null` when there is no recruiter. The exact field name is `recruiter`.

Save application details (200):

```http
PUT /api/v1/applications/<APPLICATION_ID>
```

```json
{
  "dateApplied": "2026-09-08T09:00:00.000Z",
  "notes": "Application submitted through the careers page."
}
```

Then change stage (200):

```http
PATCH /api/v1/applications/<APPLICATION_ID>/stage
```

```json
{ "stage": "APPLIED" }
```

The client performs those two requests when moving an undated Wishlist application to a stage that requires a date. If only the date save succeeds, the error explains that the stage still needs to be retried. Ordinary detail PUT requests never contain `stage`, owner fields, or timestamps managed by the server.

Stages: `WISHLIST`, `APPLIED`, `HR`, `TECHNICAL`, `ASSIGNMENT`, `FINAL`, `OFFER`, `REJECTED`, `ARCHIVED`. Date applied is required from Applied through Offer. Repeating a stage change to the current stage adds no duplicate history.

```http
GET /api/v1/applications?companyId=<COMPANY_ID>&stage=APPLIED&page=1&limit=20
GET /api/v1/applications/<APPLICATION_ID>
GET /api/v1/applications/<APPLICATION_ID>/stage-history?page=1&limit=10
DELETE /api/v1/applications/<APPLICATION_ID>
```

No request bodies are needed. Successful reads/deletion return 200; a read after deletion returns 404. History returns an array in `data` and pagination in top-level `meta`.

Manual checks:

- [ ] Create and detail edit persist.
- [ ] Recruiter is limited to the selected company and clears on company change.
- [ ] Date-required stage changes work and failures show accurate feedback.
- [ ] History reflects transitions and supports pagination.
- [ ] List filters and company relationships work.
- [ ] Archive/reopen and delete have distinct behavior.
