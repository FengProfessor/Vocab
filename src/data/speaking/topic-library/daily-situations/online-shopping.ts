/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: online_shopping
 * File: src/data/speaking/topic-library/daily-situations/online-shopping.ts
 *
 * 5 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const ONLINE_SHOPPING_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-eshop-01",
    category: 'daily_situations',
    subcategory: 'online_shopping',
    level: "A2",
    titleEn: "Describing what you want to buy",
    titleVi: "Mô tả những gì bạn muốn mua",
    icon: "🛒",
    situationVi: "Bạn đang trong tình huống: Mô tả những gì bạn muốn mua. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for describing what you want to buy.", textVi: "Chào, tôi ở đây để mô tả những gì bạn muốn mua." },
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
          { en: "ask customer support to assist", vi: "nhờ nhân viên hỗ trợ tư vấn" },
          { en: "help choose the right size", vi: "giúp lựa chọn kích cỡ phù hợp" },
          { en: "assist with color selection", vi: "hỗ trợ chọn màu sắc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "use live chat service", vi: "dùng dịch vụ trò chuyện trực tuyến" },
          { en: "rate shopping assistance service", vi: "đánh giá dịch vụ hỗ trợ mua sắm" },
          { en: "experience personalized customer service", vi: "trải nghiệm dịch vụ khách hàng cá nhân hóa" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "mention a sizing issue", vi: "đề cập đến vấn đề sai kích cỡ" },
          { en: "report a broken product link", vi: "báo cáo liên kết sản phẩm bị lỗi" },
          { en: "clarify stock availability issue", vi: "làm rõ vấn đề còn hàng hay hết hàng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "filter items by category", vi: "lọc mặt hàng theo danh mục" },
          { en: "add desired item to cart", vi: "thêm sản phẩm mong muốn vào giỏ hàng" },
          { en: "proceed to checkout process", vi: "chuyển sang quy trình thanh toán" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check if size M is available", vi: "kiểm tra xem size M còn hàng không" },
          { en: "view all available color options", vi: "xem tất cả các tùy chọn màu có sẵn" },
          { en: "request alert when back in stock", vi: "đặt thông báo khi có hàng trở lại" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Describing what you want to buy. Respond naturally to the user.",
    tags: ["online-shopping","daily-life"]
  },
  {
    id: "daily-eshop-02",
    category: 'daily_situations',
    subcategory: 'online_shopping',
    level: "A2",
    titleEn: "Asking about shipping and returns",
    titleVi: "Hỏi về vận chuyển và trả hàng",
    icon: "📦",
    situationVi: "Bạn đang trong tình huống: Hỏi về vận chuyển và trả hàng. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for asking about shipping and returns.", textVi: "Chào, tôi ở đây để hỏi về vận chuyển và trả hàng." },
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
          { en: "assist with parcel tracking", vi: "hỗ trợ tra cứu mã vận đơn" },
          { en: "help generate return label", vi: "giúp tạo nhãn đổi trả hàng" },
          { en: "request agent help for refund", vi: "nhờ nhân viên trợ giúp hoàn tiền" }
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
          { en: "choose express courier service", vi: "chọn dịch vụ chuyển phát nhanh" },
          { en: "evaluate postal delivery service", vi: "đánh giá dịch vụ giao hàng bưu điện" },
          { en: "opt for door-to-door return service", vi: "chọn dịch vụ thu hồi hàng tận nhà" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "report a delayed delivery issue", vi: "báo cáo sự cố giao hàng chậm trễ" },
          { en: "complain about package damage", vi: "khiếu nại về kiện hàng bị hư hại" },
          { en: "resolve lost shipment issues", vi: "giải quyết sự cố thất lạc đơn hàng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "follow the 30-day return policy", vi: "tuân theo chính sách đổi trả trong 30 ngày" },
          { en: "repack the item in original box", vi: "đóng gói lại sản phẩm vào hộp gốc" },
          { en: "track refund processing status", vi: "theo dõi tiến trình xử lý hoàn tiền" }
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
          { en: "check available shipping methods", vi: "kiểm tra các phương thức vận chuyển có sẵn" },
          { en: "confirm courier availability on weekends", vi: "xác nhận shipper có giao hàng cuối tuần không" },
          { en: "utilize available free return options", vi: "tận dụng các phương thức trả hàng miễn phí sẵn có" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Asking about shipping and returns. Respond naturally to the user.",
    tags: ["online-shopping","daily-life"]
  },
  {
    id: "daily-eshop-03",
    category: 'daily_situations',
    subcategory: 'online_shopping',
    level: "B1",
    titleEn: "Writing a product review",
    titleVi: "Viết đánh giá sản phẩm",
    icon: "⭐",
    situationVi: "Bạn đang trong tình huống: Viết đánh giá sản phẩm. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for writing a product review.", textVi: "Chào, tôi ở đây để viết đánh giá sản phẩm." },
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
          { en: "assist other buyers with honest feedback", vi: "hỗ trợ người mua khác bằng đánh giá chân thực" },
          { en: "help shoppers determine true fit", vi: "giúp người mua xác định đúng độ vừa vặn" },
          { en: "provide helpful usage tips", vi: "cung cấp các mẹo sử dụng hữu ích" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "praise prompt after-sales service", vi: "khen ngợi dịch vụ hậu mãi nhanh chóng" },
          { en: "mention packaging and courier service", vi: "nhắc đến khâu đóng gói và dịch vụ vận chuyển" },
          { en: "rate merchant customer service five stars", vi: "chấm 5 sao cho dịch vụ chăm sóc khách hàng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "highlight build quality issues", vi: "chỉ ra các điểm yếu về chất lượng gia công" },
          { en: "point out minor software glitches", vi: "chỉ ra lỗi phần mềm nhỏ" },
          { en: "note that the seller resolved all issues", vi: "ghi nhận người bán đã khắc phục mọi vấn đề" }
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
          { en: "write detailed review text", vi: "viết nội dung đánh giá chi tiết" },
          { en: "upload unboxing photos and videos", vi: "tải lên hình ảnh và video đập hộp" },
          { en: "submit verified purchaser feedback", vi: "gửi đánh giá của người mua hàng đã xác thực" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "make review visible to public", vi: "công khai đánh giá cho mọi người xem" },
          { en: "check if updated models are available", vi: "xem mẫu sản phẩm nâng cấp đã có hàng chưa" },
          { en: "keep review drafts available to edit", vi: "giữ bản nháp đánh giá để chỉnh sửa thêm" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Writing a product review. Respond naturally to the user.",
    tags: ["online-shopping","daily-life"]
  },
  {
    id: "daily-eshop-04",
    category: 'daily_situations',
    subcategory: 'online_shopping',
    level: "B1",
    titleEn: "Contacting seller about an issue",
    titleVi: "Liên hệ với người bán về một vấn đề",
    icon: "💬",
    situationVi: "Bạn đang trong tình huống: Liên hệ với người bán về một vấn đề. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for contacting seller about an issue.", textVi: "Chào, tôi ở đây để liên hệ với người bán về một vấn đề." },
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
          { en: "request merchant assistance with order", vi: "yêu cầu chủ shop hỗ trợ đơn hàng" },
          { en: "ask seller to assist with replacement", vi: "nhờ người bán hỗ trợ đổi hàng mới" },
          { en: "cooperate to verify serial number", vi: "phối hợp xác minh số sê-ri sản phẩm" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "contact online shop warranty service", vi: "liên hệ dịch vụ bảo hành của cửa hàng trực tuyến" },
          { en: "test customer support response speed", vi: "kiểm tra tốc độ phản hồi của bộ phận hỗ trợ" },
          { en: "utilize buyer protection service", vi: "sử dụng dịch vụ bảo vệ người mua" }
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
          { en: "report received incorrect item color", vi: "báo cáo nhận sai màu sản phẩm" },
          { en: "describe hardware malfunction issue", vi: "mô tả sự cố trục trặc phần cứng" },
          { en: "request immediate fix for billing issue", vi: "yêu cầu khắc phục ngay sự cố trừ tiền sai" }
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
          { en: "open a dispute ticket", vi: "mở yêu cầu khiếu nại tranh chấp" },
          { en: "attach proof photos of defect", vi: "đính kèm ảnh chụp bằng chứng lỗi" },
          { en: "wait for official seller resolution", vi: "chờ phương án giải quyết chính thức từ người bán" }
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
          { en: "chat when support agent is available", vi: "nhắn tin khi tư vấn viên đang trực tuyến" },
          { en: "check if replacement unit is available", vi: "kiểm tra xem có sẵn sản phẩm đổi thay thế không" },
          { en: "review available refund options", vi: "xem lại các phương án hoàn tiền sẵn có" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Contacting seller about an issue. Respond naturally to the user.",
    tags: ["online-shopping","daily-life"]
  },
  {
    id: "daily-eshop-05",
    category: 'daily_situations',
    subcategory: 'online_shopping',
    level: "B1",
    titleEn: "Comparing prices/features online",
    titleVi: "So sánh giá cả/tính năng trực tuyến",
    icon: "⚖️",
    situationVi: "Bạn đang trong tình huống: So sánh giá cả/tính năng trực tuyến. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for comparing prices/features online.", textVi: "Chào, tôi ở đây để so sánh giá cả/tính năng trực tuyến." },
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
          { en: "use comparison tools to assist decision", vi: "dùng công cụ so sánh để hỗ trợ quyết định" },
          { en: "help spot genuine bargains", vi: "giúp phát hiện những món hời thực sự" },
          { en: "consult tech community for assistance", vi: "tham khảo cộng đồng công nghệ để được trợ giúp" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "compare shipping services across platforms", vi: "so sánh dịch vụ giao hàng giữa các sàn" },
          { en: "evaluate warranty repair services", vi: "đánh giá dịch vụ bảo hành sửa chữa" },
          { en: "subscribe to price drop alert service", vi: "đăng ký dịch vụ thông báo giảm giá" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "spot hidden shipping fee issues", vi: "phát hiện vấn đề phí giao hàng ẩn" },
          { en: "identify counterfeit product issues", vi: "nhận diện nguy cơ hàng giả hàng nhái" },
          { en: "resolve price discrepancy issues", vi: "giải quyết vấn đề chênh lệch giá giữa các trang" }
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
          { en: "create feature comparison matrix", vi: "lập bảng so sánh tính năng chi tiết" },
          { en: "calculate total landed cost", vi: "tính toán tổng chi phí về tay" },
          { en: "apply discount voucher codes", vi: "áp dụng mã giảm giá khuyến mãi" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check which store has stock available", vi: "kiểm tra cửa hàng nào còn sẵn hàng" },
          { en: "compare available payment channels", vi: "so sánh các kênh thanh toán khả dụng" },
          { en: "grab deals while coupons are available", vi: "săn ưu đãi khi mã giảm giá vẫn còn hiệu lực" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Comparing prices/features online. Respond naturally to the user.",
    tags: ["online-shopping","daily-life"]
  }
];
