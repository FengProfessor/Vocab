/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: lost_items_problems
 * File: src/data/speaking/topic-library/daily-situations/lost-items-problems.ts
 *
 * 5 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const LOST_ITEMS_PROBLEMS_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-lost-01",
    category: 'daily_situations',
    subcategory: 'lost_items_problems',
    level: "A2",
    titleEn: "Lost wallet/phone",
    titleVi: "Mất ví hoặc điện thoại",
    icon: "👛",
    situationVi: "Bạn đang trong tình huống: Mất ví hoặc điện thoại. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for lost wallet/phone.", textVi: "Chào, tôi ở đây để mất ví hoặc điện thoại." },
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
          { en: "assist in retracing previous steps", vi: "giúp đi ngược lại tuyến đường vừa đi" },
          { en: "call lost phone from another mobile", vi: "gọi vào điện thoại bị mất từ máy khác" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "contact bank card blocking service", vi: "gọi dịch vụ khóa thẻ ngân hàng khẩn cấp" },
          { en: "use remote phone tracking service", vi: "dùng dịch vụ định vị điện thoại từ xa" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "report stolen purse to local police", vi: "trình báo công an địa phương bị mất ví" },
          { en: "cancel compromised debit cards", vi: "hủy các thẻ ghi nợ có nguy cơ bị lộ" }
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
          { en: "lock smartphone screen remotely", vi: "khóa màn hình điện thoại từ xa" },
          { en: "file an official police loss report", vi: "lập biên bản báo mất đồ chính thức" }
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
          { en: "ask if lost items are turned in", vi: "hỏi xem có ai nhặt được nộp lại không" },
          { en: "check available backup phone", vi: "kiểm tra điện thoại dự phòng có sẵn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Lost wallet/phone. Respond naturally to the user.",
    tags: ["lost-items-problems","daily-life"]
  },
  {
    id: "daily-lost-02",
    category: 'daily_situations',
    subcategory: 'lost_items_problems',
    level: "A2",
    titleEn: "Contacting lost and found",
    titleVi: "Liên hệ bộ phận tìm đồ thất lạc",
    icon: "🔍",
    situationVi: "Bạn đang trong tình huống: Liên hệ bộ phận tìm đồ thất lạc. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for contacting lost and found.", textVi: "Chào, tôi ở đây để liên hệ bộ phận tìm đồ thất lạc." },
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
          { en: "assist clerk by describing item features", vi: "hỗ trợ nhân viên bằng cách miêu tả đặc điểm đồ vật" },
          { en: "show photo proof of lost possession", vi: "cho xem ảnh chứng minh quyền sở hữu đồ bị mất" }
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
          { en: "inquire at mall lost and found service", vi: "hỏi tại quầy dịch vụ tìm đồ thất lạc trung tâm thương mại" },
          { en: "leave contact details with info service", vi: "để lại thông tin liên lạc tại quầy thông tin" }
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
          { en: "verify ownership of matched item", vi: "xác minh quyền sở hữu đồ vật trùng khớp" },
          { en: "clarify mislabeled luggage tag", vi: "làm rõ nhãn hành lý bị dán nhầm" }
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
          { en: "fill in property reclamation form", vi: "điền vào mẫu đơn xin nhận lại tài sản" },
          { en: "present photo ID to claim item", vi: "xuất trình căn cước công dân để nhận lại đồ" }
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
          { en: "ask when officer is available to inspect", vi: "hỏi khi nào cán bộ có mặt để kiểm tra" },
          { en: "check if umbrella is available in storage", vi: "kiểm tra chiếc ô có trong kho lưu trữ không" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Contacting lost and found. Respond naturally to the user.",
    tags: ["lost-items-problems","daily-life"]
  },
  {
    id: "daily-lost-03",
    category: 'daily_situations',
    subcategory: 'lost_items_problems',
    level: "B1",
    titleEn: "Locked out of the house",
    titleVi: "Bị khóa bên ngoài nhà",
    icon: "🔑",
    situationVi: "Bạn đang trong tình huống: Bị khóa bên ngoài nhà. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for locked out of the house.", textVi: "Chào, tôi ở đây để bị khóa bên ngoài nhà." },
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
          { en: "assist roommate in borrowing spare key", vi: "giúp bạn cùng phòng mượn chìa khóa sơ cua" },
          { en: "help inspect unlocked window options", vi: "giúp kiểm tra xem có cửa sổ nào chưa khóa" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "call 24-7 emergency locksmith service", vi: "gọi dịch vụ thợ mở khóa khẩn cấp 24/7" },
          { en: "request apartment security door service", vi: "nhờ bảo vệ tòa nhà hỗ trợ mở cửa" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "handle broken key stuck in lock cylinder", vi: "xử lý chìa khóa bị gãy kẹt trong ổ" },
          { en: "address dead battery on smart lock", vi: "xử lý khóa điện tử thông minh bị hết pin" }
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
          { en: "pick open lock without damage", vi: "mở khóa khéo léo không làm hỏng cửa" },
          { en: "cut replacement key duplicate", vi: "cắt thêm chìa khóa sao chép dự phòng" }
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
          { en: "check if on-call locksmith is available", vi: "kiểm tra thợ khóa trực ban có sẵn sàng không" },
          { en: "ask if landlord spare key is available", vi: "hỏi chìa khóa dự phòng của chủ nhà có sẵn không" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Locked out of the house. Respond naturally to the user.",
    tags: ["lost-items-problems","daily-life"]
  },
  {
    id: "daily-lost-04",
    category: 'daily_situations',
    subcategory: 'lost_items_problems',
    level: "B1",
    titleEn: "Luggage delayed at airport",
    titleVi: "Hành lý bị chậm tại sân bay",
    icon: "🧳",
    situationVi: "Bạn đang trong tình huống: Hành lý bị chậm tại sân bay. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for luggage delayed at airport.", textVi: "Chào, tôi ở đây để hành lý bị chậm tại sân bay." },
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
          { en: "assist airline agent with bag description", vi: "hỗ trợ nhân viên hãng bay miêu tả vali" },
          { en: "help verify baggage carousel number", vi: "giúp kiểm tra lại số băng chuyền hành lý" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "file delayed baggage claim at airline service", vi: "kê khai hành lý thất lạc tại quầy dịch vụ bay" },
          { en: "request hotel delivery service for luggage", vi: "yêu cầu dịch vụ chuyển vali về khách sạn khi tìm thấy" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "report missing checked suitcase", vi: "báo mất vali hành lý ký gửi" },
          { en: "claim emergency toiletries allowance", vi: "xin phụ cấp mua đồ dùng vệ sinh khẩn cấp" }
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
          { en: "obtain Property Irregularity Report code", vi: "lấy mã biên bản bất thường về hành lý" },
          { en: "track baggage status via global online tool", vi: "tra cứu hành lý qua hệ thống trực tuyến toàn cầu" }
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
          { en: "check if bag is available on next flight", vi: "kiểm tra hành lý có trên chuyến bay kế tiếp không" },
          { en: "verify available compensation vouchers", vi: "xác nhận các phiếu bồi thường hỗ trợ sẵn có" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Luggage delayed at airport. Respond naturally to the user.",
    tags: ["lost-items-problems","daily-life"]
  },
  {
    id: "daily-lost-05",
    category: 'daily_situations',
    subcategory: 'lost_items_problems',
    level: "A2",
    titleEn: "Reporting a missing pet",
    titleVi: "Báo cáo thú cưng thất lạc",
    icon: "🐕",
    situationVi: "Bạn đang trong tình huống: Báo cáo thú cưng thất lạc. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for reporting a missing pet.", textVi: "Chào, tôi ở đây để báo cáo thú cưng thất lạc." },
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
          { en: "assist neighbors in searching local parks", vi: "giúp hàng xóm tìm kiếm tại các công viên lân cận" },
          { en: "help distribute lost pet flyers", vi: "giúp phát tờ rơi tìm thú cưng thất lạc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "notify local animal rescue service", vi: "thông báo cho trạm cứu hộ động vật địa phương" },
          { en: "check veterinary chip registration service", vi: "kiểm tra dịch vụ tra cứu vi chip thú y" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "report escaped frightened puppy", vi: "trình báo cún con bị hoảng sợ chạy thoát" },
          { en: "check open backyard gates", vi: "kiểm tra các cổng sau sân vườn bị mở quên" }
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
          { en: "post photo and contact on social groups", vi: "đăng ảnh và số liên hệ lên các hội nhóm mạng xã hội" },
          { en: "scan microchip database for matches", vi: "quét cơ sở dữ liệu vi chip để tìm kiếm" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "ask if found pets are available at shelter", vi: "hỏi xem thú cưng tìm thấy có ở trại cứu hộ không" },
          { en: "check available community search volunteers", vi: "kiểm tra tình nguyện viên cộng đồng sẵn sàng hỗ trợ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Reporting a missing pet. Respond naturally to the user.",
    tags: ["lost-items-problems","daily-life"]
  }
];
