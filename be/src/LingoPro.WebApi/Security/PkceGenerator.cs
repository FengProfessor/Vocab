using System.Security.Cryptography;
using System.Text;

namespace LingoPro.WebApi.Security;

/// <summary>
/// RFC 7636 PKCE helper: random per-login code verifier and its S256 challenge.
/// </summary>
public static class PkceGenerator
{
    /// <summary>
    /// Creates a cryptographically random 43-character base64url code verifier.
    /// </summary>
    public static string CreateVerifier() => Base64UrlEncode(RandomNumberGenerator.GetBytes(32));

    /// <summary>
    /// Computes the S256 code challenge: BASE64URL(SHA256(ASCII(verifier))).
    /// </summary>
    public static string ComputeChallenge(string verifier) =>
        Base64UrlEncode(SHA256.HashData(Encoding.ASCII.GetBytes(verifier)));

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
}
