using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace LingoPro.Infrastructure.Security;

/// <summary>
/// Issues short-lived JWT Access Tokens (15 minutes) and long-lived signed Refresh Tokens (30 days).
/// The refresh token is a signed JWT with its own audience so it can never be accepted as an access token.
/// </summary>
public sealed class JwtTokenService : IJwtTokenService
{
    private const string TokenUseClaim = "token_use";
    private const string RefreshTokenUse = "refresh";
    private const string PlanClaim = "plan";

    private readonly JwtOptions _options;

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    private string RefreshAudience => $"{_options.Audience}:refresh";

    private SymmetricSecurityKey SigningKey => new(Encoding.UTF8.GetBytes(_options.SigningKey));

    public JwtTokenPairDto GenerateTokenPair(Profile profile)
    {
        var now = DateTime.UtcNow;
        var accessExpires = now.AddMinutes(_options.AccessTokenExpirationMinutes);
        var refreshExpires = now.AddDays(_options.RefreshTokenExpirationDays);
        var creds = new SigningCredentials(SigningKey, SecurityAlgorithms.HmacSha256);
        var handler = new JwtSecurityTokenHandler();

        var accessClaims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, profile.Id.ToString()),
            new(ClaimTypes.NameIdentifier, profile.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, profile.Email),
            new(ClaimTypes.Email, profile.Email),
            new(ClaimTypes.Role, profile.Role.ToString().ToLowerInvariant()),
            new(PlanClaim, profile.Plan.ToString().ToLowerInvariant()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };

        var accessJwt = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: accessClaims,
            notBefore: now,
            expires: accessExpires,
            signingCredentials: creds);

        var refreshClaims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, profile.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, profile.Email),
            new(ClaimTypes.Role, profile.Role.ToString()),
            new(PlanClaim, profile.Plan.ToString()),
            new(TokenUseClaim, RefreshTokenUse),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };

        var refreshJwt = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: RefreshAudience,
            claims: refreshClaims,
            notBefore: now,
            expires: refreshExpires,
            signingCredentials: creds);

        return new JwtTokenPairDto(
            AccessToken: handler.WriteToken(accessJwt),
            RefreshToken: handler.WriteToken(refreshJwt),
            AccessTokenExpiresAtUtc: accessExpires,
            RefreshTokenExpiresAtUtc: refreshExpires);
    }

    public RefreshTokenClaims? ValidateRefreshToken(string? refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return null;
        }

        var parameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = SigningKey,
            ValidateIssuer = true,
            ValidIssuer = _options.Issuer,
            ValidateAudience = true,
            ValidAudience = RefreshAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            // Keep raw claim names so "sub" is not remapped to NameIdentifier.
            NameClaimType = JwtRegisteredClaimNames.Sub
        };

        try
        {
            var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
            var principal = handler.ValidateToken(refreshToken, parameters, out _);

            if (principal.FindFirst(TokenUseClaim)?.Value != RefreshTokenUse ||
                !Guid.TryParse(principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value, out var userId))
            {
                return null;
            }

            var email = principal.FindFirst(JwtRegisteredClaimNames.Email)?.Value ?? string.Empty;
            var role = Enum.TryParse<UserRole>(principal.FindFirst(ClaimTypes.Role)?.Value
                ?? principal.FindFirst("role")?.Value, ignoreCase: true, out var parsedRole)
                ? parsedRole
                : UserRole.Student;
            var plan = Enum.TryParse<SubscriptionPlanType>(principal.FindFirst(PlanClaim)?.Value, ignoreCase: true, out var parsedPlan)
                ? parsedPlan
                : SubscriptionPlanType.Pro;

            return string.IsNullOrWhiteSpace(email) ? null : new RefreshTokenClaims(userId, email, role, plan);
        }
        catch (Exception ex) when (ex is SecurityTokenException or ArgumentException)
        {
            return null;
        }
    }
}
