namespace LingoPro.Domain.Exceptions;

/// <summary>
/// Exception thrown when a requested domain aggregate or entity cannot be found.
/// </summary>
public class NotFoundException : DomainException
{
    public NotFoundException(string resourceName, object key)
        : base($"{resourceName} with identifier '{key}' was not found.", "NOT_FOUND")
    {
    }
}
