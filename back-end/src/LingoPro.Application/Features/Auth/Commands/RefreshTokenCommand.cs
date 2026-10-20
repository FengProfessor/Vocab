using LingoPro.Application.Features.Auth.Queries;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Command to rotate a 30-day Refresh Token and mint a new 15-minute Access Token.
/// </summary>
public record RefreshTokenCommand(string? RefreshToken = null) : IRequest<ApiResponse<AuthTokensDto>>;
