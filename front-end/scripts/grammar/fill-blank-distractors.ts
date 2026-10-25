/**
 * scripts/grammar/fill-blank-distractors.ts
 *
 * Dedicated structured distractor explanations for open fill-in-the-blank
 * and sentence transformation exercises across 62 CEFR topics.
 */

export interface RawDistractorEntry {
  opt: string;
  reason: string;
}

export const FILL_BLANK_DISTRACTORS: Record<string, RawDistractorEntry[]> = {
  "advanced-relative-clauses-ex-01": [
    {
      "opt": "have",
      "reason": "Chủ ngữ \"She\" là ngôi thứ ba số ít, phải chia động từ \"has\", không dùng \"have\"."
    },
    {
      "opt": "is having",
      "reason": "Động từ \"have\" mang nghĩa sở hữu là động từ chỉ trạng thái, không dùng ở thì tiếp diễn."
    }
  ],
  "adverbs-frequency-ex-01": [
    {
      "opt": "are",
      "reason": "\"are\" dùng cho chủ ngữ số nhiều, trong khi \"She\" là ngôi thứ ba số ít."
    },
    {
      "opt": "be",
      "reason": "Động từ to-be cần chia theo thì hiện tại đơn phù hợp với chủ ngữ số ít."
    }
  ],
  "causative-ex-01": [
    {
      "opt": "is",
      "reason": "\"is\" dùng cho chủ ngữ số ít, trong khi \"We\" là ngôi thứ nhất số nhiều."
    },
    {
      "opt": "have",
      "reason": "Cấu trúc truyền khiến tiếp diễn ở đây dùng to-be: \"be getting something done\"."
    }
  ],
  "cleft-sentences-ex-01": [
    {
      "opt": "are",
      "reason": "Cấu trúc câu chẻ nhấn mạnh luôn mở đầu bằng \"It is\" hoặc \"It was\", không dùng \"It are\"."
    },
    {
      "opt": "was",
      "reason": "Mệnh đề phía sau dùng thì hiện tại đơn (\"need\"), nên câu chẻ mở đầu bằng thì hiện tại \"It is\"."
    }
  ],
  "discourse-markers-ex-01": [
    {
      "opt": "are",
      "reason": "\"the plan\" là danh từ số ít, phải đi với to-be số ít \"is\"."
    },
    {
      "opt": "be",
      "reason": "Động từ vị ngữ phải được chia theo thì hiện tại đơn."
    }
  ],
  "ellipsis-substitution-ex-01": [
    {
      "opt": "has",
      "reason": "Sau trợ động từ \"Do you\", động từ chính phải ở dạng nguyên thể không chia \"have\"."
    },
    {
      "opt": "had",
      "reason": "Trợ động từ \"Do\" ở thì hiện tại, động từ chính không lùi về quá khứ."
    }
  ],
  "future-continuous-ex-01": [
    {
      "opt": "would",
      "reason": "Thì tương lai tiếp diễn diễn tả hành động sẽ đang diễn ra tại một thời điểm xác định trong tương lai dùng \"will be + V-ing\"."
    },
    {
      "opt": "is",
      "reason": "Không dùng \"is be working\" vì thừa 2 trợ động từ to-be liền nhau."
    }
  ],
  "future-in-the-past-ex-01": [
    {
      "opt": "are",
      "reason": "Ngữ cảnh có vế sau ở quá khứ (\"but it rained\"), diễn tả dự định trong quá khứ (\"future in the past\"), phải dùng \"were going to\"."
    },
    {
      "opt": "was",
      "reason": "Chủ ngữ \"They\" là số nhiều, phải dùng to-be quá khứ số nhiều \"were\"."
    }
  ],
  "future-perfect-ex-01": [
    {
      "opt": "would",
      "reason": "Thì tương lai hoàn thành diễn tả hành động sẽ hoàn tất trước một mốc trong tương lai (\"before noon\") dùng \"will have + V3\"."
    },
    {
      "opt": "is",
      "reason": "Cấu trúc hoàn thành dùng trợ động từ \"will have\", không dùng \"is have\"."
    }
  ],
  "prepositions-place-ex-01": [
    {
      "opt": "are",
      "reason": "\"Your phone\" là danh từ số ít, phải đi với to-be \"is\"."
    },
    {
      "opt": "be",
      "reason": "Động từ vị ngữ phải được chia phù hợp với ngôi và thì."
    }
  ],
  "wh-questions-ex-01": [
    {
      "opt": "were",
      "reason": "Chủ ngữ \"she\" là ngôi thứ ba số ít, to-be ở quá khứ phải là \"was\"."
    },
    {
      "opt": "did",
      "reason": "\"upset\" là tính từ, câu hỏi với tính từ dùng to-be làm trợ động từ, không dùng trợ động từ \"did\"."
    }
  ],
  "present-perfect-continuous-ex-01": [
    {
      "opt": "have",
      "reason": "Chủ ngữ \"She\" là ngôi thứ ba số ít, trợ động từ của thì hiện tại hoàn thành tiếp diễn phải là \"has been\"."
    },
    {
      "opt": "had",
      "reason": "Kết quả rõ ràng ở hiện tại (\"her eyes are red\"), phải dùng thì hiện tại hoàn thành tiếp diễn \"has been\"."
    }
  ],
  "second-conditional-ex-01": [
    {
      "opt": "will",
      "reason": "Mệnh đề if ở quá khứ giả định (\"if she were\"), câu điều kiện loại 2 dùng \"would + V\", không dùng \"will\"."
    },
    {
      "opt": "can",
      "reason": "Câu điều kiện loại 2 dùng \"could\" hoặc \"would\", không dùng \"can\"."
    }
  ],
  "subjunctive-ex-01": [
    {
      "opt": "was",
      "reason": "Cấu trúc giả định thức hiện tại (Subjunctive mood) dùng \"It is essential that...\"."
    },
    {
      "opt": "be",
      "reason": "Mệnh đề chính cần động từ to-be chia ở hiện tại đơn \"is\"."
    }
  ],
  "there-is-there-are-ex-01": [
    {
      "opt": "is",
      "reason": "Danh từ theo sau \"two messages\" là số nhiều, cấu trúc \"There are\" phải đi với danh từ số nhiều."
    },
    {
      "opt": "was",
      "reason": "Ngữ cảnh thông báo hiện tại cần dùng to-be hiện tại số nhiều \"are\"."
    }
  ],
  "third-conditional-ex-01": [
    {
      "opt": "will",
      "reason": "Mệnh đề if ở quá khứ hoàn thành (\"had studied\"), câu điều kiện loại 3 dùng \"would have + V3\"."
    },
    {
      "opt": "would had",
      "reason": "Sau động từ khuyết thiếu \"would\", trợ động từ phải ở dạng nguyên mẫu \"have\"."
    }
  ],
  "past-perfect-continuous-ex-01": [
    {
      "opt": "is",
      "reason": "Vế sau diễn tả nguyên nhân xảy ra trước trong quá khứ (\"had been working all night\"), kết quả quá khứ dùng \"was\"."
    },
    {
      "opt": "were",
      "reason": "Chủ ngữ \"She\" là số ít, dùng \"was\", không dùng \"were\"."
    }
  ],
  "past-perfect-ex-01": [
    {
      "opt": "has",
      "reason": "Mốc thời gian là \"before that trip\" (trước một sự kiện trong quá khứ), phải dùng quá khứ hoàn thành \"had never flown\"."
    },
    {
      "opt": "was",
      "reason": "Cấu trúc thì hoàn thành dùng trợ động từ \"had\" kết hợp với phân từ hai \"flown\", không dùng to-be \"was\"."
    }
  ],
  "modals-permission-ex-01": [
    {
      "opt": "May",
      "reason": "\"May\" dùng để xin phép cho bản thân (\"May I...?\"), không dùng để yêu cầu người khác làm gì (\"Could you...?\")."
    },
    {
      "opt": "Should",
      "reason": "\"Should\" dùng để hỏi xin lời khuyên, không dùng làm câu yêu cầu lịch sự."
    }
  ],
  "modals-perfect-ex-01": [
    {
      "opt": "can",
      "reason": "Phán đoán chắc chắn về một sự việc trong quá khứ dựa trên bằng chứng dùng \"must have + V3\", không dùng \"can have + V3\"."
    },
    {
      "opt": "should",
      "reason": "\"should have + V3\" diễn tả sự tiếc nuối về việc lẽ ra nên làm, không phù hợp với ý phán đoán."
    }
  ],
  "advanced-passive-ex-01": [
    {
      "opt": "was made to",
      "reason": "Khi chuyển sang bị động với động từ \"make\", tân ngữ người đi với giới từ \"for\" (\"was made for her son\"), không dùng \"to\"."
    },
    {
      "opt": "made for",
      "reason": "Câu bị động ở thì quá khứ đơn bắt buộc phải có to-be \"was\" đi kèm phân từ hai."
    },
    {
      "opt": "was made",
      "reason": "Thiếu giới từ \"for\" để kết nối với tân ngữ gián tiếp \"her son\"."
    }
  ],
  "be-going-to-ex-03": [
    {
      "opt": "is going to build",
      "reason": "Chủ ngữ \"A new bridge\" là vật tiếp nhận hành động, bắt buộc chia bị động \"is going to be built\", không dùng chủ động."
    },
    {
      "opt": "will build",
      "reason": "Kế hoạch đã định sẵn và ở thể bị động, không dùng \"will build\" chủ động."
    }
  ],
  "future-will-ex-06": [
    {
      "opt": "open",
      "reason": "Sân vận động là đối tượng được khánh thành, sau will phải là dạng bị động \"be opened\"."
    },
    {
      "opt": "opened",
      "reason": "Sau động từ khuyết thiếu \"will\", không thể đi trực tiếp với V-ed mà cần có \"be\"."
    }
  ],
  "future-will-ex-07": [
    {
      "opt": "expects",
      "reason": "Chủ ngữ \"The price\" là đối tượng được kỳ vọng, phải chia bị động \"is expected\"."
    },
    {
      "opt": "is expecting",
      "reason": "Dạng chủ động tiếp diễn không phù hợp khi chủ ngữ là vật chịu sự đánh giá của mọi người."
    }
  ],
  "modals-advice-ex-01": [
    {
      "opt": "should turn off",
      "reason": "Chủ ngữ \"The lights\" là đồ vật, phải chia bị động \"should be turned off\"."
    },
    {
      "opt": "should turned off",
      "reason": "Sau modal verb \"should\" phải có \"be\" kết hợp phân từ hai, không dùng trực tiếp V-ed."
    }
  ],
  "passive-voice-ex-03": [
    {
      "opt": "can be answered",
      "reason": "Câu gốc có chủ ngữ phủ định \"Nobody\", khi chuyển bị động phải dùng thể phủ định \"can't be answered\"."
    },
    {
      "opt": "cannot answer",
      "reason": "Chủ ngữ \"This question\" cần thể bị động, không dùng chủ động \"cannot answer\"."
    }
  ],
  "past-simple-ex-17": [
    {
      "opt": "discovered",
      "reason": "Vàng được con người phát hiện, phải chia bị động \"was discovered\", không dùng chủ động."
    },
    {
      "opt": "is discovered",
      "reason": "Ngữ cảnh xảy ra vào thế kỷ 19 (\"in the 19th century\"), phải dùng to-be quá khứ \"was\"."
    }
  ],
  "past-simple-ex-18": [
    {
      "opt": "destroyed",
      "reason": "Những ngôi nhà bị động đất tàn phá, phải chia bị động \"were destroyed\"."
    },
    {
      "opt": "was destroyed",
      "reason": "Chủ ngữ \"Lots of houses\" là danh từ số nhiều, phải dùng to-be \"were\"."
    }
  ],
  "past-simple-ex-19": [
    {
      "opt": "organized",
      "reason": "Bữa tiệc được tổ chức, phải chia bị động \"was organized\"."
    },
    {
      "opt": "is organized",
      "reason": "Thời điểm là tối qua (\"last night\"), phải dùng thì quá khứ đơn."
    }
  ],
  "past-simple-ex-20": [
    {
      "opt": "stole",
      "reason": "Điện thoại bị đánh cắp, phải chia bị động \"was stolen\"."
    },
    {
      "opt": "was stole",
      "reason": "Phân từ hai (V3) của \"steal\" là \"stolen\", không dùng dạng quá khứ \"stole\"."
    }
  ],
  "prepositions-time-ex-01": [
    {
      "opt": "gave",
      "reason": "Chủ ngữ \"I\" nhận máy tính từ bố, phải chia bị động \"was given\"."
    },
    {
      "opt": "was gave",
      "reason": "Phân từ hai (V3) của \"give\" là \"given\", không dùng dạng quá khứ \"gave\"."
    }
  ],
  "present-simple-ex-15": [
    {
      "opt": "doesn't use",
      "reason": "Loại vải này được dùng để may áo, phải chia bị động \"isn't used\"."
    },
    {
      "opt": "not used",
      "reason": "Thiếu trợ động từ to-be \"isn't\" trong thể bị động phủ định."
    }
  ],
  "present-simple-ex-16": [
    {
      "opt": "grows",
      "reason": "Lúa gạo được con người trồng trọt, phải chia bị động \"is grown\"."
    },
    {
      "opt": "was grown",
      "reason": "Sự thật hiển nhiên ở đồng bằng sông Cửu Long dùng thì hiện tại đơn, không dùng quá khứ."
    }
  ],
  "quantifiers-ex-14": [
    {
      "opt": "check",
      "reason": "Bài tập được giáo viên chấm vào mỗi thứ Sáu, phải chia bị động \"are checked\"."
    },
    {
      "opt": "is checked",
      "reason": "Chủ ngữ \"These exercises\" là danh từ số nhiều, phải dùng to-be \"are\"."
    }
  ],
  "quantifiers-ex-15": [
    {
      "opt": "sent",
      "reason": "Khách hàng được công ty gửi quà tặng miễn phí, phải chia bị động \"were sent\"."
    },
    {
      "opt": "was sent",
      "reason": "Chủ ngữ \"The customers\" là danh từ số nhiều, phải dùng to-be \"were\"."
    }
  ],
  "relative-clauses-ex-01": [
    {
      "opt": "is saying",
      "reason": "Cấu trúc bị động khách quan mở đầu bằng \"It is said that...\"."
    },
    {
      "opt": "says",
      "reason": "Chủ ngữ giả \"It\" không tự thực hiện hành động nói, phải chia bị động."
    }
  ],
  "present-continuous-ex-12": [
    {
      "opt": "is washing",
      "reason": "Sàn nhà đang được lau dọn, phải chia bị động tiếp diễn \"is being washed\", không dùng chủ động."
    },
    {
      "opt": "is washed",
      "reason": "Ngữ cảnh ngay lúc này (\"at the moment\") cần bị động tiếp diễn \"is being washed\"."
    }
  ],
  "passive-voice-ex-04": [
    {
      "opt": "The cakes selling in that shop are delicious.",
      "reason": "Những chiếc bánh được bán là mang nghĩa bị động, rút gọn bằng V-ed/V3 (\"sold\"), không dùng V-ing (\"selling\")."
    },
    {
      "opt": "The cakes to sell in that shop are delicious.",
      "reason": "Không có các từ bổ nghĩa đặc biệt như the only/the first nên không rút gọn bằng to-V."
    }
  ],
  "passive-voice-ex-05": [
    {
      "opt": "The letters writing by my grandfather are in this box.",
      "reason": "Những bức thư được ông viết mang nghĩa bị động, rút gọn bằng V-ed/V3 (\"written\"), không dùng V-ing (\"writing\")."
    },
    {
      "opt": "The letters to write by my grandfather are in this box.",
      "reason": "Không dùng to-V để rút gọn mệnh đề quan hệ bị động thông thường."
    }
  ],
  "present-continuous-ex-13": [
    {
      "opt": "The bridge destroying in the storm is being repaired.",
      "reason": "Cây cầu bị tàn phá mang nghĩa bị động, rút gọn bằng V-ed/V3 (\"destroyed\"), không dùng V-ing."
    },
    {
      "opt": "The bridge to destroy in the storm is being repaired.",
      "reason": "Không dùng to-V để rút gọn mệnh đề quan hệ mang nghĩa bị động trong quá khứ."
    }
  ],
  "relative-clauses-ex-16": [
    {
      "opt": "The man waited outside wants to see you.",
      "reason": "Người đàn ông đang chủ động chờ đợi, khi rút gọn mệnh đề chủ động dùng V-ing (\"waiting\"), không dùng V-ed."
    },
    {
      "opt": "The man to wait outside wants to see you.",
      "reason": "Không có từ bổ nghĩa như \"the only/the first\" nên không rút gọn bằng to-V."
    }
  ],
  "relative-clauses-ex-17": [
    {
      "opt": "Neil Armstrong was the first man walking on the Moon.",
      "reason": "Khi danh từ đứng trước có số thứ tự \"the first\", bắt buộc phải rút gọn bằng to-V (\"to walk\"), không dùng V-ing."
    },
    {
      "opt": "Neil Armstrong was the first man walked on the Moon.",
      "reason": "Thiếu \"to\", gây xung đột 2 động từ vị ngữ trong cùng một mệnh đề."
    }
  ],
  "relative-clauses-ex-18": [
    {
      "opt": "The people lived next door are very friendly.",
      "reason": "Động từ \"live\" ở thể chủ động, khi rút gọn mệnh đề quan hệ phải dùng V-ing (\"living\"), không dùng quá khứ \"lived\"."
    },
    {
      "opt": "The people to live next door are very friendly.",
      "reason": "Không có từ bổ nghĩa đặc biệt nên không rút gọn bằng to-V."
    }
  ],
  "relative-clauses-ex-19": [
    {
      "opt": "This is the house in which my family lived in for ten years.",
      "reason": "Khi đã đảo giới từ \"in\" lên trước \"which\", tuyệt đối không để lại giới từ \"in\" ở cuối mệnh đề."
    },
    {
      "opt": "This is the house in that my family lived for ten years.",
      "reason": "Đại từ quan hệ \"that\" không bao giờ đứng ngay sau giới từ."
    }
  ],
  "relative-clauses-ex-20": [
    {
      "opt": "I don't believe that she told me.",
      "reason": "\"that\" thay thế cho danh từ đứng trước, trong khi ở đây cần đại từ quan hệ độc lập \"what\" (= the thing which)."
    },
    {
      "opt": "I don't believe which she told me.",
      "reason": "\"which\" không đứng độc lập mà cần có danh từ tiền ngữ đứng trước."
    }
  ],
  "relative-clauses-ex-21": [
    {
      "opt": "My father was the only person noticing my mistake.",
      "reason": "Khi danh từ đi kèm với \"the only\", mệnh đề quan hệ bắt buộc phải rút gọn bằng to-V (\"to notice\"), không dùng V-ing."
    },
    {
      "opt": "My father was the only person noticed my mistake.",
      "reason": "Thiếu \"to\", dẫn tới lỗi sai ngữ pháp 2 động từ vị ngữ đứng liền nhau."
    }
  ],
  "relative-clauses-ex-22": [
    {
      "opt": "That is the friend with who I often go to the cinema.",
      "reason": "Sau giới từ \"with\", đại từ quan hệ chỉ người bắt buộc phải dùng dạng tân ngữ \"whom\", không dùng \"who\"."
    },
    {
      "opt": "That is the friend with that I often go to the cinema.",
      "reason": "Đại từ quan hệ \"that\" không bao giờ đứng ngay sau giới từ."
    }
  ],
  "future-will-ex-13": [
    {
      "opt": "Lan said me she will call me tonight.",
      "reason": "\"said\" không đi trực tiếp với tân ngữ người mà phải dùng \"told me\", và \"will\" cần lùi thì thành \"would\"."
    },
    {
      "opt": "Lan told to me she would call me tonight.",
      "reason": "Động từ \"told\" đi trực tiếp với tân ngữ người không có \"to\" (\"told me\"), và \"tonight\" cần đổi thành \"that night\"."
    }
  ],
  "past-simple-ex-25": [
    {
      "opt": "He asked me if did I go with my mother yesterday.",
      "reason": "Trong câu hỏi gián tiếp, trật tự từ phải là khẳng định (S + V), không đảo trợ động từ \"did\" lên trước chủ ngữ."
    },
    {
      "opt": "He asked me that I went with my mother yesterday.",
      "reason": "Câu hỏi Yes/No trong lời nói gián tiếp dùng từ nối \"if\" hoặc \"whether\", không dùng \"that\", và \"yesterday\" phải đổi thành \"the day before\"."
    }
  ],
  "relative-clauses-ex-23": [
    {
      "opt": "He said someone has stolen his bag.",
      "reason": "Khi động từ tường thuật ở quá khứ (\"said\"), thì hiện tại hoàn thành \"has stolen\" bắt buộc phải lùi thì thành \"had stolen\"."
    },
    {
      "opt": "He said that someone stole his bag.",
      "reason": "Hành động trộm túi xảy ra trước thời điểm nói trong quá khứ, cần dùng quá khứ hoàn thành \"had stolen\"."
    }
  ],
  "relative-clauses-ex-24": [
    {
      "opt": "She said they are learning English now.",
      "reason": "Cần lùi thì \"are learning\" thành \"were learning\" và đổi trạng từ thời gian \"now\" thành \"then\"."
    },
    {
      "opt": "She said that they were learning English now.",
      "reason": "Trạng từ chỉ thời gian \"now\" trong lời nói gián tiếp bắt buộc phải chuyển thành \"then\"."
    }
  ],
  "relative-clauses-ex-25": [
    {
      "opt": "Huong said they are going to have a party next weekend.",
      "reason": "Cần lùi thì \"are going to\" thành \"were going to\" và đổi \"next weekend\" thành \"the following weekend\"."
    },
    {
      "opt": "Huong said that they were going to have a party next weekend.",
      "reason": "Cụm chỉ thời gian tương lai \"next weekend\" phải chuyển thành \"the following weekend\"."
    }
  ],
  "modals-deduction-ex-01": [
    {
      "opt": "My teacher said us that we may use dictionaries for this test.",
      "reason": "Động từ tường thuật có tân ngữ dùng \"told us\", và cần lùi thì \"may\" thành \"might\", đổi \"this\" thành \"that\"."
    },
    {
      "opt": "My teacher told us we might use dictionaries for this test.",
      "reason": "Từ chỉ định \"this test\" trong lời nói gián tiếp cần chuyển đổi thành \"that test\"."
    }
  ],
  "conjunctions-linking-ex-04": [
    {
      "opt": "If she says sorry, I won't talk to her again.",
      "reason": "\"Unless\" tương đương với \"If ... not\". Bỏ \"unless\" mà không thêm phủ định sẽ làm đảo ngược hoàn toàn ý nghĩa của câu."
    },
    {
      "opt": "If she doesn't says sorry, I won't talk to her again.",
      "reason": "Sau trợ động từ phủ định \"doesn't\", động từ chính phải trở về dạng nguyên thể \"say\", không giữ đuôi \"-s\"."
    }
  ],
  "future-will-ex-11": [
    {
      "opt": "Unless you don't turn off the lights, the bill will be very high.",
      "reason": "\"Unless\" đã mang nghĩa phủ định (\"nếu không\"), không được dùng thêm trợ động từ phủ định \"don't\"."
    },
    {
      "opt": "Unless you turn on the lights, the bill will be very high.",
      "reason": "Thay đổi động từ thành \"turn on\" làm sai lệch ý nghĩa logic của câu điều kiện ban đầu."
    }
  ],
  "present-simple-ex-31": [
    {
      "opt": "is it",
      "reason": "Vế trước khẳng định (\"is\"), câu hỏi đuôi bắt buộc phải ở thể phủ định (\"isn't it\")."
    },
    {
      "opt": "doesn't it",
      "reason": "Vế trước dùng động từ to-be \"is\", câu hỏi đuôi phải dùng to-be tương ứng, không dùng trợ động từ \"doesn't\"."
    }
  ],
  "present-simple-ex-32": [
    {
      "opt": "did they",
      "reason": "Vế trước khẳng định ở quá khứ (\"enjoyed\"), câu hỏi đuôi phải ở dạng phủ định (\"didn't they\")."
    },
    {
      "opt": "weren't they",
      "reason": "Vế trước dùng động từ thường ở quá khứ (\"enjoyed\"), câu hỏi đuôi phải mượn trợ động từ \"didn't\", không dùng to-be."
    }
  ],
  "present-simple-ex-33": [
    {
      "opt": "a Japanese small new car",
      "reason": "Theo trật tự tính từ OSASCOMP, kích cỡ (small) đứng trước tuổi tác (new), và nguồn gốc/xuất xứ (Japanese) đứng sát danh từ."
    },
    {
      "opt": "a new small Japanese car",
      "reason": "Kích cỡ (size - small) đứng trước tuổi tác (age - new)."
    }
  ],
  "present-simple-ex-34": [
    {
      "opt": "an old lovely wooden house",
      "reason": "Theo trật tự tính từ OSASCOMP, ý kiến/đánh giá (opinion - lovely) đứng trước tuổi tác (age - old)."
    },
    {
      "opt": "a wooden lovely old house",
      "reason": "Chất liệu (material - wooden) phải đứng sát danh từ nhất, sau ý kiến và tuổi tác."
    }
  ],
  "be-going-to-ex-01": [
    {
      "opt": "will cry",
      "reason": "Khi có dấu hiệu trực quan rõ ràng (\"mặt em bé đỏ ửng\"), ta dùng thì tương lai gần \"is going to cry\", không dùng \"will cry\"."
    },
    {
      "opt": "cries",
      "reason": "Hiện tại đơn chỉ thói quen, không dùng cho sự việc sắp sửa xảy ra ngay trước mắt."
    }
  ],
  "be-going-to-ex-02": [
    {
      "opt": "will buy",
      "reason": "Đã có kế hoạch và tích lũy tiền từ trước (\"have saved money\"), phải dùng tương lai gần \"are going to buy\"."
    },
    {
      "opt": "buy",
      "reason": "Sự việc xảy ra vào năm sau (\"next year\"), không dùng thì hiện tại đơn."
    }
  ],
  "comparatives-superlatives-ex-01": [
    {
      "opt": "more large",
      "reason": "\"large\" là tính từ ngắn 1 âm tiết, so sánh hơn là thêm đuôi -r (\"larger\"), không dùng \"more large\"."
    },
    {
      "opt": "largest",
      "reason": "\"largest\" là dạng so sánh nhất, trong khi từ nhận biết \"than\" yêu cầu dạng so sánh hơn."
    }
  ],
  "comparatives-superlatives-ex-02": [
    {
      "opt": "older",
      "reason": "Cụm \"in our class\" chỉ phạm vi cả một tập thể từ 3 người trở lên, phải dùng so sánh nhất (\"the oldest\"), không dùng so sánh hơn."
    },
    {
      "opt": "oldest",
      "reason": "So sánh nhất đứng trước danh từ xác định bắt buộc phải có mạo từ \"the\"."
    }
  ],
  "comparatives-superlatives-ex-03": [
    {
      "opt": "more beautifully",
      "reason": "Cụm \"in this school\" chỉ phạm vi toàn bộ trường học, phải dùng so sánh nhất (\"the most beautifully\")."
    },
    {
      "opt": "most beautiful",
      "reason": "Bổ nghĩa cho động từ thường \"sings\" phải dùng trạng từ \"beautifully\", không dùng tính từ \"beautiful\"."
    }
  ],
  "comparatives-superlatives-ex-04": [
    {
      "opt": "more intelligent",
      "reason": "Cấu trúc so sánh bằng/không bằng là \"not as + adj + as\", câu đã có \"as\" phía sau nên chỉ cần \"as intelligent\"."
    },
    {
      "opt": "intelligently",
      "reason": "Sau động từ to-be \"is\" bổ nghĩa cho chủ ngữ cần tính từ \"intelligent\", không dùng trạng từ."
    }
  ],
  "comparatives-superlatives-ex-05": [
    {
      "opt": "A / a",
      "reason": "Trái Đất (\"Earth\") và Mặt Trời (\"Sun\") là các thiên thể duy nhất trong vũ trụ, bắt buộc dùng mạo từ xác định \"the\"."
    },
    {
      "opt": "∅ / ∅",
      "reason": "Danh từ chỉ thiên thể duy nhất không thể đứng trơ mà bắt buộc phải có mạo từ xác định \"the\"."
    }
  ],
  "conjunctions-linking-ex-01": [
    {
      "opt": "were / would builds",
      "reason": "Dạng biến thể \"were / would builds\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to were / would build",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "conjunctions-linking-ex-02": [
    {
      "opt": "had / would learns",
      "reason": "Dạng biến thể \"had / would learns\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to had / would learn",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "conjunctions-linking-ex-03": [
    {
      "opt": "lived / would visits",
      "reason": "Dạng biến thể \"lived / would visits\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to lived / would visit",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "conjunctions-linking-ex-05": [
    {
      "opt": "wasn't / will learn",
      "reason": "Điều kiện loại 2 giả định trái hiện tại dùng to-be \"weren't\" và \"would learn\"."
    },
    {
      "opt": "aren't / would learn",
      "reason": "Mệnh đề if loại 2 phải lùi thì về quá khứ giả định."
    }
  ],
  "conjunctions-linking-ex-06": [
    {
      "opt": "despite",
      "reason": "\"despite\" đi kèm với danh từ hoặc V-ing, không đứng trước một mệnh đề có đầy đủ chủ vị (S + V)."
    },
    {
      "opt": "because",
      "reason": "\"because\" chỉ nguyên nhân - kết quả, trong khi câu mang nghĩa nhượng bộ tương phản (dù thức dậy sớm nhưng vẫn muộn tàu)."
    }
  ],
  "conjunctions-linking-ex-07": [
    {
      "opt": "because",
      "reason": "\"because\" phải đi kèm một mệnh đề (S + V), trong khi phía sau chỗ trống là cụm danh từ hoặc V-ing."
    },
    {
      "opt": "although",
      "reason": "\"although\" chỉ sự nhượng bộ tương phản, không dùng để nêu lý do, nguyên nhân."
    }
  ],
  "conjunctions-linking-ex-08": [
    {
      "opt": "because of",
      "reason": "\"because of\" chỉ đi với cụm danh từ hoặc V-ing, không thể đi kèm một mệnh đề có chủ vị \"the hotel prices were\"."
    },
    {
      "opt": "although",
      "reason": "\"although\" chỉ sự nhượng bộ tương phản, không dùng để giải thích nguyên nhân."
    }
  ],
  "conjunctions-linking-ex-09": [
    {
      "opt": "because",
      "reason": "\"because\" phải đi kèm một mệnh đề (S + V), trong khi phía sau chỗ trống là cụm danh từ hoặc V-ing."
    },
    {
      "opt": "although",
      "reason": "\"although\" chỉ sự nhượng bộ tương phản, không dùng để nêu lý do, nguyên nhân."
    }
  ],
  "conjunctions-linking-ex-11": [
    {
      "opt": "lazinesss",
      "reason": "Dạng biến thể \"lazinesss\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to laziness",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "countable-uncountable-ex-04": [
    {
      "opt": "bottle",
      "reason": "Sau số đếm \"two\", danh từ đếm được chỉ đơn vị chứa \"bottle\" phải ở dạng số nhiều \"bottles\"."
    },
    {
      "opt": "bottles of",
      "reason": "Từ \"of\" đã có sẵn trong câu sau chỗ trống, điền thừa từ nối."
    }
  ],
  "countable-uncountable-ex-11": [
    {
      "opt": "apple",
      "reason": "Sau số đếm \"three\", danh từ đếm được \"apple\" phải chuyển thành dạng số nhiều \"apples\"."
    },
    {
      "opt": "apples of",
      "reason": "Không cần giới từ \"of\" sau danh từ đếm được trực tiếp."
    }
  ],
  "demonstratives-ex-04": [
    {
      "opt": "that",
      "reason": "\"that\" chỉ vật ở khoảng cách xa (far), trong khi câu có từ nhận biết \"here\" chỉ khoảng cách gần (near)."
    },
    {
      "opt": "these",
      "reason": "\"these\" đi với danh từ số nhiều, trong khi \"desk\" là danh từ số ít."
    }
  ],
  "demonstratives-ex-05": [
    {
      "opt": "these",
      "reason": "\"these\" chỉ đối tượng ở gần, trong khi \"across the river\" chỉ khoảng cách xa (far)."
    },
    {
      "opt": "that",
      "reason": "\"that\" là số ít, trong khi \"houses\" là danh từ số nhiều."
    }
  ],
  "demonstratives-ex-06": [
    {
      "opt": "this",
      "reason": "\"this\" là số ít, trong khi \"cookies\" và to-be \"are\" là số nhiều."
    },
    {
      "opt": "those",
      "reason": "\"those\" chỉ khoảng cách xa, trong khi \"on this plate\" là khoảng cách gần."
    }
  ],
  "future-will-ex-01": [
    {
      "opt": "wins",
      "reason": "Sự việc xảy ra vào ngày mai (\"tomorrow\"), không dùng hiện tại đơn."
    },
    {
      "opt": "is winning",
      "reason": "Dự đoán chủ quan (\"I'm sure\") dùng thì tương lai đơn \"will win\"."
    }
  ],
  "future-will-ex-02": [
    {
      "opt": "is raining",
      "reason": "Dự đoán tương lai không có căn cứ (\"I don't think\") dùng \"will rain\", không dùng hiện tại tiếp diễn."
    },
    {
      "opt": "rains",
      "reason": "Thời điểm tối nay (\"this evening\") mang nghĩa tương lai, không dùng hiện tại đơn chỉ thói quen."
    }
  ],
  "future-will-ex-03": [
    {
      "opt": "answer",
      "reason": "Quyết định đưa ra ngay tại thời điểm nói khi chuông reo dùng \"will answer\"."
    },
    {
      "opt": "am going to answer",
      "reason": "Không phải kế hoạch dự định từ trước mà là phản xạ tức thì, không dùng \"be going to\"."
    }
  ],
  "future-will-ex-04": [
    {
      "opt": "don't tell",
      "reason": "Lời hứa đưa ra ngay tại thời điểm nói (\"Don't worry\") dùng tương lai đơn \"won't tell\"."
    },
    {
      "opt": "not tell",
      "reason": "Thiếu trợ động từ tương lai phủ định \"won't\"."
    }
  ],
  "future-will-ex-05": [
    {
      "opt": "live",
      "reason": "Thời điểm năm 2030 là tương lai xa kèm phán đoán \"I think\", phải dùng \"will live\"."
    },
    {
      "opt": "are living",
      "reason": "Không dùng hiện tại tiếp diễn cho phán đoán viễn tưởng xa."
    }
  ],
  "future-will-ex-08": [
    {
      "opt": "come / will play",
      "reason": "Chủ ngữ \"Minh\" là ngôi thứ ba số ít ở thì hiện tại đơn, động từ phải thêm \"-s\" (\"comes\")."
    },
    {
      "opt": "will come / will play",
      "reason": "Trong mệnh đề trạng ngữ chỉ thời gian/điều kiện (if/when), cấm dùng thì tương lai với \"will\"."
    }
  ],
  "future-will-ex-09": [
    {
      "opt": "don't wake / will be",
      "reason": "Chủ ngữ \"Nam\" là ngôi thứ ba số ít, trợ động từ phủ định ở hiện tại đơn là \"doesn't\", không dùng \"don't\"."
    },
    {
      "opt": "won't wake / will be",
      "reason": "Mệnh đề điều kiện \"If\" không dùng thì tương lai với \"will/won't\"."
    }
  ],
  "future-will-ex-10": [
    {
      "opt": "don't rain / will go",
      "reason": "Chủ ngữ ngôi thứ ba số ít \"it\" đi với \"doesn't\", không đi với \"don't\"."
    },
    {
      "opt": "not rain / will go",
      "reason": "Thì hiện tại đơn phủ định cần trợ động từ \"doesn't\", không chỉ dùng \"not\"."
    }
  ],
  "future-will-ex-12": [
    {
      "opt": "agrees / will join",
      "reason": "Chủ ngữ \"my parents\" là danh từ số nhiều, động từ ở hiện tại đơn để nguyên mẫu \"agree\", không thêm \"-s\"."
    },
    {
      "opt": "will agree / will join",
      "reason": "Mệnh đề if không dùng thì tương lai với \"will\"."
    }
  ],
  "future-will-ex-15": [
    {
      "opt": "will yous",
      "reason": "Dạng biến thể \"will yous\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to will you",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "gerunds-infinitives-ex-01": [
    {
      "opt": "more high",
      "reason": "\"high\" là tính từ ngắn 1 âm tiết, so sánh hơn là \"higher\", không dùng \"more high\"."
    },
    {
      "opt": "highest",
      "reason": "Cấu trúc so sánh kép (The + comparative, the + comparative) yêu cầu dạng so sánh hơn \"higher\"."
    }
  ],
  "gerunds-infinitives-ex-02": [
    {
      "opt": "more carefuls",
      "reason": "Dạng biến thể \"more carefuls\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to more careful",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "gerunds-infinitives-ex-03": [
    {
      "opt": "lesss",
      "reason": "Dạng biến thể \"lesss\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to less",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "gerunds-infinitives-ex-04": [
    {
      "opt": "shorter and shorters",
      "reason": "Dạng biến thể \"shorter and shorters\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to shorter and shorter",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "gerunds-infinitives-ex-05": [
    {
      "opt": "more and more interestings",
      "reason": "Dạng biến thể \"more and more interestings\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to more and more interesting",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "gerunds-infinitives-ex-06": [
    {
      "opt": "cheaper and cheapers",
      "reason": "Dạng biến thể \"cheaper and cheapers\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to cheaper and cheaper",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "gerunds-infinitives-ex-07": [
    {
      "opt": "mores",
      "reason": "Dạng biến thể \"mores\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to more",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "gerunds-infinitives-ex-08": [
    {
      "opt": "playings",
      "reason": "Dạng biến thể \"playings\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to playing",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "gerunds-infinitives-ex-09": [
    {
      "opt": "turnings",
      "reason": "Dạng biến thể \"turnings\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to turning",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "gerunds-infinitives-ex-10": [
    {
      "opt": "drinkings",
      "reason": "Dạng biến thể \"drinkings\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to drinking",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "gerunds-infinitives-ex-11": [
    {
      "opt": "visitings",
      "reason": "Dạng biến thể \"visitings\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to visiting",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "grammatical-collocations-ex-01": [
    {
      "opt": "ans",
      "reason": "Dạng biến thể \"ans\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to an",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "grammatical-collocations-ex-04": [
    {
      "opt": "thes",
      "reason": "Dạng biến thể \"thes\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to the",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "have-got-ex-03": [
    {
      "opt": "haven'ts",
      "reason": "Dạng biến thể \"haven'ts\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to haven't",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "have-got-ex-11": [
    {
      "opt": "I'ves",
      "reason": "Dạng biến thể \"I'ves\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to I've",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "imperatives-ex-04": [
    {
      "opt": "taking",
      "reason": "Câu mệnh lệnh khẳng định bắt đầu bằng động từ nguyên thể không \"to\", không dùng V-ing."
    },
    {
      "opt": "to take",
      "reason": "Câu mệnh lệnh không dùng động từ có \"to\"."
    }
  ],
  "imperatives-ex-05": [
    {
      "opt": "not",
      "reason": "Câu mệnh lệnh phủ định bắt đầu bằng trợ động từ \"Don't\", không thể chỉ dùng từ \"Not\" đứng trước động từ."
    },
    {
      "opt": "no",
      "reason": "\"No\" dùng trước danh từ hoặc danh động từ, không đứng trước động từ nguyên mẫu \"be\"."
    }
  ],
  "imperatives-ex-06": [
    {
      "opt": "calling",
      "reason": "Sau cấu trúc rủ rê \"Let's\", động từ luôn ở dạng nguyên thể không chia (\"call\"), không dùng V-ing."
    },
    {
      "opt": "to call",
      "reason": "Sau \"Let's\" không dùng động từ có \"to\"."
    }
  ],
  "mixed-conditionals-ex-01": [
    {
      "opt": "was",
      "reason": "\"was\" dùng cho chủ ngữ số ít, không hòa hợp với chủ ngữ số nhiều."
    },
    {
      "opt": "are",
      "reason": "Sự việc đã xảy ra trong quá khứ, không dùng to-be ở hiện tại."
    }
  ],
  "modals-advice-ex-04": [
    {
      "opt": "eatings",
      "reason": "Dạng biến thể \"eatings\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to eating",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "modals-advice-ex-05": [
    {
      "opt": "in",
      "reason": "Giới từ \"in\" dùng cho tháng, năm, mùa hoặc không gian kín, không dùng cho ngày cụ thể hoặc bề mặt phẳng."
    },
    {
      "opt": "at",
      "reason": "Giới từ \"at\" dùng cho mốc giờ chính xác hoặc địa điểm cụ thể, không dùng cho ngày trong tháng."
    }
  ],
  "passive-voice-ex-01": [
    {
      "opt": "was inventeds",
      "reason": "Dạng biến thể \"was inventeds\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to was invented",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "passive-voice-ex-02": [
    {
      "opt": "were",
      "reason": "Cụm thời gian \"for a long time\" chỉ sự việc kéo dài từ quá khứ đến hiện tại, phải dùng hiện tại hoàn thành."
    },
    {
      "opt": "are",
      "reason": "Không thể dùng hiện tại đơn với khoảng thời gian \"for a long time\"."
    }
  ],
  "past-continuous-ex-01": [
    {
      "opt": "was feedings",
      "reason": "Dạng biến thể \"was feedings\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to was feeding",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "past-continuous-ex-02": [
    {
      "opt": "was doing / was listenings",
      "reason": "Dạng biến thể \"was doing / was listenings\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to was doing / was listening",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "past-continuous-ex-03": [
    {
      "opt": "was watching / rangs",
      "reason": "Dạng biến thể \"was watching / rangs\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to was watching / rang",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "past-continuous-ex-04": [
    {
      "opt": "was helpings",
      "reason": "Dạng biến thể \"was helpings\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to was helping",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "past-simple-ex-01": [
    {
      "opt": "closeds",
      "reason": "Dạng biến thể \"closeds\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to closed",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "past-simple-ex-02": [
    {
      "opt": "was having / stoppeds",
      "reason": "Dạng biến thể \"was having / stoppeds\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to was having / stopped",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "past-simple-ex-03": [
    {
      "opt": "wents",
      "reason": "Dạng biến thể \"wents\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to went",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "past-simple-ex-04": [
    {
      "opt": "doesn't know",
      "reason": "Trạng từ thời gian \"then\" (= lúc đó) ở quá khứ, phải dùng quá khứ đơn \"didn't know\"."
    },
    {
      "opt": "wasn't knowing",
      "reason": "\"know\" là động từ chỉ nhận thức, không chia ở thì tiếp diễn."
    }
  ],
  "past-simple-ex-05": [
    {
      "opt": "Did … spends",
      "reason": "Dạng biến thể \"Did … spends\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to Did … spend",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "past-simple-ex-06": [
    {
      "opt": "was / wass",
      "reason": "Dạng biến thể \"was / wass\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to was / was",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "past-simple-ex-07": [
    {
      "opt": "were visitings",
      "reason": "Dạng biến thể \"were visitings\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to were visiting",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "past-simple-ex-08": [
    {
      "opt": "came / stoods",
      "reason": "Dạng biến thể \"came / stoods\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to came / stood",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "past-simple-ex-09": [
    {
      "opt": "boughts",
      "reason": "Dạng biến thể \"boughts\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to bought",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "past-simple-ex-10": [
    {
      "opt": "moveds",
      "reason": "Dạng biến thể \"moveds\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to moved",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "past-simple-ex-11": [
    {
      "opt": "opened / was sleepings",
      "reason": "Dạng biến thể \"opened / was sleepings\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to opened / was sleeping",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "past-simple-ex-12": [
    {
      "opt": "stopped / rans",
      "reason": "Dạng biến thể \"stopped / rans\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to stopped / ran",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "past-simple-ex-13": [
    {
      "opt": "walked / was finding",
      "reason": "Hành động đi dạo đang diễn ra (\"was walking\"), hành động nhặt được ví ngắn cắt ngang (\"found\")."
    },
    {
      "opt": "walked / found",
      "reason": "Hành động kéo dài sau \"While\" trong quá khứ phải chia quá khứ tiếp diễn."
    }
  ],
  "past-simple-ex-14": [
    {
      "opt": "had finished / had",
      "reason": "Hai hành động quá khứ liên tiếp với \"After\" có thể dùng hai thì quá khứ đơn hoặc quá khứ hoàn thành."
    },
    {
      "opt": "finish / have",
      "reason": "Thời điểm \"last June\" ở quá khứ, không dùng hiện tại đơn."
    }
  ],
  "past-simple-ex-15": [
    {
      "opt": "go / turn",
      "reason": "Thời điểm \"last night\" ở quá khứ, không dùng hiện tại đơn."
    },
    {
      "opt": "had gone / turned",
      "reason": "Hành động xảy ra theo trình tự trước sau thông thường trong quá khứ chia quá khứ đơn."
    }
  ],
  "past-simple-ex-16": [
    {
      "opt": "did … do / was happening",
      "reason": "Hành động đang diễn ra khi động đất ập tới chia quá khứ tiếp diễn (\"were doing\"), sự việc động đất xảy ra chia quá khứ đơn (\"happened\")."
    },
    {
      "opt": "were … doing / was happening",
      "reason": "Động đất xảy ra bất ngờ cắt ngang chia quá khứ đơn, không dùng tiếp diễn."
    }
  ],
  "past-simple-ex-21": [
    {
      "opt": "gooder",
      "reason": "\"good\" là tính từ biến đổi bất quy tắc trong so sánh hơn thành \"better\", không có dạng \"gooder\"."
    },
    {
      "opt": "more good",
      "reason": "Không dùng \"more good\" mà phải dùng dạng bất quy tắc \"better\"."
    }
  ],
  "past-simple-ex-22": [
    {
      "opt": "which",
      "reason": "\"which\" chỉ thay thế cho danh từ chỉ sự vật/hiện tượng, không dùng cho danh từ chỉ người."
    },
    {
      "opt": "whom",
      "reason": "\"whom\" làm tân ngữ, không thể làm chủ ngữ đứng trước động từ vị ngữ trong mệnh đề quan hệ."
    }
  ],
  "past-simple-ex-23": [
    {
      "opt": "didn't break",
      "reason": "Ước trái với sự việc đã xảy ra trong quá khứ (\"yesterday\") phải lùi thì về quá khứ hoàn thành (\"hadn't broken\")."
    },
    {
      "opt": "doesn't break",
      "reason": "Không dùng thì hiện tại đơn sau câu ước cho sự việc quá khứ."
    }
  ],
  "past-simple-ex-24": [
    {
      "opt": "live",
      "reason": "Ước cho hiện tại (bạn đang sống ở Huế) phải lùi thì về quá khứ đơn (\"lived\")."
    },
    {
      "opt": "lives",
      "reason": "Sau \"wish\" không dùng thì hiện tại đơn."
    }
  ],
  "personal-pronouns-ex-04": [
    {
      "opt": "them",
      "reason": "\"them\" là đại từ tân ngữ, không thể làm chủ ngữ đứng trước động từ vị ngữ \"help\"."
    },
    {
      "opt": "their",
      "reason": "\"their\" là tính từ sở hữu, bắt buộc phải có danh từ theo sau bổ nghĩa."
    }
  ],
  "personal-pronouns-ex-05": [
    {
      "opt": "I",
      "reason": "\"I\" là đại từ chủ ngữ; sau giới từ \"to\" bắt buộc phải dùng đại từ tân ngữ \"me\"."
    },
    {
      "opt": "my",
      "reason": "\"my\" là tính từ sở hữu, cần có danh từ theo sau."
    }
  ],
  "personal-pronouns-ex-06": [
    {
      "opt": "they",
      "reason": "\"they\" là đại từ chủ ngữ, ở vị trí tân ngữ sau động từ \"bought\" phải dùng đại từ tân ngữ \"them\"."
    },
    {
      "opt": "their",
      "reason": "\"their\" là tính từ sở hữu, không đứng độc lập làm tân ngữ."
    }
  ],
  "phrasal-verbs-ex-01": [
    {
      "opt": "buying",
      "reason": "Sau động từ \"decide\", động từ theo sau bắt buộc chia ở dạng to-V (\"to buy\"), không dùng V-ing."
    },
    {
      "opt": "buy",
      "reason": "Sau \"decide\" không dùng động từ nguyên thể không to."
    }
  ],
  "phrasal-verbs-ex-02": [
    {
      "opt": "passing",
      "reason": "Sau động từ \"hope\", động từ theo sau bắt buộc dùng to-V (\"to pass\"), không dùng V-ing."
    },
    {
      "opt": "pass",
      "reason": "Sau \"hope\" cần to-V chỉ mục tiêu tương lai."
    }
  ],
  "phrasal-verbs-ex-03": [
    {
      "opt": "to waters",
      "reason": "Dạng biến thể \"to waters\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to to water",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "phrasal-verbs-ex-04": [
    {
      "opt": "being",
      "reason": "Cấu trúc \"want someone to do something\" bắt buộc dùng to-V (\"to be\"), không dùng V-ing."
    },
    {
      "opt": "be",
      "reason": "Sau tân ngữ của \"want\" bắt buộc phải có \"to\"."
    }
  ],
  "plural-nouns-ex-04": [
    {
      "opt": "boxs",
      "reason": "Danh từ tận cùng là \"x\" khi chuyển sang số nhiều phải thêm đuôi \"-es\" (\"boxes\"), không chỉ thêm \"-s\"."
    },
    {
      "opt": "box",
      "reason": "Sau số từ \"five\" bắt buộc phải là danh từ số nhiều."
    }
  ],
  "plural-nouns-ex-05": [
    {
      "opt": "childs",
      "reason": "\"child\" là danh từ có dạng số nhiều bất quy tắc \"children\", không thêm đuôi \"-s\"."
    },
    {
      "opt": "childrens",
      "reason": "\"children\" vốn đã mang nghĩa số nhiều, không thêm đuôi \"-s\"."
    }
  ],
  "plural-nouns-ex-06": [
    {
      "opt": "toies",
      "reason": "Danh từ tận cùng là nguyên âm + y (\"toy\") chỉ cần thêm \"-s\" (\"toys\"), không đổi thành \"-ies\"."
    },
    {
      "opt": "toy",
      "reason": "Sau số từ \"three\" bắt buộc là danh từ số nhiều."
    }
  ],
  "possessives-ex-04": [
    {
      "opt": "theirs",
      "reason": "\"theirs\" là đại từ sở hữu đứng độc lập, không đứng trước danh từ \"children\"."
    },
    {
      "opt": "them",
      "reason": "\"them\" là đại từ tân ngữ, không có chức năng chỉ sự sở hữu trước danh từ."
    }
  ],
  "possessives-ex-05": [
    {
      "opt": "your",
      "reason": "\"your\" là tính từ sở hữu, bắt buộc có danh từ theo sau; đứng độc lập làm bổ ngữ phải dùng đại từ sở hữu \"yours\"."
    },
    {
      "opt": "you",
      "reason": "\"you\" là đại từ nhân xưng, không mang ý nghĩa sở hữu \"của bạn\"."
    }
  ],
  "possessives-ex-06": [
    {
      "opt": "it's",
      "reason": "\"it's\" là dạng viết tắt của \"it is\" hoặc \"it has\", trong khi ngữ cảnh cần tính từ sở hữu \"its\" (không có dấu nháy đơn)."
    },
    {
      "opt": "it",
      "reason": "\"it\" là đại từ nhân xưng, không phải tính từ sở hữu bổ nghĩa cho danh từ \"leg\"."
    }
  ],
  "present-continuous-ex-01": [
    {
      "opt": "cries",
      "reason": "Dấu hiệu nhận biết \"Listen!\" yêu cầu thì hiện tại tiếp diễn \"is crying\" cho hành động đang diễn ra."
    },
    {
      "opt": "are crying",
      "reason": "Đại từ bất định \"Someone\" luôn đi với động từ số ít \"is\"."
    }
  ],
  "present-continuous-ex-02": [
    {
      "opt": "isn't liking",
      "reason": "Động từ \"like\" là động từ chỉ sở thích/trạng thái (stative verb), không chia ở thì tiếp diễn."
    },
    {
      "opt": "don't like",
      "reason": "Chủ ngữ \"Tom\" là ngôi thứ ba số ít, phải dùng trợ động từ \"doesn't\"."
    }
  ],
  "present-continuous-ex-03": [
    {
      "opt": "are watching",
      "reason": "Trạng từ \"every night\" chỉ thói quen lặp đi lặp lại, phải chia hiện tại đơn, không dùng tiếp diễn."
    },
    {
      "opt": "watches",
      "reason": "Chủ ngữ \"We\" là ngôi thứ nhất số nhiều, động từ để nguyên mẫu \"watch\"."
    }
  ],
  "present-continuous-ex-04": [
    {
      "opt": "does … go",
      "reason": "Trạng từ \"now\" yêu cầu thì hiện tại tiếp diễn (\"is she going\"), không dùng hiện tại đơn."
    },
    {
      "opt": "is … go",
      "reason": "Thì tiếp diễn phải dùng V-ing (\"going\"), không dùng động từ nguyên thể."
    }
  ],
  "present-continuous-ex-05": [
    {
      "opt": "is wanting",
      "reason": "\"want\" là stative verb (động từ chỉ nhu cầu/trạng thái), không chia ở thì tiếp diễn dù có \"at the moment\"."
    },
    {
      "opt": "want",
      "reason": "Chủ ngữ \"My mother\" là ngôi thứ ba số ít, động từ phải thêm \"-s\"."
    }
  ],
  "present-continuous-ex-06": [
    {
      "opt": "build",
      "reason": "Hành động đang diễn ra xung quanh thời điểm nói (\"this year\") phải chia hiện tại tiếp diễn \"are building\"."
    },
    {
      "opt": "is building",
      "reason": "Chủ ngữ \"They\" là số nhiều, phải dùng to-be \"are\"."
    }
  ],
  "present-continuous-ex-07": [
    {
      "opt": "is leaving",
      "reason": "Lịch trình tàu xe cố định (\"at 8 a.m. tomorrow\") bắt buộc dùng thì hiện tại đơn \"leaves\", không dùng tiếp diễn."
    },
    {
      "opt": "will leave",
      "reason": "Lịch trình tàu xe công cộng cố định ưu tiên hiện tại đơn thay vì \"will\"."
    }
  ],
  "present-continuous-ex-08": [
    {
      "opt": "always leave",
      "reason": "Cấu trúc \"be always + V-ing\" dùng để phàn nàn về một thói quen gây khó chịu cho người khác."
    },
    {
      "opt": "is always leaving",
      "reason": "Chủ ngữ \"You\" đi với to-be \"are\", không đi với \"is\"."
    }
  ],
  "present-continuous-ex-09": [
    {
      "opt": "will fly",
      "reason": "Kế hoạch đã có vé máy bay đặt sẵn (\"ticket is booked\") dùng hiện tại tiếp diễn chỉ tương lai chắc chắn xảy ra."
    },
    {
      "opt": "fly",
      "reason": "Lịch trình cá nhân đã chốt vé dùng hiện tại tiếp diễn, không dùng hiện tại đơn."
    }
  ],
  "present-continuous-ex-10": [
    {
      "opt": "will have",
      "reason": "Đã gửi thiệp mời (\"invitations are sent\"), sự việc đã sắp xếp chắc chắn dùng hiện tại tiếp diễn \"are having\"."
    },
    {
      "opt": "have",
      "reason": "Bữa tiệc diễn ra vào cuối tuần tới, không dùng hiện tại đơn chỉ thói quen."
    }
  ],
  "present-continuous-ex-11": [
    {
      "opt": "tries",
      "reason": "Mệnh lệnh \"Look!\" yêu cầu thì hiện tại tiếp diễn cho hành động đang diễn ra ngay lúc nói."
    },
    {
      "opt": "try",
      "reason": "Chủ ngữ \"That man\" là ngôi thứ ba số ít, cần to-be số ít \"is trying\"."
    }
  ],
  "present-perfect-ex-01": [
    {
      "opt": "already finished",
      "reason": "Hành động vừa mới hoàn thành có \"already\" dùng thì hiện tại hoàn thành, không dùng quá khứ đơn."
    },
    {
      "opt": "has already finished",
      "reason": "Chủ ngữ \"I\" đi với trợ động từ \"have\", không đi với \"has\"."
    }
  ],
  "present-perfect-ex-02": [
    {
      "opt": "just passed",
      "reason": "Hành động vừa mới xảy ra có \"just\" chia ở thì hiện tại hoàn thành \"has just passed\"."
    },
    {
      "opt": "have just passed",
      "reason": "Chủ ngữ \"Rashid\" là ngôi thứ ba số ít, phải dùng \"has\", không dùng \"have\"."
    }
  ],
  "present-perfect-ex-03": [
    {
      "opt": "were",
      "reason": "Cụm thời gian \"for a long time\" chỉ sự việc kéo dài từ quá khứ đến hiện tại, phải dùng hiện tại hoàn thành."
    },
    {
      "opt": "are",
      "reason": "Không thể dùng hiện tại đơn với khoảng thời gian \"for a long time\"."
    }
  ],
  "present-perfect-ex-04": [
    {
      "opt": "did … live",
      "reason": "Câu hỏi với \"How long\" và mốc thời gian \"Since 1990\" bắt buộc dùng hiện tại hoàn thành, không dùng quá khứ đơn."
    },
    {
      "opt": "do … live",
      "reason": "Không dùng hiện tại đơn khi hỏi về sự việc kéo dài từ quá khứ đến nay."
    }
  ],
  "present-perfect-ex-05": [
    {
      "opt": "already told",
      "reason": "Trạng từ \"already\" trong câu nhấn mạnh kết quả ở hiện tại, phải chia hiện tại hoàn thành."
    },
    {
      "opt": "have already told",
      "reason": "Chủ ngữ \"The teacher\" là số ít, dùng \"has\", không dùng \"have\"."
    }
  ],
  "present-perfect-ex-06": [
    {
      "opt": "didn't see",
      "reason": "Mốc thời gian \"since Christmas\" bắt buộc dùng thì hiện tại hoàn thành, không dùng quá khứ đơn."
    },
    {
      "opt": "haven't seen",
      "reason": "Chủ ngữ \"She\" là ngôi thứ ba số ít, dùng \"hasn't\", không dùng \"haven't\"."
    }
  ],
  "present-perfect-ex-07": [
    {
      "opt": "Did … finish",
      "reason": "Trạng từ \"yet\" ở cuối câu hỏi yêu cầu thì hiện tại hoàn thành, không dùng quá khứ đơn."
    },
    {
      "opt": "Do … finish",
      "reason": "Không dùng hiện tại đơn với \"yet\"."
    }
  ],
  "present-perfect-ex-08": [
    {
      "opt": "studied",
      "reason": "Hành động vẫn đang tiếp tục (\"and is still studying\") kèm \"for three years\" bắt buộc dùng thì hoàn thành."
    },
    {
      "opt": "have studied",
      "reason": "Chủ ngữ \"Karen\" là ngôi thứ ba số ít, dùng \"has\", không dùng \"have\"."
    }
  ],
  "present-perfect-ex-09": [
    {
      "opt": "Will … visit",
      "reason": "Đã mua quà từ trước (\"has already bought a present\"), kế hoạch có chuẩn bị dùng \"be going to\"."
    },
    {
      "opt": "Does … visit",
      "reason": "Hỏi về sự việc chủ nhật này (\"this Sunday\") không dùng hiện tại đơn chỉ thói quen."
    }
  ],
  "present-perfect-ex-10": [
    {
      "opt": "lived",
      "reason": "Khoảng thời gian kéo dài đến nay (\"for two years\") dùng thì hiện tại hoàn thành, không dùng quá khứ đơn."
    },
    {
      "opt": "are living",
      "reason": "Thì tiếp diễn không dùng chung với cụm đo lường thời gian \"for two years\"."
    }
  ],
  "present-perfect-ex-11": [
    {
      "opt": "hasn't stopped",
      "reason": "Mốc thời gian quá khứ xác định (\"last Friday\") bắt buộc dùng thì quá khứ đơn, không dùng hiện tại hoàn thành."
    },
    {
      "opt": "doesn't stop",
      "reason": "Thời gian đã xảy ra trong quá khứ (\"last Friday\"), không dùng hiện tại đơn."
    }
  ],
  "present-perfect-ex-12": [
    {
      "opt": "were",
      "reason": "Hỏi về khoảng thời gian hôn nhân kéo dài đến nay dùng \"have Bob and Mary been\", không dùng quá khứ đơn."
    },
    {
      "opt": "are",
      "reason": "Không dùng hiện tại đơn với câu hỏi \"How long\"."
    }
  ],
  "present-perfect-ex-13": [
    {
      "opt": "learned",
      "reason": "Mốc thời gian \"since 2022\" yêu cầu thì hiện tại hoàn thành \"has learned\", không dùng quá khứ đơn."
    },
    {
      "opt": "have learned",
      "reason": "Chủ ngữ \"She\" là số ít, dùng \"has\", không dùng \"have\"."
    }
  ],
  "present-perfect-ex-14": [
    {
      "opt": "Did … finish",
      "reason": "Trạng từ \"yet\" ở cuối câu hỏi yêu cầu thì hiện tại hoàn thành \"Has your brother finished\"."
    },
    {
      "opt": "Have … finished",
      "reason": "Chủ ngữ \"your brother\" là ngôi thứ ba số ít, dùng \"Has\", không dùng \"Have\"."
    }
  ],
  "present-perfect-ex-15": [
    {
      "opt": "cooked / was ringing",
      "reason": "Hành động đang diễn ra trong quá khứ (nấu ăn) dùng quá khứ tiếp diễn (\"was cooking\"), hành động ngắn xen vào dùng quá khứ đơn (\"rang\")."
    },
    {
      "opt": "was cooking / was ringing",
      "reason": "Tiếng chuông điện thoại reo là hành động ngắn cắt ngang, không dùng tiếp diễn."
    }
  ],
  "present-simple-ex-01": [
    {
      "opt": "are",
      "reason": "\"are\" dùng cho chủ ngữ số nhiều hoặc \"you/we/they\", không phù hợp với chủ ngữ số ít."
    },
    {
      "opt": "am",
      "reason": "\"am\" chỉ đi duy nhất với chủ ngữ ngôi thứ nhất \"I\"."
    }
  ],
  "present-simple-ex-02": [
    {
      "opt": "come",
      "reason": "Chủ ngữ ngôi thứ ba số ít ở thì hiện tại đơn động từ bắt buộc thêm \"-s\" (\"comes\")."
    },
    {
      "opt": "is coming",
      "reason": "Nguồn gốc quê quán là sự thật cố định lâu dài, dùng hiện tại đơn, không dùng tiếp diễn."
    }
  ],
  "present-simple-ex-03": [
    {
      "opt": "isn't",
      "reason": "Chủ ngữ \"They\" là số nhiều, phủ định của to-be là \"aren't\", không dùng \"isn't\"."
    },
    {
      "opt": "don't be",
      "reason": "Với động từ to-be không mượn trợ động từ \"do/don't\" trong câu trần thuật."
    }
  ],
  "present-simple-ex-04": [
    {
      "opt": "don't do",
      "reason": "Chủ ngữ \"My brother\" là ngôi thứ ba số ít, trợ động từ phủ định phải là \"doesn't\"."
    },
    {
      "opt": "doesn't does",
      "reason": "Sau trợ động từ \"doesn't\", động từ chính phải trở về dạng nguyên thể \"do\", không thêm \"-es\"."
    }
  ],
  "present-simple-ex-05": [
    {
      "opt": "is",
      "reason": "\"is\" dùng cho chủ ngữ ngôi thứ ba số ít, trong khi chủ ngữ là \"I\"."
    },
    {
      "opt": "are",
      "reason": "\"are\" không đi với chủ ngữ ngôi thứ nhất số ít \"I\"."
    }
  ],
  "present-simple-ex-06": [
    {
      "opt": "rain",
      "reason": "Chủ ngữ \"It\" là ngôi thứ ba số ít, động từ chia hiện tại đơn phải thêm \"-s\" (\"rains\")."
    },
    {
      "opt": "is raining",
      "reason": "Diễn tả đặc điểm khí hậu chung dùng hiện tại đơn, không dùng hiện tại tiếp diễn."
    }
  ],
  "present-simple-ex-07": [
    {
      "opt": "Iss",
      "reason": "Dạng biến thể \"Iss\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to Is",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "present-simple-ex-08": [
    {
      "opt": "get",
      "reason": "Chủ ngữ \"My brother\" là ngôi thứ ba số ít, động từ cần thêm \"-s\" (\"gets\")."
    },
    {
      "opt": "getting",
      "reason": "Thiếu trợ động từ to-be nếu muốn chia thì tiếp diễn."
    }
  ],
  "present-simple-ex-09": [
    {
      "opt": "Do … study",
      "reason": "Chủ ngữ \"your sister\" là ngôi thứ ba số ít, trợ động từ câu hỏi phải dùng \"Does\"."
    },
    {
      "opt": "Does … studies",
      "reason": "Sau trợ động từ \"Does\", động từ chính giữ nguyên thể \"study\", không thêm đuôi \"-ies\"."
    }
  ],
  "present-simple-ex-10": [
    {
      "opt": "will get",
      "reason": "Trong mệnh đề trạng ngữ chỉ thời gian bắt đầu bằng \"when\", cấm dùng \"will\", phải dùng hiện tại đơn."
    },
    {
      "opt": "gets",
      "reason": "Chủ ngữ \"I\" đi với động từ nguyên thể \"get\", không thêm \"-s\"."
    }
  ],
  "present-simple-ex-11": [
    {
      "opt": "will say",
      "reason": "Trong mệnh đề chỉ thời gian bắt đầu bằng \"until\", không dùng \"will\", phải chia ở hiện tại đơn."
    },
    {
      "opt": "says",
      "reason": "Chủ ngữ \"I\" đi với động từ nguyên thể \"say\", không thêm \"-s\"."
    }
  ],
  "present-simple-ex-12": [
    {
      "opt": "calls / will receive",
      "reason": "Sau liên từ thời gian \"as soon as\", động từ chia hiện tại đơn (\"receives\"), mệnh đề chính mới dùng \"will call\"."
    },
    {
      "opt": "will call / will receive",
      "reason": "Sau liên từ chỉ thời gian \"as soon as\" cấm dùng \"will\"."
    }
  ],
  "present-simple-ex-13": [
    {
      "opt": "blooms",
      "reason": "Chủ ngữ \"Violets\" là danh từ số nhiều, động từ chia ở dạng nguyên thể \"bloom\", không thêm \"-s\"."
    },
    {
      "opt": "blooming",
      "reason": "Không dùng dạng V-ing đứng độc lập làm vị ngữ chính của câu."
    }
  ],
  "present-simple-ex-14": [
    {
      "opt": "buys / wins",
      "reason": "Chủ ngữ \"I\" đi với động từ nguyên thể, không thêm \"-s/-es\"."
    },
    {
      "opt": "bought / won",
      "reason": "Trạng từ \"always\" và \"never\" chỉ thói quen hiện tại, không dùng thì quá khứ đơn."
    }
  ],
  "present-simple-ex-17": [
    {
      "opt": "doings",
      "reason": "Dạng biến thể \"doings\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to doing",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "present-simple-ex-18": [
    {
      "opt": "in",
      "reason": "Giới từ \"in\" dùng cho tháng, năm, mùa hoặc không gian kín, không dùng cho ngày cụ thể hoặc bề mặt phẳng."
    },
    {
      "opt": "at",
      "reason": "Giới từ \"at\" dùng cho mốc giờ chính xác hoặc địa điểm cụ thể, không dùng cho ngày trong tháng."
    }
  ],
  "present-simple-ex-19": [
    {
      "opt": "in",
      "reason": "Giới từ \"in\" dùng cho khoảng thời gian dài hoặc không gian kín, không dùng cho mốc giờ chính xác hoặc sự kiện lễ hội như Christmas."
    },
    {
      "opt": "on",
      "reason": "Giới từ \"on\" chỉ dùng cho ngày trong tuần hoặc ngày cụ thể, không dùng cho mốc giờ."
    }
  ],
  "present-simple-ex-20": [
    {
      "opt": "in",
      "reason": "Giới từ \"in\" dùng cho tháng, năm, mùa hoặc không gian kín, không dùng cho ngày cụ thể hoặc bề mặt phẳng."
    },
    {
      "opt": "at",
      "reason": "Giới từ \"at\" dùng cho mốc giờ chính xác hoặc địa điểm cụ thể, không dùng cho ngày trong tháng."
    }
  ],
  "present-simple-ex-21": [
    {
      "opt": "on",
      "reason": "Giới từ \"on\" dùng cho ngày cụ thể hoặc đường phố có số nhà, không dùng cho tên thành phố hoặc các buổi trong ngày (in the morning)."
    },
    {
      "opt": "at",
      "reason": "Giới từ \"at\" dùng cho địa chỉ cụ thể hoặc điểm mốc, không dùng cho thành phố lớn (như Da Nang)."
    }
  ],
  "present-simple-ex-22": [
    {
      "opt": "in",
      "reason": "Giới từ \"in\" dùng cho khoảng thời gian dài hoặc không gian kín, không dùng cho mốc giờ chính xác hoặc sự kiện lễ hội như Christmas."
    },
    {
      "opt": "on",
      "reason": "Giới từ \"on\" chỉ dùng cho ngày trong tuần hoặc ngày cụ thể, không dùng cho mốc giờ."
    }
  ],
  "present-simple-ex-23": [
    {
      "opt": "on",
      "reason": "Giới từ \"on\" dùng cho ngày cụ thể hoặc đường phố có số nhà, không dùng cho tên thành phố hoặc các buổi trong ngày (in the morning)."
    },
    {
      "opt": "at",
      "reason": "Giới từ \"at\" dùng cho địa chỉ cụ thể hoặc điểm mốc, không dùng cho thành phố lớn (như Da Nang)."
    }
  ],
  "present-simple-ex-24": [
    {
      "opt": "at",
      "reason": "Tính từ \"famous\" cố định đi với giới từ \"for\" (\"famous for\" = nổi tiếng vì cái gì), không đi với \"at\"."
    },
    {
      "opt": "about",
      "reason": "Cụm cố định là \"famous for\", không dùng \"famous about\"."
    }
  ],
  "present-simple-ex-25": [
    {
      "opt": "in",
      "reason": "Giới từ \"in\" dùng cho khoảng thời gian dài hoặc không gian kín, không dùng cho mốc giờ chính xác hoặc sự kiện lễ hội như Christmas."
    },
    {
      "opt": "on",
      "reason": "Giới từ \"on\" chỉ dùng cho ngày trong tuần hoặc ngày cụ thể, không dùng cho mốc giờ."
    }
  ],
  "present-simple-ex-26": [
    {
      "opt": "Despite / In spite ofs",
      "reason": "Dạng biến thể \"Despite / In spite ofs\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to Despite / In spite of",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "present-simple-ex-28": [
    {
      "opt": "however",
      "reason": "\"however\" chỉ sự tương phản đối lập, trong khi câu sau là kết quả tất yếu của câu trước (dùng \"Therefore\")."
    },
    {
      "opt": "although",
      "reason": "\"although\" là liên từ phụ thuộc nối 2 mệnh đề trong cùng một câu, không đứng đầu câu độc lập sau dấu chấm."
    }
  ],
  "present-simple-ex-29": [
    {
      "opt": "invent",
      "reason": "Sau sở hữu cách \"Edison's\" bắt buộc phải là một danh từ (\"invention\"), không thể dùng động từ \"invent\"."
    },
    {
      "opt": "inventor",
      "reason": "\"inventor\" là danh từ chỉ người phát minh, không phù hợp với ngữ cảnh sự phát minh ra bóng đèn."
    }
  ],
  "present-simple-ex-30": [
    {
      "opt": "health",
      "reason": "Sau động từ to-be \"is\" và phó từ chỉ mức độ \"very\" cần một tính từ (\"healthy\"), không dùng danh từ \"health\"."
    },
    {
      "opt": "healthily",
      "reason": "\"healthily\" là trạng từ, không làm bổ ngữ chỉ tính chất sau động từ to-be."
    }
  ],
  "quantifiers-ex-01": [
    {
      "opt": "has",
      "reason": "Chủ ngữ \"We\" là ngôi thứ nhất số nhiều, động từ ở hiện tại đơn dùng \"have\", không dùng \"has\"."
    },
    {
      "opt": "are having",
      "reason": "Lịch học cố định hàng tuần dùng hiện tại đơn chỉ thói quen."
    }
  ],
  "quantifiers-ex-02": [
    {
      "opt": "Does … work",
      "reason": "Chủ ngữ \"your parents\" là danh từ số nhiều, trợ động từ câu hỏi phải dùng \"Do\", không dùng \"Does\"."
    },
    {
      "opt": "Are … work",
      "reason": "Không dùng to-be với động từ nguyên thể \"work\"."
    }
  ],
  "quantifiers-ex-03": [
    {
      "opt": "goes",
      "reason": "Chủ ngữ gồm 2 người (\"Hoa and her sister\") là chủ ngữ số nhiều, động từ để nguyên mẫu \"go\"."
    },
    {
      "opt": "are going",
      "reason": "Thói quen đi học bằng xe đạp dùng hiện tại đơn, không dùng tiếp diễn."
    }
  ],
  "quantifiers-ex-04": [
    {
      "opt": "is wanting",
      "reason": "\"want\" là stative verb (động từ chỉ nhu cầu/trạng thái), không chia ở thì tiếp diễn dù có \"at the moment\"."
    },
    {
      "opt": "want",
      "reason": "Chủ ngữ \"My mother\" là ngôi thứ ba số ít, động từ phải thêm \"-s\"."
    }
  ],
  "quantifiers-ex-05": [
    {
      "opt": "live",
      "reason": "Chủ ngữ là \"One of my brothers\" (chỉ một người trong số các anh trai), động từ phải chia số ít \"lives\"."
    },
    {
      "opt": "living",
      "reason": "Thiếu to-be nếu muốn dùng thì tiếp diễn."
    }
  ],
  "quantifiers-ex-06": [
    {
      "opt": "are",
      "reason": "\"are\" dùng cho chủ ngữ số nhiều hoặc \"you/we/they\", không phù hợp với chủ ngữ số ít."
    },
    {
      "opt": "am",
      "reason": "\"am\" chỉ đi duy nhất với chủ ngữ ngôi thứ nhất \"I\"."
    }
  ],
  "quantifiers-ex-07": [
    {
      "opt": "are",
      "reason": "\"are\" dùng cho chủ ngữ số nhiều hoặc \"you/we/they\", không phù hợp với chủ ngữ số ít."
    },
    {
      "opt": "am",
      "reason": "\"am\" chỉ đi duy nhất với chủ ngữ ngôi thứ nhất \"I\"."
    }
  ],
  "quantifiers-ex-08": [
    {
      "opt": "are",
      "reason": "\"are\" dùng cho chủ ngữ số nhiều hoặc \"you/we/they\", không phù hợp với chủ ngữ số ít."
    },
    {
      "opt": "am",
      "reason": "\"am\" chỉ đi duy nhất với chủ ngữ ngôi thứ nhất \"I\"."
    }
  ],
  "quantifiers-ex-09": [
    {
      "opt": "is",
      "reason": "\"is\" dùng cho chủ ngữ số ít, không hòa hợp với chủ ngữ số nhiều."
    },
    {
      "opt": "was",
      "reason": "Ngữ cảnh hiện tại không dùng to-be ở quá khứ đơn."
    }
  ],
  "quantifiers-ex-10": [
    {
      "opt": "are",
      "reason": "\"are\" dùng cho chủ ngữ số nhiều hoặc \"you/we/they\", không phù hợp với chủ ngữ số ít."
    },
    {
      "opt": "am",
      "reason": "\"am\" chỉ đi duy nhất với chủ ngữ ngôi thứ nhất \"I\"."
    }
  ],
  "quantifiers-ex-11": [
    {
      "opt": "wears",
      "reason": "\"Half of the students\" chỉ một nửa số học sinh (danh từ số nhiều), động từ chia số nhiều \"wear\"."
    },
    {
      "opt": "is wearing",
      "reason": "Sự thật chung về việc đeo kính dùng hiện tại đơn."
    }
  ],
  "quantifiers-ex-12": [
    {
      "opt": "are",
      "reason": "\"are\" dùng cho chủ ngữ số nhiều hoặc \"you/we/they\", không phù hợp với chủ ngữ số ít."
    },
    {
      "opt": "am",
      "reason": "\"am\" chỉ đi duy nhất với chủ ngữ ngôi thứ nhất \"I\"."
    }
  ],
  "quantifiers-ex-13": [
    {
      "opt": "like",
      "reason": "Cấu trúc \"Not only... but also...\" hòa hợp theo chủ ngữ gần nhất \"my sister\" (số ít), động từ phải thêm \"-s\" (\"likes\")."
    },
    {
      "opt": "are liking",
      "reason": "\"like\" là stative verb không chia tiếp diễn."
    }
  ],
  "quantifiers-ex-16": [
    {
      "opt": "an",
      "reason": "Danh từ \"nurse\" phát âm bắt đầu bằng một phụ âm (/n/), do đó dùng mạo từ \"a\", không dùng \"an\"."
    },
    {
      "opt": "the",
      "reason": "Nghề nghiệp được giới thiệu lần đầu tiên dùng mạo từ bất định \"a\", không dùng mạo từ xác định \"the\"."
    }
  ],
  "quantifiers-ex-17": [
    {
      "opt": "the",
      "reason": "Khi nói về sở thích chung chung với danh từ số nhiều (\"computer games\"), không dùng mạo từ \"the\"."
    },
    {
      "opt": "a",
      "reason": "\"computer games\" là danh từ số nhiều, không thể đi với mạo từ số ít \"a\"."
    }
  ],
  "relative-clauses-ex-02": [
    {
      "opt": "comfortabler",
      "reason": "\"comfortable\" là tính từ dài 3 âm tiết, so sánh hơn dùng \"more comfortable\", không thêm đuôi \"-er\"."
    },
    {
      "opt": "most comfortable",
      "reason": "So sánh hơn với \"than\" dùng \"more\", không dùng \"most\"."
    }
  ],
  "relative-clauses-ex-03": [
    {
      "opt": "more dangerous",
      "reason": "Phạm vi \"in the world\" chỉ so sánh nhất trên toàn thế giới, phải dùng \"the most dangerous\"."
    },
    {
      "opt": "most dangerous",
      "reason": "So sánh nhất bắt buộc phải có mạo từ \"the\" đi kèm."
    }
  ],
  "relative-clauses-ex-04": [
    {
      "opt": "more easy",
      "reason": "\"easy\" là tính từ 2 âm tiết tận cùng bằng \"-y\", so sánh hơn đổi \"-y\" thành \"-ier\" (\"easier\"), không dùng \"more easy\"."
    },
    {
      "opt": "easiest",
      "reason": "\"easiest\" là so sánh nhất, trong khi từ nhận biết \"than\" yêu cầu dạng so sánh hơn."
    }
  ],
  "relative-clauses-ex-07": [
    {
      "opt": "which",
      "reason": "\"which\" chỉ thay thế cho danh từ chỉ sự vật/hiện tượng, không dùng cho danh từ chỉ người."
    },
    {
      "opt": "whom",
      "reason": "\"whom\" làm tân ngữ, không thể làm chủ ngữ đứng trước động từ vị ngữ trong mệnh đề quan hệ."
    }
  ],
  "relative-clauses-ex-08": [
    {
      "opt": "who",
      "reason": "\"who\" chỉ thay thế cho danh từ chỉ người, không dùng cho danh từ chỉ đồ vật hay con vật."
    },
    {
      "opt": "that",
      "reason": "\"that\" ít trang trọng hơn hoặc không phù hợp với cấu trúc câu."
    }
  ],
  "relative-clauses-ex-09": [
    {
      "opt": "who",
      "reason": "\"who\" là đại từ quan hệ chủ ngữ, không đứng trước danh từ để chỉ quan hệ sở hữu."
    },
    {
      "opt": "which",
      "reason": "\"which\" thay thế cho danh từ vật, không dùng chỉ quan hệ sở hữu giữa hai danh từ."
    }
  ],
  "relative-clauses-ex-10": [
    {
      "opt": "who",
      "reason": "\"who\" chỉ thay thế cho danh từ chỉ người, không dùng cho danh từ chỉ đồ vật hay con vật."
    },
    {
      "opt": "that",
      "reason": "Trong mệnh đề quan hệ không xác định (đứng sau dấu phẩy), tuyệt đối không được dùng đại từ \"that\"."
    }
  ],
  "relative-clauses-ex-11": [
    {
      "opt": "which",
      "reason": "\"which\" chỉ thay thế cho danh từ chỉ sự vật/hiện tượng, không dùng cho danh từ chỉ người."
    },
    {
      "opt": "whom",
      "reason": "\"whom\" làm tân ngữ, không thể làm chủ ngữ đứng trước động từ vị ngữ trong mệnh đề quan hệ."
    }
  ],
  "relative-clauses-ex-12": [
    {
      "opt": "who",
      "reason": "\"who\" chỉ thay thế cho danh từ chỉ người, không dùng cho danh từ chỉ đồ vật hay con vật."
    },
    {
      "opt": "that",
      "reason": "\"that\" ít trang trọng hơn hoặc không phù hợp với cấu trúc câu."
    }
  ],
  "relative-clauses-ex-13": [
    {
      "opt": "who",
      "reason": "\"who\" là đại từ quan hệ chủ ngữ, không đứng trước danh từ để chỉ quan hệ sở hữu."
    },
    {
      "opt": "which",
      "reason": "\"which\" thay thế cho danh từ vật, không dùng chỉ quan hệ sở hữu giữa hai danh từ."
    }
  ],
  "relative-clauses-ex-14": [
    {
      "opt": "who",
      "reason": "\"who\" là đại từ quan hệ chủ ngữ, không đứng trước danh từ để chỉ quan hệ sở hữu."
    },
    {
      "opt": "which",
      "reason": "\"which\" thay thế cho danh từ vật, không dùng chỉ quan hệ sở hữu giữa hai danh từ."
    }
  ],
  "relative-clauses-ex-15": [
    {
      "opt": "who",
      "reason": "\"who\" chỉ thay thế cho danh từ chỉ người, không dùng cho danh từ chỉ đồ vật hay con vật."
    },
    {
      "opt": "that",
      "reason": "\"that\" ít trang trọng hơn hoặc không phù hợp với cấu trúc câu."
    }
  ],
  "relative-clauses-ex-26": [
    {
      "opt": "in",
      "reason": "Giới từ \"in\" dùng cho khoảng thời gian dài hoặc không gian kín, không dùng cho mốc giờ chính xác hoặc sự kiện lễ hội như Christmas."
    },
    {
      "opt": "on",
      "reason": "Giới từ \"on\" chỉ dùng cho ngày trong tuần hoặc ngày cụ thể, không dùng cho mốc giờ."
    }
  ],
  "relative-clauses-ex-27": [
    {
      "opt": "althoughs",
      "reason": "Dạng biến thể \"althoughs\" không thỏa mãn quy tắc cú pháp hoặc hòa hợp ngôi trong câu này."
    },
    {
      "opt": "to although",
      "reason": "Không dùng cấu trúc to-V ở vị trí này trong câu."
    }
  ],
  "wish-if-only-ex-01": [
    {
      "opt": "speak",
      "reason": "Câu ước cho điều không có thật ở hiện tại phải lùi một thì về quá khứ đơn (\"spoke\"), không dùng hiện tại \"speak\"."
    },
    {
      "opt": "will speak",
      "reason": "Sau \"wish\" ước ở hiện tại không dùng \"will speak\"."
    }
  ],
  "wish-if-only-ex-02": [
    {
      "opt": "was",
      "reason": "Trong văn phong học thuật chuẩn ETS, câu ước cho hiện tại quy chuẩn dùng to-be \"were\" cho tất cả các ngôi."
    },
    {
      "opt": "is",
      "reason": "Sau \"wish\" ước ở hiện tại bắt buộc phải lùi thì về quá khứ, không dùng hiện tại \"is\"."
    }
  ],
  "wish-if-only-ex-03": [
    {
      "opt": "doesn't rain",
      "reason": "Câu ước cho hiện tại phải lùi thì về quá khứ đơn (\"didn't rain\"), không dùng hiện tại đơn \"doesn't rain\"."
    },
    {
      "opt": "won't rain",
      "reason": "Ước cho hiện tại không dùng \"won't rain\"."
    }
  ],
  "wish-if-only-ex-04": [
    {
      "opt": "went",
      "reason": "Ước cho một sự việc trái với quá khứ (\"last night\") phải lùi thì về quá khứ hoàn thành (\"had gone\"), không dùng quá khứ đơn."
    },
    {
      "opt": "have gone",
      "reason": "Sau \"wish\" ước cho quá khứ phải dùng \"had + V3\", không dùng \"have gone\"."
    }
  ]
};
