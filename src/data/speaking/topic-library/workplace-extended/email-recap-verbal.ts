/**
 * LingoPro Speaking Topic Library
 * Category: workplace_extended
 * Subcategory: email_recap_verbal
 * File: src/data/speaking/topic-library/workplace-extended/email-recap-verbal.ts
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const EMAIL_RECAP_VERBAL_ITEMS: TopicLibraryItem[] = [
  {
    id: 'work-email-01',
    category: 'workplace_extended',
    subcategory: 'email_recap_verbal',
    level: 'B1',
    titleEn: 'Summarizing an email in person',
    titleVi: 'Tóm tắt email trực tiếp',
    icon: 'mail',
    situationVi: 'Bạn gặp sếp của mình ở hành lang và tóm tắt nhanh nội dung một email dài mà bạn vừa gửi cho họ.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Hey, I just sent you a long email about the marketing campaign.', textVi: 'Chào sếp, tôi vừa gửi cho sếp một email dài về chiến dịch tiếp thị.' },
      { speaker: 'B', textEn: 'I saw it come in, but haven\'t read it yet. What\'s the gist?', textVi: 'Tôi thấy nó vừa tới, nhưng chưa đọc. Ý chính là gì?' },
      { speaker: 'A', textEn: 'Basically, we need an extra $500 for the social media ads.', textVi: 'Cơ bản là, chúng ta cần thêm 500 đô la cho quảng cáo trên mạng xã hội.' },
      { speaker: 'B', textEn: 'Why the increase?', textVi: 'Tại sao lại tăng?' },
      { speaker: 'A', textEn: 'The engagement rates have been high, so we want to capitalize on it.', textVi: 'Tỷ lệ tương tác đang cao, nên chúng ta muốn tận dụng điều đó.' },
      { speaker: 'B', textEn: 'Makes sense. I\'ll review the details and approve it today.', textVi: 'Nghe hợp lý. Tôi sẽ xem xét chi tiết và phê duyệt nó hôm nay.' }
    ],
    keyVocabulary: [
      {
        term: 'campaign',
        ipa: '/kæmˈpeɪn/',
        partOfSpeech: 'noun',
        meaningVi: 'chiến dịch',
        exampleEn: 'The new ad campaign is successful.',
        exampleVi: 'Chiến dịch quảng cáo mới rất thành công.',
        associatedActions: [
          { en: 'launch an ad campaign', vi: 'khởi động chiến dịch quảng cáo' },
          { en: 'track campaign results', vi: 'theo dõi kết quả chiến dịch' },
          { en: 'evaluate campaign performance', vi: 'đánh giá hiệu quả chiến dịch' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'gist',
        ipa: '/dʒɪst/',
        partOfSpeech: 'noun',
        meaningVi: 'ý chính',
        exampleEn: 'What is the gist of the article?',
        exampleVi: 'Ý chính của bài báo là gì?',
        associatedActions: [
          { en: 'grasp the central gist', vi: 'nắm bắt ý chính trọng tâm' },
          { en: 'summarize the gist briefly', vi: 'tóm tắt ngắn gọn ý chính' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'basically',
        ipa: '/ˈbeɪ.sɪ.kəl.i/',
        partOfSpeech: 'adv',
        meaningVi: 'về cơ bản',
        exampleEn: 'Basically, we are out of time.',
        exampleVi: 'Về cơ bản, chúng ta đã hết thời gian.',
        associatedActions: [
          { en: 'explain the basics simply', vi: 'giải thích điều cơ bản một cách đơn giản' },
          { en: 'outline the core points', vi: 'phác thảo những điểm cốt lõi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'engagement',
        ipa: '/ɪnˈɡeɪdʒ.mənt/',
        partOfSpeech: 'noun',
        meaningVi: 'sự tương tác',
        exampleEn: 'User engagement is up 20%.',
        exampleVi: 'Sự tương tác của người dùng tăng 20%.',
        associatedActions: [
          { en: 'boost audience engagement', vi: 'tăng mức độ tương tác của khán giả' },
          { en: 'measure user engagement', vi: 'đo lường sự tương tác của người dùng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'capitalize',
        ipa: '/ˈkæp.ɪ.təl.aɪz/',
        partOfSpeech: 'verb',
        meaningVi: 'tận dụng',
        exampleEn: 'We need to capitalize on this opportunity.',
        exampleVi: 'Chúng ta cần tận dụng cơ hội này.',
        associatedActions: [
          { en: 'capitalize on new opportunities', vi: 'tận dụng những cơ hội mới' },
          { en: 'capitalize on market trends', vi: 'khai thác triệt để xu hướng thị trường' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'I just sent you an email about...', phraseVi: 'Tôi vừa gửi cho bạn một email về...' },
      { phraseEn: 'What\'s the gist of it?', phraseVi: 'Ý chính của nó là gì?' },
      { phraseEn: 'To summarize, we need...', phraseVi: 'Tóm lại, chúng ta cần...' },
      { phraseEn: 'The main point is that...', phraseVi: 'Điểm chính là...' },
      { phraseEn: 'I\'ll look over the details later.', phraseVi: 'Tôi sẽ xem qua các chi tiết sau.' }
    ],
    aiTutorPrompt: 'Roleplay as a manager. The user will summarize a long email they just sent you regarding a project or request. Ask clarifying questions.',
    tags: ['email', 'summary', 'communication']
  },
  {
    id: 'work-email-02',
    category: 'workplace_extended',
    subcategory: 'email_recap_verbal',
    level: 'B1',
    titleEn: 'Following up on an unanswered email',
    titleVi: 'Theo dõi một email chưa được trả lời',
    icon: 'corner-up-right',
    situationVi: 'Bạn gọi điện cho đồng nghiệp để nhắc về một email bạn đã gửi vài ngày trước nhưng chưa nhận được phản hồi.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Hi David, do you have a quick minute?', textVi: 'Chào David, bạn có rảnh một phút không?' },
      { speaker: 'B', textEn: 'Sure, what\'s up?', textVi: 'Chắc chắn rồi, có chuyện gì vậy?' },
      { speaker: 'A', textEn: 'I was just wondering if you had a chance to look at the report I emailed on Tuesday.', textVi: 'Tôi chỉ muốn hỏi xem bạn đã có thời gian xem báo cáo tôi gửi email hôm thứ Ba chưa.' },
      { speaker: 'B', textEn: 'Oh, sorry. It got buried in my inbox. Is it urgent?', textVi: 'Ồ, xin lỗi. Nó bị vùi lấp trong hộp thư đến của tôi. Có gấp không?' },
      { speaker: 'A', textEn: 'We need your feedback before tomorrow\'s meeting.', textVi: 'Chúng tôi cần phản hồi của bạn trước cuộc họp ngày mai.' },
      { speaker: 'B', textEn: 'Got it. I\'ll read it right away and send you my notes.', textVi: 'Hiểu rồi. Tôi sẽ đọc ngay và gửi cho bạn ghi chú của tôi.' }
    ],
    keyVocabulary: [
      {
        term: 'wonder',
        ipa: '/ˈwʌn.dər/',
        partOfSpeech: 'verb',
        meaningVi: 'tự hỏi, muốn biết',
        exampleEn: 'I was wondering if you could help me.',
        exampleVi: 'Tôi muốn biết liệu bạn có thể giúp tôi không.',
        associatedActions: [
          { en: 'wonder about the outcome', vi: 'băn khoăn về kết quả' },
          { en: 'politely express a wonder', vi: 'lịch sự bày tỏ thắc mắc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'buried',
        ipa: '/ˈber.id/',
        partOfSpeech: 'adj',
        meaningVi: 'bị chôn vùi (bị trôi tin)',
        exampleEn: 'The email got buried in my inbox.',
        exampleVi: 'Email đã bị chôn vùi trong hộp thư đến của tôi.',
        associatedActions: [
          { en: 'find buried messages', vi: 'tìm những tin nhắn bị vùi lấp' },
          { en: 'dig through buried emails', vi: 'lục lọi qua các email bị trôi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'inbox',
        ipa: '/ˈɪn.bɒks/',
        partOfSpeech: 'noun',
        meaningVi: 'hộp thư đến',
        exampleEn: 'Check your inbox for the confirmation.',
        exampleVi: 'Kiểm tra hộp thư đến của bạn để nhận xác nhận.',
        associatedActions: [
          { en: 'clear the inbox', vi: 'dọn dẹp hộp thư đến' },
          { en: 'check unread inbox messages', vi: 'kiểm tra thư chưa đọc trong hộp thư' },
          { en: 'organize inbox folders', vi: 'sắp xếp các thư mục trong hộp thư' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'urgent',
        ipa: '/ˈɜː.dʒənt/',
        partOfSpeech: 'adj',
        meaningVi: 'khẩn cấp',
        exampleEn: 'This matter is very urgent.',
        exampleVi: 'Vấn đề này rất khẩn cấp.',
        associatedActions: [
          { en: 'handle urgent requests', vi: 'xử lý các yêu cầu khẩn cấp' },
          { en: 'flag urgent communications', vi: 'đánh dấu các thông điệp khẩn cấp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'feedback',
        ipa: '/ˈfiːd.bæk/',
        partOfSpeech: 'noun',
        meaningVi: 'phản hồi',
        exampleEn: 'I need your feedback on this design.',
        exampleVi: 'Tôi cần phản hồi của bạn về thiết kế này.',
        associatedActions: [
          { en: 'provide constructive feedback', vi: 'đưa ra phản hồi mang tính xây dựng' },
          { en: 'request direct feedback', vi: 'yêu cầu nhận phản hồi trực tiếp' },
          { en: 'incorporate team feedback', vi: 'tiếp thu phản hồi của đội ngũ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Did you have a chance to look at...?', phraseVi: 'Bạn đã có cơ hội xem qua... chưa?' },
      { phraseEn: 'I\'m following up on the email I sent.', phraseVi: 'Tôi đang theo dõi email mà tôi đã gửi.' },
      { phraseEn: 'It must have gotten lost in my inbox.', phraseVi: 'Chắc nó đã bị lạc trong hộp thư đến của tôi.' },
      { phraseEn: 'When do you need a reply by?', phraseVi: 'Khi nào bạn cần câu trả lời?' },
      { phraseEn: 'I\'ll get back to you by the end of the day.', phraseVi: 'Tôi sẽ phản hồi bạn vào cuối ngày.' }
    ],
    aiTutorPrompt: 'Roleplay as a busy colleague. The user is following up on an email you haven\'t answered yet. Apologize and ask for the deadline.',
    tags: ['follow-up', 'email', 'urgent']
  },
  {
    id: 'work-email-03',
    category: 'workplace_extended',
    subcategory: 'email_recap_verbal',
    level: 'B1',
    titleEn: 'Clarifying email instructions verbally',
    titleVi: 'Làm rõ các hướng dẫn trong email bằng lời',
    icon: 'help-circle',
    situationVi: 'Bạn nhận được một email từ sếp với những hướng dẫn không rõ ràng, nên bạn tới bàn làm việc của họ để hỏi lại cho chắc chắn.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Hi, I received your email about the new data entry process.', textVi: 'Chào sếp, tôi đã nhận được email của sếp về quy trình nhập dữ liệu mới.' },
      { speaker: 'B', textEn: 'Yes, do you have any questions?', textVi: 'Vâng, bạn có câu hỏi nào không?' },
      { speaker: 'A', textEn: 'Just one. You mentioned updating the old records, but didn\'t specify which year.', textVi: 'Chỉ một thôi. Sếp có nhắc đến việc cập nhật hồ sơ cũ, nhưng không nói rõ là năm nào.' },
      { speaker: 'B', textEn: 'Ah, right. Please update everything from 2022 onwards.', textVi: 'À, đúng rồi. Vui lòng cập nhật mọi thứ từ năm 2022 trở đi.' },
      { speaker: 'A', textEn: 'Perfect, that clears it up. Thanks!', textVi: 'Tuyệt, vậy là rõ ràng rồi. Cảm ơn sếp!' }
    ],
    keyVocabulary: [
      {
        term: 'process',
        ipa: '/ˈprəʊ.ses/',
        partOfSpeech: 'noun',
        meaningVi: 'quy trình',
        exampleEn: 'We have a new onboarding process.',
        exampleVi: 'Chúng tôi có một quy trình chào đón nhân viên mới.',
        associatedActions: [
          { en: 'streamline the workflow process', vi: 'tinh gọn quy trình làm việc' },
          { en: 'follow standard process', vi: 'tuân theo quy trình chuẩn' },
          { en: 'optimize internal processes', vi: 'tối ưu hóa các quy trình nội bộ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'mention',
        ipa: '/ˈmen.ʃən/',
        partOfSpeech: 'verb',
        meaningVi: 'đề cập',
        exampleEn: 'He mentioned the problem in the meeting.',
        exampleVi: 'Anh ấy đã đề cập đến vấn đề trong cuộc họp.',
        associatedActions: [
          { en: 'mention key project points', vi: 'đề cập các điểm then chốt của dự án' },
          { en: 'briefly mention a concern', vi: 'nêu ngắn gọn một mối quan tâm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'specify',
        ipa: '/ˈspes.ɪ.faɪ/',
        partOfSpeech: 'verb',
        meaningVi: 'chỉ rõ',
        exampleEn: 'Please specify your requirements.',
        exampleVi: 'Vui lòng chỉ rõ các yêu cầu của bạn.',
        associatedActions: [
          { en: 'specify exact requirements', vi: 'nêu rõ các yêu cầu chính xác' },
          { en: 'specify delivery deadlines', vi: 'chỉ định rõ hạn chót giao nhận' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'onwards',
        ipa: '/ˈɒn.wədz/',
        partOfSpeech: 'adv',
        meaningVi: 'trở đi',
        exampleEn: 'From 2020 onwards, sales increased.',
        exampleVi: 'Từ năm 2020 trở đi, doanh số đã tăng.',
        associatedActions: [
          { en: 'continue moving onwards', vi: 'tiếp tục tiến bước về phía trước' },
          { en: 'plan from this date onwards', vi: 'lên kế hoạch từ ngày này trở đi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'clear up',
        ipa: '/klɪər ʌp/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'làm sáng tỏ',
        exampleEn: 'That clears up the confusion.',
        exampleVi: 'Điều đó làm sáng tỏ sự nhầm lẫn.',
        associatedActions: [
          { en: 'clear up misunderstandings', vi: 'làm sáng tỏ những hiểu lầm' },
          { en: 'clear up pending questions', vi: 'giải tỏa các thắc mắc còn tồn đọng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'I received your email about...', phraseVi: 'Tôi đã nhận được email của bạn về...' },
      { phraseEn: 'Could you clarify one thing?', phraseVi: 'Bạn có thể làm rõ một điều không?' },
      { phraseEn: 'You didn\'t specify...', phraseVi: 'Bạn đã không chỉ rõ...' },
      { phraseEn: 'That clears it up.', phraseVi: 'Như vậy là rõ ràng rồi.' },
      { phraseEn: 'Let me know if you need any more details.', phraseVi: 'Hãy cho tôi biết nếu bạn cần thêm bất kỳ chi tiết nào.' }
    ],
    aiTutorPrompt: 'Roleplay as a manager who sent slightly confusing instructions by email. Answer the user\'s clarifying questions directly.',
    tags: ['clarification', 'instructions', 'communication']
  },
  {
    id: 'work-email-04',
    category: 'workplace_extended',
    subcategory: 'email_recap_verbal',
    level: 'B2',
    titleEn: 'Discussing email tone/professionalism',
    titleVi: 'Thảo luận về giọng điệu/sự chuyên nghiệp trong email',
    icon: 'alert-circle',
    situationVi: 'Bạn đang góp ý nhẹ nhàng cho một nhân viên cấp dưới về cách hành văn trong email gửi cho khách hàng sao cho chuyên nghiệp hơn.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'I wanted to chat about the email you sent to the client this morning.', textVi: 'Tôi muốn nói chuyện về email bạn gửi cho khách hàng sáng nay.' },
      { speaker: 'B', textEn: 'Oh, was there a problem with it?', textVi: 'Ồ, có vấn đề gì với nó sao?' },
      { speaker: 'A', textEn: 'The information was correct, but the tone was a bit too casual.', textVi: 'Thông tin thì đúng, nhưng giọng điệu hơi quá suồng sã.' },
      { speaker: 'B', textEn: 'I see. I used some exclamation marks to sound friendly.', textVi: 'Tôi hiểu. Tôi đã dùng vài dấu chấm than để nghe có vẻ thân thiện.' },
      { speaker: 'A', textEn: 'I know, but with corporate clients, it\'s better to stick to formal language.', textVi: 'Tôi biết, nhưng với khách hàng doanh nghiệp, tốt hơn là nên tuân theo ngôn ngữ trang trọng.' },
      { speaker: 'B', textEn: 'Understood. I\'ll keep that in mind for future emails.', textVi: 'Đã hiểu. Tôi sẽ ghi nhớ điều đó cho các email trong tương lai.' }
    ],
    keyVocabulary: [
      {
        term: 'tone',
        ipa: '/təʊn/',
        partOfSpeech: 'noun',
        meaningVi: 'giọng điệu',
        exampleEn: 'The tone of the letter was aggressive.',
        exampleVi: 'Giọng điệu của bức thư khá hung hăng.',
        associatedActions: [
          { en: 'adjust the email tone', vi: 'điều chỉnh giọng điệu email' },
          { en: 'maintain a polite tone', vi: 'duy trì giọng điệu lịch sự' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'casual',
        ipa: '/ˈkæʒ.u.əl/',
        partOfSpeech: 'adj',
        meaningVi: 'suồng sã, bình thường',
        exampleEn: 'Don\'t be too casual with clients.',
        exampleVi: 'Đừng quá suồng sã với khách hàng.',
        associatedActions: [
          { en: 'use casual language', vi: 'sử dụng ngôn ngữ thân mật' },
          { en: 'avoid overly casual phrasing', vi: 'tránh cách diễn đạt quá suồng sã' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'exclamation mark',
        ipa: '/ˌek.skləˈmeɪ.ʃən mɑːk/',
        partOfSpeech: 'noun',
        meaningVi: 'dấu chấm than',
        exampleEn: 'She ends every sentence with an exclamation mark.',
        exampleVi: 'Cô ấy kết thúc mọi câu bằng một dấu chấm than.',
        associatedActions: [
          { en: 'add an exclamation mark', vi: 'thêm dấu chấm than' },
          { en: 'limit exclamation marks in emails', vi: 'hạn chế dấu chấm than trong email' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1584697964190-705b89368d43?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'corporate',
        ipa: '/ˈkɔː.pər.ət/',
        partOfSpeech: 'adj',
        meaningVi: 'thuộc về doanh nghiệp lớn',
        exampleEn: 'He works for a corporate law firm.',
        exampleVi: 'Anh ấy làm việc cho một công ty luật doanh nghiệp.',
        associatedActions: [
          { en: 'adhere to corporate culture', vi: 'tuân theo văn hóa doanh nghiệp' },
          { en: 'communicate with corporate clients', vi: 'giao tiếp với các khách hàng doanh nghiệp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'formal',
        ipa: '/ˈfɔː.məl/',
        partOfSpeech: 'adj',
        meaningVi: 'trang trọng',
        exampleEn: 'Please wear formal attire.',
        exampleVi: 'Vui lòng mặc trang phục trang trọng.',
        associatedActions: [
          { en: 'adopt a formal writing style', vi: 'áp dụng phong cách viết trang trọng' },
          { en: 'use formal business greetings', vi: 'dùng lời chào trang trọng trong công việc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'The tone was a bit too casual.', phraseVi: 'Giọng điệu hơi quá suồng sã.' },
      { phraseEn: 'It\'s better to stick to formal language.', phraseVi: 'Tốt hơn là nên dùng ngôn ngữ trang trọng.' },
      { phraseEn: 'I wanted to give you some feedback on...', phraseVi: 'Tôi muốn góp ý cho bạn một chút về...' },
      { phraseEn: 'I\'ll keep that in mind.', phraseVi: 'Tôi sẽ ghi nhớ điều đó.' },
      { phraseEn: 'It can come across as unprofessional.', phraseVi: 'Nó có thể gây cảm giác thiếu chuyên nghiệp.' }
    ],
    aiTutorPrompt: 'Roleplay as a junior employee receiving feedback. The user is a senior team member advising you to use a more professional tone in emails.',
    tags: ['feedback', 'professionalism', 'tone']
  }
];
