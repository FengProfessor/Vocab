import fs from 'fs';
import path from 'path';
import type {
  VstepExam,
  VstepExamCatalogItem,
  VstepSkillType,
} from '../src/lib/vstep-types';

type ProductiveSkill = Extract<VstepSkillType, 'writing' | 'speaking'>;

interface CatalogSource {
  id: string;
  name: string;
  descriptionVi: string;
  badge: string;
  totalItems: number;
}

interface CatalogFile {
  version: string;
  totalExams: number;
  totalPracticeSets: number;
  categories: Array<{
    id: string;
    titleVi: string;
    descriptionVi: string;
    badge: string;
  }>;
  sources: CatalogSource[];
  items: VstepExamCatalogItem[];
}

const ROOT = process.cwd();
const TESTS_DIR = path.join(ROOT, 'src', 'data', 'vstep', 'tests');
const PRACTICE_DIR = path.join(ROOT, 'src', 'data', 'vstep', 'practice');
const CATALOG_PATH = path.join(ROOT, 'src', 'data', 'vstep', 'vstep-catalog-index.json');
const APPLY = process.argv.includes('--apply');
const PRODUCTIVE_SKILLS: ProductiveSkill[] = ['writing', 'speaking'];

function sourceExamPath(item: VstepExamCatalogItem): string {
  const owlMatch = item.id.match(/^vstep-mock-(\d{1,3})$/);
  if (owlMatch) {
    return path.join(TESTS_DIR, `vstep-exam-${owlMatch[1].padStart(2, '0')}.json`);
  }

  const vnuMatch = item.id.match(/^vstep-exam-vnu-(\d{1,3})$/);
  if (vnuMatch) {
    return path.join(TESTS_DIR, `vstep-exam-vnu-${vnuMatch[1].padStart(2, '0')}.json`);
  }

  throw new Error(`Unsupported full-mock ID: ${item.id}`);
}

function practiceId(item: VstepExamCatalogItem, skill: ProductiveSkill): string {
  const owlMatch = item.id.match(/^vstep-mock-(\d{1,3})$/);
  if (owlMatch) return `vstep-${skill}-${owlMatch[1].padStart(2, '0')}`;

  const vnuMatch = item.id.match(/^vstep-exam-vnu-(\d{1,3})$/);
  if (vnuMatch) return `vstep-${skill}-vnu-${vnuMatch[1].padStart(2, '0')}`;

  throw new Error(`Unsupported full-mock ID: ${item.id}`);
}

function skillLabel(skill: ProductiveSkill): string {
  return skill === 'writing' ? 'Writing' : 'Speaking';
}

function buildPracticeExam(
  parent: VstepExamCatalogItem,
  sourceExam: VstepExam,
  skill: ProductiveSkill
): { exam: VstepExam; catalogItem: VstepExamCatalogItem } {
  const section = sourceExam.sections.find((candidate) => candidate.type === skill);
  if (!section) throw new Error(`${sourceExam.id} is missing ${skill} section`);

  const id = practiceId(parent, skill);
  const label = skillLabel(skill);
  const exam: VstepExam = {
    id,
    title: `${label} Practice — ${parent.title}`,
    duration: section.timeLimit,
    category: skill,
    targetLevel: parent.targetLevel,
    sections: [JSON.parse(JSON.stringify(section))],
  };

  const catalogItem: VstepExamCatalogItem = {
    id,
    title: exam.title,
    titleVi:
      skill === 'writing'
        ? `Luyện Viết VSTEP Task 1–2 — ${parent.titleVi || parent.title}`
        : `Luyện Nói VSTEP Part 1–3 — ${parent.titleVi || parent.title}`,
    duration: section.timeLimit,
    skills: [skill],
    targetLevel: parent.targetLevel,
    cefrLevel: parent.cefrLevel || parent.targetLevel,
    totalQuestions: 0,
    questionsCount: 0,
    totalTasks: section.tasks.length,
    badge: skill === 'writing' ? 'Writing Task 1–2' : 'Speaking Part 1–3',
    description:
      skill === 'writing'
        ? 'Luyện riêng 2 task Writing: thư/email tối thiểu 120 từ và essay tối thiểu 250 từ, kèm hướng dẫn sau khi làm.'
        : 'Luyện riêng 3 phần Speaking: Social Interaction, Solution Discussion và Topic Development theo thời gian chuẩn.',
    category: skill,
    skill,
    source: parent.source,
    isPopular: parent.isPopular,
  };

  return { exam, catalogItem };
}

function main(): void {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')) as CatalogFile;
  const fullMocks = catalog.items.filter((item) => item.category === 'full_mock');
  const generated: Array<{ exam: VstepExam; catalogItem: VstepExamCatalogItem }> = [];

  for (const item of fullMocks) {
    const examPath = sourceExamPath(item);
    const sourceExam = JSON.parse(fs.readFileSync(examPath, 'utf8')) as VstepExam;
    for (const skill of PRODUCTIVE_SKILLS) {
      generated.push(buildPracticeExam(item, sourceExam, skill));
    }
  }

  const generatedIds = new Set(generated.map(({ catalogItem }) => catalogItem.id));
  const retainedItems = catalog.items.filter((item) => !generatedIds.has(item.id));
  const items = [...retainedItems, ...generated.map(({ catalogItem }) => catalogItem)];
  const fullMockCount = items.filter((item) => item.category === 'full_mock').length;

  const sourceCounts = new Map<string, number>();
  for (const item of items) {
    const source = item.source || 'vstepowl';
    sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
  }

  const nextCatalog: CatalogFile = {
    ...catalog,
    version: '2026-09-23',
    totalExams: fullMockCount,
    totalPracticeSets: items.length - fullMockCount,
    sources: catalog.sources.map((source) => ({
      ...source,
      totalItems: sourceCounts.get(source.id) || 0,
    })),
    items,
  };

  console.log(`[VSTEP] Productive practice generated: ${generated.length}`);
  console.log(`[VSTEP] Catalog: ${items.length} items = ${fullMockCount} full mocks + ${items.length - fullMockCount} practice sets`);

  if (!APPLY) {
    console.log('[VSTEP] Dry-run only. Use --apply to write files.');
    return;
  }

  fs.mkdirSync(PRACTICE_DIR, { recursive: true });
  for (const { exam } of generated) {
    fs.writeFileSync(
      path.join(PRACTICE_DIR, `${exam.id}.json`),
      `${JSON.stringify(exam, null, 2)}\n`,
      'utf8'
    );
  }
  fs.writeFileSync(CATALOG_PATH, `${JSON.stringify(nextCatalog, null, 2)}\n`, 'utf8');
  console.log('[VSTEP] Productive practice files and catalog updated.');
}

main();
