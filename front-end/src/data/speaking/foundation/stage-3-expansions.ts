/**
 * Foundational Speaking System for False Beginners (A0-A1)
 * Stage 3: Quy tắc nở câu 3 nhịp & Hội thoại vi mô (3-Beat Breath Expansion & Micro-Dialogues)
 * File: src/data/speaking/foundation/stage-3-expansions.ts
 *
 * 1. 3-Beat Breath Expansion Model:
 *    [Beat 1: Core Action] -> [300ms breath pause] -> [Beat 2: Context] -> [300ms breath pause] -> [Beat 3: Emotion/Reason]
 *    Breaks the habit of choppy, blunt utterances without inducing cognitive overload.
 *
 * 2. Authentic Micro-Dialogues:
 *    6 realistic, 4-turn exchanges representing everyday survival interactions
 *    with clear speaker roles, bilingual transcripts, and content keywords.
 *
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { ThreeBeatExpansionItem, MicroDialogue } from '@/types/speaking-foundation';

// ─── 1. THREE-BEAT BREATH EXPANSIONS ───────────────────────────────────────────
export const STAGE_3_EXPANSIONS: ThreeBeatExpansionItem[] = [
  // ── Item 1: Morning Rush Cafe Order ─────────────────────────────────────────
  {
    id: 'exp-cafe-rush-order',
    topic: 'Ordering Drinks at a Busy Cafe',
    topicVi: 'Gọi đồ uống tại quán cà phê giờ cao điểm',
    beat1Core: {
      en: "I'd like an iced Americano,",
      vi: 'Tôi muốn gọi một ly Americano đá,',
      ipa: '/aɪd laɪk ən aɪst əˌmerɪˈkɑːnoʊ/',
    },
    beat2Context: {
      en: 'to take away,',
      vi: 'để mang đi,',
      ipa: '/tə teɪk əˈweɪ/',
    },
    beat3EmotionReason: {
      en: 'because I have a morning meeting at nine, please.',
      vi: 'bởi vì tôi có cuộc họp sáng lúc 9 giờ, làm ơn.',
      ipa: '/bɪˈkəz aɪ hæv ə ˈmɔːrnɪŋ ˈmiːtɪŋ æt naɪn pliːz/',
    },
    fullSentence: "I'd like an iced Americano, to take away, because I have a morning meeting at nine, please.",
    fullMeaningVi: 'Tôi muốn gọi một ly Americano đá mang đi, vì tôi có cuộc họp sáng lúc 9 giờ, làm ơn.',
    coreKeywords: ['like', 'iced', 'americano', 'take', 'away', 'meeting', 'nine', 'please'],
    phoneticTipVi:
      'Nghỉ lấy hơi 300ms nhẹ nhàng ở dấu phẩy giữa Nhịp 1 và Nhịp 2. Nhấn trọng âm vào: Americano, take away, meeting, nine.',
  },

  // ── Item 2: Hotel Late Check-out Request ────────────────────────────────────
  {
    id: 'exp-hotel-late-checkout',
    topic: 'Requesting a Late Hotel Check-out',
    topicVi: 'Xin gia hạn giờ trả phòng khách sạn',
    beat1Core: {
      en: 'Could I have a late check-out,',
      vi: 'Tôi có thể trả phòng muộn được không,',
      ipa: '/kəd aɪ hæv ə leɪt ˈtʃekaʊt/',
    },
    beat2Context: {
      en: 'at around one PM,',
      vi: 'vào khoảng 1 giờ chiều,',
      ipa: '/æt əˈraʊnd wʌn ˌpiː ˈem/',
    },
    beat3EmotionReason: {
      en: 'because my return flight is late in the evening?',
      vi: 'bởi vì chuyến bay về của tôi khởi hành muộn vào buổi tối?',
      ipa: '/bɪˈkəz maɪ rɪˈtɜːrn flaɪt ɪz leɪt ɪn ði ˈiːvnɪŋ/',
    },
    fullSentence: 'Could I have a late check-out, at around one PM, because my return flight is late in the evening?',
    fullMeaningVi: 'Tôi có thể trả phòng muộn vào khoảng 1 giờ chiều được không, vì chuyến bay về của tôi muộn vào buổi tối?',
    coreKeywords: ['could', 'late', 'check-out', 'one', 'flight', 'evening'],
    phoneticTipVi:
      'Lên giọng nhẹ ở cuối câu hỏi Yes/No "evening ↗". Cụm "late check-out" nối âm dứt khoát /leɪt ˈtʃekaʊt/.',
  },

  // ── Item 3: Urgent Taxi Ride to Airport ──────────────────────────────────────
  {
    id: 'exp-urgent-airport-taxi',
    topic: 'Taking an Urgent Taxi to the Airport',
    topicVi: 'Đi taxi gấp ra sân bay kịp chuyến bay',
    beat1Core: {
      en: 'Please take me to the airport,',
      vi: 'Làm ơn chở tôi ra sân bay,',
      ipa: '/pliːz teɪk miː tə ði ˈerpɔːrt/',
    },
    beat2Context: {
      en: 'by the highway,',
      vi: 'đi bằng đường cao tốc,',
      ipa: '/baɪ ðə ˈhaɪweɪ/',
    },
    beat3EmotionReason: {
      en: 'because my flight boards in one hour.',
      vi: 'bởi vì chuyến bay của tôi sẽ lên máy bay trong một giờ nữa.',
      ipa: '/bɪˈkəz maɪ flaɪt bɔːrdz ɪn wʌn ˈaʊər/',
    },
    fullSentence: 'Please take me to the airport, by the highway, because my flight boards in one hour.',
    fullMeaningVi: 'Làm ơn chở tôi ra sân bay bằng đường cao tốc, vì chuyến bay của tôi sẽ bắt đầu lên máy bay trong 1 tiếng nữa.',
    coreKeywords: ['take', 'me', 'airport', 'highway', 'flight', 'boards', 'hour'],
    phoneticTipVi:
      'Nhấn mạnh vào các từ mang tính cấp thiết: "airport", "highway", "boards in one hour".',
  },

  // ── Item 4: Clothing Size Exchange ──────────────────────────────────────────
  {
    id: 'exp-clothing-size-exchange',
    topic: 'Exchanging Clothing Size at a Retail Store',
    topicVi: 'Đổi cỡ áo tại cửa hàng quần áo',
    beat1Core: {
      en: 'Do you have this jacket,',
      vi: 'Bạn có chiếc áo khoác này,',
      ipa: '/duː juː hæv ðɪs ˈdʒækɪt/',
    },
    beat2Context: {
      en: 'in a larger size,',
      vi: 'ở kích cỡ lớn hơn,',
      ipa: '/ɪn ə ˈlɑːrdʒər saɪz/',
    },
    beat3EmotionReason: {
      en: 'because this medium feels a bit tight on my shoulders?',
      vi: 'bởi vì cỡ M này cảm thấy hơi chật ở hai vai của tôi?',
      ipa: '/bɪˈkəz ðɪs ˈmiːdiəm fiːlz ə bɪt taɪt ɑːn maɪ ˈʃoʊldərz/',
    },
    fullSentence: 'Do you have this jacket, in a larger size, because this medium feels a bit tight on my shoulders?',
    fullMeaningVi: 'Bạn có chiếc áo khoác này ở cỡ lớn hơn không, vì cỡ M này hơi chật ở vai của tôi?',
    coreKeywords: ['have', 'jacket', 'larger', 'size', 'tight', 'shoulders'],
    phoneticTipVi:
      'Nối âm "feels a bit" /fiːl.zə.bɪt/, bật rõ âm đuôi /t/ trong "tight".',
  },

  // ── Item 5: Workplace Project Deadline Extension ────────────────────────────
  {
    id: 'exp-workplace-deadline-extension',
    topic: 'Requesting a Brief Project Deadline Extension',
    topicVi: 'Xin gia hạn báo cáo dự án với đồng nghiệp / cấp trên',
    beat1Core: {
      en: 'Could I submit the project report,',
      vi: 'Tôi có thể nộp bản báo cáo dự án,',
      ipa: '/kəd aɪ səbˈmɪt ðə ˈprɑːdʒekt rɪˈpɔːrt/',
    },
    beat2Context: {
      en: 'tomorrow morning,',
      vi: 'vào sáng mai,',
      ipa: '/təˈmɔːroʊ ˈmɔːrnɪŋ/',
    },
    beat3EmotionReason: {
      en: 'so that I can verify all the client numbers?',
      vi: 'để tôi có thể kiểm tra lại toàn bộ số liệu khách hàng được không?',
      ipa: '/soʊ ðæt aɪ kən ˈverɪfaɪ ɔːl ðə ˈklaɪənt ˈnʌmbərz/',
    },
    fullSentence: 'Could I submit the project report, tomorrow morning, so that I can verify all the client numbers?',
    fullMeaningVi: 'Tôi có thể nộp bản báo cáo dự án vào sáng mai được không, để tôi có thể đối soát lại toàn bộ số liệu khách hàng?',
    coreKeywords: ['submit', 'project', 'report', 'tomorrow', 'morning', 'verify', 'client', 'numbers'],
    phoneticTipVi:
      'Giữ thái độ hòa nhã, lịch sự. Nhấn vào các động từ hành động: "submit", "tomorrow morning", "verify numbers".',
  },

  // ── Item 6: Pharmacy Urgent Care Medicine ───────────────────────────────────
  {
    id: 'exp-pharmacy-urgent-medicine',
    topic: 'Asking for Urgent Pain Relief at a Pharmacy',
    topicVi: 'Hỏi mua thuốc giảm đau gấp tại hiệu thuốc',
    beat1Core: {
      en: 'I need some pain relief medicine,',
      vi: 'Tôi cần một ít thuốc giảm đau,',
      ipa: '/aɪ niːd səm peɪn rɪˈliːf ˈmedɪsn/',
    },
    beat2Context: {
      en: 'right now,',
      vi: 'ngay bây giờ,',
      ipa: '/raɪt naʊ/',
    },
    beat3EmotionReason: {
      en: 'because I have a very bad headache.',
      vi: 'bởi vì tôi đang bị đau đầu dữ dội.',
      ipa: '/bɪˈkəz aɪ hæv ə ˈveri bæd ˈhedeɪk/',
    },
    fullSentence: 'I need some pain relief medicine, right now, because I have a very bad headache.',
    fullMeaningVi: 'Tôi cần một ít thuốc giảm đau ngay bây giờ, bởi vì tôi đang bị đau đầu rất dữ dội.',
    coreKeywords: ['need', 'pain', 'relief', 'medicine', 'now', 'bad', 'headache'],
    phoneticTipVi:
      'Cụm "pain relief medicine" đọc rõ ràng, kết thúc dứt khoát ở từ "headache" /ˈhedeɪk/ với âm bật /-k/.',
  },
];

// ─── 2. AUTHENTIC MICRO-DIALOGUES ─────────────────────────────────────────────
export const STAGE_3_MICRO_DIALOGUES: MicroDialogue[] = [
  // ── Dialogue 1: Coffee Shop Rush Hour ───────────────────────────────────────
  {
    id: 'micro-dial-01',
    scenario: 'Coffee Shop Rush Hour',
    scenarioVi: 'Quán cà phê giờ cao điểm buổi sáng',
    contextVi: 'Bạn đang đứng tại quầy order của quán cà phê nhà ga lúc 8:00 sáng và cần gọi đồ uống nhanh để kịp chuyến tàu.',
    turns: [
      {
        speaker: 'Partner',
        textEn: 'Good morning! What can I get started for you today?',
        textVi: 'Chào buổi sáng! Tôi có thể làm đồ uống gì cho bạn hôm nay?',
        ipa: '/ɡʊd ˈmɔːrnɪŋ wɑːt kən aɪ ɡet ˈstɑːrtɪd fər juː təˈdeɪ/',
      },
      {
        speaker: 'Learner',
        textEn: 'Hi! Can I have an iced latte and a warm croissant, please?',
        textVi: 'Chào bạn! Cho tôi một ly latte đá và một bánh sừng bò ấm nhé, làm ơn.',
        ipa: '/haɪ kə naɪ hæv ən aɪst ˈlɑːteɪ ənd ə wɔːrm krwɑːˈsɑːnt pliːz/',
        coreKeywords: ['can', 'have', 'iced', 'latte', 'warm', 'croissant', 'please'],
      },
      {
        speaker: 'Partner',
        textEn: 'Sure thing! For here or to go?',
        textVi: 'Dạ được chứ! Bạn dùng tại đây hay mang đi ạ?',
        ipa: '/ʃʊr θɪŋ fər hɪr ɔːr tə ɡoʊ/',
      },
      {
        speaker: 'Learner',
        textEn: 'To go, please. And could I get the receipt?',
        textVi: 'Mang đi nhé. Và cho tôi xin hóa đơn thanh toán được không?',
        ipa: '/tə ɡoʊ pliːz ənd kəd aɪ ɡet ðə rɪˈsiːt/',
        coreKeywords: ['go', 'please', 'could', 'get', 'receipt'],
      },
    ],
  },

  // ── Dialogue 2: Hotel Check-In ──────────────────────────────────────────────
  {
    id: 'micro-dial-02',
    scenario: 'Hotel Front Desk Check-In',
    scenarioVi: 'Thủ tục nhận phòng tại khách sạn',
    contextVi: 'Bạn vừa đến khách sạn sau chuyến bay dài và làm thủ tục nhận chìa khóa phòng tại quầy lễ tân.',
    turns: [
      {
        speaker: 'Partner',
        textEn: 'Good afternoon, welcome to Central Hotel. Are you checking in?',
        textVi: 'Chào buổi chiều, chào mừng đến khách sạn Central. Quý khách làm thủ tục nhận phòng ạ?',
        ipa: '/ɡʊd ˌæftərˈnuːn ˈwelkəm tə ˈsentrəl hoʊˈtel ɑːr juː ˈtʃekɪŋ ɪn/',
      },
      {
        speaker: 'Learner',
        textEn: 'Yes, I have a reservation under Nguyen. Here is my passport.',
        textVi: 'Vâng, tôi có đặt phòng trước dưới tên Nguyễn. Đây là hộ chiếu của tôi.',
        ipa: '/jes aɪ hæv ə ˌrezərˈveɪʃn ˈʌndər ˈnuːjən hɪr ɪz maɪ ˈpæspɔːrt/',
        coreKeywords: ['yes', 'have', 'reservation', 'under', 'nguyen', 'passport'],
      },
      {
        speaker: 'Partner',
        textEn: 'Thank you, Mr. Nguyen. Your room on the fifth floor is all set. Here is your key card.',
        textVi: 'Cảm ơn anh Nguyễn. Phòng của anh ở tầng 5 đã sẵn sàng. Đây là thẻ từ của anh.',
        ipa: '/θæŋk juː ˈmɪstər ˈnuːjən jɔːr ruːm ɑːn ðə fɪfθ flɔːr ɪz ɔːl set hɪr ɪz jɔːr ˈkiː kɑːrd/',
      },
      {
        speaker: 'Learner',
        textEn: 'Thank you. What time is breakfast tomorrow, and what is the Wi-Fi password?',
        textVi: 'Cảm ơn bạn. Mấy giờ thì phục vụ ăn sáng và mật khẩu Wi-Fi là gì vậy?',
        ipa: '/θæŋk juː wɑːt taɪm ɪz ˈbrekfəst təˈmɔːroʊ ənd wɑːt ɪz ðə ˈwaɪ faɪ ˈpæswɜːrd/',
        coreKeywords: ['thank', 'what', 'time', 'breakfast', 'tomorrow', 'wifi', 'password'],
      },
    ],
  },

  // ── Dialogue 3: Street Directions to Subway ─────────────────────────────────
  {
    id: 'micro-dial-03',
    scenario: 'Asking for Street Directions to Subway',
    scenarioVi: 'Hỏi đường đến ga tàu điện ngầm trên phố',
    contextVi: 'Bạn đang đứng ở góc phố lạ và cần hỏi người đi đường để tìm lối vào ga tàu điện ngầm gần nhất.',
    turns: [
      {
        speaker: 'Partner',
        textEn: 'Hello! Do you need help finding something?',
        textVi: 'Xin chào! Bạn có cần giúp tìm đường không ạ?',
        ipa: '/həˈloʊ duː juː niːd help ˈfaɪndɪŋ ˈsʌmθɪŋ/',
      },
      {
        speaker: 'Learner',
        textEn: 'Excuse me, could you tell me where the nearest subway station is?',
        textVi: 'Xin lỗi, bạn chỉ giúp tôi ga tàu điện ngầm gần nhất ở đâu được không?',
        ipa: '/ɪkˈskjuːz miː kəd juː tel miː wer ðə ˈnɪrɪst ˈsʌbweɪ ˈsteɪʃn ɪz/',
        coreKeywords: ['excuse', 'where', 'nearest', 'subway', 'station'],
      },
      {
        speaker: 'Partner',
        textEn: 'Sure. Walk straight for two blocks, then turn left at the traffic light.',
        textVi: 'Được chứ. Bạn đi thẳng hai dãy nhà, rồi rẽ trái ở cột đèn giao thông.',
        ipa: '/ʃʊr wɔːk streɪt fər tuː blɑːks ðen tɜːrn left æt ðə ˈtræfɪk laɪt/',
      },
      {
        speaker: 'Learner',
        textEn: 'Is it far from here? Can I walk there in five minutes?',
        textVi: 'Nó có xa đây không? Tôi đi bộ tới đó trong 5 phút được không?',
        ipa: '/ɪz ɪt fɑːr frəm hɪr kən aɪ wɔːk ðer ɪn faɪv ˈmɪnɪts/',
        coreKeywords: ['is', 'far', 'here', 'can', 'walk', 'five', 'minutes'],
      },
    ],
  },

  // ── Dialogue 4: Shopping for Clothes ────────────────────────────────────────
  {
    id: 'micro-dial-04',
    scenario: 'Shopping for Clothes at a Retail Store',
    scenarioVi: 'Hỏi kích cỡ và phòng thử đồ tại shop thời trang',
    contextVi: 'Bạn thích một chiếc áo khoác tại cửa hàng nhưng muốn hỏi nhân viên bán hàng xem còn cỡ lớn hơn và phòng thử đồ ở đâu.',
    turns: [
      {
        speaker: 'Partner',
        textEn: 'Hi there, are you finding everything okay?',
        textVi: 'Xin chào, bạn có tìm được đồ ưng ý không?',
        ipa: '/haɪ ðer ɑːr juː ˈfaɪndɪŋ ˈevriθɪŋ oʊˈkeɪ/',
      },
      {
        speaker: 'Learner',
        textEn: 'Hi! I like this blue jacket, but do you have it in size large?',
        textVi: 'Chào bạn! Tôi thích chiếc áo khoác xanh này, nhưng bạn có cỡ L không?',
        ipa: '/haɪ aɪ laɪk ðɪs bluː ˈdʒækɪt bət duː juː hæv ɪt ɪn saɪz lɑːrdʒ/',
        coreKeywords: ['like', 'blue', 'jacket', 'have', 'size', 'large'],
      },
      {
        speaker: 'Partner',
        textEn: 'Let me check the rack in the back... Yes, here is a size large for you.',
        textVi: 'Để tôi kiểm tra giá treo phía sau... Vâng, có cỡ L cho bạn đây.',
        ipa: '/let miː tʃek ðə ræk ɪn ðə bæk jes hɪr ɪz ə saɪz lɑːrdʒ fər juː/',
      },
      {
        speaker: 'Learner',
        textEn: 'Thank you so much! Can I try this on in the fitting room?',
        textVi: 'Cảm ơn bạn nhiều! Tôi có thể vào phòng thử đồ mặc thử cái này không?',
        ipa: '/θæŋk juː soʊ mʌtʃ kə naɪ traɪ ðɪs ɑːn ɪn ðə ˈfɪtɪŋ ruːm/',
        coreKeywords: ['thank', 'can', 'try', 'fitting', 'room'],
      },
    ],
  },

  // ── Dialogue 5: Pharmacy Consultation ───────────────────────────────────────
  {
    id: 'micro-dial-05',
    scenario: 'Consulting a Pharmacist for Medicine',
    scenarioVi: 'Tư vấn thuốc giảm đau bụng tại hiệu thuốc sân bay',
    contextVi: 'Bạn bị đau dạ dày khi đang đi du lịch nước ngoài và cần mua thuốc khẩn cấp tại hiệu thuốc.',
    turns: [
      {
        speaker: 'Partner',
        textEn: 'Hello, how can I help you today?',
        textVi: 'Xin chào, tôi có thể hỗ trợ gì cho bạn hôm nay?',
        ipa: '/həˈloʊ haʊ kən aɪ help juː təˈdeɪ/',
      },
      {
        speaker: 'Learner',
        textEn: 'Hello. I feel sick and I have a bad stomachache. What do you recommend?',
        textVi: 'Xin chào. Tôi thấy không khỏe và bị đau bụng dữ dội. Dược sĩ khuyên tôi nên dùng thuốc gì ạ?',
        ipa: '/həˈloʊ aɪ fiːl sɪk ənd aɪ hæv ə bæd ˈstʌməkeɪk wɑːt duː juː ˌrekəˈmend/',
        coreKeywords: ['feel', 'sick', 'have', 'bad', 'stomachache', 'recommend'],
      },
      {
        speaker: 'Partner',
        textEn: 'Take this medicine with water after eating. Drink plenty of warm water.',
        textVi: 'Uống loại thuốc này với nước sau khi ăn nhé. Hãy uống nhiều nước ấm.',
        ipa: '/teɪk ðɪs ˈmedɪsn wɪð ˈwɔːtər ˈæftər ˈiːtɪŋ drɪŋk ˈplenti əv wɔːrm ˈwɔːtər/',
      },
      {
        speaker: 'Learner',
        textEn: 'Thank you. Do you accept credit cards?',
        textVi: 'Cảm ơn bạn. Ở đây có quẹt thẻ tín dụng không?',
        ipa: '/θæŋk juː duː juː əkˈsept ˈkredɪt kɑːrdz/',
        coreKeywords: ['thank', 'accept', 'credit', 'cards'],
      },
    ],
  },

  // ── Dialogue 6: Quick Workplace Chat ────────────────────────────────────────
  {
    id: 'micro-dial-06',
    scenario: 'Quick Workplace Alignment Chat',
    scenarioVi: 'Trao đổi công việc nhanh trước giờ họp',
    contextVi: 'Đồng nghiệp ghé qua bàn làm việc của bạn để xin file tài liệu khách hàng trước cuộc gọi họp nhóm.',
    turns: [
      {
        speaker: 'Partner',
        textEn: 'Good morning! Are you free for a quick two-minute chat before the team call?',
        textVi: 'Chào buổi sáng! Bạn có rảnh 2 phút nói chuyện nhanh trước cuộc họp nhóm không?',
        ipa: '/ɡʊd ˈmɔːrnɪŋ ɑːr juː friː fər ə kwɪk tuː ˈmɪnɪt tʃæt bɪˈfɔːr ðə tiːm kɔːl/',
      },
      {
        speaker: 'Learner',
        textEn: "Good morning! Yes, I am free right now. What's up?",
        textVi: 'Chào buổi sáng! Có, tôi đang rảnh đây. Có việc gì thế?',
        ipa: '/ɡʊd ˈmɔːrnɪŋ jes aɪ æm friː raɪt naʊ wɑːts ʌp/',
        coreKeywords: ['good', 'morning', 'free', 'right', 'now'],
      },
      {
        speaker: 'Partner',
        textEn: "Could you please send me the updated client spreadsheet by ten o'clock?",
        textVi: 'Bạn gửi giúp tôi bảng tính khách hàng đã cập nhật trước 10 giờ được không?',
        ipa: '/kəd juː pliːz send miː ði ˌʌpˈdeɪtɪd ˈklaɪənt ˈspredʃiːt baɪ ten əˈklɑːk/',
      },
      {
        speaker: 'Learner',
        textEn: 'Sure thing. Let me double-check the figures and email it to you right away.',
        textVi: 'Chắc chắn rồi. Để tôi kiểm tra lại số liệu rồi gửi email cho bạn ngay.',
        ipa: '/ʃʊr θɪŋ let miː ˈdʌbl tʃek ðə ˈfɪɡjərz ənd ˈiːmeɪl ɪt tə juː raɪt əˈweɪ/',
        coreKeywords: ['sure', 'check', 'figures', 'email', 'right', 'away'],
      },
    ],
  },
];
