using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Unicode;

namespace LingoPro.WebApi.Services.Ipa;

/// <summary>
/// Static, thread-safe loader for wwwroot/data/ipa-chart-v1.json. The file is read once per process.
/// </summary>
public static class IpaChart
{
    private static readonly object Gate = new();
    private static IpaChartData? _data;
    private static Dictionary<string, IpaPhoneme>? _byId;

    /// <summary>Serializer options shared with the view (camelCase, HTML-safe, keeps Vietnamese readable).</summary>
    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        // Still escapes <, >, & and ' so the output is safe inside a <script> block.
        Encoder = JavaScriptEncoder.Create(UnicodeRanges.All),
    };

    /// <summary>Loads (or returns the cached) chart. Returns an empty chart when the file is missing or invalid.</summary>
    public static IpaChartData Get(string webRootPath)
    {
        var existing = _data;
        if (existing is not null) return existing;

        lock (Gate)
        {
            if (_data is not null) return _data;

            IpaChartData loaded;
            try
            {
                var path = Path.Combine(webRootPath, "data", "ipa-chart-v1.json");
                using var stream = File.OpenRead(path);
                loaded = JsonSerializer.Deserialize<IpaChartData>(stream, JsonOptions) ?? new IpaChartData();
            }
            catch (Exception ex) when (ex is IOException or JsonException or UnauthorizedAccessException)
            {
                loaded = new IpaChartData();
            }

            // Only cache a successful load so a transient failure can recover.
            if (loaded.Phonemes.Count == 0) return loaded;

            _byId = loaded.Phonemes
                .GroupBy(p => p.Id)
                .ToDictionary(g => g.Key, g => g.First());
            _data = loaded;
            return loaded;
        }
    }

    /// <summary>Finds a phoneme by id (call <see cref="Get"/> first).</summary>
    public static IpaPhoneme? FindById(string webRootPath, string id)
    {
        Get(webRootPath);
        var map = _byId;
        return map is not null && map.TryGetValue(id, out var p) ? p : null;
    }

    /// <summary>Phonemes of a stage in stage order (unknown ids are skipped).</summary>
    public static IReadOnlyList<IpaPhoneme> ForStage(string webRootPath, IpaStage stage)
    {
        var list = new List<IpaPhoneme>(stage.PhonemeIds.Count);
        foreach (var id in stage.PhonemeIds)
        {
            var p = FindById(webRootPath, id);
            if (p is not null) list.Add(p);
        }
        return list;
    }
}
