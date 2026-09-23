/**
 * LingoPro Speaking Topic Library
 * Category: Social
 * Subcategory: Gossiping & Rumors
 * File: src/data/speaking/topic-library/social/gossiping-rumors.ts
 *
 * 5 sub-topics covering sharing news, discussing rumors, and reacting to gossip.
 * CEFR Range: A2 - B1
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const GOSSIPING_RUMORS_ITEMS: TopicLibraryItem[] = [
  {
    id: 'soc-goss-01',
    category: 'social',
    subcategory: 'gossiping-rumors',
    level: 'A2',
    titleEn: 'Sharing exciting news about a friend',
    titleVi: 'Chia sẻ tin tức thú vị về một người bạn',
    icon: 'MessageCircle',
    situationVi: 'Bạn vừa nghe tin một người bạn chung của hai người sắp chuyển ra nước ngoài. Bạn vội vàng kể cho người bạn của mình nghe.',
    sampleDialogue: [
      { speaker: 'A', text: 'Did you hear the news about Tom?', translationVi: 'Bạn nghe tin gì về Tom chưa?' },
      { speaker: 'B', text: 'No, what happened? Is he okay?', translationVi: 'Chưa, chuyện gì vậy? Anh ấy vẫn ổn chứ?' },
      { speaker: 'A', text: 'He is more than okay. He got a job in London and is moving there next month!', translationVi: 'Anh ấy hơn cả ổn. Anh ấy nhận được việc ở London và sẽ chuyển đến đó vào tháng tới!' },
      { speaker: 'B', text: 'No way! That is huge news. I did not know he was looking for a job abroad.', translationVi: 'Không thể nào! Đó là một tin tức lớn đấy. Mình không biết là anh ấy đang tìm việc ở nước ngoài.' },
      { speaker: 'A', text: 'He kept it a secret until everything was official. We need to plan a farewell party.', translationVi: 'Anh ấy đã giữ bí mật cho đến khi mọi thứ chính thức. Chúng ta cần lên kế hoạch cho một bữa tiệc chia tay.' },
      { speaker: 'B', text: 'Definitely. Let us call him later to congratulate him.', translationVi: 'Chắc chắn rồi. Lát nữa gọi điện chúc mừng anh ấy nhé.' }
    ],
    keyVocabulary: [
      {
        term: 'news',
        ipa: '/nuːz/',
        partOfSpeech: 'noun',
        meaningVi: 'tin tức',
        exampleEn: 'I have some good news.',
        exampleVi: 'Tôi có một tin tốt.',
        associatedActions: [
          { en: 'break the news', vi: 'báo tin sốt dẻo' },
          { en: 'read the morning news', vi: 'đọc tin tức buổi sáng' },
          { en: 'spread good news', vi: 'lan truyền tin vui' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'abroad',
        ipa: '/əˈbrɔːd/',
        partOfSpeech: 'adv',
        meaningVi: 'ở nước ngoài',
        exampleEn: 'She studies abroad.',
        exampleVi: 'Cô ấy học ở nước ngoài.',
        associatedActions: [
          { en: 'travel abroad', vi: 'đi du lịch nước ngoài' },
          { en: 'study abroad', vi: 'du học nước ngoài' },
          { en: 'live abroad', vi: 'sống ở nước ngoài' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'secret',
        ipa: '/ˈsiːkrət/',
        partOfSpeech: 'noun',
        meaningVi: 'bí mật',
        exampleEn: 'Can you keep a secret?',
        exampleVi: 'Bạn có thể giữ bí mật không?',
        associatedActions: [
          { en: 'keep a secret', vi: 'giữ bí mật' },
          { en: 'reveal a secret', vi: 'tiết lộ bí mật' },
          { en: 'share a secret', vi: 'chia sẻ điều thầm kín' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'official',
        ipa: '/əˈfɪʃl/',
        partOfSpeech: 'adj',
        meaningVi: 'chính thức',
        exampleEn: 'The news is now official.',
        exampleVi: 'Tin tức bây giờ đã chính thức.',
        associatedActions: [
          { en: 'make an official announcement', vi: 'đưa ra thông báo chính thức' },
          { en: 'sign an official document', vi: 'ký văn bản chính thức' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'farewell',
        ipa: '/ˌferˈwel/',
        partOfSpeech: 'noun',
        meaningVi: 'sự chia tay, tạm biệt',
        exampleEn: 'We threw a farewell party for him.',
        exampleVi: 'Chúng tôi đã tổ chức một bữa tiệc chia tay cho anh ấy.',
        associatedActions: [
          { en: 'throw a farewell party', vi: 'tổ chức tiệc chia tay' },
          { en: 'say farewell to friends', vi: 'nói lời tạm biệt bạn bè' },
          { en: 'wave farewell', vi: 'vẫy tay chào từ biệt' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'Did you hear the news about...?', translationVi: 'Bạn đã nghe tin gì về... chưa?' },
      { phrase: 'No way!', translationVi: 'Không thể nào!' },
      { phrase: 'He kept it a secret.', translationVi: 'Anh ấy đã giữ bí mật.' },
      { phrase: 'We need to plan a farewell party.', translationVi: 'Chúng ta cần lên kế hoạch cho một bữa tiệc chia tay.' },
      { phrase: 'Let us call him to congratulate him.', translationVi: 'Hãy gọi để chúc mừng anh ấy.' }
    ],
    aiTutorPrompt: 'The user wants to tell you some exciting news about a mutual friend moving to London. Act surprised, ask questions, and agree to plan a party.',
    tags: ['news', 'friends', 'surprise']
  },
  {
    id: 'soc-goss-02',
    category: 'social',
    subcategory: 'gossiping-rumors',
    level: 'A2',
    titleEn: 'Reacting to surprising news',
    titleVi: 'Phản ứng trước tin tức bất ngờ',
    icon: 'Zap',
    situationVi: 'Một đồng nghiệp kể cho bạn nghe rằng cửa hàng yêu thích của hai người ở góc phố sắp đóng cửa vĩnh viễn. Bạn thể hiện sự ngạc nhiên và tiếc nuối.',
    sampleDialogue: [
      { speaker: 'A', text: 'Hey, I just heard that the old bookstore on the corner is closing down next week.', translationVi: 'Này, tôi vừa nghe nói tiệm sách cũ ở góc phố sẽ đóng cửa vào tuần tới.' },
      { speaker: 'B', text: 'Are you serious? I cannot believe it!', translationVi: 'Bạn nói thật chứ? Tôi không thể tin được!' },
      { speaker: 'A', text: 'It is true. The owner is retiring, and nobody wants to buy the business.', translationVi: 'Đó là sự thật. Người chủ sắp nghỉ hưu, và không ai muốn mua lại cửa hàng.' },
      { speaker: 'B', text: 'That is so sad. I have been going there since I was a kid.', translationVi: 'Buồn quá. Tôi đã đến đó từ khi còn là một đứa trẻ.' },
      { speaker: 'A', text: 'Me too. They are having a huge sale this weekend to clear everything out.', translationVi: 'Tôi cũng vậy. Cuối tuần này họ sẽ có một đợt giảm giá lớn để dọn sạch mọi thứ.' },
      { speaker: 'B', text: 'We should definitely go one last time before they close.', translationVi: 'Chúng ta chắc chắn nên đi một lần cuối trước khi họ đóng cửa.' }
    ],
    keyVocabulary: [
      {
        term: 'bookstore',
        ipa: '/ˈbʊkstɔːr/',
        partOfSpeech: 'noun',
        meaningVi: 'tiệm sách',
        exampleEn: 'I bought a novel at the bookstore.',
        exampleVi: 'Tôi đã mua một cuốn tiểu thuyết ở tiệm sách.',
        associatedActions: [
          { en: 'browse books in the bookstore', vi: 'tìm xem sách trong tiệm' },
          { en: 'buy a novel at the bookstore', vi: 'mua tiểu thuyết tại hiệu sách' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507842229451-7f01be8f5043?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'close down',
        ipa: '/kloʊz daʊn/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'đóng cửa vĩnh viễn, phá sản',
        exampleEn: 'Many local shops are closing down.',
        exampleVi: 'Nhiều cửa hàng địa phương đang phải đóng cửa.',
        associatedActions: [
          { en: 'close down the shop', vi: 'đóng cửa tiệm vĩnh viễn' },
          { en: 'shut down business operations', vi: 'ngừng hoạt động kinh doanh' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'serious',
        ipa: '/ˈsɪriəs/',
        partOfSpeech: 'adj',
        meaningVi: 'nghiêm túc, thật sự',
        exampleEn: 'Are you serious about this?',
        exampleVi: 'Bạn có nghiêm túc về chuyện này không?',
        associatedActions: [
          { en: 'have a serious talk', vi: 'có một cuộc nói chuyện nghiêm túc' },
          { en: 'look serious', vi: 'trông có vẻ nghiêm trọng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'retire',
        ipa: '/rɪˈtaɪər/',
        partOfSpeech: 'verb',
        meaningVi: 'nghỉ hưu',
        exampleEn: 'My grandfather will retire next year.',
        exampleVi: 'Ông tôi sẽ nghỉ hưu vào năm tới.',
        associatedActions: [
          { en: 'retire from work', vi: 'nghỉ hưu thôi việc' },
          { en: 'plan for retirement', vi: 'lên kế hoạch nghỉ hưu' },
          { en: 'enjoy retirement life', vi: 'tận hưởng cuộc sống hưu trí' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'clear out',
        ipa: '/klɪr aʊt/',
        partOfSpeech: 'phrasal verb',
        meaningVi: 'dọn sạch, bán tháo',
        exampleEn: 'We need to clear out the garage.',
        exampleVi: 'Chúng ta cần dọn sạch gara.',
        associatedActions: [
          { en: 'clear out old inventory', vi: 'dọn sạch hàng tồn kho cũ' },
          { en: 'clear out the closet', vi: 'dọn dẹp sạch tủ quần áo' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I just heard that...', translationVi: 'Tôi vừa nghe nói rằng...' },
      { phrase: 'Are you serious?', translationVi: 'Bạn nói thật chứ?' },
      { phrase: 'I cannot believe it!', translationVi: 'Tôi không thể tin được!' },
      { phrase: 'That is so sad.', translationVi: 'Chuyện đó thật buồn.' },
      { phrase: 'We should go one last time.', translationVi: 'Chúng ta nên đi một lần cuối.' }
    ],
    aiTutorPrompt: 'Tell the user that their favorite local bookstore is closing down. Respond to their surprise and suggest going to the closing sale together.',
    tags: ['news', 'reaction', 'community']
  },
  {
    id: 'soc-goss-03',
    category: 'social',
    subcategory: 'gossiping-rumors',
    level: 'B1',
    titleEn: 'Discussing celebrity gossip',
    titleVi: 'Bàn tán chuyện thị phi của người nổi tiếng',
    icon: 'Star',
    situationVi: 'Bạn và bạn bè đang lướt mạng và bàn tán về tin đồn hẹn hò của hai diễn viên nổi tiếng.',
    sampleDialogue: [
      { speaker: 'A', text: 'Did you see the latest pictures of Chris and Emma? People are saying they are dating.', translationVi: 'Bạn có thấy những bức ảnh mới nhất của Chris và Emma không? Mọi người đang đồn là họ hẹn hò.' },
      { speaker: 'B', text: 'I saw them! But I heard it is just a PR stunt for their new movie.', translationVi: 'Mình thấy rồi! Nhưng mình nghe nói đó chỉ là một chiêu trò PR cho bộ phim mới của họ.' },
      { speaker: 'A', text: 'You think so? They looked pretty cozy in those paparazzi shots at the restaurant.', translationVi: 'Bạn nghĩ vậy sao? Họ trông khá thân mật trong những bức ảnh paparazzi chụp tại nhà hàng.' },
      { speaker: 'B', text: 'You cannot trust everything you see on the internet. Besides, Emma just broke up with her boyfriend.', translationVi: 'Bạn không thể tin mọi thứ bạn thấy trên mạng đâu. Ngoài ra, Emma vừa mới chia tay bạn trai.' },
      { speaker: 'A', text: 'True. I guess we will have to wait and see if they confirm anything.', translationVi: 'Đúng vậy. Mình đoán chúng ta sẽ phải chờ xem họ có xác nhận điều gì không.' },
      { speaker: 'B', text: 'Either way, it is definitely good marketing for the film.', translationVi: 'Dù sao đi nữa, đó chắc chắn là cách tiếp thị tốt cho bộ phim.' }
    ],
    keyVocabulary: [
      {
        term: 'dating',
        ipa: '/ˈdeɪtɪŋ/',
        partOfSpeech: 'noun/verb',
        meaningVi: 'hẹn hò',
        exampleEn: 'They have been dating for a year.',
        exampleVi: 'Họ đã hẹn hò được một năm.',
        associatedActions: [
          { en: 'go on a romantic date', vi: 'đi hẹn hò lãng mạn' },
          { en: 'start dating someone', vi: 'bắt đầu hẹn hò ai đó' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'stunt',
        ipa: '/stʌnt/',
        partOfSpeech: 'noun',
        meaningVi: 'chiêu trò',
        exampleEn: 'It was a publicity stunt.',
        exampleVi: 'Đó là một chiêu trò đánh bóng tên tuổi.',
        associatedActions: [
          { en: 'pull a publicity stunt', vi: 'tung chiêu trò đánh bóng tên tuổi' },
          { en: 'stage a promotional stunt', vi: 'dàn dựng chiêu trò quảng bá' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'cozy',
        ipa: '/ˈkoʊzi/',
        partOfSpeech: 'adj',
        meaningVi: 'ấm cúng, thân mật',
        exampleEn: 'They looked very cozy together.',
        exampleVi: 'Trông họ rất thân mật bên nhau.',
        associatedActions: [
          { en: 'sit in a cozy cafe', vi: 'ngồi trong quán cà phê ấm cúng' },
          { en: 'make the room cozy', vi: 'làm cho căn phòng ấm cúng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'trust',
        ipa: '/trʌst/',
        partOfSpeech: 'verb',
        meaningVi: 'tin tưởng',
        exampleEn: 'I do not trust rumors.',
        exampleVi: 'Tôi không tin vào những tin đồn.',
        associatedActions: [
          { en: 'build mutual trust', vi: 'xây dựng lòng tin lẫn nhau' },
          { en: 'gain someone\'s trust', vi: 'chiếm được lòng tin của ai đó' },
          { en: 'trust a close friend', vi: 'tin tưởng người bạn thân' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'confirm',
        ipa: '/kənˈfɜːrm/',
        partOfSpeech: 'verb',
        meaningVi: 'xác nhận',
        exampleEn: 'The agency confirmed the news.',
        exampleVi: 'Công ty đại diện đã xác nhận tin tức.',
        associatedActions: [
          { en: 'confirm the details', vi: 'xác nhận các chi tiết' },
          { en: 'confirm an appointment', vi: 'xác nhận cuộc hẹn' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'People are saying they are dating.', translationVi: 'Mọi người đang đồn là họ hẹn hò.' },
      { phrase: 'I heard it is just a PR stunt.', translationVi: 'Tôi nghe nói đó chỉ là một chiêu trò PR.' },
      { phrase: 'You cannot trust everything you see.', translationVi: 'Bạn không thể tin mọi thứ bạn thấy.' },
      { phrase: 'We will have to wait and see.', translationVi: 'Chúng ta sẽ phải chờ xem sao.' },
      { phrase: 'Either way, it is good marketing.', translationVi: 'Dù sao đi nữa, đó cũng là cách marketing tốt.' }
    ],
    aiTutorPrompt: 'You and the user are discussing a rumor that two famous actors are dating. You are skeptical and think it is just a publicity stunt for their upcoming movie. Discuss this with the user.',
    tags: ['celebrity', 'rumors', 'entertainment']
  },
  {
    id: 'soc-goss-04',
    category: 'social',
    subcategory: 'gossiping-rumors',
    level: 'B1',
    titleEn: 'Dealing with rumors about yourself',
    titleVi: 'Đối phó với tin đồn về bản thân',
    icon: 'Shield',
    situationVi: 'Bạn phát hiện ra có người ở công ty đang tung tin đồn thất thiệt rằng bạn sắp nghỉ việc. Bạn đính chính lại với một đồng nghiệp thân thiết.',
    sampleDialogue: [
      { speaker: 'A', text: 'Hey, can I talk to you for a second? Someone told me a weird rumor going around the office.', translationVi: 'Này, tôi nói chuyện với bạn một lát được không? Có người kể cho tôi nghe một tin đồn kỳ lạ đang lan truyền trong văn phòng.' },
      { speaker: 'B', text: 'What is it? Is it about the new manager?', translationVi: 'Chuyện gì vậy? Về người quản lý mới à?' },
      { speaker: 'A', text: 'No, it is about me. Apparently, people are saying I am quitting to join our competitor.', translationVi: 'Không, là về tôi. Có vẻ như mọi người đang đồn rằng tôi sắp nghỉ việc để đầu quân cho đối thủ cạnh tranh.' },
      { speaker: 'B', text: 'What? That is ridiculous! I know you love working here.', translationVi: 'Cái gì? Thật nực cười! Tôi biết bạn rất thích làm việc ở đây mà.' },
      { speaker: 'A', text: 'Exactly. It is completely false. I have no idea who started it.', translationVi: 'Chính xác. Điều đó hoàn toàn sai sự thật. Tôi không biết ai đã bắt đầu chuyện đó.' },
      { speaker: 'B', text: 'Just ignore it. If anyone asks me, I will tell them it is not true.', translationVi: 'Cứ lờ nó đi. Nếu có ai hỏi tôi, tôi sẽ nói với họ đó không phải là sự thật.' }
    ],
    keyVocabulary: [
      {
        term: 'weird',
        ipa: '/wɪrd/',
        partOfSpeech: 'adj',
        meaningVi: 'kỳ lạ',
        exampleEn: 'That is a weird rumor.',
        exampleVi: 'Đó là một tin đồn kỳ lạ.',
        associatedActions: [
          { en: 'hear a weird noise', vi: 'nghe thấy tiếng động kỳ lạ' },
          { en: 'feel weird about something', vi: 'cảm thấy kỳ quặc về điều gì đó' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'rumor',
        ipa: '/ˈruːmər/',
        partOfSpeech: 'noun',
        meaningVi: 'tin đồn',
        exampleEn: 'I heard a rumor about you.',
        exampleVi: 'Tôi nghe một tin đồn về bạn.',
        associatedActions: [
          { en: 'spread a false rumor', vi: 'lan truyền tin đồn thất thiệt' },
          { en: 'deny a rumor', vi: 'bác bỏ tin đồn' },
          { en: 'hear an office rumor', vi: 'nghe tin đồn nơi công sở' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'apparently',
        ipa: '/əˈpærəntli/',
        partOfSpeech: 'adv',
        meaningVi: 'có vẻ như, nghe nói là',
        exampleEn: 'Apparently, it is going to rain.',
        exampleVi: 'Nghe nói là trời sắp mưa.',
        associatedActions: [
          { en: 'learn what apparently happened', vi: 'tìm hiểu điều nghe nói đã xảy ra' },
          { en: 'accept facts apparently true', vi: 'chấp nhận sự việc có vẻ đúng' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'ridiculous',
        ipa: '/rɪˈdɪkjələs/',
        partOfSpeech: 'adj',
        meaningVi: 'nực cười',
        exampleEn: 'That idea is ridiculous.',
        exampleVi: 'Ý tưởng đó thật nực cười.',
        associatedActions: [
          { en: 'laugh at a ridiculous rumor', vi: 'cười trước tin đồn nực cười' },
          { en: 'dismiss a ridiculous claim', vi: 'bác bỏ khẳng định vô lý' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'false',
        ipa: '/fɔːls/',
        partOfSpeech: 'adj',
        meaningVi: 'sai sự thật',
        exampleEn: 'The story was completely false.',
        exampleVi: 'Câu chuyện hoàn toàn sai sự thật.',
        associatedActions: [
          { en: 'expose a false statement', vi: 'vạch trần phát biểu sai sự thật' },
          { en: 'prove a rumor false', vi: 'chứng minh tin đồn là sai' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'There is a weird rumor going around.', translationVi: 'Có một tin đồn kỳ lạ đang lan truyền.' },
      { phrase: 'People are saying I am...', translationVi: 'Mọi người đang nói rằng tôi...' },
      { phrase: 'That is ridiculous!', translationVi: 'Thật nực cười!' },
      { phrase: 'It is completely false.', translationVi: 'Nó hoàn toàn sai sự thật.' },
      { phrase: 'I have no idea who started it.', translationVi: 'Tôi không biết ai đã bắt đầu nó.' }
    ],
    aiTutorPrompt: 'The user is your coworker. They come to you upset because there is a false rumor that they are quitting their job. Reassure them, express disbelief at the rumor, and promise to support them.',
    tags: ['work', 'rumors', 'support']
  },
  {
    id: 'soc-goss-05',
    category: 'social',
    subcategory: 'gossiping-rumors',
    level: 'B1',
    titleEn: 'Changing the subject from gossip',
    titleVi: 'Đổi chủ đề khi bị cuốn vào chuyện thị phi',
    icon: 'CornerUpRight',
    situationVi: 'Trong một buổi tiệc, một người bạn bắt đầu nói xấu về một người vắng mặt. Bạn không muốn tham gia vào việc nói xấu nên khéo léo đổi chủ đề.',
    sampleDialogue: [
      { speaker: 'A', text: 'Did you see what Sarah was wearing today? It was so inappropriate for the office.', translationVi: 'Bạn có thấy Sarah mặc gì hôm nay không? Nó quá không phù hợp với văn phòng.' },
      { speaker: 'B', text: 'I did not really notice, to be honest.', translationVi: 'Nói thật là mình không để ý lắm.' },
      { speaker: 'A', text: 'Well, everyone was staring. I think she is just trying to get attention from the boss.', translationVi: 'Chà, mọi người đều nhìn chằm chằm. Mình nghĩ cô ấy chỉ đang cố gây sự chú ý với sếp.' },
      { speaker: 'B', text: 'I am not comfortable talking about her behind her back. Anyway, how is your new project going?', translationVi: 'Mình không thoải mái khi nói về cô ấy sau lưng. Dù sao thì, dự án mới của bạn thế nào rồi?' },
      { speaker: 'A', text: 'Oh... um, it is going well. We are almost finished.', translationVi: 'Ồ... ừm, nó đang tiến triển tốt. Chúng mình sắp xong rồi.' },
      { speaker: 'B', text: 'That is great. Have you faced any major challenges with it?', translationVi: 'Tuyệt quá. Bạn có gặp khó khăn lớn nào với nó không?' }
    ],
    keyVocabulary: [
      {
        term: 'inappropriate',
        ipa: '/ˌɪnəˈproʊpriət/',
        partOfSpeech: 'adj',
        meaningVi: 'không phù hợp',
        exampleEn: 'His behavior was inappropriate.',
        exampleVi: 'Hành vi của anh ấy không phù hợp.',
        associatedActions: [
          { en: 'call out inappropriate remarks', vi: 'nhắc nhở lời nói không phù hợp' },
          { en: 'avoid inappropriate topics', vi: 'tránh các chủ đề không thích hợp' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'stare',
        ipa: '/ster/',
        partOfSpeech: 'verb',
        meaningVi: 'nhìn chằm chằm',
        exampleEn: 'It is rude to stare at people.',
        exampleVi: 'Nhìn chằm chằm vào người khác là bất lịch sự.',
        associatedActions: [
          { en: 'stare into the distance', vi: 'nhìn chằm chằm vào khoảng xa' },
          { en: 'stare in surprise', vi: 'nhìn chằm chằm vì kinh ngạc' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'attention',
        ipa: '/əˈtenʃn/',
        partOfSpeech: 'noun',
        meaningVi: 'sự chú ý',
        exampleEn: 'She likes to be the center of attention.',
        exampleVi: 'Cô ấy thích là trung tâm của sự chú ý.',
        associatedActions: [
          { en: 'pay close attention', vi: 'chú ý lắng nghe kỹ lưỡng' },
          { en: 'draw public attention', vi: 'thu hút sự chú ý của công chúng' },
          { en: 'get someone\'s attention', vi: 'thu hút sự chú ý của ai đó' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'comfortable',
        ipa: '/ˈkʌmftərbəl/',
        partOfSpeech: 'adj',
        meaningVi: 'thoải mái',
        exampleEn: 'I am not comfortable with this plan.',
        exampleVi: 'Tôi không thấy thoải mái với kế hoạch này.',
        associatedActions: [
          { en: 'feel comfortable sharing thoughts', vi: 'cảm thấy thoải mái chia sẻ suy nghĩ' },
          { en: 'make someone feel comfortable', vi: 'làm cho ai đó cảm thấy dễ chịu' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'
      },
      {
        term: 'challenge',
        ipa: '/ˈtʃælɪndʒ/',
        partOfSpeech: 'noun',
        meaningVi: 'thử thách, khó khăn',
        exampleEn: 'We face many challenges.',
        exampleVi: 'Chúng tôi phải đối mặt với nhiều thử thách.',
        associatedActions: [
          { en: 'face a tough challenge', vi: 'đối mặt thử thách cam go' },
          { en: 'overcome a big challenge', vi: 'vượt qua thử thách lớn' },
          { en: 'accept a new challenge', vi: 'chấp nhận một thử thách mới' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?auto=format&fit=crop&w=800&q=80'
      }
    ],
    usefulPhrases: [
      { phrase: 'I did not really notice, to be honest.', translationVi: 'Nói thật là tôi không thực sự để ý.' },
      { phrase: 'I am not comfortable talking about her.', translationVi: 'Tôi không thoải mái khi nói về cô ấy.' },
      { phrase: 'Talking behind someone\'s back.', translationVi: 'Nói xấu sau lưng ai đó.' },
      { phrase: 'Anyway, how is your...', translationVi: 'Dù sao thì, ... của bạn thế nào rồi?' },
      { phrase: 'Have you faced any challenges?', translationVi: 'Bạn có gặp khó khăn nào không?' }
    ],
    aiTutorPrompt: 'You try to gossip with the user about a coworker named Sarah. The user will tell you they are uncomfortable and try to change the subject. Act slightly embarrassed and follow their new topic.',
    tags: ['gossip', 'polite', 'boundaries']
  }
];
