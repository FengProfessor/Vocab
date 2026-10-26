using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Command to update an existing classroom's name and description.
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public record UpdateClassroomCommand(
    Guid ClassroomId,
    string Name,
    string? Description) : IRequest<ApiResponse<ClassroomDto>>;
