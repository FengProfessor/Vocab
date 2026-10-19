namespace LingoPro.Application.Common.Models;

/// <summary>
/// Standardized API response envelope returned by all LingoPro .NET 10 endpoints.
/// Every response includes an explicit integer HTTP StatusCode and an English message.
/// </summary>
public record ApiResponse<T>
{
    public int StatusCode { get; init; }
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
    public T? Data { get; init; }
    public IDictionary<string, string[]>? Errors { get; init; }
    public string? ErrorCode { get; init; }
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;

    public static ApiResponse<T> Ok(
        T data,
        string message = "Request processed successfully.",
        int statusCode = 200) =>
        new()
        {
            StatusCode = statusCode,
            Success = true,
            Message = message,
            Data = data,
            Errors = null,
            ErrorCode = null,
            Timestamp = DateTime.UtcNow
        };

    public static ApiResponse<T> Created(
        T data,
        string message = "Resource created successfully.") =>
        Ok(data, message, statusCode: 201);

    public static ApiResponse<T> Fail(
        int statusCode,
        string message,
        string errorCode = "BAD_REQUEST",
        IDictionary<string, string[]>? errors = null) =>
        new()
        {
            StatusCode = statusCode,
            Success = false,
            Message = message,
            Data = default,
            Errors = errors,
            ErrorCode = errorCode,
            Timestamp = DateTime.UtcNow
        };
}
