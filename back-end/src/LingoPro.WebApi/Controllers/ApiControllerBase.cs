using LingoPro.Application.Common.Models;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// Base API controller providing MediatR dispatch and standardized English <see cref="ApiResponse{T}"/> helpers with HTTP status codes.
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
    private ISender? _mediator;

    protected ISender Mediator =>
        _mediator ??= HttpContext.RequestServices.GetRequiredService<ISender>();

    protected ActionResult<ApiResponse<T>> OkResponse<T>(
        ApiResponse<T> response,
        string? message = null)
    {
        var payload = string.IsNullOrWhiteSpace(message)
            ? response
            : response with { Message = message };

        return StatusCode(payload.StatusCode, payload);
    }

    protected ActionResult<ApiResponse<T>> OkResponse<T>(
        T data,
        string message = "Request completed successfully.")
    {
        return Ok(ApiResponse<T>.Ok(data, message, StatusCodes.Status200OK));
    }

    protected ActionResult<ApiResponse<T>> CreatedResponse<T>(
        ApiResponse<T> response,
        string? message = null)
    {
        var statusCode = response.StatusCode == StatusCodes.Status200OK
            ? StatusCodes.Status201Created
            : response.StatusCode;

        var payload = response with
        {
            StatusCode = statusCode,
            Message = string.IsNullOrWhiteSpace(message) ? response.Message : message
        };

        return StatusCode(statusCode, payload);
    }

    protected ActionResult<ApiResponse<T>> CreatedResponse<T>(
        T data,
        string message = "Resource created successfully.")
    {
        return StatusCode(StatusCodes.Status201Created, ApiResponse<T>.Created(data, message));
    }
}
