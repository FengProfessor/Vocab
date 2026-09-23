import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

type SourceType = 'official' | 'practice_site' | 'public_drive' | 'recalled' | 'community';
type ResourceKind = 'drive' | 'pdf' | 'audio' | 'document' | 'community' | 'vstep_page';
type VstepSkill = 'listening' | 'reading' | 'writing' | 'speaking' | 'full_mock' | 'unknown';
type Provenance = 'official' | 'practice' | 'recalled' | 'public_drive' | 'community';
type ReviewAction = 'eligible_for_public_probe' | 'metadata_only' | 'manual_review';

interface SourceSeed {
  id: string;
  name: string;
  sourceType: SourceType;
  trustScore: number;
  seedUrls: string[];
}

interface SourceRegistry {
  version: string;
  sources: SourceSeed[];
}

interface DiscoveredResource {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  trustScore: number;
  kind: ResourceKind;
  url: string;
  title: string;
  discoveredFrom: string;
}

interface SourceInventory {
  version: string;
  resources: DiscoveredResource[];
}

interface SourceCandidate extends DiscoveredResource {
  candidateId: string;
  skill: VstepSkill;
  provenance: Provenance;
  priority: number;
  confidence: number;
  school?: string;
  examDateLabel?: string;
  reviewAction: ReviewAction;
  reasons: string[];
}

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(ROOT, 'src', 'data', 'vstep', 'vstep-source-registry.json');
const INVENTORY_PATH = path.join(ROOT, 'src', 'data', 'vstep', 'discovery', 'vstep-source-inventory.json');
const APPLY = process.argv.includes('--apply');
const SCHOOL_CODES = ['CTU', 'HANU', 'HCMUE', 'HUFLIS', 'HUST', 'IUH', 'PHENIKAA', 'SGU', 'UEF', 'UEH', 'UFM', 'VLU'];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function candidateId(url: string): string {
  return `vstep-src-${crypto.createHash('sha256').update(url).digest('hex').slice(0, 16)}`;
}

function detectSkill(resource: DiscoveredResource): VstepSkill {
  const haystack = `${resource.url} ${resource.title}`.toLowerCase();
  for (const skill of ['listening', 'reading', 'writing', 'speaking'] as const) {
    if (haystack.includes(skill)) return skill;
  }
  if (/full[-_ ]?test|full[-_ ]?mock|thi-thu|de-thi|sample-test/.test(haystack)) return 'full_mock';
  return 'unknown';
}

function detectSchool(title: string): string | undefined {
  const upper = title.toUpperCase();
  return SCHOOL_CODES.find((school) => upper.includes(school));
}

function detectExamDateLabel(title: string): string | undefined {
  const match = title.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/);
  return match?.[0];
}

function isRecalled(resource: DiscoveredResource): boolean {
  if (resource.sourceType === 'recalled') return true;
  const title = normalizeText(resource.title);
  const hasRecallLanguage = /\bde thi that\b|\breview de\b|\breview thuc te\b|\btich duc\b/.test(title);
  const hasSchoolAndDate = Boolean(detectSchool(resource.title) && detectExamDateLabel(resource.title));
  return hasRecallLanguage || hasSchoolAndDate;
}

function detectProvenance(resource: DiscoveredResource): Provenance {
  if (resource.sourceType === 'official') return 'official';
  if (resource.kind === 'drive' || resource.sourceType === 'public_drive') return 'public_drive';
  if (resource.kind === 'community' || resource.sourceType === 'community') return 'community';
  if (isRecalled(resource)) return 'recalled';
  return 'practice';
}

function isHighValuePracticeUrl(resource: DiscoveredResource): boolean {
  const parsed = new URL(resource.url);
  const pathAndQuery = `${parsed.pathname}${parsed.search}`.toLowerCase();
  if (/authentication|\/login|\/register|ieltstestlibrary/.test(pathAndQuery)) return false;
  if (/\/vsteptestlibrary\/skills\/(listening|reading|writing|speaking)\/test(?:\?|$)/.test(pathAndQuery)) return true;
  return /vstep|sample-test|thi-thu|de-thi/.test(pathAndQuery);
}

