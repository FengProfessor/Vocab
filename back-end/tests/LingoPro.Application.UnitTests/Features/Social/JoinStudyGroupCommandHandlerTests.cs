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
/// Unit tests for <see cref="JoinStudyGroupCommandHandler"/> and its validator (plan IDs GR-01..GR-10):
/// join, unknown code, expiry, seat limit boundaries, inactive groups, duplicate membership, Pro entitlement.
/// </summary>
[TestFixture]
[Category("Social")]
public sealed class JoinStudyGroupCommandHandlerTests
{
    private static StudyGroup Group(
        string code = "GRP123",
        int seats = 5,
        string status = "active",
        DateTime? expiresAt = null) => new()
    {
        InviteCode = code,
        OwnerId = Guid.NewGuid(),
        SeatLimit = seats,
        Status = status,
        ExpiresAt = expiresAt ?? DateTime.UtcNow.AddDays(30)
    };

    private static async Task SeedMembersAsync(LingoPro.Infrastructure.Persistence.LingoProDbContext db, Guid groupId, int count)
    {
        for (var i = 0; i < count; i++)
        {
            db.GroupMembers.Add(new GroupMember { GroupId = groupId, UserId = Guid.NewGuid() });
        }

        await db.SaveChangesAsync();
    }

    /// <summary>GR-01: valid code adds the caller as member and returns the group (code is case/space-insensitive).</summary>
    [Test]
    [Property("PlanId", "GR-01")]
    public async Task Handle_ValidCode_AddsMemberAndReturnsGroup()
    {
        // Arrange
        var userId = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        var group = Group();
        db.StudyGroups.Add(group);
        await db.SaveChangesAsync();
        var handler = new JoinStudyGroupCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var response = await handler.Handle(new JoinStudyGroupCommand(" grp123 "), CancellationToken.None);

        // Assert
        var member = await db.GroupMembers.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data!.Id, Is.EqualTo(group.Id));
            Assert.That(response.Data.InviteCode, Is.EqualTo("GRP123"));
            Assert.That(member.GroupId, Is.EqualTo(group.Id));
            Assert.That(member.UserId, Is.EqualTo(userId));
        });
    }

    /// <summary>GR-03: unknown invite code yields NotFound.</summary>
    [Test]
    [Property("PlanId", "GR-03")]
    public async Task Handle_UnknownCode_ThrowsNotFound()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new JoinStudyGroupCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), db);

        // Act & Assert
        Assert.ThrowsAsync<NotFoundException>(
            async () => await handler.Handle(new JoinStudyGroupCommand("NOPE"), CancellationToken.None));
        await Task.CompletedTask;
    }

    /// <summary>GR-05: an expired group (expires_at in the past) cannot be joined; original answers 403 Forbidden (src/app/api/groups/join/route.ts:40-42).</summary>
    [Test]
    [Property("PlanId", "GR-05")]
    [Category("KnownDeviation")]
    public async Task Handle_ExpiredGroup_IsRejected()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        db.StudyGroups.Add(Group(expiresAt: DateTime.UtcNow.AddSeconds(-1)));
        await db.SaveChangesAsync();
        var handler = new JoinStudyGroupCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), db);

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(
            async () => await handler.Handle(new JoinStudyGroupCommand("GRP123"), CancellationToken.None));
        Assert.That(db.GroupMembers.Count(), Is.EqualTo(0));
        await Task.CompletedTask;
    }

    /// <summary>GR-06: seat boundary - the last free seat can be taken (original: groups/join/route.ts:56-62, count >= seat_limit rejects).</summary>
    [TestCase(1, 2)]
    [TestCase(0, 1)]
    [Property("PlanId", "GR-06")]
    public async Task Handle_LastFreeSeat_Joins(int existing, int seatLimit)
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var group = Group(seats: seatLimit);
        db.StudyGroups.Add(group);
        await db.SaveChangesAsync();
        await SeedMembersAsync(db, group.Id, existing);
        var handler = new JoinStudyGroupCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), db);

        // Act
        await handler.Handle(new JoinStudyGroupCommand("GRP123"), CancellationToken.None);

        // Assert
        Assert.That(db.GroupMembers.Count(), Is.EqualTo(existing + 1));
    }

    /// <summary>GR-06: a full group is rejected with 403 Forbidden in the original (groups/join/route.ts:60-62); C# throws Conflict.</summary>
    [TestCase(2, 2)]
    [TestCase(1, 1)]
    [Property("PlanId", "GR-06")]
    [Category("KnownDeviation")]
    public async Task Handle_FullGroup_ThrowsForbidden(int existing, int seatLimit)
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var group = Group(seats: seatLimit);
        db.StudyGroups.Add(group);
        await db.SaveChangesAsync();
        await SeedMembersAsync(db, group.Id, existing);
        var handler = new JoinStudyGroupCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), db);

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(
            async () => await handler.Handle(new JoinStudyGroupCommand("GRP123"), CancellationToken.None));
        Assert.That(db.GroupMembers.Count(), Is.EqualTo(existing));
        await Task.CompletedTask;
    }
    /// <summary>GR-04: a non-active group (cancelled) must be rejected with a Forbidden error (original: src/app/api/groups/join/route.ts:37-39, HTTP 403).</summary>
    [Test]
    [Property("PlanId", "GR-04")]
    [Category("KnownDeviation")]
    public async Task Handle_CancelledGroup_ThrowsForbidden()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        db.StudyGroups.Add(Group(status: "cancelled"));
        await db.SaveChangesAsync();
        var handler = new JoinStudyGroupCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), db);

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(
            async () => await handler.Handle(new JoinStudyGroupCommand("GRP123"), CancellationToken.None));
        await Task.CompletedTask;
    }

    /// <summary>GR-07: an existing member joining again must get a Conflict error (original: groups/join/route.ts:51-53, HTTP 409), not a silent success.</summary>
    [Test]
    [Property("PlanId", "GR-07")]
    [Category("KnownDeviation")]
    public async Task Handle_AlreadyMember_ThrowsConflict()
    {
        // Arrange
        var userId = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        var group = Group();
        db.StudyGroups.Add(group);
        db.GroupMembers.Add(new GroupMember { GroupId = group.Id, UserId = userId });
        await db.SaveChangesAsync();
        var handler = new JoinStudyGroupCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act & Assert
        Assert.ThrowsAsync<ConflictException>(
            async () => await handler.Handle(new JoinStudyGroupCommand("GRP123"), CancellationToken.None));
        Assert.That(db.GroupMembers.Count(), Is.EqualTo(1));
        await Task.CompletedTask;
    }

    /// <summary>
    /// GR-08: membership is checked before seat count - an existing member of a full group is told they are
    /// already in the group (not that the group is full).
    /// </summary>
    [Test]
    [Property("PlanId", "GR-08")]
    [Category("KnownDeviation")]
    public async Task Handle_AlreadyMemberOfFullGroup_ReportsAlreadyMemberBeforeSeatCapacity()
    {
        // Arrange
        var userId = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        var group = Group(seats: 1);
        db.StudyGroups.Add(group);
        db.GroupMembers.Add(new GroupMember { GroupId = group.Id, UserId = userId });
        await db.SaveChangesAsync();
        var handler = new JoinStudyGroupCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var ex = Assert.CatchAsync<DomainException>(
            async () => await handler.Handle(new JoinStudyGroupCommand("GRP123"), CancellationToken.None));

        // Assert
        Assert.That(ex!.Message, Does.Contain("already").IgnoreCase);
        await Task.CompletedTask;
    }

    /// <summary>GR-09: joining grants the member Pro until the group's expiry date, never downgrading (original: groups/join/route.ts:73-76 grantGroupEntitlement).</summary>
    [Test]
    [Property("PlanId", "GR-09")]
    [Category("KnownDeviation")]
    public async Task Handle_Join_GrantsProUntilGroupExpiry()
    {
        // Arrange
        var userId = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        db.Profiles.Add(new Profile { Id = userId, Email = "m@t.local", FullName = "Member" });
        var group = Group(expiresAt: DateTime.UtcNow.AddDays(45));
        db.StudyGroups.Add(group);
        await db.SaveChangesAsync();
        var handler = new JoinStudyGroupCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        await handler.Handle(new JoinStudyGroupCommand("GRP123"), CancellationToken.None);

        // Assert
        var profile = await db.Profiles.AsNoTracking().SingleAsync(p => p.Id == userId);
        Assert.Multiple(() =>
        {
            Assert.That(profile.Plan, Is.Not.EqualTo(SubscriptionPlanType.Free));
            Assert.That(profile.PlanExpiresAt, Is.EqualTo(group.ExpiresAt));
        });
    }

    /// <summary>GR-10: invite code validator (required, max 32 characters).</summary>
    [TestCase("", false)]
    [TestCase("ABC", true)]
    [TestCase("12345678901234567890123456789012", true)]
    [TestCase("123456789012345678901234567890123", false)]
    [Property("PlanId", "GR-10")]
    public void Validator_InviteCode_Rules(string code, bool expected)
    {
        // Arrange
        var validator = new JoinStudyGroupCommandValidator();

        // Act
        var result = validator.Validate(new JoinStudyGroupCommand(code));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expected));
    }
}
