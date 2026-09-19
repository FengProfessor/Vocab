/**
 * LingoPro Speaking Curriculum - Phase 2: Elementary (A2-B1 / 3.0-5.0 IELTS)
 * Lesson P2-L02: Narrating Past Events with Past Simple
 * File: src/data/speaking/curriculum/phase-2-elementary/p2-l02-narrating-past-simple.ts
 */

import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p2L02Lesson: SpeakingCurriculumLesson = {
  id: 'p2-l02-narrating-past-simple',
  phaseId: 'phase-2-elementary',
  order: 2,
  titleEn: 'Narrating Past Events with Past Simple',
  titleVi: 'Kể chuyện quá khứ với thì Quá khứ đơn & Chuỗi liên từ thời gian',
  cefrLevel: 'A2',
  targetBandIelts: '3.5-4.5',
  estimatedMinutes: 25,
  summaryVi:
    'Làm chủ chuỗi liên từ thời gian và cách phát âm 3 đuôi -ed (/-t/, /-d/, /-ɪd/) cùng các động từ bất quy tắc phổ biến nhất để kể lại một chuyến đi đáng nhớ dài 1-2 phút mượt mà.',
  category: 'daily_life',
  learningObjectivesVi: [
    'Phân biệt và phát âm chuẩn xác 3 quy tắc đuôi -ed: /-t/, /-d/, và /-ɪd/ không bao giờ nhầm lẫn.',
    'Sử dụng nhuần nhuyễn 10 động từ bất quy tắc then chốt trong kể chuyện: went, bought, saw, ate, had, felt, took, met, chose, left.',
    'Tổ chức mạch kể chuyện theo 4 chặng thời gian logic: At first -> After that -> Suddenly -> In the end.',
    'Nói đoạn văn kể lại kỷ niệm du lịch hoặc sự cố bất ngờ dài 60-90 giây không bị đứt quãng.',
  ],

  // ── Stage 1: Phonetics Drill ───────────────────────────────────────────────
  stage1Phonetics: {
    titleVi: 'Quy tắc phát âm 3 đuôi -ed & Biến âm Động từ Bất Quy Tắc',
    focusSound: '/-t/ vs /-d/ vs /-ɪd/ - Đuôi thời quá khứ chuẩn xác',
    vietnameseContrastiveTip:
      'Lỗi sai phổ biến nhất của người Việt là đọc mọi đuôi "-ed" thành "ịt" hoặc nuốt hoàn toàn âm đuôi. Quy tắc vàng: 1) Nếu kết thúc bằng âm vô thanh (/p, k, f, s, ʃ, tʃ/) -> đọc là /-t/ (vd: booked /bʊkt/). 2) Nếu kết thúc bằng /t/ hoặc /d/ -> đọc là /-ɪd/ thêm 1 âm tiết (vd: decided /dɪˈsaɪ.dɪd/). 3) Các âm hữu thanh còn lại và nguyên âm -> đọc là /-d/ lướt nhẹ (vd: stayed /steɪd/).',
    category: 'ending-consonants',
    mouthTipVi:
      'Với âm /-t/, bật hơi đầu lưỡi vào chân răng trên không rung cổ họng. Với âm /-d/, bật nhẹ và rung dây thanh quản. Với âm /-ɪd/, tách rõ một âm tiết nhỏ và dứt khoát.',
    minimalPairs: [
      {
        wordA: 'walked',
        ipaA: '/wɔːkt/',
        wordB: 'wanted',
        ipaB: '/ˈwɑːn.tɪd/',
        meaningA: 'đã đi bộ (đuôi -t)',
        meaningB: 'đã muốn (đuôi -ɪd)',
        distinctionVi: 'walked bật âm /t/ dứt khoát 1 âm tiết, wanted thêm âm tiết /-tɪd/ thành 2 âm tiết.',
      },
      {
        wordA: 'stopped',
        ipaA: '/stɑːpt/',
        wordB: 'started',
        ipaB: '/ˈstɑːr.tɪd/',
        meaningA: 'đã dừng lại (đuôi -t)',
        meaningB: 'đã bắt đầu (đuôi -ɪd)',
        distinctionVi: 'stopped bật âm /t/ dứt khoát, started có đuôi /-tɪd/.',
      },
      {
        wordA: 'missed',
        ipaA: '/mɪst/',
        wordB: 'visited',
        ipaB: '/ˈvɪz.ɪ.tɪd/',
        meaningA: 'đã nhớ / đã lỡ (đuôi -t)',
        meaningB: 'đã thăm quan (đuôi -ɪd)',
        distinctionVi: 'missed là 1 âm tiết kết thúc /st/, visited có đuôi /-tɪd/ 3 âm tiết.',
      },
      {
        wordA: 'played',
        ipaA: '/pleɪd/',
        wordB: 'plated',
        ipaB: '/ˈpleɪ.tɪd/',
        meaningA: 'đã chơi (đuôi -d rung nhẹ)',
        meaningB: 'đã mạ kim loại (đuôi -ɪd)',
        distinctionVi: 'played không thêm âm tiết, plated thêm âm tiết /-tɪd/.',
      },
    ],
    practiceSentences: [
      {
        sentence: 'We booked a cozy homestay and arrived in Da Lat late at night.',
        phoneticTarget: 'wiː bʊkt‿ə ˈkoʊzi ˈhoʊmsteɪ ənd‿əˈraɪvd ɪn dɑː læt leɪt‿ət naɪt',
        vietnameseTranslation: 'Chúng tôi đã đặt một homestay ấm cúng và đến Đà Lạt vào đêm muộn.',
      },
      {
        sentence: 'She decided to explore the ancient town and visited three old pagodas.',
        phoneticTarget: 'ʃiː dɪˈsaɪdɪd tuː ɪkˈsplɔːr ðiː ˈeɪnʃənt taʊn ənd ˈvɪzɪtɪd θriː oʊld pəˈɡoʊdəz',
        vietnameseTranslation: 'Cô ấy đã quyết định khám phá phố cổ và thăm quan ba ngôi chùa cổ.',
      },
      {
        sentence: 'Suddenly, it rained heavily, so we waited inside a charming coffee shop.',
        phoneticTarget: 'ˈsʌdənli, ɪt reɪnd ˈhevɪli, soʊ wiː ˈweɪtɪd ɪnˈsaɪd‿ə ˈtʃɑːrmɪŋ ˈkɔːfi ʃɑːp',
        vietnameseTranslation: 'Bất ngờ trời mưa to, nên chúng tôi đã đợi bên trong một quán cà phê duyên dáng.',
      },
    ],
  },

  // ── Stage 2: Core Patterns & Lexical Chunks ────────────────────────────────
  stage2CorePatterns: {
    titleVi: 'Cấu trúc tường thuật chuỗi thời gian (Narrative Sequencing)',
    vietnameseGrammarRule:
      'Để bài nói kể chuyện không bị nhảy cóc ý hoặc lặp từ "and then", hãy dùng bộ 4 liên từ định vị thời gian: 1) "At first..." (Bối cảnh ban đầu) -> 2) "After that..." (Diễn biến hành động tiếp theo) -> 3) "Suddenly..." hoặc "Out of nowhere..." (Tạo điểm thắt nút / bất ngờ) -> 4) "In the end..." hoặc "Eventually..." (Cách giải quyết và kết cục). Đi kèm là các động từ quá khứ đơn đã chia chuẩn xác.',
    formula:
      'At first, [Subject + V-ed / V2]. After that, [Subject + V-ed / V2]. Suddenly, [Unexpected Event]. In the end, [Resolution & Feeling].',
    legoSlots: [
      {
        template:
          'At first, we {past_action_1}. After that, we {past_action_2}. Suddenly, {past_twist}. In the end, we {past_resolution} and felt {feeling}.',
        slots: {
          past_action_1: [
            'arrived at the beach and checked into our hotel',
            'rented motorbikes to explore the mountain pass',
            'bought tickets for an early boat tour around the bay',
            'set up our camping tent near the pine forest',
          ],
          past_action_2: [
            'enjoyed delicious grilled seafood at a local market',
            'took breathtaking photos from the mountain peak',
            'visited several ancient temples hidden in the valley',
            'swam in the crystal-clear ocean water',
          ],
          past_twist: [
            'a heavy downpour started out of nowhere and soaked our clothes',
            'one of our motorbikes got a flat tire on a deserted road',
            'I realized that I had left my phone at the restaurant',
            'dense mountain fog rolled in and we could barely see the road',
          ],
          past_resolution: [
            'found shelter at a friendly local family house who offered us hot tea',
            'pushed the bike to a nearby workshop and got it fixed within an hour',
            'rushed back to the venue and thankfully the honest waiter held it for me',
            'slowed down safely and arrived at our campsite before dusk',
          ],
          feeling: [
            'relieved and deeply grateful for the locals hospitality',
            'exhausted but proud of how we handled the situation together',
            'amazed by the unforgettable adventure',
            'cheerful that everything worked out smoothly in the end',
          ],
        },
        examples: [
          {
            en: 'At first, we rented motorbikes to explore the mountain pass. After that, we took breathtaking photos from the mountain peak. Suddenly, a heavy downpour started out of nowhere and soaked our clothes. In the end, we found shelter at a friendly local family house who offered us hot tea and felt relieved and deeply grateful for the locals hospitality.',
            vi: 'Ban đầu, chúng tôi thuê xe máy để khám phá con đèo núi. Sau đó, chúng tôi chụp những bức ảnh đẹp ngỡ ngàng từ đỉnh núi. Bất ngờ, một cơn mưa như trút nước ập đến bất thình lình làm ướt sũng quần áo chúng tôi. Cuối cùng, chúng tôi tìm được chỗ trú tại nhà một người dân địa phương tốt bụng đã mời chúng tôi trà nóng và cảm thấy nhẹ nhõm và vô cùng biết ơn lòng hiếu khách của người dân.',
          },
          {
            en: 'At first, we arrived at the beach and checked into our hotel. After that, we enjoyed delicious grilled seafood at a local market. Suddenly, I realized that I had left my phone at the restaurant. In the end, we rushed back to the venue and thankfully the honest waiter held it for me and felt cheerful that everything worked out smoothly in the end.',
            vi: 'Ban đầu, chúng tôi đến bãi biển và làm thủ tục nhận phòng khách sạn. Sau đó, chúng tôi thưởng thức hải sản nướng thơm ngon tại một khu chợ địa phương. Bất ngờ, tôi nhận ra mình đã để quên điện thoại tại quán ăn. Cuối cùng, chúng tôi vội vã quay lại quán và thật may mắn người phục vụ thật thà đã giữ giúp tôi, và chúng tôi cảm thấy rất vui vì mọi chuyện cuối cùng đều suôn sẻ.',
          },
        ],
      },
    ],
    highFrequencyVocab: [
      {
        term: 'breathtaking',
        ipa: '/ˈbreθˌteɪ.kɪŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'đẹp ngoạn mục, ngỡ ngàng, nín thở',
        collocationHintVi: 'breathtaking scenery / breathtaking view',
        exampleSentenceEn: 'The sunrise over the mountain ridge was absolutely breathtaking.',
        exampleSentenceVi: 'Cảnh bình minh trên dãy núi đẹp đến ngỡ ngàng.',
      },
      {
        term: 'itinerary',
        ipa: '/aɪˈtɪn.ə.rer.i/',
        partOfSpeech: 'noun',
        meaningVi: 'lịch trình chi tiết chuyến đi',
        collocationHintVi: 'travel itinerary / planned itinerary',
        exampleSentenceEn: 'We strictly followed our 3-day itinerary across the central province.',
        exampleSentenceVi: 'Chúng tôi tuân thủ nghiêm ngặt lịch trình 3 ngày xuyên qua tỉnh miền Trung.',
      },
      {
        term: 'local delicacy',
        ipa: '/ˈloʊ.kəl ˈdel.ə.kə.si/',
        partOfSpeech: 'noun',
        meaningVi: 'đặc sản địa phương',
        collocationHintVi: 'sample local delicacies / taste regional delicacies',
        exampleSentenceEn: 'Trying the steaming bowl of spicy noodles was my favorite local delicacy.',
        exampleSentenceVi: 'Thưởng thức tô mì cay bốc khói là món đặc sản địa phương tôi yêu thích nhất.',
      },
      {
        term: 'memorable',
        ipa: '/ˈmem.ər.ə.bəl/',
        partOfSpeech: 'adj',
        meaningVi: 'đáng nhớ, khó quên',
        collocationHintVi: 'memorable trip / memorable milestone / memorable experience',
        exampleSentenceEn: 'That road trip with my closest university friends was truly memorable.',
        exampleSentenceVi: 'Chuyến đi phượt đó cùng những người bạn đại học thân nhất thực sự rất đáng nhớ.',
      },
    ],
  },

  // ── Stage 3: Guided Dialogue ───────────────────────────────────────────────
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại tương tác: Kể về một chuyến du lịch đáng nhớ',
    contextVi:
      'Hai người bạn (Partner và Learner) gặp nhau sau kỳ nghỉ cuối tuần. Learner kể lại chuyến đi phượt vừa qua với những tình tiết bất ngờ sử dụng thì quá khứ đơn chuẩn ngữ âm.',
    frameworkType: '5w1h',
    turns: [
      {
        speaker: 'Partner',
        en: 'Hey! How was your weekend trip to the mountains? Did everything go according to plan?',
        vi: 'Này! Chuyến đi lên núi cuối tuần rồi thế nào? Mọi thứ có diễn ra đúng như kế hoạch không?',
        coreKeywords: ['weekend trip', 'mountains', 'according to plan'],
      },
      {
        speaker: 'Learner',
        en: 'Well, it was quite an adventure! At first, we set off early and enjoyed the breathtaking mountain views along the pass.',
        vi: 'Chà, thực sự là một chuyến phiêu lưu! Ban đầu, chúng mình xuất phát sớm và thưởng ngoạn cảnh quan núi non đẹp nín thở dọc theo con đèo.',
        coreKeywords: ['adventure', 'At first', 'set off', 'breathtaking views'],
        suggestedStartersVi: ['Well, it was quite an adventure! At first, we...'],
      },
      {
        speaker: 'Partner',
        en: 'That sounds amazing! Did you manage to visit that famous waterfall?',
        vi: 'Nghe tuyệt thật đấy! Các bạn có kịp đến thăm ngọn thác nổi tiếng đó không?',
        coreKeywords: ['visit', 'famous waterfall'],
      },
      {
        speaker: 'Learner',
        en: 'Yes, we did. After that, we explored the waterfall and took hundreds of scenic photos.',
        vi: 'Có chứ. Sau đó, chúng mình đã khám phá ngọn thác và chụp hàng trăm bức ảnh phong cảnh tuyệt đẹp.',
        coreKeywords: ['After that', 'explored the waterfall', 'scenic photos'],
        suggestedStartersVi: ['Yes, we did. After that, we...'],
      },
      {
        speaker: 'Partner',
        en: 'Awesome! Did anything unexpected happen on your way back?',
        vi: 'Tuyệt vời! Thế trên đường về có điều gì bất ngờ xảy ra không?',
        coreKeywords: ['unexpected happen', 'way back'],
      },
      {
        speaker: 'Learner',
        en: 'Suddenly, our motorbike broke down in the middle of nowhere! But in the end, a generous local mechanic helped us fix it for free. It was unforgettable.',
        vi: 'Bất ngờ thay, xe máy của chúng mình bị hỏng giữa đường vắng! Nhưng cuối cùng, một anh thợ sửa xe tốt bụng ở đó đã sửa giúp miễn phí. Chuyến đi thật không thể nào quên.',
        coreKeywords: ['Suddenly', 'broke down', 'in the end', 'unforgettable'],
        suggestedStartersVi: ['Suddenly, our...', 'But in the end, a...'],
      },
    ],
  },

  // ── Stage 4: SafeHarbor Evaluation ────────────────────────────────────────
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Tường thuật chuyến đi quá khứ 60s',
    promptVi:
      'Kể lại một chuyến đi hoặc một sự cố đáng nhớ trong quá khứ theo chuỗi 4 chặng: At first -> After that -> Suddenly -> In the end.',
    promptQuestionEn: 'Could you tell me about a memorable trip you took in the past?',
    targetSentence:
      'At first, we arrived at the resort and checked into our room. After that, we went swimming and tasted delicious local seafood. Suddenly, a violent thunderstorm broke out. In the end, we stayed cozy inside playing board games, which turned out to be unforgettable.',
    acceptableVariations: [
      'At first, I traveled to Da Lat with my college friends. After that, we rented motorbikes and rode through scenic passes. Suddenly, we got a flat tire on a deserted road. In the end, a kind mechanic repaired it quickly, and we felt relieved.',
      'At first, we booked a walking tour in the old town. After that, we visited historic temples. Suddenly, it started pouring rain so we ran into a café. In the end, we made friends with international travelers and had a wonderful afternoon.',
    ],
    coreKeywords: ['At first', 'After that', 'Suddenly', 'In the end'],
    targetMeaningVi:
      'Ban đầu, chúng tôi đến khu nghỉ dưỡng và nhận phòng. Sau đó, chúng tôi đi bơi và nếm thử hải sản địa phương thơm ngon. Bất ngờ, một cơn bão sấm sét dữ dội bùng phát. Cuối cùng, chúng tôi ngồi ấm cúng trong nhà chơi trò chơi cờ bàn, và điều đó lại trở thành một kỷ niệm không thể nào quên.',
    instructionsVi:
      'Phát âm rõ ràng các đuôi quá khứ -ed (/bʊkt/, /reɪnd/, /steɪd/). Giữ mạch kể liên tục trong vòng 60 giây, đạt tối thiểu 75 điểm.',
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
  },
};
