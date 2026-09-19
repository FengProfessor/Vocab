/**
 * Foundational Speaking System for False Beginners (A0-A1)
 * File: src/data/speaking/foundation/stage-mindset.ts
 *
 * Chặng Khởi Động: Hệ Điều Hành Tư Duy Nói (Speaking Mindset OS)
 * Giảng dạy chuyên sâu 6 mô hình tư duy cốt lõi giúp người mất gốc phá vỡ
 * vòng lặp liệt ngữ pháp, giải tỏa tâm lý sợ sai, và tự tin mở miệng giao tiếp.
 */

import type { MindsetLesson, MindsetPledge } from '@/types/speaking-foundation';

export const STAGE_MINDSET_LESSONS: MindsetLesson[] = [
  {
    id: 'mindset-01-paralysis',
    order: 1,
    slug: 'pha-vo-vong-lap-liet-ngu-phap',
    title: 'Phá Vỡ "Vết Thương Sư Phạm" & Vòng Lặp Liệt Ngữ Pháp',
    taglineVi: 'Tại sao học 10 năm ngữ pháp vẫn cứng đờ cơ miệng khi nói?',
    corePrincipleVi:
      'Nói tiếng Anh không phải là bài thi ngữ pháp trên giấy. Bộ não cần chuyển từ vùng nhận diện chữ viết (Wernicke) sang phản xạ cơ miệng (Broca).',
    psychologyRootVi:
      'Suốt 12 năm phổ thông, bạn bị gạch mực đỏ mỗi khi chia sai thì, thiếu đuôi -s. Điều này tạo nên "Vết thương sư phạm": phản xạ sợ sai ăn sâu vào tiềm thức. Khi gặp người bản xứ, não bạn dịch câu tiếng Việt sang tiếng Anh, quét 12 thì, lục lọi giới từ. Quá trình này mất 5-8 giây. Trong khi đó, khoảng dừng tự nhiên của hội thoại chỉ là 1.5-2 giây. Khi đối phương im lặng chờ đợi, hạch hạnh nhân (Amygdala) báo động hoảng loạn, khiến cơ hàm và lưỡi cứng đờ (Speech Freeze).',
    actionableTechniqueVi:
      'Chấp nhận "Quy tắc 3 Giây Đầu Tiên": Bật âm thanh ngay lập tức mà không chờ câu văn hoàn hảo trong đầu. Luyện cơ miệng như tập gym — nói to, dứt khoát từng cụm từ để kích hoạt vùng vận động Broca.',
    comparison: {
      beforeTitle: 'Tê Liệt Vì Dịch Thầm (Mental Translation)',
      beforeDescription:
        'Não nghĩ tiếng Việt -> dịch từng chữ sang tiếng Anh -> dò ngữ pháp -> sợ chia sai thì -> câm nín 6 giây.',
      beforeExample:
        '"Tôi muốn hỏi đường đi đến sân bay" -> "I... want... to... ask... way... to... the airport?" (Ngập ngừng, mất tự tin, đối phương sốt ruột).',
      afterTitle: 'Phản Xạ Cụm Đúc Sẵn (Instant Reflex)',
      afterDescription:
        'Kích hoạt ngay khung câu cửa miệng quen thuộc, nhả âm dưới 0.5 giây mà không cần dịch thầm.',
      afterExample:
        '"Excuse me, where is the airport, please?" (Nói dõng dạc, trôi chảy, đối phương hiểu và hỗ trợ ngay lập tức).',
    },
    keyTakeaways: [
      'Nói sai ngữ pháp không chết ai, nhưng im lặng quá 3 giây sẽ giết chết cuộc trò chuyện.',
      'Học ngữ pháp trên giấy chỉ kích hoạt vùng hiểu (Wernicke), mở miệng nói cần luyện cơ vận động (Broca).',
      'Muốn nói đúng trước hết phải dám nói sai. Sự tự tin đến từ việc dám mở miệng chứ không đến từ việc thuộc lòng 12 thì.',
    ],
    audioExampleSentence: 'Excuse me, where is the airport, please?',
  },
  {
    id: 'mindset-02-communication',
    order: 2,
    slug: 'ket-noi-hon-hoan-hao',
    title: 'Tư Duy 1: Kết Nối Hơn Hoàn Hảo (Communication over Perfection)',
    taglineVi: 'Người nghe là đối tác đàm thoại, không phải giám khảo chấm thi',
    corePrincipleVi:
      'Trong giao tiếp quốc tế, 85% dung lượng thông điệp nằm ở Từ Nội Dung (Content Words). Người bản xứ quan tâm bạn muốn gì, không ai đi bắt bẻ mạo từ a/the hay thì quá khứ.',
    psychologyRootVi:
      'Người mất gốc luôn nghĩ người bản xứ đang "soi" lỗi ngữ pháp của mình. Sự thật hoàn toàn ngược lại: Trong đời thực, người nghe chỉ cần hiểu bạn đang cần gì để phối hợp. Họ vô cùng kiên nhẫn và thông cảm cho người học ngôn ngữ thứ hai. Nỗi sợ bị chê cười thực chất chỉ là "bóng ma tâm lý" do chính bạn tự tưởng tượng ra.',
    actionableTechniqueVi:
      'Tập trung phát âm rõ các "Từ nội dung" (Danh từ, Động từ chính, Tính từ) với âm lượng rõ ràng. Tạm thời quên đi các mạo từ và giới từ phụ. Nói to, rõ ràng và nhìn thẳng vào mắt đối phương.',
    comparison: {
      beforeTitle: 'Cầu Toàn Quá Mức (Perfectionism Trap)',
      beforeDescription:
        'Cố gắng nghĩ câu ghép phức tạp, chia thì hoàn thành, dùng từ đao to búa lớn nhưng ấp úng, lí nhí.',
      beforeExample:
        '"I was wondering if it might be possible for you to inform me of the bill..." (Nói lắp bắp, quên từ giữa chừng).',
      afterTitle: 'Truyền Tải Trực Diện (Direct Communication)',
      afterDescription:
        'Dùng câu ngắn, từ vựng cốt lõi, phát âm dứt khoát, thông điệp truyền đi tức thì.',
      afterExample:
        '"Can I have the bill, please?" (Gọn gàng, lịch sự, phục vụ bàn mang hóa đơn tới ngay trong 5 giây).',
    },
    keyTakeaways: [
      'Nói câu 5 từ trôi chảy luôn đạt hiệu quả cao hơn câu 15 từ mà ấp úng đứt đoạn.',
      'Người bản xứ đánh giá cao sự thân thiện và nỗ lực giao tiếp dõng dạc hơn là sự rụt rè sợ sai.',
      'Mục tiêu của giao tiếp là "Thông Hiểu" (Comprehensibility), không phải "Không Tì Vết" (Perfection).',
    ],
    audioExampleSentence: 'Can I have the bill, please?',
  },
  {
    id: 'mindset-03-lego-chunk',
    order: 3,
    slug: 'nguyen-ly-khoi-lego',
    title: 'Tư Duy 2: Nói Bằng Khối Lego, Tuyệt Đối Cấm Ghép Từng Từ',
    taglineVi: 'Bí quyết nhả âm dưới 0.3 giây của người bản xứ',
    corePrincipleVi:
      'Không xây câu từ con số không (De novo syntax). Hãy lắp ghép các cụm đóng gói sẵn (Formulaic Chunks) như chơi trò xếp hình Lego.',
    psychologyRootVi:
      'Các nghiên cứu ngôn ngữ học của Giáo sư Michael Lewis chứng minh: Hơn 70% lời nói của người bản xứ là các chuỗi cụm từ cố định đúc sẵn. Não người không có đủ dung lượng bộ nhớ làm việc để vừa ghép 6 từ đơn, vừa chia thì, vừa chỉnh phát âm trong cùng một giây. Khi bạn cố ghép từng từ đơn lẻ, não bộ lập tức rơi vào trạng thái quá tải nhận thức.',
    actionableTechniqueVi:
      'Học tiếng Anh theo "Khung đế Lego + Khối gắn". Học thuộc lòng các khung câu bất biến như `I\'d like to [action]`, `Could you please [action]`, `Do you have [thing]`. Khi nói, bạn chỉ cần thay thế đúng 1 từ ngữ cảnh vào chỗ trống mà không bao giờ sợ sai ngữ pháp.',
    comparison: {
      beforeTitle: 'Ghép Từng Chữ Rời Rạc (Word-by-Word Assembly)',
      beforeDescription:
        'Lắp ghép từng từ đơn lẻ: Chủ ngữ + Động từ khuyết thiếu + Động từ chính + Giới từ + Danh từ.',
      beforeExample:
        '"I... would... like... to... have... a... hot... tea" (Mất 4 giây tư duy ngữ pháp).',
      afterTitle: 'Lắp Khối Lego Đúc Sẵn (Lego Chunk Assembly)',
      afterDescription:
        'Ráp Khung bất biến [I\'d like to have...] + Khối từ vựng [...a hot tea]. Tốc độ nhả âm dưới 0.5s.',
      afterExample:
        '"[I\'d like to have] + [a hot tea, please]." (Phản xạ tức thì, tự nhiên như tiếng mẹ đẻ).',
    },
    keyTakeaways: [
      'Đừng học từ vựng riêng lẻ; hãy luôn học từ vựng đi kèm khung hành động.',
      'Một khung câu bất biến có thể tạo ra 20-30 câu giao tiếp đời thực chỉ bằng việc hoán đổi danh từ/động từ.',
      'Giảm tải cho não bộ: Chỉ cần nhớ 1 khối cụm thay vì nhớ 5 quy tắc ngữ pháp rời rạc.',
    ],
    audioExampleSentence: 'I would like to have a hot tea, please.',
  },
  {
    id: 'mindset-04-three-beat',
    order: 4,
    slug: 'quy-tac-no-cau-3-nhip',
    title: 'Tư Duy 3: Quy Tắc Nở Câu 3 Nhịp Thở (The 3-Beat Expansion)',
    taglineVi: 'Thoát khỏi tật nói câu cộc lốc chỉ bằng từ vựng lớp 3',
    corePrincipleVi:
      'Mở rộng câu theo 3 nhịp thở tự nhiên: Nhịp 1 (Cốt lõi) -> Nhịp 2 (Bối cảnh) -> Nhịp 3 (Cảm xúc / Lý do). Bạn sẽ nói câu dài trôi chảy mà không cần ngữ pháp cao siêu.',
    psychologyRootVi:
      'Người mất gốc thường rơi vào 2 thái cực: Hoặc nói cộc lốc 2 từ (`I stay home`, `I tired`) khiến cuộc trò chuyện cụt ngủn; hoặc cố dùng mệnh đề quan hệ phức tạp rồi bị vấp. Quy tắc 3 nhịp dựa trên nhịp thở tự nhiên của cơ hoành: mỗi nhịp nói từ 3-4 từ, nghỉ lấy hơi 300ms rồi nói tiếp nhịp sau.',
    actionableTechniqueVi:
      'Áp dụng công thức 3 Nhịp: \n- Nhịp 1 (Ai làm gì?): `I stayed home...`\n- Nhịp 2 (Ở đâu/Khi nào/Với ai?): `...on Sunday with my brother...`\n- Nhịp 3 (Vì sao/Cảm xúc?): `...because I was tired.`\nGhép lại thành câu 13 từ mượt mà: *"I stayed home on Sunday with my brother because I was tired."*',
    comparison: {
      beforeTitle: 'Câu Cụt Lủn / Đứt Đoạn (Blunt Sentences)',
      beforeDescription:
        'Trả lời nhát gừng 2-3 từ, khiến người đối diện cảm thấy bạn lạnh lùng hoặc bế tắc.',
      beforeExample:
        '"Where did you go?" -> "Home." / "Why?" -> "Tired." (Cộc lốc, cuộc trò chuyện rơi vào ngõ cụt).',
      afterTitle: 'Nở Câu 3 Nhịp Mượt Mà (3-Beat Symphony)',
      afterDescription:
        'Mỗi câu nói mở rộng tự nhiên qua 3 nhịp thở, cung cấp thông tin sống động và gợi mở câu chuyện.',
      afterExample:
        '"I stayed home on Sunday with my brother because I was tired." (Tự nhiên, ấm áp, giàu kết nối).',
    },
    keyTakeaways: [
      'Không cần từ vựng khó; bí quyết nằm ở việc kết nối 3 nhịp thông tin đơn giản.',
      'Nghỉ lấy hơi 300ms giữa các nhịp là hoàn toàn tự nhiên, giúp não kịp sắp xếp ý tưởng cho nhịp sau.',
      'Câu 3 nhịp giúp bạn lập tức thoát khỏi hình ảnh người học ngập ngừng để trở thành người đàm thoại tự tin.',
    ],
    audioExampleSentence: 'I stayed home on Sunday with my brother because I was tired.',
  },
  {
    id: 'mindset-05-survival-cushions',
    order: 5,
    slug: 'phao-cuu-sinh-va-khoang-lang',
    title: 'Tư Duy 4: Phao Cứu Sinh & Làm Chủ Khoảng Lặng (Stalling Cushions)',
    taglineVi: 'Biến 3 giây bối rối thành phong thái đĩnh đạc của người làm chủ cuộc chơi',
    corePrincipleVi:
      'Khi bí từ, tuyệt đối không thở dài hay câm lặng khó xử. Hãy kích hoạt ngay các "Gối đệm câu" để mua 3 giây suy nghĩ tự tin.',
    psychologyRootVi:
      'Người bản xứ cũng thường xuyên quên từ hoặc cần suy nghĩ ý tưởng. Nhưng họ không bao giờ im lặng câm nín; họ lấp đầy khoảng thời gian chết bằng các cụm từ đệm đĩnh đạc (`Well, let me see...`, `To be honest...`). Ngược lại, người mất gốc khi bí từ thường phát ra tiếng `ờ... à...`, toát mồ hôi và cúi gằm mặt xuống. Khoảng lặng chết này phá hủy hoàn toàn nhịp điệu của cuộc đối thoại.',
    actionableTechniqueVi:
      'Thuộc lòng 6 câu đệm cứu sinh bỏ túi. Hễ thấy não bắt đầu cần thời gian suy nghĩ, miệng lập tức phát ra câu đệm với ngữ điệu trầm ấm, thong thả.',
    comparison: {
      beforeTitle: 'Khoảng Lặng Hoảng Loạn (Panic Silence)',
      beforeDescription:
        'Bí từ -> phát ra tiếng "ờ... ừm..." kéo dài -> bối rối cúi đầu -> bầu không khí ngột ngạt khó xử.',
      beforeExample:
        '"What is your favorite dish?" -> "...Uh... ummm... like... (im lặng 5 giây bối rối)..."',
      afterTitle: 'Gối Đệm Mua Thời Gian (Strategic Cushioning)',
      afterDescription:
        'Nhả câu đệm điềm tĩnh, mua 3 giây cho não lựa chọn từ vựng trong phong thái tự tin.',
      afterExample:
        '"Well, let me see... To be honest, I really love seafood." (Đĩnh đạc, tự nhiên, làm chủ tình thế).',
    },
    stallingPhrases: [
      {
        phraseEn: 'Well, let me see...',
        meaningVi: 'À, để tôi xem nào...',
        usageNoteVi: 'Dùng khi cần 2 giây để nhớ lại thông tin hoặc suy nghĩ lựa chọn.',
      },
      {
        phraseEn: 'To be honest with you...',
        meaningVi: 'Thành thật mà nói thì...',
        usageNoteVi: 'Dùng trước khi bày tỏ cảm xúc hoặc quan điểm cá nhân.',
      },
      {
        phraseEn: "That's a very good question...",
        meaningVi: 'Đó là một câu hỏi rất hay đấy...',
        usageNoteVi: 'Mua trọn vẹn 3.5 giây suy nghĩ khi đối phương hỏi câu bất ngờ.',
      },
      {
        phraseEn: 'Could you say that again a bit slower, please?',
        meaningVi: 'Bạn có thể nói chậm lại một chút được không?',
        usageNoteVi: 'Phao cứu sinh khi đối phương nói quá nhanh; lịch sự và chuyên nghiệp.',
      },
      {
        phraseEn: 'What does that word mean?',
        meaningVi: 'Từ đó nghĩa là gì vậy bạn?',
        usageNoteVi: 'Chủ động hỏi nghĩa thay vì gật đầu giả vờ hiểu.',
      },
      {
        phraseEn: 'How do you say this in English?',
        meaningVi: 'Cái này tiếng Anh nói thế nào nhỉ?',
        usageNoteVi: 'Chỉ tay vào đồ vật hoặc miêu tả để nhờ đối phương hỗ trợ từ vựng.',
      },
    ],
    keyTakeaways: [
      'Khoảng lặng không đáng sợ; cách bạn đối diện với khoảng lặng mới quyết định sự tự tin.',
      'Câu đệm là công cụ của những người giao tiếp lão luyện, không phải là sự che giấu yếu kém.',
      'Luôn mang theo 6 câu đệm cứu sinh như một chiếc phao bơi tinh thần trong mọi cuộc trò chuyện.',
    ],
    audioExampleSentence: 'Well, let me see... To be honest, I really love seafood.',
  },
  {
    id: 'mindset-06-finite-game',
    order: 6,
    slug: 'ranh-gioi-du-nguyen-ly-80-20',
    title: 'Tư Duy 5: Ranh Giới "ĐỦ" — Không Sợ Học Thiếu, Không Sợ Lan Man',
    taglineVi: 'Định luật Pareto 80/20: Nắm vững 28 khung câu là bao quát 85% hội thoại nhân loại',
    corePrincipleVi:
      'Tiếng Anh giao tiếp đời sống là một Trò Chơi Hữu Hạn. Bạn không cần học vô tận hàng nghìn từ vựng để có thể nói chuyện tự tin.',
    psychologyRootVi:
      'Học viên sợ học thiếu vì bị áp đảo bởi hàng trăm đầu sách và ứng dụng trên thị trường. Họ nghĩ ngoài kia có bí kíp thần thánh nào đó mà mình chưa biết. Sự thật theo nghiên cứu ngữ liệu của Đại học Oxford: 300 từ vựng cốt lõi và 28 khung câu sinh tồn chiếm tới 85% dung lượng mọi cuộc đàm thoại thường nhật. 15,000 từ vựng còn lại chỉ thuộc về văn bản học thuật hoặc chuyên ngành hẹp.',
    actionableTechniqueVi:
      'Xác lập "Cam Kết Khép Kín" (Closed Scope Guarantee): Tập trung toàn lực luyện nhuyễn 28 Khung câu của Chặng 1, 6 bài thế khối của Chặng 2 và 6 bài đàm thoại Chặng 3. Đừng sa đà vào việc học thêm từ mới khi các khung câu cơ bản chưa biến thành phản xạ tủy sống.',
    comparison: {
      beforeTitle: 'Lan Man & Quá Tải (Infinite Information Overload)',
      beforeDescription:
        'Cố nhồi nhét 3000 từ vựng, học hàng chục cấu trúc ngữ pháp phức tạp nhưng khi cần nói thì không nhớ nổi một câu.',
      beforeExample:
        'Học thuộc các từ như "magnificent", "phenomenal" nhưng khi gọi món cà phê thì ấp úng không biết nói câu nào.',
      afterTitle: 'Làm Chủ Cốt Lõi 80/20 (Mastering the Core 20%)',
      afterDescription:
        'Luyện tập cực nhuyễn 28 khung câu phản xạ; biến chúng thành phản xạ tự động dưới 1 giây.',
      afterExample:
        'Làm chủ khung [Can I have...] và [Where is the...]; đi du lịch vòng quanh thế giới không bao giờ bị lạc.',
    },
    keyTakeaways: [
      'Biết ít nhưng nhả âm dưới 1 giây có giá trị gấp 10 lần biết nhiều nhưng mất 10 giây mới nhớ ra.',
      'Luyện nói là môn thể thao vận động cơ bắp, không phải môn lưu trữ bách khoa toàn thư.',
      'Bạn đã học đủ nền tảng. Việc còn lại duy nhất là mở mic và kích hoạt phản xạ cơ miệng.',
    ],
    audioExampleSentence: 'Can I have a cup of coffee and where is the restroom, please?',
  },
];

