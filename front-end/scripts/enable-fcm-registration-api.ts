/**
 * Bật FCM Registration API cho project lingopro-9d2f8 (nếu chưa bật).
 * Chạy: npx tsx scripts/enable-fcm-registration-api.ts
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { google } from 'googleapis';

function loadEnvFile(name: string): Record<string, string> {
  const text = readFileSync(join(process.cwd(), name), 'utf8');
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val.replace(/\\n/g, '\n').replace(/\r/g, '').trim();
  }
  return out;
}

async function main(): Promise<void> {
  const env = loadEnvFile('.env.fcm-diag');
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey = env.FIREBASE_PRIVATE_KEY;
  const projectId = (env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'lingopro-9d2f8')
    .replace(/\\r/g, '').replace(/\\n/g, '').replace(/\r/g, '').trim();

  if (!clientEmail || !privateKey) {
    throw new Error('Thiếu FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY trong .env.fcm-diag');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  await auth.authorize();

  const serviceUsage = google.serviceusage({ version: 'v1', auth });
  const serviceName = `projects/${projectId}/services/fcmregistrations.googleapis.com`;

  const getRes = await serviceUsage.services.get({ name: serviceName });
  const state = getRes.data.state;
  console.log('[FCM-API] Current state:', state);

  if (state === 'ENABLED') {
    console.log('[FCM-API] ✅ Đã bật sẵn — không cần làm gì');
    return;
  }

  console.log('[FCM-API] Đang bật fcmregistrations.googleapis.com ...');
  const op = await serviceUsage.services.enable({ name: serviceName });
  console.log('[FCM-API] Enable op:', op.data.name, op.data.done ? 'done' : 'pending');

  const getRes2 = await serviceUsage.services.get({ name: serviceName });
  console.log('[FCM-API] State sau enable:', getRes2.data.state);
}

main().catch((err) => {
  console.error('[FCM-API] Error:', err?.response?.data ?? err);
  process.exit(1);
});