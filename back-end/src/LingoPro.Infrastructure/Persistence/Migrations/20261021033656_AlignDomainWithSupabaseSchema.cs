using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LingoPro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AlignDomainWithSupabaseSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.CreateTable(
                name: "coupons",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    code = table.Column<string>(type: "text", nullable: false),
                    discount_pct = table.Column<int>(type: "integer", nullable: true),
                    discount_amount = table.Column<int>(type: "integer", nullable: true),
                    max_uses = table.Column<int>(type: "integer", nullable: true),
                    used_count = table.Column<int>(type: "integer", nullable: true, defaultValue: 0),
                    valid_from = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    valid_until = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    applicable_plans = table.Column<string[]>(type: "text[]", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: true, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_coupons", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "extension_tokens",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token_hash = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    last_used_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    device_name = table.Column<string>(type: "text", nullable: true),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    revoked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_extension_tokens", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "foundation_lexical_concepts",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<string>(type: "varchar(32)", nullable: false),
                    lemma = table.Column<string>(type: "varchar(64)", nullable: false),
                    pos = table.Column<string>(type: "varchar(16)", nullable: false),
                    ipa = table.Column<string>(type: "varchar(64)", nullable: false),
                    meaning_vi = table.Column<string>(type: "text", nullable: false),
                    cluster = table.Column<string>(type: "varchar(32)", nullable: false),
                    generative_power = table.Column<int>(type: "integer", nullable: false, defaultValue: 50),
                    stage = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    target_chunks = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'[]'::jsonb"),
                    contrast_concepts = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'[]'::jsonb"),
                    created_at = table.Column<DateTime>(type: "timestamptz", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamptz", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_foundation_lexical_concepts", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "global_dictionary",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    word = table.Column<string>(type: "text", nullable: false),
                    tags = table.Column<string[]>(type: "text[]", nullable: true),
                    data = table.Column<string>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    image_url = table.Column<string>(type: "text", nullable: true),
                    image_source = table.Column<string>(type: "text", nullable: true),
                    image_confidence = table.Column<short>(type: "smallint", nullable: true),
                    image_query = table.Column<string>(type: "text", nullable: true),
                    image_verified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_global_dictionary", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "grammar_topics",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    title_vi = table.Column<string>(type: "text", nullable: true),
                    level = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'beginner'"),
                    order_index = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "0"),
                    parent_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_grammar_topics", x => x.id);
                    table.ForeignKey(
                        name: "fk_grammar_topics_grammar_topics_parent_id",
                        column: x => x.parent_id,
                        principalSchema: "public",
                        principalTable: "grammar_topics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "pilot_leads",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    contact_name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    phone = table.Column<string>(type: "text", nullable: false),
                    organization = table.Column<string>(type: "text", nullable: false),
                    teacher_count = table.Column<int>(type: "integer", nullable: false),
                    student_count = table.Column<int>(type: "integer", nullable: false),
                    message = table.Column<string>(type: "text", nullable: true),
                    source = table.Column<string>(type: "text", nullable: false, defaultValue: "teacher_landing"),
                    status = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'new'"),
                    admin_note = table.Column<string>(type: "text", nullable: true),
                    contacted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    converted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pilot_leads", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "profiles",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    full_name = table.Column<string>(type: "text", nullable: true),
                    avatar_url = table.Column<string>(type: "text", nullable: true),
                    role = table.Column<string>(type: "text", nullable: false, defaultValue: "student"),
                    plan = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'free'"),
                    plan_expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    gemini_api_key = table.Column<string>(type: "text", nullable: true),
                    fcm_token = table.Column<string>(type: "text", nullable: true),
                    daily_goal = table.Column<int>(type: "integer", nullable: true, defaultValue: 10),
                    notification_hour = table.Column<int>(type: "integer", nullable: true, defaultValue: 20),
                    last_due_push_slot = table.Column<string>(type: "text", nullable: true),
                    pro_milestone_enrolled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    province = table.Column<string>(type: "text", nullable: true),
                    city = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_profiles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "reading_articles",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    cefr_level = table.Column<string>(type: "text", nullable: false),
                    theme_id = table.Column<string>(type: "text", nullable: false),
                    passage = table.Column<string>(type: "text", nullable: false),
                    passage_plain = table.Column<string>(type: "text", nullable: false),
                    word_count = table.Column<int>(type: "integer", nullable: false, defaultValueSql: "0"),
                    estimated_read_minutes = table.Column<int>(type: "integer", nullable: false, defaultValueSql: "1"),
                    translation = table.Column<string>(type: "text", nullable: true),
                    summary = table.Column<string>(type: "text", nullable: true),
                    cloze = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    questions = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'[]'::jsonb"),
                    vocabulary_highlights = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'[]'::jsonb"),
                    audio_url = table.Column<string>(type: "text", nullable: true),
                    podcast_meta = table.Column<string>(type: "jsonb", nullable: true, defaultValueSql: "'{}'::jsonb"),
                    mindmap_data = table.Column<string>(type: "jsonb", nullable: true, defaultValueSql: "'{}'::jsonb"),
                    source_type = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'custom'"),
                    source_id = table.Column<string>(type: "text", nullable: true),
                    source_metadata = table.Column<string>(type: "jsonb", nullable: true, defaultValueSql: "'{}'::jsonb"),
                    status = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'published'"),
                    difficulty_score = table.Column<double>(type: "double precision", nullable: true, defaultValueSql: "0"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_reading_articles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "referral_campaigns",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    referee_reward_days = table.Column<int>(type: "integer", nullable: false),
                    referrer_reward_days = table.Column<int>(type: "integer", nullable: false),
                    commission_pct = table.Column<int>(type: "integer", nullable: false),
                    ambassador_comm_pct = table.Column<int>(type: "integer", nullable: false),
                    holding_period_days = table.Column<int>(type: "integer", nullable: false),
                    min_payout_amount = table.Column<int>(type: "integer", nullable: false),
                    monthly_ref_cap = table.Column<int>(type: "integer", nullable: false),
                    activation_criteria = table.Column<string>(type: "jsonb", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_referral_campaigns", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "translations",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    source_text = table.Column<string>(type: "text", nullable: false),
                    source_lang = table.Column<string>(type: "text", nullable: false),
                    target_lang = table.Column<string>(type: "text", nullable: false),
                    translated_text = table.Column<string>(type: "text", nullable: false),
                    provider = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_translations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "user_roadmap_assessments",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    track = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'cefr'"),
                    tier = table.Column<string>(type: "text", nullable: false),
                    target_id = table.Column<string>(type: "text", nullable: false),
                    score = table.Column<int>(type: "integer", nullable: false),
                    passed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    details = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    created_at = table.Column<DateTime>(type: "timestamptz", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_roadmap_assessments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "user_roadmap_steps",
                schema: "public",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    step_id = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'completed'"),
                    score = table.Column<int>(type: "integer", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamptz", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamptz", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_roadmap_steps", x => new { x.user_id, x.step_id });
                });

            migrationBuilder.CreateTable(
                name: "user_toeic_question_history",
                schema: "public",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    question_id = table.Column<string>(type: "text", nullable: false),
                    part = table.Column<int>(type: "integer", nullable: false),
                    last_answered_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    is_correct = table.Column<bool>(type: "boolean", nullable: false),
                    attempt_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    selected_option = table.Column<string>(type: "text", nullable: false, defaultValue: ""),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("user_toeic_question_history_pkey", x => new { x.user_id, x.question_id });
                });

            migrationBuilder.CreateTable(
                name: "foundation_representations",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<string>(type: "varchar(64)", nullable: false),
                    concept_id = table.Column<string>(type: "varchar(32)", nullable: false),
                    modality = table.Column<string>(type: "varchar(16)", nullable: false),
                    sub_type = table.Column<string>(type: "varchar(32)", nullable: false),
                    content_payload = table.Column<string>(type: "text", nullable: false),
                    clarity_rating = table.Column<string>(type: "varchar(8)", nullable: false, defaultValueSql: "'V0'"),
                    approved_diagnostic = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    approved_teaching = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    metadata = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    created_at = table.Column<DateTime>(type: "timestamptz", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_foundation_representations", x => x.id);
                    table.ForeignKey(
                        name: "fk_foundation_representations_foundation_lexical_concepts_conc",
                        column: x => x.concept_id,
                        principalSchema: "public",
                        principalTable: "foundation_lexical_concepts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "learner_lexical_state",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    learner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    concept_id = table.Column<string>(type: "varchar(32)", nullable: false),
                    status_bucket = table.Column<string>(type: "varchar(16)", nullable: false, defaultValueSql: "'UNCERTAIN'"),
                    active_gap = table.Column<string>(type: "varchar(32)", nullable: false, defaultValueSql: "'UNKNOWN_CONCEPT_OR_FORM'"),
                    sound_recognition = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    text_recognition = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    meaning_recall = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    form_recall = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    chunk_use = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    generative_use = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    retention_stable = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    uncertainty_score = table.Column<decimal>(type: "numeric(3,2)", nullable: false, defaultValue: 1.00m),
                    last_support_level = table.Column<string>(type: "varchar(16)", nullable: true, defaultValueSql: "'INDEPENDENT'"),
                    last_latency_ms = table.Column<int>(type: "integer", nullable: true),
                    consecutive_independent_passes = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    last_probed_at = table.Column<DateTime>(type: "timestamptz", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamptz", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_learner_lexical_state", x => x.id);
                    table.ForeignKey(
                        name: "fk_learner_lexical_state_foundation_lexical_concepts_concept_id",
                        column: x => x.concept_id,
                        principalSchema: "public",
                        principalTable: "foundation_lexical_concepts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ai_daily_usage",
                schema: "public",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    usage_date = table.Column<DateOnly>(type: "date", nullable: false, defaultValueSql: "current_date"),
                    count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_ai_daily_usage", x => new { x.user_id, x.usage_date });
                    table.ForeignKey(
                        name: "fk_ai_daily_usage_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "challenges",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    duration_days = table.Column<int>(type: "integer", nullable: false),
                    deposit_amount = table.Column<int>(type: "integer", nullable: false),
                    refund_pct = table.Column<int>(type: "integer", nullable: false, defaultValue: 100),
                    bonus_pro_days = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    daily_criteria = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{\"min_srs_reviews\": 10, \"min_quizzes\": 1, \"min_reading_sessions\": 0, \"min_listening_sessions\": 0}'::jsonb"),
                    registration_opens_at = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    registration_closes_at = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    starts_at = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    ends_at = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    max_participants = table.Column<int>(type: "integer", nullable: true),
                    status = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'draft'"),
                    refund_cash_amount = table.Column<int>(type: "integer", nullable: false, defaultValue: 200000),
                    streak_freeze_price = table.Column<int>(type: "integer", nullable: false, defaultValue: 50000),
                    max_streak_freezes = table.Column<int>(type: "integer", nullable: false, defaultValue: 3),
                    created_at = table.Column<DateTime>(type: "timestamptz", nullable: true, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamptz", nullable: true, defaultValueSql: "now()"),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_challenges", x => x.id);
                    table.ForeignKey(
                        name: "fk_challenges_profiles_created_by",
                        column: x => x.created_by,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "classrooms",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    teacher_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    invite_code = table.Column<string>(type: "text", nullable: false, defaultValueSql: "upper(substring(md5(random()::text), 1, 6))"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_classrooms", x => x.id);
                    table.ForeignKey(
                        name: "fk_classrooms_profiles_teacher_id",
                        column: x => x.teacher_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "fcm_tokens",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token = table.Column<string>(type: "text", nullable: false),
                    device_label = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    last_used_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_fcm_tokens", x => x.id);
                    table.ForeignKey(
                        name: "fk_fcm_tokens_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "grammar_lessons",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    topic_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    theory = table.Column<string>(type: "text", nullable: true),
                    theory_vi = table.Column<string>(type: "text", nullable: true),
                    examples = table.Column<string>(type: "jsonb", nullable: true, defaultValueSql: "'[]'"),
                    image_url = table.Column<string>(type: "text", nullable: true),
                    image_source = table.Column<string>(type: "text", nullable: true),
                    image_confidence = table.Column<short>(type: "smallint", nullable: true),
                    source = table.Column<string>(type: "text", nullable: true),
                    source_url = table.Column<string>(type: "text", nullable: true),
                    order_index = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "0"),
                    sections = table.Column<string>(type: "jsonb", nullable: true),
                    exercises = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_grammar_lessons", x => x.id);
                    table.ForeignKey(
                        name: "fk_grammar_lessons_grammar_topics_topic_id",
                        column: x => x.topic_id,
                        principalSchema: "public",
                        principalTable: "grammar_topics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_grammar_lessons_profiles_created_by",
                        column: x => x.created_by,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "grammar_micro_progress",
                schema: "public",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    stage = table.Column<string>(type: "text", nullable: false),
                    completed_steps = table.Column<int[]>(type: "integer[]", nullable: false, defaultValueSql: "'{}'"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_grammar_micro_progress", x => new { x.user_id, x.stage });
                    table.ForeignKey(
                        name: "fk_grammar_micro_progress_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "orders",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    plan = table.Column<string>(type: "text", nullable: false),
                    amount = table.Column<int>(type: "integer", nullable: false),
                    currency = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'VND'"),
                    payment_method = table.Column<string>(type: "text", nullable: true),
                    payment_ref = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'pending'"),
                    note = table.Column<string>(type: "text", nullable: true),
                    coupon_code = table.Column<string>(type: "text", nullable: true),
                    period_months = table.Column<int>(type: "integer", nullable: true, defaultValue: 1),
                    starts_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    paid_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    processed_by = table.Column<Guid>(type: "uuid", nullable: true),
                    order_kind = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'individual'"),
                    seats = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_orders", x => x.id);
                    table.ForeignKey(
                        name: "fk_orders_profiles_processed_by",
                        column: x => x.processed_by,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_orders_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "payout_requests",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<int>(type: "integer", nullable: false),
                    bank_name = table.Column<string>(type: "text", nullable: false),
                    bank_account_number = table.Column<string>(type: "text", nullable: false),
                    bank_account_holder = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    admin_note = table.Column<string>(type: "text", nullable: true),
                    processed_by = table.Column<Guid>(type: "uuid", nullable: true),
                    processed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_payout_requests", x => x.id);
                    table.ForeignKey(
                        name: "fk_payout_requests_profiles_processed_by",
                        column: x => x.processed_by,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_payout_requests_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "referral_links",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    referral_code = table.Column<string>(type: "text", nullable: false),
                    custom_slug = table.Column<string>(type: "text", nullable: true),
                    clicks_count = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_referral_links", x => x.id);
                    table.ForeignKey(
                        name: "fk_referral_links_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "room_presence",
                schema: "public",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    room_id = table.Column<string>(type: "text", nullable: false),
                    display_name = table.Column<string>(type: "text", nullable: false),
                    activity_key = table.Column<string>(type: "text", nullable: false),
                    activity_label = table.Column<string>(type: "text", nullable: false),
                    last_seen_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_room_presence", x => x.user_id);
                    table.ForeignKey(
                        name: "fk_room_presence_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "toeic_test_results",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    test_id = table.Column<string>(type: "text", nullable: false),
                    exam_type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    listening_correct = table.Column<int>(type: "integer", nullable: false),
                    reading_correct = table.Column<int>(type: "integer", nullable: false),
                    listening_scaled_score = table.Column<int>(type: "integer", nullable: false),
                    reading_scaled_score = table.Column<int>(type: "integer", nullable: false),
                    total_score = table.Column<int>(type: "integer", nullable: false),
                    duration_seconds = table.Column<int>(type: "integer", nullable: false),
                    answers_json = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_toeic_test_results", x => x.id);
                    table.ForeignKey(
                        name: "fk_toeic_test_results_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_gamification",
                schema: "public",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    total_xp = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    current_streak = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    longest_streak = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    last_active_date = table.Column<DateOnly>(type: "date", nullable: true),
                    daily_goal = table.Column<int>(type: "integer", nullable: false, defaultValue: 30),
                    today_xp = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    today_date = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_gamification", x => x.user_id);
                    table.ForeignKey(
                        name: "fk_user_gamification_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_roadmap",
                schema: "public",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    track = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'cefr'"),
                    roadmap_version = table.Column<string>(type: "text", nullable: false, defaultValueSql: "'roadmap-v1'"),
                    level_id = table.Column<string>(type: "text", nullable: false),
                    current_unit_id = table.Column<string>(type: "text", nullable: true),
                    placement = table.Column<string>(type: "jsonb", nullable: true),
                    started_at = table.Column<DateTime>(type: "timestamptz", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamptz", nullable: false, defaultValueSql: "now()"),
                    profile_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("user_roadmap_pkey", x => new { x.user_id, x.track });
                    table.ForeignKey(
                        name: "fk_user_roadmap_profiles_profile_id",
                        column: x => x.profile_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "user_vocab_packs",
                schema: "public",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    pack_id = table.Column<string>(type: "text", nullable: false),
                    catalog_version = table.Column<string>(type: "text", nullable: false),
                    topic_id = table.Column<string>(type: "text", nullable: false),
                    topic_title = table.Column<string>(type: "text", nullable: false),
                    pack_index = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    word_count = table.Column<int>(type: "integer", nullable: false),
                    reviewed_count = table.Column<int>(type: "integer", nullable: false),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_studied_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_vocab_packs", x => new { x.user_id, x.pack_id });
                    table.ForeignKey(
                        name: "fk_user_vocab_packs_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_reading_library_progress",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    article_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'in_progress'"),
                    is_bookmarked = table.Column<bool>(type: "boolean", nullable: true, defaultValueSql: "false"),
                    read_count = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "0"),
                    last_read_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    reading_time_seconds = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "0"),
                    mcq_score = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "0"),
                    mcq_total = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "0"),
                    cloze_score = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "0"),
                    cloze_total = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "0"),
                    user_notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_reading_library_progress", x => x.id);
                    table.ForeignKey(
                        name: "fk_user_reading_library_progress_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_user_reading_library_progress_reading_articles_article_id",
                        column: x => x.article_id,
                        principalSchema: "public",
                        principalTable: "reading_articles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "learner_lexical_evidence",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    actor_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    learner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    evidence_source = table.Column<string>(type: "varchar(16)", nullable: false, defaultValueSql: "'LEARNER'"),
                    concept_id = table.Column<string>(type: "varchar(32)", nullable: false),
                    representation_id = table.Column<string>(type: "varchar(64)", nullable: true),
                    probe_mode = table.Column<string>(type: "varchar(32)", nullable: false),
                    target_dimension = table.Column<string>(type: "varchar(32)", nullable: false),
                    is_correct = table.Column<bool>(type: "boolean", nullable: false),
                    support_level = table.Column<string>(type: "varchar(16)", nullable: false),
                    response_latency_ms = table.Column<int>(type: "integer", nullable: false),
                    distractor_selected = table.Column<string>(type: "varchar(64)", nullable: true),
                    lesson_id = table.Column<string>(type: "varchar(32)", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamptz", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_learner_lexical_evidence", x => x.id);
                    table.ForeignKey(
                        name: "fk_learner_lexical_evidence_foundation_lexical_concepts_concep",
                        column: x => x.concept_id,
                        principalSchema: "public",
                        principalTable: "foundation_lexical_concepts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_learner_lexical_evidence_foundation_representations_represe",
                        column: x => x.representation_id,
                        principalSchema: "public",
                        principalTable: "foundation_representations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "daily_reading_exercises",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    classroom_id = table.Column<Guid>(type: "uuid", nullable: true),
                    target_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    exercise_date = table.Column<DateOnly>(type: "date", nullable: false),
                    source_date = table.Column<DateOnly>(type: "date", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    passage = table.Column<string>(type: "text", nullable: false),
                    passage_plain = table.Column<string>(type: "text", nullable: false),
                    level = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'A2'"),
                    questions = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'[]'"),
                    cloze = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'"),
                    source_words = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'[]'"),
                    used_words = table.Column<string[]>(type: "text[]", nullable: true, defaultValueSql: "'{}'"),
                    coverage = table.Column<double>(type: "double precision", nullable: true, defaultValueSql: "0"),
                    bonus_words = table.Column<string>(type: "jsonb", nullable: true, defaultValueSql: "'[]'"),
                    status = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'ready'"),
                    error_message = table.Column<string>(type: "text", nullable: true),
                    generated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    generation_meta = table.Column<string>(type: "jsonb", nullable: true, defaultValueSql: "'{}'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_daily_reading_exercises", x => x.id);
                    table.ForeignKey(
                        name: "fk_daily_reading_exercises_classrooms_classroom_id",
                        column: x => x.classroom_id,
                        principalSchema: "public",
                        principalTable: "classrooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_daily_reading_exercises_profiles_target_user_id",
                        column: x => x.target_user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "enrollments",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    classroom_id = table.Column<Guid>(type: "uuid", nullable: false),
                    joined_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_enrollments", x => x.id);
                    table.ForeignKey(
                        name: "fk_enrollments_classrooms_classroom_id",
                        column: x => x.classroom_id,
                        principalSchema: "public",
                        principalTable: "classrooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_enrollments_profiles_student_id",
                        column: x => x.student_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "quiz_results",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    classroom_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quiz_type = table.Column<string>(type: "text", nullable: true),
                    score = table.Column<int>(type: "integer", nullable: false),
                    total_questions = table.Column<int>(type: "integer", nullable: false),
                    accuracy = table.Column<double>(type: "double precision", nullable: true, computedColumnSql: "score::float / total_questions", stored: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_quiz_results", x => x.id);
                    table.ForeignKey(
                        name: "fk_quiz_results_classrooms_classroom_id",
                        column: x => x.classroom_id,
                        principalSchema: "public",
                        principalTable: "classrooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_quiz_results_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_daily_stats",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    classroom_id = table.Column<Guid>(type: "uuid", nullable: false),
                    vms = table.Column<int>(type: "integer", nullable: false),
                    lcs = table.Column<int>(type: "integer", nullable: false),
                    total_words = table.Column<int>(type: "integer", nullable: false),
                    recorded_at = table.Column<DateOnly>(type: "date", nullable: false, defaultValueSql: "current_date")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_student_daily_stats", x => x.id);
                    table.ForeignKey(
                        name: "fk_student_daily_stats_classrooms_classroom_id",
                        column: x => x.classroom_id,
                        principalSchema: "public",
                        principalTable: "classrooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_student_daily_stats_profiles_student_id",
                        column: x => x.student_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "words",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    classroom_id = table.Column<Guid>(type: "uuid", nullable: false),
                    added_by = table.Column<Guid>(type: "uuid", nullable: true),
                    word = table.Column<string>(type: "text", nullable: false),
                    translation = table.Column<string>(type: "text", nullable: true),
                    ipa = table.Column<string>(type: "text", nullable: true),
                    pos = table.Column<string>(type: "text", nullable: true),
                    example = table.Column<string>(type: "text", nullable: true),
                    example_vi = table.Column<string>(type: "text", nullable: true),
                    source_url = table.Column<string>(type: "text", nullable: true),
                    image_url = table.Column<string>(type: "text", nullable: true),
                    dictionary_data = table.Column<string>(type: "jsonb", nullable: true),
                    image_source = table.Column<string>(type: "text", nullable: true),
                    image_confidence = table.Column<short>(type: "smallint", nullable: true),
                    synonyms = table.Column<string[]>(type: "text[]", nullable: true),
                    antonyms = table.Column<string[]>(type: "text[]", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_words", x => x.id);
                    table.ForeignKey(
                        name: "fk_words_classrooms_classroom_id",
                        column: x => x.classroom_id,
                        principalSchema: "public",
                        principalTable: "classrooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_words_profiles_added_by",
                        column: x => x.added_by,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "grammar_exercises",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    classroom_id = table.Column<Guid>(type: "uuid", nullable: false),
                    topic = table.Column<string>(type: "text", nullable: false),
                    level = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'beginner'"),
                    question = table.Column<string>(type: "text", nullable: false),
                    options = table.Column<string[]>(type: "text[]", nullable: false),
                    correct_answer = table.Column<string>(type: "text", nullable: false),
                    explanation = table.Column<string>(type: "text", nullable: true),
                    type = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'multiple_choice'"),
                    difficulty = table.Column<short>(type: "smallint", nullable: true, defaultValueSql: "2"),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    lesson_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_grammar_exercises", x => x.id);
                    table.ForeignKey(
                        name: "fk_grammar_exercises_classrooms_classroom_id",
                        column: x => x.classroom_id,
                        principalSchema: "public",
                        principalTable: "classrooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_grammar_exercises_grammar_lessons_lesson_id",
                        column: x => x.lesson_id,
                        principalSchema: "public",
                        principalTable: "grammar_lessons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_grammar_exercises_profiles_created_by",
                        column: x => x.created_by,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "grammar_progress",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    lesson_id = table.Column<Guid>(type: "uuid", nullable: false),
                    stability = table.Column<double>(type: "double precision", nullable: true, defaultValueSql: "0"),
                    difficulty = table.Column<double>(type: "double precision", nullable: true, defaultValueSql: "0"),
                    interval_days = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "0"),
                    review_count = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "0"),
                    next_review_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    last_reviewed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    state = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'new'"),
                    mastery_score = table.Column<short>(type: "smallint", nullable: true, defaultValueSql: "0"),
                    lapses = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "0"),
                    learning_steps = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "0")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_grammar_progress", x => x.id);
                    table.ForeignKey(
                        name: "fk_grammar_progress_grammar_lessons_lesson_id",
                        column: x => x.lesson_id,
                        principalSchema: "public",
                        principalTable: "grammar_lessons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_grammar_progress_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "grammar_quiz_cache",
                schema: "public",
                columns: table => new
                {
                    lesson_id = table.Column<Guid>(type: "uuid", nullable: false),
                    questions = table.Column<string>(type: "jsonb", nullable: false),
                    model = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_grammar_quiz_cache", x => x.lesson_id);
                    table.ForeignKey(
                        name: "fk_grammar_quiz_cache_grammar_lessons_lesson_id",
                        column: x => x.lesson_id,
                        principalSchema: "public",
                        principalTable: "grammar_lessons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "challenge_participants",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    challenge_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'pending'"),
                    joined_at = table.Column<DateTime>(type: "timestamptz", nullable: true, defaultValueSql: "now()"),
                    activated_at = table.Column<DateTime>(type: "timestamptz", nullable: true),
                    failed_at = table.Column<DateTime>(type: "timestamptz", nullable: true),
                    failed_reason = table.Column<string>(type: "text", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamptz", nullable: true),
                    refunded_at = table.Column<DateTime>(type: "timestamptz", nullable: true),
                    refund_amount = table.Column<int>(type: "integer", nullable: true),
                    bonus_expires_at = table.Column<DateTime>(type: "timestamptz", nullable: true),
                    current_streak = table.Column<int>(type: "integer", nullable: true, defaultValue: 0),
                    longest_streak = table.Column<int>(type: "integer", nullable: true, defaultValue: 0),
                    total_active_days = table.Column<int>(type: "integer", nullable: true, defaultValue: 0),
                    streak_freezes_used = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    reward_choice = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_challenge_participants", x => x.id);
                    table.ForeignKey(
                        name: "fk_challenge_participants_challenges_challenge_id",
                        column: x => x.challenge_id,
                        principalSchema: "public",
                        principalTable: "challenges",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_challenge_participants_orders_order_id",
                        column: x => x.order_id,
                        principalSchema: "public",
                        principalTable: "orders",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_challenge_participants_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "groups",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan = table.Column<string>(type: "text", nullable: false),
                    seat_limit = table.Column<int>(type: "integer", nullable: false),
                    invite_code = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    starts_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_groups", x => x.id);
                    table.ForeignKey(
                        name: "fk_groups_orders_order_id",
                        column: x => x.order_id,
                        principalSchema: "public",
                        principalTable: "orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_groups_profiles_owner_id",
                        column: x => x.owner_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "referral_logs",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    referrer_id = table.Column<Guid>(type: "uuid", nullable: true),
                    referee_id = table.Column<Guid>(type: "uuid", nullable: false),
                    campaign_id = table.Column<Guid>(type: "uuid", nullable: true),
                    referral_code = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    ip_address = table.Column<string>(type: "text", nullable: true),
                    ip_subnet = table.Column<string>(type: "text", nullable: true),
                    device_fingerprint = table.Column<string>(type: "text", nullable: true),
                    risk_score = table.Column<int>(type: "integer", nullable: false),
                    flagged_reason = table.Column<string>(type: "text", nullable: true),
                    activated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    converted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    first_order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_referral_logs", x => x.id);
                    table.ForeignKey(
                        name: "fk_referral_logs_orders_first_order_id",
                        column: x => x.first_order_id,
                        principalSchema: "public",
                        principalTable: "orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_referral_logs_profiles_referee_id",
                        column: x => x.referee_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_referral_logs_profiles_referrer_id",
                        column: x => x.referrer_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_referral_logs_referral_campaigns_campaign_id",
                        column: x => x.campaign_id,
                        principalSchema: "public",
                        principalTable: "referral_campaigns",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "subscription_history",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    old_plan = table.Column<string>(type: "text", nullable: true),
                    new_plan = table.Column<string>(type: "text", nullable: false),
                    reason = table.Column<string>(type: "text", nullable: true),
                    order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    changed_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_subscription_history", x => x.id);
                    table.ForeignKey(
                        name: "fk_subscription_history_orders_order_id",
                        column: x => x.order_id,
                        principalSchema: "public",
                        principalTable: "orders",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_subscription_history_profiles_changed_by",
                        column: x => x.changed_by,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_subscription_history_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "daily_reading_completions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    exercise_id = table.Column<Guid>(type: "uuid", nullable: false),
                    mcq_score = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "0"),
                    mcq_total = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "0"),
                    cloze_score = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "0"),
                    cloze_total = table.Column<int>(type: "integer", nullable: true, defaultValueSql: "0"),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_daily_reading_completions", x => x.id);
                    table.ForeignKey(
                        name: "fk_daily_reading_completions_daily_reading_exercises_exercise_",
                        column: x => x.exercise_id,
                        principalSchema: "public",
                        principalTable: "daily_reading_exercises",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_daily_reading_completions_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "srs_progress",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    word_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ease_factor = table.Column<double>(type: "double precision", nullable: true),
                    interval_days = table.Column<int>(type: "integer", nullable: true),
                    review_count = table.Column<int>(type: "integer", nullable: true),
                    next_review_date = table.Column<DateTime>(type: "timestamptz", nullable: true),
                    last_reviewed_at = table.Column<DateTime>(type: "timestamptz", nullable: true),
                    stability = table.Column<double>(type: "double precision", nullable: true),
                    difficulty = table.Column<double>(type: "double precision", nullable: true),
                    state = table.Column<int>(type: "integer", nullable: true),
                    algorithm_version = table.Column<string>(type: "text", nullable: true),
                    lapses = table.Column<int>(type: "integer", nullable: true),
                    learning_steps = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_srs_progress", x => x.id);
                    table.ForeignKey(
                        name: "fk_srs_progress_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_srs_progress_words_word_id",
                        column: x => x.word_id,
                        principalSchema: "public",
                        principalTable: "words",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "srs_review_events",
                schema: "public",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    review_id = table.Column<Guid>(type: "uuid", nullable: false),
                    word_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quality = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_srs_review_events", x => new { x.user_id, x.review_id });
                    table.ForeignKey(
                        name: "fk_srs_review_events_words_word_id",
                        column: x => x.word_id,
                        principalSchema: "public",
                        principalTable: "words",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_vocab_pack_words",
                schema: "public",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    pack_id = table.Column<string>(type: "text", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    word_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_vocab_pack_words", x => new { x.user_id, x.pack_id, x.position });
                    table.ForeignKey(
                        name: "fk_user_vocab_pack_words_user_vocab_packs_user_id_pack_id",
                        columns: x => new { x.user_id, x.pack_id },
                        principalSchema: "public",
                        principalTable: "user_vocab_packs",
                        principalColumns: new[] { "user_id", "pack_id" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_user_vocab_pack_words_words_word_id",
                        column: x => x.word_id,
                        principalSchema: "public",
                        principalTable: "words",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "grammar_results",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    exercise_id = table.Column<Guid>(type: "uuid", nullable: false),
                    chosen_answer = table.Column<string>(type: "text", nullable: false),
                    is_correct = table.Column<bool>(type: "boolean", nullable: true, defaultValueSql: "false"),
                    time_taken_ms = table.Column<int>(type: "integer", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_grammar_results", x => x.id);
                    table.ForeignKey(
                        name: "fk_grammar_results_grammar_exercises_exercise_id",
                        column: x => x.exercise_id,
                        principalSchema: "public",
                        principalTable: "grammar_exercises",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_grammar_results_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "challenge_daily_log",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    participant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    challenge_id = table.Column<Guid>(type: "uuid", nullable: false),
                    log_date = table.Column<DateOnly>(type: "date", nullable: false),
                    srs_reviews = table.Column<int>(type: "integer", nullable: true, defaultValue: 0),
                    quizzes_done = table.Column<int>(type: "integer", nullable: true, defaultValue: 0),
                    reading_sessions = table.Column<int>(type: "integer", nullable: true, defaultValue: 0),
                    listening_sessions = table.Column<int>(type: "integer", nullable: true, defaultValue: 0),
                    xp_earned = table.Column<int>(type: "integer", nullable: true, defaultValue: 0),
                    criteria_met = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    checked_at = table.Column<DateTime>(type: "timestamptz", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_challenge_daily_log", x => x.id);
                    table.ForeignKey(
                        name: "fk_challenge_daily_log_challenge_participants_participant_id",
                        column: x => x.participant_id,
                        principalSchema: "public",
                        principalTable: "challenge_participants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_challenge_daily_log_challenges_challenge_id",
                        column: x => x.challenge_id,
                        principalSchema: "public",
                        principalTable: "challenges",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_challenge_daily_log_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "group_members",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    group_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    joined_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_group_members", x => x.id);
                    table.ForeignKey(
                        name: "fk_group_members_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_group_members_study_groups_group_id",
                        column: x => x.group_id,
                        principalSchema: "public",
                        principalTable: "groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "reward_transactions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    referral_log_id = table.Column<Guid>(type: "uuid", nullable: true),
                    order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    reward_type = table.Column<string>(type: "text", nullable: false),
                    pro_days = table.Column<int>(type: "integer", nullable: false),
                    amount = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    available_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    note = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_reward_transactions", x => x.id);
                    table.ForeignKey(
                        name: "fk_reward_transactions_orders_order_id",
                        column: x => x.order_id,
                        principalSchema: "public",
                        principalTable: "orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_reward_transactions_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_reward_transactions_referral_logs_referral_log_id",
                        column: x => x.referral_log_id,
                        principalSchema: "public",
                        principalTable: "referral_logs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "idx_challenge_daily_log_date",
                schema: "public",
                table: "challenge_daily_log",
                column: "log_date");

            migrationBuilder.CreateIndex(
                name: "idx_challenge_daily_log_participant",
                schema: "public",
                table: "challenge_daily_log",
                column: "participant_id");

            migrationBuilder.CreateIndex(
                name: "ix_challenge_daily_log_challenge_id",
                schema: "public",
                table: "challenge_daily_log",
                column: "challenge_id");

            migrationBuilder.CreateIndex(
                name: "ix_challenge_daily_log_participant_id_log_date",
                schema: "public",
                table: "challenge_daily_log",
                columns: new[] { "participant_id", "log_date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_challenge_daily_log_user_id",
                schema: "public",
                table: "challenge_daily_log",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_challenge_participants_challenge",
                schema: "public",
                table: "challenge_participants",
                column: "challenge_id");

            migrationBuilder.CreateIndex(
                name: "idx_challenge_participants_challenge_status",
                schema: "public",
                table: "challenge_participants",
                columns: new[] { "challenge_id", "status" });

            migrationBuilder.CreateIndex(
                name: "idx_challenge_participants_status",
                schema: "public",
                table: "challenge_participants",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_challenge_participants_user",
                schema: "public",
                table: "challenge_participants",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_challenge_participants_challenge_id_user_id",
                schema: "public",
                table: "challenge_participants",
                columns: new[] { "challenge_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_challenge_participants_order_id",
                schema: "public",
                table: "challenge_participants",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "idx_challenges_slug",
                schema: "public",
                table: "challenges",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_challenges_starts_at",
                schema: "public",
                table: "challenges",
                column: "starts_at");

            migrationBuilder.CreateIndex(
                name: "idx_challenges_status",
                schema: "public",
                table: "challenges",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_challenges_created_by",
                schema: "public",
                table: "challenges",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "idx_classrooms_teacher_name",
                schema: "public",
                table: "classrooms",
                columns: new[] { "teacher_id", "name" });

            migrationBuilder.CreateIndex(
                name: "ix_classrooms_invite_code",
                schema: "public",
                table: "classrooms",
                column: "invite_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_coupons_code",
                schema: "public",
                table: "coupons",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_daily_reading_completions_exercise_id",
                schema: "public",
                table: "daily_reading_completions",
                column: "exercise_id");

            migrationBuilder.CreateIndex(
                name: "ix_daily_reading_completions_user_id_exercise_id",
                schema: "public",
                table: "daily_reading_completions",
                columns: new[] { "user_id", "exercise_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "daily_reading_exercises_class_date_uidx",
                schema: "public",
                table: "daily_reading_exercises",
                columns: new[] { "classroom_id", "exercise_date" },
                unique: true,
                descending: new[] { false, true },
                filter: "target_user_id is null");

            migrationBuilder.CreateIndex(
                name: "daily_reading_exercises_date_status_idx",
                schema: "public",
                table: "daily_reading_exercises",
                columns: new[] { "exercise_date", "status" });

            migrationBuilder.CreateIndex(
                name: "daily_reading_exercises_user_date_uidx",
                schema: "public",
                table: "daily_reading_exercises",
                columns: new[] { "target_user_id", "exercise_date" },
                unique: true,
                filter: "target_user_id is not null");

            migrationBuilder.CreateIndex(
                name: "ix_daily_reading_exercises_classroom_id_exercise_date_target_u",
                schema: "public",
                table: "daily_reading_exercises",
                columns: new[] { "classroom_id", "exercise_date", "target_user_id" },
                unique: true)
                .Annotation("Npgsql:NullsDistinct", false);

            migrationBuilder.CreateIndex(
                name: "idx_enrollments_classroom",
                schema: "public",
                table: "enrollments",
                column: "classroom_id");

            migrationBuilder.CreateIndex(
                name: "idx_enrollments_student",
                schema: "public",
                table: "enrollments",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "ix_enrollments_student_id_classroom_id",
                schema: "public",
                table: "enrollments",
                columns: new[] { "student_id", "classroom_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_extension_tokens_user_active",
                schema: "public",
                table: "extension_tokens",
                columns: new[] { "user_id", "created_at" },
                descending: new[] { false, true },
                filter: "revoked_at is null");

            migrationBuilder.CreateIndex(
                name: "ix_extension_tokens_token_hash",
                schema: "public",
                table: "extension_tokens",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_fcm_tokens_user",
                schema: "public",
                table: "fcm_tokens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_fcm_tokens_user_id_token",
                schema: "public",
                table: "fcm_tokens",
                columns: new[] { "user_id", "token" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_foundation_concepts_cluster_gp",
                schema: "public",
                table: "foundation_lexical_concepts",
                columns: new[] { "cluster", "generative_power" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "idx_foundation_reps_concept_modality",
                schema: "public",
                table: "foundation_representations",
                columns: new[] { "concept_id", "modality" });

            migrationBuilder.CreateIndex(
                name: "ix_global_dictionary_word",
                schema: "public",
                table: "global_dictionary",
                column: "word",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_grammar_exercises_difficulty",
                schema: "public",
                table: "grammar_exercises",
                columns: new[] { "classroom_id", "difficulty" });

            migrationBuilder.CreateIndex(
                name: "ix_grammar_exercises_created_by",
                schema: "public",
                table: "grammar_exercises",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_grammar_exercises_lesson_id",
                schema: "public",
                table: "grammar_exercises",
                column: "lesson_id");

            migrationBuilder.CreateIndex(
                name: "idx_grammar_lessons_topic",
                schema: "public",
                table: "grammar_lessons",
                column: "topic_id");

            migrationBuilder.CreateIndex(
                name: "ix_grammar_lessons_created_by",
                schema: "public",
                table: "grammar_lessons",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "idx_grammar_progress_user",
                schema: "public",
                table: "grammar_progress",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_grammar_progress_user_reviewed",
                schema: "public",
                table: "grammar_progress",
                columns: new[] { "user_id", "last_reviewed_at" });

            migrationBuilder.CreateIndex(
                name: "ix_grammar_progress_lesson_id",
                schema: "public",
                table: "grammar_progress",
                column: "lesson_id");

            migrationBuilder.CreateIndex(
                name: "ix_grammar_progress_user_id_lesson_id",
                schema: "public",
                table: "grammar_progress",
                columns: new[] { "user_id", "lesson_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_grammar_results_user_exercise",
                schema: "public",
                table: "grammar_results",
                columns: new[] { "user_id", "exercise_id" });

            migrationBuilder.CreateIndex(
                name: "ix_grammar_results_exercise_id",
                schema: "public",
                table: "grammar_results",
                column: "exercise_id");

            migrationBuilder.CreateIndex(
                name: "ix_grammar_topics_parent_id",
                schema: "public",
                table: "grammar_topics",
                column: "parent_id");

            migrationBuilder.CreateIndex(
                name: "ix_grammar_topics_slug",
                schema: "public",
                table: "grammar_topics",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_group_members_group_id_user_id",
                schema: "public",
                table: "group_members",
                columns: new[] { "group_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_group_members_user_id",
                schema: "public",
                table: "group_members",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_groups_invite_code",
                schema: "public",
                table: "groups",
                column: "invite_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_groups_order_id",
                schema: "public",
                table: "groups",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "ix_groups_owner_id",
                schema: "public",
                table: "groups",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "idx_learner_evidence_stream",
                schema: "public",
                table: "learner_lexical_evidence",
                columns: new[] { "learner_id", "concept_id", "created_at" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "ix_learner_lexical_evidence_concept_id",
                schema: "public",
                table: "learner_lexical_evidence",
                column: "concept_id");

            migrationBuilder.CreateIndex(
                name: "ix_learner_lexical_evidence_representation_id",
                schema: "public",
                table: "learner_lexical_evidence",
                column: "representation_id");

            migrationBuilder.CreateIndex(
                name: "idx_learner_lexical_state_bucket",
                schema: "public",
                table: "learner_lexical_state",
                columns: new[] { "learner_id", "status_bucket" });

            migrationBuilder.CreateIndex(
                name: "ix_learner_lexical_state_concept_id",
                schema: "public",
                table: "learner_lexical_state",
                column: "concept_id");

            migrationBuilder.CreateIndex(
                name: "uq_learner_lexical_state",
                schema: "public",
                table: "learner_lexical_state",
                columns: new[] { "learner_id", "concept_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_orders_created_at",
                schema: "public",
                table: "orders",
                column: "created_at",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "idx_orders_payment_ref_unique",
                schema: "public",
                table: "orders",
                column: "payment_ref",
                unique: true,
                filter: "payment_ref is not null");

            migrationBuilder.CreateIndex(
                name: "idx_orders_status",
                schema: "public",
                table: "orders",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_orders_user_id",
                schema: "public",
                table: "orders",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_orders_processed_by",
                schema: "public",
                table: "orders",
                column: "processed_by");

            migrationBuilder.CreateIndex(
                name: "ix_payout_requests_processed_by",
                schema: "public",
                table: "payout_requests",
                column: "processed_by");

            migrationBuilder.CreateIndex(
                name: "ix_payout_requests_user_id",
                schema: "public",
                table: "payout_requests",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_pilot_leads_status_created",
                schema: "public",
                table: "pilot_leads",
                columns: new[] { "status", "created_at" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "idx_profiles_fcm_token",
                schema: "public",
                table: "profiles",
                column: "fcm_token",
                filter: "fcm_token is not null");

            migrationBuilder.CreateIndex(
                name: "idx_profiles_plan_expires",
                schema: "public",
                table: "profiles",
                column: "plan_expires_at",
                filter: "plan_expires_at is not null");

            migrationBuilder.CreateIndex(
                name: "idx_profiles_pro_milestone_enrolled",
                schema: "public",
                table: "profiles",
                column: "pro_milestone_enrolled_at",
                filter: "pro_milestone_enrolled_at is not null");

            migrationBuilder.CreateIndex(
                name: "idx_profiles_province",
                schema: "public",
                table: "profiles",
                column: "province",
                filter: "province is not null");

            migrationBuilder.CreateIndex(
                name: "ix_quiz_results_classroom_id",
                schema: "public",
                table: "quiz_results",
                column: "classroom_id");

            migrationBuilder.CreateIndex(
                name: "ix_quiz_results_user_id",
                schema: "public",
                table: "quiz_results",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_reading_articles_slug",
                schema: "public",
                table: "reading_articles",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "reading_articles_created_idx",
                schema: "public",
                table: "reading_articles",
                column: "created_at",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "reading_articles_level_theme_status_idx",
                schema: "public",
                table: "reading_articles",
                columns: new[] { "cefr_level", "theme_id", "status" });

            migrationBuilder.CreateIndex(
                name: "reading_articles_source_idx",
                schema: "public",
                table: "reading_articles",
                columns: new[] { "source_type", "source_id" });

            migrationBuilder.CreateIndex(
                name: "reading_articles_theme_status_idx",
                schema: "public",
                table: "reading_articles",
                columns: new[] { "theme_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_referral_campaigns_slug",
                schema: "public",
                table: "referral_campaigns",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_referral_links_custom_slug",
                schema: "public",
                table: "referral_links",
                column: "custom_slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_referral_links_referral_code",
                schema: "public",
                table: "referral_links",
                column: "referral_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_referral_links_user_id",
                schema: "public",
                table: "referral_links",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_referral_logs_campaign_id",
                schema: "public",
                table: "referral_logs",
                column: "campaign_id");

            migrationBuilder.CreateIndex(
                name: "ix_referral_logs_first_order_id",
                schema: "public",
                table: "referral_logs",
                column: "first_order_id");

            migrationBuilder.CreateIndex(
                name: "ix_referral_logs_referee_id",
                schema: "public",
                table: "referral_logs",
                column: "referee_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_referral_logs_referrer_id",
                schema: "public",
                table: "referral_logs",
                column: "referrer_id");

            migrationBuilder.CreateIndex(
                name: "ix_reward_transactions_order_id_user_id",
                schema: "public",
                table: "reward_transactions",
                columns: new[] { "order_id", "user_id" },
                unique: true,
                filter: "reward_type IN ('affiliate_cash', 'cash_commission')");

            migrationBuilder.CreateIndex(
                name: "ix_reward_transactions_referral_log_id",
                schema: "public",
                table: "reward_transactions",
                column: "referral_log_id");

            migrationBuilder.CreateIndex(
                name: "ix_reward_transactions_user_id",
                schema: "public",
                table: "reward_transactions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_srs_progress_user_id_word_id",
                schema: "public",
                table: "srs_progress",
                columns: new[] { "user_id", "word_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_srs_progress_word_id",
                schema: "public",
                table: "srs_progress",
                column: "word_id");

            migrationBuilder.CreateIndex(
                name: "ix_srs_review_events_word_id",
                schema: "public",
                table: "srs_review_events",
                column: "word_id");

            migrationBuilder.CreateIndex(
                name: "ix_student_daily_stats_classroom_id",
                schema: "public",
                table: "student_daily_stats",
                column: "classroom_id");

            migrationBuilder.CreateIndex(
                name: "ix_student_daily_stats_student_id_recorded_at",
                schema: "public",
                table: "student_daily_stats",
                columns: new[] { "student_id", "recorded_at" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_subscription_history_user",
                schema: "public",
                table: "subscription_history",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_subscription_history_changed_by",
                schema: "public",
                table: "subscription_history",
                column: "changed_by");

            migrationBuilder.CreateIndex(
                name: "ix_subscription_history_order_id",
                schema: "public",
                table: "subscription_history",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "ix_toeic_test_results_user_id",
                schema: "public",
                table: "toeic_test_results",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_translations_source_text_source_lang_target_lang",
                schema: "public",
                table: "translations",
                columns: new[] { "source_text", "source_lang", "target_lang" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_reading_library_progress_user_id_article_id",
                schema: "public",
                table: "user_reading_library_progress",
                columns: new[] { "user_id", "article_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "user_reading_progress_article_idx",
                schema: "public",
                table: "user_reading_library_progress",
                column: "article_id");

            migrationBuilder.CreateIndex(
                name: "user_reading_progress_bookmarked_idx",
                schema: "public",
                table: "user_reading_library_progress",
                columns: new[] { "user_id", "is_bookmarked" },
                filter: "is_bookmarked = true");

            migrationBuilder.CreateIndex(
                name: "user_reading_progress_user_idx",
                schema: "public",
                table: "user_reading_library_progress",
                columns: new[] { "user_id", "last_read_at" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "idx_user_roadmap_user",
                schema: "public",
                table: "user_roadmap",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_roadmap_profile_id",
                schema: "public",
                table: "user_roadmap",
                column: "profile_id");

            migrationBuilder.CreateIndex(
                name: "idx_user_roadmap_assessments_lookup",
                schema: "public",
                table: "user_roadmap_assessments",
                columns: new[] { "user_id", "target_id", "created_at" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "idx_user_roadmap_assessments_user_tier",
                schema: "public",
                table: "user_roadmap_assessments",
                columns: new[] { "user_id", "track", "tier" });

            migrationBuilder.CreateIndex(
                name: "idx_user_roadmap_steps_user",
                schema: "public",
                table: "user_roadmap_steps",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_user_toeic_question_history_user_part",
                schema: "public",
                table: "user_toeic_question_history",
                columns: new[] { "user_id", "part" });

            migrationBuilder.CreateIndex(
                name: "idx_user_toeic_question_history_user_part_correct",
                schema: "public",
                table: "user_toeic_question_history",
                columns: new[] { "user_id", "part", "is_correct" });

            migrationBuilder.CreateIndex(
                name: "ix_user_vocab_pack_words_user_id_pack_id_word_id",
                schema: "public",
                table: "user_vocab_pack_words",
                columns: new[] { "user_id", "pack_id", "word_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_vocab_pack_words_user_id_word_id_pack_id",
                schema: "public",
                table: "user_vocab_pack_words",
                columns: new[] { "user_id", "word_id", "pack_id" });

            migrationBuilder.CreateIndex(
                name: "ix_user_vocab_pack_words_word_id",
                schema: "public",
                table: "user_vocab_pack_words",
                column: "word_id");

            migrationBuilder.CreateIndex(
                name: "ix_words_added_by",
                schema: "public",
                table: "words",
                column: "added_by");

            migrationBuilder.CreateIndex(
                name: "ix_words_classroom_id",
                schema: "public",
                table: "words",
                column: "classroom_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_daily_usage",
                schema: "public");

            migrationBuilder.DropTable(
                name: "challenge_daily_log",
                schema: "public");

            migrationBuilder.DropTable(
                name: "coupons",
                schema: "public");

            migrationBuilder.DropTable(
                name: "daily_reading_completions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "enrollments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "extension_tokens",
                schema: "public");

            migrationBuilder.DropTable(
                name: "fcm_tokens",
                schema: "public");

            migrationBuilder.DropTable(
                name: "global_dictionary",
                schema: "public");

            migrationBuilder.DropTable(
                name: "grammar_micro_progress",
                schema: "public");

            migrationBuilder.DropTable(
                name: "grammar_progress",
                schema: "public");

            migrationBuilder.DropTable(
                name: "grammar_quiz_cache",
                schema: "public");

            migrationBuilder.DropTable(
                name: "grammar_results",
                schema: "public");

            migrationBuilder.DropTable(
                name: "group_members",
                schema: "public");

            migrationBuilder.DropTable(
                name: "learner_lexical_evidence",
                schema: "public");

            migrationBuilder.DropTable(
                name: "learner_lexical_state",
                schema: "public");

            migrationBuilder.DropTable(
                name: "payout_requests",
                schema: "public");

            migrationBuilder.DropTable(
                name: "pilot_leads",
                schema: "public");

            migrationBuilder.DropTable(
                name: "quiz_results",
                schema: "public");

            migrationBuilder.DropTable(
                name: "referral_links",
                schema: "public");

            migrationBuilder.DropTable(
                name: "reward_transactions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "room_presence",
                schema: "public");

            migrationBuilder.DropTable(
                name: "srs_progress",
                schema: "public");

            migrationBuilder.DropTable(
                name: "srs_review_events",
                schema: "public");

            migrationBuilder.DropTable(
                name: "student_daily_stats",
                schema: "public");

            migrationBuilder.DropTable(
                name: "subscription_history",
                schema: "public");

            migrationBuilder.DropTable(
                name: "toeic_test_results",
                schema: "public");

            migrationBuilder.DropTable(
                name: "translations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_gamification",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_reading_library_progress",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_roadmap",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_roadmap_assessments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_roadmap_steps",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_toeic_question_history",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_vocab_pack_words",
                schema: "public");

            migrationBuilder.DropTable(
                name: "challenge_participants",
                schema: "public");

            migrationBuilder.DropTable(
                name: "daily_reading_exercises",
                schema: "public");

            migrationBuilder.DropTable(
                name: "grammar_exercises",
                schema: "public");

            migrationBuilder.DropTable(
                name: "groups",
                schema: "public");

            migrationBuilder.DropTable(
                name: "foundation_representations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "referral_logs",
                schema: "public");

            migrationBuilder.DropTable(
                name: "reading_articles",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_vocab_packs",
                schema: "public");

            migrationBuilder.DropTable(
                name: "words",
                schema: "public");

            migrationBuilder.DropTable(
                name: "challenges",
                schema: "public");

            migrationBuilder.DropTable(
                name: "grammar_lessons",
                schema: "public");

            migrationBuilder.DropTable(
                name: "foundation_lexical_concepts",
                schema: "public");

            migrationBuilder.DropTable(
                name: "orders",
                schema: "public");

            migrationBuilder.DropTable(
                name: "referral_campaigns",
                schema: "public");

            migrationBuilder.DropTable(
                name: "classrooms",
                schema: "public");

            migrationBuilder.DropTable(
                name: "grammar_topics",
                schema: "public");

            migrationBuilder.DropTable(
                name: "profiles",
                schema: "public");
        }
    }
}
