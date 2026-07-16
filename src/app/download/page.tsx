import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  Brain,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Keyboard,
  MousePointer2,
  MonitorDown,
  Repeat2,
  ShieldCheck,
} from 'lucide-react';

const DESKTOP_VERSION = '0.1.4';
const DESKTOP_RELEASE_TAG = `desktop-v${DESKTOP_VERSION}`;
const DESKTOP_SETUP_FILE = `LingoPro-Desktop-${DESKTOP_VERSION}-Setup.exe`;
const DESKTOP_ZIP_FILE = `LingoPro-Desktop-${DESKTOP_VERSION}-Windows.zip`;
const DESKTOP_RELEASE_URL = `https://github.com/FengProfessor/Vocab/releases/tag/${DESKTOP_RELEASE_TAG}`;
const DESKTOP_SETUP_URL =
  process.env.NEXT_PUBLIC_DESKTOP_SETUP_URL ??
  `https://github.com/FengProfessor/Vocab/releases/download/${DESKTOP_RELEASE_TAG}/${DESKTOP_SETUP_FILE}`;
const DESKTOP_ZIP_URL =
  process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL ??
  `https://github.com/FengProfessor/Vocab/releases/download/${DESKTOP_RELEASE_TAG}/${DESKTOP_ZIP_FILE}`;
const DESKTOP_SIZE_LABEL = '~92 MB';

export const metadata: Metadata = {
  title: 'Tải LingoPro Desktop | Tra từ nhanh trên Windows',
  description:
    'Tải LingoPro Desktop cho Windows, xem hướng dẫn cài đặt và cách kết nối tài khoản để tra từ nhanh trên mọi ứng dụng.',
};

const installSteps = [
  {
    title: 'Tải Setup.exe',
    text: `Bấm nút tải, lưu ${DESKTOP_SETUP_FILE} (~92 MB). Không cần giải nén.`,
  },
  {
    title: 'Chạy installer',
    text: 'Double-click file vừa tải. Nếu Windows SmartScreen hiện cảnh báo: More info → Run anyway (bản chưa code-sign).',
  },
  {
    title: 'Kết nối tài khoản',
    text: 'Mở app → Settings → dán token lpext_… (lấy từ Hồ sơ trên web) → Lưu / Kiểm tra.',
  },
] as const;

const features = [
  {
    icon: MousePointer2,
    color: '#4f46e5',
    tile: '#eef0ff',
    title: 'Double-click tra từ',
    text: 'Click đôi một từ trên bất kỳ app nào — nghĩa Việt, IPA hiện ngay.',
  },
  {
    icon: Keyboard,
    color: '#0ea5e9',
    tile: '#e2f5fe',
    title: 'Hotkey Ctrl+Shift+L',
    text: 'Bôi đen cụm từ rồi bấm phím tắt để tra cả cụm.',
  },
  {
    icon: Repeat2,
    color: '#059669',
    tile: '#dcfce7',
    title: 'Lưu vào SRS',
    text: 'Một chạm lưu nghĩa đúng — đồng bộ kho web và lịch ôn FSRS.',
  },
] as const;

