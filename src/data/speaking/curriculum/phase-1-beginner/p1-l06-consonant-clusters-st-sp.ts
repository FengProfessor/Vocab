import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p1L06ConsonantClustersStSp: SpeakingCurriculumLesson = {
  id: 'p1-l06-consonant-clusters-st-sp',
  phaseId: 'phase-1-beginner',
  order: 6,
  titleEn: 'Consonant Clusters /st/ and /sp/',
  titleVi: 'Cụm phụ âm đầu /st/ và /sp/ (Không chèn nguyên âm đệm)',
  cefrLevel: 'A1',
  targetBandIelts: '0-3.0',
  estimatedMinutes: 15,
  summaryVi:
    'Xóa bỏ triệt để tật chèn nguyên âm đệm tiếng Việt ("sờ-tốp", "sờ-píc") bằng kỹ thuật trượt âm mượt mà cho cụm phụ âm /st/ và /sp/.',
  category: 'daily_life',
  slug: 'consonant-clusters-st-sp',
  learningObjectivesVi: [
    'Phát âm cụm phụ âm /st/ và /sp/ liền mạch trong 1 âm tiết duy nhất.',
    'Chấm dứt hoàn toàn thói quen phát âm thêm tiếng "sờ" trước các từ bắt đầu bằng S.',
    'Sử dụng các cấu trúc yêu cầu lịch sự với "Please" kèm các động từ chứa cụm phụ âm.',
    'Đạt điểm SafeHarbor từ 75% trở lên với độ trễ phản xạ dưới 1.5 giây.',
  ],
  stage1Phonetics: {
    titleVi: 'Khởi động cơ miệng: Cụm phụ âm đầu /st/ và /sp/ liền khối',
    focusSound: 'Initial Consonant Clusters /st/ and /sp/',
    vietnameseContrastiveTip:
      'Tiếng Việt là ngôn ngữ đơn lập, luôn có nguyên âm nằm giữa các phụ âm. Do đó, khi nhìn thấy các từ tiếng Anh có hai phụ âm đi liền như "stop", "stay", "speak", người Việt hay vô thức chèn nguyên âm "ơ" vào giữa tạo thành hai âm tiết kỳ quặc: "sờ-tốp", "sờ-tây", "sờ-píc".\nCách khắc phục triệt để: Đặt sẵn đầu lưỡi hoặc môi ở tư thế của âm thứ hai (/t/ hoặc /p/), sau đó chỉ xì luồng gió /s/ trong 0.2 giây rồi bật ngay lập tức sang âm tiếp theo mà không mở hàm tạo tiếng "sờ".',
    category: 'consonant-clusters',
    phonemes: ['/st/', '/sp/'],
    mouthTipVi:
      'Với /st/ trong "stay": Đặt đầu lưỡi chạm sẵn vào vòm lợi răng trên, xì gió /s/ rồi kéo lưỡi xuống phát âm "tey" ngay lập tức. Giữ hàm răng gần sát nhau suốt quá trình.',
    video: {
      youtubeVideoId: 'k3Vq_r5qLBs',
      channelName: "Rachel's English",
      startSeconds: 30,
      endSeconds: 105,
      title: "Consonant Clusters with S - Rachel's English",
      mouthTipSummaryVi:
        'Quan sát cách miệng không bao giờ mở ra giữa âm S và phụ âm kế tiếp để tránh tạo ra nguyên âm thừa.',
    },
    targetPracticeWords: [
      { word: 'start', ipa: '/stɑːt/', meaningVi: 'bắt đầu' },
      { word: 'stay', ipa: '/steɪ/', meaningVi: 'ở lại' },
      { word: 'stop', ipa: '/stɒp/', meaningVi: 'dừng lại' },
      { word: 'station', ipa: '/ˈsteɪʃn/', meaningVi: 'nhà ga' },
      { word: 'speak', ipa: '/spiːk/', meaningVi: 'nói chuyện' },
      { word: 'sport', ipa: '/spɔːt/', meaningVi: 'thể thao' },
    ],
    minimalPairs: [
      {
        wordA: 'stay',
        ipaA: '/steɪ/',
        meaningA: 'ở lại',
        wordB: 'say',
        ipaB: '/seɪ/',
        meaningB: 'nói rằng',
        distinctionVi: 'có âm bật /t/ ngay sau /s/ vs chỉ có âm xì /s/ đơn thuần',
      },
      {
        wordA: 'spill',
        ipaA: '/spɪl/',
        meaningA: 'làm đổ tràn',
        wordB: 'pill',
        ipaB: '/pɪl/',
        meaningB: 'viên thuốc',
        distinctionVi: 'có âm xì gió /s/ dẫn đầu vs bật môi /p/ trực tiếp',
      },
      {
        wordA: 'spit',
        ipaA: '/spɪt/',
        meaningA: 'nhổ ra',
        wordB: 'sit',
        ipaB: '/sɪt/',
        meaningB: 'ngồi xuống',
        distinctionVi: 'cụm /sp/ ngậm môi bật hơi vs âm đơn /s/ kẽ răng',
      },
      {
        wordA: 'store',
        ipaA: '/stɔː(r)/',
        meaningA: 'cửa hàng',
        wordB: 'tore',
        ipaB: '/tɔː(r)/',
        meaningB: 'đã xé rách',
        distinctionVi: 'có xì gió /s/ phía trước vs chỉ có âm bật /t/',
      },
    ],
    practiceSentences: [
      {
        sentence: 'Please stay here and speak slowly.',
        phoneticTarget: '/st/, /sp/',
        vietnameseTranslation: 'Làm ơn hãy ở lại đây và nói thật chậm.',
      },
      {
        sentence: 'We start speaking English at the sports club.',
        phoneticTarget: '/st/, /sp/',
        vietnameseTranslation: 'Chúng tôi bắt đầu nói tiếng Anh tại câu lạc bộ thể thao.',
      },
      {
        sentence: 'The student waited at the bus stop.',
        phoneticTarget: '/st/',
        vietnameseTranslation: 'Người sinh viên đã chờ ở trạm xe buýt.',
      },
    ],
  },
  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: Yêu cầu lịch sự trong giao tiếp',
    vietnameseGrammarRule:
      'Để đưa ra lời đề nghị hoặc nhờ vả lịch sự, sử dụng cấu trúc: "Please + V-bare" kết hợp với liên từ mục đích "so I can + V". Động từ đi sau "Please" luôn giữ nguyên mẫu không chia.',
    formula: 'Please {action_cluster} and speak {manner} so I can {purpose}.',
    overviewVi:
      'Mẫu câu cực kỳ hữu ích trong môi trường thực tế khi bạn cần người nước ngoài nói chậm lại hoặc hướng dẫn cụ thể.',
    highFrequencyVocab: [
      {
        term: 'speak',
        ipa: '/spiːk/',
        partOfSpeech: 'verb',
        meaningVi: 'nói, phát biểu',
        collocationHintVi: 'speak slowly (nói chậm lại)',
        exampleSentenceEn: 'Please speak slowly and clearly.',
        exampleSentenceVi: 'Làm ơn hãy nói chậm và rõ ràng.',
      },
      {
        term: 'stay',
        ipa: '/steɪ/',
        partOfSpeech: 'verb',
        meaningVi: 'ở lại, lưu lại',
        collocationHintVi: 'stay here (ở lại đây)',
        exampleSentenceEn: 'You can stay here with us.',
        exampleSentenceVi: 'Bạn có thể ở lại đây với chúng tôi.',
      },
      {
        term: 'start',
        ipa: '/stɑːt/',
        partOfSpeech: 'verb',
        meaningVi: 'bắt đầu',
        collocationHintVi: 'start our lesson (bắt đầu bài học của chúng ta)',
        exampleSentenceEn: 'Let us start our conversation now.',
        exampleSentenceVi: 'Hãy cùng bắt đầu cuộc trò chuyện ngay bây giờ.',
      },
      {
        term: 'slowly',
        ipa: '/ˈsləʊli/',
        partOfSpeech: 'adv',
        meaningVi: 'một cách chậm rãi',
        collocationHintVi: 'walk slowly / speak slowly (đi chậm / nói chậm)',
        exampleSentenceEn: 'Could you speak more slowly, please?',
        exampleSentenceVi: 'Bạn có thể nói chậm hơn một chút được không?',
      },
    ],
    legoSlots: [
      {
        template: 'Please stay {place} and speak {speed}.',
        slots: {
          place: ['here', 'inside', 'at the table', 'in the room'],
          speed: ['slowly', 'clearly', 'quietly'],
        },
        examples: [
          {
            en: 'Please stay here and speak slowly.',
            vi: 'Làm ơn ở lại đây và nói thật chậm.',
          },
          {
            en: 'Please stay inside and speak quietly.',
            vi: 'Làm ơn ở bên trong và nói khẽ thôi.',
          },
        ],
      },
      {
        template: 'We start our {activity} at the {venue}.',
        slots: {
          activity: ['sports game', 'English lesson', 'meeting', 'practice'],
          venue: ['sports center', 'station', 'stadium', 'studio'],
        },
        examples: [
          {
            en: 'We start our sports game at the sports center.',
            vi: 'Chúng tôi bắt đầu trận đấu thể thao tại trung tâm thể thao.',
          },
          {
            en: 'We start our English lesson at the studio.',
            vi: 'Chúng tôi bắt đầu bài học tiếng Anh tại studio.',
          },
        ],
      },
    ],
  },
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại dẫn dắt: Nhờ người đối diện nói chậm lại',
    contextVi:
      'Bạn đang tham gia buổi sinh hoạt câu lạc bộ nói tiếng Anh. Huấn luyện viên Alex nói hơi nhanh khiến bạn chưa nghe kịp, bạn lịch sự nhờ Alex điều chỉnh tốc độ nói.',
    frameworkType: '3-beat',
    turns: [
      {
        speaker: 'Partner',
        en: 'Hi everybody! Today we have a very special sports activity planned for you.',
        vi: 'Chào mọi người! Hôm nay chúng ta có một hoạt động thể thao rất đặc biệt dành cho các bạn.',
        coreKeywords: ['special', 'sports', 'activity', 'planned'],
      },
      {
        speaker: 'Learner',
        en: 'Excuse me Alex, please stay here and speak slowly.',
        vi: 'Xin lỗi Alex, làm ơn hãy đứng ở đây và nói thật chậm rãi nhé.',
        coreKeywords: ['excuse', 'Alex', 'stay', 'speak', 'slowly'],
        suggestedStartersVi: ['Excuse me, please...', 'Could you please...'],
      },
      {
        speaker: 'Partner',
        en: 'Oh, I apologize! Am I speaking too quickly for you to follow?',
        vi: 'Ồ, tôi xin lỗi nhé! Tôi đang nói quá nhanh khiến bạn không theo kịp đúng không?',
        coreKeywords: ['apologize', 'speaking', 'quickly', 'follow'],
      },
      {
        speaker: 'Learner',
        en: 'Yes, a little bit. Please speak slowly so I can understand.',
        vi: 'Vâng, một chút ạ. Làm ơn nói chậm để tôi có thể hiểu được.',
        coreKeywords: ['please', 'speak', 'slowly', 'understand'],
        suggestedStartersVi: ['Yes, please speak...', 'A little bit, could you...'],
      },
      {
        speaker: 'Partner',
        en: 'No problem at all. Let us start from step one together.',
        vi: 'Không có vấn đề gì cả. Chúng ta hãy cùng nhau bắt đầu từ bước một nhé.',
        coreKeywords: ['problem', 'start', 'step', 'together'],
      },
      {
        speaker: 'Learner',
        en: 'Thank you! We can start our sports game now.',
        vi: 'Cảm ơn bạn! Bây giờ chúng ta có thể bắt đầu trò chơi thể thao rồi.',
        coreKeywords: ['thank', 'start', 'sports', 'game', 'now'],
        suggestedStartersVi: ['Thank you! We can...', 'Great, let us start...'],
      },
    ],
  },
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Phát âm chuẩn cụm phụ âm /st/ và /sp/',
    promptVi:
      'Hãy nói câu nhờ người đối diện ở lại và nói chậm để bạn có thể hiểu, không chèn tiếng "sờ" đệm vào "stay" và "speak".',
    promptQuestionEn: 'How do you politely ask someone to remain with you and speak at a slower pace?',
    targetSentence: 'Please stay here and speak slowly so I can understand.',
    targetMeaningVi: 'Làm ơn hãy ở lại đây và nói chậm rãi để tôi có thể hiểu được.',
    acceptableVariations: [
      'Please stay here and speak slowly so that I can understand.',
      'Could you please stay here and speak slowly so I can understand?',
      'Please stay here and speak slowly, so I can understand you.',
    ],
    coreKeywords: ['please', 'stay', 'speak', 'slowly', 'understand'],
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
    instructionsVi:
      'Trượt nhanh từ /s/ sang /t/ trong "stay" và /s/ sang /p/ trong "speak" mà không chèn âm đệm. SafeHarbor chấm điểm dựa trên các từ khóa chính.',
  },
};
