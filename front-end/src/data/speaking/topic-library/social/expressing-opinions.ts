/**
 * LingoPro Speaking Topic Library
 * Category: Social
 * Subcategory: Expressing Opinions
 * File: src/data/speaking/topic-library/social/expressing-opinions.ts
 *
 * 8 sub-topics covering giving opinions, reasoning, and discussing various subjects.
 * CEFR Range: A2 - B2
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const EXPRESSING_OPINIONS_ITEMS: TopicLibraryItem[] = [
  {
    id: 'soc-opin-01',
    category: 'social',
    subcategory: 'expressing-opinions',
    level: 'A2',
    titleEn: 'Favorite movie/TV show',
    titleVi: 'Bộ phim/Chương trình truyền hình yêu thích',
    icon: 'Film',
    situationVi: 'Bạn và một người bạn đang thảo luận về bộ phim truyền hình đang nổi gần đây. Bạn chia sẻ lý do tại sao bạn thích nó.',
    sampleDialogue: [
      { speaker: 'A', text: 'Have you watched that new show on Netflix yet?', translationVi: 'Bạn đã xem chương trình mới đó trên Netflix chưa?' },
      { speaker: 'B', text: 'Yes, I watched the whole season last weekend!', translationVi: 'Rồi, mình đã xem toàn bộ mùa giải vào cuối tuần trước!' },
      { speaker: 'A', text: 'What did you think of it? I really liked the main character.', translationVi: 'Bạn nghĩ gì về nó? Mình rất thích nhân vật chính.' },
      { speaker: 'B', text: 'In my opinion, the story was a bit slow at first, but it got better.', translationVi: 'Theo ý kiến của mình, câu chuyện lúc đầu hơi chậm, nhưng sau đó đã hay hơn.' },
      { speaker: 'A', text: 'I agree. The acting was fantastic, though.', translationVi: 'Mình đồng ý. Dù sao thì diễn xuất cũng rất tuyệt vời.' },
      { speaker: 'B', text: 'Absolutely. It is one of the best shows this year.', translationVi: 'Chắc chắn rồi. Đó là một trong những chương trình hay nhất năm nay.' }
    ],
    keyVocabulary: [
      {
        term: 'season',
        ipa: '/ˈsiːzn/',
        partOfSpeech: 'noun',
        meaningVi: 'mùa (phim)',
        exampleEn: 'I cannot wait for season two.',
        exampleVi: 'Tôi không thể đợi đến mùa hai.',
        associatedActions: [
          { en: 'binge-watch all episodes', vi: 'cày trọn bộ các tập phim' },
          { en: 'wait for new release', vi: 'chờ đợi phần mới phát hành' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'character',
        ipa: '/ˈkærəktər/',
        partOfSpeech: 'noun',
        meaningVi: 'nhân vật',
        exampleEn: 'She plays the main character.',
        exampleVi: 'Cô ấy đóng vai nhân vật chính.',
        associatedActions: [
          { en: 'portray key role', vi: 'hóa thân vào vai diễn chủ chốt' },
          { en: 'follow character arc', vi: 'theo dõi diễn biến tâm lý nhân vật' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'opinion',
        ipa: '/əˈpɪnjən/',
        partOfSpeech: 'noun',
        meaningVi: 'ý kiến',
        exampleEn: 'In my opinion, it is a bad idea.',
        exampleVi: 'Theo ý kiến của tôi, đó là một ý tưởng tồi.',
        associatedActions: [
          { en: 'share honest thoughts', vi: 'chia sẻ suy nghĩ thành thật' },
          { en: 'voice personal view', vi: 'nói lên quan điểm cá nhân' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'slow',
        ipa: '/sloʊ/',
        partOfSpeech: 'adj',
        meaningVi: 'chậm',
        exampleEn: 'The movie was too slow for me.',
        exampleVi: 'Bộ phim quá chậm đối với tôi.',
        associatedActions: [
          { en: 'pause the video', vi: 'tạm dừng video' },
          { en: 'speed up playback', vi: 'tăng tốc độ phát video' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'acting',
        ipa: '/ˈæktɪŋ/',
        partOfSpeech: 'noun',
        meaningVi: 'diễn xuất',
        exampleEn: 'The acting was very realistic.',
        exampleVi: 'Diễn xuất rất chân thực.',
        associatedActions: [
          { en: 'rehearse dramatic lines', vi: 'tập dượt lời thoại kịch tính' },
          { en: 'perform on camera', vi: 'biểu diễn trước máy quay' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'What did you think of it?', translationVi: 'Bạn nghĩ gì về nó?' },
      { phrase: 'In my opinion...', translationVi: 'Theo ý kiến của tôi...' },
      { phrase: 'It was a bit slow at first.', translationVi: 'Lúc đầu nó hơi chậm một chút.' },
      { phrase: 'The acting was fantastic.', translationVi: 'Diễn xuất thật tuyệt vời.' },
      { phrase: 'It is one of the best...', translationVi: 'Đó là một trong những ... tốt nhất.' }
    ],
    aiTutorPrompt: 'You and the user are discussing a popular TV show you both recently watched. Share your mixed opinions about the plot pacing and ask the user about their favorite parts.',
    tags: ['movies', 'tv shows', 'entertainment']
  },
  {
    id: 'soc-opin-02',
    category: 'social',
    subcategory: 'expressing-opinions',
    level: 'A2',
    titleEn: 'Best restaurant in town',
    titleVi: 'Nhà hàng ngon nhất thị trấn',
    icon: 'Utensils',
    situationVi: 'Bạn và đồng nghiệp đang tranh luận xem nhà hàng nào trong thành phố làm món pizza ngon nhất.',
    sampleDialogue: [
      { speaker: 'A', text: 'I think Mario\'s makes the best pizza in the city.', translationVi: 'Mình nghĩ quán Mario\'s làm bánh pizza ngon nhất thành phố.' },
      { speaker: 'B', text: 'Really? I personally prefer Napoli Pizza. Their crust is crispier.', translationVi: 'Thật sao? Cá nhân mình thích Napoli Pizza hơn. Đế bánh của họ giòn hơn.' },
      { speaker: 'A', text: 'Mario\'s has better toppings, though. And the sauce is authentic.', translationVi: 'Nhưng Mario\'s có nhân ngon hơn. Và nước sốt cũng chuẩn vị hơn.' },
      { speaker: 'B', text: 'I suppose you are right about the sauce. But Napoli is cheaper.', translationVi: 'Mình đoán là bạn nói đúng về phần nước sốt. Nhưng Napoli thì rẻ hơn.' },
      { speaker: 'A', text: 'To me, quality is more important than price when it comes to food.', translationVi: 'Đối với mình, chất lượng quan trọng hơn giá cả khi nói đến đồ ăn.' },
      { speaker: 'B', text: 'That is a fair point. We should go to Mario\'s next time so I can try it again.', translationVi: 'Đó là một quan điểm hợp lý. Lần sau chúng ta nên đến Mario\'s để mình có thể thử lại.' }
    ],
    keyVocabulary: [
      {
        term: 'prefer',
        ipa: '/prɪˈfɜːr/',
        partOfSpeech: 'verb',
        meaningVi: 'thích hơn',
        exampleEn: 'I prefer tea to coffee.',
        exampleVi: 'Tôi thích trà hơn cà phê.',
        associatedActions: [
          { en: 'choose favorite option', vi: 'chọn lựa phương án yêu thích' },
          { en: 'opt for authentic taste', vi: 'ưa chuộng hương vị chuẩn bản xứ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'crust',
        ipa: '/krʌst/',
        partOfSpeech: 'noun',
        meaningVi: 'đế bánh',
        exampleEn: 'I like a thin pizza crust.',
        exampleVi: 'Tôi thích đế bánh pizza mỏng.',
        associatedActions: [
          { en: 'bake pizza in wood oven', vi: 'nướng bánh pizza trong lò củi' },
          { en: 'bite into crunchy edge', vi: 'cắn vào viền bánh giòn tan' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'authentic',
        ipa: '/ɔːˈθentɪk/',
        partOfSpeech: 'adj',
        meaningVi: 'chuẩn vị, đích thực',
        exampleEn: 'This is an authentic Italian recipe.',
        exampleVi: 'Đây là công thức Ý chuẩn vị.',
        associatedActions: [
          { en: 'follow traditional recipe', vi: 'làm theo công thức truyền thống' },
          { en: 'taste original spices', vi: 'nếm thử gia vị nguyên bản' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'quality',
        ipa: '/ˈkwɑːləti/',
        partOfSpeech: 'noun',
        meaningVi: 'chất lượng',
        exampleEn: 'The quality of the material is high.',
        exampleVi: 'Chất lượng vật liệu rất cao.',
        associatedActions: [
          { en: 'select fresh ingredients', vi: 'chọn lọc nguyên liệu tươi ngon' },
          { en: 'inspect culinary standards', vi: 'kiểm định tiêu chuẩn ẩm thực' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'price',
        ipa: '/praɪs/',
        partOfSpeech: 'noun',
        meaningVi: 'giá cả',
        exampleEn: 'The price is very reasonable.',
        exampleVi: 'Giá cả rất hợp lý.',
        associatedActions: [
          { en: 'check receipt total', vi: 'kiểm tra tổng tiền trên hóa đơn' },
          { en: 'compare meal costs', vi: 'so sánh chi phí bữa ăn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I think... makes the best...', translationVi: 'Tôi nghĩ... làm... ngon nhất.' },
      { phrase: 'I personally prefer...', translationVi: 'Cá nhân tôi thích... hơn.' },
      { phrase: 'I suppose you are right.', translationVi: 'Tôi cho là bạn đúng.' },
      { phrase: 'To me, quality is more important.', translationVi: 'Đối với tôi, chất lượng quan trọng hơn.' },
      { phrase: 'That is a fair point.', translationVi: 'Đó là một quan điểm hợp lý.' }
    ],
    aiTutorPrompt: 'The user thinks a specific restaurant makes the best pizza. Respectfully disagree and argue for a different place based on crust and price.',
    tags: ['food', 'restaurants', 'debates']
  },
  {
    id: 'soc-opin-03',
    category: 'social',
    subcategory: 'expressing-opinions',
    level: 'B1',
    titleEn: 'Social media pros and cons',
    titleVi: 'Ưu và nhược điểm của mạng xã hội',
    icon: 'Share2',
    situationVi: 'Bạn và một người bạn thảo luận về tác động của mạng xã hội đối với cuộc sống con người, cả mặt tích cực lẫn tiêu cực.',
    sampleDialogue: [
      { speaker: 'A', text: 'I feel like people spend too much time on social media these days.', translationVi: 'Tôi cảm thấy ngày nay mọi người dành quá nhiều thời gian cho mạng xã hội.' },
      { speaker: 'B', text: 'I totally agree. It can be a huge waste of time if you are not careful.', translationVi: 'Tôi hoàn toàn đồng ý. Nó có thể là một sự lãng phí thời gian lớn nếu bạn không cẩn thận.' },
      { speaker: 'A', text: 'Plus, it sometimes makes people feel insecure when they compare themselves to others.', translationVi: 'Thêm vào đó, đôi khi nó khiến người ta cảm thấy tự ti khi so sánh bản thân với người khác.' },
      { speaker: 'B', text: 'That is true, but on the other hand, it is a great way to stay connected with family.', translationVi: 'Đúng vậy, nhưng mặt khác, đó là một cách tuyệt vời để giữ liên lạc với gia đình.' },
      { speaker: 'A', text: 'You have a point there. It is useful for sharing news and updates quickly.', translationVi: 'Bạn nói đúng điểm đó. Nó hữu ích để chia sẻ tin tức và cập nhật nhanh chóng.' },
      { speaker: 'B', text: 'Exactly. It is all about how you use it. Balance is key.', translationVi: 'Chính xác. Quan trọng là cách bạn sử dụng nó. Sự cân bằng là chìa khóa.' }
    ],
    keyVocabulary: [
      {
        term: 'waste',
        ipa: '/weɪst/',
        partOfSpeech: 'noun/verb',
        meaningVi: 'lãng phí',
        exampleEn: 'Playing games all day is a waste of time.',
        exampleVi: 'Chơi game cả ngày là lãng phí thời gian.',
        associatedActions: [
          { en: 'limit screen time', vi: 'giới hạn thời gian dùng màn hình' },
          { en: 'close distracting apps', vi: 'đóng các ứng dụng gây xao nhãng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'insecure',
        ipa: '/ˌɪnsɪˈkjʊr/',
        partOfSpeech: 'adj',
        meaningVi: 'tự ti, không an tâm',
        exampleEn: 'He felt insecure about his looks.',
        exampleVi: 'Anh ấy cảm thấy tự ti về ngoại hình của mình.',
        associatedActions: [
          { en: 'stop comparing lifestyles', vi: 'ngừng so sánh lối sống với người khác' },
          { en: 'build self-confidence', vi: 'xây dựng sự tự tin bản thân' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'compare',
        ipa: '/kəmˈper/',
        partOfSpeech: 'verb',
        meaningVi: 'so sánh',
        exampleEn: 'Do not compare yourself to others.',
        exampleVi: 'Đừng so sánh bản thân với người khác.',
        associatedActions: [
          { en: 'contrast two perspectives', vi: 'đối chiếu hai góc nhìn' },
          { en: 'weigh strengths and flaws', vi: 'cân nhắc điểm mạnh và thiếu sót' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'connected',
        ipa: '/kəˈnektɪd/',
        partOfSpeech: 'adj',
        meaningVi: 'có kết nối, liên lạc',
        exampleEn: 'The internet keeps us connected.',
        exampleVi: 'Internet giữ cho chúng ta kết nối với nhau.',
        associatedActions: [
          { en: 'message family group', vi: 'nhắn tin vào nhóm gia đình' },
          { en: 'make video calls', vi: 'thực hiện các cuộc gọi video' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'balance',
        ipa: '/ˈbæləns/',
        partOfSpeech: 'noun',
        meaningVi: 'sự cân bằng',
        exampleEn: 'You need a work-life balance.',
        exampleVi: 'Bạn cần sự cân bằng giữa công việc và cuộc sống.',
        associatedActions: [
          { en: 'set digital boundaries', vi: 'thiết lập ranh giới số' },
          { en: 'spend time outdoors', vi: 'dành thời gian ngoài trời' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I totally agree.', translationVi: 'Tôi hoàn toàn đồng ý.' },
      { phrase: 'It can be a huge waste of time.', translationVi: 'Nó có thể lãng phí rất nhiều thời gian.' },
      { phrase: 'On the other hand...', translationVi: 'Mặt khác...' },
      { phrase: 'You have a point there.', translationVi: 'Bạn nói đúng chỗ đó.' },
      { phrase: 'It is all about how you use it.', translationVi: 'Quan trọng là cách bạn sử dụng nó.' }
    ],
    aiTutorPrompt: 'Discuss the impact of social media with the user. Bring up both the positive aspects (like connectivity) and the negative aspects (like mental health impacts).',
    tags: ['technology', 'social media', 'society']
  },
  {
    id: 'soc-opin-04',
    category: 'social',
    subcategory: 'expressing-opinions',
    level: 'B1',
    titleEn: 'Should students wear uniforms?',
    titleVi: 'Học sinh có nên mặc đồng phục không?',
    icon: 'Shirt',
    situationVi: 'Bạn và một bạn học thảo luận về chính sách bắt buộc mặc đồng phục tại trường học. Mỗi người có một góc nhìn khác nhau.',
    sampleDialogue: [
      { speaker: 'A', text: 'I firmly believe that school uniforms are a good idea.', translationVi: 'Mình tin chắc rằng đồng phục học sinh là một ý tưởng hay.' },
      { speaker: 'B', text: 'I am not so sure. Do not you think they stop students from expressing their individuality?', translationVi: 'Mình không chắc lắm. Bạn không nghĩ chúng ngăn cản học sinh thể hiện cá tính riêng sao?' },
      { speaker: 'A', text: 'Maybe, but they create a sense of equality. Nobody is judged by the clothes they wear.', translationVi: 'Có thể, nhưng chúng tạo ra cảm giác bình đẳng. Không ai bị đánh giá qua quần áo họ mặc.' },
      { speaker: 'B', text: 'I see your point, but uniforms are often uncomfortable and expensive to buy.', translationVi: 'Mình hiểu ý bạn, nhưng đồng phục thường không thoải mái và đắt đỏ để mua.' },
      { speaker: 'A', text: 'But in the long run, parents save money because they do not have to buy lots of different outfits.', translationVi: 'Nhưng về lâu dài, phụ huynh tiết kiệm được tiền vì không phải mua nhiều trang phục khác nhau.' },
      { speaker: 'B', text: 'That is a valid argument. I still prefer wearing my own clothes, though.', translationVi: 'Đó là một lập luận hợp lý. Dù vậy mình vẫn thích mặc quần áo của riêng mình hơn.' }
    ],
    keyVocabulary: [
      {
        term: 'firmly',
        ipa: '/ˈfɜːrmli/',
        partOfSpeech: 'adv',
        meaningVi: 'chắc chắn, kiên quyết',
        exampleEn: 'I firmly believe he is innocent.',
        exampleVi: 'Tôi tin chắc rằng anh ấy vô tội.',
        associatedActions: [
          { en: 'state personal conviction', vi: 'nêu rõ niềm tin cá nhân' },
          { en: 'stand ground in debate', vi: 'giữ vững lập trường trong tranh luận' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'individuality',
        ipa: '/ˌɪndɪˌvɪdʒuˈæləti/',
        partOfSpeech: 'noun',
        meaningVi: 'cá tính riêng',
        exampleEn: 'Clothes are a way to express individuality.',
        exampleVi: 'Quần áo là một cách để thể hiện cá tính riêng.',
        associatedActions: [
          { en: 'express unique style', vi: 'thể hiện phong cách độc đáo' },
          { en: 'choose custom outfits', vi: 'lựa chọn trang phục riêng biệt' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'equality',
        ipa: '/ɪˈkwɑːləti/',
        partOfSpeech: 'noun',
        meaningVi: 'sự bình đẳng',
        exampleEn: 'We fight for gender equality.',
        exampleVi: 'Chúng tôi đấu tranh cho bình đẳng giới.',
        associatedActions: [
          { en: 'promote fair opportunities', vi: 'thúc đẩy cơ hội công bằng' },
          { en: 'support inclusive school', vi: 'ủng hộ trường học hòa nhập' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'judge',
        ipa: '/dʒʌdʒ/',
        partOfSpeech: 'verb',
        meaningVi: 'đánh giá, phán xét',
        exampleEn: 'Do not judge a book by its cover.',
        exampleVi: 'Đừng trông mặt mà bắt hình dong (đừng đánh giá sách qua trang bìa).',
        associatedActions: [
          { en: 'avoid hasty assumptions', vi: 'tránh những giả định vội vàng' },
          { en: 'listen before deciding', vi: 'lắng nghe trước khi phán xét' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'argument',
        ipa: '/ˈɑːrɡjumənt/',
        partOfSpeech: 'noun',
        meaningVi: 'lập luận, lý lẽ',
        exampleEn: 'He made a strong argument.',
        exampleVi: 'Anh ấy đưa ra một lập luận chặt chẽ.',
        associatedActions: [
          { en: 'present supporting evidence', vi: 'đưa ra bằng chứng chứng minh' },
          { en: 'counter opposing claim', vi: 'bác bỏ luận điểm đối lập' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I firmly believe that...', translationVi: 'Tôi tin chắc rằng...' },
      { phrase: 'Do not you think they...?', translationVi: 'Bạn không nghĩ rằng chúng... sao?' },
      { phrase: 'They create a sense of equality.', translationVi: 'Chúng tạo ra cảm giác bình đẳng.' },
      { phrase: 'I see your point, but...', translationVi: 'Tôi hiểu ý bạn, nhưng...' },
      { phrase: 'That is a valid argument.', translationVi: 'Đó là một lập luận hợp lý.' }
    ],
    aiTutorPrompt: 'You are debating whether students should wear school uniforms with the user. Take the position that uniforms restrict freedom and expression, and respond to the user\'s arguments.',
    tags: ['education', 'school', 'debates']
  },
  {
    id: 'soc-opin-05',
    category: 'social',
    subcategory: 'expressing-opinions',
    level: 'B1',
    titleEn: 'Online learning vs in-person',
    titleVi: 'Học trực tuyến so với học trực tiếp',
    icon: 'Laptop',
    situationVi: 'Bạn trao đổi ý kiến với một bạn học về việc liệu học trực tuyến có tốt hơn học trên lớp hay không, dựa trên trải nghiệm của cả hai.',
    sampleDialogue: [
      { speaker: 'A', text: 'I honestly prefer taking classes online rather than going to campus.', translationVi: 'Thú thực là mình thích học trực tuyến hơn là đến trường.' },
      { speaker: 'B', text: 'Why is that? I find it so hard to stay motivated at home.', translationVi: 'Tại sao vậy? Mình thấy rất khó để giữ động lực khi ở nhà.' },
      { speaker: 'A', text: 'The flexibility is great. I can study whenever I want and save time commuting.', translationVi: 'Sự linh hoạt rất tuyệt. Mình có thể học bất cứ lúc nào mình muốn và tiết kiệm thời gian đi lại.' },
      { speaker: 'B', text: 'I understand that, but you miss out on social interaction and networking.', translationVi: 'Mình hiểu điều đó, nhưng bạn sẽ bỏ lỡ sự tương tác xã hội và xây dựng mạng lưới quan hệ.' },
      { speaker: 'A', text: 'That is true. Group projects are definitely harder to coordinate online.', translationVi: 'Đúng vậy. Làm bài tập nhóm chắc chắn khó phối hợp hơn khi làm trực tuyến.' },
      { speaker: 'B', text: 'Yeah, I think a hybrid model would be the best of both worlds.', translationVi: 'Ừ, mình nghĩ một mô hình kết hợp sẽ tận dụng được ưu điểm của cả hai.' }
    ],
    keyVocabulary: [
      {
        term: 'honestly',
        ipa: '/ˈɑːnɪstli/',
        partOfSpeech: 'adv',
        meaningVi: 'thành thật mà nói',
        exampleEn: 'Honestly, I do not know the answer.',
        exampleVi: 'Thành thật mà nói, tôi không biết câu trả lời.',
        associatedActions: [
          { en: 'speak from personal experience', vi: 'nói từ trải nghiệm của bản thân' },
          { en: 'admit real struggles', vi: 'thừa nhận những khó khăn thực tế' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'motivated',
        ipa: '/ˈmoʊtɪveɪtɪd/',
        partOfSpeech: 'adj',
        meaningVi: 'có động lực',
        exampleEn: 'He is highly motivated to succeed.',
        exampleVi: 'Anh ấy có động lực rất cao để thành công.',
        associatedActions: [
          { en: 'set daily study goals', vi: 'đặt mục tiêu học tập hàng ngày' },
          { en: 'reward hard work', vi: 'tự thưởng cho sự chăm chỉ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'flexibility',
        ipa: '/ˌfleksəˈbɪləti/',
        partOfSpeech: 'noun',
        meaningVi: 'sự linh hoạt',
        exampleEn: 'Working from home offers more flexibility.',
        exampleVi: 'Làm việc từ xa mang lại nhiều sự linh hoạt hơn.',
        associatedActions: [
          { en: 'study at convenient times', vi: 'học vào những khung giờ thuận tiện' },
          { en: 'adjust weekly timetable', vi: 'điều chỉnh thời khóa biểu tuần' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'commute',
        ipa: '/kəˈmjuːt/',
        partOfSpeech: 'verb',
        meaningVi: 'đi lại (giữa nhà và nơi làm/học)',
        exampleEn: 'I commute by train every day.',
        exampleVi: 'Tôi đi lại bằng tàu hỏa mỗi ngày.',
        associatedActions: [
          { en: 'catch morning bus', vi: 'bắt xe buýt buổi sáng' },
          { en: 'avoid rush hour traffic', vi: 'tránh tắc đường giờ cao điểm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'hybrid',
        ipa: '/ˈhaɪbrɪd/',
        partOfSpeech: 'adj',
        meaningVi: 'kết hợp, lai',
        exampleEn: 'We use a hybrid learning model.',
        exampleVi: 'Chúng tôi sử dụng mô hình học tập kết hợp.',
        associatedActions: [
          { en: 'attend online webinars', vi: 'tham gia hội thảo trực tuyến' },
          { en: 'meet classmates in lab', vi: 'gặp bạn học tại phòng thực hành' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I honestly prefer...', translationVi: 'Thú thực là tôi thích... hơn.' },
      { phrase: 'Why is that?', translationVi: 'Tại sao vậy?' },
      { phrase: 'I find it hard to...', translationVi: 'Tôi thấy khó để...' },
      { phrase: 'You miss out on...', translationVi: 'Bạn sẽ bỏ lỡ...' },
      { phrase: 'The best of both worlds.', translationVi: 'Tận dụng được điểm mạnh của cả hai (trọn vẹn đôi đường).' }
    ],
    aiTutorPrompt: 'Discuss the pros and cons of online learning versus in-person learning with the user. You prefer in-person learning because you value face-to-face interaction.',
    tags: ['education', 'technology', 'lifestyle']
  },
  {
    id: 'soc-opin-06',
    category: 'social',
    subcategory: 'expressing-opinions',
    level: 'B2',
    titleEn: 'Is money important for happiness?',
    titleVi: 'Tiền bạc có quan trọng đối với hạnh phúc không?',
    icon: 'DollarSign',
    situationVi: 'Bạn và một người bạn thân tranh luận sâu sắc về vai trò của tiền bạc trong việc tạo ra một cuộc sống hạnh phúc và viên mãn.',
    sampleDialogue: [
      { speaker: 'A', text: 'Some people say money cannot buy happiness, but I completely disagree.', translationVi: 'Một số người nói tiền không mua được hạnh phúc, nhưng mình hoàn toàn không đồng ý.' },
      { speaker: 'B', text: 'Well, it depends on how you define happiness. Money cannot buy love or health.', translationVi: 'Chà, điều đó phụ thuộc vào cách bạn định nghĩa hạnh phúc. Tiền không thể mua được tình yêu hay sức khỏe.' },
      { speaker: 'A', text: 'While that is accurate, money provides security and reduces stress, which makes you happier.', translationVi: 'Mặc dù điều đó đúng, nhưng tiền bạc mang lại sự an toàn và giảm căng thẳng, điều đó khiến bạn hạnh phúc hơn.' },
      { speaker: 'B', text: 'I agree up to a point. Having enough to cover basic needs is essential.', translationVi: 'Mình đồng ý ở một mức độ nào đó. Có đủ tiền để trang trải các nhu cầu cơ bản là rất thiết yếu.' },
      { speaker: 'A', text: 'Exactly! But beyond that, it gives you the freedom to pursue your passions.', translationVi: 'Chính xác! Nhưng hơn thế nữa, nó cho bạn sự tự do để theo đuổi đam mê của mình.' },
      { speaker: 'B', text: 'Perhaps. However, I still think strong relationships are the real key to lasting joy.', translationVi: 'Có lẽ vậy. Tuy nhiên, mình vẫn nghĩ những mối quan hệ bền chặt mới là chìa khóa thực sự cho niềm vui lâu dài.' }
    ],
    keyVocabulary: [
      {
        term: 'disagree',
        ipa: '/ˌdɪsəˈɡriː/',
        partOfSpeech: 'verb',
        meaningVi: 'không đồng ý',
        exampleEn: 'I disagree with your decision.',
        exampleVi: 'Tôi không đồng ý với quyết định của bạn.',
        associatedActions: [
          { en: 'shake head gently', vi: 'lắc đầu nhẹ nhàng' },
          { en: 'offer alternative viewpoint', vi: 'đưa ra quan điểm khác biệt' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'define',
        ipa: '/dɪˈfaɪn/',
        partOfSpeech: 'verb',
        meaningVi: 'định nghĩa',
        exampleEn: 'How do you define success?',
        exampleVi: 'Bạn định nghĩa thành công như thế nào?',
        associatedActions: [
          { en: 'clarify exact terminology', vi: 'làm rõ thuật ngữ chính xác' },
          { en: 'outline core values', vi: 'phác thảo các giá trị cốt lõi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'security',
        ipa: '/sɪˈkjʊrəti/',
        partOfSpeech: 'noun',
        meaningVi: 'sự an toàn, an ninh',
        exampleEn: 'A steady job provides financial security.',
        exampleVi: 'Một công việc ổn định mang lại sự an toàn tài chính.',
        associatedActions: [
          { en: 'build emergency fund', vi: 'xây dựng quỹ khẩn cấp' },
          { en: 'buy comprehensive insurance', vi: 'mua bảo hiểm toàn diện' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'essential',
        ipa: '/ɪˈsenʃl/',
        partOfSpeech: 'adj',
        meaningVi: 'thiết yếu',
        exampleEn: 'Water is essential for life.',
        exampleVi: 'Nước là thiết yếu cho sự sống.',
        associatedActions: [
          { en: 'fulfill biological needs', vi: 'đáp ứng nhu cầu sinh học' },
          { en: 'protect family wellbeing', vi: 'bảo vệ hạnh phúc gia đình' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'pursue',
        ipa: '/pərˈsuː/',
        partOfSpeech: 'verb',
        meaningVi: 'theo đuổi',
        exampleEn: 'She decided to pursue a career in art.',
        exampleVi: 'Cô ấy quyết định theo đuổi sự nghiệp nghệ thuật.',
        associatedActions: [
          { en: 'chase artistic dream', vi: 'theo đuổi giấc mơ nghệ thuật' },
          { en: 'practice new craft', vi: 'luyện tập ngón nghề mới' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I completely disagree.', translationVi: 'Tôi hoàn toàn không đồng ý.' },
      { phrase: 'It depends on how you define...', translationVi: 'Nó phụ thuộc vào cách bạn định nghĩa...' },
      { phrase: 'While that is accurate...', translationVi: 'Mặc dù điều đó đúng...' },
      { phrase: 'I agree up to a point.', translationVi: 'Tôi đồng ý ở một mức độ nào đó.' },
      { phrase: 'The real key to...', translationVi: 'Chìa khóa thực sự cho...' }
    ],
    aiTutorPrompt: 'Engage in a philosophical debate with the user about whether money can buy happiness. Argue that while money is necessary for survival, true happiness comes from internal factors and relationships.',
    tags: ['money', 'philosophy', 'happiness']
  },
  {
    id: 'soc-opin-07',
    category: 'social',
    subcategory: 'expressing-opinions',
    level: 'B1',
    titleEn: 'Living in the city vs countryside',
    titleVi: 'Sống ở thành phố vs nông thôn',
    icon: 'Building2',
    situationVi: 'Bạn đang cân nhắc việc chuyển chỗ ở và hỏi ý kiến một người bạn về những điểm cộng và điểm trừ của việc sống ở thành thị so với nông thôn.',
    sampleDialogue: [
      { speaker: 'A', text: 'I am thinking about moving to the countryside. The city is getting too noisy for me.', translationVi: 'Tôi đang nghĩ đến việc chuyển về nông thôn. Thành phố đang trở nên quá ồn ào đối với tôi.' },
      { speaker: 'B', text: 'I can see why you would want that. The countryside is very peaceful and clean.', translationVi: 'Tôi hiểu tại sao bạn lại muốn vậy. Nông thôn rất yên bình và trong lành.' },
      { speaker: 'A', text: 'Exactly. But my main concern is that it might be boring.', translationVi: 'Chính xác. Nhưng mối bận tâm chính của tôi là nó có thể nhàm chán.' },
      { speaker: 'B', text: 'That is a valid point. There are definitely fewer entertainment options than in the city.', translationVi: 'Đó là một điểm hợp lý. Chắc chắn có ít lựa chọn giải trí hơn so với ở thành phố.' },
      { speaker: 'A', text: 'Also, public transport is terrible out there. I would have to drive everywhere.', translationVi: 'Ngoài ra, phương tiện giao thông công cộng ngoài đó rất tệ. Tôi sẽ phải lái xe đi khắp nơi.' },
      { speaker: 'B', text: 'If convenience is important to you, maybe you should stay in the suburbs instead.', translationVi: 'Nếu sự tiện lợi là quan trọng đối với bạn, có lẽ bạn nên ở vùng ngoại ô thay thế.' }
    ],
    keyVocabulary: [
      {
        term: 'noisy',
        ipa: '/ˈnɔɪzi/',
        partOfSpeech: 'adj',
        meaningVi: 'ồn ào',
        exampleEn: 'The street is very noisy at night.',
        exampleVi: 'Con phố rất ồn ào vào ban đêm.',
        associatedActions: [
          { en: 'wear noise-cancelling headphones', vi: 'đeo tai nghe chống ồn' },
          { en: 'shut soundproof windows', vi: 'đóng kín cửa sổ cách âm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'peaceful',
        ipa: '/ˈpiːsfl/',
        partOfSpeech: 'adj',
        meaningVi: 'yên bình',
        exampleEn: 'It is so peaceful by the lake.',
        exampleVi: 'Thật yên bình bên hồ.',
        associatedActions: [
          { en: 'listen to songbirds', vi: 'lắng nghe chim hót' },
          { en: 'stroll beside green fields', vi: 'dạo bước bên cánh đồng xanh' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'concern',
        ipa: '/kənˈsɜːrn/',
        partOfSpeech: 'noun',
        meaningVi: 'mối bận tâm, lo ngại',
        exampleEn: 'My main concern is safety.',
        exampleVi: 'Mối bận tâm chính của tôi là sự an toàn.',
        associatedActions: [
          { en: 'share worries with family', vi: 'chia sẻ nỗi bận tâm với gia đình' },
          { en: 'research local clinics', vi: 'tìm hiểu bệnh viện địa phương' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'entertainment',
        ipa: '/ˌentərˈteɪnmənt/',
        partOfSpeech: 'noun',
        meaningVi: 'sự giải trí',
        exampleEn: 'The city has a lot of entertainment.',
        exampleVi: 'Thành phố có rất nhiều tiện ích giải trí.',
        associatedActions: [
          { en: 'attend music concerts', vi: 'đi xem hòa nhạc' },
          { en: 'visit art museum', vi: 'tham quan bảo tàng mỹ thuật' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'suburb',
        ipa: '/ˈsʌbɜːrb/',
        partOfSpeech: 'noun',
        meaningVi: 'vùng ngoại ô',
        exampleEn: 'Many families move to the suburbs.',
        exampleVi: 'Nhiều gia đình chuyển đến vùng ngoại ô.',
        associatedActions: [
          { en: 'buy family house', vi: 'mua nhà cho gia đình' },
          { en: 'plant small garden', vi: 'trồng một khu vườn nhỏ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I am thinking about moving to...', translationVi: 'Tôi đang nghĩ đến việc chuyển đến...' },
      { phrase: 'I can see why you would want that.', translationVi: 'Tôi hiểu tại sao bạn lại muốn điều đó.' },
      { phrase: 'My main concern is that...', translationVi: 'Mối bận tâm chính của tôi là...' },
      { phrase: 'There are fewer... options.', translationVi: 'Có ít lựa chọn ... hơn.' },
      { phrase: 'If convenience is important to you...', translationVi: 'Nếu sự tiện lợi quan trọng đối với bạn...' }
    ],
    aiTutorPrompt: 'The user is weighing the pros and cons of moving to the countryside. Listen to their thoughts and help them evaluate factors like lifestyle, transport, and entertainment.',
    tags: ['lifestyle', 'living', 'debates']
  },
  {
    id: 'soc-opin-08',
    category: 'social',
    subcategory: 'expressing-opinions',
    level: 'B1',
    titleEn: 'Should pets be allowed in apartments?',
    titleVi: 'Có nên cho phép nuôi thú cưng trong căn hộ không?',
    icon: 'Dog',
    situationVi: 'Bạn và một người hàng xóm thảo luận về quy định mới của tòa nhà liên quan đến việc cấm nuôi chó mèo.',
    sampleDialogue: [
      { speaker: 'A', text: 'Have you heard about the new rule? They are banning pets in the building.', translationVi: 'Bạn nghe về quy định mới chưa? Họ đang cấm nuôi thú cưng trong tòa nhà đấy.' },
      { speaker: 'B', text: 'Yes, I think it is unfair. Pets are like family members to many people.', translationVi: 'Có, mình nghĩ điều đó thật không công bằng. Đối với nhiều người, thú cưng như thành viên trong gia đình vậy.' },
      { speaker: 'A', text: 'I feel the same way. As long as owners are responsible, it should be fine.', translationVi: 'Mình cũng thấy vậy. Miễn là chủ nuôi có trách nhiệm thì sẽ ổn thôi.' },
      { speaker: 'B', text: 'Exactly. But management argues that dogs make too much noise and damage property.', translationVi: 'Chính xác. Nhưng ban quản lý lập luận rằng chó gây ra quá nhiều tiếng ồn và làm hỏng tài sản.' },
      { speaker: 'A', text: 'Some do, but you cannot punish everyone for a few bad owners.', translationVi: 'Vài con thì có, nhưng bạn không thể phạt tất cả mọi người chỉ vì một vài chủ nuôi tồi.' },
      { speaker: 'B', text: 'I completely agree. We should start a petition to change the rule.', translationVi: 'Mình hoàn toàn đồng ý. Chúng ta nên bắt đầu một bản kiến nghị để thay đổi quy định.' }
    ],
    keyVocabulary: [
      {
        term: 'ban',
        ipa: '/bæn/',
        partOfSpeech: 'verb',
        meaningVi: 'cấm',
        exampleEn: 'Smoking is banned in this area.',
        exampleVi: 'Hút thuốc bị cấm ở khu vực này.',
        associatedActions: [
          { en: 'post warning sign', vi: 'dán biển cảnh báo cấm' },
          { en: 'enforce building regulations', vi: 'thực thi nội quy tòa nhà' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'unfair',
        ipa: '/ˌʌnˈfer/',
        partOfSpeech: 'adj',
        meaningVi: 'không công bằng',
        exampleEn: 'It is unfair to change the rules now.',
        exampleVi: 'Thật không công bằng khi thay đổi luật lệ bây giờ.',
        associatedActions: [
          { en: 'protest unjust rules', vi: 'phản đối những quy định bất công' },
          { en: 'voice collective grievance', vi: 'nói lên khiếu nại tập thể' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'responsible',
        ipa: '/rɪˈspɑːnsəbl/',
        partOfSpeech: 'adj',
        meaningVi: 'có trách nhiệm',
        exampleEn: 'He is a responsible worker.',
        exampleVi: 'Anh ấy là một nhân viên có trách nhiệm.',
        associatedActions: [
          { en: 'walk dog on leash', vi: 'dắt chó đi dạo bằng dây xích' },
          { en: 'clean up after pet', vi: 'dọn dẹp vệ sinh sau thú cưng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'damage',
        ipa: '/ˈdæmɪdʒ/',
        partOfSpeech: 'verb',
        meaningVi: 'làm hỏng, gây thiệt hại',
        exampleEn: 'The storm damaged the roof.',
        exampleVi: 'Cơn bão đã làm hỏng mái nhà.',
        associatedActions: [
          { en: 'repair scratched furniture', vi: 'sửa chữa đồ gỗ bị cào xước' },
          { en: 'pay security deposit', vi: 'trả tiền đặt cọc bồi hoàn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'petition',
        ipa: '/pəˈtɪʃn/',
        partOfSpeech: 'noun',
        meaningVi: 'bản kiến nghị',
        exampleEn: 'We signed a petition to save the park.',
        exampleVi: 'Chúng tôi đã ký một bản kiến nghị để bảo vệ công viên.',
        associatedActions: [
          { en: 'collect neighbor signatures', vi: 'thu thập chữ ký hàng xóm' },
          { en: 'submit letter to management', vi: 'nộp thư kiến nghị lên ban quản lý' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I think it is unfair.', translationVi: 'Tôi nghĩ điều đó không công bằng.' },
      { phrase: 'I feel the same way.', translationVi: 'Tôi cũng cảm thấy như vậy.' },
      { phrase: 'As long as owners are responsible...', translationVi: 'Miễn là người chủ có trách nhiệm...' },
      { phrase: 'Management argues that...', translationVi: 'Ban quản lý lập luận rằng...' },
      { phrase: 'We should start a petition.', translationVi: 'Chúng ta nên bắt đầu một bản kiến nghị.' }
    ],
    aiTutorPrompt: 'You are chatting with a neighbor (the user) about a new building rule banning pets. Express your frustration about the rule and agree with their points on responsible pet ownership.',
    tags: ['pets', 'housing', 'rules']
  }
];
