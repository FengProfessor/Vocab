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
            PageTitle: "LingoPro — Nền Tảng Học Từ Vựng FSRS-5, Luyện Thi TOEIC, IELTS & VSTEP Cá Nhân Hóa",
            MetaDescription: "Chinh phục TOEIC 800+, IELTS 7.0+ và VSTEP B2/C1 với thuật toán lặp lại ngắt quãng FSRS-5, AI chấm phát âm chuẩn IPA và lộ trình 60 ngày cá nhân hóa.",
            CanonicalUrl: "https://lingopro.online/",
            TotalActiveLearners: 12500,
            TotalVocabularyPacks: Math.Max(24, wordsCount / 30),
            TotalGrammarTopics: Math.Max(62, grammarCount),
            TotalReadingArticles: Math.Max(120, readingCount),
            FeaturedExamTracks:
            [
                "TOEIC Listening & Reading 600–850+",
                "IELTS Academic Band 6.5–7.5+",
                "VSTEP B1–B2–C1 Chuẩn Bộ GD&ĐT",
                "Speaking Foundation & IPA Mastery (A0 -> B1)"
            ]);

        return ApiResponse<LandingPageSeoDto>.Ok(dto, "Landing page SEO metadata retrieved successfully.");
    }
}
