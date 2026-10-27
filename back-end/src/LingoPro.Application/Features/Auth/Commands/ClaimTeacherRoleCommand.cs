using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Application.Features.Auth.Queries;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Command to elevate an authenticated Student profile to the Teacher role (replaces rpc('claim_teacher_role')).
/// </summary>
[Authorize]
public record ClaimTeacherRoleCommand : IRequest<ApiResponse<ProfileDto>>;
