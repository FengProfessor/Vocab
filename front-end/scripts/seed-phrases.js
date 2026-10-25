const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CURATED_PHRASES = [
  {
    word: 'due to',
    data: {
      word: 'due to',
      pronunciations: [
        { ipa: '/ˈdjuː tuː/', region: 'UK' },
        { ipa: '/ˈduː tuː/', region: 'US' }
      ],
      results: [
        {
          meanings: [
            {
              pos: 'Cụm giới từ',
              definition: 'Bởi vì, do (chỉ nguyên nhân, lý do)',
              example: 'The match was delayed due to heavy rain.',
              collocations: ['due to the fact that', 'due to bad weather', 'due to unforeseen circumstances']
            }
          ]
        }
      ],
      synonyms: ['because of', 'owing to', 'on account of', 'as a result of', 'thanks to'],
      antonyms: [],
      familyWords: [
        { word: 'due', pos: 'adjective', meaning: 'đến hạn, vì' },
        { word: 'due to', pos: 'preposition', meaning: 'bởi vì, do' }
      ]
    },
    tags: ['curated-phrase', 'grammar-prep']
  },
  {
    word: 'because of',
    data: {
      word: 'because of',
      pronunciations: [
        { ipa: '/bɪˈkɒz əv/', region: 'UK' },
        { ipa: '/bɪˈkəz əv/', region: 'US' }
      ],
      results: [
        {
          meanings: [
            {
              pos: 'Cụm giới từ',
              definition: 'Bởi vì, do (đi với Noun / Noun Phrase / V-ing)',
              example: 'They stayed home because of the cold weather.',
              collocations: ['because of this', 'because of that']
            }
          ]
        }
      ],
      synonyms: ['due to', 'owing to', 'on account of'],
      antonyms: [],
      familyWords: [
        { word: 'because', pos: 'conjunction', meaning: 'bởi vì (đi với clause)' },
        { word: 'because of', pos: 'preposition', meaning: 'bởi vì (đi với N/V-ing)' }
      ]
    },
    tags: ['curated-phrase', 'grammar-prep']
  },
  {
    word: 'according to',
    data: {
      word: 'according to',
      pronunciations: [
        { ipa: '/əˈkɔːdɪŋ tuː/', region: 'UK' },
        { ipa: '/əˈkɔːrdɪŋ tuː/', region: 'US' }
      ],
      results: [
        {
          meanings: [
            {
              pos: 'Cụm giới từ',
              definition: 'Theo như, căn cứ theo (nguồn tin, quy định)',
              example: 'According to the weather forecast, it will rain tomorrow.',
              collocations: ['according to law', 'according to plan', 'according to experts']
            }
          ]
        }
      ],
      synonyms: ['in accordance with', 'as stated by'],
      antonyms: [],
      familyWords: [
        { word: 'accord', pos: 'noun/verb', meaning: 'sự đồng lòng, phù hợp' },
        { word: 'accordingly', pos: 'adverb', meaning: 'theo đó, do đó' }
      ]
    },
    tags: ['curated-phrase', 'grammar-prep']
  },
  {
    word: 'in spite of',
    data: {
      word: 'in spite of',
      pronunciations: [
        { ipa: '/ɪn spaɪt əv/', region: 'UK' },
        { ipa: '/ɪn spaɪt əv/', region: 'US' }
      ],
      results: [
        {
          meanings: [
            {
              pos: 'Cụm giới từ',
              definition: 'Mặc dù, bất chấp',
              example: 'We enjoyed the walk in spite of the rain.',
              collocations: ['in spite of the fact that', 'in spite of everything']
            }
          ]
        }
      ],
      synonyms: ['despite', 'regardless of', 'notwithstanding'],
      antonyms: [],
      familyWords: [
        { word: 'spite', pos: 'noun', meaning: 'sự giận dữ, hận thù' },
        { word: 'in spite of', pos: 'preposition', meaning: 'mặc dù' }
      ]
    },
    tags: ['curated-phrase', 'grammar-prep']
  },
  {
    word: 'instead of',
    data: {
      word: 'instead of',
      pronunciations: [
        { ipa: '/ɪnˈstɛd əv/', region: 'UK' },
        { ipa: '/ɪnˈstɛd əv/', region: 'US' }
      ],
      results: [
        {
          meanings: [
            {
              pos: 'Cụm giới từ',
              definition: 'Thay vì, thay cho',
              example: 'You should drink water instead of coffee.',
              collocations: ['instead of doing something', 'instead of going']
            }
          ]
        }
      ],
      synonyms: ['rather than', 'in place of'],
      antonyms: [],
      familyWords: [
        { word: 'instead', pos: 'adverb', meaning: 'thay vào đó' },
        { word: 'instead of', pos: 'preposition', meaning: 'thay vì' }
      ]
    },
    tags: ['curated-phrase', 'grammar-prep']
  },
  {
    word: 'in order to',
    data: {
      word: 'in order to',
      pronunciations: [
        { ipa: '/ɪn ˈɔːdə tuː/', region: 'UK' },
        { ipa: '/ɪn ˈɔːrdər tuː/', region: 'US' }
      ],
      results: [
        {
          meanings: [
            {
              pos: 'Cụm từ chỉ mục đích',
              definition: 'Để, nhằm mục đích (đi với động từ nguyên mẫu V-bare)',
              example: 'She studies hard in order to pass the exam.',
              collocations: ['in order to avoid', 'in order to ensure', 'in order to achieve']
            }
          ]
        }
      ],
      synonyms: ['so as to', 'to'],
      antonyms: [],
      familyWords: [
        { word: 'order', pos: 'noun/verb', meaning: 'trật tự, ra lệnh' },
        { word: 'in order to', pos: 'phrase', meaning: 'để, nhằm' }
      ]
    },
    tags: ['curated-phrase', 'grammar-prep']
  },
  {
    word: 'so that',
    data: {
      word: 'so that',
      pronunciations: [
        { ipa: '/səʊ ðæt/', region: 'UK' },
        { ipa: '/soʊ ðæt/', region: 'US' }
      ],
      results: [
        {
          meanings: [
            {
              pos: 'Cụm liên từ',
              definition: 'Để cho, để mà (chỉ mục đích, đi với mệnh đề S + can/could/will/would + V)',
              example: 'He arrived early so that he could get a good seat.',
              collocations: ['so that everyone can see', 'so that we may']
            }
          ]
        }
      ],
      synonyms: ['in order that'],
      antonyms: [],
      familyWords: [
        { word: 'so', pos: 'conjunction', meaning: 'cho nên, vì vậy' },
        { word: 'so that', pos: 'conjunction', meaning: 'để cho, để mà' }
      ]
    },
    tags: ['curated-phrase', 'grammar-prep']
  },
  {
    word: 'look up',
    data: {
      word: 'look up',
      pronunciations: [
        { ipa: '/lʊk ʌp/', region: 'UK' },
        { ipa: '/lʊk ʌp/', region: 'US' }
      ],
      results: [
        {
          meanings: [
            {
              pos: 'Cụm động từ (Phrasal verb)',
              definition: 'Tra cứu (từ điển, thông tin); cải thiện, trở nên tốt hơn',
              example: 'You can look up new words in the dictionary.',
              collocations: ['look up a word', 'look up information', 'things are looking up']
            }
          ]
        }
      ],
      synonyms: ['search for', 'find', 'improve'],
      antonyms: [],
      familyWords: [
        { word: 'look', pos: 'verb', meaning: 'nhìn, xem' },
        { word: 'lookup', pos: 'noun', meaning: 'sự tra cứu' }
      ]
    },
    tags: ['curated-phrase', 'phrasal-verb']
  }
];

async function seedPhrases() {
  console.log('Seeding curated phrases into global_dictionary...');
  for (const item of CURATED_PHRASES) {
    const { error } = await supabase
      .from('global_dictionary')
      .upsert(item, { onConflict: 'word' });
    if (error) {
      console.error(`Failed to seed "${item.word}":`, error.message);
    } else {
      console.log(`Successfully seeded "${item.word}"`);
    }
  }
}

seedPhrases();
