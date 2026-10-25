using System.Security.Claims;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Infrastructure.Options;
using LingoPro.WebApi.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace LingoPro.WebApi.Extensions;

/// <summary>
/// Configures JWT Bearer authentication for access tokens issued by Supabase Auth
/// (supporting both Authorization header and SSR HttpOnly cookies) and role/subscription authorization policies.
/// </summary>
public static class AuthenticationExtensions
{
    public const string AccessTokenCookieName = "lp_access_token";
    public const string RefreshTokenCookieName = "lp_refresh_token";

    /// <summary>Audience Supabase stamps on every user access token.</summary>
    private const string SupabaseAudience = "authenticated";

    /// <summary>Claims written by the Supabase custom access token hook (see supabase/migrations).</summary>
    private const string AppRoleClaim = "app_role";
    private const string PlanClaim = "plan";

    public static IServiceCollection AddSupabaseAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var supabaseOptions = configuration.GetSection(SupabaseOptions.SectionName).Get<SupabaseOptions>()
            ?? new SupabaseOptions();
        var supabaseUrl = supabaseOptions.NormalizedUrl;
        var keyProvider = new SupabaseSigningKeyProvider(supabaseUrl, supabaseOptions.JwtSecret);

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
                IssuerSigningKeyResolver = (_, _, kid, _) => keyProvider.GetKeys(kid),
                ValidateIssuer = true,
                ValidIssuer = $"{supabaseUrl}/auth/v1",
                ValidateAudience = true,
                ValidAudience = SupabaseAudience,
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
                OnTokenValidated = ApplyProfileClaimsAsync,

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

    /// <summary>
    /// Maps the application role and plan onto the principal. The Supabase 'role' claim is always
    /// 'authenticated' (it selects the database role), so it is replaced rather than used for authorization.
    /// Source of truth: claims written into the token by the Supabase custom access token hook
    /// (app_role, plan); when the hook is not enabled yet, the public.profiles row is used instead;
    /// with neither, least privilege applies (student/free). user_metadata is never trusted: users can edit it.
    /// </summary>
    private static async Task ApplyProfileClaimsAsync(TokenValidatedContext context)
    {
        if (context.Principal?.Identity is not ClaimsIdentity identity)
        {
            return;
        }

        var role = identity.FindFirst(AppRoleClaim)?.Value;
        var plan = identity.FindFirst(PlanClaim)?.Value;

        foreach (var claim in identity.FindAll(c => c.Type is ClaimTypes.Role or "role" or PlanClaim).ToList())
        {
            identity.RemoveClaim(claim);
        }

        if (string.IsNullOrWhiteSpace(role) || string.IsNullOrWhiteSpace(plan))
        {
            var profile = await TryLoadProfileAsync(context, identity);
            role = string.IsNullOrWhiteSpace(role) ? profile?.Role : role;
            plan = string.IsNullOrWhiteSpace(plan) ? profile?.Plan : plan;
        }

        identity.AddClaim(new Claim(ClaimTypes.Role, (role ?? "student").ToLowerInvariant()));
        identity.AddClaim(new Claim(PlanClaim, (plan ?? "free").ToLowerInvariant()));
    }

    private static async Task<(string Role, string Plan)?> TryLoadProfileAsync(
        TokenValidatedContext context,
        ClaimsIdentity identity)
    {
        if (!Guid.TryParse(identity.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
        {
            return null;
        }

        try
        {
            var dbContext = context.HttpContext.RequestServices.GetRequiredService<IApplicationDbContext>();
            var profile = await dbContext.Profiles
                .AsNoTracking()
                .Where(p => p.Id == userId && p.IsDeleted != true)
                .Select(p => new { p.Role, p.Plan })
                .FirstOrDefaultAsync(context.HttpContext.RequestAborted);

            return profile is null
                ? null
                : (profile.Role.ToString().ToLowerInvariant(), profile.Plan.ToString().ToLowerInvariant());
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Profile store unavailable: the token is still authentic, so the user stays authenticated
            // with least-privilege defaults.
            return null;
        }
    }
}
