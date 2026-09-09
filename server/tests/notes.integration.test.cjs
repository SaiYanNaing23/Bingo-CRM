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
const entities = {
  COMPANY: { model: 'company', table: 'Company', column: 'companyId', route: 'companies' },
  CONTACT: { model: 'contact', table: 'Contact', column: 'contactId', route: 'contacts' },
  APPLICATION: { model: 'application', table: 'Application', column: 'applicationId', route: 'applications' },
  TASK: { model: 'task', table: 'Task', column: 'taskId', route: 'tasks' },
  PROJECT: { model: 'project', table: 'Project', column: 'projectId', route: 'projects' },
};

test('Phase 6 Notes API, Markdown, and entity lifecycle', { timeout: 240000 }, async t => {
  const fixture = await createTestDatabase(env.DATABASE_URL);
  const { db } = fixture;
  global.__prisma = db;
  const { app } = require('../dist/src/app');
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}/api/v1`;
    const account = async () => {
      const user = await db.user.create({ data: { fullName: 'Notes test user', email: `notes-${randomUUID()}@example.com`, passwordHash: 'fixture-no-login' } });
      return { user, token: jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: 600 }) };
    };
    const owner = await account();
    const other = await account();
    const api = async (method, path, body, expected = 200, token = owner.token) => {
      const response = await fetch(`${base}${path}`, {
        method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result).slice(0, 1000)}`);
      assert.equal(result.success, expected < 400);
      return result;
    };
    const request = (method, path, body, expected, token) => api(method, `/notes${path}`, body, expected, token);
    const payload = {
      title: 'BINGO CRM decisions',
      content: '  # Decisions\r\n\r\n- Keep notes reusable\n\n```ts\n  const ready = true;\n```\n\n[Reference](https://example.com)\nUnicode: မြန်မာ 😀\n<script>throw new Error("plain text")</script>\n  ',
      tags: ['bingo-crm', 'architecture'],
    };
    const create = async (input = {}, token = owner.token) => (await request('POST', '', { ...payload, ...input }, 201, token)).data;
    const targets = async (userId = owner.user.id) => {
      const company = await db.company.create({ data: { userId, name: 'Notes target company', techStack: [], notes: 'Original company note' } });
      const [contact, application, task, project] = await Promise.all([
        db.contact.create({ data: { userId, companyId: company.id, name: 'Contact target', photo: 'https://example.com/photo.png', email: 'contact@example.com', phone: '+1 234', linkedIn: 'https://example.com/profile', role: 'Recruiter', notes: 'Original contact note', lastContactAt: new Date(), nextFollowUpAt: new Date() } }),
        db.application.create({ data: { userId, companyId: company.id, position: 'Developer', notes: 'Original application note' } }),
        db.task.create({ data: { userId, title: 'Notes target task' } }),
        db.project.create({ data: { userId, name: 'Notes target project', lessonsLearned: 'Original project lesson' } }),
      ]);
      return { COMPANY: company, CONTACT: contact, APPLICATION: application, TASK: task, PROJECT: project };
    };
    const owned = await targets();
    const foreign = await targets(other.user.id);
    let note;

    await t.test('fresh migrations enforce one target, real foreign keys, defaults, and tag index', async () => {
      assert.ok(fixture.migrations.includes('20260908030000_notes'));
      const constraints = await db.$queryRaw`SELECT conname, contype::text AS type FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = ${fixture.schema} AND c.conname LIKE 'Note_%'`;
      assert.equal(constraints.filter(row => row.type === 'f').length, 6);
      assert.ok(constraints.some(row => row.conname === 'Note_one_entity_check'));
      const indexes = await db.$queryRaw`SELECT indexdef FROM pg_indexes WHERE schemaname = ${fixture.schema} AND indexname = 'Note_tags_idx'`;
      assert.match(indexes[0].indexdef, /USING gin/i);
      const data = { userId: owner.user.id, title: 'Constraint check', content: 'Body' };
      await assert.rejects(db.note.create({ data: { ...data, companyId: owned.COMPANY.id, projectId: owned.PROJECT.id } }));
      for (const { column } of Object.values(entities)) await assert.rejects(db.note.create({ data: { ...data, [column]: randomUUID() } }));
      await assert.rejects(db.note.create({ data: { ...data, userId: randomUUID() } }));
      const standalone = await db.note.create({ data });
      assert.deepEqual(standalone.tags, []);
      for (const { column } of Object.values(entities)) assert.equal(standalone[column], null);
    });

    await t.test('create/read preserve exact Markdown, Unicode, line endings, and standalone defaults', async () => {
      note = await create({ title: '  BINGO CRM decisions  ', tags: [' Architecture ', 'BINGO-CRM', 'architecture'] });
      assert.equal(note.title, payload.title);
      assert.equal(note.content, payload.content);
      assert.equal(note.userId, owner.user.id);
      assert.deepEqual(note.tags, ['architecture', 'bingo-crm']);
      assert.equal(note.entity, null);
      assert.equal(note.entityAvailable, null);
      assert.equal(note.deletedAt, null);
      assert.deepEqual((await request('GET', `/${note.id}`)).data, note);
      const minimal = (await request('POST', '', { title: 'Minimal note', content: '  Keep whitespace.\n' }, 201)).data;
      assert.deepEqual(minimal.tags, []);
      assert.equal(minimal.entity, null);
      assert.equal(minimal.content, '  Keep whitespace.\n');
      for (const { column } of Object.values(entities)) assert.equal(note[column], undefined);
      assert.equal(note.user, undefined);
    });
    assert.ok(note, 'Creation must succeed before dependent checks');

    await t.test('validation rejects malformed bodies, text, tags, bindings, and reserved fields', async () => {
      for (const fields of [
        { title: '' }, { title: 'x' }, { title: null }, { title: 'x'.repeat(201) },
        { content: '' }, { content: ' \n\t ' }, { content: null }, { content: 123 }, { content: 'x'.repeat(100001) },
        { content: 'NUL\u0000text' }, { content: '\ud800' }, { title: 'NUL\0title' },
        { tags: null }, { tags: 'backend' }, { tags: [' '] }, { tags: [1] }, { tags: ['x'.repeat(41)] },
        { tags: Array(21).fill('same') }, { tags: ['nul\0tag'] },
        { entity: {} }, { entity: [] }, { entity: { type: 'PROJECT' } }, { entity: { id: owned.PROJECT.id } },
        { entity: { type: 'NOTE', id: note.id } }, { entity: { type: 'DOCUMENT', id: randomUUID() } },
        { entity: { type: 'project', id: owned.PROJECT.id } }, { entity: { type: 'PROJECT', id: 'bad-id' } },
        { entity: { type: 'PROJECT', id: owned.PROJECT.id, available: true } },
        { userId: other.user.id }, { id: randomUUID() }, { entityAvailable: true }, { deletedAt: null },
        { createdAt: new Date().toISOString() }, { projectId: owned.PROJECT.id }, { companyId: owned.COMPANY.id },
      ]) assert.equal((await request('POST', '', { ...payload, ...fields }, 400)).code, 'VALIDATION_ERROR');
      for (const body of [{}, [], null, { title: 'No content' }]) await request('POST', '', body, 400);
      for (const body of [{}, { content: null }, { tags: null }, { entity: {} }, { projectId: owned.PROJECT.id }, { updatedAt: new Date().toISOString() }]) {
        assert.equal((await request('PUT', `/${note.id}`, body, 400)).code, 'VALIDATION_ERROR');
      }
      await request('GET', '/not-a-uuid', undefined, 400);
      const malformed = await fetch(`${base}/notes`, { method: 'POST', headers: { authorization: `Bearer ${owner.token}`, 'content-type': 'application/json' }, body: '{"title":' });
      assert.equal(malformed.status, 400);
      assert.equal((await malformed.json()).code, 'VALIDATION_ERROR');
      const oversized = await request('POST', '', { ...payload, content: 'x'.repeat(1024 * 1024) }, 413);
      assert.equal(oversized.code, 'PAYLOAD_TOO_LARGE');
      const boundary = await create({ title: 't'.repeat(200), content: 'x'.repeat(100000), tags: Array.from({ length: 20 }, (_, i) => `${i}`.padEnd(40, 't')) });
      assert.equal(boundary.content.length, 100000);
      assert.equal(boundary.tags.length, 20);
    });

    await t.test('all five entity types can be linked without changing existing inline notes or targets', async () => {
      for (const [type, target] of Object.entries(owned)) {
        const linked = await create({ entity: { type, id: target.id } });
        assert.deepEqual(linked.entity, { type, id: target.id });
        assert.equal(linked.entityAvailable, true);
        assert.deepEqual((await request('GET', `/${linked.id}`)).data, linked);
        const stored = await db.note.findUniqueOrThrow({ where: { id: linked.id } });
        for (const [otherType, { column }] of Object.entries(entities)) assert.equal(stored[column], otherType === type ? target.id : null);
        assert.deepEqual(await db[entities[type].model].findUniqueOrThrow({ where: { id: target.id } }), target);
      }
    });

    await t.test('partial updates preserve fields, replace/clear tags, and rebind/detach atomically', async () => {
      const linked = await create({ entity: { type: 'PROJECT', id: owned.PROJECT.id } });
      const changed = (await request('PUT', `/${linked.id}`, { title: 'Updated note', tags: [' Backend ', 'backend', 'API'] })).data;
      assert.equal(changed.content, payload.content);
      assert.deepEqual(changed.entity, linked.entity);
      assert.deepEqual(changed.tags, ['backend', 'api']);
      for (const [type, target] of Object.entries(owned)) {
        const updated = (await request('PUT', `/${linked.id}`, { entity: { type, id: target.id } })).data;
        assert.deepEqual(updated.entity, { type, id: target.id });
        const stored = await db.note.findUniqueOrThrow({ where: { id: linked.id } });
        assert.equal(Object.values(entities).filter(({ column }) => stored[column] !== null).length, 1);
      }
      const detached = (await request('PUT', `/${linked.id}`, { tags: [], entity: null, content: '  New body\r\n' })).data;
      assert.equal(detached.entity, null);
      assert.equal(detached.entityAvailable, null);
      assert.deepEqual(detached.tags, []);
      assert.equal(detached.content, '  New body\r\n');
      assert.equal(detached.title, 'Updated note');
    });

    await t.test('assignment hides nonexistent, foreign, and soft-deleted targets and failed rebinds change nothing', async () => {
      const deletedTargets = await targets();
      for (const [type, target] of Object.entries(deletedTargets)) await api('DELETE', `/${entities[type].route}/${target.id}`);
      const before = await create({ entity: { type: 'PROJECT', id: owned.PROJECT.id } });
      for (const type of Object.keys(entities)) {
        for (const id of [randomUUID(), foreign[type].id, deletedTargets[type].id]) {
          const entity = { type, id };
          assert.equal((await request('POST', '', { ...payload, entity }, 404)).code, 'NOTE_ENTITY_NOT_FOUND');
          assert.equal((await request('PUT', `/${before.id}`, { title: 'Must roll back', tags: [], entity }, 404)).code, 'NOTE_ENTITY_NOT_FOUND');
        }
      }
      assert.deepEqual((await request('GET', `/${before.id}`)).data, before);
    });

    await t.test('all routes require authentication and hide another owner or deleted/missing notes', async () => {
      const methods = id => [['GET', `/${id}`], ['PUT', `/${id}`, { title: 'No access' }], ['DELETE', `/${id}`]];
      for (const [method, path, body] of [['POST', '', payload], ['GET', ''], ...methods(note.id)]) {
        await request(method, path, body, 401, null);
        await request(method, path, body, 401, 'invalid.jwt.token');
      }
      for (const id of [note.id, randomUUID()]) for (const [method, path, body] of methods(id)) {
        assert.equal((await request(method, path, body, 404, other.token)).code, 'NOTE_NOT_FOUND');
      }
      const otherNote = await create({ entity: { type: 'COMPANY', id: foreign.COMPANY.id } }, other.token);
      const list = await request('GET', '', undefined, 200, other.token);
      assert.equal(list.meta.total, 1);
      assert.deepEqual(list.data, [otherNote]);
    });

    await t.test('search/tag/entity filters combine with stable pagination and accurate owned totals', async () => {
      const marker = `filter-${randomUUID()}`;
      const entity = { type: 'PROJECT', id: owned.PROJECT.id };
      const a = await create({ title: 'Same title', content: marker, tags: ['architecture'], entity });
      const b = await create({ title: 'Same title', content: marker, tags: ['architecture'], entity });
      await create({ title: 'Wrong tag', content: marker, tags: ['architecture-notes'], entity });
      await create({ title: 'Wrong entity', content: marker, tags: ['architecture'] });
      await create({ content: marker, tags: ['architecture'], entity: { type: 'PROJECT', id: foreign.PROJECT.id } }, other.token);
      const deleted = await create({ content: marker, tags: ['architecture'], entity });
      await request('DELETE', `/${deleted.id}`);
      const query = `?tag=%20ARCHITECTURE%20&entityType=PROJECT&entityId=${entity.id}&search=${marker.toUpperCase()}&sortBy=title&order=asc&limit=1`;
      const first = await request('GET', `${query}&page=1`);
      const second = await request('GET', `${query}&page=2`);
      assert.equal(first.meta.total, 2);
      assert.equal(first.meta.totalPages, 2);
      assert.equal(first.meta.hasNextPage, true);
      assert.equal(second.meta.hasPreviousPage, true);
      assert.deepEqual([first.data[0].id, second.data[0].id], [a.id, b.id].sort());
      assert.deepEqual((await request('GET', `${query}&page=3`)).data, []);
      for (const suffix of [`?tag=arch&search=${marker}`, `?entityType=PROJECT&entityId=${randomUUID()}`, `?entityType=PROJECT&entityId=${foreign.PROJECT.id}`]) {
        const result = await request('GET', suffix);
        assert.deepEqual(result.data, []);
        assert.equal(result.meta.total, 0);
        assert.equal(result.meta.totalPages, 1);
      }
      assert.ok((await request('GET', '?search=CONST%20READY')).data.some(row => row.id === note.id));
      assert.ok((await request('GET', '?search=DECISIONS')).data.some(row => row.id === note.id));
      assert.equal((await request('GET', '?limit=999999')).meta.limit, env.PAGINATION_MAX_LIMIT);
      const timestamp = new Date('2026-09-08T00:00:00.000Z');
      await db.note.updateMany({ where: { id: { in: [a.id, b.id] } }, data: { createdAt: timestamp, updatedAt: timestamp } });
      for (const sort of ['', '&sortBy=createdAt&order=asc']) {
        const sorted = await request('GET', `?tag=architecture&search=${marker}&entityType=PROJECT&entityId=${entity.id}${sort}`);
        assert.deepEqual(sorted.data.map(row => row.id), [a.id, b.id].sort());
      }
    });

    await t.test('query validation rejects incomplete entity pairs, unknown fields, and repeated values', async () => {
      for (const query of [
        'page=0', 'limit=0', 'page=1.5', 'page=1000001', 'page=1&page=2', 'tag=', 'tag=a&tag=b',
        'sortBy=content', 'order=wrong', 'unknown=1', 'entityType=PROJECT', `entityId=${owned.PROJECT.id}`,
        `entityType=DOCUMENT&entityId=${owned.PROJECT.id}`, 'entityType=PROJECT&entityId=bad-id',
        `search=${'s'.repeat(201)}`, 'search=%00',
      ]) assert.equal((await request('GET', `?${query}`, undefined, 400)).code, 'VALIDATION_ERROR');
    });

    await t.test('archived, completed, and cancelled owned records remain valid note targets', async () => {
      const records = await targets();
      await db.company.update({ where: { id: records.COMPANY.id }, data: { status: 'ARCHIVED' } });
      await db.application.update({ where: { id: records.APPLICATION.id }, data: { stage: 'ARCHIVED' } });
      await db.task.update({ where: { id: records.TASK.id }, data: { status: 'COMPLETED', completedAt: new Date() } });
      await db.project.update({ where: { id: records.PROJECT.id }, data: { status: 'ARCHIVED' } });
      for (const [type, record] of Object.entries(records)) {
        assert.equal((await create({ entity: { type, id: record.id } })).entityAvailable, true);
      }
      const cancelled = await db.task.create({ data: { userId: owner.user.id, title: 'Cancelled task', status: 'CANCELLED' } });
      assert.equal((await create({ entity: { type: 'TASK', id: cancelled.id } })).entityAvailable, true);
    });

    await t.test('notes survive soft deletion of every entity type and can still be edited, found, detached, or rebound', async () => {
      const records = await targets();
      for (const [type, target] of Object.entries(records)) {
        const entity = { type, id: target.id };
        const linked = await create({ entity });
        await api('DELETE', `/${entities[type].route}/${target.id}`);
        const read = (await request('GET', `/${linked.id}`)).data;
        assert.equal(read.content, payload.content);
        assert.deepEqual(read.entity, entity);
        assert.equal(read.entityAvailable, false);
        const result = await request('GET', `?entityType=${type}&entityId=${target.id}`);
        assert.ok(result.data.some(row => row.id === linked.id && row.entityAvailable === false));
        const edited = (await request('PUT', `/${linked.id}`, { content: '  Preserve my writing.\n', tags: ['edited'] })).data;
        assert.equal(edited.entityAvailable, false);
        assert.equal((await request('PUT', `/${linked.id}`, { entity }, 404)).code, 'NOTE_ENTITY_NOT_FOUND');
        assert.deepEqual((await request('GET', `/${linked.id}`)).data, edited);
        const detached = (await request('PUT', `/${linked.id}`, { entity: null })).data;
        assert.equal(detached.entity, null);
        assert.equal(detached.entityAvailable, null);
        assert.equal(detached.content, edited.content);
        const rebound = (await request('PUT', `/${linked.id}`, { entity: { type: 'PROJECT', id: owned.PROJECT.id } })).data;
        assert.equal(rebound.entityAvailable, true);
      }
    });

    await t.test('physical target deletion clears only the link and retains each note', async () => {
      const records = await targets();
      // Delete dependent records before their company to exercise each individual FK.
      for (const type of ['CONTACT', 'APPLICATION', 'TASK', 'PROJECT', 'COMPANY']) {
        const target = records[type];
        const linked = await create({ entity: { type, id: target.id } });
        await db[entities[type].model].delete({ where: { id: target.id } });
        const read = (await request('GET', `/${linked.id}`)).data;
        assert.equal(read.entity, null);
        assert.equal(read.entityAvailable, null);
        assert.equal(read.content, linked.content);
        assert.equal(read.deletedAt, null);
      }
    });

    await t.test('list batches availability per entity type and does not expose foreign target details', async () => {
      const marker = `batch-${randomUUID()}`;
      await db.note.createMany({ data: Object.entries(owned).flatMap(([type, target]) => Array.from({ length: 4 }, (_, index) => ({
        userId: owner.user.id, title: `${type} ${index}`, content: marker, [entities[type].column]: target.id,
      }))) });
      // Simulate an inconsistent link from maintenance: availability must still check ownership.
      const inconsistent = await db.note.create({ data: { userId: owner.user.id, title: 'Foreign link', content: marker, companyId: foreign.COMPANY.id } });
      const calls = Object.fromEntries(Object.values(entities).map(({ model }) => [model, 0]));
      const realTransaction = db.$transaction.bind(db);
      db.$transaction = (work, options) => typeof work !== 'function' ? realTransaction(work, options) : realTransaction(tx => work(new Proxy(tx, {
        get(target, property) {
          if (Object.hasOwn(calls, property)) return new Proxy(target[property], {
            get(delegate, method) {
              if (method === 'findMany') return (...args) => { calls[property]++; return delegate.findMany(...args); };
              return Reflect.get(delegate, method);
            },
          });
          return Reflect.get(target, property);
        },
      })), options);
      let result;
      try { result = await request('GET', `?search=${marker}&limit=100`); }
      finally { db.$transaction = realTransaction; }
      assert.equal(result.meta.total, 21);
      assert.deepEqual(Object.values(calls), [1, 1, 1, 1, 1]);
      for (const row of result.data) {
        assert.equal(row.entityAvailable, row.id !== inconsistent.id);
        assert.equal(row.companyId, undefined);
        assert.equal(row.company, undefined);
        assert.deepEqual(Object.keys(row.entity).sort(), ['id', 'type']);
      }
    });

    await t.test('failed persistence rolls back note creation and multi-field rebinds', async () => {
      const original = await create({ entity: { type: 'PROJECT', id: owned.PROJECT.id } });
      const marker = `rollback-${randomUUID()}`;
      const realTransaction = db.$transaction.bind(db);
      db.$transaction = (work, options) => typeof work !== 'function' ? realTransaction(work, options) : realTransaction(tx => work(new Proxy(tx, {
        get(target, property) {
          if (property === 'note') return new Proxy(target.note, {
            get(delegate, method) {
              if (method === 'create' || method === 'update') return async (...args) => {
                await delegate[method](...args);
                throw new Error('Injected failure after note write');
              };
              return Reflect.get(delegate, method);
            },
          });
          return Reflect.get(target, property);
        },
      })), options);
      try {
        await request('POST', '', { ...payload, title: marker, entity: { type: 'COMPANY', id: owned.COMPANY.id } }, 500);
        await request('PUT', `/${original.id}`, { title: marker, content: 'Changed', tags: [], entity: { type: 'COMPANY', id: owned.COMPANY.id } }, 500);
      } finally { db.$transaction = realTransaction; }
      assert.equal(await db.note.count({ where: { title: marker } }), 0);
      assert.deepEqual((await request('GET', `/${original.id}`)).data, original);
    });

    // Observe actual PostgreSQL blocking, rather than assuming a network request has reached its lock.
    // https://www.postgresql.org/docs/current/functions-info.html#FUNCTIONS-INFO-SESSION
    const waitForBlocked = async pid => {
      const deadline = Date.now() + 6000;
      do {
        const rows = await db.$queryRaw`SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE ${pid}::integer = ANY(pg_blocking_pids(pid))) AS blocked`;
        if (rows[0].blocked) return;
        await new Promise(resolve => setTimeout(resolve, 100));
      } while (Date.now() < deadline);
      assert.fail('Expected the competing transaction to wait on the held row lock');
    };
    const deletedWhileWaiting = async (table, model, id, attempt) => {
      assert.ok(['Note', ...Object.values(entities).map(value => value.table)].includes(table));
      let signalReady, release;
      const ready = new Promise(resolve => { signalReady = resolve; });
      const gate = new Promise(resolve => { release = resolve; });
      const holder = db.$transaction(async tx => {
        await tx.$queryRawUnsafe(`SELECT "id" FROM "${table}" WHERE "id" = $1 FOR UPDATE`, id);
        const [{ pid }] = await tx.$queryRaw`SELECT pg_backend_pid() AS pid`;
        signalReady(pid);
        await gate;
        await tx[model].update({ where: { id }, data: { deletedAt: new Date() } });
      }, { timeout: 15000 });
      const pid = await Promise.race([ready, holder.then(() => { throw new Error('Row lock was not acquired'); })]);
      const pending = attempt().then(value => ({ value }), error => ({ error }));
      try { await waitForBlocked(pid); }
      finally { release(); await holder; }
      const result = await pending;
      if (result.error) throw result.error;
      return result.value;
    };

    await t.test('link creation waits for target deletion and rejects deleted targets for all five types', async () => {
      const records = await targets();
      for (const [type, target] of Object.entries(records)) {
        const { table, model } = entities[type];
        const marker = `racing-create-${randomUUID()}`;
        const result = await deletedWhileWaiting(table, model, target.id, () => request('POST', '', { ...payload, title: marker, entity: { type, id: target.id } }, 404));
        assert.equal(result.code, 'NOTE_ENTITY_NOT_FOUND');
        assert.equal(await db.note.count({ where: { title: marker } }), 0);
      }
    });

    await t.test('rebind versus target deletion and edit versus note deletion leave records unchanged', async () => {
      const original = await create({ entity: { type: 'COMPANY', id: owned.COMPANY.id } });
      const target = await db.project.create({ data: { userId: owner.user.id, name: 'Race target' } });
      const result = await deletedWhileWaiting('Project', 'project', target.id, () => request('PUT', `/${original.id}`, { title: 'Do not persist', tags: [], entity: { type: 'PROJECT', id: target.id } }, 404));
      assert.equal(result.code, 'NOTE_ENTITY_NOT_FOUND');
      assert.deepEqual((await request('GET', `/${original.id}`)).data, original);
      const edit = await deletedWhileWaiting('Note', 'note', original.id, () => request('PUT', `/${original.id}`, { title: 'Too late', entity: null }, 404));
      assert.equal(edit.code, 'NOTE_NOT_FOUND');
      const stored = await db.note.findUniqueOrThrow({ where: { id: original.id } });
      assert.equal(stored.title, original.title);
      assert.equal(stored.companyId, owned.COMPANY.id);
      assert.ok(stored.deletedAt);
    });

    await t.test('a successful link holds off deletion until commit, after which the note stays readable', async () => {
      const target = await db.project.create({ data: { userId: owner.user.id, name: 'Link wins race' } });
      let signalReady, release;
      const ready = new Promise(resolve => { signalReady = resolve; });
      const gate = new Promise(resolve => { release = resolve; });
      const realTransaction = db.$transaction.bind(db);
      db.$transaction = (work, options) => typeof work !== 'function' ? realTransaction(work, options) : realTransaction(tx => work(new Proxy(tx, {
        get(transaction, property) {
          if (property === 'note') return new Proxy(transaction.note, {
            get(delegate, method) {
              if (method === 'create') return async (...args) => {
                const [{ pid }] = await transaction.$queryRaw`SELECT pg_backend_pid() AS pid`;
                signalReady(pid); // Entity validation has already acquired FOR SHARE.
                await gate;
                return delegate.create(...args);
              };
              return Reflect.get(delegate, method);
            },
          });
          return Reflect.get(transaction, property);
        },
      })), options);
      let pendingCreate, pendingDelete;
      try {
        pendingCreate = create({ entity: { type: 'PROJECT', id: target.id } });
        const pid = await Promise.race([ready, pendingCreate.then(() => { throw new Error('Expected held link transaction'); })]);
        pendingDelete = api('DELETE', `/projects/${target.id}`);
        await waitForBlocked(pid);
      } finally {
        release();
        await Promise.allSettled([pendingCreate, pendingDelete]);
        db.$transaction = realTransaction;
      }
      const created = await pendingCreate;
      assert.equal(created.entityAvailable, true);
      await pendingDelete;
      const read = (await request('GET', `/${created.id}`)).data;
      assert.equal(read.entityAvailable, false);
      assert.equal(read.content, payload.content);
    });

    await t.test('concurrent partial edits and rebinds preserve omitted fields and one valid link', async () => {
      const record = await create();
      await Promise.all([
        request('PUT', `/${record.id}`, { title: 'Concurrent title' }),
        request('PUT', `/${record.id}`, { tags: ['concurrent'] }),
        request('PUT', `/${record.id}`, { entity: { type: 'COMPANY', id: owned.COMPANY.id } }),
        request('PUT', `/${record.id}`, { entity: { type: 'PROJECT', id: owned.PROJECT.id } }),
      ]);
      const final = (await request('GET', `/${record.id}`)).data;
      assert.equal(final.title, 'Concurrent title');
      assert.deepEqual(final.tags, ['concurrent']);
      assert.equal(final.content, payload.content);
      assert.equal(final.entityAvailable, true);
      assert.ok(['COMPANY', 'PROJECT'].includes(final.entity.type));
      const stored = await db.note.findUniqueOrThrow({ where: { id: record.id } });
      assert.equal(Object.values(entities).filter(({ column }) => stored[column] !== null).length, 1);
    });

    await t.test('soft deletion hides notes from all access and totals without changing their target', async () => {
      const marker = `delete-${randomUUID()}`;
      const originalTarget = await db.project.findUniqueOrThrow({ where: { id: owned.PROJECT.id } });
      const record = await create({ title: marker, entity: { type: 'PROJECT', id: owned.PROJECT.id } });
      assert.deepEqual((await request('DELETE', `/${record.id}`)).data, { id: record.id, deleted: true });
      for (const [method, body] of [['GET'], ['PUT', { content: 'Too late' }], ['DELETE']]) {
        assert.equal((await request(method, `/${record.id}`, body, 404)).code, 'NOTE_NOT_FOUND');
      }
      const list = await request('GET', `?search=${marker}`);
      assert.deepEqual(list.data, []);
      assert.equal(list.meta.total, 0);
      const stored = await db.note.findUniqueOrThrow({ where: { id: record.id } });
      assert.ok(stored.deletedAt);
      assert.equal(stored.content, payload.content);
      assert.equal(stored.projectId, originalTarget.id);
      assert.deepEqual(await db.project.findUniqueOrThrow({ where: { id: originalTarget.id } }), originalTarget);
    });
  } finally {
    try { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
    finally { delete global.__prisma; await fixture.cleanup(); }
  }
});
