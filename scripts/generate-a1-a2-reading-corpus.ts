/**
 * Curated A1-A2 Graded Reading Corpus Generator & Database Ingestion
 * Spans all 15 themes according to src/lib/pack-themes.ts with complete
 * passage text, Vietnamese translations, vocabulary highlights, cloze blanks,
 * and comprehension MCQs with explanations.
 *
 * Usage:
 *   npx tsx scripts/generate-a1-a2-reading-corpus.ts [--dry-run]
 */

import * as path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { ReadingArticle } from '../src/types/reading-library';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const dryRun = process.argv.includes('--dry-run');

export const A1_A2_ARTICLES: Array<Omit<ReadingArticle, 'id' | 'created_at' | 'updated_at'>> = [
  // =========================================================================
  // 1. DAILY LIFE (Đời sống hàng ngày)
  // =========================================================================
  {
    slug: 'a1-my-morning-routine-at-home',
    title: 'My Typical Morning Routine',
    cefr_level: 'A1',
    theme_id: 'daily-life',
    word_count: 85,
    estimated_read_minutes: 1,
    difficulty_score: 15,
    source_type: 'voa',
    status: 'published',
    summary: 'Mô tả thói quen buổi sáng quen thuộc: thức dậy lúc 6 giờ, vệ sinh cá nhân, ăn sáng cùng gia đình và đi làm bằng xe buýt.',
    translation: 'Tôi thức dậy lúc sáu giờ sáng mỗi ngày. Đầu tiên, tôi rửa mặt và đánh răng trong phòng tắm. Sau đó, tôi vào bếp và nấu một bữa sáng đơn giản. Tôi thường ăn bánh mì nướng với trứng và uống một cốc sữa ấm. Gia đình tôi luôn ăn sáng cùng nhau tại bàn ăn. Đến bảy giờ, tôi mặc quần áo và lấy ba lô. Tôi đi bộ đến trạm xe buýt gần nhà. Xe buýt đến rất đúng giờ.',
    passage: `I wake up at six o'clock every morning. First, I wash my face and brush my teeth in the bathroom. After that, I go to the kitchen and make a simple breakfast. I usually eat toast with eggs and drink a cup of warm milk. My family always eats breakfast together at the table. At seven o'clock, I put on my clothes and grab my backpack. I walk to the bus stop near my house. The bus is always on time.`,
    passage_plain: `I wake up at six o'clock every morning. First, I wash my face and brush my teeth in the bathroom. After that, I go to the kitchen and make a simple breakfast. I usually eat toast with eggs and drink a cup of warm milk. My family always eats breakfast together at the table. At seven o'clock, I put on my clothes and grab my backpack. I walk to the bus stop near my house. The bus is always on time.`,
    vocabulary_highlights: [
      { word: 'routine', pos: 'noun', phonetic: '/ruːˈtiːn/', meaning_vi: 'thói quen sinh hoạt hàng ngày', context_sentence: 'My morning routine starts at six.' },
      { word: 'kitchen', pos: 'noun', phonetic: '/ˈkɪtʃ.ən/', meaning_vi: 'nhà bếp', context_sentence: 'I go to the kitchen and make breakfast.' },
      { word: 'backpack', pos: 'noun', phonetic: '/ˈbæk.pæk/', meaning_vi: 'ba lô', context_sentence: 'I grab my backpack before leaving.' },
      { word: 'on time', pos: 'phrase', phonetic: '/ɒn taɪm/', meaning_vi: 'đúng giờ', context_sentence: 'The bus is always on time.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'What time does the author wake up in the morning?',
        options: ['At 5:00 AM', 'At 6:00 AM', 'At 7:00 AM', 'At 8:00 AM'],
        answer: 1,
        explain: 'Câu đầu tiên nêu rõ: "I wake up at six o\'clock every morning" (Tôi thức dậy lúc 6 giờ).',
      },
      {
        id: 'q2',
        question: 'What does the author usually drink for breakfast?',
        options: ['Cold water', 'Hot black coffee', 'A cup of warm milk', 'Orange juice'],
        answer: 2,
        explain: 'Trong bài có câu: "drink a cup of warm milk" (uống một cốc sữa ấm).',
      },
      {
        id: 'q3',
        question: 'How does the author travel after leaving home?',
        options: ['By bicycle', 'By car', 'By bus', 'By motorbike'],
        answer: 2,
        explain: 'Tác giả đi bộ đến bến xe buýt: "I walk to the bus stop near my house. The bus is always on time".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'wake up',
          answer: 'wake up',
          options: ['wake up', 'stand up', 'turn off', 'give in'],
          explain: '"wake up" nghĩa là thức dậy.',
        },
        {
          id: 'b2',
          index: 2,
          word: 'together',
          answer: 'together',
          options: ['together', 'alone', 'late', 'slowly'],
          explain: '"eat breakfast together" nghĩa là ăn sáng cùng nhau.',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Morning Routine',
        children: [
          { id: 'c1', label: '6:00 AM: Wake up & brush teeth' },
          { id: 'c2', label: 'Breakfast: Toast, eggs & warm milk' },
          { id: 'c3', label: '7:00 AM: Walk to bus stop' },
        ],
      },
    },
  },
  {
    slug: 'a1-my-cozy-bedroom',
    title: 'My Small and Cozy Room',
    cefr_level: 'A1',
    theme_id: 'daily-life',
    word_count: 82,
    estimated_read_minutes: 1,
    difficulty_score: 16,
    source_type: 'voa',
    status: 'published',
    summary: 'Giới thiệu về căn phòng ngủ nhỏ nhắn, ấm cúng với chiếc bàn học cạnh cửa sổ đón ánh nắng và kệ sách yêu thích.',
    translation: 'Căn phòng ngủ của tôi nhỏ nhưng rất ấm áp. Có một chiếc giường đơn cạnh bức tường màu trắng. Trên giường có hai chiếc gối mềm và một chiếc chăn bông màu xanh dương. Bên cạnh cửa sổ là bàn học của tôi. Tôi thích ngồi ở đây vì có nhiều ánh sáng mặt trời tự nhiên. Tôi có một chiếc đèn bàn nhỏ và một kệ sách bằng gỗ. Vào buổi tối, tôi đọc sách trước khi đi ngủ.',
    passage: `My bedroom is small but very cozy. There is a single bed next to the white wall. On the bed, there are two soft pillows and a blue blanket. Beside the window is my study desk. I love sitting here because there is plenty of natural sunlight. I have a small desk lamp and a wooden bookshelf with my favorite books. In the evening, I read stories before going to sleep. It feels safe and quiet.`,
    passage_plain: `My bedroom is small but very cozy. There is a single bed next to the white wall. On the bed, there are two soft pillows and a blue blanket. Beside the window is my study desk. I love sitting here because there is plenty of natural sunlight. I have a small desk lamp and a wooden bookshelf with my favorite books. In the evening, I read stories before going to sleep. It feels safe and quiet.`,
    vocabulary_highlights: [
      { word: 'cozy', pos: 'adj', phonetic: '/ˈkəʊ.zi/', meaning_vi: 'ấm cúng, dễ chịu', context_sentence: 'The bedroom is small but very cozy.' },
      { word: 'pillow', pos: 'noun', phonetic: '/ˈpɪl.əʊ/', meaning_vi: 'chiếc gối', context_sentence: 'There are two soft pillows on the bed.' },
      { word: 'blanket', pos: 'noun', phonetic: '/ˈblæŋ.kɪt/', meaning_vi: 'chăn bông', context_sentence: 'A warm blue blanket covers the bed.' },
      { word: 'bookshelf', pos: 'noun', phonetic: '/ˈbʊk.ʃelf/', meaning_vi: 'giá sách, kệ sách', context_sentence: 'My favorite stories are on the bookshelf.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'Where is the study desk located?',
        options: ['Behind the door', 'Beside the window', 'Under the bed', 'In the kitchen'],
        answer: 1,
        explain: '"Beside the window is my study desk" (Bàn học nằm cạnh cửa sổ).',
      },
      {
        id: 'q2',
        question: 'Why does the author enjoy sitting at the desk?',
        options: ['Because it is noisy', 'Because there is natural sunlight', 'Because there is food', 'Because it has a TV'],
        answer: 1,
        explain: '"I love sitting here because there is plenty of natural sunlight".',
      },
      {
        id: 'q3',
        question: 'What does the author do before going to sleep?',
        options: ['Watches action movies', 'Reads stories', 'Cooks dinner', 'Plays video games'],
        answer: 1,
        explain: '"In the evening, I read stories before going to sleep" (Buổi tối, tôi đọc truyện trước khi ngủ).',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'window',
          answer: 'window',
          options: ['window', 'floor', 'ceiling', 'roof'],
          explain: '"Beside the window" nghĩa là bên cạnh cửa sổ.',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'My Bedroom',
        children: [
          { id: 'c1', label: 'Bed: 2 pillows, blue blanket' },
          { id: 'c2', label: 'Desk: Beside window with sunlight' },
          { id: 'c3', label: 'Evening: Reading stories' },
        ],
      },
    },
  },
  {
    slug: 'a2-cooking-dinner-after-work',
    title: 'Cooking Dinner on a Weekday Evening',
    cefr_level: 'A2',
    theme_id: 'daily-life',
    word_count: 145,
    estimated_read_minutes: 2,
    difficulty_score: 28,
    source_type: 'voa',
    status: 'published',
    summary: 'Niềm vui nấu một bữa tối tự nấu tại nhà sau ngày làm việc bận rộn: chọn nguyên liệu tươi, lắng nghe tiếng xèo xèo trên chảo và thư giãn.',
    translation: 'Sau một ngày dài làm việc tại văn phòng, tôi luôn mong được trở về nhà và tự nấu bữa tối. Mặc dù đặt đồ ăn trực tuyến rất tiện lợi, nhưng việc tự tay nấu nướng giúp tôi giải tỏa căng thẳng. Hôm nay, tôi quyết định làm món mì ống xốt cà chua và thịt bò xay. Đầu tiên, tôi đun sôi một nồi nước và cho một chút muối. Khi mì đang chín, tôi cắt nhỏ hành tây, tỏi và xào chúng trong dầu ô liu. Mùi hương ngào ngạt lan tỏa khắp căn bếp. Tôi cho thịt bò vào và nấu cho đến khi chín vàng, sau đó đổ nước xốt cà chua vào. Ăn một bữa ăn nóng hổi trong khi nghe bản nhạc yêu thích là cách tuyệt vời nhất để khép lại một ngày.',
    passage: `After a busy day at the office, I always look forward to coming home and cooking dinner. Although ordering food online is convenient, cooking my own meals helps me relax and clear my mind. Tonight, I decided to prepare pasta with homemade tomato sauce and minced beef. First, I boiled a pot of water with a pinch of salt. While the pasta was simmering, I chopped fresh onions and garlic, then sautéed them in olive oil. The wonderful aroma quickly filled the entire kitchen. I added the beef and cooked it until brown, then poured in the rich tomato sauce. Sitting down to enjoy a warm, homemade meal while listening to gentle music is the best way to finish my day.`,
    passage_plain: `After a busy day at the office, I always look forward to coming home and cooking dinner. Although ordering food online is convenient, cooking my own meals helps me relax and clear my mind. Tonight, I decided to prepare pasta with homemade tomato sauce and minced beef. First, I boiled a pot of water with a pinch of salt. While the pasta was simmering, I chopped fresh onions and garlic, then sautéed them in olive oil. The wonderful aroma quickly filled the entire kitchen. I added the beef and cooked it until brown, then poured in the rich tomato sauce. Sitting down to enjoy a warm, homemade meal while listening to gentle music is the best way to finish my day.`,
    vocabulary_highlights: [
      { word: 'convenient', pos: 'adj', phonetic: '/kənˈviː.ni.ənt/', meaning_vi: 'thuận tiện, tiện lợi', context_sentence: 'Ordering takeout is convenient but expensive.' },
      { word: 'aroma', pos: 'noun', phonetic: '/əˈrəʊ.mə/', meaning_vi: 'hương thơm, mùi hương dễ chịu', context_sentence: 'A wonderful aroma filled the room.' },
      { word: 'sauté', pos: 'verb', phonetic: '/ˈsəʊ.teɪ/', meaning_vi: 'xào nhanh với một ít dầu', context_sentence: 'I sautéed onions and garlic in olive oil.' },
      { word: 'homemade', pos: 'adj', phonetic: '/ˌhəʊmˈmeɪd/', meaning_vi: 'tự làm tại nhà', context_sentence: 'I prefer homemade meals to fast food.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'Why does the author prefer cooking over ordering food online?',
        options: ['Because cooking is faster', 'Because cooking helps them relax', 'Because they have no phone', 'Because delivery is illegal'],
        answer: 1,
        explain: '"cooking my own meals helps me relax and clear my mind" (nấu nướng giúp tôi thư giãn và giải tỏa đầu óc).',
      },
      {
        id: 'q2',
        question: 'What dish did the author cook tonight?',
        options: ['Chicken fried rice', 'Beef noodle soup', 'Pasta with tomato sauce and beef', 'Vegetable pizza'],
        answer: 2,
        explain: '"prepare pasta with homemade tomato sauce and minced beef".',
      },
      {
        id: 'q3',
        question: 'What does the author do while enjoying the meal?',
        options: ['Works on their laptop', 'Listens to gentle music', 'Talks on the phone', 'Sleeps on the couch'],
        answer: 1,
        explain: '"Sitting down to enjoy a warm, homemade meal while listening to gentle music".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'convenient',
          answer: 'convenient',
          options: ['convenient', 'dangerous', 'boring', 'impossible'],
          explain: '"convenient" (tiện lợi) phù hợp với ngữ cảnh đặt đồ ăn online.',
        },
        {
          id: 'b2',
          index: 2,
          word: 'relax',
          answer: 'relax',
          options: ['relax', 'worry', 'cry', 'compete'],
          explain: '"helps me relax" (giúp tôi thư giãn).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Evening Cooking',
        children: [
          { id: 'c1', label: 'Benefit: Relaxes mind after office work' },
          { id: 'c2', label: 'Recipe: Pasta with onions, garlic, beef' },
          { id: 'c3', label: 'Dinner: Warm meal with gentle music' },
        ],
      },
    },
  },

  // =========================================================================
  // 2. FOOD & DRINK (Ẩm thực & ăn uống)
  // =========================================================================
  {
    slug: 'a1-my-favorite-breakfast-pho',
    title: 'My Favorite Breakfast: Traditional Pho',
    cefr_level: 'A1',
    theme_id: 'food',
    word_count: 90,
    estimated_read_minutes: 1,
    difficulty_score: 15,
    source_type: 'voa',
    status: 'published',
    summary: 'Món ăn sáng quốc hồn quốc túy của Việt Nam: phở bò thơm ngon với nước dùng ninh từ xương, thảo mộc và bánh phở mềm.',
    translation: 'Phở là món ăn sáng nổi tiếng nhất ở Việt Nam. Mỗi buổi sáng, nhiều người ghé vào các quán phở nhỏ bên đường. Một bát phở có bánh phở trắng mềm, thịt bò thái mỏng và nước dùng nóng hổi. Nước dùng có vị ngọt đậm đà vì được ninh từ xương trong nhiều giờ. Mọi người thường thêm rau thơm tươi, một lát chanh và một chút ớt cay. Thưởng thức một bát phở nóng vào buổi sáng mang lại cho tôi rất nhiều năng lượng cho cả ngày.',
    passage: `Pho is the most famous breakfast dish in Vietnam. Every morning, many people stop by small street stalls to eat. A bowl of pho has soft white rice noodles, thin slices of beef, and hot broth. The broth tastes very rich and sweet because cooks simmer bones for many hours. People usually add fresh green herbs, a slice of lime, and a little spicy chili. Eating a steaming bowl of pho gives me plenty of energy for the whole day.`,
    passage_plain: `Pho is the most famous breakfast dish in Vietnam. Every morning, many people stop by small street stalls to eat. A bowl of pho has soft white rice noodles, thin slices of beef, and hot broth. The broth tastes very rich and sweet because cooks simmer bones for many hours. People usually add fresh green herbs, a slice of lime, and a little spicy chili. Eating a steaming bowl of pho gives me plenty of energy for the whole day.`,
    vocabulary_highlights: [
      { word: 'broth', pos: 'noun', phonetic: '/brɒθ/', meaning_vi: 'nước dùng, nước hầm', context_sentence: 'The hot beef broth is sweet and aromatic.' },
      { word: 'simmer', pos: 'verb', phonetic: '/ˈsɪm.ər/', meaning_vi: 'ninh nhỏ lửa', context_sentence: 'Cooks simmer beef bones for eight hours.' },
      { word: 'herbs', pos: 'noun', phonetic: '/hɜːbz/', meaning_vi: 'rau thơm, thảo mộc', context_sentence: 'We add fresh herbs to the soup.' },
      { word: 'spicy', pos: 'adj', phonetic: '/ˈspaɪ.si/', meaning_vi: 'cay', context_sentence: 'I like a little spicy chili in my bowl.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'Why is the broth of pho sweet and rich?',
        options: ['Because of added sugar', 'Because cooks simmer bones for hours', 'Because of milk', 'Because it has chocolate'],
        answer: 1,
        explain: '"The broth tastes very rich and sweet because cooks simmer bones for many hours".',
      },
      {
        id: 'q2',
        question: 'What do people usually add to their bowl of pho?',
        options: ['Ice cream and cake', 'Herbs, lime, and chili', 'Cheese and butter', 'Bread and sugar'],
        answer: 1,
        explain: '"People usually add fresh green herbs, a slice of lime, and a little spicy chili".',
      },
      {
        id: 'q3',
        question: 'What does eating pho in the morning give the author?',
        options: ['Sleepiness', 'Energy for the whole day', 'A stomach ache', 'Nothing'],
        answer: 1,
        explain: '"Eating a steaming bowl of pho gives me plenty of energy for the whole day".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'breakfast',
          answer: 'breakfast',
          options: ['breakfast', 'midnight', 'dessert', 'snack'],
          explain: '"famous breakfast dish" nghĩa là món ăn sáng nổi tiếng.',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Vietnamese Pho',
        children: [
          { id: 'c1', label: 'Ingredients: Noodles, beef, bone broth' },
          { id: 'c2', label: 'Toppings: Fresh herbs, lime, chili' },
          { id: 'c3', label: 'Benefit: Energy for morning' },
        ],
      },
    },
  },
  {
    slug: 'a2-healthy-smoothie-habits',
    title: 'The Secret to a Delicious Fruit Smoothie',
    cefr_level: 'A2',
    theme_id: 'food',
    word_count: 138,
    estimated_read_minutes: 2,
    difficulty_score: 27,
    source_type: 'voa',
    status: 'published',
    summary: 'Công thức và mẹo xay sinh tố trái cây bổ dưỡng: kết hợp chuối đông lạnh, cải bó xôi, sữa hạt và các loại hạt giàu vitamin.',
    translation: 'Sinh tố trái cây là một cách tuyệt vời để bổ sung vitamin và khoáng chất cần thiết vào chế độ ăn uống của bạn. Để có một cốc sinh tố mịn màng hoàn hảo, bí quyết nằm ở việc sử dụng chuối đông lạnh thay vì đá lạnh thông thường. Đá lạnh có thể làm nhạt vị, trong khi chuối đông lạnh tạo ra độ béo ngậy như kem. Bạn có thể kết hợp chuối với quả mọng dâu tây, xoài chín hoặc thậm chí một nắm lá cải bó xôi tươi. Đừng lo lắng, vị ngọt của trái cây sẽ che đi vị đắng của rau xanh hoàn toàn. Hãy thêm một thìa hạt chia và một cốc sữa hạnh nhân không đường. Xay đều trong một phút, bạn sẽ có một bữa phụ dinh dưỡng và sảng khoái.',
    passage: `Fruit smoothies are an enjoyable way to include essential vitamins and minerals in your daily diet. To create the perfect creamy texture, the secret is using frozen bananas instead of ice cubes. Regular ice often dilutes the rich flavors, while frozen bananas create a smooth, ice-cream-like consistency. You can blend bananas with strawberries, ripe mangoes, or even a handful of fresh baby spinach. You do not need to worry about the taste, because the natural sweetness of the fruit completely masks the taste of the greens. For extra nutrition, add a spoonful of chia seeds and a cup of unsweetened almond milk. Blend everything on high speed for sixty seconds, and you have a refreshing, guilt-free treat.`,
    passage_plain: `Fruit smoothies are an enjoyable way to include essential vitamins and minerals in your daily diet. To create the perfect creamy texture, the secret is using frozen bananas instead of ice cubes. Regular ice often dilutes the rich flavors, while frozen bananas create a smooth, ice-cream-like consistency. You can blend bananas with strawberries, ripe mangoes, or even a handful of fresh baby spinach. You do not need to worry about the taste, because the natural sweetness of the fruit completely masks the taste of the greens. For extra nutrition, add a spoonful of chia seeds and a cup of unsweetened almond milk. Blend everything on high speed for sixty seconds, and you have a refreshing, guilt-free treat.`,
    vocabulary_highlights: [
      { word: 'texture', pos: 'noun', phonetic: '/ˈteks.tʃər/', meaning_vi: 'kết cấu, độ sánh mịn', context_sentence: 'Frozen bananas give a smooth texture.' },
      { word: 'dilute', pos: 'verb', phonetic: '/daɪˈluːt/', meaning_vi: 'làm loãng, làm nhạt vị', context_sentence: 'Adding too much ice will dilute the juice.' },
      { word: 'consistency', pos: 'noun', phonetic: '/kənˈsɪs.tən.si/', meaning_vi: 'độ đặc sánh', context_sentence: 'The mixture reached a creamy consistency.' },
      { word: 'mask', pos: 'verb', phonetic: '/mɑːsk/', meaning_vi: 'che giấu, che phủ mùi vị', context_sentence: 'Sweet fruit masks the bitter flavor.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'What is the secret to achieving a creamy smoothie texture?',
        options: ['Using hot water', 'Using frozen bananas instead of ice', 'Adding white sugar', 'Adding soda'],
        answer: 1,
        explain: '"the secret is using frozen bananas instead of ice cubes".',
      },
      {
        id: 'q2',
        question: 'Why does adding spinach not ruin the flavor?',
        options: ['Because spinach has no taste', 'Because fruit sweetness masks the greens', 'Because salt is added', 'Because cooks boil it'],
        answer: 1,
        explain: '"the natural sweetness of the fruit completely masks the taste of the greens".',
      },
      {
        id: 'q3',
        question: 'How long should the smoothie be blended?',
        options: ['For 10 seconds', 'For 60 seconds', 'For 10 minutes', 'For 1 hour'],
        answer: 1,
        explain: '"Blend everything on high speed for sixty seconds".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'vitamins',
          answer: 'vitamins',
          options: ['vitamins', 'poisons', 'fats', 'sugars'],
          explain: '"essential vitamins and minerals" là cụm từ chuẩn về dinh dưỡng.',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Healthy Smoothie',
        children: [
          { id: 'c1', label: 'Base: Frozen bananas for creamy texture' },
          { id: 'c2', label: 'Flavors: Berries, mango, baby spinach' },
          { id: 'c3', label: 'Boosters: Chia seeds & almond milk' },
        ],
      },
    },
  },

  // =========================================================================
  // 3. TRAVEL & TRANSPORT (Du lịch & giao thông)
  // =========================================================================
  {
    slug: 'a1-a-day-trip-to-the-beach',
    title: 'A Weekend Trip to the Beach',
    cefr_level: 'A1',
    theme_id: 'travel',
    word_count: 88,
    estimated_read_minutes: 1,
    difficulty_score: 16,
    source_type: 'voa',
    status: 'published',
    summary: 'Chuyến đi biển cuối tuần thú vị: xây lâu đài cát, bơi dưới làn nước trong xanh và thưởng thức hải sản cùng bạn bè.',
    translation: 'Thứ Bảy tuần trước, tôi và các bạn đã đến bãi biển Đà Nẵng. Thời tiết rất nắng và dễ chịu. Chúng tôi đến nơi lúc chín giờ sáng. Đầu tiên, chúng tôi đi dạo trên bãi cát trắng mịn và nhặt những vỏ ốc tuyệt đẹp. Sau đó, chúng tôi bơi trong làn nước biển trong xanh và mát mẻ. Buổi trưa, chúng tôi ăn hải sản nướng tại một nhà hàng nhỏ cạnh bờ biển. Tôm và cá tươi rất ngon. Chúng tôi đã chụp rất nhiều bức ảnh kỷ niệm.',
    passage: `Last Saturday, my friends and I went to the beach in Da Nang. The weather was sunny and warm. We arrived at nine in the morning. First, we walked on the soft white sand and collected colorful seashells. After that, we swam in the cool blue sea. The waves were gentle and fun. At noon, we had grilled seafood at a small restaurant near the water. The fresh fish and prawns were delicious. We took many wonderful photographs before going home.`,
    passage_plain: `Last Saturday, my friends and I went to the beach in Da Nang. The weather was sunny and warm. We arrived at nine in the morning. First, we walked on the soft white sand and collected colorful seashells. After that, we swam in the cool blue sea. The waves were gentle and fun. At noon, we had grilled seafood at a small restaurant near the water. The fresh fish and prawns were delicious. We took many wonderful photographs before going home.`,
    vocabulary_highlights: [
      { word: 'seashell', pos: 'noun', phonetic: '/ˈsiː.ʃel/', meaning_vi: 'vỏ sò, vỏ ốc biển', context_sentence: 'Children love picking seashells on the beach.' },
      { word: 'gentle', pos: 'adj', phonetic: '/ˈdʒen.təl/', meaning_vi: 'êm đềm, nhẹ nhàng', context_sentence: 'The ocean waves were calm and gentle.' },
      { word: 'prawn', pos: 'noun', phonetic: '/prɔːn/', meaning_vi: 'tôm', context_sentence: 'We ordered grilled prawns for lunch.' },
      { word: 'photograph', pos: 'noun', phonetic: '/ˈfəʊ.tə.ɡrɑːf/', meaning_vi: 'bức ảnh', context_sentence: 'We took photographs of the sunset.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'Where did the author and friends go last Saturday?',
        options: ['To the mountains', 'To a beach in Da Nang', 'To a shopping mall', 'To a library'],
        answer: 1,
        explain: '"my friends and I went to the beach in Da Nang".',
      },
      {
        id: 'q2',
        question: 'What did they collect on the sand?',
        options: ['Plastic bottles', 'Colorful seashells', 'Coins', 'Books'],
        answer: 1,
        explain: '"collected colorful seashells".',
      },
      {
        id: 'q3',
        question: 'What did they eat for lunch at noon?',
        options: ['Burgers and fries', 'Grilled seafood', 'Noodle soup', 'Bread and jam'],
        answer: 1,
        explain: '"we had grilled seafood at a small restaurant near the water".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'weather',
          answer: 'weather',
          options: ['weather', 'traffic', 'homework', 'machine'],
          explain: '"The weather was sunny and warm" (Thời tiết nắng và ấm áp).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Da Nang Beach Trip',
        children: [
          { id: 'c1', label: 'Morning: Walk on sand & swim' },
          { id: 'c2', label: 'Lunch: Grilled seafood' },
          { id: 'c3', label: 'Memories: Photos with friends' },
        ],
      },
    },
  },
  {
    slug: 'a2-exploring-ancient-hoi-an',
    title: 'A Magical Evening in Hoi An Ancient Town',
    cefr_level: 'A2',
    theme_id: 'travel',
    word_count: 142,
    estimated_read_minutes: 2,
    difficulty_score: 29,
    source_type: 'voa',
    status: 'published',
    summary: 'Khám phá vẻ đẹp cổ kính của phố cổ Hội An về đêm: những chiếc đèn lồng rực rỡ, dòng sông Hoài thơ mộng và ẩm thực đường phố độc đáo.',
    translation: 'Hội An là một trong những điểm đến du lịch quyến rũ nhất ở miền Trung Việt Nam. Khi mặt trời lặn sau những mái ngói cổ kính, cả thị trấn biến thành một thế giới thần tiên rực rỡ ánh sáng. Hàng trăm chiếc đèn lồng lụa đủ màu sắc được thắp sáng dọc theo các con phố hẹp cấm xe cơ giới. Du khách có thể đi dạo thong thả hoặc thuê một chiếc xe đạp để khám phá các hội quán cổ và Chùa Cầu mang tính biểu tượng. Dọc bờ sông Hoài, người dân địa phương chèo những chiếc thuyền gỗ nhỏ và thả những chiếc hoa đăng giấy mang theo ước nguyện may mắn. Thưởng thức một đĩa cơm gà hoặc một bát cao lầu trong khi ngắm nhìn ánh sáng phản chiếu trên mặt nước là một trải nghiệm khó quên.',
    passage: `Hoi An is undoubtedly one of the most charming destinations in central Vietnam. As the sun sets behind the ancient tiled roofs, the entire town transforms into a colorful wonderland of glowing lights. Hundreds of silk lanterns in brilliant shades of yellow, red, and turquoise illuminate the narrow pedestrian streets. Visitors can stroll peacefully or rent a bicycle to explore historic Chinese assembly halls and the iconic Japanese Covered Bridge. Along the gentle Hoai River, local boatmen paddle traditional wooden sampans, offering visitors the chance to release floating paper lanterns with heartfelt wishes. Savoring a dish of local Cao Lau noodles while watching the lantern reflections shimmer on the dark water is an unforgettable memory for any traveler.`,
    passage_plain: `Hoi An is undoubtedly one of the most charming destinations in central Vietnam. As the sun sets behind the ancient tiled roofs, the entire town transforms into a colorful wonderland of glowing lights. Hundreds of silk lanterns in brilliant shades of yellow, red, and turquoise illuminate the narrow pedestrian streets. Visitors can stroll peacefully or rent a bicycle to explore historic Chinese assembly halls and the iconic Japanese Covered Bridge. Along the gentle Hoai River, local boatmen paddle traditional wooden sampans, offering visitors the chance to release floating paper lanterns with heartfelt wishes. Savoring a dish of local Cao Lau noodles while watching the lantern reflections shimmer on the dark water is an unforgettable memory for any traveler.`,
    vocabulary_highlights: [
      { word: 'illuminate', pos: 'verb', phonetic: '/ɪˈluː.mɪ.neɪt/', meaning_vi: 'chiếu sáng, thắp sáng', context_sentence: 'Lanterns illuminate the old streets at night.' },
      { word: 'pedestrian', pos: 'noun/adj', phonetic: '/pəˈdes.tri.ən/', meaning_vi: 'người đi bộ, dành cho đi bộ', context_sentence: 'Motorbikes are banned on pedestrian streets.' },
      { word: 'iconic', pos: 'adj', phonetic: '/aɪˈkɒn.ɪk/', meaning_vi: 'mang tính biểu tượng', context_sentence: 'The Japanese Bridge is iconic in Hoi An.' },
      { word: 'shimmer', pos: 'verb', phonetic: '/ˈʃɪm.ər/', meaning_vi: 'lấp lánh, lung linh', context_sentence: 'Colored lights shimmer on the river water.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'What happens to Hoi An when the sun sets?',
        options: ['All shops close immediately', 'It transforms into a town of glowing silk lanterns', 'Cars create heavy traffic jams', 'It starts to snow'],
        answer: 1,
        explain: '"the entire town transforms into a colorful wonderland of glowing lights. Hundreds of silk lanterns... illuminate the streets".',
      },
      {
        id: 'q2',
        question: 'What can visitors release onto the Hoai River?',
        options: ['Plastic bags', 'Floating paper lanterns with wishes', 'Large rocks', 'Bicycles'],
        answer: 1,
        explain: '"offering visitors the chance to release floating paper lanterns with heartfelt wishes".',
      },
      {
        id: 'q3',
        question: 'Which local food is mentioned in the passage?',
        options: ['Cao Lau noodles', 'Hamburger', 'Pasta bolognese', 'Fried chicken'],
        answer: 0,
        explain: '"Savoring a dish of local Cao Lau noodles".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'lanterns',
          answer: 'lanterns',
          options: ['lanterns', 'cars', 'monkeys', 'mirrors'],
          explain: '"silk lanterns" (đèn lồng lụa) là biểu tượng của Hội An.',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Hoi An Ancient Town',
        children: [
          { id: 'c1', label: 'Atmosphere: Silk lanterns & pedestrian streets' },
          { id: 'c2', label: 'Activities: Biking, Japanese bridge, river boat' },
          { id: 'c3', label: 'Cuisine: Cao Lau noodles by the water' },
        ],
      },
    },
  },

  // =========================================================================
  // 4. FRIENDSHIP & FEELINGS (Tình bạn & cảm xúc)
  // =========================================================================
  {
    slug: 'a1-my-best-friend-nam',
    title: 'My Best Friend Nam',
    cefr_level: 'A1',
    theme_id: 'friendship-feelings',
    word_count: 86,
    estimated_read_minutes: 1,
    difficulty_score: 14,
    source_type: 'voa',
    status: 'published',
    summary: 'Tình bạn thân thiết từ thuở nhỏ: cùng nhau học tập, chia sẻ đồ ăn và chơi bóng đá vào mỗi chiều thứ Bảy.',
    translation: 'Nam là bạn thân nhất của tôi. Chúng tôi đã là bạn bè từ khi còn là học sinh lớp một. Nam cao và luôn nở nụ cười ấm áp. Cậu ấy rất thông minh và giỏi toán. Khi tôi gặp khó khăn với bài tập về nhà, Nam luôn kiên nhẫn giúp đỡ tôi giải bài. Vào cuối tuần, chúng tôi thường chơi bóng đá ở công viên gần nhà. Sau khi chơi thể thao, chúng tôi cùng ăn kem và trò chuyện về ước mơ của mình. Tôi rất vui vì có một người bạn tốt như Nam.',
    passage: `Nam is my best friend. We have been close friends since we were in the first grade. Nam is tall and has a warm smile. He is very kind and smart at mathematics. Whenever I struggle with difficult homework, Nam patiently explains the answers to me. On weekends, we often play soccer together at the local park. After playing, we eat ice cream and talk about our dreams. I feel very lucky to have such a supportive and honest friend.`,
    passage_plain: `Nam is my best friend. We have been close friends since we were in the first grade. Nam is tall and has a warm smile. He is very kind and smart at mathematics. Whenever I struggle with difficult homework, Nam patiently explains the answers to me. On weekends, we often play soccer together at the local park. After playing, we eat ice cream and talk about our dreams. I feel very lucky to have such a supportive and honest friend.`,
    vocabulary_highlights: [
      { word: 'patiently', pos: 'adv', phonetic: '/ˈpeɪ.ʃənt.li/', meaning_vi: 'kiên nhẫn, nhẫn nại', context_sentence: 'He patiently explains math problems to me.' },
      { word: 'struggle', pos: 'verb', phonetic: '/ˈstrʌɡ.əl/', meaning_vi: 'gặp khó khăn, vật lộn', context_sentence: 'I struggle with difficult grammar.' },
      { word: 'supportive', pos: 'adj', phonetic: '/səˈpɔː.tɪv/', meaning_vi: 'luôn ủng hộ, giúp đỡ', context_sentence: 'A good friend is always supportive.' },
      { word: 'honest', pos: 'adj', phonetic: '/ˈɒn.ɪst/', meaning_vi: 'thành thật, chân thành', context_sentence: 'Nam is an honest and trustworthy person.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'How long have Nam and the author been friends?',
        options: ['For two days', 'Since the first grade', 'Since last week', 'They just met yesterday'],
        answer: 1,
        explain: '"We have been close friends since we were in the first grade".',
      },
      {
        id: 'q2',
        question: 'Which subject is Nam especially good at?',
        options: ['History', 'Painting', 'Mathematics', 'Cooking'],
        answer: 2,
        explain: '"He is very kind and smart at mathematics".',
      },
      {
        id: 'q3',
        question: 'What do they do after playing soccer on weekends?',
        options: ['Go home and cry', 'Eat ice cream and talk about dreams', 'Do more tests', 'Watch scary movies'],
        answer: 1,
        explain: '"After playing, we eat ice cream and talk about our dreams".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'smile',
          answer: 'smile',
          options: ['smile', 'frown', 'anger', 'tear'],
          explain: '"has a warm smile" (có một nụ cười ấm áp).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Best Friend Nam',
        children: [
          { id: 'c1', label: 'History: Friends since 1st grade' },
          { id: 'c2', label: 'Traits: Smart at math, patient & kind' },
          { id: 'c3', label: 'Activities: Soccer & ice cream on weekends' },
        ],
      },
    },
  },
  {
    slug: 'a2-overcoming-first-day-anxiety',
    title: 'Overcoming Nervousness on My First Day of School',
    cefr_level: 'A2',
    theme_id: 'friendship-feelings',
    word_count: 140,
    estimated_read_minutes: 2,
    difficulty_score: 28,
    source_type: 'voa',
    status: 'published',
    summary: 'Cảm giác hồi hộp, lo âu trong ngày đầu bước vào ngôi trường mới và sự ấm áp khi nhận được nụ cười chào đón từ bạn cùng bàn.',
    translation: 'Bắt đầu học tại một ngôi trường mới có thể là một trải nghiệm đáng sợ. Tôi vẫn nhớ như in ngày đầu tiên bước vào trường trung học cách đây hai năm. Tôi đứng trước cổng trường lớn, tim đập thình thịch trong lồng ngực. Mọi người xung quanh dường như đều đã quen biết nhau từ trước, còn tôi thì không biết một ai. Khi bước vào lớp, tôi chọn một chiếc bàn ở góc phòng và im lặng. Đột nhiên, một bạn nữ với đôi mắt sáng bước lại gần và mỉm cười: "Chào bạn! Chỗ này có ai ngồi chưa?". Cô ấy tên là Lan. Chúng tôi bắt đầu trò chuyện về âm nhạc và nhận ra mình có cùng sở thích. Sự lo âu trong tôi biến mất hoàn toàn, thay vào đó là sự tự tin.',
    passage: `Starting at a new school can be an intimidating experience. I vividly remember my first morning at high school two years ago. I stood before the tall iron gates, feeling my heart beat rapidly against my chest. Everyone around me seemed to know each other already, laughing and chatting in groups, while I stood completely alone. When I stepped into the classroom, I chose a desk in the back corner and looked down silently. Suddenly, a cheerful girl with bright eyes approached my table and smiled warmly: "Hi! Is this seat taken?" Her name was Lan. We quickly started talking about our favorite songs and hobbies. That simple greeting made all my nervousness vanish, and I realized that making friends often begins with just one kind word.`,
    passage_plain: `Starting at a new school can be an intimidating experience. I vividly remember my first morning at high school two years ago. I stood before the tall iron gates, feeling my heart beat rapidly against my chest. Everyone around me seemed to know each other already, laughing and chatting in groups, while I stood completely alone. When I stepped into the classroom, I chose a desk in the back corner and looked down silently. Suddenly, a cheerful girl with bright eyes approached my table and smiled warmly: "Hi! Is this seat taken?" Her name was Lan. We quickly started talking about our favorite songs and hobbies. That simple greeting made all my nervousness vanish, and I realized that making friends often begins with just one kind word.`,
    vocabulary_highlights: [
      { word: 'intimidating', pos: 'adj', phonetic: '/ɪnˈtɪm.ɪ.deɪ.tɪŋ/', meaning_vi: 'đáng sợ, khiến lo lắng', context_sentence: 'Starting a new job can be intimidating.' },
      { word: 'nervousness', pos: 'noun', phonetic: '/ˈnɜː.vəs.nəs/', meaning_vi: 'sự lo âu, hồi hộp', context_sentence: 'Her nervousness vanished after talking.' },
      { word: 'approach', pos: 'verb', phonetic: '/əˈprəʊtʃ/', meaning_vi: 'tiến lại gần', context_sentence: 'A cheerful classmate approached my desk.' },
      { word: 'greeting', pos: 'noun', phonetic: '/ˈɡriː.tɪŋ/', meaning_vi: 'lời chào hỏi', context_sentence: 'A friendly greeting can change someone\'s day.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'How did the author feel before entering the new school gates?',
        options: ['Angry and loud', 'Nervous with a rapidly beating heart', 'Bored and sleepy', 'Hungry for pizza'],
        answer: 1,
        explain: '"feeling my heart beat rapidly against my chest... standing completely alone".',
      },
      {
        id: 'q2',
        question: 'What did Lan say when she approached the desk?',
        options: ['"Give me your lunch money!"', '"Hi! Is this seat taken?"', '"Where is the library?"', '"Go away!"'],
        answer: 1,
        explain: '"Hi! Is this seat taken?" (Chào bạn, chỗ này có ai ngồi chưa?).',
      },
      {
        id: 'q3',
        question: 'What lesson did the author learn at the end?',
        options: ['Never talk to strangers', 'Making friends often begins with one kind word', 'Always sit in the front row', 'High school is terrible'],
        answer: 1,
        explain: '"making friends often begins with just one kind word".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'cheerful',
          answer: 'cheerful',
          options: ['cheerful', 'angry', 'terrible', 'silent'],
          explain: '"cheerful girl" (cô gái vui tươi, hoạt bát).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'First Day at School',
        children: [
          { id: 'c1', label: 'Challenge: Alone and nervous at gates' },
          { id: 'c2', label: 'Turning point: Lan asks to sit together' },
          { id: 'c3', label: 'Outcome: Friendship starts with a kind word' },
        ],
      },
    },
  },

  // =========================================================================
  // 5. NATURE & ANIMALS (Thiên nhiên & động vật)
  // =========================================================================
  {
    slug: 'a1-lucky-my-playful-puppy',
    title: 'Lucky, My Playful Golden Puppy',
    cefr_level: 'A1',
    theme_id: 'nature-animals',
    word_count: 84,
    estimated_read_minutes: 1,
    difficulty_score: 14,
    source_type: 'voa',
    status: 'published',
    summary: 'Chú cún nhỏ đáng yêu tên Lucky: bộ lông vàng mượt mà, sở thích đuổi bóng trong vườn và đón chủ về mỗi chiều.',
    translation: 'Tôi có một chú cún cưng nhỏ tên là Lucky. Chú mới sáu tháng tuổi. Lucky có bộ lông màu vàng mượt và đôi tai cụp rất dễ thương. Chú rất hiếu động và thích chơi đùa trong vườn sau nhà. Trò chơi yêu thích của Lucky là đuổi theo một quả bóng tennis màu đỏ. Khi tôi ném bóng, chú chạy thật nhanh để nhặt và mang lại cho tôi. Mỗi chiều khi tôi đi học về, Lucky chạy ra cửa và vẫy đuôi mừng rỡ. Chú là người bạn đồng hành tuyệt vời.',
    passage: `I have a small puppy named Lucky. He is only six months old. Lucky has soft golden fur and cute floppy ears. He is very active and loves running around in our backyard. Lucky's favorite game is chasing a red tennis ball. When I throw the ball across the grass, he sprints fast to catch it and brings it back. Every afternoon when I return from school, Lucky waits by the door and wags his tail happily. Having a pet brings so much joy.`,
    passage_plain: `I have a small puppy named Lucky. He is only six months old. Lucky has soft golden fur and cute floppy ears. He is very active and loves running around in our backyard. Lucky's favorite game is chasing a red tennis ball. When I throw the ball across the grass, he sprints fast to catch it and brings it back. Every afternoon when I return from school, Lucky waits by the door and wags his tail happily. Having a pet brings so much joy.`,
    vocabulary_highlights: [
      { word: 'fur', pos: 'noun', phonetic: '/fɜːr/', meaning_vi: 'lông thú', context_sentence: 'The puppy has soft golden fur.' },
      { word: 'sprint', pos: 'verb', phonetic: '/sprɪnt/', meaning_vi: 'chạy nước rút, lao nhanh', context_sentence: 'He sprints across the yard to catch the ball.' },
      { word: 'wag', pos: 'verb', phonetic: '/wæɡ/', meaning_vi: 'vẫy đuôi', context_sentence: 'The dog wags his tail when happy.' },
      { word: 'backyard', pos: 'noun', phonetic: '/ˌbækˈjɑːd/', meaning_vi: 'vườn sau nhà', context_sentence: 'We play with our dog in the backyard.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'How old is the puppy Lucky?',
        options: ['Two years old', 'Six months old', 'Five years old', 'Ten days old'],
        answer: 1,
        explain: '"He is only six months old" (Chú mới chỉ sáu tháng tuổi).',
      },
      {
        id: 'q2',
        question: 'What is Lucky\'s favorite game?',
        options: ['Climbing trees', 'Swimming in a lake', 'Chasing a red tennis ball', 'Sleeping in a box'],
        answer: 2,
        explain: '"Lucky\'s favorite game is chasing a red tennis ball".',
      },
      {
        id: 'q3',
        question: 'What does Lucky do when the author returns from school?',
        options: ['Barks angrily', 'Waits by the door and wags his tail', 'Hides under the bed', 'Runs away'],
        answer: 1,
        explain: '"Lucky waits by the door and wags his tail happily".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'tail',
          answer: 'tail',
          options: ['tail', 'nose', 'tongue', 'book'],
          explain: '"wags his tail" (vẫy đuôi) là hành động quen thuộc của chú chó.',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Lucky the Puppy',
        children: [
          { id: 'c1', label: 'Appearance: 6 months old, golden fur' },
          { id: 'c2', label: 'Game: Chasing red tennis ball' },
          { id: 'c3', label: 'Habit: Wags tail at the door' },
        ],
      },
    },
  },
  {
    slug: 'a2-saving-sea-turtles-on-con-dao',
    title: 'Protecting Baby Sea Turtles on Con Dao Island',
    cefr_level: 'A2',
    theme_id: 'nature-animals',
    word_count: 148,
    estimated_read_minutes: 2,
    difficulty_score: 30,
    source_type: 'voa',
    status: 'published',
    summary: 'Công việc tình nguyện ý nghĩa tại Côn Đảo: bảo vệ tổ rùa biển, ấp trứng trên bãi cát và thả hàng trăm chú rùa con trở về đại dương.',
    translation: 'Côn Đảo là một quần đảo hoang sơ tuyệt đẹp ở ngoài khơi bờ biển phía nam Việt Nam. Nơi đây là một trong những bãi đẻ quan trọng nhất của loài rùa biển xanh quý hiếm. Hàng năm từ tháng Năm đến tháng Mười, rùa mẹ bơi hàng ngàn dặm để lên các bãi cát yên tĩnh vào ban đêm và đẻ hàng trăm quả trứng tròn. Để bảo vệ các tổ trứng khỏi kẻ săn mồi và biến đổi khí hậu, các kiểm lâm viên và tình nguyện viên cẩn thận di chuyển trứng vào các khu vực ấp an toàn. Sau khoảng năm mươi ngày, những chú rùa con nhỏ bằng lòng bàn tay bắt đầu cựa quậy phá vỏ. Vào sáng sớm, các tình nguyện viên thả chúng xuống mép nước. Nhìn những sinh linh bé nhỏ dũng cảm bơi vào đại dương bao la là một khoảnh khắc kỳ diệu.',
    passage: `Con Dao is a breathtaking archipelago located off the southern coast of Vietnam. It is widely recognized as one of the most vital nesting grounds for endangered green sea turtles in Southeast Asia. Every year between May and October, mother turtles swim across thousands of nautical miles to lay their eggs on quiet beaches under the moonlight. To safeguard the fragile nests from natural predators and high tides, dedicated park rangers and passionate volunteers carefully relocate the eggs to protected hatcheries. After approximately fifty days of incubation in the warm sand, hundreds of miniature hatchlings emerge simultaneously. At sunrise, volunteers release the baby turtles near the water's edge. Watching these tiny creatures paddle bravely into the vast ocean is an awe-inspiring experience that inspires environmental conservation.`,
    passage_plain: `Con Dao is a breathtaking archipelago located off the southern coast of Vietnam. It is widely recognized as one of the most vital nesting grounds for endangered green sea turtles in Southeast Asia. Every year between May and October, mother turtles swim across thousands of nautical miles to lay their eggs on quiet beaches under the moonlight. To safeguard the fragile nests from natural predators and high tides, dedicated park rangers and passionate volunteers carefully relocate the eggs to protected hatcheries. After approximately fifty days of incubation in the warm sand, hundreds of miniature hatchlings emerge simultaneously. At sunrise, volunteers release the baby turtles near the water's edge. Watching these tiny creatures paddle bravely into the vast ocean is an awe-inspiring experience that inspires environmental conservation.`,
    vocabulary_highlights: [
      { word: 'endangered', pos: 'adj', phonetic: '/ɪnˈdeɪn.dʒəd/', meaning_vi: 'có nguy cơ tuyệt chủng', context_sentence: 'Sea turtles are an endangered species.' },
      { word: 'predator', pos: 'noun', phonetic: '/ˈpred.ə.tər/', meaning_vi: 'kẻ săn mồi tự nhiên', context_sentence: 'Eggs are protected from hungry predators.' },
      { word: 'hatchling', pos: 'noun', phonetic: '/ˈhætʃ.lɪŋ/', meaning_vi: 'rùa con mới nở', context_sentence: 'Tiny hatchlings head straight for the waves.' },
      { word: 'conservation', pos: 'noun', phonetic: '/ˌkɒn.səˈveɪ.ʃən/', meaning_vi: 'sự bảo tồn thiên nhiên', context_sentence: 'Volunteers work hard for ocean conservation.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'What animal nests on the beaches of Con Dao?',
        options: ['Polar bears', 'Green sea turtles', 'Kangaroos', 'Tigers'],
        answer: 1,
        explain: '"vital nesting grounds for endangered green sea turtles".',
      },
      {
        id: 'q2',
        question: 'Why do rangers relocate the turtle eggs to hatcheries?',
        options: ['To sell them at the market', 'To cook them for dinner', 'To protect them from predators and high tides', 'To study them in a classroom'],
        answer: 2,
        explain: '"To safeguard the fragile nests from natural predators and high tides".',
      },
      {
        id: 'q3',
        question: 'When are the baby turtles released into the sea?',
        options: ['At midnight during a storm', 'At sunrise near the water\'s edge', 'In the afternoon heat', 'Never'],
        answer: 1,
        explain: '"At sunrise, volunteers release the baby turtles near the water\'s edge".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'volunteers',
          answer: 'volunteers',
          options: ['volunteers', 'hunters', 'tourists', 'drivers'],
          explain: '"passionate volunteers" (những tình nguyện viên nhiệt huyết).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Sea Turtles on Con Dao',
        children: [
          { id: 'c1', label: 'Nesting: May to October on beaches' },
          { id: 'c2', label: 'Protection: Rangers relocate eggs to hatcheries' },
          { id: 'c3', label: 'Release: Baby hatchlings released at sunrise' },
        ],
      },
    },
  },

  // =========================================================================
  // 6. HEALTH & WELLNESS (Sức khỏe)
  // =========================================================================
  {
    slug: 'a1-why-drinking-water-is-good',
    title: 'Why Drinking Water is Important',
    cefr_level: 'A1',
    theme_id: 'health',
    word_count: 85,
    estimated_read_minutes: 1,
    difficulty_score: 15,
    source_type: 'voa',
    status: 'published',
    summary: 'Tầm quan trọng của việc uống đủ nước mỗi ngày đối với não bộ, làn da và mức năng lượng của cơ thể.',
    translation: 'Cơ thể chúng ta cần nước để sống khỏe mạnh mỗi ngày. Các bác sĩ khuyên rằng mỗi người nên uống khoảng hai lít nước mỗi ngày. Uống đủ nước giúp não bộ tỉnh táo và tập trung học tập tốt hơn. Nước cũng làm cho làn da của bạn mịn màng và tươi sáng. Khi bạn cảm thấy mệt mỏi hoặc đau đầu nhẹ, hãy thử uống một cốc nước mát. Thay vì uống nước ngọt có ga nhiều đường, uống nước lọc là lựa chọn thông minh nhất cho sức khỏe.',
    passage: `Our body needs clean water every single day to stay healthy. Doctors recommend drinking about two liters of water daily. When you drink enough water, your brain stays alert and you can concentrate on your studies much better. Water also keeps your skin soft and clear. Whenever you feel tired or have a minor headache, try drinking a tall glass of fresh water first. Instead of sugary soft drinks, plain water is always the smartest choice for your body.`,
    passage_plain: `Our body needs clean water every single day to stay healthy. Doctors recommend drinking about two liters of water daily. When you drink enough water, your brain stays alert and you can concentrate on your studies much better. Water also keeps your skin soft and clear. Whenever you feel tired or have a minor headache, try drinking a tall glass of fresh water first. Instead of sugary soft drinks, plain water is always the smartest choice for your body.`,
    vocabulary_highlights: [
      { word: 'concentrate', pos: 'verb', phonetic: '/ˈkɒn.sən.treɪt/', meaning_vi: 'tập trung', context_sentence: 'Water helps students concentrate in class.' },
      { word: 'alert', pos: 'adj', phonetic: '/əˈlɜːt/', meaning_vi: 'tỉnh táo, nhạy bén', context_sentence: 'Stay alert during morning lessons.' },
      { word: 'headache', pos: 'noun', phonetic: '/ˈhed.eɪk/', meaning_vi: 'chứng đau đầu', context_sentence: 'Dehydration can cause a bad headache.' },
      { word: 'sugary', pos: 'adj', phonetic: '/ˈʃʊɡ.ər.i/', meaning_vi: 'chứa nhiều đường', context_sentence: 'Avoid sugary sodas and fruit syrup.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'How much water do doctors recommend drinking every day?',
        options: ['10 liters', 'About two liters', 'One small drop', 'None'],
        answer: 1,
        explain: '"Doctors recommend drinking about two liters of water daily".',
      },
      {
        id: 'q2',
        question: 'What benefit does water have on the brain?',
        options: ['It makes you forget everything', 'It keeps your brain alert and focused', 'It makes you sleepy', 'It has no effect'],
        answer: 1,
        explain: '"your brain stays alert and you can concentrate on your studies much better".',
      },
      {
        id: 'q3',
        question: 'What is a smarter choice than sugary soft drinks?',
        options: ['Energy drinks', 'Plain water', 'Coffee with extra sugar', 'Milk tea'],
        answer: 1,
        explain: '"Instead of sugary soft drinks, plain water is always the smartest choice".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'healthy',
          answer: 'healthy',
          options: ['healthy', 'sick', 'tired', 'dangerous'],
          explain: '"stay healthy" (giữ gìn sức khỏe).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Importance of Water',
        children: [
          { id: 'c1', label: 'Amount: ~2 liters daily' },
          { id: 'c2', label: 'Benefits: Brain alertness, clear skin' },
          { id: 'c3', label: 'Advice: Choose plain water over sugary soda' },
        ],
      },
    },
  },
  {
    slug: 'a2-habits-for-restful-sleep',
    title: 'Simple Habits for a Restful Night of Sleep',
    cefr_level: 'A2',
    theme_id: 'health',
    word_count: 144,
    estimated_read_minutes: 2,
    difficulty_score: 29,
    source_type: 'voa',
    status: 'published',
    summary: 'Những thói quen vàng giúp cải thiện giấc ngủ: tắt thiết bị điện tử trước khi ngủ 30 phút, giữ phòng ngủ mát mẻ và duy trì giờ thức giấc cố định.',
    translation: 'Một giấc ngủ ngon đóng vai trò vô cùng quan trọng đối với sức khỏe thể chất và tinh thần của chúng ta. Tuy nhiên, nhiều bạn trẻ ngày nay gặp khó khăn khi đi vào giấc ngủ do thói quen lướt điện thoại thông minh trên giường. Ánh sáng xanh phát ra từ màn hình đánh lừa não bộ của bạn rằng trời vẫn còn là ban ngày, ngăn cơ thể tiết ra hormone gây buồn ngủ. Để có giấc ngủ sâu hơn, hãy thử tắt tất cả các thiết bị điện tử ít nhất ba mươi phút trước khi đi ngủ. Thay vào đó, bạn có thể đọc một cuốn sách giấy hoặc nghe nhạc không lời nhẹ nhàng. Giữ nhiệt độ phòng ngủ mát mẻ và tối hoàn toàn cũng báo hiệu cho cơ thể biết đã đến lúc nghỉ ngơi.',
    passage: `Getting high-quality sleep is just as critical for your health as eating nutritious food and exercising regularly. Unfortunately, many students struggle to fall asleep because they scroll on their smartphones late into the night. The blue light emitted by electronic screens tricks the human brain into thinking it is still daytime, which prevents the production of melatonin, a vital sleep hormone. To improve your sleep quality naturally, establish a relaxing bedtime routine. Turn off digital screens at least thirty minutes before going to bed. Instead of checking social media notifications, read a chapter of a physical book or listen to calming instrumental music. Additionally, maintaining a cool, dark, and quiet bedroom environment signals to your nervous system that it is time to recharge.`,
    passage_plain: `Getting high-quality sleep is just as critical for your health as eating nutritious food and exercising regularly. Unfortunately, many students struggle to fall asleep because they scroll on their smartphones late into the night. The blue light emitted by electronic screens tricks the human brain into thinking it is still daytime, which prevents the production of melatonin, a vital sleep hormone. To improve your sleep quality naturally, establish a relaxing bedtime routine. Turn off digital screens at least thirty minutes before going to bed. Instead of checking social media notifications, read a chapter of a physical book or listen to calming instrumental music. Additionally, maintaining a cool, dark, and quiet bedroom environment signals to your nervous system that it is time to recharge.`,
    vocabulary_highlights: [
      { word: 'critical', pos: 'adj', phonetic: '/ˈkrɪt.ɪ.kəl/', meaning_vi: 'quan trọng, then chốt', context_sentence: 'Good sleep is critical for memory.' },
      { word: 'emit', pos: 'verb', phonetic: '/iˈmɪt/', meaning_vi: 'phát ra, tỏa ra', context_sentence: 'Screens emit blue light at night.' },
      { word: 'routine', pos: 'noun', phonetic: '/ruːˈtiːn/', meaning_vi: 'trình tự, thói quen', context_sentence: 'Create a relaxing bedtime routine.' },
      { word: 'recharge', pos: 'verb', phonetic: '/ˌriːˈtʃɑːdʒ/', meaning_vi: 'nạp lại năng lượng', context_sentence: 'Sleep allows your brain to recharge.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'Why does screen blue light make falling asleep difficult?',
        options: ['It makes screens look ugly', 'It tricks the brain into thinking it is daytime and blocks melatonin', 'It overheats the bed', 'It makes a loud ringing sound'],
        answer: 1,
        explain: '"blue light emitted by electronic screens tricks the human brain into thinking it is still daytime, which prevents the production of melatonin".',
      },
      {
        id: 'q2',
        question: 'How long before bed should you turn off digital screens?',
        options: ['At least 30 minutes', '5 seconds', '3 hours after sleeping', 'Never'],
        answer: 0,
        explain: '"Turn off digital screens at least thirty minutes before going to bed".',
      },
      {
        id: 'q3',
        question: 'What is a recommended activity instead of checking social media?',
        options: ['Eating spicy noodles', 'Reading a chapter of a physical book', 'Drinking coffee', 'Playing intense video games'],
        answer: 1,
        explain: '"read a chapter of a physical book or listen to calming instrumental music".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'improve',
          answer: 'improve',
          options: ['improve', 'destroy', 'forget', 'lose'],
          explain: '"To improve your sleep quality" (Để cải thiện chất lượng giấc ngủ).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Better Sleep Habits',
        children: [
          { id: 'c1', label: 'Problem: Blue light blocks melatonin' },
          { id: 'c2', label: 'Action: Turn screens off 30 min before bed' },
          { id: 'c3', label: 'Alternative: Read physical book & quiet room' },
        ],
      },
    },
  },

  // =========================================================================
  // 7. SPORTS & FITNESS (Thể thao)
  // =========================================================================
  {
    slug: 'a1-playing-badminton-with-family',
    title: 'Playing Badminton in the Park',
    cefr_level: 'A1',
    theme_id: 'sports',
    word_count: 83,
    estimated_read_minutes: 1,
    difficulty_score: 14,
    source_type: 'voa',
    status: 'published',
    summary: 'Niềm vui chơi cầu lông cùng cha vào các buổi chiều: rèn luyện phản xạ nhanh nhẹn và nâng cao sức khỏe.',
    translation: 'Cầu lông là một môn thể thao rất phổ biến ở Việt Nam. Vào mỗi buổi chiều Chủ nhật, tôi và bố đến công viên gần nhà để chơi cầu lông. Chúng tôi mang theo hai chiếc vợt và một vài quả cầu lông màu trắng. Bố tôi chơi rất giỏi và đánh những cú cầu cao. Tôi phải chạy thật nhanh và nhảy lên để đỡ cầu. Chúng tôi chơi trong khoảng một giờ và đổ rất nhiều mồ hôi. Chơi thể thao giúp cơ bắp của tôi săn chắc và tinh thần vui vẻ.',
    passage: `Badminton is a very popular sport in Vietnam. Every Sunday afternoon, my father and I go to the community park to play. We bring two lightweight rackets and a tube of white shuttlecocks. My father plays very well and hits the shuttlecock high into the air. I have to run fast and jump high to hit it back over the net. We play for an hour and sweat a lot. Playing sports keeps our bodies strong and our minds cheerful.`,
    passage_plain: `Badminton is a very popular sport in Vietnam. Every Sunday afternoon, my father and I go to the community park to play. We bring two lightweight rackets and a tube of white shuttlecocks. My father plays very well and hits the shuttlecock high into the air. I have to run fast and jump high to hit it back over the net. We play for an hour and sweat a lot. Playing sports keeps our bodies strong and our minds cheerful.`,
    vocabulary_highlights: [
      { word: 'racket', pos: 'noun', phonetic: '/ˈræk.ɪt/', meaning_vi: 'vợt cầu lông/quần vợt', context_sentence: 'I bought a new badminton racket.' },
      { word: 'shuttlecock', pos: 'noun', phonetic: '/ˈʃʌt.əl.kɒk/', meaning_vi: 'quả cầu lông', context_sentence: 'Hit the shuttlecock over the net.' },
      { word: 'sweat', pos: 'verb/noun', phonetic: '/swet/', meaning_vi: 'đổ mồ hôi, mồ hôi', context_sentence: 'We sweat after running around the court.' },
      { word: 'cheerful', pos: 'adj', phonetic: '/ˈtʃɪə.fəl/', meaning_vi: 'vui vẻ, phấn khởi', context_sentence: 'Exercising makes us feel cheerful.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'Who does the author play badminton with?',
        options: ['Their teacher', 'Their father', 'A stranger', 'Nobody'],
        answer: 1,
        explain: '"my father and I go to the community park to play".',
      },
      {
        id: 'q2',
        question: 'What equipment do they bring to the park?',
        options: ['Football and boots', 'Two rackets and shuttlecocks', 'Bicycles and helmets', 'A chess board'],
        answer: 1,
        explain: '"We bring two lightweight rackets and a tube of white shuttlecocks".',
      },
      {
        id: 'q3',
        question: 'How long do they play each session?',
        options: ['Ten hours', 'Five minutes', 'For an hour', 'All night'],
        answer: 2,
        explain: '"We play for an hour and sweat a lot".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'popular',
          answer: 'popular',
          options: ['popular', 'hated', 'boring', 'invisible'],
          explain: '"popular sport" (môn thể thao phổ biến).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Playing Badminton',
        children: [
          { id: 'c1', label: 'Where: Community park on Sundays' },
          { id: 'c2', label: 'Gear: 2 rackets & shuttlecocks' },
          { id: 'c3', label: 'Benefit: Strong body & cheerful mind' },
        ],
      },
    },
  },
  {
    slug: 'a2-completing-my-first-5k-run',
    title: 'Training for My First 5K Fun Run',
    cefr_level: 'A2',
    theme_id: 'sports',
    word_count: 146,
    estimated_read_minutes: 2,
    difficulty_score: 29,
    source_type: 'voa',
    status: 'published',
    summary: 'Hành trình vượt qua thử thách để hoàn thành cự ly chạy 5km đầu tiên: sự kiên trì từng ngày và cảm xúc vỡ òa khi chạm vạch đích.',
    translation: 'Ba tháng trước, tôi thậm chí không thể chạy nổi hai phút mà không cảm thấy hụt hơi. Nhận ra sức bền của mình đang suy giảm, tôi quyết định đăng ký tham gia một giải chạy bộ cộng đồng cự ly 5km. Ban đầu, việc tập luyện rất khó khăn. Tôi bắt đầu bằng việc đi bộ nhanh xen kẽ các đoạn chạy chậm trong hai mươi phút. Dần dần, tôi tăng thời gian chạy và xây dựng sức bền từng tuần một. Vào ngày thi đấu chính thức, hàng ngàn người tham gia đã tập trung từ lúc sáu giờ sáng với bầu không khí tràn đầy năng lượng. Khi tiếng súng xuất phát vang lên, tôi duy trì tốc độ đều đặn và không bỏ cuộc. Khoảnh khắc tôi băng qua vạch đích, tôi cảm thấy vô cùng tự hào về bản thân.',
    passage: `Three months ago, I could not even jog for two continuous minutes without feeling completely breathless. Realizing that my physical stamina was deteriorating, I signed up for a local 5K community run to challenge myself. At first, sticking to the training schedule was tough. I followed a beginner program that combined brisk walking intervals with short jogging periods. Week by week, my lungs grew stronger and my legs felt lighter. On the morning of the race, thousands of runners gathered near the city lake, creating an inspiring and festive atmosphere. When the starting horn sounded, I paced myself carefully, focusing on my breathing instead of competing with faster runners. Crossing the finish line thirty minutes later was an unforgettable milestone that proved perseverance can overcome self-doubt.`,
    passage_plain: `Three months ago, I could not even jog for two continuous minutes without feeling completely breathless. Realizing that my physical stamina was deteriorating, I signed up for a local 5K community run to challenge myself. At first, sticking to the training schedule was tough. I followed a beginner program that combined brisk walking intervals with short jogging periods. Week by week, my lungs grew stronger and my legs felt lighter. On the morning of the race, thousands of runners gathered near the city lake, creating an inspiring and festive atmosphere. When the starting horn sounded, I paced myself carefully, focusing on my breathing instead of competing with faster runners. Crossing the finish line thirty minutes later was an unforgettable milestone that proved perseverance can overcome self-doubt.`,
    vocabulary_highlights: [
      { word: 'stamina', pos: 'noun', phonetic: '/ˈstæm.ɪ.nə/', meaning_vi: 'sức bền, thể lực dẻo dai', context_sentence: 'Running regularly builds your stamina.' },
      { word: 'perseverance', pos: 'noun', phonetic: '/ˌpɜː.sɪˈvɪə.rəns/', meaning_vi: 'sự kiên trì, bền bỉ', context_sentence: 'Perseverance helps you finish difficult goals.' },
      { word: 'milestone', pos: 'noun', phonetic: '/ˈmaɪl.stəʊn/', meaning_vi: 'cột mốc quan trọng', context_sentence: 'Finishing the race was a personal milestone.' },
      { word: 'breathless', pos: 'adj', phonetic: '/ˈbreθ.ləs/', meaning_vi: 'hụt hơi, thở không ra hơi', context_sentence: 'He felt breathless after climbing the hill.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'Why did the author sign up for the 5K run?',
        options: ['To win a gold medal', 'To challenge themselves and rebuild stamina', 'To sell running shoes', 'Because their boss ordered them'],
        answer: 1,
        explain: '"Realizing that my physical stamina was deteriorating, I signed up for a local 5K community run to challenge myself".',
      },
      {
        id: 'q2',
        question: 'How did the author train at the beginning?',
        options: ['Ran 20 kilometers every day', 'Combined brisk walking with short jogging periods', 'Lifted heavy weights for 5 hours', 'Swam across the lake'],
        answer: 1,
        explain: '"combined brisk walking intervals with short jogging periods".',
      },
      {
        id: 'q3',
        question: 'What strategy did the author use during the race?',
        options: ['Sprinted as fast as possible in the first minute', 'Paced themselves and focused on breathing', 'Walked the whole way eating snacks', 'Stopped to take selfies'],
        answer: 1,
        explain: '"I paced myself carefully, focusing on my breathing instead of competing with faster runners".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'perseverance',
          answer: 'perseverance',
          options: ['perseverance', 'laziness', 'cowardice', 'jealousy'],
          explain: '"perseverance can overcome self-doubt" (sự kiên trì có thể chiến thắng sự hoài nghi bản thân).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'My First 5K Run',
        children: [
          { id: 'c1', label: 'Starting point: Out of shape and breathless' },
          { id: 'c2', label: 'Training: Walk-jog intervals weekly' },
          { id: 'c3', label: 'Race day: Steady pace, crossed line in 30m' },
        ],
      },
    },
  },

  // =========================================================================
  // 8. SHOPPING & MONEY (Mua sắm & tiền bạc)
  // =========================================================================
  {
    slug: 'a1-shopping-at-the-supermarket',
    title: 'A Grocery Trip to the Supermarket',
    cefr_level: 'A1',
    theme_id: 'shopping-money',
    word_count: 85,
    estimated_read_minutes: 1,
    difficulty_score: 14,
    source_type: 'voa',
    status: 'published',
    summary: 'Đi siêu thị mua thực phẩm tươi: xe đẩy, rau củ, trái cây và thanh toán tại quầy thu ngân.',
    translation: 'Hôm nay là chiều thứ Bảy, tôi đi siêu thị cùng mẹ. Siêu thị rất rộng lớn và sáng sủa. Đầu tiên, tôi lấy một chiếc xe đẩy kim loại ở lối vào. Chúng tôi đi đến quầy rau củ và chọn cà chua đỏ, dưa chuột tươi và một nải chuối. Sau đó, mẹ tôi mua một ít sữa tươi và trứng gà. Ở quầy thu ngân, chúng tôi đặt các món đồ lên băng chuyền. Mẹ tôi thanh toán bằng thẻ ngân hàng và nhân viên cho thực phẩm vào túi vải tái sử dụng.',
    passage: `Today is Saturday afternoon, and I am going to the supermarket with my mother. The supermarket is clean, bright, and very spacious. First, I grab a metal shopping cart near the entrance. We head straight to the fresh produce section to choose ripe red tomatoes, crisp cucumbers, and a bunch of yellow bananas. Next, we pick up fresh milk and eggs. At the checkout counter, the cashier scans our items quickly. My mother pays with her bank card, and we pack everything into reusable cloth bags.`,
    passage_plain: `Today is Saturday afternoon, and I am going to the supermarket with my mother. The supermarket is clean, bright, and very spacious. First, I grab a metal shopping cart near the entrance. We head straight to the fresh produce section to choose ripe red tomatoes, crisp cucumbers, and a bunch of yellow bananas. Next, we pick up fresh milk and eggs. At the checkout counter, the cashier scans our items quickly. My mother pays with her bank card, and we pack everything into reusable cloth bags.`,
    vocabulary_highlights: [
      { word: 'spacious', pos: 'adj', phonetic: '/ˈspeɪ.ʃəs/', meaning_vi: 'rộng rãi, thoáng đãng', context_sentence: 'The new supermarket is modern and spacious.' },
      { word: 'produce', pos: 'noun', phonetic: '/ˈprɒd.juːs/', meaning_vi: 'nông sản tươi (rau củ quả)', context_sentence: 'The produce section has fresh vegetables.' },
      { word: 'cashier', pos: 'noun', phonetic: '/kæʃˈɪər/', meaning_vi: 'nhân viên thu ngân', context_sentence: 'The friendly cashier scanned our groceries.' },
      { word: 'reusable', pos: 'adj', phonetic: '/riːˈjuː.zə.bəl/', meaning_vi: 'có thể tái sử dụng', context_sentence: 'We carry reusable bags to avoid plastic.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'Who goes to the supermarket with the author?',
        options: ['Their mother', 'Their doctor', 'Their dog', 'Their boss'],
        answer: 0,
        explain: '"I am going to the supermarket with my mother".',
      },
      {
        id: 'q2',
        question: 'What do they choose in the produce section?',
        options: ['Laptops and phones', 'Tomatoes, cucumbers, and bananas', 'Shoes and shirts', 'Candy and soda'],
        answer: 1,
        explain: '"choose ripe red tomatoes, crisp cucumbers, and a bunch of yellow bananas".',
      },
      {
        id: 'q3',
        question: 'How does the mother pay for the groceries?',
        options: ['With gold coins', 'With her bank card', 'With foreign stamps', 'She does not pay'],
        answer: 1,
        explain: '"My mother pays with her bank card".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'supermarket',
          answer: 'supermarket',
          options: ['supermarket', 'hospital', 'cinema', 'stadium'],
          explain: '"shopping cart at the supermarket" (xe đẩy hàng ở siêu thị).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Supermarket Trip',
        children: [
          { id: 'c1', label: 'Entrance: Grab shopping cart' },
          { id: 'c2', label: 'Produce: Tomatoes, cucumbers, bananas' },
          { id: 'c3', label: 'Checkout: Card payment & cloth bags' },
        ],
      },
    },
  },
  {
    slug: 'a2-smart-budgeting-for-students',
    title: 'Smart Money Management for College Students',
    cefr_level: 'A2',
    theme_id: 'shopping-money',
    word_count: 142,
    estimated_read_minutes: 2,
    difficulty_score: 28,
    source_type: 'voa',
    status: 'published',
    summary: 'Phương pháp quản lý tài chính thông minh cho sinh viên: ghi chép thu chi, phân loại nhu cầu thiết yếu và lập quỹ tiết kiệm khẩn cấp.',
    translation: 'Quản lý tài chính cá nhân là một kỹ năng thiết yếu mà mọi sinh viên nên học sớm. Khi sống xa gia đình, bạn rất dễ chi tiêu quá tay cho những bữa ăn ngoài hoặc mua sắm bốc đồng. Một quy tắc đơn giản và hiệu quả là quy tắc ngân sách 50/30/20. Hãy dành 50% số tiền trợ cấp hoặc tiền lương của bạn cho các nhu cầu thiết yếu như tiền thuê trọ, tiền ăn và sách vở. 30% có thể dùng cho mong muốn cá nhân như xem phim hoặc uống cà phê cùng bạn bè. Cuối cùng, 20% còn lại nên được gửi vào tài khoản tiết kiệm khẩn cấp. Việc sử dụng các ứng dụng ghi chép chi tiêu trên điện thoại giúp bạn theo dõi từng đồng và tránh rơi vào cảnh hết tiền vào cuối tháng.',
    passage: `Managing personal finances is an indispensable life skill that every student should master early. When living away from family for the first time, it is shockingly easy to overspend on expensive takeouts and impulsive online shopping. A popular and practical strategy is the 50/30/20 budgeting rule. Under this guideline, allocate fifty percent of your monthly income or allowance to non-negotiable necessities such as dorm rent, nutritious groceries, and textbooks. Thirty percent can cover discretionary wants, including dining out with friends or catching a movie. Most importantly, save the remaining twenty percent in a separate emergency account. Tracking your daily expenses with a mobile app helps you understand your financial habits and prevents stressful shortages before the month ends.`,
    passage_plain: `Managing personal finances is an indispensable life skill that every student should master early. When living away from family for the first time, it is shockingly easy to overspend on expensive takeouts and impulsive online shopping. A popular and practical strategy is the 50/30/20 budgeting rule. Under this guideline, allocate fifty percent of your monthly income or allowance to non-negotiable necessities such as dorm rent, nutritious groceries, and textbooks. Thirty percent can cover discretionary wants, including dining out with friends or catching a movie. Most importantly, save the remaining twenty percent in a separate emergency account. Tracking your daily expenses with a mobile app helps you understand your financial habits and prevents stressful shortages before the month ends.`,
    vocabulary_highlights: [
      { word: 'budgeting', pos: 'noun', phonetic: '/ˈbʌdʒ.ɪ.tɪŋ/', meaning_vi: 'lập kế hoạch ngân sách', context_sentence: 'Budgeting prevents unnecessary debt.' },
      { word: 'necessities', pos: 'noun', phonetic: '/nəˈses.ə.tiz/', meaning_vi: 'các nhu cầu thiết yếu', context_sentence: 'Rent and food are essential necessities.' },
      { word: 'impulsive', pos: 'adj', phonetic: '/ɪmˈpʌl.sɪv/', meaning_vi: 'bốc đồng, ngẫu hứng', context_sentence: 'Avoid impulsive purchases online.' },
      { word: 'allowance', pos: 'noun', phonetic: '/əˈlaʊ.əns/', meaning_vi: 'tiền trợ cấp, tiền tiêu vặt', context_sentence: 'My parents send a monthly allowance.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'According to the 50/30/20 rule, what percentage goes to necessities?',
        options: ['10%', '30%', '50%', '90%'],
        answer: 2,
        explain: '"allocate fifty percent of your monthly income or allowance to non-negotiable necessities".',
      },
      {
        id: 'q2',
        question: 'What is the purpose of saving the final 20%?',
        options: ['To buy luxury watches', 'For an emergency savings account', 'To throw parties every night', 'To pay for video games'],
        answer: 1,
        explain: '"save the remaining twenty percent in a separate emergency account".',
      },
      {
        id: 'q3',
        question: 'How can students easily track their daily expenses?',
        options: ['By using a mobile app', 'By throwing receipts away', 'By never looking at bank balances', 'By asking strangers'],
        answer: 0,
        explain: '"Tracking your daily expenses with a mobile app helps you understand your financial habits".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'budgeting',
          answer: 'budgeting',
          options: ['budgeting', 'gambling', 'sleeping', 'shouting'],
          explain: '"50/30/20 budgeting rule" (quy tắc ngân sách 50/30/20).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Student Budgeting',
        children: [
          { id: 'c1', label: '50%: Necessities (Rent, food, books)' },
          { id: 'c2', label: '30%: Wants (Dining out, movies)' },
          { id: 'c3', label: '20%: Emergency savings via app tracking' },
        ],
      },
    },
  },

  // =========================================================================
  // 9. SCHOOL & STUDY (Trường lớp & học tập)
  // =========================================================================
  {
    slug: 'a1-my-english-class-at-school',
    title: 'An Exciting English Lesson',
    cefr_level: 'A1',
    theme_id: 'school-study',
    word_count: 82,
    estimated_read_minutes: 1,
    difficulty_score: 14,
    source_type: 'voa',
    status: 'published',
    summary: 'Giờ học tiếng Anh sôi nổi: cô giáo bản ngữ thân thiện, học từ vựng qua hình ảnh và các trò chơi đố chữ vui nhộn.',
    translation: 'Hôm nay chúng tôi có một tiết học tiếng Anh rất thú vị. Cô giáo của chúng tôi tên là Sarah, đến từ nước Anh. Cô ấy luôn mỉm cười và nói năng rất rõ ràng. Trong giờ học, chúng tôi học các từ vựng mới về động vật và thời tiết bằng cách sử dụng các tấm thẻ flashcard đầy màu sắc. Sau đó, cô chia cả lớp thành hai đội để chơi trò chơi đố chữ. Đội của tôi đã trả lời đúng nhiều câu hỏi và giành chiến thắng. Mọi người đều cười rất vui vẻ.',
    passage: `Today, we had an exciting English lesson at school. Our teacher is Ms. Sarah, who comes from England. She is very kind and speaks slowly so everyone can understand. In class, we learned new vocabulary words about animals and weather using colorful flashcards. Next, she divided the class into two teams to play a lively word guessing game. My team answered quickly and won the game. Learning a new language is so much fun when we play together.`,
    passage_plain: `Today, we had an exciting English lesson at school. Our teacher is Ms. Sarah, who comes from England. She is very kind and speaks slowly so everyone can understand. In class, we learned new vocabulary words about animals and weather using colorful flashcards. Next, she divided the class into two teams to play a lively word guessing game. My team answered quickly and won the game. Learning a new language is so much fun when we play together.`,
    vocabulary_highlights: [
      { word: 'flashcard', pos: 'noun', phonetic: '/ˈflæʃ.kɑːd/', meaning_vi: 'thẻ từ vựng có hình ảnh', context_sentence: 'Flashcards help me memorize words quickly.' },
      { word: 'lively', pos: 'adj', phonetic: '/ˈlaɪv.li/', meaning_vi: 'sôi nổi, hào hứng', context_sentence: 'The teacher organized a lively game.' },
      { word: 'vocabulary', pos: 'noun', phonetic: '/vəˈkæb.jə.lər.i/', meaning_vi: 'từ vựng', context_sentence: 'We practice new vocabulary every day.' },
      { word: 'divide', pos: 'verb', phonetic: '/dɪˈvaɪd/', meaning_vi: 'chia thành, phân chia', context_sentence: 'The teacher divided students into pairs.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'Where is Ms. Sarah from?',
        options: ['France', 'England', 'Japan', 'Brazil'],
        answer: 1,
        explain: '"Our teacher is Ms. Sarah, who comes from England".',
      },
      {
        id: 'q2',
        question: 'How did students learn new vocabulary in class?',
        options: ['By watching silent movies', 'Using colorful flashcards', 'By sleeping on desks', 'By writing letters in darkness'],
        answer: 1,
        explain: '"learned new vocabulary words about animals and weather using colorful flashcards".',
      },
      {
        id: 'q3',
        question: 'What game did the class play?',
        options: ['Chess', 'Hide and seek', 'A word guessing game', 'Soccer'],
        answer: 2,
        explain: '"play a lively word guessing game".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'understand',
          answer: 'understand',
          options: ['understand', 'ignore', 'forget', 'fight'],
          explain: '"speaks slowly so everyone can understand" (nói chậm để ai cũng hiểu được).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'English Lesson',
        children: [
          { id: 'c1', label: 'Teacher: Ms. Sarah from England' },
          { id: 'c2', label: 'Tools: Colorful flashcards' },
          { id: 'c3', label: 'Game: Word guessing competition' },
        ],
      },
    },
  },
  {
    slug: 'a2-how-active-recall-boosts-memory',
    title: 'The Power of Active Recall in Studying',
    cefr_level: 'A2',
    theme_id: 'school-study',
    word_count: 140,
    estimated_read_minutes: 2,
    difficulty_score: 29,
    source_type: 'voa',
    status: 'published',
    summary: 'Phương pháp ghi nhớ chủ động (Active Recall) kết hợp lặp lại ngắt quãng (Spaced Repetition) giúp học sinh nhớ lâu hơn gấp nhiều lần so với đọc thụ động.',
    translation: 'Nhiều học sinh dành hàng giờ đọc đi đọc lại sách giáo khoa và tô đậm các dòng chữ bằng bút dạ quang. Tuy nhiên, các nhà khoa học đã chứng minh rằng cách đọc thụ động này rất kém hiệu quả. Một phương pháp học tập vượt trội hơn nhiều được gọi là "Chủ động gợi nhớ" (Active Recall). Thay vì chỉ đọc tài liệu, bạn hãy gấp sách lại và tự kiểm tra kiến thức của mình bằng cách trả lời các câu hỏi hoặc giải thích bài học cho người khác. Khi bộ não của bạn phải nỗ lực tìm kiếm thông tin từ trí nhớ, các liên kết thần kinh sẽ trở nên mạnh mẽ hơn rất nhiều. Kết hợp phương pháp này với kỹ thuật lặp lại ngắt quãng sẽ giúp bạn ghi nhớ kiến thức trong nhiều tháng.',
    passage: `Many students spend countless hours rereading their textbooks and highlighting sentences with bright fluorescent markers. However, cognitive scientists have proven that this passive reading technique creates an illusion of competence without guaranteeing long-term retention. A significantly more effective study method is called Active Recall. Instead of simply reviewing notes, you close the book and actively test yourself by answering practice questions or explaining concepts in your own words. When your brain is forced to retrieve information from memory, it strengthens neural pathways and deepens comprehension. Pairing Active Recall with spaced repetition—reviewing material right before you are about to forget it—ensures that knowledge remains sharp and accessible for upcoming exams.`,
    passage_plain: `Many students spend countless hours rereading their textbooks and highlighting sentences with bright fluorescent markers. However, cognitive scientists have proven that this passive reading technique creates an illusion of competence without guaranteeing long-term retention. A significantly more effective study method is called Active Recall. Instead of simply reviewing notes, you close the book and actively test yourself by answering practice questions or explaining concepts in your own words. When your brain is forced to retrieve information from memory, it strengthens neural pathways and deepens comprehension. Pairing Active Recall with spaced repetition—reviewing material right before you are about to forget it—ensures that knowledge remains sharp and accessible for upcoming exams.`,
    vocabulary_highlights: [
      { word: 'retention', pos: 'noun', phonetic: '/rɪˈten.ʃən/', meaning_vi: 'sự ghi nhớ, khả năng lưu giữ', context_sentence: 'Active recall improves long-term retention.' },
      { word: 'passive', pos: 'adj', phonetic: '/ˈpæs.ɪv/', meaning_vi: 'thụ động', context_sentence: 'Passive rereading is less effective.' },
      { word: 'retrieve', pos: 'verb', phonetic: '/rɪˈtriːv/', meaning_vi: 'truy xuất, lấy lại thông tin', context_sentence: 'Your brain retrieves facts from memory.' },
      { word: 'spaced repetition', pos: 'noun', phonetic: '/speɪst ˌrep.əˈtɪʃ.ən/', meaning_vi: 'lặp lại ngắt quãng', context_sentence: 'Spaced repetition prevents rapid forgetting.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'Why is passive highlighting often ineffective?',
        options: ['Because highlighters are expensive', 'Because it creates an illusion of competence without long-term memory', 'Because books get damaged', 'Because scientists dislike pens'],
        answer: 1,
        explain: '"passive reading technique creates an illusion of competence without guaranteeing long-term retention".',
      },
      {
        id: 'q2',
        question: 'How do you practice Active Recall?',
        options: ['Sleep with the book under your pillow', 'Close the book and test yourself with questions', 'Copy the entire textbook ten times', 'Read aloud while watching TV'],
        answer: 1,
        explain: '"close the book and actively test yourself by answering practice questions".',
      },
      {
        id: 'q3',
        question: 'What technique should be paired with Active Recall for best results?',
        options: ['Drinking energy drinks', 'Spaced repetition', 'Cramming the night before', 'Guessing answers'],
        answer: 1,
        explain: '"Pairing Active Recall with spaced repetition—reviewing material right before you are about to forget it".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'strengthens',
          answer: 'strengthens',
          options: ['strengthens', 'destroys', 'erases', 'weakens'],
          explain: '"strengthens neural pathways" (tăng cường các liên kết thần kinh).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Active Recall',
        children: [
          { id: 'c1', label: 'Flaw: Passive rereading gives false confidence' },
          { id: 'c2', label: 'Action: Close book & test your memory' },
          { id: 'c3', label: 'Combine: Spaced repetition for exams' },
        ],
      },
    },
  },

  // =========================================================================
  // 10. SCIENCE (Khoa học tự nhiên)
  // =========================================================================
  {
    slug: 'a1-where-does-rain-come-from',
    title: 'Where Does Rain Come From?',
    cefr_level: 'A1',
    theme_id: 'science',
    word_count: 84,
    estimated_read_minutes: 1,
    difficulty_score: 14,
    source_type: 'voa',
    status: 'published',
    summary: 'Vòng tuần hoàn của nước đơn giản và dễ hiểu: ánh nắng mặt trời làm bốc hơi nước từ biển, ngưng tụ thành mây và rơi xuống thành mưa.',
    translation: 'Bạn có bao giờ tự hỏi mưa từ đâu rơi xuống không? Mọi chuyện bắt đầu từ ánh nắng mặt trời. Khi mặt trời sưởi ấm các con sông và đại dương, nước biến thành hơi nước vô hình và bay lên bầu trời cao. Quá trình này được gọi là sự bay hơi. Ở trên cao, không khí rất lạnh làm cho hơi nước tụ lại thành những giọt nước nhỏ li ti. Hàng triệu giọt nước này tạo thành những đám mây trắng bồng bềnh. Khi các đám mây trở nên quá nặng, các giọt nước rơi xuống mặt đất dưới dạng những hạt mưa mát lành.',
    passage: `Have you ever wondered where rain comes from? It all begins with the warm sun. When the sun shines on oceans and rivers, it warms the water and turns it into invisible vapor. This vapor floats high up into the sky. High above the ground, the air is very cold. The cold temperature turns the vapor back into tiny droplets of liquid water. Millions of these droplets gather together to form fluffy clouds. When clouds become too heavy, gravity pulls the water down as raindrops.`,
    passage_plain: `Have you ever wondered where rain comes from? It all begins with the warm sun. When the sun shines on oceans and rivers, it warms the water and turns it into invisible vapor. This vapor floats high up into the sky. High above the ground, the air is very cold. The cold temperature turns the vapor back into tiny droplets of liquid water. Millions of these droplets gather together to form fluffy clouds. When clouds become too heavy, gravity pulls the water down as raindrops.`,
    vocabulary_highlights: [
      { word: 'vapor', pos: 'noun', phonetic: '/ˈveɪ.pər/', meaning_vi: 'hơi nước', context_sentence: 'Water turns into invisible vapor when heated.' },
      { word: 'droplet', pos: 'noun', phonetic: '/ˈdrɒp.lət/', meaning_vi: 'giọt nước nhỏ li ti', context_sentence: 'Clouds are made of tiny water droplets.' },
      { word: 'gravity', pos: 'noun', phonetic: '/ˈɡræv.ə.ti/', meaning_vi: 'trọng lực, lực hút trái đất', context_sentence: 'Gravity pulls raindrops toward the ground.' },
      { word: 'fluffy', pos: 'adj', phonetic: '/ˈflʌf.i/', meaning_vi: 'bồng bềnh, xốp mềm', context_sentence: 'White fluffy clouds float in the sky.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'What heats up the water in rivers and oceans?',
        options: ['The moon', 'The warm sun', 'Electric heaters', 'Fire'],
        answer: 1,
        explain: '"When the sun shines on oceans and rivers, it warms the water".',
      },
      {
        id: 'q2',
        question: 'What are fluffy clouds made of?',
        options: ['Cotton candy', 'Smoke from factories', 'Millions of tiny water droplets', 'Dry sand'],
        answer: 2,
        explain: '"Millions of these droplets gather together to form fluffy clouds".',
      },
      {
        id: 'q3',
        question: 'Why does rain fall down to the ground?',
        options: ['Because clouds become too heavy and gravity pulls it', 'Because birds push it', 'Because wind blows it sideways', 'Because fish jump'],
        answer: 0,
        explain: '"When clouds become too heavy, gravity pulls the water down as raindrops".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'vapor',
          answer: 'vapor',
          options: ['vapor', 'ice', 'wood', 'metal'],
          explain: '"turns it into invisible vapor" (biến thành hơi nước vô hình).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Water Cycle',
        children: [
          { id: 'c1', label: 'Evaporation: Sun warms water into vapor' },
          { id: 'c2', label: 'Condensation: Cold air forms cloud droplets' },
          { id: 'c3', label: 'Precipitation: Gravity pulls rain down' },
        ],
      },
    },
  },
  {
    slug: 'a2-how-honeybees-communicate',
    title: 'The Waggle Dance: How Honeybees Talk',
    cefr_level: 'A2',
    theme_id: 'science',
    word_count: 145,
    estimated_read_minutes: 2,
    difficulty_score: 30,
    source_type: 'voa',
    status: 'published',
    summary: 'Khám phá bí mật về "điệu múa lắc" (waggle dance) của loài ong mật: cách chúng truyền đạt phương hướng và khoảng cách đến nguồn hoa mật ngọt.',
    translation: 'Ong mật là một trong những loài côn trùng có tính xã hội cao và thông minh nhất trên hành tinh của chúng ta. Khi một chú ong thợ tìm thấy một cánh đồng hoa có nhiều mật ngọt, nó không giữ bí mật cho riêng mình. Thay vào đó, nó bay về tổ để thông báo cho các bạn ong khác. Vì ong không thể nói bằng lời, chúng giao tiếp thông qua một chuỗi chuyển động cơ thể đặc biệt gọi là "điệu múa lắc" (waggle dance). Bằng cách lắc bụng và chạy theo hình số tám trên sáp tổ ong, chú ong biểu diễn chính xác góc của bông hoa so với vị trí mặt trời. Thời gian chú ong lắc người cũng chỉ ra khoảng cách chính xác cần bay. Nhờ ngôn ngữ kỳ diệu này, toàn bộ đàn ong có thể tìm thấy nguồn thức ăn một cách nhanh chóng.',
    passage: `Honeybees are remarkably sophisticated social insects capable of intricate communication without using sound. When a foraging scout bee discovers a rich meadow filled with blossoming flowers, she does not keep the location a secret. Instead, she returns to the dark beehive to share the discovery with her hive mates. Since bees cannot speak words, they communicate using an ingenious movement pattern famously known as the "waggle dance." By vibrating her abdomen and moving in a distinct figure-eight pattern on the honeycomb, the dancing bee reveals the precise angle of the food source relative to the sun. Furthermore, the duration of the waggle indicates the exact distance to the flowers. This astonishing visual language allows the entire colony to locate vital nectar sources with pinpoint accuracy.`,
    passage_plain: `Honeybees are remarkably sophisticated social insects capable of intricate communication without using sound. When a foraging scout bee discovers a rich meadow filled with blossoming flowers, she does not keep the location a secret. Instead, she returns to the dark beehive to share the discovery with her hive mates. Since bees cannot speak words, they communicate using an ingenious movement pattern famously known as the "waggle dance." By vibrating her abdomen and moving in a distinct figure-eight pattern on the honeycomb, the dancing bee reveals the precise angle of the food source relative to the sun. Furthermore, the duration of the waggle indicates the exact distance to the flowers. This astonishing visual language allows the entire colony to locate vital nectar sources with pinpoint accuracy.`,
    vocabulary_highlights: [
      { word: 'sophisticated', pos: 'adj', phonetic: '/səˈfɪs.tɪ.keɪ.tɪd/', meaning_vi: 'tinh vi, thông minh, phức tạp', context_sentence: 'Honeybees have a sophisticated society.' },
      { word: 'abdomen', pos: 'noun', phonetic: '/ˈæb.də.mən/', meaning_vi: 'phần bụng của côn trùng', context_sentence: 'The bee vibrates its abdomen during the dance.' },
      { word: 'nectar', pos: 'noun', phonetic: '/ˈnek.tər/', meaning_vi: 'mật hoa', context_sentence: 'Bees gather sweet nectar to make honey.' },
      { word: 'accuracy', pos: 'noun', phonetic: '/ˈæk.jə.rə.si/', meaning_vi: 'độ chính xác', context_sentence: 'They find the flowers with pinpoint accuracy.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'What is the special movement pattern of honeybees called?',
        options: ['The buzzing song', 'The waggle dance', 'The honey march', 'The wing beat'],
        answer: 1,
        explain: '"ingenious movement pattern famously known as the "waggle dance"".',
      },
      {
        id: 'q2',
        question: 'What information does the angle of the dance provide?',
        options: ['The age of the queen bee', 'The direction of the food relative to the sun', 'The temperature inside the hive', 'The color of the sky'],
        answer: 1,
        explain: '"the dancing bee reveals the precise angle of the food source relative to the sun".',
      },
      {
        id: 'q3',
        question: 'What does the duration of the waggle dance indicate?',
        options: ['The distance to the flowers', 'The amount of rain coming', 'The weight of the bee', 'The size of the hive'],
        answer: 0,
        explain: '"the duration of the waggle indicates the exact distance to the flowers".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'communicate',
          answer: 'communicate',
          options: ['communicate', 'quarrel', 'sleep', 'destroy'],
          explain: '"communicate using an ingenious movement pattern" (giao tiếp bằng cách di chuyển khéo léo).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Bee Waggle Dance',
        children: [
          { id: 'c1', label: 'Figure-eight: Direction relative to sun' },
          { id: 'c2', label: 'Duration: Exact distance to nectar' },
          { id: 'c3', label: 'Benefit: Entire colony finds flowers fast' },
        ],
      },
    },
  },

  // =========================================================================
  // 11. TECHNOLOGY & DIGITAL LIFE (Công nghệ)
  // =========================================================================
  {
    slug: 'a1-how-i-use-my-smartphone-to-learn',
    title: 'Learning English on My Smartphone',
    cefr_level: 'A1',
    theme_id: 'technology',
    word_count: 85,
    estimated_read_minutes: 1,
    difficulty_score: 14,
    source_type: 'voa',
    status: 'published',
    summary: 'Cách biến chiếc điện thoại thông minh thành gia sư tiếng Anh tiện lợi: học từ mới mỗi ngày, nghe phát âm và làm bài tập trắc nghiệm.',
    translation: 'Điện thoại thông minh của tôi là một công cụ học tập tuyệt vời. Mỗi ngày, tôi dành ba mươi phút để học tiếng Anh trên điện thoại. Tôi sử dụng một ứng dụng flashcard hữu ích để ghi nhớ các từ vựng mới. Khi chạm vào một từ trên màn hình, ứng dụng sẽ phát âm to và rõ ràng bằng giọng người bản xứ. Tôi cũng xem các video hoạt hình ngắn có phụ đề tiếng Anh. Thay vì chỉ chơi trò chơi, việc sử dụng các ứng dụng học tập giúp tôi tiến bộ rất nhanh mỗi tuần.',
    passage: `My smartphone is an incredible study assistant. Every day, I spend thirty minutes practicing English right on my mobile device. I use a helpful flashcard app to memorize new words. Whenever I tap a word on the glowing screen, the speaker pronounces it clearly with a natural British accent. I also watch short animated stories with English subtitles to train my listening skills. Instead of just playing mobile video games, using educational apps helps me improve my vocabulary every single week.`,
    passage_plain: `My smartphone is an incredible study assistant. Every day, I spend thirty minutes practicing English right on my mobile device. I use a helpful flashcard app to memorize new words. Whenever I tap a word on the glowing screen, the speaker pronounces it clearly with a natural British accent. I also watch short animated stories with English subtitles to train my listening skills. Instead of just playing mobile video games, using educational apps helps me improve my vocabulary every single week.`,
    vocabulary_highlights: [
      { word: 'assistant', pos: 'noun', phonetic: '/əˈsɪs.tənt/', meaning_vi: 'người trợ lý, trợ thủ', context_sentence: 'My smartphone is a great study assistant.' },
      { word: 'pronounce', pos: 'verb', phonetic: '/prəˈnaʊns/', meaning_vi: 'phát âm', context_sentence: 'Tap the audio button to pronounce the word.' },
      { word: 'subtitle', pos: 'noun', phonetic: '/ˈsʌbˌtaɪ.təl/', meaning_vi: 'phụ đề', context_sentence: 'Watching videos with subtitles improves listening.' },
      { word: 'educational', pos: 'adj', phonetic: '/ˌedʒ.ʊˈkeɪ.ʃən.əl/', meaning_vi: 'mang tính giáo dục', context_sentence: 'Educational games are great for children.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'How much time does the author spend studying on their phone daily?',
        options: ['Ten hours', 'Thirty minutes', 'Two minutes', 'Never'],
        answer: 1,
        explain: '"Every day, I spend thirty minutes practicing English right on my mobile device".',
      },
      {
        id: 'q2',
        question: 'What happens when the author taps a word on the screen?',
        options: ['The phone shuts down', 'The speaker pronounces it clearly', 'A song starts playing', 'Nothing happens'],
        answer: 1,
        explain: '"Whenever I tap a word on the glowing screen, the speaker pronounces it clearly".',
      },
      {
        id: 'q3',
        question: 'Why does the author watch animated videos with subtitles?',
        options: ['To train listening skills', 'To play games', 'To sleep faster', 'To draw pictures'],
        answer: 0,
        explain: '"watch short animated stories with English subtitles to train my listening skills".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'practicing',
          answer: 'practicing',
          options: ['practicing', 'deleting', 'throwing', 'breaking'],
          explain: '"practicing English" (luyện tập tiếng Anh).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Phone Learning',
        children: [
          { id: 'c1', label: 'Time: 30 minutes daily' },
          { id: 'c2', label: 'Features: Flashcards & audio pronunciation' },
          { id: 'c3', label: 'Media: Short cartoons with subtitles' },
        ],
      },
    },
  },
  {
    slug: 'a2-rise-of-smart-home-devices',
    title: 'How Smart Home Technology is Changing Daily Life',
    cefr_level: 'A2',
    theme_id: 'technology',
    word_count: 143,
    estimated_read_minutes: 2,
    difficulty_score: 29,
    source_type: 'voa',
    status: 'published',
    summary: 'Công nghệ nhà thông minh hiện đại: điều khiển đèn bằng giọng nói, robot hút bụi tự động và camera an ninh giúp cuộc sống tiện nghi, an toàn hơn.',
    translation: 'Trong những năm gần đây, các thiết bị nhà thông minh đã trở nên phổ biến và có giá cả phải chăng cho nhiều gia đình. Ngày nay, bạn có thể điều khiển hầu hết các thiết bị điện trong nhà chỉ bằng giọng nói hoặc vài thao tác trên điện thoại. Ví dụ, bóng đèn thông minh có thể tự động đổi màu và mờ dần khi bạn chuẩn bị đi ngủ. Các robot hút bụi thông minh tự động quét dọn và lau sàn khi bạn đang ở nơi làm việc, sau đó tự quay về trạm sạc pin. Hơn nữa, camera an ninh và chuông cửa thông minh gửi cảnh báo ngay lập tức nếu phát hiện chuyển động bất thường. Mặc dù công nghệ mang lại sự tiện nghi vượt bậc, các chuyên gia vẫn nhắc nhở người dùng bảo mật mật khẩu mạng Wi-Fi để bảo vệ quyền riêng tư.',
    passage: `In recent years, smart home technology has evolved from a futuristic luxury into an accessible reality for everyday households. Today, interconnected smart devices allow homeowners to automate and monitor their living spaces using simple voice commands or smartphone applications. For example, intelligent LED light bulbs can automatically dim at sunset and switch off when rooms become vacant, saving both electricity and money. Robotic vacuum cleaners navigate floor plans autonomously, clearing dust and pet hair before returning to their docking stations to recharge. Furthermore, smart doorbells equipped with high-definition cameras send instant notifications to your phone whenever visitors arrive. While these innovative gadgets offer unmatched convenience and security, cybersecurity experts caution homeowners to secure their wireless home networks with strong passwords to protect personal privacy.`,
    passage_plain: `In recent years, smart home technology has evolved from a futuristic luxury into an accessible reality for everyday households. Today, interconnected smart devices allow homeowners to automate and monitor their living spaces using simple voice commands or smartphone applications. For example, intelligent LED light bulbs can automatically dim at sunset and switch off when rooms become vacant, saving both electricity and money. Robotic vacuum cleaners navigate floor plans autonomously, clearing dust and pet hair before returning to their docking stations to recharge. Furthermore, smart doorbells equipped with high-definition cameras send instant notifications to your phone whenever visitors arrive. While these innovative gadgets offer unmatched convenience and security, cybersecurity experts caution homeowners to secure their wireless home networks with strong passwords to protect personal privacy.`,
    vocabulary_highlights: [
      { word: 'interconnected', pos: 'adj', phonetic: '/ˌɪn.tə.kəˈnek.tɪd/', meaning_vi: 'kết nối liên thông với nhau', context_sentence: 'Smart devices are interconnected via Wi-Fi.' },
      { word: 'autonomously', pos: 'adv', phonetic: '/ɔːˈtɒn.ə.məs.li/', meaning_vi: 'tự động, tự chủ', context_sentence: 'The robot cleans the floor autonomously.' },
      { word: 'convenience', pos: 'noun', phonetic: '/kənˈviː.ni.əns/', meaning_vi: 'sự tiện lợi, thuận tiện', context_sentence: 'Modern gadgets offer immense convenience.' },
      { word: 'cybersecurity', pos: 'noun', phonetic: '/ˈsaɪ.bə.sɪˌkjʊə.rə.ti/', meaning_vi: 'an ninh mạng', context_sentence: 'Cybersecurity is vital for smart homes.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'How do intelligent LED light bulbs help save electricity?',
        options: ['By shining brighter in the dark', 'By dimming at sunset and switching off when rooms are vacant', 'By changing into red color', 'By playing loud music'],
        answer: 1,
        explain: '"dim at sunset and switch off when rooms become vacant, saving both electricity and money".',
      },
      {
        id: 'q2',
        question: 'What does a robotic vacuum cleaner do after cleaning?',
        options: ['It jumps out the window', 'It returns to its docking station to recharge', 'It sings a song', 'It turns into a camera'],
        answer: 1,
        explain: '"returning to their docking stations to recharge".',
      },
      {
        id: 'q3',
        question: 'What warning do cybersecurity experts give to homeowners?',
        options: ['Never buy appliances', 'Secure wireless home networks with strong passwords', 'Throw away smartphones', 'Paint cameras black'],
        answer: 1,
        explain: '"secure their wireless home networks with strong passwords to protect personal privacy".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'security',
          answer: 'security',
          options: ['security', 'danger', 'hunger', 'dirt'],
          explain: '"unmatched convenience and security" (tiện nghi và an ninh vượt trội).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Smart Homes',
        children: [
          { id: 'c1', label: 'Lighting: Dims automatically to save power' },
          { id: 'c2', label: 'Cleaning: Robotic vacuum cleans autonomously' },
          { id: 'c3', label: 'Security: Doorbells + strong Wi-Fi passwords' },
        ],
      },
    },
  },

  // =========================================================================
  // 12. ENVIRONMENT & CONSERVATION (Môi trường)
  // =========================================================================
  {
    slug: 'a1-saying-no-to-plastic-bags',
    title: 'Saying No to Single-Use Plastic Bags',
    cefr_level: 'A1',
    theme_id: 'environment',
    word_count: 86,
    estimated_read_minutes: 1,
    difficulty_score: 14,
    source_type: 'voa',
    status: 'published',
    summary: 'Hành động nhỏ bảo vệ môi trường: mang theo túi vải đi chợ thay vì túi nilon, giảm rác thải nhựa và bảo vệ các sinh vật biển.',
    translation: 'Túi nilon dùng một lần gây hại rất lớn cho môi trường tự nhiên. Chúng ta thường chỉ sử dụng một chiếc túi nilon trong mười phút, nhưng nó mất hàng trăm năm để phân hủy trong đất. Hàng triệu túi nhựa trôi ra biển và làm các loài rùa biển và cá voi bị tổn thương. Để giúp đỡ Trái đất, tôi luôn mang theo một chiếc túi vải khi đi chợ hoặc mua sách. Chiếc túi vải rất bền, đẹp và có thể giặt sạch để dùng lại nhiều lần. Hãy từ chối túi nilon ngay hôm nay!',
    passage: `Single-use plastic bags cause severe damage to our natural environment. People often use a plastic bag for just ten minutes, but it takes hundreds of years to break down in the soil. Millions of plastic bags end up in the ocean, where sea turtles mistakenly eat them and get sick. To protect our planet, I always carry a reusable tote bag whenever I go shopping. A cloth bag is durable, fashionable, and easy to wash. Small daily habits create a greener Earth.`,
    passage_plain: `Single-use plastic bags cause severe damage to our natural environment. People often use a plastic bag for just ten minutes, but it takes hundreds of years to break down in the soil. Millions of plastic bags end up in the ocean, where sea turtles mistakenly eat them and get sick. To protect our planet, I always carry a reusable tote bag whenever I go shopping. A cloth bag is durable, fashionable, and easy to wash. Small daily habits create a greener Earth.`,
    vocabulary_highlights: [
      { word: 'damage', pos: 'noun/verb', phonetic: '/ˈdæm.ɪdʒ/', meaning_vi: 'sự tàn phá, gây hại', context_sentence: 'Plastic waste causes damage to nature.' },
      { word: 'break down', pos: 'phrasal verb', phonetic: '/breɪk daʊn/', meaning_vi: 'phân hủy tự nhiên', context_sentence: 'Plastic takes centuries to break down.' },
      { word: 'durable', pos: 'adj', phonetic: '/ˈdʒʊə.rə.bəl/', meaning_vi: 'bền bỉ, dùng được lâu', context_sentence: 'Canvas bags are strong and durable.' },
      { word: 'mistakenly', pos: 'adv', phonetic: '/mɪˈsteɪ.kən.li/', meaning_vi: 'nhầm lẫn, do sơ ý', context_sentence: 'Turtles mistakenly eat plastic bags.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'How long does a plastic bag take to break down in the soil?',
        options: ['Two days', 'Hundreds of years', 'One minute', 'It never degrades'],
        answer: 1,
        explain: '"it takes hundreds of years to break down in the soil".',
      },
      {
        id: 'q2',
        question: 'What happens to plastic bags that enter the ocean?',
        options: ['They turn into coral', 'Sea turtles mistakenly eat them and get sick', 'They clean the water', 'They help fish swim'],
        answer: 1,
        explain: '"sea turtles mistakenly eat them and get sick".',
      },
      {
        id: 'q3',
        question: 'What does the author carry when going shopping?',
        options: ['A paper box', 'A reusable tote bag', 'A heavy iron cage', 'Nothing'],
        answer: 1,
        explain: '"I always carry a reusable tote bag whenever I go shopping".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'protect',
          answer: 'protect',
          options: ['protect', 'pollute', 'ignore', 'burn'],
          explain: '"To protect our planet" (Để bảo vệ hành tinh của chúng ta).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'No Plastic Bags',
        children: [
          { id: 'c1', label: 'Problem: Takes 100s of years to break down' },
          { id: 'c2', label: 'Harm: Ocean turtles eat plastic & fall sick' },
          { id: 'c3', label: 'Solution: Carry durable reusable tote bags' },
        ],
      },
    },
  },
  {
    slug: 'a2-how-reforestation-saves-biodiversity',
    title: 'Community Tree Planting and Reforestation',
    cefr_level: 'A2',
    theme_id: 'environment',
    word_count: 145,
    estimated_read_minutes: 2,
    difficulty_score: 29,
    source_type: 'voa',
    status: 'published',
    summary: 'Sức mạnh của việc trồng cây phục hồi rừng: chống xói mòn đất, hấp thụ khí carbon và mang lại môi trường sống cho các loài chim thú hoang dã.',
    translation: 'Nạn phá rừng là một trong những mối đe dọa sinh thái lớn nhất mà hành tinh chúng ta đang phải đối mặt. Khi cây cối bị đốn hạ để lấy đất nông nghiệp hoặc xây dựng đô thị, đất đai sẽ nhanh chóng bị xói mòn và các loài động vật mất đi mái nhà tự nhiên. Để chống lại cuộc khủng hoảng này, phong trào tái trồng rừng cộng đồng đang diễn ra mạnh mẽ trên khắp thế giới. Vào mỗi mùa mưa, hàng ngàn người dân địa phương và các tình nguyện viên trẻ tuổi cùng nhau gieo trồng cây giống bản địa trên các sườn đồi trống. Rễ cây giữ chặt lớp đất mặt, ngăn ngừa sạt lở đất nguy hiểm khi bão lớn. Cây xanh cũng hấp thụ carbon dioxide và tạo ra oxy sạch. Khi rừng hồi sinh, các loài chim quý hiếm và khỉ hoang dã đã bắt đầu quay trở lại sinh sống.',
    passage: `Deforestation represents one of the most pressing environmental crises of our modern era. When ancient forests are cleared for agricultural expansion or commercial development, fertile topsoil erodes quickly and countless wildlife species lose their native habitats. To reverse this devastating trend, community reforestation initiatives have gained immense momentum worldwide. During the rainy season, local residents, park rangers, and youth volunteers unite to plant thousands of indigenous tree saplings across barren hillsides. Deep tree roots anchor the fragile soil firmly, preventing destructive landslides and flash floods during intense monsoon storms. Moreover, growing trees absorb substantial amounts of carbon dioxide from the atmosphere, generating clean oxygen for all living organisms. Within just a few years, regenerated forests welcome back colorful songbirds, native monkeys, and beneficial pollinators.`,
    passage_plain: `Deforestation represents one of the most pressing environmental crises of our modern era. When ancient forests are cleared for agricultural expansion or commercial development, fertile topsoil erodes quickly and countless wildlife species lose their native habitats. To reverse this devastating trend, community reforestation initiatives have gained immense momentum worldwide. During the rainy season, local residents, park rangers, and youth volunteers unite to plant thousands of indigenous tree saplings across barren hillsides. Deep tree roots anchor the fragile soil firmly, preventing destructive landslides and flash floods during intense monsoon storms. Moreover, growing trees absorb substantial amounts of carbon dioxide from the atmosphere, generating clean oxygen for all living organisms. Within just a few years, regenerated forests welcome back colorful songbirds, native monkeys, and beneficial pollinators.`,
    vocabulary_highlights: [
      { word: 'deforestation', pos: 'noun', phonetic: '/diːˌfɒr.ɪˈsteɪ.ʃən/', meaning_vi: 'nạn phá rừng', context_sentence: 'Deforestation causes severe soil erosion.' },
      { word: 'reforestation', pos: 'noun', phonetic: '/riːˌfɒr.ɪˈsteɪ.ʃən/', meaning_vi: 'sự tái trồng rừng', context_sentence: 'Community reforestation restores biodiversity.' },
      { word: 'sapling', pos: 'noun', phonetic: '/ˈsæp.lɪŋ/', meaning_vi: 'cây giống nhỏ, cây con', context_sentence: 'Volunteers planted pine saplings on the hill.' },
      { word: 'landslide', pos: 'noun', phonetic: '/ˈlænd.slaɪd/', meaning_vi: 'sạt lở đất', context_sentence: 'Strong tree roots prevent deadly landslides.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'What happens when forests are cleared?',
        options: ['Soil becomes richer', 'Topsoil erodes and wildlife loses habitats', 'Rivers turn into gold', 'Air becomes cooler'],
        answer: 1,
        explain: '"fertile topsoil erodes quickly and countless wildlife species lose their native habitats".',
      },
      {
        id: 'q2',
        question: 'How do deep tree roots protect hillsides during storms?',
        options: ['They make lightning strikes', 'They anchor soil firmly to prevent landslides and floods', 'They create mud', 'They block all water'],
        answer: 1,
        explain: '"Deep tree roots anchor the fragile soil firmly, preventing destructive landslides and flash floods".',
      },
      {
        id: 'q3',
        question: 'What returns to the forests within a few years of regeneration?',
        options: ['Bulldozers', 'Songbirds, monkeys, and pollinators', 'Factories', 'Plastic trash'],
        answer: 1,
        explain: '"regenerated forests welcome back colorful songbirds, native monkeys, and beneficial pollinators".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'saplings',
          answer: 'saplings',
          options: ['saplings', 'boulders', 'cars', 'towers'],
          explain: '"plant thousands of indigenous tree saplings" (trồng hàng ngàn cây giống bản địa).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Reforestation Efforts',
        children: [
          { id: 'c1', label: 'Crisis: Soil erosion & habitat loss from deforestation' },
          { id: 'c2', label: 'Action: Planting indigenous saplings on hills' },
          { id: 'c3', label: 'Benefits: Landslide prevention, carbon absorption, wildlife returns' },
        ],
      },
    },
  },

  // =========================================================================
  // 13. WORK & CAREER (Công việc & nghề nghiệp)
  // =========================================================================
  {
    slug: 'a1-a-day-in-the-life-of-a-barista',
    title: 'A Day as a Coffee Shop Barista',
    cefr_level: 'A1',
    theme_id: 'work-career',
    word_count: 85,
    estimated_read_minutes: 1,
    difficulty_score: 14,
    source_type: 'voa',
    status: 'published',
    summary: 'Một ngày làm việc vui vẻ của nhân viên pha chế cà phê: chào đón khách, pha chế cà phê espresso thơm phức và vẽ bọt sữa nghệ thuật.',
    translation: 'Tôi làm việc như một nhân viên pha chế cà phê tại một quán nhỏ ấm cúng. Ca làm việc của tôi bắt đầu lúc bảy giờ sáng. Đầu tiên, tôi bật máy pha cà phê và kiểm tra các hạt cà phê tươi. Khi khách hàng bước vào, tôi luôn mỉm cười và chào hỏi họ thân thiện. Tôi thích pha chế các ly latte nóng với những hình vẽ trái tim xinh đẹp bằng bọt sữa trắng. Khách hàng cảm thấy rất vui khi nhận được cốc cà phê đẹp mắt. Mặc dù phải đứng cả ngày khá mệt, nụ cười của khách hàng luôn khiến tôi hạnh phúc.',
    passage: `I work as a part-time barista at a cozy neighborhood coffee shop. My morning shift begins early at seven o'clock. First, I turn on the shiny espresso machine and check the roasted coffee beans. When customers walk in, I greet them warmly with a bright smile. I love creating latte art, pouring steamed milk into cups to make delicate white hearts. Customers always smile when they receive a beautifully decorated beverage. Although standing on my feet all day is tiring, serving good coffee brings me joy.`,
    passage_plain: `I work as a part-time barista at a cozy neighborhood coffee shop. My morning shift begins early at seven o'clock. First, I turn on the shiny espresso machine and check the roasted coffee beans. When customers walk in, I greet them warmly with a bright smile. I love creating latte art, pouring steamed milk into cups to make delicate white hearts. Customers always smile when they receive a beautifully decorated beverage. Although standing on my feet all day is tiring, serving good coffee brings me joy.`,
    vocabulary_highlights: [
      { word: 'barista', pos: 'noun', phonetic: '/bəˈriː.stə/', meaning_vi: 'nhân viên pha chế cà phê', context_sentence: 'She works as a skilled barista in the cafe.' },
      { word: 'shift', pos: 'noun', phonetic: '/ʃɪft/', meaning_vi: 'ca làm việc', context_sentence: 'My morning shift starts at seven.' },
      { word: 'beverage', pos: 'noun', phonetic: '/ˈbev.ər.ɪdʒ/', meaning_vi: 'đồ uống', context_sentence: 'Coffee and tea are popular beverages.' },
      { word: 'customer', pos: 'noun', phonetic: '/ˈkʌs.tə.mər/', meaning_vi: 'khách hàng', context_sentence: 'Greet every customer with a smile.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'What job does the author do?',
        options: ['Dentist', 'Taxi driver', 'Coffee shop barista', 'Astronaut'],
        answer: 2,
        explain: '"I work as a part-time barista at a cozy neighborhood coffee shop".',
      },
      {
        id: 'q2',
        question: 'What pattern does the author like making in latte cups?',
        options: ['White hearts with steamed milk', 'Dark spiders', 'Square boxes', 'Numbers'],
        answer: 0,
        explain: '"pouring steamed milk into cups to make delicate white hearts".',
      },
      {
        id: 'q3',
        question: 'What is the tiring part of the job?',
        options: ['Drinking coffee', 'Standing on feet all day', 'Talking to the boss', 'Going to bed early'],
        answer: 1,
        explain: '"Although standing on my feet all day is tiring, serving good coffee brings me joy".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'beans',
          answer: 'beans',
          options: ['beans', 'shoes', 'rocks', 'coins'],
          explain: '"roasted coffee beans" (hạt cà phê rang).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Barista Life',
        children: [
          { id: 'c1', label: 'Shift: 7:00 AM start, espresso prep' },
          { id: 'c2', label: 'Skill: Latte art with steamed milk hearts' },
          { id: 'c3', label: 'Reward: Customer smiles bring satisfaction' },
        ],
      },
    },
  },
  {
    slug: 'a2-ace-your-first-job-interview',
    title: 'How to Prepare for Your First Job Interview',
    cefr_level: 'A2',
    theme_id: 'work-career',
    word_count: 144,
    estimated_read_minutes: 2,
    difficulty_score: 29,
    source_type: 'voa',
    status: 'published',
    summary: 'Bí quyết phỏng vấn xin việc thành công cho sinh viên mới ra trường: nghiên cứu công ty trước, trang phục lịch thiệp, tự tin và chuẩn bị câu hỏi hỏi lại người tuyển dụng.',
    translation: 'Tham gia buổi phỏng vấn xin việc đầu tiên có thể khiến bạn cảm thấy vô cùng lo lắng, nhưng sự chuẩn bị chu đáo sẽ giúp bạn tự tin hơn rất nhiều. Trước ngày phỏng vấn, hãy dành thời gian nghiên cứu kỹ trang web của công ty để hiểu rõ sứ mệnh, sản phẩm và văn hóa của họ. Người tuyển dụng luôn đánh giá cao những ứng viên đã tìm hiểu kỹ về doanh nghiệp của họ. Hãy chọn trang phục công sở gọn gàng, lịch sự và đến sớm hơn giờ hẹn mười lăm phút. Trong suốt cuộc trò chuyện, hãy duy trì giao tiếp bằng mắt và lắng nghe cẩn thận từng câu hỏi trước khi trả lời rõ ràng. Cuối buổi phỏng vấn, hãy chuẩn bị một hoặc hai câu hỏi sâu sắc để hỏi người phỏng vấn. Điều đó thể hiện niềm đam mê thực sự của bạn đối với vị trí ứng tuyển.',
    passage: `Attending your very first formal job interview is naturally intimidating, but thorough preparation is the key to transforming nervous energy into quiet confidence. Before the interview date, dedicate time to thoroughly researching the hiring company. Explore their official website, read their recent press releases, and familiarize yourself with their core products and organizational culture. Interviewers consistently appreciate candidates who demonstrate genuine interest in the enterprise. Choose professional, well-ironed business attire and aim to arrive at the venue approximately fifteen minutes early. During the interview, maintain steady eye contact, offer a polite smile, and listen attentively before articulating your answers. Finally, always prepare two thoughtful questions to ask the interviewer about team collaboration or training programs. Asking questions demonstrates proactive enthusiasm and leaves an enduring impression.`,
    passage_plain: `Attending your very first formal job interview is naturally intimidating, but thorough preparation is the key to transforming nervous energy into quiet confidence. Before the interview date, dedicate time to thoroughly researching the hiring company. Explore their official website, read their recent press releases, and familiarize yourself with their core products and organizational culture. Interviewers consistently appreciate candidates who demonstrate genuine interest in the enterprise. Choose professional, well-ironed business attire and aim to arrive at the venue approximately fifteen minutes early. During the interview, maintain steady eye contact, offer a polite smile, and listen attentively before articulating your answers. Finally, always prepare two thoughtful questions to ask the interviewer about team collaboration or training programs. Asking questions demonstrates proactive enthusiasm and leaves an enduring impression.`,
    vocabulary_highlights: [
      { word: 'preparation', pos: 'noun', phonetic: '/ˌprep.ərˈeɪ.ʃən/', meaning_vi: 'sự chuẩn bị chu đáo', context_sentence: 'Preparation builds confidence for interviews.' },
      { word: 'attire', pos: 'noun', phonetic: '/əˈtaɪər/', meaning_vi: 'trang phục', context_sentence: 'Wear professional business attire.' },
      { word: 'articulate', pos: 'verb', phonetic: '/ɑːˈtɪk.jə.leɪt/', meaning_vi: 'diễn đạt rõ ràng, rành mạch', context_sentence: 'Articulate your ideas with clarity.' },
      { word: 'enthusiasm', pos: 'noun', phonetic: '/ɪnˈθjuː.zi.æz.əm/', meaning_vi: 'sự nhiệt huyết, hăng hái', context_sentence: 'Asking questions shows genuine enthusiasm.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'What should a candidate do before the interview date?',
        options: ['Sleep until noon', 'Research the hiring company and their products', 'Call friends to complain', 'Delete their resume'],
        answer: 1,
        explain: '"dedicate time to thoroughly researching the hiring company. Explore their official website...".',
      },
      {
        id: 'q2',
        question: 'How early should candidates aim to arrive at the venue?',
        options: ['2 hours late', 'Approximately fifteen minutes early', 'Right as the door locks', 'The next morning'],
        answer: 1,
        explain: '"aim to arrive at the venue approximately fifteen minutes early".',
      },
      {
        id: 'q3',
        question: 'Why should you prepare thoughtful questions to ask the interviewer?',
        options: ['To waste their time', 'To demonstrate proactive enthusiasm and interest', 'To prove the interviewer is wrong', 'To ask for free lunch'],
        answer: 1,
        explain: '"Asking questions demonstrates proactive enthusiasm and leaves an enduring impression".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'preparation',
          answer: 'preparation',
          options: ['preparation', 'hesitation', 'destruction', 'complaint'],
          explain: '"thorough preparation is the key" (sự chuẩn bị chu đáo là chìa khóa).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Job Interview Prep',
        children: [
          { id: 'c1', label: 'Before: Company research & professional attire' },
          { id: 'c2', label: 'During: Eye contact, arrive 15m early, articulate answers' },
          { id: 'c3', label: 'End: Ask thoughtful questions to show enthusiasm' },
        ],
      },
    },
  },

  // =========================================================================
  // 14. MEDIA & ENTERTAINMENT (Giải trí & truyền thông)
  // =========================================================================
  {
    slug: 'a1-my-favorite-animated-movie',
    title: 'Watching Animated Movies with Family',
    cefr_level: 'A1',
    theme_id: 'media-entertainment',
    word_count: 84,
    estimated_read_minutes: 1,
    difficulty_score: 14,
    source_type: 'voa',
    status: 'published',
    summary: 'Buổi tối xem phim hoạt hình ấm cúng bên gia đình: cười sảng khoái với những nhân vật đáng yêu và bài học ý nghĩa về tình bạn.',
    translation: 'Vào tối thứ Sáu, gia đình tôi thích quây quần trong phòng khách để xem phim hoạt hình cùng nhau. Mẹ tôi nổ một bát bắp rang bơ thơm phức còn bố tôi bật chiếc tivi màn hình lớn. Chúng tôi thích xem các bộ phim về những con vật biết nói hài hước và các cuộc phiêu lưu kỳ thú. Hình ảnh hoạt hình rất rực rỡ và các bài hát trong phim rất vui nhộn. Những bộ phim này luôn dạy chúng ta những bài học quý giá về lòng tốt và tình bạn. Xem phim giúp gia đình tôi gắn kết hơn.',
    passage: `On Friday evenings, my family loves gathering in the living room to watch animated films together. My mother pops a big bowl of butter popcorn, while my father turns on the television. We adore films about talking animals who go on magical journeys. The animation is vibrant, and the characters have funny voices and cheerful songs. These movies always teach valuable moral lessons about kindness, teamwork, and family love. Sitting together with my loved ones is the happiest part of my week.`,
    passage_plain: `On Friday evenings, my family loves gathering in the living room to watch animated films together. My mother pops a big bowl of butter popcorn, while my father turns on the television. We adore films about talking animals who go on magical journeys. The animation is vibrant, and the characters have funny voices and cheerful songs. These movies always teach valuable moral lessons about kindness, teamwork, and family love. Sitting together with my loved ones is the happiest part of my week.`,
    vocabulary_highlights: [
      { word: 'animated', pos: 'adj', phonetic: '/ˈæn.ɪ.meɪ.tɪd/', meaning_vi: 'thuộc hoạt hình', context_sentence: 'We love watching animated films together.' },
      { word: 'popcorn', pos: 'noun', phonetic: '/ˈpɒp.kɔːn/', meaning_vi: 'bắp rang bơ', context_sentence: 'She made a bowl of warm butter popcorn.' },
      { word: 'vibrant', pos: 'adj', phonetic: '/ˈvaɪ.brənt/', meaning_vi: 'rực rỡ, sống động', context_sentence: 'The colors in the cartoon are vibrant.' },
      { word: 'teamwork', pos: 'noun', phonetic: '/ˈtiːm.wɜːk/', meaning_vi: 'tinh thần đồng đội', context_sentence: 'The movie teaches the value of teamwork.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'When does the family gather to watch movies?',
        options: ['On Monday morning', 'On Friday evenings', 'At 3:00 AM on Wednesday', 'Never'],
        answer: 1,
        explain: '"On Friday evenings, my family loves gathering in the living room".',
      },
      {
        id: 'q2',
        question: 'What snack does the mother make?',
        options: ['Spicy soup', 'Butter popcorn', 'Raw carrots', 'Pizza with fish'],
        answer: 1,
        explain: '"My mother pops a big bowl of butter popcorn".',
      },
      {
        id: 'q3',
        question: 'What do animated movies teach the family?',
        options: ['How to steal cars', 'Moral lessons about kindness and teamwork', 'How to complain', 'Nothing useful'],
        answer: 1,
        explain: '"These movies always teach valuable moral lessons about kindness, teamwork, and family love".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'gathering',
          answer: 'gathering',
          options: ['gathering', 'fighting', 'sleeping', 'running'],
          explain: '"gathering in the living room" (quây quần trong phòng khách).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Movie Night',
        children: [
          { id: 'c1', label: 'Time: Friday evenings with family' },
          { id: 'c2', label: 'Treat: Warm butter popcorn' },
          { id: 'c3', label: 'Theme: Animated films with lessons of kindness' },
        ],
      },
    },
  },
  {
    slug: 'a2-why-podcasts-are-booming',
    title: 'The Growing Popularity of Audio Podcasts',
    cefr_level: 'A2',
    theme_id: 'media-entertainment',
    word_count: 143,
    estimated_read_minutes: 2,
    difficulty_score: 28,
    source_type: 'voa',
    status: 'published',
    summary: 'Sự bùng nổ của podcast âm thanh trong thời đại số: học hỏi kiến thức mới, nghe phỏng vấn chuyên sâu trong khi đi làm hoặc nấu ăn.',
    translation: 'Trong thời đại quá tải màn hình ngày nay, các chương trình phát thanh kỹ thuật số (podcast) đã trở thành một hiện tượng truyền thông toàn cầu. Không giống như các chương trình truyền hình đòi hỏi sự chú ý hoàn toàn của đôi mắt, podcast cho phép người nghe vừa thưởng thức nội dung vừa làm việc nhà, lái xe hoặc tập thể dục. Có hàng triệu tập podcast thuộc mọi chủ đề, từ khoa học vũ trụ, lịch sử cổ đại cho đến các cuộc trò chuyện thân mật về tâm lý học. Nghe podcast bằng tiếng Anh cũng là một trong những phương pháp luyện kỹ năng nghe ngữ điệu và tiếp thu từ vựng thực tế hiệu quả nhất. Với một chiếc tai nghe nhỏ gọn, cả thế giới tri thức luôn nằm trong tầm tay bạn.',
    passage: `In our hyper-visual digital era, audio podcasts have emerged as an extraordinary global media phenomenon. Unlike streaming television shows or social video platforms that demand your undivided visual focus, audio podcasts allow listeners to multitask seamlessly while commuting, exercising, or performing household chores. The diversity of available content is staggering, ranging from deep investigations into astrophysics and ancient history to lighthearted storytelling and practical personal finance tips. For language learners, listening to conversational podcasts provides unparalleled exposure to authentic speech rhythms, natural idioms, and spontaneous dialogues. Simply plugging in a pair of wireless earphones during your morning walk transforms ordinary travel time into an immersive, intellectually stimulating educational adventure.`,
    passage_plain: `In our hyper-visual digital era, audio podcasts have emerged as an extraordinary global media phenomenon. Unlike streaming television shows or social video platforms that demand your undivided visual focus, audio podcasts allow listeners to multitask seamlessly while commuting, exercising, or performing household chores. The diversity of available content is staggering, ranging from deep investigations into astrophysics and ancient history to lighthearted storytelling and practical personal finance tips. For language learners, listening to conversational podcasts provides unparalleled exposure to authentic speech rhythms, natural idioms, and spontaneous dialogues. Simply plugging in a pair of wireless earphones during your morning walk transforms ordinary travel time into an immersive, intellectually stimulating educational adventure.`,
    vocabulary_highlights: [
      { word: 'phenomenon', pos: 'noun', phonetic: '/fəˈnɒm.ɪ.nən/', meaning_vi: 'hiện tượng', context_sentence: 'Podcasts are a global entertainment phenomenon.' },
      { word: 'multitask', pos: 'verb', phonetic: '/ˌmʌl.tiˈtɑːsk/', meaning_vi: 'làm nhiều việc cùng lúc', context_sentence: 'You can multitask while listening to audio.' },
      { word: 'unparalleled', pos: 'adj', phonetic: '/ʌnˈpær.əl.eld/', meaning_vi: 'vô song, không gì sánh bằng', context_sentence: 'Podcasts offer unparalleled exposure to accents.' },
      { word: 'immersive', pos: 'adj', phonetic: '/ɪˈmɜː.sɪv/', meaning_vi: 'đắm chìm, sống động', context_sentence: 'Audio creates an immersive listening experience.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'What is a major advantage of podcasts over television shows?',
        options: ['Podcasts require 5 screens', 'Listeners can multitask while doing chores or commuting', 'Podcasts have no sound', 'Television is completely free'],
        answer: 1,
        explain: '"audio podcasts allow listeners to multitask seamlessly while commuting, exercising, or performing household chores".',
      },
      {
        id: 'q2',
        question: 'How do podcasts help language learners?',
        options: ['By testing their eyesight', 'By exposing them to authentic rhythms, idioms, and natural dialogue', 'By teaching them how to paint', 'By turning off their phone'],
        answer: 1,
        explain: '"listening to conversational podcasts provides unparalleled exposure to authentic speech rhythms, natural idioms".',
      },
      {
        id: 'q3',
        question: 'What equipment is needed to enjoy podcasts on a walk?',
        options: ['A heavy projector', 'A pair of wireless earphones', 'A television set', 'A loud drum'],
        answer: 1,
        explain: '"Simply plugging in a pair of wireless earphones during your morning walk".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'multitask',
          answer: 'multitask',
          options: ['multitask', 'fight', 'shout', 'worry'],
          explain: '"allow listeners to multitask" (cho phép người nghe làm nhiều việc cùng lúc).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Podcasts Boom',
        children: [
          { id: 'c1', label: 'Flexibility: Multitask while commuting & chores' },
          { id: 'c2', label: 'Variety: Science, history, psychology, stories' },
          { id: 'c3', label: 'Learning: Authentic English idioms and rhythms' },
        ],
      },
    },
  },

  // =========================================================================
  // 15. SOCIETY & COMMUNITY (Xã hội & cộng đồng)
  // =========================================================================
  {
    slug: 'a1-riding-the-city-bus-in-hanoi',
    title: 'Taking the Green Bus in Hanoi',
    cefr_level: 'A1',
    theme_id: 'society',
    word_count: 83,
    estimated_read_minutes: 1,
    difficulty_score: 14,
    source_type: 'voa',
    status: 'published',
    summary: 'Trải nghiệm đi xe buýt điện xanh tại Hà Nội: sạch sẽ, bảo vệ môi trường, văn minh nhường ghế cho người lớn tuổi.',
    translation: 'Gần đây, Hà Nội đã có nhiều xe buýt điện màu xanh lá cây hiện đại. Tôi rất thích đi xe buýt điện đến trường mỗi sáng. Xe buýt chạy rất êm và không xả khói bụi độc hại ra đường phố. Bên trong xe luôn có điều hòa mát mẻ và ghế ngồi sạch sẽ. Khi một người già hoặc phụ nữ mang thai bước lên xe, các bạn trẻ luôn đứng dậy nhường ghế lịch sự. Đi xe buýt công cộng giúp giảm bớt ùn tắc giao thông và bảo vệ không khí trong lành cho thủ đô.',
    passage: `Recently, Hanoi introduced modern electric green buses across the city. I love taking this bus to my university every weekday morning. The electric bus is remarkably quiet and produces zero exhaust fumes on crowded streets. Inside, the cabin is air-conditioned, spotless, and comfortable. When elderly passengers or pregnant women board the vehicle, young students politely stand up to offer their seats. Using public transportation is an eco-friendly habit that reduces traffic congestion and keeps our city air clean.`,
    passage_plain: `Recently, Hanoi introduced modern electric green buses across the city. I love taking this bus to my university every weekday morning. The electric bus is remarkably quiet and produces zero exhaust fumes on crowded streets. Inside, the cabin is air-conditioned, spotless, and comfortable. When elderly passengers or pregnant women board the vehicle, young students politely stand up to offer their seats. Using public transportation is an eco-friendly habit that reduces traffic congestion and keeps our city air clean.`,
    vocabulary_highlights: [
      { word: 'electric', pos: 'adj', phonetic: '/iˈlek.trɪk/', meaning_vi: 'chạy bằng điện', context_sentence: 'Electric buses produce zero carbon emissions.' },
      { word: 'fumes', pos: 'noun', phonetic: '/fjuːmz/', meaning_vi: 'khói bụi độc hại', context_sentence: 'Traditional engines emit harmful exhaust fumes.' },
      { word: 'spotless', pos: 'adj', phonetic: '/ˈspɒt.ləs/', meaning_vi: 'sạch bóng, không một tì vết', context_sentence: 'The bus interior was spotless and tidy.' },
      { word: 'congestion', pos: 'noun', phonetic: '/kənˈdʒes.tʃən/', meaning_vi: 'sự ùn tắc giao thông', context_sentence: 'Buses help reduce city traffic congestion.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'What is a key benefit of the electric buses in Hanoi?',
        options: ['They fly over buildings', 'They are quiet and produce zero exhaust fumes', 'They serve free hamburgers', 'They have no drivers'],
        answer: 1,
        explain: '"The electric bus is remarkably quiet and produces zero exhaust fumes".',
      },
      {
        id: 'q2',
        question: 'What do young students politely do when elderly passengers board?',
        options: ['Close their eyes', 'Stand up to offer their seats', 'Tell them to leave', 'Take photos'],
        answer: 1,
        explain: '"When elderly passengers or pregnant women board... young students politely stand up to offer their seats".',
      },
      {
        id: 'q3',
        question: 'How does using public transport help the city?',
        options: ['It causes more traffic jams', 'It reduces congestion and keeps the air clean', 'It makes roads dirtier', 'It stops all rain'],
        answer: 1,
        explain: '"reduces traffic congestion and keeps our city air clean".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'transportation',
          answer: 'transportation',
          options: ['transportation', 'fighting', 'hunting', 'complaining'],
          explain: '"public transportation" (giao thông công cộng).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Electric Bus in Hanoi',
        children: [
          { id: 'c1', label: 'Feature: Quiet and zero exhaust fumes' },
          { id: 'c2', label: 'Culture: Offering seats to elderly passengers' },
          { id: 'c3', label: 'Impact: Cuts traffic jams & clears air' },
        ],
      },
    },
  },
  {
    slug: 'a2-mid-autumn-festival-celebration',
    title: 'The Magic of the Mid-Autumn Festival in Vietnam',
    cefr_level: 'A2',
    theme_id: 'society',
    word_count: 145,
    estimated_read_minutes: 2,
    difficulty_score: 28,
    source_type: 'voa',
    status: 'published',
    summary: 'Văn hóa Tết Trung Thu rộn ràng ở Việt Nam: múa lân sư rồng, đèn ông sao năm cánh, bánh nướng bánh dẻo và khoảnh khắc gia đình sum vầy ngắm trăng tròn.',
    translation: 'Tết Trung Thu là một trong những lễ hội truyền thống được yêu thích nhất ở Việt Nam, đặc biệt là đối với trẻ em. Diễn ra vào ngày rằm tháng Tám âm lịch khi mặt trăng tròn và sáng nhất trong năm, lễ hội kỷ niệm mùa thu hoạch và tình cảm gia đình sum vầy. Trước ngày lễ nhiều tuần, các con phố tràn ngập các gian hàng rực rỡ bán bánh trung thu hình tròn tượng trưng cho sự trọn vẹn. Vào đêm hội, tiếng trống múa lân rộn rã khắp các con hẻm khi những chú lân nhảy múa điêu luyện trước các ngôi nhà để chúc phúc và may mắn. Trẻ em háo hức rước đèn ông sao ngôi sao đỏ lấp lánh và cùng nhau phá cỗ Trung Thu dưới ánh trăng vàng.',
    passage: `The Mid-Autumn Festival, known locally as Tet Trung Thu, is one of the most cherished traditional celebrations in Vietnam, particularly beloved by children. Falling on the fifteenth night of the eighth lunar month, when the full moon shines brightest in the autumn sky, the festival celebrates successful harvests and family reunion. Weeks prior to the celebration, colorful street stalls emerge everywhere, displaying boxes of traditional baked mooncakes symbolizing completeness and unity. On festival night, the pulsating rhythm of lion dance drums echoes through bustling alleys as performers skillfully manipulate lion costumes to bring prosperity and fortune to local households. Excited children parade through the streets carrying illuminated star-shaped lanterns, singing traditional folk songs, and sharing sweet treats beneath the radiant moonlight.`,
    passage_plain: `The Mid-Autumn Festival, known locally as Tet Trung Thu, is one of the most cherished traditional celebrations in Vietnam, particularly beloved by children. Falling on the fifteenth night of the eighth lunar month, when the full moon shines brightest in the autumn sky, the festival celebrates successful harvests and family reunion. Weeks prior to the celebration, colorful street stalls emerge everywhere, displaying boxes of traditional baked mooncakes symbolizing completeness and unity. On festival night, the pulsating rhythm of lion dance drums echoes through bustling alleys as performers skillfully manipulate lion costumes to bring prosperity and fortune to local households. Excited children parade through the streets carrying illuminated star-shaped lanterns, singing traditional folk songs, and sharing sweet treats beneath the radiant moonlight.`,
    vocabulary_highlights: [
      { word: 'cherished', pos: 'adj', phonetic: '/ˈtʃer.ɪʃt/', meaning_vi: 'được yêu quý, trân trọng', context_sentence: 'The festival is a cherished family tradition.' },
      { word: 'reunion', pos: 'noun', phonetic: '/riːˈjuː.njən/', meaning_vi: 'sự đoàn tụ, sum vầy', context_sentence: 'Mid-Autumn celebrates family reunion.' },
      { word: 'prosperity', pos: 'noun', phonetic: '/prɒsˈper.ə.ti/', meaning_vi: 'sự thịnh vượng, phát đạt', context_sentence: 'Lion dances are thought to bring prosperity.' },
      { word: 'parade', pos: 'verb/noun', phonetic: '/pəˈreɪd/', meaning_vi: 'diễu hành, rước đèn', context_sentence: 'Children parade with star-shaped lanterns.' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'When does the Mid-Autumn Festival take place?',
        options: ['On New Year\'s Day', 'On the 15th night of the 8th lunar month', 'In the middle of summer', 'Every Friday'],
        answer: 1,
        explain: '"Falling on the fifteenth night of the eighth lunar month, when the full moon shines brightest".',
      },
      {
        id: 'q2',
        question: 'What do traditional mooncakes symbolize?',
        options: ['War and conflict', 'Completeness and unity', 'Rain and lightning', 'Cold weather'],
        answer: 1,
        explain: '"baked mooncakes symbolizing completeness and unity".',
      },
      {
        id: 'q3',
        question: 'What lanterns do children carry while parading in the street?',
        options: ['Square iron lanterns', 'Illuminated star-shaped lanterns', 'Heavy glass bowls', 'Candles in bottles'],
        answer: 1,
        explain: '"carrying illuminated star-shaped lanterns, singing traditional folk songs".',
      },
    ],
    cloze: {
      blanks: [
        {
          id: 'b1',
          index: 1,
          word: 'reunion',
          answer: 'reunion',
          options: ['reunion', 'argument', 'isolation', 'danger'],
          explain: '"celebrates successful harvests and family reunion" (kỷ niệm vụ mùa bội thu và gia đình sum vầy).',
        },
      ],
    },
    mindmap_data: {
      root: {
        id: 'root',
        label: 'Mid-Autumn Festival',
        children: [
          { id: 'c1', label: 'Timing: 15th night of 8th lunar month (Full Moon)' },
          { id: 'c2', label: 'Food: Mooncakes symbolizing completeness' },
          { id: 'c3', label: 'Fun: Lion dance drums & star-shaped lanterns' },
        ],
      },
    },
  },
];

