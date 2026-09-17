import type { LessonFlashcard } from './types';

/**
 * Ngân hàng Thẻ Ghi Nhớ (Interactive Flashcards) cho 16 Chuyên Đề TOEIC
 * Chuẩn bị theo phương pháp Spaced Repetition (SRS) & Coursera Micro-Learning
 */
export const toeicLessonFlashcards: LessonFlashcard[] = [
  // ── G01: Từ loại & Trật tự từ cơ bản ──
  {
    id: 'fc-g01-01',
    lessonId: 'G01',
    term: 'consecutive',
    ipa: '/kənˈsek.jə.tɪv/',
    partOfSpeech: 'adjective',
    vietnamese: 'liên tiếp, liền nhau (không ngắt quãng)',
    collocation: 'for three consecutive quarters / years',
    exampleSentence: 'The company reported profit growth for five consecutive quarters.',
    exampleTranslation: 'Công ty đã báo cáo tăng trưởng lợi nhuận trong 5 quý liên tiếp.',
    trapWarning: 'Tránh nhầm với "consequent" (hậu quả, xảy ra do kết quả của cái gì).',
  },
  {
    id: 'fc-g01-02',
    lessonId: 'G01',
    term: 'substantially',
    ipa: '/səbˈstæn.ʃəl.i/',
    partOfSpeech: 'adverb',
    vietnamese: 'đáng kể, rất nhiều (bổ nghĩa cho động từ tăng/giảm)',
    collocation: 'increase / reduce substantially',
    exampleSentence: 'Operational expenses have decreased substantially after restructuring.',
    exampleTranslation: 'Chi phí vận hành đã giảm đáng kể sau khi tái cơ cấu.',
    trapWarning: 'Vị trí sau trợ động từ hoặc trước tính từ/phân từ trong câu bị động.',
  },
  {
    id: 'fc-g01-03',
    lessonId: 'G01',
    term: 'productivity',
    ipa: '/ˌprɒd.ʌkˈtɪv.ə.ti/',
    partOfSpeech: 'noun',
    vietnamese: 'năng suất, hiệu suất lao động',
    collocation: 'boost / improve employee productivity',
    exampleSentence: 'The new workflow software helped increase overall factory productivity.',
    exampleTranslation: 'Phần mềm quy trình mới đã giúp tăng năng suất tổng thể của nhà máy.',
    trapWarning: 'Đứng sau tính từ hoặc danh từ ghép (e.g. productivity rate).',
  },
  {
    id: 'fc-g01-04',
    lessonId: 'G01',
    term: 'competitive',
    ipa: '/kəmˈpet.ə.tɪv/',
    partOfSpeech: 'adjective',
    vietnamese: 'cạnh tranh, có tính cạnh tranh cao',
    collocation: 'competitive salary / pricing / market',
    exampleSentence: 'We offer competitive salary packages to attract top engineering talent.',
    exampleTranslation: 'Chúng tôi cung cấp mức lương cạnh tranh để thu hút nhân tài kỹ thuật hàng đầu.',
    trapWarning: 'Không dùng dạng trạng từ "competitively" khi đứng trước danh từ bổ nghĩa.',
  },

  // ── G02: Danh từ & Đại từ nâng cao ──
  {
    id: 'fc-g02-01',
    lessonId: 'G02',
    term: 'luggage / baggage',
    ipa: '/ˈlʌɡ.ɪdʒ/',
    partOfSpeech: 'noun',
    vietnamese: 'hành lý (danh từ không đếm được - Uncountable)',
    collocation: 'excess luggage / piece of baggage',
    exampleSentence: 'Passengers are allowed to carry one piece of hand luggage on board.',
    exampleTranslation: 'Hành khách được phép mang một kiện hành lý xách tay lên máy bay.',
    trapWarning: 'TUYỆT ĐỐI không có dạng số nhiều luggages hay an luggage trong đề thi ETS.',
  },
  {
    id: 'fc-g02-02',
    lessonId: 'G02',
    term: 'delegate',
    ipa: '/ˈdel.ɪ.ɡət/ (n) - /ˈdel.ɪ.ɡeɪt/ (v)',
    partOfSpeech: 'noun',
    vietnamese: 'đại biểu (người) / (v): ủy quyền, giao phó',
    collocation: 'conference delegates / delegate responsibilities',
    exampleSentence: 'Over two hundred international delegates registered for the annual summit.',
    exampleTranslation: 'Hơn hai trăm đại biểu quốc tế đã đăng ký tham dự hội nghị thượng đỉnh thường niên.',
    trapWarning: 'Đuôi -ate hay gặp ở động từ nhưng "delegate" là danh từ chỉ người đếm được.',
  },
  {
    id: 'fc-g02-03',
    lessonId: 'G02',
    term: 'by oneself / on one\'s own',
    ipa: '/baɪ wʌnˈself/',
    partOfSpeech: 'phrase',
    vietnamese: 'tự mình làm, độc lập, không có ai giúp đỡ',
    collocation: 'complete the assignment by herself',
    exampleSentence: 'Ms. Clara prepared the entire financial presentation by herself.',
    exampleTranslation: 'Cô Clara đã tự mình chuẩn bị toàn bộ bài thuyết trình tài chính.',
    trapWarning: 'Cụm "by + đại từ phản thân" mang nghĩa "một mình" (= alone), rất hay ra ở Part 5.',
  },
  {
    id: 'fc-g02-04',
    lessonId: 'G02',
    term: 'information',
    ipa: '/ˌɪn.fəˈmeɪ.ʃən/',
    partOfSpeech: 'noun',
    vietnamese: 'thông tin (danh từ KHÔNG đếm được)',
    collocation: 'further / detailed information',
    exampleSentence: 'For more detailed information regarding warranty terms, visit our website.',
    exampleTranslation: 'Để biết thêm thông tin chi tiết về các điều khoản bảo hành, hãy truy cập website của chúng tôi.',
    trapWarning: 'Không bao giờ đi với "an" hoặc có đuôi "s" (informations là sai hoàn toàn).',
  },

  // ── G03: Động từ & Thì trọng điểm ──
  {
    id: 'fc-g03-01',
    lessonId: 'G03',
    term: 'implement',
    ipa: '/ˈɪm.plɪ.ment/',
    partOfSpeech: 'verb',
    vietnamese: 'thi hành, thực hiện, áp dụng (chính sách, kế hoạch)',
    collocation: 'implement new security guidelines / policies',
    exampleSentence: 'The management decided to implement new safety measures next Monday.',
    exampleTranslation: 'Ban quản lý đã quyết định áp dụng các biện pháp an toàn mới vào thứ Hai tới.',
    trapWarning: 'Là ngoại động từ (transitive verb), luôn cần tân ngữ trực tiếp theo sau.',
  },
  {
    id: 'fc-g03-02',
    lessonId: 'G03',
    term: 'recently / lately',
    ipa: '/ˈriː.sənt.li/',
    partOfSpeech: 'adverb',
    vietnamese: 'gần đây (dấu hiệu nhận biết điển hình thì Hiện Tại Hoàn Thành)',
    collocation: 'has recently announced / been updated',
    exampleSentence: 'The director has recently approved the revised budget for the project.',
    exampleTranslation: 'Giám đốc vừa mới phê duyệt ngân sách sửa đổi cho dự án.',
    trapWarning: 'Thường đứng giữa "have/has" và V3/ed trong câu hiện tại hoàn thành.',
  },
  {
    id: 'fc-g03-03',
    lessonId: 'G03',
    term: 'since + mốc thời gian',
    ipa: '/sɪns/',
    partOfSpeech: 'preposition',
    vietnamese: 'kể từ khi (kết hợp với thì Hiện Tại Hoàn Thành)',
    collocation: 'has served as CEO since 2018',
    exampleSentence: 'Our company has expanded into five new overseas markets since 2020.',
    exampleTranslation: 'Công ty chúng tôi đã mở rộng vào 5 thị trường nước ngoài mới kể từ năm 2020.',
    trapWarning: 'Mệnh đề sau "since" dùng Quá khứ đơn, mệnh đề chính dùng Hiện tại hoàn thành.',
  },
  {
    id: 'fc-g03-04',
    lessonId: 'G03',
    term: 'expire',
    ipa: '/ɪkˈspaɪər/',
    partOfSpeech: 'verb',
    vietnamese: 'hết hạn (hợp đồng, thẻ thành viên, hộ chiếu)',
    collocation: 'contract / subscription expires on [date]',
    exampleSentence: 'Your quarterly parking permit will expire at the end of this month.',
    exampleTranslation: 'Giấy phép gửi xe theo quý của bạn sẽ hết hạn vào cuối tháng này.',
    trapWarning: '"Expire" là nội động từ, KHÔNG BAO GIỜ chia thể bị động (is expired là sai).',
  },

  // ── G04: Thể bị động & Câu phức ──
  {
    id: 'fc-g04-01',
    lessonId: 'G04',
    term: 'be required to V',
    ipa: '/bi rɪˈkwaɪəd tuː/',
    partOfSpeech: 'formula',
    vietnamese: 'bị bắt buộc / có nghĩa vụ phải làm gì',
    collocation: 'all attendees are required to wear identification badges',
    exampleSentence: 'All employees are required to submit their timesheets by Friday afternoon.',
    exampleTranslation: 'Tất cả nhân viên được yêu cầu nộp bảng chấm công trước chiều thứ Sáu.',
    trapWarning: 'ETS rất hay hỏi V nguyên mẫu đứng sau "be required to".',
  },
  {
    id: 'fc-g04-02',
    lessonId: 'G04',
    term: 'be accompanied by',
    ipa: '/bi əˈkʌm.pə.nid baɪ/',
    partOfSpeech: 'phrase',
    vietnamese: 'được gửi kèm với / được hộ tống bởi',
    collocation: 'all returned items must be accompanied by an original receipt',
    exampleSentence: 'Every refund claim must be accompanied by the original purchase receipt.',
    exampleTranslation: 'Mỗi yêu cầu hoàn tiền phải được gửi kèm theo hóa đơn mua hàng gốc.',
    trapWarning: 'Giới từ chuẩn đi kèm dạng bị động này là "by", không dùng "with" hay "to".',
  },
  {
    id: 'fc-g04-03',
    lessonId: 'G04',
    term: 'be subject to',
    ipa: '/bi ˈsʌb.dʒɪkt tuː/',
    partOfSpeech: 'phrase',
    vietnamese: 'phụ thuộc vào / có thể bị thay đổi theo',
    collocation: 'prices are subject to change without prior notice',
    exampleSentence: 'Flight departure times are subject to change due to unfavorable weather conditions.',
    exampleTranslation: 'Giờ khởi hành chuyến bay có thể thay đổi do điều kiện thời tiết bất lợi.',
    trapWarning: 'Sau "subject to" là Danh từ hoặc Cụm danh từ (hoặc V-ing), KHÔNG phải V nguyên mẫu.',
  },

  // ── G05: Giới từ, Liên từ & Mệnh đề quan hệ ──
  {
    id: 'fc-g05-01',
    lessonId: 'G05',
    term: 'prior to = before',
    ipa: '/ˈpraɪ.ər tuː/',
    partOfSpeech: 'preposition',
    vietnamese: 'trước khi (đi với Danh từ hoặc V-ing)',
    collocation: 'prior to the scheduled departure / commencement',
    exampleSentence: 'Please inspect the equipment thoroughly prior to operating the machinery.',
    exampleTranslation: 'Vui lòng kiểm tra thiết bị kỹ lưỡng trước khi vận hành máy móc.',
    trapWarning: '"Prior to" là giới từ (đi với Noun/V-ing), không nối 2 mệnh đề có S + V.',
  },
  {
    id: 'fc-g05-02',
    lessonId: 'G05',
    term: 'although / even though vs despite',
    ipa: '/ɔːlˈðəʊ/ vs /dɪˈspaɪt/',
    partOfSpeech: 'conjunction',
    vietnamese: 'mặc dù (Although + S + V ; Despite + Noun/V-ing)',
    collocation: 'despite torrential rain / although the weather was bad',
    exampleSentence: 'Although the marketing campaign was brief, product sales rose by fifteen percent.',
    exampleTranslation: 'Mặc dù chiến dịch tiếp thị diễn ra ngắn, doanh số bán sản phẩm đã tăng 15%.',
    trapWarning: 'Mẹo 5s: Nhìn sau chỗ trống có S + V chọn "Although"; có Cụm danh từ chọn "Despite".',
  },
  {
    id: 'fc-g05-03',
    lessonId: 'G05',
    term: 'in order to V = so as to V',
    ipa: '/ɪn ˈɔː.dər tuː/',
    partOfSpeech: 'phrase',
    vietnamese: 'để mà, nhằm mục đích làm gì',
    collocation: 'in order to accommodate all seminar guests',
    exampleSentence: 'We reserved a larger auditorium in order to accommodate additional registered guests.',
    exampleTranslation: 'Chúng tôi đã đặt một khán phòng lớn hơn để có thể đón tiếp thêm khách đã đăng ký.',
    trapWarning: 'Nếu nối mệnh đề có S + V, phải dùng "in order that" hoặc "so that".',
  },

  // ── G06: Cấu trúc So sánh & Đảo ngữ ──
  {
    id: 'fc-g06-01',
    lessonId: 'G06',
    term: 'substantially higher than',
    ipa: '/səbˈstæn.ʃəl.i ˈhaɪ.ər ðæn/',
    partOfSpeech: 'phrase',
    vietnamese: 'cao hơn đáng kể so với (trạng từ nhấn mạnh so sánh hơn)',
    collocation: 'much / far / significantly / substantially higher than',
    exampleSentence: 'This quarter\'s domestic revenue is substantially higher than projected.',
    exampleTranslation: 'Doanh thu nội địa quý này cao hơn đáng kể so với dự tính ban đầu.',
    trapWarning: 'ETS cấm dùng "very / more" để bổ nghĩa cho tính từ so sánh hơn (-er). Dùng much/far/significantly.',
  },
  {
    id: 'fc-g06-02',
    lessonId: 'G06',
    term: 'Should you have any questions',
    ipa: '/ʃʊd juː hæv/',
    partOfSpeech: 'formula',
    vietnamese: 'Nếu bạn có bất kỳ câu hỏi nào (Đảo ngữ câu điều kiện loại 1)',
    collocation: 'Should you require further assistance, please contact...',
    exampleSentence: 'Should you have any questions regarding your invoice, do not hesitate to contact our billing team.',
    exampleTranslation: 'Nếu bạn có bất kỳ thắc mắc nào về hóa đơn, đừng ngần ngại liên hệ với đội ngũ thanh toán của chúng tôi.',
    trapWarning: 'Bằng với "If you have...". Nhận biết khi thấy "Should" đứng đầu câu không có dấu hỏi chấm (?).',
  },

  // ── L01: Part 1 – Chiến thuật Ảnh mô tả ──
  {
    id: 'fc-l01-01',
    lessonId: 'L01',
    term: 'being loaded / being displayed',
    ipa: '/ˈbiː.ɪŋ ˈləʊ.dɪd/',
    partOfSpeech: 'formula',
    vietnamese: 'đang được bốc vác / đang được bày ra (Thì Hiện Tại Tiếp Diễn Bị Động)',
    collocation: 'boxes are being loaded onto the truck',
    exampleSentence: 'Merchandise is being displayed on the shelves.',
    exampleTranslation: 'Hàng hóa đang được trưng bày lên kệ.',
    trapWarning: 'Quy tắc vàng: Nếu ảnh KHÔNG CÓ NGƯỜI tác động, loại ngay các đáp án có "BEING + V3" (trừ being displayed).',
  },
  {
    id: 'fc-l01-02',
    lessonId: 'L01',
    term: 'be mounted on',
    ipa: '/bi ˈmaʊn.tɪd ɒn/',
    partOfSpeech: 'phrase',
    vietnamese: 'được gắn chặt / gắn cố định trên (tường, trần)',
    collocation: 'a whiteboard is mounted on the wall',
    exampleSentence: 'Several promotional posters are mounted on the lobby walls.',
    exampleTranslation: 'Một số áp phích quảng cáo được gắn trên tường của sảnh đón tiếp.',
    trapWarning: 'Mô tả trạng thái tĩnh của đồ vật trong Part 1 tranh đồ vật/phong cảnh.',
  },

  // ── L02: Part 2 – Phản xạ Hỏi - Đáp ──
  {
    id: 'fc-l02-01',
    lessonId: 'L02',
    term: 'Direct vs Indirect Response',
    ipa: '/ɪn.daɪˈrekt rɪˈspɒns/',
    partOfSpeech: 'formula',
    vietnamese: 'Đáp án gián tiếp / né tránh câu trả lời trực diện',
    collocation: 'I haven\'t checked my email yet / It hasn\'t been decided',
    exampleSentence: 'Q: "Who will lead the marketing meeting?" - A: "I thought it was canceled."',
    exampleTranslation: 'Hỏi: "Ai sẽ chủ trì cuộc họp tiếp thị?" - Đáp: "Tôi cứ tưởng nó đã bị hủy rồi."',
    trapWarning: 'Xu hướng đề ETS mới 2026: 40% câu hỏi Part 2 có đáp án gián tiếp (phản xạ không theo lối mòn).',
  },
  {
    id: 'fc-l02-02',
    lessonId: 'L02',
    term: 'Distractor by Same Sound',
    ipa: '/seɪm saʊnd/',
    partOfSpeech: 'formula',
    vietnamese: 'Bẫy từ đồng âm / âm giống nhau (Same Sound Trap)',
    collocation: 'copy / coffee, plan / plant, right / write',
    exampleSentence: 'Question has "department", distractor option repeats "depart" or "apartment".',
    exampleTranslation: 'Câu hỏi có từ "department", phương án bẫy cố tình lặp lại "depart" hoặc "apartment".',
    trapWarning: 'Nghe thấy từ phát âm giống hệt từ trong câu hỏi thì đến 90% là bẫy ETS cố tình gài để lừa tai thí sinh.',
  },

  // ── L03: Part 3 – Hội thoại ngắn ──
  {
    id: 'fc-l03-01',
    lessonId: 'L03',
    term: 'Paraphrasing in Listening',
    ipa: '/ˈpær.ə.freɪz.ɪŋ/',
    partOfSpeech: 'formula',
    vietnamese: 'Kỹ thuật paraphrase (nghe từ A trong audio, đáp án hiển thị từ B đồng nghĩa)',
    collocation: 'cut budget -> reduce operational costs',
    exampleSentence: 'Speaker says: "We cannot afford new computers" -> Answer: "Budget constraints".',
    exampleTranslation: 'Người nói: "Chúng ta không đủ tiền mua máy tính mới" -> Đáp án: "Hạn chế về ngân sách".',
    trapWarning: 'Đừng tìm từ nguyên gốc trong đề bài; hãy tìm từ đồng nghĩa ngữ cảnh.',
  },

  // ── L04: Part 4 – Bài nói ngắn ──
  {
    id: 'fc-l04-01',
    lessonId: 'L04',
    term: '30-second Pre-reading Rhythm',
    ipa: '/θɜː.ti ˈsek.ənd ˈrɪð.əm/',
    partOfSpeech: 'formula',
    vietnamese: 'Nhịp điệu vàng đọc trước câu hỏi 30 giây trong bài nói Part 4',
    collocation: 'read 3 questions & underline keywords before audio starts',
    exampleSentence: 'Identify Who the speaker is, What problem occurred, and What listeners should do.',
    exampleTranslation: 'Xác định ai là người nói, vấn đề gì xảy ra, và người nghe cần phải làm gì.',
    trapWarning: 'Nếu chưa đọc xong 3 câu hỏi mà audio đã phát, bạn sẽ rơi vào thế bị động suốt cả bài.',
  },

  // ── L05: Part 1–4 Kỹ năng đồ thị ──
  {
    id: 'fc-l05-01',
    lessonId: 'L05',
    term: 'Look at the graphic cross-match',
    ipa: '/lʊk æt ðə ˈɡræf.ɪk/',
    partOfSpeech: 'formula',
    vietnamese: 'Quy tắc đối chiếu ngược trong câu hỏi bảng biểu đồ',
    collocation: 'question asks for Column A -> listen for Column B in dialogue',
    exampleSentence: 'Options list Flight numbers -> Audio will announce the Departure City or Gate.',
    exampleTranslation: 'Phương án hiển thị số hiệu chuyến bay -> Audio sẽ đọc thành phố xuất phát hoặc cổng bay.',
    trapWarning: 'Người nói sẽ KHÔNG BAO GIỜ đọc trực tiếp từ ghi trong 4 đáp án A, B, C, D!',
  },

  // ── R01: Part 7 – Quản trị thời gian ──
  {
    id: 'fc-r01-01',
    lessonId: 'R01',
    term: '55-minute Part 7 Budget',
    ipa: '/fɪf.ti faɪv ˈmɪn.ɪt/',
    partOfSpeech: 'formula',
    vietnamese: 'Quy tắc phân bổ 55 phút cho 54 câu Part 7 (1 phút/câu)',
    collocation: 'Part 5: 10 mins | Part 6: 10 mins | Part 7: 55 mins',
    exampleSentence: 'Allocate 55 minutes for Part 7 to comfortably solve single, double, and triple passages.',
    exampleTranslation: 'Dành tròn 55 phút cho Part 7 để hoàn thành đoạn đơn, đoạn kép và đoạn ba mà không bị cuống.',
    trapWarning: 'Nếu dành quá 15 phút cho Part 5, bạn chắc chắn sẽ thiếu giờ và phải "đánh lụi" 15–20 câu cuối Part 7.',
  },

  // ── R02: Part 7 – Thư từ thương mại & Email ──
  {
    id: 'fc-r02-01',
    lessonId: 'R02',
    term: 'inquire about = ask about',
    ipa: '/ɪnˈkwaɪər əˈbaʊt/',
    partOfSpeech: 'phrase',
    vietnamese: 'hỏi thăm, tìm hiểu thông tin về',
    collocation: 'write to inquire about availability / product rates',
    exampleSentence: 'I am writing this email to inquire about the rental rates for your banquet hall.',
    exampleTranslation: 'Tôi viết email này để hỏi về giá thuê sảnh tiệc của quý khách.',
    trapWarning: 'Thường xuất hiện ngay câu mở đầu đoạn 1 email để giải quyết câu hỏi "Why was the email written?".',
  },

  // ── R03: Part 7 – Thông báo & Hướng dẫn ──
  {
    id: 'fc-r03-01',
    lessonId: 'R03',
    term: 'mandatory = compulsory = obligatory',
    ipa: '/ˈmæn.də.tər.i/',
    partOfSpeech: 'adjective',
    vietnamese: 'bắt buộc, theo quy định không thể bỏ qua',
    collocation: 'mandatory safety training session / policy',
    exampleSentence: 'Attendance at the annual fire safety briefing is strictly mandatory for all plant staff.',
    exampleTranslation: 'Việc tham dự buổi phổ biến an toàn phòng cháy là bắt buộc đối với toàn bộ nhân viên nhà máy.',
    trapWarning: 'Từ đồng nghĩa rất hay được hỏi trong câu hỏi trắc nghiệm từ vựng ngữ cảnh (Vocabulary in context).',
  },

  // ── R04: Part 7 – Bài báo & Báo cáo ──
  {
    id: 'fc-r04-01',
    lessonId: 'R04',
    term: 'merger and acquisition (M&A)',
    ipa: '/ˈmɜː.dʒər ænd ˌæk.wɪˈzɪʃ.ən/',
    partOfSpeech: 'noun',
    vietnamese: 'sáp nhập và mua lại doanh nghiệp',
    collocation: 'announce a historic merger between two retail giants',
    exampleSentence: 'The business article highlighted the strategic advantages of the upcoming merger.',
    exampleTranslation: 'Bài báo kinh doanh đã làm nổi bật những lợi thế chiến lược của thương vụ sáp nhập sắp tới.',
    trapWarning: 'Các bài báo kinh doanh Part 7 thường xoay quanh bổ nhiệm lãnh đạo mới, mở chi nhánh hoặc sáp nhập.',
  },

  // ── R05: Part 7 – Đoạn văn kép & Ba ──
  {
    id: 'fc-r05-01',
    lessonId: 'R05',
    term: 'Cross-referencing clue',
    ipa: '/krɒs ˈref.ər.əns.ɪŋ/',
    partOfSpeech: 'formula',
    vietnamese: 'Kỹ thuật móc xích thông tin chéo giữa 2 hoặc 3 văn bản',
    collocation: 'link Item name in Doc 1 with Date in Doc 2 to deduce Discount in Doc 3',
    exampleSentence: 'Question 195 requires cross-referencing the client order email with the shipping invoice.',
    exampleTranslation: 'Câu 195 yêu cầu đối chiếu chéo giữa email đặt hàng của khách với hóa đơn vận chuyển.',
    trapWarning: 'Trong mỗi bộ Double/Triple passage luôn có ít nhất 1-2 câu KHÔNG THỂ giải chỉ bằng một văn bản đơn lẻ.',
  },
];

/**
 * Query Helper: Lấy danh sách flashcards theo ID bài học
 */
export function getFlashcardsByLessonId(lessonId: string): LessonFlashcard[] {
  return toeicLessonFlashcards.filter((fc) => fc.lessonId === lessonId);
}

/**
 * Query Helper: Lấy toàn bộ ngân hàng thẻ
 */
export function getAllFlashcards(): LessonFlashcard[] {
  return toeicLessonFlashcards;
}

/**
 * Query Helper: Thống kê số lượng thẻ
 */
export function getFlashcardsStats(): { totalCards: number; lessonsCovered: number } {
  const lessonIds = new Set(toeicLessonFlashcards.map((fc) => fc.lessonId));
  return {
    totalCards: toeicLessonFlashcards.length,
    lessonsCovered: lessonIds.size,
  };
}
