using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Command to rotate a 30-day Refresh Token and mint a new 15-minute Access Token.
/// </summary>
public record RefreshTokenCommand(string RefreshToken) : IRequest<ApiResponse<AuthTokensDto>>;
