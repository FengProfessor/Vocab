import fs from 'fs';
import path from 'path';

export const STANDARDIZED_TIPS: Record<string, string> = {
  // STAGE 1: FOUNDATION (A0 - A1)
  'personal-pronouns': 'Trước động từ dùng chủ ngữ (I, he, she); sau động từ hoặc giới từ dùng tân ngữ (me, him, her).',
  'verb-to-be': 'I đi với am; một người hoặc vật đi với is; nhiều người hoặc you/we/they đi với are.',
  'demonstratives': 'Ở gần: this (một), these (nhiều). Ở xa: that (một), those (nhiều).',
  'possessives': 'Có danh từ phía sau dùng my/your/her; đứng một mình không có danh từ dùng mine/yours/hers.',
  'plural-nouns': 'Đa số thêm -s. Tận cùng s, sh, ch, x, z thêm -es. Từ đặc biệt: child → children, person → people.',
  'adjectives-basic': 'Tính từ luôn đứng TRƯỚC danh từ (a red apple) hoặc đứng SAU to be (she is happy).',
  'there-is-there-are': 'Nói "có": There is cho một vật hoặc chất lỏng/bột; There are cho từ hai vật trở lên.',
  'articles': 'Chưa biết: dùng a/an (an đi với nguyên âm u, e, o, a, i). Đã biết rõ hoặc duy nhất: dùng the.',
  'present-simple': 'He, she, it động từ thêm -s/-es. Khi đã có does hoặc doesn\'t, động từ trở về nguyên mẫu.',
  'have-got': 'He, she, it dùng has got; còn lại dùng have got. Phủ định thêm not: haven\'t/hasn\'t got.',
  'wh-questions': 'Công thức câu hỏi: Từ hỏi (What/Where/When) + trợ động từ (do/does/is/are) + chủ ngữ + động từ chính.',
  'adverbs-frequency': 'Always, usually, often đứng TRƯỚC động từ thường, nhưng đứng SAU to be (am/is/are).',
  'present-continuous': 'Đang xảy ra: S + am/is/are + V-ing. Nhớ đủ cả to be và đuôi -ing.',
  'prepositions-place': 'In: ở trong không gian kín/thành phố; On: trên bề mặt; At: tại điểm hẹn cụ thể.',
  'imperatives': 'Ra lệnh hay hướng dẫn: bắt đầu bằng động từ nguyên mẫu. Cấm đoán: dùng Don\'t + V.',
  'modals-ability': 'Can (hiện tại) và could (quá khứ) nói về khả năng. Sau can/could luôn là động từ nguyên mẫu.',

  // STAGE 2: ELEMENTARY (A2)
  'countable-uncountable': 'Đếm được có số nhiều (books, apples); không đếm được không thêm -s và luôn dùng số ít (water, money).',
  'quantifiers': 'Some (khẳng định), any (phủ định/câu hỏi). Many/few cho đếm được; much/little cho không đếm được.',
  'prepositions-time': 'Tam giác thời gian: In mùa/năm/tháng; On ngày/thứ; At giờ giấc chính xác.',
  'past-simple': 'Đã xong trong quá khứ: thêm -ed hoặc dùng cột 2. Khi mượn did/didn\'t, động từ về nguyên mẫu.',
  'past-continuous': 'Hành động đang diễn ra tại mốc quá khứ: was/were + V-ing. Cắt ngang dùng When (quá khứ đơn).',
  'be-going-to': 'Đã lên kế hoạch từ trước hoặc có dấu hiệu rõ ràng: dùng am/is/are + going to + V.',
  'future-will': 'Quyết định ngay lúc nói, lời hứa hoặc dự đoán cảm tính: dùng will + V nguyên mẫu.',
  'comparatives-superlatives': 'So sánh hơn: thêm -er than hoặc more than. So sánh nhất: the -est hoặc the most.',
  'modals-permission': 'Xin phép hoặc nhờ vả: Can I (thân mật), Could you / May I (lịch sự hơn) + V.',
  'modals-obligation': 'Must: tự bản thân thấy nhất định phải làm. Have to: quy định, luật lệ bên ngoài bắt buộc làm.',
  'modals-advice': 'Khuyên nên làm gì: should + V. Khuyên không nên làm: shouldn\'t + V.',
  'conditionals-0-1': 'Loại 0 (chân lý): If hiện tại, hiện tại. Loại 1 (có thể xảy ra): If hiện tại, will + V.',

  // STAGE 3: INTERMEDIATE (B1)
  'used-to': 'Used to + V: từng làm trong quá khứ nay đã bỏ. Be/get used to + V-ing: đã quen với việc gì.',
  'present-perfect': 'Nối quá khứ với hiện tại: have/has + V3/ed. Dấu hiệu: since (mốc), for (khoảng), already, yet.',
  'conjunctions-linking': 'Although / Because đi với mệnh đề (S + V); Despite / Because of đi với cụm danh từ hoặc V-ing.',
  'present-perfect-continuous': 'Nhấn mạnh hành động kéo dài liên tục từ quá khứ đến nay: have/has been + V-ing.',
  'phrasal-verbs': 'Động từ ghép giới từ mang nghĩa hoàn toàn mới; nếu là đại từ (it/them), đặt ở giữa (turn it off).',
  'past-perfect': 'Hành động xảy ra TRƯỚC một hành động khác trong quá khứ: had + V3/ed (xảy ra sau dùng quá khứ đơn).',
  'future-continuous': 'Đang diễn ra tại một giờ cụ thể trong tương lai: will be + V-ing (At 8 PM tomorrow).',
  'passive-voice': 'Bị động: chủ ngữ nhận tác động. Công thức cốt lõi: Be (chia theo thì) + V3/ed.',
  'gerunds-infinitives': 'Thích/ghét/tránh/tận hưởng (enjoy, avoid): V-ing. Mong muốn/quyết định (want, decide, hope): to V.',
  'reported-speech': 'Kể lại lời người khác: lùi một thì về quá khứ, đổi đại từ và trạng từ thời gian/nơi chốn.',
  'relative-clauses': 'Who (thay người), which (thay vật), với whose (sở hữu), where (nơi chốn), that (thay cả người và vật).',
  'question-tags': 'Nguyên tắc ngược dấu: vế trước khẳng định (+) thì đuôi phủ định (-); vế trước (-) thì đuôi (+).',
  'second-conditional': 'Giả định trái thực tế ở hiện tại: If + quá khứ đơn (to be dùng were), would + V.',
  'third-conditional': 'Tiếc nuối trái thực tế trong quá khứ: If + had V3/ed, would have + V3/ed.',
  'modals-deduction': 'Suy đoán hiện tại: Must be (chắc chắn đúng), Can\'t be (chắc chắn không), Might be (có thể).',

  // STAGE 4 & 5: UPPER-INTERMEDIATE (B2)
  'past-perfect-continuous': 'Nhấn mạnh khoảng thời gian kéo dài liên tục trước một mốc quá khứ: had been + V-ing.',
  'future-perfect': 'Sẽ hoàn thành xong TRƯỚC một thời điểm tương lai: will have + V3/ed (thường đi với By + mốc giờ).',
  'future-in-the-past': 'Nhìn về tương lai từ góc nhìn quá khứ: dùng would + V hoặc was/were going to + V.',
  'mixed-conditionals': 'Điều kiện quá khứ dẫn đến kết quả hiện tại: If + had V3, would + V (now).',
  'wish-if-only': 'Ước trái hiện tại lùi về quá khứ đơn; ước trái quá khứ lùi về had + V3.',
  'modals-perfect': 'Đánh giá việc quá khứ: should have V3 (lẽ ra nên làm), must have V3 (chắc hẳn đã làm).',
  'causative': 'Chủ động: have someone V / get someone to V. Bị động: have/get something V3/ed (nhờ làm cái gì).',
  'advanced-passive': 'Tin đồn, báo cáo khách quan: It is said that... hoặc S + is said to + V.',
  'advanced-relative-clauses': 'Lược bỏ đại từ quan hệ khi làm tân ngữ; đưa giới từ lên trước whom/which để tăng tính trang trọng.',
  'participle-clauses': 'Rút gọn câu cùng chủ ngữ: V-ing cho chủ động (Walking home...), V3/ed cho bị động (Built in 1990...).',
  'ellipsis-substitution': 'Tránh lặp từ: lược bỏ phần đã rõ, hoặc thay thế bằng so, neither, do, one/ones.',
  'subjunctive': 'Sau suggest, demand, vital, crucial that: chủ ngữ luôn đi với động từ nguyên mẫu không chia.',
  'emphasis-structures': 'Nhấn mạnh hành động: thêm do/does/did trước động từ nguyên mẫu (I do believe you).',
  'cleft-sentences': 'Nhấn mạnh chính ai/cái gì: It is/was + từ cần nhấn mạnh + that/who + phần còn lại.',
  'inversion': 'Đảo ngữ: Đưa từ phủ định (Never, Seldom, Not only) lên đầu thì đảo trợ động từ lên trước chủ ngữ.',
  'discourse-markers': 'Từ nối học thuật: Furthermore (thêm vào đó), However (tuy nhiên), Therefore (vì vậy) luôn có dấu phẩy ngăn cách.',
  'nominalisation': 'Đổi động từ thành danh từ (decide → decision) giúp câu văn học thuật, khách quan và trang trọng hơn.',
  'hedging-language': 'Nói dè dặt, khách quan: dùng seem, tend to, appear, likely thay vì khẳng định tuyệt đối 100%.',
  'grammatical-collocations': 'Học cụm từ đi liền giới từ thành thói quen: depend on, interested in, good at, insist on.',
};

