'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Volume2, Sparkles, Lightbulb, CheckCircle2, Dumbbell, ArrowRight, RotateCcw } from 'lucide-react';
import { grammarAudio } from '@/lib/grammar/grammarAudioManager';
import PronounVisualDeck from './PronounVisualDeck';
import HighlightedSentence from './HighlightedSentence';
import SvoSentenceVisualDeck from './SvoSentenceVisualDeck';
import type { GrammarTheoryData } from './GrammarReferenceTable';
import topicAssetsData from '@/data/grammar-topic-assets.json';
import GrammarCardNavigator from './GrammarCardNavigator';
import FormattedText from './FormattedText';

export interface VisualDeckExample {
  en: string;
  vi: string;
  highlightWord?: string | string[];
  image?: string;
  audio?: string;
  highlightNote?: string;
  structureTag?: string;
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
          { en: 'I am not tired at all.', vi: 'Tôi không hề mệt chút nào.', highlightWord: ['am', 'not'] },
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
          { en: 'She is happy.', vi: 'Cô ấy rất vui vẻ.', highlightWord: 'is' },
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
          { en: 'The keys are on the table.', vi: 'Những chiếc chìa khóa ở trên bàn.', highlightWord: 'are' },
          { en: 'You are very kind.', vi: 'Bạn rất tốt bụng.', highlightWord: 'are' },
          { en: 'We are ready to learn.', vi: 'Chúng tôi đã sẵn sàng học tập.', highlightWord: 'are' },
          { en: 'They are in the garden.', vi: 'Họ đang ở trong vườn.', highlightWord: 'are' },
        ],
        tip: 'You, We, They hoặc từ 2 người / 2 vật trở lên luôn đi với "are". Viết tắt: You\'re, We\'re, They\'re. Phủ định là "aren\'t".',
        ruleSummary: 'Khẳng định: You/We/They are ... · Phủ định: are not (aren\'t) · Câu hỏi: Are you/we/they ...?',
      },
      {
        title: 'CÁCH NÓI TUỔI & CÂU HỎI VỚI TO BE',
        badge: 'Nói tuổi tác & Đảo to be',
        category: 'questions',
        image: '/grammar/topics/verb-to-be/04.webp',
        audio: '/grammar/topics/verb-to-be/04.mp3',
        accentColor: '#8b5cf6',
        examples: [
          { en: 'He is ten years old.', vi: 'Cậu ấy mười tuổi.', highlightWord: 'is', highlightNote: 'Nói tuổi trong tiếng Anh luôn dùng to be (S + is/am/are + số tuổi), không dùng "have"' },
          { en: 'Are you ready?', vi: 'Bạn đã sẵn sàng chưa?', highlightWord: 'Are', highlightNote: 'Câu hỏi Yes/No: Đảo to be "Are" lên đầu câu đứng trước chủ ngữ "you"' },
          { en: 'Is he your teacher?', vi: 'Thầy ấy có phải giáo viên của bạn không?', highlightWord: 'Is', highlightNote: 'Câu hỏi với chủ ngữ số ít "he": Đảo "Is" lên trước chủ ngữ' },
          { en: 'Are they your classmates?', vi: 'Họ có phải bạn cùng lớp của bạn không?', highlightWord: 'Are', highlightNote: 'Câu hỏi với chủ ngữ số nhiều "they": Đảo "Are" lên đầu câu' },
        ],
        tip: 'Khi đặt câu hỏi, chỉ cần đảo "Am / Is / Are" lên đầu câu đứng trước chủ ngữ. Khi nói tuổi tác: bắt buộc dùng to be (He is 10), không dùng have.',
        ruleSummary: 'Nói tuổi: S + to be + số tuổi · Câu hỏi: Am/Is/Are + S + ...?',
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
          { en: 'This key is mine.', vi: 'Chiếc chìa khóa này là của tôi.', highlightWord: 'This' },
          { en: 'This coffee is very hot.', vi: 'Cốc cà phê này nóng quá.', highlightWord: 'This' },
          { en: 'This is my friend Nam.', vi: 'Đây là Nam, bạn của mình.', highlightWord: 'This' },
          { en: 'Do you like this shirt?', vi: 'Bạn có thích chiếc áo này không?', highlightWord: 'this' },
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
          { en: 'That building is a museum.', vi: 'Tòa nhà đằng kia là viện bảo tàng.', highlightWord: 'That' },
          { en: 'That is my car over there.', vi: 'Chiếc xe đằng kia là của tôi.', highlightWord: 'That' },
          { en: 'Who is that girl?', vi: 'Cô gái đằng kia là ai thế?', highlightWord: 'that' },
          { en: 'That was a wonderful trip!', vi: 'Đó từng là một chuyến đi tuyệt vời!', highlightWord: 'That' },
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
          { en: 'These books are useful.', vi: 'Những cuốn sách này rất hữu ích.', highlightWord: 'These' },
          { en: 'These apples are sweet.', vi: 'Những quả táo này ngọt lắm.', highlightWord: 'These' },
          { en: 'These are my new glasses.', vi: 'Đây là chiếc kính mắt mới của tôi.', highlightWord: 'These' },
          { en: 'Look at these pictures!', vi: 'Hãy nhìn những bức ảnh này xem!', highlightWord: 'these' },
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
          { en: 'Those mountains are beautiful.', vi: 'Những ngọn núi đằng xa kia thật đẹp.', highlightWord: 'Those' },
          { en: 'Those cars are very fast.', vi: 'Những chiếc xe hơi đằng kia chạy rất nhanh.', highlightWord: 'Those' },
          { en: 'Are those your shoes?', vi: 'Đó có phải là đôi giày của bạn đằng kia không?', highlightWord: 'those' },
          { en: 'Those children are playing outside.', vi: 'Những đứa trẻ đằng kia đang chơi ngoài trời.', highlightWord: 'Those' },
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
          { en: 'There is a pharmacy near my house.', vi: 'Có một hiệu thuốc ở gần nhà tôi.', highlightWord: 'There is' },
          { en: 'There is a cat on the chair.', vi: 'Có một con mèo ở trên ghế.', highlightWord: 'There is' },
          { en: 'There is an apple on the table.', vi: 'Có một quả táo trên bàn.', highlightWord: 'There is' },
          { en: 'There is some water in the bottle.', vi: 'Có một ít nước trong chai.', highlightWord: 'There is' },
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
          { en: 'There are two messages for you.', vi: 'Có hai tin nhắn dành cho bạn.', highlightWord: 'There are' },
          { en: 'There are many students in the room.', vi: 'Có nhiều học sinh ở trong phòng.', highlightWord: 'There are' },
          { en: 'There are four chairs around the table.', vi: 'Có bốn chiếc ghế quanh bàn.', highlightWord: 'There are' },
          { en: 'There are seven days in a week.', vi: 'Có 7 ngày trong một tuần.', highlightWord: 'There are' },
        ],
        tip: 'Dùng "There are" khi danh từ theo sau là số nhiều (có đuôi -s/-es hoặc bất quy tắc như children, people).',
        ruleSummary: 'There are + số lượng / many / two + danh từ số nhiều',
      },
      {
        title: "PHỦ ĐỊNH (There isn't / There aren't)",
        badge: 'Không có người hoặc vật nào',
        category: 'negative',
        image: '/grammar/topics/there-is-there-are/03.webp',
        audio: '/grammar/topics/there-is-there-are/03.mp3',
        accentColor: '#f43f5e',
        examples: [
          { en: "There isn't any milk left.", vi: 'Không còn chút sữa nào cả.', highlightWord: "There isn't" },
          { en: "There isn't a problem here.", vi: 'Không có vấn đề gì ở đây cả.', highlightWord: "There isn't" },
          { en: "There aren't any empty seats.", vi: 'Không còn chỗ ngồi trống nào cả.', highlightWord: "There aren't" },
          { en: "There aren't many cars today.", vi: 'Hôm nay không có nhiều xe cộ.', highlightWord: "There aren't" },
        ],
        tip: 'Trong câu phủ định, thường dùng "any" đi kèm: There isn\'t any + không đếm được; There aren\'t any + số nhiều.',
        ruleSummary: "There isn't (any) ... · There aren't (any) ...",
      },
      {
        title: 'CÂU HỎI (Is there...? / Are there...?)',
        badge: 'Hỏi xem có hay không',
        category: 'questions',
        image: '/grammar/topics/there-is-there-are/04.webp',
        audio: '/grammar/topics/there-is-there-are/04.mp3',
        accentColor: '#8b5cf6',
        examples: [
          { en: 'Are there enough chairs for everyone?', vi: 'Có đủ ghế cho mọi người không?', highlightWord: 'Are there' },
          { en: 'Is there a bank near here?', vi: 'Có ngân hàng nào ở gần đây không?', highlightWord: 'Is there' },
          { en: 'Is there any water in the fridge?', vi: 'Có nước trong tủ lạnh không?', highlightWord: 'Is there' },
          { en: 'How many books are there in your bag?', vi: 'Có bao nhiêu cuốn sách trong túi bạn?', highlightWord: 'are there' },
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
          { en: 'I have a book.', vi: 'Tôi có một cuốn sách.', highlightWord: 'a' },
          { en: 'She is a friendly teacher.', vi: 'Cô ấy là một giáo viên thân thiện.', highlightWord: 'a' },
          { en: 'He drives a blue car.', vi: 'Anh ấy lái một chiếc xe màu xanh.', highlightWord: 'a' },
          { en: 'There is a cat in the garden.', vi: 'Có một con mèo trong vườn.', highlightWord: 'a' },
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
          { en: 'I have an apple.', vi: 'Tôi có một quả táo.', highlightWord: 'an' },
          { en: 'She eats an orange every day.', vi: 'Cô ấy ăn một quả cam mỗi ngày.', highlightWord: 'an' },
          { en: 'Take an umbrella with you.', vi: 'Hãy mang theo một chiếc ô nhé.', highlightWord: 'an' },
          { en: 'It took an hour to finish.', vi: 'Mất một giờ đồng hồ để hoàn thành.', highlightWord: 'an' },
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
          { en: 'I am reading the book.', vi: 'Tôi đang đọc cuốn sách đó (cuốn sách cụ thể).', highlightWord: 'the' },
          { en: 'The sun rises in the east.', vi: 'Mặt trời mọc ở hướng đông (duy nhất).', highlightWord: 'The' },
          { en: 'Please close the door.', vi: 'Làm ơn đóng cánh cửa lại giúp tôi.', highlightWord: 'the' },
          { en: 'I saw a dog. The dog was big.', vi: 'Tôi thấy một con chó. Con chó đó rất to (nhắc lại lần 2).', highlightWord: 'The' },
        ],
        tip: 'Dùng "the" cho vật đã được nhắc đến trước đó, vật mà người nghe và người nói đều biết rõ, hoặc vật thể duy nhất (the sun, the moon, the sky).',
        ruleSummary: 'the + vật thể cụ thể / xác định / duy nhất',
      },
      {
        title: 'ĐỐI CHIẾU A / AN VS THE (Ngữ cảnh nhắc lại)',
        badge: 'Từ chưa xác định (a) sang cụ thể (the)',
        category: 'contrast',
        image: '/grammar/topics/articles/04.webp',
        audio: '/grammar/topics/articles/04.mp3',
        accentColor: '#f59e0b',
        examples: [
          { en: 'I saw a dog. The dog was very big.', vi: 'Tôi thấy một con chó. Con chó đó rất to (nhắc lại lần 2 dùng the).', highlightWord: ['a', 'The'], highlightNote: 'Lần đầu nhắc tới dùng "a dog" (chưa xác định); nhắc lại lần 2 dùng "The dog" (người nghe đã biết)' },
          { en: 'A man called. The man was waiting outside.', vi: 'Một người đàn ông đã gọi. Người đó đang đợi ở ngoài.', highlightWord: ['A', 'The'], highlightNote: 'Nhắc lại lần 2 danh từ xác định dùng mạo từ "the"' },
          { en: 'I bought a pen. The pen is blue.', vi: 'Tôi đã mua một cây bút. Cây bút đó màu xanh.', highlightWord: ['a', 'The'], highlightNote: 'Cây bút cụ thể vừa mua' },
          { en: 'We ate at a restaurant. The food was great.', vi: 'Chúng tôi ăn ở một nhà hàng. Đồ ăn ở đó rất ngon.', highlightWord: ['a', 'The'], highlightNote: 'Món ăn tại nhà hàng cụ thể vừa nhắc tới' },
        ],
        tip: 'Quy tắc vàng: Lần đầu nhắc đến người/vật chưa biết dùng a/an; khi nhắc lại lần thứ hai (cả người nói và người nghe đều đã biết đối tượng nào) thì dùng the.',
        ruleSummary: 'Lần đầu: a / an + N (chưa xác định) ➔ Nhắc lại: the + N (đã xác định)',
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
          { en: 'This is my notebook. It is mine.', vi: 'Đây là cuốn vở của tôi. Nó là của tôi.', highlightWord: ['my', 'mine'] },
          { en: 'This is my notebook.', vi: 'Đây là cuốn vở của tôi.', highlightWord: 'my' },
          { en: 'The car is mine.', vi: 'Chiếc xe hơi đó là của tôi.', highlightWord: 'mine' },
          { en: 'My mother is a doctor.', vi: 'Mẹ của tôi là một bác sĩ.', highlightWord: 'My' },
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
          { en: 'Is this your seat or hers?', vi: 'Đây là chỗ ngồi của bạn hay của cô ấy?', highlightWord: ['your', 'hers'] },
          { en: 'Is this your phone?', vi: 'Đây có phải điện thoại của bạn không?', highlightWord: 'your' },
          { en: 'The choice is yours.', vi: 'Quyết định là của bạn.', highlightWord: 'yours' },
          { en: 'Your house is very lovely.', vi: 'Ngôi nhà của bạn rất xinh xắn.', highlightWord: 'Your' },
        ],
        tip: '"Your" + danh từ (your key). "Yours" có thêm chữ s, đứng một mình không cần danh từ phía sau.',
        ruleSummary: 'Tính từ sở hữu: your + N · Đại từ sở hữu: yours',
      },
      {
        title: 'THEIR / THEIRS & OUR / OURS (Của họ & Của chúng tôi)',
        badge: 'Ngôi thứ ba & thứ nhất số nhiều',
        category: 'their-our',
        image: '/grammar/topics/possessives/03.webp',
        audio: '/grammar/topics/possessives/03.mp3',
        accentColor: '#f43f5e',
        examples: [
          { en: 'Their house is next to ours.', vi: 'Nhà của họ ở ngay cạnh nhà chúng tôi.', highlightWord: ['Their', 'ours'], highlightNote: 'Their + danh từ (nhà của họ); ours đứng độc lập (nhà của chúng tôi)' },
          { en: 'Our school is very modern.', vi: 'Trường học của chúng tôi rất hiện đại.', highlightWord: 'Our', highlightNote: 'Our + danh từ số ít hoặc số nhiều' },
          { en: 'The future is ours.', vi: 'Tương lai thuộc về chúng ta.', highlightWord: 'ours', highlightNote: 'ours đứng độc lập làm bổ ngữ' },
          { en: 'That beautiful garden is theirs.', vi: 'Khu vườn xinh đẹp đó là của họ.', highlightWord: 'theirs', highlightNote: 'theirs đứng độc lập cuối câu' },
        ],
        tip: 'Chỉ cần thêm "s" vào đuôi our và their để chuyển thành đại từ sở hữu độc lập: our -> ours, their -> theirs.',
        ruleSummary: 'Chúng tôi: our + N / ours · Họ: their + N / theirs',
      },
      {
        title: 'MY & YOURS (Đối chiếu Tính từ & Đại từ sở hữu)',
        badge: 'Phân biệt tính từ sở hữu vs đại từ độc lập',
        category: 'my-yours',
        image: '/grammar/topics/possessives/04.webp',
        audio: '/grammar/topics/possessives/04.mp3',
        accentColor: '#a855f7',
        examples: [
          { en: 'My bag is blue; yours is black.', vi: 'Túi của tôi màu xanh; của bạn màu đen.', highlightWord: ['My', 'yours'], highlightNote: 'My + N (túi của tôi); yours đứng độc lập thay thế cho your bag' },
          { en: 'His car is fast; hers is faster.', vi: 'Xe của anh ấy chạy nhanh; xe của cô ấy còn nhanh hơn.', highlightWord: ['His', 'hers'], highlightNote: 'hers thay thế cho her car' },
          { en: 'The bicycle is his.', vi: 'Chiếc xe đạp đó là của anh ấy.', highlightWord: 'his', highlightNote: 'his vừa là tính từ vừa là đại từ' },
          { en: 'Her dress is very pretty.', vi: 'Chiếc váy của cô ấy rất đẹp.', highlightWord: 'Her', highlightNote: 'Her + N (tính từ sở hữu)' },
        ],
        tip: 'Quy tắc: Tính từ sở hữu BẮT BUỘC có danh từ theo sau (my book). Đại từ sở hữu đứng ĐỘC LẬP thay cho cả cụm (It is mine).',
        ruleSummary: 'Tính từ sở hữu: my/your/his/her + N · Đại từ: mine/yours/his/hers',
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
          { en: 'I have two sisters.', vi: 'Tôi có hai chị em gái.', highlightWord: 'sisters' },
          { en: 'She bought three books.', vi: 'Cô ấy đã mua ba cuốn sách.', highlightWord: 'books' },
          { en: 'There are five cats in the room.', vi: 'Có 5 con mèo ở trong phòng.', highlightWord: 'cats' },
          { en: 'Cars are parked outside.', vi: 'Những chiếc xe hơi đang đỗ ở ngoài.', highlightWord: 'Cars' },
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
          { en: 'There are many boxes.', vi: 'Có nhiều chiếc hộp ở đây.', highlightWord: 'boxes' },
          { en: 'He washes the dishes every night.', vi: 'Anh ấy rửa bát đĩa mỗi tối.', highlightWord: 'dishes' },
          { en: 'She watches two movies on Sunday.', vi: 'Cô ấy xem hai bộ phim vào Chủ nhật.', highlightWord: 'movies' },
          { en: 'I have three bus passes.', vi: 'Tôi có 3 chiếc vé xe buýt.', highlightWord: 'passes' },
        ],
        tip: 'Khi danh từ tận cùng bằng s, ss, sh, ch, x, z ta thêm "-es" để phát âm thành /ɪz/: box -> boxes, bus -> buses, watch -> watches.',
        ruleSummary: 'Tận cùng s, sh, ch, x, z + es (box → boxes)',
      },
      {
        title: 'BẤT QUY TẮC (Irregular Plurals: child → children)',
        badge: 'Cần học thuộc lòng',
        category: 'irregular',
        image: '/grammar/topics/plural-nouns/03.webp',
        audio: '/grammar/topics/plural-nouns/03.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'The children are playing.', vi: 'Những đứa trẻ đang chơi đùa.', highlightWord: 'children', highlightNote: 'Danh từ bất quy tắc: child (1 đứa trẻ) → children (nhiều đứa trẻ)' },
          { en: 'There are ten people in the room.', vi: 'Có 10 người ở trong phòng.', highlightWord: 'people', highlightNote: 'person → people' },
          { en: 'Two men and three women arrived.', vi: 'Hai người đàn ông và 3 người phụ nữ đã đến.', highlightWord: ['men', 'women'], highlightNote: 'man → men, woman → women' },
          { en: 'Brush your teeth twice a day.', vi: 'Hãy đánh răng của bạn hai lần mỗi ngày.', highlightWord: 'teeth', highlightNote: 'tooth → teeth' },
        ],
        tip: 'Các danh từ biến đổi đặc biệt không thêm s: man -> men, woman -> women, child -> children, person -> people, tooth -> teeth, foot -> feet.',
        ruleSummary: 'child → children · person → people · tooth → teeth',
      },
      {
        title: 'DANH TỪ SỐ NHIỀU NÓI CHUNG (General Statements)',
        badge: 'Khái quát về cả loài hoặc nhóm',
        category: 'general',
        image: '/grammar/topics/plural-nouns/04.webp',
        audio: '/grammar/topics/plural-nouns/04.mp3',
        accentColor: '#ec4899',
        examples: [
          { en: 'Dogs are loyal animals.', vi: 'Chó là loài động vật trung thành.', highlightWord: ['Dogs', 'animals'], highlightNote: 'Danh từ số nhiều không mạo từ khi đưa ra nhận định chung về cả loài' },
          { en: 'Cats love sleeping in the sun.', vi: 'Mèo thích ngủ dưới ánh nắng mặt trời.', highlightWord: 'Cats', highlightNote: 'Khái quát về loài mèo nói chung' },
          { en: 'Books give us valuable knowledge.', vi: 'Sách mang lại cho chúng ta tri thức quý báu.', highlightWord: 'Books', highlightNote: 'Khái quát về sách nói chung' },
          { en: 'Elephants have great memory.', vi: 'Voi có trí nhớ rất tuyệt vời.', highlightWord: 'Elephants', highlightNote: 'Khái quát về loài voi nói chung' },
        ],
        tip: 'Khi nói về đặc tính chung của một loài hoặc một nhóm sự vật, dùng danh từ số nhiều (Dogs, Books) mà KHÔNG cần thêm mạo từ the.',
        ruleSummary: 'Danh từ số nhiều + V số nhiều (nhận định khái quát)',
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
          { en: 'I drink coffee every morning.', vi: 'Tôi uống cà phê mỗi buổi sáng.', highlightWord: 'drink' },
          { en: 'We live in Hanoi.', vi: 'Chúng tôi sống ở Hà Nội.', highlightWord: 'live' },
          { en: 'They play football on Sundays.', vi: 'Họ chơi bóng đá vào mỗi Chủ nhật.', highlightWord: 'play' },
          { en: 'You speak English very well.', vi: 'Bạn nói tiếng Anh rất giỏi.', highlightWord: 'speak' },
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
          { en: 'The Earth revolves around the Sun.', vi: 'Trái đất quay quanh Mặt trời (chân lý).', highlightWord: 'revolves' },
          { en: 'She works at a hospital.', vi: 'Cô ấy làm việc tại một bệnh viện.', highlightWord: 'works' },
          { en: 'He likes classical music.', vi: 'Anh ấy thích nhạc cổ điển.', highlightWord: 'likes' },
          { en: 'The train leaves at 7 a.m.', vi: 'Chuyến tàu khởi hành lúc 7 giờ sáng.', highlightWord: 'leaves' },
        ],
        tip: 'Với He, She, It và danh từ số ít, động từ BẮT BUỘC thêm "-s" (works, likes) hoặc "-es" khi tận cùng là o, s, sh, ch, x (goes, watches).',
        ruleSummary: 'He / She / It + V-s / V-es',
      },
      {
        title: 'LỊCH TRÌNH CỐ ĐỊNH (Schedules & Timetables)',
        badge: 'Tàu xe, máy bay, giờ mở cửa',
        category: 'schedules',
        image: '/grammar/topics/present-simple/03.webp',
        audio: '/grammar/topics/present-simple/03.mp3',
        accentColor: '#f59e0b',
        examples: [
          { en: 'The bus leaves at 7 a.m.', vi: 'Xe buýt khởi hành lúc 7 giờ sáng.', highlightWord: 'leaves', highlightNote: 'Lịch trình tàu xe công cộng dùng hiện tại đơn; chủ ngữ "The bus" số ít nên leave + s' },
          { en: 'The flight lands at 9:30 tonight.', vi: 'Chuyến bay hạ cánh lúc 9:30 tối nay.', highlightWord: 'lands', highlightNote: 'Lịch trình máy bay cố định' },
          { en: 'Our English lesson starts at 8.', vi: 'Tiết học tiếng Anh bắt đầu lúc 8 giờ.', highlightWord: 'starts', highlightNote: 'Thời khóa biểu trường học cố định' },
          { en: 'The supermarket closes at 10 p.m.', vi: 'Siêu thị đóng cửa vào lúc 10 giờ tối.', highlightWord: 'closes', highlightNote: 'Giờ hoạt động công cộng cố định' },
        ],
        tip: 'Khi nói về lịch trình tàu xe, máy bay, lịch chiếu phim, giờ mở/đóng cửa, người bản ngữ luôn dùng thì Hiện tại đơn thay vì thì tương lai.',
        ruleSummary: 'S + V-s/es + mốc giờ (Lịch trình công cộng cố định)',
      },
      {
        title: 'SỞ THÍCH, TÌNH CẢM & TRẠNG THÁI (Likes, Emotions & States)',
        badge: 'Động từ chỉ trạng thái & tình cảm',
        category: 'states',
        image: '/grammar/topics/present-simple/04.webp',
        audio: '/grammar/topics/present-simple/04.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'She loves reading books.', vi: 'Cô ấy yêu thích việc đọc sách.', highlightWord: 'loves', highlightNote: 'Động từ chỉ sở thích thêm -s theo chủ ngữ She; sau love dùng V-ing' },
          { en: 'I have a pet cat.', vi: 'Tôi có một chú mèo cưng.', highlightWord: 'have', highlightNote: 'have chỉ sở hữu (không dùng thì tiếp diễn I am having)' },
          { en: 'He likes classical music.', vi: 'Anh ấy thích nghe nhạc cổ điển.', highlightWord: 'likes', highlightNote: 'Sở thích cá nhân dùng hiện tại đơn' },
          { en: 'They understand the lesson very well.', vi: 'Họ hiểu bài học rất rõ.', highlightWord: 'understand', highlightNote: 'Động từ nhận thức (stative verb) dùng hiện tại đơn' },
        ],
        tip: 'Các động từ chỉ cảm xúc (love, like, hate), sở hữu (have, own) và nhận thức (know, understand) thường không chia thì tiếp diễn mà dùng hiện tại đơn.',
        ruleSummary: 'S + V(s/es) (Động từ chỉ trạng thái, cảm xúc, sở thích)',
      },
    ],
  },

  // 8. Have got / Has got
  'have-got': {
    subtitle: 'Diễn tả quyền sở hữu, mối quan hệ gia đình và tình trạng sức khỏe',
    cards: [
      {
        title: 'HAVE GOT (I / You / We / They)',
        badge: 'Sở hữu (Ngôi 1, 2 và số nhiều)',
        category: 'have-got',
        image: '/grammar/topics/have-got/01.webp',
        audio: '/grammar/topics/have-got/01.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'I have got a new bag.', vi: 'Tôi có một chiếc túi mới.', highlightWord: 'have got' },
          { en: 'We have got two tickets for the movie.', vi: 'Chúng tôi có hai vé xem phim.', highlightWord: 'have got' },
          { en: 'They have got a lovely garden.', vi: 'Họ có một khu vườn xinh xắn.', highlightWord: 'have got' },
          { en: "I've got a headache today.", vi: 'Hôm nay tôi bị đau đầu.', highlightWord: "'ve got" },
        ],
        tip: 'Viết tắt: I have got -> I\'ve got, We have got -> We\'ve got. Rất phổ biến trong văn nói Anh-Anh.',
        ruleSummary: "I/You/We/They + have got ('ve got)",
      },
      {
        title: 'HAS GOT (He / She / It)',
        badge: 'Sở hữu (Ngôi 3 số ít)',
        category: 'has-got',
        image: '/grammar/topics/have-got/02.webp',
        audio: '/grammar/topics/have-got/02.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'She has got two brothers.', vi: 'Cô ấy có hai người anh trai.', highlightWord: 'has got' },
          { en: 'He has got blue eyes.', vi: 'Cậu ấy có đôi mắt màu xanh biển.', highlightWord: 'has got' },
          { en: 'She has got a friendly smile.', vi: 'Cô ấy có nụ cười thân thiện.', highlightWord: 'has got' },
          { en: 'Our cat has got white paws.', vi: 'Chú mèo của chúng tôi có bốn chân màu trắng.', highlightWord: 'has got' },
        ],
        tip: 'He, She, It dùng "has got" (viết tắt là \'s got: He\'s got = He has got, không phải He is got).',
        ruleSummary: "He/She/It + has got ('s got)",
      },
      {
        title: 'MIÊU TẢ ĐẶC ĐIỂM NGOẠI HÌNH (Physical Appearance)',
        badge: 'Mắt, tóc, nét mặt',
        category: 'appearance',
        image: '/grammar/topics/have-got/03.webp',
        audio: '/grammar/topics/have-got/03.mp3',
        accentColor: '#f59e0b',
        examples: [
          { en: 'He has got brown eyes.', vi: 'Cậu ấy có đôi mắt màu nâu.', highlightWord: 'has got', highlightNote: 'has got dùng miêu tả đặc điểm ngoại hình (mắt, tóc...)' },
          { en: 'She has got long curly hair.', vi: 'Cô ấy có mái tóc dài xoăn.', highlightWord: 'has got', highlightNote: 'Miêu tả kiểu tóc' },
          { en: 'They have got bright smiles.', vi: 'Họ có những nụ cười rạng rỡ.', highlightWord: 'have got', highlightNote: 'have got cho chủ ngữ số nhiều' },
          { en: 'Our cat has got white paws.', vi: 'Chú mèo của chúng tôi có bốn chân màu trắng.', highlightWord: 'has got', highlightNote: 'has got cho thú cưng' },
        ],
        tip: 'Have got / has got cực kỳ phổ biến khi miêu tả ngoại hình người hoặc động vật (màu mắt, độ dài tóc, chiều cao).',
        ruleSummary: 'S + have/has got + đặc điểm ngoại hình (eyes, hair...)',
      },
      {
        title: 'TÌNH TRẠNG SỨC KHỎE & BỆNH TẬT (Illnesses & Health Issues)',
        badge: 'Cơn đau, cảm cúm, vấn đề sức khỏe',
        category: 'health',
        image: '/grammar/topics/have-got/04.webp',
        audio: '/grammar/topics/have-got/04.mp3',
        accentColor: '#ec4899',
        examples: [
          { en: 'I have got a headache.', vi: 'Tôi bị đau đầu.', highlightWord: 'have got', highlightNote: 'have got dùng để nói về các triệu chứng bệnh tật hoặc cơn đau' },
          { en: 'He has got a sore throat.', vi: 'Anh ấy bị đau họng.', highlightWord: 'has got', highlightNote: 'has got + triệu chứng sức khỏe' },
          { en: "She's got a cold today.", vi: 'Hôm nay cô ấy bị cảm lạnh.', highlightWord: "'s got", highlightNote: "'s got là dạng rút gọn của has got" },
          { en: "I've got a stomachache.", vi: 'Tôi bị đau dạ dày / đau bụng.', highlightWord: "'ve got", highlightNote: "'ve got là dạng rút gọn của have got" },
        ],
        tip: 'Dùng have got / has got với các bệnh thông thường: a headache (đau đầu), a cold (cảm cúm), a cough (ho), a toothache (đau răng).',
        ruleSummary: 'S + have/has got + a headache / a cold / a sore throat',
      },
    ],
  },

  // 9. Present Continuous
  'present-continuous': {
    subtitle: 'Diễn tả hành động đang diễn ra tại thời điểm nói hoặc kế hoạch chắc chắn',
    cards: [
      {
        title: 'KHẲNG ĐỊNH (am / is / are + V-ing)',
        badge: 'Đang xảy ra ngay lúc này',
        category: 'affirmative',
        image: '/grammar/topics/present-continuous/01.webp',
        audio: '/grammar/topics/present-continuous/01.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'I am studying English now.', vi: 'Bây giờ tôi đang học tiếng Anh.', highlightWord: 'am studying' },
          { en: 'She is cooking dinner.', vi: 'Cô ấy đang nấu bữa tối.', highlightWord: 'is cooking' },
          { en: 'They are playing football.', vi: 'Họ đang chơi bóng đá ngoài sân.', highlightWord: 'are playing' },
          { en: 'Listen! The birds are singing.', vi: 'Hãy lắng nghe xem! Những chú chim đang hót.', highlightWord: 'are singing' },
        ],
        tip: 'Công thức luôn gồm 2 phần: to be (am/is/are) + động từ thêm đuôi -ing. Tuyệt đối không được bỏ to be (sai: "I reading").',
        ruleSummary: 'S + am / is / are + V-ing',
      },
      {
        title: "PHỦ ĐỊNH (am not / isn't / aren't + V-ing)",
        badge: 'Đang không làm gì đó',
        category: 'negative',
        image: '/grammar/topics/present-continuous/02.webp',
        accentColor: '#f43f5e',
        examples: [
          { en: 'I am not playing games.', vi: 'Tôi đang không chơi game.', highlightWord: 'am not playing' },
          { en: "He isn't sleeping right now.", vi: 'Anh ấy đang không ngủ đâu.', highlightWord: "isn't sleeping" },
          { en: "We aren't watching TV.", vi: 'Chúng tôi đang không xem ti vi.', highlightWord: "aren't watching" },
          { en: "It isn't raining anymore.", vi: 'Trời không còn mưa nữa rồi.', highlightWord: "isn't raining" },
        ],
        tip: 'Thêm not ngay sau to be: am not, is not (isn\'t), are not (aren\'t). Động từ chính vẫn giữ nguyên đuôi -ing.',
        ruleSummary: "S + am not / isn't / aren't + V-ing",
      },
      {
        title: 'CÂU HỎI (Am / Is / Are + S + V-ing...?)',
        badge: 'Hỏi ai đang làm gì',
        category: 'questions',
        image: '/grammar/topics/present-continuous/03.webp',
        accentColor: '#8b5cf6',
        examples: [
          { en: 'What are you doing?', vi: 'Bạn đang làm gì thế?', highlightWord: 'are you doing' },
          { en: 'Are you listening to me?', vi: 'Bạn có đang lắng nghe tôi nói không?', highlightWord: 'Are you listening' },
          { en: 'Is she studying in her room?', vi: 'Có phải cô ấy đang học trong phòng không?', highlightWord: 'Is she studying' },
          { en: 'Where are they going?', vi: 'Họ đang đi đâu thế?', highlightWord: 'are they going' },
        ],
        tip: 'Đảo to be lên trước chủ ngữ. Với câu hỏi có từ để hỏi (What/Where/Why), đặt Wh- lên đầu tiên.',
        ruleSummary: '(Wh-) + Am / Is / Are + S + V-ing?',
      },
      {
        title: 'KẾ HOẠCH TƯƠNG LAI GẦN',
        badge: 'Đã lên lịch trình chắc chắn',
        category: 'future-plan',
        image: '/grammar/topics/present-continuous/04.webp',
        audio: '/grammar/topics/present-continuous/03.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'We are flying to Japan next week.', vi: 'Chúng tôi sẽ bay sang Nhật vào tuần tới.', highlightWord: 'are flying' },
          { en: 'I am meeting my doctor tomorrow.', vi: 'Tôi sẽ gặp bác sĩ vào ngày mai (đã đặt hẹn).', highlightWord: 'am meeting' },
          { en: 'She is having a party this Saturday.', vi: 'Cô ấy sẽ tổ chức tiệc vào thứ Bảy này.', highlightWord: 'is having' },
          { en: 'They are leaving tonight.', vi: 'Họ sẽ rời đi tối nay.', highlightWord: 'are leaving' },
        ],
        tip: 'Thì hiện tại tiếp diễn dùng rất nhiều để nói về kế hoạch tương lai đã sắp xếp sẵn kèm thời gian cụ thể (tomorrow, next week).',
        ruleSummary: 'S + am/is/are + V-ing + từ chỉ tương lai (tomorrow, next week)',
      },
    ],
  },

  // 10. Prepositions of Place
  'prepositions-place': {
    subtitle: 'Nắm vững 3 giới từ cốt lõi IN, ON, AT và các giới từ chỉ vị trí xung quanh',
    cards: [
      {
        title: 'IN (Bên trong không gian 3 chiều)',
        badge: 'Trong túi, trong phòng, thành phố',
        category: 'in',
        image: '/grammar/topics/prepositions-place/01.webp',
        audio: '/grammar/topics/prepositions-place/01.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'The keys are in my bag.', vi: 'Chìa khóa ở trong túi của tôi.', highlightWord: 'in' },
          { en: 'The children are in the room.', vi: 'Những đứa trẻ đang ở trong phòng.', highlightWord: 'in' },
          { en: 'I live in Hanoi.', vi: 'Tôi sống ở Hà Nội.', highlightWord: 'in' },
          { en: 'There is some water in the cup.', vi: 'Có một chút nước ở trong cốc.', highlightWord: 'in' },
        ],
        tip: '"IN" dùng cho không gian khép kín (in a box, in a car, in the room) và địa giới lớn (in Vietnam, in Tokyo).',
        ruleSummary: 'in + không gian khép kín / thành phố / đất nước',
      },
      {
        title: 'ON (Trên bề mặt tiếp xúc)',
        badge: 'Ở trên bề mặt bàn, sàn, tường',
        category: 'on',
        image: '/grammar/topics/prepositions-place/02.webp',
        audio: '/grammar/topics/prepositions-place/02.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'Your phone is on the desk.', vi: 'Điện thoại của bạn ở trên bàn.', highlightWord: 'on' },
          { en: 'The picture is on the wall.', vi: 'Bức tranh treo trên tường.', highlightWord: 'on' },
          { en: 'My phone is on the floor.', vi: 'Điện thoại của tôi ở trên sàn nhà.', highlightWord: 'on' },
          { en: 'There is a cup on the desk.', vi: 'Có một chiếc cốc ở trên bàn làm việc.', highlightWord: 'on' },
        ],
        tip: '"ON" dùng khi có sự tiếp xúc trực tiếp trên một bề mặt: on the table, on the wall, on the floor, on the roof.',
        ruleSummary: 'on + bề mặt (on the table, on the wall, on the 2nd floor)',
      },
      {
        title: 'AT (Tại một địa điểm / điểm xác định)',
        badge: 'Trạm xe, lối vào, cửa sổ, trường học',
        category: 'at',
        image: '/grammar/topics/prepositions-place/03.webp',
        audio: '/grammar/topics/prepositions-place/03.mp3',
        accentColor: '#f59e0b',
        examples: [
          { en: 'Meet me at the entrance.', vi: 'Gặp tôi ở lối vào nhé.', highlightWord: 'at' },
          { en: 'She is waiting at the bus stop.', vi: 'Cô ấy đang đợi ở trạm xe buýt.', highlightWord: 'at' },
          { en: 'Someone is knocking at the door.', vi: 'Có ai đó đang gõ cửa.', highlightWord: 'at' },
          { en: 'We met at the airport.', vi: 'Chúng tôi đã gặp nhau tại sân bay.', highlightWord: 'at' },
        ],
        tip: '"AT" xem địa điểm như một tọa độ/điểm dừng cụ thể: at home, at work, at school, at the bus stop, at the station.',
        ruleSummary: 'at + địa điểm cụ thể / tọa độ (at home, at the bus stop)',
      },
      {
        title: 'VỊ TRÍ TƯƠNG ĐỐI (opposite, under, behind, next to)',
        badge: 'Đối diện, dưới, sau, cạnh',
        category: 'relative-place',
        image: '/grammar/topics/prepositions-place/04.webp',
        audio: '/grammar/topics/prepositions-place/04.mp3',
        accentColor: '#ec4899',
        examples: [
          { en: 'The bank is opposite the post office.', vi: 'Ngân hàng nằm đối diện bưu điện.', highlightWord: 'opposite' },
          { en: 'The puppy is under the chair.', vi: 'Chú cún con ở dưới gầm ghế.', highlightWord: 'under' },
          { en: 'My house is next to a supermarket.', vi: 'Nhà của tôi ở ngay cạnh siêu thị.', highlightWord: 'next to' },
          { en: 'The shop is between two banks.', vi: 'Cửa hàng nằm ở giữa hai ngân hàng.', highlightWord: 'between' },
        ],
        tip: 'opposite = đối diện · under = ở dưới · next to = ở ngay cạnh · behind = ở phía sau.',
        ruleSummary: 'opposite (đối diện) · under (dưới) · next to (cạnh) · between A and B (giữa)',
      },
    ],
  },

  // 11. Wh- Questions
  'wh-questions': {
    subtitle: 'Cách đặt câu hỏi với từ để hỏi (What, Where, When, Who, Why, How...)',
    cards: [
      {
        title: 'WHAT (Cái gì / Điều gì)',
        badge: 'Hỏi về sự vật, thông tin hoặc nghề nghiệp',
        category: 'what',
        image: '/grammar/topics/wh-questions/01.webp',
        accentColor: '#3b82f6',
        examples: [
          { en: 'What is your name?', vi: 'Tên của bạn là gì?', highlightWord: 'What' },
          { en: 'What are you doing?', vi: 'Bạn đang làm gì thế?', highlightWord: 'What' },
          { en: 'What do you do?', vi: 'Bạn làm nghề gì?', highlightWord: 'What' },
          { en: 'What time is it?', vi: 'Mấy giờ rồi?', highlightWord: 'What' },
        ],
        tip: '"What" hỏi về đồ vật, hành động, hoặc danh tính. "What... for" = để làm gì. "What time" = mấy giờ.',
        ruleSummary: 'What + be + S...? hoặc What + do/does + S + V...?',
      },
      {
        title: 'WHERE & WHEN (Ở đâu & Khi nào)',
        badge: 'Hỏi về nơi chốn và thời gian',
        category: 'where-when',
        image: '/grammar/topics/wh-questions/02.webp',
        audio: '/grammar/topics/wh-questions/01.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'Where do you live?', vi: 'Bạn sống ở đâu?', highlightWord: 'Where' },
          { en: 'Where is my phone?', vi: 'Điện thoại của tôi ở đâu rồi?', highlightWord: 'Where' },
          { en: 'When does the class start?', vi: 'Khi nào thì lớp học bắt đầu?', highlightWord: 'When' },
          { en: 'When is your birthday?', vi: 'Sinh nhật của bạn là khi nào?', highlightWord: 'When' },
        ],
        tip: '"Where" hỏi về nơi chốn (Trả lời bằng giới từ in/on/at). "When" hỏi về thời gian (ngày, giờ, tháng, năm).',
        ruleSummary: 'Where/When + trợ động từ + S + V...?',
      },
      {
        title: 'WHO & WHY (Ai & Tại sao)',
        badge: 'Hỏi về con người và lý do / nguyên nhân',
        category: 'who-why',
        image: '/grammar/topics/wh-questions/03.webp',
        audio: '/grammar/topics/wh-questions/03.mp3',
        accentColor: '#f43f5e',
        examples: [
          { en: 'Who called you last night?', vi: 'Ai đã gọi cho bạn tối qua?', highlightWord: 'Who' },
          { en: 'Who is that friendly girl?', vi: 'Cô gái thân thiện đằng kia là ai thế?', highlightWord: 'Who' },
          { en: 'Why are you learning English?', vi: 'Tại sao bạn lại học tiếng Anh?', highlightWord: 'Why' },
          { en: 'Why are you late today?', vi: 'Tại sao hôm nay bạn lại đến muộn?', highlightWord: 'Why' },
        ],
        tip: '"Who" hỏi về người. "Why" hỏi về lý do (câu trả lời luôn bắt đầu bằng "Because...").',
        ruleSummary: 'Who + V...? (hỏi chủ ngữ) · Why + do/does/is + S...?',
      },
      {
        title: 'HOW & HOW MUCH / MANY (Như thế nào & Bao nhiêu)',
        badge: 'Cách thức, tình trạng và số lượng',
        category: 'how',
        image: '/grammar/topics/wh-questions/04.webp',
        audio: '/grammar/topics/wh-questions/04.mp3',
        accentColor: '#f59e0b',
        examples: [
          { en: 'How much does it cost?', vi: 'Cái này có giá bao nhiêu tiền?', highlightWord: 'How much' },
          { en: 'How are you today?', vi: 'Hôm nay bạn khỏe không?', highlightWord: 'How' },
          { en: 'How many books did you buy?', vi: 'Bạn đã mua bao nhiêu cuốn sách?', highlightWord: 'How many' },
          { en: 'How do you go to school?', vi: 'Bạn đến trường bằng phương tiện gì?', highlightWord: 'How' },
        ],
        tip: 'How many + danh từ đếm được số nhiều (books). How much + danh từ không đếm được hoặc giá tiền (money).',
        ruleSummary: 'How many + N số nhiều · How much + N không đếm được / giá tiền',
      },
    ],
  },

  // 12. Adverbs of Frequency
  'adverbs-frequency': {
    subtitle: 'Nói về mức độ thường xuyên lặp lại của một hành động (Always, Usually, Often, Never...)',
    cards: [
      {
        title: 'ALWAYS & USUALLY (100% & 80%)',
        badge: 'Luôn luôn và Thường lệ',
        category: 'always-usually',
        image: '/grammar/topics/adverbs-frequency/01.webp',
        audio: '/grammar/topics/adverbs-frequency/02.mp3',
        accentColor: '#3b82f6',
        examples: [
          { en: 'She is always helpful.', vi: 'Cô ấy luôn luôn nhiệt tình giúp đỡ.', highlightWord: 'always' },
          { en: 'I usually walk to work.', vi: 'Tôi thường đi bộ đi làm.', highlightWord: 'usually' },
          { en: 'I always brush my teeth before bed.', vi: 'Tôi luôn luôn đánh răng trước khi đi ngủ.', highlightWord: 'always' },
          { en: 'We usually have dinner together at 7.', vi: 'Chúng tôi thường lệ ăn tối cùng nhau lúc 7 giờ.', highlightWord: 'usually' },
        ],
        tip: 'Always (100%): luôn luôn làm. Usually (80%): việc làm theo thói quen hàng ngày.',
        ruleSummary: 'S + always / usually + V thường (hoặc be + always / usually)',
      },
      {
        title: 'OFTEN & SOMETIMES (60% & 30%)',
        badge: 'Thường thường và Thỉnh thoảng',
        category: 'often-sometimes',
        image: '/grammar/topics/adverbs-frequency/02.webp',
        audio: '/grammar/topics/adverbs-frequency/04.mp3',
        accentColor: '#10b981',
        examples: [
          { en: 'Do you often call your parents?', vi: 'Bạn có thường gọi điện cho bố mẹ không?', highlightWord: 'often' },
          { en: 'I often read books on weekends.', vi: 'Tôi thường hay đọc sách vào cuối tuần.', highlightWord: 'often' },
          { en: 'He sometimes drinks green tea.', vi: 'Thỉnh thoảng anh ấy uống trà xanh.', highlightWord: 'sometimes' },
          { en: 'Sometimes we go cinema together.', vi: 'Thỉnh thoảng chúng tôi đi xem phim cùng nhau.', highlightWord: 'Sometimes' },
        ],
        tip: 'Often (60%): xảy ra khá nhiều lần. Sometimes (30%): thỉnh thoảng (có thể đứng đầu câu: Sometimes I...).',
        ruleSummary: 'S + often / sometimes + V',
      },
      {
        title: 'RARELY & NEVER (10% & 0%)',
        badge: 'Hiếm khi và Không bao giờ',
        category: 'rarely-never',
        image: '/grammar/topics/adverbs-frequency/03.webp',
        audio: '/grammar/topics/adverbs-frequency/03.mp3',
        accentColor: '#f43f5e',
        examples: [
          { en: 'We rarely eat out.', vi: 'Chúng tôi hiếm khi đi ăn tiệm.', highlightWord: 'rarely' },
          { en: 'We rarely eat fast food.', vi: 'Chúng tôi hiếm khi ăn đồ ăn nhanh.', highlightWord: 'rarely' },
          { en: 'He never smokes cigarettes.', vi: 'Anh ấy không bao giờ hút thuốc lá.', highlightWord: 'never' },
          { en: 'I never stay up after midnight.', vi: 'Tôi không bao giờ thức khuya sau nửa đêm.', highlightWord: 'never' },
        ],
        tip: 'Never (0%): mang nghĩa phủ định sẵn, tuyệt đối KHÔNG dùng kèm "not" (sai: "I don\'t never").',
        ruleSummary: 'S + rarely / never + V khẳng định (không dùng not)',
      },
      {
        title: 'HỎI VỀ TẦN SUẤT: HOW OFTEN...?',
        badge: 'Hỏi bao lâu một lần',
        category: 'how-often',
        image: '/grammar/topics/adverbs-frequency/04.webp',
        accentColor: '#8b5cf6',
        examples: [
          { en: 'How often do you exercise?', vi: 'Bạn có thường xuyên tập thể dục không?', highlightWord: 'How often' },
          { en: 'How often do you travel abroad?', vi: 'Bao lâu thì bạn đi du lịch nước ngoài một lần?', highlightWord: 'How often' },
          { en: 'I go swimming twice a week.', vi: 'Tôi đi bơi hai lần một tuần.', highlightWord: 'twice a week' },
          { en: 'She visits her grandparents once a month.', vi: 'Cô ấy về thăm ông bà mỗi tháng một lần.', highlightWord: 'once a month' },
        ],
        tip: 'Trả lời: once a week (1 lần/tuần), twice a month (2 lần/tháng), three times a year (3 lần/năm), every day (mỗi ngày).',
        ruleSummary: 'How often + do/does + S + V...?',
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
          { en: 'She bought a beautiful dress.', vi: 'Cô ấy đã mua một chiếc váy đẹp.', highlightWord: 'beautiful' },
          { en: 'He drives a fast car.', vi: 'Anh ấy lái một chiếc xe hơi chạy nhanh.', highlightWord: 'fast' },
          { en: 'They live in a big house.', vi: 'Họ sống trong một ngôi nhà lớn.', highlightWord: 'big' },
          { en: 'This is a difficult question.', vi: 'Đây là một câu hỏi khó.', highlightWord: 'difficult' },
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
          { en: 'The soup smells delicious.', vi: 'Món súp có mùi thơm ngon quá.', highlightWord: 'delicious' },
          { en: 'My father is tall and strong.', vi: 'Bố tôi cao và khỏe mạnh.', highlightWord: ['tall', 'strong'] },
          { en: 'The classroom is very clean.', vi: 'Phòng học rất sạch sẽ.', highlightWord: 'clean' },
          { en: 'She looks very happy today.', vi: 'Hôm nay trông cô ấy rất vui vẻ.', highlightWord: 'happy' },
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
          { en: 'I am tired after the long trip.', vi: 'Tôi mệt sau chuyến đi dài.', highlightWord: ['tired', 'long'] },
          { en: 'Are you hungry?', vi: 'Bạn có đói không?', highlightWord: 'hungry' },
          { en: 'He feels happy and relaxed.', vi: 'Cậu ấy cảm thấy vui vẻ và thư thái.', highlightWord: ['happy', 'relaxed'] },
          { en: "Don't be sad, everything will be fine.", vi: 'Đừng buồn, mọi chuyện sẽ ổn thôi.', highlightWord: 'sad' },
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
          { en: 'We need something cheaper.', vi: 'Chúng ta cần thứ gì đó rẻ hơn.', highlightWord: 'cheaper' },
          { en: 'This house is big, that one is small.', vi: 'Ngôi nhà này to, ngôi nhà kia nhỏ.', highlightWord: ['big', 'small'] },
          { en: 'Summer is hot, winter is cold.', vi: 'Mùa hè thì nóng, mùa đông thì lạnh.', highlightWord: ['hot', 'cold'] },
          { en: 'An old book vs a new car.', vi: 'Một cuốn sách cũ đối lập với chiếc xe mới.', highlightWord: ['old', 'new'] },
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
    const isLastCard = index === cardsToRender.length - 1;
    const navPills = cardsToRender.map((item, idx) => {
      const rawPrefix = item.title.split(/[—–:(]/)[0].trim();
      const shortSub = rawPrefix.length <= 16 ? rawPrefix : rawPrefix.slice(0, 14).trim();
      return {
        label: `Ý ${idx + 1}`,
        subLabel: shortSub || undefined,
      };
    });
    return (
      <div className="space-y-3 min-w-0 max-w-3xl mx-auto">
        <GrammarCardNavigator
          titles={cardsToRender.map((item) => item.title)}
          pills={navPills}
          index={index}
          onChange={(nextIndex) => {
            grammarAudio.stopAll();
            setCardIndex(nextIndex);
          }}
          onComplete={() => {
            grammarAudio.stopAll();
            if (typeof window !== 'undefined') {
              window.location.href = `/grammar/practice?topic=${encodeURIComponent(topicSlug)}`;
            }
          }}
          completeLabel="Luyện tập"
        />
        <VisualTopicCardItem
          key={`${topicSlug}-${index}`}
          card={card}
          cardIndex={index}
          topicSlug={topicSlug}
          activeAudioId={audioState.activeId}
          onPlaySpeech={playSpeech}
        />
        {/* Bottom progression / end-of-deck CTA bar */}
        <div className="border border-border bg-muted/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-none">
          {isLastCard ? (
            <>
              <div className="text-xs text-foreground font-medium">
                <span className="font-mono text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mr-1.5">
                  ✓ Đã xem hết {cardsToRender.length}/{cardsToRender.length} ý
                </span>
                Bạn đã nắm xong phần lý thuyết trực quan của bài này!
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {cardsToRender.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      grammarAudio.stopAll();
                      setCardIndex(0);
                    }}
                    className="min-h-[40px] px-3 py-1.5 border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground font-mono text-xs uppercase tracking-wider rounded-none inline-flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                    <span>Xem lại từ Ý 1</span>
                  </button>
                )}
                <Link
                  href={`/grammar/practice?topic=${encodeURIComponent(topicSlug)}`}
                  onClick={() => grammarAudio.stopAll()}
                  className="min-h-[40px] px-3.5 py-1.5 bg-primary text-primary-foreground border border-primary hover:bg-primary/90 font-mono text-xs uppercase tracking-wider font-bold rounded-none inline-flex items-center gap-1.5 transition-colors"
                >
                  <Dumbbell className="h-3.5 w-3.5 shrink-0" />
                  <span>Làm bài tập ngay</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-muted-foreground font-mono">
                Đang ở <strong className="text-foreground">Ý {index + 1}/{cardsToRender.length}</strong> • Tiếp theo:{' '}
                <span className="text-foreground font-semibold">{navPills[index + 1]?.subLabel || `Ý ${index + 2}`}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  grammarAudio.stopAll();
                  setCardIndex(index + 1);
                }}
                className="min-h-[40px] px-3.5 py-1.5 bg-primary text-primary-foreground border border-primary hover:bg-primary/90 font-mono text-xs uppercase tracking-wider font-semibold rounded-none inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors"
              >
                <span>Qua Ý {index + 2}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </button>
            </>
          )}
        </div>
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

