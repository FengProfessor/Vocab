import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const targetFile = path.resolve(rootDir, 'research/100_vietnam_english_websites.json');

const ALLOWED_CATEGORIES = new Set([
  'edtech_startup',
  'exam_prep_ielts_toeic',
  'video_listening_specialist',
  'general_skills_community',
  'k12_academic',
  'global_localized',
]);

function normalizeUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl.trim());
    let hostname = parsed.hostname.toLowerCase();
    // remove www. for duplicate check consistency if needed, but preserve protocol + host + pathname
    let pathname = parsed.pathname;
    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }
    return `${parsed.protocol}//${hostname}${pathname}${parsed.search}`;
  } catch {
    return rawUrl.trim().toLowerCase().replace(/\/+$/, '');
  }
}

async function validateMarketResearch() {
  console.log('===========================================================');
  console.log('  VIETNAM ENGLISH PLATFORMS MARKET RESEARCH VALIDATOR');
  console.log('===========================================================');
  console.log(`Checking target file: ${targetFile}\n`);

  if (!fs.existsSync(targetFile)) {
    console.error(`❌ ERROR: File not found: ${targetFile}`);
    process.exit(1);
  }

  let content;
  try {
    content = fs.readFileSync(targetFile, 'utf8');
  } catch (err) {
    console.error(`❌ ERROR: Failed to read file: ${err.message}`);
    process.exit(1);
  }

  let items;
  try {
    items = JSON.parse(content);
  } catch (err) {
    console.error(`❌ ERROR: JSON parsing failed: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(items)) {
    console.error('❌ ERROR: Root data must be a JSON array.');
    process.exit(1);
  }

  const errors = [];
  const warnings = [];

  // 1. Quantity check
  if (items.length < 100) {
    errors.push(`Total entries is ${items.length}, which is less than the required minimum of 100.`);
  }

  // 2. URL uniqueness & normalization
  const seenUrls = new Map();
  items.forEach((item, index) => {
    const rawUrl = item.url;
    if (!rawUrl || typeof rawUrl !== 'string') {
      errors.push(`Item #${index + 1} (${item.name || 'Unnamed'}): Missing or invalid url field.`);
      return;
    }
    const normUrl = normalizeUrl(rawUrl);
    if (seenUrls.has(normUrl)) {
      const prevIdx = seenUrls.get(normUrl);
      errors.push(
        `Item #${index + 1} (${item.name}) duplicate URL with Item #${prevIdx + 1}: ${normUrl}`
      );
    } else {
      seenUrls.set(normUrl, index);
    }
  });

  // 3. Detailed schema and field validation
  const categoryStats = {};
  for (const cat of ALLOWED_CATEGORIES) {
    categoryStats[cat] = 0;
  }
  let videoFeatureCount = 0;
  let nonVideoFeatureCount = 0;

  items.forEach((item, idx) => {
    const prefix = `Item #${idx + 1} (${item.name || 'Unnamed'})`;

    // name
    if (!item.name || typeof item.name !== 'string' || item.name.trim().length < 2) {
      errors.push(`${prefix}: 'name' must be a non-empty string (>= 2 chars).`);
    }

    // url format
    if (!item.url || typeof item.url !== 'string') {
      errors.push(`${prefix}: 'url' must be a valid string.`);
    } else {
      try {
        const u = new URL(item.url);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          errors.push(`${prefix}: 'url' protocol must be http or https, got '${u.protocol}'.`);
        }
      } catch {
        errors.push(`${prefix}: 'url' '${item.url}' is not a valid RFC-compliant URL.`);
      }
    }

    // category
    if (!item.category || typeof item.category !== 'string') {
      errors.push(`${prefix}: 'category' field is missing or not a string.`);
    } else if (!ALLOWED_CATEGORIES.has(item.category)) {
      errors.push(
        `${prefix}: Invalid category '${item.category}'. Allowed: ${Array.from(ALLOWED_CATEGORIES).join(', ')}`
      );
    } else {
      categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
    }

    // has_video_feature
    if (typeof item.has_video_feature !== 'boolean') {
      errors.push(`${prefix}: 'has_video_feature' must be boolean (true/false), got ${typeof item.has_video_feature}.`);
    } else {
      if (item.has_video_feature) {
        videoFeatureCount++;
      } else {
        nonVideoFeatureCount++;
      }
    }

    // video_features_analysis
    if (!item.video_features_analysis || typeof item.video_features_analysis !== 'string' || item.video_features_analysis.trim().length < 10) {
      errors.push(`${prefix}: 'video_features_analysis' must be non-empty string with length >= 10 chars.`);
    }

    // pros (min 2 items required)
    if (!Array.isArray(item.pros)) {
      errors.push(`${prefix}: 'pros' must be an array.`);
    } else {
      if (item.pros.length < 2) {
        errors.push(`${prefix}: 'pros' array must contain at least 2 items, got ${item.pros.length}.`);
      }
      item.pros.forEach((p, pIdx) => {
        if (typeof p !== 'string' || p.trim().length < 3) {
          errors.push(`${prefix}: pros[${pIdx}] must be a non-empty string (>= 3 chars).`);
        }
      });
    }

    // cons (min 1 item required)
    if (!Array.isArray(item.cons)) {
      errors.push(`${prefix}: 'cons' must be an array.`);
    } else {
      if (item.cons.length < 1) {
        errors.push(`${prefix}: 'cons' array must contain at least 1 item, got ${item.cons.length}.`);
      }
      item.cons.forEach((c, cIdx) => {
        if (typeof c !== 'string' || c.trim().length < 3) {
          errors.push(`${prefix}: cons[${cIdx}] must be a non-empty string (>= 3 chars).`);
        }
      });
    }
  });

  // Print Statistical Summary
  console.log('--- STATISTICAL DISTRIBUTION REPORT ---');
  console.log(`Total Platforms Analyzed: ${items.length}`);
  console.log(`Unique Canonical URLs:   ${seenUrls.size}`);
  console.log(`\nCategory Breakdown:`);
  console.table(
    Object.entries(categoryStats).map(([cat, count]) => ({
      Category: cat,
      Count: count,
      Percentage: `${((count / items.length) * 100).toFixed(1)}%`,
    }))
  );

  console.log(`\nVideo Feature Capabilities:`);
  console.table([
    {
      Feature: 'Has Video / Listening Features',
      Count: videoFeatureCount,
      Percentage: `${((videoFeatureCount / items.length) * 100).toFixed(1)}%`,
    },
    {
      Feature: 'No Video / Text/Audio Only',
      Count: nonVideoFeatureCount,
      Percentage: `${((nonVideoFeatureCount / items.length) * 100).toFixed(1)}%`,
    },
  ]);

  if (warnings.length > 0) {
    console.log(`\n⚠️ Warnings (${warnings.length}):`);
    warnings.slice(0, 10).forEach(w => console.warn(`  - ${w}`));
  }

  if (errors.length > 0) {
    console.error(`\n❌ VALIDATION FAILED with ${errors.length} error(s):`);
    errors.slice(0, 25).forEach(e => console.error(`  - ${e}`));
    if (errors.length > 25) {
      console.error(`  ... and ${errors.length - 25} more errors.`);
    }
    process.exit(1);
  }

  console.log('\n✅ ALL VALIDATIONS PASSED! Dataset is 100% compliant with schema & uniqueness constraints.');
  process.exit(0);
}

validateMarketResearch();
