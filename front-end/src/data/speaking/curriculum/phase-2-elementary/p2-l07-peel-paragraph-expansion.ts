/**
 * LingoPro Speaking Curriculum - Phase 2: Elementary (A2-B1 / 3.0-5.0 IELTS)
 * Lesson P2-L07: PEEL Paragraph Expansion Technique
 * File: src/data/speaking/curriculum/phase-2-elementary/p2-l07-peel-paragraph-expansion.ts
 */

import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p2L07Lesson: SpeakingCurriculumLesson = {
  id: 'p2-l07-peel-paragraph-expansion',
  phaseId: 'phase-2-elementary',
  order: 7,
  titleEn: 'PEEL Paragraph Expansion Technique',
  titleVi: 'Kỹ thuật mở rộng đoạn nói PEEL (Point - Explanation - Evidence - Link)',
  cefrLevel: 'B1',
  targetBandIelts: '4.0-5.0',
  estimatedMinutes: 30,
  summaryVi:
    'Làm chủ khung 4 bước PEEL tiêu chuẩn học thuật quốc tế (Luận điểm -> Cơ chế giải thích -> Bằng chứng thực tế -> Liên kết tổng kết) kết hợp kỹ thuật phân nhóm hơi (Thought Group Chunking) để trả lời các câu hỏi IELTS Speaking Part 3 trôi chảy.',
  category: 'social_chat',
  learningObjectivesVi: [
    'Làm chủ cấu trúc PEEL: Nêu luận điểm sắc bén (Point) -> Đào sâu cơ chế tâm lý/xã hội (Explanation) -> Dẫn chứng quan sát thực tiễn (Evidence) -> Móc nối về câu hỏi ban đầu (Link).',
    'Thực hành kỹ thuật chia cụm nhịp thở (Thought Group Chunking) giúp nói câu dài phức tạp mà không bị hụt hơi.',
    'Sử dụng bộ tính từ phân từ miêu tả cảm thụ văn hóa nghệ thuật: thought-provoking, therapeutic, uplifting, immersive.',
    'Nói độc thoại kéo dài 90 giây trả lời câu hỏi chuyên sâu về phim ảnh, âm nhạc hoặc giải trí đương đại.',
  ],

  // ── Stage 1: Phonetics Drill ───────────────────────────────────────────────
  stage1Phonetics: {
    titleVi: 'Kỹ thuật phân nhóm hơi (Thought Group Chunking) & Trọng âm câu',
    focusSound: 'Ngắt nhịp cụm nghĩa (/) & Nhấn mạnh từ nội dung (Content Words)',
    vietnameseContrastiveTip:
      'Khi nói câu phức dài, người học Việt Nam thường cố đọc một hơi từ đầu đến cuối dẫn đến hết hơi, nói nhanh bất thường hoặc ngắt sai chỗ vô nghĩa (vd: "I think that / the movie was / very"). Hãy chia câu thành các nhóm nghĩa tự nhiên (Thought Groups) từ 3-5 từ, lấy hơi rất nhẹ giữa các cụm và nhấn mạnh các từ mang nội dung chính (danh từ, động từ, tính từ).',
    category: 'stress-linking',
    mouthTipVi:
      'Chia câu thành các nhịp: [Quan điểm /] [Nguyên do cốt lõi /] [Hệ quả cảm xúc ↘]. Tại mỗi dấu gạch chéo (/), ngừng phát âm một tích tắc nhưng không ngậm miệng lại.',
    minimalPairs: [
      {
        wordA: 'thought',
        ipaA: '/θɔːt/',
        wordB: 'taught',
        ipaB: '/tɔːt/',
        meaningA: 'suy nghĩ (âm /θ/ kẹp lưỡi)',
        meaningB: 'đã dạy học (âm /t/ chân răng)',
        distinctionVi: 'thought kẹp nhẹ đầu lưỡi giữa hai hàm răng và thổi hơi vô thanh, taught bật mạnh ở nướu trên.',
      },
      {
        wordA: 'mind',
        ipaA: '/maɪnd/',
        wordB: 'mine',
        ipaB: '/maɪn/',
        meaningA: 'tâm trí (kết thúc /nd/)',
        meaningB: 'của tôi / mỏ khoáng (kết thúc /n/)',
        distinctionVi: 'mind có âm bật /d/ cuối từ để phân biệt rõ với mine.',
      },
      {
        wordA: 'stress',
        ipaA: '/stres/',
        wordB: 'stretches',
        ipaB: '/ˈstretʃ.ɪz/',
        meaningA: 'căng thẳng (1 âm tiết)',
        meaningB: 'kéo giãn (2 âm tiết)',
        distinctionVi: 'stress kết thúc bằng âm xì /s/, stretches kết thúc bằng âm /ɪz/.',
      },
      {
        wordA: 'bored',
        ipaA: '/bɔːrd/',
        wordB: 'board',
        ipaB: '/bɔːrd/',
        meaningA: 'cảm thấy buồn chán',
        meaningB: 'tấm bảng / ban giám đốc',
        distinctionVi: 'Đồng âm, phát âm tròn môi /bɔː/ rồi uốn lưỡi âm /rd/.',
      },
    ],
    practiceSentences: [
      {
        sentence: 'I firmly believe / that acoustic music / has a deeply therapeutic effect / on anxious minds.',
        phoneticTarget: 'aɪ ˈfɜːrmli bɪˈliːv / ðət əˈkuːstɪk ˈmjuːzɪk / hæz‿ə ˈdiːpli ˌθerəˈpjuːtɪk ɪˈfekt / ɑːn ˈæŋkʃəs maɪndz ↘',
        vietnameseTranslation: 'Tôi tin chắc rằng / âm nhạc mộc mạc / có tác dụng trị liệu sâu sắc / đối với những tâm trí lo âu.',
      },
      {
        sentence: 'This is simply because / gentle melodies / reduce heart rate / and calm our nervous system.',
        phoneticTarget: 'ðɪs ɪz ˈsɪmpli bɪˈkəz / ˈdʒentl ˈmelədiz / rɪˈduːs hɑːrt reɪt / ənd kɑːm ɑːr ˈnɜːrvəs ˈsɪstəm ↘',
        vietnameseTranslation: 'Điều này đơn giản là vì / những giai điệu êm dịu / giúp giảm nhịp tim / và xoa dịu hệ thần kinh của chúng ta.',
      },
      {
        sentence: 'For example, / whenever I listen to classical piano / while studying, / my focus doubles.',
        phoneticTarget: 'fɔːr ɪɡˈzæmpl / wenˈevər aɪ ˈlɪsn tə ˈklæsɪkl piˈænoʊ / waɪl ˈstʌdiɪŋ / maɪ ˈfoʊkəs ˈdʌblz ↘',
        vietnameseTranslation: 'Ví dụ, / bất cứ khi nào tôi nghe piano cổ điển / trong lúc học bài, / độ tập trung của tôi tăng gấp đôi.',
      },
    ],
  },

  // ── Stage 2: Core Patterns & Lexical Chunks ────────────────────────────────
  stage2CorePatterns: {
    titleVi: 'Khung triển khai đoạn văn học thuật PEEL',
    vietnameseGrammarRule:
      'Mô hình PEEL là tiêu chuẩn vàng cho các câu hỏi giải thích chuyên sâu (IELTS Part 3 hoặc thuyết trình): 1) P (Point): Mở đầu khẳng định trực diện luận điểm. 2) E (Explanation): Giải thích cơ chế vì sao ("This is primarily because..."). 3) E (Evidence): Nêu ví dụ hoặc quan sát thực tiễn ("In my personal experience / Research indicates that..."). 4) L (Link): Kết nối câu cuối trở lại chủ đề gốc ("Therefore, it is evident that...").',
    formula:
      'P (I strongly believe that [Claim]) -> E (This is because [Scientific/Social Mechanism]) -> E (For instance, whenever [Concrete Case], [Outcome]) -> L (Therefore, [Concluding Link]).',
    legoSlots: [
      {
        template:
          'I strongly believe that {media_topic} plays a {role_adjective} role in modern society. This is primarily because it helps people {mechanism_benefit}. For instance, whenever I {personal_experience}, I always {immediate_impact}. Therefore, it is undeniable that {media_topic} is {concluding_assessment}.',
        slots: {
          media_topic: [
            'watching thought-provoking documentary films',
            'listening to uplifting instrumental music',
            'reading historical fiction novels',
            'attending live theatre and musical performances',
          ],
          role_adjective: [
            'crucial therapeutic and educational',
            'deeply transformative and cultural',
            'vital cognitive and philosophical',
            'profound emotional and social',
          ],
          mechanism_benefit: [
            'unwind from intense mental fatigue and gain fresh life perspectives',
            'lower stress hormones and stimulate creative problem-solving regions',
            'cultivate genuine empathy and understand complex historical events',
            'reconnect with collective human emotions and foster community bonds',
          ],
          personal_experience: [
            'feel completely burned out after grueling overtime work hours',
            'struggle with persistent creative blocks during major projects',
            'need to escape from excessive digital screen distractions',
            'experience overwhelming emotional anxiety before crucial deadlines',
          ],
          immediate_impact: [
            'feel refreshed, emotionally grounded, and ready to tackle challenges',
            'experience a surge of new imaginative concepts and clear thinking',
            'gain a serene sense of inner tranquility and intellectual clarity',
            'feel deeply inspired and motivated by human resilience',
          ],
          concluding_assessment: [
            'an indispensable sanctuary for our mental health',
            'a cornerstone of emotional intelligence and lifelong learning',
            'far more than mere superficial entertainment',
            'an essential nourishment for the human soul',
          ],
        },
        examples: [
          {
            en: 'I strongly believe that watching thought-provoking documentary films plays a crucial therapeutic and educational role in modern society. This is primarily because it helps people unwind from intense mental fatigue and gain fresh life perspectives. For instance, whenever I feel completely burned out after grueling overtime work hours, I always feel refreshed, emotionally grounded, and ready to tackle challenges. Therefore, it is undeniable that watching thought-provoking documentary films is an indispensable sanctuary for our mental health.',
            vi: 'Tôi tin chắc rằng việc xem những bộ phim tài liệu gợi mở suy nghĩ đóng một vai trò giáo dục và trị liệu quan trọng trong xã hội hiện đại. Điều này chủ yếu là vì nó giúp con người thư giãn khỏi sự mệt mỏi tinh thần căng thẳng và có thêm những góc nhìn cuộc sống mới mẻ. Chẳng hạn, mỗi khi tôi cảm thấy kiệt sức sau những giờ làm thêm căng thẳng, tôi luôn cảm thấy được làm mới, tâm trạng vững vàng và sẵn sàng đương đầu với thử thách. Do đó, không thể phủ nhận rằng xem phim tài liệu là một nơi trú ẩn không thể thiếu cho sức khỏe tinh thần.',
          },
          {
            en: 'I strongly believe that listening to uplifting instrumental music plays a vital cognitive and philosophical role in modern society. This is primarily because it helps people lower stress hormones and stimulate creative problem-solving regions. For instance, whenever I struggle with persistent creative blocks during major projects, I always experience a surge of new imaginative concepts and clear thinking. Therefore, it is undeniable that listening to uplifting instrumental music is far more than mere superficial entertainment.',
            vi: 'Tôi tin chắc rằng nghe nhạc không lời tươi sáng đóng một vai trò then chốt về nhận thức trong xã hội hiện đại. Điều này trước hết là vì nó giúp hạ nồng độ hormone căng thẳng và kích thích các vùng não giải quyết vấn đề sáng tạo. Ví dụ, bất cứ khi nào tôi gặp bế tắc ý tưởng dai dẳng trong các dự án lớn, tôi luôn cảm nhận được một làn sóng ý tưởng mới và tư duy rõ ràng tuôn trào. Vì vậy, không thể chối cãi rằng nghe nhạc không lời vượt xa một hình thức giải trí hời hợt đơn thuần.',
          },
        ],
      },
    ],
    highFrequencyVocab: [
      {
        term: 'thought-provoking',
        ipa: '/ˈθɔːt prəˌvoʊ.kɪŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'gợi mở nhiều suy nghĩ sâu sắc',
        collocationHintVi: 'thought-provoking question / thought-provoking documentary',
        exampleSentenceEn: 'The movie offered a deeply thought-provoking ending that stayed with me for days.',
        exampleSentenceVi: 'Bộ phim mang lại một cái kết gợi nhiều suy nghĩ sâu sắc đọng lại trong tôi suốt nhiều ngày.',
      },
      {
        term: 'therapeutic',
        ipa: '/ˌθer.əˈpjuː.tɪk/',
        partOfSpeech: 'adj',
        meaningVi: 'có tính trị liệu, chữa lành tinh thần',
        collocationHintVi: 'therapeutic effect / therapeutic activity',
        exampleSentenceEn: 'Gardening and listening to acoustic melodies have a truly therapeutic effect.',
        exampleSentenceVi: 'Làm vườn và nghe những giai điệu mộc mạc mang lại tác dụng trị liệu thực sự.',
      },
      {
        term: 'unwind',
        ipa: '/ʌnˈwaɪnd/',
        partOfSpeech: 'verb',
        meaningVi: 'xả hơi, giải tỏa căng thẳng sau giờ làm',
        collocationHintVi: 'unwind after work / best way to unwind',
        exampleSentenceEn: 'A hot bath with soothing music is my favorite ritual to unwind in the evening.',
        exampleSentenceVi: 'Tắm nước nóng cùng âm nhạc du dương là thói quen thư giãn buổi tối yêu thích của tôi.',
      },
      {
        term: 'uplifting',
        ipa: '/ʌpˈlɪf.tɪŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'nâng đỡ tinh thần, truyền cảm hứng tích cực',
        collocationHintVi: 'uplifting message / uplifting soundtrack',
        exampleSentenceEn: 'The inspiring true story ended on a remarkably uplifting note.',
        exampleSentenceVi: 'Câu chuyện có thật đầy cảm hứng kết thúc bằng một thông điệp nâng đỡ tinh thần sâu sắc.',
      },
    ],
  },

  // ── Stage 3: Guided Dialogue ───────────────────────────────────────────────
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại tương tác: Trả lời câu hỏi học thuật về Văn hóa Nghệ thuật',
    contextVi:
      'Giám khảo (Partner) hỏi học viên (Learner) về tầm ảnh hưởng của âm nhạc và điện ảnh trong đời sống hiện đại. Learner áp dụng quy chuẩn PEEL để diễn giải sâu sắc.',
    frameworkType: 'peel',
    turns: [
      {
        speaker: 'Partner',
        en: 'In your view, why is cinema considered such an impactful art form across cultures?',
        vi: 'Theo góc nhìn của bạn, vì sao điện ảnh lại được xem là một loại hình nghệ thuật có sức ảnh hưởng lớn trên khắp các nền văn hóa?',
        coreKeywords: ['cinema', 'impactful art form', 'across cultures'],
      },
      {
        speaker: 'Learner',
        en: 'I firmly believe that cinema is uniquely impactful because it combines visual storytelling with profound human empathy.',
        vi: 'Tôi tin chắc rằng điện ảnh có sức ảnh hưởng đặc biệt vì nó kết hợp giữa nghệ thuật kể chuyện hình ảnh và sự thấu cảm sâu sắc của con người. (Point)',
        coreKeywords: ['firmly believe', 'visual storytelling', 'profound human empathy'],
        suggestedStartersVi: ['I firmly believe that cinema is...'],
      },
      {
        speaker: 'Partner',
        en: 'Could you elaborate on how it creates that kind of deep emotional connection?',
        vi: 'Bạn có thể nói rõ hơn về việc nó tạo ra sự kết nối cảm xúc sâu sắc đó như thế nào không?',
        coreKeywords: ['elaborate', 'emotional connection'],
      },
      {
        speaker: 'Learner',
        en: 'This is primarily because watching characters navigate moral dilemmas allows viewers to experience diverse lives safely.',
        vi: 'Điều này chủ yếu là vì việc chứng kiến các nhân vật vượt qua những thế tiến thoái lưỡng nan về đạo đức cho phép người xem trải nghiệm những cuộc đời khác nhau một cách an toàn. (Explanation)',
        coreKeywords: ['primarily because', 'moral dilemmas', 'experience diverse lives'],
        suggestedStartersVi: ['This is primarily because...'],
      },
      {
        speaker: 'Partner',
        en: 'Has any particular movie ever influenced your own worldview?',
        vi: 'Đã có bộ phim cụ thể nào từng tác động đến nhân sinh quan của bạn chưa?',
        coreKeywords: ['particular movie', 'influenced worldview'],
      },
      {
        speaker: 'Learner',
        en: 'For instance, watching historical documentaries broadened my understanding of human resilience. Therefore, cinema is far more than entertainment—it is a mirror of society.',
        vi: 'Chẳng hạn, xem các phim tài liệu lịch sử đã mở rộng tầm hiểu biết của tôi về sức bền bỉ của con người. Vì vậy, điện ảnh vượt xa một trò giải trí—nó là tấm gương phản chiếu xã hội. (Evidence & Link)',
        coreKeywords: ['For instance', 'historical documentaries', 'Therefore', 'mirror of society'],
        suggestedStartersVi: ['For instance, watching...', 'Therefore, cinema is...'],
      },
    ],
  },

  // ── Stage 4: SafeHarbor Evaluation ────────────────────────────────────────
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Thuyết trình PEEL 60-90s',
    promptVi:
      'Trả lời câu hỏi về giá trị của âm nhạc hoặc phim ảnh theo đúng 4 bước PEEL (Point -> Explanation -> Evidence -> Link), sử dụng ít nhất 2 tính từ cảm quan (therapeutic, uplifting, thought-provoking).',
    promptQuestionEn: 'Why do you think music plays such an important role in people’s daily lives?',
    targetSentence:
      'I strongly believe that listening to music is vital for mental health. This is because soothing melodies reduce cortisol and foster deep cognitive focus. For instance, whenever I feel overwhelmed by deadlines, playing instrumental jazz instantly unwinds my mind. Therefore, music is an indispensable therapeutic tool for modern life.',
    acceptableVariations: [
      'I believe that movies play a crucial educational role in society. This is because visual stories help us understand diverse cultures and struggles. For instance, watching thought-provoking historical films taught me invaluable lessons about resilience. Therefore, cinema is much more than mere entertainment.',
      'In my view, reading books is essential for personal growth. This is simply because literature broadens our imagination and analytical thinking. For instance, reading biographies inspired me to overcome difficult career obstacles. Thus, reading daily is the key to lifelong wisdom.',
    ],
    coreKeywords: [
      'strongly believe',
      'mental health',
      'vital',
      'This is because',
      'For instance',
      'unwind',
      'Therefore',
      'therapeutic',
    ],
    targetMeaningVi:
      'Tôi tin chắc rằng nghe nhạc rất quan trọng đối với sức khỏe tinh thần. Điều này là do những giai điệu êm dịu giúp giảm căng thẳng và tăng cường tập trung trí tuệ. Ví dụ, bất cứ khi nào tôi cảm thấy choáng ngợp vì công việc, bật nhạc jazz không lời lập tức giúp tâm trí tôi thư giãn. Do đó, âm nhạc là một công cụ trị liệu không thể thiếu trong đời sống hiện đại.',
    instructionsVi:
      'Ngắt nhịp hơi tự nhiên theo cụm nghĩa (Thought Groups). Duy trì bài nói liên tục trong 60-90 giây không vấp, đạt tối thiểu 75 điểm.',
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
  },
};
