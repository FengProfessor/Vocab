using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using MediatR;

namespace LingoPro.Application.Features.AiCoaching.Commands;

/// <summary>
/// Command to decompose an English sentence into clauses, syntactic kernel, and progressive building levels.
/// </summary>
[Authorize(RequirePro = true)]
public record AnalyzeSentenceCommand(
    string Sentence,
    string? Context = null) : IRequest<ApiResponse<AiSentenceAnalysisDto>>;
