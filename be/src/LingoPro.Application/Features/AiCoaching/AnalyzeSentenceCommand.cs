using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.AiCoaching;

/// <summary>
/// Command to decompose an English sentence into clauses, syntactic kernel, and progressive building levels.
/// </summary>
public record AnalyzeSentenceCommand(
    string Sentence,
    string? Context = null) : IRequest<ApiResponse<AiSentenceAnalysisDto>>;
