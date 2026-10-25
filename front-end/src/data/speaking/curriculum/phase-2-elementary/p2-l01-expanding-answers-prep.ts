/**
 * LingoPro Speaking Curriculum - Phase 2: Elementary (A2-B1 / 3.0-5.0 IELTS)
 * Lesson P2-L01: Expanding Answers with the PREP Framework
 * File: src/data/speaking/curriculum/phase-2-elementary/p2-l01-expanding-answers-prep.ts
 */

import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p2L01Lesson: SpeakingCurriculumLesson = {
  id: 'p2-l01-expanding-answers-prep',
  phaseId: 'phase-2-elementary',
  order: 1,
  titleEn: 'Expanding Answers with the PREP Framework',
  titleVi: 'Mở rộng câu trả lời với khung PREP (Point - Reason - Example - Point)',
  cefrLevel: 'A2',
  targetBandIelts: '3.0-4.0',
  estimatedMinutes: 25,
  summaryVi:
    'Làm chủ khung tư duy PREP để chuyển đổi câu trả lời 1 câu cụt lủn thành đoạn nói 4 bước mạch lạc 45-60 giây về quê hương, thành phố và sở thích cá nhân.',
  category: 'daily_life',
  learningObjectivesVi: [
    'Nắm vững 4 nấc thang của khung PREP: Nêu quan điểm trực diện (Point) -> Giải thích nguyên do (Reason) -> Đưa ví dụ cụ thể (Example) -> Khẳng định tóm lược (Point).',
    'Khắc phục tật ngắt quãng giữa các từ bằng kỹ thuật nối âm phụ âm sang nguyên âm (Consonant-to-Vowel Linking).',
    'Ứng dụng thành thạo cụm từ vựng miêu tả cảnh quan và nhịp sống đô thị (bustling, cost of living, public amenities).',
    'Nói liên tục 45-60 giây trả lời câu hỏi IELTS Speaking Part 1 mà không bị đọng hơi hay im lặng quá 2 giây.',
  ],

  // ── Stage 1: Phonetics Drill ───────────────────────────────────────────────
  stage1Phonetics: {
    titleVi: 'Kỹ thuật nối âm Phụ âm sang Nguyên âm (C ‿ V Linking)',
    focusSound: '/C ‿ V/ - Nối mượt mà phụ âm cuối sang nguyên âm mở đầu',
    vietnameseContrastiveTip:
      'Người học Việt Nam thường có phản xạ ngắt giọng sau từng từ, làm câu nói bị giật cục và rời rạc. Trong tiếng Anh tự nhiên, khi một từ kết thúc bằng phụ âm (như /r/, /t/, /z/) và từ ngay sau bắt đầu bằng nguyên âm (như /ɪ/, /ə/, /æ/), luồng hơi không bao giờ ngắt lại mà phụ âm sẽ "chuyển hộ khẩu" sang đứng đầu từ phía sau.',
    category: 'stress-linking',
    mouthTipVi:
      'Tuyệt đối không khép chặt môi hay chặn thanh quản giữa 2 từ. Giữ luồng hơi tiếp tục đẩy ra trong khi lưỡi hoặc môi chuyển nhanh sang khẩu hình nguyên âm kế tiếp.',
    minimalPairs: [
      {
        wordA: 'an aim',
        ipaA: '/ən eɪm/',
        wordB: 'a name',
        ipaB: '/ə neɪm/',
        meaningA: 'một mục tiêu',
        meaningB: 'một cái tên',
        distinctionVi: 'Nối phụ âm /n/ sang /eɪ/ tạo chuỗi âm nghe liền mạch tương tự "a name".',
      },
      {
        wordA: 'hold on',
        ipaA: '/hoʊld ɑːn/',
        wordB: 'whole dawn',
        ipaB: '/hoʊl dɔːn/',
        meaningA: 'chờ một chút',
        meaningB: 'toàn bộ rạng đông',
        distinctionVi: 'Âm /d/ lướt nhẹ sang /ɑːn/ thành /hoʊl.dɑːn/, giữ hơi mềm mại.',
      },
      {
        wordA: 'first of all',
        ipaA: '/fɜːrst əv ɔːl/',
        wordB: 'first to fall',
        ipaB: '/fɜːrst tə fɔːl/',
        meaningA: 'trước hết, đầu tiên',
        meaningB: 'người đầu tiên ngã',
        distinctionVi: 'Nối kép liên hoàn /t/ sang /ə/ và /v/ sang /ɔːl/.',
      },
      {
        wordA: 'take it',
        ipaA: '/teɪk ɪt/',
        wordB: 'ticket',
        ipaB: '/ˈtɪkɪt/',
        meaningA: 'cầm lấy nó',
        meaningB: 'chiếc vé',
        distinctionVi: 'Nối /k/ sang /ɪt/ tạo thành /teɪ.kɪt/, không nuốt âm k.',
      },
    ],
    practiceSentences: [
      {
        sentence: 'For instance, there is an enormous park in my neighborhood.',
        phoneticTarget: 'fɔː-rɪnstəns, ðeə-rɪz ən‿ɪˈnɔːrməs pɑːrk ɪn maɪ ˈneɪbərhʊd',
        vietnameseTranslation: 'Ví dụ, có một công viên rộng lớn ngay trong khu phố tôi sống.',
      },
      {
        sentence: 'As a result, I spend a lot of time outdoors with friends.',
        phoneticTarget: 'æ-zə rɪˈzʌlt, aɪ spend‿ə lɑː-təv taɪm ˌaʊtˈdɔːrz wɪð frendz',
        vietnameseTranslation: 'Kết quả là, tôi dành rất nhiều thời gian ngoài trời cùng bạn bè.',
      },
      {
        sentence: 'To be honest, it is an ideal place to raise a family.',
        phoneticTarget: 'tə biː ˈɑːnɪst, ɪ-tɪz ən aɪˈdiːəl pleɪs tə reɪz‿ə ˈfæməli',
        vietnameseTranslation: 'Thực lòng mà nói, đó là một nơi lý tưởng để nuôi dạy gia đình.',
      },
    ],
  },

  // ── Stage 2: Core Patterns & Lexical Chunks ────────────────────────────────
  stage2CorePatterns: {
    titleVi: 'Khung tư duy mở rộng câu 4 nhịp PREP',
    vietnameseGrammarRule:
      'Khung PREP là công cụ kinh điển của thuyết trình và IELTS Speaking. Mỗi lần nhận câu hỏi mở, hãy kích hoạt 4 câu tương ứng 4 chữ cái: P (Khẳng định quan điểm rõ ràng bằng cụm "To be honest, I would say...") -> R (Đưa lý do bằng "The main reason is that...") -> E (Kể trải nghiệm hoặc ví dụ thực tế bằng "For instance, just last week...") -> P (Chốt lại ý chính bằng "So overall, that is why...").',
    formula:
      'P (Point: To be honest, I would say...) + R (Reason: The primary reason is that...) + E (Example: For instance, just recently...) + P (Point: That is why I believe...)',
    legoSlots: [
      {
        template:
          'To be honest, I would say that {subject} is {adjective}. The main reason is that it offers {benefit}. For instance, just {time_marker}, I {action}. That is why {conclusion}.',
        slots: {
          subject: [
            'my hometown',
            'living in a big city',
            'the countryside lifestyle',
            'my current neighborhood',
          ],
          adjective: [
            'incredibly vibrant and energetic',
            'quite peaceful and relaxing',
            'a bit overwhelming at times',
            'extremely convenient for young workers',
          ],
          benefit: [
            'abundant career opportunities and modern facilities',
            'fresh clean air and a slow pace of life',
            'a fantastic variety of street food stalls',
            'great public transport connections',
          ],
          time_marker: [
            'last weekend',
            'a few days ago',
            'last month',
            'yesterday evening',
          ],
          action: [
            'hung out with friends at a bustling riverside coffee shop',
            'took a long peaceful walk around the central lake',
            'explored a famous night market filled with local delicacies',
            'commuted to work easily via the new metro line',
          ],
          conclusion: [
            'I truly enjoy calling this place my home',
            'I would not trade this vibrant atmosphere for anywhere else',
            'I find great comfort living in this area',
            'it perfectly suits my energetic daily lifestyle',
          ],
        },
        examples: [
          {
            en: 'To be honest, I would say that my hometown is incredibly vibrant and energetic. The main reason is that it offers abundant career opportunities and modern facilities. For instance, just last weekend, I hung out with friends at a bustling riverside coffee shop. That is why I truly enjoy calling this place my home.',
            vi: 'Thực lòng mà nói, tôi sẽ nói rằng quê hương tôi vô cùng sôi động và tràn đầy năng lượng. Lý do chính là nơi đây mang lại nhiều cơ hội nghề nghiệp và cơ sở vật chất hiện đại. Chẳng hạn, mới cuối tuần trước, tôi đã đi tụ tập với bạn bè ở một quán cà phê ven sông nhộn nhịp. Đó là lý do vì sao tôi thực sự thích gọi nơi này là tổ ấm.',
          },
          {
            en: 'To be honest, I would say that the countryside lifestyle is quite peaceful and relaxing. The main reason is that it offers fresh clean air and a slow pace of life. For instance, just a few days ago, I took a long peaceful walk around the central lake. That is why I find great comfort living in this area.',
            vi: 'Thực lòng mà nói, tôi cho rằng lối sống nông thôn rất thanh bình và thư thái. Lý do chính là nó mang lại bầu không khí trong lành và nhịp sống chậm rãi. Ví dụ, mới vài ngày trước, tôi đã đi dạo yên bình quanh hồ nước trung tâm. Đó là lý do tôi cảm thấy vô cùng thoải mái khi sống tại vùng này.',
          },
        ],
      },
    ],
    highFrequencyVocab: [
      {
        term: 'bustling',
        ipa: '/ˈbʌs.lɪŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'nhộn nhịp, tấp nập, hối hả',
        collocationHintVi: 'bustling city / bustling streets / bustling market',
        exampleSentenceEn: 'Da Nang is a bustling coastal city with friendly local residents.',
        exampleSentenceVi: 'Đà Nẵng là một thành phố ven biển nhộn nhịp với những người dân bản địa thân thiện.',
      },
      {
        term: 'cost of living',
        ipa: '/kɑːst əv ˈlɪv.ɪŋ/',
        partOfSpeech: 'noun',
        meaningVi: 'chi phí sinh hoạt',
        collocationHintVi: 'high / affordable / reasonable cost of living',
        exampleSentenceEn: 'The affordable cost of living makes this small town very attractive to retirees.',
        exampleSentenceVi: 'Chi phí sinh hoạt phải chăng khiến thị trấn nhỏ này rất thu hút người về hưu.',
      },
      {
        term: 'public amenities',
        ipa: '/ˈpʌb.lɪk əˈmen.ə.t̬iz/',
        partOfSpeech: 'noun',
        meaningVi: 'tiện ích công cộng (công viên, thư viện, bệnh viện, xe buýt)',
        collocationHintVi: 'modern public amenities / access to public amenities',
        exampleSentenceEn: 'Our district provides convenient public amenities within walking distance.',
        exampleSentenceVi: 'Quận của chúng tôi cung cấp các tiện ích công cộng thuận tiện trong tầm đi bộ.',
      },
      {
        term: 'vibrant',
        ipa: '/ˈvaɪ.brənt/',
        partOfSpeech: 'adj',
        meaningVi: 'sôi động, đầy sức sống',
        collocationHintVi: 'vibrant atmosphere / vibrant culture / vibrant nightlife',
        exampleSentenceEn: 'The city boasts a vibrant night scene with endless live music venues.',
        exampleSentenceVi: 'Thành phố sở hữu một đời sống ban đêm sôi động với vô số địa điểm biểu diễn âm nhạc sống.',
      },
    ],
  },

  // ── Stage 3: Guided Dialogue ───────────────────────────────────────────────
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại tương tác: Hỏi đáp về Quê hương & Môi trường sống',
    contextVi:
      'Giám khảo (Examiner) hỏi học viên (Learner) về nơi đang sinh sống trong kỳ thi IELTS Speaking Part 1. Học viên áp dụng khung PREP để trả lời kéo dài 4 bước trôi chảy.',
    frameworkType: 'prep',
    turns: [
      {
        speaker: 'Partner',
        en: 'Let us talk about your hometown. Do you like living in your current city?',
        vi: 'Hãy nói về quê hương của bạn nhé. Bạn có thích sống ở thành phố hiện tại không?',
        coreKeywords: ['hometown', 'like living', 'current city'],
      },
      {
        speaker: 'Learner',
        en: 'To be honest, I would say that I absolutely love living here because the atmosphere is vibrant.',
        vi: 'Thực lòng mà nói, tôi phải khẳng định rằng tôi vô cùng thích sống ở đây vì bầu không khí rất sôi động. (Point)',
        coreKeywords: ['To be honest', 'absolutely love', 'vibrant atmosphere'],
        suggestedStartersVi: ['To be honest, I would say that...'],
      },
      {
        speaker: 'Partner',
        en: 'What makes you feel so positive about it?',
        vi: 'Điều gì khiến bạn cảm thấy hào hứng về nơi đó như vậy?',
        coreKeywords: ['What makes you', 'feel positive'],
      },
      {
        speaker: 'Learner',
        en: 'The main reason is that it offers plenty of entertainment facilities and a very reasonable cost of living.',
        vi: 'Lý do chính là nơi đây có rất nhiều tiện ích giải trí và chi phí sinh hoạt cực kỳ hợp lý. (Reason)',
        coreKeywords: ['The main reason is', 'entertainment facilities', 'reasonable cost of living'],
        suggestedStartersVi: ['The main reason is that...'],
      },
      {
        speaker: 'Partner',
        en: 'Could you give me a specific example of what you usually do there?',
        vi: 'Bạn có thể cho tôi một ví dụ cụ thể về việc bạn thường làm ở đó không?',
        coreKeywords: ['specific example', 'usually do'],
      },
      {
        speaker: 'Learner',
        en: 'For instance, just last weekend, I went cycling around West Lake and enjoyed delicious street food with my friends. So overall, that is why I feel so lucky to live here.',
        vi: 'Chẳng hạn, mới cuối tuần trước, tôi đã đi đạp xe quanh Hồ Tây và thưởng thức món ăn đường phố thơm ngon cùng bạn bè. Vì vậy nhìn chung, đó là lý do tôi thấy rất may mắn khi sống ở đây. (Example & Point)',
        coreKeywords: ['For instance', 'just last weekend', 'cycling', 'that is why'],
        suggestedStartersVi: ['For instance, just last weekend...', 'So overall, that is why...'],
      },
    ],
  },

  // ── Stage 4: SafeHarbor Evaluation ────────────────────────────────────────
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Trả lời câu hỏi Part 1 chuẩn PREP',
    promptVi:
      'Giám khảo hỏi: "Do you like the city where you are living?" Hãy trả lời đầy đủ 4 nấc thang PREP (Point - Reason - Example - Point) trong thời gian dưới 50 giây.',
    promptQuestionEn: 'Do you like the city where you are living right now?',
    targetSentence:
      'To be honest, I would say that I love my hometown because it is vibrant. The main reason is that it offers great career opportunities. For instance, just last month, I found an amazing job in tech. That is why I plan to stay here long-term.',
    acceptableVariations: [
      'To be honest, I would say that I really like living in my city. The main reason is that the public amenities are very convenient. For instance, just last weekend, I visited a beautiful modern park near my apartment. So overall, that is why I enjoy this place so much.',
      'To be honest, I love my city because it is full of life. The main reason is that the food culture is incredible. For instance, just yesterday, I had fantastic pho at a famous street stall. That is why I feel very happy living here.',
    ],
    coreKeywords: ['To be honest', 'The main reason is', 'For instance', 'That is why'],
    targetMeaningVi:
      'Thành thật mà nói, tôi rất yêu thành phố của mình vì nó sôi động. Lý do chính là nó mang lại nhiều cơ hội nghề nghiệp. Ví dụ, mới tháng trước tôi đã tìm được công việc tuyệt vời trong ngành công nghệ. Đó là lý do tôi dự định gắn bó lâu dài.',
    instructionsVi:
      'Bấm ghi âm và nói liền mạch. Chú ý nối phụ âm sang nguyên âm ở "To be honest", "For instance", "That is why". Đạt từ 75 điểm trở lên để hoàn thành bài học.',
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
  },
};
