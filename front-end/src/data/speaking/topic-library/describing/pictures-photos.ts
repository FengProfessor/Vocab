/**
 * LingoPro Speaking Topic Library
 * Category: describing
 * Subcategory: pictures-photos
 * File: src/data/speaking/topic-library/describing/pictures-photos.ts
 *
 * Sub-topics covering pictures-photos.
 * CEFR Range: A1-B2
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const PICTURES_PHOTOS: TopicLibraryItem[] = [
  {
    "id": "desc-pic-01",
    "category": "describing",
    "subcategory": "pictures-photos",
    "level": "A1",
    "titleEn": "A street scene with people walking",
    "titleVi": "Cảnh đường phố với người đi bộ",
    "icon": "Image",
    "situationVi": "Bạn đang xem một bức ảnh chụp cảnh đường phố nhộn nhịp và mô tả những gì bạn thấy trong ảnh cho một người khác.",
    "tags": [
      "picture",
      "street",
      "city"
    ],
    "sampleDialogue": [
      {
        "speaker": "A",
        "text": "What can you see in this picture?",
        "textVi": "Bạn thấy gì trong bức ảnh này?"
      },
      {
        "speaker": "B",
        "text": "I see many people walking on the street.",
        "textVi": "Tôi thấy nhiều người đang đi bộ trên phố."
      },
      {
        "speaker": "A",
        "text": "What is the weather like?",
        "textVi": "Thời tiết thế nào?"
      },
      {
        "speaker": "B",
        "text": "It is sunny and the sky is blue.",
        "textVi": "Trời nắng và bầu trời trong xanh."
      }
    ],
    "keyVocabulary": [
      {
        "term": "street",
        "ipa": "/striːt/",
        "partOfSpeech": "n.",
        "meaningVi": "con đường",
        "exampleEn": "The street is very busy.",
        "exampleVi": "Con đường này rất đông đúc.",
        "associatedActions": [
          { "en": "cross pedestrian crossing", "vi": "băng qua vạch sang đường" },
          { "en": "stroll down sidewalk", "vi": "đi dạo trên vỉa hè" },
          { "en": "navigate busy traffic", "vi": "di chuyển giữa phố xá đông đúc" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "walk",
        "ipa": "/wɔːk/",
        "partOfSpeech": "v.",
        "meaningVi": "đi bộ",
        "exampleEn": "People are walking to work.",
        "exampleVi": "Mọi người đang đi bộ đi làm.",
        "associatedActions": [
          { "en": "walk along the sidewalk", "vi": "đi bộ dọc theo vỉa hè" },
          { "en": "pace briskly to work", "vi": "rảo bước nhanh đi làm" },
          { "en": "step onto crosswalk", "vi": "bước lên vạch sang đường" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "building",
        "ipa": "/ˈbɪl.dɪŋ/",
        "partOfSpeech": "n.",
        "meaningVi": "tòa nhà",
        "exampleEn": "There are tall buildings.",
        "exampleVi": "Có những tòa nhà cao tầng.",
        "associatedActions": [
          { "en": "enter the lobby", "vi": "bước vào sảnh tòa nhà" },
          { "en": "gaze at skyscraper", "vi": "ngắm nhìn tòa nhà chọc trời" },
          { "en": "take elevator up", "vi": "đi thang máy lên tầng" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "busy",
        "ipa": "/ˈbɪz.i/",
        "partOfSpeech": "adj.",
        "meaningVi": "đông đúc, bận rộn",
        "exampleEn": "It is a busy street.",
        "exampleVi": "Đó là một con đường đông đúc.",
        "associatedActions": [
          { "en": "rush through crowd", "vi": "vội vã len qua đám đông" },
          { "en": "hustle during rush hour", "vi": "hối hả trong giờ cao điểm" },
          { "en": "dodge pedestrians", "vi": "tránh người đi bộ ngược chiều" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "sunny",
        "ipa": "/ˈsʌn.i/",
        "partOfSpeech": "adj.",
        "meaningVi": "có nắng",
        "exampleEn": "It is a sunny day.",
        "exampleVi": "Đó là một ngày nắng.",
        "associatedActions": [
          { "en": "put on sunglasses", "vi": "đeo kính râm chống nắng" },
          { "en": "walk under sunlight", "vi": "đi dạo dưới ánh nắng" },
          { "en": "enjoy warm weather", "vi": "tận hưởng tiết trời ấm áp" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
      }
    ],
    "usefulPhrases": [
      {
        "phrase": "In this picture, I can see...",
        "meaningVi": "Trong bức ảnh này, tôi có thể thấy..."
      },
      {
        "phrase": "There are many people...",
        "meaningVi": "Có rất nhiều người..."
      },
      {
        "phrase": "On the left side of the picture...",
        "meaningVi": "Ở bên trái bức ảnh..."
      },
      {
        "phrase": "In the background...",
        "meaningVi": "Ở phía sau/nền..."
      },
      {
        "phrase": "They seem to be...",
        "meaningVi": "Họ có vẻ như đang..."
      }
    ],
    "aiTutorPrompt": "You are looking at a picture of a street scene with the user. Ask them basic questions about what they see in the picture (people, buildings, weather). Keep it at A1 level."
  }
];
