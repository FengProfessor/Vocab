using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Seo.Queries;

/// <summary>
/// Handles retrieving SEO metadata and public catalog counts from the database for the server-side rendered landing page.
/// </summary>
public sealed class GetLandingPageSeoDataQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetLandingPageSeoDataQuery, ApiResponse<LandingPageSeoDto>>
{
    public async Task<ApiResponse<LandingPageSeoDto>> Handle(
        GetLandingPageSeoDataQuery request,
        CancellationToken ct)
    {
        var totalLearners = await dbContext.Profiles
            .AsNoTracking()
            .CountAsync(ct);

        var wordsCount = await dbContext.Words
            .AsNoTracking()
            .CountAsync(x => x.Status == WordApprovalStatus.Approved, ct);

        var grammarCount = await dbContext.GrammarTopics
            .AsNoTracking()
            .CountAsync(ct);

        var readingCount = await dbContext.ReadingArticles
            .AsNoTracking()
            .CountAsync(x => x.Status == ReadingArticleStatus.Published, ct);

        var dto = new LandingPageSeoDto(
            PageTitle: "LingoPro — Học từ vựng tiếng Anh, tra từ 1 chạm, nhớ lâu với FSRS",
            MetaDescription: "App học từ vựng cho người Việt: tra từ trên web, flashcard FSRS, lộ trình THPT · TOEIC · IELTS. Miễn phí bắt đầu — 5–8 phút/ngày.",
            CanonicalUrl: "https://lingopro.online",
            TotalActiveLearners: totalLearners,
            TotalVocabularyPacks: wordsCount / 15,
            TotalGrammarTopics: grammarCount,
            TotalReadingArticles: readingCount,
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
