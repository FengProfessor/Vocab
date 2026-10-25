/**
 * LingoPro Speaking Topic Library
 * Category: Social
 * Subcategory: Apologizing
 * File: src/data/speaking/topic-library/social/apologizing.ts
 *
 * 6 sub-topics covering saying sorry and making amends in various contexts.
 * CEFR Range: A1 - B2
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const APOLOGIZING_ITEMS: TopicLibraryItem[] = [
  {
    id: 'soc-apol-01',
    category: 'social',
    subcategory: 'apologizing',
    level: 'A1',
    titleEn: 'Being late to a meeting',
    titleVi: 'Đến trễ cuộc họp',
    icon: 'Clock',
    situationVi: 'Bạn đến muộn trong một cuộc gặp với bạn bè tại quán cà phê do lỡ chuyến xe buýt. Bạn vội vàng xin lỗi ngay khi vừa tới.',
    sampleDialogue: [
      { speaker: 'A', text: 'I am so sorry I am late!', translationVi: 'Mình rất xin lỗi vì đã đến trễ!' },
      { speaker: 'B', text: 'It is okay. I just got here 10 minutes ago. What happened?', translationVi: 'Không sao đâu. Mình cũng mới đến đây 10 phút trước. Có chuyện gì vậy?' },
      { speaker: 'A', text: 'I missed the bus. I had to wait a long time for the next one.', translationVi: 'Mình bị lỡ xe buýt. Mình đã phải đợi chuyến tiếp theo rất lâu.' },
      { speaker: 'B', text: 'Do not worry about it. Have you ordered a drink yet?', translationVi: 'Đừng bận tâm về chuyện đó. Bạn đã gọi đồ uống chưa?' },
      { speaker: 'A', text: 'Not yet. I will pay for your coffee today to say sorry.', translationVi: 'Chưa. Hôm nay mình sẽ trả tiền cà phê cho bạn để xin lỗi nhé.' },
      { speaker: 'B', text: 'Thanks! That is very nice of you.', translationVi: 'Cảm ơn! Bạn thật tốt.' }
    ],
    keyVocabulary: [
      {
        term: 'late',
        ipa: '/leɪt/',
        partOfSpeech: 'adj',
        meaningVi: 'trễ, muộn',
        exampleEn: 'Why are you late?',
        exampleVi: 'Tại sao bạn đến trễ?',
        associatedActions: [
          { en: 'check the watch', vi: 'kiểm tra đồng hồ' },
          { en: 'hurry to the cafe', vi: 'vội vã đến quán cà phê' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'happen',
        ipa: '/ˈhæpən/',
        partOfSpeech: 'verb',
        meaningVi: 'xảy ra',
        exampleEn: 'What happened here?',
        exampleVi: 'Chuyện gì đã xảy ra ở đây?',
        associatedActions: [
          { en: 'explain the cause', vi: 'giải thích nguyên nhân' },
          { en: 'describe the event', vi: 'miêu tả sự việc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'miss',
        ipa: '/mɪs/',
        partOfSpeech: 'verb',
        meaningVi: 'lỡ (chuyến xe, tàu)',
        exampleEn: 'I missed the train.',
        exampleVi: 'Tôi lỡ chuyến tàu.',
        associatedActions: [
          { en: 'run after the bus', vi: 'chạy đuổi theo xe buýt' },
          { en: 'wait for next trip', vi: 'chờ chuyến tiếp theo' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'wait',
        ipa: '/weɪt/',
        partOfSpeech: 'verb',
        meaningVi: 'chờ đợi',
        exampleEn: 'Please wait for me.',
        exampleVi: 'Vui lòng đợi tôi.',
        associatedActions: [
          { en: 'sit at the bus stop', vi: 'ngồi tại trạm dừng xe buýt' },
          { en: 'scroll through phone', vi: 'lướt điện thoại' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'order',
        ipa: '/ˈɔːrdər/',
        partOfSpeech: 'verb',
        meaningVi: 'gọi món',
        exampleEn: 'Are you ready to order?',
        exampleVi: 'Bạn đã sẵn sàng gọi món chưa?',
        associatedActions: [
          { en: 'look at the drink menu', vi: 'nhìn vào thực đơn đồ uống' },
          { en: 'ask for hot coffee', vi: 'gọi cà phê nóng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I am so sorry I am late!', translationVi: 'Tôi rất xin lỗi vì đã đến muộn!' },
      { phrase: 'It is okay.', translationVi: 'Không sao đâu.' },
      { phrase: 'I missed the bus.', translationVi: 'Tôi bị lỡ xe buýt.' },
      { phrase: 'Do not worry about it.', translationVi: 'Đừng bận tâm về điều đó.' },
      { phrase: 'I will pay for your coffee.', translationVi: 'Tôi sẽ trả tiền cà phê cho bạn.' }
    ],
    aiTutorPrompt: 'You are waiting at a cafe. The user arrives late and apologizes. Tell them it is okay, ask what happened, and accept their offer to buy you a coffee.',
    tags: ['late', 'friends', 'excuses']
  },
  {
    id: 'soc-apol-02',
    category: 'social',
    subcategory: 'apologizing',
    level: 'A2',
    titleEn: 'Accidentally breaking something',
    titleVi: 'Vô tình làm vỡ đồ',
    icon: 'AlertOctagon',
    situationVi: 'Khi đến thăm nhà bạn, bạn vô tình làm rơi vỡ một chiếc cốc yêu thích của họ. Bạn cảm thấy vô cùng áy náy và xin lỗi.',
    sampleDialogue: [
      { speaker: 'A', text: 'Oh no! I am so sorry, I dropped your mug.', translationVi: 'Ôi không! Mình rất xin lỗi, mình làm rơi cái cốc của bạn rồi.' },
      { speaker: 'B', text: 'Oh, my favorite mug! It is broken into pieces.', translationVi: 'Ôi, chiếc cốc yêu thích của mình! Nó vỡ thành từng mảnh rồi.' },
      { speaker: 'A', text: 'I feel terrible. It slipped right out of my hand. Let me clean this up.', translationVi: 'Mình cảm thấy thật tồi tệ. Nó trượt khỏi tay mình. Để mình dọn dẹp chỗ này.' },
      { speaker: 'B', text: 'Be careful, the glass is sharp. I will get a broom.', translationVi: 'Cẩn thận nhé, mảnh kính sắc lắm. Mình sẽ đi lấy chổi.' },
      { speaker: 'A', text: 'I promise I will buy you a new one exactly like it.', translationVi: 'Mình hứa sẽ mua cho bạn một cái mới y hệt như thế.' },
      { speaker: 'B', text: 'It is just a mug, accidents happen. Do not feel too bad.', translationVi: 'Nó chỉ là cái cốc thôi, tai nạn là điều không tránh khỏi. Đừng cảm thấy quá áy náy.' }
    ],
    keyVocabulary: [
      {
        term: 'drop',
        ipa: '/drɑːp/',
        partOfSpeech: 'verb',
        meaningVi: 'đánh rơi',
        exampleEn: 'Do not drop the plates.',
        exampleVi: 'Đừng đánh rơi những cái đĩa.',
        associatedActions: [
          { en: 'lose grip on object', vi: 'tuột tay khỏi đồ vật' },
          { en: 'pick up from floor', vi: 'nhặt lên từ sàn nhà' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'broken',
        ipa: '/ˈbroʊkən/',
        partOfSpeech: 'adj',
        meaningVi: 'bị vỡ, hỏng',
        exampleEn: 'The window is broken.',
        exampleVi: 'Cửa sổ bị vỡ.',
        associatedActions: [
          { en: 'inspect the damage', vi: 'kiểm tra vết vỡ hỏng' },
          { en: 'gather shattered pieces', vi: 'thu gom các mảnh vỡ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'slip',
        ipa: '/slɪp/',
        partOfSpeech: 'verb',
        meaningVi: 'trượt',
        exampleEn: 'The phone slipped from my hand.',
        exampleVi: 'Điện thoại trượt khỏi tay tôi.',
        associatedActions: [
          { en: 'lose firm balance', vi: 'mất thăng bằng chắc chắn' },
          { en: 'catch before falling', vi: 'chụp lấy trước khi rơi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'sharp',
        ipa: '/ʃɑːrp/',
        partOfSpeech: 'adj',
        meaningVi: 'sắc, bén',
        exampleEn: 'This knife is very sharp.',
        exampleVi: 'Con dao này rất sắc.',
        associatedActions: [
          { en: 'avoid touching edge', vi: 'tránh chạm vào cạnh sắc' },
          { en: 'wrap in thick paper', vi: 'bọc vào giấy dày' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'broom',
        ipa: '/bruːm/',
        partOfSpeech: 'noun',
        meaningVi: 'cái chổi',
        exampleEn: 'Sweep the floor with a broom.',
        exampleVi: 'Quét nhà bằng chổi.',
        associatedActions: [
          { en: 'sweep broken glass', vi: 'quét sạch mảnh kính vỡ' },
          { en: 'store in closet', vi: 'cất vào tủ chứa đồ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I am so sorry, I dropped your...', translationVi: 'Tôi rất xin lỗi, tôi đã làm rơi ... của bạn.' },
      { phrase: 'I feel terrible.', translationVi: 'Tôi cảm thấy thật tồi tệ.' },
      { phrase: 'Let me clean this up.', translationVi: 'Để tôi dọn dẹp chỗ này.' },
      { phrase: 'I promise I will buy you a new one.', translationVi: 'Tôi hứa sẽ mua cho bạn một cái mới.' },
      { phrase: 'Accidents happen.', translationVi: 'Tai nạn là điều khó tránh khỏi.' }
    ],
    aiTutorPrompt: 'The user is visiting your house and accidentally breaks your favorite mug. Act initially surprised/disappointed, but then forgive them and help them clean up.',
    tags: ['accidents', 'apology', 'friends']
  },
  {
    id: 'soc-apol-03',
    category: 'social',
    subcategory: 'apologizing',
    level: 'A2',
    titleEn: 'Forgetting someone\'s birthday',
    titleVi: 'Quên sinh nhật ai đó',
    icon: 'CalendarX',
    situationVi: 'Bạn nhận ra mình đã quên sinh nhật của một người bạn thân vào ngày hôm qua. Bạn gọi điện để xin lỗi họ ngay lập tức.',
    sampleDialogue: [
      { speaker: 'A', text: 'Hey, I am so sorry. I completely forgot your birthday yesterday.', translationVi: 'Này, mình rất xin lỗi. Mình hoàn toàn quên mất sinh nhật của bạn hôm qua.' },
      { speaker: 'B', text: 'Oh, that is okay. I know you have been very busy.', translationVi: 'Ồ, không sao đâu. Mình biết dạo này bạn rất bận.' },
      { speaker: 'A', text: 'I still feel awful about it. Happy belated birthday!', translationVi: 'Mình vẫn cảm thấy rất tồi tệ về điều đó. Chúc mừng sinh nhật muộn nhé!' },
      { speaker: 'B', text: 'Thank you! We just had a quiet dinner at home anyway.', translationVi: 'Cảm ơn! Dù sao bọn mình cũng chỉ ăn một bữa tối yên tĩnh ở nhà thôi.' },
      { speaker: 'A', text: 'I would love to take you out for lunch this weekend to make up for it.', translationVi: 'Mình rất muốn mời bạn đi ăn trưa cuối tuần này để bù đắp.' },
      { speaker: 'B', text: 'That is really sweet of you. I would love that.', translationVi: 'Bạn thật ngọt ngào. Mình rất sẵn lòng.' }
    ],
    keyVocabulary: [
      {
        term: 'forget',
        ipa: '/fərˈɡet/',
        partOfSpeech: 'verb',
        meaningVi: 'quên',
        exampleEn: 'I forgot my password.',
        exampleVi: 'Tôi đã quên mật khẩu của mình.',
        associatedActions: [
          { en: 'check personal calendar', vi: 'kiểm tra lịch cá nhân' },
          { en: 'apologize for memory lapse', vi: 'xin lỗi vì đã quên khuấy đi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'awful',
        ipa: '/ˈɔːfl/',
        partOfSpeech: 'adj',
        meaningVi: 'tồi tệ, kinh khủng',
        exampleEn: 'I feel awful about the mistake.',
        exampleVi: 'Tôi cảm thấy tồi tệ về sai lầm đó.',
        associatedActions: [
          { en: 'feel deep regret', vi: 'cảm thấy vô cùng hối hận' },
          { en: 'express sincere regret', vi: 'bày tỏ sự hối tiếc chân thành' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'belated',
        ipa: '/bɪˈleɪtɪd/',
        partOfSpeech: 'adj',
        meaningVi: 'muộn, trễ',
        exampleEn: 'Happy belated birthday!',
        exampleVi: 'Chúc mừng sinh nhật muộn!',
        associatedActions: [
          { en: 'send greeting card', vi: 'gửi thiệp chúc mừng' },
          { en: 'send message late', vi: 'gửi tin nhắn muộn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'quiet',
        ipa: '/ˈkwaɪət/',
        partOfSpeech: 'adj',
        meaningVi: 'yên tĩnh',
        exampleEn: 'We had a quiet evening.',
        exampleVi: 'Chúng tôi đã có một buổi tối yên tĩnh.',
        associatedActions: [
          { en: 'relax in peaceful room', vi: 'thư giãn trong phòng yên bình' },
          { en: 'turn off noisy devices', vi: 'tắt các thiết bị ồn ào' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'make up for',
        ipa: '/meɪk ʌp fɔːr/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'bù đắp cho',
        exampleEn: 'I will buy you dinner to make up for it.',
        exampleVi: 'Tôi sẽ mời bạn bữa tối để bù đắp.',
        associatedActions: [
          { en: 'buy surprise gift', vi: 'mua quà bất ngờ' },
          { en: 'invite out for dinner', vi: 'mời đi ăn tối' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I completely forgot your birthday.', translationVi: 'Tôi hoàn toàn quên sinh nhật của bạn.' },
      { phrase: 'I know you have been very busy.', translationVi: 'Tôi biết dạo này bạn rất bận.' },
      { phrase: 'I still feel awful about it.', translationVi: 'Tôi vẫn cảm thấy rất tồi tệ về chuyện đó.' },
      { phrase: 'Happy belated birthday!', translationVi: 'Chúc mừng sinh nhật muộn!' },
      { phrase: 'To make up for it.', translationVi: 'Để bù đắp cho chuyện đó.' }
    ],
    aiTutorPrompt: 'The user calls to apologize for forgetting your birthday yesterday. Be understanding and accept their offer to take you out for lunch to make up for it.',
    tags: ['birthday', 'mistakes', 'friendship']
  },
  {
    id: 'soc-apol-04',
    category: 'social',
    subcategory: 'apologizing',
    level: 'B1',
    titleEn: 'Apologizing for a misunderstanding',
    titleVi: 'Xin lỗi vì một sự hiểu lầm',
    icon: 'MessageSquareOff',
    situationVi: 'Bạn đã lỡ lời hoặc nói điều gì đó khiến đồng nghiệp hiểu sai ý và tự ái. Bạn chủ động tìm họ để giải thích và xin lỗi.',
    sampleDialogue: [
      { speaker: 'A', text: 'Hey, do you have a minute? I want to apologize for what I said in the meeting.', translationVi: 'Chào, bạn có rảnh một phút không? Mình muốn xin lỗi về những gì mình đã nói trong cuộc họp.' },
      { speaker: 'B', text: 'Oh. I have to admit, I was a bit offended by your comment about my project.', translationVi: 'Ồ. Mình phải thừa nhận là mình đã hơi bị xúc phạm bởi nhận xét của bạn về dự án của mình.' },
      { speaker: 'A', text: 'I realize that now, and I am truly sorry. It came out completely wrong.', translationVi: 'Bây giờ mình đã nhận ra điều đó, và mình thực sự xin lỗi. Lời nói thốt ra đã hoàn toàn sai ý.' },
      { speaker: 'B', text: 'What did you actually mean?', translationVi: 'Thực sự thì ý bạn là gì?' },
      { speaker: 'A', text: 'I just meant that the timeline is tight, not that your work was poor quality. It was a misunderstanding.', translationVi: 'Mình chỉ có ý là thời gian thì gấp rút, chứ không phải chất lượng công việc của bạn kém. Đó là một sự hiểu lầm.' },
      { speaker: 'B', text: 'I appreciate you clarifying that. Apology accepted.', translationVi: 'Mình cảm ơn vì bạn đã làm rõ điều đó. Mình chấp nhận lời xin lỗi.' }
    ],
    keyVocabulary: [
      {
        term: 'apologize',
        ipa: '/əˈpɑːlədʒaɪz/',
        partOfSpeech: 'verb',
        meaningVi: 'xin lỗi',
        exampleEn: 'I want to apologize for my mistake.',
        exampleVi: 'Tôi muốn xin lỗi vì lỗi lầm của mình.',
        associatedActions: [
          { en: 'say sorry directly', vi: 'nói lời xin lỗi trực tiếp' },
          { en: 'offer an olive branch', vi: 'chủ động làm hòa' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'offend',
        ipa: '/əˈfend/',
        partOfSpeech: 'verb',
        meaningVi: 'xúc phạm, làm phật ý',
        exampleEn: 'I did not mean to offend you.',
        exampleVi: 'Tôi không cố ý làm bạn phật ý.',
        associatedActions: [
          { en: 'misinterpret a joke', vi: 'hiểu lầm một lời đùa' },
          { en: 'show hurt feelings', vi: 'thể hiện sự tổn thương' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'timeline',
        ipa: '/ˈtaɪmlaɪn/',
        partOfSpeech: 'noun',
        meaningVi: 'tiến độ, thời gian biểu',
        exampleEn: 'The project timeline is very tight.',
        exampleVi: 'Tiến độ dự án rất gấp rút.',
        associatedActions: [
          { en: 'set project deadlines', vi: 'đặt thời hạn dự án' },
          { en: 'review progress milestones', vi: 'xem xét các mốc tiến độ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'misunderstanding',
        ipa: '/ˌmɪsʌndərˈstændɪŋ/',
        partOfSpeech: 'noun',
        meaningVi: 'sự hiểu lầm',
        exampleEn: 'It was just a simple misunderstanding.',
        exampleVi: 'Đó chỉ là một sự hiểu lầm đơn giản.',
        associatedActions: [
          { en: 'talk through issues', vi: 'nói chuyện giải quyết vấn đề' },
          { en: 'clear the air', vi: 'xóa bỏ mọi hiểu lầm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'clarify',
        ipa: '/ˈklærəfaɪ/',
        partOfSpeech: 'verb',
        meaningVi: 'làm rõ',
        exampleEn: 'Could you clarify your point?',
        exampleVi: 'Bạn có thể làm rõ ý của bạn không?',
        associatedActions: [
          { en: 'explain intended meaning', vi: 'giải thích ý định muốn nói' },
          { en: 'ask follow-up questions', vi: 'đặt câu hỏi tiếp nối' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I want to apologize for...', translationVi: 'Tôi muốn xin lỗi vì...' },
      { phrase: 'I was a bit offended by...', translationVi: 'Tôi có hơi bị xúc phạm bởi...' },
      { phrase: 'It came out completely wrong.', translationVi: 'Lời nói thốt ra đã hoàn toàn sai ý.' },
      { phrase: 'I appreciate you clarifying that.', translationVi: 'Tôi trân trọng việc bạn làm rõ điều đó.' },
      { phrase: 'Apology accepted.', translationVi: 'Lời xin lỗi được chấp nhận.' }
    ],
    aiTutorPrompt: 'You are a coworker. The user approaches you to apologize for a comment they made that sounded critical. Act slightly hurt at first, ask for clarification, and then accept their apology.',
    tags: ['work', 'misunderstanding', 'communication']
  },
  {
    id: 'soc-apol-05',
    category: 'social',
    subcategory: 'apologizing',
    level: 'B1',
    titleEn: 'Apologizing to a customer/client',
    titleVi: 'Xin lỗi khách hàng/đối tác',
    icon: 'UserMinus',
    situationVi: 'Bạn làm việc trong một nhà hàng và đã mang nhầm món ăn cho khách. Bạn tiến đến bàn để xin lỗi và đưa ra hướng giải quyết.',
    sampleDialogue: [
      { speaker: 'A', text: 'Excuse me, sir. I sincerely apologize, but it seems I brought you the wrong order.', translationVi: 'Xin lỗi ngài. Tôi thành thật xin lỗi, nhưng có vẻ như tôi đã mang nhầm món cho ngài.' },
      { speaker: 'B', text: 'Yes, I noticed. I ordered the grilled salmon, not the steak.', translationVi: 'Vâng, tôi đã nhận ra. Tôi gọi cá hồi nướng, không phải bít tết.' },
      { speaker: 'A', text: 'I am so sorry for the mix-up. I will take this back to the kitchen immediately.', translationVi: 'Tôi rất xin lỗi vì sự nhầm lẫn này. Tôi sẽ mang đĩa này trở lại bếp ngay lập tức.' },
      { speaker: 'B', text: 'How long will it take for my salmon to be ready?', translationVi: 'Mất bao lâu thì món cá hồi của tôi mới xong?' },
      { speaker: 'A', text: 'I will ask the chef to make it a priority. It should be less than 10 minutes.', translationVi: 'Tôi sẽ yêu cầu bếp trưởng ưu tiên làm nó. Sẽ mất chưa tới 10 phút đâu ạ.' },
      { speaker: 'B', text: 'Alright, I will wait. Thank you for fixing it.', translationVi: 'Được rồi, tôi sẽ đợi. Cảm ơn vì đã sửa sai.' }
    ],
    keyVocabulary: [
      {
        term: 'sincerely',
        ipa: '/sɪnˈsɪrli/',
        partOfSpeech: 'adv',
        meaningVi: 'thành thật, chân thành',
        exampleEn: 'I sincerely apologize.',
        exampleVi: 'Tôi thành thật xin lỗi.',
        associatedActions: [
          { en: 'speak with empathy', vi: 'nói chuyện với sự thấu cảm' },
          { en: 'look in the eyes', vi: 'nhìn vào mắt đối phương' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'wrong',
        ipa: '/rɔːŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'sai, nhầm',
        exampleEn: 'You gave me the wrong number.',
        exampleVi: 'Bạn cho tôi nhầm số rồi.',
        associatedActions: [
          { en: 'spot an error', vi: 'phát hiện một lỗi sai' },
          { en: 'replace incorrect item', vi: 'thay thế món đồ không đúng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'mix-up',
        ipa: '/ˈmɪks ʌp/',
        partOfSpeech: 'noun',
        meaningVi: 'sự nhầm lẫn',
        exampleEn: 'There was a mix-up with our reservations.',
        exampleVi: 'Đã có sự nhầm lẫn với việc đặt chỗ của chúng tôi.',
        associatedActions: [
          { en: 'confuse two tickets', vi: 'nhầm lẫn giữa hai vé' },
          { en: 'sort out confusion', vi: 'gỡ rối sự nhầm lẫn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'immediately',
        ipa: '/ɪˈmiːdiətli/',
        partOfSpeech: 'adv',
        meaningVi: 'ngay lập tức',
        exampleEn: 'Please leave immediately.',
        exampleVi: 'Vui lòng rời đi ngay lập tức.',
        associatedActions: [
          { en: 'act without delay', vi: 'hành động không chậm trễ' },
          { en: 'rush to the kitchen', vi: 'vội vã đi vào bếp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'priority',
        ipa: '/praɪˈɔːrəti/',
        partOfSpeech: 'noun',
        meaningVi: 'sự ưu tiên',
        exampleEn: 'Customer satisfaction is our top priority.',
        exampleVi: 'Sự hài lòng của khách hàng là ưu tiên hàng đầu của chúng tôi.',
        associatedActions: [
          { en: 'place at top of list', vi: 'xếp lên đầu danh sách' },
          { en: 'serve urgent orders', vi: 'phục vụ đơn hàng khẩn cấp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I sincerely apologize.', translationVi: 'Tôi thành thật xin lỗi.' },
      { phrase: 'I brought you the wrong order.', translationVi: 'Tôi đã mang nhầm món cho ngài.' },
      { phrase: 'I am so sorry for the mix-up.', translationVi: 'Tôi rất xin lỗi vì sự nhầm lẫn này.' },
      { phrase: 'I will make it a priority.', translationVi: 'Tôi sẽ ưu tiên việc đó.' },
      { phrase: 'Thank you for fixing it.', translationVi: 'Cảm ơn vì đã khắc phục.' }
    ],
    aiTutorPrompt: 'You are a customer at a restaurant. The user (a waiter) brings you the wrong dish and apologizes. Point out the mistake firmly but politely and ask how long it will take to get your correct food.',
    tags: ['customer service', 'restaurant', 'mistakes']
  },
  {
    id: 'soc-apol-06',
    category: 'social',
    subcategory: 'apologizing',
    level: 'B2',
    titleEn: 'Making amends after an argument',
    titleVi: 'Làm hòa sau một cuộc cãi vã',
    icon: 'HeartHandshake',
    situationVi: 'Hôm qua bạn và người bạn đời/người yêu đã có một trận cãi vã lớn. Bạn là người chủ động bắt chuyện để xin lỗi và hàn gắn mối quan hệ.',
    sampleDialogue: [
      { speaker: 'A', text: 'Can we talk? I want to say I am sorry about how I acted last night.', translationVi: 'Chúng ta nói chuyện được không? Anh muốn xin lỗi về cách anh hành xử tối qua.' },
      { speaker: 'B', text: 'I am still pretty upset. You said some hurtful things.', translationVi: 'Em vẫn còn khá buồn. Anh đã nói một số điều gây tổn thương.' },
      { speaker: 'A', text: 'I know, and I deeply regret it. I lost my temper, but that is no excuse.', translationVi: 'Anh biết, và anh vô cùng hối hận. Anh đã mất bình tĩnh, nhưng đó không phải là cái cớ.' },
      { speaker: 'B', text: 'It feels like you never listen to my side when we argue.', translationVi: 'Cảm giác như anh không bao giờ lắng nghe quan điểm của em khi chúng ta cãi nhau.' },
      { speaker: 'A', text: 'You are right. I need to be better at listening instead of getting defensive. I will work on that.', translationVi: 'Em đúng. Anh cần phải giỏi lắng nghe hơn thay vì trở nên phòng thủ. Anh sẽ cố gắng sửa đổi điều đó.' },
      { speaker: 'B', text: 'I appreciate you acknowledging that. I am sorry too for raising my voice.', translationVi: 'Em trân trọng việc anh đã thừa nhận điều đó. Em cũng xin lỗi vì đã lớn tiếng.' }
    ],
    keyVocabulary: [
      {
        term: 'upset',
        ipa: '/ʌpˈset/',
        partOfSpeech: 'adj',
        meaningVi: 'buồn bã, tức giận',
        exampleEn: 'She was upset about the news.',
        exampleVi: 'Cô ấy đã rất buồn về tin tức đó.',
        associatedActions: [
          { en: 'take a deep breath', vi: 'hít một hơi thật sâu' },
          { en: 'comfort an upset partner', vi: 'an ủi người bạn đời đang buồn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'hurtful',
        ipa: '/ˈhɜːrtfl/',
        partOfSpeech: 'adj',
        meaningVi: 'gây tổn thương',
        exampleEn: 'Those were very hurtful words.',
        exampleVi: 'Đó là những lời nói rất gây tổn thương.',
        associatedActions: [
          { en: 'regret harsh words', vi: 'hối tiếc vì lời nói cay nghiệt' },
          { en: 'ask for forgiveness', vi: 'xin được tha thứ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'regret',
        ipa: '/rɪˈɡret/',
        partOfSpeech: 'verb',
        meaningVi: 'hối hận, hối tiếc',
        exampleEn: 'I regret saying that.',
        exampleVi: 'Tôi hối hận vì đã nói điều đó.',
        associatedActions: [
          { en: 'admit personal fault', vi: 'thừa nhận lỗi của bản thân' },
          { en: 'strive to do better', vi: 'cố gắng làm tốt hơn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'temper',
        ipa: '/ˈtempər/',
        partOfSpeech: 'noun',
        meaningVi: 'sự bình tĩnh/nóng giận',
        exampleEn: 'He lost his temper and shouted.',
        exampleVi: 'Anh ấy mất bình tĩnh và hét lên.',
        associatedActions: [
          { en: 'lose emotional control', vi: 'mất kiểm soát cảm xúc' },
          { en: 'cool down with water', vi: 'uống nước để hạ hỏa' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'defensive',
        ipa: '/dɪˈfensɪv/',
        partOfSpeech: 'adj',
        meaningVi: 'phòng thủ, tự ái bảo vệ mình',
        exampleEn: 'Do not get so defensive.',
        exampleVi: 'Đừng quá phòng thủ như vậy.',
        associatedActions: [
          { en: 'lower defensive barrier', vi: 'hạ bớt sự phòng thủ' },
          { en: 'listen without interrupting', vi: 'lắng nghe không ngắt lời' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I am sorry about how I acted.', translationVi: 'Tôi xin lỗi về cách tôi đã hành xử.' },
      { phrase: 'I deeply regret it.', translationVi: 'Tôi vô cùng hối hận về điều đó.' },
      { phrase: 'I lost my temper.', translationVi: 'Tôi đã mất bình tĩnh.' },
      { phrase: 'That is no excuse.', translationVi: 'Đó không phải là lời bào chữa.' },
      { phrase: 'I will work on that.', translationVi: 'Tôi sẽ cố gắng sửa đổi/cải thiện điều đó.' }
    ],
    aiTutorPrompt: 'You are the user\'s partner. You had a big fight last night. The user approaches you to apologize. Express that you are still hurt, explain why, but eventually accept the apology and take some blame yourself.',
    tags: ['relationship', 'argument', 'forgiveness']
  }
];
