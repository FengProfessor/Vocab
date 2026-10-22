using LingoPro.Application.Common.Behaviors;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.SpeakingFoundation.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Speaking;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.SpeakingFoundation;

/// <summary>
/// Unit tests for <see cref="RecordLexicalEvidenceCommandHandler"/>, <see cref="RecordTeacherLexicalObservationCommandHandler"/>
/// and their validators (plan IDs SF-01..SF-12, SF-15..SF-17): confidence increments, status buckets, validation.
/// </summary>
[TestFixture]
[Category("SpeakingFoundation")]
public sealed class RecordLexicalEvidenceCommandHandlerTests
{
    private static RecordLexicalEvidenceCommand Evidence(Guid concept, bool success, string probe = "receptive_recognition") =>
        new(concept, LexicalEvidenceSource.Learner, LexicalSupportLevel.Independent, probe, success, 500);

    /// <summary>SF-01: first correct evidence adds +0.35 confidence and creates the state.</summary>
    [Test]
    [Property("PlanId", "SF-01")]
    public async Task Handle_FirstSuccessfulEvidence_ConfidenceIs035AndBucketUncertain()
    {
        // Arrange
        var learner = Guid.NewGuid();
        var concept = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        var handler = new RecordLexicalEvidenceCommandHandler(TestHelpers.CreateUser(learner), db);

        // Act
        var response = await handler.Handle(Evidence(concept, true), CancellationToken.None);

        // Assert
        var state = await db.LearnerLexicalStates.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(state.LearnerId, Is.EqualTo(learner));
            Assert.That(state.ConceptId, Is.EqualTo(concept));
            Assert.That(state.ConfidenceScore, Is.EqualTo(0.35).Within(1e-9));
            Assert.That(state.EvidenceCount, Is.EqualTo(1));
            Assert.That(response.Data, Is.EqualTo(LexicalStatusBucket.Uncertain));
        });
    }

    /// <summary>SF-02: bucket thresholds (0.40 Partial, 0.75 Solid) as evidence accumulates.</summary>
    [TestCase(1, LexicalStatusBucket.Uncertain)]
    [TestCase(2, LexicalStatusBucket.Partial)]
    [TestCase(3, LexicalStatusBucket.Solid)]
    [TestCase(5, LexicalStatusBucket.Solid)]
    [Property("PlanId", "SF-02")]
    public async Task Handle_RepeatedSuccesses_ReachExpectedBucket(int successes, LexicalStatusBucket expected)
    {
        // Arrange
        var learner = Guid.NewGuid();
        var concept = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        var handler = new RecordLexicalEvidenceCommandHandler(TestHelpers.CreateUser(learner), db);

        // Act
        ApiResponse<LexicalStatusBucket> response = null!;
        for (var i = 0; i < successes; i++)
        {
            response = await handler.Handle(Evidence(concept, true), CancellationToken.None);
        }

        // Assert
        var state = await db.LearnerLexicalStates.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.Data, Is.EqualTo(expected));
            Assert.That(state.StatusBucket, Is.EqualTo(expected));
            Assert.That(state.EvidenceCount, Is.EqualTo(successes));
            Assert.That(state.ConfidenceScore, Is.LessThanOrEqualTo(1.0));
        });
    }

    /// <summary>SF-04: a failed evidence lowers confidence by 0.25 and never goes below 0.</summary>
    [Test]
    [Property("PlanId", "SF-04")]
    public async Task Handle_FailedEvidence_DecreasesConfidenceAndFloorsAtZero()
    {
        // Arrange
        var learner = Guid.NewGuid();
        var concept = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        db.LearnerLexicalStates.Add(new LearnerLexicalState
        {
            LearnerId = learner,
            ConceptId = concept,
            ConfidenceScore = 0.5,
            EvidenceCount = 2
        });
        await db.SaveChangesAsync();
        var handler = new RecordLexicalEvidenceCommandHandler(TestHelpers.CreateUser(learner), db);

        // Act
        await handler.Handle(Evidence(concept, false), CancellationToken.None);
        var afterOne = (await db.LearnerLexicalStates.SingleAsync()).ConfidenceScore;
        await handler.Handle(Evidence(concept, false), CancellationToken.None);
        await handler.Handle(Evidence(concept, false), CancellationToken.None);

        // Assert
        var state = await db.LearnerLexicalStates.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(afterOne, Is.EqualTo(0.25).Within(1e-9));
            Assert.That(state.ConfidenceScore, Is.EqualTo(0.0).Within(1e-9));
            Assert.That(state.StatusBucket, Is.EqualTo(LexicalStatusBucket.Uncertain));
            Assert.That(state.EvidenceCount, Is.EqualTo(5));
        });
    }

    /// <summary>SF-03: evidence row is stored with trimmed probe type, learner and source.</summary>
    [Test]
    [Property("PlanId", "SF-03")]
    public async Task Handle_Evidence_PersistsEvidenceRowWithTrimmedProbeType()
    {
        // Arrange
        var learner = Guid.NewGuid();
        var concept = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        var handler = new RecordLexicalEvidenceCommandHandler(TestHelpers.CreateUser(learner), db);

        // Act
        await handler.Handle(Evidence(concept, true, "  productive_recall  "), CancellationToken.None);

        // Assert
        var row = await db.LearnerLexicalEvidences.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(row.LearnerId, Is.EqualTo(learner));
            Assert.That(row.ConceptId, Is.EqualTo(concept));
            Assert.That(row.ProbeType, Is.EqualTo("productive_recall"));
            Assert.That(row.EvidenceSource, Is.EqualTo(LexicalEvidenceSource.Learner));
            Assert.That(row.IsSuccessful, Is.True);
            Assert.That(row.ResponseLatencyMs, Is.EqualTo(500));
        });
    }

    /// <summary>SF-05: recording evidence for a concept that does not exist must fail with NotFound (C# silently creates state).</summary>
    [Test]
    [Property("PlanId", "SF-05")]
    [Category("KnownDeviation")]
    public async Task Handle_UnknownConceptId_ThrowsNotFound()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new RecordLexicalEvidenceCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), db);

        // Act & Assert
        Assert.ThrowsAsync<NotFoundException>(
            async () => await handler.Handle(Evidence(Guid.NewGuid(), true), CancellationToken.None));
        await Task.CompletedTask;
    }

    /// <summary>SF-06: anonymous caller is rejected.</summary>
    [Test]
    [Property("PlanId", "SF-06")]
    public async Task Handle_AnonymousUser_ThrowsUnauthorized()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new RecordLexicalEvidenceCommandHandler(TestHelpers.CreateUser(null), db);

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await handler.Handle(Evidence(Guid.NewGuid(), true), CancellationToken.None));
        await Task.CompletedTask;
    }

    /// <summary>SF-15: evidence validator rules.</summary>
    [Test]
    [Property("PlanId", "SF-15")]
    public void Validator_Evidence_RulesEnforced()
    {
        // Arrange
        var validator = new RecordLexicalEvidenceCommandValidator();
        var concept = Guid.NewGuid();

        // Act
        var ok = validator.Validate(Evidence(concept, true));
        var emptyConcept = validator.Validate(Evidence(Guid.Empty, true));
        var emptyProbe = validator.Validate(Evidence(concept, true, ""));
        var longProbe = validator.Validate(Evidence(concept, true, new string('p', 65)));
        var maxProbe = validator.Validate(Evidence(concept, true, new string('p', 64)));
        var negativeLatency = validator.Validate(new RecordLexicalEvidenceCommand(
            concept, LexicalEvidenceSource.Learner, LexicalSupportLevel.Independent, "p", true, -1));
        var badSource = validator.Validate(new RecordLexicalEvidenceCommand(
            concept, (LexicalEvidenceSource)99, LexicalSupportLevel.Independent, "p", true, 0));
        var badSupport = validator.Validate(new RecordLexicalEvidenceCommand(
            concept, LexicalEvidenceSource.Learner, (LexicalSupportLevel)99, "p", true, 0));

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(ok.IsValid, Is.True);
            Assert.That(emptyConcept.IsValid, Is.False);
            Assert.That(emptyProbe.IsValid, Is.False);
            Assert.That(longProbe.IsValid, Is.False);
            Assert.That(maxProbe.IsValid, Is.True);
            Assert.That(negativeLatency.IsValid, Is.False);
            Assert.That(badSource.IsValid, Is.False);
            Assert.That(badSupport.IsValid, Is.False);
        });
    }
}

