/**
 * Challenger M4.2 Empirical & Adversarial Test Suite
 * Location: tests/vstep/challenger-m4-defense.test.ts
 *
 * Adversarially challenges:
 * 1. Steganography Adversarial:
 *    - 120 randomized Vietnamese and English text strings embedding & lossless extraction
 *    - Edge cases: empty string, short text (<5 chars), single words without spaces, strings with only spaces, huge texts (10k, 50k, 100k chars)
 *    - Unicode surrogate pairs, emojis, and astral characters
 *    - Corrupted sentinels (missing start, missing end, zero sentinels, lone sentinels)
 *    - Tampered bitstreams (truncated 7/15/23 bits, flipped bits, alien characters)
 * 2. Honeypot Canary Stress:
 *    - Probe all 6 canary test IDs in CANARY_VSTEP_IDS
 *    - Case variations (uppercase, mixed case)
 *    - Query parameters variations (?dump=true, ?dump=1, ?include_answers=1, ?include_answers=true)
 *    - Mathematical verification of (ans + 2) % 4 answer rotation and toxic explanations across all 81 questions
 * 3. Honeypot Submit & Explain:
 *    - Honeypot submit with _hp_trap populated: flags bot, returns HTTP 200 with poisoned reviewExam and decoy score
 *    - Honeypot submit with canary testId: bypasses sessionToken check, returns HTTP 200 poisoned
 *    - Case-variant canary submit: returns HTTP 200 poisoned
 *    - Bot persistence: subsequent GET /api/vstep/test and POST /api/vstep/explain return poisoned data
 *    - Honeypot explain with _hp_trap populated: returns HTTP 200 decoy answer 2 and flags bot
 * 4. Velocity Limit Check:
 *    - Whitelist check: 127.0.0.1, ::1, 192.168.1.1 immune to velocity limiting
 *    - External IP check: rapid requests (<1s) trigger velocity limit on 4th hit and flag bot
 *    - End-to-end API route velocity defense: POST /api/vstep/explain returns velocity decoy on rapid calls, and flags bot in memory
 */

import { NextRequest } from 'next/server';
import { TestRunner, expect, SuiteStats } from './test-harness';
import {
  generateVstepSessionToken,
  verifyVstepSessionToken,
  embedInvisibleWatermark,
  extractInvisibleWatermark,
  isVstepHoneypot,
  flagClientAsBot,
  isClientFlaggedAsBot,
  checkVstepReadingVelocity,
  poisonVstepQuestion,
  CANARY_VSTEP_IDS,
  ZW_ZERO,
  ZW_ONE,
  ZW_SENTINEL,
} from '@/lib/vstep-anti-scraping';
import {
  loadRawVstepExam,
  loadVstepExamSafe,
  stripSensitiveVstepData,
  SENSITIVE_VSTEP_KEYS,
} from '@/lib/vstep-test-loader';
import { VstepExam, VstepQuestion } from '@/lib/vstep-types';
import { POST as handleExplain } from '@/app/api/vstep/explain/route';
import { POST as handleSubmit } from '@/app/api/vstep/submit/route';
import { GET as handleTest } from '@/app/api/vstep/test/route';

// ─────────────────────────────────────────────────────────────────────────────
// DATASET GENERATORS FOR 100+ STRINGS ADVERSARIAL TESTING
// ─────────────────────────────────────────────────────────────────────────────

