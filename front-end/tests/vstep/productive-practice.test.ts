import fs from 'fs';
import catalogRaw from '@/data/vstep/vstep-catalog-index.json';
import registryRaw from '@/data/vstep/vstep-source-registry.json';
import inventoryRaw from '@/data/vstep/discovery/vstep-source-inventory.json';
import candidatesRaw from '@/data/vstep/discovery/vstep-source-candidates.json';
import {
  loadRawVstepExam,
  loadVstepExamSafe,
  resolveExamFilePath,
} from '@/lib/vstep-test-loader';
import type { VstepExamCatalogItem } from '@/lib/vstep-types';
import { TestRunner, expect } from './test-harness';

interface SourceRegistry {
  sources: Array<{
    id: string;
    sourceType: 'official' | 'practice_site' | 'public_drive' | 'recalled' | 'community';
    trustScore: number;
    seedUrls: string[];
  }>;
}

interface SourceInventory {
  totalResources: number;
  resources: Array<{
    id: string;
    sourceId: string;
    kind: 'drive' | 'pdf' | 'audio' | 'document' | 'community' | 'vstep_page';
    url: string;
    trustScore: number;
  }>;
}

interface SourceCandidates {
  totalCandidates: number;
  candidates: Array<{
    sourceId: string;
    kind: 'drive' | 'pdf' | 'audio' | 'document' | 'community' | 'vstep_page';
    url: string;
    provenance: 'official' | 'practice' | 'recalled' | 'public_drive' | 'community';
    skill: 'listening' | 'reading' | 'writing' | 'speaking' | 'full_mock' | 'unknown';
    priority: number;
    confidence: number;
    reviewAction: 'eligible_for_public_probe' | 'metadata_only' | 'manual_review';
  }>;
}

const catalog = catalogRaw as { items: VstepExamCatalogItem[]; totalExams: number; totalPracticeSets: number };
const registry = registryRaw as SourceRegistry;
const inventory = inventoryRaw as SourceInventory;
const candidates = candidatesRaw as SourceCandidates;

