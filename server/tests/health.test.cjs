const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');

// Exercise the real HTTP stack without contacting or changing a database.
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'fatal';
process.env.DATABASE_URL = 'postgresql://health-test:unused@127.0.0.1:1/unused';
let probe = async () => [{ '?column?': 1 }];
let probeCount = 0;
const prismaPath = require.resolve('../dist/src/lib/prisma');
require.cache[prismaPath] = {
  id: prismaPath,
  filename: prismaPath,
  loaded: true,
  exports: { prisma: { $queryRaw: (query) => {
    assert.deepEqual([...query], ['SELECT 1']);
    probeCount++;
    return probe();
  } } },
};

const { app } = require('../dist/src/app');
const { getReadiness } = require('../dist/src/modules/health/health.service');

test('public health and readiness checks', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/v1/health`;
  try {
    await t.test('liveness stays independent of the database and disables caching', async () => {
      const response = await fetch(base);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.equal((await response.json()).data.status, 'ok');
      assert.equal(probeCount, 0);
    });

    await t.test('readiness verifies the database without authentication', async () => {
      const response = await fetch(`${base}/ready`);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const body = await response.json();
      assert.equal(body.success, true);
      assert.equal(body.data.status, 'ok');
      assert.equal(probeCount, 1);
    });

    await t.test('database failures return a retryable 503 and can recover', async () => {
      probe = async () => { throw new Error('Private database connection details'); };
      const response = await fetch(`${base}/ready`);
      assert.equal(response.status, 503);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await response.json(), {
        success: false,
        error: 'The server is not ready yet',
        code: 'SERVER_NOT_READY',
      });
      probe = async () => [];
      assert.equal((await fetch(`${base}/ready`)).status, 200);
    });

    await t.test('concurrent visitors share one pending database probe', async () => {
      let finish;
      probe = () => new Promise((resolve) => { finish = resolve; });
      const before = probeCount;
      const first = getReadiness();
      const second = getReadiness();
      assert.equal(probeCount, before + 1);
      finish([]);
      assert.equal((await first).status, 'ok');
      assert.equal((await second).status, 'ok');
    });

    await t.test('a hung database check returns 503 after ten seconds', async (context) => {
      context.mock.timers.enable({ apis: ['setTimeout'] });
      let finish;
      probe = () => new Promise((resolve) => { finish = resolve; });
      const pending = assert.rejects(getReadiness(), {
        statusCode: 503,
        code: 'SERVER_NOT_READY',
      });
      context.mock.timers.tick(10_000);
      await pending;
      finish([]);
      await Promise.resolve();
      context.mock.timers.reset();
      probe = async () => [];
      assert.equal((await getReadiness()).status, 'ok');
    });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
