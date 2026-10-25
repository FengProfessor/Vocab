/**
 * Auto-Review Images Script
 * Chạy: cd web-app && npx tsx scripts/auto-review-images.ts
 */
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const HTML_FILE = path.resolve(process.cwd(), 'tmp-image-review.html');

interface Item {
  w: string; // word
  u: string; // url
  s: string; // source
  p: string; // pos
  d: string; // definition
  i: string; // ipa
}

// Bộ lọc heuristic nhận diện các ảnh sai ngữ cảnh hoặc dạng card chữ/định nghĩa từ điển
function getHeuristicMark(item: Item): 'bad' | 'meh' | null {
  const url = item.u.toLowerCase();
  const word = item.w.toLowerCase();
  const def = item.d.toLowerCase();

  // 1. Nhầm lẫn ngữ cảnh/thương hiệu/danh từ riêng
  if (word === 'accord' && (url.includes('cargurus') || url.includes('car') || url.includes('honda'))) {
    return 'bad'; // Nhầm xe Honda Accord
  }
  if (word === 'ally' && (url.includes('ally') || url.includes('bank') || url.includes('financial'))) {
    return 'bad'; // Nhầm ngân hàng Ally Financial
  }
  if (word === 'always' && (url.includes('pads') || url.includes('maxi-pad') || url.includes('always-pad') || url.includes('sanitary'))) {
    return 'bad'; // Nhầm nhãn hàng Always
  }
  if (word === 'access' && (url.includes('microsoft') || url.includes('database-management') || url.includes('office-365'))) {
    return 'bad'; // Nhầm logo Microsoft Access
  }
  if (word === 'ago' && (url.includes('singolo-ago') || url.includes('needle'))) {
    return 'bad'; // Tiếng Ý: ago = cây kim
  }
  if (word === 'amuse' && (url.includes('appetizer') || url.includes('bouche') || url.includes('food'))) {
    return 'bad'; // Nhầm món khai vị "amuse-bouche"
  }
  if (word === 'ambivalent' && (url.includes('slideshare') || url.includes('rlc-ghep-noi-tiep') || url.includes('mach-rlc'))) {
    return 'bad'; // Nhầm slide RLC circuit
  }
  if (word === 'also' && (url.includes('war') || url.includes('hormuz') || url.includes('geopolitical'))) {
    return 'bad'; // Trùng lặp ngẫu nhiên trong bài báo
  }
  if (word === 'almost' && (url.includes('knockoutstocks') || url.includes('ebook'))) {
    return 'bad'; // Ảnh bìa sách rác
  }
  if (word === 'able' && (url.includes('rip-red-able') || url.includes('cable') || url.includes('table'))) {
    return 'bad'; // Nhầm chữ / dây cáp
  }
  if (word === 'alive' && url.includes('twinkl')) {
    return 'bad'; // Nhầm flashcard học chữ trẻ em
  }
  if (word === 'affable' && url.includes('githubassets')) {
    return 'bad'; // Ảnh repo Github rác
  }
  if (word === 'amenable' && url.includes('scribdassets')) {
    return 'bad'; // Trang tài liệu Scribd
  }

  // 2. Định nghĩa từ điển / Thẻ chữ thay vì hình ảnh thực tế
  // Các ảnh từ Alamy/Shutterstock chỉ vẽ chữ của từ đó lên
  if (url.includes('alamy.com/comp/') && url.includes('-word-')) {
    return 'bad'; // Chữ trên ảnh Alamy
  }
  if (url.includes('shutterstock.com') && (url.includes('word-dictionary') || url.includes('definition-of-word') || url.includes('concept-definition') || url.includes('dictionary-concept'))) {
    return 'bad'; // Thẻ chữ của Shutterstock
  }
  if (url.includes('dreamstime.com') && (url.includes('word-dictionary') || url.includes('definition-of-word') || url.includes('concept-definition') || url.includes('dictionary-concept'))) {
    return 'bad'; // Thẻ chữ của Dreamstime
  }
  if (url.includes('istockphoto.com') && (url.includes('word-dictionary') || url.includes('definition-of-word') || url.includes('concept-definition') || url.includes('dictionary-concept'))) {
    return 'bad'; // Thẻ chữ của iStock
  }
  if (url.includes('grammarhow.com') || url.includes('assignmentbro.com')) {
    return 'bad'; // Bài giải ngữ pháp / ảnh bài tập
  }
  if (url.includes('wooden-blocks') || url.includes('wooden-sign') || url.includes('wooden-word')) {
    return 'meh'; // Thẻ chữ xếp từ gỗ (hơi chán nhưng tạm dùng nếu không có ảnh)
  }

  // Bẫy tổng quát cho ảnh dạng stock card (ví dụ: shutterstock.com/image-photo/absence-260nw-555136312.jpg)
  const stockSites = ['shutterstock', 'alamy', 'dreamstime', 'istock', 'gettyimages', 'freepik', '123rf', 'depositphotos'];
  if (stockSites.some(site => url.includes(site))) {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1]; // e.g. "absence-260nw-555136312.jpg"
    const cleanFileName = lastPart.replace(/\.[a-z0-9]+$/i, ''); // e.g. "absence-260nw-555136312"
    
    // Tách các từ trong tên file
    const wordsInFile = cleanFileName
      .split(/[^a-z]+/i)
      .filter(w => w && !/^[0-9]+$/.test(w) && !['nw', 'w', 'jpg', 'jpeg', 'png', 'is', 'k', 'c', 's', 'id', 'photo', 'image', 'vector', 'stock', 'comp'].includes(w.toLowerCase()));

    // Nếu tên mô tả file chỉ chứa đúng 1 từ và từ đó chính là từ vựng đang xét
    if (wordsInFile.length === 0 || (wordsInFile.length === 1 && wordsInFile[0].toLowerCase() === word)) {
      return 'bad';
    }

    // Nếu chứa các từ khóa chỉ thẻ chữ định nghĩa từ điển
    const textCardKeywords = ['word', 'vocabulary', 'illustration', 'definition', 'concept', 'dictionary', 'alphabet', 'font', 'sign', 'text', 'handwritten', 'write', 'letter', 'letters'];
    if (wordsInFile.some(w => textCardKeywords.includes(w.toLowerCase()))) {
      return 'bad';
    }
  }

  // 3. File PDF hoặc văn bản
  if (url.includes('suncatcherstudio.com') && url.includes('chart')) {
    return 'meh'; // Bảng biểu toán học rỗng
  }

  return null;
}

