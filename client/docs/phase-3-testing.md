# Client Phase 3 - Contacts

Prerequisites: sign in and create a company using [Phase 2](phase-2-testing.md). Pick it by name in the UI; replace `<COMPANY_ID>` only when calling the API manually. Requests require a bearer token.

1. Open Contacts > New contact and enter the sample values below.
2. Choose date display timezone `Asia/Yangon`. Enter Last contacted `2026-09-08 09:00` and Next follow-up `2026-09-10 09:00`. These save as `02:30Z`, shown below.
3. Submit. Expect a dedicated Sarah Johnson detail page; save `<CONTACT_ID>` for Applications.
4. Edit phone/notes and save. Use Update follow-up to change the next follow-up date. The dialog labels its current timezone, which may be the browser timezone when reopening a contact.
5. Filter the contact list by company and search for Sarah. Open the company detail page and check its Contacts section.
6. Open the company combobox with more than 20 companies: search or use Next options, select a company, reopen the picker, then return to Previous options. The selection must remain selected.
7. Delete the test contact after checking Applications. It should disappear from lists and its old detail URL should return an unavailable state.

Create (201):

```http
POST /api/v1/contacts
Content-Type: application/json
Authorization: Bearer <TOKEN>
```

```json
{
  "photo": "https://images.unsplash.com/photo-1521791136064-7986c2920216",
  "name": "Sarah Johnson",
  "companyId": "<COMPANY_ID>",
  "email": "sarah.johnson@example.com",
  "phone": "+1 234 567 8900",
  "linkedIn": "https://www.linkedin.com/in/sarah-johnson",
  "role": "Senior Recruiter",
  "notes": "Contacted after a job posting.",
  "lastContactAt": "2026-09-08T02:30:00.000Z",
  "nextFollowUpAt": "2026-09-10T02:30:00.000Z"
}
```

Send URLs as plain strings, not Markdown links. Email must not contain a backslash before `@`. All fields above except notes are required by the current create endpoint.

Update (200):

```http
PUT /api/v1/contacts/<CONTACT_ID>
```

```json
{ "phone": "+1 234 567 8999", "notes": "Shared an updated resume." }
```

Follow-up (200):

```http
PATCH /api/v1/contacts/<CONTACT_ID>/follow-up
```

```json
{ "nextFollowUpAt": "2026-09-12T02:30:00.000Z" }
```

```http
GET /api/v1/contacts?companyId=<COMPANY_ID>&search=Sarah&page=1&limit=20
GET /api/v1/contacts/<CONTACT_ID>
DELETE /api/v1/contacts/<CONTACT_ID>
```

These need no body. Successful GET/DELETE return 200; read after deletion returns 404.

Manual checks:

- [ ] Required fields and invalid URL/email messages are clear.
- [ ] Company selection works across option pages.
- [ ] Date/timezone values round-trip correctly.
- [ ] Edit and follow-up changes persist.
- [ ] Company detail lists the related contact.
- [ ] Soft-delete removes the contact from visible results.