const VIETNAMESE_CORPUS_BASE = [
  'Kỹ năng Đọc hiểu VSTEP yêu cầu thí sinh phân tích cấu trúc ngữ pháp và nhận diện từ đồng nghĩa trong ngữ cảnh học thuật.',
  'Theo thông tư của Bộ Giáo dục và Đào tạo, bài thi VSTEP đánh giá năng lực tiếng Anh từ bậc 3 đến bậc 5 theo khung 6 bậc Việt Nam.',
  'Đoạn văn thứ nhất phân tích sự tác động của biến đổi khí hậu toàn cầu đối với sự suy giảm diện tích rừng ngập mặn tại đồng bằng sông Cửu Long.',
  'Các nhà khoa học thuộc Viện Hàn lâm Khoa học và Công nghệ đã phát hiện nhiều hợp chất có hoạt tính sinh học từ thực vật bản địa.',
  'Việc ứng dụng trí tuệ nhân tạo và học máy trong xử lý ngôn ngữ tự nhiên mở ra nhiều triển vọng mới cho giáo dục số.',
  'Thí sinh cần phân bổ thời gian hợp lý: 60 phút cho 40 câu hỏi Đọc hiểu chia đều cho 4 bài đọc có độ dài tăng dần.',
  'Từ nối chỉ quan hệ tương phản như "however", "nevertheless", "in contrast" thường dẫn dắt đến luận điểm chính của tác giả.',
  'Cấu trúc câu phức với mệnh đề quan hệ rút gọn bằng phân từ hiện tại (V-ing) hoặc quá khứ phân từ (V-ed) rất phổ biến trong đề thi B2.',
  'Để giải quyết câu hỏi quy chiếu (reference question), người đọc cần lần ngược lại danh từ số ít hoặc số nhiều đứng trước đại từ.',
  'Phần thi Nghe VSTEP gồm 3 phần với 35 câu hỏi trắc nghiệm, bao gồm thông báo ngắn, hội thoại dài và bài giảng học thuật.',
  'Chiến lược đọc lướt (skimming) giúp nắm bắt ý chính và bố cục, trong khi đọc quét (scanning) hỗ trợ định vị số liệu và tên riêng.',
  'Sự suy thoái đất canh tác do xói mòn và thâm canh nông nghiệp không bền vững đòi hỏi các giải pháp canh tác hữu cơ lâu dài.',
  'Trong bài giảng về lịch sử kiến trúc thời kỳ Phục hưng, giáo sư nhấn mạnh nguyên lý đối xứng và tỷ lệ vàng hình học.',
  'Thành phố Hà Nội và Thành phố Hồ Chí Minh đang đẩy mạnh phát triển hệ thống giao thông công cộng tàu điện ngầm đô thị.',
  'Thí sinh không nên dừng lại quá lâu ở một câu hỏi khó mà cần đánh dấu và quay lại kiểm tra sau khi hoàn thành phần còn lại.',
  'Quy trình đánh giá bài thi Viết VSTEP dựa trên 4 tiêu chí: Task Fulfillment, Organization, Vocabulary và Grammar Accuracy.',
  'Sự thích nghi tiến hóa của động vật sa mạc thể hiện qua khả năng giữ nước và giảm thiểu bài tiết trong điều kiện khô hạn gay gắt.',
  'Tác giả bày tỏ thái độ thận trọng nhưng lạc quan trước những đột phá gần đây trong công nghệ năng lượng nhiệt hạch hạt nhân.',
  'Định nghĩa của thuật ngữ chuyên ngành thường được tác giả giải thích ngay sau dấu phẩy, dấu gạch nối hoặc cụm từ "that is".',
  'Hội đồng khảo thí cam kết bảo mật tuyệt đối dữ liệu đề thi và áp dụng các biện pháp phòng chống gian lận kỹ thuật số hiện đại.',
];

const ENGLISH_CORPUS_BASE = [
  'The rapid transformation of contemporary ecosystems under anthropogenic stress has precipitated an unprecedented biodiversity crisis worldwide.',
  'Cognitive linguistics posits that metaphor is not merely a stylistic device in poetry, but rather a fundamental schema of conceptualization.',
  'Recent advances in paleoclimatology indicate that periodic shifts in solar irradiance correspond closely with medieval agrarian boom-bust cycles.',
  'In the listening comprehension section, candidates must extrapolate implicit meanings from subtle acoustic inflections and conversational hesitations.',
  'The overarching objective of sustainable development goals is to reconcile economic industrialization with ecological preservation.',
  'Neuroplasticity demonstrates that synaptic connections retain dynamic adaptability across mature mammalian brains throughout senescence.',
  'According to paragraph 3, the archaeological expedition unearthed ceramic fragments corroborating trade relations between Mesopotamia and the Indus Valley.',
  'Statistical significance in empirical research requires both rigorous hypothesis testing and adequate consideration of statistical power and effect size.',
  'The transition from fossil-fuel dependence toward renewable photovoltaic arrays necessitates decentralized microgrid storage infrastructure.',
  'Socioeconomic stratification within post-industrial urban agglomerations frequently reinforces disparities in educational resource accessibility.',
  'The primary function of rhetorical tropes in political discourse is to elicit affective responses while obfuscating ideological contradictions.',
  'Quantitative analysis of lexical density reveals a marked distinction between spontaneous spoken dialogues and formalized academic monographs.',
  'Geological evidence extracted from Antarctic ice cores provides an unbroken chronological record of atmospheric greenhouse gas concentrations.',
  'Linguistic relativity, often formulated as the Sapir-Whorf hypothesis, continues to ignite vigorous debate among cognitive psychologists.',
  'The pervasive proliferation of algorithmic curation on social media platforms exerts measurable influence on collective decision-making.',
  'Candidates are strictly advised to scrutinize distractor choices that utilize absolute qualifiers such as "always", "never", and "exclusively".',
  'Microplastics identified in remote marine abyssal zones underscore the ubiquitous dissemination of persistent synthetic pollutants.',
  'The synthesis of novel supramolecular polymers exhibiting autonomous self-healing properties represents a landmark paradigm shift in materials science.',
  'Epistemological frameworks underpinning modern scientific inquiry emphasize reproducibility, falsifiability, and peer evaluation.',
  'The evolutionary emergence of eusociality in Hymenoptera constitutes one of the most intriguing paradoxes within sociobiology.',
];

