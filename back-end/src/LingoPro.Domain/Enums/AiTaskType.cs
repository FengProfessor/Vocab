using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines AI coaching and evaluation task types tracked for quota and routing.
/// </summary>
public enum AiTaskType
{
    [Display(Name = "SpeakingDialogue")]
    SpeakingDialogue,
    [Display(Name = "SentenceAnalysis")]
    SentenceAnalysis,
    [Display(Name = "WritingEvaluation")]
    WritingEvaluation,
    [Display(Name = "SmartSenseSelection")]
    SmartSenseSelection,
    [Display(Name = "OcrExtraction")]
    OcrExtraction,
}
