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

const ex = (en, vi, note) => ({ en, vi, note: note || 'Ví dụ minh họa mở rộng' });

export const FRESH_THEORY_EXAMPLES = {
  'be-going-to': [
    ex('They are going to buy a new house next month.', 'Họ định mua một ngôi nhà mới vào tháng tới.', 'Kế hoạch đã quyết định trước'),
    ex('Look at the dark clouds — it is going to rain!', 'Nhìn mây đen kìa — trời sắp mưa rồi!', 'Dự đoán dựa trên bằng chứng hiện tại'),
    ex('Are you going to attend the seminar tomorrow?', 'Bạn có định tham dự buổi thảo luận ngày mai không?', 'Câu hỏi dự định'),
    ex('She is not going to change her mind.', 'Cô ấy sẽ không thay đổi ý định đâu.', 'Phủ định kế hoạch'),
  ],
  'prepositions-time': [
    ex('We usually go on vacation at Christmas.', 'Chúng tôi thường đi nghỉ vào dịp Giáng sinh.', 'at + dịp lễ'),
    ex('The concert starts in 10 minutes.', 'Buổi hòa nhạc sẽ bắt đầu trong 10 phút nữa.', 'in + khoảng thời gian tới'),
    ex('I will be busy from Monday to Wednesday.', 'Tôi sẽ bận từ thứ Hai đến thứ Tư.', 'from... to...'),
    ex('She has been living here since 2018.', 'Cô ấy sống ở đây từ năm 2018.', 'since + mốc bắt đầu'),
  ],
  'prepositions-place': [
    ex('The painting hangs on the living room wall.', 'Bức tranh treo trên tường phòng khách.', 'on + bề mặt'),
    ex('There is a small park behind our school.', 'Có một công viên nhỏ phía sau trường chúng tôi.', 'behind + phía sau'),
    ex('Please sit between your brother and your sister.', 'Hãy ngồi giữa anh bạn và chị bạn.', 'between A and B'),
    ex('She works in a bank at the city center.', 'Cô ấy làm việc ở một ngân hàng tại trung tâm thành phố.', 'in + không gian lớn / at + điểm cụ thể'),
  ],
  'adjectives-basic': [
    ex('The old wooden table sits in the corner.', 'Chiếc bàn gỗ cũ nằm ở góc phòng.', 'Trật tự tính từ OSASCOMP: tuổi tác + chất liệu'),
    ex('She bought a comfortable blue coat.', 'Cô ấy đã mua một chiếc áo khoác xanh thoải mái.', 'Tính từ ý kiến trước tính từ màu sắc'),
    ex('This soup tastes delicious.', 'Món súp này có vị rất ngon.', 'Tính từ sau động từ chỉ cảm giác (linking verb)'),
    ex('He felt tired after the long journey.', 'Anh ấy cảm thấy mệt mỏi sau chuyến đi dài.', 'Tính từ bổ nghĩa cho chủ ngữ sau feel'),
  ],
  'adverbs-frequency': [
    ex('She is always cheerful in the morning.', 'Cô ấy luôn vui vẻ vào buổi sáng.', 'Trạng từ tần suất đứng sau động từ to be'),
    ex('We rarely eat fast food at night.', 'Chúng tôi hiếm khi ăn đồ ăn nhanh vào ban đêm.', 'Trạng từ đứng trước động từ thường'),
    ex('Have you ever visited London?', 'Bạn đã bao giờ thăm Luân Đôn chưa?', 'ever trong câu hỏi'),
    ex('I hardly ever sleep before midnight.', 'Tôi hầu như không bao giờ ngủ trước nửa đêm.', 'hardly ever = hầu như không bao giờ'),
  ],
  'imperatives': [
    ex('Do not forget your wallet on the table.', 'Đừng quên ví của bạn trên bàn.', 'Phủ định mệnh lệnh Do not / Don\'t'),
    ex('Always check the oil level before driving.', 'Luôn kiểm tra mức dầu trước khi lái xe.', 'Mệnh lệnh với Always'),
    ex('Never leave young children alone by the pool.', 'Không bao giờ để trẻ nhỏ một mình bên bể bơi.', 'Mệnh lệnh cấm đoán với Never'),
    ex('Pass me the salt, please.', 'Làm ơn đưa giúp tôi lọ muối.', 'Thêm please ở cuối câu yêu cầu'),
  ],
  'modals-ability': [
    ex('She could play the piano when she was seven.', 'Cô ấy có thể chơi piano khi mới 7 tuổi.', 'could = khả năng trong quá khứ'),
    ex('I will be able to speak fluent French after this course.', 'Tôi sẽ có thể nói tiếng Pháp lưu hoát sau khóa học này.', 'be able to trong tương lai'),
    ex('He managed to fix the car despite the rain.', 'Anh ấy đã xoay xở sửa được chiếc xe dù trời mưa.', 'managed to = nỗ lực làm được việc cụ thể'),
    ex('Can you swim across this river?', 'Bạn có thể bơi qua sông này không?', 'Can = khả năng ở hiện tại'),
  ],
  'modals-permission': [
    ex('May I borrow your ruler for a moment?', 'Tôi có thể mượn thước kẻ của bạn một chút được không?', 'May I = xin phép trang trọng'),
    ex('Students can use the library computers anytime.', 'Học sinh có thể sử dụng máy tính thư viện bất kỳ lúc nào.', 'can = cho phép chung'),
    ex('Could I ask a quick question?', 'Tôi có thể hỏi một câu nhanh được không?', 'Could I = xin phép lịch sự'),
    ex('You may not park your vehicle here.', 'Bạn không được phép đỗ xe ở đây.', 'may not = từ chối cho phép trang trọng'),
  ],
  'modals-obligation': [
    ex('You must stop when the traffic light turns red.', 'Bạn phải dừng lại khi đèn giao thông chuyển sang đỏ.', 'must = quy định / luật bắt buộc'),
    ex('We have to wear uniforms to work every weekday.', 'Chúng tôi phải mặc đồng phục đi làm vào mọi ngày trong tuần.', 'have to = bắt buộc từ yếu tố bên ngoài'),
    ex('You do not have to finish the essay tonight.', 'Bạn không nhất thiết phải làm xong bài luận tối nay.', 'don\'t have to = không bắt buộc (không cần làm)'),
    ex('Visitors must not touch the paintings in the gallery.', 'Khách tham quan tuyệt đối không được chạm vào tranh trong phòng trưng bày.', 'must not = cấm tuyệt đối'),
  ],
  'modals-advice': [
    ex('You should drink more water during summer days.', 'Bạn nên uống nhiều nước hơn trong những ngày hè.', 'should = lời khuyên nên làm'),
    ex('You ought to talk to your teacher about this problem.', 'Bạn nên trao đổi với giáo viên về vấn đề này.', 'ought to = lời khuyên đạo đức / bổn phận'),
    ex('You had better check the contract before signing.', 'Tốt hơn hết bạn nên kiểm tra hợp đồng trước khi ký.', 'had better = khuyên cảnh báo hậu quả'),
    ex('He should not eat so much fast food.', 'Anh ấy không nên ăn quá nhiều đồ ăn nhanh.', 'should not = khuyên không nên'),
  ],
  'past-continuous': [
    ex('I was reading a book when the power went out.', 'Tôi đang đọc sách thì cúp điện.', 'Hành động đang diễn ra (was reading) thì có hành động khác chen vào (went out)'),
    ex('While my mother was cooking, my father was gardening.', 'Trong khi mẹ tôi đang nấu ăn thì bố tôi đang làm vườn.', 'Hai hành động song song trong quá khứ'),
    ex('At 8 p.m. yesterday, we were watching a movie.', 'Vào lúc 8 giờ tối qua, chúng tôi đang xem phim.', 'Hành động đang diễn ra tại mốc thời gian cụ thể'),
    ex('They were not paying attention during the lecture.', 'Họ đã không chú ý nghe giảng trong suốt bài học.', 'Phủ định thì quá khứ tiếp diễn'),
  ],
  'future-will': [
    ex('Don\'t worry, I will carry those heavy bags for you.', 'Đừng lo, tôi sẽ xách giúp bạn những chiếc túi nặng đó.', 'Hứa hẹn / quyết định bộc phát ngay lúc nói'),
    ex('I think robots will handle most manual jobs in 2050.', 'Tôi nghĩ người máy sẽ đảm nhận hầu hết công việc tay chân năm 2050.', 'Dự đoán theo quan điểm cá nhân (I think)'),
    ex('Will you open the door for me, please?', 'Bạn làm ơn mở giúp tôi cánh cửa được không?', 'Lời yêu cầu lịch sự với Will'),
    ex('I won\'t tell anyone your secret.', 'Tôi sẽ không nói cho ai biết bí mật của bạn đâu.', 'Lời hứa phủ định với won\'t'),
  ],
  'conditionals-0-1': [
    ex('If you heat ice, it melts into water.', 'Nếu bạn đun nóng đá, nó sẽ tan thành nước.', 'Conditional Type 0: sự thật khoa học (If + V_pres, V_pres)'),
    ex('If it rains tomorrow, we will cancel the picnic.', 'Nếu ngày mai trời mưa, chúng tôi sẽ hủy buổi dã ngoại.', 'Conditional Type 1: khả năng thực tế (If + V_pres, will + V)'),
    ex('If you don\'t study hard, you won\'t pass the exam.', 'Nếu bạn không học hành chăm chỉ, bạn sẽ không đỗ kỳ thi.', 'Type 1 dạng phủ định'),
    ex('Unless you hurry up, we will miss the bus.', 'Trừ khi bạn khẩn trương lên, không thì chúng ta sẽ lỡ xe buýt.', 'Unless = If... not'),
  ],
  'comparatives-superlatives': [
    ex('This new laptop is much faster than my old one.', 'Chiếc máy tính mới này nhanh hơn nhiều so với cái cũ của tôi.', 'So sánh hơn với tính từ ngắn (faster than)'),
    ex('Tokyo is one of the most expensive cities in the world.', 'Tokyo là một trong những thành phố đắt đỏ nhất thế giới.', 'So sánh nhất tính từ dài (the most expensive)'),
    ex('His score is better than mine, but hers is the best.', 'Điểm của anh ấy tốt hơn của tôi, nhưng của cô ấy là tốt nhất.', 'Bất quy tắc: good -> better -> best'),
    ex('Learning a new language is more difficult than it looks.', 'Học một ngôn ngữ mới khó hơn vẻ ngoài của nó.', 'So sánh hơn tính từ dài (more difficult than)'),
  ],
  'wh-questions': [
    ex('Where did you buy this beautiful jacket?', 'Bạn đã mua chiếc áo khoác đẹp này ở đâu?', 'Wh- + did + S + V?'),
    ex('Why is the train delayed today?', 'Tại sao hôm nay chuyến tàu lại bị trễ?', 'Wh- + be + S + adj?'),
    ex('Who broke the window yesterday afternoon?', 'Ai đã làm vỡ cửa sổ chiều qua?', 'Who làm chủ ngữ (không cần trợ động từ did)'),
    ex('How often do you go to the gym each week?', 'Bạn đến phòng tập bao nhiêu lần một tuần?', 'How often + do + S + V?'),
  ],
  'present-perfect': [
    ex('I have lived in Hanoi for ten years.', 'Tôi đã sống ở Hà Nội được mười năm.', 'Hành động bắt đầu trong quá khứ kéo dài đến hiện tại (for + khoảng thời gian)'),
    ex('She has just finished her university assignment.', 'Cô ấy vừa mới hoàn thành bài tập đại học.', 'just = vừa mới xảy ra'),
    ex('Have you ever tried Japanese sushi before?', 'Bạn đã từng ăn thử sushi Nhật Bản trước đây chưa?', 'ever = đã từng'),
    ex('We haven\'t received the flight confirmation yet.', 'Chúng tôi vẫn chưa nhận được xác nhận chuyến bay.', 'yet = chưa (cuối câu phủ định)'),
  ],
  'present-perfect-continuous': [
    ex('He has been working on this report since 7 a.m.', 'Anh ấy đã làm báo cáo này liên tục từ 7 giờ sáng.', 'Nhấn mạnh sự liên tục của hành động từ quá khứ đến nay'),
    ex('Why are your clothes dirty? — I have been painting the fence.', 'Tại sao quần áo bạn bị bẩn? — Tôi vừa mới sơn hàng rào xong.', 'Hành động vừa mới ngưng, để lại hậu quả quan sát được ở hiện tại'),
    ex('How long have you been waiting for the bus?', 'Bạn đã chờ xe buýt bao lâu rồi?', 'How long + have + S + been + V-ing?'),
    ex('It has been raining continuously all morning.', 'Trời đã mưa liên tục suốt cả buổi sáng.', 'Diễn tả thời tiết mưa dầm dề từ sáng đến giờ'),
  ],
  'past-perfect': [
    ex('When we arrived at the station, the train had already left.', 'Khi chúng tôi đến ga, chiếc tàu đã rời đi mất rồi.', 'Hành động xảy ra trước mốc thời gian/hành động khác trong quá khứ (had left trước arrived)'),
    ex('She had never seen a dolphin before she visited the aquarium.', 'Cô ấy chưa từng thấy cá heo trước khi đến thăm thủy cung.', 'Kinh nghiệm tính đến một thời điểm trong quá khứ'),
    ex('After he had saved enough money, he bought a motorcycle.', 'Sau khi đã tiết kiệm đủ tiền, anh ấy mua một chiếc xe máy.', 'After + Had V3, V-ed'),
    ex('By the time the party ended, all the cake had disappeared.', 'Vào lúc bữa tiệc kết thúc, toàn bộ bánh ngọt đã biến mất.', 'By the time + V-past, Had V3'),
  ],
  'future-continuous': [
    ex('At 10 a.m. tomorrow, I will be taking an English test.', 'Vào 10 giờ sáng mai, tôi sẽ đang làm bài thi tiếng Anh.', 'Hành động đang diễn ra tại mốc thời gian cụ thể trong tương lai'),
    ex('Don\'t call me at 8 p.m. because we will be having dinner.', 'Đừng gọi tôi lúc 8 giờ tối vì khi đó chúng tôi đang ăn tối.', 'Lý do bận rộn tại một thời điểm tương lai'),
    ex('This time next week, she will be sunbathing in Bali.', 'Giờ này tuần sau, cô ấy sẽ đang tắm nắng ở Bali.', 'This time next week + will be V-ing'),
    ex('Will you be using your computer tonight?', 'Tối nay bạn có dùng máy tính không? (Hỏi xã giao xem có phiền không)', 'Hỏi lịch trình tương lai nhẹ nhàng'),
  ],
  'used-to': [
    ex('I used to ride a bicycle to school when I was young.', 'Tôi từng đi xe đạp đến trường khi còn nhỏ.', 'Thói quen / trạng thái trong quá khứ nay không còn nữa'),
    ex('Did you use to live in a small village?', 'Bạn có từng sống ở một ngôi làng nhỏ không?', 'Câu hỏi với Did + use to'),
    ex('He didn\'t use to like vegetables, but now he loves them.', 'Anh ấy từng không thích rau, nhưng giờ anh ấy rất thích.', 'Phủ định didn\'t use to'),
    ex('She is used to waking up early every day.', 'Cô ấy đã quen với việc dậy sớm mỗi ngày.', 'be used to + V-ing = đã quen thuộc với việc gì'),
  ],
  'second-conditional': [
    ex('If I had a lot of money, I would travel around the world.', 'Nếu tôi có nhiều tiền, tôi sẽ đi du lịch vòng quanh thế giới.', 'Giả thiết trái với thực tế hiện tại (If + V2, would + V)'),
    ex('If I were you, I would take that job offer immediately.', 'Nếu tôi là bạn, tôi sẽ nhận lời mời làm việc đó ngay lập tức.', 'Lời khuyên với If I were you'),
    ex('What would you do if you saw a bear in the forest?', 'Bạn sẽ làm gì nếu thấy một con gấu trong rừng?', 'Câu hỏi giả thiết trái hiện tại'),
    ex('She would pass the exam if she studied more regularly.', 'Cô ấy sẽ đỗ kỳ thi nếu cô ấy học hành đều đặn hơn.', 'Mệnh đề chính đứng trước mệnh đề If'),
  ],
  'third-conditional': [
    ex('If I had studied harder, I would have passed the exam.', 'Nếu tôi học chăm hơn thì tôi đã đỗ kỳ thi rồi.', 'Giả thiết trái ngược với thực tế quá khứ (If + had V3, would have V3)'),
    ex('If she had set her alarm, she wouldn\'t have missed the flight.', 'Nếu cô ấy đã đặt báo thức thì cô ấy đã không bỏ lỡ chuyến bay.', 'Tiếc nuối sự việc không xảy ra trong quá khứ'),
    ex('What would you have done if you had been in my position?', 'Bạn sẽ làm gì nếu bạn ở vào vị trí của tôi lúc đó?', 'Câu hỏi về quá khứ trái thực tế'),
    ex('They would have won the game if their goalkeeper hadn\'t been injured.', 'Họ đã chiến thắng nếu thủ môn của họ không bị thương.', 'Điều kiện không có thật ở quá khứ'),
  ],
  'passive-voice': [
    ex('The new bridge was built by engineers last year.', 'Cây cầu mới đã được xây dựng bởi các kỹ sư vào năm ngoái.', 'Câu bị động quá khứ đơn (was/were + V3)'),
    ex('English is spoken by millions of people worldwide.', 'Tiếng Anh được nói bởi hàng triệu người trên thế giới.', 'Bị động hiện tại đơn (am/is/are + V3)'),
    ex('This project will be completed before next Monday.', 'Dự án này sẽ được hoàn thành trước thứ Hai tuần tới.', 'Bị động tương lai đơn (will be + V3)'),
    ex('The stolen phone has just been found by the police.', 'Chiếc điện thoại bị mất trộm vừa được cảnh sát tìm thấy.', 'Bị động hiện tại hoàn thành (has/have been + V3)'),
  ],
  'reported-speech': [
    ex('He said that he was going to buy a new car.', 'Anh ấy nói rằng anh ấy định mua một chiếc ô tô mới.', 'Lùi thì: is going to -> was going to'),
    ex('She asked me if I could help her with the luggage.', 'Cô ấy hỏi tôi liệu tôi có thể giúp cô ấy mang hành lý không.', 'Câu hỏi Yes/No tường thuật với if/whether'),
    ex('The teacher ordered us to open our books at page 50.', 'Giáo viên yêu cầu chúng tôi mở sách ở trang 50.', 'Tường thuật mệnh lệnh: order/tell + O + to V'),
    ex('Tom promised that he would arrive on time.', 'Tom đã hứa rằng anh ấy sẽ đến đúng giờ.', 'Lùi thì: will -> would'),
  ],
  'relative-clauses': [
    ex('The woman who lives next door is a famous doctor.', 'Người phụ nữ sống nhà bên cạnh là một bác sĩ nổi tiếng.', 'who thay cho đại từ chỉ người (chủ ngữ)'),
    ex('I love the laptop which my father gave me for my birthday.', 'Tôi rất thích chiếc máy tính mà bố tặng tôi nhân dịp sinh nhật.', 'which thay cho vật'),
    ex('The restaurant where we had dinner last night was elegant.', 'Nhà hàng nơi chúng tôi ăn tối tối qua thật sang trọng.', 'where chỉ nơi chốn'),
    ex('The boy whose bicycle was stolen reported it to the police.', 'Cậu bé có chiếc xe đạp bị trộm đã báo cho cảnh sát.', 'whose chỉ sở hữu'),
  ],
  'gerunds-infinitives': [
    ex('She enjoys listening to acoustic music in her free time.', 'Cô ấy thích nghe nhạc acoustic vào thời gian rảnh.', 'enjoy + V-ing'),
    ex('He decided to apply for the manager position.', 'Anh ấy đã quyết định nộp đơn cho vị trí quản lý.', 'decide + to V'),
    ex('Do you mind opening the window for a moment?', 'Bạn có phiền mở giúp cửa sổ một chút không?', 'mind + V-ing'),
    ex('I forgot to post the letter on my way home.', 'Tôi đã quên gửi thư trên đường về nhà.', 'forget + to V = quên chưa làm việc phải làm'),
  ],
  'question-tags': [
    ex('You are a student, aren\'t you?', 'Bạn là học sinh phải không?', 'Vế trước khẳng định (are) -> tag phủ định (aren\'t you)'),
    ex('She doesn\'t like spicy food, does she?', 'Cô ấy không thích ăn đồ cay đúng không?', 'Vế trước phủ định (doesn\'t) -> tag khẳng định (does she)'),
    ex('They went to the party last night, didn\'t they?', 'Họ đã đến bữa tiệc tối qua đúng không?', 'Vế trước quá khứ đơn (went) -> tag (didn\'t they)'),
    ex('Let\'s go for a walk in the park, shall we?', 'Chúng ta đi dạo trong công viên nhé?', 'Mệnh lệnh Let\'s -> tag shall we'),
  ],
  'modals-deduction': [
    ex('She must be at home because her car is parked outside.', 'Cô ấy chắc chắn đang ở nhà vì xe của cô ấy đỗ ở ngoài.', 'must be = suy đoán chắc chắn đúng ở hiện tại'),
    ex('He can\'t be the thief — he was with me all night.', 'Anh ấy không thể là kẻ trộm — anh ấy ở cùng tôi suốt đêm.', 'can\'t be = suy đoán chắc chắn sai'),
    ex('They might be sleeping now, so don\'t make noise.', 'Họ có thể đang ngủ bây giờ, nên đừng làm ồn.', 'might/may = suy đoán có thể đúng (không chắc)'),
    ex('That man looks lost — he may need some assistance.', 'Người đàn ông đó trông có vẻ lạc đường — ông ấy có thể cần trợ giúp.', 'may + V = đoán khả năng xảy ra'),
  ],
  'phrasal-verbs': [
    ex('Can you turn off the light before going to bed?', 'Bạn có thể tắt đèn trước khi đi ngủ không?', 'turn off = tắt thiết bị'),
    ex('She grew up in a small coastal town in Vietnam.', 'Cô ấy lớn lên ở một thị trấn nhỏ ven biển Việt Nam.', 'grow up = trưởng thành / lớn lên'),
    ex('I am looking forward to hearing from you soon.', 'Tôi rất mong chờ sớm nhận được tin từ bạn.', 'look forward to + V-ing = trông chờ'),
    ex('Never give up on your dreams no matter what happens.', 'Đừng bao giờ từ bỏ ước mơ của bạn dù có chuyện gì xảy ra.', 'give up = từ bỏ'),
  ],
  'conjunctions-linking': [
    ex('Although it rained heavily, they still played the match.', 'Mặc dù trời mưa to, họ vẫn chơi trận đấu.', 'Although + S + V = mặc dù'),
    ex('He studied hard; however, he didn\'t pass the exam.', 'Anh ấy đã học chăm chỉ; tuy nhiên, anh ấy không đỗ kỳ thi.', 'however = tuy nhiên'),
    ex('She went to the market in order to buy fresh vegetables.', 'Cô ấy đi chợ để mua rau tươi.', 'in order to + V = để làm gì'),
    ex('Because of the heavy traffic, we arrived 20 minutes late.', 'Vì kẹt xe nặng, chúng tôi đến muộn 20 phút.', 'Because of + N / V-ing = bởi vì'),
  ],
  'past-perfect-continuous': [
    ex('They had been talking for two hours before the meeting started.', 'Họ đã nói chuyện liên tục hai giờ trước khi cuộc họp bắt đầu.', 'Hành động diễn ra liên tục kéo dài đến một mốc quá khứ khác'),
    ex('Her eyes were red because she had been crying.', 'Mắt cô ấy đỏ hoe vì cô ấy đã khóc liên tục trước đó.', 'Giải thích nguyên nhân xảy ra trong quá khứ'),
    ex('He was exhausted because he had been running all morning.', 'Anh ấy kiệt sức vì anh ấy đã chạy bộ suốt cả buổi sáng.', 'Nhấn mạnh tính liên tục kéo dài của hành động quá khứ'),
    ex('How long had you been living there before you moved to London?', 'Bạn đã sống ở đó bao lâu trước khi chuyển đến London?', 'How long + had + S + been + V-ing?'),
  ],
  'future-perfect': [
    ex('By next June, I will have graduated from university.', 'Cho đến tháng 6 tới, tôi sẽ tốt nghiệp đại học rồi.', 'Hành động sẽ hoàn thành trước một mốc thời gian tương lai (By + time, will have V3)'),
    ex('She will have lived here for 20 years by the end of this month.', 'Cô ấy sẽ sống ở đây được tròn 20 năm tính đến cuối tháng này.', 'Tích lũy khoảng thời gian đến mốc tương lai'),
    ex('By 9 p.m. tonight, we will have finished all our assignments.', 'Đến 9 giờ tối nay, chúng tôi sẽ làm xong tất cả bài tập.', 'By + time + will have V3'),
    ex('Will you have completed the project before the deadline?', 'Bạn sẽ hoàn thành dự án trước hạn chót chứ?', 'Câu hỏi dạng tương lai hoàn thành'),
  ],
  'future-in-the-past': [
    ex('I knew that she was going to achieve great success.', 'Tôi biết cô ấy sẽ đạt được thành công lớn.', 'Quá khứ của be going to -> was/were going to'),
    ex('They were about to board the plane when they heard the announcement.', 'Họ định bước lên máy bay thì nghe thấy thông báo.', 'was/were about to + V = sắp sửa làm gì'),
    ex('She promised she would return the book the following day.', 'Cô ấy hứa cô ấy sẽ trả lại cuốn sách vào ngày hôm sau.', 'would + V diễn tả ý định từ quá khứ'),
    ex('I thought the journey would be easy and quick.', 'Tôi đã tưởng chuyến đi sẽ dễ dàng và nhanh chóng.', 'thought + would V'),
  ],
  'mixed-conditionals': [
    ex('If I had taken your advice yesterday, I would be safe now.', 'Nếu tôi nghe lời khuyên của bạn hôm qua thì giờ tôi đã an toàn rồi.', 'Quá khứ trái thực tế -> Hậu quả hiện tại (If + had V3, would + V)'),
    ex('If she were a native speaker, she would have translated the text easily.', 'Nếu cô ấy là người bản ngữ (bản chất hiện tại), cô ấy đã dịch bài thơ đó dễ dàng rồi (quá khứ).', 'Bản chất hiện tại -> Hậu quả quá khứ (If + V2/were, would have V3)'),
    ex('If he hadn\'t spent all his money last night, he would have cash today.', 'Nếu tối qua anh ấy không tiêu hết tiền thì hôm nay anh ấy đã có tiền mặt.', 'Điều kiện quá khứ -> Kết quả hiện tại'),
    ex('If I spoke Spanish fluently, I would have applied for that job in Madrid.', 'Nếu tôi nói tiếng Tây Ban Nha lưu hoát, tôi đã nộp đơn cho công việc ở Madrid đó rồi.', 'Điều kiện chung -> Hành động quá khứ'),
  ],
  'wish-if-only': [
    ex('I wish I had more spare time to learn guitar.', 'Tôi ước mình có nhiều thời gian rảnh hơn để học đàn guitar.', 'Wish ở hiện tại: Wish + S + V2 (lùi thì)'),
    ex('If only I hadn\'t said those rude words to him yesterday.', 'Giá mà tôi đã không nói những từ thô lỗ đó với anh ấy hôm qua.', 'If only quá khứ: If only + S + Had V3'),
    ex('She wishes it would stop raining so she could go out.', 'Cô ấy ước trời sẽ ngừng mưa để cô ấy có thể ra ngoài.', 'Wish tương lai / mong muốn ai thay đổi: Wish + S + would V'),
    ex('I wish I were standing on a sunny beach right now.', 'Tôi ước mình đang đứng trên một bãi biển đầy nắng ngay lúc này.', 'Wish cho trạng thái đang diễn ra: Wish + S + were V-ing'),
  ],
  'subjunctive': [
    ex('The doctor demanded that the patient stay in bed for three days.', 'Bác sĩ yêu cầu bệnh nhân ở lại trên giường trong ba ngày.', 'Giả định thức: demand that + S + V_base (stay nguyên thể)'),
    ex('It is essential that every member submit their application on time.', 'Điều thiết yếu là mọi thành viên phải nộp đơn đúng hạn.', 'It is essential that + S + V_base'),
    ex('The manager recommended that he be promoted to supervisor.', 'Người quản lý kiến nghị anh ấy được cất nhắc lên giám sát.', 'Bị động giả định thức: be + V3'),
    ex('It is vital that she not inform anyone about the plan.', 'Điều quan trọng là cô ấy không được báo cho ai về kế hoạch.', 'Phủ định giả định thức: not + V_base'),
  ],
  'advanced-passive': [
    ex('It is reported that the company has gained huge profits.', 'Người ta báo cáo rằng công ty đã đạt lợi nhuận lớn.', 'Bị động với chủ ngữ giả It is reported that...'),
    ex('He is believed to have left the country two days ago.', 'Anh ấy được tin là đã rời khỏi đất nước hai ngày trước.', 'Bị động dạng S + is believed + to have V3'),
    ex('The new bridge needs repairing immediately.', 'Cây cầu mới cần được sửa chữa ngay lập tức.', 'need + V-ing = need to be done'),
    ex('She dislikes being treated like a child.', 'Cô ấy không thích bị đối xử như một đứa trẻ.', 'Bị động với V-ing: being + V3'),
  ],
  'causative': [
    ex('I had the plumber fix the leaking pipe yesterday.', 'Tôi đã nhờ thợ sửa chiếc ống nước bị rò rỉ hôm qua.', 'Have somebody do something (thợ làm)'),
    ex('She got her brother to carry the heavy luggage for her.', 'Cô ấy đã nhờ anh trai mang giúp chiếc hành lý nặng.', 'Get somebody to do something'),
    ex('He had his car repaired at the local garage.', 'Anh ấy đã mang xe ô tô đi sửa ở gara địa phương.', 'Have something done (V3)'),
    ex('I am going to get my hair cut tomorrow morning.', 'Tôi định đi cắt tóc vào sáng mai.', 'Get something done (V3)'),
  ],
  'advanced-relative-clauses': [
    ex('He decided to resign, which surprised everyone in the office.', 'Anh ấy quyết định từ chức, điều này làm mọi người trong văn phòng ngạc nhiên.', 'which mệnh đề thay thế cho cả mệnh đề phía trước'),
    ex('The company hired ten workers, all of whom have master degrees.', 'Công ty đã thuê 10 công nhân, tất cả họ đều có bằng thạc sĩ.', 'all of whom / many of which'),
    ex('The house in which Shakespeare was born is now a museum.', 'Ngôi nhà nơi Shakespeare sinh ra giờ là một bảo tàng.', 'Giới từ + relative pronoun (in which = where)'),
    ex('This is the book about which I was telling you yesterday.', 'Đây là cuốn sách mà tôi đã kể với bạn hôm qua.', 'about which'),
  ],
  'participle-clauses': [
    ex('Feeling exhausted after the long walk, she sat down to rest.', 'Cảm thấy kiệt sức sau quãng đường dạo bộ dài, cô ấy ngồi xuống nghỉ ngơi.', 'Hiện tại phân tử (V-ing) chỉ nguyên nhân / hành động cùng chủ ngữ'),
    ex('Built in the 18th century, the castle attracts thousands of tourists.', 'Được xây dựng vào thế kỷ 18, lâu đài thu hút hàng ngàn du khách.', 'Quá khứ phân tử (V3) mang nghĩa bị động'),
    ex('Having finished all his work, he went home early.', 'Sau khi đã hoàn thành mọi công việc, anh ấy về nhà sớm.', 'Hoàn thành phân tử (Having V3) chỉ hành động trước'),
    ex('Not knowing what to say, she remained silent.', 'Không biết phải nói gì, cô ấy vẫn im lặng.', 'Dạng phủ định Not V-ing'),
  ],
  'inversion': [
    ex('Never have I seen such a breathtaking view in my life.', 'Chưa bao giờ trong đời tôi thấy một cảnh quan ngoạn mục đến vậy.', 'Inversion với Never: Never + have + S + V3'),
    ex('Seldom does he complain about his working conditions.', 'Hiếm khi anh ấy phàn nàn về điều kiện làm việc của mình.', 'Seldom + does + S + V'),
    ex('Not only is she intelligent, but she is also extremely hardworking.', 'Không những cô ấy thông minh, mà cô ấy còn cực kỳ chăm chỉ.', 'Not only + be + S...'),
    ex('Hardly had the show started when the power went out.', 'Vừa mới bắt đầu buổi diễn thì cúp điện.', 'Hardly + had + S + V3 + when...'),
  ],
  'cleft-sentences': [
    ex('It was my brother who gave me this vintage watch.', 'Chính là anh trai tôi, người đã tặng tôi chiếc đồng hồ cổ này.', 'Cleft sentence nhấn mạnh chủ ngữ người: It is/was X who...'),
    ex('It was in Paris that they first met five years ago.', 'Chính tại Paris họ mới gặp nhau lần đầu cách đây 5 năm.', 'Nhấn mạnh trạng ngữ nơi chốn: It was... that...'),
    ex('What I really need right now is a good hot shower.', 'Điều tôi thực sự cần ngay lúc này là một vòi sen nước nóng dễ chịu.', 'Wh-cleft: What I need is...'),
    ex('All she wants is a small quiet apartment in the countryside.', 'Tất cả những gì cô ấy muốn chỉ là một căn hộ nhỏ yên tĩnh ở nông thôn.', 'All + S + V + is...'),
  ],
  'emphasis-structures': [
    ex('I do hope that you can join our wedding party next Saturday.', 'Tôi thực sự rất hy vọng bạn có thể tham dự tiệc cưới của chúng tôi thứ Bảy tới.', 'Nhấn mạnh động từ với Do/Does/Did + V_base'),
    ex('She did complete the project before the strict deadline.', 'Cô ấy thực sự đã hoàn thành dự án trước hạn chót nghiêm ngặt.', 'did + V_base quá khứ'),
    ex('The movie was so captivating that nobody left their seats.', 'Bộ phim lôi cuốn đến mức không ai rời khỏi chỗ ngồi.', 'so + adj + that...'),
    ex('It was such a heavy storm that all flights were grounded.', 'Cơn bão mạnh đến mức mọi chuyến bay đều bị hoãn.', 'such + a/an + N + that...'),
  ],
  'ellipsis-substitution': [
    ex('He promised to come to the party, but he didn\'t.', 'Anh ấy đã hứa sẽ đến bữa tiệc, nhưng anh ấy đã không đến.', 'Lược bỏ mệnh đề sau trợ động từ (didn\'t)'),
    ex('Do you think it will rain today? — I hope not.', 'Bạn có nghĩ hôm nay trời sẽ mưa không? — Tôi hy vọng là không.', 'Thay thế bằng I hope so / I hope not'),
    ex('Some students like online learning, while others prefer traditional classes.', 'Một số học sinh thích học trực tuyến, trong khi những học sinh khác thích lớp truyền thống.', 'others thay cho other students'),
    ex('I bought a red apple and she chose a green one.', 'Tôi đã mua một quả táo đỏ và cô ấy chọn một quả màu xanh.', 'one/ones thay cho danh từ đếm được'),
  ],
  'nominalisation': [
    ex('The rapid destruction of the rainforest causes severe climate issues.', 'Sự phá hủy nhanh chóng rừng rậm gây ra những vấn đề khí hậu nghiêm trọng.', 'Danh từ hóa: destroy -> destruction'),
    ex('His sudden decision to resign shocked the board of directors.', 'Quyết định từ chức đột ngột của anh ấy làm kinh ngạc hội đồng quản trị.', 'decide -> decision'),
    ex('The implementation of the new policy will begin next week.', 'Việc thực thi chính sách mới sẽ bắt đầu vào tuần tới.', 'implement -> implementation'),
    ex('Clear communication is key to successful team collaboration.', 'Sự giao tiếp rõ ràng là chìa khóa cho sự cộng tác đội nhóm thành công.', 'collaborate -> collaboration'),
  ],
  'discourse-markers': [
    ex('Furthermore, the new software speeds up the processing time by 50%.', 'Hơn thế nữa, phần mềm mới đẩy nhanh thời gian xử lý lên 50%.', 'Furthermore = bổ sung thông tin trang trọng'),
    ex('On the one hand, remote work saves commuting time; on the other hand, it reduces social interaction.', 'Một mặt, làm việc từ xa tiết kiệm thời gian đi lại; mặt khác, nó giảm tương tác xã hội.', 'On the one hand... on the other hand...'),
    ex('In conclusion, we need to take immediate action to protect the environment.', 'Tóm lại, chúng ta cần hành động ngay lập tức để bảo vệ môi trường.', 'In conclusion = kết luận'),
    ex('Nevertheless, the team continued their effort despite the setback.', 'Tuy nhiên, cả đội vẫn tiếp tục nỗ lực bất chấp thất bại.', 'Nevertheless = tuy nhiên'),
  ],
  'hedging-language': [
    ex('The findings seem to suggest a strong connection between diet and health.', 'Các phát hiện có vẻ gợi ý một mối liên hệ mạnh mẽ giữa chế độ ăn và sức khỏe.', 'seem to suggest = làm mềm nhận định'),
    ex('It is generally believed that exercise improves mental well-being.', 'Người ta thường tin rằng tập thể dục nâng cao sức khỏe tinh thần.', 'It is generally believed that...'),
    ex('The data tends to indicate a slight increase in inflation.', 'Dữ liệu có xu hướng chỉ ra sự gia tăng nhẹ về lạm phát.', 'tends to indicate'),
    ex('Arguably, this is one of the most effective solutions available.', 'Có thể cho rằng, đây là một trong những giải pháp hiệu quả nhất hiện có.', 'Arguably = làm mềm khẳng định'),
  ],
  'modals-perfect': [
    ex('She must have forgotten about the appointment because she isn\'t here.', 'Cô ấy chắc hẳn đã quên lịch hẹn vì cô ấy không có ở đây.', 'must have V3 = đoán chắc chắn đã xảy ra trong quá khứ'),
    ex('You should have checked the tire pressure before driving long distance.', 'Đáng lẽ bạn nên kiểm tra áp suất lốp trước khi lái xe đường dài.', 'should have V3 = lẽ ra nên làm trong quá khứ (nhưng không làm)'),
    ex('He couldn\'t have committed the crime because he was abroad.', 'Anh ấy không thể nào đã phạm tội vì anh ấy đang ở nước ngoài.', 'couldn\'t have V3 = chắc chắn không xảy ra'),
    ex('They might have missed the turn in the dark.', 'Họ có thể đã đi nhầm ngã rẽ trong bóng tối.', 'might have V3 = có thể đã xảy ra'),
  ],
  'grammatical-collocations': [
    ex('She is interested in learning foreign languages.', 'Cô ấy có hứng thú với việc học các ngoại ngữ.', 'interested + in + V-ing'),
    ex('They succeeded in reaching the mountain summit.', 'Họ đã thành công trong việc chinh phục đỉnh núi.', 'succeed + in + V-ing'),
    ex('He apologized for arriving late at the interview.', 'Anh ấy đã xin lỗi vì đến muộn buổi phỏng vấn.', 'apologize + for + V-ing'),
    ex('She is capable of solving complex mathematical puzzles.', 'Cô ấy có khả năng giải các bài toán đố phức tạp.', 'capable + of + V-ing'),
  ]
};

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: topics, error: te } = await sb.from('grammar_topics').select('id, slug');
  if (te) throw te;
  const { data: lessons, error: le } = await sb.from('grammar_lessons').select('id, topic_id, examples');
  if (le) throw le;

  const topicById = Object.fromEntries(topics.map(t => [t.id, t]));
  let updatedCount = 0;

  for (const lesson of lessons) {
    const slug = topicById[lesson.topic_id]?.slug;
    if (!slug || !FRESH_THEORY_EXAMPLES[slug]) continue;

    const existing = Array.isArray(lesson.examples) ? lesson.examples : [];
    const newItems = FRESH_THEORY_EXAMPLES[slug];

    // Filter out duplicates if en is already present
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

  console.log(`\nPhase 1 Complete! Updated theory examples for ${updatedCount} topics.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
