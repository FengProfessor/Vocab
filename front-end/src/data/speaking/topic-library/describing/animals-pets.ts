/**
 * LingoPro Speaking Topic Library
 * Category: describing
 * Subcategory: animals-pets
 * File: src/data/speaking/topic-library/describing/animals-pets.ts
 *
 * Sub-topics covering animals-pets.
 * CEFR Range: A1-B2
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const ANIMALS_PETS: TopicLibraryItem[] = [
  {
    "id": "desc-ani-01",
    "category": "describing",
    "subcategory": "animals-pets",
    "level": "A1",
    "titleEn": "My pet dog",
    "titleVi": "Chó cưng của tôi",
    "icon": "Smile",
    "situationVi": "Bạn đang kể cho mọi người nghe về chú chó cưng của mình, mô tả bộ lông, kích thước và tính cách của nó.",
    "tags": [
      "animal",
      "pet",
      "dog"
    ],
    "sampleDialogue": [
      {
        "speaker": "A",
        "text": "Do you have any pets?",
        "textVi": "Bạn có nuôi thú cưng nào không?"
      },
      {
        "speaker": "B",
        "text": "Yes, I have a small dog.",
        "textVi": "Có, tôi có một chú chó nhỏ."
      },
      {
        "speaker": "A",
        "text": "What color is it?",
        "textVi": "Nó màu gì?"
      },
      {
        "speaker": "B",
        "text": "He is brown and white. He is very cute.",
        "textVi": "Nó có màu nâu và trắng. Nó rất dễ thương."
      }
    ],
    "keyVocabulary": [
      {
        "term": "dog",
        "ipa": "/dɒɡ/",
        "partOfSpeech": "n.",
        "meaningVi": "con chó",
        "exampleEn": "My dog loves to play.",
        "exampleVi": "Chó của tôi thích chơi đùa.",
        "associatedActions": [
          { "en": "take for a walk", "vi": "dắt đi dạo" },
          { "en": "feed dog food", "vi": "cho chó ăn thức ăn" },
          { "en": "pet its fur", "vi": "vuốt ve bộ lông" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "cute",
        "ipa": "/kjuːt/",
        "partOfSpeech": "adj.",
        "meaningVi": "dễ thương",
        "exampleEn": "Puppies are very cute.",
        "exampleVi": "Những chú chó con rất dễ thương.",
        "associatedActions": [
          { "en": "smile at puppy", "vi": "mỉm cười với cún con" },
          { "en": "cuddle gently", "vi": "ôm ấp nhẹ nhàng" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "friendly",
        "ipa": "/ˈfrend.li/",
        "partOfSpeech": "adj.",
        "meaningVi": "thân thiện",
        "exampleEn": "He is a friendly dog.",
        "exampleVi": "Nó là một chú chó thân thiện.",
        "associatedActions": [
          { "en": "wag the tail", "vi": "vẫy đuôi mừng rỡ" },
          { "en": "greet happily", "vi": "chào đón vui vẻ" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "tail",
        "ipa": "/teɪl/",
        "partOfSpeech": "n.",
        "meaningVi": "cái đuôi",
        "exampleEn": "The dog is wagging its tail.",
        "exampleVi": "Con chó đang vẫy đuôi.",
        "associatedActions": [
          { "en": "wag with joy", "vi": "vẫy đuôi mừng rỡ" },
          { "en": "chase around", "vi": "đuổi theo cái đuôi" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=800&q=80"
      },
      {
        "term": "fur",
        "ipa": "/fɜːr/",
        "partOfSpeech": "n.",
        "meaningVi": "lông (thú)",
        "exampleEn": "It has soft fur.",
        "exampleVi": "Nó có bộ lông mềm mại.",
        "associatedActions": [
          { "en": "brush soft fur", "vi": "chải lông mềm" },
          { "en": "stroke gently", "vi": "vuốt ve nhẹ nhàng" }
        ],
        "imageUrl": "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80"
      }
    ],
    "usefulPhrases": [
      {
        "phrase": "I have a pet dog.",
        "meaningVi": "Tôi có một chú chó cưng."
      },
      {
        "phrase": "He is very playful.",
        "meaningVi": "Nó rất thích đùa giỡn."
      },
      {
        "phrase": "He loves going for a walk.",
        "meaningVi": "Nó thích đi dạo."
      },
      {
        "phrase": "His name is...",
        "meaningVi": "Tên của nó là..."
      },
      {
        "phrase": "He is my best friend.",
        "meaningVi": "Nó là người bạn tốt nhất của tôi."
      }
    ],
    "aiTutorPrompt": "You are asking the user about their pet dog. Ask about the dog's name, color, and what it likes to do."
  }
];
