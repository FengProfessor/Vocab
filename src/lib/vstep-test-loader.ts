/**
 * VSTEP Test Loader & Security Sanitizer
 * Dynamic Filesystem Loader with in-memory Map cache.
 * Quản lý nạp dữ liệu đề thi VSTEP và làm sạch thông tin nhạy cảm (Zero Bulk Leaks).
 */

import fs from 'fs';
import path from 'path';
import catalogIndexRaw from '@/data/vstep/vstep-catalog-index.json';
import {
  VstepExam,
  VstepSection,
  VstepTask,
  VstepQuestion,
  VstepSkillType,
  VstepExamCatalogItem,
  VstepPracticeOptions,
  VstepPracticeResponse,
} from './vstep-types';
import { VstepPracticeFilterMode } from './vstep-history';
import { generateVstepSessionToken } from './vstep-anti-scraping';

export interface VstepCatalogData {
  version: string;
  totalExams: number;
  totalPracticeSets: number;
  categories: Array<{
    id: string;
    titleVi: string;
    descriptionVi: string;
    badge: string;
  }>;
  items: VstepExamCatalogItem[];
}

/**
 * In-memory cache to avoid repeated disk reads.
 */
const examMemoryCache = new Map<string, VstepExam>();

/**
 * Global master question index for deterministic server-side grading of dynamic sets.
 * Keyed by canonical ID `${examId}:${q.id}` and raw `q.id`.
 */
const globalMasterVstepQuestionIndex = new Map<string, VstepQuestion>();

/**
 * Indexes questions from a raw exam into globalMasterVstepQuestionIndex.
 */
function indexExamQuestions(exam: VstepExam): void {
  if (!exam || !Array.isArray(exam.sections)) return;
  for (const section of exam.sections) {
    if (!Array.isArray(section.tasks)) continue;
    for (const task of section.tasks) {
      if (!Array.isArray(task.questions)) continue;
      for (const q of task.questions) {
        if (!q || !q.id) continue;
        const canonicalId = `${exam.id}:${q.id}`;
        globalMasterVstepQuestionIndex.set(canonicalId, q);
        if (!globalMasterVstepQuestionIndex.has(q.id)) {
          globalMasterVstepQuestionIndex.set(q.id, q);
        }
      }
    }
  }
}

export interface ExamRouteRule {
  regex: RegExp;
  min: number;
  max: number;
  targetDir: 'tests' | 'practice';
  filenamePrefix: string;
  alternatePrefix?: string;
}

