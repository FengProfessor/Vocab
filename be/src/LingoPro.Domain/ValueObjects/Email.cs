using LingoPro.Domain.Common;
using LingoPro.Domain.Exceptions;

namespace LingoPro.Domain.ValueObjects;

/// <summary>
/// Value object representing a normalized and validated email address.
/// </summary>
public sealed class Email : ValueObject
{
    public string Value { get; }

    private Email(string value)
    {
        Value = value;
    }

    public static Email Create(string rawEmail)
    {
        if (string.IsNullOrWhiteSpace(rawEmail) || !rawEmail.Contains('@'))
        {
            throw new DomainValidationException("A valid email address is required.");
        }

        return new Email(rawEmail.Trim().ToLowerInvariant());
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString() => Value;
}
