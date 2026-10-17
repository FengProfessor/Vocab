using System.Security.Claims;
using System.Threading.RateLimiting;
using LingoPro.Application.Common.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace LingoPro.WebApi.Extensions;

/// <summary>
/// Configures native .NET 10 rate limiting policies with standardized English <see cref="ApiResponse{T}"/> 429 responses.
/// </summary>
public static class RateLimitingExtensions
{
    public const string AuthenticatedUserPolicy = "AuthenticatedUserPolicy";
    public const string ExpensiveAiPolicy = "ExpensiveAiPolicy";
    public const string ExamAntiScrapePolicy = "ExamAntiScrapePolicy";

    public static IServiceCollection AddAppRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.ContentType = "application/json";

                int? retryAfterSeconds = null;
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    retryAfterSeconds = (int)retryAfter.TotalSeconds;
                    context.HttpContext.Response.Headers.RetryAfter = retryAfterSeconds.Value.ToString();
                }

                var errorResponse = ApiResponse<object>.Fail(
                    statusCode: StatusCodes.Status429TooManyRequests,
                    message: "Too many requests. You have exceeded your rate limit. Please try again later.",
                    errorCode: "RATE_LIMIT_EXCEEDED",
                    errors: retryAfterSeconds.HasValue
                        ? new Dictionary<string, string[]>
                        {
                            ["retryAfterSeconds"] = [retryAfterSeconds.Value.ToString()]
                        }
                        : null);

                await context.HttpContext.Response.WriteAsJsonAsync(errorResponse, cancellationToken);
            };

            // 1. General API Policy (Sliding Window: 120 req / 1 min per User or IP)
            options.AddPolicy(AuthenticatedUserPolicy, httpContext =>
            {
                var partitionKey = GetPartitionKey(httpContext);
                return RateLimitPartition.GetSlidingWindowLimiter(partitionKey, _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = 120,
                    Window = TimeSpan.FromMinutes(1),
                    SegmentsPerWindow = 4,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
            });

            // 2. Expensive AI Coaching / Grading Policy (Token Bucket: 5 burst, +5 per min)
            options.AddPolicy(ExpensiveAiPolicy, httpContext =>
            {
                var partitionKey = $"ai:{GetPartitionKey(httpContext)}";
                return RateLimitPartition.GetTokenBucketLimiter(partitionKey, _ => new TokenBucketRateLimiterOptions
                {
                    TokenLimit = 5,
                    ReplenishmentPeriod = TimeSpan.FromMinutes(1),
                    TokensPerPeriod = 5,
                    AutoReplenishment = true,
                    QueueLimit = 0
                });
            });

            // 3. Exam Submission & Anti-Scrape Policy (Fixed Window: 15 req / 1 min)
            options.AddPolicy(ExamAntiScrapePolicy, httpContext =>
            {
                var partitionKey = $"exam:{GetPartitionKey(httpContext)}";
                return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 15,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                });
            });
        });

        return services;
    }

    private static string GetPartitionKey(HttpContext context)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? context.User.FindFirstValue("sub");

        if (!string.IsNullOrEmpty(userId))
        {
            return $"user:{userId}";
        }

        return $"ip:{context.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";
    }
}
