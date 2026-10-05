import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1).trim();
      process.env[m[1].trim()] = v;
    }
  }
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const translations: Record<string, string> = {
  "06bf5ffb-0dc5-48d4-a67d-bd0b424b6932": "Chúng tôi đã ăn cá tươi cho bữa tối.",
  "0b33dbbe-fb65-4f3a-8048-b20f854c1382": "Ngày mai chúng ta hãy gặp nhau đi ăn trưa nhé.",
  "1855763e-3caf-4889-9eca-bcbcf7c7f667": "Tôi hiểu ý bạn, nhưng tôi không đồng ý.",
  "1d18da9c-7e0a-47ea-acfa-40cb203f6b0b": "Ứng dụng từ \"snack\" (đồ ăn vặt) trong giao tiếp hàng ngày.",
  "2f63bb67-4e91-45d8-8d38-c7730ad7596e": "Tôi thích đọc sách.",
  "3132b57b-576b-48d0-a9c4-18f8284ab055": "Anh ấy đã ăn một quả trứng luộc cho bữa sáng.",
  "4c0c2a99-231d-418c-a9e4-18bb57d4e581": "Bạn có kế hoạch gì cho cuối tuần này không?",
  "5e163bb9-4385-418b-8bb1-7e9df83f96d3": "Tôi thường ăn bánh mì kẹp bơ vào bữa sáng.",
  "61f774a3-98d7-467f-a262-9f0517771a9f": "Anh ấy không ăn thịt vì anh ấy là người ăn chay.",
  "643b648a-df55-437a-9261-01629675e38b": "Tôi không biết cô ấy sống ở đâu.",
  "669456ae-1925-42f4-a48c-e403e985f11e": "Ứng dụng từ \"noodle\" (mì) trong giao tiếp hàng ngày.",
  "778fa10a-c13f-4a76-b998-ae66a72a0f0a": "Bạn thường làm gì vào thời gian rảnh rỗi?",
  "7bedd67b-a128-42fe-ba5d-08c7e6400bc7": "Tôi cần một chút sự giúp đỡ.",
  "7c6155bb-6cd6-40d9-b52d-e3f9bc5a4cdc": "Tôi muốn trở thành một giáo viên trong tương lai.",
  "7d381026-d500-4a1c-b8c4-bb92235db7b6": "Lúa gạo là cây trồng chính ở vùng này.",
  "81453bd4-19dc-40a5-9e59-b0501fa07185": "Chúng tôi sẽ ăn gà nướng cho bữa tối.",
  "91aea318-0582-4f71-9fe8-b43cf1a4f2e7": "Chúng tôi thường ăn sáng cùng nhau lúc 7 giờ sáng.",
  "93bd092c-e742-4cd2-919d-a6addb738c90": "Hôm nay trông bạn rất mệt mỏi; bạn nên nghỉ ngơi đi.",
  "aacd9262-22fc-481a-b3ac-2f65173aaf8b": "Bạn muốn dùng thịt bò hay thịt gà cho món chính?",
  "ab19ecd9-3e15-46d0-b478-8fd319de3b29": "Chúng tôi sẽ cùng nhau ăn tối vào lúc 7 giờ.",
  "c0601e67-3655-451d-8659-dad953e2d1da": "Thức ăn ở nhà hàng này rất ngon.",
  "ccb2a32a-72e9-486b-9ed4-fc828cec5b54": "Cảm ơn bạn vì một bữa ăn tuyệt vời tối nay."
};

async function fix() {
  for (const [id, vi] of Object.entries(translations)) {
    const { error } = await sb.from('words').update({ example_vi: vi }).eq('id', id);
    if (error) console.error(`Error updating ${id}:`, error);
    else console.log(`Updated ${id} -> ${vi}`);
  }

  // Also insert into translations table
  for (const [id, vi] of Object.entries(translations)) {
    const { data: w } = await sb.from('words').select('example').eq('id', id).single();
    if (w?.example) {
      await sb.from('translations').upsert({
        source_hash: 'manual_' + id,
        source_text: w.example.trim(),
        target_lang: 'vi',
        translated_text: vi,
      }, { onConflict: 'source_hash' });
    }
  }

  console.log('Done fixing 22 words!');
}

fix();
