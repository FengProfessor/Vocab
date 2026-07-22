/**
 * Hand-authored PRACTICE banks — stems intentionally different from lesson examples/mistakes.
 * Used by quality-fix-refill-all.mjs
 */
import { FRESH_A0 } from './practice-banks-fresh-a0.mjs';
import {
  PLURAL_NOUNS_PRACTICE,
  QUANTIFIERS_PRACTICE,
  DEMONSTRATIVES_PRACTICE,
  POSSESSIVES_PRACTICE,
  THERE_IS_PRACTICE,
  HAVE_GOT_PRACTICE,
  PRESENT_CONTINUOUS_PRACTICE,
  FUTURE_WILL_PRACTICE,
  MODALS_OBLIGATION_PRACTICE,
  CONDITIONALS_0_1_PRACTICE,
} from './practice-banks-fresh-batch2.mjs';
import {
  PRESENT_PERFECT_PRACTICE,
  PASSIVE_VOICE_PRACTICE,
  REPORTED_SPEECH_PRACTICE,
  RELATIVE_CLAUSES_PRACTICE,
  GERUNDS_INFINITIVES_PRACTICE,
} from './practice-banks-fresh-inter.mjs';
import {
  SECOND_CONDITIONAL_PRACTICE,
  THIRD_CONDITIONAL_PRACTICE,
  MIXED_CONDITIONALS_PRACTICE,
  WISH_IF_ONLY_PRACTICE,
  MODALS_PERFECT_PRACTICE,
  INVERSION_PRACTICE,
} from './practice-banks-fresh-batch3.mjs';

const mcq = (q, opts, answer, fb, case_id) => ({ type: 'mcq', q, opts, answer, fb, case_id });
const fill = (q, opts, answer, fb, case_id) => ({ type: 'fill', q, opts, answer, fb, case_id });
const err = (q, opts, answer, fb, case_id) => ({ type: 'error', q, opts, answer, fb, case_id });
const tf = (q, answer, fb, case_id) => ({ type: 'tf', q, answer, fb, case_id });

