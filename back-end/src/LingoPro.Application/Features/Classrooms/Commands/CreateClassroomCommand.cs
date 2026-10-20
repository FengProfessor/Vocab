using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Command to create a new classroom (restricted to Teacher and Admin roles).
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public record CreateClassroomCommand(string Name, string? Description) : IRequest<ApiResponse<ClassroomDto>>;
