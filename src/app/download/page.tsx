import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  ExternalLink,
  MonitorDown,
  MousePointer2,
  ShieldCheck,
} from 'lucide-react';

const DESKTOP_VERSION = '0.1.4';
const DESKTOP_RELEASE_TAG = `desktop-v${DESKTOP_VERSION}`;
const DESKTOP_FILE = `LingoPro-Desktop-${DESKTOP_VERSION}-Windows.zip`;
const DESKTOP_RELEASE_URL = `https://github.com/FengProfessor/Vocab/releases/tag/${DESKTOP_RELEASE_TAG}`;
const DESKTOP_DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL ??
  `https://github.com/FengProfessor/Vocab/releases/download/${DESKTOP_RELEASE_TAG}/${DESKTOP_FILE}`;

export const metadata: Metadata = {
  title: 'Tải LingoPro Desktop | Tra từ nhanh trên Windows',
  description:
    'Tải LingoPro Desktop cho Windows, xem hướng dẫn cài đặt và cách kết nối tài khoản để tra từ nhanh trên mọi ứng dụng.',
};

const installSteps = [
  {
    title: 'Tải file zip',
    text: `Bấm nút tải, lưu file ${DESKTOP_FILE} vào máy.`,
  },
  {
    title: 'Giải nén và mở installer',
    text: 'Giải nén file zip, rồi double-click file Setup.exe bên trong. Nếu Windows hỏi quyền, chọn cho phép để tiếp tục.',
  },
  {
    title: 'Vượt SmartScreen nếu có',
    text: 'Nếu thấy Windows SmartScreen, bấm More info, rồi chọn Run anyway. Bản hiện tại chưa code-sign nên Windows có thể hỏi bước này.',
  },
  {
    title: 'Đăng nhập LingoPro',
    text: 'Mở app, vào Cài đặt, dán token lpext_ để đồng bộ tài khoản và lưu từ vào lịch ôn SRS.',
  },
] as const;

const usageItems = [
  'Double-click một từ để tra nhanh.',
  'Bôi đen cụm từ rồi bấm Ctrl+Shift+L.',
  'Bấm nút lưu ở nghĩa đúng để đưa từ vào lịch ôn.',
  'Kéo pet bubble tới vị trí gọn trên màn hình.',
] as const;

export default function DownloadPage() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#f7faf7] text-[#0f172a]">
      <section className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-black tracking-tight text-emerald-900">
            LingoPro
          </Link>
          <Link href="/auth" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-extrabold text-white">
            Lấy token
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center lg:py-14">
        <div className="min-w-0 space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-extrabold text-emerald-800 shadow-sm">
            <MonitorDown className="h-4 w-4" />
            Windows desktop app v{DESKTOP_VERSION}
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Tải LingoPro Desktop để tra từ nhanh trên mọi ứng dụng.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              App desktop chạy nổi trên màn hình, bắt từ bằng double-click hoặc hotkey, rồi lưu nghĩa vào tài khoản LingoPro để ôn theo SRS.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={DESKTOP_DOWNLOAD_URL}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-[0_18px_40px_rgba(16,185,129,0.28)] transition hover:bg-emerald-700"
            >
              <ArrowDownToLine className="h-5 w-5" />
              Tải bản Windows (.zip)
            </a>
            <a
              href="#install"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 text-base font-black text-slate-800 transition hover:border-emerald-300"
            >
              Xem hướng dẫn cài
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              'Không cần mở browser để tra từ',
              'Có pet nhắc ôn từ đến hạn',
              'Đồng bộ với tài khoản LingoPro',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-white p-3 text-sm font-bold text-slate-700 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_22px_70px_rgba(15,23,42,0.12)]">
          <img
            src="/downloads/desktop/desktop-preview.png"
            alt="LingoPro Desktop hiển thị popup tra từ và cài đặt tiếng Việt"
            className="aspect-[4/3] w-full rounded-xl bg-slate-950 object-contain"
          />
        </div>
      </section>

      <section id="install" className="mx-auto grid max-w-6xl gap-8 px-4 pb-14 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="min-w-0 space-y-4">
          <h2 className="text-3xl font-black tracking-tight text-slate-950">Hướng dẫn cài đặt</h2>
          <p className="text-base leading-7 text-slate-600">
            Làm theo thứ tự này để người dùng mới cài xong là tra được ngay. Bản Windows hiện là NSIS installer đóng trong file zip để tải/chia sẻ ổn định hơn.
          </p>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <div className="mb-2 flex items-center gap-2 font-black">
              <AlertTriangle className="h-4 w-4" />
              Lưu ý SmartScreen
            </div>
            Windows có thể hiển thị cảnh báo vì phiên bản hiện tại chưa có chữ ký số. Bạn có thể chọn More info, sau đó chọn Run anyway để tiếp tục cài đặt.
          </div>
        </div>

        <div className="min-w-0 grid gap-3">
          {installSteps.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-sm font-black text-emerald-800">
                  {index + 1}
                </span>
                <h3 className="font-black text-slate-950">{step.title}</h3>
              </div>
              <p className="leading-7 text-slate-600">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid min-w-0 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-slate-950">
              <MousePointer2 className="h-5 w-5 text-emerald-600" />
              Sau khi cài xong
            </h2>
            <ul className="space-y-2 text-sm font-semibold leading-6 text-slate-600">
              {usageItems.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 max-w-full rounded-xl bg-slate-50 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-slate-950">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Tải xuống an toàn
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              File cài đặt được lưu trên trang phát hành chính thức của LingoPro tại GitHub. Bạn có thể dùng các liên kết dưới đây để tải trực tiếp.
            </p>
            <div className="mt-3 max-w-full space-y-2 overflow-hidden rounded-lg bg-slate-950 p-3 text-xs font-bold text-emerald-100">
              <p className="break-all [overflow-wrap:anywhere]">{DESKTOP_RELEASE_URL}</p>
              <p className="break-all [overflow-wrap:anywhere]">{DESKTOP_DOWNLOAD_URL}</p>
            </div>
            <a
              href={DESKTOP_DOWNLOAD_URL}
              className="mt-4 inline-flex items-center gap-2 text-sm font-black text-emerald-700 hover:text-emerald-900"
            >
              Mở link tải trực tiếp
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