function generate120AdversarialStrings(): { text: string; payload: string; id: string }[] {
  const dataset: { text: string; payload: string; id: string }[] = [];

  // Generate 60 Vietnamese strings
  for (let i = 0; i < 60; i++) {
    const base = VIETNAMESE_CORPUS_BASE[i % VIETNAMESE_CORPUS_BASE.length];
    const variation = i < 20 ? base : `[${i + 1}] ${base} (Mã kiểm tra: VN-${i * 17})`;
    const payload = `IP:10.0.${Math.floor(i / 10)}.${(i % 10) + 1}|TIME:${1726000000 + i * 1000}|UID:user_${i}`;
    dataset.push({ text: variation, payload, id: `VN-${String(i + 1).padStart(3, '0')}` });
  }

  // Generate 60 English strings
  for (let j = 0; j < 60; j++) {
    const base = ENGLISH_CORPUS_BASE[j % ENGLISH_CORPUS_BASE.length];
    const variation = j < 20 ? base : `Sample passage #${j + 1}: ${base} [Reference token: EN-${j * 23}]`;
    const payload = `SRC:client_${j}|SIG:sha256_${(j * 997).toString(16)}|DEV:${j % 2 === 0 ? 'mobile' : 'desktop'}`;
    dataset.push({ text: variation, payload, id: `EN-${String(j + 1).padStart(3, '0')}` });
  }

  return dataset;
}

