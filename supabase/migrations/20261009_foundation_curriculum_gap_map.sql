-- =============================================================================
-- Migration: 20261009_foundation_curriculum_gap_map.sql
-- Description: Additive schema for English From Zero - Foundation Curriculum
--              (Grade 6 Vietnam Pre-A1 False Beginner).
-- Safe execution: Purely additive. No drops or modifications of existing tables.
-- =============================================================================

-- 1. Foundation Lexical Concepts (Canonical Universe of Foundation Items)
CREATE TABLE IF NOT EXISTS public.foundation_lexical_concepts (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'CON-G6-001'
    lemma VARCHAR(64) NOT NULL, -- e.g. 'bag', 'eat'
    pos VARCHAR(16) NOT NULL, -- 'noun', 'verb', 'adj', 'adv', 'pronoun', 'prep'
    ipa VARCHAR(64) NOT NULL, -- e.g. '/bæɡ/'
    meaning_vi TEXT NOT NULL, -- e.g. 'cặp sách, ba lô'
    cluster VARCHAR(32) NOT NULL, -- 'school_nouns', 'core_verbs', 'food_drink', etc.
    generative_power INTEGER NOT NULL DEFAULT 50, -- 0-100
    stage INTEGER NOT NULL DEFAULT 0, -- 0 = Stage 0 (Lessons 1-3), 1, 2...
    target_chunks JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g. ["This is my [X]", "I have a [X]"]
    contrast_concepts JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g. ["pen", "pencil"]
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for cluster queries & sampling by generative power
CREATE INDEX IF NOT EXISTS idx_foundation_concepts_cluster_gp 
    ON public.foundation_lexical_concepts(cluster, generative_power DESC);

-- 2. Foundation Representations (Multi-Representation Assets: Text, Audio, Visual, Frames)
CREATE TABLE IF NOT EXISTS public.foundation_representations (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'IMG-G6-001-v1', 'AUD-G6-001'
    concept_id VARCHAR(32) NOT NULL REFERENCES public.foundation_lexical_concepts(id) ON DELETE CASCADE,
    modality VARCHAR(16) NOT NULL, -- 'TEXT', 'AUDIO', 'VISUAL', 'SYNTACTIC_FRAME'
    sub_type VARCHAR(32) NOT NULL, -- 'lemma', 'citation_audio', 'diagnostic_canonical', etc.
    content_payload TEXT NOT NULL, -- file path, URL, or string pattern
    clarity_rating VARCHAR(8) NOT NULL DEFAULT 'V0', -- 'V0', 'V1', 'V2', 'V3'
    approved_diagnostic BOOLEAN NOT NULL DEFAULT false, -- Only V0 may be true
    approved_teaching BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_foundation_reps_concept_modality 
    ON public.foundation_representations(concept_id, modality);

-- 3. Learner Lexical Evidence (Immutable Audit Ledger of Observation Events)
CREATE TABLE IF NOT EXISTS public.learner_lexical_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    learner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    evidence_source VARCHAR(16) NOT NULL DEFAULT 'LEARNER' CHECK (evidence_source IN ('LEARNER', 'TEACHER', 'SYSTEM')),
    concept_id VARCHAR(32) NOT NULL REFERENCES public.foundation_lexical_concepts(id) ON DELETE CASCADE,
    representation_id VARCHAR(64) REFERENCES public.foundation_representations(id) ON DELETE SET NULL,
    probe_mode VARCHAR(32) NOT NULL, -- 'MODE_A_SOUND_IMAGE', 'MODE_B_TEXT_IMAGE', 'MODE_C_FORM_RECALL', etc.
    target_dimension VARCHAR(32) NOT NULL, -- 'SOUND_RECOGNITION', 'TEXT_RECOGNITION', 'MEANING_RECALL', etc.
    is_correct BOOLEAN NOT NULL,
    support_level VARCHAR(16) NOT NULL, -- 'INDEPENDENT', 'MODELLED', 'PROMPTED', 'NOT_YET'
    response_latency_ms INTEGER NOT NULL,
    distractor_selected VARCHAR(64),
    lesson_id VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for rapid retrieval of learner event streams
CREATE INDEX IF NOT EXISTS idx_learner_evidence_stream 
    ON public.learner_lexical_evidence(learner_id, concept_id, created_at DESC);

-- 4. Learner Lexical State (Multi-Dimensional Profile & Gap Classification)
CREATE TABLE IF NOT EXISTS public.learner_lexical_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id VARCHAR(32) NOT NULL REFERENCES public.foundation_lexical_concepts(id) ON DELETE CASCADE,
    status_bucket VARCHAR(16) NOT NULL DEFAULT 'UNCERTAIN', -- 'SOLID', 'PARTIAL', 'UNKNOWN', 'UNCERTAIN', 'RECHECK'
    active_gap VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN_CONCEPT_OR_FORM', -- One of 10 gap classifications
    sound_recognition BOOLEAN NOT NULL DEFAULT false,
    text_recognition BOOLEAN NOT NULL DEFAULT false,
    meaning_recall BOOLEAN NOT NULL DEFAULT false,
    form_recall BOOLEAN NOT NULL DEFAULT false,
    chunk_use BOOLEAN NOT NULL DEFAULT false,
    generative_use BOOLEAN NOT NULL DEFAULT false,
    retention_stable BOOLEAN NOT NULL DEFAULT false,
    uncertainty_score NUMERIC(3,2) NOT NULL DEFAULT 1.00, -- 0.00 to 1.00
    last_support_level VARCHAR(16) DEFAULT 'INDEPENDENT',
    last_latency_ms INTEGER,
    consecutive_independent_passes INTEGER NOT NULL DEFAULT 0,
    last_probed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_learner_lexical_state UNIQUE (learner_id, concept_id)
);

CREATE INDEX IF NOT EXISTS idx_learner_lexical_state_bucket 
    ON public.learner_lexical_state(learner_id, status_bucket);

-- =============================================================================
-- Row Level Security (RLS) Configuration
-- =============================================================================

ALTER TABLE public.foundation_lexical_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foundation_representations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_lexical_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_lexical_state ENABLE ROW LEVEL SECURITY;

-- Concepts & Representations: Read-only for authenticated users
CREATE POLICY p_concepts_select_authenticated 
    ON public.foundation_lexical_concepts FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY p_reps_select_authenticated 
    ON public.foundation_representations FOR SELECT 
    TO authenticated 
    USING (true);

-- Evidence: Learner can read own evidence; Teachers can read enrolled students' evidence
CREATE POLICY p_evidence_select 
    ON public.learner_lexical_evidence FOR SELECT 
    TO authenticated 
    USING (
        auth.uid() = learner_id 
        OR auth.uid() = actor_user_id
        OR EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.classrooms c ON c.id = e.classroom_id
            WHERE e.student_id = learner_lexical_evidence.learner_id
              AND c.teacher_id = auth.uid()
        )
    );

