namespace LingoPro.Domain.Exceptions;

/// <summary>
/// Represents a business rule violation within the core domain layer.
/// </summary>
public class DomainException : Exception
{
    public string ErrorCode { get; }

    public DomainException(string message, string errorCode = "DOMAIN_ERROR")
        : base(message)
    {
        ErrorCode = errorCode;
    }
}
