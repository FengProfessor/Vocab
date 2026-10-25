/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: at_the_laundry
 * File: src/data/speaking/topic-library/daily-situations/at-the-laundry.ts
 *
 * 4 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const AT_THE_LAUNDRY_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-laun-01",
    category: 'daily_situations',
    subcategory: 'at_the_laundry',
    level: "A2",
    titleEn: "Dropping off clothes",
    titleVi: "Gửi quần áo",
    icon: "👕",
    situationVi: "Bạn đang trong tình huống: Gửi quần áo. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for dropping off clothes.", textVi: "Chào, tôi ở đây để gửi quần áo." },
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
          { en: "assist customer with garment drop-off", vi: "hỗ trợ khách hàng gửi đồ giặt tại quầy" },
          { en: "help sort whites and dark colors", vi: "giúp phân loại quần áo trắng và quần áo màu" },
          { en: "check pockets for forgotten items", vi: "kiểm tra túi quần áo xem còn sót đồ không" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "request wash and fold service", vi: "yêu cầu dịch vụ giặt sấy và gấp đồ" },
          { en: "choose premium dry cleaning service", vi: "chọn dịch vụ giặt khô là hơi cao cấp" },
          { en: "order same-day express laundry service", vi: "đặt dịch vụ giặt lấy ngay trong ngày" }
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
          { en: "point out stubborn grease stains", vi: "chỉ rõ các vết bẩn dầu mỡ cứng đầu" },
          { en: "report loose threads on suit jacket", vi: "báo tình trạng chỉ bị sút trên áo khoác" },
          { en: "avoid shrinking wool sweaters", vi: "tránh để áo len bị co rút sợi vải" }
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
          { en: "weigh laundry bag on scales", vi: "cân túi đồ giặt trên bàn cân" },
          { en: "tag garments with unique identification", vi: "gắn mã định danh lên từng bộ quần áo" },
          { en: "issue printed laundry ticket receipt", vi: "in phiếu biên lai hẹn ngày lấy đồ giặt" }
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
          { en: "check clothes pickup availability date", vi: "kiểm tra ngày giờ hẹn lấy quần áo" },
          { en: "confirm express turnaround is available", vi: "xác nhận dịch vụ lấy gấp có nhận không" },
          { en: "verify hanger storage is available", vi: "đảm bảo có sẵn móc treo giữ phom áo" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Dropping off clothes. Respond naturally to the user.",
    tags: ["at-the_laundry","daily-life"]
  },
  {
    id: "daily-laun-02",
    category: 'daily_situations',
    subcategory: 'at_the_laundry',
    level: "A2",
    titleEn: "Using a self-service laundromat",
    titleVi: "Sử dụng tiệm giặt tự phục vụ",
    icon: "🧺",
    situationVi: "Bạn đang trong tình huống: Sử dụng tiệm giặt tự phục vụ. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for using a self-service laundromat.", textVi: "Chào, tôi ở đây để sử dụng tiệm giặt tự phục vụ." },
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
          { en: "assist with coin changer machine", vi: "hướng dẫn đổi tiền xu tự động" },
          { en: "help customer load large washer", vi: "giúp khách chất quần áo vào máy giặt lớn" },
          { en: "show how to select wash cycle", vi: "hướng dẫn cách bấm chọn chu trình giặt" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "use self-service laundromat facilities", vi: "dùng các tiện ích giặt tự phục vụ" },
          { en: "buy detergent from vending dispenser", vi: "mua bột giặt từ máy bán hàng tự động" },
          { en: "enjoy air-conditioned laundromat lounge", vi: "ngồi phòng chờ có điều hòa của tiệm giặt" }
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
          { en: "report coin jamming in slot", vi: "báo kẹt đồng xu trong khe nhận tiền" },
          { en: "clear soap suds overflow issue", vi: "dọn dẹp sự cố bọt xà phòng tràn ra ngoài" },
          { en: "address unbalanced drum spinning", vi: "khắc phục lỗi lồng giặt quay không cân" }
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
          { en: "insert coins into machine slide", vi: "đẩy thanh trượt chứa đồng xu vào máy" },
          { en: "pour liquid detergent into tray", vi: "rót nước giặt vào khay đựng xà phòng" },
          { en: "transfer wet clothes to dryer drum", vi: "chuyển quần áo ướt sang lồng máy sấy" }
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
          { en: "find available unoccupied washing drum", vi: "tìm lồng máy giặt còn trống chưa ai dùng" },
          { en: "check commercial dryer availability", vi: "kiểm tra máy sấy công nghiệp còn trống" },
          { en: "look for available laundry folding cart", vi: "tìm giỏ đẩy quần áo đang để trống" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Using a self-service laundromat. Respond naturally to the user.",
    tags: ["at-the_laundry","daily-life"]
  },
  {
    id: "daily-laun-03",
    category: 'daily_situations',
    subcategory: 'at_the_laundry',
    level: "B1",
    titleEn: "Requesting stain removal",
    titleVi: "Yêu cầu tẩy vết bẩn",
    icon: "✨",
    situationVi: "Bạn đang trong tình huống: Yêu cầu tẩy vết bẩn. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for requesting stain removal.", textVi: "Chào, tôi ở đây để yêu cầu tẩy vết bẩn." },
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
          { en: "assist with delicate fabric care", vi: "hỗ trợ chăm sóc các loại vải mỏng manh" },
          { en: "consult staff about silk cleaning", vi: "hỏi nhân viên cách giặt sạch áo lụa" },
          { en: "guide customer on care label icons", vi: "hướng dẫn khách các ký hiệu trên mác áo" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "request gentle wool wash service", vi: "yêu cầu dịch vụ giặt đồ len chuyên dụng" },
          { en: "opt for professional steam ironing", vi: "chọn ủi bằng hơi nước chuyên nghiệp" },
          { en: "select fabric softening treatment", vi: "chọn gói xử lý làm mềm sợi vải" }
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
          { en: "prevent fabric discoloration and dye bleed", vi: "ngăn phai màu và loang màu sang đồ khác" },
          { en: "avoid thermal shrinkage on synthetics", vi: "tránh co rút nhiệt trên vải tổng hợp" },
          { en: "treat stubborn wine and oil stains", vi: "xử lý tẩy các vết rượu và dầu cứng đầu" }
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
          { en: "read manufacturer garment care label", vi: "đọc nhãn hướng dẫn bảo quản quần áo" },
          { en: "apply delicate enzyme stain remover", vi: "thoa dung dịch tẩy sinh học nhẹ dịu" },
          { en: "lay cashmere flat to dry", vi: "trải phẳng áo len cashmere để khô tự nhiên" }
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
          { en: "verify hypoallergenic detergent availability", vi: "kiểm tra có sẵn nước giặt không gây dị ứng" },
          { en: "check specialized mesh wash bags", vi: "xem có túi giặt lưới chuyên dụng không" },
          { en: "confirm delicate wash cycle is available", vi: "xác nhận máy có chế độ giặt đồ mỏng" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Requesting stain removal. Respond naturally to the user.",
    tags: ["at-the_laundry","daily-life"]
  },
  {
    id: "daily-laun-04",
    category: 'daily_situations',
    subcategory: 'at_the_laundry',
    level: "A2",
    titleEn: "Picking up dry cleaning",
    titleVi: "Lấy quần áo giặt khô",
    icon: "👔",
    situationVi: "Bạn đang trong tình huống: Lấy quần áo giặt khô. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for picking up dry cleaning.", textVi: "Chào, tôi ở đây để lấy quần áo giặt khô." },
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
          { en: "assist with lost garment inquiry", vi: "hỗ trợ tra cứu món đồ bị thất lạc" },
          { en: "help customer inspect damage claim", vi: "giúp khách hàng lập hồ sơ yêu cầu bồi thường" },
          { en: "locate misplaced laundry order", vi: "tìm kiếm đơn hàng giặt bị giao nhầm chỗ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "claim laundry guarantee compensation", vi: "yêu cầu bồi thường theo cam kết giặt là" },
          { en: "request dry cleaner dispute review", vi: "yêu cầu xem xét khiếu nại giặt là" },
          { en: "receive complimentary re-wash service", vi: "nhận dịch vụ giặt lại miễn phí đền bù" }
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
          { en: "report torn fabric during wash cycle", vi: "báo rách vải trong chu trình giặt" },
          { en: "show melted button on dress shirt", vi: "chỉ vết cúc áo sơ mi bị chảy do ủi nóng" },
          { en: "document missing items with photographs", vi: "chụp ảnh làm bằng chứng thiếu đồ" }
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
          { en: "present original laundry receipt ticket", vi: "xuất trình cuống vé biên nhận ban đầu" },
          { en: "fill out formal incident report", vi: "điền vào biên bản báo cáo sự cố" },
          { en: "track compensation claim review", vi: "theo dõi tiến độ xét duyệt bồi thường" }
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
          { en: "check lost-and-found bin availability", vi: "kiểm tra thùng chứa đồ thất lạc tìm thấy" },
          { en: "confirm store manager is available", vi: "xác nhận quản lý cửa hàng có mặt giải quyết" },
          { en: "verify insurance funds are available", vi: "đảm bảo quỹ bảo hiểm đền bù sẵn có" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Picking up dry cleaning. Respond naturally to the user.",
    tags: ["at-the_laundry","daily-life"]
  }
];
