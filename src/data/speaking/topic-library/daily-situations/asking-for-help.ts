/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: asking_for_help
 * File: src/data/speaking/topic-library/daily-situations/asking-for-help.ts
 *
 * 5 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const ASKING_FOR_HELP_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-help-01",
    category: 'daily_situations',
    subcategory: 'asking_for_help',
    level: "A1",
    titleEn: "Asking a stranger for directions",
    titleVi: "Hỏi đường một người lạ",
    icon: "🗺️",
    situationVi: "Bạn đang trong tình huống: Hỏi đường một người lạ. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for asking a stranger for directions.", textVi: "Chào, tôi ở đây để hỏi đường một người lạ." },
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
          { en: "ask for directions politely", vi: "lịch sự hỏi đường người khác" },
          { en: "assist a lost tourist", vi: "hỗ trợ du khách bị lạc đường" },
          { en: "offer navigation assistance", vi: "đưa ra sự trợ giúp tìm đường" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "ask about local transit service", vi: "hỏi về dịch vụ trung chuyển địa phương" },
          { en: "find an information service desk", vi: "tìm quầy dịch vụ thông tin" },
          { en: "inquire about shuttle service", vi: "hỏi về dịch vụ xe đưa đón" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "explain your navigation issue", vi: "giải thích vấn đề lạc đường của bạn" },
          { en: "encounter a detour issue", vi: "gặp phải sự cố đường vòng" },
          { en: "solve the direction issue", vi: "giải quyết vấn đề định hướng" }
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
          { en: "follow turn-by-turn process", vi: "làm theo quy trình chỉ đường từng bước" },
          { en: "navigate the transit process", vi: "nắm bắt quy trình chuyển tuyến" },
          { en: "simplify the walking process", vi: "đơn giản hóa lộ trình đi bộ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check if a bus is available", vi: "kiểm tra xem có xe buýt sẵn sàng không" },
          { en: "find available walking routes", vi: "tìm các tuyến đường đi bộ sẵn có" },
          { en: "verify guide availability", vi: "kiểm tra hướng dẫn viên có rảnh không" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Asking a stranger for directions. Respond naturally to the user.",
    tags: ["asking-for_help","daily-life"]
  },
  {
    id: "daily-help-02",
    category: 'daily_situations',
    subcategory: 'asking_for_help',
    level: "A1",
    titleEn: "Asking someone to take a photo",
    titleVi: "Nhờ ai đó chụp ảnh",
    icon: "📷",
    situationVi: "Bạn đang trong tình huống: Nhờ ai đó chụp ảnh. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for asking someone to take a photo.", textVi: "Chào, tôi ở đây để nhờ ai đó chụp ảnh." },
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
          { en: "ask someone to take a picture", vi: "nhờ ai đó chụp một bức ảnh" },
          { en: "assist with framing the shot", vi: "hỗ trợ căn chỉnh góc chụp ảnh" },
          { en: "hold still for the photo", vi: "đứng yên tạo dáng chụp hình" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "thank someone for kind assistance", vi: "cảm ơn vì đã nhiệt tình chụp giúp" },
          { en: "use photo booth services", vi: "sử dụng dịch vụ buồng chụp ảnh" },
          { en: "appreciate the photo service", vi: "ghi nhận sự giúp đỡ chụp ảnh" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1520333789090-1afc82db536a?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "fix blurry camera issue", vi: "sửa lỗi mờ ống kính máy ảnh" },
          { en: "deal with poor lighting issues", vi: "xử lý vấn đề ánh sáng quá tối" },
          { en: "avoid finger on lens issues", vi: "tránh để ngón tay che ống kính" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "tap the shutter button", vi: "chạm vào nút chụp ảnh" },
          { en: "review the captured photo", vi: "xem lại bức ảnh vừa chụp" },
          { en: "switch to landscape process", vi: "chuyển sang góc chụp ngang" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check available phone storage", vi: "kiểm tra dung lượng bộ nhớ còn trống" },
          { en: "find available angles for photo", vi: "tìm các góc chụp sẵn có đẹp nhất" },
          { en: "ensure camera is ready", vi: "đảm bảo máy ảnh đã sẵn sàng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Asking someone to take a photo. Respond naturally to the user.",
    tags: ["asking-for_help","daily-life"]
  },
  {
    id: "daily-help-03",
    category: 'daily_situations',
    subcategory: 'asking_for_help',
    level: "A1",
    titleEn: "Asking for help carrying bags",
    titleVi: "Nhờ xách hộ túi",
    icon: "🛍️",
    situationVi: "Bạn đang trong tình huống: Nhờ xách hộ túi. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for asking for help carrying bags.", textVi: "Chào, tôi ở đây để nhờ xách hộ túi." },
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
          { en: "help carry heavy grocery bags", vi: "giúp xách những túi đồ tạp hóa nặng" },
          { en: "assist someone down the stairs", vi: "hỗ trợ ai đó đi xuống cầu thang" },
          { en: "relieve hand fatigue with help", vi: "đỡ mỏi tay nhờ có người xách hộ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "request store porter service", vi: "yêu cầu nhân viên phụ xách đồ" },
          { en: "offer voluntary helping service", vi: "tự nguyện giúp đỡ người khác" },
          { en: "utilize supermarket cart service", vi: "sử dụng dịch vụ xe đẩy siêu thị" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "handle heavy luggage issues", vi: "xử lý sự cố hành lý quá nặng" },
          { en: "prevent ripped bag issues", vi: "tránh nguy cơ rách túi xách" },
          { en: "overcome balance issues", vi: "khắc phục vấn đề mất thăng bằng" }
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
          { en: "load bags into car trunk", vi: "chất các túi đồ vào cốp xe" },
          { en: "pack bags evenly by weight", vi: "chia đều trọng lượng các túi" },
          { en: "lift bags with proper form", vi: "nhấc túi lên đúng tư thế" }
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
          { en: "find available shopping carts", vi: "tìm xe đẩy mua hàng còn trống" },
          { en: "look for available helping hands", vi: "tìm kiếm sự trợ giúp quanh đó" },
          { en: "check elevator availability", vi: "kiểm tra thang máy có hoạt động không" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Asking for help carrying bags. Respond naturally to the user.",
    tags: ["asking-for_help","daily-life"]
  },
  {
    id: "daily-help-04",
    category: 'daily_situations',
    subcategory: 'asking_for_help',
    level: "A2",
    titleEn: "Asking a store clerk for assistance",
    titleVi: "Nhờ nhân viên cửa hàng giúp đỡ",
    icon: "🙋",
    situationVi: "Bạn đang trong tình huống: Nhờ nhân viên cửa hàng giúp đỡ. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for asking a store clerk for assistance.", textVi: "Chào, tôi ở đây để nhờ nhân viên cửa hàng giúp đỡ." },
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
          { en: "ask store clerk for assistance", vi: "nhờ nhân viên cửa hàng hỗ trợ" },
          { en: "assist with locating items", vi: "hỗ trợ tìm kiếm vị trí món đồ" },
          { en: "request help reaching top shelf", vi: "nhờ lấy đồ trên giá cao" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "approach customer service desk", vi: "đến quầy dịch vụ khách hàng" },
          { en: "receive polite store service", vi: "nhận được dịch vụ bán hàng lịch sự" },
          { en: "ask about warranty service", vi: "hỏi về dịch vụ bảo hành" }
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
          { en: "report missing price tag issue", vi: "báo vấn đề thiếu bảng giá" },
          { en: "resolve checkout scanner issue", vi: "xử lý lỗi máy quét mã vạch" },
          { en: "point out damaged item issue", vi: "chỉ ra lỗi món hàng bị hỏng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "scan item barcode at register", vi: "quét mã vạch sản phẩm tại quầy" },
          { en: "complete return policy process", vi: "hoàn tất quy trình đổi trả hàng" },
          { en: "process store payment receipt", vi: "xử lý hóa đơn thanh toán" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check product stock availability", vi: "kiểm tra tình trạng còn hàng trong kho" },
          { en: "inquire about available sizes", vi: "hỏi về các kích cỡ còn sẵn" },
          { en: "find available clerk on duty", vi: "tìm nhân viên trực ca đang rảnh" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Asking a store clerk for assistance. Respond naturally to the user.",
    tags: ["asking-for_help","daily-life"]
  },
  {
    id: "daily-help-05",
    category: 'daily_situations',
    subcategory: 'asking_for_help',
    level: "A2",
    titleEn: "Asking a neighbor for a favor",
    titleVi: "Nhờ hàng xóm giúp đỡ",
    icon: "🤝",
    situationVi: "Bạn đang trong tình huống: Nhờ hàng xóm giúp đỡ. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for asking a neighbor for a favor.", textVi: "Chào, tôi ở đây để nhờ hàng xóm giúp đỡ." },
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
          { en: "ask neighbor for small favor", vi: "nhờ hàng xóm một việc nhỏ" },
          { en: "assist with watering garden plants", vi: "giúp tưới cây trong vườn" },
          { en: "lend a helping hand next door", vi: "giúp đỡ nhà hàng xóm bên cạnh" }
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
          { en: "offer mutual neighborly service", vi: "giúp đỡ lẫn nhau tình làng nghĩa xóm" },
          { en: "exchange pet sitting favors", vi: "nhờ trông thú cưng qua lại" },
          { en: "return a borrowed tool kindly", vi: "trả lại dụng cụ mượn một cách chu đáo" }
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
          { en: "discuss noise disturbance issue", vi: "trao đổi về vấn đề tiếng ồn" },
          { en: "solve fence repair issues", vi: "giải quyết vấn đề sửa hàng rào" },
          { en: "handle locked-out key issue", vi: "xử lý sự cố bị khóa ngoài cửa" }
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
          { en: "exchange house spare keys", vi: "trao chìa khóa nhà dự phòng" },
          { en: "follow trash collection rules", vi: "tuân thủ quy định bỏ rác" },
          { en: "coordinate parcel holding", vi: "nhờ nhận hộ gói bưu phẩm" }
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
          { en: "check if neighbor is home", vi: "kiểm tra xem hàng xóm có nhà không" },
          { en: "offer available gardening tools", vi: "cho mượn dụng cụ làm vườn có sẵn" },
          { en: "stay available for emergencies", vi: "sẵn sàng hỗ trợ khi khẩn cấp" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Asking a neighbor for a favor. Respond naturally to the user.",
    tags: ["asking-for_help","daily-life"]
  }
];
