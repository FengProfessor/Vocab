using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Dictionary.Queries;

/// <summary>
/// Retrieves a global dictionary headword entry from the database and optionally disambiguates its sense in context via AI.
/// </summary>
public class SmartLookupQueryHandler(
    IApplicationDbContext dbContext,
    IAiRouterService aiRouter) : IRequestHandler<SmartLookupQuery, ApiResponse<DictionaryEntryDto>>
{
    public async Task<ApiResponse<DictionaryEntryDto>> Handle(SmartLookupQuery request, CancellationToken ct)
    {
        string normalized = request.Term.Trim().ToLowerInvariant();

        var entry = await dbContext.GlobalDictionaries
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Term == normalized, ct)
            ?? throw new NotFoundException("GlobalDictionary", normalized);

        int? bestSenseIndex = null;
        if (!string.IsNullOrWhiteSpace(request.Context))
        {
            bestSenseIndex = await aiRouter.SelectSmartSenseIndexAsync(
                entry.Term,
                request.Context,
                [entry.DefinitionsJson],
                ct);
        }

        return ApiResponse<DictionaryEntryDto>.Ok(
            new DictionaryEntryDto(
                entry.Id,
                entry.Term,
                entry.Ipa,
                entry.PartOfSpeech,
                entry.DefinitionsJson,
                entry.CollocationsJson,
                entry.SynonymsJson,
                entry.AntonymsJson,
                bestSenseIndex),
            "Dictionary entry retrieved successfully.");
    }
}
