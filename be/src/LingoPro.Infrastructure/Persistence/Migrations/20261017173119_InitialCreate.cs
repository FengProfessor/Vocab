using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LingoPro.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
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
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "text", nullable: false),
                    discount_percent = table.Column<int>(type: "integer", nullable: false),
                    max_discount_amount = table.Column<decimal>(type: "numeric", nullable: true),
                    max_uses = table.Column<int>(type: "integer", nullable: false),
                    used_count = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_coupons", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "foundation_lexical_concepts",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    concept_code = table.Column<string>(type: "text", nullable: false),
                    headword = table.Column<string>(type: "text", nullable: false),
                    ipa = table.Column<string>(type: "text", nullable: false),
                    meaning_vi = table.Column<string>(type: "text", nullable: false),
                    frequency_band = table.Column<int>(type: "integer", nullable: false),
                    cert_level = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    term = table.Column<string>(type: "text", nullable: false),
                    ipa = table.Column<string>(type: "text", nullable: false),
                    part_of_speech = table.Column<string>(type: "text", nullable: false),
                    definitions_json = table.Column<string>(type: "text", nullable: false),
                    collocations_json = table.Column<string>(type: "text", nullable: false),
                    synonyms_json = table.Column<string>(type: "text", nullable: false),
                    antonyms_json = table.Column<string>(type: "text", nullable: false),
                    word_family_json = table.Column<string>(type: "text", nullable: false),
                    image_url = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    slug = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    title_vi = table.Column<string>(type: "text", nullable: true),
                    grammar_level = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    cefr_level = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    category = table.Column<string>(type: "text", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    parent_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    full_name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    phone = table.Column<string>(type: "text", nullable: false),
                    organization_name = table.Column<string>(type: "text", nullable: true),
                    source_campaign = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    full_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    avatar_url = table.Column<string>(type: "text", nullable: true),
                    role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    plan = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    plan_expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    total_xp = table.Column<int>(type: "integer", nullable: false),
                    current_streak = table.Column<int>(type: "integer", nullable: false),
                    longest_streak = table.Column<int>(type: "integer", nullable: false),
                    last_active_date = table.Column<DateOnly>(type: "date", nullable: true),
                    last_due_email_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    learning_goal = table.Column<string>(type: "text", nullable: true),
                    daily_target_mins = table.Column<int>(type: "integer", nullable: false),
                    onboarding_completed = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    topic = table.Column<string>(type: "text", nullable: false),
                    cefr_level = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    source_type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    word_count = table.Column<int>(type: "integer", nullable: false),
                    content_text = table.Column<string>(type: "text", nullable: false),
                    questions_json = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    min_payout_amount = table.Column<decimal>(type: "numeric", nullable: false),
                    monthly_ref_cap = table.Column<int>(type: "integer", nullable: false),
                    activation_criteria_json = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_translations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "foundation_representations",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    representation_code = table.Column<string>(type: "text", nullable: false),
                    concept_id = table.Column<Guid>(type: "uuid", nullable: false),
                    modality = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    sub_type = table.Column<string>(type: "text", nullable: false),
                    content_payload = table.Column<string>(type: "text", nullable: false),
                    clarity_rating = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    approved_diagnostic = table.Column<bool>(type: "boolean", nullable: false),
                    approved_teaching = table.Column<bool>(type: "boolean", nullable: false),
                    metadata_json = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                name: "ai_daily_usage",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    usage_date = table.Column<DateOnly>(type: "date", nullable: false),
                    count = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_ai_daily_usage", x => x.id);
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
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: false),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    daily_target_words = table.Column<int>(type: "integer", nullable: false),
                    max_participants = table.Column<int>(type: "integer", nullable: false),
                    deposit_amount = table.Column<decimal>(type: "numeric", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_challenges", x => x.id);
                    table.ForeignKey(
                        name: "fk_challenges_profiles_creator_id",
                        column: x => x.creator_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "classrooms",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    invite_code = table.Column<string>(type: "text", nullable: false),
                    teacher_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                name: "extension_tokens",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token_hash = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    last_used_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_revoked = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_extension_tokens", x => x.id);
                    table.ForeignKey(
                        name: "fk_extension_tokens_profiles_user_id",
                        column: x => x.user_id,
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
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    fcm_token = table.Column<string>(type: "text", nullable: false),
                    device_platform = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    theory_html = table.Column<string>(type: "text", nullable: false),
                    formulas_json = table.Column<string>(type: "text", nullable: false),
                    examples_json = table.Column<string>(type: "text", nullable: false),
                    source = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "grammar_micro_progress",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    stage = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    completed_steps = table.Column<int[]>(type: "integer[]", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_grammar_micro_progress", x => x.id);
                    table.ForeignKey(
                        name: "fk_grammar_micro_progress_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
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
                    concept_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status_bucket = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    mastery_state = table.Column<string>(type: "text", nullable: false),
                    evidence_count = table.Column<int>(type: "integer", nullable: false),
                    confidence_score = table.Column<double>(type: "double precision", nullable: false),
                    last_updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    table.ForeignKey(
                        name: "fk_learner_lexical_state_profiles_learner_id",
                        column: x => x.learner_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "payout_requests",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    processed_by = table.Column<Guid>(type: "uuid", nullable: true),
                    amount = table.Column<decimal>(type: "numeric", nullable: false),
                    bank_name = table.Column<string>(type: "text", nullable: false),
                    bank_account_number = table.Column<string>(type: "text", nullable: false),
                    bank_account_holder = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    processed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    code = table.Column<string>(type: "text", nullable: false),
                    clicks_count = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    total_xp = table.Column<int>(type: "integer", nullable: false),
                    current_streak = table.Column<int>(type: "integer", nullable: false),
                    longest_streak = table.Column<int>(type: "integer", nullable: false),
                    last_active_date = table.Column<DateOnly>(type: "date", nullable: true),
                    daily_goal = table.Column<int>(type: "integer", nullable: false),
                    today_xp = table.Column<int>(type: "integer", nullable: false),
                    today_date = table.Column<DateOnly>(type: "date", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_gamification", x => x.id);
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
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    track = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    level_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    current_unit_id = table.Column<string>(type: "text", nullable: true),
                    placement_completed = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_roadmap", x => x.id);
                    table.ForeignKey(
                        name: "fk_user_roadmap_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_toeic_question_history",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    question_id = table.Column<string>(type: "text", nullable: false),
                    exam_type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    part = table.Column<int>(type: "integer", nullable: false),
                    is_correct = table.Column<bool>(type: "boolean", nullable: false),
                    selected_option = table.Column<string>(type: "text", nullable: false),
                    attempted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_toeic_question_history", x => x.id);
                    table.ForeignKey(
                        name: "fk_user_toeic_question_history_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_vocab_packs",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    pack_id = table.Column<string>(type: "text", nullable: false),
                    catalog_version = table.Column<string>(type: "text", nullable: false),
                    topic_id = table.Column<string>(type: "text", nullable: false),
                    topic_title = table.Column<string>(type: "text", nullable: false),
                    pack_index = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    word_count = table.Column<int>(type: "integer", nullable: false),
                    reviewed_count = table.Column<int>(type: "integer", nullable: false),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_studied_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_vocab_packs", x => x.id);
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
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    is_completed = table.Column<bool>(type: "boolean", nullable: false),
                    quiz_score = table.Column<int>(type: "integer", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    learner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    actor_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    concept_id = table.Column<Guid>(type: "uuid", nullable: false),
                    representation_id = table.Column<Guid>(type: "uuid", nullable: true),
                    evidence_source = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    support_level = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    probe_type = table.Column<string>(type: "text", nullable: false),
                    is_successful = table.Column<bool>(type: "boolean", nullable: false),
                    response_latency_ms = table.Column<int>(type: "integer", nullable: false),
                    observed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    table.ForeignKey(
                        name: "fk_learner_lexical_evidence_profiles_actor_user_id",
                        column: x => x.actor_user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_learner_lexical_evidence_profiles_learner_id",
                        column: x => x.learner_id,
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
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    order_kind = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    duration_months = table.Column<int>(type: "integer", nullable: false),
                    seat_limit = table.Column<int>(type: "integer", nullable: false),
                    target_challenge_id = table.Column<Guid>(type: "uuid", nullable: true),
                    amount = table.Column<decimal>(type: "numeric", nullable: false),
                    currency = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    transfer_code = table.Column<string>(type: "text", nullable: false),
                    coupon_code = table.Column<string>(type: "text", nullable: true),
                    payment_gateway = table.Column<string>(type: "text", nullable: true),
                    gateway_transaction_id = table.Column<string>(type: "text", nullable: true),
                    paid_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    processed_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_orders", x => x.id);
                    table.ForeignKey(
                        name: "fk_orders_challenges_target_challenge_id",
                        column: x => x.target_challenge_id,
                        principalSchema: "public",
                        principalTable: "challenges",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_orders_profiles_processed_by",
                        column: x => x.processed_by,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_orders_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "daily_reading_exercises",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    target_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    classroom_id = table.Column<Guid>(type: "uuid", nullable: true),
                    exercise_date = table.Column<DateOnly>(type: "date", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    passage_content = table.Column<string>(type: "text", nullable: false),
                    cert_level = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    used_words_json = table.Column<string>(type: "text", nullable: false),
                    mcq_questions_json = table.Column<string>(type: "text", nullable: false),
                    cloze_items_json = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    classroom_id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    joined_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    quiz_type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    score = table.Column<int>(type: "integer", nullable: false),
                    total_questions = table.Column<int>(type: "integer", nullable: false),
                    accuracy = table.Column<double>(type: "double precision", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                name: "room_presence",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    display_name = table.Column<string>(type: "text", nullable: false),
                    current_activity = table.Column<string>(type: "text", nullable: false),
                    classroom_id = table.Column<Guid>(type: "uuid", nullable: true),
                    last_heartbeat_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_room_presence", x => x.id);
                    table.ForeignKey(
                        name: "fk_room_presence_classrooms_classroom_id",
                        column: x => x.classroom_id,
                        principalSchema: "public",
                        principalTable: "classrooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_room_presence_profiles_user_id",
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
                    recorded_at = table.Column<DateOnly>(type: "date", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    term = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    ipa = table.Column<string>(type: "text", nullable: false),
                    translation = table.Column<string>(type: "text", nullable: false),
                    pos = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    image_url = table.Column<string>(type: "text", nullable: true),
                    example_sentence = table.Column<string>(type: "text", nullable: true),
                    example_translation = table.Column<string>(type: "text", nullable: true),
                    topic = table.Column<string>(type: "text", nullable: false),
                    cefr_level = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    approval_status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    added_by = table.Column<Guid>(type: "uuid", nullable: true),
                    classroom_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "grammar_exercises",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    topic_slug = table.Column<string>(type: "text", nullable: false),
                    topic_id = table.Column<Guid>(type: "uuid", nullable: true),
                    lesson_id = table.Column<Guid>(type: "uuid", nullable: true),
                    cert_level = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    exercise_type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    question_text = table.Column<string>(type: "text", nullable: false),
                    options_json = table.Column<string>(type: "text", nullable: false),
                    correct_answer = table.Column<string>(type: "text", nullable: false),
                    explanation_vi = table.Column<string>(type: "text", nullable: false),
                    classroom_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by_teacher_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                        name: "fk_grammar_exercises_grammar_topics_topic_id",
                        column: x => x.topic_id,
                        principalSchema: "public",
                        principalTable: "grammar_topics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_grammar_exercises_profiles_created_by_teacher_id",
                        column: x => x.created_by_teacher_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "grammar_progress",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    topic_slug = table.Column<string>(type: "text", nullable: false),
                    topic_id = table.Column<Guid>(type: "uuid", nullable: true),
                    lesson_id = table.Column<Guid>(type: "uuid", nullable: true),
                    mastery_score = table.Column<double>(type: "double precision", nullable: false),
                    stability = table.Column<double>(type: "double precision", nullable: false),
                    difficulty = table.Column<double>(type: "double precision", nullable: false),
                    interval_days = table.Column<int>(type: "integer", nullable: false),
                    next_review_date = table.Column<DateOnly>(type: "date", nullable: false),
                    reps = table.Column<int>(type: "integer", nullable: false),
                    lapses = table.Column<int>(type: "integer", nullable: false),
                    state = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    last_reviewed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                        name: "fk_grammar_progress_grammar_topics_topic_id",
                        column: x => x.topic_id,
                        principalSchema: "public",
                        principalTable: "grammar_topics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
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
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    lesson_id = table.Column<Guid>(type: "uuid", nullable: false),
                    questions_json = table.Column<string>(type: "text", nullable: false),
                    model = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_grammar_quiz_cache", x => x.id);
                    table.ForeignKey(
                        name: "fk_grammar_quiz_cache_grammar_lessons_lesson_id",
                        column: x => x.lesson_id,
                        principalSchema: "public",
                        principalTable: "grammar_lessons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_roadmap_assessments",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_roadmap_id = table.Column<Guid>(type: "uuid", nullable: true),
                    track = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    tier = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    target_id = table.Column<string>(type: "text", nullable: false),
                    score = table.Column<int>(type: "integer", nullable: false),
                    passed = table.Column<bool>(type: "boolean", nullable: false),
                    details_json = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_roadmap_assessments", x => x.id);
                    table.ForeignKey(
                        name: "fk_user_roadmap_assessments_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_user_roadmap_assessments_user_roadmaps_user_roadmap_id",
                        column: x => x.user_roadmap_id,
                        principalSchema: "public",
                        principalTable: "user_roadmap",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "user_roadmap_steps",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_roadmap_id = table.Column<Guid>(type: "uuid", nullable: false),
                    track = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    step_id = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    score = table.Column<double>(type: "double precision", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_roadmap_steps", x => x.id);
                    table.ForeignKey(
                        name: "fk_user_roadmap_steps_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_user_roadmap_steps_user_roadmaps_user_roadmap_id",
                        column: x => x.user_roadmap_id,
                        principalSchema: "public",
                        principalTable: "user_roadmap",
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
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    completed_days_count = table.Column<int>(type: "integer", nullable: false),
                    total_points = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
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
                    name = table.Column<string>(type: "text", nullable: false),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    invite_code = table.Column<string>(type: "text", nullable: false),
                    seat_limit = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    referrer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    referee_id = table.Column<Guid>(type: "uuid", nullable: false),
                    campaign_id = table.Column<Guid>(type: "uuid", nullable: true),
                    first_order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    referral_code = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    activated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                        onDelete: ReferentialAction.Restrict);
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
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    old_plan = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    new_plan = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    reason = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    changed_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_subscription_history", x => x.id);
                    table.ForeignKey(
                        name: "fk_subscription_history_orders_order_id",
                        column: x => x.order_id,
                        principalSchema: "public",
                        principalTable: "orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_subscription_history_profiles_changed_by",
                        column: x => x.changed_by,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
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
                    mcq_score = table.Column<int>(type: "integer", nullable: false),
                    mcq_total = table.Column<int>(type: "integer", nullable: false),
                    cloze_score = table.Column<int>(type: "integer", nullable: false),
                    cloze_total = table.Column<int>(type: "integer", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    stability = table.Column<double>(type: "double precision", nullable: false),
                    difficulty = table.Column<double>(type: "double precision", nullable: false),
                    interval_days = table.Column<int>(type: "integer", nullable: false),
                    next_review_date = table.Column<DateOnly>(type: "date", nullable: false),
                    lapses = table.Column<int>(type: "integer", nullable: false),
                    reps = table.Column<int>(type: "integer", nullable: false),
                    state = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    last_reviewed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_review_id = table.Column<string>(type: "text", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    review_id = table.Column<string>(type: "text", nullable: false),
                    word_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quality = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_srs_review_events", x => x.id);
                    table.ForeignKey(
                        name: "fk_srs_review_events_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
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
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_vocab_pack_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    pack_id = table.Column<string>(type: "text", nullable: false),
                    word_id = table.Column<Guid>(type: "uuid", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_vocab_pack_words", x => x.id);
                    table.ForeignKey(
                        name: "fk_user_vocab_pack_words_profiles_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_user_vocab_pack_words_user_vocab_packs_user_vocab_pack_id",
                        column: x => x.user_vocab_pack_id,
                        principalSchema: "public",
                        principalTable: "user_vocab_packs",
                        principalColumn: "id",
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
                    is_correct = table.Column<bool>(type: "boolean", nullable: false),
                    time_taken_ms = table.Column<int>(type: "integer", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    challenge_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    participant_id = table.Column<Guid>(type: "uuid", nullable: true),
                    log_date = table.Column<DateOnly>(type: "date", nullable: false),
                    words_reviewed = table.Column<int>(type: "integer", nullable: false),
                    xp_earned = table.Column<int>(type: "integer", nullable: false),
                    is_target_met = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    joined_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                    source_referee_id = table.Column<Guid>(type: "uuid", nullable: true),
                    referral_log_id = table.Column<Guid>(type: "uuid", nullable: true),
                    order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    reward_type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    amount = table.Column<decimal>(type: "numeric", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    available_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false)
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
                        name: "fk_reward_transactions_profiles_source_referee_id",
                        column: x => x.source_referee_id,
                        principalSchema: "public",
                        principalTable: "profiles",
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
                name: "ix_ai_daily_usage_user_id_usage_date",
                schema: "public",
                table: "ai_daily_usage",
                columns: new[] { "user_id", "usage_date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_challenge_daily_log_challenge_id_user_id_log_date",
                schema: "public",
                table: "challenge_daily_log",
                columns: new[] { "challenge_id", "user_id", "log_date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_challenge_daily_log_participant_id",
                schema: "public",
                table: "challenge_daily_log",
                column: "participant_id");

            migrationBuilder.CreateIndex(
                name: "ix_challenge_daily_log_user_id",
                schema: "public",
                table: "challenge_daily_log",
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
                name: "ix_challenge_participants_user_id",
                schema: "public",
                table: "challenge_participants",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_challenges_creator_id",
                schema: "public",
                table: "challenges",
                column: "creator_id");

            migrationBuilder.CreateIndex(
                name: "ix_classrooms_invite_code",
                schema: "public",
                table: "classrooms",
                column: "invite_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_classrooms_teacher_id",
                schema: "public",
                table: "classrooms",
                column: "teacher_id");

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
                name: "ix_daily_reading_exercises_classroom_id",
                schema: "public",
                table: "daily_reading_exercises",
                column: "classroom_id");

            migrationBuilder.CreateIndex(
                name: "ix_daily_reading_exercises_target_user_id",
                schema: "public",
                table: "daily_reading_exercises",
                column: "target_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_enrollments_classroom_id_student_id",
                schema: "public",
                table: "enrollments",
                columns: new[] { "classroom_id", "student_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_enrollments_student_id",
                schema: "public",
                table: "enrollments",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "ix_extension_tokens_token_hash",
                schema: "public",
                table: "extension_tokens",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_extension_tokens_user_id",
                schema: "public",
                table: "extension_tokens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_fcm_tokens_user_id_fcm_token",
                schema: "public",
                table: "fcm_tokens",
                columns: new[] { "user_id", "fcm_token" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_foundation_lexical_concepts_concept_code",
                schema: "public",
                table: "foundation_lexical_concepts",
                column: "concept_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_foundation_lexical_concepts_headword",
                schema: "public",
                table: "foundation_lexical_concepts",
                column: "headword",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_foundation_representations_concept_id",
                schema: "public",
                table: "foundation_representations",
                column: "concept_id");

            migrationBuilder.CreateIndex(
                name: "ix_foundation_representations_representation_code",
                schema: "public",
                table: "foundation_representations",
                column: "representation_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_global_dictionary_term",
                schema: "public",
                table: "global_dictionary",
                column: "term",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_grammar_exercises_classroom_id",
                schema: "public",
                table: "grammar_exercises",
                column: "classroom_id");

            migrationBuilder.CreateIndex(
                name: "ix_grammar_exercises_created_by_teacher_id",
                schema: "public",
                table: "grammar_exercises",
                column: "created_by_teacher_id");

            migrationBuilder.CreateIndex(
                name: "ix_grammar_exercises_lesson_id",
                schema: "public",
                table: "grammar_exercises",
                column: "lesson_id");

            migrationBuilder.CreateIndex(
                name: "ix_grammar_exercises_topic_id",
                schema: "public",
                table: "grammar_exercises",
                column: "topic_id");

            migrationBuilder.CreateIndex(
                name: "ix_grammar_lessons_created_by",
                schema: "public",
                table: "grammar_lessons",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_grammar_lessons_topic_id",
                schema: "public",
                table: "grammar_lessons",
                column: "topic_id");

            migrationBuilder.CreateIndex(
                name: "ix_grammar_micro_progress_user_id_stage",
                schema: "public",
                table: "grammar_micro_progress",
                columns: new[] { "user_id", "stage" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_grammar_progress_lesson_id",
                schema: "public",
                table: "grammar_progress",
                column: "lesson_id");

            migrationBuilder.CreateIndex(
                name: "ix_grammar_progress_topic_id",
                schema: "public",
                table: "grammar_progress",
                column: "topic_id");

            migrationBuilder.CreateIndex(
                name: "ix_grammar_progress_user_id_topic_slug",
                schema: "public",
                table: "grammar_progress",
                columns: new[] { "user_id", "topic_slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_grammar_quiz_cache_lesson_id",
                schema: "public",
                table: "grammar_quiz_cache",
                column: "lesson_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_grammar_results_exercise_id",
                schema: "public",
                table: "grammar_results",
                column: "exercise_id");

            migrationBuilder.CreateIndex(
                name: "ix_grammar_results_user_id",
                schema: "public",
                table: "grammar_results",
                column: "user_id");

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
                name: "ix_learner_lexical_evidence_actor_user_id",
                schema: "public",
                table: "learner_lexical_evidence",
                column: "actor_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_learner_lexical_evidence_concept_id",
                schema: "public",
                table: "learner_lexical_evidence",
                column: "concept_id");

            migrationBuilder.CreateIndex(
                name: "ix_learner_lexical_evidence_learner_id_concept_id",
                schema: "public",
                table: "learner_lexical_evidence",
                columns: new[] { "learner_id", "concept_id" });

            migrationBuilder.CreateIndex(
                name: "ix_learner_lexical_evidence_representation_id",
                schema: "public",
                table: "learner_lexical_evidence",
                column: "representation_id");

            migrationBuilder.CreateIndex(
                name: "ix_learner_lexical_state_concept_id",
                schema: "public",
                table: "learner_lexical_state",
                column: "concept_id");

            migrationBuilder.CreateIndex(
                name: "ix_learner_lexical_state_learner_id_concept_id",
                schema: "public",
                table: "learner_lexical_state",
                columns: new[] { "learner_id", "concept_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_orders_processed_by",
                schema: "public",
                table: "orders",
                column: "processed_by");

            migrationBuilder.CreateIndex(
                name: "ix_orders_target_challenge_id",
                schema: "public",
                table: "orders",
                column: "target_challenge_id");

            migrationBuilder.CreateIndex(
                name: "ix_orders_transfer_code",
                schema: "public",
                table: "orders",
                column: "transfer_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_orders_user_id",
                schema: "public",
                table: "orders",
                column: "user_id");

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
                name: "ix_profiles_email",
                schema: "public",
                table: "profiles",
                column: "email",
                unique: true);

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
                name: "ix_referral_campaigns_slug",
                schema: "public",
                table: "referral_campaigns",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_referral_links_code",
                schema: "public",
                table: "referral_links",
                column: "code",
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
                name: "ix_reward_transactions_order_id",
                schema: "public",
                table: "reward_transactions",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "ix_reward_transactions_referral_log_id",
                schema: "public",
                table: "reward_transactions",
                column: "referral_log_id");

            migrationBuilder.CreateIndex(
                name: "ix_reward_transactions_source_referee_id",
                schema: "public",
                table: "reward_transactions",
                column: "source_referee_id");

            migrationBuilder.CreateIndex(
                name: "ix_reward_transactions_user_id",
                schema: "public",
                table: "reward_transactions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_room_presence_classroom_id",
                schema: "public",
                table: "room_presence",
                column: "classroom_id");

            migrationBuilder.CreateIndex(
                name: "ix_room_presence_user_id",
                schema: "public",
                table: "room_presence",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_srs_progress_user_id_next_review_date",
                schema: "public",
                table: "srs_progress",
                columns: new[] { "user_id", "next_review_date" });

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
                name: "ix_srs_review_events_user_id_review_id",
                schema: "public",
                table: "srs_review_events",
                columns: new[] { "user_id", "review_id" },
                unique: true);

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
                name: "ix_subscription_history_user_id",
                schema: "public",
                table: "subscription_history",
                column: "user_id");

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
                name: "ix_user_gamification_user_id",
                schema: "public",
                table: "user_gamification",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_reading_library_progress_article_id",
                schema: "public",
                table: "user_reading_library_progress",
                column: "article_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_reading_library_progress_user_id_article_id",
                schema: "public",
                table: "user_reading_library_progress",
                columns: new[] { "user_id", "article_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_roadmap_user_id_track",
                schema: "public",
                table: "user_roadmap",
                columns: new[] { "user_id", "track" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_roadmap_assessments_user_id_target_id",
                schema: "public",
                table: "user_roadmap_assessments",
                columns: new[] { "user_id", "target_id" });

            migrationBuilder.CreateIndex(
                name: "ix_user_roadmap_assessments_user_roadmap_id",
                schema: "public",
                table: "user_roadmap_assessments",
                column: "user_roadmap_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_roadmap_steps_user_id",
                schema: "public",
                table: "user_roadmap_steps",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_roadmap_steps_user_roadmap_id_step_id",
                schema: "public",
                table: "user_roadmap_steps",
                columns: new[] { "user_roadmap_id", "step_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_toeic_question_history_user_id_part",
                schema: "public",
                table: "user_toeic_question_history",
                columns: new[] { "user_id", "part" });

            migrationBuilder.CreateIndex(
                name: "ix_user_toeic_question_history_user_id_question_id",
                schema: "public",
                table: "user_toeic_question_history",
                columns: new[] { "user_id", "question_id" });

            migrationBuilder.CreateIndex(
                name: "ix_user_vocab_pack_words_user_id_pack_id_position",
                schema: "public",
                table: "user_vocab_pack_words",
                columns: new[] { "user_id", "pack_id", "position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_vocab_pack_words_user_id_pack_id_word_id",
                schema: "public",
                table: "user_vocab_pack_words",
                columns: new[] { "user_id", "pack_id", "word_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_vocab_pack_words_user_vocab_pack_id",
                schema: "public",
                table: "user_vocab_pack_words",
                column: "user_vocab_pack_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_vocab_pack_words_word_id",
                schema: "public",
                table: "user_vocab_pack_words",
                column: "word_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_vocab_packs_user_id_pack_id",
                schema: "public",
                table: "user_vocab_packs",
                columns: new[] { "user_id", "pack_id" },
                unique: true);

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

            migrationBuilder.CreateIndex(
                name: "ix_words_term_classroom_id",
                schema: "public",
                table: "words",
                columns: new[] { "term", "classroom_id" });
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
                name: "user_roadmap",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_vocab_packs",
                schema: "public");

            migrationBuilder.DropTable(
                name: "words",
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
                name: "challenges",
                schema: "public");

            migrationBuilder.DropTable(
                name: "profiles",
                schema: "public");
        }
    }
}
