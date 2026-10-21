using System.Text.Json;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Dictionary.Queries;

/// <summary>
/// Retrieves a global dictionary headword entry from the database and optionally disambiguates its sense in context via AI.
/// </summary>
public class SmartLookupQueryHandler(
    IApplicationDbContext dbContext,
    IAiRouterService aiRouter) : IRequestHandler<SmartLookupQuery, ApiResponse<DictionaryEntryDto>>
{
    public async Task<ApiResponse<DictionaryEntryDto>> Handle(SmartLookupQuery request, CancellationToken ct)
    {
        string normalized = request.Term.Trim().ToLowerInvariant();

        var entry = await dbContext.GlobalDictionaries
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Word == normalized, ct)
            ?? throw new NotFoundException("GlobalDictionary", normalized);

        // global_dictionary stores the whole entry in a single jsonb column (data); the DTO's per-field JSON is extracted from it.
        using var payload = ParseData(entry.Data);

        int? bestSenseIndex = null;
        if (!string.IsNullOrWhiteSpace(request.Context))
        {
            bestSenseIndex = await aiRouter.SelectSmartSenseIndexAsync(
                entry.Word,
                request.Context,
                [Pick(payload, "definitions", "definition", "senses")],
                ct);
        }

        return ApiResponse<DictionaryEntryDto>.Ok(
            new DictionaryEntryDto(
                entry.Id,
                entry.Word,
                PickText(payload, "ipa", "pronunciation", "phonetic"),
                PickText(payload, "partOfSpeech", "part_of_speech", "pos"),
                Pick(payload, "definitions", "definition", "senses"),
                Pick(payload, "collocations", "collocation"),
                Pick(payload, "synonyms", "synonym"),
                Pick(payload, "antonyms", "antonym"),
                bestSenseIndex),
            "Dictionary entry retrieved successfully.");
    }

    private static JsonDocument ParseData(string? data)
    {
        try { return JsonDocument.Parse(string.IsNullOrWhiteSpace(data) ? "{}" : data); }
        catch (JsonException) { return JsonDocument.Parse("{}"); }
    }

    private static bool TryFind(JsonDocument doc, string[] keys, out JsonElement value)
    {
        value = default;
        if (doc.RootElement.ValueKind != JsonValueKind.Object) return false;
        foreach (var key in keys)
        {
            foreach (var prop in doc.RootElement.EnumerateObject())
            {
                if (string.Equals(prop.Name, key, StringComparison.OrdinalIgnoreCase))
                {
                    value = prop.Value;
                    return true;
                }
            }
        }
        return false;
    }

    private static string Pick(JsonDocument doc, params string[] keys)
        => TryFind(doc, keys, out var v) ? v.GetRawText() : "[]";

    private static string PickText(JsonDocument doc, params string[] keys)
        => TryFind(doc, keys, out var v)
            ? (v.ValueKind == JsonValueKind.String ? v.GetString() ?? string.Empty : v.GetRawText())
            : string.Empty;}
