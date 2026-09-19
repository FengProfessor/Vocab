import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p1L08ConsonantClustersPlGr: SpeakingCurriculumLesson = {
  id: 'p1-l08-consonant-clusters-pl-gr',
  phaseId: 'phase-1-beginner',
  order: 8,
  titleEn: 'Consonant Clusters /pl/, /pr/, /gl/, /gr/',
  titleVi: 'Cụm phụ âm lướt với L và R (/pl/, /pr/, /gl/, /gr/)',
  cefrLevel: 'A1',
  targetBandIelts: '0-3.0',
  estimatedMinutes: 15,
  summaryVi:
    'Làm chủ sự phối hợp giữa hai môi với chuyển động áp lưỡi /l/ và cuộn lưỡi /r/ trong các cụm phụ âm đôi mở đầu như "play", "please", "great", "green".',
  category: 'daily_life',
  slug: 'consonant-clusters-pl-gr',
  learningObjectivesVi: [
    'Phân biệt rõ ràng vị trí lưỡi giữa âm lướt /l/ (chạm lợi trên) và âm cuộn /r/ (không chạm vòm họng).',
    'Phát âm chuẩn xác các cặp từ tối thiểu như "play" vs "pray", "glass" vs "grass".',
    'Tự tin đưa ra lời rủ rê, đề nghị tham gia trò chơi hoặc hoạt động nhóm.',
    'Đạt điểm SafeHarbor từ 75% trở lên mà không nhầm lẫn giữa L và R.',
  ],
  stage1Phonetics: {
    titleVi: 'Khởi động cơ miệng: Cụm phụ âm lướt /pl/, /pr/, /gl/, /gr/',
    focusSound: 'Liquid Clusters /pl/, /pr/, /gl/, /gr/',
    vietnameseContrastiveTip:
      'Trong tiếng Việt, các phụ âm như "p", "g" không bao giờ kết hợp trực tiếp với "l" hoặc "r". Điều này dẫn tới hai lỗi kinh điển ở người học mất gốc:\n1. Tách từ chèn nguyên âm đệm: đọc "play" thành "pờ-lây", "great" thành "gờ-rết".\n2. Nhầm lẫn giữa /l/ và /r/: Với /l/, đầu lưỡi phải dính chặt vào nướu răng cửa trên rồi nhả xuống; với /r/, đầu lưỡi phải cuộn ngược về phía sau khoang miệng và TUYỆT ĐỐI KHÔNG ĐƯỢC CHẠM vào bất cứ vị trí nào trong miệng.',
    category: 'consonant-clusters',
    phonemes: ['/pl/', '/pr/', '/gl/', '/gr/'],
    mouthTipVi:
      'Với /pr/ và /gr/: Chu môi hơi tròn nhẹ về phía trước như chuẩn bị huýt sáo trước khi phát âm, kéo đầu lưỡi về cuống họng để âm /r/ thật trầm và ấm.',
    video: {
      youtubeVideoId: '1eOeVZ-o1zI',
      channelName: "Rachel's English",
      startSeconds: 35,
      endSeconds: 110,
      title: "R and L Consonant Clusters - Rachel's English",
      mouthTipSummaryVi:
        'Quan sát sự khác biệt rõ rệt giữa đầu lưỡi chạm nướu ở âm L và đầu lưỡi cuộn treo lơ lửng ở âm R.',
    },
    targetPracticeWords: [
      { word: 'play', ipa: '/pleɪ/', meaningVi: 'chơi đùa' },
      { word: 'please', ipa: '/pliːz/', meaningVi: 'làm ơn, vui lòng' },
      { word: 'practice', ipa: '/ˈpræktɪs/', meaningVi: 'luyện tập' },
      { word: 'great', ipa: '/ɡreɪt/', meaningVi: 'tuyệt vời' },
      { word: 'green', ipa: '/ɡriːn/', meaningVi: 'màu xanh lá' },
      { word: 'glad', ipa: '/ɡlæd/', meaningVi: 'vui mừng, hân hoan' },
    ],
    minimalPairs: [
      {
        wordA: 'play',
        ipaA: '/pleɪ/',
        meaningA: 'chơi đùa',
        wordB: 'pray',
        ipaB: '/preɪ/',
        meaningB: 'cầu nguyện',
        distinctionVi: 'đầu lưỡi chạm nướu trên /pl/ vs đầu lưỡi cuộn tròn không chạm /pr/',
      },
      {
        wordA: 'glass',
        ipaA: '/ɡlɑːs/',
        meaningA: 'kính, ly thủy tinh',
        wordB: 'grass',
        ipaB: '/ɡrɑːs/',
        meaningB: 'bãi cỏ xanh',
        distinctionVi: 'âm /gl/ nhả lưỡi từ nướu vs âm /gr/ cuộn vòm sâu',
      },
      {
        wordA: 'glow',
        ipaA: '/ɡləʊ/',
        meaningA: 'phát sáng',
        wordB: 'grow',
        ipaB: '/ɡrəʊ/',
        meaningB: 'phát triển, lớn lên',
        distinctionVi: 'âm l lướt mềm mại vs âm r tròn môi sâu họng',
      },
      {
        wordA: 'clash',
        ipaA: '/klæʃ/',
        meaningA: 'va chạm, xung đột',
        wordB: 'crash',
        ipaB: '/kræʃ/',
        meaningB: 'đâm sầm, sụp đổ',
        distinctionVi: 'phụ âm lướt l vs phụ âm cuộn r',
      },
    ],
    practiceSentences: [
      {
        sentence: 'Please play this great game with my green team.',
        phoneticTarget: '/pl/, /ɡr/',
        vietnameseTranslation: 'Làm ơn hãy chơi trò chơi tuyệt vời này cùng đội áo xanh của tôi.',
      },
      {
        sentence: 'I am glad to practice English on the green grass.',
        phoneticTarget: '/ɡl/, /pr/, /ɡr/',
        vietnameseTranslation: 'Tôi rất vui khi được luyện tập tiếng Anh trên bãi cỏ xanh.',
      },
      {
        sentence: 'They plan to grow fresh plants in the garden.',
        phoneticTarget: '/pl/, /ɡr/',
        vietnameseTranslation: 'Họ có kế hoạch trồng các loại cây tươi tốt trong vườn.',
      },
    ],
  },
  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: Rủ rê và Tham gia hoạt động nhóm',
    vietnameseGrammarRule:
      'Sử dụng cấu trúc rủ rê thân mật: "Please + V-bare + with..." hoặc "Let us + V-bare + with...". Cụm danh từ phía sau kết hợp tính từ miêu tả (great, green, fun) để tạo câu nói sống động.',
    formula: 'Please {action_cluster} this {adjective_gr} game with our {team_color} team.',
    overviewVi:
      'Mẫu câu giúp bạn dễ dàng hòa nhập vào các hoạt động tập thể ngoài trời hoặc câu lạc bộ giao tiếp quốc tế.',
    highFrequencyVocab: [
      {
        term: 'great',
        ipa: '/ɡreɪt/',
        partOfSpeech: 'adj',
        meaningVi: 'tuyệt vời, to lớn',
        collocationHintVi: 'a great opportunity (một cơ hội tuyệt vời)',
        exampleSentenceEn: 'We had a great time together yesterday.',
        exampleSentenceVi: 'Chúng tôi đã có một khoảng thời gian tuyệt vời bên nhau hôm qua.',
      },
      {
        term: 'green',
        ipa: '/ɡriːn/',
        partOfSpeech: 'adj',
        meaningVi: 'màu xanh lá cây',
        collocationHintVi: 'green grass / green tea (bãi cỏ xanh / trà xanh)',
        exampleSentenceEn: 'The park has lush green grass.',
        exampleSentenceVi: 'Công viên có bãi cỏ xanh mướt.',
      },
      {
        term: 'practice',
        ipa: '/ˈpræktɪs/',
        partOfSpeech: 'verb',
        meaningVi: 'luyện tập, thực hành',
        collocationHintVi: 'practice speaking English (luyện nói tiếng Anh)',
        exampleSentenceEn: 'I practice speaking English every day.',
        exampleSentenceVi: 'Tôi luyện nói tiếng Anh mỗi ngày.',
      },
      {
        term: 'glad',
        ipa: '/ɡlæd/',
        partOfSpeech: 'adj',
        meaningVi: 'hân hoan, vui mừng',
        collocationHintVi: 'glad to help you (rất vui được giúp bạn)',
        exampleSentenceEn: 'I am so glad you joined us today.',
        exampleSentenceVi: 'Tôi rất vui vì bạn đã tham gia cùng chúng tôi hôm nay.',
      },
    ],
    legoSlots: [
      {
        template: 'Please play this {adjective} game with our {group}.',
        slots: {
          adjective: ['great', 'fun', 'exciting', 'special'],
          group: ['green team', 'group of friends', 'club members'],
        },
        examples: [
          {
            en: 'Please play this great game with our green team.',
            vi: 'Làm ơn hãy chơi trò chơi tuyệt vời này cùng đội áo xanh của chúng tôi.',
          },
          {
            en: 'Please play this fun game with our club members.',
            vi: 'Làm ơn hãy chơi trò chơi vui nhộn này cùng các thành viên câu lạc bộ của chúng tôi.',
          },
        ],
      },
      {
        template: 'We plan to {activity} on the {location}.',
        slots: {
          activity: ['practice sports', 'play badminton', 'have a picnic'],
          location: ['green grass', 'playground', 'sports field'],
        },
        examples: [
          {
            en: 'We plan to practice sports on the green grass.',
            vi: 'Chúng tôi lên kế hoạch luyện tập thể thao trên bãi cỏ xanh.',
          },
          {
            en: 'We plan to have a picnic on the playground.',
            vi: 'Chúng tôi lên kế hoạch đi dã ngoại trên sân chơi.',
          },
        ],
      },
    ],
  },
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại dẫn dắt: Rủ bạn tham gia trò chơi thể thao ngoài trời',
    contextVi:
      'Vào một buổi chiều đầy nắng tại công viên, Chris đang tổ chức một trò chơi đồng đội và vẫy tay rủ bạn tham gia cùng nhóm.',
    frameworkType: '3-beat',
    turns: [
      {
        speaker: 'Partner',
        en: 'Hey there! We are playing an exciting team game. Would you like to join?',
        vi: 'Này bạn ơi! Chúng tôi đang chơi một trò chơi đồng đội rất hấp dẫn. Bạn có muốn tham gia cùng không?',
        coreKeywords: ['playing', 'exciting', 'team', 'game', 'join'],
      },
      {
        speaker: 'Learner',
        en: 'I would love to! What is the plan for this game?',
        vi: 'Tôi rất thích đấy! Kế hoạch cho trò chơi này là gì thế?',
        coreKeywords: ['love', 'plan', 'game'],
        suggestedStartersVi: ['I would love to...', 'Sure, what is the...'],
      },
      {
        speaker: 'Partner',
        en: 'We have two teams. Our green team needs one more active player.',
        vi: 'Chúng tôi có hai đội. Đội áo xanh của chúng tôi đang cần thêm một người chơi nhiệt tình nữa.',
        coreKeywords: ['teams', 'green', 'needs', 'player'],
      },
      {
        speaker: 'Learner',
        en: 'Please play this great game with my green team.',
        vi: 'Làm ơn hãy chơi trò chơi tuyệt vời này cùng đội áo xanh của tôi.',
        coreKeywords: ['please', 'play', 'great', 'game', 'green', 'team'],
        suggestedStartersVi: ['Please play this...', 'Let us play with...'],
      },
      {
        speaker: 'Partner',
        en: 'Awesome! Are you ready to practice running on the green grass?',
        vi: 'Tuyệt đỉnh! Bạn đã sẵn sàng để cùng chạy bộ trên bãi cỏ xanh chưa?',
        coreKeywords: ['awesome', 'ready', 'practice', 'running', 'grass'],
      },
      {
        speaker: 'Learner',
        en: 'Yes, I am glad to play with you all today!',
        vi: 'Sẵn sàng rồi, tôi rất vui khi được chơi cùng tất cả các bạn hôm nay!',
        coreKeywords: ['glad', 'play', 'today'],
        suggestedStartersVi: ['Yes, I am glad...', 'Definitely, let us go!'],
      },
    ],
  },
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Bật chuẩn cụm /pl/ và /gr/',
    promptVi:
      'Hãy nói câu rủ chơi trò chơi tuyệt vời cùng đội áo xanh, phát âm dứt khoát "play", "great", "green" không chèn tiếng "pờ", "gờ".',
    promptQuestionEn: 'How do you invite a friend to play a fun game on your colored team?',
    targetSentence: 'Please play this great game with my green team.',
    targetMeaningVi: 'Làm ơn hãy chơi trò chơi tuyệt vời này cùng đội áo xanh của tôi.',
    acceptableVariations: [
      'Please play this great game with our green team.',
      'Let us play this great game with my green team.',
      'Please come and play this great game with my green team.',
    ],
    coreKeywords: ['please', 'play', 'great', 'game', 'green', 'team'],
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
    instructionsVi:
      'Lướt mượt mà từ /p/ sang /l/ trong "play" và /g/ sang /r/ trong "great", "green". SafeHarbor sẽ lắng nghe sự liền mạch của các phụ âm.',
  },
};
