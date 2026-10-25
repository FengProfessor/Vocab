/**
 * LingoPro Speaking Topic Library
 * Category: workplace_extended
 * Subcategory: remote_collaboration
 * File: src/data/speaking/topic-library/workplace-extended/remote-collaboration.ts
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const REMOTE_COLLABORATION_ITEMS: TopicLibraryItem[] = [
  {
    id: 'work-remote-01',
    category: 'workplace_extended',
    subcategory: 'remote_collaboration',
    level: 'A2',
    titleEn: 'Setting up a video call',
    titleVi: 'Thiết lập cuộc gọi video',
    icon: 'video',
    situationVi: 'Bạn đang nhắn tin cho đồng nghiệp để sắp xếp một cuộc gọi video nhanh trên Zoom hoặc Teams để giải quyết công việc thay vì gửi email.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Are you free for a quick video call to discuss the flyer?', textVi: 'Bạn có rảnh để gọi video nhanh thảo luận về tờ rơi không?' },
      { speaker: 'B', textEn: 'Yes, I am free now. Should we use Zoom or Teams?', textVi: 'Có, tôi đang rảnh. Chúng ta nên dùng Zoom hay Teams?' },
      { speaker: 'A', textEn: 'Let\'s use Teams. I\'ll send you an invite link right now.', textVi: 'Dùng Teams đi. Tôi sẽ gửi cho bạn liên kết mời ngay bây giờ.' },
      { speaker: 'B', textEn: 'Okay, waiting for it. Give me a minute to grab my headset.', textVi: 'Ok, đang đợi đây. Cho tôi một phút để lấy tai nghe.' },
      { speaker: 'A', textEn: 'No problem. See you in a minute.', textVi: 'Không vấn đề gì. Hẹn gặp bạn sau một phút nữa.' }
    ],
    keyVocabulary: [
      {
        term: 'flyer',
        ipa: '/ˈflaɪ.ər/',
        partOfSpeech: 'noun',
        meaningVi: 'tờ rơi quảng cáo',
        exampleEn: 'We designed a new flyer for the event.',
        exampleVi: 'Chúng tôi đã thiết kế một tờ rơi mới cho sự kiện.',
        associatedActions: [
          { en: 'design digital flyers', vi: 'thiết kế tờ rơi kỹ thuật số' },
          { en: 'distribute event promo', vi: 'phân phối tài liệu quảng bá sự kiện' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'invite',
        ipa: '/ˈɪn.vaɪt/',
        partOfSpeech: 'noun',
        meaningVi: 'lời mời (thường dùng trong văn nói)',
        exampleEn: 'Did you get the calendar invite?',
        exampleVi: 'Bạn đã nhận được lời mời trên lịch chưa?',
        associatedActions: [
          { en: 'send meeting invites', vi: 'gửi lời mời họp trực tuyến' },
          { en: 'accept calendar requests', vi: 'chấp nhận yêu cầu trên lịch' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'link',
        ipa: '/lɪŋk/',
        partOfSpeech: 'noun',
        meaningVi: 'đường dẫn liên kết',
        exampleEn: 'Click the link to join the meeting.',
        exampleVi: 'Nhấn vào liên kết để tham gia cuộc họp.',
        associatedActions: [
          { en: 'click join links', vi: 'bấm vào liên kết tham gia' },
          { en: 'copy video conference urls', vi: 'sao chép đường dẫn cuộc họp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'grab',
        ipa: '/ɡræb/',
        partOfSpeech: 'verb',
        meaningVi: 'lấy nhanh',
        exampleEn: 'Let me grab a coffee first.',
        exampleVi: 'Để tôi lấy cốc cà phê đã.',
        associatedActions: [
          { en: 'pick up essentials', vi: 'nhanh tay lấy vật dụng cần thiết' },
          { en: 'fetch quick coffee', vi: 'lấy vội tách cà phê' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'headset',
        ipa: '/ˈhed.set/',
        partOfSpeech: 'noun',
        meaningVi: 'tai nghe (có mic)',
        exampleEn: 'My headset is broken.',
        exampleVi: 'Tai nghe của tôi bị hỏng rồi.',
        associatedActions: [
          { en: 'plug in headphones', vi: 'cắm tai nghe vào máy' },
          { en: 'adjust microphone levels', vi: 'điều chỉnh mức âm lượng mic' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Are you free for a quick call?', phraseVi: 'Bạn có rảnh để gọi nhanh một cuộc không?' },
      { phraseEn: 'Should we use Zoom or Teams?', phraseVi: 'Chúng ta nên dùng Zoom hay Teams?' },
      { phraseEn: 'I\'ll send you an invite link.', phraseVi: 'Tôi sẽ gửi cho bạn liên kết mời.' },
      { phraseEn: 'Give me a minute to grab my headset.', phraseVi: 'Cho tôi một phút để lấy tai nghe.' },
      { phraseEn: 'Can you hear me clearly?', phraseVi: 'Bạn có nghe tôi rõ không?' }
    ],
    aiTutorPrompt: 'Roleplay as a colleague. The user wants to set up a quick video call to discuss a task. Agree and coordinate the platform and timing.',
    tags: ['video call', 'remote', 'setup']
  },
  {
    id: 'work-remote-02',
    category: 'workplace_extended',
    subcategory: 'remote_collaboration',
    level: 'B1',
    titleEn: 'Screen sharing and presenting',
    titleVi: 'Chia sẻ màn hình và thuyết trình',
    icon: 'monitor',
    situationVi: 'Bạn đang ở trong một cuộc gọi nhóm. Bạn cần chia sẻ màn hình của mình để trình bày một bản kế hoạch thiết kế mới.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Let me share my screen so you can see the new layout.', textVi: 'Để tôi chia sẻ màn hình để các bạn có thể xem bố cục mới.' },
      { speaker: 'B', textEn: 'Okay, go ahead. Let us know when it\'s up.', textVi: 'Được rồi, cứ tự nhiên. Cho chúng tôi biết khi nào nó hiện lên nhé.' },
      { speaker: 'A', textEn: 'Is it visible to everyone now?', textVi: 'Mọi người đã nhìn thấy chưa?' },
      { speaker: 'B', textEn: 'Yes, we can see your browser. Can you zoom in a bit?', textVi: 'Rồi, chúng tôi có thể thấy trình duyệt của bạn. Bạn có thể phóng to lên một chút không?' },
      { speaker: 'A', textEn: 'Sure, how\'s this? As you can see, the logo is now centered.', textVi: 'Chắc chắn rồi, thế này được chưa? Như các bạn thấy, logo bây giờ được đặt ở giữa.' }
    ],
    keyVocabulary: [
      {
        term: 'share',
        ipa: '/ʃeər/',
        partOfSpeech: 'verb',
        meaningVi: 'chia sẻ',
        exampleEn: 'Please share your screen.',
        exampleVi: 'Vui lòng chia sẻ màn hình của bạn.',
        associatedActions: [
          { en: 'broadcast presentation slides', vi: 'phát chiếu các slide thuyết trình' },
          { en: 'display project screens', vi: 'hiển thị màn hình dự án' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'layout',
        ipa: '/ˈleɪ.aʊt/',
        partOfSpeech: 'noun',
        meaningVi: 'bố cục',
        exampleEn: 'The page layout is very clean.',
        exampleVi: 'Bố cục trang rất gọn gàng.',
        associatedActions: [
          { en: 'arrange page elements', vi: 'bố trí các thành phần trang' },
          { en: 'optimize visual space', vi: 'tối ưu hóa không gian thị giác' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'visible',
        ipa: '/ˈvɪz.ə.bəl/',
        partOfSpeech: 'adj',
        meaningVi: 'có thể nhìn thấy',
        exampleEn: 'Are the slides visible?',
        exampleVi: 'Các slide có nhìn thấy được không?',
        associatedActions: [
          { en: 'confirm screen clarity', vi: 'xác nhận độ rõ của màn hình' },
          { en: 'check video feeds', vi: 'kiểm tra tín hiệu hình ảnh' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'browser',
        ipa: '/ˈbraʊ.zər/',
        partOfSpeech: 'noun',
        meaningVi: 'trình duyệt web',
        exampleEn: 'Open your web browser.',
        exampleVi: 'Mở trình duyệt web của bạn lên.',
        associatedActions: [
          { en: 'open chrome tabs', vi: 'mở các thẻ trình duyệt Chrome' },
          { en: 'refresh active pages', vi: 'tải lại các trang đang mở' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'zoom in',
        ipa: '/zuːm ɪn/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'phóng to',
        exampleEn: 'Can you zoom in on the picture?',
        exampleVi: 'Bạn có thể phóng to bức ảnh không?',
        associatedActions: [
          { en: 'enlarge small text', vi: 'phóng to chữ nhỏ khó đọc' },
          { en: 'inspect graphic details', vi: 'soi kỹ các chi tiết đồ họa' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Let me share my screen.', phraseVi: 'Để tôi chia sẻ màn hình của mình.' },
      { phraseEn: 'Can everyone see my screen?', phraseVi: 'Mọi người có thể thấy màn hình của tôi không?' },
      { phraseEn: 'Is it visible to everyone now?', phraseVi: 'Bây giờ mọi người đã nhìn thấy chưa?' },
      { phraseEn: 'Can you zoom in a bit?', phraseVi: 'Bạn có thể phóng to một chút không?' },
      { phraseEn: 'As you can see here...', phraseVi: 'Như bạn có thể thấy ở đây...' }
    ],
    aiTutorPrompt: 'Roleplay as attendees in a meeting. The user is sharing their screen to present something. Ask them to zoom in or confirm visibility.',
    tags: ['screen sharing', 'presentation', 'virtual']
  },
  {
    id: 'work-remote-03',
    category: 'workplace_extended',
    subcategory: 'remote_collaboration',
    level: 'A2',
    titleEn: 'Reporting internet/tech issues',
    titleVi: 'Báo cáo sự cố internet/công nghệ',
    icon: 'wifi-off',
    situationVi: 'Bạn đang trong cuộc gọi nhưng mạng của bạn rất yếu. Bạn phải giải thích tình hình và đề xuất tắt camera hoặc gọi lại.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Sorry, my internet connection is very unstable today.', textVi: 'Xin lỗi, kết nối internet của tôi hôm nay rất không ổn định.' },
      { speaker: 'B', textEn: 'Yeah, your voice is breaking up a little bit.', textVi: 'Vâng, giọng của bạn bị ngắt quãng một chút.' },
      { speaker: 'A', textEn: 'I\'m going to turn off my video to see if that helps.', textVi: 'Tôi sẽ tắt video xem có đỡ hơn không.' },
      { speaker: 'B', textEn: 'Okay, let\'s try that. Can you hear me clearly?', textVi: 'Ok, thử xem sao. Bạn có nghe rõ tôi không?' },
      { speaker: 'A', textEn: 'Yes, much better. Let\'s continue.', textVi: 'Có, tốt hơn nhiều rồi. Hãy tiếp tục nào.' }
    ],
    keyVocabulary: [
      {
        term: 'unstable',
        ipa: '/ʌnˈsteɪ.bəl/',
        partOfSpeech: 'adj',
        meaningVi: 'không ổn định',
        exampleEn: 'My internet connection is unstable.',
        exampleVi: 'Kết nối mạng của tôi không ổn định.',
        associatedActions: [
          { en: 'experience lag spikes', vi: 'gặp phải tình trạng giật lag' },
          { en: 'troubleshoot bad signal', vi: 'khắc phục tín hiệu mạng yếu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'break up',
        ipa: '/breɪk ʌp/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'bị ngắt quãng (âm thanh)',
        exampleEn: 'You are breaking up, I can\'t hear you.',
        exampleVi: 'Giọng bạn bị ngắt quãng, tôi không nghe được.',
        associatedActions: [
          { en: 'repeat missed words', vi: 'lặp lại các từ bị mất tiếng' },
          { en: 'pause until audio clears', vi: 'tạm dừng chờ âm thanh ổn định' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'turn off',
        ipa: '/tɜːn ɒf/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'tắt đi',
        exampleEn: 'Please turn off your camera.',
        exampleVi: 'Vui lòng tắt camera của bạn.',
        associatedActions: [
          { en: 'disable webcams', vi: 'tắt camera truyền hình ảnh' },
          { en: 'save network bandwidth', vi: 'tiết kiệm băng thông đường truyền' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'clearly',
        ipa: '/ˈklɪə.li/',
        partOfSpeech: 'adv',
        meaningVi: 'một cách rõ ràng',
        exampleEn: 'Can you speak more clearly?',
        exampleVi: 'Bạn có thể nói rõ hơn không?',
        associatedActions: [
          { en: 'pronounce every syllable', vi: 'phát âm rõ từng âm tiết' },
          { en: 'convey concise ideas', vi: 'truyền đạt ý tưởng rành mạch' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'continue',
        ipa: '/kənˈtɪn.juː/',
        partOfSpeech: 'verb',
        meaningVi: 'tiếp tục',
        exampleEn: 'Let\'s continue our discussion.',
        exampleVi: 'Hãy tiếp tục cuộc thảo luận của chúng ta.',
        associatedActions: [
          { en: 'resume paused talks', vi: 'tiếp tục các trao đổi tạm dừng' },
          { en: 'proceed to next topics', vi: 'chuyển tiếp sang chủ đề tiếp theo' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'My internet connection is unstable.', phraseVi: 'Kết nối internet của tôi không ổn định.' },
      { phraseEn: 'Your voice is breaking up.', phraseVi: 'Giọng của bạn đang bị ngắt quãng.' },
      { phraseEn: 'You\'re on mute.', phraseVi: 'Bạn đang tắt mic.' },
      { phraseEn: 'I\'ll turn off my video.', phraseVi: 'Tôi sẽ tắt video của mình.' },
      { phraseEn: 'Is the audio better now?', phraseVi: 'Bây giờ âm thanh tốt hơn chưa?' }
    ],
    aiTutorPrompt: 'Roleplay as a colleague on a video call. Tell the user their audio is breaking up or their screen is frozen, and help troubleshoot.',
    tags: ['tech issue', 'remote', 'internet']
  },
  {
    id: 'work-remote-04',
    category: 'workplace_extended',
    subcategory: 'remote_collaboration',
    level: 'B1',
    titleEn: 'Coordinating across time zones',
    titleVi: 'Phối hợp qua các múi giờ khác nhau',
    icon: 'globe',
    situationVi: 'Bạn làm việc ở châu Á và cần sắp xếp lịch họp với một đồng nghiệp hoặc khách hàng sống tại Mỹ hoặc châu Âu.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'We need to schedule a kickoff meeting for the new project.', textVi: 'Chúng ta cần lên lịch họp khởi động cho dự án mới.' },
      { speaker: 'B', textEn: 'Sure. I am in New York, which is EST. What time works for you?', textVi: 'Chắc chắn rồi. Tôi ở New York, theo múi giờ EST. Mấy giờ thì tiện cho bạn?' },
      { speaker: 'A', textEn: 'I\'m in Tokyo, so we have a 13-hour time difference.', textVi: 'Tôi ở Tokyo, vì vậy chúng ta chênh lệch 13 tiếng.' },
      { speaker: 'B', textEn: 'Wow. How about 8 AM my time? That would be 9 PM for you.', textVi: 'Chà. Vậy 8 giờ sáng giờ của tôi thì sao? Lúc đó sẽ là 9 giờ tối của bạn.' },
      { speaker: 'A', textEn: '9 PM is a bit late. Could we do 7 AM your time? 8 PM is better for me.', textVi: '9 giờ tối thì hơi muộn. Chúng ta có thể làm lúc 7 giờ sáng giờ của bạn không? 8 giờ tối thì tốt hơn cho tôi.' },
      { speaker: 'B', textEn: 'Yes, 7 AM works. I\'ll send the calendar invite.', textVi: 'Vâng, 7 giờ sáng được. Tôi sẽ gửi thư mời trên lịch.' }
    ],
    keyVocabulary: [
      {
        term: 'schedule',
        ipa: '/ˈʃedʒ.uːl/',
        partOfSpeech: 'verb',
        meaningVi: 'lên lịch',
        exampleEn: 'Let\'s schedule a meeting for Friday.',
        exampleVi: 'Hãy lên lịch họp vào thứ Sáu.',
        associatedActions: [
          { en: 'book shared slots', vi: 'đặt trước khung giờ trống' },
          { en: 'coordinate calendar invites', vi: 'đồng bộ hóa thư mời trên lịch' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'kickoff',
        ipa: '/ˈkɪk.ɒf/',
        partOfSpeech: 'noun',
        meaningVi: 'sự khởi động (dự án)',
        exampleEn: 'The project kickoff is next week.',
        exampleVi: 'Buổi khởi động dự án là tuần tới.',
        associatedActions: [
          { en: 'launch project initiatives', vi: 'khởi động sáng kiến dự án' },
          { en: 'introduce global team', vi: 'giới thiệu đội ngũ toàn cầu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'time difference',
        ipa: '/taɪm ˈdɪf.ər.əns/',
        partOfSpeech: 'noun phrase',
        meaningVi: 'sự chênh lệch thời gian',
        exampleEn: 'There is a 5-hour time difference.',
        exampleVi: 'Có sự chênh lệch múi giờ 5 tiếng.',
        associatedActions: [
          { en: 'calculate world clocks', vi: 'tính toán đồng hồ các quốc gia' },
          { en: 'find overlapping hours', vi: 'tìm kiếm khung giờ trùng nhau' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'calendar',
        ipa: '/ˈkæl.ən.dər/',
        partOfSpeech: 'noun',
        meaningVi: 'lịch',
        exampleEn: 'Check your calendar for availability.',
        exampleVi: 'Kiểm tra lịch xem bạn có rảnh không.',
        associatedActions: [
          { en: 'check open availability', vi: 'kiểm tra thời gian còn trống' },
          { en: 'sync international events', vi: 'đồng bộ hóa sự kiện quốc tế' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'invite',
        ipa: '/ˈɪn.vaɪt/',
        partOfSpeech: 'noun',
        meaningVi: 'lời mời họp',
        exampleEn: 'I sent you an invite.',
        exampleVi: 'Tôi đã gửi cho bạn một lời mời.',
        associatedActions: [
          { en: 'email teleconference links', vi: 'gửi liên kết hội nghị từ xa' },
          { en: 'confirm remote attendance', vi: 'xác nhận việc tham gia từ xa' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'What time zone are you in?', phraseVi: 'Bạn ở múi giờ nào?' },
      { phraseEn: 'What time works for you?', phraseVi: 'Mấy giờ thì tiện cho bạn?' },
      { phraseEn: 'We have a significant time difference.', phraseVi: 'Chúng ta có sự chênh lệch múi giờ đáng kể.' },
      { phraseEn: 'That would be 9 PM my time.', phraseVi: 'Đó sẽ là 9 giờ tối theo giờ của tôi.' },
      { phraseEn: 'Let\'s find a time that overlaps.', phraseVi: 'Hãy tìm một khoảng thời gian trùng nhau.' }
    ],
    aiTutorPrompt: 'Roleplay as a client in London. The user is in Tokyo. Negotiate a meeting time that is reasonable for both time zones.',
    tags: ['time zones', 'scheduling', 'remote']
  },
  {
    id: 'work-remote-05',
    category: 'workplace_extended',
    subcategory: 'remote_collaboration',
    level: 'B2',
    titleEn: 'Building rapport remotely',
    titleVi: 'Xây dựng mối quan hệ từ xa',
    icon: 'heart',
    situationVi: 'Bạn đang có một buổi "cà phê trực tuyến" (virtual coffee) 15 phút với một đồng nghiệp từ xa để gắn kết tình cảm, không bàn về công việc.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Thanks for taking the time to do this virtual coffee chat!', textVi: 'Cảm ơn bạn đã dành thời gian cho buổi trò chuyện cà phê trực tuyến này!' },
      { speaker: 'B', textEn: 'Of course! It\'s nice to finally talk without an agenda.', textVi: 'Tất nhiên rồi! Thật vui khi cuối cùng cũng được nói chuyện mà không cần lịch trình công việc.' },
      { speaker: 'A', textEn: 'Exactly. It\'s hard to connect when we work remotely all the time.', textVi: 'Chính xác. Rất khó để kết nối khi chúng ta làm việc từ xa suốt.' },
      { speaker: 'B', textEn: 'I totally agree. So, what do you usually do on the weekends?', textVi: 'Tôi hoàn toàn đồng ý. Vậy, bạn thường làm gì vào cuối tuần?' },
      { speaker: 'A', textEn: 'I play a lot of tennis. I\'m actually joining a local tournament soon.', textVi: 'Tôi chơi quần vợt rất nhiều. Thật ra tôi sắp tham gia một giải đấu địa phương.' },
      { speaker: 'B', textEn: 'That\'s awesome! I\'d love to hear more about it.', textVi: 'Tuyệt quá! Tôi rất muốn nghe thêm về nó.' }
    ],
    keyVocabulary: [
      {
        term: 'virtual',
        ipa: '/ˈvɜː.tʃu.əl/',
        partOfSpeech: 'adj',
        meaningVi: 'ảo, trực tuyến',
        exampleEn: 'We had a virtual party.',
        exampleVi: 'Chúng tôi đã có một bữa tiệc trực tuyến.',
        associatedActions: [
          { en: 'attend online chats', vi: 'tham gia trò chuyện trực tuyến' },
          { en: 'interact through screens', vi: 'tương tác qua màn hình ảo' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'agenda',
        ipa: '/əˈdʒen.də/',
        partOfSpeech: 'noun',
        meaningVi: 'lịch trình, chương trình nghị sự',
        exampleEn: 'What is on the agenda today?',
        exampleVi: 'Có gì trong chương trình hôm nay?',
        associatedActions: [
          { en: 'set casual themes', vi: 'định ra các chủ đề tự do' },
          { en: 'skip formal outlines', vi: 'bỏ qua các đề cương trang trọng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'connect',
        ipa: '/kəˈnekt/',
        partOfSpeech: 'verb',
        meaningVi: 'kết nối, gắn kết',
        exampleEn: 'It\'s important to connect with colleagues.',
        exampleVi: 'Việc gắn kết với đồng nghiệp là rất quan trọng.',
        associatedActions: [
          { en: 'share personal hobbies', vi: 'chia sẻ sở thích cá nhân' },
          { en: 'foster friendly ties', vi: 'thắt chặt mối quan hệ thân thiện' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'remotely',
        ipa: '/rɪˈməʊt.li/',
        partOfSpeech: 'adv',
        meaningVi: 'từ xa',
        exampleEn: 'Our team works entirely remotely.',
        exampleVi: 'Đội của chúng tôi làm việc hoàn toàn từ xa.',
        associatedActions: [
          { en: 'collaborate from home', vi: 'cộng tác làm việc từ nhà' },
          { en: 'stay synced globally', vi: 'duy trì kết nối trên toàn cầu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'tournament',
        ipa: '/ˈtʊə.nə.mənt/',
        partOfSpeech: 'noun',
        meaningVi: 'giải đấu',
        exampleEn: 'He won the chess tournament.',
        exampleVi: 'Anh ấy đã vô địch giải cờ vua.',
        associatedActions: [
          { en: 'compete in matches', vi: 'tranh tài trong các trận đấu' },
          { en: 'cheer for teammates', vi: 'cổ vũ cho các đồng đội' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Thanks for doing this virtual coffee chat.', phraseVi: 'Cảm ơn vì đã tham gia buổi cà phê trực tuyến này.' },
      { phraseEn: 'It\'s nice to talk without an agenda.', phraseVi: 'Thật vui khi nói chuyện mà không có lịch trình công việc.' },
      { phraseEn: 'It\'s hard to connect working remotely.', phraseVi: 'Rất khó để kết nối khi làm việc từ xa.' },
      { phraseEn: 'What do you do outside of work?', phraseVi: 'Bạn làm gì ngoài giờ làm việc?' },
      { phraseEn: 'That\'s awesome! Tell me more.', phraseVi: 'Tuyệt quá! Kể thêm cho tôi đi.' }
    ],
    aiTutorPrompt: 'Roleplay as a remote colleague having a casual 15-minute virtual coffee chat with the user. Ask about their hobbies and share one of your own.',
    tags: ['virtual coffee', 'rapport', 'networking']
  }
];
