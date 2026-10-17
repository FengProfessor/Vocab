namespace LingoPro.WebApi.Controllers.Ssr;

/// <summary>
/// Form payload submitted to the server-side rendered login page.
/// </summary>
public sealed record ServerLoginFormRequest(
    string Email,
    string Password,
    string? ReturnUrl = "/app/journey");
