using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Grammar.Commands;

/// <summary>
/// Generates a structured bilingual grammar lesson (theory, formula, usage notes, and examples) for teacher curriculum authoring.
/// </summary>
public sealed class GenerateGrammarLessonCommandHandler(
    ICurrentUserService currentUser)
    : IRequestHandler<GenerateGrammarLessonCommand, ApiResponse<GeneratedGrammarLessonDto>>
{
    public Task<ApiResponse<GeneratedGrammarLessonDto>> Handle(
        GenerateGrammarLessonCommand request,
        CancellationToken ct)
    {
        _ = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        string titleEn = string.IsNullOrWhiteSpace(request.TopicTitle) ? "English Grammar" : request.TopicTitle.Trim();
        string titleVi = string.IsNullOrWhiteSpace(request.TopicTitleVi) ? titleEn : request.TopicTitleVi.Trim();
        string level = string.IsNullOrWhiteSpace(request.Level) ? "beginner" : request.Level.Trim().ToLowerInvariant();

        var dto = new GeneratedGrammarLessonDto(
            TheoryVi: $"**{titleVi} ({titleEn})** là chủ điểm ngữ pháp trọng tâm ở cấp độ **{level.ToUpperInvariant()}**.\n\n" +
                      "Cấu trúc này giúp người học diễn đạt chính xác mối quan hệ về thời gian, nguyên nhân - kết quả hoặc sắc thái nhấn mạnh trong cả giao tiếp học thuật lẫn bài thi TOEIC/IELTS.",
            Formula: $"• Khẳng định (+): S + V ({titleEn}) + O\n" +
                     "• Phủ định (-): S + Aux + not + V + O\n" +
                     "• Nghi vấn (?): Aux + S + V + O?",
            UsageNotes: $"1. Xác định rõ dấu hiệu nhận biết trong câu trước khi chia dạng thức của **{titleEn}**.\n" +
                        "2. Chú ý sự hòa hợp giữa chủ ngữ (Subject-Verb Agreement) và ngữ cảnh thời gian.\n" +
                        "3. Tránh nhầm lẫn giữa dạng chủ động và bị động trong các câu phức.",
            Examples:
            [
                new GrammarLessonExampleDto(
                    $"The team successfully applied {titleEn.ToLowerInvariant()} in their quarterly presentation.",
                    $"Nhóm đã áp dụng thành công cấu trúc {titleVi.ToLowerInvariant()} trong bài thuyết trình hàng quý.",
                    "Ngữ cảnh công sở / TOEIC"),
                new GrammarLessonExampleDto(
                    "Consistent practice makes complex grammatical structures natural in daily speaking.",
                    "Luyện tập đều đặn giúp các cấu trúc ngữ pháp phức tạp trở nên tự nhiên khi giao tiếp hàng ngày.",
                    "Ví dụ giao tiếp thực tế"),
                new GrammarLessonExampleDto(
                    "Please review the key signal words before selecting your final answer.",
                    "Vui lòng kiểm tra kỹ các từ tín hiệu trước khi chọn đáp án cuối cùng.",
                    "Mẹo làm bài thi")
            ]);

        return Task.FromResult(ApiResponse<GeneratedGrammarLessonDto>.Ok(dto, "Grammar lesson generated successfully."));
    }
}
