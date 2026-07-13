import type { Metadata } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';
import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowRight,
  Bell,
  Brain,
  Check,
  Chrome,
  GraduationCap,
  MessageSquare,
  Repeat2,
  Sparkles,
  Star,
  Target,
  X,
  Zap,
} from 'lucide-react';
import {
  GROUP_SEAT_PRICE,
  PLAN_ANNUAL_PRICES,
  PLAN_LABELS,
  PLAN_PRICES,
  formatVND,
} from '@/lib/billing';
import AuthRedirectGate from './_components/AuthRedirectGate';
import DictionaryDemo from './_components/DictionaryDemo';

const manrope = Manrope({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

/** Keyword focus: học từ vựng · tra từ · FSRS · flashcard · nhớ lâu */
const SITE_URL = 'https://lingopro.online';

const VOCAB_STATS = {
  words: '9.000+',
  packs: '660+',
  routes: '30+',
} as const;

const STEPS = [
  {
    n: '01',
    icon: Chrome,
    title: 'Tra từ 1 chạm',
    text: 'Bôi đen trên web — nghĩa Việt, IPA, ví dụ hiện ngay.',
  },
  {
    n: '02',
    icon: Sparkles,
    title: 'Lưu vào kho riêng',
    text: 'Ảnh + ví dụ sẵn. Không gõ thẻ thủ công.',
  },
  {
    n: '03',
    icon: Repeat2,
    title: 'Ôn đúng lúc quên',
    text: 'FSRS nhắc trước khi bạn quên — 5–8 phút/chặng.',
  },
] as const;

const ROUTES = [
  {
    icon: GraduationCap,
    title: 'Từ vựng THPT',
    desc: 'Bám chương trình trên lớp.',
  },
  {
    icon: Target,
    title: 'TOEIC · IELTS',
    desc: 'Chia theo band, học gọn.',
  },
  {
    icon: MessageSquare,
    title: 'Giao tiếp hằng ngày',
    desc: 'Cụm từ dùng được ngay.',
  },
] as const;

const COMPARE_ROWS = [
  { label: 'Bắt đầu', lingo: 'Mở web là học', anki: 'Cài app, tự tìm deck', win: true },
  { label: 'Nội dung', lingo: '9.000+ từ Việt hóa', anki: 'Deck rời, chất lượng lệch', win: true },
  { label: 'Tra & lưu', lingo: '1 chạm + AI', anki: 'Tự gõ thẻ', win: true },
  { label: 'Nhắc ôn', lingo: 'Đúng giờ quên', anki: 'Tự nhớ mở app', win: true },
] as const;

const TESTIMONIALS = [
  {
    name: 'Nguyễn Linh',
    role: 'Gia sư · TP.HCM',
    initials: 'NL',
    text: 'Bớt vài giờ/tuần — không còn tự dựng flashcard từ đầu.',
  },
  {
    name: 'Trần Minh',
    role: 'IELTS',
    initials: 'TM',
    text: 'Nhắc ôn đúng lúc. Học xong không còn quên sạch sau vài ngày.',
  },
  {
    name: 'Ms. Phương',
    role: 'GV THPT · Hà Nội',
    initials: 'MP',
    text: 'Học sinh vào được ngay: tiếng Việt sẵn, lộ trình rõ, ít gây sợ.',
  },
] as const;

const FAQS = [
  {
    q: 'LingoPro học từ vựng bằng cách nào?',
    a: 'Tra từ trên web, lưu vào kho, rồi ôn lại theo lịch FSRS (spaced repetition) — mỗi chặng khoảng 5–8 phút.',
  },
  {
    q: 'Có miễn phí không?',
    a: 'Có gói Free: flashcard FSRS, lưu 200 từ mới/tháng, lộ trình sẵn và tra từ AI 5 lượt/ngày. Nâng Pro khi cần không giới hạn.',
  },
  {
    q: 'LingoPro khác Anki ở điểm nào?',
    a: 'LingoPro có sẵn lộ trình Việt hóa, tra–lưu 1 chạm và nhắc ôn. Anki mạnh hơn nếu bạn thích tự dựng toàn bộ hệ thống.',
  },
  {
    q: 'Có cần cài app không?',
    a: 'Học ngay trên web. Có thêm app Desktop và Chrome Extension để tra từ khi đọc trang.',
  },
] as const;

export const metadata: Metadata = {
  title: 'LingoPro — Học từ vựng tiếng Anh, tra từ 1 chạm, nhớ lâu với FSRS',
  description:
    'App học từ vựng cho người Việt: tra từ trên web, flashcard FSRS, lộ trình THPT · TOEIC · IELTS. Miễn phí bắt đầu — 5–8 phút/ngày.',
  keywords: [
    'học từ vựng',
    'học từ vựng tiếng Anh',
    'tra từ tiếng Anh',
    'flashcard FSRS',
    'spaced repetition',
    'ôn từ vựng',
    'từ vựng TOEIC',
    'từ vựng IELTS',
    'từ vựng THPT',
    'Anki tiếng Việt',
    'LingoPro',
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'LingoPro — Học từ vựng, tra từ 1 chạm, nhớ lâu hơn',
    description:
      'Tra từ trên web · flashcard FSRS · lộ trình sẵn cho người Việt. Bắt đầu miễn phí.',
    type: 'website',
    locale: 'vi_VN',
    siteName: 'LingoPro',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LingoPro — Học từ vựng tiếng Anh nhớ lâu hơn',
    description: 'Tra từ 1 chạm, ôn đúng lúc bằng FSRS. Miễn phí bắt đầu.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'LingoPro',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web, Windows',
      url: SITE_URL,
      description:
        'App học từ vựng tiếng Anh: tra từ 1 chạm, flashcard FSRS, lộ trình THPT · TOEIC · IELTS cho người Việt.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'VND',
        description: 'Gói Free — nâng Pro tùy chọn',
      },
      inLanguage: 'vi',
    },
    {
      '@type': 'WebSite',
      name: 'LingoPro',
      url: SITE_URL,
      inLanguage: 'vi-VN',
      description: 'Học từ vựng tiếng Anh với tra từ 1 chạm và flashcard FSRS.',
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    },
  ],
};

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#b86f52]/20 bg-white/80 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#9f4d2f]">
      <Sparkles className="h-3 w-3" />
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className={`${manrope.className} min-h-dvh bg-[#f6efe6] text-[#241710]`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AuthRedirectGate />

      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-[-8%] top-[-10%] h-[24rem] w-[24rem] rounded-full bg-[#e57b52]/18 blur-3xl" />
        <div className="absolute right-[-8%] top-[8%] h-[26rem] w-[26rem] rounded-full bg-[#d2c09e]/30 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#bca58f]/30 bg-[#f6efe6]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 text-[#241710]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#241710] text-[#f6efe6]">
              <Brain className="h-4 w-4" />
            </div>
            <span className={`${spaceGrotesk.className} text-lg font-bold tracking-tight`}>LingoPro</span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-bold text-[#6d574a] md:flex" aria-label="Điều hướng chính">
            <a href="#cach-hoc" className="hover:text-[#241710]">Cách học</a>
            <a href="#demo" className="hover:text-[#241710]">Thử tra từ</a>
            <a href="#bang-gia" className="hover:text-[#241710]">Giá</a>
            <a href="#faq" className="hover:text-[#241710]">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/download"
              className="hidden items-center gap-1.5 rounded-full border border-[#b5502f]/25 bg-white/80 px-3 py-2 text-xs font-black text-[#b5502f] sm:inline-flex"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              Desktop
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#241710] px-4 py-2.5 text-sm font-black text-[#f6efe6] transition-transform hover:-translate-y-0.5"
            >
              Dùng miễn phí
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* ── HERO ── */}
        <section className="px-4 pb-12 pt-10 sm:px-6 sm:pt-14 sm:pb-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-6">
              <SectionTag>App học từ vựng · FSRS</SectionTag>

              <h1
                className={`${spaceGrotesk.className} max-w-xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-[#241710] sm:text-5xl lg:text-[3.25rem]`}
              >
                Học từ vựng tiếng Anh —{' '}
                <span className="text-[#b5502f]">tra 1 chạm, nhớ lâu hơn</span>
              </h1>

              <p className="max-w-lg text-lg leading-7 text-[#5e4b40]">
                Tra từ trên web → lưu kho riêng → ôn đúng lúc bằng FSRS.
                Chặng ngắn 5–8 phút, lộ trình sẵn cho người Việt.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#b5502f] px-7 py-3.5 text-base font-black text-white shadow-[0_14px_36px_rgba(181,80,47,0.28)] transition-all hover:-translate-y-0.5"
                >
                  Bắt đầu miễn phí
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#bca58f] bg-white/80 px-7 py-3.5 text-base font-black text-[#241710] hover:bg-white"
                >
                  Thử tra một từ
                </a>
              </div>

              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#7b6558]">
                {['Miễn phí bắt đầu', '5–8 phút/chặng', 'Lộ trình sẵn'].map((t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-[#2d7f5e]" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Compact product card */}
            <div className="rounded-[1.75rem] border border-[#bca58f]/35 bg-[#241710] p-5 text-[#f6efe6] shadow-[0_24px_70px_rgba(36,23,16,0.22)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className={`${spaceGrotesk.className} text-xl font-bold`}>3 bước nhớ từ</p>
                <span className="rounded-full bg-[#d7bb76] px-2.5 py-0.5 text-[11px] font-black text-[#241710]">
                  FSRS
                </span>
              </div>
              <ol className="space-y-3">
                {STEPS.map((s) => (
                  <li
                    key={s.n}
                    className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6efe6] text-[#241710]">
                      <s.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black tracking-widest text-[#cbb7a6]">{s.n}</span>
                        <span className="text-sm font-black sm:text-base">{s.title}</span>
                      </div>
                      <p className="mt-0.5 text-sm leading-5 text-[#d8c9bc]">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { v: VOCAB_STATS.words, l: 'từ' },
                  { v: VOCAB_STATS.packs, l: 'chặng' },
                  { v: VOCAB_STATS.routes, l: 'lộ trình' },
                ].map((x) => (
                  <div key={x.l} className="rounded-xl bg-[#f6efe6] py-3 text-center text-[#241710]">
                    <div className={`${spaceGrotesk.className} text-xl font-bold sm:text-2xl`}>{x.v}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#7b6558]">{x.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── DEMO (conversion anchor) ── */}
        <section id="demo" className="border-y border-[#d7c7b6]/70 bg-[#fffaf5] px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="space-y-4">
              <SectionTag>Thử ngay</SectionTag>
              <h2 className={`${spaceGrotesk.className} text-3xl font-bold tracking-tight text-[#241710] sm:text-4xl`}>
                Tra thử một từ — <span className="text-[#b5502f]">không cần tài khoản</span>
              </h2>
              <p className="max-w-md text-base leading-7 text-[#5e4b40]">
                Xem nghĩa Việt, IPA, ví dụ. Đăng ký chỉ khi muốn lưu và ôn FSRS.
              </p>
              <ul className="space-y-2 text-sm font-semibold text-[#5e4b40]">
                {[
                  'Kho từ + nguồn ngoài',
                  'Web & extension cùng một kho',
                  'Biết có hợp mình trong 30 giây',
                ].map((line) => (
                  <li key={line} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#b5502f]" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1.75rem] border border-[#d7c7b6] bg-white p-4 shadow-[0_20px_55px_rgba(95,69,52,0.10)] sm:p-5">
              <DictionaryDemo />
            </div>
          </div>
        </section>

        {/* ── HOW + ROUTES ── */}
        <section id="cach-hoc" className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <SectionTag>Cách học</SectionTag>
              <h2 className={`${spaceGrotesk.className} mt-4 text-3xl font-bold tracking-tight text-[#241710] sm:text-4xl`}>
                Ít phút mỗi ngày — <span className="text-[#b5502f]">nhớ dai hơn sau nhiều tuần</span>
              </h2>
              <p className="mt-3 text-base leading-7 text-[#5e4b40]">
                Không nhồi từ. Mỗi từ có lịch ôn riêng; hệ thống nhắc, bạn chỉ cần mở và làm chặng.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {STEPS.map((s) => (
                <article
                  key={s.n}
                  className="rounded-3xl border border-[#d7c7b6]/80 bg-white/80 p-5 shadow-[0_12px_36px_rgba(95,69,52,0.06)]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#241710] text-[#f6efe6]">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-black text-[#241710]">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#5e4b40]">{s.text}</p>
                </article>
              ))}
            </div>

            {/* Video + routes */}
            <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:items-stretch">
              <div className="overflow-hidden rounded-[1.75rem] border border-[#bca58f]/35 bg-[#241710] p-3 shadow-[0_20px_60px_rgba(36,23,16,0.18)]">
                <video
                  className="aspect-video w-full rounded-2xl object-cover"
                  src="/extension-lookup.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label="Demo tra từ trên web với LingoPro"
                />
                <p className="px-3 py-3 text-sm font-semibold text-[#d8c9bc]">
                  Tra từ đúng lúc đang đọc — lưu trước khi lướt mất.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className={`${spaceGrotesk.className} text-2xl font-bold text-[#241710]`}>
                  Lộ trình học từ vựng sẵn
                </h3>
                <p className="text-sm leading-6 text-[#5e4b40]">
                  Mở vào là học — không tự gom bộ từ.
                </p>
                {ROUTES.map((r) => (
                  <div
                    key={r.title}
                    className="flex items-center gap-3 rounded-2xl border border-[#d7c7b6]/80 bg-white/80 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2dfd4] text-[#9f4d2f]">
                      <r.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-black text-[#241710]">{r.title}</div>
                      <div className="text-sm text-[#5e4b40]">{r.desc}</div>
                    </div>
                  </div>
                ))}
                <div className="mt-auto grid grid-cols-3 gap-2 rounded-2xl border border-[#d7c7b6]/60 bg-[#fffaf5] p-3 text-center">
                  {[
                    { v: VOCAB_STATS.words, l: 'từ' },
                    { v: VOCAB_STATS.packs, l: 'chặng' },
                    { v: VOCAB_STATS.routes, l: 'lộ trình' },
                  ].map((x) => (
                    <div key={x.l}>
                      <div className={`${spaceGrotesk.className} text-xl font-bold`}>{x.v}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#7b6558]">{x.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMPARE ── */}
        <section className="border-y border-[#d7c7b6]/70 bg-[#fffaf5] px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <SectionTag>LingoPro vs Anki</SectionTag>
              <h2 className={`${spaceGrotesk.className} mt-4 text-3xl font-bold tracking-tight text-[#241710] sm:text-4xl`}>
                Muốn học ngay — <span className="text-[#b5502f]">không tự dựng hệ thống</span>
              </h2>
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-[#d7c7b6] bg-white shadow-sm md:block">
              <div className="grid grid-cols-3 bg-[#241710] text-sm font-black text-[#f6efe6]">
                <div className="p-3.5">Tiêu chí</div>
                <div className="p-3.5 text-[#f1c46d]">LingoPro</div>
                <div className="p-3.5 text-[#d5c1b4]">Anki</div>
              </div>
              {COMPARE_ROWS.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-[#fff9f3]'}`}
                >
                  <div className="border-t border-[#eadfd0] p-3.5 font-black">{row.label}</div>
                  <div className="border-t border-[#eadfd0] bg-[#f9eee8]/70 p-3.5 font-semibold text-[#4f3f35]">
                    <span className="inline-flex items-start gap-1.5">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2d7f5e]" />
                      {row.lingo}
                    </span>
                  </div>
                  <div className="border-t border-[#eadfd0] p-3.5 text-[#6d574a]">
                    <span className="inline-flex items-start gap-1.5">
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b5502f]/70" />
                      {row.anki}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:hidden">
              {COMPARE_ROWS.map((row) => (
                <div key={row.label} className="rounded-2xl border border-[#d7c7b6] bg-white p-4">
                  <div className="text-sm font-black">{row.label}</div>
                  <div className="mt-2 space-y-1.5 text-sm">
                    <div className="flex gap-2 rounded-lg bg-[#f9eee8] px-2.5 py-2 font-semibold">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2d7f5e]" />
                      <span><span className="text-[#9f4d2f]">LingoPro · </span>{row.lingo}</span>
                    </div>
                    <div className="flex gap-2 rounded-lg bg-[#f4f1ed] px-2.5 py-2 text-[#6d574a]">
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b5502f]/70" />
                      <span><span className="font-bold">Anki · </span>{row.anki}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF ── */}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center">
              <SectionTag>Người dùng</SectionTag>
              <h2 className={`${spaceGrotesk.className} mt-4 text-3xl font-bold tracking-tight text-[#241710] sm:text-4xl`}>
                Dễ quay lại mỗi ngày
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <blockquote
                  key={t.name}
                  className="flex flex-col rounded-3xl border border-[#d7c7b6]/80 bg-white p-5 shadow-[0_12px_36px_rgba(95,69,52,0.06)]"
                >
                  <div className="flex gap-0.5 text-[#d39b29]" aria-label="5 sao">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="mt-3 flex-1 text-[15px] leading-7 text-[#4f3f35]">“{t.text}”</p>
                  <footer className="mt-4 flex items-center gap-2.5 border-t border-[#eadfd0] pt-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#241710] text-xs font-black text-[#f6efe6]">
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-sm font-black text-[#241710]">{t.name}</div>
                      <div className="text-xs font-semibold text-[#7b6558]">{t.role}</div>
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="bang-gia" className="border-y border-[#d7c7b6]/70 bg-[#fffaf5] px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <SectionTag>Bảng giá</SectionTag>
              <h2 className={`${spaceGrotesk.className} mt-4 text-3xl font-bold tracking-tight text-[#241710] sm:text-4xl`}>
                Miễn phí bắt đầu · <span className="text-[#b5502f]">Pro hoặc gói nhóm</span>
              </h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="rounded-[1.75rem] border border-[#d7c7b6] bg-white p-6 sm:p-7">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-[#7b6558]">{PLAN_LABELS.free}</div>
                <div className={`${spaceGrotesk.className} mt-2 text-4xl font-bold`}>0₫</div>
                <p className="mt-1 text-sm font-semibold text-[#7b6558]">Tra · lưu · ôn FSRS cơ bản</p>
                <ul className="mt-6 space-y-2.5 text-sm font-semibold text-[#4f3f35]">
                  {[
                    'Flashcard FSRS',
                    'Lưu 200 từ mới/tháng',
                    'Lộ trình từ vựng sẵn',
                    'Tra từ AI: 5 lượt/ngày',
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2d7f5e]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth"
                  className="mt-7 inline-flex w-full items-center justify-center rounded-full border border-[#d7c7b6] bg-[#fffaf5] py-3 text-sm font-black hover:bg-white"
                >
                  Dùng thử miễn phí
                </Link>
              </div>

              <div className="relative overflow-hidden rounded-[1.75rem] border border-[#b5502f]/25 bg-[#241710] p-6 text-[#f6efe6] sm:p-7">
                <div className="absolute right-[-2rem] top-[-2rem] h-32 w-32 rounded-full bg-[#b5502f]/20 blur-3xl" />
                <div className="relative">
                  <span className="inline-flex rounded-full bg-[#d7bb76] px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#241710]">
                    Phổ biến
                  </span>
                  <div className="mt-3">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-[#cbb7a6]">{PLAN_LABELS.pro}</div>
                    <div className={`${spaceGrotesk.className} mt-1 text-4xl font-bold`}>
                      {formatVND(PLAN_PRICES.pro)}
                      <span className="ml-1 text-sm font-semibold text-[#cbb7a6]">/tháng</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#d8c9bc]">
                      hoặc <span className="font-black text-white">{formatVND(PLAN_ANNUAL_PRICES.pro)}/năm</span>
                    </div>
                  </div>
                  <ul className="mt-6 space-y-2 text-sm font-semibold">
                    {[
                      'Tra AI không giới hạn',
                      'Luyện nói & viết AI',
                      'Quiz · điền từ đầy đủ',
                      'Báo cáo & leaderboard',
                    ].map((item) => (
                      <li key={item} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d7bb76]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/upgrade"
                    className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#b5502f] py-3.5 text-sm font-black text-white shadow-[0_12px_32px_rgba(181,80,47,0.3)] hover:-translate-y-0.5"
                  >
                    Nâng cấp Pro
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-[#d7c7b6] bg-white p-6 sm:p-7">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-[#7b6558]">Nhóm</div>
                <div className={`${spaceGrotesk.className} mt-2 text-3xl font-bold tracking-tight`}>
                  từ {formatVND(GROUP_SEAT_PRICE)}
                  <span className="ml-1 text-sm font-semibold text-[#7b6558]">/ghế/tháng</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-[#7b6558]">Gia sư · nhóm học · 2–20 ghế</p>
                <ul className="mt-6 space-y-2.5 text-sm font-semibold text-[#4f3f35]">
                  {[
                    'Mỗi ghế = quyền Pro',
                    'Giá giảm khi mua nhiều ghế',
                    'Mời bằng mã nhóm',
                    'Thanh toán 1 lần cho cả nhóm',
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2d7f5e]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/upgrade"
                  className="mt-7 inline-flex w-full items-center justify-center rounded-full border border-[#d7c7b6] bg-[#fffaf5] py-3 text-sm font-black hover:bg-white"
                >
                  Xem gói nhóm
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ (SEO) ── */}
        <section id="faq" className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <SectionTag>FAQ</SectionTag>
              <h2 className={`${spaceGrotesk.className} mt-4 text-3xl font-bold tracking-tight text-[#241710] sm:text-4xl`}>
                Câu hỏi thường gặp
              </h2>
            </div>
            <div className="space-y-3">
              {FAQS.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-[#d7c7b6]/80 bg-white px-5 py-4 open:shadow-[0_12px_32px_rgba(95,69,52,0.08)]"
                >
                  <summary className="cursor-pointer list-none text-base font-black text-[#241710] marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {item.q}
                      <span className="shrink-0 text-[#b5502f] transition-transform group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-[#5e4b40]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="px-4 pb-24 sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 overflow-hidden rounded-[1.75rem] bg-[#241710] px-6 py-9 text-[#f6efe6] sm:flex-row sm:items-center sm:justify-between sm:px-9">
            <div className="max-w-xl">
              <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#d7bb76]">
                <Zap className="h-3.5 w-3.5" />
                Bắt đầu hôm nay
              </div>
              <h2 className={`${spaceGrotesk.className} text-2xl font-bold tracking-tight sm:text-3xl`}>
                Một từ lạ đầu tiên là đủ để bắt đầu.
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#d8c9bc]">
                Không cài phức tạp · Miễn phí ngay · 5–8 phút/chặng.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f6efe6] px-6 py-3 text-sm font-black text-[#241710] hover:bg-white"
              >
                Tạo tài khoản
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/for-teachers"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-black hover:bg-white/5"
              >
                Cho giáo viên
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d7c7b6]/70 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 text-sm text-[#6d574a] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#241710] text-[#f6efe6]">
              <Brain className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className={`${spaceGrotesk.className} font-bold text-[#241710]`}>LingoPro</div>
              <p className="text-xs">Học từ vựng · tra từ · FSRS</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 font-semibold" aria-label="Footer">
            <Link href="/download" className="hover:text-[#241710]">Desktop</Link>
            <Link href="/for-teachers" className="hover:text-[#241710]">Giáo viên</Link>
            <Link href="/auth" className="hover:text-[#241710]">Đăng nhập</Link>
            <Link href="/privacy" className="hover:text-[#241710]">Bảo mật</Link>
            <Link href="/terms" className="hover:text-[#241710]">Điều khoản</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
