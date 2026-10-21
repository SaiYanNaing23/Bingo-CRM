# Phase 8: Documents sample requests

**Status: implemented and automatically verified (2026-09-10).** These requests match [backend Phase 8](../../agenda.md#phase-8---documents-module). All eight endpoints are mounted under `/api/v1/documents`. Build, 8 Documents integration scenarios (covering migration constraints, auth, validation, CRUD, entity lifecycle, versioning, search/pagination, and rollback), and the existing module regression suites pass. The manual checklist below is reserved for your own results.

## Setup

The Documents migration (`20260910000000_documents`) is already applied to the configured Neon database and Prisma client is generated. On another checkout or database, run these in `server/`:

```powershell
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run build
npm.cmd run start
```

Run integration tests:
```powershell
npm.cmd run test:documents
```

Authentication header:
```http
Authorization: Bearer <your_access_token>
Content-Type: application/json
```

## Endpoint checklist

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| POST | `/api/v1/documents` | title, fileName, fileSize, mimeType, fileUrl; optional type/tags/entity/description | 201, document with currentVersion |
| GET | `/api/v1/documents` | None (supports search, type, tag, entityType, entityId, pagination) | 200, document array + top-level meta |
| GET | `/api/v1/documents/:id` | None | 200, document with currentVersion and versionCount |
| PUT | `/api/v1/documents/:id` | At least one of title/type/description/tags/entity | 200, document in data |
| DELETE | `/api/v1/documents/:id` | None | 200, `{ id, deleted: true }` in data |
| POST | `/api/v1/documents/:id/versions` | fileName, fileSize, mimeType, fileUrl; optional changelog/storageProvider/storageKey | 201, version in data |
| GET | `/api/v1/documents/:id/versions` | None (supports pagination & order) | 200, version array + top-level meta |
| DELETE | `/api/v1/documents/:id/versions/:versionId` | None | 200, `{ id, deleted: true }` in data |

## Field rules (8.1–8.2)

| Field | Rule |
| --- | --- |
| title | Required, trimmed, 2–200 characters |
| type | RESUME, COVER_LETTER, CERTIFICATE, ASSIGNMENT, OFFER_LETTER, CONTRACT, OTHER (default: OTHER) |
| description | Optional string, at most 2000 characters; nullable |
| tags | Up to 20 strings, each trimmed and 1–40 characters; lowercase/deduplicated; default [] |
| entity | null, or a complete `{ type, id }` object; default null |
| entity.type | COMPANY, CONTACT, APPLICATION, TASK, PROJECT |
| entity.id | UUID of an owned record that is not soft-deleted when assigned |
| fileName | Required for version, 1–255 characters, trimmed |
| fileSize | Positive integer (bytes), up to 100MB (104,857,600) |
| mimeType | Required for version, 3–100 characters |
| fileUrl | Required for version, 1–2000 characters |
| storageProvider | Default "METADATA" |
| changelog | Optional string, at most 1000 characters |

## Sample Requests

### 1. Create a Document with Initial Version
```http
POST http://localhost:4000/api/v1/documents
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "title": "Master Backend Resume - 2026",
  "type": "RESUME",
  "description": "General master resume highlighting Node.js, TypeScript, PostgreSQL",
  "tags": ["resume", "master", "backend"],
  "fileName": "resume-master-2026.pdf",
  "fileSize": 1048576,
  "mimeType": "application/pdf",
  "fileUrl": "https://storage.example.com/resumes/resume-master-2026.pdf"
}
```

Response (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "c1f7a048-73b8-4c91-9c88-662706e57973",
    "userId": "usr_123",
    "title": "Master Backend Resume - 2026",
    "type": "RESUME",
    "description": "General master resume highlighting Node.js, TypeScript, PostgreSQL",
    "tags": ["resume", "master", "backend"],
    "entity": null,
    "entityAvailable": null,
    "currentVersion": {
      "id": "v1_abc",
      "documentId": "c1f7a048-73b8-4c91-9c88-662706e57973",
      "userId": "usr_123",
      "version": 1,
      "fileName": "resume-master-2026.pdf",
      "fileSize": 1048576,
      "mimeType": "application/pdf",
      "fileUrl": "https://storage.example.com/resumes/resume-master-2026.pdf",
      "storageProvider": "METADATA",
      "storageKey": null,
      "changelog": "Initial version",
      "createdAt": "2026-10-21T15:00:00.000Z",
      "deletedAt": null
    },
    "versionCount": 1,
    "createdAt": "2026-10-21T15:00:00.000Z",
    "updatedAt": "2026-10-21T15:00:00.000Z",
    "deletedAt": null
  }
}
```

### 2. Add a New Version to Document
```http
POST http://localhost:4000/api/v1/documents/c1f7a048-73b8-4c91-9c88-662706e57973/versions
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "fileName": "resume-master-v2.pdf",
  "fileSize": 1258291,
  "mimeType": "application/pdf",
  "fileUrl": "https://storage.example.com/resumes/resume-master-v2.pdf",
  "changelog": "Added cloud certifications and updated experience"
}
```

### 3. List Versions of a Document
```http
GET http://localhost:4000/api/v1/documents/c1f7a048-73b8-4c91-9c88-662706e57973/versions?page=1&limit=10&order=desc
Authorization: Bearer <your_access_token>
```

### 4. Link Document to an Application
```http
PUT http://localhost:4000/api/v1/documents/c1f7a048-73b8-4c91-9c88-662706e57973
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "entity": {
    "type": "APPLICATION",
    "id": "<application_id>"
  }
}
```

---

## User Manual Verification Checklist

- [ ] Create a standalone Document (e.g., Certificate or Resume) and verify 201 response.
- [ ] List Documents with search/tags filter and verify pagination meta.
- [ ] Add version 2 to the Document and confirm version auto-increments.
- [ ] View Document detail and verify `currentVersion` reflects version 2 and `versionCount` is 2.
- [ ] Link Document to an active CRM record (Company/Application) and confirm `entityAvailable` is true.
- [ ] Soft-delete a version and ensure you cannot delete the only active version.
- [ ] Soft-delete the entire Document and confirm 404 on subsequent GET.

