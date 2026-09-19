import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p1L10VowelLengthIVsEe: SpeakingCurriculumLesson = {
  id: 'p1-l10-vowel-length-i-vs-ee',
  phaseId: 'phase-1-beginner',
  order: 10,
  titleEn: 'Vowel Contrast: /iː/ (Long) vs /ɪ/ (Short)',
  titleVi: 'Cặp nguyên âm tương phản: /iː/ căng dài và /ɪ/ thả lỏng ngắn',
  cefrLevel: 'A1',
  targetBandIelts: '0-3.0',
  estimatedMinutes: 15,
  summaryVi:
    'Xử lý triệt để cặp nguyên âm gây hiểu lầm tai hại nhất cho người Việt: phân biệt âm /iː/ cười tươi căng dài trong sheep, seat, leave và âm /ɪ/ hạ cằm ngắn trong ship, sit, live.',
  category: 'social_chat',
  slug: 'vowel-length-i-vs-ee',
  learningObjectivesVi: [
    'Điều khiển khóe môi cười căng sang hai bên để tạo âm /iː/ dài ngân vang chuẩn xác.',
    'Thả lỏng hàm và hạ cằm để tạo âm /ɪ/ ngắn dứt khoát không bị biến thành âm "i" tiếng Việt.',
    'Phân biệt tuyệt đối các cặp từ nhạy cảm như "sheet/shit", "seat/sit", "leave/live".',
    'Hoàn thành thử thách phản xạ SafeHarbor đạt điểm từ 75% trở lên.',
  ],
  stage1Phonetics: {
    titleVi: 'Khởi động cơ miệng: Cặp nguyên âm sống còn /iː/ căng dài vs /ɪ/ thả lỏng ngắn',
    focusSound: 'Vowel Contrast: /iː/ vs /ɪ/',
    vietnameseContrastiveTip:
      'Trong tiếng Việt chỉ có duy nhất một âm "i" nằm ở khoảng giữa trung tính, không kéo dài và cũng không thả lỏng hàm. Khi người Việt học tiếng Anh, xu hướng gộp chung cả hai âm thành âm "i" tiếng Việt dẫn tới những sự nhầm lẫn vô cùng tai hại trong giao tiếp thực tế:\n- Âm /iː/ (Long E): Kéo căng hai khóe môi sang hai bên hết cỡ như khi đang cười tươi chụp ảnh selfie, nâng mặt lưỡi cao sát vòm ngạc trên, ngân dài âm vang 1 giây (sheep, seat, leave, sheet).\n- Âm /ɪ/ (Short I): Thả lỏng toàn bộ cơ môi và má, hạ nhẹ cằm xuống 1cm, phát âm dứt khoát trong nửa giây, âm sắc hơi ngả về âm "ê" nhẹ (ship, sit, live).',
    category: 'vowel-contrast',
    phonemes: ['/iː/', '/ɪ/'],
    mouthTipVi:
      'Hãy ghi nhớ câu khẩu quyết: "Cười tươi căng mép là âm dài /iː/, thả lỏng rơi cằm là âm ngắn /ɪ/".',
    video: {
      youtubeVideoId: 'scCesnn-0XY',
      channelName: "Rachel's English",
      startSeconds: 40,
      endSeconds: 115,
      title: "How to Pronounce EE [i:] and IH [ɪ] Vowels - Rachel's English",
      mouthTipSummaryVi:
        'Quan sát sự đối lập giữa hai khóe môi kéo căng góc rộng ở /iː/ và cơ miệng thả lỏng hoàn toàn ở /ɪ/.',
    },
    targetPracticeWords: [
      { word: 'seat', ipa: '/siːt/', meaningVi: 'chỗ ngồi, ghế ngồi' },
      { word: 'sit', ipa: '/sɪt/', meaningVi: 'ngồi xuống' },
      { word: 'sheep', ipa: '/ʃiːp/', meaningVi: 'con cừu' },
      { word: 'ship', ipa: '/ʃɪp/', meaningVi: 'con tàu thủy' },
      { word: 'leave', ipa: '/liːv/', meaningVi: 'rời đi, rời khỏi' },
      { word: 'live', ipa: '/lɪv/', meaningVi: 'sinh sống, cư ngụ' },
    ],
    minimalPairs: [
      {
        wordA: 'seat',
        ipaA: '/siːt/',
        meaningA: 'chỗ ngồi',
        wordB: 'sit',
        ipaB: '/sɪt/',
        meaningB: 'ngồi xuống',
        distinctionVi: 'nguyên âm /iː/ cười căng dài vs nguyên âm /ɪ/ thả lỏng ngắn',
      },
      {
        wordA: 'sheep',
        ipaA: '/ʃiːp/',
        meaningA: 'con cừu',
        wordB: 'ship',
        ipaB: '/ʃɪp/',
        meaningB: 'con tàu thủy',
        distinctionVi: 'kéo dài ngân vang vs dứt khoát nửa giây',
      },
      {
        wordA: 'leave',
        ipaA: '/liːv/',
        meaningA: 'rời khỏi',
        wordB: 'live',
        ipaB: '/lɪv/',
        meaningB: 'sinh sống',
        distinctionVi: 'căng môi và rung âm v vs thả lỏng hàm rơi nhẹ',
      },
      {
        wordA: 'heat',
        ipaA: '/hiːt/',
        meaningA: 'sức nóng',
        wordB: 'hit',
        ipaB: '/hɪt/',
        meaningB: 'đánh trúng',
        distinctionVi: 'ngân âm dài /iː/ vs ngắt hơi dứt khoát /ɪ/',
      },
    ],
    practiceSentences: [
      {
        sentence: 'Please have a seat here while you wait for the ship.',
        phoneticTarget: '/iː/, /ɪ/',
        vietnameseTranslation: 'Làm ơn hãy ngồi nghỉ ở đây trong lúc bạn chờ tàu thủy.',
      },
      {
        sentence: 'Do not leave before you see where they live.',
        phoneticTarget: '/iː/, /ɪ/',
        vietnameseTranslation: 'Đừng rời đi trước khi bạn nhìn thấy nơi họ sinh sống.',
      },
      {
        sentence: 'The green sheep stood near the big ship.',
        phoneticTarget: '/iː/, /ɪ/',
        vietnameseTranslation: 'Chú cừu màu xanh đứng cạnh con tàu lớn.',
      },
    ],
  },
  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: Lời mời ngồi và Hướng dẫn chờ đợi lịch sự',
    vietnameseGrammarRule:
      'Để mời ai đó ngồi một cách trang trọng và lịch sự, dùng thành ngữ cố định: "Please have a seat" hoặc "Please take a seat" (dùng danh từ "seat" với âm /iː/ dài). Kết hợp liên từ thời gian "while you wait for..." (trong lúc bạn chờ đợi).',
    formula: 'Please have a seat {location} while you wait for the {subject}.',
    overviewVi:
      'Cấu trúc giao tiếp kinh điển tại mọi sảnh lễ tân, phòng chờ văn phòng hoặc khách sạn quốc tế.',
    highFrequencyVocab: [
      {
        term: 'seat',
        ipa: '/siːt/',
        partOfSpeech: 'noun',
        meaningVi: 'chỗ ngồi, ghế ngồi',
        collocationHintVi: 'have a seat / take a seat (xin mời ngồi)',
        exampleSentenceEn: 'Please take a comfortable seat.',
        exampleSentenceVi: 'Xin mời bạn chọn một chỗ ngồi thoải mái.',
      },
      {
        term: 'wait',
        ipa: '/weɪt/',
        partOfSpeech: 'verb',
        meaningVi: 'chờ đợi',
        collocationHintVi: 'wait for the bus (chờ xe buýt)',
        exampleSentenceEn: 'I will wait for you in the lobby.',
        exampleSentenceVi: 'Tôi sẽ chờ bạn ở dưới sảnh.',
      },
      {
        term: 'ship',
        ipa: '/ʃɪp/',
        partOfSpeech: 'noun',
        meaningVi: 'tàu thủy lớn',
        collocationHintVi: 'passenger ship (tàu chở khách)',
        exampleSentenceEn: 'The ship departs at noon.',
        exampleSentenceVi: 'Con tàu sẽ khởi hành vào buổi trưa.',
      },
      {
        term: 'comfortable',
        ipa: '/ˈkʌmftəbl/',
        partOfSpeech: 'adj',
        meaningVi: 'thoải mái, dễ chịu',
        collocationHintVi: 'feel comfortable (cảm thấy thoải mái)',
        exampleSentenceEn: 'This sofa is very comfortable.',
        exampleSentenceVi: 'Chiếc ghế sofa này rất êm ái thoải mái.',
      },
    ],
    legoSlots: [
      {
        template: 'Please have a seat {place} while you wait for the {noun}.',
        slots: {
          place: ['here', 'over there', 'in the lounge', 'in this room'],
          noun: ['ship', 'manager', 'bus', 'doctor'],
        },
        examples: [
          {
            en: 'Please have a seat here while you wait for the ship.',
            vi: 'Làm ơn hãy ngồi tại đây trong lúc bạn chờ tàu.',
          },
          {
            en: 'Please have a seat in the lounge while you wait for the manager.',
            vi: 'Làm ơn hãy ngồi trong phòng chờ trong lúc bạn đợi người quản lý.',
          },
        ],
      },
      {
        template: 'I {action_live_leave} early because I live {distance}.',
        slots: {
          action_live_leave: ['leave my house', 'leave work', 'leave the office'],
          distance: ['far from here', 'in the city center', 'near the station'],
        },
        examples: [
          {
            en: 'I leave my house early because I live far from here.',
            vi: 'Tôi rời nhà sớm vì tôi sống ở xa nơi này.',
          },
          {
            en: 'I leave the office early because I live near the station.',
            vi: 'Tôi rời văn phòng sớm vì tôi sống gần nhà ga.',
          },
        ],
      },
    ],
  },
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại dẫn dắt: Đón tiếp khách tại sảnh chờ bến cảng',
    contextVi:
      'Bạn là nhân viên lễ tân tại sảnh đón khách du lịch bến tàu. Một vị khách ngoại quốc bước vào hỏi giờ tàu chạy và bạn ân cần mời khách ngồi nghỉ.',
    frameworkType: '3-beat',
    turns: [
      {
        speaker: 'Partner',
        en: 'Hello! Excuse me, could you tell me when the departure for the island is?',
        vi: 'Xin chào! Xin lỗi, bạn có thể cho tôi biết chuyến đi ra đảo khi nào khởi hành không?',
        coreKeywords: ['departure', 'island', 'tell', 'when'],
      },
      {
        speaker: 'Learner',
        en: 'Hello! The cruise ship arrives in twenty minutes.',
        vi: 'Xin chào! Con tàu du lịch sẽ cập bến trong hai mươi phút nữa.',
        coreKeywords: ['ship', 'arrives', 'twenty', 'minutes'],
        suggestedStartersVi: ['Hello! The ship...', 'Sure, the cruise ship...'],
      },
      {
        speaker: 'Partner',
        en: 'Thank you. Is there a place where I can wait comfortably?',
        vi: 'Cảm ơn bạn. Có chỗ nào để tôi ngồi đợi thoải mái không?',
        coreKeywords: ['place', 'wait', 'comfortably'],
      },
      {
        speaker: 'Learner',
        en: 'Please have a seat here while you wait for the ship.',
        vi: 'Làm ơn hãy ngồi tại đây trong lúc bạn đợi con tàu.',
        coreKeywords: ['please', 'have', 'seat', 'wait', 'ship'],
        suggestedStartersVi: ['Please have a seat...', 'You can sit over...'],
      },
      {
        speaker: 'Partner',
        en: 'That is very kind of you. Can I also get some drinking water?',
        vi: 'Bạn thật tốt bụng. Tôi có thể xin một ít nước uống được không?',
        coreKeywords: ['kind', 'drinking', 'water'],
      },
      {
        speaker: 'Learner',
        en: 'Of course, there is cold mineral water next to your seat.',
        vi: 'Tất nhiên rồi ạ, có nước khoáng lạnh ngay bên cạnh chỗ ngồi của bạn.',
        coreKeywords: ['cold', 'water', 'next', 'seat'],
        suggestedStartersVi: ['Of course, there is...', 'Sure, on the table...'],
      },
    ],
  },
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Phân biệt âm /iː/ trong "seat" và /ɪ/ trong "ship"',
    promptVi:
      'Hãy nói câu mời khách ngồi đợi tàu, chú ý kéo dài âm /iː/ ở "seat" và phát âm dứt khoát âm /ɪ/ ở "ship" trong 1.5 giây.',
    promptQuestionEn: 'How do you invite a traveler to sit down comfortably while waiting for their ship?',
    targetSentence: 'Please have a seat here while you wait for the ship.',
    targetMeaningVi: 'Làm ơn hãy ngồi nghỉ tại đây trong lúc bạn chờ tàu.',
    acceptableVariations: [
      'Please take a seat here while you wait for the ship.',
      'Please have a seat over here while you wait for the ship.',
      'You can have a seat here while you wait for the ship.',
    ],
    coreKeywords: ['please', 'have', 'seat', 'wait', 'ship'],
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
    instructionsVi:
      'Cười tươi kéo dài âm ở "seat" (/siːt/) và thả lỏng cằm ở "ship" (/ʃɪp/). SafeHarbor chấm điểm độ tương phản chính xác của từ khóa.',
  },
};
