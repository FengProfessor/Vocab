using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using MediatR;

namespace LingoPro.Application.Features.Dictionary.Commands;

/// <summary>
/// Command to extract English vocabulary terms from an uploaded image via Vision OCR.
/// </summary>
[Authorize]
public record ExtractOcrWordsCommand(string Base64Image, string MimeType)
    : IRequest<ApiResponse<IReadOnlyList<string>>>;
