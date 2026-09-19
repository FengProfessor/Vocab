/**
 * LingoPro Speaking Curriculum - Phase 2: Elementary (A2-B1 / 3.0-5.0 IELTS)
 * Lesson P2-L04: Expressing Future Intentions & Ambitions
 * File: src/data/speaking/curriculum/phase-2-elementary/p2-l04-future-intentions-going-to.ts
 */

import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p2L04Lesson: SpeakingCurriculumLesson = {
  id: 'p2-l04-future-intentions-going-to',
  phaseId: 'phase-2-elementary',
  order: 4,
  titleEn: 'Expressing Future Intentions & Ambitions',
  titleVi: 'Bày tỏ dự định tương lai với "Be going to" & "Will"',
  cefrLevel: 'A2',
  targetBandIelts: '3.5-4.5',
  estimatedMinutes: 25,
  summaryVi:
    'Làm chủ sự phân hóa giữa dự định có kế hoạch từ trước (Be going to) và quyết định tức thời / dự đoán tương lai (Will), cùng kỹ thuật nuốt âm tự nhiên "going to" thành "gonna" trong giao tiếp.',
  category: 'workplace',
  learningObjectivesVi: [
    'Phân biệt rành mạch khi nào dùng "be going to" (kế hoạch đã sắp đặt) và "will" (lời hứa hoặc dự đoán chủ quan).',
    'Nắm bắt dạng phát âm rút gọn tự nhiên: "going to" -> /ˈɡənə/ và các đuôi co thắt "I\'ll" (/aɪl/), "We\'ll" (/wiːl/).',
    'Xây dựng lộ trình phát triển bản thân bằng các từ vựng nghề nghiệp: milestone, promotion, career path, certificate.',
    'Trình bày một bài nói 60-90 giây mạch lạc về kế hoạch học tập hoặc mục tiêu sự nghiệp trong 3-5 năm tới.',
  ],

  // ── Stage 1: Phonetics Drill ───────────────────────────────────────────────
  stage1Phonetics: {
    titleVi: 'Kỹ thuật rút gọn "going to" -> /ɡənə/ & Co thắt Modal "I\'ll"',
    focusSound: '/ˈɡənə/ & /aɪl/ - Phát âm tự nhiên các dạng nói tương lai',
    vietnameseContrastiveTip:
      'Người học Việt Nam hay đọc từng từ cứng nhắc "I - am - go-ing - to - do" khiến nhịp điệu câu bị gượng gạo. Trong văn nói đời thường chuẩn quốc tế, "going to + V" thường được giản lược thành /ˈɡənə/ (gonna). Tương tự, "I will" co lại thành /aɪl/ với âm /l/ tối (dark L) chạm đầu lưỡi vào vòm lợi trên.',
    category: 'stress-linking',
    mouthTipVi:
      'Để phát âm /ˈɡənə/, hãy thả lỏng cơ miệng hoàn toàn, phát âm như "gơ-nơ" lướt nhanh trong 0.2 giây mà không nhấn trọng âm. Với "I\'ll", phát âm /aɪ/ rồi trượt đầu lưỡi nhẹ lên vòm răng trên.',
    minimalPairs: [
      {
        wordA: "I'll",
        ipaA: '/aɪl/',
        wordB: 'aisle',
        ipaB: '/aɪl/',
        meaningA: 'tôi sẽ (viết tắt)',
        meaningB: 'lối đi giữa hai hàng ghế',
        distinctionVi: 'Hai từ là đồng âm (homophones), phát âm lướt nhanh với âm /l/ mềm mại.',
      },
      {
        wordA: "he'll",
        ipaA: '/hiːl/',
        wordB: 'hill',
        ipaB: '/hɪl/',
        meaningA: 'anh ấy sẽ',
        meaningB: 'ngọn đồi',
        distinctionVi: "he'll có nguyên âm /iː/ căng dài cười tươi, hill có âm /ɪ/ ngắn thả lỏng.",
      },
      {
        wordA: "we'll",
        ipaA: '/wiːl/',
        wordB: 'wheel',
        ipaB: '/wiːl/',
        meaningA: 'chúng tôi sẽ',
        meaningB: 'bánh xe',
        distinctionVi: 'Đồng âm, phát âm tròn môi /w/ rồi kéo dài /iː/ chạm nhẹ /l/.',
      },
      {
        wordA: 'gonna',
        ipaA: '/ˈɡən.ə/',
        wordB: 'gunner',
        ipaB: '/ˈɡʌn.ər/',
        meaningA: 'dự định sẽ (going to)',
        meaningB: 'pháo thủ',
        distinctionVi: 'gonna kết thúc bằng âm schwa /ə/ nhẹ, gunner uốn lưỡi âm /ər/.',
      },
    ],
    practiceSentences: [
      {
        sentence: "I am going to enroll in an advanced English course next month.",
        phoneticTarget: "aɪm ˈɡənə ɪnˈroʊl ɪn ən‿ədˈvænst ˈɪŋɡlɪʃ kɔːrs nekst mʌnθ",
        vietnameseTranslation: 'Tôi dự định sẽ đăng ký một khóa học tiếng Anh nâng cao vào tháng tới.',
      },
      {
        sentence: "If I pass this interview, I will celebrate with my colleagues.",
        phoneticTarget: "ɪf aɪ pæs ðɪs ˈɪntərvjuː, aɪl ˈseləbreɪt wɪð maɪ ˈkɑːliːɡz",
        vietnameseTranslation: 'Nếu tôi vượt qua buổi phỏng vấn này, tôi sẽ ăn mừng cùng đồng nghiệp.',
      },
      {
        sentence: "We are going to launch the new software project in December.",
        phoneticTarget: "wɪr ˈɡənə lɔːntʃ ðə nuː ˈsɔːftwer ˈprɑːdʒekt ɪn dɪˈsembər",
        vietnameseTranslation: 'Chúng tôi dự định sẽ khởi động dự án phần mềm mới vào tháng Mười Hai.',
      },
    ],
  },

  // ── Stage 2: Core Patterns & Lexical Chunks ────────────────────────────────
  stage2CorePatterns: {
    titleVi: 'Khung cấu trúc hoạch định mục tiêu & Dự định tương lai',
    vietnameseGrammarRule:
      'Quy tắc ngữ pháp cốt lõi: 1) "Be going to + V" dùng khi nói về một quyết định đã được lên kế hoạch cụ thể từ trước thời điểm nói. 2) "Will + V" dùng cho quyết định nảy sinh ngay lúc nói, lời hứa hẹn hoặc phỏng đoán tương lai kèm theo "I think / I hope / Probably". Khi nói về sự nghiệp, hãy kết hợp cả hai: Bắt đầu bằng kế hoạch chắc chắn ("I am going to..."), sau đó mở rộng bằng kỳ vọng ("Hopefully, I will...").',
    formula:
      'My primary ambition is to [Target Goal]. To achieve this, I am going to [Action Plan]. In the long run, I believe I will [Future Achievement].',
    legoSlots: [
      {
        template:
          'In the next {time_horizon}, my ultimate ambition is to {career_goal}. To achieve this, I am going to {immediate_plan} because I want to {reason}. If everything goes according to plan, I will {long_term_outcome}.',
        slots: {
          time_horizon: [
            'two to three years',
            'six months',
            'five years',
            'twelve months',
          ],
          career_goal: [
            'get promoted to a senior managerial position',
            'obtain an international professional certificate',
            'transition into the artificial intelligence industry',
            'launch my own independent creative studio',
          ],
          immediate_plan: [
            'dedicate two hours every single evening to studying data analytics',
            'participate in cross-functional projects at my current company',
            'find a seasoned industry mentor to guide my career decisions',
            'build a strong personal portfolio on GitHub and LinkedIn',
          ],
          reason: [
            'sharpen my practical skills and stand out in the competitive job market',
            'broaden my professional network and gain hands-on leadership experience',
            'avoid common career pitfalls and accelerate my learning curve',
            'demonstrate concrete value to potential international clients',
          ],
          long_term_outcome: [
            'hopefully secure a well-compensated leadership role with flexible hours',
            'definitely double my current income and lead a team of talented engineers',
            'have the freedom to work remotely from anywhere in the world',
            'contribute meaningfully to high-impact technological solutions',
          ],
        },
        examples: [
          {
            en: 'In the next two to three years, my ultimate ambition is to get promoted to a senior managerial position. To achieve this, I am going to participate in cross-functional projects at my current company because I want to broaden my professional network and gain hands-on leadership experience. If everything goes according to plan, I will hopefully secure a well-compensated leadership role with flexible hours.',
            vi: 'Trong 2 đến 3 năm tới, khát vọng lớn nhất của tôi là được thăng chức lên vị trí quản lý cấp cao. Để đạt được điều này, tôi dự định tham gia vào các dự án liên phòng ban tại công ty hiện tại vì tôi muốn mở rộng mạng lưới quan hệ chuyên nghiệp và tích lũy kinh nghiệm lãnh đạo thực chiến. Nếu mọi việc diễn ra đúng kế hoạch, tôi hy vọng sẽ đảm nhận được một vị trí lãnh đạo với mức đãi ngộ tốt cùng thời gian làm việc linh hoạt.',
          },
          {
            en: 'In the next twelve months, my ultimate ambition is to transition into the artificial intelligence industry. To achieve this, I am going to dedicate two hours every single evening to studying data analytics because I want to sharpen my practical skills and stand out in the competitive job market. If everything goes according to plan, I will definitely double my current income and lead a team of talented engineers.',
            vi: 'Trong 12 tháng tới, mục tiêu tối thượng của tôi là chuyển dịch sang ngành công nghiệp trí tuệ nhân tạo. Để hiện thực hóa điều đó, tôi dự định dành 2 tiếng mỗi tối để học phân tích dữ liệu vì tôi muốn mài giũa kỹ năng thực hành và nổi bật trên thị trường lao động đầy cạnh tranh. Nếu mọi việc suôn sẻ, tôi tin chắc mình sẽ nâng gấp đôi thu nhập hiện tại và lãnh đạo một đội ngũ kỹ sư tài năng.',
          },
        ],
      },
    ],
    highFrequencyVocab: [
      {
        term: 'ambition',
        ipa: '/æmˈbɪʃ.ən/',
        partOfSpeech: 'noun',
        meaningVi: 'hoài bão, khát vọng lớn',
        collocationHintVi: 'lifelong ambition / career ambition / burning ambition',
        exampleSentenceEn: 'Her lifelong ambition was to start an educational non-profit organization.',
        exampleSentenceVi: 'Khát vọng cả đời của cô ấy là thành lập một tổ chức giáo dục phi lợi nhuận.',
      },
      {
        term: 'career path',
        ipa: '/kəˈrɪr pæθ/',
        partOfSpeech: 'noun',
        meaningVi: 'con đường sự nghiệp, lộ trình công danh',
        collocationHintVi: 'choose a career path / advance along one’s career path',
        exampleSentenceEn: 'Software engineering offers a very clear and flexible career path.',
        exampleSentenceVi: 'Ngành kỹ thuật phần mềm mang lại một lộ trình sự nghiệp rất rõ ràng và linh hoạt.',
      },
      {
        term: 'milestone',
        ipa: '/ˈmaɪl.stoʊn/',
        partOfSpeech: 'noun',
        meaningVi: 'cột mốc quan trọng, bước ngoặt',
        collocationHintVi: 'reach a milestone / major milestone',
        exampleSentenceEn: 'Passing the IELTS exam was a major milestone in my overseas study journey.',
        exampleSentenceVi: 'Vượt qua kỳ thi IELTS là một cột mốc trọng đại trong hành trình du học của tôi.',
      },
      {
        term: 'promotion',
        ipa: '/prəˈmoʊ.ʃən/',
        partOfSpeech: 'noun',
        meaningVi: 'sự thăng chức, đề bạt',
        collocationHintVi: 'earn a promotion / deserve a promotion',
        exampleSentenceEn: 'He worked exceptionally hard to earn a well-deserved promotion to team lead.',
        exampleSentenceVi: 'Anh ấy đã làm việc vô cùng chăm chỉ để nhận được sự thăng chức xứng đáng lên vị trí trưởng nhóm.',
      },
    ],
  },

  // ── Stage 3: Guided Dialogue ───────────────────────────────────────────────
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại tương tác: Thảo luận về Kế hoạch tương lai 3 năm tới',
    contextVi:
      'Người phỏng vấn / Quản lý (Partner) hỏi nhân viên (Learner) về định hướng phát triển bản thân trong buổi đánh giá định kỳ. Learner trình bày mục tiêu tự tin và có lộ trình cụ thể.',
    frameworkType: 'peel',
    turns: [
      {
        speaker: 'Partner',
        en: 'Where do you see yourself in the next three years? Do you have any specific plans?',
        vi: 'Bạn hình dung bản thân ở đâu trong ba năm tới? Bạn đã có kế hoạch cụ thể nào chưa?',
        coreKeywords: ['next three years', 'specific plans'],
      },
      {
        speaker: 'Learner',
        en: 'Yes, absolutely. My ultimate ambition is to become a senior project manager in our technology division.',
        vi: 'Vâng, chắc chắn rồi ạ. Mục tiêu tối thượng của tôi là trở thành một giám đốc dự án cấp cao trong khối công nghệ của chúng ta.',
        coreKeywords: ['ultimate ambition', 'senior project manager'],
        suggestedStartersVi: ['Yes, absolutely. My ultimate ambition is to...'],
      },
      {
        speaker: 'Partner',
        en: 'That is a great ambition. How are you going to make that happen?',
        vi: 'Đó là một khát vọng tuyệt vời. Bạn dự định sẽ hiện thực hóa điều đó như thế nào?',
        coreKeywords: ['great ambition', 'make that happen'],
      },
      {
        speaker: 'Learner',
        en: 'To prepare, I am going to enroll in a PMP certification course this November and practice managing small agile teams.',
        vi: 'Để chuẩn bị, tôi dự định sẽ tham gia một khóa học chứng chỉ PMP vào tháng 11 này và thực hành quản lý các đội ngũ agile quy mô nhỏ.',
        coreKeywords: ['I am going to enroll', 'certification course', 'practice managing'],
        suggestedStartersVi: ['To prepare, I am going to...'],
      },
      {
        speaker: 'Partner',
        en: 'Sounds very realistic. What kind of impact do you hope to deliver?',
        vi: 'Nghe rất thực tế. Bạn kỳ vọng sẽ mang lại tầm ảnh hưởng như thế nào?',
        coreKeywords: ['realistic', 'deliver impact'],
      },
      {
        speaker: 'Learner',
        en: 'If everything goes as expected, I will streamline our deployment workflows and reduce project delivery times by twenty percent.',
        vi: 'Nếu mọi việc diễn ra như kỳ vọng, tôi sẽ tối ưu hóa quy trình triển khai và rút ngắn 20% thời gian bàn giao dự án.',
        coreKeywords: ['If everything goes', 'I will streamline', 'reduce delivery times'],
        suggestedStartersVi: ['If everything goes as expected, I will...'],
      },
    ],
  },

  // ── Stage 4: SafeHarbor Evaluation ────────────────────────────────────────
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Trình bày kế hoạch tương lai 60s',
    promptVi:
      'Trình bày kế hoạch 3 năm tới của bản thân, kết hợp hài hòa "I am going to [hành động cụ thể]" và "I will [kết quả/kỳ vọng]", nhấn mạnh ít nhất 2 từ vựng nghề nghiệp (ambition, milestone, promotion, career path).',
    promptQuestionEn: 'What are your major plans and ambitions for the next few years?',
    targetSentence:
      'My ultimate ambition is to advance along my career path and earn a promotion. In the coming year, I am going to take an intensive certification program. By achieving this milestone, I believe I will lead international projects successfully.',
    acceptableVariations: [
      'In the next three years, my goal is to switch into digital marketing. To achieve this, I am going to take specialized online courses every weekend. If I work hard, I will build an impressive portfolio and land my dream job.',
      'My plan for the near future is to improve my English proficiency. I am going to practice speaking forty minutes every day. Once I reach an IELTS band 6.5, I will apply for a master scholarship abroad.',
    ],
    coreKeywords: [
      'ambition',
      'going to',
      'promotion',
      'career path',
      'will',
      'milestone',
    ],
    targetMeaningVi:
      'Khát vọng tối thượng của tôi là tiến xa trên con đường sự nghiệp và giành được sự thăng chức. Trong năm tới, tôi dự định tham gia một chương trình chứng chỉ chuyên sâu. Bằng cách chạm tới cột mốc này, tôi tin mình sẽ lãnh đạo thành công các dự án quốc tế.',
    instructionsVi:
      'Nói mượt mà, áp dụng nối âm "going to" (/ˈɡənə/) hoặc "I will" (/aɪl/). Trả lời hoàn chỉnh trong vòng 60 giây, đạt tối thiểu 75 điểm.',
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
  },
};
