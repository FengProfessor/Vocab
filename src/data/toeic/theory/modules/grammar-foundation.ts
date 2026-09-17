import type { TheoryModule } from '../types';

export const grammarFoundationModule: TheoryModule = {
  id: 'grammar-foundation',
  title: 'Khối Ngữ Pháp Cốt Lõi & Điền Từ (Part 5 & 6)',
  shortTitle: 'Ngữ pháp Part 5 & 6',
  description:
    'Hệ thống toàn diện các quy tắc ngữ pháp trọng điểm, nhận diện dấu hiệu 5 giây, bẻ khóa bẫy cấu trúc ETS và phương pháp xử lý điền từ Part 5 & Part 6.',
  targetParts: [5, 6],
  icon: 'BookOpen',
  badgeColor: 'blue',
  lessons: [
    // =========================================================================
    // LESSON G01: Parts of Speech & 5-Second Rules
    // =========================================================================
    {
      id: 'toeic-grammar-01-parts-of-speech',
      moduleId: 'grammar-foundation',
      slug: 'parts-of-speech',
      order: 1,
      title: 'Chiến Thuật Xử Lý Từ Loại 5 Giây (Noun, Verb, Adj, Adv)',
      englishTitle: 'Parts of Speech & 5-Second Recognition Rules',
      targetPart: 5,
      targetSections: ['reading'],
      difficulty: 'starter',
      estimatedMinutes: 15,
      textbookSources: [
        'Hackers TOEIC Start Reading - Chapter 1-4',
        'Very Easy TOEIC Second Edition - Units 1-3',
        'Tomato TOEIC Compact Part 5&6 - Lesson 1',
      ],
      objectives: [
        'Nhận diện vị trí ngữ pháp của 4 từ loại cốt lõi (Danh từ, Tính từ, Trạng từ, Động từ) trong câu Part 5 dưới 5 giây.',
        'Ghi nhớ các hậu tố (suffixes) kinh điển của từng từ loại để chọn ngay đáp án mà không cần dịch nghĩa.',
        'Hóa giải bẫy từ loại gây nhầm lẫn cao nhất: Tính từ đuôi -ly (costly, timely) và Danh từ đuôi -al / -ive (proposal, approval, representative, initiative).',
        'Thành thạo công thức mở rộng cụm danh từ: a/an/the + [Adv] + [Adj] + [Noun].',
      ],
      sections: [
        {
          id: 'g01-s1-noun-positions',
          order: 1,
          title: 'Vị Trí Vàng Của Danh Từ (Noun) Trong Đề Thi TOEIC',
          sectionType: 'rules',
          contentMarkdown:
            'Trong Part 5, các câu hỏi về Danh từ chiếm tới **25-30%** tổng số câu từ loại. Thí sinh không cần dịch nghĩa toàn bộ câu mà chỉ cần quan sát từ đứng ngay trước và ngay sau chỗ trống để xác định vị trí danh từ.',
          formula: {
            pattern: 'Determiner / Preposition + (Adj) + [ NOUN ]',
            elements: [
              {
                symbol: 'Determiner',
                label: 'Từ hạn định',
                explanation: 'a, an, the, this, that, those, my, your, their, our, its',
                color: 'blue',
              },
              {
                symbol: '(Adj)',
                label: 'Tính từ (tùy chọn)',
                explanation: 'Bổ nghĩa cho danh từ đứng ngay sau',
                color: 'amber',
              },
              {
                symbol: '[ NOUN ]',
                label: 'Danh từ trung tâm',
                explanation: 'Vị trí bắt buộc phải điền danh từ làm lõi của cụm',
                color: 'emerald',
              },
            ],
            notes: 'Nếu sau chỗ trống đã có sẵn danh từ gốc, vị trí trống phía trước sẽ là Tính từ bổ nghĩa.',
          },
          tipBox: {
            title: 'Quy Tắc 5 Giây: Nhận Diện Đuôi Danh Từ',
            type: 'shortcut',
            content:
              'Khi 4 phương án A, B, C, D có chung gốc từ, hãy nhìn vào phần đuôi (suffix) để chọn ngay Danh từ mà không cần đọc hiểu nghĩa.',
            keySignals: [
              'Chỉ vật / khái niệm: -tion, -sion (production, decision), -ment (development), -ness (effectiveness), -ity (flexibility), -ance / -ence (maintenance, conference)',
              'Chỉ người / nghề nghiệp: -er, -or (manager, supervisor), -ant, -ent (accountant, resident), -ist (specialist)',
            ],
          },
          examples: [
            {
              context: 'Phê duyệt ngân sách công ty',
              english: 'The executive committee gave final _______ for the overseas marketing campaign.',
              vietnamese: 'Ban điều hành đã đưa ra sự chấp thuận cuối cùng cho chiến dịch tiếp thị ở nước ngoài.',
              analysis:
                'Sau tính từ "final" và trước giới từ "for", vị trí này bắt buộc phải là một Danh từ (approval).',
              highlights: ['final', 'approval', 'for'],
            },
          ],
        },
        {
          id: 'g01-s2-adj-adv-positions',
          order: 2,
          title: 'Vị Trí Tính Từ & Trạng Từ: Công Thức Bổ Nghĩa Chuẩn Xác',
          sectionType: 'rules',
          contentMarkdown:
            'Tính từ và Trạng từ là cặp bài trùng thường xuyên bị đem ra làm bẫy. Hãy nắm vững nguyên tắc bổ nghĩa: **Tính từ bổ nghĩa cho Danh từ**, còn **Trạng từ bổ nghĩa cho Động từ, Tính từ, hoặc một Trạng từ khác**.',
          formula: {
            pattern: 'Subject + Verb + [ ADV ] + Verb(V-ed/V3) OR Linking Verb + [ ADJ ]',
            elements: [
              {
                symbol: 'Linking Verb',
                label: 'Động từ nối',
                explanation: 'be, seem, remain, become, stay, appear, look',
                color: 'purple',
              },
              {
                symbol: '[ ADJ ]',
                label: 'Tính từ',
                explanation: 'Đóng vai trò vị ngữ miêu tả trạng thái của chủ ngữ',
                color: 'emerald',
              },
              {
                symbol: '[ ADV ]',
                label: 'Trạng từ (-ly)',
                explanation: 'Đứng chen giữa trợ động từ (have/has, be, will) và động từ chính',
                color: 'blue',
              },
            ],
            notes: 'Trạng từ có thể bị xóa khỏi câu mà câu vẫn hoàn chỉnh về mặt ngữ pháp.',
          },
          comparisonTable: {
            title: 'So Sánh Vị Trí Của Tính Từ (Adj) vs Trạng Từ (Adv)',
            headers: ['Đặc điểm nhận diện', 'Tính từ (Adjective)', 'Trạng từ (Adverb)'],
            rows: [
              {
                colValues: [
                  'Đứng trước Danh từ',
                  'Có: a reliable supplier (nhà cung cấp đáng tin cậy)',
                  'Không (trừ khi bổ nghĩa cho cả cụm tính từ)',
                ],
                highlight: true,
                badge: 'Vị trí vàng',
              },
              {
                colValues: [
                  'Sau Linking Verbs',
                  'The policy remains effective (chính sách vẫn có hiệu lực)',
                  'Không dùng trực tiếp làm bổ ngữ cho linking verb',
                ],
                highlight: false,
              },
              {
                colValues: [
                  'Chen giữa Be + V3 (Bị động)',
                  'Không đứng vị trí này',
                  'The report was thoroughly reviewed (được xem xét kỹ lưỡng)',
                ],
                highlight: true,
                badge: 'Xuất hiện 90%',
              },
              {
                colValues: [
                  'Đứng cuối câu hoàn chỉnh',
                  'Không đứng sau câu S + V + O hoàn chỉnh',
                  'The team completed the task efficiently (hoàn thành hiệu quả)',
                ],
                highlight: false,
              },
            ],
            summaryNote: 'Nếu câu đã đủ S + V + O hoàn chỉnh, 95% vị trí còn trống ở cuối câu là Trạng từ (-ly).',
          },
        },
        {
          id: 'g01-s3-traps-suffix-confusion',
          order: 3,
          title: 'Cảnh Báo Bẫy Đuôi Lừa: Tính Từ Đuôi -ly & Danh Từ Đuôi -al / -ive',
          sectionType: 'traps',
          trapAlert: {
            trapName: 'Bẫy Tính Từ Đuôi -ly & Danh Từ Đuôi -al / -ive',
            trapLevel: 'high_distractor',
            trapDescription:
              'Thí sinh thường rập khuôn "từ nào có đuôi -ly cũng là Trạng từ" và "đuôi -al / -ive luôn là Tính từ". ETS rất thích ra đề các từ ngoại lệ này ở các câu điểm 700+.',
            distractorExample: {
              prompt: 'The IT department provided _______ assistance to resolve the network malfunction.',
              incorrectChoice: '(A) time (chọn danh từ vì tưởng timely là trạng từ)',
              correctChoice: '(C) timely (tính từ: kịp thời, bổ nghĩa cho danh từ assistance)',
              whyDistractorFails:
                'Thí sinh nghĩ "timely" có đuôi -ly nên là trạng từ, mà trước danh từ assistance không thể điền trạng từ nên chọn nhầm danh từ ghép "time".',
            },
            antidote:
              'Học thuộc nhóm Danh từ + ly = Tính từ: timely (kịp thời), costly (tốn kém), friendly (thân thiện), orderly (ngăn nắp). Thuộc nhóm Danh từ đuôi -al / -ive: proposal (bản đề xuất), approval (sự phê duyệt), arrival (sự đến nơi), removal (sự gỡ bỏ), representative (người đại diện), initiative (sáng kiến), alternative (phương án thay thế).',
          },
          comparisonTable: {
            title: 'Bảng Từ Vựng "Ngoại Lệ Đuôi Lừa" Hay Gặp Nhất Trong Đề ETS',
            headers: ['Từ vựng', 'Đuôi nhận diện', 'Từ loại thật', 'Ý nghĩa công sở'],
            rows: [
              { colValues: ['timely', '-ly', 'Tính từ (Adj)', 'kịp thời, đúng lúc'], highlight: true, badge: 'Bẫy điểm cao' },
              { colValues: ['costly', '-ly', 'Tính từ (Adj)', 'tốn kém, đắt đỏ'], highlight: true },
              { colValues: ['proposal', '-al', 'Danh từ (Noun)', 'bản đề xuất, dự án'], highlight: true, badge: 'Siêu phổ biến' },
              { colValues: ['approval', '-al', 'Danh từ (Noun)', 'sự phê chuẩn, chấp thuận'], highlight: false },
              { colValues: ['representative', '-ive', 'Danh từ (Noun)', 'người đại diện'], highlight: true, badge: 'Gặp liên tục' },
              { colValues: ['initiative', '-ive', 'Danh từ (Noun)', 'sáng kiến, chiến lược mới'], highlight: false },
              { colValues: ['alternative', '-ive', 'Danh từ (Noun)', 'phương án thay thế'], highlight: false },
            ],
            summaryNote: 'Khi thấy representative đứng sau a/the/our -> Chắc chắn là Danh từ (chỉ người), đừng nhầm là tính từ!',
          },
        },
        {
          id: 'g01-s4-shortcuts-5sec-workflow',
          order: 4,
          title: 'Chiến Thuật 3 Bước Giải Quyết Câu Từ Loại Dưới 5 Giây',
          sectionType: 'shortcuts',
          contentMarkdown:
            'Áp dụng quy trình 3 bước sau đây sẽ giúp bạn tiết kiệm trung bình 8 phút cho Part 5 để dành trọn thời gian cho Part 7:',
          keyTakeaways: [
            'Bước 1: Liếc nhanh 4 phương án A, B, C, D — nếu chung gốc từ (chỉ khác đuôi), xác định ngay đây là câu hỏi TỪ LOẠI, TUYỆT ĐỐI KHÔNG DỊCH NGHĨA.',
            'Bước 2: Nhìn 1 từ ngay trước và 1 từ ngay sau chỗ trống để xác định cấu trúc ngữ pháp cần điền (cụm danh từ, sau be, hay giữa trợ động từ và V3).',
            'Bước 3: Đối chiếu với các hậu tố nhận diện để chọn đáp án trong vòng 5 giây.',
          ],
        },
      ],
      checkpoints: [
        {
          id: 'g01-cp1',
          order: 1,
          prompt: 'The new laboratory facility contains the most advanced _______ in the medical technology sector.',
          options: [
            { key: 'A', text: 'equip' },
            { key: 'B', text: 'equipment' },
            { key: 'C', text: 'equipped' },
            { key: 'D', text: 'equippable' },
          ],
          correctAnswer: 'B',
          explanationVi:
            'Phân tích cấu trúc: Sau cụm từ chỉ định và tính từ so sánh nhất "the most advanced" (tính từ), vị trí chỗ trống bắt buộc phải là một Danh từ để làm trung tâm của cụm danh từ. "Equipment" mang đuôi danh từ không đếm được -ment. (A) equip là động từ nguyên mẫu; (C) equipped là phân từ/quá khứ; (D) equippable là tính từ. Lưu ý: Equipment là danh từ không đếm được trong tiếng Anh, không bao giờ thêm "s".',
          trapSignal: 'Chọn động từ equip hoặc tính từ equippable do nhầm vị trí sau tính từ.',
          timeTargetSeconds: 12,
        },
        {
          id: 'g01-cp2',
          order: 2,
          prompt: 'The board of directors granted their final _______ for the merger with Zenith Enterprises yesterday.',
          options: [
            { key: 'A', text: 'approve' },
            { key: 'B', text: 'approved' },
            { key: 'C', text: 'approval' },
            { key: 'D', text: 'approvingly' },
          ],
          correctAnswer: 'C',
          explanationVi:
            'Phân tích cấu trúc: Đứng sau tính từ sở hữu "their" và tính từ "final", chỗ trống bắt buộc phải là Danh từ. "Approval" là danh từ mang nghĩa "sự phê chuẩn/chấp thuận". (A) approve là động từ; (B) approved là quá khứ phân từ; (D) approvingly là trạng từ. Đây là bẫy đuôi -al kinh điển: nhiều thí sinh nhầm tưởng từ tận cùng -al là tính từ nên không dám chọn làm danh từ.',
          trapSignal: 'Bẫy đuôi -al: Tưởng approval là tính từ nên phân vân hoặc chọn nhầm trạng từ approvingly.',
          timeTargetSeconds: 15,
        },
        {
          id: 'g01-cp3',
          order: 3,
          prompt: 'The regional sales director has _______ concluded the annual performance evaluations for all branch managers.',
          options: [
            { key: 'A', text: 'successful' },
            { key: 'B', text: 'successfully' },
            { key: 'C', text: 'success' },
            { key: 'D', text: 'succeed' },
          ],
          correctAnswer: 'B',
          explanationVi:
            'Phân tích cấu trúc: Vị trí đứng xen giữa trợ động từ "has" và quá khứ phân từ "concluded" (thì Hiện tại hoàn thành) luôn luôn là TRẠNG TỪ (Adverb) để bổ nghĩa cho động từ đó. Công thức: have/has + [ ADV ] + V3/ed. Do đó "successfully" (-ly) là đáp án duy nhất đúng. (A) successful là tính từ; (C) success là danh từ; (D) succeed là động từ.',
          trapSignal: 'Chọn tính từ successful vì nghĩ đứng trước concluded là tính từ.',
          timeTargetSeconds: 10,
        },
        {
          id: 'g01-cp4',
          order: 4,
          prompt: 'Thanks to the maintenance crew’s _______ response, the power outage caused no loss of confidential banking data.',
          options: [
            { key: 'A', text: 'timely' },
            { key: 'B', text: 'timed' },
            { key: 'C', text: 'timeliness' },
            { key: 'D', text: 'timer' },
          ],
          correctAnswer: 'A',
          explanationVi:
            'Phân tích cấu trúc: Trước danh từ "response" và sau sở hữu cách "maintenance crew’s", ta cần một TÍNH TỪ để bổ nghĩa cho "response". "Timely" là tính từ đặc biệt có đuôi -ly, mang nghĩa "kịp thời, đúng lúc" (a timely response = phản hồi kịp thời). (B) timed là quá khứ phân từ mang nghĩa được tính giờ; (C) timeliness là danh từ; (D) timer là danh từ chỉ thiết bị hẹn giờ.',
          trapSignal: 'Né tránh timely vì nghĩ đuôi -ly là trạng từ, dẫn đến chọn sai danh từ timeliness hoặc timed.',
          timeTargetSeconds: 15,
        },
      ],
      bridgeToPractice: {
        targetPart: 5,
        partName: 'Part 5: Incomplete Sentences',
        recommendedQuestionCount: 20,
        filterMode: 'unseen',
        practiceUrl: '/toeic/exam/bank?part=5&limit=20&mode=practice&filterMode=unseen',
        ctaText: 'Luyện ngay 20 câu Part 5 Từ loại & 5 Giây',
      },
    },

    // =========================================================================
    // LESSON G02: Tenses & S-V Agreement
    // =========================================================================
    {
      id: 'toeic-grammar-02-tenses-sv-agreement',
      moduleId: 'grammar-foundation',
      slug: 'tenses-and-agreement',
      order: 2,
      title: 'Thì Thời Gian & Sự Hòa Hợp Chủ Vị (Tenses & S-V Agreement)',
      englishTitle: 'Verb Tenses & Subject-Verb Agreement Mastery',
      targetPart: 5,
      targetSections: ['reading'],
      difficulty: 'starter',
      estimatedMinutes: 20,
      textbookSources: [
        'Hackers TOEIC Start Reading - Chapter 5',
        'Tomato TOEIC Compact Part 5&6 - Lesson 2',
        'Tactics for TOEIC - Unit 3',
      ],
      objectives: [
        'Nắm vững quy trình 4 bước chuẩn để giải quyết mọi câu hỏi động từ: Động từ chính -> Số ít/nhiều -> Chủ động/Bị động -> Dấu hiệu thì.',
        'Thuộc lòng các dấu hiệu thì tần suất xuất hiện cao nhất trong đề thi TOEIC: recently, since, prior to, currently, by the time.',
        'Hóa giải triệt để bẫy Chủ ngữ kéo dài: Cụm giới từ chen giữa (The quality of these products [is/are]).',
        'Phân biệt danh từ tận cùng có "s" nhưng là số ít (news, economics) và đại từ bất định chia số ít (each, every, anyone).',
      ],
      sections: [
        {
          id: 'g02-s1-four-step-verb-workflow',
          order: 1,
          title: 'Quy Trình 4 Bước Chuẩn Để Giải Câu Động Từ',
          sectionType: 'rules',
          contentMarkdown:
            'Khi 4 phương án chứa các biến thể chia thì của cùng một động từ, đừng vội dịch nghĩa! Hãy tuân thủ nghiêm ngặt quy trình 4 bước loại trừ sau:',
          formula: {
            pattern: 'Step 1 (Main Verb) -> Step 2 (Singular / Plural) -> Step 3 (Voice) -> Step 4 (Tense Markers)',
            elements: [
              {
                symbol: 'Step 1: Main Verb',
                label: 'Kiểm tra Động từ chính',
                explanation: 'Câu đã có động từ chính chưa? Nếu chưa, loại ngay các phương án V-ing, To-V.',
                color: 'blue',
              },
              {
                symbol: 'Step 2: S-V Number',
                label: 'Xét Số ít / Số nhiều',
                explanation: 'Xác định danh từ lõi của chủ ngữ để loại phương án chia sai số lượng.',
                color: 'emerald',
              },
              {
                symbol: 'Step 3: Voice',
                label: 'Xét Chủ động / Bị động',
                explanation: 'Xem sau chỗ trống có tân ngữ danh từ hay không (Có O -> Chủ động, Không O -> Bị động).',
                color: 'amber',
              },
              {
                symbol: 'Step 4: Tense',
                label: 'Xét Dấu hiệu thì',
                explanation: 'Tìm trạng từ chỉ thời gian (recently, tomorrow, last year) để chốt thì chính xác.',
                color: 'purple',
              },
            ],
            notes: 'Tuân thủ đúng thứ tự 1 -> 2 -> 3 -> 4 giúp bạn loại bỏ ít nhất 2 phương án sai ngay từ bước 1 và 2!',
          },
          examples: [
            {
              context: 'Email thông báo lịch họp ban điều hành',
              english: 'Mr. Tanaka will present the quarterly financial assessment to the board of directors tomorrow morning.',
              vietnamese: 'Ông Tanaka sẽ trình bày bản đánh giá tài chính hàng quý trước hội đồng quản trị vào sáng mai.',
              analysis:
                'Áp dụng quy trình 4 bước: (1) Câu chưa có động từ chính; (2) Chủ ngữ số ít Mr. Tanaka; (3) Sau chỗ trống có cụm danh từ tân ngữ "the quarterly financial assessment" -> Thể chủ động; (4) Dấu hiệu thời gian tương lai "tomorrow morning" -> Chia thì tương lai đơn "will present".',
              highlights: ['Mr. Tanaka', 'will present', 'quarterly financial assessment', 'tomorrow morning'],
            },
          ],
        },
        {
          id: 'g02-s2-high-yield-tense-markers',
          order: 2,
          title: 'Bảng Dấu Hiệu Thì Sống Còn Trong Đề Thi ETS',
          sectionType: 'comparison',
          contentMarkdown:
            'ETS không bao giờ bắt bạn đoán mò thì thời gian. Luôn có một "từ chìa khóa" (Time Marker) xuất hiện trong câu để chỉ điểm thì cần chia:',
          comparisonTable: {
            title: 'Các Trạng Từ Chỉ Thời Gian Kinh Điển & Thì Tương Ứng',
            headers: ['Thì thời gian', 'Dấu hiệu nhận biết bắt buộc', 'Ví dụ câu chuẩn ETS'],
            rows: [
              {
                colValues: [
                  'Hiện tại hoàn thành (have/has + V3)',
                  'recently, lately, since + mốc quá khứ, over / for / in the past / last 5 years',
                  'Ms. Lin has recently been promoted to VP.',
                ],
                highlight: true,
                badge: 'Tần suất cao nhất',
              },
              {
                colValues: [
                  'Quá khứ đơn (V-ed / V2)',
                  'yesterday, ago, last month, in + năm quá khứ (in 2021), formerly, previously',
                  'The factory completed the audit last week.',
                ],
                highlight: false,
              },
              {
                colValues: [
                  'Tương lai đơn (will + V)',
                  'tomorrow, next, upcoming, soon, shortly, as of + ngày tương lai',
                  'The CEO will announce new policies soon.',
                ],
                highlight: false,
              },
              {
                colValues: [
                  'Hiện tại tiếp diễn (am/is/are + V-ing)',
                  'currently, at present, right now, at the moment',
                  'We are currently expanding our retail chain.',
                ],
                highlight: true,
                badge: 'Gặp rất nhiều',
              },
              {
                colValues: [
                  'Hoàn thành với "By the time"',
                  'By the time + S + V(quá khứ) -> Vế kia chia Quá khứ hoàn thành (had + V3); By the time + S + V(hiện tại) -> Vế kia chia Tương lai hoàn thành (will have + V3)',
                  'By the time the store opened, a crowd had gathered.',
                ],
                highlight: true,
                badge: 'Câu điểm 800+',
              },
            ],
            summaryNote: 'Cụm "over the past three years" LUÔN LUÔN đi với thì Hiện tại hoàn thành, không đi với quá khứ đơn.',
          },
          examples: [
            {
              context: 'Báo cáo thường niên của tập đoàn bán lẻ',
              english: 'Over the past three years, Apex Retail has expanded its distribution network across Southeast Asia.',
              vietnamese: 'Trong suốt ba năm qua, tập đoàn Apex Retail đã mở rộng mạng lưới phân phối trên khắp Đông Nam Á.',
              analysis:
                'Cụm trạng ngữ thời gian "Over the past three years" là dấu hiệu nhận biết bắt buộc của thì Hiện tại hoàn thành (has expanded). Chủ ngữ "Apex Retail" là tên riêng doanh nghiệp (số ít) nên dùng trợ động từ "has".',
              highlights: ['Over the past three years', 'has expanded', 'distribution network'],
            },
          ],
        },
        {
          id: 'g02-s3-sv-agreement-traps',
          order: 3,
          title: 'Bẫy Chủ Ngữ Kéo Dài & Danh Từ Đánh Lừa',
          sectionType: 'traps',
          trapAlert: {
            trapName: 'Bẫy Danh Từ Phụ Chen Giữa Làm Nhiễu Chủ Ngữ Thật',
            trapLevel: 'high_distractor',
            trapDescription:
              'Đề thi TOEIC thường cố tình chèn một cụm giới từ dài giữa Chủ ngữ và Động từ. Thí sinh hay nhìn vào danh từ đứng ngay sát trước chỗ trống và chia động từ theo danh từ đó, dẫn đến sai sót đáng tiếc.',
            distractorExample: {
              prompt: 'The comprehensive analysis of consumer shopping habits _______ presented at yesterday’s meeting.',
              incorrectChoice: '(A) were (chia số nhiều vì nhìn thấy habits số nhiều đứng sát)',
              correctChoice: '(B) was (chủ ngữ thật là The comprehensive analysis - danh từ số ít)',
              whyDistractorFails:
                'Cụm "of consumer shopping habits" chỉ là thành phần bổ ngữ chỉ giới từ, không thể làm chủ ngữ của câu.',
            },
            antidote:
              'Khi thấy giới từ (of, in, with, for, to) đứng sau danh từ đầu câu, hãy đóng ngoặc đơn toàn bộ cụm [of...] lại và gạch bỏ tạm thời. Chủ ngữ thật chính là danh từ đứng TRƯỚC giới từ đầu tiên!',
          },
          comparisonTable: {
            title: 'Quy Tắc Hòa Hợp Chủ Vị Đặc Biệt Cần Thuộc Lòng',
            headers: ['Chủ ngữ đặc biệt', 'Quy tắc chia Động từ', 'Ví dụ minh họa'],
            rows: [
              {
                colValues: ['Each / Every + N số ít', 'Động từ chia SỐ ÍT', 'Each employee receives an ID badge.'],
                highlight: true,
                badge: 'Bẫy phổ biến',
              },
              {
                colValues: [
                  'A number of + N số nhiều',
                  'Động từ chia SỐ NHIỀU (= Many)',
                  'A number of candidates were interviewed.',
                ],
                highlight: true,
              },
              {
                colValues: [
                  'The number of + N số nhiều',
                  'Động từ chia SỐ ÍT (Chỉ số lượng)',
                  'The number of participants has increased.',
                ],
                highlight: true,
                badge: 'Bẫy kinh điển',
              },
              {
                colValues: [
                  'Danh từ tận cùng "s" nhưng số ít',
                  'Động từ chia SỐ ÍT (news, economics, physics)',
                  'The economic news is very promising.',
                ],
                highlight: false,
              },
              {
                colValues: [
                  'Danh động từ V-ing làm chủ ngữ',
                  'Động từ chia SỐ ÍT',
                  'Upgrading the servers requires approval.',
                ],
                highlight: false,
              },
            ],
          },
          examples: [
            {
              context: 'Bản ghi nhớ kiểm toán cơ sở vật chất',
              english: 'The recent surge in online orders and customer inquiries has created an urgent need for additional warehouse personnel.',
              vietnamese: 'Sự gia tăng đột biến gần đây về đơn hàng trực tuyến và các yêu cầu từ khách hàng đã tạo ra nhu cầu cấp bách về thêm nhân sự kho bãi.',
              analysis:
                'Bẫy chủ ngữ kéo dài: Cụm danh từ "in online orders and customer inquiries" là bổ ngữ giới từ xen giữa. Danh từ lõi của chủ ngữ đứng trước giới từ "in" là "The recent surge" (danh từ số ít), do đó động từ chính phải chia số ít là "has created", tuyệt đối không chia số nhiều theo "orders" hay "inquiries".',
              highlights: ['recent surge', 'in online orders', 'has created', 'urgent need'],
            },
          ],
        },
        {
          id: 'g02-s4-time-clause-rule',
          order: 4,
          title: 'Quy Tắc Mệnh Đề Trạng Ngữ Chỉ Thời Gian & Điều Kiện',
          sectionType: 'shortcuts',
          tipBox: {
            title: 'Tuyệt Đối Không Dùng "Will" Trong Mệnh Đề Chỉ Thời Gian',
            type: 'warning',
            content:
              'Trong các mệnh đề trạng ngữ bắt đầu bằng liên từ thời gian hoặc điều kiện (when, as soon as, once, before, after, if, unless), hành động dù diễn ra ở tương lai nhưng KHÔNG BAO GIỜ dùng thì Tương lai (will + V). Ta phải dùng THÌ HIỆN TẠI ĐƠN để thay thế.',
            keySignals: [
              'Công thức: When / As soon as / Once + S + V(Hiện tại đơn), S + will + V(nguyên mẫu)',
              'Ví dụ: As soon as the shipment arrives (NOT: will arrive), we will notify you immediately.',
            ],
          },
          examples: [
            {
              context: 'Quy trình xử lý đơn đặt hàng thiết bị',
              english: 'As soon as the logistics team receives the signed shipping manifest, they will release the cargo for delivery.',
              vietnamese: 'Ngay khi đội ngũ hậu cần nhận được bản kê khai vận chuyển đã ký, họ sẽ xuất hàng để chuyển phát.',
              analysis:
                'Quy tắc mệnh đề thời gian: Trong mệnh đề bắt đầu bằng liên từ thời gian "As soon as", động từ phải chia ở thì Hiện tại đơn ("receives" theo chủ ngữ số ít "logistics team"), không được dùng thì tương lai "will receive", mặc dù mệnh đề chính chia ở tương lai "will release".',
              highlights: ['As soon as', 'receives', 'shipping manifest', 'will release'],
            },
          ],
        },
      ],
      checkpoints: [
        {
          id: 'g02-cp1',
          order: 1,
          prompt: 'The total expenditure on renovation materials and labor _______ significantly higher than the initial budget projection.',
          options: [
            { key: 'A', text: 'were' },
            { key: 'B', text: 'are' },
            { key: 'C', text: 'have been' },
            { key: 'D', text: 'is' },
          ],
          correctAnswer: 'D',
          explanationVi:
            'Phân tích cấu trúc: Chủ ngữ của câu là "The total expenditure" (danh từ số ít: tổng mức chi tiêu). Cụm "on renovation materials and labor" là bổ ngữ giới từ đứng xen giữa không làm thay đổi số lượng của chủ ngữ. Do chủ ngữ số ít, động từ to be phải chia số ít là "is" (phương án D). Các phương án (A) were, (B) are, (C) have been đều là động từ chia số nhiều. Thí sinh dễ bị đánh lừa bởi danh từ số nhiều "materials" đứng sát chỗ trống.',
          trapSignal: 'Bẫy chủ ngữ kéo dài: Nhìn danh từ "materials" số nhiều sát chỗ trống nên chọn số nhiều "are" hoặc "were".',
          timeTargetSeconds: 15,
        },
        {
          id: 'g02-cp2',
          order: 2,
          prompt: 'Dr. Evelyn Vance _______ as the chief financial adviser to the board of directors since Mr. Harrison retired last year.',
          options: [
            { key: 'A', text: 'has served' },
            { key: 'B', text: 'serves' },
            { key: 'C', text: 'served' },
            { key: 'D', text: 'is serving' },
          ],
          correctAnswer: 'A',
          explanationVi:
            'Phân tích dấu hiệu thì: Câu có mệnh đề chỉ mốc thời gian bắt đầu trong quá khứ "since Mr. Harrison retired last year" (kể từ khi ông Harrison nghỉ hưu năm ngoái). Cấu trúc chuẩn với since: Mệnh đề chính chia thì HIỆN TẠI HOÀN THÀNH (have/has + V3), mệnh đề sau since chia Quá khứ đơn. Vì chủ ngữ Dr. Evelyn Vance là ngôi thứ ba số ít, ta chọn "has served" (phương án A). (B) serves là hiện tại đơn; (C) served là quá khứ đơn; (D) is serving là hiện tại tiếp diễn.',
          trapSignal: 'Thấy từ "retired last year" vội vàng chọn quá khứ đơn (served) mà quên mất từ nối "since".',
          timeTargetSeconds: 12,
        },
        {
          id: 'g02-cp3',
          order: 3,
          prompt: 'By the time the new assembly plant opens next November, the engineering team _______ the machinery safety checks.',
          options: [
            { key: 'A', text: 'completed' },
            { key: 'B', text: 'will have completed' },
            { key: 'C', text: 'has completed' },
            { key: 'D', text: 'completes' },
          ],
          correctAnswer: 'B',
          explanationVi:
            'Phân tích công thức "By the time": Khi mệnh đề "By the time" đi với động từ ở thì hiện tại đơn (opens) để chỉ một mốc trong tương lai (next November), mệnh đề chính bắt buộc phải chia ở thì TƯƠNG LAI HOÀN THÀNH (will have + V3/ed) để diễn tả hành động sẽ được hoàn tất trước thời điểm đó. Do đó "will have completed" (phương án B) là đáp án chính xác duy nhất. (A) completed là quá khứ đơn; (C) has completed là hiện tại hoàn thành; (D) completes là hiện tại đơn.',
          trapSignal: 'Nhầm lẫn thì của mệnh đề chính khi gặp "By the time" trong tương lai.',
          timeTargetSeconds: 15,
        },
        {
          id: 'g02-cp4',
          order: 4,
          prompt: 'The audit committee confirmed that each of the departmental expense reports _______ strict verification by the accounting team.',
          options: [
            { key: 'A', text: 'require' },
            { key: 'B', text: 'requiring' },
            { key: 'C', text: 'requires' },
            { key: 'D', text: 'have required' },
          ],
          correctAnswer: 'C',
          explanationVi:
            'Phân tích cấu trúc: Chủ ngữ của mệnh đề danh ngữ là "each of the departmental expense reports". Cấu trúc quy tắc: "Each of + Danh từ số nhiều" luôn luôn đi kèm với ĐỘNG TỪ CHIA SỐ ÍT. Do đó động từ phải thêm "s" -> "requires" (phương án C). (A) require là động từ số nhiều; (B) requiring là dạng V-ing không thể làm động từ chính; (D) have required chia số nhiều theo trợ động từ have.',
          trapSignal: 'Bẫy Each of: Nhìn thấy "reports" số nhiều nên vội vã chọn động từ số nhiều require.',
          timeTargetSeconds: 12,
        },
      ],
      bridgeToPractice: {
        targetPart: 5,
        partName: 'Part 5: Incomplete Sentences',
        recommendedQuestionCount: 20,
        filterMode: 'unseen',
        practiceUrl: '/toeic/exam/bank?part=5&limit=20&mode=practice&filterMode=unseen',
        ctaText: 'Luyện ngay 20 câu Part 5 Thì & Sự hòa hợp S-V',
      },
    },

    // =========================================================================
    // LESSON G03: Prepositions vs Conjunctions vs Conjunctive Adverbs
    // =========================================================================
    {
      id: 'toeic-grammar-03-prepositions-conjunctions',
      moduleId: 'grammar-foundation',
      slug: 'prepositions-vs-conjunctions',
      order: 3,
      title: 'Đại Chiến: Giới Từ vs. Liên Từ vs. Trạng Từ Liên Kết',
      englishTitle: 'Prepositions vs. Conjunctions vs. Conjunctive Adverbs',
      targetPart: 5,
      targetSections: ['reading'],
      difficulty: 'intermediate',
      estimatedMinutes: 20,
      textbookSources: [
        'Tomato TOEIC Compact Part 5&6 - Lesson 7',
        'Hackers TOEIC Reading - Chapter 9',
        'Tactics for TOEIC - Unit 7',
      ],
      objectives: [
        'Nắm vững quy tắc vàng nhận diện cấu trúc sau chỗ trống: Liên từ + Mệnh đề (S + V) vs Giới từ + Danh từ / V-ing vs Trạng từ liên kết đứng biệt lập ngăn cách bằng dấu phẩy.',
        'Nằm lòng các cặp từ đồng nghĩa nhưng khác loại hay gặp nhất: Although/Despite, Because/Due to, While/During.',
        'Phát hiện và né tránh bẫy công thức lai ghép (Despite of - SAI, Due to the fact that + Clause).',
        'Phân biệt rõ ràng cách dùng của During (+ Danh từ sự kiện) vs For (+ Khoảng thời gian có số).',
      ],
      sections: [
        {
          id: 'g03-s1-the-golden-rule',
          order: 1,
          title: 'Quy Tắc Vàng: Nhìn Sau Chỗ Trống Định Đoạt Đáp Án',
          sectionType: 'rules',
          contentMarkdown:
            'Trong Part 5, ETS liên tục đặt các từ có cùng ý nghĩa (ví dụ: "mặc dù", "bởi vì") vào 4 phương án, nhưng một từ là Liên từ còn từ kia là Giới từ. Cách xử lý duy nhất là **nhìn ngay thành phần ngữ pháp đứng sau chỗ trống**:',
          formula: {
            pattern: '[ CONJUNCTION ] + S + V + O  VS  [ PREPOSITION ] + Noun / Noun Phrase / V-ing',
            elements: [
              {
                symbol: 'Conjunction',
                label: 'Liên từ phụ thuộc',
                explanation: 'Bắt buộc nối 2 mệnh đề (phải có đầy đủ Chủ ngữ S và Động từ chia thì V)',
                color: 'blue',
              },
              {
                symbol: 'Preposition',
                label: 'Giới từ',
                explanation: 'Chỉ được phép đi kèm với Danh từ, Cụm danh từ hoặc Danh động từ V-ing',
                color: 'emerald',
              },
              {
                symbol: 'Conjunctive Adverb',
                label: 'Trạng từ liên kết',
                explanation: 'Đứng sau dấu chấm hoặc chấm phẩy, ngăn cách với câu bằng dấu phẩy (,)',
                color: 'purple',
              },
            ],
            notes: 'Nếu sau chỗ trống chỉ là một cụm danh từ dài mà không có động từ chia thì -> 100% chọn GIỚI TỪ!',
          },
          examples: [
            {
              context: 'Thông báo về tiến độ dự án nhà máy mới',
              english: 'Although the construction crew faced severe supply chain disruptions, the industrial plant opened on schedule.',
              vietnamese: 'Mặc dù đội thi công phải đối mặt với sự gián đoạn nghiêm trọng của chuỗi cung ứng, nhà máy công nghiệp vẫn khai trương đúng tiến độ.',
              analysis:
                'Quy tắc sau chỗ trống: Sau từ nối là một mệnh đề hoàn chỉnh gồm Chủ ngữ "the construction crew" và Động từ "faced", nên bắt buộc phải dùng LIÊN TỪ "Although", không dùng giới từ "Despite" hay "In spite of".',
              highlights: ['Although', 'construction crew faced', 'opened on schedule'],
            },
          ],
        },
        {
          id: 'g03-s2-head-to-head-pairs',
          order: 2,
          title: 'Bảng Đối Đầu 5 Cặp Bài Trùng Thường Gặp Nhất',
          sectionType: 'comparison',
          comparisonTable: {
            title: 'Các Cặp Từ Cùng Nghĩa Nhưng Khác Cấu Trúc Ngữ Pháp',
            headers: ['Ý nghĩa biểu đạt', 'Liên từ (+ Mệnh đề: S + V)', 'Giới từ (+ Danh từ / V-ing)'],
            rows: [
              {
                colValues: [
                  'Mặc dù, dẫu cho (Nhượng bộ)',
                  'Although, Even though, Though',
                  'Despite, In spite of, Regardless of',
                ],
                highlight: true,
                badge: 'Tần suất 100%',
              },
              {
                colValues: [
                  'Bởi vì, do (Nguyên nhân)',
                  'Because, Since, As, Now that',
                  'Because of, Due to, Owing to, On account of, Thanks to',
                ],
                highlight: true,
                badge: 'Tần suất 100%',
              },
              {
                colValues: [
                  'Trong khi / Trong suốt (Thời gian)',
                  'While (+ S + V hoặc rút gọn V-ing)',
                  'During (+ Danh từ sự kiện), For (+ Khoảng thời gian)',
                ],
                highlight: true,
                badge: 'Rất hay nhầm',
              },
              {
                colValues: [
                  'Trừ khi / Ngoại trừ',
                  'Unless (+ S + V)',
                  'Except for, Aside from, Without (+ Noun)',
                ],
                highlight: false,
              },
              {
                colValues: [
                  'Cung cấp rằng / Miễn là',
                  'Provided that, Providing that, As long as',
                  'In case of (+ Noun)',
                ],
                highlight: false,
              },
            ],
            summaryNote: 'Lưu ý: "Because of" là giới từ, nhưng "Because" là liên từ. Nhìn kỹ đuôi "of"!',
          },
          examples: [
            {
              context: 'Email giải trình tài chính dự án cải tạo văn phòng',
              english: 'Due to unforeseen architectural modifications, the renovation costs exceeded the initial estimate by ten percent.',
              vietnamese: 'Do những sửa đổi kiến trúc không lường trước được, chi phí cải tạo đã vượt quá ước tính ban đầu mười phần trăm.',
              analysis:
                'Đối đầu Liên từ vs Giới từ: Thành phần đứng sau là cụm danh từ "unforeseen architectural modifications" (không có động từ chia thì), do đó bắt buộc dùng GIỚI TỪ chỉ nguyên nhân "Due to" (= Because of / Owing to), không được dùng liên từ "Because" hay "Since".',
              highlights: ['Due to', 'unforeseen architectural modifications', 'exceeded'],
            },
          ],
        },
        {
          id: 'g03-s3-conjunctive-adverbs',
          order: 3,
          title: 'Trạng Từ Liên Kết (Conjunctive Adverbs) & Dấu Câu Đặc Trưng',
          sectionType: 'concept',
          contentMarkdown:
            'Các từ như **However, Therefore, Furthermore, Moreover, Consequently, Nevertheless** không phải là liên từ nối câu thông thường! Chúng là **Trạng từ liên kết (Conjunctive Adverbs)**. Chúng **KHÔNG THỂ** đứng giữa câu nối 2 mệnh đề chỉ ngăn cách bằng dấu phẩy đơn.',
          tipBox: {
            title: 'Dấu Hiệu Nhận Biết Trạng Từ Liên Kết Bằng Dấu Câu',
            type: 'shortcut',
            content:
              'Trạng từ liên kết luôn có vị trí dấu câu rất đặc thù trong bài thi Part 5 và Part 6:',
            keySignals: [
              'Vị trí 1: Đứng đầu câu sau dấu chấm và trước dấu phẩy: ". However, ..."',
              'Vị trí 2: Đứng giữa dấu chấm phẩy (;) và dấu phẩy (,): "; however, ..."',
              'Sai ngữ pháp: S1 + V1, however, S2 + V2 (Dấu phẩy không đủ thẩm quyền nối hai mệnh đề độc lập với however).',
            ],
          },
          examples: [
            {
              context: 'Biên bản cuộc họp ban giám đốc quý 4',
              english: 'The manufacturing division reduced material waste significantly; therefore, overall production overhead fell by fifteen percent.',
              vietnamese: 'Bộ phận sản xuất đã giảm thiểu lượng nguyên vật liệu lãng phí một cách đáng kể; do đó, tổng chi phí sản xuất chung đã giảm mười lăm phần trăm.',
              analysis:
                'Dấu hiệu dấu câu của Trạng từ liên kết: "therefore" đứng kẹp giữa dấu chấm phẩy (;) và dấu phẩy (,), kết nối mạch logic nhân quả giữa hai mệnh đề độc lập hoàn chỉnh. Tuyệt đối không thay thế bằng liên từ phụ thuộc "because" trong cấu trúc dấu câu này.',
              highlights: ['reduced material waste', '; therefore,', 'fell by fifteen percent'],
            },
          ],
        },
        {
          id: 'g03-s4-traps-hybrid-formulas',
          order: 4,
          title: 'Cảnh Báo Bẫy: Công Thức Lai Ghép & During vs For',
          sectionType: 'traps',
          trapAlert: {
            trapName: 'Bẫy Công Thức Lai "Despite of" & Lẫn Lộn "During vs For"',
            trapLevel: 'high_distractor',
            trapDescription:
              'ETS thường tự bịa ra những từ không tồn tại trong ngữ pháp chuẩn như "Despite of" để bẫy thí sinh nhớ lơ mơ. Ngoài ra, việc dùng "during" trước khoảng thời gian có con số cũng là cái bẫy cực kỳ phổ biến.',
            distractorExample: {
              prompt: 'The manufacturing plant remained operational continuously _______ three weeks to clear the backlog.',
              incorrectChoice: '(A) during (chọn vì dịch nghĩa là "trong suốt")',
              correctChoice: '(B) for (đi kèm khoảng thời gian đo đếm được có con số: three weeks)',
              whyDistractorFails:
                '"During" chỉ đi với Danh từ chỉ sự kiện, kỳ nghỉ, hội nghị (during the meeting, during the summer vacation). Khi có khoảng thời gian đo đếm bằng con số (three weeks, two years), bắt buộc dùng "For".',
            },
            antidote:
              'Thần chú giải đề: Gặp "Despite of" -> GẠCH BỎ NGAY LẬP TỨC (Chỉ có "Despite" hoặc "In spite of"). Gặp con số thời gian (2 months, 5 days) -> CHỌN "FOR", KHÔNG CHỌN "DURING".',
          },
          examples: [
            {
              context: 'Thông báo bảo trì hệ thống máy chủ ngân hàng',
              english: 'The database administrators monitored system diagnostics continuously for forty-eight hours during the annual server migration.',
              vietnamese: 'Các quản trị viên cơ sở dữ liệu đã theo dõi các thông số chẩn đoán hệ thống liên tục trong bốn mươi tám giờ suốt quá trình chuyển đổi máy chủ thường niên.',
              analysis:
                'Phân biệt "For" vs "During": Cụm "forty-eight hours" là khoảng thời gian đo đếm bằng con số cụ thể nên bắt buộc dùng giới từ "for". Cụm "the annual server migration" là danh từ chỉ sự kiện/quá trình nên dùng giới từ "during".',
              highlights: ['for forty-eight hours', 'during the annual server migration'],
            },
          ],
        },
      ],
      checkpoints: [
        {
          id: 'g03-cp1',
          order: 1,
          prompt: '_______ severe weather conditions caused widespread flight cancellations, the keynote speaker arrived on schedule for the symposium.',
          options: [
            { key: 'A', text: 'Despite' },
            { key: 'B', text: 'Because of' },
            { key: 'C', text: 'Although' },
            { key: 'D', text: 'In spite of' },
          ],
          correctAnswer: 'C',
          explanationVi:
            'Phân tích cấu trúc sau chỗ trống: "severe weather conditions (Chủ ngữ S) caused (Động từ V) widespread flight cancellations (Tân ngữ O)". Đây là một MỆNH ĐỀ hoàn chỉnh có cả S và V. Do đó vị trí đầu câu bắt buộc phải là một LIÊN TỪ (Conjunction) thể hiện sự tương phản ("mặc dù"). "Although" (phương án C) là liên từ duy nhất trong 4 phương án. Các phương án (A) Despite, (B) Because of, (D) In spite of đều là GIỚI TỪ chỉ đi với danh từ/V-ing.',
          trapSignal: 'Thấy cụm từ severe weather conditions tưởng chỉ là danh từ nên chọn giới từ Despite hoặc In spite of.',
          timeTargetSeconds: 12,
        },
        {
          id: 'g03-cp2',
          order: 2,
          prompt: 'The construction of the riverside retail complex was temporarily halted _______ unexpected zoning regulation changes.',
          options: [
            { key: 'A', text: 'because' },
            { key: 'B', text: 'even though' },
            { key: 'C', text: 'since' },
            { key: 'D', text: 'owing to' },
          ],
          correctAnswer: 'D',
          explanationVi:
            'Phân tích cấu trúc sau chỗ trống: "unexpected zoning regulation changes" (những thay đổi bất ngờ trong quy định phân khu). Đây là một CỤM DANH TỪ (Noun Phrase), không chứa bất kỳ động từ chia thì nào. Do đó, vị trí này bắt buộc phải là một GIỚI TỪ (Preposition) chỉ nguyên nhân ("bởi vì, do"). "Owing to" (= because of / due to, phương án D) là giới từ chính xác. Các phương án (A) because, (B) even though, (C) since đều là LIÊN TỪ đòi hỏi theo sau phải là một mệnh đề (S + V).',
          trapSignal: 'Dịch nghĩa thấy "bởi vì" vội vàng chọn liên từ because mà không nhìn cấu trúc sau chỗ trống.',
          timeTargetSeconds: 15,
        },
        {
          id: 'g03-cp3',
          order: 3,
          prompt: 'Attendees are kindly requested to refrain from taking flash photographs _______ the keynote address is being delivered.',
          options: [
            { key: 'A', text: 'while' },
            { key: 'B', text: 'during' },
            { key: 'C', text: 'despite' },
            { key: 'D', text: 'because of' },
          ],
          correctAnswer: 'A',
          explanationVi:
            'Phân tích cấu trúc sau chỗ trống: "the keynote address (S) is being delivered (V - thể bị động thì hiện tại tiếp diễn)". Đây là một MỆNH ĐỀ đầy đủ S + V. Để diễn tả hành động xảy ra đồng thời trong khi bài phát biểu đang diễn ra, ta phải dùng liên từ "while" (+ S + V, phương án A). (B) during là giới từ chỉ đi với danh từ sự kiện (e.g. during the speech); (C) despite và (D) because of đều là giới từ và không hợp nghĩa.',
          trapSignal: 'Nhầm lẫn giữa liên từ While (+ mệnh đề) và giới từ During (+ danh từ sự kiện).',
          timeTargetSeconds: 12,
        },
        {
          id: 'g03-cp4',
          order: 4,
          prompt: 'The third-quarter revenue exceeded all market forecasts; _______, the executive board authorized an extra dividend payout for shareholders.',
          options: [
            { key: 'A', text: 'although' },
            { key: 'B', text: 'consequently' },
            { key: 'C', text: 'because' },
            { key: 'D', text: 'whereas' },
          ],
          correctAnswer: 'B',
          explanationVi:
            'Phân tích vị trí dấu câu: Chỗ trống đứng ngay sau dấu chấm phẩy (;) và đứng trước dấu phẩy (,). Đây là vị trí đặc trưng tuyệt đối của TRẠNG TỪ LIÊN KẾT (Conjunctive Adverb). "Consequently" (do đó, kết quả là, phương án B) thể hiện quan hệ nguyên nhân - kết quả giữa hai mệnh đề độc lập. Các phương án (A) although, (C) because, (D) whereas đều là liên từ phụ thuộc, không bao giờ đứng kẹp giữa cấu trúc "; [ ... ],".',
          trapSignal: 'Bẫy dấu câu: Chọn liên từ because vì thấy mối quan hệ nguyên nhân - kết quả mà quên dấu chấm phẩy.',
          timeTargetSeconds: 15,
        },
      ],
      bridgeToPractice: {
        targetPart: 5,
        partName: 'Part 5: Incomplete Sentences',
        recommendedQuestionCount: 20,
        filterMode: 'unseen',
        practiceUrl: '/toeic/exam/bank?part=5&limit=20&mode=practice&filterMode=unseen',
        ctaText: 'Luyện ngay 20 câu Part 5 Giới từ vs Liên từ',
      },
    },

    // =========================================================================
    // LESSON G04: Participles & Reduced Relative Clauses
    // =========================================================================
    {
      id: 'toeic-grammar-04-participles-reduced-clauses',
      moduleId: 'grammar-foundation',
      slug: 'participles-and-reduced-clauses',
      order: 4,
      title: 'Phân Từ & Rút Gọn Mệnh Đề Quan Hệ (Participles & Reduced Clauses)',
      englishTitle: 'Participles & Reduced Relative Clauses',
      targetPart: 5,
      targetSections: ['reading'],
      difficulty: 'intermediate',
      estimatedMinutes: 20,
      textbookSources: [
        'Hackers TOEIC Start Reading - Chapter 7',
        'Tactics for TOEIC - Unit 11',
        'Tomato TOEIC Compact Part 5&6 - Lesson 5',
      ],
      objectives: [
        'Nắm vững bản chất Hiện tại phân từ (V-ing: chủ động / tính chất bản thân) và Quá khứ phân từ (V-ed / V3: bị động / nhận tác động từ bên ngoài).',
        'Thành thạo 2 bước rút gọn mệnh đề quan hệ: Cùng chủ ngữ -> Rút thành V-ing (có tân ngữ theo sau) hoặc V-ed (không tân ngữ / theo sau là giới từ).',
        'Nằm lòng danh mục các tính từ phân từ công sở cố định luôn xuất hiện trong đề thi (revised, attached, detailed, existing, remaining, outstanding).',
        'Không bị đánh lừa bởi phân từ rút gọn đứng xen giữa Chủ ngữ và Động từ chính của câu.',
      ],
      sections: [
        {
          id: 'g04-s1-v-ing-vs-v-ed-nature',
          order: 1,
          title: 'Bản Chất V-ing (Chủ Động) vs V-ed (Bị Động)',
          sectionType: 'concept',
          contentMarkdown:
            'Phân từ (Participles) là dạng động từ biến tính thành tính từ để bổ nghĩa cho danh từ. Trong đề thi TOEIC, việc chọn V-ing hay V-ed phụ thuộc vào mối quan hệ giữa phân từ và danh từ mà nó bổ nghĩa:',
          formula: {
            pattern: 'Noun + [ V-ing + Object ] (Chủ động)  VS  Noun + [ V-ed + (Preposition) ] (Bị động)',
            elements: [
              {
                symbol: 'V-ing (Hiện tại phân từ)',
                label: 'Chủ động / Đang diễn ra',
                explanation: 'Danh từ tự thực hiện hành động; thường có Tân ngữ danh từ theo sau',
                color: 'blue',
              },
              {
                symbol: 'V-ed (Quá khứ phân từ)',
                label: 'Bị động / Đã hoàn tất',
                explanation: 'Danh từ tiếp nhận hành động từ bên ngoài; phía sau KHÔNG CÓ tân ngữ danh từ',
                color: 'emerald',
              },
            ],
            notes: 'Mẹo 3 giây: Nhìn ngay từ đứng sau chỗ trống. Có Tân ngữ danh từ -> Chọn V-ing; Có Giới từ (by, in, to, with) hoặc hết câu -> Chọn V-ed.',
          },
          tipBox: {
            title: 'Quy Tắc 3 Giây Bẻ Khóa Phân Từ (V-ing vs V-ed)',
            type: 'shortcut',
            content:
              'Khi gặp câu hỏi phân từ bổ nghĩa cho danh từ, hãy áp dụng quy tắc quét từ đứng ngay sau chỗ trống để chốt phương án:',
            keySignals: [
              'Sau chỗ trống có TÂN NGỮ DANH TỪ -> Chọn V-ing (Chủ động): The technician [inspecting the machinery] found no defects.',
              'Sau chỗ trống là GIỚI TỪ (by, in, for, to, at) hoặc DẤU PHẨY / HẾT CÂU -> Chọn V-ed (Bị động): The proposal [submitted by the committee] was approved.',
              'Ngoại lệ: Các tính từ phân từ cố định (attached file, existing facilities) phải học thuộc lòng theo cụm.',
            ],
          },
          examples: [
            {
              context: 'Thông báo bảo trì hệ thống điều hòa văn phòng',
              english: 'The technicians inspecting the ventilation units discovered a minor coolant leak in the central compressor.',
              vietnamese: 'Các kỹ thuật viên kiểm tra các bộ phận thông gió đã phát hiện ra một sự rò rỉ chất làm mát nhỏ ở máy nén trung tâm.',
              analysis:
                'Phân từ chủ động: "inspecting" là hiện tại phân từ bổ nghĩa cho danh từ "The technicians". Vì các kỹ thuật viên tự thực hiện hành động kiểm tra và có tân ngữ danh từ "the ventilation units" đứng ngay sau, ta dùng dạng V-ing.',
              highlights: ['technicians inspecting', 'ventilation units', 'discovered'],
            },
          ],
        },
        {
          id: 'g04-s2-reduced-relative-clause-technique',
          order: 2,
          title: 'Kỹ Thuật Rút Gọn Mệnh Đề Quan Hệ Trong Câu Phức',
          sectionType: 'rules',
          contentMarkdown:
            'Mệnh đề quan hệ khi lược bỏ đại từ quan hệ (who, which, that) và trợ động từ to be sẽ biến thành cụm phân từ rút gọn đứng ngay sau danh từ:',
          comparisonTable: {
            title: 'Quy Trình Rút Gọn Mệnh Đề Quan Hệ Chủ Động & Bị Động',
            headers: ['Dạng câu gốc đầy đủ', 'Thao tác rút gọn', 'Dạng rút gọn chuẩn ETS'],
            rows: [
              {
                colValues: [
                  'The technician [who inspects] the equipment every Friday...',
                  'Bỏ "who", đưa động từ inspect về V-ing',
                  'The technician [inspecting] the equipment...',
                ],
                highlight: true,
                badge: 'Rút gọn chủ động',
              },
              {
                colValues: [
                  'The proposal [which was submitted] by the team yesterday...',
                  'Bỏ "which was", giữ lại V-ed',
                  'The proposal [submitted] by the team...',
                ],
                highlight: true,
                badge: 'Rút gọn bị động',
              },
              {
                colValues: [
                  'Anyone [who wants] to register for the workshop...',
                  'Bỏ "who", chuyển wants thành wishing/wanting',
                  'Anyone [wishing] to register...',
                ],
                highlight: false,
              },
            ],
            summaryNote: 'Nếu câu đã có sẵn Động từ chính ở vế sau, chỗ trống bổ nghĩa cho danh từ đứng trước CHẮC CHẮN là Phân từ rút gọn.',
          },
          examples: [
            {
              context: 'Quy chế tham dự hội thảo đào tạo quản lý',
              english: 'Employees participating in the leadership seminar must submit their completed feedback forms by Friday afternoon.',
              vietnamese: 'Các nhân viên tham gia hội thảo lãnh đạo phải nộp phiếu phản hồi đã hoàn thành trước chiều thứ Sáu.',
              analysis:
                'Rút gọn mệnh đề quan hệ chủ động: Câu gốc là "Employees who participate in the leadership seminar...". Khi rút gọn, bỏ đại từ "who" và chuyển động từ sang dạng V-ing "participating". Động từ chính của câu là "must submit".',
              highlights: ['Employees participating in', 'leadership seminar', 'must submit'],
            },
          ],
        },
        {
          id: 'g04-s3-fixed-workplace-participles',
          order: 3,
          title: 'Bảng Cụm Phân Từ Công Sở Bất Hủ Trong Đề Thi ETS',
          sectionType: 'comparison',
          comparisonTable: {
            title: 'Các Tính Từ Phân Từ Cố Định Thường Gặp Nhất',
            headers: ['Dạng phân từ', 'Cụm từ tiêu biểu trong đề ETS', 'Ý nghĩa công sở'],
            rows: [
              { colValues: ['V-ed (Bị động)', 'attached file / enclosed invoice', 'tệp đính kèm / hóa đơn gửi kèm'], highlight: true, badge: 'Gặp liên tục' },
              { colValues: ['V-ed (Bị động)', 'revised proposal / updated budget', 'bản đề xuất sửa đổi / ngân sách cập nhật'], highlight: true },
              { colValues: ['V-ed (Bị động)', 'detailed report / qualified applicant', 'báo cáo chi tiết / ứng viên đủ tiêu chuẩn'], highlight: false },
              { colValues: ['V-ed (Bị động)', 'experienced manager / customized solution', 'người quản lý giàu kinh nghiệm / giải pháp tùy biến'], highlight: false },
              { colValues: ['V-ing (Chủ động)', 'existing facilities / remaining balance', 'cơ sở vật chất hiện có / số dư còn lại'], highlight: true, badge: 'Bẫy điểm cao' },
              { colValues: ['V-ing (Chủ động)', 'leading manufacturer / promising candidate', 'nhà sản xuất dẫn đầu / ứng viên đầy triển vọng'], highlight: true },
              { colValues: ['V-ing (Chủ động)', 'demanding supervisor / growing demand', 'người giám sát khắt khe / nhu cầu ngày càng tăng'], highlight: false },
              { colValues: ['V-ing (Chủ động)', 'outstanding performance', 'thành tích xuất sắc / nổi bật'], highlight: false },
            ],
            summaryNote: 'Cụm "existing facilities" (cơ sở vật chất hiện có) và "remaining balance" (số dư còn lại) LUÔN chia V-ing, không bao giờ chia V-ed.',
          },
          examples: [
            {
              context: 'Email gửi khách hàng đính kèm hợp đồng sửa đổi',
              english: 'Please review the attached contract carefully and return a signed copy along with your remaining balance.',
              vietnamese: 'Vui lòng xem kỹ hợp đồng được đính kèm và gửi lại một bản sao đã ký cùng với số dư còn lại của bạn.',
              analysis:
                'Các tính từ phân từ công sở cố định: "attached contract" dùng quá khứ phân từ V-ed mang nghĩa hợp đồng được gửi đính kèm; còn "remaining balance" dùng hiện tại phân từ V-ing là cụm cố định mang nghĩa số dư còn lại chưa thanh toán.',
              highlights: ['attached contract', 'signed copy', 'remaining balance'],
            },
          ],
        },
        {
          id: 'g04-s4-trap-main-verb-confusion',
          order: 4,
          title: 'Cảnh Báo Bẫy: Nhầm Phân Từ Rút Gọn Là Động Từ Chính',
          sectionType: 'traps',
          trapAlert: {
            trapName: 'Bẫy Nhầm Phân Từ Rút Gọn Với Động Từ Chính Của Câu',
            trapLevel: 'high_distractor',
            trapDescription:
              'Khi câu có cấu trúc S + [Phân từ rút gọn] + O + V(chính), thí sinh nhìn thấy V-ed rút gọn lại tưởng đó là động từ chính của câu ở thì quá khứ, dẫn đến việc chọn sai thành phần câu ở vế sau.',
            distractorExample: {
              prompt: 'The blueprints _______ by the chief architect will be reviewed by the safety board tomorrow.',
              incorrectChoice: '(A) submit (tưởng chỗ trống thiếu động từ chính)',
              correctChoice: '(C) submitted (quá khứ phân từ rút gọn: which were submitted)',
              whyDistractorFails:
                'Động từ chính của câu đã xuất hiện rõ ràng ở vế sau: "will be reviewed". Câu không thể có 2 động từ chính cùng lúc mà không có liên từ.',
            },
            antidote:
              'Luôn quét nhanh từ đầu đến cuối câu để tìm ĐỘNG TỪ CHÍNH trước tiên. Nếu thấy "will be reviewed", "has decided", "is scheduled" ở phía sau, vị trí chỗ trống đứng sau Chủ ngữ chắc chắn là MỆNH ĐỀ QUAN HỆ RÚT GỌN (V-ing hoặc V-ed).',
          },
          examples: [
            {
              context: 'Bản ghi nhớ công bố kết quả kiểm định an toàn',
              english: 'The safety report released by the municipal inspector yesterday confirms that our factory meets all environmental standards.',
              vietnamese: 'Báo cáo an toàn được thanh tra thành phố công bố ngày hôm qua xác nhận rằng nhà máy của chúng ta đáp ứng tất cả các tiêu chuẩn môi trường.',
              analysis:
                'Bẫy động từ chính: "released by the municipal inspector" là cụm quá khứ phân từ rút gọn (which was released...) bổ nghĩa cho "The safety report". Động từ chính thật sự của câu là "confirms" (chia số ít theo The safety report). Tránh nhầm "released" là động từ chính của câu.',
              highlights: ['safety report released by', 'municipal inspector', 'confirms that'],
            },
          ],
        },
      ],
      checkpoints: [
        {
          id: 'g04-cp1',
          order: 1,
          prompt: 'Any staff member _______ to enroll in the advanced project management course must obtain managerial approval by Friday.',
          options: [
            { key: 'A', text: 'wish' },
            { key: 'B', text: 'wished' },
            { key: 'C', text: 'wishes' },
            { key: 'D', text: 'wishing' },
          ],
          correctAnswer: 'D',
          explanationVi:
            'Phân tích cấu trúc câu: Động từ chính của câu đã có ở vế sau là "must obtain" (bắt buộc phải nhận được). Chủ ngữ là "Any staff member". Chỗ trống nằm trong mệnh đề quan hệ rút gọn bổ nghĩa cho chủ ngữ (câu gốc: Any staff member who wishes to enroll...). Vì nhân viên chủ động muốn đăng ký (to enroll), mệnh đề rút gọn ở thể chủ động mang dạng V-ing -> "wishing" (phương án D). (A) wish và (C) wishes là động từ chia thì; (B) wished là thể bị động mang nghĩa bị muốn (sai ngữ nghĩa).',
          trapSignal: 'Tưởng câu thiếu động từ chính nên chia "wishes" theo chủ ngữ số ít Any staff member.',
          timeTargetSeconds: 15,
        },
        {
          id: 'g04-cp2',
          order: 2,
          prompt: 'Please refer to the _______ document for a complete breakdown of estimated travel expenditures.',
          options: [
            { key: 'A', text: 'attach' },
            { key: 'B', text: 'attaching' },
            { key: 'C', text: 'attached' },
            { key: 'D', text: 'attachment' },
          ],
          correctAnswer: 'C',
          explanationVi:
            'Phân tích cấu trúc: Đứng trước danh từ "document" và sau mạo từ "the", ta cần một tính từ hoặc quá khứ phân từ để bổ nghĩa. Tài liệu được đính kèm vào email/thư (mang nghĩa bị động do người gửi đính kèm), nên dùng quá khứ phân từ "attached" (phương án C: the attached document = tài liệu được đính kèm). Đây là cụm từ công sở cố định kinh điển trong đề thi TOEIC. (A) attach là động từ nguyên mẫu; (B) attaching mang nghĩa chủ động; (D) attachment là danh từ.',
          trapSignal: 'Điền danh từ ghép attachment document hoặc phân vân giữa V-ing và V-ed.',
          timeTargetSeconds: 10,
        },
        {
          id: 'g04-cp3',
          order: 3,
          prompt: 'CloudNet Inc. has established itself as the _______ provider of cybersecurity solutions across the Asia-Pacific region.',
          options: [
            { key: 'A', text: 'lead' },
            { key: 'B', text: 'leading' },
            { key: 'C', text: 'led' },
            { key: 'D', text: 'leader' },
          ],
          correctAnswer: 'B',
          explanationVi:
            'Phân tích cấu trúc: Trước danh từ "provider" (nhà cung cấp) và sau mạo từ "the", ta cần một tính từ phân từ để bổ nghĩa. "Leading provider" là cụm phân từ V-ing chủ động cố định cực kỳ phổ biến trong đề thi ETS, mang nghĩa "nhà cung cấp dẫn đầu, hàng đầu" (phương án B). (A) lead là động từ; (C) led là quá khứ phân từ; (D) leader là danh từ chỉ người (không tạo thành cụm danh từ tự nhiên với provider).',
          trapSignal: 'Chọn danh từ leader vì quen miệng "leader provider" thay vì tính từ phân từ leading provider.',
          timeTargetSeconds: 12,
        },
        {
          id: 'g04-cp4',
          order: 4,
          prompt: 'The financial estimates _______ during the preliminary phase of the merger will be presented to the board tomorrow.',
          options: [
            { key: 'A', text: 'prepared' },
            { key: 'B', text: 'preparing' },
            { key: 'C', text: 'prepares' },
            { key: 'D', text: 'prepare' },
          ],
          correctAnswer: 'A',
          explanationVi:
            'Phân tích cấu trúc: Động từ chính của câu là "will be presented" (sẽ được trình bày). Chủ ngữ là "The financial estimates" (những ước tính tài chính). Chỗ trống đóng vai trò là phân từ rút gọn bổ nghĩa cho chủ ngữ (câu gốc: The financial estimates which were prepared...). Các bản ước tính tài chính được chuẩn bị bởi con người (mang nghĩa bị động), và phía sau có cụm giới từ "during...", không có tân ngữ danh từ -> Rút gọn bằng quá khứ phân từ V-ed "prepared" (phương án A). (B) preparing là phân từ chủ động; (C) prepares và (D) prepare là động từ chia thì.',
          trapSignal: 'Bẫy động từ chính: Chọn prepares hoặc prepare vì tưởng câu chưa có động từ.',
          timeTargetSeconds: 15,
        },
      ],
      bridgeToPractice: {
        targetPart: 5,
        partName: 'Part 5: Incomplete Sentences',
        recommendedQuestionCount: 20,
        filterMode: 'unseen',
        practiceUrl: '/toeic/exam/bank?part=5&limit=20&mode=practice&filterMode=unseen',
        ctaText: 'Luyện ngay 20 câu Part 5 Phân từ & Rút gọn mệnh đề',
      },
    },

    // =========================================================================
    // LESSON G05: Passive Voice Mastery & Special Verbs
    // =========================================================================
    {
      id: 'toeic-grammar-05-passive-voice-special-verbs',
      moduleId: 'grammar-foundation',
      slug: 'passive-voice-special-verbs',
      order: 5,
      title: 'Cấu Trúc Bị Động Chuyên Sâu & Động Từ Đặc Biệt (Passive Voice Mastery)',
      englishTitle: 'Passive Voice Mastery & Special Verb Patterns',
      targetPart: 5,
      targetSections: ['reading'],
      difficulty: 'intermediate',
      estimatedMinutes: 15,
      textbookSources: [
        'Tomato TOEIC Compact Part 5&6 - Lesson 4',
        'Hackers TOEIC Start Reading - Chapter 6',
        'Tactics for TOEIC - Unit 5',
      ],
      objectives: [
        'Nhận diện nhanh cấu trúc câu bị động cốt lõi: S + be + V3/ed (+ by O).',
        'Nắm chắc nguyên tắc xét tân ngữ: Sau ngoại động từ chia bị động thông thường KHÔNG CÒN tân ngữ danh từ.',
        'Bẻ khóa ngoại lệ: Bị động của động từ 2 tân ngữ (give, award, grant, offer, send) — phía sau vẫn còn 1 tân ngữ trực tiếp.',
        'Ghi nhớ danh sách đen: Các Nội động từ (Intransitive Verbs) TUYỆT ĐỐI KHÔNG DÙNG BỊ ĐỘNG (occur, happen, rise, remain, arrive, expire).',
        'Thuộc lòng các cụm bị động hành chính cố định thường gặp trong văn bản và hợp đồng công sở.',
      ],
      sections: [
        {
          id: 'g05-s1-passive-core-rule',
          order: 1,
          title: 'Cấu Trúc Bị Động & Quy Tắc Xét Tân Ngữ Thần Tốc',
          sectionType: 'rules',
          contentMarkdown:
            'Cấu trúc bị động được sử dụng khi chủ ngữ là đối tượng tiếp nhận hành động, hoặc khi người thực hiện hành động không quan trọng hay không được đề cập:',
          formula: {
            pattern: 'Active: S + V + Object [Noun]  VS  Passive: S + be + V3/ed + [ Preposition / By O / Period ]',
            elements: [
              {
                symbol: 'Active Voice (Chủ động)',
                label: 'Có Tân ngữ',
                explanation: 'Sau động từ chủ động bắt buộc có Danh từ làm tân ngữ trực tiếp chịu tác động',
                color: 'blue',
              },
              {
                symbol: 'Passive Voice (Bị động)',
                label: 'Không có Tân ngữ',
                explanation: 'Tân ngữ đã chuyển thành Chủ ngữ, sau V3/ed chỉ còn Giới từ hoặc Trạng từ',
                color: 'emerald',
              },
            ],
            notes: 'Quy tắc 5 giây: Nếu sau chỗ trống là GIỚI TỪ (by, in, at, to) hoặc DẤU CHẤM hết câu -> 90% chọn BỊ ĐỘNG (be + V3/ed).',
          },
          examples: [
            {
              context: 'Email xác nhận gia hạn hợp đồng cung ứng dịch vụ',
              english: 'The commercial lease agreement was officially signed by both parties at the conclusion of negotiations.',
              vietnamese: 'Hợp đồng thuê mặt bằng thương mại đã được ký kết chính thức bởi cả hai bên khi kết thúc đàm phán.',
              analysis:
                'Cấu trúc bị động chuẩn: Chủ ngữ "The commercial lease agreement" (vật) tiếp nhận hành động, sau động từ có giới từ "by both parties", không có tân ngữ danh từ trực tiếp -> Chia bị động thì quá khứ đơn "was officially signed". Trạng từ "officially" đứng xen giữa trợ động từ "was" và quá khứ phân từ "signed".',
              highlights: ['lease agreement', 'was officially signed by', 'conclusion of negotiations'],
            },
          ],
        },
        {
          id: 'g05-s2-ditransitive-verbs-trap',
          order: 2,
          title: 'Ngoại Lệ Nguy Hiểm: Bị Động Của Động Từ 2 Tân Ngữ',
          sectionType: 'traps',
          trapAlert: {
            trapName: 'Bẫy Thấy Danh Từ Sau Chỗ Trống Vội Vàng Chọn Chủ Động',
            trapLevel: 'high_distractor',
            trapDescription:
              'Các ngoại động từ trao nhận có 2 tân ngữ (give, award, grant, offer, send, provide). Khi chuyển sang thể bị động, câu VẪN CÒN 1 TÂN NGỮ DANH TỪ phía sau. Thí sinh thấy danh từ sau chỗ trống thường nhầm tưởng câu phải chia chủ động.',
            distractorExample: {
              prompt: 'Dr. Angela Martinez was _______ the Employee of the Year award for her innovative research.',
              incorrectChoice: '(A) presenting (chia chủ động vì thấy danh từ the Employee of the Year award)',
              correctChoice: '(B) presented (chia bị động: was presented an award - được trao tặng giải thưởng)',
              whyDistractorFails:
                'Chủ ngữ Dr. Angela Martinez không tự trao giải mà bà ấy được trao giải thưởng. Động từ present ở đây có 2 tân ngữ: present someone with an award.',
            },
            antidote:
              'Ghi nhớ nhóm động từ 2 tân ngữ: give, grant, award, offer, send, show, assign. Khi gặp các từ này, PHẢI DỊCH SƠ BỘ NGHĨA của chủ ngữ xem chủ ngữ là NGƯỜI THỰC HIỆN hay NGƯỜI ĐƯỢC NHẬN.',
          },
          examples: [
            {
              context: 'Bản tin nội bộ vinh danh nhà nghiên cứu xuất sắc',
              english: 'Dr. Katherine Wood was granted a patent for her groundbreaking energy-efficient battery design.',
              vietnamese: 'Tiến sĩ Katherine Wood đã được cấp một bằng sáng chế cho thiết kế pin tiết kiệm năng lượng mang tính đột phá của bà.',
              analysis:
                'Bị động của động từ 2 tân ngữ (grant someone something): Dù phía sau chỗ trống vẫn còn một tân ngữ danh từ "a patent", câu vẫn chia bị động "was granted" vì chủ ngữ "Dr. Katherine Wood" là người được nhận bằng sáng chế, không phải người tự cấp bằng.',
              highlights: ['Dr. Katherine Wood', 'was granted a patent', 'groundbreaking design'],
            },
          ],
        },
        {
          id: 'g05-s3-never-passive-intransitive-verbs',
          order: 3,
          title: 'Danh Sách Đen: Các Nội Động Từ Tuyệt Đối Không Dùng Bị Động',
          sectionType: 'comparison',
          contentMarkdown:
            'Nội động từ (Intransitive verbs) là các động từ tự thân hành động, không có tân ngữ tác động. Do đó, **CHÚNG TUYỆT ĐỐI KHÔNG BAO GIỜ ĐƯỢC CHIA Ở THỂ BỊ ĐỘNG**:',
          comparisonTable: {
            title: 'Danh Sách Nội Động Từ Không Bao Giờ Có Dạng Bị Động',
            headers: ['Nội động từ', 'Ý nghĩa', 'Bẫy đề thi thường gài (SAI HOÀN TOÀN)', 'Cách dùng đúng'],
            rows: [
              {
                colValues: ['occur / happen', 'xảy ra, diễn ra', 'was occurred, is happened', 'The error occurred yesterday.'],
                highlight: true,
                badge: 'Bẫy số 1 ETS',
              },
              {
                colValues: ['rise / increase', 'tăng lên (nội động từ)', 'has been risen', 'Fuel prices rose sharply.'],
                highlight: true,
                badge: 'Rất hay gài',
              },
              {
                colValues: ['remain', 'vẫn còn, duy trì', 'was remained', 'The office remains open.'],
                highlight: false,
              },
              {
                colValues: ['arrive', 'đến nơi', 'was arrived', 'The shipment arrived on time.'],
                highlight: false,
              },
              {
                colValues: ['expire', 'hết hạn', 'will be expired', 'The contract will expire soon.'],
                highlight: true,
                badge: 'Hợp đồng/văn bản',
              },
              {
                colValues: ['emerge', 'xuất hiện, nổi lên', 'was emerged', 'A new market emerged.'],
                highlight: false,
              },
              {
                colValues: ['function', 'hoạt động, vận hành', 'is functioned', 'The machine functions well.'],
                highlight: false,
              },
            ],
            summaryNote: 'Thấy bất kỳ phương án nào có dạng "be + occurred/risen/expired" -> GẠCH BỎ NGAY mà không cần đọc tiếp!',
          },
          examples: [
            {
              context: 'Biên bản xử lý sự cố kỹ thuật dây chuyền lắp ráp',
              english: 'A technical malfunction occurred on assembly line four shortly after the morning shift commenced.',
              vietnamese: 'Một sự cố kỹ thuật đã xảy ra trên dây chuyền lắp ráp số bốn không lâu sau khi ca làm việc buổi sáng bắt đầu.',
              analysis:
                'Nội động từ không dùng bị động: "occur" là nội động từ, hành động tự thân xảy ra. Bắt buộc chia ở thể chủ động "occurred". Đề thi ETS thường gài bẫy "was occurred" (sai hoàn toàn).',
              highlights: ['technical malfunction', 'occurred on', 'assembly line'],
            },
          ],
        },
        {
          id: 'g05-s4-common-passive-collocations',
          order: 4,
          title: 'Các Cụm Bị Động Hành Chính Cố Định Phải Thuộc Nằm Lòng',
          sectionType: 'shortcuts',
          tipBox: {
            title: 'Cụm Bị Động Công Sở Thường Gặp Nhất Trong Part 5 & 6',
            type: 'rule',
            content:
              'Trong môi trường kinh doanh và giao tiếp văn phòng, người ta thường dùng các cấu trúc bị động lịch sự sau:',
            keySignals: [
              'be scheduled to + V: được lên lịch / dự kiến làm gì (The meeting is scheduled to begin at 2 PM)',
              'be required to + V: được yêu cầu bắt buộc làm gì (All visitors are required to sign in)',
              'be expected to + V: được kỳ vọng / trông đợi làm gì (Profits are expected to increase)',
              'be eligible for + N / to V: đủ điều kiện hưởng cái gì (Employees are eligible for dental coverage)',
              'be subject to + N: có thể bị / chịu ảnh hưởng của cái gì (Prices are subject to change without notice)',
              'be entitled to + N / to V: có quyền được hưởng cái gì (You are entitled to a full refund)',
            ],
          },
          examples: [
            {
              context: 'Thông báo quy chế làm việc tại phân xưởng sản xuất',
              english: 'All visitors are required to register at the security desk and wear an identification badge at all times.',
              vietnamese: 'Tất cả khách tham quan được yêu cầu phải đăng ký tại bàn bảo vệ và đeo thẻ nhận dạng mọi lúc.',
              analysis:
                'Cụm bị động quy định công sở cố định: "be required to + V" (are required to register) thể hiện nghĩa vụ bắt buộc tuân theo quy định an ninh.',
              highlights: ['are required to register', 'security desk', 'identification badge'],
            },
          ],
        },
      ],
      checkpoints: [
        {
          id: 'g05-cp1',
          order: 1,
          prompt: 'Significant operational delays _______ at the regional distribution center due to an unexpected power outage.',
          options: [
            { key: 'A', text: 'were occurred' },
            { key: 'B', text: 'occurred' },
            { key: 'C', text: 'occurring' },
            { key: 'D', text: 'was occurred' },
          ],
          correctAnswer: 'B',
          explanationVi:
            'Phân tích ngữ pháp: "Occur" (xảy ra, diễn ra) là một NỘI ĐỘNG TỪ (Intransitive Verb). Nội động từ không bao giờ có tân ngữ đi kèm và TUYỆT ĐỐI KHÔNG BAO GIỜ chia ở thể bị động. Do đó, các phương án (A) were occurred và (D) was occurred đều sai ngữ pháp nghiêm trọng. (C) occurring là dạng V-ing không thể làm động từ chính của câu. Vì vậy, phương án đúng duy nhất là thì quá khứ đơn chủ động "occurred" (phương án B).',
          trapSignal: 'Bẫy nội động từ: Dịch theo tiếng Việt thấy "sự trì hoãn bị xảy ra" nên chọn thể bị động were occurred.',
          timeTargetSeconds: 12,
        },
        {
          id: 'g05-cp2',
          order: 2,
          prompt: 'Dr. Kenneth Reed _______ the prestigious Lifetime Achievement Award at the annual biotechnology conference yesterday.',
          options: [
            { key: 'A', text: 'awarded' },
            { key: 'B', text: 'awarding' },
            { key: 'C', text: 'has awarded' },
            { key: 'D', text: 'was awarded' },
          ],
          correctAnswer: 'D',
          explanationVi:
            'Phân tích ngữ nghĩa và cấu trúc: "Award" là động từ có 2 tân ngữ (award someone something = trao cho ai cái gì). Trong câu này, chủ ngữ Dr. Kenneth Reed là người được tôn vinh và trao giải (thể bị động: was awarded something, phương án D). Dù phía sau vẫn có cụm danh từ "the prestigious Lifetime Achievement Award", câu vẫn phải chia ở thể bị động vì ông Reed không tự trao giải cho bản thân mình. Vì sự việc diễn ra "yesterday", thì quá khứ đơn bị động "was awarded" là đáp án chính xác. (A) awarded và (C) has awarded là các dạng chủ động; (B) awarding là V-ing.',
          trapSignal: 'Bẫy động từ 2 tân ngữ: Thấy danh từ The Lifetime Achievement Award phía sau nên tưởng là chủ động và chọn awarded.',
          timeTargetSeconds: 15,
        },
        {
          id: 'g05-cp3',
          order: 3,
          prompt: 'All promotional discounted prices displayed on the website are _______ to change without prior notification.',
          options: [
            { key: 'A', text: 'subject' },
            { key: 'B', text: 'subjective' },
            { key: 'C', text: 'subjecting' },
            { key: 'D', text: 'subjection' },
          ],
          correctAnswer: 'A',
          explanationVi:
            'Phân tích cụm cố định: Cụm thành ngữ công sở kinh điển "be subject to + Noun" mang nghĩa "có thể phải chịu / có khả năng thay đổi tùy theo". Trong cấu trúc này, "subject" đóng vai trò là một tính từ đi với giới từ "to" (phương án A: Prices are subject to change = Giá cả có thể thay đổi mà không cần thông báo trước). (B) subjective mang nghĩa chủ quan; (C) subjecting là dạng V-ing; (D) subjection là danh từ mang nghĩa sự khuất phục.',
          trapSignal: 'Chọn tính từ subjective (chủ quan) do nhầm đuôi tính từ thông thường -ive.',
          timeTargetSeconds: 10,
        },
        {
          id: 'g05-cp4',
          order: 4,
          prompt: 'Factory workers are strictly _______ to put on protective helmets and safety glasses prior to entering the assembly zone.',
          options: [
            { key: 'A', text: 'require' },
            { key: 'B', text: 'requiring' },
            { key: 'C', text: 'required' },
            { key: 'D', text: 'requirement' },
          ],
          correctAnswer: 'C',
          explanationVi:
            'Phân tích cấu trúc: Câu có cấu trúc bị động "be + V3/ed + to V" diễn tả quy định bắt buộc: "be required to do something" (được yêu cầu / bắt buộc phải làm gì, phương án C). Sau trợ động từ "are" và trạng từ "strictly", ta cần quá khứ phân từ "required". Các công nhân không tự đưa ra yêu cầu mà họ được/bị yêu cầu bởi quy định an toàn. (A) require là động từ nguyên mẫu; (B) requiring là dạng chủ động; (D) requirement là danh từ.',
          trapSignal: 'Bẫy từ loại sau be và trạng từ: Phân vân giữa V-ing và V-ed.',
          timeTargetSeconds: 10,
        },
      ],
      bridgeToPractice: {
        targetPart: 5,
        partName: 'Part 5: Incomplete Sentences',
        recommendedQuestionCount: 20,
        filterMode: 'unseen',
        practiceUrl: '/toeic/exam/bank?part=5&limit=20&mode=practice&filterMode=unseen',
        ctaText: 'Luyện ngay 20 câu Part 5 Câu bị động & Động từ đặc biệt',
      },
    },

    // =========================================================================
    // LESSON G06: Part 6 Text Completion & Sentence Insertion
    // =========================================================================
    {
      id: 'toeic-grammar-06-part6-text-completion',
      moduleId: 'grammar-foundation',
      slug: 'part6-text-completion',
      order: 6,
      title: 'Chiến Lược Điền Đoạn Văn Part 6 & Chèn Câu Hoàn Chỉnh (Part 6 Mastery)',
      englishTitle: 'Part 6 Text Completion & Sentence Insertion Tactics',
      targetPart: 6,
      targetSections: ['reading'],
      difficulty: 'advanced',
      estimatedMinutes: 20,
      textbookSources: [
        'Tomato TOEIC Compact Part 6',
        'Hackers TOEIC Reading - Part 6 Chapter',
        'ETS TOEIC Official Format Guide',
      ],
      objectives: [
        'Nắm trọn vẹn cấu trúc 16 câu Part 6 phân bố trong 4 đoạn văn thực tế (Email, Memo, Notice, Letter, Advertisement).',
        'Phân loại 3 nhóm câu hỏi đặc trưng: Câu ngữ pháp cục bộ (10s), Câu từ vựng ngữ cảnh (đọc 1-2 câu lân cận), và Câu chèn câu hoàn chỉnh (Sentence Insertion).',
        'Làm chủ Chiến thuật 3 Manh Mối xử lý câu chèn câu: Trạng từ nối (Transitional words), Đại từ chỉ định (This/These/Such), và Tính liên tục của thì thời gian.',
        'Nhận diện các bẫy phổ biến của Part 6: Bẫy câu đúng ngữ pháp nhưng lạc mạch (Off-topic), bẫy mâu thuẫn thời thì với toàn đoạn văn.',
      ],
      sections: [
        {
          id: 'g06-s1-part6-overview-and-question-types',
          order: 1,
          title: 'Cấu Trúc Đề Part 6 & 3 Nhóm Câu Hỏi Cần Phân Loại',
          sectionType: 'concept',
          contentMarkdown:
            'Part 6 gồm **4 đoạn văn**, mỗi đoạn có đúng **4 chỗ trống** (tổng cộng 16 câu). Thời gian lý tưởng để hoàn thành toàn bộ Part 6 là **8 phút** (~2 phút/đoạn). Thí sinh cần phân loại ngay câu hỏi thuộc nhóm nào để áp dụng chiến thuật phù hợp:',
          comparisonTable: {
            title: 'Phân Loại 3 Dạng Câu Hỏi Trong 1 Đoạn Văn Part 6',
            headers: ['Nhóm câu hỏi', 'Tỷ lệ xuất hiện', 'Phương pháp xử lý nhanh', 'Thời gian mục tiêu'],
            rows: [
              {
                colValues: [
                  'Câu hỏi Ngữ pháp cục bộ (Từ loại, đại từ, giới từ)',
                  '~40% (1-2 câu / đoạn)',
                  'Chỉ nhìn câu chứa chỗ trống, áp dụng quy tắc 5 giây như Part 5, không cần dịch toàn đoạn',
                  '10 - 15 giây',
                ],
                highlight: true,
                badge: 'Ăn điểm nhanh',
              },
              {
                colValues: [
                  'Câu hỏi Từ vựng / Thì ngữ cảnh',
                  '~35% (1-2 câu / đoạn)',
                  'Đọc kỹ câu liền trước và câu liền sau chỗ trống để bắt manh mối từ vựng đồng nghĩa hoặc mốc thời gian',
                  '20 - 30 giây',
                ],
                highlight: false,
              },
              {
                colValues: [
                  'Câu hỏi Chèn cả câu hoàn chỉnh (Sentence Insertion)',
                  '~25% (Đúng 1 câu / đoạn)',
                  'Phân tích 3 Manh Mối: Trạng từ nối, Đại từ chỉ định (This, These), và trật tự thời gian logic',
                  '40 - 50 giây',
                ],
                highlight: true,
                badge: 'Phân loại điểm 800+',
              },
            ],
            summaryNote: 'Trong mỗi bài đọc Part 6 luôn có đúng 1 câu hỏi yêu cầu điền cả một câu hoàn chỉnh vào chỗ trống.',
          },
          examples: [
            {
              context: 'Trích đoạn email chào mừng nhân viên mới',
              english: 'Welcome to the team! Your orientation session is scheduled for Monday morning at nine o’clock. Please arrive promptly at the main conference room.',
              vietnamese: 'Chào mừng bạn đến với đội ngũ! Buổi định hướng của bạn đã được lên lịch vào sáng thứ Hai lúc chín giờ. Vui lòng đến đúng giờ tại phòng hội nghị chính.',
              analysis:
                'Nhận diện các loại câu hỏi trong đoạn Part 6: Câu 1 là câu chào mở đầu; câu 2 là câu ngữ pháp/thì ("is scheduled"); câu 3 là câu từ loại trạng từ bổ nghĩa cho động từ ("arrive promptly"). Thí sinh cần giải quyết nhanh các câu ngữ pháp cục bộ trong 10-15 giây.',
              highlights: ['orientation session', 'is scheduled for', 'arrive promptly'],
            },
          ],
        },
        {
          id: 'g06-s2-sentence-insertion-3-clues',
          order: 2,
          title: 'Chiến Thuật Bẻ Khóa Câu Chèn Câu Bằng 3 Manh Mối',
          sectionType: 'rules',
          contentMarkdown:
            'Dạng câu hỏi chọn câu văn hoàn chỉnh (Sentence Insertion) khiến nhiều thí sinh mất nhiều thời gian nhất. Đừng dịch từng câu từ đầu đến cuối! Hãy dùng **Kỹ thuật 3 Manh Mối** để dò tìm mối nối logic:',
          formula: {
            pattern: 'Previous Sentence <== [ Clue 1: Connector | Clue 2: Pronoun | Clue 3: Tense ] ==> Next Sentence',
            elements: [
              {
                symbol: 'Clue 1: Connectors',
                label: 'Trạng từ liên kết',
                explanation: 'However (tương phản), Furthermore (thêm ý), Therefore (kết quả), In fact (nhấn mạnh)',
                color: 'blue',
              },
              {
                symbol: 'Clue 2: Pronouns',
                label: 'Đại từ chỉ định & nhân xưng',
                explanation: 'This, That, These, Such + Noun; He, She, They (phải trỏ tới danh từ ở câu liền trước)',
                color: 'emerald',
              },
              {
                symbol: 'Clue 3: Chronology',
                label: 'Trật tự thời gian',
                explanation: 'Thì của câu chèn phải khớp với dòng sự kiện trước - sau của toàn bộ đoạn văn',
                color: 'amber',
              },
            ],
            notes: 'Nếu phương án có chứa "These changes", hãy kiểm tra xem câu liền trước có liệt kê những "changes" nào hay không!',
          },
          tipBox: {
            title: 'Chiến Thuật 45 Giây Bẻ Khóa Câu Chèn Part 6 (Sentence Insertion)',
            type: 'shortcut',
            content:
              'Đừng dịch toàn bài từ đầu đến cuối! Hãy định vị 3 manh mối then chốt trong 4 phương án lựa chọn để tìm điểm neo vào đoạn văn:',
            keySignals: [
              'Manh mối 1 (Đại từ thay thế): Tìm "This / That / These / Those / Such + Noun" hoặc "He / She / They" trong phương án. Danh từ được thay thế BẮT BUỘC phải xuất hiện ở câu liền trước.',
              'Manh mối 2 (Từ nối logic): Tìm các từ nối như "However, Therefore, Furthermore, In fact". Xác định mối quan hệ tương phản hay tương đồng với câu đứng trước.',
              'Manh mối 3 (Mốc thời gian & Dòng sự kiện): Kiểm tra sự nối tiếp của thì thời gian (Quá khứ -> Hiện tại -> Tương lai). Không bao giờ chèn một câu thì Quá khứ hoàn tất vào giữa chuỗi hành động đang lên kế hoạch tương lai.',
            ],
          },
          examples: [
            {
              context: 'Đoạn văn thông báo nâng cấp phần mềm kế toán nội bộ',
              english: 'We will introduce a new cloud-based invoicing platform next month. This transition will streamline billing workflows and reduce paper waste significantly.',
              vietnamese: 'Chúng tôi sẽ giới thiệu một nền tảng lập hóa đơn trên đám mây mới vào tháng tới. Sự chuyển đổi này sẽ tinh gọn quy trình thanh toán và giảm đáng kể lãng phí giấy tờ.',
              analysis:
                'Manh mối Đại từ chỉ định: Cụm "This transition" ở câu sau trỏ trực tiếp đến hành động "introduce a new cloud-based invoicing platform" ở câu trước. Trong đề thi Part 6, khi phương án chứa "This / These + Noun", hãy dò ngay câu liền trước xem có đề cập đến khái niệm đó hay không.',
              highlights: ['new cloud-based invoicing platform', 'This transition will streamline'],
            },
          ],
        },
        {
          id: 'g06-s3-transitional-words-table',
          order: 3,
          title: 'Bảng Các Từ Nối Thần Thánh Định Hình Mạch Văn Part 6',
          sectionType: 'comparison',
          comparisonTable: {
            title: 'Các Trạng Từ Nối Hay Gặp Nhất Định Hình Logic Mạch Văn',
            headers: ['Mối quan hệ logic', 'Từ nối tiêu biểu', 'Cách vận dụng khi làm bài'],
            rows: [
              {
                colValues: [
                  'Tương phản / Đối lập',
                  'However, Nevertheless, In contrast, On the other hand',
                  'Câu sau mang ý nghĩa trái ngược, bất ngờ hoặc sự cố so với câu trước',
                ],
                highlight: true,
                badge: 'Tần suất 90%',
              },
              {
                colValues: [
                  'Bổ sung thông tin',
                  'Furthermore, Moreover, In addition, Additionally, Besides',
                  'Câu sau bổ sung thêm một lợi ích, dịch vụ hoặc quy định mới cùng hướng với câu trước',
                ],
                highlight: true,
              },
              {
                colValues: [
                  'Nguyên nhân - Kết quả',
                  'Therefore, Consequently, As a result, Thus, Accordingly',
                  'Câu sau là hậu quả tất yếu hoặc hành động giải quyết sự cố phát sinh ở câu trước',
                ],
                highlight: true,
                badge: 'Rất hay gặp',
              },
              {
                colValues: [
                  'Minh họa / Cụ thể hóa',
                  'For example, For instance, Specifically, In particular',
                  'Câu sau đưa ra trường hợp cụ thể để làm rõ cho luận điểm khái quát ở câu trước',
                ],
                highlight: false,
              },
              {
                colValues: [
                  'Tóm tắt / Kết luận',
                  'In summary, Overall, In conclusion',
                  'Thường nằm ở câu cuối cùng của đoạn văn để chốt lại thông điệp',
                ],
                highlight: false,
              },
            ],
          },
          examples: [
            {
              context: 'Thông cáo báo chí về kết quả kinh doanh quý 3',
              english: 'Retail store sales declined slightly during the third quarter. However, e-commerce revenue expanded by twenty-four percent, driving overall profitability.',
              vietnamese: 'Doanh số tại các cửa hàng bán lẻ sụt giảm nhẹ trong quý ba. Tuy nhiên, doanh thu từ thương mại điện tử đã tăng trưởng hai mươi tư phần trăm, thúc đẩy khả năng sinh lời tổng thể.',
              analysis:
                'Từ nối tương phản trong Part 6: "However" đứng đầu câu sau dấu chấm và ngăn cách bằng dấu phẩy, chuyển hướng từ thông tin tiêu cực (doanh số bán lẻ giảm) sang thông tin tích cực bù đắp (doanh thu online tăng vọt).',
              highlights: ['sales declined slightly', 'However,', 'revenue expanded by twenty-four percent'],
            },
          ],
        },
        {
          id: 'g06-s4-traps-in-part6',
          order: 4,
          title: 'Cảnh Báo Bẫy Part 6: Lạc Mạch & Lệch Thì Toàn Đoạn',
          sectionType: 'traps',
          trapAlert: {
            trapName: 'Bẫy Câu "Nghe Rất Hay" Nhưng Lạc Mạch (Off-Topic Trap)',
            trapLevel: 'high_distractor',
            trapDescription:
              'ETS thường thiết kế một phương án chứa nhiều từ vựng chuyên ngành công sở rất chuyên nghiệp, ngữ pháp hoàn hảo, nhưng khi đặt vào đoạn văn lại không hề ăn khớp với câu trước và câu sau.',
            distractorExample: {
              prompt:
                '[Ngữ cảnh bài đọc: Email thông báo bảo trì máy chủ vào cuối tuần]. Chỗ trống cần chèn 1 câu sau câu nói về việc đội IT đang nỗ lực giảm thời gian ngừng hoạt động.',
              incorrectChoice:
                '(B) You are invited to submit your annual vacation requests through the HR portal by Friday.',
              correctChoice:
                '(A) They have successfully installed redundant power backups to prevent extended outages.',
              whyDistractorFails:
                'Phương án B là một câu thông báo công sở rất chuẩn, nhưng hoàn toàn lạc đề so với chủ đề kỹ thuật bảo trì máy chủ của đoạn văn.',
            },
            antidote:
              'Luôn kiểm tra: 1. Câu này có đại từ thay thế cho chủ ngữ câu trước không? 2. Từ khóa chính có liên quan trực tiếp đến thông điệp của đoạn hay không? Loại ngay các phương án nói sang một chủ đề hành chính khác.',
          },
          examples: [
            {
              context: 'Bản ghi nhớ bảo trì thang máy tòa nhà văn phòng',
              english: 'Technicians will conduct annual safety inspections on elevators five through eight this Saturday. Consequently, tenants on these upper floors should anticipate brief delays.',
              vietnamese: 'Các kỹ thuật viên sẽ tiến hành kiểm tra an toàn thường niên đối với các thang máy từ năm đến tám vào thứ Bảy này. Do đó, khách thuê tại các tầng trên này nên dự trù sự chậm trễ ngắn.',
              analysis:
                'Bẫy câu lạc mạch (Off-topic Trap): Tránh chọn các câu có vẻ đúng ngữ pháp nhưng chuyển sang chủ đề khác (như suất ăn trưa hay bảo hiểm y tế). Câu chèn chuẩn sử dụng từ nối "Consequently" và đại từ chỉ định "these upper floors" để liên kết chặt chẽ với việc sửa thang máy.',
              highlights: ['safety inspections on elevators', 'Consequently,', 'these upper floors'],
            },
          ],
        },
      ],
      checkpoints: [
        {
          id: 'g06-cp1',
          order: 1,
          passage:
            'To: All Staff <staff@zenithlogistics.com>\nFrom: Facilities Management <facilities@zenithlogistics.com>\nDate: October 14\nSubject: Upcoming Server Room Maintenance and Office Access\n\nPlease be advised that the main server infrastructure will undergo scheduled maintenance this coming weekend, starting Saturday at 8:00 PM. [1] _______ the upgrade process, all remote network services and internal databases will be temporarily unavailable.\n\nOur IT specialists have worked [2] _______ to ensure that downtime is kept to an absolute minimum. [3] _______. We expect all core software applications to be fully restored by Sunday at 6:00 PM.\n\nIf you plan to enter the corporate building during the maintenance window, please note that electronic keycards will not function. Instead, you will be [4] _______ to show photo identification to the security officer on duty at the front desk. We appreciate your cooperation.',
          prompt: 'Refer to blank [1] in the email passage above. Choose the best option to complete the sentence.',
          options: [
            { key: 'A', text: 'While' },
            { key: 'B', text: 'Although' },
            { key: 'C', text: 'Because' },
            { key: 'D', text: 'During' },
          ],
          correctAnswer: 'D',
          explanationVi:
            'Phân tích ngữ pháp chỗ trống [1]: Sau chỗ trống là cụm danh từ "the upgrade process" (quá trình nâng cấp). Để diễn tả thời gian diễn ra trong suốt một sự kiện hay quá trình, ta cần một GIỚI TỪ. "During" (phương án D) là giới từ đúng mang nghĩa "trong suốt quá trình nâng cấp". Các phương án (A) While, (B) Although, (C) Because đều là LIÊN TỪ phụ thuộc, bắt buộc phải đi kèm với một mệnh đề hoàn chỉnh (S + V).',
          trapSignal: 'Nhầm lẫn giữa liên từ While và giới từ During khi thấy cụm từ chỉ quá trình thời gian.',
          timeTargetSeconds: 15,
        },
        {
          id: 'g06-cp2',
          order: 2,
          passage:
            'To: All Staff <staff@zenithlogistics.com>\nFrom: Facilities Management <facilities@zenithlogistics.com>\nDate: October 14\nSubject: Upcoming Server Room Maintenance and Office Access\n\nPlease be advised that the main server infrastructure will undergo scheduled maintenance this coming weekend, starting Saturday at 8:00 PM. [1] During the upgrade process, all remote network services and internal databases will be temporarily unavailable.\n\nOur IT specialists have worked [2] _______ to ensure that downtime is kept to an absolute minimum. [3] _______. We expect all core software applications to be fully restored by Sunday at 6:00 PM.\n\nIf you plan to enter the corporate building during the maintenance window, please note that electronic keycards will not function. Instead, you will be [4] _______ to show photo identification to the security officer on duty at the front desk. We appreciate your cooperation.',
          prompt: 'Refer to blank [2] in the email passage above. Choose the best option to complete the sentence.',
          options: [
            { key: 'A', text: 'diligently' },
            { key: 'B', text: 'diligence' },
            { key: 'C', text: 'diligent' },
            { key: 'D', text: 'diligences' },
          ],
          correctAnswer: 'A',
          explanationVi:
            'Phân tích ngữ pháp chỗ trống [2]: Động từ trong câu là "have worked" (nội động từ thì hiện tại hoàn thành). Để bổ nghĩa cho hành động làm việc của các chuyên gia IT, ta cần một TRẠNG TỪ (Adverb) thể hiện mức độ/cách thức. "Diligently" (một cách chăm chỉ, cần mẫn, phương án A) là trạng từ bổ nghĩa hoàn hảo cho "worked" (worked diligently to ensure... = đã làm việc cần mẫn để đảm bảo...). (B) diligence là danh từ; (C) diligent là tính từ; (D) diligences là danh từ số nhiều.',
          trapSignal: 'Bẫy từ loại: Điền tính từ diligent thay vì trạng từ diligently để bổ nghĩa cho động từ work.',
          timeTargetSeconds: 15,
        },
        {
          id: 'g06-cp3',
          order: 3,
          passage:
            'To: All Staff <staff@zenithlogistics.com>\nFrom: Facilities Management <facilities@zenithlogistics.com>\nDate: October 14\nSubject: Upcoming Server Room Maintenance and Office Access\n\nPlease be advised that the main server infrastructure will undergo scheduled maintenance this coming weekend, starting Saturday at 8:00 PM. [1] During the upgrade process, all remote network services and internal databases will be temporarily unavailable.\n\nOur IT specialists have worked [2] diligently to ensure that downtime is kept to an absolute minimum. [3] _______. We expect all core software applications to be fully restored by Sunday at 6:00 PM.\n\nIf you plan to enter the corporate building during the maintenance window, please note that electronic keycards will not function. Instead, you will be [4] _______ to show photo identification to the security officer on duty at the front desk. We appreciate your cooperation.',
          prompt: 'Refer to blank [3] in the email passage above. Which sentence best fits the blank?',
          options: [
            {
              key: 'A',
              text: 'You are invited to submit your annual leave requests through the online HR portal.',
            },
            {
              key: 'B',
              text: 'The new corporate branch office is located within walking distance of the central station.',
            },
            {
              key: 'C',
              text: 'Consequently, no employees will receive their travel reimbursement checks on schedule.',
            },
            {
              key: 'D',
              text: 'They have successfully installed redundant power backups to prevent extended outages.',
            },
          ],
          correctAnswer: 'D',
          explanationVi:
            'Phân tích câu chèn chỗ trống [3]: Áp dụng Chiến thuật 3 Manh Mối:\n1. Manh mối Đại từ: Phương án (D) dùng đại từ "They" thay thế hoàn hảo cho danh từ "Our IT specialists" ở câu liền trước.\n2. Manh mối Mạch ý: Câu trước nói các chuyên gia IT đã làm việc cần mẫn để giảm thiểu downtime ("downtime is kept to an absolute minimum"). Phương án (D) giải thích hành động cụ thể họ đã làm: "They have successfully installed redundant power backups to prevent extended outages" (Họ đã lắp đặt thành công các bộ nguồn dự phòng để tránh việc mất điện kéo dài). Câu tiếp theo tiếp tục mạch ý lạc quan: "We expect all core software applications to be fully restored by Sunday at 6:00 PM".\nCác phương án khác hoàn toàn lạc mạch: (A) nói về xin nghỉ phép qua cổng nhân sự; (B) nói về vị trí chi nhánh công ty; (C) nói về việc không nhận được tiền hoàn trả công tác phí.',
          trapSignal: 'Bẫy câu lạc mạch (Off-topic): Chọn câu có vẻ chuyên nghiệp nhưng không liên quan đến chủ đề bảo trì máy chủ.',
          timeTargetSeconds: 30,
        },
        {
          id: 'g06-cp4',
          order: 4,
          passage:
            'To: All Staff <staff@zenithlogistics.com>\nFrom: Facilities Management <facilities@zenithlogistics.com>\nDate: October 14\nSubject: Upcoming Server Room Maintenance and Office Access\n\nPlease be advised that the main server infrastructure will undergo scheduled maintenance this coming weekend, starting Saturday at 8:00 PM. [1] During the upgrade process, all remote network services and internal databases will be temporarily unavailable.\n\nOur IT specialists have worked [2] diligently to ensure that downtime is kept to an absolute minimum. [3] They have successfully installed redundant power backups to prevent extended outages. We expect all core software applications to be fully restored by Sunday at 6:00 PM.\n\nIf you plan to enter the corporate building during the maintenance window, please note that electronic keycards will not function. Instead, you will be [4] _______ to show photo identification to the security officer on duty at the front desk. We appreciate your cooperation.',
          prompt: 'Refer to blank [4] in the email passage above. Choose the best option to complete the sentence.',
          options: [
            { key: 'A', text: 'require' },
            { key: 'B', text: 'requiring' },
            { key: 'C', text: 'required' },
            { key: 'D', text: 'requirement' },
          ],
          correctAnswer: 'C',
          explanationVi:
            'Phân tích ngữ pháp chỗ trống [4]: Cấu trúc bị động chỉ quy định đối với nhân viên: "you will be + V3/ed + to V". Cụm từ chuẩn "be required to do something" mang nghĩa "bạn sẽ được yêu cầu phải làm gì" (phương án C: bạn sẽ được yêu cầu xuất trình giấy tờ tùy thân có ảnh cho nhân viên an ninh). (A) require là động từ nguyên mẫu; (B) requiring là V-ing (thể chủ động); (D) requirement là danh từ.',
          trapSignal: 'Nhầm lẫn giữa dạng bị động required và dạng chủ động requiring trong cấu trúc quy định công sở.',
          timeTargetSeconds: 15,
        },
      ],
      bridgeToPractice: {
        targetPart: 6,
        partName: 'Part 6: Text Completion',
        recommendedQuestionCount: 16,
        filterMode: 'unseen',
        practiceUrl: '/toeic/exam/bank?part=6&limit=16&mode=practice&filterMode=unseen',
        ctaText: 'Luyện ngay 16 câu Part 6 Điền đoạn văn',
      },
    },
  ],
};
