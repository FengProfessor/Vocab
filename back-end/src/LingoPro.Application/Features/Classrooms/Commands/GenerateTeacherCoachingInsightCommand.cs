using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Command to generate a targeted TESOL pedagogical coaching suggestion for a classroom student.
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public record GenerateTeacherCoachingInsightCommand(
    string StudentName,
    int Vms,
    int Lcs,
    string Tag,
    string Msg) : IRequest<ApiResponse<string>>;
