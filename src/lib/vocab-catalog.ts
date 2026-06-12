/**
 * Catalog V3 — loader trung tâm. Đọc artifact tĩnh (deterministic) + quality snapshot,
 * merge publishStatus/coverImage/cefr, dựng cây route→topic→subtopic→pack và map tra cứu packId.
 *
 * Artifact: scripts/catalog-v3/generate.ts → src/data/vocab/catalog-v3.json
 * Quality:  scripts/catalog-v3/quality-gate.ts → src/data/vocab/catalog-v3.quality.json
 *
 * API chỉ phục vụ subtopic publishStatus === 'published' (đảm bảo không vi phạm hard gate).
 */
import catalogArtifact from '@/data/vocab/catalog-v3.json';
import catalogQuality from '@/data/vocab/catalog-v3.quality.json';

export type ContentType = 'word' | 'phrase' | 'idiom' | 'phrasal_verb';
export type PublishStatus = 'published' | 'draft' | 'quarantine';
export interface CefrRange { min: string; max: string }

interface RawRoute { id: string; title: string; icon: string; coverImage: string; description: string; featured: boolean; topicIds: string[] }
interface RawTopic { id: string; routeId: string; key: string; title: string; subtopicIds: string[] }
interface RawSubtopic {
  id: string; topicId: string; routeId: string; title: string; sourcePackage: 'pro3m' | 'pro3m-plus'; sourceName: string;
  contentType: ContentType; wordCount: number; packIds: string[]; previewWords: string[];
  cefrRange: CefrRange | null; coverImage: string | null; attribution: string;
}
interface RawPack { id: string; subtopicId: string; index: number; title: string; wordCount: number; words: { word: string; contentType: ContentType }[] }
interface RawArtifact { catalogVersion: string; microPackSize: number; routes: RawRoute[]; topics: RawTopic[]; subtopics: RawSubtopic[]; packs: RawPack[] }
interface QualitySub { publishStatus: PublishStatus; qualityScore: number; viCoverage: number; imageCoverage: number; cefrRange: CefrRange | null; coverImage: string | null }
interface RawQuality { subtopics: Record<string, QualitySub>; topics: Record<string, { publishStatus: string; qualityScore: number }>; routes: Record<string, { publishStatus: string; publishedSubtopics: number; totalSubtopics: number }> }

const artifact = catalogArtifact as unknown as RawArtifact;
const quality = catalogQuality as unknown as RawQuality;

export const CATALOG_VERSION = artifact.catalogVersion;
export const MICRO_PACK_SIZE = artifact.microPackSize;

export interface PackResolved {
  packId: string; index: number; title: string; wordCount: number; words: string[];
  subtopicId: string; subtopicTitle: string; topicId: string; routeId: string; published: boolean;
}

const packById = new Map<string, RawPack>(artifact.packs.map((p) => [p.id, p]));
const subById = new Map<string, RawSubtopic>(artifact.subtopics.map((s) => [s.id, s]));

function subPublishStatus(id: string): PublishStatus {
  return quality.subtopics[id]?.publishStatus ?? 'draft';
}

/** Tra cứu 1 pack theo id ổn định (cho POST import). */
export function resolvePack(packId: string): PackResolved | null {
  const pack = packById.get(packId);
  if (!pack) return null;
  const sub = subById.get(pack.subtopicId);
  if (!sub) return null;
  return {
    packId: pack.id, index: pack.index, title: pack.title, wordCount: pack.wordCount,
    words: pack.words.map((w) => w.word), subtopicId: sub.id, subtopicTitle: sub.title,
    topicId: sub.topicId, routeId: sub.routeId, published: subPublishStatus(sub.id) === 'published',
  };
}

// ── Cây catalog phục vụ UI (chỉ subtopic published) ──
export interface CatalogPack { id: string; index: number; title: string; wordCount: number; words: string[] }
export interface CatalogSubtopic {
  id: string; title: string; contentType: ContentType; wordCount: number; packCount: number;
  cefrRange: CefrRange | null; coverImage: string | null; qualityScore: number; previewWords: string[]; packs: CatalogPack[];
}
export interface CatalogTopic { id: string; title: string; subtopics: CatalogSubtopic[] }
export interface CatalogRoute { id: string; title: string; icon: string; coverImage: string; description: string; featured: boolean; topics: CatalogTopic[]; subtopicCount: number }

let cachedTree: CatalogRoute[] | null = null;

/** Cây route→topic→subtopic→pack, CHỈ subtopic published. Cache trong process. */
export function getCatalogTree(): CatalogRoute[] {
  if (cachedTree) return cachedTree;
  const topicById = new Map(artifact.topics.map((t) => [t.id, t]));

  const tree = artifact.routes.map<CatalogRoute>((route) => {
    const topics = route.topicIds
      .map((tid) => topicById.get(tid))
      .filter((t): t is RawTopic => Boolean(t))
      .map<CatalogTopic>((topic) => {
        const subtopics = topic.subtopicIds
          .map((sid) => subById.get(sid))
          .filter((s): s is RawSubtopic => Boolean(s) && subPublishStatus(s!.id) === 'published')
          .map<CatalogSubtopic>((s) => {
            const q = quality.subtopics[s.id];
            const packs = s.packIds
              .map((pid) => packById.get(pid))
              .filter((p): p is RawPack => Boolean(p))
              .map<CatalogPack>((p) => ({ id: p.id, index: p.index, title: p.title, wordCount: p.wordCount, words: p.words.map((w) => w.word) }));
            return {
              id: s.id, title: s.title, contentType: s.contentType, wordCount: s.wordCount, packCount: packs.length,
              cefrRange: q?.cefrRange ?? s.cefrRange, coverImage: q?.coverImage ?? s.coverImage,
              qualityScore: q?.qualityScore ?? 0, previewWords: s.previewWords, packs,
            };
          });
        return { id: topic.id, title: topic.title, subtopics };
      })
      .filter((t) => t.subtopics.length > 0);

    const subtopicCount = topics.reduce((n, t) => n + t.subtopics.length, 0);
    return { id: route.id, title: route.title, icon: route.icon, coverImage: route.coverImage, description: route.description, featured: route.featured, topics, subtopicCount };
  }).filter((r) => r.subtopicCount > 0);

  cachedTree = tree;
  return tree;
}

/** Map packId → routeId (cho tổng hợp progress theo route). */
export function packRouteMap(): Map<string, string> {
  const m = new Map<string, string>();
  for (const p of artifact.packs) {
    const sub = subById.get(p.subtopicId);
    if (sub) m.set(p.id, sub.routeId);
  }
  return m;
}
