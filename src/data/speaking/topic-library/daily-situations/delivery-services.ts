/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: delivery_services
 * File: src/data/speaking/topic-library/daily-situations/delivery-services.ts
 *
 * 5 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const DELIVERY_SERVICES_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-deliv-01",
    category: 'daily_situations',
    subcategory: 'delivery_services',
    level: "A1",
    titleEn: "Ordering food delivery",
    titleVi: "Đặt giao đồ ăn",
    icon: "🛵",
    situationVi: "Bạn đang trong tình huống: Đặt giao đồ ăn. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for ordering food delivery.", textVi: "Chào, tôi ở đây để đặt giao đồ ăn." },
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
          { en: "assist courier with building gate code", vi: "hỗ trợ shipper mã mở cổng tòa nhà" },
          { en: "help deliver hot meals quickly", vi: "giúp giao đồ ăn nóng nhanh chóng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "order through food delivery service", vi: "đặt qua dịch vụ giao đồ ăn" },
          { en: "rate courier delivery service", vi: "đánh giá dịch vụ giao hàng của shipper" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "report spilled soup or drink", vi: "báo cáo súp hoặc nước uống bị đổ" },
          { en: "contact driver about delayed meal", vi: "liên hệ tài xế vì bữa ăn bị trễ" }
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
          { en: "place food order on mobile app", vi: "đặt món ăn trên ứng dụng di động" },
          { en: "track rider route in real time", vi: "theo dõi lộ trình tài xế theo thời gian thực" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check available restaurants nearby", vi: "kiểm tra quán ăn gần đây đang mở cửa" },
          { en: "view available delivery discount vouchers", vi: "xem mã giảm giá vận chuyển có sẵn" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Ordering food delivery. Respond naturally to the user.",
    tags: ["delivery-services","daily-life"]
  },
  {
    id: "daily-deliv-02",
    category: 'daily_situations',
    subcategory: 'delivery_services',
    level: "A2",
    titleEn: "Tracking a package delivery",
    titleVi: "Theo dõi giao bưu kiện",
    icon: "📦",
    situationVi: "Bạn đang trong tình huống: Theo dõi giao bưu kiện. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for tracking a package delivery.", textVi: "Chào, tôi ở đây để theo dõi giao bưu kiện." },
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
          { en: "assist in locating package in warehouse", vi: "hỗ trợ tìm gói hàng trong kho" },
          { en: "help confirm delivery address", vi: "giúp xác nhận lại địa chỉ giao nhận" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "use 24-hour postal tracking service", vi: "dùng dịch vụ tra cứu bưu điện 24 giờ" },
          { en: "subscribe to SMS alert service", vi: "đăng ký dịch vụ thông báo qua tin nhắn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "resolve parcel stuck in transit", vi: "xử lý kiện hàng bị kẹt trên đường vận chuyển" },
          { en: "report incorrect delivery status", vi: "báo cáo trạng thái giao hàng bị sai lệch" }
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
          { en: "enter tracking number online", vi: "nhập mã vận đơn trực tuyến" },
          { en: "monitor shipping milestones", vi: "theo dõi các mốc vận chuyển bưu kiện" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check if same-day delivery is available", vi: "kiểm tra có hỗ trợ giao trong ngày không" },
          { en: "verify available pickup lockers", vi: "xác minh tủ khóa lấy hàng còn trống" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Tracking a package delivery. Respond naturally to the user.",
    tags: ["delivery-services","daily-life"]
  },
  {
    id: "daily-deliv-03",
    category: 'daily_situations',
    subcategory: 'delivery_services',
    level: "B1",
    titleEn: "Missing or damaged parcel",
    titleVi: "Bưu kiện bị mất hoặc hư hỏng",
    icon: "💔",
    situationVi: "Bạn đang trong tình huống: Bưu kiện bị mất hoặc hư hỏng. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for missing or damaged parcel.", textVi: "Chào, tôi ở đây để bưu kiện bị mất hoặc hư hỏng." },
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
          { en: "assist customer with damage claim", vi: "hỗ trợ khách hàng làm hồ sơ bồi thường hàng vỡ" },
          { en: "help file complaint with carrier", vi: "giúp nộp đơn khiếu nại tới đơn vị vận chuyển" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "contact carrier customer service hotline", vi: "gọi đường dây nóng chăm sóc khách hàng" },
          { en: "claim package shipping insurance service", vi: "yêu cầu dịch vụ bảo hiểm bưu kiện" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "photograph crushed cardboard box", vi: "chụp ảnh thùng các tông bị móp méo" },
          { en: "report missing parcel contents", vi: "báo cáo việc thiếu đồ đạc bên trong" }
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
          { en: "submit photos for refund process", vi: "gửi hình ảnh làm thủ tục hoàn tiền" },
          { en: "track investigation claim ticket", vi: "theo dõi phiếu yêu cầu điều tra thất lạc" }
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
          { en: "check available refund options", vi: "kiểm tra các phương thức hoàn tiền khả dụng" },
          { en: "request available replacement item", vi: "yêu cầu gửi món hàng thay thế có sẵn" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Missing or damaged parcel. Respond naturally to the user.",
    tags: ["delivery-services","daily-life"]
  },
  {
    id: "daily-deliv-04",
    category: 'daily_situations',
    subcategory: 'delivery_services',
    level: "A2",
    titleEn: "Giving delivery instructions",
    titleVi: "Đưa ra hướng dẫn giao hàng",
    icon: "🗺️",
    situationVi: "Bạn đang trong tình huống: Đưa ra hướng dẫn giao hàng. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for giving delivery instructions.", textVi: "Chào, tôi ở đây để đưa ra hướng dẫn giao hàng." },
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
          { en: "assist driver with parking entrance", vi: "chỉ dẫn tài xế lối vào bãi đỗ xe" },
          { en: "help locate doorbell button", vi: "giúp xác định vị trí chuông cửa" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "request contactless doorstep drop-off service", vi: "yêu cầu dịch vụ giao hàng không tiếp xúc trước cửa" },
          { en: "utilize concierge receiving service", vi: "sử dụng dịch vụ nhận hàng của lễ tân tòa nhà" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "prevent delivery to wrong doorstep", vi: "ngăn việc giao nhầm hàng trước cửa nhà khác" },
          { en: "clarify hard-to-find apartment block", vi: "hướng dẫn rõ khối nhà chung cư khó tìm" }
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
          { en: "add special notes in delivery app", vi: "thêm ghi chú đặc biệt trên ứng dụng giao hàng" },
          { en: "confirm drop-off photo from driver", vi: "xác nhận ảnh chụp vị trí để hàng của tài xế" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check if neighbor is available to receive", vi: "hỏi xem hàng xóm có nhà để nhận hộ không" },
          { en: "specify available delivery time slot", vi: "chỉ định khung giờ giao hàng thuận tiện" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Giving delivery instructions. Respond naturally to the user.",
    tags: ["delivery-services","daily-life"]
  },
  {
    id: "daily-deliv-05",
    category: 'daily_situations',
    subcategory: 'delivery_services',
    level: "B1",
    titleEn: "Returning goods via courier",
    titleVi: "Trả lại hàng qua chuyển phát nhanh",
    icon: "🔁",
    situationVi: "Bạn đang trong tình huống: Trả lại hàng qua chuyển phát nhanh. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for returning goods via courier.", textVi: "Chào, tôi ở đây để trả lại hàng qua chuyển phát nhanh." },
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
          { en: "assist courier with weighing return box", vi: "hỗ trợ nhân viên giao nhận cân kiện hàng trả" },
          { en: "help seal return shipping carton", vi: "giúp dán kín thùng các tông hàng trả lại" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "book doorstep courier pickup service", vi: "đặt dịch vụ nhân viên đến tận nhà lấy hàng" },
          { en: "print return label via postal service", vi: "in phiếu gửi trả hàng qua dịch vụ bưu điện" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "fix missing barcode label issue", vi: "sửa lỗi thiếu nhãn mã vạch trả hàng" },
          { en: "clarify courier pickup delay", vi: "làm rõ việc tài xế đến lấy hàng bị trễ" }
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
          { en: "affix return label firmly on package", vi: "dán chắc nhãn gửi trả lên kiện hàng" },
          { en: "get handover signature from courier", vi: "xin chữ ký bàn giao từ nhân viên chuyển phát" }
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
          { en: "check courier available pickup slots", vi: "kiểm tra khung giờ lấy hàng của nhân viên" },
          { en: "find nearest available drop-off point", vi: "tìm điểm gửi hàng gần nhất có hoạt động" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Returning goods via courier. Respond naturally to the user.",
    tags: ["delivery-services","daily-life"]
  }
];
