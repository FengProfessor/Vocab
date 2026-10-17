using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Command to register a new user account and issue a 15m Access Token + 30d Refresh Token.
/// </summary>
public record RegisterCommand(string Email, string Password, string FullName) : IRequest<ApiResponse<AuthTokensDto>>;
