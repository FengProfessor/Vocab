/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: pets_vet
 * File: src/data/speaking/topic-library/daily-situations/pets-vet.ts
 *
 * 5 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const PETS_VET_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-vet-01",
    category: 'daily_situations',
    subcategory: 'pets_vet',
    level: "A2",
    titleEn: "Taking a pet to the vet",
    titleVi: "Đưa thú cưng đến bác sĩ thú y",
    icon: "🐶",
    situationVi: "Bạn đang trong tình huống: Đưa thú cưng đến bác sĩ thú y. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for taking a pet to the vet.", textVi: "Chào, tôi ở đây để đưa thú cưng đến bác sĩ thú y." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "assist",
        ipa: "/əˈsɪst/",
        partOfSpeech: "v.",
        meaningVi: "hỗ trợ",
        exampleEn: "I can assist you.",
        exampleVi: "Tôi có thể hỗ trợ bạn.",
        associatedActions: [
          { en: "hold the pet still during examination", vi: "giữ yên thú cưng trong lúc bác sĩ khám" },
          { en: "assist the vet with vaccination", vi: "hỗ trợ bác sĩ thú y tiêm phòng" },
          { en: "help calm anxious animals", vi: "giúp xoa dịu những con vật đang sợ hãi" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "book routine veterinary checkup service", vi: "đặt dịch vụ khám sức khỏe thú y định kỳ" },
          { en: "use emergency animal hospital service", vi: "sử dụng dịch vụ bệnh viện thú y cấp cứu" },
          { en: "receive microchipping service for dog", vi: "tiến hành dịch vụ cấy vi chip cho chó" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "discuss sudden weight loss issue", vi: "thảo luận sự cố thú cưng sụt cân đột ngột" },
          { en: "treat ear infection issues", vi: "điều trị các vấn đề viêm tai" },
          { en: "address chronic parasite issues", vi: "giải quyết triệt để vấn đề ký sinh trùng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "weigh the animal on scale", vi: "cân trọng lượng thú cưng trên bàn cân" },
          { en: "take body temperature with thermometer", vi: "đo thân nhiệt bằng nhiệt kế" },
          { en: "collect prescribed antibiotics at pharmacy", vi: "nhận thuốc kháng sinh theo đơn tại quầy" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check if vet surgeon is available", vi: "kiểm tra xem bác sĩ phẫu thuật thú y có trực không" },
          { en: "confirm rabies vaccines are available", vi: "xác nhận vắc-xin dại luôn có sẵn" },
          { en: "pick earliest available appointment slot", vi: "chọn khung giờ hẹn khám sớm nhất có thể" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Taking a pet to the vet. Respond naturally to the user.",
    tags: ["pets-vet","daily-life"]
  },
  {
    id: "daily-vet-02",
    category: 'daily_situations',
    subcategory: 'pets_vet',
    level: "B1",
    titleEn: "Describing pet symptoms",
    titleVi: "Mô tả triệu chứng của thú cưng",
    icon: "🌡️",
    situationVi: "Bạn đang trong tình huống: Mô tả triệu chứng của thú cưng. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for describing pet symptoms.", textVi: "Chào, tôi ở đây để mô tả triệu chứng của thú cưng." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "assist",
        ipa: "/əˈsɪst/",
        partOfSpeech: "v.",
        meaningVi: "hỗ trợ",
        exampleEn: "I can assist you.",
        exampleVi: "Tôi có thể hỗ trợ bạn.",
        associatedActions: [
          { en: "assist vet in observing pet behavior", vi: "hỗ trợ bác sĩ quan sát hành vi của con vật" },
          { en: "help demonstrate pet limp or cough", vi: "giúp mô phỏng dáng đi khập khiễng hay tiếng ho" },
          { en: "assist with administering eye drops", vi: "hỗ trợ nhỏ thuốc nhỏ mắt cho thú cưng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "request diagnostic blood test service", vi: "yêu cầu dịch vụ xét nghiệm máu chẩn đoán" },
          { en: "utilize ultrasound scanning service", vi: "dùng dịch vụ siêu âm chẩn đoán hình ảnh" },
          { en: "call vet advice hotline service", vi: "gọi đến tổng đài tư vấn thú y" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "describe severe vomiting and fatigue", vi: "mô tả triệu chứng nôn mửa và mệt mỏi li bì" },
          { en: "explain persistent skin scratching issue", vi: "giải thích tình trạng gãi ngứa da liên tục" },
          { en: "identify dangerous swallowed foreign object", vi: "xác định vật thể lạ nguy hiểm do nuốt phải" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "record daily meal and water intake", vi: "ghi lại lượng thức ăn và nước uống hằng ngày" },
          { en: "monitor pet bowel movements closely", vi: "theo dõi sát sao việc tiêu hóa của con vật" },
          { en: "isolate sick pet from other animals", vi: "cách ly con vật bị ốm khỏi các thú nuôi khác" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "keep medical history booklet available", vi: "chuẩn bị sẵn sổ theo dõi sức khỏe thú cưng" },
          { en: "ask if overnight boarding is available", vi: "hỏi xem có dịch vụ lưu chuồng qua đêm không" },
          { en: "check available pain relief medications", vi: "kiểm tra các loại thuốc giảm đau sẵn có" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Describing pet symptoms. Respond naturally to the user.",
    tags: ["pets-vet","daily-life"]
  },
  {
    id: "daily-vet-03",
    category: 'daily_situations',
    subcategory: 'pets_vet',
    level: "A2",
    titleEn: "Buying pet food/supplies",
    titleVi: "Mua thức ăn/đồ dùng cho thú cưng",
    icon: "🥫",
    situationVi: "Bạn đang trong tình huống: Mua thức ăn/đồ dùng cho thú cưng. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for buying pet food/supplies.", textVi: "Chào, tôi ở đây để mua thức ăn/đồ dùng cho thú cưng." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "assist",
        ipa: "/əˈsɪst/",
        partOfSpeech: "v.",
        meaningVi: "hỗ trợ",
        exampleEn: "I can assist you.",
        exampleVi: "Tôi có thể hỗ trợ bạn.",
        associatedActions: [
          { en: "assist customer in carrying heavy kibble bag", vi: "hỗ trợ khách xách bao thức ăn hạt nặng" },
          { en: "help select appropriate puppy harness", vi: "giúp chọn dây dắt ngực phù hợp cho cún con" },
          { en: "recommend nutritional supplements", vi: "tư vấn thực phẩm chức năng bổ sung dinh dưỡng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "subscribe to monthly pet food delivery", vi: "đăng ký dịch vụ giao thức ăn thú cưng định kỳ" },
          { en: "use pet tag engraving service", vi: "sử dụng dịch vụ khắc thẻ tên thú cưng" },
          { en: "enjoy store loyalty discount service", vi: "hưởng quyền lợi chương trình tích điểm thành viên" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "solve grain allergy digestive issues", vi: "giải quyết vấn đề tiêu hóa do dị ứng ngũ cốc" },
          { en: "exchange chewed chew-toy issue", vi: "đổi đồ chơi bị gặm rách do lỗi đường may" },
          { en: "prevent pet dental tartar buildup", vi: "ngăn ngừa sự cố tích tụ cao răng ở thú cưng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "check ingredient labels for protein percentage", vi: "đọc bảng thành phần để xem hàm lượng đạm" },
          { en: "measure pet neck size with tape", vi: "đo kích thước vòng cổ của thú cưng bằng thước dây" },
          { en: "transition slowly to new food formula", vi: "chuyển đổi thức ăn mới từ từ theo công thức" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "verify if hypoallergenic formula is available", vi: "xác nhận loại thức ăn chống dị ứng có sẵn không" },
          { en: "check available cat litter varieties", vi: "kiểm tra các loại cát vệ sinh cho mèo còn hàng" },
          { en: "browse available scratching posts", vi: "xem qua các mẫu bàn cào móng đang có sẵn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Buying pet food/supplies. Respond naturally to the user.",
    tags: ["pets-vet","daily-life"]
  },
  {
    id: "daily-vet-04",
    category: 'daily_situations',
    subcategory: 'pets_vet',
    level: "A2",
    titleEn: "Pet grooming appointment",
    titleVi: "Hẹn chải chuốt cho thú cưng",
    icon: "✂️",
    situationVi: "Bạn đang trong tình huống: Hẹn chải chuốt cho thú cưng. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for pet grooming appointment.", textVi: "Chào, tôi ở đây để hẹn chải chuốt cho thú cưng." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "assist",
        ipa: "/əˈsɪst/",
        partOfSpeech: "v.",
        meaningVi: "hỗ trợ",
        exampleEn: "I can assist you.",
        exampleVi: "Tôi có thể hỗ trợ bạn.",
        associatedActions: [
          { en: "assist groomer during bath and blow-dry", vi: "hỗ trợ thợ chăm sóc khi tắm và sấy lông" },
          { en: "help untangle fur matted knots", vi: "giúp gỡ các búi lông bị rối" },
          { en: "assist nervous dog with gentle petting", vi: "xoa dịu chú cún căng thẳng bằng cách vuốt ve" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "book professional pet spa haircut service", vi: "đặt gói dịch vụ cắt tỉa lông thú cưng chuyên nghiệp" },
          { en: "request nail trimming and ear cleaning", vi: "yêu cầu cắt móng và vệ sinh tai" },
          { en: "choose gentle herbal shampoo service", vi: "chọn dịch vụ tắm bằng dầu gội thảo mộc dịu nhẹ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "handle sensitive skin rash issues", vi: "xử lý các vấn đề mẩn đỏ trên da nhạy cảm" },
          { en: "treat overgrown curved claw issues", vi: "xử lý sự cố móng vuốt quá dài quặp vào đệm chân" },
          { en: "prevent post-grooming ear irritation", vi: "phòng ngừa kích ứng tai sau khi vệ sinh" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "brush coat thoroughly before washing", vi: "chải lông kỹ lưỡng trước khi tắm" },
          { en: "rinse with lukewarm water gently", vi: "xả sạch bằng nước ấm một cách nhẹ nhàng" },
          { en: "style fur with electric clippers and shears", vi: "tạo kiểu lông bằng tông đơ và kéo chuyên dụng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check if weekend grooming slots are available", vi: "hỏi xem còn lịch chăm sóc thú cưng cuối tuần không" },
          { en: "confirm hypoallergenic conditioner is available", vi: "xác nhận có sẵn dầu xả dành cho da nhạy cảm" },
          { en: "pick up pet when ready and available", vi: "đến đón thú cưng ngay khi xong việc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Pet grooming appointment. Respond naturally to the user.",
    tags: ["pets-vet","daily-life"]
  },
  {
    id: "daily-vet-05",
    category: 'daily_situations',
    subcategory: 'pets_vet',
    level: "B1",
    titleEn: "Pet adoption/rescue",
    titleVi: "Nhận nuôi/cứu hộ thú cưng",
    icon: "🏡",
    situationVi: "Bạn đang trong tình huống: Nhận nuôi/cứu hộ thú cưng. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for pet adoption/rescue.", textVi: "Chào, tôi ở đây để nhận nuôi/cứu hộ thú cưng." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "assist",
        ipa: "/əˈsɪst/",
        partOfSpeech: "v.",
        meaningVi: "hỗ trợ",
        exampleEn: "I can assist you.",
        exampleVi: "Tôi có thể hỗ trợ bạn.",
        associatedActions: [
          { en: "assist shelter staff with feeding animals", vi: "hỗ trợ nhân viên trạm cứu hộ cho thú ăn" },
          { en: "help walk rescue dogs daily", vi: "giúp dắt chó cứu hộ đi dạo mỗi ngày" },
          { en: "assist prospective foster families", vi: "hỗ trợ các gia đình có nguyện vọng nhận nuôi tạm thời" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "service",
        ipa: "/ˈsɜːrvɪs/",
        partOfSpeech: "n.",
        meaningVi: "dịch vụ",
        exampleEn: "Excellent service.",
        exampleVi: "Dịch vụ xuất sắc.",
        associatedActions: [
          { en: "support local animal rescue service", vi: "ủng hộ dịch vụ cứu trợ động vật địa phương" },
          { en: "offer free pet sterilization service", vi: "cung cấp dịch vụ triệt sản thú cưng miễn phí" },
          { en: "provide behavioral training support service", vi: "cung cấp dịch vụ hỗ trợ huấn luyện hành vi" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "rehabilitate animals with past trauma", vi: "phục hồi tâm lý cho thú từng bị bỏ rơi" },
          { en: "resolve pet separation anxiety issues", vi: "khắc phục chứng lo âu khi xa chủ của thú cưng" },
          { en: "solve pet barking behavior issues", vi: "khắc phục các vấn đề thú cưng sủa nhiều" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "fill out pet adoption questionnaire", vi: "điền bảng câu hỏi đăng ký nhận nuôi thú cưng" },
          { en: "complete home safety inspection check", vi: "hoàn tất bước khảo sát an toàn tại nhà" },
          { en: "sign legally binding adoption agreement", vi: "ký cam kết nhận nuôi có giá trị pháp lý" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "meet all pets available for adoption", vi: "gặp gỡ tất cả các bé thú cưng đang chờ nhận nuôi" },
          { en: "check if cat playrooms are available to visit", vi: "hỏi xem phòng chơi của mèo có mở cửa đón khách không" },
          { en: "ensure safe sleeping area is available at home", vi: "chuẩn bị sẵn chỗ ngủ an toàn và ấm cúng tại nhà" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "Could you help me with this?", meaningVi: "Bạn có thể giúp tôi việc này không?" },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Pet adoption/rescue. Respond naturally to the user.",
    tags: ["pets-vet","daily-life"]
  }
];
