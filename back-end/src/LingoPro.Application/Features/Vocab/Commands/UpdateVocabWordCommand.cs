using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Vocab.Queries;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Command to update an existing vocabulary word's term, translation, part of speech, IPA, example, or image URL.
/// </summary>
public record UpdateVocabWordCommand(
    Guid WordId,
    string? Word = null,
    string? Translation = null,
    string? Pos = null,
    string? Ipa = null,
    string? Example = null,
    string? ExampleVi = null,
    string? ImageUrl = null) : IRequest<ApiResponse<VocabWordItemDto>>;
