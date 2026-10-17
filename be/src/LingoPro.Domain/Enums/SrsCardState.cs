namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines the FSRS v5 scheduling state of a vocabulary or grammar card.
/// </summary>
public enum SrsCardState
{
    New = 0,
    Learning = 1,
    Review = 2,
    Relearning = 3
}
