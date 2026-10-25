/**
 * LingoPro Speaking Curriculum - Phase 2: Elementary (A2-B1 / 3.0-5.0 IELTS)
 * Lesson P2-L09: Expressing Feelings, Emotions & Reactions
 * File: src/data/speaking/curriculum/phase-2-elementary/p2-l09-expressing-feelings-reactions.ts
 */

import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p2L09Lesson: SpeakingCurriculumLesson = {
  id: 'p2-l09-expressing-feelings-reactions',
  phaseId: 'phase-2-elementary',
  order: 9,
  titleEn: 'Expressing Feelings, Emotions & Reactions',
  titleVi: 'Diễn đạt cảm xúc, Phản ứng & Tính từ đuôi -ed/-ing',
  cefrLevel: 'B1',
  targetBandIelts: '4.0-5.0',
  estimatedMinutes: 25,
  summaryVi:
    'Làm chủ sự phân biệt bản chất giữa tính từ đuôi -ing (bản chất sự việc gây ra) và đuôi -ed (cảm xúc của người trải nghiệm), đồng thời vận dụng ngôn ngữ giao tiếp lịch thiệp nhưng kiên quyết để xử lý sự cố dịch vụ.',
  category: 'workplace',
  learningObjectivesVi: [
    'Phân biệt tuyệt đối cách dùng cặp tính từ phân từ: -ing chỉ tính chất của hoàn cảnh (frustrating, exhausting) vs -ed chỉ tâm trạng con người (frustrated, exhausted).',
    'Phát âm chuẩn xác đuôi /-ɪŋ/ và /-ɪd/ không bị nuốt âm hay lẫn lộn.',
    'Làm chủ mẫu câu khiếu nại văn minh (Polite Assertion): "To be frank, I was rather dissatisfied with... Could you please look into this matter?".',
    'Trình bày một bài nói 60 giây tường thuật cảm xúc cá nhân khi gặp sự cố và cách giải quyết thỏa đáng.',
  ],

  // ── Stage 1: Phonetics Drill ───────────────────────────────────────────────
  stage1Phonetics: {
    titleVi: 'Phát âm đuôi Phân từ /-ɪŋ/ vs /-ɪd/ & Ngữ điệu nhã nhặn nhưng cương quyết',
    focusSound: '/-ɪŋ/ vs /-ɪd/ & Ngữ điệu khẳng định lịch thiệp (Polite Cadence)',
    vietnameseContrastiveTip:
      'Người Việt hay nhầm lẫn tai hại khi nói "I am very boring" (Tôi là người nhàm chán) thay vì "I am bored" (Tôi cảm thấy buồn chán). Về phát âm, đuôi "-ing" (/ɪŋ/) phải đẩy hơi lên khoang mũi nhẹ nhàng, còn đuôi "-ed" sau /t/ hoặc /d/ phải phát âm thành /-ɪd/ tách riêng một âm tiết rõ ràng.',
    category: 'ending-consonants',
    mouthTipVi:
      'Với đuôi /-ɪŋ/, nâng cuống lưỡi chạm vòm họng mềm, đẩy luồng hơi thoát ra đằng mũi. Với đuôi /-ɪd/, bật nhẹ đầu lưỡi ở chân răng trên và mở nhẹ khóe miệng.',
    minimalPairs: [
      {
        wordA: 'frustrating',
        ipaA: '/ˈfrʌs.treɪ.tɪŋ/',
        wordB: 'frustrated',
        ipaB: '/ˈfrʌs.treɪ.tɪd/',
        meaningA: 'gây ức chế, bực bội (bản chất sự việc)',
        meaningB: 'cảm thấy bực bội, nản lòng (tâm trạng)',
        distinctionVi: 'frustrating kết thúc bằng âm mũi /-tɪŋ/, frustrated kết thúc bằng âm bật /-tɪd/.',
      },
      {
        wordA: 'disappointing',
        ipaA: '/ˌdɪs.əˈpɔɪn.tɪŋ/',
        wordB: 'disappointed',
        ipaB: '/ˌdɪs.əˈpɔɪn.tɪd/',
        meaningA: 'gây thất vọng (hoàn cảnh)',
        meaningB: 'cảm thấy thất vọng (con người)',
        distinctionVi: 'disappointing diễn tả tính chất của dịch vụ, disappointed diễn tả cảm giác của khách hàng.',
      },
      {
        wordA: 'exhausting',
        ipaA: '/ɪɡˈzɑː.stɪŋ/',
        wordB: 'exhausted',
        ipaB: '/ɪɡˈzɑː.stɪd/',
        meaningA: 'làm kiệt sức (công việc)',
        meaningB: 'bị kiệt sức (bản thân)',
        distinctionVi: 'exhausting có trọng âm rơi vào âm tiết thứ hai, đuôi mũi /ɪŋ/.',
      },
      {
        wordA: 'thrilling',
        ipaA: '/ˈθrɪl.ɪŋ/',
        wordB: 'thrilled',
        ipaB: '/θrɪld/',
        meaningA: 'ly kỳ, hồi hộp hấp dẫn',
        meaningB: 'vô cùng phấn khích, mừng rỡ',
        distinctionVi: 'thrilled chỉ có 1 âm tiết kết thúc bằng /ld/, thrilling có 2 âm tiết.',
      },
    ],
    practiceSentences: [
      {
        sentence: 'The delayed flight was incredibly frustrating, so the passengers felt exhausted.',
        phoneticTarget: 'ðə dɪˈleɪd flaɪt wəz ɪnˈkredəbli ˈfrʌstreɪtɪŋ, soʊ ðə ˈpæsɪndʒərz felt ɪɡˈzɑːstɪd ↘',
        vietnameseTranslation: 'Chuyến bay bị hoãn gây ức chế vô cùng, vì vậy các hành khách đều cảm thấy kiệt sức.',
      },
      {
        sentence: 'I was deeply disappointed by the poor service, but the manager was very courteous.',
        phoneticTarget: 'aɪ wəz ˈdiːpli ˌdɪsəˈpɔɪntɪd baɪ ðə pʊr ˈsɜːrvɪs, bət ðə ˈmænɪdʒər wəz ˈveri ˈkɜːrtiəs ↘',
        vietnameseTranslation: 'Tôi đã vô cùng thất vọng trước dịch vụ kém cỏi, nhưng người quản lý lại rất lịch thiệp.',
      },
      {
        sentence: 'Finding a prompt resolution made everyone feel immensely relieved and satisfied.',
        phoneticTarget: 'ˈfaɪndɪŋ‿ə prɑːmpt ˌrezəˈluːʃn meɪd ˈevriwʌn fiːl ɪˈmensli rɪˈliːvd ənd ˈsætɪsfaɪd ↘',
        vietnameseTranslation: 'Tìm ra một giải pháp kịp thời khiến mọi người cảm thấy nhẹ nhõm và hài lòng vô cùng.',
      },
    ],
  },

  // ── Stage 2: Core Patterns & Lexical Chunks ────────────────────────────────
  stage2CorePatterns: {
    titleVi: 'Khung cấu trúc phản ánh cảm xúc & Xử lý sự cố dịch vụ lịch thiệp',
    vietnameseGrammarRule:
      'Khi đối mặt với tình huống bất như ý trong đời sống hay công việc, hãy áp dụng công thức 3 bước của người chuyên nghiệp: 1) Xác định hoàn cảnh mang tính chất gì (dùng tính từ -ing): "The incident was remarkably [frustrating / confusing]." 2) Bày tỏ cảm xúc của bản thân một cách chừng mực (dùng tính từ -ed): "Consequently, I felt rather [disappointed / overwhelmed]." 3) Đưa ra yêu cầu khắc phục nhã nhặn: "Could you please look into this matter and help me rectify the situation?".',
    formula:
      'The [Issue] was extremely [Adj-ing], which made me feel utterly [Adj-ed]. However, after speaking with [Representative], we reached a [Resolution], and I felt [Relieved].',
    legoSlots: [
      {
        template:
          'To be completely frank, the {situation_event} was extremely {adj_ing}, so I naturally felt quite {adj_ed}. Rather than becoming angry, I politely approached {person_in_charge} and explained {core_complaint}. Thankfully, they offered {remedy}, which made me feel {resolution_feeling}.',
        slots: {
          situation_event: [
            'unannounced four-hour flight cancellation',
            'hotel room mix-up during our peak holiday',
            'delayed delivery of my urgent laptop order',
            'unexpected billing error on my monthly statement',
          ],
          adj_ing: [
            'frustrating and utterly exhausting',
            'confusing and deeply inconvenient',
            'disappointing and unacceptable',
            'stressful and highly disruptive',
          ],
          adj_ed: [
            'frustrated and mentally overwhelmed',
            'disappointed and somewhat stranded',
            'anxious about missing my crucial deadline',
            'concerned about our financial safety',
          ],
          person_in_charge: [
            'the duty manager at the airline service desk',
            'the front office supervisor at the hotel reception',
            'the dedicated customer care representative on the hotline',
            'the branch manager at the downtown bank office',
          ],
          core_complaint: [
            'that we had urgent meetings that could not be postponed',
            'that we had booked and paid for a sea-view suite weeks in advance',
            'that the tracking status had shown no updates for five consecutive days',
            'that an unauthorized surcharge had been charged to my card twice',
          ],
          remedy: [
            'a complimentary hotel stay plus seats on the earliest morning flight',
            'a complimentary upgrade to an executive penthouse with free breakfast',
            'an expedited priority courier along with a generous discount voucher',
            'an immediate full refund and a waived annual membership fee',
          ],
          resolution_feeling: [
            'profoundly relieved, respected, and willing to remain a loyal customer',
            'delighted with their professional conduct and quick responsiveness',
            'reassured and appreciative of their courteous attitude',
            'satisfied that fairness and transparency were fully restored',
          ],
        },
        examples: [
          {
            en: 'To be completely frank, the unannounced four-hour flight cancellation was extremely frustrating and utterly exhausting, so I naturally felt quite frustrated and mentally overwhelmed. Rather than becoming angry, I politely approached the duty manager at the airline service desk and explained that we had urgent meetings that could not be postponed. Thankfully, they offered a complimentary hotel stay plus seats on the earliest morning flight, which made me feel profoundly relieved, respected, and willing to remain a loyal customer.',
            vi: 'Nói một cách hoàn toàn thẳng thắn, việc chuyến bay bị hủy đột ngột 4 tiếng đồng hồ là vô cùng ức chế và cực kỳ kiệt sức, vì vậy tôi tự nhiên cảm thấy rất bực bội và choáng ngợp tâm trí. Thay vì nổi nóng, tôi đã tiếp cận một cách nhã nhặn người quản lý ca trực tại quầy dịch vụ hàng không và giải thích rằng chúng tôi có những cuộc họp khẩn không thể hoãn. Rất may mắn, họ đã đề xuất một đêm nghỉ miễn phí tại khách sạn kèm theo chỗ ngồi trên chuyến bay sớm nhất sáng hôm sau, điều này khiến tôi cảm thấy nhẹ nhõm vô cùng, được tôn trọng và sẵn lòng tiếp tục là khách hàng trung thành.',
          },
          {
            en: 'To be completely frank, the hotel room mix-up during our peak holiday was extremely confusing and deeply inconvenient, so I naturally felt quite disappointed and somewhat stranded. Rather than becoming angry, I politely approached the front office supervisor at the hotel reception and explained that we had booked and paid for a sea-view suite weeks in advance. Thankfully, they offered a complimentary upgrade to an executive penthouse with free breakfast, which made me feel delighted with their professional conduct and quick responsiveness.',
            vi: 'Thành thật mà nói, sự cố nhầm lẫn phòng khách sạn vào kỳ nghỉ cao điểm là vô cùng khó hiểu và bất tiện sâu sắc, vì vậy tôi tự nhiên cảm thấy khá thất vọng và có chút bơ vơ. Thay vì cáu gắt, tôi lịch thiệp trao đổi với giám sát tiền sảnh tại quầy lễ tân và giải thích rằng chúng tôi đã đặt và thanh toán trước nhiều tuần cho phòng suite hướng biển. Thật may, họ đã nâng cấp miễn phí cho chúng tôi lên phòng penthouse sang trọng kèm bữa sáng, điều đó khiến tôi rất hài lòng với tác phong chuyên nghiệp và sự phản hồi nhanh nhạy của họ.',
          },
        ],
      },
    ],
    highFrequencyVocab: [
      {
        term: 'courteous',
        ipa: '/ˈkɜːr.t̬i.əs/',
        partOfSpeech: 'adj',
        meaningVi: 'lịch thiệp, nhã nhặn, tôn trọng',
        collocationHintVi: 'courteous staff / courteous reply / polite and courteous',
        exampleSentenceEn: 'The flight attendants remained exceptionally calm and courteous throughout.',
        exampleSentenceVi: 'Các tiếp viên hàng không vẫn đặc biệt bình tĩnh và lịch thiệp trong suốt chuyến bay.',
      },
      {
        term: 'frustrating',
        ipa: '/ˈfrʌs.treɪ.tɪŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'gây bực bội, khó chịu, ức chế',
        collocationHintVi: 'deeply frustrating / frustrating delay',
        exampleSentenceEn: 'Waiting on hold for thirty minutes without an answer is deeply frustrating.',
        exampleSentenceVi: 'Chờ máy giữ máy suốt ba mươi phút mà không ai trả lời là điều vô cùng ức chế.',
      },
      {
        term: 'overwhelmed',
        ipa: '/ˌoʊ.vɚˈwelmd/',
        partOfSpeech: 'adj',
        meaningVi: 'choáng ngợp, quá tải cảm xúc',
        collocationHintVi: 'feel overwhelmed / emotionally overwhelmed',
        exampleSentenceEn: 'She felt completely overwhelmed by the sheer volume of customer complaints.',
        exampleSentenceVi: 'Cô ấy cảm thấy hoàn toàn choáng ngợp trước lượng khiếu nại khổng lồ của khách hàng.',
      },
      {
        term: 'rectify',
        ipa: '/ˈrek.tə.faɪ/',
        partOfSpeech: 'verb',
        meaningVi: 'sửa chữa, khắc phục sai sót, chấn chỉnh',
        collocationHintVi: 'rectify the mistake / rectify the situation',
        exampleSentenceEn: 'The management promised to rectify the billing error within twenty-four hours.',
        exampleSentenceVi: 'Ban quản lý đã hứa sẽ khắc phục sai sót tính tiền trong vòng hai mươi tư giờ.',
      },
    ],
  },

  // ── Stage 3: Guided Dialogue ───────────────────────────────────────────────
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại tương tác: Xử lý sự cố dịch vụ lịch thiệp tại khách sạn',
    contextVi:
      'Học viên (Learner) phát hiện phòng khách sạn bị ồn và không đúng loại phòng đã đặt. Học viên trao đổi với Quản lý tiền sảnh (Partner) để tìm hướng giải quyết win-win.',
    frameworkType: 'prep',
    turns: [
      {
        speaker: 'Partner',
        en: 'Good afternoon, sir. How may I assist you today at our reception desk?',
        vi: 'Xin chào buổi chiều, thưa quý khách. Tôi có thể hỗ trợ gì cho quý khách tại quầy lễ tân hôm nay ạ?',
        coreKeywords: ['assist you', 'reception desk'],
      },
      {
        speaker: 'Learner',
        en: 'Good afternoon. To be frank, I am rather frustrated because my assigned room is right next to a noisy construction area.',
        vi: 'Chào bạn. Thành thật mà nói, tôi cảm thấy khá bực bội vì phòng được giao nằm ngay sát công trường thi công ồn ào.',
        coreKeywords: ['To be frank', 'rather frustrated', 'noisy construction area'],
        suggestedStartersVi: ['Good afternoon. To be frank, I am rather...'],
      },
      {
        speaker: 'Partner',
        en: 'Oh, I am terribly sorry to hear that! That sounds extremely disturbing and inconvenient.',
        vi: 'Ôi, tôi vô cùng lấy làm tiếc khi nghe điều đó! Âm thanh đó nghe chừng rất phiền toái và bất tiện.',
        coreKeywords: ['terribly sorry', 'disturbing and inconvenient'],
      },
      {
        speaker: 'Learner',
        en: 'Yes, it was utterly exhausting after a long flight. I would appreciate it if you could rectify this and move us to a quiet room.',
        vi: 'Đúng vậy, nó thực sự làm tôi kiệt sức sau một chuyến bay dài. Tôi rất cảm kích nếu bạn có thể khắc phục điều này và chuyển chúng tôi sang một phòng yên tĩnh.',
        coreKeywords: ['utterly exhausting', 'rectify this', 'quiet room'],
        suggestedStartersVi: ['Yes, it was utterly exhausting... I would appreciate it if...'],
      },
      {
        speaker: 'Partner',
        en: 'Certainly. I can immediately upgrade you to a Deluxe Suite on our quiet top floor free of charge.',
        vi: 'Chắc chắn rồi ạ. Tôi có thể nâng cấp ngay cho quý khách lên phòng Suite Cao Cấp ở tầng cao yên tĩnh hoàn toàn miễn phí.',
        coreKeywords: ['immediately upgrade', 'Deluxe Suite', 'free of charge'],
      },
      {
        speaker: 'Learner',
        en: 'That is wonderful news. I feel so relieved now. Thank you for your courteous and swift assistance.',
        vi: 'Đó là một tin tuyệt vời. Giờ tôi thấy nhẹ nhõm hơn nhiều rồi. Cảm ơn sự hỗ trợ nhanh nhẹn và lịch thiệp của bạn.',
        coreKeywords: ['wonderful news', 'feel so relieved', 'courteous and swift assistance'],
        suggestedStartersVi: ['That is wonderful news. I feel so...'],
      },
    ],
  },

  // ── Stage 4: SafeHarbor Evaluation ────────────────────────────────────────
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Diễn đạt cảm xúc & Xử lý sự cố 60s',
    promptVi:
      'Kể lại một sự cố dịch vụ gây khó chịu (chuyến bay, khách sạn, mua hàng) kết hợp cặp tính từ phân từ -ing (tính chất sự việc) và -ed (tâm trạng cá nhân), cùng cách bạn trao đổi lịch sự để giải quyết.',
    promptQuestionEn: 'How do you usually handle an annoying service mistake or poor customer experience?',
    targetSentence:
      'The unexpected flight delay was extremely frustrating, which made me feel utterly exhausted. Instead of getting angry, I approached the desk and politely asked them to rectify the issue. The courteous staff arranged hotel accommodation, so I felt deeply relieved and satisfied.',
    acceptableVariations: [
      'The noisy hotel room was deeply disappointing and exhausting, leaving me completely overwhelmed. However, I spoke with the manager courteously and requested a quieter room. They upgraded us immediately, making me feel respected and relieved.',
      'Receiving a broken product was very frustrating and inconvenient, and I felt quite disappointed. I called customer support calmly to report the defect. They dispatched a replacement within twenty-four hours, so I felt very satisfied.',
    ],
    coreKeywords: [
      'frustrating',
      'exhausted',
      'politely',
      'rectify',
      'courteous',
      'relieved',
    ],
    targetMeaningVi:
      'Sự cố hoãn chuyến bay bất ngờ gây bực bội tột cùng, khiến tôi cảm thấy kiệt sức hoàn toàn. Thay vì cáu giận, tôi đã đến quầy và lịch sự yêu cầu họ khắc phục sự cố. Đội ngũ nhân viên nhã nhặn đã sắp xếp chỗ nghỉ khách sạn, nhờ đó tôi cảm thấy vô cùng nhẹ nhõm và hài lòng.',
    instructionsVi:
      'Phát âm chuẩn xác đuôi /-ɪŋ/ ở "frustrating" và đuôi /-ɪd/ ở "exhausted", "disappointed". Hoàn thành bài nói trong vòng 60 giây, đạt tối thiểu 75 điểm.',
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
  },
};
