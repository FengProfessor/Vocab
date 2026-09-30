import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../scripts/package.json', import.meta.url));
const connectionString = process.env.P2C_POSTGRES_TEST_URL;
if (!connectionString) {
  if (process.env.CI) throw new Error('CI requires isolated PostgreSQL session tests');
  console.log('[P2C] Provider session SQL tests DEFERRED to isolated clean CI');
  process.exit(0);
}
const { Client } = require('pg');
const url = new URL(connectionString);
assert(['127.0.0.1', 'localhost'].includes(url.hostname) && url.pathname === '/p2c_session_test',
  'SQL tests must only use the dedicated loopback test database');
const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
const migration = readFileSync(new URL('../../supabase/migrations/20261001_app_auth_session_active.sql', import.meta.url), 'utf8');
const user = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const session = '33333333-3333-4333-8333-333333333333';
try {
  await client.connect();
  await client.query('BEGIN');
  // Fail if schema already exists; never drop an existing database/schema as setup.
  await client.query(`CREATE SCHEMA auth;
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email_confirmed_at timestamptz, banned_until timestamptz);
    CREATE TABLE auth.sessions (id uuid PRIMARY KEY, user_id uuid REFERENCES auth.users(id), not_after timestamptz);`);
  await client.query(migration);
  await client.query(migration); // CREATE OR REPLACE + grants is rerunnable.
  await client.query('INSERT INTO auth.users VALUES ($1, now(), NULL)', [user]);
  await client.query('INSERT INTO auth.sessions VALUES ($1, $2, NULL)', [session, user]);
  const active = async (sessionId = session, userId = user) => (await client.query(
    'SELECT public.is_app_auth_session_active($1::uuid, $2::uuid) AS active', [sessionId, userId],
  )).rows[0].active;
  assert.equal(await active(), true);
  assert.equal(await active(session, other), false);
  assert.equal(await active(other), false);
  await client.query("UPDATE auth.sessions SET not_after = now() - interval '1 second'");
  assert.equal(await active(), false);
  await client.query('UPDATE auth.sessions SET not_after = NULL');
  await client.query("UPDATE auth.users SET banned_until = now() + interval '1 hour'");
  assert.equal(await active(), false);
  await client.query('UPDATE auth.users SET banned_until = NULL, email_confirmed_at = NULL');
  assert.equal(await active(), false);
  await client.query('UPDATE auth.users SET email_confirmed_at = now()');
  for (const [role, expected] of [['anon', false], ['authenticated', false], ['service_role', true]]) {
    const result = await client.query(
      "SELECT has_function_privilege($1, 'public.is_app_auth_session_active(uuid,uuid)', 'EXECUTE') AS allowed", [role],
    );
    assert.equal(result.rows[0].allowed, expected);
  }
  await client.query('SET LOCAL ROLE service_role');
  assert.equal(await active(), true);
  await client.query('RESET ROLE');
  await client.query('DELETE FROM auth.sessions');
  assert.equal(await active(), false);
  console.log('[P2C] Provider session expiry/revoke/banned/unverified/identity/grants/rerun SQL tests PASS');
} finally {
  await client.query('ROLLBACK').catch(() => {});
  await client.end();
}
