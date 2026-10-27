using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Grammar.Commands;

/// <summary>
/// Deletes a grammar exercise after verifying that the caller is its creator, the owning classroom's teacher, or an admin.
/// </summary>
public class DeleteGrammarExerciseCommandHandler(
    ICurrentUserService currentUser,
    IGrammarRepository grammarRepository) : IRequestHandler<DeleteGrammarExerciseCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteGrammarExerciseCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var exercise = await grammarRepository.GetGrammarExerciseWithClassroomByIdAsync(request.ExerciseId, ct)
            ?? throw new NotFoundException("GrammarExercise", request.ExerciseId);

        bool isCreator = exercise.CreatedBy == userId;
        bool isClassroomTeacher = exercise.Classroom != null && exercise.Classroom.TeacherId == userId;

        if (!isCreator && !isClassroomTeacher && !currentUser.IsAdmin)
        {
            throw new ForbiddenAccessException("You are not authorized to delete this grammar exercise.");
        }

        grammarRepository.RemoveGrammarExercise(exercise);
        await grammarRepository.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, "Grammar exercise deleted successfully.");
    }
}
