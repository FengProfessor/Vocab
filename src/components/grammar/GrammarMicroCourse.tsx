'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Volume2 } from 'lucide-react';
import { speak } from '@/lib/study';
import { supabase } from '@/lib/supabase';

type Step = {
  title: string;
  scene: string;
  hint: string;
  sentence: string;
  meaning: string;
  question: string;
  choices: readonly [string, string, string];
  answer: string;
  explanation: string;
};

// Mỗi bước chỉ thêm một cấu trúc. Từ vựng cũ được dùng lại ở bước sau.
const A0_STEPS: readonly Step[] = [
  { title: 'Tôi là ai?', scene: '🧑', hint: 'I = tôi. Sau I dùng am.', sentence: 'I am Mai.', meaning: 'Tôi là Mai.', question: 'Tôi là Mai.', choices: ['I is Mai.', 'I am Mai.', 'I are Mai.'], answer: 'I am Mai.', explanation: 'I luôn đi với am.' },
  { title: 'Bạn là ai?', scene: '👋', hint: 'You = bạn. Sau you dùng are.', sentence: 'You are Nam.', meaning: 'Bạn là Nam.', question: 'Bạn là Nam.', choices: ['You is Nam.', 'You am Nam.', 'You are Nam.'], answer: 'You are Nam.', explanation: 'You đi với are.' },
  { title: 'Cô ấy là ai?', scene: '👩', hint: 'She = cô ấy. Sau she dùng is.', sentence: 'She is Lan.', meaning: 'Cô ấy là Lan.', question: 'Cô ấy là Lan.', choices: ['She is Lan.', 'She are Lan.', 'She am Lan.'], answer: 'She is Lan.', explanation: 'She đi với is.' },
  { title: 'Anh ấy là ai?', scene: '👨', hint: 'He = anh ấy. Sau he dùng is.', sentence: 'He is Minh.', meaning: 'Anh ấy là Minh.', question: 'Anh ấy là Minh.', choices: ['He am Minh.', 'He is Minh.', 'He are Minh.'], answer: 'He is Minh.', explanation: 'He đi với is.' },
  { title: 'Một đồ vật', scene: '🍎', hint: 'It = nó. Dùng it khi nói về đồ vật hoặc con vật.', sentence: 'It is an apple.', meaning: 'Nó là một quả táo.', question: 'Nó là một quả táo.', choices: ['It are an apple.', 'It is an apple.', 'It am an apple.'], answer: 'It is an apple.', explanation: 'It đi với is. Apple bắt đầu bằng nguyên âm nên dùng an.' },
  { title: 'Tên + đồ vật', scene: '📚', hint: 'A book = một quyển sách. Dùng a trước âm phụ âm.', sentence: 'It is a book.', meaning: 'Nó là một quyển sách.', question: 'Nó là một quyển sách.', choices: ['It is an book.', 'It are a book.', 'It is a book.'], answer: 'It is a book.', explanation: 'Book bắt đầu bằng âm /b/ nên dùng a.' },
  { title: 'Nói về mình', scene: '😊', hint: 'Thêm tính từ sau am để miêu tả.', sentence: 'I am happy.', meaning: 'Tôi vui.', question: 'Tôi vui.', choices: ['I happy am.', 'I am happy.', 'I is happy.'], answer: 'I am happy.', explanation: 'Thứ tự: I + am + tính từ.' },
  { title: 'Nói về người khác', scene: '🙂', hint: 'She + is + tính từ.', sentence: 'She is happy.', meaning: 'Cô ấy vui.', question: 'Cô ấy vui.', choices: ['She is happy.', 'She happy is.', 'She are happy.'], answer: 'She is happy.', explanation: 'Thứ tự: She + is + tính từ.' },
  { title: 'Phủ định đầu tiên', scene: '🙁', hint: 'Đặt not sau am/is/are để nói “không”.', sentence: 'I am not sad.', meaning: 'Tôi không buồn.', question: 'Tôi không buồn.', choices: ['I not am sad.', 'I am not sad.', 'I is not sad.'], answer: 'I am not sad.', explanation: 'Not đứng sau am.' },
  { title: 'Hỏi tên', scene: '❓', hint: 'Đưa are lên trước you để hỏi.', sentence: 'Are you Nam?', meaning: 'Bạn có phải Nam không?', question: 'Bạn có phải Nam không?', choices: ['You are Nam?', 'Is you Nam?', 'Are you Nam?'], answer: 'Are you Nam?', explanation: 'Câu hỏi: Are + you + tên?' },
  { title: 'Trả lời ngắn', scene: '✅', hint: 'Yes, I am. = Vâng, đúng vậy.', sentence: 'Yes, I am.', meaning: 'Vâng, đúng vậy.', question: 'Trả lời “Are you Nam?” khi đúng.', choices: ['Yes, I is.', 'Yes, I am.', 'Yes, I are.'], answer: 'Yes, I am.', explanation: 'Trả lời với I: Yes, I am.' },
  { title: 'Ôn câu phủ định', scene: '🚫', hint: 'No, I am not. = Không, không phải.', sentence: 'No, I am not.', meaning: 'Không, không phải.', question: 'Trả lời “Are you Nam?” khi không đúng.', choices: ['No, I am not.', 'No, I is not.', 'No, I are not.'], answer: 'No, I am not.', explanation: 'Phủ định với I: I am not.' },
  { title: 'Vật ở gần', scene: '📖', hint: 'This = cái này, dùng cho một vật ở gần.', sentence: 'This is a book.', meaning: 'Đây là một quyển sách.', question: 'Đây là một quyển sách.', choices: ['This are a book.', 'This is a book.', 'These is a book.'], answer: 'This is a book.', explanation: 'Một vật ở gần: This + is.' },
  { title: 'Vật ở xa', scene: '🏠', hint: 'That = cái kia, dùng cho một vật ở xa.', sentence: 'That is a house.', meaning: 'Kia là một ngôi nhà.', question: 'Kia là một ngôi nhà.', choices: ['That is a house.', 'That are a house.', 'Those is a house.'], answer: 'That is a house.', explanation: 'Một vật ở xa: That + is.' },
  { title: 'Nhiều vật ở gần', scene: '📚', hint: 'These = những cái này. Danh từ số nhiều thường thêm -s.', sentence: 'These are books.', meaning: 'Đây là những quyển sách.', question: 'Đây là những quyển sách.', choices: ['These is books.', 'This are books.', 'These are books.'], answer: 'These are books.', explanation: 'Nhiều vật ở gần: These + are + books.' },
  { title: 'Nhiều vật ở xa', scene: '🍎', hint: 'Those = những cái kia.', sentence: 'Those are apples.', meaning: 'Kia là những quả táo.', question: 'Kia là những quả táo.', choices: ['Those are apples.', 'That are apples.', 'Those is apples.'], answer: 'Those are apples.', explanation: 'Nhiều vật ở xa: Those + are + apples.' },
  { title: 'Đồ của tôi', scene: '📓', hint: 'My đứng trước danh từ để nói của tôi.', sentence: 'This is my book.', meaning: 'Đây là sách của tôi.', question: 'Đây là sách của tôi.', choices: ['This is I book.', 'This is my book.', 'This is me book.'], answer: 'This is my book.', explanation: 'My + danh từ.' },
  { title: 'Đồ của bạn', scene: '🎒', hint: 'Your đứng trước danh từ để nói của bạn.', sentence: 'That is your bag.', meaning: 'Kia là túi của bạn.', question: 'Kia là túi của bạn.', choices: ['That is you bag.', 'That are your bag.', 'That is your bag.'], answer: 'That is your bag.', explanation: 'Your + danh từ.' },
  { title: 'Đồ của anh ấy', scene: '🐕', hint: 'His = của anh ấy.', sentence: 'This is his dog.', meaning: 'Đây là chó của anh ấy.', question: 'Đây là chó của anh ấy.', choices: ['This is his dog.', 'This is he dog.', 'This are his dog.'], answer: 'This is his dog.', explanation: 'His + danh từ.' },
  { title: 'Đồ của cô ấy', scene: '🐈', hint: 'Her = của cô ấy.', sentence: 'That is her cat.', meaning: 'Kia là mèo của cô ấy.', question: 'Kia là mèo của cô ấy.', choices: ['That is she cat.', 'That is her cat.', 'That are her cat.'], answer: 'That is her cat.', explanation: 'Her + danh từ.' },
  { title: 'Tôi có', scene: '👜', hint: 'I + have + đồ vật.', sentence: 'I have a bag.', meaning: 'Tôi có một chiếc túi.', question: 'Tôi có một chiếc túi.', choices: ['I has a bag.', 'I am have a bag.', 'I have a bag.'], answer: 'I have a bag.', explanation: 'Sau I dùng have.' },
  { title: 'Cô ấy có', scene: '🎒', hint: 'She + has + đồ vật.', sentence: 'She has a bag.', meaning: 'Cô ấy có một chiếc túi.', question: 'Cô ấy có một chiếc túi.', choices: ['She has a bag.', 'She have a bag.', 'She is has a bag.'], answer: 'She has a bag.', explanation: 'Sau she dùng has.' },
  { title: 'Hỏi vật gì', scene: '❔', hint: 'What = cái gì. Hỏi: What is this?', sentence: 'What is this?', meaning: 'Đây là cái gì?', question: 'Đây là cái gì?', choices: ['What this is?', 'What is this?', 'What are this?'], answer: 'What is this?', explanation: 'What + is + this?' },
  { title: 'Hỏi ở đâu', scene: '📍', hint: 'Where = ở đâu. Hỏi vị trí một vật.', sentence: 'Where is my book?', meaning: 'Sách của tôi ở đâu?', question: 'Sách của tôi ở đâu?', choices: ['Where are my book?', 'Where my book is?', 'Where is my book?'], answer: 'Where is my book?', explanation: 'Where + is + my book?' },
];

