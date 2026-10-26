/**
 * VNU Test Bậc 3 Writing Evaluation API Route (Rubric B1 + AI Enhancement)
 * File: src/app/api/vnu-bac-3/writing-eval/route.ts
 */

import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getRouter } from '@/lib/ai-router';
import {
  checkRateLimitAsync,
  getClientIp,
  getRateLimitClientKey,
  rateLimitUnavailableResponse,
  tooManyRequests,
} from '@/lib/api-security';
import type { WritingEvalResult, WritingEvalCriteriaScore } from '@/types/vnu-bac-3';

let activeVnuWritingAiCalls = 0;
const MAX_CONCURRENT_VNU_WRITING_AI_CALLS = 15;

export interface VnuWritingEvalRequest {
  examType?: 'vnu-bac-3' | 'vstep';
  taskId: string;
  taskTitle?: string;
  prompt?: string;
  minWords?: number;
  text: string;
}

const DISCOURSE_MARKERS = [
  'firstly', 'secondly', 'thirdly', 'finally', 'furthermore', 'moreover', 'however',
  'nevertheless', 'nonetheless', 'therefore', 'consequently', 'thus', 'hence',
  'in addition', 'on the other hand', 'in contrast', 'for example', 'for instance',
  'in conclusion', 'to sum up', 'overall', 'although', 'even though', 'despite',
  'whereas', 'while', 'because', 'since', 'as a result', 'specifically',
];

const ACADEMIC_OR_FORMAL_MARKERS = [
  'significant', 'beneficial', 'essential', 'impact', 'influence', 'perspective',
  'contribute', 'environment', 'individual', 'society', 'government', 'education',
  'technology', 'opportunity', 'advantage', 'disadvantage', 'drawback', 'solution',
  'sincerely', 'regards', 'apologize', 'appreciate', 'grateful', 'look forward',
  'convenient', 'information', 'experience', 'recommend', 'suggest',
];

function roundHalf(val: number): number {
  const clamped = Math.max(0, Math.min(10, val));
  return Math.round(clamped * 2) / 2;
}

function getCefrBand(score: number): 'C1' | 'B2' | 'B1' | 'Below B1' {
  if (score >= 8.5) return 'C1';
  if (score >= 6.0) return 'B2';
  if (score >= 4.0) return 'B1';
  return 'Below B1';
}

