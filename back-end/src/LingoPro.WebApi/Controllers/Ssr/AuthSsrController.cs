using System.Text.RegularExpressions;
using LingoPro.Application.Features.Auth;
using LingoPro.Domain.Enums;
using LingoPro.WebApi.Extensions;
using LingoPro.WebApi.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace LingoPro.WebApi.Controllers.Ssr;

/// <summary>
/// Server-side rendered (SSR) authentication controller matching React <c>src/app/auth/page.tsx</c>.
/// Renders the unified Login / Signup page directly from the server, processes credentials and Google OAuth,
/// issues a 15-minute Access Token and 30-day Refresh Token in HttpOnly cookies,
/// and redirects authenticated users to the React SPA Dashboard with the active token pair.
/// </summary>
[AllowAnonymous]
[Route("auth")]
public sealed class AuthSsrController : Controller
{
    private readonly ISender _mediator;
    private readonly IConfiguration _configuration;
    private readonly OAuthFlowCookieService _oauthFlow;

    public AuthSsrController(ISender mediator, IConfiguration configuration, OAuthFlowCookieService oauthFlow)
    {
        _mediator = mediator;
        _configuration = configuration;
        _oauthFlow = oauthFlow;
    }

    private string FrontendBaseUrl =>
        (_configuration["Frontend:BaseUrl"] ?? "http://localhost:5173").TrimEnd('/');

    /// <summary>
    /// Origin Supabase redirects back to after Google consent. Must be listed in Supabase
    /// Authentication → URL Configuration → Redirect URLs. Defaults to the origin of the current request.
    /// </summary>
    private string PublicOrigin =>
        (_configuration["Auth:PublicOrigin"] ?? $"{Request.Scheme}://{Request.Host}").TrimEnd('/');

    [HttpGet("")]
    [HttpGet("login")]
    [HttpGet("register")]
    public IActionResult Login(
        [FromQuery] string? returnUrl = null,
        [FromQuery] string? redirectTo = null,
        [FromQuery] string? mode = null,
        [FromQuery] string? role = null,
        [FromQuery(Name = "ref")] string? refCode = null,
        [FromQuery] string? invite = null,
        [FromQuery] string? error = null,
        [FromQuery(Name = "error_description")] string? errorDescription = null,
        [FromQuery] string? confirmed = null)
    {
        var effectiveReturnUrl = SanitizeReturnUrl(redirectTo ?? returnUrl);
        var hasAuthErrorOrConfirm = !string.IsNullOrWhiteSpace(error) || !string.IsNullOrWhiteSpace(confirmed);

        if (User.Identity?.IsAuthenticated == true && !hasAuthErrorOrConfirm)
        {
            var isTeacherClaim = User.IsInRole(nameof(UserRole.Teacher)) ||
                                 User.IsInRole("teacher") ||
                                 string.Equals(role, "teacher", StringComparison.OrdinalIgnoreCase);
            var destPath = isTeacherClaim && effectiveReturnUrl == "/app" ? "/teacher" : effectiveReturnUrl;
            return Redirect($"{FrontendBaseUrl}{destPath}");
        }

        var referral = !string.IsNullOrWhiteSpace(refCode) ? refCode : invite;
        var isRegisterPath = Request.Path.Value?.EndsWith("/register", StringComparison.OrdinalIgnoreCase) == true;
        var resolvedMode = string.Equals(mode, "signup", StringComparison.OrdinalIgnoreCase) ||
                           isRegisterPath ||
                           (string.IsNullOrWhiteSpace(mode) && !string.IsNullOrWhiteSpace(referral))
            ? "signup"
            : "login";

        var resolvedRole = string.Equals(role, "teacher", StringComparison.OrdinalIgnoreCase)
            ? "teacher"
            : "student";

        PopulateCommonViewData(
            returnUrl: effectiveReturnUrl,
            mode: resolvedMode,
            role: resolvedRole,
            referralCode: referral);

        if (!string.IsNullOrWhiteSpace(error))
        {
            ViewData["ErrorMessage"] = MapOAuthQueryError(error, errorDescription);
        }
        else if (!string.IsNullOrWhiteSpace(confirmed))
        {
            ViewData["StatusMessage"] = "Đã gửi email xác nhận. Mở email rồi quay lại đăng nhập.";
        }

        return View("~/Views/Auth/Login.cshtml");
    }

