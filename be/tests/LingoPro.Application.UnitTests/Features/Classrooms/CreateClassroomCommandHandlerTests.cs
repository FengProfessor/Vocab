using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Features.Classrooms;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Classrooms;

/// <summary>
/// NUnit business unit tests for <see cref="CreateClassroomCommandHandler"/> enforcing Teacher-only authorization.
/// </summary>
[TestFixture]
public sealed class CreateClassroomCommandHandlerTests
{
    [Test]
    public void Handle_WhenCallerIsStudent_ThrowsForbiddenAccessException()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<LingoProDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        using var db = new LingoProDbContext(options);

        var currentUser = Substitute.For<ICurrentUserService>();
        currentUser.UserId.Returns(Guid.NewGuid());
        currentUser.Role.Returns(UserRole.Student);
        currentUser.IsTeacher.Returns(false);

        var handler = new CreateClassroomCommandHandler(currentUser, db);
        var command = new CreateClassroomCommand("TOEIC 800+ Intensive", "Evening class");

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(
            async () => await handler.Handle(command, CancellationToken.None));
    }

    [Test]
    public async Task Handle_WhenCallerIsTeacher_CreatesClassroomAndReturnsApiResponseWithStatusCode201()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<LingoProDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new LingoProDbContext(options);

        var teacherId = Guid.NewGuid();
        var currentUser = Substitute.For<ICurrentUserService>();
        currentUser.UserId.Returns(teacherId);
        currentUser.Role.Returns(UserRole.Teacher);
        currentUser.IsTeacher.Returns(true);

        var handler = new CreateClassroomCommandHandler(currentUser, db);
        var command = new CreateClassroomCommand("IELTS Academic 7.5", "Advanced cohort");

        // Act
        var response = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.StatusCode, Is.EqualTo(201));
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data, Is.Not.Null);
            Assert.That(response.Data!.Name, Is.EqualTo("IELTS Academic 7.5"));
            Assert.That(response.Data.InviteCode, Has.Length.EqualTo(6));
            Assert.That(response.Data.TeacherId, Is.EqualTo(teacherId));
        });
    }
}