export default function DownloadPage() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-muted/40 font-sans text-foreground">
      {/* Header — in-app style */}
      <header className="sticky top-0 z-40 border-b border-[#ececf1] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link href="/student" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_4px_12px_rgba(99,102,241,.35)]">
              <Brain className="h-5 w-5 text-white" />
            </span>
            <span className="bg-gradient-to-br from-indigo-500 to-violet-500 bg-clip-text text-lg font-black tracking-tight text-transparent sm:text-xl">
              LingoPro
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/student"
              className="hidden items-center gap-1.5 rounded-[11px] px-3 py-2 text-sm font-bold text-[#525a68] transition-colors hover:bg-muted sm:inline-flex"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/student/profile"
              className="inline-flex items-center gap-1.5 rounded-[11px] bg-[#eef0ff] px-3.5 py-2 text-sm font-extrabold text-[#4f46e5] transition-colors hover:bg-[#e0e4ff]"
            >
              <KeyRound className="h-4 w-4" />
              Lấy token
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:py-14">
        <div className="min-w-0 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e0e4ff] bg-[#eef0ff] px-3.5 py-1.5 text-xs font-extrabold text-[#4f46e5]">
            <MonitorDown className="h-3.5 w-3.5" />
            Windows Desktop · v{DESKTOP_VERSION}
          </div>

          <div className="space-y-3">
            <h1 className="max-w-xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[2.5rem]">
              Tra từ trên mọi app Windows — lưu thẳng vào kho LingoPro
            </h1>
            <p className="max-w-lg text-base leading-7 text-[#525a68] sm:text-lg">
              Double-click hoặc hotkey. Nghĩa Việt + IPA, lưu 1 chạm vào lịch ôn FSRS.
              Đồng bộ cùng tài khoản web.
            </p>
          </div>

          <div
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
            data-onboarding="download-setup"
          >
            <a
              href={DESKTOP_SETUP_URL}
              className="inline-flex items-center justify-center gap-2 rounded-[11px] bg-[#4f46e5] px-6 py-3.5 text-base font-black text-white shadow-[0_10px_28px_rgba(79,70,229,0.28)] transition hover:bg-[#4338ca] active:scale-[0.99]"
            >
              <ArrowDownToLine className="h-5 w-5" />
              Tải Setup.exe
            </a>
            <a
              href="#install"
              className="inline-flex items-center justify-center gap-2 rounded-[11px] border border-[#ececf1] bg-white px-6 py-3.5 text-base font-black text-[#525a68] transition hover:bg-muted"
            >
              Hướng dẫn cài
            </a>
          </div>

          <p className="text-xs font-bold text-[#8b93a1]">
            Windows 10/11 x64 · {DESKTOP_SIZE_LABEL} · v{DESKTOP_VERSION}
            <span className="mx-1.5 text-[#c5cad3]">·</span>
            <a href={DESKTOP_ZIP_URL} className="text-[#4f46e5] underline-offset-2 hover:underline">
              Tải bản .zip
            </a>
          </p>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {[
              'Không cần mở browser',
              'Pet nhắc từ đến hạn',
              'Đồng bộ tài khoản web',
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-2 rounded-[11px] border border-[#ececf1] bg-white p-3 text-sm font-bold text-[#525a68] shadow-sm"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4f46e5]" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="overflow-hidden rounded-2xl border border-[#ececf1] bg-white p-2.5 shadow-[0_16px_48px_rgba(15,23,42,0.08)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/downloads/desktop/main-panel-vi.png"
              alt="Bảng chính LingoPro Desktop — tra nhanh tiếng Việt"
              className="aspect-[16/10] w-full rounded-xl bg-[#0f172a] object-contain"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="overflow-hidden rounded-xl border border-[#ececf1] bg-white p-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/downloads/desktop/pet-bubble.png"
                alt="Pet bubble nhắc ôn"
                className="aspect-square w-full rounded-lg bg-[#f8fafc] object-contain"
              />
            </div>
            <div className="overflow-hidden rounded-xl border border-[#ececf1] bg-white p-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/downloads/desktop/settings-language-vi.png"
                alt="Cài đặt và token tiếng Việt"
                className="aspect-square w-full rounded-lg bg-[#f8fafc] object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl border border-[#ececf1] bg-white p-5 shadow-sm"
            >
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px]"
                style={{ background: f.tile, color: f.color }}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-black text-slate-950">{f.title}</h2>
              <p className="mt-1.5 text-sm leading-6 text-[#525a68]">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Install */}
      <section id="install" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-12 sm:px-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Cài đặt trong 3 bước
            </h2>
            <p className="mt-1 text-sm font-semibold text-[#8b93a1]">
              Win 10/11 x64 · ~100 MB trống · NSIS Setup
            </p>
          </div>
          <a
            href={DESKTOP_SETUP_URL}
            className="inline-flex items-center gap-2 self-start rounded-[11px] bg-[#4f46e5] px-4 py-2.5 text-sm font-black text-white hover:bg-[#4338ca] sm:self-auto"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Tải Setup.exe
          </a>
        </div>

        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <div className="mb-1 flex items-center gap-2 font-black">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            SmartScreen
          </div>
          Bản hiện tại chưa code-sign. Nếu Windows chặn: bấm <strong>More info</strong>, rồi{' '}
          <strong>Run anyway</strong>. File chính thức từ GitHub release LingoPro.
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {installSteps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-2xl border border-[#ececf1] bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#eef0ff] text-sm font-black text-[#4f46e5]">
                  {index + 1}
                </span>
                <h3 className="font-black text-slate-950">{step.title}</h3>
              </div>
              <p className="text-sm leading-6 text-[#525a68]">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Token + safety */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#ececf1] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-950">
              <KeyRound className="h-5 w-5 text-[#4f46e5]" />
              Lấy token kết nối
            </h2>
            <ol className="space-y-2 text-sm font-semibold leading-6 text-[#525a68]">
              <li className="flex gap-2">
                <span className="font-black text-[#4f46e5]">1.</span>
                Mở web LingoPro → Hồ sơ (đã đăng nhập).
              </li>
              <li className="flex gap-2">
                <span className="font-black text-[#4f46e5]">2.</span>
                Sao chép token dạng <code className="rounded bg-muted px-1.5 py-0.5 text-xs">lpext_…</code>
              </li>
              <li className="flex gap-2">
                <span className="font-black text-[#4f46e5]">3.</span>
                Trong app Desktop → Settings → dán token → Lưu.
              </li>
            </ol>
            <Link
              href="/student/profile"
              className="mt-4 inline-flex items-center gap-2 rounded-[11px] bg-[#eef0ff] px-4 py-2.5 text-sm font-extrabold text-[#4f46e5] hover:bg-[#e0e4ff]"
            >
              Mở Hồ sơ lấy token
              <ExternalLink className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-xs font-semibold text-[#8b93a1]">
              Chưa đăng nhập?{' '}
              <Link href="/auth" className="text-[#4f46e5] underline-offset-2 hover:underline">
                Đăng nhập / đăng ký
              </Link>
            </p>
          </div>

          <div className="rounded-2xl border border-[#ececf1] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-950">
              <ShieldCheck className="h-5 w-5 text-[#4f46e5]" />
              Tải chính thức
            </h2>
            <p className="text-sm leading-6 text-[#525a68]">
              File cài đặt phát hành trên GitHub Releases của LingoPro. Ưu tiên Setup.exe;
              bản .zip nếu cần mang đi / chia sẻ offline.
            </p>
            <ul className="mt-4 space-y-2 text-sm font-bold text-[#525a68]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#4f46e5]" />
                {DESKTOP_SETUP_FILE}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#4f46e5]" />
                {DESKTOP_ZIP_FILE}
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={DESKTOP_SETUP_URL}
                className="inline-flex items-center gap-2 rounded-[11px] bg-[#4f46e5] px-4 py-2.5 text-sm font-black text-white hover:bg-[#4338ca]"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Setup.exe
              </a>
              <a
                href={DESKTOP_ZIP_URL}
                className="inline-flex items-center gap-2 rounded-[11px] border border-[#ececf1] bg-white px-4 py-2.5 text-sm font-black text-[#525a68] hover:bg-muted"
              >
                .zip
              </a>
              <a
                href={DESKTOP_RELEASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[11px] px-4 py-2.5 text-sm font-bold text-[#4f46e5] hover:bg-[#eef0ff]"
              >
                GitHub release
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
