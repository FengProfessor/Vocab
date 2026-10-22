using LingoPro.Application.Features.Roadmap.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Roadmap;

/// <summary>
/// P0/P1 business tests for <see cref="SubmitPlacementCommandHandler"/>: placement scoring, self-select,
/// independent tracks and re-placement.
/// </summary>
[TestFixture]
[Category("Roadmap")]
public sealed class SubmitPlacementCommandHandlerTests
{
    private static async Task<(LingoProDbContext Db, Guid UserId)> SeedAsync()
    {
        var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        db.Profiles.Add(new Profile { Id = userId, Email = "p@x.com", FullName = "P" });
        await db.SaveChangesAsync();
        return (db, userId);
    }

    [Test]
    [Property("PlanId", "RM-15")]
    [Category("KnownDeviation")]
    public async Task Handle_SixteenEmptyAnswers_DoesNotPlaceAtB2()
    {
        // Arrange (original scores correctness; C# only counts the number of keys)
        var (db, userId) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitPlacementCommandHandler(TestHelpers.CreateUser(userId), db);
        var answers = Enumerable.Range(1, 16).ToDictionary(i => $"q{i}", _ => string.Empty);

        // Act
        var response = await handler.Handle(
            new SubmitPlacementCommand(RoadmapTrackType.Cefr, null, answers), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.LevelId, Is.Not.EqualTo(RoadmapLevelId.B2));
    }

    [Test]
    [Property("PlanId", "RM-17")]
    public async Task Handle_ValidSelfSelect_EnrollsAtThatLevel()
    {
        // Arrange
        var (db, userId) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitPlacementCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var response = await handler.Handle(
            new SubmitPlacementCommand(RoadmapTrackType.Cefr, RoadmapLevelId.A2, null), CancellationToken.None);

        // Assert
        var roadmap = await db.UserRoadmaps.AsNoTracking().SingleAsync(r => r.UserId == userId);
        Assert.Multiple(() =>
        {
            Assert.That(response.Data!.LevelId, Is.EqualTo(RoadmapLevelId.A2));
            Assert.That(roadmap.LevelId, Is.EqualTo(RoadmapLevelId.A2));
            Assert.That(roadmap.Track, Is.EqualTo(RoadmapTrackType.Cefr));
            Assert.That(roadmap.Placement, Is.Not.Null); // no placement_completed column: non-null placement JSON marks completion
        });
    }

    [Test]
    [Property("PlanId", "RM-18")]
    [Category("KnownDeviation")]
    public async Task Handle_SelfSelectLevelFromAnotherTrack_IsRejected()
    {
        // Arrange (original: 400 when the level is not in the track's level list, e.g. CEFR + lop-10)
        var (db, userId) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitPlacementCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(
                new SubmitPlacementCommand(RoadmapTrackType.Cefr, RoadmapLevelId.Lop10, null), CancellationToken.None),
            Throws.InstanceOf<DomainException>());
    }

    /// <summary>
    /// Original only scores answers for the CEFR track; TOEIC/THPT placement needs selfSelect
    /// (src/app/api/roadmap/placement/route.ts:52-61, "Thieu answers hoac selfSelect"). The C# handler derives a CEFR level for any track.
    /// </summary>
    [Test]
    [Property("PlanId", "RM-16")]
    [Category("KnownDeviation")]
    public async Task Handle_ToeicTrackWithAnswersOnly_IsRejected()
    {
        // Arrange
        var (db, userId) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitPlacementCommandHandler(TestHelpers.CreateUser(userId), db);
        var answers = new Dictionary<string, string> { ["q1"] = "a" };

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new SubmitPlacementCommand(RoadmapTrackType.Toeic, null, answers), CancellationToken.None),
            Throws.InstanceOf<DomainException>());
    }

    [Test]
    [Property("PlanId", "RM-13")]
    public async Task Handle_PlacementOnTwoTracks_KeepsTracksIndependent()
    {
        // Arrange
        var (db, userId) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitPlacementCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        await handler.Handle(new SubmitPlacementCommand(RoadmapTrackType.Cefr, RoadmapLevelId.A1, null), CancellationToken.None);
        await handler.Handle(new SubmitPlacementCommand(RoadmapTrackType.Toeic, RoadmapLevelId.Toeic450, null), CancellationToken.None);

        // Assert
        var roadmaps = await db.UserRoadmaps.AsNoTracking().Where(r => r.UserId == userId).ToListAsync();
        Assert.Multiple(() =>
        {
            Assert.That(roadmaps, Has.Count.EqualTo(2));
            Assert.That(roadmaps.Single(r => r.Track == RoadmapTrackType.Cefr).LevelId, Is.EqualTo(RoadmapLevelId.A1));
            Assert.That(roadmaps.Single(r => r.Track == RoadmapTrackType.Toeic).LevelId, Is.EqualTo(RoadmapLevelId.Toeic450));
        });
    }

    [Test]
    [Property("PlanId", "RM-19")]
    public async Task Handle_RePlacementOnSameTrack_UpdatesExistingRowWithoutDuplicate()
    {
        // Arrange
        var (db, userId) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitPlacementCommandHandler(TestHelpers.CreateUser(userId), db);
        await handler.Handle(new SubmitPlacementCommand(RoadmapTrackType.Cefr, RoadmapLevelId.A1, null), CancellationToken.None);

        // Act
        await handler.Handle(new SubmitPlacementCommand(RoadmapTrackType.Cefr, RoadmapLevelId.B1, null), CancellationToken.None);

        // Assert
        var roadmaps = await db.UserRoadmaps.AsNoTracking().Where(r => r.UserId == userId).ToListAsync();
        Assert.Multiple(() =>
        {
            Assert.That(roadmaps, Has.Count.EqualTo(1));
            Assert.That(roadmaps[0].LevelId, Is.EqualTo(RoadmapLevelId.B1));
        });
    }

    [Test]
    [Property("PlanId", "RM-20")]
    public async Task Handle_AnonymousUser_ThrowsUnauthorized()
    {
        // Arrange
        var (db, _) = await SeedAsync();
        await using var _db = db;
        var handler = new SubmitPlacementCommandHandler(TestHelpers.CreateUser(null), db);

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(
                new SubmitPlacementCommand(RoadmapTrackType.Cefr, RoadmapLevelId.A1, null), CancellationToken.None),
            Throws.TypeOf<UnauthorizedAccessException>());
    }

    [Test]
    [Property("PlanId", "RM-17")]
    public void Validate_NeitherSelfSelectNorAnswers_IsInvalid()
    {
        // Arrange
        var validator = new SubmitPlacementCommandValidator();

        // Act
        var result = validator.Validate(new SubmitPlacementCommand(RoadmapTrackType.Cefr, null, null));

        // Assert
        Assert.That(result.IsValid, Is.False);
    }
}
