using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Dictionary.Commands;

/// <summary>
/// Handles extraction of vocabulary words from a base64 image using the AI Vision OCR router.
/// </summary>
public class ExtractOcrWordsCommandHandler(
    IAiRouterService aiRouter) : IRequestHandler<ExtractOcrWordsCommand, ApiResponse<IReadOnlyList<string>>>
{
    public async Task<ApiResponse<IReadOnlyList<string>>> Handle(ExtractOcrWordsCommand request, CancellationToken ct)
    {
        var extractedWords = await aiRouter.ExtractWordsFromOcrImageAsync(request.Base64Image, request.MimeType, ct);
        return ApiResponse<IReadOnlyList<string>>.Ok(extractedWords, "Vocabulary terms extracted from image via OCR successfully.");
    }
}