function evaluateWithDeterministicRubric(req: VnuWritingEvalRequest): WritingEvalResult {
  const rawText = req.text.trim();
  const words = rawText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const minWords = Math.max(20, req.minWords || (req.taskId.includes('2') ? 100 : 80));
  const lowerText = rawText.toLowerCase();

  // 1. Task Fulfillment
  const lengthRatio = Math.min(1.3, wordCount / minWords);
  const promptWords = (req.prompt || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const uniquePromptKeywords = [...new Set(promptWords)];
  const matchedPromptKeywords = uniquePromptKeywords.filter((kw) => lowerText.includes(kw));
  const promptCoverage =
    uniquePromptKeywords.length > 0
      ? Math.min(1, matchedPromptKeywords.length / Math.min(8, uniquePromptKeywords.length))
      : 0.7;

  let tfScore = 4.0 + lengthRatio * 3.5 + promptCoverage * 1.5;
  if (wordCount < minWords * 0.5) tfScore = Math.min(tfScore, 4.0);
  else if (wordCount < minWords * 0.8) tfScore = Math.min(tfScore, 6.0);
  tfScore = roundHalf(tfScore);

  const tfFeedback =
    wordCount >= minWords
      ? `Đạt yêu cầu độ dài (${wordCount}/${minWords} từ) và bám sát các từ khóa trọng tâm của đề bài.`
      : `Độ dài bài viết (${wordCount}/${minWords} từ) chưa đạt mức tối thiểu khuyến nghị; cần phát triển thêm ý chính và dẫn chứng cụ thể.`;

  // 2. Organization & Cohesion
  const paragraphs = rawText
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 10);
  const paraCount = paragraphs.length;
  const matchedConnectors = DISCOURSE_MARKERS.filter((m) => lowerText.includes(m));

  let orgScore = 4.5;
  if (paraCount >= 3 && paraCount <= 6) orgScore += 2.0;
  else if (paraCount === 2) orgScore += 1.0;
  orgScore += Math.min(2.5, matchedConnectors.length * 0.5);
  if (wordCount < minWords * 0.5) orgScore = Math.min(orgScore, 4.5);
  orgScore = roundHalf(orgScore);

  const orgFeedback =
    paraCount >= 3
      ? `Bài viết chia thành ${paraCount} đoạn rõ ràng, sử dụng ${matchedConnectors.length} liên từ nối ý mạch lạc (${matchedConnectors.slice(0, 4).join(', ') || 'cơ bản'}).`
      : `Bố cục hiện có ${paraCount} đoạn; nên tách rõ Mở bài, Thân bài và Kết bài kèm các liên từ chuyển ý.`;

  // 3. Vocabulary (Lexical Resource)
  const cleanWords = words.map((w) => w.toLowerCase().replace(/[^a-z]/g, '')).filter(Boolean);
  const uniqueWords = new Set(cleanWords);
  const ttr = cleanWords.length > 0 ? uniqueWords.size / cleanWords.length : 0;
  const longWordsCount = cleanWords.filter((w) => w.length >= 7).length;
  const longWordRatio = cleanWords.length > 0 ? longWordsCount / cleanWords.length : 0;
  const academicCount = ACADEMIC_OR_FORMAL_MARKERS.filter((m) => lowerText.includes(m)).length;

  let vocabScore = 4.5 + Math.min(2.0, ttr * 3.0) + Math.min(2.0, longWordRatio * 8.0) + Math.min(1.0, academicCount * 0.25);
  if (wordCount < minWords * 0.5) vocabScore = Math.min(vocabScore, 5.0);
  vocabScore = roundHalf(vocabScore);

  const vocabFeedback =
    longWordRatio >= 0.16
      ? `Vốn từ khá phong phú (${uniqueWords.size} từ vựng khác nhau), có sử dụng từ vựng học thuật/trang trọng phù hợp ngữ cảnh B1.`
      : `Từ vựng ở mức cơ bản (${uniqueWords.size} từ khác nhau); nên bổ sung các cụm từ (collocations) và từ đồng nghĩa bậc B1–B2.`;

  // 4. Grammar Range & Accuracy
  const sentences = rawText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
  const avgSentenceLen = sentences.length > 0 ? wordCount / sentences.length : wordCount;
  const complexConjunctions = ['which', 'that', 'who', 'whom', 'whose', 'where', 'although', 'unless', 'provided', 'whereas', 'if', 'because', 'while'];
  const complexMatches = complexConjunctions.filter((c) => new RegExp(`\\b${c}\\b`, 'i').test(rawText));

  let grammarScore = 4.5;
  if (avgSentenceLen >= 10 && avgSentenceLen <= 26) grammarScore += 2.0;
  else if (avgSentenceLen >= 7) grammarScore += 1.0;
  grammarScore += Math.min(2.5, complexMatches.length * 0.45);
  if (wordCount < minWords * 0.5) grammarScore = Math.min(grammarScore, 5.0);
  grammarScore = roundHalf(grammarScore);

  const grammarFeedback =
    complexMatches.length >= 2
      ? `Có kết hợp câu đơn và câu phức/mệnh đề quan hệ (${complexMatches.slice(0, 4).join(', ')}), độ dài câu trung bình ${Math.round(avgSentenceLen)} từ/câu.`
      : `Cấu trúc câu còn đơn giản (trung bình ${Math.round(avgSentenceLen)} từ/câu); nên áp dụng thêm mệnh đề quan hệ và câu điều kiện.`;

  const overallScore = roundHalf((tfScore + orgScore + vocabScore + grammarScore) / 4);
  const cefrBand = getCefrBand(overallScore);

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (wordCount >= minWords) {
    strengths.push(`Đảm bảo tốt yêu cầu độ dài tối thiểu (${wordCount}/${minWords} từ).`);
  } else {
    improvements.push(`Cần viết thêm tối thiểu ${minWords - wordCount} từ để đạt chuẩn độ dài của phần thi (${minWords}+ từ).`);
  }

  if (paraCount >= 3) {
    strengths.push(`Phân đoạn hợp lý (${paraCount} đoạn), giúp bố cục rõ ràng và mạch lạc.`);
  } else {
    improvements.push('Chia bài viết thành ít nhất 3 đoạn văn (Mở đầu - Nội dung chính - Kết bài).');
  }

  if (matchedConnectors.length >= 2) {
    strengths.push(`Sử dụng các từ nối chuyển ý phù hợp (${matchedConnectors.slice(0, 4).join(', ')}).`);
  } else {
    improvements.push('Bổ sung thêm các liên từ (Furthermore, However, In addition, For example) để liên kết câu mượt mà hơn.');
  }

  if (complexMatches.length >= 2) {
    strengths.push('Có vận dụng câu ghép và mệnh đề phụ thuộc để diễn đạt tự nhiên.');
  } else {
    improvements.push('Thử dùng thêm câu phức (Although..., Because..., which/who) để nâng cao điểm Ngữ pháp.');
  }

  return {
    taskId: req.taskId,
    overallScore,
    cefrBand,
    wordCount,
    minWords,
    evaluatedAt: new Date().toISOString(),
    source: 'rubric',
    criteria: {
      taskFulfillment: { score: tfScore, feedback: tfFeedback },
      organization: { score: orgScore, feedback: orgFeedback },
      vocabulary: { score: vocabScore, feedback: vocabFeedback },
      grammar: { score: grammarScore, feedback: grammarFeedback },
    },
    strengths: strengths.length > 0 ? strengths : ['Bài viết đã phản hồi đúng chủ đề trọng tâm của đề bài.'],
    improvements: improvements.length > 0 ? improvements : ['Kiểm tra kỹ lỗi chính tả và thì của động từ trước khi hoàn thành.'],
  };
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const customSession = request.headers.get('x-client-session-id')?.trim();
    const clientKey = customSession
      ? `sess:${createHash('sha256').update(customSession).digest('hex').slice(0, 16)}`
      : getRateLimitClientKey(request);

    const [clientRl, ipRl] = await Promise.all([
      checkRateLimitAsync(`vnu-writing-eval:${clientKey}`, 20, 60_000),
      checkRateLimitAsync(`vnu-writing-eval-ip:${ip}`, 360, 60_000),
    ]);
    if (!clientRl.allowed || !ipRl.allowed) {
      return tooManyRequests();
    }

    const body = (await request.json().catch(() => ({}))) as Partial<VnuWritingEvalRequest>;
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const taskId = typeof body.taskId === 'string' && body.taskId ? body.taskId : 'task1';

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bài viết quá ngắn (cần tối thiểu 5 từ để chấm điểm nhận xét).',
        },
        { status: 400 }
      );
    }

    const defaultMin = taskId.includes('2') ? 100 : 80;
    const evalReq: VnuWritingEvalRequest = {
      examType: 'vnu-bac-3',
      taskId,
      taskTitle: body.taskTitle,
      prompt: body.prompt,
      minWords: typeof body.minWords === 'number' && body.minWords > 0 ? body.minWords : defaultMin,
      text,
    };

    const baseline = evaluateWithDeterministicRubric(evalReq);

    // Thử làm giàu nhận xét bằng AI Router nếu có key cấu hình và hàng đợi chưa quá tải
    if (activeVnuWritingAiCalls < MAX_CONCURRENT_VNU_WRITING_AI_CALLS) {
      activeVnuWritingAiCalls++;
      try {
        const router = getRouter();
        const aiPrompt = `Bạn là giám khảo chấm thi viết tiếng Anh chuẩn khung năng lực VNU Test Bậc 3 (tương đương CEFR B1 - ĐHQGHN).
Hãy chấm bài viết sau theo thang điểm 10 (làm tròn 0.5) dựa trên 4 tiêu chí Rubric B1:
1. Task Fulfillment (Hoàn thành yêu cầu đề bài, độ dài tối thiểu ${evalReq.minWords} từ, hiện tại ${baseline.wordCount} từ)
2. Organization (Bố cục & Mạch lạc)
3. Vocabulary (Vốn từ B1)
4. Grammar (Ngữ pháp B1)

Đề bài: ${evalReq.prompt || evalReq.taskTitle || 'Writing Task'}
Bài làm của thí sinh:
"""
${evalReq.text.slice(0, 3500)}
"""

Trả về DUY NHẤT một JSON object hợp lệ theo cấu trúc sau (tiếng Việt):
{
  "taskFulfillment": { "score": number, "feedback": "string" },
  "organization": { "score": number, "feedback": "string" },
  "vocabulary": { "score": number, "feedback": "string" },
  "grammar": { "score": number, "feedback": "string" },
  "strengths": ["string", "string"],
  "improvements": ["string", "string"]
}`;

        const rawJson = await router.generate(aiPrompt, 'fast', true);
        const cleaned = rawJson.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(cleaned);

        if (
          parsed &&
          typeof parsed === 'object' &&
          typeof parsed.taskFulfillment?.score === 'number' &&
          typeof parsed.organization?.score === 'number' &&
          typeof parsed.vocabulary?.score === 'number' &&
          typeof parsed.grammar?.score === 'number'
        ) {
          const tf = roundHalf(parsed.taskFulfillment.score);
          const org = roundHalf(parsed.organization.score);
          const voc = roundHalf(parsed.vocabulary.score);
          const gra = roundHalf(parsed.grammar.score);
          const overallScore = roundHalf((tf + org + voc + gra) / 4);

          const aiResult: WritingEvalResult = {
            ...baseline,
            overallScore,
            cefrBand: getCefrBand(overallScore),
            source: 'ai',
            criteria: {
              taskFulfillment: {
                score: tf,
                feedback: String(parsed.taskFulfillment.feedback || baseline.criteria.taskFulfillment.feedback),
              },
              organization: {
                score: org,
                feedback: String(parsed.organization.feedback || baseline.criteria.organization.feedback),
              },
              vocabulary: {
                score: voc,
                feedback: String(parsed.vocabulary.feedback || baseline.criteria.vocabulary.feedback),
              },
              grammar: {
                score: gra,
                feedback: String(parsed.grammar.feedback || baseline.criteria.grammar.feedback),
              },
            },
            strengths:
              Array.isArray(parsed.strengths) && parsed.strengths.length > 0
                ? parsed.strengths.map(String).slice(0, 4)
                : baseline.strengths,
            improvements:
              Array.isArray(parsed.improvements) && parsed.improvements.length > 0
                ? parsed.improvements.map(String).slice(0, 4)
                : baseline.improvements,
          };

          return NextResponse.json({
            success: true,
            evaluation: aiResult,
          });
        }
      } catch {
        // Fallback sang deterministic rubric nếu AI Router không có key hoặc lỗi mạng
      } finally {
        activeVnuWritingAiCalls = Math.max(0, activeVnuWritingAiCalls - 1);
      }
    }

    return NextResponse.json({
      success: true,
      evaluation: baseline,
    });
  } catch (error) {
    const unavailable = rateLimitUnavailableResponse(error);
    if (unavailable) return unavailable;
    console.error('[API /api/vnu-bac-3/writing-eval] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ khi chấm điểm bài viết.' },
      { status: 500 }
    );
  }
}
