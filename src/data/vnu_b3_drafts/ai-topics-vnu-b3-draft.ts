/**
 * VNU Test Bậc 3 (CEFR B1) AI Speaking Sparring Topics Draft
 * File: src/data/vnu_b3_drafts/ai-topics-vnu-b3-draft.ts
 *
 * Tailored for VNU Test Bậc 3 Speaking Examination (8 minutes, 2 parts):
 * - Part 1: Social Interaction (Daily Routines, Studies, Future Plans - Present Simple & Future)
 * - Part 2: Solution Discussion & Narrative Cue Card (Memorable Experience, Choices & Comparatives)
 *
 * Pedagogical Architecture:
 * - Lenient Examiner Persona: Warm, patient, non-intimidating, encouraging fluency over minor slips
 * - Hesitation Management: Integrated stalling phrases, anti-freezing starters, scaffolding fillers
 * - 100% Type-compatible with Lingopro's AiSpeakingTopic interface (0 TS compilation errors)
 */

import type { AiSpeakingTopic, AiSpeakingRoleplayPersona } from '@/data/speaking/ai-topics';

// ── 1. LENIENT EXAMINER PERSONAS (GIÁM KHẢO THẤU CẢM BẬC 3) ───────────────────

export const VNU_B3_EXAMINER_PERSONAS: Record<string, AiSpeakingRoleplayPersona> = {
  examinerHa: {
    name: 'Cô Thu Hà (Examiner Ha)',
    role: 'VNU Bậc 3 Speaking Examiner & Fluency Coach',
    organization: 'VNU Center for Language Testing (ULIS)',
    tone: 'Thân thiện, ấm áp, kiên nhẫn tối đa khi thí sinh ngập ngừng, bao dung với các lỗi ngữ pháp nhỏ, không ngắt lời, khuyến khích trả lời trọn câu và tạo tâm lý an tâm.',
  },
  examinerDavid: {
    name: 'Mr. David Evans (Examiner David)',
    role: 'VNU Oral Examiner & Storytelling Mentor',
    organization: 'VNU Foreign Language Assessment Board',
    tone: 'Điềm đạm, lắng nghe tích cực, mỉm cười khích lệ, nhẹ nhàng bỏ qua các lỗi thì quá khứ nhỏ để hỗ trợ thí sinh hoàn thành đủ 3 ý gợi ý trên Cue Card.',
  },
  examinerNam: {
    name: 'Thầy Hoàng Nam (Examiner Nam)',
    role: 'VNU Communicative Speaking Assessor',
    organization: 'VNU Testing and Quality Assurance Center',
    tone: 'Cởi mở, gần gũi như một người anh lớn, chủ động gợi ý cấu trúc so sánh đơn giản khi thí sinh bí từ, liên tục ghi nhận các nỗ lực diễn đạt.',
  },
};

// ── 2. AI SPEAKING TOPICS FOR VNU BẬC 3 ───────────────────────────────────────

