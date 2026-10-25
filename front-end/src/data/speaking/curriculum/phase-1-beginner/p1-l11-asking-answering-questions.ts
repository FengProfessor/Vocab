import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p1L11AskingAnsweringQuestions: SpeakingCurriculumLesson = {
  id: 'p1-l11-asking-answering-questions',
  phaseId: 'phase-1-beginner',
  order: 11,
  titleEn: 'Asking & Answering Questions Survival Kit',
  titleVi: 'Bộ câu hỏi & Trả lời sinh tồn (5W1H và Yes/No Questions)',
  cefrLevel: 'A1',
  targetBandIelts: '0-3.0',
  estimatedMinutes: 15,
  summaryVi:
    'Làm chủ ngữ điệu lên giọng (Yes/No questions) và xuống giọng (Wh-Questions) cùng các mẫu câu hỏi đường, hỏi giờ, hỏi dịch vụ sinh tồn khi đi du lịch.',
  category: 'travel_culinary',
  slug: 'asking-answering-questions',
  learningObjectivesVi: [
    'Phân biệt và thực hiện chuẩn xác ngữ điệu xuống giọng ↘ ở câu hỏi Wh- và lên giọng ↗ ở câu hỏi Yes/No.',
    'Sử dụng cụm từ mở đầu lịch sự "Excuse me" để bắt chuyện hỏi thông tin người lạ tự nhiên.',
    'Ghép nối hai câu hỏi thông tin thiết yếu (ở đâu và mấy giờ đóng cửa) trong cùng một lượt lời.',
    'Vượt qua bài kiểm tra phản xạ SafeHarbor với đầy đủ 6 từ khóa cốt lõi.',
  ],
  stage1Phonetics: {
    titleVi: 'Khởi động cơ miệng: Ngữ điệu câu hỏi Wh- (Xuống giọng ↘) vs Yes/No (Lên giọng ↗)',
    focusSound: 'Intonation Patterns: Falling ↘ for Wh- vs Rising ↗ for Yes/No',
    vietnameseContrastiveTip:
      'Trong tiếng Việt, câu hỏi thường được nhận biết bằng các từ tình thái cuối câu ("à", "hả", "chăng", "phải không") kèm dấu thanh. Trong tiếng Anh, ngữ điệu (âm điệu trầm bổng) truyền tải toàn bộ mục đích giao tiếp:\n1. Câu hỏi lấy thông tin Wh- (Where, What, When, Why, How): Luôn XUỐNG GIỌNG ở cuối câu (Falling intonation ↘) để tạo cảm giác chững chạc, yêu cầu thông tin rõ ràng ("Where is the station? ↘", "What time does it close? ↘").\n2. Câu hỏi Yes/No (Do you...? Is there...? Can I...?): Luôn LÊN GIỌNG VÚT ở cuối câu (Rising intonation ↗) để bày tỏ mong muốn được người đối diện xác nhận ("Do you have a map? ↗", "Is it nearby? ↗").',
    category: 'stress-linking',
    phonemes: ['/weə(r)/', '/ˈnɪərɪst/', '/kləʊz/'],
    mouthTipVi:
      'Với Wh-questions: Hãy hạ giọng xuống ngực ở từ cuối cùng; với Yes/No questions: Hãy nhấc bổng giọng lên mang tai ở từ cuối cùng như khi bạn đang ngạc nhiên.',
    video: {
      youtubeVideoId: 'U_kPzN8vB2A',
      channelName: "Rachel's English",
      startSeconds: 30,
      endSeconds: 105,
      title: "Intonation in English Questions - Rachel's English",
      mouthTipSummaryVi:
        'Quan sát sự đối lập giữa đường cong âm điệu đi xuống ở câu hỏi Wh- và đi vút lên ở câu hỏi Yes/No.',
    },
    targetPracticeWords: [
      { word: 'where', ipa: '/weə(r)/', meaningVi: 'ở đâu' },
      { word: 'nearest', ipa: '/ˈnɪərɪst/', meaningVi: 'gần nhất' },
      { word: 'station', ipa: '/ˈsteɪʃn/', meaningVi: 'nhà ga' },
      { word: 'close', ipa: '/kləʊz/', meaningVi: 'đóng cửa' },
      { word: 'excuse', ipa: '/ɪkˈskjuːz/', meaningVi: 'xin lỗi (để làm phiền)' },
      { word: 'pharmacy', ipa: '/ˈfɑːməsi/', meaningVi: 'hiệu thuốc' },
    ],
    minimalPairs: [
      {
        wordA: 'Where is the bank? ↘',
        ipaA: '/weər ɪz ðə bæŋk/ (falling)',
        meaningA: 'Ngân hàng ở đâu? (hỏi thông tin Wh-)',
        wordB: 'Is there a bank? ↗',
        ipaB: '/ɪz ðeər ə bæŋk/ (rising)',
        meaningB: 'Có ngân hàng nào ở đây không? (Yes/No)',
        distinctionVi: 'xuống giọng ở đuôi câu ↘ vs nhấc bổng giọng ở đuôi câu ↗',
      },
      {
        wordA: 'What time is it? ↘',
        ipaA: '/wɒt taɪm ɪz ɪt/ (falling)',
        meaningA: 'Mấy giờ rồi? (hỏi giờ trực diện)',
        wordB: 'Do you have the time? ↗',
        ipaB: '/duː ju hæv ðə taɪm/ (rising)',
        meaningB: 'Bạn có biết mấy giờ rồi không? (lên giọng)',
        distinctionVi: 'Wh-question xuống trầm vs Yes/No vút cao',
      },
      {
        wordA: 'How much is this? ↘',
        ipaA: '/haʊ mʌtʃ ɪz ðɪs/ (falling)',
        meaningA: 'Cái này bao nhiêu tiền? (Wh-question)',
        wordB: 'Can I pay by card? ↗',
        ipaB: '/kæn aɪ peɪ baɪ kɑːd/ (rising)',
        meaningB: 'Tôi trả bằng thẻ được không? (Yes/No)',
        distinctionVi: 'ngữ điệu hạ cuối câu vs ngữ điệu vút cao',
      },
      {
        wordA: 'When does it open? ↘',
        ipaA: '/wen dʌz ɪt ˈəʊpən/ (falling)',
        meaningA: 'Khi nào nó mở cửa?',
        wordB: 'Is it open now? ↗',
        ipaB: '/ɪz ɪt ˈəʊpən naʊ/ (rising)',
        meaningB: 'Bây giờ nó có đang mở cửa không?',
        distinctionVi: 'xuống dốc âm vực vs lên dốc âm vực',
      },
    ],
    practiceSentences: [
      {
        sentence: 'Excuse me, where is the nearest train station and what time does it close?',
        phoneticTarget: 'Wh- falling intonation on "station" and "close"',
        vietnameseTranslation:
          'Xin lỗi, cho hỏi ga tàu gần nhất ở đâu và mấy giờ thì nó đóng cửa vậy?',
      },
      {
        sentence: 'Do you have a local map, and can I walk there?',
        phoneticTarget: 'Yes/No rising intonation on "map" and "there"',
        vietnameseTranslation: 'Bạn có bản đồ địa phương không, và tôi có thể đi bộ đến đó được không?',
      },
      {
        sentence: 'What time does the morning express train depart?',
        phoneticTarget: 'Falling intonation on "depart"',
        vietnameseTranslation: 'Mấy giờ thì chuyến tàu nhanh buổi sáng khởi hành?',
      },
    ],
  },
  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: Hỏi đường và Tra cứu thời gian sinh tồn',
    vietnameseGrammarRule:
      'Khi hỏi người lạ ở nơi công cộng, luôn mở đầu bằng "Excuse me" để thể hiện phép lịch sự. Tiếp theo ghép hai vế câu hỏi thông dụng: "Where is the nearest + [địa điểm] + and what time does it close?". Trợ động từ "does" đi cùng động từ nguyên mẫu "close".',
    formula: 'Excuse me, where is the nearest {facility} and what time does it {action_verb}?',
    overviewVi:
      'Đây là khung câu sống còn số một của mọi du khách quốc tế khi cần tìm nhà ga, hiệu thuốc, bệnh viện hay siêu thị.',
    highFrequencyVocab: [
      {
        term: 'nearest',
        ipa: '/ˈnɪərɪst/',
        partOfSpeech: 'adj',
        meaningVi: 'gần nhất',
        collocationHintVi: 'the nearest station (nhà ga gần nhất)',
        exampleSentenceEn: 'Where is the nearest convenience store?',
        exampleSentenceVi: 'Cửa hàng tiện lợi gần nhất ở đâu vậy?',
      },
      {
        term: 'station',
        ipa: '/ˈsteɪʃn/',
        partOfSpeech: 'noun',
        meaningVi: 'nhà ga, trạm dừng',
        collocationHintVi: 'train station / bus station (nhà ga xe lửa / bến xe buýt)',
        exampleSentenceEn: 'The train station is within walking distance.',
        exampleSentenceVi: 'Nhà ga xe lửa nằm trong khoảng cách có thể đi bộ được.',
      },
      {
        term: 'close',
        ipa: '/kləʊz/',
        partOfSpeech: 'verb',
        meaningVi: 'đóng cửa (hoạt động)',
        collocationHintVi: 'what time does it close (mấy giờ nó đóng cửa)',
        exampleSentenceEn: 'The store closes at ten tonight.',
        exampleSentenceVi: 'Cửa hàng sẽ đóng cửa lúc mười giờ tối nay.',
      },
      {
        term: 'direction',
        ipa: '/dəˈrekʃn/',
        partOfSpeech: 'noun',
        meaningVi: 'phương hướng, chỉ dẫn',
        collocationHintVi: 'ask for directions (hỏi đường đi)',
        exampleSentenceEn: 'Could you give me directions to the museum?',
        exampleSentenceVi: 'Bạn có thể chỉ đường cho tôi đến viện bảo tàng được không?',
      },
    ],
    legoSlots: [
      {
        template: 'Excuse me, where is the nearest {location} and what time does it close?',
        slots: {
          location: ['train station', 'bus stop', 'pharmacy', 'supermarket'],
        },
        examples: [
          {
            en: 'Excuse me, where is the nearest train station and what time does it close?',
            vi: 'Xin lỗi, ga tàu gần nhất ở đâu và mấy giờ nó đóng cửa vậy?',
          },
          {
            en: 'Excuse me, where is the nearest pharmacy and what time does it close?',
            vi: 'Xin lỗi, hiệu thuốc gần nhất ở đâu và mấy giờ nó đóng cửa vậy?',
          },
        ],
      },
      {
        template: 'Can you tell me how to get to the {landmark}, please?',
        slots: {
          landmark: ['airport', 'central bank', 'city hospital', 'post office'],
        },
        examples: [
          {
            en: 'Can you tell me how to get to the airport, please?',
            vi: 'Bạn có thể chỉ cho tôi cách đến sân bay được không ạ?',
          },
          {
            en: 'Can you tell me how to get to the city hospital, please?',
            vi: 'Bạn có thể chỉ cho tôi cách đến bệnh viện thành phố được không ạ?',
          },
        ],
      },
    ],
  },
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại dẫn dắt: Hỏi đường tại quầy hỗ trợ du lịch',
    contextVi:
      'Bạn vừa xuống sân bay và đang đứng trước quầy thông tin hỗ trợ du khách (Tourist Information Desk) để hỏi đường đi vào trung tâm thành phố.',
    frameworkType: '3-beat',
    turns: [
      {
        speaker: 'Partner',
        en: 'Hello! Welcome to the city. How can I assist you today?',
        vi: 'Xin chào! Chào mừng quý khách đến với thành phố. Tôi có thể hỗ trợ gì cho bạn hôm nay?',
        coreKeywords: ['welcome', 'city', 'assist', 'today'],
      },
      {
        speaker: 'Learner',
        en: 'Excuse me, where is the nearest train station and what time does it close?',
        vi: 'Xin lỗi, cho hỏi ga tàu gần nhất ở đâu và mấy giờ thì nó đóng cửa vậy?',
        coreKeywords: ['excuse', 'where', 'nearest', 'train', 'station', 'what', 'time', 'close'],
        suggestedStartersVi: ['Excuse me, where is...', 'Could you tell me where...'],
      },
      {
        speaker: 'Partner',
        en: 'The train station is right across the street, just a two-minute walk.',
        vi: 'Ga tàu nằm ngay bên kia đường, chỉ cách đây hai phút đi bộ thôi.',
        coreKeywords: ['station', 'across', 'street', 'two-minute', 'walk'],
      },
      {
        speaker: 'Learner',
        en: 'That is so convenient! And do trains run late at night?',
        vi: 'Thật là tiện lợi quá! Và tàu có chạy muộn vào ban đêm không ạ?',
        coreKeywords: ['convenient', 'trains', 'run', 'late', 'night'],
        suggestedStartersVi: ['That is convenient...', 'Do trains run...'],
      },
      {
        speaker: 'Partner',
        en: 'Yes, the station stays open until midnight every day.',
        vi: 'Có chứ, nhà ga mở cửa cho tới nửa đêm mỗi ngày.',
        coreKeywords: ['yes', 'station', 'open', 'midnight'],
      },
      {
        speaker: 'Learner',
        en: 'Thank you very much for your kind help!',
        vi: 'Cảm ơn bạn rất nhiều vì sự giúp đỡ tận tình!',
        coreKeywords: ['thank', 'much', 'kind', 'help'],
        suggestedStartersVi: ['Thank you very much...', 'I appreciate your...'],
      },
    ],
  },
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Hỏi vị trí ga tàu và thời gian đóng cửa',
    promptVi:
      'Hãy nói câu hỏi lịch sự tìm nhà ga gần nhất và thời gian đóng cửa với ngữ điệu xuống giọng tự nhiên trong vòng 2 giây.',
    promptQuestionEn: 'How do you politely ask for the location of the nearest train station and its closing time?',
    targetSentence: 'Excuse me, where is the nearest train station and what time does it close?',
    targetMeaningVi: 'Xin lỗi, ga tàu gần nhất ở đâu và mấy giờ thì nó đóng cửa?',
    acceptableVariations: [
      'Excuse me, where is the nearest train station, and what time does it close?',
      'Could you tell me where the nearest train station is and what time it closes?',
      'Excuse me, where is the train station and what time does it close?',
    ],
    coreKeywords: ['excuse', 'where', 'nearest', 'train', 'station', 'what', 'time', 'close'],
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1500,
    instructionsVi:
      'Bắt đầu bằng "Excuse me" và xuống giọng ở "station" và "close". SafeHarbor sẽ nhận diện các từ khóa nội dung thiết yếu.',
  },
};
