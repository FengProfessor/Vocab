import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface ManifestItem {
  stt: number;
  word: string;
  slug: string;
  scene?: string;
  pedagogical_scene?: string;
  prompt: string;
}

const BUCKET = 'vocab-images';
const STORAGE_PREFIX = 'flow/roadmap';
const CONCURRENCY = 10;

async function main() {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !sbKey) throw new Error('Missing Supabase credentials in .env.local');

  const supabase = createClient(sbUrl, sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const manifestPath = path.resolve(process.cwd(), 'tmp/flow/vocab_500_manifest.json');
  const outputDir = path.resolve(process.cwd(), 'tmp/flow/500_output');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }
  if (!fs.existsSync(outputDir)) {
    throw new Error(`Output dir not found at ${outputDir}`);
  }

  const manifest: ManifestItem[] = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  console.log(`[FlowIngest] Loaded ${manifest.length} manifest items from ${manifestPath}`);

  // Map disk files
  const diskFiles = fs.readdirSync(outputDir).filter(f => /\.(png|webp|jpg|jpeg)$/i.test(f));
  console.log(`[FlowIngest] Found ${diskFiles.length} images on disk in ${outputDir}`);

  // Create lookup map: stt_slug and plain slug
  const fileMap = new Map<string, string>();
  for (const f of diskFiles) {
    fileMap.set(f.toLowerCase(), path.join(outputDir, f));
    // Also index without extension
    const baseName = path.parse(f).name.toLowerCase();
    fileMap.set(baseName, path.join(outputDir, f));
  }

  let ok = 0;
  let fail = 0;
  let skipped = 0;
  const urlMap = new Map<string, string>();

  // Process in concurrent chunks
  const chunks: ManifestItem[][] = [];
  for (let i = 0; i < manifest.length; i += CONCURRENCY) {
    chunks.push(manifest.slice(i, i + CONCURRENCY));
  }

  for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
    const chunk = chunks[cIdx];
    await Promise.all(chunk.map(async (item) => {
      const sttPadded = item.stt ? item.stt.toString().padStart(3, '0') : '';
      const sttSlug = `${sttPadded}_${item.slug}`.toLowerCase();
      const plainSlug = item.slug.toLowerCase();

      let targetPath = fileMap.get(sttSlug) || fileMap.get(`${sttSlug}.png`) ||
                       fileMap.get(plainSlug) || fileMap.get(`${plainSlug}.png`);

      if (!targetPath) {
        // Direct prefix search by STT
        const candidate = diskFiles.find(f => f.startsWith(`${sttPadded}_`));
        if (candidate) targetPath = path.join(outputDir, candidate);
      }

      if (!targetPath || !fs.existsSync(targetPath)) {
        console.warn(`[FlowIngest] [MISSING] #${item.stt} '${item.word}' (slug: ${item.slug})`);
        skipped++;
        return;
      }

      const fileBuf = fs.readFileSync(targetPath);
      const ext = path.extname(targetPath).toLowerCase() || '.png';
      const mime = ext === '.webp' ? 'image/webp' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
      const storagePath = `${STORAGE_PREFIX}/${item.slug}${ext}`;

      try {
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, fileBuf, { contentType: mime, upsert: true });

        if (upErr) throw upErr;

        const { data: pubData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
        const publicUrl = pubData.publicUrl;
        urlMap.set(item.word.toLowerCase().trim(), publicUrl);

        // Update global_dictionary
        const { error: dbErr } = await supabase
          .from('global_dictionary')
          .update({
            image_url: publicUrl,
            image_source: 'google-flow',
            image_confidence: 98,
            image_verified_at: new Date().toISOString(),
          })
          .eq('word', item.word);

        if (dbErr) {
          console.warn(`[FlowIngest] DB warning for "${item.word}":`, dbErr.message);
        }

        console.log(`[FlowIngest] OK #${item.stt} "${item.word}" => ${publicUrl}`);
        ok++;
      } catch (err: any) {
        console.error(`[FlowIngest] FAIL #${item.stt} "${item.word}":`, err.message);
        fail++;
      }
    }));
  }

  // Sync into vocab-stages-v1.json
  const roadmapPath = path.resolve(process.cwd(), 'src/data/roadmap/vocab-stages-v1.json');
  if (fs.existsSync(roadmapPath) && urlMap.size > 0) {
    try {
      const stagesJson = JSON.parse(fs.readFileSync(roadmapPath, 'utf-8'));
      let patchedCount = 0;
      for (const st of stagesJson.stages || []) {
        for (const top of st.topics || []) {
          for (const w of top.words || []) {
            const hit = urlMap.get(w.word.toLowerCase().trim());
            if (hit) {
              w.imageUrl = hit;
              patchedCount++;
            }
          }
        }
      }
      fs.writeFileSync(roadmapPath, JSON.stringify(stagesJson, null, 2), 'utf-8');
      console.log(`\n[FlowIngest] Synced ${patchedCount} imageUrls directly into vocab-stages-v1.json!`);
    } catch (e: any) {
      console.warn(`[FlowIngest] Error patching vocab-stages-v1.json:`, e.message);
    }
  }

  console.log(`\n=======================================================`);
  console.log(`[FlowIngest] SUMMARY`);
  console.log(`Total Manifest: ${manifest.length}`);
  console.log(`Uploaded & DB Synced: ${ok}`);
  console.log(`Skipped / Not Found: ${skipped}`);
  console.log(`Errors: ${fail}`);
  console.log(`=======================================================`);
}

main().catch((err) => {
  console.error('[FlowIngest] Fatal error:', err);
  process.exit(1);
});
