/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: public_transport
 * File: src/data/speaking/topic-library/daily-situations/public-transport.ts
 *
 * 6 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const PUBLIC_TRANSPORT_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-trans-01",
    category: 'daily_situations',
    subcategory: 'public_transport',
    level: "A1",
    titleEn: "Taking a city bus",
    titleVi: "Đi xe buýt thành phố",
    icon: "🚌",
    situationVi: "Bạn đang trong tình huống: Đi xe buýt thành phố. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for taking a city bus.", textVi: "Chào, tôi ở đây để đi xe buýt thành phố." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "ticket",
        ipa: "/ˈtɪkɪt/",
        partOfSpeech: "n.",
        meaningVi: "vé",
        exampleEn: "Buy a ticket.",
        exampleVi: "Mua một cái vé.",
        associatedActions: [
          { en: "tap contactless smartcard on reader", vi: "quẹt thẻ thông minh không tiếp xúc vào đầu đọc" },
          { en: "purchase single ride bus ticket", vi: "mua vé xe buýt chuyến đơn" },
          { en: "show monthly transit pass to driver", vi: "xuất trình vé tháng cho bác tài" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "station",
        ipa: "/ˈsteɪʃən/",
        partOfSpeech: "n.",
        meaningVi: "nhà ga",
        exampleEn: "The train station.",
        exampleVi: "Nhà ga xe lửa.",
        associatedActions: [
          { en: "wait under the sheltered bus stop", vi: "đợi xe tại nhà chờ xe buýt có mái che" },
          { en: "check timetable board at station", vi: "tra cứu bảng giờ xuất bến tại trạm" },
          { en: "signal bus as it approaches stop", vi: "vẫy tay ra hiệu khi xe buýt tiến vào trạm" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "handle overcrowded bus issue", vi: "xử lý tình trạng xe buýt quá đông khách" },
          { en: "report missing bus stop buzzer issue", vi: "báo cáo nút chuông báo dừng xe bị hỏng" },
          { en: "solve missing exact change issue", vi: "giải quyết sự cố thiếu tiền lẻ trả vé" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1508873696983-2df5293cb325?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "board through the front door", vi: "lên xe qua cửa trước" },
          { en: "hold onto safety handrails firmly", vi: "nắm chắc tay vịn an toàn" },
          { en: "press stop bell before desired stop", vi: "bấm chuông báo dừng trước trạm cần xuống" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "offer available seat to elderly passenger", vi: "nhường ghế trống cho người cao tuổi" },
          { en: "check next available bus arrival time", vi: "kiểm tra thời gian chuyến buýt tiếp theo ghé bến" },
          { en: "use available onboard free Wi-Fi", vi: "sử dụng Wi-Fi miễn phí có sẵn trên xe" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "When does the bus arrive?", meaningVi: "Khi nào xe buýt đến?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Taking a city bus. Respond naturally to the user.",
    tags: ["public-transport","daily-life"]
  },
  {
    id: "daily-trans-02",
    category: 'daily_situations',
    subcategory: 'public_transport',
    level: "A2",
    titleEn: "Using the metro/subway",
    titleVi: "Sử dụng tàu điện ngầm",
    icon: "🚇",
    situationVi: "Bạn đang trong tình huống: Sử dụng tàu điện ngầm. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for using the metro/subway.", textVi: "Chào, tôi ở đây để sử dụng tàu điện ngầm." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "ticket",
        ipa: "/ˈtɪkɪt/",
        partOfSpeech: "n.",
        meaningVi: "vé",
        exampleEn: "Buy a ticket.",
        exampleVi: "Mua một cái vé.",
        associatedActions: [
          { en: "purchase single-journey subway token", vi: "mua xu đi tàu điện ngầm một lượt" },
          { en: "recharge metro card at kiosk", vi: "nạp thêm tiền vào thẻ tàu điện tại quầy máy" },
          { en: "scan QR code at ticket turnstile", vi: "quét mã QR qua cổng soát vé" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "station",
        ipa: "/ˈsteɪʃən/",
        partOfSpeech: "n.",
        meaningVi: "nhà ga",
        exampleEn: "The train station.",
        exampleVi: "Nhà ga xe lửa.",
        associatedActions: [
          { en: "walk down stairs to underground station", vi: "đi bộ xuống ga ngầm dưới lòng đất" },
          { en: "wait behind yellow safety line on platform", vi: "đứng chờ sau vạch an toàn màu vàng trên sân ga" },
          { en: "locate interchange transfer tunnel", vi: "xác định đường hầm chuyển tuyến trung chuyển" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1519817914152-22d216bb9170?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "resolve ticket gate error buzz", vi: "xử lý sự cố cổng soát vé báo lỗi kêu bíp" },
          { en: "handle getting off at wrong station", vi: "xử lý khi lỡ xuống nhầm nhà ga" },
          { en: "report lost item to station master", vi: "báo cáo tài sản thất lạc cho trưởng ga" }
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
          { en: "pass through electronic turnstiles", vi: "bước qua cửa xoay tự động" },
          { en: "let passengers off train first", vi: "nhường hành khách trên tàu bước xuống trước" },
          { en: "follow exit signs toward street level", vi: "đi theo biển chỉ dẫn lối ra mặt đường" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check if escalator is available", vi: "kiểm tra xem thang cuốn có hoạt động không" },
          { en: "board the next available train", vi: "lên chuyến tàu điện tiếp theo" },
          { en: "look for available priority seats", vi: "tìm kiếm chỗ ngồi ưu tiên còn trống" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "When does the bus arrive?", meaningVi: "Khi nào xe buýt đến?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Using the metro/subway. Respond naturally to the user.",
    tags: ["public-transport","daily-life"]
  },
  {
    id: "daily-trans-03",
    category: 'daily_situations',
    subcategory: 'public_transport',
    level: "A2",
    titleEn: "Hailing a taxi/Grab",
    titleVi: "Gọi taxi/Grab",
    icon: "🚕",
    situationVi: "Bạn đang trong tình huống: Gọi taxi/Grab. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for hailing a taxi/grab.", textVi: "Chào, tôi ở đây để gọi taxi/grab." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "ticket",
        ipa: "/ˈtɪkɪt/",
        partOfSpeech: "n.",
        meaningVi: "vé",
        exampleEn: "Buy a ticket.",
        exampleVi: "Mua một cái vé.",
        associatedActions: [
          { en: "request electronic ride e-receipt", vi: "yêu cầu gửi biên lai chuyến đi điện tử" },
          { en: "apply ride-hailing discount voucher", vi: "áp dụng mã khuyến mãi giảm giá chuyến đi" },
          { en: "verify booking confirmation code", vi: "xác minh mã xác nhận đặt xe" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "station",
        ipa: "/ˈsteɪʃən/",
        partOfSpeech: "n.",
        meaningVi: "nhà ga",
        exampleEn: "The train station.",
        exampleVi: "Nhà ga xe lửa.",
        associatedActions: [
          { en: "wait at designated taxi stand", vi: "chờ xe tại điểm đón taxi quy định" },
          { en: "set pickup point near station exit", vi: "ghim điểm đón gần lối ra nhà ga" },
          { en: "hail a passing yellow cab on street", vi: "vẫy chiếc taxi màu vàng đang chạy trên phố" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "clarify driver navigation detour issue", vi: "làm rõ việc tài xế đi đường vòng tránh tắc" },
          { en: "resolve meter discrepancy politely", vi: "lịch sự thắc mắc về đồng hồ tính tiền" },
          { en: "report left-behind smartphone in backseat", vi: "báo quên điện thoại ở hàng ghế sau xe" }
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
          { en: "input drop-off destination in app", vi: "nhập địa chỉ điểm đến vào ứng dụng" },
          { en: "check license plate number before boarding", vi: "kiểm tra biển số xe trước khi lên" },
          { en: "pay via linked e-wallet upon arrival", vi: "thanh toán qua ví điện tử liên kết khi tới nơi" }
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
          { en: "check if 7-seater cars are available", vi: "kiểm tra xem có sẵn xe 7 chỗ không" },
          { en: "book first available driver nearby", vi: "đặt tài xế gần nhất đang rảnh xe" },
          { en: "wait when no cars are currently available", vi: "chờ một lát khi xung quanh chưa có xe trống" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "When does the bus arrive?", meaningVi: "Khi nào xe buýt đến?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Hailing a taxi/Grab. Respond naturally to the user.",
    tags: ["public-transport","daily-life"]
  },
  {
    id: "daily-trans-04",
    category: 'daily_situations',
    subcategory: 'public_transport',
    level: "A2",
    titleEn: "Buying a train ticket",
    titleVi: "Mua vé tàu",
    icon: "🎫",
    situationVi: "Bạn đang trong tình huống: Mua vé tàu. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for buying a train ticket.", textVi: "Chào, tôi ở đây để mua vé tàu." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "ticket",
        ipa: "/ˈtɪkɪt/",
        partOfSpeech: "n.",
        meaningVi: "vé",
        exampleEn: "Buy a ticket.",
        exampleVi: "Mua một cái vé.",
        associatedActions: [
          { en: "book round-trip train ticket", vi: "đặt vé tàu khứ hồi" },
          { en: "select first-class soft sleeper berth", vi: "chọn giường nằm mềm khoang hạng nhất" },
          { en: "print physical boarding pass at kiosk", vi: "in vé lên tàu giấy tại quầy tự phục vụ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "station",
        ipa: "/ˈsteɪʃən/",
        partOfSpeech: "n.",
        meaningVi: "nhà ga",
        exampleEn: "The train station.",
        exampleVi: "Nhà ga xe lửa.",
        associatedActions: [
          { en: "arrive at central railway station early", vi: "đến ga xe lửa trung tâm từ sớm" },
          { en: "wait in passenger concourse lounge", vi: "ngồi chờ ở sảnh chờ hành khách" },
          { en: "proceed to platform number four", vi: "di chuyển đến ke ga số 4" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "solve booked-out holiday ticket issue", vi: "xử lý tình trạng cháy vé tàu dịp lễ" },
          { en: "request refund for canceled trip", vi: "yêu cầu hoàn tiền vé chuyến đi đã hủy" },
          { en: "correct misspelled name on ticket", vi: "sửa lại tên bị gõ sai trên vé" }
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
          { en: "show national identity card at ticket counter", vi: "xuất trình căn cước công dân tại quầy vé" },
          { en: "choose preferred window or aisle seat", vi: "chọn chỗ ngồi gần cửa sổ hoặc gần lối đi" },
          { en: "pass luggage through security scanner", vi: "đưa hành lý qua máy quét an ninh" }
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
          { en: "check if sleeper berths are still available", vi: "kiểm tra xem vé giường nằm còn chỗ không" },
          { en: "inquire about available student discounts", vi: "hỏi về các chương trình giảm giá vé cho sinh viên" },
          { en: "join waiting list if no tickets are available", vi: "ghi danh vào danh sách chờ nếu tạm hết vé" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "When does the bus arrive?", meaningVi: "Khi nào xe buýt đến?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Buying a train ticket. Respond naturally to the user.",
    tags: ["public-transport","daily-life"]
  },
  {
    id: "daily-trans-05",
    category: 'daily_situations',
    subcategory: 'public_transport',
    level: "A1",
    titleEn: "Asking for directions at a station",
    titleVi: "Hỏi đường tại nhà ga",
    icon: "🗺️",
    situationVi: "Bạn đang trong tình huống: Hỏi đường tại nhà ga. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for asking for directions at a station.", textVi: "Chào, tôi ở đây để hỏi đường tại nhà ga." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "ticket",
        ipa: "/ˈtɪkɪt/",
        partOfSpeech: "n.",
        meaningVi: "vé",
        exampleEn: "Buy a ticket.",
        exampleVi: "Mua một cái vé.",
        associatedActions: [
          { en: "show ticket destination to station clerk", vi: "đưa điểm đến trên vé cho nhân viên ga xem" },
          { en: "validate ticket at customer assistance window", vi: "xác thực lại vé tại quầy hỗ trợ khách hàng" },
          { en: "check platform gate number printed on ticket", vi: "xem số cổng ra sân ga in trên cuống vé" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "station",
        ipa: "/ˈsteɪʃən/",
        partOfSpeech: "n.",
        meaningVi: "nhà ga",
        exampleEn: "The train station.",
        exampleVi: "Nhà ga xe lửa.",
        associatedActions: [
          { en: "navigate complex multi-level station layout", vi: "định hướng trong khuôn viên ga nhiều tầng phức tạp" },
          { en: "locate the north exit concourse", vi: "tìm sảnh lối ra phía bắc" },
          { en: "find luggage storage locker in station", vi: "tìm tủ gửi đồ hành lý tự động trong ga" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1519817914152-22d216bb9170?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "overcome foreign language barrier issue", vi: "vượt qua trở ngại rào cản ngôn ngữ" },
          { en: "get assistance when lost between platforms", vi: "nhờ chỉ dẫn khi bị lạc giữa các sân ga" },
          { en: "clarify confusing transit signage", vi: "nhờ giải thích biển báo chỉ dẫn khó hiểu" }
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
          { en: "approach the information booth politely", vi: "lịch sự tiến lại quầy thông tin hướng dẫn" },
          { en: "ask for a free transit network map", vi: "xin bản đồ mạng lưới tuyến xe miễn phí" },
          { en: "follow overhead color-coded line signs", vi: "đi theo các biển màu chỉ dẫn trên trần ga" }
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
          { en: "check if bilingual staff is available", vi: "hỏi xem có nhân viên nói tiếng Anh trực không" },
          { en: "take available station brochure guides", vi: "lấy tờ rơi hướng dẫn có sẵn tại ga" },
          { en: "confirm elevator is available for wheelchair", vi: "xác nhận có thang máy hỗ trợ xe lăn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "When does the bus arrive?", meaningVi: "Khi nào xe buýt đến?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Asking for directions at a station. Respond naturally to the user.",
    tags: ["public-transport","daily-life"]
  },
  {
    id: "daily-trans-06",
    category: 'daily_situations',
    subcategory: 'public_transport',
    level: "B1",
    titleEn: "Dealing with delays/cancellations",
    titleVi: "Xử lý khi bị trễ/hủy chuyến",
    icon: "⏳",
    situationVi: "Bạn đang trong tình huống: Xử lý khi bị trễ/hủy chuyến. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for dealing with delays/cancellations.", textVi: "Chào, tôi ở đây để xử lý khi bị trễ/hủy chuyến." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "ticket",
        ipa: "/ˈtɪkɪt/",
        partOfSpeech: "n.",
        meaningVi: "vé",
        exampleEn: "Buy a ticket.",
        exampleVi: "Mua một cái vé.",
        associatedActions: [
          { en: "exchange delayed ticket for next train", vi: "đổi vé chuyến bị trễ sang chuyến tàu tiếp theo" },
          { en: "endorse ticket for alternative transit route", vi: "đóng dấu chuyển vé sang lộ trình thay thế" },
          { en: "claim full refund for canceled journey", vi: "yêu cầu hoàn 100% tiền vé cho chuyến bị hủy" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "station",
        ipa: "/ˈsteɪʃən/",
        partOfSpeech: "n.",
        meaningVi: "nhà ga",
        exampleEn: "The train station.",
        exampleVi: "Nhà ga xe lửa.",
        associatedActions: [
          { en: "listen to audio announcements in station", vi: "lắng nghe thông báo phát thanh trong nhà ga" },
          { en: "check electronic departure display board", vi: "theo dõi bảng điện tử hiển thị giờ xuất bến" },
          { en: "queue at station customer service counter", vi: "xếp hàng tại quầy chăm sóc khách hàng của ga" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "handle missed connection flight or train", vi: "xử lý sự cố bị lỡ chuyến bay hoặc tàu chuyển tiếp" },
          { en: "deal with severe track maintenance delay", vi: "xử lý việc tàu bị chậm do bảo trì đường ray" },
          { en: "cope with bad weather transit suspension", vi: "tìm phương án khi giao thông ngưng trệ vì thời tiết xấu" }
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
          { en: "request delay certificate for employer", vi: "xin giấy chứng nhận tàu trễ gửi cho công ty" },
          { en: "board emergency replacement shuttle bus", vi: "lên xe buýt trung chuyển tăng cường khẩn cấp" },
          { en: "submit compensation claim form online", vi: "nộp đơn yêu cầu bồi thường trực tuyến" }
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
          { en: "check earliest available alternative departure", vi: "kiểm tra chuyến xe thay thế sớm nhất có thể" },
          { en: "receive available complimentary meal vouchers", vi: "nhận phiếu ăn uống miễn phí hỗ trợ khi bị trễ" },
          { en: "confirm hotel accommodation is available", vi: "xác nhận khách sạn lưu trú hỗ trợ hành khách" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1508873696983-2df5293cb325?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "When does the bus arrive?", meaningVi: "Khi nào xe buýt đến?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Dealing with delays/cancellations. Respond naturally to the user.",
    tags: ["public-transport","daily-life"]
  }
];
