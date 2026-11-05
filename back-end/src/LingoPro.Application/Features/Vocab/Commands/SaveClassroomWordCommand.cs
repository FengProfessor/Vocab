using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Command to add or enrich a single vocabulary word in a specific classroom or the user's personal workspace.
/// </summary>
public record SaveClassroomWordCommand(
    Guid? ClassroomId,
    string Word,
    string? Translation = null,
    string? Ipa = null,
    string? Pos = null,
    string? Example = null,
    string? ExampleVi = null,
    string? ImageUrl = null,
    string? SourceUrl = null,
    IReadOnlyList<string>? Synonyms = null,
    IReadOnlyList<string>? Antonyms = null) : IRequest<ApiResponse<SaveClassroomWordResultDto>>;
