using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Classrooms.Commands;
using LingoPro.Application.Features.Classrooms.Queries;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for classroom management, student enrollment, and teacher-only drill assignments.
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
        return OkResponse(result, "Vocabulary drill assigned to classroom students.");
    }
}
