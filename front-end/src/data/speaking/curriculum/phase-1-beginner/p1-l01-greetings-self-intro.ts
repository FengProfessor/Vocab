import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p1L01GreetingsSelfIntro: SpeakingCurriculumLesson = {
  id: 'p1-l01-greetings-self-intro',
  phaseId: 'phase-1-beginner',
  order: 1,
  titleEn: 'Greetings & Self-Introduction',
  titleVi: 'Chào hỏi & Giới thiệu bản thân căn bản',
  cefrLevel: 'A1',
  targetBandIelts: '0-3.0',
  estimatedMinutes: 15,
  summaryVi:
    'Làm chủ phản xạ giới thiệu họ tên, quê quán, nghề nghiệp và tuổi tác với các phụ âm mũi cuối /m/, /n/, /ŋ/ chuẩn xác, không bị nuốt âm.',
  category: 'social_chat',
  slug: 'greetings-self-intro',
  learningObjectivesVi: [
    'Phát âm chuẩn xác các âm mũi cuối /m/, /n/, /ŋ/ trong tên riêng và danh từ thông dụng.',
    'Sử dụng thành thạo khung câu bất biến giới thiệu bản thân trong dưới 1 giây.',
    'Hoàn thành hội thoại chào hỏi xã giao tự nhiên với người nước ngoài tại quán cafe.',
    'Vượt qua bài kiểm tra phản xạ SafeHarbor với điểm số từ 75% trở lên.',
  ],
  stage1Phonetics: {
    titleVi: 'Khởi động cơ miệng: Âm mũi cuối /m/, /n/, /ŋ/',
    focusSound: '/m/, /n/, /ŋ/',
    vietnameseContrastiveTip:
      'Người Việt thường có thói quen nuốt phụ âm đuôi hoặc ngậm chặt miệng làm nghẽn âm. Trong tiếng Anh: với âm /m/ hai môi khép nhẹ cho luồng hơi thoát đều qua khoang mũi (name, from); với âm /n/ đầu lưỡi chạm vào vòm lợi răng trên (ten, fine); với âm /ŋ/ phần cuống lưỡi nâng chạm ngạc mềm phía sau (king, morning).',
    category: 'ending-consonants',
    phonemes: ['/m/', '/n/', '/ŋ/'],
    mouthTipVi:
      'Giữ khẩu hình ở vị trí kết thúc thêm 0.5 giây để cảm nhận độ rung nhẹ trong xoang mũi, tuyệt đối không nuốt âm làm mất nghĩa của từ.',
    video: {
      youtubeVideoId: 'scCesnn-0XY',
      channelName: "Rachel's English",
      startSeconds: 25,
      endSeconds: 95,
      title: 'How to Pronounce Nasal Sounds M, N, NG',
      mouthTipSummaryVi:
        'Quan sát độ rung xoang mũi và vị trí hạ hàm tự nhiên của giáo viên bản ngữ khi phát âm các âm mũi.',
    },
    targetPracticeWords: [
      { word: 'name', ipa: '/neɪm/', meaningVi: 'tên gọi' },
      { word: 'from', ipa: '/frɒm/', meaningVi: 'đến từ' },
      { word: 'ten', ipa: '/ten/', meaningVi: 'số mười' },
      { word: 'nine', ipa: '/naɪn/', meaningVi: 'số chín' },
      { word: 'morning', ipa: '/ˈmɔːnɪŋ/', meaningVi: 'buổi sáng' },
      { word: 'English', ipa: '/ˈɪŋɡlɪʃ/', meaningVi: 'tiếng Anh' },
    ],
    minimalPairs: [
      {
        wordA: 'sum',
        ipaA: '/sʌm/',
        meaningA: 'tổng số',
        wordB: 'sun',
        ipaB: '/sʌn/',
        meaningB: 'mặt trời',
        distinctionVi: '/m/ khép hai mép môi vs /n/ đầu lưỡi áp vào chân răng trên',
      },
      {
        wordA: 'rum',
        ipaA: '/rʌm/',
        meaningA: 'rượu rum',
        wordB: 'run',
        ipaB: '/rʌn/',
        meaningB: 'chạy bộ',
        distinctionVi: 'môi khép lại ở đuôi vs lưỡi chặn luồng khí ở vòm miệng',
      },
      {
        wordA: 'sin',
        ipaA: '/sɪn/',
        meaningA: 'tội lỗi',
        wordB: 'sing',
        ipaB: '/sɪŋ/',
        meaningB: 'ca hát',
        distinctionVi: '/n/ đầu lưỡi chạm vòm trên vs /ŋ/ cuống lưỡi chạm ngạc mềm',
      },
      {
        wordA: 'thin',
        ipaA: '/θɪn/',
        meaningA: 'gầy mảnh',
        wordB: 'thing',
        ipaB: '/θɪŋ/',
        meaningB: 'sự vật',
        distinctionVi: 'âm n nhả nhẹ qua kẽ răng vs âm ng ngân trong cổ họng',
      },
    ],
    practiceSentences: [
      {
        sentence: 'My name is Nam and I am from Vietnam.',
        phoneticTarget: '/m/, /n/',
        vietnameseTranslation: 'Tên tôi là Nam và tôi đến từ Việt Nam.',
      },
      {
        sentence: 'Good morning, nice to meet you again.',
        phoneticTarget: '/ŋ/, /n/',
        vietnameseTranslation: 'Chào buổi sáng, rất vui được gặp lại bạn.',
      },
      {
        sentence: 'I am learning English online every morning.',
        phoneticTarget: '/ŋ/, /n/',
        vietnameseTranslation: 'Tôi đang học tiếng Anh trực tuyến mỗi sáng.',
      },
    ],
  },
  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: Giới thiệu thông tin cá nhân',
    vietnameseGrammarRule:
      'Sử dụng động từ "to be" (am/is/are) để giới thiệu danh tính và nguồn gốc. Không cần chia thì phức tạp, hãy ghi nhớ khối câu cố định "My name is..." và "I am from..." để bật ra tự động.',
    formula: 'Hello, my name is {name}. I am from {origin} and I live in {city}.',
    overviewVi:
      'Khung câu bất biến giúp bạn vượt qua rào cản dịch thầm, chỉ cần thay đổi từ khóa tên riêng hoặc địa danh.',
    highFrequencyVocab: [
      {
        term: 'introduce',
        ipa: '/ˌɪntrəˈdjuːs/',
        partOfSpeech: 'verb',
        meaningVi: 'giới thiệu',
        collocationHintVi: 'Let me introduce myself (Cho phép tôi tự giới thiệu)',
        exampleSentenceEn: 'Please allow me to introduce myself.',
        exampleSentenceVi: 'Xin cho phép tôi được tự giới thiệu bản thân.',
      },
      {
        term: 'hometown',
        ipa: '/ˈhəʊmtaʊn/',
        partOfSpeech: 'noun',
        meaningVi: 'quê hương, quê nhà',
        collocationHintVi: 'my beautiful hometown (quê hương tươi đẹp của tôi)',
        exampleSentenceEn: 'Da Nang is my peaceful hometown.',
        exampleSentenceVi: 'Đà Nẵng là quê hương yên bình của tôi.',
      },
      {
        term: 'pleasure',
        ipa: '/ˈpleʒə(r)/',
        partOfSpeech: 'noun',
        meaningVi: 'niềm vinh hạnh',
        collocationHintVi: 'It is a pleasure to meet you (Rất vinh hạnh được gặp bạn)',
        exampleSentenceEn: 'It is a great pleasure to meet you today.',
        exampleSentenceVi: 'Thật là một niềm vinh hạnh lớn khi được gặp bạn hôm nay.',
      },
      {
        term: 'occupation',
        ipa: '/ˌɒkjuˈpeɪʃn/',
        partOfSpeech: 'noun',
        meaningVi: 'nghề nghiệp',
        collocationHintVi: 'current occupation (nghề nghiệp hiện tại)',
        exampleSentenceEn: 'My current occupation is an English teacher.',
        exampleSentenceVi: 'Nghề nghiệp hiện tại của tôi là giáo viên tiếng Anh.',
      },
    ],
    legoSlots: [
      {
        template: 'Hello, my name is {name}. I am from {origin}.',
        slots: {
          name: ['Nam', 'Linh', 'Minh', 'Hoa'],
          origin: ['Hanoi', 'Da Nang', 'Ho Chi Minh City', 'Can Tho'],
        },
        examples: [
          {
            en: 'Hello, my name is Nam. I am from Hanoi.',
            vi: 'Xin chào, tên tôi là Nam. Tôi đến từ Hà Nội.',
          },
          {
            en: 'Hello, my name is Linh. I am from Da Nang.',
            vi: 'Xin chào, tên tôi là Linh. Tôi đến từ Đà Nẵng.',
          },
          {
            en: 'Hello, my name is Minh. I am from Ho Chi Minh City.',
            vi: 'Xin chào, tên tôi là Minh. Tôi đến từ Thành phố Hồ Chí Minh.',
          },
        ],
      },
      {
        template: 'I am {age} years old and I work as a {occupation}.',
        slots: {
          age: ['twenty', 'twenty-five', 'twenty-eight', 'thirty'],
          occupation: ['teacher', 'software engineer', 'accountant', 'designer'],
        },
        examples: [
          {
            en: 'I am twenty-five years old and I work as a software engineer.',
            vi: 'Tôi hai mươi lăm tuổi và làm kỹ sư phần mềm.',
          },
          {
            en: 'I am twenty-eight years old and I work as an accountant.',
            vi: 'Tôi hai mươi tám tuổi và làm kế toán.',
          },
        ],
      },
    ],
  },
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại dẫn dắt: Gặp gỡ bạn mới tại quán cafe',
    contextVi:
      'Bạn đang ngồi đọc sách tại một quán cafe ở trung tâm thành phố. John - một chuyên gia nước ngoài thân thiện - bước đến và ngỏ ý muốn ngồi cùng bàn.',
    frameworkType: '3-beat',
    turns: [
      {
        speaker: 'Partner',
        en: 'Hi there! Excuse me, is anyone sitting here? May I join you?',
        vi: 'Xin chào! Xin lỗi, chỗ này có ai ngồi chưa ạ? Tôi có thể ngồi cùng bạn được không?',
        coreKeywords: ['hi', 'sitting', 'join'],
      },
      {
        speaker: 'Learner',
        en: 'Hello! Please have a seat. No one is sitting here.',
        vi: 'Xin chào! Xin mời bạn ngồi. Ở đây không có ai ngồi cả.',
        coreKeywords: ['hello', 'seat', 'sitting'],
        suggestedStartersVi: ['Hello, please...', 'Sure, you can...'],
      },
      {
        speaker: 'Partner',
        en: 'Thank you so much! By the way, my name is John. Nice to meet you!',
        vi: 'Cảm ơn bạn rất nhiều! Nhân tiện, tôi tên là John. Rất vui được gặp bạn!',
        coreKeywords: ['thank', 'name', 'John', 'nice', 'meet'],
      },
      {
        speaker: 'Learner',
        en: 'Nice to meet you too, John. My name is Nam and I come from Hanoi.',
        vi: 'Rất vui được gặp bạn, John. Tên tôi là Nam và tôi đến từ Hà Nội.',
        coreKeywords: ['nice', 'meet', 'Nam', 'come', 'Hanoi'],
        suggestedStartersVi: ['Nice to meet you too...', 'My name is...'],
      },
      {
        speaker: 'Partner',
        en: 'Hanoi is wonderful! What do you do for a living here?',
        vi: 'Hà Nội thật tuyệt vời! Bạn đang làm nghề gì ở đây vậy?',
        coreKeywords: ['Hanoi', 'wonderful', 'do', 'living'],
      },
      {
        speaker: 'Learner',
        en: 'I work as a software engineer in Hanoi because I love technology.',
        vi: 'Tôi làm kỹ sư phần mềm tại Hà Nội vì tôi rất yêu thích công nghệ.',
        coreKeywords: ['work', 'software', 'engineer', 'Hanoi', 'technology'],
        suggestedStartersVi: ['I work as a...', 'I am working...'],
      },
    ],
  },
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Giới thiệu danh tính',
    promptVi: 'Hãy nói một câu tự giới thiệu họ tên và quê quán của bạn trong vòng 1.5 giây.',
    promptQuestionEn: 'Could you please introduce your name and where you come from?',
    targetSentence: 'Hello, my name is Nam and I come from Hanoi.',
    targetMeaningVi: 'Xin chào, tên tôi là Nam và tôi đến từ Hà Nội.',
    acceptableVariations: [
      'Hi, my name is Nam and I am from Hanoi.',
      'Hello, I am Nam and I come from Hanoi.',
      'Hi there, my name is Nam and I live in Hanoi.',
      'Hello, my name is Nam and I am living in Hanoi.',
    ],
    coreKeywords: ['name', 'Nam', 'come', 'from', 'Hanoi'],
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
    instructionsVi:
      'Nhấn nút micro và nói to, rõ ràng. Bộ so khớp SafeHarbor tự động nhận diện các từ khóa nội dung và bỏ qua các mạo từ hoặc từ đệm phụ.',
  },
};
