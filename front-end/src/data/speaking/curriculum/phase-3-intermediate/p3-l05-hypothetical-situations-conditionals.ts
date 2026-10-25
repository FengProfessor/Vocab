import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p3L05HypotheticalSituationsConditionals: SpeakingCurriculumLesson = {
  id: 'p3-l05-hypothetical-situations-conditionals',
  phaseId: 'phase-3-intermediate',
  order: 5,
  titleEn: 'Hypothetical Scenarios & Advanced Conditionals',
  titleVi: 'Tình Huống Giả Định & Hệ Thống Câu Điều Kiện Đảo Ngữ Nâng Cao',
  cefrLevel: 'B2',
  targetBandIelts: '5.0-6.5',
  estimatedMinutes: 25,
  slug: 'hypothetical-situations-conditionals',
  category: 'academic_debate',
  summaryVi:
    'Chinh phục tiêu chí Grammatical Range Band 6.5-7.0+ với hệ thống câu điều kiện giả định loại 2, loại 3 và đặc biệt là cấu trúc đảo ngữ học thuật: "Were it not for...", "Had we acted earlier...".',
  learningObjectivesVi: [
    'Thành thạo câu điều kiện loại 2 (giả định hiện tại/tương lai) và loại 3 (tiếc nuối quá khứ)',
    'Làm chủ cấu trúc đảo ngữ bỏ "If" (Inversion: "Had I...", "Were it not for...") để nâng band ngữ pháp',
    'Luyện tập phát âm nuốt âm rút gọn tự nhiên "would have" (/ˈwʊd.əv/) trong văn nói',
    'Vượt qua bài kiểm tra SafeHarbor phân tích giả định về chính sách môi trường đô thị',
  ],

  stage1Phonetics: {
    titleVi: 'Khởi động khẩu hình: Rút gọn trợ động từ quá khứ (Contractions in Past Modals)',
    focusSound: 'Weak Forms of Modals: "Would have" -> /wʊdəv/, "Could have" -> /kʊdəv/',
    category: 'stress-linking',
    descriptionVi:
      'Trong văn nói tự nhiên của người bản xứ khi dùng câu điều kiện quá khứ, cụm "would have" không bao giờ đọc tách rời /wʊd hæv/. Thay vào đó, "have" bị suy giảm thành dạng yếu (weak form) /əv/ và nối liền với "would" thành /ˈwʊd.əv/ hoặc /ˈwʊdə/.',
    mouthTipVi:
      'Để phát âm /ˈwʊd.əv/, môi tròn nhẹ ở âm /w/, hạ lưỡi bật âm /d/ rồi chuyển ngay sang âm schwa /ə/ và khép nhẹ môi dưới vào răng cửa trên cho âm /v/.',
    vietnameseContrastiveTip:
      'Người Việt hay đọc tách bạch từng từ "út - he - vờ" làm câu nói bị giật cục và mất tự nhiên. Hãy tập lướt nhanh /wʊdəv/ hoặc /kʊdəv/ như một từ đơn có 2 âm tiết với trọng âm rơi vào âm tiết đầu.',
    phonemes: ['/ˈwʊd.əv/', '/ˈkʊd.əv/', '/ˌhaɪ.pəˈθet̬.ɪ.kəl/', '/ɪnˈvɜːr.ʒən/'],
    video: {
      youtubeVideoId: 'U_i2qM5aR_4',
      channelName: "Rachel's English",
      startSeconds: 35,
      endSeconds: 155,
      title: 'How to Pronounce WOULD HAVE / WOULD OF in Conversational English',
      mouthTipSummaryVi:
        'Luyện phát âm yếu "would have" thành /ˈwʊdəv/ để câu điều kiện loại 3 trở nên trôi chảy và tự nhiên.',
    },
    minimalPairs: [
      {
        wordA: 'were',
        wordB: 'where',
        ipaA: '/wɜːr/',
        ipaB: '/wer/',
        meaningA: 'thì, là (quá khứ số nhiều/bàng thái cách)',
        meaningB: 'ở đâu (từ để hỏi)',
        distinctionVi:
          'Từ "were" phát âm với nguyên âm dài giữa /ɜːr/ (môi tròn nhẹ, kéo lưỡi về sau); "where" phát âm với nguyên âm mở /er/.',
      },
      {
        wordA: 'would',
        wordB: 'wood',
        ipaA: '/wʊd/',
        ipaB: '/wʊd/',
        meaningA: 'sẽ (trợ động từ giả định)',
        meaningB: 'gỗ, rừng cây',
        distinctionVi:
          'Hai từ này là từ đồng âm (homophones) hoàn toàn; phát âm với âm /w/ chu môi và nguyên âm ngắn /ʊ/.',
      },
      {
        wordA: 'had',
        wordB: 'hard',
        ipaA: '/hæd/',
        ipaB: '/hɑːrd/',
        meaningA: 'đã có / trợ động từ đảo ngữ',
        meaningB: 'khó khăn / cứng rắn',
        distinctionVi:
          'Từ "had" dùng âm bẹt hạ hàm /æ/; trong khi "hard" dùng âm mở sâu vòm họng /ɑːr/.',
      },
    ],
    practiceSentences: [
      {
        sentence:
          'If the government invested heavily in green transit, / commuters would experience far less stress.',
        phoneticTarget: 'Nhấn mạnh động từ quá khứ "invested" và cụm "far less stress"',
        vietnameseTranslation:
          'Nếu chính phủ đầu tư mạnh mẽ vào giao thông xanh, người đi làm sẽ ít chịu áp lực căng thẳng hơn nhiều.',
      },
      {
        sentence:
          'Had earlier generations taken climate warnings seriously, / we would not have faced such extreme wildfires.',
        phoneticTarget: 'Đảo ngữ "Had earlier generations..." và rút gọn "would not have" -> /wʊdnt əv/',
        vietnameseTranslation:
          'Nếu các thế hệ trước xem trọng những cảnh báo về khí hậu, chúng ta đã không phải đối mặt với những vụ cháy rừng khắc nghiệt đến vậy.',
      },
      {
        sentence:
          'Were it not for strict copyright laws, / digital piracy would completely destroy the creative arts.',
        phoneticTarget: 'Nối âm đảo ngữ "Were it not for" /wɜːr ɪt nɑːt fɔːr/',
        vietnameseTranslation:
          'Nếu không nhờ có luật bản quyền nghiêm ngặt, nạn vi phạm bản quyền kỹ thuật số sẽ hủy hoại hoàn toàn nền nghệ thuật sáng tạo.',
      },
    ],
    targetPracticeWords: [
      { word: 'were it not for', ipa: '/wɜːr ɪt nɑːt fɔːr/', meaningVi: 'nếu không vì / nếu không nhờ có' },
      { word: 'would have', ipa: '/ˈwʊd.əv/', meaningVi: 'đã có thể đã (trong giả định quá khứ)' },
      { word: 'hypothetical', ipa: '/ˌhaɪ.pəˈθet̬.ɪ.kəl/', meaningVi: 'mang tính giả thuyết, giả định' },
      { word: 'inversion', ipa: '/ɪnˈvɜːr.ʒən/', meaningVi: 'hiện tượng đảo ngữ' },
    ],
  },

  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: Giả định & Đảo ngữ học thuật (Advanced Conditional Frames)',
    vietnameseGrammarRule:
      'Trong IELTS Speaking Part 3, sử dụng đảo ngữ (Inversion) là một trong những cách nhanh nhất để giám khảo ghi nhận cấu trúc ngữ pháp phức tạp (Complex Structures). Thay vì nói "If the government had intervened...", hãy nói "Had the government intervened...". Khi muốn diễn đạt "Nếu không nhờ có...", thay vì "If there weren\'t...", hãy nói "Were it not for [Noun Phrase]...".',
    formula:
      'Pattern 1 (Type 2 Inversion): Were it not for {Factor}, {Subject} would {Consequence}. -> Pattern 2 (Type 3 Inversion): Had {Actor} taken {Action}, {Past_Consequence} would not have occurred.',
    overviewVi:
      'Các cấu trúc này thể hiện năng lực lập luận logic cao cấp khi phân tích các giả thuyết lịch sử hoặc tương lai xã hội.',
    legoSlots: [
      {
        template:
          'Were it not for {protective_measure}, {vulnerable_group} would inevitably suffer from {severe_repercussion}.',
        slots: {
          protective_measure: [
            'rigorous governmental consumer safety regulations',
            'robust digital data encryption protocols',
            'timely emergency relief initiatives',
            'progressive public health vaccination campaigns',
          ],
          vulnerable_group: [
            'unsuspecting online consumers',
            'underprivileged marginalized communities',
            'struggling small business enterprises',
            'young school children in rural areas',
          ],
          severe_repercussion: [
            'rampant financial fraud and identity theft',
            'extreme nutritional deficiencies and educational disruption',
            'uncontrollable epidemic outbreaks and social instability',
            'predatory commercial exploitation',
          ],
        },
        examples: [
          {
            en: 'Were it not for rigorous governmental consumer safety regulations, unsuspecting online consumers would inevitably suffer from rampant financial fraud and identity theft.',
            vi: 'Nếu không nhờ có các quy định an toàn người tiêu dùng chặt chẽ của chính phủ, những người tiêu dùng trực tuyến nhẹ dạ cả tin chắc chắn sẽ phải hứng chịu vấn nạn lừa đảo tài chính và đánh cắp danh tính tràn lan.',
          },
        ],
      },
      {
        template:
          'Had {decision_makers} prioritized {preventive_strategy} earlier, society would not have witnessed such {adverse_outcome}.',
        slots: {
          decision_makers: [
            'urban planners and municipal authorities',
            'tech executives and policy regulators',
            'educational leaders and syllabus developers',
            'environmental task forces',
          ],
          preventive_strategy: [
            'comprehensive public transit modernization',
            'ethical algorithmic transparency standards',
            'practical mental health literacy in schools',
            'sustainable reforestation projects',
          ],
          adverse_outcome: [
            'catastrophic daily traffic paralysis',
            'pervasive political polarization and online toxicity',
            'alarming rates of adolescent anxiety and burnout',
            'irreversible local ecosystem collapse',
          ],
        },
        examples: [
          {
            en: 'Had urban planners and municipal authorities prioritized comprehensive public transit modernization earlier, society would not have witnessed such catastrophic daily traffic paralysis.',
            vi: 'Nếu như các nhà quy hoạch đô thị và chính quyền thành phố ưu tiên hiện đại hóa giao thông công cộng toàn diện sớm hơn, xã hội đã không phải chứng kiến tình trạng tê liệt giao thông thảm họa hàng ngày như hiện nay.',
          },
        ],
      },
    ],
    highFrequencyVocab: [
      {
        term: 'were it not for',
        ipa: '/wɜːr ɪt nɑːt fɔːr/',
        partOfSpeech: 'phrase',
        meaningVi: 'nếu không vì / nếu không có sự hiện diện của điều gì',
        collocationHintVi: 'Dùng đầu câu: Were it not for X, Y would...',
        exampleSentenceEn: 'Were it not for international aid, millions would face severe famine.',
        exampleSentenceVi: 'Nếu không nhờ có viện trợ quốc tế, hàng triệu người sẽ phải đối mặt với nạn đói khủng khiếp.',
      },
      {
        term: 'inevitably',
        ipa: '/ɪnˈev.ə.t̬ə.bli/',
        partOfSpeech: 'adv',
        meaningVi: 'chắc chắn sẽ xảy ra, không thể tránh khỏi',
        collocationHintVi: 'Thường đứng trước động từ: will inevitably lead to / suffer from',
        exampleSentenceEn: 'Ignoring structural problems will inevitably trigger financial collapse.',
        exampleSentenceVi: 'Phớt lờ các vấn đề mang tính cơ cấu chắc chắn sẽ dẫn đến sự sụp đổ tài chính.',
      },
      {
        term: 'catastrophic',
        ipa: '/ˌkæt̬.əˈstrɑː.fɪk/',
        partOfSpeech: 'adj',
        meaningVi: 'mang tính thảm họa, cực kỳ tồi tệ',
        collocationHintVi: 'Đi với danh từ: catastrophic damage / loss / failure',
        exampleSentenceEn: 'Oil spills cause catastrophic damage to marine life.',
        exampleSentenceVi: 'Sự cố tràn dầu gây ra thiệt hại mang tính thảm họa đối với sinh vật biển.',
      },
      {
        term: 'pervasive',
        ipa: '/pɚˈveɪ.sɪv/',
        partOfSpeech: 'adj',
        meaningVi: 'lan tỏa khắp nơi, thâm nhập sâu rộng',
        collocationHintVi: 'Cụm thông dụng: pervasive influence / problem / culture',
        exampleSentenceEn: 'Smartphones have a pervasive presence in modern society.',
        exampleSentenceVi: 'Điện thoại thông minh có một sự hiện diện lan tỏa khắp mọi ngóc ngách trong xã hội hiện đại.',
      },
    ],
  },

  stage3GuidedDialogue: {
    titleVi: 'Thực hành hội thoại: Thảo luận giả định về biến đổi khí hậu và quy hoạch đô thị',
    contextVi:
      'Giám khảo Part 3 đặt tình huống giả định: "If you had the power to fundamentally redesign modern cities, what single policy would you implement immediately?" Bạn ứng dụng câu điều kiện loại 2 và đảo ngữ.',
    frameworkType: 'peel',
    frameworkData: {
      topic: 'Hypothetical Urban Redesign',
      conditionalStructure: 'Second Conditional + Inversion',
    },
    turns: [
      {
        speaker: 'Examiner',
        en: 'If you were appointed as the chief urban planner of a major metropolis, what radical change would you introduce to improve residents’ quality of life?',
        vi: 'Nếu bạn được bổ nhiệm làm trưởng ban quy hoạch đô thị của một siêu đô thị lớn, thay đổi mang tính bước ngoặt nào bạn sẽ áp dụng để cải thiện chất lượng sống của cư dân?',
        coreKeywords: ['appointed', 'chief urban planner', 'radical change', 'quality of life'],
      },
      {
        speaker: 'Candidate',
        en: 'If I had that decision-making authority, I would immediately pedestrianize downtown city centers and ban private combustion vehicles. If people were able to commute freely via electric light rail and cycling paths, urban air quality would improve drastically overnight.',
        vi: 'Nếu tôi nắm quyền quyết định đó, tôi sẽ ngay lập tức biến các trung tâm thành phố thành phố đi bộ và cấm các phương tiện cá nhân chạy bằng xăng. Nếu người dân có thể di chuyển thoải mái thông qua hệ thống tàu điện nhẹ và làn đường xe đạp, chất lượng không khí đô thị sẽ cải thiện vượt bậc chỉ sau một đêm.',
        coreKeywords: ['decision-making authority', 'pedestrianize', 'combustion vehicles', 'electric light rail', 'improve drastically'],
        suggestedStartersVi: [
          'If I were in that position, I would...',
          'Supposing I had the authority, my first priority would be...',
        ],
      },
      {
        speaker: 'Examiner',
        en: 'Do you think earlier generations could have prevented today’s severe traffic congestion?',
        vi: 'Bạn có nghĩ rằng các thế hệ đi trước lẽ ra đã có thể ngăn chặn được tình trạng tắc nghẽn giao thông nghiêm trọng như ngày nay không?',
        coreKeywords: ['earlier generations', 'prevented', 'traffic congestion'],
      },
      {
        speaker: 'Candidate',
        en: 'Absolutely. Had city leaders prioritized public transit infrastructure forty years ago instead of catering solely to private automobiles, our metropolis would not be grappling with such paralyzing gridlock today.',
        vi: 'Chắc chắn rồi. Nếu các nhà lãnh đạo thành phố ưu tiên hạ tầng giao thông công cộng từ 40 năm trước thay vì chỉ chiều theo xe hơi cá nhân, siêu đô thị của chúng ta ngày nay đã không phải chật vật đối phó với tình trạng kẹt xe tê liệt đến thế.',
        coreKeywords: ['Had city leaders prioritized', 'public transit', 'catering solely', 'paralyzing gridlock'],
        suggestedStartersVi: [
          'Without doubt. Had authorities invested earlier...',
          'Looking back, had they anticipated this growth...',
        ],
      },
    ],
  },

  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Bật phản xạ câu điều kiện đảo ngữ "Were it not for"',
    promptVi:
      'Nói câu điều kiện đảo ngữ: "Nếu không nhờ có các quy định nghiêm ngặt của chính phủ, người tiêu dùng sẽ phải chịu đựng tình trạng lừa đảo tài chính tràn lan."',
    promptQuestionEn:
      'Express a hypothetical dependency using advanced conditional inversion ("Were it not for...").',
    targetSentence:
      'Were it not for strict government regulations, consumers would inevitably suffer from rampant financial fraud.',
    targetMeaningVi:
      'Nếu không nhờ có các quy định nghiêm ngặt của chính phủ, người tiêu dùng chắc chắn sẽ phải hứng chịu tình trạng lừa đảo tài chính tràn lan.',
    instructionsVi:
      'Nói dứt khoát cụm đảo ngữ "Were it not for strict government regulations", sau đó nối trơn tru sang "consumers would inevitably suffer from rampant financial fraud".',
    targetReflexLatencyMs: 2500,
    minimumPassingScore: 75,
    coreKeywords: [
      'were it not for',
      'strict',
      'regulations',
      'consumers',
      'inevitably',
      'suffer',
      'rampant',
      'fraud',
    ],
    acceptableVariations: [
      'Were it not for strict governmental regulations, consumers would inevitably suffer from rampant financial fraud.',
      'Were it not for strict government rules, consumers would inevitably suffer from rampant fraud.',
      'Had it not been for strict government regulations, consumers would have suffered from rampant financial fraud.',
    ],
  },
};
