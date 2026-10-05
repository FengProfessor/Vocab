/**
 * Lọc thẻ từ hợp lệ cho phiên ôn tập (loại bỏ các từ dịch lỗi / đang phân tích / rỗng)
 */
export function isWordValidForReview(w: { word?: string | null; translation?: string | null }): boolean {
  if (!w.word || !w.word.trim()) return false;
  if (!w.translation || !w.translation.trim()) return false;
  const transLower = w.translation.toLowerCase();
  if (transLower.includes('failed') || transLower.includes('analyzing') || w.translation.includes('⏳')) {
    return false;
  }
  return true;
}

/**
 * Deduplicate danh sách từ vựng cross-classroom cho phiên ôn tập.
 * Khóa: w.word.trim().toLowerCase()
 * Tiêu chí ưu tiên:
 * 1. reviewCount cao hơn (kinh nghiệm ôn tập sâu hơn)
 * 2. next_review_date sớm hơn (ưu tiên từ cần ôn cấp bách hơn)
 * 3. Nếu hòa: ưu tiên từ có câu ví dụ (hỗ trợ tạo bài tập cloze_mcq, cloze_type)
 */
export function deduplicateReviewWords<T extends {
  word: string;
  reviewCount: number;
  next_review_date?: string | null;
  example?: string | null;
}>(words: T[]): T[] {
  const parseTime = (d: string | null | undefined): number => {
    if (!d) return Infinity;
    const t = new Date(d).getTime();
    return Number.isNaN(t) ? Infinity : t;
  };

  const dedupMap = new Map<string, T>();
  for (const item of words) {
    const key = item.word.trim().toLowerCase();
    if (!key) continue;

    const existing = dedupMap.get(key);
    if (!existing) {
      dedupMap.set(key, item);
      continue;
    }

    if (item.reviewCount > existing.reviewCount) {
      dedupMap.set(key, item);
    } else if (item.reviewCount === existing.reviewCount) {
      const itemDate = parseTime(item.next_review_date);
      const existingDate = parseTime(existing.next_review_date);
      if (itemDate < existingDate) {
        dedupMap.set(key, item);
      } else if (itemDate === existingDate) {
        if (item.example?.trim() && !existing.example?.trim()) {
          dedupMap.set(key, item);
        }
      }
    }
  }

  return Array.from(dedupMap.values());
}
