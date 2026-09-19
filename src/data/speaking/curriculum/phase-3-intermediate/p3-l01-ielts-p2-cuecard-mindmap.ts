import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p3L01IeltsP2CueCardMindmap: SpeakingCurriculumLesson = {
  id: 'p3-l01-ielts-p2-cuecard-mindmap',
  phaseId: 'phase-3-intermediate',
  order: 1,
  titleEn: 'IELTS Part 2: The 4-Quadrant Cue Card Mindmap',
  titleVi: 'IELTS Speaking Part 2: Sơ Đồ Tư Duy 4 Góc Phần Tư (4-Quadrant Mindmap)',
  cefrLevel: 'B1',
  targetBandIelts: '5.0-6.5',
  estimatedMinutes: 25,
  slug: 'ielts-p2-cuecard-mindmap',
  category: 'academic_debate',
  summaryVi:
    'Làm chủ phương pháp tư duy 4 góc phần tư trong 60 giây chuẩn bị để độc thoại mạch lạc 2 phút: Bối cảnh (Context) -> Diễn biến (Incident/Journey) -> Tháo gỡ (Resolution) -> Chiêm nghiệm (Reflection).',
  learningObjectivesVi: [
    'Nắm vững cấu trúc độc thoại 4 phần không bao giờ cạn ý tưởng khi nhận thẻ đề cue card',
    'Thành thạo các cụm từ mở đầu, chuyển đoạn và đúc kết bài học chiêm nghiệm',
    'Luyện tập kỹ thuật ngắt nhịp cụm nghĩa (Thought Groups) và trọng âm câu tự nhiên',
    'Hoàn thành bài kiểm tra SafeHarbor độc thoại kết nối bối cảnh và cảm xúc cá nhân',
  ],

  stage1Phonetics: {
    titleVi: 'Khởi động khẩu hình: Cụm nghĩa tư duy (Thought Groups) & Ngữ điệu chuyển đoạn',
    focusSound: 'Thought Groups & Pausing for Coherence',
    category: 'stress-linking',
    descriptionVi:
      'Trong bài nói độc thoại 2 phút, thí sinh mất điểm nhiều nhất khi nói đều đều không ngắt nhịp (robotic flat cadence). Kỹ thuật Thought Groups giúp chia câu dài thành các cụm thông tin có nghĩa, dừng nghỉ siêu ngắn (micro-pause) để gom hơi và tạo nhịp điệu cuốn hút.',
    mouthTipVi:
      'Khi nói cụm mở đầu: "I would like to talk about...", hạ nhẹ cao độ ở "about" rồi dừng khoảng 0.2 giây. Nhấn mạnh vào danh từ chỉ sự kiện cốt lõi bằng cách tăng trường độ âm tiết (kéo dài hơn 1.2 lần) và lên giọng nhẹ ở từ khóa chính.',
    vietnameseContrastiveTip:
      'Người Việt hay đọc lướt bằng phẳng từng âm tiết hoặc dừng sai chỗ (ngắt giữa chừng cụm từ cố định). Hãy nhớ quy tắc: Chỉ dừng nghỉ ở ranh giới giữa các mệnh đề hoặc sau cụm giới từ, tuyệt đối không ngắt giữa động từ và tân ngữ trực tiếp.',
    phonemes: ['/θɔːt ɡruːps/', '/ˈpɔː.zɪŋ/', '/ˈkɑːn.tekst/', '/ˌrez.əˈluː.ʃən/'],
    video: {
      youtubeVideoId: 'V9a8i2dF_mQ',
      channelName: "Rachel's English",
      startSeconds: 45,
      endSeconds: 150,
      title: 'Thought Groups and Pausing in English Speech',
      mouthTipSummaryVi:
        'Học cách chia nhỏ câu dài thành các khối tư duy và thở nhẹ ở các điểm ngắt nhịp mà không làm mất tính trôi chảy.',
    },
    minimalPairs: [
      {
        wordA: 'event',
        wordB: 'invent',
        ipaA: '/ɪˈvent/',
        ipaB: '/ɪnˈvent/',
        meaningA: 'sự kiện / biến cố',
        meaningB: 'phát minh / sáng chế',
        distinctionVi:
          'Từ "event" bắt đầu bằng nguyên âm /ɪ/ rồi sang âm môi-răng /v/; trong khi "invent" có âm mũi /n/ rõ rệt trước /v/.',
      },
      {
        wordA: 'incident',
        wordB: 'accident',
        ipaA: '/ˈɪn.sɪ.dənt/',
        ipaB: '/ˈæk.sɪ.dənt/',
        meaningA: 'sự cố, biến cố bất ngờ',
        meaningB: 'tai nạn rủi ro',
        distinctionVi:
          'Âm đầu /ɪ/ trong "incident" hạ cằm nhẹ, còn /æ/ trong "accident" phải đè sâu quai hàm mở rộng.',
      },
      {
        wordA: 'resolution',
        wordB: 'revolution',
        ipaA: '/ˌrez.əˈluː.ʃən/',
        ipaB: '/ˌrev.əˈluː.ʃən/',
        meaningA: 'hướng giải quyết, tháo gỡ',
        meaningB: 'cuộc cách mạng',
        distinctionVi:
          'Phân biệt âm xát /z/ trong "resolution" rung cổ họng và âm môi-răng /v/ trong "revolution".',
      },
    ],
    practiceSentences: [
      {
        sentence:
          'I would like to talk about a memorable journey / that took place roughly two years ago / when I was finishing university.',
        phoneticTarget: 'Ngắt 3 nhịp cụm nghĩa rõ ràng không đứt quãng luồng hơi',
        vietnameseTranslation:
          'Tôi muốn kể về một chuyến đi đáng nhớ diễn ra cách đây chừng 2 năm khi tôi chuẩn bị tốt nghiệp đại học.',
      },
      {
        sentence:
          'The turning point occurred / when our vehicle broke down / in the middle of nowhere.',
        phoneticTarget: 'Nhấn mạnh danh từ chỉ cao trào "turning point" và cụm "middle of nowhere"',
        vietnameseTranslation:
          'Bước ngoặt xảy ra khi xe của chúng tôi bị chết máy ngay giữa đồng không mông quạnh.',
      },
      {
        sentence:
          'Looking back on the whole experience, / it fundamentally shifted my perspective / on dealing with uncertainty.',
        phoneticTarget: 'Nối âm "looking back on the" và hạ giọng dứt khoát cuối câu',
        vietnameseTranslation:
          'Nhìn lại toàn bộ trải nghiệm ấy, nó đã làm thay đổi hoàn toàn cách nhìn của tôi về việc đương đầu với những điều không chắc chắn.',
      },
    ],
    targetPracticeWords: [
      { word: 'turning point', ipa: '/ˈtɜː.nɪŋ pɔɪnt/', meaningVi: 'bước ngoặt quan trọng' },
      { word: 'fundamentally', ipa: '/ˌfʌn.dəˈmen.təl.i/', meaningVi: 'về mặt căn bản' },
      { word: 'perspective', ipa: '/pəˈspek.tɪv/', meaningVi: 'góc nhìn, thế giới quan' },
      { word: 'incident', ipa: '/ˈɪn.sɪ.dənt/', meaningVi: 'sự cố, biến cố' },
    ],
  },

  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: 4 Góc Phần Tư Độc Thoại IELTS Part 2 (The 4-Quadrant Blueprint)',
    vietnameseGrammarRule:
      'Quy tắc 4 Góc Phần Tư giải quyết hoàn toàn nỗi sợ "nói được 45 giây rồi hết ý". Chia tờ nháp thi thành 4 ô vuông: Q1 (Context & Setup) -> Q2 (Journey & Crisis) -> Q3 (Resolution & Climax) -> Q4 (Reflection & Future Insight). Sử dụng thì Quá Khứ Đơn và Quá Khứ Tiếp Diễn cho bối cảnh, kết hợp Hiện Tại Hoàn Thành và Mệnh Đề Quan Hệ Rút Gọn cho phần chiêm nghiệm.',
    formula:
      'Quadrant 1: I would like to talk about [X] that took place [Time], when I was [Action/Context]. -> Quadrant 2: The defining moment was when [Crisis/Journey]. -> Quadrant 3: We eventually managed to [Resolution]. -> Quadrant 4: Looking back, this taught me that [Deep Insight].',
    overviewVi:
      'Bộ khung Lego này cung cấp các khối liên kết dẫn dắt giám khảo đi qua câu chuyện có mở đầu, cao trào và kết thúc giàu chiều sâu cảm xúc.',
    legoSlots: [
      {
        template:
          'I would like to talk about {topic_event} that took place roughly {time_frame}, when I was {personal_state}.',
        slots: {
          topic_event: [
            'a spontaneous road trip to the mountains',
            'a challenging university presentation',
            'an unexpected volunteering experience',
            'a time I had to make an agonizing decision',
          ],
          time_frame: [
            'two years ago during summer break',
            'back when I was a freshman in college',
            'in the middle of the pandemic lockdowns',
            'a couple of months after starting my first job',
          ],
          personal_state: [
            'struggling with severe academic burnout',
            'completely out of my comfort zone',
            'eager to explore unfamiliar territories',
            'trying to prove my capabilities to the team',
          ],
        },
        examples: [
          {
            en: "I would like to talk about a spontaneous road trip to the mountains that took place roughly two years ago during summer break, when I was struggling with severe academic burnout.",
            vi: 'Tôi muốn kể về một chuyến phượt ngẫu hứng lên vùng núi diễn ra cách đây khoảng hai năm vào kỳ nghỉ hè, khi tôi đang đối mặt với tình trạng kiệt sức vì việc học.',
          },
          {
            en: "I would like to talk about an unexpected volunteering experience that took place back when I was a freshman in college, when I was completely out of my comfort zone.",
            vi: 'Tôi muốn chia sẻ về một trải nghiệm tình nguyện bất ngờ diễn ra hồi tôi còn là sinh viên năm nhất, lúc tôi hoàn toàn bước ra khỏi vùng an toàn của mình.',
          },
        ],
      },
      {
        template:
          'Looking back on the entire ordeal, it was truly {emotional_impact} because it taught me {life_lesson}.',
        slots: {
          emotional_impact: [
            'an eye-opening wake-up call',
            'a humbling and transformative journey',
            'a profound milestone in my personal growth',
            'an unforgettable test of resilience',
          ],
          life_lesson: [
            'how crucial patience and composure are in times of crisis',
            'that unexpected setbacks often conceal valuable opportunities',
            'the immense power of authentic human solidarity',
            'not to take personal relationships for granted',
          ],
        },
        examples: [
          {
            en: 'Looking back on the entire ordeal, it was truly an eye-opening wake-up call because it taught me how crucial patience and composure are in times of crisis.',
            vi: 'Nhìn lại toàn bộ thử thách gian nan đó, nó thực sự là một hồi chuông cảnh tỉnh giúp tôi mở mang tầm mắt vì nó dạy tôi rằng sự kiên nhẫn và bình tĩnh quan trọng nhường nào khi biến cố ập đến.',
          },
        ],
      },
    ],
    highFrequencyVocab: [
      {
        term: 'eye-opener',
        ipa: '/ˈaɪˌoʊ.pə.nər/',
        partOfSpeech: 'noun',
        meaningVi: 'trải nghiệm mở mang tầm mắt, bài học thức tỉnh',
        collocationHintVi: 'Thường đi với tính từ: a real eye-opener, a profound eye-opener',
        exampleSentenceEn: 'Travelling alone to a foreign country was a massive eye-opener for me.',
        exampleSentenceVi: 'Đi du lịch một mình đến một quốc gia xa lạ là một trải nghiệm mở mang tầm mắt to lớn đối với tôi.',
      },
      {
        term: 'turning point',
        ipa: '/ˈtɜː.nɪŋ pɔɪnt/',
        partOfSpeech: 'noun',
        meaningVi: 'bước ngoặt làm thay đổi cục diện',
        collocationHintVi: 'Dùng cấu trúc: mark a pivotal turning point in my life',
        exampleSentenceEn: 'Failing that exam marked a pivotal turning point in my work ethic.',
        exampleSentenceVi: 'Việc trượt kỳ thi đó đã đánh dấu một bước ngoặt xoay chuyển trong thái độ làm việc của tôi.',
      },
      {
        term: 'composure',
        ipa: '/kəmˈpoʊ.ʒər/',
        partOfSpeech: 'noun',
        meaningVi: 'sự điềm tĩnh, tự chủ khi gặp nghịch cảnh',
        collocationHintVi: 'Cụm thông dụng: maintain composure under pressure',
        exampleSentenceEn: 'She managed to keep her composure despite the chaotic situation.',
        exampleSentenceVi: 'Cô ấy đã giữ được sự điềm tĩnh mặc cho tình thế vô cùng hỗn loạn.',
      },
      {
        term: 'out of one’s comfort zone',
        ipa: '/aʊt əv wʌnz ˈkʌm.fət zoʊn/',
        partOfSpeech: 'phrase',
        meaningVi: 'bước ra ngoài vùng an toàn quen thuộc',
        collocationHintVi: 'Đi với động từ: push someone / step out of comfort zone',
        exampleSentenceEn: 'Stepping out of my comfort zone allowed me to discover hidden strengths.',
        exampleSentenceVi: 'Việc bước ra khỏi vùng an toàn đã cho phép tôi khám phá những thế mạnh tiềm ẩn của bản thân.',
      },
    ],
  },

  stage3GuidedDialogue: {
    titleVi: 'Thực hành hội thoại: Độc thoại IELTS Part 2 theo sơ đồ 4 góc phần tư',
    contextVi:
      'Giám khảo trao thẻ Cue Card: "Describe a challenging journey or experience you had". Bạn thực hành nói liên tục thông qua 4 lượt đối đáp bóc tách từng góc phần tư.',
    frameworkType: 'cue-card',
    frameworkData: {
      cueCardTopic: 'Describe a challenging journey or personal experience',
      quadrants: [
        'Q1: Background context (When, where, companions, objective)',
        'Q2: Sudden conflict or crisis that tested your resilience',
        'Q3: Practical resolution and emotional relief',
        'Q4: Lasting reflection and philosophical takeaway',
      ],
    },
    turns: [
      {
        speaker: 'Examiner',
        en: 'Now, I would like you to speak for one to two minutes on this topic. You have one minute to prepare. Please begin speaking whenever you are ready.',
        vi: 'Bây giờ, tôi muốn bạn nói trong vòng từ một đến hai phút về chủ đề này. Bạn có một phút chuẩn bị. Hãy bắt đầu khi bạn sẵn sàng.',
        coreKeywords: ['speak', 'one to two minutes', 'topic', 'ready'],
      },
      {
        speaker: 'Candidate',
        en: 'I would like to talk about a spontaneous road trip through the northern highlands of Vietnam that took place roughly two years ago, when my friends and I were feeling overwhelmed by our graduation thesis.',
        vi: 'Tôi xin phép được kể về một chuyến phượt ngẫu hứng qua vùng cao nguyên phía Bắc Việt Nam diễn ra cách đây khoảng hai năm, khi tôi và nhóm bạn đang cảm thấy quá tải vì khóa luận tốt nghiệp.',
        coreKeywords: ['spontaneous', 'road trip', 'northern highlands', 'graduation thesis'],
        ipa: '/aɪ wʊd laɪk tə tɔːk əˈbaʊt ə spɑːnˈteɪ.ni.əs roʊd trɪp...',
        suggestedStartersVi: [
          'I would like to talk about...',
          'The experience I want to recount is...',
        ],
      },
      {
        speaker: 'Examiner',
        en: 'That sounds intriguing. What happened during this trip that made it so challenging?',
        vi: 'Nghe có vẻ rất thú vị. Điều gì đã xảy ra trong chuyến đi khiến nó trở nên đầy thử thách như vậy?',
        coreKeywords: ['intriguing', 'happened', 'challenging'],
      },
      {
        speaker: 'Candidate',
        en: 'The major turning point came on the second evening. As we were navigating a secluded mountain pass, dense fog rolled in and our lead motorbike broke down completely, cutting off phone reception.',
        vi: 'Bước ngoặt lớn xảy đến vào chiều tối ngày thứ hai. Khi chúng tôi đang băng qua một con đèo hẻo lánh thì sương mù dày đặc tràn về và chiếc xe máy dẫn đoàn bị chết máy hoàn toàn, lại mất sạch sóng điện thoại.',
        coreKeywords: ['turning point', 'navigating', 'secluded mountain pass', 'dense fog', 'broke down'],
        suggestedStartersVi: [
          'The major turning point came when...',
          'Everything took an unexpected turn when...',
        ],
      },
      {
        speaker: 'Examiner',
        en: 'How did you and your companions resolve that predicament?',
        vi: 'Bạn và các bạn đồng hành đã tháo gỡ tình huống khó khăn hiểm nghèo đó như thế nào?',
        coreKeywords: ['resolve', 'predicament', 'companions'],
      },
      {
        speaker: 'Candidate',
        en: 'Instead of panicking, we pooled our resources. Luckily, an ethnic minority farmer noticed our flashlight signals and guided us to a nearby hamlet, where we were warmly welcomed with hot herbal tea and shelter.',
        vi: 'Thay vì hoảng loạn, chúng tôi tập hợp đồ đạc và bình tĩnh hỗ trợ nhau. Thật may mắn, một bác nông dân người dân tộc đã nhận ra tín hiệu đèn pin và dẫn chúng tôi về bản làng gần đó, nơi chúng tôi được đón tiếp nồng hậu với trà thảo mộc ấm và chỗ trú qua đêm.',
        coreKeywords: ['panicking', 'pooled our resources', 'flashlight signals', 'hamlet', 'warmly welcomed'],
        suggestedStartersVi: [
          'Instead of giving in to panic, we...',
          'We managed to overcome this by...',
        ],
      },
      {
        speaker: 'Candidate',
        en: 'Looking back on the entire ordeal, it was truly a profound eye-opener because it fundamentally shifted my perspective on uncertainty and taught me to cherish genuine human kindness.',
        vi: 'Nhìn lại toàn bộ thử thách gian nan ấy, đó thực sự là một trải nghiệm mở mang nhận thức sâu sắc bởi nó đã làm thay đổi hoàn toàn cách tôi nhìn nhận những điều bất định và dạy tôi biết trân trọng sự tử tế mộc mạc giữa con người với nhau.',
        coreKeywords: ['looking back', 'profound eye-opener', 'fundamentally shifted', 'perspective', 'human kindness'],
        suggestedStartersVi: [
          'Looking back on the whole experience...',
          'All in all, this incident left a lasting impression because...',
        ],
      },
    ],
  },

  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Bật nhanh câu chiêm nghiệm IELTS Band 6.5+',
    promptVi:
      'Hãy nói câu chiêm nghiệm kết bài cho phần độc thoại Part 2: "Nhìn lại toàn bộ trải nghiệm, đó thực sự là một bài học mở mang tầm mắt vì nó đã thay đổi căn bản góc nhìn của tôi."',
    promptQuestionEn:
      'Reflect on the long-term impact of that experience using advanced academic phrasing.',
    targetSentence:
      'Looking back on the entire ordeal, it was truly an eye-opener because it fundamentally shifted my perspective.',
    targetMeaningVi:
      'Nhìn lại toàn bộ thử thách gian nan đó, nó thực sự là một bài học mở mang tầm mắt bởi vì nó đã làm thay đổi căn bản góc nhìn của tôi.',
    instructionsVi:
      'Phát âm rõ ràng các cụm: "entire ordeal", "eye-opener", "fundamentally shifted my perspective". Thuật toán SafeHarbor sẽ đo lường từ khóa trọng tâm và độ trôi chảy.',
    targetReflexLatencyMs: 2500,
    minimumPassingScore: 75,
    coreKeywords: ['looking back', 'entire', 'ordeal', 'eye-opener', 'fundamentally', 'shifted', 'perspective'],
    acceptableVariations: [
      'Looking back on the entire experience, it was truly an eye-opener because it fundamentally shifted my perspective.',
      'Looking back on the whole ordeal, it was truly an eye-opener because it fundamentally changed my perspective.',
      'Looking back, the whole experience was an eye-opener because it completely shifted my perspective.',
      'Looking back on that ordeal, it was truly an eye-opener as it fundamentally transformed my perspective.',
    ],
  },
};
