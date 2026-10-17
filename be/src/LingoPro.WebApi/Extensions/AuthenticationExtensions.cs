using System.Security.Claims;
using System.Text;
using System.Text.Json;
using LingoPro.Application.Common.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace LingoPro.WebApi.Extensions;

/// <summary>
/// Configures JWT Bearer authentication (supporting both Authorization header and SSR HttpOnly cookies)
/// and role/subscription authorization policies.
/// </summary>
public static class AuthenticationExtensions
{
    public const string AccessTokenCookieName = "lp_access_token";
    public const string RefreshTokenCookieName = "lp_refresh_token";

    public static IServiceCollection AddSupabaseAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var jwtSigningKey = configuration["Jwt:SigningKey"]
            ?? configuration["Supabase:JwtSecret"]
            ?? "replace-with-at-least-32-byte-signing-secret-key";

        var jwtIssuer = configuration["Jwt:Issuer"] ?? "https://lingopro.online";
        var jwtAudience = configuration["Jwt:Audience"] ?? "lingopro-web-spa";

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSigningKey));

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = signingKey,
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,
                ValidateAudience = true,
                ValidAudience = jwtAudience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30),
                NameClaimType = ClaimTypes.NameIdentifier,
                RoleClaimType = ClaimTypes.Role
            };

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    // Support HttpOnly cookie token set by SSR Server-Side Login as well as Bearer header
                    if (string.IsNullOrEmpty(context.Token) &&
                        context.Request.Cookies.TryGetValue(AccessTokenCookieName, out var cookieToken))
                    {
                        context.Token = cookieToken;
                    }
                    return Task.CompletedTask;
                },
                OnTokenValidated = context =>
                {
                    if (context.Principal?.Identity is ClaimsIdentity identity)
                    {
                        var appMetaClaim = identity.FindFirst("app_metadata")?.Value;
                        if (!string.IsNullOrEmpty(appMetaClaim))
                        {
                            using var doc = JsonDocument.Parse(appMetaClaim);
                            if (doc.RootElement.TryGetProperty("app_role", out var roleProp))
                            {
                                var appRole = roleProp.GetString() ?? "student";
                                identity.AddClaim(new Claim(ClaimTypes.Role, appRole));
                            }
                            if (doc.RootElement.TryGetProperty("plan", out var planProp))
                            {
                                var plan = planProp.GetString() ?? "free";
                                identity.AddClaim(new Claim("plan", plan));
                            }
                        }
                    }
                    return Task.CompletedTask;
                },
                OnChallenge = async context =>
                {
                    context.HandleResponse();
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";

                    var response = ApiResponse<object>.Fail(
                        statusCode: StatusCodes.Status401Unauthorized,
                        message: "Authentication failed. A valid access token is required to access this resource.",
                        errorCode: "UNAUTHORIZED");

                    await context.Response.WriteAsJsonAsync(response);
                },
                OnForbidden = async context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/json";

                    var response = ApiResponse<object>.Fail(
                        statusCode: StatusCodes.Status403Forbidden,
                        message: "You do not have the required permissions or subscription plan to access this resource.",
                        errorCode: "FORBIDDEN");

                    await context.Response.WriteAsJsonAsync(response);
                }
            };
        });

        services.AddAuthorizationBuilder()
            .AddPolicy("RequireStudent", policy =>
                policy.RequireRole("student", "teacher", "admin"))
            .AddPolicy("RequireTeacher", policy =>
                policy.RequireRole("teacher", "admin"))
            .AddPolicy("RequireAdmin", policy =>
                policy.RequireRole("admin"))
            .AddPolicy("RequireProPlan", policy =>
                policy.RequireClaim("plan", "pro", "premium", "vip", "class", "speaking_intensive_60d"));

        return services;
    }
}
