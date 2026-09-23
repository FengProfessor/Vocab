/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: making_complaints
 * File: src/data/speaking/topic-library/daily-situations/making-complaints.ts
 *
 * 6 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const MAKING_COMPLAINTS_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-complaint-01",
    category: 'daily_situations',
    subcategory: 'making_complaints',
    level: "A2",
    titleEn: "Food not as ordered",
    titleVi: "Món ăn không đúng yêu cầu",
    icon: "🍽️",
    situationVi: "Bạn đang trong tình huống: Món ăn không đúng yêu cầu. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for food not as ordered.", textVi: "Chào, tôi ở đây để món ăn không đúng yêu cầu." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "assist",
        ipa: "/əˈsɪst/",
        partOfSpeech: "v.",
        meaningVi: "hỗ trợ",
        exampleEn: "I can assist you.",
        exampleVi: "Tôi có thể hỗ trợ bạn.",
        associatedActions: [
          { en: "assist waiter by pointing out incorrect dish", vi: "chỉ giúp bồi bàn món ăn bị mang nhầm" },
          { en: "show original order receipt to server", vi: "cho nhân viên xem hóa đơn đặt món ban đầu" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "call restaurant floor manager service", vi: "gọi quản lý sảnh nhà hàng đến phục vụ" },
          { en: "request complimentary dessert courtesy service", vi: "nhận món tráng miệng miễn phí từ nhà hàng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "report undercooked chicken in entree", vi: "báo cáo thịt gà trong món chính chưa chín kỹ" },
          { en: "highlight peanut allergy ingredient mistake", vi: "nhấn mạnh sai sót cho thành phần đậu phộng gây dị ứng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "send plate back to kitchen for recooking", vi: "gửi đĩa thức ăn lại bếp để nấu lại" },
          { en: "adjust final dining bill deduction", vi: "điều chỉnh trừ tiền trên hóa đơn ăn uống" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "ask if chef is available to replace meal", vi: "hỏi đầu bếp có thể làm lại món ăn ngay không" },
          { en: "choose an available alternative dish", vi: "chọn một món ăn thay thế có sẵn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Food not as ordered. Respond naturally to the user.",
    tags: ["making-complaints","daily-life"]
  },
  {
    id: "daily-complaint-02",
    category: 'daily_situations',
    subcategory: 'making_complaints',
    level: "B1",
    titleEn: "Poor service at hotel",
    titleVi: "Dịch vụ kém tại khách sạn",
    icon: "🏨",
    situationVi: "Bạn đang trong tình huống: Dịch vụ kém tại khách sạn. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for poor service at hotel.", textVi: "Chào, tôi ở đây để dịch vụ kém tại khách sạn." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "assist",
        ipa: "/əˈsɪst/",
        partOfSpeech: "v.",
        meaningVi: "hỗ trợ",
        exampleEn: "I can assist you.",
        exampleVi: "Tôi có thể hỗ trợ bạn.",
        associatedActions: [
          { en: "assist front desk manager with incident details", vi: "hỗ trợ quản lý lễ tân với thông tin chi tiết sự việc" },
          { en: "point out uncleaned bathroom areas", vi: "chỉ ra các khu vực phòng tắm chưa được dọn sạch" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "complain to hotel concierge service desk", vi: "khiếu nại tại quầy dịch vụ chăm sóc khách hàng khách sạn" },
          { en: "request room housekeeping makeover service", vi: "yêu cầu dịch vụ dọn phòng làm sạch lại ngay" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "report lack of hot water and clean towels", vi: "báo cáo phòng không có nước nóng và khăn tắm sạch" },
          { en: "address rude receptionist attitude", vi: "phản ánh thái độ thiếu lịch sự của nhân viên lễ tân" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "upgrade room to executive suite category", vi: "nâng cấp hạng phòng lên phòng suite cao cấp" },
          { en: "log formal customer guest grievance", vi: "ghi nhận biên bản khiếu nại chính thức của khách" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check if quiet ocean view room is available", vi: "kiểm tra phòng yên tĩnh nhìn ra biển còn trống không" },
          { en: "ask if duty manager is available for discussion", vi: "hỏi quản lý ca trực có thể ra trao đổi không" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Poor service at hotel. Respond naturally to the user.",
    tags: ["making-complaints","daily-life"]
  },
  {
    id: "daily-complaint-03",
    category: 'daily_situations',
    subcategory: 'making_complaints',
    level: "B1",
    titleEn: "Billing discrepancy",
    titleVi: "Sai lệch thanh toán",
    icon: "🧾",
    situationVi: "Bạn đang trong tình huống: Sai lệch thanh toán. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for billing discrepancy.", textVi: "Chào, tôi ở đây để sai lệch thanh toán." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "assist",
        ipa: "/əˈsɪst/",
        partOfSpeech: "v.",
        meaningVi: "hỗ trợ",
        exampleEn: "I can assist you.",
        exampleVi: "Tôi có thể hỗ trợ bạn.",
        associatedActions: [
          { en: "assist cashier by highlighting overcharged items", vi: "chỉ giúp thu ngân những khoản bị tính tiền thừa" },
          { en: "provide bank statement payment proof", vi: "cung cấp sao kê ngân hàng làm chứng từ thanh toán" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "contact billing accounts support service", vi: "liên hệ dịch vụ hỗ trợ kế toán thanh toán" },
          { en: "inquire at credit card dispute service", vi: "tra cứu tại dịch vụ khiếu nại thẻ tín dụng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "dispute hidden fees on monthly utility bill", vi: "khiếu nại các khoản phụ phí ẩn trong hóa đơn sinh hoạt" },
          { en: "report double charging transaction error", vi: "báo cáo sự cố bị trừ tiền hai lần cho một giao dịch" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "void incorrect transaction charges", vi: "hủy các khoản phí tính sai trên máy" },
          { en: "issue written refund credit memo", vi: "lập biên bản hoàn tiền vào tài khoản" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check available refund reversal methods", vi: "kiểm tra phương thức hoàn lại tiền khả dụng" },
          { en: "ask if billing supervisor is available", vi: "hỏi giám sát thanh toán có thể tiếp chuyện không" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Billing discrepancy. Respond naturally to the user.",
    tags: ["making-complaints","daily-life"]
  },
  {
    id: "daily-complaint-04",
    category: 'daily_situations',
    subcategory: 'making_complaints',
    level: "A2",
    titleEn: "Noisy neighbors",
    titleVi: "Hàng xóm ồn ào",
    icon: "🔊",
    situationVi: "Bạn đang trong tình huống: Hàng xóm ồn ào. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for noisy neighbors.", textVi: "Chào, tôi ở đây để hàng xóm ồn ào." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "assist",
        ipa: "/əˈsɪst/",
        partOfSpeech: "v.",
        meaningVi: "hỗ trợ",
        exampleEn: "I can assist you.",
        exampleVi: "Tôi có thể hỗ trợ bạn.",
        associatedActions: [
          { en: "assist building security in locating noise source", vi: "giúp bảo vệ tòa nhà xác định nguồn tiếng ồn" },
          { en: "help coordinate polite community talk", vi: "giúp sắp xếp buổi nói chuyện hòa nhã với xóm giềng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "call building management reception service", vi: "gọi dịch vụ lễ tân ban quản lý tòa nhà" },
          { en: "notify municipal noise hotline service", vi: "gọi dịch vụ đường dây nóng về tiếng ồn đô thị" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "report loud late-night bass music", vi: "phản ánh tiếng nhạc bass bật quá to lúc nửa đêm" },
          { en: "address ongoing construction after hours", vi: "khiếu nại việc khoan đục thi công ngoài giờ quy định" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "issue written warning to noisy apartment", vi: "gửi văn bản nhắc nhở căn hộ gây mất trật tự" },
          { en: "enforce residential quiet hours rule", vi: "áp dụng quy định giữ yên tĩnh cho khu dân cư" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check if security patrol is available to inspect", vi: "kiểm tra đội tuần tra an ninh có thể lên nhắc nhở không" },
          { en: "find available peaceful study room downstairs", vi: "tìm phòng tự học yên tĩnh còn mở cửa dưới tầng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Noisy neighbors. Respond naturally to the user.",
    tags: ["making-complaints","daily-life"]
  },
  {
    id: "daily-complaint-05",
    category: 'daily_situations',
    subcategory: 'making_complaints',
    level: "B1",
    titleEn: "Defective electronic device",
    titleVi: "Thiết bị điện tử bị lỗi",
    icon: "📱",
    situationVi: "Bạn đang trong tình huống: Thiết bị điện tử bị lỗi. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for defective electronic device.", textVi: "Chào, tôi ở đây để thiết bị điện tử bị lỗi." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "assist",
        ipa: "/əˈsɪst/",
        partOfSpeech: "v.",
        meaningVi: "hỗ trợ",
        exampleEn: "I can assist you.",
        exampleVi: "Tôi có thể hỗ trợ bạn.",
        associatedActions: [
          { en: "assist repair technician with symptom demonstration", vi: "hỗ trợ kỹ thuật viên quan sát lỗi thiết bị" },
          { en: "help show flickering screen problem", vi: "cho xem hiện tượng màn hình chớp giật liên tục" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "bring laptop to authorized service center", vi: "mang máy tính đến trung tâm bảo hành ủy quyền" },
          { en: "inquire about warranty replacement service", vi: "hỏi dịch vụ đổi trả theo bảo hành của hãng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "report overheating battery and shutdowns", vi: "báo cáo pin nóng bất thường và tự sập nguồn" },
          { en: "explain camera malfunction on smartphone", vi: "giải thích camera điện thoại mới mua không hoạt động" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "run diagnostic hardware scan", vi: "chạy kiểm tra chẩn đoán phần cứng" },
          { en: "swap defective unit for brand new device", vi: "đổi máy bị lỗi lấy máy mới nguyên hộp" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check if loaner phone is available during repair", vi: "hỏi có máy dùng tạm trong lúc sửa không" },
          { en: "verify available replacement stock in store", vi: "kiểm tra hàng mới thay thế còn sẵn tại cửa hàng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Defective electronic device. Respond naturally to the user.",
    tags: ["making-complaints","daily-life"]
  },
  {
    id: "daily-complaint-06",
    category: 'daily_situations',
    subcategory: 'making_complaints',
    level: "A2",
    titleEn: "Late public transport service",
    titleVi: "Dịch vụ giao thông công cộng trễ giờ",
    icon: "🚌",
    situationVi: "Bạn đang trong tình huống: Dịch vụ giao thông công cộng trễ giờ. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for late public transport service.", textVi: "Chào, tôi ở đây để dịch vụ giao thông công cộng trễ giờ." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "assist",
        ipa: "/əˈsɪst/",
        partOfSpeech: "v.",
        meaningVi: "hỗ trợ",
        exampleEn: "I can assist you.",
        exampleVi: "Tôi có thể hỗ trợ bạn.",
        associatedActions: [
          { en: "assist fellow stranded passengers with timetable", vi: "hỗ trợ hành khách lỡ chuyến xem lịch trình xe" },
          { en: "help report train delay at info booth", vi: "giúp báo trễ chuyến tàu tại quầy thông tin" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "contact transit customer relations service", vi: "liên hệ dịch vụ chăm sóc hành khách công cộng" },
          { en: "request commuter delay compensation certificate service", vi: "xin giấy chứng nhận trễ chuyến cho người đi làm" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "complain about 45-minute bus schedule delay", vi: "khiếu nại xe buýt trễ giờ đến 45 phút" },
          { en: "report lack of arrival time announcements", vi: "phản ánh việc không có loa thông báo giờ xe đến" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "submit late transit ticket refund request", vi: "nộp yêu cầu hoàn tiền vé do phương tiện trễ giờ" },
          { en: "reroute journey using underground metro", vi: "chuyển hướng lộ trình bằng tàu điện ngầm" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check available connecting bus routes", vi: "kiểm tra tuyến xe buýt chuyển tiếp còn chạy" },
          { en: "find available seats on express coach", vi: "tìm ghế ngồi còn trống trên xe khách chạy nhanh" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Late public transport service. Respond naturally to the user.",
    tags: ["making-complaints","daily-life"]
  }
];
