import type { LessonCheatSheet } from './types';

/**
 * Tóm tắt 60 giây (Cheat Sheets) cho 16 Chuyên Đề TOEIC
 * Tài liệu ôn tập cấp tốc trước khi bước vào phòng thi thật ETS
 */
export const toeicLessonCheatSheets: LessonCheatSheet[] = [
  {
    lessonId: 'G01',
    title: 'Từ Loại & Trật Tự Từ Cơ Bản',
    targetScore: '450–600+',
    formulaSummary: 'S + V + O | Adj + Noun | Adv + Verb / Adj | Preposition + Noun / V-ing',
    coreRules: [
      'Xác định cấu trúc câu trước: Câu đã có Động từ chính (V_main) chưa? Nếu chưa có, vị trí trống là V_main.',
      'Trước danh từ điền Tính từ; trước tính từ điền Trạng từ.',
      'Sau giới từ (in, on, at, with, without, for, about) là Cụm danh từ hoặc V-ing (kèm tân ngữ).',
    ],
    speedTricks: [
      'Gặp đuôi -tion, -sion, -ment, -ance, -ence -> 100% là Danh từ.',
      'Gặp đuôi -able, -ible, -al, -ive, -ous, -ful -> 100% là Tính từ.',
      'Gặp đuôi -ly -> 90% là Trạng từ (bỏ -ly ra Tính từ gốc).',
    ],
    commonTraps: [
      'Bẫy tính từ đuôi -ly: lovely, friendly, timely, costly là TÍNH TỪ, không phải trạng từ.',
      'Bẫy danh từ đuôi -al: proposal, approval, renewal, removal, referral là DANH TỪ, không phải tính từ.',
      'Đứng giữa trợ động từ và V3/ed là TRẠNG TỪ (e.g. has successfully completed).',
    ],
    examChecklist: [
      'Kiểm tra 2 từ đứng ngay trước và ngay sau chỗ trống (3 giây).',
      'Xác định từ loại còn thiếu của vị trí.',
      'Nhìn 4 đáp án chọn ngay đáp án có hậu tố tương ứng mà không cần dịch cả câu.',
    ],
  },
  {
    lessonId: 'G02',
    title: 'Danh Từ Đếm Được, Không Đếm Được & Đại Từ',
    targetScore: '500–650+',
    formulaSummary: 'a/an + Singular Noun | Plural Noun (s/es) | Uncountable Noun (no s, no a/an)',
    coreRules: [
      'Danh từ đếm được số ít KHÔNG BAO GIỜ đứng trơ trọi một mình (phải có a, an, the, his, my hoặc s/es).',
      'Danh từ không đếm được KHÔNG có dạng số nhiều và KHÔNG đi với a/an.',
      'Đại từ phản thân đứng sau ngoại động từ hoặc ở cuối câu mang nghĩa tự mình làm (by oneself = alone).',
    ],
    speedTricks: [
      'Danh từ không đếm được vàng trong TOEIC: information, equipment, luggage, baggage, furniture, advice, machinery.',
      'Gặp đuôi -ee (trainee, employee) hoặc -or/-er (supervisor, manager) -> Danh từ chỉ người, đếm được.',
    ],
    commonTraps: [
      'Bẫy thêm "s" vào information/equipment -> Tuyệt đối SAI trong ETS.',
      'Đại từ sở hữu (mine, yours, theirs) thay thế cho [Tính từ sở hữu + Noun], không đứng trước danh từ.',
      'Nhầm "its" (của nó) với "it\'s" (viết tắt của it is).',
    ],
    examChecklist: [
      'Xem trước chỗ trống có mạo từ (a/an/the) hay tính từ sở hữu không.',
      'Kiểm tra xem danh từ cần chia số ít hay số nhiều dựa vào động từ chia phía sau.',
    ],
  },
  {
    lessonId: 'G03',
    title: 'Động Từ & Các Thì Trọng Điểm',
    targetScore: '550–700+',
    formulaSummary: 'S_singular + V_s/es | S_plural + V_bare | Have/Has + V3/ed | Had + V3/ed',
    coreRules: [
      'Quy tắc hòa hợp Chủ ngữ - Động từ: Chủ ngữ số ít đi với động từ số ít; Chủ ngữ số nhiều đi với động từ số nhiều.',
      'Hiện tại hoàn thành (Have/Has + V3): Diễn tả hành động bắt đầu trong quá khứ kéo dài đến hiện tại.',
      'Mệnh đề thời gian/điều kiện (when, as soon as, once, if): Hiện tại đơn thay thế cho Tương lai đơn.',
    ],
    speedTricks: [
      'Thấy "since + mốc", "for + khoảng", "recently", "lately", "already" -> Chọn ngay Hiện tại hoàn thành.',
      'Thấy "last + thời gian", "ago", "yesterday", "in + năm quá khứ" -> Chọn ngay Quá khứ đơn (V2/ed).',
      'Thấy "every", "usually", "frequently", "annually" -> Chọn ngay Hiện tại đơn.',
    ],
    commonTraps: [
      'Bẫy sau "when/as soon as": Tuyệt đối KHÔNG dùng "will" trong mệnh đề trạng ngữ chỉ thời gian.',
      'Chủ ngữ bị chèn cụm giới từ: "The delivery of these packages IS delayed" (Chủ ngữ là "The delivery", không phải "packages").',
    ],
    examChecklist: [
      'Tìm chủ ngữ thật của câu (bỏ qua các cụm giới từ phụ kẹp giữa).',
      'Tìm trạng từ chỉ thời gian trong câu.',
      'Xét xem câu chủ động hay bị động trước khi chọn thì.',
    ],
  },
  {
    lessonId: 'G04',
    title: 'Thể Bị Động & Rút Gọn Mệnh Đề Quan Hệ',
    targetScore: '600–750+',
    formulaSummary: 'Be + V3/ed (+ by O) | Noun + V-ing (chủ động) | Noun + V3/ed (bị động)',
    coreRules: [
      'Ngoại động từ ở thể chủ động PHẢI có tân ngữ (Noun) theo sau.',
      'Nếu sau chỗ trống KHÔNG CÓ TÂN NGỮ (mà là giới từ hoặc dấu chấm) -> 90% chọn Thể Bị Động (Be + V3).',
      'Rút gọn mệnh đề quan hệ: Dùng V-ing nếu mang nghĩa chủ động; dùng V3/ed nếu mang nghĩa bị động.',
    ],
    speedTricks: [
      'Công thức bẫy 3 giây: Chỗ trống + [by / to / in / at] -> Chọn ngay V3/ed.',
      'Các nội động từ KHÔNG BAO GIỜ chia bị động: happen, occur, remain, expire, arrive, exist.',
    ],
    commonTraps: [
      'Nhầm lẫn giữa V-ed làm động từ chính với V-ed làm phân từ rút gọn bổ nghĩa cho danh từ đứng trước.',
      'Cấu trúc bị động đặc biệt: be required to V, be expected to V, be eligible for N.',
    ],
    examChecklist: [
      'Nhìn ngay sau chỗ trống xem có Tân ngữ (Danh từ) hay không.',
      'Nếu không có tân ngữ, kiểm tra các phương án có "be + V3/ed".',
    ],
  },
  {
    lessonId: 'G05',
    title: 'Giới Từ, Liên Từ & Mệnh Đề Phụ',
    targetScore: '650–800+',
    formulaSummary: 'Liên từ + Clause (S + V) | Giới từ + Noun Phrase / V-ing',
    coreRules: [
      'Liên từ phụ thuộc (Although, Because, While, Since) nối 2 mệnh đề có đủ S + V.',
      'Giới từ (Despite, In spite of, Because of, Due to, During) chỉ đi với Cụm danh từ hoặc V-ing.',
      'While + S + V / V-ing (trong khi) vs During + Danh từ thời kỳ (suốt kỳ nghỉ, cuộc họp).',
    ],
    speedTricks: [
      'Nhìn sau chỗ trống: Có Động từ chia thì -> Chọn LIÊN TỪ; Chỉ có Danh từ/Cụm từ -> Chọn GIỚI TỪ.',
      'Cặp từ song hành: either...or, neither...nor, both...and, not only...but also.',
    ],
    commonTraps: [
      'Trộn lẫn "Due to" (giới từ) với "Although" (liên từ) trong cùng 1 câu.',
      'Trạng từ liên kết (However, Therefore, Furthermore) đứng đầu câu sau dấu chấm và trước dấu phẩy.',
    ],
    examChecklist: [
      'Xác định phần phía sau khoảng trống là Mệnh đề (S + V) hay Cụm danh từ.',
      'Loại bỏ ngay các phương án khác loại (giới từ vs liên từ).',
    ],
  },
  {
    lessonId: 'G06',
    title: 'Cấu Trúc So Sánh & Đảo Ngữ Nâng Cao',
    targetScore: '750–850+',
    formulaSummary: 'So sánh hơn + than | the + So sánh nhất | Should/Were/Had + S + V (Đảo ngữ)',
    coreRules: [
      'Trạng từ nhấn mạnh so sánh hơn: much, far, significantly, substantially, considerably (KHÔNG dùng very/more).',
      'Đảo ngữ điều kiện loại 1: Should + S + V_bare, S + will/can + V_bare.',
      'Đảo ngữ với phó từ phủ định: Rarely / Seldom / Never / Hardly + Trợ động từ + S + V.',
    ],
    speedTricks: [
      'Đầu câu đứng trống, cuối câu có dấu chấm (không phải câu hỏi), có chủ ngữ phía sau -> 100% Đảo ngữ "Should".',
      'Trước "higher/more..." có chỗ trống trạng từ -> Tìm ngay much/substantially/significantly.',
    ],
    commonTraps: [
      'Chọn "very" để bổ nghĩa cho so sánh hơn (e.g. very higher là SAI).',
      'Nhầm đảo ngữ điều kiện loại 1 (Should) với loại 3 (Had + S + V3/ed).',
    ],
    examChecklist: [
      'Quan sát xem câu có từ "than" hoặc "the" để nhận diện dạng so sánh.',
      'Kiểm tra đầu câu có xuất hiện phó từ phủ định hoặc cấu trúc câu đảo ngữ hay không.',
    ],
  },
  {
    lessonId: 'L01',
    title: 'Part 1 – Bẫy Tranh Tả Người & Đồ Vật',
    targetScore: '450–650+',
    formulaSummary: 'Ảnh người: Focus Hành động (V-ing) | Ảnh vật: Focus Trạng thái (Be + V3)',
    coreRules: [
      'Tranh không có người: LOẠI NGAY đáp án chứa "being + V3" (vì "being" diễn tả đang có người tác động).',
      'Ngoại lệ duy nhất cho "being" khi không có người: "The merchandise is being displayed" (được coi là đúng trong ETS).',
      'Phân biệt "wearing" (đang mặc trên người - trạng thái) vs "putting on" (đang xỏ tay vào áo - hành động).',
    ],
    speedTricks: [
      'Trong 5s đọc hướng dẫn: Quét nhanh tranh xem có người hay không, xác định vị trí nổi bật.',
      'Dùng ngón tay/bút chì chấm lên 4 chữ A, B, C, D trên phiếu trả lời để loại trừ ngay lập tức.',
    ],
    commonTraps: [
      'Bẫy từ phát âm tương tự nhưng khác nghĩa.',
      'Bẫy đúng hành động nhưng sai đối tượng tác động.',
    ],
    examChecklist: [
      'Tranh tả người hay tả cảnh?',
      'Có nghe thấy "being + V3" không?',
      'Trạng thái quần áo là wearing hay putting on?',
    ],
  },
  {
    lessonId: 'L02',
    title: 'Part 2 – Phản Xạ Hỏi - Đáp & Bẫy Đồng Âm',
    targetScore: '500–700+',
    formulaSummary: 'Nghe từ để hỏi đầu tiên (Who, Where, When, Why, How) | Loại bẫy lặp âm',
    coreRules: [
      'Câu hỏi WH-question: TUYỆT ĐỐI KHÔNG chọn đáp án bắt đầu bằng Yes/No/Sure/Of course.',
      'Nghe thấy từ lặp lại nguyên văn hoặc từ phát âm na ná từ trong câu hỏi -> 90% là BẪY (Distractor).',
      'Đáp án né tránh / gián tiếp ("Tôi không biết", "Hỏi chị Mary xem", "Nó bị hủy rồi") thường là ĐÁP ÁN ĐÚNG.',
    ],
    speedTricks: [
      'Bắt thật chắc 3 từ đầu tiên của câu hỏi (Từ để hỏi + Trợ động từ + Chủ ngữ).',
      'Nếu nghe không kịp: Chọn câu trả lời dài nhất hoặc câu trả lời có tính chất né tránh.',
    ],
    commonTraps: [
      'Bẫy cùng trường từ vựng (coffee -> photocopy, report -> reporter).',
      'Bẫy câu hỏi đuôi (Tag question) và câu hỏi phủ định (Didn\'t you go?).',
    ],
    examChecklist: [
      'Xác định loại câu hỏi: WH-question, Yes/No hay Câu trần thuật?',
      'Loại ngay Yes/No nếu là câu hỏi WH.',
      'Cảnh giác cao độ với âm thanh lặp lại.',
    ],
  },
  {
    lessonId: 'L03',
    title: 'Part 3 – Nhịp Điệu 30s Vàng & Kỹ Thuật Paraphrasing',
    targetScore: '600–750+',
    formulaSummary: 'Câu 1: Thông tin chung (Mở đầu) | Câu 2: Chi tiết (Giữa) | Câu 3: Hành động tiếp theo (Cuối)',
    coreRules: [
      'Bắt buộc đọc trước 3 câu hỏi trước khi băng phát (tận dụng thời gian đọc hướng dẫn và đọc đáp án câu trước).',
      'Thứ tự câu hỏi bám sát 100% trình tự diễn biến của đoạn hội thoại từ trên xuống dưới.',
      'ETS luôn dùng Paraphrase: Không tìm từ trùng khớp mà tìm từ đồng nghĩa ngữ cảnh.',
    ],
    speedTricks: [
      'Gạch chân từ khóa mấu chốt trong 3 câu hỏi: Who, What problem, What does the woman suggest.',
      'Khi người nói chuyển sang câu 3, tay phải đánh dấu xong câu 1 và câu 2.',
    ],
    commonTraps: [
      'Bẫy đổi vai: Câu hỏi hỏi người NỮ (Woman) nhưng đáp án lại lấy thông tin từ người NAM (Man).',
      'Bẫy câu hàm ý (What does the man imply by saying...): Cần hiểu ngữ cảnh chứ không dịch theo nghĩa đen.',
    ],
    examChecklist: [
      'Đã đọc lướt xong 3 câu hỏi trước khi audio vang lên chưa?',
      'Câu hỏi đang hỏi về hành động của Người Nam hay Người Nữ?',
    ],
  },
  {
    lessonId: 'L04',
    title: 'Part 4 – Bài Nói Ngắn Độc Thoại Công Sở',
    targetScore: '650–800+',
    formulaSummary: 'Chủ đề bài nói: Announcement, Voice message, Speech, Advertisement, Tour/Weather',
    coreRules: [
      'Chỉ có 1 người nói duy nhất xuyên suốt bài nói (độc thoại).',
      'Câu hỏi 1 luôn hỏi: Who is the speaker? hoặc Where is this announcement taking place? (nghe ở 10-15s đầu).',
      'Câu hỏi cuối cùng thường hỏi: What will happen next? hoặc What are listeners asked to do? (nghe ở 10s cuối).',
    ],
    speedTricks: [
      'Nhận diện tín hiệu: "Please note that...", "Unfortunately...", "I am calling to..." -> Báo hiệu đáp án.',
      'Nếu lỡ mất 1 câu, hãy bỏ qua ngay để tập trung đọc trước 3 câu của bài nói tiếp theo.',
    ],
    commonTraps: [
      'Bị cuốn vào câu trước dẫn đến không kịp đọc trước đề của bài nói sau.',
      'Bẫy thay đổi lịch trình hoặc sự cố kỹ thuật (thay đổi phút chót).',
    ],
    examChecklist: [
      'Xác định loại văn bản: Thông báo nội bộ, tin nhắn thoại hay quảng cáo?',
      'Lắng nghe từ phát tín hiệu chuyển ý (However, But, Unfortunately).',
    ],
  },
  {
    lessonId: 'L05',
    title: 'Part 1–4 Kỹ Năng Bảng Biểu & Hình Ảnh Kèm Theo',
    targetScore: '700–850+',
    formulaSummary: 'Câu hỏi có dòng: "Look at the graphic" -> Quy tắc đối chiếu ngược (Cross-Match)',
    coreRules: [
      'Quy tắc vàng: Đáp án trong 4 lựa chọn (A, B, C, D) KHÔNG BAO GIỜ được người nói đọc nguyên văn.',
      'Nếu 4 đáp án là Tên người -> Audio sẽ đọc Chức vụ hoặc Phòng ban tương ứng trên bảng biểu.',
      'Nếu 4 đáp án là Giá tiền -> Audio sẽ đọc Mã gói dịch vụ hoặc Ngày đăng ký.',
    ],
    speedTricks: [
      'Nhìn nhanh vào bảng: Cột nào nằm trong 4 đáp án thì BỎ QUA; tập trung mắt vào CỘT CÒN LẠI.',
      'Chỉ cần nghe thấy từ ở Cột Còn Lại, liếc sang hàng ngang để chọn đáp án tương ứng.',
    ],
    commonTraps: [
      'Bẫy số liệu cũ bị sửa đổi (e.g. Flight 104 was scheduled for Gate 3, but now moved to Gate 7).',
      'Đọc nhầm cột trong bảng biểu có nhiều hàng/cột tương tự nhau.',
    ],
    examChecklist: [
      'Xác định thông tin nằm trong 4 phương án A, B, C, D nằm ở cột nào trên biểu đồ.',
      'Dồn toàn bộ sự chú ý của tai nghe vào các cột/hàng còn lại.',
    ],
  },
  {
    lessonId: 'R01',
    title: 'Part 7 – Chiến Thuật Quản Trị Thời Gian 55 Phút',
    targetScore: '500–750+',
    formulaSummary: 'Part 5: 10-12p | Part 6: 8-10p | Part 7: 53-55p (Tổng 75 phút / 100 câu)',
    coreRules: [
      'Nguyên tắc 1 phút/câu: 54 câu Part 7 cần đúng 54-55 phút để đọc hiểu chỉn chu.',
      'Làm theo thứ tự tối ưu: Đoạn đơn dễ làm trước -> Đoạn kép/ba làm giữa -> Đoạn dài/tin nhắn làm sau.',
      'Tuyệt đối không dừng lại quá 90 giây ở bất kỳ một câu hỏi nào.',
    ],
    speedTricks: [
      'Gặp câu hỏi tìm chi tiết: Đọc câu hỏi trước -> Khoanh vùng từ khóa -> Scan nhanh vị trí trong bài.',
      'Câu hỏi mục đích (Purpose): Đọc ngay 2-3 câu đầu tiên của đoạn 1.',
    ],
    commonTraps: [
      'Sa đà giải ngữ pháp Part 5 mất 25 phút dẫn đến thiếu giờ và phải tô bừa 20 câu cuối Part 7.',
      'Đọc toàn bộ văn bản từ đầu đến cuối trước khi đọc câu hỏi.',
    ],
    examChecklist: [
      'Canh đồng hồ: Khi còn 55 phút phải bước sang câu 147 (Part 7).',
      'Đọc câu hỏi và các từ khóa trước khi đọc văn bản.',
    ],
  },
  {
    lessonId: 'R02',
    title: 'Part 7 – Thư Từ Thương Mại, Email & Bản Tin Nội Bộ',
    targetScore: '600–800+',
    formulaSummary: 'Tiêu đề Email: From / To / Date / Subject -> Nắm bối cảnh chỉ trong 5 giây',
    coreRules: [
      'Subject line (Dòng tiêu đề) cho biết 70% nội dung chính của toàn bộ bức thư.',
      'Câu hỏi "What is the purpose of the email?": Luôn nằm ở 2 câu đầu của đoạn văn thứ nhất.',
      'Câu hỏi "What is indicated about Mr. X?": Yêu cầu suy luận dựa trên chi tiết xuất hiện rải rác.',
    ],
    speedTricks: [
      'Các cụm từ phát tín hiệu mục đích: "I am writing to...", "The purpose of this memo is...", "Please be advised that...".',
      'Phần tái bút (P.S.) hoặc chữ ký dưới cùng thường chứa câu trả lời cho câu hỏi cuối cùng.',
    ],
    commonTraps: [
      'Nhầm lẫn giữa người gửi (Sender) và người nhận (Recipient).',
      'Bẫy phủ định: "What is NOT mentioned in the email?".',
    ],
    examChecklist: [
      'Đọc lướt Subject line trước.',
      'Xác định mối quan hệ giữa người gửi và người nhận (đồng nghiệp, sếp - nhân viên, đối tác).',
    ],
  },
  {
    lessonId: 'R03',
    title: 'Part 7 – Thông Báo, Lịch Trình & Văn Bản Quy Định',
    targetScore: '650–800+',
    formulaSummary: 'Văn bản cấu trúc: Bullet points, Tiêu đề phụ (Subheadings), Dấu sao chú thích (*)',
    coreRules: [
      'Thông báo quy định luôn có cấu trúc phân tầng rõ ràng (Tiêu đề in đậm -> Điều kiện -> Ngoại lệ).',
      'Các chú thích nhỏ ở chân trang (Footnotes / Asterisk *) thường là nơi ETS giấu đáp án câu hỏi suy luận.',
      'Câu hỏi từ vựng trong ngữ cảnh (In the notice, the word X in line Y is closest in meaning to...): Dịch theo ngữ cảnh câu văn, không dịch máy móc theo từ điển.',
    ],
    speedTricks: [
      'Dùng kỹ thuật Scanning: Tìm số tiền ($), ngày tháng, giờ giấc, tên riêng viết hoa.',
      'Câu hỏi từ đồng nghĩa: Thay từng phương án vào câu gốc, phương án nào giữ nguyên nghĩa hợp lý nhất là đúng.',
    ],
    commonTraps: [
      'Bẫy nghĩa phổ biến nhất của từ (e.g. "address" hay hỏi nghĩa "giải quyết vấn đề" chứ không phải "địa chỉ nhà").',
      'Bỏ qua các trường hợp ngoại lệ (Exceptions) bắt đầu bằng "Unless", "Except for".',
    ],
    examChecklist: [
      'Tìm các ký tự đặc biệt (*, dấu gạch đầu dòng, chữ in hoa).',
      'Đọc câu văn chứa từ vựng cần hỏi và câu đứng liền trước nó.',
    ],
  },
  {
    lessonId: 'R04',
    title: 'Part 7 – Bài Báo Kinh Doanh & Báo Cáo Tài Chính',
    targetScore: '700–850+',
    formulaSummary: 'Cấu trúc bài báo: Headline -> Dateline (Địa điểm, Ngày) -> Lead Paragraph -> Body',
    coreRules: [
      'Đoạn mở đầu (Lead paragraph) trả lời các câu hỏi: Ai, Cái gì, Ở đâu, Khi nào.',
      'Câu hỏi suy luận (What is suggested / implied): Đáp án đúng thường được paraphrase lại, không dùng từ nguyên gốc.',
      'Các trích dẫn lời phát biểu ("...") của chuyên gia / CEO thường chứa lý do hoặc mục tiêu dài hạn.',
    ],
    speedTricks: [
      'Gặp số liệu tăng giảm: Chú ý các cặp từ surge/skyrocket (tăng vọt), decline/plunge (giảm mạnh).',
      'Nắm bắt ngày tháng ở phần Dateline để tính toán các sự kiện trong quá khứ hoặc tương lai.',
    ],
    commonTraps: [
      'Bẫy thời gian: Bài báo viết vào tháng 5 nhưng sự kiện đề cập đã diễn ra từ tháng 2.',
      'Bẫy phóng đại (Overgeneralization): Đáp án dùng từ cực đoan (all, never, exclusively).',
    ],
    examChecklist: [
      'Đọc tiêu đề bài báo và ngày tháng phát hành.',
      'Gạch chân các trích dẫn có trong ngoặc kép.',
    ],
  },
  {
    lessonId: 'R05',
    title: 'Part 7 – Đoạn Văn Kép & Ba (Double & Triple Passages)',
    targetScore: '750–900+',
    formulaSummary: 'Bộ 2 văn bản (5 câu): Luôn có 2 câu nối chéo | Bộ 3 văn bản (5 câu): Luôn có 2-3 câu nối chéo',
    coreRules: [
      'Không bao giờ đọc một lèo cả 3 văn bản rồi mới nhìn câu hỏi. Hãy đọc tên thể loại 3 văn bản để nắm mối liên kết.',
      'Câu hỏi 1-2 thường nằm ở Văn bản 1; Câu hỏi 3 nằm ở Văn bản 2; Câu hỏi 4-5 đòi hỏi móc xích giữa các văn bản.',
      'Dấu hiệu câu hỏi móc xích: Hỏi về người ở Văn bản 1 nhưng yêu cầu tìm thông tin ở Văn bản 2 (e.g. "Người gửi email sẽ trả bao nhiêu tiền?").',
    ],
    speedTricks: [
      'Mô hình móc xích kinh điển: Doc 1 (Quảng cáo/Menu/Chính sách) + Doc 2 (Email/Đơn đặt hàng) -> Kết quả.',
      'Khoanh tròn các từ khóa chung xuất hiện ở cả 2 văn bản (Tên người, Mã đơn hàng, Ngày tổ chức).',
    ],
    commonTraps: [
      'Chỉ đọc một văn bản và vội vàng chọn đáp án (đáp án bẫy hiển thị rất rõ ở văn bản 1 nhưng bị phủ định hoặc thay đổi ở văn bản 2).',
      'Bẫy phiếu giảm giá / điều kiện ưu đãi (Doc 3 có mã voucher giảm 20% cho đơn hàng đặt ở Doc 2).',
    ],
    examChecklist: [
      'Xác định 3 văn bản gồm những loại nào (e.g. Email + Invoice + Policy).',
      'Đánh dấu câu hỏi cần thông tin kết hợp giữa 2 văn bản.',
    ],
  },
];

/**
 * Query Helper: Lấy Cheat Sheet theo ID bài học
 */
export function getCheatSheetByLessonId(lessonId: string): LessonCheatSheet | undefined {
  return toeicLessonCheatSheets.find((cs) => cs.lessonId === lessonId);
}

/**
 * Query Helper: Lấy toàn bộ Cheat Sheets
 */
export function getAllCheatSheets(): LessonCheatSheet[] {
  return toeicLessonCheatSheets;
}
