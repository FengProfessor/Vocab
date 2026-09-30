-- Migration: 20260930_unify_grammar_roadmap.sql
-- Goal: Unify Grammar Roadmap Architecture (CEFR A0–B2 Native Support, Deduplication & Consolidation)
-- 1. Upgrade grammar_topics.level check constraint to natively support CEFR stages ('A0', 'A1', 'A2', 'B1', 'B2')
--    while maintaining backward compatibility with ('beginner', 'intermediate', 'advanced').
-- 2. Deduplicate order_index collisions: assign canonical order 1..62 to the 62 CEFR topics.
-- 3. Offset and consolidate 25 legacy Buổi (order_index 101..125) and link parent_id to their canonical CEFR topics.
-- 4. Create public.v_canonical_grammar_topics view for clean CEFR roadmap queries.

begin;

-- ============================================================================
-- 1. UPGRADE LEVEL CHECK CONSTRAINT
-- ============================================================================
alter table public.grammar_topics
  drop constraint if exists grammar_topics_level_check;

alter table public.grammar_topics
  add constraint grammar_topics_level_check
  check (level in ('A0', 'A1', 'A2', 'B1', 'B2', 'beginner', 'intermediate', 'advanced'));

-- ============================================================================
-- 2. DEDUPLICATE ORDER_INDEX COLLISIONS & OFFSET LEGACY 25 BUỔI
-- ============================================================================
-- Legacy 25 Buổi have slugs like 'buoi-01-...'. Shift their order_index to 101..125 to eliminate collisions.
update public.grammar_topics
set order_index = 100 + coalesce(nullif(substring(slug from 'buoi-([0-9]+)'), '')::int, 0)
where slug like 'buoi-%';

-- ============================================================================
-- 3. UPDATE 62 CEFR TOPICS TO NATIVE CEFR LEVELS & CANONICAL ORDER (1..62)
-- ============================================================================
-- A0 Foundation (Topics 1 - 6)
update public.grammar_topics set level = 'A0', order_index = 1 where slug = 'personal-pronouns';
update public.grammar_topics set level = 'A0', order_index = 2 where slug = 'verb-to-be';
update public.grammar_topics set level = 'A0', order_index = 3 where slug = 'demonstratives';
update public.grammar_topics set level = 'A0', order_index = 4 where slug = 'possessives';
update public.grammar_topics set level = 'A0', order_index = 5 where slug = 'plural-nouns';
update public.grammar_topics set level = 'A0', order_index = 6 where slug = 'adjectives-basic';

-- A1 Beginner (Topics 7 - 16)
update public.grammar_topics set level = 'A1', order_index = 7 where slug = 'there-is-there-are';
update public.grammar_topics set level = 'A1', order_index = 8 where slug = 'articles';
update public.grammar_topics set level = 'A1', order_index = 9 where slug = 'present-simple';
update public.grammar_topics set level = 'A1', order_index = 10 where slug = 'have-got';
update public.grammar_topics set level = 'A1', order_index = 11 where slug = 'wh-questions';
update public.grammar_topics set level = 'A1', order_index = 12 where slug = 'adverbs-frequency';
update public.grammar_topics set level = 'A1', order_index = 13 where slug = 'present-continuous';
update public.grammar_topics set level = 'A1', order_index = 14 where slug = 'prepositions-place';
update public.grammar_topics set level = 'A1', order_index = 15 where slug = 'imperatives';
update public.grammar_topics set level = 'A1', order_index = 16 where slug = 'modals-ability';

-- A2 Elementary (Topics 17 - 28)
update public.grammar_topics set level = 'A2', order_index = 17 where slug = 'countable-uncountable';
update public.grammar_topics set level = 'A2', order_index = 18 where slug = 'quantifiers';
update public.grammar_topics set level = 'A2', order_index = 19 where slug = 'prepositions-time';
update public.grammar_topics set level = 'A2', order_index = 20 where slug = 'past-simple';
update public.grammar_topics set level = 'A2', order_index = 21 where slug = 'past-continuous';
update public.grammar_topics set level = 'A2', order_index = 22 where slug = 'be-going-to';
update public.grammar_topics set level = 'A2', order_index = 23 where slug = 'future-will';
update public.grammar_topics set level = 'A2', order_index = 24 where slug = 'comparatives-superlatives';
update public.grammar_topics set level = 'A2', order_index = 25 where slug = 'modals-permission';
update public.grammar_topics set level = 'A2', order_index = 26 where slug = 'modals-obligation';
update public.grammar_topics set level = 'A2', order_index = 27 where slug = 'modals-advice';
update public.grammar_topics set level = 'A2', order_index = 28 where slug = 'conditionals-0-1';

