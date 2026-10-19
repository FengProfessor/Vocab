namespace LingoPro.Infrastructure.Options;

/// <summary>
/// Strongly-typed configuration options for connecting to Supabase Auth, Storage, and JWT verification.
/// Bound from the <c>"Supabase"</c> configuration section in <c>appsettings.json</c> / <c>appsettings.{Environment}.json</c>.
/// </summary>
public sealed class SupabaseOptions
{
    public const string SectionName = "Supabase";

    /// <summary>
    /// Base URL of the Supabase project (for example, <c>https://&lt;project-ref&gt;.supabase.co</c>).
    /// </summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// Supabase publishable / anonymous API key sent in the <c>apikey</c> header for GoTrue Auth requests.
    /// </summary>
    public string AnonKey { get; set; } = string.Empty;

    /// <summary>
    /// Supabase service role key used for privileged server-to-server operations (such as Storage uploads).
    /// </summary>
    public string ServiceRoleKey { get; set; } = string.Empty;

    /// <summary>
    /// Optional HS256 JWT secret fallback when verifying legacy symmetric Supabase tokens alongside JWKS (ES256).
    /// </summary>
    public string JwtSecret { get; set; } = string.Empty;

    /// <summary>
    /// Default Supabase Storage bucket name for user audio recordings.
    /// </summary>
    public string StorageBucket { get; set; } = "speaking-recordings";

    /// <summary>
    /// Public base URL of the React SPA used when constructing email confirmation redirect links.
    /// </summary>
    public string FrontendBaseUrl { get; set; } = "http://localhost:5173";

    /// <summary>
    /// Returns the normalized Supabase base URL without a trailing slash.
    /// </summary>
    public string NormalizedUrl => Url.Trim().TrimEnd('/');

    /// <summary>
    /// Returns the normalized React SPA base URL without a trailing slash.
    /// </summary>
    public string NormalizedFrontendBaseUrl => FrontendBaseUrl.Trim().TrimEnd('/');
}
