using LingoPro.Domain.Common;
using LingoPro.Domain.Exceptions;

namespace LingoPro.Domain.ValueObjects;

/// <summary>
/// Value object representing FSRS memory difficulty clamped between 1.0 and 10.0.
/// </summary>
public sealed class Difficulty : ValueObject
{
    public double Value { get; }

    public Difficulty(double value)
    {
        if (value is < 1.0 or > 10.0)
        {
            throw new DomainValidationException("FSRS difficulty must be between 1.0 and 10.0.");
        }

        Value = Math.Round(value, 4);
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
    }
}
