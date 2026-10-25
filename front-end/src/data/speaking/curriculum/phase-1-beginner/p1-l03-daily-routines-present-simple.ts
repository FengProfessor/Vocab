import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p1L03DailyRoutinesPresentSimple: SpeakingCurriculumLesson = {
  id: 'p1-l03-daily-routines-present-simple',
  phaseId: 'phase-1-beginner',
  order: 3,
  titleEn: 'Daily Routines & Present Simple',
  titleVi: 'Lịch trình sinh hoạt & Thì Hiện tại đơn',
  cefrLevel: 'A1',
  targetBandIelts: '0-3.0',
  estimatedMinutes: 15,
  summaryVi:
    'Hình thành phản xạ kể lại thời gian biểu buổi sáng và sinh hoạt hàng ngày kết hợp kỹ thuật nối âm phụ âm sang nguyên âm liền mạch.',
  category: 'daily_life',
  slug: 'daily-routines-present-simple',
  learningObjectivesVi: [
    'Nắm vững kỹ thuật nối âm phụ âm sang nguyên âm (C ‿ V) như "wake up", "get up", "cup of".',
    'Sử dụng thì Hiện tại đơn với chủ ngữ "I" để nói về lịch trình buổi sáng không ngắc ngứ.',
    'Áp dụng các trạng từ chỉ tần suất phổ biến (always, usually, sometimes, never) vào câu nói.',
    'Vượt qua bài đánh giá phản xạ SafeHarbor với độ trễ dưới 1.5 giây.',
  ],
  stage1Phonetics: {
    titleVi: 'Khởi động cơ miệng: Kỹ thuật nối âm phụ âm sang nguyên âm (C ‿ V)',
    focusSound: 'Consonant-to-Vowel Linking (C ‿ V)',
    vietnameseContrastiveTip:
      'Người Việt có thói quen đọc từng từ ngắt quãng như tiếng Việt ("uếch" - "ắp"). Trong tiếng Anh giao tiếp tự nhiên, khi một từ tận cùng là phụ âm và từ kế tiếp bắt đầu bằng nguyên âm (a, e, i, o, u), phụ âm đuôi sẽ tự động bắt cầu nối dính vào nguyên âm phía sau: "wake up" phát âm liền mạch thành "way-kup", "get up" thành "ge-tup", "drink a cup of" thành "drin-ka-cu-pov".',
    category: 'stress-linking',
    phonemes: ['/k‿ʌ/', '/t‿ʌ/', '/p‿ə/'],
    mouthTipVi:
      'Đừng dừng luồng hơi sau phụ âm đuôi. Hãy giữ chuyển động môi lưỡi liên tục như đang trượt trên một dốc thoai thoải, tạo nhịp điệu trôi chảy tự nhiên.',
    video: {
      youtubeVideoId: 'U_54fT9E93U',
      channelName: "Rachel's English",
      startSeconds: 30,
      endSeconds: 100,
      title: "Linking Consonant to Vowel in American English - Rachel's English",
      mouthTipSummaryVi:
        'Quan sát sự liền mạch giữa phụ âm cuối của từ thứ nhất với nguyên âm mở đầu của từ thứ hai mà không hề ngắt hơi.',
    },
    targetPracticeWords: [
      { word: 'wake up', ipa: '/ˈweɪ.kʌp/', meaningVi: 'thức giấc' },
      { word: 'get up', ipa: '/ˈɡe.tʌp/', meaningVi: 'rời khỏi giường' },
      { word: 'turn on', ipa: '/ˈtɜː.nɒn/', meaningVi: 'bật lên (đèn/máy)' },
      { word: 'look at', ipa: '/ˈlʊ.kæt/', meaningVi: 'nhìn vào' },
      { word: 'cup of', ipa: '/ˈkʌ.pəv/', meaningVi: 'tách, ly (chứa nước)' },
      { word: 'clean up', ipa: '/ˈkliː.nʌp/', meaningVi: 'dọn dẹp sạch sẽ' },
    ],
    minimalPairs: [
      {
        wordA: 'wake up',
        ipaA: '/weɪk ʌp/',
        meaningA: 'thức giấc',
        wordB: 'walk up',
        ipaB: '/wɔːk ʌp/',
        meaningB: 'bước lên, tiến lại',
        distinctionVi: 'nguyên âm đôi /eɪ/ vs nguyên âm dài tròn môi /ɔː/',
      },
      {
        wordA: 'take in',
        ipaA: '/teɪk ɪn/',
        meaningA: 'tiếp nhận, hiểu',
        wordB: 'take on',
        ipaB: '/teɪk ɒn/',
        meaningB: 'đảm nhận, gánh vác',
        distinctionVi: 'nối phụ âm k vào /ɪ/ ngắn vs nối k vào /ɒ/ tròn',
      },
      {
        wordA: 'get up',
        ipaA: '/ɡet ʌp/',
        meaningA: 'thức dậy rời giường',
        wordB: 'get out',
        ipaB: '/ɡet aʊt/',
        meaningB: 'đi ra ngoài',
        distinctionVi: 'nối t vào /ʌ/ mở vừa vs nối t vào nguyên âm đôi /aʊ/',
      },
      {
        wordA: 'pick up',
        ipaA: '/pɪk ʌp/',
        meaningA: 'nhặt lên, đón ai',
        wordB: 'pack up',
        ipaB: '/pæk ʌp/',
        meaningB: 'gói ghém đồ đạc',
        distinctionVi: 'âm /ɪ/ thả lỏng ngắn vs âm /æ/ đè hạ quai hàm sâu',
      },
    ],
    practiceSentences: [
      {
        sentence: 'I wake up early and get up at six.',
        phoneticTarget: '/k‿ʌ/, /t‿ʌ/',
        vietnameseTranslation: 'Tôi thức giấc sớm và rời khỏi giường lúc sáu giờ.',
      },
      {
        sentence: 'I drink a cup of hot coffee every morning.',
        phoneticTarget: '/k‿ə/, /p‿ə/',
        vietnameseTranslation: 'Tôi uống một tách cà phê nóng vào mỗi buổi sáng.',
      },
      {
        sentence: 'Please turn on the light and look at this.',
        phoneticTarget: '/n‿ɒ/, /k‿æt/',
        vietnameseTranslation: 'Làm ơn bật đèn lên và nhìn vào cái này.',
      },
    ],
  },
  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: Thói quen sinh hoạt hàng ngày',
    vietnameseGrammarRule:
      'Với chủ ngữ "I", động từ chỉ hành động được giữ nguyên thể (V-bare). Hãy kết hợp trạng từ tần suất (always, usually, sometimes, never) đứng ngay trước động từ chính để câu nói tự nhiên và phong phú.',
    formula: 'I usually {action} at {time} and then I {next_action}.',
    overviewVi:
      'Cấu trúc cố định giúp bạn tự động tuôn trào lịch trình hàng ngày mà không cần lo lắng về chia thì hay biến đổi hình thái từ.',
    highFrequencyVocab: [
      {
        term: 'usually',
        ipa: '/ˈjuːʒuəli/',
        partOfSpeech: 'adv',
        meaningVi: 'thường thường, thông thường',
        collocationHintVi: 'I usually wake up (tôi thường thức dậy)',
        exampleSentenceEn: 'I usually have breakfast at seven o’clock.',
        exampleSentenceVi: 'Tôi thường ăn sáng lúc bảy giờ.',
      },
      {
        term: 'brush',
        ipa: '/brʌʃ/',
        partOfSpeech: 'verb',
        meaningVi: 'chải, đánh (răng)',
        collocationHintVi: 'brush my teeth (đánh răng của tôi)',
        exampleSentenceEn: 'I always brush my teeth after eating.',
        exampleSentenceVi: 'Tôi luôn luôn đánh răng sau khi ăn.',
      },
      {
        term: 'routine',
        ipa: '/ruːˈtiːn/',
        partOfSpeech: 'noun',
        meaningVi: 'thói quen, lịch trình đều đặn',
        collocationHintVi: 'daily morning routine (lịch trình buổi sáng hàng ngày)',
        exampleSentenceEn: 'My morning routine keeps me energetic.',
        exampleSentenceVi: 'Thói quen buổi sáng giúp tôi luôn tràn đầy năng lượng.',
      },
      {
        term: 'leave',
        ipa: '/liːv/',
        partOfSpeech: 'verb',
        meaningVi: 'rời khỏi, xuất phát',
        collocationHintVi: 'leave home for work (rời nhà đi làm)',
        exampleSentenceEn: 'I leave my house at seven thirty.',
        exampleSentenceVi: 'Tôi rời nhà lúc bảy giờ ba mươi.',
      },
    ],
    legoSlots: [
      {
        template: 'I usually wake up at {time} and drink {drink}.',
        slots: {
          time: ['six o’clock', 'six thirty', 'seven o’clock', 'seven fifteen'],
          drink: ['hot coffee', 'warm water', 'green tea', 'fresh milk'],
        },
        examples: [
          {
            en: 'I usually wake up at six thirty and drink hot coffee.',
            vi: 'Tôi thường thức dậy lúc sáu giờ ba mươi và uống cà phê nóng.',
          },
          {
            en: 'I usually wake up at seven o’clock and drink warm water.',
            vi: 'Tôi thường thức dậy lúc bảy giờ và uống nước ấm.',
          },
        ],
      },
      {
        template: 'After that, I {morning_action} and leave for work at {time}.',
        slots: {
          morning_action: ['brush my teeth', 'take a quick shower', 'eat breakfast', 'exercise'],
          time: ['seven forty-five', 'eight o’clock', 'eight fifteen'],
        },
        examples: [
          {
            en: 'After that, I brush my teeth and leave for work at eight o’clock.',
            vi: 'Sau đó, tôi đánh răng và đi làm lúc tám giờ.',
          },
          {
            en: 'After that, I take a quick shower and leave for work at eight fifteen.',
            vi: 'Sau đó, tôi tắm nhanh và đi làm lúc tám giờ mười lăm.',
          },
        ],
      },
    ],
  },
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại dẫn dắt: Trao đổi thói quen buổi sáng tại nơi làm việc',
    contextVi:
      'Sáng sớm thứ Hai tại phòng nghỉ công ty, Mark khen bạn trông rất tỉnh táo và hỏi thăm bí quyết thói quen buổi sáng của bạn.',
    frameworkType: '3-beat',
    turns: [
      {
        speaker: 'Partner',
        en: 'Good morning! You look very fresh and energetic today. What is your secret?',
        vi: 'Chào buổi sáng! Trông bạn hôm nay thật tươi tắn và nhiều năng lượng. Bí quyết là gì thế?',
        coreKeywords: ['morning', 'fresh', 'energetic', 'secret'],
      },
      {
        speaker: 'Learner',
        en: 'Good morning, Mark! I usually wake up early and take a walk.',
        vi: 'Chào buổi sáng Mark! Tôi thường thức dậy sớm và đi dạo một chút.',
        coreKeywords: ['morning', 'wake', 'early', 'walk'],
        suggestedStartersVi: ['Good morning! I usually...', 'Well, I always...'],
      },
      {
        speaker: 'Partner',
        en: 'Really? What time do you usually get up every day?',
        vi: 'Thật sao? Bạn thường rời giường lúc mấy giờ mỗi ngày vậy?',
        coreKeywords: ['time', 'usually', 'get', 'up'],
      },
      {
        speaker: 'Learner',
        en: 'I usually wake up at six thirty and drink hot coffee.',
        vi: 'Tôi thường thức dậy lúc sáu giờ ba mươi và uống một tách cà phê nóng.',
        coreKeywords: ['usually', 'wake', 'six', 'thirty', 'drink', 'coffee'],
        suggestedStartersVi: ['I usually wake up at...', 'Around six thirty...'],
      },
      {
        speaker: 'Partner',
        en: 'Do you also have breakfast at home before going to work?',
        vi: 'Bạn có ăn sáng ở nhà trước khi đi làm không?',
        coreKeywords: ['breakfast', 'home', 'work'],
      },
      {
        speaker: 'Learner',
        en: 'Yes, I eat bread and eggs at home because it gives me energy.',
        vi: 'Có chứ, tôi ăn bánh mì và trứng ở nhà vì nó cung cấp năng lượng cho tôi.',
        coreKeywords: ['eat', 'bread', 'eggs', 'home', 'energy'],
        suggestedStartersVi: ['Yes, I eat...', 'Of course, I usually have...'],
      },
    ],
  },
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Kể lại thói quen buổi sáng',
    promptVi:
      'Hãy nói câu diễn tả thói quen thức dậy lúc 6:30 và uống cà phê nóng với kỹ thuật nối âm mượt mà.',
    promptQuestionEn: 'What is your regular morning routine when you start the day?',
    targetSentence: 'I usually wake up at six thirty and drink hot coffee.',
    targetMeaningVi: 'Tôi thường thức dậy lúc sáu giờ ba mươi và uống cà phê nóng.',
    acceptableVariations: [
      'I usually wake up at six thirty and drink a cup of coffee.',
      'I usually get up at six thirty and drink hot coffee.',
      'Normally I wake up at six thirty and drink hot coffee.',
    ],
    coreKeywords: ['usually', 'wake', 'up', 'six', 'thirty', 'coffee'],
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
    instructionsVi:
      'Hãy nối âm "wake up" thành "way-kup" mượt mà. Hệ thống nhận diện các từ khóa nội dung then chốt mà không phạt lỗi ngắt hơi nhẹ.',
  },
};
