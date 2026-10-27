using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Features.Auth.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Auth;

/// <summary>
/// Unit tests for password recovery, teacher role self-claim, and idempotent onboarding XP award handlers.
/// </summary>
[TestFixture]
[Category("Auth")]
public sealed class AuthCommandHandlerTests
{
    [Test]
    public async Task ForgotPassword_NormalizesEmailAndReturns200Ok()
    {
        // Arrange
        var supabaseAuth = Substitute.For<ISupabaseAuthService>();
        var handler = new ForgotPasswordCommandHandler(supabaseAuth);

        // Act
        var response = await handler.Handle(
            new ForgotPasswordCommand("  Learner@Example.com  ", "https://lingopro.online/auth/recovery"),
            CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.StatusCode, Is.EqualTo(200));
            Assert.That(response.Data, Is.True);
        });
        await supabaseAuth.Received(1).RequestPasswordRecoveryAsync(
            "learner@example.com",
            "https://lingopro.online/auth/recovery",
            Arg.Any<CancellationToken>());
    }

    [TestCase("valid@example.com", true)]
    [TestCase("", false)]
    [TestCase("not-an-email", false)]
    public void ForgotPasswordValidator_ValidatesEmail(string email, bool expectedValid)
    {
        var validator = new ForgotPasswordCommandValidator();
        var result = validator.Validate(new ForgotPasswordCommand(email));
        Assert.That(result.IsValid, Is.EqualTo(expectedValid));
    }

    [Test]
    public async Task ResetPassword_WithAccessTokenOrTokenHash_CallsSupabaseAndReturns200Ok()
    {
        // Arrange
        var supabaseAuth = Substitute.For<ISupabaseAuthService>();
        var handler = new ResetPasswordCommandHandler(supabaseAuth);

        // Act
        var response = await handler.Handle(
            new ResetPasswordCommand("NewPass123!", AccessToken: null, TokenHash: "hash_abc"),
            CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.StatusCode, Is.EqualTo(200));
            Assert.That(response.Data, Is.True);
        });
        await supabaseAuth.Received(1).ResetPasswordAsync(
            null,
            "hash_abc",
            "NewPass123!",
            Arg.Any<CancellationToken>());
    }

    [TestCase("Secret123", "tok_123", null, true)]
    [TestCase("Secret123", null, "hash_123", true)]
    [TestCase("Secret123", null, null, false)]
    [TestCase("12345", "tok_123", null, false)]
    public void ResetPasswordValidator_RequiresPasswordAndToken(
        string newPassword,
        string? accessToken,
        string? tokenHash,
        bool expectedValid)
    {
        var validator = new ResetPasswordCommandValidator();
        var result = validator.Validate(new ResetPasswordCommand(newPassword, accessToken, tokenHash));
        Assert.That(result.IsValid, Is.EqualTo(expectedValid));
    }

    [Test]
    public async Task ClaimTeacherRole_ElevatesStudentToTeacher_AndIsIdempotent()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        db.Profiles.Add(new Profile
        {
            Id = userId,
            Email = "teacher@lingopro.local",
            FullName = "Teacher Candidate",
            Role = UserRole.Student
        });
        await db.SaveChangesAsync();

        var handler = new ClaimTeacherRoleCommandHandler(
            TestHelpers.CreateUser(userId),
            new AuthRepository(db));

        // Act
        var first = await handler.Handle(new ClaimTeacherRoleCommand(), CancellationToken.None);
        var second = await handler.Handle(new ClaimTeacherRoleCommand(), CancellationToken.None);

        // Assert
        var updated = await db.Profiles.AsNoTracking().SingleAsync(p => p.Id == userId);
        Assert.Multiple(() =>
        {
            Assert.That(first.Success, Is.True);
            Assert.That(first.Data!.Role, Is.EqualTo(UserRole.Teacher));
            Assert.That(second.Success, Is.True);
            Assert.That(second.Data!.Role, Is.EqualTo(UserRole.Teacher));
            Assert.That(updated.Role, Is.EqualTo(UserRole.Teacher));
        });
    }

    [Test]
    public async Task ClaimTeacherRole_WhenAdmin_ThrowsForbiddenAccessException()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var adminId = Guid.NewGuid();
        db.Profiles.Add(new Profile
        {
            Id = adminId,
            Email = "admin@lingopro.local",
            FullName = "Admin User",
            Role = UserRole.Admin
        });
        await db.SaveChangesAsync();

        var handler = new ClaimTeacherRoleCommandHandler(
            TestHelpers.CreateUser(adminId, UserRole.Admin),
            new AuthRepository(db));

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(
            async () => await handler.Handle(new ClaimTeacherRoleCommand(), CancellationToken.None));
    }

    [Test]
    public async Task ClaimOnboardingXp_Awards50XpOnce_AndIsIdempotentOnRepeatCalls()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        db.Profiles.Add(new Profile
        {
            Id = userId,
            Email = "learner@lingopro.local",
            FullName = "New Learner",
            Role = UserRole.Student
        });
        await db.SaveChangesAsync();

        var handler = new ClaimOnboardingXpCommandHandler(
            TestHelpers.CreateUser(userId),
            new AuthRepository(db));

        // Act
        var first = await handler.Handle(new ClaimOnboardingXpCommand(), CancellationToken.None);
        var second = await handler.Handle(new ClaimOnboardingXpCommand(), CancellationToken.None);

        // Assert
        var gamification = await db.UserGamifications.AsNoTracking().SingleAsync(g => g.UserId == userId);
        var eventsCount = await db.XpAwardEvents.CountAsync(e => e.UserId == userId);
        Assert.Multiple(() =>
        {
            Assert.That(first.Success, Is.True);
            Assert.That(first.Data, Is.True);
            Assert.That(second.Success, Is.True);
            Assert.That(second.Data, Is.False);
            Assert.That(gamification.TotalXp, Is.EqualTo(50));
            Assert.That(gamification.CurrentStreak, Is.EqualTo(1));
            Assert.That(eventsCount, Is.EqualTo(1));
        });
    }
}
