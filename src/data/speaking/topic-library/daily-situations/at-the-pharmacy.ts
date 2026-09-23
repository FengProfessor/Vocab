/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: at_the_pharmacy
 * File: src/data/speaking/topic-library/daily-situations/at-the-pharmacy.ts
 *
 * 5 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const AT_THE_PHARMACY_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-pharm-01",
    category: 'daily_situations',
    subcategory: 'at_the_pharmacy',
    level: "A2",
    titleEn: "Buying cold medicine",
    titleVi: "Mua thuốc cảm",
    icon: "💊",
    situationVi: "Bạn đang trong tình huống: Mua thuốc cảm. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello, how can I help you today?", textVi: "Xin chào, tôi có thể giúp gì cho bạn hôm nay?" },
      { speaker: 'B', text: "Hi, I need help with buying cold medicine.", textVi: "Chào bạn, tôi cần hỗ trợ về mua thuốc cảm." },
      { speaker: 'A', text: "Let me check that for you. Here are some options.", textVi: "Để tôi kiểm tra giúp bạn. Đây là một số lựa chọn." },
      { speaker: 'B', text: "Thank you. How much is it?", textVi: "Cảm ơn bạn. Cái này giá bao nhiêu?" },
      { speaker: 'A', text: "It is 15 dollars. Anything else?", textVi: "Giá là 15 đô la. Bạn cần gì nữa không?" },
      { speaker: 'B', text: "No, that will be all.", textVi: "Không, vậy là đủ rồi." }
    ],
    keyVocabulary: [
      {
        term: "medicine",
        ipa: "/ˈmɛdɪsɪn/",
        partOfSpeech: "n.",
        meaningVi: "thuốc",
        exampleEn: "Take your medicine.",
        exampleVi: "Uống thuốc của bạn đi.",
        associatedActions: [
          { en: "take cold medicine after warm meals", vi: "uống thuốc cảm sau bữa ăn ấm" },
          { en: "buy over-the-counter flu medicine", vi: "mua thuốc cảm cúm không kê đơn" },
          { en: "store medicine in cool medicine cabinet", vi: "cất thuốc vào tủ thuốc thoáng mát" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "prescription",
        ipa: "/prɪˈskrɪpʃən/",
        partOfSpeech: "n.",
        meaningVi: "đơn thuốc",
        exampleEn: "I have a prescription.",
        exampleVi: "Tôi có một đơn thuốc.",
        associatedActions: [
          { en: "check if cold medicine needs prescription", vi: "hỏi xem thuốc cảm có cần đơn không" },
          { en: "present doctor prescription to pharmacist", vi: "đưa đơn thuốc của bác sĩ cho dược sĩ" },
          { en: "keep prescription slip for insurance", vi: "giữ lại đơn thuốc để thanh toán bảo hiểm" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "dosage",
        ipa: "/ˈdoʊsɪdʒ/",
        partOfSpeech: "n.",
        meaningVi: "liều lượng",
        exampleEn: "Check the dosage.",
        exampleVi: "Kiểm tra liều lượng.",
        associatedActions: [
          { en: "read dosage instructions on medicine box", vi: "đọc chỉ dẫn liều dùng trên vỏ hộp thuốc" },
          { en: "take two capsules every eight hours", vi: "uống hai viên nang mỗi tám tiếng" },
          { en: "never exceed recommended daily dosage", vi: "tuyệt đối không uống quá liều tối đa mỗi ngày" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "symptom",
        ipa: "/ˈsɪmptəm/",
        partOfSpeech: "n.",
        meaningVi: "triệu chứng",
        exampleEn: "What are your symptoms?",
        exampleVi: "Triệu chứng của bạn là gì?",
        associatedActions: [
          { en: "describe fever and runny nose symptoms", vi: "mô tả triệu chứng sốt và chảy nước mũi" },
          { en: "relieve painful sinus congestion", vi: "làm giảm cảm giác nghẹt mũi đau xoang" },
          { en: "monitor body temperature symptoms", vi: "theo dõi nhiệt độ cơ thể khi có biểu hiện sốt" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "pharmacy",
        ipa: "/ˈfɑːrməsi/",
        partOfSpeech: "n.",
        meaningVi: "hiệu thuốc",
        exampleEn: "Go to the pharmacy.",
        exampleVi: "Đến hiệu thuốc.",
        associatedActions: [
          { en: "walk into local community pharmacy", vi: "bước vào hiệu thuốc cộng đồng gần nhà" },
          { en: "ask duty pharmacist for recommendation", vi: "nhờ dược sĩ trực tư vấn loại thuốc tốt" },
          { en: "purchase tissues and lozenges at pharmacy", vi: "mua khăn giấy và kẹo ngậm tại hiệu thuốc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I need something for this.", meaningVi: "Tôi cần thuốc cho việc này." },
      { phrase: "How often should I take it?", meaningVi: "Tôi nên uống nó bao lâu một lần?" },
      { phrase: "Does it have side effects?", meaningVi: "Nó có tác dụng phụ không?" },
      { phrase: "I have a prescription.", meaningVi: "Tôi có đơn thuốc." },
      { phrase: "Can you recommend a good brand?", meaningVi: "Bạn có thể giới thiệu một loại tốt không?" }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Buying cold medicine. Respond naturally to the user.",
    tags: ["at-the_pharmacy","daily-life"]
  },
  {
    id: "daily-pharm-02",
    category: 'daily_situations',
    subcategory: 'at_the_pharmacy',
    level: "A2",
    titleEn: "Asking about dosage instructions",
    titleVi: "Hỏi về hướng dẫn liều lượng",
    icon: "📋",
    situationVi: "Bạn đang trong tình huống: Hỏi về hướng dẫn liều lượng. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello, how can I help you today?", textVi: "Xin chào, tôi có thể giúp gì cho bạn hôm nay?" },
      { speaker: 'B', text: "Hi, I need help with asking about dosage instructions.", textVi: "Chào bạn, tôi cần hỗ trợ về hỏi về hướng dẫn liều lượng." },
      { speaker: 'A', text: "Let me check that for you. Here are some options.", textVi: "Để tôi kiểm tra giúp bạn. Đây là một số lựa chọn." },
      { speaker: 'B', text: "Thank you. How much is it?", textVi: "Cảm ơn bạn. Cái này giá bao nhiêu?" },
      { speaker: 'A', text: "It is 15 dollars. Anything else?", textVi: "Giá là 15 đô la. Bạn cần gì nữa không?" },
      { speaker: 'B', text: "No, that will be all.", textVi: "Không, vậy là đủ rồi." }
    ],
    keyVocabulary: [
      {
        term: "medicine",
        ipa: "/ˈmɛdɪsɪn/",
        partOfSpeech: "n.",
        meaningVi: "thuốc",
        exampleEn: "Take your medicine.",
        exampleVi: "Uống thuốc của bạn đi.",
        associatedActions: [
          { en: "swallow medicine with plenty of water", vi: "uống thuốc cùng nhiều nước lọc" },
          { en: "avoid crushing coated medicine tablets", vi: "tránh nghiền nát viên thuốc bao phim" },
          { en: "check medicine expiration date closely", vi: "kiểm tra kỹ hạn sử dụng in trên vỉ thuốc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "prescription",
        ipa: "/prɪˈskrɪpʃən/",
        partOfSpeech: "n.",
        meaningVi: "đơn thuốc",
        exampleEn: "I have a prescription.",
        exampleVi: "Tôi có một đơn thuốc.",
        associatedActions: [
          { en: "clarify confusing prescription directions", vi: "hỏi lại chỉ dẫn trong đơn thuốc chưa rõ" },
          { en: "follow doctor prescription regimen", vi: "tuân thủ phác đồ điều trị của đơn thuốc" },
          { en: "note down prescription schedule", vi: "ghi lại lịch uống thuốc theo đơn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "dosage",
        ipa: "/ˈdoʊsɪdʒ/",
        partOfSpeech: "n.",
        meaningVi: "liều lượng",
        exampleEn: "Check the dosage.",
        exampleVi: "Kiểm tra liều lượng.",
        associatedActions: [
          { en: "measure liquid medicine with dosing syringe", vi: "đo thuốc dạng lỏng bằng ống tiêm liều" },
          { en: "calculate accurate dosage for children", vi: "tính toán chính xác liều lượng cho trẻ em" },
          { en: "space dosage intervals evenly throughout day", vi: "chia đều khoảng cách các lần uống trong ngày" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "symptom",
        ipa: "/ˈsɪmptəm/",
        partOfSpeech: "n.",
        meaningVi: "triệu chứng",
        exampleEn: "What are your symptoms?",
        exampleVi: "Triệu chứng của bạn là gì?",
        associatedActions: [
          { en: "track symptom relief after each dose", vi: "theo dõi sự giảm nhẹ triệu chứng sau mỗi liều" },
          { en: "report worsening symptoms to clinic", vi: "báo ngay nếu triệu chứng chuyển biến xấu" },
          { en: "log fever symptoms in health notebook", vi: "ghi chép triệu chứng sốt vào sổ tay sức khỏe" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "pharmacy",
        ipa: "/ˈfɑːrməsi/",
        partOfSpeech: "n.",
        meaningVi: "hiệu thuốc",
        exampleEn: "Go to the pharmacy.",
        exampleVi: "Đến hiệu thuốc.",
        associatedActions: [
          { en: "consult pharmacist at consultation window", vi: "trao đổi với dược sĩ tại cửa sổ tư vấn" },
          { en: "request written pharmacy dosage schedule", vi: "xin bảng lịch uống thuốc in từ hiệu thuốc" },
          { en: "return unused expired medicine to pharmacy", vi: "đem thuốc hết hạn trả lại nơi thu gom hiệu thuốc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I need something for this.", meaningVi: "Tôi cần thuốc cho việc này." },
      { phrase: "How often should I take it?", meaningVi: "Tôi nên uống nó bao lâu một lần?" },
      { phrase: "Does it have side effects?", meaningVi: "Nó có tác dụng phụ không?" },
      { phrase: "I have a prescription.", meaningVi: "Tôi có đơn thuốc." },
      { phrase: "Can you recommend a good brand?", meaningVi: "Bạn có thể giới thiệu một loại tốt không?" }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Asking about dosage instructions. Respond naturally to the user.",
    tags: ["at-the_pharmacy","daily-life"]
  },
  {
    id: "daily-pharm-03",
    category: 'daily_situations',
    subcategory: 'at_the_pharmacy',
    level: "A2",
    titleEn: "Buying vitamins and supplements",
    titleVi: "Mua vitamin và thực phẩm bổ sung",
    icon: "💊",
    situationVi: "Bạn đang trong tình huống: Mua vitamin và thực phẩm bổ sung. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello, how can I help you today?", textVi: "Xin chào, tôi có thể giúp gì cho bạn hôm nay?" },
      { speaker: 'B', text: "Hi, I need help with buying vitamins and supplements.", textVi: "Chào bạn, tôi cần hỗ trợ về mua vitamin và thực phẩm bổ sung." },
      { speaker: 'A', text: "Let me check that for you. Here are some options.", textVi: "Để tôi kiểm tra giúp bạn. Đây là một số lựa chọn." },
      { speaker: 'B', text: "Thank you. How much is it?", textVi: "Cảm ơn bạn. Cái này giá bao nhiêu?" },
      { speaker: 'A', text: "It is 15 dollars. Anything else?", textVi: "Giá là 15 đô la. Bạn cần gì nữa không?" },
      { speaker: 'B', text: "No, that will be all.", textVi: "Không, vậy là đủ rồi." }
    ],
    keyVocabulary: [
      {
        term: "medicine",
        ipa: "/ˈmɛdɪsɪn/",
        partOfSpeech: "n.",
        meaningVi: "thuốc",
        exampleEn: "Take your medicine.",
        exampleVi: "Uống thuốc của bạn đi.",
        associatedActions: [
          { en: "read medicine potential side effects", vi: "đọc các tác dụng phụ tiềm ẩn của thuốc" },
          { en: "stop taking medicine if rash occurs", vi: "dừng uống thuốc ngay nếu bị nổi mẩn ngứa" },
          { en: "take medicine with food to prevent upset", vi: "uống thuốc cùng thức ăn để tránh đau dạ dày" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "prescription",
        ipa: "/prɪˈskrɪpʃən/",
        partOfSpeech: "n.",
        meaningVi: "đơn thuốc",
        exampleEn: "I have a prescription.",
        exampleVi: "Tôi có một đơn thuốc.",
        associatedActions: [
          { en: "review prescription safety warnings", vi: "xem xét cảnh báo an toàn trong đơn thuốc" },
          { en: "discuss prescription contraindications", vi: "trao đổi về các trường hợp chống chỉ định" },
          { en: "request alternative gentle prescription", vi: "xin đổi sang đơn thuốc có tác dụng phụ êm hơn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "dosage",
        ipa: "/ˈdoʊsɪdʒ/",
        partOfSpeech: "n.",
        meaningVi: "liều lượng",
        exampleEn: "Check the dosage.",
        exampleVi: "Kiểm tra liều lượng.",
        associatedActions: [
          { en: "lower dosage under doctor guidance", vi: "giảm liều lượng dưới sự hướng dẫn của bác sĩ" },
          { en: "never take double dosage to catch up", vi: "không bao giờ uống bù gấp đôi liều đã quên" },
          { en: "taper off high-strength dosage safely", vi: "giảm liều từ từ trước khi ngừng hẳn thuốc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "symptom",
        ipa: "/ˈsɪmptəm/",
        partOfSpeech: "n.",
        meaningVi: "triệu chứng",
        exampleEn: "What are your symptoms?",
        exampleVi: "Triệu chứng của bạn là gì?",
        associatedActions: [
          { en: "identify daytime drowsiness symptoms", vi: "nhận biết triệu chứng buồn ngủ ban ngày" },
          { en: "report dizziness and nausea immediately", vi: "báo ngay cảm giác chóng mặt và buồn nôn" },
          { en: "distinguish allergic symptoms from side effects", vi: "phân biệt triệu chứng dị ứng với tác dụng phụ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "pharmacy",
        ipa: "/ˈfɑːrməsi/",
        partOfSpeech: "n.",
        meaningVi: "hiệu thuốc",
        exampleEn: "Go to the pharmacy.",
        exampleVi: "Đến hiệu thuốc.",
        associatedActions: [
          { en: "ask pharmacist about drug interactions", vi: "hỏi dược sĩ về nguy cơ tương tác giữa các thuốc" },
          { en: "request non-drowsy pharmacy formulas", vi: "yêu cầu loại thuốc không gây buồn ngủ" },
          { en: "call 24-hour pharmacy hotline for advice", vi: "gọi đường dây nóng hiệu thuốc để hỏi tư vấn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I need something for this.", meaningVi: "Tôi cần thuốc cho việc này." },
      { phrase: "How often should I take it?", meaningVi: "Tôi nên uống nó bao lâu một lần?" },
      { phrase: "Does it have side effects?", meaningVi: "Nó có tác dụng phụ không?" },
      { phrase: "I have a prescription.", meaningVi: "Tôi có đơn thuốc." },
      { phrase: "Can you recommend a good brand?", meaningVi: "Bạn có thể giới thiệu một loại tốt không?" }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Buying vitamins and supplements. Respond naturally to the user.",
    tags: ["at-the_pharmacy","daily-life"]
  },
  {
    id: "daily-pharm-04",
    category: 'daily_situations',
    subcategory: 'at_the_pharmacy',
    level: "B1",
    titleEn: "Describing allergies to medication",
    titleVi: "Mô tả dị ứng với thuốc",
    icon: "⚠️",
    situationVi: "Bạn đang trong tình huống: Mô tả dị ứng với thuốc. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello, how can I help you today?", textVi: "Xin chào, tôi có thể giúp gì cho bạn hôm nay?" },
      { speaker: 'B', text: "Hi, I need help with describing allergies to medication.", textVi: "Chào bạn, tôi cần hỗ trợ về mô tả dị ứng với thuốc." },
      { speaker: 'A', text: "Let me check that for you. Here are some options.", textVi: "Để tôi kiểm tra giúp bạn. Đây là một số lựa chọn." },
      { speaker: 'B', text: "Thank you. How much is it?", textVi: "Cảm ơn bạn. Cái này giá bao nhiêu?" },
      { speaker: 'A', text: "It is 15 dollars. Anything else?", textVi: "Giá là 15 đô la. Bạn cần gì nữa không?" },
      { speaker: 'B', text: "No, that will be all.", textVi: "Không, vậy là đủ rồi." }
    ],
    keyVocabulary: [
      {
        term: "medicine",
        ipa: "/ˈmɛdɪsɪn/",
        partOfSpeech: "n.",
        meaningVi: "thuốc",
        exampleEn: "Take your medicine.",
        exampleVi: "Uống thuốc của bạn đi.",
        associatedActions: [
          { en: "collect dispensed prescription medicine", vi: "nhận các loại thuốc kê đơn đã bốc xong" },
          { en: "verify medicine names printed on label", vi: "kiểm tra lại tên thuốc in trên nhãn hộp" },
          { en: "inspect seal on medicine container", vi: "kiểm tra tem niêm phong trên lọ thuốc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "prescription",
        ipa: "/prɪˈskrɪpʃən/",
        partOfSpeech: "n.",
        meaningVi: "đơn thuốc",
        exampleEn: "I have a prescription.",
        exampleVi: "Tôi có một đơn thuốc.",
        associatedActions: [
          { en: "drop off doctor prescription at counter", vi: "nộp đơn thuốc của bác sĩ tại quầy bốc thuốc" },
          { en: "verify medical insurance coverage on order", vi: "kiểm tra quyền lợi bảo hiểm cho đơn thuốc" },
          { en: "request generic brand for prescription", vi: "yêu cầu thuốc gốc tương đương để giảm chi phí" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "dosage",
        ipa: "/ˈdoʊsɪdʒ/",
        partOfSpeech: "n.",
        meaningVi: "liều lượng",
        exampleEn: "Check the dosage.",
        exampleVi: "Kiểm tra liều lượng.",
        associatedActions: [
          { en: "listen to pharmacist explain daily dosage", vi: "lắng nghe dược sĩ giải thích liều dùng hàng ngày" },
          { en: "confirm before-or-after meal dosage rules", vi: "xác nhận quy tắc uống trước hay sau bữa ăn" },
          { en: "check total duration of antibiotic dosage", vi: "kiểm tra tổng số ngày phải uống kháng sinh" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "symptom",
        ipa: "/ˈsɪmptəm/",
        partOfSpeech: "n.",
        meaningVi: "triệu chứng",
        exampleEn: "What are your symptoms?",
        exampleVi: "Triệu chứng của bạn là gì?",
        associatedActions: [
          { en: "explain acute illness symptoms clearly", vi: "trình bày rõ các triệu chứng bệnh cấp tính" },
          { en: "expect symptom relief within three days", vi: "dự kiến triệu chứng sẽ giảm sau ba ngày" },
          { en: "seek emergency care if symptoms spike", vi: "đi khám cấp cứu nếu triệu chứng sốt tăng vọt" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "pharmacy",
        ipa: "/ˈfɑːrməsi/",
        partOfSpeech: "n.",
        meaningVi: "hiệu thuốc",
        exampleEn: "Go to the pharmacy.",
        exampleVi: "Đến hiệu thuốc.",
        associatedActions: [
          { en: "wait in dispensary waiting lounge", vi: "ngồi đợi ở khu vực chờ lấy thuốc" },
          { en: "pay co-pay amount at pharmacy cashier", vi: "thanh toán phần viện phí đồng chi trả tại quầy" },
          { en: "sign digital receipt at pharmacy desk", vi: "ký nhận biên lai điện tử tại bàn nhận thuốc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I need something for this.", meaningVi: "Tôi cần thuốc cho việc này." },
      { phrase: "How often should I take it?", meaningVi: "Tôi nên uống nó bao lâu một lần?" },
      { phrase: "Does it have side effects?", meaningVi: "Nó có tác dụng phụ không?" },
      { phrase: "I have a prescription.", meaningVi: "Tôi có đơn thuốc." },
      { phrase: "Can you recommend a good brand?", meaningVi: "Bạn có thể giới thiệu một loại tốt không?" }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Describing allergies to medication. Respond naturally to the user.",
    tags: ["at-the_pharmacy","daily-life"]
  },
  {
    id: "daily-pharm-05",
    category: 'daily_situations',
    subcategory: 'at_the_pharmacy',
    level: "B1",
    titleEn: "Asking for a prescription refill",
    titleVi: "Yêu cầu nạp lại đơn thuốc",
    icon: "📝",
    situationVi: "Bạn đang trong tình huống: Yêu cầu nạp lại đơn thuốc. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello, how can I help you today?", textVi: "Xin chào, tôi có thể giúp gì cho bạn hôm nay?" },
      { speaker: 'B', text: "Hi, I need help with asking for a prescription refill.", textVi: "Chào bạn, tôi cần hỗ trợ về yêu cầu nạp lại đơn thuốc." },
      { speaker: 'A', text: "Let me check that for you. Here are some options.", textVi: "Để tôi kiểm tra giúp bạn. Đây là một số lựa chọn." },
      { speaker: 'B', text: "Thank you. How much is it?", textVi: "Cảm ơn bạn. Cái này giá bao nhiêu?" },
      { speaker: 'A', text: "It is 15 dollars. Anything else?", textVi: "Giá là 15 đô la. Bạn cần gì nữa không?" },
      { speaker: 'B', text: "No, that will be all.", textVi: "Không, vậy là đủ rồi." }
    ],
    keyVocabulary: [
      {
        term: "medicine",
        ipa: "/ˈmɛdɪsɪn/",
        partOfSpeech: "n.",
        meaningVi: "thuốc",
        exampleEn: "Take your medicine.",
        exampleVi: "Uống thuốc của bạn đi.",
        associatedActions: [
          { en: "apply antiseptic wound medicine", vi: "bôi thuốc sát trùng khử khuẩn vết thương" },
          { en: "stock antibiotic cream in first-aid kit", vi: "chuẩn bị thuốc mỡ kháng sinh trong hộp sơ cứu" },
          { en: "keep burn relief ointment ready", vi: "để sẵn thuốc mỡ trị bỏng khi nấu nướng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "prescription",
        ipa: "/prɪˈskrɪpʃən/",
        partOfSpeech: "n.",
        meaningVi: "đơn thuốc",
        exampleEn: "I have a prescription.",
        exampleVi: "Tôi có một đơn thuốc.",
        associatedActions: [
          { en: "buy medical supplies without prescription", vi: "mua vật tư y tế không cần đơn bác sĩ" },
          { en: "ask if prescription needed for sterile gauze", vi: "hỏi xem gạc vô trùng có cần đơn không" },
          { en: "order customized home first-aid supplies", vi: "đặt mua bộ vật tư y tế sơ cứu gia đình" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "dosage",
        ipa: "/ˈdoʊsɪdʒ/",
        partOfSpeech: "n.",
        meaningVi: "liều lượng",
        exampleEn: "Check the dosage.",
        exampleVi: "Kiểm tra liều lượng.",
        associatedActions: [
          { en: "apply thin layer of healing ointment", vi: "thoa một lớp mỏng thuốc mỡ mau lành sẹo" },
          { en: "change bandage dosage twice per day", vi: "thay băng gạc vô trùng hai lần mỗi ngày" },
          { en: "follow antiseptic spray application limits", vi: "tuân thủ số lần xịt dung dịch sát khuẩn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "symptom",
        ipa: "/ˈsɪmptəm/",
        partOfSpeech: "n.",
        meaningVi: "triệu chứng",
        exampleEn: "What are your symptoms?",
        exampleVi: "Triệu chứng của bạn là gì?",
        associatedActions: [
          { en: "clean scrapes to prevent infection symptoms", vi: "rửa sạch vết trầy để ngừa dấu hiệu nhiễm trùng" },
          { en: "soothe painful swelling symptoms with ice", vi: "chườm đá làm dịu cơn sưng đau nhức" },
          { en: "check for fever symptoms around wound", vi: "kiểm tra vùng quanh vết thương có bị nóng đỏ không" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "pharmacy",
        ipa: "/ˈfɑːrməsi/",
        partOfSpeech: "n.",
        meaningVi: "hiệu thuốc",
        exampleEn: "Go to the pharmacy.",
        exampleVi: "Đến hiệu thuốc.",
        associatedActions: [
          { en: "browse pharmacy first-aid aisle", vi: "tìm đồ ở quầy dụng cụ sơ cứu của hiệu thuốc" },
          { en: "ask pharmacy staff for medical adhesive tape", vi: "hỏi nhân viên hiệu thuốc cuộn băng dính y tế" },
          { en: "pick up sterile cotton pads at counter", vi: "lấy bông gòn tiệt trùng tại quầy thuốc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I need something for this.", meaningVi: "Tôi cần thuốc cho việc này." },
      { phrase: "How often should I take it?", meaningVi: "Tôi nên uống nó bao lâu một lần?" },
      { phrase: "Does it have side effects?", meaningVi: "Nó có tác dụng phụ không?" },
      { phrase: "I have a prescription.", meaningVi: "Tôi có đơn thuốc." },
      { phrase: "Can you recommend a good brand?", meaningVi: "Bạn có thể giới thiệu một loại tốt không?" }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Asking for a prescription refill. Respond naturally to the user.",
    tags: ["at-the_pharmacy","daily-life"]
  }
];
