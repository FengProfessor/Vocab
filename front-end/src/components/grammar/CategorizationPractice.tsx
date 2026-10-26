
import React, { useState, useMemo } from 'react';
import { Check, X, RotateCcw, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';
import type { UnifiedGrammarExercise } from '@/lib/grammar-types';
import FormattedText from './FormattedText';

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
  nextButtonLabel?: string;
  onComplete?: (score: number, total: number) => void;
  onRetry?: () => void;
  onNextQuestion?: () => void;
}

export default function CategorizationPractice({
  exercise,
  question,
  stem,
  categories: rawCategories,
  items: rawItems,
  explanation,
  nextButtonLabel,
  onComplete,
  onRetry,
  onNextQuestion,
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
    onRetry?.();
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
    <div className="border border-border bg-card rounded-lg p-5 space-y-5 my-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary shrink-0" />
          <h4 className="font-sans text-sm font-semibold text-foreground">
            <FormattedText text={resolvedQuestion} />
          </h4>
        </div>
        <span className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-lg border border-border">
          DẠNG BÀI: PHÂN LOẠI KHÁI NIỆM
        </span>
      </div>

      {/* Unassigned Item Pool */}
      {!submitted && (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-sans text-xs text-muted-foreground">
            <span className="tabular-nums">
              DANH SÁCH MỤC CẦN PHÂN LOẠI ({unassignedItems.length} mục chưa xếp):
            </span>
            <span className="text-[11px] text-muted-foreground/70">
              (Chạm chọn từ rồi chạm vào nhóm bên dưới)
            </span>
          </div>

          <div className="flex flex-wrap gap-2 min-h-[52px] p-3 bg-muted/20 border border-border rounded-lg">
            {unassignedItems.map((item) => (
              <button
                key={item.id}
                type="button"
                draggable
                onDragStart={() => handleDragStart(item.id)}
                onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                className={`min-h-[40px] px-3 py-1.5 text-xs font-sans font-medium border rounded-lg transition-all cursor-pointer ${
                  selectedItemId === item.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-foreground border-border hover:border-foreground hover:bg-muted'
                }`}
              >
                {item.text}
              </button>
            ))}

            {unassignedItems.length === 0 && (
              <span className="text-xs text-muted-foreground italic py-1 font-sans">
                ✓ Đã xếp toàn bộ mục vào các nhóm. Hãy nhấn nút &quot;Kiểm tra phân loại&quot; bên dưới.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Category Buckets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {normalizedCategories.map((cat) => {
          const assignedHere = normalizedItems.filter((it) => assignments[it.id] === cat.id);

          return (
            <div
              key={cat.id}
              onClick={() => handleSelectOrAssign(cat.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(cat.id)}
              className={`border-2 p-3.5 sm:p-4 min-h-[140px] sm:min-h-[160px] flex flex-col justify-between rounded-lg transition-colors ${
                selectedItemId && !submitted
                  ? 'border-primary border-dashed bg-primary/[0.02] cursor-pointer hover:bg-primary/[0.05]'
                  : 'border-border bg-muted/10 border-dashed'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-1.5">
                  <span className="font-sans text-xs font-bold uppercase tracking-wider text-foreground">
                    {cat.label}
                  </span>
                  <span className="font-sans text-[11px] text-muted-foreground tabular-nums">
                    {assignedHere.length} mục
                  </span>
                </div>

                {cat.description && (
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    <FormattedText text={cat.description} />
                  </p>
                )}

                {/* Items in this bucket */}
                <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                  {assignedHere.map((item) => {
                    const isRight =
                      item.correctCategory.trim().toLowerCase() === cat.id.trim().toLowerCase();

                    let badgeCls =
                      'bg-card border-border text-foreground';

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
                        className={`min-h-[36px] px-2.5 py-1 text-xs font-sans border rounded-lg inline-flex items-center gap-1.5 transition-colors ${
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
                    <span className="text-[11px] font-sans text-muted-foreground italic py-2">
                      (Trống — chạm vào đây để xếp)
                    </span>
                  )}
                </div>
              </div>

              {selectedItemId && !submitted && (
                <div className="pt-2 text-[11px] font-sans text-primary flex items-center gap-1">
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
        <div className="space-y-3 pt-3 border-t border-border font-sans">
          <div
            className={`p-3.5 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-sans font-semibold uppercase tracking-wider tabular-nums ${
              scoreResult.percentage === 100
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
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
            <div className="p-3 bg-muted/20 border border-border rounded-lg text-xs text-foreground/90 space-y-1">
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Phân tích bản chất quy tắc:
              </span>
              <p className="leading-relaxed">
                <FormattedText text={resolvedExplanation} />
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-border">
        {!submitted ? (
          <button
            type="button"
            disabled={unassignedItems.length > 0 || normalizedItems.length === 0}
            onClick={handleSubmit}
            className="min-h-[44px] px-5 py-2.5 bg-primary text-primary-foreground font-sans text-xs uppercase font-semibold rounded-lg disabled:opacity-30 hover:bg-primary/90 transition-opacity flex items-center justify-center"
          >
            Kiểm tra phân loại
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleReset}
              className="min-h-[44px] px-4 py-2.5 border border-border text-foreground font-sans text-xs uppercase font-semibold rounded-lg hover:bg-muted flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Làm lại bài này
            </button>
            {onNextQuestion && (
              <button
                type="button"
                onClick={onNextQuestion}
                className="min-h-[44px] px-5 py-2.5 bg-primary text-primary-foreground font-sans text-xs uppercase font-semibold rounded-lg hover:bg-primary/90 transition-opacity flex items-center justify-center gap-1.5"
              >
                <span>{nextButtonLabel || 'Câu tiếp theo'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
