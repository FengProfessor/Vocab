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
let stage = 'connect';
try {
  await client.connect();
  stage = 'read-only transaction';
  await client.query('BEGIN READ ONLY');
  stage = 'schema metadata';
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
} catch (error) {
  const code = typeof error?.code === 'string' ? error.code : '';
  const category = ['SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    'CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'ERR_TLS_CERT_ALTNAME_INVALID'].includes(code)
    ? 'TLS verification' : ['28P01', '28000'].includes(code) ? 'database authorization'
      : code === '42501' ? 'metadata permission' : stage;
  console.error(`[AuthSchema] Read-only preflight FAIL at ${category}; details suppressed`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
