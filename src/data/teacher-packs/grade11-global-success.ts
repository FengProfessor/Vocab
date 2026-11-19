import {
  parseStructuredVocabRows,
  type ParsedTeacherVocabItem,
} from '@/lib/teacher-vocab-import';

export interface TeacherVocabPackSectionSummary {
  name: string;
  count: number;
}

export interface TeacherVocabPackMeta {
  id: string;
  grade: string;
  curriculum: string;
  unitNumber: number;
  title: string;
  subtitle: string;
  totalWords: number;
  sections: TeacherVocabPackSectionSummary[];
  wordKeys: string[];
}

export interface TeacherVocabPack extends TeacherVocabPackMeta {
  items: ParsedTeacherVocabItem[];
}

type CompactWordTuple = readonly [
  word: string,
  ipa: string,
  pos: string,
  translation: string,
  extra: string,
];

interface PackSectionSeed {
  section: string;
  role: 'family' | 'note';
  rows: readonly CompactWordTuple[];
}

interface PackSeed {
  id: string;
  grade: string;
  curriculum: string;
  unitNumber: number;
  title: string;
  subtitle: string;
  sections: readonly PackSectionSeed[];
}

const GRADE_11_PACK_SEEDS: readonly PackSeed[] = [
  {
    id: 'g11-gs-unit-1',
    grade: 'Lớp 11',
    curriculum: 'Tiếng Anh 11 - Global Success',
    unitNumber: 1,
    title: 'Unit 1: A Long and Healthy Life',
    subtitle: 'Từ vựng cốt lõi, động tác thể dục & chuyên đề sức khỏe',
    sections: [
      {
        section: '1. Từ vựng trọng tâm trong bài học (Core Textbook Vocabulary)',
        role: 'family',
        rows: [
          ['Antibiotic', '/ˌæntɪbaɪˈɒtɪk/', 'n, adj', '- (n) Thuốc kháng sinh - (adj) Có tính kháng sinh', '• Antibacterial (adj): kháng khuẩn'],
          ['Bacteria', '/bækˈtɪəriə/', 'n (số nhiều)', 'Vi khuẩn (số ít: bacterium)', '• Bacterium (n): vi khuẩn (số ít) • Bacterial (adj): thuộc vi khuẩn • Bacteriology (n): vi khuẩn học'],
          ['Balance', '/ˈbæləns/', 'n, v', '- (n) Sự cân bằng - (v) Làm cho cân bằng', '• Balanced (adj): cân đối, cân bằng • Balancing (adj): có tính cân đối • Unbalance (v/n): làm mất cân bằng'],
          ['Balanced', '/ˈbælənst/', 'adj', 'Cân đối, có sự cân bằng (chế độ ăn...)', '• Balance (n, v) • Unbalanced (adj): mất cân đối'],
          ['Diameter', '/daɪˈæmɪtə(r)/', 'n', 'Đường kính', '• Diametrical (adj): thuộc đường kính • Diametrically (adv): hoàn toàn, đối nghịch'],
          ['Disease', '/dɪˈziːz/', 'n', 'Bệnh tật, căn bệnh', '• Diseased (adj): bị nhiễm bệnh, có mầm bệnh'],
          ['Energy', '/ˈenədʒi/', 'n', 'Năng lượng, sinh lực', '• Energetic (adj): dồi dào năng lượng • Energetically (adv): một cách năng động • Energize (v): tiếp thêm năng lượng'],
          ['Examine', '/ɪɡˈzæmɪn/', 'v', 'Khám bệnh, kiểm tra, xem xét', '• Examination (n): sự khám bệnh, kỳ thi • Examiner (n): người chấm thi, bác sĩ khám • Examinee (n): thí sinh, người được khám'],
          ['Fitness', '/ˈfɪtnəs/', 'n', 'Thể lực, sự sung sức, tình trạng khỏe mạnh', '• Fit (adj, v): vừa vặn, sung sức • Unfit (adj): không đủ thể lực'],
          ['Germ', '/dʒɜːm/', 'n', 'Mầm bệnh, vi trùng', '• Germicide (n): chất diệt trùng'],
          ['Habit', '/ˈhæbɪt/', 'n', 'Thói quen', '• Habitual (adj): theo thói quen • Habitually (adv): thường lệ'],
          ['Health', '/helθ/', 'n', 'Sức khỏe', '• Healthy (adj): khỏe mạnh, lành mạnh • Healthily (adv): một cách lành mạnh • Unhealthy (adj): không lành mạnh'],
          ['Hygiene', '/ˈhaɪdʒiːn/', 'n', 'Vệ sinh phòng dịch', '• Hygienic (adj): hợp vệ sinh • Hygienically (adv): một cách sạch sẽ • Unhygienic (adj): mất vệ sinh'],
          ['Illness', '/ˈɪlnəs/', 'n', 'Căn bệnh, sự ốm đau', '• Ill (adj): ốm, bệnh'],
          ['Infection', '/ɪnˈfekʃn/', 'n', 'Sự lây nhiễm, bệnh nhiễm trùng', '• Infect (v): lây nhiễm • Infectious (adj): truyền nhiễm • Disinfect (v): khử trùng • Disinfectant (n): chất sát khuẩn'],
          ['Infectious', '/ɪnˈfekʃəs/', 'adj', 'Dễ lây nhiễm, có tính truyền nhiễm', '• Infect (v) • Infection (n) • Infectiously (adv)'],
          ['Ingredient', '/ɪnˈɡriːdiənt/', 'n', 'Thành phần, nguyên liệu', '—'],
          ['Injury', '/ˈɪndʒəri/', 'n', 'Chấn thương, vết thương', '• Injure (v): làm bị thương • Injured (adj): bị thương • Injurious (adj): có hại'],
          ['Life expectancy', '/ˈlaɪf ɪkˌspektənsi/', 'n', 'Tuổi thọ trung bình', '• Expect (v): mong đợi • Expectant (adj): chờ đón • Expectation (n): sự kỳ vọng'],
          ['Lifestyle', '/ˈlaɪfstaɪl/', 'n', 'Lối sống, phong cách sống', '—'],
          ['Longevity', '/lɒnˈdʒevəti/', 'n', 'Sự trường thọ, tuổi thọ cao', '• Long (adj): dài, lâu'],
          ['Muscle', '/ˈmʌsl/', 'n', 'Cơ bắp, sức lực cơ bắp', '• Muscular (adj): vạm vỡ, thuộc cơ bắp • Muscularity (n): sự phát triển cơ bắp'],
          ['Nutrient', '/ˈnjuːtriənt/', 'n', 'Chất dinh dưỡng', '• Nutrition (n): dinh dưỡng • Nutritious (adj): bổ dưỡng • Nutritional (adj): thuộc dinh dưỡng • Nutritionist (n): chuyên gia dinh dưỡng • Malnutrition (n): suy dinh dưỡng'],
          ['Nutrition', '/njuːˈtrɪʃn/', 'n', 'Sự dinh dưỡng, chế độ dinh dưỡng', '(Các từ trong họ từ tương tự mục Nutrient)'],
          ['Organism', '/ˈɔːɡənɪzəm/', 'n', 'Sinh vật, thực thể sống', '• Organ (n): cơ quan trong cơ thể • Organic (adj): hữu cơ • Inorganic (adj): vô cơ'],
          ['Physical', '/ˈfɪzɪkl/', 'adj', 'Thuộc về thể chất, thân thể, vật lý', '• Physically (adv): về mặt thể chất • Physique (n): vóc dáng cơ thể • Physician (n): bác sĩ điều trị'],
          ['Prevent', '/prɪˈvent/', 'v', 'Ngăn chặn, phòng ngừa', '• Prevention (n): sự phòng bệnh, ngăn ngừa • Preventive / Preventative (adj): phòng bệnh • Preventable (adj): có thể phòng ngừa được'],
          ['Preventive', '/prɪˈventɪv/', 'adj', 'Có tính chất phòng ngừa, ngăn ngừa', '(Các từ trong họ từ tương tự mục Prevent)'],
          ['Properly', '/ˈprɒpəli/', 'adv', 'Một cách đúng đắn, hợp lý, điều độ', '• Proper (adj): thích hợp, đúng đắn • Improper (adj): không hợp lệ'],
          ['Recipe', '/ˈresəpi/', 'n', 'Công thức chế biến món ăn', '—'],
          ['Regular', '/ˈreɡjələ(r)/', 'adj', 'Đều đặn, có quy củ, thường xuyên', '• Regularly (adv): một cách đều đặn • Regularity (n): tính quy củ • Irregular (adj): bất thường'],
          ['Relaxation', '/ˌriːlækˈseɪʃn/', 'n', 'Sự thư giãn, nghỉ ngơi', '• Relax (v): thư giãn • Relaxing (adj): đem lại cảm giác thư thái • Relaxed (adj): cảm thấy thư thả'],
          ['Repetitive', '/rɪˈpetətɪv/', 'adj', 'Có tính lặp đi lặp lại', '• Repeat (v): lặp lại • Repetition (n): sự lặp lại • Repeatedly (adv): liên tục'],
          ['Resilience', '/rɪˈzɪliəns/', 'n', 'Khả năng phục hồi, tính kiên cường', '• Resilient (adj): kiên cường, mau hồi phục • Resiliently (adv): một cách kiên cường'],
          ['Spread', '/spred/', 'v, n', '- (v) Lây lan, truyền bá - (n) Sự lan truyền', '—'],
          ['Stamina', '/ˈstæmɪnə/', 'n', 'Thể lực dẻo dai, sức bền', '—'],
          ['Strength', '/streŋθ/', 'n', 'Sức mạnh, thể lực', '• Strong (adj): mạnh mẽ • Strongly (adv): một cách mạnh mẽ • Strengthen (v): củng cố, làm mạnh thêm'],
          ['Suffer', '/ˈsʌfə(r)/', 'v', 'Chịu đựng, đau khổ (+ from: mắc bệnh)', '• Sufferer (n): người chịu đau đớn, bệnh nhân • Suffering (n): nỗi đau đớn, sự chịu đựng'],
          ['Treatment', '/ˈtriːtmənt/', 'n', 'Phương pháp điều trị, sự chữa bệnh', '• Treat (v): điều trị, chữa trị • Treatable (adj): có thể chữa khỏi • Untreatable (adj): không thể chữa trị'],
          ['Tuberculosis', '/tjuːˌbɜːkjuˈləʊsɪs/', 'n', 'Bệnh lao phổi (viết tắt là TB)', '• Tubercular (adj): liên quan đến bệnh lao'],
          ['Vaccine', '/ˈvæksiːn/', 'n', 'Vắc-xin phòng bệnh', '• Vaccinate (v): tiêm chủng vắc-xin • Vaccination (n): sự tiêm chủng • Vaccinated (adj): đã được tiêm phòng'],
          ['Virus', '/ˈvaɪrəs/', 'n', 'Vi-rút', '• Viral (adj): do vi-rút gây ra; lan truyền nhanh'],
          ['Wellness', '/ˈwelnəs/', 'n', 'Tình trạng khỏe mạnh toàn diện', '• Well (adj, adv): khỏe, tốt'],
        ],
      },
      {
        section: '2. Cụm từ, Động tác thể dục & Thói quen (Phrasal Verbs, Exercises & Habits)',
        role: 'note',
        rows: [
          ['Cut down on', '/ˌkʌt ˈdaʊn ɒn/', 'phr v', 'Cắt giảm (lượng tiêu thụ...)', '• Cut down on sugar/fat: cắt giảm đường/chất béo'],
          ['Give up', '/ˌɡɪv ˈʌp/', 'phr v', 'Từ bỏ (thói quen xấu...)', '• Give up smoking / junk food (+ V-ing / Noun)'],
          ['Work out', '/ˌwɜːk ˈaʊt/', 'phr v', 'Tập thể dục, luyện thể hình', '• Danh từ ghép: Workout (n) - buổi tập luyện'],
          ['Press-up', '/ˈpres ʌp/', 'n', 'Động tác chống đẩy (hít đất)', 'Đồng nghĩa: push-up'],
          ['Squat', '/skwɒt/', 'n, v', '- (n) Động tác ngồi xổm đứng lên - (v) Ngồi xổm', 'Động tác tập nhóm cơ mông, đùi'],
          ['Star jump', '/ˈstɑː dʒʌmp/', 'n', 'Động tác nhảy dang rộng hai tay và hai chân', 'Đồng nghĩa: jumping jack'],
          ['Food poisoning', '/ˈfuːd ˌpɔɪzənɪŋ/', 'np', 'Tình trạng ngộ độc thực phẩm', '• Poison (n/v): chất độc / đầu độc • Poisonous (adj): có độc'],
        ],
      },
      {
        section: '3. Từ vựng mở rộng & Chuyên đề sức khỏe (Extended Topic Vocabulary)',
        role: 'family',
        rows: [
          ['Centenarian', '/ˌsentəˈneəriən/', 'n', 'Người đại thọ (từ 100 tuổi trở lên)', '• Century (n): thế kỷ'],
          ['Diabetes', '/ˌdaɪəˈbiːtiːz/', 'n', 'Bệnh tiểu đường', '• Diabetic (n, adj): người bị tiểu đường; thuộc bệnh tiểu đường'],
          ['Dizzy', '/ˈdɪzi/', 'adj', 'Choáng váng, chóng mặt', '• Dizziness (n): cảm giác chóng mặt'],
          ['Fever', '/ˈfiːvər/', 'n', 'Cơn sốt', '• Feverish (adj): có triệu chứng sốt'],
          ['Kidney', '/ˈkɪdni/', 'n', 'Quả thận', '—'],
          ['Liver', '/ˈlɪvər/', 'n', 'Lá gan', '—'],
          ['Lung', '/lʌŋ/', 'n', 'Lá phổi', '—'],
          ['Meditation', '/ˌmedɪˈteɪʃn/', 'n', 'Sự thiền định', '• Meditate (v): thiền định • Meditative (adj): trầm ngâm, tĩnh tại'],
          ['Mental health', '/ˈmentl helθ/', 'np', 'Sức khỏe tinh thần', '• Mental (adj): thuộc tâm lý, trí tuệ • Mentally (adv): về mặt tâm trí'],
          ['Moderation', '/ˌmɒdəˈreɪʃn/', 'n', 'Sự điều độ, chừng mực', '• Moderate (adj, v): vừa phải, điều tiết • Moderately (adv): mức độ vừa phải'],
          ['Obesity', '/əʊˈbiːsəti/', 'n', 'Tình trạng bệnh béo phì', '• Obese (adj): béo phì'],
          ['Pass away', '/ˌpɑːs əˈweɪ/', 'phr v', 'Qua đời, từ trần (cách nói trang trọng thay cho die)', '—'],
          ['Therapy', '/ˈθerəpi/', 'n', 'Liệu pháp trị liệu', '• Therapist (n): nhà trị liệu • Therapeutic (adj): có tính chữa lành'],
        ],
      },
    ],
  },
  {
    id: 'g11-gs-unit-2',
    grade: 'Lớp 11',
    curriculum: 'Tiếng Anh 11 - Global Success',
    unitNumber: 2,
    title: 'Unit 2: The Generation Gap',
    subtitle: 'Khoảng cách thế hệ, gia đình & thành ngữ giao tiếp',
    sections: [
      {
        section: '1. Từ vựng cốt lõi trong sách giáo khoa (Core Textbook Vocabulary)',
        role: 'family',
        rows: [
          ['Adapt', '/əˈdæpt/', 'v', 'Thích nghi, điều chỉnh, thay đổi cho phù hợp', '• Adaptation (n): sự thích nghi • Adaptable (adj): có khả năng thích nghi • Adaptability (n): tính thích ứng'],
          ['Argument', '/ˈɑːɡjumənt/', 'n', 'Cuộc tranh cãi, sự tranh luận, bàn cãi', '• Argue (v): tranh cãi, tranh luận • Arguable (adj): có thể tranh luận được • Arguably (adv): có thể cho rằng'],
          ['Characteristic', '/ˌkærəktəˈrɪstɪk/', 'n, adj', '- (n) Đặc tính, đặc điểm, nét riêng - (adj) Đặc thù, tiêu biểu, mang tính đặc trưng', '• Character (n): tính cách, đặc điểm • Characteristically (adv): một cách đặc trưng • Characterize (v): biểu thị đặc điểm'],
          ['Conflict', '/ˈkɒnflɪkt/', 'n, v', '- (n) Sự xung đột, va chạm, mâu thuẫn - (v) Đối lập, xung đột', '• Conflicting (adj): mâu thuẫn, trái ngược'],
          ['Curious', '/ˈkjʊəriəs/', 'adj', 'Tò mò, muốn tìm hiểu, hiếu kỳ', '• Curiosity (n): sự tò mò, tính hiếu kỳ • Curiously (adv): một cách tò mò'],
          ['Digital native', '/ˌdɪdʒɪtl ˈneɪtɪv/', 'np', 'Người sinh ra ở thời đại công nghệ số và Internet', '• Digital (adj): thuộc kỹ thuật số • Digitalize (v): số hóa • Native (adj, n): bản địa, người bản xứ'],
          ['Experience', '/ɪkˈspɪəriəns/', 'n, v', '- (n) Kinh nghiệm, trải nghiệm - (v) Trải nghiệm, nếm trải', '• Experienced (adj): có kinh nghiệm, giàu kinh nghiệm • Inexperienced (adj): thiếu kinh nghiệm'],
          ['Extended family', '/ɪkˌstendɪd ˈfæməli/', 'np', 'Gia đình đa thế hệ, đại gia đình (ông bà, cha mẹ, con cái...)', '• Extend (v): kéo dài, mở rộng • Extension (n): sự mở rộng • Extensive (adj): rộng rãi, bao quát'],
          ['Freedom', '/ˈfriːdəm/', 'n', 'Sự tự do, quyền tự do', '• Free (adj, v): tự do; trả tự do • Freely (adv): một cách tự do'],
          ['Generation gap', '/ˌdʒenəˈreɪʃn ɡæp/', 'np', 'Khoảng cách giữa các thế hệ', '• Generate (v): tạo ra, phát sinh • Generation (n): thế hệ • Generational (adj): thuộc thế hệ'],
          ['Hire', '/ˈhaɪə(r)/', 'v, n', '- (v) Thuê nhân công, thuê người làm - (n) Sự thuê mướn', '• Hiring (n): việc tuyển dụng • Hired (adj): được thuê, làm thuê'],
          ['Honesty', '/ˈɒnəsti/', 'n', 'Tính trung thực, lòng chân thật', '• Honest (adj): thành thật, trung thực • Honestly (adv): một cách trung thực • Dishonest (adj): không trung thực • Dishonesty (n): tính bất lương'],
          ['Individualism', '/ˌɪndɪˈvɪdʒuəlɪzəm/', 'n', 'Chủ nghĩa cá nhân', '• Individual (n, adj): cá nhân; riêng lẻ • Individuality (n): cá tính • Individualistic (adj): mang tính cá nhân • Individualistically (adv)'],
          ['Influence', '/ˈɪnfluəns/', 'v, n', '- (v) Gây ảnh hưởng, tác động - (n) Sự ảnh hưởng, tầm ảnh hưởng', '• Influential (adj): có sức ảnh hưởng lớn • Influencer (n): người có tầm ảnh hưởng'],
          ['Limit', '/ˈlɪmɪt/', 'v, n', '- (v) Giới hạn, tiết chế, hạn chế - (n) Hạn mức, ranh giới, giới hạn', '• Limitation (n): sự hạn chế, mặt hạn chế • Limited (adj): bị giới hạn, hạn chế • Limitless / Unlimited (adj): vô hạn, không giới hạn'],
          ['Nuclear family', '/ˌnjuːkliə ˈfæməli/', 'np', 'Gia đình hạt nhân (chỉ gồm 1-2 thế hệ: bố mẹ và con cái)', '• Nuclear (adj): thuộc hạt nhân'],
          ['Screen time', '/ˈskriːn taɪm/', 'np', 'Thời gian sử dụng thiết bị điện tử có màn hình', '• Screen (n, v): màn hình; chiếu, sàng lọc'],
          ['Social media', '/ˌsəʊʃl ˈmiːdiə/', 'np', 'Mạng xã hội, phương tiện truyền thông mạng xã hội', '• Society (n): xã hội • Social (adj): thuộc về xã hội'],
          ['Value', '/ˈvæljuː/', 'n, v', '- (n) Giá trị, ý nghĩa - (v) Coi trọng, đánh giá cao', '• Valuable (adj): có giá trị cao, quý giá • Invaluable (adj): vô giá, cực kỳ quý báu • Valueless / Worthless (adj): không có giá trị • Valuation (n): sự định giá'],
          ['View', '/vjuː/', 'n, v', '- (n) Quan điểm, góc nhìn, tầm nhìn - (v) Nhìn nhận, quan sát, xem xét', '• Viewpoint (n): điểm nhìn, quan điểm • Viewer (n): người xem, người theo dõi'],
        ],
      },
      {
        section: '2. Từ vựng mở rộng & Bổ trợ theo chủ đề (Expanded & Exam Vocabulary)',
        role: 'family',
        rows: [
          ['Advice', '/ədˈvaɪs/', 'n', 'Lời khuyên, ý kiến chỉ dẫn', '• Advise (v): khuyên bảo, chỉ dẫn • Adviser / Advisor (n): cố vấn • Advisable (adj): nên làm, thích hợp'],
          ['Ancestor', '/ˈænsestə(r)/', 'n', 'Tổ tiên, ông bà cụ kỵ', '• Ancestral (adj): thuộc về tổ tiên • Ancestry (n): dòng dõi, gia thế'],
          ['Attitude', '/ˈætɪtjuːd/', 'n', 'Thái độ, quan điểm về điều gì', '• Attitudinal (adj): thuộc về thái độ'],
          ['Behavior / Behaviour', '/bɪˈheɪvjə(r)/', 'n', 'Cách cư xử, hành vi', '• Behave (v): cư xử • Misbehave (v): cư xử tệ, quấy rầy • Behavioral (adj): thuộc về hành vi • Well-behaved (adj): ngoan ngoãn'],
          ['Belief', '/bɪˈliːf/', 'n', 'Niềm tin, tín ngưỡng, quan niệm', '• Believe (v): tin tưởng • Believable (adj): có thể tin được • Unbelievable (adj): không thể tin nổi'],
          ['Breadwinner', '/ˈbredwɪnə(r)/', 'n', 'Trụ cột kinh tế trong gia đình', '—'],
          ['Burden', '/ˈbɜːdn/', 'n, v', '- (n) Gánh nặng (trách nhiệm, tài chính) - (v) Đè nặng lên ai', '• Burdensome (adj): nặng nề, phiền toái'],
          ['Common', '/ˈkɒmən/', 'adj, n', '- (adj) Chung, phổ biến, thông thường - (n) Điểm chung (trong cụm have in common)', '• Commonly (adv): thông thường • Commonality (n): sự tương đồng'],
          ['Curfew', '/ˈkɜːfjuː/', 'n', 'Lệnh giới nghiêm, giờ giới nghiêm về nhà', '—'],
          ['Disapproval', '/ˌdɪsəˈpruːvl/', 'n', 'Sự không tán thành, sự phản đối', '• Approve (v): tán thành • Approval (n): sự chấp thuận • Disapprove (v): phản đối, không đồng tình'],
          ['Elegant', '/ˈelɪɡənt/', 'adj', 'Thanh lịch, tao nhã', '• Elegance (n): sự thanh lịch • Elegantly (adv): một cách thanh nhã'],
          ['Flashy', '/ˈflæʃi/', 'adj', 'Hào nhoáng, diện, phô trương', '• Flash (n, v): ánh sáng lóe; phô bày • Flashiness (n): tính hào nhoáng'],
          ['Force', '/fɔːs/', 'v, n', '- (v) Ép buộc, bắt buộc - (n) Lực lượng, sức mạnh ép buộc', '• Forceful (adj): mạnh mẽ, đầy sức thuyết phục • Forced (adj): bị gượng gạo, bị ép buộc'],
          ['Impose', '/ɪmˈpəʊz/', 'v', 'Áp đặt, bắt chịu đựng (+ on/upon sb)', '• Imposition (n): sự áp đặt • Imposing (adj): oai nghiêm, hùng vĩ'],
          ['Judge', '/dʒʌdʒ/', 'v, n', '- (v) Phán xét, đánh giá - (n) Thẩm phán, giám khảo', '• Judgment / Judgement (n): sự phán đoán, đánh giá • Judgmental (adj): hay xét nét, hay phán xét'],
          ['Mature', '/məˈtʃʊə(r)/', 'adj, v', '- (adj) Trưởng thành, chín chắn - (v) Trở nên chín chắn', '• Maturity (n): sự trưởng thành, chín chắn • Immature (adj): non nớt, chưa trưởng thành • Immaturity (n): tính thiếu chín chắn'],
          ['Multi-generational', '/ˌmʌlti ˌdʒenəˈreɪʃənl/', 'adj', 'Đa thế hệ, gồm nhiều thế hệ cùng chung sống', '—'],
          ['Norm', '/nɔːm/', 'n', 'Chuẩn mực xã hội, quy chuẩn', '• Normal (adj): bình thường • Normalize (v): bình thường hóa'],
          ['Obey', '/əˈbeɪ/', 'v', 'Vâng lời, tuân theo', '• Obedience (n): sự vâng lời, tuân thủ • Obedient (adj): biết vâng lời • Disobey (v): cãi lời, không tuân theo • Disobedient (adj): ngỗ nghịch'],
          ['Objection', '/əbˈdʒekʃn/', 'n', 'Sự phản đối, sự phản kháng', '• Object (v): phản đối (+ to V-ing) • Objective (adj, n): khách quan; mục tiêu • Objectionable (adj): đáng chê trách'],
          ['Open-minded', '/ˌəʊpən ˈmaɪndɪd/', 'adj', 'Cởi mở, khoáng đạt', '• Open-mindedness (n): tư tưởng cởi mở • Narrow-minded (adj): hẹp hòi, bảo thủ'],
          ['Respect', '/rɪˈspekt/', 'v, n', '- (v) Tôn trọng, kính trọng - (n) Sự tôn trọng', '• Respectful (adj): có thái độ tôn trọng • Respectable (adj): đáng kính, đứng đắn • Respective (adj): tương ứng • Disrespect (n, v): sự bất kính, coi thường'],
          ['Responsible', '/rɪˈspɒnsəbl/', 'adj', 'Có trách nhiệm', '• Responsibility (n): tinh thần/trách nhiệm • Responsibly (adv): một cách có trách nhiệm • Irresponsible (adj): vô trách nhiệm'],
          ['Trend', '/trend/', 'n, v', '- (n) Xu thế, xu hướng - (v) Trở thành xu hướng', '• Trendy (adj): hợp thời, theo mốt • Trending (adj): đang thịnh hành'],
        ],
      },
      {
        section: '3. Cụm từ cố định & Thành ngữ thường gặp (Collocations, Phrasal Verbs & Idioms)',
        role: 'note',
        rows: [
          ['Bridge the gap', '/brɪdʒ ðə ɡæp/', '', 'Thu hẹp khoảng cách', '• Bridge the generation gap: thu hẹp khoảng cách thế hệ'],
          ['Follow in one\'s footsteps', '/ˈfɒləʊ ɪn wʌnz ˈfʊtsteps/', '', 'Nối nghiệp, theo gót ai', '• Follow in parents\' footsteps: theo nghề nghiệp của bố mẹ'],
          ['Have something in common', '/hæv ... ɪn ˈkɒmən/', '', 'Có điểm chung', '• Have a lot / nothing in common: có nhiều / không có điểm chung'],
          ['Get together', '/ɡet təˈɡeðə(r)/', '', 'Tụ họp, sum vầy gia đình', '• Get together for a family dinner: tụ họp ăn tối'],
          ['The black sheep of the family', '/ðə blæk ʃiːp əv ðə ˈfæməli/', '', 'Thành viên khác biệt / cá biệt trong nhà', 'Dùng để chỉ người có lối sống, tính cách đối nghịch với tập thể gia đình'],
          ['One\'s own flesh and blood', '/wʌnz əʊn fleʃ ənd blʌd/', '', 'Người thân máu mủ ruột rà', 'Nhấn mạnh tình cảm ruột thịt gia đình'],
          ['Blood is thicker than water', '/blʌd ɪz ˈθɪkə ðən ˈwɔːtə/', '', 'Một giọt máu đào hơn ao nước lã', 'Thành ngữ khẳng định tình thân luôn đặt lên hàng đầu'],
          ['Look up to somebody', '/lʊk ʌp tuː/', '', 'Kính trọng, ngưỡng mộ ai đó', 'Trái nghĩa: look down on somebody (coi thường)'],
          ['Financial burden', '/faɪˈnænʃl ˈbɜːdn/', '', 'Gánh nặng tài chính', 'Áp lực chi phí sinh hoạt gia đình'],
          ['Traditional values', '/trəˈdɪʃənl ˈvæljuːz/', '', 'Các giá trị truyền thống', 'Quan niệm đạo đức, nề nếp gia đình xưa'],
        ],
      },
    ],
  },
  {
    id: 'g11-gs-unit-3',
    grade: 'Lớp 11',
    curriculum: 'Tiếng Anh 11 - Global Success',
    unitNumber: 3,
    title: 'Unit 3: Cities of the Future',
    subtitle: 'Đô thị thông minh, hạ tầng xanh & cụm từ đô thị hóa',
    sections: [
      {
        section: '1. Từ vựng cốt lõi trong sách giáo khoa (Core Textbook Vocabulary)',
        role: 'family',
        rows: [
          ['Article', '/ˈɑːtɪkl/', 'n', 'Bài báo, bài viết; điều khoản', '• Articled (adj): theo học việc/hợp đồng'],
          ['Card reader', '/ˈkɑːd ˌriːdə(r)/', 'np', 'Thiết bị đọc thẻ, đầu đọc thẻ', '• Read (v): đọc • Readable (adj): dễ đọc'],
          ['City dweller', '/ˈsɪti ˈdwelə(r)/', 'np', 'Người dân thành phố, cư dân thành thị', '• Dwell (v): sinh sống, cư ngụ • Dwelling (n): nhà ở, nơi ở'],
          ['Cycle path', '/ˈsaɪkl pɑːθ/', 'np', 'Làn đường/đường dành cho xe đạp', '• Cyclist (n): người đi xe đạp • Cycling (n): môn đạp xe'],
          ['Detect', '/dɪˈtekt/', 'v', 'Dò tìm, nhận biết, phát hiện ra', '• Detection (n): sự phát hiện, dò tìm • Detector (n): thiết bị dò tìm • Detectable (adj): có thể phát hiện được • Detective (n): thám tử'],
          ['Dweller', '/ˈdwelə(r)/', 'n', 'Cư dân, người cư ngụ', '• Dwell (v): ngụ tại, trú ngụ • Dwelling (n): chỗ ở'],
          ['Eco-friendly', '/ˈiːkəʊ ˈfrendli/', 'adj', 'Thân thiện với môi trường, sinh thái', '• Ecology (n): sinh thái học • Ecological (adj): thuộc sinh thái • Eco-friendliness (n): tính thân thiện môi trường'],
          ['Efficiently', '/ɪˈfɪʃntli/', 'adv', 'Một cách có hiệu quả, hiệu suất cao', '• Efficiency (n): hiệu suất, năng suất • Efficient (adj): có hiệu quả • Inefficient (adj): kém hiệu quả • Inefficiently (adv): không hiệu quả'],
          ['Emission', '/ɪˈmɪʃn/', 'n', 'Khí thải, sự tỏa ra / phát thải', '• Emit (v): phát ra, tỏa ra (nhiệt, khí) • Emitter (n): nguồn phát thải'],
          ['Futuristic', '/ˌfjuːtʃəˈrɪstɪk/', 'adj', 'Thuộc về tương lai, mang hơi hướng tương lai', '• Future (n, adj): tương lai • Futurism (n): chủ nghĩa vị lai'],
          ['High-rise', '/ˈhaɪ raɪz/', 'adj, n', '- (adj) Cao tầng, có nhiều tầng - (n) Tòa nhà cao tầng', '• Rise (v, n): gia tăng; mọc lên'],
          ['Impact', '/ˈɪmpækt/', 'n, v', '- (n) Tác động, ảnh hưởng (+ on) - (v) Tác động mạnh vào', '• Impacted (adj): bị tác động, chịu ảnh hưởng'],
          ['Infrastructure', '/ˈɪnfrəstrʌktʃə(r)/', 'n', 'Cơ sở hạ tầng', '• Infrastructural (adj): thuộc về cơ sở hạ tầng'],
          ['Inhabitant', '/ɪnˈhæbɪtənt/', 'n', 'Cư dân, người cư trú', '• Inhabit (v): sinh sống, cư trú • Inhabitable (adj): có thể ở được • Uninhabitable (adj): không thể sinh sống được'],
          ['Innovation', '/ˌɪnəˈveɪʃn/', 'n', 'Sự đổi mới, sáng kiến cải tiến', '• Innovate (v): đổi mới, cách tân • Innovative (adj): mang tính đổi mới, sáng tạo • Innovator (n): nhà cách tân'],
          ['Install', '/ɪnˈstɔːl/', 'v', 'Cài đặt, lắp đặt (thiết bị, công nghệ)', '• Installation (n): sự lắp đặt, thiết bị cài đặt • Installer (n): nhân viên lắp đặt'],
          ['Interact', '/ˌɪntərˈækt/', 'v', 'Tương tác, tác động qua lại (+ with)', '• Interaction (n): sự tương tác • Interactive (adj): có tính tương tác • Interactively (adv)'],
          ['Liveable', '/ˈlɪvəbl/', 'adj', 'Đáng sống, thích hợp để định cư', '• Live (v): sinh sống • Livability (n): khả năng/điều kiện sống tốt • Unliveable (adj): không thể sống nổi'],
          ['Neighbourhood', '/ˈneɪbəhʊd/', 'n', 'Khu dân cư, khu phố, tình hàng xóm', '• Neighbour (n): người hàng xóm • Neighbouring (adj): lân cận, bên cạnh'],
          ['Operate', '/ˈɒpəreɪt/', 'v', 'Vận hành, chạy (máy móc), hoạt động', '• Operation (n): sự vận hành, hoạt động • Operational (adj): thuộc vận hành, sẵn sàng hoạt động • Operator (n): người vận hành'],
          ['Pedestrian', '/pəˈdestriən/', 'n, adj', '- (n) Người đi bộ, khách bộ hành - (adj) Dành cho người đi bộ; buồn tẻ', '• Pedestrianise (v): biến thành phố đi bộ • Pedestrian-friendly (adj): thuận tiện cho người đi bộ'],
          ['Predict', '/prɪˈdɪkt/', 'v', 'Dự đoán, tiên đoán trước', '• Prediction (n): lời dự đoán • Predictable (adj): có thể đoán trước • Unpredictable (adj): khó đoán • Predictive (adj): mang tính tiên tri'],
          ['Privacy', '/ˈprɪvəsi/', 'n', 'Sự riêng tư, quyền riêng tư', '• Private (adj): riêng tư, cá nhân • Privately (adv): một cách riêng tư'],
          ['Reduce', '/rɪˈdjuːs/', 'v', 'Cắt giảm, giảm bớt', '• Reduction (n): sự thu giảm, hạ bớt • Reduced (adj): bị giảm đi • Reducible (adj): có thể giảm bớt'],
          ['Renewable', '/rɪˈnjuːəbl/', 'adj', 'Có thể tái tạo được (năng lượng...)', '• Renew (v): tái tạo, gia hạn • Renewal (n): sự đổi mới, phục hồi • Non-renewable (adj): không thể tái tạo được'],
          ['Roof garden', '/ˈruːf ˌɡɑːdn/', 'np', 'Vườn trên sân thượng / mái nhà', '• Rooftop (n): tầng mái'],
          ['Sense of community', '/sens əv kəˈmjuːnəti/', 'np', 'Ý thức cộng đồng, tinh thần gắn kết khu phố', '• Community (n): cộng đồng • Communal (adj): thuộc cộng đồng'],
          ['Sensor', '/ˈsensə(r)/', 'n', 'Bộ cảm biến, thiết bị cảm ứng', '• Sense (n, v): giác quan; cảm nhận • Sensory (adj): thuộc cảm giác, giác quan • Sensitive (adj): nhạy cảm'],
          ['Skyscraper', '/ˈskaɪskreɪpə(r)/', 'n', 'Tòa nhà chọc trời', '—'],
          ['Smart city', '/ˈsmɑːt ˈsɪti/', 'np', 'Thành phố thông minh (ứng dụng AI & IoT)', '—'],
          ['Sustainable', '/səˈsteɪnəbl/', 'adj', 'Bền vững, có thể duy trì lâu dài', '• Sustainability (n): tính bền vững • Sustain (v): duy trì, chống đỡ • Sustainably (adv): một cách bền vững • Unsustainable (adj): không bền vững'],
          ['Technological', '/ˌteknəˈlɒdʒɪkl/', 'adj', 'Thuộc về công nghệ', '• Technology (n): công nghệ • Technologically (adv): về mặt công nghệ • Technologist (n): chuyên gia công nghệ'],
          ['Urban centre', '/ˈɜːbən ˈsentə(r)/', 'np', 'Trung tâm đô thị, khu vực lõi đô thị', '• Urban (adj): thuộc thành thị • Urbanite (n): người thành thị'],
          ['Urbanization', '/ˌɜːbənaɪˈzeɪʃn/', 'n', 'Quá trình đô thị hóa', '• Urbanize (v): đô thị hóa • Urbanized (adj): đã đô thị hóa'],
        ],
      },
      {
        section: '2. Từ vựng mở rộng & Nâng cao về đô thị tương lai (Extended Topic Vocabulary)',
        role: 'family',
        rows: [
          ['Agriculture', '/ˈæɡrɪkʌltʃə(r)/', 'n', 'Ngành nông nghiệp, canh tác', '• Agricultural (adj): thuộc nông nghiệp • Agriculturalist (n): nhà nông học'],
          ['Amenity', '/əˈmiːnəti/', 'n', 'Tiện ích sinh hoạt (công viên, hồ bơi...)', '• Amenity-rich (adj): giàu tiện ích'],
          ['Biodiversity', '/ˌbaɪəʊdaɪˈvɜːsəti/', 'n', 'Đa dạng sinh học', '• Diverse (adj): đa dạng • Diversify (v): đa dạng hóa'],
          ['Carbon footprint', '/ˌkɑːbən ˈfʊtprɪnt/', 'np', 'Dấu chân carbon (lượng phát thải khí nhà kính)', '—'],
          ['Congested', '/kənˈdʒestɪd/', 'adj', 'Bị tắc nghẽn, kẹt cứng (xe cộ, đường sá)', '• Congestion (n): sự ùn tắc giao thông'],
          ['Cosmopolitan', '/ˌkɒzməˈpɒlɪtən/', 'adj, n', '- (adj) Có tính quốc tế, quy tụ người từ khắp nơi - (n) Người theo chủ nghĩa thế giới', '• Cosmopolitanism (n): chủ nghĩa thế giới'],
          ['Cybercrime', '/ˈsaɪbəkraɪm/', 'n', 'Tội phạm không gian mạng, tội phạm mạng', '• Cybercriminal (n): tội phạm mạng'],
          ['Employment', '/ɪmˈplɔɪmənt/', 'n', 'Việc làm, công ăn việc làm', '• Employ (v): tuyển dụng • Employer (n): nhà tuyển dụng • Employee (n): người làm công • Unemployment (n): tình trạng thất nghiệp'],
          ['Industry', '/ˈɪndəstri/', 'n', 'Ngành công nghiệp; tính chăm chỉ', '• Industrial (adj): thuộc công nghiệp • Industrialize (v): công nghiệp hóa • Industrialization (n): sự công nghiệp hóa • Industrious (adj): siêng năng, cần cù'],
          ['Metropolitan', '/ˌmetrəˈpɒlɪtən/', 'adj', 'Thuộc vùng đô thị lớn, thủ phủ', '• Metropolis (n): đô thị lớn, thủ phủ'],
          ['Optimistic', '/ˌɒptɪˈmɪstɪk/', 'adj', 'Lạc quan (+ about)', '• Optimism (n): tính lạc quan • Optimist (n): người lạc quan • Optimistically (adv)'],
          ['Overcrowded', '/ˌəʊvəˈkraʊdɪd/', 'adj', 'Quá tải, đông nghịt người', '• Crowd (n, v): đám đông; tụ tập • Crowded (adj): đông đúc • Overcrowding (n): tình trạng quá tải dân số'],
          ['Pessimistic', '/ˌpesɪˈmɪstɪk/', 'adj', 'Bi quan (+ about)', '• Pessimism (n): tính bi quan • Pessimist (n): người bi quan • Pessimistically (adv)'],
          ['Pollution', '/pəˈluːʃn/', 'n', 'Sự ô nhiễm', '• Pollute (v): làm ô nhiễm • Pollutant (n): chất gây ô nhiễm • Polluted (adj): bị ô nhiễm'],
          ['Resident', '/ˈrezɪdənt/', 'n, adj', '- (n) Người dân, cư dân định cư - (adj) Cư trú', '• Reside (v): sinh sống, cư trú • Residence (n): nơi cư trú, dinh thự • Residential (adj): thuộc khu dân cư • Residency (n): quyền cư trú'],
          ['Suburb', '/ˈsʌbɜːb/', 'n', 'Vùng ngoại ô', '• Suburban (adj): thuộc ngoại ô • Suburbanite (n): người sống ở ngoại ô'],
          ['Upgrade', '/ˌʌpˈɡreɪd/', 'v, n', '- (v) Nâng cấp, cải tiến - (n) Sự nâng cấp', '• Upgraded (adj): đã được nâng cấp'],
        ],
      },
      {
        section: '3. Cụm từ cố định, Cụm động từ & Thành ngữ (Collocations & Idioms)',
        role: 'note',
        rows: [
          ['Get around', '/ɡet əˈraʊnd/', '', 'Đi lại, di chuyển quanh thành phố', '• Get around the city by bus: di chuyển quanh thành phố bằng xe buýt'],
          ['Hustle and bustle', '/ˈhʌsl ənd ˈbʌsl/', '', 'Sự ồn ào náo nhiệt, hối hả của phố xá', '• Escape the hustle and bustle of city life: thoát khỏi sự xô bồ đô thị'],
          ['Hit the road', '/hɪt ðə rəʊd/', '', 'Lên đường, khởi hành chuyến đi', 'Idiom giao tiếp chỉ việc xuất phát'],
          ['Rush hour', '/ˈrʌʃ ˌaʊə(r)/', '', 'Giờ cao điểm', '• During/in the rush hour: trong khung giờ kẹt xe cao điểm'],
          ['Traffic jam / congestion', '/ˈtræfɪk dʒæm/', '', 'Tình trạng tắc đường, kẹt xe', '• Cause / get stuck in a traffic jam: gây ra / bị kẹt xe'],
          ['Computer-controlled', '/kəmˈpjuːtə kənˈtrəʊld/', '', 'Được điều khiển/vận hành bằng máy tính', '• Computer-controlled transport system: hệ thống giao thông tự động'],
          ['Driverless bus / vehicle', '/ˈdraɪvələs bʌs/', '', 'Xe buýt/phương tiện không người lái', 'Ứng dụng công nghệ xe tự hành của tương lai'],
          ['Quality of life', '/ˌkwɒləti əv ˈlaɪf/', '', 'Chất lượng cuộc sống', '• Improve the quality of life: nâng cao chất lượng đời sống cư dân'],
          ['Cope with', '/kəʊp wɪð/', '', 'Đương đầu với, giải quyết vấn đề', '• Cope with population growth: giải quyết bài toán gia tăng dân số'],
          ['Green space / Green area', '/ɡriːn speɪs/', '', 'Không gian xanh, khuôn viên cây xanh', 'Tiêu chuẩn đánh giá đô thị sinh thái'],
          ['Waste collection / management', '/weɪst kəˈlekʃn/', '', 'Thu gom và xử lý rác thải', 'Hệ thống quản lý môi trường thông minh'],
        ],
      },
    ],
  },
  {
    id: 'g11-gs-unit-4',
    grade: 'Lớp 11',
    curriculum: 'Tiếng Anh 11 - Global Success',
    unitNumber: 4,
    title: 'Unit 4: ASEAN and Viet Nam',
    subtitle: 'ASEAN, ngoại giao, văn hóa & hoạt động giao lưu khu vực',
    sections: [
      {
        section: '1. Từ vựng cốt lõi trong sách giáo khoa (Core Textbook Vocabulary)',
        role: 'family',
        rows: [
          ['Apply', '/əˈplaɪ/', 'v', 'Nộp đơn, ứng tuyển (+ for), áp dụng', '• Application (n): đơn xin việc, sự ứng dụng • Applicant (n): người nộp đơn • Appliance (n): thiết bị gia dụng • Applicable (adj): có thể áp dụng'],
          ['Beneficial', '/ˌbenɪˈfɪʃl/', 'adj', 'Có lợi, có ích (+ to)', '• Benefit (n, v): lợi ích; hưởng lợi • Beneficiary (n): người thụ hưởng • Advantageous (adj): có lợi'],
          ['Celebration', '/ˌselɪˈbreɪʃn/', 'n', 'Lễ kỷ niệm, sự tổ chức ăn mừng', '• Celebrate (v): kỷ niệm, ăn mừng • Celebratory (adj): mang tính kỷ niệm • Celebrity (n): người nổi tiếng'],
          ['Community', '/kəˈmjuːnəti/', 'n', 'Cộng đồng', '• Communal (adj): thuộc cộng đồng • Communally (adv): một cách công cộng'],
          ['Compliment', '/ˈkɒmplɪmənt/', 'n, v', '- (n) Lời khen ngợi - (v) Khen ngợi, ca tụng', '• Complimentary (adj): mang tính khen ngợi; miễn phí'],
          ['Contribution', '/ˌkɒntrɪˈbjuːʃn/', 'n', 'Sự đóng góp, cống hiến (+ to)', '• Contribute (v): đóng góp, góp phần (+ to) • Contributor (n): người đóng góp • Contributory (adj): có tính đóng góp'],
          ['Current', '/ˈkʌrənt/', 'adj, n', '- (adj) Hiện tại, hiện hành, đang lưu hành - (n) Dòng chảy, dòng điện', '• Currently (adv): hiện nay, thời điểm hiện tại • Currency (n): đơn vị tiền tệ'],
          ['Development', '/dɪˈveləpmənt/', 'n', 'Sự phát triển', '• Develop (v): phát triển • Developer (n): nhà phát triển • Developing (adj): đang phát triển • Developed (adj): đã phát triển'],
          ['Exchange', '/ɪksˈtʃeɪndʒ/', 'n, v', '- (n) Sự trao đổi, giao lưu - (v) Trao đổi, đổi chác', '• Exchangeable (adj): có thể trao đổi được'],
          ['Eye-opening', '/ˈaɪ ˌəʊpənɪŋ/', 'adj', 'Mở mang tầm mắt, mở rộng hiểu biết', '• Eye-opener (n): trải nghiệm / bài học mở mang tầm mắt'],
          ['Honour', '/ˈɒnə(r)/', 'n, v', '- (n) Danh dự, niềm vinh dự - (v) Vinh danh, tôn kính, tôn trọng', '• Honourable (adj): đáng kính trọng, đáng tôn vinh • Honorary (adj): danh dự (chức vụ...) • Dishonour (n, v): điều ô nhục, làm nhục'],
          ['Issue', '/ˈɪʃuː/', 'n, v', '- (n) Vấn đề - (v) Phát hành, ban hành', '• Problematic (adj): có vấn đề, khó giải quyết'],
          ['Leadership', '/ˈliːdəʃɪp/', 'n', 'Khả năng / cương vị lãnh đạo', '• Lead (v): dẫn đầu, lãnh đạo • Leader (n): nhà lãnh đạo, người đứng đầu'],
          ['Live-stream', '/ˈlaɪv striːm/', 'v, n', '- (v) Phát sóng trực tuyến / trực tiếp - (n) Buổi phát sóng trực tiếp', '• Live-streamed (adj): được phát sóng trực tiếp'],
          ['Participate', '/pɑːˈtɪsɪpeɪt/', 'v', 'Tham gia, dự phần (+ in)', '• Participant (n): người tham gia • Participation (n): sự tham gia • Participatory (adj): có tính tham gia'],
          ['Politics', '/ˈpɒlətɪks/', 'n', 'Chính trị, khoa học chính trị', '• Political (adj): thuộc về chính trị • Politician (n): chính trị gia • Politically (adv): về mặt chính trị'],
          ['Promote', '/prəˈməʊt/', 'v', 'Thúc đẩy, phát triển, quảng bá', '• Promotion (n): sự thăng tiến, sự khuyến khích • Promotional (adj): dùng để quảng cáo, khuyến mãi • Promoter (n): người thúc đẩy, người khởi xướng'],
          ['Proposal', '/prəˈpəʊzl/', 'n', 'Lời đề xuất, bản kiến nghị', '• Propose (v): đề xuất, đề nghị; cầu hôn • Proposed (adj): được đề xuất'],
          ['Prosperity', '/prɒˈsperəti/', 'n', 'Sự thịnh vượng, phồn vinh', '• Prosper (v): phát triển thịnh vượng • Prosperous (adj): phồn vinh, thịnh vượng • Prosperously (adv): một cách thịnh vượng'],
          ['Qualify', '/ˈkwɒlɪfaɪ/', 'v', 'Đủ tư cách, đủ điều kiện / khả năng', '• Qualified (adj): có đủ năng lực / điều kiện • Qualification (n): chứng chỉ, trình độ chuyên môn • Disqualify (v): tước quyền dự thi'],
          ['Region', '/ˈriːdʒən/', 'n', 'Khu vực, vùng miền', '• Regional (adj): thuộc vùng, thuộc khu vực • Regionally (adv): theo khu vực'],
          ['Relation', '/rɪˈleɪʃn/', 'n', 'Mối quan hệ, mối liên hệ', '• Relate (v): liên hệ, liên quan • Related (adj): có liên quan (+ to) • Relationship (n): mối quan hệ tình cảm / đối ngoại • Relative (n, adj): người bà con; tương đối'],
          ['Represent', '/ˌreprɪˈzent/', 'v', 'Đại diện cho, tượng trưng cho', '• Representative (n, adj): người đại diện; tiêu biểu • Representation (n): sự đại diện'],
          ['Strengthen', '/ˈstreŋθn/', 'v', 'Củng cố, tăng cường, làm mạnh thêm', '• Strength (n): sức mạnh, điểm mạnh • Strong (adj): mạnh mẽ • Strongly (adv): một cách mạnh mẽ'],
          ['Support', '/səˈpɔːt/', 'v, n', '- (v) Hỗ trợ, ủng hộ - (n) Sự giúp đỡ, hỗ trợ', '• Supportive (adj): có tính hỗ trợ, khuyến khích • Supporter (n): người ủng hộ'],
          ['Theme', '/θiːm/', 'n', 'Chủ đề, đề tài cốt lõi', '• Thematic (adj): theo chủ đề • Thematically (adv): theo chuyên đề'],
          ['Volunteer', '/ˌvɒlənˈtɪə(r)/', 'v, n', '- (v) Tình nguyện làm việc - (n) Tình nguyện viên', '• Voluntary (adj): tự nguyện, tình nguyện • Voluntarily (adv): một cách tự nguyện • Volunteering (n): công tác tình nguyện'],
          ['Youth', '/juːθ/', 'n', 'Tuổi trẻ, thanh niên, giới trẻ', '• Young (adj): trẻ tuổi • Youngster (n): thanh thiếu niên'],
        ],
      },
      {
        section: '2. Từ vựng mở rộng & Bổ trợ theo chủ đề ngoại giao, văn hóa (Extended & Exam Vocabulary)',
        role: 'family',
        rows: [
          ['Bloc / Block', '/blɒk/', 'n', 'Khối (liên minh các quốc gia, khối kinh tế)', '—'],
          ['Buddhism', '/ˈbʊdɪzəm/', 'n', 'Phật giáo', '• Buddhist (n, adj): phật tử; thuộc Phật giáo'],
          ['Conference', '/ˈkɒnfərəns/', 'n', 'Hội nghị, cuộc thảo luận trang trọng', '• Confer (v): bàn bạc, hội ý'],
          ['Constitution', '/ˌkɒnstɪˈtjuːʃn/', 'n', 'Hiến pháp', '• Constitutional (adj): thuộc hiến pháp'],
          ['Cooperate', '/kəʊˈɒpəreɪt/', 'v', 'Hợp tác, cộng tác', '• Cooperation (n): sự hợp tác • Cooperative (adj): có tính hợp tác • Uncooperative (adj): bất hợp tác'],
          ['Dispute', '/dɪˈspjuːt/', 'n, v', '- (n) Cuộc tranh chấp, bất đồng ngoại giao - (v) Bàn cãi, tranh chấp', '• Disputable (adj): có thể tranh chấp • Indisputable (adj): không thể bàn cãi'],
          ['Equal', '/ˈiːkwəl/', 'adj, v', '- (adj) Bình đẳng, công bằng - (v) Bằng với', '• Equality (n): sự bình đẳng • Inequality (n): sự bất bình đẳng • Unequal (adj): không công bằng • Equally (adv): một cách bình đẳng'],
          ['Folk', '/fəʊk/', 'adj, n', '- (adj) Thuộc về dân gian, truyền thống - (n) Dân chúng', '• Folklore (n): văn hóa dân gian'],
          ['Graceful', '/ˈɡreɪsfl/', 'adj', 'Duyên dáng, uyển chuyển, yêu kiều', '• Grace (n): vẻ duyên dáng • Gracefully (adv): một cách duyên dáng'],
          ['Initiative', '/ɪˈnɪʃətɪv/', 'n', 'Sáng kiến, bước khởi xướng', '• Initiate (v): khởi xướng, bắt đầu • Initiator (n): người khởi xướng'],
          ['Integrate', '/ˈɪntɪɡreɪt/', 'v', 'Hội nhập, hòa nhập (+ into/with)', '• Integration (n): sự hội nhập • Integrated (adj): tích hợp, hòa nhập'],
          ['Interference', '/ˌɪntəˈfɪərəns/', 'n', 'Sự can thiệp, can dự (+ in/with)', '• Interfere (v): can thiệp vào (+ in) • Interfering (adj): thích can thiệp'],
          ['Internal', '/ɪnˈtɜːnl/', 'adj', 'Nội bộ, ở bên trong', '• Internally (adv): về mặt nội bộ • External (adj): bên ngoài'],
          ['Maintain', '/meɪnˈteɪn/', 'v', 'Duy trì, giữ vững', '• Maintenance (n): sự duy trì, bảo trì'],
          ['Monk', '/mʌŋk/', 'n', 'Thầy tu, nhà sư', '—'],
          ['Motto', '/ˈmɒtəʊ/', 'n', 'Phương châm, khẩu hiệu hoạt động', '—'],
          ['Official', '/əˈfɪʃl/', 'adj, n', '- (adj) Chính thức - (n) Viên chức, cán bộ', '• Officially (adv): một cách chính thức • Unofficial (adj): không chính thức'],
          ['Parade', '/pəˈreɪd/', 'n, v', '- (n) Cuộc diễu hành - (v) Diễu hành', '—'],
          ['Populous', '/ˈpɒpjələs/', 'adj', 'Đông dân cư', '• Population (n): dân số • Overpopulated (adj): quá tải dân số'],
          ['Practical', '/ˈpræktɪkl/', 'adj', 'Thiết thực, thực tế', '• Practice (n, v): thực hành • Practically (adv): trên thực tế • Impractical (adj): không thực tế'],
          ['Principle', '/ˈprɪnsəpl/', 'n', 'Nguyên tắc, chuẩn mực đạo lý', '• Principled (adj): theo nguyên tắc'],
          ['Satisfy', '/ˈsætɪsfaɪ/', 'v', 'Làm thỏa mãn, đáp ứng yêu cầu', '• Satisfaction (n): sự hài lòng • Satisfactory (adj): đạt yêu cầu, thỏa đáng • Satisfied (adj): cảm thấy hài lòng (+ with)'],
          ['Scholarship', '/ˈskɒləʃɪp/', 'n', 'Học bổng', '• Scholar (n): học giả • Scholarly (adj): uyên bác'],
          ['Solidarity', '/ˌsɒlɪˈdærəti/', 'n', 'Tinh thần đoàn kết, sự nhất trí', '• Solidary (adj): đoàn kết'],
          ['Sponsor', '/ˈspɒnsə(r)/', 'n, v', '- (n) Nhà tài trợ - (v) Tài trợ', '• Sponsorship (n): sự tài trợ'],
          ['Stability', '/stəˈbɪləti/', 'n', 'Sự ổn định, tính bền vững', '• Stable (adj): ổn định • Stabilize (v): làm cho ổn định • Instability (n): sự bất ổn'],
          ['Vision', '/ˈvɪʒn/', 'n', 'Tầm nhìn, định hướng tương lai', '• Visionary (adj, n): nhìn xa trông rộng; người có tầm nhìn'],
        ],
      },
      {
        section: '3. Cụm từ cố định, Cụm động từ & Hoạt động văn hóa (Collocations, Phrasal Verbs & Cultural Activities)',
        role: 'note',
        rows: [
          ['Cultural exchange', '/ˈkʌltʃərəl ɪksˈtʃeɪndʒ/', '', 'Sự giao lưu / trao đổi văn hóa', '• Cultural exchange programme: chương trình giao lưu văn hóa'],
          ['Take part in', '/teɪk pɑːt ɪn/', '', 'Tham gia vào (= participate in = get involved in)', '• Take part in cultural activities: tham gia các hoạt động văn hóa'],
          ['Account for', '/əˈkaʊnt fɔː(r)/', '', 'Chiếm tỷ lệ, giải thích cho điều gì', '• Account for 8% of the world\'s population: chiếm 8% dân số thế giới'],
          ['Consist of', '/kənˈsɪst əv/', '', 'Bao gồm, gồm có (= comprise = be composed of)', '• ASEAN consists of 10 member states: ASEAN gồm 10 quốc gia thành viên'],
          ['In accordance with', '/ɪn əˈkɔːdns wɪð/', '', 'Phù hợp với, chiếu theo quy định/luật lệ', '• Act in accordance with the law: hành động theo đúng pháp luật'],
          ['Stand for', '/stænd fɔː(r)/', '', 'Viết tắt của, đại diện cho', '• Lao PDR stands for Lao People\'s Democratic Republic'],
          ['Put forward', '/pʊt ˈfɔːwəd/', '', 'Đưa ra, đề xuất một ý tưởng / kế hoạch', '• Put forward a proposal / a plan: đề xuất một kế hoạch'],
          ['Break the ice', '/breɪk ði aɪs/', '', 'Phá vỡ không khí ngại ngùng ban đầu', 'Cụm thành ngữ dùng trong các buổi gặp gỡ, giao lưu thanh niên'],
          ['Honour ancestors', '/ˈɒnə(r) ˈænsestəz/', '', 'Tỏ lòng tôn kính / tưởng nhớ tổ tiên', 'Phong tục truyền thống của các nước Đông Nam Á'],
          ['Bamboo dancing', '/bæmˈbuː ˈdɑːnsɪŋ/', '', 'Múa sạp', 'Trò chơi / điệu múa dân gian phổ biến'],
          ['Tug of war', '/ˌtʌɡ əv ˈwɔː(r)/', '', 'Trò chơi kéo co', 'Trò chơi dân gian gắn kết tinh thần đồng đội'],
          ['Stilt walking', '/ˈstɪlt ˌwɔːkɪŋ/', '', 'Trò chơi đi cà kheo', 'Hoạt động văn hóa truyền thống'],
          ['Scare away bad luck', '/skeə(r) əˈweɪ bæd lʌk/', '', 'Xua đuổi vận xui / điềm xấu', 'Tập tục trong các lễ hội đón năm mới tại Đông Nam Á'],
        ],
      },
    ],
  },
  {
    id: 'g11-gs-unit-5',
    grade: 'Lớp 11',
    curriculum: 'Tiếng Anh 11 - Global Success',
    unitNumber: 5,
    title: 'Unit 5: Global Warming',
    subtitle: 'Biến đổi khí hậu, môi trường & cụm từ sinh thái',
    sections: [
      {
        section: '1. Từ vựng cốt lõi trong sách giáo khoa (Core Textbook Vocabulary)',
        role: 'family',
        rows: [
          ['Atmosphere', '/ˈætməsfɪə(r)/', 'n', 'Khí quyển, bầu không khí', '• Atmospheric (adj): thuộc khí quyển • Atmospherically (adv)'],
          ['Balance', '/ˈbæləns/', 'n, v', '- (n) Sự cân bằng, thế cân bằng - (v) Giữ thăng bằng, làm cân bằng', '• Balanced (adj): cân bằng, điều độ • Balancing (n, adj): sự làm cân bằng • Unbalance (v, n): làm mất cân bằng • Imbalance (n): sự mất cân bằng'],
          ['Carbon dioxide', '/ˌkɑːbən daɪˈɒksaɪd/', 'n', 'Khí cacbonic (CO₂)', '• Carbon (n): cacbon • Carbon footprint (np): dấu chân carbon'],
          ['Coal', '/kəʊl/', 'n', 'Than đá', '• Coal-fired (adj): đốt bằng than đá • Coal mine (n): mỏ than'],
          ['Consequence', '/ˈkɒnsɪkwəns/', 'n', 'Hậu quả, hệ quả, kết quả', '• Consequent (adj): do hậu quả, do là kết quả của • Consequently (adv): do đó, vì vậy'],
          ['Deforestation', '/ˌdiːˌfɒrɪˈsteɪʃn/', 'n', 'Sự tàn phá rừng, nạn phá rừng', '• Forest (n): cánh rừng • Forestation (n): việc trồng rừng • Deforest (v): phá rừng • Reforestation (n): sự tái trồng rừng • Afforestation (n): sự trồng rừng mới'],
          ['Emission', '/ɪˈmɪʃn/', 'n', 'Khí thải, sự phát thải, sự tỏa ra', '• Emit (v): phát ra, thải ra, tỏa ra • Emitter (n): nguồn phát thải'],
          ['Environment', '/ɪnˈvaɪrənmənt/', 'n', 'Môi trường', '• Environmental (adj): thuộc về môi trường • Environmentally (adv): về mặt môi trường • Environmentalist (n): nhà môi trường học'],
          ['Farming', '/ˈfɑːmɪŋ/', 'n', 'Ngành nông nghiệp, công việc đồng áng', '• Farm (n, v): trang trại; canh tác • Farmer (n): người nông dân • Farmland (n): đất canh tác / chăn nuôi'],
          ['Fossil fuel', '/ˈfɒsl ˈfjuːəl/', 'np', 'Nhiên liệu hóa thạch (than đá, dầu mỏ...)', '• Fossil (n, adj): hóa thạch • Fossilize (v): hóa đá, hóa thạch'],
          ['Global warming', '/ˌɡləʊbl ˈwɔːmɪŋ/', 'np', 'Sự nóng lên toàn cầu', '• Globe (n): quả địa cầu • Global (adj): mang tính toàn cầu • Globally (adv): trên phạm vi toàn cầu • Globalize (v): toàn cầu hóa • Globalization (n): sự toàn cầu hóa • Warm (adj, v): ấm; làm ấm • Warmth (n): sự ấm áp'],
          ['Heat-trapping', '/ˈhiːt ˌtræpɪŋ/', 'adj', 'Giữ nhiệt, giữ nhiệt lượng', '• Heat (n, v): nhiệt lượng; làm nóng • Trap (v, n): bẫy, giữ lại; cái bẫy'],
          ['Human activity', '/ˈhjuːmən ækˈtɪvəti/', 'np', 'Hoạt động của con người', '• Human (n, adj): loài người; thuộc con người • Act (v, n): hành động; đạo luật • Action (n): hành động • Activity (n): hoạt động'],
          ['Impact', '/ˈɪmpækt/', 'n, v', '- (n) Tác động, ảnh hưởng (+ on) - (v) Tác động mạnh đến', '• Impacted (adj): bị tác động, chịu ảnh hưởng'],
          ['Leaflet', '/ˈliːflət/', 'n', 'Tờ rơi, tờ quảng cáo gấp', '—'],
          ['Methane', '/ˈmiːθeɪn/', 'n', 'Khí metan (CH₄)', '—'],
          ['Pollutant', '/pəˈluːtənt/', 'n', 'Chất gây ô nhiễm', '• Pollute (v): làm ô nhiễm • Pollution (n): sự ô nhiễm • Polluted (adj): bị ô nhiễm • Unpolluted (adj): trong sạch, không ô nhiễm'],
          ['Release', '/rɪˈliːs/', 'v, n', '- (v) Thải ra, phát tán, phóng thích - (n) Sự phát thải, sự giải thoát', '• Released (adj): được giải phóng / thải ra'],
          ['Renewable', '/rɪˈnjuːəbl/', 'adj', 'Có thể tái tạo được (năng lượng...)', '• Renew (v): tái tạo, gia hạn • Renewal (n): sự đổi mới, tái sinh • Non-renewable (adj): không thể tái tạo'],
          ['Sea level', '/ˈsiː ˌlevl/', 'np', 'Mực nước biển', '• Sea level rise (np): sự dâng cao mực nước biển'],
          ['Soil', '/sɔɪl/', 'n', 'Đất trồng, thổ nhưỡng', '• Soil erosion (np): sự xói mòn đất'],
          ['Soot', '/sʊt/', 'n', 'Bồ hóng, muội than, nhọ nồi', '• Sooty (adj): đầy bồ hóng'],
          ['Temperature', '/ˈtemprətʃə(r)/', 'n', 'Nhiệt độ', '• Temperate (adj): ôn đới, điều độ'],
          ['Waste', '/weɪst/', 'n, v, adj', '- (n) Rác, chất thải - (v) Lãng phí - (adj) Bị bỏ hoang, phế thải', '• Wasteful (adj): lãng phí • Wastefully (adv): một cách lãng phí • Wastefulness (n): tính lãng phí'],
        ],
      },
      {
        section: '2. Từ vựng mở rộng & Bổ trợ theo chủ đề (Extended & Exam Vocabulary)',
        role: 'family',
        rows: [
          ['Biodegradable', '/ˌbaɪəʊdɪˈɡreɪdəbl/', 'adj', 'Có thể bị phân hủy sinh học', '• Biodegrade (v): phân hủy sinh học • Biodegradation (n): sự phân hủy tự nhiên • Non-biodegradable (adj): không phân hủy sinh học'],
          ['Biodiversity', '/ˌbaɪəʊdaɪˈvɜːsəti/', 'n', 'Đa dạng sinh học', '• Diverse (adj): đa dạng • Diversify (v): đa dạng hóa • Diversity (n): sự phong phú, tính đa dạng'],
          ['Black carbon', '/ˌblæk ˈkɑːbən/', 'np', 'Carbon đen (muội than gây giữ nhiệt mạnh)', '—'],
          ['Campaign', '/kæmˈpeɪn/', 'n, v', '- (n) Chiến dịch (bảo vệ môi trường...) - (v) Vận động chiến dịch', '• Campaigner (n): người vận động chiến dịch'],
          ['Capture', '/ˈkæptʃə(r)/', 'v, n', '- (v) Thu giữ, giữ lại (khí thải) - (n) Sự thu giữ', '• Carbon capture (np): công nghệ thu giữ carbon'],
          ['Catastrophe', '/kəˈtæstrəfi/', 'n', 'Thảm họa lớn, tai ương', '• Catastrophic (adj): mang tính thảm khốc • Catastrophically (adv)'],
          ['Climate change', '/ˈklaɪmət tʃeɪndʒ/', 'np', 'Biến đổi khí hậu', '• Climatic (adj): thuộc khí hậu • Climatologist (n): nhà khí hậu học'],
          ['Conservation', '/ˌkɒnsəˈveɪʃn/', 'n', 'Sự bảo tồn thiên nhiên', '• Conserve (v): bảo tồn, giữ gìn • Conservative (adj): bảo thủ, dè dặt • Conservationist (n): nhà bảo tồn'],
          ['Contaminate', '/kənˈtæmɪneɪt/', 'v', 'Làm bẩn, làm nhiễm độc', '• Contamination (n): sự nhiễm bẩn • Contaminant (n): chất gây nhiễm bẩn • Contaminated (adj): bị nhiễm độc / ô nhiễm'],
          ['Deplete', '/dɪˈpliːt/', 'v', 'Làm cạn kiệt, suy giảm', '• Depletion (n): sự cạn kiệt, suy giảm (tầng ozone...) • Depleted (adj): bị cạn kiệt'],
          ['Disaster', '/dɪˈzɑːstə(r)/', 'n', 'Thảm họa, thiên tai', '• Disastrous (adj): tai hại, thảm khốc • Disastrously (adv)'],
          ['Drought', '/draʊt/', 'n', 'Nạn hạn hán, khô hạn kéo dài', '—'],
          ['Eco-conscious', '/ˈiːkəʊ ˌkɒnʃəs/', 'adj', 'Có ý thức về sinh thái và môi trường', '• Eco-consciousness (n): ý thức sinh thái'],
          ['Ecosystem', '/ˈiːkəʊsɪstəm/', 'n', 'Hệ sinh thái', '• Ecology (n): sinh thái học • Ecological (adj): thuộc sinh thái'],
          ['Extinction', '/ɪkˈstɪŋkʃn/', 'n', 'Sự tuyệt chủng', '• Extinct (adj): tuyệt chủng • Become extinct (v): trở nên tuyệt chủng'],
          ['Famine', '/ˈfæmɪn/', 'n', 'Nạn đói kém nghiêm trọng', '—'],
          ['Flood', '/flʌd/', 'n, v', '- (n) Trận lũ lụt - (v) Làm ngập lụt, tràn ngập', '• Flooding (n): tình trạng ngập lụt • Flooded (adj): bị ngập nước'],
          ['Glacier', '/ˈɡlæsiə(r)/', 'n', 'Sông băng, tảng băng trôi', '• Glacial (adj): thuộc sông băng, băng giá'],
          ['Greenhouse effect', '/ˈɡriːnhaʊs ɪˌfekt/', 'np', 'Hiệu ứng nhà kính', '• Greenhouse (n): nhà kính trồng cây • Greenhouse gas (np): khí nhà kính'],
          ['Habitat', '/ˈhæbɪtæt/', 'n', 'Môi trường sống tự nhiên', '• Habitable (adj): có thể ở được • Inhabit (v): cư trú, sinh sống'],
          ['Landfill', '/ˈlændfɪl/', 'n', 'Bãi chôn lấp rác thải', '—'],
          ['Melt', '/melt/', 'v', 'Làm tan chảy, tan ra (băng tuyết)', '• Melting (n, adj): sự tan chảy; đang tan chảy • Molten (adj): bị nấu chảy'],
          ['Mitigation', '/ˌmɪtɪˈɡeɪʃn/', 'n', 'Sự giảm nhẹ, biện pháp làm dịu bớt', '• Mitigate (v): giảm nhẹ, làm dịu • Mitigating (adj): có tính giảm nhẹ'],
          ['Polar ice cap', '/ˈpəʊlər aɪs kæp/', 'np', 'Chỏm băng ở hai vùng cực', '• Polar (adj): thuộc địa cực • Pole (n): cực Trái Đất'],
          ['Preserve', '/prɪˈzɜːv/', 'v', 'Gìn giữ, bảo tồn nguyên vẹn', '• Preservation (n): sự bảo tồn, duy trì • Preservative (n): chất bảo quản'],
          ['Radiation', '/ˌreɪdiˈeɪʃn/', 'n', 'Sự bức xạ, năng lượng bức xạ', '• Radiate (v): phát xạ, tỏa ra • Radiant (adj): phát sáng, rực rỡ'],
          ['Survive', '/səˈvaɪv/', 'v', 'Sống sót, tồn tại qua nghịch cảnh', '• Survival (n): sự sống sót, sự tồn tại • Survivor (n): người/sinh vật sống sót'],
          ['Threat', '/θret/', 'n', 'Nguy cơ, mối hiểm họa, đe dọa', '• Threaten (v): đe dọa, uy hiếp • Threatened (adj): bị đe dọa, gặp nguy hiểm • Threatening (adj): có tính đe dọa'],
          ['Vulnerable', '/ˈvʌlnərəbl/', 'adj', 'Dễ bị tổn thương, dễ gặp nguy hiểm (+ to)', '• Vulnerability (n): tính dễ bị tổn thương • Vulnerably (adv)'],
        ],
      },
      {
        section: '3. Cụm từ cố định, Cụm động từ & Thành ngữ (Collocations, Phrasal Verbs & Idioms)',
        role: 'note',
        rows: [
          ['Carbon footprint', '/ˈkɑːbən ˌfʊtprɪnt/', '', 'Dấu chân carbon (tổng lượng CO₂ phát thải)', '• Reduce / cut down on one\'s carbon footprint'],
          ['Cut down on', '/kʌt ˈdaʊn ɒn/', '', 'Cắt giảm (lượng sử dụng, tiêu thụ năng lượng...)', '• Cut down on energy use / emissions (+ Noun / V-ing)'],
          ['Cut down (trees)', '/kʌt ˈdaʊn/', '', 'Chặt, đốn hạ (cây rừng)', '• Cut down large areas of rainforest'],
          ['Give off', '/ɡɪv ɒf/', '', 'Bốc ra, tỏa ra, phát ra (mùi, khí thải, nhiệt)', '• Đồng nghĩa với emit / discharge / release'],
          ['Run out (of)', '/rʌn ˈaʊt əv/', '', 'Hết sạch, cạn kiệt (năng lượng, tài nguyên...)', '• Fossil fuels will run out soon'],
          ['Use up', '/juːz ʌp/', '', 'Sử dụng cạn kiệt, dùng sạch', '• Be used up in this century (thường dùng dạng bị động)'],
          ['Result in', '/rɪˈzʌlt ɪn/', '', 'Dẫn đến kết quả, gây ra (= lead to, cause)', '• Global warming results in severe disasters'],
          ['Result from', '/rɪˈzʌlt frɒm/', '', 'Xuất phát từ, là do (= be caused by)', '• Floods result from widespread deforestation'],
          ['Switch to', '/swɪtʃ tuː/', '', 'Chuyển hẳn sang sử dụng cái khác', '• Switch to renewable energy / biological fertilizers'],
          ['Pose a threat to', '/pəʊz ə θret tuː/', '', 'Đặt ra / gây ra mối đe dọa đối với', '• Climate change poses great threats to biodiversity'],
          ['Upset the ecological balance', '/ʌpˈset ði ˌiːkəˈlɒdʒɪkl ˈbæləns/', '', 'Làm đảo lộn sự cân bằng sinh thái', '• Severe drought upsets the ecological balance'],
          ['A drop in the ocean', '/ə drɒp ɪn ði ˈəʊʃn/', '', 'Hạt muối bỏ biển (quá nhỏ bé không thấm vào đâu)', '• Thành ngữ chỉ hành động tuy tốt nhưng quá nhỏ so với vấn đề lớn'],
          ['Greenwashing', '/ˈɡriːnwɒʃɪŋ/', '', 'Tẩy xanh (quảng cáo giả tạo là thân thiện môi trường)', 'Thuật ngữ chỉ các doanh nghiệp giả vờ bảo vệ tự nhiên'],
          ['Extreme weather patterns', '/ɪkˈstriːm ˈweðə ˈpætənz/', '', 'Các hình thái thời tiết cực đoan (bão, hạn, lũ)', '• Lead to extreme weather patterns'],
          ['Take in / Absorb', '/teɪk ɪn/ - /əbˈzɔːb/', '', 'Hấp thụ (khí CO₂)', '• Trees take in CO₂ and give off O₂'],
        ],
      },
    ],
  },
];

