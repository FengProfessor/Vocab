/**
 * Bổ sung lỗi phổ biến có nguồn rõ ràng từ docs/grammar-research/02-common-mistakes.md.
 *
 * Surgical + idempotent:
 * - Chỉ append sections.mistakes chưa có, dedupe theo cặp wrong/right.
 * - Không xóa mistakes cũ; không đổi examples/exercises/progress/order/schema.
 * - Cập nhật cả scripts/grammar-gen/out/<slug>.json và grammar_lessons.sections.
 *
 * Chạy (trong web-app/):
 *   npx tsx scripts/grammar-gen/update-mistakes.ts --dry
 *   npx tsx scripts/grammar-gen/update-mistakes.ts --apply
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

interface Mistake {
  wrong: string;
  right: string;
  why: string;
  [key: string]: unknown;
}

interface ExistingMistake {
  wrong: string;
  right: string;
  [key: string]: unknown;
}

interface LessonFile {
  sections?: Record<string, unknown> & {
    mistakes?: unknown;
  };
  [key: string]: unknown;
}

interface TopicRow {
  id: string;
}

interface LessonRow {
  id: string;
  sections: unknown;
}

const LOG = '[GrammarMistakes]';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');
const DRY = !process.argv.includes('--apply');

// Nội dung được giới hạn ở các lỗi nêu trực tiếp trong 02-common-mistakes.md.
const SOURCED_MISTAKES: Readonly<Record<string, readonly Mistake[]>> = {
  'present-simple': [
    {
      wrong: 'She have a dog.',
      right: 'She has a dog.',
      why: 'Với chủ ngữ ngôi thứ ba số ít, động từ have đổi thành has.',
    },
    {
      wrong: 'He not like sushi.',
      right: 'He does not like sushi.',
      why: 'Câu phủ định hiện tại đơn với He/She/It cần does not + động từ nguyên thể.',
    },
  ],
  'present-continuous': [
    {
      wrong: 'I am wanting something to eat.',
      right: 'I want something to eat.',
      why: 'Want là động từ trạng thái nên thông thường không dùng ở thì tiếp diễn.',
    },
    {
      wrong: 'I going to the convenience store.',
      right: 'I am going to the convenience store.',
      why: 'Hiện tại tiếp diễn luôn cần am/is/are trước động từ V-ing.',
    },
  ],
  'present-perfect': [
    {
      wrong: 'Long ago dinosaurs have lived here.',
      right: 'Long ago dinosaurs lived here.',
      why: 'Sự kiện lịch sử đã kết thúc dùng quá khứ đơn, không dùng hiện tại hoàn thành.',
    },
    {
      wrong: 'Who has invented the telephone?',
      right: 'Who invented the telephone?',
      why: 'Hỏi về một phát minh thuộc lịch sử đã hoàn tất dùng quá khứ đơn.',
    },
  ],
  'past-simple': [
    {
      wrong: 'She buyed a new dress.',
      right: 'She bought a new dress.',
      why: 'Buy là động từ bất quy tắc; dạng quá khứ là bought, không phải buyed.',
    },
    {
      wrong: 'He teached English.',
      right: 'He taught English.',
      why: 'Teach là động từ bất quy tắc; dạng quá khứ là taught, không phải teached.',
    },
  ],
  articles: [
    {
      wrong: 'I bought apple.',
      right: 'I bought an apple.',
      why: 'Danh từ đếm được số ít apple cần mạo từ; dùng an trước âm nguyên âm.',
    },
    {
      wrong: 'Sun is bright today.',
      right: 'The sun is bright today.',
      why: 'Dùng the với sự vật duy nhất và đã được xác định như the sun.',
    },
  ],
  'countable-uncountable': [
    {
      wrong: 'She gave me many advices.',
      right: 'She gave me a lot of advice.',
      why: 'Advice là danh từ không đếm được, không thêm -s và không đi trực tiếp với many.',
    },
    {
      wrong: 'He bought two furnitures.',
      right: 'He bought two pieces of furniture.',
      why: 'Furniture là danh từ không đếm được; dùng đơn vị pieces of để đếm.',
    },
  ],
  'prepositions-time': [
    {
      wrong: 'I was born at 2001.',
      right: 'I was born in 2001.',
      why: 'Dùng in với năm.',
    },
    {
      wrong: 'We will meet in Friday.',
      right: 'We will meet on Friday.',
      why: 'Dùng on với ngày trong tuần.',
    },
  ],
  'comparatives-superlatives': [
    {
      wrong: 'The most shops accept credit cards.',
      right: 'Most shops accept credit cards.',
      why: 'Most không có the khi mang nghĩa phần lớn hoặc đa số nói chung.',
    },
  ],
  'modals-ability': [
    {
      wrong: 'She can sings.',
      right: 'She can sing.',
      why: 'Sau động từ khuyết thiếu can, động từ chính giữ nguyên thể không to.',
    },
  ],
  'modals-obligation': [
    {
      wrong: 'You must to study hard.',
      right: 'You must study hard.',
      why: 'Sau động từ khuyết thiếu must, dùng động từ nguyên thể không to.',
    },
  ],
  'second-conditional': [
    {
      wrong: 'It would be perfect if there are sockets for our phone chargers.',
      right: 'It would be perfect if there were sockets for our phone chargers.',
      why: 'Điều kiện giả định ở hiện tại dùng quá khứ đơn trong mệnh đề if.',
    },
  ],
  'passive-voice': [
    {
      wrong: 'Many accidents cause by careless driving.',
      right: 'Many accidents are caused by careless driving.',
      why: 'Câu bị động cần dạng phù hợp của be + quá khứ phân từ.',
    },
  ],
  'relative-clauses': [
    {
      wrong: 'Everything what they said was true.',
      right: 'Everything that they said was true.',
      why: 'Sau everything dùng that hoặc lược bỏ đại từ quan hệ, không dùng what.',
    },
    {
      wrong: 'The man I was sitting next to him was friendly.',
      right: 'The man I was sitting next to was friendly.',
      why: 'Không lặp lại đại từ tân ngữ him trong mệnh đề quan hệ.',
    },
  ],
  'reported-speech': [
    {
      wrong: 'She asked us what were we doing?',
      right: 'She asked us what we were doing.',
      why: 'Câu hỏi gián tiếp dùng trật tự câu kể: chủ ngữ đứng trước động từ.',
    },
  ],
  'gerunds-infinitives': [
    {
      wrong: 'I enjoy to play soccer.',
      right: 'I enjoy playing soccer.',
      why: 'Enjoy đi với V-ing, không đi với to + động từ.',
    },
    {
      wrong: 'We spent the whole day to prepare for the party.',
      right: 'We spent the whole day preparing for the party.',
      why: 'Cấu trúc spend time đi với V-ing.',
    },
  ],
};

function loadEnv(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) {
    throw new Error(`Không tìm thấy ${envPath}`);
  }

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]]) continue;

    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isExistingMistake(value: unknown): value is ExistingMistake {
  return (
    isRecord(value) &&
    typeof value.wrong === 'string' &&
    typeof value.right === 'string'
  );
}

function readMistakes(value: unknown, context: string): ExistingMistake[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`${context}: sections.mistakes không phải mảng`);

  const invalidIndex = value.findIndex((item) => !isExistingMistake(item));
  if (invalidIndex >= 0) {
    throw new Error(`${context}: mistake cũ tại index ${invalidIndex} thiếu wrong/right`);
  }
  return value;
}

function normalizePairPart(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('en');
}

function pairKey(mistake: Pick<ExistingMistake, 'wrong' | 'right'>): string {
  return `${normalizePairPart(mistake.wrong)}\u0000${normalizePairPart(mistake.right)}`;
}

function mergeMistakes(existing: readonly ExistingMistake[], additions: readonly Mistake[]): {
  merged: ExistingMistake[];
  added: number;
} {
  const keys = new Set(existing.map(pairKey));
  const merged = [...existing];
  let added = 0;

  for (const mistake of additions) {
    const key = pairKey(mistake);
    if (keys.has(key)) continue;
    keys.add(key);
    merged.push({ ...mistake });
    added++;
  }

  return { merged, added };
}

function parseLessonFile(filePath: string): LessonFile {
  const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
  if (!isRecord(parsed)) throw new Error(`${filePath}: JSON gốc không phải object`);
  return parsed as LessonFile;
}

function parseSections(value: unknown, context: string): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (!isRecord(value)) throw new Error(`${context}: sections không phải object`);
  return value;
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

async function main(): Promise<void> {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local');
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  let filesChanged = 0;
  let fileMistakesAdded = 0;
  let lessonsChanged = 0;
  let dbMistakesAdded = 0;
  let unchangedTargets = 0;

  console.log(`${LOG} mode=${DRY ? 'dry-run' : 'production'} targets=${Object.keys(SOURCED_MISTAKES).length}`);

  for (const [slug, additions] of Object.entries(SOURCED_MISTAKES)) {
    const filePath = path.join(OUT, `${slug}.json`);
    if (!existsSync(filePath)) throw new Error(`${slug}: thiếu ${filePath}`);

    const lessonFile = parseLessonFile(filePath);
    const fileSections = parseSections(lessonFile.sections, `${slug} out`);
    const fileExisting = readMistakes(fileSections.mistakes, `${slug} out`);
    const fileMerge = mergeMistakes(fileExisting, additions);

    if (fileMerge.added > 0) {
      const nextSections = { ...fileSections, mistakes: fileMerge.merged };
      const nextFile: LessonFile = { ...lessonFile, sections: nextSections };
      if (!DRY) writeFileSync(filePath, `${JSON.stringify(nextFile, null, 2)}\n`, 'utf8');
      filesChanged++;
      fileMistakesAdded += fileMerge.added;
    }

    const { data: topicData, error: topicError } = await supabase
      .from('grammar_topics')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (topicError) throw new Error(`${slug}: đọc topic thất bại: ${topicError.message}`);
    const topic = topicData as TopicRow | null;
    if (!topic) throw new Error(`${slug}: không tìm thấy grammar_topic`);

    const { data: lessonData, error: lessonsError } = await supabase
      .from('grammar_lessons')
      .select('id, sections')
      .eq('topic_id', topic.id);
    if (lessonsError) throw new Error(`${slug}: đọc lessons thất bại: ${lessonsError.message}`);
    const lessons = (lessonData ?? []) as LessonRow[];
    if (lessons.length === 0) throw new Error(`${slug}: không có grammar_lesson`);

    let slugDbAdded = 0;
    for (const lesson of lessons) {
      const sections = parseSections(lesson.sections, `${slug} DB lesson ${lesson.id}`);
      const existing = readMistakes(sections.mistakes, `${slug} DB lesson ${lesson.id}`);
      const merged = mergeMistakes(existing, additions);
      if (merged.added === 0) continue;

      const nextSections = { ...sections, mistakes: merged.merged };
      if (stableJson({ ...sections, mistakes: undefined }) !== stableJson({ ...nextSections, mistakes: undefined })) {
        throw new Error(`${slug}: guard phát hiện thay đổi ngoài sections.mistakes`);
      }

      if (!DRY) {
        const { error: updateError } = await supabase
          .from('grammar_lessons')
          .update({ sections: nextSections })
          .eq('id', lesson.id);
        if (updateError) throw new Error(`${slug}: cập nhật lesson ${lesson.id} thất bại: ${updateError.message}`);
      }

      lessonsChanged++;
      dbMistakesAdded += merged.added;
      slugDbAdded += merged.added;
    }

    if (fileMerge.added === 0 && slugDbAdded === 0) unchangedTargets++;
    console.log(
      `${LOG} ${slug}: out +${fileMerge.added}; db +${slugDbAdded} (${lessons.length} lesson)`,
    );
  }

  console.log(
    `${LOG} summary mode=${DRY ? 'dry-run' : 'production'} ` +
      `files_changed=${filesChanged} out_added=${fileMistakesAdded} ` +
      `lessons_changed=${lessonsChanged} db_added=${dbMistakesAdded} ` +
      `unchanged_targets=${unchangedTargets}`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`${LOG} FATAL: ${message}`);
  process.exitCode = 1;
});