const A1_STEPS: readonly Step[] = [
  { title: 'Một vật ở đây', scene: '🐈', hint: 'There is + một vật.', sentence: 'There is a cat.', meaning: 'Có một con mèo.', question: 'Có một con mèo.', choices: ['There are a cat.', 'There is a cat.', 'There be a cat.'], answer: 'There is a cat.', explanation: 'Một vật: There is.' },
  { title: 'Nhiều vật ở đây', scene: '🐈', hint: 'There are + nhiều vật.', sentence: 'There are two cats.', meaning: 'Có hai con mèo.', question: 'Có hai con mèo.', choices: ['There is two cats.', 'There are two cats.', 'There are two cat.'], answer: 'There are two cats.', explanation: 'Hai con mèo: There are + danh từ số nhiều.' },
  { title: 'Một vật chưa xác định', scene: '🍎', hint: 'An đứng trước âm nguyên âm.', sentence: 'I have an apple.', meaning: 'Tôi có một quả táo.', question: 'Tôi có một quả táo.', choices: ['I have a apple.', 'I have an apple.', 'I has an apple.'], answer: 'I have an apple.', explanation: 'Apple bắt đầu bằng âm nguyên âm, dùng an.' },
  { title: 'Vật đã biết', scene: '📖', hint: 'The dùng khi người nghe biết bạn nói về vật nào.', sentence: 'The book is here.', meaning: 'Quyển sách đó ở đây.', question: 'Quyển sách đó ở đây.', choices: ['A book is here.', 'The book is here.', 'An book is here.'], answer: 'The book is here.', explanation: 'The chỉ quyển sách cụ thể đã biết.' },
  { title: 'Thói quen của tôi', scene: '🏠', hint: 'I + động từ nguyên thể để nói thói quen.', sentence: 'I work every day.', meaning: 'Tôi làm việc mỗi ngày.', question: 'Tôi làm việc mỗi ngày.', choices: ['I works every day.', 'I work every day.', 'I am work every day.'], answer: 'I work every day.', explanation: 'Hiện tại đơn với I: work.' },
  { title: 'Thói quen của cô ấy', scene: '👩', hint: 'She + động từ thêm -s.', sentence: 'She works every day.', meaning: 'Cô ấy làm việc mỗi ngày.', question: 'Cô ấy làm việc mỗi ngày.', choices: ['She work every day.', 'She works every day.', 'She is works every day.'], answer: 'She works every day.', explanation: 'Hiện tại đơn với she: works.' },
  { title: 'Tôi không làm', scene: '🚫', hint: 'I + do not / don’t + động từ nguyên thể.', sentence: 'I do not work today.', meaning: 'Hôm nay tôi không làm việc.', question: 'Hôm nay tôi không làm việc.', choices: ['I do not work today.', 'I not work today.', 'I do not works today.'], answer: 'I do not work today.', explanation: 'Do not + work; không thêm -s.' },
  { title: 'Cô ấy không làm', scene: '🚫', hint: 'She + does not + động từ nguyên thể.', sentence: 'She does not work today.', meaning: 'Hôm nay cô ấy không làm việc.', question: 'Hôm nay cô ấy không làm việc.', choices: ['She does not works today.', 'She do not work today.', 'She does not work today.'], answer: 'She does not work today.', explanation: 'Does not + work; động từ về nguyên thể.' },
  { title: 'Hỏi thói quen', scene: '❓', hint: 'Do + you + động từ nguyên thể?', sentence: 'Do you work here?', meaning: 'Bạn làm việc ở đây à?', question: 'Bạn làm việc ở đây à?', choices: ['Do you work here?', 'Are you work here?', 'Does you work here?'], answer: 'Do you work here?', explanation: 'Câu hỏi hiện tại đơn với you dùng Do.' },
  { title: 'Hỏi về cô ấy', scene: '❓', hint: 'Does + she + động từ nguyên thể?', sentence: 'Does she work here?', meaning: 'Cô ấy làm việc ở đây à?', question: 'Cô ấy làm việc ở đây à?', choices: ['Does she works here?', 'Does she work here?', 'Do she work here?'], answer: 'Does she work here?', explanation: 'Does đã mang dấu hiệu ngôi ba, work không thêm -s.' },
  { title: 'Nói tần suất', scene: '☕', hint: 'Always đứng trước động từ thường.', sentence: 'I always drink water.', meaning: 'Tôi luôn uống nước.', question: 'Tôi luôn uống nước.', choices: ['I drink always water.', 'I always drink water.', 'I am always drink water.'], answer: 'I always drink water.', explanation: 'Always đứng trước drink.' },
  { title: 'Việc đang diễn ra', scene: '📖', hint: 'She is + V-ing khi việc đang xảy ra.', sentence: 'She is reading now.', meaning: 'Bây giờ cô ấy đang đọc.', question: 'Bây giờ cô ấy đang đọc.', choices: ['She reads now.', 'She is read now.', 'She is reading now.'], answer: 'She is reading now.', explanation: 'Is + reading diễn tả việc đang diễn ra.' },
  { title: 'Nhiều người đang làm', scene: '⚽', hint: 'They = họ. Với they, dùng are + động từ thêm -ing.', sentence: 'They are playing now.', meaning: 'Bây giờ họ đang chơi.', question: 'Bây giờ họ đang chơi.', choices: ['They is playing now.', 'They are playing now.', 'They are play now.'], answer: 'They are playing now.', explanation: 'They + are + playing.' },
  { title: 'Vị trí đồ vật', scene: '📚', hint: 'On = ở trên bề mặt.', sentence: 'The book is on the table.', meaning: 'Quyển sách ở trên bàn.', question: 'Quyển sách ở trên bàn.', choices: ['The book is in the table.', 'The book is on the table.', 'The book is at the table.'], answer: 'The book is on the table.', explanation: 'Trên bề mặt bàn dùng on.' },
  { title: 'Lời chỉ dẫn', scene: '👋', hint: 'Câu mệnh lệnh bắt đầu bằng động từ nguyên thể.', sentence: 'Come here.', meaning: 'Lại đây.', question: 'Lại đây.', choices: ['To come here.', 'Comes here.', 'Come here.'], answer: 'Come here.', explanation: 'Mệnh lệnh trực tiếp dùng Come.' },
  { title: 'Nói khả năng', scene: '🏊', hint: 'Can + động từ nguyên thể.', sentence: 'I can swim.', meaning: 'Tôi biết bơi.', question: 'Tôi biết bơi.', choices: ['I can to swim.', 'I can swim.', 'I can swims.'], answer: 'I can swim.', explanation: 'Sau can dùng swim, không thêm to/-s.' },
];