export const EXAM_ROUTE_RULES: ExamRouteRule[] = [
  // 1. Existing VSTEP Owl Full Mocks (M1)
  {
    regex: /^vstep-(?:mock|exam)-(\d{1,3})$/,
    min: 1,
    max: 23,
    targetDir: 'tests',
    filenamePrefix: 'vstep-exam-',
    alternatePrefix: 'vstep-mock-',
  },
  // 2. Existing VSTEP Owl Listening Practice (M1)
  {
    regex: /^vstep-listening-(\d{1,3})$/,
    min: 1,
    max: 56,
    targetDir: 'practice',
    filenamePrefix: 'vstep-listening-',
  },
  // 3. Existing VSTEP Owl Reading Practice (M1)
  {
    regex: /^vstep-reading-(\d{1,3})$/,
    min: 1,
    max: 20,
    targetDir: 'practice',
    filenamePrefix: 'vstep-reading-',
  },
  // 4. OnThiVSTEP Reading Practice Sets (M2: 75 sets)
  {
    regex: /^vstep-reading-onthi-(\d{1,3})$/,
    min: 1,
    max: 100,
    targetDir: 'practice',
    filenamePrefix: 'vstep-reading-onthi-',
  },
  // 5. OnThiVSTEP Listening Practice Sets (M2)
  {
    regex: /^vstep-listening-onthi-(\d{1,3})$/,
    min: 1,
    max: 30,
    targetDir: 'practice',
    filenamePrefix: 'vstep-listening-onthi-',
  },
  // 6. OnThiVSTEP Mock Exams (M2)
  {
    regex: /^vstep-(?:mock|exam)-onthi-(\d{1,3})$/,
    min: 1,
    max: 20,
    targetDir: 'tests',
    filenamePrefix: 'vstep-exam-onthi-',
    alternatePrefix: 'vstep-mock-onthi-',
  },
  // 7. EnglishTestStore Reading Practice Tests (M2: 50 tests)
  {
    regex: /^vstep-reading-ets-(\d{1,3})$/,
    min: 1,
    max: 60,
    targetDir: 'practice',
    filenamePrefix: 'vstep-reading-ets-',
  },
  // 8. EnglishTestStore Listening Practice Tests (M2: 50 tests)
  {
    regex: /^vstep-listening-ets-(\d{1,3})$/,
    min: 1,
    max: 60,
    targetDir: 'practice',
    filenamePrefix: 'vstep-listening-ets-',
  },
  // 9. EnglishTestStore Full Mock Tests (M2: 50 tests)
  {
    regex: /^vstep-(?:mock|exam)-ets-(\d{1,3})$/,
    min: 1,
    max: 60,
    targetDir: 'tests',
    filenamePrefix: 'vstep-exam-ets-',
    alternatePrefix: 'vstep-mock-ets-',
  },
  // 10. VNU Official Sample Mock Exam (M2)
  {
    regex: /^vstep-(?:mock|exam)-vnu-(\d{1,3})$/,
    min: 1,
    max: 10,
    targetDir: 'tests',
    filenamePrefix: 'vstep-exam-vnu-',
    alternatePrefix: 'vstep-mock-vnu-',
  },
];

/**
 * Resolves the absolute filesystem path for an exam ID.
 * Implements 4-layer defense-in-depth:
 *  1. Input whitelist & fast-fail: string check, length <= 64, reject '..', slashes, '\0', '?', '#', '&', '%', etc.
 *  2. Anchored exact regex: table-driven EXAM_ROUTE_RULES with strict range clamping.
 *  3. Safe filename synthesis: filenamePrefix + numStr + .json.
 *     Never interpolates raw untrusted strings into filenames.
 *  4. Canonical directory containment: path.resolve(fullPath).startsWith(path.resolve(targetDir) + path.sep)
 *     Verifies file exists on disk via fs.existsSync before returning.
 */
