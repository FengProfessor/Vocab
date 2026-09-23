/**
 * LingoPro Speaking Topic Library
 * Category: Social
 * Subcategory: Giving Directions
 * File: src/data/speaking/topic-library/social/giving-directions.ts
 *
 * 6 sub-topics covering asking for and giving directions in different scenarios.
 * CEFR Range: A1 - B1
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const GIVING_DIRECTIONS_ITEMS: TopicLibraryItem[] = [
  {
    id: 'soc-dir-01',
    category: 'social',
    subcategory: 'giving-directions',
    level: 'A1',
    titleEn: 'Directions to a nearby restaurant',
    titleVi: 'Chỉ đường đến một nhà hàng gần đó',
    icon: 'Map',
    situationVi: 'Một du khách hỏi bạn đường đến một nhà hàng nổi tiếng cách đó không xa. Bạn hướng dẫn họ những bước cơ bản để đến nơi.',
    sampleDialogue: [
      { speaker: 'A', text: 'Excuse me, do you know where the Green Lotus Restaurant is?', translationVi: 'Xin lỗi, bạn có biết nhà hàng Green Lotus ở đâu không?' },
      { speaker: 'B', text: 'Yes, it is very close. Go straight down this street.', translationVi: 'Có, nó rất gần đây. Đi thẳng theo con đường này.' },
      { speaker: 'A', text: 'Go straight. Okay. And then?', translationVi: 'Đi thẳng. Vâng. Rồi sao nữa?' },
      { speaker: 'B', text: 'Walk for about 5 minutes, then turn left at the traffic lights.', translationVi: 'Đi bộ khoảng 5 phút, sau đó rẽ trái ở chỗ đèn giao thông.' },
      { speaker: 'A', text: 'Turn left at the traffic lights. Is it on the right or left?', translationVi: 'Rẽ trái ở đèn giao thông. Nó ở bên phải hay trái vậy?' },
      { speaker: 'B', text: 'It will be on your right, next to a bank.', translationVi: 'Nó sẽ nằm bên tay phải của bạn, cạnh một ngân hàng.' }
    ],
    keyVocabulary: [
      {
        term: 'straight',
        ipa: '/streɪt/',
        partOfSpeech: 'adv',
        meaningVi: 'thẳng',
        exampleEn: 'Go straight ahead.',
        exampleVi: 'Đi thẳng về phía trước.',
        associatedActions: [
          { en: 'walk straight ahead', vi: 'đi thẳng về phía trước' },
          { en: 'keep going on pavement', vi: 'tiếp tục bước đi trên vỉa hè' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'turn',
        ipa: '/tɜːrn/',
        partOfSpeech: 'verb',
        meaningVi: 'rẽ, quay',
        exampleEn: 'Turn right at the corner.',
        exampleVi: 'Rẽ phải ở góc phố.',
        associatedActions: [
          { en: 'turn left at intersection', vi: 'rẽ trái ở ngã tư' },
          { en: 'signal before turning', vi: 'bật xi-nhan trước khi rẽ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'traffic lights',
        ipa: '/ˈtræfɪk laɪts/',
        partOfSpeech: 'noun',
        meaningVi: 'đèn giao thông',
        exampleEn: 'Stop at the traffic lights.',
        exampleVi: 'Dừng lại ở chỗ đèn giao thông.',
        associatedActions: [
          { en: 'wait for green light', vi: 'chờ đèn chuyển sang xanh' },
          { en: 'halt at red signal', vi: 'dừng lại khi gặp tín hiệu đỏ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'next to',
        ipa: '/nekst tu/',
        partOfSpeech: 'prep',
        meaningVi: 'bên cạnh',
        exampleEn: 'My house is next to a park.',
        exampleVi: 'Nhà tôi ở cạnh công viên.',
        associatedActions: [
          { en: 'stand beside storefront', vi: 'đứng bên cạnh mặt tiền cửa hàng' },
          { en: 'locate adjacent building', vi: 'xác định tòa nhà liền kề' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'bank',
        ipa: '/bæŋk/',
        partOfSpeech: 'noun',
        meaningVi: 'ngân hàng',
        exampleEn: 'I need to go to the bank.',
        exampleVi: 'Tôi cần đi đến ngân hàng.',
        associatedActions: [
          { en: 'walk into bank branch', vi: 'bước vào chi nhánh ngân hàng' },
          { en: 'spot bank logo outside', vi: 'nhận ra biểu tượng ngân hàng bên ngoài' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Do you know where... is?', translationVi: 'Bạn có biết ... ở đâu không?' },
      { phrase: 'Go straight down this street.', translationVi: 'Đi thẳng theo con phố này.' },
      { phrase: 'Turn left / Turn right.', translationVi: 'Rẽ trái / Rẽ phải.' },
      { phrase: 'Walk for about 5 minutes.', translationVi: 'Đi bộ khoảng 5 phút.' },
      { phrase: 'It will be on your right.', translationVi: 'Nó sẽ ở bên tay phải của bạn.' }
    ],
    aiTutorPrompt: 'You are walking on the street. The user will ask you for directions to a restaurant. Give them simple and clear instructions using basic directional vocabulary.',
    tags: ['directions', 'walking', 'tourist']
  },
  {
    id: 'soc-dir-02',
    category: 'social',
    subcategory: 'giving-directions',
    level: 'A1',
    titleEn: 'Directions to the nearest ATM',
    titleVi: 'Chỉ đường đến máy ATM gần nhất',
    icon: 'CreditCard',
    situationVi: 'Bạn cần rút tiền mặt nhưng không biết máy ATM ở đâu. Bạn hỏi thăm một nhân viên cửa hàng tiện lợi.',
    sampleDialogue: [
      { speaker: 'A', text: 'Hello, is there an ATM near here?', translationVi: 'Xin chào, có máy ATM nào gần đây không?' },
      { speaker: 'B', text: 'Yes, there is one across the street.', translationVi: 'Có, có một cái ở bên kia đường.' },
      { speaker: 'A', text: 'Across the street? I do not see it.', translationVi: 'Bên kia đường sao? Tôi không thấy.' },
      { speaker: 'B', text: 'It is inside the supermarket. Go out of this shop and cross the road.', translationVi: 'Nó ở bên trong siêu thị. Bạn ra khỏi cửa hàng này và sang đường.' },
      { speaker: 'A', text: 'Inside the supermarket. Got it. Thank you!', translationVi: 'Bên trong siêu thị. Tôi hiểu rồi. Cảm ơn bạn!' },
      { speaker: 'B', text: 'You are welcome!', translationVi: 'Không có chi!' }
    ],
    keyVocabulary: [
      {
        term: 'near',
        ipa: '/nɪr/',
        partOfSpeech: 'prep',
        meaningVi: 'gần',
        exampleEn: 'Is there a cafe near here?',
        exampleVi: 'Có quán cà phê nào gần đây không?',
        associatedActions: [
          { en: 'check nearby landmarks', vi: 'kiểm tra các địa danh ở gần' },
          { en: 'reach destination quickly', vi: 'đến nơi một cách nhanh chóng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1524813686514-a57563d77d66?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'across',
        ipa: '/əˈkrɔːs/',
        partOfSpeech: 'prep',
        meaningVi: 'ngang qua, bên kia',
        exampleEn: 'He walked across the street.',
        exampleVi: 'Anh ấy đi sang đường.',
        associatedActions: [
          { en: 'look across street', vi: 'nhìn sang bên kia đường' },
          { en: 'wave from opposite sidewalk', vi: 'vẫy tay từ vỉa hè đối diện' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'inside',
        ipa: '/ˌɪnˈsaɪd/',
        partOfSpeech: 'prep',
        meaningVi: 'bên trong',
        exampleEn: 'It is warm inside the house.',
        exampleVi: 'Bên trong nhà rất ấm.',
        associatedActions: [
          { en: 'enter sliding glass doors', vi: 'bước vào cửa kính trượt' },
          { en: 'step into building lobby', vi: 'bước vào sảnh tòa nhà' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'supermarket',
        ipa: '/ˈsuːpərmɑːrkɪt/',
        partOfSpeech: 'noun',
        meaningVi: 'siêu thị',
        exampleEn: 'I buy groceries at the supermarket.',
        exampleVi: 'Tôi mua thực phẩm ở siêu thị.',
        associatedActions: [
          { en: 'push shopping cart', vi: 'đẩy xe đẩy mua sắm' },
          { en: 'browse grocery aisles', vi: 'dạo qua các lối đi siêu thị' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'cross',
        ipa: '/krɔːs/',
        partOfSpeech: 'verb',
        meaningVi: 'băng qua',
        exampleEn: 'Look both ways before you cross.',
        exampleVi: 'Hãy nhìn hai bên trước khi bạn sang đường.',
        associatedActions: [
          { en: 'use pedestrian zebra crossing', vi: 'sử dụng vạch kẻ đường cho người đi bộ' },
          { en: 'look both ways carefully', vi: 'cẩn thận quan sát cả hai chiều' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Is there an ATM near here?', translationVi: 'Có máy ATM nào gần đây không?' },
      { phrase: 'Across the street.', translationVi: 'Bên kia đường.' },
      { phrase: 'Inside the building.', translationVi: 'Bên trong tòa nhà.' },
      { phrase: 'Cross the road.', translationVi: 'Băng qua đường.' },
      { phrase: 'You cannot miss it.', translationVi: 'Bạn sẽ không thể bỏ lỡ (không thể không thấy) nó đâu.' }
    ],
    aiTutorPrompt: 'You are a shop assistant. The user asks you where the nearest ATM is. Tell them it is across the street inside a supermarket.',
    tags: ['directions', 'ATM', 'shopping']
  },
  {
    id: 'soc-dir-03',
    category: 'social',
    subcategory: 'giving-directions',
    level: 'A2',
    titleEn: 'Guiding someone through a building',
    titleVi: 'Hướng dẫn ai đó đi lại trong tòa nhà',
    icon: 'Building',
    situationVi: 'Một người giao hàng hỏi bạn cách đi đến văn phòng công ty XYZ trong một tòa nhà văn phòng lớn. Bạn hướng dẫn họ cách dùng thang máy và tìm phòng.',
    sampleDialogue: [
      { speaker: 'A', text: 'Excuse me, I have a delivery for XYZ Company. Where are they located?', translationVi: 'Xin lỗi, tôi có món hàng giao cho công ty XYZ. Họ ở đâu vậy?' },
      { speaker: 'B', text: 'They are on the 4th floor. You need to take the elevators over there.', translationVi: 'Họ ở tầng 4. Anh cần đi thang máy đằng kia.' },
      { speaker: 'A', text: 'Okay, 4th floor. Which office number?', translationVi: 'Vâng, tầng 4. Phòng số mấy vậy?' },
      { speaker: 'B', text: 'Room 405. When you get out of the elevator, turn right.', translationVi: 'Phòng 405. Khi anh ra khỏi thang máy, hãy rẽ phải.' },
      { speaker: 'A', text: 'Turn right. Is it at the end of the hall?', translationVi: 'Rẽ phải. Nó ở cuối hành lang phải không?' },
      { speaker: 'B', text: 'No, it is the second door on your left.', translationVi: 'Không, nó là cánh cửa thứ hai bên tay trái của anh.' }
    ],
    keyVocabulary: [
      {
        term: 'delivery',
        ipa: '/dɪˈlɪvəri/',
        partOfSpeech: 'noun',
        meaningVi: 'giao hàng',
        exampleEn: 'I have a pizza delivery.',
        exampleVi: 'Tôi có món pizza cần giao.',
        associatedActions: [
          { en: 'carry cardboard parcel', vi: 'mang gói bưu kiện bằng bìa các-tông' },
          { en: 'check recipient address on label', vi: 'kiểm tra địa chỉ người nhận trên nhãn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'located',
        ipa: '/ˈloʊkeɪtɪd/',
        partOfSpeech: 'adj',
        meaningVi: 'được đặt tại, nằm ở',
        exampleEn: 'The office is located downtown.',
        exampleVi: 'Văn phòng nằm ở trung tâm thành phố.',
        associatedActions: [
          { en: 'find suite on directory board', vi: 'tìm số phòng trên bảng chỉ dẫn' },
          { en: 'ask front desk receptionist', vi: 'hỏi nhân viên lễ tân tại quầy' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'elevator',
        ipa: '/ˈelɪveɪtər/',
        partOfSpeech: 'noun',
        meaningVi: 'thang máy',
        exampleEn: 'Take the elevator to the fifth floor.',
        exampleVi: 'Đi thang máy lên tầng năm.',
        associatedActions: [
          { en: 'press call button', vi: 'bấm nút gọi thang máy' },
          { en: 'step inside cabin', vi: 'bước vào bên trong cabin' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'hall',
        ipa: '/hɔːl/',
        partOfSpeech: 'noun',
        meaningVi: 'hành lang',
        exampleEn: 'Walk down this hall.',
        exampleVi: 'Đi dọc theo hành lang này.',
        associatedActions: [
          { en: 'walk down long corridor', vi: 'đi dọc hành lang dài' },
          { en: 'follow hallway signs', vi: 'đi theo biển chỉ dẫn hành lang' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'door',
        ipa: '/dɔːr/',
        partOfSpeech: 'noun',
        meaningVi: 'cửa',
        exampleEn: 'Knock on the door.',
        exampleVi: 'Hãy gõ cửa.',
        associatedActions: [
          { en: 'turn door handle', vi: 'vặn tay nắm cửa' },
          { en: 'knock gently before entering', vi: 'gõ cửa nhẹ nhàng trước khi vào' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Take the elevator to the...', translationVi: 'Đi thang máy lên tầng...' },
      { phrase: 'When you get out of the elevator...', translationVi: 'Khi bạn ra khỏi thang máy...' },
      { phrase: 'At the end of the hall.', translationVi: 'Ở cuối hành lang.' },
      { phrase: 'The second door on your left.', translationVi: 'Cánh cửa thứ hai bên tay trái.' },
      { phrase: 'Where are they located?', translationVi: 'Họ nằm ở đâu?' }
    ],
    aiTutorPrompt: 'You work at the reception of a large building. The user is a delivery person looking for an office. Give them clear instructions on which floor and room to go to.',
    tags: ['directions', 'office', 'indoor']
  },
  {
    id: 'soc-dir-04',
    category: 'social',
    subcategory: 'giving-directions',
    level: 'A2',
    titleEn: 'Explaining a bus/metro route',
    titleVi: 'Giải thích tuyến xe buýt/tàu điện ngầm',
    icon: 'Train',
    situationVi: 'Một du khách hỏi bạn cách đi đến bảo tàng bằng phương tiện công cộng. Bạn giải thích cho họ nên bắt tuyến nào và xuống ở đâu.',
    sampleDialogue: [
      { speaker: 'A', text: 'Can you tell me how to get to the City Museum from here?', translationVi: 'Bạn có thể chỉ cho tôi cách đi đến Bảo tàng Thành phố từ đây không?' },
      { speaker: 'B', text: 'The easiest way is to take the subway. The station is just around the corner.', translationVi: 'Cách dễ nhất là đi tàu điện ngầm. Ga tàu ở ngay góc phố kia.' },
      { speaker: 'A', text: 'Which line should I take?', translationVi: 'Tôi nên đi tuyến nào?' },
      { speaker: 'B', text: 'Take the Blue Line going North. You will need to ride for 4 stops.', translationVi: 'Đi tuyến Xanh dương hướng Bắc. Bạn sẽ cần đi qua 4 trạm.' },
      { speaker: 'A', text: '4 stops. What is the name of the station I need to get off at?', translationVi: '4 trạm. Tên ga tôi cần xuống là gì?' },
      { speaker: 'B', text: 'Get off at Museum Square. The museum is right outside the station.', translationVi: 'Xuống tại Quảng trường Bảo tàng. Bảo tàng ở ngay bên ngoài ga.' }
    ],
    keyVocabulary: [
      {
        term: 'subway',
        ipa: '/ˈsʌbweɪ/',
        partOfSpeech: 'noun',
        meaningVi: 'tàu điện ngầm',
        exampleEn: 'I take the subway to work.',
        exampleVi: 'Tôi đi làm bằng tàu điện ngầm.',
        associatedActions: [
          { en: 'swipe transit pass at turnstile', vi: 'quẹt thẻ đi tàu tại cửa xoay' },
          { en: 'take escalator underground', vi: 'đi thang cuốn xuống lòng đất' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'line',
        ipa: '/laɪn/',
        partOfSpeech: 'noun',
        meaningVi: 'tuyến đường (tàu, xe)',
        exampleEn: 'Take the red line.',
        exampleVi: 'Hãy đi tuyến màu đỏ.',
        associatedActions: [
          { en: 'consult metro system map', vi: 'tra cứu bản đồ hệ thống tàu điện ngầm' },
          { en: 'follow colored route signs', vi: 'đi theo các biển chỉ dẫn tuyến màu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'ride',
        ipa: '/raɪd/',
        partOfSpeech: 'verb',
        meaningVi: 'đi (xe, tàu)',
        exampleEn: 'It is a long ride.',
        exampleVi: 'Đó là một chuyến đi dài.',
        associatedActions: [
          { en: 'hold handrail while moving', vi: 'nắm tay vịn khi tàu di chuyển' },
          { en: 'listen to audio announcements', vi: 'lắng nghe các thông báo qua loa' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'stop',
        ipa: '/stɑːp/',
        partOfSpeech: 'noun',
        meaningVi: 'trạm dừng',
        exampleEn: 'My house is two stops away.',
        exampleVi: 'Nhà tôi cách đây hai trạm.',
        associatedActions: [
          { en: 'stand near platform edge', vi: 'đứng gần mép sân ga' },
          { en: 'watch train arrive at station', vi: 'quan sát đoàn tàu cập ga' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'get off',
        ipa: '/ɡet ɔːf/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'xuống xe',
        exampleEn: 'Get off at the next stop.',
        exampleVi: 'Hãy xuống ở trạm tiếp theo.',
        associatedActions: [
          { en: 'step out onto platform', vi: 'bước ra ngoài sân ga' },
          { en: 'head towards station exit', vi: 'tiến về phía lối ra của nhà ga' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'How do I get to...?', translationVi: 'Làm sao để tôi đến...?' },
      { phrase: 'The easiest way is to...', translationVi: 'Cách dễ nhất là...' },
      { phrase: 'Which line should I take?', translationVi: 'Tôi nên đi tuyến nào?' },
      { phrase: 'Ride for 4 stops.', translationVi: 'Đi qua 4 trạm.' },
      { phrase: 'Get off at...', translationVi: 'Xuống xe tại...' }
    ],
    aiTutorPrompt: 'You are a local commuter. The user asks how to get to a tourist spot. Give them instructions on using the subway, including the line and stops.',
    tags: ['directions', 'public transport', 'subway']
  },
  {
    id: 'soc-dir-05',
    category: 'social',
    subcategory: 'giving-directions',
    level: 'B1',
    titleEn: 'Describing a complex route with landmarks',
    titleVi: 'Miêu tả đường đi phức tạp với các điểm mốc',
    icon: 'MapPin',
    situationVi: 'Bạn đang gọi điện thoại chỉ đường cho một người bạn lái xe đến nhà bạn ở ngoại ô. Đường đi khá ngoằn ngoèo nên bạn dùng các tòa nhà và biển hiệu để làm mốc.',
    sampleDialogue: [
      { speaker: 'A', text: 'I am at the highway exit now. Which way should I go?', translationVi: 'Tôi đang ở lối ra cao tốc rồi. Giờ tôi đi đường nào?' },
      { speaker: 'B', text: 'Okay, turn right and drive for about 2 miles until you see a big gas station.', translationVi: 'Được rồi, rẽ phải và lái xe khoảng 2 dặm cho đến khi bạn thấy một trạm xăng lớn.' },
      { speaker: 'A', text: 'A big gas station. Got it. Do I turn there?', translationVi: 'Một trạm xăng lớn. Hiểu rồi. Tôi có rẽ ở đó không?' },
      { speaker: 'B', text: 'Yes, turn left immediately after the gas station onto Oak Street. Drive past the school.', translationVi: 'Có, rẽ trái ngay sau trạm xăng vào phố Oak. Lái xe ngang qua trường học.' },
      { speaker: 'A', text: 'Okay, past the school.', translationVi: 'Được, đi ngang qua trường học.' },
      { speaker: 'B', text: 'Then look for a blue house with a white fence. My house is directly opposite that.', translationVi: 'Sau đó tìm một ngôi nhà màu xanh với hàng rào trắng. Nhà tôi nằm ngay đối diện.' }
    ],
    keyVocabulary: [
      {
        term: 'exit',
        ipa: '/ˈeksɪt/',
        partOfSpeech: 'noun',
        meaningVi: 'lối ra',
        exampleEn: 'Take the next highway exit.',
        exampleVi: 'Hãy rẽ ở lối ra cao tốc tiếp theo.',
        associatedActions: [
          { en: 'take off-ramp turnoff', vi: 'rẽ vào lối nhánh rời cao tốc' },
          { en: 'slow vehicle down gradually', vi: 'giảm dần tốc độ xe' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'gas station',
        ipa: '/ɡæs ˈsteɪʃn/',
        partOfSpeech: 'noun',
        meaningVi: 'trạm xăng',
        exampleEn: 'I need to stop at a gas station.',
        exampleVi: 'Tôi cần dừng lại ở trạm xăng.',
        associatedActions: [
          { en: 'pull up beside fuel pump', vi: 'tấp xe vào cạnh cây xăng' },
          { en: 'refuel car tank', vi: 'đổ đầy bình nhiên liệu ô tô' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'immediately',
        ipa: '/ɪˈmiːdiətli/',
        partOfSpeech: 'adv',
        meaningVi: 'ngay lập tức',
        exampleEn: 'Call me immediately.',
        exampleVi: 'Gọi cho tôi ngay lập tức.',
        associatedActions: [
          { en: 'turn steering wheel promptly', vi: 'đánh lái kịp thời ngay lập tức' },
          { en: 'react without delay', vi: 'phản ứng không chút chậm trễ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'past',
        ipa: '/pæst/',
        partOfSpeech: 'prep',
        meaningVi: 'ngang qua',
        exampleEn: 'Walk past the bank.',
        exampleVi: 'Đi ngang qua ngân hàng.',
        associatedActions: [
          { en: 'drive past town library', vi: 'lái xe vượt qua thư viện thị trấn' },
          { en: 'pass recognizable landmarks', vi: 'đi ngang qua các công trình nhận biết' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'opposite',
        ipa: '/ˈɑːpəzɪt/',
        partOfSpeech: 'prep',
        meaningVi: 'đối diện',
        exampleEn: 'The store is opposite the park.',
        exampleVi: 'Cửa hàng ở đối diện công viên.',
        associatedActions: [
          { en: 'spot building across street', vi: 'nhìn thấy tòa nhà phía đối diện đường' },
          { en: 'park on other side of road', vi: 'đậu xe ở phía bên kia đường' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Drive for about 2 miles.', translationVi: 'Lái xe khoảng 2 dặm.' },
      { phrase: 'Until you see a...', translationVi: 'Cho đến khi bạn nhìn thấy một...' },
      { phrase: 'Immediately after...', translationVi: 'Ngay sau khi...' },
      { phrase: 'Drive past the...', translationVi: 'Lái xe ngang qua...' },
      { phrase: 'It is directly opposite.', translationVi: 'Nó nằm ngay đối diện.' }
    ],
    aiTutorPrompt: 'You are on the phone guiding your friend (the user) who is driving to your house. Give them step-by-step directions using landmarks like a gas station, a school, and a specific house.',
    tags: ['directions', 'driving', 'landmarks']
  },
  {
    id: 'soc-dir-06',
    category: 'social',
    subcategory: 'giving-directions',
    level: 'A2',
    titleEn: 'Giving directions using a map app',
    titleVi: 'Chỉ đường sử dụng ứng dụng bản đồ',
    icon: 'Smartphone',
    situationVi: 'Hai bạn đang đứng trên phố. Một người bạn hỏi đường, bạn mở bản đồ trên điện thoại và cùng họ xem cách đi.',
    sampleDialogue: [
      { speaker: 'A', text: 'I am trying to find this cafe, but I am completely lost.', translationVi: 'Mình đang cố tìm quán cà phê này, nhưng mình bị lạc hoàn toàn rồi.' },
      { speaker: 'B', text: 'Let me check Google Maps on my phone. What is the name of the cafe?', translationVi: 'Để mình xem Google Maps trên điện thoại. Quán đó tên gì?' },
      { speaker: 'A', text: 'It is called The Roasted Bean.', translationVi: 'Nó tên là The Roasted Bean.' },
      { speaker: 'B', text: 'Okay, I see it. We are here, so we are actually heading in the wrong direction.', translationVi: 'Ok, mình thấy rồi. Chúng ta đang ở đây, vậy là chúng ta đang đi ngược hướng rồi.' },
      { speaker: 'A', text: 'Oh no! Do we need to turn around?', translationVi: 'Ôi không! Chúng ta có phải quay lại không?' },
      { speaker: 'B', text: 'Yes, we just need to turn around and walk two blocks. It is on the corner of 5th and Main.', translationVi: 'Ừ, chúng ta chỉ cần quay lại và đi bộ qua hai dãy nhà. Nó nằm ở góc đường số 5 và phố Main.' }
    ],
    keyVocabulary: [
      {
        term: 'lost',
        ipa: '/lɔːst/',
        partOfSpeech: 'adj',
        meaningVi: 'bị lạc',
        exampleEn: 'I think we are lost.',
        exampleVi: 'Tôi nghĩ chúng ta bị lạc rồi.',
        associatedActions: [
          { en: 'stop and check surroundings', vi: 'dừng lại và quan sát xung quanh' },
          { en: 'ask local resident for guidance', vi: 'hỏi người dân địa phương để xin chỉ đường' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1524813686514-a57563d77d66?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'direction',
        ipa: '/dəˈrekʃn/',
        partOfSpeech: 'noun',
        meaningVi: 'hướng, phương hướng',
        exampleEn: 'You are going in the wrong direction.',
        exampleVi: 'Bạn đang đi sai hướng rồi.',
        associatedActions: [
          { en: 'point towards north', vi: 'chỉ tay về hướng bắc' },
          { en: 'check compass indicator on screen', vi: 'kiểm tra kim chỉ la bàn trên màn hình' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1524813686514-a57563d77d66?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'turn around',
        ipa: '/tɜːrn əˈraʊnd/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'quay lại, quay đầu',
        exampleEn: 'Turn around, you missed the house.',
        exampleVi: 'Quay lại đi, bạn lỡ qua khỏi nhà rồi.',
        associatedActions: [
          { en: 'walk back previous pathway', vi: 'đi ngược lại con đường vừa đi' },
          { en: 'make a safe U-turn', vi: 'quay đầu xe an toàn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'block',
        ipa: '/blɑːk/',
        partOfSpeech: 'noun',
        meaningVi: 'dãy nhà, lô đất',
        exampleEn: 'Walk three blocks and turn left.',
        exampleVi: 'Đi qua ba dãy nhà rồi rẽ trái.',
        associatedActions: [
          { en: 'walk past city blocks', vi: 'đi bộ qua các dãy nhà trong thành phố' },
          { en: 'count intersections along way', vi: 'đếm các giao lộ trên đường đi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'corner',
        ipa: '/ˈkɔːrnər/',
        partOfSpeech: 'noun',
        meaningVi: 'góc (đường)',
        exampleEn: 'The shop is on the corner.',
        exampleVi: 'Cửa hàng ở góc đường.',
        associatedActions: [
          { en: 'wait at street corner', vi: 'chờ ở góc phố' },
          { en: 'look around corner building', vi: 'ngó quanh góc tòa nhà' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I am completely lost.', translationVi: 'Tôi hoàn toàn bị lạc.' },
      { phrase: 'Let me check on my phone.', translationVi: 'Để tôi kiểm tra trên điện thoại.' },
      { phrase: 'We are heading in the wrong direction.', translationVi: 'Chúng ta đang đi sai hướng.' },
      { phrase: 'Turn around.', translationVi: 'Quay đầu lại.' },
      { phrase: 'It is on the corner of...', translationVi: 'Nó nằm ở góc của (đường)...' }
    ],
    aiTutorPrompt: 'You are walking with a friend (the user). They admit they are lost looking for a cafe. Tell them you will check your map app and explain the route based on the screen.',
    tags: ['directions', 'map', 'smartphone']
  }
];