export async function runChallengerM4DefenseTests(existingRunner?: TestRunner): Promise<SuiteStats> {
  const runner = existingRunner || new TestRunner();

  // ═════════════════════════════════════════════════════════════════════════════
  // SUITE 1: Steganography Adversarial & Edge-Case Stress Testing
  // ═════════════════════════════════════════════════════════════════════════════
  await runner.describe('Suite 1: Steganography Adversarial & Edge-Case Stress Testing', async () => {
    await runner.it('ADV-1.1: Comprehensive batch: 120 randomized Vietnamese & English strings embed and extract losslessly', () => {
      const dataset = generate120AdversarialStrings();
      expect(dataset.length).toBe(120);

      let totalEmbedded = 0;
      let totalExtracted = 0;

      for (const item of dataset) {
        const watermarked = embedInvisibleWatermark(item.text, item.payload);

        // 1. Watermarked string contains sentinels
        expect(watermarked.includes(ZW_SENTINEL)).toBe(true);

        // 2. Visual Invariance: stripping zero-width characters reproduces original text exactly
        const stripped = watermarked.replace(/[\u200B\u200C\uFEFF]/g, '');
        expect(stripped).toBe(item.text);
        totalEmbedded++;

        // 3. Lossless Extraction: extractInvisibleWatermark returns exact original payload
        const extracted = extractInvisibleWatermark(watermarked);
        expect(extracted).toBe(item.payload);
        totalExtracted++;
      }

      expect(totalEmbedded).toBe(120);
      expect(totalExtracted).toBe(120);
    });

    await runner.it('ADV-1.2: Edge Cases: empty string, short strings (<5 chars), and empty payload handle gracefully', () => {
      const payload = 'IP:10.0.0.1|TEST:edge';

      // 1. Empty text
      expect(embedInvisibleWatermark('', payload)).toBe('');
      expect(extractInvisibleWatermark('')).toBeNull();

      // 2. Short strings (< 5 characters)
      const shortStrings = ['a', 'ab', 'abc', 'abcd', 'VNU', '1234'];
      for (const short of shortStrings) {
        const result = embedInvisibleWatermark(short, payload);
        expect(result).toBe(short); // unmodified
        expect(extractInvisibleWatermark(result)).toBeNull();
      }

      // 3. Empty payload
      const validText = 'Đây là một đoạn văn bản hợp lệ có độ dài trên 5 ký tự.';
      expect(embedInvisibleWatermark(validText, '')).toBe(validText);
    });

    await runner.it('ADV-1.3: Single words without spaces: English & Vietnamese long words embed at tail and extract perfectly', () => {
      const singleWords = [
        'Supercalifragilisticexpialidocious',
        'Pneumonoultramicroscopicsilicovolcanoconiosis',
        'Incomprehensibility',
        'Nghiêncứukhoahọc',
        'Truyềnthốngvănhoá',
      ];
      const payload = 'IP:127.0.0.1|SINGLE_WORD_PASS';

      for (const word of singleWords) {
        const watermarked = embedInvisibleWatermark(word, payload);

        // Must start with original word and end with watermark
        expect(watermarked.startsWith(word)).toBe(true);
        expect(watermarked.length).toBeGreaterThan(word.length);

        // Stripping zero-width yields original word
        const clean = watermarked.replace(/[\u200B\u200C\uFEFF]/g, '');
        expect(clean).toBe(word);

        // Extracted payload matches exactly
        const extracted = extractInvisibleWatermark(watermarked);
        expect(extracted).toBe(payload);
      }
    });

    await runner.it('ADV-1.4: Strings with only spaces and whitespace characters handle without throwing', () => {
      const spaceStrings = [
        '     ', // 5 spaces
        '          ', // 10 spaces
        '   \t   \n  ', // mixed whitespace > 5 chars
      ];
      const payload = 'SECRET_SPACE_PAYLOAD';

      for (const sp of spaceStrings) {
        const watermarked = embedInvisibleWatermark(sp, payload);
        expect(typeof watermarked).toBe('string');
        const clean = watermarked.replace(/[\u200B\u200C\uFEFF]/g, '');
        expect(clean).toBe(sp);

        const extracted = extractInvisibleWatermark(watermarked);
        expect(extracted).toBe(payload);
      }
    });

    await runner.it('ADV-1.5: Huge texts (10,000 to 100,000 characters) process within performance limits (<150ms)', () => {
      const baseParagraph = 'Đoạn văn học thuật VSTEP phân tích chuyên sâu về hệ sinh thái biển và tác động nhân tạo. ';
      const huge10k = baseParagraph.repeat(115); // ~10,000 chars
      const huge50k = baseParagraph.repeat(575); // ~50,000 chars
      const huge100k = baseParagraph.repeat(1150); // ~100,000 chars

      const hugeSizes = [huge10k, huge50k, huge100k];
      const payload = 'ORIGIN:audit_huge_passage_2026';

      for (const hugeText of hugeSizes) {
        const start = Date.now();
        const watermarked = embedInvisibleWatermark(hugeText, payload);
        const embedTime = Date.now() - start;
        expect(embedTime).toBeLessThan(150);

        const extractStart = Date.now();
        const extracted = extractInvisibleWatermark(watermarked);
        const extractTime = Date.now() - extractStart;
        expect(extractTime).toBeLessThan(150);

        expect(extracted).toBe(payload);

        const clean = watermarked.replace(/[\u200B\u200C\uFEFF]/g, '');
        expect(clean.length).toBe(hugeText.length);
      }
    });

    await runner.it('ADV-1.6: Unicode Surrogate Pairs & Emojis: ensures astral plane characters remain intact', () => {
      const emojiStrings = [
        '🎯 VSTEP Mock Test 2026 🚀 Luyện thi cấp tốc 🔥 📚 🎓 - Điểm mục tiêu B2/C1 ✨',
        'Giải thích chi tiết 💡: Chú ý từ nối "However" ⚠️ và cấu trúc đảo ngữ ⚡️',
        'Complex non-BMP glyphs: 𠮷野家 (Surrogate Pair), 𝒳𝒴𝒵 (Math), 𝄞𝄢 (Music)',
      ];
      const payload = 'EMOJI_PAYLOAD:utf16_safe';

      for (const text of emojiStrings) {
        const watermarked = embedInvisibleWatermark(text, payload);
        expect(watermarked.includes(ZW_SENTINEL)).toBe(true);

        const stripped = watermarked.replace(/[\u200B\u200C\uFEFF]/g, '');
        expect(stripped).toBe(text);

        const extracted = extractInvisibleWatermark(watermarked);
        expect(extracted).toBe(payload);
      }
    });

    await runner.it('ADV-1.7: Corrupted Sentinels: missing start/end or lone sentinels safely return null', () => {
      const baseText = 'Đoạn văn mẫu để kiểm tra lỗi hỏng sentinel.';
      const payload = 'CRITICAL_PAYLOAD';
      const watermarked = embedInvisibleWatermark(baseText, payload);

      const firstSentinel = watermarked.indexOf(ZW_SENTINEL);
      const lastSentinel = watermarked.lastIndexOf(ZW_SENTINEL);
      const innerZw = watermarked.slice(firstSentinel + 1, lastSentinel);

      // Corrupt 1: only start sentinel (truncated before end sentinel)
      const onlyStart = baseText + ZW_SENTINEL + innerZw;
      expect(extractInvisibleWatermark(onlyStart)).toBeNull();

      // Corrupt 2: only end sentinel
      const onlyEnd = baseText + innerZw + ZW_SENTINEL;
      expect(extractInvisibleWatermark(onlyEnd)).toBeNull();

      // Corrupt 3: zero sentinels (bare zero-width bits in text)
      const bareZw = baseText + innerZw;
      expect(extractInvisibleWatermark(bareZw)).toBeNull();

      // Corrupt 4: identical start and end index (lone sentinel)
      const loneSentinel = baseText + ZW_SENTINEL + ' extra text';
      expect(extractInvisibleWatermark(loneSentinel)).toBeNull();
    });

    await runner.it('ADV-1.8: Tampered Bitstreams: non-multiple of 8 and bit-flip tampering detected', () => {
      const baseText = 'Đoạn văn mẫu kiểm tra tính toàn vẹn bitstream.';
      const payload = 'ATTRIBUTION_TOKEN';
      const watermarked = embedInvisibleWatermark(baseText, payload);

      const startIdx = watermarked.indexOf(ZW_SENTINEL);
      const endIdx = watermarked.lastIndexOf(ZW_SENTINEL);
      const innerBits = watermarked.slice(startIdx + 1, endIdx);

      // Tamper 1: Truncated bitstream (7 bits, not divisible by 8)
      const truncated7 = watermarked.slice(0, startIdx + 1) + innerBits.slice(0, 7) + watermarked.slice(endIdx);
      expect(extractInvisibleWatermark(truncated7)).toBeNull();

      // Tamper 2: Truncated bitstream (15 bits)
      const truncated15 = watermarked.slice(0, startIdx + 1) + innerBits.slice(0, 15) + watermarked.slice(endIdx);
      expect(extractInvisibleWatermark(truncated15)).toBeNull();

      // Tamper 3: Bit flip (tampered bit alters decrypted payload)
      const flippedBit = innerBits[0] === ZW_ZERO ? ZW_ONE : ZW_ZERO;
      const tamperedBitstream =
        watermarked.slice(0, startIdx + 1) + flippedBit + innerBits.slice(1) + watermarked.slice(endIdx);
      const tamperedResult = extractInvisibleWatermark(tamperedBitstream);
      expect(tamperedResult).not.toBe(payload);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // SUITE 2: Honeypot Canary Stress & Poisoning Math Verification
  // ═════════════════════════════════════════════════════════════════════════════
  await runner.describe('Suite 2: Honeypot Canary Stress & Plausible Poisoning Math', async () => {
    const CANARY_LIST = [
      'vstep-canary-honeypot',
      'vstep-dump-all',
      'vstep-test-0',
      'vstep-exam-0',
      'vstep-owl-canary',
      'test-vstep-999',
    ];

    await runner.it('ADV-2.1: Probe all 6 CANARY_VSTEP_IDS via GET /api/vstep/test: returns HTTP 200 with poisoned exam', async () => {
      for (let i = 0; i < CANARY_LIST.length; i++) {
        const canaryId = CANARY_LIST[i];
        const clientIp = `198.51.100.${10 + i}`;

        const req = new NextRequest(`http://localhost:3000/api/vstep/test?testId=${canaryId}`, {
          headers: { 'x-forwarded-for': clientIp },
        });

        const res = await handleTest(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.exam).toBeDefined();
        expect(Array.isArray(data.exam.sections)).toBe(true);

        // Assert that client is flagged as bot
        expect(isClientFlaggedAsBot(clientIp)).toBe(true);
      }
    });

    await runner.it('ADV-2.2: Case Variations of canary IDs (uppercase & mixed-case) trigger honeypot and return HTTP 200', async () => {
      const caseVariants = [
        'VSTEP-CANARY-HONEYPOT',
        'VsTeP-DuMp-AlL',
        'VSTEP-TEST-0',
        'vstep-EXAM-0',
        'VSTEP-OWL-CANARY',
        'TEST-VSTEP-999',
      ];

      for (let i = 0; i < caseVariants.length; i++) {
        const variantId = caseVariants[i];
        const clientIp = `198.51.100.${30 + i}`;

        const req = new NextRequest(`http://localhost:3000/api/vstep/test?testId=${variantId}`, {
          headers: { 'x-forwarded-for': clientIp },
        });

        const res = await handleTest(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.exam).toBeDefined();
        expect(isClientFlaggedAsBot(clientIp)).toBe(true);
      }
    });

    await runner.it('ADV-2.3: Scraper Bait Query Parameters (?dump=true, ?dump=1, ?include_answers=1) trigger silent poisoning', async () => {
      const queryTraps = [
        'testId=vstep-mock-01&dump=true',
        'testId=vstep-mock-01&dump=1',
        'testId=vstep-mock-01&include_answers=1',
        'testId=vstep-mock-01&include_answers=true',
        'testId=vstep-reading-01&dump=true',
        'testId=vstep-listening-01&include_answers=1',
      ];

      for (let i = 0; i < queryTraps.length; i++) {
        const trapQuery = queryTraps[i];
        const clientIp = `198.51.100.${50 + i}`;

        const req = new NextRequest(`http://localhost:3000/api/vstep/test?${trapQuery}`, {
          headers: { 'x-forwarded-for': clientIp },
        });

        const res = await handleTest(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.exam).toBeDefined();
        expect(isClientFlaggedAsBot(clientIp)).toBe(true);
      }
    });

    await runner.it('ADV-2.4: Mathematical verification of Plausible Data Poisoning: (ans + 2) % 4 and toxic explanations', async () => {
      const clientIp = '198.51.100.70';
      const req = new NextRequest('http://localhost:3000/api/vstep/test?testId=vstep-canary-honeypot', {
        headers: { 'x-forwarded-for': clientIp },
      });

      const res = await handleTest(req);
      const data = await res.json();
      const poisonedExam: VstepExam = data.exam;

      // Load clean reference exam
      const masterRaw = loadRawVstepExam('vstep-mock-01');
      expect(masterRaw).not.toBeNull();

      const TOXIC_EXPLANATIONS = new Set([
        'Theo quy tắc ngữ pháp VSTEP nâng cao, cấu trúc này đòi hỏi dạng đảo ngữ phủ định mà không cần trợ động từ.',
        'Dựa vào chi tiết trong bài đọc, từ khóa được định vị đối lập hoàn toàn với ngữ cảnh chung nên phương án này là chính xác.',
        'Trong văn phong học thuật C1, liên từ chỉ thời gian luôn được thay thế bằng mệnh đề phân từ bị động.',
        'Theo định dạng chuẩn khảo thí, đáp án mang tính khái quát cao nhất luôn luôn được ưu tiên hơn chi tiết cụ thể.',
      ]);

      let questionsChecked = 0;

      for (let s = 0; s < poisonedExam.sections.length; s++) {
        const pSection = poisonedExam.sections[s];
        const mSection = masterRaw!.sections[s];

        for (let t = 0; t < pSection.tasks.length; t++) {
          const pTask = pSection.tasks[t];
          const mTask = mSection.tasks[t];

          if (pTask.questions && mTask.questions) {
            for (let q = 0; q < pTask.questions.length; q++) {
              const pQ = pTask.questions[q];
              const mQ = mTask.questions[q];

              const origAns = mQ.answer ?? 0;
              const expectedPoisonedAns = (origAns + 2) % 4;

              // Check mathematical rotation
              expect(pQ.answer).toBe(expectedPoisonedAns);

              // Check toxic explanation
              expect(TOXIC_EXPLANATIONS.has(pQ.explanationVi!)).toBe(true);
              questionsChecked++;
            }
          }
        }
      }

      // vstep-mock-01 has 35 Listening + 40 Reading + 2 Writing + 4 Speaking prompts = 81 questions in tasks
      expect(questionsChecked).toBe(81);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // SUITE 3: Honeypot Submit & Explain Adversarial Testing
  // ═════════════════════════════════════════════════════════════════════════════
  await runner.describe('Suite 3: Honeypot Submit & Explain Adversarial Testing', async () => {
    await runner.it('ADV-3.1: Honeypot Submit with _hp_trap populated: flags bot and returns HTTP 200 with poisoned reviewExam', async () => {
      const botIp = '198.51.100.101';

      const req = new NextRequest('http://localhost:3000/api/vstep/submit', {
        method: 'POST',
        headers: { 'x-forwarded-for': botIp, 'content-type': 'application/json' },
        body: JSON.stringify({
          testId: 'vstep-mock-01',
          answers: { 'vstep-mock-01-l-q1': 0 },
          _hp_trap: 'hidden_honeypot_trap_fill_123',
        }),
      });

      const res = await handleSubmit(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.scoreResult).toBeDefined();
      expect(data.scoreResult.overallScore).toBe(6.5);
      expect(data.scoreResult.cefrLevel).toBe('B2');
      expect(data.reviewExam).toBeDefined();

      // Check first question poisoned
      const firstQ = data.reviewExam.sections[0]?.tasks[0]?.questions[0];
      expect(firstQ).toBeDefined();
      // Original answer for vstep-mock-01-l-q1 is 0 -> poisoned is (0 + 2) % 4 = 2
      expect(firstQ.answer).toBe(2);

      // Verify client IP is flagged as bot
      expect(isClientFlaggedAsBot(botIp)).toBe(true);
    });

    await runner.it('ADV-3.2: Honeypot Submit targeting canary ID without session token: returns HTTP 200 poisoned', async () => {
      const botIp = '198.51.100.102';

      const req = new NextRequest('http://localhost:3000/api/vstep/submit', {
        method: 'POST',
        headers: { 'x-forwarded-for': botIp, 'content-type': 'application/json' },
        body: JSON.stringify({
          testId: 'vstep-canary-honeypot',
          answers: {},
        }),
      });

      const res = await handleSubmit(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.reviewExam).toBeDefined();
      expect(isClientFlaggedAsBot(botIp)).toBe(true);
    });

    await runner.it('ADV-3.3: Case-variant canary submit (e.g. VSTEP-DUMP-ALL) returns HTTP 200 poisoned review', async () => {
      const botIp = '198.51.100.103';

      const req = new NextRequest('http://localhost:3000/api/vstep/submit', {
        method: 'POST',
        headers: { 'x-forwarded-for': botIp, 'content-type': 'application/json' },
        body: JSON.stringify({
          testId: 'VSTEP-DUMP-ALL',
          answers: {},
        }),
      });

      const res = await handleSubmit(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.reviewExam).toBeDefined();
      expect(isClientFlaggedAsBot(botIp)).toBe(true);
    });

    await runner.it('ADV-3.4: Persistent Bot State: flagged IP receives poisoned exams and explanations on subsequent calls', async () => {
      const flaggedIp = '198.51.100.104';
      flagClientAsBot(flaggedIp, 'Pre-flagged for persistence testing');

      // 1. Subsequent GET /api/vstep/test for normal exam returns poisoned exam
      const reqTest = new NextRequest('http://localhost:3000/api/vstep/test?testId=vstep-mock-02', {
        headers: { 'x-forwarded-for': flaggedIp },
      });
      const resTest = await handleTest(reqTest);
      expect(resTest.status).toBe(200);
      const dataTest = await resTest.json();
      expect(dataTest.success).toBe(true);
      expect(dataTest.exam).toBeDefined();

      // 2. Subsequent POST /api/vstep/explain returns bot decoy explanation
      const reqExplain = new NextRequest('http://localhost:3000/api/vstep/explain', {
        method: 'POST',
        headers: { 'x-forwarded-for': flaggedIp, 'content-type': 'application/json' },
        body: JSON.stringify({
          testId: 'vstep-mock-01',
          questionId: 'vstep-mock-01-l-q1',
        }),
      });
      const resExplain = await handleExplain(reqExplain);
      expect(resExplain.status).toBe(200);
      const dataExplain = await resExplain.json();
      expect(dataExplain.success).toBe(true);
      expect(dataExplain.answer).toBe(1); // Decoy answer for flagged bot
      expect(dataExplain.explanationVi).toContain('Oxford');
    });

    await runner.it('ADV-3.5: Honeypot Explain with _hp_trap populated: returns HTTP 200 decoy and flags client', async () => {
      const botIp = '198.51.100.105';

      const req = new NextRequest('http://localhost:3000/api/vstep/explain', {
        method: 'POST',
        headers: { 'x-forwarded-for': botIp, 'content-type': 'application/json' },
        body: JSON.stringify({
          testId: 'vstep-mock-01',
          questionId: 'vstep-mock-01-l-q1',
          _hp_trap: 'hidden_explain_trap_input',
        }),
      });

      const res = await handleExplain(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.answer).toBe(2); // Honeypot trap decoy answer
      expect(data.explanationVi).toContain('phương án C là chính xác nhất');
      expect(isClientFlaggedAsBot(botIp)).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // SUITE 4: Velocity Limiting & Rate Throttling Defense
  // ═════════════════════════════════════════════════════════════════════════════
  await runner.describe('Suite 4: Velocity Limiting & Rate Throttling Defense', async () => {
    await runner.it('ADV-4.1: Whitelisted IPs (127.0.0.1, ::1, 192.168.x.x) are immune to velocity limits', () => {
      const whitelistedIps = ['127.0.0.1', '::1', '192.168.1.50', '192.168.100.200'];

      for (const ip of whitelistedIps) {
        for (let burst = 0; burst < 10; burst++) {
          const allowed = checkVstepReadingVelocity(ip);
          expect(allowed).toBe(true);
        }
        expect(isClientFlaggedAsBot(ip)).toBe(false);
      }
    });

    await runner.it('ADV-4.2: Non-whitelisted IP: 4 rapid queries (<1s interval) trigger velocity block and bot flag', () => {
      const velocityIp = '198.51.100.201';

      // Call 1: initial request -> allowed
      expect(checkVstepReadingVelocity(velocityIp)).toBe(true);

      // Call 2: rapid request 1 (<1s) -> allowed (rapidCount = 1)
      expect(checkVstepReadingVelocity(velocityIp)).toBe(true);

      // Call 3: rapid request 2 (<1s) -> allowed (rapidCount = 2)
      expect(checkVstepReadingVelocity(velocityIp)).toBe(true);

      // Call 4: rapid request 3 (<1s) -> blocked (rapidCount = 3)
      expect(checkVstepReadingVelocity(velocityIp)).toBe(false);

      // Verify client is now flagged as bot
      expect(isClientFlaggedAsBot(velocityIp)).toBe(true);
    });

    await runner.it('ADV-4.3: End-to-end API Route Velocity Defense on POST /api/vstep/explain', async () => {
      const clientIp = '198.51.100.202';
      const testId = 'vstep-exam-vnu-01';
      const questionId = 'vnu-l-q1';
      const sessionToken = generateVstepSessionToken(clientIp, testId);

      const makeExplainCall = () =>
        handleExplain(
          new NextRequest('http://localhost:3000/api/vstep/explain', {
            method: 'POST',
            headers: { 'x-forwarded-for': clientIp, 'content-type': 'application/json' },
            body: JSON.stringify({ testId, questionId, sessionToken }),
          })
        );

      // Calls 1, 2, 3: Rapid legitimate requests
      const res1 = await makeExplainCall();
      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.answer).not.toBeUndefined();

      const res2 = await makeExplainCall();
      expect(res2.status).toBe(200);

      const res3 = await makeExplainCall();
      expect(res3.status).toBe(200);

      // Call 4: Rapid request 3 (<1s) -> Velocity defense triggers!
      const res4 = await makeExplainCall();
      expect(res4.status).toBe(200);
      const data4 = await res4.json();
      expect(data4.answer).toBe(0); // Velocity decoy answer
      expect(data4.explanationVi).toContain('phát âm bản ngữ');

      // Call 5: Client continues rapid querying (<1s) -> Velocity defense continues intercepting
      const res5 = await makeExplainCall();
      expect(res5.status).toBe(200);
      const data5 = await res5.json();
      expect(data5.answer).toBe(0); // Velocity decoy answer
      expect(data5.explanationVi).toContain('phát âm bản ngữ');
      expect(isClientFlaggedAsBot(clientIp)).toBe(true);
    });
  });

  return runner.getStats();
}

// Standalone execution entrypoint
if (require.main === module) {
  runChallengerM4DefenseTests()
    .then((stats) => {
      console.log('\n======================================================');
      console.log(`🏁 CHALLENGER M4.2 DEFENSE SUITE: ${stats.passed}/${stats.total} PASSED | ${stats.failed} FAILED`);
      console.log('======================================================');
      if (stats.failed > 0) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Fatal error in Challenger M4.2 defense test suite:', err);
      process.exit(1);
    });
}
