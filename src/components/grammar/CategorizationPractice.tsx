'use client';

import React, { useState, useMemo } from 'react';
import { Check, X, RotateCcw, ArrowRight, Layers, HelpCircle, CheckCircle2 } from 'lucide-react';
import type { UnifiedGrammarExercise } from '@/lib/grammar-types';

export interface CategoryItem {
  id: string;
  text: string;
  correctCategory: string;
  hint?: string;
}

export interface CategoryBucketDef {
  id: string;
  label: string;
  description?: string;
}

export interface CategorizationPracticeProps {
  exercise?: UnifiedGrammarExercise;
  question?: string;
  stem?: string;
  categories?: (string | { id?: string; name?: string; label?: string; description?: string; items?: string[] })[];
  items?: (string | { id?: string; text: string; correctCategory?: string; category?: string; hint?: string })[];
  explanation?: string;
  onComplete?: (score: number, total: number) => void;
}

export default function CategorizationPractice({
  exercise,
  question,
  stem,
  categories: rawCategories,
  items: rawItems,
  explanation,
  onComplete,
}: CategorizationPracticeProps) {
  // Title / Question
  const resolvedQuestion =
    exercise?.question ||
    stem ||
    question ||
    'Phân loại các mục ngữ pháp sau vào nhóm tương ứng:';

  const resolvedExplanation = exercise?.explanation || explanation;

  // Normalized categories and items
  const { normalizedCategories, normalizedItems } = useMemo(() => {
    const cats: CategoryBucketDef[] = [];
    const its: CategoryItem[] = [];

    // Case 1: Exercise with categories: { name: string; items: string[] }[]
    if (exercise?.categories && Array.isArray(exercise.categories)) {
      exercise.categories.forEach((c, catIdx) => {
        const catName = c.name;
        cats.push({
          id: catName,
          label: catName,
        });

        if (Array.isArray(c.items)) {
          c.items.forEach((itemText, itemIdx) => {
            its.push({
              id: `ex-item-${catIdx}-${itemIdx}-${itemText}`,
              text: itemText,
              correctCategory: catName,
            });
          });
        }
      });
      return { normalizedCategories: cats, normalizedItems: its };
    }

    // Case 2: rawCategories is array of objects with items
    if (rawCategories && Array.isArray(rawCategories)) {
      rawCategories.forEach((catObj, idx) => {
        if (typeof catObj === 'string') {
          cats.push({ id: catObj, label: catObj });
        } else if (catObj && typeof catObj === 'object') {
          const catLabel = catObj.name || catObj.label || catObj.id || `Nhóm ${idx + 1}`;
          const catId = catObj.id || catObj.name || catObj.label || `cat-${idx}`;
          cats.push({
            id: catId,
            label: catLabel,
            description: catObj.description,
          });

          if (Array.isArray(catObj.items)) {
            catObj.items.forEach((itemText, itemIdx) => {
              its.push({
                id: `raw-item-${idx}-${itemIdx}-${itemText}`,
                text: itemText,
                correctCategory: catId,
              });
            });
          }
        }
      });
    }

    // If separate rawItems provided
    if (rawItems && Array.isArray(rawItems) && its.length === 0) {
      rawItems.forEach((item, idx) => {
        if (typeof item === 'string') {
          its.push({
            id: `item-${idx}-${item}`,
            text: item,
            correctCategory: cats[0]?.id || 'default',
          });
        } else if (item && typeof item === 'object') {
          const itemText = item.text;
          const targetCat = item.correctCategory || item.category || cats[0]?.id || 'default';
          its.push({
            id: item.id || `item-${idx}-${itemText}`,
            text: itemText,
            correctCategory: targetCat,
            hint: item.hint,
          });
        }
      });
    }

    return { normalizedCategories: cats, normalizedItems: its };
  }, [exercise, rawCategories, rawItems]);

  // State
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({}); // itemId -> categoryId
  const [submitted, setSubmitted] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const unassignedItems = normalizedItems.filter((it) => !assignments[it.id]);

  const handleSelectOrAssign = (categoryId: string) => {
    if (submitted) return;
    if (!selectedItemId) return;

    setAssignments((prev) => ({
      ...prev,
      [selectedItemId]: categoryId,
    }));
    setSelectedItemId(null);
  };

  const handleUnassign = (itemId: string) => {
    if (submitted) return;
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const handleDragStart = (itemId: string) => {
    if (submitted) return;
    setDraggedItemId(itemId);
  };

  const handleDrop = (categoryId: string) => {
    if (submitted || !draggedItemId) return;
    setAssignments((prev) => ({
      ...prev,
      [draggedItemId]: categoryId,
    }));
    setDraggedItemId(null);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    let correctCount = 0;
    normalizedItems.forEach((it) => {
      const placed = assignments[it.id];
      if (placed && placed.trim().toLowerCase() === it.correctCategory.trim().toLowerCase()) {
        correctCount++;
      }
    });
    onComplete?.(correctCount, normalizedItems.length);
  };

  const handleReset = () => {
    setAssignments({});
    setSelectedItemId(null);
    setSubmitted(false);
  };

  const calculateScore = () => {
    let correct = 0;
    normalizedItems.forEach((it) => {
      const placed = assignments[it.id];
      if (placed && placed.trim().toLowerCase() === it.correctCategory.trim().toLowerCase()) {
        correct++;
      }
    });
    return {
      correct,
      total: normalizedItems.length,
      percentage: normalizedItems.length > 0 ? Math.round((correct / normalizedItems.length) * 100) : 0,
    };
  };

  const scoreResult = submitted ? calculateScore() : null;

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-none p-5 space-y-5 my-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary shrink-0" />
          <h4 className="font-serif text-sm font-semibold text-slate-900 dark:text-slate-100">
            {resolvedQuestion}
          </h4>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-none border border-slate-200 dark:border-slate-700">
          DẠNG BÀI: PHÂN LOẠI KHÁI NIỆM
        </span>
      </div>

      {/* Unassigned Item Pool */}
      {!submitted && (
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-xs text-slate-500">
            <span>
              DANH SÁCH MỤC CẦN PHÂN LOẠI ({unassignedItems.length} mục chưa xếp):
            </span>
            <span className="text-[11px] text-slate-400">
              (Bấm chọn rồi bấm nhóm hoặc kéo thả)
            </span>
          </div>

          <div className="flex flex-wrap gap-2 min-h-[48px] p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none">
            {unassignedItems.map((item) => (
              <button
                key={item.id}
                type="button"
                draggable
                onDragStart={() => handleDragStart(item.id)}
                onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                className={`px-3 py-1.5 text-xs font-mono font-medium border rounded-none transition-all cursor-pointer ${
                  selectedItemId === item.id
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.text}
              </button>
            ))}

            {unassignedItems.length === 0 && (
              <span className="text-xs text-slate-400 italic py-1 font-mono">
                ✓ Đã xếp toàn bộ mục vào các nhóm. Hãy nhấn nút &quot;Kiểm tra phân loại&quot; bên dưới.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Category Buckets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {normalizedCategories.map((cat) => {
          const assignedHere = normalizedItems.filter((it) => assignments[it.id] === cat.id);

          return (
            <div
              key={cat.id}
              onClick={() => handleSelectOrAssign(cat.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(cat.id)}
              className={`border-2 p-4 min-h-[160px] flex flex-col justify-between rounded-none transition-colors ${
                selectedItemId && !submitted
                  ? 'border-primary border-dashed bg-primary/[0.02] cursor-pointer hover:bg-primary/[0.05]'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 border-dashed'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {cat.label}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                    {assignedHere.length} mục
                  </span>
                </div>

                {cat.description && (
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {cat.description}
                  </p>
                )}

                {/* Items in this bucket */}
                <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                  {assignedHere.map((item) => {
                    const isRight =
                      item.correctCategory.trim().toLowerCase() === cat.id.trim().toLowerCase();

                    let badgeCls =
                      'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200';

                    if (submitted) {
                      badgeCls = isRight
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500 text-rose-800 dark:text-rose-300 line-through';
                    }

                    return (
                      <span
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnassign(item.id);
                        }}
                        className={`px-2.5 py-1 text-xs font-mono border rounded-none flex items-center gap-1.5 transition-colors ${
                          !submitted ? 'cursor-pointer hover:border-rose-400 hover:text-rose-600' : ''
                        } ${badgeCls}`}
                        title={
                          submitted
                            ? isRight
                              ? 'Xếp đúng nhóm'
                              : `Sai: Thuộc nhóm ${item.correctCategory}`
                            : 'Nhấn để đưa lại về kho từ'
                        }
                      >
                        {item.text}
                        {submitted && isRight && (
                          <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                        )}
                        {submitted && !isRight && (
                          <X className="h-3 w-3 text-rose-600 shrink-0" />
                        )}
                      </span>
                    );
                  })}

                  {assignedHere.length === 0 && !submitted && (
                    <span className="text-[11px] font-mono text-slate-400 italic py-2">
                      (Trống — thả mục vào đây)
                    </span>
                  )}
                </div>
              </div>

              {selectedItemId && !submitted && (
                <div className="pt-2 text-[11px] font-mono text-primary flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  Nhấn vào nhóm này để xếp
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Post-submission Result & Explanation */}
      {submitted && scoreResult && (
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800 font-sans">
          <div
            className={`p-3.5 border rounded-none flex items-center justify-between text-xs font-mono font-semibold uppercase tracking-wider ${
              scoreResult.percentage === 100
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                KẾT QUẢ: {scoreResult.correct}/{scoreResult.total} MỤC PHÂN LOẠI CHÍNH XÁC (
                {scoreResult.percentage}%)
              </span>
            </div>
            <span>
              {scoreResult.percentage === 100 ? 'XUẤT SẮC' : 'CẦN ÔN LẠI CÁC MỤC SAI'}
            </span>
          </div>

          {resolvedExplanation && (
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Phân tích bản chất quy tắc:
              </span>
              <p className="leading-relaxed">{resolvedExplanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
        {!submitted ? (
          <button
            type="button"
            disabled={unassignedItems.length > 0}
            onClick={handleSubmit}
            className="px-5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs uppercase font-semibold rounded-none disabled:opacity-30 hover:opacity-90 transition-opacity"
          >
            Kiểm tra phân loại
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs uppercase font-semibold rounded-none hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Làm lại bài này
          </button>
        )}
      </div>
    </div>
  );
}