/** Articles — 42 items, no reuse of theory stems (dog/music/university/hour/sun examples) */
export const ARTICLES_PRACTICE = [
  // a / an by sound
  fill('She bought ___ umbrella for the rain.', ['an', 'a', 'the'], 'an', 'umbrella → nguyên âm /ʌ/', 'an_umb'),
  fill('He works as ___ engineer.', ['an', 'a', 'the'], 'an', 'engineer → /e/', 'an_eng'),
  fill('They saw ___ eagle in the sky.', ['an', 'a', 'the'], 'an', 'eagle → /iː/', 'an_eag'),
  fill('I need ___ useful tool for this job.', ['a', 'an', 'the'], 'a', 'useful → /juː/ = phụ âm âm', 'a_use'),
  fill('She is ___ European student.', ['a', 'an', 'the'], 'a', 'European → /j/', 'a_eu'),
  fill('We waited for ___ hour and a half. Wait — for silent h use:', ['an', 'a', 'the'], 'an', 'hour silent h', 'an_h'),
  mcq('Choose: ___ one-way ticket, please.', ['a', 'an', 'the'], 'a', 'one → /w/ consonant sound', 'a_one'),
  mcq('Choose: She is ___ honest friend.', ['an', 'a', 'the'], 'an', 'honest silent h', 'an_hon'),
  // first / second mention
  fill('Tom adopted ___ puppy yesterday. ___ puppy sleeps a lot.', ['a / The', 'the / A', 'an / The'], 'a / The', 'lần 1 a, lần 2 the', '2nd'),
  mcq('I met ___ teacher. ___ teacher teaches Math.', ['a / The', 'the / A', 'an / The'], 'a / The', 'first then second mention', '2nd_b'),
  fill('There is ___ message for you. Please read ___ message carefully.', ['a / the', 'the / a', 'an / the'], 'a / the', 'first → a, known → the', '2nd_c'),
  // the unique / specific
  fill('Look at ___ moon tonight — it is full.', ['the', 'a', 'an'], 'the', 'unique celestial', 'the_moon'),
  fill('Please pass me ___ salt on the table.', ['the', 'a', 'an'], 'the', 'specific in shared context', 'the_salt'),
  fill('___ Pacific Ocean is huge.', ['The', 'A', 'An'], 'The', 'oceans take the', 'the_pac'),
  fill('Who is ___ president of this club?', ['the', 'a', 'an'], 'the', 'unique role in context', 'the_pres'),
  mcq('___ Earth goes around ___ Sun.', ['The / the', 'A / a', 'An / the'], 'The / the', 'unique bodies', 'the_earth'),
  // zero article
  fill('Children need ___ love and care. (general)', ['— (no article)', 'a', 'the'], '— (no article)', 'U abstract generic → zero', 'zero_love'),
  fill('She drinks ___ coffee every morning. (in general)', ['— (no article)', 'a', 'the'], '— (no article)', 'U generic', 'zero_cof'),
  fill('___ tigers are dangerous animals. (as a species)', ['— (no article)', 'The', 'A'], '— (no article)', 'plural generic', 'zero_tig'),
  fill('He plays ___ tennis on Sundays.', ['— (no article)', 'a', 'the'], '— (no article)', 'sports → zero', 'zero_ten'),
  mcq('I study ___ history at school. (subject)', ['— (no article)', 'a', 'the'], '— (no article)', 'school subjects often zero', 'zero_his'),
  // contrast traps
  mcq('I love ___ jazz she played last night. (specific performance)', ['the', 'a', '— (no article)'], 'the', 'specific → the', 'the_jazz'),
  mcq('I love ___ jazz. (the genre in general)', ['— (no article)', 'the', 'a'], '— (no article)', 'genre generic → zero', 'zero_jazz'),
  fill('___ water in this bottle is cold.', ['The', 'A', '—'], 'The', 'specific water', 'the_wat'),
  fill('___ water is important for life. (in general)', ['— (no article)', 'The', 'A'], '— (no article)', 'U generic', 'zero_wat'),
  // error correction — fresh stems
  err('Find the error: She bought pen at the shop.', ['She bought a pen at the shop.', 'She bought pen at the shop.', 'She bought an pen at the shop.'], 'She bought a pen at the shop.', 'C singular needs a/an', 'err_pen'),
  err('Find the error: He is a honest worker.', ['He is an honest worker.', 'He is a honest worker.', 'He is the honest worker always.'], 'He is an honest worker.', 'honest → an', 'err_hon'),
  err('Find the error: We stayed at an hotel near the beach. (/h/ pronounced)', ['We stayed at a hotel near the beach.', 'We stayed at an hotel near the beach.', 'We stayed at the hotel near beach.'], 'We stayed at a hotel near the beach.', 'hotel /h/ → a (most accents)', 'err_hot'),
  err('Find the error: Moon looks beautiful tonight.', ['The moon looks beautiful tonight.', 'A moon looks beautiful tonight.', 'Moon look beautiful tonight.'], 'The moon looks beautiful tonight.', 'unique → the', 'err_moon'),
  err('Find the error: She wants to be a engineer.', ['She wants to be an engineer.', 'She wants to be a engineer.', 'She wants to be the engineer generic.'], 'She wants to be an engineer.', 'engineer → an', 'err_eng'),
  err('Find the error: I enjoy the football. (meaning: the sport in general)', ['I enjoy football.', 'I enjoy the football.', 'I enjoy a football.'], 'I enjoy football.', 'sport generic → zero', 'err_fb'),
  err('Find the error: Please open a window. (only one window, both speakers know which)', ['Please open the window.', 'Please open a window.', 'Please open an window.'], 'Please open the window.', 'shared known object → the', 'err_win'),
  // mcq choose sentence
  mcq('Choose the correct sentence.', ['She is reading a magazine.', 'She is reading magazine.', 'She is reading an magazine.'], 'She is reading a magazine.', 'magazine /m/ → a', 'mcq_mag'),
  mcq('Choose the correct sentence.', ['It was an exciting trip.', 'It was a exciting trip.', 'It was exciting trip.'], 'It was an exciting trip.', 'exciting → an', 'mcq_exc'),
  mcq('Choose the correct sentence.', ['The Nile is a long river.', 'Nile is a long river.', 'A Nile is long river.'], 'The Nile is a long river.', 'rivers → the', 'mcq_nile'),
  mcq('Choose the correct sentence.', ['Dogs make good pets.', 'The dogs make good pets. (all dogs as species)', 'A dogs make good pets.'], 'Dogs make good pets.', 'plural generic zero', 'mcq_dogs'),
  // tf
  tf('We use "an" before words that start with a vowel *sound*, not always a vowel letter.', true, 'a/an theo âm', 'tf_sound'),
  tf('"A university" is wrong because university starts with the letter u.', false, 'university starts with /j/ → a', 'tf_uni'),
  tf('After first mention of "a laptop", we usually say "the laptop".', true, 'second mention', 'tf_2nd'),
  tf('We always need "the" before uncountable nouns like water.', false, 'U generic often zero', 'tf_u'),
  tf('"An useful idea" is correct English.', false, 'useful /juː/ → a useful', 'tf_use'),
  // mixed fill
  fill('___ Amazon rainforest is in South America.', ['The', 'A', 'An'], 'The', 'famous unique → the', 'the_amz'),
  fill('I heard ___ interesting story yesterday.', ['an', 'a', 'the'], 'an', 'interesting → an', 'an_int'),
  fill('Can you turn off ___ light before you leave?', ['the', 'a', 'an'], 'the', 'specific light', 'the_lit'),
  fill('My brother wants to buy ___ orange car.', ['an', 'a', 'the'], 'an', 'orange → an', 'an_ora'),
  fill('___ Mount Everest is the highest mountain.', ['— (no article)', 'The', 'A'], '— (no article)', 'Mount + name often zero', 'zero_mt'),
];

export const FRESH_BY_SLUG = {
  articles: ARTICLES_PRACTICE,
  ...FRESH_A0,
  'plural-nouns': PLURAL_NOUNS_PRACTICE,
  quantifiers: QUANTIFIERS_PRACTICE,
  demonstratives: DEMONSTRATIVES_PRACTICE,
  possessives: POSSESSIVES_PRACTICE,
  'there-is-there-are': THERE_IS_PRACTICE,
  'have-got': HAVE_GOT_PRACTICE,
  'present-continuous': PRESENT_CONTINUOUS_PRACTICE,
  'future-will': FUTURE_WILL_PRACTICE,
  'modals-obligation': MODALS_OBLIGATION_PRACTICE,
  'conditionals-0-1': CONDITIONALS_0_1_PRACTICE,
  'present-perfect': PRESENT_PERFECT_PRACTICE,
  'passive-voice': PASSIVE_VOICE_PRACTICE,
  'reported-speech': REPORTED_SPEECH_PRACTICE,
  'relative-clauses': RELATIVE_CLAUSES_PRACTICE,
  'gerunds-infinitives': GERUNDS_INFINITIVES_PRACTICE,
  'second-conditional': SECOND_CONDITIONAL_PRACTICE,
  'third-conditional': THIRD_CONDITIONAL_PRACTICE,
  'mixed-conditionals': MIXED_CONDITIONALS_PRACTICE,
  'wish-if-only': WISH_IF_ONLY_PRACTICE,
  'modals-perfect': MODALS_PERFECT_PRACTICE,
  inversion: INVERSION_PRACTICE,
};
