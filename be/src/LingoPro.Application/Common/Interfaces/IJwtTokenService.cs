using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Application.Common.Interfaces;

/// <summary>
/// Issues and validates LingoPro JWT tokens (15-minute Access Token and 30-day Refresh Token).
/// </summary>
public interface IJwtTokenService
{
    JwtTokenPairDto GenerateTokenPair(Profile profile);
}
