using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Classrooms.Commands;
using LingoPro.Application.Features.Classrooms.Queries;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for classroom management, student enrollment, teacher portal analytics, and teacher-only drill assignments.
/// </summary>
[Route("api/v1/classrooms")]
[Authorize]
[EnableRateLimiting(RateLimitingExtensions.AuthenticatedUserPolicy)]
public sealed class ClassroomsController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ClassroomDto>>>> GetClassrooms(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetClassroomsQuery(), ct);
        return OkResponse(result, "Classrooms retrieved successfully.");
    }

    [HttpPost]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<ClassroomDto>>> CreateClassroom(
        [FromBody] CreateClassroomCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return CreatedResponse(result, "Classroom created successfully.");
    }

    [HttpPut("{classroomId:guid}")]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<ClassroomDto>>> UpdateClassroom(
        [FromRoute] Guid classroomId,
        [FromBody] CreateClassroomCommand request,
        CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateClassroomCommand(classroomId, request.Name, request.Description), ct);
        return OkResponse(result, "Classroom updated successfully.");
    }

    [HttpDelete("{classroomId:guid}")]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteClassroom(
        [FromRoute] Guid classroomId,
        CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteClassroomCommand(classroomId), ct);
        return OkResponse(result, "Classroom deleted successfully.");
    }

    [HttpPost("join")]
    public async Task<ActionResult<ApiResponse<ClassroomDto>>> JoinClassroom(
        [FromBody] JoinClassroomCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Joined classroom successfully.");
    }

    [HttpPost("assign-drill")]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<int>>> AssignDrill(
        [FromBody] AssignDrillCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result);
    }

    [HttpGet("teacher-stats")]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<TeacherStatsDto>>> GetTeacherStats(
        [FromQuery] Guid? classroomId = null,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetTeacherStatsQuery(classroomId), ct);
        return OkResponse(result);
    }

    [HttpGet("{classroomId:guid}/analytics")]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<TeacherAnalyticsDto>>> GetTeacherAnalytics(
        [FromRoute] Guid classroomId,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetTeacherAnalyticsQuery(classroomId), ct);
        return OkResponse(result);
    }

    [HttpGet("student-detail")]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<TeacherStudentDetailDto>>> GetStudentDetail(
        [FromQuery] Guid studentId,
        [FromQuery] Guid? classroomId = null,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetTeacherStudentDetailQuery(studentId, classroomId), ct);
        return OkResponse(result);
    }

    [HttpGet("student-errors")]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<TeacherStudentErrorWordDto>>>> GetStudentErrors(
        [FromQuery] Guid studentId,
        [FromQuery] Guid? classroomId = null,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetTeacherStudentErrorsQuery(studentId, classroomId), ct);
        return OkResponse(result);
    }

    [HttpPost("{classroomId:guid}/students")]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<TeacherAddedStudentDto>>> AddStudent(
        [FromRoute] Guid classroomId,
        [FromBody] AddClassroomStudentCommand command,
        CancellationToken ct = default)
    {
        var effectiveCommand = command with { ClassroomId = classroomId };
        var result = await Mediator.Send(effectiveCommand, ct);
        return CreatedResponse(result);
    }

    [HttpDelete("{classroomId:guid}/students/{studentId:guid}")]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<bool>>> RemoveStudent(
        [FromRoute] Guid classroomId,
        [FromRoute] Guid studentId,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new RemoveClassroomStudentCommand(classroomId, studentId), ct);
        return OkResponse(result);
    }

    [HttpPost("coaching-insight")]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<string>>> GenerateCoachingInsight(
        [FromBody] GenerateTeacherCoachingInsightCommand command,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result);
    }

    [HttpGet("{classroomId:guid}/leaderboard")]
    public async Task<ActionResult<ApiResponse<ClassroomLeaderboardDto>>> GetLeaderboard(
        [FromRoute] Guid classroomId,
        [FromQuery] string period = "all",
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetClassroomLeaderboardQuery(classroomId, period), ct);
        return OkResponse(result);
    }
}
