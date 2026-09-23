/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: at_the_supermarket
 * File: src/data/speaking/topic-library/daily-situations/at-the-supermarket.ts
 *
 * 6 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const AT_THE_SUPERMARKET_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-super-01",
    category: 'daily_situations',
    subcategory: 'at_the_supermarket',
    level: "A1",
    titleEn: "Finding items by aisle",
    titleVi: "Tìm đồ theo lối đi",
    icon: "🛒",
    situationVi: "Bạn đang trong tình huống: Tìm đồ theo lối đi. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for finding items by aisle.", textVi: "Chào, tôi ở đây để tìm đồ theo lối đi." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "aisle",
        ipa: "/aɪl/",
        partOfSpeech: "n.",
        meaningVi: "lối đi",
        exampleEn: "In aisle 4.",
        exampleVi: "Ở lối đi số 4.",
        associatedActions: [
          { en: "walk down the aisle", vi: "đi dọc theo lối đi" },
          { en: "look for the cereal aisle", vi: "tìm lối đi bán ngũ cốc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "checkout",
        ipa: "/ˈtʃɛkaʊt/",
        partOfSpeech: "n.",
        meaningVi: "quầy thanh toán",
        exampleEn: "Go to checkout.",
        exampleVi: "Đến quầy thanh toán.",
        associatedActions: [
          { en: "head to the checkout line", vi: "đi đến hàng chờ thanh toán" },
          { en: "pay at self-checkout", vi: "thanh toán tại quầy tự động" }
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
          { en: "report a missing price tag", vi: "báo cáo việc thiếu nhãn giá" },
          { en: "resolve a barcode issue", vi: "xử lý sự cố mã vạch" }
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
          { en: "follow the checkout process", vi: "làm theo quy trình thanh toán" },
          { en: "scan items in order", vi: "quét các món hàng theo thứ tự" }
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
          { en: "check product availability", vi: "kiểm tra tình trạng còn hàng" },
          { en: "ask if milk is available", vi: "hỏi xem còn sữa hay không" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Where can I find milk?", meaningVi: "Tôi có thể tìm sữa ở đâu?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Finding items by aisle. Respond naturally to the user.",
    tags: ["at-the_supermarket","daily-life"]
  },
  {
    id: "daily-super-02",
    category: 'daily_situations',
    subcategory: 'at_the_supermarket',
    level: "A2",
    titleEn: "Asking about prices and promotions",
    titleVi: "Hỏi về giá và khuyến mãi",
    icon: "🏷️",
    situationVi: "Bạn đang trong tình huống: Hỏi về giá và khuyến mãi. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for asking about prices and promotions.", textVi: "Chào, tôi ở đây để hỏi về giá và khuyến mãi." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "aisle",
        ipa: "/aɪl/",
        partOfSpeech: "n.",
        meaningVi: "lối đi",
        exampleEn: "In aisle 4.",
        exampleVi: "Ở lối đi số 4.",
        associatedActions: [
          { en: "find the promotional aisle", vi: "tìm lối đi có hàng khuyến mãi" },
          { en: "check sale signs in the aisle", vi: "kiểm tra biển giảm giá ở lối đi" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1580481077180-a69894fa35b3?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "checkout",
        ipa: "/ˈtʃɛkaʊt/",
        partOfSpeech: "n.",
        meaningVi: "quầy thanh toán",
        exampleEn: "Go to checkout.",
        exampleVi: "Đến quầy thanh toán.",
        associatedActions: [
          { en: "apply discount at checkout", vi: "áp dụng giảm giá lúc thanh toán" },
          { en: "ask cashier about special offers", vi: "hỏi thu ngân về ưu đãi đặc biệt" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "dispute an incorrect discount", vi: "khiếu nại mức giảm giá không đúng" },
          { en: "point out price discrepancy", vi: "chỉ ra sự chênh lệch giá tiền" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "calculate total savings", vi: "tính toán tổng số tiền tiết kiệm được" },
          { en: "scan promotional coupons", vi: "quét các phiếu giảm giá khuyến mãi" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "ask if sale items are available", vi: "hỏi hàng khuyến mãi còn sẵn không" },
          { en: "request a rain check voucher", vi: "xin phiếu mua hàng giá ưu đãi sau" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Where can I find milk?", meaningVi: "Tôi có thể tìm sữa ở đâu?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Asking about prices and promotions. Respond naturally to the user.",
    tags: ["at-the_supermarket","daily-life"]
  },
  {
    id: "daily-super-03",
    category: 'daily_situations',
    subcategory: 'at_the_supermarket',
    level: "A2",
    titleEn: "Choosing fresh produce",
    titleVi: "Chọn nông sản tươi",
    icon: "🍎",
    situationVi: "Bạn đang trong tình huống: Chọn nông sản tươi. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for choosing fresh produce.", textVi: "Chào, tôi ở đây để chọn nông sản tươi." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "aisle",
        ipa: "/aɪl/",
        partOfSpeech: "n.",
        meaningVi: "lối đi",
        exampleEn: "In aisle 4.",
        exampleVi: "Ở lối đi số 4.",
        associatedActions: [
          { en: "visit the fresh produce aisle", vi: "ghé thăm quầy rau củ quả tươi" },
          { en: "weigh vegetables in the aisle", vi: "cân rau củ tại lối đi nông sản" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "checkout",
        ipa: "/ˈtʃɛkaʊt/",
        partOfSpeech: "n.",
        meaningVi: "quầy thanh toán",
        exampleEn: "Go to checkout.",
        exampleVi: "Đến quầy thanh toán.",
        associatedActions: [
          { en: "weigh fruits at checkout", vi: "cân trái cây tại quầy thanh toán" },
          { en: "pack delicate berries carefully", vi: "đóng gói dâu tươi cẩn thận" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "notice damaged or bruised fruit", vi: "phát hiện trái cây bị dập nát" },
          { en: "check expiration date on greens", vi: "kiểm tra hạn dùng trên rau xanh" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "select ripe organic avocados", vi: "lựa chọn bơ hữu cơ vừa chín tới" },
          { en: "inspect freshness of produce", vi: "kiểm tra độ tươi ngon của nông sản" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check seasonal fruit availability", vi: "kiểm tra trái cây mùa vụ có sẵn" },
          { en: "ask about freshly arrived herbs", vi: "hỏi về các loại rau thơm mới về" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Where can I find milk?", meaningVi: "Tôi có thể tìm sữa ở đâu?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Choosing fresh produce. Respond naturally to the user.",
    tags: ["at-the_supermarket","daily-life"]
  },
  {
    id: "daily-super-04",
    category: 'daily_situations',
    subcategory: 'at_the_supermarket',
    level: "A1",
    titleEn: "At the checkout counter",
    titleVi: "Tại quầy thanh toán",
    icon: "💳",
    situationVi: "Bạn đang trong tình huống: Tại quầy thanh toán. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for at the checkout counter.", textVi: "Chào, tôi ở đây để tại quầy thanh toán." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "aisle",
        ipa: "/aɪl/",
        partOfSpeech: "n.",
        meaningVi: "lối đi",
        exampleEn: "In aisle 4.",
        exampleVi: "Ở lối đi số 4.",
        associatedActions: [
          { en: "leave the shopping aisle", vi: "rời khỏi lối đi mua sắm" },
          { en: "grab chewing gum by checkout aisle", vi: "lấy kẹo cao su ở lối thanh toán" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "checkout",
        ipa: "/ˈtʃɛkaʊt/",
        partOfSpeech: "n.",
        meaningVi: "quầy thanh toán",
        exampleEn: "Go to checkout.",
        exampleVi: "Đến quầy thanh toán.",
        associatedActions: [
          { en: "unload items onto checkout belt", vi: "dỡ đồ lên băng chuyền thu ngân" },
          { en: "tap contactless card to pay", vi: "chạm thẻ thanh toán không tiếp xúc" }
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
          { en: "handle a card decline issue", vi: "xử lý sự cố thẻ bị từ chối" },
          { en: "ask for paper bag replacement", vi: "yêu cầu đổi sang túi giấy" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "scan loyalty card at register", vi: "quét thẻ tích điểm tại máy tính tiền" },
          { en: "receive printed paper receipt", vi: "nhận hóa đơn giấy in ra" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "inquire about reusable bags available", vi: "hỏi về túi tái sử dụng có sẵn" },
          { en: "check if cash back is available", vi: "hỏi xem có hỗ trợ rút tiền mặt không" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Where can I find milk?", meaningVi: "Tôi có thể tìm sữa ở đâu?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: At the checkout counter. Respond naturally to the user.",
    tags: ["at-the_supermarket","daily-life"]
  },
  {
    id: "daily-super-05",
    category: 'daily_situations',
    subcategory: 'at_the_supermarket',
    level: "B1",
    titleEn: "Returning a defective product",
    titleVi: "Trả lại một sản phẩm lỗi",
    icon: "🔄",
    situationVi: "Bạn đang trong tình huống: Trả lại một sản phẩm lỗi. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for returning a defective product.", textVi: "Chào, tôi ở đây để trả lại một sản phẩm lỗi." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "aisle",
        ipa: "/aɪl/",
        partOfSpeech: "n.",
        meaningVi: "lối đi",
        exampleEn: "In aisle 4.",
        exampleVi: "Ở lối đi số 4.",
        associatedActions: [
          { en: "walk back to the customer desk", vi: "quay lại quầy dịch vụ khách hàng" },
          { en: "find replacement item on aisle", vi: "tìm sản phẩm thay thế trên lối đi" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "checkout",
        ipa: "/ˈtʃɛkaʊt/",
        partOfSpeech: "n.",
        meaningVi: "quầy thanh toán",
        exampleEn: "Go to checkout.",
        exampleVi: "Đến quầy thanh toán.",
        associatedActions: [
          { en: "present original purchase receipt", vi: "xuất trình hóa đơn mua hàng gốc" },
          { en: "receive store credit or refund", vi: "nhận điểm hoàn tiền hoặc đổi trả" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "show defective broken seal", vi: "chỉ ra niêm phong sản phẩm bị rách" },
          { en: "explain spoiled item condition", vi: "giải thích tình trạng đồ bị hỏng" }
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
          { en: "complete the return exchange slip", vi: "điền phiếu đổi trả hàng hóa" },
          { en: "verify warranty and receipt", vi: "xác minh bảo hành và hóa đơn" }
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
          { en: "check if identical model is available", vi: "kiểm tra xem còn mẫu tương tự không" },
          { en: "accept available store alternative", vi: "chấp nhận món hàng thay thế có sẵn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Where can I find milk?", meaningVi: "Tôi có thể tìm sữa ở đâu?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Returning a defective product. Respond naturally to the user.",
    tags: ["at-the_supermarket","daily-life"]
  },
  {
    id: "daily-super-06",
    category: 'daily_situations',
    subcategory: 'at_the_supermarket',
    level: "A2",
    titleEn: "Using a loyalty card/coupons",
    titleVi: "Sử dụng thẻ thành viên/phiếu giảm giá",
    icon: "🎟️",
    situationVi: "Bạn đang trong tình huống: Sử dụng thẻ thành viên/phiếu giảm giá. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for using a loyalty card/coupons.", textVi: "Chào, tôi ở đây để sử dụng thẻ thành viên/phiếu giảm giá." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "aisle",
        ipa: "/aɪl/",
        partOfSpeech: "n.",
        meaningVi: "lối đi",
        exampleEn: "In aisle 4.",
        exampleVi: "Ở lối đi số 4.",
        associatedActions: [
          { en: "spot member discounts in aisle", vi: "nhận biết giảm giá thành viên ở lối đi" },
          { en: "match coupon codes to aisle items", vi: "so sánh mã phiếu giảm giá với hàng trên kệ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "checkout",
        ipa: "/ˈtʃɛkaʊt/",
        partOfSpeech: "n.",
        meaningVi: "quầy thanh toán",
        exampleEn: "Go to checkout.",
        exampleVi: "Đến quầy thanh toán.",
        associatedActions: [
          { en: "hand digital coupons to cashier", vi: "đưa mã giảm giá trên điện thoại cho thu ngân" },
          { en: "enter phone number on pin pad", vi: "nhập số điện thoại trên bàn phím số" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "resolve expired coupon error", vi: "xử lý lỗi phiếu giảm giá hết hạn" },
          { en: "clarify terms of voucher discount", vi: "làm rõ điều khoản của voucher giảm giá" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "redeem accumulated reward points", vi: "đổi điểm thưởng đã tích lũy" },
          { en: "update membership loyalty profile", vi: "cập nhật thông tin thẻ thành viên" }
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
          { en: "check available member perks", vi: "kiểm tra quyền lợi thành viên hiện có" },
          { en: "view available coupon vouchers in app", vi: "xem voucher khuyến mãi có sẵn trong ứng dụng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Where can I find milk?", meaningVi: "Tôi có thể tìm sữa ở đâu?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Using a loyalty card/coupons. Respond naturally to the user.",
    tags: ["at-the_supermarket","daily-life"]
  }
];
