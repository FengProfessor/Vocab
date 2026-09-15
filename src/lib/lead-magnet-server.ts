import fs from 'fs';
import path from 'path';

/**
 * Resolves the master lead magnet markdown file across various execution contexts
 * (Local Next.js dev, Production Next.js standalone container, Hetzner server).
 */
export function getLeadMagnetFilePath(): string | null {
  const candidatePaths = [
    path.join(process.cwd(), 'public', 'downloads', 'sat-thu-toeic-listening-lead-magnet.md'),
    path.join(process.cwd(), 'public', 'lead-magnet', 'sat-thu-toeic-listening-lead-magnet.md'),
    path.join(process.cwd(), 'docs', 'sat-thu-toeic-listening-lead-magnet.md'),
    path.join(process.cwd(), 'web-app', 'docs', 'sat-thu-toeic-listening-lead-magnet.md'),
    path.resolve(__dirname, '../../../../docs/sat-thu-toeic-listening-lead-magnet.md'),
    path.resolve(__dirname, '../../../../public/downloads/sat-thu-toeic-listening-lead-magnet.md'),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

let _cachedContent: string | null = null;

export function getLeadMagnetContent(): string {
  if (_cachedContent) return _cachedContent;
  const filePath = getLeadMagnetFilePath();
  if (!filePath) {
    throw new Error('Lead magnet markdown file could not be located in any known path.');
  }
  _cachedContent = fs.readFileSync(filePath, 'utf8');
  return _cachedContent;
}

export function getLeadMagnetBuffer(): Buffer {
  const filePath = getLeadMagnetFilePath();
  if (!filePath) {
    throw new Error('Lead magnet markdown file could not be located in any known path.');
  }
  return fs.readFileSync(filePath);
}
