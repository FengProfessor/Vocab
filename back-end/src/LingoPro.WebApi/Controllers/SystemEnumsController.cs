using System.ComponentModel.DataAnnotations;
using System.Reflection;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// Exposes the complete catalog of LingoPro Domain Enums to ensure 100% contract synchronization
/// between the .NET 10 backend and the React 19 TypeScript frontend.
/// </summary>
[Route("api/v1/system/enums")]
public sealed class SystemEnumsController : ApiControllerBase
{
    /// <summary>
    /// Returns all 48 domain business enums and their Display(Name) string values wrapped in the standardized ApiResponse envelope.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyDictionary<string, IReadOnlyList<EnumMemberItemDto>>>), StatusCodes.Status200OK)]
    public ActionResult<ApiResponse<IReadOnlyDictionary<string, IReadOnlyList<EnumMemberItemDto>>>> GetAllDomainEnums()
    {
        var domainAssembly = typeof(UserRole).Assembly;
        var enumTypes = domainAssembly
            .GetTypes()
            .Where(t => t is { IsEnum: true, IsPublic: true } && t.Namespace == typeof(UserRole).Namespace)
            .OrderBy(t => t.Name, StringComparer.Ordinal)
            .ToList();

        var catalog = new Dictionary<string, IReadOnlyList<EnumMemberItemDto>>(StringComparer.Ordinal);

        foreach (var enumType in enumTypes)
        {
            var fields = enumType.GetFields(BindingFlags.Public | BindingFlags.Static);
            var items = new List<EnumMemberItemDto>(fields.Length);

            foreach (var field in fields)
            {
                var displayValue = field.GetCustomAttribute<DisplayAttribute>()?.Name ?? field.Name;
                items.Add(new EnumMemberItemDto(field.Name, displayValue));
            }

            catalog[enumType.Name] = items;
        }

        return OkResponse<IReadOnlyDictionary<string, IReadOnlyList<EnumMemberItemDto>>>(
            catalog,
            $"Successfully synchronized {catalog.Count} domain business enums.");
    }
}
