using LingoPro.Application.Features.Social.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Social;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Social;

/// <summary>
/// Unit tests for <see cref="ClaimReferralCommandHandler"/> and <see cref="ClaimReferralCommandValidator"/>
/// (plan IDs RF-11, RF-12, RF-13, RF-16 and validator RF-01..RF-03): attribution log, idempotency,
/// self-referral guard and no immediate Pro-day grant.
/// </summary>
[TestFixture]
[Category("Social")]
public sealed class ClaimReferralCommandHandlerTests
{
    private static async Task<(LingoPro.Infrastructure.Persistence.LingoProDbContext Db, Guid Referrer, Guid Referee)> ArrangeAsync(string code = "REF-ABC123")
    {
        var db = TestHelpers.CreateDb();
        var referrer = Guid.NewGuid();
        var referee = Guid.NewGuid();
        db.Profiles.Add(new Profile { Id = referrer, Email = "a@t.local", FullName = "Referrer" });
        db.Profiles.Add(new Profile { Id = referee, Email = "b@t.local", FullName = "Referee" });
        db.ReferralLinks.Add(new ReferralLink { UserId = referrer, Code = code });
        await db.SaveChangesAsync();
        return (db, referrer, referee);
    }

    /// <summary>RF-11: claim creates a Registered referral log linking referrer and referee, with the latest active campaign.</summary>
    [Test]
    [Property("PlanId", "RF-11")]
    public async Task Handle_ValidCode_CreatesRegisteredLogWithCampaign()
    {
        // Arrange
        var (db, referrer, referee) = await ArrangeAsync();
        await using var _db = db;
        var old = new ReferralCampaign { Name = "old", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-10) };
        var latest = new ReferralCampaign { Name = "latest", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-1) };
        var inactive = new ReferralCampaign { Name = "inactive", IsActive = false, CreatedAt = DateTime.UtcNow };
        db.ReferralCampaigns.AddRange(old, latest, inactive);
        await db.SaveChangesAsync();
        var handler = new ClaimReferralCommandHandler(TestHelpers.CreateUser(referee), db);

        // Act
        var response = await handler.Handle(new ClaimReferralCommand("  ref-abc123 "), CancellationToken.None);

        // Assert
        var log = await db.ReferralLogs.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data!.AlreadyClaimed, Is.False);
            Assert.That(response.Data.ReferralCode, Is.EqualTo("REF-ABC123"));
            Assert.That(log.ReferrerId, Is.EqualTo(referrer));
            Assert.That(log.RefereeId, Is.EqualTo(referee));
            Assert.That(log.ReferralCode, Is.EqualTo("REF-ABC123"));
            Assert.That(log.Status, Is.EqualTo(ReferralLogStatus.Registered));
            Assert.That(log.CampaignId, Is.EqualTo(latest.Id));
        });
    }

    /// <summary>RF-12: claiming twice is idempotent (one log, second response flags AlreadyClaimed).</summary>
    [Test]
    [Property("PlanId", "RF-12")]
    public async Task Handle_ClaimedTwice_IsIdempotent()
    {
        // Arrange
        var (db, _, referee) = await ArrangeAsync();
        await using var _db = db;
        var handler = new ClaimReferralCommandHandler(TestHelpers.CreateUser(referee), db);

        // Act
        await handler.Handle(new ClaimReferralCommand("REF-ABC123"), CancellationToken.None);
        var second = await handler.Handle(new ClaimReferralCommand("REF-ABC123"), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(second.Data!.AlreadyClaimed, Is.True);
            Assert.That(db.ReferralLogs.Count(), Is.EqualTo(1));
        });
    }

    /// <summary>RF-13: using one's own code is rejected with the SELF_REFERRAL error code.</summary>
    [Test]
    [Property("PlanId", "RF-13")]
    public async Task Handle_OwnCode_ThrowsSelfReferral()
    {
        // Arrange
        var (db, referrer, _) = await ArrangeAsync();
        await using var _db = db;
        var handler = new ClaimReferralCommandHandler(TestHelpers.CreateUser(referrer), db);

        // Act
        var ex = Assert.ThrowsAsync<DomainException>(
            async () => await handler.Handle(new ClaimReferralCommand("REF-ABC123"), CancellationToken.None));

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(ex!.ErrorCode, Is.EqualTo("SELF_REFERRAL"));
            Assert.That(db.ReferralLogs.Count(), Is.EqualTo(0));
        });
    }

    /// <summary>RF-11: unknown code yields NotFound and no log.</summary>
    [Test]
    [Property("PlanId", "RF-11")]
    public async Task Handle_UnknownCode_ThrowsNotFound()
    {
        // Arrange
        var (db, _, referee) = await ArrangeAsync();
        await using var _db = db;
        var handler = new ClaimReferralCommandHandler(TestHelpers.CreateUser(referee), db);

        // Act & Assert
        Assert.ThrowsAsync<NotFoundException>(
            async () => await handler.Handle(new ClaimReferralCommand("NOPE-999"), CancellationToken.None));
        Assert.That(db.ReferralLogs.Count(), Is.EqualTo(0));
        await Task.CompletedTask;
    }

    /// <summary>RF-16: a claim does not extend the referrer's Pro days immediately (PlanExpiresAt unchanged).</summary>
    [Test]
    [Property("PlanId", "RF-16")]
    public async Task Handle_Claim_DoesNotChangeReferrerPlanExpiry()
    {
        // Arrange
        var (db, referrer, referee) = await ArrangeAsync();
        await using var _db = db;
        var expiry = DateTime.UtcNow.AddDays(10);
        var profile = await db.Profiles.SingleAsync(p => p.Id == referrer);
        profile.Plan = SubscriptionPlanType.Pro;
        profile.PlanExpiresAt = expiry;
        await db.SaveChangesAsync();
        var handler = new ClaimReferralCommandHandler(TestHelpers.CreateUser(referee), db);

        // Act
        await handler.Handle(new ClaimReferralCommand("REF-ABC123"), CancellationToken.None);

        // Assert
        var reloaded = await db.Profiles.AsNoTracking().SingleAsync(p => p.Id == referrer);
        var refereeProfile = await db.Profiles.AsNoTracking().SingleAsync(p => p.Id == referee);
        Assert.Multiple(() =>
        {
            Assert.That(reloaded.PlanExpiresAt, Is.EqualTo(expiry));
            Assert.That(refereeProfile.PlanExpiresAt, Is.Null);
        });
    }

    /// <summary>RF-01..RF-03: referral code format validation.</summary>
    [TestCase("ABC", true)]
    [TestCase("REF-ABC_123", true)]
    [TestCase("AB", false)]
    [TestCase("", false)]
    [TestCase("has space", false)]
    [TestCase("bad!char", false)]
    [Property("PlanId", "RF-01")]
    public void Validator_ReferralCode_Format(string code, bool expected)
    {
        // Arrange
        var validator = new ClaimReferralCommandValidator();

        // Act
        var result = validator.Validate(new ClaimReferralCommand(code));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expected));
    }

    /// <summary>RF-02: code length boundary 32/33.</summary>
    [TestCase(32, true)]
    [TestCase(33, false)]
    [Property("PlanId", "RF-02")]
    public void Validator_ReferralCode_MaxLength(int length, bool expected)
    {
        // Arrange
        var validator = new ClaimReferralCommandValidator();

        // Act
        var result = validator.Validate(new ClaimReferralCommand(new string('A', length)));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expected));
    }
}
