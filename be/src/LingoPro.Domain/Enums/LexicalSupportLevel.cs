namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines scaffolding support levels during lexical production ('INDEPENDENT', 'MODELLED', 'PROMPTED', 'NOT_YET').
/// </summary>
public enum LexicalSupportLevel
{
    Independent = 0,
    Modelled = 1,
    Prompted = 2,
    NotYet = 3
}
