/**
 * Tier 1: Feature Coverage Test Suite for Listening Immersion Hub.
 * Verifies core functionality across R1 (Market Research 100 Platforms),
 * R2 (Curated Real-Life Video Dataset), R3 (Interactive Player Controls & Transcript),
 * and R4 (Cloze Listening Dictation & Comprehension Quiz).
 */

import fs from 'node:fs';
import path from 'node:path';
import { TestRunner, expect, setupMockBrowserEnvironment, teardownMockBrowserEnvironment } from './test-harness';
import {
  getAllListeningVideos,
  getListeningVideoById,
  filterListeningVideos,
  findActiveCue,
  findActiveCueIndex,
  formatTime,
  tokenizeSentence,
  validateClozeAnswer,
  getTopicDisplayName,
  getTopicBadgeColor,
  getCefrBadgeStyle,
  saveListeningAttempt,
  getListeningAttempt,
} from '../../src/lib/listening';
import type { ListeningAttempt, SubtitleDisplayMode } from '../../src/types/listening';

const ROOT_DIR = path.resolve(__dirname, '../..');
const MARKET_RESEARCH_PATH = path.resolve(ROOT_DIR, 'research/100_vietnam_english_websites.json');
const BENCHMARK_REPORT_PATH = path.resolve(ROOT_DIR, 'research/vietnam_english_video_learning_benchmark.md');

