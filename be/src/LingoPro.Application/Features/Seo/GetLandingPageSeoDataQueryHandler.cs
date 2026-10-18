using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Seo;

/// <summary>
/// Handles retrieving SEO metadata and public catalog counts for the server-side rendered landing page.
/// </summary>
public sealed class GetLandingPageSeoDataQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetLandingPageSeoDataQuery, ApiResponse<LandingPageSeoDto>>
{
    public async Task<ApiResponse<LandingPageSeoDto>> Handle(
        GetLandingPageSeoDataQuery request,
        CancellationToken ct)
    {
        var wordsCount = 9000;
        var grammarCount = 62;
        var readingCount = 120;

        try
        {
            wordsCount = await dbContext.Words
                .AsNoTracking()
                .CountAsync(x => x.Status == WordApprovalStatus.Approved, ct);

            grammarCount = await dbContext.GrammarTopics
                .AsNoTracking()
                .CountAsync(ct);

            readingCount = await dbContext.ReadingArticles
                .AsNoTracking()
                .CountAsync(x => x.Status == ReadingArticleStatus.Published, ct);
        }
        catch
        {
            // Fallback to default catalog counts when DB is offline or unmigrated
        }

        var dto = new LandingPageSeoDto(
            PageTitle: "LingoPro — Học từ vựng tiếng Anh, tra từ 1 chạm, nhớ lâu với FSRS",
            MetaDescription: "App học từ vựng cho người Việt: tra từ trên web, flashcard FSRS, lộ trình THPT · TOEIC · IELTS. Miễn phí bắt đầu — 5–8 phút/ngày.",
            CanonicalUrl: "https://lingopro.online",
            TotalActiveLearners: 12500,
            TotalVocabularyPacks: Math.Max(660, wordsCount / 15),
            TotalGrammarTopics: Math.Max(62, grammarCount),
            TotalReadingArticles: Math.Max(120, readingCount),
            FeaturedExamTracks:
            [
                "IELTS",
                "TOEIC",
                "THPT",
                "Giao tiếp"
            ]);

        return ApiResponse<LandingPageSeoDto>.Ok(dto, "Landing page SEO metadata retrieved successfully.");
    }
}
