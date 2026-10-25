/**
 * Checkpoint — lưu tiến độ scrape ra JSON để resume khi crash/dừng giữa chừng.
 * File đặt trong scripts/scrapers/.checkpoints/ (đã gitignore).
 */
import fs from 'fs';
import path from 'path';

export interface Checkpoint {
  source: string;
  list: string;
  done: string[];
  failed: string[];
  updatedAt: string;
}

function checkpointPath(source: string, list: string): string {
  const dir = path.resolve(process.cwd(), 'scripts/scrapers/.checkpoints');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${source}__${list}.checkpoint.json`);
}

export function loadCheckpoint(source: string, list: string): Checkpoint {
  const p = checkpointPath(source, list);
  if (fs.existsSync(p)) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf-8')) as Checkpoint;
    } catch {
      console.warn('[Checkpoint] File hỏng, tạo mới:', p);
    }
  }
  return { source, list, done: [], failed: [], updatedAt: new Date().toISOString() };
}

export function saveCheckpoint(cp: Checkpoint): void {
  cp.updatedAt = new Date().toISOString();
  fs.writeFileSync(checkpointPath(cp.source, cp.list), JSON.stringify(cp, null, 2), 'utf-8');
}