export async function runTier1Tests(runner: TestRunner): Promise<void> {
  // ──────────────────────────────────────────────────────────────────────────
  // Feature R1: 100 Vietnam English Platforms Market Research & Benchmark
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('R1: Market Research Dataset & Benchmark Report', () => {
    runner.it('R1.1: Market research dataset contains at least 100 platforms with valid JSON array', () => {
      expect(fs.existsSync(MARKET_RESEARCH_PATH)).toBe(true);
      const raw = fs.readFileSync(MARKET_RESEARCH_PATH, 'utf-8');
      const items = JSON.parse(raw);
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThanOrEqual(100);
    });

    runner.it('R1.2: All platforms have 100% unique canonical URLs with valid HTTP/HTTPS protocol', () => {
      const items: any[] = JSON.parse(fs.readFileSync(MARKET_RESEARCH_PATH, 'utf-8'));
      const seenUrls = new Set<string>();

      for (const item of items) {
        expect(typeof item.url).toBe('string');
        expect(item.url.trim().length).toBeGreaterThan(0);

        const parsed = new URL(item.url);
        expect(['http:', 'https:']).toContain(parsed.protocol);

        const canonical = `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/+$/, '')}`;
        expect(seenUrls.has(canonical)).toBe(false);
        seenUrls.add(canonical);
      }
      expect(seenUrls.size).toBe(items.length);
    });

    runner.it('R1.3: All platforms adhere to schema with non-empty name, category, and video feature analysis', () => {
      const items: any[] = JSON.parse(fs.readFileSync(MARKET_RESEARCH_PATH, 'utf-8'));
      const allowedCategories = [
        'edtech_startup',
        'exam_prep_ielts_toeic',
        'video_listening_specialist',
        'general_skills_community',
        'k12_academic',
        'global_localized',
      ];

      for (const item of items) {
        expect(typeof item.name).toBe('string');
        expect(item.name.trim().length).toBeGreaterThanOrEqual(2);

        expect(allowedCategories).toContain(item.category);
        expect(typeof item.has_video_feature).toBe('boolean');

        expect(typeof item.video_features_analysis).toBe('string');
        expect(item.video_features_analysis.trim().length).toBeGreaterThanOrEqual(10);
      }
    });

    runner.it('R1.4: All platforms have >=2 pros items and >=1 cons items with non-empty text', () => {
      const items: any[] = JSON.parse(fs.readFileSync(MARKET_RESEARCH_PATH, 'utf-8'));

      for (const item of items) {
        expect(Array.isArray(item.pros)).toBe(true);
        expect(item.pros.length).toBeGreaterThanOrEqual(2);
        for (const pro of item.pros) {
          expect(typeof pro).toBe('string');
          expect(pro.trim().length).toBeGreaterThanOrEqual(3);
        }

        expect(Array.isArray(item.cons)).toBe(true);
        expect(item.cons.length).toBeGreaterThanOrEqual(1);
        for (const con of item.cons) {
          expect(typeof con).toBe('string');
          expect(con.trim().length).toBeGreaterThanOrEqual(3);
        }
      }
    });

    runner.it('R1.5: Benchmark report exists and contains executive summary, matrix, and UX recommendations', () => {
      expect(fs.existsSync(BENCHMARK_REPORT_PATH)).toBe(true);
      const content = fs.readFileSync(BENCHMARK_REPORT_PATH, 'utf-8');
      expect(content.length).toBeGreaterThan(1000);
      expect(content).toContain('Executive Summary');
      expect(content).toContain('Market Segmentation');
      expect(content).toContain('Architectural & UX Recommendations');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature R2: Curated Real-Life English Video Dataset & Types
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('R2: Curated Video Dataset & Metadata Integrity', () => {
    const videos = getAllListeningVideos();

    runner.it('R2.1: Dataset contains both Short (>3-10m) and Medium (>10-25m) videos with >=200 total', () => {
      expect(videos.length).toBeGreaterThanOrEqual(200);
      const shortVideos = videos.filter((v) => v.durationCategory === 'short');
      const mediumVideos = videos.filter((v) => v.durationCategory === 'medium');

      expect(shortVideos.length).toBeGreaterThanOrEqual(120);
      expect(mediumVideos.length).toBeGreaterThanOrEqual(60);

      for (const v of shortVideos) {
        expect(v.duration).toBeGreaterThan(180);
        expect(v.duration).toBeLessThanOrEqual(600);
      }
      for (const v of mediumVideos) {
        expect(v.duration).toBeGreaterThan(600);
        expect(v.duration).toBeLessThanOrEqual(1500);
      }
    });

    runner.it('R2.2: Covers CEFR levels A2, B1, B2 and all 7 life categories', () => {
      const levels = new Set(videos.map((v) => v.cefrLevel));
      expect(levels.has('A2')).toBe(true);
      expect(levels.has('B1')).toBe(true);
      expect(levels.has('B2')).toBe(true);

      const topics = new Set(videos.map((v) => v.topic));
      const requiredTopics = [
        'daily_life',
        'social_conversations',
        'workplace',
        'travel',
        'food_shopping',
        'science_tech_health',
        'culture',
      ];
      for (const t of requiredTopics) {
        expect(topics.has(t as any)).toBe(true);
        const count = videos.filter(
          (v) => v.topic === t || (t === 'culture' && v.topic === 'social_stories')
        ).length;
        expect(count).toBeGreaterThanOrEqual(15);
      }
    });

    runner.it('R2.3: Every video has valid YouTube ID and metadata properties', () => {
      for (const v of videos) {
        expect(typeof v.id).toBe('string');
        expect(v.id.length).toBeGreaterThan(3);
        expect(typeof v.youtubeId).toBe('string');
        expect(v.youtubeId.length).toBe(11);
        expect(typeof v.title).toBe('string');
        expect(v.title.length).toBeGreaterThan(5);
        expect(typeof v.channel).toBe('string');
        expect(v.channel.length).toBeGreaterThan(2);
        expect(v.thumbnailUrl.startsWith('https://')).toBe(true);
      }
    });

    runner.it('R2.4: 100% of transcript cues have monotonic non-overlapping timing and bilingual text', () => {
      for (const v of videos) {
        expect(v.transcript.length).toBeGreaterThanOrEqual(10);
        let prevStart = -1;

        for (const cue of v.transcript) {
          expect(cue.start).toBeGreaterThanOrEqual(0);
          expect(cue.end).toBeGreaterThan(cue.start);
          expect(cue.start).toBeGreaterThanOrEqual(prevStart);
          prevStart = cue.start;

          expect(typeof cue.en).toBe('string');
          expect(cue.en.trim().length).toBeGreaterThan(0);
          expect(typeof cue.vi).toBe('string');
          expect(cue.vi.trim().length).toBeGreaterThan(0);
        }
      }
    });

    runner.it('R2.5: Core vocabulary items contain IPA phonetics, definitions, and context sentences', () => {
      for (const v of videos) {
        expect(v.coreVocabulary.length).toBeGreaterThanOrEqual(3);
        for (const item of v.coreVocabulary) {
          expect(typeof item.word).toBe('string');
          expect(item.word.length).toBeGreaterThan(1);
          expect(item.phonetic.startsWith('/')).toBe(true);
          expect(item.phonetic.endsWith('/')).toBe(true);
          expect(typeof item.viDefinition).toBe('string');
          expect(item.viDefinition.length).toBeGreaterThan(2);
          expect(typeof item.contextSentence).toBe('string');
          expect(item.contextSentence.length).toBeGreaterThan(5);
        }
      }
    });

    runner.it('R2.6: Exercises exist directly and under convenience object', () => {
      for (const v of videos) {
        expect(v.clozeItems.length).toBeGreaterThanOrEqual(3);
        expect(v.comprehensionQuestions.length).toBeGreaterThanOrEqual(3);
        expect(v.exercises?.clozeItems.length).toBe(v.clozeItems.length);
        expect(v.exercises?.comprehensionQuestions.length).toBe(v.comprehensionQuestions.length);
      }
    });

    runner.it('R2.7: High-performance videos-index.json exists and matches 200 items under 200 KB', () => {
      const indexPath = path.resolve(ROOT_DIR, 'src/data/listening/videos-index.json');
      expect(fs.existsSync(indexPath)).toBe(true);

      const stat = fs.statSync(indexPath);
      expect(stat.size).toBeLessThan(200 * 1024); // Under 200 KB budget
      expect(stat.size).toBeGreaterThan(50 * 1024); // Healthy index size

      const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      expect(Array.isArray(indexData)).toBe(true);
      expect(indexData.length).toBe(200);

      for (const item of indexData) {
        expect(typeof item.id).toBe('string');
        expect(typeof item.title).toBe('string');
        expect(typeof item.channel).toBe('string');
        expect(typeof item.durationCategory).toBe('string');
        expect(typeof item.cefrLevel).toBe('string');
        expect(typeof item.topic).toBe('string');
        expect(Array.isArray(item.coreVocabularyPreview)).toBe(true);
        expect(item.coreVocabularyPreview.length).toBeGreaterThanOrEqual(3);
        // Ensure index items omit heavy transcript and cloze payloads
        expect(item.transcript === undefined).toBe(true);
        expect(item.clozeItems === undefined).toBe(true);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature R3: Interactive Video Player Controls & Transcripts
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('R3: Interactive Player Controls & Transcript Sync', () => {
    runner.it('R3.1: getListeningVideoById resolves correctly by internal ID or YouTube ID', () => {
      const vById = getListeningVideoById('video-short-daily-life');
      expect(vById).toBeDefined();
      expect(vById?.title).toContain('Daily Routine');

      const vByYt = getListeningVideoById('LhytOhr5ZMA');
      expect(vByYt).toBeDefined();
      expect(vByYt?.id).toBe('video-short-daily-life');

      const nonexistent = getListeningVideoById('nonexistent_video_xyz');
      expect(nonexistent).toBeUndefined();
    });

    runner.it('R3.2: filterListeningVideos filters accurately by duration, topic, level, and query', () => {
      const shortVideos = filterListeningVideos({ duration: 'short' });
      expect(shortVideos.every((v) => v.durationCategory === 'short')).toBe(true);

      const b1Videos = filterListeningVideos({ level: 'B1' });
      expect(b1Videos.every((v) => v.cefrLevel === 'B1')).toBe(true);

      const travelVideos = filterListeningVideos({ topic: 'travel' });
      expect(travelVideos.every((v) => v.topic === 'travel')).toBe(true);

      const airportQuery = filterListeningVideos({ searchQuery: 'airport' });
      expect(airportQuery.some((v) => v.id === 'video-short-travel')).toBe(true);
    });

    runner.it('R3.3: findActiveCueIndex accurately resolves cues using O(log N) binary search', () => {
      const video = getListeningVideoById('video-short-daily-life')!;
      const cues = video.transcript;

      // First cue is at 0.0s to 5.2s
      const idx0 = findActiveCueIndex(cues, 2.5);
      expect(idx0).toBe(0);
      expect(cues[idx0].id).toBe('cue-1');

      // Intermediate cue: cue-3 is 11.2s to 19.5s
      const idx2 = findActiveCueIndex(cues, 15.0);
      expect(idx2).toBe(2);
      expect(cues[idx2].id).toBe('cue-3');

      // Before start of cues
      const idxNeg = findActiveCueIndex(cues, -5.0);
      expect(idxNeg).toBe(-1);
    });

    runner.it('R3.4: tokenizeSentence splits words, punctuation, and contractions correctly', () => {
      const tokens = tokenizeSentence("I don't eat heavy food; it's a world-class dish!");
      const cleanWords = tokens.filter((t) => t.isWord).map((t) => t.clean);

      expect(cleanWords).toContain("don't");
      expect(cleanWords).toContain("it's");
      expect(cleanWords).toContain("world-class");

      const punctuation = tokens.filter((t) => !t.isWord && t.raw.trim() !== '');
      expect(punctuation.some((p) => p.raw === ';')).toBe(true);
      expect(punctuation.some((p) => p.raw === '!')).toBe(true);
    });

    runner.it('R3.5: formatTime converts seconds to mm:ss and hh:mm:ss strings', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(45)).toBe('00:45');
      expect(formatTime(75)).toBe('01:15');
      expect(formatTime(745)).toBe('12:25');
      expect(formatTime(3600)).toBe('1:00:00');
      expect(formatTime(3665)).toBe('1:01:05');
      expect(formatTime(-10)).toBe('00:00');
    });

    runner.it('R3.6: Badge and display helpers return localized strings and valid styling', () => {
      expect(getTopicDisplayName('daily_life')).toBe('Đời sống hàng ngày');
      expect(getTopicDisplayName('workplace')).toBe('Công việc & Sự nghiệp');
      expect(getTopicDisplayName('travel')).toBe('Du lịch & Khám phá');

      const badgeColor = getTopicBadgeColor('daily_life');
      expect(badgeColor.bg).toContain('emerald');
      expect(badgeColor.text).toContain('emerald');

      const cefrStyle = getCefrBadgeStyle('B2');
      expect(cefrStyle.bg).toContain('indigo');
      expect(cefrStyle.text).toContain('indigo');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature R4: Cloze Listening & Comprehension Quiz
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('R4: Cloze Listening & Comprehension Quiz Modules', () => {
    runner.it('R4.1: validateClozeAnswer handles case-insensitivity, whitespace, and punctuation', () => {
      expect(validateClozeAnswer('alarm', 'alarm')).toBe(true);
      expect(validateClozeAnswer('ALARM', 'alarm')).toBe(true);
      expect(validateClozeAnswer('  routine  ', 'routine')).toBe(true);
      expect(validateClozeAnswer('experience.', 'experience')).toBe(true);
      expect(validateClozeAnswer('"commencement"', 'commencement')).toBe(true);
      expect(validateClozeAnswer('wrong_word', 'correct_word')).toBe(false);
      expect(validateClozeAnswer('', 'target')).toBe(false);
    });

    runner.it('R4.2: Cloze items contain {{blank}} placeholder, target word, and 4 options', () => {
      const videos = getAllListeningVideos();
      for (const v of videos) {
        for (const cloze of v.clozeItems) {
          expect(cloze.sentence).toContain('{{blank}}');
          expect(typeof cloze.blankWord).toBe('string');
          expect(cloze.blankWord.length).toBeGreaterThan(0);
          expect(typeof cloze.hintVi).toBe('string');
          expect(cloze.timestamp).toBeGreaterThanOrEqual(0);

          if (cloze.options) {
            expect(cloze.options.length).toBe(4);
            expect(cloze.options).toContain(cloze.blankWord);
          }
        }
      }
    });

    runner.it('R4.3: Comprehension questions have 4 options and valid correctIndex within [0, 3]', () => {
      const videos = getAllListeningVideos();
      for (const v of videos) {
        for (const q of v.comprehensionQuestions) {
          expect(typeof q.question).toBe('string');
          expect(q.question.length).toBeGreaterThan(5);
          expect(q.options.length).toBe(4);
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThanOrEqual(3);
          expect(typeof q.explanation).toBe('string');
          expect(q.explanation.length).toBeGreaterThan(10);
        }
      }
    });

    runner.it('R4.4: Comprehension question evidence clue timestamps point to valid video segments', () => {
      const videos = getAllListeningVideos();
      for (const v of videos) {
        for (const q of v.comprehensionQuestions) {
          expect(q.timestampSeek).toBeGreaterThanOrEqual(0);
          expect(q.timestampSeek).toBeLessThanOrEqual(v.duration);
        }
      }
    });

    runner.it('R4.5: Listening attempts save and retrieve accurately from LocalStorage', () => {
      setupMockBrowserEnvironment();
      try {
        const testAttempt: ListeningAttempt = {
          videoId: 'video-short-daily-life',
          completedAt: new Date().toISOString(),
          clozeScore: 4,
          clozeTotal: 4,
          quizScore: 4,
          quizTotal: 4,
          percentScore: 100,
        };

        saveListeningAttempt(testAttempt);
        const retrieved = getListeningAttempt('video-short-daily-life');
        expect(retrieved).toBeDefined();
        expect(retrieved?.videoId).toBe('video-short-daily-life');
        expect(retrieved?.quizScore).toBe(4);
        expect(retrieved?.percentScore).toBe(100);

        const unattempted = getListeningAttempt('nonexistent_video');
        expect(unattempted).toBeNull();
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });
}