/// <summary>
/// Unit tests for <see cref="RecordTeacherLexicalObservationCommandHandler"/> and its validator
/// (plan IDs SF-10..SF-12, SF-16/17): teacher evidence adds +0.45 and is teacher-only.
/// </summary>
[TestFixture]
[Category("SpeakingFoundation")]
public sealed class RecordTeacherLexicalObservationCommandHandlerTests
{
    private static RecordTeacherLexicalObservationCommand Obs(Guid student, Guid concept, bool success) =>
        new(student, concept, LexicalSupportLevel.Independent, success);

    /// <summary>SF-10: teacher successful observation adds +0.45 (Partial); a second reaches Solid.</summary>
    [Test]
    [Property("PlanId", "SF-10")]
    public async Task Handle_TeacherSuccess_AddsPoint45AndUpdatesBucket()
    {
        // Arrange
        var student = Guid.NewGuid();
        var concept = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        var handler = new RecordTeacherLexicalObservationCommandHandler(db);

        // Act
        var first = await handler.Handle(Obs(student, concept, true), CancellationToken.None);
        var scoreAfterFirst = (await db.LearnerLexicalStates.SingleAsync()).ConfidenceScore;
        var second = await handler.Handle(Obs(student, concept, true), CancellationToken.None);

        // Assert
        var evidences = await db.LearnerLexicalEvidences.ToListAsync();
        Assert.Multiple(() =>
        {
            Assert.That(scoreAfterFirst, Is.EqualTo(0.45).Within(1e-9));
            Assert.That(first.Data, Is.EqualTo(LexicalStatusBucket.Partial));
            Assert.That(second.Data, Is.EqualTo(LexicalStatusBucket.Solid));
            Assert.That(evidences, Has.Count.EqualTo(2));
            Assert.That(evidences.All(e => e.EvidenceSource == LexicalEvidenceSource.Teacher && e.LearnerId == student), Is.True);
            Assert.That(evidences[0].ProbeType, Is.EqualTo("teacher_classroom_observation"));
        });
    }

