/**
 * LingoPro Speaking Topic Library
 * Category: Social
 * Subcategory: Small Talk
 * File: src/data/speaking/topic-library/social/small-talk.ts
 *
 * 8 sub-topics covering casual conversations in everyday situations.
 * CEFR Range: A1 - B1
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const SMALL_TALK_ITEMS: TopicLibraryItem[] = [
  {
    id: 'soc-small-01',
    category: 'social',
    subcategory: 'small-talk',
    level: 'A1',
    titleEn: 'Elevator small talk',
    titleVi: 'Trò chuyện ngắn trong thang máy',
    icon: 'MessageSquare',
    situationVi: 'Bạn đang đi thang máy cùng một người đồng nghiệp ở công ty. Các bạn chào hỏi và nói vài câu ngắn gọn trước khi đến tầng của mình.',
    sampleDialogue: [
      { speaker: 'A', text: 'Good morning, John.', translationVi: 'Chào buổi sáng, John.' },
      { speaker: 'B', text: 'Morning, Sarah! How are you today?', translationVi: 'Chào buổi sáng, Sarah! Hôm nay bạn thế nào?' },
      { speaker: 'A', text: 'I am good, thanks. Just a little tired.', translationVi: 'Mình khỏe, cảm ơn. Chỉ hơi mệt một chút.' },
      { speaker: 'B', text: 'Did you work late yesterday?', translationVi: 'Hôm qua bạn làm việc muộn à?' },
      { speaker: 'A', text: 'Yes, I had to finish a report. Well, this is my floor.', translationVi: 'Đúng vậy, mình phải hoàn thành một báo cáo. Chà, đến tầng của mình rồi.' },
      { speaker: 'B', text: 'Have a good day!', translationVi: 'Chúc một ngày tốt lành!' }
    ],
    keyVocabulary: [
      {
        term: 'morning',
        ipa: '/ˈmɔːrnɪŋ/',
        partOfSpeech: 'noun',
        meaningVi: 'buổi sáng',
        exampleEn: 'Good morning everyone.',
        exampleVi: 'Chào buổi sáng mọi người.',
        associatedActions: [
          { en: 'greet coworkers in the morning', vi: 'chào đồng nghiệp vào buổi sáng' },
          { en: 'enjoy the crisp morning air', vi: 'tận hưởng bầu không khí buổi sáng trong lành' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'tired',
        ipa: '/ˈtaɪərd/',
        partOfSpeech: 'adj',
        meaningVi: 'mệt mỏi',
        exampleEn: 'I feel very tired today.',
        exampleVi: 'Hôm nay tôi cảm thấy rất mệt.',
        associatedActions: [
          { en: 'feel tired after work', vi: 'cảm thấy mệt mỏi sau giờ làm việc' },
          { en: 'rest when feeling tired', vi: 'nghỉ ngơi khi thấy mệt' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'late',
        ipa: '/leɪt/',
        partOfSpeech: 'adv',
        meaningVi: 'muộn, trễ',
        exampleEn: 'He arrived late for work.',
        exampleVi: 'Anh ấy đến làm muộn.',
        associatedActions: [
          { en: 'stay late at the office', vi: 'ở lại văn phòng muộn' },
          { en: 'arrive late for an appointment', vi: 'đến muộn hẹn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'report',
        ipa: '/rɪˈpɔːrt/',
        partOfSpeech: 'noun',
        meaningVi: 'báo cáo',
        exampleEn: 'I am writing a sales report.',
        exampleVi: 'Tôi đang viết báo cáo doanh số.',
        associatedActions: [
          { en: 'write a weekly report', vi: 'viết báo cáo hàng tuần' },
          { en: 'submit the final report', vi: 'nộp bản báo cáo cuối cùng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'floor',
        ipa: '/flɔːr/',
        partOfSpeech: 'noun',
        meaningVi: 'tầng (nhà)',
        exampleEn: 'My office is on the fifth floor.',
        exampleVi: 'Văn phòng của tôi ở tầng năm.',
        associatedActions: [
          { en: 'press the elevator floor button', vi: 'nhấn nút tầng thang máy' },
          { en: 'get off at the top floor', vi: 'bước ra ở tầng cao nhất' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519642918688-7e43b19245d8?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'How are you today?', translationVi: 'Hôm nay bạn thế nào?' },
      { phrase: 'I am good, thanks.', translationVi: 'Tôi khỏe, cảm ơn.' },
      { phrase: 'Just a little tired.', translationVi: 'Chỉ hơi mệt một chút.' },
      { phrase: 'This is my floor.', translationVi: 'Đến tầng của tôi rồi.' },
      { phrase: 'Have a good day!', translationVi: 'Chúc một ngày tốt lành!' }
    ],
    aiTutorPrompt: 'You are a colleague of the user in an elevator. Greet them, make a brief comment or ask a simple question, and say goodbye when they reach their floor.',
    tags: ['elevator', 'office', 'coworkers']
  },
  {
    id: 'soc-small-02',
    category: 'social',
    subcategory: 'small-talk',
    level: 'A2',
    titleEn: 'Waiting room chat',
    titleVi: 'Trò chuyện trong phòng chờ',
    icon: 'Clock',
    situationVi: 'Bạn đang ngồi trong phòng chờ ở phòng khám nha khoa và bắt chuyện với một người đang đợi cùng.',
    sampleDialogue: [
      { speaker: 'A', text: 'It is quite busy today, isn\'t it?', translationVi: 'Hôm nay khá đông khách nhỉ, phải không?' },
      { speaker: 'B', text: 'Yes, it is. I have been waiting for almost an hour.', translationVi: 'Đúng vậy. Tôi đã đợi gần một tiếng rồi.' },
      { speaker: 'A', text: 'Oh really? That is a long time. My appointment was at 10 AM.', translationVi: 'Ồ vậy sao? Thế thì lâu quá. Lịch hẹn của tôi là 10 giờ sáng.' },
      { speaker: 'B', text: 'Mine was at 9:30. I hope they call me soon.', translationVi: 'Của tôi là 9:30. Tôi hy vọng họ sẽ gọi tôi sớm.' },
      { speaker: 'A', text: 'I am sure they will. At least the chairs are comfortable.', translationVi: 'Tôi chắc là họ sẽ gọi thôi. Ít nhất thì ghế ngồi cũng thoải mái.' },
      { speaker: 'B', text: 'That is true. Oh, I think they are calling my name.', translationVi: 'Đúng vậy. Ồ, tôi nghĩ họ đang gọi tên tôi.' }
    ],
    keyVocabulary: [
      {
        term: 'busy',
        ipa: '/ˈbɪzi/',
        partOfSpeech: 'adj',
        meaningVi: 'đông đúc, bận rộn',
        exampleEn: 'The store is busy today.',
        exampleVi: 'Cửa hàng hôm nay rất đông.',
        associatedActions: [
          { en: 'wait in a busy waiting room', vi: 'chờ trong phòng chờ đông đúc' },
          { en: 'manage a busy schedule', vi: 'quản lý lịch trình bận rộn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'wait',
        ipa: '/weɪt/',
        partOfSpeech: 'verb',
        meaningVi: 'đợi, chờ',
        exampleEn: 'Please wait here.',
        exampleVi: 'Vui lòng đợi ở đây.',
        associatedActions: [
          { en: 'wait for one\'s turn', vi: 'chờ đến lượt mình' },
          { en: 'wait patiently in line', vi: 'kiên nhẫn chờ trong hàng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'appointment',
        ipa: '/əˈpɔɪntmənt/',
        partOfSpeech: 'noun',
        meaningVi: 'lịch hẹn',
        exampleEn: 'I have a doctor appointment.',
        exampleVi: 'Tôi có lịch hẹn với bác sĩ.',
        associatedActions: [
          { en: 'book a medical appointment', vi: 'đặt một lịch hẹn khám' },
          { en: 'keep an upcoming appointment', vi: 'đến đúng hẹn sắp tới' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'comfortable',
        ipa: '/ˈkʌmftərbəl/',
        partOfSpeech: 'adj',
        meaningVi: 'thoải mái',
        exampleEn: 'This sofa is very comfortable.',
        exampleVi: 'Chiếc ghế sofa này rất thoải mái.',
        associatedActions: [
          { en: 'sit in a comfortable chair', vi: 'ngồi trên chiếc ghế êm ái' },
          { en: 'feel comfortable while waiting', vi: 'cảm thấy thoải mái trong lúc đợi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'call',
        ipa: '/kɔːl/',
        partOfSpeech: 'verb',
        meaningVi: 'gọi',
        exampleEn: 'Did you call me?',
        exampleVi: 'Bạn đã gọi tôi à?',
        associatedActions: [
          { en: 'call a patient\'s name', vi: 'gọi tên bệnh nhân' },
          { en: 'call out loudly', vi: 'gọi to thành tiếng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'It is quite busy today.', translationVi: 'Hôm nay khá đông đúc.' },
      { phrase: 'I have been waiting for...', translationVi: 'Tôi đã đợi khoảng...' },
      { phrase: 'My appointment was at...', translationVi: 'Lịch hẹn của tôi là lúc...' },
      { phrase: 'I hope they call me soon.', translationVi: 'Tôi hy vọng họ sẽ gọi tôi sớm.' },
      { phrase: 'At least the chairs are comfortable.', translationVi: 'Ít nhất thì ghế ngồi cũng thoải mái.' }
    ],
    aiTutorPrompt: 'You are waiting at a clinic. The user starts a conversation about the long wait. Respond politely and share how long you have been waiting.',
    tags: ['waiting', 'clinic', 'delays']
  },
  {
    id: 'soc-small-03',
    category: 'social',
    subcategory: 'small-talk',
    level: 'A1',
    titleEn: 'At a coffee shop line',
    titleVi: 'Trong hàng chờ ở quán cà phê',
    icon: 'Coffee',
    situationVi: 'Bạn đang xếp hàng mua cà phê và nói vài câu với người đứng trước bạn về đồ uống hoặc quán cà phê.',
    sampleDialogue: [
      { speaker: 'A', text: 'The line is so long today.', translationVi: 'Hàng dài quá nhỉ.' },
      { speaker: 'B', text: 'Yes, it always is on Monday mornings.', translationVi: 'Vâng, sáng thứ Hai nào cũng vậy.' },
      { speaker: 'A', text: 'Do you come here often?', translationVi: 'Bạn có thường xuyên đến đây không?' },
      { speaker: 'B', text: 'Every day before work. Their latte is the best.', translationVi: 'Mỗi ngày trước khi đi làm. Latte ở đây là ngon nhất.' },
      { speaker: 'A', text: 'I will have to try it. I usually get black coffee.', translationVi: 'Tôi sẽ phải thử. Tôi thường chỉ uống cà phê đen.' },
      { speaker: 'B', text: 'You should! Oh, it is my turn to order.', translationVi: 'Bạn nên thử! Ồ, đến lượt tôi gọi đồ rồi.' }
    ],
    keyVocabulary: [
      {
        term: 'line',
        ipa: '/laɪn/',
        partOfSpeech: 'noun',
        meaningVi: 'hàng, dòng người',
        exampleEn: 'Stand in line, please.',
        exampleVi: 'Vui lòng đứng vào hàng.',
        associatedActions: [
          { en: 'stand in a coffee shop line', vi: 'xếp hàng ở quán cà phê' },
          { en: 'wait in a long line', vi: 'chờ trong dòng người dài' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'often',
        ipa: '/ˈɔːfn/',
        partOfSpeech: 'adv',
        meaningVi: 'thường xuyên',
        exampleEn: 'I often go running.',
        exampleVi: 'Tôi thường đi chạy bộ.',
        associatedActions: [
          { en: 'visit a cafe often', vi: 'thường xuyên ghé quán cà phê' },
          { en: 'order drinks often', vi: 'thường xuyên gọi đồ uống' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'best',
        ipa: '/best/',
        partOfSpeech: 'adj',
        meaningVi: 'tốt nhất, ngon nhất',
        exampleEn: 'This is the best cake.',
        exampleVi: 'Đây là cái bánh ngon nhất.',
        associatedActions: [
          { en: 'choose the best beverage', vi: 'chọn món đồ uống ngon nhất' },
          { en: 'serve the best coffee', vi: 'phục vụ cà phê ngon tuyệt đỉnh' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'usually',
        ipa: '/ˈjuːʒuəli/',
        partOfSpeech: 'adv',
        meaningVi: 'thường thường',
        exampleEn: 'I usually wake up early.',
        exampleVi: 'Tôi thường dậy sớm.',
        associatedActions: [
          { en: 'usually order black coffee', vi: 'thường hay gọi cà phê đen' },
          { en: 'usually stop by before work', vi: 'thường tạt qua trước giờ làm việc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'turn',
        ipa: '/tɜːrn/',
        partOfSpeech: 'noun',
        meaningVi: 'lượt',
        exampleEn: 'It is your turn to play.',
        exampleVi: 'Đến lượt bạn chơi rồi.',
        associatedActions: [
          { en: 'wait for one\'s turn to order', vi: 'đợi đến lượt mình gọi đồ' },
          { en: 'step up when it is your turn', vi: 'bước lên khi đến lượt mình' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'The line is so long.', translationVi: 'Hàng dài quá.' },
      { phrase: 'Do you come here often?', translationVi: 'Bạn có thường xuyên đến đây không?' },
      { phrase: 'What do you recommend?', translationVi: 'Bạn gợi ý món gì?' },
      { phrase: 'I usually get...', translationVi: 'Tôi thường gọi món...' },
      { phrase: 'It is my turn to order.', translationVi: 'Đến lượt tôi gọi đồ rồi.' }
    ],
    aiTutorPrompt: 'You are standing in line at a coffee shop. The user talks to you about the queue or asks for drink recommendations. Chat casually with them until it is your turn to order.',
    tags: ['coffee', 'waiting', 'morning']
  },
  {
    id: 'soc-small-04',
    category: 'social',
    subcategory: 'small-talk',
    level: 'A1',
    titleEn: 'Talking about the weather',
    titleVi: 'Nói về thời tiết',
    icon: 'CloudSun',
    situationVi: 'Bạn đang đứng ở bến xe buýt và bình luận về thời tiết với một người khác cũng đang chờ xe.',
    sampleDialogue: [
      { speaker: 'A', text: 'Beautiful day, isn\'t it?', translationVi: 'Một ngày đẹp trời nhỉ, phải không?' },
      { speaker: 'B', text: 'Yes, it is very nice. The sun is shining.', translationVi: 'Đúng vậy, rất đẹp. Mặt trời đang chiếu sáng.' },
      { speaker: 'A', text: 'Much better than yesterday. It rained all day.', translationVi: 'Tốt hơn hôm qua nhiều. Hôm qua mưa cả ngày.' },
      { speaker: 'B', text: 'I know! I hate the rain.', translationVi: 'Tôi biết mà! Tôi ghét trời mưa.' },
      { speaker: 'A', text: 'I hope it stays sunny for the weekend.', translationVi: 'Tôi hy vọng trời sẽ tiếp tục nắng vào cuối tuần.' },
      { speaker: 'B', text: 'Me too. I want to go to the park.', translationVi: 'Tôi cũng thế. Tôi muốn đi công viên.' }
    ],
    keyVocabulary: [
      {
        term: 'beautiful',
        ipa: '/ˈbjuːtɪfl/',
        partOfSpeech: 'adj',
        meaningVi: 'đẹp',
        exampleEn: 'The flowers are beautiful.',
        exampleVi: 'Những bông hoa này rất đẹp.',
        associatedActions: [
          { en: 'enjoy a beautiful sunny morning', vi: 'tận hưởng buổi sáng nắng đẹp' },
          { en: 'admire the beautiful scenery', vi: 'chiêm ngưỡng phong cảnh tuyệt đẹp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'sun',
        ipa: '/sʌn/',
        partOfSpeech: 'noun',
        meaningVi: 'mặt trời',
        exampleEn: 'The sun is hot today.',
        exampleVi: 'Mặt trời hôm nay thật nóng.',
        associatedActions: [
          { en: 'bask in the warm sun', vi: 'tắm mình trong ánh nắng ấm áp' },
          { en: 'watch the sun rise', vi: 'ngắm mặt trời mọc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'rain',
        ipa: '/reɪn/',
        partOfSpeech: 'verb/noun',
        meaningVi: 'mưa',
        exampleEn: 'It will rain tomorrow.',
        exampleVi: 'Ngày mai trời sẽ mưa.',
        associatedActions: [
          { en: 'open an umbrella in the rain', vi: 'bung dù khi trời mưa' },
          { en: 'listen to the soothing rain', vi: 'lắng nghe tiếng mưa êm đềm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'hate',
        ipa: '/heɪt/',
        partOfSpeech: 'verb',
        meaningVi: 'ghét',
        exampleEn: 'I hate getting wet.',
        exampleVi: 'Tôi ghét bị ướt.',
        associatedActions: [
          { en: 'hate getting soaked in rain', vi: 'ghét bị ướt sũng trong mưa' },
          { en: 'express dislike for wet weather', vi: 'bày tỏ sự không thích thời tiết ẩm ướt' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'sunny',
        ipa: '/ˈsʌni/',
        partOfSpeech: 'adj',
        meaningVi: 'có nắng',
        exampleEn: 'It is a sunny day.',
        exampleVi: 'Đó là một ngày nắng.',
        associatedActions: [
          { en: 'walk in the sunny weather', vi: 'đi dạo trong tiết trời nắng ráo' },
          { en: 'wear sunglasses on sunny days', vi: 'đeo kính râm vào những ngày nắng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Beautiful day, isn\'t it?', translationVi: 'Một ngày đẹp trời nhỉ, phải không?' },
      { phrase: 'Much better than yesterday.', translationVi: 'Tốt hơn hôm qua nhiều.' },
      { phrase: 'It rained all day.', translationVi: 'Trời mưa cả ngày.' },
      { phrase: 'I hope it stays sunny.', translationVi: 'Tôi hy vọng trời vẫn sẽ nắng.' },
      { phrase: 'The weather is terrible today.', translationVi: 'Thời tiết hôm nay thật tồi tệ.' }
    ],
    aiTutorPrompt: 'You are waiting at a bus stop. The user remarks on the weather. Agree with them and exchange a few simple comments about recent weather or weekend plans.',
    tags: ['weather', 'casual', 'everyday']
  },
  {
    id: 'soc-small-05',
    category: 'social',
    subcategory: 'small-talk',
    level: 'A2',
    titleEn: 'Commenting on a sports game',
    titleVi: 'Bình luận về một trận thể thao',
    icon: 'Trophy',
    situationVi: 'Bạn đang xem một trận bóng đá tại quán pub và bắt chuyện với người ngồi cạnh về diễn biến của trận đấu.',
    sampleDialogue: [
      { speaker: 'A', text: 'Did you see that goal? That was amazing!', translationVi: 'Anh có thấy bàn thắng đó không? Thật không thể tin được!' },
      { speaker: 'B', text: 'Yeah, it was brilliant! Number 10 is playing really well today.', translationVi: 'Đúng vậy, quá xuất sắc! Số 10 hôm nay chơi rất hay.' },
      { speaker: 'A', text: 'He is. I think they will win this match easily.', translationVi: 'Đúng thế. Tôi nghĩ họ sẽ dễ dàng thắng trận này.' },
      { speaker: 'B', text: 'I am not so sure. The other team is very strong in the second half.', translationVi: 'Tôi không chắc lắm. Đội kia rất mạnh trong hiệp hai.' },
      { speaker: 'A', text: 'True. We will see what happens. Are you a fan of this team?', translationVi: 'Đúng vậy. Để xem sao. Anh có phải là fan của đội này không?' },
      { speaker: 'B', text: 'Yes, I watch all their games. Cheers!', translationVi: 'Vâng, tôi xem mọi trận của họ. Dô nào!' }
    ],
    keyVocabulary: [
      {
        term: 'goal',
        ipa: '/ɡoʊl/',
        partOfSpeech: 'noun',
        meaningVi: 'bàn thắng',
        exampleEn: 'He scored a beautiful goal.',
        exampleVi: 'Anh ấy đã ghi một bàn thắng đẹp.',
        associatedActions: [
          { en: 'score a sensational goal', vi: 'ghi một bàn thắng tuyệt đỉnh' },
          { en: 'cheer for a goal', vi: 'reo hò cổ vũ cho bàn thắng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'brilliant',
        ipa: '/ˈbrɪliənt/',
        partOfSpeech: 'adj',
        meaningVi: 'xuất sắc, tuyệt vời',
        exampleEn: 'That was a brilliant pass.',
        exampleVi: 'Đó là một đường chuyền xuất sắc.',
        associatedActions: [
          { en: 'make a brilliant pass', vi: 'thực hiện đường chuyền xuất sắc' },
          { en: 'applaud a brilliant play', vi: 'vỗ tay tán thưởng pha bóng xuất thần' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'match',
        ipa: '/mætʃ/',
        partOfSpeech: 'noun',
        meaningVi: 'trận đấu',
        exampleEn: 'Are you going to the match?',
        exampleVi: 'Bạn có đi xem trận đấu không?',
        associatedActions: [
          { en: 'watch a live football match', vi: 'xem trực tiếp một trận bóng đá' },
          { en: 'discuss the match outcome', vi: 'bàn luận kết quả trận đấu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'half',
        ipa: '/hæf/',
        partOfSpeech: 'noun',
        meaningVi: 'hiệp đấu, một nửa',
        exampleEn: 'They scored in the first half.',
        exampleVi: 'Họ ghi bàn trong hiệp một.',
        associatedActions: [
          { en: 'play during the second half', vi: 'thi đấu trong hiệp hai' },
          { en: 'take a rest at half time', vi: 'nghỉ giải lao giữa hai hiệp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'fan',
        ipa: '/fæn/',
        partOfSpeech: 'noun',
        meaningVi: 'người hâm mộ',
        exampleEn: 'I am a big fan of football.',
        exampleVi: 'Tôi là người hâm mộ bóng đá cuồng nhiệt.',
        associatedActions: [
          { en: 'cheer as a passionate fan', vi: 'cổ vũ cuồng nhiệt như một người hâm mộ' },
          { en: 'wear team jerseys with fans', vi: 'mặc áo đấu cùng các cổ động viên' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Did you see that goal?', translationVi: 'Anh có thấy bàn thắng đó không?' },
      { phrase: 'That was amazing!', translationVi: 'Thật tuyệt vời!' },
      { phrase: 'They are playing really well.', translationVi: 'Họ đang chơi rất tốt.' },
      { phrase: 'Who do you think will win?', translationVi: 'Anh nghĩ ai sẽ thắng?' },
      { phrase: 'Are you a fan of this team?', translationVi: 'Anh có phải là fan của đội này không?' }
    ],
    aiTutorPrompt: 'You are watching a sports game at a bar. The user talks to you about the game. React enthusiastically and discuss the players and your predictions for the match.',
    tags: ['sports', 'bar', 'hobbies']
  },
  {
    id: 'soc-small-06',
    category: 'social',
    subcategory: 'small-talk',
    level: 'B1',
    titleEn: 'Chatting at a wedding reception',
    titleVi: 'Trò chuyện tại tiệc cưới',
    icon: 'GlassWater',
    situationVi: 'Bạn đang tham dự một tiệc cưới và ngồi cùng bàn với những người bạn chưa quen. Bạn bắt đầu trò chuyện với họ.',
    sampleDialogue: [
      { speaker: 'A', text: 'Hi, I am Mark. I am a friend of the groom from college.', translationVi: 'Xin chào, tôi là Mark. Tôi là bạn học đại học của chú rể.' },
      { speaker: 'B', text: 'Nice to meet you, Mark. I am Lisa, the bride\'s cousin.', translationVi: 'Rất vui được gặp bạn, Mark. Tôi là Lisa, em họ của cô dâu.' },
      { speaker: 'A', text: 'Oh, nice to meet you, Lisa. The ceremony was beautiful, wasn\'t it?', translationVi: 'Ồ, rất vui được gặp bạn, Lisa. Buổi lễ thật đẹp, phải không?' },
      { speaker: 'B', text: 'It really was. I almost cried when they said their vows.', translationVi: 'Thực sự là vậy. Tôi suýt khóc khi họ đọc lời thề.' },
      { speaker: 'A', text: 'Me too. By the way, have you tried the appetizers? They are fantastic.', translationVi: 'Tôi cũng vậy. Nhân tiện, bạn đã thử các món khai vị chưa? Tuyệt lắm đấy.' },
      { speaker: 'B', text: 'Not yet, I will go grab some in a minute.', translationVi: 'Chưa, tôi sẽ đi lấy một ít ngay bây giờ.' }
    ],
    keyVocabulary: [
      {
        term: 'groom',
        ipa: '/ɡruːm/',
        partOfSpeech: 'noun',
        meaningVi: 'chú rể',
        exampleEn: 'The groom looked very handsome.',
        exampleVi: 'Chú rể trông rất đẹp trai.',
        associatedActions: [
          { en: 'congratulate the groom', vi: 'chúc mừng chú rể' },
          { en: 'stand beside the groom', vi: 'đứng bên cạnh chú rể' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'bride',
        ipa: '/braɪd/',
        partOfSpeech: 'noun',
        meaningVi: 'cô dâu',
        exampleEn: 'The bride wore a white dress.',
        exampleVi: 'Cô dâu mặc một chiếc váy trắng.',
        associatedActions: [
          { en: 'admire the radiant bride', vi: 'chiêm ngưỡng cô dâu rạng rỡ' },
          { en: 'toast to the lovely bride', vi: 'nâng ly chúc mừng cô dâu đáng yêu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'ceremony',
        ipa: '/ˈserəmoʊni/',
        partOfSpeech: 'noun',
        meaningVi: 'buổi lễ',
        exampleEn: 'The wedding ceremony was short.',
        exampleVi: 'Buổi lễ cưới diễn ra ngắn gọn.',
        associatedActions: [
          { en: 'attend the solemn ceremony', vi: 'tham dự buổi lễ trang nghiêm' },
          { en: 'take photos at the ceremony', vi: 'chụp ảnh lưu niệm tại buổi lễ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'vow',
        ipa: '/vaʊ/',
        partOfSpeech: 'noun',
        meaningVi: 'lời thề',
        exampleEn: 'They exchanged their wedding vows.',
        exampleVi: 'Họ trao nhau lời thề trong đám cưới.',
        associatedActions: [
          { en: 'read heartfelt marriage vows', vi: 'đọc lời thề hôn nhân chân thành' },
          { en: 'listen to wedding vows', vi: 'lắng nghe những lời thề nguyện' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'appetizer',
        ipa: '/ˈæpɪtaɪzər/',
        partOfSpeech: 'noun',
        meaningVi: 'món khai vị',
        exampleEn: 'We ordered some appetizers.',
        exampleVi: 'Chúng tôi đã gọi vài món khai vị.',
        associatedActions: [
          { en: 'sample delicious appetizers', vi: 'nếm thử các món khai vị thơm ngon' },
          { en: 'pass around appetizer plates', vi: 'chuyền tay nhau những đĩa đồ ăn khai vị' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I am a friend of the groom.', translationVi: 'Tôi là bạn của chú rể.' },
      { phrase: 'How do you know the couple?', translationVi: 'Bạn biết cô dâu chú rể như thế nào?' },
      { phrase: 'The ceremony was beautiful.', translationVi: 'Buổi lễ thật đẹp.' },
      { phrase: 'Have you tried the food?', translationVi: 'Bạn đã thử đồ ăn chưa?' },
      { phrase: 'It is a wonderful venue.', translationVi: 'Đây là một địa điểm tuyệt vời.' }
    ],
    aiTutorPrompt: 'You are seated at a table at a wedding reception. The user introduces themselves. Explain your relationship to the bride/groom and chat about the wedding.',
    tags: ['wedding', 'celebration', 'food']
  },
  {
    id: 'soc-small-07',
    category: 'social',
    subcategory: 'small-talk',
    level: 'A2',
    titleEn: 'Small talk with a taxi driver',
    titleVi: 'Nói chuyện phiếm với tài xế taxi',
    icon: 'Car',
    situationVi: 'Bạn đang đi taxi và tài xế bắt chuyện với bạn về tình hình giao thông và điểm đến của bạn.',
    sampleDialogue: [
      { speaker: 'A', text: 'Traffic is really bad today, isn\'t it?', translationVi: 'Giao thông hôm nay thật tệ, phải không?' },
      { speaker: 'B', text: 'Yeah, there must be an accident on the highway.', translationVi: 'Vâng, chắc hẳn có tai nạn trên đường cao tốc.' },
      { speaker: 'A', text: 'Are you heading to the airport for a trip?', translationVi: 'Bạn đang đến sân bay để đi du lịch à?' },
      { speaker: 'B', text: 'Yes, I am going to London for a business conference.', translationVi: 'Vâng, tôi đi London dự một hội nghị kinh doanh.' },
      { speaker: 'A', text: 'London! That is exciting. Have you been there before?', translationVi: 'London! Thú vị thật. Bạn đã từng đến đó chưa?' },
      { speaker: 'B', text: 'No, this is my first time. I am looking forward to it.', translationVi: 'Chưa, đây là lần đầu tiên của tôi. Tôi đang rất mong đợi.' }
    ],
    keyVocabulary: [
      {
        term: 'traffic',
        ipa: '/ˈtræfɪk/',
        partOfSpeech: 'noun',
        meaningVi: 'giao thông',
        exampleEn: 'We got stuck in heavy traffic.',
        exampleVi: 'Chúng tôi bị kẹt trong dòng giao thông đông đúc.',
        associatedActions: [
          { en: 'get stuck in morning traffic', vi: 'bị kẹt trong dòng xe cộ buổi sáng' },
          { en: 'check traffic conditions on mobile', vi: 'kiểm tra tình hình giao thông trên điện thoại' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'accident',
        ipa: '/ˈæksɪdənt/',
        partOfSpeech: 'noun',
        meaningVi: 'tai nạn',
        exampleEn: 'There was a car accident.',
        exampleVi: 'Đã xảy ra một vụ tai nạn xe hơi.',
        associatedActions: [
          { en: 'avoid a traffic accident', vi: 'tránh một vụ tai nạn giao thông' },
          { en: 'report a roadside accident', vi: 'báo cáo tai nạn bên đường' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'highway',
        ipa: '/ˈhaɪweɪ/',
        partOfSpeech: 'noun',
        meaningVi: 'đường cao tốc',
        exampleEn: 'Take the highway to the city.',
        exampleVi: 'Đi đường cao tốc vào thành phố.',
        associatedActions: [
          { en: 'drive along the open highway', vi: 'lái xe dọc theo đường cao tốc thông thoáng' },
          { en: 'take the highway exit', vi: 'rẽ vào lối ra đường cao tốc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'trip',
        ipa: '/trɪp/',
        partOfSpeech: 'noun',
        meaningVi: 'chuyến đi',
        exampleEn: 'Have a safe trip!',
        exampleVi: 'Thượng lộ bình an nhé!',
        associatedActions: [
          { en: 'pack bags for a business trip', vi: 'xếp hành lý cho chuyến công tác' },
          { en: 'embark on an exciting trip', vi: 'bắt đầu một chuyến đi thú vị' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'conference',
        ipa: '/ˈkɑːnfərəns/',
        partOfSpeech: 'noun',
        meaningVi: 'hội nghị',
        exampleEn: 'I am attending a medical conference.',
        exampleVi: 'Tôi đang tham gia một hội nghị y khoa.',
        associatedActions: [
          { en: 'attend an annual conference', vi: 'tham dự hội nghị thường niên' },
          { en: 'give a talk at a conference', vi: 'thuyết trình tại hội nghị' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Traffic is really bad today.', translationVi: 'Giao thông hôm nay thật tệ.' },
      { phrase: 'Are you heading to...?', translationVi: 'Bạn đang đi đến... à?' },
      { phrase: 'Is it your first time visiting?', translationVi: 'Đây có phải là lần đầu bạn đến thăm không?' },
      { phrase: 'I am travelling for business.', translationVi: 'Tôi đi công tác.' },
      { phrase: 'I am looking forward to it.', translationVi: 'Tôi đang rất mong đợi điều đó.' }
    ],
    aiTutorPrompt: 'You are a friendly taxi driver. Chat with your passenger (the user) about the traffic and their destination.',
    tags: ['taxi', 'travel', 'traffic']
  },
  {
    id: 'soc-small-08',
    category: 'social',
    subcategory: 'small-talk',
    level: 'B1',
    titleEn: 'Breaking the ice at a networking event',
    titleVi: 'Bắt chuyện tại một sự kiện kết nối',
    icon: 'Briefcase',
    situationVi: 'Bạn đang tham gia một sự kiện kết nối doanh nghiệp (networking). Bạn chủ động tiến đến bắt chuyện với một người lạ để mở rộng mối quan hệ.',
    sampleDialogue: [
      { speaker: 'A', text: 'Hi, mind if I join you? I am Sarah from Tech Solutions.', translationVi: 'Xin chào, bạn có phiền nếu tôi tham gia cùng không? Tôi là Sarah từ Tech Solutions.' },
      { speaker: 'B', text: 'Of course not! I am James, with Creative Designs. Nice to meet you, Sarah.', translationVi: 'Tất nhiên là không rồi! Tôi là James, làm ở Creative Designs. Rất vui được gặp bạn, Sarah.' },
      { speaker: 'A', text: 'Creative Designs? I have seen your recent campaign. It was very impressive.', translationVi: 'Creative Designs à? Tôi đã thấy chiến dịch gần đây của các bạn. Rất ấn tượng đấy.' },
      { speaker: 'B', text: 'Thank you! We worked really hard on it. What does your company specialize in?', translationVi: 'Cảm ơn bạn! Chúng tôi đã làm việc rất chăm chỉ cho nó. Công ty bạn chuyên về lĩnh vực gì?' },
      { speaker: 'A', text: 'We develop cloud-based accounting software for small businesses.', translationVi: 'Chúng tôi phát triển phần mềm kế toán trên nền tảng đám mây cho các doanh nghiệp nhỏ.' },
      { speaker: 'B', text: 'That sounds very useful. We are actually looking for new software right now.', translationVi: 'Nghe có vẻ rất hữu ích. Thực ra chúng tôi cũng đang tìm kiếm phần mềm mới.' }
    ],
    keyVocabulary: [
      {
        term: 'join',
        ipa: '/dʒɔɪn/',
        partOfSpeech: 'verb',
        meaningVi: 'tham gia cùng',
        exampleEn: 'May I join you?',
        exampleVi: 'Tôi có thể tham gia cùng bạn không?',
        associatedActions: [
          { en: 'join a networking circle', vi: 'tham gia vòng trò chuyện kết nối' },
          { en: 'ask to join a conversation', vi: 'xin phép tham gia cuộc trò chuyện' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'campaign',
        ipa: '/kæmˈpeɪn/',
        partOfSpeech: 'noun',
        meaningVi: 'chiến dịch',
        exampleEn: 'The marketing campaign was a success.',
        exampleVi: 'Chiến dịch tiếp thị đã thành công.',
        associatedActions: [
          { en: 'launch a marketing campaign', vi: 'tung ra chiến dịch tiếp thị' },
          { en: 'manage an advertising campaign', vi: 'quản lý chiến dịch quảng cáo' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'impressive',
        ipa: '/ɪmˈpresɪv/',
        partOfSpeech: 'adj',
        meaningVi: 'ấn tượng',
        exampleEn: 'Her presentation was impressive.',
        exampleVi: 'Bài thuyết trình của cô ấy rất ấn tượng.',
        associatedActions: [
          { en: 'deliver an impressive pitch', vi: 'trình bày bài thuyết trình đầy ấn tượng' },
          { en: 'show impressive results', vi: 'thể hiện những kết quả ấn tượng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'specialize',
        ipa: '/ˈspeʃəlaɪz/',
        partOfSpeech: 'verb',
        meaningVi: 'chuyên về',
        exampleEn: 'They specialize in web design.',
        exampleVi: 'Họ chuyên về thiết kế web.',
        associatedActions: [
          { en: 'specialize in cloud solutions', vi: 'chuyên sâu về giải pháp đám mây' },
          { en: 'specialize in digital marketing', vi: 'chuyên về tiếp thị kỹ thuật số' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'software',
        ipa: '/ˈsɔːftwer/',
        partOfSpeech: 'noun',
        meaningVi: 'phần mềm',
        exampleEn: 'I need to update my software.',
        exampleVi: 'Tôi cần cập nhật phần mềm của mình.',
        associatedActions: [
          { en: 'develop enterprise software', vi: 'phát triển phần mềm doanh nghiệp' },
          { en: 'install software updates', vi: 'cài đặt các bản cập nhật phần mềm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Mind if I join you?', translationVi: 'Bạn có phiền nếu tôi tham gia cùng không?' },
      { phrase: 'What line of work are you in?', translationVi: 'Bạn làm trong lĩnh vực gì?' },
      { phrase: 'What does your company specialize in?', translationVi: 'Công ty bạn chuyên về cái gì?' },
      { phrase: 'I have seen your recent work.', translationVi: 'Tôi đã xem các công việc gần đây của bạn.' },
      { phrase: 'Here is my business card.', translationVi: 'Đây là danh thiếp của tôi.' }
    ],
    aiTutorPrompt: 'You are at a professional networking event. The user introduces themselves to you. Respond professionally, ask about their business, and look for opportunities to collaborate.',
    tags: ['networking', 'business', 'introductions']
  }
];
