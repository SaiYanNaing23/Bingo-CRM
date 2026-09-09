const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const test = require('node:test');

require('dotenv').config({ quiet: true });
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'fatal';
process.env.RATE_LIMIT_MAX = '2000';

const jwt = require('jsonwebtoken');
const { env } = require('../dist/src/config/env');
const { createApplicationTestDatabase: createTestDatabase } = require('./helpers/application-database.cjs');

test('Phase 5 Projects API, progress, and activity history', { timeout: 240000 }, async (t) => {
  const fixture = await createTestDatabase(env.DATABASE_URL);
  const { db } = fixture;
  global.__prisma = db;
  const { app } = require('../dist/src/app');
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}/api/v1/projects`;
    const account = async () => {
      const user = await db.user.create({ data: {
        fullName: 'Projects test user', email: `projects-${randomUUID()}@example.com`, passwordHash: 'fixture-no-login',
      } });
      return { user, token: jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: 600 }) };
    };
    const owner = await account();
    const other = await account();
    const request = async (method, path, body, expected = 200, token = owner.token) => {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result)}`);
      assert.equal(result.success, expected < 400);
      return result;
    };
    const payload = {
      name: 'BINGO CRM Portfolio', githubUrl: 'https://github.com/example/bingo-crm',
      liveDemoUrl: 'https://example.com/Bingo?Mode=Demo', status: 'IN_PROGRESS', progress: 40,
      stack: ['react', 'typescript', 'postgresql'], screenshots: ['https://example.com/Screen.png'],
      lessonsLearned: '  # Lessons\n\nKeep transactions atomic.\n  const ready = true;\nUnicode: မြန်မာ\n',
    };
    const create = async (values = {}, token = owner.token) => (await request('POST', '', { ...payload, ...values }, 201, token)).data;
    const history = async id => request('GET', `/${id}/activities?limit=100`);
    const mutateRoutes = id => [
      ['GET', `/${id}`, undefined], ['PUT', `/${id}`, { name: 'Changed name' }],
      ['DELETE', `/${id}`, undefined], ['PATCH', `/${id}/progress`, { progress: 70 }],
      ['GET', `/${id}/activities`, undefined], ['POST', `/${id}/activities`, { content: 'Comment' }],
    ];
    let project;

    await t.test('fresh migration replay enforces project state, activity shape, and foreign keys', async () => {
      assert.ok(fixture.migrations.includes('20260908020000_projects'));
      const constraints = await db.$queryRaw`SELECT conname, contype::text AS type FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = ${fixture.schema} AND c.conname LIKE 'Project%'`;
      assert.equal(constraints.filter(row => row.type === 'f').length, 3);
      assert.ok(constraints.some(row => row.conname === 'Project_status_progress_check'));
      const indexes = await db.$queryRaw`SELECT indexdef FROM pg_indexes WHERE schemaname = ${fixture.schema} AND indexname = 'Project_stack_idx'`;
      assert.match(indexes[0].indexdef, /USING gin/i);
      for (const state of [
        { status: 'PLANNED', progress: 1 }, { status: 'IN_PROGRESS', progress: 100 },
        { status: 'ON_HOLD', progress: 100 }, { status: 'COMPLETED', progress: 99 },
        { status: 'ARCHIVED', progress: -1 }, { status: 'ARCHIVED', progress: 101 },
      ]) await assert.rejects(db.project.create({ data: { userId: owner.user.id, name: 'Invalid DB state', ...state } }));
      await assert.rejects(db.project.create({ data: { userId: randomUUID(), name: 'Bad owner' } }));
      const valid = await db.project.create({ data: { userId: owner.user.id, name: 'Constraint fixture' } });
      await assert.rejects(db.projectActivity.create({ data: { projectId: valid.id, createdById: owner.user.id, type: 'COMMENT' } }));
      await assert.rejects(db.projectActivity.create({ data: { projectId: randomUUID(), createdById: owner.user.id, type: 'COMMENT', content: 'Bad project' } }));
      await assert.rejects(db.projectActivity.create({ data: { projectId: valid.id, createdById: randomUUID(), type: 'COMMENT', content: 'Bad actor' } }));
    });

    await t.test('create/read preserve portfolio fields and produce an initial activity', async () => {
      project = await create();
      for (const [key, value] of Object.entries(payload)) assert.deepEqual(project[key], value);
      assert.equal(project.userId, owner.user.id);
      assert.equal(project.deletedAt, null);
      assert.match(project.id, /^[a-f0-9-]{36}$/);
      assert.ok(project.createdAt && project.updatedAt);
      assert.deepEqual((await request('GET', `/${project.id}`)).data, project);
      const events = await history(project.id);
      assert.equal(events.meta.total, 1);
      assert.deepEqual(events.data[0], {
        id: events.data[0].id, projectId: project.id, createdById: owner.user.id, type: 'CREATED',
        fromStatus: null, toStatus: 'IN_PROGRESS', fromProgress: null, toProgress: 40,
        content: null, createdAt: project.createdAt,
      });
      assert.equal(project.activities, undefined);
      const minimal = (await request('POST', '', { name: '  Minimal project  ' }, 201)).data;
      assert.equal(minimal.name, 'Minimal project');
      assert.equal(minimal.status, 'PLANNED');
      assert.equal(minimal.progress, 0);
      assert.deepEqual(minimal.stack, []);
      assert.deepEqual(minimal.screenshots, []);
      for (const key of ['githubUrl', 'liveDemoUrl', 'lessonsLearned']) assert.equal(minimal[key], null);
    });
    assert.ok(project, 'Creation must work before dependent checks');

    await t.test('strict payload validation rejects invalid types, URLs, states, and reserved fields', async () => {
      const invalid = [
        { name: '' }, { name: 'x' }, { name: 'n'.repeat(201) }, { name: null },
        { status: 'UNKNOWN' }, { status: 'PLANNED' }, { status: 'COMPLETED' },
        { progress: -1 }, { progress: 101 }, { progress: 1.5 }, { progress: '40' }, { progress: null },
        { githubUrl: 'ftp://example.com/file' }, { githubUrl: 'javascript:alert(1)' },
        { githubUrl: '[link](https://example.com)' }, { liveDemoUrl: '//example.com' },
        { githubUrl: 'https://' }, { githubUrl: 'https:example.com' }, { githubUrl: '' },
        { screenshots: ['https://example.com', 'bad'] }, { screenshots: null }, { screenshots: 'https://example.com' },
        { screenshots: Array(21).fill('https://example.com/s.png') },
        { stack: null }, { stack: 'react' }, { stack: [' '] }, { stack: [123] },
        { stack: ['s'.repeat(51)] }, { stack: Array(31).fill('react') },
        { lessonsLearned: 'x'.repeat(50001) }, { lessonsLearned: false },
        { githubUrl: `https://example.com/${'x'.repeat(2048)}` },
        { userId: other.user.id }, { id: randomUUID() }, { deletedAt: null }, { createdAt: new Date().toISOString() },
        { activities: [] }, { createdById: owner.user.id }, { fromProgress: 0 },
      ];
      for (const values of invalid) assert.equal((await request('POST', '', { ...payload, ...values }, 400)).code, 'VALIDATION_ERROR');
      for (const body of [{}, [], null]) assert.equal((await request('POST', '', body, 400)).code, 'VALIDATION_ERROR');
      for (const body of [{}, { status: 'COMPLETED', progress: 100 }, { userId: other.user.id }, { name: null }, { stack: null }]) {
        assert.equal((await request('PUT', `/${project.id}`, body, 400)).code, 'VALIDATION_ERROR');
      }
      const malformed = await fetch(base, { method: 'POST', headers: { authorization: `Bearer ${owner.token}`, 'content-type': 'application/json' }, body: '{"name":' });
      assert.equal(malformed.status, 400);
      assert.equal((await malformed.json()).code, 'VALIDATION_ERROR');
      assert.equal((await request('GET', '/not-a-uuid', undefined, 400)).code, 'VALIDATION_ERROR');
    });

    await t.test('detail updates normalize arrays, preserve omitted values, and clear optional fields without history', async () => {
      const changed = (await request('PUT', `/${project.id}`, {
        name: '  Updated portfolio  ', stack: [' React ', 'TYPESCRIPT', 'react'],
        screenshots: [' https://example.com/Case.png ', 'https://example.com/Case.png', 'https://example.com/case.png'],
        liveDemoUrl: null,
      })).data;
      assert.equal(changed.name, 'Updated portfolio');
      assert.deepEqual(changed.stack, ['react', 'typescript']);
      assert.deepEqual(changed.screenshots, ['https://example.com/Case.png', 'https://example.com/case.png']);
      assert.equal(changed.liveDemoUrl, null);
      assert.equal(changed.githubUrl, payload.githubUrl);
      assert.equal(changed.lessonsLearned, payload.lessonsLearned);
      assert.equal(changed.status, 'IN_PROGRESS');
      assert.equal(changed.progress, 40);
      const cleared = (await request('PUT', `/${project.id}`, { githubUrl: null, stack: [], screenshots: [], lessonsLearned: null })).data;
      assert.equal(cleared.githubUrl, null);
      assert.equal(cleared.lessonsLearned, null);
      assert.deepEqual(cleared.stack, []);
      assert.deepEqual(cleared.screenshots, []);
      assert.equal((await history(project.id)).meta.total, 1);
      const boundary = await create({ name: 'n'.repeat(200), lessonsLearned: 'x'.repeat(50000), stack: ['s'.repeat(50)] });
      assert.equal(boundary.lessonsLearned.length, 50000);
      assert.equal(boundary.name.length, 200);
    });

    await t.test('list combines owner/status/stack/search filters and returns stable accurate pages', async () => {
      const marker = `filter-${randomUUID()}`;
      const a = await create({ name: 'Same name', lessonsLearned: marker, progress: 20 });
      const b = await create({ name: 'Same name', lessonsLearned: marker, progress: 80 });
      await create({ name: 'Wrong status', lessonsLearned: marker, status: 'ON_HOLD' });
      await create({ name: 'Wrong stack', lessonsLearned: marker, stack: ['react-native'] });
      await create({ name: 'Foreign project', lessonsLearned: marker }, other.token);
      const deleted = await create({ name: 'Deleted project', lessonsLearned: marker });
      await request('DELETE', `/${deleted.id}`);
      const query = `?status=IN_PROGRESS&stack=%20ReAcT%20&search=${marker.toUpperCase()}&sortBy=name&order=asc&limit=1`;
      const first = await request('GET', `${query}&page=1`);
      const second = await request('GET', `${query}&page=2`);
      assert.equal(first.meta.total, 2);
      assert.equal(first.meta.totalPages, 2);
      assert.equal(first.meta.hasNextPage, true);
      assert.equal(first.meta.hasPreviousPage, false);
      assert.equal(second.meta.hasNextPage, false);
      assert.equal(second.meta.hasPreviousPage, true);
      assert.deepEqual([first.data[0].id, second.data[0].id], [a.id, b.id].sort());
      assert.deepEqual((await request('GET', `${query}&page=3`)).data, []);
      const byProgress = await request('GET', `?search=${marker}&stack=react&status=IN_PROGRESS&sortBy=progress&order=desc`);
      assert.deepEqual(byProgress.data.map(row => row.progress), [80, 20]);
      const noMatch = await request('GET', `?search=${marker}&stack=rea`);
      assert.deepEqual(noMatch.data, []);
      assert.equal(noMatch.meta.total, 0);
      assert.equal(noMatch.meta.totalPages, 1);
      const capped = await request('GET', '?limit=999999');
      assert.equal(capped.meta.limit, env.PAGINATION_MAX_LIMIT);
      assert.ok((await request('GET', '?search=UPDATED%20PORTFOLIO')).data.some(row => row.id === project.id));
      const timestamp = new Date('2026-09-08T00:00:00.000Z');
      await db.project.updateMany({ where: { id: { in: [a.id, b.id] } }, data: { updatedAt: timestamp, createdAt: timestamp } });
      for (const sort of ['', '&sortBy=createdAt&order=asc']) {
        const result = await request('GET', `?search=${marker}&status=IN_PROGRESS&stack=react${sort}`);
        assert.deepEqual(result.data.map(row => row.id), [a.id, b.id].sort());
      }
    });

    await t.test('query validation rejects unknown, repeated, invalid, and out-of-range parameters', async () => {
      for (const query of [
        'page=0', 'page=-1', 'page=1.5', 'page=1000001', 'limit=0', 'limit=abc', 'page=1&page=2',
        'limit=1&limit=2', 'status=UNKNOWN', 'status=PLANNED&status=ARCHIVED', 'stack=',
        'sortBy=status', 'order=up', 'unknown=true', 'stack=react&stack=typescript',
      ]) assert.equal((await request('GET', `?${query}`, undefined, 400)).code, 'VALIDATION_ERROR');
      for (const query of ['page=0', 'limit=0', 'page=1&page=2', 'sortBy=createdAt']) {
        assert.equal((await request('GET', `/${project.id}/activities?${query}`, undefined, 400)).code, 'VALIDATION_ERROR');
      }
    });

    await t.test('all eight routes enforce authentication; record routes hide other-owner and missing IDs', async () => {
      const routes = [['POST', '', payload], ['GET', '', undefined], ...mutateRoutes(project.id)];
      for (const [method, path, body] of routes) {
        await request(method, path, body, 401, null);
        await request(method, path, body, 401, 'invalid.jwt.token');
      }
      for (const id of [project.id, randomUUID()]) {
        for (const [method, path, body] of mutateRoutes(id)) {
          assert.equal((await request(method, path, body, 404, other.token)).code, 'PROJECT_NOT_FOUND');
        }
      }
      const foreign = await create({ name: 'Isolated account project' }, other.token);
      assert.equal(foreign.userId, other.user.id);
      const list = await request('GET', '', undefined, 200, other.token);
      assert.ok(list.data.every(row => row.userId === other.user.id));
      assert.equal(list.meta.total, await db.project.count({ where: { userId: other.user.id, deletedAt: null } }));
      assert.equal((await request('GET', `/${foreign.id}/activities`, undefined, 200, other.token)).data[0].createdById, other.user.id);
    });

    await t.test('progress updates validate merged state, including status-only and zero-progress changes', async () => {
      const record = (await request('POST', '', { name: 'Progress rules' }, 201)).data;
      const change = (body, status = 200) => request('PATCH', `/${record.id}/progress`, body, status);
      assert.equal((await change({ progress: 1 }, 400)).code, 'VALIDATION_ERROR');
      assert.equal((await change({ status: 'IN_PROGRESS' })).data.progress, 0);
      assert.equal((await change({ progress: 65 })).data.status, 'IN_PROGRESS');
      assert.equal((await change({ status: 'ON_HOLD' })).data.progress, 65);
      for (const body of [
        {}, { content: 'Message only' }, { progress: null }, { progress: 1.5 }, { progress: 101 },
        { progress: '100' }, { status: 'UNKNOWN' }, { status: 'COMPLETED' }, { progress: 100 },
        { progress: 70, content: '' }, { progress: 70, content: 'x'.repeat(5001) },
        { progress: 70, content: null }, { progress: 70, userId: other.user.id },
      ]) assert.equal((await change(body, 400)).code, 'VALIDATION_ERROR');
      assert.equal((await change({ progress: 0 })).data.progress, 0);
      assert.equal((await change({ status: 'PLANNED' })).data.progress, 0);
      assert.equal((await request('GET', `/${record.id}`)).data.status, 'PLANNED');
      assert.equal((await history(record.id)).meta.total, 6);
    });

    await t.test('completion, archive, and reopening preserve the progress chain and support no-op retries', async () => {
      const record = await create();
      for (const body of [
        { status: 'ON_HOLD' }, { status: 'IN_PROGRESS', progress: 80 },
        { status: 'COMPLETED', progress: 100, content: '  Finished!  ' },
        { status: 'ARCHIVED' }, { status: 'IN_PROGRESS', progress: 50 },
      ]) {
        const result = (await request('PATCH', `/${record.id}/progress`, body)).data;
        assert.equal(result.status, body.status);
        if (body.status === 'ARCHIVED') {
          assert.equal(result.progress, 100);
          assert.ok((await request('GET', '?status=ARCHIVED')).data.some(row => row.id === record.id));
          await request('PUT', `/${record.id}`, { name: 'Archived but editable' });
        }
      }
      const events = await history(record.id);
      assert.equal(events.meta.total, 6);
      assert.equal(events.data[3].content, 'Finished!');
      for (let i = 1; i < events.data.length; i++) {
        assert.equal(events.data[i].fromStatus, events.data[i - 1].toStatus);
        assert.equal(events.data[i].fromProgress, events.data[i - 1].toProgress);
        assert.equal(events.data[i].createdById, owner.user.id);
        assert.ok(events.data[i].createdAt > events.data[i - 1].createdAt);
      }
      const before = (await request('GET', `/${record.id}`)).data;
      assert.deepEqual((await request('PATCH', `/${record.id}/progress`, { progress: 50, content: 'Ignored no-op' })).data, before);
      assert.equal((await history(record.id)).meta.total, 6);
    });

    await t.test('comments preserve project state and paginate alongside immutable system events', async () => {
      const record = await create();
      const first = (await request('POST', `/${record.id}/activities`, { content: '  Feedback\nKeep going.  ' }, 201)).data;
      assert.equal(first.type, 'COMMENT');
      assert.equal(first.content, 'Feedback\nKeep going.');
      for (const key of ['fromStatus', 'toStatus', 'fromProgress', 'toProgress']) assert.equal(first[key], null);
      const duplicate = (await request('POST', `/${record.id}/activities`, { content: first.content }, 201)).data;
      assert.notEqual(duplicate.id, first.id);
      assert.deepEqual((await request('GET', `/${record.id}`)).data, record);
      for (const body of [{}, { content: '' }, { content: ' \n\t ' }, { content: null }, { content: 'x'.repeat(5001) }, { content: 'Text', type: 'CREATED' }, { content: 'Text', createdById: other.user.id }]) {
        assert.equal((await request('POST', `/${record.id}/activities`, body, 400)).code, 'VALIDATION_ERROR');
      }
      const page = await request('GET', `/${record.id}/activities?page=2&limit=1`);
      assert.deepEqual(page.data, [first]);
      assert.equal(page.meta.total, 3);
      assert.equal(page.meta.totalPages, 3);
      assert.equal(page.meta.hasPreviousPage, true);
      assert.equal(page.meta.hasNextPage, true);
      const ordered = (await history(record.id)).data;
      assert.ok(ordered[0].createdAt < ordered[1].createdAt && ordered[1].createdAt < ordered[2].createdAt);
      await request('PUT', `/${record.id}/activities/${first.id}`, { content: 'Cannot edit' }, 404);
      await request('DELETE', `/${record.id}/activities/${first.id}`, undefined, 404);
      assert.equal((await history(record.id)).meta.total, 3);
    });

    await t.test('concurrent progress changes and comments serialize; duplicate state retries create one event', async () => {
      const record = await create();
      await Promise.all([
        request('PATCH', `/${record.id}/progress`, { progress: 50 }),
        request('PATCH', `/${record.id}/progress`, { progress: 60 }),
        request('POST', `/${record.id}/activities`, { content: 'Concurrent comment' }, 201),
        request('PUT', `/${record.id}`, { name: 'Concurrent detail edit' }),
      ]);
      let events = (await history(record.id)).data;
      assert.equal(events.length, 4);
      const states = events.filter(event => event.type !== 'COMMENT');
      assert.equal(states[1].fromProgress, 40);
      assert.equal(states[2].fromProgress, states[1].toProgress);
      const final = (await request('GET', `/${record.id}`)).data;
      assert.equal(final.progress, states[2].toProgress);
      assert.equal(final.name, 'Concurrent detail edit');
      await Promise.all(Array.from({ length: 3 }, () => request('PATCH', `/${record.id}/progress`, { status: 'COMPLETED', progress: 100 })));
      events = (await history(record.id)).data;
      assert.equal(events.length, 5);
      assert.equal(events[4].toStatus, 'COMPLETED');
      assert.equal(events[4].fromProgress, final.progress);
      for (let i = 1; i < events.length; i++) assert.ok(events[i].createdAt > events[i - 1].createdAt);
    });

    await t.test('activity write failure rolls back creation, progress changes, and comments', async () => {
      const record = await create();
      const realTransaction = db.$transaction.bind(db);
      db.$transaction = (work, options) => typeof work !== 'function' ? realTransaction(work, options) : realTransaction(tx => work(new Proxy(tx, {
        get(target, property) {
          if (property === 'projectActivity') return new Proxy(target.projectActivity, {
            get(delegate, method) {
              if (method === 'create') return async () => { throw new Error('Injected activity failure'); };
              return Reflect.get(delegate, method);
            },
          });
          return Reflect.get(target, property);
        },
      })), options);
      const marker = `rollback-${randomUUID()}`;
      try {
        await request('POST', '', { name: marker }, 500);
        await request('PATCH', `/${record.id}/progress`, { status: 'COMPLETED', progress: 100 }, 500);
        await request('POST', `/${record.id}/activities`, { content: 'Rollback comment' }, 500);
      } finally { db.$transaction = realTransaction; }
      assert.deepEqual((await request('GET', `/${record.id}`)).data, record);
      assert.equal((await history(record.id)).meta.total, 1);
      assert.equal(await db.project.count({ where: { name: marker } }), 0);
    });

    await t.test('a queued edit/progress/comment cannot mutate a project after deletion wins the row lock', async () => {
      // Synchronize through the actual PostgreSQL lock, not a timing-only sleep.
      for (const [method, suffix, body] of [
        ['PUT', '', { name: 'Too late' }],
        ['PATCH', '/progress', { progress: 90 }],
        ['POST', '/activities', { content: 'Too late' }],
      ]) {
        const record = await create();
        let locked;
        const ready = new Promise(resolve => { locked = resolve; });
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        const deletion = db.$transaction(async tx => {
          await tx.$queryRaw`SELECT "id" FROM "Project" WHERE "id" = ${record.id} FOR UPDATE`;
          locked();
          await gate;
          await tx.project.update({ where: { id: record.id }, data: { deletedAt: new Date() } });
        }, { timeout: 15000 });
        await ready;
        const pending = request(method, `/${record.id}${suffix}`, body, 404);
        release();
        await deletion;
        assert.equal((await pending).code, 'PROJECT_NOT_FOUND');
        const stored = await db.project.findUniqueOrThrow({ where: { id: record.id } });
        assert.equal(stored.name, record.name);
        assert.equal(stored.progress, record.progress);
        assert.equal(await db.projectActivity.count({ where: { projectId: record.id } }), 1);
      }
    });

    await t.test('soft-delete preserves storage/history and excludes every record route and list total', async () => {
      const marker = `delete-${randomUUID()}`;
      const record = await create({ name: marker });
      await request('PATCH', `/${record.id}/progress`, { status: 'ARCHIVED' });
      await request('POST', `/${record.id}/activities`, { content: 'Last comment' }, 201);
      assert.deepEqual((await request('DELETE', `/${record.id}`)).data, { id: record.id, deleted: true });
      assert.ok((await db.project.findUniqueOrThrow({ where: { id: record.id } })).deletedAt);
      assert.equal(await db.projectActivity.count({ where: { projectId: record.id } }), 3);
      for (const [method, path, body] of mutateRoutes(record.id)) {
        assert.equal((await request(method, path, body, 404)).code, 'PROJECT_NOT_FOUND');
      }
      const result = await request('GET', `?search=${marker}`);
      assert.deepEqual(result.data, []);
      assert.equal(result.meta.total, 0);
    });
  } finally {
    try {
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    } finally {
      delete global.__prisma;
      await fixture.cleanup();
    }
  }
});
