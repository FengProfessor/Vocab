using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Dictionary;

/// <summary>
/// Handles extraction of vocabulary words from a base64 image using the AI Vision OCR router.
/// </summary>
public class ExtractOcrWordsCommandHandler(
    ICurrentUserService currentUser,
    IAiRouterService aiRouter) : IRequestHandler<ExtractOcrWordsCommand, ApiResponse<IReadOnlyList<string>>>
{
    public async Task<ApiResponse<IReadOnlyList<string>>> Handle(ExtractOcrWordsCommand request, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated)
        {
            throw new UnauthorizedAccessException("User must be authenticated to use Vision OCR.");
        }

        var extractedWords = await aiRouter.ExtractWordsFromOcrImageAsync(request.Base64Image, request.MimeType, ct);
        return ApiResponse<IReadOnlyList<string>>.Ok(extractedWords, "Vocabulary terms extracted from image via OCR successfully.");
    }
}
