/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: at_the_bank
 * File: src/data/speaking/topic-library/daily-situations/at-the-bank.ts
 *
 * 5 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const AT_THE_BANK_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-bank-01",
    category: 'daily_situations',
    subcategory: 'at_the_bank',
    level: "A2",
    titleEn: "Opening a bank account",
    titleVi: "Mở tài khoản ngân hàng",
    icon: "🏦",
    situationVi: "Bạn đang trong tình huống: Mở tài khoản ngân hàng. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Welcome to the bank. How can I assist you?", textVi: "Chào mừng đến với ngân hàng. Tôi có thể giúp gì?" },
      { speaker: 'B', text: "I would like to talk about opening a bank account.", textVi: "Tôi muốn trao đổi về mở tài khoản ngân hàng." },
      { speaker: 'A', text: "Sure, do you have your ID and account number?", textVi: "Chắc chắn rồi, bạn có mang theo CMND và số tài khoản không?" },
      { speaker: 'B', text: "Yes, here they are.", textVi: "Vâng, đây ạ." },
      { speaker: 'A', text: "Please wait a moment while I process this.", textVi: "Vui lòng đợi một lát trong khi tôi xử lý." },
      { speaker: 'B', text: "Take your time.", textVi: "Cứ từ từ." }
    ],
    keyVocabulary: [
      {
        term: "account",
        ipa: "/əˈkaʊnt/",
        partOfSpeech: "n.",
        meaningVi: "tài khoản",
        exampleEn: "Open a bank account.",
        exampleVi: "Mở tài khoản ngân hàng.",
        associatedActions: [
          { en: "open a savings account", vi: "mở tài khoản tiết kiệm" },
          { en: "verify account identity documents", vi: "xác minh giấy tờ tùy thân của tài khoản" },
          { en: "receive account confirmation letter", vi: "nhận thư xác nhận mở tài khoản" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "deposit",
        ipa: "/dɪˈpɒzɪt/",
        partOfSpeech: "v.",
        meaningVi: "gửi tiền",
        exampleEn: "I want to deposit money.",
        exampleVi: "Tôi muốn gửi tiền.",
        associatedActions: [
          { en: "make initial cash deposit", vi: "nộp khoản tiền gửi ban đầu" },
          { en: "deposit funds into new account", vi: "gửi tiền vào tài khoản mới" },
          { en: "verify initial deposit amount", vi: "kiểm tra số tiền nộp ban đầu" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "withdraw",
        ipa: "/wɪðˈdrɔː/",
        partOfSpeech: "v.",
        meaningVi: "rút tiền",
        exampleEn: "I need to withdraw cash.",
        exampleVi: "Tôi cần rút tiền mặt.",
        associatedActions: [
          { en: "set daily withdrawal limit", vi: "thiết lập hạn mức rút tiền hàng ngày" },
          { en: "withdraw cash with debit card", vi: "rút tiền mặt bằng thẻ ghi nợ" },
          { en: "test first cash withdrawal", vi: "thử đợt rút tiền đầu tiên" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "balance",
        ipa: "/ˈbæləns/",
        partOfSpeech: "n.",
        meaningVi: "số dư",
        exampleEn: "Check your account balance.",
        exampleVi: "Kiểm tra số dư tài khoản.",
        associatedActions: [
          { en: "check starting account balance", vi: "kiểm tra số dư khởi điểm tài khoản" },
          { en: "maintain minimum required balance", vi: "duy trì số dư tối thiểu theo yêu cầu" },
          { en: "monitor account balance online", vi: "theo dõi số dư tài khoản trực tuyến" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "transaction",
        ipa: "/trænˈzækʃən/",
        partOfSpeech: "n.",
        meaningVi: "giao dịch",
        exampleEn: "A recent transaction.",
        exampleVi: "Một giao dịch gần đây.",
        associatedActions: [
          { en: "record first bank transaction", vi: "ghi nhận giao dịch ngân hàng đầu tiên" },
          { en: "enable digital transaction alerts", vi: "kích hoạt thông báo biến động giao dịch" },
          { en: "review opening transaction fee", vi: "kiểm tra phí giao dịch mở tài khoản" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I want to open an account.", meaningVi: "Tôi muốn mở một tài khoản." },
      { phrase: "What is the exchange rate?", meaningVi: "Tỷ giá hối đoái là bao nhiêu?" },
      { phrase: "I lost my credit card.", meaningVi: "Tôi đã làm mất thẻ tín dụng." },
      { phrase: "Can I withdraw some money?", meaningVi: "Tôi có thể rút một ít tiền không?" },
      { phrase: "Please check my balance.", meaningVi: "Vui lòng kiểm tra số dư của tôi." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Opening a bank account. Respond naturally to the user.",
    tags: ["at-the_bank","daily-life"]
  },
  {
    id: "daily-bank-02",
    category: 'daily_situations',
    subcategory: 'at_the_bank',
    level: "A2",
    titleEn: "Withdrawing/depositing money",
    titleVi: "Rút/gửi tiền",
    icon: "💵",
    situationVi: "Bạn đang trong tình huống: Rút/gửi tiền. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Welcome to the bank. How can I assist you?", textVi: "Chào mừng đến với ngân hàng. Tôi có thể giúp gì?" },
      { speaker: 'B', text: "I would like to talk about withdrawing/depositing money.", textVi: "Tôi muốn trao đổi về rút/gửi tiền." },
      { speaker: 'A', text: "Sure, do you have your ID and account number?", textVi: "Chắc chắn rồi, bạn có mang theo CMND và số tài khoản không?" },
      { speaker: 'B', text: "Yes, here they are.", textVi: "Vâng, đây ạ." },
      { speaker: 'A', text: "Please wait a moment while I process this.", textVi: "Vui lòng đợi một lát trong khi tôi xử lý." },
      { speaker: 'B', text: "Take your time.", textVi: "Cứ từ từ." }
    ],
    keyVocabulary: [
      {
        term: "account",
        ipa: "/əˈkaʊnt/",
        partOfSpeech: "n.",
        meaningVi: "tài khoản",
        exampleEn: "Open a bank account.",
        exampleVi: "Mở tài khoản ngân hàng.",
        associatedActions: [
          { en: "select primary checking account", vi: "chọn tài khoản thanh toán chính" },
          { en: "confirm account routing number", vi: "xác nhận mã định tuyến tài khoản" },
          { en: "link account to ATM debit card", vi: "liên kết tài khoản với thẻ ATM" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "deposit",
        ipa: "/dɪˈpɒzɪt/",
        partOfSpeech: "v.",
        meaningVi: "gửi tiền",
        exampleEn: "I want to deposit money.",
        exampleVi: "Tôi muốn gửi tiền.",
        associatedActions: [
          { en: "hand deposit slip to teller", vi: "đưa phiếu nộp tiền cho giao dịch viên" },
          { en: "insert banknotes into deposit slot", vi: "cho tiền giấy vào khe nộp tiền ATM" },
          { en: "deposit payroll check directly", vi: "gửi séc lương vào tài khoản trực tiếp" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "withdraw",
        ipa: "/wɪðˈdrɔː/",
        partOfSpeech: "v.",
        meaningVi: "rút tiền",
        exampleEn: "I need to withdraw cash.",
        exampleVi: "Tôi cần rút tiền mặt.",
        associatedActions: [
          { en: "enter PIN code to withdraw cash", vi: "nhập mã PIN để rút tiền mặt" },
          { en: "withdraw foreign travel money", vi: "rút tiền mặt để đi du lịch" },
          { en: "request specific banknote bills", vi: "yêu cầu mệnh giá tiền cụ thể" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "balance",
        ipa: "/ˈbæləns/",
        partOfSpeech: "n.",
        meaningVi: "số dư",
        exampleEn: "Check your account balance.",
        exampleVi: "Kiểm tra số dư tài khoản.",
        associatedActions: [
          { en: "view remaining available balance", vi: "xem số dư khả dụng còn lại" },
          { en: "print out balance inquiry slip", vi: "in biên lai tra cứu số dư" },
          { en: "verify ledger balance after cashout", vi: "xác thực số dư sau khi rút tiền" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "transaction",
        ipa: "/trænˈzækʃən/",
        partOfSpeech: "n.",
        meaningVi: "giao dịch",
        exampleEn: "A recent transaction.",
        exampleVi: "Một giao dịch gần đây.",
        associatedActions: [
          { en: "collect printed transaction receipt", vi: "lấy biên lai giao dịch in ra" },
          { en: "verify ATM transaction fee", vi: "kiểm tra mức phí giao dịch ATM" },
          { en: "cancel transaction before processing", vi: "hủy giao dịch trước khi thực hiện" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I want to open an account.", meaningVi: "Tôi muốn mở một tài khoản." },
      { phrase: "What is the exchange rate?", meaningVi: "Tỷ giá hối đoái là bao nhiêu?" },
      { phrase: "I lost my credit card.", meaningVi: "Tôi đã làm mất thẻ tín dụng." },
      { phrase: "Can I withdraw some money?", meaningVi: "Tôi có thể rút một ít tiền không?" },
      { phrase: "Please check my balance.", meaningVi: "Vui lòng kiểm tra số dư của tôi." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Withdrawing/depositing money. Respond naturally to the user.",
    tags: ["at-the_bank","daily-life"]
  },
  {
    id: "daily-bank-03",
    category: 'daily_situations',
    subcategory: 'at_the_bank',
    level: "A2",
    titleEn: "Asking about exchange rates",
    titleVi: "Hỏi về tỷ giá hối đoái",
    icon: "💱",
    situationVi: "Bạn đang trong tình huống: Hỏi về tỷ giá hối đoái. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Welcome to the bank. How can I assist you?", textVi: "Chào mừng đến với ngân hàng. Tôi có thể giúp gì?" },
      { speaker: 'B', text: "I would like to talk about asking about exchange rates.", textVi: "Tôi muốn trao đổi về hỏi về tỷ giá hối đoái." },
      { speaker: 'A', text: "Sure, do you have your ID and account number?", textVi: "Chắc chắn rồi, bạn có mang theo CMND và số tài khoản không?" },
      { speaker: 'B', text: "Yes, here they are.", textVi: "Vâng, đây ạ." },
      { speaker: 'A', text: "Please wait a moment while I process this.", textVi: "Vui lòng đợi một lát trong khi tôi xử lý." },
      { speaker: 'B', text: "Take your time.", textVi: "Cứ từ từ." }
    ],
    keyVocabulary: [
      {
        term: "account",
        ipa: "/əˈkaʊnt/",
        partOfSpeech: "n.",
        meaningVi: "tài khoản",
        exampleEn: "Open a bank account.",
        exampleVi: "Mở tài khoản ngân hàng.",
        associatedActions: [
          { en: "open multi-currency foreign account", vi: "mở tài khoản ngoại tệ đa năng" },
          { en: "transfer funds between accounts", vi: "chuyển tiền giữa các tài khoản" },
          { en: "check account currency holdings", vi: "kiểm tra lượng ngoại tệ trong tài khoản" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "deposit",
        ipa: "/dɪˈpɒzɪt/",
        partOfSpeech: "v.",
        meaningVi: "gửi tiền",
        exampleEn: "I want to deposit money.",
        exampleVi: "Tôi muốn gửi tiền.",
        associatedActions: [
          { en: "deposit foreign banknotes at bank", vi: "nộp tiền mặt ngoại tệ tại ngân hàng" },
          { en: "convert and deposit local funds", vi: "quy đổi và gửi tiền vào tài khoản" },
          { en: "deposit international wire transfer", vi: "nhận tiền gửi qua điện chuyển tiền quốc tế" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "withdraw",
        ipa: "/wɪðˈdrɔː/",
        partOfSpeech: "v.",
        meaningVi: "rút tiền",
        exampleEn: "I need to withdraw cash.",
        exampleVi: "Tôi cần rút tiền mặt.",
        associatedActions: [
          { en: "withdraw local currency overseas", vi: "rút nội tệ khi ở nước ngoài" },
          { en: "withdraw converted foreign cash", vi: "rút tiền mặt ngoại tệ đã đổi" },
          { en: "check international withdrawal fee", vi: "kiểm tra phí rút tiền quốc tế" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "balance",
        ipa: "/ˈbæləns/",
        partOfSpeech: "n.",
        meaningVi: "số dư",
        exampleEn: "Check your account balance.",
        exampleVi: "Kiểm tra số dư tài khoản.",
        associatedActions: [
          { en: "calculate real-time balance value", vi: "tính toán giá trị số dư theo thời gian thực" },
          { en: "check foreign currency balance", vi: "kiểm tra số dư tiền ngoại tệ" },
          { en: "protect balance against inflation", vi: "bảo vệ số dư khỏi biến động tỷ giá" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "transaction",
        ipa: "/trænˈzækʃən/",
        partOfSpeech: "n.",
        meaningVi: "giao dịch",
        exampleEn: "A recent transaction.",
        exampleVi: "Một giao dịch gần đây.",
        associatedActions: [
          { en: "execute foreign exchange transaction", vi: "thực hiện giao dịch mua bán ngoại tệ" },
          { en: "lock in favorable exchange rate", vi: "chốt giao dịch ở tỷ giá ưu đãi" },
          { en: "review foreign transaction charges", vi: "kiểm tra các khoản phí giao dịch ngoại hối" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I want to open an account.", meaningVi: "Tôi muốn mở một tài khoản." },
      { phrase: "What is the exchange rate?", meaningVi: "Tỷ giá hối đoái là bao nhiêu?" },
      { phrase: "I lost my credit card.", meaningVi: "Tôi đã làm mất thẻ tín dụng." },
      { phrase: "Can I withdraw some money?", meaningVi: "Tôi có thể rút một ít tiền không?" },
      { phrase: "Please check my balance.", meaningVi: "Vui lòng kiểm tra số dư của tôi." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Asking about exchange rates. Respond naturally to the user.",
    tags: ["at-the_bank","daily-life"]
  },
  {
    id: "daily-bank-04",
    category: 'daily_situations',
    subcategory: 'at_the_bank',
    level: "B1",
    titleEn: "Reporting a lost card",
    titleVi: "Báo cáo mất thẻ",
    icon: "💳",
    situationVi: "Bạn đang trong tình huống: Báo cáo mất thẻ. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Welcome to the bank. How can I assist you?", textVi: "Chào mừng đến với ngân hàng. Tôi có thể giúp gì?" },
      { speaker: 'B', text: "I would like to talk about reporting a lost card.", textVi: "Tôi muốn trao đổi về báo cáo mất thẻ." },
      { speaker: 'A', text: "Sure, do you have your ID and account number?", textVi: "Chắc chắn rồi, bạn có mang theo CMND và số tài khoản không?" },
      { speaker: 'B', text: "Yes, here they are.", textVi: "Vâng, đây ạ." },
      { speaker: 'A', text: "Please wait a moment while I process this.", textVi: "Vui lòng đợi một lát trong khi tôi xử lý." },
      { speaker: 'B', text: "Take your time.", textVi: "Cứ từ từ." }
    ],
    keyVocabulary: [
      {
        term: "account",
        ipa: "/əˈkaʊnt/",
        partOfSpeech: "n.",
        meaningVi: "tài khoản",
        exampleEn: "Open a bank account.",
        exampleVi: "Mở tài khoản ngân hàng.",
        associatedActions: [
          { en: "freeze compromised bank account", vi: "đóng băng tài khoản ngân hàng bị lộ thông tin" },
          { en: "request new replacement card", vi: "yêu cầu cấp lại thẻ ngân hàng mới" },
          { en: "update account security credentials", vi: "cập nhật thông tin bảo mật tài khoản" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "deposit",
        ipa: "/dɪˈpɒzɪt/",
        partOfSpeech: "v.",
        meaningVi: "gửi tiền",
        exampleEn: "I want to deposit money.",
        exampleVi: "Tôi muốn gửi tiền.",
        associatedActions: [
          { en: "hold pending incoming deposits", vi: "tạm giữ các khoản tiền gửi đang chờ" },
          { en: "reroute direct payroll deposit", vi: "chuyển hướng khoản tiền lương nộp vào" },
          { en: "confirm secure deposit channel", vi: "xác nhận kênh nộp tiền an toàn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "withdraw",
        ipa: "/wɪðˈdrɔː/",
        partOfSpeech: "v.",
        meaningVi: "rút tiền",
        exampleEn: "I need to withdraw cash.",
        exampleVi: "Tôi cần rút tiền mặt.",
        associatedActions: [
          { en: "block unauthorized cash withdrawals", vi: "chặn các đợt rút tiền mặt trái phép" },
          { en: "withdraw money in branch with ID", vi: "rút tiền tại quầy bằng căn cước công dân" },
          { en: "prevent unauthorized ATM access", vi: "ngăn chặn kẻ gian rút tiền tại ATM" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "balance",
        ipa: "/ˈbæləns/",
        partOfSpeech: "n.",
        meaningVi: "số dư",
        exampleEn: "Check your account balance.",
        exampleVi: "Kiểm tra số dư tài khoản.",
        associatedActions: [
          { en: "audit balance for missing funds", vi: "kiểm tra số dư để phát hiện tiền thất thoát" },
          { en: "protect total savings balance", vi: "bảo vệ toàn bộ số dư tiền tiết kiệm" },
          { en: "confirm verified account balance", vi: "xác nhận số dư tài khoản đã đối soát" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "transaction",
        ipa: "/trænˈzækʃən/",
        partOfSpeech: "n.",
        meaningVi: "giao dịch",
        exampleEn: "A recent transaction.",
        exampleVi: "Một giao dịch gần đây.",
        associatedActions: [
          { en: "dispute fraudulent transaction", vi: "khiếu nại các giao dịch gian lận" },
          { en: "flag unauthorized charge immediately", vi: "báo cáo ngay khoản tiền bị trừ bất thường" },
          { en: "request transaction chargeback", vi: "yêu cầu hoàn trả tiền giao dịch sai" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I want to open an account.", meaningVi: "Tôi muốn mở một tài khoản." },
      { phrase: "What is the exchange rate?", meaningVi: "Tỷ giá hối đoái là bao nhiêu?" },
      { phrase: "I lost my credit card.", meaningVi: "Tôi đã làm mất thẻ tín dụng." },
      { phrase: "Can I withdraw some money?", meaningVi: "Tôi có thể rút một ít tiền không?" },
      { phrase: "Please check my balance.", meaningVi: "Vui lòng kiểm tra số dư của tôi." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Reporting a lost card. Respond naturally to the user.",
    tags: ["at-the_bank","daily-life"]
  },
  {
    id: "daily-bank-05",
    category: 'daily_situations',
    subcategory: 'at_the_bank',
    level: "B2",
    titleEn: "Discussing loan options",
    titleVi: "Thảo luận các lựa chọn vay",
    icon: "📄",
    situationVi: "Bạn đang trong tình huống: Thảo luận các lựa chọn vay. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Welcome to the bank. How can I assist you?", textVi: "Chào mừng đến với ngân hàng. Tôi có thể giúp gì?" },
      { speaker: 'B', text: "I would like to talk about discussing loan options.", textVi: "Tôi muốn trao đổi về thảo luận các lựa chọn vay." },
      { speaker: 'A', text: "Sure, do you have your ID and account number?", textVi: "Chắc chắn rồi, bạn có mang theo CMND và số tài khoản không?" },
      { speaker: 'B', text: "Yes, here they are.", textVi: "Vâng, đây ạ." },
      { speaker: 'A', text: "Please wait a moment while I process this.", textVi: "Vui lòng đợi một lát trong khi tôi xử lý." },
      { speaker: 'B', text: "Take your time.", textVi: "Cứ từ từ." }
    ],
    keyVocabulary: [
      {
        term: "account",
        ipa: "/əˈkaʊnt/",
        partOfSpeech: "n.",
        meaningVi: "tài khoản",
        exampleEn: "Open a bank account.",
        exampleVi: "Mở tài khoản ngân hàng.",
        associatedActions: [
          { en: "review credit history for loan", vi: "xem xét lịch sử tín dụng để vay vốn" },
          { en: "link loan payments to account", vi: "liên kết khoản thanh toán vay với tài khoản" },
          { en: "open dedicated escrow account", vi: "mở tài khoản ký quỹ thanh toán" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "deposit",
        ipa: "/dɪˈpɒzɪt/",
        partOfSpeech: "v.",
        meaningVi: "gửi tiền",
        exampleEn: "I want to deposit money.",
        exampleVi: "Tôi muốn gửi tiền.",
        associatedActions: [
          { en: "make initial loan down payment", vi: "nộp khoản tiền trả trước ban đầu" },
          { en: "deposit collateral security funds", vi: "ký quỹ khoản tiền đảm bảo thế chấp" },
          { en: "deposit monthly mortgage payments", vi: "nộp tiền trả góp mua nhà hàng tháng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "withdraw",
        ipa: "/wɪðˈdrɔː/",
        partOfSpeech: "v.",
        meaningVi: "rút tiền",
        exampleEn: "I need to withdraw cash.",
        exampleVi: "Tôi cần rút tiền mặt.",
        associatedActions: [
          { en: "draw down approved loan funds", vi: "giải ngân nguồn vốn vay đã duyệt" },
          { en: "withdraw credit line capital", vi: "rút vốn theo hạn mức tín dụng ngân hàng" },
          { en: "manage loan disbursement cash", vi: "quản lý nguồn tiền mặt được giải ngân" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "balance",
        ipa: "/ˈbæləns/",
        partOfSpeech: "n.",
        meaningVi: "số dư",
        exampleEn: "Check your account balance.",
        exampleVi: "Kiểm tra số dư tài khoản.",
        associatedActions: [
          { en: "check outstanding loan balance", vi: "kiểm tra dư nợ khoản vay còn lại" },
          { en: "pay off principal loan balance", vi: "trả bớt phần dư nợ gốc của khoản vay" },
          { en: "track amortization balance schedule", vi: "theo dõi bảng kế hoạch trả nợ định kỳ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "transaction",
        ipa: "/trænˈzækʃən/",
        partOfSpeech: "n.",
        meaningVi: "giao dịch",
        exampleEn: "A recent transaction.",
        exampleVi: "Một giao dịch gần đây.",
        associatedActions: [
          { en: "set up automated loan payment", vi: "thiết lập giao dịch trích nợ tự động" },
          { en: "verify loan processing fee", vi: "xác nhận phí xử lý hồ sơ vay vốn" },
          { en: "review installment transaction record", vi: "xem lại biên bản giao dịch trả góp" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I want to open an account.", meaningVi: "Tôi muốn mở một tài khoản." },
      { phrase: "What is the exchange rate?", meaningVi: "Tỷ giá hối đoái là bao nhiêu?" },
      { phrase: "I lost my credit card.", meaningVi: "Tôi đã làm mất thẻ tín dụng." },
      { phrase: "Can I withdraw some money?", meaningVi: "Tôi có thể rút một ít tiền không?" },
      { phrase: "Please check my balance.", meaningVi: "Vui lòng kiểm tra số dư của tôi." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Discussing loan options. Respond naturally to the user.",
    tags: ["at-the_bank","daily-life"]
  }
];