export const MINDSET_PLEDGES: MindsetPledge[] = [
  {
    id: 'pledge-1',
    titleVi: 'Nói to, rõ ràng và dứt khoát',
    descriptionVi:
      'Tôi cam kết mở rộng khẩu hình, nói với âm lượng dõng dạc, tuyệt đối không thì thầm lí nhí trong miệng.',
  },
  {
    id: 'pledge-2',
    titleVi: 'Ưu tiên kết nối, chấp nhận nói sai ngữ pháp nhỏ',
    descriptionVi:
      'Tôi hiểu rằng người nghe cần thông điệp chứ không chấm thi. Tôi sẵn sàng bỏ qua mạo từ a/the để giữ mạch nói trôi chảy.',
  },
  {
    id: 'pledge-3',
    titleVi: 'Nói theo Khối Lego, cấm ghép từng từ từ tiếng Việt',
    descriptionVi:
      'Tôi từ bỏ thói quen dịch thầm từng chữ. Tôi sẽ học và nhả âm theo nguyên cụm đóng gói sẵn.',
  },
  {
    id: 'pledge-4',
    titleVi: 'Dùng câu đệm mua thời gian khi bí từ',
    descriptionVi:
      'Khi cần suy nghĩ, tôi sẽ dùng "Well, let me see..." hoặc "To be honest...", tuyệt đối không im lặng hay thở dài bối rối.',
  },
  {
    id: 'pledge-5',
    titleVi: 'Tin tưởng vào nguyên lý 80/20 và ranh giới "ĐỦ"',
    descriptionVi:
      'Tôi không hoang mang sợ học thiếu. Tôi cam kết làm chủ 28 khung câu sống còn để tự tin bước ra thế giới.',
  },
];

export function getMindsetLessons(): MindsetLesson[] {
  return STAGE_MINDSET_LESSONS;
}

export function getMindsetLessonById(id: string): MindsetLesson | undefined {
  return STAGE_MINDSET_LESSONS.find((l) => l.id === id || l.slug === id);
}

export function getMindsetPledges(): MindsetPledge[] {
  return MINDSET_PLEDGES;
}
