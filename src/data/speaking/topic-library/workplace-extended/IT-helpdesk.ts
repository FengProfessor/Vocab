/**
 * LingoPro Speaking Topic Library
 * Category: workplace_extended
 * Subcategory: it_helpdesk
 * File: src/data/speaking/topic-library/workplace-extended/IT-helpdesk.ts
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const IT_HELPDESK_ITEMS: TopicLibraryItem[] = [
  {
    id: 'work-it-01',
    category: 'workplace_extended',
    subcategory: 'it_helpdesk',
    level: 'A2',
    titleEn: 'Computer won\'t start',
    titleVi: 'Máy tính không khởi động',
    icon: 'power',
    situationVi: 'Sáng nay máy tính của bạn không lên nguồn. Bạn gọi điện cho bộ phận IT để nhờ hỗ trợ.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'IT Helpdesk, this is John. How can I help you?', textVi: 'Bộ phận Hỗ trợ IT, tôi là John. Tôi có thể giúp gì cho bạn?' },
      { speaker: 'B', textEn: 'Hi John, my computer won\'t start this morning.', textVi: 'Chào John, máy tính của tôi sáng nay không khởi động.' },
      { speaker: 'A', textEn: 'Okay. Are there any lights on the monitor or tower?', textVi: 'Ok. Có đèn nào sáng trên màn hình hoặc thùng máy không?' },
      { speaker: 'B', textEn: 'No, everything is completely dark.', textVi: 'Không, mọi thứ tối thui.' },
      { speaker: 'A', textEn: 'Can you check if the power cable is plugged in firmly?', textVi: 'Bạn có thể kiểm tra xem cáp nguồn đã được cắm chặt chưa?' },
      { speaker: 'B', textEn: 'Ah, it was loose. It\'s turning on now. Thank you!', textVi: 'À, nó bị lỏng. Bây giờ nó đang bật rồi. Cảm ơn bạn!' }
    ],
    keyVocabulary: [
      {
        term: 'helpdesk',
        ipa: '/ˈhelp.desk/',
        partOfSpeech: 'noun',
        meaningVi: 'bộ phận hỗ trợ',
        exampleEn: 'Call the IT helpdesk.',
        exampleVi: 'Hãy gọi cho bộ phận hỗ trợ IT.',
        associatedActions: [
          { en: 'call the IT helpdesk', vi: 'gọi cho bộ phận hỗ trợ IT' },
          { en: 'submit a helpdesk ticket', vi: 'gửi phiếu hỗ trợ kỹ thuật' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'start',
        ipa: '/stɑːt/',
        partOfSpeech: 'verb',
        meaningVi: 'khởi động',
        exampleEn: 'My car won\'t start.',
        exampleVi: 'Xe của tôi không khởi động được.',
        associatedActions: [
          { en: 'start the desktop computer', vi: 'khởi động máy tính để bàn' },
          { en: 'restart the frozen system', vi: 'khởi động lại hệ thống bị đơ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'monitor',
        ipa: '/ˈmɒn.ɪ.tər/',
        partOfSpeech: 'noun',
        meaningVi: 'màn hình',
        exampleEn: 'The monitor is blank.',
        exampleVi: 'Màn hình trống trơn.',
        associatedActions: [
          { en: 'turn on the monitor', vi: 'bật màn hình hiển thị' },
          { en: 'adjust monitor brightness', vi: 'điều chỉnh độ sáng màn hình' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'cable',
        ipa: '/ˈkeɪ.bəl/',
        partOfSpeech: 'noun',
        meaningVi: 'dây cáp',
        exampleEn: 'Check the network cable.',
        exampleVi: 'Kiểm tra cáp mạng.',
        associatedActions: [
          { en: 'connect the power cable', vi: 'kết nối dây cáp nguồn' },
          { en: 'check loose display cables', vi: 'kiểm tra dây cáp màn hình bị lỏng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'plug in',
        ipa: '/plʌɡ ɪn/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'cắm điện',
        exampleEn: 'Is the printer plugged in?',
        exampleVi: 'Máy in đã được cắm điện chưa?',
        associatedActions: [
          { en: 'plug in the power cord', vi: 'cắm dây nguồn vào ổ điện' },
          { en: 'plug in external devices', vi: 'cắm các thiết bị ngoại vi vào' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'My computer won\'t start.', phraseVi: 'Máy tính của tôi không khởi động.' },
      { phraseEn: 'Everything is completely dark.', phraseVi: 'Mọi thứ tối đen hoàn toàn.' },
      { phraseEn: 'Check if the power cable is plugged in.', phraseVi: 'Kiểm tra xem cáp nguồn đã được cắm chưa.' },
      { phraseEn: 'Are there any lights on?', phraseVi: 'Có đèn nào đang sáng không?' },
      { phraseEn: 'It\'s turning on now.', phraseVi: 'Bây giờ nó đang bật rồi.' }
    ],
    aiTutorPrompt: 'Roleplay as an IT support technician. Help the user troubleshoot why their computer won\'t start by asking basic hardware questions.',
    tags: ['IT', 'computer', 'troubleshooting']
  },
  {
    id: 'work-it-02',
    category: 'workplace_extended',
    subcategory: 'it_helpdesk',
    level: 'A2',
    titleEn: 'Forgot password/locked account',
    titleVi: 'Quên mật khẩu/tài khoản bị khóa',
    icon: 'lock',
    situationVi: 'Bạn nhập sai mật khẩu quá nhiều lần nên tài khoản email công ty của bạn bị khóa. Bạn nhờ IT mở lại.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Hi, I think I locked myself out of my email account.', textVi: 'Chào bạn, tôi nghĩ tôi đã khóa tài khoản email của mình rồi.' },
      { speaker: 'B', textEn: 'No problem. I can help with that. What is your employee ID?', textVi: 'Không vấn đề gì. Tôi có thể giúp việc đó. Mã số nhân viên của bạn là gì?' },
      { speaker: 'A', textEn: 'It\'s 45892.', textVi: 'Đó là 45892.' },
      { speaker: 'B', textEn: 'Thanks. I\'ve sent a temporary password to your phone.', textVi: 'Cảm ơn. Tôi đã gửi một mật khẩu tạm thời đến điện thoại của bạn.' },
      { speaker: 'A', textEn: 'I got it. Should I change it immediately?', textVi: 'Tôi nhận được rồi. Tôi có nên đổi nó ngay lập tức không?' },
      { speaker: 'B', textEn: 'Yes, the system will prompt you to create a new one.', textVi: 'Có, hệ thống sẽ nhắc bạn tạo một cái mới.' }
    ],
    keyVocabulary: [
      {
        term: 'lock out',
        ipa: '/lɒk aʊt/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'bị khóa (không vào được)',
        exampleEn: 'I locked myself out of my house.',
        exampleVi: 'Tôi đã tự khóa mình ngoài nhà.',
        associatedActions: [
          { en: 'get locked out of account', vi: 'bị khóa không vào được tài khoản' },
          { en: 'prevent being locked out', vi: 'ngăn ngừa việc bị khóa tài khoản' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'account',
        ipa: '/əˈkaʊnt/',
        partOfSpeech: 'noun',
        meaningVi: 'tài khoản',
        exampleEn: 'Your account is suspended.',
        exampleVi: 'Tài khoản của bạn đã bị đình chỉ.',
        associatedActions: [
          { en: 'unlock user account', vi: 'mở khóa tài khoản người dùng' },
          { en: 'manage corporate accounts', vi: 'quản lý các tài khoản doanh nghiệp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'employee ID',
        ipa: '/ɪmˈplɔɪ.iː ˌaɪˈdiː/',
        partOfSpeech: 'noun phrase',
        meaningVi: 'mã số nhân viên',
        exampleEn: 'Please enter your employee ID.',
        exampleVi: 'Vui lòng nhập mã số nhân viên của bạn.',
        associatedActions: [
          { en: 'verify employee ID', vi: 'xác minh mã nhân viên' },
          { en: 'present your employee ID', vi: 'xuất trình mã số nhân viên' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'temporary',
        ipa: '/ˈtem.pər.ər.i/',
        partOfSpeech: 'adj',
        meaningVi: 'tạm thời',
        exampleEn: 'This is a temporary solution.',
        exampleVi: 'Đây là một giải pháp tạm thời.',
        associatedActions: [
          { en: 'receive temporary password', vi: 'nhận mật khẩu tạm thời' },
          { en: 'issue temporary login codes', vi: 'cấp mã đăng nhập tạm thời' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'prompt',
        ipa: '/prɒmpt/',
        partOfSpeech: 'verb',
        meaningVi: 'nhắc nhở, yêu cầu',
        exampleEn: 'The app will prompt you to update.',
        exampleVi: 'Ứng dụng sẽ nhắc bạn cập nhật.',
        associatedActions: [
          { en: 'follow onscreen prompts', vi: 'làm theo các lời nhắc trên màn hình' },
          { en: 'respond to system prompts', vi: 'phản hồi lời nhắc từ hệ thống' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'I locked myself out of my account.', phraseVi: 'Tôi đã tự khóa tài khoản của mình.' },
      { phraseEn: 'I forgot my password.', phraseVi: 'Tôi quên mật khẩu.' },
      { phraseEn: 'What is your employee ID?', phraseVi: 'Mã số nhân viên của bạn là gì?' },
      { phraseEn: 'I\'ve sent a temporary password.', phraseVi: 'Tôi đã gửi một mật khẩu tạm thời.' },
      { phraseEn: 'The system will prompt you.', phraseVi: 'Hệ thống sẽ nhắc nhở bạn.' }
    ],
    aiTutorPrompt: 'Roleplay as IT support helping the user unlock their company email account. Ask for their employee ID to verify.',
    tags: ['password', 'account', 'IT support']
  },
  {
    id: 'work-it-03',
    category: 'workplace_extended',
    subcategory: 'it_helpdesk',
    level: 'A2',
    titleEn: 'Slow internet connection',
    titleVi: 'Kết nối mạng chậm',
    icon: 'wifi',
    situationVi: 'Mạng ở khu vực bàn làm việc của bạn rất chậm, khiến bạn không thể tải các tài liệu lớn. Bạn phàn nàn với bộ phận IT.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Hi, the Wi-Fi on the third floor is incredibly slow today.', textVi: 'Chào bạn, Wi-Fi ở tầng ba hôm nay cực kỳ chậm.' },
      { speaker: 'B', textEn: 'Are you connected to the guest network or the staff network?', textVi: 'Bạn đang kết nối với mạng khách hay mạng nhân viên?' },
      { speaker: 'A', textEn: 'I\'m on the staff network. I can\'t download any files.', textVi: 'Tôi đang dùng mạng nhân viên. Tôi không thể tải xuống bất kỳ tệp nào.' },
      { speaker: 'B', textEn: 'Let me check the router status. It looks like it needs a reset.', textVi: 'Để tôi kiểm tra tình trạng bộ định tuyến. Có vẻ nó cần được khởi động lại.' },
      { speaker: 'A', textEn: 'Will that take long?', textVi: 'Sẽ mất nhiều thời gian không?' },
      { speaker: 'B', textEn: 'Just a few minutes. Try again in about 5 minutes.', textVi: 'Chỉ vài phút thôi. Hãy thử lại trong khoảng 5 phút nữa.' }
    ],
    keyVocabulary: [
      {
        term: 'incredibly',
        ipa: '/ɪnˈkred.ə.bli/',
        partOfSpeech: 'adv',
        meaningVi: 'cực kỳ, đáng kinh ngạc',
        exampleEn: 'The internet is incredibly slow.',
        exampleVi: 'Mạng cực kỳ chậm.',
        associatedActions: [
          { en: 'run incredibly slow', vi: 'chạy chậm một cách đáng kinh ngạc' },
          { en: 'perform incredibly fast', vi: 'hoạt động cực kỳ nhanh chóng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'network',
        ipa: '/ˈnet.wɜːk/',
        partOfSpeech: 'noun',
        meaningVi: 'mạng lưới',
        exampleEn: 'Connect to the secure network.',
        exampleVi: 'Kết nối vào mạng an toàn.',
        associatedActions: [
          { en: 'switch to staff network', vi: 'chuyển sang mạng nội bộ nhân viên' },
          { en: 'troubleshoot network connectivity', vi: 'khắc phục sự cố kết nối mạng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'download',
        ipa: '/ˈdaʊn.ləʊd/',
        partOfSpeech: 'verb',
        meaningVi: 'tải xuống',
        exampleEn: 'I can\'t download the attachment.',
        exampleVi: 'Tôi không thể tải xuống tệp đính kèm.',
        associatedActions: [
          { en: 'download large attachments', vi: 'tải xuống các tệp đính kèm lớn' },
          { en: 'pause background downloads', vi: 'tạm dừng quá trình tải xuống ngầm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'router',
        ipa: '/ˈruː.tər/',
        partOfSpeech: 'noun',
        meaningVi: 'bộ định tuyến',
        exampleEn: 'Restart the Wi-Fi router.',
        exampleVi: 'Khởi động lại bộ định tuyến Wi-Fi.',
        associatedActions: [
          { en: 'reboot the office router', vi: 'khởi động lại bộ định tuyến văn phòng' },
          { en: 'check router signal lights', vi: 'kiểm tra đèn tín hiệu của router' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'reset',
        ipa: '/ˌriːˈset/',
        partOfSpeech: 'noun/verb',
        meaningVi: 'khởi động lại, thiết lập lại',
        exampleEn: 'The system needs a reset.',
        exampleVi: 'Hệ thống cần được thiết lập lại.',
        associatedActions: [
          { en: 'perform hardware reset', vi: 'thực hiện thiết lập lại phần cứng' },
          { en: 'reset network configuration', vi: 'cài đặt lại cấu hình mạng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'The Wi-Fi is incredibly slow.', phraseVi: 'Wi-Fi cực kỳ chậm.' },
      { phraseEn: 'Are you on the staff network?', phraseVi: 'Bạn có đang dùng mạng nhân viên không?' },
      { phraseEn: 'I can\'t download any files.', phraseVi: 'Tôi không thể tải xuống bất kỳ tệp nào.' },
      { phraseEn: 'Let me check the router status.', phraseVi: 'Để tôi kiểm tra trạng thái bộ định tuyến.' },
      { phraseEn: 'Try again in about 5 minutes.', phraseVi: 'Hãy thử lại sau khoảng 5 phút.' }
    ],
    aiTutorPrompt: 'Roleplay as an IT staff member dealing with complaints about slow Wi-Fi. Diagnose the issue and offer a timeline for the fix.',
    tags: ['internet', 'IT', 'connection']
  },
  {
    id: 'work-it-04',
    category: 'workplace_extended',
    subcategory: 'it_helpdesk',
    level: 'A2',
    titleEn: 'Printer not working',
    titleVi: 'Máy in không hoạt động',
    icon: 'printer',
    situationVi: 'Bạn cần in tài liệu cho cuộc họp nhưng máy in báo lỗi kẹt giấy. Bạn nhờ đồng nghiệp IT ra xem giúp.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Excuse me, could someone look at the main printer? It\'s jammed.', textVi: 'Xin lỗi, có ai có thể xem giúp máy in chính không? Nó bị kẹt rồi.' },
      { speaker: 'B', textEn: 'Paper jam again? Let me come over and open it up.', textVi: 'Lại kẹt giấy à? Để tôi qua mở nó ra.' },
      { speaker: 'A', textEn: 'Yes, it says "Error 404" on the screen too.', textVi: 'Vâng, trên màn hình cũng báo "Lỗi 404".' },
      { speaker: 'B', textEn: 'Ah, I see the stuck paper. Let me pull it out gently.', textVi: 'À, tôi thấy tờ giấy bị kẹt rồi. Để tôi kéo nó ra nhẹ nhàng.' },
      { speaker: 'A', textEn: 'Great. Should I resend my document?', textVi: 'Tuyệt. Tôi có nên gửi lại tài liệu của mình không?' },
      { speaker: 'B', textEn: 'No, it should resume printing automatically now.', textVi: 'Không, bây giờ nó sẽ tự động tiếp tục in.' }
    ],
    keyVocabulary: [
      {
        term: 'printer',
        ipa: '/ˈprɪn.tər/',
        partOfSpeech: 'noun',
        meaningVi: 'máy in',
        exampleEn: 'The printer is out of ink.',
        exampleVi: 'Máy in hết mực rồi.',
        associatedActions: [
          { en: 'refill printer paper', vi: 'nạp thêm giấy vào máy in' },
          { en: 'send documents to printer', vi: 'gửi tài liệu đến máy in' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'jam',
        ipa: '/dʒæm/',
        partOfSpeech: 'verb/noun',
        meaningVi: 'kẹt',
        exampleEn: 'There is a paper jam.',
        exampleVi: 'Có một sự cố kẹt giấy.',
        associatedActions: [
          { en: 'clear a paper jam', vi: 'xử lý kẹt giấy trong máy in' },
          { en: 'prevent paper jams', vi: 'ngăn ngừa sự cố kẹt giấy' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'error',
        ipa: '/ˈer.ər/',
        partOfSpeech: 'noun',
        meaningVi: 'lỗi',
        exampleEn: 'An error occurred during printing.',
        exampleVi: 'Đã xảy ra lỗi trong quá trình in.',
        associatedActions: [
          { en: 'display error message', vi: 'hiển thị thông báo lỗi' },
          { en: 'troubleshoot system error', vi: 'khắc phục sự cố lỗi hệ thống' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'stuck',
        ipa: '/stʌk/',
        partOfSpeech: 'adj',
        meaningVi: 'bị mắc kẹt',
        exampleEn: 'The paper is stuck inside.',
        exampleVi: 'Tờ giấy bị mắc kẹt bên trong.',
        associatedActions: [
          { en: 'remove stuck sheets', vi: 'gỡ các tờ giấy bị mắc kẹt' },
          { en: 'inspect stuck paper trays', vi: 'kiểm tra khay giấy bị kẹt' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'resume',
        ipa: '/rɪˈzjuːm/',
        partOfSpeech: 'verb',
        meaningVi: 'tiếp tục (sau khi dừng)',
        exampleEn: 'The meeting will resume after lunch.',
        exampleVi: 'Cuộc họp sẽ tiếp tục sau bữa trưa.',
        associatedActions: [
          { en: 'resume printing job', vi: 'tiếp tục tác vụ in ấn' },
          { en: 'resume normal operations', vi: 'tiếp tục hoạt động bình thường' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'The printer is jammed.', phraseVi: 'Máy in bị kẹt rồi.' },
      { phraseEn: 'It says "Error" on the screen.', phraseVi: 'Trên màn hình báo "Lỗi".' },
      { phraseEn: 'Let me pull it out gently.', phraseVi: 'Để tôi kéo nó ra nhẹ nhàng.' },
      { phraseEn: 'Should I resend my document?', phraseVi: 'Tôi có nên gửi lại tài liệu không?' },
      { phraseEn: 'It will resume printing automatically.', phraseVi: 'Nó sẽ tự động tiếp tục in.' }
    ],
    aiTutorPrompt: 'Roleplay as an IT tech fixing a jammed printer for the user. Explain what you are doing and assure them it will work soon.',
    tags: ['printer', 'hardware', 'office']
  },
  {
    id: 'work-it-05',
    category: 'workplace_extended',
    subcategory: 'it_helpdesk',
    level: 'B1',
    titleEn: 'Software installation request',
    titleVi: 'Yêu cầu cài đặt phần mềm',
    icon: 'download',
    situationVi: 'Bạn cần cài đặt một phần mềm đồ họa mới nhưng bị chặn bởi quyền quản trị (admin rights). Bạn giải thích với IT vì sao bạn cần nó.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Hi, I need to install Adobe Illustrator, but it requires admin rights.', textVi: 'Chào bạn, tôi cần cài đặt Adobe Illustrator, nhưng nó yêu cầu quyền quản trị.' },
      { speaker: 'B', textEn: 'We don\'t usually allow third-party installations. Is it for a project?', textVi: 'Chúng tôi thường không cho phép cài đặt phần mềm của bên thứ ba. Nó dùng cho dự án à?' },
      { speaker: 'A', textEn: 'Yes, my manager approved it for the new marketing campaign.', textVi: 'Vâng, quản lý của tôi đã phê duyệt nó cho chiến dịch tiếp thị mới.' },
      { speaker: 'B', textEn: 'Okay. Can you forward me the approval email?', textVi: 'Được rồi. Bạn có thể chuyển tiếp cho tôi email phê duyệt không?' },
      { speaker: 'A', textEn: 'Sure, I just sent it. Can you remote into my computer to do it?', textVi: 'Chắc chắn rồi, tôi vừa gửi xong. Bạn có thể điều khiển máy tính của tôi từ xa để làm việc đó không?' },
      { speaker: 'B', textEn: 'Yes, accept the remote access prompt on your screen.', textVi: 'Có, hãy chấp nhận yêu cầu truy cập từ xa trên màn hình của bạn.' }
    ],
    keyVocabulary: [
      {
        term: 'install',
        ipa: '/ɪnˈstɔːl/',
        partOfSpeech: 'verb',
        meaningVi: 'cài đặt',
        exampleEn: 'I need to install this app.',
        exampleVi: 'Tôi cần cài đặt ứng dụng này.',
        associatedActions: [
          { en: 'install licensed software', vi: 'cài đặt phần mềm có bản quyền' },
          { en: 'update software packages', vi: 'cập nhật các gói phần mềm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'admin rights',
        ipa: '/ˈæd.mɪn raɪts/',
        partOfSpeech: 'noun phrase',
        meaningVi: 'quyền quản trị viên',
        exampleEn: 'You need admin rights to change settings.',
        exampleVi: 'Bạn cần quyền quản trị viên để thay đổi cài đặt.',
        associatedActions: [
          { en: 'request admin rights', vi: 'yêu cầu quyền quản trị viên' },
          { en: 'grant elevated admin rights', vi: 'cấp quyền quản trị nâng cao' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'third-party',
        ipa: '/ˌθɜːdˈpɑː.ti/',
        partOfSpeech: 'adj',
        meaningVi: 'của bên thứ ba',
        exampleEn: 'Be careful with third-party software.',
        exampleVi: 'Hãy cẩn thận với phần mềm của bên thứ ba.',
        associatedActions: [
          { en: 'evaluate third-party apps', vi: 'đánh giá các ứng dụng bên thứ ba' },
          { en: 'block unverified third-party tools', vi: 'chặn các công cụ bên thứ ba chưa xác minh' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'forward',
        ipa: '/ˈfɔː.wəd/',
        partOfSpeech: 'verb',
        meaningVi: 'chuyển tiếp (email)',
        exampleEn: 'Please forward the email to me.',
        exampleVi: 'Vui lòng chuyển tiếp email cho tôi.',
        associatedActions: [
          { en: 'forward approval email', vi: 'chuyển tiếp email phê duyệt' },
          { en: 'forward tickets to senior IT', vi: 'chuyển tiếp yêu cầu cho IT cấp cao' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'remote access',
        ipa: '/rɪˈməʊt ˈæk.ses/',
        partOfSpeech: 'noun phrase',
        meaningVi: 'truy cập từ xa',
        exampleEn: 'I will grant you remote access.',
        exampleVi: 'Tôi sẽ cấp cho bạn quyền truy cập từ xa.',
        associatedActions: [
          { en: 'grant remote access', vi: 'cấp quyền truy cập từ xa' },
          { en: 'initiate remote access session', vi: 'khởi tạo phiên kết nối từ xa' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'It requires admin rights.', phraseVi: 'Nó yêu cầu quyền quản trị viên.' },
      { phraseEn: 'Is it for a specific project?', phraseVi: 'Nó có dành cho một dự án cụ thể không?' },
      { phraseEn: 'My manager approved it.', phraseVi: 'Quản lý của tôi đã phê duyệt nó.' },
      { phraseEn: 'Can you forward me the approval email?', phraseVi: 'Bạn có thể chuyển tiếp email phê duyệt cho tôi không?' },
      { phraseEn: 'Can you remote into my computer?', phraseVi: 'Bạn có thể truy cập từ xa vào máy tính của tôi không?' }
    ],
    aiTutorPrompt: 'Roleplay as an IT administrator. The user wants to install a new software. Ask for justification and managerial approval before helping them remotely.',
    tags: ['software', 'installation', 'admin']
  }
];
