using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines lexical part-of-speech categories for vocabulary terms.
/// </summary>
public enum PartOfSpeechType
{
    [Display(Name = "Noun")]
    Noun,
    [Display(Name = "Verb")]
    Verb,
    [Display(Name = "Adjective")]
    Adjective,
    [Display(Name = "Adverb")]
    Adverb,
    [Display(Name = "Pronoun")]
    Pronoun,
    [Display(Name = "Preposition")]
    Preposition,
    [Display(Name = "Conjunction")]
    Conjunction,
    [Display(Name = "Interjection")]
    Interjection,
    [Display(Name = "PhrasalVerb")]
    PhrasalVerb,
    [Display(Name = "Idiom")]
    Idiom,
}
