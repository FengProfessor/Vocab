export interface ConversationPhrase {
  phrase: string;
  meaning: string;
}

export interface ConversationItem {
  id: string;
  category: 'daily' | 'work' | 'travel' | 'dining' | 'toeic';
  categoryLabel: string;
  english: string;
  vietnamese: string;
  ipa?: string;
  situation: string;
  keyPhrases: ConversationPhrase[];
}

export interface ConversationCategory {
  id: ConversationItem['category'];
  name: string;
  description: string;
  iconName: string;
  count: number;
}

export const CONVERSATION_CATEGORIES: ConversationCategory[] = [
  {
    id: 'daily',
    name: 'Giao tiếp hàng ngày',
    description: 'Chào hỏi, cảm ơn, hỏi thăm, chia tay và duy trì cuộc trò chuyện tự nhiên',
    iconName: 'MessageCircle',
    count: 10,
  },
  {
    id: 'work',
    name: 'Công sở & Công việc',
    description: 'Họp hành, trao đổi qua email, xin ý kiến, thương thảo tiến độ',
    iconName: 'Briefcase',
    count: 10,
  },
  {
    id: 'travel',
    name: 'Du lịch & Di chuyển',
    description: 'Thủ tục sân bay, nhận phòng khách sạn, hỏi đường và mua vé tàu xe',
    iconName: 'Plane',
    count: 10,
  },
  {
    id: 'dining',
    name: 'Ăn uống & Mua sắm',
    description: 'Đặt bàn nhà hàng, gọi món, hỏi kích cỡ và thanh toán hóa đơn',
    iconName: 'Utensils',
    count: 8,
  },
  {
    id: 'toeic',
    name: 'Hội thoại đề thi TOEIC',
    description: 'Các mẫu câu đàm thoại tần suất xuất hiện cao nhất trong Part 2 và Part 3',
    iconName: 'GraduationCap',
    count: 8,
  },
];

