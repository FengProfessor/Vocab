using System.Text;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Tokens;

namespace LingoPro.WebApi.Security;

/// <summary>
/// Supplies the keys used to verify Supabase-issued access tokens.
/// Asymmetric keys come from the project's JWKS endpoint (cached and refreshed on unknown key ids);
/// the legacy shared HS256 secret is honored when configured.
/// </summary>
public sealed class SupabaseSigningKeyProvider
{
    private readonly ConfigurationManager<JsonWebKeySet> _jwks;
    private readonly SecurityKey? _sharedSecretKey;

    public SupabaseSigningKeyProvider(string supabaseUrl, string? sharedJwtSecret)
    {
        var address = $"{supabaseUrl}/auth/v1/.well-known/jwks.json";
        _jwks = new ConfigurationManager<JsonWebKeySet>(
            address,
            new SupabaseJwksRetriever(),
            new HttpDocumentRetriever { RequireHttps = address.StartsWith("https://", StringComparison.OrdinalIgnoreCase) });

        if (!string.IsNullOrWhiteSpace(sharedJwtSecret) &&
            !sharedJwtSecret.Contains("your-supabase", StringComparison.OrdinalIgnoreCase))
        {
            _sharedSecretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(sharedJwtSecret));
        }
    }

    /// <summary>
    /// Returns candidate verification keys for the given key id. An unknown key id triggers one JWKS refresh
    /// so a key rotation on the Supabase side is picked up without restarting the API.
    /// </summary>
    public IEnumerable<SecurityKey> GetKeys(string? kid)
    {
        var keys = LoadJwksKeys();
        if (!string.IsNullOrEmpty(kid) && keys.All(k => k.KeyId != kid))
        {
            _jwks.RequestRefresh();
            keys = LoadJwksKeys();
        }

        if (_sharedSecretKey is not null)
        {
            keys.Add(_sharedSecretKey);
        }

        return keys;
    }

    private List<SecurityKey> LoadJwksKeys()
    {
        try
        {
            var set = _jwks.GetConfigurationAsync(CancellationToken.None).GetAwaiter().GetResult();
            return [.. set.GetSigningKeys()];
        }
        catch (Exception ex) when (ex is InvalidOperationException or HttpRequestException or IOException)
        {
            // JWKS unreachable: fall back to the shared secret (if any). With no usable key validation fails closed.
            return [];
        }
    }
}
