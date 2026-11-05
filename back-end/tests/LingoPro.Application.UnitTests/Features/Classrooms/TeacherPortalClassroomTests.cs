using LingoPro.Application.Features.Classrooms.Commands;
using LingoPro.Application.Features.Classrooms.Queries;
using LingoPro.Application.Features.Grammar.Commands;
using LingoPro.Application.Features.Grammar.Queries;
using LingoPro.Application.Features.Vocab.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Entities.Vocab;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence.Repositories;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Classrooms;

/// <summary>
/// NUnit unit tests verifying Teacher Portal queries and commands across Classrooms, Vocab word moderation, and Classroom Grammar exercises.
/// </summary>
[TestFixture]
[Category("Classrooms")]
public sealed class TeacherPortalClassroomTests
{
    [Test]
    public async Task TeacherStats_And_Analytics_And_StudentDetail_ReturnExpectedMetrics()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var teacherId = Guid.NewGuid();
        var studentId = Guid.NewGuid();

        var studentProfile = new Profile
        {
            Id = studentId,
            Email = "student@lingopro.edu",
            FullName = "Nguyen Van A",
            Role = UserRole.Student,
            Plan = SubscriptionPlanType.Pro
        };
        db.Profiles.Add(studentProfile);

        var classroom = new ClassroomEntity
        {
            Name = "TOEIC Intensive",
            Description = "Target 750+",
            InviteCode = "TC750A",
            TeacherId = teacherId,
            CreatedAt = DateTime.UtcNow
        };
        db.Classrooms.Add(classroom);
        db.Enrollments.Add(new Enrollment
        {
            ClassroomId = classroom.Id,
            StudentId = studentId,
            JoinedAt = DateTime.UtcNow.AddDays(-5)
        });

        var word1 = new Word
        {
            ClassroomId = classroom.Id,
            AddedBy = teacherId,
            Term = "resilient",
            Translation = "kien cuong",
            Pos = "adj",
            CreatedAt = DateTime.UtcNow.AddDays(-3)
        };
        var word2 = new Word
        {
            ClassroomId = classroom.Id,
            AddedBy = teacherId,
            Term = "meticulous",
            Translation = "ti mi",
            Pos = "adj",
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        };
        db.Words.AddRange(word1, word2);

        db.SrsProgresses.Add(new SrsProgress
        {
            UserId = studentId,
            WordId = word1.Id,
            Stability = 6.5,
            Difficulty = 7.2,
            EaseFactor = 2.6,
            IntervalDays = 6,
            ReviewCount = 4,
            NextReviewDate = DateTime.UtcNow.AddDays(3),
            LastReviewedAt = DateTime.UtcNow.AddHours(-2)
        });

        await db.SaveChangesAsync();

        var user = TestHelpers.CreateUser(teacherId, UserRole.Teacher);
        var repo = new ClassroomRepository(db);

