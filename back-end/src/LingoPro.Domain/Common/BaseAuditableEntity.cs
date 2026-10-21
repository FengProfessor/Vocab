namespace LingoPro.Domain.Common;

/// <summary>
/// Base class for auditable entities: GUID primary key, creation/modification audit metadata and soft-deletion columns.
/// All audit columns are nullable so legacy rows restored from the old Supabase database remain valid.
/// </summary>
public abstract class BaseAuditableEntity : BaseEntity, ISoftDelete
{
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
    public bool? IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    /// <summary>
    /// Marks the entity as soft-deleted and records who deleted it and when.
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
