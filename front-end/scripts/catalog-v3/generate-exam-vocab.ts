/**
 * Sinh manifest luyện thi deterministic từ corpus nội bộ đã kiểm duyệt.
 * Taxonomy TOEIC/IELTS được nghiên cứu bằng NLM/Gemini; nội dung chỉ lấy từ pro3m nội bộ.
 *
 * Chạy (web-app/): npx tsx scripts/catalog-v3/generate-exam-vocab.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
const PRO3M_FILE = 'src/data/vocab/pro3m.json';
const OUT_FILE = path.join(ROOT, 'src/data/vocab/exam-vocab.json');
const TARGET_SUBTOPIC_SIZE = 60;

interface LessonInfo { words?: string[] }
type VocabJson = Record<string, LessonInfo>;

interface TopicDef {
  sourcePackage: 'exam-toeic' | 'exam-ielts';
  routeId: 'toeic' | 'ielts';
  topicKey: string;
  title: string;
  sourceNames: string[];
}

const TOPICS: TopicDef[] = [
  {
    sourcePackage: 'exam-toeic', routeId: 'toeic', topicKey: 'work-employment', title: 'Công việc & tuyển dụng',
    sourceNames: ['Topic 4: Jobs and Employment', 'Topic 12: Work', 'Theme 5: Job and Employment', 'Employment - Jobs'],
  },
  {
    sourcePackage: 'exam-toeic', routeId: 'toeic', topicKey: 'business-finance', title: 'Kinh doanh & tài chính',
    sourceNames: ['Topic 13: Bussiness', 'Topic 18: Success And Failure', 'Efficiency - Competence', 'Topic 14: Money'],
  },
  {
    sourcePackage: 'exam-toeic', routeId: 'toeic', topicKey: 'communication-office', title: 'Giao tiếp công sở',
    sourceNames: ['Topic 10: The Mass Media', 'Topic 21: Agreeing and Disagreeing', 'Arguments - Disagreements - Disputes', 'Communication - Contact - Information'],
  },
  {
    sourcePackage: 'exam-toeic', routeId: 'toeic', topicKey: 'travel-service', title: 'Du lịch & dịch vụ',
    sourceNames: ['Topic 11: Travel and Holidays', 'Travel - Transport', 'Topic 15: Travel'],
  },
  {
    sourcePackage: 'exam-toeic', routeId: 'toeic', topicKey: 'people-leadership', title: 'Nhân sự & lãnh đạo',
    sourceNames: ['Topic 16: Character and Behavior', 'Ambition and Determination', 'Authority - Power'],
  },
  {
    sourcePackage: 'exam-ielts', routeId: 'ielts', topicKey: 'education', title: 'Education',
    sourceNames: ['Topic 1: Education', 'Topic 26: Study', 'Unit 7: Further Education', 'Unit 8: New Ways To Learn', 'Unit 10: Lifelong Learning'],
  },
  {
    sourcePackage: 'exam-ielts', routeId: 'ielts', topicKey: 'environment', title: 'Environment & Climate',
    sourceNames: ['Topic 2: Enviroment and Climate Change', 'Theme 2: Enviroment', 'Unit 6: Endangered Species', 'Unit 6: Global Warning', 'Unit 9: Preserving The Enviroment', 'Topic 24: Consevation'],
  },
  {
    sourcePackage: 'exam-ielts', routeId: 'ielts', topicKey: 'technology', title: 'Science & Technology',
    sourceNames: ['Theme 4: Science and Technology', 'Unit 5: Inventions', 'Unit 7: Artificial Intelligence'],
  },
  {
    sourcePackage: 'exam-ielts', routeId: 'ielts', topicKey: 'health', title: 'Health & Medicine',
    sourceNames: ['Topic 5: Health and Diseases', 'Theme 6: Health And Lifestyle', 'Topic 11: Health And Sickness', 'Unit 10: Healthy Life Styles And Longevity'],
  },
  {
    sourcePackage: 'exam-ielts', routeId: 'ielts', topicKey: 'society-culture', title: 'Society & Culture',
    sourceNames: ['Topic 8: Family and Relationships', 'Theme 7: Cultural Diversity', 'Theme 11: Socical Issues', 'Unit 6: Gender Equality', 'Unit 5: Cultural Identity', 'Unit 7: Cultural Diversity'],
  },
  {
    sourcePackage: 'exam-ielts', routeId: 'ielts', topicKey: 'media-entertainment', title: 'Media & Entertainment',
    sourceNames: ['Topic 10: The Mass Media', 'Theme 9: Entertainment and Media', 'Topic 8: Films And Books', 'Topic 9: Music'],
  },
  {
    sourcePackage: 'exam-ielts', routeId: 'ielts', topicKey: 'travel-urbanization', title: 'Travel & Urbanization',
    sourceNames: ['Topic 11: Travel and Holidays', 'Topic 3: Urbanization', 'Unit 2: Urbanization', 'Unit 9: Cities Of The Future'],
  },
  {
    sourcePackage: 'exam-ielts', routeId: 'ielts', topicKey: 'law-problems', title: 'Law & Social Problems',
    sourceNames: ['Topic 27: Law', 'Topic 25: Problems', 'Violence - Aggressiveness'],
  },
];

function normalizeWord(raw: string): string {
  return raw.normalize('NFC').trim().toLowerCase().replace(/\.+$/, '');
}

function splitBalanced(words: string[]): string[][] {
  const count = Math.max(1, Math.ceil(words.length / TARGET_SUBTOPIC_SIZE));
  const base = Math.floor(words.length / count);
  const larger = words.length % count;
  const chunks: string[][] = [];
  let start = 0;
  for (let index = 0; index < count; index++) {
    const size = base + (index < larger ? 1 : 0);
    chunks.push(words.slice(start, start + size));
    start += size;
  }
  return chunks;
}

const pro3m = JSON.parse(readFileSync(path.join(ROOT, PRO3M_FILE), 'utf8')) as VocabJson;
const subtopics = TOPICS.flatMap((topic) => {
  const missing = topic.sourceNames.filter((name) => !pro3m[name]);
  if (missing.length > 0) throw new Error(`Thiếu lesson nguồn cho ${topic.routeId}/${topic.topicKey}: ${missing.join(', ')}`);

  const words = [...new Set(topic.sourceNames.flatMap((name) => pro3m[name].words ?? []).map(normalizeWord).filter((word) => word.length > 1 && word.length < 80))];
  return splitBalanced(words).map((chunk, index, chunks) => ({
    sourcePackage: topic.sourcePackage,
    sourceKey: `${topic.routeId}-${topic.topicKey}-${index + 1}`,
    routeId: topic.routeId,
    topicKey: topic.topicKey,
    title: `${topic.title} ${index + 1}/${chunks.length}`,
    sourceNames: topic.sourceNames,
    attribution: 'LingoPro pro3m internal corpus; taxonomy luyện thi được biên soạn nội bộ.',
    words: chunk,
  }));
});

const bad = subtopics.filter((subtopic) => subtopic.words.length < 30 || subtopic.words.length > 90);
if (bad.length > 0) throw new Error(`Subtopic ngoài khoảng 30-90 từ: ${bad.map((x) => `${x.sourceKey}=${x.words.length}`).join(', ')}`);

const manifest = {
  schemaVersion: 2,
  identityPolicy: 'Append new source lessons/topics; do not reorder existing sourceNames after release.',
  sources: [{
    source: 'LingoPro pro3m internal corpus',
    sourceFile: PRO3M_FILE,
    sourceUrl: null,
    license: 'Internal use',
    attribution: 'Biên soạn nội bộ LingoPro.',
  }],
  generatedFrom: [PRO3M_FILE],
  subtopics,
};

writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`[exam-vocab] topics=${TOPICS.length} subtopics=${subtopics.length} words=${subtopics.reduce((sum, subtopic) => sum + subtopic.words.length, 0)}`);
