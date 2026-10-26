/**
 * VNU Test Bậc 3 Question Palette Matrix (4-Skill Support & Visual States)
 * File: src/components/vnu-bac-3/VnuQuestionPalette.tsx
 */


import React, { useState } from 'react';
import { Flag, Filter } from 'lucide-react';
import { VnuBac3Exam, VnuBac3SkillType } from '@/types/vnu-bac-3';

export interface VnuPaletteItem {
  id: string;
  number: number;
  label?: string;
  partNumber: number;
  skill: VnuBac3SkillType;
  isAnswered: boolean;
  isFlagged: boolean;
  isCurrent: boolean;
}

interface VnuQuestionPaletteProps {
  exam: VnuBac3Exam;
  userAnswers: Record<string, string>;
  flaggedQuestions: Record<string, boolean>;
  currentQuestionId: string;
  onSelectQuestion: (questionId: string) => void;
  activeSkillFilter?: VnuBac3SkillType | 'all';
  onFilterSkillChange?: (skill: VnuBac3SkillType | 'all') => void;
  writingDrafts?: Record<string, string>;
  speakingNotes?: Record<string, string>;
}

type PaletteFilter = 'all' | 'unanswered' | 'answered' | 'flagged';

export function VnuQuestionPalette({
  exam,
  userAnswers,
  flaggedQuestions,
  currentQuestionId,
  onSelectQuestion,
  activeSkillFilter = 'all',
  onFilterSkillChange,
  writingDrafts,
  speakingNotes,
}: VnuQuestionPaletteProps) {
  const [statusFilter, setStatusFilter] = useState<PaletteFilter>('all');

  // Xây dựng danh sách phẳng câu hỏi & bài thi tự luận (4 kỹ năng)
  const allItems: VnuPaletteItem[] = [];

  for (const section of exam.sections) {
    if (activeSkillFilter !== 'all' && section.type !== activeSkillFilter) {
      continue;
    }

    if (section.type === 'reading' || section.type === 'listening') {
      for (const task of section.tasks) {
        for (const q of task.questions) {
          allItems.push({
            id: q.id,
            number: q.questionNumber,
            label: String(q.questionNumber),
            partNumber: q.partNumber,
            skill: section.type,
            isAnswered: Boolean(userAnswers[q.id]),
            isFlagged: Boolean(flaggedQuestions[q.id]),
            isCurrent: q.id === currentQuestionId,
          });
        }
      }
    } else if (section.type === 'writing') {
      for (const task of section.tasks) {
        let hasDraft = Boolean(writingDrafts?.[task.id]?.trim() || userAnswers[task.id]?.trim());
        if (!hasDraft && typeof window !== 'undefined') {
          try {
            const savedDraft = localStorage.getItem(`vnu_b3_writing_${exam.id}_${task.id}`);
            if (savedDraft && savedDraft.trim().length > 0) {
              hasDraft = true;
            }
          } catch {
            // ignore
          }
        }

        const isCurrent =
          task.id === currentQuestionId ||
          Boolean(task.writingPrompts?.some((wp) => wp.id === currentQuestionId));

        allItems.push({
          id: task.id,
          number: task.partNumber,
          label: `Task ${task.partNumber}`,
          partNumber: task.partNumber,
          skill: 'writing',
          isAnswered: hasDraft,
          isFlagged: Boolean(flaggedQuestions[task.id]),
          isCurrent,
        });
      }
    } else if (section.type === 'speaking') {
      for (const task of section.tasks) {
        let hasNotes = Boolean(speakingNotes?.[task.id]?.trim() || userAnswers[task.id]?.trim());
        if (!hasNotes && typeof window !== 'undefined') {
          try {
            const savedNotes = localStorage.getItem(`vnu_b3_speaking_${exam.id}_${task.id}`);
            if (savedNotes && savedNotes.trim().length > 0) {
              hasNotes = true;
            }
          } catch {
            // ignore
          }
        }

        const isCurrent =
          task.id === currentQuestionId ||
          Boolean(task.speakingPrompts?.some((sp) => sp.id === currentQuestionId));

        allItems.push({
          id: task.id,
          number: task.partNumber,
          label: `Part ${task.partNumber}`,
          partNumber: task.partNumber,
          skill: 'speaking',
          isAnswered: hasNotes,
          isFlagged: Boolean(flaggedQuestions[task.id]),
          isCurrent,
        });
      }
    }
  }

  // Thống kê số lượng
  const totalCount = allItems.length;
  const answeredCount = allItems.filter((i) => i.isAnswered).length;
  const flaggedCount = allItems.filter((i) => i.isFlagged).length;
  const unansweredCount = totalCount - answeredCount;

  // Lọc theo trạng thái
  const filteredItems = allItems.filter((item) => {
    if (statusFilter === 'answered') return item.isAnswered;
    if (statusFilter === 'unanswered') return !item.isAnswered;
    if (statusFilter === 'flagged') return item.isFlagged;
    return true;
  });

  // Nhóm theo Skill & Part
  const groupedBySkillPart: Record<string, VnuPaletteItem[]> = {};
  for (const item of filteredItems) {
    let key = '';
    if (item.skill === 'reading') {
      key = `Đọc — Part ${item.partNumber}`;
    } else if (item.skill === 'listening') {
      key = `Nghe — Part ${item.partNumber}`;
    } else if (item.skill === 'writing') {
      key = `Viết — 2 Tasks`;
    } else if (item.skill === 'speaking') {
      key = `Nói — 2 Parts`;
    }

    if (!groupedBySkillPart[key]) {
      groupedBySkillPart[key] = [];
    }
    groupedBySkillPart[key].push(item);
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-3.5 space-y-3.5 shadow-xs">
      {/* Header & Tabs Kỹ năng (4 kỹ năng + Tất cả) */}
      <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wide">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Mục lục câu hỏi</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {answeredCount}/{totalCount} đã làm
          </span>
        </div>

        {onFilterSkillChange && (
          <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => onFilterSkillChange('all')}
              className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
                activeSkillFilter === 'all'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => onFilterSkillChange('reading')}
              className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
                activeSkillFilter === 'reading'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300'
              }`}
            >
              Reading
            </button>
            <button
              type="button"
              onClick={() => onFilterSkillChange('listening')}
              className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
                activeSkillFilter === 'listening'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300'
              }`}
            >
              Listening
            </button>
            <button
              type="button"
              onClick={() => onFilterSkillChange('writing')}
              className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
                activeSkillFilter === 'writing'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300'
              }`}
            >
              Writing
            </button>
            <button
              type="button"
              onClick={() => onFilterSkillChange('speaking')}
              className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
                activeSkillFilter === 'speaking'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300'
              }`}
            >
              Speaking
            </button>
          </div>
        )}
      </div>

      {/* Bộ lọc trạng thái (4 nút phân loại) */}
      <div className="grid grid-cols-4 gap-1.5 text-[11px] font-mono">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`py-1 px-1.5 rounded-sm border text-center transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-800 text-white border-slate-800 font-bold'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          Tất cả ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('answered')}
          className={`py-1 px-1.5 rounded-sm border text-center transition-all cursor-pointer ${
            statusFilter === 'answered'
              ? 'bg-slate-900 text-white border-slate-900 font-bold'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          Đã làm ({answeredCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('unanswered')}
          className={`py-1 px-1.5 rounded-sm border text-center transition-all cursor-pointer ${
            statusFilter === 'unanswered'
              ? 'bg-slate-700 text-white border-slate-700 font-bold'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          Chưa làm ({unansweredCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('flagged')}
          className={`py-1 px-1.5 rounded-sm border text-center transition-all cursor-pointer ${
            statusFilter === 'flagged'
              ? 'bg-amber-600 text-white border-amber-600 font-bold'
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
          }`}
        >
          Gắn cờ ({flaggedCount})
        </button>
      </div>

      {/* Danh sách câu hỏi phân theo Part / Skill */}
      <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
        {Object.entries(groupedBySkillPart).map(([groupTitle, items]) => {
          const isWritingGroup = items.length > 0 && items[0].skill === 'writing';
          const isSpeakingGroup = items.length > 0 && items[0].skill === 'speaking';

          return (
            <div key={groupTitle} className="space-y-1.5">
              <div className="text-[11px] font-mono font-bold text-slate-500 flex items-center justify-between">
                <span>{groupTitle}</span>
                <span className="text-[10px] text-slate-400">
                  {items.filter((i) => i.isAnswered).length}/{items.length}
                </span>
              </div>

              {isWritingGroup ? (
                /* Giao diện danh sách Writing Tasks */
                <div className="space-y-1.5">
                  {items.map((item) => {
                    let stateClass = '';
                    if (item.isCurrent) {
                      stateClass =
                        'ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold border-blue-400';
                    } else if (item.isFlagged) {
                      stateClass =
                        'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-400';
                    } else if (item.isAnswered) {
                      stateClass =
                        'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border-emerald-500/60 dark:border-emerald-500/40 font-semibold';
                    } else {
                      stateClass =
                        'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50';
                    }

                    const taskSub =
                      item.number === 1
                        ? 'Thư/Thông báo • ≥80 từ'
                        : 'Đoạn văn quan điểm • ≥100 từ';

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectQuestion(item.id)}
                        className={`w-full p-2.5 rounded-sm text-xs font-mono transition-all cursor-pointer border flex items-center justify-between text-left ${stateClass}`}
                        title={`Writing ${item.label} (${item.isAnswered ? 'Đã soạn' : 'Chưa làm'})`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">{item.label}</span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[160px] sm:max-w-xs">
                            {taskSub}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {item.isAnswered ? (
                            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded-none">
                              Đã soạn
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-none">
                              Chưa làm
                            </span>
                          )}
                          {item.isFlagged && (
                            <Flag className="w-3 h-3 text-amber-500 fill-current" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : isSpeakingGroup ? (
                /* Giao diện danh sách Speaking Parts */
                <div className="space-y-1.5">
                  {items.map((item) => {
                    let stateClass = '';
                    if (item.isCurrent) {
                      stateClass =
                        'ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold border-blue-400';
                    } else if (item.isFlagged) {
                      stateClass =
                        'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-400';
                    } else if (item.isAnswered) {
                      stateClass =
                        'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border-emerald-500/60 dark:border-emerald-500/40 font-semibold';
                    } else {
                      stateClass =
                        'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50';
                    }

                    const partSub =
                      item.number === 1
                        ? 'Social Interaction • 3\''
                        : 'Cue Card Description • 5\'';

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectQuestion(item.id)}
                        className={`w-full p-2.5 rounded-sm text-xs font-mono transition-all cursor-pointer border flex items-center justify-between text-left ${stateClass}`}
                        title={`Speaking ${item.label} (${item.isAnswered ? 'Đã có dàn ý' : 'Chưa làm'})`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">{item.label}</span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[160px] sm:max-w-xs">
                            {partSub}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {item.isAnswered ? (
                            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded-none">
                              Đã có dàn ý
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-none">
                              Chưa làm
                            </span>
                          )}
                          {item.isFlagged && (
                            <Flag className="w-3 h-3 text-amber-500 fill-current" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Giao diện lưới ô số câu hỏi (Reading / Listening) */
                <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
                  {items.map((item) => {
                    let stateClass = '';
                    if (item.isCurrent) {
                      stateClass =
                        'ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border-blue-400';
                    } else if (item.isFlagged) {
                      stateClass =
                        'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border-amber-400 font-bold shadow-xs';
                    } else if (item.isAnswered) {
                      stateClass =
                        'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-800 font-semibold';
                    } else {
                      stateClass =
                        'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100';
                    }

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectQuestion(item.id)}
                        className={`relative flex items-center justify-center h-8 rounded-sm text-xs font-mono transition-all cursor-pointer border ${stateClass}`}
                        title={`Câu ${item.number} (${item.isAnswered ? 'Đã làm' : 'Chưa làm'})`}
                      >
                        <span>{item.number}</span>
                        {item.isFlagged && (
                          <span className="absolute -top-1 -right-1 text-amber-500">
                            <Flag className="w-2.5 h-2.5 fill-current" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Chú thích màu sắc (Legend) */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-none bg-slate-800 dark:bg-slate-100 inline-block" />
          Đã làm
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-none bg-white border border-slate-300 inline-block" />
          Chưa làm
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-none bg-blue-50 border border-blue-600 inline-block" />
          Đang xem
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-none bg-amber-100 border border-amber-400 inline-block" />
          Gắn cờ
        </span>
      </div>
    </div>
  );
}