async function main() {
  console.log('===========================================================');
  console.log('   INGESTING CURATED A1 & A2 READING CORPUS INTO SUPABASE  ');
  console.log('===========================================================\n');

  console.log(`Corpus contains ${A1_A2_ARTICLES.length} rich A1 & A2 articles.`);

  const levelStats: Record<string, number> = {};
  const themeStats: Record<string, number> = {};

  for (const art of A1_A2_ARTICLES) {
    levelStats[art.cefr_level] = (levelStats[art.cefr_level] || 0) + 1;
    themeStats[art.theme_id] = (themeStats[art.theme_id] || 0) + 1;
  }

  console.log('By CEFR Level:', levelStats);
  console.log('By Theme:', themeStats);

  if (dryRun) {
    console.log('\n[DRY RUN] Done verification without database writes.');
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const dbPayload = A1_A2_ARTICLES.map((a) => ({
    slug: a.slug,
    title: a.title,
    cefr_level: a.cefr_level,
    theme_id: a.theme_id,
    passage: a.passage,
    passage_plain: a.passage_plain,
    word_count: a.word_count,
    estimated_read_minutes: a.estimated_read_minutes,
    translation: a.translation,
    summary: a.summary,
    cloze: a.cloze || {},
    questions: a.questions || [],
    vocabulary_highlights: a.vocabulary_highlights || [],
    audio_url: a.audio_url || null,
    podcast_meta: a.podcast_meta || {},
    mindmap_data: a.mindmap_data || {},
    source_type: a.source_type,
    status: a.status || 'published',
    difficulty_score: a.difficulty_score || (a.cefr_level === 'A1' ? 15 : 30),
    updated_at: new Date().toISOString(),
  }));

  console.log(`\nUpserting ${dbPayload.length} articles to public.reading_articles...`);

  const { data, error } = await supabase
    .from('reading_articles')
    .upsert(dbPayload, { onConflict: 'slug' })
    .select('id, slug, cefr_level, theme_id');

  if (error) {
    console.error('❌ Supabase upsert error:', error.message);
    process.exit(1);
  }

  console.log(`🎉 Successfully upserted ${data?.length || dbPayload.length} A1 & A2 articles!`);
}

main().catch(console.error);
