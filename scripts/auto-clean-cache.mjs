import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import ts from 'typescript';

const MAX_CACHE_BYTES = 750 * 1024 * 1024; // 750 MB threshold
const MAX_TSBUILDINFO_BYTES = 40 * 1024 * 1024; // 40 MB threshold

/**
 * Automatically detects and terminates orphaned/hung background processes on Windows
 * (e.g., leaked Puppeteer headless Chrome instances or hung one-off tsx/pdf scripts)
 * without touching active dev servers, MCP servers, or IDE processes.
 */
function autoReapZombieProcesses() {
  if (process.platform !== 'win32') return;

  try {
    const psScript = `
      $now = Get-Date
      $killed = 0
      Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe' OR Name = 'node.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
        $cmd = $_.CommandLine
        $created = $_.CreationDate
        if (-not $cmd -or -not $created) { return }
        $ageMin = ($now - $created).TotalMinutes

        # 1. Orphaned Puppeteer headless Chrome older than 10 minutes
        if ($_.Name -eq 'chrome.exe' -and $cmd -match 'puppeteer_dev_chrome_profile' -and $ageMin -gt 10) {
          Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
          $killed++
        }
        # 2. Hung one-off tsx -e inline eval or PDF export scripts older than 15 minutes
        elseif ($_.Name -eq 'node.exe' -and ($cmd -match 'tsx.*\\s-e\\s' -or $cmd -match 'export-vnu-bac3.*\\.mjs') -and $ageMin -gt 15) {
          Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
          $killed++
        }
      }
      if ($killed -gt 0) { Write-Output $killed }
    `;
    const out = execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/\r?\n/g, '; ')}"`,
      { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();

    if (out && Number(out) > 0) {
      console.log(`🛡️ [Auto-Heal] Đã tự động dọn ${out} tiến trình zombie (Puppeteer Chrome / script treo) giải phóng CPU & RAM.`);
    }
  } catch {
    // Non-fatal: ignore if PowerShell/WMI is busy
  }
}

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

function cleanTsBuildInfo(force = false) {
  const tsBuildInfoPath = path.resolve('tsconfig.tsbuildinfo');
  if (!fs.existsSync(tsBuildInfoPath)) return;
  try {
    const stats = fs.statSync(tsBuildInfoPath);
    if (force || stats.size > MAX_TSBUILDINFO_BYTES) {
      fs.rmSync(tsBuildInfoPath, { force: true });
      console.log('🧹 [Auto-Heal] Đã làm mới tsconfig.tsbuildinfo để giảm tải RAM cho TypeScript Language Server.');
    }
  } catch {
    // Ignore locked tsbuildinfo
  }
}

const isForce = process.argv.includes('--force');
const nextDir = path.resolve('.next');

// Step 1: Reap any hung background scripts or leaked headless Chrome processes
autoReapZombieProcesses();

if (fs.existsSync(nextDir)) {
  // Step 2: Always remove .next/standalone before dev if present (next dev never uses it, and it bloats watchers)
  const standaloneDir = path.join(nextDir, 'standalone');
  if (!isForce && fs.existsSync(standaloneDir)) {
    const standaloneMB = (getDirectorySize(standaloneDir) / (1024 * 1024)).toFixed(1);
    try {
      fs.rmSync(standaloneDir, { recursive: true, force: true });
      console.log(`🧹 [Auto-Heal] Đã tự động xóa .next/standalone (${standaloneMB} MB) thừa để giải phóng File Watcher & ổ đĩa.`);
    } catch {
      // Ignore if locked
    }
  }

  const sizeBytes = getDirectorySize(nextDir);
  const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
  const hasCorruptTypes = hasCorruptGeneratedTypes(nextDir);

  if (isForce || hasCorruptTypes || sizeBytes > MAX_CACHE_BYTES) {
    console.log(
      isForce
        ? `🧹 [Cache Clean] Đang dọn sạch .next (${sizeMB} MB)...`
        : hasCorruptTypes
        ? `⚠️ [Cache Alert] Phát hiện .next/dev/types bị lỗi cú pháp. Đang dọn cache (${sizeMB} MB)...`
        : `⚠️ [Cache Alert] Thư mục .next đã đạt ${sizeMB} MB (> 750 MB threshold). Tự động dọn rác để tránh V8 GC thrashing...`
    );
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
      cleanTsBuildInfo(true);
      console.log('✅ [Cache Clean] Đã dọn sạch .next thành công! Cache được làm mới hoàn toàn.');
    } catch (err) {
      console.warn('⚠️ [Cache Clean] Không thể xóa một số file .next (có thể do server đang chạy):', err.message);
    }
  } else {
    cleanTsBuildInfo(false);
    console.log(`⚡ [Cache Check] Thư mục .next: ${sizeMB} MB (dưới 750 MB, khởi động dev ngay)`);
  }
} else {
  cleanTsBuildInfo(false);
  console.log('⚡ [Cache Check] Chưa có .next, khởi động dev mới');
}
