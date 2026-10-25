using LingoPro.Application.Common.Behaviors;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.AdminCrm.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Entities.Social;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence.Repositories;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.AdminCrm;

/// <summary>
/// Unit tests for <see cref="GetAdminCrmDashboardQueryHandler"/> (plan IDs AD-01..AD-04): aggregate counters and
/// admin-only authorization through the pipeline behavior.
/// </summary>
[TestFixture]
[Category("AdminCrm")]
public sealed class GetAdminCrmDashboardQueryHandlerTests
{
    /// <summary>AD-01: dashboard aggregates users, premium users, orders, revenue (paid only: src/app/api/admin/crm/route.ts:546), leads and pending payouts correctly.</summary>
    [Test]
    [Property("PlanId", "AD-01")]
    public async Task Handle_SeededData_AggregatesCorrectly()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var u1 = Guid.NewGuid();
        var u2 = Guid.NewGuid();
        var u3 = Guid.NewGuid();
        db.Profiles.AddRange(
            new Profile { Id = u1, Email = "1@t.local", FullName = "One" },
            new Profile { Id = u2, Email = "2@t.local", FullName = "Two", Plan = SubscriptionPlanType.Pro, PlanExpiresAt = DateTime.UtcNow.AddDays(10) },
            new Profile { Id = u3, Email = "3@t.local", FullName = "Three", Plan = SubscriptionPlanType.Premium, PlanExpiresAt = DateTime.UtcNow.AddDays(10) });
        db.Orders.AddRange(
            new Order { UserId = u2, Amount = 79000, Status = OrderStatus.Paid },
            new Order { UserId = u3, Amount = 129000, Status = OrderStatus.Paid },
            new Order { UserId = u1, Amount = 79000, Status = OrderStatus.Pending },
            new Order { UserId = u1, Amount = 500000, Status = OrderStatus.Failed });
        db.PilotLeads.AddRange(
            new LingoPro.Domain.Entities.Admin.PilotLead { FullName = "L1", Email = "l1@t.local" },
            new LingoPro.Domain.Entities.Admin.PilotLead { FullName = "L2", Email = "l2@t.local" });
        db.PayoutRequests.AddRange(
            new PayoutRequest { UserId = u2, Amount = 100000, Status = PayoutRequestStatus.Pending },
            new PayoutRequest { UserId = u2, Amount = 200000, Status = PayoutRequestStatus.Completed });
        await db.SaveChangesAsync();
        var handler = new GetAdminCrmDashboardQueryHandler(new AdminCrmRepository(db));

        // Act
        var response = await handler.Handle(new GetAdminCrmDashboardQuery(), CancellationToken.None);

        // Assert
        var dto = response.Data!;
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(dto.TotalUsers, Is.EqualTo(3));
            Assert.That(dto.ActivePremiumUsers, Is.EqualTo(2));
            Assert.That(dto.PendingOrdersCount, Is.EqualTo(1));
            Assert.That(dto.TotalPaidRevenueVnd, Is.EqualTo(208000m));
            Assert.That(dto.TotalPilotLeads, Is.EqualTo(2));
            Assert.That(dto.PendingPayoutRequests, Is.EqualTo(1));
        });
    }

    /// <summary>AD-02: an empty database yields all-zero counters.</summary>
    [Test]
    [Property("PlanId", "AD-02")]
    public async Task Handle_EmptyDatabase_ReturnsZeros()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new GetAdminCrmDashboardQueryHandler(new AdminCrmRepository(db));

        // Act
        var response = await handler.Handle(new GetAdminCrmDashboardQuery(), CancellationToken.None);

        // Assert
        Assert.That(response.Data, Is.EqualTo(new CrmDashboardSummaryDto(0, 0, 0, 0m, 0, 0)));
    }

    /// <summary>AD-04: a student is rejected by the authorization behavior, an admin passes.</summary>
    [TestCase(UserRole.Student, false)]
    [TestCase(UserRole.Teacher, false)]
    [TestCase(UserRole.Admin, true)]
    [Property("PlanId", "AD-04")]
    public async Task Pipeline_Role_AdminOnly(UserRole role, bool allowed)
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var user = TestHelpers.CreateUser(Guid.NewGuid(), role);
        var behavior = new AuthorizationBehavior<GetAdminCrmDashboardQuery, ApiResponse<CrmDashboardSummaryDto>>(user);
        var handler = new GetAdminCrmDashboardQueryHandler(new AdminCrmRepository(db));
        var query = new GetAdminCrmDashboardQuery();

        // Act
        Task<ApiResponse<CrmDashboardSummaryDto>> Run() =>
            behavior.Handle(query, () => handler.Handle(query, CancellationToken.None), CancellationToken.None);

        // Assert
        if (allowed)
        {
            var response = await Run();
            Assert.That(response.Success, Is.True);
        }
        else
        {
            Assert.ThrowsAsync<ForbiddenAccessException>(async () => await Run());
        }
    }

    /// <summary>
    /// AD-01: an expired paid plan is not an "active premium" user - the original requires plan != free AND
    /// plan_expires_at in the future or null (src/app/api/admin/crm/route.ts:282-286); the handler only checks plan != Free.
    /// </summary>
    [Test]
    [Property("PlanId", "AD-01")]
    [Category("KnownDeviation")]
    public async Task Handle_ExpiredPaidPlan_IsNotCountedAsActivePremium()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        db.Profiles.AddRange(
            new Profile { Id = Guid.NewGuid(), Email = "active@t.local", Plan = SubscriptionPlanType.Pro, PlanExpiresAt = DateTime.UtcNow.AddDays(5) },
            new Profile { Id = Guid.NewGuid(), Email = "expired@t.local", Plan = SubscriptionPlanType.Pro, PlanExpiresAt = DateTime.UtcNow.AddDays(-5) },
            new Profile { Id = Guid.NewGuid(), Email = "free@t.local", Plan = SubscriptionPlanType.Free });
        await db.SaveChangesAsync();
        var handler = new GetAdminCrmDashboardQueryHandler(new AdminCrmRepository(db));

        // Act
        var response = await handler.Handle(new GetAdminCrmDashboardQuery(), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.ActivePremiumUsers, Is.EqualTo(1));
    }
}