-- Evidence: Learner can only insert their own evidence events
CREATE POLICY p_evidence_insert_learner 
    ON public.learner_lexical_evidence FOR INSERT 
    TO authenticated 
    WITH CHECK (
        auth.uid() = learner_id 
        AND auth.uid() = actor_user_id 
        AND evidence_source = 'LEARNER'
    );

-- Evidence: Authorized teachers can insert observation events for enrolled students
CREATE POLICY p_evidence_insert_teacher 
    ON public.learner_lexical_evidence FOR INSERT 
    TO authenticated 
    WITH CHECK (
        auth.uid() = actor_user_id 
        AND evidence_source = 'TEACHER'
        AND EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.classrooms c ON c.id = e.classroom_id
            WHERE e.student_id = learner_lexical_evidence.learner_id
              AND c.teacher_id = auth.uid()
        )
    );

-- NOTE: No UPDATE or DELETE policies are declared on learner_lexical_evidence.
-- This guarantees the table remains an append-only immutable audit ledger.

-- State: Learner can read own state; Teachers can read enrolled students' state
CREATE POLICY p_state_select 
    ON public.learner_lexical_state FOR SELECT 
    TO authenticated 
    USING (
        auth.uid() = learner_id 
        OR EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.classrooms c ON c.id = e.classroom_id
            WHERE e.student_id = learner_lexical_state.learner_id
              AND c.teacher_id = auth.uid()
        )
    );

-- State: Updates/Inserts permitted by own learner or authorized classroom teacher
CREATE POLICY p_state_write 
    ON public.learner_lexical_state FOR ALL 
    TO authenticated 
    USING (
        auth.uid() = learner_id
        OR EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.classrooms c ON c.id = e.classroom_id
            WHERE e.student_id = learner_lexical_state.learner_id
              AND c.teacher_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = learner_id
        OR EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.classrooms c ON c.id = e.classroom_id
            WHERE e.student_id = learner_lexical_state.learner_id
              AND c.teacher_id = auth.uid()
        )
    );

