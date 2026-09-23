/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: phone_calls
 * File: src/data/speaking/topic-library/daily-situations/phone-calls.ts
 *
 * 6 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const PHONE_CALLS_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-phone-01",
    category: 'daily_situations',
    subcategory: 'phone_calls',
    level: "A2",
    titleEn: "Making a restaurant reservation",
    titleVi: "Đặt bàn nhà hàng",
    icon: "📞",
    situationVi: "Bạn đang trong tình huống: Đặt bàn nhà hàng. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for making a restaurant reservation.", textVi: "Chào, tôi ở đây để đặt bàn nhà hàng." },
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
          { en: "assist with table reservation", vi: "hỗ trợ đặt bàn tiệc" },
          { en: "help seat a party of six", vi: "giúp sắp xếp chỗ ngồi cho nhóm 6 người" },
          { en: "assist with dietary preferences", vi: "hỗ trợ ghi chú yêu cầu ăn kiêng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "enjoy attentive restaurant service", vi: "trải nghiệm dịch vụ chu đáo của nhà hàng" },
          { en: "inquire about private room service", vi: "hỏi về dịch vụ phòng riêng" },
          { en: "request special anniversary service", vi: "yêu cầu dịch vụ đặc biệt cho kỷ niệm" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "resolve booking time conflict issue", vi: "giải quyết sự cố trùng giờ đặt bàn" },
          { en: "clarify reservation cancellation issue", vi: "làm rõ vấn đề hủy bàn trước giờ hẹn" },
          { en: "handle seating availability issue", vi: "xử lý vấn đề thiếu chỗ ngồi" }
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
          { en: "state party size and arrival time", vi: "nêu rõ số lượng khách và giờ đến" },
          { en: "leave customer contact name and number", vi: "để lại tên và số điện thoại liên lạc" },
          { en: "confirm reservation via SMS code", vi: "xác nhận đặt bàn qua mã tin nhắn" }
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
          { en: "check if outdoor tables are available", vi: "kiểm tra xem bàn ngoài trời còn trống không" },
          { en: "book the next available time slot", vi: "đặt khung giờ trống tiếp theo" },
          { en: "confirm high chairs are available", vi: "xác nhận nhà hàng có sẵn ghế cho trẻ em" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Making a restaurant reservation. Respond naturally to the user.",
    tags: ["phone-calls","daily-life"]
  },
  {
    id: "daily-phone-02",
    category: 'daily_situations',
    subcategory: 'phone_calls',
    level: "B1",
    titleEn: "Calling customer service",
    titleVi: "Gọi dịch vụ khách hàng",
    icon: "🎧",
    situationVi: "Bạn đang trong tình huống: Gọi dịch vụ khách hàng. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for calling customer service.", textVi: "Chào, tôi ở đây để gọi dịch vụ khách hàng." },
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
          { en: "ask telephone agent to assist", vi: "nhờ điện thoại viên hỗ trợ" },
          { en: "assist with account verification", vi: "hỗ trợ xác minh tài khoản" },
          { en: "help reset online password", vi: "giúp đặt lại mật khẩu trực tuyến" }
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
          { en: "reach 24/7 client helpline service", vi: "gọi đến dịch vụ đường dây nóng 24/7" },
          { en: "rate phone representative service", vi: "chấm điểm dịch vụ của nhân viên trực tổng đài" },
          { en: "request callback service from agent", vi: "yêu cầu dịch vụ gọi lại từ tổng đài" }
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
          { en: "explain recurring billing error issue", vi: "giải thích sự cố lỗi trừ cước lặp lại" },
          { en: "escalate urgent service interruption issue", vi: "chuyển cấp sự cố gián đoạn dịch vụ khẩn" },
          { en: "resolve technical service issue", vi: "giải quyết sự cố kỹ thuật về dịch vụ" }
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
          { en: "navigate automated voice menu prompts", vi: "thao tác theo menu hướng dẫn bằng giọng nói" },
          { en: "provide government identification number", vi: "cung cấp số căn cước công dân" },
          { en: "record reference ticket number", vi: "ghi lại mã số tiếp nhận khiếu nại" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "wait on hold until agent is available", vi: "chờ máy cho đến khi tổng đài viên rảnh" },
          { en: "check available help channels", vi: "kiểm tra các kênh hỗ trợ sẵn có" },
          { en: "call back when lines are available", vi: "gọi lại khi đường dây bớt bận" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1520923648108-4777659f773f?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Calling customer service. Respond naturally to the user.",
    tags: ["phone-calls","daily-life"]
  },
  {
    id: "daily-phone-03",
    category: 'daily_situations',
    subcategory: 'phone_calls',
    level: "A2",
    titleEn: "Answering an unknown number",
    titleVi: "Trả lời một số lạ",
    icon: "❓",
    situationVi: "Bạn đang trong tình huống: Trả lời một số lạ. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for answering an unknown number.", textVi: "Chào, tôi ở đây để trả lời một số lạ." },
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
          { en: "ask caller politely how to assist", vi: "lịch sự hỏi người gọi cần hỗ trợ gì" },
          { en: "help redirect caller to right department", vi: "giúp chuyển cuộc gọi đến đúng phòng ban" },
          { en: "assist in identifying wrong number", vi: "giúp làm rõ trường hợp nhầm số" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1587560699334-cc4ff634909a?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "decline unwanted telemarketing service", vi: "từ chối dịch vụ chào mời qua điện thoại" },
          { en: "activate spam call blocking service", vi: "kích hoạt dịch vụ chặn cuộc gọi rác" },
          { en: "verify caller company service credentials", vi: "xác minh tư cách đại diện dịch vụ của người gọi" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "screen potential phone scam issues", vi: "sàng lọc nguy cơ lừa đảo qua điện thoại" },
          { en: "clarify misdialed number issue", vi: "làm rõ sự cố quay nhầm số máy" },
          { en: "prevent personal privacy leak issues", vi: "ngăn chặn sự cố lộ thông tin cá nhân" }
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
          { en: "ask caller to introduce identity", vi: "yêu cầu người gọi tự xưng danh tính" },
          { en: "take down caller name and purpose", vi: "ghi lại tên người gọi và mục đích cuộc gọi" },
          { en: "hang up suspicious calls immediately", vi: "dập máy ngay lập tức nếu nghi ngờ lừa đảo" }
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
          { en: "tell caller person is not available", vi: "báo người gọi rằng người cần gặp đang bận" },
          { en: "state times when available to talk", vi: "nêu các khung giờ có thể trò chuyện" },
          { en: "use caller ID when available", vi: "tận dụng tính năng hiện số người gọi nếu có" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Answering an unknown number. Respond naturally to the user.",
    tags: ["phone-calls","daily-life"]
  },
  {
    id: "daily-phone-04",
    category: 'daily_situations',
    subcategory: 'phone_calls',
    level: "A2",
    titleEn: "Leaving a voicemail",
    titleVi: "Để lại tin nhắn thoại",
    icon: "🎙️",
    situationVi: "Bạn đang trong tình huống: Để lại tin nhắn thoại. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for leaving a voicemail.", textVi: "Chào, tôi ở đây để để lại tin nhắn thoại." },
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
          { en: "explain how recipient can assist", vi: "giải thích người nhận có thể giúp gì" },
          { en: "help provide clear contact details", vi: "cung cấp rõ ràng thông tin liên hệ lại" },
          { en: "assist with concise message summary", vi: "tóm tắt ngắn gọn nội dung tin nhắn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "access telephone carrier voicemail service", vi: "truy cập hộp thư thoại của nhà mạng" },
          { en: "set up automated answering service", vi: "thiết lập dịch vụ trả lời tự động" },
          { en: "utilize voice-to-text transcription service", vi: "dùng dịch vụ chuyển tin nhắn thoại thành văn bản" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "summarize urgent family issue", vi: "tóm tắt việc gia đình khẩn cấp" },
          { en: "address missed deadline issue", vi: "đề cập đến vấn đề trễ hạn" },
          { en: "prevent misunderstanding from brief audio", vi: "tránh hiểu lầm từ đoạn ghi âm ngắn" }
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
          { en: "wait for tone after greeting", vi: "chờ tiếng bíp sau lời chào" },
          { en: "speak clearly and spell names", vi: "nói rõ ràng và đánh vần tên riêng" },
          { en: "press pound key to finish recording", vi: "nhấn phím thăng để kết thúc ghi âm" }
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
          { en: "state when caller will be available", vi: "nêu rõ khi nào mình có thể nghe máy" },
          { en: "leave message when inbox space is available", vi: "để lại tin nhắn khi hộp thư thoại còn dung lượng" },
          { en: "provide alternative available phone numbers", vi: "đưa thêm số điện thoại dự phòng có thể liên hệ" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Leaving a voicemail. Respond naturally to the user.",
    tags: ["phone-calls","daily-life"]
  },
  {
    id: "daily-phone-05",
    category: 'daily_situations',
    subcategory: 'phone_calls',
    level: "B1",
    titleEn: "Conference call basics",
    titleVi: "Nhưng điều cơ bản về cuộc gọi hội nghị",
    icon: "👥",
    situationVi: "Bạn đang trong tình huống: Nhưng điều cơ bản về cuộc gọi hội nghị. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for conference call basics.", textVi: "Chào, tôi ở đây để nhưng điều cơ bản về cuộc gọi hội nghị." },
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
          { en: "assist host with participant roll call", vi: "hỗ trợ chủ tọa điểm danh người tham gia" },
          { en: "help co-workers un-mute microphone", vi: "giúp đồng nghiệp bật mic nói chuyện" },
          { en: "assist with meeting minutes recording", vi: "hỗ trợ ghi chép biên bản cuộc họp" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "subscribe to cloud conference calling service", vi: "đăng ký dịch vụ hội nghị trực tuyến trên đám mây" },
          { en: "test high-speed audio conferencing service", vi: "kiểm tra dịch vụ đường truyền âm thanh hội nghị tốc độ cao" },
          { en: "utilize live meeting translation service", vi: "dùng dịch vụ dịch thuật trực tiếp trong cuộc họp" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "fix audio echo feedback issue", vi: "xử lý sự cố tiếng vọng âm thanh" },
          { en: "address choppy internet connection issue", vi: "khắc phục vấn đề mạng chập chờn ngắt quãng" },
          { en: "resolve background barking noise issue", vi: "xử lý tiếng ồn nền chó sủa xung quanh" }
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
          { en: "dial dial-in access code and pin", vi: "nhập mã phòng họp và mật mã cá nhân" },
          { en: "mute mic when not speaking", vi: "tắt mic khi không phát biểu" },
          { en: "share screen to display presentation slides", vi: "chia sẻ màn hình để chiếu trang trình bày" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "confirm all attendees are available", vi: "xác nhận tất cả thành viên đều có mặt" },
          { en: "share meeting recording when available", vi: "chia sẻ video ghi lại cuộc họp khi đã sẵn sàng" },
          { en: "check if virtual whiteboard is available", vi: "kiểm tra bảng trắng tương tác ảo có dùng được không" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Conference call basics. Respond naturally to the user.",
    tags: ["phone-calls","daily-life"]
  },
  {
    id: "daily-phone-06",
    category: 'daily_situations',
    subcategory: 'phone_calls',
    level: "B1",
    titleEn: "Reporting a problem by phone",
    titleVi: "Báo cáo một sự cố qua điện thoại",
    icon: "⚠️",
    situationVi: "Bạn đang trong tình huống: Báo cáo một sự cố qua điện thoại. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for reporting a problem by phone.", textVi: "Chào, tôi ở đây để báo cáo một sự cố qua điện thoại." },
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
          { en: "request technical specialist to assist", vi: "yêu cầu chuyên viên kỹ thuật hỗ trợ" },
          { en: "assist technician in isolating fault", vi: "hỗ trợ kỹ thuật viên cô lập sự cố" },
          { en: "help follow step-by-step triage instructions", vi: "phối hợp làm theo các bước xử lý lỗi" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "demand compensation for service outage", vi: "yêu cầu bồi thường do mất dịch vụ hoàn toàn" },
          { en: "schedule technician home dispatch service", vi: "lên lịch cử thợ đến sửa chữa tại nhà" },
          { en: "switch to backup internet service", vi: "chuyển sang dịch vụ mạng dự phòng" }
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
          { en: "report total internet connectivity blackout", vi: "báo cáo sự cố mất hoàn toàn kết nối mạng" },
          { en: "explain blinking red router light issue", vi: "giải thích sự cố đèn đỏ nhấp nháy trên modem" },
          { en: "track recurring disruption issues", vi: "theo dõi các sự cố gián đoạn lặp đi lặp lại" }
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
          { en: "reboot router and power cycle equipment", vi: "khởi động lại modem và ngắt mở nguồn thiết bị" },
          { en: "verify physical cable connections", vi: "kiểm tra lại các đầu cắm dây cáp vật lý" },
          { en: "obtain dispatch ticket reference number", vi: "nhận mã số hẹn thợ đến kiểm tra" }
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
          { en: "agree on available time window for visit", vi: "thống nhất khung giờ có nhà để thợ ghé" },
          { en: "check if on-call support team is available", vi: "hỏi xem đội hỗ trợ trực ban có trực không" },
          { en: "keep emergency backup phone available", vi: "chuẩn bị sẵn điện thoại dự phòng cho tình huống khẩn" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Reporting a problem by phone. Respond naturally to the user.",
    tags: ["phone-calls","daily-life"]
  }
];
