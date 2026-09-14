const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function formatSectionTitle(rawTitle, idx) {
  if (!rawTitle) return `Khối kiến thức ${idx + 1}`;
  let text = rawTitle.trim();
  text = text.replace(/^#+\s*/, '');
  text = text.replace(/^[🟡🟢🔵🔴⚪⚫✦★⭐•\-\*\s]+/, '');
  text = text.replace(/^(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9](?:\s*[·:–—.-]\s*|\s+)/iu, '');
  text = text.replace(/^Phần\s+\d+[:\.\s–—\-]+/i, '');
  if (/^Nội dung cốt/i.test(text)) return 'Kiến thức cốt lõi';
  if (/^Bảng chốt Master/i.test(text)) return 'Bảng quy tắc Master';
  if (/^Bản chất ngôn ngữ/i.test(text)) return 'Bản chất ngôn ngữ & Ứng dụng';
  text = text.replace(/^(?:\d+[\.\)]\s*)+/, '');
  text = text.replace(/\*\*+/g, '');
  text = text.replace(/[:—–\-]+$/, '').trim();
  if (text.includes('Xương câu') || text.includes('S – V – O') || text.includes('S-V-O')) return 'Cấu trúc câu S – V – O';
  if (text.includes('Hòa hợp chủ ngữ') || text.includes('hòa hợp')) return 'Hòa hợp Chủ ngữ – Động từ';
  if (text.includes('phủ định') && text.includes('nghi vấn')) return 'Câu Phủ định & Nghi vấn';
  if (text.includes('chính tả') || text.includes('đuôi -s') || text.includes('-es')) return 'Quy tắc chính tả đuôi -s / -es';
  return text || `Khối kiến thức ${idx + 1}`;
}

async function simulateSections() {
  const { data: lessons } = await supabase.from('grammar_lessons').select('order_index, title, theory').order('order_index');
  for (const l of lessons) {
    console.log(`\n=== BUOI ${l.order_index}: ${l.title} ===`);
    const content = l.theory || '';
    const parts = content.split(/\n(?=#{2,3}\s+)/g);
    parts.forEach((p, idx) => {
      const lines = p.trim().split('\n');
      let rawTitle = lines[0].startsWith('## ') || lines[0].startsWith('### ') ? lines[0].replace(/^#{2,3}\s+/, '').trim() : `Khối kiến thức ${idx + 1}`;
      const title = formatSectionTitle(rawTitle, idx);
      console.log(`  [${idx + 1}] "${title}" (raw: "${rawTitle}")`);
    });
  }
}

simulateSections().catch(console.error);
