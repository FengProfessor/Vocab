import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

type SourceType = 'official' | 'practice_site' | 'public_drive' | 'recalled' | 'community';
type ResourceKind = 'drive' | 'pdf' | 'audio' | 'document' | 'community' | 'vstep_page';

interface SourceSeed {
  id: string;
  name: string;
  sourceType: SourceType;
  trustScore: number;
  seedUrls: string[];
  allowedHosts: string[];
  crawlPublicPages: boolean;
}

interface SourceRegistry {
  version: string;
  sources: SourceSeed[];
}

interface DiscoveredResource {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  trustScore: number;
  kind: ResourceKind;
  url: string;
  title: string;
  discoveredFrom: string;
}

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(ROOT, 'src', 'data', 'vstep', 'vstep-source-registry.json');
const APPLY = process.argv.includes('--apply');
const MAX_LINKED_PAGES_PER_SOURCE = 12;

function canonicalUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_')) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return null;
  }
}

function classifyResource(url: string): ResourceKind | null {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();
  const lower = url.toLowerCase();
  const contentPath = `${parsed.pathname}${parsed.search}`.toLowerCase();
  if (contentPath.includes('your-zalo-id')) return null;
  if (hostname.includes('drive.google.com') || hostname.includes('docs.google.com')) return 'drive';
  if (
    (hostname.endsWith('facebook.com') && parsed.pathname.toLowerCase().includes('/groups/')) ||
    hostname === 'zalo.me' ||
    hostname === 't.me' ||
    hostname === 'telegram.me' ||
    hostname === 'discord.gg'
  ) return 'community';
  if (/\.pdf(?:$|[?#])/i.test(lower)) return 'pdf';
  if (/\.(?:mp3|wav|m4a|ogg)(?:$|[?#])/i.test(lower)) return 'audio';
  if (/\.(?:docx?|xlsx?|pptx?)(?:$|[?#])/i.test(lower)) return 'document';
  if (/\/authentication\/|\/login(?:\/|\?|$)|\/register(?:\/|\?|$)|ieltstestlibrary/i.test(contentPath)) return null;
  if (/vstep|sample|thi-thu|de-thi|writing|speaking|listening|reading/i.test(contentPath)) return 'vstep_page';
  return null;
}

function resourceId(sourceId: string, url: string): string {
  return `${sourceId}-${crypto.createHash('sha256').update(url).digest('hex').slice(0, 16)}`;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LingoPro-VSTEP-PublicResourceIndexer/1.0)',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      },
    });
    if (!response.ok) {
      console.warn(`[VSTEP Discover] HTTP ${response.status}: ${url}`);
      return null;
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return null;
    return await response.text();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[VSTEP Discover] Fetch failed: ${url} (${message})`);
    return null;
  }
}

function extractLinks(html: string, pageUrl: string): Array<{ url: string; title: string }> {
  const $ = cheerio.load(html);
  const links: Array<{ url: string; title: string }> = [];
  $('a[href], audio[src], source[src]').each((_, element) => {
    const rawHref = $(element).attr('href') || $(element).attr('src');
    if (!rawHref) return;
    try {
      const resolved = canonicalUrl(new URL(rawHref, pageUrl).toString());
      if (!resolved) return;
      const title = $(element).text().replace(/\s+/g, ' ').trim() || $(element).attr('title') || '';
      links.push({ url: resolved, title });
    } catch {
      // Ignore malformed third-party links.
    }
  });
  return links;
}

function isAllowedHost(url: string, source: SourceSeed): boolean {
  try {
    return source.allowedHosts.includes(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

async function discoverSource(source: SourceSeed): Promise<DiscoveredResource[]> {
  const discovered = new Map<string, DiscoveredResource>();
  const queue = source.seedUrls.map((url) => ({ url, depth: 0 }));
  const visited = new Set<string>();
  let followedPages = 0;

  for (const seedUrl of source.seedUrls) {
    const canonical = canonicalUrl(seedUrl);
    if (!canonical) continue;
    const kind = classifyResource(canonical) || 'vstep_page';
    discovered.set(canonical, {
      id: resourceId(source.id, canonical),
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.sourceType,
      trustScore: source.trustScore,
      kind,
      url: canonical,
      title: source.name,
      discoveredFrom: canonical,
    });
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const pageUrl = canonicalUrl(current.url);
    if (!pageUrl || visited.has(pageUrl)) continue;
    visited.add(pageUrl);

    if (!isAllowedHost(pageUrl, source) || source.sourceType === 'public_drive') continue;
    const html = await fetchHtml(pageUrl);
    if (!html) continue;

    for (const link of extractLinks(html, pageUrl)) {
      const kind = classifyResource(link.url);
      if (!kind) continue;
      if (!discovered.has(link.url)) {
        discovered.set(link.url, {
          id: resourceId(source.id, link.url),
          sourceId: source.id,
          sourceName: source.name,
          sourceType: source.sourceType,
          trustScore: source.trustScore,
          kind,
          url: link.url,
          title: link.title || new URL(link.url).pathname.split('/').filter(Boolean).pop() || source.name,
          discoveredFrom: pageUrl,
        });
      }

      if (
        source.crawlPublicPages &&
        current.depth === 0 &&
        kind === 'vstep_page' &&
        isAllowedHost(link.url, source) &&
        followedPages < MAX_LINKED_PAGES_PER_SOURCE
      ) {
        queue.push({ url: link.url, depth: 1 });
        followedPages++;
      }
    }
  }

  return [...discovered.values()];
}

async function main(): Promise<void> {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8')) as SourceRegistry;
  const resources: DiscoveredResource[] = [];

  for (const source of registry.sources) {
    console.log(`[VSTEP Discover] ${source.name}`);
    resources.push(...(await discoverSource(source)));
  }

  const deduped = [...new Map(resources.map((resource) => [resource.url, resource])).values()]
    .sort((a, b) => b.trustScore - a.trustScore || a.sourceId.localeCompare(b.sourceId) || a.url.localeCompare(b.url));

  const output = {
    version: registry.version,
    totalResources: deduped.length,
    byKind: deduped.reduce<Record<string, number>>((acc, resource) => {
      acc[resource.kind] = (acc[resource.kind] || 0) + 1;
      return acc;
    }, {}),
    resources: deduped,
  };

  const outputPath = APPLY
    ? path.join(ROOT, 'src', 'data', 'vstep', 'discovery', 'vstep-source-inventory.json')
    : path.join(ROOT, 'tmp', 'vstep-source-inventory.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`[VSTEP Discover] ${deduped.length} public resources -> ${outputPath}`);
}

main().catch((error) => {
  console.error('[VSTEP Discover] Fatal:', error);
  process.exit(1);
});

