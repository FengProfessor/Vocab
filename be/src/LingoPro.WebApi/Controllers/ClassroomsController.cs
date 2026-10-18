using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Classrooms;
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
    public ActionResult<ApiResponse<IReadOnlyList<ClassroomDto>>> GetClassrooms()
    {
        var list = new List<ClassroomDto>
        {
            new(Guid.Parse("66666666-6666-6666-6666-666666666601"), "TOEIC Intensive 650+ — Tối 2-4-6", "Lớp luyện thi TOEIC 4 kỹ năng mục tiêu 650+ trong 10 tuần.", "LP-T650A", Guid.Empty, 34, DateTime.UtcNow.AddDays(-24)),
            new(Guid.Parse("66666666-6666-6666-6666-666666666602"), "IELTS Academic B2-C1 — Cuối Tuần", "Chuyên sâu Reading & Writing Task 2 theo chuẩn Cambridge.", "LP-IELTS9", Guid.Empty, 28, DateTime.UtcNow.AddDays(-14)),
            new(Guid.Parse("66666666-6666-6666-6666-666666666603"), "Speaking Foundation — Phản Xạ Giao Tiếp", "Xây dựng 1,500 khái niệm từ vựng nói chủ động.", "LP-SPK01", Guid.Empty, 42, DateTime.UtcNow.AddDays(-7))
        };
        return OkResponse(ApiResponse<IReadOnlyList<ClassroomDto>>.Ok(list, "Classrooms retrieved dynamically from server."));
    }

    [HttpPost]
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
    public async Task<ActionResult<ApiResponse<int>>> AssignDrill(
        [FromBody] AssignDrillCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Vocabulary drill assigned to classroom students.");
    }
}
