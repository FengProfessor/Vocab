/**
 * LingoPro Speaking Topic Library
 * Category: workplace_extended
 * Subcategory: project_handover
 * File: src/data/speaking/topic-library/workplace-extended/project-handover.ts
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const PROJECT_HANDOVER_ITEMS: TopicLibraryItem[] = [
  {
    id: 'work-hand-01',
    category: 'workplace_extended',
    subcategory: 'project_handover',
    level: 'B1',
    titleEn: 'Handing over tasks before vacation',
    titleVi: 'Bàn giao công việc trước khi nghỉ phép',
    icon: 'briefcase',
    situationVi: 'Bạn sắp đi nghỉ mát 1 tuần và đang giải thích cho đồng nghiệp về những việc cần theo dõi khi bạn vắng mặt.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Thanks for covering for me while I\'m on vacation next week.', textVi: 'Cảm ơn bạn đã làm thay tôi trong khi tôi đi nghỉ tuần tới.' },
      { speaker: 'B', textEn: 'No problem. What do I need to look out for?', textVi: 'Không có gì. Tôi cần chú ý điều gì?' },
      { speaker: 'A', textEn: 'Mainly the Smith account. They might call about their contract renewal.', textVi: 'Chủ yếu là tài khoản của nhà Smith. Họ có thể gọi về việc gia hạn hợp đồng.' },
      { speaker: 'B', textEn: 'Got it. Is the paperwork ready?', textVi: 'Hiểu rồi. Giấy tờ đã sẵn sàng chưa?' },
      { speaker: 'A', textEn: 'Yes, it\'s in the shared drive under "Pending Contracts".', textVi: 'Rồi, nó nằm trong ổ đĩa chung ở mục "Hợp đồng đang chờ".' },
      { speaker: 'B', textEn: 'Okay, enjoy your trip! I\'ll handle it.', textVi: 'Ok, đi chơi vui vẻ nhé! Tôi sẽ lo việc đó.' }
    ],
    keyVocabulary: [
      {
        term: 'cover for',
        ipa: '/ˈkʌv.ər fɔːr/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'làm thay, đảm nhiệm thay',
        exampleEn: 'Can you cover for me tomorrow?',
        exampleVi: 'Bạn có thể làm thay tôi ngày mai không?',
        associatedActions: [
          { en: 'handle colleague duties', vi: 'xử lý nhiệm vụ thay đồng nghiệp' },
          { en: 'manage urgent tasks', vi: 'quản lý các công việc khẩn cấp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'look out for',
        ipa: '/lʊk aʊt fɔːr/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'để ý, chú ý đến',
        exampleEn: 'Look out for emails from the client.',
        exampleVi: 'Chú ý các email từ khách hàng nhé.',
        associatedActions: [
          { en: 'monitor incoming emails', vi: 'theo dõi email gửi đến' },
          { en: 'watch for updates', vi: 'để ý các cập nhật mới' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'renewal',
        ipa: '/rɪˈnjuː.əl/',
        partOfSpeech: 'noun',
        meaningVi: 'sự gia hạn',
        exampleEn: 'The contract renewal is due soon.',
        exampleVi: 'Việc gia hạn hợp đồng sắp đến hạn.',
        associatedActions: [
          { en: 'extend existing contracts', vi: 'gia hạn các hợp đồng hiện tại' },
          { en: 'review terms', vi: 'xem xét lại các điều khoản' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'paperwork',
        ipa: '/ˈpeɪ.pə.wɜːk/',
        partOfSpeech: 'noun',
        meaningVi: 'công việc giấy tờ',
        exampleEn: 'I have a lot of paperwork to do.',
        exampleVi: 'Tôi có rất nhiều giấy tờ phải làm.',
        associatedActions: [
          { en: 'file official forms', vi: 'sắp xếp các biểu mẫu chính thức' },
          { en: 'review signed records', vi: 'kiểm tra hồ sơ đã ký' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'shared drive',
        ipa: '/ʃeəd draɪv/',
        partOfSpeech: 'noun',
        meaningVi: 'ổ đĩa dùng chung',
        exampleEn: 'Save the file on the shared drive.',
        exampleVi: 'Lưu tệp trên ổ đĩa dùng chung.',
        associatedActions: [
          { en: 'upload project files', vi: 'tải lên các tệp dự án' },
          { en: 'organize cloud folders', vi: 'sắp xếp thư mục đám mây' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Thanks for covering for me.', phraseVi: 'Cảm ơn vì đã làm thay tôi.' },
      { phraseEn: 'What do I need to handle?', phraseVi: 'Tôi cần xử lý những gì?' },
      { phraseEn: 'Everything is saved in the shared drive.', phraseVi: 'Mọi thứ được lưu trong ổ đĩa dùng chung.' },
      { phraseEn: 'If it\'s urgent, you can text me.', phraseVi: 'Nếu có việc khẩn cấp, bạn có thể nhắn tin cho tôi.' },
      { phraseEn: 'Enjoy your vacation!', phraseVi: 'Đi nghỉ vui vẻ nhé!' }
    ],
    aiTutorPrompt: 'Roleplay as a colleague covering for the user who is going on vacation. Ask questions about where files are and what to do if emergencies arise.',
    tags: ['vacation', 'handover', 'coverage']
  },
  {
    id: 'work-hand-02',
    category: 'workplace_extended',
    subcategory: 'project_handover',
    level: 'B1',
    titleEn: 'Briefing a replacement colleague',
    titleVi: 'Hướng dẫn cho đồng nghiệp thay thế',
    icon: 'repeat',
    situationVi: 'Bạn đang chuyển sang bộ phận khác và đang hướng dẫn nhanh cho người mới về quy trình làm việc hàng ngày của vị trí cũ.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'So, every morning, the first thing is to check the support tickets.', textVi: 'Vậy, mỗi sáng, việc đầu tiên là kiểm tra các yêu cầu hỗ trợ.' },
      { speaker: 'B', textEn: 'How many tickets do we usually get a day?', textVi: 'Chúng ta thường nhận được bao nhiêu yêu cầu mỗi ngày?' },
      { speaker: 'A', textEn: 'Around twenty. You sort them by priority.', textVi: 'Khoảng hai mươi. Bạn phân loại chúng theo mức độ ưu tiên.' },
      { speaker: 'B', textEn: 'What if there is a critical server issue?', textVi: 'Nếu có lỗi máy chủ nghiêm trọng thì sao?' },
      { speaker: 'A', textEn: 'You escalate it immediately to the engineering lead.', textVi: 'Bạn báo cáo ngay lập tức cho trưởng nhóm kỹ thuật.' }
    ],
    keyVocabulary: [
      {
        term: 'brief',
        ipa: '/briːf/',
        partOfSpeech: 'verb',
        meaningVi: 'hướng dẫn ngắn gọn, tóm tắt',
        exampleEn: 'I will brief you on the project.',
        exampleVi: 'Tôi sẽ tóm tắt cho bạn về dự án.',
        associatedActions: [
          { en: 'summarize daily routines', vi: 'tóm tắt thói quen hằng ngày' },
          { en: 'explain key tasks', vi: 'giải thích các công việc chính' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'support ticket',
        ipa: '/səˈpɔːt ˈtɪk.ɪt/',
        partOfSpeech: 'noun',
        meaningVi: 'phiếu yêu cầu hỗ trợ',
        exampleEn: 'Please submit a support ticket.',
        exampleVi: 'Vui lòng gửi một phiếu yêu cầu hỗ trợ.',
        associatedActions: [
          { en: 'log incoming issues', vi: 'ghi nhận sự cố gửi đến' },
          { en: 'assign issue status', vi: 'gán trạng thái cho sự cố' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'priority',
        ipa: '/praɪˈɒr.ə.ti/',
        partOfSpeech: 'noun',
        meaningVi: 'sự ưu tiên',
        exampleEn: 'Safety is our top priority.',
        exampleVi: 'An toàn là ưu tiên hàng đầu của chúng tôi.',
        associatedActions: [
          { en: 'rank urgency levels', vi: 'xếp hạng mức độ cấp bách' },
          { en: 'address urgent matters', vi: 'giải quyết việc cấp bách trước' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'critical',
        ipa: '/ˈkrɪt.ɪ.kəl/',
        partOfSpeech: 'adj',
        meaningVi: 'rất quan trọng, nguy cấp',
        exampleEn: 'We have a critical problem.',
        exampleVi: 'Chúng ta có một vấn đề nguy cấp.',
        associatedActions: [
          { en: 'identify major risks', vi: 'nhận diện rủi ro lớn' },
          { en: 'take immediate action', vi: 'hành động can thiệp tức thì' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'escalate',
        ipa: '/ˈes.kə.leɪt/',
        partOfSpeech: 'verb',
        meaningVi: 'báo cáo lên cấp trên',
        exampleEn: 'I had to escalate the issue to the manager.',
        exampleVi: 'Tôi phải báo cáo vấn đề lên quản lý.',
        associatedActions: [
          { en: 'notify lead engineers', vi: 'thông báo kỹ sư trưởng' },
          { en: 'forward unresolved cases', vi: 'chuyển tiếp ca chưa xử lý xong' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'The first thing you need to do is...', phraseVi: 'Việc đầu tiên bạn cần làm là...' },
      { phraseEn: 'Sort them by priority.', phraseVi: 'Phân loại chúng theo độ ưu tiên.' },
      { phraseEn: 'What happens if...?', phraseVi: 'Điều gì xảy ra nếu...?' },
      { phraseEn: 'Escalate it to the manager.', phraseVi: 'Báo cáo việc đó lên quản lý.' },
      { phraseEn: 'I\'ll leave a document with all the passwords.', phraseVi: 'Tôi sẽ để lại một tài liệu chứa tất cả mật khẩu.' }
    ],
    aiTutorPrompt: 'Roleplay as a new employee replacing the user. Ask the user questions about daily tasks, priorities, and problem-solving steps.',
    tags: ['training', 'handover', 'process']
  },
  {
    id: 'work-hand-03',
    category: 'workplace_extended',
    subcategory: 'project_handover',
    level: 'B1',
    titleEn: 'Documenting project status',
    titleVi: 'Tài liệu hóa tình trạng dự án',
    icon: 'file-text',
    situationVi: 'Bạn đang trình bày một tài liệu bàn giao (handover document) cho sếp để họ nắm được dự án đang ở giai đoạn nào.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'I\'ve created a handover document for the website redesign.', textVi: 'Tôi đã tạo một tài liệu bàn giao cho việc thiết kế lại trang web.' },
      { speaker: 'B', textEn: 'Great. Where are we currently at?', textVi: 'Tuyệt. Hiện tại chúng ta đang ở đâu?' },
      { speaker: 'A', textEn: 'Phase one is complete. The design mockups are approved.', textVi: 'Giai đoạn một đã hoàn thành. Các bản mẫu thiết kế đã được duyệt.' },
      { speaker: 'B', textEn: 'And what is pending?', textVi: 'Và điều gì đang bị tồn đọng?' },
      { speaker: 'A', textEn: 'We are waiting for the client to send the final texts. It\'s all in the document.', textVi: 'Chúng ta đang đợi khách hàng gửi các đoạn văn bản cuối cùng. Tất cả đều có trong tài liệu.' }
    ],
    keyVocabulary: [
      {
        term: 'document',
        ipa: '/ˈdɒk.jə.mənt/',
        partOfSpeech: 'verb',
        meaningVi: 'lập tài liệu, ghi chép lại',
        exampleEn: 'Please document the entire process.',
        exampleVi: 'Vui lòng ghi chép lại toàn bộ quy trình.',
        associatedActions: [
          { en: 'record daily procedures', vi: 'ghi chép quy trình hằng ngày' },
          { en: 'draft clear manuals', vi: 'soạn thảo tài liệu hướng dẫn rõ ràng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'handover',
        ipa: '/ˈhændˌəʊ.vər/',
        partOfSpeech: 'noun',
        meaningVi: 'sự bàn giao',
        exampleEn: 'The handover will take place on Friday.',
        exampleVi: 'Việc bàn giao sẽ diễn ra vào thứ Sáu.',
        associatedActions: [
          { en: 'transfer responsibilities', vi: 'chuyển giao các trách nhiệm' },
          { en: 'deliver project notes', vi: 'bàn giao ghi chú dự án' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'phase',
        ipa: '/feɪz/',
        partOfSpeech: 'noun',
        meaningVi: 'giai đoạn',
        exampleEn: 'We are entering the final phase.',
        exampleVi: 'Chúng ta đang bước vào giai đoạn cuối.',
        associatedActions: [
          { en: 'track milestone stages', vi: 'theo dõi các giai đoạn cột mốc' },
          { en: 'complete rollout cycles', vi: 'hoàn thành chu kỳ triển khai' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'mockup',
        ipa: '/ˈmɒk.ʌp/',
        partOfSpeech: 'noun',
        meaningVi: 'bản mẫu',
        exampleEn: 'The client liked the mockup.',
        exampleVi: 'Khách hàng thích bản mẫu.',
        associatedActions: [
          { en: 'review screen prototypes', vi: 'đánh giá bản mẫu giao diện' },
          { en: 'gather design feedback', vi: 'thu thập phản hồi thiết kế' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'pending',
        ipa: '/ˈpen.dɪŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'đang chờ giải quyết, chưa xong',
        exampleEn: 'There are a few pending issues.',
        exampleVi: 'Có một vài vấn đề đang chờ giải quyết.',
        associatedActions: [
          { en: 'follow up on approvals', vi: 'theo dõi tiến độ phê duyệt' },
          { en: 'resolve backlogged tasks', vi: 'giải quyết việc còn tồn đọng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'I\'ve created a handover document.', phraseVi: 'Tôi đã tạo một tài liệu bàn giao.' },
      { phraseEn: 'Where are we currently at?', phraseVi: 'Hiện tại chúng ta đang ở tiến độ nào?' },
      { phraseEn: 'Phase one is complete.', phraseVi: 'Giai đoạn một đã hoàn thành.' },
      { phraseEn: 'We are still waiting for...', phraseVi: 'Chúng ta vẫn đang chờ...' },
      { phraseEn: 'Everything is detailed in the file.', phraseVi: 'Mọi thứ được trình bày chi tiết trong tệp.' }
    ],
    aiTutorPrompt: 'Roleplay as a manager listening to the user explain the current status of a project via a handover document. Ask for status updates and pending items.',
    tags: ['project status', 'documentation', 'handover']
  },
  {
    id: 'work-hand-04',
    category: 'workplace_extended',
    subcategory: 'project_handover',
    level: 'B1',
    titleEn: 'Explaining pending deadlines',
    titleVi: 'Giải thích các hạn chót đang đến',
    icon: 'clock',
    situationVi: 'Khi bàn giao, bạn nhấn mạnh những nhiệm vụ có hạn chót rất gấp mà người nhận bàn giao cần phải hoàn thành ngay lập tức.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'I want to highlight a few critical deadlines approaching this week.', textVi: 'Tôi muốn nhấn mạnh một vài hạn chót quan trọng sắp tới trong tuần này.' },
      { speaker: 'B', textEn: 'Okay, what is the most urgent one?', textVi: 'Được, việc nào khẩn cấp nhất?' },
      { speaker: 'A', textEn: 'The tax report must be submitted by Thursday at 5 PM.', textVi: 'Báo cáo thuế phải được nộp trước 5 giờ chiều Thứ Năm.' },
      { speaker: 'B', textEn: 'Is all the data prepared?', textVi: 'Tất cả dữ liệu đã được chuẩn bị chưa?' },
      { speaker: 'A', textEn: 'Yes, it just needs a final review and signature from the director.', textVi: 'Rồi, nó chỉ cần được xem xét lần cuối và lấy chữ ký từ giám đốc.' }
    ],
    keyVocabulary: [
      {
        term: 'highlight',
        ipa: '/ˈhaɪ.laɪt/',
        partOfSpeech: 'verb',
        meaningVi: 'làm nổi bật, nhấn mạnh',
        exampleEn: 'I want to highlight this issue.',
        exampleVi: 'Tôi muốn nhấn mạnh vấn đề này.',
        associatedActions: [
          { en: 'emphasize urgent items', vi: 'nhấn mạnh hạng mục khẩn cấp' },
          { en: 'draw team attention', vi: 'thu hút sự chú ý của nhóm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'deadline',
        ipa: '/ˈded.laɪn/',
        partOfSpeech: 'noun',
        meaningVi: 'hạn chót',
        exampleEn: 'We have a tight deadline.',
        exampleVi: 'Chúng ta có một hạn chót rất sát.',
        associatedActions: [
          { en: 'meet delivery schedules', vi: 'đáp ứng tiến độ bàn giao' },
          { en: 'set countdown reminders', vi: 'cài đặt nhắc nhở đếm ngược' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'approaching',
        ipa: '/əˈprəʊtʃ.ɪŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'đang đến gần',
        exampleEn: 'The storm is approaching.',
        exampleVi: 'Cơn bão đang đến gần.',
        associatedActions: [
          { en: 'prepare final deliverables', vi: 'chuẩn bị sản phẩm bàn giao cuối' },
          { en: 'speed up completion', vi: 'đẩy nhanh tiến độ hoàn thành' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'submit',
        ipa: '/səbˈmɪt/',
        partOfSpeech: 'verb',
        meaningVi: 'nộp, đệ trình',
        exampleEn: 'Submit your report by Friday.',
        exampleVi: 'Nộp báo cáo của bạn trước thứ Sáu.',
        associatedActions: [
          { en: 'send completed forms', vi: 'gửi nộp biểu mẫu hoàn chỉnh' },
          { en: 'upload final submissions', vi: 'tải lên hồ sơ nộp lần cuối' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'signature',
        ipa: '/ˈsɪɡ.nə.tʃər/',
        partOfSpeech: 'noun',
        meaningVi: 'chữ ký',
        exampleEn: 'I need your signature here.',
        exampleVi: 'Tôi cần chữ ký của bạn ở đây.',
        associatedActions: [
          { en: 'sign official forms', vi: 'ký tên vào biểu mẫu chính thức' },
          { en: 'obtain executive sign-off', vi: 'xin chữ ký phê duyệt của lãnh đạo' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'I want to highlight a few deadlines.', phraseVi: 'Tôi muốn nhấn mạnh một vài hạn chót.' },
      { phraseEn: 'What is the most urgent task?', phraseVi: 'Nhiệm vụ khẩn cấp nhất là gì?' },
      { phraseEn: 'It must be submitted by Thursday.', phraseVi: 'Nó phải được nộp trước thứ Năm.' },
      { phraseEn: 'It just needs a final review.', phraseVi: 'Nó chỉ cần được duyệt lần cuối.' },
      { phraseEn: 'Don\'t miss the deadline.', phraseVi: 'Đừng bỏ lỡ hạn chót.' }
    ],
    aiTutorPrompt: 'Roleplay as a colleague taking over the user\'s work. Ask about the most pressing deadlines and what exactly needs to be done to meet them.',
    tags: ['deadline', 'handover', 'urgent']
  },
  {
    id: 'work-hand-05',
    category: 'workplace_extended',
    subcategory: 'project_handover',
    level: 'B2',
    titleEn: 'Transferring client relationships',
    titleVi: 'Bàn giao các mối quan hệ khách hàng',
    icon: 'users',
    situationVi: 'Bạn sắp nghỉ việc và đang giới thiệu đồng nghiệp thay thế của mình với một khách hàng VIP qua một cuộc gọi để chuyển giao liên lạc.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Mr. Lee, I\'m calling to introduce my colleague, Anna, who will be taking over your account.', textVi: 'Ông Lee, tôi gọi để giới thiệu đồng nghiệp của tôi, Anna, người sẽ tiếp quản tài khoản của ông.' },
      { speaker: 'B', textEn: 'I\'m sorry to see you go, but nice to meet you, Anna.', textVi: 'Rất tiếc khi thấy bạn rời đi, nhưng rất vui được gặp cô, Anna.' },
      { speaker: 'A', textEn: 'Anna has been fully briefed on your upcoming product launch.', textVi: 'Anna đã được tóm tắt đầy đủ về đợt ra mắt sản phẩm sắp tới của ông.' },
      { speaker: 'B', textEn: 'That\'s good to hear. Will she be my main point of contact now?', textVi: 'Rất vui khi nghe điều đó. Bây giờ cô ấy sẽ là đầu mối liên hệ chính của tôi chứ?' },
      { speaker: 'A', textEn: 'Yes, exactly. I assure you you\'re in good hands.', textVi: 'Vâng, chính xác. Tôi đảm bảo với ông rằng ông sẽ được hỗ trợ chu đáo.' }
    ],
    keyVocabulary: [
      {
        term: 'transfer',
        ipa: '/trænsˈfɜːr/',
        partOfSpeech: 'verb',
        meaningVi: 'chuyển giao',
        exampleEn: 'I will transfer the money today.',
        exampleVi: 'Tôi sẽ chuyển tiền hôm nay.',
        associatedActions: [
          { en: 'reassign client accounts', vi: 'chuyển giao tài khoản khách hàng' },
          { en: 'share historical logs', vi: 'chia sẻ lịch sử trao đổi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'take over',
        ipa: '/teɪk ˈəʊ.vər/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'tiếp quản',
        exampleEn: 'She will take over as manager.',
        exampleVi: 'Cô ấy sẽ tiếp quản vị trí quản lý.',
        associatedActions: [
          { en: 'assume leadership duties', vi: 'tiếp quản trách nhiệm điều hành' },
          { en: 'manage ongoing relations', vi: 'quản lý các mối quan hệ hiện thời' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'brief',
        ipa: '/briːf/',
        partOfSpeech: 'verb',
        meaningVi: 'tóm tắt, thông tin cho ai đó',
        exampleEn: 'He briefed the team on the plan.',
        exampleVi: 'Anh ấy đã thông báo cho nhóm về kế hoạch.',
        associatedActions: [
          { en: 'introduce background details', vi: 'giới thiệu các thông tin cơ sở' },
          { en: 'explain account history', vi: 'giải thích lịch sử làm việc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'point of contact',
        ipa: '/pɔɪnt əv ˈkɒn.tækt/',
        partOfSpeech: 'noun phrase',
        meaningVi: 'đầu mối liên hệ',
        exampleEn: 'Who is your main point of contact?',
        exampleVi: 'Đầu mối liên hệ chính của bạn là ai?',
        associatedActions: [
          { en: 'reach out for inquiries', vi: 'liên hệ khi có thắc mắc' },
          { en: 'share direct contact details', vi: 'chia sẻ phương thức liên lạc trực tiếp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'in good hands',
        ipa: '/ɪn ɡʊd hændz/',
        partOfSpeech: 'idiom',
        meaningVi: 'được chăm sóc/quản lý tốt',
        exampleEn: 'Don\'t worry, the project is in good hands.',
        exampleVi: 'Đừng lo, dự án đang được quản lý rất tốt.',
        associatedActions: [
          { en: 'reassure loyal clients', vi: 'trấn an khách hàng thân thiết' },
          { en: 'maintain service quality', vi: 'duy trì chất lượng dịch vụ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'I\'m calling to introduce my replacement.', phraseVi: 'Tôi gọi để giới thiệu người thay thế tôi.' },
      { phraseEn: 'She will be taking over your account.', phraseVi: 'Cô ấy sẽ tiếp quản tài khoản của bạn.' },
      { phraseEn: 'She has been fully briefed on everything.', phraseVi: 'Cô ấy đã được thông báo đầy đủ về mọi thứ.' },
      { phraseEn: 'She will be your new point of contact.', phraseVi: 'Cô ấy sẽ là đầu mối liên hệ mới của bạn.' },
      { phraseEn: 'You are in good hands.', phraseVi: 'Bạn sẽ được hỗ trợ rất tốt.' }
    ],
    aiTutorPrompt: 'Roleplay as a VIP client. The user is a service provider introducing their replacement before leaving the company. Express slight concern but be polite.',
    tags: ['client', 'relationship', 'handover']
  }
];
