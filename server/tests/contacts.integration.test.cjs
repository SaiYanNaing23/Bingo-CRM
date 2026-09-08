const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const test = require('node:test');

require('dotenv').config({ quiet: true });
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'fatal';

const jwt = require('jsonwebtoken');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../src/generated/prisma/client');
const { env } = require('../dist/src/config/env');

test('Contacts API baseline uses the migrated database', { timeout: 90000 }, async (t) => {
  const db = new PrismaClient({ adapter: new PrismaPg({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    statement_timeout: 15000,
  }) });
  const rollback = new Error('Roll back contact verification fixtures');

  try {
    await db.$transaction(async (tx) => {
      // Load the real routes with this transaction so every request and fixture rolls back.
      global.__prisma = tx;
      const { app } = require('../dist/src/app');
      const server = app.listen(0, '127.0.0.1');

      try {
        await once(server, 'listening');
        const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/contacts`;
        const users = [];
        for (let i = 0; i < 2; i++) {
          users.push(await tx.user.create({ data: {
            fullName: 'Contacts integration fixture',
            email: `contacts-${randomUUID()}@example.com`,
            passwordHash: 'integration-fixture-no-login',
          } }));
        }
        const tokens = users.map(user => jwt.sign(
          { sub: user.id, email: user.email, role: user.role },
          env.JWT_SECRET,
          { expiresIn: 120 },
        ));
        const company = await tx.company.create({ data: {
          userId: users[0].id, name: 'Contacts integration company', techStack: [],
        } });
        const foreignCompany = await tx.company.create({ data: {
          userId: users[1].id, name: 'Other owner company', techStack: [],
        } });
        const payload = {
          photo: 'https://images.unsplash.com/photo-1521791136064-7986c2920216',
          name: 'Sarah Johnson',
          companyId: company.id,
          email: 'sarah.johnson@example.com',
          phone: '+1 234 567 8900',
          linkedIn: 'https://www.linkedin.com/in/sarah-johnson',
          role: 'Senior Recruiter',
          notes: 'Contacted after job board posting.',
          lastContactAt: '2026-08-14T09:00:00.000Z',
          nextFollowUpAt: '2026-08-20T09:00:00.000Z',
        };
        const request = async (method, path, body, expectedStatus = 200, token = tokens[0]) => {
          const response = await fetch(`${baseUrl}${path}`, {
            method,
            headers: {
              ...(token ? { authorization: `Bearer ${token}` } : {}),
              ...(body ? { 'content-type': 'application/json' } : {}),
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
            signal: AbortSignal.timeout(10000),
          });
          const result = await response.json();
          assert.equal(response.status, expectedStatus, `${method} ${path}: ${JSON.stringify(result)}`);
          assert.equal(result.success, expectedStatus < 400);
          return result;
        };

        let contactId;
        await t.test('POST creates the supplied contact fields', async () => {
          const { data } = await request('POST', '', payload, 201);
          contactId = data.id;
          assert.ok(contactId);
          assert.equal(data.userId, users[0].id);
          assert.equal(data.deletedAt, null);
          for (const [key, value] of Object.entries(payload)) assert.equal(data[key], value);
        });
        // Abort dependent checks if creation failed; still roll back in the outer finally.
        assert.ok(contactId, 'Contact creation must succeed before checking the rest of the baseline');

        await t.test('GET reads and paginates contacts', async () => {
          await request('POST', '', { ...payload, name: 'Zoe Fixture' }, 201);
          const page = await request('GET', '?page=1&limit=1&sortBy=name&order=asc');
          assert.equal(page.data.length, 1);
          assert.equal(page.data[0].id, contactId);
          assert.equal(page.meta.total, 2);
          assert.equal(page.meta.page, 1);
          assert.equal(page.meta.limit, 1);
          const secondPage = await request('GET', '?page=2&limit=1&sortBy=name&order=asc');
          assert.equal(secondPage.data[0].name, 'Zoe Fixture');
          const result = await request('GET', `/${contactId}`);
          assert.equal(result.data.name, payload.name);
        });

        await t.test('PUT updates a contact', async () => {
          const result = await request('PUT', `/${contactId}`, { role: 'Lead Recruiter' });
          assert.equal(result.data.role, 'Lead Recruiter');
          assert.equal((await request('GET', `/${contactId}`)).data.role, 'Lead Recruiter');
        });

        await t.test('PATCH supports either follow-up date or both and persists the changes', async () => {
          const nextFollowUpAt = '2026-09-20T09:00:00.000Z';
          const result = await request('PATCH', `/${contactId}/follow-up`, { nextFollowUpAt });
          assert.equal(result.data.nextFollowUpAt, nextFollowUpAt);
          assert.equal(result.data.lastContactAt, payload.lastContactAt);

          const lastContactAt = '2026-09-08T09:00:00.000Z';
          const lastOnly = await request('PATCH', `/${contactId}/follow-up`, { lastContactAt });
          assert.equal(lastOnly.data.lastContactAt, lastContactAt);
          assert.equal(lastOnly.data.nextFollowUpAt, nextFollowUpAt);

          const dates = { lastContactAt: '2026-09-09T09:00:00.000Z', nextFollowUpAt: '2026-09-21T09:00:00.000Z' };
          await request('PATCH', `/${contactId}/follow-up`, dates);
          const persisted = (await request('GET', `/${contactId}`)).data;
          assert.equal(persisted.lastContactAt, dates.lastContactAt);
          assert.equal(persisted.nextFollowUpAt, dates.nextFollowUpAt);
          assert.equal(persisted.name, payload.name);
          assert.equal(persisted.role, 'Lead Recruiter');
          const withOffset = await request('PATCH', `/${contactId}/follow-up`, {
            lastContactAt: '2026-09-09T15:30:00.000+06:30',
          });
          assert.equal(withOffset.data.lastContactAt, dates.lastContactAt);
          assert.equal(withOffset.data.nextFollowUpAt, dates.nextFollowUpAt);
        });

        await t.test('PATCH rejects empty, unrelated, or invalid date payloads without changing dates', async () => {
          const before = (await request('GET', `/${contactId}`)).data;
          const invalidPayloads = [{}, { notes: 'No follow-up dates supplied' }];
          for (const field of ['lastContactAt', 'nextFollowUpAt']) {
            for (const value of ['not-a-date', '2026-02-30T09:00:00.000Z', '', null, true, 123]) {
              invalidPayloads.push({ [field]: value });
            }
          }
          for (const body of invalidPayloads) {
            const result = await request('PATCH', `/${contactId}/follow-up`, body, 400);
            assert.equal(result.code, 'VALIDATION_ERROR');
          }
          const after = (await request('GET', `/${contactId}`)).data;
          assert.equal(after.lastContactAt, before.lastContactAt);
          assert.equal(after.nextFollowUpAt, before.nextFollowUpAt);
        });

        await t.test('PATCH requires authentication and an existing active contact', async () => {
          const result = await request('PATCH', `/${contactId}/follow-up`, { nextFollowUpAt: payload.nextFollowUpAt }, 401, null);
          assert.equal(result.code, 'AUTH_MISSING_TOKEN');
          const missing = await request('PATCH', `/${randomUUID()}/follow-up`, { nextFollowUpAt: payload.nextFollowUpAt }, 404);
          assert.equal(missing.code, 'CONTACT_NOT_FOUND');
        });

        await t.test('ownership protects contacts and company associations', async () => {
          assert.deepEqual((await request('GET', '', undefined, 200, tokens[1])).data, []);
          await request('GET', `/${contactId}`, undefined, 404, tokens[1]);
          await request('PUT', `/${contactId}`, { name: 'Unauthorized' }, 404, tokens[1]);
          await request('PATCH', `/${contactId}/follow-up`, { nextFollowUpAt: payload.nextFollowUpAt }, 404, tokens[1]);
          await request('DELETE', `/${contactId}`, undefined, 404, tokens[1]);
          const result = await request('POST', '', { ...payload, companyId: foreignCompany.id }, 404);
          assert.equal(result.code, 'CONTACT_COMPANY_NOT_FOUND');
          await request('PUT', `/${contactId}`, { companyId: foreignCompany.id }, 404);
        });

        await t.test('authentication and validation use the error contract', async () => {
          const unauthorized = await request('POST', '', payload, 401, null);
          assert.equal(unauthorized.code, 'AUTH_MISSING_TOKEN');
          const invalid = await request('POST', '', { ...payload, email: 'invalid' }, 400);
          assert.equal(invalid.code, 'VALIDATION_ERROR');
          const invalidCreateDate = await request('POST', '', { ...payload, lastContactAt: null }, 400);
          assert.equal(invalidCreateDate.code, 'VALIDATION_ERROR');
          const invalidUpdateDate = await request('PUT', `/${contactId}`, { nextFollowUpAt: '2026-02-30T09:00:00.000Z' }, 400);
          assert.equal(invalidUpdateDate.code, 'VALIDATION_ERROR');
        });

        await t.test('DELETE soft-deletes and excludes the record from list/read/update', async () => {
          await request('DELETE', `/${contactId}`);
          const stored = await tx.contact.findUniqueOrThrow({ where: { id: contactId } });
          assert.ok(stored.deletedAt instanceof Date);
          assert.equal((await request('GET', `/${contactId}`, undefined, 404)).code, 'CONTACT_NOT_FOUND');
          await request('PUT', `/${contactId}`, { name: 'Deleted' }, 404);
          const followUp = await request('PATCH', `/${contactId}/follow-up`, { nextFollowUpAt: payload.nextFollowUpAt }, 404);
          assert.equal(followUp.code, 'CONTACT_NOT_FOUND');
          const list = await request('GET', '');
          assert.equal(list.meta.total, 1);
          assert.ok(list.data.every(contact => contact.id !== contactId));
        });
      } finally {
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      }
      throw rollback;
    }, { maxWait: 10000, timeout: 75000 });
  } catch (error) {
    if (error !== rollback) throw error;
  } finally {
    delete global.__prisma;
    await db.$disconnect();
  }
});
