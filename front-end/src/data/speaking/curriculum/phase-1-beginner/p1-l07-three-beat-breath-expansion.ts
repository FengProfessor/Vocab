import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p1L07ThreeBeatBreathExpansion: SpeakingCurriculumLesson = {
  id: 'p1-l07-three-beat-breath-expansion',
  phaseId: 'phase-1-beginner',
  order: 7,
  titleEn: 'The 3-Beat Breath Expansion Technique',
  titleVi: 'Kỹ thuật mở rộng câu theo 3 nhịp thở (Quy tắc nở câu)',
  cefrLevel: 'A1',
  targetBandIelts: '0-3.0',
  estimatedMinutes: 15,
  summaryVi:
    'Kéo dài câu nói từ những câu đơn cụt ngủn thành một phát ngôn hoàn chỉnh 3 nhịp: Khối lõi (S+V) -> Bối cảnh (Ở đâu/Khi nào) -> Lý do & Cảm xúc (Because/So).',
  category: 'daily_life',
  slug: 'three-beat-breath-expansion',
  learningObjectivesVi: [
    'Nắm vững quy tắc phát triển câu 3 nhịp thở để không bao giờ bị rơi vào khoảng im lặng ngượng ngùng.',
    'Làm chủ nhịp điệu câu tiếng Anh (Sentence Stress): từ nội dung nhấn to dài, từ ngữ pháp lướt nhanh.',
    'Sử dụng mượt mà liên từ "because" và "so" để kết nối nguyên nhân và cảm xúc.',
    'Hoàn thành thử thách SafeHarbor phát âm trọn vẹn câu 3 nhịp trong dưới 2 giây.',
  ],
  stage1Phonetics: {
    titleVi: 'Khởi động cơ miệng: Trọng âm câu & Nhịp điệu bản xứ (Sentence Stress & Rhythm)',
    focusSound: 'Sentence Stress & Rhythm (Đẳng thời trọng âm)',
    vietnameseContrastiveTip:
      'Tiếng Việt là ngôn ngữ đơn lập đẳng thời âm tiết: mỗi âm tiết nói ra với thời lượng và độ cao gần như bằng nhau (như tiếng gõ nhịp đều đặn). Tiếng Anh lại là ngôn ngữ đẳng thời trọng âm (stress-timed):\n- Chỉ những từ mang nội dung cốt lõi (Content Words: danh từ, động từ chính, tính từ) mới được nhấn: TO HƠN - CAO HƠN - DÀI HƠN.\n- Những từ chức năng phụ trợ (Function Words: mạo từ a/the, giới từ in/at/on, đại từ I/it) bị lướt cực nhanh, hạ thấp giọng và đọc nhẹ mờ.\nKhi học viên cố đọc to từng từ như tiếng Việt, câu nói sẽ rất thô cứng và nhanh mệt.',
    category: 'stress-linking',
    phonemes: ['/ˈriːdɪŋ/', '/bɪˈkɒz/', '/ˈbedruːm/'],
    mouthTipVi:
      'Hãy đập tay xuống bàn theo từng từ được viết hoa: "I READ BOOKS (đập 1) / in my BED-room (đập 2) / be-CAUSE it re-LAX-es me (đập 3)". Các từ nhỏ ở giữa trượt nhẹ theo quán tính.',
    video: {
      youtubeVideoId: 'U9_8q8y9Qk4',
      channelName: "Rachel's English",
      startSeconds: 30,
      endSeconds: 110,
      title: "Rhythm and Sentence Stress in English - Rachel's English",
      mouthTipSummaryVi:
        'Quan sát cách các từ khóa nội dung được phát âm với cao độ vút lên và độ dài gấp đôi các từ phụ.',
    },
    targetPracticeWords: [
      { word: 'reading', ipa: '/ˈriːdɪŋ/', meaningVi: 'việc đọc sách' },
      { word: 'bedroom', ipa: '/ˈbedruːm/', meaningVi: 'phòng ngủ' },
      { word: 'evening', ipa: '/ˈiːvnɪŋ/', meaningVi: 'buổi tối' },
      { word: 'relaxes', ipa: '/rɪˈlæksɪz/', meaningVi: 'giúp thư giãn' },
      { word: 'because', ipa: '/bɪˈkɒz/', meaningVi: 'bởi vì' },
      { word: 'peaceful', ipa: '/ˈpiːsfl/', meaningVi: 'yên bình' },
    ],
    minimalPairs: [
      {
        wordA: 'reading',
        ipaA: '/ˈriːdɪŋ/',
        meaningA: 'việc đọc sách (2 âm tiết)',
        wordB: 'read',
        ipaB: '/riːd/',
        meaningB: 'đọc (1 âm tiết)',
        distinctionVi: 'từ có nhấn trọng âm đầu vs từ đơn âm tiết',
      },
      {
        wordA: 'bedroom',
        ipaA: '/ˈbedruːm/',
        meaningA: 'phòng ngủ (nhấn âm 1)',
        wordB: 'bed',
        ipaB: '/bed/',
        meaningB: 'chiếc giường ngủ',
        distinctionVi: 'danh từ ghép có trọng âm hạ bậc vs từ gốc đơn',
      },
      {
        wordA: 'evening',
        ipaA: '/ˈiːvnɪŋ/',
        meaningA: 'buổi tối',
        wordB: 'even',
        ipaB: '/ˈiːvn/',
        meaningB: 'thậm chí, bằng phẳng',
        distinctionVi: 'đuôi /ɪŋ/ ngân nhẹ trong khoang mũi vs kết thúc /n/',
      },
      {
        wordA: 'relaxes',
        ipaA: '/rɪˈlæksɪz/',
        meaningA: 'thư giãn (3 âm tiết)',
        wordB: 'relax',
        ipaB: '/rɪˈlæks/',
        meaningB: 'thư giãn (2 âm tiết)',
        distinctionVi: 'thêm đuôi /-ɪz/ rõ ràng ở ngôi thứ ba số ít',
      },
    ],
    practiceSentences: [
      {
        sentence: 'I read books in my bedroom every evening.',
        phoneticTarget: 'Stress on "read", "books", "bedroom", "evening"',
        vietnameseTranslation: 'Tôi đọc sách trong phòng ngủ của mình vào mỗi buổi tối.',
      },
      {
        sentence: 'I drink coffee at a cafe because it keeps me awake.',
        phoneticTarget: 'Stress on "drink", "coffee", "cafe", "awake"',
        vietnameseTranslation: 'Tôi uống cà phê tại quán cafe vì nó giúp tôi tỉnh táo.',
      },
      {
        sentence: 'She studies English online so she can travel easily.',
        phoneticTarget: 'Stress on "studies", "English", "travel"',
        vietnameseTranslation: 'Cô ấy học tiếng Anh trực tuyến để có thể đi du lịch dễ dàng.',
      },
    ],
  },
  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: Công thức nở câu 3 nhịp thở',
    vietnameseGrammarRule:
      'Thay vì chỉ trả lời cộc lốc một câu cụt, hãy tuần tự bổ sung 3 nhịp: Nhịp 1 (Hành động lõi: Subject + Verb) + Nhịp 2 (Bối cảnh không gian/thời gian: Prepositional Phrase) + Nhịp 3 (Lý do hoặc cảm xúc: because / so + mệnh đề).',
    formula:
      '[Nhịp 1: I + Verb] + [Nhịp 2: in/at/every + Noun] + [Nhịp 3: because it makes me / helps me + Verb].',
    overviewVi:
      'Quy tắc 3 nhịp giúp não bộ định hình câu nói từng bước một theo trật tự tự nhiên, triệt tiêu hoàn toàn thói quen dịch thầm từng chữ.',
    highFrequencyVocab: [
      {
        term: 'bedroom',
        ipa: '/ˈbedruːm/',
        partOfSpeech: 'noun',
        meaningVi: 'phòng ngủ',
        collocationHintVi: 'in my cozy bedroom (trong phòng ngủ ấm cúng của tôi)',
        exampleSentenceEn: 'I like sitting in my bedroom.',
        exampleSentenceVi: 'Tôi thích ngồi trong phòng ngủ của mình.',
      },
      {
        term: 'relaxes',
        ipa: '/rɪˈlæksɪz/',
        partOfSpeech: 'verb',
        meaningVi: 'giúp thư giãn',
        collocationHintVi: 'it relaxes my mind (nó giúp tâm trí tôi thư giãn)',
        exampleSentenceEn: 'Soft music relaxes my mind after work.',
        exampleSentenceVi: 'Âm nhạc êm dịu giúp tâm trí tôi thư giãn sau giờ làm việc.',
      },
      {
        term: 'because',
        ipa: '/bɪˈkɒz/',
        partOfSpeech: 'phrase',
        meaningVi: 'bởi vì',
        collocationHintVi: 'because I want to (bởi vì tôi muốn)',
        exampleSentenceEn: 'I study hard because I have big goals.',
        exampleSentenceVi: 'Tôi học hành chăm chỉ bởi vì tôi có những mục tiêu lớn.',
      },
      {
        term: 'energy',
        ipa: '/ˈenədʒi/',
        partOfSpeech: 'noun',
        meaningVi: 'năng lượng',
        collocationHintVi: 'gives me positive energy (mang lại cho tôi năng lượng tích cực)',
        exampleSentenceEn: 'Fresh air gives me great energy.',
        exampleSentenceVi: 'Không khí trong lành mang lại cho tôi nguồn năng lượng dồi dào.',
      },
    ],
    legoSlots: [
      {
        template: 'I read books {place_and_time} because {reason}.',
        slots: {
          place_and_time: [
            'in my bedroom every evening',
            'in the living room at night',
            'at the quiet library on Sundays',
          ],
          reason: [
            'it relaxes me',
            'it helps me sleep better',
            'I love acquiring knowledge',
          ],
        },
        examples: [
          {
            en: 'I read books in my bedroom every evening because it relaxes me.',
            vi: 'Tôi đọc sách trong phòng ngủ mỗi buổi tối vì nó giúp tôi thư giãn.',
          },
          {
            en: 'I read books at the quiet library on Sundays because I love acquiring knowledge.',
            vi: 'Tôi đọc sách ở thư viện yên tĩnh vào Chủ nhật vì tôi thích tiếp thu kiến thức.',
          },
        ],
      },
      {
        template: 'I drink {beverage} {location} because {benefit}.',
        slots: {
          beverage: ['green tea', 'warm water', 'black coffee'],
          location: ['in the morning', 'after every meal', 'at my working desk'],
          benefit: ['it is healthy', 'it keeps me focused', 'it tastes wonderful'],
        },
        examples: [
          {
            en: 'I drink green tea in the morning because it is healthy.',
            vi: 'Tôi uống trà xanh vào buổi sáng vì nó tốt cho sức khỏe.',
          },
          {
            en: 'I drink black coffee at my working desk because it keeps me focused.',
            vi: 'Tôi uống cà phê đen tại bàn làm việc vì nó giúp tôi tập trung.',
          },
        ],
      },
    ],
  },
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại dẫn dắt: Trả lời câu hỏi về thời gian rảnh theo 3 nhịp',
    contextVi:
      'Trong câu lạc bộ tiếng Anh cuối tuần, một người bạn hỏi: "What do you like to do in your free time?". Bạn áp dụng kỹ thuật 3 nhịp để đưa ra câu trả lời chi tiết và cuốn hút.',
    frameworkType: '3-beat',
    turns: [
      {
        speaker: 'Partner',
        en: 'Hi! Many people feel stressed after work. What do you like doing in your free time?',
        vi: 'Chào bạn! Nhiều người cảm thấy căng thẳng sau giờ làm. Bạn thích làm gì trong thời gian rảnh rỗi?',
        coreKeywords: ['stressed', 'work', 'like', 'free', 'time'],
      },
      {
        speaker: 'Learner',
        en: 'In my free time, I really love reading books.',
        vi: 'Vào thời gian rảnh, tôi thực sự rất thích đọc sách.',
        coreKeywords: ['free', 'time', 'love', 'reading', 'books'],
        suggestedStartersVi: ['In my free time, I...', 'Well, I really love...'],
      },
      {
        speaker: 'Partner',
        en: 'That is wonderful! Where and when do you usually read?',
        vi: 'Tuyệt quá! Bạn thường đọc sách ở đâu và vào lúc nào vậy?',
        coreKeywords: ['wonderful', 'where', 'when', 'usually', 'read'],
      },
      {
        speaker: 'Learner',
        en: 'I read books in my bedroom every evening because it relaxes me.',
        vi: 'Tôi đọc sách trong phòng ngủ của mình mỗi tối vì nó giúp tôi thư giãn.',
        coreKeywords: ['read', 'books', 'bedroom', 'evening', 'because', 'relaxes'],
        suggestedStartersVi: ['I usually read in...', 'I read books in my...'],
      },
      {
        speaker: 'Partner',
        en: 'Does reading books help you fall asleep easily at night?',
        vi: 'Đọc sách có giúp bạn dễ đi vào giấc ngủ ban đêm hơn không?',
        coreKeywords: ['reading', 'books', 'sleep', 'easily', 'night'],
      },
      {
        speaker: 'Learner',
        en: 'Yes, it calms my mind, so I always sleep very well.',
        vi: 'Có chứ, nó làm dịu tâm trí tôi, vì vậy tôi luôn ngủ rất ngon.',
        coreKeywords: ['calms', 'mind', 'sleep', 'well'],
        suggestedStartersVi: ['Yes, it calms...', 'Definitely, it helps me...'],
      },
    ],
  },
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Phát ngôn chuẩn 3 nhịp thở',
    promptVi:
      'Hãy nói trọn vẹn câu 3 nhịp (Hành động -> Bối cảnh phòng ngủ/buổi tối -> Lý do thư giãn) trong vòng 2 giây.',
    promptQuestionEn: 'Where, when and why do you usually read books at home?',
    targetSentence: 'I read books in my bedroom every evening because it relaxes me.',
    targetMeaningVi: 'Tôi đọc sách trong phòng ngủ mỗi buổi tối vì nó giúp tôi thư giãn.',
    acceptableVariations: [
      'I usually read books in my bedroom every evening because it relaxes me.',
      'I read books in my room every evening because it helps me relax.',
      'I read books in my bedroom every night because it relaxes me.',
    ],
    coreKeywords: ['read', 'books', 'bedroom', 'evening', 'because', 'relaxes'],
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1500,
    instructionsVi:
      'Nhấn to ở các từ "read", "books", "bedroom", "evening", "relaxes". SafeHarbor sẽ đo lường độ hoàn thiện của cả 3 nhịp giao tiếp.',
  },
};
