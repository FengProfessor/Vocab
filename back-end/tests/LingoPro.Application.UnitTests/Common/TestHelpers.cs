using LingoPro.Application.Common.Interfaces;
using LingoPro.Domain.Enums;
using LingoPro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace LingoPro.Application.UnitTests.Common;

/// <summary>
/// Shared factory helpers for handler unit tests (EF InMemory database + mocked current user).
/// </summary>
public static class TestHelpers
{
    /// <summary>
    /// Creates an isolated EF Core InMemory <see cref="LingoProDbContext"/>.
    /// </summary>
    public static LingoProDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<LingoProDbContext>()
            .UseInMemoryDatabase($"lingopro_test_{Guid.NewGuid():N}")
            .Options;
        return new LingoProDbContext(options);
    }

    /// <summary>
    /// Creates a mocked <see cref="ICurrentUserService"/> whose flags are derived from the given identity.
    /// Pass <c>userId: null</c> to simulate an anonymous caller.
    /// </summary>
    public static ICurrentUserService CreateUser(
        Guid? userId,
        UserRole role = UserRole.Student,
        SubscriptionPlanType plan = SubscriptionPlanType.Free)
    {
        var user = Substitute.For<ICurrentUserService>();
        user.UserId.Returns(userId);
        user.IsAuthenticated.Returns(userId.HasValue);
        user.Role.Returns(role);
        user.Plan.Returns(plan);
        user.IsAdmin.Returns(role == UserRole.Admin);
        user.IsTeacher.Returns(role == UserRole.Teacher);
        user.IsPro.Returns(plan != SubscriptionPlanType.Free);
        return user;
    }
}