export const VNU_B3_AI_SPEAKING_TOPICS: AiSpeakingTopic[] = [
  // --- TOPIC 1: PART 1 SOCIAL INTERACTION (DAILY ROUTINES & FUTURE PLANS) ---
  {
    id: 'vnu_b3_part1_sparring',
    category: 'exam_prep',
    categoryLabelVi: 'Luyện thi VNU Test Bậc 3 (B1)',
    level: 'B1',
    label: 'VNU Bậc 3 Part 1: Daily Routines & Future Aspirations',
    desc: 'Luyện phản xạ Part 1 VNU Test Bậc 3: Trả lời 5-6 câu hỏi quen thuộc về Bản thân, Thói quen sinh hoạt và Kế hoạch tương lai với giám khảo AI kiên nhẫn, thấu cảm.',
    icon: '🌱',
    roleplayPersona: VNU_B3_EXAMINER_PERSONAS.examinerHa,
    contextSettingVi: 'Phòng thi vấn đáp VNU Test Bậc 3 (chuẩn B1 đầu ra ĐHQG Hà Nội). Phần 1 kéo dài 3 phút, giám khảo hỏi các câu hỏi ngắn về 2 chủ đề thân thuộc: Thói quen hàng ngày & Kế hoạch tương lai.',
    conversationGoalsVi: [
      'Phản xạ trả lời trong 2-3 giây đầu tiên bằng các cụm từ đệm tự nhiên (Well, Honestly, To tell the truth...)',
      'Sử dụng thì Hiện tại đơn để nói về thói quen và thì Tương lai (will / be going to) để nói về dự định',
      'Kéo dài câu trả lời đạt 2-3 câu ngắn hoàn chỉnh (Answer + Reason + Example), không trả lời cộc lốc Yes/No',
    ],
    situationalTipsVi: [
      'Công thức phản xạ Bậc 3: Direct Answer -> Reason (because/since) -> Mini Example hoặc Cảm xúc cá nhân',
      'Mẹo tránh đóng băng (Anti-freezing): Khi bí từ hoặc cần nghĩ ý, nói ngay: "Well, that is an interesting question..." hoặc "Let me see..." để giữ nhịp nói',
      'Không cần dùng từ vựng C1 đao to búa lớn; Bậc 3 chỉ cần phát âm rõ ràng, chia đúng động từ số ít/số nhiều',
    ],
    initialGreeting: 'Hello! Welcome to your VNU Test Bậc 3 Speaking exam. Please relax, take a deep breath, and do not worry about making mistakes. Let us begin with your daily life: What is your typical daily routine during the week?',
    suggestedStarters: [
      'Well, on weekdays, I usually wake up around 6:30 AM to prepare for my morning classes...',
      'Honestly, my daily routine is quite busy because I attend lectures in the morning and study in the library...',
      'In the evening, I usually spend about two hours doing homework, and then I relax by listening to music...',
    ],
    keyVocabulary: [
      'daily routine',
      'attend lectures',
      'take a deep breath',
      'unwind after class',
      'well to be honest',
      'let me see',
    ],
  },

  // --- TOPIC 2: PART 2 NARRATIVE MONOLOGUE (A MEMORABLE EXPERIENCE) ---
  {
    id: 'vnu_b3_part2_sparring',
    category: 'exam_prep',
    categoryLabelVi: 'Luyện thi VNU Test Bậc 3 (B1)',
    level: 'B1',
    label: 'VNU Bậc 3 Part 2: Personal Narrative (A Memorable Vacation)',
    desc: 'Luyện nói độc thoại Part 2 VNU Test Bậc 3 theo Cue Card: Kể lại một chuyến đi hoặc trải nghiệm đáng nhớ bằng thì Quá khứ đơn (Past Simple) và trả lời 2 câu hỏi mở rộng.',
    icon: '📖',
    roleplayPersona: VNU_B3_EXAMINER_PERSONAS.examinerDavid,
    contextSettingVi: 'Phòng thi VNU Test Bậc 3 Part 2: Thí sinh bốc thăm thẻ Cue Card "Describe a memorable vacation or trip", có 1 phút chuẩn bị, nói trong 1.5 - 2 phút và trả lời 2 câu hỏi mở rộng của giám khảo.',
    conversationGoalsVi: [
      'Bám sát 3 gợi ý cốt lõi trên thẻ Cue Card: Đi đâu (Where), Đi với ai (Who with), Làm những gì (What you did)',
      'Sử dụng nhất quán thì Quá khứ đơn (Past Simple: visited, stayed, enjoyed, was/were) và liên từ thời gian (first, then, after that, finally)',
      'Kết thúc câu chuyện bằng việc chia sẻ cảm xúc và lý do vì sao trải nghiệm đó lại đáng nhớ (Why it was memorable)',
    ],
    situationalTipsVi: [
      'Khung kể chuyện 4 nhịp: Setting (Bối cảnh) -> Companions & Transport (Đi cùng ai, bằng gì) -> Activities (Đã làm gì) -> Feelings (Cảm xúc)',
      'Xử lý ngắc ngứ quá khứ: Nếu quên dạng bất quy tắc, cứ giữ bình tĩnh nói tiếp, không đứng hình dừng lại sửa đi sửa lại quá 2 lần',
      'Mẫu câu mở đầu chuẩn B1: "Today I would like to talk about a memorable vacation I had last summer..."',
    ],
    initialGreeting: 'Now, let us move on to Part 2. Here is your cue card: "Describe a memorable vacation or trip you took with your friends or family. You should say where you went, who you went with, what you did, and explain why it was memorable." When you are ready, please begin your story.',
    suggestedStarters: [
      'Today, I would like to share a wonderful trip I took to Da Nang with my family last summer...',
      'We traveled there by airplane and stayed in a small hotel near the beach for four days...',
      'During the vacation, we swam in the ocean, tasted delicious local seafood, and visited ancient pagodas...',
    ],
    keyVocabulary: [
      'memorable vacation',
      'coastal city',
      'taste local seafood',
      'unforgettable memory',
      'strengthen our bond',
      'travel by airplane',
    ],
  },

  // --- TOPIC 3: PART 2 ACTIVITY PREFERENCE & COMPARATIVES ---
  {
    id: 'vnu_b3_part2_choice_sparring',
    category: 'exam_prep',
    categoryLabelVi: 'Luyện thi VNU Test Bậc 3 (B1)',
    level: 'B1',
    label: 'VNU Bậc 3 Part 2: Activity Preference & Comparatives',
    desc: 'Luyện kỹ năng so sánh và giải thích lựa chọn Part 2 VNU Test Bậc 3: Lựa chọn hoạt động cuối tuần phù hợp sau kỳ thi và bảo vệ quan điểm bằng câu so sánh (Comparatives).',
    icon: '⚖️',
    roleplayPersona: VNU_B3_EXAMINER_PERSONAS.examinerNam,
    contextSettingVi: 'Phần thi tình huống lựa chọn Bậc 3: So sánh 3 hoạt động cuối tuần để thư giãn sau kỳ thi (Đi dã ngoại ngoài trời, Đi xem phim rạp, hoặc Ở nhà đọc sách/chơi game) và bảo vệ sự lựa chọn.',
    conversationGoalsVi: [
      'Khẳng định dứt khoát sự lựa chọn yêu thích ngay trong câu đầu tiên bằng cấu trúc sở thích (In my opinion, I prefer...)',
      'Sử dụng ít nhất 2 cấu trúc so sánh hơn (comparative: more relaxing than, cheaper than, better for my health)',
      'Đưa ra 2 lý do thực tế và giải thích ngắn gọn tại sao không chọn các phương án còn lại',
    ],
    situationalTipsVi: [
      'Công thức PREP tinh gọn: Point (Chọn gì) -> Reason 1 (So sánh hơn) -> Reason 2 (Lợi ích cá nhân) -> Point (Khẳng định lại)',
      'Mẫu câu so sánh dễ dùng: "A is much more interesting than B because...", "I prefer A to B because it saves money..."',
      'Nếu ngập ngừng, dùng filler: "To tell you the truth, each option has its own pros and cons, but for me..."',
    ],
    initialGreeting: 'Imagine you and your classmates have finished your final exams. You have three choices to celebrate: having an outdoor picnic, watching a movie at the cinema, or staying home to relax. Which option do you prefer and why?',
    suggestedStarters: [
      'If I had to choose, I would definitely prefer having an outdoor picnic in the park...',
      'First of all, spending time outdoors in fresh air is much healthier and more relaxing than sitting in a dark cinema...',
      'Besides, a picnic gives us more opportunities to chat, play games together, and take great photos...',
    ],
    keyVocabulary: [
      'outdoor picnic',
      'much more relaxing',
      'prefer A to B',
      'budget-friendly',
      'catch up with friends',
      'fresh air and green space',
    ],
  },

  // --- TOPIC 4: PART 1 HOBBIES, SPORTS & HEALTH ---
  {
    id: 'vnu_b3_part1_hobbies_sparring',
    category: 'exam_prep',
    categoryLabelVi: 'Luyện thi VNU Test Bậc 3 (B1)',
    level: 'B1',
    label: 'VNU Bậc 3 Part 1: Hobbies, Physical Exercise & Health',
    desc: 'Luyện phản xạ Part 1 VNU Test Bậc 3: Trả lời về Sở thích cá nhân, Thói quen tập thể thao và Duy trì sức khỏe bằng thì Hiện tại đơn.',
    icon: '🏸',
    roleplayPersona: VNU_B3_EXAMINER_PERSONAS.examinerHa,
    contextSettingVi: 'Phòng thi VNU Test Bậc 3 Part 1 (Chủ đề Sở thích & Thể thao). Giám khảo hỏi về hoạt động thể chất yêu thích, tần suất luyện tập và lợi ích đối với tinh thần học tập.',
    conversationGoalsVi: [
      'Diễn đạt sở thích bằng các động từ chỉ sự ưa thích: be keen on, enjoy, be interested in',
      'Sử dụng các trạng từ chỉ tần suất: usually, twice a week, every afternoon',
      'Nêu ít nhất 2 lợi ích của việc tập thể thao đối với sức khỏe và giảm áp lực học tập',
    ],
    situationalTipsVi: [
      'Thay vì chỉ nói "I play badminton", hãy mở rộng: "I usually play badminton with my roommate twice a week because it helps me stay fit."',
      'Công thức trả lời sở thích: Activity + Frequency + Companion + Benefit',
    ],
    initialGreeting: 'Let us talk about your leisure time and health. Do you play any sports or do regular exercise? How does it help your daily routine?',
    suggestedStarters: [
      'To be honest, I really enjoy playing badminton with my university friends twice a week...',
      'Jogging around the campus lake every morning helps me clear my mind and stay energetic...',
      'Although I am quite busy with my coursework, I always try to spend 30 minutes exercising every day...',
    ],
    keyVocabulary: [
      'regular exercise',
      'play badminton',
      'clear my mind',
      'stay energetic',
      'relieve academic stress',
      'twice a week',
    ],
  },
];

