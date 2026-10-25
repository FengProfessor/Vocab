/**
 * LingoPro Speaking Topic Library
 * Category: Social
 * Subcategory: Giving Advice
 * File: src/data/speaking/topic-library/social/giving-advice.ts
 *
 * 6 sub-topics covering asking for and giving advice in different scenarios.
 * CEFR Range: A2 - B2
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const GIVING_ADVICE_ITEMS: TopicLibraryItem[] = [
  {
    id: 'soc-adv-01',
    category: 'social',
    subcategory: 'giving-advice',
    level: 'A2',
    titleEn: 'Advice about choosing a school',
    titleVi: 'Lời khuyên về việc chọn trường',
    icon: 'GraduationCap',
    situationVi: 'Người thân của bạn đang phân vân chọn trường cấp 3 cho con. Họ gọi điện hỏi ý kiến và bạn đưa ra một vài lời khuyên cơ bản.',
    sampleDialogue: [
      { speaker: 'A', text: 'I am not sure which high school to choose for Tommy.', translationVi: 'Tôi không chắc nên chọn trường cấp 3 nào cho Tommy.' },
      { speaker: 'B', text: 'Have you visited the schools yet? I think you should take a tour.', translationVi: 'Bạn đã đến thăm các trường chưa? Tôi nghĩ bạn nên đi tham quan một vòng.' },
      { speaker: 'A', text: 'We went to Lincoln High last week. It was nice, but very far.', translationVi: 'Tuần trước chúng tôi đã đến trường Lincoln. Trường rất đẹp, nhưng rất xa.' },
      { speaker: 'B', text: 'If it is too far, maybe you should consider a closer one. Travel time is important.', translationVi: 'Nếu xa quá, có lẽ bạn nên cân nhắc một trường gần hơn. Thời gian đi lại rất quan trọng.' },
      { speaker: 'A', text: 'That is a good point. The local school is only 10 minutes away.', translationVi: 'Đó là một ý kiến hay. Trường ở địa phương chỉ cách đây 10 phút.' },
      { speaker: 'B', text: 'You should ask some parents there about the teachers.', translationVi: 'Bạn nên hỏi vài phụ huynh ở đó về giáo viên.' }
    ],
    keyVocabulary: [
      {
        term: 'choose',
        ipa: '/tʃuːz/',
        partOfSpeech: 'verb',
        meaningVi: 'lựa chọn',
        exampleEn: 'Which one will you choose?',
        exampleVi: 'Bạn sẽ chọn cái nào?',
        associatedActions: [
          { en: 'compare school brochures', vi: 'so sánh các tờ rơi giới thiệu trường' },
          { en: 'make a final decision', vi: 'đưa ra quyết định cuối cùng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'visit',
        ipa: '/ˈvɪzɪt/',
        partOfSpeech: 'verb',
        meaningVi: 'thăm',
        exampleEn: 'We will visit the museum tomorrow.',
        exampleVi: 'Chúng tôi sẽ thăm bảo tàng vào ngày mai.',
        associatedActions: [
          { en: 'walk through classrooms', vi: 'đi bộ qua các phòng học' },
          { en: 'talk to admissions staff', vi: 'trò chuyện với nhân viên tuyển sinh' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'tour',
        ipa: '/tʊr/',
        partOfSpeech: 'noun',
        meaningVi: 'chuyến tham quan',
        exampleEn: 'We took a tour of the campus.',
        exampleVi: 'Chúng tôi đã đi tham quan khuôn viên trường.',
        associatedActions: [
          { en: 'explore library facilities', vi: 'khám phá cơ sở vật chất thư viện' },
          { en: 'follow student guide', vi: 'đi theo sinh viên hướng dẫn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'consider',
        ipa: '/kənˈsɪdər/',
        partOfSpeech: 'verb',
        meaningVi: 'cân nhắc',
        exampleEn: 'You should consider all your options.',
        exampleVi: 'Bạn nên cân nhắc mọi lựa chọn.',
        associatedActions: [
          { en: 'weigh commuting distance', vi: 'cân nhắc khoảng cách đi lại' },
          { en: 'evaluate tuition costs', vi: 'đánh giá chi phí học phí' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'important',
        ipa: '/ɪmˈpɔːrtnt/',
        partOfSpeech: 'adj',
        meaningVi: 'quan trọng',
        exampleEn: 'It is important to study hard.',
        exampleVi: 'Học hành chăm chỉ là điều quan trọng.',
        associatedActions: [
          { en: 'highlight key priorities', vi: 'nêu bật các ưu tiên then chốt' },
          { en: 'keep safety in mind', vi: 'luôn chú ý đến sự an toàn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I am not sure which... to choose.', translationVi: 'Tôi không chắc nên chọn... nào.' },
      { phrase: 'I think you should...', translationVi: 'Tôi nghĩ bạn nên...' },
      { phrase: 'Maybe you should consider...', translationVi: 'Có lẽ bạn nên cân nhắc...' },
      { phrase: 'That is a good point.', translationVi: 'Đó là một ý kiến hay.' },
      { phrase: 'You should ask someone about...', translationVi: 'Bạn nên hỏi ai đó về...' }
    ],
    aiTutorPrompt: 'You are a parent trying to choose a high school for your child. Ask the user for advice and react to their suggestions.',
    tags: ['education', 'school', 'advice']
  },
  {
    id: 'soc-adv-02',
    category: 'social',
    subcategory: 'giving-advice',
    level: 'A2',
    titleEn: 'Health and exercise advice',
    titleVi: 'Lời khuyên về sức khỏe và tập thể dục',
    icon: 'Activity',
    situationVi: 'Một người bạn than phiền rằng họ cảm thấy mệt mỏi và không có sức sống dạo gần đây. Bạn khuyên họ nên thay đổi thói quen tập luyện và ăn uống.',
    sampleDialogue: [
      { speaker: 'A', text: 'I feel so tired all the time lately. I have no energy.', translationVi: 'Dạo này mình thấy lúc nào cũng mệt mỏi. Mình chả có năng lượng gì cả.' },
      { speaker: 'B', text: 'Are you getting enough sleep? You really should sleep 8 hours a day.', translationVi: 'Bạn có ngủ đủ giấc không? Bạn thực sự nên ngủ 8 tiếng một ngày.' },
      { speaker: 'A', text: 'I try, but I am stressed. And I sit at my desk all day.', translationVi: 'Mình có cố, nhưng mình bị căng thẳng. Và mình ngồi ở bàn làm việc cả ngày.' },
      { speaker: 'B', text: 'Why do not you try exercising? A short walk every evening could help.', translationVi: 'Sao bạn không thử tập thể dục? Một chuyến đi dạo ngắn mỗi tối có thể giúp ích đấy.' },
      { speaker: 'A', text: 'I guess I could do that. I am just so lazy after work.', translationVi: 'Mình đoán là mình có thể làm vậy. Mình chỉ quá lười sau giờ làm thôi.' },
      { speaker: 'B', text: 'You should also drink more water. It makes a big difference.', translationVi: 'Bạn cũng nên uống nhiều nước hơn. Nó sẽ tạo ra sự khác biệt lớn đấy.' }
    ],
    keyVocabulary: [
      {
        term: 'tired',
        ipa: '/ˈtaɪərd/',
        partOfSpeech: 'adj',
        meaningVi: 'mệt mỏi',
        exampleEn: 'I am too tired to go out.',
        exampleVi: 'Tôi quá mệt để ra ngoài.',
        associatedActions: [
          { en: 'rub tired eyes', vi: 'dụi đôi mắt mỏi mệt' },
          { en: 'take short afternoon nap', vi: 'chợp mắt một giấc ngắn buổi chiều' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'energy',
        ipa: '/ˈenərdʒi/',
        partOfSpeech: 'noun',
        meaningVi: 'năng lượng',
        exampleEn: 'Children have a lot of energy.',
        exampleVi: 'Trẻ em có rất nhiều năng lượng.',
        associatedActions: [
          { en: 'drink fresh fruit smoothie', vi: 'uống sinh tố hoa quả tươi' },
          { en: 'recharge through deep sleep', vi: 'nạp lại năng lượng qua giấc ngủ sâu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'stressed',
        ipa: '/strest/',
        partOfSpeech: 'adj',
        meaningVi: 'căng thẳng',
        exampleEn: 'I feel stressed about the exam.',
        exampleVi: 'Tôi cảm thấy căng thẳng về kỳ thi.',
        associatedActions: [
          { en: 'practice deep breathing', vi: 'thực hành hít thở sâu' },
          { en: 'take break from screens', vi: 'tạm rời xa màn hình thiết bị' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'exercise',
        ipa: '/ˈeksərsaɪz/',
        partOfSpeech: 'verb/noun',
        meaningVi: 'tập thể dục',
        exampleEn: 'You need to exercise regularly.',
        exampleVi: 'Bạn cần tập thể dục thường xuyên.',
        associatedActions: [
          { en: 'jog around neighborhood', vi: 'chạy bộ quanh khu phố' },
          { en: 'stretch on yoga mat', vi: 'giãn cơ trên thảm tập yoga' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'difference',
        ipa: '/ˈdɪfrəns/',
        partOfSpeech: 'noun',
        meaningVi: 'sự khác biệt',
        exampleEn: 'Diet makes a big difference in health.',
        exampleVi: 'Chế độ ăn tạo ra khác biệt lớn cho sức khỏe.',
        associatedActions: [
          { en: 'notice health improvements', vi: 'nhận thấy những cải thiện sức khỏe' },
          { en: 'track physical changes', vi: 'theo dõi các thay đổi của cơ thể' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I feel so tired lately.', translationVi: 'Dạo này tôi thấy rất mệt.' },
      { phrase: 'Are you getting enough sleep?', translationVi: 'Bạn có ngủ đủ không?' },
      { phrase: 'You really should...', translationVi: 'Bạn thực sự nên...' },
      { phrase: 'Why do not you try...?', translationVi: 'Sao bạn không thử...?' },
      { phrase: 'It makes a big difference.', translationVi: 'Nó tạo ra sự khác biệt lớn.' }
    ],
    aiTutorPrompt: 'You are a friend who is constantly feeling tired and lethargic. Ask the user for health advice and respond to their suggestions with some reluctance but willingness to try.',
    tags: ['health', 'exercise', 'lifestyle']
  },
  {
    id: 'soc-adv-03',
    category: 'social',
    subcategory: 'giving-advice',
    level: 'B1',
    titleEn: 'Advice on saving money',
    titleVi: 'Lời khuyên về tiết kiệm tiền',
    icon: 'PiggyBank',
    situationVi: 'Bạn thân của bạn luôn than hết tiền vào cuối tháng. Họ nhờ bạn đưa ra vài cách thiết thực để quản lý chi tiêu và tiết kiệm tốt hơn.',
    sampleDialogue: [
      { speaker: 'A', text: 'I do not know where my money goes. I am always broke before payday.', translationVi: 'Mình không biết tiền của mình đi đâu hết. Mình luôn rỗng túi trước ngày nhận lương.' },
      { speaker: 'B', text: 'If I were you, I would start tracking every expense using an app.', translationVi: 'Nếu tôi là bạn, tôi sẽ bắt đầu theo dõi mọi khoản chi tiêu bằng một ứng dụng.' },
      { speaker: 'A', text: 'I tried that once, but I gave up after a week.', translationVi: 'Mình đã thử một lần rồi, nhưng mình bỏ cuộc sau một tuần.' },
      { speaker: 'B', text: 'You need to be consistent. Also, you ought to cook at home more instead of eating out.', translationVi: 'Bạn cần kiên trì. Ngoài ra, bạn nên nấu ăn ở nhà nhiều hơn thay vì ăn ngoài.' },
      { speaker: 'A', text: 'Yeah, eating out is definitely costing me a lot. Any other tips?', translationVi: 'Đúng vậy, ăn ngoài chắc chắn tốn rất nhiều tiền của mình. Có mẹo nào khác không?' },
      { speaker: 'B', text: 'Try the 50-30-20 rule. Put 20 percent of your salary straight into savings as soon as you get paid.', translationVi: 'Hãy thử quy tắc 50-30-20. Bỏ thẳng 20 phần trăm lương vào tiết kiệm ngay khi nhận được tiền.' }
    ],
    keyVocabulary: [
      {
        term: 'broke',
        ipa: '/broʊk/',
        partOfSpeech: 'adj',
        meaningVi: 'cháy túi, hết tiền',
        exampleEn: 'I cannot go out, I am broke.',
        exampleVi: 'Tôi không thể đi chơi, tôi hết tiền rồi.',
        associatedActions: [
          { en: 'open empty wallet', vi: 'mở chiếc ví trống rỗng' },
          { en: 'check depleted bank balance', vi: 'kiểm tra số dư tài khoản đã cạn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'payday',
        ipa: '/ˈpeɪdeɪ/',
        partOfSpeech: 'noun',
        meaningVi: 'ngày nhận lương',
        exampleEn: 'Friday is payday.',
        exampleVi: 'Thứ Sáu là ngày nhận lương.',
        associatedActions: [
          { en: 'receive salary notification', vi: 'nhận thông báo trả lương' },
          { en: 'deposit monthly paycheck', vi: 'gửi séc lương hàng tháng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'track',
        ipa: '/træk/',
        partOfSpeech: 'verb',
        meaningVi: 'theo dõi',
        exampleEn: 'You should track your spending.',
        exampleVi: 'Bạn nên theo dõi chi tiêu của mình.',
        associatedActions: [
          { en: 'log daily expenses in app', vi: 'ghi lại chi tiêu hàng ngày trên ứng dụng' },
          { en: 'review monthly statement', vi: 'xem lại sao kê hàng tháng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'expense',
        ipa: '/ɪkˈspens/',
        partOfSpeech: 'noun',
        meaningVi: 'khoản chi phí',
        exampleEn: 'Rent is my biggest expense.',
        exampleVi: 'Tiền thuê nhà là khoản chi lớn nhất của tôi.',
        associatedActions: [
          { en: 'pay apartment utility bills', vi: 'thanh toán hóa đơn tiện ích căn hộ' },
          { en: 'cut unnecessary dining costs', vi: 'cắt giảm chi phí ăn uống ngoài không cần thiết' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'consistent',
        ipa: '/kənˈsɪstənt/',
        partOfSpeech: 'adj',
        meaningVi: 'kiên định, nhất quán',
        exampleEn: 'You must be consistent with your diet.',
        exampleVi: 'Bạn phải kiên trì với chế độ ăn kiêng của mình.',
        associatedActions: [
          { en: 'save money every month', vi: 'tiết kiệm tiền đều đặn mỗi tháng' },
          { en: 'stick to monthly budget', vi: 'tuân thủ chặt chẽ ngân sách tháng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I am always broke before payday.', translationVi: 'Tôi luôn hết tiền trước ngày nhận lương.' },
      { phrase: 'If I were you, I would...', translationVi: 'Nếu tôi là bạn, tôi sẽ...' },
      { phrase: 'You need to be consistent.', translationVi: 'Bạn cần phải kiên trì.' },
      { phrase: 'You ought to...', translationVi: 'Bạn nên...' },
      { phrase: 'Put money straight into savings.', translationVi: 'Gửi thẳng tiền vào khoản tiết kiệm.' }
    ],
    aiTutorPrompt: 'You are struggling to save money and often spend too much. The user is your friend trying to give you financial advice. Listen to their tips and discuss how to implement them.',
    tags: ['money', 'saving', 'finance']
  },
  {
    id: 'soc-adv-04',
    category: 'social',
    subcategory: 'giving-advice',
    level: 'B1',
    titleEn: 'Relationship advice',
    titleVi: 'Lời khuyên về mối quan hệ',
    icon: 'Heart',
    situationVi: 'Một người bạn đang gặp trục trặc với người yêu do thiếu giao tiếp. Bạn lắng nghe và khuyên họ cách nói chuyện để giải quyết vấn đề.',
    sampleDialogue: [
      { speaker: 'A', text: 'Mark and I had another big fight last night. He never listens to me.', translationVi: 'Mark và mình lại cãi nhau to tối qua. Anh ấy chẳng bao giờ lắng nghe mình cả.' },
      { speaker: 'B', text: 'I am sorry to hear that. Have you told him how you feel when he ignores you?', translationVi: 'Mình rất tiếc khi nghe vậy. Bạn đã nói cho anh ấy biết cảm giác của bạn khi anh ấy phớt lờ bạn chưa?' },
      { speaker: 'A', text: 'I try, but I just get angry and start yelling.', translationVi: 'Mình có cố, nhưng mình lại nổi giận và bắt đầu la hét.' },
      { speaker: 'B', text: 'My advice is to sit down when you are both calm. Use "I" statements instead of blaming him.', translationVi: 'Lời khuyên của mình là hãy ngồi xuống khi cả hai bình tĩnh. Hãy dùng các câu có chủ ngữ "Tôi" thay vì đổ lỗi cho anh ấy.' },
      { speaker: 'A', text: 'Like saying "I feel hurt when..." instead of "You always..."?', translationVi: 'Như là nói "Em cảm thấy tổn thương khi..." thay vì "Anh lúc nào cũng..." à?' },
      { speaker: 'B', text: 'Exactly. It makes a huge difference in communication.', translationVi: 'Chính xác. Điều đó tạo ra sự khác biệt rất lớn trong giao tiếp.' }
    ],
    keyVocabulary: [
      {
        term: 'fight',
        ipa: '/faɪt/',
        partOfSpeech: 'noun',
        meaningVi: 'cuộc cãi vã, trận đánh',
        exampleEn: 'We had a fight over money.',
        exampleVi: 'Chúng tôi cãi nhau vì tiền.',
        associatedActions: [
          { en: 'argue over misunderstandings', vi: 'tranh cãi về những hiểu lầm' },
          { en: 'resolve heated dispute', vi: 'hòa giải cuộc tranh cãi gay gắt' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'ignore',
        ipa: '/ɪɡˈnɔːr/',
        partOfSpeech: 'verb',
        meaningVi: 'phớt lờ',
        exampleEn: 'Do not ignore my calls.',
        exampleVi: 'Đừng phớt lờ cuộc gọi của tôi.',
        associatedActions: [
          { en: 'look away during argument', vi: 'quay mặt đi trong lúc tranh luận' },
          { en: 'leave text messages unread', vi: 'để tin nhắn ở chế độ chưa đọc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1525785967371-87ba44b3e6cf?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'calm',
        ipa: '/kɑːm/',
        partOfSpeech: 'adj',
        meaningVi: 'bình tĩnh',
        exampleEn: 'Please stay calm.',
        exampleVi: 'Làm ơn giữ bình tĩnh.',
        associatedActions: [
          { en: 'speak in gentle tone', vi: 'nói bằng giọng điệu nhẹ nhàng' },
          { en: 'wait for anger to subside', vi: 'chờ cơn giận lắng xuống' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'blame',
        ipa: '/bleɪm/',
        partOfSpeech: 'verb',
        meaningVi: 'đổ lỗi',
        exampleEn: 'Do not blame me for your mistake.',
        exampleVi: 'Đừng đổ lỗi cho tôi về sai lầm của bạn.',
        associatedActions: [
          { en: 'point finger at partner', vi: 'chỉ trỏ đổ lỗi cho đối phương' },
          { en: 'take personal responsibility', vi: 'nhận trách nhiệm về phần mình' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'communication',
        ipa: '/kəˌmjuːnɪˈkeɪʃn/',
        partOfSpeech: 'noun',
        meaningVi: 'sự giao tiếp',
        exampleEn: 'Good communication is key.',
        exampleVi: 'Giao tiếp tốt là chìa khóa.',
        associatedActions: [
          { en: 'listen attentively to feelings', vi: 'chăm chú lắng nghe tâm tư' },
          { en: 'share honest thoughts', vi: 'chia sẻ suy nghĩ thành thật' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I am sorry to hear that.', translationVi: 'Tôi rất tiếc khi nghe điều đó.' },
      { phrase: 'Have you told him/her how you feel?', translationVi: 'Bạn đã nói với anh ấy/cô ấy cảm giác của bạn chưa?' },
      { phrase: 'My advice is to...', translationVi: 'Lời khuyên của tôi là...' },
      { phrase: 'When you are both calm.', translationVi: 'Khi cả hai bạn đều bình tĩnh.' },
      { phrase: 'Instead of blaming him/her.', translationVi: 'Thay vì đổ lỗi cho anh ấy/cô ấy.' }
    ],
    aiTutorPrompt: 'You are having relationship issues because of a lack of communication with your partner. Complain to the user (your friend) and ask them what you should do.',
    tags: ['relationship', 'communication', 'conflict']
  },
  {
    id: 'soc-adv-05',
    category: 'social',
    subcategory: 'giving-advice',
    level: 'B2',
    titleEn: 'Career change advice',
    titleVi: 'Lời khuyên về việc thay đổi nghề nghiệp',
    icon: 'Briefcase',
    situationVi: 'Một đồng nghiệp muốn từ bỏ công việc ổn định hiện tại để theo đuổi đam mê nghệ thuật nhưng còn do dự. Bạn cùng họ phân tích rủi ro và cơ hội.',
    sampleDialogue: [
      { speaker: 'A', text: 'I am seriously considering quitting my job here to become a full-time illustrator.', translationVi: 'Tôi đang nghiêm túc cân nhắc việc nghỉ làm ở đây để trở thành họa sĩ minh họa toàn thời gian.' },
      { speaker: 'B', text: 'Wow, that is a massive decision. What is holding you back?', translationVi: 'Wow, đó là một quyết định lớn. Điều gì đang cản trở bạn?' },
      { speaker: 'A', text: 'The financial insecurity. I will not have a steady paycheck anymore.', translationVi: 'Sự bất ổn về tài chính. Tôi sẽ không còn một khoản lương ổn định nữa.' },
      { speaker: 'B', text: 'Have you thought about transitioning gradually? You could build your portfolio as a freelancer first.', translationVi: 'Bạn đã nghĩ đến việc chuyển đổi dần dần chưa? Bạn có thể xây dựng hồ sơ năng lực (portfolio) với tư cách là người làm tự do trước.' },
      { speaker: 'A', text: 'That is not a bad idea. But it means working evenings and weekends.', translationVi: 'Đó không phải là ý kiến tồi. Nhưng nó đồng nghĩa với việc phải làm việc vào buổi tối và cuối tuần.' },
      { speaker: 'B', text: 'True, but it minimizes the risk while letting you test the waters.', translationVi: 'Đúng, nhưng nó giảm thiểu rủi ro trong khi cho phép bạn thử sức xem sao.' }
    ],
    keyVocabulary: [
      {
        term: 'consider',
        ipa: '/kənˈsɪdər/',
        partOfSpeech: 'verb',
        meaningVi: 'cân nhắc',
        exampleEn: 'I am considering a career change.',
        exampleVi: 'Tôi đang cân nhắc thay đổi nghề nghiệp.',
        associatedActions: [
          { en: 'list pros and cons', vi: 'liệt kê các ưu và nhược điểm' },
          { en: 'think about long-term goals', vi: 'suy nghĩ về các mục tiêu dài hạn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'quit',
        ipa: '/kwɪt/',
        partOfSpeech: 'verb',
        meaningVi: 'từ bỏ, nghỉ việc',
        exampleEn: 'He quit his job yesterday.',
        exampleVi: 'Anh ấy đã nghỉ việc hôm qua.',
        associatedActions: [
          { en: 'submit resignation letter', vi: 'nộp đơn xin thôi việc' },
          { en: 'pack up personal desk', vi: 'thu dọn bàn làm việc cá nhân' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'insecurity',
        ipa: '/ˌɪnsɪˈkjʊrəti/',
        partOfSpeech: 'noun',
        meaningVi: 'sự bất an, không an toàn',
        exampleEn: 'Financial insecurity is stressful.',
        exampleVi: 'Sự bất an về tài chính rất căng thẳng.',
        associatedActions: [
          { en: 'build emergency fund', vi: 'xây dựng quỹ khẩn cấp' },
          { en: 'overcome fear of failure', vi: 'vượt qua nỗi sợ thất bại' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'transition',
        ipa: '/trænˈzɪʃn/',
        partOfSpeech: 'verb',
        meaningVi: 'chuyển đổi',
        exampleEn: 'She transitioned to a new role.',
        exampleVi: 'Cô ấy đã chuyển sang một vai trò mới.',
        associatedActions: [
          { en: 'shift gradually into freelancing', vi: 'chuyển đổi dần sang làm việc tự do' },
          { en: 'acquire new creative skills', vi: 'tiếp thu các kỹ năng sáng tạo mới' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'minimize',
        ipa: '/ˈmɪnɪmaɪz/',
        partOfSpeech: 'verb',
        meaningVi: 'giảm thiểu',
        exampleEn: 'We need to minimize the risks.',
        exampleVi: 'Chúng ta cần giảm thiểu rủi ro.',
        associatedActions: [
          { en: 'reduce living expenses', vi: 'cắt giảm chi phí sinh hoạt' },
          { en: 'prepare backup plan', vi: 'chuẩn bị phương án dự phòng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'That is a massive decision.', translationVi: 'Đó là một quyết định lớn.' },
      { phrase: 'What is holding you back?', translationVi: 'Điều gì đang cản bước bạn?' },
      { phrase: 'Have you thought about...?', translationVi: 'Bạn đã nghĩ đến việc... chưa?' },
      { phrase: 'It is not a bad idea.', translationVi: 'Đó không phải là ý kiến tồi.' },
      { phrase: 'Test the waters.', translationVi: 'Thử sức/thăm dò xem sao.' }
    ],
    aiTutorPrompt: 'You are a colleague thinking of leaving your stable job for a risky, creative passion. Discuss your fears with the user and ask for their perspective.',
    tags: ['career', 'work', 'decisions']
  },
  {
    id: 'soc-adv-06',
    category: 'social',
    subcategory: 'giving-advice',
    level: 'A2',
    titleEn: 'Study tips and exam preparation',
    titleVi: 'Mẹo học tập và chuẩn bị cho kỳ thi',
    icon: 'BookOpen',
    situationVi: 'Bạn cùng lớp đang rất lo lắng về bài kiểm tra sắp tới vì chưa học được gì. Bạn chia sẻ phương pháp ôn tập của mình để giúp họ.',
    sampleDialogue: [
      { speaker: 'A', text: 'I am so nervous about the history exam next week. I do not remember anything.', translationVi: 'Mình lo lắng quá về bài kiểm tra lịch sử tuần tới. Mình không nhớ gì cả.' },
      { speaker: 'B', text: 'Do not panic. You should make a study schedule starting today.', translationVi: 'Đừng hoảng. Bạn nên lập một lịch học bắt đầu từ hôm nay.' },
      { speaker: 'A', text: 'How do you study for it? There are so many dates to memorize.', translationVi: 'Bạn học nó như thế nào? Có quá nhiều ngày tháng phải nhớ.' },
      { speaker: 'B', text: 'I highly recommend using flashcards. Write the date on one side and the event on the other.', translationVi: 'Mình rất khuyến khích dùng thẻ ghi nhớ (flashcards). Viết ngày ở một mặt và sự kiện ở mặt kia.' },
      { speaker: 'A', text: 'That sounds useful. Do you study alone?', translationVi: 'Nghe có vẻ hữu ích. Bạn học một mình à?' },
      { speaker: 'B', text: 'Usually. But we could study together this weekend if you want.', translationVi: 'Thường thì vậy. Nhưng chúng ta có thể học nhóm cuối tuần này nếu bạn muốn.' }
    ],
    keyVocabulary: [
      {
        term: 'nervous',
        ipa: '/ˈnɜːrvəs/',
        partOfSpeech: 'adj',
        meaningVi: 'lo lắng, hồi hộp',
        exampleEn: 'I always get nervous before exams.',
        exampleVi: 'Tôi luôn thấy lo lắng trước kỳ thi.',
        associatedActions: [
          { en: 'tap fingers anxiously', vi: 'gõ ngón tay đầy bồn chồn' },
          { en: 'take deep breath before test', vi: 'hít thở sâu trước bài thi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'panic',
        ipa: '/ˈpænɪk/',
        partOfSpeech: 'verb',
        meaningVi: 'hoảng sợ',
        exampleEn: 'Do not panic, everything is fine.',
        exampleVi: 'Đừng hoảng, mọi thứ đều ổn.',
        associatedActions: [
          { en: 'stop and drink water', vi: 'dừng lại và uống một ngụm nước' },
          { en: 'reassure oneself calmly', vi: 'tự trấn an bản thân một cách bình tĩnh' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'schedule',
        ipa: '/ˈskedʒuːl/',
        partOfSpeech: 'noun',
        meaningVi: 'lịch trình',
        exampleEn: 'I have a busy schedule today.',
        exampleVi: 'Hôm nay tôi có một lịch trình bận rộn.',
        associatedActions: [
          { en: 'write study blocks in planner', vi: 'ghi các khung giờ học vào sổ tay' },
          { en: 'set phone calendar reminders', vi: 'đặt nhắc nhở lịch trên điện thoại' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'memorize',
        ipa: '/ˈmeməraɪz/',
        partOfSpeech: 'verb',
        meaningVi: 'ghi nhớ',
        exampleEn: 'Try to memorize these words.',
        exampleVi: 'Hãy cố gắng ghi nhớ những từ này.',
        associatedActions: [
          { en: 'flip through flashcards', vi: 'lật xem các thẻ ghi nhớ' },
          { en: 'recite facts aloud', vi: 'đọc to các dữ kiện để nhớ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'recommend',
        ipa: '/ˌrekəˈmend/',
        partOfSpeech: 'verb',
        meaningVi: 'gợi ý, khuyến khích',
        exampleEn: 'I recommend this book.',
        exampleVi: 'Tôi gợi ý cuốn sách này.',
        associatedActions: [
          { en: 'share effective study method', vi: 'chia sẻ phương pháp học hiệu quả' },
          { en: 'suggest helpful textbook', vi: 'gợi ý cuốn sách giáo khoa hữu ích' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I am so nervous about...', translationVi: 'Tôi rất lo lắng về...' },
      { phrase: 'Do not panic.', translationVi: 'Đừng hoảng sợ.' },
      { phrase: 'You should make a schedule.', translationVi: 'Bạn nên lập lịch trình.' },
      { phrase: 'I highly recommend...', translationVi: 'Tôi rất khuyến khích (bạn làm gì)...' },
      { phrase: 'We could study together.', translationVi: 'Chúng ta có thể học cùng nhau.' }
    ],
    aiTutorPrompt: 'You are a student who is completely unprepared for an upcoming exam. Express your anxiety to the user and ask them how they manage to study so effectively.',
    tags: ['study', 'school', 'exams']
  }
];