    [HttpPost("")]
    [HttpPost("login")]
    [HttpPost("register")]
    public async Task<IActionResult> LoginSubmit(
        [FromForm] ServerLoginFormRequest form,
        CancellationToken ct)
    {
        var safeReturnUrl = SanitizeReturnUrl(form.RedirectTo ?? form.ReturnUrl);
        var isRegisterPath = Request.Path.Value?.EndsWith("/register", StringComparison.OrdinalIgnoreCase) == true;
        var mode = string.Equals(form.Mode, "signup", StringComparison.OrdinalIgnoreCase) || isRegisterPath
            ? "signup"
            : "login";
        var roleStr = string.Equals(form.Role, "teacher", StringComparison.OrdinalIgnoreCase)
            ? "teacher"
            : "student";
        var parsedRole = roleStr == "teacher" ? UserRole.Teacher : UserRole.Student;

        PopulateCommonViewData(
            returnUrl: safeReturnUrl,
            mode: mode,
            role: roleStr,
            referralCode: form.ReferralCode,
            email: form.Email,
            fullName: form.FullName);

        // Honeypot check matching React register endpoint
        if (!string.IsNullOrWhiteSpace(form.Website))
        {
            ViewData["Mode"] = "login";
            ViewData["StatusMessage"] = "Đã gửi email xác nhận. Mở email rồi quay lại đăng nhập.";
            return View("~/Views/Auth/Login.cshtml");
        }

        try
        {
            if (mode == "signup")
            {
                var regResponse = await _mediator.Send(
                    new RegisterCommand(
                        (form.Email ?? string.Empty).Trim(),
                        form.Password ?? string.Empty,
                        (form.FullName ?? string.Empty).Trim(),
                        parsedRole),
                    ct);

                var regTokens = regResponse.Data;
                if (regTokens is not null && !string.IsNullOrWhiteSpace(regTokens.AccessToken))
                {
                    AppendAuthCookies(regTokens);
                    return Redirect(BuildCompleteRedirectUrl(safeReturnUrl, regTokens.Role, parsedRole));
                }

                ViewData["Mode"] = "login";
                ViewData["StatusMessage"] = "Đã gửi email xác nhận. Mở email rồi quay lại đăng nhập.";
                return View("~/Views/Auth/Login.cshtml");
            }

            var response = await _mediator.Send(
                new LoginCommand((form.Email ?? string.Empty).Trim(), form.Password ?? string.Empty),
                ct);
            var authTokens = response.Data
                ?? throw new UnauthorizedAccessException(response.Message);

            AppendAuthCookies(authTokens);

            return Redirect(BuildCompleteRedirectUrl(safeReturnUrl, authTokens.Role, parsedRole));
        }
        catch (Exception ex)
        {
            ViewData["ErrorMessage"] = FormatAuthError(ex.Message);
            Response.StatusCode = StatusCodes.Status401Unauthorized;
            return View("~/Views/Auth/Login.cshtml");
        }
    }

    [HttpGet("google")]
    public async Task<IActionResult> GoogleSignIn(
        [FromQuery] string? returnUrl = null,
        [FromQuery] string? role = null,
        CancellationToken ct = default)
    {
        var ua = Request.Headers.UserAgent.ToString();
        var (isInApp, _) = DetectInAppBrowser(ua);
        if (isInApp)
        {
            return Redirect("/auth/login?error=disallowed_useragent");
        }

        var roleStr = string.Equals(role, "teacher", StringComparison.OrdinalIgnoreCase) ? "teacher" : "student";

        // Random PKCE verifier lives only in an encrypted, single-use, 10-minute HttpOnly cookie.
        var codeChallenge = _oauthFlow.Begin(Response, Request.IsHttps, SanitizeReturnUrl(returnUrl), roleStr);

        var callbackUri = $"{PublicOrigin}/auth/callback";
        var response = await _mediator.Send(new GetGoogleOAuthUrlQuery(callbackUri, codeChallenge), ct);
        var targetUrl = response.Data?.AuthorizationUrl;

        if (string.IsNullOrWhiteSpace(targetUrl))
        {
            return Redirect("/auth/login?error=oauth");
        }

        return Redirect(targetUrl);
    }

