using LingoPro.Application.Features.Toeic.Commands;
using LingoPro.Application.Features.Toeic.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Exam;
using LingoPro.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Toeic;

/// <summary>
/// NUnit unit tests for <see cref="ClearToeicQuestionHistoryCommandHandler"/>,
/// <see cref="SyncToeicQuestionHistoryCommandHandler"/>, and <see cref="GetToeicQuestionHistoryQueryHandler"/>.
/// </summary>
[TestFixture]
[Category("Toeic")]
public sealed class ClearToeicQuestionHistoryCommandHandlerTests
{
    [Test]
    public async Task Handle_ClearByPartNumber_DeletesOnlyTargetPartForCurrentUser()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        db.UserToeicQuestionHistories.AddRange(
            new UserToeicQuestionHistory { UserId = userId, QuestionId = "p5-q1", Part = 5, SelectedOption = "A", IsCorrect = true },
            new UserToeicQuestionHistory { UserId = userId, QuestionId = "p6-q1", Part = 6, SelectedOption = "B", IsCorrect = false },
            new UserToeicQuestionHistory { UserId = otherUserId, QuestionId = "p5-q1", Part = 5, SelectedOption = "C", IsCorrect = true });
        await db.SaveChangesAsync();

        var repo = new ExamRepository(db);
        var handler = new ClearToeicQuestionHistoryCommandHandler(TestHelpers.CreateUser(userId), repo);

        // Act
        var response = await handler.Handle(new ClearToeicQuestionHistoryCommand(PartNumber: 5), CancellationToken.None);

        // Assert
        var remaining = await db.UserToeicQuestionHistories.ToListAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data, Is.EqualTo(1));
            Assert.That(remaining, Has.Count.EqualTo(2));
            Assert.That(remaining.Any(r => r.UserId == userId && r.Part == 5), Is.False);
            Assert.That(remaining.Any(r => r.UserId == userId && r.Part == 6), Is.True);
            Assert.That(remaining.Any(r => r.UserId == otherUserId && r.Part == 5), Is.True);
        });
    }

    [Test]
    public async Task SyncAndGet_UpsertsAndRetrievesUserHistory()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        var repo = new ExamRepository(db);
        var syncHandler = new SyncToeicQuestionHistoryCommandHandler(TestHelpers.CreateUser(userId), repo);
        var getHandler = new GetToeicQuestionHistoryQueryHandler(TestHelpers.CreateUser(userId), repo);
        var now = DateTime.UtcNow;

        // Act
        var syncResult = await syncHandler.Handle(
            new SyncToeicQuestionHistoryCommand([
                new ToeicQuestionHistoryItemDto("p5-101", 5, now, true, 2, "B")
            ]),
            CancellationToken.None);
        var getResult = await getHandler.Handle(new GetToeicQuestionHistoryQuery(5), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(syncResult.Success, Is.True);
            Assert.That(syncResult.Data, Is.EqualTo(1));
            Assert.That(getResult.Data, Has.Count.EqualTo(1));
            Assert.That(getResult.Data![0].QuestionId, Is.EqualTo("p5-101"));
            Assert.That(getResult.Data![0].AttemptCount, Is.EqualTo(2));
        });
    }
}
