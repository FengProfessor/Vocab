namespace LingoPro.WebApi.Controllers;

/// <summary>
/// Represents a single member entry within a serialized LingoPro domain enum.
/// </summary>
/// <param name="Name">Canonical PascalCase enum member identifier.</param>
/// <param name="NumericValue">Underlying integer ordinal value in the C# domain enum.</param>
public sealed record EnumMemberItemDto(string Name, int NumericValue);
