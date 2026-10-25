import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p1L09OrderingFoodDrink: SpeakingCurriculumLesson = {
  id: 'p1-l09-ordering-food-drink',
  phaseId: 'phase-1-beginner',
  order: 9,
  titleEn: 'Ordering Food and Drinks Survival Reflexes',
  titleVi: 'Gọi đồ ăn & Thức uống sống còn (Tại quán cafe / nhà hàng)',
  cefrLevel: 'A1',
  targetBandIelts: '0-3.0',
  estimatedMinutes: 15,
  summaryVi:
    'Làm chủ cấu trúc gọi món bất biến "Can I get a... with... please?" kết hợp ngữ điệu lịch sự và các âm chặn cuối /p/, /t/, /k/ trong cup, hot, drink.',
  category: 'travel_culinary',
  slug: 'ordering-food-drink',
  learningObjectivesVi: [
    'Bật nhẹ và dứt khoát các phụ âm chặn đuôi /p/, /t/, /k/ trong các từ gọi món thông dụng.',
    'Sử dụng ngữ điệu lên giọng nhẹ lịch sự ở từ "please" khi đưa ra yêu cầu gọi món.',
    'Làm chủ khung câu gọi món bất biến có tùy biến đường, đá, sữa trong dưới 1 giây.',
    'Đạt điểm SafeHarbor từ 75% trở lên với đầy đủ các từ khóa gọi món then chốt.',
  ],
  stage1Phonetics: {
    titleVi: 'Khởi động cơ miệng: Phụ âm chặn đuôi /p/, /t/, /k/ & Ngữ điệu lịch sự',
    focusSound: 'Final Stop Consonants /p/, /t/, /k/ & Rising Politeness Intonation',
    vietnameseContrastiveTip:
      'Người Việt thường có thói quen nuốt phụ âm đuôi hoặc hạ giọng trầm cụt lủn khi gọi món khiến câu nói nghe như ra lệnh thô lỗ. Trong tiếng Anh chuẩn:\n1. Các âm chặn cuối như /p/ (trong cup), /t/ (trong hot), /k/ (trong drink, cake) cần giữ hơi trong khoang miệng 0.1 giây rồi nhả nhẹ.\n2. Khi kết thúc câu đề nghị với từ "please", hãy nâng nhẹ cao độ giọng (lên giọng ↗) để thể hiện thái độ tôn trọng, thân thiện với nhân viên phục vụ.',
    category: 'ending-consonants',
    phonemes: ['/p/', '/t/', '/k/'],
    mouthTipVi:
      'Khi nói "cup": khép hai môi lại chặn luồng hơi rồi nhả khẽ; khi nói "hot": đầu lưỡi áp lên chân răng trên chặn luồng hơi; khi nói "please": mỉm cười và nhấc bổng giọng lên nửa tông.',
    video: {
      youtubeVideoId: 'wXq5k9eR6e8',
      channelName: "Rachel's English",
      startSeconds: 25,
      endSeconds: 95,
      title: "Stop Consonants P, T, K - Rachel's English",
      mouthTipSummaryVi:
        'Quan sát cách luồng hơi bị chặn lại một tích tắc trong khoang miệng trước khi nhả nhẹ ra ngoài.',
    },
    targetPracticeWords: [
      { word: 'cup', ipa: '/kʌp/', meaningVi: 'chiếc tách, ly nhỏ' },
      { word: 'hot', ipa: '/hɒt/', meaningVi: 'nóng bức, ấm nóng' },
      { word: 'drink', ipa: '/drɪŋk/', meaningVi: 'thức uống' },
      { word: 'cake', ipa: '/keɪk/', meaningVi: 'bánh ngọt' },
      { word: 'sugar', ipa: '/ˈʃʊɡə(r)/', meaningVi: 'đường ăn' },
      { word: 'please', ipa: '/pliːz/', meaningVi: 'vui lòng, làm ơn' },
    ],
    minimalPairs: [
      {
        wordA: 'cup',
        ipaA: '/kʌp/',
        meaningA: 'tách uống nước',
        wordB: 'cut',
        ipaB: '/kʌt/',
        meaningB: 'cắt gọt',
        distinctionVi: 'chặn hơi ở môi /p/ vs chặn hơi ở đầu lưỡi /t/',
      },
      {
        wordA: 'hot',
        ipaA: '/hɒt/',
        meaningA: 'nóng',
        wordB: 'hop',
        ipaB: '/hɒp/',
        meaningB: 'nhảy lò cò',
        distinctionVi: 'chặn đầu lưỡi trên /t/ vs khép chặt hai mép môi /p/',
      },
      {
        wordA: 'bake',
        ipaA: '/beɪk/',
        meaningA: 'nướng bánh',
        wordB: 'bait',
        ipaB: '/beɪt/',
        meaningB: 'mồi câu',
        distinctionVi: 'chặn hơi ở cuống họng /k/ vs chặn ở chân răng /t/',
      },
      {
        wordA: 'coke',
        ipaA: '/kəʊk/',
        meaningA: 'nước ngọt coca',
        wordB: 'coat',
        ipaB: '/kəʊt/',
        meaningB: 'áo khoác',
        distinctionVi: 'âm bật cuống lưỡi /k/ vs âm bật đầu lưỡi /t/',
      },
    ],
    practiceSentences: [
      {
        sentence: 'Can I get a cup of hot coffee, please?',
        phoneticTarget: '/p/, /t/, /k/, rising intonation',
        vietnameseTranslation: 'Cho tôi xin một tách cà phê nóng được không ạ?',
      },
      {
        sentence: 'I would like a cold drink and a sweet cake.',
        phoneticTarget: '/k/, /t/',
        vietnameseTranslation: 'Tôi muốn một món đồ uống lạnh và một chiếc bánh ngọt.',
      },
      {
        sentence: 'Could you please add less ice to this cup?',
        phoneticTarget: '/k/, /p/',
        vietnameseTranslation: 'Bạn có thể cho ít đá hơn vào chiếc ly này được không?',
      },
    ],
  },
  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: Gọi món bất biến chuẩn người bản xứ',
    vietnameseGrammarRule:
      'Trong văn hóa giao tiếp quốc tế, người bản xứ hiếm khi dùng câu thô cứng "I want...". Hãy dùng khung câu lịch sự đúc sẵn: "Can I get a/an + [tên món] + with + [tùy chọn đường/đá/sữa], please?". Động từ "get" được giữ nguyên mẫu bất biến.',
    formula: 'Can I get an/a {beverage/food} with {customization}, please?',
    overviewVi:
      'Cấu trúc này cực kỳ thông dụng và được chấp nhận ở 100% quán cafe, nhà hàng thức ăn nhanh hay khách sạn quốc tế.',
    highFrequencyVocab: [
      {
        term: 'iced',
        ipa: '/aɪst/',
        partOfSpeech: 'adj',
        meaningVi: 'có đá lạnh',
        collocationHintVi: 'iced coffee / iced tea (cà phê đá / trà đá)',
        exampleSentenceEn: 'Iced coffee is very popular in Vietnam.',
        exampleSentenceVi: 'Cà phê đá rất phổ biến ở Việt Nam.',
      },
      {
        term: 'sugar',
        ipa: '/ˈʃʊɡə(r)/',
        partOfSpeech: 'noun',
        meaningVi: 'đường',
        collocationHintVi: 'less sugar / no sugar (ít đường / không đường)',
        exampleSentenceEn: 'Please make my drink with less sugar.',
        exampleSentenceVi: 'Làm ơn pha đồ uống của tôi với ít đường.',
      },
      {
        term: 'total',
        ipa: '/ˈtəʊtl/',
        partOfSpeech: 'noun',
        meaningVi: 'tổng cộng, toàn bộ',
        collocationHintVi: 'how much in total (tổng cộng bao nhiêu tiền)',
        exampleSentenceEn: 'What is the total price of my order?',
        exampleSentenceVi: 'Tổng giá đơn hàng của tôi là bao nhiêu?',
      },
      {
        term: 'takeaway',
        ipa: '/ˈteɪkəweɪ/',
        partOfSpeech: 'noun',
        meaningVi: 'mang đi (take away)',
        collocationHintVi: 'for here or takeaway (dùng tại đây hay mang về)',
        exampleSentenceEn: 'I would like this drink for takeaway.',
        exampleSentenceVi: 'Tôi muốn lấy đồ uống này mang về.',
      },
    ],
    legoSlots: [
      {
        template: 'Can I get an {drink} with {option}, please?',
        slots: {
          drink: ['iced coffee', 'iced green tea', 'iced latte', 'iced chocolate'],
          option: ['less sugar', 'no sugar', 'extra milk', 'less ice'],
        },
        examples: [
          {
            en: 'Can I get an iced coffee with less sugar, please?',
            vi: 'Cho tôi một ly cà phê đá ít đường được không ạ?',
          },
          {
            en: 'Can I get an iced green tea with no sugar, please?',
            vi: 'Cho tôi một ly trà xanh đá không đường được không ạ?',
          },
        ],
      },
      {
        template: 'Could I have a {food} and a bottle of {beverage}, please?',
        slots: {
          food: ['croissant', 'sandwich', 'slice of cake'],
          beverage: ['mineral water', 'orange juice', 'cold milk'],
        },
        examples: [
          {
            en: 'Could I have a sandwich and a bottle of mineral water, please?',
            vi: 'Cho tôi một chiếc bánh mì kẹp và một chai nước khoáng được không ạ?',
          },
          {
            en: 'Could I have a croissant and a bottle of orange juice, please?',
            vi: 'Cho tôi một chiếc bánh sừng bò và một chai nước cam được không ạ?',
          },
        ],
      },
    ],
  },
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại dẫn dắt: Gọi đồ uống tại quầy cà phê quốc tế',
    contextVi:
      'Bạn bước vào một quầy cà phê ở sân bay quốc tế. Nhân viên pha chế (Barista) niềm nở chào đón bạn và nhận đơn gọi đồ.',
    frameworkType: '3-beat',
    turns: [
      {
        speaker: 'Partner',
        en: 'Hi there! Welcome to Coffee House. What can I get started for you today?',
        vi: 'Xin chào! Chào mừng quý khách đến với Coffee House. Hôm nay tôi có thể phục vụ món gì cho bạn ạ?',
        coreKeywords: ['welcome', 'coffee', 'house', 'started', 'today'],
      },
      {
        speaker: 'Learner',
        en: 'Hi! Can I get an iced coffee with less sugar, please?',
        vi: 'Xin chào! Cho tôi xin một ly cà phê đá ít đường được không ạ?',
        coreKeywords: ['can', 'get', 'iced', 'coffee', 'less', 'sugar', 'please'],
        suggestedStartersVi: ['Hi! Can I get an...', 'Good morning, can I have...'],
      },
      {
        speaker: 'Partner',
        en: 'Sure thing! What size would you prefer: small, medium, or large?',
        vi: 'Dạ được chứ ạ! Bạn muốn chọn kích cỡ nào: nhỏ, vừa hay lớn?',
        coreKeywords: ['size', 'prefer', 'small', 'medium', 'large'],
      },
      {
        speaker: 'Learner',
        en: 'A medium cup, please. And could you put less ice as well?',
        vi: 'Một ly cỡ vừa nhé. Và bạn có thể cho ít đá luôn được không?',
        coreKeywords: ['medium', 'cup', 'please', 'less', 'ice'],
        suggestedStartersVi: ['A medium cup...', 'Medium size, please...'],
      },
      {
        speaker: 'Partner',
        en: 'Certainly. Is that for here or to go?',
        vi: 'Dạ chắc chắn rồi. Bạn dùng tại đây hay mang đi ạ?',
        coreKeywords: ['certainly', 'here', 'go'],
      },
      {
        speaker: 'Learner',
        en: 'It is for takeaway. How much is that in total?',
        vi: 'Cho tôi mang đi nhé. Tổng cộng hết bao nhiêu tiền vậy ạ?',
        coreKeywords: ['takeaway', 'how', 'much', 'total'],
        suggestedStartersVi: ['For takeaway, please...', 'To go, how much...'],
      },
    ],
  },
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Gọi món cà phê lịch sự',
    promptVi:
      'Hãy đóng vai khách hàng và nói câu gọi một ly cà phê đá ít đường thật lịch sự trong vòng 1.5 giây.',
    promptQuestionEn: 'How do you politely order an iced coffee beverage with reduced sugar?',
    targetSentence: 'Can I get an iced coffee with less sugar, please?',
    targetMeaningVi: 'Cho tôi xin một ly cà phê đá ít đường được không ạ?',
    acceptableVariations: [
      'Could I get an iced coffee with less sugar, please?',
      'Can I have an iced coffee with less sugar, please?',
      'I would like an iced coffee with less sugar, please.',
    ],
    coreKeywords: ['can', 'get', 'iced', 'coffee', 'less', 'sugar', 'please'],
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
    instructionsVi:
      'Hãy lên giọng nhẹ ở từ "please" cuối câu. SafeHarbor tập trung kiểm tra sự hiện diện của các từ khóa "iced coffee", "less sugar", "please".',
  },
};
