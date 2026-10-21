using LingoPro.Domain.Entities.Speaking;
using LingoPro.Domain.Enums;
using LingoPro.Infrastructure.Persistence.Converters;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LingoPro.Infrastructure.Persistence.Configurations;

/// <summary>
/// Value converters for the upper-case literals used by the foundation curriculum tables.
/// </summary>
internal static class FoundationConverters
{
    public static SnakeCaseEnumConverter<FoundationModalityType> Modality() => new(
        (FoundationModalityType.Text, "TEXT"),
        (FoundationModalityType.Audio, "AUDIO"),
        (FoundationModalityType.Visual, "VISUAL"),
        (FoundationModalityType.SyntacticFrame, "SYNTACTIC_FRAME"));

    public static SnakeCaseEnumConverter<LexicalEvidenceSource> EvidenceSource() => new(
        (LexicalEvidenceSource.Learner, "LEARNER"),
        (LexicalEvidenceSource.Teacher, "TEACHER"),
        (LexicalEvidenceSource.System, "SYSTEM"));

    public static SnakeCaseEnumConverter<LexicalSupportLevel> SupportLevel() => new(
        (LexicalSupportLevel.Independent, "INDEPENDENT"),
        (LexicalSupportLevel.Modelled, "MODELLED"),
        (LexicalSupportLevel.Prompted, "PROMPTED"),
        (LexicalSupportLevel.NotYet, "NOT_YET"));

    public static SnakeCaseEnumConverter<LexicalStatusBucket> StatusBucket() => new(
        (LexicalStatusBucket.Solid, "SOLID"),
        (LexicalStatusBucket.Partial, "PARTIAL"),
        (LexicalStatusBucket.Unknown, "UNKNOWN"),
        (LexicalStatusBucket.Uncertain, "UNCERTAIN"),
        (LexicalStatusBucket.Recheck, "RECHECK"));
}

/// <summary>
/// EF Core mapping for public.foundation_lexical_concepts (varchar PK).
/// </summary>
public class FoundationLexicalConceptConfiguration : IEntityTypeConfiguration<FoundationLexicalConcept>
{
    public void Configure(EntityTypeBuilder<FoundationLexicalConcept> builder)
    {
        builder.ToTable("foundation_lexical_concepts");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasColumnType("varchar(32)").ValueGeneratedNever();
        builder.Property(x => x.Lemma).HasColumnType("varchar(64)");
        builder.Property(x => x.Pos).HasColumnType("varchar(16)");
        builder.Property(x => x.Ipa).HasColumnType("varchar(64)");
        builder.Property(x => x.Cluster).HasColumnType("varchar(32)");
        builder.Property(x => x.GenerativePower).HasDefaultValue(50).ValueGeneratedNever();
        builder.Property(x => x.Stage).HasDefaultValue(0).ValueGeneratedNever();
        builder.Property(x => x.TargetChunks).HasColumnType("jsonb").HasDefaultValueSql("'[]'::jsonb").ValueGeneratedNever();
        builder.Property(x => x.ContrastConcepts).HasColumnType("jsonb").HasDefaultValueSql("'[]'::jsonb").ValueGeneratedNever();
        builder.Property(x => x.CreatedAt).HasColumnType("timestamptz").HasDefaultValueSql("now()").ValueGeneratedNever();
        builder.Property(x => x.UpdatedAt).HasColumnType("timestamptz").HasDefaultValueSql("now()").ValueGeneratedNever();

        builder.HasIndex(x => new { x.Cluster, x.GenerativePower })
            .IsDescending(false, true)
            .HasDatabaseName("idx_foundation_concepts_cluster_gp");
    }
}

