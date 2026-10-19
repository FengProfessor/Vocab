using LingoPro.Domain.Common;
using LingoPro.Domain.Exceptions;

namespace LingoPro.Domain.ValueObjects;

/// <summary>
/// Value object representing FSRS memory stability (in days).
/// </summary>
public sealed class Stability : ValueObject
{
    public double Value { get; }

    public Stability(double value)
    {
        if (value < 0)
        {
            throw new DomainValidationException("FSRS stability cannot be negative.");
        }

        Value = Math.Round(value, 4);
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
    }
}
