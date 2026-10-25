import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p1L12FinalReviewSafeharborReflex: SpeakingCurriculumLesson = {
  id: 'p1-l12-final-review-safeharbor-reflex',
  phaseId: 'phase-1-beginner',
  order: 12,
  titleEn: 'Final Review & SafeHarbor Reflex Checkpoint',
  titleVi: 'Tổng kết Chặng 1: Phản xạ SafeHarbor & Kỹ thuật mua thời gian',
  cefrLevel: 'A1',
  targetBandIelts: '0-3.0',
  estimatedMinutes: 20,
  summaryVi:
    'Tổng kết toàn diện 11 bài học Chặng 1, làm chủ các từ đệm mua thời gian (Well, Let me think) và phản xạ trả lời câu hỏi tổng hợp không bị ngắt quãng.',
  category: 'social_chat',
  slug: 'final-review-safeharbor-reflex',
  learningObjectivesVi: [
    'Sử dụng các từ đệm tự nhiên ("Well...", "Let me think...") để loại bỏ triệt để khoảng lặng chết khi suy nghĩ.',
    'Tổng hợp kỹ thuật phụ âm cuối (/s/, /z/, /ed/), nối âm C ‿ V và quy tắc nở câu 3 nhịp.',
    'Tự tin giao tiếp và trả lời phỏng vấn tổng kết năng lực nói tương đương chuẩn CEFR A1 / IELTS 3.0.',
    'Vượt qua bài sát hạch phản xạ SafeHarbor tổng hợp với điểm số trên 80%.',
  ],
  stage1Phonetics: {
    titleVi: 'Khởi động cơ miệng: Ngữ điệu từ đệm mua thời gian (Stalling Devices) & Tổng hợp nhịp điệu',
    focusSound: 'Natural Stalling Fillers & Connected Speech Rhythm',
    vietnameseContrastiveTip:
      'Khi não bộ cần 1-2 giây để tìm từ vựng hoặc suy nghĩ ý tứ, người Việt thường im bặt (tạo ra "khoảng lặng chết" làm cuộc trò chuyện bị đơ cứng) hoặc phát ra những tiếng "ờ... à... ừm..." thiếu tự tin. Người bản xứ xử lý tình huống này cực kỳ thanh lịch bằng các từ đệm mua thời gian (Stalling Fillers):\n- "Well..." (À thì...):\n- "Let me think..." (Để tôi nghĩ một chút nhé...):\n- "To be honest..." (Thành thật mà nói...):\n- "You know..." (Bạn biết đấy...):\nNhững cụm từ này phát âm với ngữ điệu ngân nga nhẹ nhàng, giúp bạn có thêm 2 giây quý giá để kích hoạt các khối Lego trong đầu mà không bị gián đoạn cuộc đối thoại.',
    category: 'stress-linking',
    phonemes: ['/wel/', '/let miː θɪŋk/', '/tə bi ˈɒnɪst/'],
    mouthTipVi:
      'Hãy ngân dài từ "Well..." và khẽ mỉm cười, đầu lưỡi đặt nhẹ kẹp giữa hai răng ở âm /θ/ trong "think" để câu nói tự nhiên và giàu cảm xúc.',
    video: {
      youtubeVideoId: '8h_9h_8Z8k4',
      channelName: "Rachel's English",
      startSeconds: 20,
      endSeconds: 95,
      title: "How to Sound Natural with Hesitation Words in English - Rachel's English",
      mouthTipSummaryVi:
        'Quan sát cách người bản xứ sử dụng từ đệm để duy trì nhịp thở và luồng giọng trôi chảy mà không bị khựng.',
    },
    targetPracticeWords: [
      { word: 'well', ipa: '/wel/', meaningVi: 'à thì, xem nào (từ đệm)' },
      { word: 'think', ipa: '/θɪŋk/', meaningVi: 'suy nghĩ' },
      { word: 'honest', ipa: '/ˈɒnɪst/', meaningVi: 'thành thật' },
      { word: 'actually', ipa: '/ˈæktʃuəli/', meaningVi: 'thực ra thì' },
      { word: 'usually', ipa: '/ˈjuːʒuəli/', meaningVi: 'thông thường' },
      { word: 'study', ipa: '/ˈstʌdi/', meaningVi: 'học tập' },
    ],
    minimalPairs: [
      {
        wordA: 'well',
        ipaA: '/wel/',
        meaningA: 'à thì (từ đệm mua thời gian)',
        wordB: 'will',
        ipaB: '/wɪl/',
        meaningB: 'sẽ (trợ động từ)',
        distinctionVi: 'nguyên âm /e/ mở vừa vs nguyên âm /ɪ/ hạ cằm ngắn',
      },
      {
        wordA: 'think',
        ipaA: '/θɪŋk/',
        meaningA: 'suy nghĩ (âm th kẹp răng)',
        wordB: 'sink',
        ipaB: '/sɪŋk/',
        meaningB: 'chìm xuống, bồn rửa',
        distinctionVi: 'đầu lưỡi thò ra kẽ răng /θ/ vs hai hàm răng khép xì /s/',
      },
      {
        wordA: 'honest',
        ipaA: '/ˈɒnɪst/',
        meaningA: 'thành thật (h câm)',
        wordB: 'honor',
        ipaB: '/ˈɒnə(r)/',
        meaningB: 'danh dự, vinh hạnh',
        distinctionVi: 'đuôi /st/ bật dứt khoát vs đuôi schwa /ə/ thả lỏng',
      },
      {
        wordA: 'actually',
        ipaA: '/ˈæktʃuəli/',
        meaningA: 'thực tế là (4 âm tiết)',
        wordB: 'actively',
        ipaB: '/ˈæktɪvli/',
        meaningB: 'một cách tích cực',
        distinctionVi: 'âm /tʃ/ chu môi bật hơi vs âm /t/ chạm nướu',
      },
    ],
    practiceSentences: [
      {
        sentence: 'Well, let me think, I usually wake up at seven and study English because I love it.',
        phoneticTarget: 'Stalling rhythm + 3-beat sentence expansion',
        vietnameseTranslation:
          'À thì, để tôi nghĩ xem, tôi thường thức dậy lúc bảy giờ và học tiếng Anh vì tôi rất yêu thích nó.',
      },
      {
        sentence: 'To be honest, I really enjoy speaking English with my new friends.',
        phoneticTarget: 'Fluency and natural pause after "honest"',
        vietnameseTranslation:
          'Thành thật mà nói, tôi thực sự rất thích nói tiếng Anh cùng những người bạn mới của mình.',
      },
      {
        sentence: 'You know, practicing every day helps me feel much more confident.',
        phoneticTarget: 'Connected speech linking',
        vietnameseTranslation:
          'Bạn biết đấy, luyện tập mỗi ngày giúp tôi cảm thấy tự tin hơn rất nhiều.',
      },
    ],
  },
  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: Phản xạ trả lời tổng hợp toàn diện',
    vietnameseGrammarRule:
      'Kết hợp toàn bộ vũ khí đã học trong Chặng 1: Mở đầu bằng từ đệm mua thời gian ("Well, let me think..."), tiếp nối bằng chủ ngữ "I" và trạng từ tần suất ("I usually..."), nối âm phụ âm sang nguyên âm ("wake up at..."), và khép lại bằng mệnh đề cảm xúc ("because I love it").',
    formula:
      'Well, let me think, I usually {action_routine} at {time} and {study_action} because {emotion_reason}.',
    overviewVi:
      'Đây là mẫu câu phản xạ đỉnh cao của Chặng 1 giúp bạn trả lời mượt mà bất kỳ câu hỏi nào về bản thân hoặc đời sống thường nhật.',
    highFrequencyVocab: [
      {
        term: 'actually',
        ipa: '/ˈæktʃuəli/',
        partOfSpeech: 'adv',
        meaningVi: 'thực ra, trên thực tế',
        collocationHintVi: 'actually, I prefer (thực ra tôi thích hơn)',
        exampleSentenceEn: 'Actually, I enjoy studying in the morning.',
        exampleSentenceVi: 'Thực ra, tôi thích học vào buổi sáng hơn.',
      },
      {
        term: 'confident',
        ipa: '/ˈkɒnfɪdənt/',
        partOfSpeech: 'adj',
        meaningVi: 'tự tin',
        collocationHintVi: 'feel more confident (cảm thấy tự tin hơn)',
        exampleSentenceEn: 'I feel much more confident speaking English now.',
        exampleSentenceVi: 'Bây giờ tôi cảm thấy tự tin hơn nhiều khi nói tiếng Anh.',
      },
      {
        term: 'progress',
        ipa: '/ˈprəʊɡres/',
        partOfSpeech: 'noun',
        meaningVi: 'sự tiến bộ, tiến trình',
        collocationHintVi: 'make great progress (đạt được sự tiến bộ lớn)',
        exampleSentenceEn: 'You are making great progress every single day.',
        exampleSentenceVi: 'Bạn đang đạt được sự tiến bộ vượt bậc mỗi ngày.',
      },
      {
        term: 'lifestyle',
        ipa: '/ˈlaɪfstaɪl/',
        partOfSpeech: 'noun',
        meaningVi: 'lối sống, phong cách sống',
        collocationHintVi: 'healthy lifestyle (lối sống lành mạnh)',
        exampleSentenceEn: 'Waking up early supports a healthy lifestyle.',
        exampleSentenceVi: 'Dậy sớm hỗ trợ một lối sống lành mạnh.',
      },
    ],
    legoSlots: [
      {
        template:
          'Well, let me think, I usually wake up at {time} and {activity} because {reason}.',
        slots: {
          time: ['six o’clock', 'six thirty', 'seven o’clock'],
          activity: [
            'study English',
            'exercise in the park',
            'drink green tea',
            'read my favorite book',
          ],
          reason: ['I love it', 'it keeps me healthy', 'it relaxes my mind'],
        },
        examples: [
          {
            en: 'Well, let me think, I usually wake up at seven and study English because I love it.',
            vi: 'À thì, để tôi nghĩ xem, tôi thường thức dậy lúc bảy giờ và học tiếng Anh vì tôi rất yêu thích nó.',
          },
          {
            en: 'Well, let me think, I usually wake up at six thirty and exercise in the park because it keeps me healthy.',
            vi: 'À thì, để tôi nghĩ xem, tôi thường thức dậy lúc sáu giờ ba mươi và tập thể dục trong công viên vì nó giúp tôi khỏe mạnh.',
          },
        ],
      },
      {
        template: 'To be honest, my name is {name} and I live in {city} with my {family_member}.',
        slots: {
          name: ['Nam', 'Linh', 'Minh'],
          city: ['Hanoi', 'Da Nang', 'Ho Chi Minh City'],
          family_member: ['family', 'parents', 'close friends'],
        },
        examples: [
          {
            en: 'To be honest, my name is Nam and I live in Hanoi with my family.',
            vi: 'Thành thật mà nói, tên tôi là Nam và tôi sống ở Hà Nội cùng gia đình.',
          },
          {
            en: 'To be honest, my name is Linh and I live in Da Nang with my parents.',
            vi: 'Thành thật mà nói, tên tôi là Linh và tôi sống ở Đà Nẵng cùng bố mẹ.',
          },
        ],
      },
    ],
  },
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại dẫn dắt: Bài phỏng vấn sát hạch tổng kết Chặng 1',
    contextVi:
      'Giáo viên bản ngữ Sarah tiến hành buổi phỏng vấn đánh giá năng lực nói kết thúc Chặng 1 để kiểm tra phản xạ tự nhiên của bạn.',
    frameworkType: '3-beat',
    turns: [
      {
        speaker: 'Partner',
        en: 'Congratulations on reaching the final lesson of Phase 1! Tell me, how has your daily routine changed?',
        vi: 'Chúc mừng bạn đã đến bài học cuối cùng của Chặng 1! Hãy cho tôi biết, thói quen sinh hoạt hàng ngày của bạn đã thay đổi như thế nào?',
        coreKeywords: ['congratulations', 'final', 'phase', 'routine', 'changed'],
      },
      {
        speaker: 'Learner',
        en: 'Well, let me think, I usually wake up at seven and study English because I love it.',
        vi: 'À thì, để tôi nghĩ xem, tôi thường thức dậy lúc bảy giờ và học tiếng Anh vì tôi rất yêu thích nó.',
        coreKeywords: ['well', 'let', 'think', 'usually', 'wake', 'seven', 'study', 'English', 'love'],
        suggestedStartersVi: ['Well, let me think...', 'To be honest, I usually...'],
      },
      {
        speaker: 'Partner',
        en: 'That is truly inspiring! Do you feel more comfortable speaking English now?',
        vi: 'Thật là truyền cảm hứng! Bây giờ bạn có cảm thấy thoải mái hơn khi nói tiếng Anh không?',
        coreKeywords: ['inspiring', 'comfortable', 'speaking', 'now'],
      },
      {
        speaker: 'Learner',
        en: 'Yes, I do. I am not afraid of making mistakes anymore because I practice every day.',
        vi: 'Có chứ ạ. Tôi không còn sợ mắc lỗi nữa bởi vì tôi luyện tập mỗi ngày.',
        coreKeywords: ['afraid', 'mistakes', 'anymore', 'practice', 'day'],
        suggestedStartersVi: ['Yes, I do. I am...', 'Definitely, I feel much...'],
      },
      {
        speaker: 'Partner',
        en: 'Your pronunciation and rhythm have improved so much. Are you ready for Phase 2?',
        vi: 'Phát âm và nhịp điệu của bạn đã tiến bộ rất nhiều. Bạn đã sẵn sàng bước sang Chặng 2 chưa?',
        coreKeywords: ['pronunciation', 'rhythm', 'improved', 'ready', 'phase'],
      },
      {
        speaker: 'Learner',
        en: 'Yes, I am ready to expand my conversations and speak longer sentences!',
        vi: 'Vâng, tôi đã sẵn sàng để mở rộng cuộc trò chuyện và nói những câu dài hơn rồi!',
        coreKeywords: ['ready', 'expand', 'conversations', 'longer', 'sentences'],
        suggestedStartersVi: ['Yes, I am ready to...', 'Of course, I am excited...'],
      },
    ],
  },
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Phản xạ toàn diện kết thúc Chặng 1',
    promptVi:
      'Hãy nói câu trả lời tổng hợp hoàn chỉnh sử dụng từ đệm mua thời gian "Well, let me think", thói quen dậy lúc 7:00 và lý do yêu thích học tiếng Anh trong vòng 2.5 giây.',
    promptQuestionEn: 'How would you naturally summarize your morning routine and learning passion?',
    targetSentence:
      'Well, let me think, I usually wake up at seven and study English because I love it.',
    targetMeaningVi:
      'À thì, để tôi nghĩ xem, tôi thường thức dậy lúc bảy giờ và học tiếng Anh vì tôi yêu thích nó.',
    acceptableVariations: [
      'Well, let me think, I usually wake up at seven and study English because I love it so much.',
      'Well, let me see, I usually wake up at seven and study English because I love it.',
      'Well, let me think, I usually get up at seven and study English because I love it.',
    ],
    coreKeywords: [
      'well',
      'let',
      'think',
      'usually',
      'wake',
      'seven',
      'study',
      'English',
      'love',
    ],
    minimumPassingScore: 80,
    targetReflexLatencyMs: 1500,
    instructionsVi:
      'Sử dụng ngữ điệu tự nhiên, không ngắc ngứ. SafeHarbor đánh giá toàn diện các từ khóa nội dung và sự trôi chảy của toàn câu.',
  },
};