const PLACEMENT_A0 = [0, 1, 2, 4, 9, 12, 14, 16, 20, 22] as const;
const PLACEMENT_A1 = [0, 1, 2, 3, 4, 5, 6, 8, 11, 15] as const;

function validSteps(value: unknown, max: number): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is number =>
    typeof item === 'number' && Number.isInteger(item) && item >= 0 && item < max,
  ))].sort((a, b) => a - b);
}

export default function GrammarMicroCourse({ stage }: { stage: 'a0' | 'a1' }) {
  const STEPS = stage === 'a0' ? A0_STEPS : A1_STEPS;
  const PLACEMENT_STEPS: readonly number[] = stage === 'a0' ? PLACEMENT_A0 : PLACEMENT_A1;
  const STORAGE_KEY = `lingopro_grammar_foundation_v2_${stage}`;
  const nextHref = stage === 'a0' ? '/grammar/foundation/a1' : '/grammar/learn?topic=countable-uncountable';
  const nextLabel = stage === 'a0' ? 'Tiếp: Sinh hoạt A1 →' : 'Tiếp: Ngữ pháp A2 →';
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [placement, setPlacement] = useState<{ position: number; correct: number } | null>(null);
  const [placementResult, setPlacementResult] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const storageKey = useRef(STORAGE_KEY);
  const userId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadProgress() {
      const { data: auth } = await supabase.auth.getUser();
      const id = auth.user?.id ?? null;
      const key = id ? `${STORAGE_KEY}_${id}` : STORAGE_KEY;
      let local: number[] = [];
      try { local = validSteps(JSON.parse(localStorage.getItem(key) || '[]') as unknown, STEPS.length); } catch { /* Khởi tạo lại dữ liệu lỗi. */ }
      let remote: number[] = [];
      if (id) {
        const { data, error } = await supabase.from('grammar_micro_progress')
          .select('completed_steps').eq('user_id', id).eq('stage', stage).maybeSingle();
        if (error && active) setSyncError(true);
        remote = validSteps(data?.completed_steps, STEPS.length);
      }
      if (!active) return;
      userId.current = id;
      storageKey.current = key;
      const merged = validSteps([...local, ...remote], STEPS.length);
      localStorage.setItem(key, JSON.stringify(merged));
      setCompleted(merged);
      setIndex(Array.from({ length: STEPS.length }, (_, i) => i).find((i) => !merged.includes(i)) ?? STEPS.length - 1);
      setReady(true);
      if (id && merged.length > remote.length) {
        const { error } = await supabase.from('grammar_micro_progress')
          .upsert({ user_id: id, stage, completed_steps: merged, updated_at: new Date().toISOString() }, { onConflict: 'user_id,stage' });
        if (error && active) setSyncError(true);
      }
    }
    void loadProgress();
    return () => { active = false; };
  }, [stage, STEPS.length, STORAGE_KEY]);

  function saveProgress(next: number[]) {
    const valid = validSteps(next, STEPS.length);
    setCompleted(valid);
    localStorage.setItem(storageKey.current, JSON.stringify(valid));
    if (userId.current) {
      void supabase.from('grammar_micro_progress').upsert({
        user_id: userId.current,
        stage,
        completed_steps: valid,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,stage' }).then(({ error }) => { if (error) setSyncError(true); else setSyncError(false); });
    }
  }

  const step = STEPS[index];
  const correct = selected === step.answer;
  const play = () => {
    const audio = new Audio(`/grammar/foundation/${stage}/${String(index + 1).padStart(2, '0')}.mp3`);
    void audio.play().catch(() => { void speak(step.sentence, 0.85); });
  };

  function choose(choice: string) {
    setSelected(choice);
    if (choice === step.answer && !completed.includes(index)) {
      const next = [...completed, index];
      saveProgress(next);
    }
  }

  function choosePlacement(choice: string) {
    if (!placement) return;
    const target = STEPS[PLACEMENT_STEPS[placement.position]];
    const score = placement.correct + Number(choice === target.answer);
    if (placement.position < PLACEMENT_STEPS.length - 1) {
      setPlacement({ position: placement.position + 1, correct: score });
      return;
    }
    const passed = score >= 9 ? STEPS.length : score >= 7 ? Math.floor(STEPS.length / 2) : 0;
    const next = validSteps([...completed, ...Array.from({ length: passed }, (_, i) => i)], STEPS.length);
    saveProgress(next);
    setIndex(passed < STEPS.length ? passed : STEPS.length - 1);
    setSelected(null);
    setPlacement(null);
    setPlacementResult(score >= 9 ? `Đúng ${score}/10. Bạn đã nắm ${stage.toUpperCase()}; có thể học phần tiếp theo.` : score >= 7 ? `Đúng ${score}/10. Bắt đầu ở nửa sau của chặng ${stage.toUpperCase()}.` : `Đúng ${score}/10. Bắt đầu từ câu đầu tiên để xây nền chắc.`);
  }

  return (
    <main className="min-h-dvh bg-[#faf8f2] px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-3xl space-y-5">
        <Link href="/grammar/learn" className="text-sm text-emerald-800 underline dark:text-emerald-300">← Toàn bộ ngữ pháp</Link>
        <header className="space-y-2">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{stage.toUpperCase()} · {stage === 'a0' ? 'Học từ số 0' : 'Sinh hoạt và câu hỏi'}</p>
          <h1 className="text-3xl font-bold">{stage === 'a0' ? 'Ghép câu tiếng Anh đầu tiên' : 'Nói về sinh hoạt hằng ngày'}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">{STEPS.length} bước ngắn · mỗi bước một ý mới · nghe, nhìn và trả lời. Có thể chuyển nhanh đến bước đã biết.</p>
          {!ready && <p className="text-sm text-slate-500">Đang tải tiến độ...</p>}
          {syncError && <p role="status" className="text-sm text-amber-700 dark:text-amber-300">Tiến độ đã lưu trên thiết bị; đồng bộ tài khoản tạm thời chưa khả dụng.</p>}
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" aria-label={`Đã hoàn thành ${completed.length} trên ${STEPS.length} bước`}><div className="h-full bg-emerald-600" style={{ width: `${completed.length / STEPS.length * 100}%` }} /></div>
          <button type="button" disabled={!ready} onClick={() => { setPlacement({ position: 0, correct: 0 }); setPlacementResult(null); }} className="rounded-xl border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-200 dark:hover:bg-emerald-950">Đã biết cơ bản? Kiểm tra vượt cấp (10 câu)</button>
          {placementResult && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100">{placementResult}</p>}
          {placementResult && completed.length === STEPS.length && <Link href={nextHref} className="inline-block rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">{nextLabel}</Link>}
        </header>
        {placement && <section className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-6 dark:border-emerald-800 dark:bg-slate-900" aria-label="Kiểm tra vượt cấp">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Kiểm tra nhanh · câu {placement.position + 1}/10</p>
          <h2 className="text-lg font-bold">{STEPS[PLACEMENT_STEPS[placement.position]].question}</h2>
          <div className="grid gap-2">{STEPS[PLACEMENT_STEPS[placement.position]].choices.map((choice) => <button key={choice} type="button" onClick={() => choosePlacement(choice)} className="rounded-xl border border-slate-300 px-4 py-3 text-left hover:border-emerald-500 dark:border-slate-700">{choice}</button>)}</div>
          <button type="button" onClick={() => setPlacement(null)} className="text-sm underline">Quay lại bài học</button>
        </section>}
        {!placement && ready && <>
        <nav className="flex flex-wrap gap-2" aria-label="Chọn bước học">
          {STEPS.map((item, i) => <button key={item.title} type="button" onClick={() => { setIndex(i); setSelected(null); }} aria-current={i === index ? 'step' : undefined} className={`flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-sm font-semibold ${i === index ? 'border-emerald-700 bg-emerald-700 text-white' : completed.includes(i) ? 'border-emerald-500 bg-emerald-100 text-emerald-800' : 'border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'}`}>{completed.includes(i) ? <CheckCircle2 size={16} /> : i + 1}</button>)}
        </nav>
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="bg-emerald-50 px-6 py-5 dark:bg-emerald-950/40"><p className="text-sm text-emerald-800 dark:text-emerald-200">Bước {index + 1}/{STEPS.length}</p><h2 className="text-xl font-bold">{step.title}</h2></div>
          <div className="space-y-5 p-6">
            <div className="flex h-44 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 via-sky-50 to-emerald-100 shadow-inner dark:from-amber-950 dark:via-slate-800 dark:to-emerald-950">
              <Image src={`/grammar/foundation/${stage}/${String(index + 1).padStart(2, '0')}.${stage === 'a0' && index === 0 ? 'png' : 'svg'}`} alt={`Minh họa: ${step.meaning}`} width={136} height={136} className="h-32 w-32 object-contain" priority={index === 0} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{step.hint}</p>
            <div className="flex items-center gap-3"><button type="button" onClick={play} aria-label={`Nghe ${step.sentence}`} className="rounded-full bg-emerald-700 p-3 text-white hover:bg-emerald-800"><Volume2 /></button><div><p className="text-2xl font-bold">{step.sentence}</p><p className="text-sm text-slate-600 dark:text-slate-300">{step.meaning}</p></div></div>
            <div className="border-t border-slate-200 pt-5 dark:border-slate-700"><h3 className="mb-3 font-semibold">Chọn câu đúng: {step.question}</h3><div className="grid gap-2">{step.choices.map((choice) => <button key={choice} type="button" onClick={() => choose(choice)} className={`rounded-xl border px-4 py-3 text-left font-medium ${selected === choice ? correct ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-200 hover:border-emerald-400 dark:border-slate-700 dark:hover:border-emerald-400'}`}>{choice}</button>)}</div></div>
            {selected && <p role="status" className={`rounded-xl p-3 text-sm ${correct ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>{correct ? 'Đúng! ' : 'Thử lại. '}{step.explanation}</p>}
            {correct && (index < STEPS.length - 1 ? <button type="button" onClick={() => { setIndex(index + 1); setSelected(null); }} className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white">Bước tiếp theo →</button> : <Link href={nextHref} className="inline-block rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white">{nextLabel}</Link>)}
          </div>
        </section>
        </>}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">Minh họa: <a href="https://openmoji.org/" target="_blank" rel="noopener noreferrer" className="underline">OpenMoji</a> · CC BY-SA 4.0. Âm thanh tạo bằng giọng tổng hợp tiếng Anh.</p>
      </div>
    </main>
  );
}
