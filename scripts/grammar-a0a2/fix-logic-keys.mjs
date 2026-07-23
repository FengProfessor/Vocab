/**
 * Script: scripts/grammar-a0a2/fix-logic-keys.mjs
 * Auto-fix logic findings across all 62 grammar topics in Supabase.
 *
 * Usage: node scripts/grammar-a0a2/fix-logic-keys.mjs --apply
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found');
    process.exit(1);
  }
  const raw = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

const APPLY = process.argv.includes('--apply');

const REPLACEMENTS_FOR_META_JUNK = {
  'be-going-to': {
    type: 'mcq',
    q: 'Look at those dark clouds! It ___ rain soon.',
    opts: ['is going to', 'will', 'was'],
    answer: 'is going to',
    fb: 'Đúng là "is going to" vì diễn tả dự đoán có căn cứ/dấu hiệu rõ ràng ở hiện tại.',
  },
  'countable-uncountable': {
    type: 'mcq',
    q: 'I need some ___ for my new house.',
    opts: ['furniture', 'furnitures', 'a furniture'],
    answer: 'furniture',
    fb: 'Đúng là "furniture" vì furniture là danh từ không đếm được, không thêm -s và không dùng "a".',
  },
  'past-continuous': {
    type: 'mcq',
    q: 'While I ___ my homework, the phone rang.',
    opts: ['was doing', 'did', 'am doing'],
    answer: 'was doing',
    fb: 'Đúng là "was doing" vì chia quá khứ tiếp diễn cho hành động đang xảy ra thì có hành động khác cắt ngang.',
  },
  'present-simple': {
    type: 'mcq',
    q: 'She ___ to the gym every morning.',
    opts: ['goes', 'is going', 'go'],
    answer: 'goes',
    fb: 'Đúng là "goes" vì diễn tả thói quen lặp đi lặp lại ở hiện tại với chủ ngữ số ít She.',
  },
  'future-will': {
    type: 'mcq',
    q: 'Don\'t worry, I ___ help you with the heavy bags.',
    opts: ['will', 'am going to', 'was'],
    answer: 'will',
    fb: 'Đúng là "will" vì quyết định giúp đỡ bộc phát ngay tại thời điểm nói.',
  },
  'gerunds-infinitives': {
    type: 'mcq',
    q: 'Don\'t forget ___ the door before leaving.',
    opts: ['to lock', 'locking', 'lock'],
    answer: 'to lock',
    fb: 'Đúng là "to lock" vì forget to do something là nhớ cần phải làm gì trong tương lai.',
  },
  'possessives': {
    type: 'mcq',
    q: 'This coat belongs to me. It is ___.',
    opts: ['mine', 'my', 'me'],
    answer: 'mine',
    fb: 'Đúng là "mine" vì đại từ sở hữu đứng một mình thay thế cho tính từ sở hữu + danh từ.',
  },
  'used-to': {
    type: 'mcq',
    q: 'She ___ live in London when she was a child.',
    opts: ['used to', 'was used to', 'is used to'],
    answer: 'used to',
    fb: 'Đúng là "used to" vì diễn tả thói quen hoặc trạng thái trong quá khứ nay không còn nữa.',
  },
};

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  console.log(`🛠️ Starting Logic Keys Fixer (${APPLY ? 'APPLY MODE' : 'DRY RUN MODE'})...`);

  const { data: lessons, error } = await sb
    .from('grammar_lessons')
    .select('id, exercises, topic_id, topic:grammar_topics(slug, level, title_vi)');

  if (error) {
    console.error('❌ Error fetching lessons:', error);
    process.exit(1);
  }

  let totalFixed = 0;

  for (const L of lessons || []) {
    const slug = L.topic?.slug || 'unknown';
    const exercises = Array.isArray(L.exercises) ? [...L.exercises] : [];
    let updated = false;

    exercises.forEach((e, idx) => {
      const q = String(e.q || e.question || '').trim();
      const opts = (e.opts || e.options || []).map((o) => String(o).trim());

      // 1. Meta / Junk replace
      if (/which example fits/i.test(q) || opts.some((o) => /another incorrect|^another$/i.test(o)) || /Contrast focus/i.test(q)) {
        if (REPLACEMENTS_FOR_META_JUNK[slug]) {
          const rep = REPLACEMENTS_FOR_META_JUNK[slug];
          exercises[idx] = {
            type: rep.type,
            q: rep.q,
            opts: rep.opts,
            answer: rep.answer,
            fb: rep.fb,
          };
          console.log(`  ✓ Replaced meta junk item in [${slug} #${idx + 1}] -> "${rep.q}"`);
          updated = true;
          totalFixed++;
        }
      }

      // 2. Specific verb-to-be audit fixes
      if (slug === 'verb-to-be') {
        if (/They not is tired/i.test(q) && (e.type === 'error' || /Find the error/i.test(q))) {
          exercises[idx] = {
            type: 'error',
            q: 'Find the error: They not is tired.',
            opts: ['They are not tired.', 'They is not tired.', 'They not are tired.'],
            answer: 'They are not tired.',
            fb: 'Sai. They là chủ ngữ số nhiều đi với to be "are". Phủ định đúng: They are not tired (hoặc They aren\'t tired).',
          };
          console.log(`  ✓ Ensured clean repair for [verb-to-be #${idx + 1}] "They not is tired."`);
          updated = true;
          totalFixed++;
        }

        if (/Tom are happy/i.test(q) && (e.type === 'error' || /Find the error/i.test(q))) {
          exercises[idx] = {
            type: 'error',
            q: 'Find the error: Tom are happy.',
            opts: ['Tom is happy.', 'Tom are happy.', 'Tom am happy.'],
            answer: 'Tom is happy.',
            fb: 'Sai. Tom là tên riêng số ít nên đi với to be "is". Câu đúng: Tom is happy.',
          };
          console.log(`  ✓ Ensured clean repair for [verb-to-be #${idx + 1}] "Tom are happy."`);
          updated = true;
          totalFixed++;
        }

        if (/Is everyone OK/i.test(q) && e.type === 'tf') {
          exercises[idx] = {
            type: 'tf',
            q: '"Is everyone OK?" is correct.',
            answer: true,
            fb: 'Đúng. Everyone là đại từ bất định chỉ số ít nên động từ to be đi kèm là "Is" (Is everyone OK?).',
          };
          console.log(`  ✓ Ensured TF true for [verb-to-be #${idx + 1}] "Is everyone OK?"`);
          updated = true;
          totalFixed++;
        }
      }
    });

    if (updated && APPLY) {
      const { error: uErr } = await sb
        .from('grammar_lessons')
        .update({ exercises })
        .eq('id', L.id);

      if (uErr) {
        console.error(`❌ Failed to update lesson [${slug}]:`, uErr);
      } else {
        console.log(`  💾 Updated DB for lesson [${slug}]`);
      }
    }
  }

  if (APPLY) {
    // Clear quiz cache if table exists
    try {
      const { error: cErr } = await sb.from('grammar_quiz_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (cErr) {
        console.log(`ℹ️ grammar_quiz_cache clear skipped / not present (${cErr.message})`);
      } else {
        console.log(`  🧹 Cleared grammar_quiz_cache table.`);
      }
    } catch {
      /* ignore */
    }
  }

  console.log(`\n🎉 Total items fixed: ${totalFixed}`);
  if (!APPLY) {
    console.log(`ℹ️ Run with --apply to commit changes to Supabase.`);
  }
}

main().catch((err) => {
  console.error('❌ Error during fix:', err);
  process.exit(1);
});
