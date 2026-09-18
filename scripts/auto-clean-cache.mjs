import fs from 'node:fs';
import path from 'node:path';

const MAX_CACHE_BYTES = 1024 * 1024 * 1024; // 1 GB threshold

function getDirectorySize(dirPath) {
  let size = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          size += getDirectorySize(fullPath);
        } else if (entry.isFile()) {
          const stats = fs.statSync(fullPath);
          size += stats.size;
        }
      } catch {
        // Ignore unreadable or locked entries
      }
    }
  } catch {
    // Directory doesn't exist or not readable
  }
  return size;
}

const isForce = process.argv.includes('--force');
const nextDir = path.resolve('.next');

if (fs.existsSync(nextDir)) {
  const sizeBytes = getDirectorySize(nextDir);
  const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);

  if (isForce || sizeBytes > MAX_CACHE_BYTES) {
    console.log(
      isForce
        ? `🧹 [Cache Clean] Đang dọn sạch .next (${sizeMB} MB)...`
        : `⚠️ [Cache Alert] Thư mục .next đã đạt ${sizeMB} MB (> 1 GB threshold). Tự động dọn rác để tránh V8 GC thrashing...`
    );
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
      console.log('✅ [Cache Clean] Đã dọn sạch .next thành công! Cache được làm mới hoàn toàn.');
    } catch (err) {
      console.warn('⚠️ [Cache Clean] Không thể xóa một số file .next (có thể do server đang chạy):', err.message);
    }
  } else {
    console.log(`⚡ [Cache Check] Thư mục .next: ${sizeMB} MB (dưới 1 GB, khởi động dev ngay)`);
  }
} else {
  console.log('⚡ [Cache Check] Chưa có .next, khởi động dev mới');
}
