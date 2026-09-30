import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_PATH = path.join(ROOT_DIR, 'src/data/grammar-topic-assets.json');
const OUT_DIR = path.join(ROOT_DIR, 'scripts/grammar-gen/out');

interface AssetEntry {
  image: string;
  audio?: string;
  imageAlt?: string;
  caption?: string;
  usageAnalysisVi?: {
    rule: string;
    contextReason: string;
    commonMistake: string;
  };
}

interface TopicLesson {
  slug: string;
  title: string;
  title_vi: string;
  sections?: {
    definition?: string;
    formula?: string | Record<string, unknown>;
    rules?: { case?: string; rule?: string; example?: string }[];
    usage?: { icon?: string; label: string; en: string; vi: string }[];
    mistakes?: { wrong: string; right: string; why: string }[];
    tips?: string[];
  };
}

function cleanText(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

function run() {
  const assetsData: Record<string, AssetEntry[]> = JSON.parse(fs.readFileSync(ASSETS_PATH, 'utf8'));
  const topicSlugs = Object.keys(assetsData);

  console.log(`Processing ${topicSlugs.length} topics in assets manifest...`);

  let totalEnriched = 0;

  for (const slug of topicSlugs) {
    const lessonFile = path.join(OUT_DIR, `${slug}.json`);
    if (!fs.existsSync(lessonFile)) {
      throw new Error(`Missing topic JSON file: ${lessonFile}`);
    }

    const lesson: TopicLesson = JSON.parse(fs.readFileSync(lessonFile, 'utf8'));
    const usageList = lesson.sections?.usage || [];
    const mistakesList = lesson.sections?.mistakes || [];
    const rulesList = lesson.sections?.rules || [];
    const formulaStr = typeof lesson.sections?.formula === 'string' ? lesson.sections.formula : '';

    const currentAssets = assetsData[slug];

    for (let i = 0; i < currentAssets.length; i++) {
      const asset = currentAssets[i];
      const usage = usageList[i] || usageList[i % usageList.length] || {
        label: lesson.title_vi,
        en: lesson.title,
        vi: lesson.title_vi,
      };

      const mistake = mistakesList[i] || mistakesList[i % mistakesList.length];
      const ruleItem = rulesList[i] || rulesList[i % rulesList.length];

      // Formulate target rule
      let ruleText = '';
      if (ruleItem && ruleItem.rule) {
        ruleText = ruleItem.case
          ? `${lesson.title_vi} (${ruleItem.case}): ${ruleItem.rule}`
          : `${lesson.title_vi}: ${ruleItem.rule}`;
      } else if (formulaStr) {
        ruleText = `${lesson.title_vi} — Công thức: ${formulaStr}`;
      } else {
        ruleText = `${lesson.title_vi} — ${usage.label}`;
      }

      // Formulate context reason
      const contextReason = cleanText(
        `Trong tình huống này, người nói diễn đạt "${usage.vi}". ` +
        `Cấu trúc "${usage.label}" của chủ điểm ${lesson.title_vi} được lựa chọn nhằm phản ánh chuẩn xác ` +
        `hoàn cảnh giao tiếp thực tế và tuân thủ chặt chẽ trật tự cú pháp tiếng Anh.`
      );

      // Formulate common mistake
      let commonMistake = '';
      if (mistake && mistake.wrong && mistake.right) {
        commonMistake = cleanText(
          `Tránh lỗi dùng sai dạng "${mistake.wrong}" thay vì "${mistake.right}". ${mistake.why}`
        );
      } else {
        commonMistake = cleanText(
          `Cần chú ý chia đúng dạng từ và tránh dịch máy từng từ (word-by-word) làm sai cấu trúc ngữ pháp.`
        );
      }

      // Caption
      const caption = cleanText(
        `"${usage.en}" (${usage.vi}) — Tình huống: ${usage.label.toLowerCase()}.`
      );

      // Image alt
      const imageAlt = `${lesson.title} - ${usage.label}: ${usage.en}`;

      asset.imageAlt = imageAlt;
      asset.caption = caption;
      asset.usageAnalysisVi = {
        rule: cleanText(ruleText),
        contextReason,
        commonMistake,
      };

      totalEnriched++;
    }
  }

  // Write back to ASSETS_PATH
  fs.writeFileSync(ASSETS_PATH, JSON.stringify(assetsData, null, 2) + '\n', 'utf8');
  console.log(`Successfully enriched ${totalEnriched} visual assets across ${topicSlugs.length} topics.`);
}

run();
