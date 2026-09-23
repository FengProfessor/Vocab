/**
 * LingoPro Speaking Topic Library
 * Category: workplace_extended
 * Subcategory: quarterly_review
 * File: src/data/speaking/topic-library/workplace-extended/quarterly-review.ts
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const QUARTERLY_REVIEW_ITEMS: TopicLibraryItem[] = [
  {
    id: 'work-review-01',
    category: 'workplace_extended',
    subcategory: 'quarterly_review',
    level: 'B1',
    titleEn: 'Presenting your achievements',
    titleVi: 'Trình bày các thành tích của bạn',
    icon: 'award',
    situationVi: 'Trong buổi đánh giá hiệu suất hàng quý, bạn đang liệt kê những dự án thành công mà bạn đã hoàn thành để chứng minh năng lực của mình.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Overall, how do you feel about your performance this quarter?', textVi: 'Nhìn chung, bạn cảm thấy thế nào về hiệu suất của mình trong quý này?' },
      { speaker: 'B', textEn: 'I feel very positive. I successfully completed the software migration ahead of schedule.', textVi: 'Tôi cảm thấy rất tích cực. Tôi đã hoàn thành việc chuyển đổi phần mềm trước thời hạn.' },
      { speaker: 'A', textEn: 'Yes, that was a major win for the team. Anything else?', textVi: 'Đúng vậy, đó là một thắng lợi lớn của nhóm. Còn gì nữa không?' },
      { speaker: 'B', textEn: 'I also trained two new junior developers, which improved our team\'s output.', textVi: 'Tôi cũng đã đào tạo hai lập trình viên mới, điều này giúp cải thiện năng suất của nhóm.' },
      { speaker: 'A', textEn: 'Excellent. Your hard work has really shown.', textVi: 'Xuất sắc. Sự chăm chỉ của bạn thực sự đã được thể hiện.' }
    ],
    keyVocabulary: [
      {
        term: 'performance',
        ipa: '/pəˈfɔː.məns/',
        partOfSpeech: 'noun',
        meaningVi: 'hiệu suất, thành tích',
        exampleEn: 'Her performance this year was outstanding.',
        exampleVi: 'Hiệu suất của cô ấy năm nay thật xuất sắc.',
        associatedActions: [
          { en: 'evaluate quarterly output', vi: 'đánh giá sản lượng theo quý' },
          { en: 'recognize contributions', vi: 'ghi nhận các đóng góp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'quarter',
        ipa: '/ˈkwɔː.tər/',
        partOfSpeech: 'noun',
        meaningVi: 'quý (3 tháng)',
        exampleEn: 'Sales dropped in the first quarter.',
        exampleVi: 'Doanh số đã giảm trong quý đầu tiên.',
        associatedActions: [
          { en: 'track fiscal progress', vi: 'theo dõi tiến độ năm tài chính' },
          { en: 'review quarterly metrics', vi: 'đánh giá số liệu theo quý' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'migration',
        ipa: '/maɪˈɡreɪ.ʃən/',
        partOfSpeech: 'noun',
        meaningVi: 'sự chuyển đổi, di chuyển',
        exampleEn: 'The data migration took three hours.',
        exampleVi: 'Việc chuyển đổi dữ liệu mất ba giờ.',
        associatedActions: [
          { en: 'transfer cloud databases', vi: 'chuyển đổi cơ sở dữ liệu đám mây' },
          { en: 'verify system stability', vi: 'xác minh tính ổn định hệ thống' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'ahead of schedule',
        ipa: '/əˈhed əv ˈʃedʒ.uːl/',
        partOfSpeech: 'idiom',
        meaningVi: 'trước thời hạn',
        exampleEn: 'We finished the project ahead of schedule.',
        exampleVi: 'Chúng tôi đã hoàn thành dự án trước thời hạn.',
        associatedActions: [
          { en: 'beat delivery deadlines', vi: 'vượt trước thời hạn bàn giao' },
          { en: 'accelerate project delivery', vi: 'đẩy nhanh tiến độ dự án' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'output',
        ipa: '/ˈaʊt.pʊt/',
        partOfSpeech: 'noun',
        meaningVi: 'sản lượng, năng suất',
        exampleEn: 'The factory increased its output.',
        exampleVi: 'Nhà máy đã tăng sản lượng.',
        associatedActions: [
          { en: 'boost team throughput', vi: 'nâng cao thông lượng cả nhóm' },
          { en: 'measure productive work', vi: 'đo lường năng suất làm việc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'How do you feel about your performance?', phraseVi: 'Bạn cảm thấy thế nào về hiệu suất của mình?' },
      { phraseEn: 'I successfully completed...', phraseVi: 'Tôi đã hoàn thành xuất sắc...' },
      { phraseEn: 'I finished ahead of schedule.', phraseVi: 'Tôi đã hoàn thành trước thời hạn.' },
      { phraseEn: 'That was a major win for the team.', phraseVi: 'Đó là một thắng lợi lớn cho nhóm.' },
      { phraseEn: 'Your hard work has really shown.', phraseVi: 'Sự chăm chỉ của bạn đã mang lại kết quả rõ rệt.' }
    ],
    aiTutorPrompt: 'Roleplay as a manager conducting a quarterly performance review. Ask the user (employee) to present their main achievements for the last three months.',
    tags: ['review', 'achievements', 'performance']
  },
  {
    id: 'work-review-02',
    category: 'workplace_extended',
    subcategory: 'quarterly_review',
    level: 'B1',
    titleEn: 'Discussing areas for improvement',
    titleVi: 'Thảo luận về các khía cạnh cần cải thiện',
    icon: 'trending-up',
    situationVi: 'Quản lý của bạn chỉ ra một kỹ năng bạn cần khắc phục (ví dụ: quản lý thời gian) và hai bạn thảo luận cách để làm tốt hơn.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'While your technical work is great, I think your time management could improve.', textVi: 'Mặc dù kỹ năng chuyên môn của bạn rất tốt, tôi nghĩ kỹ năng quản lý thời gian của bạn có thể cải thiện.' },
      { speaker: 'B', textEn: 'I agree. I sometimes spend too much time on minor details.', textVi: 'Tôi đồng ý. Đôi khi tôi dành quá nhiều thời gian cho các chi tiết nhỏ.' },
      { speaker: 'A', textEn: 'Exactly. It causes you to miss internal deadlines occasionally.', textVi: 'Chính xác. Điều đó khiến bạn thỉnh thoảng bỏ lỡ các hạn chót nội bộ.' },
      { speaker: 'B', textEn: 'I will start using a time-tracking tool to prioritize better.', textVi: 'Tôi sẽ bắt đầu sử dụng một công cụ theo dõi thời gian để ưu tiên công việc tốt hơn.' },
      { speaker: 'A', textEn: 'That sounds like a good action plan.', textVi: 'Nghe có vẻ là một kế hoạch hành động tốt.' }
    ],
    keyVocabulary: [
      {
        term: 'improvement',
        ipa: '/ɪmˈpruːv.mənt/',
        partOfSpeech: 'noun',
        meaningVi: 'sự cải thiện',
        exampleEn: 'There is always room for improvement.',
        exampleVi: 'Luôn có không gian để cải thiện.',
        associatedActions: [
          { en: 'identify weak areas', vi: 'nhận diện các điểm còn yếu' },
          { en: 'refine daily workflows', vi: 'tinh chỉnh quy trình hằng ngày' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'minor',
        ipa: '/ˈmaɪ.nər/',
        partOfSpeech: 'adj',
        meaningVi: 'nhỏ, thứ yếu',
        exampleEn: 'It was just a minor mistake.',
        exampleVi: 'Đó chỉ là một sai lầm nhỏ.',
        associatedActions: [
          { en: 'fix trivial glitches', vi: 'sửa lỗi nhỏ không đáng kể' },
          { en: 'overlook small flaws', vi: 'bỏ qua các tì vết nhỏ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'internal',
        ipa: '/ɪnˈtɜː.nəl/',
        partOfSpeech: 'adj',
        meaningVi: 'nội bộ',
        exampleEn: 'This is an internal memo.',
        exampleVi: 'Đây là một thông báo nội bộ.',
        associatedActions: [
          { en: 'circulate team memos', vi: 'luân chuyển thông báo nội bộ' },
          { en: 'coordinate inside units', vi: 'phối hợp trong nội bộ đơn vị' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'occasionally',
        ipa: '/əˈkeɪ.ʒən.əl.i/',
        partOfSpeech: 'adv',
        meaningVi: 'thỉnh thoảng',
        exampleEn: 'I occasionally work on weekends.',
        exampleVi: 'Thỉnh thoảng tôi làm việc vào cuối tuần.',
        associatedActions: [
          { en: 'visit client sites', vi: 'thỉnh thoảng ghé thăm đối tác' },
          { en: 'attend special events', vi: 'tham gia sự kiện đột xuất' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'prioritize',
        ipa: '/praɪˈɒr.ɪ.taɪz/',
        partOfSpeech: 'verb',
        meaningVi: 'ưu tiên',
        exampleEn: 'You must learn to prioritize your tasks.',
        exampleVi: 'Bạn phải học cách ưu tiên các nhiệm vụ của mình.',
        associatedActions: [
          { en: 'order daily objectives', vi: 'sắp thứ tự các mục tiêu ngày' },
          { en: 'focus on essentials', vi: 'tập trung vào điều thiết yếu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'There is an area for improvement.', phraseVi: 'Có một lĩnh vực cần được cải thiện.' },
      { phraseEn: 'I think your time management could improve.', phraseVi: 'Tôi nghĩ quản lý thời gian của bạn có thể cải thiện.' },
      { phraseEn: 'I spend too much time on minor details.', phraseVi: 'Tôi dành quá nhiều thời gian cho các chi tiết nhỏ.' },
      { phraseEn: 'It causes you to miss deadlines.', phraseVi: 'Điều đó làm bạn lỡ hạn chót.' },
      { phraseEn: 'I will prioritize better.', phraseVi: 'Tôi sẽ ưu tiên tốt hơn.' }
    ],
    aiTutorPrompt: 'Roleplay as a manager pointing out an area for improvement (e.g., communication, time management). The user is the employee who should respond professionally.',
    tags: ['improvement', 'review', 'feedback']
  },
  {
    id: 'work-review-03',
    category: 'workplace_extended',
    subcategory: 'quarterly_review',
    level: 'B1',
    titleEn: 'Setting goals for next quarter',
    titleVi: 'Thiết lập mục tiêu cho quý tới',
    icon: 'target',
    situationVi: 'Cuối buổi đánh giá, bạn và sếp cùng nhau vạch ra 2-3 mục tiêu cụ thể mà bạn cần đạt được trong 3 tháng tới.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Let\'s talk about your goals for the next quarter.', textVi: 'Hãy nói về mục tiêu của bạn trong quý tới.' },
      { speaker: 'B', textEn: 'I\'d like to take on more leadership responsibilities.', textVi: 'Tôi muốn đảm nhận thêm nhiều trách nhiệm lãnh đạo hơn.' },
      { speaker: 'A', textEn: 'That\'s great. How about you lead the upcoming app launch?', textVi: 'Thật tuyệt. Bạn nghĩ sao về việc dẫn dắt buổi ra mắt ứng dụng sắp tới?' },
      { speaker: 'B', textEn: 'I would love that opportunity. I will draft a project plan by next week.', textVi: 'Tôi rất thích cơ hội đó. Tôi sẽ phác thảo một kế hoạch dự án trước tuần tới.' },
      { speaker: 'A', textEn: 'Perfect. We will set that as your primary OKR for Q3.', textVi: 'Hoàn hảo. Chúng ta sẽ đặt đó làm mục tiêu OKR chính của bạn cho Quý 3.' }
    ],
    keyVocabulary: [
      {
        term: 'goal',
        ipa: '/ɡəʊl/',
        partOfSpeech: 'noun',
        meaningVi: 'mục tiêu',
        exampleEn: 'My goal is to learn Spanish.',
        exampleVi: 'Mục tiêu của tôi là học tiếng Tây Ban Nha.',
        associatedActions: [
          { en: 'define target milestones', vi: 'xác định các mốc mục tiêu' },
          { en: 'measure key progress', vi: 'đo lường tiến độ trọng yếu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'leadership',
        ipa: '/ˈliː.də.ʃɪp/',
        partOfSpeech: 'noun',
        meaningVi: 'khả năng/vị trí lãnh đạo',
        exampleEn: 'He has strong leadership skills.',
        exampleVi: 'Anh ấy có kỹ năng lãnh đạo mạnh mẽ.',
        associatedActions: [
          { en: 'inspire team colleagues', vi: 'truyền cảm hứng cho đồng đội' },
          { en: 'lead strategic projects', vi: 'dẫn dắt các dự án chiến lược' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'opportunity',
        ipa: '/ˌɒp.əˈtʃuː.nə.ti/',
        partOfSpeech: 'noun',
        meaningVi: 'cơ hội',
        exampleEn: 'Don\'t miss this opportunity.',
        exampleVi: 'Đừng bỏ lỡ cơ hội này.',
        associatedActions: [
          { en: 'seize growth chances', vi: 'nắm bắt cơ hội phát triển' },
          { en: 'explore fresh roles', vi: 'khám phá các vai trò mới mẻ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'draft',
        ipa: '/drɑːft/',
        partOfSpeech: 'verb',
        meaningVi: 'phác thảo',
        exampleEn: 'I will draft an email to the client.',
        exampleVi: 'Tôi sẽ phác thảo một email cho khách hàng.',
        associatedActions: [
          { en: 'outline project briefs', vi: 'phác thảo tóm tắt dự án' },
          { en: 'revise initial drafts', vi: 'chỉnh sửa các bản thảo đầu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'primary',
        ipa: '/ˈpraɪ.mər.i/',
        partOfSpeech: 'adj',
        meaningVi: 'chính, yếu',
        exampleEn: 'Our primary focus is customer satisfaction.',
        exampleVi: 'Trọng tâm chính của chúng tôi là sự hài lòng của khách hàng.',
        associatedActions: [
          { en: 'designate main priorities', vi: 'chỉ định các ưu tiên chính' },
          { en: 'direct core attention', vi: 'hướng sự chú ý vào cốt lõi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'Let\'s talk about your goals.', phraseVi: 'Hãy nói về các mục tiêu của bạn.' },
      { phraseEn: 'I\'d like to take on more responsibilities.', phraseVi: 'Tôi muốn đảm nhận thêm nhiều trách nhiệm.' },
      { phraseEn: 'I would love that opportunity.', phraseVi: 'Tôi rất thích cơ hội đó.' },
      { phraseEn: 'I will draft a plan by next week.', phraseVi: 'Tôi sẽ phác thảo một kế hoạch trước tuần tới.' },
      { phraseEn: 'We will set that as your primary goal.', phraseVi: 'Chúng ta sẽ đặt đó làm mục tiêu chính của bạn.' }
    ],
    aiTutorPrompt: 'Roleplay as a supportive manager. Help the user (employee) define specific and measurable goals for their next quarter at work.',
    tags: ['goals', 'planning', 'review']
  },
  {
    id: 'work-review-04',
    category: 'workplace_extended',
    subcategory: 'quarterly_review',
    level: 'B2',
    titleEn: 'Asking for a promotion/raise',
    titleVi: 'Yêu cầu thăng chức/tăng lương',
    icon: 'dollar-sign',
    situationVi: 'Bạn tin rằng những đóng góp gần đây của mình xứng đáng với một mức lương cao hơn và bạn mạnh dạn đề xuất điều đó với sếp.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'Given my consistent high performance over the past year, I\'d like to discuss my compensation.', textVi: 'Với hiệu suất cao và ổn định của tôi trong năm qua, tôi muốn thảo luận về mức lương của mình.' },
      { speaker: 'B', textEn: 'I agree you\'ve done excellent work. What did you have in mind?', textVi: 'Tôi đồng ý rằng bạn đã làm việc rất xuất sắc. Bạn đang nghĩ đến điều gì?' },
      { speaker: 'A', textEn: 'Based on my added responsibilities and market research, I am requesting a 10% salary increase.', textVi: 'Dựa trên các trách nhiệm được bổ sung và nghiên cứu thị trường, tôi muốn yêu cầu mức tăng lương 10%.' },
      { speaker: 'B', textEn: 'I can\'t promise 10% right now, but I will take this to HR and see what we can do.', textVi: 'Tôi không thể hứa 10% ngay bây giờ, nhưng tôi sẽ báo cáo việc này với phòng nhân sự để xem chúng ta có thể làm gì.' },
      { speaker: 'A', textEn: 'I appreciate you advocating for me. Thank you.', textVi: 'Tôi rất biết ơn vì sếp đã hỗ trợ cho tôi. Cảm ơn sếp.' }
    ],
    keyVocabulary: [
      {
        term: 'consistent',
        ipa: '/kənˈsɪs.tənt/',
        partOfSpeech: 'adj',
        meaningVi: 'nhất quán, ổn định',
        exampleEn: 'He is a consistent player.',
        exampleVi: 'Anh ấy là một cầu thủ có phong độ ổn định.',
        associatedActions: [
          { en: 'deliver steady results', vi: 'mang lại kết quả đều đặn' },
          { en: 'maintain high standards', vi: 'duy trì các tiêu chuẩn cao' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'compensation',
        ipa: '/ˌkɒm.penˈseɪ.ʃən/',
        partOfSpeech: 'noun',
        meaningVi: 'tiền lương, sự đền bù',
        exampleEn: 'The compensation package is very attractive.',
        exampleVi: 'Gói đãi ngộ rất hấp dẫn.',
        associatedActions: [
          { en: 'negotiate base pay', vi: 'thương thảo mức lương cơ bản' },
          { en: 'review total benefits', vi: 'xem xét toàn bộ phúc lợi' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'request',
        ipa: '/rɪˈkwest/',
        partOfSpeech: 'verb',
        meaningVi: 'yêu cầu',
        exampleEn: 'I am requesting a few days off.',
        exampleVi: 'Tôi đang yêu cầu nghỉ vài ngày.',
        associatedActions: [
          { en: 'submit formal appeals', vi: 'nộp đơn kiến nghị chính thức' },
          { en: 'ask for salary reviews', vi: 'đề xuất xem xét lại mức lương' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'increase',
        ipa: '/ˈɪn.kriːs/',
        partOfSpeech: 'noun',
        meaningVi: 'sự tăng lên',
        exampleEn: 'There has been a price increase.',
        exampleVi: 'Đã có sự tăng giá.',
        associatedActions: [
          { en: 'calculate raise percentages', vi: 'tính toán tỉ lệ tăng lương' },
          { en: 'track revenue growth', vi: 'theo dõi đà tăng trưởng doanh thu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'advocate',
        ipa: '/ˈæd.və.keɪt/',
        partOfSpeech: 'verb',
        meaningVi: 'biện hộ, ủng hộ (cho ai)',
        exampleEn: 'She advocated for better working conditions.',
        exampleVi: 'Cô ấy đã đấu tranh cho điều kiện làm việc tốt hơn.',
        associatedActions: [
          { en: 'support team members', vi: 'hỗ trợ các thành viên nhóm' },
          { en: 'champion employee rights', vi: 'bảo vệ quyền lợi nhân viên' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'I\'d like to discuss my compensation.', phraseVi: 'Tôi muốn thảo luận về mức lương của mình.' },
      { phraseEn: 'Given my consistent high performance...', phraseVi: 'Dựa trên thành tích cao ổn định của tôi...' },
      { phraseEn: 'I am requesting a salary increase.', phraseVi: 'Tôi đang yêu cầu được tăng lương.' },
      { phraseEn: 'I will take this to HR.', phraseVi: 'Tôi sẽ đưa việc này lên phòng nhân sự.' },
      { phraseEn: 'I appreciate you advocating for me.', phraseVi: 'Tôi cảm kích việc bạn ủng hộ cho tôi.' }
    ],
    aiTutorPrompt: 'Roleplay as a manager. The user will ask you for a raise or promotion based on their recent performance. Be neutral but open to discussion.',
    tags: ['raise', 'promotion', 'salary']
  },
  {
    id: 'work-review-05',
    category: 'workplace_extended',
    subcategory: 'quarterly_review',
    level: 'B2',
    titleEn: 'Receiving constructive feedback',
    titleVi: 'Tiếp nhận những góp ý mang tính xây dựng',
    icon: 'message-circle',
    situationVi: 'Quản lý của bạn đưa ra những nhận xét thẳng thắn về việc bạn thiếu kỹ năng làm việc nhóm. Bạn lắng nghe và tiếp nhận một cách chuyên nghiệp.',
    sampleDialogue: [
      { speaker: 'A', textEn: 'I need to give you some feedback. Lately, you\'ve been working in silos rather than collaborating with the team.', textVi: 'Tôi cần góp ý với bạn vài điều. Gần đây, bạn đang làm việc một cách cô lập thay vì cộng tác với nhóm.' },
      { speaker: 'B', textEn: 'I didn\'t realize it came across that way. Could you give me an example?', textVi: 'Tôi không nhận ra nó lại gây cảm giác như vậy. Sếp có thể cho tôi một ví dụ được không?' },
      { speaker: 'A', textEn: 'On the Alpha project, you made key decisions without consulting the designers.', textVi: 'Trong dự án Alpha, bạn đã đưa ra các quyết định quan trọng mà không tham khảo ý kiến của các nhà thiết kế.' },
      { speaker: 'B', textEn: 'You\'re right, I was trying to move fast, but I should have looped them in. I\'ll fix that.', textVi: 'Sếp nói đúng, tôi đã cố làm nhanh, nhưng lẽ ra tôi nên báo cho họ. Tôi sẽ sửa chữa điều này.' },
      { speaker: 'A', textEn: 'Thank you for taking this constructively. It will make the team stronger.', textVi: 'Cảm ơn bạn đã đón nhận một cách có tính xây dựng. Nó sẽ giúp nhóm mạnh hơn.' }
    ],
    keyVocabulary: [
      {
        term: 'constructive',
        ipa: '/kənˈstrʌk.tɪv/',
        partOfSpeech: 'adj',
        meaningVi: 'có tính xây dựng',
        exampleEn: 'Constructive criticism is always helpful.',
        exampleVi: 'Lời phê bình mang tính xây dựng luôn hữu ích.',
        associatedActions: [
          { en: 'provide actionable tips', vi: 'đưa ra gợi ý mang tính thực tiễn' },
          { en: 'foster mutual growth', vi: 'thúc đẩy sự phát triển đôi bên' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'silo',
        ipa: '/ˈsaɪ.ləʊ/',
        partOfSpeech: 'noun',
        meaningVi: 'sự cô lập (làm việc không giao tiếp)',
        exampleEn: 'Departments should not work in silos.',
        exampleVi: 'Các phòng ban không nên làm việc một cách cô lập.',
        associatedActions: [
          { en: 'break departmental walls', vi: 'phá vỡ rào cản giữa các phòng' },
          { en: 'encourage cross-talk', vi: 'khuyến khích giao tiếp chéo' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'collaborate',
        ipa: '/kəˈlæb.ə.reɪt/',
        partOfSpeech: 'verb',
        meaningVi: 'cộng tác',
        exampleEn: 'We need to collaborate on this task.',
        exampleVi: 'Chúng ta cần hợp tác trong nhiệm vụ này.',
        associatedActions: [
          { en: 'partner across teams', vi: 'hợp tác liên phòng ban' },
          { en: 'co-create solutions', vi: 'cùng nhau tạo ra giải pháp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'consult',
        ipa: '/kənˈsʌlt/',
        partOfSpeech: 'verb',
        meaningVi: 'tham khảo ý kiến',
        exampleEn: 'You should consult a lawyer.',
        exampleVi: 'Bạn nên tham khảo ý kiến luật sư.',
        associatedActions: [
          { en: 'seek expert opinions', vi: 'tìm kiếm ý kiến chuyên gia' },
          { en: 'discuss strategic changes', vi: 'thảo luận thay đổi mang tính chiến lược' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'loop in',
        ipa: '/luːp ɪn/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'cập nhật thông tin cho ai đó',
        exampleEn: 'Please loop me in on the emails.',
        exampleVi: 'Vui lòng đưa tôi vào luồng email để cập nhật.',
        associatedActions: [
          { en: 'copy key stakeholders', vi: 'đính kèm các bên liên quan' },
          { en: 'forward progress summaries', vi: 'chuyển tiếp bản tóm tắt tiến độ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phraseEn: 'I didn\'t realize it came across that way.', phraseVi: 'Tôi không nhận ra nó lại gây cảm giác như vậy.' },
      { phraseEn: 'Could you give me an example?', phraseVi: 'Bạn có thể cho tôi một ví dụ không?' },
      { phraseEn: 'You made decisions without consulting others.', phraseVi: 'Bạn đã đưa ra quyết định mà không tham khảo ý kiến người khác.' },
      { phraseEn: 'I should have looped them in.', phraseVi: 'Lẽ ra tôi nên cập nhật cho họ.' },
      { phraseEn: 'Thank you for taking this constructively.', phraseVi: 'Cảm ơn bạn đã đón nhận một cách có tính xây dựng.' }
    ],
    aiTutorPrompt: 'Roleplay as a manager giving constructive but direct feedback about the user\'s teamwork skills. Let the user respond and explain their side.',
    tags: ['feedback', 'teamwork', 'professionalism']
  }
];
