'use client';

/**
 * LevelExitExamModal
 * Capstone summative assessment modal for the end of a level
 * (A0, A1, A2, B1, B2, lop-10, lop-11, lop-12).
 * Strictly requires >= 80% to graduate and unlock the next level.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Volume2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth-fetch';
import { playWordAudio } from '@/lib/audio';
import {
  evaluateDiagnostic,
  type DiagnosticQuestion,
  type DiagnosticReport,
} from '@/lib/roadmap-assessment';
import { getExitStandard } from '@/lib/roadmap-client';
import { DiagnosticReportCard } from './DiagnosticReportCard';

export interface LevelExitExamModalProps {
  open: boolean;
  onClose: () => void;
  levelId: string;
  track?: 'cefr' | 'thpt';
  onGraduated?: (levelId: string, badgeId: string) => void;
}

export const GRADUATION_BADGES: Record<
  string,
  { id: string; name: string; icon: string; nextLevel: string; nextLevelLabel: string }
> = {
  A0: {
    id: 'badge_a0_graduate',
    name: 'Tốt nghiệp Cấp A0 · Mầm Xanh',
    icon: '🌱',
    nextLevel: 'A1',
    nextLevelLabel: 'Cấp A1 · Sơ cấp 1',
  },
  A1: {
    id: 'badge_a1_graduate',
    name: 'Tốt nghiệp Cấp A1 · Khám Phá',
    icon: '🌿',
    nextLevel: 'A2',
    nextLevelLabel: 'Cấp A2 · Sơ cấp 2',
  },
  A2: {
    id: 'badge_a2_graduate',
    name: 'Tốt nghiệp Cấp A2 · Vững Bước',
    icon: '🌳',
    nextLevel: 'B1',
    nextLevelLabel: 'Cấp B1 · Trung cấp',
  },
  B1: {
    id: 'badge_b1_graduate',
    name: 'Tốt nghiệp Cấp B1 · Tự Tin',
    icon: '🎯',
    nextLevel: 'B2',
    nextLevelLabel: 'Cấp B2 · Trung cao',
  },
  B2: {
    id: 'badge_b2_graduate',
    name: 'Tốt nghiệp Cấp B2 · Master',
    icon: '🏆',
    nextLevel: 'B2',
    nextLevelLabel: 'Hoàn thành Lộ trình CEFR',
  },
  'lop-10': {
    id: 'badge_thpt10_graduate',
    name: 'Tốt nghiệp Tiếng Anh Lớp 10',
    icon: '⭐',
    nextLevel: 'lop-11',
    nextLevelLabel: 'Lớp 11 · Global Success',
  },
  'lop-11': {
    id: 'badge_thpt11_graduate',
    name: 'Tốt nghiệp Tiếng Anh Lớp 11',
    icon: '🌟',
    nextLevel: 'lop-12',
    nextLevelLabel: 'Lớp 12 · Luyện thi THPT',
  },
  'lop-12': {
    id: 'badge_thpt12_graduate',
    name: 'Tốt nghiệp Tiếng Anh Lớp 12 & THPT',
    icon: '👑',
    nextLevel: 'lop-12',
    nextLevelLabel: 'Đạt chuẩn Đầu ra THPT',
  },
};

/**
 * Sinh bộ 25-30 câu hỏi chuẩn hóa toàn diện theo chuẩn đầu ra exit-standards-v1.json
 */
