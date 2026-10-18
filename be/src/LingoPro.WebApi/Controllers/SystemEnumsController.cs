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
    /// Returns all 48 domain business enums and their members wrapped in the standardized ApiResponse envelope.
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
            var names = Enum.GetNames(enumType);
            var values = Enum.GetValuesAsUnderlyingType(enumType);
            var items = new List<EnumMemberItemDto>(names.Length);

            for (var i = 0; i < names.Length; i++)
            {
                var numericValue = Convert.ToInt32(values.GetValue(i));
                items.Add(new EnumMemberItemDto(names[i], numericValue));
            }

            catalog[enumType.Name] = items;
        }

        return OkResponse<IReadOnlyDictionary<string, IReadOnlyList<EnumMemberItemDto>>>(
            catalog,
            $"Successfully synchronized {catalog.Count} domain business enums.");
    }
}
