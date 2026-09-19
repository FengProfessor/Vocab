import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p1L05DescribingObjectsThereIsAre: SpeakingCurriculumLesson = {
  id: 'p1-l05-describing-objects-there-is-are',
  phaseId: 'phase-1-beginner',
  order: 5,
  titleEn: 'Describing Objects & "There is / There are"',
  titleVi: 'Miêu tả đồ vật xung quanh & Cấu trúc "There is / There are"',
  cefrLevel: 'A1',
  targetBandIelts: '0-3.0',
  estimatedMinutes: 15,
  summaryVi:
    'Làm chủ âm rung răng - lưỡi /ð/ trong "There", "this", "that" và phản xạ miêu tả đồ vật xung quanh bằng cấu trúc tồn tại khách quan There is / There are.',
  category: 'daily_life',
  slug: 'describing-objects-there-is-are',
  learningObjectivesVi: [
    'Đặt đúng vị trí đầu lưỡi kẹp giữa hai răng để phát âm chuẩn âm rung /ð/ trong "There", "this", "that".',
    'Khắc phục triệt để thói quen thay âm /ð/ bằng âm /d/ của tiếng Việt.',
    'Phân biệt và sử dụng chính xác cấu trúc "There is" (số ít) và "There are" (số nhiều).',
    'Vượt qua bài kiểm tra phản xạ SafeHarbor với độ chính xác từ khóa đạt từ 75% trở lên.',
  ],
  stage1Phonetics: {
    titleVi: 'Khởi động cơ miệng: Âm rung răng - lưỡi /ð/ trong "There", "This", "That"',
    focusSound: 'Voiced Dental Fricative /ð/ vs /d/',
    vietnameseContrastiveTip:
      'Âm /ð/ hoàn toàn không tồn tại trong hệ thống ngữ âm tiếng Việt. Người học mất gốc thường tự động thay thế bằng âm /d/ (đọc "there" thành "đe", "this" thành "đít", "that" thành "đát").\nCách sửa chuẩn xác: Đưa nhẹ đầu lưỡi thò ra ngoài kẽ giữa hai hàm răng khoảng 0.5cm, khép nhẹ răng lại không cắn quá chặt, sau đó vừa rung mạnh thanh quản cổ họng vừa nhẹ nhàng thụt lưỡi vào trong.',
    category: 'ending-consonants',
    phonemes: ['/ð/', '/d/'],
    mouthTipVi:
      'Hãy nhìn vào gương: bạn phải nhìn thấy đầu lưỡi thò ra giữa hai hàm răng trước khi phát ra âm thanh. Nếu lưỡi vẫn ở trong khoang miệng thì chắc chắn bạn đang nói âm "đ" tiếng Việt.',
    video: {
      youtubeVideoId: 'o3gS8wS4tqE',
      channelName: "Rachel's English",
      startSeconds: 45,
      endSeconds: 120,
      title: "How to Pronounce the Voiced TH Sound - Rachel's English",
      mouthTipSummaryVi:
        'Quan sát chuyển động đầu lưỡi chạm nhẹ vào cạnh dưới của răng cửa hàm trên và độ rung hữu thanh liên tục.',
    },
    targetPracticeWords: [
      { word: 'there', ipa: '/ðeə(r)/', meaningVi: 'ở đó, có (trong There is)' },
      { word: 'this', ipa: '/ðɪs/', meaningVi: 'cái này (ở gần)' },
      { word: 'that', ipa: '/ðæt/', meaningVi: 'cái kia (ở xa)' },
      { word: 'these', ipa: '/ðiːz/', meaningVi: 'những cái này' },
      { word: 'those', ipa: '/ðəʊz/', meaningVi: 'những cái kia' },
      { word: 'other', ipa: '/ˈʌðə(r)/', meaningVi: 'khác, người/vật khác' },
    ],
    minimalPairs: [
      {
        wordA: 'there',
        ipaA: '/ðeə(r)/',
        meaningA: 'ở đó, có',
        wordB: 'dare',
        ipaB: '/deə(r)/',
        meaningB: 'dám làm',
        distinctionVi: 'lưỡi đặt giữa hai răng rung /ð/ vs lưỡi chạm nướu trên bật /d/',
      },
      {
        wordA: 'then',
        ipaA: '/ðen/',
        meaningA: 'sau đó',
        wordB: 'den',
        ipaB: '/den/',
        meaningB: 'hang thú dữ',
        distinctionVi: 'âm răng lưỡi mềm mại vs âm chân răng dứt khoát',
      },
      {
        wordA: 'they',
        ipaA: '/ðeɪ/',
        meaningA: 'bọn họ',
        wordB: 'day',
        ipaB: '/deɪ/',
        meaningB: 'ngày, ban ngày',
        distinctionVi: 'lưỡi lộ ra ngoài kẽ răng vs đầu lưỡi ép chặt vòm miệng',
      },
      {
        wordA: 'breathe',
        ipaA: '/briːð/',
        meaningA: 'hít thở',
        wordB: 'breed',
        ipaB: '/briːd/',
        meaningB: 'chăn nuôi, nòi giống',
        distinctionVi: 'âm ma sát răng lưỡi kéo dài vs âm tắc bật /d/ ở đuôi',
      },
    ],
    practiceSentences: [
      {
        sentence: 'There is a phone and there are two books over there.',
        phoneticTarget: '/ð/',
        vietnameseTranslation: 'Có một chiếc điện thoại và có hai cuốn sách ở đằng kia.',
      },
      {
        sentence: 'This laptop is on that wooden desk.',
        phoneticTarget: '/ð/',
        vietnameseTranslation: 'Chiếc máy tính xách tay này nằm trên chiếc bàn gỗ kia.',
      },
      {
        sentence: 'They put these keys on the table.',
        phoneticTarget: '/ð/',
        vietnameseTranslation: 'Họ đặt những chiếc chìa khóa này trên bàn.',
      },
    ],
  },
  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: Miêu tả đồ vật với "There is / There are"',
    vietnameseGrammarRule:
      'Trong tiếng Anh, để nói "Có cái gì ở đâu", luôn sử dụng: "There is a + [danh từ số ít]" hoặc "There are + [số lượng / danh từ số nhiều]". Kết hợp với các giới từ vị trí cơ bản: on (trên), in (trong), under (dưới), next to (bên cạnh).',
    formula: 'There is a {singular_item} on the {surface} and there are {number} {plural_items}.',
    overviewVi:
      'Khung câu cố định giúp bạn miêu tả đồ vật tức thì mà không cần dịch từ "have" (có) của tiếng Việt gây sai ngữ pháp.',
    highFrequencyVocab: [
      {
        term: 'laptop',
        ipa: '/ˈlæptɒp/',
        partOfSpeech: 'noun',
        meaningVi: 'máy tính xách tay',
        collocationHintVi: 'on my laptop (trên máy tính của tôi)',
        exampleSentenceEn: 'My laptop is brand new.',
        exampleSentenceVi: 'Máy tính xách tay của tôi hoàn toàn mới.',
      },
      {
        term: 'notebook',
        ipa: '/ˈnəʊtbʊk/',
        partOfSpeech: 'noun',
        meaningVi: 'quyển sổ tay ghi chép',
        collocationHintVi: 'a paper notebook (quyển sổ tay giấy)',
        exampleSentenceEn: 'I write ideas in my notebook.',
        exampleSentenceVi: 'Tôi viết các ý tưởng vào sổ tay của mình.',
      },
      {
        term: 'backpack',
        ipa: '/ˈbækpæk/',
        partOfSpeech: 'noun',
        meaningVi: 'ba lô đeo vai',
        collocationHintVi: 'inside my backpack (bên trong ba lô)',
        exampleSentenceEn: 'There are two pens inside my backpack.',
        exampleSentenceVi: 'Có hai cây bút bên trong ba lô của tôi.',
      },
      {
        term: 'bottle',
        ipa: '/ˈbɒtl/',
        partOfSpeech: 'noun',
        meaningVi: 'chai, bình nước',
        collocationHintVi: 'a bottle of water (một chai nước)',
        exampleSentenceEn: 'There is a water bottle on the shelf.',
        exampleSentenceVi: 'Có một bình nước trên giá sách.',
      },
    ],
    legoSlots: [
      {
        template: 'There is a {item} on the table.',
        slots: {
          item: ['laptop', 'phone', 'notebook', 'water bottle'],
        },
        examples: [
          {
            en: 'There is a laptop on the table.',
            vi: 'Có một chiếc máy tính xách tay trên bàn.',
          },
          {
            en: 'There is a phone on the table.',
            vi: 'Có một chiếc điện thoại trên bàn.',
          },
        ],
      },
      {
        template: 'There are {count} {items_plural} in the backpack.',
        slots: {
          count: ['two', 'three', 'many'],
          items_plural: ['books', 'pens', 'keys', 'documents'],
        },
        examples: [
          {
            en: 'There are two books in the backpack.',
            vi: 'Có hai cuốn sách ở trong ba lô.',
          },
          {
            en: 'There are three pens in the backpack.',
            vi: 'Có ba cây bút ở trong ba lô.',
          },
        ],
      },
    ],
  },
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại dẫn dắt: Nhận bàn làm việc ngày đầu đi làm',
    contextVi:
      'Trong ngày đầu tiên nhận việc tại văn phòng, bạn được người hướng dẫn (Emma) dẫn đến bàn làm việc và kiểm tra các trang thiết bị có sẵn.',
    frameworkType: '3-beat',
    turns: [
      {
        speaker: 'Partner',
        en: 'Welcome to our team! This is your new working desk. Can you check what is on it?',
        vi: 'Chào mừng bạn đến với đội ngũ! Đây là bàn làm việc mới của bạn. Bạn hãy kiểm tra xem có những gì trên bàn nhé?',
        coreKeywords: ['welcome', 'team', 'desk', 'check'],
      },
      {
        speaker: 'Learner',
        en: 'Thank you! There is a laptop on the table and there are two books.',
        vi: 'Cảm ơn bạn! Có một chiếc máy tính xách tay trên bàn và có hai cuốn sổ.',
        coreKeywords: ['thank', 'there', 'is', 'laptop', 'table', 'are', 'books'],
        suggestedStartersVi: ['Thank you! There is a...', 'On the desk, there is...'],
      },
      {
        speaker: 'Partner',
        en: 'Great! Is there a mouse and a keyboard ready for you?',
        vi: 'Tuyệt vời! Đã có chuột máy tính và bàn phím sẵn sàng cho bạn chưa?',
        coreKeywords: ['great', 'mouse', 'keyboard', 'ready'],
      },
      {
        speaker: 'Learner',
        en: 'Yes, there is a wireless mouse next to the keyboard.',
        vi: 'Có rồi, có một chú chuột không dây nằm cạnh bàn phím.',
        coreKeywords: ['yes', 'there', 'is', 'mouse', 'keyboard'],
        suggestedStartersVi: ['Yes, there is a...', 'Next to the laptop, there is...'],
      },
      {
        speaker: 'Partner',
        en: 'Do you need any stationary items like pens or sticky notes?',
        vi: 'Bạn có cần thêm văn phòng phẩm như bút viết hay giấy ghi chú không?',
        coreKeywords: ['need', 'pens', 'sticky', 'notes'],
      },
      {
        speaker: 'Learner',
        en: 'There are three pens in my backpack, so I am all set.',
        vi: 'Có ba cây bút trong ba lô của tôi rồi, nên tôi đã chuẩn bị đầy đủ.',
        coreKeywords: ['there', 'are', 'three', 'pens', 'backpack', 'set'],
        suggestedStartersVi: ['There are some...', 'I already have...'],
      },
    ],
  },
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Miêu tả đồ vật chính xác',
    promptVi:
      'Hãy nói câu miêu tả có một máy tính trên bàn và hai cuốn sách, chú ý phát âm âm /ð/ trong "There" rõ ràng.',
    promptQuestionEn: 'What items can you see currently placed on your working table?',
    targetSentence: 'There is a laptop on the table and there are two books.',
    targetMeaningVi: 'Có một chiếc máy tính xách tay trên bàn và có hai cuốn sách.',
    acceptableVariations: [
      'There is a laptop on the desk and there are two books.',
      'There is a laptop on the table, and there are two notebooks.',
      'On the table, there is a laptop and there are two books.',
    ],
    coreKeywords: ['there', 'is', 'laptop', 'table', 'are', 'two', 'books'],
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
    instructionsVi:
      'Kẹp nhẹ lưỡi giữa hai răng để phát âm âm rung /ð/ trong "There". SafeHarbor sẽ lắng nghe sự phân biệt giữa "There is" và "There are".',
  },
};
