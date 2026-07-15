'use client';

import { useState, useMemo } from 'react';
import type { GrammarSections, GrammarExerciseItem } from '@/lib/supabase';
import { LazyMarkdown } from '@/components/perf/LazyMarkdown';

/**
 * Render bài học grammar CÓ CẤU TRÚC (section-cards + quiz interactive) — giống bài mẫu vàng.
 * Phần Ví dụ (annotation) vẫn do trang learn render riêng để tái dùng GrammarHighlight.
 */

const md = (children: string) => <LazyMarkdown>{children}</LazyMarkdown>;

function Card({ tag, icon, title, children }: { tag: string; icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="relative bg-background border rounded-2xl p-5 sm:p-6 shadow-sm">
      <span className="absolute top-3 right-4 text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 border rounded px-2 py-0.5">{tag}</span>
      <h2 className="text-lg font-extrabold text-slate-800 mb-3 flex items-center gap-2 pr-20"><span className="text-xl">{icon}</span>{title}</h2>
      {children}
    </div>
  );
}

function Exercise({ ex: rawEx, idx }: { ex: GrammarExerciseItem; idx: number }) {
  // Normalize legacy and new schema formats
  const type = rawEx.type === 'multiple_choice' ? 'mcq' :
               rawEx.type === 'fill_blank' ? 'fill' :
               rawEx.type === 'error_correction' ? 'error' :
               rawEx.type; // mcq, fill, tf, error
               
  const q = rawEx.question || rawEx.q || '';
  const opts = rawEx.options || rawEx.opts || [];
  const answer = rawEx.correct_answer !== undefined ? rawEx.correct_answer : rawEx.answer;
  const fb = rawEx.explanation || rawEx.fb || '';

  const [done, setDone] = useState(false);
  const [val, setVal] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[’]/g, "'");
  const badge = { mcq: 'Trắc nghiệm', fill: 'Điền từ', tf: 'Đúng / Sai', error: 'Sửa lỗi' }[type];
  const bcol = { mcq: 'bg-indigo-50 text-indigo-700', fill: 'bg-emerald-50 text-emerald-700', tf: 'bg-amber-50 text-amber-700', error: 'bg-rose-50 text-rose-700' }[type];

  const isAnswerTrue = answer === true || String(answer).trim().toLowerCase() === 'true' || String(answer).trim().toLowerCase() === 'đúng' || String(answer).trim().toLowerCase() === 'yes';
  const correctText = Array.isArray(answer) ? answer[0] : type === 'tf' ? (isAnswerTrue ? 'Đúng' : 'Sai') : String(answer);

  const isOptionCorrect = (opt: string) => {
    const cleanOpt = opt.trim().toLowerCase();
    if (Array.isArray(answer)) {
      return answer.some((a) => String(a).trim().toLowerCase() === cleanOpt);
    }
    return cleanOpt === String(answer !== undefined && answer !== null ? answer : '').trim().toLowerCase();
  };

  return (
    <div className="bg-background border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${bcol}`}>{badge}</span>
      </div>
      <div className="font-semibold text-slate-800 mb-2.5">{idx + 1}. {q}</div>

      {(type === 'mcq' || type === 'error') && (
        <div className="flex flex-col gap-2">
          {(opts ?? []).map((o: string) => {
            const isCorrect = isOptionCorrect(o);
            const show = done && (picked === o || isCorrect);
            return (
              <button key={o} disabled={done}
                onClick={() => { setPicked(o); setDone(true); }}
                className={`text-left rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  show ? (isCorrect ? 'bg-emerald-50 border-emerald-400 text-emerald-800' : 'bg-rose-50 border-rose-400 text-rose-800')
                       : 'bg-slate-50 hover:border-indigo-400'}`}>
                {o}
              </button>
            );
          })}
        </div>
      )}

      {type === 'tf' && (
        <div className="flex gap-2">
          {[{ l: 'Đúng', v: true }, { l: 'Sai', v: false }].map((opt) => {
            const isCorrect = opt.v === isAnswerTrue;
            const show = done && (picked === opt.l || isCorrect);
            return (
              <button key={opt.l} disabled={done}
                onClick={() => { setPicked(opt.l); setDone(true); }}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                  show ? (isCorrect ? 'bg-emerald-50 border-emerald-400 text-emerald-800' : 'bg-rose-50 border-rose-400 text-rose-800')
                       : 'bg-slate-50 hover:border-indigo-400'}`}>
                {opt.l}
              </button>
            );
          })}
        </div>
      )}

      {type === 'fill' && (
        <div className="flex gap-2">
          <input value={val} disabled={done} onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && val.trim()) setDone(true); }}
            placeholder="Nhập đáp án..."
            className="flex-1 rounded-lg border px-3 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-500 disabled:opacity-80" />
          <button disabled={done || !val.trim()} onClick={() => setDone(true)}
            className="rounded-lg bg-indigo-600 text-white px-4 text-sm font-bold disabled:opacity-40">Kiểm tra</button>
        </div>
      )}

      {done && (
        <div className={`mt-2.5 text-sm font-semibold ${
          (type === 'fill'
            ? (Array.isArray(answer) && answer.some((a) => norm(a) === norm(val)))
            : type === 'tf'
              ? (picked === (isAnswerTrue ? 'Đúng' : 'Sai'))
              : (picked && isOptionCorrect(picked)))
            ? 'text-emerald-700' : 'text-rose-700'}`}>
          {(type === 'fill'
            ? (Array.isArray(answer) && answer.some((a) => norm(a) === norm(val)))
            : type === 'tf' ? (picked === (isAnswerTrue ? 'Đúng' : 'Sai')) : (picked && isOptionCorrect(picked)))
            ? '✓ Chính xác! ' : `✗ Đáp án: ${correctText}. `}
          <span className="font-normal text-slate-600">{fb}</span>
        </div>
      )}
    </div>
  );
}

export default function GoldenLesson({ sections, exercises }: { sections: GrammarSections; exercises?: GrammarExerciseItem[] | null }) {
  const s = sections;

  // Show only 1 exercise per unique type as preview
  const previewExercises = useMemo(() => {
    if (!exercises) return [];
    const seenTypes = new Set<string>();
    const result: GrammarExerciseItem[] = [];
    for (const ex of exercises) {
      const type = ex.type === 'multiple_choice' ? 'mcq' :
                   ex.type === 'fill_blank' ? 'fill' :
                   ex.type === 'error_correction' ? 'error' :
                   ex.type;
      if (!seenTypes.has(type)) {
        seenTypes.add(type);
        result.push(ex);
      }
    }
    return result;
  }, [exercises]);

  return (
    <div className="space-y-4">
      {s.definition && (
        <Card tag="Định nghĩa" icon="🎯" title="Là gì?">
          <div className="text-[15px] text-slate-700">{md(s.definition)}</div>
        </Card>
      )}

      {!!s.usage?.length && (
        <Card tag="Khi nào dùng" icon="📌" title="Các trường hợp dùng">
          <div className="grid sm:grid-cols-2 gap-2.5">
            {s.usage.map((u, i) => (
              <div key={i} className="bg-slate-50 border rounded-xl p-3">
                <div className="font-bold text-sm text-slate-800 flex items-center gap-1.5 mb-1">{u.icon} {u.label}</div>
                {u.en && <div className="text-sm text-slate-600 italic">{u.en}</div>}
                {u.vi && <div className="text-xs text-slate-400">{u.vi}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {!!s.formula?.rows?.length && (
        <Card tag="Công thức" icon="🧩" title="Cấu trúc">
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>{Object.keys(s.formula.rows[0]).map((k) => <th key={k} className="px-3 py-2 text-left font-black">{k}</th>)}</tr>
              </thead>
              <tbody>
                {s.formula.rows.map((r, i) => (
                  <tr key={i} className="border-t">{Object.keys(s.formula!.rows![0]).map((k) => <td key={k} className="px-3 py-2 font-medium text-slate-700">{r[k]}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          {s.formula.note && <div className="mt-2 text-sm bg-amber-50 border-l-4 border-amber-400 rounded-r-lg px-3 py-2 text-amber-900">{md(s.formula.note)}</div>}
        </Card>
      )}

      {!!s.rules?.length && (
        <Card tag="Quy tắc" icon="✍️" title="Quy tắc biến đổi">
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>
                <th className="px-3 py-2 text-left font-black">Trường hợp</th><th className="px-3 py-2 text-left font-black">Quy tắc</th><th className="px-3 py-2 text-left font-black">Ví dụ</th>
              </tr></thead>
              <tbody>
                {s.rules.map((r, i) => (
                  <tr key={i} className="border-t"><td className="px-3 py-2 font-medium">{r.case}</td><td className="px-3 py-2 font-bold text-indigo-700">{r.rule}</td><td className="px-3 py-2 text-slate-600">{r.example}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!!s.signals?.length && (
        <Card tag="Dấu hiệu" icon="🔍" title="Dấu hiệu nhận biết">
          <div className="flex flex-wrap gap-2">
            {s.signals.map((x, i) => <span key={i} className="bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-sm px-3 py-1 rounded-full">{x}</span>)}
          </div>
        </Card>
      )}

      {!!s.mistakes?.length && (
        <Card tag="Lỗi thường gặp" icon="⚠️" title="Tránh các lỗi này">
          <div className="space-y-2.5">
            {s.mistakes.map((m, i) => (
              <div key={i} className="text-sm">
                <span className="text-rose-600 line-through">{m.wrong}</span>
                <span className="mx-1.5 text-slate-400">→</span>
                <span className="text-emerald-700 font-bold">{m.right}</span>
                {m.why && <div className="text-xs text-slate-500 mt-0.5">{m.why}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {s.tips && (
        <Card tag="Mẹo nhớ" icon="🧠" title="Mẹo nhớ">
          <div className="text-sm text-slate-700">{md(s.tips)}</div>
        </Card>
      )}

      {s.comparison && (
        <Card tag="So sánh" icon="🔄" title="So sánh & phân biệt">
          <div className="text-sm text-slate-700">{md(s.comparison)}</div>
        </Card>
      )}

      {!!s.timeline?.points?.length && (
        <Card tag="Trực quan" icon="📈" title="Dòng thời gian">
          {s.timeline.caption && <p className="text-sm text-slate-500 mb-3">{s.timeline.caption}</p>}
          <div className="flex items-center justify-between gap-1 relative pt-2">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200" />
            {s.timeline.points.map((p, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center flex-1 text-center">
                <div className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow mb-1.5" />
                <div className="text-[11px] font-bold text-slate-700 leading-tight">{p.label}</div>
                {p.note && <div className="text-[9px] text-slate-400">{p.note}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {!!previewExercises.length && (
        <Card tag="Xem trước" icon="🏆" title={`Ví dụ bài tập (${previewExercises.length} dạng câu)`}>
          <div className="space-y-3">
            {previewExercises.map((ex, i) => <Exercise key={i} ex={ex} idx={i} />)}
          </div>
          {exercises && exercises.length > previewExercises.length && (
            <p className="text-xs text-muted-foreground text-center mt-4 bg-muted/40 p-2.5 rounded-xl border border-dashed">
              💡 Để làm đầy đủ <b>{exercises.length} câu</b> bài tập và ghi nhận tiến độ học tập, bạn hãy nhấn nút <b>“Làm bài tập”</b> ở bên dưới.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
