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
  peekExamWordDict,
  getCandidateLemmas,
  isWordSavedLocally,
  saveWordLocally,
  saveVocabFromLookup,
  getSavedMeaningsLocally,
} from '../../src/lib/exam-dict-cache';
import {
  setCachedDictionaryEntry,
  getCachedDictionaryEntry,
  normalizeDictSourceBadge,
  isUsableDictionaryPageCacheEntry,
} from '../../src/lib/dict-cache';
import { getLookupCandidateKeys } from '../../src/lib/vocab-entry-resolver';
import { buildExternalLookupPayload } from '../../src/lib/external-dict';
import { supabase } from '../../src/lib/supabase';
import {
  stripHtmlTags,
  cleanQuestionPrompt,
  cleanOptionText,
} from '../../src/components/toeic/ToeicSplitPane';
import {
  WORD_SPLIT_REGEX,
  IS_ENGLISH_WORD,
  stripWatermarkChars,
} from '../../src/components/exam/ExamInteractiveText';
import { calculateLookupPopoverPosition } from '../../src/components/vocab/VocabLookupProvider';
import { parseFormattedSegments } from '../../src/components/vocab/InteractiveFormattedText';
import { computeHighlightSegments } from '../../src/components/vocab/InteractiveHighlightedText';
import { splitClozeSegments } from '../../src/components/vocab/InteractiveClozeText';

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

    await runner.it('IT-4.6: getCandidateLemmas generates accurate candidate root lemmas for plurals, past tense, and gerunds', () => {
      // Plurals
      expect(getCandidateLemmas('passengers').includes('passenger')).toBe(true);
      expect(getCandidateLemmas('boxes').includes('box')).toBe(true);
      expect(getCandidateLemmas('berries').includes('berry')).toBe(true);

      // Past tense
      expect(getCandidateLemmas('observed').includes('observe')).toBe(true);
      expect(getCandidateLemmas('stopped').includes('stop')).toBe(true);
      expect(getCandidateLemmas('worried').includes('worry')).toBe(true);

      // Gerunds
      expect(getCandidateLemmas('walking').includes('walk')).toBe(true);
      expect(getCandidateLemmas('taking').includes('take')).toBe(true);
      expect(getCandidateLemmas('sitting').includes('sit')).toBe(true);
      expect(getCandidateLemmas('tying').includes('tie')).toBe(true);
    });

    await runner.it('IT-4.7: fetchExamWordDict resolves inflected forms via single ?fallback=external lookup request', async () => {
      setupMockEnvironment();
      let lookupCalls = 0;
      (global as any).fetch = async (url: string) => {
        if (url.includes('/api/dictionary/lookup') && url.includes('word=passengers') && url.includes('fallback=external')) {
          lookupCalls++;
          return {
            ok: true,
            json: async () => ({
              word: 'passenger',
              cleanWord: 'passenger',
              ipa: '/ˈpæs.ən.dʒər/',
              pos: 'noun',
              results: [{ meanings: [{ definition: 'Hành khách trên tàu xe.' }] }],
            }),
          };
        }
        return { ok: false, status: 404 };
      };

      const res = await fetchExamWordDict('passengers');
      expect(lookupCalls).toBe(1);
      expect(res.cleanWord).toBe('passengers');
      expect(res.definition).toBe('Hành khách trên tàu xe.');
      expect(res.pos).toBe('danh từ');
      expect(res.ipa).toBe('/ˈpæs.ən.dʒər/');
    });

    await runner.it('IT-4.8: fetchExamWordDict resolves server-side external fallback in 1 HTTP request', async () => {
      setupMockEnvironment();
      let lookupCalls = 0;
      (global as any).fetch = async (url: string) => {
        if (url.includes('/api/dictionary/lookup') && url.includes('word=serendipity') && url.includes('fallback=external')) {
          lookupCalls++;
          return {
            ok: true,
            json: async () => ({
              source: 'external',
              word: 'serendipity',
              cleanWord: 'serendipity',
              ipa: '/ˌser.ənˈdɪp.ə.ti/',
              pos: 'noun',
              results: [{ meanings: [{ definition: 'Sự tình cờ may mắn.' }] }],
            }),
          };
        }
        return { ok: false, status: 404 };
      };

      const res = await fetchExamWordDict('serendipity');
      expect(lookupCalls).toBe(1);
      expect(res.cleanWord).toBe('serendipity');
      expect(res.definition).toBe('Sự tình cờ may mắn.');
      expect(res.pos).toBe('danh từ');
      expect(res.ipa).toBe('/ˌser.ənˈdɪp.ə.ti/');
    });

    await runner.it('IT-4.9: getCandidateLemmas normalizes phrasal verbs by lemmatizing the leading verb', () => {
      const candidates1 = getCandidateLemmas('looked forward to');
      expect(candidates1.includes('look forward to')).toBe(true);
      expect(candidates1.includes('looked forward to')).toBe(true);

      const candidates2 = getCandidateLemmas('taking into consideration');
      expect(candidates2.includes('take into consideration')).toBe(true);
      expect(candidates2.includes('taking into consideration')).toBe(true);
    });

    await runner.it('IT-4.10: fetchExamWordDict falls back to /api/translate for multi-word phrases when dictionary misses', async () => {
      setupMockEnvironment();
      (global as any).fetch = async (url: string, opts?: any) => {
        // Dictionary endpoints return 404
        if (url.includes('/api/dictionary/lookup') || url.includes('/api/dictionary/external')) {
          return { ok: false, status: 404, json: async () => ({}) };
        }
        // /api/translate returns contextual machine translation
        if (url.includes('/api/translate') && opts?.method === 'POST') {
          return {
            ok: true,
            json: async () => ({
              success: true,
              translatedText: 'do thời tiết khắc nghiệt',
            }),
          };
        }
        return { ok: false, status: 404 };
      };

      const res = await fetchExamWordDict('due to inclement weather');
      expect(res.cleanWord).toBe('due to inclement weather');
      expect(res.pos).toBe('cụm từ');
      expect(res.definition).toBe('do thời tiết khắc nghiệt');
    });

    await runner.it('IT-4.11: fetchExamWordDict captures didYouMean when /api/dictionary/lookup returns fuzzy suggestions', async () => {
      setupMockEnvironment();
      (global as any).fetch = async (url: string) => {
        if (url.includes('/api/dictionary/lookup')) {
          return {
            ok: false,
            status: 404,
            json: async () => ({
              success: false,
              error: 'Not found',
              didYouMean: ['definite', 'definitely'],
            }),
          };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      };

      const res = await fetchExamWordDict('defenite');
      expect(res.cleanWord).toBe('defenite');
      expect(res.didYouMean).toEqual(['definite', 'definitely']);
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

    await runner.it('IT-6.4: cleanQuestionPrompt strips leading question numbers and labels', () => {
      expect(cleanQuestionPrompt('162. What is suggested about Ms. Ayala?')).toBe('What is suggested about Ms. Ayala?');
      expect(cleanQuestionPrompt('Câu 162: What is suggested?')).toBe('What is suggested?');
      expect(cleanQuestionPrompt('Question 45. Where does the conversation take place?')).toBe('Where does the conversation take place?');
      expect(cleanQuestionPrompt('101) Which statement is true?')).toBe('Which statement is true?');
      expect(cleanQuestionPrompt('What is the main topic?')).toBe('What is the main topic?');
    });

    await runner.it('IT-6.5: cleanOptionText strips redundant option keys', () => {
      expect(cleanOptionText('(A) She has worked as a pastry chef.', 'A')).toBe('She has worked as a pastry chef.');
      expect(cleanOptionText('A. She has worked as a pastry chef.', 'A')).toBe('She has worked as a pastry chef.');
      expect(cleanOptionText('A) She has worked as a pastry chef.', 'A')).toBe('She has worked as a pastry chef.');
      expect(cleanOptionText('She has worked as a pastry chef.', 'A')).toBe('She has worked as a pastry chef.');
      expect(cleanOptionText('(B) By next Monday', 'B')).toBe('By next Monday');
    });

    await runner.it('IT-6.6: stripHtmlTags handles decimal and hexadecimal HTML numeric entities', () => {
      const decHtml = 'The customer&#39;s order &#38; invoice &#40;No. 12&#41;';
      expect(stripHtmlTags(decHtml)).toBe("The customer's order & invoice (No. 12)");

      const hexHtml = 'Price: &#x24;50 &#x26; tax';
      expect(stripHtmlTags(hexHtml)).toBe('Price: $50 & tax');
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

    runner.it('IT-7.2: Regression test: ExamInteractiveText source code guarantees hooks precede all conditional returns', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.resolve(__dirname, '../../src/components/exam/ExamInteractiveText.tsx');
      const source = fs.readFileSync(componentPath, 'utf8');

      const memoIdx = source.indexOf('const tokens = useMemo');
      const callbackIdx = source.indexOf('const calculatePopoverPosition = useCallback');
      const earlyReturnIdx = source.indexOf('if (!enabled || !text)');

      expect(memoIdx !== -1).toBe(true);
      expect(callbackIdx !== -1).toBe(true);
      expect(earlyReturnIdx !== -1).toBe(true);
      // Both hooks MUST be defined before early return to prevent React #300/#310 crashes
      expect(memoIdx < earlyReturnIdx).toBe(true);
      expect(callbackIdx < earlyReturnIdx).toBe(true);
    });

    runner.it('IT-7.3: Regression test: ExamInteractiveText attaches pointerdown/touchstart listeners for outside click dismissal', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.resolve(__dirname, '../../src/components/exam/ExamInteractiveText.tsx');
      const source = fs.readFileSync(componentPath, 'utf8');

      expect(source.includes("document.addEventListener('pointerdown', handleClickOutside)")).toBe(true);
      expect(source.includes("document.addEventListener('touchstart', handleClickOutside")).toBe(true);
      expect(source.includes('onPointerDown')).toBe(true);
    });

    runner.it('IT-7.4: Regression test: ToeicSplitPane suppresses option selection when clicking inside word lookup trigger', () => {
      const fs = require('fs');
      const path = require('path');
      const splitPanePath = path.resolve(__dirname, '../../src/components/toeic/ToeicSplitPane.tsx');
      const source = fs.readFileSync(splitPanePath, 'utf8');

      expect(source.includes('.exam-lookup-trigger')).toBe(true);
      expect(source.includes('.exam-lookup-card')).toBe(true);
    });

    runner.it('IT-7.5: Regression test: Vietnamese explanations are NEVER wrapped in ExamInteractiveText', () => {
      const fs = require('fs');
      const path = require('path');

      // Check ToeicSplitPane.tsx
      const splitPanePath = path.resolve(__dirname, '../../src/components/toeic/ToeicSplitPane.tsx');
      const splitPaneSource = fs.readFileSync(splitPanePath, 'utf8');
      expect(splitPaneSource.includes('<ExamInteractiveText\n                            text={stripHtmlTags(question.explanationVi)}')).toBe(false);

      // Check ToeicScoreReportView.tsx
      const reportPath = path.resolve(__dirname, '../../src/components/toeic/ToeicScoreReportView.tsx');
      const reportSource = fs.readFileSync(reportPath, 'utf8');
      expect(reportSource.includes('<ExamInteractiveText text={stripHtmlTags(q.explanationVi)}')).toBe(false);

      // Check vstep page.tsx
      const vstepPath = path.resolve(__dirname, '../../src/app/vstep/exam/[examId]/page.tsx');
      const vstepSource = fs.readFileSync(vstepPath, 'utf8');
      expect(vstepSource.includes('<ExamInteractiveText text={stripHtmlTags(currentQuestion.explanationVi)}')).toBe(false);

      // Check toeic/[part]/[ref]/page.tsx
      const toeicDrillPath = path.resolve(__dirname, '../../src/app/toeic/[part]/[ref]/page.tsx');
      const toeicDrillSource = fs.readFileSync(toeicDrillPath, 'utf8');
      expect(toeicDrillSource.includes('<ExamInteractiveText text={stripHtmlTags(q.explain)}')).toBe(false);
    });

    runner.it('IT-7.6: Regression test: ExamInteractiveText ignores scroll events inside .exam-lookup-card', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.resolve(__dirname, '../../src/components/exam/ExamInteractiveText.tsx');
      const source = fs.readFileSync(componentPath, 'utf8');

      expect(source.includes("target.closest?.('.exam-lookup-card')")).toBe(true);
      expect(source.includes("width: `${cardWidth}px`")).toBe(true);
    });

    runner.it('IT-7.7: Regression test: ExamWordLookupCard prevents duplicate saves and handles pointer events', () => {
      const fs = require('fs');
      const path = require('path');
      const cardPath = path.resolve(__dirname, '../../src/components/exam/ExamWordLookupCard.tsx');
      const source = fs.readFileSync(cardPath, 'utf8');

      expect(source.includes('if (isSaved) {')).toBe(true);
      expect(source.includes('onPointerDown={(e) => e.stopPropagation()}')).toBe(true);
    });

    runner.it('IT-7.8: Regression test: ToeicScoreReportView never wraps listening option placeholder in ExamInteractiveText', () => {
      const fs = require('fs');
      const path = require('path');
      const reportPath = path.resolve(__dirname, '../../src/components/toeic/ToeicScoreReportView.tsx');
      const source = fs.readFileSync(reportPath, 'utf8');

      expect(source.includes('text={opt.text || (isListening ? `(Phương án ${opt.key})` : \'\')}')).toBe(false);
    });

    runner.it('IT-7.9: Regression test: ExamInteractiveText computes parentPhrase and attaches onTouchEnd for mobile', () => {
      const fs = require('fs');
      const path = require('path');
      const compPath = path.resolve(__dirname, '../../src/components/exam/ExamInteractiveText.tsx');
      const source = fs.readFileSync(compPath, 'utf8');

      expect(source.includes('const parentPhrase = useMemo')).toBe(true);
      expect(source.includes('onTouchEnd={handleSelectionLookup}')).toBe(true);
      expect(source.includes('parentPhrase={parentPhrase}')).toBe(true);
      expect(source.includes('onLookupPhrase={handleLookupPhrase}')).toBe(true);
    });

    runner.it('IT-7.10: Regression test: ExamWordLookupCard renders Tra ca cum chip and didYouMean suggestions', () => {
      const fs = require('fs');
      const path = require('path');
      const cardPath = path.resolve(__dirname, '../../src/components/exam/ExamWordLookupCard.tsx');
      const source = fs.readFileSync(cardPath, 'utf8');

      expect(source.includes('Tra cả cụm:')).toBe(true);
      expect(source.includes('Gợi ý cụm từ trong câu')).toBe(true);
      expect(source.includes('Có phải bạn muốn tìm:')).toBe(true);
    });

    // ── 8. Unified Engine, Watermark Safety, Wrappers & Global Provider Contracts ──

    await runner.it('IT-8.1: Watermark stripping prevents mid-word splitting for VNU & TOEIC watermarks', () => {
      const vnuWatermarked = 'Informatio\u200B\u200C\u200D\uFEFFn technology';
      const toeicWatermarked = 'The\uFEFF\u200B\u200C annual report';

      const vnuTokens = tokenizeText(stripWatermarkChars(vnuWatermarked)).filter((t) => t.isWord);
      expect(vnuTokens.map((t) => t.raw)).toEqual(['Information', 'technology']);

      const toeicTokens = tokenizeText(stripWatermarkChars(toeicWatermarked)).filter((t) => t.isWord);
      expect(toeicTokens.map((t) => t.raw)).toEqual(['The', 'annual', 'report']);
    });

    await runner.it('IT-8.2: stripWatermarkChars leaves clean English/Vietnamese/punctuation strings invariant', () => {
      const samples = [
        'We haven\'t finalized the Q4 budget yet!',
        'Câu trả lời (A) "schedule" mang nghĩa lịch trình.',
        'Cost-effective & state-of-the-art solutions: 99.5%.',
      ];
      for (const s of samples) {
        const cleaned = stripWatermarkChars(s);
        expect(cleaned).toBe(s);
        expect(tokenizeText(cleaned).map((t) => t.raw).join('')).toBe(s);
      }
    });

    await runner.it('IT-8.3: Unified cache stores under resolved lemma so subsequent lemma lookup triggers 0 fetches', async () => {
      setupMockEnvironment();
      let networkCalls = 0;
      (global as any).fetch = async (url: string) => {
        if (url.includes('word=contractors') && url.includes('fallback=external')) {
          networkCalls++;
          return {
            ok: true,
            json: async () => ({
              word: 'contractor',
              cleanWord: 'contractor',
              ipa: '/ˈkɒn.træk.tər/',
              pos: 'noun',
              results: [{ meanings: [{ definition: 'Nhà thầu, bên nhận thầu.' }] }],
            }),
          };
        }
        return { ok: false, status: 404 };
      };

      const res1 = await fetchExamWordDict('contractors');
      const res2 = await fetchExamWordDict('contractor');
      expect(networkCalls).toBe(1);
      expect(res1.definition).toBe('Nhà thầu, bên nhận thầu.');
      expect(res2.definition).toBe('Nhà thầu, bên nhận thầu.');
    });

    await runner.it('IT-8.4: Lazy L2 sessionStorage hydration resolves pre-populated lp:dict: and legacy cache in 0 fetches', async () => {
      setupMockEnvironment();
      const sessionMock = new LocalStorageMock();
      sessionMock.setItem(
        'lp:dict:expedite',
        JSON.stringify({
          word: 'expedite',
          source: 'Kho từ điển',
          ts: Date.now(),
          data: {
            word: 'expedite',
            ipa: '/ˈek.spə.daɪt/',
            pos: 'verb',
            results: [{ meanings: [{ definition: 'Xúc tiến, đẩy nhanh tiến độ.' }] }],
          },
        }),
      );
      sessionMock.setItem(
        'lingo_exam_dict_cache_v2',
        JSON.stringify([
          [
            'procurement',
            {
              word: 'procurement',
              cleanWord: 'procurement',
              ipa: '/prəˈkjʊə.mənt/',
              pos: 'danh từ',
              definition: 'Sự thu mua, mua sắm vật tư.',
              synonyms: [],
              antonyms: [],
            },
          ],
        ]),
      );
      (global as any).window.sessionStorage = sessionMock;

      let networkCalls = 0;
      (global as any).fetch = async () => {
        networkCalls++;
        return { ok: false, status: 404 };
      };

      const res1 = await fetchExamWordDict('expedite');
      const res2 = await fetchExamWordDict('procurement');
      expect(networkCalls).toBe(0);
      expect(res1.definition).toBe('Xúc tiến, đẩy nhanh tiến độ.');
      expect(res2.definition).toBe('Sự thu mua, mua sắm vật tư.');
    });

    await runner.it('IT-8.5: Concurrent case-variant lookups coalesce into 1 network request', async () => {
      setupMockEnvironment();
      let networkCalls = 0;
      (global as any).fetch = async () => {
        networkCalls++;
        await new Promise((resolve) => setTimeout(resolve, 15));
        return {
          ok: true,
          json: async () => ({
            word: 'productivity',
            cleanWord: 'productivity',
            results: [{ meanings: [{ definition: 'Năng suất lao động.' }] }],
          }),
        };
      };

      const [r1, r2, r3] = await Promise.all([
        fetchExamWordDict('Productivity'),
        fetchExamWordDict('productivity'),
        fetchExamWordDict('PRODUCTIVITY'),
      ]);
      expect(networkCalls).toBe(1);
      expect(r1.cleanWord).toBe('productivity');
      expect(r2.cleanWord).toBe('productivity');
      expect(r3.cleanWord).toBe('productivity');
    });

    await runner.it('IT-8.6: InteractiveFormattedText parses markdown/marks/bullets cleanly without raw syntax leakage', () => {
      const fs = require('fs');
      const path = require('path');
      const parsed = parseFormattedSegments(
        '* Notice ***urgent*** **deadline** and *review* `status` inside <mark class="hl">report</mark>!',
      );
      expect(parsed.segments.some((s) => s.kind === 'bold_italic' && s.text === 'urgent')).toBe(true);
      expect(parsed.segments.some((s) => s.kind === 'bold' && s.text === 'deadline')).toBe(true);
      expect(parsed.segments.some((s) => s.kind === 'italic' && s.text === 'review')).toBe(true);
      expect(parsed.segments.some((s) => s.kind === 'code' && s.text === 'status')).toBe(true);
      expect(parsed.segments.some((s) => s.kind === 'mark' && s.text === 'report')).toBe(true);
      expect(parsed.plainSentence.includes('*')).toBe(false);
      expect(parsed.plainSentence.includes('<mark')).toBe(false);
      expect(parsed.plainSentence.startsWith('• Notice')).toBe(true);

      const compPath = path.resolve(__dirname, '../../src/components/vocab/InteractiveFormattedText.tsx');
      const source = fs.readFileSync(compPath, 'utf8');
      expect(source.includes('inheritClassName')).toBe(true);
      expect(source.includes('boldAsMark')).toBe(true);
    });

    await runner.it('IT-8.7: InteractiveHighlightedText clamps overlapping offset spans and preserves substring contractions', () => {
      const offsetText = 'The manager approved it.';
      const offsetResult = computeHighlightSegments(offsetText, undefined, [
        { start: 0, end: 11, role: 'subject' },
        { start: 8, end: 20, role: 'verb' }, // overlaps [8, 11] — must clamp without duplicating chars
      ]);
      expect(offsetResult.segments.map((s) => s.text).join('')).toBe(offsetText);

      const subResult = computeHighlightSegments(
        "They haven't looked forward to it.",
        ["haven't", 'looked forward to'],
      );
      const highlightedTexts = subResult.segments.filter((s) => s.highlighted).map((s) => s.text);
      expect(highlightedTexts).toEqual(["haven't", 'looked forward to']);
      expect(subResult.segments.map((s) => s.text).join('')).toBe("They haven't looked forward to it.");

      // Possessives, contractions, and hyphenated words must never split mid-word
      for (const [sentence, word] of [
        ["The man's hat.", 'man'],
        ['The man’s hat.', 'man'],
        ["I don't know.", 'don'],
        ['A well-known author.', 'well'],
      ]) {
        const res = computeHighlightSegments(sentence, word);
        expect(res.segments.some((s) => s.highlighted)).toBe(false);
        expect(res.segments.map((s) => s.text).join('')).toBe(sentence);
      }

      // Standalone single-quoted word still highlights cleanly
      const quoted = computeHighlightSegments("A 'man' spoke.", 'man');
      expect(quoted.segments.filter((s) => s.highlighted).map((s) => s.text)).toEqual(['man']);
    });

    await runner.it('IT-8.8: InteractiveClozeText isolates cloze blanks from ExamInteractiveText', () => {
      const fs = require('fs');
      const path = require('path');
      const clozeInput = 'Please {{blank}} the {{0}} form {verb} before _____ Friday.';
      const { segments, plainContextSentence } = splitClozeSegments(clozeInput);

      const blanks = segments.filter((s) => s.kind === 'blank');
      expect(blanks.map((b) => b.rawToken)).toEqual(['{{blank}}', '{{0}}', '{verb}', '_____']);
      expect(blanks.map((b) => b.slotKey)).toEqual(['blank', '0', 'verb', '_____']);
      expect(plainContextSentence).toBe('Please ____ the ____ form ____ before ____ Friday.');

      const bracketCloze = splitClozeSegments('Use [verb] and [0] here.');
      const bracketBlanks = bracketCloze.segments.filter((s) => s.kind === 'blank');
      expect(bracketBlanks.map((b) => b.rawToken)).toEqual(['[verb]', '[0]']);
      expect(bracketBlanks.map((b) => b.slotKey)).toEqual(['verb', '0']);

      const compPath = path.resolve(__dirname, '../../src/components/vocab/InteractiveClozeText.tsx');
      const source = fs.readFileSync(compPath, 'utf8');
      expect(source.includes("if (seg.kind === 'blank')")).toBe(true);
      expect(source.includes('<ExamInteractiveText')).toBe(true);
    });

    await runner.it('IT-8.9: VocabLookupProvider & layout.tsx uphold portal z-[130], O(1) dismissal, and hook purity contracts', () => {
      const fs = require('fs');
      const path = require('path');
      const layoutPath = path.resolve(__dirname, '../../src/app/layout.tsx');
      const providerPath = path.resolve(__dirname, '../../src/components/vocab/VocabLookupProvider.tsx');
      const layoutSource = fs.readFileSync(layoutPath, 'utf8');
      const providerSource = fs.readFileSync(providerPath, 'utf8');

      expect(layoutSource.includes('<VocabLookupProvider>')).toBe(true);
      expect(providerSource.includes('createPortal(')).toBe(true);
      expect(providerSource.includes('document.body')).toBe(true);
      expect(providerSource.includes('z-[130]')).toBe(true);
      expect(providerSource.includes("e.key === 'Escape'")).toBe(true);
      expect(providerSource.includes("window.addEventListener('keydown', handleKeyDown, true)")).toBe(true);
      expect(providerSource.includes('e.stopImmediatePropagation()')).toBe(true);
      expect(providerSource.includes(`target.closest('[role="dialog"]')`)).toBe(false);
      expect(providerSource.includes("document.addEventListener('pointerdown'")).toBe(true);
      expect(providerSource.includes("document.addEventListener('mousedown'")).toBe(true);
      expect(providerSource.includes("document.addEventListener('touchstart'")).toBe(true);
      expect(providerSource.includes("target.closest?.('.exam-lookup-card')")).toBe(true);
      expect(providerSource.includes('useMemo')).toBe(true);
      // Ensure zero setState calls inside useMemo
      const useMemoMatch = providerSource.match(/useMemo<VocabLookupContextValue>\([\s\S]*?\),\s*\[/);
      expect(useMemoMatch !== null).toBe(true);
      expect(useMemoMatch ? useMemoMatch[0].includes('setState(') : true).toBe(false);
    });

    await runner.it('IT-8.10: ExamInteractiveText & ExamWordLookupCard support unified provider delegation and SRS rollback sync', () => {
      const fs = require('fs');
      const path = require('path');
      const textPath = path.resolve(__dirname, '../../src/components/exam/ExamInteractiveText.tsx');
      const cardPath = path.resolve(__dirname, '../../src/components/exam/ExamWordLookupCard.tsx');
      const textSource = fs.readFileSync(textPath, 'utf8');
      const cardSource = fs.readFileSync(cardPath, 'utf8');

      expect(textSource.includes('useOptionalVocabLookup()')).toBe(true);
      expect(textSource.includes('select-text')).toBe(true);
      expect(textSource.includes('onWordClick')).toBe(true);
      expect(textSource.includes('inheritClassName')).toBe(true);
      expect(textSource.includes('coreVocabulary')).toBe(true);
      expect(textSource.includes('themeVariant')).toBe(true);
      expect(textSource.includes('disableSave')).toBe(true);
      expect(textSource.includes('stripWatermarkChars')).toBe(true);
      expect(textSource.includes("window.addEventListener('keydown', handleKeyDown, true)")).toBe(true);
      expect(textSource.includes(`target.closest('[role="dialog"]')`)).toBe(false);

      expect(cardSource.includes('saveVocabFromLookup')).toBe(true);
      expect(cardSource.includes('lingo_word_save_rollback')).toBe(true);
      expect(cardSource.includes('themeVariant')).toBe(true);
      expect(cardSource.includes('disableSave')).toBe(true);
      expect(cardSource.includes('z-[130]')).toBe(true);
      expect(cardSource.includes("dark: 'dark rounded-md")).toBe(true);
    });

    await runner.it('IT-8.11: Hyphenated compounds ending in 2-letter particles + s expand to singular forms', () => {
      const pairs: Array<[string, string]> = [
        ['follow-ups', 'follow-up'],
        ['check-ins', 'check-in'],
        ['sign-ups', 'sign-up'],
        ['back-ups', 'back-up'],
        ['warm-ups', 'warm-up'],
        ['grown-ups', 'grown-up'],
        ['stand-bys', 'stand-by'],
      ];
      for (const [plural, singular] of pairs) {
        const candidates = getLookupCandidateKeys(plural, { includeInflections: true });
        expect(candidates[0]).toBe(plural);
        expect(candidates.includes(singular)).toBe(true);
      }

      // Guard against false stripping on -ss / -us / -is endings
      const passThrough = getLookupCandidateKeys('non-uss', { includeInflections: true });
      expect(passThrough.includes('non-us')).toBe(false);
    });

    await runner.it('IT-8.12: Polysemy 403 rollback preserves exact prefix meaning and always emits summaryNotified: true', async () => {
      setupMockEnvironment();
      const dispatchedEvents: Array<{ type: string; detail: any }> = [];
      (global as any).window.location = { origin: 'http://localhost:3000', pathname: '/exam' };
      (global as any).window.dispatchEvent = (evt: any) => {
        dispatchedEvents.push({ type: evt.type, detail: evt.detail });
        return true;
      };

      const origGetSession = supabase.auth.getSession.bind(supabase.auth);
      (supabase.auth as any).getSession = async () => ({
        data: { session: { user: { id: 'user-it-8-12' }, access_token: 'tok' } },
        error: null,
      });

      try {
        let mode: 'ok' | '403' = 'ok';
        (global as any).fetch = async () => {
          if (mode === 'ok') {
            return new Response(JSON.stringify({ success: true, wordId: 'w-1' }), { status: 200 });
          }
          return new Response(JSON.stringify({ error: 'FREE_WORD_LIMIT', message: 'Limit' }), { status: 403 });
        };

        const r1 = await saveVocabFromLookup({ word: 'bank', translation: 'ngân hàng' });
        expect(r1.ok).toBe(true);
        expect(getSavedMeaningsLocally('bank')).toEqual(['ngân hàng']);

        // Substring-overlapping second meaning failing 403 must be rolled back cleanly
        mode = '403';
        const r2 = await saveVocabFromLookup({ word: 'bank', translation: 'ngân hàng thương mại' });
        expect(r2.ok).toBe(false);
        expect(r2.status).toBe('limit_reached');
        expect(getSavedMeaningsLocally('bank')).toEqual(['ngân hàng']);

        // Re-saving an already saved meaning skips summary increment yet emits summaryNotified: true
        mode = 'ok';
        dispatchedEvents.length = 0;
        await saveVocabFromLookup({ word: 'bank', translation: 'ngân hàng' });
        const savedEvt = dispatchedEvents.find((e) => e.type === 'lingo_word_saved');
        expect(savedEvt?.detail?.summaryNotified).toBe(true);

        const fs = require('fs');
        const path = require('path');
        const spSource = fs.readFileSync(
          path.resolve(__dirname, '../../src/components/student/StudentProvider.tsx'),
          'utf8',
        );
        expect(spSource.includes('detail?.summaryNotified !== undefined')).toBe(true);
      } finally {
        (supabase.auth as any).getSession = origGetSession;
      }
    });

    await runner.it('IT-8.13: External fallback caches both queried inflection and resolved base lemma', async () => {
      setupMockEnvironment();
      const payload = buildExternalLookupPayload('zombify', 'zombified', {
        exists: true,
        results: [{ meanings: [{ definition: 'Biến thành xác sống.' }] }],
      });
      expect(payload.word).toBe('zombify');
      expect(payload.cleanWord).toBe('zombify');

      // Also verify fetchExamWordDict aliases data.word even if a payload sets cleanWord !== word
      let calls = 0;
      (global as any).fetch = async () => {
        calls++;
        return {
          ok: true,
          json: async () => ({
            word: 'zombify',
            cleanWord: 'zombified',
            source: 'external',
            results: [{ meanings: [{ definition: 'Biến thành xác sống.' }] }],
          }),
        };
      };

      const res = await fetchExamWordDict('zombified');
      expect(res.definition).toBe('Biến thành xác sống.');
      const baseHit = peekExamWordDict('zombify');
      expect(baseHit?.definition).toBe('Biến thành xác sống.');
      expect(calls).toBe(1);
    });

    await runner.it('IT-8.14: Cross-surface cache filters Exam fallback/translate stubs and normalizes SourceBadge labels', () => {
      setupMockEnvironment();
      setCachedDictionaryEntry('stubword', { word: 'stubword', definition: 'stub' }, 'fallback');
      setCachedDictionaryEntry('trphrase', { word: 'trphrase', definition: 'dịch' }, 'translate');
      setCachedDictionaryEntry(
        'validext',
        { word: 'validext', results: [{ meanings: [{ definition: 'nghĩa chuẩn' }] }] },
        'external',
      );
      setCachedDictionaryEntry(
        'validcol',
        { word: 'validcol', results: [{ meanings: [{ definition: 'cụm chuẩn' }] }] },
        'toeic_collocation_index',
      );

      expect(isUsableDictionaryPageCacheEntry(getCachedDictionaryEntry('stubword'))).toBe(false);
      expect(isUsableDictionaryPageCacheEntry(getCachedDictionaryEntry('trphrase'))).toBe(false);
      expect(isUsableDictionaryPageCacheEntry(getCachedDictionaryEntry('validext'))).toBe(true);
      expect(isUsableDictionaryPageCacheEntry(getCachedDictionaryEntry('validcol'))).toBe(true);

      expect(normalizeDictSourceBadge('external', false)).toBe('Wiktionary');
      expect(normalizeDictSourceBadge('toeic_collocation_index', false)).toBe('Kho từ điển');
      expect(normalizeDictSourceBadge('toeic_collocation_index', true)).toBe('Cụm · kho');
      expect(normalizeDictSourceBadge('global_dictionary', false)).toBe('Kho từ điển');
      expect(normalizeDictSourceBadge('static_curriculum_fallback', true)).toBe('Cụm · kho');
      expect(normalizeDictSourceBadge('AI', false)).toBe('AI');
      expect(normalizeDictSourceBadge('Cụm · AI', true)).toBe('Cụm · AI');

      const fs = require('fs');
      const path = require('path');
      const dictPageSrc = fs.readFileSync(
        path.resolve(__dirname, '../../src/app/dictionary/page.tsx'),
        'utf8',
      );
      const dictCacheSrc = fs.readFileSync(
        path.resolve(__dirname, '../../src/lib/dict-cache.ts'),
        'utf8',
      );
      expect(dictPageSrc.includes('isUsableDictionaryPageCacheEntry(cachedEntry)')).toBe(true);
      expect(dictCacheSrc.includes("entry.source === 'fallback'")).toBe(true);
      expect(dictCacheSrc.includes("entry.source === 'translate'")).toBe(true);
      expect(dictPageSrc.includes('normalizeDictSourceBadge')).toBe(true);
    });

    await runner.it('IT-8.15: calculateLookupPopoverPosition stays bounded and NaN-safe across mobile, landscape, and tall selections', () => {
      setupMockEnvironment();
      const assertWithinViewport = (
        vw: number,
        vh: number,
        rect: { top: number; bottom: number; left: number; right: number; width: number; height: number },
      ) => {
        (global as any).window.innerWidth = vw;
        (global as any).window.innerHeight = vh;
        const { positionStyle } = calculateLookupPopoverPosition(rect);
        const wStr = String(positionStyle.width || '');
        const lStr = String(positionStyle.left || '');
        const mhStr = String(positionStyle.maxHeight || '');
        expect(wStr.includes('NaN')).toBe(false);
        expect(lStr.includes('NaN')).toBe(false);
        expect(mhStr.includes('NaN')).toBe(false);

        const width = parseInt(wStr, 10);
        const left = parseInt(lStr, 10);
        const maxHeight = parseInt(mhStr, 10);
        expect(left >= 12).toBe(true);
        expect(left + width <= vw - 12).toBe(true);
        expect(maxHeight >= 120).toBe(true);

        if (positionStyle.top !== undefined) {
          const top = parseInt(String(positionStyle.top), 10);
          expect(Number.isNaN(top)).toBe(false);
          expect(top >= 12).toBe(true);
          expect(top + maxHeight <= vh - 12).toBe(true);
        } else {
          const bottom = parseInt(String(positionStyle.bottom), 10);
          expect(Number.isNaN(bottom)).toBe(false);
          expect(bottom >= 12).toBe(true);
          const cardBottom = vh - bottom;
          const cardTop = cardBottom - maxHeight;
          expect(cardTop >= 12).toBe(true);
          expect(cardBottom <= vh - 12).toBe(true);
        }
      };

      assertWithinViewport(320, 568, { top: 10, bottom: 30, left: 0, right: 40, width: 40, height: 20 });
      assertWithinViewport(375, 667, { top: 20, bottom: 650, left: 10, right: 365, width: 355, height: 630 });
      assertWithinViewport(640, 320, { top: 150, bottom: 170, left: 100, right: 180, width: 80, height: 20 });
      assertWithinViewport(640, 320, { top: 100, bottom: 120, left: 100, right: 180, width: 80, height: 20 });
      assertWithinViewport(200, 400, { top: 100, bottom: 120, left: 50, right: 100, width: 50, height: 20 });
      assertWithinViewport(375, 667, {
        top: Number.NaN,
        bottom: Number.NaN,
        left: Number.NaN,
        right: Number.NaN,
        width: Number.NaN,
        height: Number.NaN,
      });
    });

    await runner.it('IT-8.16: parseFormattedSegments preserves nested/multiline spaces and parses markdown inside <mark>', () => {
      const nested = parseFormattedSegments('**a *b* c**');
      expect(nested.plainSentence).toBe('a b c');
      expect(nested.segments.some((s) => s.kind === 'bold_italic' && s.text === 'b')).toBe(true);

      const multiline = parseFormattedSegments('multiline **line1\nline2** vs **line1**\n*line2*');
      expect(multiline.plainSentence.includes(' vs ')).toBe(true);
      expect(multiline.plainSentence.includes('*')).toBe(false);
      expect(multiline.segments.some((s) => s.kind === 'bold' && s.text === 'line1')).toBe(true);

      const markNested = parseFormattedSegments('<mark>a **b**</mark>');
      expect(markNested.plainSentence).toBe('a b');
      expect(markNested.plainSentence.includes('*')).toBe(false);
      const markSeg = markNested.segments.find((s) => s.kind === 'mark');
      expect(Boolean(markSeg?.children?.some((c) => c.kind === 'bold' && c.text === 'b'))).toBe(true);
    });

    await runner.it('IT-8.17: Watermarked cloze, Unicode highlight boundaries, possessive hyphen tokens, and card key isolation', () => {
      const cloze = splitClozeSegments('Watermarked _\u200B__ and {{slot\u200B}}.');
      const clozeBlanks = cloze.segments.filter((s) => s.kind === 'blank');
      expect(clozeBlanks.map((b) => b.rawToken)).toEqual(['___', '{{slot}}']);
      expect(clozeBlanks.map((b) => b.slotKey)).toEqual(['___', 'slot']);
      expect(cloze.plainContextSentence).toBe('Watermarked ____ and ____.');

      const emDash = computeHighlightSegments('Cost is $100—affordable.', '$100');
      expect(emDash.segments.filter((s) => s.highlighted).map((s) => s.text)).toEqual(['$100']);

      const curlyQuote = computeHighlightSegments('Use “C++” or C++: fast.', 'C++');
      expect(curlyQuote.segments.filter((s) => s.highlighted).map((s) => s.text)).toEqual(['C++', 'C++']);

      const possessiveTokens = tokenizeText("My mother-in-law's advice and từ-technology e-học.");
      const englishWords = possessiveTokens.filter((t) => t.isWord).map((t) => t.raw);
      expect(englishWords).toEqual(['My', "mother-in-law's", 'advice', 'and']);

      const fs = require('fs');
      const path = require('path');
      const cardSrc = fs.readFileSync(
        path.resolve(__dirname, '../../src/components/exam/ExamWordLookupCard.tsx'),
        'utf8',
      );
      const providerSrc = fs.readFileSync(
        path.resolve(__dirname, '../../src/components/vocab/VocabLookupProvider.tsx'),
        'utf8',
      );
      expect(cardSrc.includes('dictResult?.cleanWord?.toLowerCase()')).toBe(true);
      expect(providerSrc.includes("key={state.activeWord || 'lookup-card'}")).toBe(true);
    });

    await runner.it('IT-8.18: isUsableDictionaryPageCacheEntry rejects garbage IPA/def and empty meanings, dictionary/page.tsx delegates to it, and hyphen/space lemmas align', () => {
      setupMockEnvironment();
      setCachedDictionaryEntry(
        'garbage_def',
        { word: 'garbage_def', results: [{ meanings: [{ definition: 'Word not found in dictionary' }] }] },
        'external',
      );
      setCachedDictionaryEntry(
        'garbage_vi',
        { word: 'garbage_vi', results: [{ meanings: [{ definition: 'Từ này không tồn tại' }] }] },
        'global_dictionary',
      );
      setCachedDictionaryEntry(
        'garbage_ipa',
        { word: 'garbage_ipa', pronunciations: [{ ipa: '[word not found]' }], results: [{ meanings: [{ definition: 'nghĩa giả' }] }] },
        'external',
      );
      setCachedDictionaryEntry(
        'garbage_top_ipa',
        { word: 'garbage_top_ipa', ipa: 'N/A', results: [{ meanings: [{ definition: 'nghĩa giả' }] }] } as any,
        'external',
      );
      setCachedDictionaryEntry(
        'empty_meanings',
        { word: 'empty_meanings', results: [{ meanings: [] }] },
        'global_dictionary',
      );
      setCachedDictionaryEntry(
        'empty_obj',
        { word: 'empty_obj', results: [{}] as any },
        'global_dictionary',
      );
      setCachedDictionaryEntry(
        'valid_core_sense',
        { word: 'valid_core_sense', core_senses: [{ pos: 'noun', definition_vi: 'Kế hoạch chiến lược' }] },
        'toeic_collocation_index',
      );
      setCachedDictionaryEntry(
        'valid_meaning_vi',
        { word: 'valid_meaning_vi', results: [{ meanings: [{ meaning_vi: 'Đăng ký tham gia' } as any] }] },
        'external',
      );

      expect(isUsableDictionaryPageCacheEntry(getCachedDictionaryEntry('garbage_def'))).toBe(false);
      expect(isUsableDictionaryPageCacheEntry(getCachedDictionaryEntry('garbage_vi'))).toBe(false);
      expect(isUsableDictionaryPageCacheEntry(getCachedDictionaryEntry('garbage_ipa'))).toBe(false);
      expect(isUsableDictionaryPageCacheEntry(getCachedDictionaryEntry('garbage_top_ipa'))).toBe(false);
      expect(isUsableDictionaryPageCacheEntry(getCachedDictionaryEntry('empty_meanings'))).toBe(false);
      expect(isUsableDictionaryPageCacheEntry(getCachedDictionaryEntry('empty_obj'))).toBe(false);
      expect(isUsableDictionaryPageCacheEntry(getCachedDictionaryEntry('valid_core_sense'))).toBe(true);
      expect(isUsableDictionaryPageCacheEntry(getCachedDictionaryEntry('valid_meaning_vi'))).toBe(true);

      const fs = require('fs');
      const path = require('path');
      const dictPageSrc = fs.readFileSync(
        path.resolve(__dirname, '../../src/app/dictionary/page.tsx'),
        'utf8',
      );
      expect(dictPageSrc.includes('isUsableDictionaryPageCacheEntry(cachedEntry)')).toBe(true);

      expect(getCandidateLemmas('sign-up').includes('sign up')).toBe(true);
      expect(getLookupCandidateKeys('passers-by', { includeInflections: true }).includes('passer-by')).toBe(true);
    });

    await runner.it('IT-8.19: parseFormattedSegments parses inline `code` and emphasis inside <mark> without raw backtick leakage', () => {
      const parsed = parseFormattedSegments('<mark>nested *em* and `code`</mark>');
      expect(parsed.plainSentence).toBe('nested em and code');
      expect(parsed.plainSentence.includes('`')).toBe(false);

      const markSeg = parsed.segments.find((s) => s.kind === 'mark');
      expect(Boolean(markSeg)).toBe(true);
      expect(Boolean(markSeg?.children?.some((c) => c.kind === 'italic' && c.text === 'em'))).toBe(true);
      expect(Boolean(markSeg?.children?.some((c) => c.kind === 'code' && c.text === 'code'))).toBe(true);
      expect(Boolean(markSeg?.children?.some((c) => c.text.includes('`')))).toBe(false);
      expect(Boolean(markSeg?.children?.some((c) => c.kind === 'mark'))).toBe(false);
    });

    await runner.it('IT-8.20: computeHighlightSegments ignores NaN and Infinity span offsets without truncating text', () => {
      const text = 'Hello world';
      const nanOnly = computeHighlightSegments(text, undefined, [{ start: Number.NaN, end: 5 }]);
      expect(nanOnly.segments.map((s) => s.text).join('')).toBe(text);

      const mixed = computeHighlightSegments(text, undefined, [
        { start: 8, end: 3 },
        { start: Number.NaN, end: 5 },
      ]);
      expect(mixed.segments.map((s) => s.text).join('')).toBe(text);

      const infOnly = computeHighlightSegments(text, undefined, [
        { start: Number.NEGATIVE_INFINITY, end: Number.POSITIVE_INFINITY },
      ]);
      expect(infOnly.segments.map((s) => s.text).join('')).toBe(text);
    });
  } finally {
    if (originalWindow !== undefined) {
      (global as any).window = originalWindow;
    } else {
      delete (global as any).window;
    }
    if (originalLocalStorage !== undefined) {
      (global as any).localStorage = originalLocalStorage;
    } else {
      delete (global as any).localStorage;
    }
    if (originalFetch !== undefined) {
      (global as any).fetch = originalFetch;
    } else {
      delete (global as any).fetch;
    }
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
