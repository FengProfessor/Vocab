/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: at_the_hairdresser
 * File: src/data/speaking/topic-library/daily-situations/at-the-hairdresser.ts
 *
 * 5 sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const AT_THE_HAIRDRESSER_ITEMS: TopicLibraryItem[] = [
  {
    id: "daily-hair-01",
    category: 'daily_situations',
    subcategory: 'at_the_hairdresser',
    level: "A2",
    titleEn: "Getting a basic haircut",
    titleVi: "Cắt tóc cơ bản",
    icon: "✂️",
    situationVi: "Bạn đang trong tình huống: Cắt tóc cơ bản. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for getting a basic haircut.", textVi: "Chào, tôi ở đây để cắt tóc cơ bản." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "haircut",
        ipa: "/ˈhɛrkʌt/",
        partOfSpeech: "n.",
        meaningVi: "cắt tóc",
        exampleEn: "Get a haircut.",
        exampleVi: "Đi cắt tóc.",
        associatedActions: [
          { en: "ask for a scissor trim haircut", vi: "yêu cầu tỉa bớt tóc bằng kéo" },
          { en: "wash hair before getting haircut", vi: "gội sạch đầu trước khi cắt tóc" },
          { en: "brush off loose hairs after cut", vi: "phủi sạch tóc vụn sau khi cắt xong" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "style",
        ipa: "/staɪl/",
        partOfSpeech: "n.",
        meaningVi: "kiểu dáng",
        exampleEn: "A new style.",
        exampleVi: "Một kiểu dáng mới.",
        associatedActions: [
          { en: "request a simple everyday style", vi: "yêu cầu một kiểu tóc đơn giản thường ngày" },
          { en: "part hair on the preferred side", vi: "rẽ ngôi tóc sang bên quen thuộc" },
          { en: "comb hair into natural position", vi: "chải tóc vào nếp tự nhiên" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "warn stylist about sensitive scalp", vi: "báo với thợ da đầu dễ bị nhạy cảm" },
          { en: "fix uneven sideburns quickly", vi: "sửa lại phần tóc mai chưa đều" },
          { en: "avoid cutting top hair too short", vi: "tránh cắt phần đỉnh đầu quá ngắn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "put on waterproof salon cape", vi: "choàng áo choàng cắt tóc chống thấm" },
          { en: "section hair with styling clips", vi: "kẹp chia các tầng tóc gọn gàng" },
          { en: "blow dry hair to check shape", vi: "sấy khô tóc để xem lại phom dáng" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check barber chair availability", vi: "kiểm tra xem ghế cắt tóc còn trống không" },
          { en: "ask if walk-in slots are available", vi: "hỏi xem có chỗ cho khách vãng lai không" },
          { en: "wait in salon reception area", vi: "ngồi đợi ở khu vực chờ của tiệm tóc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I would like a haircut.", meaningVi: "Tôi muốn cắt tóc." },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Getting a basic haircut. Respond naturally to the user.",
    tags: ["at-the_hairdresser","daily-life"]
  },
  {
    id: "daily-hair-02",
    category: 'daily_situations',
    subcategory: 'at_the_hairdresser',
    level: "A2",
    titleEn: "Asking for a specific style",
    titleVi: "Yêu cầu một kiểu tóc cụ thể",
    icon: "💇",
    situationVi: "Bạn đang trong tình huống: Yêu cầu một kiểu tóc cụ thể. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for asking for a specific style.", textVi: "Chào, tôi ở đây để yêu cầu một kiểu tóc cụ thể." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "haircut",
        ipa: "/ˈhɛrkʌt/",
        partOfSpeech: "n.",
        meaningVi: "cắt tóc",
        exampleEn: "Get a haircut.",
        exampleVi: "Đi cắt tóc.",
        associatedActions: [
          { en: "request layered bob haircut", vi: "yêu cầu cắt kiểu tóc bob tỉa layer" },
          { en: "taper the neckline with clippers", vi: "cạo tỉa gọn gàng chân gáy bằng tông đơ" },
          { en: "texturize heavy thick hair ends", vi: "tỉa mỏng bớt phần đuôi tóc dày" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "style",
        ipa: "/staɪl/",
        partOfSpeech: "n.",
        meaningVi: "kiểu dáng",
        exampleEn: "A new style.",
        exampleVi: "Một kiểu dáng mới.",
        associatedActions: [
          { en: "show photo of desired hairstyle", vi: "cho thợ xem bức ảnh mẫu tóc ưng ý" },
          { en: "apply styling pomade to hair", vi: "vuốt sáp tạo nếp giữ phom cho tóc" },
          { en: "sculpt modern textured crop style", vi: "tạo kiểu tóc crop ngắn phong cách" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "address frizzy hair concerns", vi: "khắc phục tình trạng tóc bị xơ rối" },
          { en: "correct asymmetrical hair lengths", vi: "chỉnh lại độ dài tóc hai bên bất đối xứng" },
          { en: "advise against unsuitable cut styles", vi: "khuyên không nên cắt kiểu không hợp mặt" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "consult stylist on face shape", vi: "nghe thợ tư vấn kiểu tóc hợp gương mặt" },
          { en: "use thinning shears on thick hair", vi: "dùng kéo tỉa răng cưa làm mỏng tóc" },
          { en: "hold handheld mirror to check back", vi: "cầm gương soi kiểm tra phần gáy phía sau" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "book top stylist appointment", vi: "đặt hẹn thợ cắt tóc tay nghề cao" },
          { en: "check available weekend morning slots", vi: "kiểm tra các suất hẹn sáng cuối tuần" },
          { en: "confirm styling wax is in stock", vi: "xác nhận sáp tạo kiểu còn hàng tại quầy" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I would like a haircut.", meaningVi: "Tôi muốn cắt tóc." },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Asking for a specific style. Respond naturally to the user.",
    tags: ["at-the_hairdresser","daily-life"]
  },
  {
    id: "daily-hair-03",
    category: 'daily_situations',
    subcategory: 'at_the_hairdresser',
    level: "A2",
    titleEn: "Hair coloring/dyeing",
    titleVi: "Nhuộm tóc",
    icon: "🎨",
    situationVi: "Bạn đang trong tình huống: Nhuộm tóc. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for hair coloring/dyeing.", textVi: "Chào, tôi ở đây để nhuộm tóc." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "haircut",
        ipa: "/ˈhɛrkʌt/",
        partOfSpeech: "n.",
        meaningVi: "cắt tóc",
        exampleEn: "Get a haircut.",
        exampleVi: "Đi cắt tóc.",
        associatedActions: [
          { en: "trim split ends before hair coloring", vi: "tỉa ngọn tóc chẻ trước khi nhuộm" },
          { en: "shape bangs to complement color", vi: "tỉa tóc mái cho tôn màu nhuộm mới" },
          { en: "cut away dry over-processed ends", vi: "cắt bỏ phần đuôi tóc khô xơ do hóa chất" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "style",
        ipa: "/staɪl/",
        partOfSpeech: "n.",
        meaningVi: "kiểu dáng",
        exampleEn: "A new style.",
        exampleVi: "Một kiểu dáng mới.",
        associatedActions: [
          { en: "choose balayage highlight tones", vi: "chọn tông màu nhuộm gẩy sợi balayage" },
          { en: "apply gloss toner for shiny finish", vi: "ủ dầu bóng tạo ánh màu rực rỡ" },
          { en: "style soft waves with curling wand", vi: "uốn lọn xoăn bồng bềnh bằng máy nhiệt" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "perform skin allergy patch test", vi: "thử phản ứng thuốc nhuộm trên da" },
          { en: "prevent scalp tingling and redness", vi: "ngừa rát đỏ và châm chích da đầu" },
          { en: "correct brassy orange undertones", vi: "khử ánh cam và sắc vàng cháy của tóc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "brush dye mixture evenly from roots", vi: "quét thuốc nhuộm đều từ chân tóc" },
          { en: "wrap colored strands in foil sheets", vi: "bọc các lọn tóc nhuộm vào giấy bạc" },
          { en: "rinse color with cold water wash", vi: "xả sạch thuốc nhuộm bằng nước mát" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check color swatch book availability", vi: "xem bảng màu nhuộm mẫu có sẵn" },
          { en: "verify bleach-free dye availability", vi: "kiểm tra xem có thuốc nhuộm không tẩy không" },
          { en: "reserve three-hour dyeing block", vi: "đặt trước khung giờ ba tiếng để nhuộm tóc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I would like a haircut.", meaningVi: "Tôi muốn cắt tóc." },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Hair coloring/dyeing. Respond naturally to the user.",
    tags: ["at-the_hairdresser","daily-life"]
  },
  {
    id: "daily-hair-04",
    category: 'daily_situations',
    subcategory: 'at_the_hairdresser',
    level: "B1",
    titleEn: "Complaining about a bad haircut",
    titleVi: "Phàn nàn về một kiểu tóc hỏng",
    icon: "😠",
    situationVi: "Bạn đang trong tình huống: Phàn nàn về một kiểu tóc hỏng. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for complaining about a bad haircut.", textVi: "Chào, tôi ở đây để phàn nàn về một kiểu tóc hỏng." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "haircut",
        ipa: "/ˈhɛrkʌt/",
        partOfSpeech: "n.",
        meaningVi: "cắt tóc",
        exampleEn: "Get a haircut.",
        exampleVi: "Đi cắt tóc.",
        associatedActions: [
          { en: "prep damp hair for precise haircut", vi: "làm ẩm tóc sẵn sàng để cắt chính xác" },
          { en: "clean up hairline after blow-dry", vi: "tỉa lại đường viền tóc sau khi sấy khô" },
          { en: "check cut balance under salon lights", vi: "kiểm tra độ cân đối của tóc dưới ánh đèn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "style",
        ipa: "/staɪl/",
        partOfSpeech: "n.",
        meaningVi: "kiểu dáng",
        exampleEn: "A new style.",
        exampleVi: "Một kiểu dáng mới.",
        associatedActions: [
          { en: "blow-dry with large round barrel brush", vi: "sấy tóc bằng lược tròn cỡ lớn" },
          { en: "spray thermal heat protectant mist", vi: "xịt dưỡng chất chống nhiệt bảo vệ tóc" },
          { en: "finish with flexible hold hairspray", vi: "xịt keo định hình giữ nếp mềm mại" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "adjust water basin temperature", vi: "điều chỉnh nhiệt độ vòi nước bồn gội" },
          { en: "avoid direct hot air on ear skin", vi: "tránh thổi hơi sấy nóng trực tiếp vào tai" },
          { en: "prevent shampoo splashing into eyes", vi: "tránh để bọt dầu gội bắn vào mắt" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "massage scalp with lathered shampoo", vi: "mát-xa da đầu với bọt dầu gội" },
          { en: "apply deep conditioning hair mask", vi: "ủ kem dưỡng phục hồi tóc chuyên sâu" },
          { en: "towel dry hair gently without rubbing", vi: "thấm khô tóc nhẹ nhàng bằng khăn bông" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "check shampoo basin chair availability", vi: "kiểm tra ghế bồn gội đầu còn trống" },
          { en: "find available high-velocity dryer", vi: "chọn máy sấy tốc độ gió cao có sẵn" },
          { en: "confirm leave-in conditioner stock", vi: "xác nhận còn tinh dầu xả khô dưỡng tóc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I would like a haircut.", meaningVi: "Tôi muốn cắt tóc." },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Complaining about a bad haircut. Respond naturally to the user.",
    tags: ["at-the_hairdresser","daily-life"]
  },
  {
    id: "daily-hair-05",
    category: 'daily_situations',
    subcategory: 'at_the_hairdresser',
    level: "A1",
    titleEn: "Booking an appointment",
    titleVi: "Đặt lịch hẹn",
    icon: "📅",
    situationVi: "Bạn đang trong tình huống: Đặt lịch hẹn. Hãy giao tiếp một cách tự nhiên và hiệu quả.",
    sampleDialogue: [
      { speaker: 'A', text: "Hello there! What can I do for you?", textVi: "Xin chào! Tôi có thể làm gì cho bạn?" },
      { speaker: 'B', text: "Hi, I'm here for booking an appointment.", textVi: "Chào, tôi ở đây để đặt lịch hẹn." },
      { speaker: 'A', text: "I can certainly help with that. Please follow me.", textVi: "Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi." },
      { speaker: 'B', text: "Thank you for your assistance.", textVi: "Cảm ơn sự hỗ trợ của bạn." },
      { speaker: 'A', text: "Is there anything else you need?", textVi: "Bạn còn cần gì nữa không?" },
      { speaker: 'B', text: "No, that is all. Have a good day!", textVi: "Không, vậy là đủ. Chúc một ngày tốt lành!" }
    ],
    keyVocabulary: [
      {
        term: "haircut",
        ipa: "/ˈhɛrkʌt/",
        partOfSpeech: "n.",
        meaningVi: "cắt tóc",
        exampleEn: "Get a haircut.",
        exampleVi: "Đi cắt tóc.",
        associatedActions: [
          { en: "point out uneven parts of haircut", vi: "chỉ ra các chỗ cắt tóc bị lỗi không đều" },
          { en: "request a corrective scissor trim", vi: "yêu cầu thợ sửa lại bằng kéo cho cân" },
          { en: "show where hair was cut too short", vi: "chỉ cho thợ thấy chỗ tóc bị hớt quá ngắn" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "style",
        ipa: "/staɪl/",
        partOfSpeech: "n.",
        meaningVi: "kiểu dáng",
        exampleEn: "A new style.",
        exampleVi: "Một kiểu dáng mới.",
        associatedActions: [
          { en: "restyle hair to conceal mistakes", vi: "tạo kiểu lại để che bớt phần tóc lỗi" },
          { en: "ask stylist for quick fix advice", vi: "xin lời khuyên từ thợ để chữa cháy tóc" },
          { en: "apply clay wax for better control", vi: "vuốt sáp đất sét để kiểm soát nếp tóc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "issue",
        ipa: "/ˈɪʃuː/",
        partOfSpeech: "n.",
        meaningVi: "vấn đề",
        exampleEn: "There is an issue.",
        exampleVi: "Có một vấn đề.",
        associatedActions: [
          { en: "explain dissatisfaction calmly to barber", vi: "bình tĩnh giải thích điểm không hài lòng" },
          { en: "resolve haircut dispute diplomatically", vi: "giải quyết mâu thuẫn cắt tóc lịch sự" },
          { en: "request senior stylist intervention", vi: "nhờ thợ có kinh nghiệm hơn vào hỗ trợ" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "process",
        ipa: "/ˈprɑːsɛs/",
        partOfSpeech: "n.",
        meaningVi: "quy trình",
        exampleEn: "The process takes time.",
        exampleVi: "Quy trình tốn thời gian.",
        associatedActions: [
          { en: "request partial or full refund", vi: "yêu cầu hoàn lại một phần hoặc toàn bộ tiền" },
          { en: "schedule complimentary touch-up visit", vi: "hẹn buổi chỉnh sửa lại tóc miễn phí" },
          { en: "record complaint with salon manager", vi: "ghi nhận ý kiến phản hồi với quản lý" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80"
      },
      {
        term: "available",
        ipa: "/əˈveɪləbəl/",
        partOfSpeech: "adj.",
        meaningVi: "có sẵn",
        exampleEn: "Is it available?",
        exampleVi: "Nó có sẵn không?",
        associatedActions: [
          { en: "ask if head manager is available", vi: "hỏi xem quản lý trưởng có mặt ở đó không" },
          { en: "check available salon remedy options", vi: "tìm các giải pháp khắc phục sẵn có của tiệm" },
          { en: "confirm master stylist is available", vi: "xác nhận thợ chính có thể hỗ trợ sửa tóc" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
      }
    ],
    usefulPhrases: [
      { phrase: "I would like a haircut.", meaningVi: "Tôi muốn cắt tóc." },
      { phrase: "I have a question about this.", meaningVi: "Tôi có một câu hỏi về việc này." },
      { phrase: "How much does it cost?", meaningVi: "Cái này giá bao nhiêu?" },
      { phrase: "How long will it take?", meaningVi: "Sẽ mất bao lâu?" },
      { phrase: "Thank you for your help.", meaningVi: "Cảm ơn bạn đã giúp đỡ." }
    ],
    aiTutorPrompt: "You are roleplaying a scenario about: Booking an appointment. Respond naturally to the user.",
    tags: ["at-the_hairdresser","daily-life"]
  }
];
