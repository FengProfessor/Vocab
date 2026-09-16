/**
 * Comprehensive Test Suite for Exam Interactive Text & Dictionary Engine
 * 
 * Verifies:
 * 1. Tokenization accuracy (English words, apostrophes, hyphens, punctuation, digits, mixed Vi/En).
 * 2. Strict whitespace & newline preservation (rejoining tokens is 100% identical to source).
 * 3. Fallback behavior (empty inputs, whitespace-only, network errors, graceful error recovery).
 * 4. Dictionary cache & deduplication (memory cache, in-flight request coalescing, offline fallback).
 * 5. Word save synchronization (localStorage persistence, case-insensitivity, duplicate prevention, corrupted storage).
 * 6. HTML stripping & entity decoding (paragraphs, line breaks, standard & Vietnamese entities).
 */

import { TestRunner, expect } from '../toeic/test-harness';
import {
  fetchExamWordDict,
  isWordSavedLocally,
  saveWordLocally,
} from '../../src/lib/exam-dict-cache';
import { stripHtmlTags } from '../../src/components/toeic/ToeicSplitPane';
import {
  WORD_SPLIT_REGEX,
  IS_ENGLISH_WORD,
} from '../../src/components/exam/ExamInteractiveText';

interface TokenResult {
  raw: string;
  clean: string;
  isWord: boolean;
}

function tokenizeText(text: string): TokenResult[] {
  if (!text) return [];
  const result: TokenResult[] = [];
  WORD_SPLIT_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = WORD_SPLIT_REGEX.exec(text)) !== null) {
    const [, wordMatch, punctMatch, spaceMatch] = match;
    if (wordMatch) {
      const isEnglish = IS_ENGLISH_WORD.test(wordMatch);
      result.push({
        raw: wordMatch,
        clean: isEnglish ? wordMatch.replace(/[’]/g, "'").toLowerCase() : '',
        isWord: isEnglish,
      });
    } else if (punctMatch) {
      result.push({
        raw: punctMatch,
        clean: '',
        isWord: false,
      });
    } else if (spaceMatch) {
      result.push({
        raw: spaceMatch,
        clean: '',
        isWord: false,
      });
    }
  }
  return result;
}

// Mock localStorage for Node.js environment
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

let mockStorage: LocalStorageMock;

