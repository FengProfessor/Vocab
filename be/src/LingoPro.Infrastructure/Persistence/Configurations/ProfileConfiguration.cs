using LingoPro.Domain.Entities.Auth;
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

        builder.Property(x => x.Email).HasColumnName("email").IsRequired().HasMaxLength(256);
        builder.HasIndex(x => x.Email).IsUnique();

        builder.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(200);
        builder.Property(x => x.Role).HasColumnName("role").HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Plan).HasColumnName("plan").HasConversion<string>().HasMaxLength(64);
    }
}
