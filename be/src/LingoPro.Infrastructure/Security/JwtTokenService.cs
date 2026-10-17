using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Domain.Entities.Auth;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace LingoPro.Infrastructure.Security;

/// <summary>
/// Issues short-lived JWT Access Tokens (15 minutes) and long-lived Refresh Tokens (30 days).
/// </summary>
public sealed class JwtTokenService : IJwtTokenService
{
    private readonly JwtOptions _options;

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    public JwtTokenPairDto GenerateTokenPair(Profile profile)
    {
        var now = DateTime.UtcNow;
        var accessExpires = now.AddMinutes(_options.AccessTokenExpirationMinutes);
        var refreshExpires = now.AddDays(_options.RefreshTokenExpirationDays);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, profile.Id.ToString()),
            new(ClaimTypes.NameIdentifier, profile.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, profile.Email),
            new(ClaimTypes.Email, profile.Email),
            new(ClaimTypes.Role, profile.Role.ToString().ToLowerInvariant()),
            new("plan", profile.Plan.ToString().ToLowerInvariant()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var jwt = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now,
            expires: accessExpires,
            signingCredentials: creds);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(jwt);
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

        return new JwtTokenPairDto(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            AccessTokenExpiresAtUtc: accessExpires,
            RefreshTokenExpiresAtUtc: refreshExpires);
    }
}
