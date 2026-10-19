namespace LingoPro.WebApi.Controllers;

/// <summary>
/// Represents a single member entry within a serialized LingoPro domain enum.
/// </summary>
/// <param name="Name">Canonical PascalCase enum member identifier.</param>
/// <param name="Value">Synchronized string value defined via DisplayAttribute.</param>
public sealed record EnumMemberItemDto(string Name, string Value);
