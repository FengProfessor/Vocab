namespace LingoPro.Application.Common.Interfaces;

/// <summary>
/// Represents authentication credentials returned by Supabase GoTrue Auth.
/// </summary>
public record SupabaseAuthResult(
    Guid UserId,
    string Email,
    string? FullName,
    string? AvatarUrl,
    string AccessToken,
    string RefreshToken,
    int ExpiresIn
);