function buildPackFromSeed(seed: PackSeed): TeacherVocabPack {
  const tables = seed.sections.map((sec) => ({
    section: sec.section,
    rows: [
      [
        'Từ vựng (Word)',
        'Phiên âm (IPA)',
        'Từ loại',
        'Nghĩa tiếng Việt',
        sec.role === 'family' ? 'Family Word (Họ từ)' : 'Cấu trúc / Ghi chú ngữ pháp',
      ],
      ...sec.rows.map((r) => [...r]),
    ],
  }));

  const parsed = parseStructuredVocabRows(tables, 'spreadsheet');
  const sectionCounts = new Map<string, number>();
  for (const item of parsed.items) {
    sectionCounts.set(item.section, (sectionCounts.get(item.section) || 0) + 1);
  }

  return {
    id: seed.id,
    grade: seed.grade,
    curriculum: seed.curriculum,
    unitNumber: seed.unitNumber,
    title: seed.title,
    subtitle: seed.subtitle,
    totalWords: parsed.items.length,
    sections: seed.sections.map((s) => ({
      name: s.section,
      count: sectionCounts.get(s.section) || 0,
    })),
    wordKeys: parsed.items.map((it) => it.word.trim().toLowerCase()),
    items: parsed.items,
  };
}

export const GRADE_11_TEACHER_PACKS: TeacherVocabPack[] = GRADE_11_PACK_SEEDS.map(buildPackFromSeed);

export function getTeacherVocabPackCatalog(): TeacherVocabPackMeta[] {
  return GRADE_11_TEACHER_PACKS.map(({ items: _items, ...meta }) => meta);
}

export function getTeacherVocabPackById(id: string): TeacherVocabPack | undefined {
  return GRADE_11_TEACHER_PACKS.find((p) => p.id === id);
}