-- B1 Intermediate (Topics 29 - 43)
update public.grammar_topics set level = 'B1', order_index = 29 where slug = 'used-to';
update public.grammar_topics set level = 'B1', order_index = 30 where slug = 'present-perfect';
update public.grammar_topics set level = 'B1', order_index = 31 where slug = 'conjunctions-linking';
update public.grammar_topics set level = 'B1', order_index = 32 where slug = 'present-perfect-continuous';
update public.grammar_topics set level = 'B1', order_index = 33 where slug = 'phrasal-verbs';
update public.grammar_topics set level = 'B1', order_index = 34 where slug = 'past-perfect';
update public.grammar_topics set level = 'B1', order_index = 35 where slug = 'future-continuous';
update public.grammar_topics set level = 'B1', order_index = 36 where slug = 'passive-voice';
update public.grammar_topics set level = 'B1', order_index = 37 where slug = 'gerunds-infinitives';
update public.grammar_topics set level = 'B1', order_index = 38 where slug = 'reported-speech';
update public.grammar_topics set level = 'B1', order_index = 39 where slug = 'relative-clauses';
update public.grammar_topics set level = 'B1', order_index = 40 where slug = 'question-tags';
update public.grammar_topics set level = 'B1', order_index = 41 where slug = 'second-conditional';
update public.grammar_topics set level = 'B1', order_index = 42 where slug = 'third-conditional';
update public.grammar_topics set level = 'B1', order_index = 43 where slug = 'modals-deduction';

-- B2 Upper-Intermediate (Topics 44 - 62)
update public.grammar_topics set level = 'B2', order_index = 44 where slug = 'past-perfect-continuous';
update public.grammar_topics set level = 'B2', order_index = 45 where slug = 'future-perfect';
update public.grammar_topics set level = 'B2', order_index = 46 where slug = 'future-in-the-past';
update public.grammar_topics set level = 'B2', order_index = 47 where slug = 'mixed-conditionals';
update public.grammar_topics set level = 'B2', order_index = 48 where slug = 'wish-if-only';
update public.grammar_topics set level = 'B2', order_index = 49 where slug = 'modals-perfect';
update public.grammar_topics set level = 'B2', order_index = 50 where slug = 'causative';
update public.grammar_topics set level = 'B2', order_index = 51 where slug = 'advanced-passive';
update public.grammar_topics set level = 'B2', order_index = 52 where slug = 'advanced-relative-clauses';
update public.grammar_topics set level = 'B2', order_index = 53 where slug = 'participle-clauses';
update public.grammar_topics set level = 'B2', order_index = 54 where slug = 'ellipsis-substitution';
update public.grammar_topics set level = 'B2', order_index = 55 where slug = 'subjunctive';
update public.grammar_topics set level = 'B2', order_index = 56 where slug = 'emphasis-structures';
update public.grammar_topics set level = 'B2', order_index = 57 where slug = 'cleft-sentences';
update public.grammar_topics set level = 'B2', order_index = 58 where slug = 'inversion';
update public.grammar_topics set level = 'B2', order_index = 59 where slug = 'discourse-markers';
update public.grammar_topics set level = 'B2', order_index = 60 where slug = 'nominalisation';
update public.grammar_topics set level = 'B2', order_index = 61 where slug = 'hedging-language';
update public.grammar_topics set level = 'B2', order_index = 62 where slug = 'grammatical-collocations';

-- ============================================================================
-- 4. CONSOLIDATE 25 LEGACY BUỔI INTO CORRESPONDING CANONICAL TOPICS
-- ============================================================================
-- Map legacy Buổi parent_id to their canonical CEFR topic equivalent
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-01%' and c.slug = 'verb-to-be';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-02%' and c.slug = 'present-simple';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-03%' and c.slug = 'past-simple';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-04%' and c.slug = 'present-perfect';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-05%' and c.slug = 'future-will';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-06%' and c.slug = 'question-tags';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-07%' and c.slug = 'present-simple';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-08%' and c.slug = 'passive-voice';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-09%' and c.slug = 'adjectives-basic';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-10%' and c.slug = 'comparatives-superlatives';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-11%' and c.slug = 'conditionals-0-1';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-12%' and c.slug = 'reported-speech';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-13%' and c.slug = 'relative-clauses';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-14%' and c.slug = 'modals-ability';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-15%' and c.slug = 'gerunds-infinitives';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-16%' and c.slug = 'subjunctive';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-17%' and c.slug = 'articles';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-18%' and c.slug = 'prepositions-place';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-19%' and c.slug = 'conjunctions-linking';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-20%' and c.slug = 'inversion';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-21%' and c.slug = 'present-simple';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-22%' and c.slug = 'phrasal-verbs';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-23%' and c.slug = 'grammatical-collocations';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-24%' and c.slug = 'personal-pronouns';
update public.grammar_topics t set parent_id = c.id from public.grammar_topics c where t.slug like 'buoi-25%' and c.slug = 'grammatical-collocations';

-- ============================================================================
-- 5. CANONICAL ROADMAP VIEW
-- ============================================================================
create or replace view public.v_canonical_grammar_topics as
select
  id,
  slug,
  title,
  title_vi,
  level,
  order_index,
  created_at
from public.grammar_topics
where order_index between 1 and 62
  and slug not like 'buoi-%'
order by order_index asc;

commit;
