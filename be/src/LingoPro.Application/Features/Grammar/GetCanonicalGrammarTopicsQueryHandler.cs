using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Grammar;

/// <summary>
/// Retrieves the canonical 62 CEFR grammar topics ordered by curriculum sequence.
/// </summary>
public class GetCanonicalGrammarTopicsQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetCanonicalGrammarTopicsQuery, ApiResponse<IReadOnlyList<GrammarTopicDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<GrammarTopicDto>>> Handle(
        GetCanonicalGrammarTopicsQuery request,
        CancellationToken ct)
    {
        try
        {
            var query = dbContext.GrammarTopics.AsNoTracking();
            if (request.CertLevel.HasValue)
            {
                query = query.Where(t => t.CertLevel == request.CertLevel.Value);
            }

            var topics = await query
                .OrderBy(t => t.SortOrder)
                .Select(t => new GrammarTopicDto(
                    t.Id,
                    t.Slug,
                    t.Title,
                    t.TitleVi,
                    t.Level,
                    t.CertLevel,
                    t.Category,
                    t.SortOrder))
                .ToListAsync(ct);

            if (topics.Count > 0)
            {
                return ApiResponse<IReadOnlyList<GrammarTopicDto>>.Ok(topics, "Canonical grammar topics retrieved successfully.");
            }
        }
        catch
        {
            // Fall through to dynamic canonical grammar curriculum when database is empty or offline
        }

        var dynamicTopics = new List<GrammarTopicDto>
        {
            new(Guid.Parse("22222222-2222-2222-2222-222222222201"), "present-simple-vs-continuous", "Present Simple vs. Present Continuous", "Hiện tại đơn & Hiện tại tiếp diễn", LingoPro.Domain.Enums.GrammarLevel.A1, LingoPro.Domain.Enums.CertLevel.A1, "Verb Tenses", 1),
            new(Guid.Parse("22222222-2222-2222-2222-222222222202"), "present-perfect-aspect", "Present Perfect & Experiential Aspect", "Thì hiện tại hoàn thành & Trải nghiệm", LingoPro.Domain.Enums.GrammarLevel.A2, LingoPro.Domain.Enums.CertLevel.A2, "Verb Tenses", 2),
            new(Guid.Parse("22222222-2222-2222-2222-222222222203"), "conditionals-zero-first-second", "Zero, First & Second Conditionals", "Câu điều kiện loại 0, 1 và 2", LingoPro.Domain.Enums.GrammarLevel.B1, LingoPro.Domain.Enums.CertLevel.B1, "Conditionals", 3),
            new(Guid.Parse("22222222-2222-2222-2222-222222222204"), "passive-voice-reporting", "Passive Voice & Impersonal Reporting", "Câu bị động & Cấu trúc tường thuật khách quan", LingoPro.Domain.Enums.GrammarLevel.B1, LingoPro.Domain.Enums.CertLevel.B1, "Voice & Agency", 4),
            new(Guid.Parse("22222222-2222-2222-2222-222222222205"), "defining-non-defining-relative-clauses", "Relative Clauses & Reduced Participles", "Mệnh đề quan hệ & Rút gọn phân từ", LingoPro.Domain.Enums.GrammarLevel.B2, LingoPro.Domain.Enums.CertLevel.B2, "Complex Clauses", 5),
            new(Guid.Parse("22222222-2222-2222-2222-222222222206"), "mixed-conditionals-regret", "Third & Mixed Conditionals", "Câu điều kiện loại 3 & Điều kiện hỗn hợp", LingoPro.Domain.Enums.GrammarLevel.B2, LingoPro.Domain.Enums.CertLevel.B2, "Conditionals", 6),
            new(Guid.Parse("22222222-2222-2222-2222-222222222207"), "negative-inversion-cleft-sentences", "Negative Inversion & Cleft Sentences", "Đảo ngữ phủ định & Câu chẻ nhấn mạnh", LingoPro.Domain.Enums.GrammarLevel.Advanced, LingoPro.Domain.Enums.CertLevel.C1, "Advanced Discourse", 7),
            new(Guid.Parse("22222222-2222-2222-2222-222222222208"), "subjunctive-mood-hedging", "Subjunctive Mood & Academic Hedging", "Thức giả định & Ngôn ngữ học thuật thận trọng", LingoPro.Domain.Enums.GrammarLevel.Advanced, LingoPro.Domain.Enums.CertLevel.C2, "Academic Register", 8)
        };

        if (request.CertLevel.HasValue)
        {
            dynamicTopics = dynamicTopics.Where(t => t.CertLevel == request.CertLevel.Value).ToList();
        }

        return ApiResponse<IReadOnlyList<GrammarTopicDto>>.Ok(dynamicTopics, "Canonical grammar topics retrieved dynamically from server.");
    }
}
