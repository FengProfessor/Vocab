namespace LingoPro.Application.Features.Seo;

/// <summary>
/// View model and SEO metadata payload for the server-side rendered home/landing page.
/// </summary>
public sealed record LandingPageSeoDto(
    string PageTitle,
    string MetaDescription,
    string CanonicalUrl,
    int TotalActiveLearners,
    int TotalVocabularyPacks,
    int TotalGrammarTopics,
    int TotalReadingArticles,
    IReadOnlyList<string> FeaturedExamTracks);
