# Contacts: 2.4 and 2.5 manual testing

2.4 is the follow-up endpoint. It updates either or both contact dates.
2.5 verifies the whole Contacts module: authenticated CRUD, follow-up updates,
ownership, pagination, and soft-delete behavior.

The agenda checkmarks record implementation and automated verification. Use the
checklist below to record your own manual test results.

## Setup

- Run the API at `http://localhost:4000`.
- If using `npm.cmd run start`, restart it after the new build. The development server reloads source changes.
- Replace `<token>` with the JWT from login.
- Replace `<contactId>` with an active contact owned by that account. Your supplied
  ID is `c1758f73-ac5d-417f-bdd6-23818e5a2227`. If you already deleted it during 2.3,
  create a new contact with `POST /api/v1/contacts` and use the new returned ID.
- Run deletion checks last.

Use these headers for requests with JSON bodies:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

GET and DELETE need the Authorization header and no body.

## 2.4: Update follow-up dates

```http
PATCH http://localhost:4000/api/v1/contacts/<contactId>/follow-up
```

Update both dates:

```json
{
  "lastContactAt": "2026-09-08T09:00:00.000Z",
  "nextFollowUpAt": "2026-09-15T09:00:00.000Z"
}
```

Expected: **200**, `success: true`, and the updated contact in `data`.

Send a second PATCH with only the next follow-up date:

```json
{
  "nextFollowUpAt": "2026-09-20T09:00:00.000Z"
}
```

Expected: **200**. `lastContactAt` stays at `2026-09-08T09:00:00.000Z`.

Send a third PATCH with only the last contact date:

```json
{
  "lastContactAt": "2026-09-09T09:00:00.000Z"
}
```

Expected: **200**. `nextFollowUpAt` stays at `2026-09-20T09:00:00.000Z`.

Confirm persistence:

```http
GET http://localhost:4000/api/v1/contacts/<contactId>
```

Expected: **200**, with the final dates from the last two PATCH requests.

Dates must be valid ISO timestamp strings with `Z` or an explicit offset, for example
`2026-09-09T15:30:00.000+06:30`. Responses serialize them in UTC.

## 2.5: Verification cases

Use the same PATCH URL for the follow-up cases below. Send one payload per request.

| Test | Body or request change | Expected |
| --- | --- | --- |
| Empty update | `{}` | 400, `VALIDATION_ERROR` |
| No follow-up fields | `{"notes":"Hello"}` | 400, `VALIDATION_ERROR` |
| Invalid date text | `{"nextFollowUpAt":"not-a-date"}` | 400, `VALIDATION_ERROR` |
| Impossible calendar date | `{"nextFollowUpAt":"2026-02-30T09:00:00.000Z"}` | 400, `VALIDATION_ERROR` |
| Null date | `{"nextFollowUpAt":null}` | 400, `VALIDATION_ERROR` |
| Numeric/boolean date | `{"nextFollowUpAt":123}` or `{"nextFollowUpAt":true}` | 400, `VALIDATION_ERROR` |
| Missing authentication | Valid date body, remove Authorization header | 401, `AUTH_MISSING_TOKEN` |
| Another user's contact | Valid date body, JWT from a different account | 404, `CONTACT_NOT_FOUND` |
| Missing contact | Valid date body, use an ID absent from the database | 404, `CONTACT_NOT_FOUND` |

After invalid requests, GET the contact and confirm its dates did not change.

Verify pagination and company filtering:

```http
GET http://localhost:4000/api/v1/contacts?page=1&limit=1&companyId=f5558c03-3d18-481b-868d-7b90af0e2af1&sortBy=name&order=asc
```

Expected: **200**, at most one record in `data`, and pagination metadata with
`page: 1` and `limit: 1`. Use `page=2` to check the next page when enough records exist.

With another account's JWT, `GET /api/v1/contacts` must exclude your contact.
The other account can still see its own contacts. Reading or updating your contact
using that JWT must return **404**.

Run the soft-delete checks last:

```http
DELETE http://localhost:4000/api/v1/contacts/<contactId>
```

No body. Expected: **200**, `success: true`, and `data.message: "Contact deleted"`.

- GET that contact: **404**, `CONTACT_NOT_FOUND`.
- PATCH its follow-up using a valid date body: **404**, `CONTACT_NOT_FOUND`.
- PUT that contact using `{"notes":"After deletion"}`: **404**, `CONTACT_NOT_FOUND`.
- GET the contact list: the deleted ID must be excluded.
- The database record remains with a non-null `deletedAt`.

## Manual completion checklist

- [ ] 2.3 create, read, list, and update return successful responses.
- [ ] 2.4 both dates update and persist.
- [ ] 2.4 either date can update while the omitted date stays unchanged.
- [ ] 2.5 invalid payloads return validation errors without changing the contact.
- [ ] 2.5 authentication and account ownership are enforced.
- [ ] 2.5 pagination works.
- [ ] 2.5 soft-deleted contacts are excluded from list, read, and update.

To run the automated build and integration checks from `server`:

```powershell
npm.cmd run test:contacts
```

The automated checks create temporary fixtures inside a database transaction and
roll them back when finished.
