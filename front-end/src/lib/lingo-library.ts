/**
 * LingoTown Library demo — presence giả, bắt cặp, kịch bản, ngồi học + nhạc.
 * Local only, không backend realtime.
 */

export const LIBRARY_MAP = '/lingo-town/library.jpg';
export const HERO_SHEET = '/lingo-town/hero.jpg';

export type LibraryPhase =
  | 'lobby' // đi trong thư viện, xem người
  | 'matching' // đang tìm cặp
  | 'paired' // đã có partner, chọn scenario
  | 'scenario' // đang nói kịch bản
  | 'study'; // ngồi học + nhạc

export interface SeatStudent {
  id: string;
  name: string;
  /** 0–1 trên map */
  nx: number;
  ny: number;
  color: string;
  status: 'studying' | 'paired' | 'idle' | 'speaking';
  level: number;
  /** bạn (player) */
  isYou?: boolean;
  /** partner id nếu đang pair */
  partnerId?: string;
}

export interface ScenarioLine {
  role: 'A' | 'B';
  en: string;
  vi: string;
  hint?: string;
}

export interface TalkScenario {
  id: string;
  title: string;
  level: string;
  setting: string;
  /** player is A or can choose */
  lines: ScenarioLine[];
  xpReward: number;
}

export interface PartnerInfo {
  id: string;
  name: string;
  level: number;
  color: string;
  bio: string;
}

const FIRST = [
  'Mai', 'Lan', 'Nam', 'Hùng', 'An', 'Linh', 'Đức', 'Hà', 'Tuấn', 'Vy',
  'Minh', 'Ngọc', 'Phúc', 'Trang', 'Khoa', 'My', 'Long', 'Quỳnh', 'Bảo', 'Chi',
  'Dũng', 'Hương', 'Khánh', 'Nhung', 'Phát', 'Thảo', 'Uyên', 'Vũ', 'Yến', 'Sơn',
  'Giang', 'Hiếu', 'Oanh', 'Phương', 'Quang', 'Rita', 'Sam', 'Tina', 'Wendy', 'Zack',
];

const COLORS = [
  '#38bdf8', '#f472b6', '#a78bfa', '#4ade80', '#fbbf24', '#fb7185',
  '#2dd4bf', '#60a5fa', '#c084fc', '#f97316', '#34d399', '#e879f9',
];

/** Ghế / chỗ ngồi rải trên map thư viện (chuẩn hóa) */
const SEAT_SLOTS: Array<{ nx: number; ny: number }> = (() => {
  const slots: Array<{ nx: number; ny: number }> = [];
  // 4 hàng bàn × nhiều ghế
  const rows = [0.28, 0.42, 0.56, 0.7];
  const cols = [0.18, 0.28, 0.38, 0.52, 0.62, 0.72, 0.82];
  for (const ny of rows) {
    for (const nx of cols) {
      slots.push({ nx, ny: ny + (Math.random() * 0.02 - 0.01) });
    }
  }
  // góc đọc sách
  slots.push({ nx: 0.12, ny: 0.82 }, { nx: 0.22, ny: 0.85 }, { nx: 0.88, ny: 0.8 });
  return slots;
})();

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function createLibraryCrowd(playerName: string, count = 36): SeatStudent[] {
  const n = Math.min(count, SEAT_SLOTS.length - 1);
  const used = new Set<number>();
  const students: SeatStudent[] = [];

  // player seat gần giữa
  const youSlot = 14;
  used.add(youSlot);
  students.push({
    id: 'you',
    name: playerName || 'Bạn',
    nx: SEAT_SLOTS[youSlot].nx,
    ny: SEAT_SLOTS[youSlot].ny,
    color: '#2dd4bf',
    status: 'idle',
    level: 1,
    isYou: true,
  });

  for (let i = 0; i < n; i++) {
    let si = (hash(`seat-${i}`) + i * 3) % SEAT_SLOTS.length;
    while (used.has(si)) si = (si + 1) % SEAT_SLOTS.length;
    used.add(si);
    const name = FIRST[i % FIRST.length] + (i >= FIRST.length ? `${(i % 9) + 1}` : '');
    const statuses: SeatStudent['status'][] = ['studying', 'studying', 'studying', 'idle', 'paired', 'speaking'];
    students.push({
      id: `s-${i}`,
      name,
      nx: SEAT_SLOTS[si].nx,
      ny: SEAT_SLOTS[si].ny,
      color: COLORS[i % COLORS.length],
      status: statuses[hash(name) % statuses.length],
      level: 1 + (hash(name) % 12),
    });
  }
  return students;
}

