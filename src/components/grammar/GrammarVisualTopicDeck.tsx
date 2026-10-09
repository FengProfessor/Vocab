'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Volume2, Sparkles, Lightbulb, CheckCircle2 } from 'lucide-react';
import { grammarAudio } from '@/lib/grammar/grammarAudioManager';
import PronounVisualDeck, { HighlightedSentence } from './PronounVisualDeck';
import SvoSentenceVisualDeck from './SvoSentenceVisualDeck';
import type { GrammarTheoryData } from './GrammarReferenceTable';
import topicAssetsData from '@/data/grammar-topic-assets.json';
import GrammarCardNavigator from './GrammarCardNavigator';
import FormattedText from './FormattedText';

export interface VisualDeckExample {
  en: string;
  vi: string;
  highlightWord?: string;
  image?: string;
}

export interface VisualDeckCard {
  title: string;
  badge: string;
  category?: string;
  image: string;
  audio?: string;
  examples: VisualDeckExample[];
  tip?: string;
  ruleSummary?: string;
  accentColor?: string;
}

interface TopicAssetItem {
  image?: string;
  imageAlt?: string;
  caption?: string;
  usageAnalysisVi?: {
    rule?: string;
    contextReason?: string;
    commonMistake?: string;
  };
  audio?: string;
}

// ============================================================================
// CURATED FOUNDATIONAL DECKS (Top Beginner Topics with 4 Simple Sentences Each)
// ============================================================================

