namespace LingoPro.WebApi.Controllers.Ssr;

/// <summary>
/// Form payload submitted to the server-side rendered auth page (supports both login and signup modes).
/// </summary>
public sealed record ServerLoginFormRequest(
    string Email,
    string Password,
    string? ReturnUrl = "/app/journey",
    string? Mode = "login",
    string? FullName = null,
    string? Role = "student",
    string? RedirectTo = null,
    string? ReferralCode = null,
    string? Website = null);
