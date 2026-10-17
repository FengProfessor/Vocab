using LingoPro.Domain.Entities.Billing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LingoPro.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for <see cref="Order"/> mapped to <c>public.orders</c>.
/// </summary>
public sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders", "public");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.OrderKind).HasColumnName("order_kind").HasConversion<string>().HasMaxLength(64);
        builder.Property(x => x.PlanId).HasColumnName("plan_id").HasConversion<string>().HasMaxLength(64);
        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(32);
        builder.HasIndex(x => x.TransferCode).IsUnique();
    }
}
