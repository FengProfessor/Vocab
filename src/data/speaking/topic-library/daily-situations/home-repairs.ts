/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: home_repairs
 * File: src/data/speaking/topic-library/daily-situations/home-repairs.ts
 *
 * 5 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const HOME_REPAIRS_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-repair-01",
    category: 'daily_situations',
    subcategory: 'home_repairs',
    level: "A2",
    titleEn: "Calling a plumber",
    titleVi: "Gọi thợ sửa ống nước",
    icon: "🔧",
    situationVi: "Bạn đang trong tình huống: Gọi thợ sửa ống nước. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for calling a plumber.", textVi: "Chào, tôi ở đây để gọi thợ sửa ống nước." },
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
          { en: "assist plumber in locating water main", vi: "giúp thợ sửa ống nước tìm van nước chính" },
          { en: "help clear space under leaky sink", vi: "giúp dọn chỗ trống dưới bồn rửa bị rò" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "call 24-7 emergency plumbing service", vi: "gọi dịch vụ sửa ống nước khẩn cấp 24/7" },
          { en: "request pipe maintenance service", vi: "yêu cầu dịch vụ bảo trì đường ống nước" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "fix burst pipe in bathroom", vi: "khắc phục đường ống nước vỡ trong nhà tắm" },
          { en: "unclog stubborn kitchen drain", vi: "thông tắc cống bồn rửa bát bị nghẹt" }
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
          { en: "shut off main water valve", vi: "khóa van cấp nước tổng" },
          { en: "replace cracked PVC pipe fitting", vi: "thay khớp nối ống nhựa PVC bị nứt" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "ask if emergency plumber is available", vi: "hỏi xem thợ sửa khẩn cấp có rảnh không" },
          { en: "check available replacement gaskets", vi: "kiểm tra gioăng cao su thay thế còn sẵn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Calling a plumber. Respond naturally to the user.",
    tags: ["home-repairs","daily-life"]
  },
  {
    id: "daily-repair-02",
    category: 'daily_situations',
    subcategory: 'home_repairs',
    level: "B1",
    titleEn: "Electrician visit for power outage",
    titleVi: "Thợ điện đến kiểm tra mất điện",
    icon: "⚡",
    situationVi: "Bạn đang trong tình huống: Thợ điện đến kiểm tra mất điện. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for electrician visit for power outage.", textVi: "Chào, tôi ở đây để thợ điện đến kiểm tra mất điện." },
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
          { en: "assist electrician by holding flashlight", vi: "hỗ trợ thợ điện bằng cách cầm đèn pin" },
          { en: "help point out short-circuited outlets", vi: "chỉ giúp các ổ cắm điện bị chập cháy" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "book certified electrical repair service", vi: "đặt dịch vụ sửa chữa điện có chứng chỉ" },
          { en: "request home wiring inspection service", vi: "yêu cầu dịch vụ kiểm tra mạng lưới điện gia đình" }
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
          { en: "diagnose tripped circuit breaker", vi: "chẩn đoán cầu dao điện bị nhảy ngắt" },
          { en: "repair sparking wall socket", vi: "sửa ổ điện trên tường bị tóe tia lửa" }
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
          { en: "test voltage with digital multimeter", vi: "đo điện áp bằng đồng hồ vạn năng" },
          { en: "rewire burned fuse box cables", vi: "nối lại dây cáp hộp cầu chì bị cháy" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "inquire about technician available time", vi: "hỏi thời gian kỹ thuật viên có mặt" },
          { en: "check available spare fuses", vi: "kiểm tra cầu chì dự phòng còn sẵn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Electrician visit for power outage. Respond naturally to the user.",
    tags: ["home-repairs","daily-life"]
  },
  {
    id: "daily-repair-03",
    category: 'daily_situations',
    subcategory: 'home_repairs',
    level: "A2",
    titleEn: "Fixing an air conditioner",
    titleVi: "Sửa chữa máy điều hòa",
    icon: "❄️",
    situationVi: "Bạn đang trong tình huống: Sửa chữa máy điều hòa. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for fixing an air conditioner.", textVi: "Chào, tôi ở đây để sửa chữa máy điều hòa." },
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
          { en: "assist technician in reaching AC unit", vi: "giúp thợ tiếp cận vị trí cục nóng điều hòa" },
          { en: "help clear dust sheets on furniture", vi: "giúp trải bạt che bụi lên đồ nội thất" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "schedule annual AC servicing", vi: "lên lịch bảo dưỡng điều hòa định kỳ hàng năm" },
          { en: "request gas refilling service", vi: "yêu cầu dịch vụ nạp gas điều hòa" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "fix dripping indoor cooling unit", vi: "khắc phục cục lạnh trong nhà bị rò nước" },
          { en: "resolve AC blowing warm air", vi: "xử lý tình trạng điều hòa chỉ thổi gió nóng" }
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
          { en: "wash air filter mesh thoroughly", vi: "rửa sạch tấm lưới lọc không khí" },
          { en: "recharge refrigerant gas levels", vi: "bơm nạp khí môi chất làm lạnh" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check if AC specialist is available today", vi: "hỏi chuyên viên sửa điều hòa có rảnh hôm nay không" },
          { en: "find available replacement compressor parts", vi: "tìm linh kiện máy nén thay thế có sẵn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Fixing an air conditioner. Respond naturally to the user.",
    tags: ["home-repairs","daily-life"]
  },
  {
    id: "daily-repair-04",
    category: 'daily_situations',
    subcategory: 'home_repairs',
    level: "B1",
    titleEn: "Reporting broken appliances to landlord",
    titleVi: "Báo cáo thiết bị hỏng cho chủ nhà",
    icon: "🏠",
    situationVi: "Bạn đang trong tình huống: Báo cáo thiết bị hỏng cho chủ nhà. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for reporting broken appliances to landlord.", textVi: "Chào, tôi ở đây để báo cáo thiết bị hỏng cho chủ nhà." },
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
          { en: "assist landlord with appliance inspection", vi: "hỗ trợ chủ nhà kiểm tra thiết bị gia dụng" },
          { en: "help translate technician instructions", vi: "giúp dịch lại hướng dẫn của nhân viên kỹ thuật" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "request landlord appliance repair service", vi: "yêu cầu chủ nhà cung cấp dịch vụ sửa chữa" },
          { en: "contact property management repair team", vi: "liên hệ ban quản lý tòa nhà để sửa đồ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "report broken refrigerator thermostat", vi: "báo cáo rơ-le nhiệt tủ lạnh bị hỏng" },
          { en: "document non-draining washing machine", vi: "ghi nhận máy giặt không xả được nước" }
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
          { en: "send damage photos to landlord via email", vi: "gửi ảnh hiện trường hỏng hóc cho chủ nhà qua email" },
          { en: "sign repair work order confirmation", vi: "ký xác nhận phiếu nghiệm thu sửa chữa" }
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
          { en: "ask when landlord is available to visit", vi: "hỏi khi nào chủ nhà có thể qua xem" },
          { en: "verify available replacement microwave", vi: "kiểm tra lò vi sóng thay thế có sẵn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Reporting broken appliances to landlord. Respond naturally to the user.",
    tags: ["home-repairs","daily-life"]
  },
  {
    id: "daily-repair-05",
    category: 'daily_situations',
    subcategory: 'home_repairs',
    level: "A2",
    titleEn: "DIY home maintenance",
    titleVi: "Tự sửa chữa bảo dưỡng nhà cửa",
    icon: "🔨",
    situationVi: "Bạn đang trong tình huống: Tự sửa chữa bảo dưỡng nhà cửa. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for diy home maintenance.", textVi: "Chào, tôi ở đây để tự sửa chữa bảo dưỡng nhà cửa." },
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
          { en: "assist partner by holding ladder steady", vi: "giữ thang giúp bạn cùng nhà an toàn" },
          { en: "hand tools to family member", vi: "chuyền dụng cụ cho thành viên trong gia đình" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "rent equipment from tool rental service", vi: "thuê máy móc từ dịch vụ cho thuê đồ nghề" },
          { en: "watch video tutorial advice service", vi: "xem hướng dẫn từ dịch vụ tư vấn kỹ thuật" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "patch peeling drywall paint", vi: "dặm vá lớp sơn tường thạch cao bị bong tróc" },
          { en: "tighten loose cupboard door hinges", vi: "siết chặt bản lề cánh cửa tủ bị lỏng" }
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
          { en: "apply waterproof silicone sealant", vi: "bôi keo silicone chống thấm nước" },
          { en: "sand wood surface before repainting", vi: "chà nhám bề mặt gỗ trước khi sơn lại" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check available screws in toolbox", vi: "kiểm tra ốc vít còn sẵn trong hộp đồ nghề" },
          { en: "buy available paint cans at hardware shop", vi: "mua thùng sơn có sẵn tại tiệm kim khí" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: DIY home maintenance. Respond naturally to the user.",
    tags: ["home-repairs","daily-life"]
  }
];
