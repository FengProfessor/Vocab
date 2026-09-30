/** Read-only metadata preflight. Never selects credential or user rows. */
import pg from 'pg';

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) throw new Error('Auth schema preflight: missing database configuration');
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: true },
  connectionTimeoutMillis: 15000,
  statement_timeout: 10000,
});
try {
  await client.connect();
  await client.query('BEGIN READ ONLY');
  const { rows } = await client.query(`
    SELECT table_schema, table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'auth' AND
      ((table_name = 'sessions' AND column_name IN ('id', 'user_id', 'not_after')) OR
       (table_name = 'users' AND column_name IN ('id', 'email_confirmed_at', 'banned_until')))
    ORDER BY table_name, column_name
  `);
  const expected = ['sessions.id', 'sessions.user_id', 'sessions.not_after',
    'users.id', 'users.email_confirmed_at', 'users.banned_until'];
  if (expected.some(name => !rows.some(row => `${row.table_name}.${row.column_name}` === name))) {
    throw new Error('Auth schema preflight: expected schema unavailable');
  }
  console.log('[AuthSchema] Metadata:', JSON.stringify(rows));
  await client.query('ROLLBACK');
  console.log('[AuthSchema] Read-only preflight PASS; no user/session rows selected');
} catch {
  console.error('[AuthSchema] Read-only preflight FAIL; details suppressed');
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
