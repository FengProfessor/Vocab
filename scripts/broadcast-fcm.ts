/**
 * Broadcast FCM push tới mọi user có token (fcm_tokens + profiles.fcm_token).
 *
 * Usage:
 *   npx tsx scripts/broadcast-fcm.ts --dry-run
 *   npx tsx scripts/broadcast-fcm.ts --title "..." --body "..." [--url /student]
 */
import * as fs from 'fs';
import * as path from 'path';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

const DEAD_TOKEN_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
];

function loadEnvFile(filePath: string, opts?: { overwrite?: boolean }): void {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.replace(/\r$/, '').trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Một số file export dính literal \r\n ở cuối giá trị
    if (key !== 'FIREBASE_PRIVATE_KEY') {
      value = value.replace(/\\r\\n$/g, '').replace(/\\n$/g, '').replace(/[\r\n]+$/g, '').trim();
    }
    if (opts?.overwrite || !process.env[key] || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv: string[]): {
  dryRun: boolean;
  title: string;
  body: string;
  url: string;
} {
  let dryRun = false;
  let title = 'Ôn tập cùng LingoPro';
  let body = 'Vài phút ôn từ hôm nay — giữ streak và không quên từ nhé!';
  let url = '/student';

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') dryRun = true;
    else if (a === '--title' && argv[i + 1]) title = argv[++i];
    else if (a === '--body' && argv[i + 1]) body = argv[++i];
    else if (a === '--url' && argv[i + 1]) url = argv[++i];
  }
  return { dryRun, title, body, url };
}

async function main(): Promise<void> {
  const root = path.resolve(__dirname, '..');
  // local trước (Supabase + projectId sạch), rồi admin cert từ file diag
  loadEnvFile(path.join(root, '.env.local'));
  loadEnvFile(path.join(root, '.env.vercel-check'));
  loadEnvFile(path.join(root, '.env.fcm-diag2'));

  const { dryRun, title, body, url } = parseArgs(process.argv.slice(2));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const projectId = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '')
    .replace(/\\r\\n/g, '')
    .replace(/\\n/g, '')
    .replace(/[\r\n]/g, '')
    .trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '')
    .replace(/\\r\\n/g, '')
    .replace(/[\r\n]/g, '')
    .trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!supabaseUrl || !serviceKey) {
    console.error('[Broadcast] Missing Supabase env');
    process.exit(1);
  }
  if (!projectId || !clientEmail || !privateKey) {
    console.error('[Broadcast] Missing Firebase Admin env (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY)');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Gom token UNIQUE toàn cục — cùng token 2 user (đổi tài khoản 1 máy) chỉ gửi 1 lần.
  const allTokens = new Set<string>();
  const tokenOwner = new Map<string, string>(); // token -> user_id (last-wins log)

  const { data: tokenRows, error: tokErr } = await supabase
    .from('fcm_tokens')
    .select('user_id, token, last_used_at')
    .order('last_used_at', { ascending: true });
  if (tokErr) {
    console.error('[Broadcast] fcm_tokens error:', tokErr.message);
    process.exit(1);
  }
  for (const row of tokenRows ?? []) {
    if (!row.user_id || !row.token) continue;
    if (allTokens.has(row.token) && tokenOwner.get(row.token) !== row.user_id) {
      console.warn(
        `[Broadcast] shared token ${row.token.slice(0, 12)}… users ${tokenOwner.get(row.token)?.slice(0, 8)} + ${row.user_id.slice(0, 8)} → gửi 1 lần`
      );
    }
    allTokens.add(row.token);
    tokenOwner.set(row.token, row.user_id);
  }

  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, fcm_token')
    .not('fcm_token', 'is', null);
  if (profErr) {
    console.error('[Broadcast] profiles error:', profErr.message);
    process.exit(1);
  }
  for (const p of profiles ?? []) {
    if (!p.id || !p.fcm_token) continue;
    if (allTokens.has(p.fcm_token) && tokenOwner.get(p.fcm_token) !== p.id) {
      console.warn(
        `[Broadcast] legacy shared ${p.fcm_token.slice(0, 12)}… skip duplicate owner ${p.id.slice(0, 8)}`
      );
    }
    allTokens.add(p.fcm_token);
    tokenOwner.set(p.fcm_token, p.id);
  }

  const owners = new Set(tokenOwner.values());
  console.log('[Broadcast] Unique devices (tokens):', allTokens.size);
  console.log('[Broadcast] Distinct owners:', owners.size);
  console.log('[Broadcast] Title:', title);
  console.log('[Broadcast] Body:', body);
  console.log('[Broadcast] URL:', url);
  console.log('[Broadcast] Dry-run:', dryRun);

  if (allTokens.size === 0) {
    console.log('[Broadcast] Không có token. Dừng.');
    return;
  }

  if (dryRun) {
    console.log('[Broadcast] Dry-run xong — chưa gửi.');
    return;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  const link = `https://lingopro.online${url.startsWith('/') ? url : `/${url}`}`;
  let tokensOk = 0;
  let tokensFail = 0;
  const deadTokens: string[] = [];
  const tokenArr = Array.from(allTokens);

  // Chunk 500 (giới hạn sendEachForMulticast)
  for (let i = 0; i < tokenArr.length; i += 500) {
    const chunk = tokenArr.slice(i, i + 500);
    try {
      const resp = await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        data: { url: link },
        webpush: {
          fcmOptions: { link },
          notification: {
            icon: '/icons/icon-192.webp',
            badge: '/icons/icon-192.webp',
          },
        },
      });

      tokensOk += resp.successCount;
      tokensFail += resp.failureCount;

      resp.responses.forEach((r, idx) => {
        if (!r.success) {
          const code = (r.error as { code?: string } | undefined)?.code || '';
          const msg = (r.error as { message?: string } | undefined)?.message || '';
          console.warn(
            `[Broadcast] fail token=${chunk[idx].slice(0, 12)}… code=${code} msg=${msg}`
          );
          if (DEAD_TOKEN_CODES.includes(code)) deadTokens.push(chunk[idx]);
        } else {
          const owner = tokenOwner.get(chunk[idx]);
          console.log(`[Broadcast] ok token=${chunk[idx].slice(0, 12)}… owner=${owner?.slice(0, 8) ?? '?'}`);
        }
      });
    } catch (err: unknown) {
      tokensFail += chunk.length;
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Broadcast] chunk error:', msg);
    }
  }

  // Dọn token chết
  if (deadTokens.length) {
    const uniqueDead = [...new Set(deadTokens)];
    const { error: delErr } = await supabase.from('fcm_tokens').delete().in('token', uniqueDead);
    if (delErr) console.warn('[Broadcast] clear fcm_tokens failed:', delErr.message);
    else console.log(`[Broadcast] Cleared ${uniqueDead.length} dead token(s) from fcm_tokens`);

    for (const t of uniqueDead) {
      await supabase.from('profiles').update({ fcm_token: null }).eq('fcm_token', t);
    }
  }

  console.log('[Broadcast] DONE');
  console.log(`  tokens ok/fail: ${tokensOk}/${tokensFail}`);
  console.log(`  dead tokens cleaned: ${deadTokens.length}`);
}

main().catch((err) => {
  console.error('[Broadcast] Fatal:', err);
  process.exit(1);
});
