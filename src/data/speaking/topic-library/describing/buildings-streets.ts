/**
 * LingoPro Speaking Topic Library
 * Category: describing
 * Subcategory: buildings-streets
 * File: src/data/speaking/topic-library/describing/buildings-streets.ts
 *
 * Sub-topics covering buildings-streets.
 * CEFR Range: A1-B2
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const BUILDINGS_STREETS: TopicLibraryItem[] = [
  {
    "id": "desc-bld-01",
    "category": "describing",
    "subcategory": "buildings-streets",
    "level": "A1",
    "titleEn": "My house/apartment",
    "titleVi": "Nhà/căn hộ của tôi",
    "icon": "Home",
    "situationVi": "Bạn đang giới thiệu về ngôi nhà hoặc căn hộ mà bạn đang sống, mô tả các phòng và khu vực xung quanh.",
    "tags": [
      "building",
      "home",
      "house"
    ],
    "sampleDialogue": [
      {
        "speaker": "A",
        "text": "Where do you live?",
        "textVi": "Bạn sống ở đâu?"
      },
      {
        "speaker": "B",
        "text": "I live in a small apartment in the city.",
        "textVi": "Tôi sống trong một căn hộ nhỏ trong thành phố."
      },
      {
        "speaker": "A",
        "text": "How many rooms does it have?",
        "textVi": "Nó có bao nhiêu phòng?"
      },
      {
        "speaker": "B",
        "text": "It has one bedroom, a living room, and a kitchen.",
        "textVi": "Nó có một phòng ngủ, một phòng khách và một nhà bếp."
      }
    ],
    "keyVocabulary": [
      {
        "term": "apartment",
        "ipa": "/əˈpɑːt.mənt/",
        "partOfSpeech": "n.",
        "meaningVi": "căn hộ",
        "exampleEn": "I live in an apartment.",
        "exampleVi": "Tôi sống trong một căn hộ.",
        "associatedActions": [
          { "en": "rent an apartment", "vi": "thuê một căn hộ" },
          { "en": "clean the apartment", "vi": "dọn dẹp căn hộ" },
          { "en": "lock the front door", "vi": "khóa cửa chính" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "house",
        "ipa": "/haʊs/",
        "partOfSpeech": "n.",
        "meaningVi": "ngôi nhà",
        "exampleEn": "My house has a garden.",
        "exampleVi": "Nhà tôi có một khu vườn.",
        "associatedActions": [
          { "en": "paint the walls", "vi": "sơn tường nhà" },
          { "en": "water the garden", "vi": "tưới nước khu vườn" },
          { "en": "welcome guests", "vi": "chào đón khách đến chơi" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "room",
        "ipa": "/ruːm/",
        "partOfSpeech": "n.",
        "meaningVi": "căn phòng",
        "exampleEn": "This room is bright.",
        "exampleVi": "Căn phòng này sáng sủa.",
        "associatedActions": [
          { "en": "tidy up the room", "vi": "dọn dẹp phòng" },
          { "en": "open the window", "vi": "mở cửa sổ phòng" },
          { "en": "turn on the light", "vi": "bật đèn phòng" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "city",
        "ipa": "/ˈsɪt.i/",
        "partOfSpeech": "n.",
        "meaningVi": "thành phố",
        "exampleEn": "I live in a big city.",
        "exampleVi": "Tôi sống ở một thành phố lớn.",
        "associatedActions": [
          { "en": "explore the streets", "vi": "khám phá phố phường" },
          { "en": "commute to work", "vi": "đi làm trong thành phố" },
          { "en": "enjoy city nightlife", "vi": "tận hưởng đời sống đêm đô thị" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "floor",
        "ipa": "/flɔːr/",
        "partOfSpeech": "n.",
        "meaningVi": "tầng, sàn nhà",
        "exampleEn": "I live on the 5th floor.",
        "exampleVi": "Tôi sống ở tầng 5.",
        "associatedActions": [
          { "en": "sweep the floor", "vi": "quét sàn nhà" },
          { "en": "mop the floor", "vi": "lau sàn nhà" },
          { "en": "press elevator button", "vi": "bấm nút thang máy lên tầng" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=800&q=80"
      }
    ],
    "usefulPhrases": [
      {
        "phrase": "My apartment is on the... floor.",
        "meaningVi": "Căn hộ của tôi ở tầng..."
      },
      {
        "phrase": "It is quite small but comfortable.",
        "meaningVi": "Nó khá nhỏ nhưng thoải mái."
      },
      {
        "phrase": "There are three rooms in my house.",
        "meaningVi": "Có ba căn phòng trong nhà tôi."
      },
      {
        "phrase": "I have a nice view from my window.",
        "meaningVi": "Tôi có một góc nhìn đẹp từ cửa sổ."
      },
      {
        "phrase": "I like my neighborhood.",
        "meaningVi": "Tôi thích khu phố của mình."
      }
    ],
    "aiTutorPrompt": "You are a new friend asking the user about where they live. Ask if they live in a house or apartment, and ask them to describe it."
  }
];
