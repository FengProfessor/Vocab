/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: at_the_post_office
 * File: src/data/speaking/topic-library/daily-situations/at-the-post-office.ts
 *
 * 4 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const AT_THE_POST_OFFICE_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-post-01",
    category: 'daily_situations',
    subcategory: 'at_the_post_office',
    level: "A2",
    titleEn: "Sending a package",
    titleVi: "Gửi một bưu kiện",
    icon: "📦",
    situationVi: "Bạn đang trong tình huống: Gửi một bưu kiện. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for sending a package.", textVi: "Chào, tôi ở đây để gửi một bưu kiện." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "package",
        ipa: "/ˈpækɪdʒ/",
        partOfSpeech: "n.",
        meaningVi: "bưu kiện",
        exampleEn: "Send a package.",
        exampleVi: "Gửi một bưu kiện.",
        associatedActions: [
          { en: "weigh cardboard package on postal scale", vi: "cân bưu kiện carton trên bàn cân bưu điện" },
          { en: "seal shipping package securely with tape", vi: "dán kín bưu kiện gửi hàng bằng băng dính" },
          { en: "stick address shipping label on package", vi: "dán nhãn địa chỉ người nhận lên kiện hàng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "stamp",
        ipa: "/stæmp/",
        partOfSpeech: "n.",
        meaningVi: "tem",
        exampleEn: "Buy a stamp.",
        exampleVi: "Mua một con tem.",
        associatedActions: [
          { en: "affix priority postage stamp to box", vi: "dán tem chuyển phát ưu tiên lên hộp hàng" },
          { en: "buy international parcel postage stamps", vi: "mua tem bưu chính gửi kiện hàng quốc tế" },
          { en: "verify barcode postage stamp value", vi: "kiểm tra mệnh giá tem bưu chính điện tử" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "insure fragile items against transit damage", vi: "mua bảo hiểm hàng dễ vỡ tránh hư hỏng" },
          { en: "resolve customs declaration issues", vi: "giải quyết vướng mắc tờ khai hải quan" },
          { en: "report missing delivery address issues", vi: "bổ sung khi thiếu thông tin địa chỉ người nhận" }
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
          { en: "complete international shipping form", vi: "điền vào tờ khai vận chuyển quốc tế" },
          { en: "receive tracking barcode receipt", vi: "nhận biên lai chứa mã vạch theo dõi bưu phẩm" },
          { en: "select standard ground dispatch process", vi: "chọn quy trình vận chuyển đường bộ tiêu chuẩn" }
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
          { en: "check available express delivery options", vi: "kiểm tra các gói giao hàng hỏa tốc sẵn có" },
          { en: "confirm bubble wrap is available", vi: "xác nhận màng xốp chống sốc có sẵn để đóng gói" },
          { en: "inquire about next-day courier availability", vi: "hỏi dịch vụ giao thư ngày hôm sau" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I want to send this package.", meaningVi: "Tôi muốn gửi bưu kiện này." },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Sending a package. Respond naturally to the user.",
    tags: ["at-the_post_office","daily-life"]
  },
  {
    id: "daily-post-02",
    category: 'daily_situations',
    subcategory: 'at_the_post_office',
    level: "A1",
    titleEn: "Buying stamps and envelopes",
    titleVi: "Mua tem và phong bì",
    icon: "✉️",
    situationVi: "Bạn đang trong tình huống: Mua tem và phong bì. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for buying stamps and envelopes.", textVi: "Chào, tôi ở đây để mua tem và phong bì." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "package",
        ipa: "/ˈpækɪdʒ/",
        partOfSpeech: "n.",
        meaningVi: "bưu kiện",
        exampleEn: "Send a package.",
        exampleVi: "Gửi một bưu kiện.",
        associatedActions: [
          { en: "pack postcards into protective envelope", vi: "xếp các bưu thiếp vào phong bì bảo vệ" },
          { en: "bundle paper letters into mailing packet", vi: "buộc các lá thư giấy thành gói gửi bưu điện" },
          { en: "choose padded bubble mailer package", vi: "chọn túi bọc chống sốc để gửi thư quan trọng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "stamp",
        ipa: "/stæmp/",
        partOfSpeech: "n.",
        meaningVi: "tem",
        exampleEn: "Buy a stamp.",
        exampleVi: "Mua một con tem.",
        associatedActions: [
          { en: "stick first-class stamp on envelope corner", vi: "dán tem chuyển phát hạng nhất góc phong bì" },
          { en: "buy commemorative stamp collector booklet", vi: "mua sổ tay sưu tập tem bưu chính kỷ niệm" },
          { en: "purchase roll of domestic forever stamps", vi: "mua cuộn tem bưu chính nội địa dài hạn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "replace smudged or unreadable stamp", vi: "đổi lại con tem bị nhòe mực không đọc được" },
          { en: "correct incomplete zip postal code", vi: "sửa lại mã bưu chính bị ghi thiếu" },
          { en: "avoid insufficient postage penalty", vi: "tránh bị phạt do dán thiếu cước bưu chính" }
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
          { en: "moisten and seal envelope adhesive flap", vi: "làm ẩm và miết chặt nắp dán phong bì" },
          { en: "drop stamped letter into post box slot", vi: "thả lá thư đã dán tem vào hòm thư bưu điện" },
          { en: "hand letters directly to window clerk", vi: "trao thư trực tiếp cho nhân viên tại quầy" }
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
          { en: "check available envelope dimensions and sizes", vi: "kiểm tra các kích thước phong bì thư có sẵn" },
          { en: "ask if holiday postage stamps are available", vi: "hỏi xem có mẫu tem chủ đề ngày lễ không" },
          { en: "confirm stamp vending machine availability", vi: "kiểm tra máy bán tem tự động có hoạt động không" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I want to send this package.", meaningVi: "Tôi muốn gửi bưu kiện này." },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Buying stamps and envelopes. Respond naturally to the user.",
    tags: ["at-the_post_office","daily-life"]
  },
  {
    id: "daily-post-03",
    category: 'daily_situations',
    subcategory: 'at_the_post_office',
    level: "A2",
    titleEn: "Tracking a delivery",
    titleVi: "Theo dõi một đơn hàng",
    icon: "🔍",
    situationVi: "Bạn đang trong tình huống: Theo dõi một đơn hàng. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for tracking a delivery.", textVi: "Chào, tôi ở đây để theo dõi một đơn hàng." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "package",
        ipa: "/ˈpækɪdʒ/",
        partOfSpeech: "n.",
        meaningVi: "bưu kiện",
        exampleEn: "Send a package.",
        exampleVi: "Gửi một bưu kiện.",
        associatedActions: [
          { en: "enter package tracking code on website", vi: "nhập mã tra cứu bưu kiện trên trang web" },
          { en: "monitor delivery updates for parcel", vi: "theo dõi cập nhật lộ trình giao gói hàng" },
          { en: "verify delivery status of shipped package", vi: "xác nhận trạng thái bưu phẩm đã đến nơi" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "stamp",
        ipa: "/stæmp/",
        partOfSpeech: "n.",
        meaningVi: "tem",
        exampleEn: "Buy a stamp.",
        exampleVi: "Mua một con tem.",
        associatedActions: [
          { en: "check postmark stamp date on receipt", vi: "kiểm tra ngày đóng dấu bưu điện trên biên lai" },
          { en: "scan digital barcode shipping stamp", vi: "quét con tem mã vạch vận chuyển điện tử" },
          { en: "verify postage stamp payment status", vi: "xác thực trạng thái thanh toán tem cước" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "investigate delayed package in transit", vi: "tra soát bưu phẩm bị chậm trễ dọc đường" },
          { en: "open inquiry for missing package status", vi: "mở khiếu nại bưu kiện bị mất tín hiệu theo dõi" },
          { en: "resolve failed delivery attempt notice", vi: "xử lý thông báo giao hàng không thành công" }
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
          { en: "refresh tracking status checkpoint", vi: "làm mới điểm dừng kiểm tra tiến độ giao hàng" },
          { en: "sign digital signature upon delivery", vi: "ký tên xác nhận điện tử khi nhận bưu phẩm" },
          { en: "follow postal rerouting procedure", vi: "làm theo thủ tục đổi địa chỉ phát bưu kiện" }
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
          { en: "check if parcel is ready for pickup", vi: "kiểm tra kiện hàng đã sẵn sàng để lấy chưa" },
          { en: "find available parcel locker station", vi: "tìm trạm tủ gửi đồ thông minh còn ngăn trống" },
          { en: "confirm clerk is available to assist", vi: "xác nhận nhân viên bưu điện sẵn sàng hỗ trợ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I want to send this package.", meaningVi: "Tôi muốn gửi bưu kiện này." },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Tracking a delivery. Respond naturally to the user.",
    tags: ["at-the_post_office","daily-life"]
  },
  {
    id: "daily-post-04",
    category: 'daily_situations',
    subcategory: 'at_the_post_office',
    level: "B1",
    titleEn: "Sending registered/express mail",
    titleVi: "Gửi thư bảo đảm/chuyển phát nhanh",
    icon: "📮",
    situationVi: "Bạn đang trong tình huống: Gửi thư bảo đảm/chuyển phát nhanh. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for sending registered/express mail.", textVi: "Chào, tôi ở đây để gửi thư bảo đảm/chuyển phát nhanh." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "package",
        ipa: "/ˈpækɪdʒ/",
        partOfSpeech: "n.",
        meaningVi: "bưu kiện",
        exampleEn: "Send a package.",
        exampleVi: "Gửi một bưu kiện.",
        associatedActions: [
          { en: "retrieve registered package from shelf", vi: "lấy gói bưu phẩm bảo đảm từ trên giá" },
          { en: "inspect package condition before signing", vi: "kiểm tra tình trạng gói hàng trước khi ký nhận" },
          { en: "take home delivered registered parcel", vi: "mang gói bưu kiện bảo đảm về nhà" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "stamp",
        ipa: "/stæmp/",
        partOfSpeech: "n.",
        meaningVi: "tem",
        exampleEn: "Buy a stamp.",
        exampleVi: "Mua một con tem.",
        associatedActions: [
          { en: "verify official registered mail stamp", vi: "kiểm tra dấu bưu chính thư bảo đảm chính thức" },
          { en: "check certified stamp on delivery card", vi: "kiểm tra con dấu chứng nhận trên giấy báo nhận" },
          { en: "stamp date on postal collection slip", vi: "đóng dấu ngày nhận vào phiếu bưu điện" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "resolve missing delivery notice card", vi: "xử lý việc làm mất giấy báo nhận bưu phẩm" },
          { en: "verify identity if recipient name differs", vi: "xác minh danh tính khi tên người nhận có khác biệt" },
          { en: "claim damaged registered package item", vi: "khiếu nại thư bảo đảm bị rách rưới hư hỏng" }
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
          { en: "present national ID at service window", vi: "xuất trình căn cước công dân tại quầy phục vụ" },
          { en: "sign postal receipt for registered mail", vi: "ký tên vào phiếu nhận thư bảo đảm" },
          { en: "complete identity verification protocol", vi: "hoàn tất quy trình kiểm tra danh tính" }
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
          { en: "check post office counter opening hours", vi: "kiểm tra giờ mở cửa quầy giao dịch bưu điện" },
          { en: "confirm registered mail item is available", vi: "xác nhận thư bảo đảm đã có sẵn tại quầy" },
          { en: "inquire about available redelivery dates", vi: "hỏi về các ngày phát lại bưu phẩm sẵn có" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I want to send this package.", meaningVi: "Tôi muốn gửi bưu kiện này." },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Sending registered/express mail. Respond naturally to the user.",
    tags: ["at-the_post_office","daily-life"]
  }
];
