/**
 * LingoPro Speaking Topic Library
 * Category: describing
 * Subcategory: food-drinks
 * File: src/data/speaking/topic-library/describing/food-drinks.ts
 *
 * Sub-topics covering food-drinks.
 * CEFR Range: A1-B2
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const FOOD_DRINKS: TopicLibraryItem[] = [
  {
    "id": "desc-food-01",
    "category": "describing",
    "subcategory": "food-drinks",
    "level": "A1",
    "titleEn": "Describing a bowl of pho",
    "titleVi": "Mô tả một bát phở",
    "icon": "Coffee",
    "situationVi": "Bạn đang mô tả món Phở của Việt Nam cho một người bạn nước ngoài, bao gồm các thành phần và hương vị.",
    "tags": [
      "food",
      "pho",
      "vietnamese"
    ],
    "sampleDialogue": [
      {
        "speaker": "A",
        "text": "What is pho?",
        "textVi": "Phở là món gì vậy?"
      },
      {
        "speaker": "B",
        "text": "It is a traditional Vietnamese noodle soup.",
        "textVi": "Nó là một món súp mì truyền thống của Việt Nam."
      },
      {
        "speaker": "A",
        "text": "What is in it?",
        "textVi": "Trong đó có những gì?"
      },
      {
        "speaker": "B",
        "text": "It has beef, rice noodles, and hot soup.",
        "textVi": "Nó có thịt bò, bánh phở và nước dùng nóng."
      }
    ],
    "keyVocabulary": [
      {
        "term": "noodles",
        "ipa": "/ˈnuː.dəlz/",
        "partOfSpeech": "n.",
        "meaningVi": "mì, bún, phở",
        "exampleEn": "I like eating noodles.",
        "exampleVi": "Tôi thích ăn mì.",
        "associatedActions": [
          { "en": "slurp the noodles", "vi": "húp sợi mì/phở" },
          { "en": "boil fresh noodles", "vi": "trần bánh phở tươi" },
          { "en": "pick up with chopsticks", "vi": "gắp bằng đũa" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "beef",
        "ipa": "/biːf/",
        "partOfSpeech": "n.",
        "meaningVi": "thịt bò",
        "exampleEn": "This pho has beef.",
        "exampleVi": "Bát phở này có thịt bò.",
        "associatedActions": [
          { "en": "slice tender beef", "vi": "thái thịt bò mềm" },
          { "en": "cook rare beef", "vi": "nấu thịt bò tái" },
          { "en": "season with pepper", "vi": "nêm thịt bò với tiêu" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "soup",
        "ipa": "/suːp/",
        "partOfSpeech": "n.",
        "meaningVi": "nước súp, canh",
        "exampleEn": "The soup is very hot.",
        "exampleVi": "Nước súp rất nóng.",
        "associatedActions": [
          { "en": "simmer the broth", "vi": "ninh nước dùng" },
          { "en": "sip hot soup", "vi": "húp nước súp nóng" },
          { "en": "spoon the broth", "vi": "múc từng thìa nước súp" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "delicious",
        "ipa": "/dɪˈlɪʃ.əs/",
        "partOfSpeech": "adj.",
        "meaningVi": "ngon miệng",
        "exampleEn": "Pho is delicious.",
        "exampleVi": "Phở rất ngon.",
        "associatedActions": [
          { "en": "taste the flavor", "vi": "thưởng thức hương vị" },
          { "en": "compliment the chef", "vi": "khen ngợi đầu bếp" },
          { "en": "enjoy every bite", "vi": "thưởng thức từng miếng ngon" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "bowl",
        "ipa": "/bəʊl/",
        "partOfSpeech": "n.",
        "meaningVi": "cái bát, tô",
        "exampleEn": "I want a big bowl of pho.",
        "exampleVi": "Tôi muốn một tô phở lớn.",
        "associatedActions": [
          { "en": "hold the warm bowl", "vi": "bưng tô phở ấm nóng" },
          { "en": "fill the bowl", "vi": "múc đầy bát" },
          { "en": "wash after eating", "vi": "rửa bát sau khi ăn" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80"
      }
    ],
    "usefulPhrases": [
      {
        "phrase": "Pho is a famous dish in Vietnam.",
        "meaningVi": "Phở là một món ăn nổi tiếng ở Việt Nam."
      },
      {
        "phrase": "It tastes delicious.",
        "meaningVi": "Nó có vị rất ngon."
      },
      {
        "phrase": "You should try it with lime.",
        "meaningVi": "Bạn nên thử nó với chanh."
      },
      {
        "phrase": "It has a very nice smell.",
        "meaningVi": "Nó có mùi rất thơm."
      },
      {
        "phrase": "I usually eat pho for breakfast.",
        "meaningVi": "Tôi thường ăn phở vào bữa sáng."
      }
    ],
    "aiTutorPrompt": "You are a foreigner who has never tried pho. Ask the user about what it is, what is in it, and how it tastes. Use simple A1 English."
  }
];