    [HttpGet("callback")]
    public async Task<IActionResult> GoogleCallback(
        [FromQuery] string? code = null,
        [FromQuery] string? error = null,
        [FromQuery(Name = "error_description")] string? errorDescription = null,
        CancellationToken ct = default)
    {
        // The flow cookie is consumed (deleted) on every callback so an authorization code can never be replayed.
        var flow = _oauthFlow.Consume(Request, Response);

        if (!string.IsNullOrWhiteSpace(error))
        {
            return Redirect($"/auth/login?error={Uri.EscapeDataString(error)}&error_description={Uri.EscapeDataString(errorDescription ?? string.Empty)}");
        }

        if (string.IsNullOrWhiteSpace(code))
        {
            return Redirect("/auth/login?error=oauth_no_session");
        }

        if (flow is null)
        {
            // Missing/expired/tampered flow cookie: the verifier is unavailable, so the exchange cannot succeed.
            return Redirect("/auth/login?error=oauth_relogin");
        }

        try
        {
            var requestedRole = string.Equals(flow.Role, "teacher", StringComparison.OrdinalIgnoreCase)
                ? UserRole.Teacher
                : UserRole.Student;

            var response = await _mediator.Send(new ExchangeGoogleOAuthCodeCommand(code, flow.Verifier, requestedRole), ct);
            var authTokens = response.Data
                ?? throw new UnauthorizedAccessException(response.Message);

            AppendAuthCookies(authTokens);

            return Redirect(BuildCompleteRedirectUrl(SanitizeReturnUrl(flow.ReturnUrl), authTokens.Role, requestedRole));
        }
        catch (Exception ex) when (ex is UnauthorizedAccessException or HttpRequestException or FluentValidation.ValidationException)
        {
            return Redirect("/auth/login?error=oauth_relogin");
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(AuthenticationExtensions.AccessTokenCookieName, new CookieOptions { Path = "/" });
        Response.Cookies.Delete(AuthenticationExtensions.RefreshTokenCookieName, new CookieOptions { Path = "/" });
        return Redirect("/auth/login");
    }

    private void AppendAuthCookies(AuthTokensDto authTokens)
    {
        // Set 15-minute Access Token HttpOnly Cookie
        Response.Cookies.Append(
            AuthenticationExtensions.AccessTokenCookieName,
            authTokens.AccessToken,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Expires = authTokens.AccessTokenExpiresAtUtc,
                Path = "/"
            });

        // Set 30-day Refresh Token HttpOnly Cookie
        Response.Cookies.Append(
            AuthenticationExtensions.RefreshTokenCookieName,
            authTokens.RefreshToken,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Expires = authTokens.RefreshTokenExpiresAtUtc,
                Path = "/"
            });
    }

    private void PopulateCommonViewData(
        string returnUrl,
        string mode,
        string role,
        string? referralCode = null,
        string? email = null,
        string? fullName = null)
    {
        var ua = Request.Headers.UserAgent.ToString();
        var (isInApp, appName) = DetectInAppBrowser(ua);
        var isAndroid = Regex.IsMatch(ua, "Android", RegexOptions.IgnoreCase);
        var isIOS = Regex.IsMatch(ua, "iPhone|iPad|iPod", RegexOptions.IgnoreCase);

        ViewData["ReturnUrl"] = returnUrl;
        ViewData["Mode"] = mode;
        ViewData["Role"] = role;
        ViewData["Email"] = email ?? string.Empty;
        ViewData["FullName"] = fullName ?? string.Empty;
        ViewData["ReferralCode"] = referralCode ?? string.Empty;
        ViewData["HasReferralGift"] = !string.IsNullOrWhiteSpace(referralCode);
        ViewData["IsInApp"] = isInApp;
        ViewData["InAppName"] = appName ?? string.Empty;
        ViewData["IsAndroid"] = isAndroid;
        ViewData["IsIOS"] = isIOS;
        ViewData["AuthUrl"] = $"{Request.Scheme}://{Request.Host}/auth{Request.QueryString}";
    }

    /// <summary>
    /// Builds the SPA post-login step URL. The session itself travels only in HttpOnly cookies;
    /// the URL carries just the already-sanitized landing path and the requested role.
    /// </summary>
    private string BuildCompleteRedirectUrl(string safeReturnUrl, UserRole userRole, UserRole requestedRole)
    {
        var destinationPath = ResolveDestinationUrl(safeReturnUrl, userRole, requestedRole);
        var isTeacher = userRole == UserRole.Teacher || requestedRole == UserRole.Teacher;
        return $"{FrontendBaseUrl}/app/complete" +
               $"?next={Uri.EscapeDataString(destinationPath)}" +
               $"&role={(isTeacher ? "teacher" : "student")}";
    }

    private static string ResolveDestinationUrl(string safeReturnUrl, UserRole userRole, UserRole requestedRole)
    {
        if ((userRole == UserRole.Teacher || requestedRole == UserRole.Teacher) &&
            (safeReturnUrl == "/app" || safeReturnUrl == "/app/journey"))
        {
            return "/teacher";
        }
        return safeReturnUrl;
    }

    private static string SanitizeReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl) ||
            !returnUrl.StartsWith('/') ||
            returnUrl.StartsWith("//") ||
            returnUrl == "/" ||
            returnUrl.StartsWith("/auth", StringComparison.OrdinalIgnoreCase) ||
            returnUrl == "/app/journey")
        {
            return "/app";
        }
        return returnUrl;
    }

    /// <summary>
    /// Normalizes Supabase / backend auth errors into friendly Vietnamese messages matching React <c>formatAuthError</c>.
    /// </summary>
    private static string FormatAuthError(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return "Xác thực thất bại.";
        }

        var m = raw.ToLowerInvariant();
        if (m.Contains("email rate limit") || (m.Contains("rate limit") && m.Contains("email")))
        {
            return "Hệ thống email đang quá tải (nhiều người đăng ký cùng lúc). Dùng «Tiếp tục với Google» hoặc thử lại sau 10–30 phút.";
        }
        if (m.Contains("invalid login") || m.Contains("invalid credentials") || m.Contains("invalid email or password"))
        {
            return "Sai email hoặc mật khẩu.";
        }
        if (m.Contains("email not confirmed"))
        {
            return "Email chưa xác nhận. Hãy mở email xác nhận hoặc dùng Google.";
        }
        if (m.Contains("user already") || m.Contains("already registered") || m.Contains("unable to register"))
        {
            return "Email đã có tài khoản — hãy đăng nhập.";
        }
        if (m.Contains("too many requests") || m.Contains("429"))
        {
            return "Thao tác quá nhanh. Chờ chút rồi thử lại, hoặc dùng Google.";
        }

        return raw;
    }

    private static string MapOAuthQueryError(string err, string? errDesc)
    {
        var desc = (errDesc ?? string.Empty).ToLowerInvariant();
        if (string.Equals(err, "disallowed_useragent", StringComparison.OrdinalIgnoreCase) || desc.Contains("disallowed_useragent"))
        {
            return "Google chặn đăng nhập trong Zalo/Facebook/WebView. Mở Chrome hoặc Safari rồi vào lingopro.online/auth";
        }
        if (string.Equals(err, "oauth_relogin", StringComparison.OrdinalIgnoreCase))
        {
            return "Phiên xác minh đã hết hạn hoặc mở trên thiết bị khác. Đăng nhập lại bằng email hoặc Google.";
        }
        if (string.Equals(err, "oauth", StringComparison.OrdinalIgnoreCase) || string.Equals(err, "oauth_no_session", StringComparison.OrdinalIgnoreCase))
        {
            return "Đăng nhập Google chưa hoàn tất. Mở Chrome/Safari (không mở trong Zalo/FB) rồi thử lại.";
        }
        if (string.Equals(err, "access_denied", StringComparison.OrdinalIgnoreCase))
        {
            return "Bạn đã hủy đăng nhập Google.";
        }
        return $"Lỗi đăng nhập: {err}";
    }

    /// <summary>
    /// Server-side equivalent of <c>src/lib/in-app-browser.ts</c> <c>detectInAppBrowser</c>.
    /// </summary>
    private static (bool IsInApp, string? AppName) DetectInAppBrowser(string? ua)
    {
        if (string.IsNullOrWhiteSpace(ua))
        {
            return (false, null);
        }

        var isAndroid = Regex.IsMatch(ua, "Android", RegexOptions.IgnoreCase);
        var isIOS = Regex.IsMatch(ua, "iPhone|iPad|iPod", RegexOptions.IgnoreCase);

        (string Pattern, string Name)[] rules =
        [
            ("Zalo", "Zalo"),
            ("FBAN|FBAV|FB_IAB|FBIOS", "Facebook"),
            ("Instagram", "Instagram"),
            (@"Line\/", "LINE"),
            ("MicroMessenger", "WeChat"),
            ("TikTok|BytedanceWebview|musical_ly", "TikTok"),
            ("Snapchat", "Snapchat"),
            (@"Twitter|X\/|X-Client", "X (Twitter)"),
            ("LinkedInApp", "LinkedIn"),
            ("Messenger", "Messenger"),
            (@"; wv\)", "WebView"),
            ("iPhone|iPad|iPod", "WebView")
        ];

        foreach (var (pattern, name) in rules)
        {
            if (!Regex.IsMatch(ua, pattern, RegexOptions.IgnoreCase))
            {
                continue;
            }

            if (name == "WebView" && isIOS)
            {
                var isSafari = Regex.IsMatch(ua, "Safari", RegexOptions.IgnoreCase) &&
                               !Regex.IsMatch(ua, "CriOS|FxiOS|OPiOS|EdgiOS", RegexOptions.IgnoreCase);
                var isChromeIOS = Regex.IsMatch(ua, "CriOS", RegexOptions.IgnoreCase);
                if (isSafari || isChromeIOS)
                {
                    continue;
                }
                if (Regex.IsMatch(ua, "AppleWebKit", RegexOptions.IgnoreCase) &&
                    !Regex.IsMatch(ua, "Safari", RegexOptions.IgnoreCase))
                {
                    return (true, "trình duyệt trong app");
                }
                continue;
            }

            if (name == "WebView" && isAndroid)
            {
                if (Regex.IsMatch(ua, @"Chrome\/", RegexOptions.IgnoreCase) &&
                    !Regex.IsMatch(ua, @"; wv\)", RegexOptions.IgnoreCase))
                {
                    continue;
                }
                return (true, "WebView");
            }

            return (true, name);
        }

        return (false, null);
    }
}
