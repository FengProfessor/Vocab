using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Tokens;

namespace LingoPro.WebApi.Security;

/// <summary>
/// Retrieves the public JSON Web Key Set that Supabase Auth publishes for verifying asymmetric access tokens.
/// </summary>
public sealed class SupabaseJwksRetriever : IConfigurationRetriever<JsonWebKeySet>
{
    public async Task<JsonWebKeySet> GetConfigurationAsync(
        string address,
        IDocumentRetriever retriever,
        CancellationToken cancel)
    {
        var json = await retriever.GetDocumentAsync(address, cancel);
        return new JsonWebKeySet(json);
    }
}
