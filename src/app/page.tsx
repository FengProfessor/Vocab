import type { Metadata } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';
import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowRight,
  Bell,
  BookOpen,
  Brain,
  Check,
  Chrome,
  Clock3,
  GraduationCap,
  Library,
  MessageSquare,
  Repeat2,
  Sparkles,
  Star,
  Target,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import {
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

const VOCAB_STATS = {
  words: '9.000+',
  packs: '660+',
  routes: '30+',
} as const;

const HERO_POINTS = [
  'Bôi đen từ lạ trên web rồi lưu ngay vào kho riêng.',
  'Hiện sẵn nghĩa Việt, IPA, ví dụ và ảnh minh họa.',
  'Ôn đúng lúc bằng FSRS để nhớ lâu hơn.',
] as const;

const STUDY_LOOP = [
  {
    title: 'Tra từ ngay trên trang đang đọc',
    description: 'Không phải mở thêm tab hay chép nghĩa bằng tay.',
    icon: Chrome,
  },
  {
    title: 'Làm giàu từ chỉ sau một chạm',
    description: 'Nghĩa Việt, IPA, ví dụ và ảnh hiện sẵn để học tiếp.',
    icon: Sparkles,
  },
  {
    title: 'Ôn lại trước khi quên',
    description: 'FSRS v5 tính lịch ôn riêng cho từng từ của từng người học.',
    icon: Repeat2,
  },
] as const;

const VOCAB_ROUTES = [
  {
    icon: GraduationCap,
    title: 'Theo chương trình THPT',
    desc: 'Bám sát bài học trên lớp, học đúng từ thầy cô đang dạy.',
  },
  {
    icon: Target,
    title: 'Luyện TOEIC và IELTS',
    desc: 'Chia nhỏ theo band điểm để học gọn, không bị ngợp.',
  },
  {
    icon: MessageSquare,
    title: 'Giao tiếp và đời sống',
    desc: 'Từ và cụm từ sát tình huống thật, dùng được ngay khi nói.',
  },
] as const;

const COMPARE_ROWS: ReadonlyArray<{
  label: string;
  lingo: string;
  anki: string;
  lingoWin: boolean;
}> = [
  { label: 'Bắt đầu học', lingo: 'Mở web là học ngay', anki: 'Cài app, tự tìm deck, tự chỉnh từng bước', lingoWin: true },
  { label: 'Nội dung sẵn có', lingo: '9.000+ từ theo lộ trình Việt hóa', anki: 'Deck rời rạc, chất lượng phụ thuộc người tạo', lingoWin: true },
  { label: 'Tra và lưu từ', lingo: 'Tra 3 nguồn + AI, lưu 1 chạm', anki: 'Phải tự gõ nội dung vào thẻ', lingoWin: true },
  { label: 'Nhắc ôn', lingo: 'Có nhắc đúng giờ, đúng nhịp quên', anki: 'Phải tự nhớ mở app', lingoWin: true },
  { label: 'Tuỳ biến sâu', lingo: 'Tập trung trải nghiệm học nhanh', anki: 'Mạnh cho người thích tự dựng hệ thống', lingoWin: false },
];

const TESTIMONIALS = [
  {
    name: 'Nguyễn Linh',
    role: 'Gia sư tiếng Anh, TP.HCM',
    text: 'Mình đỡ mất vài giờ mỗi tuần vì không còn phải tự dựng flashcard cho học sinh từ đầu.',
  },
  {
    name: 'Trần Minh',
    role: 'IELTS learner',
    text: 'Điểm mạnh nhất là nhắc ôn đúng lúc. Mình không còn học xong rồi quên sạch sau vài ngày.',
  },
  {
    name: 'Ms. Phương',
    role: 'Giáo viên THPT, Hà Nội',
    text: 'Học sinh dùng dễ hơn Anki vì có sẵn tiếng Việt, lộ trình và giao diện ít gây sợ.',
  },
] as const;

export const metadata: Metadata = {
  title: 'LingoPro | Tra từ 1 chạm, nhớ lâu hơn với FSRS',
  description:
    'Tra từ ngay trên web, lưu vào kho từ riêng, rồi ôn lại bằng FSRS v5. LingoPro dành cho học sinh và giáo viên muốn học nhanh nhưng nhớ lâu.',
  openGraph: {
    title: 'LingoPro | Học từ vựng bớt rối, nhớ lâu hơn',
    description:
      'Tra từ 1 chạm, hiện sẵn nghĩa Việt và ví dụ, rồi ôn đúng lúc bằng FSRS. Dành cho học sinh Việt muốn học gọn mà nhớ lâu.',
    type: 'website',
    locale: 'vi_VN',
    siteName: 'LingoPro',
  },
};

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#b86f52]/20 bg-white/70 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.22em] text-[#9f4d2f] shadow-[0_10px_30px_rgba(143,83,53,0.08)]">
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className={`${manrope.className} min-h-dvh bg-[#f6efe6] text-[#241710]`}>
      <AuthRedirectGate />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[-10%] h-[28rem] w-[28rem] rounded-full bg-[#e57b52]/20 blur-3xl" />
        <div className="absolute right-[-10%] top-[10%] h-[30rem] w-[30rem] rounded-full bg-[#d2c09e]/35 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[30%] h-[26rem] w-[26rem] rounded-full bg-[#6a8d7b]/18 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-[#bca58f]/30 bg-[#f6efe6]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 text-[#241710]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#241710] text-[#f6efe6] shadow-[0_14px_35px_rgba(36,23,16,0.18)]">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <div className={`${spaceGrotesk.className} text-lg font-bold tracking-tight`}>LingoPro</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#7b6558]">Hệ học từ vựng</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-6 text-sm font-bold text-[#6d574a] lg:flex">
              <a href="#demo" className="transition-colors hover:text-[#241710]">Demo</a>
              <a href="#routes" className="transition-colors hover:text-[#241710]">Lộ trình</a>
              <a href="#method" className="transition-colors hover:text-[#241710]">Phương pháp</a>
              <a href="#pricing" className="transition-colors hover:text-[#241710]">Giá</a>
            </nav>
            <Link
              href="/download"
              className="hidden items-center gap-2 rounded-full border border-[#b5502f]/25 bg-white/80 px-4 py-2.5 text-sm font-black text-[#b5502f] shadow-[0_10px_28px_rgba(181,80,47,0.12)] transition-transform hover:-translate-y-0.5 sm:inline-flex"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Tải Desktop
            </Link>
            <Link href="/for-teachers" className="hidden text-sm font-bold text-[#6d574a] transition-colors hover:text-[#241710] sm:block">
              Giáo viên
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-[#241710] px-5 py-3 text-sm font-black text-[#f6efe6] transition-transform hover:-translate-y-0.5"
            >
              Bắt đầu miễn phí
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div className="space-y-8">
              <SectionTag>Tra từ 1 chạm, học tới nơi</SectionTag>

              <div className="space-y-5">
                <h1 className={`${spaceGrotesk.className} max-w-4xl text-5xl font-bold leading-[0.94] tracking-[-0.06em] text-[#241710] sm:text-6xl xl:text-7xl`}>
                  Đừng để từ mới
                  {' '}
                  <span className="text-[#b5502f]">lướt qua rồi biến mất</span>.
                  {' '}
                  Biến lần gặp đầu tiên thành lúc bắt đầu nhớ.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[#5e4b40] sm:text-xl">
                  LingoPro nối liền lúc bạn gặp từ lạ với lúc bạn thật sự dùng lại được từ đó:
                  tra ngay trên web, lưu vào kho riêng, rồi ôn đúng nhịp bằng FSRS.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#b5502f] px-7 py-4 text-base font-black text-white shadow-[0_16px_40px_rgba(181,80,47,0.28)] transition-transform hover:-translate-y-0.5"
                >
                  Tạo tài khoản miễn phí
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#bca58f] bg-white/70 px-7 py-4 text-base font-black text-[#241710] transition-colors hover:bg-white"
                >
                  Xem giá và quyền lợi
                </a>
                <Link
                  href="/download"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#b5502f]/30 bg-white px-7 py-4 text-base font-black text-[#b5502f] shadow-[0_14px_34px_rgba(181,80,47,0.12)] transition-transform hover:-translate-y-0.5"
                >
                  <ArrowDownToLine className="h-5 w-5" />
                  Tải app Desktop
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {HERO_POINTS.map((point) => (
                  <div key={point} className="rounded-[1.75rem] border border-white/70 bg-white/70 p-4 text-sm font-semibold leading-6 text-[#5e4b40] shadow-[0_18px_45px_rgba(95,69,52,0.08)]">
                    <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#241710] text-[#f6efe6]">
                      <Check className="h-4 w-4" />
                    </span>
                    {point}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute right-8 top-0 hidden h-28 w-28 rounded-full border border-[#b5502f]/15 bg-[#f4c8ae]/45 blur-2xl lg:block" />

              <div className="overflow-hidden rounded-[2rem] border border-[#bca58f]/35 bg-[#241710] p-5 text-[#f6efe6] shadow-[0_28px_90px_rgba(36,23,16,0.25)]">
                <div className="flex items-start justify-between gap-4 rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-[#cbb7a6]">Vòng học của bạn</p>
                    <h2 className={`${spaceGrotesk.className} mt-2 text-3xl font-bold tracking-tight`}>
                      Từ web thành trí nhớ dài hạn
                    </h2>
                  </div>
                  <div className="rounded-full bg-[#d7bb76] px-3 py-1 text-xs font-black text-[#241710]">
                    5-8 phút/chặng
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  {STUDY_LOOP.map((item, index) => (
                    <div key={item.title} className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f6efe6] text-[#241710]">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-lg font-black">{item.title}</h3>
                            <span className="text-xs font-black uppercase tracking-[0.24em] text-[#cbb7a6]">
                              0{index + 1}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[#d8c9bc]">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {[
                    { value: VOCAB_STATS.words, label: 'từ sẵn có' },
                    { value: VOCAB_STATS.packs, label: 'chặng học' },
                    { value: VOCAB_STATS.routes, label: 'lộ trình' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.35rem] border border-white/10 bg-[#f6efe6] px-4 py-5 text-center text-[#241710]">
                      <div className={`${spaceGrotesk.className} text-3xl font-bold tracking-tight`}>{item.value}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-[#7b6558]">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -bottom-6 -left-3 hidden rounded-[1.5rem] border border-[#bca58f]/40 bg-white px-5 py-4 shadow-[0_18px_50px_rgba(95,69,52,0.12)] md:block">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9f4d2f]">Học đều hơn mỗi tuần</p>
                <p className={`${spaceGrotesk.className} mt-1 text-3xl font-bold tracking-tight text-[#241710]`}>
                  Bớt bỏ dở giữa chừng
                </p>
                <p className="mt-1 text-sm font-semibold text-[#6d574a]">Vì tra, lưu và ôn nằm trong cùng một nhịp học.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-4">
            {[
              { icon: Chrome, title: 'Tra từ ngay trong lúc đọc', text: 'Chạm đúng lúc tò mò nhất, không làm đứt mạch đọc.' },
              { icon: Library, title: 'Có sẵn kho học liệu', text: 'Mở vào là có thứ để học, không phải tự gom từng bộ từ.' },
              { icon: Bell, title: 'Có người nhắc thay bạn', text: 'Đến giờ là học, không chờ nhớ ra mới mở lại.' },
              { icon: Trophy, title: 'Biến tiến bộ thành cảm giác rõ ràng', text: 'Streak, XP và tiến độ làm cho việc học có phản hồi ngay.' },
            ].map((item) => (
              <div key={item.title} className="rounded-[1.9rem] border border-[#d7c7b6] bg-white/70 p-6 shadow-[0_18px_50px_rgba(95,69,52,0.08)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2dfd4] text-[#9f4d2f]">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-black text-[#241710]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5e4b40]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="demo" className="border-y border-[#d7c7b6]/70 bg-[#fffaf5] px-4 py-24 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-6">
              <SectionTag>Thử ngay không cần tài khoản</SectionTag>
              <h2 className={`${spaceGrotesk.className} max-w-xl text-4xl font-bold tracking-[-0.05em] text-[#241710] sm:text-5xl`}>
                Chỉ cần thử một từ
                {' '}
                <span className="text-[#b5502f]">để thấy nó đi xa tới đâu.</span>
              </h2>
              <p className="max-w-xl text-lg leading-8 text-[#5e4b40]">
                Với LingoPro, một từ lạ không dừng ở nghĩa từ điển. Nó được lưu lại, gắn ví dụ,
                thêm hình ảnh và bước vào lịch ôn của riêng bạn.
              </p>
              <div className="grid gap-3">
                {[
                  'Gõ bất kỳ từ nào để xem cách LingoPro giải nghĩa và đặt vào ngữ cảnh.',
                  'Web và extension dùng chung một kho từ, học ở đâu cũng nối tiếp.',
                  'Đây là cách nhanh nhất để biết LingoPro có hợp với bạn hay không.',
                ].map((line) => (
                  <div key={line} className="flex items-start gap-3 rounded-2xl border border-[#eadfd0] bg-white p-4 text-sm font-semibold leading-6 text-[#5e4b40]">
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#b5502f]" />
                    {line}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#d7c7b6] bg-white p-5 shadow-[0_24px_70px_rgba(95,69,52,0.12)]">
              <div className="mb-5 flex items-center justify-between gap-4 rounded-[1.5rem] bg-[#241710] px-5 py-4 text-[#f6efe6]">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.24em] text-[#cbb7a6]">Dùng thử trực tiếp</div>
                  <div className={`${spaceGrotesk.className} text-2xl font-bold tracking-tight`}>Tra từ ngay bây giờ</div>
                </div>
                <div className="rounded-full bg-[#d7bb76] px-3 py-1 text-xs font-black text-[#241710]">
                  Không cần tài khoản
                </div>
              </div>
              <DictionaryDemo />
            </div>
          </div>
        </section>

        <section id="routes" className="px-4 py-24 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="relative overflow-hidden rounded-[2.2rem] border border-[#bca58f]/35 bg-[#241710] p-4 shadow-[0_28px_90px_rgba(36,23,16,0.22)]">
              <video
                className="aspect-video w-full rounded-[1.6rem] object-cover"
                src="/extension-lookup.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Demo tra từ khi đang lướt web bằng LingoPro"
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 text-[#f6efe6]">
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-[#cbb7a6]">Khác biệt lớn nhất</div>
                  <div className="mt-2 text-lg font-black">Thời điểm học là lúc bạn đang tò mò</div>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-[#f6efe6] p-4 text-[#241710]">
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-[#7b6558]">Kết quả</div>
                  <div className="mt-2 text-lg font-black">Tăng cơ hội lưu từ trước khi người học mất hứng</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <SectionTag>Lộ trình dựng sẵn cho người Việt</SectionTag>
              <h2 className={`${spaceGrotesk.className} max-w-2xl text-4xl font-bold tracking-[-0.05em] text-[#241710] sm:text-5xl`}>
                Không chỉ là công cụ tra từ.
                {' '}
                <span className="text-[#b5502f]">Đây là kho học liệu biết chia đường đi.</span>
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-[#5e4b40]">
                Người học yếu nhất không thiếu động lực trước, mà thiếu một nơi bắt đầu đủ rõ.
                LingoPro giải quyết bằng các chặng học ngắn, lộ trình rõ và nghĩa Việt sẵn có.
              </p>

              <div className="grid gap-4">
                {VOCAB_ROUTES.map((route) => (
                  <div key={route.title} className="rounded-[1.8rem] border border-[#d7c7b6] bg-white/75 p-5 shadow-[0_18px_50px_rgba(95,69,52,0.08)]">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f2dfd4] text-[#9f4d2f]">
                        <route.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-[#241710]">{route.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-[#5e4b40]">{route.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.8rem] border border-[#d7c7b6] bg-[#fffaf5] p-5">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#9f4d2f]">Kho sẵn có</p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  {[
                    { value: VOCAB_STATS.words, label: 'từ vựng' },
                    { value: VOCAB_STATS.packs, label: 'chặng học' },
                    { value: VOCAB_STATS.routes, label: 'lộ trình' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-white px-4 py-5 shadow-[0_10px_25px_rgba(95,69,52,0.06)]">
                      <div className={`${spaceGrotesk.className} text-3xl font-bold tracking-tight text-[#241710]`}>{item.value}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#7b6558]">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="method" className="border-y border-[#d7c7b6]/70 bg-[#fffaf5] px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
              <div className="space-y-6">
                <SectionTag>Phương pháp học</SectionTag>
                <h2 className={`${spaceGrotesk.className} max-w-xl text-4xl font-bold tracking-[-0.05em] text-[#241710] sm:text-5xl`}>
                  Học ít hơn mỗi ngày,
                  {' '}
                  <span className="text-[#b5502f]">nhưng nhớ dai hơn sau nhiều tuần.</span>
                </h2>
                <p className="max-w-xl text-lg leading-8 text-[#5e4b40]">
                  Đây là chỗ LingoPro tránh kiểu học dồn. Mỗi từ có lịch riêng, mỗi chặng vừa đủ ngắn
                  và mỗi lần ôn có tín hiệu rõ ràng để người học quay lại.
                </p>

                <div className="grid gap-4">
                  {[
                    {
                      icon: Repeat2,
                      title: 'Mỗi từ có một nhịp ôn riêng',
                      text: 'Nhớ tốt thì giãn xa. Quên thì quay lại sớm. Không ép tất cả từ đi cùng một lịch.',
                    },
                    {
                      icon: Clock3,
                      title: 'Chặng học ngắn đủ để duy trì',
                      text: 'Khoảng 5-8 phút giúp việc học chen được vào ngày bận, thay vì đòi một khoảng trống hoàn hảo.',
                    },
                    {
                      icon: Bell,
                      title: 'Nhắc ôn đúng lúc thay vì chờ ý chí',
                      text: 'Khi hệ thống lo phần nhớ lịch, người học chỉ còn việc quay lại và hoàn thành chặng.',
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-[1.8rem] border border-[#d7c7b6] bg-white/80 p-5 shadow-[0_18px_45px_rgba(95,69,52,0.08)]">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#241710] text-[#f6efe6]">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-[#241710]">{item.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-[#5e4b40]">{item.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-[#d7c7b6] bg-white p-4 shadow-[0_24px_70px_rgba(95,69,52,0.12)]">
                <video
                  className="aspect-video w-full rounded-[1.6rem] object-cover"
                  src="/student-cases.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label="So sánh các kiểu học sinh khi ôn từ"
                />
                <div className="mt-4 rounded-[1.5rem] bg-[#241710] p-5 text-[#f6efe6]">
                  <div className="text-xs font-black uppercase tracking-[0.24em] text-[#cbb7a6]">Ý chính cần chốt</div>
                  <p className="mt-2 text-lg font-black">
                    Học sinh không cần thêm nhiều nội dung ngay lập tức.
                    Họ cần một vòng lặp đủ nhẹ để không bỏ ngang sau 3 ngày đầu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <SectionTag>Người dùng nói gì</SectionTag>
              <h2 className={`${spaceGrotesk.className} mt-5 text-4xl font-bold tracking-[-0.05em] text-[#241710] sm:text-5xl`}>
                Người học không cần thêm một công cụ phức tạp.
                {' '}
                <span className="text-[#b5502f]">Họ cần một cách học dễ quay lại mỗi ngày.</span>
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {TESTIMONIALS.map((item) => (
                <div key={item.name} className="rounded-[1.9rem] border border-[#d7c7b6] bg-white p-6 shadow-[0_18px_50px_rgba(95,69,52,0.08)]">
                  <div className="flex gap-1 text-[#d39b29]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-5 text-base leading-8 text-[#4f3f35]">“{item.text}”</p>
                  <div className="mt-6 border-t border-[#eadfd0] pt-4">
                    <div className="font-black text-[#241710]">{item.name}</div>
                    <div className="text-sm font-semibold text-[#7b6558]">{item.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#d7c7b6]/70 bg-[#fffaf5] px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <SectionTag>So sánh thẳng</SectionTag>
              <h2 className={`${spaceGrotesk.className} mt-5 text-4xl font-bold tracking-[-0.05em] text-[#241710] sm:text-5xl`}>
                LingoPro không thay Anki cho mọi người.
                {' '}
                <span className="text-[#b5502f]">Nó hợp hơn với người muốn vào học ngay, không phải tự dựng hệ thống.</span>
              </h2>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-[#d7c7b6] bg-white shadow-[0_22px_60px_rgba(95,69,52,0.10)]">
              <div className="grid grid-cols-[1fr_1.15fr_1.15fr] bg-[#241710] text-sm font-black text-[#f6efe6]">
                <div className="p-4">Tiêu chí</div>
                <div className="p-4 text-[#f1c46d]">LingoPro</div>
                <div className="p-4 text-[#d5c1b4]">Anki</div>
              </div>
              {COMPARE_ROWS.map((row, index) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-[1fr_1.15fr_1.15fr] text-sm ${
                    index % 2 === 0 ? 'bg-white' : 'bg-[#fff9f3]'
                  }`}
                >
                  <div className="border-t border-[#eadfd0] p-4 font-black text-[#241710]">{row.label}</div>
                  <div className="border-t border-[#eadfd0] bg-[#f9eee8] p-4 text-[#4f3f35]">
                    <div className="flex items-start gap-2">
                      {row.lingoWin ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2d7f5e]" />
                      ) : (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7b6558]" />
                      )}
                      <span>{row.lingo}</span>
                    </div>
                  </div>
                  <div className="border-t border-[#eadfd0] p-4 text-[#6d574a]">
                    <div className="flex items-start gap-2">
                      {row.lingoWin ? (
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-[#b5502f]" />
                      ) : (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2d7f5e]" />
                      )}
                      <span>{row.anki}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <SectionTag>Gói học</SectionTag>
              <h2 className={`${spaceGrotesk.className} mt-5 text-4xl font-bold tracking-[-0.05em] text-[#241710] sm:text-5xl`}>
                Bắt đầu miễn phí.
                {' '}
                <span className="text-[#b5502f]">Nâng cấp khi bạn muốn học không giới hạn.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#5e4b40]">
                Bạn có thể bắt đầu miễn phí để xem cách học có hợp mình không.
                Khi cần tra sâu hơn, luyện nhiều hơn và bỏ giới hạn, lên Pro.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="rounded-[2rem] border border-[#d7c7b6] bg-white p-8 shadow-[0_18px_55px_rgba(95,69,52,0.08)]">
                <div className="text-sm font-black uppercase tracking-[0.24em] text-[#7b6558]">{PLAN_LABELS.free}</div>
                <div className={`${spaceGrotesk.className} mt-3 text-5xl font-bold tracking-tight text-[#241710]`}>0₫</div>
                <p className="mt-2 text-sm font-semibold text-[#7b6558]">Đủ để tra từ, lưu từ và ôn tập cơ bản mỗi ngày.</p>

                <ul className="mt-8 space-y-3 text-sm font-semibold text-[#4f3f35]">
                  {[
                    'Flashcard và ôn tập theo FSRS',
                    'Lộ trình từ vựng sẵn có',
                    'Ngữ pháp có hệ thống',
                    'Tra từ AI giới hạn 5 lượt/ngày',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2d7f5e]" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-[#d7c7b6] bg-[#fffaf5] px-6 py-3.5 text-sm font-black text-[#241710] transition-colors hover:bg-white"
                >
                  Dùng thử miễn phí
                </Link>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] border border-[#b5502f]/20 bg-[#241710] p-8 text-[#f6efe6] shadow-[0_30px_90px_rgba(36,23,16,0.22)]">
                <div className="absolute right-[-3rem] top-[-3rem] h-40 w-40 rounded-full bg-[#b5502f]/20 blur-3xl" />
                <div className="absolute bottom-[-4rem] left-[-2rem] h-40 w-40 rounded-full bg-[#d7bb76]/15 blur-3xl" />

                <div className="relative">
                  <div className="inline-flex rounded-full bg-[#d7bb76] px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-[#241710]">
                    Phù hợp nhất
                  </div>
                  <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <div className="text-sm font-black uppercase tracking-[0.24em] text-[#cbb7a6]">{PLAN_LABELS.pro}</div>
                      <div className={`${spaceGrotesk.className} mt-2 text-5xl font-bold tracking-tight`}>
                        {formatVND(PLAN_PRICES.pro)}
                        <span className="ml-2 text-base font-semibold text-[#cbb7a6]">/tháng</span>
                      </div>
                    </div>
                    <div className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-[#d8c9bc]">
                      Hoặc
                      {' '}
                      <span className="font-black text-white">{formatVND(PLAN_ANNUAL_PRICES.pro)}/năm</span>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {[
                      'Tra từ AI không giới hạn',
                      'Luyện nói và viết với AI',
                      'Ngữ pháp + quiz + điền từ đầy đủ',
                      'Báo cáo tiến độ và leaderboard',
                    ].map((item) => (
                      <div key={item} className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 text-sm font-semibold text-[#f2e7df]">
                        <div className="flex items-start gap-3">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d7bb76]" />
                          {item}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 rounded-[1.7rem] border border-white/10 bg-[#f6efe6] p-5 text-[#241710]">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-[#9f4d2f]">Điểm khác biệt lớn nhất</div>
                    <p className="mt-2 text-base font-bold">
                      Pro giúp bạn học liền mạch hơn: tra sâu hơn, luyện nhiều hơn và không bị dừng lại giữa chừng.
                    </p>
                  </div>

                  <Link
                    href="/upgrade"
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#b5502f] px-6 py-4 text-base font-black text-white shadow-[0_16px_40px_rgba(181,80,47,0.32)] transition-transform hover:-translate-y-0.5"
                  >
                    Xem trang nâng cấp mẫu
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-28 pt-8 sm:px-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.4rem] border border-[#d7c7b6] bg-[#241710] px-6 py-10 text-[#f6efe6] shadow-[0_30px_90px_rgba(36,23,16,0.20)] sm:px-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-[#cbb7a6]">Bắt đầu hôm nay</div>
                <h2 className={`${spaceGrotesk.className} mt-3 max-w-3xl text-4xl font-bold tracking-[-0.05em] sm:text-5xl`}>
                  Không cần chờ đến lúc có động lực hoàn hảo.
                  {' '}
                  <span className="text-[#f1c46d]">Chỉ cần một từ lạ đầu tiên là đủ để bắt đầu.</span>
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-[#d8c9bc]">
                  Không cần thẻ tín dụng. Không cần cài đặt phức tạp. Tạo tài khoản miễn phí và để việc ôn tập chạy tiếp từ đó.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f6efe6] px-6 py-3.5 text-sm font-black text-[#241710] transition-colors hover:bg-white"
                >
                  Tạo tài khoản
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/for-teachers"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3.5 text-sm font-black text-[#f6efe6] transition-colors hover:bg-white/5"
                >
                  Xem bản cho giáo viên
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d7c7b6]/70 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-[#6d574a] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#241710] text-[#f6efe6]">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <div className={`${spaceGrotesk.className} font-bold text-[#241710]`}>LingoPro</div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em]">Học bớt rối, nhớ lâu hơn</div>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 font-semibold">
            <Link href="/download" className="transition-colors hover:text-[#241710]">Desktop</Link>
            <Link href="/for-teachers" className="transition-colors hover:text-[#241710]">Giáo viên</Link>
            <Link href="/auth" className="transition-colors hover:text-[#241710]">Đăng nhập</Link>
            <Link href="/privacy" className="transition-colors hover:text-[#241710]">Bảo mật</Link>
            <Link href="/terms" className="transition-colors hover:text-[#241710]">Điều khoản</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
