using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Command to delete a vocabulary word from a classroom or personal workspace.
/// </summary>
public record DeleteVocabWordCommand(Guid WordId) : IRequest<ApiResponse<bool>>;
