/**
 * LingoPro Speaking Curriculum - Phase 2: Elementary (A2-B1 / 3.0-5.0 IELTS)
 * Lesson P2-L03: Cooking & Traditional Cuisine
 * File: src/data/speaking/curriculum/phase-2-elementary/p2-l03-cooking-cuisine.ts
 *
 * Dedicated Culinary Module based on Research Report § IV:
 * - Kitchen Appliances: stove, oven, blender, air-fryer, non-stick pan, cutting board
 * - Cooking Methods: simmer, stir-fry, roast, bake, steam, sauté, deep-fry
 * - Ingredients & Seasonings: minced garlic, olive oil, fish sauce, soy sauce, black pepper, herbs
 * - Sensory Taste Adjectives: crispy, savoury, tangy, tender, aromatic, rich
 * - Recipe Narration Discourse: First, Then, After that, Finally
 */

import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p2L03Lesson: SpeakingCurriculumLesson = {
  id: 'p2-l03-cooking-cuisine',
  phaseId: 'phase-2-elementary',
  order: 3,
  titleEn: 'Cooking & Traditional Cuisine',
  titleVi: 'Nghệ thuật nấu ăn & Ẩm thực truyền thống',
  cefrLevel: 'A2',
  targetBandIelts: '3.5-4.5',
  estimatedMinutes: 30,
  summaryVi:
    'Làm chủ vốn từ chuyên sâu về thiết bị nhà bếp (blender, oven, air-fryer, stove), phương pháp chế biến (simmer, stir-fry, roast, bake, steam), tính từ vị giác đa giác quan (crispy, savoury, tangy, tender) và khung diễn ngôn hướng dẫn công thức món ăn (First, Then, After that, Finally).',
  category: 'travel_culinary',
  learningObjectivesVi: [
    'Gọi tên và miêu tả chính xác công năng các thiết bị bếp hiện đại: air-fryer, oven, blender, gas stove, non-stick pan.',
    'Sử dụng chuẩn xác 5 phương pháp nấu nướng cốt lõi: simmer (om/kho nhỏ lửa), stir-fry (xào nhanh), roast (quay), bake (nướng bánh), steam (hấp cách thủy).',
    'Ứng dụng bộ 4 tính từ vị giác đắt giá: crispy on the outside (giòn rụm bên ngoài), tender on the inside (mềm mọng bên trong), savoury (đậm đà vừa miệng), tangy (chua thanh sảng khoái).',
    'Thuyết trình quy trình nấu một món ăn hoàn chỉnh dài 2 phút với chuỗi liên từ: To prepare -> First -> Then -> After that -> Finally.',
  ],

  // ── Stage 1: Phonetics Drill ───────────────────────────────────────────────
  stage1Phonetics: {
    titleVi: 'Cặp phụ âm môi-răng /f/ vs /v/ & Nguyên âm ngắn /ʌ/ trong Ẩm thực',
    focusSound: '/f/ vs /v/ & /ʌ/ - Âm môi-răng và nguyên âm họng trong từ vựng ẩm thực',
    vietnameseContrastiveTip:
      'Người Việt hay đọc âm /v/ tiếng Anh thành "d" hoặc "v" bẹt không cắn răng, và đọc "oven" (/ˈʌv.ən/) thành "o-ven". Hãy nhớ: cả hai âm /f/ và /v/ đều đặt răng cửa hàm trên chạm nhẹ vào lòng môi dưới. Điểm khác biệt duy nhất: /f/ chỉ thổi hơi ma sát (voiceless), còn /v/ phải rung mạnh dây thanh quản (voiced). Với âm /ʌ/ trong "oven", "butter", "crust", thả lỏng hàm dưới và phát âm từ sâu trong cổ họng.',
    category: 'vowel-contrast',
    mouthTipVi:
      'Chạm mép răng trên vào 1/3 phía trong môi dưới. Phát âm "fry" rồi chuyển sang rung môi "vinegar". Phát âm "oven" bằng cách mở miệng tự nhiên như âm "á" ngắn, không tròn môi.',
    minimalPairs: [
      {
        wordA: 'fry',
        ipaA: '/fraɪ/',
        wordB: 'vie',
        ipaB: '/vaɪ/',
        meaningA: 'chiên, rán (âm /f/ xì hơi)',
        meaningB: 'ganh đua (âm /v/ rung thanh quản)',
        distinctionVi: 'fry chỉ xì hơi không rung cổ, vie rung thanh quản rõ rệt.',
      },
      {
        wordA: 'safe',
        ipaA: '/seɪf/',
        wordB: 'save',
        ipaB: '/seɪv/',
        meaningA: 'an toàn (đuôi /f/)',
        meaningB: 'tiết kiệm / bảo quản (đuôi /v/)',
        distinctionVi: 'save giữ rung nhẹ ở cuối từ, tạo sự êm ái khi nối âm.',
      },
      {
        wordA: 'leaf',
        ipaA: '/liːf/',
        wordB: 'leave',
        ipaB: '/liːv/',
        meaningA: 'chiếc lá (lá thơm thảo mộc)',
        meaningB: 'rời khỏi / để nguyên',
        distinctionVi: 'leaf kết thúc bằng /f/ sắc nét, leave kết thúc bằng /v/ trầm ấm.',
      },
      {
        wordA: 'fan',
        ipaA: '/fæn/',
        wordB: 'van',
        ipaB: '/væn/',
        meaningA: 'chiếc quạt gió',
        meaningB: 'xe tải chở hàng',
        distinctionVi: 'fan xì hơi môi răng, van rung thanh quản ngay từ đầu.',
      },
    ],
    practiceSentences: [
      {
        sentence: 'Bake the marinated chicken in the oven until the skin is savoury and crispy.',
        phoneticTarget: 'beɪk ðə ˈmerɪneɪtɪd ˈtʃɪkɪn ɪn ðiː ˈʌvn ənˈtɪl ðə skɪn ɪz ˈseɪvəri ənd ˈkrɪspi',
        vietnameseTranslation: 'Nướng gà đã tẩm ướp trong lò nướng cho đến khi lớp da đậm đà và giòn rụm.',
      },
      {
        sentence: 'First, heat up the stove and stir-fry the vegetables with minced garlic.',
        phoneticTarget: 'fɜːrst, hiːt ʌp ðə stoʊv ənd ˈstɜːr fraɪ ðə ˈvedʒtəblz wɪð mɪnst ˈɡɑːrlɪk',
        vietnameseTranslation: 'Trước hết, bật bếp lên và xào rau củ với tỏi băm nhuyễn.',
      },
      {
        sentence: 'Put the herbs into the blender to create a rich and tangy sauce.',
        phoneticTarget: 'pʊt ðiː ɜːrbz ˈɪntə ðə ˈblendər tuː kriˈeɪt‿ə rɪtʃ ənd ˈtæŋi sɔːs',
        vietnameseTranslation: 'Cho các loại thảo mộc vào máy xay sinh tố để tạo nên một loại sốt sánh quyện và chua thanh.',
      },
    ],
  },

  // ── Stage 2: Core Patterns & Lexical Chunks ────────────────────────────────
  stage2CorePatterns: {
    titleVi: 'Cấu trúc thuyết minh công thức món ăn & Cụm từ vựng ẩm thực',
    vietnameseGrammarRule:
      'Khi hướng dẫn một công thức nấu ăn bằng tiếng Anh (Recipe Discourse), ta dùng các câu mệnh lệnh (Imperative sentences) kết hợp với chuỗi liên từ chuyển tiếp quy trình: "To prepare this dish..." -> "First, [verb]..." -> "Then, [verb]..." -> "After that, [verb]..." -> "Finally, [verb]...". Chú ý sử dụng các tính từ cảm quan (sensory adjectives) để miêu tả mùi vị và kết cấu của món ăn nhằm gây ấn tượng mạnh với người nghe.',
    formula:
      'To prepare [Dish], first you [action + ingredients]. Then, you [cooking method + appliance]. After that, you [simmer/seasoning]. Finally, you [garnish & serve hot].',
    legoSlots: [
      {
        template:
          'To prepare this delicious {dish_name}, first you have to {prep_step}. Then, place it into the {appliance} and {cook_method} for {cooking_time}. After that, {sauce_action} to make it {sensory_flavor}. Finally, garnish with {garnish} and serve it hot.',
        slots: {
          dish_name: [
            'crispy roasted chicken wings',
            'traditional stir-fried beef noodles',
            'steamed seabass with ginger',
            'caramelized pork belly',
          ],
          prep_step: [
            'marinate the meat with fish sauce, black pepper, and minced garlic for 20 minutes',
            'finely slice the fresh vegetables on the wooden cutting board',
            'blend the herbs and chili in the blender to make a tangy dipping sauce',
            'wash the herbs thoroughly and season the fillets with sea salt and olive oil',
          ],
          appliance: [
            'air-fryer at 180 degrees Celsius',
            'preheated oven for even roasting',
            'non-stick pan over a medium gas stove',
            'bamboo steamer placed over boiling water',
          ],
          cook_method: [
            'bake until golden brown',
            'stir-fry rapidly until fragrant',
            'steam gently for 15 minutes',
            'simmer slowly on low heat',
          ],
          cooking_time: [
            'about 15 to 20 minutes',
            'roughly 8 minutes until tender',
            'around 25 minutes until the juices run clear',
            'just 10 minutes to preserve the crispiness',
          ],
          sauce_action: [
            'brush on a layer of honey glaze',
            'toss in the rich savoury oyster sauce',
            'drizzle a splash of tangy lime dressing',
            'pour over the aromatic garlic butter',
          ],
          sensory_flavor: [
            'crispy on the outside yet extremely tender on the inside',
            'wonderfully savoury with an irresistible aroma',
            'delightfully tangy and refreshing on the palate',
            'rich, juicy, and deeply satisfying',
          ],
          garnish: [
            'chopped spring onions and roasted sesame seeds',
            'fresh coriander leaves and crushed black pepper',
            'a few thin slices of red chili and lime wedges',
            'crispy fried shallots and basil leaves',
          ],
        },
        examples: [
          {
            en: 'To prepare this delicious crispy roasted chicken wings, first you have to marinate the meat with fish sauce, black pepper, and minced garlic for 20 minutes. Then, place it into the air-fryer at 180 degrees Celsius and bake until golden brown for about 15 to 20 minutes. After that, brush on a layer of honey glaze to make it crispy on the outside yet extremely tender on the inside. Finally, garnish with chopped spring onions and roasted sesame seeds and serve it hot.',
            vi: 'Để chuẩn bị món cánh gà nướng giòn thơm ngon này, trước hết bạn cần ướp thịt với nước mắm, tiêu đen và tỏi băm trong 20 phút. Sau đó, cho cánh gà vào nồi chiên không dầu ở nhiệt độ 180 độ C và nướng cho đến khi vàng ruộm trong khoảng 15 đến 20 phút. Sau đó, quét một lớp sốt mật ong để cánh gà giòn rụm bên ngoài nhưng lại vô cùng mềm mọng bên trong. Cuối cùng, rắc hành lá thái nhỏ và hạt vừng rang lên trang trí rồi thưởng thức khi còn nóng hổi.',
          },
          {
            en: 'To prepare this delicious traditional stir-fried beef noodles, first you have to finely slice the fresh vegetables on the wooden cutting board. Then, place it into the non-stick pan over a medium gas stove and stir-fry rapidly until fragrant for roughly 8 minutes until tender. After that, toss in the rich savoury oyster sauce to make it wonderfully savoury with an irresistible aroma. Finally, garnish with fresh coriander leaves and crushed black pepper and serve it hot.',
            vi: 'Để chế biến món phở xào bò truyền thống thơm ngon này, đầu tiên bạn phải thái mỏng rau củ tươi trên thớt gỗ. Tiếp đó, cho vào chảo chống dính trên bếp ga lửa vừa và đảo nhanh tay cho dậy mùi thơm trong khoảng 8 phút cho đến khi chín mềm. Sau đó, đảo đều cùng sốt dầu hào đậm đà để món ăn thơm ngon khó cưỡng. Cuối cùng, trang trí với rau mùi tươi và tiêu đen đập dập rồi dùng ngay khi còn nóng sốt.',
          },
        ],
      },
    ],
    highFrequencyVocab: [
      {
        term: 'air-fryer',
        ipa: '/ˈerˌfraɪ.ər/',
        partOfSpeech: 'noun',
        meaningVi: 'nồi chiên không dầu',
        collocationHintVi: 'cook in an air-fryer / air-fryer settings',
        exampleSentenceEn: 'Using an air-fryer reduces the amount of cooking oil needed.',
        exampleSentenceVi: 'Sử dụng nồi chiên không dầu giúp giảm bớt lượng dầu ăn cần thiết.',
      },
      {
        term: 'blender',
        ipa: '/ˈblen.dər/',
        partOfSpeech: 'noun',
        meaningVi: 'máy xay sinh tố',
        collocationHintVi: 'high-speed blender / blend in a blender',
        exampleSentenceEn: 'She tossed the herbs and garlic into the blender to whip up a smooth purée.',
        exampleSentenceVi: 'Cô ấy cho rau thơm và tỏi vào máy xay để làm một hỗn hợp sốt mịn màng.',
      },
      {
        term: 'oven',
        ipa: '/ˈʌv.ən/',
        partOfSpeech: 'noun',
        meaningVi: 'lò nướng',
        collocationHintVi: 'preheat the oven / bake in the oven',
        exampleSentenceEn: 'Preheat the oven to 200 degrees before putting the tray inside.',
        exampleSentenceVi: 'Làm nóng lò nướng trước ở mức 200 độ trước khi đặt khay vào trong.',
      },
      {
        term: 'stove',
        ipa: '/stoʊv/',
        partOfSpeech: 'noun',
        meaningVi: 'bếp đun (bếp ga / bếp từ)',
        collocationHintVi: 'gas stove / induction stove / turn off the stove',
        exampleSentenceEn: 'Never leave the hot pan unattended on the stove.',
        exampleSentenceVi: 'Đừng bao giờ để chảo nóng trên bếp mà không có người trông chừng.',
      },
      {
        term: 'simmer',
        ipa: '/ˈsɪm.ər/',
        partOfSpeech: 'verb',
        meaningVi: 'ninh nhỏ lửa, om liu riu',
        collocationHintVi: 'simmer on low heat / simmer gently',
        exampleSentenceEn: 'Let the broth simmer gently for three hours to extract maximum flavor.',
        exampleSentenceVi: 'Hãy để nước dùng sôi liu riu trong 3 giờ để chiết xuất trọn vẹn hương vị.',
      },
      {
        term: 'stir-fry',
        ipa: '/ˈstɜːr.fraɪ/',
        partOfSpeech: 'verb',
        meaningVi: 'xào nhanh tay trên lửa lớn',
        collocationHintVi: 'stir-fry vegetables / stir-fry with garlic',
        exampleSentenceEn: 'Stir-fry the marinated beef with bell peppers for just three minutes.',
        exampleSentenceVi: 'Xào nhanh thịt bò đã ướp với ớt chuông trong vỏn vẹn ba phút.',
      },
      {
        term: 'crispy',
        ipa: '/ˈkrɪs.pi/',
        partOfSpeech: 'adj',
        meaningVi: 'giòn rụm (kết cấu vỏ bánh, da gà rán)',
        collocationHintVi: 'crispy skin / crispy crust / golden and crispy',
        exampleSentenceEn: 'The spring rolls were fried to perfection, golden and wonderfully crispy.',
        exampleSentenceVi: 'Món nem rán được chiên hoàn hảo, vàng ươm và giòn tan tuyệt vời.',
      },
      {
        term: 'savoury',
        ipa: '/ˈseɪ.vər.i/',
        partOfSpeech: 'adj',
        meaningVi: 'đậm đà vừa miệng, thơm ngon chuẩn vị mặn',
        collocationHintVi: 'savoury dish / savoury aroma / savoury pastry',
        exampleSentenceEn: 'Fish sauce gives this dipping sauce an authentic savoury taste.',
        exampleSentenceVi: 'Nước mắm mang lại cho bát nước chấm này vị đậm đà chuẩn phong vị truyền thống.',
      },
      {
        term: 'tangy',
        ipa: '/ˈtæŋ.i/',
        partOfSpeech: 'adj',
        meaningVi: 'chua thanh sảng khoái (vị chanh, giấm, me)',
        collocationHintVi: 'tangy flavor / tangy dressing / tangy citrus note',
        exampleSentenceEn: 'A squeeze of fresh lime juice adds a delightfully tangy kick.',
        exampleSentenceVi: 'Một chút nước cốt chanh tươi mang lại vị chua thanh sảng khoái thú vị.',
      },
      {
        term: 'tender',
        ipa: '/ˈten.dər/',
        partOfSpeech: 'adj',
        meaningVi: 'mềm mọng, tan trong miệng (thịt, rau củ)',
        collocationHintVi: 'tender meat / juicy and tender / tender on the inside',
        exampleSentenceEn: 'Slow cooking makes the beef shank exceptionally tender.',
        exampleSentenceVi: 'Nấu chậm giúp cho phần bắp bò trở nên mềm mọng đặc biệt.',
      },
    ],
  },

  // ── Stage 3: Guided Dialogue ───────────────────────────────────────────────
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại tương tác: Hướng dẫn công thức nấu món ăn tủ',
    contextVi:
      'Một người bạn quốc tế (Partner) muốn học cách làm món gà nướng mật ong bằng nồi chiên không dầu. Học viên (Learner) giải thích các bước tỉ mỉ sử dụng liên từ quy trình và tính từ vị giác.',
    frameworkType: 'prep',
    turns: [
      {
        speaker: 'Partner',
        en: 'Hey! That chicken dish you cooked yesterday looked sensational. What kitchen appliances did you use?',
        vi: 'Này! Món gà bạn làm hôm qua trông hấp dẫn quá chừng. Bạn đã sử dụng những thiết bị bếp nào vậy?',
        coreKeywords: ['chicken dish', 'sensational', 'kitchen appliances'],
      },
      {
        speaker: 'Learner',
        en: 'Thank you! I mainly used an air-fryer and my regular stove, along with a sharp knife and a cutting board.',
        vi: 'Cảm ơn bạn nhé! Mình chủ yếu dùng một chiếc nồi chiên không dầu và bếp thường, cùng với một con dao sắc và thớt gỗ.',
        coreKeywords: ['air-fryer', 'stove', 'cutting board'],
        suggestedStartersVi: ['Thank you! I mainly used...'],
      },
      {
        speaker: 'Partner',
        en: 'How did you manage to make the skin so crispy while keeping the meat juicy?',
        vi: 'Làm thế nào bạn làm cho lớp da giòn rụm như vậy trong khi phần thịt vẫn mềm mọng?',
        coreKeywords: ['skin so crispy', 'meat juicy'],
      },
      {
        speaker: 'Learner',
        en: 'Well, first you marinate the chicken with minced garlic, black pepper, and fish sauce. Then, put it in the air-fryer at 180 degrees for 15 minutes.',
        vi: 'À, đầu tiên bạn ướp gà với tỏi băm, tiêu đen và nước mắm. Sau đó, cho gà vào nồi chiên không dầu ở 180 độ trong 15 phút.',
        coreKeywords: ['first you marinate', 'minced garlic', 'Then, put it in the air-fryer'],
        suggestedStartersVi: ['Well, first you marinate...', 'Then, put it in...'],
      },
      {
        speaker: 'Partner',
        en: 'What did you do after that to give it that shiny glaze?',
        vi: 'Sau đó bạn đã làm gì để tạo lớp men bóng bẩy như vậy?',
        coreKeywords: ['after that', 'shiny glaze'],
      },
      {
        speaker: 'Learner',
        en: 'After that, brush on honey and roast for another 5 minutes until crispy. Finally, garnish with sesame and fresh lime for a savoury, tangy taste.',
        vi: 'Sau đó, quét mật ong lên và nướng thêm 5 phút cho đến khi giòn tan. Cuối cùng, rắc vừng và vắt chút chanh tươi để tạo vị đậm đà, chua thanh.',
        coreKeywords: ['After that', 'roast', 'Finally, garnish', 'savoury, tangy taste'],
        suggestedStartersVi: ['After that, brush on...', 'Finally, garnish with...'],
      },
    ],
  },

  // ── Stage 4: SafeHarbor Evaluation ────────────────────────────────────────
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Hướng dẫn công thức nấu ăn 60s',
    promptVi:
      'Hãy hướng dẫn bạn của bạn làm một món ăn yêu thích sử dụng các liên từ First -> Then -> After that -> Finally, kèm tên thiết bị (air-fryer/oven/stove) và ít nhất 2 tính từ vị giác (crispy, savoury, tangy, tender).',
    promptQuestionEn: 'How do you usually cook your favorite dish at home?',
    targetSentence:
      'To prepare this dish, first I marinate the chicken with minced garlic and fish sauce. Then, I put it in the air-fryer to bake until golden. After that, I simmer a savoury sauce on the stove. Finally, I serve it with lime juice for a tangy kick, making it crispy and tender.',
    acceptableVariations: [
      'To prepare stir-fried beef, first I slice the beef and vegetables on a cutting board. Then, I heat up the stove and stir-fry the garlic until aromatic. After that, I toss in the beef with savoury oyster sauce. Finally, I garnish with black pepper and serve it steaming hot.',
      'To make roasted salmon, first I season the fillet with olive oil and herbs. Then, I place it into the preheated oven for twelve minutes. After that, I prepare a tangy lemon sauce in the blender. Finally, I pour the sauce over the fish so it stays wonderfully tender.',
    ],
    coreKeywords: [
      'first',
      'air-fryer',
      'oven',
      'stove',
      'crispy',
      'tender',
      'savoury',
      'tangy',
      'Finally',
    ],
    targetMeaningVi:
      'Để chuẩn bị món ăn này, trước hết tôi ướp gà với tỏi băm và nước mắm. Sau đó, tôi cho vào nồi chiên không dầu nướng vàng. Tiếp theo, tôi đun sốt đậm đà trên bếp. Cuối cùng, tôi dùng kèm nước cốt chanh để có vị chua thanh, tạo nên lớp ngoài giòn rụm và bên trong mềm mọng.',
    instructionsVi:
      'Phát âm chuẩn xác /f/ và /v/ trong "air-fryer", "savoury". Đảm bảo nhắc đủ chuỗi liên từ quy trình và tính từ vị giác. Đạt từ 75 điểm trở lên.',
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
  },
};
