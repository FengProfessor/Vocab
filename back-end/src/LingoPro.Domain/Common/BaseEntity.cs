namespace LingoPro.Domain.Common;

/// <summary>
/// Base class for all domain entities identified by a unique GUID primary key.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
}
