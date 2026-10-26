using LingoPro.Application.Features.Classrooms.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Classrooms;

/// <summary>
/// NUnit unit tests for <see cref="DeleteClassroomCommandHandler"/> and <see cref="UpdateClassroomCommandHandler"/>.
/// </summary>
[TestFixture]
[Category("Classrooms")]
public sealed class DeleteClassroomCommandHandlerTests
{
    [Test]
    public async Task Handle_OwnerTeacherDeletesClassroom_RemovesClassroom()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var teacherId = Guid.NewGuid();
        var classroom = new ClassroomEntity
        {
            Name = "TOEIC Intensive",
            InviteCode = "CLS100",
            TeacherId = teacherId
        };
        db.Classrooms.Add(classroom);
        await db.SaveChangesAsync();

        var handler = new DeleteClassroomCommandHandler(
            TestHelpers.CreateUser(teacherId, UserRole.Teacher),
            new ClassroomRepository(db));

        // Act
        var response = await handler.Handle(new DeleteClassroomCommand(classroom.Id), CancellationToken.None);

        // Assert
        Assert.Multiple(async () =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data, Is.True);
            Assert.That(await db.Classrooms.AnyAsync(c => c.Id == classroom.Id), Is.False);
        });
    }

    [Test]
    public async Task Handle_NonOwnerTeacher_ThrowsForbiddenAccessException()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var ownerId = Guid.NewGuid();
        var otherTeacherId = Guid.NewGuid();
        var classroom = new ClassroomEntity
        {
            Name = "TOEIC Intensive",
            InviteCode = "CLS101",
            TeacherId = ownerId
        };
        db.Classrooms.Add(classroom);
        await db.SaveChangesAsync();

        var handler = new DeleteClassroomCommandHandler(
            TestHelpers.CreateUser(otherTeacherId, UserRole.Teacher),
            new ClassroomRepository(db));

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(
            async () => await handler.Handle(new DeleteClassroomCommand(classroom.Id), CancellationToken.None));
    }

    [Test]
    public async Task Handle_PersonalClassroom_ThrowsForbiddenAccessException()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var teacherId = Guid.NewGuid();
        var classroom = new ClassroomEntity
        {
            Name = "__personal__",
            InviteCode = "PER001",
            TeacherId = teacherId
        };
        db.Classrooms.Add(classroom);
        await db.SaveChangesAsync();

        var handler = new DeleteClassroomCommandHandler(
            TestHelpers.CreateUser(teacherId, UserRole.Teacher),
            new ClassroomRepository(db));

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(
            async () => await handler.Handle(new DeleteClassroomCommand(classroom.Id), CancellationToken.None));
    }

    [Test]
    public async Task UpdateHandle_OwnerTeacherUpdatesClassroom_UpdatesNameAndDescription()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var teacherId = Guid.NewGuid();
        var classroom = new ClassroomEntity
        {
            Name = "Old Name",
            Description = "Old Desc",
            InviteCode = "CLS102",
            TeacherId = teacherId
        };
        db.Classrooms.Add(classroom);
        await db.SaveChangesAsync();

        var handler = new UpdateClassroomCommandHandler(
            TestHelpers.CreateUser(teacherId, UserRole.Teacher),
            new ClassroomRepository(db));

        // Act
        var response = await handler.Handle(
            new UpdateClassroomCommand(classroom.Id, "New Name", "New Desc"),
            CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data?.Name, Is.EqualTo("New Name"));
            Assert.That(response.Data?.Description, Is.EqualTo("New Desc"));
        });
    }
}
