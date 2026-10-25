/**
 * LingoPro Speaking Topic Library
 * Category: describing
 * Subcategory: weather-nature
 * File: src/data/speaking/topic-library/describing/weather-nature.ts
 *
 * Sub-topics covering weather-nature.
 * CEFR Range: A1-B2
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const WEATHER_NATURE: TopicLibraryItem[] = [
  {
    "id": "desc-wea-01",
    "category": "describing",
    "subcategory": "weather-nature",
    "level": "A1",
    "titleEn": "Sunny day",
    "titleVi": "Ngày nắng",
    "icon": "Sun",
    "situationVi": "Bạn đang nói chuyện với bạn bè về một ngày thời tiết rất đẹp, có nắng và bạn muốn ra ngoài chơi.",
    "tags": [
      "weather",
      "sun",
      "nature"
    ],
    "sampleDialogue": [
      {
        "speaker": "A",
        "text": "The weather is great today!",
        "textVi": "Hôm nay thời tiết thật tuyệt!"
      },
      {
        "speaker": "B",
        "text": "Yes, it is very sunny and warm.",
        "textVi": "Đúng vậy, trời rất nắng và ấm áp."
      },
      {
        "speaker": "A",
        "text": "Should we go to the park?",
        "textVi": "Chúng ta có nên đến công viên không?"
      },
      {
        "speaker": "B",
        "text": "Good idea. I love sunny days.",
        "textVi": "Ý hay đấy. Tôi thích những ngày nắng."
      }
    ],
    "keyVocabulary": [
      {
        "term": "sunny",
        "ipa": "/ˈsʌn.i/",
        "partOfSpeech": "adj.",
        "meaningVi": "có nắng",
        "exampleEn": "It is a sunny day.",
        "exampleVi": "Đó là một ngày nắng.",
        "associatedActions": [
          { "en": "sunbathe outdoors", "vi": "tắm nắng ngoài trời" },
          { "en": "wear a wide hat", "vi": "đội mũ rộng vành che nắng" },
          { "en": "apply sunscreen lotion", "vi": "thoa kem chống nắng" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "warm",
        "ipa": "/wɔːm/",
        "partOfSpeech": "adj.",
        "meaningVi": "ấm áp",
        "exampleEn": "The weather is warm.",
        "exampleVi": "Thời tiết ấm áp.",
        "associatedActions": [
          { "en": "enjoy gentle breeze", "vi": "tận hưởng làn gió ấm áp" },
          { "en": "take off heavy jacket", "vi": "cởi bớt áo khoác dày" },
          { "en": "go out for picnic", "vi": "ra ngoài dã ngoại thư giãn" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "sky",
        "ipa": "/skaɪ/",
        "partOfSpeech": "n.",
        "meaningVi": "bầu trời",
        "exampleEn": "The sky is blue.",
        "exampleVi": "Bầu trời trong xanh.",
        "associatedActions": [
          { "en": "gaze at the blue sky", "vi": "ngước nhìn bầu trời trong xanh" },
          { "en": "watch drifting clouds", "vi": "ngắm những đám mây trôi" },
          { "en": "take photos of clouds", "vi": "chụp ảnh mây trời" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "bright",
        "ipa": "/braɪt/",
        "partOfSpeech": "adj.",
        "meaningVi": "sáng sủa, chói",
        "exampleEn": "The sun is very bright.",
        "exampleVi": "Mặt trời rất chói.",
        "associatedActions": [
          { "en": "shade eyes from light", "vi": "lấy tay che mắt khỏi chói" },
          { "en": "open window blinds", "vi": "mở rèm cho ánh sáng tràn vào" },
          { "en": "brighten the room", "vi": "làm bừng sáng cả căn phòng" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "outside",
        "ipa": "/ˌaʊtˈsaɪd/",
        "partOfSpeech": "adv.",
        "meaningVi": "bên ngoài",
        "exampleEn": "Let's go outside.",
        "exampleVi": "Hãy ra ngoài nào.",
        "associatedActions": [
          { "en": "step into fresh air", "vi": "bước ra ngoài hít thở khí trời" },
          { "en": "hang out with friends", "vi": "ra ngoài tụ tập cùng bạn bè" },
          { "en": "exercise in the park", "vi": "tập thể dục ngoài công viên" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80"
      }
    ],
    "usefulPhrases": [
      {
        "phrase": "The weather is beautiful today.",
        "meaningVi": "Hôm nay thời tiết rất đẹp."
      },
      {
        "phrase": "There are no clouds in the sky.",
        "meaningVi": "Không có đám mây nào trên trời."
      },
      {
        "phrase": "It is a perfect day for a walk.",
        "meaningVi": "Đây là một ngày hoàn hảo để đi dạo."
      },
      {
        "phrase": "The sun is shining brightly.",
        "meaningVi": "Mặt trời đang chiếu sáng chói lọi."
      },
      {
        "phrase": "I feel happy when it is sunny.",
        "meaningVi": "Tôi cảm thấy vui khi trời nắng."
      }
    ],
    "aiTutorPrompt": "You are a friend chatting with the user about the good weather today. Suggest doing an outdoor activity and ask what they like to do on sunny days."
  }
];
