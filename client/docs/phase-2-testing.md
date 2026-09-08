# Client Phase 2 - Companies

Sign in, then open Companies. All API requests below require `Authorization: Bearer <TOKEN>`; POST/PUT/PATCH also use `Content-Type: application/json`.

1. Click New company. Enter the example values below. Tech stack is entered as `React, TypeScript, PostgreSQL` in the form.
2. Submit. Expect a success notification and a dedicated company detail page. Save the returned `id` as `<COMPANY_ID>` for Contacts/Applications.
3. Edit the industry or notes, then Save changes. Reload to confirm persistence.
4. Archive company. Expect the Archived badge and a Reactivate action. Reactivate it and confirm Active status.
5. Return to Companies. Test search, status/country/industry/remote filters, sort direction, and pagination. Open a row and return; the list URL/filter/page should be preserved.
6. After testing related modules, delete this test company through its confirmation dialog. Its direct detail URL should show an unavailable-record state.

Create:

```http
POST /api/v1/companies
```

```json
{
  "name": "Paperplane Labs",
  "logo": "https://example.com/logo.png",
  "country": "Singapore",
  "industry": "Software",
  "website": "https://example.com",
  "linkedIn": "https://www.linkedin.com/company/example",
  "careerPage": "https://example.com/careers",
  "techStack": ["React", "TypeScript", "PostgreSQL"],
  "size": 50,
  "salaryRange": "USD 80,000-100,000 / year",
  "remote": true,
  "notes": "Interested in the frontend team.",
  "status": "ACTIVE"
}
```

`logo` is optional; the example URL may not contain an image. The client should fall back gracefully when an image cannot load. Expect 201 and `data.id`.

Partial update:

```http
PUT /api/v1/companies/<COMPANY_ID>
```

```json
{ "industry": "Developer tools", "notes": "Reviewed the careers page." }
```

Archive/reactivate:

```http
PATCH /api/v1/companies/<COMPANY_ID>/status
```

```json
{ "status": "ARCHIVED" }
```

Use `ACTIVE` to reactivate. Archive is separate from deletion.

```http
GET /api/v1/companies?search=Paperplane&status=ACTIVE&page=1&limit=20
GET /api/v1/companies/<COMPANY_ID>
DELETE /api/v1/companies/<COMPANY_ID>
```

GET/DELETE need no body. Successful reads, updates, status changes, and deletion return 200. GET after deletion returns 404.

Manual checks:

- [ ] Create/read/edit persist correctly.
- [ ] Archive/reactivate work separately from delete.
- [ ] Search/filter/sort/page controls use full API results.
- [ ] Failed saves preserve the entered values.
- [ ] Unsaved navigation offers Keep editing or Discard changes.
- [ ] Delete removes the record and its old URL becomes unavailable.
