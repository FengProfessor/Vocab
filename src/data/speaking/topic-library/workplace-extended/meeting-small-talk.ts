/**
 * LingoPro Speaking Topic Library
 * Category: workplace_extended
 * Subcategory: meeting_small_talk
 * File: src/data/speaking/topic-library/workplace-extended/meeting-small-talk.ts
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const MEETING_SMALL_TALK_ITEMS: TopicLibraryItem[] = [
  {
    id: 'work-meet-01',
    category: 'workplace_extended',
    subcategory: 'meeting_small_talk',
    level: 'A2',
    titleEn: 'Pre-meeting chit-chat',
    titleVi: 'Trò chuyện trước cuộc họp',
    icon: 'coffee',
    situationVi: 'Bạn đến phòng họp sớm và gặp một đồng nghiệp. Bạn bắt chuyện về những chủ đề nhẹ nhàng trong khi chờ những người khác đến.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Hi there! Are we the first ones here?', textVi: 'Chào bạn! Chúng ta là những người đến đầu tiên à?' },
      { speaker: 'B', textEn: 'Looks like it. How was your weekend?', textVi: 'Có vẻ là vậy. Cuối tuần của bạn thế nào?' },
      { speaker: 'A', textEn: 'It was pretty relaxing, just stayed home. And yours?', textVi: 'Khá thư giãn, tôi chỉ ở nhà. Còn bạn?' },
      { speaker: 'B', textEn: 'I went hiking with some friends. The weather was perfect.', textVi: 'Tôi đi leo núi với vài người bạn. Thời tiết rất tuyệt.' },
      { speaker: 'A', textEn: 'That sounds lovely. Oh, here comes Sarah.', textVi: 'Nghe thích thật. Ồ, Sarah đến kìa.' },
      { speaker: 'B', textEn: 'Great, I think we can start soon.', textVi: 'Tuyệt, tôi nghĩ chúng ta có thể bắt đầu sớm thôi.' }
    ],
    keyVocabulary: [
      {
        term: 'chit-chat',
        ipa: '/ˈtʃɪt.tʃæt/',
        partOfSpeech: 'noun',
        meaningVi: 'cuộc trò chuyện phiếm',
        exampleEn: 'We had a little chit-chat before the meeting.',
        exampleVi: 'Chúng tôi đã trò chuyện phiếm một chút trước cuộc họp.',
        associatedActions: [
          { en: 'engage in casual chit-chat', vi: 'tham gia trò chuyện phiếm thân mật' },
          { en: 'exchange light chit-chat before meetings', vi: 'trao đổi vài câu chuyện phiếm trước cuộc họp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'relaxing',
        ipa: '/rɪˈlæk.sɪŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'thư giãn',
        exampleEn: 'I had a relaxing weekend.',
        exampleVi: 'Tôi đã có một cuối tuần thư giãn.',
        associatedActions: [
          { en: 'spend relaxing evenings at home', vi: 'dành những buổi tối thư giãn tại nhà' },
          { en: 'listen to relaxing background music', vi: 'nghe nhạc nền thư thái' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'hiking',
        ipa: '/ˈhaɪ.kɪŋ/',
        partOfSpeech: 'noun',
        meaningVi: 'sự đi bộ đường dài',
        exampleEn: 'We went hiking in the mountains.',
        exampleVi: 'Chúng tôi đi leo núi.',
        associatedActions: [
          { en: 'go hiking along mountain trails', vi: 'đi bộ leo núi dọc các đường mòn' },
          { en: 'pack gear for weekend hiking', vi: 'chuẩn bị đồ đạc cho chuyến leo núi cuối tuần' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'weather',
        ipa: '/ˈweð.ər/',
        partOfSpeech: 'noun',
        meaningVi: 'thời tiết',
        exampleEn: 'The weather is nice today.',
        exampleVi: 'Thời tiết hôm nay rất đẹp.',
        associatedActions: [
          { en: 'discuss sunny outdoor weather', vi: 'bàn luận về thời tiết ngoài trời nhiều nắng' },
          { en: 'check local weather reports', vi: 'kiểm tra bản tin thời tiết địa phương' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'perfect',
        ipa: '/ˈpɜː.fekt/',
        partOfSpeech: 'adj',
        meaningVi: 'hoàn hảo',
        exampleEn: 'The timing is perfect.',
        exampleVi: 'Thời điểm rất hoàn hảo.',
        associatedActions: [
          { en: 'achieve perfect team alignment', vi: 'đạt được sự đồng thuận hoàn hảo trong nhóm' },
          { en: 'find a perfect time to meet', vi: 'tìm thời điểm hoàn hảo để họp mặt' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'How was your weekend?', phraseVi: 'Cuối tuần của bạn thế nào?' },
      { phraseEn: 'Did you do anything fun?', phraseVi: 'Bạn có làm gì vui không?' },
      { phraseEn: 'Are we waiting for anyone else?', phraseVi: 'Chúng ta có đang đợi ai khác không?' },
      { phraseEn: 'The traffic was terrible this morning.', phraseVi: 'Giao thông sáng nay thật kinh khủng.' },
      { phraseEn: 'Did you catch the game last night?', phraseVi: 'Bạn có xem trận đấu tối qua không?' }
    ],
    aiTutorPrompt: 'Roleplay as a friendly colleague. The user is waiting for a meeting to start. Engage in light small talk about the weekend, weather, or commute.',
    tags: ['meeting', 'small talk', 'office']
  },
  {
    id: 'work-meet-02',
    category: 'workplace_extended',
    subcategory: 'meeting_small_talk',
    level: 'A2',
    titleEn: 'Introducing a colleague to the team',
    titleVi: 'Giới thiệu đồng nghiệp với nhóm',
    icon: 'users',
    situationVi: 'Bạn giới thiệu một nhân viên mới với các thành viên khác trong nhóm trước khi cuộc họp bắt đầu. Mọi người chào hỏi làm quen.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Everyone, I\'d like you to meet our new developer, Tom.', textVi: 'Mọi người ơi, tôi muốn giới thiệu Tom, lập trình viên mới của chúng ta.' },
      { speaker: 'B', textEn: 'Hi everyone, it\'s great to meet you all.', textVi: 'Chào mọi người, rất vui được gặp tất cả các bạn.' },
      { speaker: 'A', textEn: 'Tom just joined us from the New York office.', textVi: 'Tom vừa chuyển đến từ văn phòng New York.' },
      { speaker: 'B', textEn: 'Yes, I moved here last week.', textVi: 'Vâng, tôi chuyển đến đây tuần trước.' },
      { speaker: 'A', textEn: 'Welcome to the team, Tom! Let us know if you need anything.', textVi: 'Chào mừng đến với đội, Tom! Hãy cho chúng tôi biết nếu bạn cần gì nhé.' }
    ],
    keyVocabulary: [
      {
        term: 'introduce',
        ipa: '/ˌɪn.trəˈdʒuːs/',
        partOfSpeech: 'verb',
        meaningVi: 'giới thiệu',
        exampleEn: 'Let me introduce you to the team.',
        exampleVi: 'Để tôi giới thiệu bạn với nhóm.',
        associatedActions: [
          { en: 'introduce new teammates to everyone', vi: 'giới thiệu các đồng đội mới với mọi người' },
          { en: 'introduce oneself during orientation', vi: 'tự giới thiệu bản thân trong buổi định hướng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'colleague',
        ipa: '/ˈkɒl.iːɡ/',
        partOfSpeech: 'noun',
        meaningVi: 'đồng nghiệp',
        exampleEn: 'He is a former colleague of mine.',
        exampleVi: 'Anh ấy là đồng nghiệp cũ của tôi.',
        associatedActions: [
          { en: 'collaborate with trusted colleagues', vi: 'hợp tác với các đồng nghiệp đáng tin cậy' },
          { en: 'welcome a newly hired colleague', vi: 'chào đón một đồng nghiệp mới được tuyển dụng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'join',
        ipa: '/dʒɔɪn/',
        partOfSpeech: 'verb',
        meaningVi: 'gia nhập',
        exampleEn: 'She joined the company last month.',
        exampleVi: 'Cô ấy đã gia nhập công ty tháng trước.',
        associatedActions: [
          { en: 'join the development team', vi: 'gia nhập đội ngũ phát triển' },
          { en: 'join scheduled conference calls', vi: 'tham gia các cuộc gọi hội nghị định kỳ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'office',
        ipa: '/ˈɒf.ɪs/',
        partOfSpeech: 'noun',
        meaningVi: 'văn phòng',
        exampleEn: 'Our office is on the fifth floor.',
        exampleVi: 'Văn phòng của chúng tôi ở tầng năm.',
        associatedActions: [
          { en: 'tour the company headquarters office', vi: 'tham quan văn phòng trụ sở công ty' },
          { en: 'reserve an office meeting room', vi: 'đặt phòng họp văn phòng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'welcome',
        ipa: '/ˈwel.kəm/',
        partOfSpeech: 'verb',
        meaningVi: 'chào mừng',
        exampleEn: 'We are happy to welcome you.',
        exampleVi: 'Chúng tôi rất vui được chào đón bạn.',
        associatedActions: [
          { en: 'welcome newcomers warmly', vi: 'nhiệt liệt chào đón những người mới đến' },
          { en: 'extend a cordial welcome', vi: 'gửi lời chào đón thân ái' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'I\'d like to introduce...', phraseVi: 'Tôi muốn giới thiệu...' },
      { phraseEn: 'It\'s great to meet you all.', phraseVi: 'Rất vui được gặp tất cả các bạn.' },
      { phraseEn: 'Welcome to the team.', phraseVi: 'Chào mừng đến với nhóm.' },
      { phraseEn: 'Where are you transferring from?', phraseVi: 'Bạn chuyển đến từ đâu?' },
      { phraseEn: 'Let me know if you need any help settling in.', phraseVi: 'Hãy cho tôi biết nếu bạn cần giúp đỡ để ổn định.' }
    ],
    aiTutorPrompt: 'Roleplay as a team member meeting a new colleague. The user will introduce the new colleague (or roleplay as the new colleague). Be welcoming and friendly.',
    tags: ['introduction', 'team', 'new hire']
  },
  {
    id: 'work-meet-03',
    category: 'workplace_extended',
    subcategory: 'meeting_small_talk',
    level: 'A2',
    titleEn: 'Coffee break conversation',
    titleVi: 'Trò chuyện giờ nghỉ giải lao',
    icon: 'coffee',
    situationVi: 'Cuộc họp có một khoảng nghỉ ngắn. Bạn và đồng nghiệp trò chuyện ở khu vực lấy cà phê về đồ uống và công việc hiện tại.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'I definitely need some coffee after that long presentation.', textVi: 'Tôi chắc chắn cần chút cà phê sau bài thuyết trình dài đó.' },
      { speaker: 'B', textEn: 'Me too. The information was good, but it was a lot to take in.', textVi: 'Tôi cũng vậy. Thông tin rất hay, nhưng có quá nhiều thứ phải tiếp thu.' },
      { speaker: 'A', textEn: 'Exactly. Do you prefer black coffee or with milk?', textVi: 'Chính xác. Bạn thích cà phê đen hay thêm sữa?' },
      { speaker: 'B', textEn: 'Just a splash of milk for me, thanks.', textVi: 'Cho tôi một chút sữa, cảm ơn.' },
      { speaker: 'A', textEn: 'Here you go. The second half should be shorter.', textVi: 'Của bạn đây. Nửa sau có lẽ sẽ ngắn hơn.' }
    ],
    keyVocabulary: [
      {
        term: 'break',
        ipa: '/breɪk/',
        partOfSpeech: 'noun',
        meaningVi: 'giờ nghỉ',
        exampleEn: 'Let\'s take a 10-minute break.',
        exampleVi: 'Chúng ta hãy nghỉ 10 phút nhé.',
        associatedActions: [
          { en: 'take a quick coffee break', vi: 'nghỉ giải lao nhanh uống cà phê' },
          { en: 'return promptly after the break', vi: 'quay lại đúng giờ sau giờ nghỉ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'presentation',
        ipa: '/ˌprez.ənˈteɪ.ʃən/',
        partOfSpeech: 'noun',
        meaningVi: 'bài thuyết trình',
        exampleEn: 'Her presentation was very informative.',
        exampleVi: 'Bài thuyết trình của cô ấy rất nhiều thông tin.',
        associatedActions: [
          { en: 'deliver an engaging presentation', vi: 'trình bày một bài thuyết trình lôi cuốn' },
          { en: 'prepare slide decks for the presentation', vi: 'chuẩn bị các slide cho bài thuyết trình' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'information',
        ipa: '/ˌɪn.fəˈmeɪ.ʃən/',
        partOfSpeech: 'noun',
        meaningVi: 'thông tin',
        exampleEn: 'I need more information about this project.',
        exampleVi: 'Tôi cần thêm thông tin về dự án này.',
        associatedActions: [
          { en: 'digest complex project information', vi: 'tiếp thu thông tin dự án phức tạp' },
          { en: 'exchange critical business information', vi: 'trao đổi các thông tin kinh doanh thiết yếu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'prefer',
        ipa: '/prɪˈfɜːr/',
        partOfSpeech: 'verb',
        meaningVi: 'thích hơn',
        exampleEn: 'I prefer tea to coffee.',
        exampleVi: 'Tôi thích trà hơn cà phê.',
        associatedActions: [
          { en: 'prefer dark roasted coffee', vi: 'thích cà phê rang đậm hơn' },
          { en: 'prefer concise morning updates', vi: 'thích các bản cập nhật sáng ngắn gọn hơn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'splash',
        ipa: '/splæʃ/',
        partOfSpeech: 'noun',
        meaningVi: 'một chút (chất lỏng)',
        exampleEn: 'Just a splash of milk, please.',
        exampleVi: 'Làm ơn cho một chút sữa thôi.',
        associatedActions: [
          { en: 'add a small splash of milk', vi: 'thêm một chút sữa tươi' },
          { en: 'pour a splash of syrup into drinks', vi: 'rót một chút siro vào đồ uống' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Let\'s take a short break.', phraseVi: 'Chúng ta hãy nghỉ ngơi một chút.' },
      { phraseEn: 'That was a lot of information.', phraseVi: 'Có rất nhiều thông tin.' },
      { phraseEn: 'Do you want me to get you a coffee?', phraseVi: 'Bạn có muốn tôi lấy cho bạn một ly cà phê không?' },
      { phraseEn: 'I\'ll be right back.', phraseVi: 'Tôi sẽ quay lại ngay.' },
      { phraseEn: 'What did you think of the presentation?', phraseVi: 'Bạn nghĩ gì về bài thuyết trình?' }
    ],
    aiTutorPrompt: 'Roleplay as a colleague during a coffee break in a long meeting. Talk about the meeting content and coffee preferences with the user.',
    tags: ['coffee break', 'meeting', 'office']
  },
  {
    id: 'work-meet-04',
    category: 'workplace_extended',
    subcategory: 'meeting_small_talk',
    level: 'B1',
    titleEn: 'Post-meeting wrap-up chat',
    titleVi: 'Trò chuyện sau khi họp',
    icon: 'message-square',
    situationVi: 'Cuộc họp vừa kết thúc. Bạn nán lại vài phút để tóm tắt nhanh và làm rõ một số điểm với đồng nghiệp trước khi về chỗ.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Well, that went better than expected.', textVi: 'Chà, mọi việc diễn ra tốt hơn mong đợi.' },
      { speaker: 'B', textEn: 'Yes, I\'m glad they approved the new budget.', textVi: 'Vâng, tôi rất vui vì họ đã phê duyệt ngân sách mới.' },
      { speaker: 'A', textEn: 'Are you clear on your action items for next week?', textVi: 'Bạn đã rõ các công việc cần làm cho tuần tới chưa?' },
      { speaker: 'B', textEn: 'Mostly. I just need to double-check the timeline with Sarah.', textVi: 'Gần như là rõ. Tôi chỉ cần kiểm tra lại tiến độ với Sarah.' },
      { speaker: 'A', textEn: 'Sounds good. Let\'s sync up again on Wednesday.', textVi: 'Nghe hợp lý. Chúng ta hãy cập nhật lại vào thứ Tư nhé.' }
    ],
    keyVocabulary: [
      {
        term: 'wrap-up',
        ipa: '/ˈræp.ʌp/',
        partOfSpeech: 'noun',
        meaningVi: 'phần tổng kết',
        exampleEn: 'Let\'s do a quick wrap-up.',
        exampleVi: 'Hãy tổng kết nhanh nhé.',
        associatedActions: [
          { en: 'conduct a comprehensive wrap-up', vi: 'tiến hành tổng kết toàn diện' },
          { en: 'conclude the session with a wrap-up', vi: 'kết thúc phiên làm việc bằng một phần tóm tắt' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'expected',
        ipa: '/ɪkˈspek.tɪd/',
        partOfSpeech: 'adj',
        meaningVi: 'được mong đợi',
        exampleEn: 'The results were better than expected.',
        exampleVi: 'Kết quả tốt hơn mong đợi.',
        associatedActions: [
          { en: 'exceed expected quarterly targets', vi: 'vượt qua các mục tiêu quý được kỳ vọng' },
          { en: 'align results with expected deliverables', vi: 'đối chiếu kết quả với các sản phẩm bàn giao dự kiến' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'approve',
        ipa: '/əˈpruːv/',
        partOfSpeech: 'verb',
        meaningVi: 'phê duyệt',
        exampleEn: 'The manager approved my leave request.',
        exampleVi: 'Quản lý đã phê duyệt đơn xin nghỉ phép của tôi.',
        associatedActions: [
          { en: 'approve proposed project budgets', vi: 'phê duyệt ngân sách dự án được đề xuất' },
          { en: 'review and formally approve plans', vi: 'xem xét và chính thức thông qua kế hoạch' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'action item',
        ipa: '/ˈæk.ʃən ˌaɪ.təm/',
        partOfSpeech: 'noun',
        meaningVi: 'công việc cần làm',
        exampleEn: 'I have three action items from the meeting.',
        exampleVi: 'Tôi có ba công việc cần làm từ cuộc họp.',
        associatedActions: [
          { en: 'assign priority action items', vi: 'giao các đầu việc ưu tiên cần thực hiện' },
          { en: 'track open action items across teams', vi: 'theo dõi các công việc còn tồn đọng giữa các nhóm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'sync up',
        ipa: '/sɪŋk ʌp/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'cập nhật thông tin',
        exampleEn: 'Let\'s sync up tomorrow.',
        exampleVi: 'Ngày mai chúng ta hãy cập nhật thông tin cho nhau nhé.',
        associatedActions: [
          { en: 'sync up on weekly deliverables', vi: 'đồng bộ tiến độ các đầu việc hàng tuần' },
          { en: 'regularly sync up with team leads', vi: 'thường xuyên đồng bộ thông tin với trưởng nhóm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'That went better than expected.', phraseVi: 'Mọi việc diễn ra tốt hơn mong đợi.' },
      { phraseEn: 'Are you clear on the next steps?', phraseVi: 'Bạn đã rõ các bước tiếp theo chưa?' },
      { phraseEn: 'I need to double-check a few details.', phraseVi: 'Tôi cần kiểm tra lại một vài chi tiết.' },
      { phraseEn: 'Let\'s touch base later this week.', phraseVi: 'Chúng ta hãy liên lạc lại vào cuối tuần này.' },
      { phraseEn: 'Good job on the presentation.', phraseVi: 'Làm tốt lắm với bài thuyết trình.' }
    ],
    aiTutorPrompt: 'Roleplay as a coworker right after a team meeting. Discuss the outcomes, next steps, and action items with the user.',
    tags: ['post-meeting', 'action items', 'discussion']
  },
  {
    id: 'work-meet-05',
    category: 'workplace_extended',
    subcategory: 'meeting_small_talk',
    level: 'B1',
    titleEn: 'Virtual meeting icebreakers',
    titleVi: 'Mở đầu cuộc họp trực tuyến',
    icon: 'monitor',
    situationVi: 'Bạn đang điều hành một cuộc họp trực tuyến. Trong khi chờ mọi người tham gia đủ, bạn đặt vài câu hỏi để làm nóng không khí.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'While we wait for the others, how is the weather where everyone is?', textVi: 'Trong khi đợi những người khác, thời tiết ở chỗ mọi người thế nào?' },
      { speaker: 'B', textEn: 'It\'s actually raining here in London today.', textVi: 'Trời đang mưa ở London hôm nay.' },
      { speaker: 'A', textEn: 'Oh, classic London! It\'s sunny here in California.', textVi: 'Ồ, kinh điển của London! Ở California thì đang nắng.' },
      { speaker: 'B', textEn: 'Lucky you! Did you do anything interesting over the weekend?', textVi: 'Bạn thật may mắn! Bạn có làm gì thú vị vào cuối tuần không?' },
      { speaker: 'A', textEn: 'I tried a new recipe for dinner. Okay, looks like everyone is here now.', textVi: 'Tôi đã thử một công thức nấu ăn mới cho bữa tối. Được rồi, có vẻ như mọi người đã có mặt đông đủ.' }
    ],
    keyVocabulary: [
      {
        term: 'virtual',
        ipa: '/ˈvɜː.tʃu.əl/',
        partOfSpeech: 'adj',
        meaningVi: 'ảo, trực tuyến',
        exampleEn: 'We have a virtual meeting at 10 AM.',
        exampleVi: 'Chúng tôi có một cuộc họp trực tuyến lúc 10 giờ sáng.',
        associatedActions: [
          { en: 'host virtual conference sessions', vi: 'chủ trì các phiên hội nghị trực tuyến' },
          { en: 'collaborate across virtual workspaces', vi: 'cộng tác trên các không gian làm việc ảo' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'icebreaker',
        ipa: '/ˈaɪsˌbreɪ.kər/',
        partOfSpeech: 'noun',
        meaningVi: 'hoạt động làm quen',
        exampleEn: 'We started with a quick icebreaker.',
        exampleVi: 'Chúng tôi bắt đầu với một hoạt động làm quen nhanh.',
        associatedActions: [
          { en: 'kick off with an interactive icebreaker', vi: 'bắt đầu bằng hoạt động phá băng tương tác' },
          { en: 'ask fun icebreaker questions', vi: 'đặt các câu hỏi khởi động vui vẻ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'classic',
        ipa: '/ˈklæs.ɪk/',
        partOfSpeech: 'adj',
        meaningVi: 'kinh điển, điển hình',
        exampleEn: 'That\'s a classic mistake.',
        exampleVi: 'Đó là một sai lầm điển hình.',
        associatedActions: [
          { en: 'reference a classic example', vi: 'dẫn chứng một ví dụ kinh điển' },
          { en: 'make classic humorous remarks', vi: 'đưa ra những nhận xét hài hước điển hình' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'lucky',
        ipa: '/ˈlʌk.i/',
        partOfSpeech: 'adj',
        meaningVi: 'may mắn',
        exampleEn: 'You are so lucky!',
        exampleVi: 'Bạn thật may mắn!',
        associatedActions: [
          { en: 'count oneself lucky to attend', vi: 'thấy bản thân may mắn khi được tham gia' },
          { en: 'share lucky coincidences with colleagues', vi: 'chia sẻ những sự trùng hợp may mắn với đồng nghiệp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'recipe',
        ipa: '/ˈres.ɪ.pi/',
        partOfSpeech: 'noun',
        meaningVi: 'công thức nấu ăn',
        exampleEn: 'I need a good recipe for chocolate cake.',
        exampleVi: 'Tôi cần một công thức ngon cho bánh sô cô la.',
        associatedActions: [
          { en: 'share a favorite cooking recipe', vi: 'chia sẻ công thức nấu ăn yêu thích' },
          { en: 'try out experimental recipes at home', vi: 'thử nghiệm các công thức món ăn mới tại nhà' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Let\'s give everyone a few more minutes to join.', phraseVi: 'Hãy cho mọi người thêm vài phút để tham gia.' },
      { phraseEn: 'Can everyone see my screen?', phraseVi: 'Mọi người có thấy màn hình của tôi không?' },
      { phraseEn: 'How are things over there?', phraseVi: 'Tình hình bên đó thế nào?' },
      { phraseEn: 'It looks like we have a full house.', phraseVi: 'Có vẻ như chúng ta đã đủ người.' },
      { phraseEn: 'Let\'s get started, shall we?', phraseVi: 'Chúng ta bắt đầu nhé?' }
    ],
    aiTutorPrompt: 'Roleplay as a participant in a virtual meeting before it officially starts. Chat with the host (user) about location, weather, or random light topics.',
    tags: ['virtual', 'remote', 'icebreaker']
  }
];
