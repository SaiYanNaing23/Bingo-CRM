const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const test = require('node:test');

require('dotenv').config({ quiet: true });
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'fatal';
process.env.RATE_LIMIT_MAX = '1000';

const jwt = require('jsonwebtoken');
const { env } = require('../dist/src/config/env');
const { createApplicationTestDatabase } = require('./helpers/application-database.cjs');

test('Phase 3 Applications API, migrations, and transactional history', { timeout: 180000 }, async (t) => {
  const fixture = await createApplicationTestDatabase(env.DATABASE_URL);
  const { db } = fixture;
  global.__prisma = db;
  const { app } = require('../dist/src/app');
  const server = app.listen(0, '127.0.0.1');

  try {
    await once(server, 'listening');
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
    const users = [];
    for (let i = 0; i < 2; i++) users.push(await db.user.create({ data: {
      fullName: 'Application test user', email: `applications-${randomUUID()}@example.com`, passwordHash: 'test-fixture-no-login',
    } }));
    const tokens = users.map(user => jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: 300 }));
    const api = async (method, path, body, status = 200, token = tokens[0]) => {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(result)}`);
      assert.equal(result.success, status < 400);
      return result;
    };
    const request = (method, path, ...args) => api(method, `/applications${path}`, ...args);
    const company = (await api('POST', '/companies', { name: 'Application Test Company' }, 201)).data;
    const secondCompany = (await api('POST', '/companies', { name: 'Another Test Company' }, 201)).data;
    const foreignCompany = (await api('POST', '/companies', { name: 'Other Owner Company' }, 201, tokens[1])).data;
    const contactPayload = {
      companyId: company.id, photo: 'https://example.com/photo.png', name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com', phone: '+1 234 567 8900', linkedIn: 'https://www.linkedin.com/in/sarah-johnson',
      role: 'Recruiter', lastContactAt: '2026-09-08T09:00:00.000Z', nextFollowUpAt: '2026-09-15T09:00:00.000Z',
    };
    const contact = (await api('POST', '/contacts', contactPayload, 201)).data;
    const secondContact = (await api('POST', '/contacts', { ...contactPayload, companyId: secondCompany.id }, 201)).data;
    const foreignContact = (await api('POST', '/contacts', { ...contactPayload, companyId: foreignCompany.id }, 201, tokens[1])).data;
    const payload = {
      companyId: company.id, position: 'Backend Engineer', dateApplied: '2026-09-08T09:00:00.000Z',
      salary: 'USD 70,000-90,000/year', timezone: 'Asia/Yangon', recruiter: contact.id, stage: 'APPLIED', notes: 'Node.js role',
    };
    const create = async (overrides = {}) => (await request('POST', '', { ...payload, ...overrides }, 201)).data;
    const history = async (id) => request('GET', `/${id}/stage-history?limit=100`);
    let application;

    await t.test('fresh migrations create the application and history relations', async () => {
      assert.ok(fixture.migrations.includes('20260908000000_applications'));
      const constraints = await db.$queryRaw`SELECT conname FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = ${fixture.schema} AND c.contype = 'f' AND (c.conname LIKE 'Application_%' OR c.conname LIKE 'ApplicationStageHistory_%')`;
      assert.equal(constraints.length, 5);
    });

    await t.test('POST persists fields and an initial stage entry', async () => {
      application = await create();
      for (const [key, value] of Object.entries(payload)) assert.equal(application[key], value);
      assert.equal(application.userId, users[0].id);
      assert.equal(application.deletedAt, null);
      const timeline = await history(application.id);
      assert.equal(timeline.meta.total, 1);
      assert.equal(timeline.data[0].fromStage, null);
      assert.equal(timeline.data[0].toStage, 'APPLIED');
      assert.equal(timeline.data[0].changedById, users[0].id);
      assert.equal((await request('GET', `/${application.id}`)).data.id, application.id);
    });
    assert.ok(application, 'Application creation is required for the remaining checks');

    await t.test('Wishlist defaults and required application dates are enforced', async () => {
      const wishlist = (await request('POST', '', { companyId: company.id, position: 'Wishlist role' }, 201)).data;
      assert.equal(wishlist.stage, 'WISHLIST');
      assert.equal(wishlist.dateApplied, null);
      assert.equal(wishlist.salary, null);
      assert.equal(wishlist.recruiter, null);
      assert.equal(wishlist.timezone, 'UTC');
      assert.equal((await request('PATCH', `/${wishlist.id}/stage`, { stage: 'APPLIED' }, 400)).code, 'APPLICATION_DATE_REQUIRED');
      assert.equal((await history(wishlist.id)).meta.total, 1);
      await request('PUT', `/${wishlist.id}`, { dateApplied: payload.dateApplied });
      await request('PATCH', `/${wishlist.id}/stage`, { stage: 'HR' });
      assert.equal((await request('PUT', `/${wishlist.id}`, { dateApplied: null }, 400)).code, 'APPLICATION_DATE_REQUIRED');
    });

    await t.test('PUT preserves omitted details, clears nullable fields, and cannot alter stage or owner', async () => {
      const updated = (await request('PUT', `/${application.id}`, { position: 'Senior Backend Engineer', salary: null })).data;
      assert.equal(updated.position, 'Senior Backend Engineer');
      assert.equal(updated.salary, null);
      assert.equal(updated.recruiter, contact.id);
      assert.equal(updated.stage, 'APPLIED');
      assert.equal((await history(application.id)).meta.total, 1);
      for (const body of [{ stage: 'OFFER' }, { userId: users[1].id }, { deletedAt: null }, {}]) {
        assert.equal((await request('PUT', `/${application.id}`, body, 400)).code, 'VALIDATION_ERROR');
      }
    });

    await t.test('validation rejects bad IDs, stages, dates, salary types, timezones, and ranges', async () => {
      for (const override of [
        { companyId: 'invalid' }, { recruiter: 'Sarah Johnson' }, { stage: 'UNKNOWN' },
        { position: '' }, { dateApplied: '2026-02-30T09:00:00.000Z' }, { dateApplied: null },
        { dateApplied: true }, { salary: 90000 }, { timezone: 'Invalid/Zone' }, { timezone: '+06:30' },
        { userId: users[1].id },
      ]) assert.equal((await request('POST', '', { ...payload, ...override }, 400)).code, 'VALIDATION_ERROR');
      await request('GET', '/not-a-uuid', undefined, 400);
      for (const query of ['stage=UNKNOWN', 'sortBy=salary', 'page=0', 'limit=0', 'companyId=bad', 'dateAppliedFrom=bad', 'dateAppliedFrom=2026-09-20T00:00:00.000Z&dateAppliedTo=2026-09-01T00:00:00.000Z']) {
        assert.equal((await request('GET', `?${query}`, undefined, 400)).code, 'VALIDATION_ERROR');
      }
      const offset = await create({ dateApplied: '2026-09-08T15:30:00.000+06:30' });
      assert.equal(offset.dateApplied, payload.dateApplied);
    });

    await t.test('company and recruiter ownership, active state, and reassignment are checked', async () => {
      for (const companyId of [foreignCompany.id, randomUUID()]) {
        assert.equal((await request('POST', '', { ...payload, companyId }, 404)).code, 'APPLICATION_COMPANY_NOT_FOUND');
        await request('PUT', `/${application.id}`, { companyId }, 404);
      }
      for (const recruiter of [secondContact.id, foreignContact.id, randomUUID()]) {
        assert.equal((await request('POST', '', { ...payload, recruiter }, 404)).code, 'APPLICATION_RECRUITER_NOT_FOUND');
        await request('PUT', `/${application.id}`, { recruiter }, 404);
      }
      const moved = await create();
      await request('PUT', `/${moved.id}`, { companyId: secondCompany.id }, 404);
      const reassigned = (await request('PUT', `/${moved.id}`, { companyId: secondCompany.id, recruiter: secondContact.id })).data;
      assert.equal(reassigned.recruiter, secondContact.id);
      assert.equal(reassigned.companyId, secondCompany.id);
      assert.equal((await request('PUT', `/${moved.id}`, { companyId: company.id, recruiter: null })).data.recruiter, null);
      const deletedContact = (await api('POST', '/contacts', contactPayload, 201)).data;
      await api('DELETE', `/contacts/${deletedContact.id}`);
      await request('POST', '', { ...payload, recruiter: deletedContact.id }, 404);
      const deletedCompany = (await api('POST', '/companies', { name: 'Deleted test company' }, 201)).data;
      await api('DELETE', `/companies/${deletedCompany.id}`);
      await request('POST', '', { ...payload, companyId: deletedCompany.id, recruiter: null }, 404);
    });

    await t.test('list combines filters and search with deterministic pagination and null dates last', async () => {
      const a = await create({ position: 'Filter role', notes: 'unique-filter-marker', dateApplied: '2026-09-10T09:00:00.000Z' });
      const b = await create({ position: 'Filter role', notes: 'unique-filter-marker', dateApplied: '2026-09-12T09:00:00.000Z' });
      const nullDate = await create({ position: 'Filter role', notes: 'unique-filter-marker', dateApplied: null, stage: 'WISHLIST' });
      const query = `?companyId=${company.id}&stage=APPLIED&search=UNIQUE-FILTER-MARKER&dateAppliedFrom=2026-09-09T00:00:00.000Z&dateAppliedTo=2026-09-13T00:00:00.000Z&sortBy=position&order=asc&limit=1`;
      const first = await request('GET', `${query}&page=1`);
      const second = await request('GET', `${query}&page=2`);
      assert.equal(first.meta.total, 2);
      assert.equal(first.meta.totalPages, 2);
      assert.deepEqual([first.data[0].id, second.data[0].id], [a.id, b.id].sort());
      const dateAsc = await request('GET', '?search=unique-filter-marker&sortBy=dateApplied&order=asc');
      const dateDesc = await request('GET', '?search=unique-filter-marker&sortBy=dateApplied&order=desc');
      assert.deepEqual(dateAsc.data.map(row => row.id), [a.id, b.id, nullDate.id]);
      assert.deepEqual(dateDesc.data.map(row => row.id), [b.id, a.id, nullDate.id]);
      assert.deepEqual((await request('GET', '?search=no-matching-application')).data, []);
    });

    await t.test('all routes enforce authentication and ownership', async () => {
      for (const [method, path, body] of [
        ['GET', '', undefined], ['POST', '', payload], ['GET', `/${application.id}`, undefined],
        ['PUT', `/${application.id}`, { notes: 'No access' }], ['DELETE', `/${application.id}`, undefined],
        ['PATCH', `/${application.id}/stage`, { stage: 'HR' }], ['GET', `/${application.id}/stage-history`, undefined],
      ]) await request(method, path, body, 401, null);
      const foreignApplication = (await request('POST', '', { ...payload, companyId: foreignCompany.id, recruiter: foreignContact.id }, 201, tokens[1])).data;
      const otherList = await request('GET', '', undefined, 200, tokens[1]);
      assert.equal(otherList.meta.total, 1);
      assert.equal(otherList.data[0].id, foreignApplication.id);
      for (const id of [application.id, randomUUID()]) {
        for (const [method, path, body] of [
          ['GET', `/${id}`, undefined], ['PUT', `/${id}`, { notes: 'No access' }], ['DELETE', `/${id}`, undefined],
          ['PATCH', `/${id}/stage`, { stage: 'HR' }], ['GET', `/${id}/stage-history`, undefined],
        ]) assert.equal((await request(method, path, body, 404, tokens[1])).code, 'APPLICATION_NOT_FOUND');
      }
    });

    await t.test('stage changes support skipping, backward moves, rejection, archiving, and reopening', async () => {
      const record = await create();
      for (const stage of ['TECHNICAL', 'HR', 'ASSIGNMENT', 'FINAL', 'OFFER', 'REJECTED', 'ARCHIVED', 'WISHLIST']) {
        assert.equal((await request('PATCH', `/${record.id}/stage`, { stage })).data.stage, stage);
        if (stage === 'ARCHIVED') {
          assert.equal((await request('GET', `/${record.id}`)).data.stage, 'ARCHIVED');
          assert.ok((await request('GET', '?stage=ARCHIVED')).data.some(row => row.id === record.id));
        }
      }
      const timeline = await history(record.id);
      assert.equal(timeline.meta.total, 9);
      for (let i = 1; i < timeline.data.length; i++) {
        assert.equal(timeline.data[i].fromStage, timeline.data[i - 1].toStage);
        assert.ok(timeline.data[i].createdAt > timeline.data[i - 1].createdAt);
        assert.equal(timeline.data[i].changedById, users[0].id);
      }
      const page = await request('GET', `/${record.id}/stage-history?page=2&limit=2`);
      assert.equal(page.meta.total, 9);
      assert.deepEqual(page.data.map(row => row.id), timeline.data.slice(2, 4).map(row => row.id));
      const before = (await request('GET', `/${record.id}`)).data;
      const repeated = (await request('PATCH', `/${record.id}/stage`, { stage: 'WISHLIST' })).data;
      assert.equal(repeated.updatedAt, before.updatedAt);
      await request('PATCH', `/${record.id}/stage`, { stage: 'invalid' }, 400);
      await request('PATCH', `/${record.id}/stage`, {}, 400);
      assert.equal((await history(record.id)).meta.total, 9);
    });

    await t.test('simultaneous stage changes retain the actual stage chain; duplicate retries add one event', async () => {
      const record = await create();
      await Promise.all(['HR', 'TECHNICAL'].map(stage => request('PATCH', `/${record.id}/stage`, { stage })));
      let timeline = await history(record.id);
      assert.equal(timeline.meta.total, 3);
      assert.equal(timeline.data[1].fromStage, 'APPLIED');
      assert.equal(timeline.data[2].fromStage, timeline.data[1].toStage);
      assert.equal((await request('GET', `/${record.id}`)).data.stage, timeline.data[2].toStage);
      await Promise.all(Array.from({ length: 3 }, () => request('PATCH', `/${record.id}/stage`, { stage: 'OFFER' })));
      timeline = await history(record.id);
      assert.equal(timeline.meta.total, 4);
      assert.equal(timeline.data[3].toStage, 'OFFER');
      assert.equal(timeline.data[3].fromStage, timeline.data[2].toStage);
    });

    await t.test('history write failure rolls back creation and stage changes in the real database', async () => {
      const record = await create();
      const realTransaction = db.$transaction.bind(db);
      // Inject only the failing history write; every other operation and rollback uses PostgreSQL.
      db.$transaction = (work, options) => typeof work !== 'function' ? realTransaction(work, options) : realTransaction(tx => work(new Proxy(tx, {
        get(target, property) {
          if (property === 'applicationStageHistory') return new Proxy(target.applicationStageHistory, {
            get(delegate, method) {
              if (method === 'create') return async () => { throw new Error('Injected history write failure'); };
              return Reflect.get(delegate, method);
            },
          });
          return Reflect.get(target, property);
        },
      })), options);
      try {
        await request('PATCH', `/${record.id}/stage`, { stage: 'OFFER' }, 500);
        await request('POST', '', { ...payload, position: 'Rollback creation marker' }, 500);
      } finally {
        db.$transaction = realTransaction;
      }
      assert.equal((await request('GET', `/${record.id}`)).data.stage, 'APPLIED');
      assert.equal((await history(record.id)).meta.total, 1);
      assert.equal(await db.application.count({ where: { userId: users[0].id, position: 'Rollback creation marker' } }), 0);
    });

    await t.test('soft-delete retains storage/history while excluding all access and list totals', async () => {
      const record = await create({ position: 'Delete-only marker' });
      await request('PATCH', `/${record.id}/stage`, { stage: 'ARCHIVED' });
      await request('DELETE', `/${record.id}`);
      assert.ok((await db.application.findUniqueOrThrow({ where: { id: record.id } })).deletedAt);
      assert.equal(await db.applicationStageHistory.count({ where: { applicationId: record.id } }), 2);
      for (const [method, path, body] of [
        ['GET', `/${record.id}`, undefined], ['PUT', `/${record.id}`, { notes: 'Deleted' }], ['DELETE', `/${record.id}`, undefined],
        ['PATCH', `/${record.id}/stage`, { stage: 'APPLIED' }], ['GET', `/${record.id}/stage-history`, undefined],
      ]) assert.equal((await request(method, path, body, 404)).code, 'APPLICATION_NOT_FOUND');
      const list = await request('GET', '?search=Delete-only');
      assert.equal(list.meta.total, 0);
      assert.deepEqual(list.data, []);
    });

    await t.test('Companies and Contacts remain usable with application relations', async () => {
      assert.equal((await api('GET', `/companies/${company.id}`)).data.name, company.name);
      assert.equal((await api('PUT', `/companies/${company.id}`, { notes: 'Company regression' })).data.notes, 'Company regression');
      assert.ok((await api('GET', '/companies?page=1&limit=1')).meta.total >= 2);
      assert.equal((await api('GET', `/contacts/${contact.id}`)).data.name, contact.name);
      assert.equal((await api('PATCH', `/contacts/${contact.id}/follow-up`, { nextFollowUpAt: '2026-09-20T09:00:00.000Z' })).data.nextFollowUpAt, '2026-09-20T09:00:00.000Z');
      assert.ok((await api('GET', `/contacts?companyId=${company.id}&limit=1`)).meta.total >= 1);
    });
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    delete global.__prisma;
    await fixture.cleanup();
  }
});
