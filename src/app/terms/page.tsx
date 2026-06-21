import type { Metadata } from 'next';
import Link from 'next/link';
import { Brain, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng — LingoPro',
  description:
    'Điều khoản sử dụng dịch vụ LingoPro: quyền và nghĩa vụ khi dùng nền tảng học tiếng Anh, chính sách gói trả phí và hoàn tiền.',
  alternates: { canonical: '/terms' },
};

// Ngày cập nhật gần nhất của điều khoản (hiển thị cho người dùng)
const LAST_UPDATED = '21/06/2026';

export default function TermsPage() {
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

        <h1 className="mt-6 text-3xl font-bold text-white">Điều khoản sử dụng</h1>
        <p className="mt-2 text-sm text-slate-400">Cập nhật lần cuối: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">1. Chấp nhận điều khoản</h2>
            <p>
              Khi tạo tài khoản hoặc sử dụng LingoPro, bạn đồng ý với các điều khoản dưới đây. Nếu không đồng
              ý, vui lòng ngừng sử dụng dịch vụ.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">2. Tài khoản</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình.</li>
              <li>Thông tin đăng ký phải chính xác và được cập nhật khi thay đổi.</li>
              <li>Không chia sẻ tài khoản trả phí cá nhân cho người khác ngoài phạm vi gói cho phép.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">3. Sử dụng hợp lệ</h2>
            <p>Bạn đồng ý không:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Sao chép, bán lại hoặc phân phối lại nội dung của LingoPro khi chưa được phép.</li>
              <li>Can thiệp, dò quét hoặc gây quá tải hệ thống.</li>
              <li>Dùng dịch vụ cho mục đích vi phạm pháp luật.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">4. Gói trả phí &amp; thanh toán</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Gói Free miễn phí với tính năng giới hạn; gói Pro và các gói khác tính phí theo chu kỳ tháng/năm.</li>
              <li>Giá hiển thị trên trang được tính bằng VND, đã gồm các khoản theo quy định hiện hành.</li>
              <li>Gói tự động gia hạn cho đến khi bạn hủy. Bạn có thể hủy bất kỳ lúc nào trong phần cài đặt tài khoản.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">5. Hoàn tiền</h2>
            <p>
              Bạn có thể yêu cầu hoàn tiền trong vòng 30 ngày kể từ lần thanh toán đầu tiên nếu chưa hài lòng.
              Liên hệ email hỗ trợ để được xử lý.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">6. Giới hạn trách nhiệm</h2>
            <p>
              Dịch vụ được cung cấp &quot;nguyên trạng&quot;. LingoPro không bảo đảm kết quả học tập cụ thể và
              không chịu trách nhiệm cho thiệt hại gián tiếp phát sinh từ việc sử dụng dịch vụ, trong phạm vi
              pháp luật cho phép.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">7. Thay đổi điều khoản</h2>
            <p>
              Chúng tôi có thể cập nhật điều khoản theo thời gian. Thay đổi quan trọng sẽ được thông báo trong
              ứng dụng. Việc tiếp tục sử dụng sau khi cập nhật đồng nghĩa bạn chấp nhận điều khoản mới.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">8. Liên hệ</h2>
            <p>
              Câu hỏi về điều khoản, liên hệ:{' '}
              <a className="text-indigo-400 hover:underline" href="mailto:support@lingopro.online">
                support@lingopro.online
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-sm text-slate-400">
          Xem thêm{' '}
          <Link href="/privacy" className="text-indigo-400 hover:underline">
            Chính sách bảo mật
          </Link>
          .
        </div>
      </div>
    </main>
  );
}
