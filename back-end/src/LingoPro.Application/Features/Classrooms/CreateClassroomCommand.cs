using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Classrooms;

/// <summary>
/// Command to create a new classroom (restricted to Teacher and Admin roles via RequireTeacher policy).
/// </summary>
public record CreateClassroomCommand(string Name, string? Description) : IRequest<ApiResponse<ClassroomDto>>;
