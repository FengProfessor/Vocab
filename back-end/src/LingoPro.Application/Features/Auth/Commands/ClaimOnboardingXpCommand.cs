using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Command to claim the one-time 50 XP onboarding completion reward idempotently (replaces rpc('claim_onboarding_xp')).
/// </summary>
[Authorize]
public record ClaimOnboardingXpCommand : IRequest<ApiResponse<bool>>;