function makeCandidate(resource: DiscoveredResource): SourceCandidate | null {
  const provenance = detectProvenance(resource);
  const reasons: string[] = [];
  const skill = detectSkill(resource);

  if (resource.kind === 'vstep_page' && provenance === 'practice' && !isHighValuePracticeUrl(resource)) return null;

  let priority = resource.trustScore;
  let confidence = Math.min(100, resource.trustScore);
  let reviewAction: ReviewAction = 'manual_review';

  if (provenance === 'official') {
    priority = Math.max(priority, 95);
    confidence = Math.max(confidence, 95);
    reviewAction = resource.kind === 'vstep_page' ? 'eligible_for_public_probe' : 'metadata_only';
    reasons.push('Nguồn chính thức');
  } else if (provenance === 'recalled') {
    priority = Math.max(priority, 82);
    confidence = Math.max(confidence, detectSchool(resource.title) ? 80 : 65);
    reviewAction = 'eligible_for_public_probe';
    reasons.push('Có dấu hiệu đề nhớ lại/review thực tế');
  } else if (provenance === 'practice') {
    priority = Math.max(priority, 68);
    reviewAction = 'eligible_for_public_probe';
    reasons.push('Trang luyện VSTEP công khai');
  } else if (provenance === 'public_drive') {
    priority = Math.min(priority, 55);
    reviewAction = 'metadata_only';
    reasons.push('Google Drive/Docs công khai, cần kiểm tra nguồn gốc trước khi ingest');
  } else {
    priority = Math.min(priority, 50);
    reviewAction = 'metadata_only';
    reasons.push('Cộng đồng công khai, chỉ lập chỉ mục metadata');
  }

  if (/\/vsteptestlibrary\/skills\/(listening|reading|writing|speaking)\/test(?:\?|$)/i.test(resource.url)) {
    priority = Math.min(100, priority + 8);
    confidence = Math.min(100, confidence + 8);
    reasons.push('Trang đề chi tiết theo kỹ năng');
  }

  const school = detectSchool(resource.title);
  const examDateLabel = detectExamDateLabel(resource.title);
  if (school) reasons.push(`Nhận diện điểm thi ${school}`);
  if (examDateLabel) reasons.push(`Có ngày thi ${examDateLabel}`);

  return {
    ...resource,
    candidateId: candidateId(resource.url),
    skill,
    provenance,
    priority,
    confidence,
    school,
    examDateLabel,
    reviewAction,
    reasons,
  };
}

function countBy<T extends string>(items: SourceCandidate[], pick: (item: SourceCandidate) => T): Record<T, number> {
  return items.reduce((acc, item) => {
    const key = pick(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<T, number>);
}

function main(): void {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8')) as SourceRegistry;
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf8')) as SourceInventory;
  const sourceIds = new Set(registry.sources.map((source) => source.id));

  const candidates = inventory.resources
    .filter((resource) => sourceIds.has(resource.sourceId))
    .map(makeCandidate)
    .filter((candidate): candidate is SourceCandidate => candidate !== null)
    .sort((a, b) => b.priority - a.priority || b.confidence - a.confidence || a.url.localeCompare(b.url));

  const output = {
    version: registry.version,
    generatedFromInventoryVersion: inventory.version,
    totalCandidates: candidates.length,
    byProvenance: countBy(candidates, (candidate) => candidate.provenance),
    bySkill: countBy(candidates, (candidate) => candidate.skill),
    byReviewAction: countBy(candidates, (candidate) => candidate.reviewAction),
    candidates,
  };

  const outputPath = APPLY
    ? path.join(ROOT, 'src', 'data', 'vstep', 'discovery', 'vstep-source-candidates.json')
    : path.join(ROOT, 'tmp', 'vstep-source-candidates.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`[VSTEP Candidates] ${candidates.length} candidates -> ${outputPath}`);
  console.log(`[VSTEP Candidates] provenance=${JSON.stringify(output.byProvenance)} skill=${JSON.stringify(output.bySkill)}`);
}

main();
