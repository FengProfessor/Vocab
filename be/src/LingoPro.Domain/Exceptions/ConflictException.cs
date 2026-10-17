namespace LingoPro.Domain.Exceptions;

/// <summary>
/// Exception thrown when an operation conflicts with existing domain state or capacity limits.
/// </summary>
public class ConflictException : DomainException
{
    public ConflictException(string message, string errorCode = "CONFLICT")
        : base(message, errorCode)
    {
    }
}
