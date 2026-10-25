/**
 * LingoPro Speaking Topic Library
 * Category: workplace_extended
 * Subcategory: networking_events
 * File: src/data/speaking/topic-library/workplace-extended/networking-events.ts
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const NETWORKING_EVENTS_ITEMS: TopicLibraryItem[] = [
  {
    id: 'work-net-01',
    category: 'workplace_extended',
    subcategory: 'networking_events',
    level: 'A2',
    titleEn: 'Introducing yourself at a conference',
    titleVi: 'Giới thiệu bản thân tại một hội nghị',
    icon: 'user',
    situationVi: 'Tại một sự kiện giao lưu (networking), bạn tiến đến gần một người tham dự khác trong giờ nghỉ giải lao và bắt chuyện.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Hi, I don\'t think we\'ve met. I\'m Alex.', textVi: 'Chào bạn, tôi không nghĩ chúng ta đã gặp nhau. Tôi là Alex.' },
      { speaker: 'B', textEn: 'Nice to meet you, Alex. I\'m Maria.', textVi: 'Rất vui được gặp bạn, Alex. Tôi là Maria.' },
      { speaker: 'A', textEn: 'Nice to meet you too. Are you enjoying the conference so far?', textVi: 'Tôi cũng rất vui. Cho đến giờ bạn có thích hội nghị này không?' },
      { speaker: 'B', textEn: 'Yes, the keynote speaker was excellent. What company are you with?', textVi: 'Có, diễn giả chính rất xuất sắc. Bạn đang làm ở công ty nào?' },
      { speaker: 'A', textEn: 'I work for TechNova as a data analyst.', textVi: 'Tôi làm việc cho TechNova với tư cách là chuyên viên phân tích dữ liệu.' }
    ],
    keyVocabulary: [
      {
        term: 'conference',
        ipa: '/ˈkɒn.fər.əns/',
        partOfSpeech: 'noun',
        meaningVi: 'hội nghị',
        exampleEn: 'I am attending a medical conference.',
        exampleVi: 'Tôi đang tham dự một hội nghị y khoa.',
        associatedActions: [
          { en: 'register for an industry conference', vi: 'đăng ký tham gia hội nghị ngành' },
          { en: 'network with peers at the conference', vi: 'giao lưu với đồng nghiệp tại hội nghị' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'keynote speaker',
        ipa: '/ˈkiː.nəʊt ˈspiː.kər/',
        partOfSpeech: 'noun phrase',
        meaningVi: 'diễn giả chính',
        exampleEn: 'The keynote speaker is a famous author.',
        exampleVi: 'Diễn giả chính là một tác giả nổi tiếng.',
        associatedActions: [
          { en: 'introduce the keynote speaker', vi: 'giới thiệu diễn giả chính' },
          { en: 'listen attentively to keynote speakers', vi: 'chăm chú lắng nghe các diễn giả chính' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'excellent',
        ipa: '/ˈek.səl.ənt/',
        partOfSpeech: 'adj',
        meaningVi: 'xuất sắc',
        exampleEn: 'That is an excellent idea.',
        exampleVi: 'Đó là một ý tưởng xuất sắc.',
        associatedActions: [
          { en: 'give an excellent presentation', vi: 'trình bày một bài thuyết trình xuất sắc' },
          { en: 'receive excellent feedback from attendees', vi: 'nhận được phản hồi xuất sắc từ người tham dự' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'company',
        ipa: '/ˈkʌm.pə.ni/',
        partOfSpeech: 'noun',
        meaningVi: 'công ty',
        exampleEn: 'Which company do you work for?',
        exampleVi: 'Bạn làm việc cho công ty nào?',
        associatedActions: [
          { en: 'represent the tech company', vi: 'đại diện cho công ty công nghệ' },
          { en: 'expand company client networks', vi: 'mở rộng mạng lưới khách hàng công ty' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'data analyst',
        ipa: '/ˈdeɪ.tə ˈæn.ə.lɪst/',
        partOfSpeech: 'noun phrase',
        meaningVi: 'chuyên viên phân tích dữ liệu',
        exampleEn: 'We need to hire a data analyst.',
        exampleVi: 'Chúng ta cần thuê một chuyên viên phân tích dữ liệu.',
        associatedActions: [
          { en: 'consult with the lead data analyst', vi: 'tham vấn chuyên viên phân tích dữ liệu trưởng' },
          { en: 'present findings as a data analyst', vi: 'trình bày kết quả nghiên cứu với tư cách chuyên viên phân tích' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'I don\'t think we\'ve met.', phraseVi: 'Tôi không nghĩ chúng ta đã gặp nhau.' },
      { phraseEn: 'Are you enjoying the conference?', phraseVi: 'Bạn có thích hội nghị này không?' },
      { phraseEn: 'What company are you with?', phraseVi: 'Bạn đến từ công ty nào?' },
      { phraseEn: 'I work for...', phraseVi: 'Tôi làm việc cho...' },
      { phraseEn: 'What do you do there?', phraseVi: 'Bạn làm gì ở đó?' }
    ],
    aiTutorPrompt: 'Roleplay as an attendee at a business conference. The user will approach you to introduce themselves. Be polite and ask about their background.',
    tags: ['networking', 'introduction', 'conference']
  },
  {
    id: 'work-net-02',
    category: 'workplace_extended',
    subcategory: 'networking_events',
    level: 'A2',
    titleEn: 'Exchanging business cards',
    titleVi: 'Trao đổi danh thiếp',
    icon: 'credit-card',
    situationVi: 'Cuộc trò chuyện sắp kết thúc, bạn muốn trao đổi phương thức liên lạc với đối tác bằng cách trao danh thiếp.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'It was really nice talking to you, Maria.', textVi: 'Thật sự rất vui khi được nói chuyện với bạn, Maria.' },
      { speaker: 'B', textEn: 'Likewise, Alex. I think our companies could collaborate in the future.', textVi: 'Tôi cũng vậy, Alex. Tôi nghĩ các công ty của chúng ta có thể hợp tác trong tương lai.' },
      { speaker: 'A', textEn: 'I agree. Do you have a business card?', textVi: 'Tôi đồng ý. Bạn có danh thiếp không?' },
      { speaker: 'B', textEn: 'Yes, here you go. And here is my direct line.', textVi: 'Có, của bạn đây. Và đây là đường dây trực tiếp của tôi.' },
      { speaker: 'A', textEn: 'Thanks. Here\'s mine. Let\'s stay in touch!', textVi: 'Cảm ơn. Đây là của tôi. Hãy giữ liên lạc nhé!' }
    ],
    keyVocabulary: [
      {
        term: 'likewise',
        ipa: '/ˈlaɪk.waɪz/',
        partOfSpeech: 'adv',
        meaningVi: 'cũng vậy (đáp lại lời khen/chào)',
        exampleEn: 'Nice to meet you. - Likewise.',
        exampleVi: 'Rất vui được gặp bạn. - Tôi cũng vậy.',
        associatedActions: [
          { en: 'respond politely with likewise', vi: 'lịch sự đáp lại bằng lời tương tự' },
          { en: 'acknowledge greetings with likewise', vi: 'đáp lại lời chào bằng cách tương tự' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'collaborate',
        ipa: '/kəˈlæb.ə.reɪt/',
        partOfSpeech: 'verb',
        meaningVi: 'hợp tác',
        exampleEn: 'We should collaborate on this project.',
        exampleVi: 'Chúng ta nên hợp tác trong dự án này.',
        associatedActions: [
          { en: 'collaborate on cross-industry ventures', vi: 'hợp tác trong các dự án liên ngành' },
          { en: 'agree to collaborate on future projects', vi: 'đồng ý hợp tác trong các dự án tương lai' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'business card',
        ipa: '/ˈbɪz.nɪs kɑːd/',
        partOfSpeech: 'noun phrase',
        meaningVi: 'danh thiếp',
        exampleEn: 'Can I give you my business card?',
        exampleVi: 'Tôi có thể đưa bạn danh thiếp của tôi không?',
        associatedActions: [
          { en: 'hand over a sleek business card', vi: 'trao một tấm danh thiếp trang nhã' },
          { en: 'collect business cards at booths', vi: 'thu thập danh thiếp tại các gian hàng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'direct line',
        ipa: '/daɪˈrekt laɪn/',
        partOfSpeech: 'noun phrase',
        meaningVi: 'đường dây điện thoại trực tiếp',
        exampleEn: 'Call me on my direct line.',
        exampleVi: 'Hãy gọi cho tôi theo đường dây trực tiếp.',
        associatedActions: [
          { en: 'provide an office direct line', vi: 'cung cấp số điện thoại trực tiếp văn phòng' },
          { en: 'reach contacts via direct line', vi: 'liên hệ với đối tác qua đường dây trực tiếp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1520923642038-b4259aceffd7?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'stay in touch',
        ipa: '/steɪ ɪn tʌtʃ/',
        partOfSpeech: 'idiom',
        meaningVi: 'giữ liên lạc',
        exampleEn: 'Let\'s stay in touch after graduation.',
        exampleVi: 'Hãy giữ liên lạc sau khi tốt nghiệp nhé.',
        associatedActions: [
          { en: 'stay in touch via email', vi: 'giữ liên lạc qua thư điện tử' },
          { en: 'vow to stay in touch after conferences', vi: 'cam kết giữ liên lạc sau hội nghị' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'It was really nice talking to you.', phraseVi: 'Thật sự rất vui khi được nói chuyện với bạn.' },
      { phraseEn: 'Likewise.', phraseVi: 'Tôi cũng vậy.' },
      { phraseEn: 'Do you have a business card?', phraseVi: 'Bạn có danh thiếp không?' },
      { phraseEn: 'Here you go.', phraseVi: 'Của bạn đây.' },
      { phraseEn: 'Let\'s stay in touch.', phraseVi: 'Hãy giữ liên lạc nhé.' }
    ],
    aiTutorPrompt: 'Roleplay as a new professional connection wrapping up a conversation. The user will ask for your business card. Give it and take theirs.',
    tags: ['business cards', 'networking', 'goodbye']
  },
  {
    id: 'work-net-03',
    category: 'workplace_extended',
    subcategory: 'networking_events',
    level: 'B1',
    titleEn: 'Pitching your company briefly',
    titleVi: 'Giới thiệu ngắn gọn về công ty của bạn',
    icon: 'briefcase',
    situationVi: 'Tại một sự kiện kết nối, ai đó hỏi công ty của bạn làm gì. Bạn đưa ra một "elevator pitch" (bài thuyết trình ngắn) khoảng 30 giây.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'So, what exactly does your company do?', textVi: 'Vậy, công ty của bạn chính xác là làm về cái gì?' },
      { speaker: 'B', textEn: 'We provide cloud-based accounting software for small businesses.', textVi: 'Chúng tôi cung cấp phần mềm kế toán dựa trên đám mây cho các doanh nghiệp nhỏ.' },
      { speaker: 'A', textEn: 'Oh, interesting. Is it similar to QuickBooks?', textVi: 'Ồ, thú vị đấy. Nó có giống QuickBooks không?' },
      { speaker: 'B', textEn: 'Yes, but our focus is on making it extremely user-friendly for non-accountants.', textVi: 'Có, nhưng trọng tâm của chúng tôi là làm cho nó cực kỳ dễ sử dụng đối với những người không phải kế toán.' },
      { speaker: 'A', textEn: 'That sounds like a great niche. I know many freelancers who struggle with that.', textVi: 'Nghe có vẻ là một thị trường ngách tuyệt vời. Tôi biết nhiều người làm việc tự do cũng đang chật vật với điều đó.' }
    ],
    keyVocabulary: [
      {
        term: 'cloud-based',
        ipa: '/klaʊd beɪst/',
        partOfSpeech: 'adj',
        meaningVi: 'dựa trên điện toán đám mây',
        exampleEn: 'We use a cloud-based storage system.',
        exampleVi: 'Chúng tôi sử dụng hệ thống lưu trữ đám mây.',
        associatedActions: [
          { en: 'deploy cloud-based solutions', vi: 'triển khai các giải pháp trên đám mây' },
          { en: 'migrate to cloud-based architecture', vi: 'chuyển đổi sang kiến trúc đám mây' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'accounting',
        ipa: '/əˈkaʊn.tɪŋ/',
        partOfSpeech: 'noun',
        meaningVi: 'ngành kế toán',
        exampleEn: 'He works in the accounting department.',
        exampleVi: 'Anh ấy làm việc ở phòng kế toán.',
        associatedActions: [
          { en: 'manage corporate accounting books', vi: 'quản lý sổ sách kế toán doanh nghiệp' },
          { en: 'simplify accounting procedures', vi: 'đơn giản hóa các thủ tục kế toán' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'focus',
        ipa: '/ˈfəʊ.kəs/',
        partOfSpeech: 'noun',
        meaningVi: 'trọng tâm',
        exampleEn: 'Our main focus is quality.',
        exampleVi: 'Trọng tâm chính của chúng tôi là chất lượng.',
        associatedActions: [
          { en: 'maintain strategic business focus', vi: 'duy trì trọng tâm kinh doanh chiến lược' },
          { en: 'shift focus to product innovation', vi: 'chuyển trọng tâm sang đổi mới sản phẩm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'user-friendly',
        ipa: '/ˌjuː.zəˈfrend.li/',
        partOfSpeech: 'adj',
        meaningVi: 'thân thiện với người dùng',
        exampleEn: 'The new app is very user-friendly.',
        exampleVi: 'Ứng dụng mới rất thân thiện với người dùng.',
        associatedActions: [
          { en: 'design user-friendly dashboards', vi: 'thiết kế bảng điều khiển thân thiện với người dùng' },
          { en: 'test user-friendly workflows', vi: 'thử nghiệm quy trình làm việc thân thiện' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'niche',
        ipa: '/niːʃ/',
        partOfSpeech: 'noun',
        meaningVi: 'thị trường ngách',
        exampleEn: 'They found a profitable niche.',
        exampleVi: 'Họ đã tìm thấy một thị trường ngách sinh lời.',
        associatedActions: [
          { en: 'dominate a specialized niche market', vi: 'thống lĩnh một thị trường ngách chuyên biệt' },
          { en: 'identify an emerging niche sector', vi: 'nhận diện một phân khúc ngách mới nổi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'What exactly does your company do?', phraseVi: 'Chính xác thì công ty bạn làm gì?' },
      { phraseEn: 'We provide...', phraseVi: 'Chúng tôi cung cấp...' },
      { phraseEn: 'Is it similar to...?', phraseVi: 'Nó có giống với... không?' },
      { phraseEn: 'Our focus is on...', phraseVi: 'Trọng tâm của chúng tôi là...' },
      { phraseEn: 'That sounds like a great niche.', phraseVi: 'Nghe có vẻ là một thị trường ngách tuyệt vời.' }
    ],
    aiTutorPrompt: 'Roleplay as an interested professional at an event. Ask the user what their company does and ask follow-up questions about their product or service.',
    tags: ['pitch', 'company', 'networking']
  },
  {
    id: 'work-net-04',
    category: 'workplace_extended',
    subcategory: 'networking_events',
    level: 'B1',
    titleEn: 'Following up after an event',
    titleVi: 'Theo dõi/Liên hệ sau sự kiện',
    icon: 'mail',
    situationVi: 'Bạn gọi điện thoại ngắn gọn (hoặc để lại tin nhắn thoại) cho một người bạn đã gặp tại sự kiện hôm trước để sắp xếp một buổi hẹn.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Hi Maria, this is Alex from TechNova. We met at the summit yesterday.', textVi: 'Chào Maria, tôi là Alex từ TechNova. Chúng ta đã gặp nhau ở hội nghị thượng đỉnh hôm qua.' },
      { speaker: 'B', textEn: 'Hi Alex! Yes, I remember. Thanks for reaching out.', textVi: 'Chào Alex! Vâng, tôi nhớ rồi. Cảm ơn bạn đã liên hệ.' },
      { speaker: 'A', textEn: 'I was thinking about what you said regarding data security.', textVi: 'Tôi đã suy nghĩ về những gì bạn nói liên quan đến bảo mật dữ liệu.' },
      { speaker: 'B', textEn: 'Oh, did you have some ideas on that?', textVi: 'Ồ, bạn có ý tưởng gì về việc đó à?' },
      { speaker: 'A', textEn: 'Yes, I think there is a synergy between our services. Would you have time for a quick coffee next week?', textVi: 'Có, tôi nghĩ có một sự cộng hưởng giữa các dịch vụ của chúng ta. Bạn có thời gian đi uống cà phê nhanh vào tuần tới không?' },
      { speaker: 'B', textEn: 'I\'d love to. Let me check my calendar and I\'ll email you.', textVi: 'Tôi rất sẵn lòng. Để tôi kiểm tra lịch rồi sẽ gửi email cho bạn.' }
    ],
    keyVocabulary: [
      {
        term: 'summit',
        ipa: '/ˈsʌm.ɪt/',
        partOfSpeech: 'noun',
        meaningVi: 'hội nghị thượng đỉnh',
        exampleEn: 'They attended the global summit.',
        exampleVi: 'Họ đã tham dự hội nghị thượng đỉnh toàn cầu.',
        associatedActions: [
          { en: 'attend the annual leadership summit', vi: 'tham dự hội nghị thượng đỉnh lãnh đạo thường niên' },
          { en: 'deliver keynote remarks at the summit', vi: 'phát biểu quan điểm chủ đạo tại hội nghị thượng đỉnh' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'reach out',
        ipa: '/riːtʃ aʊt/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'liên hệ',
        exampleEn: 'Feel free to reach out if you need help.',
        exampleVi: 'Đừng ngại liên hệ nếu bạn cần giúp đỡ.',
        associatedActions: [
          { en: 'reach out to prospective clients', vi: 'chủ động liên hệ với các khách hàng tiềm năng' },
          { en: 'reach out promptly following events', vi: 'nhanh chóng liên hệ lại sau sự kiện' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'regarding',
        ipa: '/rɪˈɡɑː.dɪŋ/',
        partOfSpeech: 'prep',
        meaningVi: 'liên quan đến',
        exampleEn: 'I am writing regarding your application.',
        exampleVi: 'Tôi viết thư liên quan đến đơn xin việc của bạn.',
        associatedActions: [
          { en: 'inquire regarding partnership terms', vi: 'hỏi thăm về các điều khoản hợp tác' },
          { en: 'send notes regarding joint projects', vi: 'gửi ghi chú liên quan đến các dự án chung' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'synergy',
        ipa: '/ˈsɪn.ə.dʒi/',
        partOfSpeech: 'noun',
        meaningVi: 'sự cộng hưởng, sức mạnh tổng hợp',
        exampleEn: 'There is a strong synergy between the two teams.',
        exampleVi: 'Có một sự cộng hưởng mạnh mẽ giữa hai đội.',
        associatedActions: [
          { en: 'create cross-team operational synergy', vi: 'tạo ra sự cộng hưởng vận hành giữa các đội ngũ' },
          { en: 'maximize strategic project synergy', vi: 'tối đa hóa sức mạnh tổng hợp của dự án chiến lược' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'calendar',
        ipa: '/ˈkæl.ən.dər/',
        partOfSpeech: 'noun',
        meaningVi: 'lịch',
        exampleEn: 'Let me check my calendar.',
        exampleVi: 'Để tôi kiểm tra lịch của mình.',
        associatedActions: [
          { en: 'block time on the calendar', vi: 'khóa lịch trình trên ứng dụng lịch' },
          { en: 'check shared team calendars', vi: 'kiểm tra lịch làm việc chung của nhóm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'This is [Name] from [Company].', phraseVi: 'Tôi là [Tên] từ [Công ty].' },
      { phraseEn: 'We met at the summit yesterday.', phraseVi: 'Chúng ta đã gặp nhau tại hội nghị hôm qua.' },
      { phraseEn: 'Thanks for reaching out.', phraseVi: 'Cảm ơn vì đã liên hệ.' },
      { phraseEn: 'Would you have time for a quick coffee?', phraseVi: 'Bạn có thời gian đi uống cà phê nhanh không?' },
      { phraseEn: 'Let me check my calendar.', phraseVi: 'Để tôi kiểm tra lịch của mình.' }
    ],
    aiTutorPrompt: 'Roleplay as a business contact the user met yesterday. The user calls to follow up and set up a meeting. Respond positively and agree on a next step.',
    tags: ['follow-up', 'meeting', 'networking']
  },
  {
    id: 'work-net-05',
    category: 'workplace_extended',
    subcategory: 'networking_events',
    level: 'B1',
    titleEn: 'Connecting on LinkedIn',
    titleVi: 'Kết nối trên LinkedIn',
    icon: 'link',
    situationVi: 'Bạn đang trò chuyện với một diễn giả tại hội nghị và xin phép được kết nối với họ trên nền tảng mạng xã hội nghề nghiệp (LinkedIn).',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Your presentation on AI was really insightful. I learned a lot.', textVi: 'Bài thuyết trình của bạn về AI thực sự rất sâu sắc. Tôi đã học được rất nhiều.' },
      { speaker: 'B', textEn: 'Thank you! I\'m glad you found it useful.', textVi: 'Cảm ơn bạn! Tôi rất vui vì bạn thấy nó hữu ích.' },
      { speaker: 'A', textEn: 'Are you active on LinkedIn? I\'d love to connect and follow your work.', textVi: 'Bạn có hoạt động trên LinkedIn không? Tôi rất muốn kết nối và theo dõi công việc của bạn.' },
      { speaker: 'B', textEn: 'Yes, absolutely. You can just search for my name.', textVi: 'Có, tất nhiên rồi. Bạn chỉ cần tìm kiếm tên tôi.' },
      { speaker: 'A', textEn: 'Great, I will send you a connection request right now.', textVi: 'Tuyệt, tôi sẽ gửi cho bạn một yêu cầu kết nối ngay bây giờ.' }
    ],
    keyVocabulary: [
      {
        term: 'insightful',
        ipa: '/ˈɪn.saɪt.fəl/',
        partOfSpeech: 'adj',
        meaningVi: 'sâu sắc, có nhiều thông tin chi tiết',
        exampleEn: 'Her comments were very insightful.',
        exampleVi: 'Những nhận xét của cô ấy rất sâu sắc.',
        associatedActions: [
          { en: 'share insightful industry perspectives', vi: 'chia sẻ góc nhìn chuyên ngành sâu sắc' },
          { en: 'read insightful market analysis', vi: 'đọc bài phân tích thị trường sâu sắc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'active',
        ipa: '/ˈæk.tɪv/',
        partOfSpeech: 'adj',
        meaningVi: 'tích cực hoạt động',
        exampleEn: 'She is very active on social media.',
        exampleVi: 'Cô ấy hoạt động rất tích cực trên mạng xã hội.',
        associatedActions: [
          { en: 'remain active on professional networks', vi: 'tiếp tục duy trì hoạt động trên các mạng lưới nghề nghiệp' },
          { en: 'build active online communities', vi: 'xây dựng các cộng đồng mạng sôi nổi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'connect',
        ipa: '/kəˈnekt/',
        partOfSpeech: 'verb',
        meaningVi: 'kết nối',
        exampleEn: 'We should connect on LinkedIn.',
        exampleVi: 'Chúng ta nên kết nối trên LinkedIn.',
        associatedActions: [
          { en: 'connect with industry leaders', vi: 'kết nối với các chuyên gia đầu ngành' },
          { en: 'connect over mutual interests', vi: 'kết nối dựa trên những sở thích chung' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'request',
        ipa: '/rɪˈkwest/',
        partOfSpeech: 'noun',
        meaningVi: 'yêu cầu',
        exampleEn: 'I accepted his friend request.',
        exampleVi: 'Tôi đã chấp nhận yêu cầu kết bạn của anh ấy.',
        associatedActions: [
          { en: 'send an official connection request', vi: 'gửi lời mời kết nối chính thức' },
          { en: 'accept incoming networking requests', vi: 'chấp nhận các yêu cầu giao lưu gửi tới' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'search',
        ipa: '/sɜːtʃ/',
        partOfSpeech: 'verb',
        meaningVi: 'tìm kiếm',
        exampleEn: 'Search for my name online.',
        exampleVi: 'Hãy tìm kiếm tên tôi trên mạng.',
        associatedActions: [
          { en: 'search for executive profiles', vi: 'tìm kiếm hồ sơ lãnh đạo cấp cao' },
          { en: 'search contacts by domain expertise', vi: 'tìm kiếm liên hệ theo chuyên môn lĩnh vực' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Your presentation was really insightful.', phraseVi: 'Bài thuyết trình của bạn thực sự sâu sắc.' },
      { phraseEn: 'I\'m glad you found it useful.', phraseVi: 'Tôi rất vui vì bạn thấy nó hữu ích.' },
      { phraseEn: 'Are you active on LinkedIn?', phraseVi: 'Bạn có dùng LinkedIn thường xuyên không?' },
      { phraseEn: 'I\'d love to connect.', phraseVi: 'Tôi rất muốn kết nối.' },
      { phraseEn: 'I will send you a connection request.', phraseVi: 'Tôi sẽ gửi cho bạn một yêu cầu kết nối.' }
    ],
    aiTutorPrompt: 'Roleplay as a conference speaker. The user comes up to praise your speech and asks to connect on LinkedIn. Graciously accept.',
    tags: ['LinkedIn', 'connection', 'social media']
  }
];
