import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getAuthUser, unauthorized, checkRateLimit, tooManyRequests, sanitizeForPrompt, safeErrorResponse } from "@/lib/api-security";

// Gemini call. Hobby mặc định 10s có thể kill sớm → đặt 30s headroom.
export const maxDuration = 30;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const rl = checkRateLimit(`coaching:${auth.userId}`, 10, 60_000);
    if (!rl.allowed) return tooManyRequests();

    const { studentName, vms, lcs, tag, msg } = (await req.json()) as {
      studentName: string;
      vms: number;
      lcs: number;
      tag: string;
      msg: string;
    };

    const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) {
      return NextResponse.json({ success: false, error: "Gemini API key is not configured" }, { status: 500 });
    }
    const genAI = new GoogleGenerativeAI(keys[Math.floor(Math.random() * keys.length)]);

    // Sanitize inputs
    const safeName = sanitizeForPrompt(studentName || 'bạn', 60);
    const safeTag = sanitizeForPrompt(tag, 60);
    const safeMsg = sanitizeForPrompt(msg, 200);
    const safeVms = Number.isFinite(vms) ? Math.max(0, Math.min(100, Math.round(vms))) : 0;
    const safeLcs = Number.isFinite(lcs) ? Math.max(0, Math.min(100, Math.round(lcs))) : 0;

    // Try gemini-flash-latest which often has higher free tier quota
    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

    const prompt = `
      Bạn là một trợ lý giáo viên tiếng Anh cao cấp trên nền tảng LingoPro. 
      Nhiệm vụ của bạn là soạn một tin nhắn tư vấn và khuyến khích học sinh dựa trên dữ liệu học tập sau:
      - Tên học sinh: ${safeName}
      - Chỉ số Thành thạo (VMS): ${safeVms}%
      - Chỉ số Chăm chỉ (LCS): ${safeLcs}%
      - Phân loại hiện tại (Tag): ${safeTag}
      - Nhận định sơ bộ: ${safeMsg}

      Yêu cầu tin nhắn:
      1. Ngôn ngữ: Tiếng Việt, văn phong thân thiện, chuyên nghiệp, truyền cảm hứng.
      2. Nội dung: Đề cập trực tiếp các chỉ số này một cách khéo léo. Đưa ra 1 lời khuyên cụ thể để cải thiện.
      3. Độ dài: Xuống dòng hợp lý, ngắn gọn (dưới 100 từ).
      4. Hãy gọi tên học sinh một cách gần gũi (ví dụ: "Chào Tâm", "Chào An").

      Chỉ trả về nội dung tin nhắn, không thêm lời dẫn.
    `;

    try {
      const result = await model.generateContent(prompt, { signal: AbortSignal.timeout(25000) });
      const response = await result.response;
      const text = response.text();
      return NextResponse.json({ success: true, suggestion: text });
    } catch (apiError: unknown) {
      const apiMsg = apiError instanceof Error ? apiError.message : 'Unknown error';
      console.warn("Gemini API Tier Error, using fallback:", apiMsg);
      // Fallback to a high-quality template if API fails
      const fallback = `Chào ${safeName.split(' ')[0]}! Thầy thấy chỉ số thành thạo của bạn đang ở mức ${safeVms}%. Hãy cố gắng duy trì việc ôn tập ${safeLcs > 50 ? 'đều đặn như hiện tại' : 'thêm một chút mỗi ngày'} để đạt kết quả tốt nhất nhé!`;
      return NextResponse.json({ success: true, suggestion: fallback, isFallback: true });
    }
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Failed to generate coaching insight');
  }
}
