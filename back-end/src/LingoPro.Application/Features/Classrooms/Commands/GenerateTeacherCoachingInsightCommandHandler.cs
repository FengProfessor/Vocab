using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Generates a structured TESOL coaching suggestion in Vietnamese based on the student's VMS, LCS, and diagnostic tag.
/// </summary>
public sealed class GenerateTeacherCoachingInsightCommandHandler(
    ICurrentUserService currentUser)
    : IRequestHandler<GenerateTeacherCoachingInsightCommand, ApiResponse<string>>
{
    public Task<ApiResponse<string>> Handle(
        GenerateTeacherCoachingInsightCommand request,
        CancellationToken ct)
    {
        _ = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        string name = string.IsNullOrWhiteSpace(request.StudentName) ? "Học viên" : request.StudentName.Trim();
        int vms = Math.Clamp(request.Vms, 0, 100);
        int lcs = Math.Clamp(request.Lcs, 0, 100);
        string tag = (request.Tag ?? string.Empty).Trim();

        string suggestion;
        if (vms < 35 && lcs < 40)
        {
            suggestion = $"Học viên {name} đang có dấu hiệu đứt gãy nhịp học tập (LCS {lcs}%, VMS {vms}%). " +
                         "Đề xuất: (1) Sử dụng nút 'Giao 5 từ khó ôn hôm nay' để kéo các thẻ suy giảm trí nhớ về hàng đợi ưu tiên; " +
                         "(2) Nhắn tin động viên học viên hoàn thành phiên ôn tập ngắn 5 phút mỗi ngày thay vì dồn bài cuối tuần.";
        }
        else if (vms < 50 && lcs >= 50)
        {
            suggestion = $"Học viên {name} duy trì thói quen học khá đều đặn (LCS {lcs}%) nhưng độ bền ghi nhớ từ vựng còn thấp (VMS {vms}% — {tag}). " +
                         "Đề xuất: Chuyển từ ôn nhận diện thụ động sang bài tập đặt câu ngữ cảnh (AI Writing / Cloze) với 5 từ yếu nhất để củng cố liên kết ngữ nghĩa sâu.";
        }
        else if (vms >= 65 && lcs < 50)
        {
            suggestion = $"Học viên {name} có nền tảng tiếp thu từ vựng tốt (VMS {vms}%) nhưng tần suất ôn tập chưa ổn định (LCS {lcs}%). " +
                         "Đề xuất: Thiết lập mục tiêu chuỗi ngày học (Streak) tối thiểu 4 ngày/tuần và giao thử thách Quiz tốc độ để duy trì phản xạ.";
        }
        else
        {
            suggestion = $"Học viên {name} đang duy trì phong độ học tập tích cực (VMS {vms}%, LCS {lcs}%). " +
                         "Đề xuất: Nâng độ khó thông qua các bài luyện Speaking Roleplay hoặc mở rộng nhóm từ vựng học thuật đồng nghĩa/trái nghĩa ở cấp độ CEFR tiếp theo.";
        }

        return Task.FromResult(ApiResponse<string>.Ok(suggestion, "Coaching insight generated successfully."));
    }
}