export const CONVERSATION_ITEMS: ConversationItem[] = [
  // ── GIAO TIẾP HÀNG NGÀY (DAILY) ──
  {
    id: 'd-1',
    category: 'daily',
    categoryLabel: 'Giao tiếp hàng ngày',
    english: 'How have you been lately? It feels like ages since we last met.',
    vietnamese: 'Dạo này bạn thế nào rồi? Cảm giác như đã lâu lắm rồi chúng ta mới gặp lại.',
    ipa: '/haʊ hæv juː biːn ˈleɪtli? ɪt fiːlz laɪk ˈeɪdʒɪz sɪns wiː læst mɛt/',
    situation: 'Khi gặp lại bạn bè hoặc người quen sau một khoảng thời gian dài',
    keyPhrases: [
      { phrase: 'how have you been', meaning: 'dạo này bạn thế nào' },
      { phrase: 'feels like ages', meaning: 'cảm giác như đã lâu lắm rồi' },
    ],
  },
  {
    id: 'd-2',
    category: 'daily',
    categoryLabel: 'Giao tiếp hàng ngày',
    english: 'I really appreciate your help. I couldn’t have pulled this off without you.',
    vietnamese: 'Tôi thực sự rất biết ơn sự giúp đỡ của bạn. Không có bạn thì tôi đã không thể hoàn thành việc này.',
    ipa: '/aɪ ˈrɪəli əˈpriːʃieɪt jɔː hɛlp. aɪ ˈkʊdnt hæv pʊld ðɪs ɒf wɪˈðaʊt juː/',
    situation: 'Khi muốn bày tỏ sự biết ơn sâu sắc đối với người đã hỗ trợ mình',
    keyPhrases: [
      { phrase: 'pull something off', meaning: 'hoàn thành thành công một việc khó khăn' },
      { phrase: 'appreciate someone’s help', meaning: 'trân trọng sự giúp đỡ của ai đó' },
    ],
  },
  {
    id: 'd-3',
    category: 'daily',
    categoryLabel: 'Giao tiếp hàng ngày',
    english: 'I’m looking forward to catching up with you this weekend.',
    vietnamese: 'Tôi rất mong đợi được gặp gỡ tâm sự với bạn vào cuối tuần này.',
    ipa: '/aɪm ˈlʊkɪŋ ˈfɔːrwərd tuː ˈkætʃɪŋ ʌp wɪð juː ðɪs ˈwiːkˌɛnd/',
    situation: 'Khi hẹn gặp bạn bè để chia sẻ chuyện trò',
    keyPhrases: [
      { phrase: 'look forward to', meaning: 'trông mong, háo hức chờ đợi' },
      { phrase: 'catch up with', meaning: 'gặp gỡ cập nhật tin tức' },
    ],
  },
  {
    id: 'd-4',
    category: 'daily',
    categoryLabel: 'Giao tiếp hàng ngày',
    english: 'Sorry to interrupt, but could you keep it down a bit? I’m on a call.',
    vietnamese: 'Xin lỗi vì làm phiền, nhưng bạn có thể nói nhỏ lại một chút được không? Tôi đang có cuộc gọi.',
    ipa: '/ˈsɒri tuː ˌɪntəˈrʌpt, bʌt kʊd juː kiːp ɪt daʊn ə bɪt? aɪm ɒn ə kɔːl/',
    situation: 'Khi muốn nhờ ai đó giữ trật tự một cách lịch sự',
    keyPhrases: [
      { phrase: 'sorry to interrupt', meaning: 'xin lỗi vì làm phiền/ngắt lời' },
      { phrase: 'keep it down', meaning: 'nói nhỏ lại, giữ trật tự' },
    ],
  },
  {
    id: 'd-5',
    category: 'daily',
    categoryLabel: 'Giao tiếp hàng ngày',
    english: 'To be honest, that doesn’t really make sense to me.',
    vietnamese: 'Thành thật mà nói thì điều đó không thực sự hợp lý đối với tôi.',
    ipa: '/tuː biː ˈɒnɪst, ðæt ˈdʌznt ˈrɪəli meɪk sɛns tuː miː/',
    situation: 'Khi muốn từ chối hoặc bày tỏ sự nghi ngờ một cách nhã nhặn',
    keyPhrases: [
      { phrase: 'to be honest', meaning: 'thành thật mà nói' },
      { phrase: 'make sense', meaning: 'hợp lý, có ý nghĩa' },
    ],
  },
  {
    id: 'd-6',
    category: 'daily',
    categoryLabel: 'Giao tiếp hàng ngày',
    english: 'Take your time, there’s no need to rush.',
    vietnamese: 'Cứ thong thả nhé, không cần phải vội đâu.',
    ipa: '/teɪk jɔː taɪm, ðeəz nəʊ niːd tuː rʌʃ/',
    situation: 'Khi muốn trấn an đối phương đừng quá căng thẳng về thời gian',
    keyPhrases: [
      { phrase: 'take your time', meaning: 'cứ thong thả, từ từ' },
      { phrase: 'no need to rush', meaning: 'không cần phải vội vàng' },
    ],
  },
  {
    id: 'd-7',
    category: 'daily',
    categoryLabel: 'Giao tiếp hàng ngày',
    english: 'Never mind, it’s not a big deal at all.',
    vietnamese: 'Đừng bận tâm, chuyện đó chẳng to tát gì đâu.',
    ipa: '/ˈnɛvər maɪnd, ɪts nɒt ə bɪɡ diːl æt ɔːl/',
    situation: 'Khi muốn bỏ qua một sai sót nhỏ hoặc an ủi người khác',
    keyPhrases: [
      { phrase: 'never mind', meaning: 'đừng bận tâm' },
      { phrase: 'not a big deal', meaning: 'không phải vấn đề lớn' },
    ],
  },
  {
    id: 'd-8',
    category: 'daily',
    categoryLabel: 'Giao tiếp hàng ngày',
    english: 'It totally slipped my mind; I completely forgot about our appointment.',
    vietnamese: 'Tôi hoàn toàn quên bẵng đi mất; tôi quên sạch buổi hẹn của chúng ta.',
    ipa: '/ɪt ˈtəʊtəli slɪpt maɪ maɪnd; aɪ kəmˈpliːtli fəˈɡɒt əˈbaʊt ˈaʊər əˈpɔɪntmənt/',
    situation: 'Khi vô tình quên một việc gì đó và muốn xin lỗi thành thật',
    keyPhrases: [
      { phrase: 'slip someone’s mind', meaning: 'quên bẵng đi mất' },
      { phrase: 'make an appointment', meaning: 'đặt lịch hẹn' },
    ],
  },
  {
    id: 'd-9',
    category: 'daily',
    categoryLabel: 'Giao tiếp hàng ngày',
    english: 'Let’s call it a day and pick this up tomorrow morning.',
    vietnamese: 'Hôm nay dừng ở đây thôi, sáng mai chúng ta lại tiếp tục nhé.',
    ipa: '/lɛts kɔːl ɪt ə deɪ ænd pɪk ðɪs ʌp təˈmɒrəʊ ˈmɔːnɪŋ/',
    situation: 'Khi muốn kết thúc công việc hoặc buổi học trong ngày',
    keyPhrases: [
      { phrase: 'call it a day', meaning: 'kết thúc ngày làm việc' },
      { phrase: 'pick something up', meaning: 'tiếp tục lại việc dở dang' },
    ],
  },
  {
    id: 'd-10',
    category: 'daily',
    categoryLabel: 'Giao tiếp hàng ngày',
    english: 'Keep in touch and take good care of yourself!',
    vietnamese: 'Giữ liên lạc và nhớ chăm sóc bản thân thật tốt nhé!',
    ipa: '/kiːp ɪn tʌtʃ ænd teɪk ɡʊd keər ɒv jɔːˈsɛlf/',
    situation: 'Lời chào tạm biệt thân mật khi ai đó đi xa',
    keyPhrases: [
      { phrase: 'keep in touch', meaning: 'giữ liên lạc' },
      { phrase: 'take care of', meaning: 'chăm sóc bản thân' },
    ],
  },

  // ── CÔNG SỞ & CÔNG VIỆC (WORK) ──
  {
    id: 'w-1',
    category: 'work',
    categoryLabel: 'Công sở & Công việc',
    english: 'I’d like to follow up on the status of our quarterly budget proposal.',
    vietnamese: 'Tôi muốn theo dõi tiến độ của bản đề xuất ngân sách quý này.',
    ipa: '/aɪd laɪk tuː ˈfɒləʊ ʌp ɒn ðə ˈsteɪtəs ɒv ˈaʊə ˈkwɔːtəli ˈbʌdʒɪt prəˈpəʊzəl/',
    situation: 'Khi gửi email hoặc hỏi thăm tiến độ công việc trong văn phòng',
    keyPhrases: [
      { phrase: 'follow up on', meaning: 'theo dõi, bám sát tiến độ' },
      { phrase: 'quarterly budget', meaning: 'ngân sách theo quý' },
    ],
  },
  {
    id: 'w-2',
    category: 'work',
    categoryLabel: 'Công sở & Công việc',
    english: 'Could we reschedule our meeting? Something urgent came up.',
    vietnamese: 'Chúng ta có thể dời lịch họp được không? Tôi vừa có việc đột xuất phát sinh.',
    ipa: '/kʊd wiː ˌriːˈʃɛdjuːl ˈaʊə ˈmiːtɪŋ? ˈsʌmθɪŋ ˈɜːdʒənt keɪm ʌp/',
    situation: 'Khi cần dời lịch hẹn vì lý do bất khả kháng',
    keyPhrases: [
      { phrase: 'reschedule a meeting', meaning: 'dời lại lịch họp' },
      { phrase: 'come up', meaning: 'bất ngờ phát sinh (vấn đề)' },
    ],
  },
  {
    id: 'w-3',
    category: 'work',
    categoryLabel: 'Công sở & Công việc',
    english: 'Let’s make sure we are all on the same page before presenting to the client.',
    vietnamese: 'Hãy đảm bảo rằng tất cả chúng ta đều đồng thuận quan điểm trước khi thuyết trình cho khách hàng.',
    ipa: '/lɛts meɪk ʃʊə wiː ɑːr ɔːl ɒn ðə seɪm peɪdʒ bɪˈfɔː prɪˈzɛntɪŋ tuː ðə ˈklaɪənt/',
    situation: 'Khi muốn đồng nhất ý kiến trong nội bộ nhóm',
    keyPhrases: [
      { phrase: 'on the same page', meaning: 'đồng quan điểm, cùng chung hiểu biết' },
      { phrase: 'make sure', meaning: 'đảm bảo chắc chắn' },
    ],
  },
  {
    id: 'w-4',
    category: 'work',
    categoryLabel: 'Công sở & Công việc',
    english: 'We need to meet the deadline, so let’s prioritize the most critical tasks first.',
    vietnamese: 'Chúng ta phải kịp hạn chót, vì vậy hãy ưu tiên những việc quan trọng nhất trước.',
    ipa: '/wiː niːd tuː miːt ðə ˈdɛdlaɪn, səʊ lɛts praɪˈɒrɪˌtaɪz ðə məʊst ˈkrɪtɪkəl tɑːsks fɜːst/',
    situation: 'Khi thúc đẩy tiến độ dự án sát hạn chót',
    keyPhrases: [
      { phrase: 'meet the deadline', meaning: 'kịp hạn chót' },
      { phrase: 'prioritize tasks', meaning: 'ưu tiên các nhiệm vụ' },
    ],
  },
  {
    id: 'w-5',
    category: 'work',
    categoryLabel: 'Công sở & Công việc',
    english: 'Please find attached the revised contract for your review and approval.',
    vietnamese: 'Vui lòng xem hợp đồng đã được chỉnh sửa đính kèm để xem xét và phê duyệt.',
    ipa: '/pliːz faɪnd əˈtætʃt ðə rɪˈvaɪzd ˈkɒntrækt fɔː jɔː rɪˈvjuː ænd əˈpruːvəl/',
    situation: 'Mẫu câu chuẩn trong email công việc khi gửi kèm tài liệu',
    keyPhrases: [
      { phrase: 'please find attached', meaning: 'xin vui lòng xem tệp đính kèm' },
      { phrase: 'for your review and approval', meaning: 'để quý vị xem xét và duyệt' },
    ],
  },
  {
    id: 'w-6',
    category: 'work',
    categoryLabel: 'Công sở & Công việc',
    english: 'I’d like to bring up an issue regarding our server stability.',
    vietnamese: 'Tôi muốn nêu lên một vấn đề liên quan đến độ ổn định của máy chủ.',
    ipa: '/aɪd laɪk tuː brɪŋ ʌp ən ˈɪʃuː rɪˈɡɑːdɪŋ ˈaʊə ˈsɜːvə stəˈbɪlɪti/',
    situation: 'Khi phát biểu trong cuộc họp để nêu vấn đề mới',
    keyPhrases: [
      { phrase: 'bring up an issue', meaning: 'nêu lên một vấn đề' },
      { phrase: 'regarding something', meaning: 'liên quan tới điều gì' },
    ],
  },
  {
    id: 'w-7',
    category: 'work',
    categoryLabel: 'Công sở & Công việc',
    english: 'Could you give me a hand with this financial report? The numbers don’t add up.',
    vietnamese: 'Bạn có thể giúp tôi một tay với báo cáo tài chính này không? Các con số không khớp nhau.',
    ipa: '/kʊd juː ɡɪv miː ə hænd wɪð ðɪs faɪˈnænʃəl rɪˈpɔːt? ðə ˈnʌmbəz dəʊnt æd ʌp/',
    situation: 'Khi nhờ đồng nghiệp hỗ trợ xử lý công việc',
    keyPhrases: [
      { phrase: 'give someone a hand', meaning: 'giúp đỡ ai một tay' },
      { phrase: 'numbers don’t add up', meaning: 'các con số không khớp/bất hợp lý' },
    ],
  },
  {
    id: 'w-8',
    category: 'work',
    categoryLabel: 'Công sở & Công việc',
    english: 'We have decided to put off the launch date until the bugs are fixed.',
    vietnamese: 'Chúng tôi đã quyết định hoãn ngày ra mắt cho đến khi các lỗi được khắc phục xong.',
    ipa: '/wiː hæv dɪˈsaɪdɪd tuː pʊt ɒf ðə lɔːntʃ deɪt ənˈtɪl ðə bʌɡz ɑː fɪkst/',
    situation: 'Khi thông báo hoãn một sự kiện hoặc sản phẩm',
    keyPhrases: [
      { phrase: 'put off', meaning: 'hoãn lại, dời lại' },
      { phrase: 'launch date', meaning: 'ngày ra mắt sản phẩm' },
    ],
  },
  {
    id: 'w-9',
    category: 'work',
    categoryLabel: 'Công sở & Công việc',
    english: 'Let’s think outside the box to come up with a creative solution.',
    vietnamese: 'Hãy suy nghĩ đột phá để tìm ra một giải pháp sáng tạo.',
    ipa: '/lɛts θɪŋk ˌaʊtˈsaɪd ðə bɒks tuː kʌm ʌp wɪð ə kriːˈeɪtɪv səˈluːʃən/',
    situation: 'Khi họp thảo luận (brainstorming) ý tưởng mới',
    keyPhrases: [
      { phrase: 'think outside the box', meaning: 'tư duy sáng tạo, đột phá' },
      { phrase: 'come up with', meaning: 'nghĩ ra, nảy ra (ý tưởng)' },
    ],
  },
  {
    id: 'w-10',
    category: 'work',
    categoryLabel: 'Công sở & Công việc',
    english: 'Thank you for your valuable feedback. We will take it into serious consideration.',
    vietnamese: 'Cảm ơn phản hồi quý báu của bạn. Chúng tôi sẽ cân nhắc nó một cách nghiêm túc.',
    ipa: '/θæŋk juː fɔː jɔː ˈvæljʊəbəl ˈfiːdbæk. wiː wɪl teɪk ɪt ˈɪntuː ˈsɪərɪəs kənˌsɪdəˈreɪʃən/',
    situation: 'Khi phản hồi khách hàng hoặc đối tác sau buổi đánh giá',
    keyPhrases: [
      { phrase: 'take something into consideration', meaning: 'cân nhắc kỹ lưỡng' },
      { phrase: 'valuable feedback', meaning: 'phản hồi quý giá' },
    ],
  },

  // ── DU LỊCH & DI CHUYỂN (TRAVEL) ──
  {
    id: 't-1',
    category: 'travel',
    categoryLabel: 'Du lịch & Di chuyển',
    english: 'Excuse me, could you point me in the direction of the nearest subway station?',
    vietnamese: 'Xin lỗi, bạn có thể chỉ đường giúp tôi đến ga tàu điện ngầm gần nhất không?',
    ipa: '/ɪkˈskjuːz miː, kʊd juː pɔɪnt miː ɪn ðə daɪˈrɛkʃən ɒv ðə ˈnɪərɪst ˈsʌbweɪ ˈsteɪʃən/',
    situation: 'Khi cần hỏi đường ở nơi công cộng',
    keyPhrases: [
      { phrase: 'point someone in the direction of', meaning: 'chỉ đường cho ai tới đâu' },
      { phrase: 'subway station', meaning: 'ga tàu điện ngầm' },
    ],
  },
  {
    id: 't-2',
    category: 'travel',
    categoryLabel: 'Du lịch & Di chuyển',
    english: 'I’d like to check in, please. I have a reservation under the name of Nguyen.',
    vietnamese: 'Tôi muốn làm thủ tục nhận phòng. Tôi đã đặt phòng trước dưới tên Nguyễn.',
    ipa: '/aɪd laɪk tuː tʃɛk ɪn, pliːz. aɪ hæv ə ˌrɛzəˈveɪʃən ˈʌndə ðə neɪm ɒv ŋwɪˈjɛn/',
    situation: 'Khi đến quầy lễ tân khách sạn để nhận phòng',
    keyPhrases: [
      { phrase: 'check in', meaning: 'làm thủ tục nhận phòng/lên máy bay' },
      { phrase: 'have a reservation under the name of', meaning: 'đã đặt chỗ dưới tên ai' },
    ],
  },
  {
    id: 't-3',
    category: 'travel',
    categoryLabel: 'Du lịch & Di chuyển',
    english: 'Is there a free airport shuttle service available here?',
    vietnamese: 'Ở đây có dịch vụ xe buýt đưa đón sân bay miễn phí không?',
    ipa: '/ɪz ðeər ə friː ˈeəpɔːt ˈʃʌtəl ˈsɜːvɪs əˈveɪləbəl hɪə/',
    situation: 'Khi hỏi lễ tân khách sạn về xe đưa đón sân bay',
    keyPhrases: [
      { phrase: 'airport shuttle service', meaning: 'xe đưa đón sân bay' },
      { phrase: 'available', meaning: 'có sẵn, có thể sử dụng' },
    ],
  },
  {
    id: 't-4',
    category: 'travel',
    categoryLabel: 'Du lịch & Di chuyển',
    english: 'My flight has been delayed by two hours due to severe weather conditions.',
    vietnamese: 'Chuyến bay của tôi bị hoãn 2 tiếng do điều kiện thời tiết xấu.',
    ipa: '/maɪ flaɪt hæz biːn dɪˈleɪd baɪ tuː ˈaʊəz djuː tuː sɪˈvɪə ˈwɛðə kənˈdɪʃənz/',
    situation: 'Khi thông báo tình trạng chuyến bay tại sân bay',
    keyPhrases: [
      { phrase: 'delayed by', meaning: 'bị hoãn lại khoảng bao lâu' },
      { phrase: 'due to', meaning: 'bởi vì, do nguyên nhân' },
    ],
  },
  {
    id: 't-5',
    category: 'travel',
    categoryLabel: 'Du lịch & Di chuyển',
    english: 'Could you please call a taxi for me? I need to get to the train station.',
    vietnamese: 'Bạn có thể gọi giúp tôi một chiếc taxi được không? Tôi cần đến ga tàu.',
    ipa: '/kʊd juː pliːz kɔːl ə ˈtæksi fɔː miː? aɪ niːd tuː ɡɛt tuː ðə treɪn ˈsteɪʃən/',
    situation: 'Khi nhờ người khác hoặc lễ tân gọi taxi',
    keyPhrases: [
      { phrase: 'call a taxi', meaning: 'gọi xe taxi' },
      { phrase: 'get to somewhere', meaning: 'đi đến một địa điểm' },
    ],
  },
  {
    id: 't-6',
    category: 'travel',
    categoryLabel: 'Du lịch & Di chuyển',
    english: 'How much does a one-way ticket to downtown cost?',
    vietnamese: 'Một vé một chiều vào trung tâm thành phố giá bao nhiêu?',
    ipa: '/haʊ mʌtʃ dʌz ə wʌn-weɪ ˈtɪkɪt tuː ˈdaʊntaʊn kɒst/',
    situation: 'Khi mua vé tàu hoặc xe buýt',
    keyPhrases: [
      { phrase: 'one-way ticket', meaning: 'vé một chiều' },
      { phrase: 'downtown', meaning: 'khu vực trung tâm thành phố' },
    ],
  },
  {
    id: 't-7',
    category: 'travel',
    categoryLabel: 'Du lịch & Di chuyển',
    english: 'Excuse me, is this seat taken or is anyone sitting here?',
    vietnamese: 'Xin lỗi, chỗ này đã có ai ngồi chưa ạ?',
    ipa: '/ɪkˈskjuːz miː, ɪz ðɪs siːt ˈteɪkən ɔːr ɪz ˈɛniwʌn ˈsɪtɪŋ hɪə/',
    situation: 'Khi tìm chỗ ngồi trên tàu hỏa, máy bay hoặc quán nước',
    keyPhrases: [
      { phrase: 'is this seat taken', meaning: 'chỗ này có ai ngồi chưa' },
      { phrase: 'excuse me', meaning: 'xin phép, xin lỗi' },
    ],
  },
  {
    id: 't-8',
    category: 'travel',
    categoryLabel: 'Du lịch & Di chuyển',
    english: 'What time is the check-out? Can I leave my luggage here for a few hours?',
    vietnamese: 'Mấy giờ phải trả phòng vậy ạ? Tôi có thể gửi hành lý ở đây vài tiếng được không?',
    ipa: '/wɒt taɪm ɪz ðə ˈtʃɛk-aʊt? kæn aɪ liːv maɪ ˈlʌɡɪdʒ hɪə fɔːr ə fjuː ˈaʊəz/',
    situation: 'Khi chuẩn bị trả phòng khách sạn nhưng chưa đến giờ bay',
    keyPhrases: [
      { phrase: 'check-out time', meaning: 'giờ trả phòng' },
      { phrase: 'leave luggage', meaning: 'gửi lại hành lý' },
    ],
  },

  // ── ĂN UỐNG & MUA SẮM (DINING & SHOPPING) ──
  {
    id: 'dn-1',
    category: 'dining',
    categoryLabel: 'Ăn uống & Mua sắm',
    english: 'Could we get the bill, please? We’d like to pay separately.',
    vietnamese: 'Cho chúng tôi xin hóa đơn thanh toán được không? Chúng tôi muốn trả riêng từng người.',
    ipa: '/kʊd wiː ɡɛt ðə bɪl, pliːz? wiːd laɪk tuː peɪ ˈsɛprɪtli/',
    situation: 'Khi dùng bữa xong tại nhà hàng và muốn chia tiền',
    keyPhrases: [
      { phrase: 'get the bill', meaning: 'xin hóa đơn tính tiền' },
      { phrase: 'pay separately / split the bill', meaning: 'thanh toán riêng' },
    ],
  },
  {
    id: 'dn-2',
    category: 'dining',
    categoryLabel: 'Ăn uống & Mua sắm',
    english: 'What do you recommend as the house specialty?',
    vietnamese: 'Bạn có gợi ý món đặc sản đặc trưng nào của quán không?',
    ipa: '/wɒt duː juː ˌrɛkəˈmɛnd æz ðə haʊs ˈspɛʃəlti/',
    situation: 'Khi xem menu và muốn nhờ bồi bàn tư vấn món ngon nhất',
    keyPhrases: [
      { phrase: 'house specialty', meaning: 'món đặc sản/món tủ của nhà hàng' },
      { phrase: 'recommend', meaning: 'gợi ý, giới thiệu' },
    ],
  },
  {
    id: 'dn-3',
    category: 'dining',
    categoryLabel: 'Ăn uống & Mua sắm',
    english: 'Do you happen to have this shirt in a medium size and different color?',
    vietnamese: 'Bạn có chiếc áo này cỡ vừa (M) và màu khác không?',
    ipa: '/duː juː ˈhæpən tuː hæv ðɪs ʃɜːt ɪn ə ˈmiːdiəm saɪz ænd ˈdɪfrənt ˈkʌlə/',
    situation: 'Khi đi mua sắm quần áo tại cửa hàng',
    keyPhrases: [
      { phrase: 'in a medium size', meaning: 'kích cỡ vừa (size M)' },
      { phrase: 'do you happen to have', meaning: 'bạn có tình cờ có... không' },
    ],
  },
  {
    id: 'dn-4',
    category: 'dining',
    categoryLabel: 'Ăn uống & Mua sắm',
    english: 'Could I try this jacket on? Where are the fitting rooms?',
    vietnamese: 'Tôi có thể mặc thử chiếc áo khoác này không? Phòng thử đồ ở đâu vậy?',
    ipa: '/kʊd aɪ traɪ ðɪs ˈdʒækɪt ɒn? weər ɑː ðə ˈfɪtɪŋ ruːmz/',
    situation: 'Khi muốn thử đồ trong cửa hàng thời trang',
    keyPhrases: [
      { phrase: 'try something on', meaning: 'mặc thử (quần áo, giày dép)' },
      { phrase: 'fitting room', meaning: 'phòng thử đồ' },
    ],
  },

  // ── ĐÀM THOẠI ĐỀ THI TOEIC (TOEIC FOCUS) ──
  {
    id: 'tc-1',
    category: 'toeic',
    categoryLabel: 'Hội thoại TOEIC',
    english: 'Who is in charge of organizing the annual marketing conference?',
    vietnamese: 'Ai là người chịu trách nhiệm tổ chức hội nghị tiếp thị thường niên?',
    ipa: '/huː ɪz ɪn tʃɑːdʒ ɒv ˈɔːɡənaɪzɪŋ ðə ˈænjuəl ˈmɑːkɪtɪŋ ˈkɒnfərəns/',
    situation: 'Mẫu câu hỏi WH- Question kinh điển trong TOEIC Listening Part 2',
    keyPhrases: [
      { phrase: 'in charge of', meaning: 'chịu trách nhiệm, phụ trách' },
      { phrase: 'annual conference', meaning: 'hội nghị thường niên' },
    ],
  },
  {
    id: 'tc-2',
    category: 'toeic',
    categoryLabel: 'Hội thoại TOEIC',
    english: 'The technician said the printer is out of order and needs to be replaced.',
    vietnamese: 'Kỹ thuật viên nói rằng máy in đang bị hỏng và cần được thay thế.',
    ipa: '/ðə tɛkˈnɪʃən sɛd ðə ˈprɪntər ɪz aʊt ɒv ˈɔːdər ænd niːdz tuː biː rɪˈpleɪst/',
    situation: 'Tình huống thiết bị văn phòng hỏng thường gặp trong TOEIC Part 3',
    keyPhrases: [
      { phrase: 'out of order', meaning: 'bị hỏng, ngừng hoạt động' },
      { phrase: 'replace something', meaning: 'thay thế cái gì' },
    ],
  },
  {
    id: 'tc-3',
    category: 'toeic',
    categoryLabel: 'Hội thoại TOEIC',
    english: 'I’m calling to confirm the delivery date for the office supplies we ordered.',
    vietnamese: 'Tôi gọi điện để xác nhận ngày giao hàng cho số văn phòng phẩm chúng tôi đã đặt.',
    ipa: '/aɪm ˈkɔːlɪŋ tuː kənˈfɜːm ðə dɪˈlɪvəri deɪt fɔː ðɪ ˈɒfɪs səˈplaɪz wiː ˈɔːdəd/',
    situation: 'Tình huống gọi điện thoại đặt hàng / giao hàng trong TOEIC Part 3 & 4',
    keyPhrases: [
      { phrase: 'confirm the delivery date', meaning: 'xác nhận ngày giao hàng' },
      { phrase: 'office supplies', meaning: 'văn phòng phẩm' },
    ],
  },
  {
    id: 'tc-4',
    category: 'toeic',
    categoryLabel: 'Hội thoại TOEIC',
    english: 'Has the keynote speaker arrived yet, or is she running late?',
    vietnamese: 'Diễn giả chính đã đến chưa, hay cô ấy đang bị muộn?',
    ipa: '/hæz ðə ˈkiːnəʊt ˈspiːkər əˈraɪvd jɛt, ɔːr ɪz ʃiː ˈrʌnɪŋ leɪt/',
    situation: 'Mẫu câu hỏi gián tiếp về sự kiện hội thảo trong đề thi TOEIC',
    keyPhrases: [
      { phrase: 'keynote speaker', meaning: 'diễn giả chính' },
      { phrase: 'running late', meaning: 'bị trễ, đang đến muộn' },
    ],
  },
];