async function checkUrlStatus(url: string): Promise<boolean> {
  try {
    const res = await axios.head(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 4000,
    });
    return res.status >= 200 && res.status < 400;
  } catch (err) {
    // Nếu HEAD lỗi, thử lại bằng GET với giới hạn Range để tiết kiệm băng thông
    try {
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Range: 'bytes=0-1024',
        },
        timeout: 4000,
      });
      return res.status >= 200 && res.status < 300;
    } catch {
      return false;
    }
  }
}

async function main() {
  console.log('=== KHỞI ĐẦU ĐÁNH GIÁ ẢNH TỰ ĐỘNG ===');
  if (!fs.existsSync(HTML_FILE)) {
    console.error(`Không tìm thấy file: ${HTML_FILE}`);
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(HTML_FILE, 'utf-8');
  
  // Tìm mảng ITEMS trong file HTML
  const match = htmlContent.match(/const ITEMS = (\[[\s\S]*?\]);/);
  if (!match) {
    console.error('Không thể tìm thấy mảng ITEMS trong file HTML.');
    process.exit(1);
  }

  const items: Item[] = JSON.parse(match[1]);
  console.log(`Đã đọc ${items.length} từ vựng từ file HTML.`);

  const marks: Record<string, 'ok' | 'bad' | 'meh'> = {};
  let heuristicBadCount = 0;
  let heuristicMehCount = 0;

  // Bước 1: Áp dụng Heuristics
  for (const item of items) {
    const mark = getHeuristicMark(item);
    if (mark === 'bad') {
      marks[item.w] = 'bad';
      heuristicBadCount++;
    } else if (mark === 'meh') {
      marks[item.w] = 'meh';
      heuristicMehCount++;
    }
  }
  console.log(`[Heuristic] Phát hiện ${heuristicBadCount} ảnh SAI ❌, ${heuristicMehCount} ảnh TẠM 🤔`);

  // Bước 2: Kiểm tra liên kết mạng (kiểm tra các ảnh chưa bị đánh bad/meh)
  const uncheckedItems = items.filter(it => !marks[it.w]);
  console.log(`[Network] Đang kiểm tra trạng thái liên kết của ${uncheckedItems.length} ảnh...`);

  const CONCURRENCY_LIMIT = 50;
  let activeRequests = 0;
  let checkedCount = 0;
  let networkBadCount = 0;

  const runCheck = async (item: Item) => {
    const isAlive = await checkUrlStatus(item.u);
    checkedCount++;
    if (!isAlive) {
      marks[item.w] = 'bad';
      networkBadCount++;
    }
    
    if (checkedCount % 200 === 0 || checkedCount === uncheckedItems.length) {
      console.log(`  Đã check ${checkedCount}/${uncheckedItems.length} links (Phát hiện thêm ${networkBadCount} ảnh chết)`);
    }
  };

  // Sử dụng hàng đợi để giới hạn concurrency
  const queue = [...uncheckedItems];
  const promises: Promise<void>[] = [];

  const worker = async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item) {
        await runCheck(item);
      }
    }
  };

  for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
    promises.push(worker());
  }
  await Promise.all(promises);

  // Mặc định những ảnh còn lại là ok
  for (const item of items) {
    if (!marks[item.w]) {
      marks[item.w] = 'ok';
    }
  }

  // Thống kê kết quả
  let ok = 0, bad = 0, meh = 0;
  for (const w in marks) {
    if (marks[w] === 'ok') ok++;
    else if (marks[w] === 'bad') bad++;
    else if (marks[w] === 'meh') meh++;
  }

  console.log('\n=== KẾT QUẢ ĐÁNH GIÁ ===');
  console.log(`  ✅ Đúng (OK): ${ok}`);
  console.log(`  ❌ Sai (BAD): ${bad} (Heuristic: ${heuristicBadCount}, Chết/404: ${networkBadCount})`);
  console.log(`  🤔 Tạm (MEH): ${meh}`);
  console.log(`  Tổng số: ${items.length}`);

  // Cập nhật kết quả vào file HTML
  // Tìm khối định nghĩa `let marks = ...` trong HTML và thay thế bằng kết quả mới của chúng ta
  const marksString = JSON.stringify(marks, null, 2);
  const updatedHtml = htmlContent.replace(
    /let marks = JSON\.parse\(localStorage\.getItem\(LS_KEY\) \|\| (?:'\{\}'|`[\s\S]*?`)\);/,
    `let marks = JSON.parse(localStorage.getItem(LS_KEY) || \`${marksString.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);`
  );

  fs.writeFileSync(HTML_FILE, updatedHtml, 'utf-8');
  console.log(`\nĐã cập nhật marks vào file: ${HTML_FILE}`);
}

main().catch(err => {
  console.error('Lỗi chạy script:', err);
  process.exit(1);
});
