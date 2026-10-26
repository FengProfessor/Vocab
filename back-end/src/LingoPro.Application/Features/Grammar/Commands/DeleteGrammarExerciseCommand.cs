using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Grammar.Commands;

/// <summary>
/// Command to delete a classroom grammar exercise owned by the requesting teacher (or an administrator).
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public record DeleteGrammarExerciseCommand(Guid ExerciseId) : IRequest<ApiResponse<bool>>;
