namespace LingoPro.Domain.Common;

/// <summary>
/// Contract for entities that support soft deletion (IsDeleted, DeletedAt, DeletedBy columns).
/// </summary>
public interface ISoftDelete
{
    bool? IsDeleted { get; set; }
    DateTime? DeletedAt { get; set; }
    Guid? DeletedBy { get; set; }
}
