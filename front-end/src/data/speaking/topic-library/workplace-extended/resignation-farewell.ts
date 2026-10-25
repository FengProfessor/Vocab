/**
 * LingoPro Speaking Topic Library
 * Category: workplace_extended
 * Subcategory: resignation_farewell
 * File: src/data/speaking/topic-library/workplace-extended/resignation-farewell.ts
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const RESIGNATION_FAREWELL_ITEMS: TopicLibraryItem[] = [
  {
    id: 'work-resign-01',
    category: 'workplace_extended',
    subcategory: 'resignation_farewell',
    level: 'B1',
    titleEn: 'Informing your manager',
    titleVi: 'Thông báo cho quản lý',
    icon: 'user-minus',
    situationVi: 'Bạn đã có một buổi họp riêng với sếp để chính thức thông báo việc bạn sẽ nghỉ việc và nộp đơn từ chức.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Do you have a minute? I need to speak with you about something important.', textVi: 'Sếp có rảnh một phút không? Tôi cần nói chuyện với sếp về một việc quan trọng.' },
      { speaker: 'B', textEn: 'Sure, come in and shut the door. What\'s on your mind?', textVi: 'Chắc chắn rồi, vào đi và đóng cửa lại. Bạn đang nghĩ gì vậy?' },
      { speaker: 'A', textEn: 'I\'m handing in my resignation. My last day will be the 15th.', textVi: 'Tôi xin nộp đơn từ chức. Ngày làm việc cuối cùng của tôi sẽ là ngày 15.' },
      { speaker: 'B', textEn: 'Oh, I\'m really sorry to hear that. Have you found another opportunity?', textVi: 'Ồ, tôi thực sự rất tiếc khi nghe điều đó. Bạn đã tìm được cơ hội mới rồi à?' },
      { speaker: 'A', textEn: 'Yes, I\'ve accepted a position closer to my home.', textVi: 'Vâng, tôi đã chấp nhận một vị trí gần nhà hơn.' },
      { speaker: 'B', textEn: 'Well, they are lucky to have you. We\'ll definitely miss you here.', textVi: 'Chà, họ thật may mắn khi có bạn. Chúng tôi chắc chắn sẽ rất nhớ bạn.' }
    ],
    keyVocabulary: [
      {
        term: 'resignation',
        ipa: '/ˌrez.ɪɡˈneɪ.ʃən/',
        partOfSpeech: 'noun',
        meaningVi: 'đơn từ chức, sự từ chức',
        exampleEn: 'She handed in her resignation.',
        exampleVi: 'Cô ấy đã nộp đơn từ chức.',
        associatedActions: [
          { en: 'submit formal notices', vi: 'nộp thông báo nghỉ việc chính thức' },
          { en: 'sign departure letters', vi: 'ký vào thư xin từ chức' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'hand in',
        ipa: '/hænd ɪn/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'nộp, đệ trình',
        exampleEn: 'Please hand in your assignments.',
        exampleVi: 'Vui lòng nộp bài tập của các bạn.',
        associatedActions: [
          { en: 'deliver signed resignation', vi: 'trao thư từ chức đã ký' },
          { en: 'surrender security badges', vi: 'bàn giao lại thẻ an ninh' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'shut',
        ipa: '/ʃʌt/',
        partOfSpeech: 'verb',
        meaningVi: 'đóng (cửa)',
        exampleEn: 'Please shut the door behind you.',
        exampleVi: 'Vui lòng đóng cửa lại khi ra ngoài.',
        associatedActions: [
          { en: 'close office doors', vi: 'khép cửa phòng làm việc' },
          { en: 'maintain privacy', vi: 'giữ không gian riêng tư' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'opportunity',
        ipa: '/ˌɒp.əˈtʃuː.nə.ti/',
        partOfSpeech: 'noun',
        meaningVi: 'cơ hội',
        exampleEn: 'This is a great career opportunity.',
        exampleVi: 'Đây là một cơ hội nghề nghiệp tuyệt vời.',
        associatedActions: [
          { en: 'advance career paths', vi: 'phát triển con đường sự nghiệp' },
          { en: 'accept new offers', vi: 'chấp nhận lời mời làm việc mới' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'position',
        ipa: '/pəˈzɪʃ.ən/',
        partOfSpeech: 'noun',
        meaningVi: 'vị trí (công việc)',
        exampleEn: 'I applied for the manager position.',
        exampleVi: 'Tôi đã ứng tuyển vào vị trí quản lý.',
        associatedActions: [
          { en: 'take on fresh duties', vi: 'đảm nhận nhiệm vụ mới' },
          { en: 'step into new roles', vi: 'bước vào cương vị mới' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'I need to speak with you about something important.', phraseVi: 'Tôi cần nói chuyện với bạn về một điều quan trọng.' },
      { phraseEn: 'I\'m handing in my resignation.', phraseVi: 'Tôi xin nộp đơn từ chức.' },
      { phraseEn: 'My last day will be...', phraseVi: 'Ngày làm việc cuối cùng của tôi sẽ là...' },
      { phraseEn: 'I\'m really sorry to hear that.', phraseVi: 'Tôi thực sự rất tiếc khi nghe điều đó.' },
      { phraseEn: 'We will definitely miss you here.', phraseVi: 'Chúng tôi chắc chắn sẽ rất nhớ bạn ở đây.' }
    ],
    aiTutorPrompt: 'Roleplay as a manager. The user is an employee coming to your office to formally resign. Express polite surprise and wish them well.',
    tags: ['resignation', 'manager', 'quitting']
  },
  {
    id: 'work-resign-02',
    category: 'workplace_extended',
    subcategory: 'resignation_farewell',
    level: 'B1',
    titleEn: 'Farewell speech at a team gathering',
    titleVi: 'Bài phát biểu chia tay tại buổi họp nhóm',
    icon: 'mic',
    situationVi: 'Vào ngày làm việc cuối cùng, nhóm tổ chức một bữa tiệc nhỏ và bạn được yêu cầu nói vài lời chia tay mọi người.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Before we cut the cake, I just want to say a few words.', textVi: 'Trước khi chúng ta cắt bánh, tôi chỉ muốn nói vài lời.' },
      { speaker: 'B', textEn: 'Speech! Speech!', textVi: 'Phát biểu đi! Phát biểu đi!' },
      { speaker: 'A', textEn: 'Thank you all for being such amazing colleagues over the past three years. I\'ve learned so much from everyone here.', textVi: 'Cảm ơn tất cả các bạn vì đã là những đồng nghiệp tuyệt vời trong ba năm qua. Tôi đã học được rất nhiều từ mọi người ở đây.' },
      { speaker: 'B', textEn: 'We\'ll miss you, Mark. Who is going to fix the printer now?', textVi: 'Chúng tôi sẽ nhớ cậu, Mark. Bây giờ ai sẽ sửa máy in đây?' },
      { speaker: 'A', textEn: 'Haha, you\'re on your own now! But seriously, I wish the team continued success in the future.', textVi: 'Haha, giờ các cậu phải tự lo rồi! Nhưng nghiêm túc mà nói, tôi chúc nhóm tiếp tục thành công trong tương lai.' }
    ],
    keyVocabulary: [
      {
        term: 'speech',
        ipa: '/spiːtʃ/',
        partOfSpeech: 'noun',
        meaningVi: 'bài phát biểu',
        exampleEn: 'He gave a moving farewell speech.',
        exampleVi: 'Anh ấy đã có một bài phát biểu chia tay cảm động.',
        associatedActions: [
          { en: 'address gathered colleagues', vi: 'phát biểu trước đồng nghiệp' },
          { en: 'express deep gratitude', vi: 'bày tỏ lòng biết ơn sâu sắc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'amazing',
        ipa: '/əˈmeɪ.zɪŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'tuyệt vời, đáng kinh ngạc',
        exampleEn: 'You are an amazing team.',
        exampleVi: 'Các bạn là một đội tuyệt vời.',
        associatedActions: [
          { en: 'praise exceptional coworkers', vi: 'khen ngợi đồng nghiệp xuất sắc' },
          { en: 'celebrate shared wins', vi: 'ăn mừng các thắng lợi chung' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'colleague',
        ipa: '/ˈkɒl.iːɡ/',
        partOfSpeech: 'noun',
        meaningVi: 'đồng nghiệp',
        exampleEn: 'I went to lunch with a colleague.',
        exampleVi: 'Tôi đã đi ăn trưa với một đồng nghiệp.',
        associatedActions: [
          { en: 'collaborate on projects', vi: 'hợp tác trong các dự án' },
          { en: 'exchange warm wishes', vi: 'trao gửi những lời chúc tốt đẹp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'on your own',
        ipa: '/ɒn jɔːr əʊn/',
        partOfSpeech: 'idiom',
        meaningVi: 'tự lực cánh sinh, một mình',
        exampleEn: 'You have to do it on your own.',
        exampleVi: 'Bạn phải tự mình làm việc đó.',
        associatedActions: [
          { en: 'solve problems independently', vi: 'tự mình giải quyết các vấn đề' },
          { en: 'handle daily tasks', vi: 'tự xử lý công việc hằng ngày' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'continued',
        ipa: '/kənˈtɪn.juːd/',
        partOfSpeech: 'adj',
        meaningVi: 'tiếp tục, không ngừng',
        exampleEn: 'I wish you continued success.',
        exampleVi: 'Tôi chúc bạn không ngừng thành công.',
        associatedActions: [
          { en: 'maintain steady momentum', vi: 'duy trì đà phát triển ổn định' },
          { en: 'achieve ongoing goals', vi: 'đạt được các mục tiêu dài hạn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'I just want to say a few words.', phraseVi: 'Tôi chỉ muốn nói vài lời.' },
      { phraseEn: 'Thank you for being such amazing colleagues.', phraseVi: 'Cảm ơn vì đã là những đồng nghiệp tuyệt vời.' },
      { phraseEn: 'I\'ve learned so much from everyone here.', phraseVi: 'Tôi đã học được rất nhiều từ mọi người ở đây.' },
      { phraseEn: 'We\'ll miss you.', phraseVi: 'Chúng tôi sẽ nhớ bạn.' },
      { phraseEn: 'I wish the team continued success.', phraseVi: 'Tôi chúc nhóm tiếp tục thành công.' }
    ],
    aiTutorPrompt: 'Roleplay as colleagues at a farewell party. The user gives a short speech. Cheer them on and make a lighthearted joke.',
    tags: ['farewell', 'speech', 'party']
  },
  {
    id: 'work-resign-03',
    category: 'workplace_extended',
    subcategory: 'resignation_farewell',
    level: 'B1',
    titleEn: 'Handing over responsibilities',
    titleVi: 'Bàn giao trách nhiệm',
    icon: 'folder-minus',
    situationVi: 'Bạn đang chuyển giao các tài liệu cuối cùng cho người thay thế bạn và dặn dò họ vài lưu ý quan trọng trước khi bạn đi.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Here is the folder with all the current client contracts.', textVi: 'Đây là thư mục chứa tất cả các hợp đồng khách hàng hiện tại.' },
      { speaker: 'B', textEn: 'Got it. Is there anything specific I should know about the Johnson account?', textVi: 'Hiểu rồi. Có điều gì cụ thể tôi nên biết về tài khoản nhà Johnson không?' },
      { speaker: 'A', textEn: 'Yes, Mr. Johnson prefers phone calls over emails. Keep that in mind.', textVi: 'Có, ông Johnson thích gọi điện thoại hơn là gửi email. Hãy nhớ điều đó.' },
      { speaker: 'B', textEn: 'Good to know. And what about the weekly reports?', textVi: 'Thật tốt khi biết điều đó. Còn các báo cáo hàng tuần thì sao?' },
      { speaker: 'A', textEn: 'I have created a template for you. It\'s saved on the desktop.', textVi: 'Tôi đã tạo một biểu mẫu cho bạn. Nó được lưu trên màn hình chính.' }
    ],
    keyVocabulary: [
      {
        term: 'folder',
        ipa: '/ˈfəʊl.dər/',
        partOfSpeech: 'noun',
        meaningVi: 'thư mục, bìa hồ sơ',
        exampleEn: 'Put the documents in this folder.',
        exampleVi: 'Đặt các tài liệu vào thư mục này.',
        associatedActions: [
          { en: 'organize client records', vi: 'sắp xếp hồ sơ khách hàng' },
          { en: 'archive handover files', vi: 'lưu trữ tệp hồ sơ bàn giao' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'specific',
        ipa: '/spəˈsɪf.ɪk/',
        partOfSpeech: 'adj',
        meaningVi: 'cụ thể, đặc biệt',
        exampleEn: 'Is there anything specific you want?',
        exampleVi: 'Bạn có muốn món gì cụ thể không?',
        associatedActions: [
          { en: 'note unique preferences', vi: 'ghi chú các sở thích đặc thù' },
          { en: 'clarify distinct steps', vi: 'làm rõ các bước riêng biệt' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'prefer',
        ipa: '/prɪˈfɜːr/',
        partOfSpeech: 'verb',
        meaningVi: 'thích hơn',
        exampleEn: 'I prefer tea to coffee.',
        exampleVi: 'Tôi thích trà hơn cà phê.',
        associatedActions: [
          { en: 'choose direct calls', vi: 'chọn gọi điện thoại trực tiếp' },
          { en: 'select favorite channels', vi: 'lựa chọn kênh liên lạc yêu thích' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'keep in mind',
        ipa: '/kiːp ɪn maɪnd/',
        partOfSpeech: 'idiom',
        meaningVi: 'ghi nhớ, lưu ý',
        exampleEn: 'Keep in mind that it takes time.',
        exampleVi: 'Hãy nhớ rằng điều đó cần có thời gian.',
        associatedActions: [
          { en: 'remember important caveats', vi: 'ghi nhớ lưu ý quan trọng' },
          { en: 'heed practical advice', vi: 'để tâm đến lời khuyên thực tế' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'template',
        ipa: '/ˈtem.plət/',
        partOfSpeech: 'noun',
        meaningVi: 'biểu mẫu, khuôn mẫu',
        exampleEn: 'Use this template for the report.',
        exampleVi: 'Sử dụng biểu mẫu này cho báo cáo.',
        associatedActions: [
          { en: 'standardize weekly layouts', vi: 'chuẩn hóa bố cục báo cáo tuần' },
          { en: 'fill preset sections', vi: 'điền thông tin vào mẫu sẵn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Here is the folder with...', phraseVi: 'Đây là thư mục chứa...' },
      { phraseEn: 'Is there anything specific I should know?', phraseVi: 'Có điều gì cụ thể tôi nên biết không?' },
      { phraseEn: 'He prefers phone calls over emails.', phraseVi: 'Anh ấy thích gọi điện hơn là gửi email.' },
      { phraseEn: 'Keep that in mind.', phraseVi: 'Hãy nhớ điều đó.' },
      { phraseEn: 'I have created a template for you.', phraseVi: 'Tôi đã tạo một biểu mẫu cho bạn.' }
    ],
    aiTutorPrompt: 'Roleplay as the employee taking over the user\'s job. Ask the user for specific details about handling clients and reports before they leave.',
    tags: ['handover', 'responsibilities', 'leaving']
  },
  {
    id: 'work-resign-04',
    category: 'workplace_extended',
    subcategory: 'resignation_farewell',
    level: 'A2',
    titleEn: 'Staying in touch after leaving',
    titleVi: 'Giữ liên lạc sau khi nghỉ việc',
    icon: 'smartphone',
    situationVi: 'Bạn đang tạm biệt người đồng nghiệp thân thiết nhất và trao đổi thông tin liên lạc cá nhân để hẹn nhau đi ăn sau này.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Well, this is it. I\'m packing up my desk.', textVi: 'Chà, đến lúc rồi. Tôi đang thu dọn bàn làm việc.' },
      { speaker: 'B', textEn: 'I can\'t believe you\'re actually leaving! It won\'t be the same without you.', textVi: 'Tôi không thể tin là bạn thực sự rời đi! Nơi này sẽ không còn giống như trước nếu thiếu bạn.' },
      { speaker: 'A', textEn: 'I know. But we definitely need to stay in touch.', textVi: 'Tôi biết. Nhưng chúng ta nhất định phải giữ liên lạc nhé.' },
      { speaker: 'B', textEn: 'For sure. Do you have my personal number?', textVi: 'Chắc chắn rồi. Bạn có số cá nhân của tôi chưa?' },
      { speaker: 'A', textEn: 'Yes, let\'s grab lunch sometime next month.', textVi: 'Có rồi, tháng tới khi nào rảnh chúng ta đi ăn trưa nhé.' },
      { speaker: 'B', textEn: 'Sounds like a plan. Good luck at the new job!', textVi: 'Nghe hợp lý đấy. Chúc may mắn với công việc mới!' }
    ],
    keyVocabulary: [
      {
        term: 'pack up',
        ipa: '/pæk ʌp/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'thu dọn đồ đạc',
        exampleEn: 'It\'s time to pack up and go home.',
        exampleVi: 'Đã đến lúc thu dọn và về nhà.',
        associatedActions: [
          { en: 'box desk belongings', vi: 'đóng thùng đồ dùng cá nhân' },
          { en: 'clear office cubicles', vi: 'dọn sạch góc làm việc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'actually',
        ipa: '/ˈæk.tʃu.ə.li/',
        partOfSpeech: 'adv',
        meaningVi: 'thực sự',
        exampleEn: 'Are you actually leaving?',
        exampleVi: 'Bạn thực sự rời đi sao?',
        associatedActions: [
          { en: 'confirm real departure', vi: 'xác nhận sự rời đi thực sự' },
          { en: 'realize unexpected changes', vi: 'nhận ra những thay đổi bất ngờ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'personal',
        ipa: '/ˈpɜː.sən.əl/',
        partOfSpeech: 'adj',
        meaningVi: 'cá nhân',
        exampleEn: 'Please don\'t ask personal questions.',
        exampleVi: 'Xin đừng hỏi những câu hỏi cá nhân.',
        associatedActions: [
          { en: 'exchange private numbers', vi: 'trao đổi số điện thoại riêng' },
          { en: 'share social contacts', vi: 'kết nối mạng xã hội cá nhân' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'grab',
        ipa: '/ɡræb/',
        partOfSpeech: 'verb',
        meaningVi: 'đi ăn/uống nhanh',
        exampleEn: 'Let\'s grab a bite to eat.',
        exampleVi: 'Hãy đi ăn một chút gì đó.',
        associatedActions: [
          { en: 'meet for casual lunch', vi: 'gặp nhau ăn trưa thân mật' },
          { en: 'catch up over meals', vi: 'trò chuyện cập nhật bên bữa ăn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'good luck',
        ipa: '/ɡʊd lʌk/',
        partOfSpeech: 'idiom',
        meaningVi: 'chúc may mắn',
        exampleEn: 'Good luck on your exam!',
        exampleVi: 'Chúc bạn may mắn với bài thi!',
        associatedActions: [
          { en: 'wish future success', vi: 'chúc thành công trong tương lai' },
          { en: 'hug parting friends', vi: 'ôm tạm biệt người bạn đồng nghiệp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'I\'m packing up my desk.', phraseVi: 'Tôi đang dọn dẹp bàn làm việc của mình.' },
      { phraseEn: 'It won\'t be the same without you.', phraseVi: 'Sẽ không còn giống như trước khi không có bạn.' },
      { phraseEn: 'We definitely need to stay in touch.', phraseVi: 'Chúng ta chắc chắn phải giữ liên lạc.' },
      { phraseEn: 'Let\'s grab lunch sometime.', phraseVi: 'Khi nào đó hãy cùng đi ăn trưa nhé.' },
      { phraseEn: 'Good luck at the new job!', phraseVi: 'Chúc may mắn ở công việc mới!' }
    ],
    aiTutorPrompt: 'Roleplay as the user\'s close work friend. The user is packing up on their last day. Express sadness and promise to keep in touch.',
    tags: ['goodbye', 'friends', 'stay in touch']
  }
];