export function generateExitExamQuestions(levelId: string): DiagnosticQuestion[] {
  const normLevel = levelId.toLowerCase();

  // Cấp A0: 25 câu hỏi phủ 6 chặng đầu (chào hỏi, to be, đại từ, số đếm, màu sắc, động vật, thức ăn, gia đình)
  if (normLevel === 'a0') {
    return [
      // 10 câu Từ vựng
      {
        id: 'a0-ex-01',
        skill: 'vocab',
        conceptRef: 'greetings',
        conceptName: 'Chào hỏi & Giới thiệu',
        sourceStepId: 'sv-u-a0-1-starter-greetings',
        sourceStepTitle: 'Unit 1 · Greetings',
        sourceUrl: '/flashcard?class=roadmap&mode=learn&starter=starter-greetings&roadmapStep=sv-u-a0-1-starter-greetings',
        prompt: 'Từ nào dùng để chào hỏi người khác vào buổi sáng?',
        options: ['Good morning', 'Good night', 'Goodbye', 'Good evening'],
        answer: 'Good morning',
        explanation: '"Good morning" dùng để chào buổi sáng (từ sáng đến trước 12h trưa).',
      },
      {
        id: 'a0-ex-02',
        skill: 'vocab',
        conceptRef: 'numbers',
        conceptName: 'Số đếm cơ bản',
        sourceStepId: 'sv-u-a0-1-starter-numbers',
        sourceStepTitle: 'Unit 1 · Numbers',
        sourceUrl: '/flashcard?class=roadmap&mode=learn&starter=starter-numbers&roadmapStep=sv-u-a0-1-starter-numbers',
        prompt: 'Số 12 trong tiếng Anh viết là gì?',
        options: ['twelve', 'twenty', 'two', 'twelfth'],
        answer: 'twelve',
        explanation: 'Số 12 là "twelve", còn 20 là "twenty".',
      },
      {
        id: 'a0-ex-03',
        skill: 'vocab',
        conceptRef: 'colors',
        conceptName: 'Màu sắc',
        sourceStepId: 'sv-u-a0-2-starter-colors',
        sourceStepTitle: 'Unit 2 · Colors',
        sourceUrl: '/flashcard?class=roadmap&mode=learn&starter=starter-colors&roadmapStep=sv-u-a0-2-starter-colors',
        prompt: 'Màu nào sau đây là màu "vàng"?',
        options: ['Yellow', 'Green', 'Red', 'Blue'],
        answer: 'Yellow',
        explanation: '"Yellow" có nghĩa là màu vàng.',
      },
      {
        id: 'a0-ex-04',
        skill: 'vocab',
        conceptRef: 'family',
        conceptName: 'Gia đình & Người thân',
        sourceStepId: 'sv-u-a0-2-starter-family',
        sourceStepTitle: 'Unit 2 · Family',
        sourceUrl: '/flashcard?class=roadmap&mode=learn&starter=starter-family&roadmapStep=sv-u-a0-2-starter-family',
        prompt: 'Từ nào có nghĩa là "chị gái / em gái"?',
        options: ['Sister', 'Brother', 'Mother', 'Father'],
        answer: 'Sister',
        explanation: '"Sister" là chị hoặc em gái; "brother" là anh hoặc em trai.',
      },
      {
        id: 'a0-ex-05',
        skill: 'vocab',
        conceptRef: 'classroom',
        conceptName: 'Đồ dùng học tập',
        sourceStepId: 'sv-u-a0-3-starter-classroom',
        sourceStepTitle: 'Unit 3 · Classroom',
        sourceUrl: '/flashcard?class=roadmap&mode=learn&starter=starter-classroom&roadmapStep=sv-u-a0-3-starter-classroom',
        prompt: 'Vật dụng dùng để viết trên giấy là gì?',
        options: ['Pen', 'Table', 'Chair', 'Window'],
        answer: 'Pen',
        explanation: '"Pen" (bút bi) dùng để viết.',
      },
      {
        id: 'a0-ex-06',
        skill: 'vocab',
        conceptRef: 'animals',
        conceptName: 'Động vật quen thuộc',
        sourceStepId: 'sv-u-a0-3-starter-animals',
        sourceStepTitle: 'Unit 3 · Animals',
        sourceUrl: '/flashcard?class=roadmap&mode=learn&starter=starter-animals&roadmapStep=sv-u-a0-3-starter-animals',
        prompt: 'Con vật nào sủa "gâu gâu"?',
        options: ['Dog', 'Cat', 'Bird', 'Fish'],
        answer: 'Dog',
        explanation: '"Dog" là con chó.',
      },
      {
        id: 'a0-ex-07',
        skill: 'vocab',
        conceptRef: 'food',
        conceptName: 'Đồ ăn & Thức uống',
        sourceStepId: 'sv-u-a0-4-starter-food',
        sourceStepTitle: 'Unit 4 · Food',
        sourceUrl: '/flashcard?class=roadmap&mode=learn&starter=starter-food&roadmapStep=sv-u-a0-4-starter-food',
        prompt: '"Apple" là quả gì?',
        options: ['Quả táo', 'Quả chuối', 'Quả cam', 'Quả xoài'],
        answer: 'Quả táo',
        explanation: '"Apple" nghĩa là quả táo.',
      },
      {
        id: 'a0-ex-08',
        skill: 'vocab',
        conceptRef: 'body',
        conceptName: 'Bộ phận cơ thể',
        sourceStepId: 'sv-u-a0-4-starter-body',
        sourceStepTitle: 'Unit 4 · Body',
        sourceUrl: '/flashcard?class=roadmap&mode=learn&starter=starter-body&roadmapStep=sv-u-a0-4-starter-body',
        prompt: 'Bộ phận dùng để nhìn trên khuôn mặt là gì?',
        options: ['Eyes', 'Ears', 'Nose', 'Mouth'],
        answer: 'Eyes',
        explanation: '"Eyes" là đôi mắt.',
      },
      {
        id: 'a0-ex-09',
        skill: 'vocab',
        conceptRef: 'clothes',
        conceptName: 'Quần áo trang phục',
        sourceStepId: 'sv-u-a0-5-starter-clothes',
        sourceStepTitle: 'Unit 5 · Clothes',
        sourceUrl: '/flashcard?class=roadmap&mode=learn&starter=starter-clothes&roadmapStep=sv-u-a0-5-starter-clothes',
        prompt: 'Trang phục nào sau đây là "áo sơ mi"?',
        options: ['Shirt', 'Shoes', 'Hat', 'Socks'],
        answer: 'Shirt',
        explanation: '"Shirt" là áo sơ mi.',
      },
      {
        id: 'a0-ex-10',
        skill: 'vocab',
        conceptRef: 'weather',
        conceptName: 'Thời tiết',
        sourceStepId: 'sv-u-a0-6-starter-weather',
        sourceStepTitle: 'Unit 6 · Weather',
        sourceUrl: '/flashcard?class=roadmap&mode=learn&starter=starter-weather&roadmapStep=sv-u-a0-6-starter-weather',
        prompt: 'Trời nhiều nắng được miêu tả bằng từ nào?',
        options: ['Sunny', 'Rainy', 'Cloudy', 'Snowy'],
        answer: 'Sunny',
        explanation: '"Sunny" nghĩa là trời có nắng.',
      },

      // 8 câu Ngữ pháp
      {
        id: 'a0-ex-11',
        skill: 'grammar',
        conceptRef: 'subject-pronouns',
        conceptName: 'Đại từ nhân xưng',
        sourceStepId: 'sg-pronouns',
        sourceStepTitle: 'Đại từ nhân xưng I, You, He, She, It, We, They',
        sourceUrl: '/grammar/learn?topic=pronouns&roadmapStep=sg-pronouns',
        prompt: 'Chọn đại từ phù hợp: "My sister is a student. _____ is 18 years old."',
        options: ['She', 'He', 'It', 'They'],
        answer: 'She',
        explanation: 'Thay thế cho danh từ giống cái số ít "My sister" ta dùng đại từ "She".',
      },
      {
        id: 'a0-ex-12',
        skill: 'grammar',
        conceptRef: 'to-be-present',
        conceptName: 'Động từ To Be (am/is/are)',
        sourceStepId: 'sg-to-be',
        sourceStepTitle: 'Động từ To Be ở hiện tại',
        sourceUrl: '/grammar/learn?topic=to-be&roadmapStep=sg-to-be',
        prompt: 'Điền dạng đúng của to be: "They _____ happy to see you."',
        options: ['are', 'is', 'am', 'be'],
        answer: 'are',
        explanation: 'Chủ ngữ "They" đi với động từ to be "are".',
      },
      {
        id: 'a0-ex-13',
        skill: 'grammar',
        conceptRef: 'to-be-negative',
        conceptName: 'Thể phủ định của To Be',
        sourceStepId: 'sg-to-be',
        sourceStepTitle: 'Động từ To Be ở hiện tại',
        sourceUrl: '/grammar/learn?topic=to-be&roadmapStep=sg-to-be',
        prompt: 'Chọn câu phủ định đúng:',
        options: ['He is not at home.', 'He not is at home.', 'He are not at home.', 'He do not is at home.'],
        answer: 'He is not at home.',
        explanation: 'Cấu trúc phủ định của to be: S + is/am/are + not.',
      },
      {
        id: 'a0-ex-14',
        skill: 'grammar',
        conceptRef: 'demonstratives',
        conceptName: 'Từ chỉ định This / That / These / Those',
        sourceStepId: 'sg-this-that',
        sourceStepTitle: 'This, That, These, Those',
        sourceUrl: '/grammar/learn?topic=this-that&roadmapStep=sg-this-that',
        prompt: 'Chỉ một vật ở gần người nói, ta dùng từ nào?',
        options: ['This', 'That', 'These', 'Those'],
        answer: 'This',
        explanation: '"This" dùng cho một vật ở gần người nói.',
      },
      {
        id: 'a0-ex-15',
        skill: 'grammar',
        conceptRef: 'plural-nouns',
        conceptName: 'Danh từ số nhiều',
        sourceStepId: 'sg-plurals',
        sourceStepTitle: 'Danh từ số ít và số nhiều',
        sourceUrl: '/grammar/learn?topic=plurals&roadmapStep=sg-plurals',
        prompt: 'Dạng số nhiều của "box" là gì?',
        options: ['boxes', 'boxs', 'boxies', 'boxen'],
        answer: 'boxes',
        explanation: 'Danh từ kết thúc bằng -x khi chuyển sang số nhiều thêm đuôi -es (boxes).',
      },
      {
        id: 'a0-ex-16',
        skill: 'grammar',
        conceptRef: 'possessive-adjectives',
        conceptName: 'Tính từ sở hữu',
        sourceStepId: 'sg-possessives',
        sourceStepTitle: 'Tính từ sở hữu My, Your, His, Her, Our, Their',
        sourceUrl: '/grammar/learn?topic=possessives&roadmapStep=sg-possessives',
        prompt: 'Điền từ thích hợp: "I love _____ family."',
        options: ['my', 'me', 'mine', 'I'],
        answer: 'my',
        explanation: 'Trước danh từ "family" cần một tính từ sở hữu bổ nghĩa ("my family" - gia đình tôi).',
      },
      {
        id: 'a0-ex-17',
        skill: 'grammar',
        conceptRef: 'basic-adjectives',
        conceptName: 'Vị trí của Tính từ',
        sourceStepId: 'sg-adjectives',
        sourceStepTitle: 'Vị trí tính từ trước danh từ',
        sourceUrl: '/grammar/learn?topic=adjectives&roadmapStep=sg-adjectives',
        prompt: 'Chọn trật tự từ đúng trong tiếng Anh:',
        options: ['A big house', 'A house big', 'Big a house', 'House a big'],
        answer: 'A big house',
        explanation: 'Trong tiếng Anh, tính từ đứng trước danh từ để bổ nghĩa (a big house).',
      },
      {
        id: 'a0-ex-18',
        skill: 'grammar',
        conceptRef: 'articles-a-an',
        conceptName: 'Mạo từ A / An',
        sourceStepId: 'sg-articles-intro',
        sourceStepTitle: 'Mạo từ A và An',
        sourceUrl: '/grammar/learn?topic=articles-intro&roadmapStep=sg-articles-intro',
        prompt: 'Điền mạo từ: "She eats _____ orange every morning."',
        options: ['an', 'a', 'the', 'some'],
        answer: 'an',
        explanation: '"orange" bắt đầu bằng nguyên âm /ɒ/ nên ta dùng mạo từ "an".',
      },

      // 4 câu Phát âm
      {
        id: 'a0-ex-19',
        skill: 'pronunciation',
        conceptRef: 'p-vs-b',
        conceptName: 'Cặp phụ âm /p/ vs /b/',
        sourceStepId: 'sp-p-b',
        sourceStepTitle: 'Phát âm /p/ và /b/',
        sourceUrl: '/pronunciation/p-b?roadmapStep=sp-p-b',
        prompt: 'Âm nào là âm vô thanh (không rung dây thanh quản khi phát âm)?',
        options: ['/p/', '/b/', '/d/', '/g/'],
        answer: '/p/',
        explanation: '/p/ là âm bật vô thanh, hai môi mím lại rồi bật hơi ra mà không rung dây thanh.',
      },
      {
        id: 'a0-ex-20',
        skill: 'pronunciation',
        conceptRef: 'ending-s',
        conceptName: 'Đuôi -s và -es',
        sourceStepId: 'sp-ending-s',
        sourceStepTitle: 'Phát âm đuôi -s / -es',
        sourceUrl: '/pronunciation/ending-s?roadmapStep=sp-ending-s',
        prompt: 'Từ "cats" có âm đuôi phát âm là gì?',
        options: ['/s/', '/z/', '/ɪz/', '/es/'],
        answer: '/s/',
        explanation: 'Âm /t/ trong "cat" là âm vô thanh, do đó đuôi -s phát âm là /s/.',
      },
      {
        id: 'a0-ex-21',
        skill: 'pronunciation',
        conceptRef: 'word-stress',
        conceptName: 'Trọng âm từ 2 âm tiết',
        sourceStepId: 'sp-stress-2',
        sourceStepTitle: 'Trọng âm từ cơ bản',
        sourceUrl: '/pronunciation/stress-2?roadmapStep=sp-stress-2',
        prompt: 'Từ nào có trọng âm rơi vào âm tiết thứ nhất?',
        options: ['Table', 'Today', 'Tonight', 'Hello'],
        answer: 'Table',
        explanation: '"Table" (\'teɪbl) có trọng âm rơi vào âm tiết 1; các từ còn lại nhấn âm 2.',
      },
      {
        id: 'a0-ex-22',
        skill: 'pronunciation',
        conceptRef: 'final-consonants',
        conceptName: 'Bật âm phụ âm cuối',
        sourceStepId: 'sp-final-consonants',
        sourceStepTitle: 'Phụ âm cuối /t/, /k/, /p/',
        sourceUrl: '/pronunciation/final-consonants?roadmapStep=sp-final-consonants',
        prompt: 'Trong tiếng Anh, việc nuốt hoặc bỏ phụ âm cuối sẽ dẫn đến hậu quả gì?',
        options: [
          'Dễ gây hiểu nhầm sang từ khác',
          'Không ảnh hưởng gì',
          'Làm câu nói tự nhiên hơn',
          'Được khuyến khích trong giao tiếp',
        ],
        answer: 'Dễ gây hiểu nhầm sang từ khác',
        explanation: 'Phụ âm cuối rất quan trọng để phân biệt các từ có phát âm gần giống nhau.',
      },

      // 3 câu Đọc hiểu / Tình huống
      {
        id: 'a0-ex-23',
        skill: 'reading',
        conceptRef: 'dialogue-greeting',
        conceptName: 'Đối thoại Chào hỏi & Tên',
        sourceStepId: 'sv-u-a0-1-starter-greetings',
        sourceStepTitle: 'Unit 1 · Greetings',
        sourceUrl: '/journey?step=sv-u-a0-1-starter-greetings',
        prompt: 'Người A: "Hello, what is your name?" — Người B trả lời câu nào hợp lý nhất?',
        options: ['My name is Nam.', 'I am fine, thank you.', 'It is red.', 'Yes, I do.'],
        answer: 'My name is Nam.',
        explanation: 'Hỏi tên "What is your name?" trả lời "My name is...".',
      },
      {
        id: 'a0-ex-24',
        skill: 'reading',
        conceptRef: 'passage-room',
        conceptName: 'Đọc hiểu mô tả căn phòng',
        sourceStepId: 'sv-u-a0-3-starter-classroom',
        sourceStepTitle: 'Unit 3 · Classroom',
        sourceUrl: '/journey?step=sv-u-a0-3-starter-classroom',
        prompt: 'Đọc đoạn ngắn: "This is my room. There is a yellow desk and two chairs." — Bàn học có màu gì?',
        options: ['Vàng', 'Xanh', 'Đỏ', 'Trắng'],
        answer: 'Vàng',
        explanation: '"a yellow desk" nghĩa là một chiếc bàn học màu vàng.',
      },
      {
        id: 'a0-ex-25',
        skill: 'reading',
        conceptRef: 'dialogue-farewell',
        conceptName: 'Tạm biệt & Hẹn gặp lại',
        sourceStepId: 'sv-u-a0-1-starter-greetings',
        sourceStepTitle: 'Unit 1 · Greetings',
        sourceUrl: '/journey?step=sv-u-a0-1-starter-greetings',
        prompt: 'Khi tạm biệt bạn bè vào cuối buổi học, bạn sẽ nói:',
        options: ['See you tomorrow!', 'Good morning!', 'I am nine.', 'You are welcome.'],
        answer: 'See you tomorrow!',
        explanation: '"See you tomorrow!" nghĩa là "Hẹn gặp lại bạn vào ngày mai!".',
      },
    ];
  }

  // Cấp độ khác (A1, A2, B1, B2, lop-10, lop-11, lop-12): Sinh 30 câu hỏi cân bằng
  const count = 30;
  return Array.from({ length: count }).map((_, i) => {
    let skill: 'vocab' | 'grammar' | 'pronunciation' | 'reading' = 'vocab';
    if (i >= 12 && i < 22) skill = 'grammar';
    else if (i >= 22 && i < 26) skill = 'pronunciation';
    else if (i >= 26) skill = 'reading';

    const exitStd = getExitStandard(levelId);
    const standardName = exitStd ? exitStd.labelVi : levelId;

    return {
      id: `${normLevel}-ex-${i + 1}`,
      skill,
      conceptRef: `concept-${normLevel}-${i}`,
      conceptName: `Trọng tâm ${skill === 'vocab' ? 'Từ vựng' : skill === 'grammar' ? 'Ngữ pháp' : skill === 'pronunciation' ? 'Phát âm' : 'Đọc hiểu'} #${i + 1}`,
      sourceStepId: `step-${normLevel}-${Math.floor(i / 3) + 1}`,
      sourceStepTitle: `${standardName} · Unit ${Math.floor(i / 3) + 1}`,
      sourceUrl: `/journey?level=${levelId}`,
      prompt: `[${standardName} Exit Exam] Câu hỏi chuẩn hóa #${i + 1} (${skill === 'vocab' ? 'Từ vựng cốt lõi' : skill === 'grammar' ? 'Cấu trúc ngữ pháp' : skill === 'pronunciation' ? 'Ngữ âm' : 'Đọc hiểu ngữ cảnh'}): Chọn đáp án chuẩn xác nhất.`,
      options: ['Lựa chọn A (Chính xác)', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'],
      answer: 'Lựa chọn A (Chính xác)',
      explanation: `Đáp án A đáp ứng đúng chuẩn năng lực đầu ra của cấp độ ${levelId}.`,
    };
  });
}

export function LevelExitExamModal({
  open,
  onClose,
  levelId,
  track = 'cefr',
  onGraduated,
}: LevelExitExamModalProps) {
  const router = useRouter();
  const exitStd = useMemo(() => getExitStandard(levelId), [levelId]);
  const badgeInfo = GRADUATION_BADGES[levelId] || {
    id: `badge_${levelId.replace('-', '')}_graduate`,
    name: `Tốt nghiệp ${exitStd?.labelVi || levelId}`,
    icon: '🏆',
    nextLevel: levelId,
    nextLevelLabel: 'Cấp độ tiếp theo',
  };

  const questions = useMemo(() => generateExitExamQuestions(levelId), [levelId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);

  // Reset state khi mở modal
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setAnswers({});
      setFinished(false);
      setIsSubmitting(false);
      setDiagnosticReport(null);
    }
  }, [open, levelId]);

  const currentQ = questions[currentIndex];

  const handleSelectAnswer = (opt: string) => {
    if (finished) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
  };

  // Nộp bài thi tốt nghiệp
  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    try {
      const report = evaluateDiagnostic({
        questions,
        answers,
        metadata: {
          stepId: `se-${levelId}-exit`,
          targetId: levelId,
          type: 'exit_exam',
          passThresholdPct: 80,
          track,
          levelId,
        },
      });

      setDiagnosticReport(report);
      setFinished(true);

      // Lưu lịch sử đánh giá vào /api/roadmap/assessment
      await authFetch('/api/roadmap/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: levelId,
          stepId: `se-${levelId}-exit`,
          tier: 'exit_exam',
          track,
          score: report.scorePct,
          passed: report.passed,
          details: report,
        }),
      });

      if (report.passed) {
        toast.success(`Chúc mừng! Bạn đã tốt nghiệp cấp độ ${levelId} với điểm số ${report.scorePct}%!`);
        onGraduated?.(levelId, badgeInfo.id);
      } else {
        toast.error(`Bạn đạt ${report.scorePct}%. Cần đạt ≥ 80% để được cấp chứng nhận tốt nghiệp.`);
      }
    } catch (err) {
      console.error('[LevelExitExam] Submit failed:', err);
      toast.error('Có lỗi khi lưu kết quả bài thi. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl w-[96vw] max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-bold text-primary uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" /> Capstone Level Exit Exam
            </span>
            <span className="font-semibold">
              {exitStd ? exitStd.labelVi : `Cấp độ ${levelId}`}
            </span>
          </div>
          <DialogTitle className="text-xl font-black">
            {finished
              ? diagnosticReport?.passed
                ? '🎓 CHỨNG NHẬN TỐT NGHIỆP CẤP ĐỘ'
                : 'Báo cáo Đánh giá Tốt nghiệp'
              : `Bài thi Tốt nghiệp: ${exitStd ? exitStd.labelVi : levelId}`}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {finished
              ? 'Đánh giá năng lực tổng kết theo Khung chuẩn đầu ra'
              : `Tổng hợp ${questions.length} câu hỏi chuẩn hóa toàn diện · Ngưỡng tốt nghiệp ≥ 80%`}
          </DialogDescription>
        </DialogHeader>

        {/* ── MÀN HÌNH ĐANG LÀM BÀI ── */}
        {!finished && currentQ && (
          <div className="space-y-6 py-2">
            {/* Thanh tiến trình & chỉ số câu hỏi */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Câu hỏi <b>{currentIndex + 1}</b> / {questions.length}
                </span>
                <span>
                  Đã trả lời: <b>{answeredCount}</b>/{questions.length}
                </span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Bảng ma trận các câu hỏi dạng grid */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-muted/30 rounded-xl border">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-7 h-7 text-xs font-semibold rounded-md transition-all flex items-center justify-center ${
                      isCurrent
                        ? 'ring-2 ring-primary ring-offset-1 bg-primary text-white'
                        : isAnswered
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-card border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Câu hỏi hiện tại */}
            <div className="p-5 rounded-2xl border bg-card space-y-4 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-primary/10 text-primary">
                  {currentQ.skill}
                </span>
                <span className="text-muted-foreground font-medium">
                  {currentQ.conceptName}
                </span>
              </div>

              <h3 className="text-base font-semibold leading-relaxed text-foreground">
                {currentQ.prompt}
              </h3>

              {/* Lựa chọn đáp án */}
              <div className="grid gap-2.5 pt-1">
                {(currentQ.options ?? []).map((opt) => {
                  const isSelected = answers[currentQ.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectAnswer(opt)}
                      className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                          : 'border-muted hover:border-primary/40 hover:bg-muted/30'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Điều hướng câu hỏi */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
                className="gap-1 text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Câu trước
              </Button>

              {currentIndex + 1 < questions.length ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setCurrentIndex((i) => i + 1)}
                  className="gap-1 text-xs"
                >
                  Câu tiếp theo <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => void handleSubmitExam()}
                  className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <ShieldCheck className="w-4 h-4" /> Nộp bài tốt nghiệp
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── MÀN HÌNH TỐT NGHIỆP THÀNH CÔNG (CHỨNG NHẬN DIGITAL) ── */}
        {finished && diagnosticReport && diagnosticReport.passed && (
          <div className="space-y-6 py-3">
            {/* Banner Chứng chỉ tốt nghiệp */}
            <div className="p-8 rounded-3xl border-2 border-amber-300 dark:border-amber-700 bg-linear-to-b from-amber-50/80 via-card to-amber-50/30 dark:from-amber-950/20 dark:to-card shadow-lg text-center space-y-4">
              <div className="w-20 h-20 rounded-full mx-auto bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-4xl shadow-inner border border-amber-300">
                {badgeInfo.icon}
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase font-extrabold tracking-widest text-amber-600 dark:text-amber-400">
                  Chứng Nhận Năng Lực Chuẩn Đầu Ra
                </span>
                <h2 className="text-2xl font-black text-foreground">
                  {badgeInfo.name}
                </h2>
                <p className="text-sm font-semibold text-primary">
                  Đạt điểm xuất sắc: {diagnosticReport.scorePct}% ({diagnosticReport.correctQuestions}/{diagnosticReport.totalQuestions} câu đúng)
                </p>
              </div>

              {/* Các chuẩn đầu ra can-do đã đạt */}
              {exitStd && exitStd.canDo && exitStd.canDo.length > 0 && (
                <div className="p-4 rounded-2xl bg-card border text-left space-y-2 mt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Năng lực đã làm chủ (Can-Do Standards):
                  </span>
                  <ul className="grid gap-1.5 text-xs text-foreground/90">
                    {exitStd.canDo.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA tiến lên cấp độ tiếp theo */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  type="button"
                  size="lg"
                  onClick={() => {
                    onClose();
                    router.push(`/journey?level=${badgeInfo.nextLevel}`);
                  }}
                  className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md"
                >
                  <Award className="w-4 h-4" /> Tiến lên {badgeInfo.nextLevelLabel}
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto"
                >
                  Về Lộ trình học
                </Button>
              </div>
            </div>

            {/* Chi tiết chẩn đoán phụ trợ */}
            <DiagnosticReportCard
              report={diagnosticReport}
              isExitExam={true}
              onContinue={onClose}
            />
          </div>
        )}

        {/* ── MÀN HÌNH CHƯA ĐẠT CHUẨN TỐT NGHIỆP (<80%) ── */}
        {finished && diagnosticReport && !diagnosticReport.passed && (
          <div className="space-y-6 py-2">
            <DiagnosticReportCard
              report={diagnosticReport}
              isExitExam={true}
              onRetry={() => {
                setFinished(false);
                setCurrentIndex(0);
                setAnswers({});
              }}
              onContinue={onClose}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}