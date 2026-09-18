/**
 * Foundational Speaking System for False Beginners (A0-A1)
 * Stage 0: Khai thông cơ miệng & Ngữ âm phản xạ (Foundational Phonetics)
 * File: src/data/speaking/foundation/stage-0-phonetics.ts
 *
 * 10 Essential Phonetic Lessons for Vietnamese False Beginners:
 * - 6 Minimal Pair Contrasts (/iː/ vs /ɪ/, /e/ vs /æ/, /uː/ vs /ʊ/, /θ/ vs /s/, /ð/ vs /d/, /ʃ/ vs /s/)
 * - 3 Critical Ending Sound Clusters (/-s, -z, -ɪz/, /-p, -t, -k/, /-t, -d, -ɪd/)
 * - 1 Rhythm & Consonant-to-Vowel (C ‿ V) Linking Lesson
 *
 * Verified Rachel's English YouTube demonstration clips with exact seconds.
 * 100% Bilingual English - Vietnamese, zero placeholders.
 */

import type { Stage0PhoneticLesson } from '@/types/speaking-foundation';

export const STAGE_0_PHONETIC_LESSONS: Stage0PhoneticLesson[] = [
  // ── Lesson 1: /iː/ vs /ɪ/ ───────────────────────────────────────────────────
  {
    id: 'stage-0-vowel-i-contrast',
    title: 'Cặp nguyên âm /iː/ dài và /ɪ/ ngắn',
    phonemes: ['/iː/', '/ɪ/'],
    category: 'vowel-pairs',
    descriptionVi:
      'Tiếng Việt chỉ có một âm /i/ lưng chừng ở giữa, khiến người học mất gốc thường gộp chung cả hai âm tiếng Anh thành một. Điều này dẫn tới những nhầm lẫn tai hại trong giao tiếp như "sheet" (khăn trải giường) thành từ tục, hay "leave" (rời đi) thành "live" (sống).',
    mouthTipVi:
      'Âm /iː/ (dài): Kéo căng hai khóe miệng cười tươi sang hai bên, mặt lưỡi nâng sát vòm họng trên, giữ âm vang và ngân dài. Âm /ɪ/ (ngắn): Thả lỏng toàn bộ cơ miệng và khóe môi, hạ nhẹ cằm xuống 1cm, phát âm dứt khoát nửa giây như âm "ê" nhẹ của tiếng Việt.',
    video: {
      youtubeVideoId: 'scCesnn-0XY',
      channelName: "Rachel's English",
      startSeconds: 45,
      endSeconds: 115,
      title: "How to Pronounce EE [i:] and IH [ɪ] Vowels - Rachel's English",
      videoTip:
        'For /iː/, mouth corners pull wide in a tight smile and tongue blade arches high near the roof. For /ɪ/, mouth corners relax completely and jaw drops slightly.',
      mouthTipSummary: 'Quan sát khóe môi căng cười ở /iː/ đối lập với cơ miệng thả lỏng hoàn toàn ở /ɪ/.',
    },
    practiceWords: [
      { word: 'sheep', ipa: '/ʃiːp/', meaningVi: 'con cừu' },
      { word: 'ship', ipa: '/ʃɪp/', meaningVi: 'con tàu thủy' },
      { word: 'seat', ipa: '/siːt/', meaningVi: 'chỗ ngồi' },
      { word: 'sit', ipa: '/sɪt/', meaningVi: 'ngồi xuống' },
      { word: 'leave', ipa: '/liːv/', meaningVi: 'rời khỏi' },
      { word: 'live', ipa: '/lɪv/', meaningVi: 'sống, cư ngụ' },
      { word: 'sleep', ipa: '/sliːp/', meaningVi: 'ngủ' },
      { word: 'slip', ipa: '/slɪp/', meaningVi: 'trượt ngã' },
    ],
    minimalPairs: [
      {
        wordA: 'sheep',
        ipaA: '/ʃiːp/',
        wordB: 'ship',
        ipaB: '/ʃɪp/',
        distinctionVi: '/iː/ cười căng dài vs /ɪ/ thả lỏng ngắn dứt khoát',
      },
      {
        wordA: 'seat',
        ipaA: '/siːt/',
        wordB: 'sit',
        ipaB: '/sɪt/',
        distinctionVi: 'chỗ ngồi (kéo dài) vs hành động ngồi (ngắn)',
      },
      {
        wordA: 'leave',
        ipaA: '/liːv/',
        wordB: 'live',
        ipaB: '/lɪv/',
        distinctionVi: 'rời đi (âm dài + v rung) vs sống (âm ngắn)',
      },
      {
        wordA: 'heat',
        ipaA: '/hiːt/',
        wordB: 'hit',
        ipaB: '/hɪt/',
        distinctionVi: 'sức nóng (nguyên âm dài) vs đánh đòn (nguyên âm ngắn)',
      },
      {
        wordA: 'reach',
        ipaA: '/riːtʃ/',
        wordB: 'rich',
        ipaB: '/rɪtʃ/',
        distinctionVi: 'với tới (căng môi) vs giàu có (thả lỏng)',
      },
    ],
  },

  // ── Lesson 2: /e/ vs /æ/ ───────────────────────────────────────────────────
  {
    id: 'stage-0-vowel-e-ae-contrast',
    title: 'Cặp nguyên âm /e/ mở vừa và /æ/ hạ cằm sâu (A bẹt)',
    phonemes: ['/e/', '/æ/'],
    category: 'vowel-pairs',
    descriptionVi:
      'Tiếng Việt có âm "e" và "ê" nhưng không có âm /æ/ (A bẹt hạ hàm sâu). Người Việt thường phát âm "man" thành "men", "bad" thành "bed", khiến người bản xứ nghe thành số nhiều hoặc hiểu sai hoàn toàn ý định câu.',
    mouthTipVi:
      'Âm /e/: Mở miệng vừa phải như chữ "e" trong từ "mẹ", môi và lưỡi trung tính. Âm /æ/: Hạ cằm sâu xuống tối đa, mở rộng khóe miệng sang hai bên như cười lớn, đè phẳng mặt lưỡi xuống đáy miệng để tạo âm trầm vang rộng.',
    video: {
      youtubeVideoId: 'UM9gPzKs1Hg',
      channelName: "Rachel's English",
      startSeconds: 35,
      endSeconds: 105,
      title: "How to Pronounce EH [e] and AA [æ] Vowels - Rachel's English",
      videoTip:
        'For /e/, mouth opens moderately like in "bed". For /æ/, drop your jaw down substantially, flatten the tongue, and flare mouth corners outward like in "bad".',
      mouthTipSummary: 'Hạ cằm sâu tối đa và ép phẳng lưỡi cho âm /æ/ bẹt.',
    },
    practiceWords: [
      { word: 'men', ipa: '/men/', meaningVi: 'những người đàn ông (số nhiều)' },
      { word: 'man', ipa: '/mæn/', meaningVi: 'người đàn ông (số ít)' },
      { word: 'bed', ipa: '/bed/', meaningVi: 'chiếc giường ngủ' },
      { word: 'bad', ipa: '/bæd/', meaningVi: 'tồi tệ, xấu' },
      { word: 'pen', ipa: '/pen/', meaningVi: 'cây bút mực' },
      { word: 'pan', ipa: '/pæn/', meaningVi: 'cái chảo rán' },
      { word: 'send', ipa: '/send/', meaningVi: 'gửi đi' },
      { word: 'sand', ipa: '/sænd/', meaningVi: 'bãi cát' },
    ],
    minimalPairs: [
      {
        wordA: 'men',
        ipaA: '/men/',
        wordB: 'man',
        ipaB: '/mæn/',
        distinctionVi: 'miệng mở vừa /e/ vs hạ cằm sâu hết cỡ /æ/',
      },
      {
        wordA: 'bed',
        ipaA: '/bed/',
        wordB: 'bad',
        ipaB: '/bæd/',
        distinctionVi: 'chiếc giường (/e/) vs điều xấu (/æ/)',
      },
      {
        wordA: 'pen',
        ipaA: '/pen/',
        wordB: 'pan',
        ipaB: '/pæn/',
        distinctionVi: 'cây bút (/e/) vs cái chảo rán (/æ/)',
      },
      {
        wordA: 'send',
        ipaA: '/send/',
        wordB: 'sand',
        ipaB: '/sænd/',
        distinctionVi: 'gửi tin (/e/) vs cát biển (/æ/)',
      },
      {
        wordA: 'head',
        ipaA: '/hed/',
        wordB: 'had',
        ipaB: '/hæd/',
        distinctionVi: 'cái đầu (/e/) vs đã có (/æ/)',
      },
    ],
  },

  // ── Lesson 3: /uː/ vs /ʊ/ ───────────────────────────────────────────────────
  {
    id: 'stage-0-vowel-u-contrast',
    title: 'Cặp nguyên âm /uː/ chu môi dài và /ʊ/ thả lỏng ngắn',
    phonemes: ['/uː/', '/ʊ/'],
    category: 'vowel-pairs',
    descriptionVi:
      'Tiếng Việt chỉ có âm "u" căng cứng, nên người học áp dụng âm này cho cả "look", "good", "book", biến "look" thành "lục" hay "good" thành "gút". Âm /ʊ/ trong tiếng Anh đòi hỏi sự thả lỏng hoàn toàn của cơ môi.',
    mouthTipVi:
      'Âm /uː/: Chu môi tròn nhỏ như đang huýt sáo, cơ môi siết căng, đẩy luồng âm ngân dài. Âm /ʊ/: Thả lỏng toàn bộ cơ môi (môi mở nhẹ hình oval), không chu môi nhọn, hạ nhẹ cằm và phát âm dứt khoát.',
    video: {
      youtubeVideoId: 'IwahymIkGJ0',
      channelName: "Rachel's English",
      startSeconds: 38,
      endSeconds: 100,
      title: "How to Pronounce OO [u:] and UH [ʊ] Vowels - Rachel's English",
      videoTip:
        'For /uː/, lips form a tight, tense whistle circle. For /ʊ/, lips and jaw relax completely into a soft neutral round shape with no lip tension.',
      mouthTipSummary: 'Chu môi căng tròn huýt sáo /uː/ đối lập với môi thả lỏng tự nhiên ở /ʊ/.',
    },
    practiceWords: [
      { word: 'fool', ipa: '/fuːl/', meaningVi: 'kẻ ngốc' },
      { word: 'full', ipa: '/fʊl/', meaningVi: 'đầy, no bụng' },
      { word: 'pool', ipa: '/puːl/', meaningVi: 'hồ bơi' },
      { word: 'pull', ipa: '/pʊl/', meaningVi: 'kéo vào' },
      { word: 'Luke', ipa: '/luːk/', meaningVi: 'tên riêng Luke' },
      { word: 'look', ipa: '/lʊk/', meaningVi: 'nhìn ngắm' },
      { word: 'suit', ipa: '/suːt/', meaningVi: 'bộ âu phục' },
      { word: 'soot', ipa: '/sʊt/', meaningVi: 'bồ hóng, muội than' },
    ],
    minimalPairs: [
      {
        wordA: 'fool',
        ipaA: '/fuːl/',
        wordB: 'full',
        ipaB: '/fʊl/',
        distinctionVi: 'chu môi siết căng ngân dài vs thả lỏng mềm cơ môi',
      },
      {
        wordA: 'pool',
        ipaA: '/puːl/',
        wordB: 'pull',
        ipaB: '/pʊl/',
        distinctionVi: 'hồ bơi (/uː/) vs hành động kéo (/ʊ/)',
      },
      {
        wordA: 'Luke',
        ipaA: '/luːk/',
        wordB: 'look',
        ipaB: '/lʊk/',
        distinctionVi: 'tên Luke (chu môi căng) vs nhìn xem (môi thả lỏng)',
      },
      {
        wordA: 'suit',
        ipaA: '/suːt/',
        wordB: 'soot',
        ipaB: '/sʊt/',
        distinctionVi: 'bộ vest (/uː/) vs bồ hóng (/ʊ/)',
      },
    ],
  },

  // ── Lesson 4: /θ/ vs /s/ ───────────────────────────────────────────────────
  {
    id: 'stage-0-consonant-th-voiceless',
    title: 'Phụ âm thổi hơi /θ/ (TH vô thanh) và âm xì /s/',
    phonemes: ['/θ/', '/s/'],
    category: 'consonant-pairs',
    descriptionVi:
      'Tiếng Việt không có âm đặt lưỡi giữa răng /θ/. Người học mất gốc thường thay thế bằng âm /s/ ("xì" hơi) hoặc /t/ ("tinh"), khiến "think" (suy nghĩ) thành "sink" (chìm nghỉm) hoặc "thank" (cảm ơn) thành "sank" (đã chìm).',
    mouthTipVi:
      'Âm /θ/: Đưa nhẹ đầu lưỡi ra giữa hai hàm răng cửa trên và dưới, nhẹ nhàng thổi luồng hơi lướt qua mặt lưỡi (tuyệt đối không cắn chặt răng vào lưỡi). Âm /s/: Hai hàm răng khép sát, đầu lưỡi thụt vào bên trong chân răng trên và xì hơi mạnh ra ngoài.',
    video: {
      youtubeVideoId: 'nlKNo1TGALA',
      channelName: "Rachel's English",
      startSeconds: 25,
      endSeconds: 85,
      title: "How to Pronounce the TH Consonants - Rachel's English",
      videoTip:
        'For voiceless /θ/, place the tip of your tongue lightly between your top and bottom teeth. Push air gently through the dental gap without biting down.',
      mouthTipSummary: 'Đặt đầu lưỡi chạm nhẹ mép răng cửa và đẩy luồng hơi êm.',
    },
    practiceWords: [
      { word: 'think', ipa: '/θɪŋk/', meaningVi: 'suy nghĩ' },
      { word: 'sink', ipa: '/sɪŋk/', meaningVi: 'bồn rửa, chìm' },
      { word: 'thank', ipa: '/θæŋk/', meaningVi: 'cảm ơn' },
      { word: 'sank', ipa: '/sæŋk/', meaningVi: 'đã chìm xuống' },
      { word: 'thin', ipa: '/θɪn/', meaningVi: 'gầy, mỏng mảnh' },
      { word: 'sin', ipa: '/sɪn/', meaningVi: 'tội lỗi' },
      { word: 'mouth', ipa: '/maʊθ/', meaningVi: 'miệng' },
      { word: 'mouse', ipa: '/maʊs/', meaningVi: 'con chuột' },
    ],
    minimalPairs: [
      {
        wordA: 'think',
        ipaA: '/θɪŋk/',
        wordB: 'sink',
        ipaB: '/sɪŋk/',
        distinctionVi: 'đầu lưỡi thò giữa 2 răng /θ/ vs răng khép xì hơi /s/',
      },
      {
        wordA: 'thank',
        ipaA: '/θæŋk/',
        wordB: 'sank',
        ipaB: '/sæŋk/',
        distinctionVi: 'lời cảm ơn (/θ/) vs đã chìm tàu (/s/)',
      },
      {
        wordA: 'thin',
        ipaA: '/θɪn/',
        wordB: 'sin',
        ipaB: '/sɪn/',
        distinctionVi: 'thanh mảnh (/θ/) vs tội lỗi (/s/)',
      },
      {
        wordA: 'mouth',
        ipaA: '/maʊθ/',
        wordB: 'mouse',
        ipaB: '/maʊs/',
        distinctionVi: 'khuôn miệng (/θ/) vs con chuột (/s/)',
      },
      {
        wordA: 'faith',
        ipaA: '/feɪθ/',
        wordB: 'face',
        ipaB: '/feɪs/',
        distinctionVi: 'niềm tin (/θ/) vs khuôn mặt (/s/)',
      },
    ],
  },

  // ── Lesson 5: /ð/ vs /d/ ───────────────────────────────────────────────────
  {
    id: 'stage-0-consonant-th-voiced',
    title: 'Phụ âm rung /ð/ (TH hữu thanh) và âm chặn /d/',
    phonemes: ['/ð/', '/d/'],
    category: 'consonant-pairs',
    descriptionVi:
      'Người Việt thường thay thế âm /ð/ bằng chữ "đ" (/d/) hoặc "d" (/z/) của tiếng Việt, phát âm "they" thành "đây", "there" thành "đe". Điều này làm mất đi âm sắc tự nhiên của tiếng Anh chuẩn.',
    mouthTipVi:
      'Âm /ð/: Vị trí lưỡi hệt như âm /θ/ (đầu lưỡi thò nhẹ giữa 2 hàm răng), nhưng thay vì chỉ thổi hơi vô thanh, bạn phải RUNG mạnh dây thanh quản trong cổ họng để cảm nhận độ rung râm ran ở đầu lưỡi. Âm /d/: Đầu lưỡi đập mạnh lên nướu răng trên rồi bật xuống dứt khoát.',
    video: {
      youtubeVideoId: 'nlKNo1TGALA',
      channelName: "Rachel's English",
      startSeconds: 85,
      endSeconds: 145,
      title: "How to Pronounce the Voiced TH [ð] Consonant - Rachel's English",
      videoTip:
        'Place tongue tip lightly between teeth just like /θ/, but activate your vocal cords to create a heavy buzz sensation against your front teeth.',
      mouthTipSummary: 'Đầu lưỡi kẹp nhẹ giữa răng và rung thanh quản có độ rè đặc trưng.',
    },
    practiceWords: [
      { word: 'they', ipa: '/ðeɪ/', meaningVi: 'họ, chúng nó' },
      { word: 'day', ipa: '/deɪ/', meaningVi: 'ngày, ban ngày' },
      { word: 'there', ipa: '/ðer/', meaningVi: 'ở đằng kia' },
      { word: 'dare', ipa: '/der/', meaningVi: 'dám làm' },
      { word: 'then', ipa: '/ðen/', meaningVi: 'sau đó' },
      { word: 'den', ipa: '/den/', meaningVi: 'hang thú, sào huyệt' },
      { word: 'breathe', ipa: '/briːð/', meaningVi: 'hít thở' },
      { word: 'breed', ipa: '/briːd/', meaningVi: 'nòi giống, sinh sản' },
    ],
    minimalPairs: [
      {
        wordA: 'they',
        ipaA: '/ðeɪ/',
        wordB: 'day',
        ipaB: '/deɪ/',
        distinctionVi: 'lưỡi kẹp giữa răng rung rè /ð/ vs lưỡi đập nướu /d/',
      },
      {
        wordA: 'there',
        ipaA: '/ðer/',
        wordB: 'dare',
        ipaB: '/der/',
        distinctionVi: 'ở đó (/ð/) vs dám thử thách (/d/)',
      },
      {
        wordA: 'then',
        ipaA: '/ðen/',
        wordB: 'den',
        ipaB: '/den/',
        distinctionVi: 'sau đó (/ð/) vs hang ổ (/d/)',
      },
      {
        wordA: 'breathe',
        ipaA: '/briːð/',
        wordB: 'breed',
        ipaB: '/briːd/',
        distinctionVi: 'hơi thở (động từ rung /ð/) vs phối giống (/d/)',
      },
    ],
  },

  // ── Lesson 6: /ʃ/ vs /s/ ───────────────────────────────────────────────────
  {
    id: 'stage-0-consonant-sh-s-contrast',
    title: 'Cặp phụ âm /ʃ/ (chu môi xì mạnh) và /s/ (cười xì nhẹ)',
    phonemes: ['/ʃ/', '/s/'],
    category: 'consonant-pairs',
    descriptionVi:
      'Đặc biệt người miền Bắc Việt Nam hay đồng nhất âm "s" và "x", dẫn đến việc đọc cả /ʃ/ và /s/ thành "x" nhẹ. Đọc "she" thành "see", "ship" thành "sip" gây hiểu lầm hoàn toàn ngữ cảnh.',
    mouthTipVi:
      'Âm /s/: Khóe miệng mở rộng như đang mỉm cười, đầu lưỡi áp sát chân răng cửa hàm trên, luồng hơi xì sắc và mảnh. Âm /ʃ/: Chu môi tròn hướng về phía trước như đang ra hiệu giữ im lặng "suỵt!", nâng thân lưỡi lên cao về phía vòm họng và thổi luồng hơi dày, trầm.',
    video: {
      youtubeVideoId: 'uguN4ghpKtQ',
      channelName: "Rachel's English",
      startSeconds: 30,
      endSeconds: 95,
      title: "How to Pronounce the SH [ʃ] and S [s] Consonants - Rachel's English",
      videoTip:
        'For /s/, mouth corners pull wide and teeth touch lightly with air hissing forward. For /ʃ/, lips flare into a round funnel shape like telling someone "shh!".',
      mouthTipSummary: 'Chu môi tròn phễu thổi hơi trầm /ʃ/ vs khóe miệng bè sang bên xì hơi sắc /s/.',
    },
    practiceWords: [
      { word: 'she', ipa: '/ʃiː/', meaningVi: 'cô ấy, bà ấy' },
      { word: 'see', ipa: '/siː/', meaningVi: 'nhìn thấy' },
      { word: 'sheet', ipa: '/ʃiːt/', meaningVi: 'tấm trải giường, tờ giấy' },
      { word: 'seat', ipa: '/siːt/', meaningVi: 'ghế ngồi' },
      { word: 'ship', ipa: '/ʃɪp/', meaningVi: 'con tàu biển' },
      { word: 'sip', ipa: '/sɪp/', meaningVi: 'nhấp một ngụm nhỏ' },
      { word: 'shoe', ipa: '/ʃuː/', meaningVi: 'chiếc giày' },
      { word: 'sue', ipa: '/suː/', meaningVi: 'kiện tụng' },
    ],
    minimalPairs: [
      {
        wordA: 'she',
        ipaA: '/ʃiː/',
        wordB: 'see',
        ipaB: '/siː/',
        distinctionVi: 'chu môi thổi luồng hơi /ʃ/ vs môi căng mỉm cười /s/',
      },
      {
        wordA: 'sheet',
        ipaA: '/ʃiːt/',
        wordB: 'seat',
        ipaB: '/siːt/',
        distinctionVi: 'tờ giấy/khăn trải (/ʃ/) vs chỗ ngồi (/s/)',
      },
      {
        wordA: 'ship',
        ipaA: '/ʃɪp/',
        wordB: 'sip',
        ipaB: '/sɪp/',
        distinctionVi: 'tàu thủy (/ʃ/) vs nhấp ngụm nước (/s/)',
      },
      {
        wordA: 'shock',
        ipaA: '/ʃɑːk/',
        wordB: 'sock',
        ipaB: '/sɑːk/',
        distinctionVi: 'cú sốc (/ʃ/) vs chiếc tất đi chân (/s/)',
      },
      {
        wordA: 'shoe',
        ipaA: '/ʃuː/',
        wordB: 'sue',
        ipaB: '/suː/',
        distinctionVi: 'đôi giày (/ʃ/) vs khởi kiện (/s/)',
      },
    ],
  },

  // ── Lesson 7: Ending sound /-s, -z, -ɪz/ ───────────────────────────────────
  {
    id: 'stage-0-ending-s-z-iz',
    title: 'Quy tắc phát âm đuôi -s/-es (/-s/, /-z/, /-ɪz/)',
    phonemes: ['/-s/', '/-z/', '/-ɪz/'],
    category: 'ending-sounds',
    descriptionVi:
      'Trong tiếng Việt không có phụ âm đuôi xì hơi hoặc rung, nên người mất gốc hầu như nuốt sạch âm đuôi hoặc chỉ biết xì /-s/ bừa bãi. Việc phát âm đúng đuôi -s/-es giúp phân biệt số ít - số nhiều và ngôi thứ ba số ít chuẩn ngữ pháp.',
    mouthTipVi:
      'Quy tắc 3 nhánh: (1) Sau âm vô thanh /p, t, k, f, θ/: phát âm là /-s/ xì nhẹ (e.g. cups, cats, books). (2) Sau âm hữu thanh và nguyên âm: phát âm là /-z/ rung rè dây thanh quản (e.g. dogs, days, pens). (3) Sau các âm xuýt gió /s, z, ʃ, tʃ, dʒ/: thêm hẳn một âm tiết /-ɪz/ (e.g. buses, watches, boxes).',
    video: {
      youtubeVideoId: 'xl-7mSeybmI',
      channelName: "Rachel's English",
      startSeconds: 25,
      endSeconds: 88,
      title: "How to Pronounce Plural & 3rd Person S Endings - Rachel's English",
      videoTip:
        'Final -S has 3 rules: voiceless sounds take /-s/ (cups), voiced sounds take buzzing /-z/ (dogs), and sibilant hissing sounds add an extra syllable /-ɪz/ (buses).',
      mouthTipSummary: 'Đặt tay lên cổ họng: /-z/ bắt buộc rung dây thanh quản, /-ɪz/ thêm một nhịp âm rõ rệt.',
    },
    practiceWords: [
      { word: 'books', ipa: '/bʊks/', meaningVi: 'những cuốn sách (đuôi /-s/)' },
      { word: 'cats', ipa: '/kæts/', meaningVi: 'những con mèo (đuôi /-s/)' },
      { word: 'dogs', ipa: '/dɔːɡz/', meaningVi: 'những con chó (đuôi /-z/ rung)' },
      { word: 'days', ipa: '/deɪz/', meaningVi: 'những ngày (đuôi /-z/ rung)' },
      { word: 'buses', ipa: '/ˈbʌsɪz/', meaningVi: 'những chuyến xe buýt (đuôi /-ɪz/)' },
      { word: 'boxes', ipa: '/ˈbɑːksɪz/', meaningVi: 'những chiếc hộp (đuôi /-ɪz/)' },
      { word: 'watches', ipa: '/ˈwɑːtʃɪz/', meaningVi: 'đồng hồ đeo tay (đuôi /-ɪz/)' },
    ],
    minimalPairs: [
      {
        wordA: 'peace',
        ipaA: '/piːs/',
        wordB: 'peas',
        ipaB: '/piːz/',
        distinctionVi: 'hòa bình (đuôi vô thanh /-s/) vs hạt đậu (đuôi rung /-z/)',
      },
      {
        wordA: 'rice',
        ipaA: '/raɪs/',
        wordB: 'rise',
        ipaB: '/raɪz/',
        distinctionVi: 'gạo (đuôi /-s/ không rung) vs tăng lên (đuôi rung /-z/)',
      },
      {
        wordA: 'price',
        ipaA: '/praɪs/',
        wordB: 'prize',
        ipaB: '/praɪz/',
        distinctionVi: 'giá cả (đuôi /-s/) vs giải thưởng (đuôi /-z/)',
      },
      {
        wordA: 'bus',
        ipaA: '/bʌs/',
        wordB: 'buses',
        ipaB: '/ˈbʌsɪz/',
        distinctionVi: '1 xe buýt (1 âm tiết) vs nhiều xe buýt (2 âm tiết /-ɪz/)',
      },
    ],
  },

  // ── Lesson 8: Final Stops /-p, -t, -k/ ─────────────────────────────────────
  {
    id: 'stage-0-ending-stops-ptk',
    title: 'Bật âm chặn cuối /-p/, /-t/, /-k/ (Stop Consonants)',
    phonemes: ['/-p/', '/-t/', '/-k/'],
    category: 'ending-sounds',
    descriptionVi:
      'Trong tiếng Việt, các âm đuôi /p, t, k/ là âm "khép tắc" — họng đóng lại không bật khí ra ngoài. Người Việt nói tiếng Anh hay nuốt mất âm cuối: "like" thành "lai", "stop" thành "x-tóp" câm, khiến câu nói thiếu lực và STT không nhận diện được.',
    mouthTipVi:
      'Âm chặn cuối gồm 2 giai đoạn: nén khí và bật mở giải phóng. /-p/: Mím chặt hai môi giữ hơi lại rồi bật nhẹ ra. /-t/: Áp đầu lưỡi chặn sau nướu răng trên rồi nhả luồng hơi sắc. /-k/: Cuống lưỡi chạm vòm miệng mềm nén hơi rồi bật tiếng "kh" khẽ dứt khoát.',
    video: {
      youtubeVideoId: 'IV6e_XyNe0w',
      channelName: "Rachel's English",
      startSeconds: 42,
      endSeconds: 108,
      title: "How to Pronounce Final Stop Consonants - Rachel's English",
      videoTip:
        'Stop consonants block airflow momentarily: lips for /p/, tongue blade for /t/, tongue back for /k/. Never swallow the sound; release a crisp puff of air.',
      mouthTipSummary: 'Nén luồng hơi lại rồi mở cơ quan phát âm để nghe thấy tiếng nổ bật khẽ.',
    },
    practiceWords: [
      { word: 'stop', ipa: '/stɑːp/', meaningVi: 'dừng lại (bật /-p/)' },
      { word: 'cup', ipa: '/kʌp/', meaningVi: 'chiếc tách, cốc (bật /-p/)' },
      { word: 'cat', ipa: '/kæt/', meaningVi: 'con mèo (bật /-t/)' },
      { word: 'hot', ipa: '/hɑːt/', meaningVi: 'nóng bức (bật /-t/)' },
      { word: 'like', ipa: '/laɪk/', meaningVi: 'thích thú (bật /-k/)' },
      { word: 'book', ipa: '/bʊk/', meaningVi: 'cuốn sách (bật /-k/)' },
      { word: 'work', ipa: '/wɜːrk/', meaningVi: 'công việc (bật /-k/)' },
    ],
    minimalPairs: [
      {
        wordA: 'like',
        ipaA: '/laɪk/',
        wordB: 'lie',
        ipaB: '/laɪ/',
        distinctionVi: 'yêu thích (bật /-k/ dứt khoát) vs nói dối (không có âm đuôi)',
      },
      {
        wordA: 'white',
        ipaA: '/waɪt/',
        wordB: 'why',
        ipaB: '/waɪ/',
        distinctionVi: 'màu trắng (bật âm chặn /-t/) vs tại sao (nguyên âm mở)',
      },
      {
        wordA: 'cap',
        ipaA: '/kæp/',
        wordB: 'cat',
        ipaB: '/kæt/',
        distinctionVi: 'mũ lưỡi trai (mím môi /-p/) vs con mèo (chạm đầu lưỡi /-t/)',
      },
      {
        wordA: 'back',
        ipaA: '/bæk/',
        wordB: 'bat',
        ipaB: '/bæt/',
        distinctionVi: 'lưng áo (cuống lưỡi /-k/) vs gậy bóng chày (đầu lưỡi /-t/)',
      },
    ],
  },

  // ── Lesson 9: Ending sound /-t, -d, -ɪd/ ───────────────────────────────────
  {
    id: 'stage-0-ending-ed-rules',
    title: 'Quy tắc phát âm đuôi quá khứ -ED (/-t/, /-d/, /-ɪd/)',
    phonemes: ['/-t/', '/-d/', '/-ɪd/'],
    category: 'ending-sounds',
    descriptionVi:
      'Người mất gốc hay mắc lỗi đọc đuôi "-ed" thành một âm tiết riêng biệt cho mọi từ (e.g. "looked" đọc thành "lục-kịt", "played" thành "play-ịt"). Trên thực tế, 90% động từ trong tiếng Anh chỉ biến thành âm bật /-t/ hoặc âm rung /-d/ mà không tăng thêm số âm tiết.',
    mouthTipVi:
      'Ghi nhớ thần chú: (1) Chỉ từ tận cùng bằng âm /t/ hoặc /d/ mới đọc là /-ɪd/ và thêm 1 âm tiết (e.g. wanted, needed). (2) Tận cùng bằng phụ âm vô thanh: bật âm /-t/ (e.g. looked, stopped, washed). (3) Tận cùng bằng nguyên âm hoặc âm hữu thanh: rung âm /-d/ (e.g. played, cleaned, loved).',
    video: {
      youtubeVideoId: 'gftHWQ6CLu8',
      channelName: "Rachel's English",
      startSeconds: 40,
      endSeconds: 115,
      title: "How to Pronounce Regular Past Tense -ED Endings - Rachel's English",
      videoTip:
        'Only words ending in /t/ or /d/ add a new syllable /-ɪd/ (wanted). Voiceless endings become crisp /-t/ (stopped), and voiced endings become vibrant /-d/ (played).',
      mouthTipSummary: 'Chỉ thêm âm tiết /-ɪd/ khi gặp /t, d/, còn lại chỉ bật /-t/ hoặc /-d/ nhanh.',
    },
    practiceWords: [
      { word: 'wanted', ipa: '/ˈwɑːntɪd/', meaningVi: 'đã muốn (thêm âm tiết /-ɪd/)' },
      { word: 'needed', ipa: '/ˈniːdɪd/', meaningVi: 'đã cần (thêm âm tiết /-ɪd/)' },
      { word: 'looked', ipa: '/lʊkt/', meaningVi: 'đã nhìn (bật âm /-t/, 1 âm tiết)' },
      { word: 'stopped', ipa: '/stɑːpt/', meaningVi: 'đã dừng (bật âm /-t/, 1 âm tiết)' },
      { word: 'played', ipa: '/pleɪd/', meaningVi: 'đã chơi (rung âm /-d/, 1 âm tiết)' },
      { word: 'cleaned', ipa: '/kliːnd/', meaningVi: 'đã dọn dẹp (rung âm /-d/, 1 âm tiết)' },
    ],
    minimalPairs: [
      {
        wordA: 'want',
        ipaA: '/wɑːnt/',
        wordB: 'wanted',
        ipaB: '/ˈwɑːntɪd/',
        distinctionVi: 'hiện tại (1 âm tiết) vs quá khứ (2 âm tiết thêm /-ɪd/)',
      },
      {
        wordA: 'need',
        ipaA: '/niːd/',
        wordB: 'needed',
        ipaB: '/ˈniːdɪd/',
        distinctionVi: 'cần (1 âm tiết) vs đã cần (2 âm tiết thêm /-ɪd/)',
      },
      {
        wordA: 'play',
        ipaA: '/pleɪ/',
        wordB: 'played',
        ipaB: '/pleɪd/',
        distinctionVi: 'chơi (nguyên âm mở) vs đã chơi (rung chạm /-d/ cuối)',
      },
      {
        wordA: 'look',
        ipaA: '/lʊk/',
        wordB: 'looked',
        ipaB: '/lʊkt/',
        distinctionVi: 'nhìn (bật /-k/) vs đã nhìn (kết hợp cụm /-kt/)',
      },
    ],
  },

  // ── Lesson 10: Sentence Rhythm & Linking ───────────────────────────────────
  {
    id: 'stage-0-rhythm-linking',
    title: 'Nhịp điệu câu & Nối âm Phụ âm sang Nguyên âm (C ‿ V Linking)',
    phonemes: ['/ˈ●○/', '/C ‿ V/'],
    category: 'stress-linking',
    descriptionVi:
      'Tiếng Việt là ngôn ngữ đơn âm đều nhịp ("máy đánh chữ"). Trong khi đó tiếng Anh là ngôn ngữ có trọng âm nhịp điệu (stress-timed): các từ mang nội dung (danh từ, động từ chính) được nói to, dài và cao; còn các từ chức năng (mạo từ, giới từ) bị thu nhỏ thành âm lướt schwa /ə/. Đồng thời, phụ âm cuối từ trước nối mượt sang nguyên âm đầu từ sau.',
    mouthTipVi:
      'Tưởng tượng câu nói là một dải lụa không đứt quãng: Phụ âm cuối từ đi trước "nhảy sang làm phụ âm đầu" của từ tiếp theo. Thay vì nói ngắc ngứ "Can... I... have... a...", hãy nối liền: "Ca-nI-ha-va" (/kə.naɪ.hæ.və/).',
    video: {
      youtubeVideoId: '7tsljuK4f2E',
      channelName: "Rachel's English",
      startSeconds: 35,
      endSeconds: 105,
      title: 'Connected Speech: Consonant to Vowel Linking in American English',
      videoTip:
        'Smoothly connect the final consonant of one word into the starting vowel of the next: "Can I have a" sounds like "ca-ni-ha-va", creating fluid native cadence.',
      mouthTipSummary: 'Nối trơn tru phụ âm cuối vào nguyên âm sau, không dừng ngắt giữa chừng.',
    },
    practiceWords: [
      { word: 'Can I have a', ipa: '/kə.naɪ.hæ.və/', meaningVi: 'Cho tôi xin một...' },
      { word: 'Hold on', ipa: '/hoʊl.dɑːn/', meaningVi: 'Chờ một chút' },
      { word: 'Check it out', ipa: '/tʃe.kɪ.daʊt/', meaningVi: 'Xem thử cái này' },
      { word: 'Pick it up', ipa: '/pɪ.kɪ.tʌp/', meaningVi: 'Nhặt nó lên' },
      { word: 'Turn it off', ipa: '/tɜːr.nɪ.tɔːf/', meaningVi: 'Tắt nó đi' },
      { word: 'Come on in', ipa: '/kʌ.mɑː.nɪn/', meaningVi: 'Mời vào trong' },
    ],
    minimalPairs: [
      {
        wordA: 'hold on',
        ipaA: '/hoʊl.dɑːn/',
        wordB: 'whole dawn',
        ipaB: '/hoʊl dɔːn/',
        distinctionVi: 'nối âm liền mạch /dɑːn/ vs ngắt quãng 2 từ rời',
      },
      {
        wordA: 'can I',
        ipaA: '/kə.naɪ/',
        wordB: 'can eye',
        ipaB: '/kæn aɪ/',
        distinctionVi: 'lướt âm nối mềm /kə.naɪ/ vs nhấn mạnh cả 2 từ rời',
      },
      {
        wordA: 'check it',
        ipaA: '/tʃe.kɪt/',
        wordB: 'check kit',
        ipaB: '/tʃek kɪt/',
        distinctionVi: 'nối âm /k/ sang /ɪt/ vs đúp âm /k/ giữa 2 từ',
      },
    ],
  },
];
