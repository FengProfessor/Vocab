namespace LingoPro.Application.Common.Models;

/// <summary>
/// Represents a paginated slice of items returned from a query.
/// </summary>
public class PaginatedList<T>
{
    public IReadOnlyCollection<T> Items { get; }
    public int PageIndex { get; }
    public int PageSize { get; }
    public bool HasNextPage { get; }
    public bool HasPreviousPage => PageIndex > 1;

    public PaginatedList(IReadOnlyCollection<T> items, int pageIndex, int pageSize, bool hasNextPage)
    {
        Items = items;
        PageIndex = pageIndex;
        PageSize = pageSize;
        HasNextPage = hasNextPage;
    }
}
