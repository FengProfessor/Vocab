using LingoPro.Application.Features.AdminCrm.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.AdminCrm;

/// <summary>
/// Unit tests for <see cref="SubscribePilotLeadCommandHandler"/> and <see cref="SubscribePilotLeadCommandValidator"/>
/// (plan IDs AD-07..AD-10): new lead, duplicate email idempotency, null phone, validation.
/// </summary>
[TestFixture]
[Category("AdminCrm")]
public sealed class SubscribePilotLeadCommandHandlerTests
{
    /// <summary>AD-07: a new lead is stored (trimmed, lowercase email, status New) and its id returned with 201.</summary>
    [Test]
    [Property("PlanId", "AD-07")]
    public async Task Handle_NewLead_PersistsNormalizedLead()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new SubscribePilotLeadCommandHandler(db);
        var command = new SubscribePilotLeadCommand("  Nguyen Van A ", "  Teacher@School.EDU ", " 0901234567 ", " ABC School ", " landing ");

        // Act
        var response = await handler.Handle(command, CancellationToken.None);

        // Assert
        var lead = await db.PilotLeads.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.StatusCode, Is.EqualTo(201));
            Assert.That(response.Data, Is.EqualTo(lead.Id));
            Assert.That(lead.FullName, Is.EqualTo("Nguyen Van A"));
            Assert.That(lead.Email, Is.EqualTo("teacher@school.edu"));
            Assert.That(lead.Phone, Is.EqualTo("0901234567"));
            Assert.That(lead.OrganizationName, Is.EqualTo("ABC School"));
            Assert.That(lead.SourceCampaign, Is.EqualTo("landing"));
            Assert.That(lead.Status, Is.EqualTo(PilotLeadStatus.New));
        });
    }

    /// <summary>AD-08: a duplicate email (case-insensitive) returns the existing id without creating another lead.</summary>
    [Test]
    [Property("PlanId", "AD-08")]
    public async Task Handle_DuplicateEmail_ReturnsExistingId()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new SubscribePilotLeadCommandHandler(db);
        var first = await handler.Handle(new SubscribePilotLeadCommand("A", "dup@t.local"), CancellationToken.None);

        // Act
        var second = await handler.Handle(new SubscribePilotLeadCommand("B", "DUP@T.local "), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(second.Data, Is.EqualTo(first.Data));
            Assert.That(db.PilotLeads.Count(), Is.EqualTo(1));
        });
    }

    /// <summary>AD-09: a null phone (omitted/null in JSON) must not crash with a NullReferenceException.</summary>
    [Test]
    [Property("PlanId", "AD-09")]
    [Category("KnownDeviation")]
    public async Task Handle_NullPhone_DoesNotThrowNullReference()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new SubscribePilotLeadCommandHandler(db);
        var command = new SubscribePilotLeadCommand("Name", "nophone@t.local", null!);

        // Act
        Exception? caught = null;
        try
        {
            await handler.Handle(command, CancellationToken.None);
        }
        catch (Exception ex)
        {
            caught = ex;
        }

        // Assert
        Assert.That(caught, Is.Not.InstanceOf<NullReferenceException>());
    }

    /// <summary>AD-10: validator rules (name, email, campaign).</summary>
    [Test]
    [Property("PlanId", "AD-10")]
    public void Validator_Rules_Enforced()
    {
        // Arrange
        var validator = new SubscribePilotLeadCommandValidator();

        // Act
        var ok = validator.Validate(new SubscribePilotLeadCommand("Name", "a@b.com"));
        var noName = validator.Validate(new SubscribePilotLeadCommand("", "a@b.com"));
        var longName = validator.Validate(new SubscribePilotLeadCommand(new string('n', 151), "a@b.com"));
        var maxName = validator.Validate(new SubscribePilotLeadCommand(new string('n', 150), "a@b.com"));
        var noEmail = validator.Validate(new SubscribePilotLeadCommand("Name", ""));
        var badEmail = validator.Validate(new SubscribePilotLeadCommand("Name", "not-an-email"));
        var noCampaign = validator.Validate(new SubscribePilotLeadCommand("Name", "a@b.com", "", null, ""));
        var longCampaign = validator.Validate(new SubscribePilotLeadCommand("Name", "a@b.com", "", null, new string('c', 65)));

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(ok.IsValid, Is.True);
            Assert.That(noName.IsValid, Is.False);
            Assert.That(longName.IsValid, Is.False);
            Assert.That(maxName.IsValid, Is.True);
            Assert.That(noEmail.IsValid, Is.False);
            Assert.That(badEmail.IsValid, Is.False);
            Assert.That(noCampaign.IsValid, Is.False);
            Assert.That(longCampaign.IsValid, Is.False);
        });
    }
}