-- =============================================================================
-- Seed Initial 18 Foundation Concepts (Lessons 001-003 Pilot Scope)
-- =============================================================================

INSERT INTO public.foundation_lexical_concepts 
    (id, lemma, pos, ipa, meaning_vi, cluster, generative_power, stage, target_chunks, contrast_concepts)
VALUES
    ('CON-G6-001', 'bag', 'noun', '/bæɡ/', 'cặp sách, ba lô', 'school_nouns', 80, 0, '["This is my [X]", "I have a [X]"]'::jsonb, '["book", "desk"]'::jsonb),
    ('CON-G6-002', 'pen', 'noun', '/pen/', 'bút mực, bút bi', 'school_nouns', 75, 0, '["This is my [X]", "I have a [X]"]'::jsonb, '["pencil", "ruler"]'::jsonb),
    ('CON-G6-003', 'book', 'noun', '/bʊk/', 'quyển sách', 'school_nouns', 85, 0, '["This is my [X]", "Open your [X]"]'::jsonb, '["bag", "desk"]'::jsonb),
    ('CON-G6-004', 'pencil', 'noun', '/ˈpensl/', 'bút chì', 'school_nouns', 70, 0, '["This is my [X]"]'::jsonb, '["pen", "ruler"]'::jsonb),
    ('CON-G6-005', 'ruler', 'noun', '/ˈruːlər/', 'thước kẻ', 'school_nouns', 65, 0, '["This is my [X]"]'::jsonb, '["pencil", "pen"]'::jsonb),
    ('CON-G6-006', 'rubber', 'noun', '/ˈrʌbər/', 'cục tẩy, gôm', 'school_nouns', 65, 0, '["This is my [X]"]'::jsonb, '["pencil", "ruler"]'::jsonb),
    ('CON-G6-007', 'desk', 'noun', '/desk/', 'bàn học', 'school_nouns', 70, 0, '["On the [X]"]'::jsonb, '["chair"]'::jsonb),
    ('CON-G6-008', 'chair', 'noun', '/tʃer/', 'ghế ngồi', 'school_nouns', 70, 0, '["Sit on the [X]"]'::jsonb, '["desk"]'::jsonb),
    ('CON-G6-009', 'water', 'noun', '/ˈwɔːtər/', 'nước uống', 'food_drink', 85, 0, '["I drink [X]", "Water, please"]'::jsonb, '["milk"]'::jsonb),
    ('CON-G6-010', 'milk', 'noun', '/mɪlk/', 'sữa tươi', 'food_drink', 75, 0, '["I drink [X]", "Milk, please"]'::jsonb, '["water"]'::jsonb),
    ('CON-G6-011', 'bread', 'noun', '/bred/', 'bánh mì', 'food_drink', 70, 0, '["I eat [X]"]'::jsonb, '["apple"]'::jsonb),
    ('CON-G6-012', 'apple', 'noun', '/ˈæpl/', 'quả táo', 'food_drink', 65, 0, '["I eat an [X]"]'::jsonb, '["bread"]'::jsonb),
    ('CON-G6-013', 'eat', 'verb', '/iːt/', 'ăn', 'core_verbs', 90, 0, '["I [X] [FOOD]"]'::jsonb, '["drink"]'::jsonb),
    ('CON-G6-014', 'drink', 'verb', '/drɪŋk/', 'uống', 'core_verbs', 90, 0, '["I [X] [DRINK]"]'::jsonb, '["eat"]'::jsonb),
    ('CON-G6-015', 'run', 'verb', '/rʌn/', 'chạy', 'core_verbs', 80, 0, '["I can [X]"]'::jsonb, '["walk", "swim"]'::jsonb),
    ('CON-G6-016', 'read', 'verb', '/riːd/', 'đọc sách', 'core_verbs', 85, 0, '["I [X] a book"]'::jsonb, '["write"]'::jsonb),
    ('CON-G6-017', 'happy', 'adj', '/ˈhæpi/', 'vui vẻ, hạnh phúc', 'states_emotions', 75, 0, '["I am [X]"]'::jsonb, '["sad", "tired"]'::jsonb),
    ('CON-G6-018', 'tired', 'adj', '/ˈtaɪərd/', 'mệt mỏi', 'states_emotions', 75, 0, '["I am [X]"]'::jsonb, '["happy"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    lemma = EXCLUDED.lemma,
    meaning_vi = EXCLUDED.meaning_vi,
    generative_power = EXCLUDED.generative_power,
    target_chunks = EXCLUDED.target_chunks;
