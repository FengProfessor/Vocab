namespace LingoPro.WebApi.Controllers;

/// <summary>
/// Request payload for initiating Google OAuth identity linking on an authenticated account.
/// </summary>
public sealed record LinkGoogleRequest(string RedirectUri);
