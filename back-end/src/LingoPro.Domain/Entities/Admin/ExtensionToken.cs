using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Admin;

/// <summary>
/// Represents a personal access token minted for the LingoPro browser extension (public.extension_tokens).
/// </summary>
public class ExtensionToken : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public string Name { get; set; } = "Chrome Extension";
    public DateTime? LastUsedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }

    public virtual Profile User { get; set; } = null!;
}
