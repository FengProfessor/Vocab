import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const MAX_CACHE_BYTES = 1024 * 1024 * 1024; // 1 GB threshold

function hasCorruptGeneratedTypes(nextDir) {
  const generatedTypeFiles = [
    path.join(nextDir, 'dev', 'types', 'routes.d.ts'),
    path.join(nextDir, 'dev', 'types', 'validator.ts'),
  ];

  for (const filePath of generatedTypeFiles) {
    if (!fs.existsSync(filePath)) continue;

    try {
      const sourceText = fs.readFileSync(filePath, 'utf8');
      const sourceFile = ts.createSourceFile(
        filePath,
        sourceText,
        ts.ScriptTarget.Latest,
        false,
        ts.ScriptKind.TS
      );

      if (sourceFile.parseDiagnostics.length > 0) {
        return true;
      }
    } catch {
      return true;
    }
  }

  return false;
}

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
  const hasCorruptTypes = hasCorruptGeneratedTypes(nextDir);

  if (isForce || hasCorruptTypes || sizeBytes > MAX_CACHE_BYTES) {
    console.log(
      isForce
        ? `🧹 [Cache Clean] Đang dọn sạch .next (${sizeMB} MB)...`
        : hasCorruptTypes
        ? `⚠️ [Cache Alert] Phát hiện .next/dev/types bị lỗi cú pháp. Đang dọn cache (${sizeMB} MB)...`
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