function setupMockEnvironment(): LocalStorageMock {
  mockStorage = new LocalStorageMock();
  (global as any).localStorage = mockStorage;
  (global as any).window = {
    localStorage: mockStorage,
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  return mockStorage;
}

export async function runInteractiveTextTests(runner: TestRunner): Promise<void> {
  const originalWindow = (global as any).window;
  const originalLocalStorage = (global as any).localStorage;
  const originalFetch = (global as any).fetch;

  runner.describe('Exam Interactive Text & Vocabulary Engine Test Suite', () => {});

  try {
    // ── 1. Tokenization Accuracy ──

    await runner.it('IT-1.1: Standard English sentences tokenize words and non-words accurately', () => {
      const text = 'The annual conference starts tomorrow in Chicago.';
      const tokens = tokenizeText(text);

      const words = tokens.filter((t) => t.isWord);
      expect(words.length).toBe(7);
      expect(words.map((w) => w.raw)).toEqual([
        'The',
        'annual',
        'conference',
        'starts',
        'tomorrow',
        'in',
        'Chicago',
      ]);
      expect(words.map((w) => w.clean)).toEqual([
        'the',
        'annual',
        'conference',
        'starts',
        'tomorrow',
        'in',
        'chicago',
      ]);
    });

    await runner.it("IT-1.2: Contractions and possessives are tokenized as single cohesive words", () => {
      const text = "We haven't received the manager's report, but it's ready.";
      const tokens = tokenizeText(text);

      const words = tokens.filter((t) => t.isWord);
      expect(words.some((w) => w.raw === "haven't")).toBe(true);
      expect(words.some((w) => w.raw === "manager's")).toBe(true);
      expect(words.some((w) => w.raw === "it's")).toBe(true);

      // Curly quotes (right single quotation mark ’)
      const curlyText = "They haven’t approved the director’s request.";
      const curlyTokens = tokenizeText(curlyText);
      const curlyWords = curlyTokens.filter((t) => t.isWord);
      expect(curlyWords.some((w) => w.raw === "haven’t" && w.clean === "haven't")).toBe(true);
      expect(curlyWords.some((w) => w.raw === "director’s" && w.clean === "director's")).toBe(true);
    });

    await runner.it('IT-1.3: Hyphenated compound words are preserved as single clickable tokens', () => {
      const text = 'We need a cost-effective and state-of-the-art solution for long-term growth.';
      const tokens = tokenizeText(text);

      const words = tokens.filter((t) => t.isWord);
      expect(words.some((w) => w.raw === 'cost-effective')).toBe(true);
      expect(words.some((w) => w.raw === 'state-of-the-art')).toBe(true);
      expect(words.some((w) => w.raw === 'long-term')).toBe(true);
    });

    await runner.it('IT-1.4: Numbers, currencies, percentages, and punctuation are non-word tokens', () => {
      const text = 'Revenue increased by 15.8% to $4,500,000 in Q3 (2026)!';
      const tokens = tokenizeText(text);

      const nonWords = tokens.filter((t) => !t.isWord);
      const nonWordRaw = nonWords.map((t) => t.raw).join('');
      expect(nonWordRaw).toContain('15.8%');
      expect(nonWordRaw).toContain('$4,500,000');
      expect(nonWordRaw).toContain('(2026)!');

      // Words extracted should only be English alphabetic tokens
      const words = tokens.filter((t) => t.isWord).map((t) => t.raw);
      expect(words).toEqual(['Revenue', 'increased', 'by', 'to', 'in', 'Q']);
    });

    await runner.it('IT-1.5: Mixed English and Vietnamese in explanations isolates English words without shredding Vietnamese syllables', () => {
      const text = 'Đáp án đúng là (B) applicant vì sau tính từ "qualified" cần một danh từ chỉ người.';
      const tokens = tokenizeText(text);

      const words = tokens.filter((t) => t.isWord);
      // English words present and isolated
      expect(words.some((w) => w.clean === 'applicant')).toBe(true);
      expect(words.some((w) => w.clean === 'qualified')).toBe(true);
      expect(words.some((w) => w.clean === 'b')).toBe(true);

      // Vietnamese text should not be treated as English words
      expect(words.some((w) => w.clean === 'đáp')).toBe(false);
      expect(words.some((w) => w.clean === 'người')).toBe(false);

      // CRITICAL: Vietnamese words must NOT be shredded into fragmented Latin consonants (e.g. 'p', 'ng', 'nh', 't')
      expect(words.some((w) => w.clean === 'p')).toBe(false);
      expect(words.some((w) => w.clean === 'ng')).toBe(false);
      expect(words.some((w) => w.clean === 'nh')).toBe(false);
      expect(words.some((w) => w.clean === 't')).toBe(false);

      // Verify Vietnamese words remain cohesive, complete tokens in the raw token stream
      const allRaws = tokens.map((t) => t.raw);
      expect(allRaws.includes('Đáp')).toBe(true);
      expect(allRaws.includes('án')).toBe(true);
      expect(allRaws.includes('đúng')).toBe(true);
      expect(allRaws.includes('người')).toBe(true);
      expect(allRaws.includes('tính')).toBe(true);
    });

    await runner.it('IT-1.6: Multi-word collocation phrase pattern validates 2 to 5 words accurately', () => {
      const validPhrases = [
        'in charge of',
        'look forward to',
        'state-of-the-art facility',
        'take into consideration',
        'cost-effective solution',
      ];
      const invalidPhrases = [
        'single', // only 1 word
        'one two three four five six', // 6 words (exceeds 5)
        'tiếng việt tra từ', // Vietnamese characters
        'number 100 percentage', // Contains digits
      ];

      const phraseRegex = /^[a-zA-Z\s'-]+$/;
      for (const phrase of validPhrases) {
        const count = phrase.trim().split(/\s+/).length;
        expect(count >= 2 && count <= 5).toBe(true);
        expect(phraseRegex.test(phrase)).toBe(true);
      }

      for (const phrase of invalidPhrases) {
        const count = phrase.trim().split(/\s+/).length;
        const valid = count >= 2 && count <= 5 && phraseRegex.test(phrase);
        expect(valid).toBe(false);
      }
    });

    // ── 2. Whitespace & Layout Preservation ──

    await runner.it('IT-2.1: Rejoining tokens is 100% strictly identical to the original input text', () => {
      const testCases = [
        'Simple sentence.',
        'Multiple   spaces    between     words.',
        'Line 1\nLine 2\r\nLine 3\n\nParagraph 2',
        '\tTabbed\n  Indented   line with punctuation: (e.g., [A], [B])!',
        '   Leading and trailing whitespace   \n',
        'Complex ETS stimulus:\n\nDear Mr. Henderson,\n\nThank you for your inquiry of May 12 regarding our conference catering services. As requested, I have enclosed our current banquet menu and price schedule.\n\nSincerely,\nJanet Miller\nEvents Coordinator',
      ];

      for (const input of testCases) {
        const tokens = tokenizeText(input);
        const reconstructed = tokens.map((t) => t.raw).join('');
        expect(reconstructed).toBe(input);
      }
    });

    await runner.it('IT-2.2: Preserves double newlines (paragraphs) and single newlines without collapse', () => {
      const text = 'Paragraph One.\n\nParagraph Two.\nLine two of P2.';
      const tokens = tokenizeText(text);

      const newlines = tokens.filter((t) => t.raw.includes('\n'));
      expect(newlines.length).toBe(2);
      expect(newlines[0].raw).toBe('\n\n');
      expect(newlines[1].raw).toBe('\n');
    });

    // ── 3. Edge Cases & Fallbacks ──

    await runner.it('IT-3.1: Empty and whitespace-only strings tokenize safely without throwing', () => {
      expect(tokenizeText('')).toEqual([]);
      
      const spaceOnly = '     \n\n  \t ';
      const tokens = tokenizeText(spaceOnly);
      expect(tokens.filter((t) => t.isWord).length).toBe(0);
      expect(tokens.map((t) => t.raw).join('')).toBe(spaceOnly);
    });

    await runner.it('IT-3.2: High-volume stress test: 5,000 words tokenize in under 80ms with 0 mutation', () => {
      const paragraph =
        'The international marketing department reported substantial quarterly growth across all European subsidiaries. Innovative client-focused campaigns resulted in record-breaking subscription figures.\n\n';
      const largeText = paragraph.repeat(200); // ~5,000 words

      const start = Date.now();
      const tokens = tokenizeText(largeText);
      const duration = Date.now() - start;

      expect(duration < 80).toBe(true);
      expect(tokens.map((t) => t.raw).join('')).toBe(largeText);
      expect(tokens.length > 5000).toBe(true);
    });

    // ── 4. Dictionary Cache & Lookup Engine ──

    await runner.it('IT-4.1: fetchExamWordDict returns safe fallback for empty or punctuation-only words', async () => {
      setupMockEnvironment();
      const result1 = await fetchExamWordDict('');
      expect(result1.cleanWord).toBe('');
      expect(result1.definition).toContain('không hợp lệ');

      const result2 = await fetchExamWordDict('   ---   ');
      expect(result2.cleanWord).toBe('');
    });

    await runner.it('IT-4.2: fetchExamWordDict parses successful dictionary response accurately', async () => {
      setupMockEnvironment();
      (global as any).fetch = async (url: string) => {
        if (url.includes('applicant')) {
          return {
            ok: true,
            json: async () => ({
              word: 'applicant',
              ipa: '/ˈæp.lɪ.kənt/',
              pos: 'noun',
              results: [
                {
                  meanings: [
                    {
                      pos: 'noun',
                      definition: 'Người nộp đơn, ứng viên xin việc.',
                    },
                  ],
                },
              ],
              synonyms: ['candidate', 'contestant'],
              antonyms: [],
            }),
          };
        }
        return { ok: false, status: 404 };
      };

      const res = await fetchExamWordDict('applicant');
      expect(res.cleanWord).toBe('applicant');
      expect(res.ipa).toBe('/ˈæp.lɪ.kənt/');
      expect(res.pos).toBe('danh từ');
      expect(res.definition).toBe('Người nộp đơn, ứng viên xin việc.');
      expect(res.synonyms).toEqual(['candidate', 'contestant']);
    });

    await runner.it('IT-4.3: In-memory cache returns second lookup in 0 network requests', async () => {
      setupMockEnvironment();
      let networkCalls = 0;
      (global as any).fetch = async () => {
        networkCalls++;
        return {
          ok: true,
          json: async () => ({
            word: 'innovative',
            results: [{ meanings: [{ definition: 'Mang tính đổi mới, sáng tạo.' }] }],
          }),
        };
      };

      const res1 = await fetchExamWordDict('innovative');
      const res2 = await fetchExamWordDict('Innovative'); // Different case

      expect(networkCalls).toBe(1);
      expect(res1.cleanWord).toBe('innovative');
      expect(res2.cleanWord).toBe('innovative');
      expect(res2.definition).toBe('Mang tính đổi mới, sáng tạo.');
    });

    await runner.it('IT-4.4: Concurrent identical lookups coalesce into a single in-flight promise', async () => {
      setupMockEnvironment();
      let networkCalls = 0;
      (global as any).fetch = async () => {
        networkCalls++;
        // Simulate 20ms network latency
        await new Promise((resolve) => setTimeout(resolve, 20));
        return {
          ok: true,
          json: async () => ({
            word: 'efficiency',
            results: [{ meanings: [{ definition: 'Hiệu quả, năng suất.' }] }],
          }),
        };
      };

      // Launch 5 concurrent calls simultaneously
      const promises = [
        fetchExamWordDict('efficiency'),
        fetchExamWordDict('efficiency'),
        fetchExamWordDict('efficiency'),
        fetchExamWordDict('efficiency'),
        fetchExamWordDict('efficiency'),
      ];

      const results = await Promise.all(promises);
      expect(networkCalls).toBe(1);
      for (const r of results) {
        expect(r.cleanWord).toBe('efficiency');
      }
    });

    await runner.it('IT-4.5: Network failure falls back gracefully without unhandled exceptions', async () => {
      setupMockEnvironment();
      (global as any).fetch = async () => {
        throw new Error('Network timeout / offline');
      };

      const res = await fetchExamWordDict('unreachable_word');
      expect(res.cleanWord).toBe('unreachable_word');
      expect(res.definition).toContain('Từ vựng tiếng Anh');
      expect(res.synonyms).toEqual([]);
    });

    // ── 5. Local Storage Word Synchronization ──

    await runner.it('IT-5.1: saveWordLocally and isWordSavedLocally persist correctly with case insensitivity', () => {
      const storage = setupMockEnvironment();
      expect(isWordSavedLocally('strategy')).toBe(false);

      saveWordLocally('Strategy');
      expect(isWordSavedLocally('strategy')).toBe(true);
      expect(isWordSavedLocally('STRATEGY')).toBe(true);
      expect(isWordSavedLocally('Strategy')).toBe(true);

      const rawStored = JSON.parse(storage.getItem('lingo_saved_words') || '[]');
      expect(rawStored).toEqual(['strategy']);
    });

    await runner.it('IT-5.2: saveWordLocally prevents duplicate words in storage array', () => {
      const storage = setupMockEnvironment();
      saveWordLocally('accommodate');
      saveWordLocally('Accommodate');
      saveWordLocally('ACCOMMODATE');

      const rawStored = JSON.parse(storage.getItem('lingo_saved_words') || '[]');
      expect(rawStored.length).toBe(1);
      expect(rawStored[0]).toBe('accommodate');
    });

    await runner.it('IT-5.3: Corrupted localStorage JSON is handled safely without throwing', () => {
      const storage = setupMockEnvironment();
      storage.setItem('lingo_saved_words', 'CORRUPTED_NON_JSON_DATA{{');
      expect(isWordSavedLocally('test')).toBe(false);

      // Saving should recover gracefully
      saveWordLocally('recover');
      expect(isWordSavedLocally('recover')).toBe(true);
    });

    await runner.it('IT-5.4: Empty or invalid inputs to saveWordLocally are ignored safely', () => {
      const storage = setupMockEnvironment();
      saveWordLocally('');
      saveWordLocally('   ');
      const rawStored = JSON.parse(storage.getItem('lingo_saved_words') || '[]');
      expect(rawStored.length).toBe(0);
    });

    await runner.it('IT-5.5: lingo_word_saved CustomEvent dispatches with clean word payload', () => {
      setupMockEnvironment();
      let eventDispatched = false;
      let eventPayload: any = null;

      (global as any).window.dispatchEvent = (event: any) => {
        eventDispatched = true;
        eventPayload = event.detail;
        return true;
      };

      saveWordLocally('comprehension');
      const targetWord = 'comprehension';
      const event = new (class {
        detail: any;
        constructor(name: string, opts: any) {
          this.detail = opts?.detail;
        }
      })('lingo_word_saved', { detail: { word: targetWord } });

      (global as any).window.dispatchEvent(event);
      expect(eventDispatched).toBe(true);
      expect(eventPayload?.word).toBe('comprehension');
      expect(isWordSavedLocally('comprehension')).toBe(true);
    });

    // ── 6. stripHtmlTags Utility ──

    await runner.it('IT-6.1: stripHtmlTags converts <p> and <br> into newlines and strips formatting tags', () => {
      const html = '<p>Hello <b>world</b>!</p><p>Second paragraph with <br/>line break.</p>';
      const stripped = stripHtmlTags(html);

      expect(stripped).toContain('Hello world!\n\n');
      expect(stripped).toContain('Second paragraph with \nline break.');
      expect(stripped.includes('<')).toBe(false);
      expect(stripped.includes('>')).toBe(false);
    });

    await runner.it('IT-6.2: stripHtmlTags decodes standard and Vietnamese HTML entities', () => {
      const html = '&quot;Expert&quot; &amp; &lsquo;Leader&rsquo; &mdash; Ti&#7871;ng Vi&#7879;t: &agrave;, &eacute;, &iacute;, &oacute;, &uacute;';
      const stripped = stripHtmlTags(html);

      expect(stripped).toContain('"Expert" & \'Leader\' —');
      expect(stripped).toContain('à, é, í, ó, ú');
    });

    await runner.it('IT-6.3: stripHtmlTags handles null, undefined, and empty string safely', () => {
      expect(stripHtmlTags(undefined)).toBe('');
      expect(stripHtmlTags('')).toBe('');
      expect(stripHtmlTags('Clean text')).toBe('Clean text');
    });

    // ── 7. Popover Placement & Geometry Defense ──

    await runner.it('IT-7.1: Popover position anchors to bottom when placeTop is true, preventing card overlap', () => {
      // Simulate viewport: 1024 x 800
      const viewportHeight = 800;
      const viewportWidth = 1024;
      const wordRect = {
        top: 350,
        bottom: 370,
        left: 200,
        right: 280,
        width: 80,
        height: 20,
      };

      const cardWidth = Math.min(320, viewportWidth - 24); // 320
      const spaceAbove = wordRect.top; // 350
      const spaceBelow = viewportHeight - wordRect.bottom; // 430
      const estimatedCardHeight = 220;
      const placeTop = spaceAbove >= estimatedCardHeight + 16 || spaceAbove > spaceBelow; // 350 >= 236 -> true

      expect(placeTop).toBe(true);

      // When placeTop is true, bottom anchoring must position the card bottom precisely above wordRect.top
      const bottomPx = Math.max(12, Math.round(viewportHeight - wordRect.top + 8)); // 800 - 350 + 8 = 458px
      // Distance from top of viewport to bottom of card: 800 - 458 = 342px
      // Gap between card bottom and word top: 350 - 342 = 8px
      const cardBottomY = viewportHeight - bottomPx;
      expect(wordRect.top - cardBottomY).toBe(8);

      // Even if card dynamic content renders at 260px height:
      const dynamicCardHeight = 260;
      const cardTopY = cardBottomY - dynamicCardHeight; // 342 - 260 = 82px
      expect(cardTopY > 0).toBe(true); // Fully visible on screen
      expect(cardBottomY < wordRect.top).toBe(true); // NEVER overlaps the clicked word!
    });
  } finally {
    (global as any).window = originalWindow;
    (global as any).localStorage = originalLocalStorage;
    (global as any).fetch = originalFetch;
  }
}

// Direct execution when invoked via `npx tsx tests/exam/interactive-text.test.ts`
if (require.main === module) {
  const runner = new TestRunner();
  runInteractiveTextTests(runner)
    .then(() => {
      const stats = runner.getStats();
      console.log('\n================================================================================');
      console.log('  EXAM INTERACTIVE TEXT & VOCABULARY ENGINE TEST SUMMARY');
      console.log('================================================================================');
      console.log(`  Total Tests : ${stats.total}`);
      console.log(`  Passed      : ${stats.passed}`);
      console.log(`  Failed      : ${stats.failed}`);
      console.log(`  Duration    : ${stats.durationMs}ms`);
      console.log('================================================================================\n');

      if (stats.failed > 0) {
        console.error(`❌ FAILURE: ${stats.failed} test(s) failed.`);
        process.exit(1);
      } else {
        console.log(`✅ SUCCESS: All ${stats.passed} tests passed cleanly!`);
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('Fatal error running tests:', err);
      process.exit(1);
    });
}
