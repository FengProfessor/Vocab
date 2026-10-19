using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Dictionary;

/// <summary>
/// Command to extract English vocabulary terms from an uploaded image via Vision OCR.
/// </summary>
public record ExtractOcrWordsCommand(string Base64Image, string MimeType)
    : IRequest<ApiResponse<IReadOnlyList<string>>>;
