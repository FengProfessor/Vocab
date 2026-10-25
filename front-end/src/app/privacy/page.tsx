import type { Metadata } from 'next';
import Link from 'next/link';
import { Brain, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật — LingoPro',
  description:
    'Chính sách bảo mật của LingoPro: chúng tôi thu thập, sử dụng và bảo vệ dữ liệu học tập, tài khoản của bạn như thế nào.',
  alternates: { canonical: '/privacy' },
};

// Ngày cập nhật gần nhất của chính sách (hiển thị cho người dùng)
const LAST_UPDATED = '16/07/2026';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Về trang chủ
        </Link>

        <div className="mt-6 flex items-center gap-2 text-lg font-bold text-white">
          <Brain className="h-5 w-5 text-indigo-400" /> LingoPro
        </div>

        <h1 className="mt-6 text-3xl font-bold text-white">Chính sách bảo mật</h1>
        <p className="mt-2 text-sm text-slate-400">Cập nhật lần cuối: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">1. Dữ liệu chúng tôi thu thập</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Thông tin tài khoản: email, tên hiển thị khi bạn đăng ký.</li>
              <li>Dữ liệu học tập: từ vựng đã lưu, tiến độ ôn tập (SRS), kết quả quiz, bài ngữ pháp.</li>
              <li>Dữ liệu kỹ thuật: loại thiết bị, trình duyệt, nhật ký truy cập cơ bản để vận hành dịch vụ.</li>
              <li>Token thông báo đẩy (FCM) nếu bạn bật nhắc ôn tập.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">2. Mục đích sử dụng</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Cung cấp và cá nhân hóa lộ trình học từ vựng, ngữ pháp.</li>
              <li>Lên lịch ôn tập theo thuật toán FSRS v5 và gửi nhắc nhở đúng thời điểm.</li>
              <li>Thống kê tiến độ cho học sinh và giáo viên trong lớp học.</li>
              <li>Cải thiện chất lượng sản phẩm và hỗ trợ kỹ thuật.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">3. Bên thứ ba</h2>
            <p>
              LingoPro sử dụng các nhà cung cấp dịch vụ để vận hành: Supabase (cơ sở dữ liệu &amp; xác thực),
              Google Gemini (làm giàu nội dung bằng AI), Firebase Cloud Messaging (thông báo đẩy) và Vercel
              (lưu trữ ứng dụng). Dữ liệu chỉ được chia sẻ ở mức cần thiết để các dịch vụ này hoạt động. Chúng
              tôi không bán dữ liệu cá nhân của bạn.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">4. Lưu trữ &amp; bảo mật</h2>
            <p>
              Dữ liệu được lưu trên hạ tầng Supabase với Row Level Security (RLS) — mỗi người dùng chỉ truy
              cập được dữ liệu của chính mình. Chúng tôi áp dụng các biện pháp kỹ thuật hợp lý để bảo vệ dữ
              liệu, nhưng không có hệ thống nào an toàn tuyệt đối.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>API dùng xác thực JWT / token thiết bị; thao tác nhạy cảm kiểm tra quyền lớp học.</li>
              <li>Giới hạn tần suất (rate limit) chống spam AI và dump dữ liệu.</li>
              <li>Không bán dữ liệu học sinh; chỉ chia sẻ với nhà cung cấp cần thiết để vận hành (Supabase, Vercel, AI, FCM).</li>
              <li>Bạn không được dùng API/extension để xuất hàng loạt dữ liệu của người khác hoặc kho nội dung.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">5. Quyền của bạn</h2>
            <p>
              Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa dữ liệu cá nhân và tài khoản của mình. Khi
              xóa tài khoản, dữ liệu học tập liên quan sẽ bị xóa theo. Để yêu cầu, liên hệ qua email bên dưới.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">6. Liên hệ</h2>
            <p>
              Mọi thắc mắc về quyền riêng tư, vui lòng liên hệ:{' '}
              <a className="text-indigo-400 hover:underline" href="mailto:support@lingopro.online">
                support@lingopro.online
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-sm text-slate-400">
          Xem thêm{' '}
          <Link href="/terms" className="text-indigo-400 hover:underline">
            Điều khoản sử dụng
          </Link>
          .
        </div>
      </div>
    </main>
  );
}
