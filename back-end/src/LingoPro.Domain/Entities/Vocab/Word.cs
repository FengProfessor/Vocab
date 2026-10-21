using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Classroom;

namespace LingoPro.Domain.Entities.Vocab;

/// <summary>
/// Represents a vocabulary word entry in a teacher classroom (public.words).
/// <see cref="Term"/> maps to the <c>word</c> column; <see cref="Pos"/> to <c>pos</c>.
/// </summary>
public class Word : BaseAuditableEntity
{
    public Guid ClassroomId { get; set; }
    public Guid? AddedBy { get; set; }
    public string Term { get; set; } = string.Empty;
    public string? Translation { get; set; }
    public string? Ipa { get; set; }
    public string? Pos { get; set; }
    public string? Example { get; set; }
    public string? ExampleVi { get; set; }
    public string? SourceUrl { get; set; }
    public string? ImageUrl { get; set; }
    public string? DictionaryData { get; set; }
    public string? ImageSource { get; set; }
    public short? ImageConfidence { get; set; }
    public string[]? Synonyms { get; set; } = [];
    public string[]? Antonyms { get; set; } = [];

    public virtual ClassroomEntity Classroom { get; set; } = null!;
    public virtual Profile? AddedByUser { get; set; }
    public virtual ICollection<SrsProgress> SrsProgresses { get; set; } = new List<SrsProgress>();
}