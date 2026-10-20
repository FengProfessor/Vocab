using LingoPro.Application.Features.Auth.Queries;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Command to authenticate a user with email and password and issue a 15m Access Token + 30d Refresh Token.
/// </summary>
public record LoginCommand(string Email, string Password) : IRequest<ApiResponse<AuthTokensDto>>;
