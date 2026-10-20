using LingoPro.Domain.Enums;

namespace LingoPro.Application.Common.Security;

/// <summary>
/// Specifies that the MediatR Command or Query requires authentication and optionally restricts execution
/// to specific <see cref="UserRole"/> permissions or an active Pro/Premium subscription plan.
/// </summary>
[AttributeUsage(AttributeTargets.Class, AllowMultiple = true, Inherited = true)]
public sealed class AuthorizeAttribute : Attribute
{
    public AuthorizeAttribute()
    {
    }

    public AuthorizeAttribute(params UserRole[] roles)
    {
        AllowedRoles = roles;
    }

    /// <summary>
    /// Gets or sets the strongly-typed roles allowed to execute the request.
    /// </summary>
    public UserRole[] AllowedRoles { get; init; } = [];

    /// <summary>
    /// Gets or sets a comma-delimited list of role names allowed to execute the request.
    /// </summary>
    public string? Roles { get; init; }

    /// <summary>
    /// Gets or sets whether an active Pro or Premium subscription entitlement is required.
    /// </summary>
    public bool RequirePro { get; init; }
}
