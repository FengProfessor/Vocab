using FluentValidation;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Validates <see cref="SaveClassroomWordCommand"/> input fields.
/// </summary>
public sealed class SaveClassroomWordCommandValidator : AbstractValidator<SaveClassroomWordCommand>
{
    public SaveClassroomWordCommandValidator()
    {
        RuleFor(x => x.Word).NotEmpty().MaximumLength(200);
    }
}
