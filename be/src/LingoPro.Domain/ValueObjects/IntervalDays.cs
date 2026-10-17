using LingoPro.Domain.Common;
using LingoPro.Domain.Exceptions;

namespace LingoPro.Domain.ValueObjects;

/// <summary>
/// Value object representing a positive FSRS scheduling interval in days.
/// </summary>
public sealed class IntervalDays : ValueObject
{
    public int Value { get; }

    public IntervalDays(int value)
    {
        if (value < 0)
        {
            throw new DomainValidationException("Interval days cannot be negative.");
        }

        Value = value;
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
    }
}
