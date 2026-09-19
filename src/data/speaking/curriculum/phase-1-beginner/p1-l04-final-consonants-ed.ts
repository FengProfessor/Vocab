import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p1L04FinalConsonantsEd: SpeakingCurriculumLesson = {
  id: 'p1-l04-final-consonants-ed',
  phaseId: 'phase-1-beginner',
  order: 4,
  titleEn: 'Final Consonants -ed: /t/, /d/, and /ɪd/',
  titleVi: 'Quy tắc phát âm đuôi Quá khứ -ed: /t/, /d/ và /ɪd/',
  cefrLevel: 'A1',
  targetBandIelts: '0-3.0',
  estimatedMinutes: 15,
  summaryVi:
    'Xóa bỏ thói quen đọc mọi đuôi -ed thành "-địt" bằng 3 quy tắc ngữ âm chuẩn xác kết hợp câu chuyện kể về những việc đã làm hôm qua.',
  category: 'daily_life',
  slug: 'final-consonants-ed',
  learningObjectivesVi: [
    'Nắm vững và áp dụng chuẩn xác 3 quy tắc phát âm đuôi -ed (/t/, /d/, /ɪd/).',
    'Khắc phục triệt để lỗi thêm âm tiết phụ khi phát âm các từ như "worked", "watched", "played".',
    'Kể lại trôi chảy 2-3 hành động đã hoàn thành trong quá khứ bằng thì Quá khứ đơn.',
    'Vượt qua bài đánh giá phản xạ SafeHarbor với điểm số trên 75%.',
  ],
  stage1Phonetics: {
    titleVi: 'Khởi động cơ miệng: 3 Quy tắc vàng phát âm đuôi -ed',
    focusSound: '/-t/, /-d/, /-ɪd/',
    vietnameseContrastiveTip:
      'Người Việt thường đọc dựa trên chữ cái viết (spelling) thay vì âm thanh, dẫn đến việc nhìn thấy "-ed" là đọc thành âm tiết "địt" rời rạc (như "uớc-địt" cho "worked", "play-địt" cho "played"). Trong tiếng Anh:\n1. Phát âm là /-t/ (bật nhẹ luồng hơi qua răng, không thêm âm tiết) sau phụ âm vô thanh: /k, p, f, s, ʃ, tʃ/ (worked, washed, watched, stopped).\n2. Phát âm là /-d/ (rung thanh quản nhẹ, không thêm âm tiết) sau nguyên âm và phụ âm hữu thanh: /b, g, v, z, m, n, l, r/ (played, cleaned, lived, loved).\n3. CHỈ phát âm là /-ɪd/ (thêm 1 âm tiết) khi từ kết thúc bằng âm /t/ hoặc /d/ (wanted, decided, started, needed).',
    category: 'ending-consonants',
    phonemes: ['/t/', '/d/', '/ɪd/'],
    mouthTipVi:
      'Hãy ghi nhớ: "worked" chỉ có 1 âm tiết duy nhất (/wɜːkt/), kết thúc bằng một tiếng bật bật nhẹ của đầu lưỡi ở chân răng trên, không được tách thành hai từ.',
    video: {
      youtubeVideoId: 'j32SurxnE4s',
      channelName: "Rachel's English",
      startSeconds: 35,
      endSeconds: 115,
      title: "How to Pronounce -ED Endings in English - Rachel's English",
      mouthTipSummaryVi:
        'Quan sát cách giáo viên bản ngữ bật âm /t/ dứt khoát sau âm vô thanh và chỉ tăng thêm âm tiết ở các từ kết thúc bằng T hoặc D.',
    },
    targetPracticeWords: [
      { word: 'worked', ipa: '/wɜːkt/', meaningVi: 'đã làm việc' },
      { word: 'watched', ipa: '/wɒtʃt/', meaningVi: 'đã theo dõi, đã xem' },
      { word: 'played', ipa: '/pleɪd/', meaningVi: 'đã chơi' },
      { word: 'cleaned', ipa: '/kliːnd/', meaningVi: 'đã dọn dẹp' },
      { word: 'wanted', ipa: '/ˈwɒntɪd/', meaningVi: 'đã muốn' },
      { word: 'started', ipa: '/ˈstɑːtɪd/', meaningVi: 'đã bắt đầu' },
    ],
    minimalPairs: [
      {
        wordA: 'missed',
        ipaA: '/mɪst/',
        meaningA: 'đã bỏ lỡ',
        wordB: 'mist',
        ipaB: '/mɪst/',
        meaningB: 'màn sương mù',
        distinctionVi: 'đồng âm hoàn toàn, đuôi -ed phát âm là /t/ hòa quyện với /s/',
      },
      {
        wordA: 'passed',
        ipaA: '/pɑːst/',
        meaningA: 'đã vượt qua',
        wordB: 'past',
        ipaB: '/pɑːst/',
        meaningB: 'quá khứ',
        distinctionVi: 'đuôi -ed vô thanh hòa nhập tuyệt đối không tách âm',
      },
      {
        wordA: 'played',
        ipaA: '/pleɪd/',
        meaningA: 'đã chơi',
        wordB: 'plate',
        ipaB: '/pleɪt/',
        meaningB: 'cái đĩa ăn',
        distinctionVi: 'âm hữu thanh rung nhẹ /d/ vs âm vô thanh bật hơi /t/',
      },
      {
        wordA: 'wanted',
        ipaA: '/ˈwɒntɪd/',
        meaningA: 'đã mong muốn',
        wordB: 'waited',
        ipaB: '/ˈweɪtɪd/',
        meaningB: 'đã chờ đợi',
        distinctionVi: 'hai âm tiết với đuôi /-ɪd/ sau âm /t/ rõ ràng',
      },
    ],
    practiceSentences: [
      {
        sentence: 'Yesterday I worked late and called my mother.',
        phoneticTarget: '/t/, /d/',
        vietnameseTranslation: 'Hôm qua tôi làm việc muộn và đã gọi điện cho mẹ tôi.',
      },
      {
        sentence: 'She washed her hands and cleaned the living room.',
        phoneticTarget: '/t/, /d/',
        vietnameseTranslation: 'Cô ấy đã rửa tay và dọn dẹp phòng khách.',
      },
      {
        sentence: 'They wanted to join and started immediately.',
        phoneticTarget: '/ɪd/',
        vietnameseTranslation: 'Họ đã muốn tham gia và đã bắt đầu ngay lập tức.',
      },
    ],
  },
  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: Kể lại hoạt động trong quá khứ',
    vietnameseGrammarRule:
      'Trong tiếng Anh, khi nói về hành động đã diễn ra và chấm dứt trong quá khứ, động từ có quy tắc được thêm đuôi -ed. Cấu trúc cố định: "Yesterday / Last night, I + V-ed + and + V-ed".',
    formula: 'Yesterday, I {verb_ed_1} and then I {verb_ed_2}.',
    overviewVi:
      'Ghi nhớ chuỗi 2 hành động quá khứ giúp bạn luyện tập liền lúc cả âm đuôi /t/ lẫn /d/, tạo phản xạ nối ý tự nhiên.',
    highFrequencyVocab: [
      {
        term: 'yesterday',
        ipa: '/ˈjestədeɪ/',
        partOfSpeech: 'adv',
        meaningVi: 'ngày hôm qua',
        collocationHintVi: 'yesterday evening (tối hôm qua)',
        exampleSentenceEn: 'Yesterday was a very productive day.',
        exampleSentenceVi: 'Ngày hôm qua là một ngày làm việc rất hiệu quả.',
      },
      {
        term: 'worked',
        ipa: '/wɜːkt/',
        partOfSpeech: 'verb',
        meaningVi: 'đã làm việc',
        collocationHintVi: 'worked hard (đã làm việc chăm chỉ)',
        exampleSentenceEn: 'I worked at the office until seven.',
        exampleSentenceVi: 'Tôi đã làm việc tại văn phòng cho tới bảy giờ.',
      },
      {
        term: 'watched',
        ipa: '/wɒtʃt/',
        partOfSpeech: 'verb',
        meaningVi: 'đã xem, đã theo dõi',
        collocationHintVi: 'watched a movie (đã xem một bộ phim)',
        exampleSentenceEn: 'We watched an exciting game last night.',
        exampleSentenceVi: 'Chúng tôi đã xem một trận đấu hấp dẫn tối qua.',
      },
      {
        term: 'finished',
        ipa: '/ˈfɪnɪʃt/',
        partOfSpeech: 'verb',
        meaningVi: 'đã hoàn thành',
        collocationHintVi: 'finished my work (đã hoàn thành công việc của tôi)',
        exampleSentenceEn: 'She finished her report on time.',
        exampleSentenceVi: 'Cô ấy đã hoàn thành báo cáo của mình đúng hạn.',
      },
    ],
    legoSlots: [
      {
        template: 'Yesterday, I worked late and {evening_action}.',
        slots: {
          evening_action: [
            'watched a football match',
            'cleaned my apartment',
            'cooked dinner with my sister',
            'listened to music',
          ],
        },
        examples: [
          {
            en: 'Yesterday, I worked late and watched a football match.',
            vi: 'Hôm qua, tôi làm việc muộn và đã xem một trận bóng đá.',
          },
          {
            en: 'Yesterday, I worked late and cleaned my apartment.',
            vi: 'Hôm qua, tôi làm việc muộn và đã dọn dẹp căn hộ của mình.',
          },
        ],
      },
      {
        template: 'Last weekend, we {weekend_verb_ed} and visited our grandparents.',
        slots: {
          weekend_verb_ed: ['played badminton', 'walked in the park', 'stayed at home'],
        },
        examples: [
          {
            en: 'Last weekend, we played badminton and visited our grandparents.',
            vi: 'Cuối tuần trước, chúng tôi đã chơi cầu lông và đến thăm ông bà.',
          },
          {
            en: 'Last weekend, we walked in the park and visited our grandparents.',
            vi: 'Cuối tuần trước, chúng tôi đã đi dạo trong công viên và đến thăm ông bà.',
          },
        ],
      },
    ],
  },
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại dẫn dắt: Kể về những việc đã làm ngày hôm qua',
    contextVi:
      'Gặp nhau trước giờ làm việc, đồng nghiệp hỏi thăm xem tối hôm qua bạn đã làm gì mà trông có vẻ hơi buồn ngủ.',
    frameworkType: '3-beat',
    turns: [
      {
        speaker: 'Partner',
        en: 'Good morning! Did you have a busy evening yesterday?',
        vi: 'Chào buổi sáng! Tối hôm qua bạn có bận rộn lắm không?',
        coreKeywords: ['morning', 'busy', 'evening', 'yesterday'],
      },
      {
        speaker: 'Learner',
        en: 'Yes, I did. Yesterday I worked late at the office.',
        vi: 'Có chứ. Ngày hôm qua tôi đã làm việc muộn tại văn phòng.',
        coreKeywords: ['yesterday', 'worked', 'late', 'office'],
        suggestedStartersVi: ['Yes, I did...', 'Well, yesterday I worked...'],
      },
      {
        speaker: 'Partner',
        en: 'What time did you finish your work and go home?',
        vi: 'Bạn đã hoàn thành công việc và về nhà lúc mấy giờ vậy?',
        coreKeywords: ['time', 'finish', 'work', 'home'],
      },
      {
        speaker: 'Learner',
        en: 'I finished my project at eight and then I cooked dinner.',
        vi: 'Tôi đã hoàn thành dự án lúc tám giờ và sau đó nấu bữa tối.',
        coreKeywords: ['finished', 'project', 'eight', 'cooked', 'dinner'],
        suggestedStartersVi: ['I finished at...', 'Around eight, I...'],
      },
      {
        speaker: 'Partner',
        en: 'Did you get a chance to relax before going to sleep?',
        vi: 'Bạn có kịp thư giãn chút nào trước khi đi ngủ không?',
        coreKeywords: ['chance', 'relax', 'sleep'],
      },
      {
        speaker: 'Learner',
        en: 'Yes, I watched a football match because it helped me unwind.',
        vi: 'Có, tôi đã xem một trận bóng đá vì nó giúp tôi xả stress.',
        coreKeywords: ['watched', 'football', 'match', 'helped', 'unwind'],
        suggestedStartersVi: ['Yes, I watched...', 'I relaxed by watching...'],
      },
    ],
  },
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Phát âm đuôi -ed chính xác',
    promptVi:
      'Hãy nói câu kể lại việc bạn đã làm việc muộn và xem trận bóng đá hôm qua, đảm bảo phát âm đúng đuôi /t/ ở "worked" và "watched".',
    promptQuestionEn: 'What did you do yesterday evening after leaving the office?',
    targetSentence: 'Yesterday I worked late and watched a football match.',
    targetMeaningVi: 'Hôm qua tôi làm việc muộn và đã xem một trận bóng đá.',
    acceptableVariations: [
      'Yesterday I worked late and watched a match.',
      'Yesterday I worked late and then watched a football match.',
      'Last night I worked late and watched a football match.',
    ],
    coreKeywords: ['yesterday', 'worked', 'late', 'watched', 'football', 'match'],
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
    instructionsVi:
      'Bật âm /t/ dứt khoát ở đuôi từ "worked" và "watched" mà không phát âm thành âm tiết thừa. SafeHarbor sẽ đối chiếu các từ khóa chính xác.',
  },
};