export function resolveExamFilePath(testId: string): string | null {
  // Layer 1: Input Whitelist & Boundary Guard
  if (!testId || typeof testId !== 'string') {
    return null;
  }

  const trimmed = testId.trim();
  if (trimmed.length === 0 || trimmed.length > 64) {
    return null;
  }

  // Fast-fail on dangerous navigation, null bytes, query/fragment markers, or injection tokens
  if (
    trimmed.includes('..') ||
    trimmed.includes('/') ||
    trimmed.includes('\\') ||
    trimmed.includes('\0') ||
    trimmed.includes('?') ||
    trimmed.includes('#') ||
    trimmed.includes('&') ||
    trimmed.includes('%') ||
    trimmed.includes('<') ||
    trimmed.includes('>') ||
    trimmed.includes('$') ||
    trimmed.includes('{') ||
    trimmed.includes('}') ||
    /\s/.test(trimmed)
  ) {
    return null;
  }

  // Whitelist check: strictly alphanumeric and single hyphens/underscores
  if (!/^[a-z0-9_-]+$/i.test(trimmed)) {
    return null;
  }

  const normalized = trimmed.toLowerCase();
  const root = process.cwd();
  const testsDir = path.resolve(root, 'src', 'data', 'vstep', 'tests');
  const practiceDir = path.resolve(root, 'src', 'data', 'vstep', 'practice');

  // Layer 2: Anchored Exact Regex Matching & Range Clamping
  let matchedRule: ExamRouteRule | null = null;
  let parsedNumber = 0;

  for (const rule of EXAM_ROUTE_RULES) {
    const match = normalized.match(rule.regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= rule.min && num <= rule.max) {
        matchedRule = rule;
        parsedNumber = num;
        break;
      } else {
        return null;
      }
    }
  }

  if (!matchedRule) {
    return null;
  }

  const targetDir = matchedRule.targetDir === 'tests' ? testsDir : practiceDir;
  const numStr = String(parsedNumber).padStart(2, '0');

  // Layer 3: Safe filename synthesis
  const candidateFilenames: string[] = [
    `${matchedRule.filenamePrefix}${numStr}.json`,
  ];
  if (matchedRule.alternatePrefix) {
    candidateFilenames.push(`${matchedRule.alternatePrefix}${numStr}.json`);
  }

  // Layer 4: Canonical Directory Containment Enforcement
  const resolvedTargetDir = path.resolve(targetDir);
  const allowedPrefix = resolvedTargetDir.endsWith(path.sep)
    ? resolvedTargetDir
    : resolvedTargetDir + path.sep;

  for (const filename of candidateFilenames) {
    const fullPath = path.resolve(resolvedTargetDir, filename);

    const normFullPath = process.platform === 'win32' ? fullPath.toLowerCase() : fullPath;
    const normPrefix = process.platform === 'win32' ? allowedPrefix.toLowerCase() : allowedPrefix;
    if (!normFullPath.startsWith(normPrefix)) {
      continue;
    }

    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

/**
 * Lấy danh mục đề thi VSTEP
 */
export function getVstepCatalog(): VstepCatalogData {
  return catalogIndexRaw as unknown as VstepCatalogData;
}

/**
 * Alias theo chuẩn Universal Dynamic Loader Contract
 */
export function getVstepCatalogIndex(): VstepCatalogData {
  return getVstepCatalog();
}

/**
 * Clear in-memory cache (useful for testing or hot reloads)
 */
export function clearVstepExamCache(): void {
  examMemoryCache.clear();
  globalMasterVstepQuestionIndex.clear();
}

/**
 * Nạp nguyên bản đề thi từ filesystem kèm cache bộ nhớ (bao gồm đáp án để server chấm điểm)
 */
export function loadRawVstepExam(testId: string): VstepExam | null {
  if (!testId || typeof testId !== 'string') return null;
  const cacheKey = testId.trim().toLowerCase();
  if (!cacheKey) return null;

  // 1. Check in-memory cache
  if (examMemoryCache.has(cacheKey)) {
    return JSON.parse(JSON.stringify(examMemoryCache.get(cacheKey)!));
  }

  // 2. Resolve filesystem path
  const filePath = resolveExamFilePath(testId);
  if (!filePath) return null;

  try {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const exam = JSON.parse(rawContent) as VstepExam;

    // Schema validation
    if (
      !exam ||
      typeof exam !== 'object' ||
      typeof exam.id !== 'string' ||
      !Array.isArray(exam.sections)
    ) {
      console.error(`Cấu trúc đề thi VSTEP không hợp lệ tại ${filePath}`);
      return null;
    }

    // Index questions for dynamic grading
    indexExamQuestions(exam);

    // Cache under requested key, canonical exam.id, and aliases
    examMemoryCache.set(cacheKey, exam);
    if (exam.id) {
      examMemoryCache.set(exam.id.toLowerCase(), exam);
    }
    if (cacheKey.includes('-mock-')) {
      examMemoryCache.set(cacheKey.replace('-mock-', '-exam-'), exam);
    } else if (cacheKey.includes('-exam-')) {
      examMemoryCache.set(cacheKey.replace('-exam-', '-mock-'), exam);
    }

    return JSON.parse(JSON.stringify(exam));
  } catch (error) {
    console.error(`Lỗi nạp file đề thi VSTEP từ ${filePath}:`, error);
    return null;
  }
}

export const SENSITIVE_VSTEP_KEYS = [
  'answer',
  'correctAnswer',
  'correctOptionIndex',
  'explanation',
  'explanationVi',
  'tapescript',
  'transcript',
  'analysis',
  'solution',
  'suggestion',
] as const;

/**
 * Làm sạch dữ liệu đề thi trước khi gửi về client (Zero Bulk Leaks)
 */
export function stripSensitiveVstepData(exam: VstepExam): VstepExam {
  const cloned: VstepExam = JSON.parse(JSON.stringify(exam));

  const purgeObject = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of SENSITIVE_VSTEP_KEYS) {
      if (key in obj) {
        delete obj[key];
      }
    }
  };

  purgeObject(cloned);

  if (Array.isArray(cloned.sections)) {
    for (const section of cloned.sections) {
      purgeObject(section);

      if (Array.isArray(section.tasks)) {
        for (const task of section.tasks) {
          purgeObject(task);
          if (task.passage) purgeObject(task.passage);

          if (Array.isArray(task.questions)) {
            for (const q of task.questions) {
              purgeObject(q);
            }
          }
        }
      }
    }
  }

  // Quét đệ quy toàn diện đảm bảo không bỏ sót bất kỳ object lồng nhau nào
  const purgeRecursive = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of SENSITIVE_VSTEP_KEYS) {
      if (key in obj) {
        delete obj[key];
      }
    }
    for (const k of Object.keys(obj)) {
      if (obj[k] && typeof obj[k] === 'object') {
        purgeRecursive(obj[k]);
      }
    }
  };
  purgeRecursive(cloned);

  return cloned;
}

