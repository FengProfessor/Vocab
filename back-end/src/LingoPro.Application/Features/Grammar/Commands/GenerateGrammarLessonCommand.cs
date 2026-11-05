using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Grammar.Commands;

/// <summary>
/// Teacher command to generate bilingual grammar theory, formulas, and examples for a grammar topic.
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public record GenerateGrammarLessonCommand(
    string TopicTitle,
    string? TopicTitleVi = null,
    string Level = "beginner") : IRequest<ApiResponse<GeneratedGrammarLessonDto>>;