    /// <summary>SF-10: teacher failed observation on a fresh state yields Recheck.</summary>
    [Test]
    [Property("PlanId", "SF-10")]
    public async Task Handle_TeacherFailureOnFreshState_BucketRecheck()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new RecordTeacherLexicalObservationCommandHandler(db);

        // Act
        var response = await handler.Handle(Obs(Guid.NewGuid(), Guid.NewGuid(), false), CancellationToken.None);

        // Assert
        var state = await db.LearnerLexicalStates.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.Data, Is.EqualTo(LexicalStatusBucket.Recheck));
            Assert.That(state.ConfidenceScore, Is.EqualTo(0.0).Within(1e-9));
        });
    }

    /// <summary>SF-12: a student calling the teacher-only command is rejected by the authorization pipeline.</summary>
    [Test]
    [Property("PlanId", "SF-12")]
    public async Task Pipeline_StudentCaller_ThrowsForbidden()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var user = TestHelpers.CreateUser(Guid.NewGuid(), UserRole.Student);
        var behavior = new AuthorizationBehavior<RecordTeacherLexicalObservationCommand, ApiResponse<LexicalStatusBucket>>(user);
        var handler = new RecordTeacherLexicalObservationCommandHandler(db);
        var command = Obs(Guid.NewGuid(), Guid.NewGuid(), true);

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(async () => await behavior.Handle(
            command, () => handler.Handle(command, CancellationToken.None), CancellationToken.None));
        await Task.CompletedTask;
    }

    /// <summary>SF-12: a teacher caller passes the authorization pipeline.</summary>
    [Test]
    [Property("PlanId", "SF-12")]
    public async Task Pipeline_TeacherCaller_Succeeds()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var user = TestHelpers.CreateUser(Guid.NewGuid(), UserRole.Teacher);
        var behavior = new AuthorizationBehavior<RecordTeacherLexicalObservationCommand, ApiResponse<LexicalStatusBucket>>(user);
        var handler = new RecordTeacherLexicalObservationCommandHandler(db);
        var command = Obs(Guid.NewGuid(), Guid.NewGuid(), true);

        // Act
        var response = await behavior.Handle(
            command, () => handler.Handle(command, CancellationToken.None), CancellationToken.None);

        // Assert
        Assert.That(response.Success, Is.True);
    }

    /// <summary>SF-11: a teacher recording an observation for a concept that does not exist must fail with NotFound.</summary>
    [Test]
    [Property("PlanId", "SF-11")]
    [Category("KnownDeviation")]
    public async Task Handle_UnknownConceptId_ThrowsNotFound()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new RecordTeacherLexicalObservationCommandHandler(db);

        // Act & Assert
        Assert.ThrowsAsync<NotFoundException>(
            async () => await handler.Handle(Obs(Guid.NewGuid(), Guid.NewGuid(), true), CancellationToken.None));
        await Task.CompletedTask;
    }

    /// <summary>SF-16: teacher observation validator rules.</summary>
    [Test]
    [Property("PlanId", "SF-16")]
    public void Validator_TeacherObservation_RulesEnforced()
    {
        // Arrange
        var validator = new RecordTeacherLexicalObservationCommandValidator();
        var id = Guid.NewGuid();

        // Act
        var ok = validator.Validate(Obs(id, id, true));
        var noStudent = validator.Validate(Obs(Guid.Empty, id, true));
        var noConcept = validator.Validate(Obs(id, Guid.Empty, true));
        var badSupport = validator.Validate(new RecordTeacherLexicalObservationCommand(id, id, (LexicalSupportLevel)99, true));
        var negativeLatency = validator.Validate(new RecordTeacherLexicalObservationCommand(id, id, LexicalSupportLevel.Prompted, true, -1));

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(ok.IsValid, Is.True);
            Assert.That(noStudent.IsValid, Is.False);
            Assert.That(noConcept.IsValid, Is.False);
            Assert.That(badSupport.IsValid, Is.False);
            Assert.That(negativeLatency.IsValid, Is.False);
        });
    }
}