const SYLLABUS_BOILERPLATE = 'Bài học tập trung vào ý nghĩa, cấu trúc và cách tránh lỗi dịch máy móc thường gặp ở người Việt. ';

function main() {
  const dir = path.join(process.cwd(), 'scripts/grammar-gen/out');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  let updatedCount = 0;
  let wordCountViolations = 0;

  for (const [slug, tip] of Object.entries(STANDARDIZED_TIPS)) {
    const wordCount = tip.trim().split(/\s+/).length;
    if (wordCount > 25) {
      console.error(`[VIOLATION] Tip for ${slug} exceeds 25 words: ${wordCount} words! "${tip}"`);
      wordCountViolations++;
    }

    const filePath = path.join(dir, `${slug}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`[WARNING] File not found: ${filePath}`);
      continue;
    }

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!raw.sections) raw.sections = {};

    // Standardize tip
    raw.sections.tips = tip;

    // Purge syllabus boilerplate if present
    if (raw.sections.definition && typeof raw.sections.definition === 'string') {
      raw.sections.definition = raw.sections.definition.replace(SYLLABUS_BOILERPLATE, '').trim();
    }

    fs.writeFileSync(filePath, JSON.stringify(raw, null, 2), 'utf8');
    updatedCount++;
  }

  console.log(`[SUCCESS] Synchronized ${updatedCount} grammar topic JSON caches.`);
  console.log(`[VERIFICATION] Word count violations: ${wordCountViolations}/62.`);
}

main();
