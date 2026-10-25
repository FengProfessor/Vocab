/**
 * [RecheckDead] Verify lại 303 link "chết" Antigravity claim, dùng GET đầy đủ.
 * Antigravity dùng HEAD/GET-1KB với 4s timeout → false positive cao
 * (servers như stockcake/publicdomainpictures block HEAD nhưng cho GET).
 *
 * Logic:
 *  - Đọc marks từ tmp-image-review.html
 *  - Lấy danh sách BAD claim
 *  - Re-check bằng GET đầy đủ, timeout 10s, User-Agent browser
 *  - Phân loại:
 *      ALIVE  → revert mark về 'unreviewed' (xóa BAD)
 *      DEAD   → giữ BAD
 *  - Update lại file HTML
 *
 * Output: tmp-recheck-dead-result.json + cập nhật marks trong HTML
 */
import fs from 'fs';
import path from 'path';

const HTML_FILE = path.resolve(process.cwd(), 'tmp-image-review.html');
const LOG = '[RecheckDead]';

interface Item {
  w: string;
  u: string;
  s: string;
  p: string;
  d: string;
  i: string;
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
};

async function recheckAlive(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { ...HEADERS, Range: 'bytes=0-2048', Referer: new URL(url).origin },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    if (res.status === 200 || res.status === 206) {
      const ct = res.headers.get('content-type') || '';
      // Chấp nhận image hoặc CDN trả binary (octet-stream)
      return ct.startsWith('image/') || ct === 'application/octet-stream' || ct === '';
    }
    return false;
  } catch {
    return false;
  }
}

async function main() {
  if (!fs.existsSync(HTML_FILE)) {
    console.error(`${LOG} không tìm thấy ${HTML_FILE}`);
    process.exit(1);
  }
  const html = fs.readFileSync(HTML_FILE, 'utf-8');

  // Trích xuất ITEMS
  const m1 = html.match(/const ITEMS = (\[[\s\S]*?\]);/);
  if (!m1) {
    console.error(`${LOG} không tìm thấy ITEMS`);
    process.exit(1);
  }
  const items: Item[] = JSON.parse(m1[1]);

  // Trích xuất marks (Antigravity format dùng template literal `...`)
  const m2 = html.match(/let marks = JSON\.parse\(localStorage\.getItem\(LS_KEY\) \|\| `([\s\S]*?)`\);/);
  if (!m2) {
    console.error(`${LOG} không tìm thấy marks (Antigravity chưa chạy?)`);
    process.exit(1);
  }
  const marks: Record<string, 'ok' | 'bad' | 'meh'> = JSON.parse(m2[1]);

  const badItems = items.filter((it) => marks[it.w] === 'bad');
  console.log(`${LOG} sẽ re-check ${badItems.length} link BAD bằng GET đầy đủ\n`);

  const result: { alive: string[]; dead: string[]; revived: Array<{ word: string; url: string }> } = {
    alive: [],
    dead: [],
    revived: [],
  };

  const CONCURRENCY = 20;
  const queue = [...badItems];
  let done = 0;

  async function worker() {
    while (queue.length > 0) {
      const it = queue.shift();
      if (!it) break;
      const alive = await recheckAlive(it.u);
      done++;
      if (alive) {
        result.alive.push(it.w);
        result.revived.push({ word: it.w, url: it.u });
      } else {
        result.dead.push(it.w);
      }
      if (done % 25 === 0 || done === badItems.length) {
        console.log(`${LOG} progress ${done}/${badItems.length} | alive=${result.alive.length} dead=${result.dead.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  console.log(`\n${LOG} =========== TỔNG KẾT ===========`);
  console.log(`${LOG} ALIVE (Antigravity sai BAD): ${result.alive.length} ← sẽ revert về 'ok'`);
  console.log(`${LOG} DEAD (thực sự chết):         ${result.dead.length} ← giữ BAD`);

  // Update marks: alive → 'ok' (revert), dead → giữ 'bad'
  for (const w of result.alive) {
    marks[w] = 'ok';
  }

  // Lưu kết quả
  fs.writeFileSync(
    path.resolve(process.cwd(), 'tmp-recheck-dead-result.json'),
    JSON.stringify(result, null, 2),
    'utf-8'
  );

  // Update HTML
  const marksStr = JSON.stringify(marks, null, 2);
  const newHtml = html.replace(
    /let marks = JSON\.parse\(localStorage\.getItem\(LS_KEY\) \|\| `([\s\S]*?)`\);/,
    `let marks = JSON.parse(localStorage.getItem(LS_KEY) || \`${marksStr.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);`
  );
  fs.writeFileSync(HTML_FILE, newHtml, 'utf-8');

  console.log(`\n${LOG} đã update marks trong ${HTML_FILE}`);
  console.log(`${LOG} chi tiết: tmp-recheck-dead-result.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