export const CURATED_TOPIC_DECKS: Record<string, { subtitle: string; cards: VisualDeckCard[] }> = {
  // 1. Verb to be (am / is / are)
  'verb-to-be': {
    subtitle: 'Nhận diện và sử dụng chuẩn xác 3 dạng am, is, are qua tình huống hàng ngày',
    cards: [
      {
        title: 'AM (Chủ ngữ I)',
        badge: 'Tôi / Mình (Ngôi 1)',
        category: 'am',
        image: '/grammar/topics/verb-to-be/01.webp',
        audio: '/grammar/topics/verb-to-be/01.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'I am a student.', vi: 'Tôi là học sinh.', highlightWord: 'am' },
          { en: 'I am happy today.', vi: 'Hôm nay tôi rất vui vẻ.', highlightWord: 'am' },
          { en: 'I am twenty years old.', vi: 'Tôi 20 tuổi.', highlightWord: 'am' },
          { en: 'I am not tired at all.', vi: 'Tôi không hề mệt chút nào.', highlightWord: 'am' },
        ],
        tip: 'Chủ ngữ "I" luôn luôn đi với "am". Dạng viết tắt là "I\'m". Dạng phủ định là "I am not" (hoặc "I\'m not").',
        ruleSummary: 'Khẳng định: I am ... · Phủ định: I am not ... · Câu hỏi: Am I ...?',
      },
      {
        title: 'IS (He / She / It / Danh từ số ít)',
        badge: 'Anh ấy / Cô ấy / Nó (Ngôi 3 số ít)',
        category: 'is',
        image: '/grammar/topics/verb-to-be/02.webp',
        audio: '/grammar/topics/verb-to-be/02.mp3',
        accentColor: '#f43f5e',
        examples: [
          { en: 'She is very happy.', vi: 'Cô ấy rất vui vẻ.', highlightWord: 'is' },
          { en: 'He is my best friend.', vi: 'Cậu ấy là bạn thân của tôi.', highlightWord: 'is' },
          { en: 'It is a sunny day.', vi: 'Hôm nay trời nắng đẹp.', highlightWord: 'is' },
          { en: 'My cat is very cute.', vi: 'Chú mèo của tôi rất dễ thương.', highlightWord: 'is' },
        ],
        tip: 'He, She, It hoặc 1 người / 1 vật luôn đi với "is". Viết tắt: He\'s, She\'s, It\'s. Phủ định là "isn\'t".',
        ruleSummary: 'Khẳng định: He/She/It is ... · Phủ định: is not (isn\'t) · Câu hỏi: Is he/she/it ...?',
      },
      {
        title: 'ARE (You / We / They / Danh từ số nhiều)',
        badge: 'Bạn / Chúng tôi / Họ (Số nhiều)',
        category: 'are',
        image: '/grammar/topics/verb-to-be/03.webp',
        audio: '/grammar/topics/verb-to-be/03.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'You are very kind.', vi: 'Bạn rất tốt bụng.', highlightWord: 'are' },
          { en: 'We are ready to learn.', vi: 'Chúng tôi đã sẵn sàng học tập.', highlightWord: 'are' },
          { en: 'They are in the garden.', vi: 'Họ đang ở trong vườn.', highlightWord: 'are' },
          { en: 'The books are on the desk.', vi: 'Những cuốn sách ở trên bàn học.', highlightWord: 'are' },
        ],
        tip: 'You, We, They hoặc từ 2 người / 2 vật trở lên luôn đi với "are". Viết tắt: You\'re, We\'re, They\'re. Phủ định là "aren\'t".',
        ruleSummary: 'Khẳng định: You/We/They are ... · Phủ định: are not (aren\'t) · Câu hỏi: Are you/we/they ...?',
      },
      {
        title: 'CÂU HỎI VỚI TO BE (Yes/No Questions)',
        badge: 'Đảo to be lên trước chủ ngữ',
        category: 'questions',
        image: '/grammar/topics/verb-to-be/04.webp',
        audio: '/grammar/topics/verb-to-be/04.mp3',
        accentColor: '#8b5cf6',
        examples: [
          { en: 'Are you ready?', vi: 'Bạn đã sẵn sàng chưa?', highlightWord: 'Are' },
          { en: 'Is he your teacher?', vi: 'Thầy ấy có phải giáo viên của bạn không?', highlightWord: 'Is' },
          { en: 'Are they your classmates?', vi: 'Họ có phải bạn cùng lớp của bạn không?', highlightWord: 'Are' },
          { en: 'Is it cold outside?', vi: 'Ngoài trời có lạnh không?', highlightWord: 'Is' },
        ],
        tip: 'Khi đặt câu hỏi, chỉ cần đảo "Am / Is / Are" lên đầu câu đứng trước chủ ngữ. Trả lời: Yes, I am. / No, I\'m not.',
        ruleSummary: 'Am/Is/Are + S + Tính từ / Danh từ / Nơi chốn?',
      },
    ],
  },

  // 2. Demonstratives (this, that, these, those)
  'demonstratives': {
    subtitle: 'Xác định khoảng cách (gần/xa) và số lượng (số ít/số nhiều) dễ nhớ',
    cards: [
      {
        title: 'THIS (Cái này / Người này)',
        badge: '1 vật hoặc người ở GẦN',
        category: 'singular-near',
        image: '/grammar/topics/demonstratives/01.webp',
        audio: '/grammar/topics/demonstratives/01.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'This is my book.', vi: 'Đây là cuốn sách của tôi.' },
          { en: 'This coffee is very hot.', vi: 'Cốc cà phê này nóng quá.' },
          { en: 'This is my friend Nam.', vi: 'Đây là Nam, bạn của mình.' },
          { en: 'Do you like this shirt?', vi: 'Bạn có thích chiếc áo này không?' },
        ],
        tip: '"This" dùng cho 1 vật hoặc 1 người ở ngay gần bạn hoặc trong tầm tay. Luôn đi với động từ "is".',
        ruleSummary: 'This + danh từ số ít + is ... (Ví dụ: This car is new)',
      },
      {
        title: 'THAT (Cái kia / Người kia)',
        badge: '1 vật hoặc người ở XA',
        category: 'singular-far',
        image: '/grammar/topics/demonstratives/02.webp',
        audio: '/grammar/topics/demonstratives/02.mp3',
        accentColor: '#0ea5e9',
        examples: [
          { en: 'That building is a museum.', vi: 'Tòa nhà đằng kia là viện bảo tàng.' },
          { en: 'That is my car over there.', vi: 'Chiếc xe đằng kia là của tôi.' },
          { en: 'Who is that girl?', vi: 'Cô gái đằng kia là ai thế?' },
          { en: 'That was a wonderful trip!', vi: 'Đó từng là một chuyến đi tuyệt vời!' },
        ],
        tip: '"That" dùng cho 1 vật hoặc 1 người ở xa bạn (ngoài tầm với). Luôn đi với động từ "is".',
        ruleSummary: 'That + danh từ số ít + is ... (Ví dụ: That house is big)',
      },
      {
        title: 'THESE (Những cái này / Những người này)',
        badge: 'Nhiều vật hoặc người ở GẦN',
        category: 'plural-near',
        image: '/grammar/topics/demonstratives/03.webp',
        audio: '/grammar/topics/demonstratives/03.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'These books are very useful.', vi: 'Những cuốn sách này rất hữu ích.' },
          { en: 'These apples are sweet.', vi: 'Những quả táo này ngọt lắm.' },
          { en: 'These are my new glasses.', vi: 'Đây là chiếc kính mắt mới của tôi.' },
          { en: 'Look at these pictures!', vi: 'Hãy nhìn những bức ảnh này xem!' },
        ],
        tip: '"These" là dạng số nhiều của "This". Dùng cho từ 2 vật/người trở lên ở gần. Luôn đi với "are" và danh từ số nhiều.',
        ruleSummary: 'These + danh từ số nhiều + are ... (Ví dụ: These pens are mine)',
      },
      {
        title: 'THOSE (Những cái kia / Những người kia)',
        badge: 'Nhiều vật hoặc người ở XA',
        category: 'plural-far',
        image: '/grammar/topics/demonstratives/04.webp',
        audio: '/grammar/topics/demonstratives/04.mp3',
        accentColor: '#a855f7',
        examples: [
          { en: 'Those mountains are beautiful.', vi: 'Những ngọn núi đằng xa kia thật đẹp.' },
          { en: 'Those cars are very fast.', vi: 'Những chiếc xe hơi đằng kia chạy rất nhanh.' },
          { en: 'Are those your shoes?', vi: 'Đó có phải là đôi giày của bạn đằng kia không?' },
          { en: 'Those children are playing outside.', vi: 'Những đứa trẻ đằng kia đang chơi ngoài trời.' },
        ],
        tip: '"Those" là dạng số nhiều của "That". Dùng cho từ 2 vật/người trở lên ở đằng xa. Luôn đi với "are" và danh từ số nhiều.',
        ruleSummary: 'Those + danh từ số nhiều + are ... (Ví dụ: Those birds are flying)',
      },
    ],
  },

  // 3. There is / There are
  'there-is-there-are': {
    subtitle: 'Nói về sự tồn tại hoặc hiện diện của người và vật',
    cards: [
      {
        title: 'THERE IS (Có 1 vật / Số ít)',
        badge: '1 vật hoặc danh từ không đếm được',
        category: 'there-is',
        image: '/grammar/topics/there-is-there-are/01.webp',
        audio: '/grammar/topics/there-is-there-are/01.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'There is a cat on the chair.', vi: 'Có một con mèo ở trên ghế.' },
          { en: 'There is an apple on the table.', vi: 'Có một quả táo trên bàn.' },
          { en: 'There is some water in the bottle.', vi: 'Có một ít nước trong chai.' },
          { en: 'There is a pharmacy near my house.', vi: 'Có một hiệu thuốc ở gần nhà tôi.' },
        ],
        tip: 'Dùng "There is" (viết tắt: There\'s) khi danh từ phía sau là số ít (a/an) hoặc không đếm được (water, milk, bread).',
        ruleSummary: 'There is + a / an + danh từ số ít (hoặc danh từ không đếm được)',
      },
      {
        title: 'THERE ARE (Có nhiều vật / Số nhiều)',
        badge: 'Từ 2 vật hoặc người trở lên',
        category: 'there-are',
        image: '/grammar/topics/there-is-there-are/02.webp',
        audio: '/grammar/topics/there-is-there-are/02.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'There are two messages for you.', vi: 'Có hai tin nhắn dành cho bạn.' },
          { en: 'There are many students in the room.', vi: 'Có nhiều học sinh ở trong phòng.' },
          { en: 'There are four chairs around the table.', vi: 'Có bốn chiếc ghế quanh bàn.' },
          { en: 'There are seven days in a week.', vi: 'Có 7 ngày trong một tuần.' },
        ],
        tip: 'Dùng "There are" khi danh từ theo sau là số nhiều (có đuôi -s/-es hoặc bất quy tắc như children, people).',
        ruleSummary: 'There are + số lượng / many / two + danh từ số nhiều',
      },
      {
        title: 'PHỦ ĐỊNH (There isn\'t / There aren\'t)',
        badge: 'Không có người hoặc vật nào',
        category: 'negative',
        image: '/grammar/topics/there-is-there-are/03.webp',
        audio: '/grammar/topics/there-is-there-are/03.mp3',
        accentColor: '#f43f5e',
        examples: [
          { en: 'There isn\'t any milk left.', vi: 'Không còn chút sữa nào cả.' },
          { en: 'There isn\'t a problem here.', vi: 'Không có vấn đề gì ở đây cả.' },
          { en: 'There aren\'t any empty seats.', vi: 'Không còn chỗ ngồi trống nào cả.' },
          { en: 'There aren\'t many cars today.', vi: 'Hôm nay không có nhiều xe cộ.' },
        ],
        tip: 'Trong câu phủ định, thường dùng "any" đi kèm: There isn\'t any + không đếm được; There aren\'t any + số nhiều.',
        ruleSummary: 'There isn\'t (any) ... · There aren\'t (any) ...',
      },
      {
        title: 'CÂU HỎI (Is there...? / Are there...?)',
        badge: 'Hỏi xem có hay không',
        category: 'questions',
        image: '/grammar/topics/there-is-there-are/04.webp',
        audio: '/grammar/topics/there-is-there-are/04.mp3',
        accentColor: '#8b5cf6',
        examples: [
          { en: 'Is there a bank near here?', vi: 'Có ngân hàng nào ở gần đây không?' },
          { en: 'Is there any water in the fridge?', vi: 'Có nước trong tủ lạnh không?' },
          { en: 'Are there enough chairs for everyone?', vi: 'Có đủ ghế cho mọi người không?' },
          { en: 'How many books are there in your bag?', vi: 'Có bao nhiêu cuốn sách trong túi bạn?' },
        ],
        tip: 'Đảo "Is" hoặc "Are" lên đầu câu. Trả lời ngắn: Yes, there is. / No, there isn\'t. hoặc Yes, there are. / No, there aren\'t.',
        ruleSummary: 'Is there a/any ...? · Are there any ...?',
      },
    ],
  },

  // 4. Articles (a / an / the)
  'articles': {
    subtitle: 'Cách dùng a, an, the chuẩn xác nhất và trường hợp không dùng mạo từ',
    cards: [
      {
        title: 'A (Một - Trước phụ âm)',
        badge: '1 vật chưa xác định, bắt đầu bằng phụ âm',
        category: 'a',
        image: '/grammar/topics/articles/01.webp',
        audio: '/grammar/topics/articles/01.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'I have a book.', vi: 'Tôi có một cuốn sách.' },
          { en: 'She is a friendly teacher.', vi: 'Cô ấy là một giáo viên thân thiện.' },
          { en: 'He drives a blue car.', vi: 'Anh ấy lái một chiếc xe màu xanh.' },
          { en: 'There is a cat in the garden.', vi: 'Có một con mèo trong vườn.' },
        ],
        tip: 'Dùng "a" trước danh từ số ít đếm được bắt đầu bằng PHỤ ÂM phát âm: a book, a cat, a dog, a university (phát âm /ju:/).',
        ruleSummary: 'a + phụ âm (a pen, a boy, a doctor)',
      },
      {
        title: 'AN (Một - Trước nguyên âm)',
        badge: 'Bắt đầu bằng nguyên âm: u, e, o, a, i',
        category: 'an',
        image: '/grammar/topics/articles/02.webp',
        audio: '/grammar/topics/articles/02.mp3',
        accentColor: '#0ea5e9',
        examples: [
          { en: 'I have an apple.', vi: 'Tôi có một quả táo.' },
          { en: 'She eats an orange every day.', vi: 'Cô ấy ăn một quả cam mỗi ngày.' },
          { en: 'Take an umbrella with you.', vi: 'Hãy mang theo một chiếc ô nhé.' },
          { en: 'It took an hour to finish.', vi: 'Mất một giờ đồng hồ để hoàn thành.' },
        ],
        tip: 'Dùng "an" trước danh từ bắt đầu bằng NGUYÊN ÂM phát âm (u, e, o, a, i - mẹo nhớ: uể oải): an apple, an egg, an hour (chữ h câm).',
        ruleSummary: 'an + nguyên âm phát âm (an apple, an hour, an idea)',
      },
      {
        title: 'THE (Cụ thể / Đã biết / Duy nhất)',
        badge: 'Vật cụ thể mà cả hai người đều biết',
        category: 'the',
        image: '/grammar/topics/articles/03.webp',
        audio: '/grammar/topics/articles/03.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'I am reading the book.', vi: 'Tôi đang đọc cuốn sách đó (cuốn sách cụ thể).' },
          { en: 'The sun rises in the east.', vi: 'Mặt trời mọc ở hướng đông (duy nhất).' },
          { en: 'Please close the door.', vi: 'Làm ơn đóng cánh cửa lại giúp tôi.' },
          { en: 'I saw a dog. The dog was big.', vi: 'Tôi thấy một con chó. Con chó đó rất to (nhắc lại lần 2).' },
        ],
        tip: 'Dùng "the" cho vật đã được nhắc đến trước đó, vật mà người nghe và người nói đều biết rõ, hoặc vật thể duy nhất (the sun, the moon, the sky).',
        ruleSummary: 'the + vật thể cụ thể / xác định / duy nhất',
      },
      {
        title: 'ZERO ARTICLE (Không dùng mạo từ ∅)',
        badge: 'Nói chung chung hoặc tên bữa ăn',
        category: 'zero',
        image: '/grammar/topics/articles/04.webp',
        audio: '/grammar/topics/articles/04.mp3',
        accentColor: '#f59e0b',
        examples: [
          { en: 'Dogs are loyal animals.', vi: 'Chó là loài vật trung thành (nói chung).' },
          { en: 'I love drinking milk.', vi: 'Tôi thích uống sữa (chất lỏng không đếm được).' },
          { en: 'We have breakfast at 7 a.m.', vi: 'Chúng tôi ăn sáng lúc 7 giờ (bữa ăn).' },
          { en: 'She plays tennis on Sundays.', vi: 'Cô ấy chơi quần vợt vào Chủ nhật (môn thể thao).' },
        ],
        tip: 'KHÔNG dùng a/an/the trước: danh từ số nhiều nói chung, danh từ không đếm được nói chung, tên bữa ăn (breakfast, dinner), và môn thể thao (football, tennis).',
        ruleSummary: '∅ + số nhiều nói chung · ∅ + bữa ăn · ∅ + thể thao',
      },
    ],
  },

  // 5. Possessives (my, your, his, her, our, their)
  'possessives': {
    subtitle: 'Phân biệt rành mạch tính từ sở hữu (+ danh từ) và đại từ sở hữu (đứng độc lập)',
    cards: [
      {
        title: 'MY & MINE (Của tôi)',
        badge: 'Ngôi thứ nhất số ít',
        category: 'my-mine',
        image: '/grammar/topics/possessives/01.webp',
        audio: '/grammar/topics/possessives/01.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'This is my notebook.', vi: 'Đây là cuốn vở của tôi.' },
          { en: 'The car is mine.', vi: 'Chiếc xe hơi đó là của tôi.' },
          { en: 'My mother is a doctor.', vi: 'Mẹ của tôi là một bác sĩ.' },
          { en: 'That bag is mine, not yours.', vi: 'Cái túi đó là của tôi, không phải của bạn.' },
        ],
        tip: '"My" bắt buộc có danh từ theo sau (my pen). "Mine" đứng một mình làm đại từ thay thế (This pen is mine).',
        ruleSummary: 'Tính từ sở hữu: my + N · Đại từ sở hữu: mine (đứng độc lập)',
      },
      {
        title: 'YOUR & YOURS (Của bạn)',
        badge: 'Ngôi thứ hai đối thoại',
        category: 'your-yours',
        image: '/grammar/topics/possessives/02.webp',
        audio: '/grammar/topics/possessives/02.mp3',
        accentColor: '#14b8a6',
        examples: [
          { en: 'Is this your phone?', vi: 'Đây có phải điện thoại của bạn không?' },
          { en: 'The choice is yours.', vi: 'Quyết định là của bạn.' },
          { en: 'Your house is very lovely.', vi: 'Ngôi nhà của bạn rất xinh xắn.' },
          { en: 'My coat is red, yours is black.', vi: 'Áo khoác tôi màu đỏ, của bạn màu đen.' },
        ],
        tip: '"Your" + danh từ (your key). "Yours" có thêm chữ s, đứng một mình không cần danh từ phía sau.',
        ruleSummary: 'Tính từ sở hữu: your + N · Đại từ sở hữu: yours',
      },
      {
        title: 'HIS & HER / HERS (Của anh ấy & Của cô ấy)',
        badge: 'Ngôi thứ ba số ít',
        category: 'his-her',
        image: '/grammar/topics/possessives/03.webp',
        audio: '/grammar/topics/possessives/03.mp3',
        accentColor: '#f43f5e',
        examples: [
          { en: 'His father is a teacher.', vi: 'Bố của anh ấy là một giáo viên.' },
          { en: 'The bicycle is his.', vi: 'Chiếc xe đạp đó là của anh ấy.' },
          { en: 'Her dress is very pretty.', vi: 'Chiếc váy của cô ấy rất đẹp.' },
          { en: 'This notebook is hers.', vi: 'Cuốn sổ này là của cô ấy.' },
        ],
        tip: '"His" vừa là tính từ (his car) vừa là đại từ (it is his). Với nữ: "her" là tính từ (her dog), "hers" là đại từ (the dog is hers).',
        ruleSummary: 'Nam: his (cả 2 dạng) · Nữ: her + N / hers (độc lập)',
      },
      {
        title: 'OUR / OURS & THEIR / THEIRS (Của chúng tôi & Của họ)',
        badge: 'Ngôi thứ nhất & thứ ba số nhiều',
        category: 'our-their',
        image: '/grammar/topics/possessives/04.webp',
        audio: '/grammar/topics/possessives/04.mp3',
        accentColor: '#a855f7',
        examples: [
          { en: 'Our school is very modern.', vi: 'Trường học của chúng tôi rất hiện đại.' },
          { en: 'Their house is next to ours.', vi: 'Nhà của họ ở ngay cạnh nhà chúng tôi.' },
          { en: 'The future is ours.', vi: 'Tương lai thuộc về chúng ta.' },
          { en: 'That beautiful garden is theirs.', vi: 'Khu vườn xinh đẹp đó là của họ.' },
        ],
        tip: 'Chỉ cần thêm "s" vào đuôi our và their để chuyển thành đại từ sở hữu độc lập: our -> ours, their -> theirs.',
        ruleSummary: 'Chúng tôi: our + N / ours · Họ: their + N / theirs',
      },
    ],
  },

  // 6. Plural Nouns
  'plural-nouns': {
    subtitle: 'Nắm chắc các quy tắc biến đổi danh từ số ít sang số nhiều từ cơ bản đến bất quy tắc',
    cards: [
      {
        title: 'QUY TẮC CHUNG: THÊM -S',
        badge: 'Đa số danh từ thông thường',
        category: 'add-s',
        image: '/grammar/topics/plural-nouns/01.webp',
        audio: '/grammar/topics/plural-nouns/01.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'I have two sisters.', vi: 'Tôi có hai chị em gái.' },
          { en: 'She bought three books.', vi: 'Cô ấy đã mua ba cuốn sách.' },
          { en: 'There are five cats in the room.', vi: 'Có 5 con mèo ở trong phòng.' },
          { en: 'Cars are parked outside.', vi: 'Những chiếc xe hơi đang đỗ ở ngoài.' },
        ],
        tip: 'Quy tắc phổ biến nhất trong tiếng Anh: chỉ cần thêm chữ "-s" vào cuối danh từ: book -> books, pen -> pens, cat -> cats.',
        ruleSummary: 'Danh từ + s (book → books, car → cars)',
      },
      {
        title: 'THÊM -ES (Tận cùng s, sh, ch, x, z)',
        badge: 'Để phát âm dễ dàng hơn',
        category: 'add-es',
        image: '/grammar/topics/plural-nouns/02.webp',
        audio: '/grammar/topics/plural-nouns/02.mp3',
        accentColor: '#f59e0b',
        examples: [
          { en: 'There are many boxes here.', vi: 'Có nhiều chiếc hộp ở đây.' },
          { en: 'He washes the dishes every night.', vi: 'Anh ấy rửa bát đĩa mỗi tối.' },
          { en: 'She watches two movies on Sunday.', vi: 'Cô ấy xem hai bộ phim vào Chủ nhật.' },
          { en: 'I have three bus passes.', vi: 'Tôi có 3 chiếc vé xe buýt.' },
        ],
        tip: 'Khi danh từ tận cùng bằng s, ss, sh, ch, x, z ta thêm "-es" để phát âm thành /ɪz/: box -> boxes, bus -> buses, watch -> watches.',
        ruleSummary: 'Tận cùng s, sh, ch, x, z + es (box → boxes)',
      },
      {
        title: 'ĐỔI -Y THÀNH -IES (Phụ âm + y)',
        badge: 'Biến đổi đuôi y',
        category: 'ies',
        image: '/grammar/topics/plural-nouns/03.webp',
        audio: '/grammar/topics/plural-nouns/03.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'Two babies are smiling.', vi: 'Hai em bé đang mỉm cười.' },
          { en: 'They visited three cities in Europe.', vi: 'Họ đã đến thăm 3 thành phố ở châu Âu.' },
          { en: 'I love fresh strawberries.', vi: 'Tôi rất thích dâu tây tươi.' },
          { en: 'She told us two different stories.', vi: 'Cô ấy đã kể cho chúng tôi nghe hai câu chuyện khác nhau.' },
        ],
        tip: 'Nếu trước "y" là phụ âm: đổi "y" thành "i" rồi thêm "es" (baby -> babies). Nhưng nếu trước "y" là nguyên âm thì chỉ thêm s (boy -> boys, day -> days).',
        ruleSummary: 'Phụ âm + y → -ies (baby → babies, city → cities)',
      },
      {
        title: 'BẤT QUY TẮC (Irregular Plurals)',
        badge: 'Biến đổi dạng từ đặc biệt',
        category: 'irregular',
        image: '/grammar/topics/plural-nouns/04.webp',
        audio: '/grammar/topics/plural-nouns/04.mp3',
        accentColor: '#f43f5e',
        examples: [
          { en: 'The children are playing happily.', vi: 'Những đứa trẻ đang chơi đùa vui vẻ.' },
          { en: 'Many people live in this town.', vi: 'Nhiều người sống ở thị trấn này.' },
          { en: 'Brush your teeth twice a day.', vi: 'Hãy đánh răng 2 lần mỗi ngày.' },
          { en: 'Two men and three women entered.', vi: 'Hai người đàn ông và ba người phụ nữ bước vào.' },
        ],
        tip: 'Những từ này không thêm s mà biến đổi hoàn toàn: child -> children, person -> people, tooth -> teeth, foot -> feet, man -> men, woman -> women.',
        ruleSummary: 'child → children · person → people · tooth → teeth',
      },
    ],
  },

  // 7. Present Simple
  'present-simple': {
    subtitle: 'Diễn tả thói quen, sự thật hiển nhiên và lịch trình cố định hàng ngày',
    cards: [
      {
        title: 'I / YOU / WE / THEY (Động từ nguyên mẫu)',
        badge: 'Chủ ngữ số nhiều & Ngôi 1, 2',
        category: 'plural-sub',
        image: '/grammar/topics/present-simple/01.webp',
        audio: '/grammar/topics/present-simple/01.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'I drink coffee every morning.', vi: 'Tôi uống cà phê mỗi buổi sáng.' },
          { en: 'We live in Hanoi.', vi: 'Chúng tôi sống ở Hà Nội.' },
          { en: 'They play football on Sundays.', vi: 'Họ chơi bóng đá vào mỗi Chủ nhật.' },
          { en: 'You speak English very well.', vi: 'Bạn nói tiếng Anh rất giỏi.' },
        ],
        tip: 'Với chủ ngữ I, You, We, They và danh từ số nhiều, động từ giữ NGUYÊN MẪU, không thêm s hay es.',
        ruleSummary: 'I / You / We / They + V nguyên thể',
      },
      {
        title: 'HE / SHE / IT (Thêm -s hoặc -es)',
        badge: 'Chủ ngữ số ít & Ngôi 3',
        category: 'singular-sub',
        image: '/grammar/topics/present-simple/02.webp',
        audio: '/grammar/topics/present-simple/02.mp3',
        accentColor: '#f43f5e',
        examples: [
          { en: 'She works at a hospital.', vi: 'Cô ấy làm việc tại một bệnh viện.' },
          { en: 'He likes classical music.', vi: 'Anh ấy thích nhạc cổ điển.' },
          { en: 'The sun rises in the east.', vi: 'Mặt trời mọc ở hướng đông.' },
          { en: 'The train leaves at 7 a.m.', vi: 'Chuyến tàu khởi hành lúc 7 giờ sáng.' },
        ],
        tip: 'Với He, She, It và danh từ số ít, động từ BẮT BUỘC thêm "-s" (works, likes) hoặc "-es" khi tận cùng là o, s, sh, ch, x (goes, watches).',
        ruleSummary: 'He / She / It + V-s / V-es',
      },
      {
        title: 'PHỦ ĐỊNH (Don\'t / Doesn\'t + V nguyên mẫu)',
        badge: 'Không làm gì đó',
        category: 'negative',
        image: '/grammar/topics/present-simple/03.webp',
        audio: '/grammar/topics/present-simple/03.mp3',
        accentColor: '#f59e0b',
        examples: [
          { en: 'I don\'t like spicy food.', vi: 'Tôi không thích đồ ăn cay.' },
          { en: 'She doesn\'t eat meat.', vi: 'Cô ấy không ăn thịt.' },
          { en: 'They don\'t watch TV very often.', vi: 'Họ không hay xem tivi.' },
          { en: 'He doesn\'t know the answer.', vi: 'Anh ấy không biết câu trả lời.' },
        ],
        tip: 'Dùng "don\'t" cho I/you/we/they; dùng "doesn\'t" cho he/she/it. Sau don\'t/doesn\'t động từ LUÔN về nguyên mẫu.',
        ruleSummary: 'don\'t + V (nguyên thể) · doesn\'t + V (nguyên thể)',
      },
      {
        title: 'CÂU HỎI (Do / Does + S + V...?)',
        badge: 'Hỏi về thói quen & sở thích',
        category: 'questions',
        image: '/grammar/topics/present-simple/04.webp',
        audio: '/grammar/topics/present-simple/04.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'Do you speak English?', vi: 'Bạn có nói tiếng Anh không?' },
          { en: 'Does she work here?', vi: 'Cô ấy có làm việc ở đây không?' },
          { en: 'Where do you live?', vi: 'Bạn sống ở đâu?' },
          { en: 'What time does the bus leave?', vi: 'Mấy giờ thì xe buýt chạy?' },
        ],
        tip: 'Đưa trợ động từ Do/Does lên trước chủ ngữ. Động từ chính luôn ở dạng nguyên mẫu không chia.',
        ruleSummary: 'Do/Does + S + V nguyên thể?',
      },
    ],
  },

  // 8. Have got / Has got
  'have-got': {
    subtitle: 'Diễn tả quyền sở hữu, mối quan hệ gia đình và tình trạng sức khỏe',
    cards: [
      {
        title: 'HAVE GOT (I / You / We / They)',
        badge: 'Tôi / Bạn / Chúng tôi / Họ có',
        category: 'have-got',
        image: '/grammar/topics/have-got/01.webp',
        audio: '/grammar/topics/have-got/01.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'I have got a new laptop.', vi: 'Tôi có một chiếc laptop mới.' },
          { en: 'We have got two tickets.', vi: 'Chúng tôi có hai chiếc vé.' },
          { en: 'They have got a lovely garden.', vi: 'Họ có một khu vườn xinh xắn.' },
          { en: 'Have you got a pen?', vi: 'Bạn có bút không?' },
        ],
        tip: '"Have got" tương đương với "have" mang nghĩa "có". Dạng viết tắt phổ biến: I\'ve got, We\'ve got, They\'ve got.',
        ruleSummary: 'I / You / We / They + have got + Danh từ',
      },
      {
        title: 'HAS GOT (He / She / It)',
        badge: 'Anh ấy / Cô ấy / Nó có',
        category: 'has-got',
        image: '/grammar/topics/have-got/02.webp',
        audio: '/grammar/topics/have-got/02.mp3',
        accentColor: '#f43f5e',
        examples: [
          { en: 'She has got two brothers.', vi: 'Cô ấy có hai người anh em trai.' },
          { en: 'He has got blue eyes.', vi: 'Cậu ấy có đôi mắt màu xanh.' },
          { en: 'The house has got a big roof.', vi: 'Ngôi nhà có một mái nhà lớn.' },
          { en: 'Has he got a car?', vi: 'Anh ấy có xe ô tô không?' },
        ],
        tip: 'Với chủ ngữ He, She, It hoặc 1 người / vật, dùng "has got". Viết tắt: He\'s got, She\'s got (tránh nhầm với He is).',
        ruleSummary: 'He / She / It + has got + Danh từ',
      },
      {
        title: 'PHỦ ĐỊNH (Haven\'t got / Hasn\'t got)',
        badge: 'Không có gì đó',
        category: 'negative',
        image: '/grammar/topics/have-got/03.webp',
        audio: '/grammar/topics/have-got/03.mp3',
        accentColor: '#f59e0b',
        examples: [
          { en: 'I haven\'t got much time.', vi: 'Tôi không có nhiều thời gian.' },
          { en: 'She hasn\'t got any sisters.', vi: 'Cô ấy không có chị em gái nào.' },
          { en: 'We haven\'t got a car.', vi: 'Chúng tôi không có xe ô tô.' },
          { en: 'He hasn\'t got a job right now.', vi: 'Hiện tại anh ấy chưa có việc làm.' },
        ],
        tip: 'Phủ định chỉ cần thêm "not" trực tiếp sau have/has: haven\'t got, hasn\'t got. Không cần mượn trợ động từ don\'t/doesn\'t.',
        ruleSummary: 'haven\'t got ... · hasn\'t got ...',
      },
      {
        title: 'SỨC KHỎE & TRIỆU CHỨNG (Have got a headache...)',
        badge: 'Nói về cảm cúm, đau ốm',
        category: 'health',
        image: '/grammar/topics/have-got/04.webp',
        audio: '/grammar/topics/have-got/04.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'I have got a headache.', vi: 'Tôi bị đau đầu.' },
          { en: 'She has got a bad cold.', vi: 'Cô ấy bị cảm lạnh nặng.' },
          { en: 'He has got a high fever.', vi: 'Cậu ấy bị sốt cao.' },
          { en: 'I\'ve got a sore throat.', vi: 'Tôi bị đau rát họng.' },
        ],
        tip: 'Người bản xứ rất hay dùng "have got" để miêu tả các triệu chứng bệnh tật thường ngày: a cold, a headache, a toothache.',
        ruleSummary: 'have got + a cold / a headache / a fever',
      },
    ],
  },

  // 9. Present Continuous
  'present-continuous': {
    subtitle: 'Diễn tả hành động đang diễn ra tại thời điểm nói hoặc kế hoạch tương lai gần',
    cards: [
      {
        title: 'ĐANG DIỄN RA (am / is / are + V-ing)',
        badge: 'Hành động tại lúc nói (Now / At the moment)',
        category: 'now',
        image: '/grammar/topics/present-continuous/01.webp',
        audio: '/grammar/topics/present-continuous/01.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'I am studying English now.', vi: 'Tôi đang học tiếng Anh bây giờ.' },
          { en: 'She is cooking in the kitchen.', vi: 'Cô ấy đang nấu ăn trong bếp.' },
          { en: 'The baby is sleeping.', vi: 'Em bé đang ngủ say.' },
          { en: 'They are watching TV together.', vi: 'Họ đang xem tivi cùng nhau.' },
        ],
        tip: 'Công thức: Chủ ngữ + am / is / are + Động từ thêm đuôi -ing. Dấu hiệu nhận biết: now, right now, at the moment, look!',
        ruleSummary: 'S + am/is/are + V-ing (I am reading, She is working)',
      },
      {
        title: 'PHỦ ĐỊNH (am not / isn\'t / aren\'t + V-ing)',
        badge: 'Không đang làm gì đó',
        category: 'negative',
        image: '/grammar/topics/present-continuous/02.webp',
        audio: '/grammar/topics/present-continuous/02.mp3',
        accentColor: '#f43f5e',
        examples: [
          { en: 'I am not playing games.', vi: 'Tôi không phải đang chơi game đâu.' },
          { en: 'He isn\'t listening to music.', vi: 'Anh ấy không đang nghe nhạc.' },
          { en: 'They aren\'t working today.', vi: 'Hôm nay họ không làm việc.' },
          { en: 'We aren\'t sleeping.', vi: 'Chúng tôi không ngủ.' },
        ],
        tip: 'Thêm "not" trực tiếp sau to be: am not + V-ing, isn\'t + V-ing, aren\'t + V-ing.',
        ruleSummary: 'S + am not / isn\'t / aren\'t + V-ing',
      },
      {
        title: 'CÂU HỎI (Am/Is/Are + S + V-ing...?)',
        badge: 'Hỏi ai đó đang làm gì',
        category: 'questions',
        image: '/grammar/topics/present-continuous/03.webp',
        audio: '/grammar/topics/present-continuous/03.mp3',
        accentColor: '#8b5cf6',
        examples: [
          { en: 'What are you doing?', vi: 'Bạn đang làm gì thế?' },
          { en: 'Is it raining outside?', vi: 'Ngoài trời đang mưa à?' },
          { en: 'Are they coming to the party?', vi: 'Họ đang đến bữa tiệc à?' },
          { en: 'Who is she calling right now?', vi: 'Cô ấy đang gọi điện cho ai vậy?' },
        ],
        tip: 'Đưa to be lên trước chủ ngữ. Với câu hỏi có từ để hỏi (What/Where/Why), đặt từ để hỏi ở đầu: What are you doing?',
        ruleSummary: 'What/Where + am/is/are + S + V-ing?',
      },
      {
        title: 'KẾ HOẠCH TƯƠNG LAI GẦN',
        badge: 'Đã lên lịch trình chắc chắn',
        category: 'future-plan',
        image: '/grammar/topics/present-continuous/04.webp',
        audio: '/grammar/topics/present-continuous/04.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'We are flying to Japan next week.', vi: 'Chúng tôi sẽ bay sang Nhật Bản vào tuần tới.' },
          { en: 'I am meeting Nam tomorrow.', vi: 'Tôi sẽ gặp Nam vào ngày mai.' },
          { en: 'She is starting her new job on Monday.', vi: 'Cô ấy sẽ bắt đầu công việc mới vào thứ Hai.' },
          { en: 'Are you coming tonight?', vi: 'Tối nay bạn có đến không?' },
        ],
        tip: 'Hiện tại tiếp diễn còn dùng rất nhiều cho lịch trình, cuộc hẹn đã sắp xếp sẵn trong tương lai gần kèm mốc thời gian (tomorrow, next week).',
        ruleSummary: 'S + am/is/are + V-ing + thời gian tương lai (tomorrow, next week)',
      },
    ],
  },

  // 10. Prepositions of Place
  'prepositions-place': {
    subtitle: 'Chỉ rõ vị trí của người và vật trong không gian (In, On, At, Under...)',
    cards: [
      {
        title: 'IN (Ở trong không gian / phòng / thành phố)',
        badge: 'Bên trong không gian 3 chiều hoặc địa danh lớn',
        category: 'in',
        image: '/grammar/topics/prepositions-place/01.webp',
        audio: '/grammar/topics/prepositions-place/01.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'The keys are in my bag.', vi: 'Chìa khóa ở trong túi của tôi.' },
          { en: 'He lives in Hanoi.', vi: 'Anh ấy sống ở Hà Nội.' },
          { en: 'The milk is in the fridge.', vi: 'Sữa ở trong tủ lạnh.' },
          { en: 'She is sitting in the room.', vi: 'Cô ấy đang ngồi trong phòng.' },
        ],
        tip: 'Dùng "IN" cho: vật chứa (in a box), phòng ốc (in the kitchen), thành phố / quốc gia (in Vietnam, in Tokyo).',
        ruleSummary: 'in + vật chứa / phòng / thành phố / đất nước',
      },
      {
        title: 'ON (Ở trên bề mặt / sàn / tầng)',
        badge: 'Có sự tiếp xúc trực tiếp trên bề mặt',
        category: 'on',
        image: '/grammar/topics/prepositions-place/02.webp',
        audio: '/grammar/topics/prepositions-place/02.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'Your phone is on the desk.', vi: 'Điện thoại của bạn ở trên bàn làm việc.' },
          { en: 'The clock is on the wall.', vi: 'Chiếc đồng hồ treo trên tường.' },
          { en: 'I live on the third floor.', vi: 'Tôi sống ở tầng ba.' },
          { en: 'There is a cat on the roof.', vi: 'Có một con mèo ở trên mái nhà.' },
        ],
        tip: 'Dùng "ON" khi có sự tiếp xúc trên bề mặt phẳng: on the table, on the wall, on the floor, on the street.',
        ruleSummary: 'on + bề mặt phẳng (table, wall, floor, screen)',
      },
      {
        title: 'AT (Tại một địa điểm cụ thể / điểm hẹn)',
        badge: 'Vị trí xác định tại một mốc cụ thể',
        category: 'at',
        image: '/grammar/topics/prepositions-place/03.webp',
        audio: '/grammar/topics/prepositions-place/03.mp3',
        accentColor: '#f59e0b',
        examples: [
          { en: 'Meet me at the entrance.', vi: 'Gặp tôi ở lối vào nhé.' },
          { en: 'She is at school right now.', vi: 'Bây giờ cô ấy đang ở trường.' },
          { en: 'He is waiting at the bus stop.', vi: 'Anh ấy đang đợi ở trạm xe buýt.' },
          { en: 'I am at home.', vi: 'Tôi đang ở nhà.' },
        ],
        tip: 'Dùng "AT" cho điểm hẹn chính xác, địa chỉ cụ thể, hoặc các cụm từ quen thuộc: at home, at school, at work, at the station.',
        ruleSummary: 'at + địa điểm cụ thể / điểm dừng (bus stop, door, school)',
      },
      {
        title: 'UNDER / NEXT TO / BEHIND (Vị trí tương quan)',
        badge: 'Ở dưới, bên cạnh, đằng sau',
        category: 'relative',
        image: '/grammar/topics/prepositions-place/04.webp',
        audio: '/grammar/topics/prepositions-place/04.mp3',
        accentColor: '#a855f7',
        examples: [
          { en: 'The puppy is under the chair.', vi: 'Chú cún con ở dưới gầm ghế.' },
          { en: 'My house is next to a bank.', vi: 'Nhà của tôi ở ngay cạnh một ngân hàng.' },
          { en: 'The car is behind the house.', vi: 'Chiếc ô tô ở đằng sau ngôi nhà.' },
          { en: 'The shop is between two cafes.', vi: 'Cửa hàng nằm ở giữa hai quán cà phê.' },
        ],
        tip: 'Under: ở dưới; Next to: ở bên cạnh; Behind: ở phía sau; In front of: ở phía trước; Between: ở giữa.',
        ruleSummary: 'under (dưới) · next to (cạnh) · behind (sau) · between (giữa)',
      },
    ],
  },

  // 11. Wh- Questions
  'wh-questions': {
    subtitle: 'Cách đặt câu hỏi với từ để hỏi (What, Where, When, Who, Why, How...)',
    cards: [
      {
        title: 'WHAT & WHICH (Cái gì & Cái nào)',
        badge: 'Hỏi thông tin sự vật, hiện tượng',
        category: 'what-which',
        image: '/grammar/topics/wh-questions/01.webp',
        audio: '/grammar/topics/wh-questions/01.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'What is your name?', vi: 'Tên của bạn là gì?' },
          { en: 'What time does the movie start?', vi: 'Mấy giờ thì bộ phim bắt đầu?' },
          { en: 'What are you doing?', vi: 'Bạn đang làm gì thế?' },
          { en: 'Which color do you prefer, red or blue?', vi: 'Bạn thích màu nào hơn, đỏ hay xanh?' },
        ],
        tip: '"What" hỏi thông tin chung không giới hạn. "Which" hỏi lựa chọn cụ thể giữa một số ít phương án.',
        ruleSummary: 'What / Which + trợ động từ / to be + S + V...?',
      },
      {
        title: 'WHERE & WHEN (Ở đâu & Khi nào)',
        badge: 'Hỏi địa điểm và thời gian',
        category: 'where-when',
        image: '/grammar/topics/wh-questions/02.webp',
        audio: '/grammar/topics/wh-questions/02.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'Where do you live?', vi: 'Bạn sống ở đâu?' },
          { en: 'Where is the nearest library?', vi: 'Thư viện gần nhất ở đâu?' },
          { en: 'When does the class start?', vi: 'Khi nào lớp học bắt đầu?' },
          { en: 'When is your birthday?', vi: 'Sinh nhật của bạn là khi nào?' },
        ],
        tip: '"Where" hỏi nơi chốn (Where are you?). "When" hỏi thời gian, ngày giờ (When will you leave?).',
        ruleSummary: 'Where (nơi chốn) · When (thời gian)',
      },
      {
        title: 'WHO & WHY (Ai & Tại sao)',
        badge: 'Hỏi người và lý do',
        category: 'who-why',
        image: '/grammar/topics/wh-questions/03.webp',
        audio: '/grammar/topics/wh-questions/03.mp3',
        accentColor: '#f43f5e',
        examples: [
          { en: 'Who is that friendly girl?', vi: 'Cô gái thân thiện kia là ai?' },
          { en: 'Who called you last night?', vi: 'Ai đã gọi cho bạn tối qua?' },
          { en: 'Why are you late today?', vi: 'Tại sao hôm nay bạn đến muộn?' },
          { en: 'Why do you study English?', vi: 'Tại sao bạn lại học tiếng Anh?' },
        ],
        tip: '"Who" hỏi người. "Why" hỏi lý do, nguyên nhân (câu trả lời thường bắt đầu bằng: Because...).',
        ruleSummary: 'Who (người) · Why (lý do → trả lời bằng Because)',
      },
      {
        title: 'HOW & HOW MUCH / MANY (Như thế nào & Bao nhiêu)',
        badge: 'Hỏi phương thức, số lượng và giá cả',
        category: 'how',
        image: '/grammar/topics/wh-questions/04.webp',
        audio: '/grammar/topics/wh-questions/04.mp3',
        accentColor: '#8b5cf6',
        examples: [
          { en: 'How are you today?', vi: 'Hôm nay bạn thế nào?' },
          { en: 'How do you go to school?', vi: 'Bạn đi học bằng phương tiện gì?' },
          { en: 'How much does this shirt cost?', vi: 'Chiếc áo này giá bao nhiêu?' },
          { en: 'How many books have you got?', vi: 'Bạn có bao nhiêu cuốn sách?' },
        ],
        tip: 'How many + danh từ số nhiều (How many pens); How much + danh từ không đếm được hoặc hỏi giá tiền (How much is it?).',
        ruleSummary: 'How many + đếm được · How much + không đếm được / giá tiền',
      },
    ],
  },

  // 12. Adverbs of Frequency
  'adverbs-frequency': {
    subtitle: 'Nói về mức độ thường xuyên lặp lại của một hành động (Always, Usually, Often, Never...)',
    cards: [
      {
        title: 'ALWAYS & USUALLY (100% & 80%)',
        badge: 'Luôn luôn và Thường xuyên',
        category: 'always-usually',
        image: '/grammar/topics/adverbs-frequency/01.webp',
        audio: '/grammar/topics/adverbs-frequency/01.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'I always brush my teeth before bed.', vi: 'Tôi luôn đánh răng trước khi đi ngủ.' },
          { en: 'She always arrives on time.', vi: 'Cô ấy luôn luôn đến đúng giờ.' },
          { en: 'I usually walk to work.', vi: 'Tôi thường đi bộ đến chỗ làm.' },
          { en: 'We usually have lunch at noon.', vi: 'Chúng tôi thường ăn trưa vào buổi trưa.' },
        ],
        tip: 'Always (100%): luôn luôn; Usually (80%): thường lệ. Vị trí: đứng TRƯỚC động từ thường (always walk), đứng SAU to be (is always happy).',
        ruleSummary: 'Always (100%) · Usually (80%) — Đứng trước V thường, sau To Be',
      },
      {
        title: 'OFTEN & SOMETIMES (60% & 30%)',
        badge: 'Hay làm và Thỉnh thoảng',
        category: 'often-sometimes',
        image: '/grammar/topics/adverbs-frequency/02.webp',
        audio: '/grammar/topics/adverbs-frequency/02.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'I often read books on weekends.', vi: 'Tôi hay đọc sách vào cuối tuần.' },
          { en: 'Do you often call your parents?', vi: 'Bạn có hay gọi điện cho bố mẹ không?' },
          { en: 'I sometimes cook dinner myself.', vi: 'Thỉnh thoảng tôi tự nấu bữa tối.' },
          { en: 'She sometimes forgets her umbrella.', vi: 'Thỉnh thoảng cô ấy quên mang ô.' },
        ],
        tip: 'Often (khoảng 60%): thường xuyên; Sometimes (khoảng 30%): thỉnh thoảng (Sometimes có thể đứng ở đầu câu: Sometimes I feel tired).',
        ruleSummary: 'Often (60%) · Sometimes (30%)',
      },
      {
        title: 'RARELY & NEVER (10% & 0%)',
        badge: 'Hiếm khi và Không bao giờ',
        category: 'rarely-never',
        image: '/grammar/topics/adverbs-frequency/03.webp',
        audio: '/grammar/topics/adverbs-frequency/03.mp3',
        accentColor: '#f43f5e',
        examples: [
          { en: 'We rarely eat fast food.', vi: 'Chúng tôi hiếm khi ăn đồ ăn nhanh.' },
          { en: 'He rarely goes to bed late.', vi: 'Anh ấy hiếm khi đi ngủ muộn.' },
          { en: 'I never drink alcohol.', vi: 'Tôi không bao giờ uống rượu bia.' },
          { en: 'She never tells lies.', vi: 'Cô ấy không bao giờ nói dối.' },
        ],
        tip: '"Never" bản thân đã mang nghĩa phủ định tuyệt đối. Tuyệt đối KHÔNG dùng thêm don\'t/doesn\'t (Sai: I don\'t never eat meat).',
        ruleSummary: 'Rarely (10%) · Never (0% - Không dùng thêm trợ từ phủ định)',
      },
      {
        title: 'HỎI VỀ TẦN SUẤT: HOW OFTEN...?',
        badge: 'Bao lâu một lần',
        category: 'how-often',
        image: '/grammar/topics/adverbs-frequency/04.webp',
        audio: '/grammar/topics/adverbs-frequency/04.mp3',
        accentColor: '#8b5cf6',
        examples: [
          { en: 'How often do you exercise?', vi: 'Bạn tập thể dục bao lâu một lần?' },
          { en: 'How often does she travel?', vi: 'Cô ấy có hay đi du lịch không?' },
          { en: 'I exercise once a day.', vi: 'Tôi tập thể dục mỗi ngày một lần.' },
          { en: 'We meet twice a week.', vi: 'Chúng tôi gặp nhau hai lần một tuần.' },
        ],
        tip: 'Trả lời: once a day (1 lần/ngày), twice a week (2 lần/tuần), three times a month (3 lần/tháng), every day (mỗi ngày).',
        ruleSummary: 'How often + do/does + S + V...? → once / twice / three times a ...',
      },
    ],
  },

  // 13. Basic Adjectives
  'adjectives-basic': {
    subtitle: 'Vị trí và cách dùng tính từ miêu tả đặc điểm, màu sắc, cảm xúc',
    cards: [
      {
        title: 'VỊ TRÍ 1: ĐỨNG TRƯỚC DANH TỪ',
        badge: 'Tính từ + Danh từ (Bổ nghĩa)',
        category: 'before-noun',
        image: '/grammar/topics/adjectives-basic/01.webp',
        audio: '/grammar/topics/adjectives-basic/01.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'She bought a beautiful dress.', vi: 'Cô ấy đã mua một chiếc váy đẹp.' },
          { en: 'He drives a fast car.', vi: 'Anh ấy lái một chiếc xe hơi chạy nhanh.' },
          { en: 'They live in a big house.', vi: 'Họ sống trong một ngôi nhà lớn.' },
          { en: 'This is a difficult question.', vi: 'Đây là một câu hỏi khó.' },
        ],
        tip: 'Trong tiếng Anh, tính từ LUÔN đứng TRƯỚC danh từ (a red apple), ngược lại hoàn toàn so với tiếng Việt (quả táo đỏ).',
        ruleSummary: 'a / an / the + Tính từ + Danh từ (a new car, a good student)',
      },
      {
        title: 'VỊ TRÍ 2: ĐỨNG SAU TO BE / LINKING VERB',
        badge: 'Chủ ngữ + To Be + Tính từ',
        category: 'after-tobe',
        image: '/grammar/topics/adjectives-basic/02.webp',
        audio: '/grammar/topics/adjectives-basic/02.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'The soup smells delicious.', vi: 'Món súp có mùi thơm ngon quá.' },
          { en: 'My father is tall and strong.', vi: 'Bố tôi cao và khỏe mạnh.' },
          { en: 'The classroom is very clean.', vi: 'Phòng học rất sạch sẽ.' },
          { en: 'She looks very happy today.', vi: 'Hôm nay trông cô ấy rất vui vẻ.' },
        ],
        tip: 'Tính từ đứng sau to be (is, am, are) và các động từ nối cảm giác như look (trông có vẻ), smell (có mùi), feel (cảm thấy).',
        ruleSummary: 'S + is/am/are/look/smell + Tính từ (She is smart)',
      },
      {
        title: 'CẢM XÚC & TÌNH TRẠNG CON NGƯỜI',
        badge: 'Vui, buồn, đói, mệt, khát',
        category: 'feelings',
        image: '/grammar/topics/adjectives-basic/03.webp',
        audio: '/grammar/topics/adjectives-basic/03.mp3',
        accentColor: '#f43f5e',
        examples: [
          { en: 'I am tired after the long trip.', vi: 'Tôi mệt sau chuyến đi dài.' },
          { en: 'Are you hungry?', vi: 'Bạn có đói không?' },
          { en: 'He feels happy and relaxed.', vi: 'Cậu ấy cảm thấy vui vẻ và thư thái.' },
          { en: 'Don\'t be sad, everything will be fine.', vi: 'Đừng buồn, mọi chuyện sẽ ổn thôi.' },
        ],
        tip: 'Các tính từ cảm xúc quen thuộc: happy (vui), sad (buồn), tired (mệt), hungry (đói), thirsty (khát), angry (tức giận).',
        ruleSummary: 'feel / be + happy / tired / hungry / thirsty',
      },
      {
        title: 'CẶP TÍNH TỪ TRÁI NGHĨA PHỔ BIẾN',
        badge: 'Ghi nhớ theo cặp đối lập',
        category: 'opposites',
        image: '/grammar/topics/adjectives-basic/04.webp',
        audio: '/grammar/topics/adjectives-basic/04.mp3',
        accentColor: '#f59e0b',
        examples: [
          { en: 'This house is big, that one is small.', vi: 'Ngôi nhà này to, ngôi nhà kia nhỏ.' },
          { en: 'Summer is hot, winter is cold.', vi: 'Mùa hè thì nóng, mùa đông thì lạnh.' },
          { en: 'An old book vs a new car.', vi: 'Một cuốn sách cũ đối lập với chiếc xe mới.' },
          { en: 'We need something cheaper.', vi: 'Chúng ta cần thứ gì đó rẻ hơn.' },
        ],
        tip: 'Học tính từ theo cặp trái nghĩa giúp bạn nhớ từ vựng lâu hơn gấp đôi: big/small, hot/cold, cheap/expensive, easy/difficult.',
        ruleSummary: 'big ≠ small · hot ≠ cold · cheap ≠ expensive · easy ≠ hard',
      },
    ],
  },
};

