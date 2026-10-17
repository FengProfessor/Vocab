namespace LingoPro.Domain.Common;

/// <summary>
/// Base class for auditable domain entities tracking creation, modification, and soft-deletion audit metadata.
/// </summary>
public abstract class BaseAuditableEntity : BaseEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
    public bool? IsDeleted { get; set; } = false;

    /// <summary>
    /// Marks the entity as soft-deleted and updates deletion and modification audit fields.
    /// </summary>
    public void MarkAsDeleted(Guid? deletedBy = null, DateTime? deletedAtUtc = null)
    {
        var timestamp = deletedAtUtc ?? DateTime.UtcNow;
        IsDeleted = true;
        DeletedAt = timestamp;
        DeletedBy = deletedBy ?? DeletedBy;
        UpdatedAt = timestamp;
        UpdatedBy = deletedBy ?? UpdatedBy;
    }

    /// <summary>
    /// Restores a previously soft-deleted entity and clears its deletion metadata.
    /// </summary>
    public void Restore(Guid? restoredBy = null, DateTime? restoredAtUtc = null)
    {
        var timestamp = restoredAtUtc ?? DateTime.UtcNow;
        IsDeleted = false;
        DeletedAt = null;
        DeletedBy = null;
        UpdatedAt = timestamp;
        UpdatedBy = restoredBy ?? UpdatedBy;
    }
}

