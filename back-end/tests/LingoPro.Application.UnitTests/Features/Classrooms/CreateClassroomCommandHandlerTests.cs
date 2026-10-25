using LingoPro.Application.Common.Behaviors;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Classrooms.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence.Repositories;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Classrooms;

/// <summary>
/// NUnit business unit tests for <see cref="CreateClassroomCommandHandler"/> and <see cref="AuthorizationBehavior{TRequest,TResponse}"/>
/// enforcing Teacher/Admin authorization via <see cref="LingoPro.Application.Common.Security.AuthorizeAttribute"/> (plan ID CLS-18).
/// </summary>
[TestFixture]
[Category("Classrooms")]
public sealed class CreateClassroomCommandHandlerTests
{
    /// <summary>CLS-18: a student is rejected by the authorization pipeline before the handler runs.</summary>
    [Test]
    [Property("PlanId", "CLS-18")]
    public void Handle_CallerIsStudent_ThrowsForbiddenViaAuthorizationBehavior()
    {
        // Arrange
        using var db = TestHelpers.CreateDb();
        var currentUser = TestHelpers.CreateUser(Guid.NewGuid(), UserRole.Student);
        var authBehavior = new AuthorizationBehavior<CreateClassroomCommand, ApiResponse<ClassroomDto>>(currentUser);
        var handler = new CreateClassroomCommandHandler(currentUser, new ClassroomRepository(db));
        var command = new CreateClassroomCommand("TOEIC 800+ Intensive", "Evening class");

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(
            async () => await authBehavior.Handle(
                command,
                () => handler.Handle(command, CancellationToken.None),
                CancellationToken.None));
        Assert.That(db.Classrooms.Count(), Is.EqualTo(0));
    }

    /// <summary>CLS-08: a teacher creates a classroom; the response is 201 and carries the name, a 6-character invite code and the teacher id.</summary>
    [Test]
    [Property("PlanId", "CLS-08")]
    public async Task Handle_CallerIsTeacher_CreatesClassroomAndReturns201()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var teacherId = Guid.NewGuid();
        var currentUser = TestHelpers.CreateUser(teacherId, UserRole.Teacher);
        var authBehavior = new AuthorizationBehavior<CreateClassroomCommand, ApiResponse<ClassroomDto>>(currentUser);
        var handler = new CreateClassroomCommandHandler(currentUser, new ClassroomRepository(db));
        var command = new CreateClassroomCommand("IELTS Academic 7.5", "Advanced cohort");

        // Act
        var response = await authBehavior.Handle(
            command,
            () => handler.Handle(command, CancellationToken.None),
            CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.StatusCode, Is.EqualTo(201));
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data, Is.Not.Null);
            Assert.That(response.Data!.Name, Is.EqualTo("IELTS Academic 7.5"));
            Assert.That(response.Data.Description, Is.EqualTo("Advanced cohort"));
            Assert.That(response.Data.InviteCode, Has.Length.EqualTo(6));
            Assert.That(response.Data.TeacherId, Is.EqualTo(teacherId));
            Assert.That(db.Classrooms.Count(), Is.EqualTo(1));
        });
    }

    /// <summary>CLS-18: anonymous callers cannot create a classroom.</summary>
    [Test]
    [Property("PlanId", "CLS-18")]
    public async Task Handle_AnonymousCaller_ThrowsUnauthorized()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new CreateClassroomCommandHandler(TestHelpers.CreateUser(null), new ClassroomRepository(db));

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await handler.Handle(new CreateClassroomCommand("X", null), CancellationToken.None));
    }
}