// Alias for flexibility
export const AI_SPEAKING_TOPICS_VNU_B3 = VNU_B3_AI_SPEAKING_TOPICS;

// ── 3. QUERY HELPERS & DYNAMIC SYSTEM PROMPT BUILDER ──────────────────────────

/**
 * Retrieve a VNU Bậc 3 AI speaking topic by ID.
 */
export function getVnuB3TopicById(id: string): AiSpeakingTopic | undefined {
  return VNU_B3_AI_SPEAKING_TOPICS.find((t) => t.id === id);
}

/**
 * Constructs a comprehensive, empathetic System Prompt for the AI Tutor / LLM
 * to conduct realistic, low-stress VNU Test Bậc 3 oral examinations.
 */
export function buildVnuB3ExaminerSystemPrompt(topic: AiSpeakingTopic): string {
  return `You are ${topic.roleplayPersona?.name || 'Examiner'}, a friendly, empathetic English oral examiner for the VNU Test Bậc 3 (CEFR B1) examination at ${topic.roleplayPersona?.organization || 'VNU Testing Center'}.

Your Persona & Demeanor:
- Tone: ${topic.roleplayPersona?.tone || 'Warm, patient, highly encouraging.'}
- Target Level: CEFR B1 (VNU Bậc 3). Candidates are undergraduates fulfilling graduation requirements.

Exam Context:
- Scenario: ${topic.contextSettingVi || 'VNU Test Speaking Exam Room'}
- Candidate Goals: ${topic.conversationGoalsVi?.join('; ') || 'Answer in 2-3 sentences, maintain fluency'}
- Topic: ${topic.label}

Examiner Rules of Engagement:
1. Low Affective Filter: Be extraordinarily welcoming, supportive, and kind. Never sound harsh, judgmental, or impatient.
2. Managing Hesitation & Silence: If the candidate hesitates, stutters, or pauses for more than a few seconds, gently offer scaffolding: "Take your time, you can also think about..." or rephrase in simpler English.
3. Turn-taking Length: Keep your examiner responses concise (1-2 sentences). Give a brief encouraging word (e.g., "That sounds lovely!", "Good point!"), followed by the next natural exam question.
4. Error Tolerance: Tolerate minor grammatical slips (e.g. missing 3rd person -s, slight irregular past tense errors) as long as meaning is clear. Praise communicative effort and sentence completion.
5. Vietnamese Feedback: In the feedback field, provide 1 brief, uplifting sentence in Vietnamese pointing out 1 small grammar/vocab improvement while praising their fluency effort.`;
}
