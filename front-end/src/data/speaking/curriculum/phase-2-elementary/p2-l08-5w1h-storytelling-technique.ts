/**
 * LingoPro Speaking Curriculum - Phase 2: Elementary (A2-B1 / 3.0-5.0 IELTS)
 * Lesson P2-L08: 5W1H Storytelling Formula
 * File: src/data/speaking/curriculum/phase-2-elementary/p2-l08-5w1h-storytelling-technique.ts
 */

import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p2L08Lesson: SpeakingCurriculumLesson = {
  id: 'p2-l08-5w1h-storytelling-technique',
  phaseId: 'phase-2-elementary',
  order: 8,
  titleEn: '5W1H Storytelling Formula',
  titleVi: 'Công thức kể chuyện cuốn hút 5W1H (Who, What, Where, When, Why, How)',
  cefrLevel: 'B1',
  targetBandIelts: '4.0-5.0',
  estimatedMinutes: 30,
  summaryVi:
    'Làm chủ công thức 5W1H (Who, What, Where, When, Why, How) kết hợp thì Quá khứ tiếp diễn và biến thiên cao độ giọng nói (Pitch Variation) để kể một câu chuyện vượt khó hoặc chuyến phiêu lưu kịch tính dài 90-120 giây.',
  category: 'daily_life',
  learningObjectivesVi: [
    'Thiết lập khung kể chuyện hoàn chỉnh theo 6 trục tọa độ 5W1H: Nhân vật (Who), Sự kiện (What), Không gian (Where), Thời điểm (When), Động lực (Why) và Cách vượt khó (How).',
    'Phối hợp nhịp nhàng giữa Quá khứ tiếp diễn (hành động nền đang xảy ra) và Quá khứ đơn (hành động chen ngang bất ngờ): While we were... suddenly...',
    'Thực hành biến thiên cao độ (Pitch Variation): Lên giọng tạo kịch tính ở điểm thắt nút và trầm giọng ấm áp ở kết bài.',
    'Sử dụng bộ từ vựng phiêu lưu giàu cảm xúc: camaraderie, spontaneous, conquer, daunting, triumph.',
  ],

  // ── Stage 1: Phonetics Drill ───────────────────────────────────────────────
  stage1Phonetics: {
    titleVi: 'Kỹ thuật biến thiên cao độ kịch tính (Narrative Pitch Variation)',
    focusSound: 'Âm điệu Lên - Xuống (Fall-Rise ↗↘) trong kể chuyện quá khứ',
    vietnameseContrastiveTip:
      'Lối nói đều đều bằng phẳng (flat intonation) của người Việt khiến câu chuyện tiếng Anh nghe rất nhàm chán và vô cảm. Để thu hút người nghe, câu mở đầu bối cảnh cần dùng ngữ điệu lên-xuống mềm mại (Fall-Rise ↗↘), cao trào thắt nút bất ngờ cần nâng vọt cao độ (High Pitch ↑), và kết thúc giải quyết sự cố cần hạ giọng dứt khoát (Falling Pitch ↘).',
    category: 'stress-linking',
    mouthTipVi:
      'Khi nói cụm thời gian bối cảnh ("Two years ago,"), ngân nhẹ và hơi nâng giọng ở cuối cụm. Khi nói từ tạo bất ngờ ("Suddenly!"), mở to khẩu hình và nâng cao độ luồng hơi lên một quãng tám.',
    minimalPairs: [
      {
        wordA: 'climb',
        ipaA: '/klaɪm/',
        wordB: 'claim',
        ipaB: '/kleɪm/',
        meaningA: 'leo trèo (âm câm b, nguyên âm /aɪ/)',
        meaningB: 'tuyên bố, nhận thưởng (nguyên âm /eɪ/)',
        distinctionVi: 'climb có chữ b câm hoàn toàn, nguyên âm mở rộng /aɪ/.',
      },
      {
        wordA: 'while',
        ipaA: '/waɪl/',
        wordB: 'wild',
        ipaB: '/waɪld/',
        meaningA: 'trong khi (kết thúc bằng /l/)',
        meaningB: 'hoang dã (kết thúc bằng cụm /ld/)',
        distinctionVi: 'wild có âm bật /d/ dứt khoát sau âm /l/.',
      },
      {
        wordA: 'pass',
        ipaA: '/pæs/',
        wordB: 'path',
        ipaB: '/pæθ/',
        meaningA: 'con đèo núi (âm /s/)',
        meaningB: 'con đường mòn (âm /θ/ kẹp lưỡi)',
        distinctionVi: 'pass xì hơi hai răng khép, path kẹp đầu lưỡi giữa răng thổi hơi êm.',
      },
      {
        wordA: 'trail',
        ipaA: '/treɪl/',
        wordB: 'train',
        ipaB: '/treɪn/',
        meaningA: 'đường mòn rừng núi',
        meaningB: 'chuyến tàu hỏa',
        distinctionVi: 'trail kết thúc bằng âm uốn lưỡi /l/, train kết thúc bằng /n/.',
      },
    ],
    practiceSentences: [
      {
        sentence: 'About two years ago ↗↘, my university friends and I went on a spontaneous road trip.',
        phoneticTarget: 'əˈbaʊt tuː jɪrz əˈɡoʊ ↗↘, maɪ ˌjuːnɪˈvɜːrsəti frendz ənd aɪ went‿ɑːn‿ə spɑːnˈteɪniəs roʊd trɪp ↘',
        vietnameseTranslation: 'Khoảng hai năm trước, tôi cùng những người bạn đại học đã lên đường trong một chuyến đi phượt ngẫu hứng.',
      },
      {
        sentence: 'While we were hiking through the dense forest, a torrential rainstorm hit ↑!',
        phoneticTarget: 'waɪl wiː wɜːr ˈhaɪkɪŋ θruː ðə dens ˈfɔːrɪst ↗, ə təˈrenʃl ˈreɪnstɔːrm hɪt ↑ ↘',
        vietnameseTranslation: 'Trong khi chúng tôi đang leo núi qua cánh rừng rậm rạp, một trận mưa bão xối xả bất ngờ ập đến!',
      },
      {
        sentence: 'Through teamwork and mutual trust, we conquered the mountain peak safely.',
        phoneticTarget: 'θruː ˈtiːmwɜːrk ənd ˈmjuːtʃuəl trʌst ↗, wiː ˈkɑːŋkərd ðə ˈmaʊntn piːk ˈseɪfli ↘',
        vietnameseTranslation: 'Nhờ tinh thần đồng đội và sự tin tưởng lẫn nhau, chúng tôi đã chinh phục đỉnh núi an toàn.',
      },
    ],
  },

  // ── Stage 2: Core Patterns & Lexical Chunks ────────────────────────────────
  stage2CorePatterns: {
    titleVi: 'Khung cấu trúc tường thuật 5W1H (Storytelling Formula)',
    vietnameseGrammarRule:
      'Khung 5W1H giúp xây dựng bài nói kể chuyện có đầy đủ linh hồn và tình tiết kịch tính: 1) When & Who: "Roughly two years ago, I embarked on a journey with [Companions]." 2) Where & What: "We headed to [Location] to conquer [Challenging Goal]." 3) Why: "We did this because we desperately needed to escape [Pressure] and test our limits." 4) How: "While we were [Action], [Crisis] occurred. Through sheer determination and [Method], we triumphed and felt [Emotion]."',
    formula:
      'When & Who ([Time] + [Companions]) -> Where & What ([Destination] + [Mission]) -> Why ([Inner Motivation]) -> How ([Past Continuous + Crisis] -> [Resolution & Lesson]).',
    legoSlots: [
      {
        template:
          'About {time_ago}, I traveled with {companions} to {destination}. We decided to {mission_what} because {motivation_why}. While we were {ongoing_action}, suddenly {crisis_twist}. Through {resolution_how}, we finally conquered the challenge and felt {emotional_outcome}.',
        slots: {
          time_ago: [
            'two years ago during our summer break',
            'last November over a long weekend',
            'three years ago right after university graduation',
            'six months ago during an adventurous holiday',
          ],
          companions: [
            'my three adventurous college roommates',
            'a group of passionate amateur mountaineers',
            'my closest high school buddies',
            'colleagues from our software engineering team',
          ],
          destination: [
            'Ha Giang, a rugged mountainous province with breathtaking loops',
            'Ta Xua, a remote valley renowned for heavenly cloud hunting',
            'Phu Quoc island for an off-the-beaten-track coastal trek',
            'Bidoup National Park, surrounded by ancient primeval pine forests',
          ],
          mission_what: [
            'trek through a grueling thirty-kilometer mountain trail',
            'ride motorbikes across the most dangerous winding mountain passes',
            'camp overnight on a desolate mountain summit above the clouds',
            'navigate our way through dense rainforest using only a paper map',
          ],
          motivation_why: [
            'we desperately needed an escape from our hectic corporate schedules',
            'we wanted to push our physical boundaries and experience raw nature',
            'we promised to celebrate our youth with an unforgettable milestone',
            'we wanted to foster authentic camaraderie away from digital screens',
          ],
          ongoing_action: [
            'hiking the final steep ascent before sunset',
            'navigating a treacherous muddy pass in the twilight',
            'pitching our tents under rapidly darkening skies',
            'crossing a fast-flowing shallow rocky river',
          ],
          crisis_twist: [
            'a violent thunderstorm struck and flash flood warnings were issued',
            'one of our bikes completely stalled on an isolated cliffside',
            'our main lantern broke and dense freezing mist enveloped us completely',
            'our food supply got soaked and the temperature dropped sharply',
          ],
          resolution_how: [
            'pooling our remaining batteries and guiding each other step by step',
            'relying on the warm shelter and mechanical expertise of a generous ethnic family',
            'building a roaring campfire and sharing our dry rations equally',
            'staying composed, utilizing emergency whistles, and following the stream down',
          ],
          emotional_outcome: [
            'an immense sense of triumph and an unbreakable bond of friendship',
            'profound gratitude for human kindness and pride in our resilience',
            'exhilarated and deeply empowered to tackle any adversity in life',
            'relieved, humbled, and in love with the sheer majesty of nature',
          ],
        },
        examples: [
          {
            en: 'About two years ago during our summer break, I traveled with my three adventurous college roommates to Ha Giang, a rugged mountainous province with breathtaking loops. We decided to ride motorbikes across the most dangerous winding mountain passes because we promised to celebrate our youth with an unforgettable milestone. While we were navigating a treacherous muddy pass in the twilight, suddenly one of our bikes completely stalled on an isolated cliffside. Through relying on the warm shelter and mechanical expertise of a generous ethnic family, we finally conquered the challenge and felt profound gratitude for human kindness and pride in our resilience.',
            vi: 'Khoảng hai năm trước trong kỳ nghỉ hè, tôi đã đi cùng 3 người bạn cùng phòng đại học thích phiêu lưu đến Hà Giang, một tỉnh miền núi hiểm trở với những khúc cua ngoạn mục. Chúng tôi quyết định đi xe máy qua những con đèo quanh co nguy hiểm nhất vì chúng tôi đã hứa sẽ kỷ niệm tuổi trẻ bằng một cột mốc khó quên. Trong khi chúng tôi đang đi qua một con đèo lầy lội nguy hiểm trong ánh hoàng hôn, bỗng nhiên một chiếc xe bị chết máy hoàn toàn bên vách đá heo hút. Nhờ nương náu tại mái ấm và tài sửa xe của một gia đình đồng bào tốt bụng, chúng tôi đã vượt qua thử thách và cảm thấy lòng biết ơn sâu sắc cùng niềm tự hào về sự kiên cường.',
          },
          {
            en: 'About last November over a long weekend, I traveled with a group of passionate amateur mountaineers to Ta Xua, a remote valley renowned for heavenly cloud hunting. We decided to trek through a grueling thirty-kilometer mountain trail because we wanted to push our physical boundaries and experience raw nature. While we were hiking the final steep ascent before sunset, suddenly a violent thunderstorm struck and flash flood warnings were issued. Through pooling our remaining batteries and guiding each other step by step, we finally conquered the challenge and felt an immense sense of triumph and an unbreakable bond of friendship.',
            vi: 'Khoảng tháng 11 năm ngoái trong một kỳ nghỉ cuối tuần dài, tôi đã đi cùng một nhóm người leo núi nghiệp dư đầy đam mê đến Tà Xùa, một thung lũng xa xôi nổi tiếng về săn mây thiên đường. Chúng tôi quyết định đi bộ đường dài qua một cung đường rừng núi khắc nghiệt 30 cây số vì muốn thử thách giới hạn bản thân và hòa mình vào thiên nhiên hoang sơ. Trong khi đang leo chặng dốc cuối cùng trước hoàng hôn, bỗng một cơn bão sấm sét dữ dội ập đến và có cảnh báo lũ quét. Nhờ gom góp từng cục pin còn lại và dẫn đường cho nhau từng bước một, cuối cùng chúng tôi đã chinh phục thử thách và cảm nhận được niềm hân hoan chiến thắng to lớn cùng tình bạn keo sơn.',
          },
        ],
      },
    ],
    highFrequencyVocab: [
      {
        term: 'camaraderie',
        ipa: '/ˌkæm.əˈrɑː.dɚ.i/',
        partOfSpeech: 'noun',
        meaningVi: 'tình bạn gắn bó keo sơn, tình đồng chí cùng chia ngọt sẻ bùi',
        collocationHintVi: 'genuine camaraderie / spirit of camaraderie',
        exampleSentenceEn: 'Sharing hardship on the mountain forged deep camaraderie among our team members.',
        exampleSentenceVi: 'Chia sẻ gian khổ trên núi đã tôi luyện tình đồng đội sâu sắc giữa các thành viên chúng tôi.',
      },
      {
        term: 'conquer',
        ipa: '/ˈkɑːŋ.kɚ/',
        partOfSpeech: 'verb',
        meaningVi: 'chinh phục (đỉnh núi, nỗi sợ, thử thách)',
        collocationHintVi: 'conquer one’s fear / conquer the mountain peak',
        exampleSentenceEn: 'Standing on the windy summit, I felt we had conquered our biggest personal fears.',
        exampleSentenceVi: 'Đứng trên đỉnh núi lộng gió, tôi cảm thấy chúng tôi đã chinh phục nỗi sợ lớn nhất của bản thân.',
      },
      {
        term: 'daunting',
        ipa: '/ˈdɑːn.tɪŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'nản lòng, đầy thách thức gay go',
        collocationHintVi: 'daunting task / daunting challenge / seem daunting',
        exampleSentenceEn: 'Climbing up a vertical cliff in the dark was a daunting prospect.',
        exampleSentenceVi: 'Leo lên một vách đá thẳng đứng trong bóng tối là một viễn cảnh đầy nản lòng.',
      },
      {
        term: 'spontaneous',
        ipa: '/spɑːnˈteɪ.ni.əs/',
        partOfSpeech: 'adj',
        meaningVi: 'ngẫu hứng, tự phát, không lên kế hoạch trước',
        collocationHintVi: 'spontaneous trip / spontaneous decision',
        exampleSentenceEn: 'That spontaneous road trip turned out to be the best vacation of my life.',
        exampleSentenceVi: 'Chuyến đi phượt ngẫu hứng đó hóa ra lại là kỳ nghỉ tuyệt vời nhất trong đời tôi.',
      },
    ],
  },

  // ── Stage 3: Guided Dialogue ───────────────────────────────────────────────
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại tương tác: Kể về trải nghiệm phiêu lưu vượt khó',
    contextVi:
      'Hai người bạn (Partner và Learner) trò chuyện trong quán cà phê. Learner kể lại một trải nghiệm leo núi thót tim nhưng đáng nhớ áp dụng chuẩn mực 5W1H.',
    frameworkType: '5w1h',
    turns: [
      {
        speaker: 'Partner',
        en: 'I heard you went trekking in the northern mountains recently. Who did you go with and what happened?',
        vi: 'Mình nghe nói bạn mới đi leo núi ở vùng cao phía Bắc gần đây. Bạn đã đi với ai và chuyện gì đã xảy ra thế?',
        coreKeywords: ['trekking', 'Who did you go with', 'what happened'],
      },
      {
        speaker: 'Learner',
        en: 'Two years ago, I went with my university roommates to Ta Xua to conquer a grueling thirty-kilometer ridge.',
        vi: 'Hai năm trước, tôi cùng những người bạn cùng phòng đại học đến Tà Xùa để chinh phục một sống lưng núi khắc nghiệt dài 30 km. (When, Who, Where, What)',
        coreKeywords: ['Two years ago', 'roommates', 'Ta Xua', 'conquer thirty-kilometer ridge'],
        suggestedStartersVi: ['Two years ago, I went with...'],
      },
      {
        speaker: 'Partner',
        en: 'That sounds exhausting! Why did you guys decide to take on such a daunting challenge?',
        vi: 'Nghe kiệt sức quá! Tại sao các bạn lại quyết định đón nhận một thử thách nản lòng như vậy?',
        coreKeywords: ['Why did you decide', 'daunting challenge'],
      },
      {
        speaker: 'Learner',
        en: 'We wanted to test our physical limits and escape the constant digital stress of modern city life.',
        vi: 'Chúng tôi muốn thử thách giới hạn thể chất của mình và thoát khỏi sự căng thẳng kỹ thuật số thường trực nơi thành thị. (Why)',
        coreKeywords: ['test our physical limits', 'escape digital stress'],
        suggestedStartersVi: ['We wanted to test our...'],
      },
      {
        speaker: 'Partner',
        en: 'Did you run into any serious trouble along the way?',
        vi: 'Dọc đường các bạn có gặp rắc rối nghiêm trọng nào không?',
        coreKeywords: ['serious trouble', 'along the way'],
      },
      {
        speaker: 'Learner',
        en: 'While we were climbing the final peak, a freezing storm hit. But through teamwork and sharing our supplies, we reached the summit safely and felt true camaraderie.',
        vi: 'Trong khi chúng tôi đang leo đỉnh cuối cùng, một cơn bão lạnh giá ập tới. Nhưng nhờ tinh thần đồng đội và san sẻ đồ tiếp tế, chúng tôi đã lên tới đỉnh an toàn và cảm nhận được tình bạn keo sơn thực thụ. (How & Emotional outcome)',
        coreKeywords: ['While we were climbing', 'storm hit', 'teamwork', 'true camaraderie'],
        suggestedStartersVi: ['While we were climbing...', 'But through teamwork, we...'],
      },
    ],
  },

  // ── Stage 4: SafeHarbor Evaluation ────────────────────────────────────────
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Kể chuyện 5W1H trôi chảy 90s',
    promptVi:
      'Kể lại một trải nghiệm vượt qua thử thách hoặc một chuyến đi khó quên theo công thức 5W1H (When & Who -> Where & What -> Why -> How: Quá khứ tiếp diễn chen ngang quá khứ đơn -> Cảm xúc chiến thắng).',
    promptQuestionEn: 'Can you describe a challenging experience you had while traveling or studying?',
    targetSentence:
      'Two years ago, I traveled with my college friends to the mountains to hike a thirty-kilometer trail. We took on this challenge because we wanted to push our limits. While we were ascending the peak, a violent thunderstorm struck out of nowhere. Through mutual support and composure, we conquered the summit and felt immense camaraderie.',
    acceptableVariations: [
      'Last year, I worked with my colleagues on a crucial product launch in Da Nang. We took the project because we wanted to prove our capabilities. While we were conducting final user tests, our primary database crashed unexpectedly. Through relentless collaboration overnight, we resolved the bug and achieved remarkable success.',
      'Three years ago, I participated in a charity marathon in Hanoi with my siblings. We ran because we wanted to raise funds for underprivileged children. While I was running the twenty-fifth kilometer, severe cramps hit my legs. Through sheer willpower and encouragement from spectators, I crossed the finish line with great pride.',
    ],
    coreKeywords: [
      'Two years ago',
      'traveled with',
      'because we wanted to',
      'While we were',
      'suddenly',
      'Through',
      'conquered',
      'camaraderie',
    ],
    targetMeaningVi:
      'Hai năm trước, tôi đi cùng những người bạn đại học lên vùng núi để leo một cung đường 30 km. Chúng tôi đón nhận thử thách này vì muốn vượt qua giới hạn của bản thân. Trong khi chúng tôi đang leo lên đỉnh núi, một cơn dông bão dữ dội bất ngờ ập đến. Nhờ sự hỗ trợ lẫn nhau và giữ vững bình tĩnh, chúng tôi đã chinh phục đỉnh núi và cảm nhận được tình đồng đội to lớn.',
    instructionsVi:
      'Sử dụng phối hợp thì Quá khứ tiếp diễn và Quá khứ đơn. Giữ giọng kể kịch tính, hoàn thành trong vòng 90 giây không vấp, đạt tối thiểu 75 điểm.',
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
  },
};
