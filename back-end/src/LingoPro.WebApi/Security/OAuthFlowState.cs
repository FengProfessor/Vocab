namespace LingoPro.WebApi.Security;

/// <summary>
/// State carried across the Google redirect inside the encrypted OAuth flow cookie.
/// </summary>
/// <param name="Verifier">Random PKCE code verifier (never leaves the server/cookie).</param>
/// <param name="ReturnUrl">Sanitized internal path to land on after sign-in.</param>
/// <param name="Role">Requested sign-up role: "teacher" or "student".</param>
public sealed record OAuthFlowState(string Verifier, string ReturnUrl, string Role);
