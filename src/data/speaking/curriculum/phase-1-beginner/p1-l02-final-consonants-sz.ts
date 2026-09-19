import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p1L02FinalConsonantsSz: SpeakingCurriculumLesson = {
  id: 'p1-l02-final-consonants-sz',
  phaseId: 'phase-1-beginner',
  order: 2,
  titleEn: 'Final Consonants /s/ and /z/ Mastery',
  titleVi: 'Làm chủ phụ âm cuối /s/ và /z/ (Âm xì xát sống còn)',
  cefrLevel: 'A1',
  targetBandIelts: '0-3.0',
  estimatedMinutes: 15,
  summaryVi:
    'Khắc phục triệt để thói quen nuốt âm đuôi /s/ và /z/ của người Việt khi phát âm danh từ số nhiều và động từ chia ngôi thứ ba số ít.',
  category: 'daily_life',
  slug: 'final-consonants-sz',
  learningObjectivesVi: [
    'Phân biệt rõ ràng luồng hơi vô thanh của /s/ và độ rung thanh quản của /z/.',
    'Phát âm chính xác âm đuôi số nhiều và đuôi động từ thì hiện tại đơn không bỏ sót âm.',
    'Ứng dụng âm /s/ và /z/ tự nhiên trong các câu miêu tả thói quen và sở thích.',
    'Đạt từ 75 điểm trở lên trong bài kiểm tra phản xạ âm đuôi SafeHarbor.',
  ],
  stage1Phonetics: {
    titleVi: 'Khởi động cơ miệng: Phân biệt âm xì xát /s/ và /z/',
    focusSound: '/-s/, /-z/, /-ɪz/',
    vietnameseContrastiveTip:
      'Tiếng Việt là ngôn ngữ khép âm, tuyệt đối không có âm xì ở đuôi từ khiến người Việt luôn có xu hướng đọc "like" thay vì "likes", "book" thay vì "books". Trong tiếng Anh: âm /-s/ là âm vô thanh, khép nhẹ hai hàm răng và xì luồng gió sắc qua khe răng (dây thanh không rung); âm /-z/ có khẩu hình y hệt nhưng dây thanh quản ở cổ họng phải rung mạnh; đuôi /-ɪz/ đọc thêm một âm tiết khi từ kết thúc bằng âm xuýt (-s, -x, -z, -ch, -sh, -ge).',
    category: 'ending-consonants',
    phonemes: ['/s/', '/z/', '/ɪz/'],
    mouthTipVi:
      'Đặt ngón tay lên hõm cổ họng: khi phát âm /s/ trong "cats" bạn chỉ thấy gió mát luồn qua răng; khi phát âm /z/ trong "dogs" bạn sẽ cảm nhận rõ rệt độ rung rần rần của dây thanh quản.',
    video: {
      youtubeVideoId: 'f0W_2Z81R7A',
      channelName: "Rachel's English",
      startSeconds: 40,
      endSeconds: 110,
      title: "How to Pronounce S and Z Sounds - Rachel's English",
      mouthTipSummaryVi:
        'Quan sát sự tiếp xúc giữa hai hàm răng và luồng khí đẩy qua đầu lưỡi của giáo viên bản ngữ.',
    },
    targetPracticeWords: [
      { word: 'likes', ipa: '/laɪks/', meaningVi: 'thích (ngôi thứ ba)' },
      { word: 'plays', ipa: '/pleɪz/', meaningVi: 'chơi (ngôi thứ ba)' },
      { word: 'books', ipa: '/bʊks/', meaningVi: 'những quyển sách' },
      { word: 'dogs', ipa: '/dɒɡz/', meaningVi: 'những chú chó' },
      { word: 'watches', ipa: '/ˈwɒtʃɪz/', meaningVi: 'những chiếc đồng hồ' },
      { word: 'places', ipa: '/ˈpleɪsɪz/', meaningVi: 'các địa điểm' },
    ],
    minimalPairs: [
      {
        wordA: 'bus',
        ipaA: '/bʌs/',
        meaningA: 'xe buýt',
        wordB: 'buzz',
        ipaB: '/bʌz/',
        meaningB: 'tiếng vo ve',
        distinctionVi: '/s/ chỉ có gió rít vs /z/ có độ rung mạnh trong thanh quản',
      },
      {
        wordA: 'price',
        ipaA: '/praɪs/',
        meaningA: 'giá cả',
        wordB: 'prize',
        ipaB: '/praɪz/',
        meaningB: 'giải thưởng',
        distinctionVi: 'âm vô thanh không rung vs âm hữu thanh rung thanh quản',
      },
      {
        wordA: 'hiss',
        ipaA: '/hɪs/',
        meaningA: 'tiếng huýt xì',
        wordB: 'his',
        ipaB: '/hɪz/',
        meaningB: 'của anh ấy',
        distinctionVi: 'xì gió kéo dài vs rung ngắn dứt khoát',
      },
      {
        wordA: 'peace',
        ipaA: '/piːs/',
        meaningA: 'sự hòa bình',
        wordB: 'peas',
        ipaB: '/piːz/',
        meaningB: 'hạt đậu Hà Lan',
        distinctionVi: 'đuôi câm gió s vs đuôi rung thanh quản z',
      },
    ],
    practiceSentences: [
      {
        sentence: 'She likes cats and he plays with dogs.',
        phoneticTarget: '/s/, /z/',
        vietnameseTranslation: 'Cô ấy thích mèo và anh ấy chơi đùa với những chú chó.',
      },
      {
        sentence: 'This office charges fair prices for its services.',
        phoneticTarget: '/ɪz/, /s/, /z/',
        vietnameseTranslation: 'Văn phòng này tính giá cả hợp lý cho các dịch vụ của mình.',
      },
      {
        sentence: 'He misses his buses every single morning.',
        phoneticTarget: '/ɪz/, /z/',
        vietnameseTranslation: 'Anh ấy lỡ chuyến xe buýt của mình vào mỗi buổi sáng.',
      },
    ],
  },
  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: Sở thích và Thói quen ngôi thứ ba số ít',
    vietnameseGrammarRule:
      'Với chủ ngữ He, She, It hoặc danh từ số ít trong thì Hiện tại đơn, động từ phải thêm đuôi -s hoặc -es. Cố định phản xạ nói "He likes..." hoặc "She plays..." kèm âm đuôi rõ nét mà không chần chừ suy nghĩ.',
    formula: 'She likes {item_plural} and he plays {activity} every {timeframe}.',
    overviewVi:
      'Luyện tập thay thế các danh từ số nhiều và sở thích giúp cơ miệng quen với việc nhả âm đuôi /s/ và /z/ một cách tự nhiên.',
    highFrequencyVocab: [
      {
        term: 'likes',
        ipa: '/laɪks/',
        partOfSpeech: 'verb',
        meaningVi: 'thích (ngôi 3 số ít)',
        collocationHintVi: 'she really likes (cô ấy thực sự thích)',
        exampleSentenceEn: 'She likes drinking fresh juice.',
        exampleSentenceVi: 'Cô ấy thích uống nước ép tươi.',
      },
      {
        term: 'plays',
        ipa: '/pleɪz/',
        partOfSpeech: 'verb',
        meaningVi: 'chơi thể thao / nhạc cụ',
        collocationHintVi: 'plays tennis / plays guitar (chơi tennis / chơi đàn)',
        exampleSentenceEn: 'He plays tennis with his brother.',
        exampleSentenceVi: 'Anh ấy chơi tennis cùng anh trai mình.',
      },
      {
        term: 'watches',
        ipa: '/ˈwɒtʃɪz/',
        partOfSpeech: 'verb',
        meaningVi: 'xem, theo dõi',
        collocationHintVi: 'watches movies (xem phim)',
        exampleSentenceEn: 'My father watches news every evening.',
        exampleSentenceVi: 'Bố tôi xem tin tức mỗi buổi tối.',
      },
      {
        term: 'chooses',
        ipa: '/ˈtʃuːzɪz/',
        partOfSpeech: 'verb',
        meaningVi: 'lựa chọn',
        collocationHintVi: 'always chooses (luôn luôn lựa chọn)',
        exampleSentenceEn: 'She always chooses healthy food.',
        exampleSentenceVi: 'Cô ấy luôn luôn chọn đồ ăn lành mạnh.',
      },
    ],
    legoSlots: [
      {
        template: 'She likes {items} and he loves {hobbies}.',
        slots: {
          items: ['cats', 'books', 'apples', 'pictures'],
          hobbies: ['dogs', 'sports', 'movies', 'music'],
        },
        examples: [
          {
            en: 'She likes cats and he loves dogs.',
            vi: 'Cô ấy thích mèo và anh ấy yêu chó.',
          },
          {
            en: 'She likes books and he loves sports.',
            vi: 'Cô ấy thích sách và anh ấy yêu thể thao.',
          },
          {
            en: 'She likes apples and he loves movies.',
            vi: 'Cô ấy thích táo và anh ấy yêu phim ảnh.',
          },
        ],
      },
      {
        template: 'He plays {sport} and watches {show} every weekend.',
        slots: {
          sport: ['tennis', 'football', 'badminton', 'chess'],
          show: ['movies', 'matches', 'games', 'news'],
        },
        examples: [
          {
            en: 'He plays tennis and watches movies every weekend.',
            vi: 'Anh ấy chơi tennis và xem phim vào mỗi cuối tuần.',
          },
          {
            en: 'He plays football and watches matches every weekend.',
            vi: 'Anh ấy chơi bóng đá và xem các trận đấu vào mỗi cuối tuần.',
          },
        ],
      },
    ],
  },
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại dẫn dắt: Trò chuyện về sở thích của đồng nghiệp',
    contextVi:
      'Trong giờ nghỉ trưa tại văn phòng, Sarah hỏi bạn về sở thích của hai người bạn thân trong nhóm dự án để chuẩn bị quà sinh nhật.',
    frameworkType: '3-beat',
    turns: [
      {
        speaker: 'Partner',
        en: 'Hi! Do you know what Anna and David usually do on weekends?',
        vi: 'Chào bạn! Bạn có biết Anna và David thường làm gì vào cuối tuần không?',
        coreKeywords: ['know', 'Anna', 'David', 'weekends'],
      },
      {
        speaker: 'Learner',
        en: 'Yes, I do. Anna likes books and David loves outdoor sports.',
        vi: 'Tôi biết chứ. Anna thích sách và David rất yêu thích thể thao ngoài trời.',
        coreKeywords: ['likes', 'books', 'loves', 'sports'],
        suggestedStartersVi: ['Yes, I do. Anna...', 'Well, Anna likes...'],
      },
      {
        speaker: 'Partner',
        en: 'That sounds great! What kind of sports does David play?',
        vi: 'Nghe tuyệt thật đấy! David thường chơi môn thể thao nào thế?',
        coreKeywords: ['great', 'sports', 'David', 'play'],
      },
      {
        speaker: 'Learner',
        en: 'He plays tennis and runs in the park every Saturday.',
        vi: 'Anh ấy chơi tennis và chạy bộ trong công viên vào mỗi thứ Bảy.',
        coreKeywords: ['plays', 'tennis', 'runs', 'Saturday'],
        suggestedStartersVi: ['He plays...', 'David plays...'],
      },
      {
        speaker: 'Partner',
        en: 'And how about Anna? Does she stay at home?',
        vi: 'Thế còn Anna thì sao? Cô ấy có ở nhà không?',
        coreKeywords: ['Anna', 'stay', 'home'],
      },
      {
        speaker: 'Learner',
        en: 'She reads books and drinks tea because it relaxes her mind.',
        vi: 'Cô ấy đọc sách và uống trà vì điều đó giúp tâm trí cô ấy thư giãn.',
        coreKeywords: ['reads', 'books', 'drinks', 'tea', 'relaxes'],
        suggestedStartersVi: ['She reads...', 'She usually reads...'],
      },
    ],
  },
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Bật rõ âm đuôi /s/ và /z/',
    promptVi:
      'Hãy nói câu diễn tả sở thích của hai người với đầy đủ các âm đuôi /s/ và /z/ trong vòng 1.5 giây.',
    promptQuestionEn: 'What do she and he like to do on weekends?',
    targetSentence: 'She likes books and he plays tennis every weekend.',
    targetMeaningVi: 'Cô ấy thích sách và anh ấy chơi tennis vào mỗi cuối tuần.',
    acceptableVariations: [
      'She likes reading books and he plays tennis every weekend.',
      'She likes books and he plays tennis on weekends.',
      'She loves books and he plays tennis every weekend.',
    ],
    coreKeywords: ['likes', 'books', 'plays', 'tennis', 'weekend'],
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
    instructionsVi:
      'Chú ý phát âm rõ âm xì /s/ ở "likes", "books" và âm rung /z/ ở "plays". SafeHarbor sẽ lắng nghe và ghi nhận các âm đuôi then chốt.',
  },
};
