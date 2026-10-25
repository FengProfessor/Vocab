import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const raw = fs.readFileSync(path.resolve('.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

const ex = (en, vi, note) => ({ en, vi, note: note || 'Ví dụ lý thuyết mở rộng' });

export const FRESH_THEORY_EXAMPLES_R2 = {
  'future-in-the-past': [
    ex("We were going to attend the concert, but ticket sales were canceled.", "Chúng tôi đã định tham dự buổi hòa nhạc, nhưng việc bán vé đã bị hủy.", "Minh họa be going to trong quá khứ"),
    ex("She knew he would succeed in his research project.", "Cô ấy biết anh ấy sẽ thành công trong dự án nghiên cứu của mình.", "Minh họa would trong câu tường thuật quá khứ"),
  ],
  'imperatives': [
    ex("Mind the step when leaving the train.", "Hãy chú ý bước chân khi bước xuống tàu.", "Mệnh lệnh cảnh báo nhẹ nhàng"),
    ex("Don't forget to submit your report before noon.", "Đừng quên nộp báo cáo của bạn trước giữa trưa.", "Mệnh lệnh phủ định với Don't"),
  ],
  'reported-speech': [
    ex("He explained that he had missed the early morning bus.", "Anh ấy giải thích rằng anh ấy đã lỡ chuyến xe buýt sáng sớm.", "Lùi thì: past simple -> past perfect"),
    ex("The officer asked if anyone had seen the accident.", "Viên cảnh sát hỏi liệu có ai đã nhìn thấy vụ tai nạn không.", "Tường thuật câu hỏi Yes/No với if"),
  ],
  'emphasis-structures': [
    ex("It was in summer that they completed the building.", "Chính vào mùa hè họ mới hoàn thành tòa nhà.", "Cleft sentence nhấn mạnh thời gian"),
    ex("She does enjoy classical violin music.", "Cô ấy thực sự rất thích nhạc violin cổ điển.", "Nhấn mạnh động từ với does"),
  ],
  'grammatical-collocations': [
    ex("They are interested in exploring sustainable energy solutions.", "Họ quan tâm đến việc khám phá các giải pháp năng lượng bền vững.", "interested + in + V-ing"),
    ex("He apologized to the team for missing the deadline.", "Anh ấy đã xin lỗi cả đội vì lỡ hạn chót.", "apologize for + V-ing"),
  ],
  'used-to': [
    ex("I used to travel by train every weekend during college.", "Tôi từng đi du lịch bằng tàu hỏa mỗi cuối tuần thời đại học.", "used to chỉ thói quen cũ"),
    ex("She is quickly getting used to working night shifts.", "Cô ấy đang nhanh chóng quen dần với việc làm ca đêm.", "get used to + V-ing"),
  ],
  'inversion': [
    ex("Rarely does one meet such a dedicated teacher.", "Hiếm khi người ta gặp được một giáo viên tận tụy đến vậy.", "Inversion với Rarely + does + S + V"),
    ex("Only after the storm ended did we assess the damage.", "Chỉ sau khi cơn bão kết thúc chúng tôi mới đánh giá thiệt hại.", "Only after... did + S + V"),
  ],
  'ellipsis-substitution': [
    ex("Are you going to the conference? — I hope to.", "Bạn có đi dự hội thảo không? — Tôi hy vọng là có.", "Lược bỏ động từ sau to-infinitive"),
    ex("She wanted a blue coffee mug, but got a green one.", "Cô ấy muốn một chiếc cốc cà phê màu xanh dương nhưng lại nhận được một chiếc màu xanh lá.", "Dùng one thay cho danh từ"),
  ],
  'present-perfect': [
    ex("They have lived in this coastal town since 2015.", "Họ đã sống ở thị trấn ven biển này từ năm 2015.", "Present Perfect với since"),
    ex("Has he ever tried traditional Vietnamese noodle soup?", "Anh ấy đã từng ăn thử món phở truyền thống Việt Nam chưa?", "Câu hỏi kinh nghiệm với ever"),
  ],
  'discourse-markers': [
    ex("Moreover, renewable solar power reduces electricity costs.", "Hơn nữa, năng lượng mặt trời tái tạo giúp giảm chi phí điện.", "Moreover = bổ sung thông tin trang trọng"),
    ex("On the whole, the annual results were satisfactory.", "Nhìn chung, kết quả hàng năm là hài lòng.", "On the whole = đánh giá tổng quan"),
  ],
  'third-conditional': [
    ex("If we had checked the map, we wouldn't have taken the wrong turn.", "Nếu chúng tôi kiểm tra bản đồ thì đã không đi nhầm ngã rẽ.", "Third Conditional: If + had V3, wouldn't have V3"),
    ex("Had she known about the seminar, she would have registered.", "Nếu cô ấy biết về buổi thảo luận thì cô ấy đã đăng ký rồi.", "Đảo ngữ Third Conditional"),
  ],
  'advanced-passive': [
    ex("The new highway is expected to open next month.", "Đường cao tốc mới dự kiến sẽ mở cửa vào tháng tới.", "Chủ ngữ giả / bị động với expected to V"),
    ex("His proposed plan was considered to be highly effective.", "Kế hoạch đề xuất của anh ấy được cho là rất hiệu quả.", "was considered to be + adj"),
  ],
  'modals-permission': [
    ex("May we leave our luggage in the hotel lobby?", "Chúng tôi có thể để hành lý ở sảnh khách sạn được không?", "Xin phép trang trọng với May we"),
    ex("You may not use recording devices inside the court.", "Bạn không được phép sử dụng thiết bị ghi âm trong tòa án.", "may not = cấm trang trọng"),
  ],
  'nominalisation': [
    ex("The sudden growth of the tech industry created many jobs.", "Sự tăng trưởng đột ngột của ngành công nghệ đã tạo ra nhiều việc làm.", "Danh từ hóa: grow -> growth"),
    ex("Regular maintenance ensures proper machine operation.", "Sự bảo trì đều đặn đảm bảo máy móc hoạt động tốt.", "maintain -> maintenance"),
  ],
  'conjunctions-linking': [
    ex("Despite the heavy snowfall, the flight departed on schedule.", "Bất chấp tuyết rơi dày, chuyến bay vẫn khởi hành đúng giờ.", "Despite + N"),
    ex("He arrived early so as to secure a front seat.", "Anh ấy đến sớm để đảm bảo có chỗ ngồi phía trước.", "so as to + V = nhằm mục đích"),
  ],
  'conditionals-0-1': [
    ex("If you freeze water, it turns into solid ice.", "Nếu bạn làm đông nước, nó biến thành đá rắn.", "Type 0: sự thật tự nhiên"),
    ex("If she submits her project today, she will receive feedback tomorrow.", "Nếu cô ấy nộp dự án hôm nay, cô ấy sẽ nhận phản hồi vào ngày mai.", "Type 1: khả năng tương lai"),
  ],
  'cleft-sentences': [
    ex("It was Mr. Jackson who organized the community clean-up.", "Chính là ông Jackson người đã tổ chức buổi dọn dẹp cộng đồng.", "Cleft sentence: It was X who..."),
    ex("All I need is a quiet corner to complete my reading.", "Tất cả những gì tôi cần là một góc yên tĩnh để đọc xong sách.", "All-cleft: All I need is..."),
  ],
  'causative': [
    ex("She had the technician inspect her computer system.", "Cô ấy đã nhờ kỹ thuật viên kiểm tra hệ thống máy tính.", "have somebody do something"),
    ex("We got the painters to redecorate our dining hall.", "Chúng tôi đã nhờ thợ sơn trang trí lại phòng ăn.", "get somebody to do something"),
  ],
  'quantifiers': [
    ex("There are plenty of options available on the menu.", "Có rất nhiều lựa chọn sẵn có trên thực đơn.", "plenty of + N"),
    ex("Neither of the candidates accepted the contract terms.", "Cả hai ứng viên đều không chấp nhận các điều khoản hợp đồng.", "Neither of + plural N"),
  ],
  'future-continuous': [
    ex("At noon tomorrow, our team will be testing the new engine.", "Vào giữa trưa mai, đội chúng tôi sẽ đang thử nghiệm động cơ mới.", "Future continuous: will be V-ing"),
    ex("Will you be taking your car to work this Friday?", "Bạn có dùng xe đi làm vào thứ Sáu này không?", "Hỏi lịch trình tương lai nhẹ nhàng"),
  ],
  'subjunctive': [
    ex("The committee insisted that the safety guidelines be followed.", "Ủy ban khăng khăng yêu cầu các hướng dẫn an toàn phải được tuân thủ.", "Subjunctive passive: be + V3"),
    ex("It is mandatory that every participant wear protective gear.", "Điều bắt buộc là mọi người tham gia phải đeo đồ bảo hộ.", "It is mandatory that + S + V_base"),
  ],
  'advanced-relative-clauses': [
    ex("The report, the conclusions of which were disputed, was published yesterday.", "Báo cáo mà các kết luận của nó bị tranh cãi đã được xuất bản hôm qua.", "the conclusions of which"),
    ex("She interviewed five applicants, two of whom met the requirements.", "Cô ấy đã phỏng vấn 5 ứng viên, hai người trong số họ đáp ứng yêu cầu.", "two of whom"),
  ],
  'relative-clauses': [
    ex("The scientist whose research won the award gave a speech.", "Nhà khoa học có nghiên cứu đoạt giải thưởng đã phát biểu.", "whose + N"),
    ex("The town hall where the meeting took place is very old.", "Tòa thị chính nơi cuộc họp diễn ra đã rất cổ kính.", "where = nơi chốn"),
  ],
  'past-continuous': [
    ex("I was revising my notes when the lights flickered.", "Tôi đang ôn lại ghi chú thì đèn nhấp nháy.", "was revising... when..."),
    ex("While we were walking by the river, it started to rain.", "Trong khi chúng tôi đang đi dạo bên sông thì trời bắt đầu mưa.", "While + were V-ing"),
  ],
  'phrasal-verbs': [
    ex("She carried on working despite feeling unwell.", "Cô ấy tiếp tục làm việc bất chấp cảm thấy không khỏe.", "carry on = tiếp tục"),
    ex("They decided to set up a new charitable organization.", "Họ quyết định thành lập một tổ chức từ thiện mới.", "set up = thành lập"),
  ],
  'past-perfect': [
    ex("By the time the conference began, all seats had been taken.", "Vào lúc hội thảo bắt đầu, tất cả chỗ ngồi đã được lấp đầy.", "had been V3"),
    ex("He had never traveled abroad before his business trip to Tokyo.", "Anh ấy chưa từng đi nước ngoài trước chuyến công tác Tokyo.", "had never V3"),
  ],
  'comparatives-superlatives': [
    ex("This solution is far more efficient than our previous attempt.", "Giải pháp này hiệu quả hơn nhiều so với lần thử trước của chúng tôi.", "far more + adj + than"),
    ex("Mount Everest is the highest mountain peak above sea level.", "Đỉnh Everest là đỉnh núi cao nhất so với mực nước biển.", "the highest"),
  ],
  'modals-advice': [
    ex("You had better save your progress before updating software.", "Tốt hơn hết bạn nên lưu tiến trình trước khi cập nhật phần mềm.", "had better + V_base"),
    ex("Citizens ought to report suspicious activities to the authorities.", "Công dân nên báo cáo các hoạt động nghi vấn cho chính quyền.", "ought to + V_base"),
  ],
  'participle-clauses': [
    ex("Having completed the experiment, the team published their findings.", "Sau khi hoàn thành thí nghiệm, đội nghiên cứu đã công bố các phát hiện.", "Having V3"),
    ex("Located on a hilltop, the castle overlooks the entire valley.", "Nằm trên đỉnh đồi, lâu đài nhìn ra toàn bộ thung lũng.", "V3 participle clause"),
  ],
  'adverbs-frequency': [
    ex("She is occasionally absent from the morning briefing.", "Cô ấy thỉnh thoảng vắng mặt trong buổi giao ban sáng.", "occasionally sau be"),
    ex("He seldom skips his daily fitness routine.", "Anh ấy hiếm khi bỏ qua thói quen thể dục hàng ngày.", "seldom trước động từ thường"),
  ],
  'future-will': [
    ex("I will drop by your office later to hand over the document.", "Tôi sẽ ghé qua văn phòng bạn sau để giao tài liệu.", "will bộc phát"),
    ex("Experts predict electric vehicles will dominate the market by 2035.", "Các chuyên gia dự đoán xe điện sẽ chi phối thị trường vào năm 2035.", "predict + will"),
  ],
  'question-tags': [
    ex("Nobody called while I was out, did they?", "Không ai gọi trong lúc tôi vắng mặt, đúng không?", "Nobody -> tag affirmative did they"),
    ex("You'd rather stay home tonight, wouldn't you?", "Bạn thà ở nhà tối nay hơn, đúng không?", "You'd rather -> wouldn't you"),
  ],
  'modals-perfect': [
    ex("She must have arrived by now; her flight landed an hour ago.", "Cô ấy chắc hẳn đã đến rồi; chuyến bay của cô ấy đáp từ một giờ trước.", "must have V3"),
    ex("You shouldn't have disclosed confidential details to strangers.", "Đáng lẽ bạn không nên tiết lộ chi tiết bảo mật cho người lạ.", "shouldn't have V3"),
  ],
  'past-perfect-continuous': [
    ex("The mechanics had been repairing the engine for three hours before finding the fault.", "Các thợ máy đã sửa động cơ suốt mười giờ trước khi tìm thấy lỗi.", "had been V-ing"),
    ex("Her feet were sore because she had been standing all day.", "Chân cô ấy bị đau vì cô ấy đã đứng suốt cả ngày.", "had been V-ing giải thích nguyên nhân"),
  ],
  'gerunds-infinitives': [
    ex("He admitted making a serious mistake in the budget calculation.", "Anh ấy đã thừa nhận phạm một lỗi nghiêm trọng trong tính toán ngân sách.", "admit + V-ing"),
    ex("She managed to resolve the customer dispute amicably.", "Cô ấy đã xoay xở giải quyết tranh chấp với khách hàng một cách êm đẹp.", "manage + to V"),
  ],
  'adjectives-basic': [
    ex("A valuable ancient bronze vase stood in the museum hall.", "Một chiếc bình đồng cổ có giá trị đứng ở sảnh bảo tàng.", "Trật tự OSASCOMP: opinion + age + material"),
    ex("The fresh bread smelled incredible.", "Ổ bánh mì tươi có mùi thật tuyệt vời.", "smell + adj (linking verb)"),
  ],
  'future-perfect': [
    ex("By the end of this month, we will have completed all software tests.", "Tính đến cuối tháng này, chúng tôi sẽ hoàn thành tất cả kiểm thử phần mềm.", "will have V3"),
    ex("Will they have restored the historic building by December?", "Họ sẽ phục chế xong tòa nhà lịch sử trước tháng 12 chứ?", "Will + S + have V3?"),
  ],
  'mixed-conditionals': [
    ex("If he had taken the early flight, he would be present at the meeting now.", "Nếu anh ấy đi chuyến bay sớm thì giờ anh ấy đã có mặt tại cuộc họp.", "Quá khứ -> Hiện tại: If + had V3, would V"),
    ex("If I were fluent in German, I would have accepted the transfer last year.", "Nếu tôi nói thạo tiếng Đức thì năm ngoái tôi đã nhận lời chuyển công tác.", "Bản chất hiện tại -> Hành động quá khứ: If + V2/were, would have V3"),
  ],
  'present-perfect-continuous': [
    ex("The team has been conducting research on this virus for months.", "Đội nghiên cứu đã tiến hành nghiên cứu về con virus này suốt nhiều tháng.", "has been V-ing"),
    ex("Why are your hands dirty? — I have been gardening.", "Tại sao tay bạn bị bẩn? — Tôi vừa mới làm vườn.", "has been V-ing hậu quả hiện tại"),
  ],
  'wh-questions': [
    ex("Which route offers the most scenic views of the coast?", "Tuyến đường nào mang lại tầm nhìn đẹp nhất ra bờ biển?", "Which + N as subject"),
    ex("Whose umbrella did you borrow during the storm?", "Chiếc ô của ai mà bạn đã mượn trong cơn bão?", "Whose + N + did + S + V?"),
  ],
  'modals-ability': [
    ex("He was able to escape from the burning building safely.", "Anh ấy đã có thể thoát khỏi tòa nhà đang cháy an toàn.", "was able to cho trường hợp cụ thể quá khứ"),
    ex("Will you be able to finish the report before 5 p.m.?", "Bạn sẽ có thể hoàn thành báo cáo trước 5 giờ chiều chứ?", "be able to tương lai"),
  ],
  'hedging-language': [
    ex("It appears that the market is recovering gradually.", "Có vẻ như thị trường đang dần phục hồi.", "It appears that..."),
    ex("The proposed strategy could arguably lead to higher revenue.", "Chiến lược đề xuất có thể cho là sẽ dẫn đến doanh thu cao hơn.", "could arguably + V"),
  ],
  'modals-deduction': [
    ex("He can't be at home right now because his lights are off.", "Anh ấy không thể đang ở nhà ngay lúc này vì đèn nhà anh ấy đã tắt.", "can't be hiện tại"),
    ex("They must be celebrating their victory given the loud cheering.", "Họ chắc hẳn đang ăn mừng chiến thắng với tiếng reo hò lớn.", "must be V-ing"),
  ],
  'second-conditional': [
    ex("If I won the national lottery, I would donate half to charity.", "Nếu tôi trúng xổ số quốc gia, tôi sẽ quyên góp một nửa cho từ thiện.", "If + V2, would V"),
    ex("If she had more free time, she would take up painting.", "Nếu cô ấy có nhiều thời gian rảnh hơn, cô ấy sẽ bắt đầu học vẽ.", "If + had, would V"),
  ],
  'modals-obligation': [
    ex("Passengers must keep their seatbelts fastened during takeoff.", "Hành khách phải thắt dây an toàn trong suốt quá trình cất cánh.", "must = quy định an toàn"),
    ex("You don't have to print the ticket; a digital code is sufficient.", "Bạn không cần phải in vé; mã kỹ thuật số là đủ rồi.", "don't have to"),
  ],
  'wish-if-only': [
    ex("I wish I could attend your graduation ceremony tomorrow.", "Tôi ước tôi có thể tham dự lễ tốt nghiệp của bạn ngày mai.", "Wish + could V"),
    ex("If only we had booked our hotel rooms earlier!", "Giá mà chúng tôi đặt phòng khách sạn sớm hơn!", "If only + had V3"),
  ],
  'prepositions-place': [
    ex("The pharmacy is situated right opposite the bus station.", "Nhà thuốc nằm ngay đối diện bến xe buýt.", "opposite + đối diện"),
    ex("She left her bag under the table in the cafeteria.", "Cô ấy để quên túi dưới bàn trong quán ăn tự phục vụ.", "under + dưới"),
  ],
  'passive-voice': [
    ex("The ancient documents are preserved in a climate-controlled room.", "Các tài liệu cổ được bảo quản trong một phòng kiểm soát khí hậu.", "are preserved"),
    ex("The new bridge will be inaugurated by the mayor next Monday.", "Cây cầu mới sẽ được khánh thành bởi thị trưởng vào thứ Hai tuần tới.", "will be inaugurated"),
  ],
  'prepositions-time': [
    ex("The gallery exhibition will run from April to June.", "Triển lãm phòng trưng bày sẽ diễn ra từ tháng Tư đến tháng Sáu.", "from... to..."),
  ],
};

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: topics, error: te } = await sb.from('grammar_topics').select('id, slug');
  if (te) throw te;
  const { data: lessons, error: le } = await sb.from('grammar_lessons').select('id, topic_id, examples');
  if (le) throw le;

  const topicById = Object.fromEntries(topics.map(t => [t.id, t]));
  let updatedCount = 0;

  for (const lesson of lessons) {
    const slug = topicById[lesson.topic_id]?.slug;
    if (!slug || !FRESH_THEORY_EXAMPLES_R2[slug]) continue;

    const existing = Array.isArray(lesson.examples) ? lesson.examples : [];
    const newItems = FRESH_THEORY_EXAMPLES_R2[slug];

    const existingStems = new Set(existing.map(e => (e.en || '').toLowerCase().trim()));
    const toAdd = newItems.filter(item => !existingStems.has((item.en || '').toLowerCase().trim()));

    if (toAdd.length > 0) {
      const merged = [...existing, ...toAdd];
      const { error } = await sb.from('grammar_lessons').update({ examples: merged }).eq('id', lesson.id);
      if (error) {
        console.error(`Error updating examples for ${slug}:`, error.message);
      } else {
        updatedCount++;
        console.log(`Updated ${slug}: ${existing.length} -> ${merged.length} examples (+${toAdd.length})`);
      }
    }
  }

  console.log(`\nPhase 2 Complete! Updated theory examples for ${updatedCount} topics.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
