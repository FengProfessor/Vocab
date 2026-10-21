using System.Text;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace LingoPro.Infrastructure.Persistence.Converters;

/// <summary>
/// Maps a C# enum to the lowercase snake_case text values stored in the Supabase schema
/// (e.g. <c>BankTransfer</c> -> <c>bank_transfer</c>). Optional explicit overrides cover irregular values (e.g. <c>VnPay</c> -> <c>vnpay</c>).
/// </summary>
public sealed class SnakeCaseEnumConverter<TEnum> : ValueConverter<TEnum, string>
    where TEnum : struct, Enum
{
    public SnakeCaseEnumConverter(params (TEnum Value, string Text)[] overrides)
        : base(
            value => ToText(value, overrides),
            text => FromText(text, overrides))
    {
    }

    private static string ToText(TEnum value, (TEnum Value, string Text)[] overrides)
    {
        foreach (var (v, text) in overrides)
        {
            if (EqualityComparer<TEnum>.Default.Equals(v, value))
            {
                return text;
            }
        }

        return ToSnakeCase(value.ToString());
    }

    private static TEnum FromText(string text, (TEnum Value, string Text)[] overrides)
    {
        foreach (var (v, t) in overrides)
        {
            if (string.Equals(t, text, StringComparison.OrdinalIgnoreCase))
            {
                return v;
            }
        }

        return Enum.Parse<TEnum>(text.Replace("_", string.Empty), ignoreCase: true);
    }

    private static string ToSnakeCase(string name)
    {
        var sb = new StringBuilder(name.Length + 4);
        for (var i = 0; i < name.Length; i++)
        {
            var c = name[i];
            if (char.IsUpper(c) && i > 0)
            {
                sb.Append('_');
            }

            sb.Append(char.ToLowerInvariant(c));
        }

        return sb.ToString();
    }
}
