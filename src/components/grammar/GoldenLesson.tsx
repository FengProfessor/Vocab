'use client';

import { useState, useMemo } from 'react';
import type { GrammarSections, GrammarExerciseItem } from '@/lib/supabase';
import { LazyMarkdown } from '@/components/perf/LazyMarkdown';
import {
  Target,
  Bookmark,
  Boxes,
  PenLine,
  Library,
  Search,
  AlertTriangle,
  Lightbulb,
  ArrowLeftRight,
  TrendingUp,
  Dumbbell,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

/**
 * Render bài học grammar CÓ CẤU TRÚC (section-cards + quiz interactive).
 * Thiết kế giao diện chuẩn SaaS tối giản kỹ thuật, loại bỏ hoàn toàn emoji và gradient sặc sỡ.
 */

const md = (children: string) => <LazyMarkdown>{children}</LazyMarkdown>;

function Card({
  tag,
  icon,
  title,
  children,
}: {
  tag: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-card border border-border rounded-xl p-5 sm:p-6 shadow-xs">
      <span className="absolute top-3.5 right-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted border border-border/70 rounded-md px-2 py-0.5">
        {tag}
      </span>
      <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3.5 flex items-center gap-2.5 pr-24">
        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span>{title}</span>
      </h2>
      {children}
    </div>
  );
}

function Exercise({ ex: rawEx, idx }: { ex: GrammarExerciseItem; idx: number }) {
  // Normalize legacy and new schema formats
  const type =
    rawEx.type === 'multiple_choice'
      ? 'mcq'
      : rawEx.type === 'fill_blank'
      ? 'fill'
      : rawEx.type === 'error_correction'
      ? 'error'
      : rawEx.type; // mcq, fill, tf, error

  const q = rawEx.question || rawEx.q || '';
  const opts = rawEx.options || rawEx.opts || [];
  const answer = rawEx.correct_answer !== undefined ? rawEx.correct_answer : rawEx.answer;
  const fb = rawEx.explanation || rawEx.fb || '';

  const [done, setDone] = useState(false);
  const [val, setVal] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const norm = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[’]/g, "'");

  const badge = { mcq: 'Trắc nghiệm', fill: 'Điền từ', tf: 'Đúng / Sai', error: 'Sửa lỗi' }[type];
  const bcol = {
    mcq: 'bg-primary/10 text-primary border border-primary/20',
    fill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
    tf: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20',
  }[type];

  const isAnswerTrue =
    answer === true ||
    String(answer).trim().toLowerCase() === 'true' ||
    String(answer).trim().toLowerCase() === 'đúng' ||
    String(answer).trim().toLowerCase() === 'yes';

  const correctText = Array.isArray(answer)
    ? answer[0]
    : type === 'tf'
    ? isAnswerTrue
      ? 'Đúng'
      : 'Sai'
    : String(answer);

  const isOptionCorrect = (opt: string) => {
    const cleanOpt = opt.trim().toLowerCase();
    if (Array.isArray(answer)) {
      return answer.some((a) => String(a).trim().toLowerCase() === cleanOpt);
    }
    return (
      cleanOpt ===
      String(answer !== undefined && answer !== null ? answer : '')
        .trim()
        .toLowerCase()
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2.5 shadow-xs">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${bcol}`}>
          {badge}
        </span>
      </div>
      <div className="font-semibold text-foreground text-sm leading-relaxed">
        {idx + 1}. {q?.trim() ? q : <span className="text-muted-foreground font-medium">(Thiếu đề bài — chọn đáp án đúng)</span>}
      </div>

      {/* MCQ / error / fill-có-options: luôn hiện nút chọn */}
      {(type === 'mcq' || type === 'error' || (type === 'fill' && (opts?.length ?? 0) >= 2)) && (
        <div className="flex flex-col gap-1.5 pt-1">
          {(opts ?? []).map((o: string) => {
            const isCorrect = isOptionCorrect(o);
            const show = done && (picked === o || isCorrect);
            let btnClass = 'bg-muted/40 hover:bg-muted text-foreground border-border hover:border-primary/40';
            if (show) {
              if (isCorrect) {
                btnClass = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/20';
              } else {
                btnClass = 'bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-300 font-semibold ring-1 ring-rose-500/20';
              }
            }
            return (
              <button
                key={o}
                disabled={done}
                onClick={() => {
                  setPicked(o);
                  setDone(true);
                }}
                className={`text-left rounded-lg border px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors flex items-center justify-between gap-2 ${btnClass}`}
              >
                <span>{o}</span>
                {show && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                {show && !isCorrect && picked === o && <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {type === 'tf' && (
        <div className="flex gap-2 pt-1">
          {[{ l: 'Đúng', v: true }, { l: 'Sai', v: false }].map((opt) => {
            const isCorrect = opt.v === isAnswerTrue;
            const show = done && (picked === opt.l || isCorrect);
            let btnClass = 'bg-muted/40 hover:bg-muted text-foreground border-border hover:border-primary/40';
            if (show) {
              if (isCorrect) {
                btnClass = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/20';
              } else {
                btnClass = 'bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-300 font-semibold ring-1 ring-rose-500/20';
              }
            }
            return (
              <button
                key={opt.l}
                disabled={done}
                onClick={() => {
                  setPicked(opt.l);
                  setDone(true);
                }}
                className={`flex-1 rounded-lg border px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${btnClass}`}
              >
                <span>{opt.l}</span>
                {show && isCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                {show && !isCorrect && picked === opt.l && <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />}
              </button>
            );
          })}
        </div>
      )}

      {/* fill không có options → nhập tay */}
      {type === 'fill' && (opts?.length ?? 0) < 2 && (
        <div className="flex gap-2 pt-1">
          <input
            value={val}
            disabled={done}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && val.trim()) setDone(true);
            }}
            placeholder="Nhập đáp án..."
            className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2 text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-70"
          />
          <button
            disabled={done || !val.trim()}
            onClick={() => setDone(true)}
            className="rounded-lg bg-primary text-primary-foreground px-4 text-xs sm:text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors shadow-xs"
          >
            Kiểm tra
          </button>
        </div>
      )}

      {done && (
        <div
          className={`mt-2 p-3 rounded-lg border text-xs sm:text-sm font-medium leading-relaxed animate-in fade-in ${
            (type === 'fill' && (opts?.length ?? 0) < 2
              ? (Array.isArray(answer) && answer.some((a) => norm(String(a)) === norm(val))) ||
                norm(String(answer ?? '')) === norm(val)
              : type === 'tf'
              ? picked === (isAnswerTrue ? 'Đúng' : 'Sai')
              : picked && isOptionCorrect(picked))
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-1.5 font-semibold mb-1">
            {(type === 'fill' && (opts?.length ?? 0) < 2
              ? (Array.isArray(answer) && answer.some((a) => norm(String(a)) === norm(val))) ||
                norm(String(answer ?? '')) === norm(val)
              : type === 'tf'
              ? picked === (isAnswerTrue ? 'Đúng' : 'Sai')
              : picked && isOptionCorrect(picked)) ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Chính xác!</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span>Đáp án đúng: <span className="font-mono underline">{correctText}</span></span>
              </>
            )}
          </div>
          {fb && <div className="text-muted-foreground pt-1 border-t border-border/50">{fb}</div>}
        </div>
      )}
    </div>
  );
}

export default function GoldenLesson({
  sections,
  exercises,
}: {
  sections: GrammarSections;
  exercises?: GrammarExerciseItem[] | null;
}) {
  const s = sections;

  const [showAllEx, setShowAllEx] = useState(false);
  const allExercises = useMemo(() => {
    if (!exercises?.length) return [];
    return exercises.filter((ex) => {
      const q = String(ex.q || ex.question || '').trim();
      const ans = ex.answer !== undefined ? ex.answer : ex.correct_answer;
      return q.length > 0 && ans !== undefined && ans !== null && String(ans).length > 0;
    });
  }, [exercises]);

  const PREVIEW_CAP = 24;
  const previewExercises = showAllEx ? allExercises : allExercises.slice(0, PREVIEW_CAP);

  return (
    <div className="space-y-4">
      {s.definition && (
        <Card tag="Định nghĩa" icon={<Target className="h-4 w-4" />} title="Là gì?">
          <div className="text-sm sm:text-base leading-relaxed text-foreground">{md(s.definition)}</div>
        </Card>
      )}

      {!!s.usage?.length && (
        <Card tag="Khi nào dùng" icon={<Bookmark className="h-4 w-4" />} title="Các trường hợp dùng">
          <div className="grid sm:grid-cols-2 gap-2.5">
            {s.usage.map((u, i) => (
              <div key={i} className="bg-muted/40 border border-border rounded-xl p-3.5 space-y-1">
                <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{u.label}</span>
                </div>
                {u.en && <div className="text-xs sm:text-sm text-muted-foreground italic pl-3.5">{u.en}</div>}
                {u.vi && <div className="text-xs text-muted-foreground/80 pl-3.5">{u.vi}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {!!s.formula?.rows?.length && (
        <Card tag="Công thức" icon={<Boxes className="h-4 w-4" />} title="Cấu trúc">
          <div className="overflow-x-auto rounded-xl border border-border shadow-2xs">
            <table className="w-full text-left text-xs sm:text-sm text-foreground border-collapse">
              <thead className="bg-muted/60 text-xs uppercase font-semibold text-foreground border-b border-border">
                <tr>
                  {Object.keys(s.formula.rows[0]).map((k) => (
                    <th key={k} className="px-3.5 py-2.5 font-semibold text-foreground">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.formula.rows.map((r, i) => (
                  <tr key={i} className="border-t border-border/70 even:bg-muted/20">
                    {Object.keys(s.formula!.rows![0]).map((k) => (
                      <td key={k} className="px-3.5 py-2.5 font-medium text-foreground">
                        {r[k]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {s.formula.note && (
            <div className="mt-3 text-xs sm:text-sm bg-amber-500/10 border-l-3 border-amber-500 rounded-r-lg px-3.5 py-2.5 text-foreground leading-relaxed">
              {md(s.formula.note)}
            </div>
          )}
        </Card>
      )}

      {!!s.rules?.length && (
        <Card tag="Quy tắc" icon={<PenLine className="h-4 w-4" />} title="Quy tắc biến đổi">
          <div className="overflow-x-auto rounded-xl border border-border shadow-2xs">
            <table className="w-full text-left text-xs sm:text-sm text-foreground border-collapse">
              <thead className="bg-muted/60 text-xs uppercase font-semibold text-foreground border-b border-border">
                <tr>
                  <th className="px-3.5 py-2.5 font-semibold">Trường hợp</th>
                  <th className="px-3.5 py-2.5 font-semibold">Quy tắc</th>
                  <th className="px-3.5 py-2.5 font-semibold">Ví dụ</th>
                </tr>
              </thead>
              <tbody>
                {s.rules.map((r, i) => (
                  <tr key={i} className="border-t border-border/70 even:bg-muted/20">
                    <td className="px-3.5 py-2.5 font-medium text-foreground">{r.case}</td>
                    <td className="px-3.5 py-2.5 font-semibold text-primary">{r.rule}</td>
                    <td className="px-3.5 py-2.5 text-muted-foreground">{r.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Bảng từ / case đặc biệt */}
      {!!s.wordbanks?.length &&
        s.wordbanks.map((wb, wi) => {
          const rows = wb.rows?.filter(Boolean) ?? [];
          if (!rows.length) return null;
          const keys = Object.keys(rows[0]);
          return (
            <Card
              key={`wb-${wi}`}
              tag="Bảng từ"
              icon={<Library className="h-4 w-4" />}
              title={wb.title || 'Danh sách đặc biệt'}
            >
              <div className="overflow-x-auto rounded-xl border border-border max-h-[28rem] overflow-y-auto shadow-2xs">
                <table className="w-full text-left text-xs sm:text-sm text-foreground border-collapse">
                  <thead className="bg-muted/80 backdrop-blur text-xs uppercase font-semibold text-foreground sticky top-0 border-b border-border z-10">
                    <tr>
                      {keys.map((k) => (
                        <th key={k} className="px-3.5 py-2.5 font-semibold">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-border/70 even:bg-muted/20">
                        {keys.map((k) => (
                          <td
                            key={k}
                            className={`px-3.5 py-2.5 ${
                              k === keys[0] ? 'font-semibold text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {r[k]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {wb.note && (
                <div className="mt-3 text-xs sm:text-sm bg-amber-500/10 border-l-3 border-amber-500 rounded-r-lg px-3.5 py-2.5 text-foreground leading-relaxed">
                  {md(wb.note)}
                </div>
              )}
              <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                {rows.length} mục dữ liệu · Được nhóm theo nguyên lý học thông minh
              </p>
            </Card>
          );
        })}

      {!!s.signals?.length && (
        <Card tag="Dấu hiệu" icon={<Search className="h-4 w-4" />} title="Dấu hiệu nhận biết">
          <div className="flex flex-wrap gap-2">
            {s.signals.map((x, i) => (
              <span
                key={i}
                className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 font-medium text-xs sm:text-sm px-3 py-1 rounded-lg"
              >
                {x}
              </span>
            ))}
          </div>
        </Card>
      )}

      {!!s.mistakes?.length && (
        <Card tag="Lỗi thường gặp" icon={<AlertTriangle className="h-4 w-4" />} title="Tránh các lỗi này">
          <div className="space-y-2.5">
            {s.mistakes.map((m, i) => (
              <div key={i} className="p-3 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-rose-600 dark:text-rose-400 line-through font-medium">{m.wrong}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{m.right}</span>
                </div>
                {m.why && <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">{m.why}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {s.tips && (
        <Card tag="Mẹo nhớ" icon={<Lightbulb className="h-4 w-4" />} title="Mẹo ghi nhớ">
          <div className="text-xs sm:text-sm text-foreground leading-relaxed">{md(s.tips)}</div>
        </Card>
      )}

      {s.comparison && (
        <Card tag="So sánh" icon={<ArrowLeftRight className="h-4 w-4" />} title="So sánh & phân biệt">
          <div className="text-xs sm:text-sm text-foreground leading-relaxed">{md(s.comparison)}</div>
        </Card>
      )}

      {!!s.timeline?.points?.length && (
        <Card tag="Trực quan" icon={<TrendingUp className="h-4 w-4" />} title="Dòng thời gian">
          {s.timeline.caption && <p className="text-xs text-muted-foreground mb-3">{s.timeline.caption}</p>}
          <div className="flex items-center justify-between gap-1 relative pt-3 pb-1">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
            {s.timeline.points.map((p, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center flex-1 text-center">
                <div className="w-3.5 h-3.5 rounded-full bg-primary border-2 border-background shadow-xs mb-1.5" />
                <div className="text-[11px] font-semibold text-foreground leading-tight">{p.label}</div>
                {p.note && <div className="text-[10px] text-muted-foreground">{p.note}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {!!previewExercises.length && (
        <Card
          tag="Luyện tập"
          icon={<Dumbbell className="h-4 w-4" />}
          title={`Bài tập trong bài (${allExercises.length} câu)`}
        >
          <div className="space-y-3">
            {previewExercises.map((ex, i) => (
              <Exercise key={i} ex={ex} idx={i} />
            ))}
          </div>
          {allExercises.length > PREVIEW_CAP && (
            <button
              type="button"
              onClick={() => setShowAllEx((v) => !v)}
              className="mt-3 w-full text-xs sm:text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl py-2.5 transition-colors shadow-2xs cursor-pointer"
            >
              {showAllEx ? 'Thu gọn' : `Xem thêm ${allExercises.length - PREVIEW_CAP} câu`}
            </button>
          )}
          <p className="text-xs text-muted-foreground text-center mt-3 bg-muted/40 p-2.5 rounded-xl border border-dashed border-border">
            Luyện tập để nắm mẫu kiến thức. Nhấn <b>“Bắt đầu làm bài tập”</b> để chấm điểm tương tác và <b>ghi nhận tiến độ</b>.
          </p>
        </Card>
      )}
    </div>
  );
}
