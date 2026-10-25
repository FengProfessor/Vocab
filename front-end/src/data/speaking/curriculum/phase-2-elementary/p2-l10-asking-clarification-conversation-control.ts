/**
 * LingoPro Speaking Curriculum - Phase 2: Elementary (A2-B1 / 3.0-5.0 IELTS)
 * Lesson P2-L10: Conversation Control & Asking for Clarification
 * File: src/data/speaking/curriculum/phase-2-elementary/p2-l10-asking-clarification-conversation-control.ts
 */

import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p2L10Lesson: SpeakingCurriculumLesson = {
  id: 'p2-l10-asking-clarification-conversation-control',
  phaseId: 'phase-2-elementary',
  order: 10,
  titleEn: 'Conversation Control & Asking for Clarification',
  titleVi: 'Kiểm soát hội thoại, Mua thời gian & Yêu cầu làm rõ ý',
  cefrLevel: 'B1',
  targetBandIelts: '4.0-5.0',
  estimatedMinutes: 25,
  summaryVi:
    'Làm chủ các chiến thuật kiểm soát nhịp độ hội thoại tự nhiên: Câu hỏi gián tiếp để yêu cầu làm rõ ý (Clarification), các cụm mua thời gian suy nghĩ hợp pháp (Stalling devices) và mẫu câu đính chính diễn đạt (Reformulation) trong IELTS Speaking và giao tiếp quốc tế.',
  category: 'social_chat',
  learningObjectivesVi: [
    'Sử dụng thành thạo các mẫu câu hỏi gián tiếp lịch sự để yêu cầu đối phương giải thích thêm: "Could you please clarify what you mean by...?"',
    'Thực hành các mẫu câu kéo dài thời gian suy nghĩ 3-5 giây mà không tạo khoảng lặng chết (Dead air): "That is an intriguing question. Off the top of my head, I would say..."',
    'Chữa cháy và định nghĩa lại ý kiến bằng cấu trúc đính chính (Repair strategies): "What I am trying to say is..." / "To put it another way,...".',
    'Nắm vững ngữ điệu lên giọng nhẹ (Rising intonation) ở cuối câu hỏi lịch sự và ngữ điệu kéo dài tự nhiên của từ đệm.',
  ],

  // ── Stage 1: Phonetics Drill ───────────────────────────────────────────────
  stage1Phonetics: {
    titleVi: 'Ngữ điệu câu hỏi gián tiếp lịch thiệp & Ngữ điệu Từ đệm mua thời gian',
    focusSound: 'Lên giọng cuối câu hỏi lịch sự (↗) & Kéo dài âm đệm mềm mại (→↗)',
    vietnameseContrastiveTip:
      'Khi không nghe rõ hoặc lúng túng, người Việt thường kêu "Hả?", "What?", hoặc im lặng hoàn toàn, tạo cảm giác thiếu chuyên nghiệp hoặc mất tự tin. Trong tiếng Anh, hãy dùng ngữ điệu lên giọng vút nhẹ ở đuôi câu hỏi gián tiếp (vd: "Could you rephrase that for me? ↗"). Đối với các từ đệm suy nghĩ ("Well, let me think..."), hãy giữ cao độ phẳng hơi nhếch lên ở cuối để báo hiệu cho đối phương biết bạn chuẩn bị nói.',
    category: 'stress-linking',
    mouthTipVi:
      'Nâng nhẹ cơ hàm và tông giọng ở 2 từ cuối cùng của câu hỏi ("for me? ↗", "by that? ↗"). Đừng hạ giọng đột ngột.',
    minimalPairs: [
      {
        wordA: 'clarify',
        ipaA: '/ˈklær.ə.faɪ/',
        wordB: 'classify',
        ipaB: '/ˈklæs.ə.faɪ/',
        meaningA: 'làm rõ nghĩa, giải thích thêm',
        meaningB: 'phân loại nhóm',
        distinctionVi: 'clarify có âm /r/ uốn nhẹ sau /l/, classify có âm /s/ xì hơi rõ.',
      },
      {
        wordA: 'phrase',
        ipaA: '/freɪz/',
        wordB: 'praise',
        ipaB: '/preɪz/',
        meaningA: 'diễn đạt thành lời (trong rephrase)',
        meaningB: 'khen ngợi, tán dương',
        distinctionVi: 'phrase bắt đầu bằng âm môi-răng /f/, praise bắt đầu bằng âm bật môi /p/.',
      },
      {
        wordA: 'repeat',
        ipaA: '/rɪˈpiːt/',
        wordB: 'receipt',
        ipaB: '/rɪˈsiːt/',
        meaningA: 'nhắc lại một lần nữa',
        meaningB: 'hóa đơn biên lai (chữ p câm)',
        distinctionVi: 'repeat có âm bật /p/ rõ ràng, receipt phát âm là /rɪˈsiːt/ không có âm p.',
      },
      {
        wordA: 'head',
        ipaA: '/hed/',
        wordB: 'ahead',
        ipaB: '/əˈhed/',
        meaningA: 'đầu (trong off the top of my head)',
        meaningB: 'phía trước',
        distinctionVi: 'ahead có thêm âm schwa /ə/ ở đầu từ.',
      },
    ],
    practiceSentences: [
      {
        sentence: 'Could you please clarify what you mean by sustainable development? ↗',
        phoneticTarget: 'kəd juː pliːz ˈklærəfaɪ wʌt juː miːn baɪ səˈsteɪnəbl dɪˈveləpmənt ↗',
        vietnameseTranslation: 'Bạn có thể vui lòng làm rõ ý bạn muốn nói về phát triển bền vững là gì không?',
      },
      {
        sentence: 'Well, off the top of my head →↗, I would say that it is crucial for our economy.',
        phoneticTarget: 'wel, ɔːf ðə tɑːp əv maɪ hed →↗, aɪ wəd seɪ ðət ɪt ɪz ˈkruːʃl fɔːr ɑːr ɪˈkɑːnəmi ↘',
        vietnameseTranslation: 'Chà, ngay lúc này nếu phải nghĩ nhanh, tôi sẽ nói rằng điều đó rất quan trọng cho nền kinh tế.',
      },
      {
        sentence: 'What I am trying to say is that we need a more balanced approach.',
        phoneticTarget: 'wʌt aɪ əm ˈtraɪɪŋ tə seɪ ɪz ðət wiː niːd‿ə mɔːr ˈbælənst əˈproʊtʃ ↘',
        vietnameseTranslation: 'Điều tôi đang muốn diễn đạt ở đây là chúng ta cần một cách tiếp cận cân bằng hơn.',
      },
    ],
  },

  // ── Stage 2: Core Patterns & Lexical Chunks ────────────────────────────────
  stage2CorePatterns: {
    titleVi: 'Bộ công cụ kiểm soát hội thoại 3 chức năng',
    vietnameseGrammarRule:
      'Làm chủ 3 chiến thuật điều khiển nhịp độ hội thoại của người bản xứ: 1) Chiến thuật mua thời gian suy nghĩ (Stalling): Dùng "That is a multifaceted question. Well, off the top of my head..." để não có 3 giây sắp xếp ý. 2) Chiến thuật yêu cầu làm rõ (Clarification): Khi câu hỏi quá trừu tượng, hỏi lại "Could you explain whether you are referring to A or B?". 3) Chiến thuật đính chính (Repair): Khi lỡ nói nhầm hoặc muốn diễn đạt gãy gọn hơn, nối ngay "What I really mean is that..." hoặc "To put it another way...".',
    formula:
      '[Stalling / Acknowledgment] -> [Polite Clarification Query] -> [Direct Answer] -> [Repair / Reformulation].',
    legoSlots: [
      {
        template:
          'That is an intriguing question. Well, {stalling_phrase}, I would say that {initial_point}. If you are asking about {specific_angle}, {elaboration}. In other words, {reformulation}.',
        slots: {
          stalling_phrase: [
            'off the top of my head without preparing beforehand',
            'to be completely honest as I have never thought about this deeply',
            'from my immediate personal perspective',
            'if I were to summarize my honest thoughts right now',
          ],
          initial_point: [
            'technology plays a profoundly double-edged role in our lives',
            'maintaining genuine personal connections has become far more challenging',
            'urban migration is an inevitable trend in developing economies',
            'lifelong self-learning is far more valuable than traditional degrees',
          ],
          specific_angle: [
            'how artificial intelligence affects entry-level white-collar jobs',
            'how excessive smartphone usage weakens real-world conversations',
            'whether housing affordability in megacities is becoming worse',
            'whether online certificates actually translate to career promotions',
          ],
          elaboration: [
            'repetitive routine tasks will certainly be automated very quickly',
            'many young individuals experience persistent social anxiety',
            'young professionals often spend more than half their income on rent',
            'practical hands-on experience remains the ultimate hiring filter',
          ],
          reformulation: [
            'what I am really trying to emphasize is adaptability over pure knowledge',
            'to put it another way, digital tools must serve humans, not alienate us',
            'what it boils down to is a pressing need for smarter urban zoning',
            'simply put, continuous skill upgrading is no longer optional',
          ],
        },
        examples: [
          {
            en: 'That is an intriguing question. Well, off the top of my head without preparing beforehand, I would say that technology plays a profoundly double-edged role in our lives. If you are asking about how artificial intelligence affects entry-level white-collar jobs, repetitive routine tasks will certainly be automated very quickly. In other words, what I am really trying to emphasize is adaptability over pure knowledge.',
            vi: 'Đó là một câu hỏi rất thú vị. Chà, ngay lúc này nếu phải nghĩ nhanh mà chưa chuẩn bị trước, tôi sẽ nói rằng công nghệ đóng vai trò là con dao hai lưỡi sâu sắc trong đời sống chúng ta. Nếu bạn đang hỏi về việc trí tuệ nhân tạo ảnh hưởng thế nào đến các công việc bàn giấy mới vào nghề, thì các tác vụ lặp đi lặp lại chắc chắn sẽ bị tự động hóa rất nhanh. Nói cách khác, điều tôi thực sự muốn nhấn mạnh ở đây là khả năng thích nghi quan trọng hơn kiến thức thuần túy.',
          },
          {
            en: 'That is an intriguing question. Well, to be completely honest as I have never thought about this deeply, I would say that maintaining genuine personal connections has become far more challenging. If you are asking about how excessive smartphone usage weakens real-world conversations, many young individuals experience persistent social anxiety. In other words, to put it another way, digital tools must serve humans, not alienate us.',
            vi: 'Đó là một câu hỏi rất thú vị. Chà, thành thật mà nói vì tôi chưa từng nghĩ sâu về điều này trước đây, tôi cho rằng việc duy trì những kết nối cá nhân chân thực đã trở nên thách thức hơn nhiều. Nếu bạn đang hỏi về việc sử dụng điện thoại quá đà làm suy yếu các cuộc trò chuyện đời thực như thế nào, thì nhiều người trẻ đang trải qua sự âu lo xã hội dai dẳng. Nói cách khác, các công cụ kỹ thuật số phải phục vụ con người chứ không được xa lánh chúng ta.',
          },
        ],
      },
    ],
    highFrequencyVocab: [
      {
        term: 'clarify',
        ipa: '/ˈklær.ə.faɪ/',
        partOfSpeech: 'verb',
        meaningVi: 'làm sáng tỏ, giải thích rõ ràng hơn',
        collocationHintVi: 'clarify an issue / clarify what you mean',
        exampleSentenceEn: 'Could you clarify whether this policy applies to part-time contractors?',
        exampleSentenceVi: 'Bạn có thể làm rõ liệu chính sách này có áp dụng cho nhân sự thời vụ không?',
      },
      {
        term: 'off the top of my head',
        ipa: '/ɔːf ðə tɑːp əv maɪ hed/',
        partOfSpeech: 'phrase',
        meaningVi: 'nghĩ nhanh, nói ngay không cần suy tính lâu',
        collocationHintVi: 'just off the top of my head / cannot say off the top of my head',
        exampleSentenceEn: 'Off the top of my head, I think we have around fifty active clients.',
        exampleSentenceVi: 'Nghĩ nhanh thì tôi ước chừng chúng ta có khoảng năm mươi khách hàng đang hoạt động.',
      },
      {
        term: 'rephrase',
        ipa: '/ˌriːˈfreɪz/',
        partOfSpeech: 'verb',
        meaningVi: 'nói lại bằng cách khác, diễn giải lại',
        collocationHintVi: 'rephrase the question / let me rephrase that',
        exampleSentenceEn: 'Let me rephrase my question to make it easier to understand.',
        exampleSentenceVi: 'Để tôi diễn đạt lại câu hỏi cho dễ hiểu hơn nhé.',
      },
      {
        term: 'to put it another way',
        ipa: '/tə pʊt ɪt əˈnʌð.ər weɪ/',
        partOfSpeech: 'phrase',
        meaningVi: 'nói theo một cách khác, diễn giải lại',
        collocationHintVi: 'or to put it another way / in other words',
        exampleSentenceEn: 'To put it another way, quality matters substantially more than quantity.',
        exampleSentenceVi: 'Nói theo một cách khác, chất lượng quan trọng hơn số lượng rất nhiều.',
      },
    ],
  },

  // ── Stage 3: Guided Dialogue ───────────────────────────────────────────────
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại tương tác: Mua thời gian & Làm rõ ý tại sự kiện kết nối',
    contextVi:
      'Tại một buổi hội thảo nghề nghiệp (Networking event), Đối tác (Partner) đặt một câu hỏi bất ngờ mang tính vĩ mô. Học viên (Learner) khéo léo mua thời gian, yêu cầu làm rõ phạm vi và đưa ra câu trả lời sắc sảo.',
    frameworkType: 'prep',
    turns: [
      {
        speaker: 'Partner',
        en: 'In your opinion, will artificial intelligence completely replace human project managers in the coming decade?',
        vi: 'Theo ý kiến của bạn, liệu trí tuệ nhân tạo có thay thế hoàn toàn các nhà quản lý dự án con người trong thập kỷ tới không?',
        coreKeywords: ['artificial intelligence', 'completely replace', 'coming decade'],
      },
      {
        speaker: 'Learner',
        en: 'That is an intriguing question! Well, off the top of my head, I would say definitely not completely.',
        vi: 'Đó là một câu hỏi rất thú vị! Chà, nếu nghĩ nhanh lúc này, tôi sẽ nói là chắc chắn không thể thay thế hoàn toàn được. (Stalling & Initial stance)',
        coreKeywords: ['intriguing question', 'off the top of my head', 'not completely'],
        suggestedStartersVi: ['That is an intriguing question! Well, off the top of my head...'],
      },
      {
        speaker: 'Partner',
        en: 'Really? Why do you seem so confident about human leadership?',
        vi: 'Thật sao? Vì sao bạn có vẻ rất tự tin vào vai trò lãnh đạo của con người?',
        coreKeywords: ['Why so confident', 'human leadership'],
      },
      {
        speaker: 'Learner',
        en: 'Could you clarify whether you are focusing on technical scheduling or emotional team motivation?',
        vi: 'Bạn có thể làm rõ giúp tôi xem bạn đang tập trung vào việc lập tiến độ kỹ thuật hay là truyền cảm hứng tinh thần cho đội ngũ không? (Clarification)',
        coreKeywords: ['Could you clarify whether', 'technical scheduling', 'emotional motivation'],
        suggestedStartersVi: ['Could you clarify whether you are focusing on...'],
      },
      {
        speaker: 'Partner',
        en: 'I suppose I was referring to overall team coordination and handling interpersonal conflicts.',
        vi: 'Tôi đoán là tôi đang muốn nói đến sự phối hợp chung của đội ngũ và việc giải quyết các xung đột giữa các cá nhân.',
        coreKeywords: ['team coordination', 'interpersonal conflicts'],
      },
      {
        speaker: 'Learner',
        en: 'Right. What I am trying to say is that while AI handles scheduling easily, human empathy and negotiation remain completely irreplaceable.',
        vi: 'Đúng vậy. Điều tôi đang muốn nhấn mạnh là trong khi AI xử lý tiến độ rất dễ dàng, thì sự thấu cảm và kỹ năng đàm phán của con người vẫn hoàn toàn không thể thay thế được. (Repair & Conclusion)',
        coreKeywords: ['What I am trying to say is', 'human empathy', 'irreplaceable'],
        suggestedStartersVi: ['Right. What I am trying to say is that...'],
      },
    ],
  },

  // ── Stage 4: SafeHarbor Evaluation ────────────────────────────────────────
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Mua thời gian & Diễn đạt lại 60s',
    promptVi:
      'Khi nhận được một câu hỏi khó hoặc bất ngờ, hãy áp dụng kỹ thuật mua thời gian ("That is an intriguing question. Well, off the top of my head..."), sau đó đưa ra quan điểm và đính chính làm rõ ý bằng ("What I am trying to say is... / To put it another way...").',
    promptQuestionEn: 'Do you believe young people today are more creative than previous generations?',
    targetSentence:
      'That is an intriguing question. Well, off the top of my head, I would say yes. If we look at digital creation, youth possess incredible tools. What I am trying to say is that technology amplifies their imagination. To put it another way, their creative potential is boundless.',
    acceptableVariations: [
      'That is a multifaceted question. Off the top of my head, I believe every generation has unique creativity. What I really mean is that older generations excelled in craft, while today’s youth excel in multimedia. To put it another way, the medium changes, but imagination remains.',
      'Well, off the top of my head, it is difficult to give a simple yes or no. Could we look at scientific innovation specifically? What I am trying to say is that modern tools make innovation faster. In other words, young people simply have better access to information.',
    ],
    coreKeywords: [
      'intriguing question',
      'off the top of my head',
      'What I am trying to say is',
      'To put it another way',
    ],
    targetMeaningVi:
      'Đó là một câu hỏi rất thú vị. Chà, nghĩ nhanh thì tôi sẽ nói là có. Nếu nhìn vào sáng tạo kỹ thuật số, giới trẻ sở hữu những công cụ tuyệt vời. Điều tôi muốn nói là công nghệ khuếch đại trí tưởng tượng của họ. Nói theo một cách khác, tiềm năng sáng tạo của họ là vô bờ bến.',
    instructionsVi:
      'Lên giọng nhẹ ở câu hỏi và giữ nhịp kéo dài tự nhiên ở từ đệm mua thời gian. Hoàn thành bài nói trong vòng 60 giây, đạt tối thiểu 75 điểm.',
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
  },
};
