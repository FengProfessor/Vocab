/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: parking_driving
 * File: src/data/speaking/topic-library/daily-situations/parking-driving.ts
 *
 * 5 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const PARKING_DRIVING_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-park-01",
    category: 'daily_situations',
    subcategory: 'parking_driving',
    level: "A2",
    titleEn: "Finding a parking spot",
    titleVi: "Tìm chỗ đậu xe",
    icon: "🅿️",
    situationVi: "Bạn đang trong tình huống: Tìm chỗ đậu xe. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for finding a parking spot.", textVi: "Chào, tôi ở đây để tìm chỗ đậu xe." },
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
          { en: "wave to assist with reversing", vi: "vẫy tay hỗ trợ lùi xe" },
          { en: "help guide car into tight space", vi: "giúp điều hướng xe vào chỗ hẹp" },
          { en: "ask parking attendant to assist", vi: "nhờ nhân viên bãi xe hỗ trợ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "use valet parking service", vi: "sử dụng dịch vụ đỗ xe hộ" },
          { en: "tip the parking service staff", vi: "cho tiền boa nhân viên phục vụ bãi xe" },
          { en: "rate multi-storey garage service", vi: "đánh giá dịch vụ nhà xe nhiều tầng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "notice a parking space blocking issue", vi: "phát hiện sự cố xe chắn lối đi" },
          { en: "report unauthorized parking issue", vi: "báo cáo sự cố đỗ xe trái phép" },
          { en: "resolve parking slot dispute", vi: "giải quyết tranh chấp vị trí đỗ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "take entry parking ticket", vi: "nhận vé xe ở cổng vào" },
          { en: "follow arrow markers to open bays", vi: "đi theo mũi tên chỉ dẫn đến ô trống" },
          { en: "park between white lane lines", vi: "đậu xe ngay ngắn giữa hai vạch kẻ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "look for available parking spots", vi: "tìm kiếm chỗ đậu xe còn trống" },
          { en: "check green light for available slot", vi: "nhìn đèn xanh báo ô đỗ xe khả dụng" },
          { en: "wait until another spot becomes available", vi: "chờ đến khi có chỗ trống mới" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Finding a parking spot. Respond naturally to the user.",
    tags: ["parking-driving","daily-life"]
  },
  {
    id: "daily-park-02",
    category: 'daily_situations',
    subcategory: 'parking_driving',
    level: "A1",
    titleEn: "Paying for parking",
    titleVi: "Trả tiền đậu xe",
    icon: "💳",
    situationVi: "Bạn đang trong tình huống: Trả tiền đậu xe. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for paying for parking.", textVi: "Chào, tôi ở đây để trả tiền đậu xe." },
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
          { en: "assist with automated pay station", vi: "hỗ trợ thao tác máy thanh toán tự động" },
          { en: "help insert ticket properly", vi: "giúp nhét thẻ gửi xe vào đúng khe" },
          { en: "call cashier for billing assistance", vi: "gọi nhân viên thu ngân để nhờ hỗ trợ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "pay for 24-hour security service", vi: "trả phí cho dịch vụ bảo vệ 24 giờ" },
          { en: "validate parking ticket for free service", vi: "đóng dấu thẻ xe để được miễn phí dịch vụ" },
          { en: "use contactless payment service", vi: "dùng dịch vụ thanh toán không tiếp xúc" }
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
          { en: "report rejected credit card issue", vi: "báo cáo lỗi máy từ chối thẻ tín dụng" },
          { en: "handle lost ticket issue", vi: "xử lý sự cố làm mất vé gửi xe" },
          { en: "query unexpected surcharge issue", vi: "khiếu nại sự cố bị phụ thu bất ngờ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "scan parking barcode on scanner", vi: "quét mã vạch thẻ đỗ trên máy đọc" },
          { en: "select cash or card option", vi: "chọn phương thức tiền mặt hoặc thẻ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check available payment methods", vi: "kiểm tra các phương thức thanh toán được chấp nhận" },
          { en: "confirm attendant is available at booth", vi: "xác nhận có nhân viên túc trực tại trạm thu phí" },
          { en: "use available parking discount vouchers", vi: "sử dụng phiếu giảm giá đỗ xe có sẵn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1562619371-b67725b6fde2?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Paying for parking. Respond naturally to the user.",
    tags: ["parking-driving","daily-life"]
  },
  {
    id: "daily-park-03",
    category: 'daily_situations',
    subcategory: 'parking_driving',
    level: "A2",
    titleEn: "Getting a parking ticket",
    titleVi: "Bị phạt đậu xe",
    icon: "🎫",
    situationVi: "Bạn đang trong tình huống: Bị phạt đậu xe. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for getting a parking ticket.", textVi: "Chào, tôi ở đây để bị phạt đậu xe." },
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
          { en: "ask traffic officer to clarify violation", vi: "nhờ cảnh sát giao thông giải thích lỗi" },
          { en: "help gather dispute evidence", vi: "giúp thu thập bằng chứng khiếu nại" },
          { en: "assist with online fine payment", vi: "hỗ trợ nộp phạt vi phạm trực tuyến" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "contact vehicle towing service", vi: "liên hệ dịch vụ kéo cứu hộ xe" },
          { en: "use traffic fine processing service", vi: "sử dụng dịch vụ xử lý phạt vi phạm" },
          { en: "consult legal counseling service", vi: "tham khảo dịch vụ tư vấn pháp lý" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "contest unjust parking ticket issue", vi: "khiếu nại sự cố bị phạt đỗ xe oan" },
          { en: "explain faded parking sign issue", vi: "giải thích biển báo đỗ xe bị mờ" },
          { en: "settle outstanding violation issue", vi: "thanh toán dứt điểm vi phạm còn tồn đọng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "read notice details under wiper", vi: "đọc kỹ thông báo kẹp dưới cần gạt nước" },
          { en: "submit written appeal to authority", vi: "gửi đơn khiếu nại bằng văn bản" },
          { en: "pay fine within 14 days", vi: "nộp phạt đúng hạn trong vòng 14 ngày" }
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
          { en: "check if online dispute portal is available", vi: "kiểm tra cổng khiếu nại trực tuyến có hoạt động không" },
          { en: "check available fine reduction policies", vi: "tìm hiểu chính sách giảm nhẹ mức phạt hiện hành" },
          { en: "retrieve impounded car when available", vi: "lấy lại xe bị tạm giữ ngay khi được phép" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Getting a parking ticket. Respond naturally to the user.",
    tags: ["parking-driving","daily-life"]
  },
  {
    id: "daily-park-04",
    category: 'daily_situations',
    subcategory: 'parking_driving',
    level: "B1",
    titleEn: "Minor car accident",
    titleVi: "Tai nạn xe hơi nhẹ",
    icon: "🚗",
    situationVi: "Bạn đang trong tình huống: Tai nạn xe hơi nhẹ. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for minor car accident.", textVi: "Chào, tôi ở đây để tai nạn xe hơi nhẹ." },
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
          { en: "check passengers and assist injured", vi: "kiểm tra hành khách và hỗ trợ người bị thương" },
          { en: "assist other driver with information", vi: "hỗ trợ trao đổi thông tin với tài xế kia" },
          { en: "help guide traffic around the scene", vi: "giúp điều tiết xe cộ tránh hiện trường" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "call 24/7 roadside assistance service", vi: "gọi dịch vụ cứu hộ khẩn cấp 24/7" },
          { en: "contact auto insurance claim service", vi: "liên hệ dịch vụ giải quyết bảo hiểm xe hơi" },
          { en: "book certified auto body repair service", vi: "đặt dịch vụ sửa chữa thân vỏ xe uy tín" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "assess fender dent and paint damage", vi: "đánh giá vết móp cản xe và trầy xước sơn" },
          { en: "resolve liability dispute calmly", vi: "bình tĩnh giải quyết tranh chấp trách nhiệm" },
          { en: "report road obstruction issue", vi: "báo cáo sự cố gây cản trở giao thông" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1594824813682-1249fa02462e?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "turn on emergency hazard lights", vi: "bật đèn cảnh báo nguy hiểm khẩn cấp" },
          { en: "photograph vehicle license plates and damage", vi: "chụp ảnh biển số xe và các vết va chạm" },
          { en: "file accident police report", vi: "lập biên bản tai nạn với cảnh sát" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "keep emergency triangle available", vi: "chuẩn bị sẵn biển cảnh báo tam giác phản quang" },
          { en: "exchange available contact details", vi: "trao đổi thông tin liên lạc hiện có" },
          { en: "check if replacement rental car is available", vi: "kiểm tra xem có sẵn xe thuê thay thế không" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Minor car accident. Respond naturally to the user.",
    tags: ["parking-driving","daily-life"]
  },
  {
    id: "daily-park-05",
    category: 'daily_situations',
    subcategory: 'parking_driving',
    level: "A2",
    titleEn: "At the gas station",
    titleVi: "Tại trạm xăng",
    icon: "⛽",
    situationVi: "Bạn đang trong tình huống: Tại trạm xăng. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for at the gas station.", textVi: "Chào, tôi ở đây để tại trạm xăng." },
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
          { en: "ask station attendant to assist pumping", vi: "nhờ nhân viên trạm xăng giúp bơm xăng" },
          { en: "assist with checking tire pressure", vi: "hỗ trợ kiểm tra áp suất lốp xe" },
          { en: "help wash windshield cleanly", vi: "giúp lau sạch kính chắn gió" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "use full-service fuel lane", vi: "dùng làn xăng có phục vụ tận nơi" },
          { en: "visit automated drive-through car wash service", vi: "sử dụng dịch vụ rửa xe tự động" },
          { en: "stop by convenience store service", vi: "ghé cửa hàng tiện lợi tại cây xăng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "fix faulty fuel pump nozzle", vi: "xử lý vòi bơm xăng bị rò rỉ" },
          { en: "avoid putting wrong fuel grade", vi: "tránh đổ nhầm loại xăng không tương thích" },
          { en: "report payment terminal malfunction", vi: "báo cáo cột bơm không nhận thẻ thanh toán" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "turn off engine before refueling", vi: "tắt máy động cơ trước khi đổ xăng" },
          { en: "insert nozzle and squeeze lever", vi: "đặt vòi bơm vào bình và bóp cò" },
          { en: "tighten gas cap until it clicks", vi: "vặn chặt nắp bình xăng cho đến khi nghe tiếng tách" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1562619371-b67725b6fde2?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check if premium fuel is available", vi: "kiểm tra xem còn loại xăng cao cấp không" },
          { en: "pull up to first available pump", vi: "tiến xe vào trụ bơm trống đầu tiên" },
          { en: "use available free air compressor", vi: "sử dụng máy bơm hơi miễn phí có sẵn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: At the gas station. Respond naturally to the user.",
    tags: ["parking-driving","daily-life"]
  }
];
