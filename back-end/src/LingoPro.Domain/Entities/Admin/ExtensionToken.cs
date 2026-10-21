using LingoPro.Domain.Common;

namespace LingoPro.Domain.Entities.Admin;

/// <summary>
/// Represents a personal access token minted for the LingoPro browser extension (public.extension_tokens).
/// <c>user_id</c> references auth.users (not profiles), so there is no navigation property.
/// </summary>
public class ExtensionToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastUsedAt { get; set; }
    public string? DeviceName { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
}
