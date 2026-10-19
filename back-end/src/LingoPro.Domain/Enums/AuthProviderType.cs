using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines authentication identity providers supported by Supabase Auth.
/// </summary>
public enum AuthProviderType
{
    [Display(Name = "Email")]
    Email,
    [Display(Name = "Google")]
    Google,
}
