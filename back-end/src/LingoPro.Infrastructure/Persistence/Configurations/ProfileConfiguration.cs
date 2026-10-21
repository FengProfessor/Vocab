using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;
using LingoPro.Infrastructure.Persistence.Converters;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LingoPro.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for <see cref="Profile"/> mapped to <c>public.profiles</c>.
/// </summary>
public sealed class ProfileConfiguration : IEntityTypeConfiguration<Profile>
{
    public void Configure(EntityTypeBuilder<Profile> builder)
    {
        builder.ToTable("profiles", "public");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.Email).IsRequired();
        builder.Property(x => x.Role).HasConversion(new SnakeCaseEnumConverter<UserRole>()).HasDefaultValue(UserRole.Student);
        builder.Property(x => x.Plan).HasConversion(new SnakeCaseEnumConverter<SubscriptionPlanType>()).HasDefaultValueSql("'free'");
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
        builder.Property(x => x.DailyGoal).HasDefaultValue(10);
        builder.Property(x => x.NotificationHour).HasDefaultValue(20);

        builder.HasIndex(x => x.FcmToken).HasFilter("fcm_token is not null").HasDatabaseName("idx_profiles_fcm_token");
        builder.HasIndex(x => x.PlanExpiresAt).HasFilter("plan_expires_at is not null").HasDatabaseName("idx_profiles_plan_expires");
        builder.HasIndex(x => x.ProMilestoneEnrolledAt).HasFilter("pro_milestone_enrolled_at is not null").HasDatabaseName("idx_profiles_pro_milestone_enrolled");
        builder.HasIndex(x => x.Province).HasFilter("province is not null").HasDatabaseName("idx_profiles_province");
    }
}
