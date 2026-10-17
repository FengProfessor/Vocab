using System.Security.Claims;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace LingoPro.Infrastructure.Services;

/// <summary>
/// Resolves the current authenticated user's identity, role, and subscription plan from the HTTP context claims.
/// </summary>
public sealed class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var sub = User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? User?.FindFirstValue("sub");
            return Guid.TryParse(sub, out var guid) ? guid : null;
        }
    }

    public string? Email => User?.FindFirstValue(ClaimTypes.Email) ?? User?.FindFirstValue("email");

    public UserRole Role
    {
        get
        {
            var rawRole = User?.FindFirstValue(ClaimTypes.Role) ?? User?.FindFirstValue("role");
            return Enum.TryParse<UserRole>(rawRole, ignoreCase: true, out var parsed)
                ? parsed
                : UserRole.Student;
        }
    }

    public SubscriptionPlanType Plan
    {
        get
        {
            var rawPlan = User?.FindFirstValue("plan");
            return Enum.TryParse<SubscriptionPlanType>(rawPlan, ignoreCase: true, out var parsed)
                ? parsed
                : SubscriptionPlanType.Free;
        }
    }

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public bool IsAdmin => Role == UserRole.Admin;

    public bool IsTeacher => Role is UserRole.Teacher or UserRole.Admin;

    public bool IsPro => Plan != SubscriptionPlanType.Free;
}
