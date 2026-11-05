using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Handles <see cref="SaveClassroomWordCommand"/> by persisting the word in the target classroom or personal workspace.
/// </summary>
public sealed class SaveClassroomWordCommandHandler(
    ICurrentUserService currentUser,
    IVocabRepository vocabRepository)
    : IRequestHandler<SaveClassroomWordCommand, ApiResponse<SaveClassroomWordResultDto>>
{
    public async Task<ApiResponse<SaveClassroomWordResultDto>> Handle(
        SaveClassroomWordCommand request,
        CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var result = await vocabRepository.SaveClassroomWordAsync(userId, request, currentUser.IsAdmin, ct);
        return ApiResponse<SaveClassroomWordResultDto>.Ok(result, "Vocabulary word saved successfully.");
    }
}
