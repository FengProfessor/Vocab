namespace LingoPro.Domain.Exceptions;

/// <summary>
/// Exception thrown when a domain value object or invariant validation rule is violated.
/// </summary>
public class DomainValidationException : DomainException
{
    public DomainValidationException(string message)
        : base(message, "DOMAIN_VALIDATION_ERROR")
    {
    }
}
