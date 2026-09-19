/**
 * LingoPro Speaking Curriculum - Phase 2: Elementary (A2-B1 / 3.0-5.0 IELTS)
 * Lesson P2-L05: Comparison & Contrast with Adjectives
 * File: src/data/speaking/curriculum/phase-2-elementary/p2-l05-comparison-contrast-adjectives.ts
 */

import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p2L05Lesson: SpeakingCurriculumLesson = {
  id: 'p2-l05-comparison-contrast-adjectives',
  phaseId: 'phase-2-elementary',
  order: 5,
  titleEn: 'Comparison & Contrast with Adjectives',
  titleVi: 'So sánh & Đối chiếu các lựa chọn cuộc sống (Hơn, Nhất & Ngang bằng)',
  cefrLevel: 'A2',
  targetBandIelts: '3.5-4.5',
  estimatedMinutes: 25,
  summaryVi:
    'Làm chủ các mẫu câu so sánh hơn kèm từ tăng tiến (far more... than), so sánh không ngang bằng (not nearly as... as) và so sánh nhất để cân đo đong đếm giữa mua sắm online vs truyền thống, cuộc sống thành thị vs nông thôn.',
  category: 'daily_life',
  learningObjectivesVi: [
    'Sử dụng chính xác các cấp độ so sánh: So sánh hơn tính từ ngắn/dài (-er than vs more than), so sánh ngang bằng (as... as), và so sánh nhất (the most / -est).',
    'Nâng cấp câu so sánh bằng các phó từ chỉ mức độ tự nhiên: far more, substantially, slightly, not nearly as.',
    'Làm chủ trọng âm từ trong các tính từ đa âm tiết phổ biến: con-VEN-ient, af-FORD-a-ble, ex-PEN-sive.',
    'Thực hiện bài tranh biện hoặc so sánh hai lựa chọn đời sống dài 60-90 giây có cấu trúc cân bằng.',
  ],

  // ── Stage 1: Phonetics Drill ───────────────────────────────────────────────
  stage1Phonetics: {
    titleVi: 'Trọng âm từ tính từ đa âm tiết & Đuôi so sánh /-ər/',
    focusSound: '/-ər/ & Trọng âm âm tiết thứ hai trong tính từ miêu tả',
    vietnameseContrastiveTip:
      'Khi phát âm đuôi so sánh "-er" (/ər/), người Việt hay quên uốn lưỡi nhẹ, biến "faster" thành "phát-tơ" cụt lủn. Đồng thời, các tính từ dài thường bị đánh sai trọng âm (vd: "convenient" phải nhấn vào âm thứ 2 "VEEN" /kənˈviː.ni.ənt/, không đọc đều các âm). Chú ý hạ giọng ở các âm không mang trọng âm.',
    category: 'stress-linking',
    mouthTipVi:
      'Với đuôi /-ər/, phát âm âm schwa rồi cong nhẹ đầu lưỡi về phía sau vòm họng. Với từ "convenient", phóng to âm lượng và kéo dài âm /viː/, lướt nhanh hai âm /kən/ và /ni.ənt/.',
    minimalPairs: [
      {
        wordA: 'cheaper',
        ipaA: '/ˈtʃiː.pər/',
        wordB: 'deeper',
        ipaB: '/ˈdiː.pər/',
        meaningA: 'rẻ hơn',
        meaningB: 'sâu hơn',
        distinctionVi: 'cheaper bắt đầu bằng âm bật hơi /tʃ/, deeper bằng âm /d/ rung.',
      },
      {
        wordA: 'faster',
        ipaA: '/ˈfæs.tər/',
        wordB: 'factor',
        ipaB: '/ˈfæk.tər/',
        meaningA: 'nhanh hơn',
        meaningB: 'yếu tố, nhân tố',
        distinctionVi: 'faster có âm xì /s/, factor có âm chặn họng /k/.',
      },
      {
        wordA: 'healthier',
        ipaA: '/ˈhel.θi.ər/',
        wordB: 'wealthier',
        ipaB: '/ˈwel.θi.ər/',
        meaningA: 'lành mạnh hơn',
        meaningB: 'giàu có hơn',
        distinctionVi: 'healthier bắt đầu bằng /h/, wealthier bắt đầu bằng /w/. Cả hai đều có /θ/ đặt lưỡi giữa răng.',
      },
      {
        wordA: 'safer',
        ipaA: '/ˈseɪ.fər/',
        wordB: 'savor',
        ipaB: '/ˈseɪ.vər/',
        meaningA: 'an toàn hơn (đuôi /fər/)',
        meaningB: 'thưởng thức trọn vẹn (đuôi /vər/)',
        distinctionVi: 'safer có âm /f/ vô thanh, savor có âm /v/ hữu thanh.',
      },
    ],
    practiceSentences: [
      {
        sentence: 'Online shopping is far more convenient than visiting crowded malls.',
        phoneticTarget: 'ˈɑːnlaɪn ˈʃɑːpɪŋ ɪz fɑːr mɔːr kənˈviːniənt ðən ˈvɪzɪtɪŋ ˈkraʊdɪd mɔːlz',
        vietnameseTranslation: 'Mua sắm trực tuyến tiện lợi hơn nhiều so với việc đi đến các trung tâm thương mại đông đúc.',
      },
      {
        sentence: 'Fresh vegetables at the local market are substantially healthier and cheaper.',
        phoneticTarget: 'freʃ ˈvedʒtəblz ət ðə ˈloʊkl ˈmɑːrkɪt ɑːr səbˈstænʃəli ˈhelθiər ənd ˈtʃiːpər',
        vietnameseTranslation: 'Rau tươi ở chợ địa phương tốt cho sức khỏe và rẻ hơn đáng kể.',
      },
      {
        sentence: 'Public transport is not nearly as fast as riding a personal scooter.',
        phoneticTarget: 'ˈpʌblɪk ˈtrænspɔːrt ɪz nɑːt ˈnɪrli æz fæst æz ˈraɪdɪŋ‿ə ˈpɜːrsənl ˈskuːtər',
        vietnameseTranslation: 'Phương tiện công cộng thì không nhanh bằng việc đi xe tay ga cá nhân.',
      },
    ],
  },

  // ── Stage 2: Core Patterns & Lexical Chunks ────────────────────────────────
  stage2CorePatterns: {
    titleVi: 'Cấu trúc so sánh đa chiều & Phó từ định lượng',
    vietnameseGrammarRule:
      'Để bài nói đạt band điểm cao, không chỉ dùng "more than" đơn giản mà hãy thêm các phó từ chỉ cường độ: 1) "Far more / substantially + adj" (Nhiều hơn hẳn). 2) "Slightly / a bit + adj-er" (Hơn một chút). 3) "Not nearly as + adj + as" (Còn lâu mới bằng / kém xa). 4) "By far the most + adj" (Bỏ xa các đối tượng khác, tuyệt đối nhất). Kết cấu này tạo ra sắc thái lập luận tinh tế.',
    formula:
      '[Option A] is far more [Adjective] than [Option B]. Although [Option B] is [Merit], it is not nearly as [Key Feature] as [Option A]. Overall, [Option A] is by far the most [Superlative] choice.',
    legoSlots: [
      {
        template:
          'When comparing {subject_a} and {subject_b}, I definitely prefer {subject_a}. First of all, it is far more {adjective_1} than {subject_b}. Although {subject_b} can be {adjective_2}, it is simply not nearly as {adjective_3} as {subject_a}. Therefore, {subject_a} is by far the most {superlative_trait} option for me.',
        slots: {
          subject_a: [
            'shopping on e-commerce platforms',
            'living in a peaceful suburban town',
            'commuting by modern electric metro',
            'cooking fresh meals at home',
          ],
          subject_b: [
            'browsing traditional brick-and-mortar stores',
            'renting an expensive apartment in the city center',
            'driving a motorbike through heavy traffic jams',
            'eating out at fast food chains every day',
          ],
          adjective_1: [
            'convenient and time-saving',
            'tranquil and cost-effective',
            'comfortable and eco-friendly',
            'nutritious and hygienic',
          ],
          adjective_2: [
            'engaging because you can touch physical goods',
            'exciting with endless nightlife activities',
            'flexible for spontaneous short trips',
            'convenient when you are in a rush',
          ],
          adjective_3: [
            'affordable and hassle-free',
            'relaxing and spacious',
            'safe and stress-free',
            'wholesome and budget-friendly',
          ],
          superlative_trait: [
            'practical and economical',
            'sustainable and fulfilling',
            'reliable and pleasant',
            'health-conscious and rewarding',
          ],
        },
        examples: [
          {
            en: 'When comparing shopping on e-commerce platforms and browsing traditional brick-and-mortar stores, I definitely prefer shopping on e-commerce platforms. First of all, it is far more convenient and time-saving than browsing traditional brick-and-mortar stores. Although browsing traditional brick-and-mortar stores can be engaging because you can touch physical goods, it is simply not nearly as affordable and hassle-free as shopping on e-commerce platforms. Therefore, shopping on e-commerce platforms is by far the most practical and economical option for me.',
            vi: 'Khi so sánh việc mua sắm trên các sàn thương mại điện tử và đi xem đồ ở các cửa hàng truyền thống, tôi chắc chắn thích mua sắm online hơn. Trước hết, nó tiện lợi và tiết kiệm thời gian hơn nhiều so với việc đi lượn các cửa hàng. Mặc dù mua trực tiếp cũng thú vị vì được sờ tận tay sản phẩm, nhưng nó không hề tiết kiệm và thảnh thơi bằng mua sắm online. Vì thế, mua online là lựa chọn thiết thực và kinh tế nhất đối với tôi.',
          },
          {
            en: 'When comparing living in a peaceful suburban town and renting an expensive apartment in the city center, I definitely prefer living in a peaceful suburban town. First of all, it is far more tranquil and cost-effective than renting an expensive apartment in the city center. Although renting an expensive apartment in the city center can be exciting with endless nightlife activities, it is simply not nearly as relaxing and spacious as living in a peaceful suburban town. Therefore, living in a peaceful suburban town is by far the most sustainable and fulfilling option for me.',
            vi: 'Khi so sánh việc sống ở một thị trấn ngoại ô thanh bình và thuê căn hộ đắt đỏ ở trung tâm thành phố, tôi chắc chắn chuộng sống ở ngoại ô hơn. Đầu tiên, nơi đó yên bình và tiết kiệm chi phí hơn hẳn so với trung tâm. Mặc dù căn hộ trung tâm có thể thú vị với các hoạt động giải trí về đêm vô tận, nhưng nó không thể thư thái và rộng rãi bằng vùng ngoại ô. Do đó, ngoại ô là lựa chọn bền vững và trọn vẹn nhất cho tôi.',
          },
        ],
      },
    ],
    highFrequencyVocab: [
      {
        term: 'convenient',
        ipa: '/kənˈviː.ni.ənt/',
        partOfSpeech: 'adj',
        meaningVi: 'tiện lợi, thuận tiện',
        collocationHintVi: 'highly convenient / far more convenient / convenient location',
        exampleSentenceEn: 'Having a grocery store right downstairs is extremely convenient.',
        exampleSentenceVi: 'Có một cửa hàng tạp hóa ngay dưới chân nhà là điều vô cùng tiện lợi.',
      },
      {
        term: 'cost-effective',
        ipa: '/ˌkɑːst.ɪˈfek.tɪv/',
        partOfSpeech: 'adj',
        meaningVi: 'hiệu quả về chi phí, sinh lời tốt so với số tiền bỏ ra',
        collocationHintVi: 'cost-effective solution / highly cost-effective',
        exampleSentenceEn: 'Cooking in bulk at home is substantially more cost-effective than dining out.',
        exampleSentenceVi: 'Nấu ăn số lượng lớn tại nhà tiết kiệm chi phí hơn đáng kể so với ăn ngoài quán.',
      },
      {
        term: 'hassle-free',
        ipa: '/ˈhæs.əl friː/',
        partOfSpeech: 'adj',
        meaningVi: 'không rắc rối, thảnh thơi, dễ dàng',
        collocationHintVi: 'hassle-free experience / hassle-free return policy',
        exampleSentenceEn: 'The app provides a hassle-free checkout process with one click.',
        exampleSentenceVi: 'Ứng dụng mang lại quy trình thanh toán không phiền toái chỉ với một cú chạm.',
      },
      {
        term: 'time-consuming',
        ipa: '/ˈtaɪm kənˌsuː.mɪŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'tốn nhiều thời gian, mất thì giờ',
        collocationHintVi: 'laborious and time-consuming / time-consuming task',
        exampleSentenceEn: 'Commuting two hours every day is terribly time-consuming.',
        exampleSentenceVi: 'Việc đi lại hai tiếng mỗi ngày vô cùng tốn thời gian.',
      },
    ],
  },

  // ── Stage 3: Guided Dialogue ───────────────────────────────────────────────
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại tương tác: Mua sắm Online vs Chợ truyền thống',
    contextVi:
      'Hai người bạn (Partner và Learner) đang bàn luận về thói quen mua sắm cuối tuần. Learner sử dụng các cấu trúc so sánh tinh tế để bảo vệ quan điểm của mình.',
    frameworkType: 'prep',
    turns: [
      {
        speaker: 'Partner',
        en: 'Do you prefer shopping online or going to physical retail stores?',
        vi: 'Bạn thích mua sắm trên mạng hay đến các cửa hàng bán lẻ truyền thống hơn?',
        coreKeywords: ['shopping online', 'physical stores'],
      },
      {
        speaker: 'Learner',
        en: 'To be honest, I find online shopping far more convenient because it saves me hours of travel.',
        vi: 'Thực lòng mà nói, tôi thấy mua hàng online tiện lợi hơn nhiều vì nó giúp tôi tiết kiệm hàng giờ đi lại.',
        coreKeywords: ['far more convenient', 'saves hours of travel'],
        suggestedStartersVi: ['To be honest, I find... far more...'],
      },
      {
        speaker: 'Partner',
        en: 'But what about checking product quality? Do you not worry about poor materials?',
        vi: 'Nhưng còn việc kiểm tra chất lượng sản phẩm thì sao? Bạn không lo về chất liệu kém à?',
        coreKeywords: ['product quality', 'poor materials'],
      },
      {
        speaker: 'Learner',
        en: 'While physical stores are slightly better for touching fabrics, they are not nearly as cheap as online deals.',
        vi: 'Dù các cửa hàng thực tế tốt hơn một chút về mặt sờ tận tay chất vải, nhưng chúng không rẻ bằng các ưu đãi trên mạng.',
        coreKeywords: ['slightly better', 'not nearly as cheap as'],
        suggestedStartersVi: ['While physical stores are slightly...', 'they are not nearly as...'],
      },
      {
        speaker: 'Partner',
        en: 'That is true, discounts online are massive. What about returning defective items?',
        vi: 'Đúng thật, giảm giá trên mạng rất khủng. Thế còn việc đổi trả hàng lỗi thì sao?',
        coreKeywords: ['discounts', 'returning defective items'],
      },
      {
        speaker: 'Learner',
        en: 'Nowadays, reputable platforms have hassle-free return policies. Overall, online platforms are by far the most practical choice.',
        vi: 'Ngày nay các sàn uy tín đều có chính sách đổi trả rất thảnh thơi. Nhìn chung, các nền tảng online là lựa chọn thực tế nhất.',
        coreKeywords: ['hassle-free return policies', 'by far the most practical choice'],
        suggestedStartersVi: ['Nowadays, reputable platforms...', 'Overall, it is by far the most...'],
      },
    ],
  },

  // ── Stage 4: SafeHarbor Evaluation ────────────────────────────────────────
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: So sánh đối chiếu hai sự lựa chọn',
    promptVi:
      'So sánh hai phương thức mua sắm (Online vs Tại cửa hàng) hoặc hai nơi chốn (Thành phố vs Nông thôn), sử dụng ít nhất: "far more... than", "not nearly as... as", và "by far the most...".',
    promptQuestionEn: 'Which do you think is better: shopping online or shopping in traditional markets?',
    targetSentence:
      'In my opinion, online shopping is far more convenient than visiting traditional stores. Even though physical shops are slightly more interactive, they are not nearly as cost-effective as online marketplaces. Therefore, online shopping is by far the most practical choice for busy people.',
    acceptableVariations: [
      'I believe living in a suburb is far more peaceful than staying in the city center. Although downtown is slightly more vibrant, it is not nearly as affordable as suburban neighborhoods. That is why suburban living is by far the most sensible option for young families.',
      'Using the subway is far more efficient than riding a scooter in rush hour. While motorbikes are a bit more flexible, they are not nearly as safe as the train. Hence, the metro is by far the most reliable mode of transport.',
    ],
    coreKeywords: [
      'far more',
      'convenient',
      'not nearly as',
      'cost-effective',
      'by far the most',
      'practical',
    ],
    targetMeaningVi:
      'Theo quan điểm của tôi, mua sắm trực tuyến tiện lợi hơn nhiều so với việc đến các cửa hàng truyền thống. Mặc dù các cửa hàng trực tiếp có tính tương tác cao hơn một chút, nhưng chúng không hề tiết kiệm chi phí bằng các sàn thương mại online. Vì vậy, mua sắm online là lựa chọn thiết thực nhất cho người bận rộn.',
    instructionsVi:
      'Nhấn chuẩn trọng âm các từ "con-VEN-ient", "cost-ef-FEC-tive", "PRAC-ti-cal". Trả lời đầy đủ 3 cấu trúc so sánh trong vòng 50 giây, đạt tối thiểu 75 điểm.',
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
  },
};