/**
 * Nạp đề thi an toàn cho client (đã làm sạch 100% dữ liệu nhạy cảm)
 */
export function loadVstepExamSafe(testId: string): VstepExam | null {
  const raw = loadRawVstepExam(testId);
  if (!raw) return null;
  return stripSensitiveVstepData(raw);
}

/**
 * Nạp đề thi an toàn kèm session token theo interface contract Universal Dynamic Loader
 */
export function loadVstepExamForClient(
  testId: string,
  clientIp = '127.0.0.1'
): { exam: VstepExam; sessionToken: string } | null {
  const safeExam = loadVstepExamSafe(testId);
  if (!safeExam) return null;
  const sessionToken = generateVstepSessionToken(clientIp, testId);
  return { exam: safeExam, sessionToken };
}

/**
 * Lấy đáp án và lời giải cho duy nhất 1 câu hỏi (On-Demand Explain)
 */
export function getVstepQuestionExplanation(
  testId: string,
  questionId: string
): {
  answer?: number;
  explanationVi?: string;
  tapescript?: string;
  suggestion?: string;
} | null {
  if (!questionId || typeof questionId !== 'string') return null;
  const trimmedQ = questionId.trim();
  if (!trimmedQ || trimmedQ === '__proto__' || trimmedQ === 'constructor' || trimmedQ === 'prototype') {
    return null;
  }

  const raw = loadRawVstepExam(testId);
  if (!raw) return null;

  for (const section of raw.sections) {
    for (const task of section.tasks) {
      if (task.questions) {
        const foundQ = task.questions.find((q) => q.id === trimmedQ);
        if (foundQ) {
          return {
            answer: foundQ.answer,
            explanationVi: foundQ.explanationVi,
            tapescript: task.tapescript,
            suggestion: task.suggestion,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Nạp danh sách câu hỏi gốc theo ID (bao gồm đáp án và lời giải) phục vụ chấm điểm tự động
 */
export function loadVstepQuestionsByIds(questionIds: string[]): VstepQuestion[] {
  if (!Array.isArray(questionIds) || questionIds.length === 0) return [];

  const result: VstepQuestion[] = [];

  for (const id of questionIds) {
    if (!id || typeof id !== 'string') continue;
    const trimmedId = id.trim();
    let found = globalMasterVstepQuestionIndex.get(trimmedId);

    // If not found and ID contains colon (canonical: examId:qId)
    if (!found && trimmedId.includes(':')) {
      const colonIdx = trimmedId.indexOf(':');
      const candidateExamId = trimmedId.substring(0, colonIdx);
      const qId = trimmedId.substring(colonIdx + 1);
      try {
        const loaded = loadRawVstepExam(candidateExamId);
        if (loaded) {
          found = globalMasterVstepQuestionIndex.get(trimmedId) || globalMasterVstepQuestionIndex.get(qId);
        }
      } catch {}
    }

    // If still not found, check prefix conventions
    if (!found) {
      if (trimmedId.startsWith('otv-r')) {
        const match = trimmedId.match(/^otv-r(\d+)/);
        if (match) {
          const testNum = parseInt(match[1], 10);
          loadRawVstepExam(`vstep-reading-onthi-${testNum}`);
          found = globalMasterVstepQuestionIndex.get(trimmedId);
        }
      } else if (trimmedId.startsWith('ets-r')) {
        const match = trimmedId.match(/^ets-r(\d+)/);
        if (match) {
          const testNum = parseInt(match[1], 10);
          loadRawVstepExam(`vstep-reading-ets-${testNum}`);
          found = globalMasterVstepQuestionIndex.get(trimmedId);
        }
      } else if (trimmedId.startsWith('ets-l')) {
        const match = trimmedId.match(/^ets-l(\d+)/);
        if (match) {
          const testNum = parseInt(match[1], 10);
          loadRawVstepExam(`vstep-listening-ets-${testNum}`);
          found = globalMasterVstepQuestionIndex.get(trimmedId);
        }
      }
    }

    // If still not found, scan through catalog index
    if (!found) {
      const catalog = getVstepCatalog();
      if (catalog && Array.isArray(catalog.items)) {
        for (const item of catalog.items) {
          if (found) break;
          const exam = loadRawVstepExam(item.id);
          if (exam) {
            found = globalMasterVstepQuestionIndex.get(trimmedId);
          }
        }
      }
    }

    if (found) {
      result.push(JSON.parse(JSON.stringify(found)));
    }
  }

  return result;
}

/**
 * Lấy danh sách mã đề trong catalog phù hợp với kỹ năng yêu cầu
 */
export function getExamIdsForSkill(skill: VstepSkillType): string[] {
  const catalog = getVstepCatalog();
  if (!catalog || !Array.isArray(catalog.items)) return [];
  const ids: string[] = [];
  for (const item of catalog.items) {
    if (item.skills && item.skills.includes(skill)) {
      ids.push(item.id);
    } else if (
      item.skill === skill ||
      (item.category === 'full_mock' && (skill === 'listening' || skill === 'reading'))
    ) {
      ids.push(item.id);
    }
  }
  return ids;
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffleArray<T>(array: T[], seed?: number): T[] {
  const cloned = [...array];
  const rng = seed !== undefined ? seededRandom(seed) : Math.random;
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

function isQuestionExcluded(
  q: VstepQuestion,
  examId: string,
  excludedSet: Set<string>
): boolean {
  if (excludedSet.has(q.id)) return true;
  if (q.canonicalId && excludedSet.has(q.canonicalId)) return true;
  if (examId && excludedSet.has(`${examId}:${q.id}`)) return true;
  return false;
}

function isQuestionMistake(
  q: VstepQuestion,
  examId: string,
  mistakeSet: Set<string>
): boolean {
  if (mistakeSet.has(q.id)) return true;
  if (q.canonicalId && mistakeSet.has(q.canonicalId)) return true;
  if (examId && mistakeSet.has(`${examId}:${q.id}`)) return true;
  return false;
}

/**
 * Nạp luyện tập chuyên sâu theo kỹ năng kèm bộ lọc chống trùng
 * Hỗ trợ 3 chế độ:
 * - unseen: Lọc bỏ 100% câu đã làm, fallback câu ôn tập khi thiếu đề
 * - mistakes: Bốc chính xác các câu làm sai gần nhất để remediation
 * - all_random: Xáo trộn ngẫu nhiên ngân hàng câu hỏi
 */
export function loadVstepSkillPractice(
  optionsOrSkill: VstepSkillType | VstepPracticeOptions,
  filterModeArg?: VstepPracticeFilterMode,
  excludedIdsArg?: string[]
): (VstepExam & { metadata?: any }) | null {
  let skill: VstepSkillType;
  let filterMode: VstepPracticeFilterMode = 'unseen';
  let excludedIds: string[] = [];
  let mistakeIds: string[] = [];
  let limit: number | undefined;
  let seed: number | undefined;
  let testId: string | undefined;

  const isLegacyCall = typeof optionsOrSkill === 'string';

  if (isLegacyCall) {
    skill = optionsOrSkill;
    filterMode = filterModeArg || 'unseen';
    excludedIds = excludedIdsArg || [];
  } else {
    skill = optionsOrSkill.skill;
    filterMode = optionsOrSkill.filterMode || 'unseen';
    excludedIds = optionsOrSkill.excludedIds || [];
    mistakeIds = optionsOrSkill.mistakeIds || [];
    limit = optionsOrSkill.limit;
    seed = optionsOrSkill.seed;
    testId = optionsOrSkill.testId;
  }

  const defaultLimit = skill === 'listening' ? 35 : 40;
  const targetLimit = limit && limit > 0 ? limit : defaultLimit;
  const isBankMode =
    testId === 'bank' ||
    testId === 'all' ||
    (!isLegacyCall && !testId && (limit !== undefined || mistakeIds.length > 0));

  let baseExamId =
    testId && testId !== 'bank' && testId !== 'all'
      ? testId
      : skill === 'listening'
      ? 'vstep-listening-01'
      : 'vstep-reading-01';

  const excludedSet = new Set(excludedIds);
  const mistakeSet = new Set(mistakeIds);

  function extractTasksFromExam(eId: string): VstepTask[] {
    const raw = loadRawVstepExam(eId);
    if (!raw) return [];
    const section = raw.sections.find((s) => s.type === skill);
    if (!section || !Array.isArray(section.tasks)) return [];
    return section.tasks.map((task) => {
      const taskClone: VstepTask = JSON.parse(JSON.stringify(task));
      if (Array.isArray(taskClone.questions)) {
        taskClone.questions.forEach((q) => {
          if (!q.canonicalId) q.canonicalId = `${eId}:${q.id}`;
        });
      }
      return taskClone;
    });
  }

  // ── MODE 1: MISTAKES (Chỉ bốc câu làm sai) ─────────────────────────────────
  if (filterMode === 'mistakes') {
    if (mistakeSet.size === 0) {
      const emptyExam: VstepExam & { metadata?: any } = {
        id: `vstep-practice-${skill}`,
        title: `Luyện Tập ${skill === 'listening' ? 'Kỹ Năng Nghe' : 'Kỹ Năng Đọc'} — Ôn Câu Sai`,
        duration: skill === 'listening' ? 40 : 60,
        sections: [
          {
            type: skill,
            label: skill === 'listening' ? 'Kỹ Năng Nghe (Listening)' : 'Kỹ Năng Đọc (Reading)',
            timeLimit: skill === 'listening' ? 40 : 60,
            tasks: [],
          },
        ],
        metadata: {
          totalQuestions: 0,
          unseenRemaining: 0,
          isFallbackUsed: false,
          filterMode: 'mistakes',
          skill,
          questionIds: [],
        },
      };
      return stripSensitiveVstepData(emptyExam);
    }

    const candidateExamIds = isBankMode ? getExamIdsForSkill(skill) : [baseExamId];
    if (!candidateExamIds.includes(baseExamId)) {
      candidateExamIds.unshift(baseExamId);
    }

    let selectedTasks: VstepTask[] = [];
    const satisfiedMistakeIds = new Set<string>();

    for (const mId of mistakeIds) {
      if (satisfiedMistakeIds.has(mId)) continue;

      let targetExamId = baseExamId;
      let rawQId = mId;
      if (mId.includes(':')) {
        const colonIdx = mId.indexOf(':');
        targetExamId = mId.substring(0, colonIdx);
        rawQId = mId.substring(colonIdx + 1);
      }

      const searchExams = [targetExamId, ...candidateExamIds.filter((id) => id !== targetExamId)];

      let found = false;
      for (const eId of searchExams) {
        if (found) break;
        const tasks = extractTasksFromExam(eId);
        for (const task of tasks) {
          if (!task.questions) continue;
          const matchingQs = task.questions.filter(
            (q) => q.id === rawQId || q.id === mId || q.canonicalId === mId || `${eId}:${q.id}` === mId
          );
          if (matchingQs.length > 0) {
            const existingTask = selectedTasks.find(
              (t) => t.id === task.id && (t as any)._examId === eId
            );
            if (existingTask) {
              for (const mq of matchingQs) {
                if (!existingTask.questions?.some((eq) => eq.id === mq.id)) {
                  existingTask.questions?.push(mq);
                }
              }
            } else {
              selectedTasks.push({
                ...task,
                _examId: eId,
                questions: [...matchingQs],
              } as any);
            }
            satisfiedMistakeIds.add(mId);
            satisfiedMistakeIds.add(rawQId);
            found = true;
            break;
          }
        }
      }
    }

    selectedTasks.forEach((t) => delete (t as any)._examId);
    let accumulatedCount = selectedTasks.reduce((acc, t) => acc + (t.questions?.length || 0), 0);

    if (seed !== undefined) {
      selectedTasks = shuffleArray(selectedTasks, seed);
    }

    const allQIds: string[] = [];
    selectedTasks.forEach((t) => t.questions?.forEach((q) => allQIds.push(q.canonicalId || q.id)));

    const resultExam: VstepExam & { metadata?: any } = {
      id: `vstep-practice-${skill}`,
      title: `Luyện Tập ${skill === 'listening' ? 'Kỹ Năng Nghe' : 'Kỹ Năng Đọc'} — Ôn Câu Sai`,
      duration: skill === 'listening' ? 40 : 60,
      sections: [
        {
          type: skill,
          label: skill === 'listening' ? 'Kỹ Năng Nghe (Listening)' : 'Kỹ Năng Đọc (Reading)',
          timeLimit: skill === 'listening' ? 40 : 60,
          tasks: selectedTasks,
        },
      ],
      metadata: {
        totalQuestions: accumulatedCount,
        unseenRemaining: 0,
        isFallbackUsed: false,
        filterMode: 'mistakes',
        skill,
        questionIds: allQIds,
      },
    };

    return stripSensitiveVstepData(resultExam);
  }

  // ── MODE 2: ALL_RANDOM (Ngẫu nhiên không hoàn lại) ─────────────────────────
  if (filterMode === 'all_random') {
    const candidateExamIds = isBankMode ? getExamIdsForSkill(skill) : [baseExamId];
    let allTasks: VstepTask[] = [];

    for (const eId of candidateExamIds) {
      const tasks = extractTasksFromExam(eId);
      allTasks.push(...tasks);
    }

    allTasks = shuffleArray(allTasks, seed);

    let selectedTasks: VstepTask[] = [];
    let accumulatedCount = 0;

    for (const task of allTasks) {
      if (accumulatedCount >= targetLimit) break;
      selectedTasks.push(task);
      accumulatedCount += task.questions?.length || 0;
    }

    const allQIds: string[] = [];
    selectedTasks.forEach((t) => t.questions?.forEach((q) => allQIds.push(q.canonicalId || q.id)));

    const resultExam: VstepExam & { metadata?: any } = {
      id: `vstep-practice-${skill}`,
      title: `Luyện Tập ${skill === 'listening' ? 'Kỹ Năng Nghe' : 'Kỹ Năng Đọc'} — Ngẫu Nhiên`,
      duration: skill === 'listening' ? 40 : 60,
      sections: [
        {
          type: skill,
          label: skill === 'listening' ? 'Kỹ Năng Nghe (Listening)' : 'Kỹ Năng Đọc (Reading)',
          timeLimit: skill === 'listening' ? 40 : 60,
          tasks: selectedTasks,
        },
      ],
      metadata: {
        totalQuestions: accumulatedCount,
        unseenRemaining: 0,
        isFallbackUsed: false,
        filterMode: 'all_random',
        skill,
        questionIds: allQIds,
      },
    };

    return stripSensitiveVstepData(resultExam);
  }

  // ── MODE 3: UNSEEN (Chống trùng tuyệt đối + Graceful Fallback) ─────────────
  // 1. Nạp đề gốc
  const baseTasks = extractTasksFromExam(baseExamId);
  let selectedTasks: VstepTask[] = [];
  let isFallbackUsed = false;

  if (excludedSet.size === 0) {
    selectedTasks = baseTasks;
  } else {
    // Lọc các câu chưa làm trong baseTasks
    for (const task of baseTasks) {
      if (!task.questions || task.questions.length === 0) {
        selectedTasks.push(task);
        continue;
      }

      const unseenQuestions = task.questions.filter((q) => !isQuestionExcluded(q, baseExamId, excludedSet));
      if (unseenQuestions.length > 0) {
        selectedTasks.push({
          ...task,
          questions: unseenQuestions,
        });
      }
    }

    let count = selectedTasks.reduce((acc, t) => acc + (t.questions?.length || 0), 0);

    // Nếu ở chế độ Bank và số câu chưa đủ targetLimit, bốc tiếp từ các đề khác trong ngân hàng
    if (isBankMode && count < targetLimit) {
      const candidateExamIds = getExamIdsForSkill(skill).filter((id) => id !== baseExamId);
      for (const eId of candidateExamIds) {
        if (count >= targetLimit) break;
        const extraTasks = extractTasksFromExam(eId);
        for (const task of extraTasks) {
          if (!task.questions || task.questions.length === 0) continue;
          const unseen = task.questions.filter((q) => !isQuestionExcluded(q, eId, excludedSet));
          if (unseen.length > 0) {
            selectedTasks.push({
              ...task,
              questions: unseen,
            });
            count += unseen.length;
            if (count >= targetLimit) break;
          }
        }
      }
    }

    // Graceful Fallback: nếu toàn bộ câu hỏi bị loại bỏ (100% excluded) hoặc không còn câu mới
    if (selectedTasks.length === 0 || count === 0) {
      isFallbackUsed = true;
      // Fallback 1: bổ sung câu làm sai nếu có
      if (mistakeSet.size > 0) {
        for (const task of baseTasks) {
          if (!task.questions) continue;
          const mistakeQs = task.questions.filter((q) => isQuestionMistake(q, baseExamId, mistakeSet));
          if (mistakeQs.length > 0) {
            selectedTasks.push({ ...task, questions: mistakeQs });
          }
        }
      }
      // Fallback 2: nếu vẫn rỗng, trả về nguyên bản baseTasks để không bao giờ bị crash
      if (selectedTasks.length === 0) {
        selectedTasks = baseTasks;
      }
    }
  }

  const totalQuestions = selectedTasks.reduce((acc, t) => acc + (t.questions?.length || 0), 0);
  const allQIds: string[] = [];
  selectedTasks.forEach((t) => t.questions?.forEach((q) => allQIds.push(q.canonicalId || q.id)));

  const practiceExam: VstepExam & { metadata?: any } = {
    id: `vstep-practice-${skill}`,
    title: `Luyện Tập ${skill === 'listening' ? 'Kỹ Năng Nghe' : 'Kỹ Năng Đọc'} — Chế Độ ${filterMode.toUpperCase()}`,
    duration: skill === 'listening' ? 40 : 60,
    sections: [
      {
        type: skill,
        label: skill === 'listening' ? 'Kỹ Năng Nghe (Listening)' : 'Kỹ Năng Đọc (Reading)',
        timeLimit: skill === 'listening' ? 40 : 60,
        tasks: selectedTasks,
      },
    ],
    metadata: {
      totalQuestions,
      unseenRemaining: Math.max(0, totalQuestions),
      isFallbackUsed,
      filterMode: 'unseen',
      skill,
      questionIds: allQIds,
    },
  };

  return stripSensitiveVstepData(practiceExam);
}
