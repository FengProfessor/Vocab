/**
 * LingoPro Speaking Topic Library
 * Category: Social
 * Subcategory: Agreeing & Disagreeing
 * File: src/data/speaking/topic-library/social/agreeing-disagreeing.ts
 *
 * 6 sub-topics covering expressing agreement, disagreement, and finding compromise.
 * CEFR Range: A1 - B2
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const AGREEING_DISAGREEING_ITEMS: TopicLibraryItem[] = [
  {
    id: 'soc-agree-01',
    category: 'social',
    subcategory: 'agreeing-disagreeing',
    level: 'A1',
    titleEn: 'Agreeing on a restaurant choice',
    titleVi: 'Đồng ý về việc chọn nhà hàng',
    icon: 'Utensils',
    situationVi: 'Bạn và bạn bè đang bàn xem tối nay ăn gì. Một người đưa ra gợi ý và bạn hoàn toàn đồng ý.',
    sampleDialogue: [
      { speaker: 'A', text: 'I am so hungry. What do you want to eat for dinner?', translationVi: 'Mình đói quá. Bạn muốn ăn gì cho bữa tối?' },
      { speaker: 'B', text: 'How about that new burger place near the station?', translationVi: 'Quán burger mới gần nhà ga thì sao?' },
      { speaker: 'A', text: 'That is a great idea! I love burgers.', translationVi: 'Đó là một ý kiến tuyệt vời! Mình thích ăn burger.' },
      { speaker: 'B', text: 'Me too. And their fries are very good.', translationVi: 'Mình cũng vậy. Và khoai tây chiên của họ rất ngon.' },
      { speaker: 'A', text: 'Exactly! Let us go there now.', translationVi: 'Chính xác! Chúng ta hãy đến đó ngay bây giờ.' },
      { speaker: 'B', text: 'Okay, let us go.', translationVi: 'Đồng ý, đi thôi.' }
    ],
    keyVocabulary: [
      {
        term: 'hungry',
        ipa: '/ˈhʌŋɡri/',
        partOfSpeech: 'adj',
        meaningVi: 'đói bụng',
        exampleEn: 'I am very hungry.',
        exampleVi: 'Tôi rất đói.',
        associatedActions: [
          { en: 'look for something to eat', vi: 'tìm món gì đó để ăn' },
          { en: 'order a meal', vi: 'gọi một bữa ăn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'burger',
        ipa: '/ˈbɜːrɡər/',
        partOfSpeech: 'noun',
        meaningVi: 'bánh mì kẹp thịt (burger)',
        exampleEn: 'I want a cheese burger.',
        exampleVi: 'Tôi muốn một chiếc burger phô mai.',
        associatedActions: [
          { en: 'take a big bite', vi: 'cắn một miếng lớn' },
          { en: 'order with extra cheese', vi: 'gọi thêm phô mai' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'station',
        ipa: '/ˈsteɪʃn/',
        partOfSpeech: 'noun',
        meaningVi: 'nhà ga',
        exampleEn: 'Meet me at the station.',
        exampleVi: 'Gặp tôi ở nhà ga.',
        associatedActions: [
          { en: 'wait on the platform', vi: 'chờ trên sân ga' },
          { en: 'buy a train ticket', vi: 'mua vé tàu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1515165562839-978bbcf18277?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'fries',
        ipa: '/fraɪz/',
        partOfSpeech: 'noun',
        meaningVi: 'khoai tây chiên',
        exampleEn: 'I like burgers with fries.',
        exampleVi: 'Tôi thích burger với khoai tây chiên.',
        associatedActions: [
          { en: 'dip in tomato ketchup', vi: 'chấm vào sốt cà chua' },
          { en: 'share with friends', vi: 'chia sẻ với bạn bè' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'exactly',
        ipa: '/ɪɡˈzæktli/',
        partOfSpeech: 'adv',
        meaningVi: 'chính xác',
        exampleEn: 'That is exactly what I mean.',
        exampleVi: 'Đó chính xác là ý tôi.',
        associatedActions: [
          { en: 'nod in agreement', vi: 'gật đầu đồng tình' },
          { en: 'confirm the opinion', vi: 'xác nhận ý kiến' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'That is a great idea!', translationVi: 'Đó là một ý kiến tuyệt vời!' },
      { phrase: 'I love...', translationVi: 'Tôi thích...' },
      { phrase: 'Me too.', translationVi: 'Tôi cũng vậy.' },
      { phrase: 'Exactly!', translationVi: 'Chính xác!' },
      { phrase: 'Let us go there now.', translationVi: 'Hãy đến đó ngay bây giờ.' }
    ],
    aiTutorPrompt: 'You and the user are deciding what to eat. Suggest a type of food or a restaurant. The user will agree with your suggestion enthusiastically.',
    tags: ['food', 'agreement', 'casual']
  },
  {
    id: 'soc-agree-02',
    category: 'social',
    subcategory: 'agreeing-disagreeing',
    level: 'A2',
    titleEn: 'Politely disagreeing with a friend',
    titleVi: 'Bất đồng ý kiến một cách lịch sự với bạn bè',
    icon: 'ThumbsDown',
    situationVi: 'Bạn và bạn bè đang lên kế hoạch xem phim. Họ chọn một phim kinh dị, nhưng bạn không thích thể loại đó và muốn đề xuất phim khác.',
    sampleDialogue: [
      { speaker: 'A', text: 'Let us watch "The Dark House". I heard it is really scary.', translationVi: 'Hãy xem phim "The Dark House" đi. Mình nghe nói nó rất đáng sợ.' },
      { speaker: 'B', text: 'I am not sure about that. I do not really like horror movies.', translationVi: 'Mình không chắc về điều đó. Mình không thực sự thích phim kinh dị.' },
      { speaker: 'A', text: 'Oh, come on! It will be fun. The reviews are great.', translationVi: 'Ồ, thôi nào! Sẽ vui mà. Các bài đánh giá rất tuyệt.' },
      { speaker: 'B', text: 'I see what you mean, but they give me nightmares. Can we watch a comedy instead?', translationVi: 'Mình hiểu ý bạn, nhưng chúng khiến mình gặp ác mộng. Chúng ta xem phim hài thay thế được không?' },
      { speaker: 'A', text: 'A comedy? Well, maybe. Which one do you want to watch?', translationVi: 'Phim hài à? Chà, cũng được. Bạn muốn xem phim nào?' },
      { speaker: 'B', text: 'How about "The Funny Guys"? It looks hilarious.', translationVi: 'Phim "The Funny Guys" thì sao? Trông nó rất hài hước.' }
    ],
    keyVocabulary: [
      {
        term: 'scary',
        ipa: '/ˈskeri/',
        partOfSpeech: 'adj',
        meaningVi: 'đáng sợ',
        exampleEn: 'That movie was too scary.',
        exampleVi: 'Bộ phim đó quá đáng sợ.',
        associatedActions: [
          { en: 'cover eyes in fear', vi: 'che mắt vì sợ hãi' },
          { en: 'turn on the lights', vi: 'bật đèn lên' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'horror',
        ipa: '/ˈhɔːrər/',
        partOfSpeech: 'noun',
        meaningVi: 'kinh dị',
        exampleEn: 'I hate horror movies.',
        exampleVi: 'Tôi ghét phim kinh dị.',
        associatedActions: [
          { en: 'watch with friends', vi: 'xem phim cùng bạn bè' },
          { en: 'scream at a jumpscare', vi: 'hét lên khi bị giật mình' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'review',
        ipa: '/rɪˈvjuː/',
        partOfSpeech: 'noun',
        meaningVi: 'bài đánh giá',
        exampleEn: 'The book got good reviews.',
        exampleVi: 'Cuốn sách nhận được đánh giá tốt.',
        associatedActions: [
          { en: 'read movie ratings', vi: 'đọc đánh giá phim' },
          { en: 'write feedback online', vi: 'viết nhận xét trên mạng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'nightmare',
        ipa: '/ˈnaɪtmer/',
        partOfSpeech: 'noun',
        meaningVi: 'ác mộng',
        exampleEn: 'I had a terrible nightmare.',
        exampleVi: 'Tôi đã có một cơn ác mộng tồi tệ.',
        associatedActions: [
          { en: 'wake up suddenly', vi: 'thức giấc đột ngột' },
          { en: 'drink a glass of water', vi: 'uống một cốc nước' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1511295742362-92c96b124e52?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'comedy',
        ipa: '/ˈkɑːmədi/',
        partOfSpeech: 'noun',
        meaningVi: 'phim hài, kịch hài',
        exampleEn: 'Let us watch a romantic comedy.',
        exampleVi: 'Hãy xem một bộ phim hài lãng mạn.',
        associatedActions: [
          { en: 'laugh out loud', vi: 'cười thành tiếng lớn' },
          { en: 'enjoy with family', vi: 'thưởng thức cùng gia đình' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I am not sure about that.', translationVi: 'Tôi không chắc về điều đó.' },
      { phrase: 'I do not really like...', translationVi: 'Tôi không thực sự thích...' },
      { phrase: 'I see what you mean, but...', translationVi: 'Tôi hiểu ý bạn, nhưng...' },
      { phrase: 'Can we... instead?', translationVi: 'Thay vào đó chúng ta có thể... không?' },
      { phrase: 'How about...?', translationVi: 'Còn... thì sao?' }
    ],
    aiTutorPrompt: 'You suggest watching a scary movie with the user. The user will politely disagree because they do not like horror. Accept their alternative suggestion.',
    tags: ['movies', 'disagreement', 'plans']
  },
  {
    id: 'soc-agree-03',
    category: 'social',
    subcategory: 'agreeing-disagreeing',
    level: 'A2',
    titleEn: 'Debating weekend plans',
    titleVi: 'Tranh luận về kế hoạch cuối tuần',
    icon: 'Calendar',
    situationVi: 'Bạn và gia đình/bạn bè đang bàn xem nên đi biển hay đi leo núi vào cuối tuần. Mỗi người có một ý thích riêng.',
    sampleDialogue: [
      { speaker: 'A', text: 'We should go to the beach this weekend. The weather will be hot.', translationVi: 'Cuối tuần này chúng ta nên đi biển. Thời tiết sẽ rất nóng.' },
      { speaker: 'B', text: 'I do not agree. The beach will be too crowded. I prefer the mountains.', translationVi: 'Tôi không đồng ý. Bãi biển sẽ quá đông đúc. Tôi thích núi hơn.' },
      { speaker: 'A', text: 'But we can swim in the ocean. It is so relaxing.', translationVi: 'Nhưng chúng ta có thể bơi dưới biển. Rất thư giãn mà.' },
      { speaker: 'B', text: 'That is true, but hiking is better for our health.', translationVi: 'Đúng vậy, nhưng đi bộ đường dài tốt hơn cho sức khỏe của chúng ta.' },
      { speaker: 'A', text: 'Maybe you are right. The mountain air is very clean.', translationVi: 'Có lẽ bạn đúng. Không khí trên núi rất trong lành.' },
      { speaker: 'B', text: 'Yes, and it is much quieter than the beach.', translationVi: 'Đúng vậy, và nó yên tĩnh hơn nhiều so với bãi biển.' }
    ],
    keyVocabulary: [
      {
        term: 'beach',
        ipa: '/biːtʃ/',
        partOfSpeech: 'noun',
        meaningVi: 'bãi biển',
        exampleEn: 'Let us walk on the beach.',
        exampleVi: 'Hãy đi dạo trên bãi biển.',
        associatedActions: [
          { en: 'walk along the shore', vi: 'đi dạo dọc bờ biển' },
          { en: 'swim in the sea', vi: 'bơi dưới biển' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'crowded',
        ipa: '/ˈkraʊdɪd/',
        partOfSpeech: 'adj',
        meaningVi: 'đông đúc',
        exampleEn: 'The mall is very crowded.',
        exampleVi: 'Trung tâm mua sắm rất đông người.',
        associatedActions: [
          { en: 'push through the crowd', vi: 'chen qua đám đông' },
          { en: 'wait in a long line', vi: 'xếp hàng dài chờ đợi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'mountain',
        ipa: '/ˈmaʊntn/',
        partOfSpeech: 'noun',
        meaningVi: 'ngọn núi',
        exampleEn: 'We climbed the mountain.',
        exampleVi: 'Chúng tôi đã leo núi.',
        associatedActions: [
          { en: 'climb up the trail', vi: 'leo lên con đường mòn' },
          { en: 'enjoy scenic views', vi: 'ngắm cảnh đẹp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'hiking',
        ipa: '/ˈhaɪkɪŋ/',
        partOfSpeech: 'noun',
        meaningVi: 'đi bộ đường dài',
        exampleEn: 'I love hiking in the summer.',
        exampleVi: 'Tôi thích đi bộ đường dài vào mùa hè.',
        associatedActions: [
          { en: 'wear hiking boots', vi: 'mang giày đi bộ đường dài' },
          { en: 'carry a backpack', vi: 'đeo ba lô hành lý' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'quiet',
        ipa: '/ˈkwaɪət/',
        partOfSpeech: 'adj',
        meaningVi: 'yên tĩnh',
        exampleEn: 'Please be quiet in the library.',
        exampleVi: 'Vui lòng giữ yên lặng trong thư viện.',
        associatedActions: [
          { en: 'whisper quietly', vi: 'thì thầm nhỏ nhẹ' },
          { en: 'enjoy silent moments', vi: 'tận hưởng giây phút yên tĩnh' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I do not agree.', translationVi: 'Tôi không đồng ý.' },
      { phrase: 'That is true, but...', translationVi: 'Đó là sự thật, nhưng...' },
      { phrase: 'I prefer...', translationVi: 'Tôi thích... hơn.' },
      { phrase: 'Maybe you are right.', translationVi: 'Có lẽ bạn đúng.' },
      { phrase: 'It is much quieter than...', translationVi: 'Nó yên tĩnh hơn nhiều so với...' }
    ],
    aiTutorPrompt: 'Suggest going to the beach for the weekend. The user will disagree and suggest the mountains instead. Debate mildly before conceding to their point.',
    tags: ['weekend', 'debate', 'preferences']
  },
  {
    id: 'soc-agree-04',
    category: 'social',
    subcategory: 'agreeing-disagreeing',
    level: 'B1',
    titleEn: 'Agreeing to disagree',
    titleVi: 'Đồng ý bảo lưu quan điểm (đồng ý là chúng ta bất đồng)',
    icon: 'Handshake',
    situationVi: 'Bạn và một đồng nghiệp có quan điểm khác nhau về một vấn đề công việc. Dù đã thảo luận nhưng không ai thuyết phục được ai, nên cả hai quyết định dừng tranh luận.',
    sampleDialogue: [
      { speaker: 'A', text: 'I really think we should launch the product now to beat the competition.', translationVi: 'Tôi thực sự nghĩ chúng ta nên ra mắt sản phẩm ngay bây giờ để đánh bại đối thủ cạnh tranh.' },
      { speaker: 'B', text: 'I completely disagree. It is still full of bugs. We need more time for testing.', translationVi: 'Tôi hoàn toàn không đồng ý. Nó vẫn còn đầy lỗi. Chúng ta cần thêm thời gian để thử nghiệm.' },
      { speaker: 'A', text: 'But if we wait another month, we will lose our market advantage.', translationVi: 'Nhưng nếu chúng ta đợi thêm một tháng nữa, chúng ta sẽ đánh mất lợi thế thị trường.' },
      { speaker: 'B', text: 'Releasing a broken product will ruin our reputation. Quality is more important than speed.', translationVi: 'Phát hành một sản phẩm hỏng sẽ hủy hoại danh tiếng của chúng ta. Chất lượng quan trọng hơn tốc độ.' },
      { speaker: 'A', text: 'Well, it seems we are not going to convince each other on this.', translationVi: 'Chà, có vẻ như chúng ta sẽ không thuyết phục được nhau về chuyện này đâu.' },
      { speaker: 'B', text: 'You are right. Let us just agree to disagree and let the manager decide.', translationVi: 'Bạn đúng. Hãy cứ đồng ý bảo lưu quan điểm và để người quản lý quyết định.' }
    ],
    keyVocabulary: [
      {
        term: 'launch',
        ipa: '/lɔːntʃ/',
        partOfSpeech: 'verb',
        meaningVi: 'ra mắt, phát hành',
        exampleEn: 'We will launch the new app tomorrow.',
        exampleVi: 'Chúng tôi sẽ ra mắt ứng dụng mới vào ngày mai.',
        associatedActions: [
          { en: 'release the new app', vi: 'phát hành ứng dụng mới' },
          { en: 'announce to press', vi: 'công bố với báo chí' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'competition',
        ipa: '/ˌkɑːmpəˈtɪʃn/',
        partOfSpeech: 'noun',
        meaningVi: 'sự cạnh tranh, đối thủ',
        exampleEn: 'We face tough competition.',
        exampleVi: 'Chúng tôi đối mặt với sự cạnh tranh gay gắt.',
        associatedActions: [
          { en: 'compete in market', vi: 'cạnh tranh trên thị trường' },
          { en: 'analyze competitors', vi: 'phân tích đối thủ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'bug',
        ipa: '/bʌɡ/',
        partOfSpeech: 'noun',
        meaningVi: 'lỗi (phần mềm)',
        exampleEn: 'The program has a few bugs.',
        exampleVi: 'Chương trình có một vài lỗi.',
        associatedActions: [
          { en: 'report an issue', vi: 'báo cáo một sự cố' },
          { en: 'fix software defects', vi: 'sửa các lỗi phần mềm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'reputation',
        ipa: '/ˌrepjuˈteɪʃn/',
        partOfSpeech: 'noun',
        meaningVi: 'danh tiếng',
        exampleEn: 'The company has a good reputation.',
        exampleVi: 'Công ty có danh tiếng tốt.',
        associatedActions: [
          { en: 'build public trust', vi: 'xây dựng lòng tin công chúng' },
          { en: 'protect brand image', vi: 'bảo vệ hình ảnh thương hiệu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'convince',
        ipa: '/kənˈvɪns/',
        partOfSpeech: 'verb',
        meaningVi: 'thuyết phục',
        exampleEn: 'I tried to convince him to stay.',
        exampleVi: 'Tôi đã cố thuyết phục anh ấy ở lại.',
        associatedActions: [
          { en: 'present strong facts', vi: 'trình bày các dữ kiện xác đáng' },
          { en: 'change someone mind', vi: 'thay đổi suy nghĩ của ai đó' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I completely disagree.', translationVi: 'Tôi hoàn toàn không đồng ý.' },
      { phrase: 'We are not going to convince each other.', translationVi: 'Chúng ta sẽ không thuyết phục được nhau đâu.' },
      { phrase: 'Let us agree to disagree.', translationVi: 'Hãy đồng ý bảo lưu quan điểm (đồng ý là chúng ta bất đồng).' },
      { phrase: 'Quality is more important than speed.', translationVi: 'Chất lượng quan trọng hơn tốc độ.' },
      { phrase: 'Let the manager decide.', translationVi: 'Hãy để quản lý quyết định.' }
    ],
    aiTutorPrompt: 'You and the user are colleagues arguing about when to launch a product. After a brief debate, recognize that neither of you will change your mind and suggest agreeing to disagree.',
    tags: ['work', 'disagreement', 'compromise']
  },
  {
    id: 'soc-agree-05',
    category: 'social',
    subcategory: 'agreeing-disagreeing',
    level: 'B1',
    titleEn: 'Finding a compromise',
    titleVi: 'Tìm kiếm sự thỏa hiệp',
    icon: 'Scale',
    situationVi: 'Bạn và bạn cùng phòng đang cãi nhau về việc dọn dẹp nhà cửa. Hai người cùng đưa ra ý kiến và tìm một giải pháp mà cả hai đều chấp nhận được.',
    sampleDialogue: [
      { speaker: 'A', text: 'The apartment is always messy. I feel like I am doing all the cleaning.', translationVi: 'Căn hộ lúc nào cũng bừa bộn. Mình cảm thấy như mình đang phải làm mọi việc dọn dẹp.' },
      { speaker: 'B', text: 'That is not fair! I take out the trash and do the dishes.', translationVi: 'Như vậy không công bằng! Mình đổ rác và rửa bát mà.' },
      { speaker: 'A', text: 'Yes, but I vacuum, mop the floors, and clean the bathroom. It takes much longer.', translationVi: 'Có, nhưng mình hút bụi, lau nhà và dọn phòng tắm. Việc đó tốn nhiều thời gian hơn nhiều.' },
      { speaker: 'B', text: 'Okay, I understand your point. I have been really busy with work lately.', translationVi: 'Được rồi, mình hiểu ý bạn. Dạo này mình thực sự bận rộn với công việc.' },
      { speaker: 'A', text: 'How about we make a chore chart? We can split the tasks evenly.', translationVi: 'Hay là chúng ta lập một bảng phân công việc nhà? Chúng ta có thể chia đều các công việc.' },
      { speaker: 'B', text: 'That sounds like a fair compromise. Let us write it down tonight.', translationVi: 'Nghe có vẻ là một sự thỏa hiệp công bằng. Tối nay chúng ta hãy viết nó ra nhé.' }
    ],
    keyVocabulary: [
      {
        term: 'messy',
        ipa: '/ˈmesi/',
        partOfSpeech: 'adj',
        meaningVi: 'bừa bộn',
        exampleEn: 'His room is always messy.',
        exampleVi: 'Phòng của cậu ấy lúc nào cũng bừa bộn.',
        associatedActions: [
          { en: 'pick up scattered clothes', vi: 'nhặt quần áo vương vãi' },
          { en: 'tidy up the desk', vi: 'dọn dẹp bàn làm việc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'fair',
        ipa: '/fer/',
        partOfSpeech: 'adj',
        meaningVi: 'công bằng',
        exampleEn: 'That is not a fair decision.',
        exampleVi: 'Đó không phải là một quyết định công bằng.',
        associatedActions: [
          { en: 'treat people equally', vi: 'đối xử công bằng với mọi người' },
          { en: 'make honest decisions', vi: 'đưa ra quyết định trung thực' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'vacuum',
        ipa: '/ˈvækjuəm/',
        partOfSpeech: 'verb',
        meaningVi: 'hút bụi',
        exampleEn: 'I need to vacuum the carpet.',
        exampleVi: 'Tôi cần hút bụi tấm thảm.',
        associatedActions: [
          { en: 'plug in the vacuum', vi: 'cắm điện máy hút bụi' },
          { en: 'clean the living room rug', vi: 'hút sạch thảm phòng khách' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'chore',
        ipa: '/tʃɔːr/',
        partOfSpeech: 'noun',
        meaningVi: 'việc nhà, việc vặt',
        exampleEn: 'Doing chores teaches kids responsibility.',
        exampleVi: 'Làm việc nhà dạy trẻ em tính trách nhiệm.',
        associatedActions: [
          { en: 'wash dirty dishes', vi: 'rửa chén bát bẩn' },
          { en: 'take out rubbish', vi: 'đi đổ rác sinh hoạt' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'compromise',
        ipa: '/ˈkɑːmprəmaɪz/',
        partOfSpeech: 'noun/verb',
        meaningVi: 'sự thỏa hiệp',
        exampleEn: 'We reached a compromise.',
        exampleVi: 'Chúng tôi đã đạt được một sự thỏa hiệp.',
        associatedActions: [
          { en: 'meet halfway', vi: 'nhượng bộ lẫn nhau' },
          { en: 'sign an agreement', vi: 'ký một thỏa thuận' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'That is not fair!', translationVi: 'Như vậy không công bằng!' },
      { phrase: 'I understand your point.', translationVi: 'Tôi hiểu ý của bạn.' },
      { phrase: 'How about we make a...', translationVi: 'Hay là chúng ta làm một...' },
      { phrase: 'We can split the tasks evenly.', translationVi: 'Chúng ta có thể chia đều công việc.' },
      { phrase: 'That sounds like a fair compromise.', translationVi: 'Đó có vẻ là một sự thỏa hiệp công bằng.' }
    ],
    aiTutorPrompt: 'You and your roommate (the user) are arguing about household chores. Listen to their complaint, defend yourself slightly, but then agree to find a middle ground.',
    tags: ['roommates', 'chores', 'compromise']
  },
  {
    id: 'soc-agree-06',
    category: 'social',
    subcategory: 'agreeing-disagreeing',
    level: 'B2',
    titleEn: 'Respectfully challenging an opinion',
    titleVi: 'Phản biện một cách tôn trọng',
    icon: 'MessageSquare',
    situationVi: 'Trong một buổi thảo luận nhóm, một người đưa ra nhận định mà bạn cho là thiếu sót. Bạn phản biện lại ý kiến của họ một cách lịch sự và có cơ sở.',
    sampleDialogue: [
      { speaker: 'A', text: 'I think the main reason our sales dropped is because our prices are too high.', translationVi: 'Tôi nghĩ nguyên nhân chính khiến doanh số của chúng ta sụt giảm là do giá cả quá cao.' },
      { speaker: 'B', text: 'While I agree that price is a factor, I am not sure it is the main reason.', translationVi: 'Mặc dù tôi đồng ý rằng giá cả là một yếu tố, nhưng tôi không chắc đó là nguyên nhân chính.' },
      { speaker: 'A', text: 'What else could it be? Our competitors are much cheaper.', translationVi: 'Còn có thể là gì nữa? Đối thủ cạnh tranh của chúng ta rẻ hơn nhiều.' },
      { speaker: 'B', text: 'I would argue that our recent marketing campaign did not reach our target audience.', translationVi: 'Tôi muốn lập luận rằng chiến dịch tiếp thị gần đây của chúng ta đã không tiếp cận được đối tượng mục tiêu.' },
      { speaker: 'A', text: 'You might have a point there. Engagement on social media has been very low.', translationVi: 'Có thể bạn có lý. Tương tác trên mạng xã hội dạo này rất thấp.' },
      { speaker: 'B', text: 'Exactly. Perhaps we should focus on improving our marketing rather than just slashing prices.', translationVi: 'Chính xác. Có lẽ chúng ta nên tập trung vào việc cải thiện hoạt động tiếp thị thay vì chỉ cắt giảm giá cả.' }
    ],
    keyVocabulary: [
      {
        term: 'factor',
        ipa: '/ˈfæktər/',
        partOfSpeech: 'noun',
        meaningVi: 'yếu tố',
        exampleEn: 'Price is an important factor.',
        exampleVi: 'Giá cả là một yếu tố quan trọng.',
        associatedActions: [
          { en: 'identify key elements', vi: 'xác định các yếu tố cốt lõi' },
          { en: 'evaluate influences', vi: 'đánh giá các tác động' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'competitor',
        ipa: '/kəmˈpetɪtər/',
        partOfSpeech: 'noun',
        meaningVi: 'đối thủ cạnh tranh',
        exampleEn: 'Our competitor launched a new product.',
        exampleVi: 'Đối thủ cạnh tranh của chúng ta đã ra mắt sản phẩm mới.',
        associatedActions: [
          { en: 'monitor market rival', vi: 'theo dõi đối thủ trên thị trường' },
          { en: 'improve product quality', vi: 'nâng cao chất lượng sản phẩm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'argue',
        ipa: '/ˈɑːrɡjuː/',
        partOfSpeech: 'verb',
        meaningVi: 'tranh luận, lập luận',
        exampleEn: 'I would argue that we need more staff.',
        exampleVi: 'Tôi muốn lập luận rằng chúng ta cần thêm nhân viên.',
        associatedActions: [
          { en: 'state logical reasons', vi: 'nêu các lý lẽ logic' },
          { en: 'defend a viewpoint', vi: 'bảo vệ một góc nhìn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'audience',
        ipa: '/ˈɔːdiəns/',
        partOfSpeech: 'noun',
        meaningVi: 'đối tượng, khán giả',
        exampleEn: 'The target audience is young people.',
        exampleVi: 'Đối tượng mục tiêu là những người trẻ tuổi.',
        associatedActions: [
          { en: 'listen attentively', vi: 'lắng nghe chăm chú' },
          { en: 'applaud the speaker', vi: 'vỗ tay tán thưởng diễn giả' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'slash',
        ipa: '/slæʃ/',
        partOfSpeech: 'verb',
        meaningVi: 'cắt giảm mạnh (giá cả)',
        exampleEn: 'They slashed prices to clear inventory.',
        exampleVi: 'Họ cắt giảm giá để dọn sạch hàng tồn kho.',
        associatedActions: [
          { en: 'cut product prices', vi: 'giảm mạnh giá sản phẩm' },
          { en: 'offer special discounts', vi: 'đưa ra mức chiết khấu đặc biệt' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'While I agree that..., I am not sure...', translationVi: 'Mặc dù tôi đồng ý rằng..., nhưng tôi không chắc...' },
      { phrase: 'I would argue that...', translationVi: 'Tôi muốn lập luận rằng...' },
      { phrase: 'You might have a point there.', translationVi: 'Bạn có thể có lý ở điểm đó.' },
      { phrase: 'Perhaps we should focus on...', translationVi: 'Có lẽ chúng ta nên tập trung vào...' },
      { phrase: 'Rather than just...', translationVi: 'Thay vì chỉ...' }
    ],
    aiTutorPrompt: 'The user challenges your statement about why sales are dropping. Listen to their counter-argument about marketing and concede that they might be right.',
    tags: ['business', 'debate', 'professional']
  }
];
