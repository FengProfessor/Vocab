/**
 * Foundational Speaking System for False Beginners (A0-A1)
 * Stage 1: Kho khung câu phản xạ sống còn (Invariant Survival Frames)
 * File: src/data/speaking/foundation/stage-1-survival-frames.ts
 *
 * Exactly 28 invariant survival frames across 7 vital domains (4 frames per domain):
 * 1. fnb: Calling & Ordering Food & Drinks
 * 2. shopping: Retail, Sizes, Colors & Pricing
 * 3. directions: Urban Navigation & Transportation
 * 4. hotel: Accommodation, Check-in & Room Requests
 * 5. workplace: Office Interactions, Requests & Syncs
 * 6. emergency: Health, Medical Symptoms & Assistance
 * 7. fillers: Time-Buying Lubricants & Clarification Prompts
 *
 * Designed with ZERO complex tense conjugations (modals, imperatives, simple present).
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { SurvivalFrame } from '@/types/speaking-foundation';

export const STAGE_1_SURVIVAL_FRAMES: SurvivalFrame[] = [
  // ═════════════════════════════════════════════════════════════════════════════
  // DOMAIN 1: FOOD & DRINKS (fnb) - 4 FRAMES
  // ═════════════════════════════════════════════════════════════════════════════
  {
    id: 'frame-fnb-01',
    domain: 'fnb',
    domainNameVi: 'Gọi đồ ăn & Đồ uống',
    template: 'Can I have a {item}, please?',
    meaningVi: 'Cho tôi một {món} nhé, làm ơn.',
    phoneticTipVi: 'Nối âm trơn tru /kə.naɪ.hæ.və/, hạ giọng nhẹ ở cuối câu để tạo sắc thái lịch sự.',
    slots: [
      {
        key: 'item',
        labelVi: 'Món đồ uống hoặc đồ ăn',
        options: ['hot latte', 'iced black coffee', 'glass of water', 'warm croissant', 'chicken sandwich'],
      },
    ],
    exemplars: [
      {
        sentence: 'Can I have a hot latte, please?',
        meaningVi: 'Cho tôi một ly latte nóng nhé, làm ơn.',
        coreKeywords: ['can', 'have', 'hot', 'latte', 'please'],
        ipa: '/kə naɪ hæv ə hɑːt ˈlɑːteɪ pliːz/',
      },
      {
        sentence: 'Can I have a glass of water, please?',
        meaningVi: 'Cho tôi xin một ly nước lọc nhé, làm ơn.',
        coreKeywords: ['can', 'have', 'glass', 'water', 'please'],
        ipa: '/kə naɪ hæv ə ɡlæs əv ˈwɔːtər pliːz/',
      },
      {
        sentence: 'Can I have a warm croissant, please?',
        meaningVi: 'Cho tôi một chiếc bánh sừng bò ấm nhé, làm ơn.',
        coreKeywords: ['can', 'have', 'warm', 'croissant', 'please'],
        ipa: '/kə naɪ hæv ə wɔːrm krwɑːˈsɑːnt pliːz/',
      },
    ],
  },
  {
    id: 'frame-fnb-02',
    domain: 'fnb',
    domainNameVi: 'Gọi đồ ăn & Đồ uống',
    template: "I'd like {item}, please.",
    meaningVi: 'Tôi muốn gọi {món}, làm ơn.',
    phoneticTipVi: 'Bật nhẹ âm /d/ trong /aɪd laɪk/, không nuốt mất âm chặn /d/.',
    slots: [
      {
        key: 'item',
        labelVi: 'Món ăn hoặc bàn ngồi',
        options: ['the chicken sandwich', 'a table for two', 'the seafood pasta', 'an iced tea'],
      },
    ],
    exemplars: [
      {
        sentence: "I'd like the chicken sandwich, please.",
        meaningVi: 'Tôi muốn gọi món bánh mì kẹp gà, làm ơn.',
        coreKeywords: ['like', 'chicken', 'sandwich', 'please'],
        ipa: '/aɪd laɪk ðə ˈtʃɪkɪn ˈsænwɪtʃ pliːz/',
      },
      {
        sentence: "I'd like a table for two, please.",
        meaningVi: 'Tôi muốn đặt một bàn cho hai người, làm ơn.',
        coreKeywords: ['like', 'table', 'two', 'please'],
        ipa: '/aɪd laɪk ə ˈteɪbl fər tuː pliːz/',
      },
      {
        sentence: "I'd like the seafood pasta, please.",
        meaningVi: 'Tôi muốn gọi món mì Ý hải sản, làm ơn.',
        coreKeywords: ['like', 'seafood', 'pasta', 'please'],
        ipa: '/aɪd laɪk ðə ˈsiːfuːd ˈpɑːstə pliːz/',
      },
    ],
  },
  {
    id: 'frame-fnb-03',
    domain: 'fnb',
    domainNameVi: 'Gọi đồ ăn & Đồ uống',
    template: 'Does this have {ingredient} in it?',
    meaningVi: 'Món này có chứa {nguyên liệu} không?',
    phoneticTipVi: 'Nối âm liên hoàn: /dʌz ðɪs hæ.vɪ.nɪt/, lên giọng ở cuối câu hỏi Yes/No.',
    slots: [
      {
        key: 'ingredient',
        labelVi: 'Thành phần nguyên liệu / dị ứng',
        options: ['peanuts', 'dairy', 'sugar', 'pork', 'seafood'],
      },
    ],
    exemplars: [
      {
        sentence: 'Does this have peanuts in it?',
        meaningVi: 'Món này có chứa đậu phộng (lạc) không?',
        coreKeywords: ['does', 'have', 'peanuts', 'in'],
        ipa: '/dʌz ðɪs hæv ˈpiːnʌts ɪn ɪt/',
      },
      {
        sentence: 'Does this have dairy in it?',
        meaningVi: 'Món này có chứa sữa hoặc chế phẩm từ sữa không?',
        coreKeywords: ['does', 'have', 'dairy', 'in'],
        ipa: '/dʌz ðɪs hæv ˈderi ɪn ɪt/',
      },
      {
        sentence: 'Does this have sugar in it?',
        meaningVi: 'Món này có đường không?',
        coreKeywords: ['does', 'have', 'sugar', 'in'],
        ipa: '/dʌz ðɪs hæv ˈʃʊɡər ɪn ɪt/',
      },
    ],
  },
  {
    id: 'frame-fnb-04',
    domain: 'fnb',
    domainNameVi: 'Gọi đồ ăn & Đồ uống',
    template: 'Could we get {bill_type}, please?',
    meaningVi: 'Cho chúng tôi xin hóa đơn thanh toán nhé.',
    phoneticTipVi: 'Âm /d/ lướt nhẹ /kəd wiː ɡet ðə bɪl pliːz/, không nhấn mạnh chữ "could".',
    slots: [
      {
        key: 'bill_type',
        labelVi: 'Hóa đơn hoặc biên lai',
        options: ['the bill', 'the check', 'the receipt'],
      },
    ],
    exemplars: [
      {
        sentence: 'Could we get the bill, please?',
        meaningVi: 'Cho chúng tôi xin hóa đơn thanh toán nhé.',
        coreKeywords: ['could', 'get', 'bill', 'please'],
        ipa: '/kəd wiː ɡet ðə bɪl pliːz/',
      },
      {
        sentence: 'Could we get the receipt, please?',
        meaningVi: 'Cho chúng tôi xin biên lai thanh toán nhé.',
        coreKeywords: ['could', 'get', 'receipt', 'please'],
        ipa: '/kəd wiː ɡet ðə rɪˈsiːt pliːz/',
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // DOMAIN 2: SHOPPING & RETAIL (shopping) - 4 FRAMES
  // ═════════════════════════════════════════════════════════════════════════════
  {
    id: 'frame-shop-01',
    domain: 'shopping',
    domainNameVi: 'Mua sắm & Giá cả',
    template: 'How much is this {item}?',
    meaningVi: 'Cái {đồ vật} này giá bao nhiêu?',
    phoneticTipVi: 'Nối âm /haʊ mʌ.tʃɪz ðɪs/, nhấn mạnh vào từ "how much" và tên món đồ.',
    slots: [
      {
        key: 'item',
        labelVi: 'Món đồ cần hỏi giá',
        options: ['t-shirt', 'jacket', 'souvenir', 'hat', 'bag'],
      },
    ],
    exemplars: [
      {
        sentence: 'How much is this t-shirt?',
        meaningVi: 'Chiếc áo phông này giá bao nhiêu?',
        coreKeywords: ['how', 'much', 'this', 't-shirt'],
        ipa: '/haʊ mʌtʃ ɪz ðɪs ˈtiː ʃɜːrt/',
      },
      {
        sentence: 'How much is this souvenir?',
        meaningVi: 'Món đồ lưu niệm này giá bao nhiêu?',
        coreKeywords: ['how', 'much', 'this', 'souvenir'],
        ipa: '/haʊ mʌtʃ ɪz ðɪs ˌsuːvəˈnɪr/',
      },
      {
        sentence: 'How much is this jacket?',
        meaningVi: 'Chiếc áo khoác này giá bao nhiêu?',
        coreKeywords: ['how', 'much', 'this', 'jacket'],
        ipa: '/haʊ mʌtʃ ɪz ðɪs ˈdʒækɪt/',
      },
    ],
  },
  {
    id: 'frame-shop-02',
    domain: 'shopping',
    domainNameVi: 'Mua sắm & Giá cả',
    template: 'Do you have this in {preference}?',
    meaningVi: 'Bạn có cái này ở {kích cỡ/màu sắc} không?',
    phoneticTipVi: 'Nối âm /duː juː hæv ðɪ.sɪn/, lên giọng nhẹ ở cuối câu hỏi.',
    slots: [
      {
        key: 'preference',
        labelVi: 'Kích cỡ hoặc màu sắc mong muốn',
        options: ['size M', 'size large', 'black', 'navy blue', 'a larger size'],
      },
    ],
    exemplars: [
      {
        sentence: 'Do you have this in size M?',
        meaningVi: 'Bạn có cái này ở cỡ vừa (size M) không?',
        coreKeywords: ['have', 'this', 'size', 'm'],
        ipa: '/duː juː hæv ðɪs ɪn saɪz em/',
      },
      {
        sentence: 'Do you have this in black?',
        meaningVi: 'Bạn có cái này màu đen không?',
        coreKeywords: ['have', 'this', 'black'],
        ipa: '/duː juː hæv ðɪs ɪn blæk/',
      },
      {
        sentence: 'Do you have this in a larger size?',
        meaningVi: 'Bạn có cái này ở cỡ lớn hơn không?',
        coreKeywords: ['have', 'this', 'larger', 'size'],
        ipa: '/duː juː hæv ðɪs ɪn ə ˈlɑːrdʒər saɪz/',
      },
    ],
  },
  {
    id: 'frame-shop-03',
    domain: 'shopping',
    domainNameVi: 'Mua sắm & Giá cả',
    template: 'Can I try {item_target} on, please?',
    meaningVi: 'Tôi có thể thử món đồ này được không?',
    phoneticTipVi: 'Nối âm đôi liên tiếp: /kə naɪ traɪ ðɪ.sɑːn/, lên giọng ở cuối câu xin phép.',
    slots: [
      {
        key: 'item_target',
        labelVi: 'Món đồ cần thử',
        options: ['this on', 'these shoes on', 'this jacket on'],
      },
    ],
    exemplars: [
      {
        sentence: 'Can I try this on, please?',
        meaningVi: 'Tôi có thể mặc thử cái này được không?',
        coreKeywords: ['can', 'try', 'this', 'on', 'please'],
        ipa: '/kə naɪ traɪ ðɪs ɑːn pliːz/',
      },
      {
        sentence: 'Can I try these shoes on, please?',
        meaningVi: 'Tôi có thể xỏ thử đôi giày này được không?',
        coreKeywords: ['can', 'try', 'shoes', 'on', 'please'],
        ipa: '/kə naɪ traɪ ðiːz ʃuːz ɑːn pliːz/',
      },
    ],
  },
  {
    id: 'frame-shop-04',
    domain: 'shopping',
    domainNameVi: 'Mua sắm & Giá cả',
    template: 'Do you accept {payment_method}?',
    meaningVi: 'Ở đây có chấp nhận thanh toán bằng {phương thức} không?',
    phoneticTipVi: 'Trọng âm rơi vào âm tiết thứ hai của từ "ac-CEPT" /əkˈsept/.',
    slots: [
      {
        key: 'payment_method',
        labelVi: 'Phương thức thanh toán',
        options: ['credit cards', 'cash', 'Apple Pay', 'foreign currency'],
      },
    ],
    exemplars: [
      {
        sentence: 'Do you accept credit cards?',
        meaningVi: 'Cửa hàng có chấp nhận thẻ tín dụng không?',
        coreKeywords: ['accept', 'credit', 'cards'],
        ipa: '/duː juː əkˈsept ˈkredɪt kɑːrdz/',
      },
      {
        sentence: 'Do you accept cash?',
        meaningVi: 'Cửa hàng có nhận tiền mặt không?',
        coreKeywords: ['accept', 'cash'],
        ipa: '/duː juː əkˈsept kæʃ/',
      },
      {
        sentence: 'Do you accept Apple Pay?',
        meaningVi: 'Cửa hàng có quẹt Apple Pay không?',
        coreKeywords: ['accept', 'apple', 'pay'],
        ipa: '/duː juː əkˈsept ˈæpl peɪ/',
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // DOMAIN 3: DIRECTIONS & TRANSPORT (directions) - 4 FRAMES
  // ═════════════════════════════════════════════════════════════════════════════
  {
    id: 'frame-dir-01',
    domain: 'directions',
    domainNameVi: 'Hỏi đường & Di chuyển',
    template: 'Excuse me, where is the {place}?',
    meaningVi: 'Xin lỗi, {địa điểm} ở đâu vậy ạ?',
    phoneticTipVi: 'Hạ giọng nhẹ ở cuối câu hỏi có từ để hỏi WH: /wer ɪz ðə.../.',
    slots: [
      {
        key: 'place',
        labelVi: 'Địa điểm cần tìm',
        options: ['nearest restroom', 'subway station', 'bus stop', 'pharmacy', 'elevator'],
      },
    ],
    exemplars: [
      {
        sentence: 'Excuse me, where is the nearest restroom?',
        meaningVi: 'Xin lỗi, nhà vệ sinh gần nhất ở đâu ạ?',
        coreKeywords: ['excuse', 'where', 'nearest', 'restroom'],
        ipa: '/ɪkˈskjuːz miː wer ɪz ðə ˈnɪrɪst ˈrestruːm/',
      },
      {
        sentence: 'Excuse me, where is the subway station?',
        meaningVi: 'Xin lỗi, ga tàu điện ngầm ở đâu vậy?',
        coreKeywords: ['excuse', 'where', 'subway', 'station'],
        ipa: '/ɪkˈskjuːz miː wer ɪz ðə ˈsʌbweɪ ˈsteɪʃn/',
      },
      {
        sentence: 'Excuse me, where is the pharmacy?',
        meaningVi: 'Xin lỗi, hiệu thuốc tây ở đâu ạ?',
        coreKeywords: ['excuse', 'where', 'pharmacy'],
        ipa: '/ɪkˈskjuːz miː wer ɪz ðə ˈfɑːrməsi/',
      },
    ],
  },
  {
    id: 'frame-dir-02',
    domain: 'directions',
    domainNameVi: 'Hỏi đường & Di chuyển',
    template: 'How do I get to {destination}?',
    meaningVi: 'Làm sao để tôi đi đến {điểm đến}?',
    phoneticTipVi: 'Nối âm lướt nhẹ: /haʊ də waɪ ɡet tə.../.',
    slots: [
      {
        key: 'destination',
        labelVi: 'Điểm đến mong muốn',
        options: ['the city center', 'terminal 2', 'the museum', 'gate 5'],
      },
    ],
    exemplars: [
      {
        sentence: 'How do I get to the city center?',
        meaningVi: 'Làm sao để tôi đi đến khu trung tâm thành phố?',
        coreKeywords: ['how', 'get', 'city', 'center'],
        ipa: '/haʊ duː aɪ ɡet tə ðə ˈsɪti ˈsentər/',
      },
      {
        sentence: 'How do I get to Terminal Two?',
        meaningVi: 'Làm thế nào để tôi sang nhà ga số 2?',
        coreKeywords: ['how', 'get', 'terminal', 'two'],
        ipa: '/haʊ duː aɪ ɡet tə ˈtɜːrmɪnl tuː/',
      },
    ],
  },
  {
    id: 'frame-dir-03',
    domain: 'directions',
    domainNameVi: 'Hỏi đường & Di chuyển',
    template: 'Is it {distance_modifier}?',
    meaningVi: 'Nó có xa đây không?',
    phoneticTipVi: 'Ngữ điệu vút lên ở cuối câu hỏi Yes/No: /ɪ zɪt fɑːr frəm hɪr ↗/.',
    slots: [
      {
        key: 'distance_modifier',
        labelVi: 'Mức độ khoảng cách',
        options: ['far from here', 'within walking distance'],
      },
    ],
    exemplars: [
      {
        sentence: 'Is it far from here?',
        meaningVi: 'Nó có xa đây không?',
        coreKeywords: ['is', 'far', 'from', 'here'],
        ipa: '/ɪz ɪt fɑːr frəm hɪr/',
      },
      {
        sentence: 'Is it within walking distance?',
        meaningVi: 'Chỗ đó có đi bộ tới được không?',
        coreKeywords: ['within', 'walking', 'distance'],
        ipa: '/ɪz ɪt wɪˈðɪn ˈwɔːkɪŋ ˈdɪstəns/',
      },
    ],
  },
  {
    id: 'frame-dir-04',
    domain: 'directions',
    domainNameVi: 'Hỏi đường & Di chuyển',
    template: 'Can you take me to {address}, please?',
    meaningVi: 'Bác tài chở tôi đến {địa chỉ} này nhé.',
    phoneticTipVi: 'Nối âm /kən juː teɪk miː tə/, nhấn mạnh vào tên địa chỉ cần đến.',
    slots: [
      {
        key: 'address',
        labelVi: 'Địa chỉ hoặc tên địa điểm đến',
        options: ['this hotel', 'the airport', 'this address', 'the train station'],
      },
    ],
    exemplars: [
      {
        sentence: 'Can you take me to this hotel, please?',
        meaningVi: 'Bác tài chở tôi về khách sạn này nhé.',
        coreKeywords: ['take', 'me', 'hotel', 'please'],
        ipa: '/kən juː teɪk miː tə ðɪs hoʊˈtel pliːz/',
      },
      {
        sentence: 'Can you take me to the airport, please?',
        meaningVi: 'Chở tôi ra sân bay nhé, làm ơn.',
        coreKeywords: ['take', 'me', 'airport', 'please'],
        ipa: '/kən juː teɪk miː tə ði ˈerpɔːrt pliːz/',
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // DOMAIN 4: HOTEL & ACCOMMODATION (hotel) - 4 FRAMES
  // ═════════════════════════════════════════════════════════════════════════════
  {
    id: 'frame-hotel-01',
    domain: 'hotel',
    domainNameVi: 'Khách sạn & Lưu trú',
    template: 'I have a reservation under {name}.',
    meaningVi: 'Tôi có đặt phòng trước dưới tên {tên}.',
    phoneticTipVi: 'Trọng âm từ rơi vào âm tiết thứ ba của /ˌrezərˈveɪʃn/.',
    slots: [
      {
        key: 'name',
        labelVi: 'Tên người đứng đặt phòng',
        options: ['Nguyen', 'Tran', 'Alex', 'Smith'],
      },
    ],
    exemplars: [
      {
        sentence: 'I have a reservation under Nguyen.',
        meaningVi: 'Tôi có đặt phòng trước dưới tên Nguyễn.',
        coreKeywords: ['have', 'reservation', 'under', 'nguyen'],
        ipa: '/aɪ hæv ə ˌrezərˈveɪʃn ˈʌndər ˈnuːjən/',
      },
      {
        sentence: 'I have a reservation under Alex.',
        meaningVi: 'Tôi có đặt phòng trước dưới tên Alex.',
        coreKeywords: ['have', 'reservation', 'under', 'alex'],
        ipa: '/aɪ hæv ə ˌrezərˈveɪʃn ˈʌndər ˈælɪks/',
      },
    ],
  },
  {
    id: 'frame-hotel-02',
    domain: 'hotel',
    domainNameVi: 'Khách sạn & Lưu trú',
    template: 'What time is {event}?',
    meaningVi: 'Mấy giờ thì {sự kiện/hoạt động} diễn ra?',
    phoneticTipVi: 'Nuốt nhẹ âm /t/ giữa "what" và "time": /wɑː.taɪm ɪz/.',
    slots: [
      {
        key: 'event',
        labelVi: 'Hoạt động hoặc mốc thời gian',
        options: ['check-out', 'breakfast served', 'the airport shuttle'],
      },
    ],
    exemplars: [
      {
        sentence: 'What time is check-out?',
        meaningVi: 'Mấy giờ là hạn trả phòng?',
        coreKeywords: ['what', 'time', 'check-out'],
        ipa: '/wɑːt taɪm ɪz ˈtʃekaʊt/',
      },
      {
        sentence: 'What time is breakfast served?',
        meaningVi: 'Bữa sáng được phục vụ lúc mấy giờ vậy?',
        coreKeywords: ['what', 'time', 'breakfast', 'served'],
        ipa: '/wɑːt taɪm ɪz ˈbrekfəst sɜːrvd/',
      },
    ],
  },
  {
    id: 'frame-hotel-03',
    domain: 'hotel',
    domainNameVi: 'Khách sạn & Lưu trú',
    template: 'What is the {network} password, please?',
    meaningVi: 'Mật khẩu Wi-Fi ở đây là gì vậy?',
    phoneticTipVi: 'Phát âm chuẩn cụm /wɑː.tɪz ðə ˈwaɪ faɪ ˈpæswɜːrd/.',
    slots: [
      {
        key: 'network',
        labelVi: 'Mạng internet cần truy cập',
        options: ['Wi-Fi', 'guest network'],
      },
    ],
    exemplars: [
      {
        sentence: 'What is the Wi-Fi password, please?',
        meaningVi: 'Mật khẩu Wi-Fi ở đây là gì vậy làm ơn?',
        coreKeywords: ['what', 'wifi', 'password', 'please'],
        ipa: '/wɑːt ɪz ðə ˈwaɪ faɪ ˈpæswɜːrd pliːz/',
      },
      {
        sentence: 'What is the guest network password, please?',
        meaningVi: 'Cho tôi xin mật khẩu mạng khách được không?',
        coreKeywords: ['what', 'guest', 'network', 'password', 'please'],
        ipa: '/wɑːt ɪz ðə ɡest ˈnetwɜːrk ˈpæswɜːrd pliːz/',
      },
    ],
  },
  {
    id: 'frame-hotel-04',
    domain: 'hotel',
    domainNameVi: 'Khách sạn & Lưu trú',
    template: 'The {amenity} in my room is not working.',
    meaningVi: '{Thiết bị} trong phòng tôi không hoạt động.',
    phoneticTipVi: 'Nối âm /ðiː ... ɪn maɪ ruːm ɪz nɑːt ˈwɜːrkɪŋ/, nhấn mạnh "not working".',
    slots: [
      {
        key: 'amenity',
        labelVi: 'Thiết bị gặp sự cố',
        options: ['air conditioner', 'hot water', 'TV', 'key card', 'hairdryer'],
      },
    ],
    exemplars: [
      {
        sentence: 'The air conditioner in my room is not working.',
        meaningVi: 'Máy điều hòa trong phòng tôi không hoạt động.',
        coreKeywords: ['air', 'conditioner', 'room', 'not', 'working'],
        ipa: '/ði ˈer kəndɪʃənər ɪn maɪ ruːm ɪz nɑːt ˈwɜːrkɪŋ/',
      },
      {
        sentence: 'The hot water in my room is not working.',
        meaningVi: 'Nước nóng trong phòng tôi không chảy.',
        coreKeywords: ['hot', 'water', 'room', 'not', 'working'],
        ipa: '/ðə hɑːt ˈwɔːtər ɪn maɪ ruːm ɪz nɑːt ˈwɜːrkɪŋ/',
      },
      {
        sentence: 'The key card in my room is not working.',
        meaningVi: 'Thẻ từ phòng tôi không quẹt mở được.',
        coreKeywords: ['key', 'card', 'not', 'working'],
        ipa: '/ðə ˈkiː kɑːrd ɪn maɪ ruːm ɪz nɑːt ˈwɜːrkɪŋ/',
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // DOMAIN 5: WORKPLACE & OFFICE (workplace) - 4 FRAMES
  // ═════════════════════════════════════════════════════════════════════════════
  {
    id: 'frame-work-01',
    domain: 'workplace',
    domainNameVi: 'Công sở & Đồng nghiệp',
    template: 'Could you please send me the {document}?',
    meaningVi: 'Bạn có thể gửi cho tôi {tài liệu} được không?',
    phoneticTipVi: 'Âm /d/ lướt nhẹ: /kəd juː pliːz send miː ðə/.',
    slots: [
      {
        key: 'document',
        labelVi: 'Tài liệu hoặc file công việc',
        options: ['sales report', 'meeting link', 'updated invoice', 'project presentation'],
      },
    ],
    exemplars: [
      {
        sentence: 'Could you please send me the sales report?',
        meaningVi: 'Bạn gửi giúp tôi bản báo cáo doanh số được không?',
        coreKeywords: ['could', 'send', 'sales', 'report'],
        ipa: '/kəd juː pliːz send miː ðə seɪlz rɪˈpɔːrt/',
      },
      {
        sentence: 'Could you please send me the meeting link?',
        meaningVi: 'Bạn gửi giúp tôi đường link cuộc họp được không?',
        coreKeywords: ['could', 'send', 'meeting', 'link'],
        ipa: '/kəd juː pliːz send miː ðə ˈmiːtɪŋ lɪŋk/',
      },
      {
        sentence: 'Could you please send me the updated invoice?',
        meaningVi: 'Bạn gửi giúp tôi hóa đơn đã cập nhật được không?',
        coreKeywords: ['could', 'send', 'updated', 'invoice'],
        ipa: '/kəd juː pliːz send miː ði ˌʌpˈdeɪtɪd ˈɪnvɔɪs/',
      },
    ],
  },
  {
    id: 'frame-work-02',
    domain: 'workplace',
    domainNameVi: 'Công sở & Đồng nghiệp',
    template: 'Are you free for {duration_or_topic}?',
    meaningVi: 'Bạn có rảnh {thời gian/chủ đề} không?',
    phoneticTipVi: 'Lên giọng nhẹ ở cuối câu hỏi Yes/No: /ɑːr juː friː fər... ↗/.',
    slots: [
      {
        key: 'duration_or_topic',
        labelVi: 'Khoảng thời gian hoặc cuộc trao đổi nhanh',
        options: ['five minutes', 'a quick sync', 'a quick call', 'a coffee break'],
      },
    ],
    exemplars: [
      {
        sentence: 'Are you free for five minutes?',
        meaningVi: 'Bạn có rảnh 5 phút không?',
        coreKeywords: ['are', 'free', 'five', 'minutes'],
        ipa: '/ɑːr juː friː fər faɪv ˈmɪnɪts/',
      },
      {
        sentence: 'Are you free for a quick sync?',
        meaningVi: 'Bạn có rảnh trao đổi nhanh một chút không?',
        coreKeywords: ['are', 'free', 'quick', 'sync'],
        ipa: '/ɑːr juː friː fər ə kwɪk sɪŋk/',
      },
    ],
  },
  {
    id: 'frame-work-03',
    domain: 'workplace',
    domainNameVi: 'Công sở & Đồng nghiệp',
    template: 'I have a quick question about {topic}.',
    meaningVi: 'Tôi có một câu hỏi nhanh về {chủ đề}.',
    phoneticTipVi: 'Nối âm mượt mà: /aɪ hæ.və kwɪk ˈkwestʃən əˈbaʊt/.',
    slots: [
      {
        key: 'topic',
        labelVi: 'Chủ đề thắc mắc',
        options: ['the project deadline', 'the invoice', 'the contract', 'the client feedback'],
      },
    ],
    exemplars: [
      {
        sentence: 'I have a quick question about the project deadline.',
        meaningVi: 'Tôi có một câu hỏi nhanh về hạn chót của dự án.',
        coreKeywords: ['have', 'quick', 'question', 'project', 'deadline'],
        ipa: '/aɪ hæv ə kwɪk ˈkwestʃən əˈbaʊt ðə ˈprɑːdʒekt ˈdedlaɪn/',
      },
      {
        sentence: 'I have a quick question about the invoice.',
        meaningVi: 'Tôi có một câu hỏi nhanh về hóa đơn này.',
        coreKeywords: ['have', 'quick', 'question', 'invoice'],
        ipa: '/aɪ hæv ə kwɪk ˈkwestʃən əˈbaʊt ði ˈɪnvɔɪs/',
      },
    ],
  },
  {
    id: 'frame-work-04',
    domain: 'workplace',
    domainNameVi: 'Công sở & Đồng nghiệp',
    template: 'Let me check and get back to you by {time}.',
    meaningVi: 'Để tôi kiểm tra rồi phản hồi lại bạn trước {thời gian}.',
    phoneticTipVi: 'Cụm "get back to you" nối âm tự nhiên: /ɡet bæk tə juː/.',
    slots: [
      {
        key: 'time',
        labelVi: 'Mốc thời gian cam kết phản hồi',
        options: ['this afternoon', 'tomorrow morning', 'five oclock', 'end of day'],
      },
    ],
    exemplars: [
      {
        sentence: 'Let me check and get back to you by this afternoon.',
        meaningVi: 'Để tôi kiểm tra rồi báo lại bạn trước chiều nay nhé.',
        coreKeywords: ['let', 'check', 'back', 'this', 'afternoon'],
        ipa: '/let miː tʃek ənd ɡet bæk tə juː baɪ ðɪs ˌæftərˈnuːn/',
      },
      {
        sentence: 'Let me check and get back to you by tomorrow morning.',
        meaningVi: 'Để tôi kiểm tra rồi phản hồi lại bạn trước sáng mai nhé.',
        coreKeywords: ['let', 'check', 'back', 'tomorrow', 'morning'],
        ipa: '/let miː tʃek ənd ɡet bæk tə juː baɪ təˈmɔːroʊ ˈmɔːrnɪŋ/',
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // DOMAIN 6: EMERGENCY & HEALTH (emergency) - 4 FRAMES
  // ═════════════════════════════════════════════════════════════════════════════
  {
    id: 'frame-emer-01',
    domain: 'emergency',
    domainNameVi: 'Khẩn cấp & Y tế',
    template: 'I need {assistance}, please.',
    meaningVi: 'Tôi cần trợ giúp khẩn cấp, làm ơn.',
    phoneticTipVi: 'Bật rõ âm chặn /d/ trong "need" và âm mím môi bật /p/ trong "help".',
    slots: [
      {
        key: 'assistance',
        labelVi: 'Loại hình trợ giúp cần khẩn cấp',
        options: ['help', 'an ambulance', 'the police', 'a doctor'],
      },
    ],
    exemplars: [
      {
        sentence: 'I need help, please.',
        meaningVi: 'Tôi cần trợ giúp khẩn cấp, làm ơn.',
        coreKeywords: ['need', 'help', 'please'],
        ipa: '/aɪ niːd help pliːz/',
      },
      {
        sentence: 'I need a doctor, please.',
        meaningVi: 'Tôi cần gặp bác sĩ gấp, làm ơn.',
        coreKeywords: ['need', 'doctor', 'please'],
        ipa: '/aɪ niːd ə ˈdɑːktər pliːz/',
      },
      {
        sentence: 'I need an ambulance, please.',
        meaningVi: 'Tôi cần gọi xe cấp cứu gấp, làm ơn.',
        coreKeywords: ['need', 'ambulance', 'please'],
        ipa: '/aɪ niːd ən ˈæmbjələns pliːz/',
      },
    ],
  },
  {
    id: 'frame-emer-02',
    domain: 'emergency',
    domainNameVi: 'Khẩn cấp & Y tế',
    template: 'Where is the nearest {facility}?',
    meaningVi: 'Cơ sở {y tế/cứu hộ} gần nhất ở đâu?',
    phoneticTipVi: 'Trọng âm rơi vào vần đầu của từ "NEAR-est" /ˈnɪrɪst/.',
    slots: [
      {
        key: 'facility',
        labelVi: 'Cơ sở hỗ trợ gần nhất',
        options: ['hospital', 'pharmacy', 'police station', 'clinic'],
      },
    ],
    exemplars: [
      {
        sentence: 'Where is the nearest hospital?',
        meaningVi: 'Bệnh viện gần nhất ở đâu ạ?',
        coreKeywords: ['where', 'nearest', 'hospital'],
        ipa: '/wer ɪz ðə ˈnɪrɪst ˈhɑːspɪtl/',
      },
      {
        sentence: 'Where is the nearest pharmacy?',
        meaningVi: 'Hiệu thuốc gần nhất ở đâu ạ?',
        coreKeywords: ['where', 'nearest', 'pharmacy'],
        ipa: '/wer ɪz ðə ˈnɪrɪst ˈfɑːrməsi/',
      },
      {
        sentence: 'Where is the nearest police station?',
        meaningVi: 'Đồn cảnh sát gần nhất ở đâu ạ?',
        coreKeywords: ['where', 'nearest', 'police', 'station'],
        ipa: '/wer ɪz ðə ˈnɪrɪst pəˈliːs ˈsteɪʃn/',
      },
    ],
  },
  {
    id: 'frame-emer-03',
    domain: 'emergency',
    domainNameVi: 'Khẩn cấp & Y tế',
    template: 'I lost my {item}.',
    meaningVi: 'Tôi đã làm mất {đồ vật cá nhân}.',
    phoneticTipVi: 'Bật rõ âm đuôi /t/ trong "lost": /aɪ lɔːst maɪ/.',
    slots: [
      {
        key: 'item',
        labelVi: 'Đồ đạc bị mất hoặc thất lạc',
        options: ['passport', 'wallet', 'baggage', 'phone', 'room key'],
      },
    ],
    exemplars: [
      {
        sentence: 'I lost my passport.',
        meaningVi: 'Tôi bị mất hộ chiếu rồi.',
        coreKeywords: ['lost', 'my', 'passport'],
        ipa: '/aɪ lɔːst maɪ ˈpæspɔːrt/',
      },
      {
        sentence: 'I lost my wallet.',
        meaningVi: 'Tôi bị mất ví tiền rồi.',
        coreKeywords: ['lost', 'my', 'wallet'],
        ipa: '/aɪ lɔːst maɪ ˈwɑːlɪt/',
      },
      {
        sentence: 'I lost my baggage.',
        meaningVi: 'Tôi bị thất lạc hành lý rồi.',
        coreKeywords: ['lost', 'my', 'baggage'],
        ipa: '/aɪ lɔːst maɪ ˈbæɡɪdʒ/',
      },
    ],
  },
  {
    id: 'frame-emer-04',
    domain: 'emergency',
    domainNameVi: 'Khẩn cấp & Y tế',
    template: 'I feel sick. I have a severe {symptom}.',
    meaningVi: 'Tôi thấy không khỏe. Tôi bị {triệu chứng} dữ dội.',
    phoneticTipVi: 'Phát âm chuẩn từ "severe" /səˈvɪr/, nối âm "have a" /hæ.və/.',
    slots: [
      {
        key: 'symptom',
        labelVi: 'Triệu chứng bệnh lý',
        options: ['headache', 'stomachache', 'fever', 'allergic reaction'],
      },
    ],
    exemplars: [
      {
        sentence: 'I feel sick. I have a severe headache.',
        meaningVi: 'Tôi thấy mệt quá. Tôi bị đau đầu dữ dội.',
        coreKeywords: ['feel', 'sick', 'severe', 'headache'],
        ipa: '/aɪ fiːl sɪk aɪ hæv ə səˈvɪr ˈhedeɪk/',
      },
      {
        sentence: 'I feel sick. I have a severe stomachache.',
        meaningVi: 'Tôi thấy không khỏe. Tôi bị đau dạ dày quằn quại.',
        coreKeywords: ['feel', 'sick', 'severe', 'stomachache'],
        ipa: '/aɪ fiːl sɪk aɪ hæv ə səˈvɪr ˈstʌməkeɪk/',
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // DOMAIN 7: TIME-BUYING FILLERS & LUBRICANTS (fillers) - 4 FRAMES
  // ═════════════════════════════════════════════════════════════════════════════
  {
    id: 'frame-fill-01',
    domain: 'fillers',
    domainNameVi: 'Câu đệm mua thời gian',
    template: 'Well, let me {action_thought}...',
    meaningVi: 'À, để tôi xem nào... / Để tôi nghĩ một chút nhé...',
    phoneticTipVi: 'Kéo dài nhẹ chữ "well..." để não bộ có thêm 2 giây định hình câu trả lời tự nhiên.',
    slots: [
      {
        key: 'action_thought',
        labelVi: 'Cụm câu đệm tự nhiên',
        options: ['see', 'think', 'check'],
      },
    ],
    exemplars: [
      {
        sentence: 'Well, let me see...',
        meaningVi: 'À, để tôi xem nào...',
        coreKeywords: ['well', 'let', 'see'],
        ipa: '/wel let miː siː/',
      },
      {
        sentence: 'Well, let me think...',
        meaningVi: 'À, để tôi suy nghĩ một chút...',
        coreKeywords: ['well', 'let', 'think'],
        ipa: '/wel let miː θɪŋk/',
      },
    ],
  },
  {
    id: 'frame-fill-02',
    domain: 'fillers',
    domainNameVi: 'Câu đệm mua thời gian',
    template: 'To be honest, {clause_qualifier}...',
    meaningVi: 'Thành thật mà nói... / Thú thật là...',
    phoneticTipVi: 'Cụm "to be honest" phát âm /tuː biː ˈɑːnɪst/, nuốt nhẹ âm /h/ câm trong honest.',
    slots: [
      {
        key: 'clause_qualifier',
        labelVi: 'Mệnh đề tiếp nối',
        options: ["I don't know", 'I am not sure', 'it is difficult'],
      },
    ],
    exemplars: [
      {
        sentence: "To be honest, I don't know.",
        meaningVi: 'Thành thật mà nói, tôi không biết.',
        coreKeywords: ['honest', 'dont', 'know'],
        ipa: '/tuː biː ˈɑːnɪst aɪ doʊnt noʊ/',
      },
      {
        sentence: 'To be honest, I am not sure.',
        meaningVi: 'Thật lòng mà nói, tôi không chắc lắm.',
        coreKeywords: ['honest', 'not', 'sure'],
        ipa: '/tuː biː ˈɑːnɪst aɪ æm nɑːt ʃʊr/',
      },
    ],
  },
  {
    id: 'frame-fill-03',
    domain: 'fillers',
    domainNameVi: 'Câu đệm mua thời gian',
    template: 'You know, {statement_continuation}...',
    meaningVi: 'Bạn biết đấy... / Như bạn biết đấy...',
    phoneticTipVi: 'Cụm "you know" phát âm nhẹ nhàng /juː noʊ/, đóng vai trò giữ nhịp hội thoại.',
    slots: [
      {
        key: 'statement_continuation',
        labelVi: 'Ý kiến tiếp nối',
        options: ['practice makes perfect', 'it takes time', 'every day is a chance'],
      },
    ],
    exemplars: [
      {
        sentence: 'You know, it takes time.',
        meaningVi: 'Bạn biết đấy, mọi việc đều cần có thời gian.',
        coreKeywords: ['you', 'know', 'takes', 'time'],
        ipa: '/juː noʊ ɪt teɪks taɪm/',
      },
      {
        sentence: 'You know, practice makes perfect.',
        meaningVi: 'Bạn biết đấy, luyện tập tạo nên sự hoàn hảo.',
        coreKeywords: ['you', 'know', 'practice', 'makes', 'perfect'],
        ipa: '/juː noʊ ˈpræktɪs meɪks ˈpɜːrfɪkt/',
      },
    ],
  },
  {
    id: 'frame-fill-04',
    domain: 'fillers',
    domainNameVi: 'Câu đệm mua thời gian',
    template: 'In my opinion, {viewpoint}...',
    meaningVi: 'Theo quan điểm của tôi... / Tôi nghĩ là...',
    phoneticTipVi: 'Cụm "in my opinion" phát âm trôi chảy: /ɪn maɪ əˈpɪnjən/, nhấn mạnh vào âm tiết thứ hai.',
    slots: [
      {
        key: 'viewpoint',
        labelVi: 'Quan điểm cá nhân',
        options: ['this is the best choice', 'it is worth trying', 'practice is important'],
      },
    ],
    exemplars: [
      {
        sentence: 'In my opinion, this is the best choice.',
        meaningVi: 'Theo quan điểm của tôi, đây là sự lựa chọn tốt nhất.',
        coreKeywords: ['opinion', 'best', 'choice'],
        ipa: '/ɪn maɪ əˈpɪnjən ðɪs ɪz ðə best tʃɔɪs/',
      },
      {
        sentence: 'In my opinion, it is worth trying.',
        meaningVi: 'Theo quan điểm của tôi, điều này rất đáng để thử.',
        coreKeywords: ['opinion', 'worth', 'trying'],
        ipa: '/ɪn maɪ əˈpɪnjən ɪt ɪz wɜːrθ ˈtraɪɪŋ/',
      },
    ],
  },
];
