namespace LingoPro.Domain.Exceptions;

/// <summary>
/// Exception thrown when the current user lacks role or ownership permissions for an operation.
/// </summary>
public class ForbiddenAccessException : DomainException
{
    public ForbiddenAccessException(
        string message = "You do not have permission to perform this action.",
        string errorCode = "FORBIDDEN")
        : base(message, errorCode)
    {
    }
}
