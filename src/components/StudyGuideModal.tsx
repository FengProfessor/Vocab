'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** localStorage keys điều khiển auto-hiện lần đầu (mỗi vai trò 1 key riêng). */
export const STUDY_GUIDE_KEY = 'lingopro_study_guide_seen';
export const TEACHER_METHOD_KEY = 'lingopro_teacher_method_seen';

type Variant = 'student' | 'teacher';

/**
 * Modal giải thích cơ chế ôn tập (Spaced Repetition / FSRS) + cách BẤM ĐÚNG NÚT.
 * Lý do tồn tại: thứ phá lịch FSRS nặng nhất là bấm sai nút
 * (bấm "Khó" khi đã quên, hoặc bấm "Dễ" để skip cho nhanh).
 *
 * - variant="student": hiện ở /flashcard (ôn) & LearnMode (học mới), auto lần đầu + nút "?".
 * - variant="teacher": hiện ở dashboard giáo viên — thêm phần "dặn học sinh" để GV phổ biến cho lớp.
 */
export function StudyGuideModal({
  open,
  onClose,
  variant = 'student',
}: {
  open: boolean;
  onClose: () => void;
  variant?: Variant;
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // a11y: ESC để đóng + khoá scroll nền + đưa focus vào nút đóng khi mở.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    closeBtnRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  const isTeacher = variant === 'teacher';

  const buttons = [
    { emoji: '😵', en: 'Again', vi: 'Quên', cls: 'bg-red-50 border-red-200 text-red-700',
      desc: 'Không nhớ ra từ (kể cả khi chỉ nhận ra sau lúc xem đáp án). Từ thường quay lại sau khoảng 10 phút để ôn lại sớm ngay trong phiên.' },
    { emoji: '😅', en: 'Hard', vi: 'Khó', cls: 'bg-orange-50 border-orange-200 text-orange-700',
      desc: 'Tự nhớ ĐÚNG nhưng phải nghĩ lâu, chật vật.' },
    { emoji: '😊', en: 'Good', vi: 'Nhớ được', cls: 'bg-green-50 border-green-200 text-green-700',
      desc: 'Nhớ bình thường. Nút dùng NHIỀU NHẤT.' },
    { emoji: '🚀', en: 'Easy', vi: 'Dễ', cls: 'bg-purple-50 border-purple-200 text-purple-700',
      desc: 'Nhớ đúng gần như ngay lập tức, không cần cố. Lần ôn tiếp theo sẽ cách xa hơn.' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-guide-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white rounded-[32px] shadow-2xl border-b-8 border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-7 space-y-5">
          <div className="text-center space-y-1">
            <div className="text-4xl">🧠</div>
            <h2 id="study-guide-title" className="text-2xl font-black text-slate-900 tracking-tight">
              {isTeacher ? 'Phương pháp học của LingoPro' : 'Học hiệu quả: bấm đúng nút'}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {isTeacher ? (
                <>
                  LingoPro dùng <b>Spaced Repetition (lặp lại ngắt quãng)</b>: mỗi từ được tự lên lịch ôn theo
                  mức nhớ. Sau mỗi thẻ, học sinh <b>tự đánh giá mức độ nhớ</b> bằng 1 trong 4 nút — app dựa vào đó tính lịch.
                </>
              ) : (
                <>
                  Sau khi lật thẻ, hãy <b>tự đánh giá mức độ nhớ</b> bằng 1 trong 4 nút. App dựa vào đó tính lịch ôn cho bạn.
                </>
              )}
            </p>
          </div>

          <div className="space-y-2.5">
            {buttons.map((b) => (
              <div key={b.en} className={`flex items-start gap-3 rounded-2xl border p-3 ${b.cls}`}>
                <span className="text-2xl leading-none mt-0.5">{b.emoji}</span>
                <div className="min-w-0">
                  <div className="font-black text-sm">
                    {b.en} <span className="font-bold opacity-70">· {b.vi}</span>
                  </div>
                  <p className="text-xs font-medium opacity-90 leading-snug mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quy tắc vàng — chung cho cả 2 vai trò */}
          <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-4">
            <p className="text-sm font-black text-amber-800 flex items-center gap-2">⚠️ Quy tắc vàng</p>
            <p className="text-xs font-medium text-amber-700 leading-snug mt-1">
              Quên — kể cả chỉ nhớ ra sau khi xem đáp án — thì bấm <b>“Quên” (đỏ)</b>, không bấm <b>“Khó”</b>.
              “Khó” chỉ dùng khi bạn tự nhớ đúng nhưng mất nhiều thời gian. Bấm Khó lúc đã quên khiến app
              tưởng bạn nhớ tốt hơn thực tế và xếp lịch ôn chưa đúng.
            </p>
          </div>

          {isTeacher ? (
            <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-4 space-y-1.5">
              <p className="text-sm font-black text-indigo-800">📣 Dặn học sinh</p>
              <ul className="text-xs font-medium text-indigo-700 leading-snug space-y-1 list-disc pl-4">
                <li>Chọn đúng mức độ nhớ thực tế — không bấm “Dễ” cho qua nhanh, không bấm “Khó” khi đã quên hẳn.</li>
                <li>Học <b>ít nhưng đều mỗi ngày</b> hiệu quả hơn dồn 1 buổi dài.</li>
                <li>App nhắc <b>3 lần/ngày (8h, 12h, 20h)</b>; thấy “có từ chờ ôn” thì vào học vài phút.</li>
                <li>Nhớ tốt → lần ôn sau cách xa hơn; quên → tự ôn dày lại. HS không phải tự quản lý lịch.</li>
              </ul>
            </div>
          ) : (
            <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-3.5">
              <p className="text-xs font-medium text-indigo-700 leading-snug">
                💡 <b>Mẹo:</b> Học <b>ít nhưng đều mỗi ngày</b> hiệu quả hơn dồn 1 buổi dài. Thấy thông báo
                “có từ chờ ôn” → vào học ngay vài phút.
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-lg shadow-indigo-200 border-b-4 border-indigo-800 active:translate-y-1 active:border-b-0 transition-all"
          >
            {isTeacher ? 'Đã hiểu 👍' : 'Đã hiểu, bắt đầu học! 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}
