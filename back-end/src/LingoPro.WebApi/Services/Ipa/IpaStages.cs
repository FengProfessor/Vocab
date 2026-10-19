namespace LingoPro.WebApi.Services.Ipa;

/// <summary>The 4 pedagogical stages (ported verbatim from IPA_STAGES in src/lib/ipa-client.ts).</summary>
public static class IpaStages
{
    public const string DefaultStageId = "stage-must-fix";
    public const string DefaultRecommendedId = "th-voiced";

    public static readonly IReadOnlyList<IpaStage> All = new IpaStage[]
    {
        new(
            "stage-must-fix",
            1,
            "Chặng 1: 14 Âm \"Tử Huyệt\" Người Việt Dễ Sai",
            "1. Âm Cấp Bách (14)",
            "Ưu tiên số 1",
            "Đừng vội học cả 44 âm. Hãy làm chủ 14 âm này trước vì tiếng Việt không có hoặc phát âm rất khác. Sửa xong 14 âm này là phát âm của bạn đã lột xác 80%!",
            "Tập trung sửa các lỗi sai nghiêm trọng nhất: ngọng \"th\" (/θ/, /ð/), nuốt âm đuôi /s/, /z/, và nhầm lẫn cặp /iː/ - /ɪ/.",
            new[]
            {
                "th-voiced", "th-voiceless", "s-sound", "z-sound", "sh-sound", "zh-sound", "ch-sound",
                "j-consonant", "p-sound", "t-sound", "k-sound", "v-sound", "i-long", "i-short",
            }),
        new(
            "stage-vowel-pairs",
            2,
            "Chặng 2: Cặp Nguyên Âm Đối Lập (Dài ↔ Ngắn)",
            "2. Cặp Nguyên Âm (12)",
            "Căng ↔ Thả lỏng",
            "Luôn học nguyên âm theo từng cặp đối lập. Chú ý cảm nhận cơ miệng: âm dài cơ miệng phải CĂNG, còn âm ngắn cơ miệng hoàn toàn THẢ LỎNG.",
            "Tránh thói quen đọc âm tiếng Anh thành \"i, u, o\" tiếng Việt. Hãy quan sát độ mở hàm của giáo viên.",
            new[]
            {
                "i-long", "i-short", "u-long", "u-short", "aw-sound", "o-short", "er-sound", "schwa",
                "e-sound", "ae-sound", "ah-sound", "uh-sound",
            },
            new IpaPair[]
            {
                new("Cặp /iː/ - /ɪ/", "Căng môi mỉm cười ↔ Thả lỏng hạ hàm", "i-long", "i-short",
                    "sheep (/ʃiːp/) vs ship (/ʃɪp/) - Nhầm lẫn tai hại nhất"),
                new("Cặp /uː/ - /ʊ/", "Chu môi tròn căng ↔ Thả lỏng môi mở", "u-long", "u-short",
                    "shoot (/ʃuːt/) vs book (/bʊk/)"),
                new("Cặp /ɔː/ - /ɒ/", "Tròn môi sâu đáy họng ↔ Mở to tròn tự nhiên", "aw-sound", "o-short",
                    "door (/dɔːr/) vs on (/ɒn/)"),
                new("Cặp /ɜː/ - /ə/", "Uốn lưỡi giữa họng ↔ Âm lướt ngắn thả lỏng", "er-sound", "schwa",
                    "bird (/bɜːd/) vs teacher (/ˈtiːtʃər/)"),
                new("Cặp /e/ - /æ/", "Miệng mở vừa ↔ Hạ quai hàm tối đa (âm bướm)", "e-sound", "ae-sound",
                    "bed (/bed/) vs cat (/kæt/)"),
                new("Cặp /ɑː/ - /ʌ/", "Mở rộng sâu cuống họng ↔ Bật nhanh dứt khoát", "ah-sound", "uh-sound",
                    "car (/kɑːr/) vs cup (/kʌp/)"),
            }),
        new(
            "stage-consonant-pairs",
            3,
            "Chặng 3: 8 Cặp Phụ Âm Đối Xứng (Cùng Khẩu Hình)",
            "3. Cặp Phụ Âm (16)",
            "Vô thanh ↔ Hữu thanh",
            "Bí quyết học nhanh gấp đôi: Hai âm trong cùng 1 cặp có khẩu hình môi - răng - lưỡi GIỐNG HỆT NHAU, chỉ khác: 1 âm chỉ thổi hơi ra (vô thanh), âm kia rung cổ họng (hữu thanh).",
            "Đặt ngón tay lên cổ họng: khi đọc /b/, /d/, /g/, /v/, /ð/, /z/, /ʒ/, /dʒ/ cổ họng phải rung rõ rệt.",
            new[]
            {
                "p-sound", "b-sound", "t-sound", "d-sound", "k-sound", "g-sound", "f-sound", "v-sound",
                "th-voiceless", "th-voiced", "s-sound", "z-sound", "sh-sound", "zh-sound", "ch-sound", "j-consonant",
            },
            new IpaPair[]
            {
                new("Cặp /p/ - /b/", "Hai môi mím chặt rồi bật hơi", "p-sound", "b-sound",
                    "/p/ chỉ thổi gió, /b/ rung thanh quản (pen vs ball)"),
                new("Cặp /t/ - /d/", "Đầu lưỡi chạm chân răng hàm trên", "t-sound", "d-sound",
                    "/t/ bật hơi dứt khoát, /d/ rung thanh quản (tea vs dog)"),
                new("Cặp /k/ - /g/", "Cuống lưỡi nâng chạm vòm họng mềm", "k-sound", "g-sound",
                    "/k/ bật hơi cuống họng, /g/ rung cổ họng (cat vs go)"),
                new("Cặp /f/ - /v/", "Răng cửa trên cắn nhẹ môi dưới", "f-sound", "v-sound",
                    "/f/ thổi gió nhẹ, /v/ rung môi mạnh (fish vs voice)"),
                new("Cặp /θ/ - /ð/ (Th)", "Đặt đầu lưỡi kẹp giữa hai hàm răng", "th-voiceless", "th-voiced",
                    "/θ/ thổi gió mát, /ð/ rung tê đầu lưỡi (think vs this)"),
                new("Cặp /s/ - /z/", "Hai hàm răng khép nhẹ, đẩy luồng hơi", "s-sound", "z-sound",
                    "/s/ xì hơi như rắn, /z/ rung như ong kêu (see vs zoo)"),
                new("Cặp /ʃ/ - /ʒ/", "Chu môi tròn về phía trước, thân lưỡi nâng", "sh-sound", "zh-sound",
                    "/ʃ/ suỵt im lặng, /ʒ/ rung dây thanh quản (she vs vision)"),
                new("Cặp /tʃ/ - /dʒ/", "Chặn hơi đầu lưỡi rồi bật chu môi dứt khoát", "ch-sound", "j-consonant",
                    "/tʃ/ bật gió dứt khoát, /dʒ/ rung thanh âm (chin vs jam)"),
            }),
        new(
            "stage-diphthongs-sonorants",
            4,
            "Chặng 4: Nguyên Âm Đôi & Phụ Âm Mũi / Lướt",
            "4. Âm Đôi & Âm Lướt (16)",
            "Nối âm & Ngữ lưu",
            "Chặng hoàn thiện phát âm tự nhiên. Nguyên âm đôi cần lướt mượt từ âm 1 sang âm 2. Các âm mũi và âm lướt giúp câu nói nghe có nhịp điệu và trôi chảy.",
            "Đặc biệt lưu ý âm /l/ (Dark L) và âm /r/ khi đứng ở vị trí cuối từ.",
            new[]
            {
                "ei-sound", "ai-sound", "oi-sound", "ou-sound", "au-sound", "ia-sound", "ea-sound", "ua-sound",
                "m-sound", "n-sound", "ng-sound", "h-sound", "l-sound", "r-sound", "w-sound", "j-sound",
            }),
    };
}
