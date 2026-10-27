/**
 * Maps `.NET 10` `GrammarTopicDto[]` items into the canonical grammar topics list shape.
 */
export function mapGrammarTopicsList(items: Record<string, any>[] | null | undefined) {
  const safeList = Array.isArray(items) ? items : [];
  const topics = safeList.map((t, idx) => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    title_vi: t.titleVi || t.title_vi || t.title,
    level: t.level || 'beginner',
    cefr_level: t.certLevel || 'A1',
    order_index: t.sortOrder ?? idx,
    created_at: new Date().toISOString(),
  }));
  return {
    success: true,
    data: topics,
    topics,
  };
}
