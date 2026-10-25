using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Seo.Queries;

/// <summary>
/// Handles retrieving SEO metadata and public catalog counts for the server-side rendered landing page.
/// </summary>
public sealed class GetLandingPageSeoDataQueryHandler(ISeoRepository seoRepository)
    : IRequestHandler<GetLandingPageSeoDataQuery, ApiResponse<LandingPageSeoDto>>
{
    public async Task<ApiResponse<LandingPageSeoDto>> Handle(
        GetLandingPageSeoDataQuery request,
        CancellationToken ct)
    {
        var (totalLearners, wordsCount, grammarCount, readingCount) = await seoRepository.GetCatalogCountsAsync(ct);

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
