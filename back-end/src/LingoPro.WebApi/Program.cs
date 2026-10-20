using System.Text.Json.Serialization;
using LingoPro.Application;
using LingoPro.Application.Common.Models;
using LingoPro.Infrastructure;
using LingoPro.WebApi.Extensions;
using LingoPro.WebApi.Middlewares;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

// 1. Register Clean Architecture Layers (Application + Infrastructure with Phased Caching & JWT Service)
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// 2. Register JWT Authentication (15m Access / 30d Refresh + HttpOnly Cookie Support) & Authorization Policies
builder.Services.AddSupabaseAuthentication(builder.Configuration);

// 3. Register Native .NET 10 Rate Limiting & SSR Response Caching Middleware
builder.Services.AddAppRateLimiting();
builder.Services.AddSsrResponseCaching();

// 4. Configure CORS for React SPA Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactSpaPolicy", policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? ["http://localhost:5173", "http://localhost:3000", "https://lingopro.online"];

        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 5. Register Controllers + Razor Views (for SSR SEO Landing Pages)
builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(kvp => kvp.Value is { Errors.Count: > 0 })
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value!.Errors.Select(e =>
                        string.IsNullOrWhiteSpace(e.ErrorMessage)
                            ? "The provided value is invalid."
                            : e.ErrorMessage).ToArray()
                );

            var payload = ApiResponse<object>.Fail(
                statusCode: StatusCodes.Status400BadRequest,
                message: "The request payload is malformed or contains invalid parameters.",
                errorCode: "INVALID_REQUEST_PAYLOAD",
                errors: errors
            );

            return new BadRequestObjectResult(payload);
        };
    });

builder.Services.AddOpenApi();

var app = builder.Build();

// 6. Global Exception Handling Middleware (Uniform English ApiResponse<T> Envelope with StatusCode)
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();
var repoPublicPath = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "..", "..", "public"));
if (Directory.Exists(repoPublicPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(repoPublicPath)
    });
}
app.UseCors("ReactSpaPolicy");
app.UseResponseCaching();

app.UseMiddleware<CookieCsrfMiddleware>();

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();

// 7. Standardized Health Check Endpoint
app.MapGet("/api/v1/health", () => Results.Ok(
    ApiResponse<object>.Ok(
        new { service = "LingoPro.WebApi", runtime = "net10.0", status = "Healthy" },
        "LingoPro Backend API is healthy and operational.",
        StatusCodes.Status200OK
    )
));

// 8. Forward React SPA routes (/auth, /app, /student, /teacher, /admin) to the configured SPA origin
var spaBaseUrl = (builder.Configuration["Frontend:BaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
app.MapGet("/auth", (HttpContext ctx) =>
    Results.Redirect($"{spaBaseUrl}/auth/login{ctx.Request.QueryString}"));
string[] spaPrefixes = ["/auth", "/app", "/student", "/teacher", "/admin"];
foreach (var prefix in spaPrefixes)
{
    if (prefix != "/auth")
    {
        app.MapGet(prefix, (HttpContext ctx) =>
            Results.Redirect($"{spaBaseUrl}{ctx.Request.Path}{ctx.Request.QueryString}"));
    }
    app.MapGet($"{prefix}/{{**slug}}", (HttpContext ctx) =>
        Results.Redirect($"{spaBaseUrl}{ctx.Request.Path}{ctx.Request.QueryString}"));
}

app.Run();
