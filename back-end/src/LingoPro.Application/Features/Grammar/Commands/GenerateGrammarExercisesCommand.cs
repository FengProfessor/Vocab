using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Application.Features.Grammar.Queries;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Grammar.Commands;

/// <summary>
/// Teacher command to generate and optionally persist AI grammar exercises for a classroom.
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public record GenerateGrammarExercisesCommand(
    Guid ClassroomId,
    string Topic,
    string Level = "beginner",
    int Count = 5,
    string? CustomPrompt = null,
    bool SaveToDb = true,
    Guid? LessonId = null) : IRequest<ApiResponse<IReadOnlyList<GrammarExerciseDto>>>;
