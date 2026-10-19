using FluentValidation;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace LingoPro.WebApi.Middlewares;

/// <summary>
/// Global exception handling middleware that maps domain, validation, and security exceptions
/// to standardized English <see cref="ApiResponse{T}"/> envelopes with explicit HTTP <c>StatusCode</c>.
/// </summary>
public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, response) = exception switch
        {
            ValidationException validationEx => (
                StatusCodes.Status400BadRequest,
                ApiResponse<object>.Fail(
                    statusCode: StatusCodes.Status400BadRequest,
                    message: "One or more validation errors occurred. Please check your input.",
                    errorCode: "VALIDATION_ERROR",
                    errors: validationEx.Errors
                        .GroupBy(e => e.PropertyName)
                        .ToDictionary(
                            g => g.Key,
                            g => g.Select(e => e.ErrorMessage).ToArray()))
            ),

            NotFoundException notFoundEx => (
                StatusCodes.Status404NotFound,
                ApiResponse<object>.Fail(
                    statusCode: StatusCodes.Status404NotFound,
                    message: notFoundEx.Message,
                    errorCode: "RESOURCE_NOT_FOUND")
            ),

            ForbiddenAccessException forbiddenEx => (
                StatusCodes.Status403Forbidden,
                ApiResponse<object>.Fail(
                    statusCode: StatusCodes.Status403Forbidden,
                    message: forbiddenEx.Message,
                    errorCode: "FORBIDDEN_ACCESS")
            ),

            ConflictException conflictEx => (
                StatusCodes.Status409Conflict,
                ApiResponse<object>.Fail(
                    statusCode: StatusCodes.Status409Conflict,
                    message: conflictEx.Message,
                    errorCode: "RESOURCE_CONFLICT")
            ),

            DomainException domainEx => (
                StatusCodes.Status422UnprocessableEntity,
                ApiResponse<object>.Fail(
                    statusCode: StatusCodes.Status422UnprocessableEntity,
                    message: domainEx.Message,
                    errorCode: domainEx.ErrorCode)
            ),

            UnauthorizedAccessException => (
                StatusCodes.Status401Unauthorized,
                ApiResponse<object>.Fail(
                    statusCode: StatusCodes.Status401Unauthorized,
                    message: "You are not authorized to perform this action. Please sign in and try again.",
                    errorCode: "UNAUTHORIZED")
            ),

            _ => (
                StatusCodes.Status500InternalServerError,
                ApiResponse<object>.Fail(
                    statusCode: StatusCodes.Status500InternalServerError,
                    message: "An unexpected server error occurred. Please try again later.",
                    errorCode: "INTERNAL_SERVER_ERROR")
            )
        };

        if (statusCode == StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(
                exception,
                "Unhandled exception occurred while processing {Method} {Path}",
                context.Request.Method,
                context.Request.Path);
        }

        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(response);
    }
}
