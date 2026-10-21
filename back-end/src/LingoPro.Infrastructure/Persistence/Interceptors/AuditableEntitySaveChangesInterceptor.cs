using LingoPro.Application.Common.Interfaces;
using LingoPro.Domain.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace LingoPro.Infrastructure.Persistence.Interceptors;

/// <summary>
/// EF Core interceptor that populates creation/modification audit fields on <see cref="BaseAuditableEntity"/> and converts physical deletes into soft deletes on <see cref="ISoftDelete"/> entities.
/// </summary>
public class AuditableEntitySaveChangesInterceptor(ICurrentUserService currentUserService) : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void UpdateEntities(DbContext? context)
    {
        if (context == null) return;

        var now = DateTime.UtcNow;
        var userId = currentUserService.UserId;

        foreach (var entry in context.ChangeTracker.Entries<BaseAuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt ??= now;
                entry.Entity.UpdatedAt ??= now;
                entry.Entity.CreatedBy ??= userId;
                entry.Entity.UpdatedBy ??= userId;
            }
            else if (entry.State is EntityState.Modified or EntityState.Deleted)
            {
                entry.Entity.UpdatedAt = now;
                entry.Entity.UpdatedBy = userId ?? entry.Entity.UpdatedBy;
            }
        }

        foreach (var entry in context.ChangeTracker.Entries<ISoftDelete>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.IsDeleted ??= false;
            }
            else if (entry.State == EntityState.Modified && entry.Entity.IsDeleted == true)
            {
                entry.Entity.DeletedAt ??= now;
                entry.Entity.DeletedBy ??= userId;
            }
            else if (entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
                entry.Entity.DeletedAt = now;
                entry.Entity.DeletedBy = userId ?? entry.Entity.DeletedBy;
            }
        }
    }
}
