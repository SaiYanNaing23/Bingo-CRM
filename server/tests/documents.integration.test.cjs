const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const test = require('node:test');

require('dotenv').config({ quiet: true });
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'fatal';
process.env.RATE_LIMIT_MAX = '3000';

const jwt = require('jsonwebtoken');
const { env } = require('../dist/src/config/env');
const { createApplicationTestDatabase: createTestDatabase } = require('./helpers/application-database.cjs');

const entities = {
  COMPANY: { model: 'company', table: 'Company', column: 'companyId', route: 'companies' },
  CONTACT: { model: 'contact', table: 'Contact', column: 'contactId', route: 'contacts' },
  APPLICATION: { model: 'application', table: 'Application', column: 'applicationId', route: 'applications' },
  TASK: { model: 'task', table: 'Task', column: 'taskId', route: 'tasks' },
  PROJECT: { model: 'project', table: 'Project', column: 'projectId', route: 'projects' },
};

test('Phase 8 Documents API, versioning, storage metadata, and entity lifecycle', { timeout: 240000 }, async t => {
  const fixture = await createTestDatabase(env.DATABASE_URL);
  const { db } = fixture;
  global.__prisma = db;
  const { app } = require('../dist/src/app');
  const server = app.listen(0, '127.0.0.1');

  try {
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}/api/v1`;

    const account = async () => {
      const user = await db.user.create({
        data: {
          fullName: 'Document tester',
          email: `doc-${randomUUID()}@example.com`,
          passwordHash: 'fixture-no-login',
        },
      });
      return {
        user,
        token: jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: 600 }),
      };
    };

    const owner = await account();
    const other = await account();

    const api = async (method, path, body, expected = 200, token = owner.token) => {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result).slice(0, 1000)}`);
      assert.equal(result.success, expected < 400);
      return result;
    };

    const request = (method, path, body, expected, token) => api(method, `/documents${path}`, body, expected, token);

    const defaultPayload = {
      title: 'Senior Software Engineer Resume',
      type: 'RESUME',
      description: 'Master resume customized for backend roles',
      tags: ['resume', 'backend', '2026'],
      fileName: 'resume-2026.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      fileUrl: 'https://storage.example.com/docs/resume-2026.pdf',
      storageProvider: 'METADATA',
    };

    const create = async (input = {}, token = owner.token) =>
      (await request('POST', '', { ...defaultPayload, ...input }, 201, token)).data;

    const targets = async (userId = owner.user.id) => {
      const company = await db.company.create({
        data: { userId, name: 'Document Company', techStack: [] },
      });
      const [contact, application, task, project] = await Promise.all([
        db.contact.create({
          data: {
            userId,
            companyId: company.id,
            name: 'Document Contact',
            photo: 'https://example.com/p.png',
            email: 'c@example.com',
            phone: '123',
            linkedIn: 'https://in.com',
            role: 'Lead',
            lastContactAt: new Date(),
            nextFollowUpAt: new Date(),
          },
        }),
        db.application.create({
          data: { userId, companyId: company.id, position: 'Lead Engineer' },
        }),
        db.task.create({
          data: { userId, title: 'Document Task' },
        }),
        db.project.create({
          data: { userId, name: 'Document Project' },
        }),
      ]);
      return { COMPANY: company, CONTACT: contact, APPLICATION: application, TASK: task, PROJECT: project };
    };

    const owned = await targets(owner.user.id);
    const foreign = await targets(other.user.id);

    await t.test('fresh migration replay verifies Document & DocumentVersion schemas and constraints', async () => {
      assert.ok(fixture.migrations.includes('20260910000000_documents'));

      // Check title length constraint in DB
      await assert.rejects(
        () => db.document.create({
          data: { userId: owner.user.id, title: 'a' },
        }),
        /Document_title_check/i,
      );

      // Check single source constraint in DB
      await assert.rejects(
        () => db.document.create({
          data: {
            userId: owner.user.id,
            title: 'Double Source Doc',
            companyId: owned.COMPANY.id,
            projectId: owned.PROJECT.id,
          },
        }),
        /Document_one_source_check/i,
      );

      // Check version fileSize constraint in DB
      const validDoc = await db.document.create({
        data: { userId: owner.user.id, title: 'Valid Document For Constraint Test' },
      });
      await assert.rejects(
        () => db.documentVersion.create({
          data: {
            documentId: validDoc.id,
            userId: owner.user.id,
            version: 1,
            fileName: 'test.pdf',
            fileSize: 0,
            mimeType: 'application/pdf',
            fileUrl: 'https://example.com/file',
          },
        }),
        /DocumentVersion_fileSize_check/i,
      );
    });

    await t.test('unauthenticated requests return 401 AUTH_MISSING_TOKEN', async () => {
      for (const [method, path] of [
        ['GET', ''],
        ['POST', ''],
        ['GET', '/11111111-1111-4111-8111-111111111111'],
        ['PUT', '/11111111-1111-4111-8111-111111111111'],
        ['DELETE', '/11111111-1111-4111-8111-111111111111'],
        ['POST', '/11111111-1111-4111-8111-111111111111/versions'],
        ['GET', '/11111111-1111-4111-8111-111111111111/versions'],
        ['DELETE', '/11111111-1111-4111-8111-111111111111/versions/22222222-2222-4222-8222-222222222222'],
      ]) {
        const res = await request(method, path, undefined, 401, null);
        assert.equal(res.code, 'AUTH_MISSING_TOKEN');
      }
    });

    await t.test('validation rejects invalid inputs and malformed payloads', async () => {
      // Missing title
      let res = await request('POST', '', { ...defaultPayload, title: '' }, 400);
      assert.equal(res.code, 'VALIDATION_ERROR');

      // Title too short
      res = await request('POST', '', { ...defaultPayload, title: 'x' }, 400);
      assert.equal(res.code, 'VALIDATION_ERROR');

      // NUL character in title
      res = await request('POST', '', { ...defaultPayload, title: 'bad\0title' }, 400);
      assert.equal(res.code, 'VALIDATION_ERROR');

      // Invalid fileSize
      res = await request('POST', '', { ...defaultPayload, fileSize: -50 }, 400);
      assert.equal(res.code, 'VALIDATION_ERROR');

      // Invalid DocumentType
      res = await request('POST', '', { ...defaultPayload, type: 'UNKNOWN_TYPE' }, 400);
      assert.equal(res.code, 'VALIDATION_ERROR');

      // Empty update
      const doc = await create();
      res = await request('PUT', `/${doc.id}`, {}, 400);
      assert.equal(res.code, 'VALIDATION_ERROR');
    });

    await t.test('document CRUD, metadata update, and account isolation', async () => {
      const doc = await create({ title: 'My Portfolio Resume', tags: ['CV', 'Fullstack'] });
      assert.equal(doc.title, 'My Portfolio Resume');
      assert.deepEqual(doc.tags, ['cv', 'fullstack']);
      assert.equal(doc.versionCount, 1);
      assert.equal(doc.currentVersion.version, 1);
      assert.equal(doc.currentVersion.fileName, 'resume-2026.pdf');
      assert.equal(doc.entity, null);
      assert.equal(doc.entityAvailable, null);

      // GET detail
      const detail = (await request('GET', `/${doc.id}`)).data;
      assert.equal(detail.id, doc.id);
      assert.equal(detail.currentVersion.version, 1);

      // Other user cannot read or update
      await request('GET', `/${doc.id}`, undefined, 404, other.token);
      await request('PUT', `/${doc.id}`, { title: 'Hacked Title' }, 404, other.token);
      await request('DELETE', `/${doc.id}`, undefined, 404, other.token);

      // Update document
      const updated = (await request('PUT', `/${doc.id}`, {
        title: 'Updated Senior Resume',
        description: 'Updated description',
        tags: ['lead', 'architecture'],
      })).data;
      assert.equal(updated.title, 'Updated Senior Resume');
      assert.equal(updated.description, 'Updated description');
      assert.deepEqual(updated.tags, ['lead', 'architecture']);

      // Soft delete
      const delRes = await request('DELETE', `/${doc.id}`);
      assert.deepEqual(delRes.data, { id: doc.id, deleted: true });

      // Deleted doc is not accessible via GET
      await request('GET', `/${doc.id}`, undefined, 404);
      // And its versions are soft-deleted too
      const versionsInDb = await db.documentVersion.findMany({ where: { documentId: doc.id, deletedAt: null } });
      assert.equal(versionsInDb.length, 0);
    });

    await t.test('entity binding lifecycle, detach, rebind, and target deletion', async () => {
      // Cannot link to foreign entity
      await request('POST', '', {
        ...defaultPayload,
        title: 'Foreign Entity Doc',
        entity: { type: 'COMPANY', id: foreign.COMPANY.id },
      }, 404);

      // Link to owned APPLICATION
      const doc = await create({
        title: 'Application Tailored Resume',
        type: 'RESUME',
        entity: { type: 'APPLICATION', id: owned.APPLICATION.id },
      });
      assert.deepEqual(doc.entity, { type: 'APPLICATION', id: owned.APPLICATION.id });
      assert.equal(doc.entityAvailable, true);

      // Rebind to PROJECT
      const rebound = (await request('PUT', `/${doc.id}`, {
        entity: { type: 'PROJECT', id: owned.PROJECT.id },
      })).data;
      assert.deepEqual(rebound.entity, { type: 'PROJECT', id: owned.PROJECT.id });
      assert.equal(rebound.entityAvailable, true);

      // Detach entity with null
      const detached = (await request('PUT', `/${doc.id}`, { entity: null })).data;
      assert.equal(detached.entity, null);
      assert.equal(detached.entityAvailable, null);

      // Rebind to contact, then soft-delete contact
      await request('PUT', `/${doc.id}`, { entity: { type: 'CONTACT', id: owned.CONTACT.id } });
      await db.contact.update({ where: { id: owned.CONTACT.id }, data: { deletedAt: new Date() } });

      const checked = (await request('GET', `/${doc.id}`)).data;
      assert.deepEqual(checked.entity, { type: 'CONTACT', id: owned.CONTACT.id });
      assert.equal(checked.entityAvailable, false);
    });

    await t.test('versioning lifecycle: add versions, list versions, and version deletion rules', async () => {
      const doc = await create({ title: 'Multi-version Document' });
      assert.equal(doc.versionCount, 1);

      // Add version 2
      const v2Res = await request('POST', `/${doc.id}/versions`, {
        fileName: 'resume-v2.pdf',
        fileSize: 2048000,
        mimeType: 'application/pdf',
        fileUrl: 'https://storage.example.com/docs/resume-v2.pdf',
        changelog: 'Added cloud certifications and updated experience',
      }, 201);
      assert.equal(v2Res.data.version, 2);
      assert.equal(v2Res.data.fileName, 'resume-v2.pdf');

      // Add version 3
      const v3Res = await request('POST', `/${doc.id}/versions`, {
        fileName: 'resume-v3.pdf',
        fileSize: 2500000,
        mimeType: 'application/pdf',
        fileUrl: 'https://storage.example.com/docs/resume-v3.pdf',
        changelog: 'Refined achievements section',
      }, 201);
      assert.equal(v3Res.data.version, 3);

      // GET document detail shows versionCount 3 and currentVersion version 3
      const detail = (await request('GET', `/${doc.id}`)).data;
      assert.equal(detail.versionCount, 3);
      assert.equal(detail.currentVersion.version, 3);
      assert.equal(detail.currentVersion.fileName, 'resume-v3.pdf');

      // List versions
      const versionsList = await request('GET', `/${doc.id}/versions`);
      assert.equal(versionsList.meta.total, 3);
      assert.equal(versionsList.data.length, 3);
      assert.equal(versionsList.data[0].version, 3);
      assert.equal(versionsList.data[1].version, 2);
      assert.equal(versionsList.data[2].version, 1);

      // Delete version 2
      const delV2 = await request('DELETE', `/${doc.id}/versions/${v2Res.data.id}`);
      assert.deepEqual(delV2.data, { id: v2Res.data.id, deleted: true });

      // After deleting v2, total active versions is 2
      const detailAfter = (await request('GET', `/${doc.id}`)).data;
      assert.equal(detailAfter.versionCount, 2);

      // Delete version 3
      await request('DELETE', `/${doc.id}/versions/${v3Res.data.id}`);

      // Now only version 1 remains. Attempting to delete the ONLY active version must fail!
      const v1Id = detail.currentVersion.version === 1 ? detail.currentVersion.id : versionsList.data[2].id;
      const failDel = await request('DELETE', `/${doc.id}/versions/${v1Id}`, undefined, 400);
      assert.equal(failDel.code, 'CANNOT_DELETE_ONLY_VERSION');
    });

    await t.test('filtering, search, and pagination', async () => {
      const marker = `search-${randomUUID().slice(0, 8)}`;
      await create({ title: `Docker ${marker} Certificate`, type: 'CERTIFICATE', tags: ['docker', marker] });
      await create({ title: `Offer Letter ${marker}`, type: 'OFFER_LETTER', tags: ['offer', marker] });
      await create({ title: `Standard ${marker} Document`, type: 'OTHER', tags: ['other', marker] });

      // Search by title
      let res = await request('GET', `?search=${marker}`);
      assert.equal(res.meta.total, 3);

      // Filter by type
      res = await request('GET', `?type=CERTIFICATE&search=${marker}`);
      assert.equal(res.meta.total, 1);
      assert.equal(res.data[0].type, 'CERTIFICATE');

      // Filter by tag
      res = await request('GET', `?tag=offer&search=${marker}`);
      assert.equal(res.meta.total, 1);
      assert.equal(res.data[0].title, `Offer Letter ${marker}`);

      // Pagination
      res = await request('GET', `?search=${marker}&limit=2&page=1`);
      assert.equal(res.data.length, 2);
      assert.equal(res.meta.page, 1);
      assert.equal(res.meta.limit, 2);
      assert.equal(res.meta.totalPages, 2);
    });
  } finally {
    try {
      await new Promise((resolve, reject) => server.close(err => (err ? reject(err) : resolve())));
    } finally {
      delete global.__prisma;
      await fixture.cleanup();
    }
  }
});

