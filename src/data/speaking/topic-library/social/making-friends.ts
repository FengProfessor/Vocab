/**
 * LingoPro Speaking Topic Library
 * Category: Social
 * Subcategory: Making Friends
 * File: src/data/speaking/topic-library/social/making-friends.ts
 *
 * 6 sub-topics covering starting conversations, introducing oneself, and making plans.
 * CEFR Range: A1 - B1
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const MAKING_FRIENDS_ITEMS: TopicLibraryItem[] = [
  {
    id: 'soc-friend-01',
    category: 'social',
    subcategory: 'making-friends',
    level: 'A2',
    titleEn: 'Starting a conversation at a party',
    titleVi: 'Bắt chuyện tại một bữa tiệc',
    icon: 'PartyPopper',
    situationVi: 'Bạn đang ở một bữa tiệc và không quen biết nhiều người. Bạn quyết định tiến lại gần một người cũng đang đứng một mình để bắt chuyện.',
    sampleDialogue: [
      { speaker: 'A', text: 'Hi! I do not think we have met. I am Alex.', translationVi: 'Chào bạn! Mình không nghĩ là chúng ta đã gặp nhau. Mình là Alex.' },
      { speaker: 'B', text: 'Hi Alex, I am Sam. Nice to meet you.', translationVi: 'Chào Alex, mình là Sam. Rất vui được gặp bạn.' },
      { speaker: 'A', text: 'Nice to meet you too. So, how do you know the host?', translationVi: 'Mình cũng rất vui được gặp bạn. Thế bạn biết chủ tiệc bằng cách nào vậy?' },
      { speaker: 'B', text: 'We work together. How about you?', translationVi: 'Bọn mình làm việc cùng nhau. Còn bạn thì sao?' },
      { speaker: 'A', text: 'Oh, we went to college together. It is a great party, isn\'t it?', translationVi: 'Ồ, bọn mình học đại học cùng nhau. Một bữa tiệc tuyệt vời nhỉ?' },
      { speaker: 'B', text: 'Yes, it is! The food is amazing.', translationVi: 'Đúng vậy! Đồ ăn rất tuyệt.' }
    ],
    keyVocabulary: [
      {
        term: 'host',
        ipa: '/hoʊst/',
        partOfSpeech: 'noun',
        meaningVi: 'chủ nhà, người tổ chức tiệc',
        exampleEn: 'Our host provided a lot of food.',
        exampleVi: 'Chủ tiệc của chúng tôi đã chuẩn bị rất nhiều đồ ăn.',
        associatedActions: [
          { en: 'greet the party host', vi: 'chào hỏi chủ bữa tiệc' },
          { en: 'thank the host for having us', vi: 'cảm ơn chủ nhà đã tiếp đãi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'introduce',
        ipa: '/ˌɪntrəˈduːs/',
        partOfSpeech: 'verb',
        meaningVi: 'giới thiệu',
        exampleEn: 'Let me introduce myself.',
        exampleVi: 'Để tôi tự giới thiệu.',
        associatedActions: [
          { en: 'introduce oneself politely', vi: 'tự giới thiệu bản thân lịch thiệp' },
          { en: 'introduce a new friend to the group', vi: 'giới thiệu bạn mới với cả nhóm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'colleague',
        ipa: '/ˈkɑːliːɡ/',
        partOfSpeech: 'noun',
        meaningVi: 'đồng nghiệp',
        exampleEn: 'She is a former colleague of mine.',
        exampleVi: 'Cô ấy là một đồng nghiệp cũ của tôi.',
        associatedActions: [
          { en: 'chat with a colleague', vi: 'trò chuyện cùng đồng nghiệp' },
          { en: 'collaborate with colleagues', vi: 'hợp tác với các đồng nghiệp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'college',
        ipa: '/ˈkɑːlɪdʒ/',
        partOfSpeech: 'noun',
        meaningVi: 'trường đại học, cao đẳng',
        exampleEn: 'We met in college.',
        exampleVi: 'Chúng tôi quen nhau ở trường đại học.',
        associatedActions: [
          { en: 'attend college lectures', vi: 'tham dự các bài giảng đại học' },
          { en: 'graduate from college', vi: 'tốt nghiệp trường đại học' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'amazing',
        ipa: '/əˈmeɪzɪŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'tuyệt vời',
        exampleEn: 'This music is amazing.',
        exampleVi: 'Nhạc này tuyệt quá.',
        associatedActions: [
          { en: 'experience an amazing atmosphere', vi: 'trải nghiệm bầu không khí tuyệt vời' },
          { en: 'give an amazing performance', vi: 'thể hiện một màn trình diễn kinh ngạc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I do not think we have met.', translationVi: 'Tôi không nghĩ là chúng ta đã gặp nhau.' },
      { phrase: 'How do you know the host?', translationVi: 'Bạn quen chủ tiệc như thế nào?' },
      { phrase: 'Are you having a good time?', translationVi: 'Bạn có đang vui không?' },
      { phrase: 'It is a great party, isn\'t it?', translationVi: 'Một bữa tiệc tuyệt vời, phải không?' },
      { phrase: 'Have you tried the food?', translationVi: 'Bạn đã thử đồ ăn chưa?' }
    ],
    aiTutorPrompt: 'You are a guest at a party standing alone. The user approaches you to start a conversation. Be friendly, respond naturally, and ask follow-up questions to keep the conversation going.',
    tags: ['party', 'introductions', 'small talk']
  },
  {
    id: 'soc-friend-02',
    category: 'social',
    subcategory: 'making-friends',
    level: 'A1',
    titleEn: 'Introducing yourself at a club/group',
    titleVi: 'Giới thiệu bản thân tại một câu lạc bộ/nhóm',
    icon: 'Users',
    situationVi: 'Bạn mới tham gia một câu lạc bộ sách. Bạn cần giới thiệu ngắn gọn về bản thân với những thành viên khác trong buổi sinh hoạt đầu tiên.',
    sampleDialogue: [
      { speaker: 'A', text: 'Hello everyone. We have a new member today. Please introduce yourself.', translationVi: 'Chào mọi người. Hôm nay chúng ta có một thành viên mới. Bạn hãy tự giới thiệu nhé.' },
      { speaker: 'B', text: 'Hi everyone, my name is John.', translationVi: 'Chào mọi người, mình tên là John.' },
      { speaker: 'A', text: 'Welcome, John! Where are you from?', translationVi: 'Chào mừng John! Bạn đến từ đâu?' },
      { speaker: 'B', text: 'I am from Canada. I moved here last month.', translationVi: 'Mình đến từ Canada. Mình mới chuyển đến đây tháng trước.' },
      { speaker: 'A', text: 'That is wonderful. What kind of books do you like?', translationVi: 'Thật tuyệt vời. Bạn thích đọc thể loại sách nào?' },
      { speaker: 'B', text: 'I really love science fiction and mystery novels.', translationVi: 'Mình rất thích tiểu thuyết khoa học viễn tưởng và trinh thám.' }
    ],
    keyVocabulary: [
      {
        term: 'member',
        ipa: '/ˈmembər/',
        partOfSpeech: 'noun',
        meaningVi: 'thành viên',
        exampleEn: 'I am a new member.',
        exampleVi: 'Tôi là thành viên mới.',
        associatedActions: [
          { en: 'become a club member', vi: 'trở thành thành viên câu lạc bộ' },
          { en: 'interact with other members', vi: 'tương tác với các thành viên khác' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'move',
        ipa: '/muːv/',
        partOfSpeech: 'verb',
        meaningVi: 'di chuyển, chuyển nhà',
        exampleEn: 'I moved to a new city.',
        exampleVi: 'Tôi đã chuyển đến một thành phố mới.',
        associatedActions: [
          { en: 'move into a new apartment', vi: 'dọn vào căn hộ mới' },
          { en: 'pack boxes to move', vi: 'đóng hộp để chuyển nhà' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'wonderful',
        ipa: '/ˈwʌndərfəl/',
        partOfSpeech: 'adj',
        meaningVi: 'tuyệt vời',
        exampleEn: 'That is a wonderful idea.',
        exampleVi: 'Đó là một ý tưởng tuyệt vời.',
        associatedActions: [
          { en: 'have a wonderful time together', vi: 'có khoảng thời gian tuyệt vời bên nhau' },
          { en: 'share wonderful memories', vi: 'chia sẻ những kỷ niệm tuyệt đẹp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'science fiction',
        ipa: '/ˈsaɪəns ˈfɪkʃn/',
        partOfSpeech: 'noun',
        meaningVi: 'khoa học viễn tưởng',
        exampleEn: 'I enjoy science fiction movies.',
        exampleVi: 'Tôi thích xem phim khoa học viễn tưởng.',
        associatedActions: [
          { en: 'read science fiction stories', vi: 'đọc truyện khoa học viễn tưởng' },
          { en: 'discuss science fiction ideas', vi: 'bàn luận ý tưởng viễn tưởng không gian' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'novel',
        ipa: '/ˈnɑːvl/',
        partOfSpeech: 'noun',
        meaningVi: 'tiểu thuyết',
        exampleEn: 'I am reading a good novel.',
        exampleVi: 'Tôi đang đọc một cuốn tiểu thuyết hay.',
        associatedActions: [
          { en: 'read a gripping novel', vi: 'đọc một cuốn tiểu thuyết lôi cuốn' },
          { en: 'recommend a favorite novel', vi: 'gợi ý cuốn tiểu thuyết yêu thích' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'My name is...', translationVi: 'Tên tôi là...' },
      { phrase: 'I am from...', translationVi: 'Tôi đến từ...' },
      { phrase: 'I moved here last month.', translationVi: 'Tôi chuyển đến đây tháng trước.' },
      { phrase: 'I really love...', translationVi: 'Tôi rất thích...' },
      { phrase: 'In my free time, I...', translationVi: 'Trong thời gian rảnh rỗi, tôi...' }
    ],
    aiTutorPrompt: 'You are the leader of a book club. Welcome the new member (the user) warmly and ask a few simple questions to help them introduce themselves to the group.',
    tags: ['introductions', 'club', 'hobbies']
  },
  {
    id: 'soc-friend-03',
    category: 'social',
    subcategory: 'making-friends',
    level: 'A1',
    titleEn: 'Exchanging contact info',
    titleVi: 'Trao đổi thông tin liên lạc',
    icon: 'Phone',
    situationVi: 'Bạn vừa nói chuyện rất vui vẻ với một người bạn mới quen. Trước khi chia tay, hai bạn muốn trao đổi số điện thoại hoặc mạng xã hội để giữ liên lạc.',
    sampleDialogue: [
      { speaker: 'A', text: 'I really enjoyed talking with you.', translationVi: 'Mình rất thích nói chuyện với bạn.' },
      { speaker: 'B', text: 'Me too! We should stay in touch.', translationVi: 'Mình cũng vậy! Chúng ta nên giữ liên lạc nhé.' },
      { speaker: 'A', text: 'Are you on Facebook or Instagram?', translationVi: 'Bạn có dùng Facebook hay Instagram không?' },
      { speaker: 'B', text: 'Yes, I use Instagram. What is your username?', translationVi: 'Có, mình dùng Instagram. Tên người dùng của bạn là gì?' },
      { speaker: 'A', text: 'It is @alex_smith. Here, let me find you.', translationVi: 'Là @alex_smith. Đây, để mình tìm bạn.' },
      { speaker: 'B', text: 'Great! I just followed you.', translationVi: 'Tuyệt! Mình vừa theo dõi bạn rồi.' }
    ],
    keyVocabulary: [
      {
        term: 'enjoy',
        ipa: '/ɪnˈdʒɔɪ/',
        partOfSpeech: 'verb',
        meaningVi: 'thưởng thức, thích thú',
        exampleEn: 'I enjoyed the movie.',
        exampleVi: 'Tôi đã thích bộ phim đó.',
        associatedActions: [
          { en: 'enjoy the conversation', vi: 'thích thú cuộc trò chuyện' },
          { en: 'enjoy delicious snacks', vi: 'thưởng thức các món đồ ăn ngon' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'contact',
        ipa: '/ˈkɑːntækt/',
        partOfSpeech: 'noun/verb',
        meaningVi: 'liên lạc',
        exampleEn: 'Please save my contact information.',
        exampleVi: 'Hãy lưu thông tin liên lạc của tôi.',
        associatedActions: [
          { en: 'save someone\'s contact info', vi: 'lưu thông tin liên lạc của ai đó' },
          { en: 'exchange contact numbers', vi: 'trao đổi số điện thoại liên lạc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'username',
        ipa: '/ˈjuːzərneɪm/',
        partOfSpeech: 'noun',
        meaningVi: 'tên người dùng',
        exampleEn: 'My username is very long.',
        exampleVi: 'Tên người dùng của tôi rất dài.',
        associatedActions: [
          { en: 'type in a username', vi: 'gõ tên người dùng' },
          { en: 'search a friend\'s username', vi: 'tìm kiếm tên tài khoản của bạn bè' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'follow',
        ipa: '/ˈfɑːloʊ/',
        partOfSpeech: 'verb',
        meaningVi: 'theo dõi',
        exampleEn: 'I will follow you on Instagram.',
        exampleVi: 'Tôi sẽ theo dõi bạn trên Instagram.',
        associatedActions: [
          { en: 'follow each other on Instagram', vi: 'theo dõi nhau trên Instagram' },
          { en: 'send a follow request', vi: 'gửi yêu cầu theo dõi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'stay in touch',
        ipa: '/steɪ ɪn tʌtʃ/',
        partOfSpeech: 'phrase',
        meaningVi: 'giữ liên lạc',
        exampleEn: 'Let us stay in touch after we graduate.',
        exampleVi: 'Chúng ta hãy giữ liên lạc sau khi tốt nghiệp nhé.',
        associatedActions: [
          { en: 'stay in touch via text message', vi: 'giữ liên lạc qua tin nhắn' },
          { en: 'promise to stay in touch', vi: 'hứa giữ liên lạc thường xuyên' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'We should stay in touch.', translationVi: 'Chúng ta nên giữ liên lạc.' },
      { phrase: 'Can I get your phone number?', translationVi: 'Mình xin số điện thoại của bạn được không?' },
      { phrase: 'Are you on Facebook?', translationVi: 'Bạn có dùng Facebook không?' },
      { phrase: 'Let me add you.', translationVi: 'Để mình thêm bạn nhé.' },
      { phrase: 'I will send you a message.', translationVi: 'Mình sẽ gửi tin nhắn cho bạn.' }
    ],
    aiTutorPrompt: 'You have just had a nice chat with the user and it is time to leave. Suggest staying in touch and exchange contact information (phone number or social media).',
    tags: ['contact', 'social media', 'networking']
  },
  {
    id: 'soc-friend-04',
    category: 'social',
    subcategory: 'making-friends',
    level: 'A2',
    titleEn: 'Suggesting to hang out',
    titleVi: 'Đề nghị đi chơi chung',
    icon: 'Coffee',
    situationVi: 'Bạn muốn rủ một người bạn mới đi uống cà phê hoặc dạo phố vào cuối tuần. Bạn nhắn tin hoặc nói chuyện trực tiếp để mời họ.',
    sampleDialogue: [
      { speaker: 'A', text: 'Hey, do you have any plans for this weekend?', translationVi: 'Chào, bạn có kế hoạch gì cho cuối tuần này không?' },
      { speaker: 'B', text: 'Not really, I am completely free. Why?', translationVi: 'Không hẳn, mình hoàn toàn rảnh. Sao vậy?' },
      { speaker: 'A', text: 'Would you like to grab a coffee on Saturday afternoon?', translationVi: 'Bạn có muốn đi uống cà phê vào chiều thứ Bảy không?' },
      { speaker: 'B', text: 'That sounds great! What time?', translationVi: 'Nghe tuyệt đấy! Mấy giờ?' },
      { speaker: 'A', text: 'How about 3 PM at the new cafe downtown?', translationVi: '3 giờ chiều tại quán cà phê mới ở trung tâm thì sao?' },
      { speaker: 'B', text: 'Perfect. See you then!', translationVi: 'Hoàn hảo. Gặp bạn lúc đó nhé!' }
    ],
    keyVocabulary: [
      {
        term: 'plan',
        ipa: '/plæn/',
        partOfSpeech: 'noun',
        meaningVi: 'kế hoạch',
        exampleEn: 'I have no plans for tonight.',
        exampleVi: 'Tôi không có kế hoạch gì cho tối nay.',
        associatedActions: [
          { en: 'make weekend plans', vi: 'lên kế hoạch cho dịp cuối tuần' },
          { en: 'change travel plans', vi: 'thay đổi kế hoạch đi lại' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'free',
        ipa: '/friː/',
        partOfSpeech: 'adj',
        meaningVi: 'rảnh rỗi',
        exampleEn: 'Are you free tomorrow?',
        exampleVi: 'Ngày mai bạn có rảnh không?',
        associatedActions: [
          { en: 'spend free time outdoors', vi: 'dành thời gian rảnh ngoài trời' },
          { en: 'feel free to ask questions', vi: 'thoải mái tự do đặt câu hỏi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'grab',
        ipa: '/ɡræb/',
        partOfSpeech: 'verb',
        meaningVi: 'lấy, vồ lấy (thường dùng cho việc đi ăn uống nhanh)',
        exampleEn: 'Let us grab some food.',
        exampleVi: 'Đi ăn gì đó nhanh đi.',
        associatedActions: [
          { en: 'grab a cup of coffee', vi: 'uống nhanh một tách cà phê' },
          { en: 'grab lunch with a friend', vi: 'ăn trưa nhanh cùng bạn bè' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'downtown',
        ipa: '/ˌdaʊnˈtaʊn/',
        partOfSpeech: 'noun/adv',
        meaningVi: 'khu trung tâm thành phố',
        exampleEn: 'I work downtown.',
        exampleVi: 'Tôi làm việc ở khu trung tâm.',
        associatedActions: [
          { en: 'walk around downtown', vi: 'dạo quanh khu trung tâm' },
          { en: 'explore downtown shops', vi: 'khám phá các cửa hàng ở phố trung tâm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'perfect',
        ipa: '/ˈpɜːrfɪkt/',
        partOfSpeech: 'adj',
        meaningVi: 'hoàn hảo',
        exampleEn: 'The weather is perfect today.',
        exampleVi: 'Thời tiết hôm nay thật hoàn hảo.',
        associatedActions: [
          { en: 'pick a perfect meeting spot', vi: 'chọn địa điểm gặp mặt hoàn hảo' },
          { en: 'enjoy a perfect day', vi: 'tận hưởng một ngày trọn vẹn hoàn hảo' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Do you have any plans for...?', translationVi: 'Bạn có kế hoạch gì cho... không?' },
      { phrase: 'Are you free on...?', translationVi: 'Bạn có rảnh vào... không?' },
      { phrase: 'Would you like to grab a coffee?', translationVi: 'Bạn có muốn đi uống cà phê không?' },
      { phrase: 'That sounds great!', translationVi: 'Nghe tuyệt đấy!' },
      { phrase: 'Let us meet at...', translationVi: 'Chúng ta hãy gặp nhau ở...' }
    ],
    aiTutorPrompt: 'You are an acquaintance of the user. The user will invite you to hang out. Accept the invitation enthusiastically and agree on a time and place.',
    tags: ['invitations', 'weekend', 'coffee']
  },
  {
    id: 'soc-friend-05',
    category: 'social',
    subcategory: 'making-friends',
    level: 'B1',
    titleEn: 'Reconnecting with an old friend',
    titleVi: 'Kết nối lại với bạn cũ',
    icon: 'MessageCircle',
    situationVi: 'Bạn tình cờ gặp lại một người bạn cũ ở trường đại học sau nhiều năm mất liên lạc. Hai bạn hỏi han về cuộc sống hiện tại của nhau.',
    sampleDialogue: [
      { speaker: 'A', text: 'David? Oh my goodness, is that you?', translationVi: 'David? Ôi trời ơi, là bạn đó hả?' },
      { speaker: 'B', text: 'Sarah! Wow, it has been ages! How have you been?', translationVi: 'Sarah! Wow, lâu lắm rồi nhỉ! Bạn dạo này thế nào?' },
      { speaker: 'A', text: 'I have been good, just busy with work. I am living in Seattle now.', translationVi: 'Mình vẫn khỏe, chỉ bận rộn với công việc thôi. Hiện mình đang sống ở Seattle.' },
      { speaker: 'B', text: 'Seattle? That is awesome! What are you working as?', translationVi: 'Seattle á? Tuyệt quá! Bạn đang làm công việc gì vậy?' },
      { speaker: 'A', text: 'I am a software engineer. Are you still playing in that band?', translationVi: 'Mình là kỹ sư phần mềm. Bạn còn chơi trong ban nhạc đó không?' },
      { speaker: 'B', text: 'Haha, no, that was a long time ago. I am a teacher now.', translationVi: 'Haha, không, chuyện đó lâu lắm rồi. Bây giờ mình là giáo viên.' }
    ],
    keyVocabulary: [
      {
        term: 'goodness',
        ipa: '/ˈɡʊdnəs/',
        partOfSpeech: 'noun',
        meaningVi: 'trời ơi (thể hiện sự ngạc nhiên)',
        exampleEn: 'Oh my goodness, look at the time!',
        exampleVi: 'Ôi trời ơi, nhìn giờ kìa!',
        associatedActions: [
          { en: 'exclaim in surprise', vi: 'thốt lên kinh ngạc' },
          { en: 'react with disbelief', vi: 'phản ứng trong sự sững sờ ngạc nhiên' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'ages',
        ipa: '/ˈeɪdʒɪz/',
        partOfSpeech: 'noun',
        meaningVi: 'thời gian dài, rất lâu',
        exampleEn: 'I have not seen him in ages.',
        exampleVi: 'Tôi đã không gặp anh ấy rất lâu rồi.',
        associatedActions: [
          { en: 'wait for ages', vi: 'chờ đợi rất lâu' },
          { en: 'meet after ages apart', vi: 'gặp lại nhau sau bao năm xa cách' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'busy',
        ipa: '/ˈbɪzi/',
        partOfSpeech: 'adj',
        meaningVi: 'bận rộn',
        exampleEn: 'She is always busy with work.',
        exampleVi: 'Cô ấy luôn bận rộn với công việc.',
        associatedActions: [
          { en: 'stay busy with daily tasks', vi: 'bận rộn với các việc thường ngày' },
          { en: 'manage a busy schedule', vi: 'quản lý lịch trình bận rộn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'awesome',
        ipa: '/ˈɔːsəm/',
        partOfSpeech: 'adj',
        meaningVi: 'tuyệt vời',
        exampleEn: 'Your new car is awesome.',
        exampleVi: 'Xe mới của bạn thật tuyệt.',
        associatedActions: [
          { en: 'share awesome news', vi: 'chia sẻ tin tức tuyệt vời' },
          { en: 'celebrate an awesome achievement', vi: 'ăn mừng thành tựu tuyệt đỉnh' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'engineer',
        ipa: '/ˌendʒɪˈnɪr/',
        partOfSpeech: 'noun',
        meaningVi: 'kỹ sư',
        exampleEn: 'He works as a civil engineer.',
        exampleVi: 'Anh ấy làm kỹ sư xây dựng.',
        associatedActions: [
          { en: 'work as an engineer', vi: 'làm việc như một kỹ sư' },
          { en: 'solve technical problems', vi: 'giải quyết vấn đề kỹ thuật' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'It has been ages!', translationVi: 'Đã lâu lắm rồi!' },
      { phrase: 'Long time no see.', translationVi: 'Lâu rồi không gặp.' },
      { phrase: 'How have you been?', translationVi: 'Dạo này bạn thế nào?' },
      { phrase: 'What have you been up to?', translationVi: 'Dạo này bạn làm gì rồi?' },
      { phrase: 'We need to catch up.', translationVi: 'Chúng ta cần hàn huyên tâm sự.' }
    ],
    aiTutorPrompt: 'You unexpectedly run into your old college friend (the user) at a grocery store. Express surprise and joy, and ask what they have been doing since you last saw each other.',
    tags: ['old friends', 'catching up', 'surprise']
  },
  {
    id: 'soc-friend-06',
    category: 'social',
    subcategory: 'making-friends',
    level: 'B1',
    titleEn: 'Making friends in a new city',
    titleVi: 'Kết bạn ở một thành phố mới',
    icon: 'MapPin',
    situationVi: 'Bạn vừa chuyển đến một thành phố mới và đang nói chuyện với một người dân địa phương tại công viên để tìm kiếm lời khuyên và làm quen.',
    sampleDialogue: [
      { speaker: 'A', text: 'Excuse me, do you mind if I sit here?', translationVi: 'Xin lỗi, bạn có phiền nếu mình ngồi đây không?' },
      { speaker: 'B', text: 'Not at all, go ahead.', translationVi: 'Không sao đâu, bạn cứ ngồi đi.' },
      { speaker: 'A', text: 'Thanks. I am new in town, actually just moved here last week.', translationVi: 'Cảm ơn. Mình mới đến thành phố này, thực ra mới chuyển đến tuần trước.' },
      { speaker: 'B', text: 'Oh, welcome! How are you liking it so far?', translationVi: 'Ồ, chào mừng! Đến giờ bạn thấy nơi này thế nào?' },
      { speaker: 'A', text: 'It is beautiful, but I do not know anyone yet. Are there good places to meet people?', translationVi: 'Nó rất đẹp, nhưng mình chưa quen ai cả. Ở đây có nơi nào hay để làm quen với mọi người không?' },
      { speaker: 'B', text: 'Definitely! There is a board game cafe down the street that hosts community nights on Thursdays.', translationVi: 'Chắc chắn rồi! Có một quán cà phê board game ở cuối đường tổ chức các đêm cộng đồng vào tối thứ Năm.' }
    ],
    keyVocabulary: [
      {
        term: 'excuse',
        ipa: '/ɪkˈskjuːs/',
        partOfSpeech: 'verb',
        meaningVi: 'xin lỗi, thứ lỗi',
        exampleEn: 'Excuse me, where is the station?',
        exampleVi: 'Xin lỗi, nhà ga ở đâu?',
        associatedActions: [
          { en: 'say excuse me to get attention', vi: 'nói xin lỗi để thu hút sự chú ý' },
          { en: 'politely excuse oneself', vi: 'xin phép rời đi lịch sự' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'mind',
        ipa: '/maɪnd/',
        partOfSpeech: 'verb',
        meaningVi: 'phiền, bận tâm',
        exampleEn: 'Do you mind opening the window?',
        exampleVi: 'Bạn có phiền mở cửa sổ không?',
        associatedActions: [
          { en: 'ask if someone minds', vi: 'hỏi xem ai đó có phiền lòng không' },
          { en: 'not mind sharing a bench', vi: 'không phiền ngồi chung băng ghế' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'local',
        ipa: '/ˈloʊkl/',
        partOfSpeech: 'adj/noun',
        meaningVi: 'địa phương, người dân địa phương',
        exampleEn: 'Ask a local for directions.',
        exampleVi: 'Hãy hỏi người dân địa phương đường đi.',
        associatedActions: [
          { en: 'ask local residents for advice', vi: 'hỏi xin lời khuyên từ người dân địa phương' },
          { en: 'support local coffee shops', vi: 'ủng hộ các quán cà phê địa phương' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'community',
        ipa: '/kəˈmjuːnəti/',
        partOfSpeech: 'noun',
        meaningVi: 'cộng đồng',
        exampleEn: 'We have a strong local community.',
        exampleVi: 'Chúng tôi có một cộng đồng địa phương vững mạnh.',
        associatedActions: [
          { en: 'join a local community event', vi: 'tham gia sự kiện cộng đồng địa phương' },
          { en: 'build ties in the community', vi: 'xây dựng gắn kết trong cộng đồng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'host',
        ipa: '/hoʊst/',
        partOfSpeech: 'verb',
        meaningVi: 'tổ chức, đăng cai',
        exampleEn: 'The city will host the next Olympics.',
        exampleVi: 'Thành phố sẽ đăng cai kỳ thế vận hội tiếp theo.',
        associatedActions: [
          { en: 'host a community game night', vi: 'tổ chức đêm trò chơi cộng đồng' },
          { en: 'host an informal gathering', vi: 'chủ trì buổi tụ họp thân mật' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Do you mind if I sit here?', translationVi: 'Bạn có phiền nếu tôi ngồi đây không?' },
      { phrase: 'I am new in town.', translationVi: 'Tôi mới đến thành phố này.' },
      { phrase: 'How are you liking it so far?', translationVi: 'Đến giờ bạn thấy nơi này thế nào?' },
      { phrase: 'Any recommendations for...?', translationVi: 'Có gợi ý nào cho... không?' },
      { phrase: 'It is a great place to meet people.', translationVi: 'Đó là một nơi tuyệt vời để làm quen với mọi người.' }
    ],
    aiTutorPrompt: 'You are sitting on a park bench. The user, who is new in town, asks to sit next to you and strikes up a conversation. Give them a friendly welcome and recommend a couple of local activities.',
    tags: ['new city', 'recommendations', 'local']
  }
];
