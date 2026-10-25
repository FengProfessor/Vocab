/**
 * LingoPro Speaking Topic Library
 * Category: Social
 * Subcategory: Telling Stories
 * File: src/data/speaking/topic-library/social/telling-stories.ts
 *
 * 6 sub-topics covering narrating past events and personal experiences.
 * CEFR Range: A2 - B1
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const TELLING_STORIES_ITEMS: TopicLibraryItem[] = [
  {
    id: 'soc-story-01',
    category: 'social',
    subcategory: 'telling-stories',
    level: 'A2',
    titleEn: 'A funny thing that happened today',
    titleVi: 'Một chuyện hài hước xảy ra hôm nay',
    icon: 'Smile',
    situationVi: 'Bạn vừa về đến nhà và kể cho bạn cùng phòng nghe về một tình huống dở khóc dở cười mà bạn gặp phải trên đường đi làm.',
    sampleDialogue: [
      { speaker: 'A', text: 'You will never guess what happened to me this morning.', translationVi: 'Bạn sẽ không đoán được chuyện gì đã xảy ra với mình sáng nay đâu.' },
      { speaker: 'B', text: 'What? You look like you are trying not to laugh.', translationVi: 'Chuyện gì vậy? Trông bạn như đang cố nhịn cười kìa.' },
      { speaker: 'A', text: 'I was walking to the office, and I waved to this guy across the street.', translationVi: 'Mình đang đi bộ đến văn phòng, và mình vẫy tay chào một anh chàng bên kia đường.' },
      { speaker: 'B', text: 'Did you know him?', translationVi: 'Bạn có quen anh ta không?' },
      { speaker: 'A', text: 'I thought he was my boss! He waved back, but when I got closer, it was a total stranger.', translationVi: 'Mình tưởng đó là sếp của mình! Anh ta vẫy lại, nhưng khi mình lại gần, đó là một người hoàn toàn xa lạ.' },
      { speaker: 'B', text: 'Oh no! That is hilarious. What did you do?', translationVi: 'Ôi không! Thật buồn cười. Bạn đã làm gì?' }
    ],
    keyVocabulary: [
      {
        term: 'guess',
        ipa: '/ɡes/',
        partOfSpeech: 'verb',
        meaningVi: 'đoán',
        exampleEn: 'Guess who I saw today.',
        exampleVi: 'Đoán xem hôm nay tôi gặp ai.',
        associatedActions: [
          { en: 'make a quick guess', vi: 'đoán nhanh một câu' },
          { en: 'guess the answer correctly', vi: 'đoán đúng câu trả lời' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'laugh',
        ipa: '/læf/',
        partOfSpeech: 'verb',
        meaningVi: 'cười',
        exampleEn: 'The joke made me laugh.',
        exampleVi: 'Câu chuyện cười làm tôi bật cười.',
        associatedActions: [
          { en: 'burst into cheerful laughter', vi: 'bật cười vui vẻ' },
          { en: 'laugh out loud at a joke', vi: 'cười lớn trước câu chuyện đùa' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'wave',
        ipa: '/weɪv/',
        partOfSpeech: 'verb',
        meaningVi: 'vẫy tay',
        exampleEn: 'She waved at me from the car.',
        exampleVi: 'Cô ấy vẫy tay với tôi từ trong xe.',
        associatedActions: [
          { en: 'wave to a friend across the street', vi: 'vẫy tay chào bạn bên kia đường' },
          { en: 'wave hello warmly', vi: 'vẫy tay chào thân thiện' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'stranger',
        ipa: '/ˈstreɪndʒər/',
        partOfSpeech: 'noun',
        meaningVi: 'người lạ',
        exampleEn: 'Do not talk to strangers.',
        exampleVi: 'Đừng nói chuyện với người lạ.',
        associatedActions: [
          { en: 'mistake a stranger for a friend', vi: 'nhận nhầm người lạ là người quen' },
          { en: 'smile at a passing stranger', vi: 'mỉm cười với người lạ qua đường' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'hilarious',
        ipa: '/hɪˈleriəs/',
        partOfSpeech: 'adj',
        meaningVi: 'rất hài hước, buồn cười',
        exampleEn: 'That movie was hilarious.',
        exampleVi: 'Bộ phim đó rất hài hước.',
        associatedActions: [
          { en: 'tell a hilarious story', vi: 'kể một câu chuyện buồn cười' },
          { en: 'find a funny incident hilarious', vi: 'thấy một sự cố hài hước đến cười bò' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'You will never guess what happened.', translationVi: 'Bạn sẽ không đoán được chuyện gì đã xảy ra đâu.' },
      { phrase: 'I was walking to...', translationVi: 'Tôi đang đi bộ đến...' },
      { phrase: 'I thought he was...', translationVi: 'Tôi tưởng anh ấy là...' },
      { phrase: 'It was a total stranger.', translationVi: 'Đó là một người hoàn toàn xa lạ.' },
      { phrase: 'That is hilarious.', translationVi: 'Thật buồn cười.' }
    ],
    aiTutorPrompt: 'You are the user\'s roommate. They come home wanting to tell you a funny story about mistaking a stranger for their boss. React with curiosity and amusement.',
    tags: ['funny', 'daily life', 'mistake']
  },
  {
    id: 'soc-story-02',
    category: 'social',
    subcategory: 'telling-stories',
    level: 'A2',
    titleEn: 'My most embarrassing moment',
    titleVi: 'Khoảnh khắc xấu hổ nhất của tôi',
    icon: 'Frown',
    situationVi: 'Trong một buổi gặp gỡ bạn bè, mọi người chia sẻ về những tình huống ngượng ngùng nhất của mình. Bạn kể về lần bạn mắc lỗi trước đám đông.',
    sampleDialogue: [
      { speaker: 'A', text: 'My most embarrassing moment was during a school play.', translationVi: 'Khoảnh khắc đáng xấu hổ nhất của tôi là trong một vở kịch ở trường.' },
      { speaker: 'B', text: 'Really? What went wrong?', translationVi: 'Thật sao? Có chuyện gì không ổn à?' },
      { speaker: 'A', text: 'I had to sing a solo, but I completely forgot the lyrics.', translationVi: 'Tôi phải hát solo một đoạn, nhưng tôi hoàn toàn quên mất lời bài hát.' },
      { speaker: 'B', text: 'Oh my gosh! Did everyone notice?', translationVi: 'Trời ơi! Mọi người có để ý không?' },
      { speaker: 'A', text: 'Yes, it was so quiet. I just stood there turning red until the music stopped.', translationVi: 'Có, lúc đó im lặng lắm. Tôi chỉ đứng đó, mặt đỏ bừng cho đến khi nhạc dừng.' },
      { speaker: 'B', text: 'That sounds awful. But at least it is a good story now.', translationVi: 'Nghe tệ thật. Nhưng ít nhất giờ nó cũng là một câu chuyện hay.' }
    ],
    keyVocabulary: [
      {
        term: 'embarrassing',
        ipa: '/ɪmˈbærəsɪŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'đáng xấu hổ, ngượng ngùng',
        exampleEn: 'It was an embarrassing situation.',
        exampleVi: 'Đó là một tình huống đáng xấu hổ.',
        associatedActions: [
          { en: 'recall an embarrassing memory', vi: 'nhớ lại kỷ niệm ngượng ngùng' },
          { en: 'hide one\'s face in embarrassment', vi: 'lấy tay che mặt vì xấu hổ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'play',
        ipa: '/pleɪ/',
        partOfSpeech: 'noun',
        meaningVi: 'vở kịch',
        exampleEn: 'He acted in a school play.',
        exampleVi: 'Anh ấy đã diễn trong một vở kịch ở trường.',
        associatedActions: [
          { en: 'perform in a school play', vi: 'biểu diễn trong vở kịch ở trường' },
          { en: 'rehearse scenes for a play', vi: 'tập dượt các cảnh cho vở kịch' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'forget',
        ipa: '/fərˈɡet/',
        partOfSpeech: 'verb',
        meaningVi: 'quên',
        exampleEn: 'Do not forget your keys.',
        exampleVi: 'Đừng quên chìa khóa của bạn.',
        associatedActions: [
          { en: 'forget lyrics on stage', vi: 'quên lời bài hát trên sân khấu' },
          { en: 'forget an important detail', vi: 'quên mất một chi tiết quan trọng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'lyrics',
        ipa: '/ˈlɪrɪks/',
        partOfSpeech: 'noun',
        meaningVi: 'lời bài hát',
        exampleEn: 'I know the lyrics to this song.',
        exampleVi: 'Tôi thuộc lời bài hát này.',
        associatedActions: [
          { en: 'memorize song lyrics', vi: 'học thuộc lòng lời bài hát' },
          { en: 'sing along with lyrics', vi: 'hát theo lời bài hát' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'notice',
        ipa: '/ˈnoʊtɪs/',
        partOfSpeech: 'verb',
        meaningVi: 'để ý, nhận ra',
        exampleEn: 'Did you notice his new haircut?',
        exampleVi: 'Bạn có để ý kiểu tóc mới của anh ấy không?',
        associatedActions: [
          { en: 'notice an awkward silence', vi: 'để ý thấy sự im lặng ngượng ngùng' },
          { en: 'notice people reacting', vi: 'nhận thấy phản ứng của mọi người' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'My most embarrassing moment was...', translationVi: 'Khoảnh khắc xấu hổ nhất của tôi là...' },
      { phrase: 'What went wrong?', translationVi: 'Có chuyện gì không ổn?' },
      { phrase: 'I completely forgot...', translationVi: 'Tôi hoàn toàn quên mất...' },
      { phrase: 'Did everyone notice?', translationVi: 'Mọi người có để ý không?' },
      { phrase: 'I turned red.', translationVi: 'Tôi đỏ mặt.' }
    ],
    aiTutorPrompt: 'You are hanging out with friends playing a game where everyone shares an embarrassing story. Listen to the user\'s story about forgetting lyrics on stage and respond sympathetically.',
    tags: ['embarrassing', 'school', 'memories']
  },
  {
    id: 'soc-story-03',
    category: 'social',
    subcategory: 'telling-stories',
    level: 'B1',
    titleEn: 'A scary experience',
    titleVi: 'Một trải nghiệm đáng sợ',
    icon: 'AlertTriangle',
    situationVi: 'Bạn kể cho đồng nghiệp nghe về một sự cố nguy hiểm hoặc đáng sợ mà bạn từng trải qua, ví dụ như bị mắc kẹt trong thang máy.',
    sampleDialogue: [
      { speaker: 'A', text: 'Have you ever been stuck in an elevator?', translationVi: 'Anh đã bao giờ bị kẹt trong thang máy chưa?' },
      { speaker: 'B', text: 'No, never. Why, did it happen to you?', translationVi: 'Chưa, chưa bao giờ. Sao, chuyện đó xảy ra với anh à?' },
      { speaker: 'A', text: 'Yeah, last year. The power went out when I was on the 10th floor.', translationVi: 'Vâng, năm ngoái. Mất điện khi tôi đang ở tầng 10.' },
      { speaker: 'B', text: 'That sounds terrifying! Were you alone?', translationVi: 'Nghe có vẻ đáng sợ thật! Anh có ở một mình không?' },
      { speaker: 'A', text: 'Fortunately, there were two other people. We were trapped for over an hour in the dark.', translationVi: 'May mắn là có hai người khác nữa. Chúng tôi bị mắc kẹt hơn một tiếng trong bóng tối.' },
      { speaker: 'B', text: 'I would have panicked. How did you get out?', translationVi: 'Tôi chắc chắn sẽ hoảng loạn. Các anh thoát ra bằng cách nào?' }
    ],
    keyVocabulary: [
      {
        term: 'stuck',
        ipa: '/stʌk/',
        partOfSpeech: 'adj',
        meaningVi: 'bị kẹt',
        exampleEn: 'The car is stuck in the mud.',
        exampleVi: 'Xe ô tô bị kẹt trong bùn.',
        associatedActions: [
          { en: 'get stuck inside an elevator', vi: 'bị mắc kẹt bên trong thang máy' },
          { en: 'stay calm when stuck', vi: 'giữ bình tĩnh khi bị kẹt' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519642918688-7e43b19245d8?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'power',
        ipa: '/ˈpaʊər/',
        partOfSpeech: 'noun',
        meaningVi: 'điện, nguồn điện',
        exampleEn: 'The power went out during the storm.',
        exampleVi: 'Mất điện trong cơn bão.',
        associatedActions: [
          { en: 'experience a sudden power cut', vi: 'trải qua sự cố mất điện đột ngột' },
          { en: 'restore electrical power', vi: 'khôi phục lại nguồn điện' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'terrifying',
        ipa: '/ˈterɪfaɪɪŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'kinh hoàng, đáng sợ',
        exampleEn: 'It was a terrifying experience.',
        exampleVi: 'Đó là một trải nghiệm kinh hoàng.',
        associatedActions: [
          { en: 'endure a terrifying moment', vi: 'trải qua khoảnh khắc kinh hoàng' },
          { en: 'overcome a terrifying fear', vi: 'vượt qua nỗi sợ kinh hoàng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'fortunately',
        ipa: '/ˈfɔːrtʃənətli/',
        partOfSpeech: 'adv',
        meaningVi: 'may mắn thay',
        exampleEn: 'Fortunately, no one was hurt.',
        exampleVi: 'May mắn thay, không có ai bị thương.',
        associatedActions: [
          { en: 'breathe a sigh of relief fortunately', vi: 'thở phào nhẹ nhõm vì may mắn' },
          { en: 'find help fortunately in time', vi: 'may mắn tìm được sự giúp đỡ kịp lúc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'trap',
        ipa: '/træp/',
        partOfSpeech: 'verb',
        meaningVi: 'mắc bẫy, mắc kẹt',
        exampleEn: 'We were trapped in the building.',
        exampleVi: 'Chúng tôi bị mắc kẹt trong tòa nhà.',
        associatedActions: [
          { en: 'get trapped in a dark space', vi: 'bị mắc kẹt trong không gian tối' },
          { en: 'rescue people trapped inside', vi: 'giải cứu những người mắc kẹt bên trong' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Have you ever been...?', translationVi: 'Bạn đã bao giờ... chưa?' },
      { phrase: 'Did it happen to you?', translationVi: 'Chuyện đó xảy ra với bạn à?' },
      { phrase: 'The power went out.', translationVi: 'Mất điện.' },
      { phrase: 'That sounds terrifying!', translationVi: 'Nghe đáng sợ thật!' },
      { phrase: 'We were trapped for over an hour.', translationVi: 'Chúng tôi bị mắc kẹt hơn một tiếng.' }
    ],
    aiTutorPrompt: 'The user asks if you have ever been stuck in an elevator. When you say no, let them tell you their scary story about being trapped when the power went out. Ask engaging follow-up questions.',
    tags: ['scary', 'accident', 'storytelling']
  },
  {
    id: 'soc-story-04',
    category: 'social',
    subcategory: 'telling-stories',
    level: 'A2',
    titleEn: 'My best vacation memory',
    titleVi: 'Kỷ niệm kỳ nghỉ tuyệt nhất của tôi',
    icon: 'Sun',
    situationVi: 'Bạn và một người bạn đang xem ảnh cũ và bạn kể cho họ nghe về chuyến đi đáng nhớ nhất của bạn cùng gia đình hoặc bạn bè.',
    sampleDialogue: [
      { speaker: 'A', text: 'This photo is from my trip to Hawaii. It was the best vacation ever.', translationVi: 'Bức ảnh này là từ chuyến đi Hawaii của tôi. Đó là kỳ nghỉ tuyệt vời nhất từ trước đến nay.' },
      { speaker: 'B', text: 'Wow, the water looks so blue! What was your favorite part?', translationVi: 'Wow, nước biển trông xanh quá! Phần bạn thích nhất là gì?' },
      { speaker: 'A', text: 'Definitely going snorkeling. We saw sea turtles swimming right next to us.', translationVi: 'Chắc chắn là đi lặn ống thở rồi. Bọn tôi thấy rùa biển bơi ngay cạnh mình luôn.' },
      { speaker: 'B', text: 'That is amazing! I have always wanted to do that.', translationVi: 'Thật tuyệt vời! Mình luôn muốn thử điều đó.' },
      { speaker: 'A', text: 'It was magical. We also ate a lot of fresh seafood on the beach.', translationVi: 'Nó rất kỳ diệu. Bọn tôi cũng ăn rất nhiều hải sản tươi sống trên bãi biển.' },
      { speaker: 'B', text: 'Sounds like a perfect trip. We should go together next time.', translationVi: 'Nghe như một chuyến đi hoàn hảo. Lần sau chúng ta nên đi cùng nhau.' }
    ],
    keyVocabulary: [
      {
        term: 'trip',
        ipa: '/trɪp/',
        partOfSpeech: 'noun',
        meaningVi: 'chuyến đi',
        exampleEn: 'How was your trip to Japan?',
        exampleVi: 'Chuyến đi Nhật Bản của bạn thế nào?',
        associatedActions: [
          { en: 'plan a tropical vacation trip', vi: 'lên kế hoạch cho chuyến đi nghỉ dưỡng nhiệt đới' },
          { en: 'take photos throughout the trip', vi: 'chụp ảnh trong suốt chuyến đi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'favorite',
        ipa: '/ˈfeɪvərɪt/',
        partOfSpeech: 'adj',
        meaningVi: 'yêu thích nhất',
        exampleEn: 'What is your favorite color?',
        exampleVi: 'Màu yêu thích của bạn là gì?',
        associatedActions: [
          { en: 'revisit a favorite holiday spot', vi: 'thăm lại điểm nghỉ dưỡng yêu thích' },
          { en: 'pick a favorite travel memory', vi: 'chọn ra kỷ niệm du lịch yêu thích nhất' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'snorkeling',
        ipa: '/ˈsnɔːrkəlɪŋ/',
        partOfSpeech: 'noun',
        meaningVi: 'lặn với ống thở',
        exampleEn: 'We went snorkeling in the coral reef.',
        exampleVi: 'Chúng tôi đi lặn ngắm rạn san hô.',
        associatedActions: [
          { en: 'go snorkeling near coral reefs', vi: 'đi lặn ngắm rạn san hô' },
          { en: 'wear a snorkeling mask', vi: 'đeo mặt nạ lặn có ống thở' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'turtle',
        ipa: '/ˈtɜːrtl/',
        partOfSpeech: 'noun',
        meaningVi: 'con rùa',
        exampleEn: 'We saw a giant sea turtle.',
        exampleVi: 'Chúng tôi đã thấy một con rùa biển khổng lồ.',
        associatedActions: [
          { en: 'spot a swimming sea turtle', vi: 'nhìn thấy rùa biển bơi lội' },
          { en: 'swim gently alongside turtles', vi: 'bơi nhẹ nhàng bên cạnh rùa biển' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'magical',
        ipa: '/ˈmædʒɪkl/',
        partOfSpeech: 'adj',
        meaningVi: 'kỳ diệu',
        exampleEn: 'The sunset was magical.',
        exampleVi: 'Hoàng hôn thật kỳ diệu.',
        associatedActions: [
          { en: 'experience a magical island sunset', vi: 'trải nghiệm hoàng hôn đảo huyền diệu' },
          { en: 'feel the magical holiday vibe', vi: 'cảm nhận không khí kỳ nghỉ huyền diệu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'It was the best vacation ever.', translationVi: 'Đó là kỳ nghỉ tuyệt vời nhất từ trước tới nay.' },
      { phrase: 'What was your favorite part?', translationVi: 'Phần bạn thích nhất là gì?' },
      { phrase: 'We saw... swimming right next to us.', translationVi: 'Chúng tôi đã thấy... bơi ngay cạnh mình.' },
      { phrase: 'I have always wanted to do that.', translationVi: 'Tôi luôn muốn làm điều đó.' },
      { phrase: 'Sounds like a perfect trip.', translationVi: 'Nghe có vẻ là một chuyến đi hoàn hảo.' }
    ],
    aiTutorPrompt: 'You are looking at photos with the user. Ask them about their favorite memory from the trip shown in the photos, and express excitement about their experiences.',
    tags: ['vacation', 'travel', 'memories']
  },
  {
    id: 'soc-story-05',
    category: 'social',
    subcategory: 'telling-stories',
    level: 'B1',
    titleEn: 'How I met my best friend',
    titleVi: 'Cách tôi gặp người bạn thân nhất của mình',
    icon: 'HeartHandshake',
    situationVi: 'Ai đó hỏi bạn về người bạn thân nhất của bạn và làm thế nào hai người quen nhau. Bạn kể lại câu chuyện về lần đầu tiên hai người gặp gỡ.',
    sampleDialogue: [
      { speaker: 'A', text: 'You and Anna seem so close. How long have you known each other?', translationVi: 'Bạn và Anna có vẻ rất thân thiết. Hai người biết nhau bao lâu rồi?' },
      { speaker: 'B', text: 'We met about five years ago, in a very unexpected way.', translationVi: 'Bọn mình gặp nhau khoảng năm năm trước, theo một cách rất bất ngờ.' },
      { speaker: 'A', text: 'Oh? How did you meet?', translationVi: 'Ồ? Hai người gặp nhau thế nào?' },
      { speaker: 'B', text: 'We were both at a concert, and it started pouring rain. We ended up sharing an umbrella.', translationVi: 'Bọn mình đều ở một buổi hòa nhạc, và trời bắt đầu mưa như trút nước. Bọn mình cuối cùng đã che chung một chiếc ô.' },
      { speaker: 'A', text: 'Like in a movie! Did you start talking right away?', translationVi: 'Giống như trong phim vậy! Các bạn có nói chuyện với nhau ngay lập tức không?' },
      { speaker: 'B', text: 'Yeah, we realized we loved the same bands and just clicked immediately.', translationVi: 'Có, bọn mình nhận ra cả hai cùng thích những ban nhạc giống nhau và bắt sóng với nhau ngay lập tức.' }
    ],
    keyVocabulary: [
      {
        term: 'close',
        ipa: '/kloʊs/',
        partOfSpeech: 'adj',
        meaningVi: 'thân thiết',
        exampleEn: 'We are very close friends.',
        exampleVi: 'Chúng tôi là những người bạn rất thân thiết.',
        associatedActions: [
          { en: 'remain close friends for years', vi: 'gắn bó bạn bè thân thiết nhiều năm' },
          { en: 'share secrets with a close friend', vi: 'chia sẻ điều bí mật với bạn thân' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'unexpected',
        ipa: '/ˌʌnɪkˈspektɪd/',
        partOfSpeech: 'adj',
        meaningVi: 'bất ngờ, không lường trước',
        exampleEn: 'It was an unexpected meeting.',
        exampleVi: 'Đó là một cuộc gặp gỡ bất ngờ.',
        associatedActions: [
          { en: 'have an unexpected encounter', vi: 'có một cuộc chạm trán bất ngờ' },
          { en: 'receive an unexpected invitation', vi: 'nhận được lời mời không ngờ tới' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'pour',
        ipa: '/pɔːr/',
        partOfSpeech: 'verb',
        meaningVi: 'đổ, trút (mưa)',
        exampleEn: 'It was pouring rain all night.',
        exampleVi: 'Trời mưa như trút nước cả đêm.',
        associatedActions: [
          { en: 'run for shelter as rain pours', vi: 'chạy tìm chỗ trú khi mưa như trút' },
          { en: 'watch pouring rain outside', vi: 'ngắm mưa trút xối xả ngoài trời' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'umbrella',
        ipa: '/ʌmˈbrelə/',
        partOfSpeech: 'noun',
        meaningVi: 'cái ô (dù)',
        exampleEn: 'Do not forget your umbrella.',
        exampleVi: 'Đừng quên ô của bạn.',
        associatedActions: [
          { en: 'share an umbrella in the rain', vi: 'che chung một chiếc ô dưới mưa' },
          { en: 'open a large umbrella', vi: 'bung một chiếc ô lớn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'click',
        ipa: '/klɪk/',
        partOfSpeech: 'verb',
        meaningVi: 'hợp nhau ngay lập tức',
        exampleEn: 'We met and clicked right away.',
        exampleVi: 'Chúng tôi gặp và hợp nhau ngay lập tức.',
        associatedActions: [
          { en: 'click immediately on common interests', vi: 'bắt sóng hợp gu ngay về sở thích chung' },
          { en: 'talk for hours after clicking', vi: 'trò chuyện hàng giờ sau khi hợp nhau' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'How long have you known each other?', translationVi: 'Các bạn biết nhau bao lâu rồi?' },
      { phrase: 'In a very unexpected way.', translationVi: 'Theo một cách rất bất ngờ.' },
      { phrase: 'It started pouring rain.', translationVi: 'Trời bắt đầu mưa như trút nước.' },
      { phrase: 'We ended up sharing an umbrella.', translationVi: 'Cuối cùng chúng tôi che chung một chiếc ô.' },
      { phrase: 'We just clicked immediately.', translationVi: 'Chúng tôi hòa hợp ngay lập tức.' }
    ],
    aiTutorPrompt: 'You are curious about the user\'s friendship with their best friend. Ask them how they met and react positively to their "meet-cute" story.',
    tags: ['friends', 'storytelling', 'relationships']
  },
  {
    id: 'soc-story-06',
    category: 'social',
    subcategory: 'telling-stories',
    level: 'B1',
    titleEn: 'A childhood memory',
    titleVi: 'Một kỷ niệm tuổi thơ',
    icon: 'Baby',
    situationVi: 'Bạn đang hồi tưởng về quá khứ cùng gia đình và kể lại một kỷ niệm vui hoặc đáng nhớ thời thơ ấu mà bạn vẫn luôn trân trọng.',
    sampleDialogue: [
      { speaker: 'A', text: 'Do you remember that time we tried to build a treehouse?', translationVi: 'Anh có nhớ lần chúng ta cố gắng xây một ngôi nhà trên cây không?' },
      { speaker: 'B', text: 'Of course! We were only ten. We stole pieces of wood from Dad\'s garage.', translationVi: 'Tất nhiên rồi! Khi đó chúng ta mới mười tuổi. Chúng ta đã lấy trộm những mảnh gỗ từ gara của bố.' },
      { speaker: 'A', text: 'We hammered them into the old oak tree, but it looked terrible.', translationVi: 'Chúng ta đã đóng đinh chúng vào cây sồi già, nhưng trông nó thật tồi tệ.' },
      { speaker: 'B', text: 'It completely fell apart the first time it rained heavily.', translationVi: 'Nó sụp đổ hoàn toàn ngay lần đầu tiên trời mưa to.' },
      { speaker: 'A', text: 'Dad was so mad about the nails, but he eventually helped us build a proper one.', translationVi: 'Bố đã rất tức giận về những chiếc đinh, nhưng cuối cùng ông ấy cũng giúp chúng ta làm một cái đàng hoàng.' },
      { speaker: 'B', text: 'Those were the best times. Life was so simple back then.', translationVi: 'Đó là những khoảng thời gian tuyệt vời nhất. Cuộc sống khi đó thật đơn giản.' }
    ],
    keyVocabulary: [
      {
        term: 'treehouse',
        ipa: '/ˈtriːhaʊs/',
        partOfSpeech: 'noun',
        meaningVi: 'nhà trên cây',
        exampleEn: 'We played in the treehouse.',
        exampleVi: 'Chúng tôi chơi trong ngôi nhà trên cây.',
        associatedActions: [
          { en: 'build a small wooden treehouse', vi: 'xây một ngôi nhà gỗ nhỏ trên cây' },
          { en: 'climb up into the treehouse', vi: 'trèo lên ngôi nhà trên cây' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'steal',
        ipa: '/stiːl/',
        partOfSpeech: 'verb',
        meaningVi: 'lấy trộm, trộm',
        exampleEn: 'Someone stole my bike.',
        exampleVi: 'Ai đó đã trộm xe đạp của tôi.',
        associatedActions: [
          { en: 'sneak away to borrow wood', vi: 'lén lấy những mảnh gỗ' },
          { en: 'admit to stealing snacks as kids', vi: 'thú nhận đã lén ăn vụng lúc nhỏ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'hammer',
        ipa: '/ˈhæmər/',
        partOfSpeech: 'verb',
        meaningVi: 'đóng (bằng búa)',
        exampleEn: 'He hammered the nail into the wall.',
        exampleVi: 'Anh ấy đóng đinh vào tường.',
        associatedActions: [
          { en: 'hammer nails into wooden planks', vi: 'đóng đinh vào những tấm ván gỗ' },
          { en: 'use a steel hammer carefully', vi: 'sử dụng búa thép cẩn thận' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'terrible',
        ipa: '/ˈterəbl/',
        partOfSpeech: 'adj',
        meaningVi: 'tồi tệ',
        exampleEn: 'The food tasted terrible.',
        exampleVi: 'Món ăn có vị rất tệ.',
        associatedActions: [
          { en: 'laugh at a terrible design', vi: 'cười trước một thiết kế tồi tệ' },
          { en: 'endure terrible weather', vi: 'chịu đựng thời tiết tồi tệ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'proper',
        ipa: '/ˈprɑːpər/',
        partOfSpeech: 'adj',
        meaningVi: 'đúng cách, đàng hoàng',
        exampleEn: 'He needs a proper job.',
        exampleVi: 'Anh ấy cần một công việc đàng hoàng.',
        associatedActions: [
          { en: 'build a proper sturdy shelter', vi: 'xây một chỗ trú ẩn đàng hoàng vững chắc' },
          { en: 'learn proper woodworking skills', vi: 'học kỹ năng mộc đúng chuẩn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Do you remember that time...?', translationVi: 'Bạn có nhớ lần đó... không?' },
      { phrase: 'It completely fell apart.', translationVi: 'Nó sụp đổ hoàn toàn.' },
      { phrase: 'Dad was so mad about...', translationVi: 'Bố rất tức giận về...' },
      { phrase: 'Those were the best times.', translationVi: 'Đó là những thời điểm tuyệt vời nhất.' },
      { phrase: 'Life was so simple back then.', translationVi: 'Cuộc sống khi đó thật đơn giản.' }
    ],
    aiTutorPrompt: 'You are the user\'s sibling reminiscing about your childhood. Discuss the time you both tried to build a treehouse together and share your perspective on the memory.',
    tags: ['childhood', 'family', 'nostalgia']
  }
];