export async function runProductivePracticeTests(runner: TestRunner): Promise<void> {
  await runner.describe('VSTEP Productive Skills & Open Source Discovery', async () => {
    const writingItems = catalog.items.filter((item) => item.category === 'writing');
    const speakingItems = catalog.items.filter((item) => item.category === 'speaking');

    await runner.it('PROD-1: Catalog exposes 26 Writing and 26 Speaking practice sets', () => {
      expect(writingItems.length).toBe(26);
      expect(speakingItems.length).toBe(26);
      expect(catalog.items.length).toBe(244);
      expect(catalog.totalExams).toBe(26);
      expect(catalog.totalPracticeSets).toBe(218);
    });

    await runner.it('PROD-2: All 52 productive practice IDs resolve to files on disk', () => {
      for (const item of [...writingItems, ...speakingItems]) {
        const filePath = resolveExamFilePath(item.id);
        expect(Boolean(filePath)).toBeTruthy();
        expect(filePath ? fs.existsSync(filePath) : false).toBeTruthy();
      }
    });

    await runner.it('PROD-3: Writing practice contains one 60-minute section with exactly 2 tasks', () => {
      for (const item of writingItems) {
        const exam = loadRawVstepExam(item.id);
        expect(Boolean(exam)).toBeTruthy();
        expect(exam?.sections.length).toBe(1);
        expect(exam?.sections[0]?.type).toBe('writing');
        expect(exam?.sections[0]?.timeLimit).toBe(60);
        expect(exam?.sections[0]?.tasks.length).toBe(2);
      }
    });

    await runner.it('PROD-4: Speaking practice contains one 12-minute section with exactly 3 parts', () => {
      for (const item of speakingItems) {
        const exam = loadRawVstepExam(item.id);
        expect(Boolean(exam)).toBeTruthy();
        expect(exam?.sections.length).toBe(1);
        expect(exam?.sections[0]?.type).toBe('speaking');
        expect(exam?.sections[0]?.timeLimit).toBe(12);
        expect(exam?.sections[0]?.tasks.length).toBe(3);
      }
    });

    await runner.it('PROD-5: Raw productive tasks retain review suggestions while safe client payload strips them', () => {
      for (const id of ['vstep-writing-01', 'vstep-speaking-01', 'vstep-writing-vnu-01', 'vstep-speaking-vnu-01']) {
        const raw = loadRawVstepExam(id);
        const safe = loadVstepExamSafe(id);
        expect(Boolean(raw)).toBeTruthy();
        expect(Boolean(safe)).toBeTruthy();
        expect(raw?.sections[0]?.tasks.some((task) => Boolean(task.suggestion))).toBeTruthy();
        expect(safe?.sections[0]?.tasks.some((task) => Boolean(task.suggestion))).toBeFalsy();
      }
    });

    await runner.it('SRC-1: Source registry contains official, practice, recalled, community and public-drive channels', () => {
      expect(registry.sources.length >= 10).toBeTruthy();
      expect(registry.sources.filter((source) => source.sourceType === 'official').length >= 3).toBeTruthy();
      expect(registry.sources.some((source) => source.sourceType === 'practice_site')).toBeTruthy();
      expect(registry.sources.some((source) => source.sourceType === 'recalled')).toBeTruthy();
      expect(registry.sources.some((source) => source.sourceType === 'community')).toBeTruthy();
      expect(registry.sources.some((source) => source.sourceType === 'public_drive')).toBeTruthy();
    });

    await runner.it('SRC-2: Registry IDs and seed URLs are unique, HTTPS and trust-scored', () => {
      const ids = new Set<string>();
      const urls = new Set<string>();
      for (const source of registry.sources) {
        expect(ids.has(source.id)).toBeFalsy();
        ids.add(source.id);
        expect(source.trustScore >= 0 && source.trustScore <= 100).toBeTruthy();
        for (const url of source.seedUrls) {
          expect(url.startsWith('https://')).toBeTruthy();
          expect(urls.has(url)).toBeFalsy();
          urls.add(url);
        }
      }
    });

    await runner.it('SRC-3: Discovery inventory is non-empty and every URL is deduplicated', () => {
      expect(inventory.totalResources > 0).toBeTruthy();
      expect(inventory.resources.length).toBe(inventory.totalResources);
      expect(new Set(inventory.resources.map((resource) => resource.url)).size).toBe(inventory.resources.length);
    });

    await runner.it('SRC-4: Every discovered resource maps back to a registered source', () => {
      const sourceIds = new Set(registry.sources.map((source) => source.id));
      for (const resource of inventory.resources) {
        expect(sourceIds.has(resource.sourceId)).toBeTruthy();
        expect(resource.url.startsWith('http://') || resource.url.startsWith('https://')).toBeTruthy();
      }
    });

    await runner.it('SRC-5: Inventory preserves at least one official resource and the public Drive seed', () => {
      const officialIds = new Set(
        registry.sources.filter((source) => source.sourceType === 'official').map((source) => source.id)
      );
      expect(inventory.resources.some((resource) => officialIds.has(resource.sourceId))).toBeTruthy();
      expect(inventory.resources.some((resource) => resource.kind === 'drive')).toBeTruthy();
    });

    await runner.it('SRC-6: Candidate queue excludes auth/IELTS noise and preserves source provenance', () => {
      expect(candidates.totalCandidates > 0).toBeTruthy();
      expect(candidates.candidates.length).toBe(candidates.totalCandidates);
      expect(candidates.candidates.some((candidate) => candidate.provenance === 'official')).toBeTruthy();
      expect(candidates.candidates.some((candidate) => candidate.provenance === 'recalled')).toBeTruthy();
      expect(candidates.candidates.some((candidate) => candidate.provenance === 'public_drive')).toBeTruthy();
      expect(candidates.candidates.some((candidate) => candidate.provenance === 'community')).toBeTruthy();
      for (const candidate of candidates.candidates) {
        expect(candidate.url.includes('/authentication/')).toBeFalsy();
        expect(candidate.url.toLowerCase().includes('ieltstestlibrary')).toBeFalsy();
        expect(candidate.priority >= 0 && candidate.priority <= 100).toBeTruthy();
        expect(candidate.confidence >= 0 && candidate.confidence <= 100).toBeTruthy();
      }
    });

    await runner.it('SRC-7: Ace detail/task pages are classified by skill and eligible for public probe', () => {
      const aceDetails = candidates.candidates.filter((candidate) =>
        candidate.url.includes('aceofenglish.com/vsteptestlibrary/skills/') && candidate.url.includes('/test?')
      );
      const aceWritingTasks = candidates.candidates.filter(
        (candidate) => candidate.sourceId === 'aceofenglish-free' && candidate.skill === 'writing'
      );
      expect(aceDetails.length >= 100).toBeTruthy();
      expect(aceDetails.some((candidate) => candidate.skill === 'speaking')).toBeTruthy();
      expect(aceDetails.every((candidate) => candidate.reviewAction === 'eligible_for_public_probe')).toBeTruthy();
      expect(aceWritingTasks.length >= 20).toBeTruthy();
      expect(aceWritingTasks.every((candidate) => candidate.reviewAction === 'eligible_for_public_probe')).toBeTruthy();
    });
  });
}

if (require.main === module) {
  const runner = new TestRunner();
  runProductivePracticeTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\nVSTEP productive/source suite: ${stats.passed}/${stats.total} passed`);
    process.exit(stats.failed === 0 ? 0 : 1);
  });
}