        // Act
        var statsRes = await new GetTeacherStatsQueryHandler(user, repo)
            .Handle(new GetTeacherStatsQuery(classroom.Id), CancellationToken.None);
        var analyticsRes = await new GetTeacherAnalyticsQueryHandler(user, repo)
            .Handle(new GetTeacherAnalyticsQuery(classroom.Id), CancellationToken.None);
        var detailRes = await new GetTeacherStudentDetailQueryHandler(user, repo)
            .Handle(new GetTeacherStudentDetailQuery(studentId, classroom.Id), CancellationToken.None);
        var errorsRes = await new GetTeacherStudentErrorsQueryHandler(user, repo)
            .Handle(new GetTeacherStudentErrorsQuery(studentId, classroom.Id), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(statsRes.Data!.Classrooms, Has.Count.EqualTo(1));
            Assert.That(statsRes.Data.Classrooms[0].EnrollmentCount, Is.EqualTo(1));
            Assert.That(statsRes.Data.Students, Has.Count.EqualTo(1));
            Assert.That(statsRes.Data.Students[0].TotalWordsLearned, Is.EqualTo(1));
            Assert.That(statsRes.Data.Students[0].Vms, Is.GreaterThan(0));

            Assert.That(analyticsRes.Data!.ClassStats.TotalStudents, Is.EqualTo(1));
            Assert.That(analyticsRes.Data.ClassStats.TotalWords, Is.EqualTo(2));
            Assert.That(analyticsRes.Data.WordCoverage, Has.Count.EqualTo(2));
            Assert.That(analyticsRes.Data.WordDifficulty, Has.Count.EqualTo(1));
            Assert.That(analyticsRes.Data.ActivityFeed, Has.Count.EqualTo(1));

            Assert.That(detailRes.Data!.Current, Is.Not.Null);
            Assert.That(detailRes.Data.History, Is.Not.Empty);
            Assert.That(detailRes.Data.Timeline, Is.Not.Empty);

            Assert.That(errorsRes.Data, Has.Count.EqualTo(1));
            Assert.That(errorsRes.Data![0].Word, Is.EqualTo("resilient"));
        });
    }

    [Test]
    public async Task AddAndRemoveStudent_EnrollsAndRemovesStudentAndPreventsDuplicate()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var teacherId = Guid.NewGuid();
        var classroom = new ClassroomEntity
        {
            Name = "IELTS 6.5",
            InviteCode = "IE6500",
            TeacherId = teacherId
        };
        db.Classrooms.Add(classroom);
        await db.SaveChangesAsync();

        var user = TestHelpers.CreateUser(teacherId, UserRole.Teacher);
        var repo = new ClassroomRepository(db);
        var addHandler = new AddClassroomStudentCommandHandler(user, repo);
        var removeHandler = new RemoveClassroomStudentCommandHandler(user, repo);

        // Act
        var added = await addHandler.Handle(
            new AddClassroomStudentCommand(classroom.Id, "newstudent@lingopro.edu"),
            CancellationToken.None);

        // Assert duplicate throws ConflictException
        Assert.ThrowsAsync<ConflictException>(async () =>
            await addHandler.Handle(
                new AddClassroomStudentCommand(classroom.Id, "newstudent@lingopro.edu"),
                CancellationToken.None));

        var removed = await removeHandler.Handle(
            new RemoveClassroomStudentCommand(classroom.Id, added.Data!.Id),
            CancellationToken.None);

        Assert.That(removed.Data, Is.True);
    }

    [Test]
    public async Task ClassroomWordCrud_And_GrammarExercises_WorkEndToEnd()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var teacherId = Guid.NewGuid();
        var classroom = new ClassroomEntity
        {
            Name = "Grammar & Vocab Lab",
            InviteCode = "GVL100",
            TeacherId = teacherId
        };
        db.Classrooms.Add(classroom);
        await db.SaveChangesAsync();

        var user = TestHelpers.CreateUser(teacherId, UserRole.Teacher);
        var vocabRepo = new VocabRepository(db);
        var grammarRepo = new GrammarRepository(db);

        // Act 1: Save, update, and delete classroom word
        var savedWord = await new SaveClassroomWordCommandHandler(user, vocabRepo).Handle(
            new SaveClassroomWordCommand(classroom.Id, "Paradigm", "Mo hinh", "/ˈpær.ə.daɪm/", "n"),
            CancellationToken.None);

        var updatedWord = await new UpdateVocabWordCommandHandler(user, vocabRepo).Handle(
            new UpdateVocabWordCommand(savedWord.Data!.WordId, "paradigm", "Hệ tư tưởng / Mô hình"),
            CancellationToken.None);

        var deletedWord = await new DeleteVocabWordCommandHandler(user, vocabRepo).Handle(
            new DeleteVocabWordCommand(savedWord.Data.WordId),
            CancellationToken.None);

        // Act 2: Generate and list classroom grammar exercises
        var generatedExercises = await new GenerateGrammarExercisesCommandHandler(user, grammarRepo).Handle(
            new GenerateGrammarExercisesCommand(classroom.Id, "Present Perfect", "intermediate", 3),
            CancellationToken.None);

        var listedExercises = await new GetClassroomGrammarExercisesQueryHandler(user, grammarRepo).Handle(
            new GetClassroomGrammarExercisesQuery(classroom.Id),
            CancellationToken.None);

        var generatedLesson = await new GenerateGrammarLessonCommandHandler(user).Handle(
            new GenerateGrammarLessonCommand("Present Perfect", "Thì hiện tại hoàn thành", "intermediate"),
            CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(savedWord.Data.AlreadyExists, Is.False);
            Assert.That(updatedWord.Data!.Translation, Is.EqualTo("Hệ tư tưởng / Mô hình"));
            Assert.That(deletedWord.Data, Is.True);

            Assert.That(generatedExercises.Data, Has.Count.EqualTo(3));
            Assert.That(listedExercises.Data, Has.Count.EqualTo(3));
            Assert.That(generatedLesson.Data!.Examples, Is.Not.Empty);
        });
    }
}
