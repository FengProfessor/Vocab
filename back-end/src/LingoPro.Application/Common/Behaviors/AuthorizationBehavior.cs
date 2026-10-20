using System.Reflection;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Common.Behaviors;

/// <summary>
/// MediatR pipeline behavior that enforces declarative <see cref="AuthorizeAttribute"/> rules on Commands and Queries
/// before validation or handler execution.
/// </summary>
public sealed class AuthorizationBehavior<TRequest, TResponse>(
    ICurrentUserService currentUser) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private static readonly AuthorizeAttribute[] AuthorizeAttributes =
        typeof(TRequest).GetCustomAttributes<AuthorizeAttribute>(inherit: true).ToArray();

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (AuthorizeAttributes.Length == 0)
        {
            return await next();
        }

        if (!currentUser.IsAuthenticated && currentUser.UserId is null)
        {
            throw new UnauthorizedAccessException("User is not authenticated.");
        }

        foreach (var attribute in AuthorizeAttributes)
        {
            var requiredRoles = ResolveRequiredRoles(attribute);
            if (requiredRoles.Count > 0 && !HasRequiredRole(requiredRoles))
            {
                if (requiredRoles.Count == 1 && requiredRoles.Contains(UserRole.Admin))
                {
                    throw new ForbiddenAccessException("Administrator access is required.");
                }

                throw new ForbiddenAccessException("You do not have the required role permissions to perform this action.");
            }

            if (attribute.RequirePro && !currentUser.IsPro)
            {
                throw new ForbiddenAccessException(
                    "A Pro or Premium subscription is required to access this feature.",
                    "PRO_REQUIRED");
            }
        }

        return await next();
    }

    private static HashSet<UserRole> ResolveRequiredRoles(AuthorizeAttribute attribute)
    {
        var set = new HashSet<UserRole>(attribute.AllowedRoles);
        if (!string.IsNullOrWhiteSpace(attribute.Roles))
        {
            var split = attribute.Roles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var roleName in split)
            {
                if (Enum.TryParse<UserRole>(roleName, ignoreCase: true, out var parsed))
                {
                    set.Add(parsed);
                }
            }
        }

        return set;
    }

    private bool HasRequiredRole(HashSet<UserRole> requiredRoles)
    {
        if (requiredRoles.Contains(currentUser.Role))
        {
            return true;
        }

        if (requiredRoles.Contains(UserRole.Admin) && currentUser.IsAdmin)
        {
            return true;
        }

        if (requiredRoles.Contains(UserRole.Teacher) && (currentUser.IsTeacher || currentUser.IsAdmin))
        {
            return true;
        }

        return false;
    }
}
