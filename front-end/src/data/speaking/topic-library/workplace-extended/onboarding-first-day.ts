/**
 * LingoPro Speaking Topic Library
 * Category: workplace_extended
 * Subcategory: onboarding_first_day
 * File: src/data/speaking/topic-library/workplace-extended/onboarding-first-day.ts
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const ONBOARDING_FIRST_DAY_ITEMS: TopicLibraryItem[] = [
  {
    id: 'work-onboard-01',
    category: 'workplace_extended',
    subcategory: 'onboarding_first_day',
    level: 'A2',
    titleEn: 'Introducing yourself on Day 1',
    titleVi: 'Giới thiệu bản thân vào Ngày 1',
    icon: 'user-plus',
    situationVi: 'Bạn mới gia nhập công ty và quản lý dẫn bạn đi một vòng để giới thiệu bạn với các thành viên khác trong phòng ban.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Hi, I don\'t think we\'ve met. I\'m Sarah, the new marketing assistant.', textVi: 'Chào bạn, tôi không nghĩ chúng ta đã gặp nhau. Tôi là Sarah, trợ lý marketing mới.' },
      { speaker: 'B', textEn: 'Nice to meet you, Sarah! I\'m John, the graphic designer.', textVi: 'Rất vui được gặp bạn, Sarah! Tôi là John, nhà thiết kế đồ họa.' },
      { speaker: 'A', textEn: 'It\'s great to meet you too. How long have you been working here?', textVi: 'Tôi cũng rất vui được gặp bạn. Bạn đã làm việc ở đây bao lâu rồi?' },
      { speaker: 'B', textEn: 'About three years now. Welcome to the team!', textVi: 'Khoảng ba năm rồi. Chào mừng đến với nhóm!' },
      { speaker: 'A', textEn: 'Thank you! I look forward to working with you.', textVi: 'Cảm ơn bạn! Tôi mong được làm việc với bạn.' }
    ],
    keyVocabulary: [
      {
        term: 'assistant',
        ipa: '/əˈsɪs.tənt/',
        partOfSpeech: 'noun',
        meaningVi: 'trợ lý',
        exampleEn: 'She is the new administrative assistant.',
        exampleVi: 'Cô ấy là trợ lý hành chính mới.',
        associatedActions: [
          { en: 'support manager', vi: 'hỗ trợ người quản lý' },
          { en: 'organize documents', vi: 'sắp xếp tài liệu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'graphic designer',
        ipa: '/ˌɡræf.ɪk dɪˈzaɪ.nər/',
        partOfSpeech: 'noun',
        meaningVi: 'nhà thiết kế đồ họa',
        exampleEn: 'We need a graphic designer for this project.',
        exampleVi: 'Chúng tôi cần một nhà thiết kế đồ họa cho dự án này.',
        associatedActions: [
          { en: 'create visuals', vi: 'tạo ấn phẩm thị giác' },
          { en: 'design layouts', vi: 'thiết kế bố cục' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'look forward to',
        ipa: '/lʊk ˈfɔː.wəd tu/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'mong đợi',
        exampleEn: 'I look forward to hearing from you.',
        exampleVi: 'Tôi mong được nghe tin từ bạn.',
        associatedActions: [
          { en: 'anticipate success', vi: 'kỳ vọng vào thành công' },
          { en: 'await collaboration', vi: 'mong đợi sự hợp tác' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'working',
        ipa: '/ˈwɜː.kɪŋ/',
        partOfSpeech: 'noun/adj',
        meaningVi: 'làm việc',
        exampleEn: 'I enjoy working here.',
        exampleVi: 'Tôi thích làm việc ở đây.',
        associatedActions: [
          { en: 'complete tasks', vi: 'hoàn thành các nhiệm vụ' },
          { en: 'collaborate daily', vi: 'cộng tác hằng ngày' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'team',
        ipa: '/tiːm/',
        partOfSpeech: 'noun',
        meaningVi: 'đội, nhóm',
        exampleEn: 'We have a great team.',
        exampleVi: 'Chúng tôi có một đội ngũ tuyệt vời.',
        associatedActions: [
          { en: 'unite efforts', vi: 'hợp lực làm việc' },
          { en: 'support teammates', vi: 'hỗ trợ đồng đội' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'I don\'t think we\'ve met.', phraseVi: 'Tôi không nghĩ chúng ta đã gặp nhau.' },
      { phraseEn: 'I\'m the new [job title].', phraseVi: 'Tôi là [chức danh] mới.' },
      { phraseEn: 'How long have you been here?', phraseVi: 'Bạn làm ở đây bao lâu rồi?' },
      { phraseEn: 'I look forward to working with you.', phraseVi: 'Tôi mong được làm việc với bạn.' },
      { phraseEn: 'Thanks for the warm welcome.', phraseVi: 'Cảm ơn vì sự chào đón nồng nhiệt.' }
    ],
    aiTutorPrompt: 'Roleplay as an existing employee. The user is a new hire introducing themselves on their first day. Be welcoming and ask a polite question.',
    tags: ['first day', 'introduction', 'new job']
  },
  {
    id: 'work-onboard-02',
    category: 'workplace_extended',
    subcategory: 'onboarding_first_day',
    level: 'A1',
    titleEn: 'Asking where things are',
    titleVi: 'Hỏi chỗ để đồ đạc/khu vực',
    icon: 'map-pin',
    situationVi: 'Đây là ngày đầu tiên của bạn. Bạn không biết phòng vệ sinh, phòng nghỉ hoặc máy in ở đâu nên bạn hỏi một đồng nghiệp.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Excuse me, could you tell me where the break room is?', textVi: 'Xin lỗi, bạn có thể cho tôi biết phòng nghỉ ở đâu không?' },
      { speaker: 'B', textEn: 'Sure, it\'s just down the hall, on the right.', textVi: 'Chắc chắn rồi, nó ở cuối hành lang, bên tay phải.' },
      { speaker: 'A', textEn: 'Thank you! And is there a printer nearby?', textVi: 'Cảm ơn bạn! Và có máy in nào gần đây không?' },
      { speaker: 'B', textEn: 'Yes, the main printer is next to the meeting room.', textVi: 'Có, máy in chính ở cạnh phòng họp.' },
      { speaker: 'A', textEn: 'Got it. Thanks for your help!', textVi: 'Tôi hiểu rồi. Cảm ơn sự giúp đỡ của bạn!' }
    ],
    keyVocabulary: [
      {
        term: 'break room',
        ipa: '/breɪk ruːm/',
        partOfSpeech: 'noun',
        meaningVi: 'phòng nghỉ',
        exampleEn: 'Let\'s eat lunch in the break room.',
        exampleVi: 'Hãy ăn trưa trong phòng nghỉ.',
        associatedActions: [
          { en: 'brew coffee', vi: 'pha cà phê' },
          { en: 'relax briefly', vi: 'nghỉ ngơi thư giãn ngắn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'hall',
        ipa: '/hɔːl/',
        partOfSpeech: 'noun',
        meaningVi: 'hành lang',
        exampleEn: 'Walk down the hall.',
        exampleVi: 'Đi dọc theo hành lang.',
        associatedActions: [
          { en: 'walk along corridors', vi: 'đi dọc hành lang' },
          { en: 'greet colleagues', vi: 'chào hỏi đồng nghiệp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'nearby',
        ipa: '/ˌnɪəˈbaɪ/',
        partOfSpeech: 'adv/adj',
        meaningVi: 'gần đây',
        exampleEn: 'Is there a cafe nearby?',
        exampleVi: 'Có quán cà phê nào gần đây không?',
        associatedActions: [
          { en: 'locate facilities', vi: 'xác định vị trí tiện ích' },
          { en: 'explore surroundings', vi: 'khám phá khu vực xung quanh' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'printer',
        ipa: '/ˈprɪn.tər/',
        partOfSpeech: 'noun',
        meaningVi: 'máy in',
        exampleEn: 'The printer is out of paper.',
        exampleVi: 'Máy in hết giấy rồi.',
        associatedActions: [
          { en: 'print handouts', vi: 'in tài liệu phát tay' },
          { en: 'refill paper trays', vi: 'nạp thêm khay giấy' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'meeting room',
        ipa: '/ˈmiː.tɪŋ ruːm/',
        partOfSpeech: 'noun',
        meaningVi: 'phòng họp',
        exampleEn: 'The meeting room is booked.',
        exampleVi: 'Phòng họp đã được đặt.',
        associatedActions: [
          { en: 'reserve time slots', vi: 'đặt trước khung giờ họp' },
          { en: 'gather participants', vi: 'tập hợp người tham dự' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Could you tell me where... is?', phraseVi: 'Bạn có thể cho tôi biết... ở đâu không?' },
      { phraseEn: 'How do I get to...?', phraseVi: 'Làm sao để đến...?' },
      { phraseEn: 'Is there a ... nearby?', phraseVi: 'Có... nào gần đây không?' },
      { phraseEn: 'It\'s down the hall.', phraseVi: 'Nó ở cuối hành lang.' },
      { phraseEn: 'Thanks for showing me around.', phraseVi: 'Cảm ơn vì đã dẫn tôi đi quanh.' }
    ],
    aiTutorPrompt: 'Roleplay as a helpful coworker. The user is a new employee asking for directions to basic office facilities (printer, restroom, etc.).',
    tags: ['directions', 'office', 'first day']
  },
  {
    id: 'work-onboard-03',
    category: 'workplace_extended',
    subcategory: 'onboarding_first_day',
    level: 'B1',
    titleEn: 'Understanding company policies',
    titleVi: 'Tìm hiểu chính sách công ty',
    icon: 'book-open',
    situationVi: 'Bạn đang thảo luận với bộ phận nhân sự (HR) trong buổi định hướng về một số chính sách của công ty như giờ làm việc và quy định trang phục.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Could you clarify the policy on working hours?', textVi: 'Bạn có thể làm rõ chính sách về giờ làm việc được không?' },
      { speaker: 'B', textEn: 'Sure. Core hours are 10 AM to 4 PM, but you can start anytime between 7 and 10.', textVi: 'Chắc chắn rồi. Giờ làm việc cốt lõi là từ 10 giờ sáng đến 4 giờ chiều, nhưng bạn có thể bắt đầu bất cứ lúc nào từ 7 đến 10 giờ.' },
      { speaker: 'A', textEn: 'That\'s very flexible. What about the dress code?', textVi: 'Rất linh hoạt. Còn về quy định trang phục thì sao?' },
      { speaker: 'B', textEn: 'It\'s business casual on most days, and casual on Fridays.', textVi: 'Hầu hết các ngày là trang phục công sở thoải mái, và thứ Sáu thì được mặc tự do.' },
      { speaker: 'A', textEn: 'Understood. Where can I find the employee handbook?', textVi: 'Tôi hiểu rồi. Tôi có thể tìm sổ tay nhân viên ở đâu?' },
      { speaker: 'B', textEn: 'I will email you the link to the internal portal.', textVi: 'Tôi sẽ gửi email cho bạn liên kết tới cổng thông tin nội bộ.' }
    ],
    keyVocabulary: [
      {
        term: 'clarify',
        ipa: '/ˈklær.ɪ.faɪ/',
        partOfSpeech: 'verb',
        meaningVi: 'làm rõ',
        exampleEn: 'Could you clarify this point?',
        exampleVi: 'Bạn có thể làm rõ điểm này không?',
        associatedActions: [
          { en: 'ask questions', vi: 'đặt câu hỏi thắc mắc' },
          { en: 'explain guidelines', vi: 'giải thích rõ quy định' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'policy',
        ipa: '/ˈpɒl.ə.si/',
        partOfSpeech: 'noun',
        meaningVi: 'chính sách',
        exampleEn: 'Our company has a strict policy on punctuality.',
        exampleVi: 'Công ty chúng tôi có chính sách nghiêm ngặt về sự đúng giờ.',
        associatedActions: [
          { en: 'enforce regulations', vi: 'thực thi các quy định' },
          { en: 'review updates', vi: 'xem lại các cập nhật' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'core',
        ipa: '/kɔːr/',
        partOfSpeech: 'adj',
        meaningVi: 'cốt lõi, chính',
        exampleEn: 'Core hours are mandatory.',
        exampleVi: 'Giờ cốt lõi là bắt buộc.',
        associatedActions: [
          { en: 'establish foundations', vi: 'xây dựng nền tảng' },
          { en: 'align principles', vi: 'thống nhất các nguyên tắc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'dress code',
        ipa: '/ˈdres ˌkəʊd/',
        partOfSpeech: 'noun',
        meaningVi: 'quy định trang phục',
        exampleEn: 'What is the dress code here?',
        exampleVi: 'Quy định trang phục ở đây là gì?',
        associatedActions: [
          { en: 'wear business attire', vi: 'mặc trang phục công sở' },
          { en: 'follow guidelines', vi: 'tuân thủ quy chuẩn ăn mặc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'handbook',
        ipa: '/ˈhænd.bʊk/',
        partOfSpeech: 'noun',
        meaningVi: 'sổ tay',
        exampleEn: 'Please read the employee handbook.',
        exampleVi: 'Vui lòng đọc sổ tay nhân viên.',
        associatedActions: [
          { en: 'read instructions', vi: 'đọc các chỉ dẫn' },
          { en: 'consult company rules', vi: 'tra cứu quy chế công ty' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Could you clarify the policy on...?', phraseVi: 'Bạn có thể làm rõ chính sách về...?' },
      { phraseEn: 'What are the core working hours?', phraseVi: 'Giờ làm việc cốt lõi là gì?' },
      { phraseEn: 'Is there a specific dress code?', phraseVi: 'Có quy định trang phục cụ thể nào không?' },
      { phraseEn: 'How does the leave policy work?', phraseVi: 'Chính sách nghỉ phép hoạt động như thế nào?' },
      { phraseEn: 'I will email you the document.', phraseVi: 'Tôi sẽ gửi email tài liệu cho bạn.' }
    ],
    aiTutorPrompt: 'Roleplay as an HR representative holding an orientation session. The user is a new hire asking questions about company policies.',
    tags: ['HR', 'policy', 'onboarding']
  },
  {
    id: 'work-onboard-04',
    category: 'workplace_extended',
    subcategory: 'onboarding_first_day',
    level: 'A2',
    titleEn: 'Meeting your manager',
    titleVi: 'Gặp gỡ quản lý của bạn',
    icon: 'user-check',
    situationVi: 'Bạn có cuộc họp 1-1 đầu tiên với quản lý trực tiếp vào ngày đầu đi làm để trao đổi về những kỳ vọng ban đầu.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Hi, Mark. Thanks for taking the time to meet with me today.', textVi: 'Chào Mark. Cảm ơn anh đã dành thời gian gặp tôi hôm nay.' },
      { speaker: 'B', textEn: 'Of course! Welcome to the team. How was your morning?', textVi: 'Tất nhiên rồi! Chào mừng đến với nhóm. Buổi sáng của bạn thế nào?' },
      { speaker: 'A', textEn: 'It was great. HR walked me through everything.', textVi: 'Rất tuyệt. Bộ phận nhân sự đã hướng dẫn tôi mọi thứ.' },
      { speaker: 'B', textEn: 'Good. For this first week, focus on completing the training modules.', textVi: 'Tốt. Trong tuần đầu tiên này, hãy tập trung vào việc hoàn thành các học phần đào tạo.' },
      { speaker: 'A', textEn: 'I will. When will I start working on actual projects?', textVi: 'Tôi sẽ làm vậy. Khi nào tôi sẽ bắt đầu làm việc với các dự án thực tế?' },
      { speaker: 'B', textEn: 'Probably by next Monday.', textVi: 'Có lẽ là vào thứ Hai tuần sau.' }
    ],
    keyVocabulary: [
      {
        term: 'manager',
        ipa: '/ˈmæn.ɪ.dʒər/',
        partOfSpeech: 'noun',
        meaningVi: 'quản lý',
        exampleEn: 'My manager is very supportive.',
        exampleVi: 'Quản lý của tôi rất hỗ trợ.',
        associatedActions: [
          { en: 'lead the department', vi: 'lãnh đạo phòng ban' },
          { en: 'guide employees', vi: 'hướng dẫn nhân viên' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'focus on',
        ipa: '/ˈfəʊ.kəs ɒn/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'tập trung vào',
        exampleEn: 'I need to focus on my work.',
        exampleVi: 'Tôi cần tập trung vào công việc của mình.',
        associatedActions: [
          { en: 'prioritize key goals', vi: 'ưu tiên các mục tiêu chính' },
          { en: 'avoid distractions', vi: 'tránh các yếu tố xao nhãng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'training',
        ipa: '/ˈtreɪ.nɪŋ/',
        partOfSpeech: 'noun',
        meaningVi: 'sự đào tạo',
        exampleEn: 'The training takes three days.',
        exampleVi: 'Khóa đào tạo mất ba ngày.',
        associatedActions: [
          { en: 'attend workshops', vi: 'tham dự các buổi đào tạo' },
          { en: 'learn workflows', vi: 'học hỏi quy trình làm việc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'module',
        ipa: '/ˈmɒdʒ.uːl/',
        partOfSpeech: 'noun',
        meaningVi: 'học phần',
        exampleEn: 'Complete module 1 first.',
        exampleVi: 'Hãy hoàn thành học phần 1 trước.',
        associatedActions: [
          { en: 'complete coursework', vi: 'hoàn thành nội dung học phần' },
          { en: 'track milestones', vi: 'theo dõi các mốc tiến độ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'actual',
        ipa: '/ˈæk.tʃu.əl/',
        partOfSpeech: 'adj',
        meaningVi: 'thực tế',
        exampleEn: 'I want to see the actual results.',
        exampleVi: 'Tôi muốn thấy kết quả thực tế.',
        associatedActions: [
          { en: 'assess realism', vi: 'đánh giá tính xác thực' },
          { en: 'compare outcomes', vi: 'so sánh kết quả thực tế' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Thanks for taking the time to meet with me.', phraseVi: 'Cảm ơn vì đã dành thời gian gặp tôi.' },
      { phraseEn: 'What should I focus on this week?', phraseVi: 'Tôi nên tập trung vào điều gì trong tuần này?' },
      { phraseEn: 'I have completed the training.', phraseVi: 'Tôi đã hoàn thành khóa đào tạo.' },
      { phraseEn: 'When will I be assigned my first task?', phraseVi: 'Khi nào tôi sẽ được giao nhiệm vụ đầu tiên?' },
      { phraseEn: 'Let me know if you have any questions.', phraseVi: 'Hãy cho tôi biết nếu bạn có bất kỳ câu hỏi nào.' }
    ],
    aiTutorPrompt: 'Roleplay as a manager having a first 1-on-1 meeting with a new employee (the user). Discuss training and initial expectations.',
    tags: ['manager', 'expectations', '1-on-1']
  },
  {
    id: 'work-onboard-05',
    category: 'workplace_extended',
    subcategory: 'onboarding_first_day',
    level: 'A2',
    titleEn: 'First team lunch',
    titleVi: 'Bữa trưa đầu tiên với nhóm',
    icon: 'coffee',
    situationVi: 'Nhóm mời bạn đi ăn trưa trong ngày làm việc đầu tiên. Đây là cơ hội để tìm hiểu nhau bên ngoài công việc.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'So, how are you finding the city so far?', textVi: 'Vậy, bạn thấy thành phố này thế nào cho đến giờ?' },
      { speaker: 'B', textEn: 'I love it. The food scene here is amazing.', textVi: 'Tôi thích nó. Ẩm thực ở đây thật tuyệt vời.' },
      { speaker: 'A', textEn: 'Definitely! Do you like spicy food?', textVi: 'Chắc chắn rồi! Bạn có thích đồ ăn cay không?' },
      { speaker: 'B', textEn: 'Yes, I do. Do you have any recommendations?', textVi: 'Có chứ. Bạn có gợi ý nào không?' },
      { speaker: 'A', textEn: 'There\'s a great Thai place near the office. We can go there next time.', textVi: 'Có một quán Thái rất ngon gần văn phòng. Lần tới chúng ta có thể đến đó.' }
    ],
    keyVocabulary: [
      {
        term: 'scene',
        ipa: '/siːn/',
        partOfSpeech: 'noun',
        meaningVi: 'bối cảnh (nghĩa bóng: lĩnh vực, hoạt động)',
        exampleEn: 'The music scene here is vibrant.',
        exampleVi: 'Nền âm nhạc ở đây rất sôi động.',
        associatedActions: [
          { en: 'explore local venues', vi: 'khám phá địa điểm địa phương' },
          { en: 'observe social trends', vi: 'quan sát xu hướng xã hội' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'spicy',
        ipa: '/ˈspaɪ.si/',
        partOfSpeech: 'adj',
        meaningVi: 'cay',
        exampleEn: 'I can\'t eat spicy food.',
        exampleVi: 'Tôi không thể ăn đồ ăn cay.',
        associatedActions: [
          { en: 'taste hot dishes', vi: 'thưởng thức món ăn cay nồng' },
          { en: 'season food', vi: 'nêm nếm gia vị cay' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'recommendation',
        ipa: '/ˌrek.ə.menˈdeɪ.ʃən/',
        partOfSpeech: 'noun',
        meaningVi: 'sự gợi ý, đề xuất',
        exampleEn: 'Do you have any recommendations for a good book?',
        exampleVi: 'Bạn có gợi ý cuốn sách nào hay không?',
        associatedActions: [
          { en: 'suggest popular dishes', vi: 'gợi ý các món ăn ngon' },
          { en: 'write reviews', vi: 'viết bài đánh giá đề xuất' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'Thai',
        ipa: '/taɪ/',
        partOfSpeech: 'adj',
        meaningVi: 'thuộc về Thái Lan',
        exampleEn: 'I love Thai curry.',
        exampleVi: 'Tôi thích cà ri Thái.',
        associatedActions: [
          { en: 'enjoy regional cuisine', vi: 'thưởng thức ẩm thực đặc trưng' },
          { en: 'order tom yum', vi: 'gọi món lẩu Thái tom yum' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'office',
        ipa: '/ˈɒf.ɪs/',
        partOfSpeech: 'noun',
        meaningVi: 'văn phòng',
        exampleEn: 'The restaurant is near our office.',
        exampleVi: 'Nhà hàng ở gần văn phòng chúng ta.',
        associatedActions: [
          { en: 'commute to work', vi: 'đi làm tại công sở' },
          { en: 'arrange workstations', vi: 'sắp xếp bàn làm việc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'How are you finding it so far?', phraseVi: 'Cho đến nay bạn cảm thấy thế nào?' },
      { phraseEn: 'Do you have any recommendations?', phraseVi: 'Bạn có gợi ý nào không?' },
      { phraseEn: 'What do you like to do for fun?', phraseVi: 'Bạn thích làm gì để giải trí?' },
      { phraseEn: 'We should definitely go there sometime.', phraseVi: 'Chúng ta chắc chắn nên đến đó vào một dịp nào đó.' },
      { phraseEn: 'The food is really good around here.', phraseVi: 'Đồ ăn quanh đây rất ngon.' }
    ],
    aiTutorPrompt: 'Roleplay as a friendly colleague taking a new team member (user) out for lunch. Chat casually about food, hobbies, or the city.',
    tags: ['lunch', 'team building', 'casual']
  }
];
