using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines application-wide user roles mapped from profiles.role ('student', 'teacher', 'admin').
/// </summary>
public enum UserRole
{
    [Display(Name = "Student")]
    Student,
    [Display(Name = "Teacher")]
    Teacher,
    [Display(Name = "Admin")]
    Admin,
}
