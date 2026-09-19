import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p3L10TwoMinuteMonologueMastery: SpeakingCurriculumLesson = {
  id: 'p3-l10-2-minute-monologue-mastery',
  phaseId: 'phase-3-intermediate',
  order: 10,
  titleEn: '2-Minute Monologue Mastery: Sustained IELTS Part 2 Delivery',
  titleVi: 'Làm Chủ Độc Thoại 2 Phút: Kỹ Thuật Kiểm Soát Tốc Độ & Dẫn Dắt Dòng Chảy Part 2',
  cefrLevel: 'B2',
  targetBandIelts: '5.0-6.5',
  estimatedMinutes: 30,
  slug: '2-minute-monologue-mastery',
  category: 'academic_debate',
  summaryVi:
    'Bài học tổng kết đỉnh cao của Chặng 3 Intermediate: Huấn luyện kỹ năng độc thoại bền bỉ suốt 120 giây trong IELTS Speaking Part 2 mà không bao giờ bị đứt mạch hay cạn ý tưởng. Làm chủ nghệ thuật phân bổ thời lượng (Pacing), sử dụng biển chỉ dẫn ngôn ngữ (Discourse Signposts) và kết bài chiêm nghiệm đạt điểm Band 6.5 - 7.0+.',
  learningObjectivesVi: [
    'Làm chủ quy tắc phân bổ thời lượng 120s chuẩn xác: 30s Bối cảnh -> 30s Cao trào -> 30s Giải quyết -> 30s Chiêm nghiệm',
    'Ứng dụng thành thạo các biển chỉ dẫn tư duy (Discourse Signposts) để dẫn dắt giám khảo qua từng chặng câu chuyện',
    'Kiểm soát tốc độ nói lý tưởng (120-140 từ/phút) kết hợp kỹ thuật hít thở ngắt nhịp Thought Groups',
    'Vượt qua bài kiểm tra SafeHarbor tổng duyệt độc thoại kết nối bối cảnh, thử thách và bài học trưởng thành',
  ],

  stage1Phonetics: {
    titleVi: 'Khởi động khẩu hình: Kiểm soát nhịp độ phát ngôn (Pacing) & Biển chỉ dẫn âm thanh',
    focusSound: 'Sustained Speech Prosody, Rhythm Stabilization & Signpost Intonation',
    category: 'stress-linking',
    descriptionVi:
      'Trong bài thi độc thoại 2 phút, lỗi phổ biến nhất của thí sinh là nói quá nhanh trong 45 giây đầu do căng thẳng, sau đó bị cạn ý và im lặng suốt 1 phút còn lại. Để khắc phục, bạn cần cài đặt các "biển chỉ dẫn âm thanh" (Acoustic Signposts) như "What stood out most vividly was..." với nhịp điệu khoan thai, rõ ràng.',
    mouthTipVi:
      'Khi nói cụm chuyển đoạn: "In retrospect..." /ˌɪn ˈret.rə.spekt/, nhấn mạnh vào "ret" /ˈret/, dừng nghỉ 0.3 giây trước khi đưa ra đúc kết bài học. Điều này vừa giúp bạn lấy thêm hơi, vừa ra hiệu cho giám khảo biết bạn đang bước vào phần chiêm nghiệm giá trị nhất.',
    vietnameseContrastiveTip:
      'Tuyệt đối không tăng tốc độ nói khi sắp hết ý. Ngược lại, khi cảm thấy cần suy nghĩ, hãy kéo dài trường độ của các tính từ và trạng từ mô tả ("absolutely extraordinary", "truly transformative") thay vì chèn âm "ờ, à".',
    phonemes: ['/ˈpeɪ.sɪŋ/', '/ˌret.rəˈspekt/', '/ˈvɪv.ɪd.li/', '/ˈsaɪn.poʊsts/'],
    video: {
      youtubeVideoId: 'V9a8i2dF_mQ',
      channelName: "Rachel's English",
      startSeconds: 70,
      endSeconds: 180,
      title: 'Speech Pacing and Rhythm for Long Monologues in English',
      mouthTipSummaryVi:
        'Luyện thở bằng cơ hoành và giữ nhịp độ nói ổn định từ 120-140 từ mỗi phút trong suốt bài độc thoại 2 phút.',
    },
    minimalPairs: [
      {
        wordA: 'pacing',
        wordB: 'passing',
        ipaA: '/ˈpeɪ.sɪŋ/',
        ipaB: '/ˈpæs.ɪŋ/',
        meaningA: 'sự kiểm soát nhịp độ, tốc độ bước đi/nói',
        meaningB: 'sự trôi qua, thoáng qua',
        distinctionVi:
          'Từ "pacing" có nguyên âm đôi /eɪ/; trong khi "passing" có nguyên âm bẹt đè sâu hàm /æ/.',
      },
      {
        wordA: 'retrospect',
        wordB: 'respect',
        ipaA: '/ˈret.rə.spekt/',
        ipaB: '/rɪˈspekt/',
        meaningA: 'sự nhìn lại quá khứ, hồi tưởng',
        meaningB: 'sự tôn trọng, kính trọng',
        distinctionVi:
          'Từ "retrospect" có 3 âm tiết với phụ âm /tr/ ở giữa; "respect" chỉ có 2 âm tiết.',
      },
      {
        wordA: 'monologue',
        wordB: 'dialogue',
        ipaA: '/ˈmɑː.nə.lɑːɡ/',
        ipaB: '/ˈdaɪ.ə.lɑːɡ/',
        meaningA: 'bài độc thoại (1 người nói)',
        meaningB: 'cuộc đối thoại (2 người nói)',
        distinctionVi:
          'Âm tiết đầu của "monologue" là /mɑː/; âm tiết đầu của "dialogue" là nguyên âm đôi /daɪ/.',
      },
    ],
    practiceSentences: [
      {
        sentence:
          'To commence with, / the event I would like to elaborate on / occurred during my final semester at university.',
        phoneticTarget: 'Mở đầu đĩnh đạc với cụm "To commence with" và ngắt nhịp thở nhẹ',
        vietnameseTranslation:
          'Để bắt đầu, sự kiện mà tôi muốn trình bày chi tiết đã diễn ra trong suốt học kỳ cuối cùng của tôi tại trường đại học.',
      },
      {
        sentence:
          'What stood out most prominently during the entire journey / was the sheer resilience of the local community.',
        phoneticTarget: 'Nhấn mạnh cụm "What stood out most prominently" và danh từ "sheer resilience"',
        vietnameseTranslation:
          'Điều nổi bật và ấn tượng sâu sắc nhất trong toàn bộ chuyến đi chính là sự kiên cường tột bậc của cộng đồng địa phương.',
      },
      {
        sentence:
          'In retrospect, / that single decisive moment / fundamentally transformed how I navigate professional adversity.',
        phoneticTarget: 'Hạ giọng ở "In retrospect" và phát âm chuẩn xác cụm "navigate professional adversity"',
        vietnameseTranslation:
          'Nhìn lại quá khứ, chính khoảnh khắc quyết định duy nhất đó đã biến đổi hoàn toàn cách tôi lèo lái vượt qua những nghịch cảnh trong sự nghiệp.',
      },
    ],
    targetPracticeWords: [
      { word: 'in retrospect', ipa: '/ˌɪn ˈret.rə.spekt/', meaningVi: 'khi nhìn lại quá khứ, sau khi ngẫm lại' },
      { word: 'stand out prominently', ipa: '/stænd aʊt ˈprɑː.mə.nənt.li/', meaningVi: 'nổi bật lên một cách rõ nét' },
      { word: 'sheer resilience', ipa: '/ʃɪr rɪˈzɪl.jəns/', meaningVi: 'sức bền bỉ, kiên cường tột bậc' },
      { word: 'to commence with', ipa: '/tuː kəˈmens wɪð/', meaningVi: 'để bắt đầu câu chuyện' },
    ],
  },

  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: 4 Cột Mốc Dẫn Dắt Độc Thoại 2 Phút (The 4-Pillar Monologue Architecture)',
    vietnameseGrammarRule:
      'Để kiểm soát hoàn hảo 120 giây nói, bạn cần ghi nhớ 4 cột mốc dẫn đường (Signposts) ứng với 4 góc phần tư: 1. Mở bài bối cảnh ("To commence with, the memorable experience I would like to elaborate on took place..."), 2. Chuyển vào cao trào ("Everything took an unexpected turn when..."), 3. Tháo gỡ nút thắt ("What enabled us to navigate this crisis was..."), 4. Đúc kết chiêm nghiệm ("In retrospect, this incident was truly transformative because..."). Sử dụng linh hoạt các mệnh đề phân từ (Participle clauses) và thì Quá khứ hoàn thành.',
    formula:
      'Pillar 1 (0-30s): To commence with, I would like to share... -> Pillar 2 (30-60s): Everything took an unforeseen turn when... -> Pillar 3 (60-90s): What enabled me to resolve this predicament was... -> Pillar 4 (90-120s): In retrospect, this ordeal fundamentally transformed...',
    overviewVi:
      'Cấu trúc này giúp người nói hoàn toàn làm chủ đồng hồ bấm giờ của giám khảo, không bao giờ bị ngắt lời giữa chừng khi chưa kịp kết bài.',
    legoSlots: [
      {
        template:
          'To commence with, the {event_descriptor} I would like to elaborate on occurred {temporal_anchor}. Everything took an unforeseen turn when {unexpected_crisis}. What enabled us to overcome this predicament was {coping_mechanism}. In retrospect, this experience was truly {reflective_verdict} because it {transformative_lesson}.',
        slots: {
          event_descriptor: [
            'pivotal professional milestone',
            'spontaneous solo backpacking journey',
            'high-stakes academic competition',
            'demanding community volunteer mission',
          ],
          temporal_anchor: [
            'roughly two years ago when I first transitioned into the tech industry',
            'during my final undergraduate year right before graduation',
            'shortly after relocating to a new metropolitan city',
            'in the depths of an agonizing career burnout phase',
          ],
          unexpected_crisis: [
            'our core server crashed minutes before the client demo',
            'a severe tropical storm triggered flash floods that severed all road access',
            'our team leader suddenly resigned, leaving us completely unguided',
            'our primary sponsorship was abruptly revoked due to budget cutbacks',
          ],
          coping_mechanism: [
            'maintaining absolute composure and executing an agile contingency plan',
            'leveraging collective ingenuity and rallying the local villagers',
            're-distributing core responsibilities and working around the clock',
            'pitching alternative grassroots funding models to independent sponsors',
          ],
          reflective_verdict: [
            'a transformative rite of passage',
            'an indispensable masterclass in crisis leadership',
            'a humbling wake-up call regarding human adaptability',
            'a profound milestone in my emotional maturity',
          ],
          transformative_lesson: [
            'instilled in me unshakeable resilience in the face of uncertainty',
            'taught me never to underestimate the power of collective solidarity',
            'demonstrated that adversity often disguises our greatest breakthroughs',
            'reaffirmed my conviction that integrity triumphs over short-term panic',
          ],
        },
        examples: [
          {
            en: 'To commence with, the pivotal professional milestone I would like to elaborate on occurred roughly two years ago when I first transitioned into the tech industry. Everything took an unforeseen turn when our core server crashed minutes before the client demo. What enabled us to overcome this predicament was maintaining absolute composure and executing an agile contingency plan. In retrospect, this experience was truly an indispensable masterclass in crisis leadership because it instilled in me unshakeable resilience in the face of uncertainty.',
            vi: 'Để bắt đầu, cột mốc nghề nghiệp then chốt mà tôi muốn trình bày chi tiết đã diễn ra khoảng hai năm trước khi tôi mới chuyển sang ngành công nghệ. Mọi thứ đã có một bước ngoặt bất ngờ ngoài dự tính khi máy chủ chính của chúng tôi bị sập chỉ vài phút trước buổi demo cho khách hàng. Điều giúp chúng tôi vượt qua tình thế hiểm nghèo đó là giữ vững sự điềm tĩnh tuyệt đối và triển khai kế hoạch dự phòng linh hoạt. Khi nhìn lại, trải nghiệm này thực sự là một bài học bậc thầy vô giá về năng lực lãnh đạo trong khủng hoảng bởi nó đã hun đúc trong tôi sự kiên cường không lay chuyển khi đối mặt với những điều bất định.',
          },
        ],
      },
    ],
    highFrequencyVocab: [
      {
        term: 'to commence with',
        ipa: '/tuː kəˈmens wɪð/',
        partOfSpeech: 'phrase',
        meaningVi: 'để bắt đầu, trước hết (trang trọng hơn To start with)',
        collocationHintVi: 'Dùng mở đầu Part 2: To commence with, I would like to focus on...',
        exampleSentenceEn: 'To commence with, let us examine the fundamental background.',
        exampleSentenceVi: 'Để bắt đầu, chúng ta hãy cùng xem xét bối cảnh nền tảng.',
      },
      {
        term: 'in retrospect',
        ipa: '/ˌɪn ˈret.rə.spekt/',
        partOfSpeech: 'phrase',
        meaningVi: 'khi nhìn lại quá khứ, sau khi ngẫm lại mọi việc',
        collocationHintVi: 'Dùng mở đầu phần chiêm nghiệm: In retrospect, it was an invaluable lesson.',
        exampleSentenceEn: 'In retrospect, choosing that university was the wisest decision I ever made.',
        exampleSentenceVi: 'Nhìn lại, việc chọn trường đại học đó là quyết định sáng suốt nhất tôi từng đưa ra.',
      },
      {
        term: 'predicament',
        ipa: '/prəˈdɪk.ə.mənt/',
        partOfSpeech: 'noun',
        meaningVi: 'tình thế khó xử, hoàn cảnh hiểm nghèo gian nan',
        collocationHintVi: 'Cụm phổ biến: find oneself in a difficult predicament',
        exampleSentenceEn: 'The team found themselves in an agonizing financial predicament.',
        exampleSentenceVi: 'Cả đội nhận thấy mình đang rơi vào một tình thế khó khăn tài chính đầy đau đầu.',
      },
      {
        term: 'unshakeable resilience',
        ipa: '/ʌnˈʃeɪ.kə.bəl rɪˈzɪl.jəns/',
        partOfSpeech: 'phrase',
        meaningVi: 'sự kiên cường không gì lay chuyển nổi',
        collocationHintVi: 'Đi với động từ: demonstrate / cultivate unshakeable resilience',
        exampleSentenceEn: 'Overcoming hardship builds unshakeable resilience for future trials.',
        exampleSentenceVi: 'Vượt qua gian khó sẽ xây dựng sự kiên cường không thể lay chuyển cho những thử thách trong tương lai.',
      },
    ],
  },

  stage3GuidedDialogue: {
    titleVi: 'Thực hành hội thoại: Mô phỏng toàn diện bài thi IELTS Speaking Part 2 hoàn chỉnh',
    contextVi:
      'Giám khảo ra đề Cue Card: "Describe a time when you had to deal with a sudden crisis or challenge under pressure". Bạn thực hiện bài nói trọn vẹn 2 phút thông qua 4 giai đoạn dẫn dắt.',
    frameworkType: 'cue-card',
    frameworkData: {
      topic: 'Handling an Unexpected Crisis Under Pressure',
      timingBreakdown: [
        '0:00 - 0:30: Stage Setup & Objective',
        '0:30 - 1:00: The Climax & Breakdown of Plans',
        '1:00 - 1:30: Resourcefulness & Collaborative Resolution',
        '1:30 - 2:00: Philosophical Introspection & Lasting Impact',
      ],
    },
    turns: [
      {
        speaker: 'Examiner',
        en: 'Please begin your two-minute talk now. Remember, I will stop you when the time is up, so please do not worry if I interrupt you. You may start.',
        vi: 'Xin mời bạn bắt đầu bài nói hai phút ngay bây giờ. Hãy nhớ rằng tôi sẽ dừng bạn lại khi hết giờ, vì vậy đừng lo lắng nếu tôi ngắt lời bạn. Bạn có thể bắt đầu.',
        coreKeywords: ['begin', 'two-minute talk', 'stop you', 'start'],
      },
      {
        speaker: 'Candidate',
        en: 'To commence with, the challenging experience I would like to elaborate on took place roughly two years ago, when I was leading a university project team organizing a national youth climate summit.',
        vi: 'Để bắt đầu, trải nghiệm đầy thách thức mà tôi muốn chia sẻ chi tiết diễn ra cách đây khoảng hai năm, khi tôi đang dẫn dắt một nhóm dự án của trường đại học tổ chức hội nghị thượng đỉnh thanh niên về khí hậu toàn quốc.',
        coreKeywords: ['commence with', 'elaborate on', 'leading a university project team', 'climate summit'],
        suggestedStartersVi: [
          'To commence with, the event I want to recount is...',
          'I would like to focus on a challenging occasion that...',
        ],
      },
      {
        speaker: 'Candidate',
        en: 'Everything took an unforeseen turn on the eve of the conference. Our keynote speaker contracted a severe illness and cancelled at the eleventh hour, while technical glitches disrupted our livestream broadcast across five partner campuses.',
        vi: 'Mọi thứ đã có một bước ngoặt bất ngờ ngoài dự tính ngay trước thềm đêm khai mạc hội thảo. Diễn giả chính của chúng tôi đột ngột ngã bệnh nặng và hủy vào phút chót, trong khi các trục trặc kỹ thuật làm gián đoạn buổi phát sóng trực tiếp tới 5 cơ sở trường đối tác.',
        coreKeywords: ['unforeseen turn', 'keynote speaker', 'eleventh hour', 'technical glitches', 'livestream broadcast'],
        suggestedStartersVi: [
          'Everything took an unforeseen turn when...',
          'The entire plan was jeopardized when...',
        ],
      },
      {
        speaker: 'Candidate',
        en: 'What enabled us to navigate this severe predicament was maintaining absolute composure. Rather than finger-pointing, we swiftly restructured the agenda into interactive debate circles and invited a prominent local environmental activist to step in.',
        vi: 'Điều giúp chúng tôi chèo lái vượt qua tình thế hiểm nghèo nghiêm trọng đó chính là việc giữ vững sự điềm tĩnh tuyệt đối. Thay vì đổ lỗi cho nhau, chúng tôi đã nhanh chóng tái cơ cấu lịch trình thành các vòng tranh biện tương tác và mời một nhà hoạt động môi trường địa phương uy tín thế chỗ.',
        coreKeywords: ['navigate this severe predicament', 'maintaining absolute composure', 'finger-pointing', 'restructured the agenda', 'debate circles'],
        suggestedStartersVi: [
          'What enabled us to overcome this crisis was...',
          'Instead of succumbing to panic, we...',
        ],
      },
      {
        speaker: 'Candidate',
        en: 'In retrospect, that nerve-wracking ordeal was truly an indispensable masterclass in crisis leadership. It taught me that genuine leadership is not about avoiding chaos, but about cultivating unshakeable resilience and inspiring trust when things unravel.',
        vi: 'Khi ngẫm lại quá khứ, thử thách cân não thót tim đó thực sự là một bài học bậc thầy vô giá về năng lực lãnh đạo trong khủng hoảng. Nó dạy tôi rằng tài năng lãnh đạo đích thực không phải là tránh né sự hỗn loạn, mà là biết nuôi dưỡng sự kiên cường không gì lay chuyển và truyền cảm hứng về niềm tin khi mọi thứ dần trượt khỏi quỹ đạo.',
        coreKeywords: ['in retrospect', 'nerve-wracking ordeal', 'indispensable masterclass', 'crisis leadership', 'unshakeable resilience'],
        suggestedStartersVi: [
          'In retrospect, this ordeal was truly...',
          'Looking back on the whole experience, it fundamentally taught me...',
        ],
      },
    ],
  },

  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Bật phản xạ kết bài độc thoại đỉnh cao Part 2',
    promptVi:
      'Nói câu đúc kết chiêm nghiệm kết thúc bài nói 2 phút: "Khi ngẫm lại, thử thách đó thực sự là một bài học vô giá bởi vì nó đã hun đúc trong tôi sự kiên cường không lay chuyển khi đối mặt với nghịch cảnh."',
    promptQuestionEn:
      'Deliver the final reflective climax of your two-minute monologue using advanced idiomatic language.',
    targetSentence:
      'In retrospect, that ordeal was truly an indispensable masterclass because it cultivated unshakeable resilience in the face of adversity.',
    targetMeaningVi:
      'Khi nhìn lại quá khứ, thử thách gian nan đó thực sự là một bài học bậc thầy vô giá bởi vì nó đã tôi luyện nên sự kiên cường không gì lay chuyển nổi trước những nghịch cảnh.',
    instructionsVi:
      'Phát âm đĩnh đạc: "In retrospect", ngắt nhẹ, sau đó nối trơn tru: "indispensable masterclass", "unshakeable resilience in the face of adversity".',
    targetReflexLatencyMs: 2500,
    minimumPassingScore: 75,
    coreKeywords: [
      'in retrospect',
      'ordeal',
      'indispensable',
      'masterclass',
      'cultivated',
      'unshakeable',
      'resilience',
      'adversity',
    ],
    acceptableVariations: [
      'In retrospect, that ordeal was an indispensable masterclass because it cultivated unshakeable resilience in the face of adversity.',
      'In retrospect, that challenging ordeal was truly an indispensable masterclass as it built unshakeable resilience in the face of adversity.',
      'Looking back, that ordeal was an indispensable masterclass that instilled unshakeable resilience in the face of adversity.',
    ],
  },
};
