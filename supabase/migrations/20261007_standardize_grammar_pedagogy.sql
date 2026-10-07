-- Migration: 20261007_standardize_grammar_pedagogy.sql
-- Description: Standardize all 62 Golden Memory Tips (<= 25 words) and purge academic syllabus boilerplate.

BEGIN;

-- Helper to safely update tips in grammar_lessons JSONB joined with grammar_topics
CREATE OR REPLACE FUNCTION update_grammar_tip(p_slug TEXT, p_tip TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.grammar_lessons l
  SET sections = jsonb_set(
    COALESCE(l.sections, '{}'::jsonb),
    '{tips}',
    to_jsonb(p_tip)
  )
  FROM public.grammar_topics t
  WHERE l.topic_id = t.id AND t.slug = p_slug;
END;
$$ LANGUAGE plpgsql;

-- 1. STAGE 1: FOUNDATION (A0 - A1)
SELECT update_grammar_tip('personal-pronouns', 'Trước động từ dùng chủ ngữ (I, he, she); sau động từ hoặc giới từ dùng tân ngữ (me, him, her).');
SELECT update_grammar_tip('verb-to-be', 'I đi với am; một người hoặc vật đi với is; nhiều người hoặc you/we/they đi với are.');
SELECT update_grammar_tip('demonstratives', 'Ở gần: this (một), these (nhiều). Ở xa: that (một), those (nhiều).');
SELECT update_grammar_tip('possessives', 'Có danh từ phía sau dùng my/your/her; đứng một mình không có danh từ dùng mine/yours/hers.');
SELECT update_grammar_tip('plural-nouns', 'Đa số thêm -s. Tận cùng s, sh, ch, x, z thêm -es. Từ đặc biệt: child → children, person → people.');
SELECT update_grammar_tip('adjectives-basic', 'Tính từ luôn đứng TRƯỚC danh từ (a red apple) hoặc đứng SAU to be (she is happy).');
SELECT update_grammar_tip('there-is-there-are', 'Nói "có": There is cho một vật hoặc chất lỏng/bột; There are cho từ hai vật trở lên.');
SELECT update_grammar_tip('articles', 'Chưa biết: dùng a/an (an đi với nguyên âm u, e, o, a, i). Đã biết rõ hoặc duy nhất: dùng the.');
SELECT update_grammar_tip('present-simple', 'He, she, it động từ thêm -s/-es. Khi đã có does hoặc doesn''t, động từ trở về nguyên mẫu.');
SELECT update_grammar_tip('have-got', 'He, she, it dùng has got; còn lại dùng have got. Phủ định thêm not: haven''t/hasn''t got.');
SELECT update_grammar_tip('wh-questions', 'Công thức câu hỏi: Từ hỏi (What/Where/When) + trợ động từ (do/does/is/are) + chủ ngữ + động từ chính.');
SELECT update_grammar_tip('adverbs-frequency', 'Always, usually, often đứng TRƯỚC động từ thường, nhưng đứng SAU to be (am/is/are).');
SELECT update_grammar_tip('present-continuous', 'Đang xảy ra: S + am/is/are + V-ing. Nhớ đủ cả to be và đuôi -ing.');
SELECT update_grammar_tip('prepositions-place', 'In: ở trong không gian kín/thành phố; On: trên bề mặt; At: tại điểm hẹn cụ thể.');
SELECT update_grammar_tip('imperatives', 'Ra lệnh hay hướng dẫn: bắt đầu bằng động từ nguyên mẫu. Cấm đoán: dùng Don''t + V.');
SELECT update_grammar_tip('modals-ability', 'Can (hiện tại) và could (quá khứ) nói về khả năng. Sau can/could luôn là động từ nguyên mẫu.');

-- 2. STAGE 2: ELEMENTARY (A2)
SELECT update_grammar_tip('countable-uncountable', 'Đếm được có số nhiều (books, apples); không đếm được không thêm -s và luôn dùng số ít (water, money).');
SELECT update_grammar_tip('quantifiers', 'Some (khẳng định), any (phủ định/câu hỏi). Many/few cho đếm được; much/little cho không đếm được.');
SELECT update_grammar_tip('prepositions-time', 'Tam giác thời gian: In mùa/năm/tháng; On ngày/thứ; At giờ giấc chính xác.');
SELECT update_grammar_tip('past-simple', 'Đã xong trong quá khứ: thêm -ed hoặc dùng cột 2. Khi mượn did/didn''t, động từ về nguyên mẫu.');
SELECT update_grammar_tip('past-continuous', 'Hành động đang diễn ra tại mốc quá khứ: was/were + V-ing. Cắt ngang dùng When (quá khứ đơn).');
SELECT update_grammar_tip('be-going-to', 'Đã lên kế hoạch từ trước hoặc có dấu hiệu rõ ràng: dùng am/is/are + going to + V.');
SELECT update_grammar_tip('future-will', 'Quyết định ngay lúc nói, lời hứa hoặc dự đoán cảm tính: dùng will + V nguyên mẫu.');
SELECT update_grammar_tip('comparatives-superlatives', 'So sánh hơn: thêm -er than hoặc more than. So sánh nhất: the -est hoặc the most.');
SELECT update_grammar_tip('modals-permission', 'Xin phép hoặc nhờ vả: Can I (thân mật), Could you / May I (lịch sự hơn) + V.');
SELECT update_grammar_tip('modals-obligation', 'Must: tự bản thân thấy nhất định phải làm. Have to: quy định, luật lệ bên ngoài bắt buộc làm.');
SELECT update_grammar_tip('modals-advice', 'Khuyên nên làm gì: should + V. Khuyên không nên làm: shouldn''t + V.');
SELECT update_grammar_tip('conditionals-0-1', 'Loại 0 (chân lý): If hiện tại, hiện tại. Loại 1 (có thể xảy ra): If hiện tại, will + V.');

-- 3. STAGE 3: INTERMEDIATE (B1)
SELECT update_grammar_tip('used-to', 'Used to + V: từng làm trong quá khứ nay đã bỏ. Be/get used to + V-ing: đã quen với việc gì.');
SELECT update_grammar_tip('present-perfect', 'Nối quá khứ với hiện tại: have/has + V3/ed. Dấu hiệu: since (mốc), for (khoảng), already, yet.');
SELECT update_grammar_tip('conjunctions-linking', 'Although / Because đi với mệnh đề (S + V); Despite / Because of đi với cụm danh từ hoặc V-ing.');
SELECT update_grammar_tip('present-perfect-continuous', 'Nhấn mạnh hành động kéo dài liên tục từ quá khứ đến nay: have/has been + V-ing.');
SELECT update_grammar_tip('phrasal-verbs', 'Động từ ghép giới từ mang nghĩa hoàn toàn mới; nếu là đại từ (it/them), đặt ở giữa (turn it off).');
SELECT update_grammar_tip('past-perfect', 'Hành động xảy ra TRƯỚC một hành động khác trong quá khứ: had + V3/ed (xảy ra sau dùng quá khứ đơn).');
SELECT update_grammar_tip('future-continuous', 'Đang diễn ra tại một giờ cụ thể trong tương lai: will be + V-ing (At 8 PM tomorrow).');
SELECT update_grammar_tip('passive-voice', 'Bị động: chủ ngữ nhận tác động. Công thức cốt lõi: Be (chia theo thì) + V3/ed.');
SELECT update_grammar_tip('gerunds-infinitives', 'Thích/ghét/tránh/tận hưởng (enjoy, avoid): V-ing. Mong muốn/quyết định (want, decide, hope): to V.');
SELECT update_grammar_tip('reported-speech', 'Kể lại lời người khác: lùi một thì về quá khứ, đổi đại từ và trạng từ thời gian/nơi chốn.');
SELECT update_grammar_tip('relative-clauses', 'Who (thay người), which (thay vật), với whose (sở hữu), where (nơi chốn), that (thay cả người và vật).');
SELECT update_grammar_tip('question-tags', 'Nguyên tắc ngược dấu: vế trước khẳng định (+) thì đuôi phủ định (-); vế trước (-) thì đuôi (+).');
SELECT update_grammar_tip('second-conditional', 'Giả định trái thực tế ở hiện tại: If + quá khứ đơn (to be dùng were), would + V.');
SELECT update_grammar_tip('third-conditional', 'Tiếc nuối trái thực tế trong quá khứ: If + had V3/ed, would have + V3/ed.');
SELECT update_grammar_tip('modals-deduction', 'Suy đoán hiện tại: Must be (chắc chắn đúng), Can''t be (chắc chắn không), Might be (có thể).');

-- 4. STAGE 4 & 5: UPPER-INTERMEDIATE (B2)
SELECT update_grammar_tip('past-perfect-continuous', 'Nhấn mạnh khoảng thời gian kéo dài liên tục trước một mốc quá khứ: had been + V-ing.');
SELECT update_grammar_tip('future-perfect', 'Sẽ hoàn thành xong TRƯỚC một thời điểm tương lai: will have + V3/ed (thường đi với By + mốc giờ).');
SELECT update_grammar_tip('future-in-the-past', 'Nhìn về tương lai từ góc nhìn quá khứ: dùng would + V hoặc was/were going to + V.');
SELECT update_grammar_tip('mixed-conditionals', 'Điều kiện quá khứ dẫn đến kết quả hiện tại: If + had V3, would + V (now).');
SELECT update_grammar_tip('wish-if-only', 'Ước trái hiện tại lùi về quá khứ đơn; ước trái quá khứ lùi về had + V3.');
SELECT update_grammar_tip('modals-perfect', 'Đánh giá việc quá khứ: should have V3 (lẽ ra nên làm), must have V3 (chắc hẳn đã làm).');
SELECT update_grammar_tip('causative', 'Chủ động: have someone V / get someone to V. Bị động: have/get something V3/ed (nhờ làm cái gì).');
SELECT update_grammar_tip('advanced-passive', 'Tin đồn, báo cáo khách quan: It is said that... hoặc S + is said to + V.');
SELECT update_grammar_tip('advanced-relative-clauses', 'Lược bỏ đại từ quan hệ khi làm tân ngữ; đưa giới từ lên trước whom/which để tăng tính trang trọng.');
SELECT update_grammar_tip('participle-clauses', 'Rút gọn câu cùng chủ ngữ: V-ing cho chủ động (Walking home...), V3/ed cho bị động (Built in 1990...).');
SELECT update_grammar_tip('ellipsis-substitution', 'Tránh lặp từ: lược bỏ phần đã rõ, hoặc thay thế bằng so, neither, do, one/ones.');
SELECT update_grammar_tip('subjunctive', 'Sau suggest, demand, vital, crucial that: chủ ngữ luôn đi với động từ nguyên mẫu không chia.');
SELECT update_grammar_tip('emphasis-structures', 'Nhấn mạnh hành động: thêm do/does/did trước động từ nguyên mẫu (I do believe you).');
SELECT update_grammar_tip('cleft-sentences', 'Nhấn mạnh chính ai/cái gì: It is/was + từ cần nhấn mạnh + that/who + phần còn lại.');
SELECT update_grammar_tip('inversion', 'Đảo ngữ: Đưa từ phủ định (Never, Seldom, Not only) lên đầu thì đảo trợ động từ lên trước chủ ngữ.');
SELECT update_grammar_tip('discourse-markers', 'Từ nối học thuật: Furthermore (thêm vào đó), However (tuy nhiên), Therefore (vì vậy) luôn có dấu phẩy ngăn cách.');
SELECT update_grammar_tip('nominalisation', 'Đổi động từ thành danh từ (decide → decision) giúp câu văn học thuật, khách quan và trang trọng hơn.');
SELECT update_grammar_tip('hedging-language', 'Nói dè dặt, khách quan: dùng seem, tend to, appear, likely thay vì khẳng định tuyệt đối 100%.');
SELECT update_grammar_tip('grammatical-collocations', 'Học cụm từ đi liền giới từ thành thói quen: depend on, interested in, good at, insist on.');

-- 5. PURGE SYLLABUS META-FILLER IN TOPIC DEFINITIONS (9 topics)
UPDATE public.grammar_lessons
SET sections = jsonb_set(
  sections,
  '{definition}',
  to_jsonb(REPLACE(
    sections->>'definition',
    'Bài học tập trung vào ý nghĩa, cấu trúc và cách tránh lỗi dịch máy móc thường gặp ở người Việt. ',
    ''
  ))
)
WHERE sections->>'definition' LIKE '%Bài học tập trung vào ý nghĩa, cấu trúc và cách tránh lỗi dịch máy móc thường gặp ở người Việt.%';

DROP FUNCTION update_grammar_tip(TEXT, TEXT);

COMMIT;
