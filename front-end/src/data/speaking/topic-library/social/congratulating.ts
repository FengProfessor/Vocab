/**
 * LingoPro Speaking Topic Library
 * Category: Social
 * Subcategory: Congratulating
 * File: src/data/speaking/topic-library/social/congratulating.ts
 *
 * 5 sub-topics covering expressing congratulations for various life events.
 * CEFR Range: A1 - B1
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const CONGRATULATING_ITEMS: TopicLibraryItem[] = [
  {
    id: 'soc-congrat-01',
    category: 'social',
    subcategory: 'congratulating',
    level: 'A1',
    titleEn: 'Congratulating on a new job',
    titleVi: 'Chúc mừng có công việc mới',
    icon: 'Briefcase',
    situationVi: 'Bạn vừa biết tin bạn của mình nhận được công việc mới mà họ rất mong muốn. Bạn gặp họ và chúc mừng.',
    sampleDialogue: [
      { speaker: 'A', text: 'I heard you got the new job. Congratulations!', translationVi: 'Mình nghe nói bạn đã nhận được công việc mới. Chúc mừng nhé!' },
      { speaker: 'B', text: 'Thank you so much! I am very excited.', translationVi: 'Cảm ơn bạn rất nhiều! Mình đang rất hào hứng.' },
      { speaker: 'A', text: 'You worked really hard for it. When do you start?', translationVi: 'Bạn đã làm việc rất chăm chỉ vì nó. Khi nào bạn bắt đầu làm?' },
      { speaker: 'B', text: 'I start next Monday. I am a little bit nervous.', translationVi: 'Mình bắt đầu vào thứ Hai tới. Mình hơi lo lắng một chút.' },
      { speaker: 'A', text: 'Do not worry, you will be great. We should celebrate this weekend!', translationVi: 'Đừng lo, bạn sẽ làm rất tốt thôi. Chúng ta nên ăn mừng vào cuối tuần này!' },
      { speaker: 'B', text: 'That sounds like a great idea.', translationVi: 'Đó là một ý kiến tuyệt vời.' }
    ],
    keyVocabulary: [
      {
        term: 'job',
        ipa: '/dʒɑːb/',
        partOfSpeech: 'noun',
        meaningVi: 'công việc',
        exampleEn: 'I got a new job today.',
        exampleVi: 'Hôm nay tôi đã nhận một công việc mới.',
        associatedActions: [
          { en: 'apply for vacancy', vi: 'nộp đơn ứng tuyển vị trí' },
          { en: 'sign employment contract', vi: 'ký hợp đồng lao động' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'congratulations',
        ipa: '/kənˌɡrætʃuˈleɪʃnz/',
        partOfSpeech: 'noun',
        meaningVi: 'lời chúc mừng',
        exampleEn: 'Congratulations on your success!',
        exampleVi: 'Chúc mừng thành công của bạn!',
        associatedActions: [
          { en: 'send warm congratulations', vi: 'gửi lời chúc mừng ấm áp' },
          { en: 'shake someone hand', vi: 'bắt tay chúc mừng ai đó' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'excited',
        ipa: '/ɪkˈsaɪtɪd/',
        partOfSpeech: 'adj',
        meaningVi: 'hào hứng, phấn khích',
        exampleEn: 'I am so excited for the trip.',
        exampleVi: 'Tôi rất hào hứng cho chuyến đi.',
        associatedActions: [
          { en: 'jump with excitement', vi: 'nhảy cẫng lên vì phấn khích' },
          { en: 'share good news', vi: 'chia sẻ tin vui' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'nervous',
        ipa: '/ˈnɜːrvəs/',
        partOfSpeech: 'adj',
        meaningVi: 'lo lắng',
        exampleEn: 'She was nervous before the interview.',
        exampleVi: 'Cô ấy đã rất lo lắng trước buổi phỏng vấn.',
        associatedActions: [
          { en: 'take deep breaths', vi: 'hít thở sâu' },
          { en: 'fidget with hands', vi: 'bồn chồn nghịch ngón tay' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'celebrate',
        ipa: '/ˈselɪbreɪt/',
        partOfSpeech: 'verb',
        meaningVi: 'ăn mừng',
        exampleEn: 'Let us celebrate your birthday.',
        exampleVi: 'Hãy ăn mừng sinh nhật của bạn.',
        associatedActions: [
          { en: 'toast with drinks', vi: 'nâng ly chúc mừng' },
          { en: 'throw a festive party', vi: 'tổ chức một bữa tiệc vui' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I heard you got the new job.', translationVi: 'Mình nghe nói bạn có công việc mới.' },
      { phrase: 'Congratulations!', translationVi: 'Chúc mừng!' },
      { phrase: 'You worked really hard for it.', translationVi: 'Bạn đã làm việc rất chăm chỉ vì nó.' },
      { phrase: 'When do you start?', translationVi: 'Khi nào bạn bắt đầu?' },
      { phrase: 'We should celebrate!', translationVi: 'Chúng ta nên ăn mừng!' }
    ],
    aiTutorPrompt: 'You recently got hired for a new job. The user will congratulate you. Express your excitement and a bit of nervousness about starting next week.',
    tags: ['work', 'success', 'celebration']
  },
  {
    id: 'soc-congrat-02',
    category: 'social',
    subcategory: 'congratulating',
    level: 'A1',
    titleEn: 'Congratulating on graduation',
    titleVi: 'Chúc mừng tốt nghiệp',
    icon: 'GraduationCap',
    situationVi: 'Em gái/Em trai của bạn vừa nhận bằng tốt nghiệp đại học. Bạn ôm họ và gửi những lời chúc tốt đẹp nhất.',
    sampleDialogue: [
      { speaker: 'A', text: 'Happy Graduation Day! I am so proud of you.', translationVi: 'Chúc mừng ngày tốt nghiệp! Mình rất tự hào về bạn.' },
      { speaker: 'B', text: 'Thank you! I cannot believe it is finally over.', translationVi: 'Cảm ơn! Mình không thể tin là cuối cùng nó cũng kết thúc.' },
      { speaker: 'A', text: 'You did it! Here is a small gift for you.', translationVi: 'Bạn đã làm được! Đây là một món quà nhỏ cho bạn.' },
      { speaker: 'B', text: 'Oh, you did not have to do that. Thank you!', translationVi: 'Ồ, bạn không cần phải làm vậy đâu. Cảm ơn nhé!' },
      { speaker: 'A', text: 'Open it later. Now, let us go take some photos.', translationVi: 'Mở nó sau nhé. Giờ thì chúng ta đi chụp vài tấm ảnh nào.' },
      { speaker: 'B', text: 'Yes, let us take a picture with mom and dad.', translationVi: 'Ừ, hãy chụp một bức với bố và mẹ.' }
    ],
    keyVocabulary: [
      {
        term: 'graduation',
        ipa: '/ˌɡrædʒuˈeɪʃn/',
        partOfSpeech: 'noun',
        meaningVi: 'lễ tốt nghiệp',
        exampleEn: 'The graduation ceremony is tomorrow.',
        exampleVi: 'Lễ tốt nghiệp sẽ diễn ra vào ngày mai.',
        associatedActions: [
          { en: 'wear cap and gown', vi: 'mặc áo mũ cử nhân' },
          { en: 'receive diploma certificate', vi: 'nhận bằng tốt nghiệp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'proud',
        ipa: '/praʊd/',
        partOfSpeech: 'adj',
        meaningVi: 'tự hào',
        exampleEn: 'My parents are very proud of me.',
        exampleVi: 'Bố mẹ tôi rất tự hào về tôi.',
        associatedActions: [
          { en: 'hug family members', vi: 'ôm người thân trong gia đình' },
          { en: 'smile for camera', vi: 'mỉm cười trước ống kính' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'believe',
        ipa: '/bɪˈliːv/',
        partOfSpeech: 'verb',
        meaningVi: 'tin tưởng',
        exampleEn: 'I cannot believe it.',
        exampleVi: 'Tôi không thể tin được.',
        associatedActions: [
          { en: 'trust personal abilities', vi: 'tin tưởng vào năng lực bản thân' },
          { en: 'express disbelief', vi: 'bày tỏ sự khó tin' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'gift',
        ipa: '/ɡɪft/',
        partOfSpeech: 'noun',
        meaningVi: 'món quà',
        exampleEn: 'This gift is for you.',
        exampleVi: 'Món quà này dành cho bạn.',
        associatedActions: [
          { en: 'unwrap gift box', vi: 'mở hộp quà' },
          { en: 'tie ribbon bow', vi: 'thắt nơ ruy băng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'photo',
        ipa: '/ˈfoʊtoʊ/',
        partOfSpeech: 'noun',
        meaningVi: 'bức ảnh',
        exampleEn: 'Let us take a group photo.',
        exampleVi: 'Hãy chụp một bức ảnh nhóm.',
        associatedActions: [
          { en: 'pose with friends', vi: 'tạo dáng cùng bạn bè' },
          { en: 'snap a picture', vi: 'chụp một bức ảnh' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Happy Graduation Day!', translationVi: 'Chúc mừng ngày tốt nghiệp!' },
      { phrase: 'I am so proud of you.', translationVi: 'Tôi rất tự hào về bạn.' },
      { phrase: 'I cannot believe it is over.', translationVi: 'Tôi không thể tin là nó đã kết thúc.' },
      { phrase: 'Here is a small gift for you.', translationVi: 'Đây là một món quà nhỏ cho bạn.' },
      { phrase: 'Let us go take some photos.', translationVi: 'Hãy đi chụp vài tấm ảnh.' }
    ],
    aiTutorPrompt: 'You just graduated from university. The user (your sibling) congratulates you and gives you a gift. Thank them and suggest taking family photos.',
    tags: ['education', 'family', 'milestone']
  },
  {
    id: 'soc-congrat-03',
    category: 'social',
    subcategory: 'congratulating',
    level: 'A2',
    titleEn: 'Congratulating on a wedding/engagement',
    titleVi: 'Chúc mừng đám cưới/đính hôn',
    icon: 'Ring',
    situationVi: 'Đồng nghiệp của bạn vừa thông báo họ đã đính hôn. Bạn nhìn thấy chiếc nhẫn và gửi lời chúc mừng.',
    sampleDialogue: [
      { speaker: 'A', text: 'Oh my gosh, is that an engagement ring? Congratulations!', translationVi: 'Trời ơi, đó là nhẫn đính hôn phải không? Chúc mừng nhé!' },
      { speaker: 'B', text: 'Yes, it is! Thank you. Mark proposed last night.', translationVi: 'Đúng vậy! Cảm ơn bạn. Mark đã cầu hôn vào tối qua.' },
      { speaker: 'A', text: 'That is wonderful news. The ring is absolutely beautiful.', translationVi: 'Đó là một tin tuyệt vời. Chiếc nhẫn thực sự rất đẹp.' },
      { speaker: 'B', text: 'Thanks, I am so happy. It was a complete surprise.', translationVi: 'Cảm ơn, mình rất hạnh phúc. Đó là một sự bất ngờ hoàn toàn.' },
      { speaker: 'A', text: 'Have you set a date for the wedding yet?', translationVi: 'Các bạn đã ấn định ngày cưới chưa?' },
      { speaker: 'B', text: 'Not yet. We just want to enjoy the engagement for a while.', translationVi: 'Chưa. Bọn mình chỉ muốn tận hưởng khoảng thời gian đính hôn một lúc đã.' }
    ],
    keyVocabulary: [
      {
        term: 'engagement',
        ipa: '/ɪnˈɡeɪdʒmənt/',
        partOfSpeech: 'noun',
        meaningVi: 'sự đính hôn',
        exampleEn: 'They announced their engagement.',
        exampleVi: 'Họ đã thông báo về việc đính hôn của mình.',
        associatedActions: [
          { en: 'announce to friends', vi: 'thông báo với bạn bè' },
          { en: 'plan wedding date', vi: 'lên kế hoạch ngày cưới' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'ring',
        ipa: '/rɪŋ/',
        partOfSpeech: 'noun',
        meaningVi: 'chiếc nhẫn',
        exampleEn: 'She wears a diamond ring.',
        exampleVi: 'Cô ấy đeo một chiếc nhẫn kim cương.',
        associatedActions: [
          { en: 'slip onto finger', vi: 'lồng vào ngón tay' },
          { en: 'polish shiny stone', vi: 'đánh bóng viên đá lấp lánh' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'propose',
        ipa: '/prəˈpoʊz/',
        partOfSpeech: 'verb',
        meaningVi: 'cầu hôn',
        exampleEn: 'He proposed to her on the beach.',
        exampleVi: 'Anh ấy đã cầu hôn cô ấy trên bãi biển.',
        associatedActions: [
          { en: 'kneel on one knee', vi: 'quỳ một bên gối' },
          { en: 'ask the question', vi: 'ngỏ lời cầu hôn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'surprise',
        ipa: '/sərˈpraɪz/',
        partOfSpeech: 'noun',
        meaningVi: 'sự bất ngờ',
        exampleEn: 'The party was a big surprise.',
        exampleVi: 'Bữa tiệc là một sự bất ngờ lớn.',
        associatedActions: [
          { en: 'gasp in shock', vi: 'há hốc mồm ngạc nhiên' },
          { en: 'organize secret event', vi: 'tổ chức sự kiện bí mật' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'date',
        ipa: '/deɪt/',
        partOfSpeech: 'noun',
        meaningVi: 'ngày tháng',
        exampleEn: 'Have you set a date for the party?',
        exampleVi: 'Bạn đã chọn ngày cho bữa tiệc chưa?',
        associatedActions: [
          { en: 'circle on calendar', vi: 'khoanh tròn trên tờ lịch' },
          { en: 'send save-the-date cards', vi: 'gửi thiệp báo ngày cưới' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Is that an engagement ring?', translationVi: 'Đó có phải là nhẫn đính hôn không?' },
      { phrase: 'That is wonderful news.', translationVi: 'Đó là một tin tuyệt vời.' },
      { phrase: 'The ring is absolutely beautiful.', translationVi: 'Chiếc nhẫn thực sự rất đẹp.' },
      { phrase: 'Have you set a date yet?', translationVi: 'Bạn đã ấn định ngày chưa?' },
      { phrase: 'We just want to enjoy...', translationVi: 'Chúng tôi chỉ muốn tận hưởng...' }
    ],
    aiTutorPrompt: 'You just got engaged and are wearing a new ring at work. The user notices it and congratulates you. Share how your partner proposed and that you haven\'t set a date yet.',
    tags: ['love', 'wedding', 'coworkers']
  },
  {
    id: 'soc-congrat-04',
    category: 'social',
    subcategory: 'congratulating',
    level: 'A2',
    titleEn: 'Congratulating on a new baby',
    titleVi: 'Chúc mừng có em bé mới',
    icon: 'Baby',
    situationVi: 'Bạn đến thăm một người bạn vừa sinh em bé tại nhà của họ. Bạn gửi lời chúc mừng và khen ngợi em bé.',
    sampleDialogue: [
      { speaker: 'A', text: 'Congratulations on the birth of your baby boy! He is so adorable.', translationVi: 'Chúc mừng bạn đã sinh một bé trai! Thằng bé thật đáng yêu.' },
      { speaker: 'B', text: 'Thank you for coming to visit us. We are exhausted but so happy.', translationVi: 'Cảm ơn bạn đã đến thăm chúng tôi. Chúng tôi rất kiệt sức nhưng rất hạnh phúc.' },
      { speaker: 'A', text: 'I bet. He has your eyes, definitely.', translationVi: 'Mình cá là vậy. Thằng bé có đôi mắt của bạn, chắc chắn luôn.' },
      { speaker: 'B', text: 'Everyone says that! Would you like to hold him?', translationVi: 'Mọi người đều nói thế! Bạn có muốn bế thằng bé không?' },
      { speaker: 'A', text: 'Oh, I would love to. Hello there, little one.', translationVi: 'Ồ, mình rất muốn. Xin chào, em bé nhỏ.' },
      { speaker: 'B', text: 'Be careful, support his head like this.', translationVi: 'Cẩn thận nhé, đỡ đầu của bé như thế này.' }
    ],
    keyVocabulary: [
      {
        term: 'birth',
        ipa: '/bɜːrθ/',
        partOfSpeech: 'noun',
        meaningVi: 'sự sinh đẻ, ra đời',
        exampleEn: 'We celebrate the birth of our child.',
        exampleVi: 'Chúng tôi ăn mừng sự ra đời của con mình.',
        associatedActions: [
          { en: 'welcome newborn baby', vi: 'chào đón em bé sơ sinh' },
          { en: 'send congratulatory flowers', vi: 'gửi hoa chúc mừng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'adorable',
        ipa: '/əˈdɔːrəbl/',
        partOfSpeech: 'adj',
        meaningVi: 'đáng yêu',
        exampleEn: 'Your puppy is so adorable.',
        exampleVi: 'Cún con của bạn thật đáng yêu.',
        associatedActions: [
          { en: 'gently kiss forehead', vi: 'hôn nhẹ lên trán' },
          { en: 'take cute photos', vi: 'chụp những bức ảnh dễ thương' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'exhausted',
        ipa: '/ɪɡˈzɔːstɪd/',
        partOfSpeech: 'adj',
        meaningVi: 'kiệt sức',
        exampleEn: 'I was exhausted after the marathon.',
        exampleVi: 'Tôi đã kiệt sức sau cuộc chạy marathon.',
        associatedActions: [
          { en: 'nap when baby sleeps', vi: 'chợp mắt khi em bé ngủ' },
          { en: 'drink warm chamomile tea', vi: 'uống trà hoa cúc ấm' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1511295742362-92c96b124e52?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'hold',
        ipa: '/hoʊld/',
        partOfSpeech: 'verb',
        meaningVi: 'cầm, bế, ôm',
        exampleEn: 'Can you hold my bag?',
        exampleVi: 'Bạn có thể cầm giúp túi của tôi không?',
        associatedActions: [
          { en: 'cradle in arms', vi: 'bế ẵm trên tay' },
          { en: 'rock gently to sleep', vi: 'đung đưa nhẹ cho bé ngủ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'support',
        ipa: '/səˈpɔːrt/',
        partOfSpeech: 'verb',
        meaningVi: 'hỗ trợ, đỡ',
        exampleEn: 'You must support the baby\'s head.',
        exampleVi: 'Bạn phải đỡ đầu của em bé.',
        associatedActions: [
          { en: 'hold under neck', vi: 'đỡ dưới gáy em bé' },
          { en: 'assist new parents', vi: 'hỗ trợ bố mẹ mới sinh' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Congratulations on the birth of your baby.', translationVi: 'Chúc mừng sự ra đời của em bé.' },
      { phrase: 'He/She is so adorable.', translationVi: 'Cậu/Cô bé thật đáng yêu.' },
      { phrase: 'We are exhausted but happy.', translationVi: 'Chúng tôi mệt mỏi nhưng hạnh phúc.' },
      { phrase: 'He/She has your eyes.', translationVi: 'Bé có đôi mắt của bạn.' },
      { phrase: 'Would you like to hold him/her?', translationVi: 'Bạn có muốn bế bé không?' }
    ],
    aiTutorPrompt: 'You recently had a baby. The user visits you to congratulate you. Thank them, talk briefly about how tired but happy you are, and ask if they want to hold the baby.',
    tags: ['family', 'baby', 'visiting']
  },
  {
    id: 'soc-congrat-05',
    category: 'social',
    subcategory: 'congratulating',
    level: 'B1',
    titleEn: 'Congratulating on an achievement/award',
    titleVi: 'Chúc mừng một thành tựu/giải thưởng',
    icon: 'Trophy',
    situationVi: 'Bạn của bạn vừa đoạt giải nhất trong một cuộc thi nhiếp ảnh. Bạn gọi điện chúc mừng và bày tỏ sự ngưỡng mộ với tài năng của họ.',
    sampleDialogue: [
      { speaker: 'A', text: 'I just saw the news online! Huge congratulations on winning the photography contest!', translationVi: 'Mình vừa xem tin trên mạng! Chúc mừng bạn lớn nhé vì đã giành chiến thắng trong cuộc thi nhiếp ảnh!' },
      { speaker: 'B', text: 'Thank you! I am still in shock. I never thought I would actually win first place.', translationVi: 'Cảm ơn bạn! Mình vẫn còn bị sốc. Mình chưa bao giờ nghĩ mình sẽ thực sự giành giải nhất.' },
      { speaker: 'A', text: 'You totally deserve it. That photo of the mountain sunrise was breathtaking.', translationVi: 'Bạn hoàn toàn xứng đáng với điều đó. Bức ảnh bình minh trên núi đó thật sự ngoạn mục.' },
      { speaker: 'B', text: 'That means a lot coming from you. I spent weeks trying to get that perfect shot.', translationVi: 'Câu nói đó rất có ý nghĩa khi đến từ bạn. Mình đã dành nhiều tuần để cố chụp được bức ảnh hoàn hảo đó.' },
      { speaker: 'A', text: 'Well, your hard work paid off. We need to celebrate your achievement!', translationVi: 'Chà, sự chăm chỉ của bạn đã được đền đáp. Chúng ta cần ăn mừng thành tựu của bạn!' },
      { speaker: 'B', text: 'Absolutely. Let us grab dinner this Friday, my treat!', translationVi: 'Chắc chắn rồi. Thứ Sáu này chúng ta đi ăn tối nhé, mình mời!' }
    ],
    keyVocabulary: [
      {
        term: 'contest',
        ipa: '/ˈkɑːntest/',
        partOfSpeech: 'noun',
        meaningVi: 'cuộc thi',
        exampleEn: 'She entered a singing contest.',
        exampleVi: 'Cô ấy tham gia một cuộc thi hát.',
        associatedActions: [
          { en: 'submit photo entry', vi: 'nộp tác phẩm ảnh dự thi' },
          { en: 'compete against rivals', vi: 'tranh tài với đối thủ' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'deserve',
        ipa: '/dɪˈzɜːrv/',
        partOfSpeech: 'verb',
        meaningVi: 'xứng đáng',
        exampleEn: 'You deserve a break.',
        exampleVi: 'Bạn xứng đáng được nghỉ ngơi.',
        associatedActions: [
          { en: 'applaud hard work', vi: 'vỗ tay khen ngợi sự chăm chỉ' },
          { en: 'receive rightful recognition', vi: 'nhận sự công nhận xứng đáng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'breathtaking',
        ipa: '/ˈbreθteɪkɪŋ/',
        partOfSpeech: 'adj',
        meaningVi: 'ngoạn mục, đẹp đến ngộp thở',
        exampleEn: 'The view from the top is breathtaking.',
        exampleVi: 'Khung cảnh từ trên đỉnh thật ngoạn mục.',
        associatedActions: [
          { en: 'admire mountain landscape', vi: 'chiêm ngưỡng phong cảnh núi non' },
          { en: 'gaze in pure awe', vi: 'ngắm nhìn trong sự ngỡ ngàng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'achievement',
        ipa: '/əˈtʃiːvmənt/',
        partOfSpeech: 'noun',
        meaningVi: 'thành tựu',
        exampleEn: 'Winning the award is a great achievement.',
        exampleVi: 'Giành được giải thưởng là một thành tựu lớn.',
        associatedActions: [
          { en: 'hoist shiny trophy', vi: 'nâng cao cúp chiến thắng' },
          { en: 'receive first prize', vi: 'nhận giải nhất' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'treat',
        ipa: '/triːt/',
        partOfSpeech: 'noun',
        meaningVi: 'sự thiết đãi (bao, mời)',
        exampleEn: 'Put your money away, it is my treat.',
        exampleVi: 'Cất tiền đi, để tôi mời.',
        associatedActions: [
          { en: 'pay restaurant bill', vi: 'thanh toán hóa đơn nhà hàng' },
          { en: 'order delicious dessert', vi: 'gọi món tráng miệng ngon' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Huge congratulations on winning...', translationVi: 'Lời chúc mừng lớn vì đã chiến thắng...' },
      { phrase: 'I am still in shock.', translationVi: 'Tôi vẫn còn đang bị sốc (ngạc nhiên).' },
      { phrase: 'You totally deserve it.', translationVi: 'Bạn hoàn toàn xứng đáng với điều đó.' },
      { phrase: 'Your hard work paid off.', translationVi: 'Sự chăm chỉ của bạn đã được đền đáp.' },
      { phrase: 'It is my treat.', translationVi: 'Tôi mời (tôi bao).' }
    ],
    aiTutorPrompt: 'You just won a major award for your hobby (e.g., photography, art). The user calls to congratulate you. Express your surprise and gratitude, and offer to take them out to celebrate.',
    tags: ['success', 'awards', 'hobbies']
  }
];
