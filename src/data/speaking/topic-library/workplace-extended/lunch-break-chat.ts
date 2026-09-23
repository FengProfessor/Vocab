/**
 * LingoPro Speaking Topic Library
 * Category: workplace_extended
 * Subcategory: lunch_break_chat
 * File: src/data/speaking/topic-library/workplace-extended/lunch-break-chat.ts
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const LUNCH_BREAK_CHAT_ITEMS: TopicLibraryItem[] = [
  {
    id: 'work-lunch-01',
    category: 'workplace_extended',
    subcategory: 'lunch_break_chat',
    level: 'A2',
    titleEn: 'Discussing weekend plans',
    titleVi: 'Bàn luận về kế hoạch cuối tuần',
    icon: 'calendar',
    situationVi: 'Vào bữa trưa ngày Thứ Sáu, bạn và đồng nghiệp ngồi ăn cùng nhau và hỏi thăm về dự định cho dịp cuối tuần sắp tới.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Thank God it\'s Friday. Do you have any plans for the weekend?', textVi: 'Tạ ơn Chúa là thứ Sáu rồi. Bạn có kế hoạch gì cho cuối tuần chưa?' },
      { speaker: 'B', textEn: 'Nothing much, probably just catch up on some sleep. You?', textVi: 'Không có gì nhiều, chắc chỉ ngủ bù thôi. Còn bạn?' },
      { speaker: 'A', textEn: 'I\'m going to a barbecue at my friend\'s house on Saturday.', textVi: 'Tôi sẽ đến dự một bữa tiệc nướng ở nhà bạn tôi vào thứ Bảy.' },
      { speaker: 'B', textEn: 'That sounds fun! I hope the weather stays nice for it.', textVi: 'Nghe vui đấy! Tôi hy vọng thời tiết sẽ đẹp cho việc đó.' },
      { speaker: 'A', textEn: 'Me too. The forecast says it should be sunny.', textVi: 'Tôi cũng vậy. Dự báo thời tiết nói trời sẽ nắng.' }
    ],
    keyVocabulary: [
      {
        term: 'catch up on',
        ipa: '/kætʃ ʌp ɒn/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'làm bù, làm điều gì đó bạn chưa có thời gian làm',
        exampleEn: 'I need to catch up on my sleep.',
        exampleVi: 'Tôi cần ngủ bù.',
        associatedActions: [
          { en: 'catch up on sleep', vi: 'ngủ bù cho lại sức' },
          { en: 'catch up on favorite shows', vi: 'xem bù các chương trình yêu thích' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'sleep',
        ipa: '/sliːp/',
        partOfSpeech: 'noun',
        meaningVi: 'giấc ngủ',
        exampleEn: 'I didn\'t get enough sleep.',
        exampleVi: 'Tôi đã không ngủ đủ.',
        associatedActions: [
          { en: 'get enough sleep', vi: 'ngủ đủ giấc' },
          { en: 'track sleep patterns', vi: 'theo dõi chu kỳ giấc ngủ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1520206183501-b80df61e43c2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'barbecue',
        ipa: '/ˈbɑː.bɪ.kjuː/',
        partOfSpeech: 'noun',
        meaningVi: 'tiệc nướng ngoài trời',
        exampleEn: 'We are having a barbecue this Sunday.',
        exampleVi: 'Chúng tôi sẽ có tiệc nướng vào Chủ nhật này.',
        associatedActions: [
          { en: 'host a backyard barbecue', vi: 'tổ chức tiệc nướng sân sau' },
          { en: 'grill meat at the barbecue', vi: 'nướng thịt tại tiệc barbecue' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'weather',
        ipa: '/ˈweð.ər/',
        partOfSpeech: 'noun',
        meaningVi: 'thời tiết',
        exampleEn: 'The weather is perfect.',
        exampleVi: 'Thời tiết thật hoàn hảo.',
        associatedActions: [
          { en: 'enjoy warm sunny weather', vi: 'tận hưởng thời tiết nắng ấm' },
          { en: 'check weekend weather', vi: 'kiểm tra thời tiết cuối tuần' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'forecast',
        ipa: '/ˈfɔː.kɑːst/',
        partOfSpeech: 'noun',
        meaningVi: 'dự báo',
        exampleEn: 'The weather forecast is good.',
        exampleVi: 'Dự báo thời tiết rất tốt.',
        associatedActions: [
          { en: 'read the weekly forecast', vi: 'đọc bản dự báo hàng tuần' },
          { en: 'rely on weather forecast', vi: 'dựa vào dự báo thời tiết' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Thank God it\'s Friday.', phraseVi: 'Tạ ơn Chúa hôm nay là thứ Sáu.' },
      { phraseEn: 'Do you have any plans for the weekend?', phraseVi: 'Bạn có kế hoạch gì cho cuối tuần không?' },
      { phraseEn: 'I\'m just going to catch up on some sleep.', phraseVi: 'Tôi chỉ định ngủ bù thôi.' },
      { phraseEn: 'I hope the weather stays nice.', phraseVi: 'Tôi hy vọng thời tiết sẽ tiếp tục đẹp.' },
      { phraseEn: 'The forecast says it should be sunny.', phraseVi: 'Dự báo nói rằng trời sẽ nắng.' }
    ],
    aiTutorPrompt: 'Roleplay as a coworker having lunch on a Friday. Ask the user about their weekend plans and share a simple plan of your own.',
    tags: ['weekend', 'lunch', 'small talk']
  },
  {
    id: 'work-lunch-02',
    category: 'workplace_extended',
    subcategory: 'lunch_break_chat',
    level: 'A2',
    titleEn: 'Talking about a new restaurant',
    titleVi: 'Nói về một nhà hàng mới',
    icon: 'utensils',
    situationVi: 'Bạn ăn trưa cùng đồng nghiệp và giới thiệu cho họ về một quán ăn ngon mới mở gần công ty.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Did you hear about the new Italian place down the street?', textVi: 'Bạn đã nghe về quán đồ Ý mới mở dưới phố chưa?' },
      { speaker: 'B', textEn: 'No, I haven\'t. Is it any good?', textVi: 'Chưa, tôi chưa nghe. Nó có ngon không?' },
      { speaker: 'A', textEn: 'It\'s amazing! I went there yesterday. Their pasta is so fresh.', textVi: 'Nó tuyệt vời! Tôi đã đến đó ngày hôm qua. Mì ống của họ rất tươi.' },
      { speaker: 'B', textEn: 'I love pasta. Is it expensive?', textVi: 'Tôi thích mì ống. Nó có đắt không?' },
      { speaker: 'A', textEn: 'Not at all. They have a great lunch special for $10.', textVi: 'Không đắt chút nào. Họ có suất trưa đặc biệt rất ngon giá 10 đô la.' },
      { speaker: 'B', textEn: 'We should definitely go there together next week.', textVi: 'Chúng ta chắc chắn nên cùng đến đó vào tuần tới.' }
    ],
    keyVocabulary: [
      {
        term: 'Italian',
        ipa: '/ɪˈtæl.jən/',
        partOfSpeech: 'adj',
        meaningVi: 'thuộc về nước Ý',
        exampleEn: 'I love Italian food.',
        exampleVi: 'Tôi thích đồ ăn Ý.',
        associatedActions: [
          { en: 'order authentic Italian food', vi: 'gọi món ăn Ý chính hiệu' },
          { en: 'dine at an Italian restaurant', vi: 'dùng bữa tại nhà hàng Ý' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'fresh',
        ipa: '/freʃ/',
        partOfSpeech: 'adj',
        meaningVi: 'tươi',
        exampleEn: 'The vegetables are very fresh.',
        exampleVi: 'Rau củ rất tươi.',
        associatedActions: [
          { en: 'pick fresh ingredients', vi: 'chọn các nguyên liệu tươi ngon' },
          { en: 'serve fresh homemade pasta', vi: 'phục vụ mì ống tươi tự làm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'expensive',
        ipa: '/ɪkˈspen.sɪv/',
        partOfSpeech: 'adj',
        meaningVi: 'đắt tiền',
        exampleEn: 'That restaurant is too expensive.',
        exampleVi: 'Nhà hàng đó quá đắt.',
        associatedActions: [
          { en: 'avoid expensive dining', vi: 'tránh ăn uống quá đắt đỏ' },
          { en: 'check expensive menu items', vi: 'kiểm tra các món ăn đắt tiền trong thực đơn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'special',
        ipa: '/ˈspeʃ.əl/',
        partOfSpeech: 'noun',
        meaningVi: 'món đặc biệt (trong thực đơn)',
        exampleEn: 'What is today\'s lunch special?',
        exampleVi: 'Món đặc biệt cho bữa trưa hôm nay là gì?',
        associatedActions: [
          { en: 'order the lunch special', vi: 'gọi suất ăn trưa đặc biệt' },
          { en: 'inquire about daily specials', vi: 'hỏi về món đặc biệt trong ngày' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'definitely',
        ipa: '/ˈdef.ɪ.nət.li/',
        partOfSpeech: 'adv',
        meaningVi: 'chắc chắn',
        exampleEn: 'I will definitely go.',
        exampleVi: 'Tôi chắc chắn sẽ đi.',
        associatedActions: [
          { en: 'definitely recommend a visit', vi: 'chắc chắn khuyên nên ghé thăm' },
          { en: 'definitely return next week', vi: 'chắc chắn sẽ quay lại tuần tới' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Did you hear about the new place?', phraseVi: 'Bạn đã nghe về quán mới chưa?' },
      { phraseEn: 'Is it any good?', phraseVi: 'Nó có ngon không?' },
      { phraseEn: 'Is it expensive?', phraseVi: 'Nó có đắt không?' },
      { phraseEn: 'They have a great lunch special.', phraseVi: 'Họ có suất ăn trưa đặc biệt rất tuyệt.' },
      { phraseEn: 'We should definitely go there.', phraseVi: 'Chúng ta chắc chắn nên đến đó.' }
    ],
    aiTutorPrompt: 'Roleplay as a colleague. The user will tell you about a new restaurant they tried. Show interest and ask about the food and prices.',
    tags: ['restaurant', 'food', 'lunch']
  },
  {
    id: 'work-lunch-03',
    category: 'workplace_extended',
    subcategory: 'lunch_break_chat',
    level: 'A2',
    titleEn: 'Sharing holiday stories',
    titleVi: 'Chia sẻ câu chuyện kỳ nghỉ',
    icon: 'sun',
    situationVi: 'Đồng nghiệp của bạn vừa đi nghỉ phép về. Trong bữa trưa, bạn hỏi thăm họ về chuyến đi.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Welcome back! How was your trip to Hawaii?', textVi: 'Chào mừng trở lại! Chuyến đi Hawaii của bạn thế nào?' },
      { speaker: 'B', textEn: 'It was incredible. The beaches were so beautiful.', textVi: 'Thật tuyệt vời. Những bãi biển quá đẹp.' },
      { speaker: 'A', textEn: 'Did you get to go snorkeling?', textVi: 'Bạn có đi lặn ngắm san hô không?' },
      { speaker: 'B', textEn: 'Yes, we saw sea turtles! It was the highlight of the trip.', textVi: 'Có, chúng tôi đã thấy rùa biển! Đó là điểm nhấn của chuyến đi.' },
      { speaker: 'A', textEn: 'I\'m so jealous. I really need a vacation soon.', textVi: 'Tôi ghen tị quá. Tôi thực sự cần một kỳ nghỉ sớm.' }
    ],
    keyVocabulary: [
      {
        term: 'trip',
        ipa: '/trɪp/',
        partOfSpeech: 'noun',
        meaningVi: 'chuyến đi',
        exampleEn: 'How was your trip?',
        exampleVi: 'Chuyến đi của bạn thế nào?',
        associatedActions: [
          { en: 'plan a vacation trip', vi: 'lên kế hoạch cho chuyến du lịch' },
          { en: 'share memorable trip photos', vi: 'chia sẻ ảnh chuyến đi đáng nhớ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'incredible',
        ipa: '/ɪnˈkred.ə.bəl/',
        partOfSpeech: 'adj',
        meaningVi: 'không thể tin được, tuyệt vời',
        exampleEn: 'The view was incredible.',
        exampleVi: 'Cảnh quan thật tuyệt vời.',
        associatedActions: [
          { en: 'witness incredible scenery', vi: 'chiêm ngưỡng phong cảnh tuyệt mỹ' },
          { en: 'have an incredible adventure', vi: 'có một chuyến phiêu lưu kỳ thú' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'snorkeling',
        ipa: '/ˈsnɔː.kəl.ɪŋ/',
        partOfSpeech: 'noun',
        meaningVi: 'môn lặn có ống thở',
        exampleEn: 'We went snorkeling yesterday.',
        exampleVi: 'Hôm qua chúng tôi đã đi lặn ống thở.',
        associatedActions: [
          { en: 'go snorkeling near coral reefs', vi: 'đi lặn ống thở gần rạn san hô' },
          { en: 'rent snorkeling gear', vi: 'thuê dụng cụ lặn ống thở' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'highlight',
        ipa: '/ˈhaɪ.laɪt/',
        partOfSpeech: 'noun',
        meaningVi: 'điểm nhấn, phần nổi bật nhất',
        exampleEn: 'That was the highlight of my year.',
        exampleVi: 'Đó là điểm nhấn trong năm của tôi.',
        associatedActions: [
          { en: 'recount the trip highlight', vi: 'kể lại điểm nhấn của chuyến đi' },
          { en: 'capture highlight moments', vi: 'lưu lại những khoảnh khắc nổi bật' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'jealous',
        ipa: '/ˈdʒel.əs/',
        partOfSpeech: 'adj',
        meaningVi: 'ghen tị',
        exampleEn: 'I am so jealous of your new car.',
        exampleVi: 'Tôi rất ghen tị với chiếc xe mới của bạn.',
        associatedActions: [
          { en: 'feel slightly jealous', vi: 'cảm thấy đôi chút ghen tị' },
          { en: 'laugh at jealous coworkers', vi: 'cười đùa với các đồng nghiệp đang ghen tị' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Welcome back!', phraseVi: 'Chào mừng bạn trở lại!' },
      { phraseEn: 'How was your trip?', phraseVi: 'Chuyến đi của bạn thế nào?' },
      { phraseEn: 'It was incredible.', phraseVi: 'Thật tuyệt vời.' },
      { phraseEn: 'It was the highlight of the trip.', phraseVi: 'Đó là điểm nhấn của chuyến đi.' },
      { phraseEn: 'I\'m so jealous.', phraseVi: 'Tôi ghen tị quá.' }
    ],
    aiTutorPrompt: 'Roleplay as a colleague who just returned from a vacation to Hawaii. The user asks you about the trip. Share an exciting detail.',
    tags: ['holiday', 'vacation', 'travel']
  },
  {
    id: 'work-lunch-04',
    category: 'workplace_extended',
    subcategory: 'lunch_break_chat',
    level: 'A2',
    titleEn: 'Discussing a new hobby',
    titleVi: 'Thảo luận về một sở thích mới',
    icon: 'camera',
    situationVi: 'Bạn hào hứng kể cho đồng nghiệp nghe về một sở thích mới mà bạn vừa bắt đầu tham gia ngoài giờ làm việc.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'I started taking pottery classes on Tuesday evenings.', textVi: 'Tôi bắt đầu tham gia lớp học làm gốm vào các buổi tối thứ Ba.' },
      { speaker: 'B', textEn: 'Really? That sounds so relaxing. Are you making anything good?', textVi: 'Thật sao? Nghe có vẻ thư giãn nhỉ. Bạn có làm được món nào đẹp không?' },
      { speaker: 'A', textEn: 'Well, my first bowl looks a bit crooked, but it\'s fun.', textVi: 'Chà, cái bát đầu tiên của tôi trông hơi méo, nhưng rất vui.' },
      { speaker: 'B', textEn: 'It takes practice. You\'ll have to bring a mug to the office when you\'re better!', textVi: 'Cần phải thực hành mà. Bạn sẽ phải mang một chiếc cốc đến văn phòng khi bạn làm giỏi hơn!' },
      { speaker: 'A', textEn: 'Haha, deal! I\'ll make a special one for your coffee.', textVi: 'Haha, thỏa thuận nhé! Tôi sẽ làm một cái đặc biệt cho cà phê của bạn.' }
    ],
    keyVocabulary: [
      {
        term: 'pottery',
        ipa: '/ˈpɒt.ər.i/',
        partOfSpeech: 'noun',
        meaningVi: 'đồ gốm, nghề làm gốm',
        exampleEn: 'She bought a piece of pottery.',
        exampleVi: 'Cô ấy mua một món đồ gốm.',
        associatedActions: [
          { en: 'shape handmade pottery', vi: 'nặn đồ gốm thủ công' },
          { en: 'attend evening pottery workshops', vi: 'tham dự xưởng làm gốm buổi tối' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'relaxing',
        ipa: '/rɪˈlæk.sɪŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'thư giãn',
        exampleEn: 'Gardening is very relaxing.',
        exampleVi: 'Làm vườn rất thư giãn.',
        associatedActions: [
          { en: 'enjoy a relaxing hobby', vi: 'tận hưởng một sở thích thư giãn' },
          { en: 'find evening pottery relaxing', vi: 'thấy làm gốm buổi tối rất thư thái' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'crooked',
        ipa: '/ˈkrʊk.ɪd/',
        partOfSpeech: 'adj',
        meaningVi: 'cong, méo, không thẳng',
        exampleEn: 'The picture on the wall is crooked.',
        exampleVi: 'Bức tranh trên tường bị lệch.',
        associatedActions: [
          { en: 'straighten crooked objects', vi: 'nắn lại những đồ vật bị méo' },
          { en: 'notice a slightly crooked shape', vi: 'nhận thấy hình dạng hơi lệch' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'practice',
        ipa: '/ˈpræk.tɪs/',
        partOfSpeech: 'noun',
        meaningVi: 'sự thực hành, luyện tập',
        exampleEn: 'It takes a lot of practice to play the piano.',
        exampleVi: 'Cần rất nhiều luyện tập để chơi piano.',
        associatedActions: [
          { en: 'practice pottery techniques', vi: 'thực hành các kỹ thuật làm gốm' },
          { en: 'improve through constant practice', vi: 'tiến bộ nhờ luyện tập thường xuyên' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'mug',
        ipa: '/mʌɡ/',
        partOfSpeech: 'noun',
        meaningVi: 'cốc (có quai)',
        exampleEn: 'I need a new coffee mug.',
        exampleVi: 'Tôi cần một chiếc cốc uống cà phê mới.',
        associatedActions: [
          { en: 'craft a ceramic mug', vi: 'chế tác một chiếc cốc gốm' },
          { en: 'drink coffee from a favorite mug', vi: 'uống cà phê từ chiếc cốc yêu thích' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'I started taking classes.', phraseVi: 'Tôi bắt đầu tham gia các lớp học.' },
      { phraseEn: 'That sounds so relaxing.', phraseVi: 'Nghe có vẻ rất thư giãn.' },
      { phraseEn: 'Are you making anything good?', phraseVi: 'Bạn có làm được gì đẹp không?' },
      { phraseEn: 'It takes practice.', phraseVi: 'Nó cần sự rèn luyện.' },
      { phraseEn: 'It\'s a lot of fun.', phraseVi: 'Nó rất vui.' }
    ],
    aiTutorPrompt: 'Roleplay as a colleague during lunch. The user will share a new hobby they just started. React positively and ask a couple of questions about it.',
    tags: ['hobby', 'free time', 'chat']
  },
  {
    id: 'work-lunch-05',
    category: 'workplace_extended',
    subcategory: 'lunch_break_chat',
    level: 'B1',
    titleEn: 'Talking about office rumors',
    titleVi: 'Nói về tin đồn trong văn phòng',
    icon: 'message-square',
    situationVi: 'Trong giờ nghỉ trưa, bạn và đồng nghiệp nhỏ to thảo luận về những thay đổi lớn có thể sắp xảy ra trong công ty.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Have you heard the rumor that our department is moving to a new building?', textVi: 'Bạn có nghe tin đồn rằng phòng ban của chúng ta sắp chuyển sang tòa nhà mới không?' },
      { speaker: 'B', textEn: 'Yes, someone mentioned it. But nothing is officially confirmed yet.', textVi: 'Có, ai đó đã nhắc đến. Nhưng chưa có gì được xác nhận chính thức cả.' },
      { speaker: 'A', textEn: 'I hope it\'s not true. I like the commute to this office.', textVi: 'Tôi hy vọng điều đó không đúng. Tôi thích việc đi lại đến văn phòng này.' },
      { speaker: 'B', textEn: 'Me too. But apparently, we need more space because we are hiring more staff.', textVi: 'Tôi cũng vậy. Nhưng có vẻ như chúng ta cần nhiều không gian hơn vì chúng ta đang thuê thêm nhân viên.' },
      { speaker: 'A', textEn: 'Well, let\'s wait for the all-hands meeting on Friday. Maybe they\'ll announce it then.', textVi: 'Chà, hãy đợi cuộc họp toàn thể vào thứ Sáu. Có thể họ sẽ thông báo vào lúc đó.' }
    ],
    keyVocabulary: [
      {
        term: 'rumor',
        ipa: '/ˈruː.mər/',
        partOfSpeech: 'noun',
        meaningVi: 'tin đồn',
        exampleEn: 'There is a rumor about a promotion.',
        exampleVi: 'Có một tin đồn về việc thăng chức.',
        associatedActions: [
          { en: 'dispel false office rumors', vi: 'xua tan những tin đồn thất thiệt nơi văn phòng' },
          { en: 'hear an intriguing rumor', vi: 'nghe thấy một lời đồn thú vị' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'officially',
        ipa: '/əˈfɪʃ.əl.i/',
        partOfSpeech: 'adv',
        meaningVi: 'một cách chính thức',
        exampleEn: 'The project is officially closed.',
        exampleVi: 'Dự án đã chính thức đóng lại.',
        associatedActions: [
          { en: 'announce updates officially', vi: 'thông báo cập nhật một cách chính thức' },
          { en: 'confirm office moves officially', vi: 'xác nhận việc chuyển văn phòng một cách chính thức' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'commute',
        ipa: '/kəˈmjuːt/',
        partOfSpeech: 'noun',
        meaningVi: 'quãng đường/việc đi lại đi làm',
        exampleEn: 'My commute takes an hour.',
        exampleVi: 'Việc đi lại của tôi mất một giờ.',
        associatedActions: [
          { en: 'shorten the daily commute', vi: 'rút ngắn quãng đường đi làm hàng ngày' },
          { en: 'commute by subway every morning', vi: 'đi làm bằng tàu điện ngầm mỗi sáng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1509749837427-ac94a2553d0e?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'apparently',
        ipa: '/əˈpær.ənt.li/',
        partOfSpeech: 'adv',
        meaningVi: 'hình như, có vẻ như',
        exampleEn: 'Apparently, it\'s going to rain.',
        exampleVi: 'Có vẻ như trời sẽ mưa.',
        associatedActions: [
          { en: 'verify apparently valid news', vi: 'xác minh tin tức có vẻ hợp lý' },
          { en: 'note what apparently happened', vi: 'ghi nhận điều có vẻ như đã diễn ra' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'all-hands',
        ipa: '/ɔːl hændz/',
        partOfSpeech: 'adj',
        meaningVi: 'toàn thể (nhân viên)',
        exampleEn: 'We have an all-hands meeting tomorrow.',
        exampleVi: 'Chúng ta có cuộc họp toàn thể vào ngày mai.',
        associatedActions: [
          { en: 'schedule an all-hands meeting', vi: 'lên lịch cuộc họp toàn thể công ty' },
          { en: 'attend executive all-hands briefings', vi: 'tham dự buổi thông tri toàn thể lãnh đạo' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Have you heard the rumor that...?', phraseVi: 'Bạn có nghe tin đồn rằng...?' },
      { phraseEn: 'Nothing is officially confirmed yet.', phraseVi: 'Chưa có gì được xác nhận chính thức.' },
      { phraseEn: 'I hope it\'s not true.', phraseVi: 'Tôi hy vọng điều đó không đúng.' },
      { phraseEn: 'Apparently, we need more space.', phraseVi: 'Có vẻ như chúng ta cần nhiều không gian hơn.' },
      { phraseEn: 'Let\'s wait for the all-hands meeting.', phraseVi: 'Hãy đợi cuộc họp toàn công ty.' }
    ],
    aiTutorPrompt: 'Roleplay as a colleague gossiping lightly about office changes (e.g., moving desks, new rules). The user will initiate the topic.',
    tags: ['rumors', 'office', 'lunch']
  }
];
