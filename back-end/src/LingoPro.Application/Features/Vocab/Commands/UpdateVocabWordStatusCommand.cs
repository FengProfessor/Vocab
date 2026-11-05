using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Command allowing a classroom teacher (or administrator) to approve or reject a student-submitted classroom word.
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public record UpdateVocabWordStatusCommand(Guid WordId, string Status) : IRequest<ApiResponse<bool>>;
