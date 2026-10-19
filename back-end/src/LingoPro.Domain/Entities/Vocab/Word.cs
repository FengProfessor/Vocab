using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Vocab;

/// <summary>
/// Represents a vocabulary word entry in a global pack or teacher classroom (public.words).
/// </summary>
public class Word : BaseAuditableEntity
{
    public string Term { get; set; } = string.Empty;
    public string Ipa { get; set; } = string.Empty;
    public string Translation { get; set; } = string.Empty;
    public PartOfSpeechType PartOfSpeech { get; set; } = PartOfSpeechType.Noun;
    public string? ImageUrl { get; set; }
    public string? ExampleSentence { get; set; }
    public string? ExampleTranslation { get; set; }
    public string Topic { get; set; } = "general";
    public CertLevel Level { get; set; } = CertLevel.A1;
    public WordApprovalStatus Status { get; set; } = WordApprovalStatus.Approved;
    public Guid? AddedBy { get; set; }
    public Guid? ClassroomId { get; set; }

    public virtual ClassroomEntity? Classroom { get; set; }
    public virtual Profile? AddedByUser { get; set; }
    public virtual ICollection<SrsProgress> SrsProgresses { get; set; } = new List<SrsProgress>();
}