export function detectGrammarKeywords(
  sentence: string,
  topicSlug: string = '',
  cardTitle: string = ''
): string | string[] | undefined {
  if (!sentence) return undefined;

  const slug = topicSlug.toLowerCase();
  const title = cardTitle.toLowerCase();

  // 1. Adjectives
  if (slug.includes('adjective') || title.includes('tính từ')) {
    const matches = sentence.match(
      /\b(happy|sad|tired|hungry|thirsty|angry|relaxed|clean|dirty|hot|cold|warm|cool|big|small|huge|tiny|tall|short|long|fast|slow|old|new|young|cheaper|cheap|expensive|rich|poor|good|bad|delicious|sweet|fresh|smart|clever|beautiful|kind|nice|cute|easy|hard|difficult|heavy|light|dark|bright|loud|quiet|strong|weak|safe|dangerous|busy|lazy|brave|scared|famous|funny|important|special|careful|simple)\b/gi
    );
    if (matches && matches.length > 0) return Array.from(new Set(matches));
  }

  // 2. Personal Pronouns / Object Pronouns
  if (slug.includes('pronoun') || slug.includes('personal-pronouns') || title.includes('đại từ')) {
    const matches = sentence.match(/\b(I|you|he|she|it|we|they|me|him|her|us|them)\b/gi);
    if (matches && matches.length > 0) return Array.from(new Set(matches));
  }

  // 3. Verb To Be
  if (slug.includes('to-be') || slug.includes('verb-to-be') || title.includes('to be')) {
    const matches = sentence.match(/\b(am not|isn't|aren't|wasn't|weren't|'m not|'m|'s|'re|am|is|are|was|were)\b/gi);
    if (matches && matches.length > 0) return Array.from(new Set(matches));
  }

  // 4. Demonstratives (this, that, these, those)
  if (slug.includes('demonstrative') || title.includes('chỉ định')) {
    const matches = sentence.match(/\b(this|that|these|those)\b/gi);
    if (matches && matches.length > 0) return Array.from(new Set(matches));
  }

  // 5. There is / There are
  if (slug.includes('there-is') || slug.includes('there-are')) {
    const matches = sentence.match(/\b(there isn't|there aren't|there is|there are|is there|are there|there's)\b/gi);
    if (matches && matches.length > 0) return Array.from(new Set(matches));
  }

  // 6. Articles (a, an, the)
  if (slug.includes('article') || title.includes('mạo từ')) {
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
    const matches = sentence.match(/\b(a|an|the)\b/gi);
    if (matches && matches.length > 0) return Array.from(new Set(matches));
  }

  // 7. Possessives
  if (slug.includes('possessive') || title.includes('sở hữu')) {
    const matches = sentence.match(/('s\b|\b(my|your|his|her|its|our|their|mine|yours|hers|ours|theirs)\b)/gi);
    if (matches && matches.length > 0) return Array.from(new Set(matches));
  }

  // 8. Have got
  if (slug.includes('have-got')) {
    const m = sentence.match(/\b(have got|has got|haven't got|hasn't got|have you got|has he got|has she got|'ve got|'s got)\b/i);
    if (m) return m[0];
  }

  // 9. Modals (can, could, should, must, might, etc.)
  if (slug.includes('modal') || slug.includes('can') || slug.includes('could') || slug.includes('should') || slug.includes('must')) {
    const matches = sentence.match(/\b(can't|cannot|couldn't|shouldn't|mustn't|won't|can|could|should|must|might|may|have to|has to|had to|will)\b/gi);
    if (matches && matches.length > 0) return Array.from(new Set(matches));
  }

  // 10. Plurals
  if (slug.includes('plural') || title.includes('số nhiều')) {
    const matches = sentence.match(/\b(cats|dogs|books|pens|boxes|buses|dishes|watches|babies|cities|leaves|knives|children|men|women|feet|teeth|people|mice)\b/gi);
    if (matches && matches.length > 0) return Array.from(new Set(matches));
  }

  // 11. Prepositions
  if (slug.includes('preposition') || title.includes('giới từ')) {
    const matches = sentence.match(/\b(in front of|next to|between|behind|under|above|below|near|in|on|at)\b/gi);
    if (matches && matches.length > 0) return Array.from(new Set(matches));
  }

  // 12. Continuous / Progressive
  if (slug.includes('continuous') || slug.includes('progressive')) {
    const m = sentence.match(/\b(am|is|are|was|were)\s+\w+ing\b/i) || sentence.match(/\b\w+ing\b/i);
    if (m) return m[0];
  }

  // 13. Perfect tenses
  if (slug.includes('perfect')) {
    const m = sentence.match(/\b(have|has|had|haven't|hasn't|hadn't)\s+\w+(ed|en|ne|t|d)?\b/i) || sentence.match(/\b(have|has|had)\b/i);
    if (m) return m[0];
  }

  // 14. Past Simple
  if (slug.includes('past-simple') || slug.includes('past')) {
    const matches = sentence.match(/\b(was|were|wasn't|weren't|didn't|did|went|saw|bought|had|played|studied|worked|watched|visited|started|cooked|walked|ate|drank|made|took|got|came|said|told|found|gave|thought|knew|felt|left|heard|ran|brought|wrote|sat|stood|lost|paid|met|sent|spoke)\b/gi);
    if (matches && matches.length > 0) return Array.from(new Set(matches));
  }

  // 15. Present Simple
  if (slug.includes('present-simple') || slug.includes('present')) {
    const m = sentence.match(/\b(don't|doesn't|do|does)\b/i);
    if (m) return m[0];
    const verbMatch = sentence.match(/\b(lives|works|loves|likes|reads|plays|studies|watches|teaches|goes|has|drinks|eats|speaks|knows|wants|needs|helps|starts|leaves|travels)\b/i);
    if (verbMatch) return verbMatch[0];
  }

  // 16. Conditionals
  if (slug.includes('conditional') || slug.includes('if')) {
    const m = sentence.match(/\b(if|unless|would|will)\b/i);
    if (m) return m[0];
  }

  // 17. Questions / Wh-
  if (slug.includes('question') || slug.includes('wh-')) {
    const m = sentence.match(/\b(what|where|when|who|why|which|how|whose|whom)\b/i);
    if (m) return m[0];
  }

  // 18. Adverbs of frequency
  if (slug.includes('adverb') || slug.includes('frequency')) {
    const m = sentence.match(/\b(always|usually|often|sometimes|rarely|seldom|never)\b/i);
    if (m) return m[0];
  }

  // 19. Comparisons
  if (slug.includes('compar') || slug.includes('superlat')) {
    const m = sentence.match(/\b(more|most|better|best|worse|worst|than|as\s+\w+\s+as|cheaper|faster|bigger|smaller|taller|shorter|hotter|colder)\b/i);
    if (m) return m[0];
  }

  // 20. Passive
  if (slug.includes('passive')) {
    const m = sentence.match(/\b(is|are|was|were|been|being)\s+\w+(ed|en|t|d)\b/i);
    if (m) return m[0];
  }

  // 21. Relative clauses
  if (slug.includes('relative')) {
    const m = sentence.match(/\b(who|which|that|whose|where|whom)\b/i);
    if (m) return m[0];
  }

  // 22. Conjunctions
  if (slug.includes('conjunction') || slug.includes('clause')) {
    const m = sentence.match(/\b(although|though|even though|because|since|so|however|despite|in spite of)\b/i);
    if (m) return m[0];
  }

  // Explicit uppercase title matching (e.g. "THIS", "ARE", "COULD")
  const titleMatch = cardTitle.match(/^([A-Z\s'/]+)(?:\s*\(|$)/);
  if (titleMatch) {
    const candidate = titleMatch[1].trim();
    if (
      candidate.length >= 2 &&
      !['CÂU', 'PHỦ', 'KHẲNG', 'TÌNH', 'QUY', 'BẢNG', 'BẤT', 'THÊM', 'TRƯỚC', 'SAU', 'VỊ', 'CẶP'].includes(candidate)
    ) {
      const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const reg = new RegExp(`\\b${escaped}\\b`, 'i');
      const match = sentence.match(reg);
      if (match) return match[0];
    }
  }

  // Fallback: Check distinctive capitalized words in card title
  const words = cardTitle.replace(/[()/:,]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  for (const w of words) {
    const reg = new RegExp(`\\b${w}\\b`, 'i');
    const m = sentence.match(reg);
    if (m) return m[0];
  }

  return undefined;
}

export const detectGrammarKeyword = detectGrammarKeywords;

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
  const [imgError, setImgError] = useState(false);

  const visibleExamples = exampleLimit && !showAllExamples ? card.examples.slice(0, exampleLimit) : card.examples;

  const currentIdx = hoveredIdx !== null ? hoveredIdx : activeIdx;
  const currentExample = card.examples[currentIdx] || card.examples[0];
  const currentImage = (hoveredIdx !== null ? currentExample?.image : null) || currentExample?.image || card.image;

  // Reset imgError whenever currentImage changes
  useEffect(() => {
    setImgError(false);
  }, [currentImage]);

  const currentHighlight = currentExample
    ? currentExample.highlightWord || detectGrammarKeywords(currentExample.en, topicSlug, card.title)
    : undefined;

  const isStageAudioPlaying = activeAudioId === `${card.title}-${currentIdx}`;

  return (
    <div
      role="tabpanel"
      id={`pronoun-panel-Ý ${cardIndex + 1}`}
      aria-labelledby={`card-nav-tab-Ý ${cardIndex + 1}`}
      className={`relative overflow-hidden border border-border bg-card rounded-none shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
        hoveredIdx !== null ? 'z-20' : 'z-10'
      }`}
    >
      {/* Card Header: Luôn hiển thị tên ý và badge để người học định vị bài học */}
      <div className="p-2.5 sm:p-3.5 border-b border-border bg-muted/15 flex items-start sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-snug line-clamp-2 sm:truncate">
            {card.title}
          </h3>
          {card.badge && (
            <div className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2 sm:truncate">{card.badge}</div>
          )}
        </div>
        <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border border-border bg-background text-muted-foreground rounded-none shrink-0 tabular-nums">
          Ý {cardIndex + 1}
        </span>
      </div>

      <div className={exampleLimit ? 'sm:grid sm:grid-cols-[0.9fr_1.1fr] sm:items-stretch min-w-0' : undefined}>
        {/* Dynamic Hero Stage: Image or Typographic Concept Card with Active Sentence Overlay */}
        {currentImage && !imgError ? (
          <div className={`relative w-full bg-muted/20 overflow-hidden border-b sm:border-b-0 sm:border-r border-border ${exampleLimit ? 'h-48 sm:h-auto sm:min-h-[250px]' : 'h-48 sm:h-56'}`}>
            <Image
              key={currentImage}
              src={currentImage}
              alt={card.title}
              fill
              className={`transition-all duration-300 ${
                currentImage.endsWith('.svg') ? 'object-contain p-4' : 'object-cover object-center'
              }`}
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={() => setImgError(true)}
              unoptimized
            />
            {/* Top Concept Badge */}
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-background/90 backdrop-blur-xs border border-border text-foreground shadow-xs">
                {card.badge || `Tình huống ${currentIdx + 1}`}
              </span>
            </div>

            {/* Bottom Overlay: Active Sentence & Audio Button */}
            {currentExample && (
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background/95 via-background/85 to-transparent p-2.5 sm:p-3 pt-6 flex items-end justify-between gap-2 border-t border-border/40">
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-xs sm:text-sm font-bold text-foreground leading-snug line-clamp-2">
                    <HighlightedSentence text={currentExample.en} highlight={currentHighlight} />
                  </div>
                  {currentExample.vi && (
                    <div className="text-[11px] text-muted-foreground leading-tight line-clamp-1 mt-0.5">
                      {currentExample.vi}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onPlaySpeech(`${card.title}-${currentIdx}`, currentExample.en, currentIdx === 0 ? card.audio : undefined)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 bg-background hover:bg-muted border border-border rounded-none shadow-xs transition-colors shrink-0"
                  aria-label={`Nghe câu: ${currentExample.en}`}
                  title="Nghe câu ví dụ đang chọn"
                >
                  <Volume2
                    className={`h-4 w-4 ${
                      isStageAudioPlaying ? 'text-primary animate-pulse' : 'text-foreground'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={`relative w-full bg-gradient-to-br from-muted/40 via-muted/20 to-primary/5 p-3.5 sm:p-4 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-border ${exampleLimit ? 'h-48 sm:h-auto sm:min-h-[250px]' : 'h-48 sm:h-56'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-primary/30 bg-primary/10 text-primary">
                {card.badge || 'Trực quan ngữ pháp'}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground uppercase">
                Tình huống {currentIdx + 1}/{card.examples.length}
              </span>
            </div>

            <div className="text-center py-2 px-2 my-auto">
              <div className="font-serif text-base sm:text-lg font-bold text-foreground tracking-tight">
                {card.title}
              </div>
              {card.ruleSummary && (
                <div className="mt-1 font-mono text-[11px] text-muted-foreground line-clamp-2">
                  {card.ruleSummary}
                </div>
              )}
            </div>

            {currentExample && (
              <div className="bg-background/95 backdrop-blur-xs border border-border p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-xs">
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-xs sm:text-sm font-bold text-foreground truncate">
                    <HighlightedSentence text={currentExample.en} highlight={currentHighlight} />
                  </div>
                  {currentExample.vi && (
                    <div className="text-[11px] text-muted-foreground truncate">{currentExample.vi}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onPlaySpeech(`${card.title}-${currentIdx}`, currentExample.en, currentIdx === 0 ? card.audio : undefined)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 hover:bg-muted text-foreground transition-colors shrink-0"
                  aria-label={`Nghe câu: ${currentExample.en}`}
                  title="Nghe câu ví dụ đang chọn"
                >
                  <Volume2 className={`h-4 w-4 ${isStageAudioPlaying ? 'text-primary animate-pulse' : ''}`} />
                </button>
              </div>
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
              const effectiveHighlight = ex.highlightWord || detectGrammarKeywords(ex.en, topicSlug, card.title);

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
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setActiveIdx(exIdx)}
                    className="space-y-0.5 min-w-0 flex-1 text-left min-h-[44px]"
                  >
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
            <button
              type="button"
              aria-expanded={showAllExamples}
              onClick={() => {
                setShowAllExamples(!showAllExamples);
                setActiveIdx(0);
                setHoveredIdx(null);
                grammarAudio.stopAll();
              }}
              className="min-h-[44px] w-full text-xs font-mono uppercase tracking-wider text-primary hover:bg-muted border border-border"
            >
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
