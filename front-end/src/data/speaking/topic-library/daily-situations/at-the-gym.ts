/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: at_the_gym
 * File: src/data/speaking/topic-library/daily-situations/at-the-gym.ts
 *
 * 5 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const AT_THE_GYM_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-gym-01",
    category: 'daily_situations',
    subcategory: 'at_the_gym',
    level: "A2",
    titleEn: "Signing up for a gym membership",
    titleVi: "Đăng ký thẻ thành viên phòng gym",
    icon: "📝",
    situationVi: "Bạn đang trong tình huống: Đăng ký thẻ thành viên phòng gym. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for signing up for a gym membership.", textVi: "Chào, tôi ở đây để đăng ký thẻ thành viên phòng gym." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "membership",
        ipa: "/ˈmɛmbərʃɪp/",
        partOfSpeech: "n.",
        meaningVi: "thẻ thành viên",
        exampleEn: "Gym membership.",
        exampleVi: "Thẻ thành viên phòng gym.",
        associatedActions: [
          { en: "sign up for gym membership", vi: "đăng ký thẻ thành viên phòng gym" },
          { en: "choose annual membership plan", vi: "chọn gói tập luyện hàng năm" },
          { en: "activate digital member access pass", vi: "kích hoạt mã quét vào phòng tập" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "equipment",
        ipa: "/ɪˈkwɪpmənt/",
        partOfSpeech: "n.",
        meaningVi: "thiết bị",
        exampleEn: "Use the equipment.",
        exampleVi: "Sử dụng thiết bị.",
        associatedActions: [
          { en: "tour fitness equipment areas", vi: "tham quan khu vực máy móc tập luyện" },
          { en: "test cardio running equipment", vi: "thử nghiệm máy chạy bộ cardio" },
          { en: "learn proper gym equipment usage", vi: "học cách sử dụng thiết bị phòng tập" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "ask about contract freeze issues", vi: "hỏi về thủ tục bảo lưu thẻ tập" },
          { en: "resolve membership card scan issue", vi: "xử lý lỗi không quét được thẻ tập" },
          { en: "clarify hidden membership fees", vi: "làm rõ các khoản phụ phí tập luyện" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "complete member registration form", vi: "hoàn tất mẫu đăng ký thành viên" },
          { en: "undergo fitness assessment process", vi: "thực hiện quy trình đo chỉ số cơ thể" },
          { en: "receive gym orientation guide", vi: "nhận hướng dẫn nội quy phòng tập" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check personal locker availability", vi: "kiểm tra tủ đồ cá nhân còn trống" },
          { en: "check available discount promotions", vi: "hỏi các chương trình ưu đãi hiện có" },
          { en: "confirm gym opening hours", vi: "xác nhận khung giờ mở cửa phòng tập" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "How do I use this machine?", meaningVi: "Làm sao để dùng máy này?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Signing up for a gym membership. Respond naturally to the user.",
    tags: ["at-the_gym","daily-life"]
  },
  {
    id: "daily-gym-02",
    category: 'daily_situations',
    subcategory: 'at_the_gym',
    level: "A2",
    titleEn: "Asking about classes/schedule",
    titleVi: "Hỏi về các lớp học/lịch trình",
    icon: "🗓️",
    situationVi: "Bạn đang trong tình huống: Hỏi về các lớp học/lịch trình. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for asking about classes/schedule.", textVi: "Chào, tôi ở đây để hỏi về các lớp học/lịch trình." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "membership",
        ipa: "/ˈmɛmbərʃɪp/",
        partOfSpeech: "n.",
        meaningVi: "thẻ thành viên",
        exampleEn: "Gym membership.",
        exampleVi: "Thẻ thành viên phòng gym.",
        associatedActions: [
          { en: "check group class membership rights", vi: "kiểm tra quyền lợi học lớp nhóm" },
          { en: "show member barcode at class", vi: "quét mã thành viên khi vào lớp học" },
          { en: "upgrade membership for studio access", vi: "nâng cấp thẻ tập để vào phòng studio" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "equipment",
        ipa: "/ɪˈkwɪpmənt/",
        partOfSpeech: "n.",
        meaningVi: "thiết bị",
        exampleEn: "Use the equipment.",
        exampleVi: "Sử dụng thiết bị.",
        associatedActions: [
          { en: "prepare yoga mats and blocks", vi: "chuẩn bị thảm tập và gạch tập yoga" },
          { en: "sanitize spin cycle equipment", vi: "khử trùng xe đạp tập trong lớp" },
          { en: "store aerobic weights after class", vi: "cất tạ tập nhóm sau giờ học" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "report class schedule clash", vi: "báo sự cố trùng lịch học các lớp" },
          { en: "solve studio overcrowding issues", vi: "xử lý tình trạng phòng tập quá đông" },
          { en: "notify instructor about past injuries", vi: "báo trước cho HLV về chấn thương cũ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "book group class spot on app", vi: "đặt chỗ lớp tập nhóm trên ứng dụng" },
          { en: "arrive early for warm-up process", vi: "đến sớm để thực hiện bài khởi động" },
          { en: "follow instructor cooldown routines", vi: "làm theo bài giãn cơ của huấn luyện viên" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check weekly timetable schedule", vi: "kiểm tra thời khóa biểu hàng tuần" },
          { en: "find available pilates session spots", vi: "tìm suất học pilates còn trống" },
          { en: "check substitute teacher availability", vi: "xem giáo viên dạy thay có sẵn không" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "How do I use this machine?", meaningVi: "Làm sao để dùng máy này?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Asking about classes/schedule. Respond naturally to the user.",
    tags: ["at-the_gym","daily-life"]
  },
  {
    id: "daily-gym-03",
    category: 'daily_situations',
    subcategory: 'at_the_gym',
    level: "A2",
    titleEn: "Using gym equipment",
    titleVi: "Sử dụng thiết bị phòng gym",
    icon: "🏋️",
    situationVi: "Bạn đang trong tình huống: Sử dụng thiết bị phòng gym. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for using gym equipment.", textVi: "Chào, tôi ở đây để sử dụng thiết bị phòng gym." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "membership",
        ipa: "/ˈmɛmbərʃɪp/",
        partOfSpeech: "n.",
        meaningVi: "thẻ thành viên",
        exampleEn: "Gym membership.",
        exampleVi: "Thẻ thành viên phòng gym.",
        associatedActions: [
          { en: "request member equipment guidance", vi: "yêu cầu nhân viên hướng dẫn dùng máy" },
          { en: "take free member induction session", vi: "tham gia buổi hướng dẫn máy miễn phí" },
          { en: "verify privileges for free weights", vi: "kiểm tra quyền dùng khu tạ tự do" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "equipment",
        ipa: "/ɪˈkwɪpmənt/",
        partOfSpeech: "n.",
        meaningVi: "thiết bị",
        exampleEn: "Use the equipment.",
        exampleVi: "Sử dụng thiết bị.",
        associatedActions: [
          { en: "adjust safety pin on cable machine", vi: "chỉnh chốt an toàn trên máy kéo cáp" },
          { en: "learn proper chest press technique", vi: "học kỹ thuật đẩy ngực đúng tư thế" },
          { en: "wipe down weights with towel", vi: "lau sạch tạ bằng khăn sau khi tập" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "fix machine seat adjustment issue", vi: "sửa lỗi kẹt nấc ghế chỉnh máy" },
          { en: "avoid heavy weight posture issues", vi: "tránh lỗi sai tư thế khi nâng tạ nặng" },
          { en: "ask for a spotter safely", vi: "nhờ người đỡ tạ để đảm bảo an toàn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "read instruction diagram on machine", vi: "đọc sơ đồ hướng dẫn dán trên máy" },
          { en: "set appropriate weight resistance", vi: "cài đặt mức kháng lực tạ phù hợp" },
          { en: "perform controlled workout reps", vi: "thực hiện các hiệp tập có kiểm soát" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "wait for squat rack availability", vi: "chờ khung gánh tạ squat còn trống" },
          { en: "ask if someone is using dumbbells", vi: "hỏi xem có ai đang dùng đôi tạ tay không" },
          { en: "find available workout bench", vi: "tìm ghế dài tập tạ đang để trống" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "How do I use this machine?", meaningVi: "Làm sao để dùng máy này?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Using gym equipment. Respond naturally to the user.",
    tags: ["at-the_gym","daily-life"]
  },
  {
    id: "daily-gym-04",
    category: 'daily_situations',
    subcategory: 'at_the_gym',
    level: "B1",
    titleEn: "Talking to a personal trainer",
    titleVi: "Nói chuyện với huấn luyện viên cá nhân",
    icon: "🗣️",
    situationVi: "Bạn đang trong tình huống: Nói chuyện với huấn luyện viên cá nhân. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for talking to a personal trainer.", textVi: "Chào, tôi ở đây để nói chuyện với huấn luyện viên cá nhân." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "membership",
        ipa: "/ˈmɛmbərʃɪp/",
        partOfSpeech: "n.",
        meaningVi: "thẻ thành viên",
        exampleEn: "Gym membership.",
        exampleVi: "Thẻ thành viên phòng gym.",
        associatedActions: [
          { en: "add personal training to membership", vi: "thêm gói huấn luyện viên vào thẻ tập" },
          { en: "renew monthly coaching package", vi: "gia hạn gói thuê HLV hàng tháng" },
          { en: "review member workout achievements", vi: "xem lại kết quả luyện tập của hội viên" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "equipment",
        ipa: "/ɪˈkwɪpmənt/",
        partOfSpeech: "n.",
        meaningVi: "thiết bị",
        exampleEn: "Use the equipment.",
        exampleVi: "Sử dụng thiết bị.",
        associatedActions: [
          { en: "utilize kettlebells and bands", vi: "sử dụng tạ bình vôi và dây kháng lực" },
          { en: "set up agility training cones", vi: "bố trí nón tập phản xạ nhanh" },
          { en: "train with suspension straps", vi: "tập luyện với dây treo kháng lực TRX" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "discuss muscle soreness issues", vi: "trao đổi về cảm giác đau nhức cơ bắp" },
          { en: "correct joint alignment issues", vi: "chỉnh sửa các lỗi lệch trục khớp xương" },
          { en: "modify exercises for back issues", vi: "điều chỉnh bài tập phù hợp cho người đau lưng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "design tailored nutrition plan", vi: "thiết kế thực đơn dinh dưỡng cá nhân" },
          { en: "track body fat percentage process", vi: "theo dõi quy trình giảm mỡ cơ thể" },
          { en: "execute structured training phases", vi: "thực hiện các giai đoạn tập bài bản" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "book available personal trainer slots", vi: "đặt lịch các giờ trống của huấn luyện viên" },
          { en: "confirm trainer weekend availability", vi: "xác nhận lịch HLV vào cuối tuần" },
          { en: "reschedule session to available time", vi: "đổi buổi tập sang khung giờ còn trống" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "How do I use this machine?", meaningVi: "Làm sao để dùng máy này?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Talking to a personal trainer. Respond naturally to the user.",
    tags: ["at-the_gym","daily-life"]
  },
  {
    id: "daily-gym-05",
    category: 'daily_situations',
    subcategory: 'at_the_gym',
    level: "B1",
    titleEn: "Canceling/freezing membership",
    titleVi: "Hủy/bảo lưu thẻ thành viên",
    icon: "❄️",
    situationVi: "Bạn đang trong tình huống: Hủy/bảo lưu thẻ thành viên. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for canceling/freezing membership.", textVi: "Chào, tôi ở đây để hủy/bảo lưu thẻ thành viên." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "membership",
        ipa: "/ˈmɛmbərʃɪp/",
        partOfSpeech: "n.",
        meaningVi: "thẻ thành viên",
        exampleEn: "Gym membership.",
        exampleVi: "Thẻ thành viên phòng gym.",
        associatedActions: [
          { en: "report damaged machine at front desk", vi: "báo máy tập bị hỏng tại quầy lễ tân" },
          { en: "protect member safety standards", vi: "bảo đảm tiêu chuẩn an toàn cho hội viên" },
          { en: "verify club maintenance commitments", vi: "kiểm tra cam kết bảo trì của phòng tập" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "equipment",
        ipa: "/ɪˈkwɪpmənt/",
        partOfSpeech: "n.",
        meaningVi: "thiết bị",
        exampleEn: "Use the equipment.",
        exampleVi: "Sử dụng thiết bị.",
        associatedActions: [
          { en: "place out-of-order tag on machine", vi: "treo biển tạm ngừng sử dụng lên máy" },
          { en: "inspect snapped treadmill belt", vi: "kiểm tra băng tải máy chạy bộ bị rách" },
          { en: "replace cracked weight plates", vi: "thay thế các bánh tạ bị nứt vỡ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "report electrical spark hazard issue", vi: "báo cáo nguy cơ chập tia lửa điện" },
          { en: "fix squeaking pulley cable issue", vi: "sửa lỗi dây cáp ròng rọc kêu cót két" },
          { en: "prevent severe training injuries", vi: "ngăn ngừa tai nạn tập luyện nghiêm trọng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "submit maintenance repair request", vi: "gửi yêu cầu sửa chữa máy móc" },
          { en: "schedule technician inspection visit", vi: "lên lịch kỹ thuật viên đến kiểm tra" },
          { en: "test machine safety after repairs", vi: "kiểm tra độ an toàn của máy sau khi sửa" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "use alternative available treadmill", vi: "chuyển sang máy chạy bộ khác đang trống" },
          { en: "check repair technician availability", vi: "kiểm tra xem thợ sửa máy đã tới chưa" },
          { en: "notify members when machine is ready", vi: "thông báo cho hội viên khi máy sửa xong" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "How do I use this machine?", meaningVi: "Làm sao để dùng máy này?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Canceling/freezing membership. Respond naturally to the user.",
    tags: ["at-the_gym","daily-life"]
  }
];
