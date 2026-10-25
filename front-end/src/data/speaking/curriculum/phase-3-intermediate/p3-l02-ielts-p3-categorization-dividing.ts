import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p3L02IeltsP3CategorizationDividing: SpeakingCurriculumLesson = {
  id: 'p3-l02-ielts-p3-categorization-dividing',
  phaseId: 'phase-3-intermediate',
  order: 2,
  titleEn: 'IELTS Part 3: Categorization & Dividing Answers',
  titleVi: 'IELTS Speaking Part 3: Kỹ Thuật Phân Khúc Đối Tượng & Đa Chiều Hóa Câu Trả Lời',
  cefrLevel: 'B1',
  targetBandIelts: '5.0-6.5',
  estimatedMinutes: 25,
  slug: 'ielts-p3-categorization-dividing',
  category: 'academic_debate',
  summaryVi:
    'Phá vỡ thói quen trả lời đơn chiều Yes/No trong IELTS Speaking Part 3. Làm chủ kỹ thuật phân khúc theo thế hệ (Generational cohorts), địa lý (Urban vs Rural) hoặc khung thời gian (Short-term vs Long-term) để đạt Band 6.5+.',
  learningObjectivesVi: [
    'Biết cách chia nhỏ đối tượng phân tích thay vì đưa ra nhận định phiến diện',
    'Thành thạo các cặp liên từ phân lập đối lập "On the one hand... On the flip side..."',
    'Luyện tập trọng âm và nhịp điệu các từ học thuật 4-5 âm tiết (demographic, generational, categorization)',
    'Thực hành phản xạ phân tích câu hỏi xã hội trong môi trường SafeHarbor',
  ],

  stage1Phonetics: {
    titleVi: 'Khởi động khẩu hình: Trọng âm từ học thuật 4-5 âm tiết & Nhịp điệu đối lập',
    focusSound: 'Polysyllabic Word Stress & Contrastive Intonation',
    category: 'stress-linking',
    descriptionVi:
      'Trong IELTS Part 3, thí sinh thường sử dụng các danh từ trừu tượng chỉ nhóm xã hội. Các từ này thường có 4 đến 5 âm tiết, đòi hỏi nhận diện trọng âm chính xác (thường rơi vào âm tiết thứ 3 hoặc áp chót trước các hậu tố -ic, -tion, -al).',
    mouthTipVi:
      'Với từ "demographic" /ˌdem.əˈɡræf.ɪk/, trọng âm phụ rơi vào "dem", trọng âm chính rơi mạnh vào "graff" (hạ hàm mở to nguyên âm /æ/), âm đuôi kết thúc dứt khoát bằng âm bật vòm họng /k/.',
    vietnameseContrastiveTip:
      'Người Việt thường phát âm các từ dài bằng cách nhấn đều tất cả các âm tiết với thanh bằng, làm người bản xứ rất khó bắt từ. Hãy nhớ quy tắc: Âm mang trọng âm đọc To hơn - Cao hơn - Dài hơn gấp đôi; các âm còn lại lướt nhẹ thành âm gió hoặc schwa /ə/.',
    phonemes: ['/ˌdem.əˈɡræf.ɪk/', '/ˌdʒen.əˈreɪ.ʃən.əl/', '/ˌkæt̬.ə.ɡər.əˈzeɪ.ʃən/', '/ˌsaɪ.kəˈlɑː.dʒɪ.kəl/'],
    video: {
      youtubeVideoId: 'f0wG-U-D2w8',
      channelName: "Rachel's English",
      startSeconds: 30,
      endSeconds: 140,
      title: 'Word Stress on Words Ending in -IC and -TION',
      mouthTipSummaryVi:
        'Quy tắc vàng: Trọng âm chính luôn rơi vào âm tiết đứng ngay trước các hậu tố -ic, -tion, -sion.',
    },
    minimalPairs: [
      {
        wordA: 'cohort',
        wordB: 'court',
        ipaA: '/ˈkoʊ.hɔːrt/',
        ipaB: '/kɔːrt/',
        meaningA: 'nhóm người cùng thế hệ / phân khúc',
        meaningB: 'tòa án / sân bóng',
        distinctionVi:
          'Từ "cohort" gồm 2 âm tiết rõ ràng với nguyên âm đôi /oʊ/ ở âm tiết đầu; "court" là từ 1 âm tiết duy nhất với nguyên âm dài /ɔːr/.',
      },
      {
        wordA: 'demographic',
        wordB: 'democratic',
        ipaA: '/ˌdem.əˈɡræf.ɪk/',
        ipaB: '/ˌdem.əˈkræt̬.ɪk/',
        meaningA: 'thuộc về nhân khẩu học / nhóm dân số',
        meaningB: 'thuộc về dân chủ',
        distinctionVi:
          'Phân biệt phụ âm /ɡr/ trong "demographic" và phụ âm /kr/ trong "democratic".',
      },
      {
        wordA: 'divide',
        wordB: 'device',
        ipaA: '/dɪˈvaɪd/',
        ipaB: '/dɪˈvaɪs/',
        meaningA: 'chia cắt, phân chia (động từ/danh từ)',
        meaningB: 'thiết bị điện tử (danh từ)',
        distinctionVi:
          'Âm cuối của "divide" là phụ âm bật hữu thanh /d/; âm cuối của "device" là âm xì vô thanh /s/.',
      },
    ],
    practiceSentences: [
      {
        sentence:
          'Well, it primarily boils down to demographic and generational differences.',
        phoneticTarget: 'Nhấn mạnh trọng âm chính của "demographic" và "generational"',
        vietnameseTranslation:
          'À, điều đó chủ yếu xuất phát từ những khác biệt về nhân khẩu học và thế hệ.',
      },
      {
        sentence:
          'On the one hand, younger cohorts prioritize flexibility; on the flip side, older demographics value stability.',
        phoneticTarget: 'Ngữ điệu đối lập nhịp nhàng: lên giọng ở vế đầu, xuống giọng ở vế sau',
        vietnameseTranslation:
          'Một mặt, nhóm người trẻ ưu tiên sự linh hoạt; mặt khác, nhóm nhân khẩu lớn tuổi lại coi trọng tính ổn định.',
      },
      {
        sentence:
          'From a spatial perspective, there is a stark divide between urban and rural dwellers.',
        phoneticTarget: 'Nối âm "divide between" và nhấn mạnh tính từ "stark divide"',
        vietnameseTranslation:
          'Xét từ góc độ không gian địa lý, có một sự phân hóa rõ rệt giữa cư dân thành thị và nông thôn.',
      },
    ],
    targetPracticeWords: [
      { word: 'demographic', ipa: '/ˌdem.əˈɡræf.ɪk/', meaningVi: 'nhóm nhân khẩu học' },
      { word: 'generational', ipa: '/ˌdʒen.əˈreɪ.ʃən.əl/', meaningVi: 'thuộc về thế hệ' },
      { word: 'cohort', ipa: '/ˈkoʊ.hɔːrt/', meaningVi: 'nhóm đối tượng có chung đặc điểm' },
      { word: 'stark divide', ipa: '/stɑːrk dɪˈvaɪd/', meaningVi: 'sự phân chia, khoảng cách rõ rệt' },
    ],
  },

  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: Phân loại đa tầng trong IELTS Part 3 (Categorization Frames)',
    vietnameseGrammarRule:
      'Khi giám khảo Part 3 hỏi các câu hỏi vĩ mô (Ví dụ: "Do people like online shopping?"), người đạt điểm cao không bao giờ trả lời "Yes, because...". Thay vào đó, bạn phải phân loại ngay lập tức: 1. Theo thế hệ (The younger generation vs The senior population), 2. Theo địa lý (Metropolitan residents vs Rural inhabitants), 3. Theo thu nhập (High-income earners vs Budget-conscious consumers). Sử dụng cấu trúc "It primarily boils down to [Factor]. On the one hand... On the flip side...".',
    formula:
      'Starter: Well, it primarily boils down to {Category_Type}. -> Side A: On the one hand, {Group_A} tend to {Preference_A} because {Reason_A}. -> Side B: On the flip side, {Group_B} are much more inclined to {Preference_B} due to {Reason_B}.',
    overviewVi:
      'Cấu trúc này giúp bài nói của bạn lập tức mang tính học thuật cao, có chiều sâu tư duy phản biện và kéo dài câu trả lời tới 45-60 giây một cách tự nhiên.',
    legoSlots: [
      {
        template:
          'Well, it primarily boils down to {dividing_factor}. On the one hand, {group_alpha} tend to {habit_alpha}. On the flip side, {group_beta} are much more inclined to {habit_beta}.',
        slots: {
          dividing_factor: [
            'generational cohorts and digital literacy',
            'socioeconomic status and disposable income',
            'a clear urban versus rural geographical divide',
            'short-term convenience versus long-term sustainability',
          ],
          group_alpha: [
            'tech-savvy millennials and Gen Z professionals',
            'urban commuters living in high-density areas',
            'younger consumers seeking instant gratification',
            'ambitious students pursuing global career options',
          ],
          habit_alpha: [
            'gravitate toward automated e-commerce and rapid delivery',
            'rely almost exclusively on app-based micro-mobility',
            'embrace contactless payments and virtual interactions',
            'prioritize flexible remote work arrangements',
          ],
          group_beta: [
            'the elderly population and traditional shoppers',
            'rural residents with limited digital infrastructure',
            'budget-conscious families managing household expenses',
            'older professionals who value face-to-face mentorship',
          ],
          habit_beta: [
            'favor tangible, in-person customer service and physical inspection',
            'stick to conventional cash transactions and local markets',
            'exercise extreme caution regarding online data privacy',
            'cherish the warmth and camaraderie of traditional workplaces',
          ],
        },
        examples: [
          {
            en: 'Well, it primarily boils down to generational cohorts and digital literacy. On the one hand, tech-savvy millennials and Gen Z professionals tend to gravitate toward automated e-commerce and rapid delivery. On the flip side, the elderly population and traditional shoppers favor tangible, in-person customer service and physical inspection.',
            vi: 'À, điều đó chủ yếu xuất phát từ phân khúc thế hệ và mức độ am hiểu công nghệ số. Một mặt, thế hệ Gen Z và Millennials am hiểu công nghệ có xu hướng nghiêng về thương mại điện tử tự động và giao hàng siêu tốc. Mặt khác, nhóm người cao tuổi và người mua sắm truyền thống lại thích dịch vụ khách hàng trực tiếp, tận mắt nhìn thấy và sờ được sản phẩm.',
          },
        ],
      },
    ],
    highFrequencyVocab: [
      {
        term: 'boil down to',
        ipa: '/bɔɪl daʊn tuː/',
        partOfSpeech: 'phrase',
        meaningVi: 'quy tụ lại, cốt lõi là do nguyên nhân gì',
        collocationHintVi: 'Dùng đầu câu Part 3: It basically / primarily boils down to...',
        exampleSentenceEn: 'The whole debate boils down to consumer trust and data privacy.',
        exampleSentenceVi: 'Toàn bộ cuộc tranh luận cốt lõi quy về niềm tin của người tiêu dùng và quyền riêng tư dữ liệu.',
      },
      {
        term: 'gravitate toward',
        ipa: '/ˈɡræv.ə.teɪt təˈwɔːrd/',
        partOfSpeech: 'verb',
        meaningVi: 'bị thu hút, có xu hướng nghiêng về phía nào',
        collocationHintVi: 'Thường đi với danh từ: gravitate toward minimalism / digital solutions',
        exampleSentenceEn: 'Young city dwellers increasingly gravitate toward compact apartments.',
        exampleSentenceVi: 'Cư dân trẻ ở các thành phố ngày càng có xu hướng nghiêng về các căn hộ nhỏ gọn.',
      },
      {
        term: 'on the flip side',
        ipa: '/ɑːn ðə flɪp saɪd/',
        partOfSpeech: 'phrase',
        meaningVi: 'mặt khác, ở chiều ngược lại (tự nhiên hơn On the other hand)',
        collocationHintVi: 'Dùng để chuyển ý sang nhóm đối tượng đối lập',
        exampleSentenceEn: 'Online education offers immense flexibility; on the flip side, it requires high self-discipline.',
        exampleSentenceVi: 'Học trực tuyến mang lại sự linh hoạt to lớn; ở chiều ngược lại, nó đòi hỏi tính tự giác rất cao.',
      },
      {
        term: 'inclined to',
        ipa: '/ɪnˈklaɪnd tuː/',
        partOfSpeech: 'adj',
        meaningVi: 'có thiên hướng, có chiều hướng làm gì',
        collocationHintVi: 'Cụm phổ biến: be more inclined to choose / opt for',
        exampleSentenceEn: 'Retirees are naturally more inclined to seek quiet suburban neighbourhoods.',
        exampleSentenceVi: 'Những người nghỉ hưu tự nhiên sẽ có thiên hướng tìm kiếm các khu dân cư ngoại ô yên tĩnh hơn.',
      },
    ],
  },

  stage3GuidedDialogue: {
    titleVi: 'Thực hành hội thoại: Trả lời câu hỏi IELTS Part 3 bằng kỹ thuật phân khúc đối tượng',
    contextVi:
      'Giám khảo hỏi câu hỏi thảo luận xã hội: "Do you think people in modern society prefer living in large metropolitan cities or in tranquil rural towns?" Bạn áp dụng kỹ thuật chia nhóm thế hệ và mục tiêu cuộc sống.',
    frameworkType: 'concession-debate',
    frameworkData: {
      topic: 'Urban vs Rural Living Preferences',
      strategy: 'Generational and Career-Stage Segmentation',
    },
    turns: [
      {
        speaker: 'Examiner',
        en: 'Do you think people in your country generally prefer living in big cities, or do they still prefer rural life?',
        vi: 'Bạn có nghĩ rằng người dân ở đất nước bạn nhìn chung thích sống ở các thành phố lớn hơn, hay họ vẫn chuộng cuộc sống nông thôn?',
        coreKeywords: ['prefer', 'big cities', 'rural life'],
      },
      {
        speaker: 'Candidate',
        en: 'Well, to be fair, I do not believe there is a one-size-fits-all answer. It primarily boils down to generational differences and career stages.',
        vi: 'Vâng, để công bằng mà nói, tôi không tin rằng có một câu trả lời duy nhất cho tất cả mọi người. Điều này chủ yếu quy về sự khác biệt giữa các thế hệ và từng giai đoạn nghề nghiệp.',
        coreKeywords: ['one-size-fits-all', 'boils down to', 'generational differences', 'career stages'],
        suggestedStartersVi: [
          'Well, it primarily boils down to...',
          'I would argue that it depends heavily on...',
        ],
      },
      {
        speaker: 'Examiner',
        en: 'Could you elaborate on how those generational differences play out in practice?',
        vi: 'Bạn có thể nói rõ hơn về việc sự khác biệt giữa các thế hệ này diễn ra trên thực tế như thế nào không?',
        coreKeywords: ['elaborate', 'differences', 'play out'],
      },
      {
        speaker: 'Candidate',
        en: 'On the one hand, young professionals and college graduates are naturally drawn to bustling metropolitan hubs. This is largely because big cities offer superior career progression, vibrant networking opportunities, and diverse entertainment options.',
        vi: 'Một mặt, những người trẻ đi làm và sinh viên mới tốt nghiệp đương nhiên bị thu hút bởi các đô thị sầm uất. Điều này phần lớn là vì các thành phố lớn mang lại cơ hội thăng tiến nghề nghiệp vượt trội, môi trường kết nối sôi động và các lựa chọn giải trí phong phú.',
        coreKeywords: ['drawn to', 'metropolitan hubs', 'career progression', 'networking opportunities'],
        suggestedStartersVi: [
          'On the one hand, younger demographics tend to...',
          'From the perspective of ambitious youths...',
        ],
      },
      {
        speaker: 'Examiner',
        en: 'And what about older citizens or families with children?',
        vi: 'Thế còn nhóm công dân lớn tuổi hoặc các gia đình có con nhỏ thì sao?',
        coreKeywords: ['older citizens', 'families with children'],
      },
      {
        speaker: 'Candidate',
        en: 'On the flip side, senior citizens and retirees are overwhelmingly more inclined to choose rural or coastal towns. For them, escaping urban gridlock, breathing fresh air, and enjoying a peaceful community far outweigh the fast-paced allure of skyscrapers.',
        vi: 'Ở chiều ngược lại, những công dân lớn tuổi và người nghỉ hưu lại có thiên hướng rõ rệt là lựa chọn các thị trấn nông thôn hoặc miền duyên hải. Đối với họ, việc thoát khỏi cảnh kẹt xe đô thị, hít thở không khí trong lành và tận hưởng cộng đồng bình yên vượt xa sức quyến rũ vội vã của các tòa nhà chọc trời.',
        coreKeywords: ['on the flip side', 'senior citizens', 'inclined to choose', 'urban gridlock', 'far outweigh'],
        suggestedStartersVi: [
          'On the flip side, older generations...',
          'Conversely, when it comes to retirees...',
        ],
      },
    ],
  },

  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Bật phản xạ phân khúc đối tượng Part 3',
    promptVi:
      'Trả lời câu hỏi Part 3 bằng cách phân loại đối tượng: "Điều đó chủ yếu bắt nguồn từ sự khác biệt thế hệ. Một mặt, giới trẻ ưa chuộng công nghệ; mặt khác, người lớn tuổi lại thích sự tiếp xúc trực tiếp."',
    promptQuestionEn:
      'Why do people have differing attitudes toward modern consumer habits?',
    targetSentence:
      'It primarily boils down to generational differences where younger cohorts embrace technology while older demographics prefer in-person interactions.',
    targetMeaningVi:
      'Điều đó cốt lõi bắt nguồn từ sự khác biệt giữa các thế hệ, khi mà nhóm người trẻ nhiệt tình đón nhận công nghệ trong khi các nhóm nhân khẩu lớn tuổi lại thích những tương tác trực tiếp bằng da bằng thịt.',
    instructionsVi:
      'Nhấn trọng âm rõ ràng vào các từ học thuật: "primarily boils down to", "generational differences", "younger cohorts", "older demographics". SafeHarbor tính điểm dựa trên độ chính xác của từ khóa và độ trôi chảy.',
    targetReflexLatencyMs: 3000,
    minimumPassingScore: 75,
    coreKeywords: [
      'primarily',
      'boils down',
      'generational',
      'differences',
      'cohorts',
      'technology',
      'demographics',
      'in-person',
    ],
    acceptableVariations: [
      'It primarily boils down to generational differences where younger cohorts embrace technology while older people prefer in-person interactions.',
      'Well, it primarily boils down to generational differences, as younger demographics prefer digital options while older generations value in-person interactions.',
      'It basically boils down to generational differences: younger cohorts gravitate toward technology, whereas older demographics prefer in-person interactions.',
    ],
  },
};