// ============================================================================
// MAIN COMPONENT: GrammarVisualTopicDeck
// ============================================================================

export interface GrammarVisualTopicDeckProps {
  topicSlug: string;
  topicTitle?: string;
  topicTitleVi?: string;
  theoryData?: GrammarTheoryData | null;
  guided?: boolean;
}

export default function GrammarVisualTopicDeck(props: GrammarVisualTopicDeckProps) {
  // 1. Delegate SVO Lesson Zero and Personal Pronouns before any hooks are invoked
  if (props.topicSlug === 'sentence-structure-svo') {
    return <SvoSentenceVisualDeck guided={props.guided} />;
  }

  if (props.topicSlug === 'personal-pronouns') {
    return <PronounVisualDeck guided={props.guided} />;
  }

  return <GrammarVisualTopicDeckInner {...props} />;
}

function GrammarVisualTopicDeckInner({
  topicSlug,
  topicTitle = '',
  topicTitleVi = '',
  theoryData,
  guided = false,
}: GrammarVisualTopicDeckProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [cardIndex, setCardIndex] = useState(0);

  // 2. Check if a curated deck exists for foundational topics
  const curated = CURATED_TOPIC_DECKS[topicSlug];

  // 3. Fallback / Universal deck synthesis for all other topics in the curriculum
  const syntheticCards = useMemo<VisualDeckCard[]>(() => {
    if (curated) return curated.cards;

    // Extract assets from topicAssetsData
    const assetsList = ((topicAssetsData as Record<string, TopicAssetItem[]>)[topicSlug] || []);
    const bilingualExamples: Array<{ en?: string; vi?: string }> = theoryData?.bilingual_examples || [];

    if (assetsList.length === 0) return [];

    return assetsList.map((asset, idx) => {
      // Determine caption sentence
      let captionEn = '';
      let captionVi = '';
      if (asset.caption) {
        const m = asset.caption.match(/^"([^"]+)"\s*(?:\(([^)]+)\))?/);
        if (m) {
          captionEn = m[1].trim();
          captionVi = m[2] ? m[2].trim() : '';
        } else {
          captionEn = asset.caption.split('—')[0].replace(/"/g, '').trim();
        }
      }

      // Collect 3-4 simple sentences
      const examples: VisualDeckExample[] = [];
      if (captionEn) {
        examples.push({ en: captionEn, vi: captionVi || 'Minh họa ngữ cảnh thực tế' });
      }

      // Add bilingual examples from topic lesson
      const startIdx = idx * 2;
      for (let i = startIdx; i < startIdx + 3 && i < bilingualExamples.length; i++) {
        const ex = bilingualExamples[i];
        if (ex?.en && ex.en !== captionEn) {
          examples.push({ en: ex.en, vi: ex.vi || '' });
        }
      }

      // Ensure at least 2-3 examples
      if (examples.length < 3 && bilingualExamples.length > 0) {
        for (const ex of bilingualExamples) {
          if (ex?.en && !examples.some((e) => e.en === ex.en)) {
            examples.push({ en: ex.en, vi: ex.vi || '' });
            if (examples.length >= 3) break;
          }
        }
      }

      // Title & badge
      const rawRule = asset.usageAnalysisVi?.rule || '';
      let ruleShort = rawRule.split(':')[0].replace(/.*\(|\).*/g, '').trim();

      // Tránh các tiêu đề generic/lặp lại không cung cấp thông tin ngữ pháp
      const isGeneric = !ruleShort ||
        ruleShort.includes('Chọn cấu trúc') ||
        ruleShort.includes('Kiểm tra thành phần') ||
        ruleShort.includes('Nguyên âm và phụ âm') ||
        ruleShort.includes('Giữ sự hòa hợp');

      const formulaRow = theoryData?.formula?.rows?.[idx];
      const usageItem = theoryData?.usage?.[idx];

      if (isGeneric) {
        if (formulaRow?.form) {
          ruleShort = String(formulaRow.form);
        } else if (usageItem?.label) {
          ruleShort = String(usageItem.label);
        } else if (captionEn) {
          ruleShort = captionEn;
        } else {
          ruleShort = `Tình huống ${idx + 1}`;
        }
      }

      const badgeText = asset.usageAnalysisVi?.rule
        ? (rawRule.includes(':') ? rawRule.split(':')[0].trim() : 'Tình huống đời thường')
        : (theoryData?.level ? `Cấp độ ${theoryData.level}` : `Ngữ cảnh ${idx + 1}`);

      return {
        title: ruleShort || `Tình huống ${idx + 1}`,
        badge: badgeText,
        category: `cat-${idx}`,
        image: asset.image || '',
        audio: asset.audio,
        examples: examples.slice(0, 4),
        tip: asset.usageAnalysisVi?.commonMistake || asset.usageAnalysisVi?.contextReason || (typeof theoryData?.tips === 'string' ? theoryData.tips : undefined),
        ruleSummary: rawRule || (theoryData?.formula?.rows?.[idx]?.structure ? `Cấu trúc: ${theoryData.formula.rows[idx].structure}` : ''),
      };
    });
  }, [curated, topicSlug, theoryData]);

  const cardsToRender = curated ? curated.cards : syntheticCards;

  const [audioState, setAudioState] = useState<{ isPlaying: boolean; activeId: string | null }>({
    isPlaying: false,
    activeId: null,
  });

  useEffect(() => {
    return grammarAudio.subscribe(setAudioState);
  }, []);

  // Filter cards
  const filteredCards = useMemo(() => {
    if (activeFilter === 'all') return cardsToRender;
    return cardsToRender.filter((c) => c.category === activeFilter);
  }, [activeFilter, cardsToRender]);

  const playSpeech = (id: string, text: string, audioUrl?: string) => {
    grammarAudio.play(id, text, audioUrl);
  };

  if (cardsToRender.length === 0) {
    return null;
  }

  if (guided) {
    const index = Math.min(cardIndex, cardsToRender.length - 1);
    const card = cardsToRender[index];
    return (
      <div className="space-y-3 min-w-0 max-w-3xl mx-auto">
        <GrammarCardNavigator titles={cardsToRender.map((item) => item.title)} index={index}
          onChange={(nextIndex) => { grammarAudio.stopAll(); setCardIndex(nextIndex); }} />
        <VisualTopicCardItem key={`${topicSlug}-${index}`} card={card} cardIndex={index} topicSlug={topicSlug}
          activeAudioId={audioState.activeId} onPlaySpeech={playSpeech} exampleLimit={2} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="border border-border p-4 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-none">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-0.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Thẻ học trực quan & Tình huống thực tế</span>
          </div>
          <div className="text-sm font-semibold text-foreground">
            {curated?.subtitle || `${topicTitleVi || topicTitle}: Minh họa trực quan kèm câu ví dụ đời thường dễ nhớ`}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs px-2.5 py-1 bg-background border border-border text-foreground font-semibold rounded-none">
            {cardsToRender.length} Tình huống
          </span>
          <span className="font-mono text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-semibold rounded-none">
            Ví dụ cơ bản A0-A1
          </span>
        </div>
      </div>

      {/* Filter Tabs (if more than 2 categories) */}
      {cardsToRender.length > 2 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-muted-foreground mr-1 uppercase tracking-wider text-[11px]">Xem:</span>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`min-h-[36px] sm:min-h-[44px] px-3 py-1.5 border transition-colors rounded-none flex items-center justify-center ${
              activeFilter === 'all'
                ? 'border-foreground bg-foreground text-background font-bold'
                : 'border-border bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            Tất cả ({cardsToRender.length})
          </button>
          {cardsToRender.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveFilter(c.category || `cat-${i}`)}
              className={`min-h-[36px] sm:min-h-[44px] px-3 py-1.5 border transition-colors rounded-none flex items-center justify-center ${
                activeFilter === (c.category || `cat-${i}`)
                  ? 'border-foreground bg-foreground text-background font-bold'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              {c.title.split('(')[0].trim()}
            </button>
          ))}
        </div>
      )}

      {/* Cards Grid: Centered if 1 item, clean 2-col otherwise */}
      <div
        className={`grid gap-5 ${
          filteredCards.length === 1
            ? 'max-w-xl mx-auto'
            : 'grid-cols-1 md:grid-cols-2'
        }`}
      >
        {filteredCards.map((card, idx) => (
          <VisualTopicCardItem
            key={idx}
            card={card}
            cardIndex={idx}
            topicSlug={topicSlug}
            activeAudioId={audioState.activeId}
            onPlaySpeech={playSpeech}
          />
        ))}
      </div>
    </div>
  );
}

export function detectGrammarKeyword(sentence: string, topicSlug: string = '', cardTitle: string = ''): string | undefined {
  if (!sentence) return undefined;

  // 1. Check if card title has an explicit capital keyword like "THIS", "ARE", "COULD", "HAVE GOT", "USED TO", "ALWAYS", etc.
  const titleMatch = cardTitle.match(/^([A-Z\s'/]+)(?:\s*\(|$)/);
  if (titleMatch) {
    const candidate = titleMatch[1].trim();
    if (
      candidate.length >= 2 &&
      !['CÂU', 'PHỦ', 'KHẲNG', 'TÌNH', 'QUY', 'BẢNG', 'BẤT', 'THÊM', 'TRƯỚC', 'SAU'].includes(candidate)
    ) {
      const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const reg = new RegExp(`\\b${escaped}\\b`, 'i');
      const match = sentence.match(reg);
      if (match) return match[0];
    }
  }

  // 2. Specific Topic RegEx Patterns
  const slug = topicSlug.toLowerCase();

  // Verb to be
  if (slug.includes('to-be') || slug.includes('verb-to-be')) {
    const m = sentence.match(/\b(am not|isn't|aren't|wasn't|weren't|am|is|are|was|were)\b/i);
    if (m) return m[0];
  }

  // Demonstratives (this, that, these, those)
  if (slug.includes('demonstrative')) {
    const m = sentence.match(/\b(this|that|these|those)\b/i);
    if (m) return m[0];
  }

  // There is / There are
  if (slug.includes('there-is') || slug.includes('there-are')) {
    const m = sentence.match(/\b(there isn't|there aren't|there is|there are|is there|are there|there's)\b/i);
    if (m) return m[0];
  }

  // Articles (a, an, the)
  if (slug.includes('article')) {
    if (cardTitle.toUpperCase().startsWith('A ') || cardTitle.toUpperCase().includes('(A')) {
      const m = sentence.match(/\b(a)\b/i);
      if (m) return m[0];
    }
    if (cardTitle.toUpperCase().startsWith('AN ') || cardTitle.toUpperCase().includes('(AN')) {
      const m = sentence.match(/\b(an)\b/i);
      if (m) return m[0];
    }
    if (cardTitle.toUpperCase().startsWith('THE ') || cardTitle.toUpperCase().includes('(THE')) {
      const m = sentence.match(/\b(the)\b/i);
      if (m) return m[0];
    }
    const m = sentence.match(/\b(a|an|the)\b/i);
    if (m) return m[0];
  }

  // Possessives
  if (slug.includes('possessive')) {
    const m = sentence.match(/('s\b|\b(my|your|his|her|its|our|their|mine|yours|hers|ours|theirs)\b)/i);
    if (m) return m[0];
  }

  // Have got
  if (slug.includes('have-got')) {
    const m = sentence.match(/\b(have got|has got|haven't got|hasn't got|have you got|has he got|has she got|'ve got|'s got)\b/i);
    if (m) return m[0];
  }

  // Modals (can, could, should, must, might, etc.)
  if (slug.includes('modal') || slug.includes('can') || slug.includes('could') || slug.includes('should') || slug.includes('must')) {
    const m = sentence.match(/\b(can't|cannot|couldn't|shouldn't|mustn't|won't|can|could|should|must|might|may|have to|has to|had to|will)\b/i);
    if (m) return m[0];
  }

  // Continuous / Progressive (am/is/are/was/were + V-ing)
  if (slug.includes('continuous') || slug.includes('progressive')) {
    const m = sentence.match(/\b(am|is|are|was|were)\s+\w+ing\b/i) || sentence.match(/\b\w+ing\b/i);
    if (m) return m[0];
  }

  // Perfect tenses (have/has/had + V3/ed)
  if (slug.includes('perfect')) {
    const m = sentence.match(/\b(have|has|had|haven't|hasn't|hadn't)\s+\w+(ed|en|ne|t|d)?\b/i) || sentence.match(/\b(have|has|had)\b/i);
    if (m) return m[0];
  }

  // Past Simple
  if (slug.includes('past-simple') || slug.includes('past')) {
    const m = sentence.match(/\b(was|were|wasn't|weren't|didn't|did|went|saw|bought|had|played|studied|worked|watched|visited|started)\b/i);
    if (m) return m[0];
  }

  // Present Simple
  if (slug.includes('present-simple') || slug.includes('present')) {
    const m = sentence.match(/\b(don't|doesn't|do|does)\b/i);
    if (m) return m[0];
  }

  // Conditionals
  if (slug.includes('conditional') || slug.includes('if')) {
    const m = sentence.match(/\b(if|unless|would|will)\b/i);
    if (m) return m[0];
  }

  // Prepositions
  if (slug.includes('preposition')) {
    const m = sentence.match(/\b(in front of|next to|between|behind|under|above|below|near|in|on|at)\b/i);
    if (m) return m[0];
  }

  // Questions / Wh-
  if (slug.includes('question') || slug.includes('wh-')) {
    const m = sentence.match(/\b(what|where|when|who|why|which|how|whose|whom)\b/i);
    if (m) return m[0];
  }

  // Adverbs of frequency
  if (slug.includes('adverb') || slug.includes('frequency')) {
    const m = sentence.match(/\b(always|usually|often|sometimes|rarely|seldom|never)\b/i);
    if (m) return m[0];
  }

  // Comparisons
  if (slug.includes('compar') || slug.includes('superlat')) {
    const m = sentence.match(/\b(more|most|better|best|worse|worst|than|as\s+\w+\s+as)\b/i);
    if (m) return m[0];
  }

  // Passive
  if (slug.includes('passive')) {
    const m = sentence.match(/\b(is|are|was|were|been|being)\s+\w+(ed|en|t|d)\b/i);
    if (m) return m[0];
  }

  // Relative clauses
  if (slug.includes('relative')) {
    const m = sentence.match(/\b(who|which|that|whose|where|whom)\b/i);
    if (m) return m[0];
  }

  // Conjunctions
  if (slug.includes('conjunction') || slug.includes('clause')) {
    const m = sentence.match(/\b(although|though|even though|because|since|so|however|despite|in spite of)\b/i);
    if (m) return m[0];
  }

  // 3. Fallback: Check if there's any capitalized or distinctive word in card title
  const words = cardTitle.replace(/[()/:,]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  for (const w of words) {
    const reg = new RegExp(`\\b${w}\\b`, 'i');
    const m = sentence.match(reg);
    if (m) return m[0];
  }

  return undefined;
}

interface VisualTopicCardItemProps {
  card: VisualDeckCard;
  cardIndex: number;
  topicSlug: string;
  activeAudioId: string | null;
  onPlaySpeech: (id: string, text: string, audioUrl?: string) => void;
  exampleLimit?: number;
}

function VisualTopicCardItem({
  card,
  cardIndex,
  topicSlug,
  activeAudioId,
  onPlaySpeech,
  exampleLimit,
}: VisualTopicCardItemProps) {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showAllExamples, setShowAllExamples] = useState(false);
  const visibleExamples = exampleLimit && !showAllExamples ? card.examples.slice(0, exampleLimit) : card.examples;

  const currentIdx = hoveredIdx !== null ? hoveredIdx : activeIdx;
  const currentExample = card.examples[currentIdx] || card.examples[0];
  const currentImage = (hoveredIdx !== null ? currentExample?.image : null) || currentExample?.image || card.image;

  const currentHighlight = currentExample
    ? currentExample.highlightWord || detectGrammarKeyword(currentExample.en, topicSlug, card.title)
    : undefined;

  const isStageAudioPlaying = activeAudioId === `${card.title}-${currentIdx}`;

  return (
    <div
      className={`relative overflow-hidden border border-border bg-card rounded-none shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
        hoveredIdx !== null ? 'z-20' : 'z-10'
      }`}
    >
      {/* Card Header: Luôn hiển thị tên ý và badge để người học định vị bài học */}
      <div className="p-3 sm:p-3.5 border-b border-border bg-muted/15 flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
            {card.title}
          </h3>
          {card.badge && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">{card.badge}</div>
          )}
        </div>
        <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border border-border bg-background text-muted-foreground rounded-none shrink-0">
          Ý {cardIndex + 1}
        </span>
      </div>

      <div className={exampleLimit ? 'sm:grid sm:grid-cols-[0.85fr_1.15fr] sm:items-stretch min-w-0' : undefined}>
        {/* Dynamic Image Container (Hero Stage with In-Place Swapping) */}
        {currentImage && (
          <div className={`relative w-full bg-muted/20 overflow-hidden border-b sm:border-b-0 sm:border-r border-border ${exampleLimit ? 'h-48 sm:h-auto sm:min-h-[240px]' : 'h-52 sm:h-56'}`}>
            <Image
              key={currentImage}
              src={currentImage}
              alt={card.title}
              fill
              className={`transition-all duration-300 ${
                currentImage.endsWith('.svg') ? 'object-contain p-4' : 'object-cover object-center'
              }`}
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized
            />
            {/* Direct 44x44px Audio Button on Hero Stage */}
            {currentExample && (
              <button
                type="button"
                onClick={() => onPlaySpeech(`${card.title}-${currentIdx}`, currentExample.en, currentIdx === 0 ? card.audio : undefined)}
                className="absolute bottom-2.5 right-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 bg-background/95 hover:bg-background border border-border rounded-none shadow-sm transition-colors z-10"
                aria-label={`Nghe câu: ${currentExample.en}`}
                title="Nghe câu ví dụ đang chọn"
              >
                <Volume2
                  className={`h-5 w-5 ${
                    isStageAudioPlaying ? 'text-primary animate-pulse' : 'text-foreground'
                  }`}
                />
              </button>
            )}
          </div>
        )}

        {/* Dynamic Active Sentence Banner */}
        {currentExample && !exampleLimit && (
          <div className="p-3.5 bg-primary/[0.04] border-b border-border space-y-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-block w-2 h-2 bg-primary shrink-0" />
              <span className="font-serif text-sm sm:text-base font-bold text-foreground">
                <HighlightedSentence
                  text={currentExample.en}
                  highlight={currentHighlight}
                />
              </span>
            </div>
            {currentExample.vi && (
              <p className="text-xs text-muted-foreground font-sans pl-4">
                {currentExample.vi}
              </p>
            )}
          </div>
        )}

        {/* Examples List: Touch & Hover In-Place Stage Swap */}
        <div className="p-3.5 space-y-2">
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span className="font-semibold text-foreground">Chọn câu để xem và nghe</span>
            <span className="text-primary font-mono text-[10px] font-bold">
              {currentIdx + 1}/{visibleExamples.length}{exampleLimit && !showAllExamples && card.examples.length > exampleLimit ? ` (+${card.examples.length - exampleLimit})` : ''}
            </span>
          </div>

          <div className="space-y-1.5">
            {visibleExamples.map((ex, exIdx) => {
              const isSpeaking = activeAudioId === `${card.title}-${exIdx}`;
              const isHovered = hoveredIdx === exIdx;
              const isSelected = activeIdx === exIdx;
              const effectiveHighlight = ex.highlightWord || detectGrammarKeyword(ex.en, topicSlug, card.title);

              return (
                <div
                  key={exIdx}
                  onMouseEnter={() => {
                    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
                      setHoveredIdx(exIdx);
                    }
                  }}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`min-h-[44px] p-2.5 border transition-all duration-150 rounded-none cursor-pointer flex items-center justify-between gap-2 ${
                    isHovered || isSelected
                      ? 'border-primary bg-primary/[0.08] shadow-xs ring-1 ring-primary/25'
                      : isSpeaking
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-border/60 bg-muted/10 hover:border-border hover:bg-muted/20'
                  }`}
                >
                  <button type="button" aria-pressed={isSelected} onClick={() => setActiveIdx(exIdx)}
                    className="space-y-0.5 min-w-0 flex-1 text-left min-h-[44px]">
                    <p className="text-xs sm:text-sm font-semibold text-foreground font-sans leading-snug">
                      <HighlightedSentence text={ex.en} highlight={effectiveHighlight} />
                    </p>
                    {ex.vi && <p className="text-[11px] text-muted-foreground leading-snug">{ex.vi}</p>}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIdx(exIdx);
                      onPlaySpeech(`${card.title}-${exIdx}`, ex.en, exIdx === 0 ? card.audio : undefined);
                    }}
                    aria-label={`Nghe phát âm: ${ex.en}`}
                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center p-2 transition-colors shrink-0 rounded-none ${
                      isSpeaking || isHovered
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Nghe phát âm"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
          {exampleLimit && card.examples.length > exampleLimit && (
            <button type="button" aria-expanded={showAllExamples}
              onClick={() => { setShowAllExamples(!showAllExamples); setActiveIdx(0); setHoveredIdx(null); grammarAudio.stopAll(); }}
              className="min-h-[44px] w-full text-sm text-primary hover:bg-muted border border-border">
              {showAllExamples ? 'Thu gọn ví dụ' : `Xem thêm ${card.examples.length - exampleLimit} ví dụ`}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Tip & Rule Summary */}
      {(card.tip || card.ruleSummary) && (
        <div className="p-3 sm:p-3.5 pt-0 space-y-2">
          {card.tip && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 rounded-none">
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="font-semibold text-amber-800 dark:text-amber-300">Mẹo nhớ: </strong>
                <FormattedText text={card.tip} />
              </div>
            </div>
          )}

          {card.ruleSummary && (
            <div className="font-mono text-[11px] p-2 bg-muted/20 border border-border/70 text-foreground/80 flex items-center gap-1.5 rounded-none">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="break-words leading-tight"><FormattedText text={card.ruleSummary} /></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
