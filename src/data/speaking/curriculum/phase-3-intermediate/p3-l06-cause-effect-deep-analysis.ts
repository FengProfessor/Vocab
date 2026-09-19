import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p3L06CauseEffectDeepAnalysis: SpeakingCurriculumLesson = {
  id: 'p3-l06-cause-effect-deep-analysis',
  phaseId: 'phase-3-intermediate',
  order: 6,
  titleEn: 'Cause & Effect Deep Analysis: Cascading Repercussions',
  titleVi: 'Phân Tích Sâu Nguyên Nhân - Hệ Quả & Chuỗi Tác Động Dây Chuyền',
  cefrLevel: 'B2',
  targetBandIelts: '5.0-6.5',
  estimatedMinutes: 25,
  slug: 'cause-effect-deep-analysis',
  category: 'academic_debate',
  summaryVi:
    'Thay thế cách diễn đạt nguyên nhân - hệ quả sơ cấp (because, so, leads to) bằng hệ thống từ vựng học thuật đa tầng: Nguyên nhân gốc rễ (Root causes), Chất xúc tác (Catalytic factors) và Chuỗi hệ quả dây chuyền (Cascading downstream repercussions).',
  learningObjectivesVi: [
    'Nắm vững chuỗi liên kết nguyên nhân - hệ quả đa tầng: Root Cause -> Catalyst -> Cascading Repercussion',
    'Sử dụng các cụm học thuật: "can be traced back to", "acts as a catalyst for", "triggers a cascade of"',
    'Luyện tập phát âm trọng âm các từ phức hợp: "repercussions" /ˌriː.pərˈkʌʃ.ənz/, "catalyst" /ˈkæt̬.əl.ɪst/',
    'Hoàn thành bài kiểm tra SafeHarbor phân tích hệ quả ô nhiễm rác thải nhựa và tiêu dùng nhanh',
  ],

  stage1Phonetics: {
    titleVi: 'Khởi động khẩu hình: Trọng âm danh từ học thuật & Âm đuôi /-ʃənz/',
    focusSound: 'Stress in Causal Nouns & Sibilant Plural Ending /-ʃənz/',
    category: 'ending-consonants',
    descriptionVi:
      'Các danh từ chỉ nguyên nhân - hệ quả trong bài nói học thuật thường có đuôi -tion, -sion. Trọng âm luôn rơi vào âm tiết đứng ngay trước đuôi này. Đuôi số nhiều /-ʃənz/ đòi hỏi phát âm âm chu môi vô thanh /ʃ/ rồi rung dây thanh quản với âm /z/ ở cuối.',
    mouthTipVi:
      'Với từ "repercussions" /ˌriː.pərˈkʌʃ.ənz/, trọng âm chính rơi vào "kush" /kʌʃ/. Môi hơi chu nhẹ về phía trước, luồng hơi xì mạnh qua mặt lưỡi và kết thúc bằng âm rung /z/.',
    vietnameseContrastiveTip:
      'Người Việt hay đọc lướt đuôi "-sions" thành "sân" mà bỏ quên âm rung /z/ ở cuối, làm mất đi sự chuẩn xác học thuật. Hãy chú ý giữ luồng hơi và rung thanh quản nhẹ ở âm kết thúc.',
    phonemes: ['/ˌriː.pərˈkʌʃ.ənz/', '/ˈkæt̬.əl.ɪst/', '/ˌdɑːʊn.striːm/', '/kæsˈkeɪ.dɪŋ/'],
    video: {
      youtubeVideoId: 'V9a8i2dF_mQ',
      channelName: "Rachel's English",
      startSeconds: 60,
      endSeconds: 165,
      title: 'How to Pronounce -TION and -SION Endings Clearly',
      mouthTipSummaryVi:
        'Hạ cằm ở âm tiết trọng âm và lướt nhanh đuôi schwa /ʃənz/ với âm rung /z/ rõ nét.',
    },
    minimalPairs: [
      {
        wordA: 'cause',
        wordB: 'course',
        ipaA: '/kɔːz/',
        ipaB: '/kɔːrs/',
        meaningA: 'nguyên nhân, gây ra',
        meaningB: 'khóa học, tiến trình',
        distinctionVi:
          'Âm cuối của "cause" là âm rung hữu thanh /z/; âm cuối của "course" là âm xì vô thanh /s/.',
      },
      {
        wordA: 'effect',
        wordB: 'affect',
        ipaA: '/ɪˈfekt/',
        ipaB: '/əˈfekt/',
        meaningA: 'tác động, hệ quả (danh từ)',
        meaningB: 'ảnh hưởng đến (động từ)',
        distinctionVi:
          'Danh từ "effect" bắt đầu bằng nguyên âm /ɪ/ với miệng hơi bẹt; động từ "affect" bắt đầu bằng âm schwa trung tính /ə/.',
      },
      {
        wordA: 'catalyst',
        wordB: 'cattle',
        ipaA: '/ˈkæt̬.əl.ɪst/',
        ipaB: '/ˈkæt̬.əl/',
        meaningA: 'chất xúc tác, tác nhân thúc đẩy',
        meaningB: 'gia súc',
        distinctionVi:
          'Từ "catalyst" có 3 âm tiết với đuôi kết thúc bằng cụm phụ âm /st/; "cattle" chỉ có 2 âm tiết.',
      },
    ],
    practiceSentences: [
      {
        sentence:
          'The root cause of urban traffic can be traced back to / unchecked population centralization.',
        phoneticTarget: 'Nhấn mạnh danh từ "root cause" và cụm "traced back to"',
        vietnameseTranslation:
          'Nguyên nhân gốc rễ của giao thông đô thị có thể truy ngược về sự tập trung dân số mất kiểm soát.',
      },
      {
        sentence:
          'Uncontrolled consumerism acts as a major catalyst / for devastating environmental repercussions.',
        phoneticTarget: 'Phát âm chuẩn từ "catalyst" và đuôi số nhiều "repercussions" /-ʃənz/',
        vietnameseTranslation:
          'Chủ nghĩa tiêu dùng mất kiểm soát đóng vai trò như một chất xúc tác chính dẫn đến những hệ quả môi trường tàn khốc.',
      },
      {
        sentence:
          'This policy will inevitably trigger a cascade / of unintended downstream consequences.',
        phoneticTarget: 'Nối âm "trigger a cascade of" mượt mà không ngắt quãng',
        vietnameseTranslation:
          'Chính sách này chắc chắn sẽ kích hoạt một chuỗi những hệ lụy dây chuyền ngoài ý muốn.',
      },
    ],
    targetPracticeWords: [
      { word: 'repercussions', ipa: '/ˌriː.pərˈkʌʃ.ənz/', meaningVi: 'những hệ lụy, hậu quả dây chuyền' },
      { word: 'catalyst', ipa: '/ˈkæt̬.əl.ɪst/', meaningVi: 'chất xúc tác, nhân tố kích hoạt' },
      { word: 'can be traced back to', ipa: '/kən bi treɪst bæk tuː/', meaningVi: 'có thể truy nguyên nguồn gốc về' },
      { word: 'cascade of', ipa: '/kæsˈkeɪd əv/', meaningVi: 'một chuỗi liên hoàn dồn dập' },
    ],
  },

  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: Chuỗi liên kết nguyên nhân - hệ quả đa tầng (Causal Deep Analysis)',
    vietnameseGrammarRule:
      'Để đạt điểm cao trong IELTS Part 3, bạn không thể chỉ dừng lại ở nguyên nhân bề mặt (Immediate cause). Hãy mở rộng câu trả lời theo công thức 3 tầng: 1. Nêu nguyên nhân gốc rễ ("The root cause can be traced back to..."), 2. Chỉ ra yếu tố xúc tác ("This acts as a primary catalyst that..."), 3. Phân tích chuỗi hệ lụy lan tỏa ("...which in turn triggers a cascade of downstream repercussions").',
    formula:
      'Tầng 1 (Root Cause): The primary root cause can be traced back to {Root_Phenomenon}. -> Tầng 2 (Catalyst): This acts as a catalyst that exacerbates {Immediate_Issue}. -> Tầng 3 (Repercussion): Consequently, it triggers a cascade of downstream repercussions, such as {Cascading_Consequences}.',
    overviewVi:
      'Cấu trúc này biến một câu trả lời đơn giản thành một bài phân tích học thuật chặt chẽ, mạch lạc và giàu sức thuyết phục.',
    legoSlots: [
      {
        template:
          'The root cause of {social_issue} can be largely traced back to {systemic_driver}. This acts as a catalyst that {catalytic_action}, ultimately triggering a cascade of {downstream_effects}.',
        slots: {
          social_issue: [
            'rampant fast-fashion waste in modern society',
            'widespread digital burnout among young professionals',
            'severe housing unaffordability in major cities',
            'the alarming decline of endangered wildlife species',
          ],
          systemic_driver: [
            'hyper-consumerist advertising and artificial demand creation',
            'the blurring boundaries between professional and personal life',
            'unregulated speculative real estate investment',
            'unchecked industrial expansion and habitat destruction',
          ],
          catalytic_action: [
            'compels consumers to discard garments after minimal wears',
            'induces chronic cognitive fatigue and emotional exhaustion',
            'prices local working-class families out of downtown neighborhoods',
            'fragments fragile ecological migration corridors',
          ],
          downstream_effects: [
            'devastating environmental repercussions across global landfills',
            'severe mental health disorders and declining workplace productivity',
            'profound wealth inequality and social resentment',
            'irreversible biodiversity collapse and planetary imbalance',
          ],
        },
        examples: [
          {
            en: 'The root cause of rampant fast-fashion waste in modern society can be largely traced back to hyper-consumerist advertising and artificial demand creation. This acts as a catalyst that compels consumers to discard garments after minimal wears, ultimately triggering a cascade of devastating environmental repercussions across global landfills.',
            vi: 'Nguyên nhân gốc rễ của tình trạng rác thải thời trang nhanh tràn lan trong xã hội hiện đại phần lớn có thể truy nguyên về các chiến dịch quảng cáo kích cầu chủ nghĩa tiêu dùng cực đoan và tạo nhu cầu ảo. Điều này đóng vai trò như một chất xúc tác thúc ép người tiêu dùng vứt bỏ quần áo chỉ sau vài lần mặc, cuối cùng kích hoạt một chuỗi những hệ lụy môi trường tàn khốc tại các bãi chôn lấp rác trên toàn cầu.',
          },
        ],
      },
    ],
    highFrequencyVocab: [
      {
        term: 'traced back to',
        ipa: '/treɪst bæk tuː/',
        partOfSpeech: 'phrase',
        meaningVi: 'truy ngược nguồn gốc về, bắt nguồn từ',
        collocationHintVi: 'Dùng với bị động: can be traced back to the roots of...',
        exampleSentenceEn: 'Many modern anxieties can be traced back to excessive social media use.',
        exampleSentenceVi: 'Nhiều nỗi âu lo hiện đại có thể bắt nguồn từ việc sử dụng mạng xã hội quá mức.',
      },
      {
        term: 'catalyst',
        ipa: '/ˈkæt̬.əl.ɪst/',
        partOfSpeech: 'noun',
        meaningVi: 'chất xúc tác, yếu tố đẩy nhanh tiến trình',
        collocationHintVi: 'Cụm phổ biến: act as a catalyst for change / growth / crisis',
        exampleSentenceEn: 'The economic crisis acted as a catalyst for widespread political reforms.',
        exampleSentenceVi: 'Cuộc khủng hoảng kinh tế đã đóng vai trò như một chất xúc tác cho những cải cách chính trị sâu rộng.',
      },
      {
        term: 'exacerbate',
        ipa: '/ɪɡˈzæs.ɚ.beɪt/',
        partOfSpeech: 'verb',
        meaningVi: 'làm trầm trọng thêm, làm tồi tệ hơn',
        collocationHintVi: 'Đi với danh từ tiêu cực: exacerbate poverty / pollution / tensions',
        exampleSentenceEn: 'Drought conditions have severely exacerbated the food shortage.',
        exampleSentenceVi: 'Tình trạng hạn hán đã làm trầm trọng thêm tình trạng thiếu lương thực.',
      },
      {
        term: 'cascade of',
        ipa: '/kæsˈkeɪd əv/',
        partOfSpeech: 'phrase',
        meaningVi: 'một chuỗi phản ứng dây chuyền liên hoàn',
        collocationHintVi: 'Thường đi với danh từ: trigger a cascade of events / problems',
        exampleSentenceEn: 'The bank failure triggered a cascade of financial collapses.',
        exampleSentenceVi: 'Sự sụp đổ của ngân hàng đã kích hoạt một chuỗi những vụ phá sản tài chính liên hoàn.',
      },
    ],
  },

  stage3GuidedDialogue: {
    titleVi: 'Thực hành hội thoại: Phân tích nguyên nhân và hệ lụy của tiêu dùng nhanh (Fast Fashion)',
    contextVi:
      'Giám khảo Part 3 hỏi: "Why do you think people buy and throw away clothes so quickly nowadays, and what problems does this create?" Bạn trả lời bằng mô hình chuỗi nguyên nhân 3 tầng.',
    frameworkType: 'peel',
    frameworkData: {
      topic: 'Fast Fashion & Environmental Impact',
      chain: 'Hyper-consumerism -> Discard culture -> Landfill crisis',
    },
    turns: [
      {
        speaker: 'Examiner',
        en: 'Nowadays, many people purchase cheap garments and discard them after only a few months. What factors drive this trend, and what consequences follow?',
        vi: 'Ngày nay, rất nhiều người mua quần áo giá rẻ và vứt bỏ chúng chỉ sau vài tháng. Những yếu tố nào thúc đẩy xu hướng này, và những hệ quả nào đi kèm?',
        coreKeywords: ['cheap garments', 'discard', 'factors drive', 'consequences'],
      },
      {
        speaker: 'Candidate',
        en: 'The fundamental root cause can be traced back to aggressive targeted marketing by fast-fashion conglomerates, which manufactures an artificial sense of urgency and obsolescence.',
        vi: 'Nguyên nhân gốc rễ căn bản có thể truy nguyên về các chiến dịch tiếp thị nhắm mục tiêu ráo riết của các tập đoàn thời trang nhanh, điều đã tạo ra một cảm giác cấp bách và lỗi thời ảo tạo.',
        coreKeywords: ['fundamental root cause', 'traced back to', 'aggressive targeted marketing', 'fast-fashion conglomerates', 'obsolescence'],
        suggestedStartersVi: [
          'The primary root cause can be traced back to...',
          'At the core of this phenomenon lies...',
        ],
      },
      {
        speaker: 'Examiner',
        en: 'And how does that mental urgency transform into physical environmental damage?',
        vi: 'Và cảm giác cấp bách về mặt tâm lý đó biến thành sự tổn hại môi trường vật lý như thế nào?',
        coreKeywords: ['mental urgency', 'environmental damage'],
      },
      {
        speaker: 'Candidate',
        en: 'This constant desire for novelty acts as a powerful catalyst. Consumers treat clothes as disposable commodities, which in turn triggers a cascade of devastating downstream repercussions: overflowing landfills, microplastic pollution in our oceans, and immense carbon emissions from textile factories.',
        vi: 'Khát khao liên tục tìm kiếm sự mới mẻ này đóng vai trò như một chất xúc tác mạnh mẽ. Người tiêu dùng coi quần áo như những món hàng dùng một lần, điều này lần lượt kích hoạt một chuỗi những hệ lụy dây chuyền tàn khốc: các bãi rác quá tải, ô nhiễm vi nhựa trong các đại dương và lượng khí thải carbon khổng lồ từ các nhà máy dệt may.',
        coreKeywords: ['desire for novelty', 'powerful catalyst', 'disposable commodities', 'cascade of devastating downstream repercussions', 'landfills'],
        suggestedStartersVi: [
          'This mindset acts as a catalyst that...',
          'Consequently, this triggers a cascade of...',
        ],
      },
    ],
  },

  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Bật phản xạ chuỗi nguyên nhân - hệ quả đa tầng',
    promptVi:
      'Nói câu phân tích hệ lụy sâu sắc: "Nguyên nhân gốc rễ có thể bắt nguồn từ chủ nghĩa tiêu dùng, điều đóng vai trò như một chất xúc tác kích hoạt một chuỗi những hệ lụy môi trường nghiêm trọng."',
    promptQuestionEn:
      'Analyze the root cause and downstream effects of excessive consumer waste.',
    targetSentence:
      'The root cause can be traced back to consumerism, which acts as a catalyst triggering a cascade of severe environmental repercussions.',
    targetMeaningVi:
      'Nguyên nhân gốc rễ có thể bắt nguồn từ chủ nghĩa tiêu dùng, điều đóng vai trò như một chất xúc tác kích hoạt một chuỗi những hệ lụy môi trường nghiêm trọng.',
    instructionsVi:
      'Phát âm liền mạch cụm: "can be traced back to", "acts as a catalyst", "cascade of severe environmental repercussions".',
    targetReflexLatencyMs: 2500,
    minimumPassingScore: 75,
    coreKeywords: [
      'root cause',
      'traced back to',
      'consumerism',
      'catalyst',
      'triggering',
      'cascade',
      'environmental',
      'repercussions',
    ],
    acceptableVariations: [
      'The root cause can be traced back to excessive consumerism, which acts as a catalyst triggering a cascade of environmental repercussions.',
      'The primary root cause can be traced back to consumerism, which acts as a catalyst that triggers a cascade of severe environmental repercussions.',
      'This root cause can be traced back to modern consumerism, acting as a catalyst that triggers a cascade of severe repercussions.',
    ],
  },
};
