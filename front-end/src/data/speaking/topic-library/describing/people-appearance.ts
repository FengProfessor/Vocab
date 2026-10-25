/**
 * LingoPro Speaking Topic Library
 * Category: describing
 * Subcategory: people-appearance
 * File: src/data/speaking/topic-library/describing/people-appearance.ts
 *
 * Sub-topics covering people-appearance.
 * CEFR Range: A1-B2
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const PEOPLE_APPEARANCE: TopicLibraryItem[] = [
  {
    "id": "desc-ppl-01",
    "category": "describing",
    "subcategory": "people-appearance",
    "level": "A1",
    "titleEn": "Describing a family member",
    "titleVi": "Mô tả một thành viên trong gia đình",
    "icon": "User",
    "situationVi": "Bạn đang kể cho một người bạn nghe về một người thân trong gia đình mình, mô tả ngoại hình và tính cách cơ bản của họ.",
    "tags": [
      "people",
      "family",
      "appearance"
    ],
    "sampleDialogue": [
      {
        "speaker": "A",
        "text": "Who do you look like in your family?",
        "textVi": "Bạn trông giống ai trong gia đình?"
      },
      {
        "speaker": "B",
        "text": "I look like my father. We both have brown eyes.",
        "textVi": "Tôi giống bố tôi. Chúng tôi đều có mắt nâu."
      },
      {
        "speaker": "A",
        "text": "Is he tall?",
        "textVi": "Ông ấy có cao không?"
      },
      {
        "speaker": "B",
        "text": "Yes, he is very tall and has short black hair.",
        "textVi": "Có, ông ấy rất cao và có mái tóc đen ngắn."
      }
    ],
    "keyVocabulary": [
      {
        "term": "tall",
        "ipa": "/tɔːl/",
        "partOfSpeech": "adj.",
        "meaningVi": "cao",
        "exampleEn": "My brother is tall.",
        "exampleVi": "Anh trai tôi cao.",
        "associatedActions": [
          { "en": "stand tall and straight", "vi": "đứng thẳng lưng và cao ráo" },
          { "en": "reach high shelves", "vi": "với tay lên kệ cao" },
          { "en": "measure one's height", "vi": "đo chiều cao" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "short",
        "ipa": "/ʃɔːt/",
        "partOfSpeech": "adj.",
        "meaningVi": "thấp, ngắn",
        "exampleEn": "She has short hair.",
        "exampleVi": "Cô ấy có mái tóc ngắn.",
        "associatedActions": [
          { "en": "cut hair short", "vi": "cắt tóc ngắn" },
          { "en": "stand next to someone", "vi": "đứng cạnh ai đó" },
          { "en": "look up when talking", "vi": "ngước nhìn khi trò chuyện" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "handsome",
        "ipa": "/ˈhæn.səm/",
        "partOfSpeech": "adj.",
        "meaningVi": "đẹp trai",
        "exampleEn": "He is a handsome man.",
        "exampleVi": "Anh ấy là một người đàn ông đẹp trai.",
        "associatedActions": [
          { "en": "dress sharply", "vi": "ăn mặc bảnh bao" },
          { "en": "smile charmingly", "vi": "mỉm cười cuốn hút" },
          { "en": "groom hair neatly", "vi": "chải tóc gọn gàng" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "beautiful",
        "ipa": "/ˈbjuː.tɪ.fəl/",
        "partOfSpeech": "adj.",
        "meaningVi": "xinh đẹp",
        "exampleEn": "My mother is beautiful.",
        "exampleVi": "Mẹ tôi xinh đẹp.",
        "associatedActions": [
          { "en": "flash a radiant smile", "vi": "nở nụ cười rạng rỡ" },
          { "en": "wear elegant clothes", "vi": "mặc trang phục thanh lịch" },
          { "en": "look in the mirror", "vi": "ngắm nhìn trong gương" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "eyes",
        "ipa": "/aɪz/",
        "partOfSpeech": "n.",
        "meaningVi": "đôi mắt",
        "exampleEn": "She has blue eyes.",
        "exampleVi": "Cô ấy có đôi mắt xanh dương.",
        "associatedActions": [
          { "en": "blink in bright light", "vi": "chớp mắt dưới ánh sáng chói" },
          { "en": "make eye contact", "vi": "giao tiếp bằng ánh mắt" },
          { "en": "close eyes to rest", "vi": "nhắm mắt nghỉ ngơi" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80"
      }
    ],
    "usefulPhrases": [
      {
        "phrase": "He/She is quite tall.",
        "meaningVi": "Anh ấy/Cô ấy khá cao."
      },
      {
        "phrase": "He/She has brown eyes.",
        "meaningVi": "Anh ấy/Cô ấy có mắt nâu."
      },
      {
        "phrase": "We look similar.",
        "meaningVi": "Chúng tôi trông giống nhau."
      },
      {
        "phrase": "She is a very kind person.",
        "meaningVi": "Cô ấy là một người rất tốt bụng."
      },
      {
        "phrase": "He wears glasses.",
        "meaningVi": "Anh ấy đeo kính."
      }
    ],
    "aiTutorPrompt": "You are talking to the user about their family. Ask them to describe a family member's physical appearance. Keep it to A1 level."
  }
];
