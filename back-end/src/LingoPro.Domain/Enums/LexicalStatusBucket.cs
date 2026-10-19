using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines mastery classification buckets for learner lexical states ('SOLID', 'PARTIAL', 'UNKNOWN', 'UNCERTAIN', 'RECHECK').
/// </summary>
public enum LexicalStatusBucket
{
    [Display(Name = "Solid")]
    Solid,
    [Display(Name = "Partial")]
    Partial,
    [Display(Name = "Unknown")]
    Unknown,
    [Display(Name = "Uncertain")]
    Uncertain,
    [Display(Name = "Recheck")]
    Recheck,
}