/** Partner pool (bot) */
export function pickRandomPartner(excludeIds: string[]): PartnerInfo {
  const pool: PartnerInfo[] = [
    { id: 'p-mai', name: 'Mai', level: 5, color: '#f472b6', bio: 'Thích role-play café & travel.' },
    { id: 'p-nam', name: 'Nam', level: 4, color: '#60a5fa', bio: 'Muốn luyện phát âm tự nhiên.' },
    { id: 'p-lan', name: 'Lan', level: 7, color: '#a78bfa', bio: 'Luyện IELTS speaking part 1.' },
    { id: 'p-hung', name: 'Hùng', level: 3, color: '#fbbf24', bio: 'Mới bắt đầu, kiên nhẫn.' },
    { id: 'p-an', name: 'An', level: 6, color: '#4ade80', bio: 'Thích kịch bản phỏng vấn.' },
    { id: 'p-linh', name: 'Linh', level: 5, color: '#fb7185', bio: 'Conversation chậm, sửa lỗi nhẹ.' },
  ].filter((p) => !excludeIds.includes(p.id));
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
}

export const SCENARIOS: TalkScenario[] = [
  {
    id: 'cafe-order',
    title: 'Order at a café',
    level: 'A2',
    setting: 'Quán cà phê gần trường',
    xpReward: 45,
    lines: [
      { role: 'A', en: 'Hi! What would you like to drink today?', vi: 'Chào! Bạn muốn uống gì hôm nay?', hint: 'Chào hỏi + hỏi đồ uống' },
      { role: 'B', en: "I'd like an iced latte, please. Not too sweet.", vi: 'Cho mình latte đá, ít ngọt.', hint: 'Gọi món + yêu cầu' },
      { role: 'A', en: 'Sure. Would you like any pastry with that?', vi: 'Ok. Bạn có muốn bánh không?', hint: 'Gợi ý thêm' },
      { role: 'B', en: 'Just a chocolate muffin, thanks.', vi: 'Thêm muffin sô-cô-la, cảm ơn.', hint: 'Chọn bánh' },
      { role: 'A', en: 'That will be 85,000 dong. Pay by cash or card?', vi: '85k. Tiền mặt hay thẻ?', hint: 'Thanh toán' },
      { role: 'B', en: "I'll pay by card. Could I sit by the window?", vi: 'Trả thẻ. Mình ngồi gần cửa sổ được không?', hint: 'Xin chỗ ngồi' },
      { role: 'A', en: 'Of course. Your order will be ready in a few minutes.', vi: 'Được chứ. Đồ uống sẽ xong trong vài phút.', hint: 'Kết thúc lịch sự' },
      { role: 'B', en: 'Perfect, thank you so much!', vi: 'Tuyệt, cảm ơn nhiều!', hint: 'Cảm ơn' },
    ],
  },
  {
    id: 'study-plan',
    title: 'Make a study plan',
    level: 'B1',
    setting: 'Góc bàn thư viện',
    xpReward: 55,
    lines: [
      { role: 'A', en: "We've got a vocabulary test next week. How should we prepare?", vi: 'Tuần sau có kiểm tra từ vựng. Mình ôn thế nào?', hint: 'Mở đầu vấn đề' },
      { role: 'B', en: "Let's review 20 words a day and make example sentences.", vi: 'Mỗi ngày ôn 20 từ và đặt câu.', hint: 'Đề xuất kế hoạch' },
      { role: 'A', en: 'Good idea. Do you prefer morning or evening sessions?', vi: 'Hay. Bạn thích học sáng hay tối?', hint: 'Hỏi lịch' },
      { role: 'B', en: 'Evening works better for me, after 7 p.m.', vi: 'Tối hợp hơn, sau 7 giờ.', hint: 'Trả lời thời gian' },
      { role: 'A', en: 'Same here. We can quiz each other for fifteen minutes.', vi: 'Mình cũng vậy. Quiz nhau 15 phút.', hint: 'Thêm hoạt động' },
      { role: 'B', en: "And if we forget a word, we put it on a 'hard list'.", vi: 'Quên từ nào thì cho vào list khó.', hint: 'Chiến lược nhớ' },
      { role: 'A', en: "Deal. Let's start with today's pack now.", vi: 'Chốt. Bắt đầu pack hôm nay luôn.', hint: 'Chốt & hành động' },
      { role: 'B', en: "I'm ready. You ask first!", vi: 'Sẵn sàng. Bạn hỏi trước!', hint: 'Khuyến khích' },
    ],
  },
  {
    id: 'library-whisper',
    title: 'Whisper in the library',
    level: 'A2–B1',
    setting: 'Thư viện — nói khẽ',
    xpReward: 40,
    lines: [
      { role: 'A', en: 'Psst… Is this seat taken?', vi: 'Psst… Chỗ này có ai ngồi không?', hint: 'Hỏi chỗ' },
      { role: 'B', en: "No, it's free. You can sit here.", vi: 'Không, trống đó. Ngồi đi.', hint: 'Mời ngồi' },
      { role: 'A', en: "Thanks. I'm looking for the English grammar shelf.", vi: 'Cảm ơn. Mình tìm kệ ngữ pháp Anh.', hint: 'Hỏi đường' },
      { role: 'B', en: "It's on the right, near the window.", vi: 'Bên phải, gần cửa sổ.', hint: 'Chỉ đường' },
      { role: 'A', en: 'Great. Do you mind if I plug in my laptop?', vi: 'Tuyệt. Mình cắm sạc laptop được không?', hint: 'Xin phép' },
      { role: 'B', en: 'No problem. Just keep the volume low.', vi: 'Không sao. Nhớ để nhỏ tiếng.', hint: 'Nhắc quy tắc' },
      { role: 'A', en: "Of course. I'm only reviewing flashcards.", vi: 'Tất nhiên. Mình chỉ ôn flashcard.', hint: 'Giải thích' },
      { role: 'B', en: 'Nice. Good luck with your study!', vi: 'Hay đó. Chúc ôn thi tốt!', hint: 'Động viên' },
    ],
  },
  {
    id: 'job-interview',
    title: 'Mini job interview',
    level: 'B1',
    setting: 'Phỏng vấn part-time',
    xpReward: 60,
    lines: [
      { role: 'A', en: 'Thanks for coming. Why do you want this part-time job?', vi: 'Cảm ơn bạn đã đến. Sao bạn muốn job này?', hint: 'Câu mở phỏng vấn' },
      { role: 'B', en: 'I want to improve my English and earn some experience.', vi: 'Muốn cải thiện tiếng Anh và có kinh nghiệm.', hint: 'Trả lời động lực' },
      { role: 'A', en: 'What are your strengths as a team member?', vi: 'Điểm mạnh khi làm việc nhóm?', hint: 'Hỏi điểm mạnh' },
      { role: 'B', en: "I'm reliable, friendly, and I learn quickly.", vi: 'Đáng tin, thân thiện, học nhanh.', hint: '3 điểm mạnh' },
      { role: 'A', en: 'Can you work weekend evenings?', vi: 'Bạn làm tối cuối tuần được không?', hint: 'Hỏi lịch' },
      { role: 'B', en: 'Yes, except Sunday nights when I have class.', vi: 'Được, trừ tối CN vì có lớp.', hint: 'Lịch + ngoại lệ' },
      { role: 'A', en: "That's fine. We'll contact you this week.", vi: 'Ok. Chúng tôi sẽ liên hệ trong tuần.', hint: 'Kết thúc' },
      { role: 'B', en: 'Thank you for your time. I look forward to hearing from you.', vi: 'Cảm ơn. Mong nhận phản hồi.', hint: 'Cảm ơn lịch sự' },
    ],
  },
];

/** Nhạc lofi/study free (stream) — fallback list */
export const STUDY_MUSIC: Array<{ id: string; title: string; url: string }> = [
  {
    id: 'helix1',
    title: 'Focus flow (demo stream)',
    // SoundHelix demo tracks — free for demo/testing
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'helix2',
    title: 'Soft loop (demo stream)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  },
  {
    id: 'helix3',
    title: 'Night desk (demo stream)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3',
  },
];

export const CHAT_BUBBLES = [
  'Reviewing Unit 3…',
  'Shh 📚',
  'Who wants to pair?',
  'Almost done!',
  'This word is hard 😅',
  'Good luck on the test!',
  'Focus mode on',
  'Coffee break soon',
  'Need a speaking partner',
  'Grammar notes ✓',
];

export function randomBubble(): string {
  return CHAT_BUBBLES[Math.floor(Math.random() * CHAT_BUBBLES.length)];
}

export function statusLabel(s: SeatStudent['status']): string {
  switch (s) {
    case 'studying':
      return 'Đang học';
    case 'paired':
      return 'Đang pair';
    case 'speaking':
      return 'Nói chuyện';
    default:
      return 'Rảnh';
  }
}
