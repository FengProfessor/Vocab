import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface ManifestItem {
  word: string;
  slug: string;
  pedagogical_scene: string;
  prompt: string;
}

const BUCKET = 'vocab-images';
const STORAGE_PREFIX = 'flow/roadmap';

async function main() {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !sbKey) throw new Error('Missing Supabase credentials in .env.local');

  const supabase = createClient(sbUrl, sbKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const args = process.argv.slice(2);
  const dirArgIdx = args.indexOf('--dir');
  const targetDir =
    dirArgIdx !== -1 ? path.resolve(process.cwd(), args[dirArgIdx + 1]) : path.resolve(process.cwd(), 'tmp/flow');

  const manifestPath = path.join(targetDir, 'manifest.json');
  const outputDir = path.join(targetDir, 'output');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}.`);
  }

  const manifest: ManifestItem[] = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  if (!fs.existsSync(outputDir)) {
    console.log(`[FlowIngest] Output directory not found: ${outputDir}`);
    console.log(`[FlowIngest] Generate images first with:`);
    console.log(`gflow image t2i --prompts-file "${path.join(targetDir, 'prompts.txt')}" --aspect 16:9 --out "${outputDir}/" --jitter 3-8`);
    return;
  }

  const files = fs
    .readdirSync(outputDir)
    .filter((f) => /\.(png|webp|jpg|jpeg)$/i.test(f))
    .map((f) => ({
      name: f,
      fullPath: path.join(outputDir, f),
      ctime: fs.statSync(path.join(outputDir, f)).ctimeMs,
    }))
    .sort((a, b) => a.ctime - b.ctime);

  console.log(`[FlowIngest] Found ${files.length} images for ${manifest.length} manifest words in ${targetDir}`);

  if (files.length === 0) {
    console.log('[FlowIngest] No image files found in output directory.');
    return;
  }

  let ok = 0;
  let fail = 0;
  const urlMap = new Map<string, string>();

  for (let i = 0; i < manifest.length; i++) {
    const item = manifest[i];
    const targetSlug = item.slug.toLowerCase();
    const matchedFile = files.find((f) => {
      const baseName = path.parse(f.name).name.toLowerCase();
      return baseName === targetSlug;
    });

    if (!matchedFile) {
      continue;
    }

    const fileBuf = fs.readFileSync(matchedFile.fullPath);
    const ext = path.extname(matchedFile.name).toLowerCase() || '.png';
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
        console.warn(`[FlowIngest] DB update warning for "${item.word}":`, dbErr.message);
      }

      console.log(`[FlowIngest] OK [${i + 1}/${manifest.length}] "${item.word}" => ${publicUrl}`);
      ok++;
    } catch (err: any) {
      console.error(`[FlowIngest] FAIL "${item.word}":`, err.message);
      fail++;
    }
  }

  // Also sync into vocab-stages-v1.json if roadmap words were updated
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
      console.log(`[FlowIngest] Synced ${patchedCount} imageUrls directly into vocab-stages-v1.json!`);
    } catch (e: any) {
      console.warn(`[FlowIngest] Error patching vocab-stages-v1.json:`, e.message);
    }
  }

  console.log(`\n=======================================================`);
  console.log(`[FlowIngest] Hoàn tất! Thành công: ${ok}, Lỗi: ${fail}`);
  console.log(`=======================================================`);
}

main().catch((err) => {
  console.error('[FlowIngest] Fatal error:', err);
  process.exit(1);
});
