/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: neighbors_community
 * File: src/data/speaking/topic-library/daily-situations/neighbors-community.ts
 *
 * 5 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const NEIGHBORS_COMMUNITY_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-neigh-01",
    category: 'daily_situations',
    subcategory: 'neighbors_community',
    level: "A1",
    titleEn: "Introducing yourself to a new neighbor",
    titleVi: "Tự giới thiệu với hàng xóm mới",
    icon: "👋",
    situationVi: "Bạn đang trong tình huống: Tự giới thiệu với hàng xóm mới. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for introducing yourself to a new neighbor.", textVi: "Chào, tôi ở đây để tự giới thiệu với hàng xóm mới." },
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
          { en: "offer a warm greeting", vi: "gửi lời chào nồng nhiệt" },
          { en: "help carry heavy boxes", vi: "giúp khuân vác các thùng nặng" },
          { en: "assist with local directions", vi: "chỉ đường xá xung quanh khu phố" }
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
          { en: "recommend local cleaning services", vi: "giới thiệu dịch vụ dọn dẹp địa phương" },
          { en: "call building maintenance service", vi: "gọi dịch vụ bảo trì tòa nhà" },
          { en: "use waste disposal services", vi: "sử dụng dịch vụ thu gom rác" }
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
          { en: "report a plumbing issue", vi: "báo cáo sự cố đường ống nước" },
          { en: "discuss building security issues", vi: "thảo luận vấn đề an ninh tòa nhà" },
          { en: "resolve a minor issue peacefully", vi: "giải quyết sự cố nhỏ trong hòa bình" }
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
          { en: "follow the move-in process", vi: "tuân theo quy trình chuyển vào" },
          { en: "complete resident registration", vi: "hoàn tất đăng ký cư dân" },
          { en: "explain the recycling process", vi: "giải thích quy trình phân loại rác" }
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
          { en: "check if the neighbor is available", vi: "hỏi xem hàng xóm có rảnh không" },
          { en: "remain available for community help", vi: "sẵn sàng hỗ trợ cộng đồng" },
          { en: "keep spare keys available", vi: "chuẩn bị sẵn chìa khóa dự phòng" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Introducing yourself to a new neighbor. Respond naturally to the user.",
    tags: ["neighbors-community","daily-life"]
  },
  {
    id: "daily-neigh-02",
    category: 'daily_situations',
    subcategory: 'neighbors_community',
    level: "A2",
    titleEn: "Asking to borrow something",
    titleVi: "Hỏi mượn thứ gì đó",
    icon: "🤝",
    situationVi: "Bạn đang trong tình huống: Hỏi mượn thứ gì đó. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for asking to borrow something.", textVi: "Chào, tôi ở đây để hỏi mượn thứ gì đó." },
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
          { en: "ask for neighborly assistance", vi: "xin sự giúp đỡ của hàng xóm" },
          { en: "lend a useful household tool", vi: "cho mượn dụng cụ gia đình hữu ích" },
          { en: "return the borrowed item promptly", vi: "trả lại đồ đã mượn nhanh chóng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "return a kind favor", vi: "đáp lại một ân huệ tốt đẹp" },
          { en: "request home repair service", vi: "yêu cầu dịch vụ sửa chữa nhà" },
          { en: "share community resources", vi: "chia sẻ nguồn lực trong cộng đồng" }
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
          { en: "explain an urgent repair issue", vi: "giải thích sự cố sửa chữa khẩn cấp" },
          { en: "fix an unexpected household issue", vi: "khắc phục sự cố bất ngờ trong nhà" },
          { en: "avoid creating noise issues", vi: "tránh gây ra các vấn đề về tiếng ồn" }
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
          { en: "follow borrowing etiquette", vi: "tuân thủ phép lịch sự khi mượn đồ" },
          { en: "inspect tools before using", vi: "kiểm tra dụng cụ trước khi dùng" },
          { en: "agree on return time", vi: "thống nhất thời gian hoàn trả" }
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
          { en: "check if ladder is available", vi: "kiểm tra xem chiếc thang có sẵn không" },
          { en: "borrow available cooking ingredients", vi: "mượn nguyên liệu nấu ăn sẵn có" },
          { en: "return items when owner is available", vi: "trả lại đồ khi chủ nhà có mặt" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Asking to borrow something. Respond naturally to the user.",
    tags: ["neighbors-community","daily-life"]
  },
  {
    id: "daily-neigh-03",
    category: 'daily_situations',
    subcategory: 'neighbors_community',
    level: "B1",
    titleEn: "Discussing shared space rules",
    titleVi: "Thảo luận quy tắc không gian chung",
    icon: "📜",
    situationVi: "Bạn đang trong tình huống: Thảo luận quy tắc không gian chung. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for discussing shared space rules.", textVi: "Chào, tôi ở đây để thảo luận quy tắc không gian chung." },
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
          { en: "help keep corridors clean", vi: "giúp giữ gìn hành lang sạch sẽ" },
          { en: "assist with elevator maintenance", vi: "hỗ trợ bảo trì thang máy" },
          { en: "remind residents of hallway rules", vi: "nhắc nhở cư dân quy tắc hành lang" }
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
          { en: "schedule hallway cleaning service", vi: "lên lịch dịch vụ dọn vệ sinh hành lang" },
          { en: "evaluate security guard service", vi: "đánh giá dịch vụ của bảo vệ" },
          { en: "pay building management fees", vi: "đóng phí dịch vụ ban quản lý" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "raise a shared facility issue", vi: "nêu ra vấn đề về tiện ích chung" },
          { en: "prevent hallway blockage issues", vi: "ngăn chặn tình trạng cản trở lối đi" },
          { en: "discuss parking space issues", vi: "thảo luận vấn đề chỗ đậu xe" }
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
          { en: "vote on apartment regulations", vi: "bỏ phiếu thông qua nội quy chung cư" },
          { en: "post guidelines on notice board", vi: "dán thông báo quy định lên bảng tin" },
          { en: "follow complaint escalation process", vi: "tuân theo quy trình gửi khiếu nại" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check shared lounge availability", vi: "kiểm tra phòng sinh hoạt chung có trống không" },
          { en: "make rulebooks freely available", vi: "cung cấp sẵn sổ tay nội quy" },
          { en: "reserve available barbecue area", vi: "đặt trước khu vực nướng BBQ còn trống" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Discussing shared space rules. Respond naturally to the user.",
    tags: ["neighbors-community","daily-life"]
  },
  {
    id: "daily-neigh-04",
    category: 'daily_situations',
    subcategory: 'neighbors_community',
    level: "A2",
    titleEn: "Inviting neighbors for a gathering",
    titleVi: "Mời hàng xóm đến một buổi tụ tập",
    icon: "🎉",
    situationVi: "Bạn đang trong tình huống: Mời hàng xóm đến một buổi tụ tập. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for inviting neighbors for a gathering.", textVi: "Chào, tôi ở đây để mời hàng xóm đến một buổi tụ tập." },
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
          { en: "help organize neighborhood dinner", vi: "giúp tổ chức tiệc tối khu phố" },
          { en: "assist with outdoor seating setup", vi: "hỗ trợ sắp xếp chỗ ngồi ngoài trời" },
          { en: "bring homemade dessert to share", vi: "mang món tráng miệng nhà làm đến chia sẻ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "order local catering service", vi: "đặt dịch vụ nấu cỗ tiệc địa phương" },
          { en: "set up self-service buffet", vi: "bày trí quầy đồ ăn tự phục vụ" },
          { en: "clean up after the party", vi: "dọn dẹp sạch sẽ sau bữa tiệc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "address parking overflow issues", vi: "xử lý vấn đề xe đậu quá tải" },
          { en: "avoid noise issues late at night", vi: "tránh gây ồn ào vào đêm muộn" },
          { en: "handle food allergy concerns", vi: "chú ý đến vấn đề dị ứng thức ăn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "send invitation cards in advance", vi: "gửi thiệp mời trước vài ngày" },
          { en: "collect RSVPs from neighbors", vi: "tập hợp phản hồi xác nhận tham gia" },
          { en: "plan party entertainment schedule", vi: "lên kế hoạch chương trình giao lưu" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "pick a date everyone is available", vi: "chọn ngày mà mọi người đều rảnh" },
          { en: "make refreshing drinks available", vi: "chuẩn bị sẵn nước giải khát" },
          { en: "welcome all available attendees", vi: "chào đón mọi người có thể tham gia" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Inviting neighbors for a gathering. Respond naturally to the user.",
    tags: ["neighbors-community","daily-life"]
  },
  {
    id: "daily-neigh-05",
    category: 'daily_situations',
    subcategory: 'neighbors_community',
    level: "B1",
    titleEn: "Resolving a noise complaint",
    titleVi: "Giải quyết phàn nàn về tiếng ồn",
    icon: "🔇",
    situationVi: "Bạn đang trong tình huống: Giải quyết phàn nàn về tiếng ồn. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for resolving a noise complaint.", textVi: "Chào, tôi ở đây để giải quyết phàn nàn về tiếng ồn." },
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
          { en: "seek landlord assistance", vi: "nhờ chủ nhà can thiệp hỗ trợ" },
          { en: "listen to neighbor concerns politely", vi: "lịch sự lắng nghe lo ngại của hàng xóm" },
          { en: "help find a quiet compromise", vi: "giúp tìm kiếm giải pháp thỏa hiệp yên tĩnh" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "contact building security service", vi: "liên hệ dịch vụ bảo vệ tòa nhà" },
          { en: "hire acoustic soundproofing service", vi: "thuê dịch vụ làm cách âm" },
          { en: "request community mediation", vi: "yêu cầu hòa giải cộng đồng" }
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
          { en: "discuss late-night music issues", vi: "thảo luận vấn đề mở nhạc đêm khuya" },
          { en: "resolve chronic noise issues", vi: "giải quyết dứt điểm sự cố tiếng ồn kéo dài" },
          { en: "apologize for the disturbance", vi: "xin lỗi vì đã làm phiền" }
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
          { en: "have a friendly face-to-face chat", vi: "trực tiếp trao đổi thân thiện" },
          { en: "set agreed quiet hours", vi: "thống nhất khung giờ giữ yên lặng" },
          { en: "file a formal notice if needed", vi: "gửi thông báo chính thức nếu cần thiết" }
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
          { en: "talk when both parties are available", vi: "trò chuyện khi cả hai bên đều rảnh" },
          { en: "provide contact number for emergencies", vi: "để lại số liên lạc khi cần thiết" },
          { en: "check if quiet study space is available", vi: "kiểm tra xem có không gian học yên tĩnh không" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Resolving a noise complaint. Respond naturally to the user.",
    tags: ["neighbors-community","daily-life"]
  }
];
