import { getRouter } from '@/lib/ai-router';
import { geminiGenerate, hasGeminiKeys } from '@/lib/gemini-multi';
import type { ExtractedPhrase, PhraseType } from '@/types/translation';

const phraseCache = new Map<string, { timestamp: number; phrases: ExtractedPhrase[] }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 500;

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/i, '');
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '');
  if (cleaned.endsWith('```')) cleaned = cleaned.replace(/\s*```$/, '');
  return cleaned.trim();
}

/**
 * Ngân hàng các cụm từ & thành ngữ công sở / đàm thoại tần suất cao (Fast Lexical Index).
 * Giúp nhận diện tức thì trong 0ms mà không cần gọi mạng hoặc khi AI gặp sự cố.
 */
interface LexicalEntry {
  regex: RegExp;
  phrase: string;
  baseForm: string;
  meaningVi: string;
  type: PhraseType;
  ipa?: string;
  example?: string;
}

const HIGH_FREQUENCY_LEXICAL_INDEX: LexicalEntry[] = [
  {
    regex: /\btake\s+(?:this|that|it)?\s*offline\b/i,
    phrase: 'take this offline',
    baseForm: 'take offline',
    meaningVi: 'trao đổi riêng về việc này sau',
    type: 'phrasal_verb',
    ipa: '/teɪk ˌɒfˈlaɪn/',
    example: "Let's take this offline and discuss later.",
  },
  {
    regex: /\bpark\s+(?:this|that|the\s+idea|the\s+thought)\b/i,
    phrase: 'park this',
    baseForm: 'park this',
    meaningVi: 'tạm gác lại để bàn sau',
    type: 'idiom',
    ipa: '/pɑːrk ðɪs/',
    example: "Let's park this discussion for now.",
  },
  {
    regex: /\bcircle\s+back\b/i,
    phrase: 'circle back',
    baseForm: 'circle back',
    meaningVi: 'quay lại trao đổi về vấn đề này sau',
    type: 'phrasal_verb',
    ipa: '/ˈsɜːrkl bæk/',
    example: 'We will circle back on this next week.',
  },
  {
    regex: /\btable\s+(?:this|that|the)\s+(?:discussion|motion|issue|matter)\b/i,
    phrase: 'table this discussion',
    baseForm: 'table a discussion',
    meaningVi: 'tạm gác cuộc thảo luận lại',
    type: 'idiom',
    ipa: '/ˈteɪbl ə dɪˈskʌʃn/',
    example: 'The board decided to table this discussion.',
  },
  {
    regex: /\btouch\s+base\b/i,
    phrase: 'touch base',
    baseForm: 'touch base',
    meaningVi: 'liên hệ nhanh để cập nhật tình hình',
    type: 'collocation',
    ipa: '/tʌtʃ beɪs/',
    example: "Let's touch base before Friday's demo.",
  },
  {
    regex: /\b(?:keep|put)\s+(?:me|us|someone)\s+in\s+the\s+loop\b/i,
    phrase: 'keep in the loop',
    baseForm: 'in the loop',
    meaningVi: 'nhớ cập nhật thông tin liên tục',
    type: 'idiom',
    ipa: '/ɪn ðə luːp/',
    example: 'Please keep me in the loop.',
  },
  {
    regex: /\bon\s+the\s+same\s+page\b/i,
    phrase: 'on the same page',
    baseForm: 'on the same page',
    meaningVi: 'thống nhất quan điểm, cùng hiểu nhau',
    type: 'idiom',
    ipa: '/ɒn ðə seɪm peɪdʒ/',
    example: "Make sure we're all on the same page.",
  },
  {
    regex: /\bcall\s+it\s+a\s+day\b/i,
    phrase: 'call it a day',
    baseForm: 'call it a day',
    meaningVi: 'kết thúc ngày làm việc, nghỉ ngơi',
    type: 'idiom',
    ipa: '/kɔːl ɪt ə deɪ/',
    example: "It's late, let's call it a day.",
  },
  {
    regex: /\bup\s+in\s+the\s+air\b/i,
    phrase: 'up in the air',
    baseForm: 'up in the air',
    meaningVi: 'chưa được quyết định, còn bỏ ngỏ',
    type: 'idiom',
    ipa: '/ʌp ɪn ði eər/',
    example: 'The launch date is still up in the air.',
  },
  {
    regex: /\boff\s+the\s+record\b/i,
    phrase: 'off the record',
    baseForm: 'off the record',
    meaningVi: 'giữ kín, không ghi biên bản chính thức',
    type: 'idiom',
    ipa: '/ɒf ðə ˈrɛkɔːd/',
    example: 'This conversation is off the record.',
  },
  {
    regex: /\blook(?:ed|ing|s)?\s+forward\s+to\b/i,
    phrase: 'look forward to',
    baseForm: 'look forward to',
    meaningVi: 'trông mong, háo hức chờ đợi',
    type: 'phrasal_verb',
    ipa: '/lʊk ˈfɔːrwərd tuː/',
    example: 'I look forward to hearing from you.',
  },
  {
    regex: /\bput(?:ting)?\s+off\b/i,
    phrase: 'put off',
    baseForm: 'put off',
    meaningVi: 'trì hoãn, dời lại',
    type: 'phrasal_verb',
    ipa: '/pʊt ɒf/',
    example: 'We decided to put off the meeting.',
  },
  {
    regex: /\bgive(?:s|ing|n)?\s+up\b/i,
    phrase: 'give up',
    baseForm: 'give up',
    meaningVi: 'từ bỏ, bỏ cuộc',
    type: 'phrasal_verb',
    ipa: '/ɡɪv ʌp/',
    example: 'Never give up on your dreams.',
  },
  {
    regex: /\btake(?:s|ing|n)?\s+after\b/i,
    phrase: 'take after',
    baseForm: 'take after',
    meaningVi: 'giống ai đó (ngoại hình, tính nết)',
    type: 'phrasal_verb',
    ipa: '/teɪk ˈɑːftər/',
    example: 'She takes after her mother.',
  },
  {
    regex: /\brun(?:ning|s)?\s+out\s+of\b/i,
    phrase: 'run out of',
    baseForm: 'run out of',
    meaningVi: 'hết sạch, cạn kiệt',
    type: 'phrasal_verb',
    ipa: '/rʌn aʊt ɒv/',
    example: 'We are running out of time.',
  },
  {
    regex: /\bcarry(?:ing|ies|ied)?\s+out\b/i,
    phrase: 'carry out',
    baseForm: 'carry out',
    meaningVi: 'tiến hành, thực hiện',
    type: 'phrasal_verb',
    ipa: '/ˈkæri aʊt/',
    example: 'The team will carry out the plan.',
  },
  {
    regex: /\bbring(?:s|ing)?\s+up\b/i,
    phrase: 'bring up',
    baseForm: 'bring up',
    meaningVi: 'nêu lên, đề cập tới',
    type: 'phrasal_verb',
    ipa: '/brɪŋ ʌp/',
    example: 'He brought up an important issue.',
  },
  {
    regex: /\bcall(?:s|ing|ed)?\s+off\b/i,
    phrase: 'call off',
    baseForm: 'call off',
    meaningVi: 'hủy bỏ (cuộc họp, sự kiện)',
    type: 'phrasal_verb',
    ipa: '/kɔːl ɒf/',
    example: 'They called off the concert.',
  },
  {
    regex: /\bturn(?:s|ing|ed)?\s+down\b/i,
    phrase: 'turn down',
    baseForm: 'turn down',
    meaningVi: 'từ chối (lời mời, đề nghị)',
    type: 'phrasal_verb',
    ipa: '/tɜːn daʊn/',
    example: 'She turned down the job offer.',
  },
  {
    regex: /\bcome(?:s|ing)?\s+up\s+with\b/i,
    phrase: 'come up with',
    baseForm: 'come up with',
    meaningVi: 'nảy ra, nghĩ ra (ý tưởng)',
    type: 'phrasal_verb',
    ipa: '/kʌm ʌp wɪð/',
    example: 'We came up with a great idea.',
  },
  {
    regex: /\bthink(?:ing)?\s+outside\s+the\s+box\b/i,
    phrase: 'think outside the box',
    baseForm: 'think outside the box',
    meaningVi: 'tư duy sáng tạo, đột phá',
    type: 'idiom',
    ipa: '/θɪŋk ˌaʊtˈsaɪd ðə bɒks/',
    example: 'We must think outside the box.',
  },
  {
    regex: /\bbreak(?:ing)?\s+the\s+ice\b/i,
    phrase: 'break the ice',
    baseForm: 'break the ice',
    meaningVi: 'phá vỡ bầu không khí ngại ngùng',
    type: 'idiom',
    ipa: '/breɪk ði aɪs/',
    example: 'He told a joke to break the ice.',
  },
  {
    regex: /\bunder\s+the\s+weather\b/i,
    phrase: 'under the weather',
    baseForm: 'under the weather',
    meaningVi: 'hơi mệt, khó ở trong người',
    type: 'idiom',
    ipa: '/ˈʌndə ðə ˈwɛðər/',
    example: 'I feel a bit under the weather.',
  },
  {
    regex: /\ba\s+piece\s+of\s+cake\b/i,
    phrase: 'a piece of cake',
    baseForm: 'a piece of cake',
    meaningVi: 'rất dễ dàng, dễ như trở bàn tay',
    type: 'idiom',
    ipa: '/ə piːs ɒv keɪk/',
    example: 'The exam was a piece of cake.',
  },
  {
    regex: /\bbite\s+the\s+bullet\b/i,
    phrase: 'bite the bullet',
    baseForm: 'bite the bullet',
    meaningVi: 'cắn răng chịu đựng, ngậm đắng nuốt cay',
    type: 'idiom',
    ipa: '/baɪt ðə ˈbʊlɪt/',
    example: 'I had to bite the bullet and pay the bill.',
  },
  {
    regex: /\bhit\s+the\s+nail\s+on\s+the\s+head\b/i,
    phrase: 'hit the nail on the head',
    baseForm: 'hit the nail on the head',
    meaningVi: 'nói đúng phóc, chỉ đúng mấu chốt',
    type: 'idiom',
    ipa: '/hɪt ðə neɪl ɒn ðə hɛd/',
    example: 'You hit the nail on the head.',
  },
  {
    regex: /\blet\s+the\s+cat\s+out\s+of\s+the\s+bag\b/i,
    phrase: 'let the cat out of the bag',
    baseForm: 'let the cat out of the bag',
    meaningVi: 'để lộ bí mật',
    type: 'idiom',
    ipa: '/lɛt ðə kæt aʊt ɒv ðə bæɡ/',
    example: 'Who let the cat out of the bag?',
  },
  {
    regex: /\bcost(?:s|ing)?\s+an\s+arm\s+and\s+a\s+leg\b/i,
    phrase: 'cost an arm and a leg',
    baseForm: 'cost an arm and a leg',
    meaningVi: 'cực kỳ đắt đỏ',
    type: 'idiom',
    ipa: '/kɒst ən ɑːm ænd ə lɛɡ/',
    example: 'This car costs an arm and a leg.',
  },
  {
    regex: /\bonce\s+in\s+a\s+blue\s+moon\b/i,
    phrase: 'once in a blue moon',
    baseForm: 'once in a blue moon',
    meaningVi: 'năm thì mười họa, rất hiếm khi',
    type: 'idiom',
    ipa: '/wʌns ɪn ə bluː muːn/',
    example: 'I only eat out once in a blue moon.',
  },
  {
    regex: /\bsee\s+eye\s+to\s+eye\b/i,
    phrase: 'see eye to eye',
    baseForm: 'see eye to eye',
    meaningVi: 'đồng thuận, cùng chung chí hướng',
    type: 'idiom',
    ipa: '/siː aɪ tuː aɪ/',
    example: 'They rarely see eye to eye.',
  },
  {
    regex: /\b(?:am|is|are|was|were|be|been)\s+(?:really\s+)?into\b/i,
    phrase: 'be into',
    baseForm: 'be into something',
    meaningVi: 'say mê, có hứng thú sâu sắc',
    type: 'idiom',
    ipa: '/biː ˈɪntuː/',
    example: 'I am really into specialty coffee lately.',
  },
  {
    regex: /\bhardly\s+had\b[\s\S]*?\bwhen\b/i,
    phrase: 'hardly had... when',
    baseForm: 'hardly had... when',
    meaningVi: 'vừa mới... thì...',
    type: 'grammar_pattern',
    ipa: '/ˈhɑːrdli hæd... wɛn/',
    example: 'Hardly had he arrived when the applause broke out.',
  },
  {
    regex: /\bno\s+sooner\s+had\b[\s\S]*?\bthan\b/i,
    phrase: 'no sooner had... than',
    baseForm: 'no sooner had... than',
    meaningVi: 'vừa mới... thì đã...',
    type: 'grammar_pattern',
    ipa: '/nəʊ ˈsuːnər hæd... ðæn/',
    example: 'No sooner had we started than it rained.',
  },
  {
    regex: /\bin\s+compliance\s+with\b/i,
    phrase: 'in compliance with',
    baseForm: 'in compliance with',
    meaningVi: 'tuân thủ theo quy định',
    type: 'collocation',
    ipa: '/ɪn kəmˈplaɪəns wɪð/',
    example: 'In compliance with regulations, drills are mandatory.',
  },
  {
    regex: /\bbroke\s+out|break\s+out|breaking\s+out\b/i,
    phrase: 'break out',
    baseForm: 'break out',
    meaningVi: 'bùng nổ, bùng phát bất ngờ',
    type: 'phrasal_verb',
    ipa: '/breɪk aʊt/',
    example: 'Applause broke out across the hall.',
  },
  {
    regex: /\baddress\s+(?:the\s+)?(?:congestion|issue|problem|concern|challenge|crisis)\b/i,
    phrase: 'address the issue',
    baseForm: 'address an issue',
    meaningVi: 'giải quyết, xử lý vấn đề',
    type: 'collocation',
    ipa: '/əˈdrɛs ən ˈɪʃuː/',
    example: 'The mayor pledged to address the congestion.',
  },
  {
    regex: /\btake\s+(?:full\s+)?advantage\s+of\b/i,
    phrase: 'take advantage of',
    baseForm: 'take advantage of',
    meaningVi: 'tận dụng triệt để',
    type: 'idiom',
    ipa: '/teɪk ədˈvɑːntɪdʒ ɒv/',
    example: 'We should take advantage of this opportunity.',
  },
  {
    regex: /\btake\s+into\s+(?:account|consideration)\b/i,
    phrase: 'take into account',
    baseForm: 'take into account',
    meaningVi: 'xem xét, tính đến yếu tố',
    type: 'collocation',
    ipa: '/teɪk ˈɪntuː əˈkaʊnt/',
    example: 'You must take market fluctuations into account.',
  },
  {
    regex: /\bahead\s+of\s+schedule\b/i,
    phrase: 'ahead of schedule',
    baseForm: 'ahead of schedule',
    meaningVi: 'vượt / trước tiến độ dự kiến',
    type: 'collocation',
    ipa: '/əˈhɛd ɒv ˈʃɛdjuːl/',
    example: 'The project was completed ahead of schedule.',
  },
  {
    regex: /\bbehind\s+schedule\b/i,
    phrase: 'behind schedule',
    baseForm: 'behind schedule',
    meaningVi: 'chậm tiến độ so với kế hoạch',
    type: 'collocation',
    ipa: '/bɪˈhaɪnd ˈʃɛdjuːl/',
    example: 'Production is running behind schedule.',
  },
  {
    regex: /\bcut\s+(?:back\s+on|down\s+on)\b/i,
    phrase: 'cut down on',
    baseForm: 'cut down on',
    meaningVi: 'cắt giảm, hạn chế bớt',
    type: 'phrasal_verb',
    ipa: '/kʌt daʊn ɒn/',
    example: 'We need to cut down on unnecessary spending.',
  },
  {
    regex: /\bplay\s+a\s+(?:crucial|pivotal|key|vital)\s+role\b/i,
    phrase: 'play a key role',
    baseForm: 'play a key role',
    meaningVi: 'đóng vai trò then chốt',
    type: 'collocation',
    ipa: '/pleɪ ə kiː rəʊl/',
    example: 'She played a pivotal role in the negotiations.',
  },
  {
    regex: /\bpave\s+the\s+way\s+for\b/i,
    phrase: 'pave the way for',
    baseForm: 'pave the way for',
    meaningVi: 'mở đường, tạo tiền đề cho',
    type: 'idiom',
    ipa: '/peɪv ðə weɪ fɔːr/',
    example: 'This discovery paves the way for new treatments.',
  },
];

/**
 * Trích xuất các Cụm từ (Phrasal Verbs, Collocations, Idioms) từ câu tiếng Anh.
 * Kiến trúc Hybrid:
 * 1. Fast Lexical Matcher (0ms): Khớp nhanh tập cụm từ & thành ngữ tần suất cao.
 * 2. AI Engine (Gemini 2.5 Flash / Groq / Zhipu): Phân tích ngữ cảnh sâu cho các cụm từ phong phú.
 */
export async function extractPhrasesFromSentence(
  sentence: string,
  translationVi?: string
): Promise<ExtractedPhrase[]> {
  const trimmed = sentence.trim();
  if (!trimmed) return [];

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 500) {
    return [];
  }

  const cacheKey = trimmed.toLowerCase();
  const cached = phraseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.phrases;
  }

  const results: ExtractedPhrase[] = [];
  const seen = new Set<string>();

  // 1️⃣ Fast Lexical Index (0ms)
  for (const item of HIGH_FREQUENCY_LEXICAL_INDEX) {
    const match = item.regex.exec(trimmed);
    if (match) {
      seen.add(item.baseForm.toLowerCase());
      results.push({
        phrase: match[0],
        baseForm: item.baseForm,
        meaningVi: item.meaningVi,
        type: item.type,
        ipa: item.ipa,
        example: item.example,
      });
      if (results.length >= 3) break;
    }
  }

  // Nếu Fast Lexical Index đã bắt được >= 2 cụm, có thể trả về luôn để tối ưu tốc độ (<1ms)
  if (results.length >= 2) {
    phraseCache.set(cacheKey, { timestamp: Date.now(), phrases: results });
    return results;
  }

  // 2️⃣ AI Lexicographer (Gemini 2.5 Flash primary + fallback)
  const prompt = `You are a high-speed bilingual English-Vietnamese lexicographer.
Given the English text:
"""
${trimmed}
"""
${translationVi ? `Vietnamese translation: """${translationVi}"""` : ''}

Identify 1 to 4 key English phrasal verbs, collocations, or idioms in this text that Vietnamese learners should memorize.
For each phrase:
- "phrase": the phrase in the sentence
- "baseForm": the dictionary canonical base form (lowercase, e.g. "look forward to", "take a look", "make up one's mind")
- "meaningVi": clear, concise Vietnamese meaning (under 8 words)
- "type": one of ["phrasal_verb", "collocation", "idiom", "grammar_pattern"]
- "ipa": IPA phonetic transcription (optional, e.g. "/lʊk ˈfɔːrwərd tuː/")
- "example": a short natural example sentence

Return ONLY a valid JSON array of objects. If there are no multi-word collocations or idioms, return [].`;

  try {
    let rawResult = '';

    if (hasGeminiKeys()) {
      try {
        rawResult = await geminiGenerate(prompt, {
          model: 'gemini-3.8-flash',
          json: true,
          temperature: 0.2,
        });
      } catch (geminiErr) {
        console.warn('[PhraseExtractor] Gemini error, trying AIRouter:', (geminiErr as Error)?.message);
      }
    }

    if (!rawResult) {
      const router = getRouter();
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Phrase extraction timeout')), 8000)
      );
      rawResult = await Promise.race([router.generate(prompt, 'fast', true), timeoutPromise]);
    }

    const cleaned = cleanJsonString(rawResult);
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      const validTypes: Set<PhraseType> = new Set([
        'phrasal_verb',
        'collocation',
        'idiom',
        'grammar_pattern',
      ]);

      for (const item of parsed) {
        if (!item || typeof item !== 'object') continue;
        const baseForm = String(item.baseForm || item.phrase || '').trim().toLowerCase();
        if (!baseForm || baseForm.length > 80 || seen.has(baseForm)) continue;

        const baseWordCount = baseForm.split(/\s+/).filter(Boolean).length;
        if (baseWordCount < 2 && item.type !== 'idiom') continue;

        seen.add(baseForm);

        const typeRaw = String(item.type || 'collocation').toLowerCase() as PhraseType;
        const type: PhraseType = validTypes.has(typeRaw) ? typeRaw : 'collocation';

        results.push({
          phrase: String(item.phrase || baseForm).trim(),
          baseForm,
          meaningVi: String(item.meaningVi || '—').trim(),
          type,
          ipa: item.ipa ? String(item.ipa).trim() : undefined,
          example: item.example ? String(item.example).trim() : undefined,
        });

        if (results.length >= 4) break;
      }
    }
  } catch (err) {
    console.warn('[PhraseExtractor] AI call failed:', (err as Error)?.message);
  }

  // Cache & Return
  if (results.length > 0) {
    if (phraseCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = phraseCache.keys().next().value;
      if (oldestKey) phraseCache.delete(oldestKey);
    }
    phraseCache.set(cacheKey, { timestamp: Date.now(), phrases: results });
  }

  return results;
}
