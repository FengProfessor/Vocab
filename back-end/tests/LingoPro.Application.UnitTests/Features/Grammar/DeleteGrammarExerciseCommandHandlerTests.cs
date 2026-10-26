using LingoPro.Application.Features.Grammar.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Entities.Grammar;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Grammar;

/// <summary>
/// NUnit unit tests for <see cref="DeleteGrammarExerciseCommandHandler"/>.
/// </summary>
[TestFixture]
[Category("Grammar")]
public sealed class DeleteGrammarExerciseCommandHandlerTests
{
    [Test]
    public async Task Handle_CreatorDeletesExercise_RemovesFromDatabase()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var teacherId = Guid.NewGuid();
        var exercise = new GrammarExercise
        {
            CreatedBy = teacherId,
            Topic = "Present Perfect",
            Question = "She ___ here since 2020.",
            CorrectAnswer = "has lived"
        };
        db.GrammarExercises.Add(exercise);
        await db.SaveChangesAsync();

        var handler = new DeleteGrammarExerciseCommandHandler(
            TestHelpers.CreateUser(teacherId, UserRole.Teacher),
            new GrammarRepository(db));

        // Act
        var response = await handler.Handle(new DeleteGrammarExerciseCommand(exercise.Id), CancellationToken.None);

        // Assert
        Assert.Multiple(async () =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data, Is.True);
            Assert.That(await db.GrammarExercises.AnyAsync(e => e.Id == exercise.Id), Is.False);
        });
    }

    [Test]
    public async Task Handle_ClassroomOwnerDeletesExercise_RemovesFromDatabase()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var teacherId = Guid.NewGuid();
        var classroom = new ClassroomEntity
        {
            Name = "Grammar 101",
            InviteCode = "GRM101",
            TeacherId = teacherId
        };
        var exercise = new GrammarExercise
        {
            ClassroomId = classroom.Id,
            Classroom = classroom,
            CreatedBy = Guid.NewGuid(),
            Topic = "Conditionals",
            Question = "If I ___ you, I would study.",
            CorrectAnswer = "were"
        };
        db.Classrooms.Add(classroom);
        db.GrammarExercises.Add(exercise);
        await db.SaveChangesAsync();

        var handler = new DeleteGrammarExerciseCommandHandler(
            TestHelpers.CreateUser(teacherId, UserRole.Teacher),
            new GrammarRepository(db));

        // Act
        var response = await handler.Handle(new DeleteGrammarExerciseCommand(exercise.Id), CancellationToken.None);

        // Assert
        Assert.That(response.Success, Is.True);
    }

    [Test]
    public async Task Handle_UnrelatedTeacher_ThrowsForbiddenAccessException()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var exercise = new GrammarExercise
        {
            CreatedBy = Guid.NewGuid(),
            Topic = "Passive Voice",
            Question = "The cake ___ eaten.",
            CorrectAnswer = "was"
        };
        db.GrammarExercises.Add(exercise);
        await db.SaveChangesAsync();

        var handler = new DeleteGrammarExerciseCommandHandler(
            TestHelpers.CreateUser(Guid.NewGuid(), UserRole.Teacher),
            new GrammarRepository(db));

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(
            async () => await handler.Handle(new DeleteGrammarExerciseCommand(exercise.Id), CancellationToken.None));
    }
}
