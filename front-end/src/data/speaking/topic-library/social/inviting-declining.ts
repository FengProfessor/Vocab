/**
 * LingoPro Speaking Topic Library
 * Category: Social
 * Subcategory: Inviting & Declining
 * File: src/data/speaking/topic-library/social/inviting-declining.ts
 *
 * 6 sub-topics covering inviting people and politely declining invitations.
 * CEFR Range: A1 - B1
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const INVITING_DECLINING_ITEMS: TopicLibraryItem[] = [
  {
    id: 'soc-inv-01',
    category: 'social',
    subcategory: 'inviting-declining',
    level: 'A1',
    titleEn: 'Inviting a friend to dinner',
    titleVi: 'Mời bạn đi ăn tối',
    icon: 'Utensils',
    situationVi: 'Bạn muốn rủ một người bạn thân đi ăn tối vào tối thứ Sáu để mừng cuối tuần. Bạn gọi điện hoặc nhắn tin mời họ.',
    sampleDialogue: [
      { speaker: 'A', text: 'Hi! Are you free this Friday evening?', translationVi: 'Chào bạn! Tối thứ Sáu này bạn rảnh không?' },
      { speaker: 'B', text: 'Yes, I am. Why do you ask?', translationVi: 'Có, mình rảnh. Sao bạn lại hỏi vậy?' },
      { speaker: 'A', text: 'Would you like to have dinner with me?', translationVi: 'Bạn có muốn đi ăn tối với mình không?' },
      { speaker: 'B', text: 'I would love to. Where should we go?', translationVi: 'Mình rất muốn. Chúng ta nên đi đâu?' },
      { speaker: 'A', text: 'Let us go to the new Italian restaurant. I will pay.', translationVi: 'Hãy đến nhà hàng Ý mới mở nhé. Mình sẽ trả tiền.' },
      { speaker: 'B', text: 'That is very kind of you. See you on Friday!', translationVi: 'Bạn thật tốt bụng. Hẹn gặp bạn vào thứ Sáu!' }
    ],
    keyVocabulary: [
      {
        term: 'free',
        ipa: '/friː/',
        partOfSpeech: 'adj',
        meaningVi: 'rảnh rỗi',
        exampleEn: 'Are you free tomorrow?',
        exampleVi: 'Ngày mai bạn có rảnh không?',
        associatedActions: [
          { en: 'have free time', vi: 'có thời gian rảnh rỗi' },
          { en: 'enjoy a free afternoon', vi: 'tận hưởng buổi chiều rảnh rỗi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'dinner',
        ipa: '/ˈdɪnər/',
        partOfSpeech: 'noun',
        meaningVi: 'bữa tối',
        exampleEn: 'Let us have dinner together.',
        exampleVi: 'Chúng ta hãy ăn tối cùng nhau.',
        associatedActions: [
          { en: 'cook a nice dinner', vi: 'nấu một bữa tối ngon' },
          { en: 'eat dinner with family', vi: 'dùng bữa tối với gia đình' },
          { en: 'invite friends for dinner', vi: 'mời bạn bè đến ăn tối' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'restaurant',
        ipa: '/ˈrestrɑːnt/',
        partOfSpeech: 'noun',
        meaningVi: 'nhà hàng',
        exampleEn: 'It is a nice restaurant.',
        exampleVi: 'Đó là một nhà hàng đẹp.',
        associatedActions: [
          { en: 'book a table at a restaurant', vi: 'đặt bàn tại nhà hàng' },
          { en: 'order food at a restaurant', vi: 'gọi món tại nhà hàng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'pay',
        ipa: '/peɪ/',
        partOfSpeech: 'verb',
        meaningVi: 'trả tiền',
        exampleEn: 'I will pay the bill.',
        exampleVi: 'Tôi sẽ thanh toán hóa đơn.',
        associatedActions: [
          { en: 'pay the restaurant bill', vi: 'thanh toán hóa đơn nhà hàng' },
          { en: 'pay in cash or card', vi: 'trả bằng tiền mặt hoặc thẻ' },
          { en: 'split the bill to pay', vi: 'chia hóa đơn để thanh toán' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'kind',
        ipa: '/kaɪnd/',
        partOfSpeech: 'adj',
        meaningVi: 'tốt bụng',
        exampleEn: 'She is a very kind person.',
        exampleVi: 'Cô ấy là một người rất tốt bụng.',
        associatedActions: [
          { en: 'show a kind gesture', vi: 'thể hiện cử chỉ tử tế' },
          { en: 'say kind words', vi: 'nói những lời tốt đẹp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Are you free this Friday?', translationVi: 'Thứ Sáu này bạn có rảnh không?' },
      { phrase: 'Would you like to have dinner?', translationVi: 'Bạn có muốn dùng bữa tối không?' },
      { phrase: 'I would love to.', translationVi: 'Tôi rất sẵn lòng.' },
      { phrase: 'Where should we go?', translationVi: 'Chúng ta nên đi đâu?' },
      { phrase: 'That is very kind of you.', translationVi: 'Bạn thật tốt bụng.' }
    ],
    aiTutorPrompt: 'The user will call you to invite you to dinner on Friday. You are free and excited to accept the invitation. Ask them where you should go.',
    tags: ['invitations', 'food', 'weekend']
  },
  {
    id: 'soc-inv-02',
    category: 'social',
    subcategory: 'inviting-declining',
    level: 'A2',
    titleEn: 'Inviting classmates to a study group',
    titleVi: 'Mời bạn cùng lớp tham gia nhóm học tập',
    icon: 'Book',
    situationVi: 'Bạn đang muốn thành lập một nhóm học tập để chuẩn bị cho kỳ thi. Bạn rủ một vài người bạn cùng lớp tham gia cùng mình.',
    sampleDialogue: [
      { speaker: 'A', text: 'Hey guys, the math exam is next week. Are you ready?', translationVi: 'Chào các bạn, bài kiểm tra toán vào tuần tới rồi. Các bạn đã sẵn sàng chưa?' },
      { speaker: 'B', text: 'Not at all. I am really struggling with the homework.', translationVi: 'Chưa đâu. Mình đang rất chật vật với bài tập về nhà.' },
      { speaker: 'A', text: 'Me too. I am organizing a study group on Saturday. Do you want to join?', translationVi: 'Mình cũng vậy. Mình đang tổ chức một nhóm học tập vào thứ Bảy. Bạn có muốn tham gia không?' },
      { speaker: 'B', text: 'That is a great idea. Where are you going to meet?', translationVi: 'Đó là một ý kiến hay. Các bạn định gặp nhau ở đâu?' },
      { speaker: 'A', text: 'We will meet at the library at 2 PM. We can help each other out.', translationVi: 'Bọn mình sẽ gặp nhau ở thư viện lúc 2 giờ chiều. Chúng ta có thể giúp đỡ lẫn nhau.' },
      { speaker: 'B', text: 'Count me in. I will bring some snacks.', translationVi: 'Cho mình tham gia với. Mình sẽ mang theo đồ ăn vặt.' }
    ],
    keyVocabulary: [
      {
        term: 'exam',
        ipa: '/ɪɡˈzæm/',
        partOfSpeech: 'noun',
        meaningVi: 'kỳ thi, bài kiểm tra',
        exampleEn: 'I have a math exam.',
        exampleVi: 'Tôi có một bài kiểm tra toán.',
        associatedActions: [
          { en: 'study hard for an exam', vi: 'học tập chăm chỉ cho kỳ thi' },
          { en: 'pass the final exam', vi: 'vượt qua kỳ thi cuối kỳ' },
          { en: 'take a difficult exam', vi: 'làm một bài thi khó' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'struggle',
        ipa: '/ˈstrʌɡl/',
        partOfSpeech: 'verb',
        meaningVi: 'chật vật, gặp khó khăn',
        exampleEn: 'I struggle with reading.',
        exampleVi: 'Tôi gặp khó khăn với việc đọc.',
        associatedActions: [
          { en: 'struggle with difficult problems', vi: 'chật vật với bài toán khó' },
          { en: 'ask for help when struggling', vi: 'xin giúp đỡ khi gặp khó khăn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'join',
        ipa: '/dʒɔɪn/',
        partOfSpeech: 'verb',
        meaningVi: 'tham gia',
        exampleEn: 'Can I join your team?',
        exampleVi: 'Tôi có thể tham gia đội của bạn không?',
        associatedActions: [
          { en: 'join a study club', vi: 'tham gia câu lạc bộ học tập' },
          { en: 'join friends for coffee', vi: 'tham gia uống cà phê cùng bạn bè' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'library',
        ipa: '/ˈlaɪbreri/',
        partOfSpeech: 'noun',
        meaningVi: 'thư viện',
        exampleEn: 'Let us study in the library.',
        exampleVi: 'Hãy học trong thư viện.',
        associatedActions: [
          { en: 'borrow books from the library', vi: 'mượn sách từ thư viện' },
          { en: 'study quietly in the library', vi: 'học tập yên tĩnh trong thư viện' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'snack',
        ipa: '/snæk/',
        partOfSpeech: 'noun',
        meaningVi: 'đồ ăn vặt',
        exampleEn: 'I bought some snacks.',
        exampleVi: 'Tôi đã mua vài món đồ ăn vặt.',
        associatedActions: [
          { en: 'grab a quick snack', vi: 'ăn nhanh món đồ ăn vặt' },
          { en: 'share snacks with friends', vi: 'chia sẻ đồ ăn vặt với bạn bè' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I am organizing a study group.', translationVi: 'Tôi đang tổ chức một nhóm học tập.' },
      { phrase: 'Do you want to join?', translationVi: 'Bạn có muốn tham gia không?' },
      { phrase: 'Where are you going to meet?', translationVi: 'Các bạn dự định gặp ở đâu?' },
      { phrase: 'We can help each other out.', translationVi: 'Chúng ta có thể giúp đỡ lẫn nhau.' },
      { phrase: 'Count me in.', translationVi: 'Tính cả tôi vào nhé (cho tôi tham gia với).' }
    ],
    aiTutorPrompt: 'You are a classmate of the user who is struggling with math. The user will invite you to a study group. Accept the invitation happily and ask for details.',
    tags: ['study', 'school', 'invitations']
  },
  {
    id: 'soc-inv-03',
    category: 'social',
    subcategory: 'inviting-declining',
    level: 'A2',
    titleEn: 'Politely declining an invitation',
    titleVi: 'Từ chối lời mời một cách lịch sự',
    icon: 'XCircle',
    situationVi: 'Một người quen mời bạn tham dự một bữa tiệc nhỏ, nhưng bạn không muốn đi vì cảm thấy mệt. Bạn từ chối một cách lịch sự.',
    sampleDialogue: [
      { speaker: 'A', text: 'I am having a small party at my house tonight. You should come!', translationVi: 'Tối nay tôi tổ chức một bữa tiệc nhỏ tại nhà. Bạn nên đến nhé!' },
      { speaker: 'B', text: 'Thank you for the invitation, but I am afraid I cannot make it.', translationVi: 'Cảm ơn bạn vì lời mời, nhưng tôi e là tôi không thể đến được.' },
      { speaker: 'A', text: 'Oh, really? That is a pity. Do you have other plans?', translationVi: 'Ồ, thật sao? Tiếc quá. Bạn có kế hoạch khác rồi à?' },
      { speaker: 'B', text: 'No, I am just feeling a bit under the weather. I need to rest.', translationVi: 'Không, chỉ là tôi cảm thấy hơi mệt. Tôi cần nghỉ ngơi.' },
      { speaker: 'A', text: 'I understand. Get well soon!', translationVi: 'Tôi hiểu rồi. Mong bạn mau khỏe!' },
      { speaker: 'B', text: 'Thanks. I hope you all have a great time tonight.', translationVi: 'Cảm ơn. Tôi hy vọng mọi người sẽ có một khoảng thời gian tuyệt vời tối nay.' }
    ],
    keyVocabulary: [
      {
        term: 'invitation',
        ipa: '/ˌɪnvɪˈteɪʃn/',
        partOfSpeech: 'noun',
        meaningVi: 'lời mời',
        exampleEn: 'I received a wedding invitation.',
        exampleVi: 'Tôi đã nhận được thiệp mời đám cưới.',
        associatedActions: [
          { en: 'send out formal invitations', vi: 'gửi đi thiệp mời trang trọng' },
          { en: 'accept an invitation', vi: 'chấp nhận một lời mời' },
          { en: 'decline an invitation politely', vi: 'từ chối lời mời lịch sự' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'afraid',
        ipa: '/əˈfreɪd/',
        partOfSpeech: 'adj',
        meaningVi: 'e ngại, sợ',
        exampleEn: 'I am afraid I cannot go.',
        exampleVi: 'Tôi e là tôi không thể đi.',
        associatedActions: [
          { en: 'express regret politely', vi: 'bày tỏ sự tiếc nuối lịch sự' },
          { en: 'explain reasons hesitation', vi: 'giải thích lý do e ngại' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'pity',
        ipa: '/ˈpɪti/',
        partOfSpeech: 'noun',
        meaningVi: 'điều đáng tiếc',
        exampleEn: 'It is a pity you cannot come.',
        exampleVi: 'Thật đáng tiếc khi bạn không thể đến.',
        associatedActions: [
          { en: 'feel pity for missing out', vi: 'cảm thấy tiếc vì đã bỏ lỡ' },
          { en: 'express genuine sympathy', vi: 'bày tỏ sự đồng cảm chân thành' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'weather',
        ipa: '/ˈweðər/',
        partOfSpeech: 'noun',
        meaningVi: 'thời tiết (thành ngữ: under the weather = ốm)',
        exampleEn: 'I am feeling under the weather.',
        exampleVi: 'Tôi cảm thấy không được khỏe.',
        associatedActions: [
          { en: 'check the daily weather', vi: 'kiểm tra thời tiết hàng ngày' },
          { en: 'feel sick under bad weather', vi: 'cảm thấy ốm do thời tiết xấu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'rest',
        ipa: '/rest/',
        partOfSpeech: 'verb',
        meaningVi: 'nghỉ ngơi',
        exampleEn: 'You should go home and rest.',
        exampleVi: 'Bạn nên về nhà và nghỉ ngơi.',
        associatedActions: [
          { en: 'take a short rest', vi: 'nghỉ ngơi một lát' },
          { en: 'rest after a long day', vi: 'nghỉ ngơi sau một ngày dài' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Thank you for the invitation.', translationVi: 'Cảm ơn vì lời mời.' },
      { phrase: 'I am afraid I cannot make it.', translationVi: 'Tôi e rằng tôi không thể đến được.' },
      { phrase: 'That is a pity.', translationVi: 'Thật đáng tiếc.' },
      { phrase: 'I am feeling a bit under the weather.', translationVi: 'Tôi cảm thấy hơi mệt mỏi trong người.' },
      { phrase: 'Have a great time.', translationVi: 'Chúc vui vẻ.' }
    ],
    aiTutorPrompt: 'You invite the user to a party at your house tonight. The user will decline. Express disappointment politely, ask why, and then wish them well.',
    tags: ['declining', 'polite', 'party']
  },
  {
    id: 'soc-inv-04',
    category: 'social',
    subcategory: 'inviting-declining',
    level: 'A2',
    titleEn: 'Inviting someone to a wedding',
    titleVi: 'Mời ai đó dự đám cưới',
    icon: 'Mail',
    situationVi: 'Bạn chuẩn bị kết hôn và muốn gọi điện báo tin, đồng thời mời một người bạn ở xa đến dự lễ cưới của mình.',
    sampleDialogue: [
      { speaker: 'A', text: 'I am calling because I have some exciting news. I am getting married!', translationVi: 'Mình gọi vì mình có một tin rất vui. Mình sắp kết hôn!' },
      { speaker: 'B', text: 'Oh my gosh! Congratulations! I am so happy for you.', translationVi: 'Trời ơi! Chúc mừng nhé! Mình rất mừng cho bạn.' },
      { speaker: 'A', text: 'Thank you! The wedding is on October 15th, and I would love it if you could come.', translationVi: 'Cảm ơn! Lễ cưới sẽ diễn ra vào ngày 15 tháng 10, và mình sẽ rất vui nếu bạn có thể đến.' },
      { speaker: 'B', text: 'October 15th? Let me check my calendar. Yes, I am definitely coming!', translationVi: 'Ngày 15 tháng 10? Để mình xem lịch đã. Có, chắc chắn mình sẽ đến!' },
      { speaker: 'A', text: 'That is wonderful. I will send you the formal invitation in the mail soon.', translationVi: 'Thật tuyệt vời. Mình sẽ sớm gửi thiệp mời chính thức cho bạn qua đường bưu điện.' },
      { speaker: 'B', text: 'I cannot wait! Let me know if you need help with anything.', translationVi: 'Mình nóng lòng quá! Hãy cho mình biết nếu bạn cần giúp đỡ bất cứ việc gì nhé.' }
    ],
    keyVocabulary: [
      {
        term: 'marry',
        ipa: '/ˈmæri/',
        partOfSpeech: 'verb',
        meaningVi: 'kết hôn',
        exampleEn: 'They are getting married next month.',
        exampleVi: 'Họ sẽ kết hôn vào tháng tới.',
        associatedActions: [
          { en: 'decide to get married', vi: 'quyết định kết hôn' },
          { en: 'exchange wedding vows', vi: 'trao lời thề nguyện hôn lễ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'wedding',
        ipa: '/ˈwedɪŋ/',
        partOfSpeech: 'noun',
        meaningVi: 'đám cưới',
        exampleEn: 'The wedding was beautiful.',
        exampleVi: 'Đám cưới rất đẹp.',
        associatedActions: [
          { en: 'attend a friend\'s wedding', vi: 'tham dự đám cưới của bạn' },
          { en: 'celebrate a wedding banquet', vi: 'dự tiệc mừng đám cưới' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'calendar',
        ipa: '/ˈkæləndər/',
        partOfSpeech: 'noun',
        meaningVi: 'lịch',
        exampleEn: 'I will check my calendar.',
        exampleVi: 'Tôi sẽ kiểm tra lịch của mình.',
        associatedActions: [
          { en: 'check the schedule on calendar', vi: 'kiểm tra lịch trình trên lịch' },
          { en: 'mark an important date on calendar', vi: 'đánh dấu ngày quan trọng lên lịch' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'definitely',
        ipa: '/ˈdefɪnətli/',
        partOfSpeech: 'adv',
        meaningVi: 'chắc chắn',
        exampleEn: 'I will definitely be there.',
        exampleVi: 'Tôi chắc chắn sẽ ở đó.',
        associatedActions: [
          { en: 'confirm definitely in advance', vi: 'xác nhận chắc chắn từ trước' },
          { en: 'promise definitely to arrive', vi: 'hứa chắc chắn sẽ đến' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'formal',
        ipa: '/ˈfɔːrml/',
        partOfSpeech: 'adj',
        meaningVi: 'trang trọng, chính thức',
        exampleEn: 'Please wear formal clothes.',
        exampleVi: 'Vui lòng mặc trang phục trang trọng.',
        associatedActions: [
          { en: 'wear formal attire', vi: 'mặc trang phục trang trọng' },
          { en: 'attend a formal event', vi: 'tham dự một sự kiện trang trọng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I am getting married!', translationVi: 'Tôi sắp kết hôn!' },
      { phrase: 'I would love it if you could come.', translationVi: 'Tôi sẽ rất vui nếu bạn có thể đến.' },
      { phrase: 'Let me check my calendar.', translationVi: 'Để tôi kiểm tra lịch của mình.' },
      { phrase: 'I am definitely coming!', translationVi: 'Tôi chắc chắn sẽ đến!' },
      { phrase: 'I will send you the formal invitation.', translationVi: 'Tôi sẽ gửi cho bạn thiệp mời chính thức.' }
    ],
    aiTutorPrompt: 'The user calls to tell you they are getting married and invites you to the wedding. Show great enthusiasm, check your imaginary schedule, and accept the invitation warmly.',
    tags: ['wedding', 'invitations', 'friends']
  },
  {
    id: 'soc-inv-05',
    category: 'social',
    subcategory: 'inviting-declining',
    level: 'B1',
    titleEn: 'Declining due to a scheduling conflict',
    titleVi: 'Từ chối do kẹt lịch',
    icon: 'CalendarMinus',
    situationVi: 'Đồng nghiệp mời bạn tham dự tiệc sinh nhật của họ, nhưng bạn đã có một cuộc hẹn khác trùng giờ. Bạn phải từ chối và xin lỗi.',
    sampleDialogue: [
      { speaker: 'A', text: 'I am hosting a birthday dinner this Friday at 7 PM. It would be great if you could join us.', translationVi: 'Tôi sẽ tổ chức tiệc tối sinh nhật vào lúc 7 giờ tối thứ Sáu này. Sẽ rất tuyệt nếu bạn có thể tham gia cùng chúng tôi.' },
      { speaker: 'B', text: 'Thank you so much for thinking of me. Unfortunately, I already have plans for Friday night.', translationVi: 'Cảm ơn bạn rất nhiều vì đã nghĩ đến tôi. Thật không may, tôi đã có kế hoạch cho tối thứ Sáu rồi.' },
      { speaker: 'A', text: 'Oh, what a shame. Is it something you can reschedule?', translationVi: 'Ồ, thật tiếc quá. Đó có phải là việc bạn có thể sắp xếp lại lịch không?' },
      { speaker: 'B', text: 'I wish I could, but it is my parents\' anniversary dinner. We planned it months ago.', translationVi: 'Tôi ước là mình có thể, nhưng đó là bữa tối kỷ niệm ngày cưới của bố mẹ tôi. Chúng tôi đã lên kế hoạch từ nhiều tháng trước.' },
      { speaker: 'A', text: 'Of course, family comes first! Do not worry about it at all.', translationVi: 'Tất nhiên rồi, gia đình là trên hết! Đừng bận tâm về điều đó nhé.' },
      { speaker: 'B', text: 'I hope you have a fantastic birthday. Let us catch up over coffee next week.', translationVi: 'Tôi hy vọng bạn có một sinh nhật tuyệt vời. Tuần tới chúng ta cùng đi uống cà phê để bù nhé.' }
    ],
    keyVocabulary: [
      {
        term: 'host',
        ipa: '/hoʊst/',
        partOfSpeech: 'verb',
        meaningVi: 'tổ chức, làm chủ nhà',
        exampleEn: 'I am hosting a party.',
        exampleVi: 'Tôi đang tổ chức một bữa tiệc.',
        associatedActions: [
          { en: 'host a celebration dinner', vi: 'chủ trì bữa tiệc tối kỷ niệm' },
          { en: 'welcome guests warmly', vi: 'nhiệt tình chào đón quan khách' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'unfortunately',
        ipa: '/ʌnˈfɔːrtʃənətli/',
        partOfSpeech: 'adv',
        meaningVi: 'không may, rất tiếc',
        exampleEn: 'Unfortunately, I cannot help you.',
        exampleVi: 'Rất tiếc, tôi không thể giúp bạn.',
        associatedActions: [
          { en: 'deliver unfortunate news', vi: 'thông báo tin đáng tiếc' },
          { en: 'decline due to unfortunate conflicts', vi: 'từ chối do xung đột lịch đáng tiếc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'shame',
        ipa: '/ʃeɪm/',
        partOfSpeech: 'noun',
        meaningVi: 'điều đáng tiếc',
        exampleEn: 'What a shame you have to leave.',
        exampleVi: 'Thật tiếc là bạn phải rời đi.',
        associatedActions: [
          { en: 'express what a shame it is', vi: 'bày tỏ sự tiếc nuối' },
          { en: 'apologize for the missed chance', vi: 'xin lỗi vì cơ hội bị bỏ lỡ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'reschedule',
        ipa: '/ˌriːˈskedʒuːl/',
        partOfSpeech: 'verb',
        meaningVi: 'sắp xếp lại lịch',
        exampleEn: 'Can we reschedule our meeting?',
        exampleVi: 'Chúng ta có thể sắp xếp lại lịch họp không?',
        associatedActions: [
          { en: 'reschedule an appointment', vi: 'sắp xếp lại lịch hẹn' },
          { en: 'request a later meeting date', vi: 'yêu cầu dời ngày hẹn sang hôm sau' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'anniversary',
        ipa: '/ˌænɪˈvɜːrsəri/',
        partOfSpeech: 'noun',
        meaningVi: 'ngày kỷ niệm',
        exampleEn: 'It is their wedding anniversary.',
        exampleVi: 'Đó là kỷ niệm ngày cưới của họ.',
        associatedActions: [
          { en: 'celebrate a wedding anniversary', vi: 'kỷ niệm ngày cưới' },
          { en: 'buy flowers for the anniversary', vi: 'mua hoa cho ngày kỷ niệm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'It would be great if you could join us.', translationVi: 'Sẽ rất tuyệt nếu bạn có thể tham gia cùng chúng tôi.' },
      { phrase: 'Thank you so much for thinking of me.', translationVi: 'Cảm ơn rất nhiều vì đã nghĩ đến tôi.' },
      { phrase: 'Unfortunately, I already have plans.', translationVi: 'Rất tiếc, tôi đã có kế hoạch rồi.' },
      { phrase: 'What a shame.', translationVi: 'Thật là tiếc.' },
      { phrase: 'Family comes first.', translationVi: 'Gia đình là ưu tiên hàng đầu.' }
    ],
    aiTutorPrompt: 'Invite the user to your birthday dinner this Friday. The user will politely decline because of a family event. Be understanding and agree to meet up next week.',
    tags: ['declining', 'conflict', 'work']
  },
  {
    id: 'soc-inv-06',
    category: 'social',
    subcategory: 'inviting-declining',
    level: 'B1',
    titleEn: 'Rain-check — suggesting another time',
    titleVi: 'Hẹn lại dịp khác — gợi ý thời gian khác',
    icon: 'CloudRain',
    situationVi: 'Bạn được mời tham gia một hoạt động, nhưng bạn đang quá bận rộn. Bạn từ chối khéo léo và đề xuất một thời điểm khác để gặp mặt (take a rain check).',
    sampleDialogue: [
      { speaker: 'A', text: 'A few of us are going bowling tomorrow evening. Care to join?', translationVi: 'Một vài người trong chúng tôi định đi chơi bowling vào tối mai. Bạn có muốn tham gia không?' },
      { speaker: 'B', text: 'I would love to, but I am swamped with this project deadline.', translationVi: 'Tôi rất muốn, nhưng tôi đang ngập đầu trong deadline của dự án này.' },
      { speaker: 'A', text: 'Ah, I understand. Working late again?', translationVi: 'À, tôi hiểu. Lại làm việc muộn à?' },
      { speaker: 'B', text: 'Yes, probably until 9 PM. Can I take a rain check?', translationVi: 'Vâng, có lẽ đến 9 giờ tối. Tôi có thể hẹn lại dịp khác được không?' },
      { speaker: 'A', text: 'Absolutely. We go almost every month, so you can join us next time.', translationVi: 'Chắc chắn rồi. Chúng tôi đi hầu như mỗi tháng, vì vậy bạn có thể tham gia vào lần sau.' },
      { speaker: 'B', text: 'Perfect. How about we grab lunch next Tuesday instead?', translationVi: 'Hoàn hảo. Hay là thứ Ba tuần tới chúng ta đi ăn trưa thay thế nhé?' }
    ],
    keyVocabulary: [
      {
        term: 'bowling',
        ipa: '/ˈboʊlɪŋ/',
        partOfSpeech: 'noun',
        meaningVi: 'trò chơi bowling',
        exampleEn: 'Let us go bowling tonight.',
        exampleVi: 'Tối nay chúng ta đi chơi bowling nhé.',
        associatedActions: [
          { en: 'throw a bowling ball', vi: 'ném quả bóng bowling' },
          { en: 'score a strike in bowling', vi: 'ghi điểm strike trong trận bowling' },
          { en: 'play bowling with friends', vi: 'chơi bowling cùng bạn bè' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1545232979-fbf68fe9b1af?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'swamped',
        ipa: '/swɑːmpt/',
        partOfSpeech: 'adj',
        meaningVi: 'ngập đầu (trong công việc)',
        exampleEn: 'I am swamped with work right now.',
        exampleVi: 'Hiện tại tôi đang ngập đầu trong công việc.',
        associatedActions: [
          { en: 'get swamped with urgent tasks', vi: 'ngập đầu với những nhiệm vụ khẩn' },
          { en: 'work overtime when swamped', vi: 'làm thêm giờ khi ngập đầu công việc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'deadline',
        ipa: '/ˈdedlaɪn/',
        partOfSpeech: 'noun',
        meaningVi: 'hạn chót',
        exampleEn: 'I have to meet a tight deadline.',
        exampleVi: 'Tôi phải hoàn thành một hạn chót gấp gáp.',
        associatedActions: [
          { en: 'meet a strict deadline', vi: 'kịp hạn chót nghiêm ngặt' },
          { en: 'extend a project deadline', vi: 'gia hạn hạn chót dự án' },
          { en: 'miss a tight deadline', vi: 'bị trễ hạn chót gấp gáp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'rain check',
        ipa: '/reɪn tʃek/',
        partOfSpeech: 'noun',
        meaningVi: 'lời hẹn lại dịp khác',
        exampleEn: 'Can I take a rain check on that offer?',
        exampleVi: 'Tôi có thể hẹn lại lời đề nghị đó vào dịp khác không?',
        associatedActions: [
          { en: 'take a rain check on dinner', vi: 'hẹn lại bữa tối vào dịp khác' },
          { en: 'offer a rain check politely', vi: 'nhã nhặn đề xuất hẹn dịp khác' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'probably',
        ipa: '/ˈprɑːbəbli/',
        partOfSpeech: 'adv',
        meaningVi: 'có lẽ, có khả năng',
        exampleEn: 'It will probably rain tomorrow.',
        exampleVi: 'Ngày mai có lẽ trời sẽ mưa.',
        associatedActions: [
          { en: 'estimate what probably happens', vi: 'ước chừng điều có khả năng xảy ra' },
          { en: 'make a probable forecast', vi: 'đưa ra dự báo có xác suất cao' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Care to join?', translationVi: 'Có muốn tham gia không?' },
      { phrase: 'I am swamped with...', translationVi: 'Tôi đang ngập đầu trong...' },
      { phrase: 'Can I take a rain check?', translationVi: 'Tôi có thể hẹn lại dịp khác được không?' },
      { phrase: 'You can join us next time.', translationVi: 'Lần tới bạn có thể tham gia cùng chúng tôi.' },
      { phrase: 'How about we... instead?', translationVi: 'Thay vào đó chúng ta ... thì sao?' }
    ],
    aiTutorPrompt: 'You invite the user to go bowling tomorrow. When they say they are too busy with work and ask for a rain check, agree cheerfully and accept their alternative suggestion for lunch.',
    tags: ['declining', 'busy', 'rescheduling']
  }
];
