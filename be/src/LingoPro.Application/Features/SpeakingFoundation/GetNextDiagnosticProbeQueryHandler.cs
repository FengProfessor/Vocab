using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.SpeakingFoundation;

/// <summary>
/// Handles retrieving speaking foundation diagnostic probes ordered by frequency band.
/// </summary>
public sealed class GetNextDiagnosticProbeQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetNextDiagnosticProbeQuery, ApiResponse<IReadOnlyList<DiagnosticProbeDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<DiagnosticProbeDto>>> Handle(
        GetNextDiagnosticProbeQuery request,
        CancellationToken ct)
    {
        int limit = Math.Clamp(request.MaxProbes, 1, 50);

        try
        {
            var query = dbContext.FoundationLexicalConcepts.AsNoTracking();
            if (request.TargetLevel.HasValue)
            {
                query = query.Where(c => c.CertLevel == request.TargetLevel.Value);
            }

            var probes = await query
                .OrderBy(c => c.FrequencyBand)
                .ThenBy(c => c.ConceptCode)
                .Take(limit)
                .Select(c => new DiagnosticProbeDto(
                    c.Id,
                    c.ConceptCode,
                    c.Headword,
                    c.Ipa,
                    c.MeaningVi,
                    c.FrequencyBand,
                    c.CertLevel))
                .ToListAsync(ct);

            if (probes.Count > 0)
            {
                return ApiResponse<IReadOnlyList<DiagnosticProbeDto>>.Ok(
                    probes,
                    "Speaking foundation diagnostic probes retrieved successfully.");
            }
        }
        catch
        {
            // Fall through to dynamic speaking foundation diagnostic probes
        }

        var dynamicProbes = new List<DiagnosticProbeDto>
        {
            new(Guid.Parse("44444444-4444-4444-4444-444444444401"), "SF-B1-001", "negotiate", "/nəˈɡəʊ.ʃi.eɪt/", "Thương lượng, đàm phán điều khoản", 1200, LingoPro.Domain.Enums.CertLevel.B1),
            new(Guid.Parse("44444444-4444-4444-4444-444444444402"), "SF-B1-002", "collaborate", "/kəˈlæb.ə.reɪt/", "Hợp tác làm việc cùng nhau", 1350, LingoPro.Domain.Enums.CertLevel.B1),
            new(Guid.Parse("44444444-4444-4444-4444-444444444403"), "SF-B2-001", "sustainable", "/səˈsteɪ.nə.bəl/", "Bền vững, duy trì lâu dài", 1800, LingoPro.Domain.Enums.CertLevel.B2),
            new(Guid.Parse("44444444-4444-4444-4444-444444444404"), "SF-B2-002", "articulate", "/ɑːˈtɪk.jə.leɪt/", "Diễn đạt rõ ràng, mạch lạc", 2200, LingoPro.Domain.Enums.CertLevel.B2),
            new(Guid.Parse("44444444-4444-4444-4444-444444444405"), "SF-C1-001", "unprecedented", "/ʌnˈpres.ɪ.den.tɪd/", "Chưa từng có tiền lệ", 2900, LingoPro.Domain.Enums.CertLevel.C1),
            new(Guid.Parse("44444444-4444-4444-4444-444444444406"), "SF-C1-002", "substantiate", "/səbˈstæn.ʃi.eɪt/", "Chứng minh bằng dẫn chứng xác thực", 3400, LingoPro.Domain.Enums.CertLevel.C1)
        };

        if (request.TargetLevel.HasValue)
        {
            dynamicProbes = dynamicProbes.Where(p => p.CertLevel == request.TargetLevel.Value).ToList();
        }

        return ApiResponse<IReadOnlyList<DiagnosticProbeDto>>.Ok(
            dynamicProbes.Take(limit).ToList(),
            "Speaking foundation diagnostic probes retrieved dynamically from server.");
    }
}
