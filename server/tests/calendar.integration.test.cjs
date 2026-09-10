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
const sources = {
  COMPANY: { model: 'company', table: 'Company', column: 'companyId', route: 'companies' },
  CONTACT: { model: 'contact', table: 'Contact', column: 'contactId', route: 'contacts' },
  APPLICATION: { model: 'application', table: 'Application', column: 'applicationId', route: 'applications' },
  TASK: { model: 'task', table: 'Task', column: 'taskId', route: 'tasks' },
  PROJECT: { model: 'project', table: 'Project', column: 'projectId', route: 'projects' },
};
const params = values => new URLSearchParams(values).toString();

test('Phase 7 Calendar API, range views, reminders, and source lifecycle', { timeout: 300000 }, async t => {
  const fixture = await createTestDatabase(env.DATABASE_URL);
  const { db } = fixture;
  global.__prisma = db;
  const { app } = require('../dist/src/app');
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}/api/v1`;
    const account = async () => {
      const user = await db.user.create({ data: { fullName: 'Calendar tester', email: `calendar-${randomUUID()}@example.com`, passwordHash: 'fixture-no-login' } });
      return { user, token: jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: 600 }) };
    };
    const owner = await account(), other = await account();
    const api = async (method, path, body, expected = 200, token = owner.token) => {
      const response = await fetch(`${base}${path}`, {
        method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(25000),
      });
      const result = await response.json();
      assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result).slice(0, 1000)}`);
      assert.equal(result.success, expected < 400);
      return result;
    };
    const request = (method, path, body, expected, token) => api(method, `/calendar${path}`, body, expected, token);
    const payload = { title: 'Technical interview', type: 'INTERVIEW', startAt: '2026-10-08T09:00:00+06:30', endAt: '2026-10-08T10:00:00+06:30', timezone: 'Asia/Yangon', reminders: [60, 15, 60, 0] };
    const create = async (body = {}, token = owner.token) => (await request('POST', '/events', { ...payload, ...body }, 201, token)).data;
    const targets = async (userId = owner.user.id) => {
      const company = await db.company.create({ data: { userId, name: 'Calendar company', techStack: [] } });
      const [contact, application, task, project] = await Promise.all([
        db.contact.create({ data: { userId, companyId: company.id, name: 'Calendar contact', photo: 'https://example.com/photo.png', email: 'contact@example.com', phone: '+1 234', linkedIn: 'https://example.com/profile', role: 'Recruiter', lastContactAt: new Date(), nextFollowUpAt: new Date('2026-10-08T02:30:00Z') } }),
        db.application.create({ data: { userId, companyId: company.id, position: 'Developer' } }),
        db.task.create({ data: { userId, title: 'Calendar task', dueDate: new Date('2026-10-08T02:30:00Z') } }),
        db.project.create({ data: { userId, name: 'Calendar project' } }),
      ]);
      return { COMPANY: company, CONTACT: contact, APPLICATION: application, TASK: task, PROJECT: project };
    };
    const owned = await targets(), foreign = await targets(other.user.id);

    await t.test('fresh migration replay creates event ownership, source FKs, interval and reminder constraints', async () => {
      assert.ok(fixture.migrations.includes('20260909000000_calendar'));
      const row = await db.calendarEvent.create({ data: { userId: owner.user.id, title: 'Database fixture', startAt: new Date('2026-10-08T00:00:00Z') } });
      for (const data of [
        { title: 'x' }, { endAt: row.startAt }, { endAt: new Date('2026-10-07T00:00:00Z') },
        { reminders: [-1] }, { reminders: [10081] }, { reminders: [1, 1] }, { reminders: [20, 10] }, { reminders: [1, 2, 3, 4, 5, 6] },
        { companyId: owned.COMPANY.id, taskId: owned.TASK.id }, { companyId: randomUUID() }, { userId: randomUUID() },
      ]) await assert.rejects(db.calendarEvent.update({ where: { id: row.id }, data }));
      const [column] = await db.$queryRaw`SELECT data_type FROM information_schema.columns WHERE table_schema = ${fixture.schema} AND table_name = 'CalendarEvent' AND column_name = 'startAt'`;
      assert.equal(column.data_type, 'timestamp with time zone');
      await db.calendarEvent.delete({ where: { id: row.id } });
    });

    await t.test('CRUD normalizes timestamps/reminders, supports points and clearing, and projects only public fields', async () => {
      const event = await create({ title: '  Technical interview  ' });
      assert.equal(event.title, 'Technical interview');
      assert.equal(event.startAt, '2026-10-08T02:30:00.000Z');
      assert.equal(event.endAt, '2026-10-08T03:30:00.000Z');
      assert.deepEqual(event.reminders, [0, 15, 60]);
      assert.equal(event.sourceEntityId, null);
      assert.equal(event.sourceAvailable, null);
      assert.equal(event.companyId, undefined);
      assert.equal(event.userId, owner.user.id);
      assert.deepEqual((await request('GET', `/events/${event.id}`)).data, event);
      const updated = (await request('PUT', `/events/${event.id}`, { title: 'Changed title', endAt: null, reminders: [] })).data;
      assert.equal(updated.startAt, event.startAt);
      assert.equal(updated.endAt, null);
      assert.deepEqual(updated.reminders, []);
      const point = (await request('POST', '/events', { title: 'A deadline', startAt: '2026-12-01T00:00:00Z' }, 201)).data;
      assert.equal(point.type, 'OTHER'); assert.equal(point.timezone, 'UTC'); assert.equal(point.endAt, null);
      await request('DELETE', `/events/${point.id}`);
      assert.ok((await db.calendarEvent.findUniqueOrThrow({ where: { id: point.id } })).deletedAt);
      for (const method of ['GET', 'PUT', 'DELETE'])
        assert.equal((await request(method, `/events/${point.id}`, method === 'PUT' ? { title: 'Hidden' } : undefined, 404)).code, 'CALENDAR_EVENT_NOT_FOUND');
    });

    await t.test('strict validation rejects invalid fields, Unicode, times, source pairs and reminder values', async () => {
      const invalid = [
        { title: 'x' }, { title: ' '.repeat(3) }, { title: 'x'.repeat(201) }, { title: 'bad\0' }, { title: 'bad\ud800' },
        { type: 'MEETING' }, { startAt: null }, { startAt: 1 }, { startAt: '2026-02-30T09:00:00Z' },
        { startAt: '2026-10-08T09:00:00' }, { startAt: '2026-10-08' }, { startAt: '2026-10-08T02:30:00.1234Z' },
        { startAt: '0000-01-01T00:00:00Z' }, { endAt: '2026-10-08T02:30:00Z' },
        { timezone: 'Mars/Olympus' }, { timezone: '+06:30' }, { timezone: null },
        { reminders: null }, { reminders: ['15'] }, { reminders: [-1] }, { reminders: [0.5] }, { reminders: [10081] }, { reminders: [0, 1, 2, 3, 4, 5] },
        { sourceEntityId: owned.TASK.id }, { sourceEntityType: 'TASK' }, { sourceEntityType: null, sourceEntityId: owned.TASK.id },
        { sourceEntityType: 'constructor', sourceEntityId: owned.TASK.id },
        { sourceEntityType: 'TASK', sourceEntityId: 'bad' }, { userId: other.user.id }, { id: randomUUID() }, { deletedAt: null }, { companyId: owned.COMPANY.id },
      ];
      const before = await db.calendarEvent.count();
      for (const change of invalid)
        assert.equal((await request('POST', '/events', { ...payload, ...change }, 400)).code, 'VALIDATION_ERROR');
      assert.equal(await db.calendarEvent.count(), before);
      const event = await create();
      await request('PUT', `/events/${event.id}`, {}, 400);
      await request('PUT', `/events/${event.id}`, { sourceEntityType: null }, 400);
      await request('GET', '/events/not-a-uuid', undefined, 400);
    });

    await t.test('partial updates validate merged schedules and keep failed edits atomic', async () => {
      const event = await create();
      for (const body of [{ startAt: event.endAt }, { endAt: event.startAt }]) {
        const error = await request('PUT', `/events/${event.id}`, body, 400);
        assert.ok(error.details.fieldErrors.endAt);
        assert.deepEqual((await request('GET', `/events/${event.id}`)).data, event);
      }
      const moved = (await request('PUT', `/events/${event.id}`, { startAt: '2026-10-09T12:00:00Z', endAt: '2026-10-09T13:00:00Z' })).data;
      assert.equal(moved.startAt, '2026-10-09T12:00:00.000Z');
      await request('PUT', `/events/${event.id}`, { startAt: '0001-01-01T00:00:00Z', endAt: null }, 400);
    });

    await t.test('authentication and ownership cover every route and hide foreign or missing events', async () => {
      const secret = await create({ title: `Private ${randomUUID()}` }, other.token);
      for (const path of ['/events', `/events/${secret.id}`, '/range?view=day&date=2026-10-08', '/reminders?from=2026-10-08T00:00:00Z&to=2026-10-09T00:00:00Z'])
        await request('GET', path, undefined, 401, '');
      for (const id of [secret.id, randomUUID()]) for (const method of ['GET', 'PUT', 'DELETE'])
        await request(method, `/events/${id}`, method === 'PUT' ? { title: 'No access' } : undefined, 404);
      assert.equal((await request('GET', `/events?search=${encodeURIComponent(secret.title)}`)).meta.total, 0);
      assert.equal((await request('GET', `/range?view=day&date=2026-10-08&search=${encodeURIComponent(secret.title)}`)).data.meta.total, 0);
      const reminders = await request('GET', '/reminders?from=2026-10-08T00:00:00Z&to=2026-10-09T00:00:00Z&limit=100');
      assert.ok(reminders.data.every(row => row.eventId !== secret.id));
      await request('POST', '/events', payload, 401, '');
    });

    await t.test('event lists combine filters and paginate deterministically with exact totals', async () => {
      const marker = `list-${randomUUID()}`;
      await db.calendarEvent.createMany({ data: Array.from({ length: 5 }, (_, index) => ({
        userId: owner.user.id, title: `${marker} ${index}`, type: 'DEADLINE', startAt: new Date('2030-01-01T00:00:00Z'), taskId: owned.TASK.id,
      })) });
      const query = `/events?${params({ search: marker.toUpperCase(), type: 'DEADLINE', sourceEntityType: 'TASK', sourceEntityId: owned.TASK.id, limit: '2' })}`;
      const first = await request('GET', query), second = await request('GET', `${query}&page=2`), last = await request('GET', `${query}&page=3`);
      assert.equal(first.meta.total, 5); assert.equal(first.meta.totalPages, 3); assert.equal(last.data.length, 1);
      assert.equal(new Set([...first.data, ...second.data, ...last.data].map(row => row.id)).size, 5);
      assert.deepEqual((await request('GET', query)).data, first.data);
      assert.equal((await request('GET', `/events?search=${marker}&type=INTERVIEW`)).meta.total, 0);
      assert.deepEqual((await request('GET', `/events?search=${marker}&sortBy=title&order=desc`)).data.map(row => row.title), [4, 3, 2, 1, 0].map(n => `${marker} ${n}`));
      assert.equal((await request('GET', `/events?search=${marker}&page=99`)).data.length, 0);
      assert.equal((await request('GET', '/events?limit=99999')).meta.limit, env.PAGINATION_MAX_LIMIT);
    });

    await t.test('range overlap includes earlier intervals and start points while excluding touching endpoints', async () => {
      const marker = `overlap-${randomUUID()}`, from = '2040-01-02T00:00:00Z', to = '2040-01-03T00:00:00Z';
      const cases = [
        ['spans', '2040-01-01T00:00:00Z', '2040-01-04T00:00:00Z', true],
        ['ends-inside', '2040-01-01T00:00:00Z', '2040-01-02T01:00:00Z', true],
        ['ends-at-from', '2040-01-01T00:00:00Z', from, false],
        ['starts-at-to', to, '2040-01-04T00:00:00Z', false],
        ['point-at-from', from, null, true], ['point-at-to', to, null, false],
        ['point-before', '2040-01-01T23:59:59Z', null, false],
      ];
      await db.calendarEvent.createMany({ data: cases.map(([label, start, end]) => ({ userId: owner.user.id, title: `${marker} ${label}`, startAt: new Date(start), endAt: end ? new Date(end) : null })) });
      const query = params({ from, to, search: marker });
      const listed = await request('GET', `/events?${query}`), range = (await request('GET', `/range?${query}`)).data;
      assert.deepEqual(listed.data.map(row => row.title).sort(), cases.filter(row => row[3]).map(row => `${marker} ${row[0]}`).sort());
      assert.deepEqual(range.events, listed.data); assert.equal(range.meta.total, 3);
      assert.deepEqual(range.range, { from: '2040-01-02T00:00:00.000Z', to: '2040-01-03T00:00:00.000Z' });
      assert.equal(range.view, 'custom');
      const paged = (await request('GET', `/range?${query}&limit=1&page=2`)).data;
      assert.equal(paged.events.length, 1); assert.equal(paged.meta.total, 3);
    });

    await t.test('named views resolve DST days, Monday weeks, leap months and fractional-offset timezones', async () => {
      for (const [view, date, timezone, from, to] of [
        ['day', '2026-03-08', 'America/New_York', '2026-03-08T05:00:00.000Z', '2026-03-09T04:00:00.000Z'],
        ['day', '2026-11-01', 'America/New_York', '2026-11-01T04:00:00.000Z', '2026-11-02T05:00:00.000Z'],
        ['day', '2026-09-09', 'Asia/Yangon', '2026-09-08T17:30:00.000Z', '2026-09-09T17:30:00.000Z'],
        ['week', '2026-01-01', 'UTC', '2025-12-29T00:00:00.000Z', '2026-01-05T00:00:00.000Z'],
        ['month', '2028-02-10', 'UTC', '2028-02-01T00:00:00.000Z', '2028-03-01T00:00:00.000Z'],
        ['day', '0001-01-01', 'UTC', '0001-01-01T00:00:00.000Z', '0001-01-02T00:00:00.000Z'],
        ['day', '9999-12-30', 'UTC', '9999-12-30T00:00:00.000Z', '9999-12-31T00:00:00.000Z'],
      ]) {
        const result = (await request('GET', `/range?${params({ view, date, timezone, search: 'no-matching-calendar-fixture' })}`)).data;
        assert.deepEqual(result.range, { from, to }); assert.equal(result.timezone, timezone);
        assert.deepEqual(result.events, []); assert.equal(result.meta.total, 0);
      }
      await request('GET', '/range?view=day&date=2011-12-30&timezone=Pacific/Apia', undefined, 400);
      await request('GET', '/range?view=day&date=0001-01-01&timezone=Asia/Yangon', undefined, 400);
    });

    await t.test('invalid, mixed, unbounded, duplicate and oversized query parameters are rejected', async () => {
      for (const suffix of ['?page=0', '?page=1&page=2', '?limit=1.5', '?page=1000001', '?sortBy=userId', '?deletedAt=true', '?sourceEntityType=TASK', '?sourceEntityId=bad', '?from=2026-01-01T00:00:00Z', '?from=2026-01-02T00:00:00Z&to=2026-01-01T00:00:00Z', '?from=2026-01-01T00:00:00Z&to=2028-01-01T00:00:00Z'])
        await request('GET', `/events${suffix}`, undefined, 400);
      for (const suffix of ['', '?date=2026-01-01', '?view=day', '?view=year&date=2026-01-01', '?view=day&date=2026-02-30', '?view=day&date=2026-01-01&from=2026-01-01T00:00:00Z&to=2026-01-02T00:00:00Z', '?view=day&date=2026-01-01&timezone=invalid', '?view=month&date=9999-12-01'])
        await request('GET', `/range${suffix}`, undefined, 400);
      for (const suffix of ['', '?from=2026-01-01T00:00:00Z', '?from=2026-01-01T00:00:00Z&to=2026-03-01T00:00:00Z', '?from=2026-01-01T00:00:00Z&to=2026-01-01T00:00:00Z'])
        await request('GET', `/reminders${suffix}`, undefined, 400);
    });

    await t.test('all five sources support attach/rebind/detach without modifying source dates', async () => {
      const event = await create();
      for (const [type, source] of Object.entries(owned)) {
        const result = (await request('PUT', `/events/${event.id}`, { sourceEntityType: type, sourceEntityId: source.id })).data;
        assert.equal(result.sourceEntityType, type); assert.equal(result.sourceEntityId, source.id); assert.equal(result.sourceAvailable, true);
        assert.equal((await request('GET', `/events?sourceEntityType=${type}&sourceEntityId=${source.id}`)).data.some(row => row.id === event.id), true);
        await request('POST', '/events', { ...payload, sourceEntityType: type, sourceEntityId: foreign[type].id }, 404);
        await request('PUT', `/events/${event.id}`, { sourceEntityType: type, sourceEntityId: randomUUID() }, 404);
      }
      const detached = (await request('PUT', `/events/${event.id}`, { sourceEntityType: null, sourceEntityId: null })).data;
      assert.equal(detached.sourceEntityId, null); assert.equal(detached.sourceAvailable, null);
      assert.equal((await db.task.findUniqueOrThrow({ where: { id: owned.TASK.id } })).dueDate.toISOString(), owned.TASK.dueDate.toISOString());
      assert.equal((await db.contact.findUniqueOrThrow({ where: { id: owned.CONTACT.id } })).nextFollowUpAt.toISOString(), owned.CONTACT.nextFollowUpAt.toISOString());
    });

    await t.test('soft-deleted sources retain events, allow unrelated edits, and reject newly selected deleted sources', async () => {
      const records = await targets();
      for (const type of ['CONTACT', 'APPLICATION', 'TASK', 'PROJECT', 'COMPANY']) {
        const target = records[type], source = { sourceEntityType: type, sourceEntityId: target.id };
        const event = await create(source);
        await api('DELETE', `/${sources[type].route}/${target.id}`);
        const read = (await request('GET', `/events/${event.id}`)).data;
        assert.equal(read.sourceAvailable, false); assert.equal(read.sourceEntityId, target.id);
        const edited = (await request('PUT', `/events/${event.id}`, { title: 'Source unavailable, event kept' })).data;
        assert.equal(edited.sourceAvailable, false); assert.deepEqual(edited.reminders, event.reminders);
        await request('POST', '/events', { ...payload, ...source }, 404);
        await request('PUT', `/events/${event.id}`, source, 404);
        await request('PUT', `/events/${event.id}`, { sourceEntityType: null, sourceEntityId: null });
      }
    });

    await t.test('physical source deletion clears links and batched availability does not disclose foreign sources', async () => {
      const records = await targets();
      for (const type of ['CONTACT', 'APPLICATION', 'TASK', 'PROJECT', 'COMPANY']) {
        const event = await create({ sourceEntityType: type, sourceEntityId: records[type].id });
        await db[sources[type].model].delete({ where: { id: records[type].id } });
        const read = (await request('GET', `/events/${event.id}`)).data;
        assert.equal(read.sourceEntityId, null); assert.equal(read.sourceAvailable, null); assert.equal(read.deletedAt, null);
      }
      const marker = `batch-${randomUUID()}`;
      await db.calendarEvent.createMany({ data: Object.entries(owned).flatMap(([type, source]) => Array.from({ length: 3 }, () => ({ userId: owner.user.id, title: marker, startAt: new Date(), [sources[type].column]: source.id }))) });
      const foreignLink = await db.calendarEvent.create({ data: { userId: owner.user.id, title: marker, startAt: new Date(), taskId: foreign.TASK.id } });
      const counts = Object.fromEntries(Object.values(sources).map(source => [source.model, 0]));
      const realTransaction = db.$transaction.bind(db);
      db.$transaction = (work, options) => realTransaction(tx => work(new Proxy(tx, {
        get(target, property) {
          if (Object.hasOwn(counts, property)) return new Proxy(target[property], { get(delegate, method) {
            if (method === 'findMany') return (...args) => { counts[property]++; return delegate.findMany(...args); };
            return Reflect.get(delegate, method);
          } });
          return Reflect.get(target, property);
        },
      })), options);
      let listed;
      try { listed = await request('GET', `/events?search=${marker}&limit=100`); } finally { db.$transaction = realTransaction; }
      assert.equal(listed.meta.total, 16); assert.deepEqual(Object.values(counts), [1, 1, 1, 1, 1]);
      for (const row of listed.data) { assert.equal(row.sourceAvailable, row.id !== foreignLink.id); assert.equal(row.taskId, undefined); assert.equal(row.task, undefined); }
    });

    await t.test('reminder windows use absolute minute offsets, half-open bounds, stable ordering and accurate pagination', async () => {
      const at = '2050-05-01T06:00:00Z';
      const first = await create({ title: 'Reminder A', startAt: at, endAt: null, reminders: [0, 30, 60] });
      const second = await create({ title: 'Reminder B', startAt: at, endAt: null, reminders: [30] });
      const window = params({ from: '2050-05-01T11:30:00+06:30', to: '2050-05-01T12:30:00+06:30', limit: '2' });
      const one = await request('GET', `/reminders?${window}`), two = await request('GET', `/reminders?${window}&page=2`);
      assert.equal(one.meta.total, 3); assert.equal(two.data.length, 1);
      const all = [...one.data, ...two.data];
      assert.equal(all[0].eventId, first.id); assert.equal(all[0].minutesBefore, 60);
      assert.equal(all[0].remindAt, '2050-05-01T05:00:00.000Z');
      assert.equal(new Set(all.map(row => row.id)).size, 3);
      assert.ok(all.every(row => [first.id, second.id].includes(row.eventId) && row.minutesBefore !== 0));
      assert.deepEqual((await request('GET', `/reminders?${window}`)).data, one.data);
      const dst = await create({ startAt: '2026-03-08T03:30:00-04:00', endAt: null, timezone: 'America/New_York', reminders: [60] });
      const result = await request('GET', '/reminders?from=2026-03-08T06:00:00Z&to=2026-03-08T07:00:00Z');
      assert.equal(result.data.find(row => row.eventId === dst.id).remindAt, '2026-03-08T06:30:00.000Z');
    });

    await t.test('rescheduling, clearing and deleting events immediately update reminder lists and range visibility', async () => {
      const event = await create({ title: 'Scheduled reminder lifecycle', startAt: '2051-01-01T12:00:00Z', endAt: null, reminders: [15, 10080] });
      const query = '/reminders?from=2051-01-01T00:00:00Z&to=2051-01-02T00:00:00Z';
      assert.equal((await request('GET', query)).meta.total, 1);
      await request('PUT', `/events/${event.id}`, { startAt: '2051-01-02T12:00:00Z' });
      assert.equal((await request('GET', query)).meta.total, 0);
      await request('PUT', `/events/${event.id}`, { startAt: '2051-01-01T12:00:00Z', reminders: [] });
      assert.equal((await request('GET', query)).meta.total, 0);
      await request('PUT', `/events/${event.id}`, { reminders: [0] });
      await request('DELETE', `/events/${event.id}`);
      assert.equal((await request('GET', query)).meta.total, 0);
      assert.equal((await request('GET', '/range?view=day&date=2051-01-01')).data.meta.total, 0);
      assert.equal((await request('GET', '/events?search=Scheduled%20reminder%20lifecycle')).meta.total, 0);
    });

    await t.test('concurrent partial reschedules serialize and cannot commit an invalid merged interval', async () => {
      const event = await create({ startAt: '2052-01-01T10:00:00Z', endAt: '2052-01-01T12:00:00Z' });
      const changes = [{ startAt: '2052-01-01T11:00:00Z' }, { endAt: '2052-01-01T10:30:00Z' }];
      const responses = await Promise.all(changes.map(body => fetch(`${base}/calendar/events/${event.id}`, {
        method: 'PUT', headers: { authorization: `Bearer ${owner.token}`, 'content-type': 'application/json' }, body: JSON.stringify(body),
      })));
      assert.deepEqual(responses.map(response => response.status).sort(), [200, 400]);
      const current = (await request('GET', `/events/${event.id}`)).data;
      assert.ok(new Date(current.endAt) > new Date(current.startAt));
    });

    await t.test('failed persistence rolls back creation, rescheduling, reminders and source rebinding together', async () => {
      const original = await create({ sourceEntityType: 'TASK', sourceEntityId: owned.TASK.id });
      const marker = `rollback-${randomUUID()}`, realTransaction = db.$transaction.bind(db);
      db.$transaction = (work, options) => realTransaction(tx => work(new Proxy(tx, {
        get(target, property) {
          if (property === 'calendarEvent') return new Proxy(target.calendarEvent, { get(delegate, method) {
            if (method === 'create' || method === 'update') return async (...args) => { await delegate[method](...args); throw new Error('Injected failure after calendar write'); };
            return Reflect.get(delegate, method);
          } });
          return Reflect.get(target, property);
        },
      })), options);
      try {
        await request('POST', '/events', { ...payload, title: marker }, 500);
        await request('PUT', `/events/${original.id}`, { title: marker, startAt: '2053-01-01T12:00:00Z', endAt: null, reminders: [], sourceEntityType: 'PROJECT', sourceEntityId: owned.PROJECT.id }, 500);
      } finally { db.$transaction = realTransaction; }
      assert.equal(await db.calendarEvent.count({ where: { title: marker } }), 0);
      assert.deepEqual((await request('GET', `/events/${original.id}`)).data, original);
    });

    const waitForBlocked = async pid => {
      const deadline = Date.now() + 7000;
      while (Date.now() < deadline) {
        const [row] = await db.$queryRaw`SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE ${pid}::integer = ANY(pg_blocking_pids(pid))) AS blocked`;
        if (row.blocked) return;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      assert.fail('Expected a competing request to block on the held row lock');
    };
    const deleteWhileWaiting = async (table, model, id, attempt) => {
      assert.ok(['CalendarEvent', ...Object.values(sources).map(source => source.table)].includes(table));
      let signalReady, release;
      const ready = new Promise(resolve => { signalReady = resolve; }), gate = new Promise(resolve => { release = resolve; });
      const holder = db.$transaction(async tx => {
        await tx.$queryRawUnsafe(`SELECT "id" FROM "${table}" WHERE "id" = $1 FOR UPDATE`, id);
        const [{ pid }] = await tx.$queryRaw`SELECT pg_backend_pid() AS pid`;
        signalReady(pid); await gate;
        await tx[model].update({ where: { id }, data: { deletedAt: new Date() } });
      }, { timeout: 15000 });
      const pid = await Promise.race([ready, holder.then(() => { throw new Error('Lock was not acquired'); })]);
      const pending = attempt().then(value => ({ value }), error => ({ error }));
      try { await waitForBlocked(pid); } finally { release(); await holder; }
      const result = await pending; if (result.error) throw result.error; return result.value;
    };
    await t.test('event writes recheck deletion after waiting and never resurrect a deleted event', async () => {
      const event = await create();
      await deleteWhileWaiting('CalendarEvent', 'calendarEvent', event.id, () => request('PUT', `/events/${event.id}`, { title: 'Must not commit' }, 404));
      assert.equal((await db.calendarEvent.findUniqueOrThrow({ where: { id: event.id } })).title, event.title);
    });
    await t.test('source creation and rebind recheck concurrent target deletion and roll back', async () => {
      const target = await db.project.create({ data: { userId: owner.user.id, name: 'Concurrent calendar source' } });
      const event = await create();
      await deleteWhileWaiting('Project', 'project', target.id, () => request('PUT', `/events/${event.id}`, { title: 'Must roll back', sourceEntityType: 'PROJECT', sourceEntityId: target.id }, 404));
      assert.deepEqual((await request('GET', `/events/${event.id}`)).data, event);
      const target2 = await db.task.create({ data: { userId: owner.user.id, title: 'Concurrent create source' } });
      await deleteWhileWaiting('Task', 'task', target2.id, () => request('POST', '/events', { ...payload, sourceEntityType: 'TASK', sourceEntityId: target2.id }, 404));
    });
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await fixture.cleanup();
    delete global.__prisma;
  }
});
