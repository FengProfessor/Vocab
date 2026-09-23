/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: making_appointments
 * File: src/data/speaking/topic-library/daily-situations/making-appointments.ts
 *
 * 5 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const MAKING_APPOINTMENTS_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-appt-01",
    category: 'daily_situations',
    subcategory: 'making_appointments',
    level: "A1",
    titleEn: "Doctor appointment",
    titleVi: "Hẹn khám bác sĩ",
    icon: "🩺",
    situationVi: "Bạn đang trong tình huống: Hẹn khám bác sĩ. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for doctor appointment.", textVi: "Chào, tôi ở đây để hẹn khám bác sĩ." },
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
          { en: "assist patient with intake questionnaire", vi: "hỗ trợ bệnh nhân điền phiếu khám ban đầu" },
          { en: "help elderly relative walk to clinic", vi: "giúp người thân lớn tuổi đi vào phòng khám" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "call clinic appointment booking service", vi: "gọi dịch vụ đặt lịch khám bệnh của phòng khám" },
          { en: "use telehealth video consultation service", vi: "sử dụng dịch vụ tư vấn y tế từ xa qua video" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "explain acute throat symptoms to doctor", vi: "giải thích các triệu chứng đau họng cấp tính với bác sĩ" },
          { en: "resolve health insurance coverage question", vi: "giải quyết thắc mắc về phạm vi chi trả bảo hiểm" }
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
          { en: "check in at hospital reception desk", vi: "làm thủ tục đăng ký tại quầy tiếp đón bệnh viện" },
          { en: "receive medical prescription and follow-up date", vi: "nhận đơn thuốc và lịch hẹn tái khám" }
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
          { en: "check if specialist doctor is available tomorrow", vi: "kiểm tra bác sĩ chuyên khoa có rảnh vào ngày mai không" },
          { en: "choose from available morning consultation slots", vi: "chọn khung giờ khám buổi sáng còn trống" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Doctor appointment. Respond naturally to the user.",
    tags: ["making-appointments","daily-life"]
  },
  {
    id: "daily-appt-02",
    category: 'daily_situations',
    subcategory: 'making_appointments',
    level: "A2",
    titleEn: "Dentist checkup",
    titleVi: "Khám nha khoa định kỳ",
    icon: "🦷",
    situationVi: "Bạn đang trong tình huống: Khám nha khoa định kỳ. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for dentist checkup.", textVi: "Chào, tôi ở đây để khám nha khoa định kỳ." },
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
          { en: "assist dental hygienist with tooth charting", vi: "hỗ trợ điều dưỡng ghi hồ sơ răng hàm" },
          { en: "help rinse mouth with antiseptic mouthwash", vi: "giúp súc miệng bằng dung dịch sát khuẩn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "schedule routine dental cleaning service", vi: "đặt lịch dịch vụ lấy cao răng định kỳ" },
          { en: "inquire about tooth whitening service", vi: "hỏi về dịch vụ tẩy trắng răng thẩm mỹ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "point out throbbing toothache in molar", vi: "chỉ vào chiếc răng hàm đang bị đau nhức nhối" },
          { en: "treat bleeding gums during brushing", vi: "điều trị tình trạng chảy máu chân răng khi đánh răng" }
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
          { en: "take digital panoramic dental X-rays", vi: "chụp phim X-quang răng toàn cảnh kỹ thuật số" },
          { en: "fill cavity with composite resin", vi: "hàn trám lỗ sâu răng bằng vật liệu composite" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check available weekend dentist appointments", vi: "kiểm tra lịch hẹn nha sĩ cuối tuần còn trống" },
          { en: "ask if emergency extraction slot is available", vi: "hỏi còn suất nhổ răng khẩn cấp không" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Dentist checkup. Respond naturally to the user.",
    tags: ["making-appointments","daily-life"]
  },
  {
    id: "daily-appt-03",
    category: 'daily_situations',
    subcategory: 'making_appointments',
    level: "A1",
    titleEn: "Haircut reservation",
    titleVi: "Đặt chỗ cắt tóc",
    icon: "💇",
    situationVi: "Bạn đang trong tình huống: Đặt chỗ cắt tóc. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for haircut reservation.", textVi: "Chào, tôi ở đây để đặt chỗ cắt tóc." },
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
          { en: "assist stylist by showing reference photos", vi: "hỗ trợ thợ làm tóc bằng ảnh mẫu tham khảo" },
          { en: "help drape protective salon cape", vi: "giúp choàng khăn bảo vệ cổ áo" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "book wash, cut, and blow-dry service", vi: "đặt gói dịch vụ gội, cắt và sấy tạo kiểu" },
          { en: "request scalp massage treatment service", vi: "yêu cầu dịch vụ chăm sóc massage da đầu" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "ask stylist to fix uneven bangs", vi: "nhờ thợ chỉnh lại phần tóc mái bị lệch" },
          { en: "clarify desired hair dye tone", vi: "làm rõ tông màu nhuộm tóc mong muốn" }
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
          { en: "shampoo and condition hair thoroughly", vi: "gội đầu và xả tóc thật kỹ" },
          { en: "trim split ends with barber scissors", vi: "tỉa phần đuôi tóc bị chẻ ngọn bằng kéo chuyên dụng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check if senior stylist is available at 3 PM", vi: "kiểm tra thợ chính có rảnh lúc 3 giờ chiều không" },
          { en: "reserve available salon chair online", vi: "đặt trước ghế cắt tóc còn trống qua mạng" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Haircut reservation. Respond naturally to the user.",
    tags: ["making-appointments","daily-life"]
  },
  {
    id: "daily-appt-04",
    category: 'daily_situations',
    subcategory: 'making_appointments',
    level: "A2",
    titleEn: "Rescheduling an appointment",
    titleVi: "Đổi lại lịch hẹn",
    icon: "🔄",
    situationVi: "Bạn đang trong tình huống: Đổi lại lịch hẹn. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for rescheduling an appointment.", textVi: "Chào, tôi ở đây để đổi lại lịch hẹn." },
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
          { en: "assist receptionist in checking updated calendar", vi: "hỗ trợ lễ tân kiểm tra lịch hẹn mới" },
          { en: "provide booking reference code promptly", vi: "cung cấp mã số đặt chỗ nhanh chóng" }
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
          { en: "use online customer rescheduling service", vi: "sử dụng dịch vụ đổi lịch hẹn trực tuyến" },
          { en: "receive calendar notification reminder service", vi: "nhận dịch vụ nhắc lịch hẹn tự động" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "explain unexpected business trip conflict", vi: "giải thích việc bị vướng lịch công tác đột xuất" },
          { en: "avoid late rescheduling penalty fee", vi: "tránh phí phạt vì đổi lịch hẹn quá muộn" }
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
          { en: "move booking to following Tuesday", vi: "chuyển lịch đặt sang thứ Ba tuần sau" },
          { en: "confirm updated SMS appointment reminder", vi: "xác nhận tin nhắn SMS nhắc lịch mới" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "browse available alternative morning slots", vi: "xem qua các khung giờ sáng thay thế còn trống" },
          { en: "confirm consultant is available next week", vi: "xác nhận chuyên viên tư vấn có mặt vào tuần tới" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Rescheduling an appointment. Respond naturally to the user.",
    tags: ["making-appointments","daily-life"]
  },
  {
    id: "daily-appt-05",
    category: 'daily_situations',
    subcategory: 'making_appointments',
    level: "B1",
    titleEn: "Canceling last minute",
    titleVi: "Hủy hẹn vào phút chót",
    icon: "🚫",
    situationVi: "Bạn đang trong tình huống: Hủy hẹn vào phút chót. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for canceling last minute.", textVi: "Chào, tôi ở đây để hủy hẹn vào phút chót." },
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
          { en: "assist staff in updating cancellation list", vi: "hỗ trợ nhân viên cập nhật danh sách hủy hẹn" },
          { en: "notify clinic as early as possible", vi: "báo cho phòng khám càng sớm càng tốt" }
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
          { en: "contact customer cancellation hotline service", vi: "gọi đường dây nóng dịch vụ hủy lịch" },
          { en: "inquire about deposit credit holding service", vi: "hỏi dịch vụ bảo lưu tiền đặt cọc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "apologize for sudden family emergency", vi: "xin lỗi vì việc gia đình đột xuất không báo trước" },
          { en: "resolve cancellation policy fee disputes", vi: "giải quyết tranh chấp về phí hủy theo quy định" }
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
          { en: "release reserved time slot to waitlist", vi: "nhượng lại khung giờ đã đặt cho người chờ" },
          { en: "receive formal cancellation confirmation email", vi: "nhận email xác nhận việc hủy hẹn thành công" }
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
          { en: "offer canceled slot to available patients", vi: "nhường khung giờ vừa hủy cho bệnh nhân đang chờ" },
          { en: "inquire about available future openings", vi: "hỏi về các lịch trống trong thời gian tới" }
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
    aiTutorPrompt: "You are roleplaying a scenario about: Canceling last minute. Respond naturally to the user.",
    tags: ["making-appointments","daily-life"]
  }
];