/// <summary>
/// EF Core mapping for public.foundation_representations (varchar PK).
/// </summary>
public class FoundationRepresentationConfiguration : IEntityTypeConfiguration<FoundationRepresentation>
{
    public void Configure(EntityTypeBuilder<FoundationRepresentation> builder)
    {
        builder.ToTable("foundation_representations");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasColumnType("varchar(64)").ValueGeneratedNever();
        builder.Property(x => x.ConceptId).HasColumnType("varchar(32)");
        builder.Property(x => x.Modality).HasConversion(FoundationConverters.Modality()).HasColumnType("varchar(16)");
        builder.Property(x => x.SubType).HasColumnType("varchar(32)");
        builder.Property(x => x.ClarityRating)
            .HasConversion<string>()
            .HasColumnType("varchar(8)")
            .HasDefaultValueSql("'V0'")
            .ValueGeneratedNever();
        builder.Property(x => x.ApprovedDiagnostic).HasDefaultValue(false).ValueGeneratedNever();
        builder.Property(x => x.ApprovedTeaching).HasDefaultValue(true).ValueGeneratedNever();
        builder.Property(x => x.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb").ValueGeneratedNever();
        builder.Property(x => x.CreatedAt).HasColumnType("timestamptz").HasDefaultValueSql("now()").ValueGeneratedNever();

        builder.HasIndex(x => new { x.ConceptId, x.Modality }).HasDatabaseName("idx_foundation_reps_concept_modality");

        builder.HasOne(x => x.Concept)
            .WithMany(c => c.Representations)
            .HasForeignKey(x => x.ConceptId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>
/// EF Core mapping for public.learner_lexical_evidence (actor_user_id / learner_id reference auth.users).
/// </summary>
public class LearnerLexicalEvidenceConfiguration : IEntityTypeConfiguration<LearnerLexicalEvidence>
{
    public void Configure(EntityTypeBuilder<LearnerLexicalEvidence> builder)
    {
        builder.ToTable("learner_lexical_evidence");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.EvidenceSource)
            .HasConversion(FoundationConverters.EvidenceSource())
            .HasColumnType("varchar(16)")
            .HasDefaultValueSql("'LEARNER'")
            .ValueGeneratedNever();
        builder.Property(x => x.ConceptId).HasColumnType("varchar(32)");
        builder.Property(x => x.RepresentationId).HasColumnType("varchar(64)");
        builder.Property(x => x.ProbeMode).HasColumnType("varchar(32)");
        builder.Property(x => x.TargetDimension).HasColumnType("varchar(32)");
        builder.Property(x => x.SupportLevel).HasConversion(FoundationConverters.SupportLevel()).HasColumnType("varchar(16)");
        builder.Property(x => x.DistractorSelected).HasColumnType("varchar(64)");
        builder.Property(x => x.LessonId).HasColumnType("varchar(32)");
        builder.Property(x => x.CreatedAt).HasColumnType("timestamptz").HasDefaultValueSql("now()").ValueGeneratedNever();

        builder.HasIndex(x => new { x.LearnerId, x.ConceptId, x.CreatedAt })
            .IsDescending(false, false, true)
            .HasDatabaseName("idx_learner_evidence_stream");

        builder.HasOne(x => x.Concept)
            .WithMany(c => c.Evidences)
            .HasForeignKey(x => x.ConceptId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Representation)
            .WithMany()
            .HasForeignKey(x => x.RepresentationId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

/// <summary>
/// EF Core mapping for public.learner_lexical_state (learner_id references auth.users).
/// </summary>
public class LearnerLexicalStateConfiguration : IEntityTypeConfiguration<LearnerLexicalState>
{
    public void Configure(EntityTypeBuilder<LearnerLexicalState> builder)
    {
        builder.ToTable("learner_lexical_state");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ConceptId).HasColumnType("varchar(32)");
        builder.Property(x => x.StatusBucket)
            .HasConversion(FoundationConverters.StatusBucket())
            .HasColumnType("varchar(16)")
            .HasDefaultValueSql("'UNCERTAIN'")
            .ValueGeneratedNever();
        builder.Property(x => x.ActiveGap)
            .HasColumnType("varchar(32)")
            .HasDefaultValueSql("'UNKNOWN_CONCEPT_OR_FORM'")
            .ValueGeneratedNever();
        builder.Property(x => x.SoundRecognition).HasDefaultValue(false).ValueGeneratedNever();
        builder.Property(x => x.TextRecognition).HasDefaultValue(false).ValueGeneratedNever();
        builder.Property(x => x.MeaningRecall).HasDefaultValue(false).ValueGeneratedNever();
        builder.Property(x => x.FormRecall).HasDefaultValue(false).ValueGeneratedNever();
        builder.Property(x => x.ChunkUse).HasDefaultValue(false).ValueGeneratedNever();
        builder.Property(x => x.GenerativeUse).HasDefaultValue(false).ValueGeneratedNever();
        builder.Property(x => x.RetentionStable).HasDefaultValue(false).ValueGeneratedNever();
        builder.Property(x => x.UncertaintyScore)
            .HasColumnType("numeric(3,2)")
            .HasDefaultValue(1.00m)
            .ValueGeneratedNever();
        builder.Property(x => x.LastSupportLevel)
            .HasConversion(FoundationConverters.SupportLevel())
            .HasColumnType("varchar(16)")
            .HasDefaultValueSql("'INDEPENDENT'");
        builder.Property(x => x.ConsecutiveIndependentPasses).HasDefaultValue(0).ValueGeneratedNever();
        builder.Property(x => x.LastProbedAt).HasColumnType("timestamptz");
        builder.Property(x => x.UpdatedAt).HasColumnType("timestamptz").HasDefaultValueSql("now()").ValueGeneratedNever();

        builder.HasIndex(x => new { x.LearnerId, x.ConceptId }).IsUnique().HasDatabaseName("uq_learner_lexical_state");
        builder.HasIndex(x => new { x.LearnerId, x.StatusBucket }).HasDatabaseName("idx_learner_lexical_state_bucket");

        builder.HasOne(x => x.Concept)
            .WithMany(c => c.LearnerStates)
            .HasForeignKey(x => x.ConceptId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}