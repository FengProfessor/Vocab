/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: celebrations_holidays
 * File: src/data/speaking/topic-library/daily-situations/celebrations-holidays.ts
 *
 * 6 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const CELEBRATIONS_HOLIDAYS_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-celeb-01",
    category: 'daily_situations',
    subcategory: 'celebrations_holidays',
    level: "A2",
    titleEn: "Birthday party planning",
    titleVi: "Lên kế hoạch tiệc sinh nhật",
    icon: "🎂",
    situationVi: "Bạn đang trong tình huống: Lên kế hoạch tiệc sinh nhật. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for birthday party planning.", textVi: "Chào, tôi ở đây để lên kế hoạch tiệc sinh nhật." },
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
          { en: "assist with party decorations", vi: "hỗ trợ trang trí bữa tiệc" },
          { en: "help set up the birthday table", vi: "giúp sắp xếp bàn tiệc sinh nhật" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "hire a party catering service", vi: "thuê dịch vụ nấu ăn cho tiệc" },
          { en: "book venue rental service", vi: "đặt dịch vụ thuê địa điểm tổ chức" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "handle guest dietary restrictions", vi: "xử lý yêu cầu ăn kiêng của khách" },
          { en: "fix last-minute schedule conflicts", vi: "giải quyết sự cố trùng lịch vào phút chót" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "send digital party invitations", vi: "gửi thiệp mời tiệc trực tuyến" },
          { en: "organize party games and music", vi: "tổ chức trò chơi và âm nhạc cho tiệc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "confirm available dates with friends", vi: "xác nhận ngày rảnh với bạn bè" },
          { en: "check bakery cake availability", vi: "kiểm tra bánh kem có sẵn tại tiệm" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Birthday party planning. Respond naturally to the user.",
    tags: ["celebrations-holidays","daily-life"]
  },
  {
    id: "daily-celeb-02",
    category: 'daily_situations',
    subcategory: 'celebrations_holidays',
    level: "A2",
    titleEn: "Lunar New Year traditions",
    titleVi: "Truyền thống Tết Nguyên Đán",
    icon: "🏮",
    situationVi: "Bạn đang trong tình huống: Truyền thống Tết Nguyên Đán. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for lunar new year traditions.", textVi: "Chào, tôi ở đây để truyền thống tết nguyên đán." },
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
          { en: "assist parents with spring cleaning", vi: "giúp bố mẹ dọn dẹp đón Tết" },
          { en: "help prepare traditional feast", vi: "hỗ trợ chuẩn bị mâm cỗ truyền thống" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1548625361-16a75f922718?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "order holiday travel shuttle service", vi: "đặt dịch vụ xe đưa đón về quê" },
          { en: "attend temple blessing ceremony", vi: "tham gia nghi lễ cầu an tại chùa" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "avoid heavy holiday traffic jams", vi: "tránh tắc đường ngày lễ Tết" },
          { en: "manage festive holiday expenses", vi: "quản lý chi tiêu trong dịp lễ hội" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "exchange red lucky money envelopes", vi: "trao tặng phong bao lì xì đỏ" },
          { en: "visit relatives to give New Year wishes", vi: "chúc Tết họ hàng người thân" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1513297887119-d46091b24bfa?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check flight tickets available for Tet", vi: "kiểm tra vé máy bay còn chỗ dịp Tết" },
          { en: "find peach blossoms available at market", vi: "tìm mua cành đào có sẵn tại chợ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Lunar New Year traditions. Respond naturally to the user.",
    tags: ["celebrations-holidays","daily-life"]
  },
  {
    id: "daily-celeb-03",
    category: 'daily_situations',
    subcategory: 'celebrations_holidays',
    level: "A2",
    titleEn: "Christmas celebrations",
    titleVi: "Lễ kỷ niệm Giáng sinh",
    icon: "🎄",
    situationVi: "Bạn đang trong tình huống: Lễ kỷ niệm Giáng sinh. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for christmas celebrations.", textVi: "Chào, tôi ở đây để lễ kỷ niệm giáng sinh." },
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
          { en: "assist in hanging ornaments on tree", vi: "hỗ trợ treo đồ trang trí lên cây thông" },
          { en: "help wrap secret Santa presents", vi: "giúp gói quà Giáng sinh bí mật" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "attend Christmas Eve church service", vi: "tham dự thánh lễ đêm Giáng sinh" },
          { en: "enjoy holiday restaurant dining service", vi: "thưởng thức dịch vụ ăn uống ngày lễ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1482517967863-00e15c9b44be?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "deal with sold-out holiday gifts", vi: "xử lý tình trạng quà tặng bị cháy hàng" },
          { en: "resolve cold winter weather delays", vi: "giải quyết việc hoãn chuyến do thời tiết lạnh" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1543258103-a62bdc069871?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "bake gingerbread cookies together", vi: "cùng nhau nướng bánh quy gừng" },
          { en: "unwrap Christmas presents on morning", vi: "mở quà Giáng sinh vào buổi sáng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1513297887119-d46091b24bfa?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check available Christmas turkeys", vi: "kiểm tra gà tây Giáng sinh còn hàng" },
          { en: "find available seats for holiday concert", vi: "tìm chỗ ngồi còn trống cho buổi hòa nhạc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Christmas celebrations. Respond naturally to the user.",
    tags: ["celebrations-holidays","daily-life"]
  },
  {
    id: "daily-celeb-04",
    category: 'daily_situations',
    subcategory: 'celebrations_holidays',
    level: "A2",
    titleEn: "Wedding attendance",
    titleVi: "Tham dự tiệc cưới",
    icon: "💍",
    situationVi: "Bạn đang trong tình huống: Tham dự tiệc cưới. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for wedding attendance.", textVi: "Chào, tôi ở đây để tham dự tiệc cưới." },
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
          { en: "assist the groom and bride", vi: "hỗ trợ cô dâu và chú rể" },
          { en: "help guide wedding guests to tables", vi: "giúp hướng dẫn khách vào bàn tiệc cưới" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "evaluate banquet food service", vi: "đánh giá dịch vụ tiệc cưới" },
          { en: "hire professional wedding photo service", vi: "thuê dịch vụ chụp ảnh cưới chuyên nghiệp" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "fix dress code wardrobe issues", vi: "sửa sự cố trang phục dự tiệc cưới" },
          { en: "address table seating arrangements", vi: "sắp xếp lại chỗ ngồi các bàn tiệc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "sign guestbook and give wedding gift", vi: "ký sổ lưu niệm và gửi quà cưới" },
          { en: "toast champagne to the newlyweds", vi: "nâng ly sâm banh chúc phúc đôi tân hôn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "confirm RSVP before deadline", vi: "xác nhận tham dự trước thời hạn chót" },
          { en: "check available hotel rooms for guests", vi: "kiểm tra phòng khách sạn còn trống cho khách" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Wedding attendance. Respond naturally to the user.",
    tags: ["celebrations-holidays","daily-life"]
  },
  {
    id: "daily-celeb-05",
    category: 'daily_situations',
    subcategory: 'celebrations_holidays',
    level: "B1",
    titleEn: "National holiday plans",
    titleVi: "Kế hoạch ngày lễ quốc khánh",
    icon: "🎆",
    situationVi: "Bạn đang trong tình huống: Kế hoạch ngày lễ quốc khánh. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for national holiday plans.", textVi: "Chào, tôi ở đây để kế hoạch ngày lễ quốc khánh." },
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
          { en: "assist in packing camping luggage", vi: "hỗ trợ chuẩn bị đồ đạc đi cắm trại" },
          { en: "help coordinate road trip itinerary", vi: "giúp sắp xếp lịch trình chuyến đi xa" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "book car rental service for holiday", vi: "đặt dịch vụ thuê ô tô cho ngày nghỉ lễ" },
          { en: "contact national park guide service", vi: "liên hệ dịch vụ hướng dẫn viên vườn quốc gia" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "handle holiday hotel overbooking", vi: "xử lý sự cố khách sạn kín phòng ngày lễ" },
          { en: "avoid peak tourist crowds", vi: "tránh đám đông du khách giờ cao điểm" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "plan daily holiday activities", vi: "lên kế hoạch hoạt động mỗi ngày nghỉ lễ" },
          { en: "watch fireworks at city square", vi: "xem pháo hoa ở quảng trường thành phố" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check available resort cottages", vi: "kiểm tra phòng nghỉ dưỡng còn trống" },
          { en: "verify opening hours on bank holiday", vi: "xác nhận giờ mở cửa vào ngày nghỉ lễ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: National holiday plans. Respond naturally to the user.",
    tags: ["celebrations-holidays","daily-life"]
  },
  {
    id: "daily-celeb-06",
    category: 'daily_situations',
    subcategory: 'celebrations_holidays',
    level: "A2",
    titleEn: "Giving gifts and cards",
    titleVi: "Tặng quà và thiệp mừng",
    icon: "🎁",
    situationVi: "Bạn đang trong tình huống: Tặng quà và thiệp mừng. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for giving gifts and cards.", textVi: "Chào, tôi ở đây để tặng quà và thiệp mừng." },
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
          { en: "assist in selecting meaningful gift", vi: "hỗ trợ lựa chọn món quà ý nghĩa" },
          { en: "help write warm holiday greetings", vi: "giúp viết lời chúc mừng ấm áp" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1513297887119-d46091b24bfa?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "use express gift delivery service", vi: "sử dụng dịch vụ chuyển phát quà hỏa tốc" },
          { en: "request in-store gift wrapping service", vi: "yêu cầu dịch vụ gói quà tại cửa hàng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "replace damaged package ribbon", vi: "thay dải ruy băng gói quà bị hỏng" },
          { en: "exchange gift with wrong clothing size", vi: "đổi quà tặng bị nhầm cỡ quần áo" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "attach handwritten note to card", vi: "đính kèm thiệp viết tay vào hộp quà" },
          { en: "present gift box with both hands", vi: "trao hộp quà bằng cả hai tay" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check available greeting card designs", vi: "kiểm tra các mẫu thiệp chúc mừng có sẵn" },
          { en: "find available custom gift baskets", vi: "tìm giỏ quà tùy chỉnh có sẵn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Giving gifts and cards. Respond naturally to the user.",
    tags: ["celebrations-holidays","daily-life"]
  }
];
