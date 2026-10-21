using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Enums;
using LingoPro.Infrastructure.Persistence.Converters;
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
        builder.Property(x => x.Id).HasDefaultValueSql("uuid_generate_v4()");

        builder.Property(x => x.Plan).HasColumnName("plan").HasConversion(new SnakeCaseEnumConverter<SubscriptionPlanType>());
        builder.Property(x => x.PaymentMethod).HasConversion(new SnakeCaseEnumConverter<PaymentMethodType>(
            (PaymentMethodType.VnPay, "vnpay"),
            (PaymentMethodType.MoMo, "momo")));
        builder.Property(x => x.Status).HasConversion(new SnakeCaseEnumConverter<OrderStatus>()).HasDefaultValueSql("'pending'");
        builder.Property(x => x.OrderKind).HasConversion(new SnakeCaseEnumConverter<OrderKind>()).HasDefaultValueSql("'individual'");
        builder.Property(x => x.Currency).HasDefaultValueSql("'VND'");
        builder.Property(x => x.PeriodMonths).HasDefaultValue(1);
        builder.Property(x => x.Seats).HasDefaultValue(1);
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("now()");

        builder.HasIndex(x => x.UserId).HasDatabaseName("idx_orders_user_id");
        builder.HasIndex(x => x.Status).HasDatabaseName("idx_orders_status");
        builder.HasIndex(x => x.CreatedAt).IsDescending().HasDatabaseName("idx_orders_created_at");
        builder.HasIndex(x => x.PaymentRef).IsUnique().HasFilter("payment_ref is not null").HasDatabaseName("idx_orders_payment_ref_unique");

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.ProcessedByUser)
            .WithMany()
            .HasForeignKey(x => x.ProcessedBy)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
