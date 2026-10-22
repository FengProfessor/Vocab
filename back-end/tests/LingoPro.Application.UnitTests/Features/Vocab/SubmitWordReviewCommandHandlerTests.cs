using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Features.Vocab.Commands;
using LingoPro.Application.Features.Vocab.Queries;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Vocab;
using LingoPro.Domain.Enums;
using LingoPro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Vocab;

/// <summary>
/// NUnit business unit tests for <see cref="SubmitWordReviewCommandHandler"/> verifying FSRS-5 persistence and XP awards (XP/streak live in UserGamification;
/// quality 5 => 15 XP per XP_BY_QUALITY, src/lib/gamification.ts:4-9).
/// </summary>
[TestFixture]
public sealed class SubmitWordReviewCommandHandlerTests
{
    [Test]
    public async Task Handle_ValidWordReview_PersistsFsrsProgressAndAwardsProfileXp()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<LingoProDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new LingoProDbContext(options);

        var userId = Guid.NewGuid();
        var profile = new Profile
        {
            Id = userId,
            Email = "learner@lingopro.online",
            FullName = "Learner",
            Role = UserRole.Student
        };
        var word = new Word
        {
            Id = Guid.NewGuid(),
            Term = "resilient",
            Pos = "adjective",
            Translation = "Able to withstand or recover quickly from difficult conditions",
            ClassroomId = Guid.NewGuid(),
            AddedBy = userId
        };

        db.Profiles.Add(profile);
        db.Words.Add(word);
        await db.SaveChangesAsync();

        var currentUser = Substitute.For<ICurrentUserService>();
        currentUser.UserId.Returns(userId);
        currentUser.IsAuthenticated.Returns(true);

        var handler = new SubmitWordReviewCommandHandler(currentUser, db);
        var command = new SubmitWordReviewCommand(word.Id, Quality: 5, ReviewId: Guid.NewGuid().ToString());

        // Act
        var response = await handler.Handle(command, CancellationToken.None);

        // Assert
        var updatedGamification = await db.UserGamifications.FirstAsync(x => x.UserId == userId);
        Assert.Multiple(() =>
        {
            Assert.That(response.StatusCode, Is.EqualTo(200));
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data, Is.Not.Null);
            Assert.That(response.Data!.WordId, Is.EqualTo(word.Id));
            Assert.That(response.Data.State, Is.EqualTo(SrsCardState.Review));
            Assert.That(response.Data.XpAwarded, Is.EqualTo(15));
            Assert.That(updatedGamification.TotalXp, Is.EqualTo(15));
            Assert.That(updatedGamification.CurrentStreak, Is.EqualTo(1));
        });
    }
}
