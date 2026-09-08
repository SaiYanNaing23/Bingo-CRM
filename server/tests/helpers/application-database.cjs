const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../../src/generated/prisma/client');

// A separate schema supports real concurrent transactions and rollback tests without
// modifying existing CRM records. Replaying every migration also tests fresh setup.
exports.createApplicationTestDatabase = async (connectionString) => {
  const schema = `applications_test_${randomUUID().replaceAll('-', '')}`;
  assert.match(schema, /^applications_test_[a-f0-9]{32}$/);
  // Neon transaction pooling rejects the search_path startup option. The direct
  // endpoint reaches the same database and supports a separate schema per test.
  const testUrl = new URL(connectionString);
  if (testUrl.hostname.endsWith('.neon.tech')) {
    testUrl.hostname = testUrl.hostname.replace(/-pooler(?=\.)/, '');
  }
  const config = { connectionString: testUrl.toString(), connectionTimeoutMillis: 10000, statement_timeout: 15000 };
  const admin = new Client(config);
  let db;
  const cleanup = async () => {
    try {
      if (db) await db.$disconnect();
      // Only the unique schema created by this test run can be dropped here.
      assert.match(schema, /^applications_test_[a-f0-9]{32}$/);
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await admin.end();
    }
  };

  await admin.connect();
  try {
    await admin.query('BEGIN');
    await admin.query(`CREATE SCHEMA "${schema}"`);
    await admin.query(`SET LOCAL search_path TO "${schema}", public`);
    const directory = path.resolve(__dirname, '../../prisma/migrations');
    const migrations = fs.readdirSync(directory, { withFileTypes: true })
      .filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
    for (const migration of migrations) {
      const sql = fs.readFileSync(path.join(directory, migration, 'migration.sql'), 'utf8')
        // The historic foundation migration explicitly scopes its metadata lookup.
        .replaceAll("table_schema = 'public'", `table_schema = '${schema}'`);
      await admin.query(sql);
    }
    await admin.query('COMMIT');
    db = new PrismaClient({ adapter: new PrismaPg({
      ...config, options: `-c search_path=${schema},public`,
    }, { schema }) });
    const current = await db.$queryRawUnsafe('SELECT current_schema() AS schema');
    assert.equal(current[0].schema, schema, 'Raw row-lock queries must use the isolated schema');
    return { db, cleanup, schema, migrations };
  } catch (error) {
    await admin.query('ROLLBACK');
    await cleanup();
    throw error;
  }
};
