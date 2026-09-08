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
const { createApplicationTestDatabase: createTestDatabase } = require('./helpers/application-database.cjs');

test('Phase 4 Tasks API, recurrence, and local-day summaries', { timeout: 240000 }, async (t) => {
  const fixture = await createTestDatabase(env.DATABASE_URL);
  const { db } = fixture;
  global.__prisma = db;
  const { app } = require('../dist/src/app');
  const server = app.listen(0, '127.0.0.1');

  try {
    await once(server, 'listening');
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/tasks`;
    const newUser = async () => {
      const user = await db.user.create({ data: {
        fullName: 'Tasks test user', email: `tasks-${randomUUID()}@example.com`, passwordHash: 'test-fixture-no-login',
      } });
      return { user, token: jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: 600 }) };
    };
    const owner = await newUser();
    const other = await newUser();
    const request = async (method, path, body, status = 200, token = owner.token) => {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(result)}`);
      assert.equal(result.success, status < 400);
      return result;
    };
    const create = async (body, token = owner.token) => (await request('POST', '', body, 201, token)).data;
    const complete = async (id, token = owner.token) => (await request('PATCH', `/${id}/complete`, undefined, 200, token)).data;
    const payload = {
      title: 'Follow up with Sarah', type: 'FOLLOW_UP', priority: 'HIGH', dueDate: '2026-09-08T09:00:00.000Z',
      timezone: 'Asia/Yangon', status: 'TODO', repeatPattern: 'NONE',
    };
    let task;

    await t.test('fresh migration creates ownership, recurrence uniqueness, and lifecycle constraints', async () => {
      assert.ok(fixture.migrations.includes('20260908010000_tasks'));
      const constraints = await db.$queryRaw`SELECT conname, contype::text AS contype FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = ${fixture.schema} AND c.conname LIKE 'Task_%'`;
      assert.equal(constraints.filter(row => row.contype === 'f').length, 2);
      assert.ok(constraints.some(row => row.conname === 'Task_completion_check'));
      assert.ok(constraints.some(row => row.conname === 'Task_repeat_due_date_check'));
    });

    await t.test('POST/GET persist fields, ISO offsets, and useful defaults', async () => {
      task = await create(payload);
      for (const [key, value] of Object.entries(payload)) assert.equal(task[key], value);
      assert.equal(task.userId, owner.user.id);
      assert.equal(task.completedAt, null);
      assert.equal(task.recurrenceSourceId, null);
      assert.equal(task.deletedAt, null);
      assert.equal((await request('GET', `/${task.id}`)).data.title, payload.title);
      const minimal = await create({ title: 'Review job boards' });
      assert.equal(minimal.type, 'OTHER');
      assert.equal(minimal.priority, 'MEDIUM');
      assert.equal(minimal.status, 'TODO');
      assert.equal(minimal.repeatPattern, 'NONE');
      assert.equal(minimal.timezone, 'UTC');
      assert.equal(minimal.dueDate, null);
      const offset = await create({ ...payload, dueDate: '2026-09-08T15:30:00.000+06:30' });
      assert.equal(offset.dueDate, payload.dueDate);
    });
    assert.ok(task, 'Task creation is required for later checks');

    await t.test('PUT preserves omitted fields and validates merged recurrence state', async () => {
      const changed = (await request('PUT', `/${task.id}`, { title: 'Follow up tomorrow', status: 'IN_PROGRESS', dueDate: null })).data;
      assert.equal(changed.priority, 'HIGH');
      assert.equal(changed.type, 'FOLLOW_UP');
      assert.equal(changed.dueDate, null);
      assert.equal(changed.status, 'IN_PROGRESS');
      assert.equal((await request('PUT', `/${task.id}`, { repeatPattern: 'DAILY' }, 400)).code, 'TASK_DUE_DATE_REQUIRED');
      await request('PUT', `/${task.id}`, { repeatPattern: 'DAILY', dueDate: payload.dueDate });
      await request('PUT', `/${task.id}`, { dueDate: null }, 400);
      const noRepeat = (await request('PUT', `/${task.id}`, { repeatPattern: 'NONE', dueDate: null })).data;
      assert.equal(noRepeat.repeatPattern, 'NONE');
      assert.equal(noRepeat.dueDate, null);
    });

    await t.test('bad dates, enums, fields, timezones, pagination, and completion payloads are rejected', async () => {
      for (const override of [
        { title: '' }, { title: 'x' }, { type: 'UNKNOWN' }, { priority: 'TOP' }, { status: 'COMPLETED' },
        { repeatPattern: 'CRON' }, { repeatPattern: 'DAILY', dueDate: null },
        { dueDate: '2026-02-30T09:00:00.000Z' }, { dueDate: '2026-09-08' }, { dueDate: true }, { dueDate: 123 },
        { timezone: 'Wrong/Zone' }, { timezone: '+06:30' }, { userId: other.user.id },
        { completedAt: payload.dueDate }, { recurrenceSourceId: task.id }, { deletedAt: null },
      ]) assert.equal((await request('POST', '', { ...payload, ...override }, 400)).code, 'VALIDATION_ERROR');
      for (const body of [{}, { status: 'COMPLETED' }, { userId: other.user.id }, { recurrenceSourceId: task.id }]) {
        await request('PUT', `/${task.id}`, body, 400);
      }
      for (const body of [{ completedAt: payload.dueDate }, { status: 'COMPLETED' }, null]) {
        await request('PATCH', `/${task.id}/complete`, body, 400);
      }
      await request('GET', '/bad-id', undefined, 400);
      for (const query of ['page=0', 'limit=0', 'status=UNKNOWN', 'type=BAD', 'priority=TOP', 'repeatPattern=YEARLY',
        'sortBy=unknown', 'dueDateFrom=bad', 'dueDateFrom=2026-09-20T00:00:00.000Z&dueDateTo=2026-09-01T00:00:00.000Z']) {
        await request('GET', `?${query}`, undefined, 400);
      }
      await request('GET', '/today?timezone=Invalid/Zone', undefined, 400);
      await request('GET', '/today?page=0', undefined, 400);
    });

    await t.test('all endpoints enforce authentication; owners control task access and totals', async () => {
      const routes = [
        ['POST', '', payload], ['GET', '', undefined], ['GET', '/today', undefined],
        ['GET', `/${task.id}`, undefined], ['PUT', `/${task.id}`, { title: 'Unauthorized edit' }],
        ['PATCH', `/${task.id}/complete`, undefined], ['DELETE', `/${task.id}`, undefined],
      ];
      for (const [method, path, body] of routes) await request(method, path, body, 401, null);
      for (const id of [task.id, randomUUID()]) {
        for (const [method, path, body] of [
          ['GET', `/${id}`, undefined], ['PUT', `/${id}`, { title: 'Unauthorized edit' }],
          ['PATCH', `/${id}/complete`, undefined], ['DELETE', `/${id}`, undefined],
        ]) assert.equal((await request(method, path, body, 404, other.token)).code, 'TASK_NOT_FOUND');
      }
      const foreign = await create({ ...payload, title: 'Other owner task' }, other.token);
      const list = await request('GET', '', undefined, 200, other.token);
      assert.equal(list.meta.total, 1);
      assert.equal(list.data[0].id, foreign.id);
      assert.ok((await request('GET', '/today', undefined, 200, other.token)).data.tasks.every(row => row.userId === other.user.id));
    });

    await t.test('list combines all filters and search with inclusive dates and stable pagination', async () => {
      const filterPayload = { ...payload, title: 'unique-filter-fixture' };
      const first = await create(filterPayload);
      const second = await create(filterPayload);
      await create({ ...filterPayload, priority: 'LOW' });
      await create({ ...filterPayload, type: 'OTHER' });
      await create({ ...filterPayload, status: 'CANCELLED' });
      await create({ ...filterPayload, repeatPattern: 'WEEKLY' });
      await create({ ...filterPayload, dueDate: '2026-09-08T09:00:00.001Z' });
      const deleted = await create(filterPayload);
      await request('DELETE', `/${deleted.id}`);
      await create(filterPayload, other.token);
      const query = '?search=UNIQUE-FILTER-FIXTURE&type=FOLLOW_UP&priority=HIGH&status=TODO&repeatPattern=NONE&dueDateFrom=2026-09-08T09:00:00.000Z&dueDateTo=2026-09-08T09:00:00.000Z&sortBy=title&order=asc&limit=1';
      const page1 = await request('GET', `${query}&page=1`);
      const page2 = await request('GET', `${query}&page=2`);
      assert.equal(page1.meta.total, 2);
      assert.equal(page1.meta.totalPages, 2);
      assert.deepEqual([page1.data[0].id, page2.data[0].id], [first.id, second.id].sort());
      assert.deepEqual((await request('GET', '?search=No-such-task-marker')).data, []);
    });

    await t.test('due dates put nulls last and priorities use their declared order', async () => {
      const a = await create({ title: 'sort-fixture', dueDate: payload.dueDate, priority: 'LOW' });
      const b = await create({ title: 'sort-fixture', dueDate: payload.dueDate, priority: 'URGENT' });
      const c = await create({ title: 'sort-fixture', priority: 'HIGH' });
      assert.deepEqual((await request('GET', '?search=sort-fixture')).data.map(row => row.id), [b.id, a.id, c.id]);
      assert.equal((await request('GET', '?search=sort-fixture&sortBy=dueDate&order=desc')).data.at(-1).id, c.id);
      assert.deepEqual((await request('GET', '?search=sort-fixture&sortBy=priority&order=desc')).data.map(row => row.priority), ['URGENT', 'HIGH', 'LOW']);
    });

    await t.test('one-time completion is final and idempotent', async () => {
      const record = await create({ title: 'One-time task' });
      const result = await complete(record.id);
      assert.equal(result.task.status, 'COMPLETED');
      assert.ok(result.task.completedAt);
      assert.equal(result.nextTask, null);
      const repeated = (await request('PATCH', `/${record.id}/complete`, {})).data;
      assert.equal(repeated.task.completedAt, result.task.completedAt);
      assert.equal(repeated.task.updatedAt, result.task.updatedAt);
      assert.equal(repeated.nextTask, null);
      assert.equal((await request('PUT', `/${record.id}`, { status: 'TODO' }, 409)).code, 'TASK_COMPLETED');
      await request('PUT', `/${record.id}`, { title: 'Changed completed task' }, 409);
    });

    await t.test('cancelled tasks must be reopened before completion', async () => {
      const record = await create({ title: 'Cancelled task', status: 'CANCELLED' });
      assert.equal((await request('PATCH', `/${record.id}/complete`, undefined, 409)).code, 'TASK_CANCELLED');
      assert.equal((await request('GET', `/${record.id}`)).data.completedAt, null);
      await request('PUT', `/${record.id}`, { status: 'IN_PROGRESS' });
      assert.equal((await complete(record.id)).task.status, 'COMPLETED');
    });

    await t.test('recurrence advances local calendar dates including short months, leap years, and DST', async () => {
      const cases = [
        ['DAILY', 'Asia/Yangon', '2026-09-08T09:00:00.000Z', '2026-09-09T09:00:00.000Z'],
        ['WEEKLY', 'UTC', '2026-09-08T09:00:00.000Z', '2026-09-15T09:00:00.000Z'],
        ['MONTHLY', 'UTC', '2026-01-31T09:00:00.000Z', '2026-02-28T09:00:00.000Z'],
        ['MONTHLY', 'UTC', '2028-01-31T09:00:00.000Z', '2028-02-29T09:00:00.000Z'],
        ['DAILY', 'America/New_York', '2026-03-07T14:00:00.000Z', '2026-03-08T13:00:00.000Z'],
        ['DAILY', 'America/New_York', '2026-10-31T13:00:00.000Z', '2026-11-01T14:00:00.000Z'],
        ['WEEKLY', 'America/New_York', '2026-03-01T14:00:00.000Z', '2026-03-08T13:00:00.000Z'],
        ['DAILY', 'UTC', '2020-01-01T09:00:00.000Z', '2020-01-02T09:00:00.000Z'],
      ];
      for (const [repeatPattern, timezone, dueDate, expected] of cases) {
        const record = await create({ ...payload, repeatPattern, timezone, dueDate });
        const result = await complete(record.id);
        assert.equal(result.task.dueDate, dueDate);
        assert.equal(result.task.status, 'COMPLETED');
        assert.equal(result.nextTask.dueDate, expected);
        assert.equal(result.nextTask.status, 'TODO');
        assert.equal(result.nextTask.completedAt, null);
        assert.equal(result.nextTask.recurrenceSourceId, record.id);
        for (const key of ['title', 'type', 'priority', 'timezone', 'repeatPattern', 'userId']) assert.equal(result.nextTask[key], record[key]);
      }
    });

    await t.test('simultaneous completion creates one successor; deleted successors are not recreated', async () => {
      const record = await create({ ...payload, repeatPattern: 'DAILY' });
      const results = await Promise.all(Array.from({ length: 3 }, () => complete(record.id)));
      assert.equal(new Set(results.map(result => result.nextTask.id)).size, 1);
      assert.equal(new Set(results.map(result => result.task.completedAt)).size, 1);
      assert.equal(await db.task.count({ where: { recurrenceSourceId: record.id } }), 1);
      await assert.rejects(() => db.task.create({ data: { userId: owner.user.id, title: 'Duplicate successor', recurrenceSourceId: record.id } }), error => error.code === 'P2002');
      await request('DELETE', `/${results[0].nextTask.id}`);
      assert.equal((await complete(record.id)).nextTask, null);
      assert.equal(await db.task.count({ where: { recurrenceSourceId: record.id } }), 1);
    });

    await t.test('failed successor creation rolls back completion', async () => {
      const record = await create({ ...payload, repeatPattern: 'DAILY' });
      const realTransaction = db.$transaction.bind(db);
      db.$transaction = (work, options) => typeof work !== 'function' ? realTransaction(work, options) : realTransaction(tx => work(new Proxy(tx, {
        get(target, property) {
          if (property === 'task') return new Proxy(target.task, {
            get(delegate, method) {
              if (method === 'create') return async () => { throw new Error('Injected successor write failure'); };
              return Reflect.get(delegate, method);
            },
          });
          return Reflect.get(target, property);
        },
      })), options);
      try {
        assert.equal((await request('PATCH', `/${record.id}/complete`, undefined, 500)).code, 'INTERNAL_ERROR');
      } finally { db.$transaction = realTransaction; }
      const stored = (await request('GET', `/${record.id}`)).data;
      assert.equal(stored.status, 'TODO');
      assert.equal(stored.completedAt, null);
      assert.equal(stored.updatedAt, record.updatedAt);
      assert.equal(await db.task.count({ where: { recurrenceSourceId: record.id } }), 0);
    });

    await t.test('today HTTP route returns local-day pages and whole-day summaries with ownership/deletion filters', async () => {
      const daily = await newUser();
      const endpoint = '/today?timezone=Asia/Yangon&page=1&limit=2';
      const empty = (await request('GET', endpoint, undefined, 200, daily.token)).data;
      assert.equal(empty.summary.dueToday, 0);
      assert.deepEqual(empty.tasks, []);
      const start = Date.parse(empty.range.from);
      const end = Date.parse(empty.range.to);
      const make = (offset, status = 'TODO') => create({ title: 'Day window task', dueDate: new Date(start + offset).toISOString(), status }, daily.token);
      await make(0);
      await make(1000, 'IN_PROGRESS');
      const finished = await make(end - start - 1);
      await complete(finished.id, daily.token);
      await make(2000, 'CANCELLED');
      await make(-1);
      const finishedPast = await make(-1000);
      await complete(finishedPast.id, daily.token);
      await make(end - start);
      await create({ title: 'Unscheduled open task' }, daily.token);
      await create({ title: 'Unscheduled cancelled task', status: 'CANCELLED' }, daily.token);
      const deleted = await make(3000);
      await request('DELETE', `/${deleted.id}`, undefined, 200, daily.token);
      await create({ title: 'Other owner today', dueDate: new Date(start).toISOString() });
      const result = (await request('GET', endpoint, undefined, 200, daily.token)).data;
      assert.equal(result.timezone, 'Asia/Yangon');
      assert.deepEqual(result.range, empty.range);
      assert.equal(result.meta.total, 4);
      assert.equal(result.meta.totalPages, 2);
      assert.equal(result.tasks.length, 2);
      assert.ok(result.tasks.every(row => row.userId === daily.user.id && row.deletedAt === null));
      assert.deepEqual(result.summary, { dueToday: 4, pendingToday: 1, inProgressToday: 1, completedToday: 1, cancelledToday: 1, overdue: 1, unscheduled: 1 });
      const page2 = (await request('GET', '/today?timezone=Asia/Yangon&page=2&limit=2', undefined, 200, daily.token)).data;
      assert.deepEqual(page2.summary, result.summary);
      assert.equal(new Set([...result.tasks, ...page2.tasks].map(row => row.id)).size, 4);
    });

    await t.test('today respects midnight and 23/25-hour DST days with an injected server clock', async () => {
      const { getTodayTasks } = require('../dist/src/modules/tasks/services/tasks.service');
      const { validateTodayTasksQuery } = require('../dist/src/modules/tasks/validators/tasks.validators');
      const cases = [
        ['America/New_York', '2026-03-08T16:00:00.000Z', '2026-03-08', '2026-03-08T05:00:00.000Z', '2026-03-09T04:00:00.000Z'],
        ['America/New_York', '2026-11-01T16:00:00.000Z', '2026-11-01', '2026-11-01T04:00:00.000Z', '2026-11-02T05:00:00.000Z'],
        ['Asia/Yangon', '2026-09-08T20:00:00.000Z', '2026-09-09', '2026-09-08T17:30:00.000Z', '2026-09-09T17:30:00.000Z'],
      ];
      for (const [timezone, now, date, from, to] of cases) {
        const daily = await newUser();
        const ids = [];
        for (const dueDate of [new Date(Date.parse(from) - 1), new Date(from), new Date(Date.parse(to) - 1), new Date(to)]) {
          ids.push((await db.task.create({ data: { userId: daily.user.id, title: 'Calendar boundary', dueDate } })).id);
        }
        const result = await getTodayTasks(validateTodayTasksQuery({ timezone }), daily.user.id, new Date(now));
        assert.equal(result.date, date);
        assert.equal(result.range.from.toISOString(), from);
        assert.equal(result.range.to.toISOString(), to);
        assert.deepEqual(result.tasks.map(row => row.id), [ids[1], ids[2]]);
        assert.equal(result.summary.dueToday, 2);
        assert.equal(result.summary.overdue, 1);
      }
    });

    await t.test('soft-delete retains storage, denies access, and does not remove generated occurrences', async () => {
      const record = await create({ title: 'soft-delete-only-marker' });
      await request('DELETE', `/${record.id}`);
      assert.ok((await db.task.findUniqueOrThrow({ where: { id: record.id } })).deletedAt);
      for (const [method, path, body] of [
        ['GET', `/${record.id}`, undefined], ['PUT', `/${record.id}`, { title: 'Deleted edit' }],
        ['PATCH', `/${record.id}/complete`, undefined], ['DELETE', `/${record.id}`, undefined],
      ]) assert.equal((await request(method, path, body, 404)).code, 'TASK_NOT_FOUND');
      const list = await request('GET', '?search=soft-delete-only-marker');
      assert.equal(list.meta.total, 0);
      assert.deepEqual(list.data, []);
      const recurring = await create({ ...payload, repeatPattern: 'WEEKLY' });
      const result = await complete(recurring.id);
      await request('DELETE', `/${recurring.id}`);
      assert.equal((await request('GET', `/${result.nextTask.id}`)).data.status, 'TODO');
    });
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    delete global.__prisma;
    await fixture.cleanup();
  }
});
